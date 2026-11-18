import {protectPage} from './interactions.js?v=toggle-8';
protectPage(window);
const $=selector=>document.querySelector(selector);
const tests={
 avatar:{name:'Avatar',path:'avatar-test',ready:w=>w.avatarLabReady},
 tracks:{name:'Tracks',path:'racing-lab',ready:w=>w.trackLabReady&&w.motionLabReady,tracks:true},
 skeleton:{name:'Skeleton',path:'skeleton-test',ready:w=>w.skeletonTestReady},
 rules:{name:'Movement rules',path:'motion-core-test',ready:w=>w.rulesTestReady,move:true},
 hands:{name:'Hands',path:'hand-lab',ready:w=>w.handLabReady},
 feet:{name:'Feet',path:'foot-lab',ready:w=>w.footLabReady},
 blocks:{name:'Blocks',path:'lab'},oval:{name:'Oval track',path:'oval'},island:{name:'Floating island',path:'island'},
 motion:{name:'Motion study',path:'motion-lab',ready:w=>!!w.motionLab,move:true},
};
const controls=$('#live-controls'),host=$('#frame-host'),loading=$('#loading');
let subject='avatar',mode='live',view='angle',frame=null,clock=null,syncControls=()=>{},generation=0,stageVisible=true,ready=false,inspection=false;
let motionOpen=false,syncMotion=()=>{},resetMotion=()=>{};

function setMotionOpen(open){
 const next=Boolean(open&&!$('#motion-toggle').disabled);if(motionOpen&&!next){resetMotion();syncControls();syncMotion();}motionOpen=next;$('#motion-panel').hidden=!motionOpen;$('#viewer').classList.toggle('motion-open',motionOpen);$('#motion-toggle').setAttribute('aria-expanded',String(motionOpen));
}
function buildMotionControls(doc){
 const groups=(subject==='avatar'?[{name:'Hands',tab:doc.querySelector('#hands-tab'),selector:'[data-hand-pose]'},{name:'Feet',tab:doc.querySelector('#feet-tab'),selector:'[data-foot-pose]'}]:['hands','feet'].includes(subject)?[{name:subject==='hands'?'Hands':'Feet',selector:'[data-pose]'}]:[]).filter(group=>doc.querySelector(group.selector));
 const extra=[...doc.querySelectorAll('aside button')].filter(button=>!button.matches('[data-view],#hands-tab,#feet-tab,#play,#rest-all')&&!groups.some(group=>button.matches(group.selector)));
 if(extra.length)groups.push({name:groups.length?'More':'Controls',buttons:extra});
 $('#motion-toggle').disabled=!groups.length;$('#motion-tabs').replaceChildren();$('#motion-presets').replaceChildren();syncMotion=()=>{};resetMotion=()=>{};
 if(!groups.length){setMotionOpen(false);return;}
 let current=null,copies=[];
 function show(group){
  current=group;$('#motion-presets').setAttribute('aria-label',group.name+' poses');$('#motion-presets').replaceChildren();copies=[];
  const presets=group.buttons||[...doc.querySelectorAll(group.selector)],rest=presets.find(button=>(button.dataset.handPose||button.dataset.footPose||button.dataset.pose)==='rest');
  for(const native of presets){const button=document.createElement('button'),pose=native.dataset.handPose||native.dataset.footPose||native.dataset.pose;button.textContent=native.textContent;if(pose)button.dataset.motionPose=pose;button.onclick=()=>{if(pose&&rest&&native.getAttribute('aria-pressed')==='true')rest.click();else native.click();syncControls();syncMotion();};$('#motion-presets').append(button);copies.push({native,button});}
 }
 for(const group of groups){const button=document.createElement('button');button.textContent=group.name;button.setAttribute('role','tab');button.onclick=()=>{group.tab?.click();show(group);syncControls();syncMotion();};group.button=button;$('#motion-tabs').append(button);}
 const play=doc.querySelector('#play'),restAll=doc.querySelector('#rest-all');resetMotion=()=>{if(restAll)restAll.click();else doc.querySelector('[data-pose="rest"]')?.click();};$('#motion-play').hidden=!play;$('#motion-play').onclick=()=>{if(play?.getAttribute('aria-pressed')==='true')resetMotion();else play?.click();syncControls();syncMotion();};
 syncMotion=()=>{const active=current&&!current.tab?current:groups.find(group=>group.tab?.getAttribute('aria-selected')==='true')||groups[0];if(current!==active)show(active);for(const group of groups)group.button.setAttribute('aria-selected',String(group===current));for(const {native,button} of copies){button.textContent=native.textContent;button.disabled=native.disabled;button.hidden=native.hidden;button.setAttribute('aria-pressed',native.getAttribute('aria-pressed')||'false');}if(play){const playing=play.getAttribute('aria-pressed')==='true';$('#motion-play').textContent=playing?'Stop motion':'Play motion';$('#motion-play').setAttribute('aria-pressed',String(playing));}};syncMotion();
}

