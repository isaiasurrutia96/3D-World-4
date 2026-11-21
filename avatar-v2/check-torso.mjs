// Checks the one-piece torso (avatar-v2/torso.json drawn by torso-shape.js)
// and every torso option (torso-variants.js) shown side by side in the Test Lab.
// Usage: node avatar-v2/check-torso.mjs   (npm run test:new-avatar)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildTorsoSurface} from './torso-shape.js';
import {TORSO_OPTIONS,makeTorsoOption,curveAt} from './torso-variants.js';

const torso=JSON.parse(await readFile('avatar-v2/torso.json','utf8'));
const source=JSON.parse(await readFile('avatar-v2/torso-source.json','utf8'));
const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const range=values=>Math.max(...values)-Math.min(...values);
const axis=(positions,k)=>positions.filter((_,i)=>i%3===k);

// The clean torso itself.
check('one piece: a single part with no separate chest and pelvis',()=>{
 assert.equal(torso.kind,'torso-shape');assert(!('parts' in torso),'still has separate parts');return 'one surface';
});
check('same size as the old torso: height and width within 2 cm',()=>{
 const {positions}=buildTorsoSurface(torso.shape),old=source.parts.flatMap(p=>p.positions);
 assert(Math.abs(range(axis(old,1))-range(axis(positions,1)))<.02,'height');assert(Math.abs(range(axis(old,0))-range(axis(positions,0)))<.02,'width');
 return `height ${range(axis(positions,1)).toFixed(3)} m, width ${range(axis(positions,0)).toFixed(3)} m`;
});
check('attach points kept for the arms and legs',()=>{const bones=torso.attach.map(a=>a.bone).sort().join(' ');assert.equal(bones,'thigh.L thigh.R upperArm.L upperArm.R');return bones;});
check('the options list starts with the original, unchanged',()=>{
 assert.equal(TORSO_OPTIONS[0].id,'original');assert.deepEqual(makeTorsoOption(torso.shape,TORSO_OPTIONS[0]).rings.map(r=>r.r),torso.shape.rings.map(r=>r.r.map(v=>+v.toFixed(5))));
 return 'identical to torso.json';
});
check('options: five, each with a unique id, a label and a note',()=>{
 assert.equal(TORSO_OPTIONS.length,5);assert.equal(new Set(TORSO_OPTIONS.map(o=>o.id)).size,5);
 for(const o of TORSO_OPTIONS){assert(o.label&&o.note,o.id);for(const c of [o.width,o.front,o.back])assert(c.every(([h,v],i)=>h>=0&&h<=1&&v>.5&&v<1.5&&(i===0||h>c[i-1][0])),o.id+' curve');assert(o.round>=0&&o.round<=1&&o.square>=0&&o.square<=1,o.id);}
 return TORSO_OPTIONS.map(o=>o.id).join(', ');
});
check('curves are smooth and pass through their points',()=>{
 const c=[[0,1],[.5,1.2],[1,.9]];assert.equal(curveAt(c,0),1);assert.equal(curveAt(c,.5),1.2);assert.equal(curveAt(c,1),.9);assert.equal(curveAt(c,-1),1);assert.equal(curveAt(c,2),.9);
 const mid=curveAt(c,.25);assert(mid>1&&mid<1.2);return 'ok';
});

/**
 * How far the surface sinks in. dent: how far any point of a ring lies inside
 * that ring's convex outline (the tightest outline with no hollows), so a flat
 * side scores 0 and a hollow of any width is caught. groove: a ring sunk below
 * the rings 2 above and 2 below.
 */
