// New avatar (version 2): copies the owner's ORIGINAL hand and foot (his left
// side) from the approved avatar into hands-feet-source.json, unchanged.
//
// Source: the Light copy of the approved avatar (avatar/assembled-joints/
// light.json), which keeps the original shapes faithfully (the hand 18,208
// triangles, the foot 10,128); the Game copy's 2,000-triangle hand is too
// simplified to show the original. The approved files are only read.
// Positions are moved into avatar space (each part's own placement applied).
// Each part also records its pivot (wrist / ankle joint) and three directions
// from the skeleton: length, width, thickness.
// Usage: node avatar-v2/build-hands-feet.mjs
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {decodeStudyBinary,binaryStudyReady} from '../src/study-binary.js';
import {SIDE,PALM,fingerBones} from '../motion-core/skeleton/bones.js';

const dir='avatar/assembled-joints',light=JSON.parse(await readFile(dir+'/light.json')),bytes=await readFile(dir+'/'+light.asset);
assert.equal(createHash('sha256').update(bytes).digest('hex'),light.sha256,'Light copy does not match its record');
await binaryStudyReady;const data=decodeStudyBinary(bytes);

/** Part positions and normals in avatar space (its transform applied). */
function toWorld(part){
 const [qx,qy,qz,qw]=part.transform.quaternion,[px,py,pz]=part.transform.position,s=part.transform.scale;
 const rotate=([x,y,z])=>{const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;
  return [ix*qw+iw*-qx+iy*-qz-iz*-qy,iy*qw+iw*-qy+iz*-qx-ix*-qz,iz*qw+iw*-qz+ix*-qy-iy*-qx];};
 const P=part.attributes.position.array,N=part.attributes.normal.array,positions=[],normals=[];
 for(let i=0;i<P.length;i+=3){const r=rotate([P[i]*s[0],P[i+1]*s[1],P[i+2]*s[2]]);positions.push(+(r[0]+px).toFixed(5),+(r[1]+py).toFixed(5),+(r[2]+pz).toFixed(5));
  const n=rotate([N[i],N[i+1],N[i+2]]),l=Math.hypot(...n)||1;normals.push(+(n[0]/l).toFixed(4),+(n[1]/l).toFixed(4),+(n[2]/l).toFixed(4));}
 return {positions,normals,index:Array.from(part.index)};
}
const bone=name=>SIDE.find(b=>b.name===name);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),unit=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/** Three directions from the skeleton: length, thickness (made square to length) and width (square to both). */
function axes(length,up){const l=unit(length),d=up[0]*l[0]+up[1]*l[1]+up[2]*l[2],t=unit(sub(up,l.map(v=>v*d)));return {length:l,width:unit(cross(t,l)),thickness:t};}
// Hand: wrist to the middle fingertip; thickness along the way the palm faces.
const wrist=bone('hand').head,middle=fingerBones().filter(b=>/^middle/.test(b.name)).at(-1),tip=middle.tail??middle.head;
// Foot: ankle to the toe end of the foot bone; thickness straight up.
const ankle=bone('foot').head,toe=bone('foot').tail;
const out={version:1,source:{asset:light.asset,sha256:light.sha256,approved:light.sourceSHA256},
 hand:{...toWorld(data.parts.find(p=>p.transform.name==='hand.L')),pivot:wrist,axes:axes(sub(tip,wrist),PALM.normal)},
 foot:{...toWorld(data.parts.find(p=>p.transform.name==='foot.L')),pivot:ankle,axes:axes(sub(toe,ankle),[0,1,0])}};
await writeFile('avatar-v2/hands-feet-source.json',JSON.stringify(out)+'\n');
console.log(`hand ${out.hand.index.length/3} triangles, foot ${out.foot.index.length/3} triangles; wrist ${out.hand.pivot}, ankle ${out.foot.pivot}`);
