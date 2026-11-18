import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
execFileSync(process.execPath,['--test',resolve(root,'foot-lab/tests/ankle.test.mjs')],{stdio:'inherit'});
const result=await build({entryPoints:[resolve(root,'foot-lab/src/main.js')],bundle:true,write:false,minify:true,format:'iife'});
const shell=await readFile(resolve(root,'foot-lab/shell.html'),'utf8');
const html=shell.replace('/*FOOT_LAB_BUNDLE*/',()=>result.outputFiles[0].text);
for(const name of ['foot-lab/index.html','dist/foot-lab/index.html']){
 const path=resolve(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,html);
}
console.log('Built Foot Lab at /foot-lab/');
