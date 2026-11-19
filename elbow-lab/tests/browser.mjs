import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve(import.meta.dirname,'../../dist'),shots=process.env.ELBOW_LAB_SHOTS,errors=[];
if(shots)await mkdir(shots,{recursive:true});
const server=createServer(async(req,res)=>{
 try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
function partsState(){const {group,ball,upperArm,forearm}=elbowLab;return {parts:group.children.length,ballRadius:ball.geometry.parameters.radius,diameterRatio:ball.userData.diameterRatio,forearmDepth:forearm.geometry.userData.wristMold?.depthFraction,positions:[upperArm.position.toArray(),ball.position.toArray(),forearm.position.toArray()],buffers:group.children.map(p=>Object.values(p.geometry.attributes).map(a=>[a.count,a.version]))};}
function framed(){const {group,camera}=elbowLab;group.updateMatrixWorld(true);camera.updateMatrixWorld(true);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;const point=group.position.clone();for(const part of group.children){const p=part.geometry.attributes.position;for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(part.matrixWorld).project(camera);minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);}}return minX>-.98&&maxX<.98&&minY>-.98&&maxY<.98;}
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/elbow-lab/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.elbowLabReady,undefined,{timeout:60000});
 const initial=await page.evaluate(partsState);assert.equal(initial.parts,3);assert.equal(initial.diameterRatio,.9);assert.equal(initial.forearmDepth,1/3);
 await page.waitForTimeout(400);assert.deepEqual(await page.evaluate(partsState),initial,'The separated parts must remain still');
 for(const name of ['Front','Side','Back','Top','Angle']){
  await page.getByRole('button',{name,exact:true}).click();assert(await page.evaluate(framed),'Desktop framing '+name);
  if(shots&&['Front','Angle'].includes(name))await page.screenshot({path:resolve(shots,'desktop-'+name.toLowerCase()+'.png')});
 }
 assert.deepEqual(await page.evaluate(partsState),initial,'View controls must not change the parts');await page.close();
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(base+'/test-lab/?test=elbow',{waitUntil:'domcontentloaded'});await phone.waitForFunction(()=>window.testLabReady,undefined,{timeout:60000});
 const frame=phone.frames().find(f=>f.url().includes('/elbow-lab/'));
 assert.equal(await phone.locator('#test-context').textContent(),'Elbow');assert(await phone.getByRole('button',{name:'Motion',exact:true}).isDisabled());
 const saved=await frame.evaluate(partsState);
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await phone.setViewportSize(viewport);
  await phone.waitForFunction(()=>{const w=testLab.frame.contentWindow,rect=w.document.querySelector('canvas').getBoundingClientRect();return Math.abs(w.elbowLab.camera.aspect-rect.width/rect.height)<1e-5;});
  assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Phone width overflow');
  for(const name of ['Front','Side','Back','Top','Angle']){await phone.getByRole('button',{name,exact:true}).tap();assert(await frame.evaluate(framed),`Phone ${viewport.width} ${name} framing`);}
 }
 await phone.setViewportSize({width:390,height:844});await phone.getByRole('button',{name:'Front',exact:true}).tap();
 await phone.getByRole('button',{name:'Inspection',exact:true}).tap();assert.equal(await frame.evaluate(()=>testLabScene.getState().floorVisible),false);
 if(shots)await phone.screenshot({path:resolve(shots,'phone-front.png')});
 const before=await frame.evaluate(()=>elbowLab.camera.position.toArray()),box=await frame.locator('canvas').boundingBox(),cdp=await context.newCDPSession(phone),x=box.x+box.width*.4,y=box.y+box.height*.4;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=7;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*9,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await frame.waitForFunction(before=>elbowLab.camera.position.toArray().some((v,i)=>Math.abs(v-before[i])>.01),before);
 assert.deepEqual(await frame.evaluate(partsState),saved,'Touch inspection must not change geometry or placement');
 assert.deepEqual(errors,[]);await context.close();console.log(JSON.stringify({parts:3,staticSeparation:true,forearmDepth:1/3,diameterRatio:.9,desktop:true,mobileLayouts:3,framing:true,touchOrbit:true,floorInspection:true,motionDisabled:true,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
