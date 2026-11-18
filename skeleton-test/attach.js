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
// section). The torso is now a chest on a pelvis (ball-and-socket waist):
// the chest turns on the hips; leaning is kept at 0 for now. The chest
// rides on the waist bone and its surface bends softly toward the chest bone
// (avatar-lab/src/chest-bend.js): a slight twist and small forward bend,
// still one smooth piece.
import * as T from 'three';
import {createChestBend} from '../avatar-lab/src/chest-bend.js';
import {createAssembledAvatar} from '../avatar-lab/src/avatar.js';
import {createSkeleton} from '../motion-core/skeleton/skeleton.js';

export function createSkeletonAvatar(){
 const avatar=createAssembledAvatar(),rig=avatar.rig,skeleton=createSkeleton();
 rig.root.updateMatrixWorld(true);
 const mesh=group=>group.children.find(o=>o.isMesh);
 const parts=[
  ['chest',rig.torso.children.find(o=>o.name==='chest'),'spine'],
  ['pelvis',rig.torso.children.find(o=>o.name==='pelvis'),'pelvis'],
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
 // The chest surface bends between the waist and the chest bone.
 const chestPart=attached.find(a=>a.label==='chest'),bone=n=>new T.Vector3(...skeleton.bones[skeleton.index.get(n)].head);
 const chestBend=createChestBend(chestPart.mesh,chestPart.rest,bone('chest'),undefined,['L','R'].map(s=>({head:bone('clavicle.'+s),ball:bone('upperArm.'+s)})));
 chestPart.shoulderMatrix=[new T.Matrix4(),new T.Matrix4()];
 const clavTurn=[new T.Quaternion(),new T.Quaternion()],chestInv=new T.Quaternion();
 chestPart.firmMatrix=new T.Matrix4();
 const relTurn=new T.Quaternion();
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
  // Chest bone's turn relative to the waist bone bends the chest surface.
  relTurn.copy(solved.get('spine').rotation).invert().multiply(solved.get('chest').rotation);
  // Each collarbone's turn relative to the chest bone moves its shoulder socket.
  chestInv.copy(solved.get('chest').rotation).invert();
  ['L','R'].forEach((s,j)=>clavTurn[j].copy(chestInv).multiply(solved.get('clavicle.'+s).rotation));
  chestBend.apply(relTurn,clavTurn);
  chestPart.firmMatrix.multiplyMatrices(chestPart.mesh.matrix,chestBend.firmLocal);
  chestPart.shoulderMatrix.forEach((m,j)=>m.multiplyMatrices(chestPart.mesh.matrix,chestBend.shoulderLocal[j]));
  return solved;
 }
 apply(skeleton.restPose());
 return {root,skeleton,attached,apply,chestBend,get solved(){return solved;},avatar};
}
