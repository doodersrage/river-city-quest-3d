"use strict";
/* River City Quest 3D: everything drawn on top of the 3D view. Blue gradient windows with a
   bevelled border, the way late-90s RPG menus looked. Drawn at 640x480 over the 320x240 scene. */
const HW=640,HH=480;let hc=null,hx=null;
function initHud(canvas){hc=canvas;hc.width=HW;hc.height=HH;hx=hc.getContext('2d');}
function T(s,x,y,o){o=o||{};hx.font=(o.b===false?'':'bold ')+(o.size||18)+'px "Trebuchet MS", "Segoe UI", Verdana, sans-serif';hx.textAlign=o.align||'left';hx.textBaseline='top';
  if(o.sh!==false){hx.fillStyle='rgba(0,0,0,.85)';hx.fillText(s,x+2,y+2);}hx.fillStyle=o.c||'#ffffff';hx.fillText(s,x,y);}
function win(x,y,w,h){const g=hx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#3a4cb0');g.addColorStop(1,'#0c1458');hx.fillStyle=g;rr(x,y,w,h,8);hx.fill();
  hx.lineWidth=3;hx.strokeStyle='#d8dcf0';rr(x+1.5,y+1.5,w-3,h-3,7);hx.stroke();hx.lineWidth=1;hx.strokeStyle='#6a74a8';rr(x+4.5,y+4.5,w-9,h-9,5);hx.stroke();}
function rr(x,y,w,h,r){hx.beginPath();hx.moveTo(x+r,y);hx.arcTo(x+w,y,x+w,y+h,r);hx.arcTo(x+w,y+h,x,y+h,r);hx.arcTo(x,y+h,x,y,r);hx.arcTo(x,y,x+w,y,r);hx.closePath();}
function wrapText(s,maxW,size){hx.font='bold '+(size||18)+'px "Trebuchet MS", "Segoe UI", Verdana, sans-serif';const out=[];let line='';for(const w of s.split(' ')){const t=line?line+' '+w:w;if(hx.measureText(t).width>maxW&&line){out.push(line);line=w;}else line=t;}if(line)out.push(line);return out;}
function heart(x,y,fill){const P=[[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]];
  for(const [a,b] of P){hx.fillStyle='#1a0a10';hx.fillRect(x+a*3-1,y+b*3-1,5,5);}for(const [a,b] of P){const on=fill>=1||fill>0&&a<=3;hx.fillStyle=on?(b<2&&a<3?'#ff8a9a':'#e83048'):'#4a2a34';hx.fillRect(x+a*3,y+b*3,3,3);}}
