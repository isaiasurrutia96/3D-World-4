// Island checks. 1) The rebuilt island (src/world/) is identical, piece by
// piece, to the approved first island (reference/island-v1/). 2) Its cells
// follow the island's rules (grid, no overlaps, nothing floating, etc.).
// Usage: node tests/island/check.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dir=mkdtempSync(join(tmpdir(),'island-check-')),entry=join(dir,'entry.ts');
writeFileSync(entry,`import {Scene} from 'three';
import {buildIsland as oldIsland} from '${root}/reference/island-v1/island.ts';
import {buildIsland as newIsland} from '${root}/src/world/island/index.ts';
import {terrainCells} from '${root}/src/world/island/terrain.ts';
import {natureCells} from '${root}/src/world/island/nature.ts';
import * as L from '${root}/src/world/island/layout.ts';
export const make=()=>({old:oldIsland(new Scene()).root,neu:newIsland(new Scene()).root,terrain:terrainCells(),nature:natureCells(),L});`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'out.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const {make}=await import(pathToFileURL(join(dir,'out.mjs')).href);
const {old,neu,terrain,nature,L}=make();
const results=[];const check=(name,ok,detail='')=>results.push({check:name,result:ok?'PASS':'FAIL',detail});

// ---- 1. Identical to the approved island ----
const same=(a,b)=>{if(!a&&!b)return true;if(!a||!b||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;};
check('same pieces, same order',old.children.length===neu.children.length&&old.children.every((c,i)=>c.name===neu.children[i].name&&c.type===neu.children[i].type),`${neu.children.length} pieces`);
let geoOk=true,diffs=[];
old.children.forEach((a,i)=>{const b=neu.children[i];if(!b)return;
 for(const k of ['position','normal','color','uv']){if(!same(a.geometry.attributes[k]?.array,b.geometry.attributes[k]?.array)){geoOk=false;diffs.push(a.name+'.'+k);}}
 if(!same(a.geometry.index?.array,b.geometry.index?.array)){geoOk=false;diffs.push(a.name+'.index');}
 if(a.isInstancedMesh&&(!same(a.instanceMatrix.array,b.instanceMatrix.array)||!same(a.instanceColor?.array,b.instanceColor?.array))){geoOk=false;diffs.push(a.name+'.instances');}
 if(!a.position.equals(b.position)||!a.rotation.equals(b.rotation)){geoOk=false;diffs.push(a.name+'.placement');}
 const ma=a.material,mb=b.material;for(const k of ['roughness','metalness','opacity','transparent','vertexColors'])if(ma[k]!==mb[k]){geoOk=false;diffs.push(a.name+'.material.'+k);}
 if(!ma.color.equals(mb.color)){geoOk=false;diffs.push(a.name+'.material.color');}
});
const verts=neu.children.reduce((s,c)=>s+(c.geometry.attributes.position.count*(c.count||1)),0);
check('every point, colour and block identical to Island Checkpoint 1',geoOk,geoOk?`${verts.toLocaleString()} points compared`:[...new Set(diffs)].slice(0,6).join(', '));

// ---- 2. Island rules ----
// Everything in one grid of tiny cells (10.75 cm) so different sizes compare.
const occ=new Map();const add=(cells,scale,mat)=>{for(const [x,y,z] of cells)for(let i=0;i<scale;i++)for(let j=0;j<scale;j++)for(let k=0;k<scale;k++){const key=`${x*scale+i},${y*scale+j},${z*scale+k}`;if(!occ.has(key))occ.set(key,[]);occ.get(key).push(mat);}};
add(terrain.grass,4,'grass');add(terrain.dirt,4,'dirt');add(terrain.stone,4,'stone');
add(nature.trunk,2,'trunk');add(nature.leaves,2,'leaves');add(nature.bush,2,'bush');add(nature.rock,2,'rock');
add(nature.roots,1,'roots');add(nature.stems,1,'stems');add(nature.centres,1,'centres');add(nature.petals,1,'petals');
const overlaps=[...occ.values()].filter(v=>v.length>1).map(v=>v.join('+'));
check('no two blocks share the same space',overlaps.length===0,overlaps.length?[...new Set(overlaps)].join(', '):'');
const allInt=Object.values({...terrain,...nature}).flat().every(([x,y,z])=>Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(z));
check('every block sits exactly on the grid',allInt);
// Island footprint (14 × 14 blocks = -28..27 in tiny cells).
const inside=[...occ.keys()].every(k=>{const [x,,z]=k.split(',').map(Number);return x>=-28&&x<28&&z>=-28&&z<28;});
check('nothing sticks out past the island edge',inside);
// Supported: every ground-level block of trunk, roots, bush, rock, stems sits on something.
const floating=[];for(const [name,cells,scale] of [['trunk',nature.trunk,2],['roots',nature.roots,1],['bush',nature.bush,2],['rock',nature.rock,2],['stems',nature.stems,1]]){
 for(const [x,y,z] of cells){for(let i=0;i<scale;i++)for(let k=0;k<scale;k++){const below=`${x*scale+i},${y*scale-1},${z*scale+k}`;if(!occ.has(below))floating.push(name);}}}
check('trunk, roots, bush, rock and flower stems all rest on solid ground',floating.length===0,floating.length?[...new Set(floating)].join(', ')+' hanging':'');
const raised=nature.trunk.concat().every(([x,,z])=>L.isRaised(Math.floor(x/2),Math.floor(z/2)))&&nature.roots.every(([x,,z])=>L.isRaised(Math.floor(x/4),Math.floor(z/4)));
check('tree and all roots stand on the raised corner',raised);
const pondClear=[...occ.entries()].every(([k,v])=>{const [x,y,z]=k.split(',').map(Number);return !(L.isPond(Math.floor(x/4),Math.floor(z/4))&&y>=0&&!v.includes('grass'));});
check('nothing stands in the pond',pondClear);
check('8 root stumps of 6 blocks each',nature.roots.length===48,`${nature.roots.length} root blocks`);
check('3 flowers, each a 3-block stem, centre and 4 petals',nature.stems.length===9&&nature.centres.length===3&&nature.petals.length===12);
const stoneLayers=[...new Set(terrain.stone.map(c=>c[1]))].length;
check('stone underside: 7 layers, each one block narrower on every side',stoneLayers===7&&terrain.stone.length===[14,12,10,8,6,4,2].reduce((s,w)=>s+w*w,0));

console.table(results);
const fail=results.some(r=>r.result==='FAIL');
console.log(fail?'FAIL':'PASS: the rebuilt island is identical to the approved one and follows every rule.');
process.exit(fail?1:0);
