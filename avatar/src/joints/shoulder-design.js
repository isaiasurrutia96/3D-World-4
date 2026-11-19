import * as T from 'three';
import {createHipDesign} from './hip-design.js';
import {createElbowDesign} from './elbow-design.js';
import {SIDE} from '../../../motion-core/skeleton/bones.js';
import {moldWristSocket} from '../../../wrist-lab/src/mold-socket.js';
import {refineMoldSurface} from '../../../foot-lab/src/refine-mold-surface.js';
import {refineMoldedCup} from './refine-molded-cup.js';
import {trimShoulderInnerArm,measureRestOverlap} from './shoulder-clearance.js';

// Single-side private appearance draft. No opposite shoulder is generated.
export const SHOULDER_DESIGN=Object.freeze({topRadius:.1,diameterRatio:.9,capture:.30,filletRadius:.006,gap:.045});

function discard(root,keep){
 const geometries=new Set(),materials=new Set();root.traverse(p=>{if(p.isMesh){if(p.geometry!==keep.geometry)geometries.add(p.geometry);if(p.material!==keep.material)materials.add(p.material);}});
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
}

// Exact signed permutation: present the torso's +X side to the same +Y mold
// used by the other joints, without trigonometric noise or negative scales.
function sideFrame(g,back=false){
 for(const name of ['position','normal']){const a=g.attributes[name].array;for(let i=0;i<a.length;i+=3){const x=a[i],y=a[i+1];a[i]=back?y:-y;a[i+1]=back?-x:x;}}
 g.computeBoundingBox();g.computeBoundingSphere();
}

function freshShoulder(torso,originalHalf,point){
 const g=torso.geometry,p=g.attributes.position,oldNormals=g.attributes.normal.array.slice(),rows=originalHalf.length/(81*3);
 if(!Number.isInteger(rows))throw Error('Unexpected accepted torso reference');
 const profile=Array.from({length:rows},(_,j)=>({y:originalHalf[3*j+1],r:Math.abs(originalHalf[3*j+2])}));
 function radiusAt(y){let lo=0,hi=rows-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(profile[mid].y<y)lo=mid;else hi=mid;}const a=profile[lo],b=profile[hi];return T.MathUtils.lerp(a.r,b.r,T.MathUtils.clamp((y-a.y)/(b.y-a.y),0,1));}
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),distance=Math.hypot(y-point[1],z-point[2]);if(x<=0||distance>=.115)continue;
  // Fill the old arm-sized recess first. Retain the original rounded upper
  // lip; the new sphere, rather than the old arm end, will define the cup.
  const radius=radiusAt(y),base=Math.sqrt(Math.max(0,radius*radius-z*z));
  const lip=.026*Math.exp(-Math.pow((y-(point[1]+.083))/.035,2)-Math.pow((z-point[2])/.108,2))*T.MathUtils.smoothstep(base,.10,.19);
  p.setX(i,base+lip);
 }
 g.computeVertexNormals();const n=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  const distance=Math.hypot(p.getY(i)-point[1],p.getZ(i)-point[2]),w=p.getX(i)>0?1-T.MathUtils.smoothstep(distance,.10,.13):0;
  if(w===0){n.setXYZ(i,...oldNormals.subarray(3*i,3*i+3));continue;}
  const v=new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)).multiplyScalar(w).addScaledVector(new T.Vector3(...oldNormals.subarray(3*i,3*i+3)),1-w).normalize();n.setXYZ(i,v.x,v.y,v.z);
 }
 g.computeBoundingBox();g.computeBoundingSphere();
}

function roundArmTop(part){
 const g=part.geometry,oldNormals=g.attributes.normal.array.slice(),join=.07,R=SHOULDER_DESIGN.topRadius;
 refineMoldSurface(g,0,0,{passes:6,minY:join,preserveNormals:true,maxEdgeLength3D:.003});
 const p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  const dy=p.getY(i)-join;
  if(dy<=0){if(3*i<oldNormals.length)n.setXYZ(i,...oldNormals.subarray(3*i,3*i+3));continue;}
  const r=Math.hypot(p.getX(i),p.getZ(i));if(r<1e-10)continue;
  const target=Math.sqrt(Math.max(0,R*R-dy*dy)),x=p.getX(i)*target/r,z=p.getZ(i)*target/r;
  p.setXYZ(i,x,dy+join,z);const v=new T.Vector3(x,dy,z).normalize();n.setXYZ(i,v.x,v.y,v.z);
 }
 g.computeBoundingBox();g.computeBoundingSphere();
}


