import * as T from 'three';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';
import {createWristStudy} from '../../wrist-lab/src/study.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';

export const ELBOW_STUDY=Object.freeze({diameterRatio:.9,gap:.045});

// A static exploded view. Only display translations change; the source
// meshes and skeleton coordinates remain untouched. No elbow sockets yet.
export function createElbowStudy(){
 const reference=createCharacterRig({plain:true});
 const original=reference.shoulderRight.children.find(part=>part.isMesh);
 const upperArm=new T.Mesh(original.geometry.clone(),original.material.clone());
 upperArm.quaternion.copy(original.quaternion);upperArm.scale.copy(original.scale);
 upperArm.name='original-upper-arm';
 const geometries=new Set(),materials=new Set();
 reference.root.traverse(part=>{if(part.isMesh){geometries.add(part.geometry);materials.add(part.material);}});
 for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();

 // Use the approved forearm, including its current wrist-end socket.
 // Detach it before disposing the unused hand and wrist ball. The wrist
 // ball shares this forearm's material, so that material stays alive.
 const wrist=createWristStudy({stage:'molded'}),forearm=wrist.forearm;
 forearm.removeFromParent();wrist.hand.geometry.dispose();wrist.ball.geometry.dispose();
 if(wrist.hand.material!==forearm.material)wrist.hand.material.dispose();
 const group=new T.Group();group.name='separated-elbow-study';group.add(upperArm,forearm);
 const widths=[upperArm,forearm].flatMap(part=>{
  const size=new T.Box3().setFromObject(part).getSize(new T.Vector3());return [size.x,size.z];
 });
 const diameter=Math.min(...widths)*ELBOW_STUDY.diameterRatio,radius=diameter/2;
 const joint=SIDE.find(bone=>bone.name==='lowerArm');
 const ball=new T.Mesh(new T.SphereGeometry(radius,64,48),forearm.material);
 ball.name='elbow-ball';ball.position.fromArray(joint.head);group.add(ball);
 ball.userData={radius,diameter,diameterRatio:ELBOW_STUDY.diameterRatio,skeletonJoint:'lowerArm.L',skeletonPoint:[...joint.head]};

 for(const [part,above] of [[upperArm,true],[forearm,false]]){
  const bounds=new T.Box3().setFromObject(part),center=bounds.getCenter(new T.Vector3());
  part.position.x+=ball.position.x-center.x;part.position.z+=ball.position.z-center.z;
  const edge=above?bounds.min.y:bounds.max.y;
  const target=ball.position.y+(above?1:-1)*(radius+ELBOW_STUDY.gap);
  part.position.y+=target-edge;
 }
 group.updateMatrixWorld(true);
 return {group,upperArm,forearm,ball,diameter,radius};
}
