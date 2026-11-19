import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

// A cold context per device: include the real download, worker, binding and
// first drawing. Throttle phone CPU/network; do not mistake localhost for LTE.
const root=resolve('dist'),results=[],errors=[];
const server=createServer(async(req,res)=>{
 try{
  let path=new URL(req.url,'http://local').pathname;if(path.endsWith('/'))path+='index.html';
  const file=resolve(root,'.'+path);assert(file.startsWith(root+sep));const data=await readFile(file);
  res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css'})[extname(file)]??'application/octet-stream');
  res.setHeader('Cache-Control',path.endsWith('.gz')?'public,max-age=31536000,immutable':'no-cache');res.end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const devices=process.argv.includes('--desktop')?[false]:process.argv.includes('--phone')?[true]:[false,true];
 for(const phone of devices){
  const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1200,height:900},isMobile:phone,hasTouch:phone});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
  if(phone){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:60,downloadThroughput:1250000,uploadThroughput:625000});}
  const start=performance.now();await page.goto('http://127.0.0.1:'+server.address().port+'/test-lab/',{waitUntil:'domcontentloaded'});
  const shellMS=Math.round(performance.now()-start);await page.waitForFunction(()=>testLabReady,undefined,{timeout:90000});
  const readyMS=Math.round(performance.now()-start),data=await page.evaluate(()=>{
   const w=testLab.frame.contentWindow,a=w.avatarLab.avatar;
   return {parts:a.attached.length,version:a.version,decodeMS:Math.round(w.performance.getEntriesByName('study-asset-decode').at(-1).duration),modelDownloads:w.performance.getEntriesByType('resource').filter(e=>e.name.includes('/delivery-')).length};
  });
  assert.equal(data.parts,28);assert.equal(data.version,'approved-joints-2026-11-19');assert.equal(data.modelDownloads,1);
  assert(readyMS<(phone?35000:8000),'Cold startup exceeded its measured device budget: '+readyMS+'ms');
  assert(data.decodeMS<(phone?4000:2000),'Unpacking regressed: '+data.decodeMS+'ms');
  const warmStart=performance.now();await page.evaluate(()=>testLab.setTest('skeleton'));await page.waitForFunction(()=>testLabReady,undefined,{timeout:60000});
  const warmMS=Math.round(performance.now()-warmStart);
  const downloads=await page.evaluate(()=>testLab.frame.contentWindow.performance.getEntriesByType('resource').filter(e=>e.name.includes('/delivery-')).length);
  assert.equal(downloads,0,'The second viewer must open from the checked cache');
  results.push({device:phone?'4x CPU, 10 Mbps cold':'desktop cold',shellMS,readyMS,...data,warmMS,warmModelDownloads:downloads});
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,results,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
