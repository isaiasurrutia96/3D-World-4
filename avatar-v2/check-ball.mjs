// Checks the joint balls (ball-shape.js): exact triangle counts, sealed and
// outward, every point on the sphere, and how round and even each one is.
// Usage: node avatar-v2/check-ball.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {buildBall,BALL_OPTIONS,BALL_RADIUS} from './ball-shape.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a);

check('options: 300, 400 and 500 triangles, at the approved ball size (90.7 mm)',()=>{
 assert.deepEqual(BALL_OPTIONS.map(o=>o.triangles),[300,400,500]);assert.equal(BALL_RADIUS,.0907);
 assert.equal(new Set(BALL_OPTIONS.map(o=>o.id)).size,3);return BALL_OPTIONS.map(o=>o.id).join(', ');
});
check('bad requests are refused (odd, too few, no size)',()=>{
 assert.throws(()=>buildBall({radius:.1,triangles:301}),/even/);assert.throws(()=>buildBall({radius:.1,triangles:4}),/8 or more/);
 assert.throws(()=>buildBall({radius:0,triangles:300}),/radius/);return 'all refused';
});

const sagittas=[];
for(const option of BALL_OPTIONS){
 const {positions,normals,index}=buildBall({radius:BALL_RADIUS,triangles:option.triangles});
 const P=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]],name=option.label;
 check(`${name}: exactly ${option.triangles} triangles`,()=>{assert.equal(index.length/3,option.triangles);return index.length/3+' triangles, '+positions.length/3+' points';});
 check(`${name}: sealed and consistent (every edge shared by two triangles, none flipped)`,()=>{
  const edges=new Map(),directed=new Set();
  for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){const a=index[i+k],b=index[i+(k+1)%3],key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);const d=a+'>'+b;assert(!directed.has(d),'flipped');directed.add(d);}
  assert([...edges.values()].every(n=>n===2),'open edge');return edges.size+' edges';
 });
 check(`${name}: every triangle faces outward`,()=>{
  for(let i=0;i<index.length;i+=3){const a=P(index[i]),b=P(index[i+1]),c=P(index[i+2]),n=cross(sub(b,a),sub(c,a));assert(dot(n,a)>0,'inward triangle '+i/3);}
  return 'all outward';
 });
 check(`${name}: every point exactly on the ball, and its shading direction points straight out`,()=>{
  let worst=0;for(let i=0;i<positions.length/3;i++){worst=Math.max(worst,Math.abs(len(P(i))-BALL_RADIUS));const n=[normals[3*i],normals[3*i+1],normals[3*i+2]];assert(Math.abs(len(n)-1)<1e-9&&dot(n,P(i))>0);}
  assert(worst<1e-9,'off by '+worst);return 'within '+worst.toExponential(1)+' m';
 });
 check(`${name}: round and even (flat faces sit close to the true sphere; triangles similar in size)`,()=>{
  // Sagitta: how far the middle of the flattest triangle sinks below the true
  // sphere. Evenness: largest triangle area divided by the smallest.
  let sag=0,amin=Infinity,amax=0;
  for(let i=0;i<index.length;i+=3){const a=P(index[i]),b=P(index[i+1]),c=P(index[i+2]),n=cross(sub(b,a),sub(c,a)),area=len(n)/2;
   sag=Math.max(sag,BALL_RADIUS-dot(n,a)/len(n));amin=Math.min(amin,area);amax=Math.max(amax,area);}
  sagittas.push(sag);assert(amax/amin<2.5,'uneven: '+(amax/amin).toFixed(2));
  return `flattest face sinks ${(sag*1000).toFixed(2)} mm; sizes within ×${(amax/amin).toFixed(2)}`;
 });
}
check('more triangles means a rounder ball (300 → 400 → 500)',()=>{assert(sagittas[0]>sagittas[1]&&sagittas[1]>sagittas[2]);return sagittas.map(s=>(s*1000).toFixed(2)+' mm').join(' → ');});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: all three balls have exact counts, are sealed, round and even.');
process.exitCode=failed?1:0;
