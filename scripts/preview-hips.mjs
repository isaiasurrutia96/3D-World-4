// Private still-image renderer: no live pages, dist or checkpoints are written.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createHash} from 'node:crypto';
import {createHipDesign} from '../avatar/src/joints/hip-design.js';
import {encodeStudyAsset,verifyStudyAsset} from './bake-study.mjs';

const seated=process.argv.includes('--seated');
const root=resolve(process.env.HIP_PREVIEW_CACHE||(seated?'/tmp/hip-seated-preview':'/tmp/hip-socket-preview')),
 output=resolve(process.env.HIP_PREVIEW_DIR||(seated?'/workspace/previews/hip-seated':'/workspace/previews/hip-joint'));
await mkdir(root,{recursive:true});await mkdir(output,{recursive:true});
const study=createHipDesign();
let centerError=0;
if(seated){
 const hash=a=>createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
 const unchanged=()=>study.group.children.map(p=>({attributes:Object.fromEntries(Object.entries(p.geometry.attributes).map(([name,a])=>[name,hash(a.array)])),index:hash(p.geometry.index.array),quaternion:p.quaternion.toArray(),scale:p.scale.toArray(),material:p.material.uuid}));
 const before=unchanged(),balls=[study.ballL.position.toArray(),study.ballR.position.toArray()];
 study.separate(false);assert.deepEqual(unchanged(),before);assert.deepEqual([study.ballL.position.toArray(),study.ballR.position.toArray()],balls);
 for(const [part,m,ball] of [[study.torso,study.torso.geometry.userData.hipMolds.L,study.ballL],[study.torso,study.torso.geometry.userData.hipMolds.R,study.ballR],[study.thighL,study.thighL.geometry.userData.hipMold,study.ballL],[study.thighR,study.thighR.geometry.userData.hipMold,study.ballR]]){
  const point=ball.position.clone().fromArray(m.center);part.localToWorld(point);centerError=Math.max(centerError,point.distanceTo(ball.position));
 }
 assert(centerError<1e-12,'All four sockets must remain seated on their original hip centers');
}
// Source factories/tests retain full mold records. Still images need only the
// accepted geometry, authored normals, materials and separated placements.
for(const part of study.group.children){part.geometry.userData={};part.userData={};}
const bytes=encodeStudyAsset(study);verifyStudyAsset(study,bytes);await writeFile(root+'/parts.json.gz',bytes);
const bundle=await build({entryPoints:['scripts/preview/hips.js'],bundle:true,write:false,minify:true,format:'iife'});
await writeFile(root+'/index.html','<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hip study</title><style>*{box-sizing:border-box}html,body{margin:0;width:900px;height:1200px;overflow:hidden;background:#405363}canvas{display:block}header{position:absolute;top:30px;left:0;right:0;text-align:center;color:#eaf0f4;font:600 16px system-ui;letter-spacing:.1em}</style></head><body data-study-state="'+(seated?'seated':'separated')+'"><header>Preparing</header><script>'+bundle.outputFiles[0].text+'</script></body></html>');
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path==='/')path='/index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',extname(file)==='.html'?'text/html':'application/gzip');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:900,height:1200},deviceScaleFactor:2});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.previewReady,undefined,{timeout:30000});
 const snapshot=()=>page.evaluate(()=>previewStudy.group.children.map(p=>[p.name,p.position.toArray(),p.quaternion.toArray(),p.scale.toArray(),p.visible]));
 const initial=await snapshot();assert.equal(initial.length,5);
 for(const view of ['front','side','angled']){await page.evaluate(view=>window.setPreviewView(view),view);await page.screenshot({path:output+'/'+view+'.png'});}
 await page.setViewportSize({width:2700,height:1200});await page.evaluate(()=>window.renderPreviewTriptych());await page.screenshot({path:output+'/all-views.png',scale:'css'});
 if(!seated){await page.setViewportSize({width:2400,height:1200});await page.evaluate(()=>window.renderSocketDetails());await page.screenshot({path:output+'/socket-details.png',scale:'css'});}
 assert.deepEqual(await snapshot(),initial);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({output,seated,centerError,unchangedGeometry:true,views:['front','side','angled'],pixels:[1800,2400],sheet:[2700,1200],socketDetails:seated?null:[2400,1200],parts:initial.length,staticTransforms:true,exactAsset:true,assetBytes:bytes.length,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
