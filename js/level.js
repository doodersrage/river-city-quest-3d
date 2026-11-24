"use strict";
/* River City Quest 3D: turns a 2D map from the original game into a 3D place.
   Every tile becomes geometry: brick rows become buildings, T becomes a tree, w becomes the James. */
const WALK='.,psSKk=-FEn';
const GROUND={'.':'grass',',':'flowers','p':'cobble','s':'sidewalk','S':'steps','K':'rails','k':'planks','=':'planks','-':'planks','F':'floor','E':'steps','n':'sand'};
const WATER='w~';
const LEVELS={};
function sceneData(id){return RCQ.maps[id]||RCQ.rooms[id]||null;}
function buildLevel(id){
  const d=sceneData(id);if(!d)return null;
  const g=d.rows.map(r=>r.split('')),lv={id,d,name:d.name,w:d.w,h:d.h,base:d.base,room:id.indexOf('ow:')!=0,g,dyn:[],glows:[],markers:{},doors:d.doors,
    lamps:d.lamps.map(([x,y])=>({tx:x,ty:y,lit:false})),spots:d.spots||[]};
  for(const k in d.reads)lv.markers[k]=d.reads[k];
  // things that can change while you play live outside the static mesh
  for(let y=0;y<lv.h;y++)for(let x=0;x<lv.w;x++){const c=g[y][x];
    if(c=='b')lv.dyn.push({kind:'bush',tx:x,ty:y,on:true,under:lv.base=='F'?'F':lv.base});
    if(c=='%'&&!lv.room)lv.dyn.push({kind:'rubble',tx:x,ty:y,on:true,under:'D'});}
  for(const dd of d.dyn){if(dd.closed!='L'&&dd.closed!='%')continue;const [cx,cy]=dd.cells[0],[ar,co]=id.split(':'),[ax,ay]=co.split(',').map(Number);
    const n=cy==0?[ax,ay-1]:cy==lv.h-1?[ax,ay+1]:cx==0?[ax-1,ay]:[ax+1,ay],link=[id,ar+':'+n[0]+','+n[1]].sort().join('|');
    lv.dyn.push({kind:dd.closed=='L'?'lock':'crack',cells:dd.cells,on:true,under:dd.open,tx:cx,ty:cy,link});}
  for(const o of lv.dyn)for(const [x,y] of o.cells||[[o.tx,o.ty]])g[y][x]=o.kind=='bush'?'b':o.kind=='lock'?'L':'%';
  return lv;}
function tileAt(lv,tx,ty){if(tx<0||ty<0||tx>=lv.w||ty>=lv.h)return null;return lv.g[ty][tx];}
function walkable(c){return c!=null&&WALK.includes(c);}
function setTile(lv,tx,ty,c){lv.g[ty][tx]=c;}

/* ---------- static geometry ---------- */
const BLOCKS='BX';
function compOf(lv){const comp=[],id={};let n=0;
  for(let y=0;y<lv.h;y++)for(let x=0;x<lv.w;x++){if(lv.d.rows[y][x]!='B'||id[x+','+y]!=null)continue;const q=[[x,y]];id[x+','+y]=n;
    while(q.length){const [a,b]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(a+dx)+','+(b+dy);if(id[k]==null&&lv.d.rows[b+dy]&&lv.d.rows[b+dy][a+dx]=='B'){id[k]=n;q.push([a+dx,b+dy]);}}}n++;}
  return id;}
