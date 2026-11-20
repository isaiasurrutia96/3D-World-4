// New avatar (version 2), step 2: the torso as one continuous piece, with no
// sockets and no line between chest and pelvis. It is drawn from the numbers
// in avatar-v2/torso.json by avatar-v2/torso-shape.js (made by fit-torso.mjs).
// The rest of the body is added one part at a time later. The approved avatar
// is not used or changed here.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import torso from '../avatar-v2/torso.json' with {type:'json'};
import {buildTorsoSurface} from '../avatar-v2/torso-shape.js';

const stage=document.querySelector('#stage');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363');
const body=new T.Group();body.name='new-avatar';scene.add(body);
{
 const {positions,index}=buildTorsoSurface(torso.shape),geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(index);
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:new T.Color().setRGB(...torso.color),roughness:torso.roughness}));
 mesh.name='torso';mesh.castShadow=true;body.add(mesh);
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
function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.fov=camera.aspect<.7?46:36;camera.updateProjectionMatrix();renderer.setSize(width,height);}
new ResizeObserver(resize).observe(stage);resize();view('angled');
document.querySelector('#info').textContent=torso.triangles.toLocaleString()+' triangles · one piece';
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});
// Small and light, so it draws every frame (keeps a phone's graphics chip awake).
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
window.newAvatarLab={scene,camera,controls,renderer,body,view,torso};
document.querySelector('#loading').hidden=true;window.newAvatarReady=true;
