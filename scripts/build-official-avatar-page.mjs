import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {dirname} from 'node:path';

// A viewer build never runs the expensive authoring factories or silently
// replaces the owner's accepted shapes. This is a pinned release.
export async function buildOfficialAvatarPage(route){
 const release=JSON.parse(await readFile('avatar/official.json','utf8'));
 const manifest=JSON.parse(await readFile('avatar/'+release.assetManifest,'utf8'));
 const assetDir='avatar/'+dirname(release.assetManifest);
 const bytes=await readFile(assetDir+'/'+manifest.asset);
 assert.equal(manifest.sha256,release.sha256,'Official release needs explicit approval before replacing its asset');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),release.sha256,'Corrupt official avatar asset');
 assert.equal(bytes.length,manifest.bytes);
 const result=await build({entryPoints:['skeleton-test/main.js'],bundle:true,write:false,minify:true,format:'iife',metafile:true});
 for(const input of Object.keys(result.metafile.inputs))assert(!/\/(collect|build|shoulder-design|elbow-design|hip-design|knee-design|mold-socket|PlayerModel)\.(js|ts)$/.test(input),'Procedural geometry must not ship in the avatar viewer: '+input);
 for(const input of Object.keys(result.metafile.inputs))assert(!/avatar\/src\/skin\/(field|surface|mesh-distance|hands|optimize|repair|weights)\.js$/.test(input),'Skin authoring code must stay out of the browser: '+input);
 let html=await readFile('skeleton-test/shell.html','utf8');
 html=html.replace('<html lang="en">','<html lang="en" data-avatar-view="'+route+'">');
 if(route==='avatar-test')html=html.replace('<title>Skeleton</title>','<title>Our avatar</title>').replace('<h1>Skeleton</h1>','<h1>Our avatar</h1>').replace('Sections 3 and 4 · Smooth poses, a bending chest, reaching','Official avatar · Approved shapes and joints');
 html=html.replace('/*SKELETON_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
 await mkdir('dist/'+assetDir,{recursive:true});
 await copyFile(assetDir+'/'+manifest.asset,'dist/'+assetDir+'/'+manifest.asset);
 await copyFile('avatar/'+release.assetManifest,'dist/avatar/'+release.assetManifest);
 await copyFile('avatar/official.json','dist/avatar/official.json');
 for(const dir of [route,'dist/'+route]){await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',html);}
 console.log(JSON.stringify({route,avatar:release.version,sha256:release.sha256,bytes:bytes.length,proceduralConstruction:false}));
}
