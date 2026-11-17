import {installTestLabScene} from '../../src/test-lab-scene.ts';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createFootShape} from './foot-shape.js';
import {createCalf} from './calf.js';
import {createFootRig,MOTIONS,REST_POSE,POSES,motionPose} from './foot-rig.js';

const stage=document.querySelector('#stage'),loading=document.querySelector('#loading');
try{
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#405363');
 const foot=createFootShape(),calf=createCalf(foot),rig=createFootRig(foot,calf);scene.add(rig.group);
 const ground=new T.Mesh(new T.PlaneGeometry(20,20),new T.MeshStandardMaterial({color:'#405363',roughness:1,metalness:0}));
 ground.name='inspection-floor';ground.rotation.x=-Math.PI/2;ground.position.set(0,-.001,.09);ground.receiveShadow=true;scene.add(ground);
 scene.add(new T.HemisphereLight(0xffffff,0xa8a89c,1.9));
 const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-.6,1.4,.8);key.target.position.set(0,.12,.09);key.castShadow=true;
 key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-.8;key.shadow.camera.right=.8;key.shadow.camera.top=.8;key.shadow.camera.bottom=-.8;key.shadow.camera.near=.1;key.shadow.camera.far=3;key.shadow.bias=-.0002;key.shadow.normalBias=.001;
 scene.add(key,key.target);
 const fill=new T.DirectionalLight(0xffffff,.9);fill.position.set(.8,.4,-.7);scene.add(fill);
 const lower=new T.DirectionalLight(0xffffff,.8);lower.position.set(-.3,-1,.4);scene.add(lower);
 const cameraTarget=new T.Vector3(0,.34,.09),camera=new T.PerspectiveCamera(38,1,.01,10);
 const views={angle:[1.0,.6,1.1],front:[0,.16,1.7],side:[1.7,.16,0],top:[0,1.7,.001],sole:[0,-1.7,.001]};
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.63;controls.maxDistance=2.7;controls.target.copy(cameraTarget);
 let currentView='angle',floorVisible=true;
 function view(name){currentView=name;camera.up.set(0,1,0);camera.position.copy(cameraTarget).add(new T.Vector3(...views[name]));controls.target.copy(cameraTarget);controls.update();ground.visible=floorVisible&&name!=='sole';for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));camera.updateMatrixWorld(true);renderer.render(scene,camera);}
 for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>view(button.dataset.view);
 document.querySelector('#floor').onclick=()=>{floorVisible=!floorVisible;ground.visible=floorVisible&&currentView!=='sole';document.querySelector('#floor').setAttribute('aria-pressed',String(floorVisible));};
 controls.addEventListener('start',()=>{for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
 function resize(){const {width,height}=stage.getBoundingClientRect();camera.aspect=width/height;camera.fov=camera.aspect<.7?52:38;camera.updateProjectionMatrix();renderer.setSize(width,height);}
 new ResizeObserver(resize).observe(stage);resize();view('angle');
 const current={...REST_POSE},target={...REST_POSE},inputs={},play=document.querySelector('#play'),poseLabel=document.querySelector('#pose-name');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let playing=false,playStart=0,lastTime=0,lastPoseUpdate=0,activePose='rest',poseUpdates=0,needsPose=false;
 for(const motion of MOTIONS){
  const row=document.createElement('div');row.className='motion-row';
  row.innerHTML=`<div class="motion-heading"><label for="${motion.id}">${motion.label}</label><output for="${motion.id}" id="${motion.id}-value">0°</output></div><input id="${motion.id}" type="range" min="${motion.min}" max="${motion.max}" step="1" value="0"><div class="axis-labels"><span>${motion.left}</span><span>${motion.right}</span></div>`;
  document.querySelector('#motion-controls').append(row);inputs[motion.id]=row.querySelector('input');
 }
 function refreshInputs(){for(const {id} of MOTIONS){inputs[id].value=Math.round(target[id]);document.getElementById(id+'-value').textContent=Math.round(target[id])+'°';}}
 function markPose(name){activePose=name;for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed',String(b.dataset.pose===name));poseLabel.textContent=({rest:'Fitted rest pose',point:'Point the foot',flex:'Flex the ankle',toes:'Bend at the ball of the foot',tiptoe:'Rise onto the front of the foot',custom:'Your pose',motion:'Foot motion test'})[name];}
 function stopMotion(){playing=false;play.setAttribute('aria-pressed','false');play.textContent='Play motion';}
 function applyPose(name,immediate=false){stopMotion();Object.assign(target,POSES[name]);markPose(name);refreshInputs();if(immediate||reduced){Object.assign(current,target);rig.setPose(current);poseUpdates++;needsPose=false;}}
 for(const button of document.querySelectorAll('[data-pose]'))button.onclick=()=>applyPose(button.dataset.pose);
 for(const {id} of MOTIONS)inputs[id].oninput=()=>{stopMotion();target[id]=Number(inputs[id].value);markPose('custom');refreshInputs();};
 play.onclick=()=>{if(playing){stopMotion();markPose('custom');}else{playing=true;playStart=performance.now()/1000;markPose('motion');play.setAttribute('aria-pressed','true');play.textContent='Pause motion';}};
 renderer.setAnimationLoop(ms=>{
  const time=ms/1000,dt=Math.min(.1,lastTime?time-lastTime:1/60);lastTime=time;
  if(playing){Object.assign(target,motionPose(time-playStart));refreshInputs();}
  let dirty=false;const a=reduced&&!playing?1:1-Math.exp(-dt*12);
  for(const {id} of MOTIONS){const delta=target[id]-current[id];if(Math.abs(delta)>.005){current[id]+=delta*a;dirty=true;}else if(current[id]!==target[id]){current[id]=target[id];dirty=true;}}
  needsPose=needsPose||dirty;
  if(needsPose&&ms-lastPoseUpdate>=33){rig.setPose(current);lastPoseUpdate=ms;poseUpdates++;needsPose=false;}
  controls.update();renderer.render(scene,camera);
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stopMotion();markPose('custom');}lastTime=0;});
 window.footLab={foot,calf,rig,scene,camera,controls,ground,view,applyPose,getState:()=>({current:{...current},target:{...target},playing,poseUpdates,activePose})};
 const requestedPose=new URLSearchParams(location.search).get('pose');if(requestedPose&&POSES[requestedPose])applyPose(requestedPose);
 installTestLabScene({scene,camera,renderer,floors:[ground],getTarget:()=>controls.target,updateControls:()=>controls.update()});
 window.footLabReady=true;loading.hidden=true;
}catch(error){console.error(error);loading.textContent='The foot could not open. Please reload to try again.';}
