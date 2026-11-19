import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as T from 'three';
import {createFootShape} from '../src/foot-shape.js';
import {createCalf} from '../src/calf.js';
import {createFootRig,BEND_START,MOTIONS} from '../src/foot-rig.js';
import {createFootSocketProfile} from '../src/socket-profile.js';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';
import {ANKLE_RADIUS,ANKLE_CLEARANCE,ANKLE_CAP_ANGLE,FOOT_SOCKET_CAP_ANGLE,ANKLE_LIP_RADIUS,ANKLE_LIMITS,ANKLE_MAX_COMBINED,normalizeAnklePose} from '../../avatar/src/joints/ankle-contract.js';

const checks=[];
const foot=createFootShape(),baselineFoot=foot.geometry.clone(),baselineContacts=structuredClone(foot.userData.contacts);
const calf=createCalf(foot),rig=createFootRig(foot,calf),ball=rig.ankleBall;
assert(ball?.isMesh,'Foot rig must expose its ankleBall mesh');
const parts=[foot,calf,ball],restPose={ankle:0,roll:0,toes:0,heel:0};
rig.setPose(restPose);rig.group.updateMatrixWorld(true);
const rests=parts.map(mesh=>({
 position:mesh.geometry.attributes.position.array.slice(),normal:mesh.geometry.attributes.normal.array.slice(),
 matrix:mesh.matrixWorld.toArray(),
}));
const range=name=>Array.isArray(ANKLE_LIMITS[name])?ANKLE_LIMITS[name]:[ANKLE_LIMITS[name].min,ANKLE_LIMITS[name].max];
const xyz=value=>value?.isVector3?value.clone():new T.Vector3(...value);
const vertex=(mesh,index,world=false)=>{
 const v=new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,index);
 return world?v.applyMatrix4(mesh.matrixWorld):v;
};
function points(mesh,indices=null,world=false){
 const all=indices??Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>i);
 return all.map(i=>vertex(mesh,i,world));
}
function cavityIndices(mesh){
 const g=mesh.geometry,indices=g.userData.cavityIndices??Array.from({length:g.userData.cavityVertexCount??0},(_,i)=>i);
 assert(indices.length>=32,mesh.name+' needs explicit true spherical-cavity vertices');
 assert([...indices].every(i=>Number.isInteger(i)&&i>=0&&i<g.attributes.position.count),'Invalid cavity index');
 return [...indices];
}
// Fit from actual points instead of treating stored metadata as proof of seating.
function fitSphere(all){
 const stride=Math.max(1,Math.floor(all.length/256)),p=all.filter((_,i)=>i%stride===0),origin=new T.Vector3();
 for(const v of p)origin.add(v);origin.multiplyScalar(1/p.length);
 const matrix=Array.from({length:4},()=>Array(5).fill(0));
 for(const source of p){const v=source.clone().sub(origin),a=[2*v.x,2*v.y,2*v.z,1],b=v.lengthSq();for(let i=0;i<4;i++){for(let j=0;j<4;j++)matrix[i][j]+=a[i]*a[j];matrix[i][4]+=a[i]*b;}}
 for(let i=0;i<4;i++){
  let pivot=i;for(let j=i+1;j<4;j++)if(Math.abs(matrix[j][i])>Math.abs(matrix[pivot][i]))pivot=j;
  [matrix[i],matrix[pivot]]=[matrix[pivot],matrix[i]];assert(Math.abs(matrix[i][i])>1e-18,'Sphere samples must span a cap, not one circle');
  const divisor=matrix[i][i];for(let j=i;j<=4;j++)matrix[i][j]/=divisor;
  for(let k=0;k<4;k++)if(k!==i){const factor=matrix[k][i];for(let j=i;j<=4;j++)matrix[k][j]-=factor*matrix[i][j];}
 }
 const offset=new T.Vector3(matrix[0][4],matrix[1][4],matrix[2][4]);
 return {center:offset.clone().add(origin),radius:Math.sqrt(offset.lengthSq()+matrix[3][4])};
}
function closedSurface(mesh){
 const g=mesh.geometry,p=g.attributes.position,source=g.index?.array??Array.from({length:p.count},(_,i)=>i),ids=[],unique=new Map(),vertices=[];
 for(let i=0;i<p.count;i++){
  const v=vertex(mesh,i),key=v.toArray().map(n=>Math.round(n/1e-7)).join(',');
  if(!unique.has(key)){unique.set(key,vertices.length);vertices.push(v);}ids[i]=unique.get(key);
 }
 const edges=new Map();let faces=0,volume=0;
 for(let i=0;i<source.length;i+=3){
  const indices=[ids[source[i]],ids[source[i+1]],ids[source[i+2]]];
  if(new Set(indices).size<3)continue; // Geometrically weld ordinary UV seams/poles.
  const [a,b,c]=indices.map(i=>vertices[i]);assert(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()>1e-20,'Degenerate surface face in '+mesh.name);
  faces++;volume+=a.dot(b.clone().cross(c))/6;
  for(let j=0;j<3;j++){const a=indices[j],b=indices[(j+1)%3],key=Math.min(a,b)+','+Math.max(a,b),e=edges.get(key)??{count:0,winding:0};e.count++;e.winding+=a<b?1:-1;edges.set(key,e);}
 }
 assert([...edges.values()].every(e=>e.count===2&&e.winding===0),'Open, doubled or inconsistently wound seam in '+mesh.name);
 assert.equal(vertices.length-edges.size+faces,2,'Unexpected surface topology in '+mesh.name);
 assert(volume>0,'Surface points inward in '+mesh.name);
 assert([...p.array,...g.attributes.normal.array].every(Number.isFinite),'Non-finite position/normal in '+mesh.name);
 return {vertices:vertices.length,faces,volume};
}
function minimumSphereGap(mesh,worldCenter){
 const center=worldCenter.clone().applyMatrix4(mesh.matrixWorld.clone().invert()),g=mesh.geometry,p=g.attributes.position,ix=g.index.array;
 const triangle=new T.Triangle(),closest=new T.Vector3();let minimum=Infinity;
 for(let i=0;i<ix.length;i+=3){triangle.a.fromBufferAttribute(p,ix[i]);triangle.b.fromBufferAttribute(p,ix[i+1]);triangle.c.fromBufferAttribute(p,ix[i+2]);triangle.closestPointToPoint(center,closest);minimum=Math.min(minimum,closest.distanceToSquared(center));}
 return Math.sqrt(minimum)-ANKLE_RADIUS;
}
// Independent closed-shell probe. Index triangles by their Y/Z projection, then
// fire a +X ray through the actual faces, without trusting smooth vertex normals.
function shellProbe(mesh){
 const g=mesh.geometry,p=g.attributes.position,ix=g.index.array,cell=.012,grid=new Map(),inverse=mesh.matrixWorld.clone().invert();
 const triangle=new T.Triangle(),hit=new T.Vector3(),normal=new T.Vector3(),edge=new T.Vector3(),ray=new T.Ray(new T.Vector3(),new T.Vector3(1,0,0));
 for(let i=0;i<ix.length;i+=3){
  const ids=[ix[i],ix[i+1],ix[i+2]],ys=ids.map(i=>p.getY(i)),zs=ids.map(i=>p.getZ(i));
  for(let y=Math.floor(Math.min(...ys)/cell);y<=Math.floor(Math.max(...ys)/cell);y++)for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++){const key=y+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);}
 }
 const box=g.boundingBox.clone();let candidates=0;
 return {get candidates(){return candidates;},depth(worldPoint){
  const q=worldPoint.clone().applyMatrix4(inverse);if(!box.containsPoint(q))return 0;candidates++;
  ray.origin.copy(q);let distance=Infinity,orientation=0;
  for(const i of grid.get(Math.floor(q.y/cell)+','+Math.floor(q.z/cell))??[]){
   triangle.a.fromBufferAttribute(p,ix[i]);triangle.b.fromBufferAttribute(p,ix[i+1]);triangle.c.fromBufferAttribute(p,ix[i+2]);
   if(!ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,hit))continue;const d=hit.x-q.x;if(d<=1e-6)continue;
   normal.subVectors(triangle.b,triangle.a).cross(edge.subVectors(triangle.c,triangle.a)).normalize();
   if(d<distance-1e-7){distance=d;orientation=normal.x;}else if(Math.abs(d-distance)<1e-7)orientation+=normal.x;
  }
  if(orientation<=0)return 0;
  // A true distance check excludes tangential/near-surface ray coincidences.
  let nearest=Infinity;
  for(let i=0;i<ix.length;i+=3){triangle.a.fromBufferAttribute(p,ix[i]);triangle.b.fromBufferAttribute(p,ix[i+1]);triangle.c.fromBufferAttribute(p,ix[i+2]);triangle.closestPointToPoint(q,hit);nearest=Math.min(nearest,hit.distanceToSquared(q));}
  return Math.sqrt(nearest);
 }};
}
const key=v=>v.toArray().map(n=>Math.round(n/1e-6)).join(',');
function check(rule,input,expected,measure,verify){test(rule,()=>{
 let measured;
 try{rig.setPose(restPose);measured=measure();verify(measured);checks.push({rule,input,expected,measured,status:'PASS'});}
 catch(error){checks.push({rule,input,expected,measured:measured??null,status:'FAIL',error:error.message});throw error;}
 finally{rig.setPose(restPose);}
});}

