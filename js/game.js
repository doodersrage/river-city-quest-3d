"use strict";
/* River City Quest 3D: the game itself, with no drawing in it, so tests can play it headless. */
const CYC=36000,FPS=60,PR=.42;
let st=null,lv=null,p=null,cam=null,mode='title',dlg=null,menu=null,trans=null,toastMsg='',toastT=0,banner='',bannerT=0,frame=0,shake=0,flash=0,endT=0;
let birds=[],npcs=[],enemies=[],picks=[],bombs=[],parts=[],chests=[],chal=null,boss=null,needSave=false,titleSel=0,deathT=0;
const inp={x:0,z:0,a:0,b:0,item:0,menu:0,camX:0,up:0,down:0,left:0,right:0,start:0};
function newState(){return{coins:0,hp:6,max:6,items:{},ammo:{powder:0},eq:null,keys:{},got:{},f:{},lore:{},pins:{},vis:{},scene:'ow:2,1',x:15*TS+TS/2,z:9*TS+TS/2,clock:2400,time:0,ret:null};}
function newPlayer(){return{x:0,z:0,y:0,yaw:Math.PI,vx:0,vz:0,swing:0,inv:0,kx:0,kz:0,walk:0,hold:0,holdIc:null,moving:false};}
const hour=()=>(6+(st?st.clock:2400)/CYC*24)%24;
function dark(){if(lv&&lv.room)return .55;const h=hour();return h>=20||h<5?1:h>=17?(h-17)/3:h<7?(7-h)/2:0;}
const fwd=a=>[Math.sin(a),Math.cos(a)];
const ang=(a,b)=>{let d=b-a;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;return d;};
function toast(m){toastMsg=m;toastT=170;}
function tileXZ(x,z){return[Math.floor(x/TS),Math.floor(z/TS)];}
function tAt(x,z){const [tx,tz]=tileXZ(x,z);return tileAt(lv,tx,tz);}
function solidAt(x,z){const c=tAt(x,z);return c!=null&&!walkable(c);}
function blockedCircle(x,z,r){for(const [dx,dz] of [[-r,-r],[r,-r],[-r,r],[r,r],[0,-r],[0,r],[-r,0],[r,0]]){const c=tAt(x+dx,z+dz);if(c!=null&&!walkable(c))return c;}
  for(const pr of lv.props||[])if(pr.solid&&Math.abs(x-pr.x)<pr.solid[0]+r&&Math.abs(z-pr.z)<pr.solid[1]+r)return'car';return null;}
function npcBlock(x,z){for(const n of npcs)if(Math.hypot(n.x-x,n.z-z)<.85)return n;return null;}

/* ---------- loading a place ---------- */
function loadScene(id,x,z,yaw){
  lv=LEVELS[id]=buildLevel(id);st.scene=id;st.vis[id]=1;
  // bring back what you've already changed here
  for(const o of lv.dyn){if(o.kind!='bush'&&st.f[dynKey(o)])removeDyn(o,true);}
  st.spawn=[id,x,z];
  npcs=(lv.d.npcs||[]).map((n,i)=>({...n,x:n.tx*TS+TS/2,z:n.ty*TS+TS/2,hx:n.tx*TS+TS/2,hz:n.ty*TS+TS/2,yaw:0,t:hash(i,n.tx,n.ty)%200,walk:0,i,wander:n.talk=='folk'}));
  enemies=[];picks=[];bombs=[];parts=[];boss=null;
  birds=[];if(!lv.room)(lv.d.birds||[]).forEach(([bx,by],i)=>{for(let k=0;k<3+i%2;k++){const hx=bx*TS+TS/2+(k-1)*.6,hz=by*TS+TS/2+((k*7)%3-1)*.5;birds.push({hx,hz,x:hx,z:hz,y:0,yaw:k*2.1,t:k*37,state:'peck',vx:0,vy:0,vz:0,flap:0});}});
  const cleared=st.f['clr:'+id];
  if(!cleared||!lv.room)for(const [t,x0,y0] of lv.d.en){if(t=='turtle'&&st.f['boss:'+id])continue;const e=mkEnemy(t,x0*TS+TS/2,y0*TS+TS/2);enemies.push(e);if(t=='turtle')boss=e;}
  if(!lv.room&&dark()>.6)for(let i=0;i<2;i++){const s=freeSpot(16);if(s){const e=mkEnemy('ghost',s[0],s[1]);e.night=1;enemies.push(e);}}
  chests=(lv.d.chests||[]).map(c=>({...c,x:c.tx*TS+TS/2,z:c.ty*TS+TS/2,open:!!st.f['c:'+c.id],lid:st.f['c:'+c.id]?1:0}));
  for(const c of chests)if(chestVisible(c))lv.g[c.ty][c.tx]='c';
  if(lv.d.bossT&&st.f['boss:'+id]){lv.g[8][7]=lv.g[8][8]='E';}
  if(id=='ow:3,0')for(const L of lv.lamps)L.lit=!!st.pins.lamps;else for(const L of lv.lamps)L.lit=true;
  p.x=x;p.z=z;if(yaw!=null)p.yaw=yaw;p.vx=p.vz=0;settle();
  cam.yaw=lv.room?0:p.yaw+Math.PI;cam.snap=true;
  if(chal&&chal.scene!=id){chalClear();chal=null;toast('Challenge abandoned.');}
  banner=lv.name;bannerT=150;needSave=true;
  if(typeof onSceneLoaded=='function')onSceneLoaded();}
