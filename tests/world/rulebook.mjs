// Rulebook and world-checker checks.
//  1) The rulebook holds exactly the 26 blocks the owner approved
//     (docs/WORLD-RULES.md, section E), in the same order, each with a valid,
//     complete entry and the approved special rules.
//  2) The checker catches every kind of broken world, and lets good ones pass.
// Usage: node tests/world/rulebook.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=mkdtempSync(join(tmpdir(),'rulebook-')),entry=join(dir,'e.ts');
writeFileSync(entry,`export * from '${root}/src/world/rulebook.ts';export {checkWorld} from '${root}/src/world/checker.ts';export {BLOCK,SMALL,TINY} from '${root}/src/world/grid.ts';`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'o.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const M=await import(pathToFileURL(join(dir,'o.mjs')).href);
const {BLOCKS,BLOCK_IDS,checkWorld,BLOCK,SMALL,TINY}=M;
const R=[],check=(name,ok,detail='')=>R.push({check:name,result:ok?'PASS':'FAIL',detail});

// ---- 1. The rulebook ----
const doc=readFileSync(join(root,'docs/WORLD-RULES.md'),'utf8');
const section=doc.slice(doc.indexOf('## E. Blocks'),doc.indexOf('Built from other blocks'));
const docNames=[...section.matchAll(/^\d+\. ([^:]+):/gm)].map(m=>m[1].trim());
const names=BLOCK_IDS.map(id=>BLOCKS[id].name);
check('exactly the 26 approved blocks, same names and order as the notes',docNames.length===26&&names.length===26&&names.every((n,i)=>n===docNames[i]),names.length===26?'':`rulebook ${names.length}, notes ${docNames.length}`);
const STYLES=['merged','separate','flower','water'],BODIES=['solid','walk-through','swim','choice'],SIZES=['big','half','quarter'],SHAPES=['cube','wedge','smooth'];
const bad=BLOCK_IDS.filter(id=>{const b=BLOCKS[id];return !(/^#[0-9a-f]{6}$/i.test(b.colour)&&STYLES.includes(b.style)&&BODIES.includes(b.body)&&b.sizes.length&&b.sizes.every(s=>SIZES.includes(s))&&b.shapes.includes('cube')&&b.shapes.every(s=>SHAPES.includes(s))&&b.usedFor&&b.feel);});
check('every entry is complete and valid (colour, style, body, sizes, shapes, use, feel)',bad.length===0,bad.join(', '));
check('no feel numbers are set yet (each waits for the owner, game by game)',BLOCK_IDS.every(id=>Object.values(BLOCKS[id].numbers).every(v=>v===null)));
const b=BLOCKS;
const special=[
 ['grass, dirt, sand, fairway, green, gravel, bedrock: big only',['grass','dirt','sand','fairway','green','green-cup','gravel','bedrock'].every(id=>b[id].sizes.join()==='big')],
 ['concrete, rock, trunk, leaves: any size',['concrete','rock','trunk','leaves'].every(id=>b[id].sizes.length===3)],
 ['bedrock merged, one cube shape',b.bedrock.style==='merged'&&b.bedrock.shapes.join()==='cube'],
 ['trunk: cube and wedge; roots their own separate block; no bush block',b.trunk.shapes.join()==='cube,wedge'&&b.roots.style==='separate'&&!('bush' in b)],
 ['rock, leaves, cactus, cloud: separate blocks',['rock','leaves','cactus','cloud'].every(id=>b[id].style==='separate')],
 ['water: swim, current and falling current',b.water.body==='swim'&&b.water.ownSettings.includes('current')&&b.water.ownSettings.includes('falling-current')],
 ['flower: walk-through; decor: solid or walk-through by choice',b.flower.body==='walk-through'&&b.decor.body==='choice'&&b.decor.sizes.join()==='half,quarter'],
 ['lava: touching bumps, falling in respawns',b.lava.hazard.touch==='bump'&&b.lava.hazard.fallIn==='respawn'],
 ['cactus: touching bumps, landing on top kills',b.cactus.hazard.touch==='bump'&&b.cactus.hazard.landOnTop==='die'],
 ['cloud: big or half; leaves and trunk climbable',b.cloud.sizes.join()==='big,half'&&b.leaves.climbable&&b.trunk.climbable],
 ['removed blocks are gone (rough, field, mud, vines, lily pads, rail, curb)',['rough','field','mud','vines','lily-pads','rail','curb'].every(id=>!(id in b))],
 ['karts never bounce upward',M.KARTS_BOUNCE_UP===false],
];
const failed=special.filter(s=>!s[1]).map(s=>s[0]);
check(`the approved special rules hold (${special.length} of them)`,failed.length===0,failed.join(' | '));

// ---- 2. The checker ----
const c=(x,y,z,col='#808080')=>[x,y,z,col];
const base=()=>[{block:'bedrock',size:BLOCK,cells:[c(0,-1,0),c(1,-1,0)],name:'bed'},{block:'grass',size:BLOCK,cells:[c(0,0,0),c(1,0,0)],name:'grass'}];
const rules=w=>checkWorld(w).map(p=>p.rule);
check('a good small world passes',rules(base()).length===0,rules(base()).join(', '));
const cases=[
 ['an unknown block',[...base(),{block:'marble',size:BLOCK,cells:[c(0,1,0)],name:'m'}],'known block'],
 ['a size the block does not allow (half grass)',[...base(),{block:'grass',size:SMALL,cells:[c(0,2,0)],name:'g2'}],'size'],
 ['a size off the grid (30 cm)',[...base(),{block:'concrete',size:.3,cells:[c(0,1,0)],name:'x'}],'size'],
 ['a shape the block does not allow (bedrock wedge)',[...base(),{block:'bedrock',size:BLOCK,cells:[c(2,-1,0)],name:'b2',shape:'wedge'}],'shape'],
 ['a block off the grid',[...base(),{block:'concrete',size:BLOCK,cells:[c(0,1.5,0)],name:'x'}],'on the grid'],
 ['an invalid colour',[...base(),{block:'concrete',size:BLOCK,cells:[c(0,1,0,'green')],name:'x'}],'colour'],
 ['decor that does not say solid or walk-through',[...base(),{block:'decor',size:TINY,cells:[c(0,4,0)],name:'d'}],'decor choice'],
 ['a non-decor block choosing solid',[...base(),{block:'grass',size:BLOCK,cells:[c(2,0,0)],name:'g3',solid:false}],'decor choice'],
 ['two blocks in the same space (mixed sizes)',[...base(),{block:'rock',size:SMALL,cells:[c(1,1,1)],name:'r'}],'no overlap'],
 ['a block floating in the air',[...base(),{block:'rock',size:SMALL,cells:[c(0,6,0)],name:'r'}],'attached'],
 ['an island with no bedrock',[{block:'grass',size:BLOCK,cells:[c(0,0,0)],name:'g'}],'attached'],
];
for(const [what,world,rule] of cases){const got=rules(world);check(`catches ${what}`,got.includes(rule),got.join(', ')||'nothing caught');}
const cloud=[...base(),{block:'cloud',size:BLOCK,cells:[c(0,9,0),c(1,9,0)],name:'cloud'}];
check('a cloud may float on its own',rules(cloud).length===0,rules(cloud).join(', '));
const tuft=[...base(),{block:'decor',size:TINY,cells:[c(0,4,0,'#55aa33')],name:'tuft',solid:false},{block:'decor',size:SMALL,cells:[c(2,2,0)],name:'stool',solid:true}];
check('walk-through and solid decor both pass, attached to the grass',rules(tuft).length===0,rules(tuft).join(', '));

console.table(R);const fail=R.some(r=>r.result==='FAIL');console.log(fail?'FAIL':'PASS: the rulebook is the approved one and the checker catches every broken world.');process.exit(fail?1:0);
