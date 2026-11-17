import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {handBindPlugin} from '../references/motion-compare/hand-bind.mjs';
const result=await build({entryPoints:['walk-test/main.js'],bundle:true,write:false,minify:true,format:'iife',plugins:[handBindPlugin()]});
const html=(await readFile('walk-test/shell.html','utf8')).replace('/*WALK_TEST_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir('dist/walk-test',{recursive:true});await writeFile('walk-test/index.html',html);await writeFile('dist/walk-test/index.html',html);console.log('Built walking test at /walk-test/');
