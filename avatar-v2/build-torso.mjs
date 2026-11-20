// New avatar (version 2), step 1: the blank sheet. Copies only the torso
// (chest and pelvis) from the phone-ready Game copy of the approved avatar
// into this folder's own file, torso.json. The approved avatar and its Light
// and Game copies are only read, never changed. Later steps reshape these
// parts here and add the rest of the body one part at a time.
// Usage: node avatar-v2/build-torso.mjs
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {decodeStudyBinary,binaryStudyReady} from '../src/study-binary.js';
const dir='avatar/assembled-joints',game=JSON.parse(await readFile(dir+'/game.json'));
await binaryStudyReady;
const data=decodeStudyBinary(await readFile(dir+'/'+game.asset));
const round=(array,places)=>Array.from(array,v=>+v.toFixed(places));
const parts=['chest','pelvis'].map(name=>{
 const part=data.parts.find(p=>p.transform.name===name);assert(part,'Missing '+name);
 const {position,quaternion,scale}=part.transform,assembly=part.transform.userData.assembly;
 const material=data.materials[part.material];
 return {name,bone:assembly.bone,position,quaternion,scale,
  color:round(material.color,4),roughness:material.properties.roughness,
  // Where each limb's ball sits in this part (centre and radius, metres).
  sockets:assembly.sockets.map(s=>({bone:s.bone,center:s.center,radius:+s.radius.toFixed(5)})),
  positions:round(part.attributes.position.array,5),normals:round(part.attributes.normal.array,4),index:Array.from(part.index)};
});
const torso={version:1,source:{avatar:game.sourceSHA256,gameCopy:game.sha256},triangles:parts.reduce((n,p)=>n+p.index.length/3,0),parts};
await writeFile('avatar-v2/torso.json',JSON.stringify(torso)+'\n');
console.log(parts.map(p=>p.name+' '+p.index.length/3+' triangles, sockets: '+p.sockets.map(s=>s.bone).join(' ')).join('\n'),'\ntotal',torso.triangles);
console.log(JSON.stringify(parts.map(p=>({n:p.name,pos:p.position,q:p.quaternion,s:p.scale,c:p.color}))));
