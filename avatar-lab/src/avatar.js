import * as T from 'three';
import {createApprovedAvatar} from '../../avatar/src/approved-avatar.js';
import {createFootShape} from '../../foot-lab/src/foot-shape.js';
import {createCalf} from '../../foot-lab/src/calf.js';
import {createFootRig,REST_POSE} from '../../foot-lab/src/foot-rig.js';

// Reuse the saved upper body and hands verbatim. Mount the fitted lower legs
// at their original knee contacts, with mirrored big toes facing inward.
export function createAssembledAvatar(){
 const avatar=createApprovedAvatar(),{rig}=avatar,lowerLegs=[];
 rig.root.updateMatrixWorld(true);
 for(const [knee,side] of [[rig.kneeLeft,-1],[rig.kneeRight,1]]){
  const oldCalf=knee.children[0],oldAnkle=knee.children[1];oldCalf.geometry.computeBoundingBox();
  const contact=knee.localToWorld(new T.Vector3(oldCalf.position.x,oldCalf.position.y+oldCalf.geometry.boundingBox.max.y,oldCalf.position.z));
  const foot=createFootShape(),calf=createCalf(foot),motion=createFootRig(foot,calf),mount=new T.Group();
  const top=calf.geometry.boundingBox.max.y;
  mount.name=side===1?'right-fitted-lower-leg':'left-fitted-lower-leg';mount.scale.x=side;
  mount.position.set(contact.x-side*calf.position.x,contact.y-calf.position.y-top,contact.z-calf.position.z);
  mount.add(motion.group);rig.root.add(mount);
  knee.remove(oldCalf,oldAnkle);
  oldCalf.geometry.dispose();oldAnkle.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
  foot.name=side===1?'right-rounded-foot':'left-rounded-foot';calf.name=side===1?'right-socket-calf':'left-socket-calf';
  lowerLegs.push({side,mount,foot,calf,motion,restCalfPosition:calf.position.clone()});
 }
 rig.root.updateMatrixWorld(true);
 const sole=Math.min(...lowerLegs.map(({foot})=>new T.Box3().setFromObject(foot).min.y));
 rig.root.position.y=-sole;
 const bodyRest=rig.body.position.clone();
 function setFootPose(pose){
  const delta=new T.Vector3();
  for(const leg of lowerLegs){
   leg.motion.setPose(pose);
   delta.add(leg.calf.position.clone().sub(leg.restCalfPosition).multiply(new T.Vector3(leg.side,1,1)));
   delta.y+=leg.motion.group.position.y;
  }
  // Both feet are posed together in this assembly study. Translate the body
  // with the rigid calves so the knee contacts stay seated as the heels rise.
  rig.body.position.copy(bodyRest).addScaledVector(delta,1/lowerLegs.length);
  rig.root.updateMatrixWorld(true);
 }
 setFootPose(REST_POSE);
 return {...avatar,lowerLegs,setFootPose,bodyRest};
}
