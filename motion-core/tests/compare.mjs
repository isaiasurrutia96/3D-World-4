// Section 1 checks. Runs the new controller through scripted stick moves and,
// when the 3D-WORLD-3 reference repo sits next to this one, runs the old
// controller through the same moves and compares them frame by frame.
// Usage: node motion-core/tests/compare.mjs
import {build} from 'esbuild';
import {existsSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createMoveController} from '../controller.js';

const here=dirname(fileURLToPath(import.meta.url)),ref=resolve(here,'../../../3D-WORLD-3');
const rev=a=>[Math.sin(a),Math.cos(a)];
// Each scenario: seconds, and stick(t) -> [x, y] in world terms (y = away from camera).
const S={
 'full push from standing':[3,()=>[0,1]],
 'half push (walk)':[3,()=>[0,.4]],
 'run, then let go':[5,t=>t<3?[0,1]:[0,0]],
 'short burst, then let go':[2.5,t=>t<.6?[0,1]:[0,0]],
 '90° turn while walking':[4,t=>t<2?[0,.45]:[.45,0]],
 '90° turn while running':[4,t=>t<2?[0,1]:[1,0]],
 'reversal while running (skid)':[4,t=>t<2?[0,1]:[0,-1]],
 'slow circle':[6,t=>rev(t*.25*Math.PI*2).map(v=>v*.5)],
 'fast circle':[6,t=>rev(t*.8*Math.PI*2)],
 'tiny taps':[3,t=>Math.floor(t/.05)%2?[0,.3]:[0,0]],
};

async function oldFactory(){
 if(!existsSync(join(ref,'src/player/Player.ts')))return null;
 const dir=mkdtempSync(join(tmpdir(),'old-move-')),entry=join(dir,'old.ts'),out=join(dir,'old.mjs');
 writeFileSync(entry,`import {Scene,Vector3} from 'three';
import {CollisionWorld} from '${ref}/src/physics/CollisionWorld.ts';
import {buildSlab,TEST_GROUND} from '${ref}/src/world/Slab.ts';
import {Player} from '${ref}/src/player/Player.ts';
const scene=new Scene(),collision=new CollisionWorld();buildSlab(scene,collision,{});
export function makeOld(){const start=new Vector3(0,TEST_GROUND.y,-45);const p=new Player(collision,start.clone(),{});(p as any).teleport?.(start.clone(),0);
 const stub={move:{x:0,y:0},look:{x:0,y:0},isDown:()=>false,wasPressed:()=>false,wasReleased:()=>false,chargeOf:()=>null,chargingAction:()=>null,chargeNow:()=>0} as any;
 for(let i=0;i<60;i++)p.update(1/60,stub,0);const o=p.position.clone();
 return {step(dt:number,x:number,y:number){stub.move.x=x;stub.move.y=y;p.update(dt,stub,0);},
  get x(){return p.position.x-o.x},get z(){return p.position.z-o.z},get speed(){return p.speed},get facing(){return (p as any).facing},get state(){return p.stateName}};}`);
 await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:out,logLevel:'error',nodePaths:[join(ref,'node_modules')]});
 return (await import(pathToFileURL(out).href)).makeOld;
}

