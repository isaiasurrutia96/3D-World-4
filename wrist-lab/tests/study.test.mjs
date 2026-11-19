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
