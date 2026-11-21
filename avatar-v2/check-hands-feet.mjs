// Checks the original hand and foot and their five variations (hands-feet.js):
// option 1 is the original exactly; every option keeps the original triangles,
// never moves the wrist or ankle, changes size exactly as stated, and never
// cracks the surface; the options really differ.
// Usage: node avatar-v2/check-hands-feet.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HAND_FEET_SOURCE as src,HAND_FOOT_OPTIONS,adjustPart,buildHandFoot} from './hands-feet.js';
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
check('five options with unique ids, labels and notes; option 1 is the original exactly',()=>{
 assert.equal(HAND_FOOT_OPTIONS.length,5);assert.equal(new Set(HAND_FOOT_OPTIONS.map(o=>o.id)).size,5);for(const o of HAND_FOOT_OPTIONS)assert(o.label&&o.note,o.id);
 const r=buildHandFoot(HAND_FOOT_OPTIONS[0]);
 for(const part of ['hand','foot']){let worst=0;r[part].positions.forEach((v,i)=>{worst=Math.max(worst,Math.abs(v-src[part].positions[i]));});assert(worst<1e-12,part+' moved '+worst);}
 return 'original unchanged to the last digit';
});
check('the wrist and ankle never move, whatever the adjustment (test with a point placed on the pivot)',()=>{
 for(const part of [src.hand,src.foot]){const probe={...part,positions:[...part.pivot,...part.positions.slice(3)],normals:[0,0,0,...part.normals.slice(3)]};
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
    const span=ps=>{let lo=Infinity,hi=-Infinity;for(let i=0;i<ps.length;i+=3){const d=dot([ps[i]-pivot[0],ps[i+1]-pivot[1],ps[i+2]-pivot[2]],axes[name]);lo=Math.min(lo,d);hi=Math.max(hi,d);}return hi-lo;};
    const ratio=span(r[part].positions)/span(src[part].positions),want=f*o.size;
    // A puff adds a few millimetres on each side, so allow for it.
    const slack=o.puff?2*o.puff/span(src[part].positions)+.002:1e-9;assert(Math.abs(ratio-want)<=slack,`${part} ${name} ×${ratio.toFixed(4)} not ×${want}`);
    out.push(`${part} ${name} ×${ratio.toFixed(3)}`);}}
  return out.join(', ');
 });
 if(o.puff)check(`${o.label}: the puff never cracks the surface (points that shared a position still do)`,()=>{
  for(const part of ['hand','foot']){const groups=new Map(),P=src[part].positions;
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
