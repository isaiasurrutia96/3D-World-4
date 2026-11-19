import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {decodeStudyAssetData,studyAssetReady} from '../src/study-asset.js';
import {decodeStudyBinary,binaryStudyReady} from '../src/study-binary.js';

// Repackage the frozen source, never regenerate, simplify or quantize it.
const dir='avatar/assembled-joints',release=JSON.parse(await readFile('avatar/official.json'));
const source=JSON.parse(await readFile(dir+'/manifest.json')),input=await readFile(dir+'/'+source.asset);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(input),release.sha256);assert.equal(source.sha256,release.sha256);
await Promise.all([studyAssetReady,binaryStudyReady]);
const original=decodeStudyAssetData(input),data=JSON.parse(gunzipSync(input)),descriptors=[],chunks=[],seen=new Map(),parts=new Map();let offset=0,mirrors=0;
function chunk(bytes){const result={offset,length:bytes.length};chunks.push(bytes);offset+=bytes.length;return result;}
function same(a,b){return a.constructor===b.constructor&&Buffer.from(a.buffer,a.byteOffset,a.byteLength).equals(Buffer.from(b.buffer,b.byteOffset,b.byteLength));}
function pack(record,mirror){
 const {base64,rotations,...d}=record;delete d.$studyArray;
 if(mirror){
  const expected=mirror.original.slice();
  if(mirror.operation==='reflect-x')for(let i=0;i<expected.length;i+=3)expected[i]=-expected[i];
  else for(let i=0;i<expected.length;i+=3){const b=expected[i+1];expected[i+1]=expected[i+2];expected[i+2]=b;}
  assert(same(expected,mirror.actual),'Reflection must reproduce every original bit');
  const id=descriptors.length;descriptors.push({type:d.type,byteLength:d.byteLength,mirrorOf:mirror.id,operation:mirror.operation});mirrors++;return {$studyBuffer:id};
 }
 const packed=Buffer.from(base64,'base64'),key=JSON.stringify(d)+':'+hash(packed)+':'+(rotations??'');
 if(seen.has(key))return {$studyBuffer:seen.get(key)};
 Object.assign(d,chunk(packed));
 if(rotations!==undefined){const r=chunk(Buffer.from(rotations,'base64'));d.rotationOffset=r.offset;d.rotationLength=r.length;}
 const id=descriptors.length;descriptors.push(d);seen.set(key,id);return {$studyBuffer:id};
}
function visit(value){if(!value||typeof value!=='object')return value;if(value.$studyArray)return pack(value);for(const k of Object.keys(value))value[k]=visit(value[k]);return value;}
for(let i=0;i<data.parts.length;i++){
 const part=data.parts[i],name=part.transform.name,left=parts.get(name.replace(/\.R$/,'.L'));
 if(name.endsWith('.R')&&!name.startsWith('ball-')&&left){
  for(const attr of ['position','normal']){
   part.attributes[attr].array=pack(part.attributes[attr].array,{id:left.record.attributes[attr].array.$studyBuffer,original:left.original.attributes[attr].array,actual:original.parts[i].attributes[attr].array,operation:'reflect-x'});
  }
  part.index=pack(part.index,{id:left.record.index.$studyBuffer,original:left.original.index,actual:original.parts[i].index,operation:'reverse-triangles'});
 }
 visit(part);parts.set(name,{record:part,original:original.parts[i]});
}
visit(data.group);visit(data.materials);data.buffers=descriptors;
const metadata=Buffer.from(JSON.stringify(data)),header=Buffer.alloc(16);header.write('STUDYB2\0');header.writeUInt32LE(metadata.length,8);header.writeUInt32LE(offset,12);
const bytes=gzipSync(Buffer.concat([header,metadata,...chunks]),{level:9});
assert.deepEqual(decodeStudyBinary(bytes),original,'Delivery must preserve all arrays, triangle ordering, metadata and transforms exactly');
const sha256=hash(bytes),asset='delivery-'+sha256.slice(0,16)+'.bin.gz';
await writeFile(dir+'/'+asset,bytes);
const manifest={version:2,asset,bytes:bytes.length,sha256,sourceAsset:source.asset,sourceSHA256:source.sha256,exactSource:true,mirroredArrays:mirrors,metadataBytes:metadata.length,encodedPayloadBytes:offset};
await writeFile(dir+'/delivery.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({...manifest,reductionPercent:100*(1-bytes.length/input.length)}));
