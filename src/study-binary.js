import {gunzipSync} from 'three/addons/libs/fflate.module.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

export const binaryStudyReady=MeshoptDecoder.ready;
const types={Float32Array,Float64Array,Uint32Array,Uint16Array,Uint8Array,Int32Array,Int16Array,Int8Array,Uint8ClampedArray};
const magic=[83,84,85,68,89,66,50,0]; // STUDYB2\0

export function decodeStudyBinaryRaw(raw){
 if(raw.length<16||magic.some((v,i)=>raw[i]!==v))throw Error('Unsupported binary study version');
 const header=new DataView(raw.buffer,raw.byteOffset,16),length=header.getUint32(8,true),payloadLength=header.getUint32(12,true);
 if(length>raw.length-16||payloadLength!==raw.length-16-length)throw Error('Invalid binary study length');
 const metadata=JSON.parse(new TextDecoder().decode(raw.subarray(16,16+length))),payload=raw.subarray(16+length);
 if(metadata.version!==1||!Array.isArray(metadata.buffers))throw Error('Unsupported binary study metadata');
 const decoded=[];
 function block(offset,length){if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0||offset+length>payload.length)throw Error('Invalid binary study buffer');return payload.subarray(offset,offset+length);}
 for(const d of metadata.buffers){
  const Type=types[d.type];
  if(!Type||!Number.isSafeInteger(d.byteLength)||d.byteLength<0||d.byteLength%Type.BYTES_PER_ELEMENT)throw Error('Invalid binary study array');
  let bytes;
  if(d.mirrorOf!==undefined){
   const original=decoded[d.mirrorOf];if(!original||original.constructor!==Type||original.byteLength!==d.byteLength)throw Error('Invalid mirrored study array');
   const array=original.slice();
   if(d.operation==='reflect-x'){if(array.length%3)throw Error('Invalid mirrored vector array');for(let i=0;i<array.length;i+=3)array[i]=-array[i];}
   else if(d.operation==='reverse-triangles'){if(array.length%3)throw Error('Invalid triangle array');for(let i=0;i<array.length;i+=3){const b=array[i+1];array[i+1]=array[i+2];array[i+2]=b;}}
   else throw Error('Unsupported study mirror operation');
   decoded.push(array);continue;
  }
  const packed=block(d.offset,d.length);
  if(d.codec==='raw'){if(packed.length!==d.byteLength)throw Error('Invalid raw study array');bytes=packed.slice();}
  else{
   if(!Number.isSafeInteger(d.count)||!Number.isSafeInteger(d.stride)||d.count<0||d.stride<1||d.count*d.stride!==d.byteLength)throw Error('Invalid compressed study array');
   bytes=new Uint8Array(d.byteLength);
   if(d.codec==='vertex')MeshoptDecoder.decodeVertexBuffer(bytes,d.count,d.stride,packed);
   else if(d.codec==='index')MeshoptDecoder.decodeIndexSequence(bytes,d.count,d.stride,packed);
   else if(d.codec==='triangles'){
    if(d.count%3)throw Error('Invalid triangle count');
    MeshoptDecoder.decodeIndexBuffer(bytes,d.count,d.stride,packed);
    const indices=new Type(bytes.buffer),rotations=block(d.rotationOffset,d.rotationLength);
    if(rotations.length!==Math.ceil(d.count/12))throw Error('Invalid triangle rotations');
    for(let i=0;i<indices.length;i+=3){const t=i/3,s=(rotations[t>>2]>>((t&3)*2))&3,a=indices[i],b=indices[i+1],c=indices[i+2];if(s===1){indices[i]=b;indices[i+1]=c;indices[i+2]=a;}else if(s===2){indices[i]=c;indices[i+1]=a;indices[i+2]=b;}else if(s===3)throw Error('Invalid triangle rotation');}
   }else throw Error('Unsupported binary study compression');
  }
  decoded.push(new Type(bytes.buffer,bytes.byteOffset,bytes.byteLength/Type.BYTES_PER_ELEMENT));
 }
 delete metadata.buffers;
 function restore(value){
  if(!value||typeof value!=='object')return value;
  if(Object.hasOwn(value,'$studyBuffer')){const a=decoded[value.$studyBuffer];if(!a)throw Error('Unknown study buffer');return a.slice();}
  for(const k of Object.keys(value))value[k]=restore(value[k]);return value;
 }
 return restore(metadata);
}
export function decodeStudyBinary(bytes){return decodeStudyBinaryRaw(gunzipSync(bytes instanceof Uint8Array?bytes:new Uint8Array(bytes)));}
export async function decodeStudyBinaryAsync(bytes){
 if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);
 await binaryStudyReady;
 if(typeof DecompressionStream==='function'){
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return decodeStudyBinaryRaw(new Uint8Array(await new Response(stream).arrayBuffer()));
 }
 return decodeStudyBinary(bytes);
}
export function studyTransferables(data){
 const buffers=new Set();
 function visit(value){if(!value||typeof value!=='object')return;if(ArrayBuffer.isView(value)){buffers.add(value.buffer);return;}for(const v of Object.values(value))visit(v);}
 visit(data);return [...buffers];
}
