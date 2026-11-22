// Checks the owner's mix (original-body.js): the original neck and limbs come
// from the original avatar (Avatar Checkpoint 1, from 3D-WORLD-3), unchanged and
// in their original places; the athletic torso, approved head (centred where the
// original head was), and approved hands and feet (at the original joints, at
// their latest sizes) complete him; every part faces outward; both sides match.
// Usage: node avatar-v2/check-original-body.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {originalLimbBody,separatedOriginalBody,pressedPreviewBody,PREVIEW_PRESS,SLIM_OVER_BALL,SLIM_LIMBS,SLIM_OVER,sinkIntoTorso,HIP_TORSO_PRESS,THIGH_VISIBLE_TOP,HIP_THIGH_TOP,nearOffset,squareTop,THIGH_TOP_ROUND,roundForearmEnd,FOREARM_ROUND_FROM,BALL_SIZE,endRadius,limbLine,stretchLimb,thickenTo,HIP_BALL_GAP,GOLDEN,ORIGINAL_LIMBS as src,ORIGINAL_HEAD_CENTRE,ORIGINAL_HAND_SHRINK,STRETCH_FROM,STRETCH_TO} from './original-body.js';
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
  const want=slim?SLIM_OVER[n]*2*Math.max(...neighbours[n].map(k=>b.ballR[k])):ourAvatar.limbs[n].thickness;
  const now=g(n,'left').positions,L=limbLine(now,g(n,'left').axis);let r=0;for(let i=0;i<now.length;i+=3){const v=[now[i]-L.centre[0],now[i+1]-L.centre[1],now[i+2]-L.centre[2]],sa=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2];r=Math.max(r,Math.hypot(v[0]-L.dir[0]*sa,v[1]-L.dir[1]*sa,v[2]-L.dir[2]*sa));}
  assert(Math.abs(2*r-want)<.003,`thickness ${(2*r*100).toFixed(1)} cm, wanted ${(want*100).toFixed(1)}`);return `thickness ${(2*r*100).toFixed(1)} cm, length ${(L.length*100).toFixed(1)} cm`;});}
