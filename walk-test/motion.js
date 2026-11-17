import * as T from 'three';
import {MatchedMotion} from '../references/avatar-walk/matched.js';
import {REST_POSE as HAND_REST} from '../hand-lab/src/hand-rig.js';
import {solveLeg} from '../movement/controller.js';

export const WALK=Object.freeze({cycle:1.1,stride:1,duty:.62,lift:.045,heel:16,armSwing:.18});
const UP=new T.Vector3(0,1,0),DOWN=new T.Vector3(0,-1,0),FORWARD=new T.Vector3(0,0,1),TAU=Math.PI*2,mod=x=>((x%1)+1)%1;
export function walkContactAt(frame){const p=mod(frame/77),phases=[p,mod(p+.5)];return phases[0]<WALK.duty&&(phases[1]>=WALK.duty||phases[0]<=phases[1])?0:1;}

// A distinct walk: long support, brief double support, low swing clearance,
// heel-to-ball roll, upright body and gentle opposing arms. No run channels.
export class WalkingMotion{
 constructor(){
  Object.assign(this,new MatchedMotion());
  for(const {object,position,quaternion} of this.restTransforms){object.position.copy(position);object.quaternion.copy(quaternion);}
  this.root.updateMatrixWorld(true);
  for(const l of this.legs){
   l.motion.setPose(0,0);l.home=l.foot.position.clone();l.probeHome=l.foot.localToWorld(new T.Vector3().fromBufferAttribute(l.foot.geometry.attributes.position,l.motion.probe));
  }
  const l=this.legs[0],length=l.upper+l.lower,reach=WALK.stride*WALK.duty/2;
  this.highHip=l.restAnkle.y+length-.006;this.lowHip=l.restAnkle.y+Math.sqrt((length-.006)**2-reach**2);
  this.armRest=this.arms.map(a=>({shoulder:a.shoulder.rotation.clone(),elbow:a.elbow.rotation.clone()}));
  for(const h of this.handLayer.hands)this.handLayer.setPose(h.side,{...HAND_REST,together:.35});
  this.setFrame(0);
 }
 setFrame(frame){
  const phase=mod(frame/77),beat=mod(phase*2),hipY=T.MathUtils.lerp(this.lowHip,this.highHip,Math.sin(Math.PI*beat)**2),r=this.rig;
  r.body.position.copy(this.restBody);r.body.position.x=-.012*Math.sin(TAU*phase);r.body.position.y=hipY-r.hipRight.position.y-this.root.position.y;r.body.quaternion.identity();
  this.spine.rotation.set(-T.MathUtils.degToRad(2),.018*Math.sin(TAU*phase),.008*Math.sin(TAU*phase));this.root.updateMatrixWorld(true);
  for(let j=0;j<2;j++){
   const l=this.legs[j],p=mod(phase+j*.5),planted=p<WALK.duty,t=T.MathUtils.clamp((p-WALK.duty)/(1-WALK.duty),0,1),reach=WALK.stride*WALK.duty/2;
   let z,height,heel,pitch;
   if(planted){z=reach-WALK.stride*p;height=0;heel=WALK.heel*T.MathUtils.smoothstep(p,.42,WALK.duty);pitch=-6*(1-T.MathUtils.smoothstep(p,0,.10));}
   else{
    const t2=t*t,t3=t2*t,tangent=-WALK.stride*(1-WALK.duty);
    z=(2*t3-3*t2+1)*(-reach)+(t3-2*t2+t)*tangent+(-2*t3+3*t2)*reach+(t3-t2)*tangent;
    height=WALK.lift*16*t2*(1-t)**2;heel=WALK.heel*(1-T.MathUtils.smoothstep(t,0,.30));pitch=-4*Math.sin(Math.PI*t);
   }
   l.toeBend=heel;l.motion.setPose(heel,0);l.foot.quaternion.setFromAxisAngle(new T.Vector3(1,0,0),T.MathUtils.degToRad(pitch));
   const geometry=l.foot.geometry.attributes.position,v=new T.Vector3();let low=Infinity;
   for(let i=0;i<geometry.count;i++){v.fromBufferAttribute(geometry,i).applyQuaternion(l.foot.quaternion);low=Math.min(low,v.y);}
   v.fromBufferAttribute(geometry,l.motion.probe);v.x*=l.side;v.applyQuaternion(l.foot.quaternion);
   l.foot.position.set(l.probeHome.x-v.x,height-low-this.root.position.y,l.probeHome.z+z-v.z);l.foot.updateWorldMatrix(true,false);
   l.hip.getWorldPosition(l.H);l.foot.localToWorld(l.motion.anklePoint(l.A));
   if(!planted){const dx=l.H.x-l.A.x,dz=l.H.z-l.A.z,max=l.upper+l.lower-.001,required=l.H.y-Math.sqrt(Math.max(.001,max*max-dx*dx-dz*dz)),lift=Math.max(0,required-l.A.y);l.foot.position.y+=lift;height+=lift;l.foot.updateWorldMatrix(true,false);l.foot.localToWorld(l.motion.anklePoint(l.A));}
   l.K.copy(solveLeg(l.H,l.A,l.upper,l.lower,FORWARD));
   l.hip.quaternion.setFromUnitVectors(DOWN,l.K.clone().sub(l.H).normalize());l.calf.quaternion.setFromUnitVectors(UP,l.K.clone().sub(l.A).normalize());
   l.calf.position.copy(l.K).addScaledVector(UP.clone().applyQuaternion(l.calf.quaternion),-.17).sub(this.root.position);this.root.updateMatrixWorld(true);l.socket.update(l.foot,l.motion.rear);
   l.walkPlanted=planted;l.walkPhase=p;l.walkLift=height;
  }
  const swing=WALK.armSwing*Math.cos(TAU*phase);
  this.arms.forEach((a,i)=>{a.shoulder.rotation.copy(this.armRest[i].shoulder);a.shoulder.rotation.x-=a.side*swing;a.elbow.rotation.copy(this.armRest[i].elbow);a.elbow.rotation.x-=.04+.025*(1+Math.cos(TAU*phase*a.side))*.5;});
  this.root.updateMatrixWorld(true);this.frame=frame;return this;
 }
}
