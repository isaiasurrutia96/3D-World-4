import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const approval=JSON.parse(await readFile(resolve(root,'avatar/APPROVED.json'),'utf8'));
for(const [name,hash] of Object.entries(approval.sha256)){
 assert.equal(createHash('sha256').update(await readFile(resolve(root,'avatar',name))).digest('hex'),hash,`Approved file changed: ${name}`);
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';
  const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');
  res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const shots=process.env.HAND_LAB_SHOTS;if(shots)await mkdir(shots,{recursive:true});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>errors.push(e.message));
 const fingerprint=selector=>page.evaluate(async selector=>{
  const h=selector==='approved'?viewer.handParts[1]:handLab.hand;
  const sha=async array=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',array.buffer.slice(array.byteOffset,array.byteOffset+array.byteLength)))).map(n=>n.toString(16).padStart(2,'0')).join('');
  return {positions:await sha(h.geometry.attributes.position.array),normals:await sha(h.geometry.attributes.normal.array),index:await sha(h.geometry.index.array),scale:h.scale.x,color:h.material.color.getHexString()};
 },selector);
 assert.equal((await page.goto(base+'/avatar/index.html')).status(),200);await page.waitForFunction(()=>window.ready);
 const approved=await fingerprint('approved');
 assert.equal((await page.goto(base+'/hand-lab/')).status(),200);await page.waitForFunction(()=>window.handLabReady,undefined,{timeout:60000});
 const initial=await fingerprint('lab');assert.deepEqual(initial,approved,'Lab must start with the exact approved hand');
 if(shots)await page.screenshot({path:resolve(shots,'rest.png')});
 const settle=async()=>{await page.waitForFunction(()=>{const {current,target}=handLab.getState();return Object.keys(target).every(id=>Math.abs(current[id]-target[id])<1e-8);});await page.waitForTimeout(80);};
 for(const name of ['Relax','Open','Curl','Point']){
  await page.getByRole('button',{name,exact:true}).click();await settle();
  const check=await page.evaluate(()=>{
   const {hand,rig}=handLab,p=hand.geometry.attributes.position.array,n=hand.geometry.attributes.normal.array;let protectedChanges=0;
   for(const i of rig.protectedVertices)for(let d=0;d<3;d++)if(p[i*3+d]!==rig.approvedPositions[i*3+d])protectedChanges++;
   return {finite:[...p,...n].every(Number.isFinite),protectedChanges};
  });
  assert.equal(check.finite,true,name+' produced invalid geometry');assert.equal(check.protectedChanges,0,name+' moved the palm attachment');assert.notEqual((await fingerprint('lab')).positions,initial.positions,name+' must visibly move');
  if(shots)await page.screenshot({path:resolve(shots,name.toLowerCase()+'.png')});
  if(name==='Relax'){
   const spacing=await page.evaluate(()=>{
    const {rig,hand}=handLab,p=hand.geometry.attributes.position.array;
    const centres=values=>rig.fingerTipVertices.map(ids=>{const c=[0,0,0];for(const i of ids)for(let d=0;d<3;d++)c[d]+=values[i*3+d]/ids.length;return c;});
    const gaps=c=>c.slice(0,3).map((v,i)=>Math.hypot(...v.map((x,d)=>x-c[i+1][d])));
    let depthChanges=0;for(let i=2;i<p.length;i+=3)if(p[i]!==rig.approvedPositions[i])depthChanges++;
    return {before:gaps(centres(rig.approvedPositions)),after:gaps(centres(p)),depthChanges,target:handLab.getState().target};
   });
   assert.ok(spacing.before.every((gap,i)=>spacing.after[i]<gap),'Relax must bring every neighbouring pair closer');
   assert.equal(spacing.depthChanges,0,'Relax must preserve the existing curl depth');
   for(const id of ['index','middle','ring','little','thumb'])assert.equal(spacing.target[id],.25,'Relax changed the resting curl');
   console.log(JSON.stringify({relaxSpacing:spacing}));
  }
  if(name==='Curl'){await page.getByRole('button',{name:'Side',exact:true}).click();if(shots)await page.screenshot({path:resolve(shots,'curl-side.png')});await page.getByRole('button',{name:'Palm',exact:true}).click();}
 }
 await page.getByRole('button',{name:'Rest',exact:true}).click();await settle();assert.deepEqual(await fingerprint('lab'),initial,'Rest must restore geometry and normals exactly');
 for(const id of ['index','middle','ring','little','thumb','opposition','together']){
  const input=page.locator('#'+id);await input.evaluate(e=>{e.value='75';e.dispatchEvent(new Event('input',{bubbles:true}));});await settle();assert.equal(await page.evaluate(id=>handLab.getState().target[id],id),.75);
  assert.notEqual((await fingerprint('lab')).positions,initial.positions,id+' control did not move the hand');
  if(id==='opposition'&&shots)await page.screenshot({path:resolve(shots,'thumb-across.png')});
  await page.getByRole('button',{name:'Rest',exact:true}).click();await settle();assert.deepEqual(await fingerprint('lab'),initial);
 }
 await page.getByRole('button',{name:'Play motion',exact:false}).click();const before=await page.evaluate(()=>handLab.getState().poseUpdates);await page.waitForTimeout(600);assert.ok(await page.evaluate(before=>handLab.getState().poseUpdates>before,before),'Motion test did not animate');
 await page.getByRole('button',{name:'Pause motion',exact:false}).click();assert.equal(await page.evaluate(()=>handLab.getState().playing),false);
 const stress=await page.evaluate(()=>{
  const start=performance.now();let finite=true;
  for(let i=0;i<12;i++){handLab.rig.setPose({index:i%3/2,middle:(i+1)%3/2,ring:(i+2)%3/2,little:i%2,thumb:(i+1)%2,opposition:i%2});finite=finite&&handLab.hand.geometry.attributes.position.array.every(Number.isFinite);}
  handLab.applyPose('rest',true);return {finite,averageUpdateMs:(performance.now()-start)/12};
 });
 assert.equal(stress.finite,true);assert.deepEqual(await fingerprint('lab'),initial,'Repeated motion accumulated shape changes');
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(base+'/hand-lab/?pose=relax');await phone.waitForFunction(()=>window.handLabReady,undefined,{timeout:60000});
 assert.equal(await phone.evaluate(()=>handLab.getState().target.together),.8,'Relax preview link did not select the new motion');
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile horizontal overflow');
 const box=await phone.locator('#stage').boundingBox(),cdp=await mobile.newCDPSession(phone),cameraBefore=await phone.evaluate(()=>handLab.camera.position.toArray());
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.35,y:box.y+box.height*.5}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.35+i*12,y:box.y+box.height*.5}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.waitForTimeout(250);
 assert.ok(await phone.evaluate(a=>handLab.camera.position.toArray().some((v,i)=>Math.abs(v-a[i])>.01),cameraBefore),'Phone orbit failed');
 await phone.locator('#opposition').scrollIntoViewIfNeeded();const slider=await phone.locator('#opposition').boundingBox();await phone.touchscreen.tap(slider.x+slider.width*.7,slider.y+slider.height*.5);assert.ok(await phone.evaluate(()=>handLab.getState().target.opposition>.3),'Phone thumb slider failed');
 await phone.getByRole('button',{name:'Rest',exact:true}).click();await phone.waitForTimeout(900);
 if(shots)await phone.screenshot({path:resolve(shots,'mobile.png')});
 await mobile.close();
 await page.goto(base+'/dist/');await page.waitForFunction(()=>window.__game,undefined,{timeout:60000});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({approvedHandExact:true,palmFixed:true,restRestoresExactly:true,allFingerControls:true,thumbOpposition:true,motionTest:true,mobileOrbit:true,mobileSlider:true,existingWorldLoads:true,...stress,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
