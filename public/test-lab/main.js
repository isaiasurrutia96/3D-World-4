import {protectPage} from './interactions.js?v=clip-6';
protectPage(window);
const $=selector=>document.querySelector(selector);
const tests={
 avatar:{name:'Avatar',path:'avatar-test',ready:w=>w.avatarLabReady},
 walk:{name:'Walking',path:'walk-test',ready:w=>w.walkTestReady,move:true},
 run:{name:'Running',path:'run-test',ready:w=>w.runTestReady,move:true},
 hands:{name:'Hands',path:'hand-lab',ready:w=>w.handLabReady},
 feet:{name:'Feet',path:'foot-lab',ready:w=>w.footLabReady},
 blocks:{name:'Blocks',path:'lab'},oval:{name:'Oval track',path:'oval'},island:{name:'Floating island',path:'island'},
 motion:{name:'Motion study',path:'motion-lab',ready:w=>!!w.motionLab,move:true},
};
const clips={walk:{src:'./media/walk.mp4?v=appearance-3',poster:'./media/walk.jpg?v=appearance-3'},run:{src:'./media/run.mp4?v=appearance-3',poster:'./media/run.jpg?v=appearance-3'},comparison:{src:'../references/motion-compare/side.mp4?v=run-grip-1',poster:'../references/motion-compare/side-poster.jpg?v=run-grip-1'}};
const controls=$('#live-controls'),host=$('#frame-host'),loading=$('#loading'),video=$('#animation-video');
let subject='avatar',mode='live',view='angle',frame=null,clock=null,syncControls=()=>{},generation=0,stageVisible=true,ready=false,videoRate=1,inspection=false;

