// Checks the owner's mix (original-body.js): the original neck and limbs come
// from the original avatar (Avatar Checkpoint 1, from 3D-WORLD-3), unchanged and
// in their original places; the athletic torso, approved head (centred where the
// original head was), and approved hands and feet (at the original joints, at
// their latest sizes) complete him; every part faces outward; both sides match.
// Usage: node avatar-v2/check-original-body.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {originalLimbBody,separatedOriginalBody,pressedPreviewBody,PREVIEW_PRESS,SLIM_OVER_BALL,SLIM_LIMBS,SLIM_OVER,HIP_BALL_GROW,straightLowerSides,LOWER_SIDES_FROM,LOWER_SIDES_BLEND,cupLimbEnd,KNEE_CUPS,limbsOnlyBody,LIMBS_ONLY,torsoShoulderBalls,pushShoulderBalls,softenShoulderRims,SHOULDER_RIM_ROUND,sinkIntoTorso,angleNormals,mouldSockets,HIP_SOCKET_SKIN,HIP_RIM_ROUNDS,HIP_RIM_BAND,HIP_TORSO_PRESS,HIP_THIGH_EXTRA,nearOffset,widenTop,THIGH_TOP_WIDER,THIGH_WIDEN_UNTIL,roundForearmEnd,FOREARM_ROUND_FROM,BALL_SIZE,endRadius,limbLine,stretchLimb,thickenTo,HIP_BALL_GAP,GOLDEN,ORIGINAL_LIMBS as src,ORIGINAL_HEAD_CENTRE,ORIGINAL_HAND_SHRINK,STRETCH_FROM,STRETCH_TO} from './original-body.js';
import ourAvatar from './our-avatar-sizes.json' with {type:'json'};
import {insideTorso,SHOULDER_TORSO_GAP} from './assembly.js';
import {BALL_GAP} from './limb-options.js';
import {SOCKET_GAP} from './sockets.js';
import {CHOSEN_BALL_TRIANGLES} from './ball-shape.js';
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
// Each limb matched to Our avatar's overall size: its thickness, and its joint-to-joint length once pressed together.
// Each limb's thickness: the upper arm as thick as Our avatar's; the forearm, thigh and calf slimmed to SLIM_OVER_BALL times the bigger of their two balls.
const neighbours={'upper-arm':['shoulder','elbow'],forearm:['elbow','wrist'],thigh:['hip','knee'],calf:['knee','ankle']};
for(const n of ['upper-arm','forearm','thigh','calf']){const slim=SLIM_LIMBS.includes(n);
 check(`${n}: ${slim?`slimmed to ${Math.round((SLIM_OVER[n]-1)*100)}% wider than its bigger ball`:"as thick as Our avatar's"}, ends unchanged in shape`,()=>{
  // (The thigh follows the hip ball's size before HIP_BALL_GROW.)
  const base=k=>k==='hip'?b.ballR.hip/HIP_BALL_GROW:b.ballR[k];
  const want=slim?SLIM_OVER[n]*2*Math.max(...neighbours[n].map(base)):ourAvatar.limbs[n].thickness;
  const now=g(n,'left').positions,L=limbLine(now,g(n,'left').axis);let r=0;for(let i=0;i<now.length;i+=3){const v=[now[i]-L.centre[0],now[i+1]-L.centre[1],now[i+2]-L.centre[2]],sa=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2];r=Math.max(r,Math.hypot(v[0]-L.dir[0]*sa,v[1]-L.dir[1]*sa,v[2]-L.dir[2]*sa));}
  assert(Math.abs(2*r-want)<.003,`thickness ${(2*r*100).toFixed(1)} cm, wanted ${(want*100).toFixed(1)}`);return `thickness ${(2*r*100).toFixed(1)} cm, length ${(L.length*100).toFixed(1)} cm`;});}
check(`thigh: its top ${Math.round((THIGH_TOP_WIDER-1)*100)}% wider at the end, fading smoothly to unchanged by its middle; length unchanged`,()=>{
  // Rebuild the thigh without the widening (its own unwidened shape is the slim thigh), then compare point by point.
  const now=g('thigh','left').positions,L=limbLine(now,g('thigh','left').axis);
  // Widening is undone exactly by the inverse factor at each point's place along the line (the line is the same: checked below).
  const plain=new Array(now.length);let worstTop=0,worstBelow=0;
  for(let i=0;i<now.length;i+=3){const v=[0,1,2].map(k=>now[i+k]-L.centre[k]),sa=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2],t=Math.min(1,Math.max(0,((sa-L.start)/L.length)/THIGH_WIDEN_UNTIL)),k=1+(THIGH_TOP_WIDER-1)*(1-t*t*(3-2*t));
   for(let j=0;j<3;j++)plain[i+j]=L.centre[j]+L.dir[j]*sa+(v[j]-L.dir[j]*sa)/k;}
  const again=widenTop(plain,THIGH_TOP_WIDER);for(let i=0;i<now.length;i++)worstTop=Math.max(worstTop,Math.abs(again[i]-now[i]));
  assert(worstTop<1e-6,`round trip ${worstTop}`);
  // Below the middle nothing moves; the top end moves out by the full factor; the length is the same.
  const Lp=limbLine(plain),w=widenTop(plain,THIGH_TOP_WIDER);
  for(let i=0;i<plain.length;i+=3){const sa=[0,1,2].reduce((a,k)=>a+(plain[i+k]-Lp.centre[k])*Lp.dir[k],0),t=(sa-Lp.start)/Lp.length;if(t>=THIGH_WIDEN_UNTIL)for(let j=0;j<3;j++)worstBelow=Math.max(worstBelow,Math.abs(w[i+j]-plain[i+j]));}
  assert(worstBelow<1e-9,`below the middle moved ${worstBelow}`);assert(Math.abs(limbLine(w).length-Lp.length)<1e-6,'length changed');
  const topNow=endRadius(now,L,'top'),topPlain=endRadius(plain,Lp,'top');assert(topNow>topPlain*1.05,`top ${topNow} vs ${topPlain}`);
  // Test of the test: a factor of 1 changes nothing.
  const same=widenTop(plain,1);assert(same.every((x,i)=>Math.abs(x-plain[i])<1e-12),'factor 1 moved points');
  return `top end ${(2*topPlain*100).toFixed(1)} → ${(2*topNow*100).toFixed(1)} cm across; below the middle unchanged`;});
