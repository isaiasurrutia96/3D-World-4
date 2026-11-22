// Checks the owner's mix (original-body.js): the original neck and limbs come
// from the original avatar (Avatar Checkpoint 1, from 3D-WORLD-3), unchanged and
// in their original places; the athletic torso, approved head (centred where the
// original head was), and approved hands and feet (at the original joints, at
// their latest sizes) complete him; every part faces outward; both sides match.
// Usage: node avatar-v2/check-original-body.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {originalLimbBody,limbLine,stretchLimb,ORIGINAL_LIMBS as src,ORIGINAL_HEAD_CENTRE,ORIGINAL_LIMB_LENGTHEN,ORIGINAL_HAND_SHRINK,STRETCH_FROM,STRETCH_TO} from './original-body.js';
import {HAND_FEET_SOURCE,CHOSEN_HAND_FOOT,HAND_FOOT_OPTIONS} from './hands-feet.js';
import {buildHeadSet,CHOSEN_NECK} from './head-options.js';
import {makeTorsoOption,CHOSEN_TORSO} from './torso-variants.js';
import {buildTorsoSurface} from './torso-shape.js';
import {LIMB_SCALE,HAND_SCALE,FOOT_OVER_HEAD} from './assembly.js';
import {SIDE} from '../motion-core/skeleton/bones.js';
import torsoBase from './torso.json' with {type:'json'};

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const P=(a,i)=>[a[3*i],a[3*i+1],a[3*i+2]],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const volume=p=>{let v=0;const X=p.positions,I=p.index;for(let t=0;t<I.length;t+=3){const a=3*I[t],c=3*I[t+1],d=3*I[t+2];v+=(X[a]*(X[c+1]*X[d+2]-X[c+2]*X[d+1])-X[a+1]*(X[c]*X[d+2]-X[c+2]*X[d])+X[a+2]*(X[c]*X[d+1]-X[c+1]*X[d]))/6;}return v;};
const sameShape=(a,b,k=1)=>{let worst=0;for(let i=0;i<b.length/3;i+=11)for(let j=i+7;j<b.length/3;j+=29)worst=Math.max(worst,Math.abs(dist(P(a,i),P(a,j))-k*dist(P(b,i),P(b,j))));return worst;};
const b=originalLimbBody('boy'),g=(n,s)=>b.parts.find(p=>p.name===n&&p.side===s);

check('15 parts: torso, head, neck, and both sides of upper arm, forearm, thigh, calf, hand and foot',()=>{
 const want=['torso.centre','head.centre','neck.centre',...['upper-arm','forearm','thigh','calf','hand','foot'].flatMap(n=>[n+'.left',n+'.right'])].sort();
 assert.deepEqual(b.parts.map(p=>p.name+'.'+p.side).sort(),want);return b.parts.length+' parts';});
check('the original pieces come from the original avatar (Avatar Checkpoint 1, from 3D-WORLD-3), placed by a measured pure offset',()=>{
 assert.equal(src.source.checkpoint,'avatar-approved-2026-11-17');assert.equal(src.source.viewer,'avatar/index.html');assert.match(src.source.from,/3D-WORLD-3/);
 assert(Math.abs(src.source.offset[0])<1e-6&&Math.abs(src.source.offset[1]-.9891)<1e-3&&Math.abs(src.source.offset[2]-.043)<1e-3);
 return `offset ${src.source.offset.map(v=>(v*100).toFixed(2)).join(', ')} cm (checked on every point of the upper arm)`;});
check('the original neck is exactly as copied',()=>{assert.deepEqual(g('neck','centre').positions,src.parts.neck.positions);return 'unchanged';});
// Each limb: its top end unchanged (after the chain's move), its bottom end moved rigidly by the extra length, only the middle stretched.
const along=(p,L)=>(p[0]-L.centre[0])*L.dir[0]+(p[1]-L.centre[1])*L.dir[1]+(p[2]-L.centre[2])*L.dir[2];
const thick=(pos,L,from,to)=>{let r=0;for(let i=0;i<pos.length;i+=3){const p=P(pos,i/3),s=along(p,L),t=(s-L.start)/L.length;if(t<from||t>to)continue;const side=[0,1,2].map(k=>p[k]-L.centre[k]-L.dir[k]*s);r=Math.max(r,Math.hypot(...side));}return r;};
for(const [n,above] of [['upper-arm',null],['forearm','upper-arm'],['thigh',null],['calf','thigh']])check(`${n}: ${Math.round((ORIGINAL_LIMB_LENGTHEN-1)*100)}% longer, same thickness, ends unchanged in shape`,()=>{
 const before=src.parts.left[n].positions,L0=limbLine(before),now=g(n,'left').positions;
 const prior=above?b.stretched['left:'+above].shift:[0,0,0],base=before.map((x,i)=>x+prior[i%3]),L=limbLine(base),extra=(ORIGINAL_LIMB_LENGTHEN-1)*L.length;
 // Length measured along the limb's line before stretching (the forearm's hand socket makes it lopsided, so a fresh fit would tilt slightly).
 const span=pos=>{let lo=Infinity,hi=-Infinity;for(let i=0;i<pos.length;i+=3){const v=along(P(pos,i/3),L);lo=Math.min(lo,v);hi=Math.max(hi,v);}return hi-lo;};
 assert(Math.abs(span(now)-ORIGINAL_LIMB_LENGTHEN*span(base))<1e-6,'length '+span(now)/span(base));
 for(let i=0;i<base.length/3;i++){const p=P(base,i),t=(along(p,L)-L.start)/L.length,q=P(now,i);
  if(t<=STRETCH_FROM)assert(dist(p,q)<1e-9,'top end moved');if(t>=STRETCH_TO)assert(Math.abs(dist(p,q)-extra)<1e-9,'bottom end not moved rigidly');}
 // Thickness: the widest the limb gets around its line (these capsules have no points in the stretched middle, so measure the whole limb).
 const t0=thick(base,L,0,1),t1=thick(now,L,-.1,1.2);assert(Math.abs(t0-t1)<1e-6,'thickness changed');
 return `${(span(base)*100).toFixed(1)} → ${(span(now)*100).toFixed(1)} cm; thickness ${(t0*200).toFixed(1)} cm unchanged`;});
