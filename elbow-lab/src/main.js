import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../../src/test-lab-scene.ts';
import {loadStudyAsset} from '../../src/study-asset.js';

const stage=document.querySelector('#stage');
async function openStudy(){try{
 const study=await loadStudyAsset(__STUDY_ASSET_URL__),scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(study.group);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));stage.prepend(renderer.domElement);
 scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
 for(const [color,intensity,position] of [[0xffffff,2.4,[-3,5,5]],[0xffffff,1.1,[4,1,-4]],[0xffffff,.65,[-1,-3,4]]]){const light=new T.DirectionalLight(color,intensity);light.position.set(...position);scene.add(light);}
 const bounds=new T.Box3().setFromObject(study.group),target=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 const floor=new T.Mesh(new T.BoxGeometry(4,.6,4),new T.MeshStandardMaterial({color:'#8f9295',roughness:1}));floor.position.set(target.x,bounds.min.y-.325,target.z);scene.add(floor);
 const camera=new T.PerspectiveCamera(38,1,.01,20),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.45;controls.maxDistance=6;controls.target.copy(target);
 const views={front:[0,0,1],side:[1,0,0],back:[0,0,-1],top:[0,1,.001],angle:[.5,.18,1]};let current='front';
 function view(name){
  current=name;camera.up.set(0,1,0);const half=Math.max(size.y,size.x/camera.aspect,size.z)/2,distance=half/Math.tan(camera.fov*Math.PI/360)*1.35;
  camera.position.copy(target).add(new T.Vector3(...views[name]).normalize().multiplyScalar(distance));controls.target.copy(target);controls.update();camera.updateMatrixWorld(true);
  for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===name));renderer.render(scene,camera);
 }
 for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>view(button.dataset.view);
 controls.addEventListener('start',()=>{for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed','false');});
 function resize(){const box=stage.getBoundingClientRect();camera.aspect=box.width/box.height;camera.updateProjectionMatrix();renderer.setSize(box.width,box.height);view(current);}
 new ResizeObserver(resize).observe(stage);resize();renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
 window.elbowLab={...study,scene,camera,controls,view};
 installTestLabScene({scene,camera,renderer,floors:[floor],getTarget:()=>controls.target,updateControls:()=>controls.update()});
 document.querySelector('#loading').hidden=true;window.elbowLabReady=true;
}catch(error){console.error(error);document.querySelector('#loading').textContent='The elbow study could not open. Please reload.';}}
openStudy();
