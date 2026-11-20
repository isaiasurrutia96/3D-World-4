import{chromium}from'playwright';
import{createServer}from'node:http';
import{readFile,writeFile}from'node:fs/promises';
import{resolve,extname}from'node:path';
import assert from'node:assert/strict';
import{createHash}from'node:crypto';
// BASELINE_HTML is an optional captured pre-fix production bundle, not a
// second implementation. Without it, all current-version checks still run.
const baseline=process.env.BASELINE_HTML;
const server=createServer(async(q,r)=>{try{let path=new URL(q.url,'http://local').pathname;if(path.endsWith('/'))path+='index.html';r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'})[extname(path)]||'application/octet-stream');r.end(await readFile(path==='/baseline/index.html'&&baseline?baseline:resolve('dist','.'+path)));}catch{r.statusCode=404;r.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),base=`http://127.0.0.1:${server.address().port}`,rows=[],errors=[];
async function fixture(version,mode){
 const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
 if(mode==='early-pointer'||mode==='early-all')await page.addInitScript(mode=>{
  window.__maskRelease=true;window.__releaseBlock=e=>{if(window.__maskRelease&&e.target.closest?.('#race-right'))e.stopImmediatePropagation();};
  for(const name of mode==='early-all'?['pointerup','lostpointercapture','touchend','touchcancel']:['pointerup','lostpointercapture'])window.addEventListener(name,window.__releaseBlock,true);
 },mode);
 await page.goto(base+(version==='before'?'/baseline/':'/racing-lab/')+'?drive=1&track=winding');await page.waitForFunction(()=>window.drivingLabReady&&window.motionLabReady);
 await page.evaluate(()=>{motionLab.renderer.setAnimationLoop(null);motionLab.input.reset();motionLab.input.focused=true;});
 if(mode==='late-all')await page.evaluate(()=>{
  window.__releaseBlock=e=>{if(e.target.closest?.('#race-right'))e.stopImmediatePropagation();};for(const name of['pointerup','lostpointercapture','touchend','touchcancel'])window.addEventListener(name,window.__releaseBlock,true);
 });
 const cdp=await page.context().newCDPSession(page);
 const contact=async(name,id)=>{const b=await page.locator('#race-'+name).boundingBox();return{id,x:b.x+b.width/2,y:b.y+b.height/2};};
 return{page,cdp,contact};
}
try{
 for(const mode of['early-pointer','late-all'])for(const version of baseline?['before','after']:['after']){
  const{page,cdp,contact}=await fixture(version,mode);const gas=await contact('gas',1),right=await contact('right',2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,right]});await page.waitForFunction(()=>motionLab.input.actions.gas&&motionLab.input.actions.right);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[right]});
  const measured=await page.evaluate(()=>({right:motionLab.input.actions.right,gas:motionLab.input.actions.gas}));
  assert.equal(measured.gas,true,JSON.stringify({version,mode,measured}));assert.equal(measured.right,version==='before',JSON.stringify({version,mode,measured}));
  rows.push({rule:version==='before'?'The captured old version reproduces stuck Right after an interrupted release.':'The updated version clears Right while preserving the separate Gas finger.',input:{version,track:'winding',mode,script:mode==='early-pointer'?'Interrupt pointer release/capture-loss before app handlers; let native touchend through.':'Interrupt target delivery after window capture handlers.'},expected:{right:version==='before',gas:true},measured,status:'PASS'});
  await page.close();
 }
 for(const version of baseline?['before','after']:['after']){
  const{page,cdp,contact}=await fixture(version,'early-all'),right=await contact('right',20);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right]});await page.waitForFunction(()=>motionLab.input.actions.right);
  // Make enough scrollable content to exercise the real stage-pause observer.
  await page.evaluate(()=>{document.querySelector('#test-videos').style.minHeight='120vh';scrollTo(0,document.body.scrollHeight);});
  await page.waitForFunction(()=>!motionLab.getState().active&&!motionLab.input.enabled);assert.equal(await page.evaluate(()=>motionLab.input.actions.right),false);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.evaluate(()=>{window.__maskRelease=false;scrollTo(0,0);});await page.waitForFunction(()=>motionLab.getState().active&&motionLab.input.enabled);
  const fresh=await contact('right',21);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[fresh]});await page.waitForFunction(()=>motionLab.input.actions.right);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const measured=await page.evaluate(()=>({right:motionLab.input.actions.right,active:motionLab.getState().active}));assert.equal(measured.right,version==='before');
  rows.push({rule:version==='before'?'The captured old private hold survives pause/reset and returns after another tap.':'The updated stage pause clears private holds before the next tap.',input:{version,script:'Hold Right, scroll stage out of view, interrupt its end events, return, tap/release Right again.'},expected:{right:version==='before',active:true},measured,status:'PASS'});await page.close();
 }
 const{page,cdp,contact}=await fixture('after','none');
 const gas=await contact('gas',30),right=await contact('right',31);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas]});
 for(let i=0;i<150;i++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gas,{...right,id:31+i}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...right,id:31+i}]});
  const s=await page.evaluate(()=>({right:motionLab.input.actions.right,gas:motionLab.input.actions.gas}));assert.equal(s.right,false);assert.equal(s.gas,true);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const afterTaps=await page.evaluate(()=>({right:motionLab.input.actions.right,gas:motionLab.input.actions.gas}));assert.deepEqual(afterTaps,{right:false,gas:false});
 rows.push({rule:'Rapid repeated native touches never retain Right or lose the separate Gas finger.',input:{track:'winding',taps:150,script:'Gas held;150 Right tap/release cycles through native CDP touch events.'},expected:{right:false,gas:false},measured:afterTaps,status:'PASS'});
 // End-to-end recovery: the same real button release must reach the checked
 // controller. This preserves a real slide rather than wiping momentum.
 await page.evaluate(()=>{drivingLab.test.controller.reset({x:0,y:100,z:0,grounded:false});motionLab.input.reset();motionLab.input.focused=true;motionLab.tick(0);});
 const left=await contact('left',501);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left]});
 await page.evaluate(()=>{for(let i=0;i<30;i++)motionLab.tick(1/60);});assert(await page.evaluate(()=>drivingLab.test.controller.state.handling.steerInput<-.9));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.evaluate(()=>{for(let i=0;i<60;i++)motionLab.tick(1/60);});
 const released=await page.evaluate(()=>({left:motionLab.input.actions.left,steering:drivingLab.test.controller.state.steering,filteredInput:drivingLab.test.controller.state.handling.steerInput,yawRate:drivingLab.test.controller.state.handling.yawRate}));assert.equal(released.left,false);assert.equal(released.steering,0);assert.equal(released.filteredInput,0);assert.equal(released.yawRate,0);
 rows.push({rule:'Native button release reaches filtered steering without a stuck command.',input:'Hold Left for30manual60Hz frames and release60frames; isolated airborne pose keeps track contacts out of this input check.',expected:{left:false,steering:0,filteredInput:0,yawRate:0},measured:released,status:'PASS'});
 await page.close();assert.deepEqual(errors,[]);
 const currentSHA256=createHash('sha256').update(await readFile('dist/racing-lab/index.html')).digest('hex'),baselineSHA256=baseline?createHash('sha256').update(await readFile(baseline)).digest('hex'):null;
 await writeFile('racing-lab/STEERING-RELEASE-BROWSER-CHECKS.json',JSON.stringify({passed:true,baselineCompared:Boolean(baseline),baselineSHA256,currentSHA256,checks:rows,pageErrors:errors},null,2)+'\n');
 for(const r of rows)console.log('PASS: '+r.rule+' '+JSON.stringify(r.input));
}finally{await browser.close();server.close();}
