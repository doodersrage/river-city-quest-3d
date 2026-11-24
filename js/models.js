"use strict";
/* River City Quest 3D: low-poly models made of boxes, each part with a pivot so it can swing.
   The front of every model faces +z when its yaw is 0. */
const MODELS={};
function part(build,pivot,name){const m=new Mesh();build(m);return{mesh:m,pivot:pivot||[0,0,0],name:name||''};}
function shadeHex(h,f){const c=rgb(h);return[c[0]*f,c[1]*f,c[2]*f];}
function humanoid(o){const sk=rgb(o.skin||'#e8b890'),sh=rgb(o.shirt||'#3d63c8'),pa=rgb(o.pants||'#3c3c54'),ha=rgb(o.hat||'#6a4020'),hair=rgb(o.hair||'#3a2414'),shoe=rgb(o.shoe||'#2a2228'),N=10,w=o.wide||1;
  const legCol=o.skirt?sk:pa;
  const P=[
    part(m=>{if(o.skirt)m.lathe(0,0,0,[[.5,.36],[.72,.31],[.95,.26],[1.08,.25]],N,'white',pa,w,.78,true);else m.lathe(0,0,0,[[.84,.2],[.97,.25],[1.08,.26]],N,'white',pa,w,.72,true);
      m.lathe(0,0,0,[[1.0,.24],[1.12,.22],[1.28,.27],[1.44,.3],[1.54,.27],[1.62,.13]],N,'white',sh,w,.7,true);m.sphere(-.29*w,1.49,0,.115,8,5,'white',sh);m.sphere(.29*w,1.49,0,.115,8,5,'white',sh);m.lathe(0,0,0,[[1.56,.075],[1.7,.07]],8,'white',sk);},[0,0,0],'body'),
    part(m=>{m.sphere(0,.27,0,.25,N,7,'white',sk,1.1);m.quad([-.2,.06,.235],[.2,.06,.235],[.2,.42,.235],[-.2,.42,.235],'eyes');
      m.sphere(-.25,.25,0,.055,6,3,'white',sk);m.sphere(.25,.25,0,.055,6,3,'white',sk);m.sphere(0,.2,.25,.045,6,3,'white',[sk[0]*.92,sk[1]*.85,sk[2]*.8]);
      const st=o.style||'short';
      if(st=='long')m.sphere(0,.1,-.06,.27,N,5,'white',hair,1.45,1.04,.82,.45,1);
      if(o.capless){m.sphere(0,.29,-.015,.272,N,5,'white',hair,1.1,1.04,1.04,.52,1);if(st=='bun')m.sphere(0,.5,-.2,.11,8,4,'white',hair);}
      else{m.sphere(0,.29,-.01,.275,N,5,'white',ha,1.08,1.04,1.04,.55,1);m.lathe(0,.36,.08,[[0,.0],[.0,.22],[.05,.22]],N,'white',[ha[0]*.85,ha[1]*.85,ha[2]*.85],1,1.25,true);
        m.sphere(0,.32,-.13,.2,N,5,'white',hair,1,1.15,.8);}},[0,1.6,0],'head'),
    part(m=>{m.lathe(0,0,0,[[-.82,.075],[-.5,.095],[-.15,.12],[0,.12]],8,'white',legCol);m.sphere(0,-.84,.05,.11,8,4,'white',shoe,.6,1,1.55,.5,1);},[-.13,.92,0],'legL'),
    part(m=>{m.lathe(0,0,0,[[-.82,.075],[-.5,.095],[-.15,.12],[0,.12]],8,'white',legCol);m.sphere(0,-.84,.05,.11,8,4,'white',shoe,.6,1,1.55,.5,1);},[.13,.92,0],'legR'),
    part(m=>{m.lathe(0,0,0,[[-.32,.085],[-.08,.1],[0,.09]],8,'white',sh,1,1,true);m.lathe(0,0,0,[[-.62,.06],[-.32,.072]],8,'white',sk);m.sphere(0,-.67,0,.075,8,4,'white',sk);},[-.37*w,1.5,0],'armL'),
    part(m=>{m.lathe(0,0,0,[[-.32,.085],[-.08,.1],[0,.09]],8,'white',sh,1,1,true);m.lathe(0,0,0,[[-.62,.06],[-.32,.072]],8,'white',sk);m.sphere(0,-.67,0,.075,8,4,'white',sk);
      },[.37*w,1.5,0],'armR')];
  if(o.paddle){const arm=P[5].mesh,c=rgb(o.gold?'#f2c14e':'#e83048');arm.pos.length=0;arm.uv.length=0;arm.col.length=0;
    arm.lathe(0,0,0,[[-.32,.085],[-.08,.1],[0,.09]],8,'white',sh,1,1,true);arm.lathe(0,0,0,[[-.62,.06],[-.32,.072]],8,'white',sk);arm.sphere(0,-.67,0,.075,8,4,'white',sk);
    const pd=new Mesh();pd.lathe(0,0,0,[[-.5,.03],[1.35,.03]],6,'wood');pd.sphere(0,1.55,0,.24,8,5,'white',c,1,.5,.2);pd.sphere(0,-.66,0,.15,8,4,'white',c,1,.45,.2);
    for(let i=0;i<pd.pos.length;i+=3){const y=pd.pos[i+1],z=pd.pos[i+2];pd.pos[i+1]=y*.6-z*.8-.67;pd.pos[i+2]=y*.8+z*.6;}arm.add(pd);}
  const B=P[0].mesh,Hd=P[1].mesh,AL=P[4].mesh,AR=P[5].mesh,dk=c=>[c[0]*.55,c[1]*.55,c[2]*.55],A=o.acc||[];
  B.lathe(0,0,0,[[1.0,.245],[1.07,.245]],N,'white',o.skirt?dk(pa):[.16,.12,.1],w,.72);B.box(-.05,1.0,.16,.05,1.07,.2,'gold');
  B.lathe(0,0,0,[[1.58,.15],[1.66,.11]],N,'white',[sh[0]*.85,sh[1]*.85,sh[2]*.85],1,.9);
  if(A.includes('coat')){const c=rgb(o.coat||'#2a3a6a');B.lathe(0,0,0,[[.45,.32],[.8,.3],[1.05,.27],[1.3,.3],[1.46,.32],[1.56,.28],[1.63,.14]],N,'white',c,w*1.04,.76);
    for(let i=0;i<4;i++)B.sphere(.0,1.12+i*.12,.235,.025,4,2,'gold');AL.lathe(0,0,0,[[-.4,.1],[0,.11]],8,'white',c,1,1,true);AR.lathe(0,0,0,[[-.4,.1],[0,.11]],8,'white',c,1,1,true);}
  if(A.includes('vest')){const c=rgb('#f08a30');B.lathe(0,0,0,[[1.05,.3],[1.3,.32],[1.5,.33],[1.58,.24]],N,'white',c,w,.76);B.box(-.04,1.08,.24,.04,1.5,.26,'white',[.2,.2,.24]);}
  if(A.includes('apron')){B.box(-.2,.62,.2,.2,1.42,.235,'white',[.94,.92,.86]);B.box(-.22,1.0,.18,.22,1.05,.24,'white',[.94,.92,.86]);}
  if(A.includes('glasses')){const k=[.12,.1,.1];for(const sx of [-1,1]){const x=sx*.1;Hd.box(x-.07,.26,.255,x+.07,.275,.27,'white',k);Hd.box(x-.07,.17,.255,x+.07,.185,.27,'white',k);Hd.box(x-.075,.17,.255,x-.06,.275,.27,'white',k);Hd.box(x+.06,.17,.255,x+.075,.275,.27,'white',k);}Hd.box(-.03,.24,.255,.03,.255,.27,'white',k);}
  if(A.includes('tricorn')){const c=rgb('#1e1c24');Hd.sphere(0,.4,0,.25,N,4,'white',c,.75,1,1,.5,1);Hd.lathe(0,.42,0,[[0,.42],[.08,.4],[.1,.2]],3,'white',c,1,1,true);Hd.sphere(0,.5,.33,.035,4,2,'gold');}
  if(A.includes('helmet')){const c=rgb(o.helm||'#f2c14e');Hd.sphere(0,.3,-.01,.3,N,5,'white',c,1.05,1.02,1.08,.48,1);Hd.box(-.2,.33,.25,.2,.37,.34,'white',dk(c));}
  if(A.includes('book')){const c=rgb('#8a1c2c');AL.box(-.13,-.86,-.04,.13,-.62,.12,{top:'paper',side:'white',south:'white'},c);AL.box(-.12,-.85,-.03,.12,-.63,.11,'paper');}
  if(A.includes('clipboard')){AL.box(-.12,-.88,.06,.12,-.56,.1,'wood');AL.box(-.1,-.84,.1,.1,-.6,.11,'paper');}
  if(A.includes('pole')){AR.tube([0,-.67,0],[0,1.9,.35],.03,.025,5,'black');AR.sphere(0,1.95,.36,.06,5,3,'gold');}
  if(A.includes('gloves')){for(const m of [AL,AR])m.sphere(0,-.67,0,.088,8,4,'white',rgb('#f2c14e'));AR.sphere(0,-.95,.0,.2,8,5,'white',[.18,.2,.26],1.3);AR.box(-.02,-.75,-.02,.02,-.68,.02,'white',[.18,.2,.26]);}
  if(A.includes('pack')){const c=rgb('#6a4a2a');B.lathe(0,1.12,-.25,[[0,.17],[.12,.2],[.36,.2],[.44,.15]],8,'white',c,1,.6,true);B.box(-.12,1.2,-.38,.12,1.36,-.33,'white',dk(c));for(const sx of [-.14,.14])B.box(sx-.03,1.15,-.22,sx+.03,1.6,.22,'white',dk(c));}
  return P;}
