import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import * as T from 'three';
import {GroundedMovement,TUNING,analogSpeed,solveLeg} from '../controller.js';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url))),sha=value=>createHash('sha256').update(value).digest('hex');
const checkpoint=JSON.parse(await readFile(resolve(root,'checkpoints/avatar-2/CHECKPOINT.json'),'utf8'));
assert.equal(sha(await readFile(resolve(root,'checkpoints/avatar-2/index.html'))),checkpoint.viewer_sha256,'Checkpoint 2 was altered');
for(const [path,hash] of Object.entries(checkpoint.source_sha256))if(/^(avatar\/|avatar-lab\/src\/|foot-lab\/src\/|hand-lab\/src\/)/.test(path))assert.equal(sha(await readFile(resolve(root,path))),hash,'Saved avatar source changed: '+path);
assert.equal(analogSpeed(0),0);assert.equal(analogSpeed(.55),TUNING.walkSpeed);assert.equal(analogSpeed(1),TUNING.runSpeed);assert.ok(analogSpeed(.2)<analogSpeed(.5)&&analogSpeed(.5)<analogSpeed(.9));
for(const ankle of [new T.Vector3(0,.15,.1),new T.Vector3(.2,.25,-.2),new T.Vector3(-.15,.3,.3)]){
 const hip=new T.Vector3(0,.85,0),knee=solveLeg(hip,ankle,.42,.386,new T.Vector3(0,0,1));assert.ok(Math.abs(knee.distanceTo(hip)-.42)<1e-8&&Math.abs(knee.distanceTo(ankle)-.386)<1e-8,'Leg IK changes bone lengths');
}
const scenarios={walk:i=>i<100?[0,.4]:[0,0],run:i=>i<130?[0,1]:[0,0],turn:i=>i<120?[Math.sin(Math.max(0,i-50)/35),Math.cos(Math.max(0,i-50)/35)]:[0,0],reverse:i=>i<60?[0,1]:i<120?[0,-1]:[0,0]};
const results={};
for(const [name,intent] of Object.entries(scenarios)){
 const p=new GroundedMovement();let count=0;p.root.traverse(o=>{if(o.isMesh)count++;});assert.equal(count,15,'Extra avatar meshes added');
 for(let i=0;i<200;i++){
  p.update(1/60,...intent(i));
  if(i%10===0)for(const leg of p.legs){
   const cp=leg.calf.geometry.attributes.position,n=leg.calf.geometry.attributes.normal,baseline=leg.socket.restPositions;
   for(let j=0;j<cp.count;j+=19){assert.ok([cp.getX(j),cp.getY(j),cp.getZ(j),n.getX(j),n.getY(j),n.getZ(j)].every(Number.isFinite),'Invalid calf surface');if(baseline[j*3+1]>=leg.calf.geometry.userData.joinY-1e-7)for(let axis=0;axis<3;axis++)assert.equal(cp.array[j*3+axis],baseline[j*3+axis],'Calf shaft deforms');}
   const fp=leg.foot.geometry.attributes.position;let lowest=Infinity;for(let j=0;j<fp.count;j++)lowest=Math.min(lowest,fp.getY(j));assert.ok(lowest+leg.foot.position.y+p.root.position.y>=-1e-6,'Foot passes through slab');
  }
 }
 const state=p.getState();assert.ok(state.steps>4&&state.metrics.plants>3,'Feet do not alternate');assert.ok(state.metrics.maxPlantedSlide<1e-5,'Planted feet slide');assert.ok(state.metrics.maxPlantedVerticalError<1e-5,'Planted feet float');assert.ok(state.metrics.maxIKError<1e-5,'Legs do not reach pinned feet');assert.ok(state.metrics.maxReachExcess<1e-5,'Foot target exceeds reach');assert.ok(state.metrics.maxBodyDrop<.36,'Body crouches excessively');assert.equal(state.speed,0,'Release does not stop');assert.ok(state.feet.every(f=>f.planted),'Feet never settle after stopping');
 if(name==='walk')assert.equal(state.metrics.flightFrames,0,'Walking should retain a supporting foot');if(name==='run')assert.ok(state.metrics.flightFrames>0,'Running has no flight phase');
 results[name]={steps:state.steps,...state.metrics};
}
const edge=new GroundedMovement();for(let i=0;i<1200;i++)edge.step(1/120,1,0);assert.ok(edge.position.x<=TUNING.slabSize/2-.799,'Avatar leaves slab');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const shots=process.env.MOVEMENT_SHOTS;if(shots)await mkdir(shots,{recursive:true});const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>errors.push(e.message));assert.equal((await page.goto(base+'/dist/movement/')).status(),200);await page.waitForFunction(()=>window.movementReady,undefined,{timeout:60000});
 assert.equal(await page.evaluate(()=>movement.slab.geometry.parameters.width),60);
 if(shots)await page.screenshot({path:resolve(shots,'standing.png')});
 await page.keyboard.down('KeyW');await page.waitForFunction(()=>movement.player.speed>1.5,undefined,{timeout:60000});assert.ok(await page.evaluate(()=>movement.player.speed<2.2));
 if(shots)await page.screenshot({path:resolve(shots,'walking.png')});
 await page.keyboard.down('ShiftLeft');await page.waitForFunction(()=>movement.player.speed>4.8,undefined,{timeout:60000});
 if(shots)await page.screenshot({path:resolve(shots,'running.png')});
 await page.keyboard.up('KeyW');await page.keyboard.down('KeyD');await page.waitForFunction(()=>movement.player.position.x<-.5,undefined,{timeout:60000});
 if(shots)await page.screenshot({path:resolve(shots,'running-side.png')});
 await page.keyboard.up('KeyD');await page.keyboard.up('ShiftLeft');await page.waitForFunction(()=>movement.player.speed<.01&&movement.player.legs.every(l=>l.planted)&&!movement.player.active,undefined,{timeout:60000});
 const desktop=await page.evaluate(()=>movement.player.getState().metrics);assert.ok(desktop.maxPlantedSlide<1e-5&&desktop.maxIKError<1e-5);
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base+'/dist/movement/');await phone.waitForFunction(()=>window.movementReady,undefined,{timeout:60000});assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const cdp=await mobile.newCDPSession(phone),send=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points}),left=(x,y)=>({id:1,x,y}),right=(x,y)=>({id:2,x,y});
 await send('touchStart',[left(70,620)]);assert.deepEqual(await phone.evaluate(()=>movement.getState().stick),{x:70,y:620});assert.equal(await phone.locator('#joystick').isVisible(),true);
 await send('touchMove',[left(73,618)]);await phone.waitForTimeout(100);assert.ok(await phone.evaluate(()=>movement.player.speed<.01),'Dead zone moves the avatar');
 await send('touchMove',[left(70,596)]);await phone.waitForFunction(()=>movement.player.speed>.8&&movement.player.speed<2.2,undefined,{timeout:60000});assert.equal(await phone.locator('#status').textContent(),'Walking');
 if(shots)await phone.screenshot({path:resolve(shots,'mobile-walking.png')});
 await send('touchMove',[left(70,545)]);await phone.waitForFunction(()=>movement.player.speed>4.7,undefined,{timeout:60000});assert.equal(await phone.locator('#status').textContent(),'Running');
 const yaw=await phone.evaluate(()=>movement.getState().camera.yaw);await send('touchStart',[left(70,545),right(300,400)]);
 for(let i=1;i<=6;i++)await send('touchMove',[left(70,545),right(300+i*7,400+i*2)]);
 await phone.waitForFunction(before=>Math.abs(movement.getState().camera.yaw-before)>.1,yaw,{timeout:60000});assert.deepEqual(await phone.evaluate(()=>movement.getState().stick),{x:70,y:620},'Camera touch steals the joystick');assert.ok(await phone.evaluate(()=>movement.player.speed>4),'Two-finger camera stops running');
 if(shots)await phone.screenshot({path:resolve(shots,'mobile-running.png')});
 await send('touchEnd',[left(70,545)]);await send('touchEnd',[]);await phone.waitForFunction(()=>movement.player.speed<.01&&movement.player.legs.every(l=>l.planted)&&!movement.player.active,undefined,{timeout:60000});assert.equal(await phone.locator('#joystick').isVisible(),false);
 await send('touchStart',[left(24,170)]);assert.deepEqual(await phone.evaluate(()=>movement.getState().stick),{x:24,y:170},'Joystick is tied to one corner');await send('touchCancel',[]);assert.equal(await phone.locator('#joystick').isVisible(),false);
 const phoneMetrics=await phone.evaluate(()=>movement.player.getState().metrics);assert.ok(phoneMetrics.maxPlantedSlide<1e-5&&phoneMetrics.maxIKError<1e-5);
 await mobile.close();
 await page.goto(base+'/dist/checkpoints/avatar-2/');await page.waitForFunction(()=>window.avatarLabReady,undefined,{timeout:60000});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({simulation:results,desktop,phone:phoneMetrics,floatingJoystick:true,analogWalkRun:true,multitouchCamera:true,slabBoundary:true,rigidCalves:true,checkpoint2Unchanged:true,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
