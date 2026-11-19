import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createFootShape} from '../src/foot-shape.js';
import {createFootStudy} from '../src/foot-study.js';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';

test('Shape baseline contains only the original foot and calf, untouched and apart',()=>{
 const study=createFootStudy({socket:false}),originalFoot=createFootShape(),reference=createCharacterRig({plain:true});
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

test('Only a tiny soft socket is carved into the foot; calf, sole and toes stay unchanged',()=>{
 const study=createFootStudy(),base=createFootStudy({socket:false}),p=study.foot.geometry.attributes.position,b=base.foot.geometry.attributes.position;
 assert.equal(study.group.children.length,2);assert.equal(p.count,b.count);
 assert.deepEqual(study.calf.geometry.attributes.position.array,base.calf.geometry.attributes.position.array);
 assert.deepEqual(study.calf.geometry.attributes.normal.array,base.calf.geometry.attributes.normal.array);
 assert.deepEqual(study.foot.geometry.index.array,base.foot.geometry.index.array);
 let changed=0,maxDepth=0;
 for(let i=0;i<p.count;i++){
  assert.equal(p.getX(i),b.getX(i));assert.equal(p.getZ(i),b.getZ(i));
  const d=b.getY(i)-p.getY(i);assert(d>=-1e-8&&d<=.008001);maxDepth=Math.max(maxDepth,d);
  if(d>1e-8){changed++;assert(Math.hypot(b.getX(i),b.getZ(i))<.04);assert(b.getY(i)>.04);}
  if(b.getY(i)<1e-7||b.getZ(i)>=.145)assert.equal(p.getY(i),b.getY(i));
 }
 assert(changed>20&&maxDepth>.0079,'A small shallow cavity must actually be present');
 const ray=new T.Raycaster(),height=(x,z)=>{ray.set(new T.Vector3(x+study.foot.position.x,1,z),new T.Vector3(0,-1,0));return ray.intersectObject(study.foot)[0].point.y;};
 study.group.updateMatrixWorld(true);const center=height(0,0);
 for(const [x,z] of [[.015,0],[-.015,0],[0,.015],[0,-.015]])assert(height(x,z)>center,'Socket must be a bowl, not merely a flattened dome');
 assert.equal(study.calf.userData.socket,undefined);assert.equal(study.ankleBall,undefined);
});
