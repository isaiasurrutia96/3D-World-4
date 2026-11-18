// Skeleton · section 2: hanging the clay body parts on the bones.
//
// Each approved Checkpoint 2 body part rides rigidly on one bone. When a
// bone turns, its parts turn with it about the joint pivot, which is the
// centre of that part's rounded joint ball, so every ball stays in its
// socket. The skeleton itself (motion-core/skeleton) knows nothing about
// meshes; this file is the glue between the skeleton and the drawing.
//
// Not yet bending: the hand mesh's fingers and the foot's toes are part of
// one piece each (their own bending comes back in the hands-and-feet
// section), and the torso is one solid piece from hips to shoulders, so the
// waist (spine) stays straight until the body-bending section.
import * as T from 'three';
import {createAssembledAvatar} from '../avatar-lab/src/avatar.js';
import {createSkeleton} from '../motion-core/skeleton/skeleton.js';

export function createSkeletonAvatar(){
 const avatar=createAssembledAvatar(),rig=avatar.rig,skeleton=createSkeleton();
 rig.root.updateMatrixWorld(true);
 const mesh=group=>group.children.find(o=>o.isMesh);
 const parts=[
  ['socket-torso',rig.torso.children.find(o=>o.name==='socket-torso'),'spine'],
  ['neck',rig.torso.children.find(o=>o.name==='original-neck'),'neck'],
  ['head',mesh(rig.head),'head'],
 ];
 // The old rig's "Right" parts (+x) are on HIS left; names below are his own left/right.
 for(const [side,k] of [['L','Right'],['R','Left']]){
  const arm=avatar.lowerArmParts.find(p=>p.side===(side==='L'?1:-1)),leg=avatar.lowerLegs.find(l=>l.side===(side==='L'?1:-1));
  parts.push([`upper-arm.${side}`,mesh(rig['shoulder'+k]),`upperArm.${side}`],[`forearm.${side}`,arm.forearm,`lowerArm.${side}`],[`hand.${side}`,arm.hand,`hand.${side}`],
   [`thigh.${side}`,mesh(rig['hip'+k]),`thigh.${side}`],[`calf.${side}`,leg.calf,`shin.${side}`],[`foot.${side}`,leg.foot,`foot.${side}`]);
 }
 // Lift every part out of the old rig, keeping exactly where it is now.
 const root=new T.Group();root.name='skeleton-avatar';
 const attached=parts.map(([label,m,bone])=>{
  if(!m)throw Error('Missing body part '+label);
  const rest=m.matrixWorld.clone();m.removeFromParent();m.matrixAutoUpdate=false;m.matrix.copy(rest);root.add(m);
  const b=skeleton.bones[skeleton.index.get(bone)];
  return {label,mesh:m,bone,rest,restHead:new T.Vector3(...b.head)};
 });
 const delta=new T.Matrix4(),move=new T.Matrix4(),back=new T.Matrix4(),turn=new T.Matrix4();
 let solved=skeleton.solve(skeleton.restPose());
 /** Pose the body: each part = (move to the bone's joint now) · turn · (from its rest joint) · rest placement. */
 function apply(pose){
  solved=skeleton.solve(pose);
  for(const a of attached){
   const s=solved.get(a.bone);
   move.makeTranslation(s.head.x,s.head.y,s.head.z);turn.makeRotationFromQuaternion(s.rotation);back.makeTranslation(-a.restHead.x,-a.restHead.y,-a.restHead.z);
   delta.copy(move).multiply(turn).multiply(back);a.mesh.matrix.multiplyMatrices(delta,a.rest);a.mesh.matrixWorldNeedsUpdate=true;
  }
  return solved;
 }
 apply(skeleton.restPose());
 return {root,skeleton,attached,apply,get solved(){return solved;},avatar};
}
