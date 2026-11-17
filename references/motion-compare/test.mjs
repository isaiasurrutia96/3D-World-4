import assert from 'node:assert/strict';
import * as T from 'three';
import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
import {handBindPlugin} from './hand-bind.mjs';
import {REST_POSE as HAND_REST} from '../../hand-lab/src/hand-rig.js';
await build({entryPoints:['references/avatar-walk/matched.js'],bundle:true,platform:'node',format:'esm',plugins:[handBindPlugin()],outfile:'/tmp/matched-motion-test.mjs'});
const {MatchedMotion,CYCLE}=await import('/tmp/matched-motion-test.mjs'),motion=new MatchedMotion();
const UP=new T.Vector3(0,1,0),DOWN=UP.clone().negate();let maxDirectionError=0,maxBoneError=0,maxArmSagittalError=0,oldArmSpread=0,newArmSpread=0,armSamples=0;const maxToe=[0,0];let minLean=Infinity,maxLean=-Infinity;
const swingRanges=motion.arms.map(()=>({source:[],actual:[]}));
const baseline=motion.legs.map(l=>({foot:l.motion.restPositions.slice(),calf:l.socket.restPositions.slice(),join:(l.calf.geometry.userData.cavityVertexCount+(l.calf.geometry.userData.lipRings-1)*l.calf.geometry.userData.segments)*3}));
const error=(a,b)=>{maxDirectionError=Math.max(maxDirectionError,a.distanceTo(b));};
for(let f=0;f<77;f+=.5){
 motion.setFrame(f);const p=motion.sourcePoints,dir=(a,b)=>p[b].clone().sub(p[a]).normalize();
 for(let i=0;i<motion.legs.length;i++){
  const l=motion.legs[i],b=l.bones,K=l.knee.getWorldPosition(new T.Vector3()),A=l.foot.localToWorld(l.motion.anklePoint(new T.Vector3())),H=l.hip.getWorldPosition(new T.Vector3());
  error(K.clone().sub(H).normalize(),dir(b.hip,b.knee));error(A.clone().sub(K).normalize(),dir(b.knee,b.ankle));
  maxBoneError=Math.max(maxBoneError,Math.abs(H.distanceTo(K)-l.upper),Math.abs(K.distanceTo(A)-l.lower));
  maxToe[i]=Math.max(maxToe[i],l.toeBend);
  if(l.toeBend===0)assert.deepEqual(l.foot.geometry.attributes.position.array,baseline[i].foot,'Unbent foot must restore the saved shape exactly');
  else{const inverse=l.motion.rear.clone().invert(),v=new T.Vector3(),rest=new T.Vector3(),positions=l.foot.geometry.attributes.position;for(let k=0;k<positions.count;k+=13){rest.fromArray(baseline[i].foot,k*3);v.fromBufferAttribute(positions,k);assert(Number.isFinite(v.x+v.y+v.z),'Foot vertices must remain finite');if(rest.z<.145)assert(v.applyMatrix4(inverse).distanceTo(rest)<1e-6,'Rear foot must move rigidly; bend belongs at the ball');}}

  assert.deepEqual(l.calf.geometry.attributes.position.array.slice(baseline[i].join),baseline[i].calf.slice(baseline[i].join),'Calf shaft must remain rigid');
 }
 for(const a of motion.arms){
  const b=a.bones,S=a.shoulder.getWorldPosition(new T.Vector3()),E=a.elbow.getWorldPosition(new T.Vector3()),actualUpper=E.clone().sub(S).normalize(),actualLower=DOWN.clone().applyQuaternion(a.elbow.getWorldQuaternion(new T.Quaternion())),sourceUpper=dir(b.shoulder,b.elbow).applyQuaternion(motion.armLean),sourceLower=dir(b.elbow,b.wrist).applyQuaternion(motion.armLean);
  const angle=v=>Math.atan2(v.z,-v.y),delta=(angle(actualUpper)-angle(actualLower))-(angle(sourceUpper)-angle(sourceLower));
  maxArmSagittalError=Math.max(maxArmSagittalError,Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta))));
  const ranges=swingRanges[motion.arms.indexOf(a)];ranges.source.push(angle(dir(b.shoulder,b.elbow)));ranges.actual.push(angle(actualUpper.clone().applyQuaternion(motion.armLean.clone().invert())));

  oldArmSpread+=Math.abs(sourceUpper.x);newArmSpread+=Math.abs(actualUpper.x);armSamples++;
  assert(Math.abs(actualUpper.x)<.216,'Upper arms must swing close to the sides');assert(Math.abs(actualLower.x)<.10,'Forearms must not flare outward');
  assert(Math.abs(E.distanceTo(S)-a.elbow.position.length())<1e-8,'Tucking must not change upper-arm length');
 }

 minLean=Math.min(minLean,motion.forwardLean);maxLean=Math.max(maxLean,motion.forwardLean);assert(new T.Vector3(0,1,0).applyQuaternion(motion.spine.quaternion).z>Math.sin(6*Math.PI/180),'Torso must lean forward through the cycle');
 assert(Math.abs((motion.rig.body.position.y-motion.restBody.y-motion.offset)-(((p[13].y+p[17].y)/2-motion.meanHip)*motion.heightScale))<1e-10,'Hip bounce must use this exact source frame');
}
maxToe.forEach(bend=>assert(bend>=25,'Each foot needs a visible toe push-off'));assert(minLean>6*Math.PI/180&&maxLean<10*Math.PI/180);
const swingAmplitudeRatios=swingRanges.map(r=>(Math.max(...r.actual)-Math.min(...r.actual))/(Math.max(...r.source)-Math.min(...r.source)));swingAmplitudeRatios.forEach(r=>assert(r>.84&&r<.86,'Arm swing should be 15% smaller'));
assert(maxArmSagittalError<1e-8,'Reduced swing must preserve elbow bending');assert(newArmSpread/oldArmSpread<.7,'Arm spread must be visibly reduced');
assert(maxDirectionError<1e-6,'Limbs must match the original source directions on both sides, without phase offsets');assert(maxBoneError<1e-6,'Measured avatar bones must retain their lengths');
motion.setFrame(0);const start=motion.legs.map(l=>l.foot.matrixWorld.clone());motion.setFrame(77);motion.legs.forEach((l,i)=>l.foot.matrixWorld.elements.forEach((v,j)=>assert(Math.abs(v-start[i].elements[j])<1e-8,'Loop must return to the same pose')));
const hands=motion.handLayer.hands;assert.notEqual(hands[0].hand.geometry,hands[1].hand.geometry,'Hands need independent poses for future held objects');
let maxFingerMove=0;
for(const h of hands){
 const p=h.hand.geometry.attributes.position.array,rest=h.rig.approvedPositions;
 for(const i of h.rig.protectedVertices)for(let d=0;d<3;d++)assert.equal(p[i*3+d],rest[i*3+d],'Palm and socket attachment must remain fixed');
 for(const ids of h.rig.fingerTipVertices){let distance=0;for(const i of ids){const delta=Math.hypot(p[i*3]-rest[i*3],p[i*3+1]-rest[i*3+1],p[i*3+2]-rest[i*3+2]);assert(Number.isFinite(delta));distance+=delta;maxFingerMove=Math.max(maxFingerMove,delta);}assert(distance/ids.length>.001,'Every finger should gently curl');}
 assert(maxFingerMove<.08,'Running hand should stay gently clenched');
}
const leftRun=hands[0].hand.geometry.attributes.position.array.slice();
motion.handLayer.setPose(1,HAND_REST);assert.deepEqual(hands[1].hand.geometry.attributes.position.array,hands[1].rig.approvedPositions,'Other poses can restore the exact approved hand');assert.deepEqual(hands[0].hand.geometry.attributes.position.array,leftRun,'One grip must not change the other hand');
motion.handLayer.setPose(1,{index:.8,middle:.8,ring:.8,little:.8,thumb:.5});const held=hands[1].hand.geometry.attributes.position.array.slice();motion.setFrame(22);motion.setFrame(44);assert.deepEqual(hands[1].hand.geometry.attributes.position.array,held,'Running must not overwrite an object grip');motion.handLayer.reset(1);
const result={sourceFrames:77,cycleSeconds:CYCLE,sampledPoses:154,maxLegDirectionError:maxDirectionError,maxElbowSagittalErrorRadians:maxArmSagittalError,swingAmplitudeRatios,runningHandPose:hands[1].rig.getPose(),maxFingerMoveMetersInHandSpace:maxFingerMove,independentGrips:true,meanArmSpreadRatio:newArmSpread/oldArmSpread,maxBoneError,maxToeBendDegrees:maxToe,forwardLeanDegrees:[minLean,maxLean].map(v=>v*180/Math.PI),heightScale:motion.heightScale,measuredBones:motion.legs.map(l=>({side:l.side,upper:l.upper,lower:l.lower})),mode:'Same source timing and leg poses, with forward torso lean and arms tucked closer to the sides with 15% less swing, keeping their rhythm. Relaxed running hand curl is independent of arm motion and future object grips. Ball-of-foot bend during push-off; original hip-bounce curve. In-place comparison before locomotion integration.'};
await writeFile('/tmp/motion-compare-metrics.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