function freeSpot(minD){for(let k=0;k<80;k++){const tx=1+Math.floor(Math.random()*(lv.w-2)),tz=1+Math.floor(Math.random()*(lv.h-2));const x=tx*TS+TS/2,z=tz*TS+TS/2;
  if(walkable(tileAt(lv,tx,tz))&&Math.hypot(x-p.x,z-p.z)>minD)return[x,z];}return null;}
function settle(){if(!blockedCircle(p.x,p.z,PR))return;let best=null,bd=1e9;
  for(let tz=0;tz<lv.h;tz++)for(let tx=0;tx<lv.w;tx++){if(!walkable(tileAt(lv,tx,tz)))continue;const x=tx*TS+TS/2,z=tz*TS+TS/2,d=Math.hypot(x-p.x,z-p.z);if(d<bd&&!blockedCircle(x,z,PR)){bd=d;best=[x,z];}}
  if(best){p.x=best[0];p.z=best[1];}}
function dynKey(o){return o.link?'link:'+o.link:'dyn:'+lv.id+':'+o.tx+','+o.ty;}
function removeDyn(o,silent){o.on=false;for(const [x,y] of o.cells||[[o.tx,o.ty]])lv.g[y][x]=o.under;if(!silent&&o.kind!='bush'){st.f[dynKey(o)]=1;needSave=true;}}

/* ---------- starting ---------- */
function startGame(fromSave){st=fromSave?Object.assign(newState(),fromSave):newState();p=newPlayer();cam={yaw:0,pitch:.5,dist:8,x:0,y:0,z:0,manual:0};p.hp=st.hp=st.max;
  loadScene(st.scene,st.x,st.z,Math.PI);mode='play';
  if(!fromSave)say(['A cold fog has rolled up off the James, and the gas lamps of Richmond are going dark, block by block.','The archivist by the Capitol wants a word. Walk up and press A to talk.']);}
function saveGame(){if(!st)return;st.x=p.x;st.z=p.z;st.hp=p.hp;try{localStorage.setItem('rcq3d-save',JSON.stringify(st));}catch(e){}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem('rcq3d-save')||'null');return s&&RCQ.maps[s.scene]||s&&RCQ.rooms[s.scene]?s:null;}catch(e){return null;}}

/* ---------- dialog ---------- */
function say(lines,cb,who,choices){dlg={lines:lines.slice(),i:0,n:0,cb,who:who||'',choices:choices||null,sel:0};}
function dlgUpdate(){const d=dlg,L=d.lines[d.i];d.n=Math.min(L.length,d.n+2);const last=d.i==d.lines.length-1;
  if(last&&d.choices&&d.n>=L.length){if(inp.up)d.sel=(d.sel+d.choices.length-1)%d.choices.length;if(inp.down)d.sel=(d.sel+1)%d.choices.length;}
  if(inp.a||inp.b&&!d.choices){if(d.n<L.length){d.n=L.length;return;}if(!last){d.i++;d.n=0;sfx('blip');return;}
    const cb=d.cb,sel=d.choices?(inp.b?d.choices.length-1:d.sel):0;dlg=null;sfx('blip');if(cb)cb(sel);}}

/* ---------- the main update ---------- */
function update(){frame++;
  if(toastT>0)toastT--;if(bannerT>0)bannerT--;if(shake>0)shake--;if(flash>0)flash--;
  if(mode=='title'){titleUpdate();return;}
  if(mode=='end'){endT++;if(endT>90&&(inp.a||inp.start)){mode='play';}return;}
  if(trans){transUpdate();return;}
  if(dlg){dlgUpdate();camUpdate();return;}
  if(menu){menuUpdate();return;}
  if(deathT>0){if(--deathT==0){if(chal){chalClear();chal=null;}p.hp=st.max;st.hp=st.max;const s=st.spawn||[st.scene,p.x,p.z];loadScene(s[0],s[1],s[2]);toast('You catch your breath.');}return;}
  if(inp.menu||inp.start){menu={tab:0,sel:0,jc:0,rd:null};sfx('blip');return;}
  st.clock++;st.time++;if(p.inv>0)p.inv--;if(p.hold>0)p.hold--;
  if(chal&&chal.t!=null&&--chal.t<=0)chalFail();
  playerUpdate();enemiesUpdate();npcUpdate();birdsUpdate();picksUpdate();bombsUpdate();partsUpdate();camUpdate();
  if(needSave&&frame%30==0){saveGame();needSave=false;}}

