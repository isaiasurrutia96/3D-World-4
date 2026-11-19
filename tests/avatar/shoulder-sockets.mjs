import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createShoulderDesign,SHOULDER_DESIGN} from '../../avatar/src/joints/shoulder-design.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';

const skeleton=JSON.stringify(SIDE),s=createShoulderDesign(),names=['torso','upperArm'];

test('Only one shoulder ball is created, exactly at the unchanged skeleton point',()=>{
 assert.equal(JSON.stringify(SIDE),skeleton);assert.deepEqual(s.ball.position.toArray(),SIDE.find(b=>b.name==='upperArm').head);
 assert.equal(s.ball.userData.skeletonJoint,'upperArm.L');assert.equal(s.group.children.length,3);assert.equal(s.group.children.filter(p=>p.geometry instanceof T.SphereGeometry).length,1);
 assert.equal(s.radius,SHOULDER_DESIGN.topRadius*SHOULDER_DESIGN.diameterRatio);
 const original=s.source.upperArm.positions;let measuredRadius=0;
 for(let i=0;i<original.length;i+=3)if(Math.abs(original[i+1]-.07)<1e-6)measuredRadius=Math.max(measuredRadius,Math.hypot(original[i],original[i+2]));
 assert(measuredRadius>0);assert(Math.abs(s.radius/measuredRadius-SHOULDER_DESIGN.diameterRatio)<1e-6);
 console.log(JSON.stringify({ballDiameterCm:s.diameter*100,sourceTopWidthCm:measuredRadius*200,pivot:s.ball.position.toArray()}));
});

test('The side-facing torso cup and upper-facing arm cup fit the same real sphere with tangent soft lips',()=>{
 const v=new T.Vector3();let sphereError=0,rimError=0,tangentAngleError=0;
 for(const name of names){const part=s[name],g=part.geometry,m=g.userData.shoulderMold,p=g.attributes.position,M=new T.Matrix4().fromArray(m.toMold),center=new T.Vector3(...m.moldCenter);
  assert.equal(m.ballRadius,s.radius);assert.equal(m.filletRadius,SHOULDER_DESIGN.filletRadius);assert(m.core.length>100&&m.rim.length>100);assert(Math.abs(m.measuredDepth-s.diameter*SHOULDER_DESIGN.capture)<1e-6);
  for(const i of m.core)sphereError=Math.max(sphereError,Math.abs(v.fromBufferAttribute(p,i).applyMatrix4(M).distanceTo(center)-s.radius));
  for(const [i,r,y] of m.rim){v.fromBufferAttribute(p,i).applyMatrix4(M);rimError=Math.max(rimError,Math.abs(Math.hypot(Math.hypot(v.x-center.x,v.z-center.z)-r,v.y-y)-m.filletRadius));}
  for(const q of m.sections){const a=-(q.innerR-q.centerR)/(q.innerY-q.centerY),b=q.innerR/Math.sqrt(s.radius*s.radius-q.innerR*q.innerR),c=-(q.outerR-q.centerR)/(q.outerY-q.centerY);tangentAngleError=Math.max(tangentAngleError,Math.abs(Math.atan(a)-Math.atan(b)),Math.abs(Math.atan(c)-Math.atan(q.slope)));}
 }
 assert(sphereError<1e-7);assert(rimError<1e-7);assert(tangentAngleError<1e-7);console.log(JSON.stringify({sphereError,rimError,tangentAngleError,filletMm:SHOULDER_DESIGN.filletRadius*1000}));
});

test('The other shoulder, torso away from the new cup, and the accepted hip sockets remain exact',()=>{
 const g=s.torso.geometry,old=s.source.torso,p=g.attributes.position,n=g.attributes.normal,point=s.ball.position;let count=0,hipCount=0;
 for(let i=0;i<old.positions.length/3;i++){
  const x=old.positions[3*i],y=old.positions[3*i+1],z=old.positions[3*i+2];
  if(x>0&&Math.hypot(y-point.y,z-point.z)<.131)continue;count++;if(y<=1.0)hipCount++;
  for(let k=0;k<3;k++){assert.equal(p.array[3*i+k],old.positions[3*i+k]);assert.equal(n.array[3*i+k],old.normals[3*i+k]);}
 }
 assert(count>10000&&hipCount>10000);assert.equal(g.userData.hipMolds,old.hipMolds);console.log(JSON.stringify({protectedTorsoVertices:count,protectedHipVertices:hipCount}));
});