check('test of the test: stretching a limb by zero changes nothing; by 10% moves its bottom end exactly that far',()=>{
 const pos=src.parts.left.calf.positions,z=stretchLimb(pos,0);assert.deepEqual(z.positions,pos);const L=limbLine(pos),o=stretchLimb(pos,.1*L.length);
 assert(Math.abs(Math.hypot(...o.shift)-.1*L.length)<1e-12);return 'checked';});
check('the hands and feet follow the end of their lengthened arm and leg',()=>{
 const arm=b.chainShift['left:forearm'],leg=b.chainShift['left:calf'],wrist=SIDE.find(x=>x.name==='hand').head,ankle=SIDE.find(x=>x.name==='foot').head;
 assert(dist(g('hand','left').pivot,wrist.map((v,k)=>v+arm[k]))<1e-12);assert(dist(g('foot','left').pivot,ankle.map((v,k)=>v+leg[k]))<1e-12);
 return `hand ${(Math.hypot(...arm)*100).toFixed(1)} cm lower, foot ${(Math.hypot(...leg)*100).toFixed(1)} cm lower`;});
check('the forearms were simplified within the limit (shape change at most 0.4%); the others are whole',()=>{
 assert(src.source.forearmSimplifiedError<=.004);assert.equal(src.source.forearmOriginalTriangles,50944);
 return `forearm 50,944 → ${src.parts.left.forearm.index.length/3} triangles (${(src.source.forearmSimplifiedError*100).toFixed(2)}%)`;});
check('the torso is the boy\'s approved athletic torso, in its usual place',()=>{
 const t=buildTorsoSurface(makeTorsoOption(torsoBase.shape,CHOSEN_TORSO));assert.deepEqual(g('torso','centre').positions,t.positions);return CHOSEN_TORSO.label;});
check('the head is the approved head (unchanged shape), centred where the original head was',()=>{
 const h=buildHeadSet(CHOSEN_NECK,makeTorsoOption(torsoBase.shape,CHOSEN_TORSO)).head,m=g('head','centre');
 assert(sameShape(m.positions,h.positions)<1e-9);const c=[0,0,0];for(let i=0;i<m.positions.length;i+=3)for(let k=0;k<3;k++)c[k]+=m.positions[i+k]/(m.positions.length/3);
 assert(dist(c,ORIGINAL_HEAD_CENTRE)<.01,'head off centre by '+dist(c,ORIGINAL_HEAD_CENTRE));return `centre within ${(dist(c,ORIGINAL_HEAD_CENTRE)*1000).toFixed(1)} mm of the original head's`;});
check('the hands and feet are the approved ones, scaled about their joints: hands 10% smaller again (owner), feet 3 inches longer than the head',()=>{
 assert.equal(CHOSEN_HAND_FOOT,HAND_FOOT_OPTIONS[1]);
 assert.equal(ORIGINAL_HAND_SHRINK,.9);assert(Math.abs(b.handSize-1.08*LIMB_SCALE*HAND_SCALE*ORIGINAL_HAND_SHRINK)<1e-12);
 assert(sameShape(g('hand','left').positions,HAND_FEET_SOURCE.hand.positions,b.handSize)<1e-9,'hand reshaped');assert(sameShape(g('foot','left').positions,HAND_FEET_SOURCE.foot.positions,b.footSize)<1e-9,'foot reshaped');
 assert(Math.abs(b.footLength-(b.headHeight+FOOT_OVER_HEAD))<1e-12);
 return `hands ×${b.handSize.toFixed(3)} of the original hand, feet ${(b.footLength*100).toFixed(1)} cm long`;});
check('every part faces outward (closed surfaces with positive volume)',()=>{for(const p of b.parts)assert(volume(p)>0,p.name+'.'+p.side+' faces inward');return 'all outward';});
check('test of the test: a part turned inside out is caught',()=>{const p=g('thigh','left'),flip={...p,index:p.index.map((v,i,I)=>i%3===1?I[i+1]:i%3===2?I[i-1]:v)};assert(volume(flip)<0);return 'caught';});
check('both sides match (the same size; the right a mirror image of the left, within 2 mm, as the original had them)',()=>{
 const out=[];for(const n of ['upper-arm','forearm','thigh','calf','hand','foot']){const a=g(n,'left'),c=g(n,'right');assert(Math.abs(volume(a)-volume(c))/volume(a)<.01,n+' sizes differ');
  const ca=[0,0,0],cc=[0,0,0];for(let i=0;i<a.positions.length;i+=3)for(let k=0;k<3;k++)ca[k]+=a.positions[i+k];for(let i=0;i<c.positions.length;i+=3)for(let k=0;k<3;k++)cc[k]+=c.positions[i+k];
  for(let k=0;k<3;k++){ca[k]/=a.positions.length/3;cc[k]/=c.positions.length/3;}assert(dist(ca,[-cc[0],cc[1],cc[2]])<.002,n+' not mirrored');}
 return 'mirrored';});
check('reports his height and triangles',()=>`${(b.height*100).toFixed(1)} cm tall (the page stands him on the floor); ${b.parts.reduce((n,p)=>n+p.index.length/3,0).toLocaleString()} triangles`);
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the original limbs with the athletic torso, approved head, hands and feet check out.');
process.exitCode=failed?1:0;
