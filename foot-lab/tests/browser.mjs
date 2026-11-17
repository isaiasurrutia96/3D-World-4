import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {createFootShape,FOOT_SIZE} from '../src/foot-shape.js';
import {createCalf,CALF_GAP} from '../src/calf.js';
import {createCharacterRig} from '../../avatar/src/reference/PlayerModel.ts';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url))),foot=createFootShape();
const g=foot.geometry,p=g.attributes.position,size=g.boundingBox.getSize(foot.position.clone());
assert.ok([size.x-FOOT_SIZE.width,size.y-FOOT_SIZE.height].every(d=>Math.abs(d)<1e-6),'Foot width or height changed');
assert.ok(size.z>FOOT_SIZE.length&&size.z<FOOT_SIZE.length+.0221,'Toe extension is not slight');
const baseline=createFootShape(undefined,{toeExtension:0}),bp=baseline.geometry.attributes.position;
assert.equal(bp.count,p.count);let medial=-Infinity,lateral=-Infinity;
for(let i=0;i<p.count;i++){
 assert.equal(p.getX(i),bp.getX(i));assert.equal(p.getY(i),bp.getY(i));
 if(bp.getZ(i)<=.18)assert.equal(p.getZ(i),bp.getZ(i),'Heel or midfoot changed');
 if(p.getX(i)<-.025)medial=Math.max(medial,p.getZ(i));if(p.getX(i)>.025)lateral=Math.max(lateral,p.getZ(i));
}
assert.ok(medial-lateral>.004&&medial-lateral<.016,'Front has no subtle big-toe asymmetry');
const calf=createCalf(foot),calfReference=createCharacterRig({plain:true}).kneeRight.children[0];
assert.deepEqual(calf.geometry.attributes.position.array,calfReference.geometry.attributes.position.array,'Calf shape changed');
assert.equal(calf.material.color.getHex(),foot.material.color.getHex());
assert.ok(Math.abs(calf.position.y+calf.geometry.boundingBox.min.y-g.boundingBox.max.y-CALF_GAP)<1e-7,'Calf is connected or gap is wrong');
assert.equal(calf.userData.socket,false);
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
const server=createServer(async(req,res)=>{
 try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Invalid path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const shots=process.env.FOOT_LAB_SHOTS;if(shots)await mkdir(shots,{recursive:true});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>errors.push(e.message));
 assert.equal((await page.goto(base+'/foot-lab/')).status(),200);await page.waitForFunction(()=>window.footLabReady);
 for(const name of ['Angle','Front','Side','Top','Sole']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(150);if(shots)await page.screenshot({path:resolve(shots,name.toLowerCase()+'.png')});}
 assert.equal(await page.evaluate(()=>footLab.ground.visible),false,'Floor hides the sole');
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
 await phoneContext.close();
 await page.goto(base+'/hand-lab/');await page.waitForFunction(()=>window.handLabReady);
 await page.goto(base+'/dist/');await page.waitForFunction(()=>window.__game);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({size:foot.userData.size,bigToeLead:medial-lateral,calfGap:CALF_GAP,calfShapeUnchanged:true,noSocket:true,closedSurface:true,soleFlat:true,soleVertices:foot.userData.soleVertices,vertices:p.count,approvedAvatarUnchanged:true,presetViews:true,mobileFraming:true,touchOrbit:true,handLabLoads:true,existingWorldLoads:true,errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));g.dispose();foot.material.dispose();}
