import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {readFile} from 'node:fs/promises';import {deserialize} from 'node:v8';
import {buildJointAssembly} from '../../avatar/src/joint-assembly/build.js';
import {verifyStudyAsset} from '../../scripts/bake-study.mjs';
import {bindJointAssembly} from '../../avatar/src/joint-assembly/bind.js';
import {CENTRE,SIDE,FINGERS} from '../../motion-core/skeleton/bones.js';
const before=JSON.stringify({CENTRE,SIDE,FINGERS});
const input=process.env.JOINT_ASSEMBLY_INPUT?deserialize(await readFile(process.env.JOINT_ASSEMBLY_INPUT)):(await import('../../avatar/src/joint-assembly/collect.js')).collectApprovedJointParts();
const {sources,baseline}=input;
const a=buildJointAssembly(sources,baseline),meshes=a.group.children,balls=meshes.filter(m=>m.userData.assembly.ball),sockets=meshes.flatMap(mesh=>mesh.userData.assembly.sockets.map(socket=>({mesh,...socket}))),world=(mesh,p)=>point(p).applyMatrix4(mesh.matrixWorld),point=a=>new T.Vector3(...a);

test('Exactly twelve balls use the twelve unchanged skeleton joint points',()=>{
 assert.equal(JSON.stringify({CENTRE,SIDE,FINGERS}),before);assert.equal(balls.length,12);assert.equal(new Set(balls.map(m=>m.userData.assembly.ball.bone)).size,12);
 for(const m of balls){const b=m.userData.assembly.ball;assert.deepEqual(m.position.toArray(),a.skeleton.bones[a.skeleton.index.get(b.bone)].head);assert.deepEqual(m.scale.toArray(),[1,1,1]);const p=m.geometry.attributes.position;let max=0;for(let i=0;i<p.count;i++)max=Math.max(max,Math.abs(new T.Vector3().fromBufferAttribute(p,i).length()-b.radius));assert(max<1e-7);}
});
test('All 24 actual cup centers coincide with their corresponding ball',()=>{
 assert.equal(sockets.length,24);let max=0;for(const s of sockets){const b=balls.find(m=>m.userData.assembly.ball.bone===s.bone);max=Math.max(max,world(s.mesh,s.center).distanceTo(b.position));assert(Math.abs(s.radius-b.userData.assembly.ball.radius)<1e-12);}
 assert(max<1e-12);console.log({socketCenterErrorMeters:max});
});
test('Actual spherical contacts remain fitted after both ends of each limb are seated',()=>{
 let max=0;for(const s of sockets){const p=s.mesh.geometry.attributes.position,center=world(s.mesh,s.center);for(const i of s.core)max=Math.max(max,Math.abs(world(s.mesh,[p.getX(i),p.getY(i),p.getZ(i)]).distanceTo(center)-s.radius));}const old=sources['elbow.forearm'],m=old.geometry.userData.wristMold;let originalError=0;for(const i of m.core)originalError=Math.max(originalError,Math.abs(new T.Vector3().fromArray(old.geometry.attributes.position.array,3*i).distanceTo(point(m.center))-m.ballRadius));assert(max<=originalError+1e-7,`Contact error ${max} exceeds approved source ${originalError}`);console.log({sphereContactErrorMm:max*1000,approvedSourceContactErrorMm:originalError*1000});
});
test('Shaft fitting has positive stretch and leaves both end cups rigid',()=>{
 for(const [name,r]of Object.entries(a.reports.limbs)){assert(r.minimumStretch>.15);const mesh=meshes.find(m=>m.name===name),p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,axis=point(r.axis),origin=point(r.proximal.center);let count=0;
  for(let i=0;i<r.sourcePositions.length/3;i++){const old=new T.Vector3().fromArray(r.sourcePositions,3*i),s=old.clone().sub(origin).dot(axis);if(s>r.lo&&s<r.hi)continue;const expected=old.addScaledVector(axis,s>=r.hi?r.change:0);assert(new T.Vector3().fromBufferAttribute(p,i).distanceTo(expected)<1e-7);for(let k=0;k<3;k++)assert.equal(n.array[3*i+k],r.sourceNormals[3*i+k]);count++;}assert(count>1000);
 }
 assert(a.reports.torso.minimumDeterminant>.2);console.log({shaftMinimumStretch:Object.fromEntries(Object.entries(a.reports.limbs).map(([k,v])=>[k,v.minimumStretch])),torsoMinimumJacobian:a.reports.torso.minimumDeterminant});
});
test('The original head, neck and hand/foot shapes stay unchanged',()=>{
 for(const name of ['head','neck']){const m=meshes.find(p=>p.name===name),old=baseline[name];assert.deepEqual(m.matrixWorld.toArray(),old.matrix);for(const [k,v]of Object.entries(old.geometry.attributes))assert.deepEqual(m.geometry.attributes[k].array,v.array);assert.deepEqual(m.geometry.index.array,old.geometry.index);}
 for(const [name,key]of [['hand.L','wrist.hand'],['foot.L','ankle.foot']]){const m=meshes.find(p=>p.name===name),old=sources[key];for(const [k,v]of Object.entries(old.geometry.attributes))assert.deepEqual(m.geometry.attributes[k].array,v.array);assert.deepEqual(m.geometry.index.array,old.geometry.index);}
});
test('The existing internal chest seam is retained in the assembled chest and pelvis',()=>{
 for(const [name,r]of Object.entries(a.reports.torso.parts)){const mesh=meshes.find(m=>m.name===name),p=mesh.geometry.attributes.position,P=r.baseline.attributes.position,rows=P.count/161;let count=0;for(const [old,i]of r.oldMap){assert(new T.Vector3().fromBufferAttribute(p,i).distanceTo(new T.Vector3().fromBufferAttribute(P,old))<(old%rows===r.joinRow?1e-7:1e-9));assert(new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.normal,i).distanceTo(new T.Vector3().fromBufferAttribute(r.baseline.attributes.normal,old))<1e-9);count++;}assert(count>1000);}
});
test('Both sides mirror exactly, with correct outward triangle winding',()=>{
 for(const left of meshes.filter(m=>m.name.endsWith('.L')&&!m.userData.assembly.ball)){const right=meshes.find(m=>m.name===left.name.replace('.L','.R'));assert(right);const P=left.geometry.attributes.position,Q=right.geometry.attributes.position;assert.equal(P.count,Q.count);
  for(let i=0;i<P.count;i++){const l=new T.Vector3().fromBufferAttribute(P,i).applyMatrix4(left.matrixWorld),r=new T.Vector3().fromBufferAttribute(Q,i).applyMatrix4(right.matrixWorld);l.x=-l.x;assert(l.distanceTo(r)<1e-10);}
 }
});
test('All joined shells are finite, watertight, consistently wound solids',()=>{
 for(const mesh of meshes){const g=mesh.geometry,p=g.attributes.position,I=g.index.array,map=new Map(),ids=[],points=[],E=new Map(),used=new Set();let faces=0,volume=0,minimum=Infinity;
  for(const v of Object.values(g.attributes))assert(v.array.every(Number.isFinite));
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(x=>Math.round(x/1e-7)).join(',');if(!map.has(key)){map.set(key,points.length);points.push(v);}ids[i]=map.get(key);}
  for(let i=0;i<I.length;i+=3){const f=[ids[I[i]],ids[I[i+1]],ids[I[i+2]]];if(new Set(f).size<3)continue;const [A,B,C]=f.map(j=>points[j]),area=B.clone().sub(A).cross(C.clone().sub(A)).lengthSq();minimum=Math.min(minimum,area);faces++;volume+=A.dot(B.clone().cross(C))/6;for(let k=0;k<3;k++){const x=f[k],y=f[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),entry=E.get(key)??[0,0];entry[0]++;entry[1]+=x<y?1:-1;E.set(key,entry);used.add(x);}}
  const bad=[...E.values()].filter(([count,w])=>count!==2||w!==0).length;assert.equal(bad,0,mesh.name+' open edges');assert.equal(used.size-E.size+faces,2,mesh.name+' sphere topology');assert(volume>0,mesh.name+' positive volume');assert(minimum>1e-22,mesh.name+' no degenerate faces');
 }
});
test('Every actual cup triangle clears its ball within the unchanged 0.2 mm tolerance',()=>{
 let max=0;const triangle=new T.Triangle(),nearest=new T.Vector3();for(const s of sockets){const mesh=s.mesh,p=mesh.geometry.attributes.position,I=mesh.geometry.index.array,center=point(s.center),r=s.radius/mesh.scale.x;for(let i=0;i<I.length;i+=3){triangle.a.fromBufferAttribute(p,I[i]);triangle.b.fromBufferAttribute(p,I[i+1]);triangle.c.fromBufferAttribute(p,I[i+2]);if(triangle.getArea()<1e-14)continue;triangle.closestPointToPoint(center,nearest);max=Math.max(max,(r-nearest.distanceTo(center))*mesh.scale.x);}}
 assert(max<.0002,`Actual triangle intrusion ${max}`);console.log({actualTriangleIntrusionMm:max*1000});
});

