import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {decodeStudyAsset,studyAssetReady} from '../../src/study-asset.js';
import {bindOfficialAvatar,OFFICIAL_AVATAR} from '../../avatar/src/official-avatar.js';
import {CENTRE,SIDE,FINGERS} from '../../motion-core/skeleton/bones.js';

const bonesBefore=JSON.stringify({CENTRE,SIDE,FINGERS});
const bytes=await readFile(new URL('../../avatar/assembled-joints/'+OFFICIAL_AVATAR.asset,import.meta.url));
await studyAssetReady;
const study=decodeStudyAsset(bytes),avatar=bindOfficialAvatar(study);

test('The live model is exactly the owner-approved release, not the rejected experiment',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),OFFICIAL_AVATAR.sha256);
 assert.equal(bytes.length,OFFICIAL_AVATAR.bytes);
 assert.equal(avatar.version,'approved-joints-2026-11-19');
 assert.equal(avatar.attached.length,28);
 assert.equal(avatar.attached.filter(p=>p.ball).length,12);
 assert.equal(avatar.attached.flatMap(p=>p.sockets).length,24);
 assert.deepEqual(avatar.capabilities,{bodyPose:true,softChest:true,fingerSkin:false,toeSkin:false});
});

test('Bad joint counts, duplicate parts and displaced or invalid socket/ball data are rejected',()=>{
 const group=study.group,part=group.children[0],ball=group.children.find(p=>p.userData.assembly.ball),cup=part.userData.assembly.sockets[0];
 const removed=group.children.pop();assert.throws(()=>bindOfficialAvatar(study),/28/);group.children.push(removed);
 const name=part.name;part.name=group.children[1].name;assert.throws(()=>bindOfficialAvatar(study),/Invalid assembled part/);part.name=name;
 const x=ball.position.x;ball.position.x+=.002;assert.throws(()=>bindOfficialAvatar(study),/off its skeleton point/);ball.position.x=x;
 const center=cup.center[0];cup.center[0]+=.002;assert.throws(()=>bindOfficialAvatar(study),/off its skeleton point/);cup.center[0]=center;
 const radius=cup.radius;cup.radius=NaN;assert.throws(()=>bindOfficialAvatar(study),/Invalid socket/);cup.radius=radius;
 // Restore the valid rest matrices after the deliberate corruption checks.
 avatar.apply({});
});

test('The approved soft chest remains smooth, returns exactly, and retains shoulder contact within 1 mm',()=>{
 const chest=avatar.attached.find(a=>a.label==='chest'),P=chest.mesh.geometry.attributes.position,N=chest.mesh.geometry.attributes.normal;
 const original=P.array.slice(),originalNormals=N.array.slice(),rest=avatar.attached.map(p=>p.mesh.matrix.toArray());
 let error=0;const point=new T.Vector3(),originalPoint=new T.Vector3();
 for(const pose of [{chest:{x:15,y:15,z:0}},{'clavicle.L':{y:4,z:4}},{chest:{x:15,y:-15},'clavicle.L':{y:-4,z:4}}]){
  avatar.apply(pose);
  for(const cup of chest.sockets){
   const center=avatar.solved.get(cup.bone).head,restCenter=new T.Vector3(...cup.center).applyMatrix4(chest.rest);
   for(const i of cup.core){
    const before=originalPoint.fromArray(original,3*i).applyMatrix4(chest.rest).distanceTo(restCenter);
    const after=point.fromBufferAttribute(P,i).applyMatrix4(chest.mesh.matrix).distanceTo(center);
    error=Math.max(error,Math.abs(after-before));
   }
  }
  for(const p of avatar.attached.filter(p=>p.ball))assert(new T.Vector3().setFromMatrixPosition(p.mesh.matrixWorld).distanceTo(avatar.solved.get(p.bone).head)<1e-12);
  assert(chest.firmMatrix.elements.every(Number.isFinite));
  assert(chest.shoulderMatrix.every(m=>m.elements.every(Number.isFinite)));
 }
 assert(error<.001,`Soft-chest contact variation ${error} m`);
 avatar.apply({});assert.deepEqual(P.array,original);assert.deepEqual(N.array,originalNormals);
 assert.deepEqual(avatar.attached.map(p=>p.mesh.matrix.toArray()),rest);
 assert.equal(JSON.stringify({CENTRE,SIDE,FINGERS}),bonesBefore);
 console.log({maximumExistingSoftChestContactVariationMM:error*1000});
});

test('Disposal releases each owned geometry/material once and can safely repeat',()=>{
 const geometries=new Set(avatar.attached.map(p=>p.mesh.geometry)),materials=new Set(avatar.attached.map(p=>p.mesh.material));
 let ng=0,nm=0;for(const g of geometries)g.addEventListener('dispose',()=>ng++);for(const m of materials)m.addEventListener('dispose',()=>nm++);
 avatar.dispose();avatar.dispose();assert.equal(ng,geometries.size);assert.equal(nm,materials.size);
});
