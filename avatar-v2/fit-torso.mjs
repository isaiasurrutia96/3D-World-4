// New avatar (version 2): makes the one-piece torso (torso.json).
//
// It measures the outer surface of the reference torso (torso-source.json:
// the chest and pelvis from the Game avatar) ring by ring and turns it into
// the numbers torso-shape.js draws. On the way it:
//  1. fills the socket dents (shoulders and hips): each ring takes its outer
//     outline (convex hull), so a dent in the side is bridged;
//  2. removes the line between chest and pelvis: a narrow groove up the body
//     is filled (a "closing" along the height: raise, then lower back);
//  3. smooths lightly so the result reads as one surface.
// The positions of the old sockets are kept only as data (attach points) for
// adding the arms and legs later; nothing is drawn for them.
// Usage: node avatar-v2/fit-torso.mjs
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as T from 'three';
import {buildTorsoSurface,direction} from './torso-shape.js';

// Tuning (all distances in metres).
const SEGMENTS=48;        // directions around the body
const STEP=.004;          // height between measured rings
const OUT_RINGS=40;       // rings kept in the final shape
const GROOVE=.09;         // grooves narrower than this up the body are filled
const SMOOTH_UP=.02;      // smoothing along the height (spread, metres)
const SMOOTH_AROUND=1;    // smoothing around the body (spread, segments)
const CAP_RINGS=7;

const source=JSON.parse(await readFile('avatar-v2/torso-source.json','utf8'));
const meshes=source.parts.map(part=>{
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(part.positions,3));g.setIndex(part.index);
 const m=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}));
 m.position.fromArray(part.position);m.quaternion.fromArray(part.quaternion);m.scale.fromArray(part.scale);m.updateMatrixWorld(true);return m;
});
const box=new T.Box3();for(const m of meshes)box.expandByObject(m);
const cx=(box.min.x+box.max.x)/2,cz=(box.min.z+box.max.z)/2,yMin=box.min.y,yMax=box.max.y;

// 1. Measure: from outside, look inward along each direction; the first hit is
// the outer surface. Then take each ring's outer outline (convex hull).
const ray=new T.Raycaster(),origin=new T.Vector3(),dirV=new T.Vector3();
function hull(points){// Andrew's monotone chain, counter-clockwise
 const p=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p;
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const lower=[],upper=[];
 for(const q of p){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),q)<=0)lower.pop();lower.push(q);}
 for(const q of p.reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),q)<=0)upper.pop();upper.push(q);}
 return lower.slice(0,-1).concat(upper.slice(0,-1));
}
function radiusOnHull(poly,dx,dz){// distance from the centre to the outline along (dx,dz)
 let best=0;
 for(let i=0;i<poly.length;i++){
  const [ax,az]=poly[i],[bx,bz]=poly[(i+1)%poly.length],ex=bx-ax,ez=bz-az,den=dx*ez-dz*ex;
  if(Math.abs(den)<1e-12)continue;
  const t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;
  if(t>0&&u>=-1e-9&&u<=1+1e-9)best=Math.max(best,t);
 }
 return best;
}
const fine=[];
for(let y=yMin+STEP/2;y<yMax;y+=STEP){
 const pts=[];
 for(let s=0;s<SEGMENTS*4;s++){// measure 4x finer than the final directions
  const [dx,dz]=direction(s,SEGMENTS*4);
  origin.set(cx+dx,y,cz+dz);dirV.set(-dx,0,-dz);ray.set(origin,dirV);
  const hit=ray.intersectObjects(meshes,false)[0];if(hit)pts.push([hit.point.x-cx,hit.point.z-cz]);
 }
 if(pts.length<8)continue;// too close to an end to have an outline
 const poly=hull(pts);fine.push({y,r:Array.from({length:SEGMENTS},(_,s)=>radiusOnHull(poly,...direction(s,SEGMENTS)))});
}
// Below the top of the old hip sockets the outline is mostly holes, so those
// rings are dropped and the bottom cap rounds the torso off as a bowl instead.
const hipTop=Math.max(...source.parts.flatMap(p=>p.sockets).filter(s=>/thigh/.test(s.bone)).map(s=>s.center[1]+s.radius));
fine.splice(0,fine.findIndex(r=>r.y>=hipTop));
assert(fine.length>20,'Too few rings measured');

