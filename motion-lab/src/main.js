import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createAssembledAvatar} from '../../avatar-lab/src/avatar.js';
import {createHandRig,POSES as HAND_POSES} from '../../hand-lab/src/hand-rig.js';
import {createStanding} from './standing.js';

const stage=document.querySelector('#stage');
const avatar=createAssembledAvatar(),{rig,handParts}=avatar;
const handRig=createHandRig(handParts[1]);
const standing=createStanding(avatar);

const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(rig.root);

// Floor slab: 20 m square, 0.4 m thick, with faint 1 m lines.
const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
g.fillStyle='#8d949b';g.fillRect(0,0,128,128);g.strokeStyle='#7f868d';g.lineWidth=3;g.strokeRect(0,0,128,128);
const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(20,20);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
const side=new T.MeshStandardMaterial({color:'#6c737a',roughness:.95});
const slab=new T.Mesh(new T.BoxGeometry(20,.4,20),[side,side,new T.MeshStandardMaterial({map:tex,roughness:.95}),side,side,side]);
slab.position.y=-.2;slab.receiveShadow=true;scene.add(slab);
rig.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});

scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
const key=new T.DirectionalLight(0xffffff,2.5);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
Object.assign(key.shadow.camera,{left:-1.7,right:1.7,top:1.7,bottom:-1.7,near:.2,far:12});key.shadow.bias=-.0002;key.target.position.set(0,.9,0);scene.add(key,key.target);
const fill=new T.DirectionalLight(0xffffff,1);fill.position.set(4,2,-3);scene.add(fill);

const target=new T.Vector3(0,.95,0);
const camera=new T.PerspectiveCamera(36,1,.01,60),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1;controls.maxDistance=12;controls.target.copy(target);
const views={front:[0,.1,4.4],side:[4.4,.1,0],back:[0,.1,-4.4],top:[0,4.4,.001],angled:[2.3,.85,4]};
function view(name){camera.position.copy(target).add(new T.Vector3(...views[name]));controls.target.copy(target);controls.update();
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
controls.addEventListener('start',()=>{for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
function resize(){const {width,height}=stage.getBoundingClientRect();camera.aspect=width/height;camera.fov=camera.aspect<.7?44:36;camera.updateProjectionMatrix();renderer.setSize(width,height);}
new ResizeObserver(resize).observe(stage);resize();view('angled');

// Hands: relaxed, fingers together, with a tiny curl that follows the breath.
let lastHand=-1;
renderer.setAnimationLoop(ms=>{
 const t=ms/1000,{breath}=standing.update(t);
 if(ms-lastHand>100){const p={...HAND_POSES.relax};for(const f of ['index','middle','ring','little'])p[f]=(p[f]??0)+.04+.03*breath;handRig.setPose(p);lastHand=ms;}
 controls.update();renderer.render(scene,camera);
});
window.motionLab={avatar,standing,camera,controls,scene,view};
