import assert from 'node:assert/strict';
import * as T from 'three';
import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
await build({entryPoints:['references/avatar-walk/matched.js'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/matched-motion-test.mjs'});
const {MatchedMotion,CYCLE}=await import('/tmp/matched-motion-test.mjs'),motion=new MatchedMotion();
const UP=new T.Vector3(0,1,0),DOWN=UP.clone().negate();let maxDirectionError=0,maxBoneError=0;
const baseline=motion.legs.map(l=>({foot:l.motion.restPositions.slice(),calf:l.socket.restPositions.slice(),join:(l.calf.geometry.userData.cavityVertexCount+(l.calf.geometry.userData.lipRings-1)*l.calf.geometry.userData.segments)*3}));
const error=(a,b)=>{maxDirectionError=Math.max(maxDirectionError,a.distanceTo(b));};
for(let f=0;f<77;f+=.5){
 motion.setFrame(f);const p=motion.sourcePoints,dir=(a,b)=>p[b].clone().sub(p[a]).normalize();
 for(let i=0;i<motion.legs.length;i++){
  const l=motion.legs[i],b=l.bones,K=l.knee.getWorldPosition(new T.Vector3()),A=l.foot.localToWorld(l.motion.pivot.clone()),H=l.hip.getWorldPosition(new T.Vector3());
  error(K.clone().sub(H).normalize(),dir(b.hip,b.knee));error(A.clone().sub(K).normalize(),dir(b.knee,b.ankle));
  maxBoneError=Math.max(maxBoneError,Math.abs(H.distanceTo(K)-l.upper),Math.abs(K.distanceTo(A)-l.lower));
  assert.deepEqual(l.foot.geometry.attributes.position.array,baseline[i].foot,'Saved foot shape must remain exact');
  assert.deepEqual(l.calf.geometry.attributes.position.array.slice(baseline[i].join),baseline[i].calf.slice(baseline[i].join),'Calf shaft must remain rigid');
 }
 for(const a of motion.arms){const b=a.bones,S=a.shoulder.getWorldPosition(new T.Vector3()),E=a.elbow.getWorldPosition(new T.Vector3());error(E.sub(S).normalize(),dir(b.shoulder,b.elbow));error(DOWN.clone().applyQuaternion(a.elbow.getWorldQuaternion(new T.Quaternion())),dir(b.elbow,b.wrist));}
 assert(Math.abs((motion.rig.body.position.y-motion.restBody.y-motion.offset)-(((p[13].y+p[17].y)/2-motion.meanHip)*motion.heightScale))<1e-10,'Hip bounce must use this exact source frame');
}
assert(maxDirectionError<1e-6,'Limbs must match the original source directions on both sides, without phase offsets');assert(maxBoneError<1e-6,'Measured avatar bones must retain their lengths');
motion.setFrame(0);const start=motion.legs.map(l=>l.foot.matrixWorld.clone());motion.setFrame(77);motion.legs.forEach((l,i)=>l.foot.matrixWorld.elements.forEach((v,j)=>assert(Math.abs(v-start[i].elements[j])<1e-8,'Loop must return to the same pose')));
const result={sourceFrames:77,cycleSeconds:CYCLE,sampledPoses:154,maxDirectionError,maxBoneError,heightScale:motion.heightScale,measuredBones:motion.legs.map(l=>({side:l.side,upper:l.upper,lower:l.lower})),mode:'Same source frame for both sides and all limbs; original hip-bounce curve; comparison in place, without a locomotion or foot-lock solver.'};
await writeFile('/tmp/motion-compare-metrics.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
