// Motion Lab (Claude's movement test, separate from Codex's /movement/).
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const approvedHand=resolve(root,'avatar/src/hand-study/hand.js'),capture=resolve(root,'hand-lab/src/capture-rest.js');
const result=await build({
 entryPoints:[resolve(root,'motion-lab/src/main.js')],bundle:true,write:false,minify:true,format:'iife',
 plugins:[{name:'observe-saved-hand-bind',setup(build){build.onResolve({filter:/^\.\/resting-digits\.js$/},args=>args.importer===approvedHand?{path:capture}:undefined);}}],
});
const shell=await readFile(resolve(root,'motion-lab/shell.html'),'utf8');
const html=shell.replace('/*MOTION_LAB_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/g,'<\\/script'));
for(const name of ['motion-lab/index.html','dist/motion-lab/index.html']){
 const path=resolve(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,html);
}
console.log('Built Motion Lab at /motion-lab/');
