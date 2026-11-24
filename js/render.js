"use strict";
/* River City Quest 3D: the PS1 look. Everything renders into a 320x240 buffer with no filtering,
   vertices snap to that pixel grid (the wobble), textures map without perspective correction
   (the warp), colors are dithered down to 15 bits, and fog hides the short draw distance. */
const RW=320,RH=240;
let gl=null,prog=null,blitProg=null,fbo=null,fboTex=null,atlasTex=null,waterTex=null,foamTex=null,U={},sceneGL=null,dynBuf=null,quadVAO=null;
const VS=`#version 300 es
precision highp float;
in vec3 aPos;in vec2 aUV;in vec3 aCol;
uniform mat4 uPV,uModel;uniform vec2 uRes;uniform float uAmb;uniform vec4 uL[8];uniform vec3 uLC[8];uniform int uNL;uniform vec3 uTint;uniform vec2 uFog;uniform float uSnap;
out vec3 vUVW;out vec3 vCol;out float vFog;
void main(){vec4 wp=uModel*vec4(aPos,1.);vec4 c=uPV*wp;
  if(c.w>0.&&uSnap>0.){vec2 g=uRes*.5;c.xy=floor(c.xy/c.w*g+.5)/g*c.w;}
  gl_Position=c;vUVW=vec3(aUV*c.w,c.w);
  vec3 l=vec3(0.);for(int i=0;i<8;i++){if(i>=uNL)break;float d=distance(wp.xyz,uL[i].xyz);l+=uLC[i]*max(0.,1.-d/uL[i].w);}
  vCol=aCol*uTint*(uAmb+l);vFog=clamp((c.w-uFog.x)/(uFog.y-uFog.x),0.,1.);}`;
const FS=`#version 300 es
precision mediump float;
in vec3 vUVW;in vec3 vCol;in float vFog;uniform sampler2D uTex;uniform vec2 uOff;uniform vec3 uFogCol;uniform float uAlpha,uFlash,uAdd;
out vec4 o;
const float B[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
void main(){vec2 uv=vUVW.xy/vUVW.z+uOff;vec4 t=texture(uTex,uv);if(t.a<.5&&uAdd<.5)discard;
  vec3 c=t.rgb*vCol;if(uAdd>.5){o=vec4(t.rgb*vCol*t.a,1.);return;}
  c=mix(c,uFogCol,vFog);c=mix(c,vec3(1.),uFlash);
  ivec2 p=ivec2(gl_FragCoord.xy)%4;float b=B[p.y*4+p.x]/16.-.47;c+=b/24.;c=floor(c*31.+.5)/31.;o=vec4(c,uAlpha);}`;
const BVS=`#version 300 es
in vec2 aP;out vec2 vU;void main(){vU=aP*.5+.5;gl_Position=vec4(aP,0.,1.);}`;
const BFS=`#version 300 es
precision mediump float;in vec2 vU;uniform sampler2D uTex;uniform float uFade;uniform vec3 uFadeCol;out vec4 o;void main(){vec3 c=texture(uTex,vU).rgb;o=vec4(mix(c,uFadeCol,uFade),1.);}`;
function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function mkProg(v,f){const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function texFrom(cv,repeat){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  const w=repeat?gl.REPEAT:gl.CLAMP_TO_EDGE;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,w);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,w);return t;}
function initGL(canvas){gl=canvas.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:false});if(!gl)return false;
  prog=mkProg(VS,FS);blitProg=mkProg(BVS,BFS);
  for(const n of ['uPV','uModel','uRes','uAmb','uNL','uTint','uFog','uSnap','uTex','uOff','uFogCol','uAlpha','uFlash','uAdd'])U[n]=gl.getUniformLocation(prog,n);
  U.uL=gl.getUniformLocation(prog,'uL');U.uLC=gl.getUniformLocation(prog,'uLC');
  atlasTex=texFrom(makeAtlas());waterTex=texFrom(makeWaterTex(),true);foamTex=texFrom(makeFoamTex(),true);
  fboTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,fboTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,RW,RH,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,RW,RH);
  fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,fboTex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
  quadVAO=gl.createVertexArray();gl.bindVertexArray(quadVAO);const qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
  const la=gl.getAttribLocation(blitProg,'aP');gl.enableVertexAttribArray(la);gl.vertexAttribPointer(la,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
  dynBuf=mkVAO(null,true);return true;}
