// Checks the head and neck options (head-options.js) on the chosen torso:
// sizes follow the stated rules, nothing overlaps that should not, the head
// sits above the ball, and every surface is a proper sealed sphere.
// Usage: node avatar-v2/check-head.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HEAD_OPTIONS,buildHeadSet,buildFaceSet,neckSeat,HEAD_TRIANGLES,APPROVED_HEAD_RADIUS,SKELETON_HEAD_CENTRE,CHOSEN_NECK} from './head-options.js';
import {HEAD_SHAPES,headRadius,expandFeatures,FACE_TRIANGLES} from './head-shapes.js';
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
// --- The chosen neck and the face-shaped heads ---------------------------------
check('the chosen neck is option 5 (sunk ball, 19 cm head)',()=>{assert.equal(CHOSEN_NECK,HEAD_OPTIONS[4]);assert.equal(CHOSEN_NECK.head,.19);return CHOSEN_NECK.label;});
check('five head shapes with unique ids, labels and notes; every feature sensible',()=>{
 assert.equal(HEAD_SHAPES.length,5);assert.equal(new Set(HEAD_SHAPES.map(h=>h.id)).size,5);
 for(const h of HEAD_SHAPES){assert(h.label&&h.note,h.id);assert(h.egg>=0&&h.egg<=.05&&h.chin>=0&&h.chin<=.2,h.id+' egg/chin');
  for(const f of h.features)assert(Math.abs(f.amount)<=.025&&f.azSpread>=6&&f.elSpread>=6,h.id+' feature');}
 return HEAD_SHAPES.map(h=>h.id).join(', ');
});
const R=CHOSEN_NECK.head,TAU=Math.PI*2;
// Directions spread evenly over the head (for measuring shapes).
const dirs=Array.from({length:2000},(_,i)=>{const y=1-2*(i+.5)/2000,r=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*r,y,Math.sin(a)*r];});
const faces=HEAD_SHAPES.map(h=>({h,set:buildFaceSet(h,boy)}));
for(const {h,set} of faces){
 const {positions,index}=set.head,name=h.label,P=i=>[positions[3*i],positions[3*i+1],positions[3*i+2]];
 check(`${name}: ${FACE_TRIANGLES} triangles, sealed and consistent, faces out`,()=>{
  assert.equal(index.length/3,FACE_TRIANGLES);const edges=new Map(),directed=new Set();
  for(let i=0;i<index.length;i+=3)for(let k=0;k<3;k++){const a=index[i+k],b=index[i+(k+1)%3],e=a<b?a+','+b:b+','+a;edges.set(e,(edges.get(e)||0)+1);const d=a+'>'+b;assert(!directed.has(d),'flipped');directed.add(d);}
  assert([...edges.values()].every(n=>n===2),'open edge');
  let v=0;for(let i=0;i<index.length;i+=3){const a=P(index[i]),b=P(index[i+1]),c=P(index[i+2]);v+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
  assert(v>0);return `${edges.size} edges, ${(v*1000).toFixed(1)} litres`;
 });
 check(`${name}: still round (at most 5% taller than wide; every point within 85-115% of the head's radius)`,()=>{
  const ys=positions.filter((_,i)=>i%3===1),xs=positions.filter((_,i)=>i%3===0),tall=(Math.max(...ys)-Math.min(...ys))/(Math.max(...xs)-Math.min(...xs));
  let lo=Infinity,hi=0;for(const d of dirs){const r=headRadius(h,R,...d);lo=Math.min(lo,r);hi=Math.max(hi,r);}
  assert(tall<=1.05,'tall/wide '+tall.toFixed(3));assert(lo>=.85*R&&hi<=1.15*R,`radius ${(lo*100).toFixed(1)}-${(hi*100).toFixed(1)} cm`);
  return `tall/wide ${tall.toFixed(3)}, radius ${(lo*100).toFixed(1)} to ${(hi*100).toFixed(1)} cm`;
 });
 check(`${name}: left and right match exactly`,()=>{
  let worst=0;for(const [x,y,z] of dirs)worst=Math.max(worst,Math.abs(headRadius(h,R,x,y,z)-headRadius(h,R,-x,y,z)));assert(worst<1e-9,worst);return 'mirror within '+worst.toExponential(0)+' m';
 });
 check(`${name}: the face is where it should be (nose at the front, the most forward point; brow above it; chin below)`,()=>{
  const at=(az,el)=>{const a=az*Math.PI/180,e=el*Math.PI/180;return headRadius(h,R,Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e));};
  assert(at(0,-6)>at(0,8)&&at(0,-6)>at(0,-25),'nose not a raised point');assert(at(0,22)>at(0,12),'no brow above the eyes');
  assert(at(0,-6)>at(90,-6)&&at(0,-6)>at(180,-6),'nose not at the front');
  return `nose ${((at(0,-6)-R)*1000).toFixed(0)} mm out, brow ${((at(0,22)-at(0,12))*1000).toFixed(1)} mm over the eye line`;
 });
 check(`${name}: seated on the neck ball (${(BALL_GAP*1000)} mm gap below, never touching the ball)`,()=>{
  const c=set.ball.y,top=c+set.ball.radius,under=set.head.y-set.head.under;assert(Math.abs(under-top-BALL_GAP)<1e-12,'gap');
  let closest=Infinity;for(let i=0;i<positions.length;i+=3)closest=Math.min(closest,Math.hypot(positions[i],positions[i+1]+set.head.y-c,positions[i+2]));
  assert(closest>=set.ball.radius+BALL_GAP*.5,'head touches the ball');return `closest ${((closest-set.ball.radius)*1000).toFixed(1)} mm from the ball`;
 });
}
check('the extra round head is closest to a plain ball (within 1.2 cm everywhere)',()=>{
 const h=HEAD_SHAPES.find(s=>s.id==='head-round');let worst=0;for(const d of dirs)worst=Math.max(worst,Math.abs(headRadius(h,R,...d)-R));
 assert(worst<=.012,(worst*1000).toFixed(1)+' mm');return 'within '+(worst*1000).toFixed(1)+' mm';
});
check('the five heads really differ (each pair at least 5 mm apart somewhere)',()=>{
 const out=[];for(let i=0;i<5;i++)for(let j=i+1;j<5;j++){let m=0;for(const d of dirs)m=Math.max(m,Math.abs(headRadius(HEAD_SHAPES[i],R,...d)-headRadius(HEAD_SHAPES[j],R,...d)));
  assert(m>=.005,`${HEAD_SHAPES[i].id} and ${HEAD_SHAPES[j].id} too alike (${(m*1000).toFixed(1)} mm)`);out.push(m);}
 return `closest pair ${(Math.min(...out)*1000).toFixed(1)} mm apart`;
});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: every neck option and head shape is sized, placed and built as stated.');
process.exitCode=failed?1:0;
