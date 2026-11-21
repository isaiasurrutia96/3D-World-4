// Builds the Karts section into dist/karts/index.html (one file).
// Usage: node karts/build.mjs
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const result=await build({entryPoints:['karts/main.js'],bundle:true,write:false,minify:true,format:'iife'});
const html=(await readFile('karts/shell.html','utf8')).replace('/*KARTS_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await mkdir('dist/karts',{recursive:true});await writeFile('dist/karts/index.html',html);
console.log('karts built',html.length,'bytes');
