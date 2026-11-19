import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createFootStudy} from '../src/foot-study.js';

const baseline=createFootStudy({ball:true}),study=createFootStudy({ball:true,calfSocket:true});
const calf=study.calf,g=calf.geometry,p=g.attributes.position,m=calf.userData.socketMold;

test('Calf socket is three-quarters of the measured foot depth, with the same ball and rounded rim',()=>{
 assert.equal(m.depthRatio,.75);assert.equal(m.ballRadius,.115);assert.equal(m.filletRadius,.0125);
 assert.equal(m.pressDepth,.75*study.foot.userData.socketMold.pressDepth);
 const probe=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide})),ray=new T.Raycaster(new T.Vector3(0,-1,0),new T.Vector3(0,1,0));
 const bottom=ray.intersectObject(probe)[0].point.y,actualDepth=bottom-m.originalBase;
 assert(Math.abs(actualDepth/m.sourceFootDepth-.75)<.001,'Actual mesh depth must match the ratio');
 assert(Math.abs(bottom-(m.center[1]+m.ballRadius))<.0001);
 const center=new T.Vector3(0,m.originalBase+.75*m.sourceFootDepth-m.ballRadius,0),v=new T.Vector3();
 assert(g.userData.moldContactIndices.length>100);
 for(const i of g.userData.moldContactIndices){
  assert(Math.abs(v.fromBufferAttribute(p,i).distanceTo(center)-.115)<1e-7);
  const expected=center.clone().sub(v).normalize(),actual=new T.Vector3().fromBufferAttribute(g.attributes.normal,i);
  assert(actual.dot(expected)>1-1e-6,'The socket shading must follow the ball, not the coarse source faces');
 }
 for(const [i,centerR,centerY] of g.userData.filletContacts){const r=Math.hypot(p.getX(i),p.getZ(i));assert(Math.abs(Math.hypot(r-centerR,p.getY(i)-centerY)-.0125)<1e-7);}
 probe.material.dispose();
});

test('Calf carving leaves the foot, seated ball and calf pose/upper body unchanged',()=>{
 for(const name of ['foot','ankleBall']){
  for(const key of ['position','normal'])assert.deepEqual(study[name].geometry.attributes[key].array,baseline[name].geometry.attributes[key].array);
  assert.deepEqual(study[name].geometry.index.array,baseline[name].geometry.index.array);
  assert.deepEqual(study[name].matrixWorld.toArray(),baseline[name].matrixWorld.toArray());
 }
 assert.deepEqual(calf.matrixWorld.toArray(),baseline.calf.matrixWorld.toArray());
 const raw=baseline.calf.geometry.attributes.position,normal=baseline.calf.geometry.attributes.normal;
 for(let i=0;i<raw.count;i++){
  assert.equal(p.getX(i),raw.getX(i));assert.equal(p.getZ(i),raw.getZ(i));assert(p.getY(i)>=raw.getY(i)-1e-8);
  if(raw.getY(i)>=-.09-1e-7){
   assert.equal(p.getY(i),raw.getY(i));for(let k=0;k<3;k++)assert.equal(g.attributes.normal.array[i*3+k],normal.array[i*3+k]);
  }
 }
 for(const attribute of Object.values(g.attributes))assert.equal(attribute.count,p.count,'No stale attribute buffers after refinement');
});

test('Calf cup is closed and outward-wound, with positive thickness and real circular rim sections',()=>{
 const source=g.index.array,unique=new Map(),vertices=[],ids=[];
 for(let i=0;i<p.count;i++){
  const point=new T.Vector3().fromBufferAttribute(p,i),key=point.toArray().map(v=>Math.round(v/1e-7)).join(',');
  if(!unique.has(key)){unique.set(key,vertices.length);vertices.push(point);}ids[i]=unique.get(key);
 }
 const edges=new Map(),used=new Set();let volume=0,faces=0;
 for(let i=0;i<source.length;i+=3){
  const face=Array.from(source.slice(i,i+3),v=>ids[v]);if(new Set(face).size<3)continue;
  const [a,b,c]=face.map(v=>vertices[v]);assert(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-20);
  faces++;volume+=a.dot(b.clone().cross(c))/6;
  for(let k=0;k<3;k++){const x=face[k],y=face[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),entry=edges.get(key)||[0,0];entry[0]++;entry[1]+=x<y?1:-1;edges.set(key,entry);used.add(x);}
 }
 assert(volume>0);assert.equal(used.size-edges.size+faces,2);assert([...edges.values()].every(([n,w])=>n===2&&w===0));
 assert([...p.array,...g.attributes.normal.array].every(Number.isFinite));
 const probe=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide})),ray=new T.Raycaster();let samples=0;
 // Avoid exact UV seams/pole axes for intersection rays; topology is checked above.
 for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){
  const x=i*.03+.00037,z=j*.03+.00023;
  if(Math.hypot(x,z)>.091)continue;ray.set(new T.Vector3(x,-1,z),new T.Vector3(0,1,0));
  const heights=ray.intersectObject(probe).map(h=>h.point.y).sort((a,b)=>a-b).filter((v,i,a)=>i===0||Math.abs(v-a[i-1])>1e-6);
  assert.equal(heights.length,2);assert(heights[1]-heights[0]>.20);samples++;
 }
 assert(samples>20);
 for(const section of g.userData.filletSections){
  const points=[.2,.5,.8].map(t=>{const r=section.innerR+(section.outerR-section.innerR)*t;ray.set(new T.Vector3(Math.cos(section.theta)*r,-1,Math.sin(section.theta)*r),new T.Vector3(0,1,0));return new T.Vector2(r,ray.intersectObject(probe)[0].point.y);});
  const [a,b,c]=points,area2=Math.abs(b.clone().sub(a).cross(c.clone().sub(a))),radius=a.distanceTo(b)*b.distanceTo(c)*a.distanceTo(c)/(2*area2);
  assert(Math.abs(radius-.0125)<.0008,'The underside rim must be physically rounded');
 }
 probe.material.dispose();
});
