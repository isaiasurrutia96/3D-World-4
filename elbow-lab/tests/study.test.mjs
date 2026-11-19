import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createElbowStudy,ELBOW_STUDY} from '../src/study.js';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';
import {createWristStudy} from '../../wrist-lab/src/study.js';
import {SIDE} from '../../motion-core/skeleton/bones.js';

const study=createElbowStudy(),rig=createCharacterRig({plain:true}),wrist=createWristStudy({stage:'molded'});
test('The original upper arm and approved forearm keep their exact shapes and local orientations',()=>{
 for(const [part,original] of [[study.upperArm,rig.shoulderRight.children[0]],[study.forearm,wrist.forearm]]){
  assert.deepEqual(Object.keys(part.geometry.attributes),Object.keys(original.geometry.attributes));
  for(const key of Object.keys(original.geometry.attributes))assert.deepEqual(part.geometry.attributes[key].array,original.geometry.attributes[key].array);
  assert.deepEqual(part.geometry.index.array,original.geometry.index.array);
  assert.deepEqual(part.quaternion.toArray(),original.quaternion.toArray());assert.deepEqual(part.scale.toArray(),original.scale.toArray());
  assert.equal(part.material.color.getHex(),original.material.color.getHex());
 }
 assert.deepEqual(study.forearm.geometry.userData,wrist.forearm.geometry.userData);
 assert.equal(study.group.children.length,3);assert(study.group.children.every(part=>part.isMesh));
});
test('The ball is slightly narrower than both limbs and centered on the existing elbow joint',()=>{
 const widths=[study.upperArm,study.forearm].flatMap(part=>{const size=new T.Box3().setFromObject(part).getSize(new T.Vector3());return [size.x,size.z];});
 assert(Math.abs(study.diameter-Math.min(...widths)*ELBOW_STUDY.diameterRatio)<1e-12);
 assert(widths.every(width=>study.diameter<width));assert.equal(study.ball.geometry.parameters.radius,study.radius);
 assert.deepEqual(study.ball.position.toArray(),SIDE.find(b=>b.name==='lowerArm').head);
 assert.equal(study.ball.userData.skeletonJoint,'lowerArm.L');
});
test('All three parts are centered and separated by equal 45 mm gaps, with finite geometry',()=>{
 const upper=new T.Box3().setFromObject(study.upperArm),middle=new T.Box3().setFromObject(study.ball),lower=new T.Box3().setFromObject(study.forearm);
 const gaps=[upper.min.y-middle.max.y,middle.min.y-lower.max.y];
 for(const gap of gaps)assert(Math.abs(gap-ELBOW_STUDY.gap)<1e-7);
 for(const box of [upper,middle,lower]){const center=box.getCenter(new T.Vector3());assert(Math.abs(center.x-study.ball.position.x)<1e-7);assert(Math.abs(center.z-study.ball.position.z)<1e-7);}
 for(const part of study.group.children)for(const attr of Object.values(part.geometry.attributes))assert([...attr.array].every(Number.isFinite));
 console.log(JSON.stringify({parts:3,ballDiameter:study.diameter,gaps,exactSourceGeometry:true,skeletonPoint:study.ball.position.toArray()}));
});