function enemyModel(t){const P=[];
  if(t=='rat'){const c=rgb('#7a7480'),pk=rgb('#e8a0a8');P.push(part(m=>{m.sphere(0,.26,-.05,.26,8,5,'white',c,.85,1,1.55);m.sphere(0,.28,.38,.17,8,4,'white',c,.95,1,1.3);m.sphere(0,.27,.6,.05,5,2,'white',pk);
      m.quad([-.12,.33,.505],[.12,.33,.505],[.12,.45,.505],[-.12,.45,.505],'eyes');for(const sx of [-1,1]){m.sphere(sx*.13,.44,.32,.08,6,3,'white',pk,1,.4,1);m.tube([sx*.1,.0,.25],[sx*.13,.18,.2],.04,.05,4,'white',pk);m.tube([sx*.12,0,-.3],[sx*.15,.18,-.25],.04,.05,4,'white',pk);}
      for(const sx of [-1,1])for(let k=0;k<3;k++)m.box(sx*.05+sx*k*.02-.004,.28-k*.015,.6,sx*.05+sx*k*.02+sx*.16,.284-k*.015,.604,'white',[.9,.9,.9]);},[0,0,0],'body'),
    part(m=>{m.tube([0,0,0],[0,.05,-.45],.035,.025,4,'white',pk);m.tube([0,.05,-.45],[0,.18,-.8],.025,.012,4,'white',pk);},[0,.2,-.42],'tail'));}
  else if(t=='bat'){const c=rgb('#3a3048'),w=rgb('#4a3a5e');P.push(part(m=>{m.sphere(0,0,0,.2,8,5,'white',c,1.15);m.sphere(0,.24,.03,.15,8,4,'white',c);m.quad([-.11,.18,.16],[.11,.18,.16],[.11,.32,.16],[-.11,.32,.16],'eyes');
      for(const sx of [-1,1])m.cone(sx*.09,.34,.02,.06,.5,0,4,'white',c);},[0,0,0],'body'),
    part(m=>{m.quad([0,0,-.15],[0,0,.15],[-.5,.15,.2],[-.5,.15,-.2],'white',w);m.quad([-.5,.15,-.2],[-.5,.15,.2],[-1,.0,.1],[-1,0,-.25],'white',w);m.tube([0,0,.12],[-.5,.15,.2],.02,.02,3,'white',c);m.tube([-.5,.15,.2],[-1,0,.1],.02,.01,3,'white',c);},[-.15,0,0],'wingL'),
    part(m=>{m.quad([0,0,.15],[0,0,-.15],[.5,.15,-.2],[.5,.15,.2],'white',w);m.quad([.5,.15,.2],[.5,.15,-.2],[1,.0,-.25],[1,0,.1],'white',w);m.tube([0,0,.12],[.5,.15,.2],.02,.02,3,'white',c);m.tube([.5,.15,.2],[1,0,.1],.02,.01,3,'white',c);},[.15,0,0],'wingR'));}
  else if(t=='goose'){const wc=rgb('#f0ece4'),or=rgb('#f08a30'),bk=rgb('#2a2a2a');P.push(part(m=>{m.sphere(0,.68,-.05,.36,9,6,'white',wc,.72,.95,1.45);m.cone(0,.62,-.55,.18,.9,.02,6,'white',wc);
      for(const sx of [-1,1]){m.sphere(sx*.3,.72,-.1,.2,7,4,'white',[.86,.84,.78],.55,.5,1.4);m.tube([sx*.1,.0,.0],[sx*.1,.45,-.02],.035,.04,5,'white',or);m.box(sx*.1-.08,0,-.02,sx*.1+.08,.04,.16,'white',or);}},[0,0,0],'body'),
    part(m=>{m.tube([0,0,0],[0,.75,.12],.1,.08,7,'white',bk);m.sphere(0,.82,.15,.13,8,4,'white',bk,1,1,1.15);m.box(-.1,.66,.14,.1,.74,.22,'white',[.95,.95,.95]);m.cone(0,.8,.28,.06,.8,0,5,'white',or);
      m.tube([0,.79,.25],[0,.77,.46],.055,.02,5,'white',or);m.quad([-.11,.82,.28],[.11,.82,.28],[.11,.92,.28],[-.11,.92,.28],'eyes');},[0,.72,.32],'neck'));}
  else if(t=='crab'){const c=rgb('#d84830'),d=rgb('#a83020');P.push(part(m=>{m.sphere(0,.3,0,.42,10,5,'white',c,.55,1.15,.85);m.sphere(0,.25,0,.4,10,3,'white',d,.3,1.15,.85,0,.5);
      for(const sx of [-1,1]){m.tube([sx*.14,.44,.26],[sx*.16,.6,.3],.025,.025,4,'white',d);m.sphere(sx*.16,.63,.31,.05,5,3,'white',[.1,.1,.1]);
        for(let i=0;i<3;i++){const z=-.2+i*.18;m.tube([sx*.4,.28,z],[sx*.7,.36,z+.04],.04,.035,4,'white',d);m.tube([sx*.7,.36,z+.04],[sx*.85,0,z+.08],.035,.02,4,'white',d);}}},[0,0,0],'body'),
    part(m=>{m.tube([0,0,0],[-.05,.05,.3],.06,.07,6,'white',c);m.sphere(-.05,.07,.45,.13,7,4,'white',rgb('#f05a40'),.8,.9,1.3);m.cone(-.05,.07,.55,.07,.12,0,4,'white',d);},[-.4,.3,.2],'clawL'),
    part(m=>{m.tube([0,0,0],[.05,.05,.3],.06,.07,6,'white',c);m.sphere(.05,.07,.45,.13,7,4,'white',rgb('#f05a40'),.8,.9,1.3);m.cone(.05,.07,.55,.07,.12,0,4,'white',d);},[.4,.3,.2],'clawR'));}
  else if(t=='ghost'){const c=rgb('#c8d8f0');P.push(part(m=>{m.lathe(0,0,0,[[0,.62],[.15,.5],[.6,.42],[1.1,.4],[1.45,.36],[1.7,.25],[1.82,0]],10,'white',c);
      for(let i=0;i<6;i++){const a=i/6*6.283;m.cone(Math.cos(a)*.5,0,Math.sin(a)*.5,.14,-.25,0,4,'white',c);}m.quad([-.2,1.25,.38],[.2,1.25,.38],[.2,1.55,.38],[-.2,1.55,.38],'eyes');
      for(const sx of [-1,1])m.tube([sx*.38,1.2,0],[sx*.62,.9,.15],.09,.06,6,'white',c,true);},[0,0,0],'body'));}
  else if(t=='turtle'){const sh=rgb('#3a6a34'),sk=rgb('#6e9e52');P.push(part(m=>{m.lathe(0,.35,0,[[0,1.55],[.15,1.6],[.35,1.5],[.7,1.25],[1.05,.85],[1.3,.4],[1.38,0]],10,'shell',null,1,1.1);
      m.lathe(0,.2,0,[[0,1.45],[.18,1.58]],10,'white',rgb('#c8b878'),1,1.1);for(let i=0;i<6;i++){const a=i/6*6.283;m.sphere(Math.cos(a)*1.0,1.1,Math.sin(a)*1.1,.32,6,3,'white',[.45,.68,.36],.35);}m.sphere(0,1.62,0,.4,6,3,'white',[.45,.68,.36],.4);
      for(const [x,z] of [[-1.05,-.8],[1.05,-.8],[-1.05,.8],[1.05,.8]]){m.tube([x*.8,.4,z*.8],[x,0,z],.32,.28,7,'white',sk,true);for(let k=-1;k<=1;k++)m.cone(x+k*.12,.05,z+.25*Math.sign(z),.06,.05,0,3,'white',[.9,.9,.8]);}
      m.cone(0,.4,-1.5,.2,.45,0,6,'white',sk);},[0,0,0],'body'),
    part(m=>{m.tube([0,0,-.1],[0,.1,.45],.3,.28,8,'white',sk);m.sphere(0,.15,.6,.36,9,5,'white',sk,.85,1,1.2);m.quad([-.26,.22,.98],[.26,.22,.98],[.26,.48,.98],[-.26,.48,.98],'eyes');
      m.cone(0,.05,.98,.18,0,.0,5,'white',[.9,.85,.6]);m.box(-.25,-.02,.82,.25,.02,1.0,'white',[.3,.4,.25]);},[0,.6,1.35],'head'));}
  return P;}
