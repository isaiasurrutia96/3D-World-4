import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import * as T from 'three';
import {createFootStudy} from '../src/foot-study.js';
import {createFootShape} from '../src/foot-shape.js';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const hash=array=>createHash('sha256').update(new Uint8Array(array.buffer,array.byteOffset,array.byteLength)).digest('hex');
const geometrySignature=mesh=>({position:hash(mesh.geometry.attributes.position.array),normal:hash(mesh.geometry.attributes.normal.array),index:hash(mesh.geometry.index.array)});
const study=createFootStudy(),rawFoot=createFootShape(),reference=createCharacterRig({plain:true});
const rawCalf=reference.kneeRight.children[0],meshes=[];
study.group.traverse(part=>{if(part.isMesh)meshes.push(part);});
assert.equal(meshes.length,2,'The study must contain only one foot and one calf');
assert.deepEqual(new Set(meshes),new Set([study.foot,study.calf]));
assert.deepEqual(geometrySignature(study.foot),geometrySignature(rawFoot),'Foot is not the original uncarved shape');
assert.deepEqual(geometrySignature(study.calf),geometrySignature(rawCalf),'Calf is not the original uncarved shape');
assert.equal(study.foot.material.color.getHex(),rawFoot.material.color.getHex());
assert.equal(study.calf.material.color.getHex(),rawCalf.material.color.getHex());
for(const part of meshes){
 assert.equal(part.visible,true);
 assert.equal(part.geometry.userData.cavityIndices,undefined,'Raw parts must have no carved socket');
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
 const parts=[footLab.foot,footLab.calf];
 return parts.map(part=>({positions:Array.from(part.geometry.attributes.position.array),normals:Array.from(part.geometry.attributes.normal.array),position:part.position.toArray(),rotation:part.rotation.toArray(),scale:part.scale.toArray()}));
});}
async function framing(page){return page.evaluate(()=>{
 const {foot,calf,camera}=footLab;camera.updateMatrixWorld(true);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
 const point=foot.position.clone();for(const part of [foot,calf]){
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
 assert.equal(await page.evaluate(()=>['rig','ankleBall','applyPose','inspectParts'].some(key=>key in footLab)),false,'Movement or ankle ball API is still present');
 assert.equal(await page.locator('[data-pose],[data-parts],input[type="range"],#play').count(),0,'Old joint or movement controls remain');
 assert.equal(await page.evaluate(()=>{
  const meshes=[];footLab.foot.parent.traverse(part=>{if(part.isMesh)meshes.push(part);});return meshes.length;
 }),2,'Study scene gained an extra joint or other part');
 const initial=await fingerprint(page);
 assert.equal(await page.evaluate(()=>footLab.getState().stage),'shapes');
 assert.equal(await page.evaluate(()=>footLab.foot.visible&&footLab.calf.visible),true);
 for(const view of ['Angle','Front','Side','Top','Sole']){
  await page.getByRole('button',{name:view,exact:true}).click();await assertFraming(page,'desktop '+view);
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
 if(shots)await page.screenshot({path:resolve(shots,'angle.png')});

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
 await phoneContext.close();assert.deepEqual(errors,[]);
 console.log(JSON.stringify({studyMeshes:2,rawFootExact:true,rawCalfExact:true,separation,noSocketsOrBall:true,noMovementControls:true,viewReset:true,floorToggle:true,desktopOrbit:true,mobileOrbit:true,mobileLayouts:3,mobileFraming:true,geometryUnchanged:true,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
