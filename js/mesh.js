"use strict";
/* River City Quest 3D: geometry. Everything is built from textured, vertex-colored quads and
   triangles, the way PS1 games were: chunky shapes, one small texture cell per face, light baked
   into the vertex colors. A tile of the 2D map is TS world units across. */
const TS=2;
const CELLS=['grass','grass2','flowers','dirt','sand','cobble','sidewalk','steps','rails','planks','brick','brickwin','brickwin2','storefront','roof','stone',
  'stonewall','marble','column','white','door','doorlit','bark','leaves','leaves2','rock','fence','floor','qwall','rubble','sign','gold','glass','wood','black','clock',
  'copper','chest','face','eyes','awning','awning2','sign2','grille','tuft','bloom','worn','pigeon','hair','shell','lock','crack','tin','clap','clap2','water','foam','keystone','paper','lampglow','sky'];
const CELL={};CELLS.forEach((n,i)=>CELL[n]=i);
const ATLAS_N=16,ATLAS_PX=32;
function cellUV(name){const i=CELL[name]==null?CELL.white:CELL[name],cx=i%ATLAS_N,cy=(i/ATLAS_N)|0,e=.5/(ATLAS_N*ATLAS_PX),s=1/ATLAS_N;
  return[cx*s+e,cy*s+e,(cx+1)*s-e,(cy+1)*s-e];}
