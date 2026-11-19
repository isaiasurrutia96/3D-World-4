import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serialize,deserialize} from 'node:v8';
import * as T from 'three';
import {decodeStudyAsset,studyAssetReady} from '../src/study-asset.js';
import {createSkinField} from '../avatar/src/skin/field.js';
import {extractSurface} from '../avatar/src/skin/surface.js';
import {bindSurfaceWeights} from '../avatar/src/skin/weights.js';
import {optimizeSkin,inspectTopology} from '../avatar/src/skin/optimize.js';
import {repairSkin} from '../avatar/src/skin/repair.js';
import {graftHands} from '../avatar/src/skin/hands.js';
import {encodeStudyAsset,verifyStudyAsset} from './bake-study.mjs';
const original=JSON.parse(await readFile('avatar/assembled-joints/manifest.json'));
await studyAssetReady;const bytes=await readFile('avatar/assembled-joints/'+original.asset);
assert.equal(createHash('sha256').update(bytes).digest('hex'),original.sha256);
console.log('Building continuous skin from the original approved hand/foot surfaces.');
const reference=decodeStudyAsset(bytes),field=createSkinField(reference);
console.log(JSON.stringify({source:field.referenceStats}));
const sourceFiles=['avatar/src/skin/field.js','avatar/src/skin/mesh-distance.js','avatar/src/skin/surface.js','motion-core/skeleton/bones.js','motion-core/skeleton/skeleton.js','avatar/src/joints/ankle-contract.js'];
const signature=createHash('sha256');signature.update(original.sha256);for(const file of sourceFiles)signature.update(await readFile(file));const fingerprint=signature.digest('hex');
await mkdir('/tmp/avatar-skin',{recursive:true});const cache='/tmp/avatar-skin/surface.bin';let surface;
if(process.argv.includes('--cached')){
 const saved=deserialize(await readFile(cache));assert.equal(saved.fingerprint,fingerprint,'Authoring inputs changed; build fresh');
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(saved.position,3));geometry.setAttribute('normal',new T.BufferAttribute(saved.normal,3));geometry.setIndex(new T.BufferAttribute(saved.index,1));surface={geometry,stats:saved.stats};
}else{
 surface=extractSurface(field,{onProgress:progress=>console.log(JSON.stringify(progress))});
 await writeFile(cache,serialize({fingerprint,stats:surface.stats,position:surface.geometry.attributes.position.array,normal:surface.geometry.attributes.normal.array,index:surface.geometry.index.array}));
}
console.log('Optimizing one side with locked centre border.');const optimized=await optimizeSkin(surface.geometry);surface.geometry.dispose();const cleanups=[];let topology;
for(let pass=0;pass<5;pass++){const r=repairSkin(optimized.geometry);optimized.geometry.dispose();optimized.geometry=r.geometry;cleanups.push(r.report);topology=inspectTopology(optimized.geometry);console.log(JSON.stringify({pass,topology,cleanup:r.report}));if(topology.components===1&&topology.nonManifold===0&&topology.boundary===0)break;}
console.log(JSON.stringify({topology,optimization:optimized.report}));
assert(topology.finite&&topology.components===1&&topology.boundary===0&&topology.nonManifold===0&&topology.windingErrors===0&&topology.euler===2&&topology.volume>0&&topology.minArea>1e-16,'Skin must be one closed, outward-wound solid');
console.log('Connecting the original hand surfaces.');const hands=await graftHands(optimized.geometry,reference,field.skeleton);optimized.geometry=hands.geometry;topology=inspectTopology(optimized.geometry);console.log(JSON.stringify({hands:hands.report,topology}));
assert(topology.components===1&&topology.boundary===0&&topology.nonManifold===0&&topology.windingErrors===0&&topology.euler===2&&topology.minArea>1e-22,'Hand seams must be closed and consistently wound');
console.log('Binding the unchanged skeleton.');bindSurfaceWeights(optimized.geometry,field);
const mesh=new T.Mesh(optimized.geometry,new T.MeshStandardMaterial({color:'#b9b2a6',roughness:.86,metalness:0}));mesh.name='continuous-skin';
const group=new T.Group();group.name='continuous-avatar';group.add(mesh);group.updateMatrixWorld(true);
const study={group,skin:mesh},packed=encodeStudyAsset(study);verifyStudyAsset(study,packed);
const sha256=createHash('sha256').update(packed).digest('hex'),asset='skin-'+sha256.slice(0,16)+'.json.gz',dir='avatar/continuous-skin';await mkdir(dir,{recursive:true});
await writeFile(dir+'/'+asset,packed);
const manifest={version:'arcade-skin-2026-11-19',asset,sha256,bytes:packed.length,parts:1,joints:12,grid:surface.stats,topology,optimization:optimized.report,hands:hands.report,cleanup:cleanups,sourceJointedSHA256:original.sha256,authoringFingerprint:fingerprint,concept:'exec-018298f1-9838-4f3c-aab7-d666262975b8.png',binding:'dual-quaternion',animationOwner:'Claude'};
await writeFile(dir+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest));