function drawHud(){hx.clearRect(0,0,HW,HH);
  if(mode=='title'){drawTitle();return;}
  if(!st)return;
  if(mode=='end'){drawEnd();return;}
  // hearts, coins, item
  for(let i=0;i<st.max/2;i++)heart(16+i*26,14,Math.max(0,Math.min(1,(p.hp-i*2)/2)));
  win(HW-150,10,136,42);T('$ '+st.coins,HW-136,21,{c:'#f2c14e'});const ar=lv.id.split(':')[0];if(lv.room)T('KEY '+(st.keys[ar]||0),HW-62,21,{size:15,c:'#e8ecf8'});
  win(16,HH-74,120,58);T('B',28,HH-66,{size:14,c:'#9aa4d8'});T(st.eq=='lantern'?'Lantern':st.eq=='powder'?'Powder x'+st.ammo.powder:'-',28,HH-46,{size:17});
  if(chal&&chal.t!=null){win(HW/2-110,10,220,40);T(chal.d.name.toUpperCase().slice(0,18)+'  '+Math.ceil(chal.t/60),HW/2,20,{align:'center',size:16,c:chal.t<600&&(frame>>4)&1?'#ff8a8a':'#ffffff'});}
  if(boss&&!boss.dead&&Math.hypot(boss.x-p.x,boss.z-p.z)<26){win(HW/2-150,HH-62,300,46);T('OLD SNAPPER',HW/2-136,HH-52,{size:15,c:'#f2c14e'});hx.fillStyle='#1a0a10';hx.fillRect(HW/2-10,HH-48,150,14);hx.fillStyle='#e83048';hx.fillRect(HW/2-8,HH-46,146*boss.hp/EDEF.turtle.hp,10);}
  if(bannerT>0&&!dlg){hx.globalAlpha=Math.min(1,bannerT/30);win(HW/2-180,64,360,48);T(banner,HW/2,77,{align:'center',size:22,c:'#fff2a8'});hx.globalAlpha=1;}
  if(toastT>0&&!dlg){hx.globalAlpha=Math.min(1,toastT/20);const L=wrapText(toastMsg,520,17);win(HW/2-280,HH-100-L.length*22,560,24+L.length*22);L.forEach((l,i)=>T(l,HW/2,HH-88-L.length*22+i*22,{align:'center',size:17}));hx.globalAlpha=1;}
  // a prompt over whoever or whatever A would use
  if(!dlg&&!menu&&!trans&&mode=='play'){const t=promptTarget();if(t){const s=project(t[0],t[1],t[2]);if(s){const x=s[0]*2,y=s[1]*2;win(x-38,y-30,76,28);T('A '+t[3],x,y-25,{align:'center',size:14,c:'#fff2a8'});}}}
  if(dlg)drawDialog();
  if(menu)drawMenu();
  if(deathT>0){hx.fillStyle='rgba(60,0,10,'+Math.min(.7,(90-deathT)/60)+')';hx.fillRect(0,0,HW,HH);}}
function promptTarget(){for(const n of npcs){const d=Math.hypot(n.x-p.x,n.z-p.z),a=Math.abs(ang(p.yaw,Math.atan2(n.x-p.x,n.z-p.z)));if(d<2.1&&a<1.3)return[n.x,2.5,n.z,'Talk'];}
  for(const d of [1.2,2]){const [fx,fz]=front(d),[tx,tz]=tileXZ(fx,fz),c=tileAt(lv,tx,tz);
    const ch=chests.find(q=>q.tx==tx&&q.ty==tz);if(ch&&!ch.open&&chestVisible(ch))return[ch.x,1.4,ch.z,'Open'];
    if((c=='M'||c=='Y')&&lv.markers[tx+','+tz])return[tx*TS+TS/2,2.5,tz*TS+TS/2,'Read'];if(c=='D')return[tx*TS+TS/2,2.8,tz*TS+TS/2,'Enter'];}return null;}
function drawDialog(){const d=dlg,L=d.lines[d.i].slice(0,d.n),last=d.i==d.lines.length-1,lines=wrapText(L,560,19),h=Math.max(130,40+lines.length*26+(last&&d.choices&&d.n>=d.lines[d.i].length?d.choices.length*26+6:0));
  const y=HH-h-14;win(20,y,HW-40,h);if(d.who){win(30,y-30,Math.max(120,d.who.length*11+30),36);T(d.who,44,y-22,{size:16,c:'#fff2a8'});}
  lines.forEach((l,i)=>T(l,44,y+20+i*26,{size:19}));
  if(last&&d.choices&&d.n>=d.lines[d.i].length)d.choices.forEach((c,i)=>{const yy=y+26+lines.length*26+i*26;if(i==d.sel){hx.fillStyle='#f2c14e';hx.beginPath();hx.moveTo(48,yy+4);hx.lineTo(60,yy+11);hx.lineTo(48,yy+18);hx.fill();}T(c,68,yy,{size:18,c:i==d.sel?'#fff2a8':'#c8d0f0'});});
  else if(d.n>=d.lines[d.i].length&&(frame>>4)&1){hx.fillStyle='#f2c14e';hx.beginPath();hx.moveTo(HW-56,y+h-26);hx.lineTo(HW-44,y+h-26);hx.lineTo(HW-50,y+h-18);hx.fill();}}
