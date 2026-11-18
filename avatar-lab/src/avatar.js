import * as T from 'three';
import {createApprovedAvatar} from '../../avatar/src/approved-avatar.js';
import {createFootShape} from '../../foot-lab/src/foot-shape.js';
import {createCalf} from '../../foot-lab/src/calf.js';
import {createFootRig,REST_POSE} from '../../foot-lab/src/foot-rig.js';
import {splitTorso} from './torso-split.js';

// How far both hands turn at the wrist at rest (degrees): the fingertips
// point slightly forward. Owner's change, 18 Nov 2026.
export const HAND_TILT_DEGREES=8;

/** Centre of a rounded end (least-squares sphere fit). */
function ballCentre(points){
 const A=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],N=[0,0,0,0];
 for(const p of points){const a=[2*p.x,2*p.y,2*p.z,1],b=p.lengthSq();for(let i=0;i<4;i++){N[i]+=a[i]*b;for(let j=0;j<4;j++)A[i][j]+=a[i]*a[j];}}
 const e=new T.Matrix4().set(...A.flat()).invert().elements;
 return new T.Vector3(...[0,1,2].map(i=>e[i]*N[0]+e[4+i]*N[1]+e[8+i]*N[2]+e[12+i]*N[3]));
}

/**
 * Turn both hands at the wrist so the fingertips point slightly forward.
 * Each hand turns about its wrist ball (the rounded top of the hand that sits
 * in the forearm socket), so it stays cradled in the socket. The left hand
 * is the exact mirror (its mount is mirrored), so the same local turn works.
 */
function tiltHands(avatar,degrees){
 if(!degrees)return;
 avatar.rig.root.updateMatrixWorld(true);
 const first=avatar.lowerArmParts.find(p=>p.side===1),hand=first.hand,P=hand.geometry.attributes.position;
 const world=[];let top=-Infinity;
 for(let i=0;i<P.count;i++){const v=new T.Vector3().fromBufferAttribute(P,i).applyMatrix4(hand.matrixWorld);world.push(v);top=Math.max(top,v.y);}
 const pivotLocal=hand.worldToLocal(ballCentre(world.filter(v=>v.y>top-.05)));
 // The turn axis is the avatar's sideways axis, written in the hand's parent space.
 const parent=hand.parent,axis=new T.Vector3(1,0,0).transformDirection(parent.matrixWorld.clone().invert()).normalize();
 const turn=new T.Quaternion().setFromAxisAngle(axis,-degrees*Math.PI/180);
 for(const part of avatar.lowerArmParts){
  const h=part.hand,pivot=pivotLocal.clone().applyMatrix4(h.matrix);
  h.position.sub(pivot).applyQuaternion(turn).add(pivot);h.quaternion.premultiply(turn);h.updateMatrix();
 }
 avatar.rig.root.updateMatrixWorld(true);
}

// Reuse the saved upper body and hands verbatim. Mount the fitted lower legs
// at their original knee contacts, with mirrored big toes facing inward.
export function createAssembledAvatar(options={}){
 const avatar=createApprovedAvatar(),{rig}=avatar,lowerLegs=[];
 tiltHands(avatar,options.handTilt??HAND_TILT_DEGREES);
 // Chest and pelvis as two pieces joined by a ball-and-socket waist.
 const waist=options.torsoSplit===false?null:splitTorso(rig);
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
  lowerLegs.push({side,mount,foot,calf,motion,ankleBall:motion.ankleBall,restCalfPosition:calf.position.clone()});
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
 return {...avatar,lowerLegs,setFootPose,bodyRest,waist};
}