check(`thigh: its upper part straight and full (squareTop): every ring from the top to the widest as wide as the widest, the top edge rounded over ${Math.round(THIGH_TOP_ROUND*100)}% of that width`,()=>{
  // On a test limb (the original thigh made thinner), point by point: rings only move straight out from the line.
  const before=thickenTo(src.parts.left.thigh.positions,.22),after=squareTop(before,THIGH_TOP_ROUND),L=limbLine(before);
  const side=(P,i)=>{const v=[0,1,2].map(k=>P[i+k]-L.centre[k]),s=v[0]*L.dir[0]+v[1]*L.dir[1]+v[2]*L.dir[2];return {s,rho:Math.hypot(...v.map((x,k)=>x-L.dir[k]*s)),off:v.map((x,k)=>x-L.dir[k]*s)};};
  let W=0,sW=0;for(let i=0;i<before.length;i+=3){const q=side(before,i);if(q.rho>W){W=q.rho;sW=q.s;}}
  const Rc=THIGH_TOP_ROUND*W,want=d=>d<Rc?W-Rc+Math.sqrt(Rc*Rc-(Rc-d)**2):W;let checked=0;
  for(let i=0;i<before.length;i+=3){const a=side(before,i),z=side(after,i);
   assert(Math.abs(a.s-z.s)<1e-12,'moved along the line');
   const cross=a.off[0]*z.off[1]-a.off[1]*z.off[0];assert(a.rho<1e-9||Math.abs(cross)<1e-9*(1+a.rho*z.rho),'turned around the line');
   if(a.s>=sW||a.rho<.01*W){assert(after.slice(i,i+3).every((x,k)=>x===before[i+k]),'moved below the widest ring or the tip');continue;}
   assert(Math.abs(z.rho-Math.max(a.rho,want(a.s-L.start)))<1e-9,`ring at ${((a.s-L.start)*100).toFixed(1)} cm: ${(z.rho*100).toFixed(2)} cm`);checked++;}
  // Test of the test: doing it twice changes nothing more (the straight top is already as full as it gets).
  const twice=squareTop(after,THIGH_TOP_ROUND);assert(twice.every((x,i)=>Math.abs(x-after[i])<1e-9),'not settled');
  // His thigh: as wide as the widest all the way up (each side by its own direction, from before the shaping).
  const T=g('thigh','left'),LT=limbLine(T.positions,T.axis);let top=0;for(let i=0;i<T.positions.length;i+=3){const v=[0,1,2].map(k=>T.positions[i+k]-LT.centre[k]),s=v[0]*LT.dir[0]+v[1]*LT.dir[1]+v[2]*LT.dir[2];if((s-LT.start)/LT.length<.25)top=Math.max(top,Math.hypot(...v.map((x,k)=>x-LT.dir[k]*s)));}
  assert(Math.abs(2*top-SLIM_OVER.thigh*2*b.ballR.hip)<1e-6,`top quarter ${(2*top*100).toFixed(2)} cm`);
  return `${checked} points moved out only; his thigh's top quarter ${(2*top*100).toFixed(1)} cm across, as wide as its widest`;});
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
 check('the thigh 15% wider than the hip ball and the calf a hair more (13%) than its bigger ball; the forearm unchanged at 10%',()=>{
  assert.deepEqual(SLIM_OVER,{forearm:1.1,thigh:1.1+.05,calf:1.1+.03});return 'forearm 10%, thigh 15% (of the bigger hip ball), calf 13%';});
 check('the deeper hip press and the thicker limbs leave every ball its size (measured with every joint pressed alike)',()=>{
  // The sizes before this change (22 November 2026), in cm across: the deeper hip press shortens the thigh 1.2 cm and must not change them.
  const was={shoulder:21.1808,elbow:18.0171,wrist:15.5476,hip:23.1053,knee:19.8728,ankle:19.9069};
  for(const [k,v] of Object.entries(was))assert(Math.abs(b.ballR[k]*200-v)<1e-3,`${k}: ${(b.ballR[k]*200).toFixed(4)} vs ${v}`);return 'unchanged';});
 check(`put together: the hip ball sinks ${Math.round(HIP_TORSO_PRESS*100)}% of its radius into the torso, and the thigh's top comes up to ${(THIGH_VISIBLE_TOP*100).toFixed(1)} cm below its centre (the other joints ${Math.round(PREVIEW_PRESS*100)}% in)`,()=>{
  const pv=pressedPreviewBody('boy'),pg=(n,s='left')=>pv.parts.find(p=>p.name===n&&p.side===s),H=pg('ball-hip'),shape=pv.whole.torsoShape;
  // How deep a ball sits past the torso's surface, measured on its own: the smallest d for which a ball d smaller touches nothing inside (4,000 test points).
  const probes=Array.from({length:4000},(_,i)=>{const y=1-2*(i+.5)/4000,q=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));return [Math.cos(a)*q,y,Math.sin(a)*q];});
  const sunk=m=>{let lo=-.3,hi=m.radius;for(let k=0;k<40;k++){const d=(lo+hi)/2;if(probes.every(p=>insideTorso(shape,m.centre.map((v,j)=>v+p[j]*(m.radius-d)))<=0))hi=d;else lo=d;}return hi;};
  const into=sunk(H);assert(Math.abs(into-HIP_TORSO_PRESS*H.radius)<.001,`hip ball ${(into*100).toFixed(2)} cm into the torso, wanted ${(HIP_TORSO_PRESS*H.radius*100).toFixed(2)}`);
  // Test of the test: the separated hip ball (clear of the torso) measures as not in it at all.
  assert(sunk(sg('ball-hip','left'))<0,'the separated ball measured as inside');
  // Into the thigh: the highest point of the moulded thigh, against the ball's centre.
  const T=pg('thigh').positions;let top=-Infinity;for(let i=1;i<T.length;i+=3)top=Math.max(top,T[i]-H.centre[1]);
  assert(Math.abs(top+THIGH_VISIBLE_TOP)<.001,`thigh's top ${(top*100).toFixed(2)} cm from the hip ball's centre, wanted ${(-THIGH_VISIBLE_TOP*100).toFixed(2)}`);
  // The other joints as before: the calf's top tip (1 - press) of the knee ball's radius past its centre.
  const C=pg('calf'),L=limbLine(C.positions,C.axis),K=pg('ball-knee'),tip=[0,1,2].reduce((a,k)=>a+(L.centre[k]+L.dir[k]*L.start-K.centre[k])*L.dir[k],0);
  assert(Math.abs(tip-nearOffset('knee',K.radius))<1e-6&&Math.abs(nearOffset('knee',K.radius)-(1-PREVIEW_PRESS)*K.radius)<1e-12,`calf tip ${(tip*100).toFixed(2)} cm past the knee ball's centre`);
  assert.equal(nearOffset('hip',H.radius),HIP_THIGH_TOP);
  return `into the torso ${(into*100).toFixed(2)} cm (radius ${(H.radius*100).toFixed(2)}); thigh's top ${(-top*100).toFixed(2)} cm below its centre (was 5.28); calf's tip ${(tip*100).toFixed(2)} cm past the knee's`;});
 check('put together: real hip sockets in the torso and the thighs: the ball\'s shape plus the 6 mm gap, sealed, smooth, mirrored',()=>{
  const pv=pressedPreviewBody('boy'),pg=(n,s='left')=>pv.parts.find(p=>p.name===n&&p.side===s),{centre:C,radius:r,R}=pv.hipSocket,Cr=[-C[0],C[1],C[2]];
  assert(Math.abs(R-r-SOCKET_GAP)<1e-12&&Math.abs(pg('ball-hip').radius-r)<1e-12);
  const out=[];
  for(const [name,part,centres] of [['torso',pg('torso','centre'),[C,Cr]],['thigh',pg('thigh'),[C]]]){
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
  // Test of the test: the thigh before its mould, at the same place, does reach into the gap (so these checks can fail).
  const plain=sg('thigh','left'),Lp=limbLine(plain.positions,plain.axis),Ln=limbLine(L.positions,L.axis),to=[0,1,2].map(k=>C[k]+Lp.dir[k]*HIP_THIGH_TOP-(Lp.centre[k]+Lp.dir[k]*Lp.start));
  let inside=0;for(let i=0;i<plain.positions.length;i+=3)if(Math.hypot(...[0,1,2].map(k=>plain.positions[i+k]+to[k]-C[k]))<R)inside++;
  assert(inside>0,'the unmoulded thigh did not reach the gap');assert(Math.abs(Ln.dir[1]+1)<1e-9);
  return out.join('; ')+`; without the mould ${inside} thigh points would be inside the gap`;});
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