function convexOutline(points){// Andrew's monotone chain
 const p=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];
 for(const q of p){while(lo.length>=2&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}
 for(const q of p.reverse()){while(hi.length>=2&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}
 return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function outlineRadius(poly,dx,dz){// distance from the centre to the outline along (dx,dz)
 let best=0;
 for(let i=0;i<poly.length;i++){const [ax,az]=poly[i],[bx,bz]=poly[(i+1)%poly.length],ex=bx-ax,ez=bz-az,den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
  const t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>0&&u>=-1e-9&&u<=1+1e-9)best=Math.max(best,t);}
 return best;
}
function smoothness(shape){
 let dent=0,groove=0;const R=shape.rings,n=shape.segments;
 for(const ring of R){
  const dirs=ring.r.map((_,s)=>[Math.cos(s/n*Math.PI*2),Math.sin(s/n*Math.PI*2)]),hull=convexOutline(ring.r.map((r,s)=>[r*dirs[s][0],r*dirs[s][1]]));
  ring.r.forEach((r,s)=>{dent=Math.max(dent,outlineRadius(hull,...dirs[s])-r);});
 }
 for(let s=0;s<n;s++)for(let i=2;i<R.length-2;i++)groove=Math.max(groove,Math.min(R[i-2].r[s],R[i+2].r[s])-R[i].r[s]);
 return {dent,groove};
}
check('the smoothness test catches a real dent and a real groove (test of the test)',()=>{
 const mid=Math.floor(torso.shape.rings.length/2),narrow=structuredClone(torso.shape),wide=structuredClone(torso.shape),grooved=structuredClone(torso.shape);
 narrow.rings[mid].r[5]-=.02;// 2 cm, one direction wide
 for(let k=-2;k<=2;k++)wide.rings[mid].r[(12+k+48)%48]-=.03*Math.cos(k/3*Math.PI/2)**2;// 3 cm deep, 30° wide, smooth (socket-like hollow)
 for(const s of grooved.rings[mid].r.keys())grooved.rings[mid].r[s]-=.006;
 const a=smoothness(narrow),b=smoothness(wide),g=smoothness(grooved);
 assert(a.dent>=.01,'missed a narrow 2 cm dent ('+(a.dent*1000).toFixed(1)+' mm)');assert(b.dent>=.01,'missed a socket-like 3 cm dent ('+(b.dent*1000).toFixed(1)+' mm)');assert(g.groove>=.003,'missed a 6 mm groove');
 return `narrow dent seen ${(a.dent*1000).toFixed(0)} mm, wide ${(b.dent*1000).toFixed(0)} mm, groove ${(g.groove*1000).toFixed(0)} mm`;
});

// Every option must be a proper, sealed, smooth torso.
const built=TORSO_OPTIONS.map(o=>{const shape=makeTorsoOption(torso.shape,o);return {o,shape,...buildTorsoSurface(shape)};});
const baseHeight=range(axis(built[0].positions,1));
for(const {o,shape,positions,index} of built){
 const name=o.label;
 check(`${name}: every number is real and every radius positive`,()=>{
  assert(positions.every(Number.isFinite));assert(shape.rings.every(r=>r.r.every(v=>Number.isFinite(v)&&v>0)));return positions.length/3+' points';
 });
 check(`${name}: sealed and consistent (no holes, no flipped triangles)`,()=>{
  const edges=new Map(),directed=new Set();
  for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){
   const a=index[i+k],b=index[i+(k+1)%3],key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);
   const d=a+'>'+b;assert(!directed.has(d),'flipped triangle');directed.add(d);
  }
  const bad=[...edges.values()].filter(n=>n!==2).length;assert.equal(bad,0,bad+' open edges');return edges.size+' edges';
 });
 check(`${name}: faces out, torso-sized volume`,()=>{
  let v=0;const p=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]];
  for(let i=0;i<index.length;i+=3){const a=p(index[i]),b=p(index[i+1]),c=p(index[i+2]);v+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
  assert(v>.03&&v<.15,(v*1000).toFixed(1)+' litres');return (v*1000).toFixed(1)+' litres';
 });
 check(`${name}: smooth (no dent over 1 cm around, no groove over 3 mm up)`,()=>{
  const {dent,groove}=smoothness(shape);
  assert(dent<.01,'dent '+(dent*1000).toFixed(1)+' mm');assert(groove<.003,'groove '+(groove*1000).toFixed(1)+' mm');
  return `dent ${(dent*1000).toFixed(1)} mm, groove ${(groove*1000).toFixed(1)} mm`;
 });
 check(`${name}: same height as the original`,()=>{const h=range(axis(positions,1));assert(Math.abs(h-baseHeight)<1e-6);return h.toFixed(3)+' m';});
 check(`${name}: left and right match (mirror within 5 mm)`,()=>{
  // Direction s and its mirror (n/2 - s) must have nearly the same radius.
  let worst=0;const n=shape.segments;for(const ring of shape.rings)for(let s=0;s<n;s++)worst=Math.max(worst,Math.abs(ring.r[s]-ring.r[((n/2-s)%n+n)%n]));
  assert(worst<.005,(worst*1000).toFixed(1)+' mm');return 'within '+(worst*1000).toFixed(1)+' mm';
 });
 check(`${name}: phone-ready (under 6,000 triangles)`,()=>{assert(index.length/3<6000);return index.length/3+' triangles';});
}
check('the options really differ: each pair at least 1.5 cm apart somewhere, 5 mm on average',()=>{
 const out=[];
 for(let i=0;i<built.length;i++)for(let j=i+1;j<built.length;j++){
  let max=0,sum=0,count=0;built[i].shape.rings.forEach((ring,k)=>ring.r.forEach((r,s)=>{const d=Math.abs(r-built[j].shape.rings[k].r[s]);max=Math.max(max,d);sum+=d;count++;}));
  assert(max>=.015&&sum/count>=.005,`${built[i].o.id} and ${built[j].o.id} too alike (${(max*1000).toFixed(0)} mm max, ${(sum/count*1000).toFixed(1)} mm average)`);
  out.push(`${built[i].o.id}/${built[j].o.id} ${(sum/count*1000).toFixed(0)}mm`);
 }
 return out.length+' pairs';
});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the torso and all five options are sealed, smooth, symmetric and distinct.');
process.exitCode=failed?1:0;