check('Ankle ball is a proportional sphere at the common measured pivot',
 'Fit the actual rest ball surface independently and compare it with both socket centres and the existing foot pivot.',
 '115 mm radius; common centre within 0.02 mm; diameter is 75–100% of the original 256 mm calf diameter.',()=>{
  const fitted=fitSphere(points(ball,null,true)),centres=[foot,calf].map(mesh=>xyz(mesh.geometry.userData.ankleCenter).applyMatrix4(mesh.matrixWorld));
  const pivot=xyz(rig.pivot).applyMatrix4(rig.group.matrixWorld),maxCentreError=Math.max(...centres.map(c=>c.distanceTo(fitted.center)),pivot.distanceTo(fitted.center));
  const maxRadiusError=Math.max(...points(ball,null,true).map(p=>Math.abs(p.distanceTo(fitted.center)-ANKLE_RADIUS)));
  for(const name of ['ankle','roll','heel','toes']){const motion=MOTIONS.find(m=>m.id===name);assert(motion);assert.deepEqual([motion.min,motion.max],range(name),'Foot rig must apply the shared mechanical range');}
  assert.equal(ball.material.color.getHex(),foot.material.color.getHex());assert.equal(calf.material.color.getHex(),foot.material.color.getHex());
  return {radius:fitted.radius,maxRadiusError,maxCentreError,pivot:rig.pivot,diameterToCalf:2*ANKLE_RADIUS/.256};
 },m=>{assert(Math.abs(m.radius-ANKLE_RADIUS)<1e-6);assert(m.maxRadiusError<1e-6);assert(m.maxCentreError<2e-5);assert(m.diameterToCalf>.75&&m.diameterToCalf<1);});

