import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createFootShape} from '../src/foot-shape.js';
import {createFootStudy} from '../src/foot-study.js';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';

test('Shape baseline contains only the original foot and calf, untouched and apart',()=>{
 const study=createFootStudy(),originalFoot=createFootShape(),reference=createCharacterRig({plain:true});
 const meshes=[];study.group.traverse(o=>{if(o.isMesh)meshes.push(o);});
 assert.deepEqual(meshes,[study.foot,study.calf]);
 for(const [actual,original] of [[study.foot,originalFoot],[study.calf,reference.kneeRight.children[0]]]){
  for(const key of ['position','normal'])assert.deepEqual(actual.geometry.attributes[key].array,original.geometry.attributes[key].array);
  assert.deepEqual(actual.geometry.index.array,original.geometry.index.array);
  assert.equal(actual.geometry.userData.ankleCenter,undefined);
  assert.equal(actual.geometry.userData.socketRadius,undefined);
 }
 const footBox=new T.Box3().setFromObject(study.foot),calfBox=new T.Box3().setFromObject(study.calf);
 assert(calfBox.min.x-footBox.max.x>.1,'Parts must be visibly separated');
 assert(Math.abs(footBox.min.y)<1e-8&&Math.abs(calfBox.min.y)<1e-8,'Both shapes stand on the floor');
 assert.equal(study.ankleBall,undefined);
});
