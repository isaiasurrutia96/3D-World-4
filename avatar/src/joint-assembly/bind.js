import * as T from 'three';
import {createSkeleton} from '../../../motion-core/skeleton/skeleton.js';
import {createChestBend} from '../../../avatar-lab/src/chest-bend.js';
import {loadStudyAsset} from '../../../src/study-asset.js';

// Graphics attachment only. No gait, IK, timing, joint limit or bone changes.
// Claude can feed the existing skeleton poses into apply().
export function bindJointAssembly(study){
 const skeleton=createSkeleton(),root=study.group,at=name=>new T.Vector3(...skeleton.bones[skeleton.index.get(name)].head);
 // Refuse mismatched assets before drawing. The skeleton supplies every
 // joint position; there is no second table of display positions.
 if(root.children.length!==28)throw Error('Expected the 28 approved avatar parts');
 const names=new Set(),balls=new Set(),cupCounts=new Map();root.updateMatrixWorld(true);
 for(const mesh of root.children){
  mesh.updateMatrix();
  const spec=mesh.userData.assembly;
  if(!mesh.isMesh||names.has(mesh.name)||!spec||!skeleton.index.has(spec.bone))throw Error('Invalid assembled part '+mesh.name);
  names.add(mesh.name);
  if(!mesh.matrix.elements.every(Number.isFinite))throw Error('Non-finite part transform: '+mesh.name);
  if(spec.ball){
   if(spec.ball.bone!==spec.bone||balls.has(spec.bone)||!Number.isFinite(spec.ball.radius)||!(spec.ball.radius>0))throw Error('Invalid joint ball '+mesh.name);
   if(new T.Vector3().applyMatrix4(mesh.matrix).distanceTo(at(spec.bone))>1e-6)throw Error('Joint ball is off its skeleton point: '+mesh.name);
   balls.add(spec.bone);
  }
  for(const cup of spec.sockets??[]){
   if(!skeleton.index.has(cup.bone)||!Array.isArray(cup.center)||cup.center.length!==3||!cup.center.every(Number.isFinite)||!Number.isFinite(cup.radius)||!(cup.radius>0))throw Error('Invalid socket on '+mesh.name);
   if(new T.Vector3(...cup.center).applyMatrix4(mesh.matrix).distanceTo(at(cup.bone))>1e-6)throw Error('Socket is off its skeleton point: '+mesh.name);
   cupCounts.set(cup.bone,(cupCounts.get(cup.bone)??0)+1);
  }
 }
 if(balls.size!==12||cupCounts.size!==12||[...balls].some(bone=>cupCounts.get(bone)!==2))throw Error('Each of the 12 joints needs one ball and two sockets');
 const attached=root.children.map(mesh=>{const spec=mesh.userData.assembly;if(!spec||!skeleton.index.has(spec.bone))throw Error('Invalid assembled part '+mesh.name);mesh.updateMatrix();const rest=mesh.matrix.clone();mesh.matrixAutoUpdate=false;return {mesh,label:mesh.name,bone:spec.bone,rest,restHead:at(spec.bone),sockets:spec.sockets,ball:spec.ball};});
 const chest=attached.find(a=>a.label==='chest'),chestBend=createChestBend(chest.mesh,chest.rest,at('chest'),undefined,['L','R'].map(side=>({head:at('clavicle.'+side),ball:at('upperArm.'+side)})));
 chest.firmMatrix=new T.Matrix4();chest.shoulderMatrix=[new T.Matrix4(),new T.Matrix4()];
 const move=new T.Matrix4(),turn=new T.Matrix4(),back=new T.Matrix4(),delta=new T.Matrix4(),relative=new T.Quaternion(),chestInverse=new T.Quaternion(),clavicle=[new T.Quaternion(),new T.Quaternion()];let solved;
 function apply(pose={}){
  solved=skeleton.solve(pose);
  for(const a of attached){const b=solved.get(a.bone);delta.copy(move.makeTranslation(b.head.x,b.head.y,b.head.z)).multiply(turn.makeRotationFromQuaternion(b.rotation)).multiply(back.makeTranslation(-a.restHead.x,-a.restHead.y,-a.restHead.z));a.mesh.matrix.multiplyMatrices(delta,a.rest);a.mesh.matrixWorldNeedsUpdate=true;}
  relative.copy(solved.get('spine').rotation).invert().multiply(solved.get('chest').rotation);chestInverse.copy(solved.get('chest').rotation).invert();['L','R'].forEach((side,i)=>clavicle[i].copy(chestInverse).multiply(solved.get('clavicle.'+side).rotation));chestBend.apply(relative,clavicle);
  chest.firmMatrix.multiplyMatrices(chest.mesh.matrix,chestBend.firmLocal);chest.shoulderMatrix.forEach((m,i)=>m.multiplyMatrices(chest.mesh.matrix,chestBend.shoulderLocal[i]));
  root.updateMatrixWorld(true);return solved;
 }
 let disposed=false;
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();const geometries=new Set(),materials=new Set();for(const a of attached){geometries.add(a.mesh.geometry);materials.add(a.mesh.material);}for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
 apply(skeleton.restPose());
 return {root,group:root,skeleton,attached,apply,chestBend,dispose,get solved(){return solved;}};
}
export async function loadJointAvatar(url){return bindJointAssembly(await loadStudyAsset(url));}