check('Ball, foot and calf remain closed outward-facing finite surfaces',
 'Virtually weld coincident seam vertices, count directed edge incidences, Euler characteristic and signed volume.',
 'Every edge has two opposing faces; Euler characteristic 2 and positive volume for each piece.',()=>parts.map(mesh=>({name:mesh.name,...closedSurface(mesh)})),()=>{});

check('Both spherical sockets closely cradle the actual ball',
 'Inspect every advertised true cavity vertex and its normal at rest, independently of the stored radius.',
 '0.6 mm radial clearance within 0.002 mm, inward-facing cavity normals and coincident independently fitted centres.',()=>{
  rig.group.updateMatrixWorld(true);const sphere=fitSphere(points(ball,null,true));
  return [foot,calf].map(mesh=>{
   const indices=cavityIndices(mesh),pts=points(mesh,indices,true),fit=fitSphere(pts),normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
   let minimumGap=Infinity,maximumGap=-Infinity,maximumNormalDot=-Infinity;
   for(let j=0;j<indices.length;j++){
    const radial=pts[j].clone().sub(sphere.center),gap=radial.length()-sphere.radius;
    minimumGap=Math.min(minimumGap,gap);maximumGap=Math.max(maximumGap,gap);
    const normal=new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.normal,indices[j]).applyMatrix3(normalMatrix).normalize();
    maximumNormalDot=Math.max(maximumNormalDot,normal.dot(radial.normalize()));
   }
   assert(Math.abs(mesh.geometry.userData.socketRadius-(ANKLE_RADIUS+ANKLE_CLEARANCE))<1e-9);
   return {name:mesh.name,samples:indices.length,minimumGap,maximumGap,maximumNormalDot,centreError:fit.center.distanceTo(sphere.center)};
  });
 },rows=>{for(const r of rows){assert(Math.abs(r.minimumGap-ANKLE_CLEARANCE)<2e-6);assert(Math.abs(r.maximumGap-ANKLE_CLEARANCE)<2e-6);assert(r.maximumNormalDot<-.95);assert(r.centreError<2e-5);}});

