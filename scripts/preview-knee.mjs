// Private screenshot renderer. Writes only to /tmp and the requested image
// folder; it never changes dist/, a live page, the Test Lab or a checkpoint.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createKneeDesign} from '../avatar/src/joints/knee-design.js';
import {encodeStudyAsset,verifyStudyAsset} from './bake-study.mjs';
import {decodeStudyAsset} from '../src/study-asset.js';

const bends=true,reuse=process.argv.includes('--reuse-asset');
const root='/tmp/knee-socket-preview',output=resolve(process.env.KNEE_PREVIEW_DIR||'/workspace/previews/knee-joint');
await mkdir(root,{recursive:true});await mkdir(output,{recursive:true});
const study=reuse?decodeStudyAsset(new Uint8Array(await readFile(root+'/parts.json.gz'))):createKneeDesign();
// Construction-reference arrays are not used by a still-image renderer.
for(const part of [study.thigh,study.calf]){part.geometry.userData={kneeMold:{center:[...part.geometry.userData.kneeMold.center]}};part.userData={};}
const bytes=encodeStudyAsset(study);verifyStudyAsset(study,bytes);await writeFile(root+'/parts.json.gz',bytes);
const bundle=await build({entryPoints:['scripts/preview/knee.js'],bundle:true,write:false,minify:true,format:'iife'});
await writeFile(root+'/index.html','<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Knee appearance draft</title><style>*{box-sizing:border-box}html,body{margin:0;width:900px;height:1200px;overflow:hidden;background:#405363}canvas{display:block}header{position:absolute;top:30px;left:0;right:0;text-align:center;color:#eaf0f4;font:600 16px system-ui;letter-spacing:.12em}header small{display:block;margin-top:9px;font-size:11px;font-weight:400;letter-spacing:.1em;opacity:.7}</style></head><body><header><span id="view">Preparing</span><small>KNEE SOCKET DRAFT</small></header><script>'+bundle.outputFiles[0].text+'</script></body></html>');
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path==='/')path='/index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',extname(file)==='.html'?'text/html':'application/gzip');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:900,height:1200},deviceScaleFactor:2});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.previewReady,undefined,{timeout:30000});await page.evaluate(()=>window.setPreviewPose(0));
 const initial=await page.evaluate(()=>previewStudy.group.children.map(p=>[p.position.toArray(),p.quaternion.toArray(),p.scale.toArray()]));
 const states=[];
 for(const degrees of [0,90,130]){
  await page.evaluate(degrees=>window.setPreviewPose(degrees),degrees);
  const fit=await page.evaluate(()=>{
   const {calf,ball}=previewStudy,center=calf.position.clone().fromArray(calf.geometry.userData.kneeMold.center);calf.localToWorld(center);
   return {centerError:center.distanceTo(ball.position),ball:ball.position.toArray()};
  });
  assert(fit.centerError<1e-12,'The posed socket must remain seated on the original pivot');states.push({bend:degrees,insideAngle:180-degrees,...fit});
  for(const view of ['front','side','angled']){
   await page.evaluate(view=>window.setPreviewView(view),view);await page.screenshot({path:output+'/'+(bends?degrees+'-':'')+view+'.png'});
  }
 }
 if(bends){
  await page.setViewportSize({width:2700,height:1200});
  for(const degrees of [0,90,130]){
   await page.evaluate(degrees=>{window.setPreviewPose(degrees);window.renderPreviewTriptych();},degrees);
   await page.screenshot({path:output+'/'+degrees+'-all-views.png',scale:'css'});
  }
 }
 await page.evaluate(()=>window.setPreviewPose(0));
 assert.deepEqual(await page.evaluate(()=>previewStudy.group.children.map(p=>[p.position.toArray(),p.quaternion.toArray(),p.scale.toArray()])),initial);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({output,views:['front','side','angled'],pixels:[1800,2400],staticGeometry:true,states,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