const angle=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const makeOld=await oldFactory(),rows=[];let pass=true;
for(const [name,[secs,stick]] of Object.entries(S)){
 const n=createMoveController(),f=createMoveController(),o=makeOld?makeOld():null;
 let dPos=0,dSpeed=0,dFace=0,fPos=0;const dt=1/60;
 for(let i=0;i<Math.round(secs/dt);i++){
  const [x,y]=stick(i*dt);n.step(dt,x,y);f.advance(dt,x,y);
  if(o){o.step(dt,x,y);dPos=Math.max(dPos,Math.hypot(n.state.x-o.x,n.state.z-o.z));dSpeed=Math.max(dSpeed,Math.abs(n.state.speed-o.speed));dFace=Math.max(dFace,angle(n.state.facing,o.facing));}
  fPos=Math.max(fPos,Math.hypot(n.state.x-f.state.x,n.state.z-f.state.z));
 }
 // Same moves at other frame rates (fixed-step version): how far apart do they end?
 const ends=[30,60,120,144].map(fps=>{const c=createMoveController();for(let i=0;i<Math.round(secs*fps);i++){const [x,y]=stick(i/fps);c.advance(1/fps,x,y);}return c.state;});
 const spread=Math.max(...ends.map(a=>Math.max(...ends.map(b=>Math.hypot(a.x-b.x,a.z-b.z)))));
 const match=!o||(dPos<.001&&dSpeed<.001&&dFace<.001);if(!match)pass=false;
 rows.push({test:name,'old vs new: max position gap (mm)':o?(dPos*1000).toFixed(3):'n/a','speed gap (m/s)':o?dSpeed.toFixed(4):'n/a','facing gap (°)':o?(dFace*57.3).toFixed(3):'n/a',
  'fixed-step vs old timing (cm)':(fPos*100).toFixed(1),'30/60/120/144 fps spread (cm)':(spread*100).toFixed(1)});
}
console.table(rows);

// Feel numbers (fixed-step version, the one the game will use).
const c=createMoveController(),t=k=>{c.place();let i=0;while(i<600){c.advance(1/120,0,k.stick);i++;if(k.until(c.state))return i/120;}return NaN;};
const toWalk=t({stick:.55,until:s=>s.speed>=3.1*.99}),toRun=t({stick:1,until:s=>s.speed>=8.6*.99});
function stopDist(runSecs){const m=createMoveController();for(let i=0;i<runSecs*120;i++)m.advance(1/120,0,1);const z0=m.state.z;let i=0;while(m.state.speed>0&&i<1200){m.advance(1/120,0,0);i++;}return {dist:m.state.z-z0,time:i/120};}
function skid(){const m=createMoveController();for(let i=0;i<240;i++)m.advance(1/120,0,1);let i=0,sk=0;while(i<480){m.advance(1/120,0,-1);if(m.state.skidding)sk++;i++;}return sk/120;}
function radius(){const m=createMoveController();let pts=[];for(let i=0;i<1200;i++){const a=i/120*1.2*Math.PI*2;m.advance(1/120,Math.sin(a),Math.cos(a));if(i>600)pts.push([m.state.x,m.state.z]);}
 const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cz=pts.reduce((a,p)=>a+p[1],0)/pts.length;return pts.reduce((a,p)=>a+Math.hypot(p[0]-cx,p[1]-cz),0)/pts.length;}
const longStop=stopDist(4),shortStop=stopDist(.5);
const still=createMoveController();for(let i=0;i<600;i++)still.advance(1/60,.0005,0);
console.table([
 {measure:'time to walking speed (3.1 m/s)',value:toWalk.toFixed(2)+' s'},
 {measure:'time to full running speed (8.6 m/s)',value:toRun.toFixed(2)+' s'},
 {measure:'slide after a long run, then letting go',value:longStop.dist.toFixed(2)+' m in '+longStop.time.toFixed(2)+' s'},
 {measure:'slide after a short burst, then letting go',value:shortStop.dist.toFixed(2)+' m in '+shortStop.time.toFixed(2)+' s'},
 {measure:'skid time on a full reversal at a run',value:skid().toFixed(2)+' s'},
 {measure:'smallest circle at full speed (stick spun fast)',value:radius().toFixed(2)+' m radius'},
 {measure:'drift with stick barely touched (10 s)',value:(Math.hypot(still.state.x,still.state.z)*1000).toFixed(1)+' mm'},
]);
console.log(makeOld?(pass?'PASS: new controller matches the old one on every test.':'FAIL: new controller differs from the old one.'):'Old reference repo not found: comparison skipped.');
process.exit(pass?0:1);
