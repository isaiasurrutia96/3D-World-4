import * as T from 'three';
import {createAssembledAvatar} from '../../../avatar-lab/src/avatar.js';
import {createKneeDesign} from './knee-design.js';
import {SIDE} from '../../../motion-core/skeleton/bones.js';
import {moldWristSocket} from '../../../wrist-lab/src/mold-socket.js';
import {refineMoldSurface} from '../../../foot-lab/src/refine-mold-surface.js';
import {refineMoldedCup} from './refine-molded-cup.js';

// Private, static appearance study. No live avatar, bones or motion are edited.
export const HIP_DESIGN=Object.freeze({diameterRatio:.9,thighTopRadius:.128,capture:.30,filletRadius:.008,gap:.055});

function dispose(root,keep=[]){
 const geometries=new Set(),materials=new Set();root.traverse(p=>{if(p.isMesh){if(!keep.some(k=>k.geometry===p.geometry))geometries.add(p.geometry);if(!keep.some(k=>k.material===p.material))materials.add(p.material);}});
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
}

function torsoHalf(){
 const avatar=createAssembledAvatar({torsoSplit:false});avatar.rig.root.updateMatrixWorld(true);
 const original=avatar.rig.torso.children.find(p=>p.name==='socket-torso'),g=original.geometry.clone(),material=original.material.clone();
 const p=g.attributes.position,n=g.attributes.normal,oldNormals=n.array.slice(),rows=g.parameters.points.length,columns=g.parameters.segments+1;
 if(columns!==161||p.count!==columns*rows)throw Error('Unexpected source torso layout');
 // Start fresh only at the old Gaussian hip recesses; retain the actual
 // avatar's broad torso, shoulders and central lower silhouette.
 for(let i=0;i<p.count;i++)if(g.parameters.points[i%rows].y<.015)p.setY(i,g.parameters.points[i%rows].y);
 g.computeVertexNormals();for(let i=0;i<p.count;i++)if(g.parameters.points[i%rows].y>=.015)n.setXYZ(i,...oldNormals.subarray(i*3,i*3+3));
 g.applyMatrix4(original.matrixWorld);
 const half=new T.BufferGeometry(),count=81*rows,positions=p.array.slice(0,count*3),normals=n.array.slice(0,count*3);
 for(const column of [0,80])for(let row=0;row<rows;row++){const i=column*rows+row;positions[3*i]=0;normals[3*i]=0;}
 const index=[];for(let i=0;i<g.index.count;i+=3){const f=Array.from(g.index.array.subarray(i,i+3));if(f.every(v=>v<count))index.push(...f);}
 half.setAttribute('position',new T.BufferAttribute(positions,3));half.setAttribute('normal',new T.BufferAttribute(normals,3));half.setIndex(index);half.computeBoundingBox();
 const mesh=new T.Mesh(half,material);mesh.name='actual-torso-right-half';
 dispose(avatar.rig.root);g.dispose();return mesh;
}

function roundThighTop(part){
 const g=part.geometry,oldNormals=g.attributes.normal.array.slice();
 refineMoldSurface(g,0,0,{passes:6,minY:.1,preserveNormals:true,maxEdgeLength3D:.003});
 const p=g.attributes.position,n=g.attributes.normal,R=HIP_DESIGN.thighTopRadius;
 for(let i=0;i<p.count;i++){
  const y=p.getY(i)-.1;
  if(y<=0){if(3*i<oldNormals.length)n.setXYZ(i,...oldNormals.subarray(3*i,3*i+3));continue;}
  const r=Math.hypot(p.getX(i),p.getZ(i));if(r<1e-10)continue;
  const desired=Math.sqrt(Math.max(0,R*R-y*y)),x=p.getX(i)*desired/r,z=p.getZ(i)*desired/r;
  p.setXYZ(i,x,y+.1,z);const v=new T.Vector3(x,y,z).normalize();n.setXYZ(i,v.x,v.y,v.z);
 }
 g.computeBoundingBox();g.computeBoundingSphere();
}


function mirrorMold(m){
 const F=new T.Matrix4().makeScale(-1,1,1);
 return {...m,center:[m.center[0]===0?0:-m.center[0],m.center[1],m.center[2]],toMold:new T.Matrix4().fromArray(m.toMold).multiply(F).toArray()};
}

function mirrorGeometry(g){
 const clone=g.clone();clone.userData=structuredClone(g.userData);
 for(const key of ['position','normal']){const a=clone.attributes[key].array;for(let i=0;i<a.length;i+=3)a[i]=-a[i];}
 const I=clone.index.array;for(let i=0;i<I.length;i+=3)[I[i+1],I[i+2]]=[I[i+2],I[i+1]];
 for(const key of ['hipMold','kneeMold'])if(g.userData[key])clone.userData[key]=mirrorMold(g.userData[key]);
 clone.computeBoundingBox();clone.computeBoundingSphere();return clone;
}