function mkVAO(m,dynamic){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const bufs=[];
  for(const [name,size,key] of [['aPos',3,'pos'],['aUV',2,'uv'],['aCol',3,'col']]){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);if(m)gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(m[key]),gl.STATIC_DRAW);
    const l=gl.getAttribLocation(prog,name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);bufs.push(b);}
  gl.bindVertexArray(null);return{vao,bufs,n:m?m.count:0};}
function upload(o,m){gl.bindVertexArray(o.vao);[['pos',0],['uv',1],['col',2]].forEach(([k,i])=>{gl.bindBuffer(gl.ARRAY_BUFFER,o.bufs[i]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(m[k]),gl.DYNAMIC_DRAW);});o.n=m.count;gl.bindVertexArray(null);}
function meshGL(m){return m.gl||(m.gl=mkVAO(m));}

/* ---------- matrices (column-major, like WebGL wants) ---------- */
const M4={
  id:()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  mul(a,b){const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;},
  persp(fov,asp,n,f){const t=1/Math.tan(fov/2);return[t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0];},
  look(e,c,u){let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]];let l=Math.hypot(...z);z=z.map(v=>v/l);let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];l=Math.hypot(...x);x=x.map(v=>v/l);
    const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1];},
  tr:(x,y,z)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1],
  ry:a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];},
  rx:a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];},
  rz:a=>{const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1];},
  sc:s=>[s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1]};

/* ---------- per-frame drawing ---------- */
let curSceneId=null,PV=null,camPos=[0,0,0];
function sceneMeshes(){if(curSceneId!==lv.id||!sceneGL||sceneGL.lv!==lv){const b=buildMesh(lv);sceneGL={lv,main:mkVAO(b.main),water:mkVAO(b.water),foam:mkVAO(b.foam)};curSceneId=lv.id;}return sceneGL;}
function setCommon(fogCol,fog,amb,lights){gl.uniform2f(U.uRes,RW,RH);gl.uniform1f(U.uAmb,amb);gl.uniform2f(U.uFog,fog[0],fog[1]);gl.uniform3fv(U.uFogCol,fogCol);gl.uniform1f(U.uSnap,1);
  gl.uniform1f(U.uAlpha,1);gl.uniform1f(U.uFlash,0);gl.uniform1f(U.uAdd,0);gl.uniform2f(U.uOff,0,0);gl.uniform3f(U.uTint,1,1,1);
  const L=new Float32Array(32),LC=new Float32Array(24);lights.slice(0,8).forEach((l,i)=>{L.set([l[0],l[1],l[2],l[3]],i*4);LC.set(l[4],i*3);});
  gl.uniform4fv(U.uL,L);gl.uniform3fv(U.uLC,LC);gl.uniform1i(U.uNL,Math.min(8,lights.length));}
function drawVAO(o,model,tex,opt){if(!o.n)return;gl.uniformMatrix4fv(U.uModel,false,model||M4.id());gl.bindTexture(gl.TEXTURE_2D,tex||atlasTex);
  if(opt&&opt.tint)gl.uniform3fv(U.uTint,opt.tint);if(opt&&opt.flash)gl.uniform1f(U.uFlash,opt.flash);if(opt&&opt.off)gl.uniform2fv(U.uOff,opt.off);
  gl.bindVertexArray(o.vao);gl.drawArrays(gl.TRIANGLES,0,o.n);gl.bindVertexArray(null);
  if(opt){if(opt.tint)gl.uniform3f(U.uTint,1,1,1);if(opt.flash)gl.uniform1f(U.uFlash,0);if(opt.off)gl.uniform2f(U.uOff,0,0);}}
function drawModel(parts,base,pose,opt){for(const pt of parts){let m=M4.mul(base,M4.tr(pt.pivot[0],pt.pivot[1],pt.pivot[2]));const ps=pose&&pose[pt.name];
  if(ps){if(ps.t)m=M4.mul(m,M4.tr(ps.t[0],ps.t[1],ps.t[2]));if(ps.y)m=M4.mul(m,M4.ry(ps.y));if(ps.x)m=M4.mul(m,M4.rx(ps.x));if(ps.z)m=M4.mul(m,M4.rz(ps.z));}
  drawVAO(meshGL(pt.mesh),m,atlasTex,opt);}}