// Each live test keeps its existing model and controls. Pause its frame clock
// while the viewer is off screen, so the video panel does not run two scenes.
function frameClock(w){
 const request=w.requestAnimationFrame.bind(w),cancel=w.cancelAnimationFrame.bind(w),pending=new Map();let active=true,next=-1;
 w.requestAnimationFrame=callback=>{if(active)return request(callback);const id=next--;pending.set(id,callback);return id;};
 w.cancelAnimationFrame=id=>{if(id<0)pending.delete(id);else cancel(id);};
 return {setActive(value){if(active===value)return;active=value;if(!active){w.dispatchEvent(new w.Event('blur'));return;}w.dispatchEvent(new w.Event('focus'));const callbacks=[...pending.values()];pending.clear();callbacks.forEach(callback=>request(callback));},get active(){return active;}};
}
function mirrorControls(doc){
 if(tests[subject].tracks){
  controls.replaceChildren();const native=doc.querySelector('#race-track'),label=document.createElement('label'),select=native.cloneNode(true);select.id='driving-track';select.setAttribute('aria-label','Choose a track');label.textContent='Choose a track';label.append(select);controls.append(label);
  select.onchange=()=>{native.value=select.value;native.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));setView('angle');};syncControls=()=>{select.value=native.value;};return;
 }
 const source=doc.querySelector('aside');controls.replaceChildren();syncControls=()=>{};
 if(!source)return;
 controls.innerHTML=source.innerHTML;
 const original=[...source.querySelectorAll('button,input,output,section')],copies=[...controls.querySelectorAll('button,input,output,section')];
 copies.forEach((copy,i)=>{const native=original[i];if(copy.tagName==='BUTTON')copy.onclick=()=>{native.click();syncControls();};if(copy.tagName==='INPUT')copy.oninput=()=>{native.value=copy.value;native.dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true}));syncControls();};});
 syncControls=()=>copies.forEach((copy,i)=>{const native=original[i];for(const name of ['aria-pressed','aria-selected'])if(native.hasAttribute(name))copy.setAttribute(name,native.getAttribute(name));if(copy.tagName==='INPUT'&&document.activeElement!==copy)copy.value=native.value;if(copy.tagName==='OUTPUT'||copy.tagName==='BUTTON')copy.textContent=native.textContent;copy.hidden=native.hidden;});syncControls();
}
async function setTest(id){
 setMotionOpen(false);$('#motion-toggle').disabled=true;syncMotion=()=>{};
 if(!tests[id])return;subject=id;ready=false;window.testLabReady=false;const token=++generation;clock=null;syncControls=()=>{};controls.replaceChildren();loading.hidden=false;loading.textContent='Preparing '+tests[id].name.toLowerCase()+'…';$('#subject').value=id;$('#subject-status').textContent=tests[id].name;
 const url=new URL(location.href);if(id==='avatar')url.searchParams.delete('test');else url.searchParams.set('test',id);history.replaceState(null,'',url);
 const node=document.createElement('iframe');node.title=tests[id].name+' live test';node.allow='fullscreen';node.src='../'+tests[id].path+'/?lab=universal-18';frame=node;host.replaceChildren(node);
 node.onload=async()=>{
  try{
   const w=node.contentWindow,doc=w.document,style=doc.createElement('style');style.textContent='html,body,body>main{height:100%!important;overflow:hidden!important;background:#405363!important}.app{display:block!important;height:100%!important}body>header,.app>header,nav.views,.stage-hint,.hint,.other-test,#status,aside,.floor-toggle,#test-videos{display:none!important}#stage{height:100%!important;width:100%!important;min-height:0!important}.race-hud{display:grid!important;top:64px!important}';doc.head.append(style);
   protectPage(w);
   const start=performance.now();while(!w.testLabScene||!(tests[id].ready?tests[id].ready(w):doc.querySelector('canvas'))){if(token!==generation)return;if(performance.now()-start>30000)throw Error('Test did not load');await new Promise(r=>setTimeout(r,40));}
   if(token!==generation)return;clock=frameClock(w);mirrorControls(doc);buildMotionControls(doc);
   $('#visual-mode').disabled=Boolean(tests[id].tracks);setInspection(inspection);
   $('#live-help').textContent=tests[id].tracks?'Choose a track, then drag to orbit and pinch to zoom. This section shows the track only.':tests[id].move?'Left side: move · Right side: look around. Use a light joystick push to slow the motion.':'Drag the model to look around. Use the view buttons for a fixed angle.';
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
function setMode(next){mode=next;for(const id of ['live','video']){$('#'+id+'-tab').setAttribute('aria-selected',String(id===mode));$('#'+id+'-panel').hidden=id!==mode;}}
$('#subject').onchange=e=>setTest(e.target.value);$('#reset').onclick=()=>{if(tests[subject].tracks&&ready){frame.contentWindow.motionLab.reset();setView('angle');}else setTest(subject);};
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
$('#visual-mode').onclick=()=>setInspection(!inspection);
$('#motion-toggle').onclick=()=>setMotionOpen(!motionOpen);
$('#motion-close').onclick=()=>{setMotionOpen(false);$('#motion-toggle').focus();};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&motionOpen){setMotionOpen(false);$('#motion-toggle').focus();}});
for(const id of ['live','video'])$('#'+id+'-tab').onclick=()=>setMode(id);
$('#return-to-viewer').onclick=()=>$('#viewer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
new ResizeObserver(()=>{const height=$('#motion-panel').getBoundingClientRect().height;if(height>0)document.documentElement.style.setProperty('--motion-panel-height',Math.ceil(height)+'px');}).observe($('#motion-panel'));
new IntersectionObserver(entries=>{stageVisible=entries[0].intersectionRatio>.5;clock?.setActive(!document.hidden&&stageVisible);},{threshold:[0,.5]}).observe($('#viewer'));
document.addEventListener('visibilitychange',()=>clock?.setActive(!document.hidden&&stageVisible));
setInterval(()=>{if(ready&&!document.hidden){syncControls();syncMotion();}},150);
window.testLab={setTest,setView,setMode,setInspection,setMotionOpen,getState:()=>({subject,mode,view,inspection,motionOpen,ready,active:clock?.active??false}),get frame(){return frame;}};
const initial=new URLSearchParams(location.search).get('test');setTest(initial==='driving'?'tracks':tests[initial]?initial:'avatar');
