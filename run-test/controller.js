import * as T from 'three';
import {MatchedMotion,CYCLE} from '../references/avatar-walk/matched.js';
import {solveLeg} from '../movement/controller.js';
import {createPoseCache} from './pose-cache.js';
export const TUNING={slabSize:60};
const UP=new T.Vector3(0,1,0),DOWN=new T.Vector3(0,-1,0),mod=(x,n)=>((x%n)+n)%n;
function footInfo(leg){
 const p=leg.foot.geometry.attributes.position,m=leg.foot.matrixWorld.elements;let low=Infinity;
 for(let i=0;i<p.count;i++)low=Math.min(low,m[1]*p.getX(i)+m[5]*p.getY(i)+m[9]*p.getZ(i)+m[13]);
 return {low,probe:leg.foot.localToWorld(new T.Vector3().fromBufferAttribute(p,leg.motion.probe)),pitch:leg.foot.rotation.x+T.MathUtils.degToRad(leg.toeBend)};
}
export class PlayableRun{
 constructor(){
  this.motion=new MatchedMotion({thighSwingGain:.94});this.legs=this.motion.legs;this.rig=this.motion.rig;this.handLayer=this.motion.handLayer;this.cache=createPoseCache(this.motion);
  this.samples=Array.from({length:77},(_,f)=>{this.motion.setFrame(f);this.cache.capture(f);return this.legs.map(footInfo);});
  const minima=this.legs.map((_,i)=>Math.min(...this.samples.map(s=>s[i].low)));
  this.contacts=this.samples.map((s,f)=>{
   const candidates=[0,1].filter(i=>this.samples[mod(f-1,77)][i].probe.z-this.samples[(f+1)%77][i].probe.z>.012&&s[i].low<minima[i]+.13&&s[i].low<=s[1-i].low+.004&&s[i].pitch>-.3&&s[i].pitch<1.4);
   return candidates.length?candidates[0]:-1;
  });
  const steps=this.samples.map((s,f)=>{const i=this.contacts[f];return i>=0&&this.contacts[(f+1)%77]===i?Math.max(.001,s[i].probe.z-this.samples[(f+1)%77][i].probe.z):null;});
  const valid=steps.filter(v=>v!==null),average=valid.reduce((a,b)=>a+b,0)/valid.length;
  if(!Number.isFinite(average))throw Error('No source foot contacts found');
  this.track=[0];steps.forEach(v=>this.track.push(this.track.at(-1)+(v??average)));this.stride=this.track[77];this.maxSpeed=this.stride/CYCLE;
  this.heights=this.samples.map((s,f)=>this.contacts[f]<0?null:-s[this.contacts[f]].low);
  for(let f=0;f<77;f++)if(this.heights[f]===null){let a=1,b=1;while(this.contacts[mod(f-a,77)]<0)a++;while(this.contacts[(f+b)%77]<0)b++;const t=a/(a+b);this.heights[f]=T.MathUtils.lerp(-this.samples[mod(f-a,77)][this.contacts[mod(f-a,77)]].low,-this.samples[(f+b)%77][this.contacts[(f+b)%77]].low,t)+.02*Math.sin(Math.PI*t);}
  this.root=new T.Group();this.root.add(this.motion.root);this.position=new T.Vector3();this.velocity=new T.Vector3();this.speed=0;this.facing=0;this.phase=0;this.activity=0;this.runBlend=0;this.pendingTravel=0;this.intentAmount=0;this.anchor=null;this.plantKey=null;this.steps=0;
  this.metrics={maxPlantedSlide:0,minSoleHeight:Infinity,minHip:Infinity,maxHip:-Infinity,maxBoneError:0};this.pose(1/60);
 }
 progress(phase){const f=mod(phase,1)*77,i=Math.floor(f);return Math.floor(phase)*this.stride+T.MathUtils.lerp(this.track[i],this.track[i+1],f-i);}
 step(dt,x,z){
  const amount=Math.min(1,Math.hypot(x,z)),target=this.maxSpeed*amount;this.intentAmount=amount;this.speed+=T.MathUtils.clamp(target-this.speed,-18*dt,14*dt);if(this.speed<.005&&!amount)this.speed=0;
  if(amount>.01){const yaw=Math.atan2(x,z),delta=Math.atan2(Math.sin(yaw-this.facing),Math.cos(yaw-this.facing));this.facing+=T.MathUtils.clamp(delta,-6*dt,6*dt);}
  const before=this.progress(this.phase);this.phase+=this.speed*dt/this.stride;this.pendingTravel+=this.progress(this.phase)-before;this.velocity.set(Math.sin(this.facing)*this.speed,0,Math.cos(this.facing)*this.speed);this.runBlend=this.speed/this.maxSpeed;
 }
 blendStanding(){
  const weight=1-this.activity,m=this.motion;if(weight<=0)return;
  const ankles=this.legs.map(l=>l.A.clone());
  for(const {object,position,quaternion} of m.restTransforms){object.position.lerp(position,weight);object.quaternion.slerp(quaternion,weight);}
  m.root.updateMatrixWorld(true);
  for(let i=0;i<this.legs.length;i++){
   const l=this.legs[i],A=ankles[i].lerp(l.restAnkle,weight),H=l.hip.getWorldPosition(new T.Vector3()),pole=l.knee.getWorldPosition(new T.Vector3()).sub(H).normalize();
   const geometry=l.foot.geometry,positions=geometry.attributes.position.array,normals=geometry.attributes.normal.array,rest=l.motion.restPositions;
   for(let j=0;j<positions.length;j++)positions[j]=T.MathUtils.lerp(positions[j],rest[j],weight);
   for(let j=0;j<normals.length;j++)normals[j]=T.MathUtils.lerp(normals[j],l.motion.restNormals[j],weight);
   for(let j=0;j<16;j++)l.motion.rear.elements[j]=T.MathUtils.lerp(l.motion.rear.elements[j],j%5===0?1:0,weight);
   geometry.attributes.position.needsUpdate=geometry.attributes.normal.needsUpdate=true;l.foot.position.copy(A).sub(l.motion.anklePoint(new T.Vector3()).multiply(new T.Vector3(l.side,1,1)).applyQuaternion(l.foot.quaternion)).sub(m.root.position);
   const K=solveLeg(H,A,l.upper,l.lower,pole),parent=l.hip.parent.getWorldQuaternion(new T.Quaternion());l.hip.quaternion.copy(parent.invert()).multiply(new T.Quaternion().setFromUnitVectors(DOWN,K.clone().sub(H).normalize()));
   l.calf.quaternion.setFromUnitVectors(UP,K.clone().sub(A).normalize());l.calf.position.copy(K).sub(new T.Vector3(0,.17,0).applyQuaternion(l.calf.quaternion)).sub(m.root.position);
   m.root.updateMatrixWorld(true);l.socket.update(l.foot,l.motion.rear,weight);this.metrics.maxBoneError=Math.max(this.metrics.maxBoneError,Math.abs(K.distanceTo(A)-l.lower));
  }
 }
 pose(dt){
  if(this.idlePose&&this.activity===0&&this.speed===0&&this.intentAmount===0){this.pendingTravel=0;return;}
  this.activity=T.MathUtils.damp(this.activity,this.speed>.02||this.intentAmount>.01?1:0,11,dt);if(this.activity>.999)this.activity=1;if(this.activity<.001){this.activity=0;if(!this.speed)this.phase=0;}
  // Source poses are evaluated at the origin before applying world movement.
  this.root.position.set(0,0,0);this.root.quaternion.identity();this.root.updateMatrixWorld(true);this.cache.sample(mod(this.phase,1)*77);this.blendStanding();this.root.updateMatrixWorld(true);
  const info=this.legs.map(footInfo),frame=mod(this.phase,1)*77,index=Math.floor(frame),support=this.activity>.05?this.contacts[index]:-1,q=new T.Quaternion().setFromAxisAngle(UP,this.facing),forward=new T.Vector3(0,0,1).applyQuaternion(q);
  this.position.addScaledVector(forward,this.pendingTravel);this.pendingTravel=0;
  const key=support<0?null:support+':'+Math.floor((this.phase*77-index+this.contactCycleOffset(index,support))/77);
  if(support>=0){
   const probe=info[support].probe.clone().applyQuaternion(q);
   if(this.plantKey!==key||!this.anchor){this.anchor=probe.clone().add(this.position);this.steps++;}
   this.position.x=this.anchor.x-probe.x;this.position.z=this.anchor.z-probe.z;
  }else this.anchor=null;
  this.plantKey=key;
  const bound=TUNING.slabSize/2-.9,clamped=Math.abs(this.position.x)>bound||Math.abs(this.position.z)>bound;this.position.x=T.MathUtils.clamp(this.position.x,-bound,bound);this.position.z=T.MathUtils.clamp(this.position.z,-bound,bound);if(clamped){this.anchor=null;this.plantKey=null;this.speed=0;}
  const y=T.MathUtils.lerp(this.heights[index],this.heights[(index+1)%77],frame-index)*this.activity,lowest=Math.min(...info.map(i=>i.low));this.root.position.copy(this.position);this.root.position.y=Math.max(y,-lowest);this.root.quaternion.copy(q);this.root.updateMatrixWorld(true);
  const sole=lowest+this.root.position.y;this.metrics.minSoleHeight=Math.min(this.metrics.minSoleHeight,sole);
  if(this.anchor&&support>=0){const actual=this.legs[support].foot.localToWorld(new T.Vector3().fromBufferAttribute(this.legs[support].foot.geometry.attributes.position,this.legs[support].motion.probe));this.metrics.maxPlantedSlide=Math.max(this.metrics.maxPlantedSlide,Math.hypot(actual.x-this.anchor.x,actual.z-this.anchor.z));}
  if(this.activity>.99){const hip=this.rig.hipRight.getWorldPosition(new T.Vector3()).y;this.metrics.minHip=Math.min(this.metrics.minHip,hip);this.metrics.maxHip=Math.max(this.metrics.maxHip,hip);}
  this.idlePose=this.activity===0&&this.speed===0&&this.intentAmount===0;
 }
 contactCycleOffset(index,support){let start=index;while(start>0&&this.contacts[start-1]===support)start--;return start;}
 getState(){return {position:this.position.toArray(),speed:this.speed,maxSpeed:this.maxSpeed,phase:this.phase,facing:this.facing,activity:this.activity,steps:this.steps,contacts:this.contacts,metrics:{...this.metrics}};}
}
