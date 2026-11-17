import * as T from 'three';
import source from './source-walk.js';
import {createAssembledAvatar} from '../../avatar-lab/src/avatar.js';
import {createFootMotion,createSocketMotion} from '../../movement/ankle.js';
import {solveLeg} from '../../movement/controller.js';

export const CYCLE=source.animation.frames/90;
const UP=new T.Vector3(0,1,0),DOWN=UP.clone().negate(),FORWARD=new T.Vector3(0,0,1);
const clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp,smooth=T.MathUtils.smoothstep;
const mod=(x,n)=>((x%n)+n)%n;
const SIDES={1:{hip:13,knee:14,ankle:15,shoulder:5,elbow:6,wrist:7},'-1':{hip:17,knee:18,ankle:19,shoulder:9,elbow:10,wrist:11}};

// Decode the original channel order and N64 rotation convention once.
export function sourcePose(frame,withMatrices=false){
 const {indices,values,frames}=source.animation;frame=mod(frame,frames);
 function sample(c,angle=false){const count=indices[c*2],base=indices[c*2+1],f=Math.floor(frame),t=frame-f,a=values[base+Math.min(f,count-1)],b=values[base+Math.min((f+1)%frames,count-1)];let d=b-a;if(angle){if(d>32767)d-=65536;if(d<-32768)d+=65536;}return a+d*t;}
 const matrices=[],points=[];
 for(let i=0;i<source.bones.length;i++){
  const bone=source.bones[i],p=bone.offset.slice();if(!i)for(let a=0;a<3;a++)p[a]+=sample(a);
  const [rx,ry,rz]=[0,1,2].map(a=>sample(3+i*3+a,true)*Math.PI*2/65536),sx=Math.sin(rx),cx=Math.cos(rx),sy=Math.sin(ry),cy=Math.cos(ry),sz=Math.sin(rz),cz=Math.cos(rz);
  const m=new T.Matrix4().set(cy*cz,sx*sy*cz-cx*sz,cx*sy*cz+sx*sz,p[0],cy*sz,sx*sy*sz+cx*cz,cx*sy*sz-sx*cz,p[1],-sy,sx*cy,cx*cy,p[2],0,0,0,1);
  if(bone.parent>=0)m.premultiply(matrices[bone.parent]);matrices.push(m);points.push(new T.Vector3().setFromMatrixPosition(m).multiplyScalar(source.scale));
 }
 return withMatrices?{points,matrices}:points;
}
function features(points,side){
 const b=SIDES[side],h=points[b.hip],k=points[b.knee],a=points[b.ankle],s=points[b.shoulder],e=points[b.elbow],w=points[b.wrist],upper=e.clone().sub(s).normalize();
 return {reach:a.z-h.z,knee:Math.PI-k.clone().sub(h).angleTo(k.clone().sub(a)),arm:Math.atan2(upper.z,-upper.y),elbow:Math.PI-s.clone().sub(e).angleTo(w.clone().sub(e))};
}
const sourceFrames=Array.from({length:77},(_,f)=>sourcePose(f));
const contact={};
for(const side of [-1,1]){let best=Infinity;for(let f=0;f<77;f++){const a=features(sourceFrames[f],side);if(a.reach>0&&a.knee<best){best=a.knee;contact[side]=f;}}}
const armMean={};for(const side of [-1,1])armMean[side]=sourceFrames.reduce((sum,p)=>sum+features(p,side).arm,0)/77;

