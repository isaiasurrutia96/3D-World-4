import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createFootShape} from '../src/foot-shape.js';
import {createFootStudy} from '../src/foot-study.js';
import {createCalf} from '../src/calf.js';
import {moldSurfaceHeight,moldedHeight} from '../src/ball-mold.js';
import {createAnkleBall} from '../src/ankle-socket.js';
import {ANKLE_RADIUS,ANKLE_REST_HEIGHT} from '../../avatar/src/joints/ankle-contract.js';
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

test('The same ankle ball molds only the foot at the existing socket; calf, sole and toes stay unchanged',()=>{
 const study=createFootStudy(),base=createFootStudy({socket:false}),p=study.foot.geometry.attributes.position,b=base.foot.geometry.attributes.position;
 assert.equal(study.group.children.length,2);assert(p.count>b.count,'Only the socket patch should receive finer geometry');
 assert.deepEqual(study.calf.geometry.attributes.position.array,base.calf.geometry.attributes.position.array);
 assert.deepEqual(study.calf.geometry.attributes.normal.array,base.calf.geometry.attributes.normal.array);

 let changed=0,maxDepth=0;
 for(let i=0;i<b.count;i++){
  assert.equal(p.getX(i),b.getX(i));assert.equal(p.getZ(i),b.getZ(i));
  const d=b.getY(i)-p.getY(i);assert(d>=-1e-8&&d<=study.foot.userData.socketMold.pressDepth+.0001);maxDepth=Math.max(maxDepth,d);
  if(d>1e-8){changed++;assert(Math.hypot(b.getX(i),b.getZ(i))<.13);assert(b.getY(i)>.04);}
  if(b.getY(i)<1e-7||b.getZ(i)>=.145)assert.equal(p.getY(i),b.getY(i));
 }
 assert(changed>20&&maxDepth>.15,'The mold must reach the real ankle height');
 const ray=new T.Raycaster(),height=(x,z)=>{ray.set(new T.Vector3(x+study.foot.position.x,1,z),new T.Vector3(0,-1,0));return ray.intersectObject(study.foot)[0].point.y;};
 study.group.updateMatrixWorld(true);const center=height(0,0);
 const raw=base.foot,rawRay=new T.Raycaster(new T.Vector3(raw.position.x,1,0),new T.Vector3(0,-1,0));
 assert(Math.abs(rawRay.intersectObject(raw)[0].point.y-center-study.foot.userData.socketMold.pressDepth)<.0001,'Actual mesh center must reach the ankle seat');
 for(const [x,z] of [[.015,0],[-.015,0],[0,.015],[0,-.015]])assert(height(x,z)>center,'Socket must be a bowl, not merely a flattened dome');
 assert.equal(study.calf.userData.socket,undefined);assert.equal(study.ankleBall,undefined);
});

test('The deeper socket remains a closed solid without flipped faces or invalid shading',()=>{
 const study=createFootStudy(),base=createFootStudy({socket:false});
 const p=study.foot.geometry.attributes.position,b=new T.Float32BufferAttribute(study.foot.geometry.userData.moldRestPositions,3),index=study.foot.geometry.index.array;
 const a=new T.Vector3(),v=new T.Vector3(),c=new T.Vector3(),original=new T.Vector3(),deformed=new T.Vector3(),edge=new T.Vector3(),edges=new Map();let volume=0;
 for(let i=0;i<index.length;i+=3){
  const ids=Array.from(index.slice(i,i+3));
  a.fromBufferAttribute(b,ids[0]);v.fromBufferAttribute(b,ids[1]);c.fromBufferAttribute(b,ids[2]);
  original.copy(v).sub(a).cross(edge.copy(c).sub(a));
  a.fromBufferAttribute(p,ids[0]);v.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);
  deformed.copy(v).sub(a).cross(edge.copy(c).sub(a));
  assert(deformed.lengthSq()>1e-20,'A socket face collapsed');
  assert.equal(deformed.y,original.y,'Projected triangle winding changed');
  volume+=a.dot(edge.copy(v).cross(c))/6;
  for(let k=0;k<3;k++){const x=ids[k],y=ids[(k+1)%3],key=Math.min(x,y)+','+Math.max(x,y),entry=edges.get(key)||[0,0];entry[0]++;entry[1]+=x<y?1:-1;edges.set(key,entry);}
 }
 assert(volume>0);assert([...edges.values()].every(([count,winding])=>count===2&&winding===0),'A solid seam opened');
 assert([...p.array,...study.foot.geometry.attributes.normal.array].every(Number.isFinite));
 // Deep concave normals may legitimately turn over 90 degrees from the former
 // dome. Check actual upper/lower separation instead of their old normal dot.
 const probe=new T.Mesh(study.foot.geometry,new T.MeshBasicMaterial({side:T.DoubleSide})),ray=new T.Raycaster();let tested=0,minThickness=Infinity;
 for(let x=-.09;x<=.0901;x+=.03)for(let z=-.09;z<=.0901;z+=.03){
  ray.set(new T.Vector3(x,1,z),new T.Vector3(0,-1,0));
  const heights=ray.intersectObject(probe).map(h=>h.point.y).sort((a,b)=>a-b).filter((h,i,all)=>i===0||Math.abs(h-all[i-1])>1e-6);
  if(!heights.length)continue;
  assert.equal(heights.length,2,'The socket created an internal crossing or folded shell');
  tested++;minThickness=Math.min(minThickness,heights[1]-heights[0]);
 }
 assert(tested>30&&minThickness>.048,'The ankle cup must leave its measured solid sole below');probe.material.dispose();
});


