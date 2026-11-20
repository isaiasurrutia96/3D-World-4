import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {build} from 'esbuild';

// A viewer build never runs the expensive authoring factories or silently
// replaces the owner's accepted shapes. This is a pinned release.
export async function buildOfficialAvatarPage(route){
 const release=JSON.parse(await readFile('avatar/official.json','utf8'));
 const manifest=JSON.parse(await readFile('avatar/'+release.assetManifest,'utf8'));
 const bytes=await readFile('avatar/assembled-joints/'+manifest.asset);
 assert.equal(manifest.sha256,release.sha256,'Official release needs explicit approval before replacing its asset');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),release.sha256,'Corrupt official avatar asset');
 assert.equal(bytes.length,manifest.bytes);
 const delivery=JSON.parse(await readFile('avatar/assembled-joints/delivery.json','utf8'));
 const payload=await readFile('avatar/assembled-joints/'+delivery.asset);
 assert.equal(delivery.sourceSHA256,release.sha256,'Delivery must match the approved master');
 assert.equal(createHash('sha256').update(payload).digest('hex'),delivery.sha256,'Corrupt avatar delivery');
 assert.equal(payload.length,delivery.bytes);
 const light=JSON.parse(await readFile('avatar/assembled-joints/light.json','utf8')),lightPayload=await readFile('avatar/assembled-joints/'+light.asset);
 assert.equal(light.sourceSHA256,release.sha256,'The light copy must come from the approved master');
 assert.equal(createHash('sha256').update(lightPayload).digest('hex'),light.sha256,'Corrupt light avatar');
 assert.equal(lightPayload.length,light.bytes);
 const game=JSON.parse(await readFile('avatar/assembled-joints/game.json','utf8')),gamePayload=await readFile('avatar/assembled-joints/'+game.asset);
 assert.equal(game.sourceSHA256,release.sha256,'The game copy must come from the approved master');
 assert.equal(createHash('sha256').update(gamePayload).digest('hex'),game.sha256,'Corrupt game avatar');
 assert.equal(gamePayload.length,game.bytes);
 const worker=await build({entryPoints:['src/study-binary-worker.js'],bundle:true,write:false,minify:true,format:'iife'});
 const workerName='decode-'+createHash('sha256').update(worker.outputFiles[0].contents).digest('hex').slice(0,16)+'.js';
 const result=await build({entryPoints:['skeleton-test/main.js'],bundle:true,write:false,minify:true,format:'iife',metafile:true,define:{__AVATAR_WORKER_URL__:JSON.stringify(workerName)}});
 for(const input of Object.keys(result.metafile.inputs))assert(!/\/(collect|build|shoulder-design|elbow-design|hip-design|knee-design|mold-socket|PlayerModel)\.(js|ts)$/.test(input),'Procedural geometry must not ship in the avatar viewer: '+input);
 let html=await readFile('skeleton-test/shell.html','utf8');
 html=html.replace('<html lang="en">','<html lang="en" data-avatar-view="'+route+'">');
 if(route==='avatar-test')html=html.replace('<title>Skeleton</title>','<title>Our avatar</title>').replace('<h1>Skeleton</h1>','<h1>Our avatar</h1>').replace('Sections 3 and 4 · Smooth poses, a bending chest, reaching','Official avatar · Approved shapes and joints');
 html=html.replace('/*SKELETON_BUNDLE*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
 await mkdir('dist/avatar/assembled-joints',{recursive:true});
 await copyFile('avatar/assembled-joints/'+manifest.asset,'dist/avatar/assembled-joints/'+manifest.asset);
 await copyFile('avatar/assembled-joints/manifest.json','dist/avatar/assembled-joints/manifest.json');
 await copyFile('avatar/assembled-joints/'+delivery.asset,'dist/avatar/assembled-joints/'+delivery.asset);
 await copyFile('avatar/assembled-joints/'+light.asset,'dist/avatar/assembled-joints/'+light.asset);
 await copyFile('avatar/assembled-joints/light.json','dist/avatar/assembled-joints/light.json');
 await copyFile('avatar/assembled-joints/'+game.asset,'dist/avatar/assembled-joints/'+game.asset);
 await copyFile('avatar/assembled-joints/game.json','dist/avatar/assembled-joints/game.json');
 await copyFile('avatar/assembled-joints/delivery.json','dist/avatar/assembled-joints/delivery.json');
 for(const dir of ['avatar/assembled-joints','dist/avatar/assembled-joints'])await writeFile(dir+'/'+workerName,worker.outputFiles[0].contents);
 await copyFile('avatar/official.json','dist/avatar/official.json');
 for(const dir of [route,'dist/'+route]){await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',html);}
 console.log(JSON.stringify({route,avatar:release.version,sha256:release.sha256,bytes:delivery.bytes,originalBytes:bytes.length,proceduralConstruction:false,worker:true}));
}
