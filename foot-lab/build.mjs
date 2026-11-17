import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({entryPoints:[resolve(root,'foot-lab/src/main.js')],bundle:true,write:false,minify:true,format:'iife'});
const shell=await readFile(resolve(root,'foot-lab/shell.html'),'utf8');
const html=shell.replace('/*FOOT_LAB_BUNDLE*/',()=>result.outputFiles[0].text);
for(const name of ['foot-lab/index.html','dist/foot-lab/index.html']){
 const path=resolve(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,html);
}
console.log('Built Foot Lab at /foot-lab/');