class Mesh{
  constructor(){this.pos=[];this.uv=[];this.col=[];this.sw=[];this.swayV=0;}
  get count(){return this.pos.length/3;}
  tri(a,b,c,ua,ub,uc,ca,cb,cc){for(const [p,u,k] of [[a,ua,ca],[b,ub,cb],[c,uc,cc]]){this.pos.push(p[0],p[1],p[2]);this.uv.push(u[0],u[1]);this.col.push(k[0],k[1],k[2]);this.sw.push(this.swayV);}}
  // a quad a-b-c-d (counter-clockwise seen from the front) showing one atlas cell
  quad(a,b,c,d,cell,col,shade){const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1],s=shade==null?1:shade,K=[k[0]*s,k[1]*s,k[2]*s];
    this.tri(a,b,c,[u0,v1],[u1,v1],[u1,v0],K,K,K);this.tri(a,c,d,[u0,v1],[u1,v0],[u0,v0],K,K,K);}
  // a wall from (x0,z0) to (x1,z1), from y0 up to y1, tiled one cell per TS x TS, facing to the left of the direction
  wall(x0,z0,x1,z1,y0,y1,cell,col,shade,cellFn){const len=Math.hypot(x1-x0,z1-z0),nx=Math.max(1,Math.round(len/TS)),ny=Math.max(1,Math.round((y1-y0)/TS));
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const a=i/nx,b=(i+1)/nx,ya=y0+(y1-y0)*j/ny,yb=y0+(y1-y0)*(j+1)/ny,
      xa=x0+(x1-x0)*a,za=z0+(z1-z0)*a,xb=x0+(x1-x0)*b,zb=z0+(z1-z0)*b;
      this.quad([xa,ya,za],[xb,ya,zb],[xb,yb,zb],[xa,yb,za],cellFn?cellFn(i,j,nx,ny):cell,col,shade);}}
  // a horizontal rectangle at height y, tiled
  floor(x0,z0,x1,z1,y,cell,col,shade,down){const nx=Math.max(1,Math.round((x1-x0)/TS)),nz=Math.max(1,Math.round((z1-z0)/TS));
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const xa=x0+(x1-x0)*i/nx,xb=x0+(x1-x0)*(i+1)/nx,za=z0+(z1-z0)*j/nz,zb=z0+(z1-z0)*(j+1)/nz;
      if(down)this.quad([xa,y,za],[xb,y,za],[xb,y,zb],[xa,y,zb],cell,col,shade);else this.quad([xa,y,zb],[xb,y,zb],[xb,y,za],[xa,y,za],cell,col,shade);}}
  // an axis-aligned box. cells: {top,side,bottom} or one name. sides can be skipped with skip={n,s,e,w,top,bottom}
  box(x0,y0,z0,x1,y1,z1,cells,col,skip,tile){const c=typeof cells=='string'?{top:cells,side:cells,bottom:cells}:cells,sk=skip||{},T=tile;
    const W=(a,b,cc,sh)=>{if(T)this.wall(a[0],a[1],b[0],b[1],y0,y1,cc,col,sh);else this.quad([a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],cc,col,sh);};
    if(!sk.s)W([x0,z1],[x1,z1],c.south||c.side,.86);if(!sk.n)W([x1,z0],[x0,z0],c.north||c.side,.62);
    if(!sk.e)W([x1,z1],[x1,z0],c.east||c.side,.74);if(!sk.w)W([x0,z0],[x0,z1],c.west||c.side,.7);
    if(!sk.top){if(T)this.floor(x0,z0,x1,z1,y1,c.top,col,1);else this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],c.top,col,1);}
    if(!sk.bottom)this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],c.bottom||c.side,col,.45);}
  // an n-sided cone or frustum around (x,z)
  cone(x,y0,z,r0,y1,r1,n,cell,col,a0){const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1];a0=a0||0;
    for(let i=0;i<n;i++){const a=a0+i/n*6.283,b=a0+(i+1)/n*6.283,sh=.62+.38*Math.max(0,Math.cos((a+b)/2-2.4)),K=[k[0]*sh,k[1]*sh,k[2]*sh];
      const p0=[x+Math.cos(a)*r0,y0,z+Math.sin(a)*r0],p1=[x+Math.cos(b)*r0,y0,z+Math.sin(b)*r0],q0=[x+Math.cos(a)*r1,y1,z+Math.sin(a)*r1],q1=[x+Math.cos(b)*r1,y1,z+Math.sin(b)*r1];
      if(r1<.001)this.tri(p1,p0,q0,[u1,v1],[u0,v1],[(u0+u1)/2,v0],K,K,K);
      else{this.tri(p1,p0,q0,[u1,v1],[u0,v1],[u0,v0],K,K,K);this.tri(p1,q0,q1,[u1,v1],[u0,v0],[u1,v0],K,K,K);}}}
  disc(x,y,z,r,n,cell,col,down){const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1],c=[(u0+u1)/2,(v0+v1)/2];
    for(let i=0;i<n;i++){const a=i/n*6.283,b=(i+1)/n*6.283,p=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y,z+Math.sin(b)*r];
      const ua=[c[0]+Math.cos(a)*(u1-u0)/2,c[1]+Math.sin(a)*(v1-v0)/2],ub=[c[0]+Math.cos(b)*(u1-u0)/2,c[1]+Math.sin(b)*(v1-v0)/2];
      if(down)this.tri([x,y,z],p,q,c,ua,ub,k,k,k);else this.tri([x,y,z],q,p,c,ub,ua,k,k,k);}}
  // a roof ridge along x or z: a triangular prism
  gable(x0,z0,x1,z1,y0,h,alongX,cell,col,end){const yt=y0+h;
    if(alongX){const zm=(z0+z1)/2;this.quad([x0,y0,z1],[x1,y0,z1],[x1,yt,zm],[x0,yt,zm],cell,col,.95);this.quad([x1,y0,z0],[x0,y0,z0],[x0,yt,zm],[x1,yt,zm],cell,col,.7);
      const [u0,v0,u1,v1]=cellUV(end||cell),k=col||[1,1,1],K=[k[0]*.8,k[1]*.8,k[2]*.8];this.tri([x0,y0,z0],[x0,y0,z1],[x0,yt,zm],[u0,v1],[u1,v1],[(u0+u1)/2,v0],K,K,K);this.tri([x1,y0,z1],[x1,y0,z0],[x1,yt,zm],[u0,v1],[u1,v1],[(u0+u1)/2,v0],K,K,K);}
    else{const xm=(x0+x1)/2;this.quad([x1,y0,z1],[x1,y0,z0],[xm,yt,z0],[xm,yt,z1],cell,col,.85);this.quad([x0,y0,z0],[x0,y0,z1],[xm,yt,z1],[xm,yt,z0],cell,col,.7);
      const [u0,v0,u1,v1]=cellUV(end||cell),k=col||[1,1,1],K=[k[0]*.9,k[1]*.9,k[2]*.9];this.tri([x0,y0,z1],[x1,y0,z1],[xm,yt,z1],[u0,v1],[u1,v1],[(u0+u1)/2,v0],K,K,K);this.tri([x1,y0,z0],[x0,y0,z0],[xm,yt,z0],[u0,v1],[u1,v1],[(u0+u1)/2,v0],K,K,K);}}
  // a smooth round shape spun around a vertical axis: prof is [[y,r],...] from bottom to top.
  // Light is worked out per vertex, so it shades smoothly like Gouraud-lit PS1 models.
  lathe(cx,cy,cz,prof,n,cell,col,sx,sz,cap){sx=sx||1;sz=sz||1;const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1],LX=-.35,LY=.8,LZ=.5,ll=Math.hypot(LX,LY,LZ);
    const V=(i,j)=>{const [y,r]=prof[i],a=j/n*6.283,ca=Math.cos(a),sa=Math.sin(a);const y0=prof[Math.max(0,i-1)][0],y1=prof[Math.min(prof.length-1,i+1)][0],r0=prof[Math.max(0,i-1)][1],r1=prof[Math.min(prof.length-1,i+1)][1];
      let ny=-(r1-r0),nh=(y1-y0)||.001;const l=Math.hypot(ny,nh);ny/=l;nh/=l;const nx=ca*nh,nz=sa*nh,d=Math.max(0,(nx*LX+ny*LY+nz*LZ)/ll),f=.5+.5*d;
      return{p:[cx+ca*r*sx,cy+y,cz+sa*r*sz],c:[k[0]*f,k[1]*f,k[2]*f]};};
    for(let i=0;i<prof.length-1;i++)for(let j=0;j<n;j++){const a=V(i,j),b=V(i,j+1),c=V(i+1,j+1),d=V(i+1,j);
      this.tri(a.p,c.p,b.p,[u0,v1],[u1,v0],[u1,v1],a.c,c.c,b.c);this.tri(a.p,d.p,c.p,[u0,v1],[u0,v0],[u1,v0],a.c,d.c,c.c);}
    if(cap){const t=prof[prof.length-1];if(t[1]>.001)this.disc(cx,cy+t[0],cz,t[1]*Math.max(sx,sz),n,cell,[k[0]*.95,k[1]*.95,k[2]*.95]);const b=prof[0];if(b[1]>.001)this.disc(cx,cy+b[0],cz,b[1]*Math.max(sx,sz),n,cell,[k[0]*.5,k[1]*.5,k[2]*.5],true);}}
  sphere(cx,cy,cz,r,n,rings,cell,col,sy,sx,sz,from,to){const pr=[];from=from==null?0:from;to=to==null?1:to;for(let i=0;i<=rings;i++){const t=from+(to-from)*i/rings,a=-Math.PI/2+t*Math.PI;pr.push([Math.sin(a)*r*(sy||1),Math.cos(a)*r]);}
    this.lathe(cx,cy,cz,pr,n,cell,col,sx,sz);}
  // a round tube from point a to point b (radius r0 at a, r1 at b), with rounded ends if caps
  tube(a,b,r0,r1,n,cell,col,caps){const t=new Mesh(),L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);t.lathe(0,0,0,[[0,r0],[L,r1]],n,cell,col);
    if(caps){t.sphere(0,0,0,r0,n,3,cell,col,1,1,1,0,.5);t.sphere(0,L,0,r1,n,3,cell,col,1,1,1,.5,1);}
    const d=[(b[0]-a[0])/L,(b[1]-a[1])/L,(b[2]-a[2])/L];let ax=[d[2],0,-d[0]];const al=Math.hypot(ax[0],ax[2]);const ang=Math.acos(Math.max(-1,Math.min(1,d[1])));
    if(al<1e-6)ax=[1,0,0];else ax=[ax[0]/al,0,ax[2]/al];const c=Math.cos(ang),s=Math.sin(ang),[kx,ky,kz]=ax;
    for(let i=0;i<t.pos.length;i+=3){const x=t.pos[i],y=t.pos[i+1],z=t.pos[i+2],dot=kx*x+ky*y+kz*z,cx=ky*z-kz*y,cy=kz*x-kx*z,cz=kx*y-ky*x;
      t.pos[i]=x*c+cx*s+kx*dot*(1-c)+a[0];t.pos[i+1]=y*c+cy*s+ky*dot*(1-c)+a[1];t.pos[i+2]=z*c+cz*s+kz*dot*(1-c)+a[2];}
    return this.add(t);}
  add(m){this.pos.push(...m.pos);this.uv.push(...m.uv);this.col.push(...m.col);for(let i=0;i<m.count;i++)this.sw.push(m.sw[i]||this.swayV);return this;}
}
const hash=(a,b,c)=>{let h=(a*374761393+b*668265263+(c||0)*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0);};
const rgb=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
