import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {build} from 'esbuild';
import {decodeStudyAsset,studyAssetReady} from '../src/study-asset.js';
import {MeshoptEncoder} from 'meshoptimizer';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

await Promise.all([MeshoptEncoder.ready,studyAssetReady]);

function transform(object){
 const {name,visible,castShadow,receiveShadow,renderOrder,userData}=object;
 return {name,visible,castShadow,receiveShadow,renderOrder,userData,position:object.position.toArray(),quaternion:object.quaternion.toArray(),scale:object.scale.toArray()};
}

function runtimeGeometryData(data){
 if(!data.wristMold)return data;
 const {sourcePositions,...mold}=data.wristMold;
 // The untouched pre-carving surface is a build/verification reference, not
 // displayed geometry or a finger binding. The source factory retains it.
 return {...data,wristMold:mold};
}

export function encodeStudyAsset(study){
 const materials=[],ids=new Map();
 const parts=study.group.children.map(part=>{
  assert(part.isMesh&&!part.children.length,'Only the three static study meshes are baked');
  const material=part.material;assert(material.isMeshStandardMaterial);
  assert(!Object.values(material).some(value=>value?.isTexture),'Textured studies need a texture-aware asset format');
  if(!ids.has(material)){
   ids.set(material,materials.length);
   const properties={};
   for(const key of ['name','roughness','metalness','emissiveIntensity','side','transparent','opacity','depthWrite','depthTest','colorWrite','vertexColors','flatShading','toneMapped','wireframe'])properties[key]=material[key];
   materials.push({properties,color:material.color.toArray(),emissive:material.emissive.toArray()});
  }
  const g=part.geometry,attributes={};
  assert.equal(Object.keys(g.morphAttributes).length,0,'Animation geometry is outside this static asset format');
  for(const [name,a] of Object.entries(g.attributes)){
   assert(!a.isInterleavedBufferAttribute);attributes[name]={array:a.array,itemSize:a.itemSize,normalized:a.normalized,name:a.name,usage:a.usage,gpuType:a.gpuType};
  }
  const key=Object.keys(study).find(key=>study[key]===part);assert(key,'Each part needs its existing study API key');
  return {key,transform:transform(part),material:ids.get(material),geometryName:g.name,attributes,index:g.index?.array??null,geometryData:runtimeGeometryData(g.userData),parameters:g.parameters,groups:g.groups,drawRange:{start:g.drawRange.start,count:Number.isFinite(g.drawRange.count)?g.drawRange.count:null},box:g.boundingBox?{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()}:null,sphere:g.boundingSphere?{center:g.boundingSphere.center.toArray(),radius:g.boundingSphere.radius}:null};
 });
 const json=JSON.stringify({version:1,group:transform(study.group),materials,parts,diameter:study.diameter,radius:study.radius},function(key,value){
  if(!ArrayBuffer.isView(value))return value;
  let bytes=new Uint8Array(value.buffer,value.byteOffset,value.byteLength),codec='raw',count=value.length,stride=value.BYTES_PER_ELEMENT,rotations;
  if(key==='index'&&count&&count%3===0){
   codec='triangles';bytes=MeshoptEncoder.encodeIndexBuffer(bytes,count,stride);
   const decodedBytes=new Uint8Array(value.byteLength);MeshoptDecoder.decodeIndexBuffer(decodedBytes,count,stride,bytes);
   const decoded=new value.constructor(decodedBytes.buffer),shifts=new Uint8Array(Math.ceil(count/12));
   for(let i=0;i<count;i+=3){let shift=0;while(shift<3&&decoded[i+shift]!==value[i])shift++;assert(shift<3);for(let j=0;j<3;j++)assert.equal(decoded[i+(j+shift)%3],value[i+j]);const triangle=i/3;shifts[triangle>>2]|=shift<<((triangle&3)*2);}
   rotations=Buffer.from(shifts).toString('base64');
  }
  else if(key==='index'&&count){codec='index';bytes=MeshoptEncoder.encodeIndexSequence(bytes,count,stride);}
  else if(stride>=4&&count){
   const components=this.itemSize??(count%3===0?3:1);stride*=components;count/=components;
   codec='vertex';bytes=MeshoptEncoder.encodeVertexBuffer(bytes,count,stride);
  }
  return {$studyArray:true,type:value.constructor.name,codec,count,stride,byteLength:value.byteLength,rotations,base64:Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength).toString('base64')};
 });
 return gzipSync(json,{level:9});
}

