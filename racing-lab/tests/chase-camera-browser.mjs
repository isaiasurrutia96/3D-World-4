import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {createTrack} from '../../racing-core/track/index.ts';
import {KART} from '../../racing-core/kart/index.ts';
import {DRIVING_PROFILES,MPH} from '../../racing-core/kart/profiles.ts';
const server=createServer(async(q,r)=>{try{let path=new URL(q.url,'http://local').pathname;if(path.endsWith('/'))path+='index.html';r.setHeader('Content-Type',({'.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png'})[extname(path)]||'application/octet-stream');r.end(await readFile(resolve('dist','.'+path)));}catch{r.statusCode=404;r.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),track=createTrack('original'),errors=[],rows=[];
try{
 for(const viewport of [{width:844,height:390},{width:390,height:844}]){
  const page=await browser.newPage({viewport,isMobile:true,hasTouch:true});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/racing-lab/?drive=1`);await page.waitForFunction(()=>window.drivingLabReady&&window.motionLabReady);
  // Replay road poses through the actual page camera. Physics is checked independently
  // in the Node test; disabling scheduled renders makes these display-rate inputs exact.
  await page.evaluate(()=>{motionLab.renderer.setAnimationLoop(null);motionLab.input.reset();motionLab.input.focused=true;window.renderReplayFrame=motionLab.renderer.render.bind(motionLab.renderer);motionLab.renderer.render=()=>{};});
  for(const cruiseSpeed of [KART.boostSpeed,DRIVING_PROFILES.fast.boostSpeed]) for(const fps of [30,60,120,144]){
   const frames=[];for(let distance=1300;distance<=1450;distance+=cruiseSpeed/fps){const sample=track.sample(distance);frames.push({...sample.point,yaw:Math.atan2(sample.forward.x,sample.forward.z)});}
   const result=await page.evaluate(({frames,fps})=>{
    drivingLab.test.controller.reset(frames[0]);motionLab.tick(0);motionLab.view('back');let minimumClearance=Infinity,minimumCameraDistance=Infinity;
    for(const pose of frames){drivingLab.test.controller.reset(pose);motionLab.tick(1/fps);const state=motionLab.controller.state,target=motionLab.getState().camera.target;minimumClearance=Math.min(minimumClearance,target[1]-state.y);minimumCameraDistance=Math.min(minimumCameraDistance,motionLab.camera.position.distanceTo(motionLab.marker.position));}
    renderReplayFrame(motionLab.scene,motionLab.camera);
    const gl=motionLab.renderer.getContext(),pixels=new Uint8Array(32*32*4);gl.readPixels(Math.floor(gl.drawingBufferWidth/2)-16,Math.floor(gl.drawingBufferHeight/2)-16,32,32,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    let nonBackgroundPixels=0;for(let i=0;i<pixels.length;i+=4)if(Math.abs(pixels[i]-64)+Math.abs(pixels[i+1]-83)+Math.abs(pixels[i+2]-99)>20)nonBackgroundPixels++;
    const projected=motionLab.marker.position.clone();projected.y+=.6;projected.project(motionLab.camera);
    const contextLost=gl.isContextLost(),glError=gl.getError();motionLab.view('fpv');motionLab.tick(0);drivingLab.kart.root.updateMatrixWorld(true);
    const expected=drivingLab.kart.root.localToWorld(motionLab.camera.position.clone().set(0,1.32,-.78)),fpvEyeError=expected.distanceTo(motionLab.camera.position);motionLab.view('back');
    return {minimumClearance,minimumCameraDistance,nonBackgroundPixels,projected:projected.toArray(),contextLost,glError,fpvEyeError};
   },{frames,fps});
   assert(Math.abs(result.minimumClearance-1)<1e-8,JSON.stringify(result));assert(result.minimumCameraDistance>10,JSON.stringify(result));assert(result.nonBackgroundPixels>100);assert(!result.contextLost&&result.glError===0);assert(Math.abs(result.projected[0])<.8&&Math.abs(result.projected[1])<.8);assert(result.fpvEyeError<1e-8);
   rows.push({viewport,fps,mph:cruiseSpeed/MPH,...result});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile('racing-lab/CHASE-CAMERA-BROWSER-CHECKS.json',JSON.stringify({passed:true,script:'Replay the original bridge approach at 180 and 220 mph through the actual page camera at four rates, in portrait and landscape; render/read pixels, check kart framing, WebGL and FPV eye.',rows,pageErrors:errors},null,2)+'\n');
 console.log('PASS: bridge approach at 180/220 mph stays framed at 30/60/120/144 FPS in portrait and landscape; no camera collapse, blank render, page/WebGL errors or FPV changes.');
}finally{await browser.close();server.close();}