function envLook(){const dk=dark();if(lv.room)return{fog:[10,30],fogCol:[.03,.03,.05],amb:.5};
  const day=[.66,.72,.78],night=[.05,.06,.12],dusk=[.62,.45,.42],h=hour(),ds=h>=17&&h<20?Math.sin((h-17)/3*Math.PI):0;
  const fc=day.map((v,i)=>v*(1-dk)+night[i]*dk).map((v,i)=>v*(1-ds*.5)+dusk[i]*ds*.5);return{fog:[14-dk*5,40-dk*12],fogCol:fc,amb:1-dk*.66};}
function lightsNow(){const L=[],dk=lv.room?1:dark();
  if(st.items.lantern&&(dk>.3||lv.room))L.push([p.x,2,p.z,lv.room?11:9,[1,.78,.45].map(v=>v*(p.raise>0?1.3:.9))]);
  for(const b of bombs)if(b.t<20)L.push([b.x,1,b.z,8,[1,.6,.2]]);
  if(dk>.2){const gl=lv.glows.filter(g=>lampLit(g)).map(g=>[g,Math.hypot(g[0]-p.x,g[2]-p.z)]).sort((a,b)=>a[1]-b[1]).slice(0,6);for(const [g] of gl)L.push([g[0],g[1]-.5,g[2],8,[1,.82,.5].map(v=>v*dk)]);}
  return L;}
function lampLit(g){const L=lv.lamps.find(l=>l.tx==g[3]&&l.ty==g[4]);return!L||L.lit;}
function render(fade){const env=envLook();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,RW,RH);gl.clearColor(env.fogCol[0],env.fogCol[1],env.fogCol[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(prog);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(U.uTex,0);
  if(lv&&st&&cam){
    const sx=shake>0?(Math.random()-.5)*shake*.03:0,sy=shake>0?(Math.random()-.5)*shake*.03:0;camPos=[cam.x+sx,cam.y+sy,cam.z];
    PV=M4.mul(M4.persp(1.05,RW/RH,.3,80),M4.look(camPos,[cam.tx,cam.ty,cam.tz],[0,1,0]));gl.uniformMatrix4fv(U.uPV,false,PV);
    setCommon(env.fogCol,env.fog,env.amb,lightsNow());if(flash>0)gl.uniform1f(U.uFlash,flash/12);
    const S=sceneMeshes();drawVAO(S.main);drawVAO(S.water,null,waterTex,{off:[frame*.0012,frame*.0007]});drawVAO(S.foam,null,foamTex,{off:[0,-frame*.012]});
    drawEntities();drawBillboards(env);}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.canvas.width,gl.canvas.height);gl.disable(gl.DEPTH_TEST);gl.useProgram(blitProg);gl.bindTexture(gl.TEXTURE_2D,fboTex);
  gl.uniform1i(gl.getUniformLocation(blitProg,'uTex'),0);gl.uniform1f(gl.getUniformLocation(blitProg,'uFade'),fade||0);gl.uniform3f(gl.getUniformLocation(blitProg,'uFadeCol'),0,0,0);
  gl.bindVertexArray(quadVAO);gl.drawArrays(gl.TRIANGLES,0,6);gl.bindVertexArray(null);}
function shadowAt(x,z,s){const sh=getModel('shadow',()=>propModel('shadow'));gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(U.uAlpha,.4);gl.depthMask(false);
  drawModel(sh,M4.mul(M4.tr(x,0,z),M4.sc(s||1)));gl.uniform1f(U.uAlpha,1);gl.depthMask(true);gl.disable(gl.BLEND);}
