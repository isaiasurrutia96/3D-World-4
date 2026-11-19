import * as T from 'three';
import {createForearmHandAssembly} from '../../avatar/src/hand-study/assembly.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';

export const WRIST_STUDY=Object.freeze({diameterRatio:.9,gap:.045});

// Presentation only: the original saved shapes stay byte-identical. The ball
// remains at the existing wrist point; the other parts are spaced around it.
export function createWristStudy(){
 const material=new T.MeshStandardMaterial({color:'#b9b2a6',roughness:.78,metalness:0});
 const {assembly,hand,forearm}=createForearmHandAssembly(material),group=new T.Group();
 assembly.remove(hand,forearm);group.name='separate-wrist-parts';group.add(hand,forearm);
 const size=forearm.geometry.boundingBox.getSize(new T.Vector3()).multiply(forearm.scale);
 const diameter=Math.min(size.x,size.z)*WRIST_STUDY.diameterRatio,radius=diameter/2;
 const joint=SIDE.find(b=>b.name==='hand');if(!joint)throw Error('Missing existing wrist joint');
 const ball=new T.Mesh(new T.SphereGeometry(radius,64,48),material);ball.name='wrist-study-ball';ball.position.fromArray(joint.head);group.add(ball);
 for(const part of [forearm,hand]){
  part.position.set(0,0,0);part.updateMatrixWorld(true);const box=new T.Box3().setFromObject(part),center=box.getCenter(new T.Vector3());
  part.position.x=ball.position.x-center.x;part.position.z=ball.position.z-center.z;
  part.position.y=part===forearm?ball.position.y+radius+WRIST_STUDY.gap-box.min.y:ball.position.y-radius-WRIST_STUDY.gap-box.max.y;
 }
 group.updateMatrixWorld(true);
 ball.userData={radius,diameter,diameterRatio:WRIST_STUDY.diameterRatio,skeletonJoint:'hand.L',skeletonPoint:[...joint.head]};
 return {group,forearm,hand,ball,diameter,radius};
}
