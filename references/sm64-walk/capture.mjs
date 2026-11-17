import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../../',import.meta.url))),data='/tmp/sm64-reference-render',source=resolve(root,'references/sm64-walk');
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost').pathname;if(url==='/favicon.ico'){res.statusCode=204;res.end();return;}const file=url.startsWith('/node_modules/')?resolve(root,'.'+url):url==='/render.js'||url==='/render.html'?resolve(source,'.'+url):resolve(data,'.'+url);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:720,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.referenceReady,undefined,{timeout:60000});await mkdir(data+'/frames',{recursive:true});
 const info=await page.evaluate(()=>({bounds:reference.bounds,frames:reference.data.animation.frames,joints:reference.joints.length}));
 for(let f=0;f<info.frames;f++){
  await page.evaluate(f=>reference.frame(f),f);await page.screenshot({path:data+'/frames/'+String(f).padStart(3,'0')+'.png'});
  if(f%20===0)process.stdout.write('Rendered frame '+f+'\n');
 }
 if(errors.length)throw Error(errors.join('; '));console.log(JSON.stringify({...info,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