export function verifyStudyAsset(source,bytes){
 const restored=decodeStudyAsset(bytes);assert.equal(restored.diameter,source.diameter);assert.equal(restored.radius,source.radius);
 assert.equal(restored.group.children.length,source.group.children.length);
 assert.deepEqual(transform(restored.group),transform(source.group));
 for(const [i,original] of source.group.children.entries()){
  const part=restored.group.children[i],g=part.geometry,old=original.geometry;
  assert.equal(restored[Object.keys(source).find(key=>source[key]===original)],part);
  assert.deepEqual(transform(part),transform(original));assert.deepEqual(part.matrixWorld.toArray(),original.matrixWorld.toArray());
  assert.deepEqual(Object.keys(g.attributes),Object.keys(old.attributes));
  for(const key of Object.keys(old.attributes)){
   assert.deepEqual(g.attributes[key].array,old.attributes[key].array,key+' must stay byte-identical');
   for(const property of ['itemSize','normalized','usage','gpuType'])assert.equal(g.attributes[key][property],old.attributes[key][property]);
  }
  assert.deepEqual(g.index?.array,old.index?.array);assert.deepEqual(g.userData,runtimeGeometryData(old.userData));
  assert.equal(JSON.stringify(g.parameters),JSON.stringify(old.parameters));
  assert.deepEqual(g.groups,old.groups);assert.deepEqual(g.drawRange,old.drawRange);
  assert.deepEqual(g.boundingBox,old.boundingBox);assert.deepEqual(g.boundingSphere,old.boundingSphere);
  for(const key of ['color','emissive'])assert.deepEqual(part.material[key].toArray(),original.material[key].toArray());
  for(const key of ['roughness','metalness','emissiveIntensity','side','transparent','opacity','depthWrite','depthTest','colorWrite','vertexColors','flatShading','toneMapped','wireframe'])assert.equal(part.material[key],original.material[key]);
  for(const [j,other] of source.group.children.entries())assert.equal(part.material===restored.group.children[j].material,original.material===other.material);
 }
 return restored;
}

export async function buildStudyPage(id,study){
 const bytes=encodeStudyAsset(study);verifyStudyAsset(study,bytes);
 const hash=createHash('sha256').update(bytes).digest('hex').slice(0,16),asset='parts-'+hash+'.json.gz';
 const result=await build({entryPoints:[id+'/src/main.js'],bundle:true,write:false,minify:true,format:'iife',metafile:true,define:{__STUDY_ASSET_URL__:JSON.stringify('./'+asset)}});
 for(const input of Object.keys(result.metafile.inputs))assert(!/\/(study|mold-socket|round-forearm|hand)\.js$/.test(input),'Procedural construction must stay out of the live viewer: '+input);
 const html=(await readFile(id+'/shell.html','utf8')).replace('/*'+id.replace('-lab','').toUpperCase()+'_BUNDLE*/',()=>result.outputFiles[0].text);
 for(const dir of [id,'dist/'+id]){
  await mkdir(dir,{recursive:true});
  for(const name of await readdir(dir))if(/^parts-[a-f0-9]{16}\.json\.gz$/.test(name)&&name!==asset)await unlink(dir+'/'+name);
  await writeFile(dir+'/'+asset,bytes);await writeFile(dir+'/index.html',html);
 }
 console.log(JSON.stringify({study:id,asset,bytes:bytes.length,exactGeometry:true,exactTransforms:true,runtimeConstruction:false}));
}
