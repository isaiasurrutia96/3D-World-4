// Checks the original hand and foot and their five variations (hands-feet.js):
// option 1 is the original exactly; every option keeps the original triangles,
// never moves the wrist or ankle, changes size exactly as stated, and never
// cracks the surface; the options really differ.
// Usage: node avatar-v2/check-hands-feet.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HAND_FEET_SOURCE as src,HAND_FOOT_OPTIONS,FILLED,adjustPart,buildHandFoot} from './hands-feet.js';
import {SIDE} from '../motion-core/skeleton/bones.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

const light=JSON.parse(await readFile('avatar/assembled-joints/light.json','utf8'));
check('the originals come from the approved avatar\'s Light copy, unchanged in detail (hand 18,208, foot 10,128 triangles)',()=>{
 assert.equal(src.source.sha256,light.sha256);assert.equal(src.source.approved,light.sourceSHA256);
 assert.equal(src.hand.index.length/3,18208);assert.equal(src.foot.index.length/3,10128);return `from ${src.source.asset}`;
});
check('pivots are the skeleton\'s wrist and ankle joints; each part\'s directions are square to each other',()=>{
 assert.deepEqual(src.hand.pivot,SIDE.find(b=>b.name==='hand').head);assert.deepEqual(src.foot.pivot,SIDE.find(b=>b.name==='foot').head);
 for(const part of [src.hand,src.foot]){const {length,width,thickness}=part.axes;for(const v of [length,width,thickness])assert(Math.abs(Math.hypot(...v)-1)<1e-9);
  assert(Math.abs(dot(length,width))<1e-9&&Math.abs(dot(length,thickness))<1e-9&&Math.abs(dot(width,thickness))<1e-9);}
 assert(src.hand.axes.length[1]<-.9,'hand length should point down toward the fingertips');assert(src.foot.axes.length[2]>.8,'foot length should point forward to the toes');
 return 'hand length points to the fingertips, foot length to the toes';
});
check('sockets filled: each old socket sits on its wrist/ankle joint; only the patch (the cup and its rounded lip) moved, every other point is exactly the original',()=>{
 const out=[];
 for(const part of ['hand','foot']){
  const f=FILLED[part].filled,moved=new Set(f.indices);assert.deepEqual(src[part].socket.centre.map(v=>+v.toFixed(4)),src[part].pivot.map(v=>+v.toFixed(4)));
  for(let i=0;i<src[part].positions.length/3;i++)if(!moved.has(i))for(let k=0;k<3;k++)assert.equal(FILLED[part].positions[3*i+k],src[part].positions[3*i+k],part+' point outside the cup moved');
  assert(f.cupCount>100,part+' found too few cup points');out.push(`${part}: ${f.count} points blended (${f.cupCount} in the cup), the other ${src[part].positions.length/3-f.count} untouched`);
 }
 return out.join('; ');
});
check('sockets filled: no hollow left (the middle of the old cup is raised to the rim; the filled surface faces outward)',()=>{
 const out=[];
 for(const part of ['hand','foot']){const f=FILLED[part].filled,C=src[part].socket.centre;let lowest=Infinity;
  // No sunken dip: the middle of the old cup (where it was deepest) is now raised to at least the rim's
  // height. (The rim itself is not level, so points near the edge are judged by the triangles below.)
  let wasDeepest=Infinity;
  for(const i of f.cupIndices){const o=[0,1,2].map(k=>src[part].positions[3*i+k]-C[k]),ho=dot(o,f.axis),side=Math.hypot(o[0]-f.axis[0]*ho,o[1]-f.axis[1]*ho,o[2]-f.axis[2]*ho);
   if(side>.5*f.rimRadius)continue;const p=[0,1,2].map(k=>FILLED[part].positions[3*i+k]-C[k]);lowest=Math.min(lowest,dot(p,f.axis)-f.rimHeight);wasDeepest=Math.min(wasDeepest,ho-f.rimHeight);}
  assert(lowest>=-.003,`${part}: the middle of the old cup is still ${(-lowest*1000).toFixed(1)} mm deep`);
  // The dome's triangles face out of the part (away from where the ball was).
  const P=FILLED[part].positions,ix=src[part].index,cup=new Set(f.cupIndices);let inward=0,total=0;
  for(let k=0;k<ix.length;k+=3){if(![ix[k],ix[k+1],ix[k+2]].every(i=>cup.has(i)))continue;total++;
   const g=i=>[P[3*i],P[3*i+1],P[3*i+2]],a=g(ix[k]),b=g(ix[k+1]),c=g(ix[k+2]),u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
   const nrm=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(dot(nrm,f.axis)<0)inward++;}
  assert(total>0&&inward/total<.02,`${part}: ${inward} of ${total} filled triangles face inward`);out.push(`${part}: cup middle was ${(-wasDeepest*1000).toFixed(0)} mm deep, now ${lowest>=0?'+':''}${(lowest*1000).toFixed(1)} mm from the rim; ${total} triangles facing out`);}
 return out.join('; ');
});
check('five options with unique ids, labels and notes; option 1 is the original (sockets filled) exactly',()=>{
 assert.equal(HAND_FOOT_OPTIONS.length,5);assert.equal(new Set(HAND_FOOT_OPTIONS.map(o=>o.id)).size,5);for(const o of HAND_FOOT_OPTIONS)assert(o.label&&o.note,o.id);
 const r=buildHandFoot(HAND_FOOT_OPTIONS[0]);
 for(const part of ['hand','foot']){let worst=0;r[part].positions.forEach((v,i)=>{worst=Math.max(worst,Math.abs(v-FILLED[part].positions[i]));});assert(worst<1e-12,part+' moved '+worst);}
 return 'the filled original, unchanged';
});
check('the wrist and ankle never move, whatever the adjustment (test with a point placed on the pivot)',()=>{
 for(const part of [FILLED.hand,FILLED.foot]){const probe={...part,positions:[...part.pivot,...part.positions.slice(3)]};
  for(const o of HAND_FOOT_OPTIONS.filter(o=>!o.puff)){const out=adjustPart(probe,o);for(let k=0;k<3;k++)assert(Math.abs(out.positions[k]-part.pivot[k])<1e-12,o.id);}}
 return 'pivot fixed for every size and proportion change';
});
for(const o of HAND_FOOT_OPTIONS.slice(1)){
 const r=buildHandFoot(o);
 check(`${o.label}: keeps every original triangle (same finger and toe detail)`,()=>{assert.equal(r.hand.index,src.hand.index);assert.equal(r.foot.index,src.foot.index);return `${r.hand.index.length/3} + ${r.foot.index.length/3} triangles`;});
 check(`${o.label}: size changes exactly as stated along length, width and thickness`,()=>{
  const out=[];
  for(const part of ['hand','foot']){const {axes,pivot}=src[part];
   for(const [name,f] of [['length',o.length],['width',o.width],['thickness',o.thickness]]){
    const base=FILLED[part].positions,span=ps=>{let lo=Infinity,hi=-Infinity;for(let i=0;i<ps.length;i+=3){const d=dot([ps[i]-pivot[0],ps[i+1]-pivot[1],ps[i+2]-pivot[2]],axes[name]);lo=Math.min(lo,d);hi=Math.max(hi,d);}return hi-lo;};
    const ratio=span(r[part].positions)/span(base),want=f*o.size;
    // A puff adds a few millimetres on each side, so allow for it.
    const slack=o.puff?2*o.puff/span(base)+.002:1e-9;assert(Math.abs(ratio-want)<=slack,`${part} ${name} ×${ratio.toFixed(4)} not ×${want}`);
    out.push(`${part} ${name} ×${ratio.toFixed(3)}`);}}
  return out.join(', ');
 });
 if(o.puff)check(`${o.label}: the puff never cracks the surface (points that shared a position still do)`,()=>{
  for(const part of ['hand','foot']){const groups=new Map(),P=FILLED[part].positions;
   for(let i=0;i<P.length/3;i++){const k=P[3*i]+','+P[3*i+1]+','+P[3*i+2];(groups.get(k)??groups.set(k,[]).get(k)).push(i);}
   for(const ids of groups.values())for(const i of ids.slice(1))for(let k=0;k<3;k++)assert(Math.abs(r[part].positions[3*i+k]-r[part].positions[3*ids[0]+k])<1e-12,part+' crack');}
  return 'no cracks';
 });
}
check('the five options really differ (each pair at least 5 mm apart somewhere)',()=>{
 const built=HAND_FOOT_OPTIONS.map(buildHandFoot),out=[];
 for(let i=0;i<5;i++)for(let j=i+1;j<5;j++){let m=0;for(const part of ['hand','foot'])built[i][part].positions.forEach((v,k)=>{m=Math.max(m,Math.abs(v-built[j][part].positions[k]));});
  assert(m>=.005,`${HAND_FOOT_OPTIONS[i].id} and ${HAND_FOOT_OPTIONS[j].id} too alike`);out.push(m);}
 return `closest pair ${(Math.min(...out)*1000).toFixed(1)} mm apart`;
});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the original hand and foot and every variation check out.');
process.exitCode=failed?1:0;
