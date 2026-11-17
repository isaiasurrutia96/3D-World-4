import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(path)]||'application/octet-stream');res.end(await readFile(resolve('dist','.'+path)));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));await mkdir('public/test-lab/media',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
function ffmpeg(args){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
try{
 for(const gait of ['walk','run']){
  const folder='/tmp/test-lab-video/'+gait;await mkdir(folder,{recursive:true});const page=await browser.newPage({viewport:{width:640,height:800}});
  await page.goto(`http://127.0.0.1:${server.address().port}/${gait}-test/?lab=universal-3`);await page.waitForFunction(()=>window.walkTestReady||window.runTestReady,undefined,{timeout:60000});
  await page.addStyleTag({content:'header,#status,#joystick,.other-test,#loading{display:none!important}'});
  const cycle=await page.evaluate(()=>{const m=movement,p=m.player;m.renderer.setAnimationLoop(null);p.speed=p.maxSpeed;p.intentAmount=1;p.activity=1;m.camera.fov=36;m.camera.aspect=.8;m.camera.position.set(-4.6,1.02,0);m.camera.up.set(0,1,0);m.camera.lookAt(0,1.02,0);m.camera.updateProjectionMatrix();return p.cycle;});
  for(let f=0;f<77;f++){await page.evaluate(f=>{const m=movement,p=m.player;p.phase=f/77;p.anchor=null;p.plantKey=null;p.position.set(0,0,0);p.pendingTravel=0;p.pose(1/60);m.renderer.render(m.scene,m.camera);},f);await page.locator('canvas').first().screenshot({path:folder+'/'+String(f).padStart(3,'0')+'.png'});}
  ffmpeg(['-loop','1','-framerate',String(77/cycle),'-i',folder+'/%03d.png','-t',String(cycle*3),'-r','60','-c:v','libx264','-threads','2','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart','public/test-lab/media/'+gait+'.mp4']);
  ffmpeg(['-i',folder+'/019.png','-frames:v','1','-q:v','2','public/test-lab/media/'+gait+'.jpg']);await page.close();console.log('Saved '+gait+' animation');
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