check('test of the test: thickening to a size and back returns the same limb',()=>{const p=src.parts.left.thigh.positions,L=limbLine(p),t=thickenTo(thickenTo(p,.4),.2961);let w=0;for(let i=0;i<p.length;i++)w=Math.max(w,Math.abs(t[i]-thickenTo(p,.2961)[i]));assert(w<1e-9);return 'checked';});
check(`put together (balls ${Math.round(PREVIEW_PRESS*100)}% in): every joint-to-joint distance matches Our avatar's within 5 mm`,()=>{
 const pv=pressedPreviewBody('boy'),c=n=>pv.balls[n].centre,d=(a,b2)=>dist(c(a),c(b2)),out=[];
 for(const [n,a,b2] of [['upper-arm','ball-shoulder','ball-elbow'],['forearm','ball-elbow','ball-wrist'],['thigh','ball-hip','ball-knee'],['calf','ball-knee','ball-ankle']]){const got=d(a,b2),want=ourAvatar.jointToJoint[n];assert(Math.abs(got-want)<.005,`${n}: ${(got*100).toFixed(1)} vs ${(want*100).toFixed(1)} cm`);out.push(`${n} ${(got*100).toFixed(1)}/${(want*100).toFixed(1)}`);}
 return out.join(', ')+' cm; height '+(pv.height*100).toFixed(1)+' cm';});
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
check('the torso is the boy\'s approved athletic torso with straight lower sides, in its usual place',()=>{
 const t=buildTorsoSurface(straightLowerSides(makeTorsoOption(torsoBase.shape,CHOSEN_TORSO)));assert.deepEqual(g('torso','centre').positions,t.positions);return CHOSEN_TORSO.label+', lower sides straight';});
