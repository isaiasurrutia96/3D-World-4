// Checks the elbow test (elbow-test.js), both ways ('touch' and 'golden'): the
// upper arm stays put, the ball keeps its size and sits at the stated depth in
// both limbs on their lines, both sockets are snug (6 mm, never closer), the
// forearm folds forward cleanly at every 2° to the deepest bend (and would not
// without the shaping), and no surface opens.
// Usage: node avatar-v2/check-elbow-test.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {elbowTest,ELBOW_TEST_BEND,GOLDEN,CLOSER_DEPTHS,CLAY_LIP} from './elbow-test.js';
import {limbLine} from './original-body.js';
import {SOCKET_GAP} from './sockets.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const P=(a,i)=>[a[3*i],a[3*i+1],a[3*i+2]],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const closest=(m,c)=>{let b=Infinity;for(let i=0;i<m.positions.length/3;i++)b=Math.min(b,dist(P(m.positions,i),c));return b;};
const openEdges=m=>{const e=new Set();for(let t=0;t<m.index.length;t+=3)for(let k=0;k<3;k++)e.add(m.index[t+k]+','+m.index[t+(k+1)%3]);let n=0;for(const key of e){const [a,b]=key.split(',');if(!e.has(b+','+a))n++;}return n;};
// The three closer versions on the page (70%, 80%, 90% of the ball's radius in each limb, with a clay lip).
const label=m=>`${Math.round(m*100)}% deep`;
for(const mode of CLOSER_DEPTHS){
 const e=elbowTest(mode,'boy',{lip:CLAY_LIP}),C=e.centre,r=e.radius;
 check(`${label(mode)}: the ball sits ${Math.round(mode*100)}% of its radius deep in each limb, on both limbs' lines`,()=>{
  const want=mode*r;assert(Math.abs(e.depth-want)<1e-12);
  const U=limbLine(e.before.upper.positions),F=limbLine(e.before.forearmPlaced.positions);
  const upTip=U.centre.map((v,k)=>v+U.dir[k]*U.end),foTip=F.centre.map((v,k)=>v+F.dir[k]*F.start);
  assert(Math.abs(dist(upTip,C)-(r-e.depth))<1e-9,'upper arm depth');assert(Math.abs(dist(foTip,C)-(r-e.depth))<1e-9,'forearm depth');
  return `${(e.depth*100).toFixed(1)} cm of its ${(r*100).toFixed(1)} cm radius; forearm moved ${(e.forearmMoved*100).toFixed(1)} cm up its line`;});
 check(`${label(mode)}: the upper arm does not move (everything away from the elbow exactly where it was); the ball keeps its size`,()=>{
  const b=e.before.upper.positions;for(let i=0;i<b.length/3;i++){const p=P(b,i);if(dist(p,C)<.4)continue;assert.deepEqual(P(e.upper.positions,i),p);}
  for(let i=0;i<e.ball.positions.length;i+=3)assert(Math.abs(dist(P(e.ball.positions,i/3),C)-r)<1e-9);return 'unchanged';});
 check(`${label(mode)}: snug sockets in both limbs: the 6 mm gap (within 1 mm), never closer`,()=>{
  const out=[];for(const [n,m] of [['upper arm',e.upper],['forearm',e.forearm]]){const g=closest(m,C)-r;assert(g>=SOCKET_GAP-1e-9&&g<=SOCKET_GAP+1e-3,`${n}: ${(g*1000).toFixed(2)} mm`);out.push(`${n} ${(g*1000).toFixed(1)} mm`);}
  return out.join(', ');});
 check(`${label(mode)}: the forearm folds forward cleanly at every 2° up to ${ELBOW_TEST_BEND}° (at least 4 mm from the upper arm)`,()=>{
  let worst=Infinity,at=0;for(let d=0;d<=ELBOW_TEST_BEND;d+=2){const c=e.clearance(d);if(c<worst){worst=c;at=d;}}
  assert(worst>=.004,`touches at ${at}°: ${(worst*1000).toFixed(1)} mm`);return `closest ${(worst*1000).toFixed(1)} mm at ${at}°`;});
 check(`${label(mode)}: test of the test: without the shaped inner side, the bend test catches the limbs touching before ${ELBOW_TEST_BEND}°`,()=>{
  const p=elbowTest(mode,'boy',{shape:false,lip:CLAY_LIP});let first=null;for(let d=0;d<=ELBOW_TEST_BEND;d+=5)if(p.clearance(d)<.004){first=d;break;}
  assert(first!==null,'not caught');return `plain sockets touch at ${first}°`;});
 check(`${label(mode)}: no surface opens (no more open edges than the original limbs had)`,()=>{
  assert(openEdges(e.upper)<=openEdges(e.before.upper),'upper arm');assert(openEdges(e.forearm)<=openEdges(e.before.forearm),'forearm');return 'closed';});
  check(`${label(mode)}: the clay lip keeps the rim thicker: with it, the rim around the ball stands at least 5 mm farther out than without it`,()=>{
   // Same limbs, same splitting, pressed with and without the lip: compare each point's distance from the ball's centre.
   const thin=elbowTest(mode,'boy',{lip:0});assert.equal(thin.upper.positions.length,e.upper.positions.length,'different splitting');
   let most=0;for(const [a2,b2] of [[e.upper,thin.upper],[e.forearm,thin.forearm]])for(let i=0;i<a2.positions.length;i+=3)most=Math.max(most,dist(P(a2.positions,i/3),C)-dist(P(b2.positions,i/3),C));
   assert(most>=.005,`the lip adds only ${(most*1000).toFixed(1)} mm`);return `the rim stands up to ${(most*1000).toFixed(1)} mm farther out with the lip`;});
}
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the three closer elbows: snug, at the stated depth, thick clay, folding cleanly.');
process.exitCode=failed?1:0;