// Each live test keeps its existing model and controls. Pause its frame clock
// while the viewer is off screen, so the video panel does not run two scenes.
function frameClock(w){
 const request=w.requestAnimationFrame.bind(w),cancel=w.cancelAnimationFrame.bind(w),pending=new Map();let active=true,next=-1;
 w.requestAnimationFrame=callback=>{if(active)return request(callback);const id=next--;pending.set(id,callback);return id;};
 w.cancelAnimationFrame=id=>{if(id<0)pending.delete(id);else cancel(id);};
 return {setActive(value){if(active===value)return;active=value;if(!active){w.dispatchEvent(new w.Event('blur'));return;}const callbacks=[...pending.values()];pending.clear();callbacks.forEach(callback=>request(callback));},get active(){return active;}};
}
function mirrorControls(doc){
 const source=doc.querySelector('aside');controls.replaceChildren();syncControls=()=>{};
 if(!source)return;
 controls.innerHTML=source.innerHTML;
 const original=[...source.querySelectorAll('button,input,output,section')],copies=[...controls.querySelectorAll('button,input,output,section')];
 copies.forEach((copy,i)=>{const native=original[i];if(copy.tagName==='BUTTON')copy.onclick=()=>{native.click();syncControls();};if(copy.tagName==='INPUT')copy.oninput=()=>{native.value=copy.value;native.dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true}));syncControls();};});
 syncControls=()=>copies.forEach((copy,i)=>{const native=original[i];for(const name of ['aria-pressed','aria-selected'])if(native.hasAttribute(name))copy.setAttribute(name,native.getAttribute(name));if(copy.tagName==='INPUT'&&document.activeElement!==copy)copy.value=native.value;if(copy.tagName==='OUTPUT'||copy.tagName==='BUTTON')copy.textContent=native.textContent;copy.hidden=native.hidden;});syncControls();
}
async function setTest(id){
 if(!tests[id])return;subject=id;ready=false;window.testLabReady=false;const token=++generation;clock=null;syncControls=()=>{};controls.replaceChildren();loading.hidden=false;loading.textContent='Preparing '+tests[id].name.toLowerCase()+'…';$('#subject').value=id;$('#subject-status').textContent=tests[id].name;
 const url=new URL(location.href);if(id==='avatar')url.searchParams.delete('test');else url.searchParams.set('test',id);history.replaceState(null,'',url);
 if(id==='walk'||id==='run')$('#clip').value=id;
 const node=document.createElement('iframe');node.title=tests[id].name+' live test';node.allow='fullscreen';node.src='../'+tests[id].path+'/?lab=universal-6';frame=node;host.replaceChildren(node);
 node.onload=async()=>{
  try{
   const w=node.contentWindow,doc=w.document,style=doc.createElement('style');style.textContent='html,body{height:100%!important;overflow:hidden!important;background:#405363!important}.app{display:block!important;height:100%!important}body>header,.app>header,nav.views,.stage-hint,.hint,.other-test,#status,aside,.floor-toggle{display:none!important}#stage{height:100%!important;width:100%!important;min-height:0!important}';doc.head.append(style);
   protectPage(w);
   const start=performance.now();while(!w.testLabScene||!(tests[id].ready?tests[id].ready(w):doc.querySelector('canvas'))){if(token!==generation)return;if(performance.now()-start>30000)throw Error('Test did not load');await new Promise(r=>setTimeout(r,40));}
   if(token!==generation)return;clock=frameClock(w);mirrorControls(doc);
   setInspection(inspection);
   $('#live-help').textContent=tests[id].move?'Left side: move · Right side: look around. Use a light joystick push to slow the motion.':'Drag the model to look around. Use the view buttons for a fixed angle.';
   doc.querySelector('canvas')?.addEventListener('pointerdown',event=>{if(w.testLabScene.getState().isometric)return;if(!tests[id].move||event.clientX>w.innerWidth/2)for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
   setView('angle');clock.setActive(stageVisible);loading.hidden=true;ready=true;window.testLabReady=true;
  }catch(error){if(token===generation){loading.textContent='This test could not open. Choose Reset to try again.';console.error(error);}}
 };
}
function setView(name){
 if(!frame||!tests[subject])return;const w=frame.contentWindow,doc=w.document;view=name;
 for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===name));
 w.testLabScene?.setIsometric(name==='isometric');
 if(name==='isometric'){
  if(w.movement)w.movement.setCamera(Math.PI/4,Math.atan(1/Math.sqrt(2)),4.5);
  else if(w.motionLab?.setCamera)w.motionLab.setCamera(Math.PI/4,Math.atan(1/Math.sqrt(2)));
  return;
 }
 const aliases=name==='angle'?['angle','angled']:name==='front'&&subject==='hands'?['palm','front']:[name];let native;
 for(const key of aliases){native=doc.querySelector('[data-view="'+key+'"]');if(native)break;}
 if(native){native.click();return;}
 const movement=w.movement;
 if(movement){const facing=movement.player.facing||0,views={front:[0,.04],side:[Math.PI/2,.10],back:[Math.PI,.16],top:[Math.PI,Math.PI/2],angle:[Math.PI*.78,.35]},[yaw,pitch]=views[name];movement.setCamera(facing+yaw,pitch,4.5);return;}
 const api=w.avatarLab||w.handLab||w.footLab,controls=api?.controls,camera=api?.camera;if(!controls||!camera)return;
 const target=controls.target,d=camera.position.distanceTo(target),offset={front:[0,0,d],side:[d,0,0],back:[0,0,-d],top:[0,d,.001],angle:[d*.6,d*.3,d*.8]}[name];camera.position.copy(target);camera.position.x+=offset[0];camera.position.y+=offset[1];camera.position.z+=offset[2];controls.update();
}
function setInspection(enabled){inspection=enabled;frame?.contentWindow.testLabScene?.setFloorVisible(!inspection);$('#visual-mode').setAttribute('aria-pressed',String(inspection));$('#visual-mode').title=inspection?'Show the grey floor':'Hide the floor for a clear inspection';}
function setMode(next){mode=next;for(const id of ['live','video']){$('#'+id+'-tab').setAttribute('aria-selected',String(id===mode));$('#'+id+'-panel').hidden=id!==mode;}if(mode==='live')video.pause();else{if(!video.getAttribute('src')||!video.getAttribute('src').includes($('#clip').value==='comparison'?'motion-compare':$('#clip').value+'.mp4'))loadClip($('#clip').value);video.play().catch(()=>{});}}
function loadClip(id){const clip=clips[id];video.pause();video.src=clip.src;video.poster=clip.poster;video.defaultPlaybackRate=videoRate;video.playbackRate=videoRate;video.load();$('#download-video').href=clip.src;if(mode==='video')video.play().catch(()=>{});}
function setRate(rate){videoRate=rate;video.defaultPlaybackRate=rate;video.playbackRate=rate;for(const b of document.querySelectorAll('[data-rate]'))b.setAttribute('aria-pressed',String(Number(b.dataset.rate)===rate));}
video.addEventListener('loadedmetadata',()=>{video.playbackRate=videoRate;});
$('#subject').onchange=e=>setTest(e.target.value);$('#reset').onclick=()=>setTest(subject);
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
$('#visual-mode').onclick=()=>setInspection(!inspection);
for(const id of ['live','video'])$('#'+id+'-tab').onclick=()=>setMode(id);
for(const b of document.querySelectorAll('[data-rate]'))b.onclick=()=>setRate(Number(b.dataset.rate));
$('#clip').onchange=e=>loadClip(e.target.value);$('#return-to-viewer').onclick=()=>$('#viewer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
new IntersectionObserver(entries=>{stageVisible=entries[0].intersectionRatio>.5;clock?.setActive(!document.hidden&&stageVisible);},{threshold:[0,.5]}).observe($('#viewer'));
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();}).observe(video);
document.addEventListener('visibilitychange',()=>clock?.setActive(!document.hidden&&stageVisible));
setInterval(()=>{if(ready&&!document.hidden)syncControls();},150);
window.testLab={setTest,setView,setMode,setRate,loadClip,setInspection,getState:()=>({subject,mode,view,inspection,ready,active:clock?.active??false}),get frame(){return frame;}};
const initial=new URLSearchParams(location.search).get('test');setTest(tests[initial]?initial:'avatar');
