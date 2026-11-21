// Checks the head and neck options (head-options.js) on the chosen torso:
// sizes follow the stated rules, nothing overlaps that should not, the head
// sits above the ball, and every surface is a proper sealed sphere.
// Usage: node avatar-v2/check-head.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HEAD_OPTIONS,buildHeadSet,neckSeat,HEAD_TRIANGLES,APPROVED_HEAD_RADIUS,SKELETON_HEAD_CENTRE} from './head-options.js';
import {makeTorsoOption,CHOSEN_TORSO,CHOSEN_GIRL_TORSO,WOMEN_OPTIONS} from './torso-variants.js';
import {BALL_GAP} from './limb-options.js';
import {CHOSEN_BALL_TRIANGLES} from './ball-shape.js';

const torso=JSON.parse(await readFile('avatar-v2/torso.json','utf8'));
const boy=makeTorsoOption(torso.shape,CHOSEN_TORSO),girl=makeTorsoOption(torso.shape,CHOSEN_GIRL_TORSO,WOMEN_OPTIONS);
const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};

check('the skeleton\'s head centre and the approved head size are what the options measure from',()=>{
 assert.deepEqual(SKELETON_HEAD_CENTRE,[0,1.6745,0]);assert.equal(APPROVED_HEAD_RADIUS,.22);return 'head centre 1.6745 m, radius 22 cm';
});
check('the old avatar had no visible neck (head within 1 cm of the torso top)',()=>{
 const gap=SKELETON_HEAD_CENTRE[1]-APPROVED_HEAD_RADIUS-neckSeat(boy).y;assert(gap>=0&&gap<.01,gap);return `gap ${(gap*1000).toFixed(1)} mm`;
});
check('five options, unique ids, labels and notes; bad options are refused',()=>{
 assert.equal(HEAD_OPTIONS.length,5);assert.equal(new Set(HEAD_OPTIONS.map(o=>o.id)).size,5);for(const o of HEAD_OPTIONS)assert(o.label&&o.note,o.id);
 assert.throws(()=>buildHeadSet({id:'x',ball:1.2,sink:0,head:.2},boy),/bad head/);assert.throws(()=>buildHeadSet({id:'x',ball:.9,sink:.3,head:.2},boy),/bad head/);
 return HEAD_OPTIONS.map(o=>o.id).join(', ');
});
check('the boy\'s and girl\'s torsos have the same neck seat, so one head set fits both',()=>{
 const a=neckSeat(boy),b=neckSeat(girl);assert(Math.abs(a.y-b.y)<1e-9&&Math.abs(a.radius-b.radius)<.003);return `seat radius ${(a.radius*100).toFixed(1)} / ${(b.radius*100).toFixed(1)} cm`;
});

const lifts=[];
for(const o of HEAD_OPTIONS){
 const set=buildHeadSet(o,boy),seat=neckSeat(boy),name=o.label;
 check(`${name}: neck ball sized by its rule (${Math.round(o.ball*100)}% of the neck seat) and smaller than the seat`,()=>{
  assert(Math.abs(set.ball.radius-o.ball*seat.radius)<1e-12);assert(set.ball.radius<seat.radius);return `${(set.ball.radius*200).toFixed(1)} cm wide`;
 });
 check(`${name}: placed as stated (${o.sink?'half inside the torso top':'resting on the torso with a gap'}); head ${BALL_GAP*1000} mm above the ball`,()=>{
  if(o.sink)assert(Math.abs(set.ball.y-seat.y)<1e-12,'ball centre not at the torso top');
  else assert(Math.abs(set.ball.y-set.ball.radius-seat.y-BALL_GAP)<1e-12,'ball not resting with a gap');
  const gap=(set.head.y-set.head.radius)-(set.ball.y+set.ball.radius);assert(Math.abs(gap-BALL_GAP)<1e-12,'head gap '+gap);
  return `ball centre ${set.ball.y.toFixed(3)} m, head centre ${set.head.y.toFixed(3)} m`;
 });
 check(`${name}: ball and head are proper sealed spheres with their triangle counts`,()=>{
  for(const [part,count] of [[set.ball,CHOSEN_BALL_TRIANGLES],[set.head,HEAD_TRIANGLES]]){
   assert.equal(part.index.length/3,count);const edges=new Map();
   for(let i=0;i<part.index.length;i+=3)for(let k=0;k<3;k++){const a=part.index[i+k],b=part.index[i+(k+1)%3],e=a<b?a+','+b:b+','+a;edges.set(e,(edges.get(e)||0)+1);}
   assert([...edges.values()].every(n=>n===2),'open edge');
  }
  return `ball ${CHOSEN_BALL_TRIANGLES}, head ${HEAD_TRIANGLES} triangles`;
 });
 check(`${name}: height change reported honestly`,()=>{
  const expected=set.headTop-(SKELETON_HEAD_CENTRE[1]+APPROVED_HEAD_RADIUS);assert(Math.abs(set.lift-expected)<1e-12);assert(set.lift>0,'a neck ball must lift the head');lifts.push([o.id,set.lift]);
  return `${(set.lift*100).toFixed(1)} cm taller than the approved avatar`;
 });
}
check('the options cover a real range of heights (at least 10 cm between lowest and tallest)',()=>{
 const v=lifts.map(l=>l[1]);assert(Math.max(...v)-Math.min(...v)>=.1);return `${(Math.min(...v)*100).toFixed(1)} to ${(Math.max(...v)*100).toFixed(1)} cm`;
});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: every head and neck option is sized, placed and built as stated.');
process.exitCode=failed?1:0;