function drawMenu(){const m=menu;hx.fillStyle='rgba(0,0,20,.45)';hx.fillRect(0,0,HW,HH);win(20,16,HW-40,HH-32);
  MTABS.forEach((t,i)=>{const x=40+i*144;if(i==m.tab){hx.fillStyle='rgba(242,193,78,.25)';hx.fillRect(x-6,30,132,30);}T(t,x+60,36,{align:'center',size:17,c:i==m.tab?'#fff2a8':'#9aa4d8'});});
  hx.fillStyle='#6a74a8';hx.fillRect(36,66,HW-72,2);
  if(m.tab==0){T('GOAL',44,84,{size:14,c:'#9aa4d8'});wrapText(goalText(),540,18).forEach((l,i)=>T(l,44,104+i*24,{size:18,c:'#fff2a8'}));
    const items=[['Kayak Paddle','Press A to swing.',true],['Gas Lantern','Lights lamps and the dark.',st.items.lantern],['Blasting Powder','Kegs: '+st.ammo.powder,st.items.powder],['Granite Keystone','One of four.',st.got.granite]];
    items.forEach(([n,dsc,has],i)=>{const y=170+i*44;T(has?n:'???',60,y,{size:19,c:has?'#ffffff':'#5a64a0'});if(has)T(dsc,300,y+2,{size:16,c:'#c8d0f0'});});
    T('Coins '+st.coins+'    Stories '+Object.keys(st.lore).length+'/'+Object.keys(RCQ.lore).length+'    Pins '+Object.keys(st.pins).length+'/'+Object.keys(RCQ.chal).length,HW/2,HH-70,{align:'center',size:16,c:'#c8d0f0'});}
  if(m.tab==1){if(m.rd){T(m.rd.t,HW/2,84,{align:'center',size:20,c:'#fff2a8'});wrapText(m.rd.pages[m.rd.pg],540,18).forEach((l,i)=>T(l,50,124+i*25,{size:18}));T('A: next',HW/2,HH-62,{align:'center',size:15,c:'#9aa4d8'});return;}
    const ids=Object.keys(RCQ.lore),top=Math.max(0,Math.min(m.jc-5,ids.length-11));for(let i=0;i<11&&top+i<ids.length;i++){const id=ids[top+i],y=82+i*30,got=st.lore[id];
      if(top+i==m.jc){hx.fillStyle='rgba(242,193,78,.2)';hx.fillRect(40,y-3,HW-80,28);}T(got?RCQ.lore[id].t:'- - - - - -',56,y,{size:18,c:got?'#ffffff':'#5a64a0'});}
    T('Stories you find on markers and statues are kept here.  A: read',HW/2,HH-58,{align:'center',size:14,c:'#9aa4d8'});}
  if(m.tab==2){const ids=Object.keys(RCQ.names).filter(k=>{const [x,y]=k.slice(3).split(',').map(Number);return x>=0&&x<=4&&y>=0&&y<=3;});
    for(const id of ids){const [x,y]=id.slice(3).split(',').map(Number),bx=40+x*114,by=86+y*64,inSlice=!!RCQ.maps[id],here=id==lv.id||lv.room&&id=='ow:2,2'&&lv.id.startsWith('quarry'),v=st.vis[id];
      hx.fillStyle=inSlice?(v?'#2e6a48':'#1e2a5a'):'#141a3a';hx.fillRect(bx,by,108,56);hx.strokeStyle=here&&(frame>>4)&1?'#fff2a8':'#3a447a';hx.lineWidth=2;hx.strokeRect(bx,by,108,56);
      wrapText(RCQ.names[id],100,13).slice(0,3).forEach((l,i)=>T(l,bx+54,by+6+i*15,{align:'center',size:13,c:inSlice?'#ffffff':'#4a5288',sh:false}));
      if(id==goalScene()&&(frame>>3)&1){hx.fillStyle='#f2c14e';hx.font='bold 22px sans-serif';hx.fillText('*',bx+92,by+30);}}
    T('Bright squares are open in this build. The star marks your goal.',HW/2,HH-58,{align:'center',size:14,c:'#9aa4d8'});}
  if(m.tab==3){['SAVE','SAVE AND QUIT TO TITLE'].forEach((o,i)=>T((m.sel==i?'> ':'  ')+o,80,110+i*40,{size:20,c:m.sel==i?'#fff2a8':'#c8d0f0'}));
    T('Time played '+fmtTime(st.time),80,220,{size:17,c:'#c8d0f0'});
    ['Move: left stick, WASD or arrows','A: talk, read, swing (J, Space)','B: use item (K, Shift)','ITEM: switch item (L, Tab)','Camera: drag, right stick, Q / E','MENU: Enter or Esc'].forEach((t,i)=>T(t,80,264+i*24,{size:15,c:'#9aa4d8'}));}
  T('< > change tab    B close',HW/2,HH-36,{align:'center',size:13,c:'#6a74a8'});}