function playerUpdate(){
  if(p.bumpT>0)p.bumpT--;if(p.lockT>0)p.lockT--;
  if(p.hold>0){p.vx=p.vz=0;return;}
  const cy=cam.yaw,fx=-Math.sin(cy),fz=-Math.cos(cy),rx=Math.cos(cy),rz=-Math.sin(cy);
  let mx=inp.x*rx+(-inp.z)*fx,mz=inp.x*rz+(-inp.z)*fz;const ml=Math.hypot(mx,mz);
  const sp=(p.swing>0?.035:.095)*TS;p.moving=ml>.15;
  if(p.moving){mx/=Math.max(1,ml);mz/=Math.max(1,ml);p.yaw+=ang(p.yaw,Math.atan2(mx,mz))*.35;p.walk+=ml*.22;}
  let dx=(p.moving?mx*sp:0)+p.kx,dz=(p.moving?mz*sp:0)+p.kz;p.kx*=.8;p.kz*=.8;
  const bx=!blockedCircle(p.x+dx,p.z,PR)&&!npcBlock(p.x+dx,p.z),bz=!blockedCircle(p.x,p.z+dz,PR)&&!npcBlock(p.x,p.z+dz);
  const hitX=bx?null:blockedCircle(p.x+dx,p.z,PR),hitZ=bz?null:blockedCircle(p.x,p.z+dz,PR);
  if(bx)p.x+=dx;if(bz)p.z+=dz;
  if(p.moving&&(hitX||hitZ))bump(p.x+(hitX?dx*3:0),p.z+(hitZ?dz*3:0));
  // screen edges lead to the next neighborhood or room
  const W=lv.w*TS,H=lv.h*TS;let ex=0,ez=0;if(p.x<.3)ex=-1;else if(p.x>W-.3)ex=1;else if(p.z<.3)ez=-1;else if(p.z>H-.3)ez=1;
  if(ex||ez)edgeExit(ex,ez);
  if(tAt(p.x,p.z)=='E'&&st.ret){const r=st.ret;st.ret=null;startTrans(r[0],r[1],r[2],0);}
  // A: talk, read, open, or swing
  if(p.swing>0){p.swing--;if(p.swing>=8&&p.swing<=13)swingHits();}
  if(inp.a&&p.swing<6&&!interact()&&p.swing==0){p.swing=18;sfx('swing');}
  if(inp.b)useItem();
  if(inp.item)cycleItem();}
function front(d){const f=fwd(p.yaw);return[p.x+f[0]*(d||1.4),p.z+f[1]*(d||1.4)];}
function interact(){
  // people first: whoever is close and roughly in front
  let best=null,bd=1e9;for(const n of npcs){const d=Math.hypot(n.x-p.x,n.z-p.z),a=Math.abs(ang(p.yaw,Math.atan2(n.x-p.x,n.z-p.z)));if(d<2.1&&a<1.3&&d<bd){bd=d;best=n;}}
  if(best){best.yaw=Math.atan2(p.x-best.x,p.z-best.z);best.look=180;talkTo(best);return true;}
  for(const d of [1.2,2]){const [fx,fz]=front(d),[tx,tz]=tileXZ(fx,fz),c=tileAt(lv,tx,tz),k=tx+','+tz;
    const ch=chests.find(q=>q.tx==tx&&q.ty==tz);
    if(ch&&!ch.open&&chestVisible(ch)){openChest(ch);return true;}
    if((c=='M'||c=='Y')&&lv.markers[k]){readMarker(lv.markers[k]);return true;}
    if(c=='D'){enterDoor(tx,tz);return true;}}
  return false;}
function bump(x,z){const [tx,tz]=tileXZ(x,z),c=tileAt(lv,tx,tz);
  if(c=='D'&&!(p.bumpT>0)){p.bumpT=40;enterDoor(tx,tz);}
  if(c=='L'){const o=lv.dyn.find(o=>o.kind=='lock'&&o.on&&(o.cells||[]).some(([a,b])=>a==tx&&b==tz));if(o){const ar=lv.id.split(':')[0];
    if((st.keys[ar]||0)>0){st.keys[ar]--;removeDyn(o);sfx('door');toast('The small key turns. The door swings open.');burst(tx*TS+TS/2,1.5,tz*TS+TS/2,10,'#d8a830');}
    else if(!p.lockT){p.lockT=60;toast('Locked. A small key would open it.');sfx('no');}}}
}
function edgeExit(ex,ez){const [a,c]=lv.id.split(':'),[ax,ay]=c.split(',').map(Number),nid=a+':'+(ax+ex)+','+(ay+ez);
  const W=lv.w*TS,H=lv.h*TS;
  if(sceneData(nid)){const nd=sceneData(nid),NW=nd.w*TS,NH=nd.h*TS;let nx=p.x,nz=p.z;if(ex<0)nx=NW-.8;if(ex>0)nx=.8;if(ez<0)nz=NH-.8;if(ez>0)nz=.8;startTrans(nid,nx,nz,p.yaw);return;}
  p.x=Math.max(.6,Math.min(W-.6,p.x));p.z=Math.max(.6,Math.min(H-.6,p.z));
  if(!p.edgeT||frame-p.edgeT>200){p.edgeT=frame;const nm=RCQ.names[nid];toast(nm?nm+' is that way. It\'s coming in a future update.':'The fog is too thick to go any farther that way.');}}
function startTrans(id,x,z,yaw){trans={t:0,id,x,z,yaw,done:false};sfx('whoosh');}
function transUpdate(){trans.t++;if(trans.t==18&&!trans.done){trans.done=true;loadScene(trans.id,trans.x,trans.z,trans.yaw);}if(trans.t>=36)trans=null;}
function enterDoor(tx,tz){const dr=(lv.doors||[]).find(d=>d.tx==tx&&d.ty==tz);if(!dr)return;
  if(RCQ.rooms[dr.to]){const fd=faceDir(lv,tx,tz);st.ret=[lv.id,(tx+fd[0])*TS+TS/2,(tz+fd[1])*TS+TS/2];const r=RCQ.rooms[dr.to];sfx('door');startTrans(dr.to,8*TS,8.6*TS,Math.PI);return;}
  if(dr.need=='keystones'){say(['The tunnel mouth is sealed. Four hollows in the stone wait for keystones. You have '+nKeys()+'.']);return;}
  say(['The door is shut tight. Something says you\'ll get in once more of Richmond is built.'],null,lv.name);}
