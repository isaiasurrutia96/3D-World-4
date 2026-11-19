import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createHipDesign,HIP_DESIGN} from '../../avatar/src/joints/hip-design.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';

const bones=JSON.stringify(SIDE),s=createHipDesign();
const cups=()=>[[s.torso,s.torso.geometry.userData.hipMolds.L,s.ballL],[s.torso,s.torso.geometry.userData.hipMolds.R,s.ballR],[s.thighL,s.thighL.geometry.userData.hipMold,s.ballL],[s.thighR,s.thighR.geometry.userData.hipMold,s.ballR]];

test('Two proportional balls stay on the unchanged skeleton hip points',()=>{
 const point=SIDE.find(b=>b.name==='thigh').head;
 assert.equal(JSON.stringify(SIDE),bones);assert.deepEqual(s.ballL.position.toArray(),point);assert.deepEqual(s.ballR.position.toArray(),[-point[0],point[1],point[2]]);
 assert.equal(s.ballL.geometry,s.ballR.geometry);assert.equal(s.radius,HIP_DESIGN.thighTopRadius*HIP_DESIGN.diameterRatio);assert.equal(s.group.children.length,5);
 let sourceRadius=0;const original=s.source.thigh.positions;for(let i=0;i<original.length;i+=3)if(Math.abs(original[i+1]-.1)<1e-6)sourceRadius=Math.max(sourceRadius,Math.hypot(original[i],original[i+2]));
 assert(sourceRadius>0);assert(Math.abs(s.radius/sourceRadius-HIP_DESIGN.diameterRatio)<1e-6);
 console.log(JSON.stringify({ballDiameterCm:s.diameter*100,measuredSourceTopWidthCm:sourceRadius*200,existingHipPoint:point,oneSharedBallGeometry:true}));
});

test('Both upper legs are exact reflected copies, including normals and outward face winding',()=>{
 const a=s.thighL.geometry,b=s.thighR.geometry;
 for(const name of ['position','normal']){const p=a.attributes[name],q=b.attributes[name];assert.equal(p.count,q.count);for(let i=0;i<p.count;i++){assert.equal(q.getX(i),-p.getX(i));assert.equal(q.getY(i),p.getY(i));assert.equal(q.getZ(i),p.getZ(i));}}
 for(let i=0;i<a.index.count;i+=3){assert.equal(b.index.array[i],a.index.array[i]);assert.equal(b.index.array[i+1],a.index.array[i+2]);assert.equal(b.index.array[i+2],a.index.array[i+1]);}
 assert.equal(s.thighL.position.x,-s.thighR.position.x);assert.equal(s.thighL.position.y,s.thighR.position.y);assert.equal(s.thighL.position.z,s.thighR.position.z);
});

test('One carved torso half is reflected exactly and joined without an open center seam',()=>{
 const p=s.torso.geometry.attributes.position,n=s.torso.geometry.attributes.normal,[left,right]=s.mirrorMaps;
 assert.equal(left.length,right.length);for(let i=0;i<left.length;i++){const a=left[i],b=right[i];assert(Math.abs(p.getX(a)+p.getX(b))<1e-7);assert.equal(p.getY(a),p.getY(b));assert.equal(p.getZ(a),p.getZ(b));assert(Math.abs(n.getX(a)+n.getX(b))<1e-7);assert(Math.abs(n.getY(a)-n.getY(b))<1e-7);assert(Math.abs(n.getZ(a)-n.getZ(b))<1e-7);}
});

test('All four real spherical cups have tangent circular soft lips at the requested depth',()=>{
 const v=new T.Vector3();let sphereError=0,rimError=0,tangentAngleError=0;
 for(const [part,m] of cups()){
  const M=new T.Matrix4().fromArray(m.toMold),center=new T.Vector3(...m.moldCenter),p=part.geometry.attributes.position;
  assert.equal(m.ballRadius,s.radius);assert.equal(m.filletRadius,HIP_DESIGN.filletRadius);assert(m.core.length>100&&m.rim.length>100);assert(Math.abs(m.measuredDepth-s.diameter*HIP_DESIGN.capture)<1e-6);
  for(const i of m.core)sphereError=Math.max(sphereError,Math.abs(v.fromBufferAttribute(p,i).applyMatrix4(M).distanceTo(center)-s.radius));
  for(const [i,r,y] of m.rim){v.fromBufferAttribute(p,i).applyMatrix4(M);rimError=Math.max(rimError,Math.abs(Math.hypot(Math.hypot(v.x-center.x,v.z-center.z)-r,v.y-y)-m.filletRadius));}
  // Compare tangent directions, not raw slopes: near a vertical tangent
  // two matching directions can have huge, poorly conditioned slopes.
  for(const section of m.sections){const innerCircle=-(section.innerR-section.centerR)/(section.innerY-section.centerY),innerSphere=section.innerR/Math.sqrt(s.radius*s.radius-section.innerR*section.innerR),outerCircle=-(section.outerR-section.centerR)/(section.outerY-section.centerY);tangentAngleError=Math.max(tangentAngleError,Math.abs(Math.atan(innerCircle)-Math.atan(innerSphere)),Math.abs(Math.atan(outerCircle)-Math.atan(section.slope)));}
 }
 assert(sphereError<1e-7);assert(rimError<1e-7);assert(tangentAngleError<1e-7);
 console.log(JSON.stringify({sphereError,rimError,tangentAngleError,filletMm:HIP_DESIGN.filletRadius*1000}));
});

