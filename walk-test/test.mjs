import assert from 'node:assert/strict';
import {build} from 'esbuild';
import * as T from 'three';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {handBindPlugin} from '../references/motion-compare/hand-bind.mjs';
await build({entryPoints:['walk-test/controller.js'],bundle:true,platform:'node',format:'esm',plugins:[handBindPlugin()],outfile:'/tmp/walk-test-unit.mjs'});
const {PlayableWalk}=await import('/tmp/walk-test-unit.mjs'),p=new PlayableWalk();
assert(p.maxSpeed>.8&&p.maxSpeed<1.1);assert(p.contacts.every(c=>c>=0),'Walking must have no flight phases');
const start=new PlayableWalk();let minStartZ=0;for(let i=0;i<25;i++){start.step(1/60,0,1);start.pose(1/60);minStartZ=Math.min(minStartZ,start.position.z);}assert(minStartZ>-.025,'Starting a walk must not pull the body backward');
let doubleSupport=0,maxFootLift=0,maxBoneError=0;
for(let f=0;f<77;f+=.5){
 p.motion.setFrame(f);const planted=p.legs.filter(l=>l.walkPlanted);assert(planted.length>=1,'At least one foot must always support the walk');if(planted.length===2)doubleSupport++;
 for(const l of p.legs){
  const H=l.hip.getWorldPosition(new T.Vector3()),K=l.knee.getWorldPosition(new T.Vector3()),A=l.foot.localToWorld(l.motion.anklePoint(new T.Vector3()));maxBoneError=Math.max(maxBoneError,Math.abs(H.distanceTo(K)-l.upper),Math.abs(K.distanceTo(A)-l.lower));
  maxFootLift=Math.max(maxFootLift,l.walkLift);
 }
}
assert(doubleSupport>15,'A real walk needs overlapping ground contact');assert(maxFootLift<.075,'Foot recovery must stay low, rather than use the high run recovery');assert(maxBoneError<1e-5,'Walking must preserve measured leg lengths');
console.log('Walk gait',JSON.stringify({doubleSupportSamples:doubleSupport,maxFootLift,maxBoneError,cycle:p.cycle,speed:p.maxSpeed}));
for(const scenario of ['straight','turn','reverse']){
 const w=new PlayableWalk();for(let i=0;i<210;i++){const moving=i<150,x=moving&&scenario==='turn'?Math.sin(i/50):0,z=moving?(scenario==='reverse'&&i>75?-1:scenario==='turn'?Math.cos(i/50):1):0;w.step(1/30,x,z);w.pose(1/30);}
 assert(w.steps>6);assert(w.metrics.maxPlantedSlide<1e-6);assert(w.metrics.minSoleHeight>=-1e-6);assert(w.metrics.minHip>.89);assert(w.metrics.maxHip<.98);assert(w.metrics.maxBoneError<1e-5);assert.equal(w.speed,0);assert.equal(w.activity,0);assert(Math.abs(w.root.position.y)<1e-6);console.log(scenario,JSON.stringify(w.getState()));
}
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(resolve('dist','.'+path)));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/walk-test/`);await page.waitForFunction(()=>window.walkTestReady,undefined,{timeout:60000});
 assert.equal(await page.evaluate(()=>movement.scene.background.getHexString()),'405363');assert.equal(await page.evaluate(()=>movement.player.getState().gait),'walk');
 const cdp=await page.context().newCDPSession(page),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:1,radiusY:1,force:1}))});
 await touch('touchStart',[[1,85,650]]);await touch('touchMove',[[1,85,615]]);await page.waitForFunction(()=>movement.player.speed>.2&&movement.player.phase>.08,undefined,{timeout:60000});const slow=await page.evaluate(()=>movement.player.speed);
 await touch('touchMove',[[1,85,565]]);await page.waitForFunction(()=>movement.player.speed>.85,undefined,{timeout:60000});assert(slow<await page.evaluate(()=>movement.player.speed));assert.equal(await page.locator('#status').textContent(),'Walking');
 const yaw=await page.evaluate(()=>movement.getState().camera.yaw);await touch('touchStart',[[1,85,565],[2,300,550]]);await touch('touchMove',[[1,85,565],[2,340,575]]);await page.waitForFunction(y=>Math.abs(movement.getState().camera.yaw-y)>.1,yaw);assert(await page.evaluate(()=>movement.input.stick!==null));
 await mkdir('/tmp/walk-test-shots',{recursive:true});await page.screenshot({path:'/tmp/walk-test-shots/mobile.png'});await touch('touchEnd',[]);await page.waitForFunction(()=>movement.player.speed===0&&movement.player.activity===0,undefined,{timeout:60000});assert(await page.locator('#joystick').isHidden());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.evaluate(()=>{movement.setIntent(0,1);movement.setCamera(Math.PI/2,.15,4.5);});await page.waitForFunction(()=>movement.player.activity===1,undefined,{timeout:60000});await page.screenshot({path:'/tmp/walk-test-shots/side.png'});assert.deepEqual(errors,[]);console.log('Mobile slow/full walking, second-finger camera, release, slate background and no errors: pass.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
