import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import * as T from 'three';
import {createFootStudy} from '../src/foot-study.js';
import {createFootShape} from '../src/foot-shape.js';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';
import {ANKLE_RADIUS,ANKLE_REST_HEIGHT} from '../../avatar/src/joints/ankle-contract.js';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const study=createFootStudy({ball:true,calfSocket:true}),rawFoot=createFootShape(),reference=createCharacterRig({plain:true});
const rawCalf=reference.kneeRight.children[0],meshes=[];
study.group.traverse(part=>{if(part.isMesh)meshes.push(part);});
assert.equal(meshes.length,3,'The study must contain foot, seated ball and calf');
assert.deepEqual(new Set(meshes),new Set([study.foot,study.calf,study.ankleBall]));
const mold=study.foot.userData.socketMold;
assert.equal(study.foot.userData.tinySocket,undefined,'Old tiny-dimple metadata remains');
assert.equal(mold.ballRadius,ANKLE_RADIUS,'Mold must use the exact last ankle ball');
assert.equal(mold.ballRadius,.115);assert.equal(mold.center[1],ANKLE_REST_HEIGHT);assert.equal(mold.center[1],.163520006775856);
assert.equal(mold.filletRadius,.0125,'The rim needs a real rounded bevel radius');
assert.equal(mold.center[0],0);assert.equal(mold.center[2],0);
assert(Math.abs(mold.center[1]-(mold.originalHeight-mold.pressDepth+mold.ballRadius))<1e-12,'Mold was not pressed down from the measured original surface');
assert(Math.abs(mold.pressDepth-.150986934463053)<1e-7,'Mold no longer reaches the measured ankle height');
const footPositions=study.foot.geometry.attributes.position,rawPositions=rawFoot.geometry.attributes.position;
const moldRest=study.foot.geometry.userData.moldRestPositions;
assert(footPositions.count>rawPositions.count,'Curved mold surface needs local refinement');
assert.equal(moldRest.length,footPositions.count*3,'Full pre-deformation surface must be retained');
for(let i=0;i<rawPositions.count;i++)for(let axis=0;axis<3;axis++)assert.equal(moldRest[i*3+axis],rawPositions.array[i*3+axis],'Refinement changed an original source vertex');
let socketVertices=0,maximumSocketDepth=0;
for(let i=0;i<footPositions.count;i++){
 const x=moldRest[i*3],y=moldRest[i*3+1],z=moldRest[i*3+2];
 assert.equal(footPositions.getX(i),x,'Socket changed the foot width');
 assert.equal(footPositions.getZ(i),z,'Socket changed the foot outline');
 const depth=y-footPositions.getY(i);
 assert(depth>=-1e-7&&depth<=mold.pressDepth+.0001,'Mold should cut a depression without a raised cuff');
 if(depth>1e-7){
  socketVertices++;maximumSocketDepth=Math.max(maximumSocketDepth,depth);
  assert(Math.hypot(x-mold.center[0],z-mold.center[2])<.14,'Mold changed a point outside the locally rounded socket');
  assert(y>.025,'Socket changed the sole or lower side');
 }
 if(y<1e-7||z>=.145)assert.equal(footPositions.getY(i),y,'Socket changed the sole or toes');
}
assert(socketVertices>10&&maximumSocketDepth>mold.pressDepth-.0001,'The requested deeper molded socket is missing');
const contact=study.foot.geometry.userData.moldContactIndices,moldCenter=new T.Vector3(...mold.center),point=new T.Vector3();
assert(contact.length>10,'Mold has no actual spherical contact patch');
let maximumMoldRadiusError=0,cavityBottom=Infinity;
for(const i of contact){
 assert(Number.isInteger(i)&&i>=0&&i<footPositions.count);
 maximumMoldRadiusError=Math.max(maximumMoldRadiusError,Math.abs(point.fromBufferAttribute(footPositions,i).distanceTo(moldCenter)-ANKLE_RADIUS));
 cavityBottom=Math.min(cavityBottom,footPositions.getY(i));
}
assert(maximumMoldRadiusError<1e-7,'Actual contact surface does not match the original ankle ball');
assert(study.foot.geometry.userData.filletContacts.length>100,'The socket rim has no physical rounded geometry');
let maximumFilletRadiusError=0;
for(const [i,centerR,centerY] of study.foot.geometry.userData.filletContacts){
 const r=Math.hypot(footPositions.getX(i),footPositions.getZ(i));
 maximumFilletRadiusError=Math.max(maximumFilletRadiusError,Math.abs(Math.hypot(r-centerR,footPositions.getY(i)-centerY)-.0125));
}
assert(maximumFilletRadiusError<1e-7,'The actual rim must follow its round-over arc');
const expectedBottom=ANKLE_REST_HEIGHT-ANKLE_RADIUS;
assert(cavityBottom>=expectedBottom-1e-7&&cavityBottom<expectedBottom+.0001,'Cavity bottom does not match the real ankle center and ball radius');
const calfMold=study.calf.userData.socketMold,calfPositions=study.calf.geometry.attributes.position,rawCalfPositions=rawCalf.geometry.attributes.position;
assert.equal(calfMold.depthRatio,.75);assert.equal(calfMold.pressDepth,.75*mold.pressDepth);assert.equal(calfMold.ballRadius,mold.ballRadius);assert.equal(calfMold.filletRadius,.0125);
assert(Math.abs(calfMold.center[1]+calfMold.ballRadius-calfMold.originalBase-calfMold.pressDepth)<1e-12);
for(let i=0;i<rawCalfPositions.count;i++){
 assert.equal(calfPositions.getX(i),rawCalfPositions.getX(i));assert.equal(calfPositions.getZ(i),rawCalfPositions.getZ(i));
 if(rawCalfPositions.getY(i)>=-.09-1e-7)assert.equal(calfPositions.getY(i),rawCalfPositions.getY(i));
}
for(const i of study.calf.geometry.userData.moldContactIndices)assert(Math.abs(point.fromBufferAttribute(calfPositions,i).distanceTo(new T.Vector3(...calfMold.center))-calfMold.ballRadius)<1e-7);
for(const [i,r,y] of study.calf.geometry.userData.filletContacts)assert(Math.abs(Math.hypot(Math.hypot(calfPositions.getX(i),calfPositions.getZ(i))-r,calfPositions.getY(i)-y)-.0125)<1e-7);
assert.equal(study.foot.material.color.getHex(),rawFoot.material.color.getHex());
assert.equal(study.calf.material.color.getHex(),rawCalf.material.color.getHex());
for(const part of meshes){
 assert.equal(part.visible,true);
 assert.equal(part.geometry.userData.cavityIndices,undefined,'Old ankle ball joint metadata remains');
 assert([...part.geometry.attributes.position.array,...part.geometry.attributes.normal.array].every(Number.isFinite));
}
study.group.updateMatrixWorld(true);
const footBox=new T.Box3().setFromObject(study.foot),calfBox=new T.Box3().setFromObject(study.calf);
const gaps=['x','y','z'].map(axis=>Math.max(0,footBox.min[axis]-calfBox.max[axis],calfBox.min[axis]-footBox.max[axis]));
const separation=Math.hypot(...gaps);
assert(separation>.005,'Foot and calf must be visibly separated');
assert(Math.abs(footBox.min.y)<1e-7,'The original foot sole must stay on the floor');

