import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';import * as T from'three';
import{decodeStudyAsset,studyAssetReady}from'../../src/study-asset.js';
import{bindOfficialAvatar,OFFICIAL_AVATAR}from'../../avatar/src/official-avatar.js';
import{inspectTopology}from'../../avatar/src/skin/optimize.js';
import{CENTRE,SIDE,FINGERS}from'../../motion-core/skeleton/bones.js';
const before=JSON.stringify({CENTRE,SIDE,FINGERS}),manifest=JSON.parse(await readFile('avatar/continuous-skin/manifest.json')),bytes=await readFile('avatar/continuous-skin/'+manifest.asset);await studyAssetReady;
const study=decodeStudyAsset(bytes),a=bindOfficialAvatar(study),g=a.skin.geometry,P=g.attributes.position,N=g.attributes.normal;
test('Official skin is the pinned approved release and one closed outward-wound connected solid',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),OFFICIAL_AVATAR.sha256);assert.equal(a.version,'arcade-skin-2026-11-19');
 const report=inspectTopology(g);assert.equal(report.components,1);assert.equal(report.boundary,0);assert.equal(report.nonManifold,0);assert.equal(report.windingErrors,0);assert.equal(report.euler,2);assert(report.volume>0&&report.minArea>1e-22&&report.finite);console.log({topology:report});
 const meshes=[];a.root.traverse(o=>{if(o.isMesh)meshes.push(o);});assert.equal(meshes.length,1);assert(a.skin.isSkinnedMesh);assert.equal(a.jointNames.length,12);assert.equal(a.capabilities.fingerSkin,false);
 g.computeBoundingBox();assert(Math.abs(g.boundingBox.min.y)<1e-6);assert(Math.abs(g.boundingBox.max.y-1.8945)<1e-5);
});
test('Every skin vertex has four finite normalized binding slots and every pivot is unchanged',()=>{
 const I=g.attributes.skinIndex.array,W=g.attributes.skinWeight.array;for(let i=0;i<P.count;i++){let sum=0;for(let k=0;k<4;k++){const j=4*i+k;assert(I[j]<a.skeleton.bones.length);assert(Number.isFinite(W[j])&&W[j]>=0&&W[j]<=1);sum+=W[j];}assert(Math.abs(sum-1)<2e-6);}
 assert.equal(JSON.stringify(g.userData.skin.jointHeads),JSON.stringify(a.skeleton.bones.map(b=>b.head)));assert.equal(JSON.stringify({CENTRE,SIDE,FINGERS}),before);
});
test('Corrupt weights and mismatched skeleton anchors are rejected before drawing',()=>{
 const w=g.attributes.skinWeight.array,old=w[0];w[0]=NaN;assert.throws(()=>bindOfficialAvatar(study),/Invalid skin binding/);w[0]=old;
 const heads=g.userData.skin.jointHeads,oldHead=heads[0][0];heads[0][0]+=.01;assert.throws(()=>bindOfficialAvatar(study),/joint mismatch/);heads[0][0]=oldHead;
});
test('Retained original hand vertices keep their exact authored positions and finger arrangement',async()=>{
 const m=JSON.parse(await readFile('avatar/assembled-joints/manifest.json')),ref=decodeStudyAsset(await readFile('avatar/assembled-joints/'+m.asset)),hands=Object.fromEntries(['L','R'].map(s=>[s,ref.group.children.find(p=>p.name==='hand.'+s)]));
 const source=g.attributes.handSourceIndex.array,v=new T.Vector3(),q=new T.Vector3();let count=0,error=0;
 for(let i=0;i<P.count;i++)if(source[i]>=0){const hand=hands[P.getX(i)>=0?'L':'R'];q.fromBufferAttribute(hand.geometry.attributes.position,source[i]).applyMatrix4(hand.matrixWorld);v.fromBufferAttribute(P,i);error=Math.max(error,v.distanceTo(q));count++;}
 assert(count>100000);assert(error<2e-7);console.log({unchangedHandVertices:count,maximumPositionRoundingMeters:error});
});
test('Existing poses keep graphics joint centres on skeleton dots, produce finite surfaces, and reset exactly',()=>{
 const pos=P.array.slice(),norm=N.array.slice(),v=new T.Vector3();let error=0;
 for(const pose of [{'lowerArm.L':{x:-150},'hand.R':{x:50}},{'thigh.L':{x:-70},'shin.L':{x:120},'foot.L':{x:30}},{chest:{x:15,y:15},'clavicle.R':{z:-4}},{root:{position:[2,1,-3],rotation:{x:5,y:70,z:-8}}}]){
  a.apply(pose);for(const name of a.jointNames){const b=a.graphicsSkeleton.bones[a.skeleton.index.get(name)];error=Math.max(error,v.setFromMatrixPosition(b.matrixWorld).distanceTo(a.solved.get(name).head));}
  for(let i=0;i<P.count;i+=211){a.skin.getVertexPosition(i,v);assert(v.toArray().every(Number.isFinite));}
 }
 assert(error<1e-12);a.apply({});assert.deepEqual(P.array,pos);assert.deepEqual(N.array,norm);for(let i=0;i<P.count;i+=211)assert(a.skin.getVertexPosition(i,v).distanceTo(new T.Vector3().fromBufferAttribute(P,i))<1e-12);console.log({jointCentreErrorMeters:error});
});
test('30/60/120/144 updates reach identical transforms with no accumulated deformation',()=>{
 const result=[];for(const fps of [30,60,120,144]){for(let i=0;i<=fps;i++){const t=i/fps;a.apply({'lowerArm.L':{x:-70-40*Math.sin(2*Math.PI*t)},'shin.R':{x:70+30*Math.sin(2*Math.PI*t)}});}result.push([...a.deformer.real,...a.deformer.dual]);}for(const r of result)assert.deepEqual(r,result[0]);a.apply({});assert.equal(JSON.stringify({CENTRE,SIDE,FINGERS}),before);
});
test('Original jointed checkpoint remains self-contained and unchanged',async()=>{
 const path='checkpoints/avatar-joints-1/',m=JSON.parse(await readFile(path+'CHECKPOINT.json')),hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(await readFile(path+'index.html')),m.viewer_sha256);for(const [name,sha]of Object.entries(m.files_sha256))assert.equal(hash(await readFile(path+name)),sha);
});
test('Owned GPU resources can be disposed twice safely',()=>{let count=0;g.addEventListener('dispose',()=>count++);a.dispose();a.dispose();assert.equal(count,1);});
