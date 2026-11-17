// Universal marker test template; motion-core remains an imported dependency.
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({entryPoints:[resolve(root,'motion-lab/src/main.js')],bundle:true,write:false,minify:true,format:'iife'});
const shell=await readFile(resolve(root,'motion-lab/shell.html'),'utf8');
const html=shell.replace('/*MOTION_LAB_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/g,'<\\/script'));
for(const name of ['motion-lab/index.html','dist/motion-lab/index.html']){
 const path=resolve(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,html);
}
console.log('Built Motion Lab at /motion-lab/');