export function createShoulderDesign(){
 const hips=createHipDesign(),torso=hips.torso;torso.removeFromParent();discard(hips.group,torso);torso.position.set(0,0,0);
 const elbow=createElbowDesign(),upperArm=elbow.upperArm;upperArm.removeFromParent();discard(elbow.group,upperArm);upperArm.position.set(0,0,0);upperArm.name='upper-arm-L';
 const bone=SIDE.find(b=>b.name==='upperArm'),point=bone.head,radius=SHOULDER_DESIGN.topRadius*SHOULDER_DESIGN.diameterRatio,diameter=radius*2;
 const source={torso:{positions:torso.geometry.attributes.position.array.slice(),normals:torso.geometry.attributes.normal.array.slice(),index:torso.geometry.index.array.slice(),hipMolds:torso.geometry.userData.hipMolds},upperArm:{positions:upperArm.geometry.attributes.position.array.slice(),normals:upperArm.geometry.attributes.normal.array.slice(),index:upperArm.geometry.index.array.slice(),elbowMold:upperArm.geometry.userData.elbowMold}};
 freshShoulder(torso,hips.source.torso.positions,point);roundArmTop(upperArm);
 sideFrame(torso.geometry);
 const originalNormals=torso.geometry.attributes.normal.array.slice();
 refineMoldSurface(torso.geometry,-point[1],point[2],{passes:4,minY:.1,preserveNormals:true,maxEdgeLength3D:.0015});
 for(let i=0;i<originalNormals.length/3;i++)torso.geometry.attributes.normal.setXYZ(i,...originalNormals.subarray(3*i,3*i+3));
 const torsoSurface=torso.geometry.clone();
 const settings={radius,depthFraction:SHOULDER_DESIGN.capture,filletRadius:SHOULDER_DESIGN.filletRadius};
 const torsoMold=moldWristSocket(torso,{...settings,centerXZ:[-point[1],point[2]]});
 refineMoldedCup(torso,torsoMold,torsoSurface,{rounds:2,analyticLipNormals:true});torsoSurface.dispose();sideFrame(torso.geometry,true);
 const C=new T.Matrix4().set(0,-1,0,0,1,0,0,0,0,0,1,0,0,0,0,1);
 torsoMold.center=[torsoMold.center[1],-torsoMold.center[0],torsoMold.center[2]];torsoMold.toMold=new T.Matrix4().fromArray(torsoMold.toMold).multiply(C).toArray();
 torso.geometry.userData.shoulderMold=torsoMold;delete torso.geometry.userData.wristMold;
 const armSurface=upperArm.geometry.clone(),armMold=moldWristSocket(upperArm,{...settings,centerXZ:[0,0]});
 refineMoldedCup(upperArm,armMold,armSurface,{rounds:2});armSurface.dispose();upperArm.geometry.userData.shoulderMold=armMold;delete upperArm.geometry.userData.wristMold;
 const clearance=trimShoulderInnerArm(upperArm,radius);
 const ball=new T.Mesh(new T.SphereGeometry(radius,64,48),upperArm.material);ball.name='shoulder-ball-L';ball.position.fromArray(point);ball.userData={radius,skeletonJoint:'upperArm.L',skeletonPoint:[...point]};
 torso.position.copy(ball.position).sub(new T.Vector3(...torsoMold.center));upperArm.position.copy(ball.position).sub(new T.Vector3(...armMold.center));
 const restEuler=[bone.rest.x,bone.rest.y,bone.rest.z].map(T.MathUtils.degToRad),restQuaternion=new T.Quaternion().setFromEuler(new T.Euler(...restEuler,'XYZ'));
 const overlap=measureRestOverlap(torso,upperArm,ball,restQuaternion,clearance);
 const group=new T.Group();group.name='one-shoulder-appearance-draft';group.add(torso,ball,upperArm);group.updateMatrixWorld(true);
 const seated=[torso.position.clone(),upperArm.position.clone()];
 const torsoShift=ball.position.x-radius-SHOULDER_DESIGN.gap-(torso.position.x+torso.geometry.boundingBox.max.x),armShift=ball.position.y-radius-SHOULDER_DESIGN.gap-(upperArm.position.y+upperArm.geometry.boundingBox.max.y);
 function separate(exploded=true){torso.position.copy(seated[0]);upperArm.position.copy(seated[1]);upperArm.quaternion.identity();if(exploded){torso.position.x+=torsoShift;upperArm.position.y+=armShift;}group.updateMatrixWorld(true);}
 function inspectRest(){separate(false);upperArm.quaternion.copy(restQuaternion);upperArm.position.copy(ball.position).sub(new T.Vector3(...armMold.center).applyQuaternion(restQuaternion));group.updateMatrixWorld(true);}
 separate();return {group,torso,ball,upperArm,radius,diameter,source,separate,inspectRest,restEuler,clearance,overlap};
}
