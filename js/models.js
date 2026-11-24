"use strict";
/* River City Quest 3D: low-poly models made of boxes, each part with a pivot so it can swing.
   The front of every model faces +z when its yaw is 0. */
const MODELS={};
function part(build,pivot,name){const m=new Mesh();build(m);return{mesh:m,pivot:pivot||[0,0,0],name:name||''};}
function shadeHex(h,f){const c=rgb(h);return[c[0]*f,c[1]*f,c[2]*f];}
function humanoid(o){const sk=rgb(o.skin||'#e8b890'),sh=rgb(o.shirt||'#3d63c8'),pa=rgb(o.pants||'#3c3c54'),ha=rgb(o.hat||'#6a4020'),hair=rgb(o.hair||'#3a2414');
  const P=[part(m=>{m.box(-.3,.92,-.17,.3,1.62,.17,'white',sh);m.box(-.31,.92,-.18,.31,1.0,.18,'white',pa);},[0,0,0],'body'),
    part(m=>{m.box(-.25,0,-.24,.25,.48,.24,{top:'white',side:'white',south:'face'},sk);m.box(-.27,.38,-.27,.27,.56,.26,'hair',o.capless?hair:ha);
      if(!o.capless)m.box(-.27,.4,.05,.27,.46,.42,'hair',ha);else m.box(-.27,.12,-.27,.27,.4,-.12,'hair',hair);},[0,1.6,0],'head'),
    part(m=>m.box(-.12,-.88,-.12,.12,0,.12,'white',pa),[-.15,.92,0],'legL'),part(m=>m.box(-.12,-.88,-.12,.12,0,.12,'white',pa),[.15,.92,0],'legR'),
    part(m=>{m.box(-.09,-.55,-.09,.09,0,.09,'white',sh);m.box(-.08,-.7,-.08,.08,-.55,.08,'white',sk);},[-.39,1.55,0],'armL'),
    part(m=>{m.box(-.09,-.55,-.09,.09,0,.09,'white',sh);m.box(-.08,-.7,-.08,.08,-.55,.08,'white',sk);if(o.paddle){m.box(-.04,-.75,-.05,.04,-.6,1.2,'wood');m.box(-.03,-.82,1.0,.03,-.52,1.55,'white',rgb(o.gold?'#f2c14e':'#e83048'));}},[.39,1.55,0],'armR')];
  return P;}
function enemyModel(t){const P=[];
  if(t=='rat'){P.push(part(m=>{m.box(-.26,.05,-.42,.26,.42,.36,'white',rgb('#7a7480'));m.box(-.18,.1,.3,.18,.36,.62,{top:'white',side:'white',south:'face'},rgb('#8a8490'));m.box(-.2,.36,.36,-.08,.5,.46,'white',rgb('#e8a0a8'));m.box(.08,.36,.36,.2,.5,.46,'white',rgb('#e8a0a8'));},[0,0,0],'body'),
    part(m=>m.box(-.04,0,-.9,.04,.06,0,'white',rgb('#d89098')),[0,.15,-.4],'tail'));}
  else if(t=='bat'){P.push(part(m=>{m.box(-.2,-.2,-.2,.2,.2,.2,{top:'white',side:'white',south:'face'},rgb('#3a3048'));m.box(-.16,.2,-.05,-.04,.36,.05,'white',rgb('#3a3048'));m.box(.04,.2,-.05,.16,.36,.05,'white',rgb('#3a3048'));},[0,0,0],'body'),
    part(m=>{m.quad([0,0,-.25],[0,0,.25],[-.9,.1,.15],[-.9,.1,-.25],'white',rgb('#4a3a5e'));},[-.18,0,0],'wingL'),part(m=>{m.quad([0,0,.25],[0,0,-.25],[.9,.1,-.25],[.9,.1,.15],'white',rgb('#4a3a5e'));},[.18,0,0],'wingR'));}
  else if(t=='goose'){P.push(part(m=>{m.box(-.3,.4,-.5,.3,.9,.4,'white',rgb('#f0ece4'));m.box(-.25,.5,-.7,.25,.85,-.5,'white',rgb('#d8d4cc'));m.box(-.06,0,-.05,-.0,.42,.05,'white',rgb('#f08a30'));m.box(.04,0,-.05,.1,.42,.05,'white',rgb('#f08a30'));},[0,0,0],'body'),
    part(m=>{m.box(-.09,0,-.09,.09,.75,.09,'white',rgb('#2a2a2a'));m.box(-.12,.65,-.12,.12,.9,.16,{top:'white',side:'white',south:'face'},rgb('#2a2a2a'));m.box(-.06,.7,.16,.06,.78,.36,'white',rgb('#f08a30'));m.box(-.1,.4,-.1,.1,.5,.1,'white',rgb('#f4f4f4'));},[0,.8,.3],'neck'));}
  else if(t=='crab'){const c=rgb('#d84830');P.push(part(m=>{m.box(-.45,.15,-.32,.45,.45,.3,{top:'white',side:'white',south:'face'},c);for(const s of [-1,1])for(let i=0;i<3;i++)m.box(s*.45,0,-.25+i*.22,s*.7,.12,-.17+i*.22,'white',shadeHex('#a83020',1));},[0,0,0],'body'),
    part(m=>{m.box(-.14,-.1,0,.14,.15,.36,'white',c);m.box(-.16,-.12,.3,.16,.2,.55,'white',shadeHex('#f05a40',1));},[-.42,.3,.25],'clawL'),part(m=>{m.box(-.14,-.1,0,.14,.15,.36,'white',c);m.box(-.16,-.12,.3,.16,.2,.55,'white',shadeHex('#f05a40',1));},[.42,.3,.25],'clawR'));}
  else if(t=='ghost'){P.push(part(m=>{m.cone(0,0,0,.55,1.4,.35,6,'white',rgb('#c8d8f0'));m.box(-.35,1.3,-.35,.35,1.9,.35,{top:'white',side:'white',south:'face'},rgb('#dce8fa'));},[0,0,0],'body'));}
  else if(t=='turtle'){P.push(part(m=>{m.cone(0,.4,0,1.5,1.3,1.1,8,'shell');m.cone(0,1.3,0,1.1,1.9,0,8,'shell');m.cone(0,.25,0,1.55,.45,1.55,8,'white',rgb('#c8b878'));
      for(const [x,z] of [[-1,-.8],[1,-.8],[-1,.8],[1,.8]])m.box(x-.28,0,z-.28,x+.28,.4,z+.28,'white',rgb('#5a8a44'));},[0,0,0],'body'),
    part(m=>{m.box(-.32,-.25,0,.32,.3,.7,{top:'white',side:'white',south:'face'},rgb('#6e9e52'));m.box(-.3,-.3,.5,.3,-.18,.8,'white',rgb('#3a6a34'));},[0,.6,1.35],'head'));}
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
