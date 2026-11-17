import assert from 'node:assert/strict';
import * as T from 'three';
import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
await build({entryPoints:['references/avatar-walk/matched.js'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/matched-motion-test.mjs'});
const {MatchedMotion,CYCLE}=await import('/tmp/matched-motion-test.mjs'),motion=new MatchedMotion();
const UP=new T.Vector3(0,1,0),DOWN=UP.clone().negate();let maxDirectionError=0,maxBoneError=0,maxArmSagittalError=0,oldArmSpread=0,newArmSpread=0,armSamples=0;const maxToe=[0,0];let minLean=Infinity,maxLean=-Infinity;
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
  for(const [actual,source] of [[actualUpper,sourceUpper],[actualLower,sourceLower]])maxArmSagittalError=Math.max(maxArmSagittalError,Math.abs(Math.atan2(Math.sin(Math.atan2(actual.z,-actual.y)-Math.atan2(source.z,-source.y)),Math.cos(Math.atan2(actual.z,-actual.y)-Math.atan2(source.z,-source.y)))));
  oldArmSpread+=Math.abs(sourceUpper.x);newArmSpread+=Math.abs(actualUpper.x);armSamples++;
  assert(Math.abs(actualUpper.x)<.216,'Upper arms must swing close to the sides');assert(Math.abs(actualLower.x)<.10,'Forearms must not flare outward');
  assert(Math.abs(E.distanceTo(S)-a.elbow.position.length())<1e-8,'Tucking must not change upper-arm length');
 }

 minLean=Math.min(minLean,motion.forwardLean);maxLean=Math.max(maxLean,motion.forwardLean);assert(new T.Vector3(0,1,0).applyQuaternion(motion.spine.quaternion).z>Math.sin(6*Math.PI/180),'Torso must lean forward through the cycle');
 assert(Math.abs((motion.rig.body.position.y-motion.restBody.y-motion.offset)-(((p[13].y+p[17].y)/2-motion.meanHip)*motion.heightScale))<1e-10,'Hip bounce must use this exact source frame');
}
maxToe.forEach(bend=>assert(bend>=25,'Each foot needs a visible toe push-off'));assert(minLean>6*Math.PI/180&&maxLean<10*Math.PI/180);
assert(maxArmSagittalError<1e-8,'Tucking must preserve forward/back swing timing and angles');assert(newArmSpread/oldArmSpread<.7,'Arm spread must be visibly reduced');
assert(maxDirectionError<1e-6,'Limbs must match the original source directions on both sides, without phase offsets');assert(maxBoneError<1e-6,'Measured avatar bones must retain their lengths');
motion.setFrame(0);const start=motion.legs.map(l=>l.foot.matrixWorld.clone());motion.setFrame(77);motion.legs.forEach((l,i)=>l.foot.matrixWorld.elements.forEach((v,j)=>assert(Math.abs(v-start[i].elements[j])<1e-8,'Loop must return to the same pose')));
const result={sourceFrames:77,cycleSeconds:CYCLE,sampledPoses:154,maxLegDirectionError:maxDirectionError,maxArmSagittalErrorRadians:maxArmSagittalError,meanArmSpreadRatio:newArmSpread/oldArmSpread,maxBoneError,maxToeBendDegrees:maxToe,forwardLeanDegrees:[minLean,maxLean].map(v=>v*180/Math.PI),heightScale:motion.heightScale,measuredBones:motion.legs.map(l=>({side:l.side,upper:l.upper,lower:l.lower})),mode:'Same source timing and leg poses, with forward torso lean and arms tucked closer to the sides while keeping their forward/back rhythm. Ball-of-foot bend during push-off; original hip-bounce curve. In-place comparison before locomotion integration.'};
await writeFile('/tmp/motion-compare-metrics.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