function lmAt(lv,x,y){return(lv.d.lm||[]).find(L=>x>=L.x&&x<L.x+L.w&&y>=L.y&&y<L.y+L.h);}
function groundCell(lv,c,x,y){if(GROUND[c])return c=='.'&&hash(x,y,3)%3==0?'grass2':GROUND[c];const b=lv.base;return GROUND[b]?(b=='.'&&hash(x,y,3)%3==0?'grass2':GROUND[b]):'grass';}
function buildMesh(lv){
  const M=new Mesh(),Wm=new Mesh(),Fm=new Mesh(),rows=lv.d.rows,comp=compOf(lv),H={};
  const src=(x,y)=>x<0||y<0||x>=lv.w||y>=lv.h?null:rows[y][x];
  const bh=(x,y)=>{const c=src(x,y);if(c=='B'){const k=comp[x+','+y],v=hash(k,lv.d.ax*7+lv.d.ay,11)%3;return(2+v)*TS;}if(c=='X'||c=='D'&&!lmAt(lv,x,y))return 2*TS;return 0;};
  const room=lv.room;
  for(let y=0;y<lv.h;y++)for(let x=0;x<lv.w;x++){const c=rows[y][x],X0=x*TS,Z0=y*TS,X1=X0+TS,Z1=Z0+TS,cx=X0+TS/2,cz=Z0+TS/2,h=hash(x,y,lv.d.ax*31+lv.d.ay);
    // ground
    if(WATER.includes(c)){(c=='~'?Fm:Wm).floor(X0,Z0,X1,Z1,-.35,'white');
      for(const [dx,dy,a,b] of [[0,-1,[X1,Z0],[X0,Z0]],[0,1,[X0,Z1],[X1,Z1]],[-1,0,[X0,Z0],[X0,Z1]],[1,0,[X1,Z1],[X1,Z0]]]){const n=src(x+dx,y+dy);if(n!=null&&!WATER.includes(n)&&n!='='&&n!='-')M.wall(a[0],a[1],b[0],b[1],-1.2,0,room?'qwall':'dirt',null,.7);}
      M.floor(X0,Z0,X1,Z1,-1.2,room?'floor':'dirt',[.5,.5,.6]);continue;}
    if(c=='='||c=='-'){M.floor(X0,Z0,X1,Z1,.06,'planks');M.box(X0+.1,-1.2,Z0+.1,X0+.4,.06,Z0+.4,'wood');
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=src(x+dx,y+dy);if(n&&WATER.includes(n)){const ax=dx?(dx>0?X1-.15:X0):X0,az=dy?(dy>0?Z1-.15:Z0):Z0;M.box(ax,.06,az,dx?ax+.15:X1,1,dy?az+.15:Z1,'wood');}}
      Wm.floor(X0,Z0,X1,Z1,-.35,'white');continue;}
    M.floor(X0,Z0,X1,Z1,0,room&&!WALK.includes(c)?'floor':groundCell(lv,c,x,y));
    // things standing on the tile
    switch(c){
      case'B':{const ht=bh(x,y),k=comp[x+','+y],kind=hash(k,5,lv.d.ay)%4;
        for(const [dx,dy,a,b] of [[0,1,[X0,Z1],[X1,Z1]],[0,-1,[X1,Z0],[X0,Z0]],[1,0,[X1,Z1],[X1,Z0]],[-1,0,[X0,Z0],[X0,Z1]]]){const nh=bh(x+dx,y+dy);if(nh>=ht)continue;
          M.wall(a[0],a[1],b[0],b[1],nh,ht,'brick',null,dy==1?.88:dy==-1?.6:.74,(i,j)=>j==0&&dy==1&&nh==0?(kind==0?'storefront':'brickwin'):(hash(x+j,y,i+dy)%5==0?'brickwin2':'brickwin'));}
        M.floor(X0,Z0,X1,Z1,ht,'roof');M.box(X0,ht,Z0,X1,ht+.25,Z1,{top:'stone',side:'stone'},null,{bottom:1});break;}
      case'X':case'D':{if(lmAt(lv,x,y))break;const ht=bh(x,y);M.box(X0,0,Z0,X1,ht,Z1,{top:'roof',side:room?'qwall':'stone'},null,{bottom:1},true);break;}
      case'W':{const wh=y==lv.h-1?.8:4;M.box(X0,0,Z0,X1,wh,Z1,{top:wh<1?'qwall':'black',side:'qwall'},null,{bottom:1},wh>1);break;}
      case'T':{const r=.95+(h%5)*.08,kind=h%5;
        if(kind<2){M.tube([cx,0,cz],[cx,1.4,cz],.2,.15,6,'bark');M.cone(cx,.9,cz,r*1.25,2.0,r*.5,7,'leaves',null,h);M.cone(cx,1.7,cz,r*1.05,2.9,r*.3,7,'leaves',null,h+1);M.cone(cx,2.6,cz,r*.75,4.1,0,7,'leaves',null,h+2);}
        else{M.tube([cx,0,cz],[cx,1.9,cz],.2,.13,6,'bark');M.tube([cx,1.3,cz],[cx+.5,2.2,cz+.2],.09,.05,5,'bark');M.tube([cx,1.4,cz],[cx-.45,2.3,cz-.25],.09,.05,5,'bark');
          const lc=kind==4?'leaves2':'leaves';M.sphere(cx,2.5,cz,r*.95,8,5,lc,null,.85);M.sphere(cx+.55,2.25,cz+.2,r*.62,7,4,lc,null,.85);M.sphere(cx-.5,2.35,cz-.25,r*.66,7,4,lc,null,.85);M.sphere(cx+.1,3.05,cz-.1,r*.55,7,4,lc,null,.9);}break;}
      case'r':{const s=.55+(h%4)*.12;M.cone(cx,0,cz,s*1.4,s*.9,s*.7,5,'rock',null,h);M.cone(cx,s*.9,cz,s*.7,s*1.2,0,5,'rock',null,h);break;}
      case'R':M.box(X0,0,Z0,X1,1,Z1,{top:'stonewall',side:'stone'},null,{bottom:1});break;
      case'f':{const n=(dx,dy)=>src(x+dx,y+dy)=='f',ew=n(1,0)||n(-1,0),ns=n(0,1)||n(0,-1);
        const run=(ax0,az0,ax1,az1)=>{M.box(Math.min(ax0,ax1)-.04,1.05,Math.min(az0,az1)-.04,Math.max(ax0,ax1)+.04,1.13,Math.max(az0,az1)+.04,'black');M.box(Math.min(ax0,ax1)-.04,.18,Math.min(az0,az1)-.04,Math.max(ax0,ax1)+.04,.25,Math.max(az0,az1)+.04,'black');
          const L=Math.hypot(ax1-ax0,az1-az0),k=Math.round(L/.25);for(let i=0;i<=k;i++){const t=i/k,px=ax0+(ax1-ax0)*t,pz=az0+(az1-az0)*t;M.box(px-.025,0,pz-.025,px+.025,1.22,pz+.025,'black');M.cone(px,1.22,pz,.05,1.34,0,4,'black');}};
        if(ew||!ns)run(n(-1,0)?X0:cx,cz,n(1,0)?X1:cx,cz);if(ns)run(cx,n(0,-1)?Z0:cz,cx,n(0,1)?Z1:cz);
        M.lathe(cx,0,cz,[[0,.09],[1.3,.08],[1.36,.11],[1.42,0]],6,'black');break;}
      case'l':{M.lathe(cx,0,cz,[[0,.2],[.25,.18],[.35,.1],[.6,.07],[2.5,.06],[2.6,.1]],6,'black');M.box(cx-.22,2.6,cz-.22,cx+.22,2.68,cz+.22,'black');
        M.lathe(cx,2.68,cz,[[0,.16],[.4,.24],[.55,.26]],4,'glass',null,1,1);M.lathe(cx,3.23,cz,[[0,.3],[.12,.28],[.32,.06],[.42,0]],4,'black');M.sphere(cx,3.68,cz,.05,4,2,'black');lv.glows.push([cx,2.95,cz,x,y]);break;}
      case'i':{for(let k=0;k<3;k++)M.box(X0+.15,.44,Z0+.55+k*.18,X1-.15,.52,Z0+.69+k*.18,'wood');for(let k=0;k<2;k++)M.box(X0+.15,.75+k*.24,Z0+.42,X1-.15,.9+k*.24,Z0+.5,'wood');
        for(const ex of [X0+.3,X1-.3]){M.box(ex-.05,0,Z0+.45,ex+.05,1.25,Z0+.55,'black');M.box(ex-.05,0,Z1-.6,ex+.05,.5,Z1-.5,'black');M.box(ex-.05,.42,Z0+.45,ex+.05,.5,Z1-.5,'black');M.box(ex-.05,.68,Z0+.5,ex+.05,.74,Z1-.55,'black');}break;}
      case'a':M.box(cx-.05,0,cz-.05,cx+.05,.8,cz+.05,'black');M.disc(cx,.8,cz,.5,6,'white',[.9,.9,.85]);break;
      case'M':{const fd=faceDir(lv,x,y);M.box(cx-.07,0,cz-.07,cx+.07,1.2,cz+.07,'black');
        if(fd[0])M.box(cx-.06,1,cz-.7,cx+.06,2.1,cz+.7,{top:'black',side:'black',east:'sign',west:'sign'});else M.box(cx-.7,1,cz-.06,cx+.7,2.1,cz+.06,{top:'black',side:'black',south:'sign',north:'sign'});break;}
      case'Y':M.box(X0+.2,0,Z0+.2,X1-.2,1.2,Z1-.2,'marble');statue(M,cx,1.2,cz);break;
      case'y':M.cone(cx,0,cz,.95,.5,.95,8,'marble');Wm.disc(cx,.42,cz,.85,8,'white');M.box(cx-.1,.4,cz-.1,cx+.1,1.4,cz+.1,'marble');break;
      case'x':M.box(cx-.3,0,cz-.15,cx+.3,.9,cz+.15,'stone');break;
      case'E':M.box(X0,-.02,Z0,X1,.02,Z1,'steps');break;
    }
  }
  for(const L of lv.d.lm||[])landmark(M,lv,L);
  // doorways on whatever building face is open to the street
  for(const dr of lv.doors||[]){const fd=faceDir(lv,dr.tx,dr.ty),X0=dr.tx*TS,Z0=dr.ty*TS,cx=X0+TS/2,cz=Z0+TS/2,o=.03,w=.75;
    if(fd[1]==1)M.quad([cx-w,0,Z0+TS+o],[cx+w,0,Z0+TS+o],[cx+w,2.4,Z0+TS+o],[cx-w,2.4,Z0+TS+o],'door');
    else if(fd[1]==-1)M.quad([cx+w,0,Z0-o],[cx-w,0,Z0-o],[cx-w,2.4,Z0-o],[cx+w,2.4,Z0-o],'door');
    else if(fd[0]==1)M.quad([X0+TS+o,0,cz+w],[X0+TS+o,0,cz-w],[X0+TS+o,2.4,cz-w],[X0+TS+o,2.4,cz+w],'door');
    else M.quad([X0-o,0,cz-w],[X0-o,0,cz+w],[X0-o,2.4,cz+w],[X0-o,2.4,cz-w],'door');}
  return{main:M,water:Wm,foam:Fm};}
