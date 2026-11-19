import * as T from 'three';
import {createCharacterRig} from '../reference/PlayerModel.ts';
import {createFootStudy} from '../../../foot-lab/src/foot-study.js';
import {SIDE} from '../../../motion-core/skeleton/bones.js';
import {createElbowDesign} from './elbow-design.js';
import {refineMoldSurface} from '../../../foot-lab/src/refine-mold-surface.js';

// Private appearance draft. The existing shin.L pivot is the source of truth.
// The knee bends backward (+X), so the softer, lower lips face -Z.
export const KNEE_DESIGN=Object.freeze({diameterRatio:.9,capture:.16,elbowReferenceRadius:.09072679281234741});

function disposeUnused(root,kept){
 const geometries=new Set(),materials=new Set();
 root.traverse(p=>{if(p.isMesh){if(p.geometry!==kept.geometry)geometries.add(p.geometry);if(p.material!==kept.material)materials.add(p.material);}});
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
}

export function createKneeBase(){
 const reference=createCharacterRig({plain:true}),original=reference.hipRight.children.find(p=>p.isMesh);
 const thigh=new T.Mesh(original.geometry.clone(),original.material.clone());
 thigh.quaternion.copy(original.quaternion);thigh.scale.copy(original.scale);thigh.name='original-thigh';
 disposeUnused(reference.root,thigh);
 const ankle=createFootStudy({ball:true,calfSocket:true,seatCalf:true}),calf=ankle.calf;
 calf.removeFromParent();disposeUnused(ankle.group,calf);calf.name='approved-ankle-calf';
 const widths=[thigh,calf].flatMap(part=>{part.geometry.computeBoundingBox();const size=part.geometry.boundingBox.getSize(new T.Vector3()).multiply(part.scale);return [size.x,size.z];});
 const diameter=Math.min(...widths)*KNEE_DESIGN.diameterRatio,radius=diameter/2;
 const joint=SIDE.find(b=>b.name==='shin'),ball=new T.Mesh(new T.SphereGeometry(radius,64,48),calf.material);
 ball.name='knee-ball';ball.position.fromArray(joint.head);
 ball.userData={radius,diameter,diameterRatio:KNEE_DESIGN.diameterRatio,skeletonJoint:'shin.L',skeletonPoint:[...joint.head]};
 thigh.position.set(0,0,0);calf.position.set(0,0,0);
 const group=new T.Group();group.add(thigh,calf,ball);return {group,thigh,calf,ball,radius,diameter};
}

// Exact half-turn: positive determinant, no sine/cosine rounding, no bone edits.
function turnArray(array){for(let i=0;i<array.length;i+=3){array[i]=-array[i];array[i+2]=-array[i+2];}}
function turnGeometry(g){for(const name of ['position','normal']){turnArray(g.attributes[name].array);g.attributes[name].needsUpdate=true;}g.computeBoundingBox();}

// The original 14-sided leg caps are intentionally simple. Subdivision alone
// retains their polygon edges, which creates a scalloped socket lip. Round only
// the knee-facing cap to its authored hemisphere before pressing the ball.
// The shaft and the entire approved ankle end remain in their original frame.
function roundKneeCap(part,upper){
 const g=part.geometry,R=upper ? .148 : .115,join=upper ? -.1 : .09;
 const originalNormals=g.attributes.normal.array.slice();
 const flip=()=>{for(const name of ['position','normal']){const a=g.attributes[name].array;for(let i=0;i<a.length;i+=3){a[i+1]=-a[i+1];a[i+2]=-a[i+2];}}};
 if(upper)flip();
 refineMoldSurface(g,0,0,{passes:6,minY:Math.abs(join),preserveNormals:true,maxEdgeLength3D:.003});
 if(upper)flip();
 const p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  const y=p.getY(i),distance=(upper?-1:1)*(y-join);
  if(distance<=0){if(3*i<originalNormals.length)n.setXYZ(i,...originalNormals.subarray(3*i,3*i+3));continue;}
  const radial=Math.hypot(p.getX(i),p.getZ(i));if(radial<1e-10)continue;
  const target=Math.sqrt(Math.max(0,R*R-distance*distance)),x=p.getX(i)*target/radial,z=p.getZ(i)*target/radial;
  p.setXYZ(i,x,y,z);const v=new T.Vector3(x,y-join,z).normalize();n.setXYZ(i,v.x,v.y,v.z);
 }
 g.computeBoundingBox();g.computeBoundingSphere();
}

export function createKneeDesign({base=createKneeBase()}={}){
 const {group,thigh,calf,ball,radius}=base,modelScale=radius/KNEE_DESIGN.elbowReferenceRadius;
 const ankleMetadata=calf.geometry.userData,source={};
 for(const [name,part] of [['thigh',thigh],['calf',calf]]){
  source[name]={positions:part.geometry.attributes.position.array.slice(),normals:part.geometry.attributes.normal.array.slice()};
  roundKneeCap(part,name==='thigh');
  turnGeometry(part.geometry);
 }
 // Adapt the checked elbow molding in a local frame, then return the geometry
 // to avatar space. Shared defaults remain identical for the approved elbow.
 const result=createElbowDesign({base:{group,upperArm:thigh,forearm:calf,ball,radius,diameter:base.diameter},
  settings:{capture:KNEE_DESIGN.capture,insideRelief:.055*modelScale,filletRadius:.005*modelScale},
  capLengths:[.148,.13],refinementPasses:[4,4],normalTransfer:[true,false],modelScale});
 const flip=new T.Matrix4().makeScale(-1,1,-1),innerEdgeReports={},smoothingReports={};
 for(const [name,alias] of [['thigh','upperArm'],['calf','forearm']]){
  const part=base[name],g=part.geometry;turnGeometry(g);
  const m=g.userData.elbowMold;
  m.center=[m.center[0]===0?0:-m.center[0],m.center[1],m.center[2]===0?0:-m.center[2]];
  m.toMold=new T.Matrix4().fromArray(m.toMold).multiply(flip).toArray();
  g.userData.kneeMold=m;delete g.userData.elbowMold;
  for(const [from,to] of [['elbowDesign','kneeDesign'],['elbowInnerEdge','kneeInnerEdge'],['elbowSmoothing','kneeSmoothing']]){part.userData[to]=part.userData[from];delete part.userData[from];}
  for(const [reports,target] of [[result.innerEdgeReports,innerEdgeReports],[result.smoothingReports,smoothingReports]]){
   const report=reports[alias];turnArray(report.beforePositions);turnArray(report.beforeNormals);target[name]=report;
  }
  g.computeBoundingSphere();
 }
 // The lower calf's independently approved ankle metadata stays in its original
 // frame. No remolding or second application of its shape takes place here.
 for(const name of ['moldRestPositions','moldContactIndices','filletContacts','filletSections']){
  if(ankleMetadata[name])calf.geometry.userData[name]=ankleMetadata[name];
 }
 group.name='knee-socket-appearance-draft';group.updateMatrixWorld(true);
 return {...base,modelScale,source,innerEdgeReports,smoothingReports};
}