const nKeys=()=>['granite','iron','brick','bronze'].filter(k=>st.got[k]).length;

/* ---------- reading the city ---------- */
function readMarker(id){const L=RCQ.lore[id];if(!L)return;sfx('blip');const first=!st.lore[id];st.lore[id]=1;needSave=true;
  say(wrapPages(L.s),()=>{if(first)toast('Journal: '+L.t);},L.t);}
function wrapPages(s){const words=s.split(' '),pages=[];let cur='';for(const w of words){if((cur+' '+w).trim().length>150){pages.push(cur.trim());cur=w;}else cur+=' '+w;}if(cur.trim())pages.push(cur.trim());return pages;}

/* ---------- chests, items ---------- */
function chestVisible(c){if(!c.appear)return true;return lv.room?!!st.f['clr:'+lv.id]||!enemies.some(e=>!e.dead):true;}
function openChest(c){c.open=true;st.f['c:'+c.id]=1;needSave=true;sfx('chest');p.hold=70;const L=give(c.item);p.holdIc=c.item;say(L,null,'');}
function give(code){
  switch(code){
    case'key':{const ar=lv.id.split(':')[0];st.keys[ar]=(st.keys[ar]||0)+1;return['You got a small key!','It opens one locked door in this place.'];}
    case'coins20':st.coins+=20;return['Twenty coins!'];
    case'coins50':st.coins=Math.min(999,st.coins+50);return['A hidden stash of fifty coins!'];
    case'powder':st.items.powder=1;st.ammo.powder=Math.max(st.ammo.powder,8);st.eq='powder';return['You got the Blasting Powder!','Press B to set down a keg. Cracked walls and rubble give way.','Switch between items with the ITEM button.'];
    case'lantern':st.items.lantern=1;st.eq=st.eq||'lantern';return['You got the Gas Lantern!','Press B to raise it. It lights lamps and braziers, and it lights your way after dark.'];
    case'granite':st.got.granite=1;return['You got the Granite Keystone!','Cut from the same stone as the quarry walls. One of four.'];
    case'piece':st.max+=2;p.hp=st.max;return['A heart charm! Your hearts grew by one.'];
  }return[];}
function cycleItem(){const own=['lantern','powder'].filter(k=>st.items[k]);if(!own.length){toast('No items yet.');return;}const i=own.indexOf(st.eq);st.eq=own[(i+1)%own.length];sfx('blip');toast(st.eq=='lantern'?'Gas Lantern':'Blasting Powder ('+st.ammo.powder+')');}
function useItem(){if(!st.eq){toast('Nothing on B yet.');return;}
  if(st.eq=='lantern'){p.raise=40;sfx('lantern');const [fx,fz]=front(1.6);
    for(const L of lv.lamps){const x=L.tx*TS+TS/2,z=L.ty*TS+TS/2;if(Math.hypot(x-p.x,z-p.z)<2.8&&!L.lit){
      if(lv.id=='ow:3,0'&&!(chal&&chal.id=='lamps')&&!st.pins.lamps){toast('The wick won\'t take. The lamplighter knows the trick.');return;}
      L.lit=true;sfx('light');burst(x,3,z,12,'#fff2a8');if(chal&&chal.id=='lamps'){chal.got++;if(chal.got>=chal.need)chalWin();else toast('Lamp lit! ('+chal.got+'/'+chal.need+')');}return;}}
    return;}
  if(st.eq=='powder'){if(st.ammo.powder<=0){toast('Out of powder.');sfx('no');return;}if(bombs.length>=2)return;st.ammo.powder--;const [fx,fz]=front(1.1);
    bombs.push({x:fx,z:fz,t:110});sfx('drop');}}

/* ---------- combat ---------- */
const EDEF={rat:{hp:1,sp:.06,r:.5,dmg:1},bat:{hp:1,sp:.055,r:.45,dmg:1,fly:1},goose:{hp:2,sp:.05,r:.6,dmg:1},crab:{hp:2,sp:.04,r:.6,dmg:1},ghost:{hp:2,sp:.035,r:.6,dmg:2,fly:1},turtle:{hp:6,sp:.04,r:1.5,dmg:2}};
function mkEnemy(t,x,z){const d=EDEF[t]||EDEF.rat;return{type:t,x,z,y:d.fly?1.4:0,hx:x,hz:z,hp:d.hp,max:d.hp,yaw:Math.random()*6,t:Math.floor(Math.random()*120),kx:0,kz:0,flash:0,state:'idle',st:0,dead:false};}
function enemiesUpdate(){
  for(const e of enemies){if(e.dead)continue;const d=EDEF[e.type];e.t++;if(e.flash>0)e.flash--;
    if(e.type=='turtle'){bossUpdate(e);continue;}
    const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz);let mx=0,mz=0;
    if(dist<9){const a=Math.atan2(dx,dz);e.yaw+=ang(e.yaw,a)*.15;
      if(e.type=='crab'){const side=Math.sin(e.t*.04)>0?1:-1;mx=Math.cos(a)*side*.6+dx/dist*.4;mz=-Math.sin(a)*side*.6+dz/dist*.4;}
      else if(e.type=='goose'){if(e.t%150<50){mx=0;mz=0;}else{mx=dx/dist*1.6;mz=dz/dist*1.6;}}
      else{mx=dx/dist;mz=dz/dist;}}
    else if(e.t%180<60){mx=Math.sin(e.t*.05+e.hx);mz=Math.cos(e.t*.05+e.hz);e.yaw=Math.atan2(mx,mz);}
    const sp=d.sp*TS;let nx=e.x+mx*sp+e.kx,nz=e.z+mz*sp+e.kz;e.kx*=.82;e.kz*=.82;
    if(d.fly){e.x=nx;e.z=nz;e.y=1.3+Math.sin(e.t*.12)*.4;}else{if(!blockedCircle(nx,e.z,d.r*.7))e.x=nx;if(!blockedCircle(e.x,nz,d.r*.7))e.z=nz;}
    e.x=Math.max(.5,Math.min(lv.w*TS-.5,e.x));e.z=Math.max(.5,Math.min(lv.h*TS-.5,e.z));
    if(dist<d.r+.45&&p.inv==0)hurtPlayer(d.dmg,e.x,e.z);}
  const before=enemies.length;enemies=enemies.filter(e=>!e.dead||e.fade>0&&e.fade--);
  if(lv.room&&lv.d.en.length&&!enemies.some(e=>!e.dead)&&!st.f['clr:'+lv.id]){st.f['clr:'+lv.id]=1;needSave=true;
    if(chests.some(c=>c.appear&&!c.open)){sfx('secret');toast('A chest appeared!');for(const c of chests)if(c.appear){lv.g[c.ty][c.tx]='c';burst(c.x,.8,c.z,14,'#fff2a8');}}}}