test('The saved avatar asset exactly matches the rebuilt geometry and placements',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../../avatar/assembled-joints/manifest.json',import.meta.url)));verifyStudyAsset(a,await readFile(new URL('../../avatar/assembled-joints/'+manifest.asset,import.meta.url)));
});

test('Static limb poses rotate about joint dots, keep both cup centers seated, and reset exactly',()=>{
 const rig=bindJointAssembly(a),original=rig.attached.map(a=>({matrix:a.mesh.matrix.toArray(),position:a.mesh.geometry.attributes.position.array.slice(),normal:a.mesh.geometry.attributes.normal.array.slice()}));let maximum=0;
 const poses=[{},{'upperArm.L':{x:-65,z:45},'lowerArm.L':{x:-100},'hand.L':{x:35,z:10}}, {'thigh.L':{x:-65,z:15},'shin.L':{x:110},'foot.L':{x:30,z:12}}, {root:{position:[4,2,-3],rotation:{x:10,y:75,z:-5}},'lowerArm.R':{x:-130},'shin.R':{x:125}}];
 for(const pose of [...poses,...poses.map(p=>rig.skeleton.mirrorPose(p))]){
  rig.apply(pose);for(const part of rig.attached){if(part.ball)maximum=Math.max(maximum,new T.Vector3().setFromMatrixPosition(part.mesh.matrixWorld).distanceTo(rig.solved.get(part.ball.bone).head));for(const socket of part.sockets)maximum=Math.max(maximum,new T.Vector3(...socket.center).applyMatrix4(part.mesh.matrixWorld).distanceTo(rig.solved.get(socket.bone).head));}
 }
 assert(maximum<1e-12,`Joint wobble ${maximum}`);rig.apply(rig.skeleton.restPose());for(const [i,p]of rig.attached.entries()){assert.deepEqual(p.mesh.matrix.toArray(),original[i].matrix);assert.deepEqual(p.mesh.geometry.attributes.position.array,original[i].position);assert.deepEqual(p.mesh.geometry.attributes.normal.array,original[i].normal);}console.log({staticPoseJointCenterErrorMeters:maximum});
});

test('30, 60, 120 and 144 updates per second produce the same final pose and no joint drift',()=>{
 const rig=bindJointAssembly(a),ends=[];let maximum=0;
 for(const fps of [30,60,120,144]){for(let i=0;i<=fps;i++){const t=i/fps,solved=rig.apply({'upperArm.L':{x:-25-15*Math.sin(2*Math.PI*t),z:30},'lowerArm.L':{x:-70-25*Math.sin(2*Math.PI*t)},'shin.R':{x:50+30*Math.sin(2*Math.PI*t)}});for(const p of rig.attached)for(const s of p.sockets)maximum=Math.max(maximum,new T.Vector3(...s.center).applyMatrix4(p.mesh.matrixWorld).distanceTo(solved.get(s.bone).head));}ends.push(rig.attached.map(p=>p.mesh.matrix.toArray()));}
 for(const end of ends)assert.deepEqual(end,ends[0]);assert(maximum<1e-12);rig.apply(rig.skeleton.restPose());console.log({fps:[30,60,120,144],maximumJointDriftMeters:maximum});
});
