// Checks the assembled body (assembly.js) for the boy and girl in both
// shoulder/hip placements: joints where they should be, every ball sized by the
// rule, every limb one gap from its balls, left and right exact mirrors, limbs
// never inside the torso, every part sealed, and the whole body within budget.
// Usage: node avatar-v2/check-assembly.mjs   (part of npm run test:new-avatar)
import assert from 'node:assert/strict';
import {assemble,insideTorso,shoulderPreview,wristPreview,anklePreview,legPreview,fullBodyPreview,hipBallRadius,LIMB_SCALE,LEG_LENGTHEN,ANKLE_BALL_SCALE,END_BALL_TO_LIMB,thickestRadius,SHOULDER_TO_ARM,SHOULDER_TORSO_GAP,BODIES,PLACEMENTS} from './assembly.js';
import {buildHandFoot,CHOSEN_HAND_FOOT,HAND_FOOT_OPTIONS} from './hands-feet.js';
import {buildLimbShape,CHOSEN_ARM,CHOSEN_LEG,BOY_ARM,GIRL_ARM,BOY_ARM_THICKER,APPROVED_ARM_LENGTHS,girlVersion,limbRadius,thinnestAt,pairSizes,ARM_PAIR,LEG_PAIR,BALL_GAP,BALL_TO_LIMB,HIP,KNEE,ANKLE} from './limb-options.js';
import {SHOULDER,ELBOW,WRIST} from './arm.js';
import {CHOSEN_FACE,faceShapes} from './face.js';

