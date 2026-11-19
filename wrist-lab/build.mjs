import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
execFileSync(process.execPath,['--test','wrist-lab/tests/study.test.mjs'],{stdio:'inherit'});
const result=await build({entryPoints:['wrist-lab/src/main.js'],bundle:true,write:false,minify:true,format:'iife'});
const html=(await readFile('wrist-lab/shell.html','utf8')).replace('/*WRIST_BUNDLE*/',()=>result.outputFiles[0].text);
await mkdir('dist/wrist-lab',{recursive:true});await writeFile('wrist-lab/index.html',html);await writeFile('dist/wrist-lab/index.html',html);
console.log('Built separated wrist study at /wrist-lab/');
