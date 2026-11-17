import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {handBindPlugin} from '../references/motion-compare/hand-bind.mjs';
const result=await build({entryPoints:['run-test/main.js'],bundle:true,write:false,minify:true,format:'iife',plugins:[handBindPlugin()]});
const html=(await readFile('run-test/shell.html','utf8')).replace('/*RUN_TEST_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir('dist/run-test',{recursive:true});await writeFile('run-test/index.html',html);await writeFile('dist/run-test/index.html',html);console.log('Built playable run at /run-test/');
