import {chromium} from 'playwright';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../../',import.meta.url))),output='/tmp/avatar-walk-render';await mkdir(output+'/frames',{recursive:true});
await build({entryPoints:[resolve(root,'references/avatar-walk/render.js')],bundle:true,format:'esm',outfile:output+'/render.js'});
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/favicon.ico'){res.statusCode=204;res.end();return;}const file=path==='/render.html'?resolve(root,'references/avatar-walk/render.html'):resolve(output,'.'+path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:720,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.referenceReady,undefined,{timeout:60000});
 const frames=process.argv.includes('--poses')?[0,10,19,29,39,48,58,67]:Array.from({length:77},(_,i)=>i);
 for(const f of frames){await page.evaluate(f=>reference.frame(f),f);await page.screenshot({path:output+'/frames/'+String(f).padStart(3,'0')+'.png'});}
 console.log(JSON.stringify(await page.evaluate(()=>reference.walk.metrics)));if(errors.length)throw Error(errors.join('; '));
}finally{await browser.close();await new Promise(r=>server.close(r));}
