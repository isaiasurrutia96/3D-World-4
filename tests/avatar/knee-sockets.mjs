import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createKneeBase,createKneeDesign,KNEE_DESIGN} from '../../avatar/src/joints/knee-design.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';

const base=createKneeBase(),ankle=structuredClone(base.calf.userData.socketMold),
 ankleGeometry=structuredClone(base.calf.geometry.userData),
 transforms=Object.fromEntries(['thigh','calf'].map(name=>[name,[base[name].quaternion.toArray(),base[name].scale.toArray()]])),
 ballPositions=base.ball.geometry.attributes.position.array.slice(),skeleton=JSON.stringify(SIDE),study=createKneeDesign({base});
const names=['thigh','calf'];

test('The knee ball and both sockets share the unchanged skeleton pivot',()=>{
 assert.equal(JSON.stringify(SIDE),skeleton);assert.deepEqual(study.ball.position.toArray(),SIDE.find(b=>b.name==='shin').head);
 assert.deepEqual(study.ball.geometry.attributes.position.array,ballPositions);assert.equal(study.group.children.length,3);
 for(const name of names){const part=study[name];assert.deepEqual([part.quaternion.toArray(),part.scale.toArray()],transforms[name]);assert(part.localToWorld(new T.Vector3(...part.geometry.userData.kneeMold.center)).distanceTo(study.ball.position)<1e-12);}
 assert.equal(study.ball.userData.skeletonJoint,'shin.L');
});

test('The ball is proportionate to the original calf, with finite matched geometry attributes',()=>{
 const old=study.source.calf.positions;let min=Infinity,max=-Infinity;
 for(let i=0;i<old.length;i+=3){min=Math.min(min,old[i]);max=Math.max(max,old[i]);}
 assert(Math.abs(study.diameter/(max-min)-KNEE_DESIGN.diameterRatio)<1e-12);
 for(const name of names){const g=study[name].geometry;for(const a of Object.values(g.attributes)){assert.equal(a.count,g.attributes.position.count);assert(a.array.every(Number.isFinite));}}
 console.log(JSON.stringify({ballDiameterCm:study.diameter*100,calfWidthCm:(max-min)*100}));
});

test('The approved ankle cup and lower calf remain byte-exact, including their normals and metadata',()=>{
 const g=study.calf.geometry,old=study.source.calf;let protectedCount=0;
 for(let i=0;i<old.positions.length/3;i++)if(old.positions[3*i+1]<=-.09){protectedCount++;for(let k=0;k<3;k++){assert.equal(g.attributes.position.array[3*i+k],old.positions[3*i+k]);assert.equal(g.attributes.normal.array[3*i+k],old.normals[3*i+k]);}}
 assert(protectedCount>1000);assert.deepEqual(study.calf.userData.socketMold,ankle);
 for(const key of ['moldRestPositions','moldContactIndices','filletContacts','filletSections'])assert.deepEqual(g.userData[key],ankleGeometry[key]);
 console.log(JSON.stringify({protectedAnkleVertices:protectedCount}));
});

test('Both cups fit the actual sphere, with circular softened rims and more exposure behind the knee',()=>{
 for(const name of names){const part=study[name],g=part.geometry,m=g.userData.kneeMold,M=new T.Matrix4().fromArray(m.toMold),c=new T.Vector3(...m.moldCenter),v=new T.Vector3();let sphereError=0,rimError=0;
  assert(m.core.length>100&&m.rim.length>100);
  for(const i of m.core)sphereError=Math.max(sphereError,Math.abs(v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(M).distanceTo(c)-study.radius));
  for(const [i,r,y] of m.rim){v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(M);rimError=Math.max(rimError,Math.abs(Math.hypot(Math.hypot(v.x-c.x,v.z-c.z)-r,v.y-y)-m.filletRadius));}
  assert(sphereError<1e-7);assert(rimError<1e-7);
  const rear=name==='thigh'?6:2,front=name==='thigh'?2:6,depth=s=>study.radius-m.moldCenter[1]+s.innerY;
  assert(depth(m.sections[rear])<depth(m.sections[front])-.01);
  assert(Math.abs(m.measuredDepth-2*study.radius*KNEE_DESIGN.capture)<1e-6);
  console.log(JSON.stringify({part:name,sphereError,rimError,rearDepth:depth(m.sections[rear]),frontDepth:depth(m.sections[front])}));
 }
});

