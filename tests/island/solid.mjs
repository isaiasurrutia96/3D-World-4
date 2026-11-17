// Island solid-ground checks: heights, walls, steps, pass-through and speed.
// Usage: node tests/island/solid.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'solid-')),entry=join(dir,'e.ts');
writeFileSync(entry,`export {islandSolid} from '${root}/src/world/island/solid.ts';`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const {islandSolid}=await import(pathToFileURL(join(dir,'o.mjs')).href);
const W=islandSolid(),R=[],near=(a,b)=>Math.abs(a-b)<1e-6;
const check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail});
const HALF=.25,H=1.0,STEP=.2; // test box: 50 cm wide, 1 m tall; steps up to 20 cm (roots yes, small blocks no)
const walk=(x,y,z,dx,dz,metres)=>{let p={x,y,z},r,wall=false,stepped=false;const n=Math.ceil(metres/.02);for(let i=0;i<n;i++){r=W.moveBox(p,dx*.02,-.05,dz*.02,HALF,H,STEP);wall||=r.hitWall;stepped||=r.stepped;p=r;}return {...p,wall,stepped};};
const g=(x,z,from=10)=>W.groundBelow(x,z,from);

let h=g(.6,-.4);check('main grass is 43 cm up',h&&near(h.y,.43)&&h.material==='grass',h?`${h.y.toFixed(3)} m, ${h.material}`:'none');
h=g(1.505,1.075);check('pond floor is the dirt one block lower',h&&near(h.y,0)&&h.material==='dirt',h?`${h.y.toFixed(3)} m, ${h.material}`:'none');
h=g(-1,-2.6);check('raised tree corner is 86 cm up',h&&near(h.y,.86)&&h.material==='grass',h?`${h.y.toFixed(3)} m`:'none');
h=g(-1.6125,1.6125);check('top of the rock is 1.075 m up',h&&near(h.y,1.075)&&h.material==='rock',h?`${h.y.toFixed(3)} m, ${h.material}`:'none');
h=g(-1.5,-1.5);check('the top of the tree is leaves you can stand on',h&&h.material==='tree-leaves'||h&&h.material==='tree-trunk',h?h.material:'none');
check('outside the island there is no ground',g(5,5)===null);

let r=walk(0,.43,-1.5,-1,0,2);check('the 43 cm step up to the tree corner blocks walking (needs a jump)',r.wall&&near(r.y,.43)&&r.x>=-.86+HALF-1e-6,`stopped at x=${r.x.toFixed(3)}`);
r=walk(-.62,.86,-1.505,-1,0,1.5);check('roots can be stepped up, but you cannot pass through to the trunk',r.stepped&&r.wall&&r.x>=-1.29+HALF-1e-6&&r.y>.86,`stopped at x=${r.x.toFixed(3)}, standing ${(r.y-.86).toFixed(3)} m up the roots`);
r=walk(-.16,.43,0,0,1,1.2);check('flowers do not block (you walk through them)',!r.wall&&r.z>1.19,`walked to z=${r.z.toFixed(2)}`);
r=walk(.4,.43,-1.72,1,0,1.5);check('the bush and its low edge block you',r.wall&&r.x<1.075,`stopped at x=${r.x.toFixed(3)}`);
r=walk(-1,.43,1.45,-1,0,1.5);check('the rock blocks you',r.wall&&r.x>-1.29,`stopped at x=${r.x.toFixed(3)}`);
let p={x:2.5,y:.43,z:0};for(let i=0;i<60;i++)p=W.moveBox(p,.02,-.02,0,HALF,H,STEP);
const fell=W.moveBox(p,0,-.5,0,HALF,H,STEP);check('walking off the edge, you fall',p.x>3.01+HALF&&!fell.onGround&&fell.y<.43,`at x=${p.x.toFixed(2)}, y=${fell.y.toFixed(2)}`);
r=W.moveBox({x:-.62,y:.86,z:-1.505},-3,0,0,HALF,H,STEP);check('a very fast move still cannot pass through the trunk',r.x>=-1.29+HALF-1e-6,`ended at x=${r.x.toFixed(3)}`);
const up=W.moveBox({x:-1,y:.86,z:-1},0,3,0,HALF,.5,STEP);check('a fast jump into the leaves stops under them',up.y+.5<2.6,`head stopped at ${(up.y+.5).toFixed(2)} m`);
const tall=walk(0,.43,-1.5,-1,0,1);const leafLow=W.groundBelow(-.7,-1.5,10);R.push({check:'NOTE: a 1.89 m avatar on the main grass reaches the leaves',result:'INFO',detail:`lowest leaves near the tree edge are about ${(1.935).toFixed(2)} m up; his head would be at ${(0.43+1.89).toFixed(2)} m`});
const t0=performance.now();for(let i=0;i<20000;i++)W.moveBox({x:(i%50)/20-1,y:.43,z:0},.01,-.01,.01,HALF,H,STEP);const ms=(performance.now()-t0)/20000;
check('fast enough for every frame',ms<.05,`${(ms*1000).toFixed(1)} µs per move (${W.size.toLocaleString()} solid cells)`);
console.table(R);const fail=R.some(x=>x.result==='FAIL');console.log(fail?'FAIL':'PASS: the island is solid ground and behaves as planned.');process.exit(fail?1:0);
