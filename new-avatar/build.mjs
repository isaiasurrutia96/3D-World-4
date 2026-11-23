// Builds the New avatar section into dist/new-avatar/index.html (one file), plus torso-sockets.bin: the Torso sockets
// tab's shapes, built here once instead of on every page load (see torso-sockets-file.js).
// Usage: node new-avatar/build.mjs
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {bakeTorsoSockets} from './bake-torso-sockets.mjs';
await mkdir('dist/new-avatar',{recursive:true});
const shapes=bakeTorsoSockets(),version=createHash('sha256').update(shapes).digest('hex').slice(0,12);
await writeFile('dist/new-avatar/torso-sockets.bin',shapes);
// A module script, so the page can wait for the shapes file before it sets up; the file's name carries its version so
// a stale copy is never used.
const result=await build({entryPoints:['new-avatar/main.js'],bundle:true,write:false,minify:true,format:'esm',define:{TORSO_SOCKETS_VERSION:JSON.stringify(version)}});
const html=(await readFile('new-avatar/shell.html','utf8')).replace('<script>/*NEW_AVATAR_BUNDLE*/','<script type="module">/*NEW_AVATAR_BUNDLE*/').replace('/*NEW_AVATAR_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await writeFile('dist/new-avatar/index.html',html);
console.log('new-avatar built',html.length,'bytes; torso sockets',shapes.length,'bytes, version',version);
