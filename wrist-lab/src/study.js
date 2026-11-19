import * as T from 'three';
import {createForearmHandAssembly} from '../../avatar/src/hand-study/assembly.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';
import {roundForearmEnd} from './round-forearm.js';
import {makeHandFuller,moldWristSocket} from './mold-socket.js';

export const WRIST_STUDY=Object.freeze({diameterRatio:.9,gap:.045,forearmDepth:1/3,handDepth:1/6,handGrowth:.002,filletRadius:.005});

// Presentation only: the original saved shapes stay byte-identical. The ball
// remains at the existing wrist point; the other parts are spaced around it.
export function createWristStudy({stage='original'}={}){
 const material=new T.MeshStandardMaterial({color:'#b9b2a6',roughness:.78,metalness:0});
 const {assembly,hand,forearm}=createForearmHandAssembly(material),group=new T.Group();
 assembly.remove(hand,forearm);group.name='separate-wrist-parts';group.add(hand,forearm);
 const size=forearm.geometry.boundingBox.getSize(new T.Vector3()).multiply(forearm.scale);
 const diameter=Math.min(size.x,size.z)*WRIST_STUDY.diameterRatio,radius=diameter/2;
 if(stage==='rounded'||stage==='molded')roundForearmEnd(forearm);
 else if(stage!=='original')throw Error('Unknown wrist study stage');
 const joint=SIDE.find(b=>b.name==='hand');if(!joint)throw Error('Missing existing wrist joint');
 const ball=new T.Mesh(new T.SphereGeometry(radius,64,48),material);ball.name='wrist-study-ball';ball.position.fromArray(joint.head);group.add(ball);
 for(const part of [forearm,hand]){
  part.position.set(0,0,0);part.updateMatrixWorld(true);const box=new T.Box3().setFromObject(part),center=box.getCenter(new T.Vector3());
  part.position.x=ball.position.x-center.x;part.position.z=ball.position.z-center.z;
  part.position.y=part===forearm?ball.position.y+radius+WRIST_STUDY.gap-box.min.y:ball.position.y-radius-WRIST_STUDY.gap-box.max.y;
 }
 if(stage==='molded'){
  makeHandFuller(hand,WRIST_STUDY.handGrowth);
  for(const [part,depthFraction,underside] of [[forearm,WRIST_STUDY.forearmDepth,true],[hand,WRIST_STUDY.handDepth,false]]){
   const data=moldWristSocket(part,{radius,depthFraction,underside,filletRadius:WRIST_STUDY.filletRadius});part.updateMatrix();
   const center=new T.Vector3(...data.center).multiply(part.scale).applyQuaternion(part.quaternion);
   part.position.copy(ball.position).sub(center);
  }
 }
 group.updateMatrixWorld(true);
 ball.userData={radius,diameter,diameterRatio:WRIST_STUDY.diameterRatio,skeletonJoint:'hand.L',skeletonPoint:[...joint.head]};
 return {group,forearm,hand,ball,diameter,radius};
}