test('Torso lip normals follow the smooth rolling fillet instead of the coarse original facets',()=>{
 const g=s.torso.geometry,m=g.userData.shoulderMold,M=new T.Matrix4().fromArray(m.toMold),p=new T.Vector3(),n=new T.Vector3();let maximumAngle=0;
 for(const [i,rc,yc] of m.rim){
  p.fromBufferAttribute(g.attributes.position,i).applyMatrix4(M);n.fromBufferAttribute(g.attributes.normal,i).transformDirection(M);
  const x=p.x-m.moldCenter[0],z=p.z-m.moldCenter[2],r=Math.hypot(x,z),radial=n.x*x/r+n.z*z/r;
  maximumAngle=Math.max(maximumAngle,Math.abs(Math.atan2(radial,n.y)-Math.atan2(r-rc,p.y-yc)));
 }
 assert(maximumAngle<1e-5,`Fillet normal angular error ${maximumAngle}`);console.log(JSON.stringify({maximumLipNormalErrorRadians:maximumAngle}));
});

test('The approved elbow end of the actual upper arm retains its exact vertices, normals and mold',()=>{
 const g=s.upperArm.geometry,old=s.source.upperArm;let count=0;
 for(let i=0;i<old.positions.length/3;i++)if(old.positions[3*i+1]<=0){count++;for(let k=0;k<3;k++){assert.equal(g.attributes.position.array[3*i+k],old.positions[3*i+k]);assert.equal(g.attributes.normal.array[3*i+k],old.normals[3*i+k]);}}
 assert(count>1000);assert.equal(g.userData.elbowMold,old.elbowMold);console.log(JSON.stringify({protectedElbowVertices:count}));
});

test('The marked edge is a continuous sloping trim with a softly rounded boundary',()=>{
 const g=s.upperArm.geometry,p=g.attributes.position,m=g.userData.shoulderMold,r=s.clearance,used=new Set(g.index.array);
 assert(r.clippedFaces>100);assert(r.loops>0);assert(r.maximumBevelMove<=.0015+1e-7);
 for(const i of used)assert(p.getX(i)-.5*p.getY(i)+.11>=-1e-7,'No retained point can form a lip outside the sloped cut');
 for(const i of [...m.core,...m.rim.map(([i])=>i)])for(let k=0;k<3;k++)assert.equal(p.array[3*i+k],r.beforePositions[3*i+k]);
 function volume(a,I){const A=new T.Vector3(),B=new T.Vector3(),C=new T.Vector3();let v=0;for(let i=0;i<I.length;i+=3){A.fromArray(a,3*I[i]);B.fromArray(a,3*I[i+1]);C.fromArray(a,3*I[i+2]);v+=A.dot(B.cross(C))/6;}return v;}
 const retained=volume(p.array,g.index.array)/volume(r.beforePositions,r.beforeIndex);assert(retained>.85&&retained<=1.000001);
 console.log(JSON.stringify({clippedFaces:r.clippedFaces,trimLoops:r.loops,maximumBevelMm:r.maximumBevelMove*1000,volumeRetained:retained}));
});

test('The sloped cut has a smoother normal field without changing protected parts',()=>{
 assert(s.clearance.normalEnergy.before>0);assert(s.clearance.normalEnergy.after<s.clearance.normalEnergy.before*.7);console.log(JSON.stringify({trimNormalEnergy:s.clearance.normalEnergy}));
});