function hurtPlayer(dmg,fx,fz){p.hp-=dmg;p.inv=70;const l=Math.hypot(p.x-fx,p.z-fz)||1;p.kx=(p.x-fx)/l*.35;p.kz=(p.z-fz)/l*.35;shake=8;sfx('hurt');vibrate(40);
  if(p.hp<=0){p.hp=0;deathT=90;sfx('die');}}
function swingHits(){const f=fwd(p.yaw),dmg=1;
  for(const e of enemies){if(e.dead||e.flash>0)continue;const dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz),r=EDEF[e.type].r;if(d>2.1+r*.6)continue;
    if(Math.abs(ang(p.yaw,Math.atan2(dx,dz)))>1.25&&d>r+.3)continue;hitEnemy(e,dmg,dx/(d||1),dz/(d||1));}
  // bushes in reach
  for(const o of lv.dyn){if(o.kind!='bush'||!o.on)continue;const x=o.tx*TS+TS/2,z=o.ty*TS+TS/2,d=Math.hypot(x-p.x,z-p.z);
    if(d<2.4&&Math.abs(ang(p.yaw,Math.atan2(x-p.x,z-p.z)))<1.1){removeDyn(o);burst(x,.8,z,10,'#4e9a44');sfx('cut');const r=Math.random();if(r<.25)picks.push(mkPick('coin',x,z));else if(r<.35)picks.push(mkPick('heart',x,z));}}}
function hitEnemy(e,dmg,nx,nz){if(e.type=='turtle'){bossHit(e,dmg,nx,nz);return;}e.hp-=dmg;e.flash=14;e.kx=nx*.5;e.kz=nz*.5;sfx('hit');
  if(e.hp<=0){e.dead=true;e.fade=0;burst(e.x,e.y+.5,e.z,12,'#ffffff');sfx('poof');if(e.night)st.nightKills=(st.nightKills||0)+1;
    if(chal&&chal.type=='defeat'&&e.chal){chal.got++;if(chal.got>=chal.need)chalWin();}
    const r=Math.random();if(r<.35)picks.push(mkPick('coin',e.x,e.z));else if(r<.5)picks.push(mkPick('heart',e.x,e.z));}}

/* ---------- Old Snapper, the quarry boss ---------- */
function bossUpdate(e){e.st++;const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz);
  if(e.state=='idle'){if(e.st>60||dist<10){e.state='walk';e.st=0;}}
  else if(e.state=='walk'){e.yaw+=ang(e.yaw,Math.atan2(dx,dz))*.05;const f=fwd(e.yaw),s=.025*TS;const nx=e.x+f[0]*s,nz=e.z+f[1]*s;if(!blockedCircle(nx,nz,1.2)){e.x=nx;e.z=nz;}
    if(e.st>110){e.state='wind';e.st=0;sfx('growl');}}
  else if(e.state=='wind'){e.yaw+=ang(e.yaw,Math.atan2(dx,dz))*.12;if(e.st>40){e.state='charge';e.st=0;}}
  else if(e.state=='charge'){const f=fwd(e.yaw),s=.17*TS,nx=e.x+f[0]*s,nz=e.z+f[1]*s;
    if(blockedCircle(nx,nz,1.3)||e.st>90){e.state='stun';e.st=0;shake=16;sfx('boom');burst(e.x+f[0]*1.5,.5,e.z+f[1]*1.5,16,'#9a9aa4');}else{e.x=nx;e.z=nz;}}
  else if(e.state=='stun'){if(e.st>150){e.state='walk';e.st=0;}}
  if(e.state!='stun'&&dist<2.2&&p.inv==0)hurtPlayer(EDEF.turtle.dmg,e.x,e.z);}
function bossHit(e,dmg,nx,nz){if(e.state!='stun'){sfx('clank');e.flash=6;p.kx=-nx*.4;p.kz=-nz*.4;if(!st.f.clankTip){st.f.clankTip=1;toast('Your paddle bounces off the shell! Make it charge into a wall.');}return;}
  e.hp-=dmg;e.flash=16;sfx('hit');shake=6;if(e.hp<=0)bossDie(e);}
