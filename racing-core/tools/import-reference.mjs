// Regenerate authoring data explicitly; never run this during a game build.
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
const repo=process.argv[2];if(!repo)throw Error('Usage: node racing-core/tools/import-reference.mjs /path/to/3D-World-3 [revision]');
const revision=execFileSync('git',['-C',repo,'rev-parse',process.argv[3]||'573664e824a04234240a24dfc2eae2273e30a4ca'],{encoding:'utf8'}).trim();
const temp=await mkdtemp(join(tmpdir(),'racing-reference-')),root=fileURLToPath(new URL('../../',import.meta.url));
try{
 const archive=execFileSync('git',['-C',repo,'archive',revision,'apps/letsgo-racing/src'],{maxBuffer:16000000});const unpack=spawnSync('tar',['-x','-C',temp],{input:archive});if(unpack.status!==0)throw Error('Could not unpack reference');
 const entry=join(temp,'apps/letsgo-racing/src/courses.js'),output=resolve(root,'racing-core/tracks/reference.json'),bundle=join(temp,'export.mjs');
 const source=`import {COURSES} from ${JSON.stringify(entry)};import {writeFileSync} from 'node:fs';const round=n=>Math.round(n*1e6)/1e6;const data={repository:'isaiasurrutia96/3D-World-3',revision:${JSON.stringify(revision.slice(0,7))},samplingThreeVersion:'0.180.0',tracks:COURSES.map((c,i)=>({id:['original','skyline','suzuka','winding'][i],legacyId:c.id,name:c.name,startIndex:c.startIndex,halfWidth:c.halfWidth,curbWidth:c.curbWidth,length:round(c.length),points:c.samples.map(s=>[s.point.x,s.point.y,s.point.z,s.normal.x,s.normal.z,s.distance].map(round))}))};writeFileSync(${JSON.stringify(output)},JSON.stringify(data));`;
 await build({stdin:{contents:source,resolveDir:root},bundle:true,platform:'node',format:'esm',outfile:bundle,plugins:[{name:'reference-three',setup(b){b.onResolve({filter:/^three$/},()=>({path:resolve(root,'node_modules/three/build/three.module.js')}));}}]});await import(pathToFileURL(bundle).href);
 console.log('Imported four track definitions from '+revision);
}finally{await rm(temp,{recursive:true,force:true});}
