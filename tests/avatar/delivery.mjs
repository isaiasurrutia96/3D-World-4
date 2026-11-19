import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {decodeStudyAssetData,studyAssetReady,createStudyFromData} from '../../src/study-asset.js';
import {decodeStudyBinary,decodeStudyBinaryAsync,binaryStudyReady,studyTransferables} from '../../src/study-binary.js';
import {bindOfficialAvatar} from '../../avatar/src/official-avatar.js';

await Promise.all([studyAssetReady,binaryStudyReady]);
const dir=new URL('../../avatar/assembled-joints/',import.meta.url),manifest=JSON.parse(await readFile(new URL('delivery.json',dir)));
const bytes=await readFile(new URL(manifest.asset,dir)),source=await readFile(new URL(manifest.sourceAsset,dir));
const sha=b=>createHash('sha256').update(b).digest('hex');

test('The smaller delivery reproduces every approved array, triangle, material, transform and socket record exactly',async()=>{
 assert.equal(sha(source),manifest.sourceSHA256);assert.equal(sha(bytes),manifest.sha256);assert.equal(bytes.length,manifest.bytes);
 assert(bytes.length<source.length*.65,'Delivery must be materially smaller, with no geometry loss');
 const start=performance.now(),original=decodeStudyAssetData(source),oldMS=performance.now()-start;
 const begin=performance.now(),data=decodeStudyBinary(bytes),newMS=performance.now()-begin;
 assert.deepEqual(data,original);
 assert.deepEqual(await decodeStudyBinaryAsync(bytes),original,'Native asynchronous gzip must produce the same data');
 const avatar=bindOfficialAvatar(createStudyFromData(data));
 assert.equal(avatar.attached.length,28);assert.equal(avatar.attached.filter(p=>p.ball).length,12);assert.equal(avatar.attached.flatMap(p=>p.sockets).length,24);
 const before=avatar.attached.map(a=>a.mesh.matrix.toArray());avatar.apply({'lowerArm.L':{x:90},'shin.R':{x:65}});avatar.apply({});assert.deepEqual(avatar.attached.map(a=>a.mesh.matrix.toArray()),before);
 assert(studyTransferables(data).every(b=>b instanceof ArrayBuffer));avatar.dispose();
 console.log(JSON.stringify({sourceBytes:source.length,deliveryBytes:bytes.length,legacyDecodeMS:Math.round(oldMS),binaryDecodeMS:Math.round(newMS),exact:true}));
});

function fixture(change=()=>{}){
 const a=new Float32Array([0,-0,2,1,3,4]),payload=Buffer.from(a.buffer),metadata={version:1,first:{$studyBuffer:0},second:{$studyBuffer:0},mirror:{$studyBuffer:1},buffers:[{type:'Float32Array',byteLength:payload.length,codec:'raw',offset:0,length:payload.length},{type:'Float32Array',byteLength:payload.length,mirrorOf:0,operation:'reflect-x'}]};
 change(metadata);const json=Buffer.from(JSON.stringify(metadata)),header=Buffer.alloc(16);header.write('STUDYB2\0');header.writeUInt32LE(json.length,8);header.writeUInt32LE(payload.length,12);return gzipSync(Buffer.concat([header,json,payload]));
}
test('Shared compressed records produce independent mutable arrays and retain signed zero',()=>{
 const data=decodeStudyBinary(fixture());assert.notEqual(data.first.buffer,data.second.buffer);data.first[0]=123;assert.equal(data.second[0],0);assert(Object.is(data.mirror[0],-0));assert(Object.is(data.mirror[1],-0));
 assert.deepEqual([...data.mirror.slice(3)],[-1,3,4]);assert.equal(studyTransferables(data).length,3);
});
test('Browsers without native gzip can decode the ArrayBuffer sent to the worker',async()=>{
 const native=globalThis.DecompressionStream;
 try{globalThis.DecompressionStream=undefined;const packed=fixture(),buffer=packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength);assert.deepEqual(await decodeStudyBinaryAsync(buffer),decodeStudyBinary(packed));}
 finally{globalThis.DecompressionStream=native;}
});
test('Truncation, unsupported formats, invalid ranges and broken mirror references fail clearly',()=>{
 assert.throws(()=>decodeStudyBinary(bytes.subarray(0,20)));
 assert.throws(()=>decodeStudyBinary(gzipSync('bad')),/version/);
 assert.throws(()=>decodeStudyBinary(fixture(m=>m.version=99)),/metadata/);
 assert.throws(()=>decodeStudyBinary(fixture(m=>m.buffers[0].offset=-1)),/buffer/);
 assert.throws(()=>decodeStudyBinary(fixture(m=>m.buffers[0].byteLength++)),/array/);
 assert.throws(()=>decodeStudyBinary(fixture(m=>m.buffers[1].mirrorOf=99)),/mirrored/);
 assert.throws(()=>decodeStudyBinary(fixture(m=>m.mirror.$studyBuffer=99)),/Unknown/);
});