function propModel(t){const P=[];
  if(t=='coin')P.push(part(m=>{m.cone(0,-.25,0,.3,.25,.3,8,'gold');m.disc(0,.25,0,.3,8,'gold');m.disc(0,-.25,0,.3,8,'gold',null,true);},[0,0,0]));
  else if(t=='heart')P.push(part(m=>{const c=rgb('#e83048');m.box(-.3,0,-.08,0,.3,.08,'white',c);m.box(0,0,-.08,.3,.3,.08,'white',c);m.box(-.2,-.25,-.08,.2,0,.08,'white',c);m.box(-.08,-.4,-.08,.08,-.25,.08,'white',c);},[0,0,0]));
  else if(t=='key')P.push(part(m=>{const c=rgb('#f2c14e');m.box(-.06,-.35,-.04,.06,.25,.04,'white',c);m.box(-.2,.2,-.04,.2,.5,.04,'white',c);m.box(.06,-.3,-.04,.2,-.2,.04,'white',c);},[0,0,0]));
  else if(t=='keystone')P.push(part(m=>{m.box(-.4,-.4,-.25,.4,.4,.25,'keystone');},[0,0,0]));
  else if(t=='chest'){P.push(part(m=>m.box(-.6,0,-.42,.6,.6,.42,{top:'wood',side:'chest'}),[0,0,0],'base'),part(m=>m.box(-.62,0,-.44,.62,.32,.44,{top:'wood',side:'wood'}),[0,.6,-.42],'lid'));}
  else if(t=='bush')P.push(part(m=>{m.cone(0,0,0,.85,.7,.95,6,'leaves2');m.cone(0,.7,0,.95,1.2,.2,6,'leaves2');},[0,0,0]));
  else if(t=='rubble')P.push(part(m=>{m.cone(-.3,0,0,.7,.9,.2,5,'rock');m.cone(.4,0,.2,.6,.7,.1,5,'rock');m.cone(0,0,-.3,.5,1.1,0,5,'rock');},[0,0,0]));
  else if(t=='lock')P.push(part(m=>m.box(-TS/2,0,-.3,TS/2,3.2,.3,{top:'wood',side:'lock'}),[0,0,0]));
  else if(t=='crack')P.push(part(m=>m.box(-TS/2,0,-TS/2,TS/2,4,TS/2,{top:'black',side:'crack'}),[0,0,0]));
  else if(t=='bomb')P.push(part(m=>{m.cone(0,0,0,.35,.7,.35,8,'wood');m.disc(0,.7,0,.35,8,'wood');m.box(-.03,.7,-.03,.03,.95,.03,'white',rgb('#f2c14e'));},[0,0,0]));
  else if(t=='trash')P.push(part(m=>{m.box(-.22,0,-.15,.22,.5,.15,'paper');m.box(-.1,.5,-.05,.1,.6,.05,'white',rgb('#3ac2e8'));},[0,0,0]));
  else if(t=='shadow')P.push(part(m=>m.disc(0,.03,0,.55,8,'black'),[0,0,0]));
  return P;}
function getModel(key,build){return MODELS[key]||(MODELS[key]=build());}
