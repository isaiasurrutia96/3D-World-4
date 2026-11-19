import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve('dist'),errors=[],results=[];
const server=createServer(async(req,res)=>{
 try{
  let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';
  const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.gz':'application/gzip'})[extname(file)]??'application/octet-stream');
  res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const phone of [false,true])for(const name of ['wrist','elbow']){
  const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1200,height:900},isMobile:phone,hasTouch:phone});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  if(phone){
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
   await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:60,downloadThroughput:1250000,uploadThroughput:625000});
  }
  const started=performance.now();
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+name+'-lab/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(name=>window[name+'LabReady'],name,{timeout:15000});
  const elapsed=performance.now()-started,decode=await page.evaluate(()=>performance.getEntriesByName('study-asset-decode').at(-1).duration);
  assert(elapsed<(phone?15000:5000),`${name} startup ${elapsed}ms exceeds its ${phone?'throttled phone':'desktop'} budget`);
  assert(decode<(phone?3000:1000),`${name} decoding ${decode}ms exceeds its budget`);
  results.push({name,device:phone?'4x CPU slowdown, 10 Mbps cold download':'desktop',readyMs:Math.round(elapsed),decodeMs:Math.round(decode)});
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({results,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