function bossDie(e){e.dead=true;e.fade=40;st.f['boss:'+lv.id]=1;needSave=true;sfx('fanfare');burst(e.x,1,e.z,30,'#ffffff');
  say(['Old Snapper sinks back into the deep water with a long, slow sigh.','Something gray and heavy glints where it was sitting.'],null,'');
  picks.push(mkPick('keystone',e.x,e.z));lv.g[8][7]=lv.g[8][8]='E';}

/* ---------- bombs ---------- */
function bombsUpdate(){for(const b of bombs){b.t--;if(b.t<=0){explode(b.x,b.z);b.done=1;}}bombs=bombs.filter(b=>!b.done);}
function explode(x,z){sfx('boom');shake=14;flash=6;burst(x,1,z,26,'#f8a030');burst(x,1,z,16,'#5a5662');
  for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.z-z);if(d<3.2){if(e.type=='turtle'){if(e.state!='stun'){e.state='stun';e.st=0;sfx('clank');}else bossHit(e,2,0,0);}else hitEnemy(e,2,(e.x-x)/(d||1),(e.z-z)/(d||1));}}
  if(Math.hypot(p.x-x,p.z-z)<2.2&&p.inv==0)hurtPlayer(1,x,z);
  for(const o of lv.dyn){if(!o.on)continue;const cells=o.cells||[[o.tx,o.ty]];if(cells.some(([a,b])=>Math.hypot(a*TS+TS/2-x,b*TS+TS/2-z)<3.4)){
    if(o.kind=='rubble'||o.kind=='crack'){removeDyn(o);sfx('secret');toast(o.kind=='crack'?'The cracked wall gives way!':'The rubble blows apart!');}else if(o.kind=='bush')removeDyn(o);}}}

/* ---------- pickups and particles ---------- */
function mkPick(kind,x,z){return{kind,x,z,y:.5,vy:.12,t:0,life:kind=='keystone'?1e9:600};}
function picksUpdate(){for(const k of picks){k.t++;k.life--;k.vy-=.012;k.y=Math.max(.5,k.y+k.vy);const d=Math.hypot(k.x-p.x,k.z-p.z);
    if(d<1.1&&k.t>10){k.got=1;collect(k);}}picks=picks.filter(k=>!k.got&&k.life>0);}
function collect(k){switch(k.kind){
  case'coin':st.coins=Math.min(999,st.coins+1);sfx('coin');break;
  case'heart':p.hp=Math.min(st.max,p.hp+2);sfx('heart');break;
  case'trash':sfx('coin');if(chal&&chal.type=='collect'){chal.got++;if(chal.got>=chal.need)chalWin();else toast('Trash picked up ('+chal.got+'/'+chal.need+')');}break;
  case'keystone':p.hold=90;p.holdIc='keystone';say(give('granite').concat(['The way out has opened. Take it back to the archivist at the Capitol.']),null,'');sfx('fanfare');needSave=true;break;}
  needSave=true;}
function burst(x,y,z,n,c){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=.05+Math.random()*.12;parts.push({x,y,z,vx:Math.cos(a)*v,vy:.05+Math.random()*.15,vz:Math.sin(a)*v,life:30+Math.random()*20|0,c});}}
function partsUpdate(){for(const q of parts){q.x+=q.vx;q.y+=q.vy;q.z+=q.vz;q.vy-=.008;q.life--;}parts=parts.filter(q=>q.life>0);}

/* ---------- pigeons: they peck about and scatter when you come close ---------- */
function birdsUpdate(){for(const b of birds){b.t++;
  if(b.state=='peck'){if(b.t%90==0){b.yaw+=(Math.random()-.5)*2;}if(b.t%140==70){const nx=b.x+Math.sin(b.yaw)*.4,nz=b.z+Math.cos(b.yaw)*.4;if(Math.hypot(nx-b.hx,nz-b.hz)<1.6&&!blockedCircle(nx,nz,.15)){b.x=nx;b.z=nz;}}
    if(Math.hypot(p.x-b.x,p.z-b.z)<3.4||p.swing>0&&Math.hypot(p.x-b.x,p.z-b.z)<5){b.state='fly';const a=Math.atan2(b.x-p.x,b.z-p.z)+(Math.random()-.5)*.8;b.vx=Math.sin(a)*.12;b.vz=Math.cos(a)*.12;b.vy=.09+Math.random()*.04;b.yaw=a;if(!birds.some(q=>q.state=='fly'&&q!==b&&q.t<5))sfx('flap');b.t=0;}}
  else if(b.state=='fly'){b.x+=b.vx;b.z+=b.vz;b.y+=b.vy;b.vy=Math.min(.16,b.vy+.001);b.flap+=.6;if(b.y>16){b.state='gone';b.t=0;}}
  else if(b.state=='gone'&&b.t>900&&Math.hypot(p.x-b.hx,p.z-b.hz)>10){b.state='peck';b.x=b.hx;b.z=b.hz;b.y=0;b.t=0;}}}
