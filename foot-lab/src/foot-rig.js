import * as T from 'three';
import {createAnkleBall} from './ankle-socket.js';
import {ANKLE_LIMITS,normalizeAnklePose} from '../../avatar/src/joints/ankle-contract.js';

export const REST_POSE=Object.freeze({ankle:0,roll:0,toes:0,heel:0});
export const MOTIONS=Object.freeze([
 {id:'ankle',label:'Ankle bend',min:ANKLE_LIMITS.ankle[0],max:ANKLE_LIMITS.ankle[1],left:'Toes up',right:'Toes down'},
 {id:'roll',label:'Side tilt',min:ANKLE_LIMITS.roll[0],max:ANKLE_LIMITS.roll[1],left:'Left',right:'Right'},
 {id:'toes',label:'Toe bend',min:0,max:25,left:'Rest',right:'Raised'},
 {id:'heel',label:'Heel raise',min:0,max:30,left:'Flat',right:'Tiptoe'},
]);
export const POSES=Object.freeze({
 rest:{...REST_POSE},point:{...REST_POSE,ankle:ANKLE_LIMITS.ankle[1]},flex:{...REST_POSE,ankle:ANKLE_LIMITS.ankle[0]},
 toes:{...REST_POSE,toes:25},tiptoe:{...REST_POSE,heel:30},
});
export const BEND_START=.145,BEND_END=.265;
const MID_HEIGHT=.065,STEPS=192;

// Transport cross-sections along a smooth arc through the ball of the foot.
// Bending around its middle keeps the thick clay surface from folding over.
function bendCurve(degrees,maxZ){
 const angle=T.MathUtils.degToRad(degrees),step=(maxZ-BEND_START)/STEPS;
 const ys=new Float64Array(STEPS+1),zs=new Float64Array(STEPS+1);zs[0]=BEND_START;
 for(let i=1;i<=STEPS;i++){
  const z=BEND_START+(i-.5)*step,a=-angle*T.MathUtils.smoothstep(z,BEND_START,BEND_END);
  ys[i]=ys[i-1]-Math.sin(a)*step;zs[i]=zs[i-1]+Math.cos(a)*step;
 }
 return (x,y,z,out)=>{
  if(z<=BEND_START||angle===0)return out.set(x,y,z);
  const q=T.MathUtils.clamp((z-BEND_START)/step,0,STEPS),i=Math.min(STEPS-1,Math.floor(q)),t=q-i;
  const a=-angle*T.MathUtils.smoothstep(z,BEND_START,BEND_END),offset=y-MID_HEIGHT;
  return out.set(x,MID_HEIGHT+T.MathUtils.lerp(ys[i],ys[i+1],t)+offset*Math.cos(a),T.MathUtils.lerp(zs[i],zs[i+1],t)+offset*Math.sin(a));
 };
}

export function motionPose(seconds){
 const phase=((seconds%16)+16)%16,p={...REST_POSE};
 if(phase<5){p.ankle=phase<2.5?ANKLE_LIMITS.ankle[1]*Math.sin(phase/2.5*Math.PI):ANKLE_LIMITS.ankle[0]*Math.sin((phase-2.5)/2.5*Math.PI);}
 else if(phase<9)p.roll=ANKLE_LIMITS.roll[1]*Math.sin((phase-5)/4*Math.PI*2);
 else if(phase<12)p.toes=25*Math.sin((phase-9)/3*Math.PI)**2;
 else p.heel=30*Math.sin((phase-12)/4*Math.PI)**2;
 return p;
}

export function createFootRig(foot,calf){
 const group=new T.Group();group.name='foot-motion-study';
 const pivot=new T.Vector3(...foot.geometry.userData.ankleCenter),ankleBall=createAnkleBall(foot.material,pivot);group.add(foot,calf,ankleBall);
 const fp=foot.geometry.attributes.position,fn=foot.geometry.attributes.normal,restFoot=fp.array.slice(),restFootNormals=fn.array.slice();
 const calfPosition=calf.position.clone(),anchor=new T.Vector3();let soleFront=-Infinity;
 for(let i=0;i<fp.count;i++)if(fp.getY(i)<1e-7)soleFront=Math.max(soleFront,fp.getZ(i));anchor.z=soleFront-.003;
 const maxZ=foot.geometry.boundingBox.max.z,point=new T.Vector3(),bent=new T.Vector3(),offset=new T.Vector3(),normal=new T.Vector3();
 const heelRotation=new T.Matrix4(),extraRotation=new T.Matrix4(),rigid=new T.Matrix4(),rotation=new T.Matrix3(),pivotNow=new T.Vector3(),pivotDelta=new T.Vector3();
 let pose={...REST_POSE},updates=0;
 function setPose(input){
  pose=normalizeAnklePose(input);
  if(Object.values(pose).every(v=>v===0)){
   fp.array.set(restFoot);fn.array.set(restFootNormals);calf.position.copy(calfPosition);ankleBall.position.copy(pivot);group.position.set(0,0,0);foot.geometry.userData.ankleCenter=pivot.toArray();
  }else{
   const bend=bendCurve(pose.heel+pose.toes,maxZ),heelBend=bendCurve(pose.heel,maxZ);
   heelRotation.makeRotationX(T.MathUtils.degToRad(pose.heel));heelBend(anchor.x,anchor.y,anchor.z,bent).applyMatrix4(heelRotation);
   offset.copy(anchor).sub(bent);heelRotation.setPosition(offset);pivotNow.copy(pivot).applyMatrix4(heelRotation);pivotDelta.copy(pivotNow).sub(pivot);
   extraRotation.makeRotationZ(T.MathUtils.degToRad(pose.roll)).multiply(new T.Matrix4().makeRotationX(T.MathUtils.degToRad(pose.ankle)));
   offset.copy(pivotNow).sub(point.copy(pivotNow).applyMatrix4(extraRotation));extraRotation.setPosition(offset);rigid.multiplyMatrices(extraRotation,heelRotation);
   let lowest=Infinity;for(let i=0;i<fp.count;i++){bend(restFoot[i*3],restFoot[i*3+1],restFoot[i*3+2],point).applyMatrix4(rigid);fp.setXYZ(i,point.x,point.y,point.z);lowest=Math.min(lowest,point.y);}
   group.position.y=-lowest;calf.position.copy(calfPosition).add(pivotDelta);ankleBall.position.copy(pivotNow);foot.geometry.userData.ankleCenter=pivotNow.toArray();
   foot.geometry.computeVertexNormals();rotation.setFromMatrix4(rigid);
   for(let i=0;i<fp.count;i++)if(!(pose.heel+pose.toes)||restFoot[i*3+2]<=BEND_START){normal.fromArray(restFootNormals,i*3).applyMatrix3(rotation).normalize();fn.setXYZ(i,normal.x,normal.y,normal.z);}
  }
  fp.needsUpdate=fn.needsUpdate=true;foot.geometry.computeBoundingBox();foot.geometry.computeBoundingSphere();group.updateMatrixWorld(true);updates++;
 }
 return {group,setPose,ankleBall,getState:()=>({pose:{...pose},updates,groundLift:group.position.y}),pivot:pivot.toArray(),bendStart:BEND_START,bendEnd:BEND_END};
}