check('Socket construction preserves the sole, toe shape and upper calf',
 'Compare original sole/toe positions and original reference-calf upper-profile vertices with actual new geometry.',
 'Sole and all toe vertices at or past z=0.145 remain unchanged; foot X/Z bounds and contact points are preserved; upper calf profile still matches.',()=>{
  const current=new Set(points(foot).map(key)),base=baselineFoot.attributes.position;
  let sole=0,toe=0;
  for(let i=0;i<base.count;i++){const p=new T.Vector3().fromBufferAttribute(base,i);if(p.y<=1e-7){sole++;assert(current.has(key(p)),'Sole point moved');}if(p.z>=BEND_START){toe++;assert(current.has(key(p)),'Toe/forefoot point moved');}}
  foot.geometry.computeBoundingBox();baselineFoot.computeBoundingBox();
  for(const axis of ['x','z'])for(const edge of ['min','max'])assert(Math.abs(foot.geometry.boundingBox[edge][axis]-baselineFoot.boundingBox[edge][axis])<1e-7,'Foot outline changed');
  assert(Math.abs(foot.geometry.boundingBox.min.y)<1e-7);assert.deepEqual(foot.userData.contacts,baselineContacts);
  const reference=createCharacterRig({plain:true}),original=reference.kneeRight.children[0].geometry.attributes.position,calfPoints=new Set(points(calf).map(key));let upper=0;
  for(let i=0;i<original.count;i++)if(original.getY(i)>-.09+1e-7){upper++;assert(calfPoints.has(key(new T.Vector3().fromBufferAttribute(original,i))),'Upper calf profile point moved');}
  const geometries=new Set(),materials=new Set();reference.root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
  return {solePoints:sole,preservedToePoints:toe,preservedUpperCalfPoints:upper,contacts:foot.userData.contacts};
 },m=>{assert(m.solePoints>100);assert(m.preservedToePoints>100);assert(m.preservedUpperCalfPoints>20);});