function humanPose(walk,moving,extra){const s=moving?Math.sin(walk)*.7:0;return Object.assign({legL:{x:s},legR:{x:-s},armL:{x:-s*.8,z:-.12},armR:{x:s*.8,z:.12},body:{t:[0,moving?Math.abs(Math.cos(walk))*.06:0,0]}},extra||{});}
function npcModel(n){return getModel('npc:'+n.who+':'+n.tx+','+n.ty,()=>{const h=hash(n.tx,n.ty,n.who.length),skins=['#e8b890','#c08860','#8a5a3a','#f0c8a0'],pants=['#3c3c54','#5a4a3a','#2e3a5e','#4a4a4a'];
  const capless=h%3!=1,style=['short','long','bun','short','long'][(h>>7)%5];return humanoid({hat:n.hat?n.hat[0]:'#6a4020',shirt:n.shirt?n.shirt[0]:'#58a850',skin:skins[h%4],pants:pants[(h>>3)%4],hair:['#3a2414','#1a1410','#c89048','#7a4a24','#8a8a90'][(h>>5)%5],capless,style,skirt:style!='short'&&(h>>9)%2==0,wide:.92+((h>>11)%4)*.05});});}
function drawEntities(){
  // the player
  const P=getModel('player:'+(st.gold?1:0),()=>humanoid({hat:'#e83048',shirt:'#3d63c8',skin:'#e8b890',pants:'#3c3c54',hair:'#6a3a1e',paddle:true}));
  if(mode!='title'&&(!(p.inv>0&&(frame>>2)&1)||deathT>0)){const sw=p.swing>0?(18-p.swing)/18:0,ex={};
    if(p.swing>0)ex.armR={x:-1.5,y:1.6-sw*3.4};if(p.raise>0){ex.armL={x:-2.6};p.raise--;}if(p.hold>0){ex.armL={x:-2.9};ex.armR={x:-2.9};}
    let base=M4.mul(M4.tr(p.x,0,p.z),M4.ry(p.yaw));if(deathT>0)base=M4.mul(base,M4.rx(-Math.min(1.5,(90-deathT)/20)));
    shadowAt(p.x,p.z);drawModel(P,base,humanPose(p.walk,p.moving,ex));
    if(st.items.lantern&&(st.eq=='lantern'||dark()>.3||lv.room)){const L=getModel('lanternProp',()=>[part(m=>{m.box(-.12,-.3,-.12,.12,0,.12,{top:'black',side:'glass'});m.box(-.03,0,-.03,.03,.12,.03,'black');},[0,0,0])]);
      const arm=p.raise>0||p.hold>0?M4.mul(M4.tr(-.37,1.5,0),M4.rx(-2.6)):M4.mul(M4.tr(-.37,1.5,0),M4.rx(p.moving?-Math.sin(p.walk)*.56:0));drawModel(L,M4.mul(M4.mul(base,arm),M4.tr(0,-.75,0)),null,{tint:[1.4,1.3,1.1]});}
    if(p.hold>0&&p.holdIc){const k=p.holdIc=='keystone'?'keystone':p.holdIc=='key'?'key':p.holdIc=='lantern'?'lanternProp':p.holdIc=='powder'?'bomb':'coin';
      const im=getModel(k,()=>propModel(k));if(im&&im.length)drawModel(im,M4.mul(M4.tr(p.x,2.6+Math.sin(frame*.1)*.08,p.z),M4.ry(frame*.05)));}}
  for(const n of npcs){shadowAt(n.x,n.z);drawModel(npcModel(n),M4.mul(M4.tr(n.x,0,n.z),M4.ry(n.yaw)),humanPose(n.walk,n.wander&&!(n.look>0),{}));
    if(n.chal&&!st.pins[n.chal]&&(frame>>4)&1){const im=getModel('coin',()=>propModel('coin'));drawModel(im,M4.mul(M4.tr(n.x,2.7,n.z),M4.mul(M4.ry(frame*.06),M4.sc(.7))));}}
  for(const e of enemies){const t=e.type,m=getModel('en:'+t,()=>enemyModel(t)),pose={};let base=M4.mul(M4.tr(e.x,e.y,e.z),M4.ry(e.yaw));
    if(t=='rat')pose.tail={y:Math.sin(e.t*.3)*.5};if(t=='bat'){pose.wingL={z:Math.sin(e.t*.5)*.8};pose.wingR={z:-Math.sin(e.t*.5)*.8};}if(t=='goose')pose.neck={x:Math.sin(e.t*.1)*.3};
    if(t=='crab'){pose.clawL={x:Math.sin(e.t*.2)*.4};pose.clawR={x:-Math.sin(e.t*.2)*.4};}
    if(t=='turtle'){base=M4.mul(base,M4.sc(1.25));if(e.state=='stun')base=M4.mul(M4.mul(base,M4.tr(0,1.4,0)),M4.rz(Math.PI));pose.head={t:[0,0,e.state=='stun'?-.6:0]};if(e.state=='wind')base=M4.mul(base,M4.tr(Math.sin(e.st)*.08,0,0));}
    if(e.dead)base=M4.mul(base,M4.sc(Math.max(.01,e.fade/40)));
    if(t!='bat'&&t!='ghost')shadowAt(e.x,e.z,t=='turtle'?2.6:.9);drawModel(m,base,pose,e.flash>0&&(e.flash>>1)&1?{flash:.8}:null);}
  for(const c of chests){if(!chestVisible(c))continue;const m=getModel('chest',()=>propModel('chest'));drawModel(m,M4.tr(c.x,0,c.z),{lid:{x:c.open?-1.9:0}});}
  for(const k of picks){const m=getModel(k.kind,()=>propModel(k.kind));if(!m.length)continue;if(k.life<120&&(frame>>2)&1)continue;shadowAt(k.x,k.z,.5);drawModel(m,M4.mul(M4.tr(k.x,k.y+Math.sin(k.t*.08)*.1,k.z),M4.ry(k.t*.06)));}
  for(const b of bombs){const m=getModel('bomb',()=>propModel('bomb'));drawModel(m,M4.mul(M4.tr(b.x,0,b.z),M4.sc(1+(b.t<30?Math.sin(b.t)*.08:0))),null,b.t<40&&(b.t>>2)&1?{flash:.6}:null);}
  for(const o of lv.dyn){if(!o.on)continue;const m=getModel(o.kind,()=>propModel(o.kind));let base;
    if(o.kind=='lock'){const [a,b2]=o.cells[0],[c2,d2]=o.cells[o.cells.length-1],horiz=b2==d2;base=M4.mul(M4.tr(((a+c2)/2+.5)*TS,0,((b2+d2)/2+.5)*TS),horiz?M4.mul(M4.ry(0),M4.sc(1)):M4.ry(Math.PI/2));
      if(horiz)base=M4.mul(base,[2,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);drawModel(m,base);}
    else if(o.kind=='crack'){for(const [a,b2] of o.cells)drawModel(m,M4.tr(a*TS+TS/2,0,b2*TS+TS/2));}
    else drawModel(m,M4.tr(o.tx*TS+TS/2,0,o.ty*TS+TS/2));}}
function drawBillboards(env){const m=new Mesh(),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
  const bb=(x,y,z,s,cell,col)=>m.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],cell,col);
  for(const q of parts)bb(q.x,q.y,q.z,.09,'white',rgb(q.c));
  gl.uniform1f(U.uSnap,1);upload(dynBuf,m);drawVAO(dynBuf);
  const g=new Mesh(),dk=lv.room?.6:dark();
  if(dk>.15)for(const gg of lv.glows)if(lampLit(gg)){const s=1.3,[x,y,z]=gg;g.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],'lampglow',[dk,dk,dk]);}
  if(st.items.lantern&&(dk>.3||lv.room)){const s=.7,x=p.x,y=1.2,z=p.z;g.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],'lampglow',[.8,.7,.5]);}
  for(const b of bombs)if(b.t<6){const s=3,x=b.x,y=1,z=b.z;g.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],'lampglow',[1,.7,.3]);}
  if(g.count){gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.uniform1f(U.uAdd,1);gl.uniform2f(U.uFog,999,1000);upload(dynBuf,g);drawVAO(dynBuf);gl.uniform1f(U.uAdd,0);gl.depthMask(true);gl.disable(gl.BLEND);gl.uniform2f(U.uFog,env.fog[0],env.fog[1]);}}
function project(x,y,z){if(!PV)return null;const v=[x,y,z,1],o=[0,0,0,0];for(let i=0;i<4;i++)o[i]=PV[i]*v[0]+PV[4+i]*v[1]+PV[8+i]*v[2]+PV[12+i];if(o[3]<=0)return null;return[(o[0]/o[3]*.5+.5)*RW,(1-(o[1]/o[3]*.5+.5))*RH];}