const server=createServer(async(req,res)=>{
 try{
  let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';
  const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]??'application/octet-stream');
  res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],shots=process.env.FOOT_LAB_SHOTS;if(shots)await mkdir(shots,{recursive:true});
async function fingerprint(page){return page.evaluate(()=>{
 const parts=[footLab.foot,footLab.calf,footLab.ankleBall];
 return parts.map(part=>({positions:Array.from(part.geometry.attributes.position.array),normals:Array.from(part.geometry.attributes.normal.array),position:part.position.toArray(),rotation:part.rotation.toArray(),scale:part.scale.toArray()}));
});}
async function framing(page){return page.evaluate(()=>{
 const {foot,calf,camera}=footLab;camera.updateMatrixWorld(true);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
 const point=foot.position.clone();for(const part of [foot,calf,footLab.ankleBall]){
  part.updateWorldMatrix(true,false);const positions=part.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   point.fromBufferAttribute(positions,i);part.localToWorld(point);point.project(camera);
   minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);minZ=Math.min(minZ,point.z);maxZ=Math.max(maxZ,point.z);
  }
 }
 return {minX,maxX,minY,maxY,minZ,maxZ};
});}
async function assertFraming(page,name){
 const f=await framing(page);
 assert(f.minX>-.98&&f.maxX<.98&&f.minY>-.9&&f.maxY<.9&&f.minZ>-1&&f.maxZ<1,`Raw study clipped in ${name}: ${JSON.stringify(f)}`);
}

