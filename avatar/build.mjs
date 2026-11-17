import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('.',import.meta.url));
const result=await build({
 entryPoints:[resolve(root,'src/avatar-viewer/main.js')],
 bundle:true,write:false,minify:true,format:'iife',
});
const shell=await readFile(resolve(root,'src/avatar-viewer/shell.html'),'utf8');
const output=process.argv[2]?resolve(process.argv[2]):resolve(root,'index.html');
await writeFile(output,shell.replace('/*BUNDLE*/',()=>result.outputFiles[0].text));
console.log(`Built ${output}`);
