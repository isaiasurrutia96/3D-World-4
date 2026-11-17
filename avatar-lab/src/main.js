import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createAssembledAvatar} from './avatar.js';
import {createHandRig,FINGERS,REST_POSE as HAND_REST,POSES as HAND_POSES} from '../../hand-lab/src/hand-rig.js';
import {MOTIONS,REST_POSE as FOOT_REST,POSES as FOOT_POSES,motionPose} from '../../foot-lab/src/foot-rig.js';

const stage=document.querySelector('#stage'),loading=document.querySelector('#loading');
async function start(){
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const avatar=createAssembledAvatar(),{rig,handParts,lowerLegs}=avatar;
 // The saved hands share their geometry and mirror through their mounts.
 // One hand rig therefore drives both without changing either attachment.
 const handRig=createHandRig(handParts[1]);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(rig.root);
 const floor=new T.Mesh(new T.PlaneGeometry(12,12),new T.MeshStandardMaterial({color:'#405363',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;scene.add(floor);
 scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
 const key=new T.DirectionalLight(0xffffff,2.5);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-1.7,right:1.7,top:1.7,bottom:-1.7,near:.2,far:12});key.shadow.bias=-.0002;key.target.position.set(0,.9,0);scene.add(key,key.target);
 const fill=new T.DirectionalLight(0xffffff,1);fill.position.set(4,2,-3);scene.add(fill);
 const low=new T.DirectionalLight(0xffffff,.5);low.position.set(-2,-2,3);scene.add(low);
 const bounds=new T.Box3().setFromObject(rig.root),target=bounds.getCenter(new T.Vector3());target.y+=.04;
 const camera=new T.PerspectiveCamera(36,1,.01,30),controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.2;controls.maxDistance=8;controls.target.copy(target);
 const views={angle:[2.3,.85,4.0],front:[0,.1,4.4],side:[4.4,.1,0],back:[0,.1,-4.4],top:[0,4.4,.001]};
 function view(name){camera.position.copy(target).add(new T.Vector3(...views[name]));camera.up.set(0,1,0);controls.target.copy(target);controls.update();camera.updateMatrixWorld(true);for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));renderer.render(scene,camera);}
 for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>view(button.dataset.view);
 controls.addEventListener('start',()=>{for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
 function resize(){const {width,height}=stage.getBoundingClientRect();camera.aspect=width/height;camera.fov=camera.aspect<.7?44:36;camera.updateProjectionMatrix();renderer.setSize(width,height);}
 new ResizeObserver(resize).observe(stage);resize();view('angle');
 const state={hands:{current:{...HAND_REST},target:{...HAND_REST},pose:'rest'},feet:{current:{...FOOT_REST},target:{...FOOT_REST},pose:'rest'}},inputs={hands:{},feet:{}};
 const fields={hands:[...FINGERS.map(f=>({id:f.id,label:f.label,min:0,max:100,left:'Open',right:'Curled'})),{id:'together',label:'Fingers together',min:0,max:100,left:'Spread',right:'Together'},{id:'opposition',label:'Thumb across palm',min:0,max:100,left:'Beside hand',right:'Across palm'}],feet:MOTIONS};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,play=document.querySelector('#play');
 let playing=false,playStart=0,lastTime=0,lastUpdate=0,updates=0,activeTab='feet';
 const pending={hands:false,feet:false};
 function tab(name){activeTab=name;for(const kind of ['hands','feet']){document.querySelector('#'+kind+'-panel').hidden=kind!==name;document.querySelector('#'+kind+'-tab').setAttribute('aria-selected',String(kind===name));}}
 for(const name of ['hands','feet'])document.querySelector('#'+name+'-tab').onclick=()=>tab(name);
 function refresh(kind){
  const s=state[kind],scale=kind==='hands'?100:1;
  for(const [id,input] of Object.entries(inputs[kind])){input.value=Math.round(s.target[id]*scale);document.getElementById(kind+'-'+id+'-value').textContent=Math.round(s.target[id]*scale)+(kind==='hands'?'%':'°');}
  for(const b of document.querySelectorAll(kind==='hands'?'[data-hand-pose]':'[data-foot-pose]'))b.setAttribute('aria-pressed',String((kind==='hands'?b.dataset.handPose:b.dataset.footPose)===s.pose));
 }
 function stop(){playing=false;play.textContent='Play motion';play.setAttribute('aria-pressed','false');}
 function update(kind){if(kind==='hands')handRig.setPose(state.hands.current);else avatar.setFootPose(state.feet.current);updates++;pending[kind]=false;}
 function applyPose(kind,name,immediate=false){
  stop();const s=state[kind];Object.assign(s.target,(kind==='hands'?HAND_POSES:FOOT_POSES)[name]);s.pose=name;refresh(kind);
  if(immediate||reduced){Object.assign(s.current,s.target);update(kind);}
 }
 function restAll(immediate=false){applyPose('hands','rest',immediate);applyPose('feet','rest',immediate);}
 for(const kind of ['hands','feet']){
  const parent=document.querySelector(kind==='hands'?'#hand-controls':'#foot-controls');
  for(const field of fields[kind]){
   const id=kind+'-'+field.id,row=document.createElement('div');row.className='motion-row';
   row.innerHTML=`<div class="motion-heading"><label for="${id}">${field.label}</label><output id="${id}-value" for="${id}"></output></div><input id="${id}" type="range" min="${field.min}" max="${field.max}" step="1"><div class="axis-labels"><span>${field.left}</span><span>${field.right}</span></div>`;
   parent.append(row);const input=row.querySelector('input');inputs[kind][field.id]=input;
   input.oninput=()=>{stop();state[kind].target[field.id]=Number(input.value)/(kind==='hands'?100:1);state[kind].pose='custom';refresh(kind);};
  }
  refresh(kind);
 }
 for(const b of document.querySelectorAll('[data-hand-pose]'))b.onclick=()=>applyPose('hands',b.dataset.handPose);
 for(const b of document.querySelectorAll('[data-foot-pose]'))b.onclick=()=>applyPose('feet',b.dataset.footPose);
 document.querySelector('#rest-all').onclick=()=>restAll();
 play.onclick=()=>{if(playing){stop();for(const kind of ['hands','feet'])Object.assign(state[kind].target,state[kind].current);}else{playing=true;playStart=performance.now()/1000;play.textContent='Pause motion';play.setAttribute('aria-pressed','true');}};
 renderer.setAnimationLoop(ms=>{
  const time=ms/1000,dt=Math.min(.1,lastTime?time-lastTime:1/60);lastTime=time;
  if(playing){
   const elapsed=time-playStart,v=.5-.5*Math.cos(elapsed/4*Math.PI*2);
   Object.assign(state.hands.target,HAND_REST);for(const finger of FINGERS)state.hands.target[finger.id]=.25+v*(finger.id==='thumb'?.35:.65);state.hands.target.opposition=v*.25;
   state.hands.target.together=v*.6;
   Object.assign(state.feet.target,motionPose(elapsed));state.hands.pose=state.feet.pose='motion';refresh('hands');refresh('feet');
  }
  const a=reduced&&!playing?1:1-Math.exp(-dt*12);
  for(const kind of ['hands','feet']){
   const s=state[kind],threshold=kind==='hands'?.0002:.005;
   for(const id of Object.keys(s.current)){const d=s.target[id]-s.current[id];if(Math.abs(d)>threshold){s.current[id]+=d*a;pending[kind]=true;}else if(s.current[id]!==s.target[id]){s.current[id]=s.target[id];pending[kind]=true;}}
  }
  if(ms-lastUpdate>=50){for(const kind of ['hands','feet'])if(pending[kind])update(kind);lastUpdate=ms;}
  controls.update();renderer.render(scene,camera);
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop();lastTime=0;});
 window.avatarLab={...avatar,handRig,scene,camera,controls,view,tab,restAll,applyHandPose:(name,immediate)=>applyPose('hands',name,immediate),applyFootPose:(name,immediate)=>applyPose('feet',name,immediate),getState:()=>({hands:structuredClone(state.hands),feet:structuredClone(state.feet),playing,updates,activeTab})};
 loading.hidden=true;window.avatarLabReady=true;
}
start().catch(error=>{console.error(error);loading.textContent='The avatar could not open. Please reload to try again.';});
