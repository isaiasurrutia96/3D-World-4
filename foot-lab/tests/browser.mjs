import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import * as T from 'three';
import {createFootShape,FOOT_SIZE} from '../src/foot-shape.js';
import {createCalf} from '../src/calf.js';
import {SOCKET_DEPTH,SOCKET_CLEARANCE} from '../src/ankle-socket.js';
import {createFootRig,REST_POSE,POSES,BEND_END} from '../src/foot-rig.js';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url))),foot=createFootShape();
const g=foot.geometry,p=g.attributes.position,size=g.boundingBox.getSize(foot.position.clone());
assert.ok([size.x-FOOT_SIZE.width,size.y-FOOT_SIZE.height].every(d=>Math.abs(d)<1e-6),'Foot width or height changed');
assert.ok(size.z>FOOT_SIZE.length&&size.z<FOOT_SIZE.length+.0221,'Toe extension is not slight');
const baseline=createFootShape(undefined,{toeExtension:0,toeLeftShift:0}),bp=baseline.geometry.attributes.position;
assert.equal(bp.count,p.count);let medial=-Infinity,lateral=-Infinity,tipZ=-Infinity,tipX=0;
for(let i=0;i<p.count;i++){
 assert.equal(p.getY(i),bp.getY(i));
 assert.ok(p.getX(i)<=bp.getX(i)+1e-7&&p.getX(i)>=bp.getX(i)-.030001,'Toe sweep changed direction or is excessive');
 if(bp.getZ(i)<=.20)assert.equal(p.getX(i),bp.getX(i),'Heel or midfoot moved sideways');
 if(bp.getZ(i)<=.18)assert.equal(p.getZ(i),bp.getZ(i),'Heel or midfoot changed');
 if(p.getX(i)<-.025)medial=Math.max(medial,p.getZ(i));if(p.getX(i)>.025)lateral=Math.max(lateral,p.getZ(i));
 if(p.getZ(i)>tipZ){tipZ=p.getZ(i);tipX=p.getX(i);}
}
assert.ok(medial-lateral>.004&&medial-lateral<.040,'Front has no subtle big-toe asymmetry');
assert.ok(tipX<-.055&&tipX>-.090,'Big-toe tip is not farther left in Top view');
const savedFoot=p.array.slice(),calf=createCalf(foot),calfReference=createCharacterRig({plain:true}).kneeRight.children[0];
assert.deepEqual(p.array,savedFoot,'Socket fitting changed the foot shape');
const cg=calf.geometry,cp=cg.attributes.position,reference=calfReference.geometry.attributes.position;
for(let i=0;i<reference.count;i++)if(reference.getY(i)>cg.userData.joinY+1e-6){
 let nearest=Infinity;
 for(let j=0;j<cp.count;j++)nearest=Math.min(nearest,(reference.getX(i)-cp.getX(j))**2+(reference.getY(i)-cp.getY(j))**2+(reference.getZ(i)-cp.getZ(j))**2);
 assert.ok(nearest<1e-12,'Upper calf silhouette changed');
}
assert.equal(calf.material.color.getHex(),foot.material.color.getHex());
assert.equal(calf.userData.socket,true);
assert.ok(new T.Vector3().fromArray(cg.userData.socketSeatCenter).add(calf.position).distanceTo(new T.Vector3().fromArray(cg.userData.footSeatCenter))<1e-9,'Foot is off-center in the socket');
const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0)),sample=new T.Vector3();let minFit=Infinity,maxFit=-Infinity,minLipGap=Infinity;
foot.updateMatrixWorld(true);
for(let i=0;i<cp.count;i+=37){
 sample.fromBufferAttribute(cp,i).add(calf.position);if(sample.y>g.boundingBox.max.y+.002)continue;
 ray.ray.origin.set(sample.x,1,sample.z);const hit=ray.intersectObject(foot)[0];assert.ok(hit,'Socket extends outside the ankle surface');
 const gap=sample.clone().sub(hit.point).dot(hit.normal);
 if(i<cg.userData.cavityVertexCount){minFit=Math.min(minFit,gap);maxFit=Math.max(maxFit,gap);}else minLipGap=Math.min(minLipGap,gap);
}
assert.ok(minFit>.0004&&maxFit<.0008,'Socket does not closely follow the foot');
assert.ok(minLipGap>.00035,'Socket lip intersects the foot');
const calfEdges=new Map();let calfVolume=0;
for(let i=0;i<cg.index.count;i+=3){
 const ids=cg.index.array.slice(i,i+3),v=Array.from(ids,j=>new T.Vector3().fromBufferAttribute(cp,j));
 calfVolume+=v[0].dot(v[1].clone().cross(v[2]))/6;
 for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=Math.min(a,b)*cp.count+Math.max(a,b);calfEdges.set(key,(calfEdges.get(key)||0)+1);}
}
assert.equal([...calfEdges.values()].filter(n=>n!==2).length,0,'Socket calf has an open seam');
assert.equal(cp.count-calfEdges.size+cg.index.count/3,2,'Socket calf topology changed');
assert.ok(calfVolume>0&&[...cp.array,...cg.attributes.normal.array].every(Number.isFinite),'Invalid socket calf surface');
assert.ok(Math.abs(g.boundingBox.min.y)<1e-7,'Sole is not on the floor');
assert.ok(foot.userData.soleVertices/p.count>.12,'The flat contact patch is too small');
assert.ok([...p.array,...g.attributes.normal.array].every(Number.isFinite),'Invalid foot geometry');
const edges=new Map();let volume=0;
for(let i=0;i<g.index.count;i+=3){
 const ids=g.index.array.slice(i,i+3);
 for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=Math.min(a,b)*p.count+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);}
 const [a,b,c]=ids;volume+=(p.getX(a)*(p.getY(b)*p.getZ(c)-p.getZ(b)*p.getY(c))+p.getY(a)*(p.getZ(b)*p.getX(c)-p.getX(b)*p.getZ(c))+p.getZ(a)*(p.getX(b)*p.getY(c)-p.getY(b)*p.getX(c)))/6;
}
assert.equal([...edges.values()].filter(n=>n!==2).length,0,'Foot has an open seam');
assert.equal(p.count-edges.size+g.index.count/3,2,'Foot topology changed');assert.ok(volume>0,'Foot faces point inward');
for(const point of Object.values(foot.userData.contacts)){assert.equal(point[1],0);assert.ok(point[2]>g.boundingBox.min.z&&point[2]<g.boundingBox.max.z);}
const approval=JSON.parse(await readFile(resolve(root,'avatar/APPROVED.json'),'utf8'));
for(const [name,hash] of Object.entries(approval.sha256))assert.equal(createHash('sha256').update(await readFile(resolve(root,'avatar',name))).digest('hex'),hash,'Approved avatar changed: '+name);
const savedFootNormals=g.attributes.normal.array.slice(),savedCalf=cp.array.slice(),savedCalfNormals=cg.attributes.normal.array.slice(),savedCalfPosition=calf.position.clone();
const rig=createFootRig(foot,calf),world=new T.Vector3();let plantedError=0,heelHeight=0,minMovingGap=Infinity;
const trials={...POSES,left:{roll:-10},right:{roll:10},combined:{heel:30,toes:25,ankle:24,roll:10}};
for(const [name,pose] of Object.entries(trials)){
 rig.setPose(pose);assert.ok(calf.visible,'Calf disappeared during movement');
 assert.ok([...p.array,...cp.array,...g.attributes.normal.array,...cg.attributes.normal.array].every(Number.isFinite),'Invalid moving surface: '+name);
 assert.ok(Math.abs(g.boundingBox.min.y+rig.group.position.y)<1e-7,'Foot penetrates or floats above the floor: '+name);
 for(let i=0;i<cp.count;i+=37){
  world.fromBufferAttribute(cp,i);calf.localToWorld(world);if(world.y>g.boundingBox.max.y+rig.group.position.y+.002)continue;
  ray.ray.origin.set(world.x,2,world.z);const hit=ray.intersectObject(foot)[0];if(!hit)continue;
  assert.ok(world.y-hit.point.y>0,'Moving socket intersects the foot: '+name);
  if(i<cg.userData.cavityVertexCount){const gap=world.clone().sub(hit.point).dot(hit.normal);minMovingGap=Math.min(minMovingGap,gap);assert.ok(gap>.00035&&gap<.0009,'Socket fit opened during motion: '+name);}
 }
 if(name==='tiptoe')for(let i=0;i<p.count;i++)if(savedFoot[i*3+1]<1e-7){
  if(savedFoot[i*3+2]>BEND_END)plantedError=Math.max(plantedError,Math.hypot(p.getX(i)-savedFoot[i*3],p.getY(i)+rig.group.position.y,p.getZ(i)-savedFoot[i*3+2]));
  if(savedFoot[i*3+2]<0)heelHeight=Math.max(heelHeight,p.getY(i)+rig.group.position.y);
 }
}
assert.ok(plantedError<1e-6&&heelHeight>.10,'Tiptoe does not raise the heel over a planted forefoot');
for(let repeat=0;repeat<3;repeat++)for(const pose of Object.values(POSES))rig.setPose(pose);
rig.setPose(REST_POSE);
assert.deepEqual(p.array,savedFoot,'Rest foot drifted');assert.deepEqual(g.attributes.normal.array,savedFootNormals,'Rest foot shading changed');
assert.deepEqual(cp.array,savedCalf,'Rest socket drifted');assert.deepEqual(cg.attributes.normal.array,savedCalfNormals,'Rest calf shading changed');
assert.deepEqual(calf.position,savedCalfPosition);assert.equal(rig.group.position.y,0);
const server=createServer(async(req,res)=>{
 try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const shots=process.env.FOOT_LAB_SHOTS;if(shots)await mkdir(shots,{recursive:true});
const errors=[];
async function settle(page){await page.waitForFunction(()=>{const s=footLab.getState(),applied=footLab.rig.getState().pose;return Object.keys(s.target).every(k=>s.target[k]===s.current[k]&&Math.abs(applied[k]-s.target[k])<1e-8);});}
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>errors.push(e.message));
 assert.equal((await page.goto(base+'/foot-lab/')).status(),200);await page.waitForFunction(()=>window.footLabReady);
 for(const [name,label] of Object.entries({point:'Point',flex:'Flex',toes:'Toes',tiptoe:'Tiptoe',rest:'Rest'})){
  await page.getByRole('button',{name:label,exact:true}).click();await settle(page);
  assert.equal(await page.evaluate(()=>footLab.getState().activePose),name);
  assert.equal(await page.evaluate(()=>footLab.calf.visible),true);
  if(shots){await page.getByRole('button',{name:'Side',exact:true}).click();await page.waitForTimeout(150);await page.screenshot({path:resolve(shots,'pose-'+name+'.png')});}
 }
 await page.getByRole('button',{name:'Play motion',exact:false}).click();const updates=await page.evaluate(()=>footLab.getState().poseUpdates);
 await page.waitForFunction(updates=>footLab.getState().poseUpdates>updates+2,updates);
 await page.getByRole('button',{name:'Pause motion',exact:false}).click();assert.equal(await page.evaluate(()=>footLab.getState().playing),false);
 await page.getByRole('button',{name:'Rest',exact:true}).click();await settle(page);
 for(const [id,value] of Object.entries({ankle:'-12',roll:'8',toes:'20',heel:'25'})){
  await page.locator('#'+id).fill(value);await settle(page);assert.equal(await page.evaluate(id=>footLab.rig.getState().pose[id],id),Number(value));
 }
 await page.getByRole('button',{name:'Rest',exact:true}).click();await settle(page);
 for(const name of ['Angle','Front','Side','Top','Sole']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(150);if(shots)await page.screenshot({path:resolve(shots,name.toLowerCase()+'.png')});}
 assert.equal(await page.evaluate(()=>footLab.ground.visible),false,'Floor hides the sole');
 if(shots){
  await page.evaluate(()=>{const {foot,calf,camera,controls}=footLab;foot.visible=false;controls.target.set(calf.position.x,.21,calf.position.z);camera.position.set(.38,.04,.55);controls.update();});
  await page.waitForTimeout(150);await page.screenshot({path:resolve(shots,'empty-socket.png')});await page.evaluate(()=>footLab.foot.visible=true);
 }
 await page.getByRole('button',{name:'Angle',exact:true}).click();await page.getByRole('button',{name:'Floor',exact:true}).click();assert.equal(await page.evaluate(()=>footLab.ground.visible),false);await page.getByRole('button',{name:'Floor',exact:true}).click();assert.equal(await page.evaluate(()=>footLab.ground.visible),true);
 const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await phoneContext.newPage();phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(base+'/foot-lab/');await phone.waitForFunction(()=>window.footLabReady);
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Phone overflow');
 for(const name of ['Angle','Side','Top','Sole']){
  await phone.getByRole('button',{name,exact:true}).click();await phone.waitForTimeout(150);
  const projected=await phone.evaluate(()=>{const {foot,calf,camera}=footLab,v=foot.position.clone();let minX=1,maxX=-1,minY=1,maxY=-1;for(const part of [foot,calf]){const p=part.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);part.localToWorld(v);v.project(camera);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}}return {minX,maxX,minY,maxY};});
  assert.ok(projected.minX>-.98&&projected.maxX<.98&&projected.minY>-.9&&projected.maxY<.9,'Phone view clips the foot: '+name+' '+JSON.stringify(projected));
  if(shots)await phone.screenshot({path:resolve(shots,'mobile-'+name.toLowerCase()+'.png')});
 }
 await phone.getByRole('button',{name:'Angle',exact:true}).click();const stage=await phone.locator('#stage').boundingBox(),cdp=await phoneContext.newCDPSession(phone),before=await phone.evaluate(()=>footLab.camera.position.toArray());
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:stage.width*.35,y:stage.y+stage.height*.45}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:stage.width*.35+i*12,y:stage.y+stage.height*.45}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.waitForTimeout(150);
 assert.ok(await phone.evaluate(before=>footLab.camera.position.toArray().some((v,i)=>Math.abs(v-before[i])>.01),before),'Phone orbit failed');
 await phone.getByRole('button',{name:'Tiptoe',exact:true}).click();await settle(phone);await phone.getByRole('button',{name:'Side',exact:true}).click();
 if(shots)await phone.screenshot({path:resolve(shots,'mobile-tiptoe.png')});
 await phone.locator('#heel').scrollIntoViewIfNeeded();const slider=await phone.locator('#heel').boundingBox(),sy=slider.y+slider.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:slider.x+slider.width-8,y:sy}]});
 for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:slider.x+slider.width-8-i*slider.width*.055,y:sy}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle(phone);
 const phoneHeel=await phone.evaluate(()=>footLab.getState().target.heel);assert.ok(phoneHeel>10&&phoneHeel<28,'Native phone heel slider failed');
 await phoneContext.close();
 await page.goto(base+'/hand-lab/');await page.waitForFunction(()=>window.handLabReady);
 await page.goto(base+'/dist/');await page.waitForFunction(()=>window.__game);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({size:foot.userData.size,bigToeLead:medial-lateral,socketDepth:SOCKET_DEPTH,socketClearance:SOCKET_CLEARANCE,measuredFit:[minFit,maxFit],minLipGap,minMovingGap,plantedError,heelHeight,exactRest:true,posesAndSliders:true,playPause:true,phoneHeel,centered:true,upperCalfPreserved:true,footShapeUnchanged:true,closedSocketCalf:true,closedSurface:true,soleFlat:true,soleVertices:foot.userData.soleVertices,vertices:p.count,approvedAvatarUnchanged:true,presetViews:true,mobileFraming:true,touchOrbit:true,handLabLoads:true,existingWorldLoads:true,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));g.dispose();foot.material.dispose();}
