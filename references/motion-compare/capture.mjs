import {chromium} from 'playwright';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../../',import.meta.url))),output='/tmp/motion-compare-render';await mkdir(output,{recursive:true});
await build({entryPoints:[resolve(root,'references/motion-compare/render.js')],bundle:true,format:'esm',outfile:output+'/render.js'});
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/favicon.ico'){res.statusCode=204;res.end();return;}const file=path==='/data.json'||path.startsWith('/textures/')?resolve('/tmp/sm64-reference-render','.'+path):path==='/render.html'?resolve(root,'references/motion-compare/render.html'):resolve(output,'.'+path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.png':'image/png','.json':'application/json'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.referenceReady,undefined,{timeout:60000});
 const frames=process.argv.includes('--poses')?[0,19,39,52,56,67]:Array.from({length:77},(_,i)=>i);
 const selected=process.argv.find(a=>a.startsWith('--view='))?.split('=')[1];
 for(const view of selected?[selected]:['side','front','feet']){
  await mkdir(output+'/'+view+'/frames',{recursive:true});await page.evaluate(view=>reference.setView(view),view);
  for(const f of frames){await page.evaluate(f=>reference.frame(f),f);await page.screenshot({path:output+'/'+view+'/frames/'+String(f).padStart(3,'0')+'.png'});}
  console.log('Captured '+view+' view');
 }
 console.log(JSON.stringify(await page.evaluate(()=>({frame:reference.walk.frame,bounds:reference.walk.root.children.length}))));if(errors.length)throw Error(errors.join('; '));
}finally{await browser.close();await new Promise(r=>server.close(r));}
