import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {MathUtils,Raycaster,Vector3} from 'three';
import {updateFollowTarget} from '../../motion-lab/src/camera-follow.js';
import {createTrack} from '../../racing-core/track/index.ts';
import {createDrivingTest} from '../../racing-core/testing/drive.ts';
import {KART} from '../../racing-core/kart/index.ts';
import {createCheckedTrackView} from '../src/checked-track-view.js';
const rates=[30,60,120,144],checks=[],track=createTrack('original'),view=createCheckedTrackView(track),fullDistance=Math.hypot(10,3.5);
function trace(fps,fixed){
 const first=track.sample(1300),target=new Vector3(first.point.x,first.point.y+1,first.point.z),ray=new Raycaster(),offset=new Vector3();
 let yaw=Math.atan2(first.forward.x,first.forward.z)+Math.PI,minimumClearance=1,minimumDistance=fullDistance,hits=0;
 for(let distance=1300;distance<1450;distance+=KART.boostSpeed/fps){
  const sample=track.sample(distance),facing=Math.atan2(sample.forward.x,sample.forward.z);
  yaw+=Math.atan2(Math.sin(facing+Math.PI-yaw),Math.cos(facing+Math.PI-yaw))*(1-Math.exp(-5/fps));
  if(fixed)updateFollowTarget(target,sample.point,1/fps,{chase:true,targetHeight:1},offset);
  else target.set(sample.point.x,MathUtils.damp(target.y,sample.point.y+1,10,1/fps),sample.point.z);
  minimumClearance=Math.min(minimumClearance,target.y-sample.point.y);
  ray.set(target,new Vector3(Math.sin(yaw)*10,3.5,Math.cos(yaw)*10).normalize());ray.near=.2;ray.far=fullDistance;
  const hit=ray.intersectObjects(view.root.children.slice(0,3),false)[0];
  if(hit){hits++;minimumDistance=Math.min(minimumDistance,Math.max(.5,hit.distance-.35));}
 }
 return {fps,minimumClearance,minimumDistance,hits};
}
test('Original bridge approach reproduces the old boost-speed camera collapse',()=>{
 const rows=rates.map(fps=>trace(fps,false));
 assert(rows.some(row=>row.minimumClearance<0));assert(rows.some(row=>row.minimumDistance===.5));
 checks.push({rule:'Reproduce the reported glitch with the original road meshes and old vertical lag.',input:'Replay stations 1300–1450 at 180 mph at four display rates.',measured:rows,status:'PASS'});
});
test('Chase aim stays one meter above the rendered kart and keeps full distance through the bridge approach',()=>{
 const rows=rates.map(fps=>trace(fps,true));
 for(const row of rows){assert(Math.abs(row.minimumClearance-1)<1e-9);assert.equal(row.hits,0);assert.equal(row.minimumDistance,fullDistance);}
 checks.push({rule:'No road-triggered camera collapse at the reported climb.',input:'Identical boost-speed replay at 30/60/120/144 FPS using the shared camera target.',measured:rows,status:'PASS'});
});
test('The real kart stays grounded through the climb and camera tracking cannot change its handling',()=>{
 const rows=[];
 for(const fps of rates){
  const a=createDrivingTest(),b=createDrivingTest(),sample=a.track.sample(1320),initial={...sample.point,yaw:Math.atan2(sample.forward.x,sample.forward.z),speed:KART.boostSpeed,boostTime:2};
  a.controller.reset(initial);b.controller.reset(initial);let airborneFrames=0;const target=new Vector3(),offset=new Vector3();
  const input=(tick,seconds,state)=>{const q=a.track.project(state,{hintDistance:1320+seconds*KART.boostSpeed,maxDelta:100});assert(q);const ahead=a.track.sample(q.distance+15),desired=Math.atan2(ahead.point.x-state.x,ahead.point.z-state.z),error=Math.atan2(Math.sin(desired-state.yaw),Math.cos(desired-state.yaw));return {throttle:1,steer:MathUtils.clamp(-error*2.5,-1,1)};};
  for(let i=0;i<2*fps;i++){a.advance(1/fps,input);updateFollowTarget(target,a.sample(),1/fps,{chase:true,targetHeight:1},offset);b.advance(1/fps,input);airborneFrames+=!a.controller.state.grounded;}
  assert.deepEqual(a.getState(),b.getState());assert.equal(airborneFrames,0);rows.push({fps,airborneFrames,state:a.controller.state});
 }
 for(const row of rows)assert.deepEqual(row.state,rows[0].state);
 checks.push({rule:'Ground support, speed and handling are independent of the camera fix.',input:'Two-second actual boosted drive up the climb; compare camera/no-camera runs and all four display rates.',measured:rows,status:'PASS'});
});
test('Ordinary inspection targets keep their previous damping and offsets',()=>{
 for(const fps of rates){const actual=new Vector3(3,4,5),expected=actual.clone(),state={x:10,y:6,z:-8},offset=new Vector3(2,3,-1);for(let i=0;i<fps;i++){expected.set(MathUtils.damp(expected.x,12,10,1/fps),MathUtils.damp(expected.y,9.1,10,1/fps),MathUtils.damp(expected.z,-9,10,1/fps));updateFollowTarget(actual,state,1/fps,null,offset);}assert(actual.distanceTo(expected)<1e-12);}
 checks.push({rule:'Keep non-driving inspection behavior.',input:'One-second damped target plus inspection offset at four rates.',measured:{maximumAllowedError:1e-12},status:'PASS'});
});
test.after(()=>{view.dispose();writeFileSync(new URL('../CHASE-CAMERA-CHECKS.json',import.meta.url),JSON.stringify({passed:checks.length===4,checks},null,2)+'\n');});
