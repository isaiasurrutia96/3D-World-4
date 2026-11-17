import * as T from 'three';
import {createAssembledAvatar} from '../../avatar-lab/src/avatar.js';
import {createHandRig,POSES as HAND_POSES} from '../../hand-lab/src/hand-rig.js';
import {createWalker} from './walker.js';
import {createInput} from './input.js';

const stage=document.querySelector('#stage');
const avatar=createAssembledAvatar(),{rig,handParts}=avatar;
const handRig=createHandRig(handParts[1]);
handRig.setPose({...HAND_POSES.relax,index:.08,middle:.08,ring:.08,little:.08}); // relaxed, set once
const walker=createWalker(avatar);

const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(rig.root);

// Floor slab: 30 m square, 0.4 m thick, with faint 1 m lines.
const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
g.fillStyle='#8d949b';g.fillRect(0,0,128,128);g.strokeStyle='#7f868d';g.lineWidth=3;g.strokeRect(0,0,128,128);
const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(30,30);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
const sideM=new T.MeshStandardMaterial({color:'#6c737a',roughness:.95});
const slab=new T.Mesh(new T.BoxGeometry(30,.4,30),[sideM,sideM,new T.MeshStandardMaterial({map:tex,roughness:.95}),sideM,sideM,sideM]);
slab.position.y=-.2;slab.receiveShadow=true;scene.add(slab);
rig.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});

scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
const key=new T.DirectionalLight(0xffffff,2.5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.2,far:14});key.shadow.bias=-.0002;scene.add(key,key.target);
const fill=new T.DirectionalLight(0xffffff,1);fill.position.set(4,2,-3);scene.add(fill);

// Follow camera: orbits the avatar; drag / right side of the screen turns it.
const camera=new T.PerspectiveCamera(40,1,.05,80),input=createInput(renderer.domElement);
const look=new T.Vector3(0,.95,0);let camYaw=Math.PI,camPitch=.22,camDist=4.6;
const views={back:[Math.PI,.22],front:[0,.18],side:[Math.PI/2,.12],top:[Math.PI,1.45],angled:[Math.PI*.78,.38]};
function view(name){camYaw=walker.state.facing+views[name][0];camPitch=views[name][1];for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
function resize(){const {width,height}=stage.getBoundingClientRect();camera.aspect=width/height;camera.fov=camera.aspect<.7?52:40;camera.updateProjectionMatrix();renderer.setSize(width,height);}
new ResizeObserver(resize).observe(stage);resize();view('angled');

let last=performance.now();
renderer.setAnimationLoop(()=>{
 const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
 input.update(dt);
 if(input.look.x||input.look.y)for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');
 camYaw-=input.look.x;camPitch=T.MathUtils.clamp(camPitch+input.look.y,-.1,1.5);camDist=T.MathUtils.clamp(camDist*(1+input.zoom),1.5,12);
 // Stick directions are relative to the camera.
 const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),m=input.move;
 const st=window.motionLab?.paused?walker.state:walker.update(dt,fx*m.y-fz*m.x,fz*m.y+fx*m.x);
 input.endFrame();
 const k=1-Math.exp(-8*dt);look.x+=(st.pos.x-look.x)*k;look.z+=(st.pos.z-look.z)*k;
 camera.position.set(look.x+Math.sin(camYaw)*Math.cos(camPitch)*camDist,look.y+Math.sin(camPitch)*camDist,look.z+Math.cos(camYaw)*Math.cos(camPitch)*camDist);
 camera.lookAt(look);
 key.position.set(st.pos.x-3,5,st.pos.z+4);key.target.position.set(st.pos.x,.9,st.pos.z);
 renderer.render(scene,camera);
});
window.motionLab={avatar,walker,camera,view,input};
