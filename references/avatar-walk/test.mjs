import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
await build({entryPoints:['references/avatar-walk/retarget.js'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/avatar-walk-test.mjs'});
const {AvatarWalkPreview,CYCLE}=await import('/tmp/avatar-walk-test.mjs'),walk=new AvatarWalkPreview();
const rigid=walk.legs.map(l=>{const g=l.calf.geometry,join=g.userData.cavityVertexCount+(g.userData.lipRings-1)*g.userData.segments;return {join,positions:l.socket.restPositions.slice(join*3),normals:l.socket.restNormals.slice(join*3)};});
const armRanges=walk.legs.map(()=>({min:Infinity,max:-Infinity}));
for(let i=0;i<=240;i++){
 walk.setTime(i/120*CYCLE);
 walk.legs.forEach((leg,j)=>{
  assert.equal(leg.hip.scale.lengthSq(),3,'Thigh scale must remain unchanged');assert.equal(Math.abs(leg.foot.scale.x),1,'Foot must keep saved scale');
  const {join,positions,normals}=rigid[j];assert.deepEqual(leg.calf.geometry.attributes.position.array.slice(join*3),positions,'Calf shaft must remain rigid');assert.deepEqual(leg.calf.geometry.attributes.normal.array.slice(join*3),normals);
  armRanges[j].min=Math.min(armRanges[j].min,leg.elbow.rotation.x);armRanges[j].max=Math.max(armRanges[j].max,leg.elbow.rotation.x);
 });
}
assert(walk.metrics.maxPlantedSlide<1e-6,'Planted forefoot must stay fixed');assert(walk.metrics.maxPlantedVerticalError<1e-6,'Support contact must stay on the floor');assert(walk.metrics.maxIKError<1e-6,'IK must preserve measured bones');assert(walk.metrics.maxReachExcess<1e-6,'No unreachable target may stretch a leg');
assert(walk.metrics.minStanceKnee<20*Math.PI/180,'Supporting knee must extend');assert(walk.restHip-walk.metrics.minHip<.05,'Body must not stay in the old deep crouch');assert(walk.restHip-walk.metrics.maxHip<.005,'Body must approach standing height while passing over a foot');
armRanges.forEach(r=>assert(r.max-r.min>.1,'Original elbow curves must animate'));
const snapshot=()=>walk.legs.map(l=>({foot:l.foot.position.clone(),hip:l.hip.quaternion.clone(),calf:l.calf.quaternion.clone(),shoulder:l.shoulder.quaternion.clone(),elbow:l.elbow.quaternion.clone()}));
walk.setTime(0);const start=snapshot();walk.setTime(CYCLE);snapshot().forEach((end,i)=>{assert(end.foot.clone().sub(start[i].foot).distanceTo({x:0,y:0,z:walk.stride})<1e-8);for(const k of ['hip','calf','shoulder','elbow'])assert(1-Math.abs(end[k].dot(start[i][k]))<1e-8,'Cycle must repeat after one stride');});
// Check target continuity at release and landing, including the opposite foot.
for(const leg of walk.legs)for(const phase of [walk.duty,1]){const t=(phase-leg.phaseOffset)*CYCLE;walk.setTime(t-1e-7);const p=leg.foot.position.clone();walk.setTime(t+1e-7);assert(p.distanceTo(leg.foot.position)<1e-4,'Foot target must not pop at contact boundaries');}
const result={cycleSeconds:CYCLE,fullCycleTravelMeters:walk.stride,speedMetersPerSecond:walk.speed,measuredLegBones:walk.legs.map(l=>({side:l.side,upper:l.upper,lower:l.lower})),standingHipMeters:walk.restHip,metrics:walk.metrics,elbowRangesRadians:armRanges};
await writeFile('/tmp/avatar-walk-metrics.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
