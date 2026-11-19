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
  const d=b.getY(i)-p.getY(i);assert(d>=-1e-8&&d<=.016001);maxDepth=Math.max(maxDepth,d);
  if(d>1e-8){changed++;assert(Math.hypot(b.getX(i),b.getZ(i))<.04);assert(b.getY(i)>.04);}
  if(b.getY(i)<1e-7||b.getZ(i)>=.145)assert.equal(p.getY(i),b.getY(i));
 }
 assert(changed>20&&maxDepth>.0159,'The socket must actually reach the new 16 mm depth');
 const ray=new T.Raycaster(),height=(x,z)=>{ray.set(new T.Vector3(x+study.foot.position.x,1,z),new T.Vector3(0,-1,0));return ray.intersectObject(study.foot)[0].point.y;};
 study.group.updateMatrixWorld(true);const center=height(0,0);
 for(const [x,z] of [[.015,0],[-.015,0],[0,.015],[0,-.015]])assert(height(x,z)>center,'Socket must be a bowl, not merely a flattened dome');
 assert.equal(study.calf.userData.socket,undefined);assert.equal(study.ankleBall,undefined);
});

test('The deeper socket remains a closed solid without flipped faces or invalid shading',()=>{
 const study=createFootStudy(),base=createFootStudy({socket:false});
 const p=study.foot.geometry.attributes.position,b=base.foot.geometry.attributes.position,index=study.foot.geometry.index.array;
 const a=new T.Vector3(),v=new T.Vector3(),c=new T.Vector3(),original=new T.Vector3(),deformed=new T.Vector3(),edge=new T.Vector3(),edges=new Map();let volume=0;
 for(let i=0;i<index.length;i+=3){
  const ids=Array.from(index.slice(i,i+3));
  a.fromBufferAttribute(b,ids[0]);v.fromBufferAttribute(b,ids[1]);c.fromBufferAttribute(b,ids[2]);
  original.copy(v).sub(a).cross(edge.copy(c).sub(a));
  a.fromBufferAttribute(p,ids[0]);v.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
  deformed.copy(v).sub(a).cross(edge.copy(c).sub(a));
  assert(deformed.lengthSq()>1e-20&&original.dot(deformed)>0,'A socket face folded or collapsed');
  volume+=a.dot(edge.copy(v).cross(c))/6;
  for(let k=0;k<3;k++){const x=ids[k],y=ids[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),entry=edges.get(key)||[0,0];entry[0]++;entry[1]+=x<y?1:-1;edges.set(key,entry);}
 }
 assert(volume>0);assert([...edges.values()].every(([count,winding])=>count===2&&winding===0),'A solid seam opened');
 assert([...p.array,...study.foot.geometry.attributes.normal.array].every(Number.isFinite));
});