function fmtTime(f){const s=Math.floor(f/60),m=Math.floor(s/60);return(m>=60?Math.floor(m/60)+':'+String(m%60).padStart(2,'0'):m)+':'+String(s%60).padStart(2,'0');}
function drawTitle(){const t=frame;hx.fillStyle='rgba(0,0,0,.25)';hx.fillRect(0,0,HW,HH);
  hx.save();hx.translate(HW/2,120);hx.font='bold 58px "Trebuchet MS", "Segoe UI", Verdana, sans-serif';hx.textAlign='center';hx.textBaseline='middle';
  for(let i=6;i>0;i--){hx.fillStyle='rgba(10,12,40,.5)';hx.fillText('RIVER CITY QUEST',i,i);}const g=hx.createLinearGradient(0,-30,0,30);g.addColorStop(0,'#fff2a8');g.addColorStop(.55,'#f2c14e');g.addColorStop(1,'#c07a20');hx.fillStyle=g;hx.fillText('RIVER CITY QUEST',0,0);
  hx.font='bold 22px "Trebuchet MS", sans-serif';hx.fillStyle='#e8ecf8';hx.fillText('T H E   F O G   O V E R   T H E   J A M E S',0,48);hx.restore();
  const o=titleOpts();o.forEach((s,i)=>{const sel=i==titleSel%o.length;T((sel?'> ':'')+s,HW/2,290+i*38,{align:'center',size:24,c:sel?'#fff2a8':'#c8d0f0'});});
  if((t>>5)&1)T('PRESS START',HW/2,400,{align:'center',size:18,c:'#ffffff'});T('A low-poly Richmond, Virginia adventure',HW/2,HH-36,{align:'center',size:14,c:'#9aa4d8'});}
function drawEnd(){hx.fillStyle='rgba(0,0,10,'+Math.min(.85,endT/60)+')';hx.fillRect(0,0,HW,HH);if(endT<40)return;
  T('TO BE CONTINUED',HW/2,130,{align:'center',size:40,c:'#f2c14e'});T('Keystones 1 / 4',HW/2,210,{align:'center',size:22});T('Stories '+Object.keys(st.lore).length+'/'+Object.keys(RCQ.lore).length+'   Pins '+Object.keys(st.pins).length+'/'+Object.keys(RCQ.chal).length+'   Time '+fmtTime(st.time),HW/2,250,{align:'center',size:18,c:'#c8d0f0'});
  T('More of Richmond is on the way.',HW/2,310,{align:'center',size:20,c:'#e8ecf8'});if(endT>90&&(frame>>5)&1)T('Press A to keep exploring',HW/2,380,{align:'center',size:18,c:'#fff2a8'});}
