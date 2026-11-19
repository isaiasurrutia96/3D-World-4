import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createElbowStudy} from '../../elbow-lab/src/study.js';
import {createElbowDesign,ELBOW_DESIGN} from '../../avatar/src/joints/elbow-design.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';
import {INNER_EDGE} from '../../avatar/src/joints/elbow-inner-edge.js';
import {ELBOW_SMOOTH} from '../../avatar/src/joints/elbow-smooth.js';

const base=createElbowStudy(),original=Object.fromEntries(['upperArm','forearm'].map(name=>[name,{positions:base[name].geometry.attributes.position.array.slice(),normals:base[name].geometry.attributes.normal.array.slice(),quaternion:base[name].quaternion.toArray(),scale:base[name].scale.toArray()}]));
const ballBefore={position:base.ball.position.toArray(),positions:base.ball.geometry.attributes.position.array.slice(),normals:base.ball.geometry.attributes.normal.array.slice()},wrist=base.forearm.geometry.userData.wristMold;
const study=createElbowDesign({base});

test('One original ball and both socket centers stay exactly at the existing elbow pivot',()=>{
 assert.deepEqual(study.ball.position.toArray(),SIDE.find(b=>b.name==='lowerArm').head);assert.deepEqual(study.ball.position.toArray(),ballBefore.position);
 assert.deepEqual(study.ball.geometry.attributes.position.array,ballBefore.positions);assert.deepEqual(study.ball.geometry.attributes.normal.array,ballBefore.normals);
 for(const name of ['upperArm','forearm']){
  const part=study[name],m=part.geometry.userData.elbowMold;
  assert(part.localToWorld(new T.Vector3(...m.center)).distanceTo(study.ball.position)<1e-12);
  assert.deepEqual(part.quaternion.toArray(),original[name].quaternion);assert.deepEqual(part.scale.toArray(),original[name].scale);
 }
 assert.equal(study.group.children.length,3);
});
test('Surfaces outside the marked inner edges and the approved wrist socket remain exact',()=>{
 for(const name of ['upperArm','forearm']){
  const part=study[name],p=part.geometry.attributes.position,n=part.geometry.attributes.normal,old=original[name];
  assert(part.userData.elbowDesign.preserved.length>50);
  for(const i of part.userData.elbowDesign.preserved)for(let k=0;k<3;k++){assert.equal(p.array[3*i+k],old.positions[3*i+k]);assert.equal(n.array[3*i+k],old.normals[3*i+k]);}
  for(const attr of Object.values(part.geometry.attributes)){assert.equal(attr.count,p.count);assert([...attr.array].every(Number.isFinite));}
 }
 assert.equal(study.forearm.geometry.userData.wristMold,wrist);
});
test('The bounded corner trim preserves the back, fitted cup and at least 95% of the bulk',()=>{
 for(const name of ['upperArm','forearm']){
  const part=study[name],g=part.geometry,p=new T.BufferAttribute(study.smoothingReports[name].beforePositions,3),n=new T.BufferAttribute(study.smoothingReports[name].beforeNormals,3),report=study.innerEdgeReports[name],m=g.userData.elbowMold,old=report.beforePositions,oldN=report.beforeNormals;
  const limit=INNER_EDGE.maxInset+INNER_EDGE.cornerExtra;
  assert(report.changed.length>100);assert(report.maximumInset<=limit);assert(report.minimumJacobian>.05);
  for(let i=0;i<p.count;i++){
   assert.equal(p.getX(i),old[3*i]);assert.equal(p.getY(i),old[3*i+1]);
   const inset=old[3*i+2]-p.getZ(i);assert(inset>=-1e-7&&inset<=limit+1e-7);
   const body=name==='upperArm'?1:-1,distance=body*(old[3*i+1]-m.center[1]);
   if(distance>=INNER_EDGE.cornerFall[1])assert(inset<=INNER_EDGE.maxInset+1e-7,'Additional trim stays at the marked corner');
   if(old[3*i+2]<=m.center[2])for(let k=0;k<3;k++){assert.equal(p.array[3*i+k],old[3*i+k]);assert.equal(n.array[3*i+k],oldN[3*i+k]);}
  }
  for(const i of [...m.core,...m.rim.map(r=>r[0])])for(let k=0;k<3;k++)assert.equal(p.array[3*i+k],old[3*i+k],'The fitted socket and rim stay exact');
  const volume=positions=>{const I=g.index.array,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let v=0;for(let i=0;i<I.length;i+=3){a.fromArray(positions,I[i]*3);b.fromArray(positions,I[i+1]*3);c.fromArray(positions,I[i+2]*3);v+=a.dot(b.cross(c))/6;}return v;};
  const retained=volume(p.array)/volume(old);assert(retained>.95&&retained<=1.000001);
  console.log(JSON.stringify({part:name,maxInset:report.maximumInset,volumeRetained:retained,minimumJacobian:report.minimumJacobian}));
 }
});
test('The marked transitions are faired smoothly without shifting the fitted cup or the limb backs',()=>{
 for(const name of ['upperArm','forearm']){
  const part=study[name],g=part.geometry,p=g.attributes.position,n=g.attributes.normal,m=g.userData.elbowMold,report=study.smoothingReports[name],old=report.beforePositions,oldN=report.beforeNormals;
  assert(report.changed.length>100);assert(report.maximumMove<=ELBOW_SMOOTH.maximumMove+1e-7);assert(report.normalEnergyAfter<report.normalEnergyBefore,'Normal variation must decrease');
  for(let i=0;i<p.count;i++)if(old[3*i+2]<=m.center[2])for(let k=0;k<3;k++){assert.equal(p.array[3*i+k],old[3*i+k]);assert.equal(n.array[3*i+k],oldN[3*i+k]);}
  for(const i of [...m.core,...m.rim.map(r=>r[0])])for(let k=0;k<3;k++)assert.equal(p.array[3*i+k],old[3*i+k]);
  for(const i of m.core)for(let k=0;k<3;k++)assert.equal(n.array[3*i+k],oldN[3*i+k]);
  console.log(JSON.stringify({part:name,smoothingMove:report.maximumMove,normalEnergyBefore:report.normalEnergyBefore,normalEnergyAfter:report.normalEnergyAfter}));
 }
});
test('Both cups follow the real sphere with circular soft rims and more exposure on the bending side',()=>{
 const results=[];
 for(const name of ['upperArm','forearm']){
  const part=study[name],m=part.geometry.userData.elbowMold,p=part.geometry.attributes.position,M=new T.Matrix4().fromArray(m.toMold),center=new T.Vector3(...m.moldCenter),v=new T.Vector3();
  assert.equal(m.ballRadius,study.radius);assert.equal(m.filletRadius,ELBOW_DESIGN.filletRadius);assert(m.core.length>100&&m.rim.length>100);
  let sphereError=0,rimError=0;
  for(const i of m.core)sphereError=Math.max(sphereError,Math.abs(v.fromBufferAttribute(p,i).applyMatrix4(M).distanceTo(center)-study.radius));
  for(const [i,r,y] of m.rim){v.fromBufferAttribute(p,i).applyMatrix4(M);rimError=Math.max(rimError,Math.abs(Math.hypot(Math.hypot(v.x-center.x,v.z-center.z)-r,v.y-y)-m.filletRadius));}
  assert(sphereError<1e-7);assert(rimError<1e-7);
  const front=name==='upperArm'?6:2,back=name==='upperArm'?2:6,depth=s=>study.radius-m.moldCenter[1]+s.innerY;
  const frontDepth=depth(m.sections[front]),backDepth=depth(m.sections[back]);assert(frontDepth<backDepth-.01,'The inside lip must be visibly lower');
  results.push({name,frontDepth,backDepth,sphereError,rimError});
 }
 console.log(JSON.stringify({ballDiameter:study.diameter,results}));
});
test('Every actual socket triangle clears the seated ball within 0.2 mm',()=>{
 const triangle=new T.Triangle(),point=new T.Vector3();let penetration=0;
 for(const name of ['upperArm','forearm']){
  const part=study[name],g=part.geometry,p=g.attributes.position,I=g.index.array,center=part.worldToLocal(study.ball.position.clone());
  for(let i=0;i<I.length;i+=3){triangle.a.fromBufferAttribute(p,I[i]);triangle.b.fromBufferAttribute(p,I[i+1]);triangle.c.fromBufferAttribute(p,I[i+2]);if(triangle.getArea()<1e-14)continue;triangle.closestPointToPoint(center,point);part.localToWorld(point);penetration=Math.max(penetration,study.radius-point.distanceTo(study.ball.position));}
 }
 assert(penetration<.0002,`Actual triangle intrusion: ${penetration}`);console.log(JSON.stringify({maximumTriangleIntrusion:penetration}));
});
test('Inside contact arcs leave a conservative opening budget for a 90-degree bend',()=>{
 let occupied=0;
 for(const [name,section] of [['upperArm',6],['forearm',2]]){
  const m=study[name].geometry.userData.elbowMold,depth=study.radius-m.moldCenter[1]+m.sections[section].innerY;
  occupied+=Math.acos(1-depth/study.radius)+Math.atan(m.filletRadius/study.radius);
 }
 assert(occupied<Math.PI/2);console.log(JSON.stringify({insideArcAndRimDegrees:occupied*180/Math.PI}));
 // This checks the cavity design budget, not the full animated limb's
 // collision-free range. Claude's later motion work still needs shell tests.
});
test('Both carved parts remain closed, consistently wound clay solids with positive volume',()=>{
 for(const name of ['upperArm','forearm']){
  const g=study[name].geometry,p=g.attributes.position,I=g.index.array,ids=[],points=[],map=new Map();
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>Math.round(x/1e-7)).join(',');if(!map.has(key)){map.set(key,points.length);points.push(v);}ids[i]=map.get(key);}
  const edges=new Map(),used=new Set();let faces=0,volume=0;
  for(let i=0;i<I.length;i+=3){const f=Array.from(I.slice(i,i+3),j=>ids[j]);if(new Set(f).size<3)continue;const [a,b,c]=f.map(j=>points[j]);assert(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-22,name+' collapsed face');faces++;volume+=a.dot(b.clone().cross(c))/6;for(let k=0;k<3;k++){const x=f[k],y=f[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),e=edges.get(key)||[0,0];e[0]++;e[1]+=x<y?1:-1;edges.set(key,e);used.add(x);}}
  assert([...edges.values()].every(([count,winding])=>count===2&&winding===0),name+' closed directed edges');assert.equal(used.size-edges.size+faces,2);assert(volume>0);
 }
});
