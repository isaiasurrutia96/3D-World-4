// Private screenshot-only page. No live viewers, dist or checkpoints change.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createShoulderDesign} from '../avatar/src/joints/shoulder-design.js';
import {encodeStudyAsset,verifyStudyAsset} from './bake-study.mjs';
import {decodeStudyAsset,studyAssetReady} from '../src/study-asset.js';

const root='/tmp/shoulder-slope-preview',output='/workspace/previews/shoulder-slope',restOutput='/workspace/previews/shoulder-slope-rest';
await mkdir(root,{recursive:true});await mkdir(output,{recursive:true});await mkdir(restOutput,{recursive:true});const study=createShoulderDesign();
study.group.userData.restEuler=[...study.restEuler];
// An optional local comparison is useful when reviewing this draft alongside
// the earlier approved stills. It never changes the earlier cached assets.
let sourceBaselineComparison=false;
if(process.argv.includes('--compare-sources')){
 await studyAssetReady;
 const hip=decodeStudyAsset(new Uint8Array(await readFile('/tmp/hip-snug-preview/parts.json.gz'))),elbow=decodeStudyAsset(new Uint8Array(await readFile('/tmp/elbow-socket-preview/parts.json.gz')));
 for(const [source,part] of [[study.source.torso,hip.torso],[study.source.upperArm,elbow.upperArm]]){assert.deepEqual(source.positions,part.geometry.attributes.position.array);assert.deepEqual(source.normals,part.geometry.attributes.normal.array);assert.deepEqual(source.index,part.geometry.index.array);}
 sourceBaselineComparison=true;
}
for(const part of study.group.children){const m=part.geometry.userData.shoulderMold;part.geometry.userData=m?{shoulderCenter:[...m.center]}:{};part.userData={};}
const bytes=encodeStudyAsset(study);verifyStudyAsset(study,bytes);await writeFile(root+'/parts.json.gz',bytes);
const bundle=await build({entryPoints:['scripts/preview/shoulder.js'],bundle:true,write:false,minify:true,format:'iife'});
await writeFile(root+'/index.html','<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>One shoulder study</title><style>*{box-sizing:border-box}html,body{margin:0;width:900px;height:1200px;overflow:hidden;background:#405363}canvas{display:block}header{position:absolute;top:30px;left:0;right:0;text-align:center;color:#eaf0f4;font:600 16px system-ui;letter-spacing:.1em}</style></head><body><header>Preparing</header><script>'+bundle.outputFiles[0].text+'</script></body></html>');
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path==='/')path='/index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',extname(file)==='.html'?'text/html':'application/gzip');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:900,height:1200},deviceScaleFactor:2});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.previewReady,undefined,{timeout:30000});
 const snapshot=()=>page.evaluate(()=>previewStudy.group.children.map(p=>[p.name,p.position.toArray(),p.quaternion.toArray(),p.scale.toArray(),p.visible]));
 const initial=await snapshot();assert.equal(initial.length,3);assert.equal(initial.filter(p=>p[0]==='shoulder-ball-L').length,1);
 for(const view of ['front','side','angled']){await page.evaluate(view=>window.setPreviewView(view),view);await page.screenshot({path:output+'/'+view+'.png'});}
 await page.setViewportSize({width:2700,height:1200});await page.evaluate(()=>window.renderPreviewTriptych());await page.screenshot({path:output+'/all-views.png',scale:'css'});
 await page.setViewportSize({width:2400,height:1200});await page.evaluate(()=>window.renderSocketDetails());await page.screenshot({path:output+'/socket-details.png',scale:'css'});
 await page.setViewportSize({width:900,height:1200});await page.evaluate(()=>{window.resetPortrait();window.useRestInspection();});
 const restFit=await page.evaluate(()=>{
  const s=previewStudy;return ['torso','upperArm'].map(name=>{const p=s[name],v=s.ball.position.clone().fromArray(p.geometry.userData.shoulderCenter);p.localToWorld(v);return v.distanceTo(s.ball.position);});
 });assert(restFit.every(e=>e<1e-12));
 for(const view of ['front','side','angled']){await page.evaluate(view=>window.setPreviewView(view),view);await page.screenshot({path:restOutput+'/'+view+'.png'});}
 await page.setViewportSize({width:2700,height:1200});await page.evaluate(()=>window.renderPreviewTriptych());await page.screenshot({path:restOutput+'/all-views.png',scale:'css'});
 await page.evaluate(()=>window.useSeparatedInspection());
 assert.deepEqual(await snapshot(),initial);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({output,restOutput,restFit,overlap:study.overlap,maximumInset:study.clearance.maximumInset,views:['front','side','angled'],pixels:[1800,2400],sheet:[2700,1200],details:[2400,1200],parts:3,onlyOneShoulder:true,staticTransforms:true,sourceBaselineComparison,exactAsset:true,assetBytes:bytes.length,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