check('Both cups stay seated through combined ankle, roll, heel and toe poses',
 'Sweep the 16 combined limit corners and 128 deterministic intermediate poses; independently fit transformed spherical surfaces.',
 'Both socket centres remain within 0.02 mm of the ball and radial clearance stays within 0.002 mm of 0.6 mm.',()=>{
  const trials=[restPose];for(const ankle of range('ankle'))for(const roll of range('roll'))for(const heel of range('heel'))for(const toes of range('toes'))trials.push({ankle,roll,heel,toes});
  let seed=19;const random=()=>(seed=seed*16807%2147483647)/2147483647;
  for(let i=0;i<128;i++)trials.push(Object.fromEntries(['ankle','roll','heel','toes'].map(id=>{const [lo,hi]=range(id);return [id,lo+(hi-lo)*random()];})));
  let maxCentreError=0,maxGapError=0,maxRigidCalfDisplacement=0,maxBallRadiusError=0,maxFootCupAngleError=0;
  const capIds=[foot,calf].map(cavityIndices),upperStart=calf.geometry.userData.upperCalfStart;
  const initialSphere=fitSphere(points(ball,null,true)),restAxis=new T.Vector3();for(const p of points(foot,capIds[0],true))restAxis.add(p.clone().sub(initialSphere.center));restAxis.normalize();
  assert(Number.isInteger(upperStart)&&upperStart>=0,'Expose the first preserved upper-calf vertex');
  for(const request of trials){
   const pose=normalizeAnklePose(request);
   rig.setPose(pose);rig.group.updateMatrixWorld(true);const ballPoints=points(ball,null,true),sphere=fitSphere(ballPoints);assert(Math.abs(sphere.radius-ANKLE_RADIUS)<1e-6,'Ball distorts during rotation');
   for(const p of ballPoints)maxBallRadiusError=Math.max(maxBallRadiusError,Math.abs(p.distanceTo(sphere.center)-ANKLE_RADIUS));
   for(const id of ['ankle','roll','heel','toes'])assert(Math.abs(rig.getState().pose[id]-pose[id])<1e-9,'Requested in-range pose was unexpectedly clamped');
   for(const [i,mesh] of [foot,calf].entries()){
    const pts=points(mesh,capIds[i],true),fitted=fitSphere(pts);maxCentreError=Math.max(maxCentreError,fitted.center.distanceTo(sphere.center));
    for(const p of pts)maxGapError=Math.max(maxGapError,Math.abs(p.distanceTo(sphere.center)-sphere.radius-ANKLE_CLEARANCE));
    if(i===0){const actual=new T.Vector3();for(const p of pts)actual.add(p.clone().sub(sphere.center));actual.normalize();const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),T.MathUtils.degToRad(pose.roll)).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),T.MathUtils.degToRad(pose.ankle+pose.heel)));maxFootCupAngleError=Math.max(maxFootCupAngleError,actual.angleTo(restAxis.clone().applyQuaternion(q)));}
   }
   const p=calf.geometry.attributes.position;
   for(let i=upperStart;i<p.count;i++)for(let axis=0;axis<3;axis++)maxRigidCalfDisplacement=Math.max(maxRigidCalfDisplacement,Math.abs(p.array[i*3+axis]-rests[1].position[i*3+axis]));
  }
  return {poses:trials.length,maxCentreError,maxGapError,maxRigidCalfDisplacement,maxBallRadiusError,maxFootCupAngleError};
 },m=>{assert(m.maxCentreError<2e-5);assert(m.maxGapError<2e-6);assert.equal(m.maxRigidCalfDisplacement,0);assert(m.maxBallRadiusError<1e-6);assert(m.maxFootCupAngleError<5e-4);});

check('The simple foot socket has a soft continuous edge without a raised ridge or outer dip',
 'Sample five radial profiles, compare slopes and curvatures across the sphere join, and compare actual foot vertices with the original shape.',
 'Every bowl profile rises outward without a ridge/dip; height, slope and curvature join continuously; the carve never adds material.',()=>{
  const profile=createFootSocketProfile(0),epsilon=.000002;let maxSlopeJump=0,maxCurvatureJump=0,samples=0;
  for(const forward of [-1,-.5,0,.5,1]){
   const height=r=>profile.bowlHeight(r,forward),r=profile.rim;
   const leftSlope=(height(r)-height(r-epsilon))/epsilon,rightSlope=(height(r+epsilon)-height(r))/epsilon;
   const leftCurvature=(height(r)-2*height(r-epsilon)+height(r-2*epsilon))/epsilon**2;
   const rightCurvature=(height(r+2*epsilon)-2*height(r+epsilon)+height(r))/epsilon**2;
   maxSlopeJump=Math.max(maxSlopeJump,Math.abs(rightSlope-leftSlope));maxCurvatureJump=Math.max(maxCurvatureJump,Math.abs(rightCurvature-leftCurvature));
   let before=-Infinity;for(let radius=0;radius<=.18;radius+=.0005){const h=height(radius);assert(h>=before-1e-12,'A raised ridge or dip returned');before=h;samples++;}
  }
  const original=baselineFoot.attributes.position,current=foot.geometry.attributes.position;
  for(let i=0;i<original.count;i++)assert(current.getY(i)<=original.getY(i)+1e-8,'Socket added a cuff above the original foot');
  assert.equal(foot.geometry.userData.socketLipRadius,0);
  return {samples,maxSlopeJump,maxCurvatureJump,raisedTrim:false};
 },m=>{assert(m.maxSlopeJump<.001);assert(m.maxCurvatureJump<2);});

