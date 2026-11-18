import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const result=await build({entryPoints:['skeleton-test/main.js'],bundle:true,write:false,minify:true,format:'iife'});
const html=(await readFile('skeleton-test/shell.html','utf8')).replace('/*SKELETON_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir('dist/skeleton-test',{recursive:true});await writeFile('skeleton-test/index.html',html);await writeFile('dist/skeleton-test/index.html',html);console.log('Built skeleton test at /skeleton-test/');
