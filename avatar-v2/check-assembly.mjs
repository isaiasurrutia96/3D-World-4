// Checks the assembled body (assembly.js) for the boy and girl in both
// shoulder/hip placements: joints where they should be, every ball sized by the
// rule, every limb one gap from its balls, left and right exact mirrors, limbs
// never inside the torso, every part sealed, and the whole body within budget.
// Usage: node avatar-v2/check-assembly.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {assemble,insideTorso,shoulderPreview,thickestRadius,SHOULDER_TO_ARM,SHOULDER_TORSO_GAP,BODIES,PLACEMENTS} from './assembly.js';
import {buildLimbShape,CHOSEN_ARM,thinnestAt,pairSizes,ARM_PAIR,LEG_PAIR,BALL_GAP,BALL_TO_LIMB,HIP,KNEE,ANKLE} from './limb-options.js';
import {SHOULDER,ELBOW,WRIST} from './arm.js';
import {CHOSEN_FACE,faceShapes} from './face.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const points=part=>Array.from({length:part.positions.length/3},(_,i)=>part.positions.slice(3*i,3*i+3));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const BUDGET=29000;// the whole phone avatar (the earlier Game copy's size)

check('the inside-the-torso measure: positive inside, negative outside, including above and below the torso (test of the test)',()=>{
 const a=assemble('boy'),t=a.torsoShape,mid=(t.rings[0].y+t.rings.at(-1).y)/2;
 assert(insideTorso(t,[0,mid,0])>.1,'centre not inside');assert(insideTorso(t,[1,mid,0])<-.5,'far side not outside');
 assert(insideTorso(t,[0,t.bottom.y-.1,0])<=-.099,'below the torso not clearly outside');assert(insideTorso(t,[0,t.top.y+.1,0])<=-.099,'above the torso not clearly outside');
 return 'inside, beside, below and above all measured correctly';
});
check('unknown bodies and placements are refused',()=>{assert.throws(()=>assemble('robot'),/unknown body/);assert.throws(()=>assemble('boy','floating'),/unknown placement/);return 'refused';});
check('the chosen base face is the rounder eyes, slightly closer together, with the line mouth',()=>{
 assert.equal(CHOSEN_FACE.eyes.apart,.17);assert(CHOSEN_FACE.eyes.height/CHOSEN_FACE.eyes.width<1.55);const s=faceShapes(CHOSEN_FACE);assert.equal(s.length,3);
 return `eyes ${(CHOSEN_FACE.eyes.width*100).toFixed(1)} × ${(CHOSEN_FACE.eyes.height*100).toFixed(1)}%, ${(CHOSEN_FACE.eyes.apart*100).toFixed(0)}% from centre`;
});