/* ---------- townspeople ---------- */
function npcUpdate(){for(const n of npcs){n.t++;if(n.look>0){n.look--;continue;}
  if(n.wander){const tx=n.hx+Math.sin(n.t*.006+n.i)*2.2,tz=n.hz+Math.cos(n.t*.0045+n.i*2)*1.6,dx=tx-n.x,dz=tz-n.z,l=Math.hypot(dx,dz);
    if(l>.1){const nx=n.x+dx/l*.03,nz=n.z+dz/l*.03;if(!blockedCircle(nx,nz,.4)&&Math.hypot(nx-p.x,nz-p.z)>1){n.x=nx;n.z=nz;n.walk+=.12;n.yaw+=ang(n.yaw,Math.atan2(dx,dz))*.1;}}}
  else{n.yaw+=ang(n.yaw,Math.hypot(p.x-n.x,p.z-n.z)<6?Math.atan2(p.x-n.x,p.z-n.z):0)*.05;}}}
const TALK3={
  archivist(n){
    if(!st.items.lantern){say(['You came! I\'m the city archivist. Something is very wrong in Richmond.','This fog came up off the James the same night the gas lamps on Church Hill went out. Now they\'re going dark all over town.',
      'The old Church Hill Tunnel is sealed with four keystones. Whatever is down there, the fog comes from it.','The first keystone is granite, from the old quarry on Belle Isle. Head south across the footbridge.','Take my lantern. You\'ll need the light.'],
      ()=>{const L=give('lantern');p.hold=70;p.holdIc='lantern';say(L);},n.who);return;}
    if(!st.got.granite){say(['Belle Isle is south of here, across the footbridge under the Lee Bridge.','The quarry door is in the middle of the island. Mind the crabs.'],null,n.who);return;}
    if(!st.f.sliceDone){say(['The granite keystone! You actually found it.','Three more are still out there: iron, brick and bronze. Hollywood Cemetery, Shockoe Bottom, Byrd Park...','But that\'s a story for another day. Rest up, Richmond.'],()=>{st.f.sliceDone=1;needSave=true;mode='end';endT=0;sfx('fanfare');},n.who);return;}
    say(['One keystone down. The rest of Richmond is still being built in this world.','Read the markers around town while you wait. Every one has a story.'],null,n.who);},
  folk(n){n.li=(n.li||0)+1;say([n.lines[(n.li-1)%n.lines.length]],null,n.who);},
  henry(){say(['Is life so dear, or peace so sweet, as to be purchased at the price of chains and slavery?','Patrick Henry said that inside St. John\'s Church in March 1775, ending with "give me liberty, or give me death!"','We act it out on summer Sundays. Come watch sometime.'],null,'Reenactor');},
  racer(){say(['This is the steepest street on Church Hill. Perfect for a soapbox derby!','My car\'s still in the shop. Come back when more of Richmond is finished.'],null,'Derby Kid');},
  kayaker(){say(['The rapids around Belle Isle are no joke. Class IV in spots, right in the middle of the city.','If you\'re headed for the quarry, the door is cut right into the rock in the middle of the island.'],null,'Kayaker');}};
function talkTo(n){if(n.chal){offerChal(n);return;}const f=TALK3[n.talk];if(f)f(n);else if(n.lines)TALK3.folk(n);else say(['Hello there!'],null,n.who);}

/* ---------- neighborhood challenges ---------- */
function offerChal(n){const d=RCQ.chal[n.chal],done=st.pins[n.chal];
  say([d.intro,done?'You\'ve already earned this pin. Go again for a few coins?':'Win and you get a Richmond city pin.'],sel=>{if(sel==0)startChal(n.chal,n);},d.name,['Let\'s go!','Not now']);}
function startChal(id,n){const d=RCQ.chal[id];
  if(d.type=='light'&&!st.items.lantern){say(['You\'ll need a lantern for this one. The archivist by the Capitol has one.'],null,n.who);return;}
  if(d.type=='quiz'){runQuiz(n);return;}
  chal={id,d,type:d.type,t:d.time*60,got:0,need:0,who:n.who,scene:lv.id};
  if(d.type=='collect'){chal.need=lv.spots.length;for(const [x,y] of lv.spots){const k=mkPick('trash',x*TS+TS/2,y*TS+TS/2);k.life=1e9;k.chal=1;picks.push(k);}}
  else if(d.type=='defeat'){chal.need=d.n;for(let i=0;i<d.n;i++){const [x,y]=lv.spots[i%lv.spots.length]||[16,10],e=mkEnemy(d.foe,x*TS+TS/2+(i>=lv.spots.length?1:0),y*TS+TS/2);e.chal=1;enemies.push(e);}}
  else if(d.type=='light'){chal.need=lv.lamps.filter(L=>!L.lit).length;}
  sfx('go');toast(d.name+': go!');}
function chalClear(){picks=picks.filter(k=>!k.chal);enemies=enemies.filter(e=>!e.chal);}
function chalWin(){const c=chal,first=!st.pins[c.id];st.pins[c.id]=1;st.coins=Math.min(999,st.coins+(first?25:10));chalClear();chal=null;needSave=true;sfx('fanfare');
  say([c.d.name+': you did it!',first?'You earned a Richmond city pin and 25 coins.':'Ten coins for another win.'],null,c.who);}