// The source supplies phase, recovery shape and arm curves. Distances and
// support height come from this avatar's measured bones, without rescaling.
export class AvatarWalkPreview{
 constructor(){
  this.avatar=createAssembledAvatar();this.rig=this.avatar.rig;this.root=this.rig.root;this.root.updateMatrixWorld(true);
  const r=this.rig,spine=new T.Group();spine.name='retarget-upper-body';
  const children=r.torso.children.filter(c=>c!==r.hipLeft&&c!==r.hipRight);r.torso.add(spine);children.forEach(c=>spine.add(c));this.spine=spine;
  this.restHip=r.hipRight.getWorldPosition(new T.Vector3()).y;this.duty=.60;
  this.legs=this.avatar.lowerLegs.map(leg=>{
   const side=leg.side,hip=side===-1?r.hipLeft:r.hipRight,knee=side===-1?r.kneeLeft:r.kneeRight;
   const H=hip.getWorldPosition(new T.Vector3()),K=knee.getWorldPosition(new T.Vector3()),home=leg.foot.getWorldPosition(new T.Vector3());
   this.root.attach(leg.foot);this.root.attach(leg.calf);leg.mount.removeFromParent();
   const motion=createFootMotion(leg.foot,leg.calf),socket=createSocketMotion(leg.calf,leg.restCalfPosition);
   const A=leg.foot.localToWorld(motion.anklePoint(new T.Vector3())),upper=H.distanceTo(K),lower=K.distanceTo(A);
   const shoulder=side===-1?r.shoulderLeft:r.shoulderRight,elbow=side===-1?r.elbowLeft:r.elbowRight;
   const phaseOffset=side===1?0:.5;
   const at=p=>features(sourcePose(contact[side]+p*77),side),lift=at(this.duty),land=at(1);
   let foldMax=0;for(let i=0;i<=100;i++){const t=i/100,p=lerp(this.duty,1,t);foldMax=Math.max(foldMax,at(p).knee-lerp(lift.knee,land.knee,t));}
   return {...leg,hip,knee,motion,socket,home,upper,lower,ankleY:A.y,shoulder,elbow,shoulderRest:shoulder.rotation.clone(),elbowRest:elbow.rotation.clone(),phaseOffset,at,lift,land,foldMax,probeAnchor:null,plantId:null,H:new T.Vector3(),K:new T.Vector3(),A:new T.Vector3()};
  });
  const leg=this.legs[0],length=leg.upper+leg.lower;this.stride=length*1.05;this.reach=this.stride*this.duty/2;this.speed=this.stride/CYCLE;
  const effective=Math.sqrt(leg.upper**2+leg.lower**2+2*leg.upper*leg.lower*Math.cos(T.MathUtils.degToRad(8)));
  this.lowHip=leg.ankleY+Math.sqrt(effective**2-this.reach**2);this.highHip=leg.ankleY+effective;this.clearance=length*.16;
  this.metrics={maxPlantedSlide:0,maxPlantedVerticalError:0,maxIKError:0,maxReachExcess:0,minHip:Infinity,maxHip:-Infinity,minStanceKnee:Infinity,maxStanceKnee:0,maxSwingKnee:0};
  this.setTime(0);
 }
 setTime(time){
  const cycles=time/CYCLE,travel=cycles*this.stride,beat=mod(cycles*2,1),hipY=lerp(this.lowHip,this.highHip,Math.sin(Math.PI*beat)**2),r=this.rig;
  r.body.position.set(0,hipY-r.hipRight.position.y-this.root.position.y,travel);r.body.quaternion.identity();
  this.spine.rotation.set(.025,0,.012*Math.sin(cycles*Math.PI*2));
  this.root.updateMatrixWorld(true);
  for(const leg of this.legs){
   const phase=mod(cycles+leg.phaseOffset,1),plantId=Math.floor(cycles+leg.phaseOffset),planted=phase<this.duty,t=clamp((phase-this.duty)/(1-this.duty),0,1),f=leg.at(phase);
   const fold=planted?0:clamp((f.knee-lerp(leg.lift.knee,leg.land.knee,t))/leg.foldMax,0,1);
   const progress=clamp((f.reach-leg.lift.reach)/(leg.land.reach-leg.lift.reach),0,1);
   const z=planted?(plantId-leg.phaseOffset)*this.stride+this.reach:travel+lerp(-this.reach,this.reach,progress);
   const heel=planted?16*smooth(phase,this.duty-.14,this.duty):16*(1-smooth(t,0,.18)),ankle=-6*fold;
   leg.motion.setPose(heel,ankle);leg.foot.quaternion.identity();leg.foot.position.set(leg.home.x,0,z+leg.home.z).sub(this.root.position);leg.foot.position.y=this.clearance*fold-leg.motion.lowest-this.root.position.y;
   leg.foot.updateWorldMatrix(true,false);leg.foot.localToWorld(leg.motion.anklePoint(leg.A));leg.hip.getWorldPosition(leg.H);
   const distance=leg.H.distanceTo(leg.A);this.metrics.maxReachExcess=Math.max(this.metrics.maxReachExcess,distance-leg.upper-leg.lower);
   leg.K.copy(solveLeg(leg.H,leg.A,leg.upper,leg.lower,FORWARD));
   leg.hip.quaternion.setFromUnitVectors(DOWN,leg.K.clone().sub(leg.H).normalize());
   leg.calf.quaternion.setFromUnitVectors(UP,leg.K.clone().sub(leg.A).normalize());
   leg.calf.position.copy(leg.K).sub(new T.Vector3(0,.17,0).applyQuaternion(leg.calf.quaternion)).sub(this.root.position);
   leg.calf.updateWorldMatrix(true,false);leg.socket.update(leg.foot,leg.motion.rear);
   leg.shoulder.rotation.copy(leg.shoulderRest);leg.shoulder.rotation.x-=.85*(f.arm-armMean[leg.side]);
   leg.elbow.rotation.copy(leg.elbowRest);leg.elbow.rotation.x=-clamp(lerp(-leg.elbowRest.x,f.elbow,.65),.17,1.31);
   this.root.updateMatrixWorld(true);
   this.metrics.maxIKError=Math.max(this.metrics.maxIKError,leg.knee.getWorldPosition(new T.Vector3()).distanceTo(leg.K),Math.abs(leg.K.distanceTo(leg.A)-leg.lower));
   const knee=Math.PI-leg.H.clone().sub(leg.K).angleTo(leg.A.clone().sub(leg.K));
   if(planted){
    this.metrics.minStanceKnee=Math.min(this.metrics.minStanceKnee,knee);this.metrics.maxStanceKnee=Math.max(this.metrics.maxStanceKnee,knee);
    const probe=leg.foot.localToWorld(new T.Vector3().fromBufferAttribute(leg.foot.geometry.attributes.position,leg.motion.probe));
    if(leg.plantId!==plantId||!leg.probeAnchor)leg.probeAnchor=probe.clone();else this.metrics.maxPlantedSlide=Math.max(this.metrics.maxPlantedSlide,Math.hypot(probe.x-leg.probeAnchor.x,probe.z-leg.probeAnchor.z));
    this.metrics.maxPlantedVerticalError=Math.max(this.metrics.maxPlantedVerticalError,Math.abs(probe.y));
   }else{this.metrics.maxSwingKnee=Math.max(this.metrics.maxSwingKnee,knee);leg.probeAnchor=null;}
   Object.assign(leg,{phase,plantId,planted,fold,kneeAngle:knee});
  }
  this.metrics.minHip=Math.min(this.metrics.minHip,hipY);this.metrics.maxHip=Math.max(this.metrics.maxHip,hipY);this.time=time;this.travel=travel;return this;
 }
}
