// Checks the original hand and foot (from before the ball joints) and their
// variations (hands-feet.js): they come from Avatar Checkpoint 2, the hand was
// simplified within its limit, neither has a socket hollow; option 1 is the
// original exactly; every option keeps the original triangles, never moves the
// wrist or ankle, changes size exactly as stated; the options really differ.
// Usage: node avatar-v2/check-hands-feet.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HAND_FEET_SOURCE as src,HAND_FOOT_OPTIONS,adjustPart,buildHandFoot} from './hands-feet.js';
import {SIDE} from '../motion-core/skeleton/bones.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const checkpoint=JSON.parse(await readFile('checkpoints/avatar-2/CHECKPOINT.json','utf8'));

check('the originals come from Avatar Checkpoint 2 (before the ball joints)',()=>{
 assert.equal(src.source.checkpoint,'checkpoints/avatar-2/');assert.equal(src.source.tag,checkpoint.tag);assert.equal(src.source.saved_on,'2026-11-17');
 assert.equal(src.source.hand,'right-emoji-hand');assert.equal(src.source.foot,'right-rounded-foot');return `${checkpoint.tag}, saved ${checkpoint.saved_on}`;
});
check('the hand was simplified within its limit (shape change at most 0.4% of its size); the foot is whole',()=>{
 assert(src.source.handOriginalTriangles>200000);assert.equal(src.hand.index.length/3,20000);assert(src.source.handSimplifiedError<=.004);
 assert.equal(src.foot.index.length/3,24320);
 return `hand ${src.source.handOriginalTriangles.toLocaleString()} → 20,000 triangles (${(src.source.handSimplifiedError*100).toFixed(2)}%), foot 24,320`;
});
// A socket would show at the top end of the part (the end facing the forearm or calf) as surface facing
// DOWN into a cup. So: in the top 12% of each part, count the points whose surface faces down.
const topFacingDown=(p,up)=>{let lo=Infinity,hi=-Infinity;const h=[];
 for(let i=0;i<p.positions.length;i+=3){const v=dot([p.positions[i]-p.pivot[0],p.positions[i+1]-p.pivot[1],p.positions[i+2]-p.pivot[2]],up);h.push(v);lo=Math.min(lo,v);hi=Math.max(hi,v);}
 let band=0,down=0;h.forEach((v,k)=>{if(v<hi-.12*(hi-lo))return;band++;if(dot([p.normals[3*k],p.normals[3*k+1],p.normals[3*k+2]],up)<-.3)down++;});return {band,down};};
const UP={hand:src.hand.axes.length.map(v=>-v),foot:src.foot.axes.thickness};// toward the forearm; straight up
check('no socket: the top end of the hand and the foot faces outward (no cup facing the forearm or calf)',()=>{
 const out=[];
 for(const name of ['hand','foot']){const {band,down}=topFacingDown(src[name],UP[name]);assert(band>50,name+': too few points to judge');
  assert(down/band<.03,`${name}: ${down} of ${band} top points face down into a cup`);out.push(`${name}: ${down} of ${band} top points face down`);}
 return out.join('; ');
});
check('the no-socket test catches a cup (test of the test: the top end turned inside out must fail)',()=>{
 for(const name of ['hand','foot']){const p=src[name],up=UP[name],flipped={...p,normals:p.normals.map((v,i)=>-v)};const {band,down}=topFacingDown(flipped,up);
  assert(down/band>.5,name+': a cup would not have been noticed');}
 return 'a cup is caught';
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
 check(`${o.label}: keeps every original triangle`,()=>{assert.equal(r.hand.index,src.hand.index);assert.equal(r.foot.index,src.foot.index);return `${r.hand.index.length/3} + ${r.foot.index.length/3} triangles`;});
 check(`${o.label}: size changes exactly as stated along length, width and thickness`,()=>{
  const out=[];
  for(const part of ['hand','foot']){const {axes,pivot}=src[part],base=src[part].positions;
   for(const [name,f] of [['length',o.length],['width',o.width],['thickness',o.thickness]]){
    const span=ps=>{let lo=Infinity,hi=-Infinity;for(let i=0;i<ps.length;i+=3){const d=dot([ps[i]-pivot[0],ps[i+1]-pivot[1],ps[i+2]-pivot[2]],axes[name]);lo=Math.min(lo,d);hi=Math.max(hi,d);}return hi-lo;};
    const ratio=span(r[part].positions)/span(base),want=f*o.size,slack=o.puff?2*o.puff/span(base)+.002:1e-9;// a puff adds a few millimetres each side
    assert(Math.abs(ratio-want)<=slack,`${part} ${name} ×${ratio.toFixed(4)} not ×${want}`);out.push(`${part} ${name} ×${ratio.toFixed(3)}`);}}
  return out.join(', ');
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
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the original (pre-joint) hand and foot and every variation check out.');
process.exitCode=failed?1:0;
