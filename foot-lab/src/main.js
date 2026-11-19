import {installTestLabScene} from '../../src/test-lab-scene.ts';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createFootStudy} from './foot-study.js';

const stage=document.querySelector('#stage'),loading=document.querySelector('#loading');
try{
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#405363');
 const study=createFootStudy(),{foot,calf}=study;scene.add(study.group);
 const ground=new T.Mesh(new T.PlaneGeometry(20,20),new T.MeshStandardMaterial({color:'#405363',roughness:1,metalness:0}));
 ground.name='inspection-floor';ground.rotation.x=-Math.PI/2;ground.position.set(0,-.001,.09);ground.receiveShadow=true;scene.add(ground);
 scene.add(new T.HemisphereLight(0xffffff,0xa8a89c,1.9));
 const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-.6,1.4,.8);key.target.position.set(0,.12,.09);key.castShadow=true;
 key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-.8;key.shadow.camera.right=.8;key.shadow.camera.top=.8;key.shadow.camera.bottom=-.8;key.shadow.camera.near=.1;key.shadow.camera.far=3;key.shadow.bias=-.0002;key.shadow.normalBias=.001;
 scene.add(key,key.target);
 const fill=new T.DirectionalLight(0xffffff,.9);fill.position.set(.8,.4,-.7);scene.add(fill);
 const lower=new T.DirectionalLight(0xffffff,.8);lower.position.set(-.3,-1,.4);scene.add(lower);
 const cameraTarget=new T.Box3().setFromObject(study.group).getCenter(new T.Vector3()),camera=new T.PerspectiveCamera(38,1,.01,10);
 const views={angle:[1.0,.6,1.1],front:[0,.16,1.7],side:[1.7,.16,0],top:[0,1.7,.001],sole:[0,-1.7,.001]};
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.63;controls.maxDistance=2.7;controls.target.copy(cameraTarget);
 let currentView='angle',floorVisible=true;
 function view(name){currentView=name;camera.up.set(0,1,0);const size=new T.Box3().setFromObject(study.group).getSize(new T.Vector3()),distance=Math.max(size.x/camera.aspect,size.y,size.z)*2.5;camera.position.copy(cameraTarget).add(new T.Vector3(...views[name]).normalize().multiplyScalar(distance));controls.target.copy(cameraTarget);controls.update();ground.visible=floorVisible&&name!=='sole';for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));camera.updateMatrixWorld(true);renderer.render(scene,camera);}
 for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>view(button.dataset.view);
 document.querySelector('#floor').onclick=()=>{floorVisible=!floorVisible;ground.visible=floorVisible&&currentView!=='sole';document.querySelector('#floor').setAttribute('aria-pressed',String(floorVisible));};
 controls.addEventListener('start',()=>{for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
 function resize(){const {width,height}=stage.getBoundingClientRect();camera.aspect=width/height;camera.fov=camera.aspect<.7?52:38;camera.updateProjectionMatrix();renderer.setSize(width,height);view(currentView);}
 new ResizeObserver(resize).observe(stage);resize();view('angle');
 renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
 window.footLab={foot,calf,study,scene,camera,controls,ground,view,getState:()=>({stage:'foot-socket'})};
 installTestLabScene({scene,camera,renderer,floors:[ground],getTarget:()=>controls.target,updateControls:()=>controls.update()});
 window.footLabReady=true;loading.hidden=true;
}catch(error){console.error(error);loading.textContent='The foot could not open. Please reload to try again.';}