const results=[];
const check=(name,fn)=>{try{results.push({check:name,result:'PASS',detail:fn()});}catch(e){results.push({check:name,result:'FAIL',detail:e.message});}};
const points=part=>Array.from({length:part.positions.length/3},(_,i)=>part.positions.slice(3*i,3*i+3));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],scaleV=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
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
check('boy\'s arm: the approved arm made exactly 10% thicker, same shape; the girl\'s arm still comes from the approved arm',()=>{
 let worst=0;for(const key of ['upper','fore'])for(let k=0;k<=50;k++)for(let a=0;a<36;a++){const t=k/50,ang=a/36*Math.PI*2;worst=Math.max(worst,Math.abs(limbRadius(BOY_ARM[key],t,ang)-BOY_ARM_THICKER*limbRadius(CHOSEN_ARM[key],t,ang)));}
 assert(worst<1e-12,'not exactly 10% thicker');assert.equal(BOY_ARM_THICKER,1.1);assert.deepEqual(GIRL_ARM,girlVersion(CHOSEN_ARM,ARM_PAIR));
 return 'boy ×1.10 everywhere; girl unchanged';
});
check('shoulder preview: the boy\'s upper arm keeps the approved length (24.5 cm) and is the thicker arm, only moved and turned',()=>{
 const p=shoulderPreview('boy'),own=buildLimbShape(BOY_ARM.upper,APPROVED_ARM_LENGTHS.upper);
 assert(Math.abs(p.upper.length-APPROVED_ARM_LENGTHS.upper)<1e-12,'length changed');assert(Math.abs(APPROVED_ARM_LENGTHS.upper-pairSizes(CHOSEN_ARM,ARM_PAIR).upper)<1e-12);
 assert.deepEqual(p.upper.index,own.index);
 const P=(arr,i)=>arr.slice(3*i,3*i+3);let worst=0;
 for(let i=0;i<own.positions.length/3;i+=7)for(let j=i+3;j<own.positions.length/3;j+=11)worst=Math.max(worst,Math.abs(dist(P(p.upper.positions,i),P(p.upper.positions,j))-dist(P(own.positions,i),P(own.positions,j))));
 assert(worst<1e-9,'reshaped by '+worst);return `${(p.upper.length*100).toFixed(1)} cm, shape identical to the boy's arm`;
});
check('shoulder preview: both sides; shoulder balls the size of a shoulder (5% bigger than the upper arm\'s thickest point)',()=>{
 const p=shoulderPreview('boy');assert.deepEqual(p.parts.map(x=>x.name+'.'+x.side),['torso.centre','ball-shoulder.left','ball-shoulder.right','upper-arm.left','upper-arm.right']);
 const arm=thickestRadius(BOY_ARM.upper);assert(Math.abs(p.shoulderBall-SHOULDER_TO_ARM*arm)<1e-12);assert(p.shoulderBall>arm,'not bigger than the arm');
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
// --- The wrist and the ankle: lower limb, end ball, chosen hand or foot ---------
// Both are built the same way, so both run the same checks.
{
 const P=(arr,i)=>arr.slice(3*i,3*i+3);
 const sameShape=(a,b)=>{let worst=0;for(let i=0;i<b.length/3;i+=7)for(let j=i+3;j<b.length/3;j+=13)worst=Math.max(worst,Math.abs(dist(P(a,i),P(a,j))-dist(P(b,i),P(b,j))));return worst;};
 const w=wristPreview('boy'),a=anklePreview('boy'),chosen=buildHandFoot(CHOSEN_HAND_FOOT);
 const joints=[
  {tag:'wrist',ballScale:1,limb:BOY_ARM.fore,limbLength:APPROVED_ARM_LENGTHS.fore,lengthNote:'approved length (22.2 cm)',lower:w.forearm,ball:w.wristBall,J:w.wrist,d:w.direction,part:w.hand,original:chosen.hand,names:['forearm','ball-wrist','hand'],parts:w.parts,moved:w.wristMovedBy},
  {tag:'ankle',limb:CHOSEN_LEG.calf,limbLength:pairSizes(CHOSEN_LEG,LEG_PAIR).calf*LEG_LENGTHEN,ballScale:ANKLE_BALL_SCALE,edgeLength:pairSizes(CHOSEN_LEG,LEG_PAIR).calf,lengthNote:'approved length made 10% longer',lower:a.calf,ball:a.ankleBall,J:a.ankle,d:a.direction,part:a.foot,original:chosen.foot,names:['calf','ball-ankle','foot'],parts:a.parts,moved:null},
 ];
 check('wrist and ankle: the chosen hand and foot are option 2 (the originals 8% bigger)',()=>{assert.equal(CHOSEN_HAND_FOOT,HAND_FOOT_OPTIONS[1]);return CHOSEN_HAND_FOOT.label;});
 for(const j of joints){
  check(`${j.tag}: one side only: ${j.names.join(', ')}`,()=>{assert.deepEqual(j.parts.map(p=>p.name),j.names);return j.names.join(' · ');});
  check(`${j.tag}: the ${j.names[0]} is the boy's, at its ${j.lengthNote}, unchanged in shape`,()=>{
   const own=buildLimbShape(j.limb,j.limbLength);assert(Math.abs(j.lower.length-j.limbLength)<1e-12);
   const d=sameShape(j.lower.positions,own.positions);assert(d<1e-9,'reshaped by '+d);return `${(j.lower.length*100).toFixed(1)} cm, shape identical`;
  });
  check(`${j.tag}: the ball is ${j.ballScale===1?'the same size as':(Math.round((j.ballScale-1)*100))+'% bigger than'} the ${j.names[0]}'s bottom edge as drawn${j.edgeLength?' (at its approved length)':''}`,()=>{
   assert.equal(END_BALL_TO_LIMB,1);
   // Measured on the drawn limb itself: its widest point in the bottom 30% of its length (where the rounded end begins).
   // (measured on a limb of the length the ball is sized from: placed straight down from the origin)
   const len=j.edgeLength??j.lower.length,drawn=j.edgeLength?buildLimbShape(j.limb,len).positions:j.lower.positions,d=j.edgeLength?[0,-1,0]:j.d,top=j.edgeLength?[0,0,0]:j.lower.top;let edge=0;const ring=new Map();
   for(let i=0;i<drawn.length;i+=3){const v=P(drawn,i/3).map((x,k)=>x-top[k]),a=v[0]*d[0]+v[1]*d[1]+v[2]*d[2];if(a<.7*len)continue;
    const r=Math.hypot(v[0]-a*d[0],v[1]-a*d[1],v[2]-a*d[2]);if(r>edge)edge=r;const key=a.toFixed(5);ring.set(key,Math.min(ring.get(key)??Infinity,r));}
   assert(Math.abs(j.ball-j.ballScale*edge)<1e-6,`ball ${(j.ball*200).toFixed(2)} cm, limb bottom edge ${(edge*200).toFixed(2)} cm`);
   // The bottom edge is round, so the ball matches in every direction.
   const widestRingMin=Math.max(...[...ring.values()].filter(r=>r>edge*.95)),outOfRound=2*(edge-widestRingMin);assert(outOfRound<.001,'bottom edge not round: '+(outOfRound*1000).toFixed(2)+' mm');
   // The ball's own surface really is that size.
   const ball=j.parts[1];let far=0;for(let i=0;i<ball.positions.length;i+=3)far=Math.max(far,dist(P(ball.positions,i/3),j.J));assert(Math.abs(far-j.ball)<1e-6,'ball surface size');
   return `ball ${(j.ball*200).toFixed(1)} cm wide; ${j.names[0]} bottom edge ${(edge*200).toFixed(1)} cm (edge round within ${(outOfRound*1000).toFixed(1)} mm)`;
  });
  // Test of the test: the first try (radius at the very tip) must be caught as too small.
  check(`${j.tag}: the size test catches a ball sized to the limb's tip (the first try)`,()=>{const tip=j.ballScale*thinnestAt(j.limb,1);assert(j.ball-tip>.003,'tip size not caught');return `tip ${(tip*200).toFixed(1)} cm is ${((j.ball-tip)*200).toFixed(1)} cm too small`;});
  check(`${j.tag}: the ${j.names[2]} is only moved, never reshaped`,()=>{
   const d=sameShape(j.part.positions,j.original.positions);assert(d<1e-9,'reshaped by '+d);return `shape identical; moved ${(Math.hypot(...j.part.shift)*100).toFixed(1)} cm along the ${j.names[0]}'s line`;
  });
  check(`${j.tag}: separate parts with 6 mm gaps; the ${j.names[2]} never touches the ball`,()=>{
   const bottom=add(j.lower.top,scaleV(j.d,j.lower.length));assert(Math.abs(dist(bottom,j.J)-(j.ball+BALL_GAP))<1e-9,'limb gap');
   let closest=Infinity,highest=-Infinity;
   for(let i=0;i<j.part.positions.length;i+=3){const p=P(j.part.positions,i/3);closest=Math.min(closest,dist(p,j.J));highest=Math.max(highest,-((p[0]-j.J[0])*j.d[0]+(p[1]-j.J[1])*j.d[1]+(p[2]-j.J[2])*j.d[2]));}
   assert(Math.abs(-highest-(j.ball+BALL_GAP))<1e-9,'part gap');assert(closest>=j.ball+BALL_GAP*.9,'touches the ball');
   return `gaps ${BALL_GAP*1000} mm each; ${j.names[2]} at least ${((closest-j.ball)*1000).toFixed(1)} mm from the ball`;
  });
  if(j.moved!==null)check(`${j.tag}: reports how far the joint moved from the skeleton`,()=>{assert(j.moved>0);return `${(j.moved*100).toFixed(1)} cm further along the limb`;});
 }
}
// --- The whole leg: longer limbs, bigger ankle ball (owner, 21 November 2026) -----
{
 const before=legPreview('boy',{lengthen:1,ankleBallScale:1}),after=legPreview('boy'),size=pairSizes(CHOSEN_LEG,LEG_PAIR);
 const P=(arr,i)=>arr.slice(3*i,3*i+3);
 const sameShape=(a,b)=>{let worst=0;for(let i=0;i<b.length/3;i+=7)for(let j=i+3;j<b.length/3;j+=13)worst=Math.max(worst,Math.abs(dist(P(a,i),P(a,j))-dist(P(b,i),P(b,j))));return worst;};
 check('leg: thigh, knee ball, calf, ankle ball, foot, in order',()=>{assert.deepEqual(after.parts.map(p=>p.name),['thigh','ball-knee','calf','ball-ankle','foot']);return after.parts.map(p=>p.name).join(' · ');});
 check('leg: before = the approved lengths; longer = exactly 10% longer thigh and calf, same shape and thickness',()=>{
  assert(Math.abs(before.thigh.length-size.thigh)<1e-12&&Math.abs(before.calf.length-size.calf)<1e-12);assert.equal(LEG_LENGTHEN,1.1);
  assert(Math.abs(after.thigh.length-1.1*size.thigh)<1e-12&&Math.abs(after.calf.length-1.1*size.calf)<1e-12);
  for(const k of ['thigh','calf']){const own=buildLimbShape(CHOSEN_LEG[k],after[k].length);assert(sameShape(after[k].positions,own.positions)<1e-9,k+' reshaped');}// same limb recipe, so same thickness
  return `thigh ${(before.thigh.length*100).toFixed(1)} → ${(after.thigh.length*100).toFixed(1)} cm, calf ${(before.calf.length*100).toFixed(1)} → ${(after.calf.length*100).toFixed(1)} cm`;
 });
 check('leg: knee ball unchanged by the lengthening; ankle ball 10% bigger than before',()=>{
  assert(Math.abs(after.kneeBall-before.kneeBall)<1e-12);assert.equal(ANKLE_BALL_SCALE,1.1);
  const ratio=after.ankleBall/before.ankleBall;assert(Math.abs(ratio-1.1)<.005,'ankle ball ratio '+ratio);// the longer calf's bottom edge is within 0.5% of the shorter one's
  return `knee ${(after.kneeBall*200).toFixed(1)} cm; ankle ${(before.ankleBall*200).toFixed(1)} → ${(after.ankleBall*200).toFixed(1)} cm`;
 });
 check('leg: every part separate, 6 mm gaps along the leg line (thigh to knee ball to calf)',()=>{
  const d=after.direction,thighBottom=add(after.thigh.top,scaleV(d,after.thigh.length));
  assert(Math.abs(dist(thighBottom,after.knee)-(after.kneeBall+BALL_GAP))<1e-9,'thigh gap');assert(Math.abs(dist(after.calf.top,after.knee)-(after.kneeBall+BALL_GAP))<1e-9,'calf gap');
  return 'gaps 6 mm';
 });
 check('leg: longer leg is longer than before and than the original avatar (hip to sole)',()=>{
  assert(after.hipToSole>before.hipToSole&&before.hipToSole>before.originalHipToSole);
  return `original ${(before.originalHipToSole*100).toFixed(1)} cm, before ${(before.hipToSole*100).toFixed(1)} cm, longer ${(after.hipToSole*100).toFixed(1)} cm`;
 });
}
// --- The full body: every approved piece, still separate -----------------------
{
 const f=fullBodyPreview('boy'),sh=shoulderPreview('boy'),P=(arr,i)=>arr.slice(3*i,3*i+3);
 const names=['torso','ball-neck','head',...['ball-shoulder','upper-arm','ball-elbow','forearm','ball-wrist','hand','ball-hip','thigh','ball-knee','calf','ball-ankle','foot'].flatMap(n=>[n+'.left',n+'.right'])];
 check('full body: all 27 pieces, each once',()=>{const got=f.parts.map(p=>p.side==='centre'?p.name:p.name+'.'+p.side).sort();assert.deepEqual(got,[...names].sort());return f.parts.length+' pieces';});
 const f1=fullBodyPreview('boy',{limbScale:1}),K=LIMB_SCALE,limbNames=['ball-shoulder','upper-arm','ball-elbow','forearm','ball-wrist','hand','ball-hip','thigh','ball-knee','calf','ball-ankle','foot'];
 const sameShapeScaled=(a,b,k)=>{let worst=0;for(let i=0;i<b.length/3;i+=7)for(let j=i+5;j<b.length/3;j+=17)worst=Math.max(worst,Math.abs(dist(P(a,i),P(a,j))-k*dist(P(b,i),P(b,j))));return worst;};
 check('full body: at normal size, the torso, shoulder balls and upper arms are exactly the approved shoulder preview',()=>{
  let worst=0;for(const p of sh.parts){const q=f1.parts.find(x=>x.name===p.name&&x.side===p.side);assert(q,p.name);q.positions.forEach((v,i)=>{worst=Math.max(worst,Math.abs(v-p.positions[i]));});}assert(worst<1e-12,'moved '+worst);return 'identical (within rounding)';});
 check('full body: torso, neck ball and head unchanged by the bigger limbs',()=>{
  for(const n of ['torso','ball-neck','head'])assert.deepEqual(f.parts.find(p=>p.name===n).positions,f1.parts.find(p=>p.name===n).positions,n);return 'identical';});
 check('full body: every arm and leg piece exactly 15% bigger, same shape',()=>{
  assert.equal(K,1.15);let worst=0;for(const n of limbNames){const a=f.parts.find(p=>p.name===n&&p.side==='left'),b=f1.parts.find(p=>p.name===n&&p.side==='left');worst=Math.max(worst,sameShapeScaled(a.positions,b.positions,K));}
  assert(worst<1e-9,'shape changed by '+worst);return `${limbNames.length} pieces ×${K}`;});
 check('full body: limb lengths are the approved ones (legs 10% longer), then 15% bigger',()=>{
  const len=n=>f.parts.find(p=>p.name===n&&p.side==='left').length,legs=pairSizes(CHOSEN_LEG,LEG_PAIR);
  assert(Math.abs(len('upper-arm')-K*APPROVED_ARM_LENGTHS.upper)<1e-12&&Math.abs(len('forearm')-K*APPROVED_ARM_LENGTHS.fore)<1e-12);
  assert(Math.abs(len('thigh')-K*1.1*legs.thigh)<1e-12&&Math.abs(len('calf')-K*1.1*legs.calf)<1e-12);
  return ['upper-arm','forearm','thigh','calf'].map(n=>`${n} ${(len(n)*100).toFixed(1)} cm`).join(', ');});
 check('full body: the right side is the exact mirror of the left',()=>{
  for(const p of f.parts.filter(p=>p.side==='left')){const q=f.parts.find(x=>x.name===p.name&&x.side==='right');for(let i=0;i<p.positions.length;i+=3)assert(Math.abs(p.positions[i]+q.positions[i])<1e-12&&p.positions[i+1]===q.positions[i+1]&&p.positions[i+2]===q.positions[i+2],p.name);}
  return 'mirrored';});
 check('full body: hip balls (joint rule, then 15% bigger) sit 2 cm clear of the torso, like the shoulders',()=>{
  const r=K*hipBallRadius(CHOSEN_LEG),H=f.joints.hip;assert(Math.abs(f.balls.hip-r)<1e-12);
  const probes=Array.from({length:400},(_,i)=>{const y=1-2*(i+.5)/400,q=Math.sqrt(1-y*y),a=i*2.399963;return [Math.cos(a)*q,y,Math.sin(a)*q];});
  assert(probes.every(p=>insideTorso(f.torsoShape,add(H,scaleV(p,r+SHOULDER_TORSO_GAP)))<=0),'hip ball within 2 cm of the torso');
  return `hip balls ${(r*200).toFixed(1)} cm, moved down ${((HIP[1]-H[1])*100).toFixed(1)} cm`;});
 // No two pieces touch: nearest points between every pair (except the neck ball, sunk into the torso by the approved option 5).
 check('full body: no two pieces touch (at least 4 mm apart; the approved sunk neck ball excepted)',()=>{
  const cell=.02,grid=new Map(),key=(x,y,z)=>Math.floor(x/cell)+','+Math.floor(y/cell)+','+Math.floor(z/cell);
  f.parts.forEach((p,pi)=>{for(let i=0;i<p.positions.length;i+=3){const k=key(p.positions[i],p.positions[i+1],p.positions[i+2]);let c=grid.get(k);if(!c)grid.set(k,c=[]);c.push(pi,i);}});
  let worst=Infinity,pair='';
  f.parts.forEach((p,pi)=>{for(let i=0;i<p.positions.length;i+=3){const x=p.positions[i],y=p.positions[i+1],z=p.positions[i+2];
   for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const g=grid.get(key(x+a*cell,y+b*cell,z+c*cell));if(!g)continue;
    for(let k=0;k<g.length;k+=2){const qj=g[k];if(qj<=pi)continue;const names2=[p.name,f.parts[qj].name].sort().join('/');if(names2==='ball-neck/torso')continue;
     const q=f.parts[qj].positions,j=g[k+1],d=Math.hypot(q[j]-x,q[j+1]-y,q[j+2]-z);if(d<worst){worst=d;pair=`${p.name}.${p.side} / ${f.parts[qj].name}.${f.parts[qj].side}`;}}}}});
  assert(worst>=.004,`${pair} only ${(worst*1000).toFixed(1)} mm apart`);return `closest: ${pair}, ${(worst*1000).toFixed(1)} mm`;});
 check('full body: each whole leg moved outward only as far as needed to keep the feet apart',()=>{assert(f.legOut>0&&f.legOut<.05);return `each leg ${(f.legOut*100).toFixed(1)} cm outward`;});
 check('full body: reports his height against the original avatar (about 1.89 m)',()=>{assert(f.height>1.5&&f.height<3);return `${(f.height*100).toFixed(1)} cm`;});
}
console.table(results);
const failed=results.filter(r=>r.result!=='PASS').length;
console.log(failed?`FAIL: ${failed} check(s) failed.`:'PASS: the assembled boy and girl are put together as stated in both placements.');
process.exitCode=failed?1:0;
