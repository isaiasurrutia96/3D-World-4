import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

// Native media seeking requires byte ranges, just like the public Pages host.
const server=createServer(async(req,res)=>{try{
 let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const data=await readFile(resolve('dist','.'+path));
 res.setHeader('Content-Type',({'.html':'text/html','.mp4':'video/mp4','.gif':'image/gif','.jpg':'image/jpeg'})[extname(path)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
 if(req.headers.range){const [,a,b]=req.headers.range.match(/bytes=(\d+)-(\d*)/),start=Number(a),end=b?Math.min(Number(b),data.length-1):data.length-1;res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${data.length}`);res.setHeader('Content-Length',end-start+1);res.end(data.subarray(start,end+1));}
 else{res.setHeader('Content-Length',data.length);res.end(data);}
}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/references/motion-compare/`);
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v.currentTime>0&&v.seekable.length&&v.seekable.end(0)>3;});
 assert.equal(await page.locator('video').count(),1);assert.equal(await page.locator('video').evaluate(v=>v.videoWidth),1440);
 await page.getByRole('button',{name:'Slow · ½ speed',exact:true}).tap();assert.equal(await page.locator('video').evaluate(v=>v.playbackRate),.5);
 await page.locator('video').evaluate(v=>{v.pause();v.currentTime=.55;});
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v.paused&&!v.seeking&&Math.abs(v.currentTime-.55)<.03;});
 for(const [label,view] of [['Front','front'],['Feet close-up','feet'],['Side','side'],['Front','front']]){
  await page.getByRole('button',{name:label,exact:true}).tap();
  await page.waitForFunction(view=>{const v=document.querySelector('video');return v.currentSrc.endsWith('/'+view+'.mp4')&&v.readyState>=2&&!v.seeking&&v.paused&&Math.abs(v.currentTime-.55)<.03;},view);
  assert.equal(await page.locator('video').evaluate(v=>v.playbackRate),.5);assert.equal(await page.locator('#gif').getAttribute('href'),view+'-slow.gif');
 }
 await page.getByRole('button',{name:'Side',exact:true}).tap();await page.getByRole('button',{name:'Feet close-up',exact:true}).tap();
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v.currentSrc.endsWith('/feet.mp4')&&v.readyState>=2&&!v.seeking&&v.paused&&Math.abs(v.currentTime-.55)<.03;});
 await page.getByRole('button',{name:'Normal',exact:true}).tap();await page.waitForFunction(()=>{const v=document.querySelector('video');return!v.paused&&v.currentTime>.57;});
 assert.equal(await page.locator('video').evaluate(v=>v.playbackRate),1);
 const before=await page.locator('video').evaluate(v=>v.currentTime);await page.getByRole('button',{name:'Front',exact:true}).tap();
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v.currentSrc.endsWith('/front.mp4')&&v.readyState>=2&&!v.paused&&!v.seeking;});
 assert(Math.abs(await page.locator('video').evaluate(v=>v.currentTime)-before)<.5,'Playing view changes must preserve cycle time');
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 assert.deepEqual(errors,[]);console.log('Phone: autoplay, three views, same-time switching, pause/seek, shared speed, rapid changes, portrait/landscape: pass.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
