// Builds the New avatar section into dist/new-avatar/index.html (one file).
// Usage: node new-avatar/build.mjs
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const result=await build({entryPoints:['new-avatar/main.js'],bundle:true,write:false,minify:true,format:'iife'});
const html=(await readFile('new-avatar/shell.html','utf8')).replace('/*NEW_AVATAR_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir('dist/new-avatar',{recursive:true});await writeFile('dist/new-avatar/index.html',html);
console.log('new-avatar built',html.length,'bytes');
