import {Euler,Quaternion,Vector3,MathUtils} from 'three';
/** Original LetsGo seated eye point/FOV. This rig only reads the rendered kart pose. */
export const FPV=Object.freeze({eyeHeight:1.32,eyeForward:-.78,fov:76,near:.04,basePitch:-.10,yawLimit:1.2,pitchLimit:.45});
export function createDrivingCameraRig(getPose, getEye = () => FPV){
 const rotation=new Quaternion(),angles=new Euler(0,0,0,'YXZ'),origin=new Vector3(),direction=new Vector3(),lookAt=new Vector3();
 let active=false,headYaw=0,headPitch=0,savedNear=null;
 return {
  views:{fpv:[Math.PI,Math.atan2(3.5,10)]},
  handles:name=>name==='fpv',
  setView(name,camera){
   if(name==='fpv'){if(!active)savedNear=camera.near;active=true;headYaw=headPitch=0;}
   else{if(active&&savedNear!==null){camera.near=savedNear;camera.updateProjectionMatrix();}active=false;headYaw=headPitch=0;}
  },
  update({camera,controls}){
   const pose=getPose();headYaw=MathUtils.clamp(headYaw-(controls.look?.x??0),-FPV.yawLimit,FPV.yawLimit);headPitch=MathUtils.clamp(headPitch-(controls.look?.y??0),-FPV.pitchLimit,FPV.pitchLimit);
   rotation.setFromEuler(angles.set(pose.pitch,pose.yaw,pose.bank,'YXZ'));
   const eye = getEye();
   origin.set(0,eye.eyeHeight,eye.eyeForward).applyQuaternion(rotation);origin.x+=pose.x;origin.y+=pose.y;origin.z+=pose.z;
   const pitch=FPV.basePitch+headPitch;
   direction.set(Math.sin(headYaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(headYaw)*Math.cos(pitch)).applyQuaternion(rotation);
   camera.position.copy(origin);camera.up.set(0,1,0).applyQuaternion(rotation);camera.fov=FPV.fov;camera.near=FPV.near;camera.updateProjectionMatrix();camera.lookAt(lookAt.copy(origin).add(direction));camera.updateMatrixWorld(true);
  },
  getState:()=>({active,headYaw,headPitch}),
 };
}
