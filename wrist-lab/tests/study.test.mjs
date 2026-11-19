import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createWristStudy,WRIST_STUDY} from '../src/study.js';
import {createForearmHandAssembly} from '../../avatar/src/hand-study/assembly.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';

const reference=createForearmHandAssembly(new T.MeshStandardMaterial()),study=createWristStudy();
test('The wrist study keeps the original forearm and hand geometry, orientation and scale',()=>{
 for(const name of ['forearm','hand']){
  for(const key of ['position','normal'])assert.deepEqual(study[name].geometry.attributes[key].array,reference[name].geometry.attributes[key].array);
  assert.deepEqual(study[name].geometry.index.array,reference[name].geometry.index.array);
  assert.deepEqual(study[name].quaternion.toArray(),reference[name].quaternion.toArray());assert.deepEqual(study[name].scale.toArray(),reference[name].scale.toArray());
 }
 assert.equal(study.group.children.length,3);assert.equal(study.hand.material.color.getHex(),study.forearm.material.color.getHex());
});
test('One ball is 90% of the narrower forearm width, at the existing wrist point',()=>{
 const size=new T.Box3().setFromObject(study.forearm).getSize(new T.Vector3());
 assert(Math.abs(study.diameter-Math.min(size.x,size.z)*WRIST_STUDY.diameterRatio)<1e-12);
 assert.equal(study.ball.geometry.parameters.radius,study.diameter/2);
 assert.deepEqual(study.ball.position.toArray(),SIDE.find(b=>b.name==='hand').head);
 assert(study.diameter<size.x&&study.diameter<size.z);
});
test('Forearm, ball and hand form a centered vertical column with equal visible gaps',()=>{
 const upper=new T.Box3().setFromObject(study.forearm),middle=new T.Box3().setFromObject(study.ball),lower=new T.Box3().setFromObject(study.hand);
 assert(Math.abs(upper.min.y-middle.max.y-WRIST_STUDY.gap)<1e-7);assert(Math.abs(middle.min.y-lower.max.y-WRIST_STUDY.gap)<1e-7);
 for(const box of [upper,middle,lower]){const center=box.getCenter(new T.Vector3());assert(Math.abs(center.x-study.ball.position.x)<1e-7);assert(Math.abs(center.z-study.ball.position.z)<1e-7);}
 for(const part of study.group.children)assert([...part.geometry.attributes.position.array,...part.geometry.attributes.normal.array].every(Number.isFinite));
 console.log(JSON.stringify({ballDiameter:study.diameter,gap:WRIST_STUDY.gap,originalGeometry:true,parts:3}));
});

test('The fresh forearm has a solid rounded end and preserves the cylinder and elbow exactly',()=>{
 const fresh=createWristStudy({stage:'rounded'}),g=fresh.forearm.geometry,p=g.attributes.position,n=g.attributes.normal,data=g.userData.roundedEnd,old=reference.forearm.geometry;
 for(let i=0;i<data.upperCount;i++)for(let k=0;k<3;k++){
  assert.equal(p.array[3*i+k],old.attributes.position.array[3*data.sourceUpperIds[i]+k]);assert.equal(n.array[3*i+k],old.attributes.normal.array[3*data.sourceUpperIds[i]+k]);
 }
 assert.equal(g.userData.socketDepth,undefined);assert.equal(p.getY(data.pole),data.bottom);
 const ray=new T.Raycaster(new T.Vector3(0,data.bottom-1,0),new T.Vector3(0,1,0)),mesh=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}));
 assert(Math.abs(ray.intersectObject(mesh)[0].point.y-data.bottom)<1e-7);
 for(let i=data.upperCount+1;i<p.count;i++)assert(Math.abs((p.getX(i)/data.rx)**2+((p.getY(i)-data.join)/data.height)**2+(p.getZ(i)/data.rz)**2-1)<1e-6,'The new end is a real smooth ellipsoid');
 mesh.material.dispose();
});

