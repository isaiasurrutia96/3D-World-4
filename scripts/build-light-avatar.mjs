import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {MeshoptSimplifier} from 'meshoptimizer';
import {decodeStudyAssetData,studyAssetReady} from '../src/study-asset.js';
import {decodeStudyBinary,binaryStudyReady} from '../src/study-binary.js';

// Light copy of the approved avatar, for movement and smoothness tests on slow
// devices. It is a SEPARATE asset made from the frozen source: the approved
// files are only read, never changed. Same parts, same transforms, same joint
// data (the userData that holds the ball and socket positions), so the same
// skeleton code binds it. Only the triangle counts of the big parts go down.
// Usage: node scripts/build-light-avatar.mjs
// Tuning: LIGHT_BODY (share of triangles kept on limbs, chest, pelvis, hands,
// feet; default .07), LIGHT_BALL (share kept on joint balls; default .2),
// LIGHT_ERROR (largest allowed shape change, as a share of the part's size;
// default .02).
const BODY=Number(process.env.LIGHT_BODY??.07),BALL=Number(process.env.LIGHT_BALL??.2),ERROR=Number(process.env.LIGHT_ERROR??.02);
const dir='avatar/assembled-joints',release=JSON.parse(await readFile('avatar/official.json'));
const source=JSON.parse(await readFile(dir+'/manifest.json')),input=await readFile(dir+'/'+source.asset);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(input),release.sha256,'Source must be the approved release');assert.equal(source.sha256,release.sha256);
await Promise.all([studyAssetReady,binaryStudyReady,MeshoptSimplifier.ready]);
const data=decodeStudyAssetData(input);

/** Remove unused vertices after simplifying; returns new attribute arrays and index. */
function compact(part,indices){
 const position=part.attributes.position.array,count=position.length/3,map=new Int32Array(count).fill(-1);let used=0;
 const out=new Uint32Array(indices.length);
 for(let i=0;i<indices.length;i++){const v=indices[i];if(map[v]<0)map[v]=used++;out[i]=map[v];}
 for(const attribute of Object.values(part.attributes)){
  const size=attribute.itemSize,from=attribute.array,to=new from.constructor(used*size);
  for(let v=0;v<count;v++){const n=map[v];if(n>=0)for(let k=0;k<size;k++)to[n*size+k]=from[v*size+k];}
  attribute.array=to;
 }
 part.index=used<=65535?Uint16Array.from(out):out;
 return used;
}

const report=[];let before=0,after=0;
for(const part of data.parts){
 const name=part.transform.name,tris=part.index.length/3;before+=tris;
 if(tris<1000){after+=tris;report.push({name,before:tris,after:tris});continue;} // head and neck stay exact
 const share=name.startsWith('ball-')?BALL:BODY;
 const target=Math.max(300,Math.round(tris*share))*3;
 const [indices,error]=MeshoptSimplifier.simplify(Uint32Array.from(part.index),part.attributes.position.array,3,target,ERROR,['LockBorder']);
 const vertices=compact(part,indices);
 after+=indices.length/3;report.push({name,before:tris,after:indices.length/3,vertices,error:+error.toFixed(4)});
 // Cached bounds stay valid: the shape only loses detail.
}

// Pack every typed array as a raw buffer in the binary study format.
const descriptors=[],chunks=[];let offset=0;
function pack(array){
 const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),id=descriptors.length;
 descriptors.push({type:array.constructor.name,byteLength:bytes.length,codec:'raw',offset,length:bytes.length});
 chunks.push(bytes);offset+=bytes.length;return {$studyBuffer:id};
}
const visit=value=>{
 if(ArrayBuffer.isView(value))return pack(value);
 if(!value||typeof value!=='object')return value;
 if(Array.isArray(value))return value.map(visit);
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v)]));
};
const packed=visit(data);packed.buffers=descriptors;
const metadata=Buffer.from(JSON.stringify(packed)),header=Buffer.alloc(16);
header.write('STUDYB2\0');header.writeUInt32LE(metadata.length,8);header.writeUInt32LE(offset,12);
const bytes=gzipSync(Buffer.concat([header,metadata,...chunks]),{level:9});
const back=decodeStudyBinary(bytes);
assert.equal(back.parts.length,28,'All 28 approved parts must remain');
assert.deepEqual(back.parts.map(p=>p.transform.name),data.parts.map(p=>p.transform.name));
const sha256=hash(bytes),asset='light-'+sha256.slice(0,16)+'.bin.gz';
await writeFile(dir+'/'+asset,bytes);
const manifest={version:1,asset,bytes:bytes.length,sha256,sourceSHA256:release.sha256,triangles:after,sourceTriangles:before,bodyShare:BODY,ballShare:BALL,maxError:ERROR};
await writeFile(dir+'/light.json',JSON.stringify(manifest,null,2)+'\n');
for(const r of report)console.log(r.name.padEnd(18),String(r.before).padStart(7),'→',String(r.after).padStart(6),r.error===undefined?'':'error '+r.error);
console.log(JSON.stringify(manifest));
