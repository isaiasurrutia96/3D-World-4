import '../kart/steering-check.test.mjs';
import '../kart/upgrade-check.test.mjs';
import '../kart/grip-check.test.mjs';
import '../kart/profile-check.test.mjs';
import '../kart/tuning.test.mjs';
import '../kart/course-check.test.mjs';
// Run the fresh track checks in deployment CI too; prototype tests below remain separate.
import '../track/check.test.mjs';
import '../kart/check.test.mjs';
import '../contacts/check.test.mjs';
import '../testing/check.test.mjs';
import '../testing/prototypes.test.mjs';
import '../kart/f1-2026-profile.test.mjs';
import '../kart/f1-2026-systems.test.mjs';
import '../kart/gt3-profile.test.mjs';
import '../kart/gt3-systems.test.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
import {TRACK_IDS,getTrack,createRaceSession,createVehicle,stepVehicle,readDriver,createDriver,VEHICLE,createProgress,updateProgress,resolveKartContact,createGhostStore,sampleGhost,validateGhost,fromLabInput} from '../index.js';
import letsgoHandling from './fixtures/letsgo-handling.json' with {type:'json'};
const reports=[];
const drive=(session,limit=1200)=>{const driver=createDriver({lane:-3.3,pace:1.01});session.start();for(let i=0;i<limit*120;i++){const controls=readDriver(driver,session.player.state,session.track,VEHICLE.step,session.racers.slice(1).map(r=>r.state));session.advance(VEHICLE.step,controls);if(session.racers.some(r=>r.progress.invalidReason))assert.fail(JSON.stringify(session.getState()));if(i%120===0&&session.getState().phase==='finished')return session.getState();}assert.fail('Race failed to finish '+session.track.id);};
for(const id of TRACK_IDS){
 test(id+': closed, finite track with original start and road width',()=>{const t=getTrack(id);assert(t.length>3000);assert(Math.abs(t.length-t.legacyLength)/t.length<.002);assert.equal(t.halfWidth,13);const a=t.at(0),b=t.at(t.length);for(const k of ['x','y','z'])assert(Math.abs(a[k]-b[k])<1e-6);for(let d=0;d<t.length;d+=17){const p=t.at(d),h=t.support(p.x,p.z,p.y+.01);assert(h!==null&&Math.abs(h-p.y)<.05);assert(Math.abs(t.project(p,d).distance-d)<.1);}});
 test(id+': five real karts complete three laps without respawn or skipped gates',()=>{const session=createRaceSession({trackId:id,laps:3,countdown:3}),s=drive(session,1600);assert.equal(s.phase,'finished');assert.equal(s.racers.length,5);assert.equal(new Set(s.standings.map(r=>r.position)).size,5);for(const r of s.racers){assert.equal(r.progress.laps,3);assert.equal(r.progress.invalidReason,'');assert.equal(r.respawns,0);assert(r.progress.finishTime>session.track.length*3/VEHICLE.boostSpeed);}reports.push({track:id,karts:5,laps:3,finished:5,respawns:0,raceSeconds:+s.elapsed.toFixed(3),finishTimes:s.standings.map(r=>({id:r.id,seconds:+r.finishTime.toFixed(3)}))});});
 test(id+': a time trial produces a playable per-track ghost',()=>{const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},session=createRaceSession({trackId:id,mode:'time-trial',laps:1,countdown:0,storage});drive(session,600);assert.equal(session.racers.length,1);const records=session.ghosts.records;assert.equal(records.length,1);validateGhost(records[0],session.track);const halfway=sampleGhost(records[0],records[0].duration/2);assert(halfway&&Object.values(halfway).every(Number.isFinite));const again=createGhostStore(session.track,storage);assert.equal(again.records[0].duration,records[0].duration);assert.equal(again.import(again.export()),1);const other=getTrack(TRACK_IDS.find(v=>v!==id));assert.throws(()=>createGhostStore(other).import(again.export()),/track|version/i);const damaged=structuredClone(records[0]);damaged.frames[1][1]+=1000;assert.throws(()=>validateGhost(damaged,session.track));const stationary=structuredClone(records[0]);for(const frame of stationary.frames)frame.splice(1,4,...stationary.frames[0].slice(1));assert.throws(()=>validateGhost(stationary,session.track),/lap|progress/);});
}
test('frame-rate independent at 30/60/120/144 fps with identical inputs',()=>{const states=[];for(const hz of [30,60,120,144]){const r=createRaceSession({mode:'time-trial',countdown:0});r.start();for(let i=0;i<hz*1.5;i++)r.advance(1/hz,{throttle:1,steer:.1});states.push(r.getState());}for(const s of states.slice(1))for(const field of ['x','y','z','yaw','speed'])assert(Math.abs(s.player[field]-states[0].player[field])<1e-7,field);});
test('grid, countdown, track selection and input validation are explicit',()=>{assert.throws(()=>getTrack('missing'));assert.throws(()=>createRaceSession({mode:'invalid'}));assert.throws(()=>createRaceSession({laps:0}));const r=createRaceSession({countdown:1}),initial={...r.player.state};r.advance(.25,{throttle:1});assert.deepEqual(r.player.state,initial);r.start();for(let i=0;i<4;i++)r.advance(.25,{throttle:1});assert.equal(r.getState().phase,'racing');assert.deepEqual(r.player.state,initial);r.advance(.1,{throttle:1});assert(r.player.state.speed>0);assert.throws(()=>r.advance(NaN));assert.throws(()=>r.advance(-1));assert.throws(()=>r.advance(.3));});
test('reverse driving cannot count a lap; teleporting cannot skip checkpoints',()=>{const track=getTrack('original'),p=createProgress(track),a={...track.at(0),grounded:true,speed:10},b={...track.at(-.1),grounded:true,speed:10,yaw:track.at(-.1).yaw+Math.PI};updateProgress(p,track,a,b,VEHICLE.step,0,1);assert.equal(p.laps,0);assert(p.wrongWay);const c={...track.at(track.length/2),grounded:true,speed:0};updateProgress(p,track,b,c,VEHICLE.step,1,1);assert(p.invalidReason);assert.equal(p.laps,0);});
test('respawn returns to last validated gate and invalidates only the recording',()=>{const r=createRaceSession({trackId:'suzuka',countdown:0});r.start();const gate=r.track.gates[3];r.player.progress.lastGateDistance=gate.distance;r.player.progress.expectedGate=4;r.player.progress.laps=1;r.player.state.boosts=1;r.player.state.y=-20;r.player.progress.invalidReason='fell';r.respawn();assert.equal(r.player.state.boosts,1);assert.equal(r.player.progress.expectedGate,4);assert.equal(r.player.progress.laps,1);assert.equal(r.player.progress.validForRecord,false);assert.equal(r.player.progress.invalidReason,'');assert(Math.hypot(r.player.state.x-gate.x,r.player.state.z-gate.z)<8);});
test('rail contacts cannot tunnel at boost speed; no steering at rest',()=>{const track=getTrack('original'),p=track.at(0),car=createVehicle(p);stepVehicle(car,{steer:1},VEHICLE.step,track);assert.equal(car.yaw,p.yaw);car.vx=p.nx*VEHICLE.boostSpeed;car.vz=p.nz*VEHICLE.boostSpeed;car.yaw=Math.atan2(p.nx,p.nz);for(let i=0;i<180;i++)stepVehicle(car,{throttle:1},VEHICLE.step,track);assert(track.project(car).off<=track.outer);for(const v of [car.x,car.y,car.z,car.vx,car.vz])assert(Number.isFinite(v));});
test('kart impacts dissipate energy and do not collide across decks',()=>{const track=getTrack('original'),p=track.at(0),a=createVehicle(p),b=createVehicle({...p,x:p.x+1});a.vx=20;b.vx=-20;const energy=a.vx*a.vx+b.vx*b.vx;assert(resolveKartContact(a,b,track));assert(a.vx*a.vx+a.vz*a.vz+b.vx*b.vx+b.vz*b.vz<=energy+.01);b.y=a.y+8;assert.equal(resolveKartContact(a,b,track),false);});
test('AI returns ordinary controls without mutating vehicle state',()=>{const track=getTrack('winding'),car=createVehicle(track.at(500)),before={...car},driver=createDriver();const input=readDriver(driver,car,track,VEHICLE.step);assert.deepEqual(car,before);assert(Math.abs(input.steer)<=1&&input.throttle>=0&&input.throttle<=1);});
test('universal input adapter preserves analog strength',()=>{const sample={moveX:0,moveZ:-.35,look:{x:0}},input=fromLabInput(sample,0);assert.equal(input.throttle,.35);assert.equal(input.steer,0);});
test('a held boost consumes a single charge and eventually expires',()=>{const track=getTrack('original'),car=createVehicle(track.at(0));for(let i=0;i<240;i++)stepVehicle(car,{throttle:1,boost:true},VEHICLE.step,track);assert.equal(car.boosts,2);assert.equal(car.boostLeft,0);});
test('height-aware support preserves both decks at each circuit crossing',()=>{for(const id of TRACK_IDS){const track=getTrack(id);let found=false;for(let i=0;i<track.segments.length&&!found;i++)for(let j=i+12;j<track.segments.length&&!found;j++){const a=track.segments[i],b=track.segments[j],d=a.dx*b.dz-a.dz*b.dx;if(Math.abs(d)<1e-9)continue;const qx=b.a.x-a.a.x,qz=b.a.z-a.a.z,t=(qx*b.dz-qz*b.dx)/d,u=(qx*a.dz-qz*a.dx)/d;if(t<0||t>1||u<0||u>1)continue;const ya=a.a.y+(a.b.y-a.a.y)*t,yb=b.a.y+(b.b.y-b.a.y)*u;if(Math.abs(ya-yb)<4)continue;const x=a.a.x+a.dx*t,z=a.a.z+a.dz*t,low=Math.min(ya,yb),high=Math.max(ya,yb);assert(Math.abs(track.support(x,z,low+.2)-low)<.2);assert(Math.abs(track.support(x,z,high+.2)-high)<.2);found=true;}assert(found,id+' crossing');}});
for(const scenario of letsgoHandling.scenarios)test('LetsGo handling reference: '+scenario.name,()=>{
 const flat={support:()=>0,resolve:(x,z)=>({x,z})},car=createVehicle();car.vz=car.speed=scenario.speed;
 let tick=0,index=0;
 for(const [ticks,throttle,steer] of scenario.phases)for(let i=0;i<ticks;i++){
  stepVehicle(car,{throttle,steer},VEHICLE.step,flat);tick++;
  if(tick!==scenario.samples[index]?.tick)continue;
  const expected=scenario.samples[index++];
  for(const field of ['x','z','yaw','speed','steering'])assert(Math.abs(car[field]-expected[field])<1e-8,`${scenario.name}: ${field} at ${tick}: ${car[field]} vs ${expected[field]}`);
 }
 assert.equal(index,scenario.samples.length);
});
test('a held turn can steer away from a rail after a head-on stop',()=>{
 const wall={support:()=>0,resolve:(x,z)=>({x:Math.min(0,x),z})},car=createVehicle({x:0,y:0,z:0,yaw:Math.PI/2});
 for(let i=0;i<120;i++)stepVehicle(car,{throttle:1,steer:1},VEHICLE.step,wall);
 assert(car.yaw>Math.PI/2+.15);assert(car.contacts>0);
});
test.after(()=>{writeFileSync(new URL('../TEST-RESULTS.json',import.meta.url),JSON.stringify({generatedAt:new Date().toISOString(),sourceRevision:'573664e824a04234240a24dfc2eae2273e30a4ca',visuals:'No renderer is required by these checks',fullRaces:reports},null,2)+'\n');});

test('right device input turns right in chase view and keyboard throttle stays independent',()=>{const r=fromLabInput({source:'keyboard',moveX:-Math.SQRT1_2,moveZ:Math.SQRT1_2,look:{x:0}},Math.PI);assert.equal(r.throttle,1);assert.equal(r.steer,-1);});