// 2. Fill narrow grooves along the height: largest value nearby, then smallest.
const window=Math.max(1,Math.round(GROOVE/STEP/2));
const filter=(values,pick)=>values.map((_,i)=>pick(...values.slice(Math.max(0,i-window),i+window+1)));
for(let s=0;s<SEGMENTS;s++){
 const column=fine.map(r=>r.r[s]),closed=filter(filter(column,Math.max),Math.min);
 // Keep the original near the ends, where "closing" would cut the rounding off.
 closed.forEach((v,i)=>{if(i>=window&&i<fine.length-window)fine[i].r[s]=v;});
}

// 3. Smooth along the height, then around the body (Gaussian).
function gaussian(values,sigma,wrap){
 if(sigma<=0)return values;const reach=Math.ceil(sigma*3),n=values.length;
 return values.map((_,i)=>{let sum=0,w=0;for(let k=-reach;k<=reach;k++){let j=i+k;if(wrap)j=(j%n+n)%n;else if(j<0||j>=n)continue;const g=Math.exp(-k*k/(2*sigma*sigma));sum+=values[j]*g;w+=g;}return sum/w;});
}
for(let s=0;s<SEGMENTS;s++){const smooth=gaussian(fine.map(r=>r.r[s]),SMOOTH_UP/STEP,false);fine.forEach((r,i)=>r.r[s]=smooth[i]);}
for(const ring of fine)ring.r=gaussian(ring.r,SMOOTH_AROUND,true);

// Keep OUT_RINGS evenly spaced rings (linear between measured rings).
const rings=Array.from({length:OUT_RINGS},(_,k)=>{
 const f=k/(OUT_RINGS-1)*(fine.length-1),i=Math.min(fine.length-2,Math.floor(f)),t=f-i;
 return {y:+(fine[i].y+(fine[i+1].y-fine[i].y)*t).toFixed(5),r:fine[i].r.map((r,s)=>+(r+(fine[i+1].r[s]-r)*t).toFixed(5))};
});
const shape={center:[+cx.toFixed(5),+cz.toFixed(5)],segments:SEGMENTS,capRings:CAP_RINGS,bottom:{y:+yMin.toFixed(5)},top:{y:+yMax.toFixed(5)},rings};
const surface=buildTorsoSurface(shape);

// Report: how far the new surface is from the old outer surface, away from
// the sockets and the seam (where it is meant to differ).
// The sockets are open cups much wider than their balls, so skip 2.2 radii.
const near=(p,c,r)=>Math.hypot(p[0]-c[0],p[1]-c[1],p[2]-c[2])<r*2.2;
const sockets=source.parts.flatMap(p=>p.sockets);
// The seam: from the pelvis top down a groove's width.
const pelvisTop=Math.max(...source.parts.find(p=>p.name==='pelvis').positions.filter((_,i)=>i%3===1)),seamY=[pelvisTop-GROOVE,pelvisTop+GROOVE];
let worst=0,sum=0,count=0;
const v=new T.Vector3();
for(let i=0;i<surface.positions.length;i+=3){
 const p=surface.positions.slice(i,i+3);if(sockets.some(s=>near(p,s.center,s.radius))||(p[1]>seamY[0]&&p[1]<seamY[1])||p[1]>yMax-.012)continue;// top rim checked by eye
 const dx=p[0]-cx,dz=p[2]-cz,len=Math.hypot(dx,dz);if(len<.02)continue;
 origin.set(cx+dx/len,p[1],cz+dz/len);dirV.set(-dx/len,0,-dz/len);ray.set(origin,dirV);
 const hit=ray.intersectObjects(meshes,false)[0];if(!hit)continue;
 const d=Math.abs(Math.hypot(hit.point.x-cx,hit.point.z-cz)-len);worst=Math.max(worst,d);sum+=d;count++;
}
const torso={version:2,kind:'torso-shape',source:{reference:'avatar-v2/torso-source.json',avatar:source.source.avatar},
 color:source.parts[0].color,roughness:source.parts[0].roughness,
 triangles:surface.index.length/3,
 // Where the arms and legs will attach (centre and radius of the old balls).
 attach:sockets,
 shape};
await writeFile('avatar-v2/torso.json',JSON.stringify(torso)+'\n');
console.log(`torso: ${fine.length} rings measured, ${OUT_RINGS} kept, ${SEGMENTS} directions, ${torso.triangles} triangles`);
console.log(`difference from the old outer surface (away from sockets and seam): average ${(sum/count*1000).toFixed(1)} mm, largest ${(worst*1000).toFixed(1)} mm`);