function faceDir(lv,x,y){for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const c=lv.d.rows[y+dy]&&lv.d.rows[y+dy][x+dx];if(c&&WALK.includes(c))return[dx,dy];}return[0,1];}
function statue(M,x,y,z){const s=[.62,.62,.66];M.box(x-.25,y,z-.15,x-.05,y+.9,z+.15,'stone',s);M.box(x+.05,y,z-.15,x+.25,y+.9,z+.15,'stone',s);M.box(x-.32,y+.9,z-.2,x+.32,y+1.7,z+.2,'stone',s);
  M.box(x-.45,y+.95,z-.12,x-.32,y+1.6,z+.12,'stone',s);M.box(x+.32,y+1.3,z-.12,x+.45,y+2.1,z+.12,'stone',s);M.box(x-.18,y+1.7,z-.18,x+.18,y+2.1,z+.18,'stone',s);}
function landmark(M,lv,L){const X0=L.x*TS,Z0=L.y*TS,X1=X0+L.w*TS,Z1=Z0+L.h*TS,cx=(X0+X1)/2;
  switch(L.art){
    case'capitol':{M.box(X0,0,Z0,X1,1,Z1,{top:'marble',side:'stone'},null,{bottom:1},true);const bz=Z1-3.2;M.box(X0+1,1,Z0+.5,X1-1,7,bz,{top:'roof',side:'marble'},null,{bottom:1},true);
      M.gable(X0+.6,Z0+.2,X1-.6,Z1-.2,7,3,false,'roof',null,'marble');M.box(X0+.6,6.4,bz,X1-.6,7,Z1-.2,'marble');
      for(let i=0;i<6;i++){const x=X0+2.2+i*(L.w*TS-4.4)/5;M.cone(x,1,Z1-1.2,.38,6.4,.32,6,'column');}
      break;}
    case'belltower':M.box(X0+.3,0,Z0+.3,X1-.3,8,Z1-.3,{top:'roof',side:'brick'},null,{bottom:1},true);M.box(X0+.1,8,Z0+.1,X1-.1,9.6,Z1-.1,{top:'white',side:'marble'},null,{bottom:1});M.cone(cx,9.6,(Z0+Z1)/2,1.4,11,0,4,'copper',null,.785);break;
    case'station':{const tx=X1-3*TS;M.box(X0,0,Z0,tx,7,Z1,{top:'roof',side:'brick',south:'brickwin'},null,{bottom:1},true);M.gable(X0,Z0,tx,Z1,7,2.6,true,'tin',null,'brick');
      M.box(tx,0,Z0+.6,X1,14,Z1-.6,{top:'roof',side:'brick'},null,{bottom:1},true);
      M.box(tx-.05,11,Z0+.55,X1+.05,13.4,Z1-.55,{top:'roof',side:'clock'},null,{bottom:1,top:1});M.cone((tx+X1)/2,14,(Z0+Z1)/2,3.6,17.5,0,4,'tin',null,.785);break;}
    case'market':{for(let i=X0;i<=X1;i+=4)for(const z of [Z0+.3,Z1-.3])M.box(i-.12,0,z-.12,i+.12,3,z+.12,'black');M.gable(X0-.3,Z0-.3,X1+.3,Z1+.3,3,1.8,true,'copper',[.7,1,.75]);
      for(let i=X0+2;i<X1-2;i+=4)M.box(i,0,Z0+1,i+2,.9,Z1-1,{top:'gold',side:'wood'});break;}
    case'church':{const bx0=X0+.4,bx1=X1-.4;M.box(bx0,0,Z0+3,bx1,4.5,Z1,{top:'roof',side:'clap'},null,{bottom:1},true);M.gable(bx0,Z0+3,bx1,Z1,4.5,2.6,false,'roof',null,'white');
      const tx0=cx-1.4,tx1=cx+1.4;M.box(tx0,0,Z0+.4,tx1,8,Z0+3.2,{top:'roof',side:'white'},null,{bottom:1},true);M.box(tx0+.3,8,Z0+.7,tx1-.3,10,Z0+2.9,{top:'white',side:'marble'},null,{bottom:1});
      M.cone(cx,10,Z0+1.8,1.2,14.5,0,6,'white');break;}
    case'ruins':{for(let i=0;i<L.w;i++){const hh=1+hash(i,L.y,9)%4;M.box(X0+i*TS,0,Z0+.2,X0+(i+1)*TS,hh*1.1,Z0+.9,{top:'rubble',side:'brick'},null,{bottom:1});const h2=1+hash(i,L.y,5)%3;M.box(X0+i*TS,0,Z1-.9,X0+(i+1)*TS,h2,Z1-.2,{top:'rubble',side:'brick'},null,{bottom:1});}
      M.box(X0,0,Z0+.2,X0+.7,3,Z1-.2,{top:'rubble',side:'brick'},null,{bottom:1});M.box(X1-.7,0,Z0+.2,X1,2.2,Z1-.2,{top:'rubble',side:'brick'},null,{bottom:1});M.floor(X0,Z0,X1,Z1,.02,'rubble');break;}
    default:M.box(X0,0,Z0,X1,4,Z1,{top:'roof',side:'stone'},null,{bottom:1},true);
  }}