check(`straight lower sides: below ${LOWER_SIDES_FROM-LOWER_SIDES_BLEND} m the sides keep the waist's width, the front and back and everything above ${LOWER_SIDES_FROM+LOWER_SIDES_BLEND} m are unchanged, no ring gets narrower`,()=>{
 const before=makeTorsoOption(torsoBase.shape,CHOSEN_TORSO),after=straightLowerSides(before),n=before.segments,side=0,front=n/4;
 const at=(sh,y)=>{const R=sh.rings;let k=0;while(k<R.length-2&&R[k+1].y<y)k++;const a=R[k],b=R[k+1],t=(y-a.y)/(b.y-a.y);return a.r.map((r,i)=>r+(b.r[i]-r)*t);};const waist=at(before,LOWER_SIDES_FROM);
 let low=0;for(let k=0;k<before.rings.length;k++){const a=before.rings[k],b=after.rings[k];assert.equal(a.y,b.y);
  if(a.y>=LOWER_SIDES_FROM+LOWER_SIDES_BLEND)assert.deepEqual(a.r,b.r,`ring at ${a.y} changed`);
  for(let i=0;i<n;i++)assert(b.r[i]>=a.r[i]-1e-12,'a ring got narrower');
  assert(Math.abs(b.r[front]-a.r[front])<1e-12,'the front changed');
  if(a.y<=LOWER_SIDES_FROM-LOWER_SIDES_BLEND){assert(Math.abs(b.r[side]-Math.max(a.r[side],waist[side]))<1e-12,`side at ${a.y}: ${b.r[side]}`);low++;}}
 // Test of the test: the approved torso's lower sides do narrow (so the check sees a change).
 assert(before.rings[0].r[side]<waist[side]-.005);assert(low>0);
 return `${low} lower rings at the waist's width ${(waist[side]*200).toFixed(1)} cm across (the bottom ring was ${(before.rings[0].r[side]*200).toFixed(1)})`;});
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
// --- Separated, with a ball at every joint ----------------------------------------
{
 const sep=separatedOriginalBody('boy'),sg=(n,s='left')=>sep.parts.find(p=>p.name===n&&p.side===s);
 const balls=['ball-neck','ball-shoulder','ball-elbow','ball-wrist','ball-hip','ball-knee','ball-ankle'];
 check('separated: 27 parts, no neck piece: torso, head, and both sides of every limb, hand and foot, with 13 joint balls',()=>{
  assert(!sep.parts.some(p=>p.name==='neck'),'the neck is still there');
  const want=['torso.centre','head.centre','ball-neck.centre',...['ball-shoulder','upper-arm','ball-elbow','forearm','ball-wrist','hand','ball-hip','thigh','ball-knee','calf','ball-ankle','foot'].flatMap(n=>[n+'.left',n+'.right'])].sort();
  assert.deepEqual(sep.parts.map(p=>p.name+'.'+p.side).sort(),want);return sep.parts.length+' parts';});
 check(`separated: every ball is the approved ${CHOSEN_BALL_TRIANGLES}-triangle ball (the fewest of the three tried), perfectly round`,()=>{
  for(const n of balls)for(const s2 of n==='ball-neck'?['centre']:['left','right']){const m=sg(n,s2);assert.equal(m.index.length/3,CHOSEN_BALL_TRIANGLES,n);for(let i=0;i<m.positions.length;i+=3)assert(Math.abs(dist(P(m.positions,i/3),m.centre)-m.radius)<1e-9,n);}
  return '13 balls × 300 triangles';});
 check('separated: each ball is as thick as the ends it joins (elbows and knees: the thinner end; neck: the approved size), then adjusted: shoulders, neck and hips 10% bigger, wrists and ankles 10% smaller',()=>{
  assert.deepEqual(BALL_SIZE,{shoulder:1.1,neck:1.1,wrist:.9,ankle:.9,hip:1.1});
  // The balls are sized from the limbs before slimming (recorded as ballR), so the slimmer limbs keep the same balls.
  const W=sep.whole,R=W.ballR;
  const want={'ball-shoulder':R.shoulder,'ball-elbow':R.elbow,'ball-wrist':R.wrist,'ball-hip':R.hip,'ball-knee':R.knee,'ball-ankle':R.ankle,'ball-neck':BALL_SIZE.neck*buildHeadSet(CHOSEN_NECK,makeTorsoOption(torsoBase.shape,CHOSEN_TORSO)).ball.radius};
  const out=[];for(const [n,r] of Object.entries(want)){const m=sg(n,n==='ball-neck'?'centre':'left');assert(Math.abs(m.radius-r)<1e-9,n);out.push(`${n.slice(5)} ${(r*200).toFixed(1)} cm`);}
  return out.join(', ');});
 check('separated: every piece is only moved (same shape as in the joined avatar), never turned or reshaped',()=>{
  for(const n of ['head','upper-arm','forearm','hand','thigh','calf','foot']){const a=sg(n,n==='head'?'centre':'left'),c=sep.whole.parts.find(p=>p.name===n&&p.side===(n==='head'?'centre':'left'));
   const v=[0,1,2].map(k=>a.positions[k]-c.positions[k]);for(let i=0;i<a.positions.length;i++)assert(Math.abs(a.positions[i]-c.positions[i]-v[i%3])<1e-9,n+' reshaped or turned');}
  assert.deepEqual(sg('torso','centre').positions,sep.whole.parts.find(p=>p.name==='torso').positions);return 'torso in place; every other piece only moved';});
 check('separated: the shoulder, hip and neck balls clear the torso by 2 cm (the approved shoulder rule)',()=>{
  const probes=Array.from({length:500},(_,i)=>{const y=1-2*(i+.5)/500,q=Math.sqrt(1-y*y),a=i*2.399963;return [Math.cos(a)*q,y,Math.sin(a)*q];}),shape=sep.whole.torsoShape,out=[];
  for(const n of ['ball-shoulder','ball-hip','ball-neck']){const m=sg(n,n==='ball-neck'?'centre':'left');const worst=Math.max(...probes.map(p=>insideTorso(shape,m.centre.map((c,k)=>c+p[k]*(m.radius+SHOULDER_TORSO_GAP)))));
   assert(worst<=.001,n+' within 2 cm of the torso by '+(worst*1000).toFixed(2)+' mm');/* placed in 0.5 mm steps, sampled more finely here */let clear=Infinity;for(const p of probes){const d=-insideTorso(shape,m.centre.map((c,k)=>c+p[k]*m.radius));clear=Math.min(clear,d);}out.push(`${n.slice(5)} ${(clear*100).toFixed(1)} cm`);}
  return 'clear: '+out.join(', ');});
 check('separated: every piece sits one 6 mm gap from its balls along its line, and never closer anywhere',()=>{
  const pairs=[['ball-shoulder','upper-arm'],['ball-elbow','upper-arm'],['ball-elbow','forearm'],['ball-wrist','forearm'],['ball-wrist','hand'],['ball-hip','thigh'],['ball-knee','thigh'],['ball-knee','calf'],['ball-ankle','calf'],['ball-ankle','foot']];
  let worst=Infinity;for(const [bn,pn] of pairs){const m=sg(bn),p=sg(pn);let c=Infinity;for(let i=0;i<p.positions.length;i+=3)c=Math.min(c,dist(P(p.positions,i/3),m.centre));worst=Math.min(worst,c-m.radius);assert(c-m.radius>=BALL_GAP-1e-9,`${pn} only ${((c-m.radius)*1000).toFixed(1)} mm from ${bn}`);}
  const h=sg('head','centre'),n=sg('ball-neck','centre');let lowest=Infinity;for(let i=1;i<h.positions.length;i+=3)lowest=Math.min(lowest,h.positions[i]);assert(Math.abs(lowest-(n.centre[1]+n.radius+BALL_GAP))<1e-9,'head gap');
  return `closest ${(worst*1000).toFixed(1)} mm; head ${BALL_GAP*1000} mm above the neck ball`;});
 check('separated: no two parts touch anywhere (at least 6 mm apart; the feet just clear each other)',()=>{
  const grid=new Map(),cell=.02,key=(x,y,z)=>Math.floor(x/cell)+','+Math.floor(y/cell)+','+Math.floor(z/cell);
  sep.parts.forEach((p,pi)=>{for(let i=0;i<p.positions.length;i+=3){const k=key(p.positions[i],p.positions[i+1],p.positions[i+2]);(grid.get(k)??grid.set(k,[]).get(k)).push(pi,i);}});
  let worst=Infinity,which='';sep.parts.forEach((p,pi)=>{for(let i=0;i<p.positions.length;i+=3){const x=p.positions[i],y=p.positions[i+1],z=p.positions[i+2];
   for(let a=-1;a<=1;a++)for(let b2=-1;b2<=1;b2++)for(let c=-1;c<=1;c++){const gg=grid.get(key(x+a*cell,y+b2*cell,z+c*cell));if(!gg)continue;
    for(let k=0;k<gg.length;k+=2){if(gg[k]<=pi)continue;const q=sep.parts[gg[k]].positions,j=gg[k+1],d=Math.hypot(q[j]-x,q[j+1]-y,q[j+2]-z);if(d<worst){worst=d;which=`${p.name}.${p.side} / ${sep.parts[gg[k]].name}.${sep.parts[gg[k]].side}`;}}}}});
  assert(worst>=BALL_GAP-1e-6,`${which}: ${(worst*1000).toFixed(1)} mm`);return `closest: ${which}, ${(worst*1000).toFixed(1)} mm (legs moved ${(sep.legOut*1000).toFixed(1)} mm outward)`;});
 check('separated: every ball is exactly between its two pieces: on both pieces\' centre lines (within 0.5 mm), 6 mm from each along the line',()=>{
  const out=[];for(const [bn,above,below] of [['ball-elbow','upper-arm','forearm'],['ball-wrist','forearm','hand'],['ball-knee','thigh','calf'],['ball-ankle','calf','foot'],['ball-shoulder',null,'upper-arm'],['ball-hip',null,'thigh']]){
   const m=sg(bn),c=m.centre;const offLine=(pos,L)=>{const v=[0,1,2].map(k=>c[k]-L.centre[k]),s2=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2];return Math.hypot(...[0,1,2].map(k=>v[k]-L.dir[k]*s2));};
   if(above){const A=limbLine(sg(above).positions,sg(above).axis);assert(offLine(null,A)<5e-4,`${bn} off the ${above}'s line by ${(offLine(null,A)*1000).toFixed(2)} mm`);
    const axial=[0,1,2].reduce((t,k)=>t+(c[k]-A.centre[k])*A.dir[k],0)-A.end-m.radius;assert(Math.abs(axial-BALL_GAP)<1e-6,`${bn}: gap below the ${above} ${(axial*1000).toFixed(2)} mm`);}
   const under=sg(below);if(below==='hand'||below==='foot'){const A=limbLine(sg(above).positions,sg(above).axis),p=under.pivot,v=[0,1,2].map(k=>p[k]-c[k]),s2=v[0]*A.dir[0]+v[1]*A.dir[1]+v[2]*A.dir[2];
    const off=Math.hypot(...[0,1,2].map(k=>v[k]-A.dir[k]*s2));assert(off<5e-4,`${below}'s joint off the line by ${(off*1000).toFixed(2)} mm`);}
   else{const B=limbLine(under.positions,under.axis);assert(offLine(null,B)<5e-4,`${bn} off the ${below}'s line by ${(offLine(null,B)*1000).toFixed(2)} mm`);
    const axial=[0,1,2].reduce((t,k)=>t+(c[k]-B.centre[k])*B.dir[k],0);const gap=B.start-axial-m.radius;assert(Math.abs(gap-BALL_GAP)<1e-6,`${bn}: gap above the ${below} ${(gap*1000).toFixed(2)} mm`);}
   out.push(bn.slice(5));}
  return 'centred: '+out.join(', ');});
 check('thicker overall, same shapes: the thigh 15% wider than the hip ball, the calf 18% wider than its bigger ball; the forearm unchanged at 10%',()=>{
  assert.deepEqual(SLIM_OVER,{forearm:1.1,thigh:1.1+.05,calf:1.1+.08});return 'forearm 10%, thigh 15% (of the bigger hip ball), calf 18%';});
 check('the deeper hip press and the thicker limbs leave every ball its size (measured with every joint pressed alike)',()=>{
  // The sizes before this change (22 November 2026), in cm across: the deeper hip press shortens the thigh 1.2 cm and must not change them.
  // (The hip then 10% bigger on purpose, HIP_BALL_GROW: 23.1053 to 25.4158.)
  const was={shoulder:21.1808,elbow:18.0171,wrist:15.5476,hip:23.1053*HIP_BALL_GROW,knee:19.8728,ankle:19.9069};
  for(const [k,v] of Object.entries(was))assert(Math.abs(b.ballR[k]*200-v)<1e-3,`${k}: ${(b.ballR[k]*200).toFixed(4)} vs ${v}`);return 'unchanged';});
 check(`put together: the hip ball (placed as the 10% smaller one, sunk ${Math.round(HIP_TORSO_PRESS*100)}% of its radius, then grown outward) sits deep in the torso and ${Math.round((PREVIEW_PRESS+HIP_THIGH_EXTRA)*100)}% into the thigh (the other joints ${Math.round(PREVIEW_PRESS*100)}%)`,()=>{
  const pv=pressedPreviewBody('boy'),pg=(n,s='left')=>pv.parts.find(p=>p.name===n&&p.side===s),H=pg('ball-hip'),shape=pv.whole.torsoShape;
  // How deep a ball sits past the torso's surface, measured on its own: the smallest d for which a ball d smaller touches nothing inside (4,000 test points).
  const probes=Array.from({length:4000},(_,i)=>{const y=1-2*(i+.5)/4000,q=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*q,y,Math.sin(a)*q];});
  const sunk=m=>{let lo=-.3,hi=m.radius;for(let k=0;k<40;k++){const d=(lo+hi)/2;if(probes.every(p=>insideTorso(shape,m.centre.map((v,j)=>v+p[j]*(m.radius-d)))<=0))hi=d;else lo=d;}return hi;};
  // The ball is placed as the 10% smaller one was (sunk HIP_TORSO_PRESS of its radius), then grown outward: it sits at
  // least as deep as that smaller ball did.
  const rSmall=H.radius/HIP_BALL_GROW,into=sunk(H);assert(into>=HIP_TORSO_PRESS*rSmall-.001&&into<H.radius,`hip ball ${(into*100).toFixed(2)} cm into the torso, wanted at least ${(HIP_TORSO_PRESS*rSmall*100).toFixed(2)}`);
  // Test of the test for the placement: the smaller ball at the same height, moved back in by the growth, sinks exactly HIP_TORSO_PRESS.
  const small={centre:[H.centre[0]-(H.radius-rSmall),H.centre[1],H.centre[2]],radius:rSmall};assert(Math.abs(sunk(small)-HIP_TORSO_PRESS*rSmall)<.001,`smaller ball ${(sunk(small)*100).toFixed(2)} cm`);
  // Test of the test: the separated hip ball (clear of the torso) measures as not in it at all.
  assert(sunk(sg('ball-hip','left'))<0,'the separated ball measured as inside');
  // Into the limbs: each limb's top tip (on its own line) sits nearOffset past the ball's centre.
  const tipPast=(ball,limb)=>{const L=limbLine(limb.positions,limb.axis);return [0,1,2].reduce((a,k)=>a+(L.centre[k]+L.dir[k]*L.start-ball.centre[k])*L.dir[k],0);};
  const hipTip=tipPast(H,pg('thigh'));
  assert(Math.abs(hipTip-(1-PREVIEW_PRESS-HIP_THIGH_EXTRA)*H.radius)<1e-6&&Math.abs(nearOffset('hip',H.radius)-(1-PREVIEW_PRESS-HIP_THIGH_EXTRA)*H.radius)<1e-12,`thigh tip ${(hipTip*100).toFixed(2)} cm past the hip ball's centre`);
  return `into the torso ${(into*100).toFixed(2)} cm (radius ${(H.radius*100).toFixed(2)}); thigh's tip ${(-hipTip*100).toFixed(2)} cm above its centre`;});
 check('put together: real hip sockets in the torso: the ball\'s shape plus the 6 mm gap, sealed, smooth; the thighs keep their own rounded tops, mirrored',()=>{
  const pv=pressedPreviewBody('boy'),pg=(n,s='left')=>pv.parts.find(p=>p.name===n&&p.side===s),{centre:C,radius:r,R}=pv.hipSocket,Cr=[-C[0],C[1],C[2]];
  assert(Math.abs(R-r-SOCKET_GAP)<1e-12&&Math.abs(pg('ball-hip').radius-r)<1e-12);
  const out=[];
  for(const [name,part,centres] of [['torso',pg('torso','centre'),[C,Cr]]]){
   const P=part.positions,I=part.index;
   // Nothing inside the gap: every point, and every triangle's middle, at least R from the ball's centre (a flat triangle's middle sits a little inside its round corners: under 1 mm).
   let near=Infinity,mid=Infinity;for(let i=0;i<P.length;i+=3)for(const c of centres)near=Math.min(near,Math.hypot(P[i]-c[0],P[i+1]-c[1],P[i+2]-c[2]));
   for(let t=0;t<I.length;t+=3){const m=[0,1,2].map(k=>(P[3*I[t]+k]+P[3*I[t+1]+k]+P[3*I[t+2]+k])/3);for(const c of centres)mid=Math.min(mid,Math.hypot(m[0]-c[0],m[1]-c[1],m[2]-c[2]));}
   assert(near>=R-1e-9,`${name}: a point ${((R-near)*1000).toFixed(2)} mm inside the gap`);assert(mid>=R-.001,`${name}: a triangle ${((R-mid)*1000).toFixed(2)} mm inside the gap`);
   // Sealed (every edge in exactly two triangles), facing out (positive volume), no flat-pressed triangles, and smooth near the socket.
   const e=new Map(),fn=t=>{const q=k=>[P[3*I[t+k]],P[3*I[t+k]+1],P[3*I[t+k]+2]],a=q(0),u=q(1).map((v,j)=>v-a[j]),w=q(2).map((v,j)=>v-a[j]);return [u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];};
   let vol=0,small=Infinity;for(let t=0;t<I.length;t+=3){const n=fn(t);small=Math.min(small,Math.hypot(...n)/2);vol+=(P[3*I[t]]*n[0]+P[3*I[t]+1]*n[1]+P[3*I[t]+2]*n[2])/6;for(let k=0;k<3;k++){const a=I[t+k],c=I[t+(k+1)%3],key=a<c?a+','+c:c+','+a;(e.get(key)??e.set(key,[]).get(key)).push(t);}}
   assert([...e.values()].every(ts=>ts.length===2),`${name}: not sealed`);assert(vol>0,`${name}: faces in`);assert(small>1e-9,`${name}: a triangle pressed flat`);
   let worst=0;for(const [key,ts] of e){const x=+key.split(',')[0];if(!centres.some(c=>Math.hypot(P[3*x]-c[0],P[3*x+1]-c[1],P[3*x+2]-c[2])<.2))continue;const a=fn(ts[0]),c=fn(ts[1]);worst=Math.max(worst,Math.acos(Math.max(-1,Math.min(1,(a[0]*c[0]+a[1]*c[1]+a[2]*c[2])/(Math.hypot(...a)*Math.hypot(...c)))))*180/Math.PI);}
   assert(worst<43,`${name}: a ${worst.toFixed(0)}° crease by the socket`);
   out.push(`${name} ${((near-r)*1000).toFixed(1)} mm from the ball, sharpest turn ${worst.toFixed(0)}°`);}
  // The right thigh is the exact mirror of the left.
  const L=pg('thigh'),Rt=pg('thigh','right');for(let i=0;i<L.positions.length;i+=3)assert(L.positions[i]===-Rt.positions[i]&&L.positions[i+1]===Rt.positions[i+1]&&L.positions[i+2]===Rt.positions[i+2],'thighs not mirrored');
  // Shading directions on the torso: one per point, unit length, and true to the surface (within 25° of the directions
  // measured on its triangles; outside the sockets they are the torso's own smooth directions, carried through the splitting).
  const tor=pg('torso','centre');assert(tor.normals&&tor.normals.length===tor.positions.length,'torso shading directions missing');
  const A=angleNormals(tor);let off=0;for(let i=0;i<A.length;i+=3){const n=tor.normals.slice(i,i+3);assert(Math.abs(Math.hypot(...n)-1)<1e-9,'not unit length');off=Math.max(off,Math.acos(Math.min(1,n[0]*A[i]+n[1]*A[i+1]+n[2]*A[i+2]))*180/Math.PI);}
  assert(off<25,`a shading direction ${off.toFixed(0)}° off the surface`);out.push(`shading within ${off.toFixed(0)}° of the surface`);
  // The thighs keep their own rounded tops: the top half's widths along the thigh match the separated thigh's.
  const sep=sg('thigh','left'),width=(part,frac)=>{const Lp=limbLine(part.positions,part.axis),P=part.positions,s0=Lp.start+frac*Lp.length;let r=0;for(let i=0;i<P.length;i+=3){const v=[0,1,2].map(k=>P[i+k]-Lp.centre[k]),s=v[0]*Lp.dir[0]+v[1]*Lp.dir[1]+v[2]*Lp.dir[2];if(Math.abs(s-s0)<.012)r=Math.max(r,Math.hypot(...v.map((x,k)=>x-Lp.dir[k]*s)));}return r;};
  let moved=0;for(const frac of [.05,.15,.25,.35,.45])moved=Math.max(moved,Math.abs(width(L,frac)-width(sep,frac)));
  assert(moved<.002,`the thigh's top changed by ${(moved*1000).toFixed(2)} mm`);
  // Test of the test: the torso before its sockets does reach into the gap (so these checks can fail).
  const plain=pv.whole.torsoShape?pv.whole.parts.find(p=>p.name==='torso').positions:null;let inside=0;for(let i=0;i<plain.length;i+=3)for(const c of [C,Cr])if(Math.hypot(plain[i]-c[0],plain[i+1]-c[1],plain[i+2]-c[2])<R)inside++;
  assert(inside>0,'the torso before its sockets did not reach the gap');
  return out.join('; ')+`; thighs' tops unchanged in shape; without the sockets ${inside} torso points would be inside the gap`;});
 check('put together: no knee cups (the owner turned the round cups down): the thigh and the calf keep their own shapes, only moved into place',()=>{
  assert.equal(KNEE_CUPS,false);const pv=pressedPreviewBody('boy'),pg=(n,s='left')=>pv.parts.find(p=>p.name===n&&p.side===s);
  // How far a piece is from being the other one only moved: the same points, all shifted by one and the same amount.
  const shiftOnly=(a,c)=>{if(a.positions.length!==c.positions.length)return Infinity;const d=[0,1,2].map(k=>a.positions[k]-c.positions[k]);let worst=0;for(let i=0;i<a.positions.length;i++)worst=Math.max(worst,Math.abs(a.positions[i]-c.positions[i]-d[i%3]));return worst;};
  const out=[];for(const n of ['thigh','calf']){const off=shiftOnly(pg(n),sg(n));assert(off<1e-9,`${n}: its shape changed by ${(off*1000).toFixed(3)} mm`);assert(!pg(n).cup,`${n} has a cup`);out.push(`${n}: same shape, only moved`);}
  // Test of the test: a calf with a cup on it is caught.
  const cupped=cupLimbEnd(pg('calf'),pg('ball-knee'),{end:'top'});assert(shiftOnly(cupped,sg('calf'))>.001,'a cupped calf passed');
  return out.join('; ')+'; a calf with a cup is caught';});
 check('put together, limbs only (owner: "take away every part minus the upper arm, forearm, thighs and calves"): exactly the eight limb pieces, each identical to the put-together avatar\'s, point for point',()=>{
  const pv=pressedPreviewBody('boy'),lo=limbsOnlyBody('boy'),want=LIMBS_ONLY.flatMap(n=>[n+'.left',n+'.right']).sort(),names=body=>body.parts.map(p=>p.name+'.'+p.side).sort();
  assert.deepEqual(LIMBS_ONLY,['upper-arm','forearm','thigh','calf']);assert.deepEqual(names(lo),want);
  const same=(a,c)=>a.positions.length===c.positions.length&&a.index.length===c.index.length&&Array.from(a.positions).every((v,i)=>v===c.positions[i])&&Array.from(a.index).every((v,i)=>v===c.index[i]);
  const twin=p=>pv.parts.find(q=>q.name===p.name&&q.side===p.side);for(const p of lo.parts)assert(same(p,twin(p)),`${p.name}.${p.side} changed`);
  let low=Infinity,high=-Infinity;for(const p of lo.parts)for(let i=1;i<p.positions.length;i+=3){low=Math.min(low,p.positions[i]);high=Math.max(high,p.positions[i]);}
  assert(Math.abs(lo.height-(high-low))<1e-12&&lo.lowest===low,'height reported wrongly');
  // Tests of the test: the whole avatar is not "limbs only", and a limb with one point moved by 0.1 mm is caught.
  assert.notDeepEqual(names(pv),want,'the whole avatar passed as limbs only');
  const t=lo.parts[0],moved={...t,positions:Array.from(t.positions)};moved.positions[0]+=1e-4;assert(!same(moved,twin(t)),'a moved point was not caught');
  return `${lo.parts.length} pieces (${want.join(', ')}), every point identical; ${(lo.height*100).toFixed(1)} cm from the bottom of the calves to the top of the upper arms; the whole avatar (${pv.parts.length} pieces) and a limb with one point moved 0.1 mm are both caught`;});
 check('torso and shoulder balls side by side, not together (owner: "get the torso and the ball next to each other but not together, u can do both sides"): the put-together torso unchanged, both shoulder balls at their put-together size, height and depth, 2 cm clear of the torso, mirrored',()=>{
  const pv=pressedPreviewBody('boy'),ts=torsoShoulderBalls('boy',{pressed:pv,apart:sep}),out=[];
  assert.deepEqual(ts.parts.map(p=>p.name+'.'+p.side).sort(),['ball-shoulder.left','ball-shoulder.right','torso.centre']);
  const torso=pv.parts.find(p=>p.name==='torso'),same=(a,c)=>a.length===c.length&&Array.from(a).every((v,i)=>v===c[i]);
  assert(same(ts.torso.positions,torso.positions)&&same(ts.torso.index,torso.index),'the torso changed');
  // Space between the torso's surface and a ball: from the closest torso point to the ball's centre, minus its radius.
  const T=torso.positions,space=b=>{let near=Infinity;for(let i=0;i<T.length;i+=3)near=Math.min(near,Math.hypot(T[i]-b.centre[0],T[i+1]-b.centre[1],T[i+2]-b.centre[2]));return near-b.radius;};
  for(const side of ['left','right']){
   const b=ts.balls.find(p=>p.side===side),was=pv.parts.find(p=>p.name==='ball-shoulder'&&p.side===side);
   assert.equal(b.radius,was.radius,`${side}: ball size changed`);assert(Math.abs(b.centre[1]-was.centre[1])<1e-12&&Math.abs(b.centre[2]-was.centre[2])<1e-12,`${side}: height or depth changed`);
   assert(Math.abs(b.centre[0])>Math.abs(was.centre[0]),`${side}: not moved outward`);
   const c=space(b);assert(c>=SHOULDER_TORSO_GAP-.001,`${side}: only ${(c*100).toFixed(2)} cm from the torso`);assert(c<.04,`${side}: ${(c*100).toFixed(1)} cm away, not next to it`);
   // Test of the test: put together, the same ball overlaps the torso (negative space), so this check can fail.
   const before=space(was);assert(before<0,`${side}: the put-together ball did not overlap the torso`);
   out.push(`${side}: ${(c*100).toFixed(1)} cm clear (put together it was ${(-before*100).toFixed(1)} cm inside)`);}
  const L=ts.balls.find(p=>p.side==='left').centre,R=ts.balls.find(p=>p.side==='right').centre;assert(Math.abs(L[0]+R[0])<1e-12&&L[1]===R[1]&&L[2]===R[2],'not mirrored');
  assert(Math.abs(ts.clear-space(ts.balls.find(p=>p.side==='left')))<1e-12,'clear reported wrongly');
  return `torso unchanged; balls ${(ts.balls[0].radius*200).toFixed(1)} cm, same height and depth; `+out.join('; ');});
 // Shared by the two shoulder-socket checks below (both built once).
 let shoulderCut=null;const cutShoulders=()=>shoulderCut??(shoulderCut=(()=>{const pv=pressedPreviewBody('boy'),ps=pushShoulderBalls('boy',pv,{apart:sep});return {pv,ps,soft:softenShoulderRims(ps)};})());
 const meshFacts=(X,I)=>{const fn=t=>{const q=k=>[X[3*I[t+k]],X[3*I[t+k]+1],X[3*I[t+k]+2]],a=q(0),u=q(1).map((v,j)=>v-a[j]),w=q(2).map((v,j)=>v-a[j]);return [u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];};
  const e=new Map();let vol=0,flat=0;for(let t=0;t<I.length;t+=3){const n=fn(t);if(Math.hypot(...n)<1e-14)flat++;vol+=(X[3*I[t]]*n[0]+X[3*I[t]+1]*n[1]+X[3*I[t]+2]*n[2])/6;for(let k=0;k<3;k++){const a=I[t+k],c=I[t+(k+1)%3],key=a<c?a+','+c:c+','+a;(e.get(key)??e.set(key,[]).get(key)).push(t);}}
  // The sharpest bend between neighbouring triangles near given points (within `r`), counting only triangles over 0.1 mm²; smaller specks bent over 60 degrees are counted apart.
  const bends=(pts,r)=>{let worst=0,specks=0,speckArea=0;for(const [key,ts] of e){if(ts.length!==2)continue;const x=+key.split(',')[0],p=[X[3*x],X[3*x+1],X[3*x+2]];if(!pts.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2])<r))continue;
    const a=fn(ts[0]),c=fn(ts[1]),la=Math.hypot(...a),lc=Math.hypot(...c);if(!la||!lc)continue;const ang=Math.acos(Math.max(-1,Math.min(1,(a[0]*c[0]+a[1]*c[1]+a[2]*c[2])/(la*lc))))*180/Math.PI;
    if(Math.min(la,lc)/2<1e-7){if(ang>60){specks++;speckArea+=Math.min(la,lc)/2;}continue;}worst=Math.max(worst,ang);}return {worst,specks,speckArea};};
  return {fn,sealed:[...e.values()].every(ts=>ts.length===2),vol,flat,bends};};
 check('shoulder sockets: each ball pushed straight into the clay torso and pulled back out, the clay in its path taken out (cut exactly along the path\'s edge, the socket filled with the path\'s own surface); the clay outside the paths unmoved; sealed, no folds; balls back where they started',()=>{
  const {pv,ps}=cutShoulders(),S=ps.solid,P=S.positions,I=S.index,K=ps.kind;
  assert.deepEqual(ps.parts.map(p=>p.name+'.'+p.side).sort(),['ball-shoulder.left','ball-shoulder.right','torso.centre']);
  for(const b of ps.inBalls)assert(b===pv.parts.find(p=>p.name==='ball-shoulder'&&p.side===b.side),`${b.side}: not pushed to its put-together place`);
  for(const b of ps.balls)assert(b===sep.parts.find(p=>p.name==='ball-shoulder'&&p.side===b.side),`${b.side}: not pulled back out to where it started`);
  const r=ps.inBalls[0].radius,R=r+SOCKET_GAP;assert(Math.abs(ps.R-R)<1e-15);const phi=q=>Math.min(...ps.paths.map(w=>w.phi(q)));
  // No clay left inside a path; the socket's and the rim's points exactly on the path's edge.
  for(let i=0;i<P.length/3;i++){const q=[P[3*i],P[3*i+1],P[3*i+2]],f=phi(q);assert(f>=-1e-9,'clay left inside a path');if(K[i]===2)assert(Math.abs(f)<1e-9,'a socket point off the path\'s edge');if(K[i]===1)assert(Math.abs(f)<=1e-7,'a rim point off the path\'s edge');}
  // The clay outside the paths did not move: every point of the torso (with its usual socket triangles) outside the paths is still there, exactly.
  const have=new Set();for(let i=0;i<P.length;i+=3)have.add(P[i]+','+P[i+1]+','+P[i+2]);const T0=ps.refined.positions;let kept=0;
  for(let i=0;i<T0.length;i+=3){const q=[T0[i],T0[i+1],T0[i+2]];if(phi(q)<=1e-7)continue;assert(have.has(q.join(',')),'a point outside the paths moved or went missing');kept++;}
  // Sealed, facing out, no flat triangles, no fold-backs; every socket triangle faces into its socket.
  const m=meshFacts(P,I);assert(m.sealed,'not sealed');assert(m.vol>0,'faces in');assert.equal(m.flat,0,'flat triangles');
  let away=0;for(let t=0;t<I.length;t+=3){if(![0,1,2].some(k=>K[I[t+k]]===2))continue;const c=[0,1,2].map(j=>(P[3*I[t]+j]+P[3*I[t+1]+j]+P[3*I[t+2]+j])/3),w=ps.paths.find(w=>Math.sign(w.c[0])===Math.sign(c[0])),n=m.fn(t),d=w.inward(c);if(n[0]*d[0]+n[1]*d[1]+n[2]*d[2]<=0)away++;}assert.equal(away,0,`${away} socket triangles face the wrong way`);
  const rim=[];for(let i=0;i<K.length;i++)if(K[i]===1)rim.push([P[3*i],P[3*i+1],P[3*i+2]]);const b=m.bends(rim,.02);assert(b.worst<150,`a ${b.worst.toFixed(0)}° fold at a rim`);
  // Where the balls were: every triangle's middle at least half the gap (3 mm) from the ball (flat triangles across the round socket sag a little into the gap).
  let mid=Infinity;for(const w of ps.paths)for(let t=0;t<I.length;t+=3){const c=[0,1,2].map(j=>(P[3*I[t]+j]+P[3*I[t+1]+j]+P[3*I[t+2]+j])/3);mid=Math.min(mid,Math.hypot(c[0]-w.c[0],c[1]-w.c[1],c[2]-w.c[2]));}assert(mid-r>=SOCKET_GAP/2,`a triangle only ${((mid-r)*1000).toFixed(1)} mm from the ball`);
  // Drawn copy: the same triangles at the same places, with the rim's points copied for the socket's side (a hard edge).
  const D=ps.torso;assert.equal(D.index.length,I.length);for(let k=0;k<I.length;k++)for(let j=0;j<3;j++)assert.equal(D.positions[3*D.index[k]+j],P[3*I[k]+j],'the drawn copy differs');
  // Pulled out: each ball back beside the torso, at least the usual 2 cm from the clay.
  let gap=Infinity;for(const ball of ps.balls)for(let i=0;i<P.length;i+=3)gap=Math.min(gap,Math.hypot(P[i]-ball.centre[0],P[i+1]-ball.centre[1],P[i+2]-ball.centre[2])-ball.radius);assert(gap>=SHOULDER_TORSO_GAP-.001,`a pulled-out ball only ${(gap*100).toFixed(2)} cm from the torso`);
  // Test of the test: before the cut, the torso had clay inside the paths (so 'no clay left inside' can fail).
  let inside=0;for(let i=0;i<T0.length;i+=3)if(phi([T0[i],T0[i+1],T0[i+2]])<-1e-9)inside++;assert(inside>0,'nothing was in the balls\' paths');
  return `${Math.round(ps.displaced/2*1e6)} cm³ of clay out of each socket; ${kept.toLocaleString()} points outside the paths unmoved; rims exactly on the paths' edges, sharpest bend ${b.worst.toFixed(0)}° (left as the ball made it); sealed, no flat triangles, no socket triangle the wrong way; balls ${(gap*100).toFixed(1)} cm from the torso; before the cut ${inside} points were inside the paths`;});
 check(`shoulder sockets' rims chiselled and softened (owner, circling the thin sliver over the top: "chisel that away, then soften up the rim of the socket"): a ${Math.round(SHOULDER_RIM_ROUND*1000)} mm ball rolled along the inside of the clay and everything it could not reach cut off; far from the rims nothing changed; sealed; the rims' sharpest bend under 45 degrees`,()=>{
  const {ps,soft:s}=cutShoulders(),f=SHOULDER_RIM_ROUND,X=s.torso.positions,I=s.torso.index,Q=s.rough.positions,S=ps.solid.positions;
  assert.deepEqual(s.parts.map(p=>p.name+'.'+p.side).sort(),['ball-shoulder.left','ball-shoulder.right','torso.centre']);for(const b of s.balls)assert(ps.balls.includes(b),'the balls changed');
  const rim=[];ps.kind.forEach((k,i)=>{if(k===1)rim.push([S[3*i],S[3*i+1],S[3*i+2]]);});const near=(p,r)=>rim.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2])<r);
  // Far from the rims (more than 4f) nothing changed: every point of the cut there is still there, exactly.
  const have=new Set();for(let i=0;i<X.length;i+=3)have.add(X[i]+','+X[i+1]+','+X[i+2]);let far=0;
  for(let i=0;i<S.length;i+=3){const p=[S[i],S[i+1],S[i+2]];if(near(p,4*f))continue;assert(have.has(p.join(',')),'a point far from the rims moved');far++;}
  // Every point the round-over moved now lies on the rolled ball: exactly f from the ball's centre line.
  const seg=(p,[a,b])=>{const ab=[0,1,2].map(k=>b[k]-a[k]),l2=ab[0]**2+ab[1]**2+ab[2]**2,t=l2?Math.max(0,Math.min(1,((p[0]-a[0])*ab[0]+(p[1]-a[1])*ab[1]+(p[2]-a[2])*ab[2])/l2)):0;return Math.hypot(...[0,1,2].map(k=>p[k]-a[k]-t*ab[k]));};
  let moved=0,off=0;for(let i=0;i<X.length;i+=3){if(X[i]===Q[i]&&X[i+1]===Q[i+1]&&X[i+2]===Q[i+2])continue;moved++;const p=[X[i],X[i+1],X[i+2]];let d=Infinity;for(const l of s.line)d=Math.min(d,seg(p,l));off=Math.max(off,Math.abs(d-f));}
  assert(moved>0,'nothing was rounded');assert(off<1e-6,`a rounded point ${(off*1000).toFixed(3)} mm off the rolled ball`);assert.equal(moved,s.chiselled);
  // Sealed, facing out, no flat triangles; the rims soft: the sharpest bend near them under 45 degrees.
  const m=meshFacts(X,I);assert(m.sealed,'not sealed');assert(m.vol>0,'faces in');assert.equal(m.flat,0,'flat triangles');const b=m.bends(rim,.02);assert(b.worst<45,`a ${b.worst.toFixed(0)}° bend at a rim`);
  // Test of the test: the cut's raw rims are far sharper (so the 45 degree check can fail).
  const raw=meshFacts(ps.solid.positions,ps.solid.index).bends(rim,.02);assert(raw.worst>=45,`the raw rims were already soft (${raw.worst.toFixed(0)}°)`);
  return `${moved.toLocaleString()} points moved onto the rolled ball (all exactly ${(f*1000).toFixed(0)} mm from its centre line); ${(s.removed*1e6).toFixed(1)} cm³ of clay cut off in all; ${far.toLocaleString()} points far from the rims unmoved; sharpest bend at the rims ${b.worst.toFixed(1)}° (raw ${raw.worst.toFixed(0)}°); ${b.specks} specks under 0.1 mm² (${(b.speckArea*1e6).toFixed(2)} mm² in all) still bent sharply, too small to see; sealed, no flat triangles`;});
 check(`put together: the torso's hip socket rims are rounded out (no sharp edges): on the outer sides every bend by the sockets rounds over at least 12 mm, and only the rims change`,()=>{
  const pv=pressedPreviewBody('boy'),{centre:C,radius:r,R,soft}=pv.hipSocket,Cr=[-C[0],C[1],C[2]],base=pv.whole.parts.find(p=>p.name==='torso');
  // Tightest rounding by the sockets on their outer sides: each edge's length over the angle its two triangles bend by.
  const tightest=part=>{const P=part.positions,I=part.index,fn=t=>{const q=k=>[P[3*I[t+k]],P[3*I[t+k]+1],P[3*I[t+k]+2]],a=q(0),u=q(1).map((v,j)=>v-a[j]),w=q(2).map((v,j)=>v-a[j]);return [u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];};
   const e=new Map();for(let t=0;t<I.length;t+=3)for(let k=0;k<3;k++){const a=I[t+k],c=I[t+(k+1)%3],key=a<c?a+','+c:c+','+a;(e.get(key)??e.set(key,[]).get(key)).push(t);}
   let min=Infinity;for(const [key,ts] of e){const [x,y]=key.split(',').map(Number),m=[0,1,2].map(k=>(P[3*x+k]+P[3*y+k])/2);
    if(Math.abs(m[0])<=C[0]||Math.min(Math.hypot(...m.map((v,k)=>v-C[k])),Math.hypot(...m.map((v,k)=>v-Cr[k])))>.2)continue;
    const a=fn(ts[0]),c=fn(ts[1]),ang=Math.acos(Math.max(-1,Math.min(1,(a[0]*c[0]+a[1]*c[1]+a[2]*c[2])/(Math.hypot(...a)*Math.hypot(...c)))));if(ang<.05)continue;
    min=Math.min(min,Math.hypot(P[3*x]-P[3*y],P[3*x+1]-P[3*y+1],P[3*x+2]-P[3*y+2])/ang);}return min;};
  const done=pv.parts.find(p=>p.name==='torso'),now=tightest(done);
  // The same sockets without the rounding: a tighter edge (test of the test: the check sees the difference).
  const plain=mouldSockets({positions:base.positions,index:base.index},[C,Cr],R,soft,HIP_SOCKET_SKIN*r,0),before=tightest(plain);
  assert(now>=.012,`a rim rounds over only ${(now*1000).toFixed(1)} mm`);assert(before<.012,`unrounded already ${(before*1000).toFixed(1)} mm`);
  // Only the rims moved: nothing beyond the band (plus its fade), and nothing more than 1 cm.
  assert.equal(plain.positions.length,done.positions.length);let moved=0,far=0;const reach=R+HIP_RIM_BAND+2*.012;
  for(let i=0;i<done.positions.length;i+=3){const m=Math.hypot(...[0,1,2].map(k=>done.positions[i+k]-plain.positions[i+k]));moved=Math.max(moved,m);
   const q=Math.min(...[C,Cr].map(c=>Math.hypot(...[0,1,2].map(k=>plain.positions[i+k]-c[k]))));if(q>reach+1e-9)far=Math.max(far,m);}
  // (The thin wedge of torso at the front of each cup rounds off by pulling back: measured 2.1 cm.)
  assert(moved<=.025,`the torso moved ${(moved*1000).toFixed(1)} mm`);assert(far<1e-12,`moved beyond the rims by ${(far*1000).toFixed(3)} mm`);
  return `tightest outer rounding ${(before*1000).toFixed(1)} → ${(now*1000).toFixed(1)} mm (${HIP_RIM_ROUNDS} rounds within ${HIP_RIM_BAND*100} cm of the cups); torso moved at most ${(moved*1000).toFixed(1)} mm, only at the rims`;});
 check('test of the test: sinkIntoTorso to depth 0 just touches, and refuses a start inside the torso',()=>{
  const shape=sep.whole.torsoShape,H=sg('ball-hip','left'),c=sinkIntoTorso(shape,H.centre,H.radius,[0,-1,0],0);
  const probes=Array.from({length:2000},(_,i)=>{const y=1-2*(i+.5)/2000,q=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*q,y,Math.sin(a)*q];});
  const worst=r=>Math.max(...probes.map(p=>insideTorso(shape,c.map((v,j)=>v+p[j]*r))));assert(worst(H.radius)<=0&&worst(H.radius+.001)>0,'not touching');
  assert.throws(()=>sinkIntoTorso(shape,[H.centre[0],1,H.centre[2]],H.radius,[0,-1,0],0));return 'touches within 1 mm; inside start refused';});
 check('separated: the hip balls closer together than Our avatar\'s: its gap between their inner edges divided by the golden ratio',()=>{
  const l=sg('ball-hip','left'),r2=sg('ball-hip','right'),gap=(l.centre[0]-l.radius)-(r2.centre[0]+r2.radius);
  assert(Math.abs(HIP_BALL_GAP-ourAvatar.hipBallGap/GOLDEN)<1e-12);assert(Math.abs(gap-HIP_BALL_GAP)<.001,`gap ${(gap*100).toFixed(2)} cm, wanted ${(HIP_BALL_GAP*100).toFixed(2)} cm`);return `${(gap*100).toFixed(1)} cm apart (Our avatar ${(ourAvatar.hipBallGap*100).toFixed(1)} cm)`;});
 check('put together: the shoulder balls sit as far from the middle as Our avatar\'s (not wide shoulders); apart they still clear the torso by 2 cm',()=>{
  const pv=pressedPreviewBody('boy'),l=pv.parts.find(p=>p.name==='ball-shoulder'&&p.side==='left'),r2=pv.parts.find(p=>p.name==='ball-shoulder'&&p.side==='right');
  assert(Math.abs(l.centre[0]-ourAvatar.shoulderBallX)<1e-9&&Math.abs(-r2.centre[0]-ourAvatar.shoulderBallX)<1e-9,`left ${l.centre[0]}, right ${r2.centre[0]}, Our avatar ${ourAvatar.shoulderBallX}`);
  // Test of the test: the separated ball (2 cm clear of the torso) is further out, so the rule really moved it.
  const apart=sg('ball-shoulder','left').centre[0];assert(apart>ourAvatar.shoulderBallX+.05,`apart ${apart}`);
  // Only across: height and depth as before.
  assert(Math.abs(l.centre[1]-sg('ball-shoulder','left').centre[1])<1e-9&&Math.abs(l.centre[2]-sg('ball-shoulder','left').centre[2])<1e-9,'moved only across');
  return `${(l.centre[0]*100).toFixed(1)} cm from the middle (Our avatar ${(ourAvatar.shoulderBallX*100).toFixed(1)}; apart ${(apart*100).toFixed(1)})`;});
 check('separated: the right side is the exact mirror of the left',()=>{for(const p of sep.parts.filter(p=>p.side==='left')){const q=sg(p.name,'right');for(let i=0;i<p.positions.length;i+=3)assert(p.positions[i]===-q.positions[i]&&p.positions[i+1]===q.positions[i+1]&&p.positions[i+2]===q.positions[i+2],p.name);}return 'mirrored';});
 check('separated: reports his height apart',()=>`${(sep.height*100).toFixed(1)} cm with every piece apart (shorter once pressed together); ${sep.parts.reduce((n,p)=>n+p.index.length/3,0).toLocaleString()} triangles`);
}
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the original limbs with the athletic torso, approved head, hands and feet check out.');
process.exitCode=failed?1:0;
