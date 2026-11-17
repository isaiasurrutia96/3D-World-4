import * as T from 'three';
import {sourcePose,CYCLE} from './retarget.js';
import {createAssembledAvatar} from '../../avatar-lab/src/avatar.js';
import {createFootMotion,createSocketMotion} from '../../movement/ankle.js';
import {createRunningHandLayer} from './hand-layer.js';
export {CYCLE};
const UP=new T.Vector3(0,1,0),DOWN=new T.Vector3(0,-1,0);
export const BONES={1:{hip:13,knee:14,ankle:15,shoulder:5,elbow:6,wrist:7},'-1':{hip:17,knee:18,ankle:19,shoulder:9,elbow:10,wrist:11}};
const direction=(points,a,b)=>points[b].clone().sub(points[a]).normalize();
function tuckArm(v,side,upper){
 const sagittal=Math.hypot(v.y,v.z),outward=side*v.x/Math.max(sagittal,1e-8);
 const slope=upper?T.MathUtils.clamp(outward*.4,.14,.22):T.MathUtils.clamp(outward*.25,-.10,.08);
 return v.set(side*slope*sagittal,v.y,v.z).normalize();
}

// Pose-only retarget for a direct reference comparison: the SAME source frame
// drives every limb. No independent step planner, phase offsets, softened knee
// curves, or new hip-bob curve can change the movement being compared.
// Requested refinements: forward torso lean and articulated toe push-off.
export class MatchedMotion{
 constructor(){
  this.avatar=createAssembledAvatar();this.handLayer=createRunningHandLayer(this.avatar);this.rig=this.avatar.rig;this.root=this.rig.root;this.root.updateMatrixWorld(true);
  const r=this.rig;this.restBody=r.body.position.clone();this.spine=new T.Group();const children=r.torso.children.filter(c=>c!==r.hipLeft&&c!==r.hipRight);r.torso.add(this.spine);children.forEach(c=>this.spine.add(c));
  this.legs=this.avatar.lowerLegs.map(leg=>{
   const hip=leg.side<0?r.hipLeft:r.hipRight,knee=leg.side<0?r.kneeLeft:r.kneeRight,H=hip.getWorldPosition(new T.Vector3()),K=knee.getWorldPosition(new T.Vector3());
   this.root.attach(leg.foot);this.root.attach(leg.calf);leg.mount.removeFromParent();const motion=createFootMotion(leg.foot,leg.calf),A=leg.foot.localToWorld(motion.anklePoint(new T.Vector3()));
   return {...leg,hip,knee,motion,socket:createSocketMotion(leg.calf,leg.restCalfPosition),upper:H.distanceTo(K),lower:K.distanceTo(A),bones:BONES[leg.side],H:new T.Vector3(),K:new T.Vector3(),A:new T.Vector3()};
  });
  this.arms=[-1,1].map(side=>({side,bones:BONES[side],shoulder:side<0?r.shoulderLeft:r.shoulderRight,elbow:side<0?r.elbowLeft:r.elbowRight}));
  for(const arm of this.arms)arm.swingMean=Array.from({length:77},(_,f)=>{const d=direction(sourcePose(f),arm.bones.shoulder,arm.bones.elbow);return Math.atan2(d.z,-d.y);}).reduce((a,b)=>a+b)/77;
  const p=sourcePose(0),b=BONES[1];this.sourceLeg=p[b.hip].distanceTo(p[b.knee])+p[b.knee].distanceTo(p[b.ankle]);this.heightScale=(this.legs[0].upper+this.legs[0].lower)/this.sourceLeg;
  this.meanHip=Array.from({length:77},(_,f)=>{const p=sourcePose(f);return(p[13].y+p[17].y)/2;}).reduce((a,b)=>a+b)/77;
  this.sourceLeanMean=Array.from({length:77},(_,f)=>{const p=sourcePose(f),d=direction(p,1,2);return Math.atan2(d.z,d.y);}).reduce((a,b)=>a+b)/77;
  for(const leg of this.legs)leg.minSourceAnkleY=Math.min(...Array.from({length:77},(_,f)=>sourcePose(f)[leg.bones.ankle].y));
  this.offset=0;let low=Infinity;
  for(let f=0;f<77;f++){this.setFrame(f);for(const l of this.legs){const p=l.foot.geometry.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++)low=Math.min(low,l.foot.localToWorld(v.fromBufferAttribute(p,i)).y);}}
  this.offset=-low;this.setFrame(0);
 }
 setFrame(frame){
  const {points:p,matrices}=sourcePose(frame,true),r=this.rig;
  const sourceHip=(p[13].y+p[17].y)/2;
  r.body.position.copy(this.restBody);r.body.position.y+=(sourceHip-this.meanHip)*this.heightScale+this.offset;
  const sourceSpine=new T.Quaternion().setFromUnitVectors(UP,direction(p,1,2)),axis=direction(p,1,2),nativeLean=Math.atan2(axis.z,axis.y);
  this.forwardLean=T.MathUtils.degToRad(8)+.4*(nativeLean-this.sourceLeanMean);
  r.body.quaternion.identity();this.spine.quaternion.setFromUnitVectors(UP,new T.Vector3(axis.x,Math.cos(this.forwardLean),Math.sin(this.forwardLean)).normalize());
  this.armLean=this.spine.quaternion.clone().multiply(sourceSpine.invert());this.root.updateMatrixWorld(true);
  for(const leg of this.legs){
   const b=leg.bones,upper=direction(p,b.hip,b.knee),lower=direction(p,b.knee,b.ankle);
   leg.hip.getWorldPosition(leg.H);leg.K.copy(leg.H).addScaledVector(upper,leg.upper);leg.A.copy(leg.K).addScaledVector(lower,leg.lower);
   leg.hip.quaternion.setFromUnitVectors(DOWN,upper);leg.calf.quaternion.setFromUnitVectors(UP,lower.clone().negate());
   leg.calf.position.copy(leg.K).sub(new T.Vector3(0,.17,0).applyQuaternion(leg.calf.quaternion)).sub(this.root.position);
   // Native shoe +X is toe-forward; use its side-view pitch on the saved foot.
   const forward=new T.Vector3(1,0,0).transformDirection(matrices[b.ankle]);
   const pitch=-Math.atan2(forward.y,forward.z),degrees=T.MathUtils.radToDeg(pitch),height=p[b.ankle].y-leg.minSourceAnkleY;
   // Roll through the ball while the low foot points down, then release the
   // toes as it lifts. Keep the rear foot's original pitch and ankle contact.
   const gate=T.MathUtils.smoothstep(degrees,8,22)*(1-T.MathUtils.smoothstep(degrees,58,84))*(1-T.MathUtils.smoothstep(height,this.sourceLeg*.12,this.sourceLeg*.28));
   leg.toeBend=Math.round(T.MathUtils.clamp(degrees,0,30)*gate*4)/4;
   leg.motion.setPose(leg.toeBend,0);leg.foot.quaternion.setFromAxisAngle(new T.Vector3(1,0,0),pitch-T.MathUtils.degToRad(leg.toeBend));
   leg.foot.position.copy(leg.A).sub(leg.motion.anklePoint(new T.Vector3()).multiply(new T.Vector3(leg.side,1,1)).applyQuaternion(leg.foot.quaternion)).sub(this.root.position);
   leg.calf.updateWorldMatrix(true,false);leg.foot.updateWorldMatrix(true,false);leg.socket.update(leg.foot,leg.motion.rear);
  }
  for(const arm of this.arms){
   const b=arm.bones,parent=arm.shoulder.parent.getWorldQuaternion(new T.Quaternion()),nativeUpper=direction(p,b.shoulder,b.elbow),reduction=(Math.atan2(nativeUpper.z,-nativeUpper.y)-arm.swingMean)*.15,axis=new T.Vector3(1,0,0);
   const upper=tuckArm(nativeUpper.applyQuaternion(this.armLean).applyAxisAngle(axis,reduction),arm.side,true),lower=tuckArm(direction(p,b.elbow,b.wrist).applyQuaternion(this.armLean).applyAxisAngle(axis,reduction),arm.side,false);
   arm.shoulder.quaternion.copy(parent.invert()).multiply(new T.Quaternion().setFromUnitVectors(DOWN,upper));arm.shoulder.updateWorldMatrix(true,false);
   arm.elbow.quaternion.copy(arm.shoulder.getWorldQuaternion(new T.Quaternion()).invert()).multiply(new T.Quaternion().setFromUnitVectors(DOWN,lower));
  }
  this.root.updateMatrixWorld(true);this.frame=frame;this.sourcePoints=p;return this;
 }
}