test('Actual triangles clear the seated ball within 0.2 mm',()=>{
 const triangle=new T.Triangle(),point=new T.Vector3();let maximum=0;
 for(const name of names){const part=study[name],g=part.geometry,p=g.attributes.position,I=g.index.array,center=part.worldToLocal(study.ball.position.clone());
  for(let i=0;i<I.length;i+=3){triangle.a.fromBufferAttribute(p,I[i]);triangle.b.fromBufferAttribute(p,I[i+1]);triangle.c.fromBufferAttribute(p,I[i+2]);if(triangle.getArea()<1e-14)continue;triangle.closestPointToPoint(center,point);maximum=Math.max(maximum,study.radius-point.distanceTo(center));}
 }
 assert(maximum<.0002,`Triangle penetration ${maximum}`);console.log(JSON.stringify({maximumTriangleIntrusionMm:maximum*1000}));
});

test('The sculpt is bounded, smooths the rear transition, and protects the fitted cup and front surface',()=>{
 for(const name of names){const p=study[name],g=p.geometry,m=g.userData.kneeMold,r=study.smoothingReports[name],trim=study.innerEdgeReports[name];
  assert(trim.minimumJacobian>.05);assert(trim.maximumInset<=.022*study.modelScale+1e-7);
  assert(r.maximumMove<=.0025*study.modelScale+1e-7);assert(r.normalEnergyAfter<r.normalEnergyBefore);
  for(const i of [...m.core,...m.rim.map(e=>e[0])])for(let k=0;k<3;k++)assert.equal(g.attributes.position.array[3*i+k],r.beforePositions[3*i+k]);
  for(let i=0;i<g.attributes.position.count;i++)if(r.beforePositions[3*i+2]>=m.center[2])for(let k=0;k<3;k++){assert.equal(g.attributes.position.array[3*i+k],r.beforePositions[3*i+k]);assert.equal(g.attributes.normal.array[3*i+k],r.beforeNormals[3*i+k]);}
  console.log(JSON.stringify({part:name,maxTrimMm:trim.maximumInset*1000,smoothingMoveMm:r.maximumMove*1000,normalEnergyBefore:r.normalEnergyBefore,normalEnergyAfter:r.normalEnergyAfter}));
 }
});

test('Static straight, 90-degree and tight-bend inspections keep both socket centers seated',()=>{
 const calf=study.calf,position=calf.position.clone(),quaternion=calf.quaternion.clone();
 for(const degrees of [0,90,130,0]){const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degrees*Math.PI/180);
  calf.position.copy(position).sub(study.ball.position).applyQuaternion(q).add(study.ball.position);calf.quaternion.copy(q).multiply(quaternion);study.group.updateMatrixWorld(true);
  assert(calf.localToWorld(new T.Vector3(...calf.geometry.userData.kneeMold.center)).distanceTo(study.ball.position)<1e-12);
 }
 assert.deepEqual(calf.position.toArray(),position.toArray());assert.deepEqual(calf.quaternion.toArray(),quaternion.toArray());
});

test('Both sculpted limbs remain closed, consistently wound solids with positive volume',()=>{
 for(const name of names){const g=study[name].geometry,p=g.attributes.position,I=g.index.array,ids=[],points=[],map=new Map();
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>Math.round(x/1e-7)).join(',');if(!map.has(key)){map.set(key,points.length);points.push(v);}ids[i]=map.get(key);}
  const edges=new Map(),used=new Set();let faces=0,volume=0;
  for(let i=0;i<I.length;i+=3){const f=Array.from(I.slice(i,i+3),j=>ids[j]);if(new Set(f).size<3)continue;const [a,b,c]=f.map(j=>points[j]);assert(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-22);faces++;volume+=a.dot(b.clone().cross(c))/6;
   for(let k=0;k<3;k++){const x=f[k],y=f[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),e=edges.get(key)||[0,0];e[0]++;e[1]+=x<y?1:-1;edges.set(key,e);used.add(x);}}
  assert([...edges.values()].every(([count,winding])=>count===2&&winding===0),name+' must be watertight');assert.equal(used.size-edges.size+faces,2);assert(volume>0);
 }
});
