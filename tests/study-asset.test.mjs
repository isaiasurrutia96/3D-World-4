import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import * as T from 'three';
import {encodeStudyAsset,verifyStudyAsset} from '../scripts/bake-study.mjs';
import {decodeStudyAsset} from '../src/study-asset.js';

test('Saved study bytes preserve geometry, transforms, metadata and shared materials exactly',()=>{
 const material=new T.MeshStandardMaterial({color:'#b9b2a6',roughness:.78}),group=new T.Group();
 const study={group,diameter:.18145358562469482,radius:.09072679281234741};
 for(const [i,key] of ['forearm','hand','ball'].entries()){
  const part=new T.Mesh(new T.SphereGeometry(.1,12,8),i===1?material.clone():material);
  part.name=key;part.position.set(.4088,i/3,.1284);part.rotation.z=.13;part.scale.setScalar(1.113);
  part.geometry.userData={wristMold:{depthFraction:1/7,sourcePositions:new Float32Array([.1,.2,.3])}};
  part.geometry.computeBoundingBox();part.geometry.computeBoundingSphere();group.add(part);study[key]=part;
 }
 group.updateMatrixWorld(true);const bytes=encodeStudyAsset(study);verifyStudyAsset(study,bytes);
 assert.deepEqual(encodeStudyAsset(study),bytes,'Asset hashes remain stable across builds');
});
test('Unsupported versions and corrupt compressed assets fail instead of displaying the wrong geometry',()=>{
 assert.throws(()=>decodeStudyAsset(gzipSync('{"version":2}')),/version/);
 assert.throws(()=>decodeStudyAsset(new Uint8Array([1,2,3])));
});