check('Spherical cuff openings retain clearance at the maximum combined bend',
 'Measure the angular envelope of roll × (ankle + heel) over all limit corners, including the unchanged calf lip.',
 'The slightly higher foot cap and unchanged calf cap cannot meet, including the measured-safe composed bend and 20° roll.',()=>{
  let worst=0;const q=new T.Quaternion();
  for(const requestAnkle of range('ankle'))for(const requestHeel of range('heel'))for(const roll of range('roll')){
   const {ankle,heel}=normalizeAnklePose({ankle:requestAnkle,heel:requestHeel,roll});
   q.setFromEuler(new T.Euler(0,0,T.MathUtils.degToRad(roll),'XYZ')).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),T.MathUtils.degToRad(ankle+heel)));
   worst=Math.max(worst,q.angleTo(new T.Quaternion()));
  }
  const footCap=foot.geometry.userData.socketCapAngle,calfCap=calf.geometry.userData.socketCapAngle;
  assert.equal(footCap,FOOT_SOCKET_CAP_ANGLE);assert.equal(calfCap,ANKLE_CAP_ANGLE);
  assert.equal(calf.geometry.userData.socketLipRadius,ANKLE_LIP_RADIUS);
  const lipEnvelope=Math.asin(foot.geometry.userData.socketLipRadius/ANKLE_RADIUS)+Math.asin(calf.geometry.userData.socketLipRadius/ANKLE_RADIUS),margin=Math.PI-worst-footCap-calfCap-lipEnvelope;
  return {footCapDegrees:T.MathUtils.radToDeg(footCap),calfCapDegrees:T.MathUtils.radToDeg(calfCap),cuffRise:(ANKLE_RADIUS+ANKLE_CLEARANCE)*(Math.cos(calfCap)-Math.cos(footCap)),maximumJointAngleDegrees:T.MathUtils.radToDeg(worst),lipEnvelopeDegrees:T.MathUtils.radToDeg(lipEnvelope),minimumAngularMarginDegrees:T.MathUtils.radToDeg(margin)};
 },m=>assert(m.minimumAngularMarginDegrees>0));

check('Combined bend rejects the measured unsafe 66° request while preserving doubled ankle motion',
 'Request isolated ankle extremes and the old 48° ankle + 30° heel combination; inspect the applied shared mechanical contract.',
 'Isolated -36° and +48° remain available; composition never exceeds the measured-safe 60° envelope.',()=>{
  assert.equal(ANKLE_MAX_COMBINED,60);
  const isolatedUp=normalizeAnklePose({ankle:-36}),isolatedDown=normalizeAnklePose({ankle:48}),unsafe66=normalizeAnklePose({ankle:36,heel:30}),unsafe78=normalizeAnklePose({ankle:48,heel:30});
  assert.equal(isolatedUp.ankle,-36);assert.equal(isolatedDown.ankle,48);assert.equal(unsafe66.ankle+unsafe66.heel,60);assert.equal(unsafe78.ankle+unsafe78.heel,60);assert.equal(unsafe66.heel,30);assert.equal(unsafe78.heel,30);
  rig.setPose({ankle:36,heel:30,roll:20,toes:25});const applied=rig.getState().pose;assert.equal(applied.ankle+applied.heel,60);
  return {isolatedUp,isolatedDown,unsafe66,unsafe78,applied};
 },()=>{});

