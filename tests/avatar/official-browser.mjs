import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve('dist'),prefix='/3D-World-4',errors=[],requests=[],timings=[];
let failAsset=false;
const server=createServer(async(req,res)=>{
 try{
  let path=new URL(req.url,'http://local').pathname;
  if(path.startsWith(prefix+'/'))path=path.slice(prefix.length);
  if(path.endsWith('/'))path+='index.html';
  const file=resolve(root,'.'+path);assert(file.startsWith(root+sep));
  if(path==='/favicon.ico'){res.writeHead(204).end();return;}
  if(failAsset&&/\/avatar\/assembled-joints\/parts-/.test(path)){res.writeHead(503).end();return;}
  const data=await readFile(file);
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(file)]||'application/octet-stream');
  res.setHeader('Content-Length',data.length);res.end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(new URL(r.url()).pathname));
 const ready=()=>page.waitForFunction(()=>window.testLabReady,undefined,{timeout:90000});
 await page.goto(origin+prefix+'/test-lab/');await ready();console.log('Official avatar: loaded under repository URL prefix.');
 for(const id of ['avatar','skeleton']){
  if(id!=='avatar'){await page.evaluate(id=>testLab.setTest(id),id);await ready();}
  const result=await page.evaluate(()=>{
   const w=testLab.frame.contentWindow,A=w.avatarLab.avatar,point=w.avatarLab.camera.position.clone();let error=0;
   for(const a of A.attached){if(a.ball)error=Math.max(error,point.setFromMatrixPosition(a.mesh.matrixWorld).distanceTo(A.solved.get(a.bone).head));for(const c of a.sockets)error=Math.max(error,point.fromArray(c.center).applyMatrix4(a.mesh.matrixWorld).distanceTo(A.solved.get(c.bone).head));}
   return {version:A.version,parts:A.attached.length,error,capabilities:A.capabilities,decode:w.performance.getEntriesByName('study-asset-decode').at(-1)?.duration};
  });
  assert.equal(result.version,'approved-joints-2026-11-19');assert.equal(result.parts,28);assert(result.error<1e-6);timings.push({id,decodeMS:Math.round(result.decode)});
  console.log(id+': verified release, parts and joint centres.');
  await page.getByRole('button',{name:'Motion',exact:true}).tap();
  const panel=page.locator('#motion-panel');
  await panel.getByRole('button',{name:'Show bones',exact:true}).tap();
  await page.waitForFunction(()=>testLab.frame.contentDocument.querySelector('#bones').getAttribute('aria-pressed')==='true');
  await panel.getByRole('button',{name:'Elbows bent',exact:true}).tap();
  console.log(id+': elbow pose requested.');
  await page.waitForFunction(()=>{const a=testLab.frame.contentWindow.avatarLab.avatar;return a.solved.get('hand.L').head.y>.8;},undefined,{timeout:60000});
  await panel.getByRole('button',{name:'Elbows bent',exact:true}).tap();
  await page.waitForFunction(()=>testLab.frame.contentDocument.querySelector('[data-pose="rest"]').getAttribute('aria-pressed')==='true');
  await panel.getByRole('button',{name:'Close motion controls'}).tap();
  console.log(id+': reset requested.');
  await page.waitForFunction(()=>{const a=testLab.frame.contentWindow.avatarLab.avatar,b=a.skeleton.bones[a.skeleton.index.get('hand.L')];return a.solved.get('hand.L').head.distanceTo(a.attached[0].mesh.position.clone().fromArray(b.head))<1e-5;},undefined,{timeout:60000});
  await page.evaluate(()=>testLab.frame.contentWindow.avatarLab.showBones(false));
  console.log(id+': pose and reset passed.');
 }
 // Every original view control still works; the subject stays in the viewport.
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(viewport);
  for(const name of ['Front','Isometric']){
   await page.getByRole('button',{name,exact:true}).click();
   assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert(await page.locator('.views button').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.height>=44;})));
  console.log('Official model layout passed: '+viewport.width+'x'+viewport.height);
 }
 await page.locator('#visual-mode').click();assert(await page.evaluate(()=>testLab.frame.contentWindow.testLabScene.floors.every(f=>!f.visible)));
 assert(requests.filter(p=>/\/avatar\/assembled-joints\/parts-/.test(p)).length===2,'One model request per mounted viewer');
 // A failed asset must produce a useful error, and Reset must recover.
 failAsset=true;await page.evaluate(()=>testLab.setTest('avatar'));
 await page.waitForFunction(()=>testLab.frame.contentWindow.avatarLoadError,undefined,{timeout:60000});
 assert.equal(await page.evaluate(()=>testLabReady),false);
 failAsset=false;await page.evaluate(()=>testLab.setTest('avatar'));await ready();
 assert.equal(await page.evaluate(()=>testLab.frame.contentWindow.avatarLab.avatar.version),'approved-joints-2026-11-19');
 assert.deepEqual(errors,[]);
 await mkdir('/tmp/avatar-assembly',{recursive:true});
 await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Angle',exact:true}).click();
 await page.screenshot({path:'/tmp/avatar-assembly/official-desktop.png'});
 console.log(JSON.stringify({pass:true,checks:'Both official routes, joint centres, pose toggles/reset, bones, phone/landscape/desktop layouts, views, inspection, repository URL prefix, failed-load recovery, no page errors',timings}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
