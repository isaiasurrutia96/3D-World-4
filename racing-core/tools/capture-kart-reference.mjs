// Explicit capture of the pinned, unmodified LetsGo controller. Never part of runtime/build.
import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const repo = process.argv[2];
if (!repo)
    throw Error('Usage: node racing-core/tools/capture-kart-reference.mjs /path/to/3D-World-3');
const revision = '573664e824a04234240a24dfc2eae2273e30a4ca', root = fileURLToPath(new URL('../../', import.meta.url)), temp = await mkdtemp(join(tmpdir(), 'letsgo-kart-source-'));
try {
    const archive = execFileSync('git', ['-C', repo, 'archive', revision, 'apps/letsgo-racing/src'], { maxBuffer: 16000000 });
    const unpack = spawnSync('tar', ['-x', '-C', temp], { input: archive });
    if (unpack.status !== 0)
        throw Error('Reference extraction failed');
    const src = join(temp, 'apps/letsgo-racing/src'), files = ['vehicle-controller.js', 'vehicle-contact.js', 'running-controller.js', 'animation/backflip-motion.js', 'kart.js', 'items.js', 'world.js'], hashes = {};
    for (const file of files)
        hashes[file] = createHash('sha256').update(await readFile(join(src, file))).digest('hex');
    const bundle = join(temp, 'capture.mjs'), output = resolve(root, 'racing-core/kart/reference.json');
    const code = `
 import {createVehicleState,stepVehicle} from ${JSON.stringify(join(src, 'vehicle-controller.js'))};
 import {COURSES} from ${JSON.stringify(join(src, 'courses.js'))};
 import {trackSegments} from ${JSON.stringify(join(src, 'track.js'))};
 import {skylineTrack} from ${JSON.stringify(join(src, 'skyline-track.js'))};
 import {suzukaTrack} from ${JSON.stringify(join(src, 'suzuka-track.js'))};
 import {windingTrack} from ${JSON.stringify(join(src, 'winding-track.js'))};
 import {createRoadSurface} from ${JSON.stringify(join(src, 'world.js'))};
 import {writeFileSync} from 'node:fs';
 const phase=(ticks,input={},boost=false)=>({ticks,input,boost});
 const scenarios=[
  {name:'accelerate to normal cap',initial:{},phases:[phase(480,{throttle:1})]},
  {name:'coast from normal cap',initial:{speed:120*.44704},phases:[phase(480)]},
  {name:'brake to rest without reversing',initial:{speed:120*.44704},phases:[phase(240,{throttle:1,brake:true})]},
  {name:'reverse braking and reverse cap',initial:{speed:24},phases:[phase(360,{throttle:-1})]},
  {name:'forward recovery from reverse',initial:{speed:-8},phases:[phase(180,{throttle:1})]},
  {name:'short left tap and release',initial:{speed:12},phases:[phase(12,{throttle:1,steer:1}),phase(48,{throttle:1})]},
  {name:'held left turn and release',initial:{speed:25},phases:[phase(180,{throttle:1,steer:1}),phase(48,{throttle:1})]},
  {name:'countersteering',initial:{speed:20},phases:[phase(36,{throttle:1,steer:1}),phase(36,{throttle:1,steer:-1}),phase(48,{throttle:1})]},
  {name:'analog steering',initial:{speed:20},phases:[phase(60,{throttle:1,steer:.2}),phase(60,{throttle:1,steer:.5}),phase(60,{throttle:1,steer:.8})]},
  {name:'reference button throttle semantics',initial:{},phases:[phase(60,{throttle:.2}),phase(60,{throttle:.8}),phase(60,{throttle:-.4})]},
  {name:'reverse steering',initial:{speed:-8},phases:[phase(120,{throttle:-1,steer:1})]},
  {name:'steering while stopped',initial:{},phases:[phase(120,{steer:1}),phase(120,{steer:-1})]},
  {name:'lateral grip decay',initial:{speed:20,lateralSpeed:8},phases:[phase(120)]},
  {name:'boost acceleration and expiry recovery',initial:{speed:120*.44704},phases:[phase(420,{throttle:1},true)]},
  {name:'boost from rest without gas',initial:{},phases:[phase(360,{},true)]},
  {name:'brake overrides boost',initial:{speed:30},phases:[phase(180,{throttle:1,brake:true},true)]},
  {name:'reverse overrides boost',initial:{speed:10},phases:[phase(180,{throttle:-1},true)]},
  {name:'boost activation cancels reverse speed',initial:{speed:-8},phases:[phase(120,{},true)]},
  {name:'slope height pitch and bank',world:'slope',initial:{},phases:[phase(180,{throttle:1,steer:.15})]},
  {name:'airborne steering and landing',world:'flat',initial:{y:8,grounded:false,verticalVelocity:-1,speed:12},phases:[phase(180,{steer:1})]},
  {name:'leaving a ledge',world:'ledge',initial:{speed:25},phases:[phase(180,{throttle:1})]},
  {name:'lower deck stays below upper deck',world:'decks',initial:{y:0,speed:10},phases:[phase(120,{throttle:1})]},
  {name:'upper deck remains on upper deck',world:'decks',initial:{y:12,speed:10},phases:[phase(120,{throttle:1})]},
 ];
 const tracks=[trackSegments,skylineTrack.segments,suzukaTrack.segments,windingTrack.segments];
 for(let i=0;i<4;i++){
  const c=COURSES[i],id=['original','skyline','suzuka','winding'][i];
  scenarios.push({name:id+' original start',world:id,initial:{...c.start},phases:[phase(120,{throttle:1})]});
  const segments=tracks[i];let best=segments[40],grade=0;
  for(const s of segments.slice(40,-40)){const slope=Math.abs(s.b.y-s.a.y)/Math.hypot(s.b.x-s.a.x,s.b.z-s.a.z);if(slope>grade){best=s;grade=slope;}}
  scenarios.push({name:id+' ramp',world:id,initial:{x:best.a.x,y:best.a.y,z:best.a.z,yaw:Math.atan2(best.b.x-best.a.x,best.b.z-best.a.z),speed:8},phases:[phase(60,{throttle:1})]});
 }
 const sourceRoads=Object.fromEntries(['original','skyline','suzuka','winding'].map((id,i)=>[id,createRoadSurface(tracks[i])]));
 const fields=['x','y','z','yaw','speed','lateralSpeed','steering','steerHoldTime','steerHoldDirection','wheelRotation','verticalVelocity','grounded','pitch','bank','boostTime'];
 for(const scenario of scenarios){
  const world=scenario.world||'flat',supportHeight=(x,z,max)=>{if(sourceRoads[world])return sourceRoads[world](x,z,max);if(world==='ledge'&&z>20)return null;const heights=world==='decks'?[12,0]:[world==='slope'?.08*z+.03*x:0];return heights.find(y=>y<=max)??null;};
  const state={...createVehicleState(),x:0,y:0,z:0,yaw:0,...scenario.initial},physics={supportHeight,resolveHorizontal:(x,z,nx,nz)=>({x:nx,z:nz})};
  scenario.world=world;scenario.samples=[];let tick=0;
  for(const p of scenario.phases)for(let i=0;i<p.ticks;i++){
   if(p.boost&&i===0){state.boostTime=2;state.speed=Math.max(0,state.speed);}
   stepVehicle(state,p.input,1/120,physics);tick++;
   if(tick%6===0||i===0||i===p.ticks-1)scenario.samples.push({tick,state:Object.fromEntries(fields.map(f=>[f,state[f]]))});
  }
 }
 writeFileSync(${JSON.stringify(output)},JSON.stringify({source:{repository:'isaiasurrutia96/3D-World-3',revision:${JSON.stringify(revision)},files:${JSON.stringify(hashes)}},step:1/120,notes:'Unmodified source controller and road queries; horizontal contacts disabled by identity world resolver. Boost phases reproduce the source Nitro grant (2 s, cancel reverse). Initial positions are explicit. No old rebuild is used.',scenarios},null,2)+'\\n');
 `;
    await build({ stdin: { contents: code, resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: bundle, plugins: [{ name: 'reference-three', setup(b) { b.onResolve({ filter: /^three$/ }, () => ({ path: resolve(root, 'node_modules/three/build/three.module.js') })); } }] });
    await import(pathToFileURL(bundle).href);
    console.log('Captured original handling traces at ' + revision);
}
finally {
    await rm(temp, { recursive: true, force: true });
}