const fitted=createWristStudy({stage:'molded'});
test('Hand growth is a small surface expansion; its scale, orientation and skeleton point stay fixed',()=>{
 const source=reference.hand.geometry.attributes.position,p=fitted.hand.geometry.attributes.position,v=new T.Vector3(),w=new T.Vector3();let count=0;
 assert.equal(source.count,p.count);assert.deepEqual(fitted.hand.scale.toArray(),reference.hand.scale.toArray());assert.deepEqual(fitted.hand.quaternion.toArray(),reference.hand.quaternion.toArray());
 for(let i=0;i<source.count;i++)if(source.getY(i)<-.03){const distance=v.fromBufferAttribute(p,i).distanceTo(w.fromBufferAttribute(source,i))*fitted.hand.scale.x;assert(Math.abs(distance-.002)<1e-7);count++;}
 assert(count>1000);assert.deepEqual(fitted.ball.position.toArray(),SIDE.find(b=>b.name==='hand').head);
});
test('Static sockets capture one-third of the actual ball in the forearm and a shallower cap in the hand',()=>{
 assert.deepEqual(fitted.ball.position.toArray(),SIDE.find(b=>b.name==='hand').head);let fitError=0,rimError=0,centerError=0;
 for(const [name,fraction] of [['forearm',1/3],['hand',1/7]]){
  const part=fitted[name],g=part.geometry,m=g.userData.wristMold,p=g.attributes.position,M=new T.Matrix4().fromArray(m.toMold),center=new T.Vector3(...m.moldCenter),v=new T.Vector3();
  assert.equal(m.depthFraction,fraction);assert.equal(m.socketDepth,fitted.diameter*fraction);assert.equal(m.ballRadius,fitted.radius);assert(m.core.length>100&&m.rim.length>100);
  centerError=Math.max(centerError,part.localToWorld(new T.Vector3(...m.center)).distanceTo(fitted.ball.position));
  for(const i of m.core)fitError=Math.max(fitError,Math.abs(v.fromBufferAttribute(p,i).applyMatrix4(M).distanceTo(center)-fitted.radius));
  for(const [i,r,y] of m.rim){v.fromBufferAttribute(p,i).applyMatrix4(M);rimError=Math.max(rimError,Math.abs(Math.hypot(Math.hypot(v.x-center.x,v.z-center.z)-r,v.y-y)-m.filletRadius));}
  const clone=g.clone().applyMatrix4(M),probe=new T.Mesh(clone,new T.MeshBasicMaterial({side:T.DoubleSide})),ray=new T.Raycaster(new T.Vector3(center.x,center.y+1,center.z),new T.Vector3(0,-1,0));
  const surface=ray.intersectObject(probe)[0].point.y;assert(Math.abs(m.originalHeight-surface-m.pressDepth)<.0001,'Actual mold press');
  const depths=m.sections.map(s=>{ray.set(new T.Vector3(center.x+Math.cos(s.theta)*s.innerR,center.y+1,center.z+Math.sin(s.theta)*s.innerR),new T.Vector3(0,-1,0));const hit=ray.intersectObject(probe)[0];assert(hit,'Contact-rim probe must hit the mesh');return hit.point.y-surface;});
  // A ray at this steep spherical rim amplifies the flat triangle's tiny
  // chord error. Keep the independent full-triangle sphere check at 0.2mm;
  // allow 0.25mm here for the measured axial capture depth.
  const mean=depths.reduce((a,b)=>a+b,0)/depths.length;console.log(JSON.stringify({part:name,rayDepth:mean,target:m.socketDepth,measured:m.measuredDepth,depths}));assert(Math.abs(mean-m.socketDepth)<.00025,`${name}: ray-measured cap ${mean} must match ${m.socketDepth}`);clone.dispose();probe.material.dispose();
 }
 assert(centerError<1e-12);assert(fitError<1e-7);assert(rimError<1e-7);assert.equal(fitted.hand.userData.surfaceGrowth,.002);
 console.log(JSON.stringify({capturedForearm:fitted.diameter/3,capturedHand:fitted.diameter/7,centerError,fitError,rimError,handGrowth:.002}));
});

test('Both fitted body parts remain closed outward-wound solids with positive volume',()=>{
 for(const name of ['forearm','hand']){
  const g=fitted[name].geometry,p=g.attributes.position,I=g.index.array,ids=[],points=[],map=new Map();
  assert([...p.array,...g.attributes.normal.array].every(Number.isFinite));for(const a of Object.values(g.attributes))assert.equal(a.count,p.count);
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>Math.round(x/1e-7)).join(',');if(!map.has(key)){map.set(key,points.length);points.push(v);}ids[i]=map.get(key);}
  const edges=new Map(),used=new Set();let faces=0,volume=0;
  for(let i=0;i<I.length;i+=3){const f=Array.from(I.slice(i,i+3),j=>ids[j]);if(new Set(f).size<3)continue;const [a,b,c]=f.map(j=>points[j]);assert(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-22,name+' collapsed face');faces++;volume+=a.dot(b.clone().cross(c))/6;for(let k=0;k<3;k++){const x=f[k],y=f[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),e=edges.get(key)||[0,0];e[0]++;e[1]+=x<y?1:-1;edges.set(key,e);used.add(x);}}
  assert([...edges.values()].every(([count,winding])=>count===2&&winding===0),name+' closed directed edges');assert.equal(used.size-edges.size+faces,2);assert(volume>0);
 }
});

test('Every actual socket triangle clears the static ball within the ball mesh accuracy',()=>{
 const triangle=new T.Triangle(),point=new T.Vector3();let penetration=0;
 for(const name of ['forearm','hand']){
  const part=fitted[name],g=part.geometry,p=g.attributes.position,I=g.index.array,center=part.worldToLocal(fitted.ball.position.clone());
  for(let i=0;i<I.length;i+=3){triangle.a.fromBufferAttribute(p,I[i]);triangle.b.fromBufferAttribute(p,I[i+1]);triangle.c.fromBufferAttribute(p,I[i+2]);if(triangle.getArea()<1e-14)continue;triangle.closestPointToPoint(center,point);part.localToWorld(point);penetration=Math.max(penetration,fitted.radius-point.distanceTo(fitted.ball.position));}
 }
 assert(penetration<.0002,`Actual triangle intrusion: ${penetration}`);console.log(JSON.stringify({maximumTriangleIntrusion:penetration}));
});
