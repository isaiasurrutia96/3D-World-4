import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {handBindPlugin} from '../references/motion-compare/hand-bind.mjs';
await build({entryPoints:['run-test/controller.js'],bundle:true,platform:'node',format:'esm',plugins:[handBindPlugin()],outfile:'/tmp/run-test-unit.mjs'});
const {PlayableRun}=await import('/tmp/run-test-unit.mjs');
for(const scenario of ['straight','turn','reverse']){
 const p=new PlayableRun();let hipSum=0,hipCount=0;
 for(let i=0;i<180;i++){
  const moving=i<120,x=scenario==='turn'&&moving?Math.sin(i/35):0,z=moving?(scenario==='reverse'&&i>60?-1:scenario==='turn'?Math.cos(i/35):1):0;
  p.step(1/30,x,z);p.pose(1/30);
  if(p.activity===1){hipSum+=p.rig.hipRight.getWorldPosition(p.position.clone()).y;hipCount++;}
 }
 assert(p.steps>5,'Must alternate foot contacts');assert(p.metrics.maxPlantedSlide<1e-6,'Planted foot must stay fixed');assert(p.metrics.minSoleHeight>=-1e-6,'Feet must not sink through the floor');assert(p.metrics.maxBoneError<1e-6,'Limb lengths must stay fixed');assert(p.metrics.minHip>.80,'Must not drop into a deep crouch');assert(hipSum/hipCount>.92,'Must not remain in the old crouched walk');assert.equal(p.speed,0);assert.equal(p.activity,0);assert(Math.abs(p.root.position.y)<1e-6,'Stopped avatar must return to grounded standing');console.log(scenario,JSON.stringify(p.getState()));
}
const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(p.endsWith('/'))p+='index.html';res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(resolve('dist','.'+p)));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/run-test/`);await page.waitForFunction(()=>window.runTestReady,undefined,{timeout:60000});
 const cdp=await page.context().newCDPSession(page),touch=async(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:1,radiusY:1,force:1}))});
 await touch('touchStart',[[1,90,650]]);await page.waitForFunction(()=>movement.input.stick!==null);assert.deepEqual(await page.evaluate(()=>[movement.input.stick.x,movement.input.stick.y]),[90,650]);
 await touch('touchMove',[[1,90,570]]);await page.waitForFunction(()=>movement.player.speed>2&&movement.player.phase>.1,undefined,{timeout:60000});
 const yaw=await page.evaluate(()=>movement.getState().camera.yaw);await touch('touchStart',[[1,90,570],[2,300,540]]);await touch('touchMove',[[1,90,570],[2,345,565]]);await page.waitForFunction(y=>Math.abs(movement.getState().camera.yaw-y)>.1,yaw);assert(await page.evaluate(()=>movement.input.stick!==null));
 await mkdir('/tmp/run-test-shots',{recursive:true});await page.screenshot({path:'/tmp/run-test-shots/mobile-running.png'});
 await touch('touchEnd',[]);await page.waitForFunction(()=>movement.player.speed===0&&movement.player.activity===0,undefined,{timeout:60000});assert(await page.locator('#joystick').isHidden());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.evaluate(()=>{movement.setCamera(Math.PI/2,.15,4.7);movement.setIntent(0,1);for(let i=0;i<40;i++){movement.player.step(1/60,0,1);movement.player.pose(1/60);}});await page.screenshot({path:'/tmp/run-test-shots/side-running.png'});
 await page.evaluate(()=>movement.setIntent(0,0));await page.waitForFunction(()=>movement.player.activity===0,undefined,{timeout:60000});
 assert.deepEqual(errors,[]);console.log('Phone floating joystick, run, simultaneous camera touch, release/standing, no overflow/errors: pass.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
