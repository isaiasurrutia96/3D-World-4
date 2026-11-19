// Island checks.
//  1) The island is identical, piece by piece, to the approved first island
//     (reference/island-v1/), except the changes the owner approved on 19 Nov
//     2026: the stone underside is now bedrock (merged, smooth, one colour),
//     and the roots are small trunk blocks merged into the trunk.
//  2) It passes the world checker (src/world/checker.ts).
//  3) Its own layout rules (raised corner, roots, flowers, bedrock diamond).
// Usage: node tests/island/check.mjs
import {build} from 'esbuild';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dir=mkdtempSync(join(tmpdir(),'island-check-')),entry=join(dir,'entry.ts');
writeFileSync(entry,`import {Scene,Box3} from 'three';
import {buildIsland as oldIsland} from '${root}/reference/island-v1/island.ts';
import {buildIsland as newIsland} from '${root}/src/world/island/index.ts';
import {islandParts} from '${root}/src/world/island/parts.ts';
import {checkWorld} from '${root}/src/world/checker.ts';
import {natureCells} from '${root}/src/world/island/nature.ts';
import {terrainCells} from '${root}/src/world/island/terrain.ts';
import * as L from '${root}/src/world/island/layout.ts';
export const make=()=>({old:oldIsland(new Scene()).root,neu:newIsland(new Scene()).root,parts:islandParts(),checkWorld,nature:natureCells(),terrain:terrainCells(),L,Box3});`);
await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',outfile:join(dir,'out.mjs'),logLevel:'error',nodePaths:[join(root,'node_modules')]});
const {make}=await import(pathToFileURL(join(dir,'out.mjs')).href);
const {old,neu,parts,checkWorld,nature,terrain,L,Box3}=make();
const results=[];const check=(name,ok,detail='')=>results.push({check:name,result:ok?'PASS':'FAIL',detail});

// ---- 1. Identical to the approved island, except the approved changes ----
const same=(a,b)=>{if(!a&&!b)return true;if(!a||!b||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;};
const CHANGED={stone:'bedrock','tree-roots':null}; // old name -> new name (null: merged into the trunk)
const oldKept=old.children.filter(c=>!(c.name in CHANGED)&&c.name!=='tree-trunk');
const newKept=neu.children.filter(c=>c.name!=='bedrock'&&c.name!=='tree-trunk');
check('same pieces, same order (apart from the approved changes)',oldKept.length===newKept.length&&oldKept.every((c,i)=>c.name===newKept[i].name&&c.type===newKept[i].type),`${newKept.length} unchanged pieces; new: bedrock, tree-trunk (with roots)`);
let geoOk=true,diffs=[];
oldKept.forEach((a,i)=>{const b=newKept[i];if(!b)return;
 for(const k of ['position','normal','color','uv']){if(!same(a.geometry.attributes[k]?.array,b.geometry.attributes[k]?.array)){geoOk=false;diffs.push(a.name+'.'+k);}}
 if(!same(a.geometry.index?.array,b.geometry.index?.array)){geoOk=false;diffs.push(a.name+'.index');}
 if(a.isInstancedMesh&&(!same(a.instanceMatrix.array,b.instanceMatrix.array)||!same(a.instanceColor?.array,b.instanceColor?.array))){geoOk=false;diffs.push(a.name+'.instances');}
 if(!a.position.equals(b.position)||!a.rotation.equals(b.rotation)){geoOk=false;diffs.push(a.name+'.placement');}
 const ma=a.material,mb=b.material;for(const k of ['roughness','metalness','opacity','transparent','vertexColors'])if(ma[k]!==mb[k]){geoOk=false;diffs.push(a.name+'.material.'+k);}
 if(!ma.color.equals(mb.color)){geoOk=false;diffs.push(a.name+'.material.color');}
});
const verts=newKept.reduce((s,c)=>s+(c.geometry.attributes.position.count*(c.count||1)),0);
check('grass, dirt, pond, leaves, bush, rock and flowers: every point and colour identical to Island Checkpoint 1',geoOk,geoOk?`${verts.toLocaleString()} points compared`:[...new Set(diffs)].slice(0,6).join(', '));

const bed=neu.getObjectByName('bedrock'),oldStone=old.getObjectByName('stone');
const bedCol=bed.geometry.attributes.color.array;let oneColour=true;for(let i=3;i<bedCol.length;i++)if(bedCol[i]!==bedCol[i%3])oneColour=false;
const bb=new Box3().setFromObject(bed),sb=new Box3().setFromObject(oldStone);
check('bedrock: one merged shape, one colour, exactly where the stone was',!bed.isInstancedMesh&&oneColour&&bb.min.distanceTo(sb.min)<1e-6&&bb.max.distanceTo(sb.max)<1e-6,`${bed.geometry.attributes.position.count.toLocaleString()} points, all one colour`);
const tr=neu.getObjectByName('tree-trunk'),ot=new Box3().setFromObject(old.getObjectByName('tree-trunk')).union(new Box3().setFromObject(old.getObjectByName('tree-roots')));
const tb=new Box3().setFromObject(tr);
check('trunk and roots: one merged shape covering exactly the old trunk and roots',!tr.isInstancedMesh&&tb.min.distanceTo(ot.min)<1e-6&&tb.max.distanceTo(ot.max)<1e-6);

// ---- 2. The world checker ----
const problems=checkWorld(parts);
check('passes the world checker (rulebook blocks, sizes, grid, no overlap, attached, solid matches)',problems.length===0,problems.length?problems.slice(0,3).map(p=>`${p.rule}: ${p.part}: ${p.detail}`).join(' | '):`${parts.length} parts`);

// ---- 3. The island's own layout ----
const fineCells=(cells,n)=>cells.flatMap(([x,y,z])=>{const o=[];for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++)o.push([x*n+i,y*n+j,z*n+k]);return o;});
const all=parts.flatMap(p=>fineCells(p.cells,Math.round(p.size/.1075)));
check('nothing sticks out past the island edge',all.every(([x,,z])=>x>=-28&&x<28&&z>=-28&&z<28));
const raised=nature.trunk.every(([x,,z])=>L.isRaised(Math.floor(x/2),Math.floor(z/2)))&&nature.roots.every(([x,,z])=>L.isRaised(Math.floor(x/4),Math.floor(z/4)));
check('tree and all roots stand on the raised corner',raised);
const pondClear=parts.filter(p=>p.block!=='water'&&p.block!=='grass').every(p=>fineCells(p.cells,Math.round(p.size/.1075)).every(([x,y,z])=>!(L.isPond(Math.floor(x/4),Math.floor(z/4))&&y>=0)));
check('nothing but water stands in the pond',pondClear);
check('8 root stumps of 6 blocks each',nature.roots.length===48,`${nature.roots.length} root blocks`);
check('3 flowers, each a 3-block stem, centre and 4 petals',nature.stems.length===9&&nature.centres.length===3&&nature.petals.length===12);
const layers=[...new Set(terrain.bedrock.map(c=>c[1]))].length;
check('bedrock underside: 7 layers, each one block narrower on every side',layers===7&&terrain.bedrock.length===[14,12,10,8,6,4,2].reduce((s,w)=>s+w*w,0));

console.table(results);
const fail=results.some(r=>r.result==='FAIL');
console.log(fail?'FAIL':'PASS: the island matches the approved one (with the approved changes) and follows every rule.');
process.exit(fail?1:0);
