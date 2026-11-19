import * as T from 'three';
import {createSkeleton} from '../../../motion-core/skeleton/skeleton.js';
import {meshFromRecord} from './source-record.js';
import {fitLimb,placeSocket,reflectMesh,point} from './fit.js';
import {symmetricTorso,fitTorso,splitAtExistingSeam} from './torso.js';

const compactSocket=(m,bone)=>({bone,center:[...m.center],radius:m.ballRadius,filletRadius:m.filletRadius,core:[...m.core],rim:m.rim.map(([i])=>i)});
const reflectedSocket=m=>({...m,bone:m.bone.replace('.L','.R'),center:[m.center[0]===0?0:-m.center[0],m.center[1],m.center[2]]});

/** Build checked rest geometry. The skeleton supplies ALL final joint points. */
export function buildJointAssembly(sources,baseline){
 const skeleton=createSkeleton(),head=name=>skeleton.bones[skeleton.index.get(name)].head,group=new T.Group(),study={group},reports={limbs:{},protected:{}},sourceMeshes={};group.name='assembled-approved-joints';
 const read=(key,name)=>sourceMeshes[name]=meshFromRecord(sources[key],name),restQ=label=>{const q=new T.Quaternion();new T.Matrix4().fromArray(baseline[label].matrix).decompose(new T.Vector3(),q,new T.Vector3());return q;};
 const attach=(mesh,bone,sockets=[])=>{const authoring=/^(hand|foot)\./.test(mesh.name)?{...mesh.userData,reflected:mesh.name.endsWith('.R')}:null;mesh.userData={assembly:{bone,sockets},...(authoring?{authoring}: {})};mesh.geometry.userData={};mesh.updateMatrix();group.add(mesh);study[mesh.name.replaceAll('-','_').replaceAll('.','_')]=mesh;return mesh;};
 for(const [source,label,a,b,bone,child]of [
  ['shoulder.upperArm','upper-arm.L','shoulderMold','elbowMold','upperArm.L','lowerArm.L'],
  ['elbow.forearm','forearm.L','elbowMold','wristMold','lowerArm.L','hand.L'],
  ['hip.thighL','thigh.L','hipMold','kneeMold','thigh.L','shin.L'],
  ['knee.calf','calf.L','kneeMold','ankleMold','shin.L','foot.L']
 ]){
  const mesh=read(source,label),d=mesh.geometry.userData;if(b==='ankleMold')d.ankleMold={...mesh.userData.socketMold,core:d.moldContactIndices,rim:d.filletContacts};
  const r=fitLimb(mesh,d[a],d[b],head(bone),head(child),restQ(label));reports.limbs[label]=r;
  const sockets=[compactSocket(r.proximal,bone),compactSocket(r.distal,child)],mirror=reflectMesh(mesh);mirror.name=label.replace('.L','.R');
  attach(mesh,bone,sockets);attach(mirror,bone.replace('.L','.R'),sockets.map(reflectedSocket));
 }
 for(const [source,label,bone,mold]of [['wrist.hand','hand.L','hand.L','wristMold'],['ankle.foot','foot.L','foot.L',null]]){
  const mesh=read(source,label),d=mold?mesh.geometry.userData[mold]:{...mesh.userData.socketMold,core:mesh.geometry.userData.moldContactIndices,rim:mesh.geometry.userData.filletContacts},binding=mesh.geometry.userData.labBind;
  placeSocket(mesh,d.center,head(bone),restQ(label));const socket=compactSocket(d,bone),mirror=reflectMesh(mesh);mirror.name=label.replace('.L','.R');mirror.userData=structuredClone(mesh.userData);
  attach(mesh,bone,[socket]);attach(mirror,bone.replace('.L','.R'),[reflectedSocket(socket)]);
  if(binding){mesh.geometry.userData.labBind=binding;mirror.geometry.userData.labBind=structuredClone(binding);}
 }
 // Both torso sides come from the one approved shoulder, over the approved hips.
 const sourceTorso=read('shoulder.torso','source-torso'),symmetric=symmetricTorso(sourceTorso),bodyFit=fitTorso(symmetric.geometry,symmetric.sockets,skeleton);
 const oldChest=meshFromRecord(baseline.chest,'original-chest'),oldPelvis=meshFromRecord(baseline.pelvis,'original-pelvis');oldChest.userData.restMatrix=baseline.chest.matrix;oldPelvis.userData.restMatrix=baseline.pelvis.matrix;
 const body=splitAtExistingSeam(symmetric.geometry,oldChest,oldPelvis);reports.torso={...bodyFit,parts:body};
 for(const [name,bone]of [['chest','spine'],['pelvis','pelvis']]){
  const part=body[name],mesh=new T.Mesh(part.geometry,sourceTorso.material);mesh.name=name;const sockets=[];
  for(const [joint,m]of Object.entries(symmetric.sockets)){if((name==='chest')!==joint.startsWith('upperArm'))continue;const remapped={...m,core:m.core.map(i=>part.sourceMap.get(i)),rim:m.rim.map(([i,...v])=>[part.sourceMap.get(i),...v])};if([...remapped.core,...remapped.rim.map(([i])=>i)].some(i=>i===undefined))throw Error(name+' lost joint contacts');sockets.push(compactSocket(remapped,joint));}
  attach(mesh,bone,sockets);
 }
 for(const name of ['neck','head']){const mesh=meshFromRecord(baseline[name],name);new T.Matrix4().fromArray(baseline[name].matrix).decompose(mesh.position,mesh.quaternion,mesh.scale);attach(mesh,name);reports.protected[name]=baseline[name];}
 // Exactly one separate ball for each of the twelve existing limb pivots.
 for(const [source,bone]of [['shoulder.ball','upperArm.L'],['elbow.ball','lowerArm.L'],['wrist.ball','hand.L'],['hip.ballL','thigh.L'],['knee.ball','shin.L'],['ankle.ankleBall','foot.L']]){
  const r=sources[source],radius=r.userData.radius;
  for(const side of ['L','R']){const joint=bone.replace('.L','.'+side),ball=meshFromRecord(r,'ball-'+joint);ball.position.fromArray(head(joint));ball.quaternion.identity();ball.scale.set(1,1,1);attach(ball,joint);ball.userData.assembly.ball={bone:joint,radius};}
 }
 group.updateMatrixWorld(true);return {...study,skeleton,reports,sourceMeshes};
}
