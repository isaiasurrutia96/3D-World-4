import assert from 'node:assert/strict';import {createServer}from'node:http';import {mkdir,readFile,writeFile,copyFile}from'node:fs/promises';import{build}from'esbuild';import{resolve,extname}from'node:path';import{chromium}from'playwright';
const root='/tmp/avatar-skin/preview',out='/workspace/previews/continuous-avatar';await mkdir(root,{recursive:true});await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('avatar/continuous-skin/manifest.json'));await copyFile('avatar/continuous-skin/'+manifest.asset,root+'/parts.json.gz');
const bundle=await build({entryPoints:['scripts/preview/skin.js'],bundle:true,write:false,minify:true,format:'iife'});
await writeFile(root+'/index.html','<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;overflow:hidden;background:#405363}canvas{display:block}header{color:white}</style></head><body><header>Loading</header><script>'+bundle.outputFiles[0].text+'</script></body></html>');
const server=createServer(async(q,r)=>{try{let p=new URL(q.url,'http://local').pathname;if(p==='/')p='/index.html';r.setHeader('Content-Type',extname(p)==='.html'?'text/html':'application/gzip');r.end(await readFile(resolve(root,'.'+p)));}catch{r.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await browser.newPage({viewport:{width:900,height:1200}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>window.skinPreviewReady||window.skinPreviewError,undefined,{timeout:90000});assert.equal(await p.evaluate(()=>window.skinPreviewError),undefined);
 for(const view of ['front','side','angled']){const r=await p.evaluate(v=>skinPreview.view(v),view);assert.equal(r.error,0);assert(r.triangles>1000);await p.screenshot({path:out+'/'+view+'.png'});}
 for(const pose of ['elbows','knee','chest-bend']){await p.evaluate(pose=>skinPreview.view('angled',pose),pose);await p.screenshot({path:out+'/'+pose+'.png'});}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,manifest,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