function chalFail(){const c=chal;chalClear();chal=null;sfx('no');if(c.type=='light')for(const L of lv.lamps)L.lit=!!st.pins.lamps;say(['Time\'s up!','Talk to the '+c.who.toLowerCase()+' to try again.'],null,c.d.name);}
function runQuiz(n){const read=Object.keys(st.lore);if(read.length<3){say(['Find at least three stories for your journal first, from the historical markers around town. Then come back!'],null,n.who);return;}
  const pool=read.slice(),qs=[];for(let i=0;i<3;i++)qs.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);let score=0,i=0;const all=Object.keys(RCQ.lore);
  const ask=()=>{if(i>=3){if(score==3){chal={id:'quiz',d:RCQ.chal.quiz,who:n.who};chalWin();}else say([score+' out of 3. Brush up on your journal and try again!'],null,n.who);return;}
    const id=qs[i],L=RCQ.lore[id],opts=[L.t];while(opts.length<3){const o=RCQ.lore[all[Math.floor(Math.random()*all.length)]].t;if(!opts.includes(o))opts.push(o);}
    opts.sort(()=>Math.random()-.5);const sn=L.s.split('. ')[0],q=sn.length>110?sn.slice(0,107)+'...':sn+'.';
    say(['Question '+(i+1)+' of 3: which story is this from?','"'+q+'"'],sel=>{if(opts[sel]==L.t){score++;sfx('coin');}else sfx('no');i++;ask();},n.who,opts);};
  ask();}

/* ---------- the camera: trails behind you, swing it with the right stick, Q/E or a drag ---------- */
function camUpdate(){if(!lv)return;const tx=p.x,ty=1.4,tz=p.z;
  if(lv.room){cam.yaw+=ang(cam.yaw,inp.camX*.5)*.08;}
  else{if(Math.abs(inp.camX)>.05){cam.yaw-=inp.camX*.045;cam.manual=90;}else if(cam.manual>0)cam.manual--;
  if(cam.manual==0&&p.moving){const want=p.yaw+Math.PI;cam.yaw+=ang(cam.yaw,want)*.018;}}
  const pitch=lv.room?.92:.42,want=lv.room?12:8.2;let dist=want;
  for(let d=1;d<=want;d+=.25){const x=tx+Math.sin(cam.yaw)*d*Math.cos(pitch),z=tz+Math.cos(cam.yaw)*d*Math.cos(pitch),y=ty+d*Math.sin(pitch),c=tAt(x,z);
    if(c&&tallAt(c,y,Math.floor(z/TS))){dist=Math.max(1.6,d-.4);break;}}
  cam.dist+=(dist-cam.dist)*(cam.snap?1:dist<cam.dist?.35:.08);cam.snap=false;cam.pitch=pitch;
  cam.x=tx+Math.sin(cam.yaw)*cam.dist*Math.cos(pitch);cam.z=tz+Math.cos(cam.yaw)*cam.dist*Math.cos(pitch);cam.y=ty+cam.dist*Math.sin(pitch);cam.tx=tx;cam.ty=ty;cam.tz=tz;}
function tallAt(c,y,tz){if(c=='B')return y<8;if(c=='X'||c=='D')return y<9;if(c=='W')return y<(tz==lv.h-1?.8:4);if(c=='T')return y<3.6&&y>1;return false;}

/* ---------- pause menu: items, journal, map ---------- */
const MTABS=['ITEMS','JOURNAL','MAP','SYSTEM'];
function menuUpdate(){const m=menu;
  if(m.rd){if(inp.a||inp.b){if(m.rd.pg<m.rd.pages.length-1)m.rd.pg++;else m.rd=null;sfx('blip');}return;}
  if(inp.menu||inp.start||(inp.b&&m.tab!=1)){menu=null;sfx('blip');return;}
  if(inp.left){m.tab=(m.tab+MTABS.length-1)%MTABS.length;sfx('blip');}if(inp.right){m.tab=(m.tab+1)%MTABS.length;sfx('blip');}
  if(m.tab==1){const ids=Object.keys(RCQ.lore);if(inp.up)m.jc=(m.jc+ids.length-1)%ids.length;if(inp.down)m.jc=(m.jc+1)%ids.length;
    if(inp.a){const id=ids[m.jc];if(st.lore[id]){m.rd={t:RCQ.lore[id].t,pages:wrapPages(RCQ.lore[id].s),pg:0};sfx('blip');}else sfx('no');}if(inp.b)menu=null;}
  if(m.tab==3){if(inp.up||inp.down)m.sel=(m.sel+1)%2;if(inp.a){if(m.sel==0){saveGame();toast('Saved.');menu=null;}else{saveGame();menu=null;mode='title';titleSel=0;}}}}
function goalText(){if(!st.items.lantern)return'Talk to the archivist in Capitol Square.';if(!st.got.granite)return st.items.powder?'Find Old Snapper deep in the Belle Isle Quarry.':'Find the quarry door on Belle Isle and explore it.';
  if(!st.f.sliceDone)return'Bring the granite keystone to the archivist.';return'Explore. Read every marker. Win the neighborhood pins.';}
function goalScene(){if(!st.items.lantern||st.got.granite&&!st.f.sliceDone)return'ow:2,1';if(!st.got.granite)return'ow:2,2';return null;}

/* ---------- title ---------- */
function titleOpts(){return loadSave()?['CONTINUE','NEW GAME']:['NEW GAME'];}
function titleUpdate(){const o=titleOpts();if(inp.up)titleSel=(titleSel+o.length-1)%o.length,sfx('blip');if(inp.down)titleSel=(titleSel+1)%o.length,sfx('blip');
  if(inp.a||inp.start){const c=o[titleSel%o.length];sfx('go');audioStart();if(c=='CONTINUE')startGame(loadSave());else startGame(null);}}
function vibrate(ms){try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
