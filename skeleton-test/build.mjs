import {build} from 'esbuild';
import {resolve} from 'node:path';
// The approved hand's bind data (as the avatar lab does), so the hands can bend.
const approvedHand=resolve('avatar/src/hand-study/hand.js'),capture=resolve('hand-lab/src/capture-rest.js');
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const result=await build({entryPoints:['skeleton-test/main.js'],bundle:true,write:false,minify:true,format:'iife',
 plugins:[{name:'observe-saved-hand-bind',setup(b){b.onResolve({filter:/^\.\/resting-digits\.js$/},a=>a.importer===approvedHand?{path:capture}:undefined);}}]});
const html=(await readFile('skeleton-test/shell.html','utf8')).replace('/*SKELETON_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir('dist/skeleton-test',{recursive:true});await writeFile('skeleton-test/index.html',html);await writeFile('dist/skeleton-test/index.html',html);console.log('Built skeleton test at /skeleton-test/');
