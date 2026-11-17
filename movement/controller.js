import * as T from 'three';
import {createAssembledAvatar} from '../avatar-lab/src/avatar.js';
import {createFootMotion,createSocketMotion} from './ankle.js';

export const TUNING=Object.freeze({walkSpeed:2.1,runSpeed:5.2,acceleration:19,braking:27,turnRate:11,slabSize:60});
const UP=new T.Vector3(0,1,0),DOWN=new T.Vector3(0,-1,0),TAU=Math.PI*2;
const damp=(a,b,k,dt)=>T.MathUtils.lerp(a,b,1-Math.exp(-k*dt));
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const smooth=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
export function analogSpeed(strength){return strength<=.55?TUNING.walkSpeed*strength/.55:T.MathUtils.lerp(TUNING.walkSpeed,TUNING.runSpeed,smooth((strength-.55)/.45));}
export function solveLeg(hip,ankle,upper,lower,forward){
 const axis=ankle.clone().sub(hip),distance=axis.length();axis.normalize();
 const d=T.MathUtils.clamp(distance,.02,upper+lower-1e-8),along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const bend=forward.clone().addScaledVector(axis,-forward.dot(axis));if(bend.lengthSq()<1e-8)bend.set(0,0,1);bend.normalize();
 return hip.clone().addScaledVector(axis,along).addScaledVector(bend,height);
}

