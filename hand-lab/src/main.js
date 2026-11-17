import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createForearmHandAssembly} from '../../avatar/src/hand-study/assembly.js';
import {createHandRig,FINGERS,REST_POSE,POSES} from './hand-rig.js';

const stage=document.querySelector('#stage'),loading=document.querySelector('#loading');
async function start(){
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));stage.prepend(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#405363');
 const material=new T.MeshStandardMaterial({color:'#b9b2a6',roughness:.78,metalness:0});
 const {assembly,hand,forearm}=createForearmHandAssembly(material);
 assembly.remove(hand);forearm.geometry.dispose();material.dispose();
 const rig=createHandRig(hand);
 hand.name='approved-hand-in-lab';hand.position.set(0,0,0);hand.rotation.set(0,0,Math.PI);
 const display=new T.Group();display.add(hand);scene.add(display);
 display.updateMatrixWorld(true);const box=new T.Box3().setFromObject(hand);
 display.position.sub(box.getCenter(new T.Vector3()));
 const camera=new T.PerspectiveCamera(42,1,.01,10);camera.position.set(0,.015,.64);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.44;controls.maxDistance=1.6;controls.target.set(0,0,0);controls.update();
 scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
 const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,5);scene.add(key);
 const fill=new T.DirectionalLight(0xffffff,1.1);fill.position.set(4,1,-4);scene.add(fill);
 const low=new T.DirectionalLight(0xffffff,.65);low.position.set(-1,-3,4);scene.add(low);
 function resize(){const {width,height}=stage.getBoundingClientRect();camera.aspect=width/height;camera.fov=42;camera.updateProjectionMatrix();renderer.setSize(width,height);}
 new ResizeObserver(resize).observe(stage);resize();
 const current={...REST_POSE},target={...REST_POSE},poseLabel=document.querySelector('#pose-name');
 let playing=false,playStart=0,lastTime=0,lastPoseUpdate=0,activePose='rest',poseUpdates=0,needsPose=false;
 for(const finger of FINGERS){
  const row=document.createElement('div');row.className='finger-row';
  row.innerHTML=`<div class="finger-heading"><label for="${finger.id}">${finger.label}</label><output for="${finger.id}" id="${finger.id}-value">25%</output></div><input id="${finger.id}" type="range" min="0" max="100" step="1" value="25"><div class="axis-labels"><span>Open</span><span>Curled</span></div>`;
  document.querySelector('#finger-controls').append(row);
 }
 const sliders=Object.fromEntries(Object.keys(REST_POSE).map(id=>[id,document.getElementById(id)]));
 function refreshInputs(){for(const id of Object.keys(sliders)){sliders[id].value=Math.round(target[id]*100);document.getElementById(id+'-value').textContent=Math.round(target[id]*100)+'%';}}
 function markPose(name){activePose=name;for(const button of document.querySelectorAll('[data-pose]'))button.setAttribute('aria-pressed',String(button.dataset.pose===name));poseLabel.textContent=({rest:'Saved rest pose',open:'Open hand',curl:'Relaxed curl',point:'Pointing',custom:'Your pose',motion:'Motion test'})[name];}
 function stopMotion(){playing=false;document.querySelector('#play').setAttribute('aria-pressed','false');document.querySelector('#play').textContent='▶︎ Play motion';}
 for(const [id,input] of Object.entries(sliders))input.addEventListener('input',()=>{stopMotion();target[id]=Number(input.value)/100;markPose('custom');refreshInputs();});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function applyPose(name,immediate=false){stopMotion();Object.assign(target,POSES[name]);markPose(name);refreshInputs();if(immediate||reduced){Object.assign(current,target);rig.setPose(current);poseUpdates++;}}
 for(const button of document.querySelectorAll('[data-pose]'))button.onclick=()=>applyPose(button.dataset.pose);
 document.querySelector('#play').onclick=()=>{
  if(playing){stopMotion();markPose('custom');return;}
  playing=true;playStart=performance.now()/1000;markPose('motion');document.querySelector('#play').setAttribute('aria-pressed','true');document.querySelector('#play').textContent='Ⅱ Pause motion';
 };
 const views={palm:[0,.015,.64],side:[.64,.015,0],back:[0,.015,-.64]};
 for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{camera.position.set(...views[button.dataset.view]);controls.target.set(0,0,0);controls.update();for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b===button));};
 controls.addEventListener('start',()=>{for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
 const poseKeys=Object.keys(REST_POSE);
 renderer.setAnimationLoop(ms=>{
  const time=ms/1000,dt=Math.min(.1,lastTime?time-lastTime:1/60);lastTime=time;
  if(playing){
   const phase=(time-playStart)%12;
   if(phase<6){const v=.5-.5*Math.cos(phase/6*Math.PI*2);for(const d of FINGERS)target[d.id]=v*(d.id==='thumb'?.65:1);target.opposition=v*.3;}
   else{Object.assign(target,REST_POSE);const i=Math.min(4,Math.floor((phase-6)/1.2)),local=(phase-6)%1.2;target[FINGERS[i].id]=REST_POSE[FINGERS[i].id]+.65*Math.sin(local/1.2*Math.PI);}
   refreshInputs();
  }
  let dirty=false;const a=reduced&&!playing?1:1-Math.exp(-dt*12);
  for(const id of poseKeys){const delta=target[id]-current[id];if(Math.abs(delta)>.0002){current[id]+=delta*a;dirty=true;}else if(current[id]!==target[id]){current[id]=target[id];dirty=true;}}
  needsPose=needsPose||dirty;
  if(needsPose&&ms-lastPoseUpdate>=33){rig.setPose(current);lastPoseUpdate=ms;poseUpdates++;needsPose=false;}
  controls.update();renderer.render(scene,camera);
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMotion();markPose(activePose==='motion'?'custom':activePose);}lastTime=0;});
 window.handLab={scene,camera,controls,hand,rig,display,applyPose,getState:()=>({current:{...current},target:{...target},playing,poseUpdates,activePose})};
 loading.classList.add('hidden');window.handLabReady=true;
}
start().catch(error=>{console.error(error);loading.className='loading error';loading.textContent='The hand could not open. Please reload the page to try again.';});
