// New avatar (version 2), step 1: only the torso (chest and pelvis), copied
// from the phone-ready Game avatar as the blank sheet we reshape. The rest of
// the body is added one part at a time later. "Show sockets" outlines where
// each arm and leg ball sits. The approved avatar is not used or changed here.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import torso from '../avatar-v2/torso.json' with {type:'json'};

const stage=document.querySelector('#stage');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363');
const body=new T.Group();body.name='new-avatar';scene.add(body);
const socketView=new T.Group();socketView.visible=false;scene.add(socketView);
for(const part of torso.parts){
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(part.positions,3));
 geometry.setAttribute('normal',new T.Float32BufferAttribute(part.normals,3));
 geometry.setIndex(part.index);geometry.computeBoundingSphere();
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:new T.Color().setRGB(...part.color),roughness:part.roughness}));
 mesh.name=part.name;mesh.position.fromArray(part.position);mesh.quaternion.fromArray(part.quaternion);mesh.scale.fromArray(part.scale);mesh.castShadow=true;body.add(mesh);
 for(const s of part.sockets){
  const ball=new T.Mesh(new T.SphereGeometry(s.radius,24,16),new T.MeshBasicMaterial({color:'#ffb347',wireframe:true,transparent:true,opacity:.7}));
  ball.position.fromArray(s.center);ball.name='socket-'+s.bone;socketView.add(ball);
 }
}
const slab=new T.Mesh(new T.BoxGeometry(4,.6,4),new T.MeshStandardMaterial({color:'#8f9295',roughness:1}));slab.position.y=-.3;slab.receiveShadow=true;scene.add(slab);
scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-1.8,right:1.8,top:2,bottom:-1,near:.2,far:12});key.shadow.bias=-.0002;key.target.position.set(0,.9,0);scene.add(key,key.target);
const fill=new T.DirectionalLight(0xffffff,.9);fill.position.set(4,2,-3);scene.add(fill);

// The torso floats at its normal height (about 0.8 to 1.45 m) so later parts
// attach where they belong; the camera looks at its middle.
const box=new T.Box3().setFromObject(body),target=box.getCenter(new T.Vector3());
const camera=new T.PerspectiveCamera(36,1,.01,40),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.6;controls.maxDistance=8;controls.target.copy(target);
const views={front:[0,.05,2.6],side:[2.6,.05,0],back:[0,.05,-2.6],top:[0,2.6,.001],angled:[1.4,.5,2.2]};
function view(name){camera.position.copy(target).add(new T.Vector3(...views[name]));controls.target.copy(target);controls.update();for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
controls.addEventListener('start',()=>{for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
const socketsButton=document.querySelector('#sockets');
function showSockets(on){socketView.visible=on;socketsButton.setAttribute('aria-pressed',String(on));socketsButton.textContent=on?'Hide sockets':'Show sockets';}
socketsButton.onclick=()=>showSockets(!socketView.visible);
function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.fov=camera.aspect<.7?46:36;camera.updateProjectionMatrix();renderer.setSize(width,height);}
new ResizeObserver(resize).observe(stage);resize();view('angled');
document.querySelector('#info').textContent=torso.triangles.toLocaleString()+' triangles · chest and pelvis';
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});
// Small and light, so it draws every frame (keeps a phone's graphics chip awake).
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
window.newAvatarLab={scene,camera,controls,renderer,body,showSockets,view,torso};
document.querySelector('#loading').hidden=true;window.newAvatarReady=true;