check('The complete foot and calf surfaces stay outside the ankle sphere',
 'Measure the nearest point of every actual shell triangle to the ball centre at rest and the largest combined bends.',
 'No hidden outer-blend or triangle penetration; all faces retain positive clearance beyond a 0.01 mm numerical tolerance.',()=>{
  const poses=[restPose,{ankle:-36,roll:-20},{ankle:-36,roll:20},{ankle:48,roll:-20},{ankle:48,roll:20},{ankle:48,heel:30,roll:-20,toes:25},{ankle:48,heel:30,roll:20,toes:25}];
  const rows=[];
  for(const pose of poses){rig.setPose(pose);rig.group.updateMatrixWorld(true);const centre=fitSphere(points(ball,null,true)).center;rows.push({pose:rig.getState().pose,footGap:minimumSphereGap(foot,centre),calfGap:minimumSphereGap(calf,centre)});}
  return rows;
 },rows=>{for(const row of rows){assert(row.footGap>1e-5,JSON.stringify(row));assert(row.calfGap>1e-5,JSON.stringify(row));}});

check('Actual foot and calf shells do not intersect at the safe movement extremes',
 'Test every vertex in both directions against the other actual closed shell with indexed face-ray probes and nearest-surface confirmation.',
 'Zero vertices penetrate the other shell by more than 0.01 mm, including 60° composed bend and ±20° roll.',()=>{
  const requests=[{ankle:-36,roll:-20},{ankle:-36,roll:20},{ankle:48,roll:-20},{ankle:48,roll:20},{ankle:30,heel:30,roll:-20,toes:25},{ankle:30,heel:30,roll:20,toes:25}],rows=[];
  for(const request of requests){
   rig.setPose(request);rig.group.updateMatrixWorld(true);let probes=0,inside=0,maximumDepth=0;
   for(const [source,target] of [[foot,calf],[calf,foot]]){
    const shell=shellProbe(target),p=source.geometry.attributes.position;
    for(let i=0;i<p.count;i++){const depth=shell.depth(vertex(source,i,true));probes++;if(depth>1e-5){inside++;maximumDepth=Math.max(maximumDepth,depth);}}
   }
   rows.push({pose:rig.getState().pose,probes,inside,maximumDepth});
  }
  return rows;
 },rows=>{for(const row of rows)assert.equal(row.inside,0,JSON.stringify(row));});

check('Toe-only motion leaves the calf rigid and repeated poses return exactly to rest',
 'Apply a toe-only pose, then repeated limit corners and restore zero pose.',
 'Toe bending never changes calf positions/normals; rest restores every mesh buffer and placement bit for bit.',()=>{
  rig.setPose({...restPose,toes:range('toes')[1]});assert.deepEqual(calf.geometry.attributes.position.array,rests[1].position);assert.deepEqual(calf.geometry.attributes.normal.array,rests[1].normal);
  for(let repeat=0;repeat<3;repeat++)for(const ankle of range('ankle'))for(const roll of range('roll'))rig.setPose({ankle,roll,heel:range('heel')[1],toes:range('toes')[1]});
  rig.setPose(restPose);rig.group.updateMatrixWorld(true);
  for(const [i,mesh] of parts.entries()){assert.deepEqual(mesh.geometry.attributes.position.array,rests[i].position);assert.deepEqual(mesh.geometry.attributes.normal.array,rests[i].normal);assert.deepEqual(mesh.matrixWorld.toArray(),rests[i].matrix);}
  return {exactPositionBuffers:true,exactNormalBuffers:true,exactRestMatrices:true,toeOnlyCalfUnchanged:true};
 },()=>{});

test.after(()=>{baselineFoot.dispose();writeFileSync(new URL('../ANKLE-CHECKS.json',import.meta.url),JSON.stringify({summary:{passed:checks.filter(c=>c.status==='PASS').length,failed:checks.filter(c=>c.status==='FAIL').length},checks},null,2)+'\n');});