for(const bodyId of Object.keys(BODIES))for(const placement of PLACEMENTS){
 const a=assemble(bodyId,placement),tag=`${BODIES[bodyId].label} · ${placement}`,body=BODIES[bodyId];
 const part=(name,side='left')=>a.parts.find(p=>p.name===name&&p.side===side);
 check(`${tag}: joint balls follow the rule (92% of the thinner limb end)`,()=>{
  assert(Math.abs(a.balls.shoulder-BALL_TO_LIMB*thinnestAt(body.arm.upper,0))<1e-12);assert(Math.abs(a.balls.hip-BALL_TO_LIMB*thinnestAt(body.leg.thigh,0))<1e-12);
  assert(Math.abs(a.balls.elbow-pairSizes(body.arm,ARM_PAIR).ball)<1e-12);assert(Math.abs(a.balls.knee-pairSizes(body.leg,LEG_PAIR).ball)<1e-12);
  return Object.entries(a.balls).map(([k,v])=>`${k} ${(v*200).toFixed(1)} cm`).join(', ');
 });
 if(placement==='joints')check(`${tag}: every joint exactly where the skeleton has it`,()=>{
  for(const [k,want] of Object.entries({shoulder:SHOULDER,elbow:ELBOW,wrist:WRIST,hip:HIP,knee:KNEE,ankle:ANKLE}))assert(dist(a.joints[k],want)<1e-12,k);return 'all six joints';
 });
 check(`${tag}: shoulder and hip balls ${placement==='joints'?'sit partly inside the torso (reported)':'clear the torso by the gap'}`,()=>{
  const depth=name=>{const b=part(name);let d=-Infinity;for(const p of points(b))d=Math.max(d,insideTorso(a.torsoShape,p));return d;};
  const ds=depth('ball-shoulder'),dh=depth('ball-hip');
  if(placement==='resting')assert(ds<=-BALL_GAP*.9&&dh<=-BALL_GAP*.9,`still touching (${(ds*1000).toFixed(1)}, ${(dh*1000).toFixed(1)} mm)`);
  else assert(ds>0&&dh>0,'expected the balls to sit partly inside');
  return `shoulder ${ds>0?'inside by':'clear by'} ${(Math.abs(ds)*100).toFixed(1)} cm, hip ${dh>0?'inside by':'clear by'} ${(Math.abs(dh)*100).toFixed(1)} cm`;
 });
 check(`${tag}: every limb one gap from each joint ball (or ending at the wrist/ankle joint)`,()=>{
  const chains=[['upper-arm','shoulder','elbow','elbow'],['forearm','elbow','wrist',null],['thigh','hip','knee','knee'],['calf','knee','ankle',null]];
  for(const [name,j1,j2,ball2] of chains){
   const limb=part(name),ys=points(limb),top=limb.top,bottom=[top[0]+limb.direction[0]*limb.length,top[1]+limb.direction[1]*limb.length,top[2]+limb.direction[2]*limb.length];
   assert(Math.abs(dist(top,a.joints[j1])-(a.balls[j1]+BALL_GAP))<1e-9,name+' top');
   assert(Math.abs(dist(bottom,a.joints[j2])-(ball2?a.balls[ball2]+BALL_GAP:0))<1e-9,name+' bottom');
   assert(limb.length>.05,name+' too short');
  }
  return chains.map(([n])=>`${n} ${(part(n).length*100).toFixed(1)} cm`).join(', ');
 });
 check(`${tag}: right side is the exact mirror of the left`,()=>{
  for(const l of a.parts.filter(p=>p.side==='left')){const r=part(l.name,'right');assert.equal(r.positions.length,l.positions.length);
   for(let i=0;i<l.positions.length;i++)assert(Math.abs(r.positions[i]-(i%3===0?-l.positions[i]:l.positions[i]))<1e-12,l.name);}
  return a.parts.filter(p=>p.side==='left').length+' mirrored pairs';
 });
 check(`${tag}: no limb pushes into the torso; the legs do not touch each other`,()=>{
  let worst=-Infinity,which='';
  for(const name of ['upper-arm','forearm','thigh','calf'])for(const p of points(part(name))){const d=insideTorso(a.torsoShape,p);if(d>worst){worst=d;which=name;}}
  assert(worst<=.001,`${which} inside the torso by ${(worst*1000).toFixed(1)} mm`);
  const inner=Math.min(...['thigh','calf','ball-knee','ball-hip'].flatMap(n=>points(part(n)).map(p=>p[0])));
  assert(inner>0,'left leg crosses the middle');
  return `closest limb to the torso: ${which}, ${(-worst*1000).toFixed(1)} mm clear; legs ${(inner*200).toFixed(1)} cm apart at the inside`;
 });
 check(`${tag}: every part sealed (each edge shared by exactly two triangles)`,()=>{
  for(const p of a.parts){const edges=new Map();for(let i=0;i<p.index.length;i+=3)for(let k=0;k<3;k++){const x=p.index[i+k],y=p.index[i+(k+1)%3],e=x<y?x+','+y:y+','+x;edges.set(e,(edges.get(e)||0)+1);}
   assert([...edges.values()].every(n=>n===2),p.name+' '+p.side+' open');}
  return a.parts.length+' parts';
 });
 check(`${tag}: the whole body (so far, no hands or feet yet) is within the ${BUDGET.toLocaleString()}-triangle phone budget`,()=>{
  const total=a.parts.reduce((n,p)=>n+p.index.length/3,0);assert(total<BUDGET);return `${total.toLocaleString()} triangles (${Math.round(total/BUDGET*100)}% of the budget)`;
 });
 check(`${tag}: head sits on the neck ball above the torso; the face is the chosen base face`,()=>{
  const neck=part('ball-neck','centre'),head=part('head','centre');assert(head.centre[1]>neck.centre[1]);assert.equal(a.face,CHOSEN_FACE);
  return `head centre ${head.centre[1].toFixed(3)} m`;
 });
}
check('placements: "resting" widens the shoulders and lowers the hips; "joints" keeps the skeleton',()=>{
 const out=[];for(const b of Object.keys(BODIES)){const j=assemble(b,'joints'),r=assemble(b,'resting');
  assert(r.joints.shoulder[0]>j.joints.shoulder[0]&&r.joints.hip[1]<j.joints.hip[1]);
  out.push(`${b}: shoulders +${((r.joints.shoulder[0]-j.joints.shoulder[0])*100).toFixed(1)} cm each side, hips ${((j.joints.hip[1]-r.joints.hip[1])*100).toFixed(1)} cm lower`);}
 return out.join('; ');
});
check('shoulder preview: the approved upper arm is EXACTLY unchanged (same shape settings, same 24.5 cm length, same surface)',()=>{
 const p=shoulderPreview('boy'),approved=buildLimbShape(CHOSEN_ARM.upper,pairSizes(CHOSEN_ARM,ARM_PAIR).upper);
 assert(Math.abs(p.upper.length-pairSizes(CHOSEN_ARM,ARM_PAIR).upper)<1e-12,'length changed');
 assert.equal(p.upper.positions.length,approved.positions.length);assert.deepEqual(p.upper.index,approved.index);
 // Same surface: every distance between points matches the approved limb (only moved and turned, never reshaped).
 const P=(arr,i)=>arr.slice(3*i,3*i+3);let worst=0;
 for(let i=0;i<approved.positions.length/3;i+=7)for(let j=i+3;j<approved.positions.length/3;j+=11)worst=Math.max(worst,Math.abs(dist(P(p.upper.positions,i),P(p.upper.positions,j))-dist(P(approved.positions,i),P(approved.positions,j))));
 assert(worst<1e-9,'reshaped by '+worst);
 return `24.5 cm, ${approved.index.length/3} triangles, shape identical (largest difference ${worst.toExponential(0)} m)`;
});
check('shoulder preview: both sides; shoulder balls the size of a shoulder (5% bigger than the upper arm\'s thickest point)',()=>{
 const p=shoulderPreview('boy');assert.deepEqual(p.parts.map(x=>x.name+'.'+x.side),['torso.centre','ball-shoulder.left','ball-shoulder.right','upper-arm.left','upper-arm.right']);
 const arm=thickestRadius(CHOSEN_ARM.upper);assert(Math.abs(p.shoulderBall-SHOULDER_TO_ARM*arm)<1e-12);assert(p.shoulderBall>arm,'not bigger than the arm');
 return `ball ${(p.shoulderBall*200).toFixed(1)} cm wide; upper arm at its thickest ${(arm*200).toFixed(1)} cm`;
});
check(`shoulder preview: the shoulder balls are separated from the torso by a visible gap (${SHOULDER_TORSO_GAP*100} cm), never touching it`,()=>{
 const p=shoulderPreview('boy');let worst=-Infinity;
 for(const b of p.parts.filter(x=>x.name==='ball-shoulder'))for(let i=0;i<b.positions.length;i+=3)worst=Math.max(worst,insideTorso(p.torsoShape,b.positions.slice(i,i+3)));
 assert(worst<=-SHOULDER_TORSO_GAP*.95,`gap only ${(-worst*1000).toFixed(1)} mm`);
 return `clear by ${(-worst*1000).toFixed(1)} mm; moved out ${(p.movedOut*100).toFixed(1)} cm from the skeleton's shoulder joint`;
});
check('shoulder preview: right side is the exact mirror of the left; the arms hang one gap below the balls and stay out of the torso',()=>{
 const p=shoulderPreview('boy'),get=(n,side)=>p.parts.find(x=>x.name===n&&x.side===side);
 for(const n of ['ball-shoulder','upper-arm']){const l=get(n,'left'),r=get(n,'right');for(let i=0;i<l.positions.length;i++)assert(Math.abs(r.positions[i]-(i%3===0?-l.positions[i]:l.positions[i]))<1e-12,n);}
 assert(Math.abs(dist(p.upper.top,p.shoulder)-(p.shoulderBall+BALL_GAP))<1e-12,'arm not one gap below the ball');
 let worst=-Infinity;for(const side of ['left','right']){const a=get('upper-arm',side);for(let i=0;i<a.positions.length;i+=3)worst=Math.max(worst,insideTorso(p.torsoShape,a.positions.slice(i,i+3)));}
 assert(worst<=0,'arm inside the torso by '+(worst*1000).toFixed(1)+' mm');return `arms clear of the torso by ${(-worst*1000).toFixed(1)} mm`;
});
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the assembled boy and girl are put together as stated in both placements.');
process.exitCode=failed?1:0;
