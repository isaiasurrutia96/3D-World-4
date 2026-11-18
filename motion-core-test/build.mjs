import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const result=await build({entryPoints:['motion-core-test/main.js'],bundle:true,write:false,minify:true,format:'iife'});
const html=(await readFile('motion-core-test/shell.html','utf8')).replace('/*RULES_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir('dist/motion-core-test',{recursive:true});await writeFile('motion-core-test/index.html',html);await writeFile('dist/motion-core-test/index.html',html);console.log('Built movement rules test at /motion-core-test/');