function fittedSphere(points){
 const matrix=Array.from({length:4},()=>Array(5).fill(0));
 for(const p of points){const row=[2*p.x,2*p.y,2*p.z,1],value=p.lengthSq();for(let i=0;i<4;i++){for(let j=0;j<4;j++)matrix[i][j]+=row[i]*row[j];matrix[i][4]+=row[i]*value;}}
 for(let i=0;i<4;i++){
  let pivot=i;for(let k=i+1;k<4;k++)if(Math.abs(matrix[k][i])>Math.abs(matrix[pivot][i]))pivot=k;
  [matrix[i],matrix[pivot]]=[matrix[pivot],matrix[i]];assert(Math.abs(matrix[i][i])>1e-15);
  const d=matrix[i][i];for(let j=i;j<5;j++)matrix[i][j]/=d;
  for(let k=0;k<4;k++)if(k!==i){const factor=matrix[k][i];for(let j=i;j<5;j++)matrix[k][j]-=factor*matrix[i][j];}
 }
 const center=new T.Vector3(...matrix.map(row=>row[4]).slice(0,3));
 return {center,radius:Math.sqrt(center.lengthSq()+matrix[3][4])};
}
function minimumFaceDistance(geometry,center){
 const p=geometry.attributes.position,index=geometry.index.array,triangle=new T.Triangle(),nearest=new T.Vector3();let distance=Infinity;
 for(let i=0;i<index.length;i+=3){triangle.a.fromBufferAttribute(p,index[i]);triangle.b.fromBufferAttribute(p,index[i+1]);triangle.c.fromBufferAttribute(p,index[i+2]);triangle.closestPointToPoint(center,nearest);distance=Math.min(distance,nearest.distanceTo(center));}
 return distance;
}

test('Actual cavity fits the original 230 mm ankle sphere and is no coarser than that ball mesh',()=>{
 const {foot}=createFootStudy(),g=foot.geometry,p=g.attributes.position,mold=foot.userData.socketMold,indices=g.userData.moldContactIndices;
 assert.equal(mold.ballRadius,.115);assert.equal(mold.ballRadius,ANKLE_RADIUS);assert(indices.length>100);
 const points=indices.map(i=>new T.Vector3().fromBufferAttribute(p,i)),fit=fittedSphere(points),expectedCenter=new T.Vector3(...mold.center);
 assert(Math.abs(fit.radius-ANKLE_RADIUS)<.000001,'Core curvature must match the old ball, not a rescaled dimple');
 assert(fit.center.distanceTo(expectedCenter)<.000001,'The molded sphere center must stay at the original socket X/Z');
 for(const point of points)assert(Math.abs(point.distanceTo(fit.center)-ANKLE_RADIUS)<.000001);
 const ball=createAnkleBall(new T.MeshStandardMaterial(),new T.Vector3());
 const referenceChord=ANKLE_RADIUS-minimumFaceDistance(ball.geometry,new T.Vector3());
 const moldChord=ANKLE_RADIUS-minimumFaceDistance(g,expectedCenter);
 assert(moldChord<=referenceChord+1e-7,'Refine the cut if its flat facets are less accurate than the reference ankle ball');
 assert(moldChord<.0002);
 ball.geometry.dispose();ball.material.dispose();
});


test('Mold center matches the real ankle seat and its softened transition has continuous curvature',()=>{
 const study=createFootStudy(),m=study.foot.userData.socketMold,referenceFoot=createFootShape();createCalf(referenceFoot);
 assert(Math.abs(m.center[1]-referenceFoot.geometry.userData.ankleCenter[1])<1e-9,'Use the measured ankle height, not another guessed press distance');
 assert.equal(m.center[1],ANKLE_REST_HEIGHT);assert.deepEqual([m.center[0],m.center[2]],[0,0]);
 assert.equal(m.blendWidth,.010);assert(m.blendWidth>.006);
 const rim=m.ballRadius*Math.sin(m.coreAngle),e=1e-6,fn=r=>moldSurfaceHeight(r,m);
 const leftSlope=(fn(rim)-fn(rim-e))/e,rightSlope=(fn(rim+e)-fn(rim))/e;
 const leftCurve=(fn(rim)-2*fn(rim-e)+fn(rim-2*e))/e**2,rightCurve=(fn(rim+2*e)-2*fn(rim+e)+fn(rim))/e**2;
 assert(Math.abs(leftSlope-rightSlope)<.001&&Math.abs(leftCurve-rightCurve)<1,'A sharp rim returned');
 for(const r of [.13,.14,.145])assert.equal(moldedHeight(.2,r,m),.2,'The sphere equator must not leave a cutoff seam');
});
