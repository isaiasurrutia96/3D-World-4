import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import * as T from 'three';
import {createApprovedAvatar} from '../../avatar/src/approved-avatar.js';
import {createAssembledAvatar} from '../src/avatar.js';
import {POSES,BEND_END} from '../../foot-lab/src/foot-rig.js';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const hash=array=>createHash('sha256').update(new Uint8Array(array.buffer,array.byteOffset,array.byteLength)).digest('hex');
const meshes=o=>{const result=[];o.traverse(x=>{if(x.isMesh)result.push(x);});return result;};
const original=createApprovedAvatar(),assembled=createAssembledAvatar();
const replaced=new Set([original.rig.kneeLeft.children[0],original.rig.kneeRight.children[0],original.rig.ankleLeft.children[0],original.rig.ankleRight.children[0]]);
const newParts=new Set(assembled.lowerLegs.flatMap(l=>[l.foot,l.calf]));
const signature=(m,root)=>{
 const ancestors=[];for(let o=m;o&&o!==root;o=o.parent)ancestors.push([o.position.toArray(),o.rotation.toArray(),o.scale.toArray()]);
 return {position:hash(m.geometry.attributes.position.array),normal:hash(m.geometry.attributes.normal.array),index:hash(m.geometry.index.array),color:m.material.color.getHex(),ancestors};
};
const oldUpper=meshes(original.rig.root).filter(m=>!replaced.has(m)),newUpper=meshes(assembled.rig.root).filter(m=>!newParts.has(m));
assert.equal(oldUpper.length,11);assert.equal(newUpper.length,11);assert.equal(meshes(assembled.rig.root).length,15,'Extra body/joint meshes were added');
assert.deepEqual(newUpper.map(m=>signature(m,assembled.rig.root)),oldUpper.map(m=>signature(m,original.rig.root)),'Saved upper body, arms or hands changed');
const initialBody=assembled.rig.body.position.clone();
const initial=assembled.lowerLegs.map(l=>({foot:l.foot.geometry.attributes.position.array.slice(),calf:l.calf.geometry.attributes.position.array.slice(),normals:l.calf.geometry.attributes.normal.array.slice()}));
const standingHeight=new T.Box3().setFromObject(assembled.rig.root).getSize(new T.Vector3()).y;
let maxKneeError=0,maxPlantedError=0;
for(const [name,pose] of Object.entries({...POSES,combined:{ankle:24,roll:10,toes:25,heel:30}})){
 assembled.setFootPose(pose);
 for(const [legIndex,leg] of assembled.lowerLegs.entries()){
  const {calf,foot,side}=leg,knee=side===1?assembled.rig.kneeRight:assembled.rig.kneeLeft;
  const contact=calf.localToWorld(new T.Vector3(0,calf.geometry.boundingBox.max.y,0));
  const error=contact.distanceTo(knee.localToWorld(new T.Vector3(0,.035,0)));maxKneeError=Math.max(maxKneeError,error);
  assert.ok(error<1e-7,'Knee separated during '+name);
  assert.ok(Math.abs(new T.Box3().setFromObject(foot).min.y)<1e-7,'Assembled foot lost floor contact during '+name);
  const p=calf.geometry.attributes.position,baseline=initial[legIndex];
  for(let i=0;i<p.count;i++)if(baseline.calf[i*3+1]>=calf.geometry.userData.joinY-1e-7){for(let axis=0;axis<3;axis++)assert.equal(p.array[i*3+axis],baseline.calf[i*3+axis],'Calf body bends');}
  if(name==='tiptoe'){
   const fp=foot.geometry.attributes.position,v=new T.Vector3(),before=new T.Vector3();
   for(let i=0;i<fp.count;i++)if(baseline.foot[i*3+1]<1e-7&&baseline.foot[i*3+2]>BEND_END){
    v.fromBufferAttribute(fp,i);foot.localToWorld(v);before.fromArray(baseline.foot,i*3).applyMatrix4(leg.mount.matrixWorld);
    maxPlantedError=Math.max(maxPlantedError,v.distanceTo(before));
   }
  }
 }
}
assert.ok(maxPlantedError<1e-6,'Assembled Tiptoe slides the front sole');
assembled.setFootPose(POSES.rest);assert.deepEqual(assembled.rig.body.position,initialBody);
for(const [i,leg] of assembled.lowerLegs.entries()){
 assert.deepEqual(leg.foot.geometry.attributes.position.array,initial[i].foot);assert.deepEqual(leg.calf.geometry.attributes.position.array,initial[i].calf);assert.deepEqual(leg.calf.geometry.attributes.normal.array,initial[i].normals);
 const seat=leg.calf.geometry.userData;
 assert.ok(leg.calf.localToWorld(new T.Vector3(...seat.socketSeatCenter)).distanceTo(leg.foot.localToWorld(new T.Vector3(...seat.footSeatCenter)))<1e-8,'Socket is off-center');
}
const [left,right]=assembled.lowerLegs,lp=left.foot.geometry.attributes.position,rp=right.foot.geometry.attributes.position;
for(let i=0;i<lp.count;i+=37){const a=left.foot.localToWorld(new T.Vector3().fromBufferAttribute(lp,i)),b=right.foot.localToWorld(new T.Vector3().fromBufferAttribute(rp,i));assert.ok(Math.hypot(a.x+b.x,a.y-b.y,a.z-b.z)<1e-8,'Feet are not mirrored');}
const approval=JSON.parse(await readFile(resolve(root,'avatar/APPROVED.json'),'utf8'));
for(const [name,digest] of Object.entries(approval.sha256))assert.equal(createHash('sha256').update(await readFile(resolve(root,'avatar',name))).digest('hex'),digest,'Saved avatar file changed: '+name);
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const shots=process.env.AVATAR_LAB_SHOTS;if(shots)await mkdir(shots,{recursive:true});const errors=[];
async function settle(page){await page.waitForFunction(()=>{const s=avatarLab.getState(),hp=avatarLab.handRig.getPose(),fp=avatarLab.lowerLegs[0].motion.getState().pose;return ['hands','feet'].every(kind=>Object.keys(s[kind].target).every(k=>s[kind].target[k]===s[kind].current[k]&&Math.abs((kind==='hands'?hp:fp)[k]-s[kind].target[k])<1e-8));},undefined,{timeout:60000});}
async function fingerprints(page){return page.evaluate(async()=>{
 const sha=async array=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',array.buffer.slice(array.byteOffset,array.byteOffset+array.byteLength)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const parts=[...avatarLab.handParts,...avatarLab.lowerLegs.flatMap(l=>[l.foot,l.calf])];return Promise.all(parts.map(async m=>({position:await sha(m.geometry.attributes.position.array),normal:await sha(m.geometry.attributes.normal.array)})));
});}
async function framing(page){return page.evaluate(()=>{
 const {rig,camera}=avatarLab;rig.root.updateMatrixWorld(true);camera.updateMatrixWorld(true);let minX=1,maxX=-1,minY=1,maxY=-1;const v=rig.root.position.clone();
 rig.root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);o.localToWorld(v);v.project(camera);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}});return {minX,maxX,minY,maxY};
});}
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/avatar-lab/');await page.waitForFunction(()=>window.avatarLabReady,undefined,{timeout:60000});
 const baseline=await fingerprints(page);
 assert.deepEqual(baseline.slice(0,2).map(h=>h.position),[hash(assembled.handParts[0].geometry.attributes.position.array),hash(assembled.handParts[1].geometry.attributes.position.array)],'Initial hands differ from saved avatar');
 if(shots)await page.screenshot({path:resolve(shots,'assembled-angle.png')});
 await page.getByRole('tab',{name:'Hands',exact:true}).click();
 for(const name of ['Relax','Open','Curl','Point']){
  await page.locator('#hands-panel').getByRole('button',{name,exact:true}).click();await settle(page);
  const posed=await fingerprints(page);assert.notEqual(posed[0].position,baseline[0].position);assert.equal(posed[0].position,posed[1].position,'Hands are out of sync');
  assert.equal(await page.evaluate(()=>{const {handRig,handParts}=avatarLab,p=handParts[1].geometry.attributes.position.array;return handRig.protectedVertices.some(i=>[0,1,2].some(d=>p[i*3+d]!==handRig.approvedPositions[i*3+d]));}),false,'Hand leaves wrist seat');
  if(name==='Curl'&&shots)await page.screenshot({path:resolve(shots,'hands-curl.png')});
 }
 await page.getByRole('button',{name:'Rest all',exact:true}).click();await settle(page);assert.deepEqual(await fingerprints(page),baseline,'Rest all does not restore saved shapes');
 await page.locator('#hands-index').fill('70');await settle(page);assert.equal(await page.evaluate(()=>avatarLab.handRig.getPose().index),.7);
 await page.getByRole('button',{name:'Rest all',exact:true}).click();await settle(page);
 await page.getByRole('tab',{name:'Feet',exact:true}).click();
 for(const name of ['Point','Flex','Toes','Tiptoe']){
  await page.locator('#feet-panel').getByRole('button',{name,exact:true}).click();await settle(page);
  assert.equal(await page.evaluate(()=>avatarLab.getState().feet.pose),name.toLowerCase());
  if(name==='Tiptoe'&&shots){await page.getByRole('button',{name:'Side',exact:true}).click();await page.screenshot({path:resolve(shots,'full-tiptoe.png')});}
 }
 await page.getByRole('button',{name:'Rest all',exact:true}).click();await settle(page);assert.deepEqual(await fingerprints(page),baseline);
 await page.getByRole('button',{name:'Play motion',exact:true}).click();const before=await page.evaluate(()=>avatarLab.getState().updates);await page.waitForFunction(before=>avatarLab.getState().updates>before+6,before,{timeout:60000});
 assert.equal(await page.evaluate(()=>avatarLab.getState().playing),true);await page.getByRole('button',{name:'Pause motion',exact:true}).click();assert.equal(await page.evaluate(()=>avatarLab.getState().playing),false);
 await page.getByRole('button',{name:'Rest all',exact:true}).click();await settle(page);
 for(const name of ['Front','Side','Back','Top','Angle']){await page.getByRole('button',{name,exact:true}).click();if(shots)await page.screenshot({path:resolve(shots,'view-'+name.toLowerCase()+'.png')});}
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base+'/avatar-lab/');await phone.waitForFunction(()=>window.avatarLabReady,undefined,{timeout:60000});
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Phone overflows');
 for(const name of ['Angle','Front','Side','Back','Top']){
  await phone.getByRole('button',{name,exact:true}).click();const box=await framing(phone);assert.ok(box.minX>-.98&&box.maxX<.98&&box.minY>-.82&&box.maxY<.92,'Mobile avatar clipped: '+name+JSON.stringify(box));
 }
 await phone.getByRole('button',{name:'Angle',exact:true}).click();if(shots)await phone.screenshot({path:resolve(shots,'mobile-assembled.png')});
 await phone.getByRole('tab',{name:'Hands',exact:true}).click();await phone.locator('#hands-panel').getByRole('button',{name:'Curl',exact:true}).click();await settle(phone);
 await phone.getByRole('tab',{name:'Feet',exact:true}).click();await phone.locator('#feet-panel').getByRole('button',{name:'Tiptoe',exact:true}).click();await settle(phone);await phone.getByRole('button',{name:'Side',exact:true}).click();
 const tiptoeFrame=await framing(phone);assert.ok(tiptoeFrame.minY>-.82&&tiptoeFrame.maxY<.92,'Mobile Tiptoe clipped');if(shots)await phone.screenshot({path:resolve(shots,'mobile-motion.png')});
 const cdp=await mobile.newCDPSession(phone);await phone.locator('#feet-heel').scrollIntoViewIfNeeded();const slider=await phone.locator('#feet-heel').boundingBox(),y=slider.y+slider.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:slider.x+slider.width-8,y}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:slider.x+slider.width-8-i*slider.width*.055,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle(phone);
 const phoneHeel=await phone.evaluate(()=>avatarLab.getState().feet.target.heel);assert.ok(phoneHeel>10&&phoneHeel<28,'Native mobile slider failed');
 const stage=await phone.locator('#stage').boundingBox(),cameraBefore=await phone.evaluate(()=>avatarLab.camera.position.toArray()),x=stage.width*.35,sy=stage.y+stage.height*.45;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:sy}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*12,y:sy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok(await phone.evaluate(before=>avatarLab.camera.position.toArray().some((v,i)=>Math.abs(v-before[i])>.01),cameraBefore),'Mobile orbit failed');
 await phone.getByRole('button',{name:'Rest all',exact:true}).click();await settle(phone);assert.deepEqual(await fingerprints(phone),baseline,'Mobile Rest changed shapes');await mobile.close();
 for(const [path,ready] of [['/hand-lab/','handLabReady'],['/foot-lab/','footLabReady'],['/dist/','__game']]){await page.goto(base+path);await page.waitForFunction(ready=>Boolean(window[ready]),ready,{timeout:60000});}
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({meshCount:15,savedUpperMeshesPreserved:11,standingHeight,maxKneeError,maxPlantedError,mirroredFeet:true,rigidCalves:true,handAndFootMotion:true,protectedPalms:true,exactRest:true,playPause:true,mobileViews:true,mobileOrbit:true,phoneHeel,savedCheckpointUnchanged:true,existingPagesLoad:true,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
