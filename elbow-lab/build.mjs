import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
execFileSync(process.execPath,['--test','elbow-lab/tests/study.test.mjs'],{stdio:'inherit'});
const result=await build({entryPoints:['elbow-lab/src/main.js'],bundle:true,write:false,minify:true,format:'iife'});
const html=(await readFile('elbow-lab/shell.html','utf8')).replace('/*ELBOW_BUNDLE*/',()=>result.outputFiles[0].text);
await mkdir('dist/elbow-lab',{recursive:true});await writeFile('elbow-lab/index.html',html);await writeFile('dist/elbow-lab/index.html',html);
console.log('Built separated elbow study at /elbow-lab/');