test('The upper torso and previously approved knee end retain exact source positions and normals',()=>{
 let torsoCount=0,kneeCount=0;const torso=s.torso.geometry,thigh=s.thighL.geometry;
 for(let i=0;i<s.source.torso.positions.length/3;i++)if(s.source.torso.positions[3*i+1]>=1.0){torsoCount++;const j=s.mirrorMaps[0][i];for(let k=0;k<3;k++){assert.equal(torso.attributes.position.array[3*j+k],s.source.torso.positions[3*i+k]);assert.equal(torso.attributes.normal.array[3*j+k],s.source.torso.normals[3*i+k]);}}
 for(let i=0;i<s.source.thigh.positions.length/3;i++)if(s.source.thigh.positions[3*i+1]<=0){kneeCount++;for(let k=0;k<3;k++){assert.equal(thigh.attributes.position.array[3*i+k],s.source.thigh.positions[3*i+k]);assert.equal(thigh.attributes.normal.array[3*i+k],s.source.thigh.normals[3*i+k]);}}
 assert(torsoCount>1000&&kneeCount>1000);assert.equal(thigh.userData.kneeMold,s.source.thigh.kneeMold);
 console.log(JSON.stringify({protectedTorsoVertices:torsoCount,protectedKneeVertices:kneeCount}));
});

test('The exploded display gives every part a real 55 mm gap and returns exactly after seating',()=>{
 const initial=s.group.children.map(p=>p.position.toArray()),ball=s.ballL.position.y;
 assert(Math.abs(s.torso.position.y+s.torso.geometry.boundingBox.min.y-(ball+s.radius)-HIP_DESIGN.gap)<1e-12);
 for(const thigh of [s.thighL,s.thighR])assert(Math.abs(ball-s.radius-(thigh.position.y+thigh.geometry.boundingBox.max.y)-HIP_DESIGN.gap)<1e-12);
 s.separate(false);for(const [part,m,ball] of cups())assert(part.localToWorld(new T.Vector3(...m.center)).distanceTo(ball.position)<1e-12);
 s.separate(true);assert.deepEqual(s.group.children.map(p=>p.position.toArray()),initial);
});

test('Every actual socket triangle clears its seated ball within 0.2 mm',()=>{
 s.separate(false);const triangle=new T.Triangle(),point=new T.Vector3();let maximum=0;
 for(const [part,,ball] of cups()){
  const g=part.geometry,p=g.attributes.position,I=g.index.array,center=part.worldToLocal(ball.position.clone());
  for(let i=0;i<I.length;i+=3){triangle.a.fromBufferAttribute(p,I[i]);triangle.b.fromBufferAttribute(p,I[i+1]);triangle.c.fromBufferAttribute(p,I[i+2]);if(triangle.getArea()<1e-14)continue;triangle.closestPointToPoint(center,point);maximum=Math.max(maximum,s.radius-point.distanceTo(center));}
 }
 s.separate(true);assert(maximum<.0002,`Actual intrusion ${maximum}`);console.log(JSON.stringify({maximumTriangleIntrusionMm:maximum*1000}));
});

test('The torso and both upper legs remain finite, closed outward-wound solids',()=>{
 for(const part of [s.torso,s.thighL,s.thighR]){
  const g=part.geometry,p=g.attributes.position,I=g.index.array,ids=[],points=[],map=new Map();
  for(const a of Object.values(g.attributes)){assert.equal(a.count,p.count);assert(a.array.every(Number.isFinite));}
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>Math.round(x/1e-7)).join(',');if(!map.has(key)){map.set(key,points.length);points.push(v);}ids[i]=map.get(key);}
  const edges=new Map(),used=new Set();let faces=0,volume=0;
  for(let i=0;i<I.length;i+=3){const f=Array.from(I.slice(i,i+3),j=>ids[j]);if(new Set(f).size<3)continue;const [a,b,c]=f.map(j=>points[j]);assert(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-22);faces++;volume+=a.dot(b.clone().cross(c))/6;
   for(let k=0;k<3;k++){const x=f[k],y=f[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),e=edges.get(key)||[0,0];e[0]++;e[1]+=x<y?1:-1;edges.set(key,e);used.add(x);}}
  assert([...edges.values()].every(([count,winding])=>count===2&&winding===0),part.name+' closed edges');assert.equal(used.size-edges.size+faces,2);assert(volume>0);
 }
});
