import * as T from 'three';
import {gunzipSync} from 'three/addons/libs/fflate.module.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

export const studyAssetReady=MeshoptDecoder.ready;

const arrays={Float32Array,Float64Array,Uint32Array,Uint16Array,Uint8Array,Int32Array,Int16Array,Int8Array,Uint8ClampedArray};

// Typed arrays are saved as their original bytes: no rounding, simplification,
// new normals, socket solving or procedural hand construction on the device.
export function decodeStudyAsset(bytes){
 const data=JSON.parse(new TextDecoder().decode(gunzipSync(bytes)),(_key,value)=>{
  if(!value||value.$studyArray!==true)return value;
  const Type=arrays[value.type];if(!Type)throw Error('Unsupported study array');
  const packed=Uint8Array.from(atob(value.base64),character=>character.charCodeAt(0));
  let raw=packed;
  if(value.codec!=='raw'){
   raw=new Uint8Array(value.byteLength);
   if(value.codec==='vertex')MeshoptDecoder.decodeVertexBuffer(raw,value.count,value.stride,packed);
   else if(value.codec==='index')MeshoptDecoder.decodeIndexSequence(raw,value.count,value.stride,packed);
   else if(value.codec==='triangles'){
    MeshoptDecoder.decodeIndexBuffer(raw,value.count,value.stride,packed);
    const indices=new Type(raw.buffer),rotations=Uint8Array.from(atob(value.rotations),character=>character.charCodeAt(0));
    // Triangle compression can rotate its three indices. Restore their exact
    // original order as well, including the vertex used for flat shading.
    for(let i=0;i<indices.length;i+=3){const triangle=i/3,shift=(rotations[triangle>>2]>>((triangle&3)*2))&3,a=indices[i],b=indices[i+1],c=indices[i+2];
     if(shift===1){indices[i]=b;indices[i+1]=c;indices[i+2]=a;}
     else if(shift===2){indices[i]=c;indices[i+1]=a;indices[i+2]=b;}
    }
   }
   else throw Error('Unsupported study compression');
  }
  if(raw.byteLength%Type.BYTES_PER_ELEMENT)throw Error('Invalid study array length');
  return new Type(raw.buffer);
 });
 if(data.version!==1)throw Error('Unsupported study asset version');
 const materials=data.materials.map(record=>{
  const material=new T.MeshStandardMaterial(record.properties);
  material.color.fromArray(record.color);material.emissive.fromArray(record.emissive);
  return material;
 });
 const group=new T.Group();applyTransform(group,data.group);
 const study={group,diameter:data.diameter,radius:data.radius};
 for(const record of data.parts){
  const geometry=new T.BufferGeometry();
  for(const [name,attribute] of Object.entries(record.attributes)){
   const buffer=new T.BufferAttribute(attribute.array,attribute.itemSize,attribute.normalized);
   buffer.name=attribute.name;buffer.setUsage(attribute.usage);buffer.gpuType=attribute.gpuType;
   geometry.setAttribute(name,buffer);
  }
  if(record.index)geometry.setIndex(new T.BufferAttribute(record.index,1));
  geometry.name=record.geometryName;geometry.userData=record.geometryData;
  geometry.parameters=record.parameters;
  for(const entry of record.groups)geometry.addGroup(entry.start,entry.count,entry.materialIndex);
  geometry.setDrawRange(record.drawRange.start,record.drawRange.count??Infinity);
  if(record.box)geometry.boundingBox=new T.Box3(new T.Vector3(...record.box.min),new T.Vector3(...record.box.max));
  if(record.sphere)geometry.boundingSphere=new T.Sphere(new T.Vector3(...record.sphere.center),record.sphere.radius);
  const part=new T.Mesh(geometry,materials[record.material]);applyTransform(part,record.transform);
  group.add(part);study[record.key]=part;
 }
 group.updateMatrixWorld(true);return study;
}

function applyTransform(object,record){
 object.name=record.name;object.position.fromArray(record.position);
 object.quaternion.fromArray(record.quaternion);object.scale.fromArray(record.scale);
 object.visible=record.visible;object.castShadow=record.castShadow;object.receiveShadow=record.receiveShadow;
 object.renderOrder=record.renderOrder;object.userData=record.userData;
}

export async function loadStudyAsset(url){
 performance.mark('study-asset-start');
 const response=await fetch(url);if(!response.ok)throw Error('Could not load the saved study: '+response.status);
 const [buffer]=await Promise.all([response.arrayBuffer(),studyAssetReady]);
 const bytes=new Uint8Array(buffer);performance.mark('study-asset-received');
 const study=decodeStudyAsset(bytes);performance.mark('study-asset-ready');
 performance.measure('study-asset-decode','study-asset-received','study-asset-ready');
 return study;
}