export class GroundedMovement{
 constructor(){
  this.avatar=createAssembledAvatar();this.rig=this.avatar.rig;this.root=this.rig.root;this.position=new T.Vector3();this.velocity=new T.Vector3();this.intent=new T.Vector3();this.acceleration=new T.Vector3();this.facing=0;this.runBlend=0;this.activity=0;this.phase=0;this.distance=0;this.untilNext=.28;this.nextLeg=1;this.active=false;this.time=0;this.spring=0;this.springVelocity=0;this.bodyHeight=this.avatar.bodyRest.y+this.root.position.y;this.restBodyHeight=this.bodyHeight;this.steps=0;
  const spine=new T.Group();spine.name='upper-body-balance';const children=this.rig.torso.children.filter(o=>o!==this.rig.hipLeft&&o!==this.rig.hipRight);this.rig.torso.add(spine);for(const child of children)spine.add(child);this.spine=spine;
  this.armRest=[this.rig.shoulderLeft,this.rig.shoulderRight,this.rig.elbowLeft,this.rig.elbowRight].map(o=>o.rotation.clone());
  this.root.updateMatrixWorld(true);
  this.legs=this.avatar.lowerLegs.map((leg,i)=>{
   const footHome=leg.foot.getWorldPosition(new T.Vector3());this.root.attach(leg.foot);this.root.attach(leg.calf);leg.mount.removeFromParent();
   const motion=createFootMotion(leg.foot,leg.calf),socket=createSocketMotion(leg.calf,leg.restCalfPosition),hip=i===0?this.rig.hipLeft:this.rig.hipRight,knee=i===0?this.rig.kneeLeft:this.rig.kneeRight;
   return {...leg,motion,socket,hip,knee,home:footHome.clone(),flat:footHome.clone(),origin:footHome.clone(),yaw:0,planted:true,swing:null,stanceElapsed:0,stanceDuration:.3,heel:0,height:0,ankle:0,upper:.42,lower:.386,plantId:0,probeAnchor:null,hipWorld:new T.Vector3(),ankleWorld:new T.Vector3(),kneeWorld:new T.Vector3()};
  });
  this.metrics={maxPlantedSlide:0,maxPlantedVerticalError:0,maxIKError:0,maxReachExcess:0,maxBodyDrop:0,flightFrames:0,plants:0,plantSamples:0};
  this.pose(1/60);
 }
 get speed(){return this.velocity.length();}
 stepLength(speed){return .23+.24*T.MathUtils.clamp(speed/TUNING.walkSpeed,0,1)+.68*T.MathUtils.smoothstep(speed,2.0,5.2);}
 homeAt(leg,position=this.position,yaw=this.facing){return leg.home.clone().applyAxisAngle(UP,yaw).add(position);}
 predict(seconds){
  const p=this.position.clone(),v=this.velocity.clone(),dt=seconds/8;
  for(let i=0;i<8;i++){const d=this.intent.clone().sub(v),limit=TUNING.acceleration*dt;if(d.length()>limit)d.setLength(limit);v.add(d);p.addScaledVector(v,dt);}
  return {position:p,velocity:v};
 }
 targetFor(leg,remaining,stanceDuration,settling=false){
  if(settling)return this.homeAt(leg);
  const future=this.predict(remaining),lead=future.velocity.clone().multiplyScalar(stanceDuration*.5),maxLead=.26+.16*T.MathUtils.smoothstep(future.velocity.length(),2.0,5.2);
  if(lead.length()>maxLead)lead.setLength(maxLead);
  const target=this.homeAt(leg,future.position).add(lead),bound=TUNING.slabSize/2-.75;
  target.x=T.MathUtils.clamp(target.x,-bound,bound);target.z=T.MathUtils.clamp(target.z,-bound,bound);target.y=0;return target;
 }
 startStep(leg,settling=false){
  const planningSpeed=Math.max(.6,this.speed,this.intent.length()*.40),length=this.stepLength(planningSpeed),period=length/planningSpeed,duty=T.MathUtils.lerp(.64,.42,T.MathUtils.smoothstep(planningSpeed,2.0,5.2));
  const duration=settling?.22:T.MathUtils.clamp(2*period*(1-duty),.14,.40),stanceDuration=2*period*duty;
  leg.swing={elapsed:0,duration,from:leg.flat.clone(),to:this.targetFor(leg,duration,stanceDuration,settling),fromYaw:leg.yaw,toYaw:this.facing,fromHeel:leg.heel,clearance:settling?.055:T.MathUtils.lerp(.065,.20,this.runBlend),stanceDuration,settling};
  leg.planted=false;leg.probeAnchor=null;this.nextLeg=1-this.legs.indexOf(leg);this.distance=0;this.untilNext=this.stepLength(Math.max(.3,this.speed));this.steps++;
 }
 step(dt,wishX,wishZ){
  this.time+=dt;const amount=Math.min(1,Math.hypot(wishX,wishZ)),targetSpeed=analogSpeed(amount);this.intent.set(wishX,0,wishZ);if(amount)this.intent.setLength(targetSpeed);
  const oldVelocity=this.velocity.clone(),delta=this.intent.clone().sub(this.velocity),reverse=this.velocity.dot(this.intent)<0,rate=!amount||reverse?TUNING.braking:TUNING.acceleration;
  if(delta.length()>rate*dt)delta.setLength(rate*dt);this.velocity.add(delta);if(!amount&&this.speed<.005)this.velocity.set(0,0,0);this.acceleration.copy(this.velocity).sub(oldVelocity).multiplyScalar(1/Math.max(dt,1e-5));
  const before=this.position.clone();this.position.addScaledVector(this.velocity,dt);const bound=TUNING.slabSize/2-.8;
  for(const axis of ['x','z'])if(Math.abs(this.position[axis])>bound){this.position[axis]=Math.sign(this.position[axis])*bound;this.velocity[axis]=0;}
  const travel=this.position.distanceTo(before),speed=this.speed;
  if(speed>.04){const want=Math.atan2(this.velocity.x,this.velocity.z),limit=TUNING.turnRate*dt;this.facing+=T.MathUtils.clamp(angleDelta(this.facing,want),-limit,limit);}
  this.runBlend=damp(this.runBlend,T.MathUtils.smoothstep(speed,2.0,4.8),12,dt);this.phase+=travel/Math.max(.4,2*this.stepLength(speed))*TAU;this.distance+=travel;
  if(!this.active&&speed>.08){this.active=true;this.startStep(this.legs[1]);this.untilNext=.28;}
  const mayLift=leg=>!leg.swing&&(this.runBlend>.25||!this.legs.some(other=>other.swing));
  if(speed>.06&&this.distance>=this.untilNext&&mayLift(this.legs[this.nextLeg]))this.startStep(this.legs[this.nextLeg]);
  for(const leg of this.legs){
   if(leg.swing){
    const s=leg.swing;s.elapsed+=dt;const t=Math.min(1,s.elapsed/s.duration);
    const redirect=this.intent.length()<.1||this.acceleration.dot(this.velocity)<-1||Math.abs(angleDelta(s.toYaw,this.facing))>.5;
    if(t<.60||redirect){s.to.lerp(this.targetFor(leg,s.duration-s.elapsed,s.stanceDuration,s.settling),1-Math.exp(-16*dt));s.toYaw+=angleDelta(s.toYaw,this.facing)*(1-Math.exp(-16*dt));}
    leg.origin.copy(s.from).lerp(s.to,smooth(t));leg.height=s.clearance*Math.sin(Math.PI*t)**.85;leg.yaw=s.fromYaw+angleDelta(s.fromYaw,s.toYaw)*smooth(t);leg.heel=s.fromHeel*(1-smooth(t/.30));leg.ankle=-9*Math.sin(Math.PI*t);
    // Re-aim only the airborne foot during a hard turn. A planted foot is
    // never translated to compensate for a target outside the leg's reach.
    const home=this.homeAt(leg),reach=leg.origin.clone().sub(home),maxReach=.45+.02*this.runBlend;
    if(reach.length()>maxReach)leg.origin.copy(home).add(reach.setLength(maxReach));
    if(t>=1){leg.flat.copy(leg.origin);leg.yaw=s.toYaw;leg.height=leg.heel=leg.ankle=0;leg.swing=null;leg.planted=true;leg.stanceElapsed=0;leg.stanceDuration=s.stanceDuration;leg.plantId++;this.metrics.plants++;this.springVelocity-=.08+.09*this.runBlend;}
   }else{
    leg.stanceElapsed+=dt;leg.origin.copy(leg.flat);leg.height=leg.ankle=0;
    leg.heel=(22+8*this.runBlend)*smooth((leg.stanceElapsed/Math.max(.15,leg.stanceDuration)-.58)/.42);
   }
  }
  if(speed>.1){
   const stretched=this.legs.filter(l=>l.planted).sort((a,b)=>b.flat.distanceTo(this.position)-a.flat.distanceTo(this.position))[0];
   const releaseDistance=stretched&&Math.abs(angleDelta(stretched.yaw,this.facing))>.6?.38:.59;
   if(stretched&&stretched.flat.distanceTo(this.position)>releaseDistance&&mayLift(stretched))this.startStep(stretched);
  }
  if(speed<.025&&!amount&&!this.legs.some(l=>l.swing)){
   const unsettled=this.legs.map(l=>({leg:l,error:l.flat.distanceTo(this.homeAt(l))+Math.abs(angleDelta(l.yaw,this.facing))*.15})).sort((a,b)=>b.error-a.error)[0];
   if(unsettled.error>.035)this.startStep(unsettled.leg,true);
   else{this.active=false;for(const leg of this.legs)leg.heel=0;}
  }
  const moving=Math.max(Math.min(1,speed/.7),this.legs.some(l=>l.swing)?.25:0);this.activity=damp(this.activity,moving,10,dt);
  this.springVelocity+=(-155*this.spring-22*this.springVelocity)*dt;this.spring=T.MathUtils.clamp(this.spring+this.springVelocity*dt,-.035,.025);
  if(this.legs.every(l=>!l.planted))this.metrics.flightFrames++;
 }
 pose(dt){
  const rig=this.rig,forward=new T.Vector3(Math.sin(this.facing),0,Math.cos(this.facing)),bodyYaw=new T.Quaternion().setFromAxisAngle(UP,this.facing),rootOffset=this.root.position;
  // Place independent feet in world space before solving either leg.
  for(const leg of this.legs){
   leg.motion.setPose(leg.heel,leg.ankle);leg.foot.position.copy(leg.origin).sub(rootOffset);leg.foot.position.y=leg.height-leg.motion.lowest-rootOffset.y;leg.foot.quaternion.setFromAxisAngle(UP,leg.yaw);leg.foot.updateWorldMatrix(true,false);
   leg.ankleWorld.copy(leg.motion.anklePoint(new T.Vector3()));leg.foot.localToWorld(leg.ankleWorld);
  }
  let desiredHeight=this.restBodyHeight-this.activity*(.075+.11*this.runBlend)+this.activity*(.012+.023*this.runBlend)*Math.cos(this.phase*2)+this.spring;
  let ceiling=Infinity;
  for(const leg of this.legs){
   const horizontal=leg.hip.position.clone().applyQuaternion(bodyYaw).add(this.position),dx=horizontal.x-leg.ankleWorld.x,dz=horizontal.z-leg.ankleWorld.z,max=leg.upper+leg.lower-.001;
   const reach=Math.hypot(dx,dz);this.metrics.maxReachExcess=Math.max(this.metrics.maxReachExcess,reach-max);
   ceiling=Math.min(ceiling,leg.ankleWorld.y+Math.sqrt(Math.max(.0001,max*max-dx*dx-dz*dz))-leg.hip.position.y);
  }
  this.bodyHeight=Math.min(damp(this.bodyHeight,desiredHeight,14,dt),ceiling);
  this.metrics.maxBodyDrop=Math.max(this.metrics.maxBodyDrop,this.restBodyHeight-this.bodyHeight);
  rig.body.position.set(this.position.x,this.bodyHeight-rootOffset.y,this.position.z);rig.body.quaternion.copy(bodyYaw);rig.root.updateMatrixWorld(true);
  for(const leg of this.legs){
   leg.hip.getWorldPosition(leg.hipWorld);leg.kneeWorld.copy(solveLeg(leg.hipWorld,leg.ankleWorld,leg.upper,leg.lower,forward));
   const upper=leg.kneeWorld.clone().sub(leg.hipWorld).normalize().applyQuaternion(bodyYaw.clone().invert());leg.hip.quaternion.setFromUnitVectors(DOWN,upper);
   const direction=leg.kneeWorld.clone().sub(leg.ankleWorld).normalize(),footYaw=new T.Quaternion().setFromAxisAngle(UP,leg.yaw),localDirection=direction.clone().applyQuaternion(footYaw.clone().invert());
   leg.calf.quaternion.copy(footYaw).multiply(new T.Quaternion().setFromUnitVectors(UP,localDirection));
   leg.calf.position.copy(leg.kneeWorld).sub(new T.Vector3(0,.17,0).applyQuaternion(leg.calf.quaternion)).sub(rootOffset);leg.calf.updateWorldMatrix(true,false);leg.socket.update(leg.foot,leg.motion.rear);
   rig.root.updateMatrixWorld(true);
   const actualKnee=leg.knee.getWorldPosition(new T.Vector3()),boneError=Math.max(actualKnee.distanceTo(leg.kneeWorld),Math.abs(leg.kneeWorld.distanceTo(leg.ankleWorld)-leg.lower));this.metrics.maxIKError=Math.max(this.metrics.maxIKError,boneError);
   if(leg.planted){
    const probe=new T.Vector3().fromBufferAttribute(leg.foot.geometry.attributes.position,leg.motion.probe);leg.foot.localToWorld(probe);
    if(!leg.probeAnchor)leg.probeAnchor=probe.clone();else this.metrics.maxPlantedSlide=Math.max(this.metrics.maxPlantedSlide,Math.hypot(probe.x-leg.probeAnchor.x,probe.z-leg.probeAnchor.z));
    this.metrics.maxPlantedVerticalError=Math.max(this.metrics.maxPlantedVerticalError,Math.abs(probe.y));this.metrics.plantSamples++;
   }
  }
  const stride=this.legs[1].origin.clone().sub(this.legs[0].origin).dot(forward),arm=T.MathUtils.clamp(stride/(.55+.55*this.runBlend),-1,1)*(.35+.45*this.runBlend)*this.activity;
  const shoulders=[rig.shoulderLeft,rig.shoulderRight];for(let i=0;i<2;i++)shoulders[i].rotation.set(this.armRest[i].x+(i===0?-arm:arm),this.armRest[i].y,this.armRest[i].z);
  rig.elbowLeft.rotation.x=this.armRest[2].x-.55*this.runBlend*this.activity;rig.elbowRight.rotation.x=this.armRest[3].x-.55*this.runBlend*this.activity;
  const acceleration=this.acceleration.dot(forward),lean=T.MathUtils.clamp(.04*this.activity+.15*this.runBlend+.004*acceleration,-.06,.24)*this.activity;
  this.spine.rotation.x=damp(this.spine.rotation.x,lean,12,dt);this.spine.rotation.z=.018*Math.sin(this.phase)*this.activity;
  rig.root.updateMatrixWorld(true);
 }
 update(dt,x,z){this.step(dt,x,z);this.pose(dt);}
 getState(){return {position:this.position.toArray(),velocity:this.velocity.toArray(),speed:this.speed,facing:this.facing,runBlend:this.runBlend,steps:this.steps,feet:this.legs.map(l=>({side:l.side,planted:l.planted,origin:l.origin.toArray(),yaw:l.yaw,height:l.height,heel:l.heel,plantId:l.plantId})),metrics:{...this.metrics}};}
}