// Join the mirrored half at its original center seam. As with the source
// lathe, coincident seam/pole samples retain their authored normal values.
// Welding those attributes would change the accepted upper torso's shading.
// One sculpt, one reflection; no second solve can introduce differences.
function joinTorso(half,mold){
 const p=half.attributes.position,n=half.attributes.normal,I=half.index.array,positions=[],normals=[],index=[],maps=[];
 for(const side of [1,-1]){
  const ids=[],keys=[];
  for(let i=0;i<p.count;i++){
   const v=[side*p.getX(i),p.getY(i),p.getZ(i)],key=v.map(x=>Math.round(x/1e-7)).join(',');
   ids.push(positions.length/3);keys.push(key);positions.push(...v);normals.push(side*n.getX(i),n.getY(i),n.getZ(i));
  }
  for(let i=0;i<I.length;i+=3){const old=Array.from(I.subarray(i,i+3));if(new Set(old.map(j=>keys[j])).size<3)continue;const f=old.map(j=>ids[j]);if(side<0)[f[1],f[2]]=[f[2],f[1]];index.push(...f);}
  maps.push(ids);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(index);
 const remap=(m,ids)=>({...m,core:m.core.map(i=>ids[i]),rim:m.rim.map(([i,...rest])=>[ids[i],...rest])});
 geometry.userData.hipMolds={L:remap(mold,maps[0]),R:remap(mirrorMold(mold),maps[1])};geometry.computeBoundingBox();geometry.computeBoundingSphere();return {geometry,maps};
}

export function createHipDesign(){
 const half=torsoHalf(),radius=HIP_DESIGN.thighTopRadius*HIP_DESIGN.diameterRatio,diameter=radius*2;
 const joint=SIDE.find(b=>b.name==='thigh'),knee=createKneeDesign(),thigh=knee.thigh;
 thigh.removeFromParent();dispose(knee.group,[thigh]);thigh.name='right-upper-leg';thigh.position.set(0,0,0);
 const source={torso:{positions:half.geometry.attributes.position.array.slice(),normals:half.geometry.attributes.normal.array.slice()},thigh:{positions:thigh.geometry.attributes.position.array.slice(),normals:thigh.geometry.attributes.normal.array.slice(),kneeMold:thigh.geometry.userData.kneeMold}};
 roundThighTop(thigh);
 const hip={radius,depthFraction:HIP_DESIGN.capture,filletRadius:HIP_DESIGN.filletRadius};
 const torsoSurface=half.geometry.clone();
 const torsoMold=moldWristSocket(half,{...hip,underside:true,centerXZ:[joint.head[0],-joint.head[2]]});
 refineMoldedCup(half,torsoMold,torsoSurface);torsoSurface.dispose();
 const thighMold=moldWristSocket(thigh,{...hip,centerXZ:[0,0]});
 thigh.geometry.userData.hipMold=thighMold;delete thigh.geometry.userData.wristMold;
 const joined=joinTorso(half.geometry,torsoMold),torso=new T.Mesh(joined.geometry,half.material);torso.name='actual-avatar-torso';half.geometry.dispose();
 const otherThigh=new T.Mesh(mirrorGeometry(thigh.geometry),thigh.material);otherThigh.name='mirrored-upper-leg';
 const ballGeometry=new T.SphereGeometry(radius,64,48),ballL=new T.Mesh(ballGeometry,thigh.material),ballR=new T.Mesh(ballGeometry,thigh.material);
 ballL.name='hip-ball-L';ballR.name='hip-ball-R';ballL.position.fromArray(joint.head);ballR.position.set(-joint.head[0],joint.head[1],joint.head[2]);
 for(const [ball,side] of [[ballL,'L'],[ballR,'R']])ball.userData={radius,skeletonJoint:'thigh.'+side,skeletonPoint:ball.position.toArray()};
 torso.position.set(0,ballL.position.y-torsoMold.center[1],0);
 thigh.position.copy(ballL.position).sub(new T.Vector3(...thighMold.center));otherThigh.position.copy(ballR.position).sub(new T.Vector3(...otherThigh.geometry.userData.hipMold.center));
 const group=new T.Group();group.name='separated-hip-appearance-draft';group.add(torso,ballL,ballR,thigh,otherThigh);group.updateMatrixWorld(true);
 const seated=[torso,thigh,otherThigh].map(p=>p.position.clone());
 const torsoLift=ballL.position.y+radius+HIP_DESIGN.gap-(torso.position.y+torso.geometry.boundingBox.min.y);
 const thighDrop=ballL.position.y-radius-HIP_DESIGN.gap-(thigh.position.y+thigh.geometry.boundingBox.max.y);
 function separate(exploded=true){torso.position.copy(seated[0]);thigh.position.copy(seated[1]);otherThigh.position.copy(seated[2]);if(exploded){torso.position.y+=torsoLift;thigh.position.y+=thighDrop;otherThigh.position.y+=thighDrop;}group.updateMatrixWorld(true);}
 separate();return {group,torso,ballL,ballR,thighL:thigh,thighR:otherThigh,radius,diameter,source,mirrorMaps:joined.maps,separate};
}