try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>errors.push(e.message));
 assert.equal((await page.goto(base+'/foot-lab/')).status(),200);
 await page.waitForFunction(()=>window.footLabReady,undefined,{timeout:60000});
 assert.equal(await page.evaluate(()=>['rig','applyPose','inspectParts'].some(key=>key in footLab)),false,'Movement or ankle ball API is still present');
 assert.equal(await page.locator('[data-pose],[data-parts],input[type="range"],#play').count(),0,'Old joint or movement controls remain');
 assert.equal(await page.evaluate(()=>{
  const meshes=[];footLab.foot.parent.traverse(part=>{if(part.isMesh)meshes.push(part);});return meshes.length;
 }),3,'Study must contain the foot, separate calf and seated ankle ball');
 assert.equal(await page.evaluate(()=>{
  const {foot,ankleBall}=footLab,center=foot.position.clone().set(...foot.userData.socketMold.center);foot.localToWorld(center);
  return ankleBall.visible&&ankleBall.position.distanceTo(center)<1e-12&&ankleBall.geometry.parameters.radius===.115&&ankleBall.material===foot.material;
 }),true,'Original ball must sit at the stored socket center');
 const initial=await fingerprint(page);
 assert.equal(await page.evaluate(()=>footLab.getState().stage),'foot-socket');
 assert.equal(await page.evaluate(()=>footLab.foot.visible&&footLab.calf.visible),true);
 for(const view of ['Angle','Front','Side','Top','Sole']){
  await page.getByRole('button',{name:view,exact:true}).click();await assertFraming(page,'desktop '+view);if(shots&&view==='Top')await page.screenshot({path:resolve(shots,'top.png')});
 }
 assert.equal(await page.evaluate(()=>footLab.ground.visible),false,'Sole view should expose the underside');
 await page.getByRole('button',{name:'Angle',exact:true}).click();
 await page.getByRole('button',{name:'Floor',exact:true}).click();assert.equal(await page.evaluate(()=>footLab.ground.visible),false);
 await page.getByRole('button',{name:'Floor',exact:true}).click();assert.equal(await page.evaluate(()=>footLab.ground.visible),true);
 const angleCamera=await page.evaluate(()=>footLab.camera.position.toArray());
 const canvas=await page.locator('canvas').boundingBox();
 await page.mouse.move(canvas.x+canvas.width*.4,canvas.y+canvas.height*.4);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.6,canvas.y+canvas.height*.5,{steps:8});await page.mouse.up();
 await page.waitForFunction(before=>footLab.camera.position.toArray().some((v,i)=>Math.abs(v-before[i])>.01),angleCamera);
 await page.evaluate(()=>{for(let i=0;i<300;i++)footLab.controls.update();});
 await page.getByRole('button',{name:'Angle',exact:true}).click();
 assert(await page.evaluate(before=>footLab.camera.position.toArray().every((v,i)=>Math.abs(v-before[i])<1e-7),angleCamera),'Angle button did not restore its camera view');
 assert.deepEqual(await fingerprint(page),initial,'Inspection or camera changes altered the raw parts');
 if(shots){
  await page.screenshot({path:resolve(shots,'angle.png')});
  await page.evaluate(()=>{const {foot,camera,controls}=footLab;controls.target.set(foot.position.x,.12,0);camera.position.set(foot.position.x+.30,.38,.42);controls.update();});
  await page.screenshot({path:resolve(shots,'rim-close.png')});
  await page.evaluate(()=>{const {calf,camera,controls,ground}=footLab;ground.visible=false;controls.target.set(calf.position.x,.09,calf.position.z);camera.position.set(calf.position.x+.24,-.16,calf.position.z+.27);controls.update();});
  await page.screenshot({path:resolve(shots,'calf-socket-close.png')});await page.getByRole('button',{name:'Angle',exact:true}).click();
 }

 const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await phoneContext.newPage();phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(base+'/foot-lab/');await phone.waitForFunction(()=>window.footLabReady,undefined,{timeout:60000});
 const phoneInitial=await fingerprint(phone);
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await phone.setViewportSize(viewport);
  await phone.waitForFunction(()=>{const c=document.querySelector('canvas'),r=c.getBoundingClientRect();return Math.abs(footLab.camera.aspect-r.width/r.height)<1e-5;});
  assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Phone page overflows');
  for(const name of ['Angle','Front','Side','Top','Sole']){
   await phone.getByRole('button',{name,exact:true}).click();await assertFraming(phone,`phone ${viewport.width}×${viewport.height} ${name}`);
  }
 }
 await phone.setViewportSize({width:390,height:844});
 await phone.getByRole('button',{name:'Angle',exact:true}).tap();
 assert.equal(await phone.evaluate(()=>footLab.foot.visible&&footLab.calf.visible),true);
 if(shots)await phone.screenshot({path:resolve(shots,'mobile-angle.png')});
 const stage=await phone.locator('#stage').boundingBox(),cdp=await phoneContext.newCDPSession(phone),before=await phone.evaluate(()=>footLab.camera.position.toArray());
 const x=stage.x+stage.width*.35,y=stage.y+stage.height*.45;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*10,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await phone.waitForFunction(before=>footLab.camera.position.toArray().some((v,i)=>Math.abs(v-before[i])>.01),before);
 await phone.getByRole('button',{name:'Angle',exact:true}).tap();
 assert.deepEqual(await fingerprint(phone),phoneInitial,'Phone inspection changed the original geometry');
 await phone.goto(base+'/dist/test-lab/?test=feet');await phone.waitForFunction(()=>window.testLabReady,undefined,{timeout:60000});
 assert(await phone.getByRole('button',{name:'Motion',exact:true}).isDisabled(),'Ball placement must not add motion controls');
 assert.equal(await phone.evaluate(()=>{const w=testLab.frame.contentWindow,{foot,ankleBall,study}=w.footLab;const center=foot.position.clone().set(...foot.userData.socketMold.center);foot.localToWorld(center);return study.group.children.length===3&&ankleBall.visible&&ankleBall.position.distanceTo(center)<1e-12;}),true,'Shared viewer must show the ball seated in the same socket');
 await phoneContext.close();assert.deepEqual(errors,[]);
 console.log(JSON.stringify({studyMeshes:3,ballSeated:true,moldedFootSocket:true,moldBallRadius:mold.ballRadius,ankleCenterHeight:mold.center[1],refinedVertices:footPositions.count,socketVertices,contactVertices:contact.length,cavityBottom,maximumSocketDepth,maximumMoldRadiusError,maximumFilletRadiusError,calfSocketDepthRatio:calfMold.depthRatio,calfSocketDepth:calfMold.pressDepth,upperCalfPreserved:true,separation,calfSocket:true,noMovementControls:true,viewReset:true,floorToggle:true,desktopOrbit:true,mobileOrbit:true,mobileLayouts:3,mobileFraming:true,geometryUnchanged:true,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