test('The existing static rest angle reduces marked upper-arm overlap while keeping the ball seated',()=>{
 s.inspectRest();const bone=SIDE.find(b=>b.name==='upperArm'),q=new T.Quaternion().setFromEuler(new T.Euler(...[bone.rest.x,bone.rest.y,bone.rest.z].map(T.MathUtils.degToRad),'XYZ'));
 assert.deepEqual(s.upperArm.quaternion.toArray(),q.toArray());for(const name of names)assert(s[name].localToWorld(new T.Vector3(...s[name].geometry.userData.shoulderMold.center)).distanceTo(s.ball.position)<1e-12);
 console.log(JSON.stringify({restOverlapBeforeMm:s.overlap.before*1000,restOverlapAfterMm:s.overlap.after*1000,samples:s.overlap.samples}));
 assert(s.overlap.samples>100);assert(s.overlap.before>0);assert(s.overlap.after<=s.overlap.before+1e-6);s.separate();
});

test('Both sockets seat at the fixed ball without changing source scales or orientations',()=>{
 s.separate(false);for(const name of names){const part=s[name],m=part.geometry.userData.shoulderMold;assert(part.localToWorld(new T.Vector3(...m.center)).distanceTo(s.ball.position)<1e-12);assert.deepEqual(part.scale.toArray(),[1,1,1]);assert.deepEqual(part.quaternion.toArray(),[0,0,0,1]);}
 assert.equal(s.torso.position.y,0);assert.equal(s.torso.position.z,0);s.separate(true);
});

test('Separated parts have 45 mm of real clearance and return exactly after repeated seating',()=>{
 const before=s.group.children.map(p=>[p.position.toArray(),p.quaternion.toArray(),p.scale.toArray()]);
 assert(Math.abs(s.ball.position.x-s.radius-(s.torso.position.x+s.torso.geometry.boundingBox.max.x)-SHOULDER_DESIGN.gap)<1e-12);
 assert(Math.abs(s.ball.position.y-s.radius-(s.upperArm.position.y+s.upperArm.geometry.boundingBox.max.y)-SHOULDER_DESIGN.gap)<1e-12);
 for(let i=0;i<3;i++){s.separate(false);s.separate(true);}assert.deepEqual(s.group.children.map(p=>[p.position.toArray(),p.quaternion.toArray(),p.scale.toArray()]),before);
});

test('Every actual socket triangle clears the seated ball within 0.2 mm',()=>{
 s.separate(false);const triangle=new T.Triangle(),point=new T.Vector3();let maximum=0;
 for(const name of names){const part=s[name],g=part.geometry,p=g.attributes.position,I=g.index.array,center=part.worldToLocal(s.ball.position.clone());
  for(let i=0;i<I.length;i+=3){triangle.a.fromBufferAttribute(p,I[i]);triangle.b.fromBufferAttribute(p,I[i+1]);triangle.c.fromBufferAttribute(p,I[i+2]);if(triangle.getArea()<1e-14)continue;triangle.closestPointToPoint(center,point);maximum=Math.max(maximum,s.radius-point.distanceTo(center));}
 }
 s.separate(true);assert(maximum<.0002,`Actual ball intrusion ${maximum}`);console.log(JSON.stringify({maximumTriangleIntrusionMm:maximum*1000}));
});

test('Both sculpted parts remain finite, closed outward-wound solids with positive volume',()=>{
 for(const name of names){const g=s[name].geometry,p=g.attributes.position,I=g.index.array,ids=[],points=[],map=new Map();
  for(const a of Object.values(g.attributes)){assert.equal(a.count,p.count);assert(a.array.every(Number.isFinite));}
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>Math.round(x/1e-7)).join(',');if(!map.has(key)){map.set(key,points.length);points.push(v);}ids[i]=map.get(key);}
  const edges=new Map(),used=new Set();let faces=0,volume=0;
  for(let i=0;i<I.length;i+=3){const f=Array.from(I.subarray(i,i+3),j=>ids[j]);if(new Set(f).size<3)continue;const [a,b,c]=f.map(j=>points[j]);assert(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-22);faces++;volume+=a.dot(b.clone().cross(c))/6;
   for(let k=0;k<3;k++){const x=f[k],y=f[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),e=edges.get(key)||[0,0];e[0]++;e[1]+=x<y?1:-1;edges.set(key,e);used.add(x);}}
  assert([...edges.values()].every(([count,winding])=>count===2&&winding===0),name+' closed edge winding');assert.equal(used.size-edges.size+faces,2);assert(volume>0);
 }
});
