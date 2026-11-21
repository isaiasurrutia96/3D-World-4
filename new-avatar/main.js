// New avatar (version 2): torso shape options, side by side.
// The clean one-piece torso (avatar-v2/torso.json) and four alternatives made
// from it by numbers (avatar-v2/torso-variants.js), all drawn by
// torso-shape.js. "Compare all" frames every option; each option's button moves
// the camera in on that one and hides the rest. The approved avatar is not used
// or changed here.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import torso from '../avatar-v2/torso.json' with {type:'json'};
import {buildTorsoSurface} from '../avatar-v2/torso-shape.js';
import {TORSO_OPTIONS,makeTorsoOption} from '../avatar-v2/torso-variants.js';

const SPACING=.85;// metres between options, left to right
const stage=document.querySelector('#stage');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363');
const lineup=new T.Group();lineup.name='torso-options';scene.add(lineup);
const material=new T.MeshStandardMaterial({color:new T.Color().setRGB(...torso.color),roughness:torso.roughness});

/** A small number label that always faces the camera. */
function label(text){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const g=canvas.getContext('2d');
 g.fillStyle='rgba(255,255,255,.92)';g.beginPath();g.arc(64,64,56,0,Math.PI*2);g.fill();
 g.fillStyle='#343b40';g.font='600 72px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,64,68);
 const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas)}));sprite.scale.set(.13,.13,1);return sprite;
}

const options=TORSO_OPTIONS.map((option,i)=>{
 const {positions,index}=buildTorsoSurface(makeTorsoOption(torso.shape,option)),geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(index);
 geometry.computeVertexNormals();geometry.computeBoundingBox();
 const mesh=new T.Mesh(geometry,material);mesh.name='torso-'+option.id;mesh.castShadow=true;
 const group=new T.Group();group.name='option-'+option.id;group.position.x=(i-(TORSO_OPTIONS.length-1)/2)*SPACING;group.add(mesh);
 const tag=label(String(i+1));tag.position.set(0,geometry.boundingBox.min.y-.11,0);group.add(tag);
 lineup.add(group);
 const centre=geometry.boundingBox.getCenter(new T.Vector3()).add(group.position);
 return {option,group,mesh,centre,triangles:index.length/3};
});

const slab=new T.Mesh(new T.BoxGeometry(SPACING*TORSO_OPTIONS.length+1,.6,3),new T.MeshStandardMaterial({color:'#8f9295',roughness:1}));slab.position.y=-.3;slab.receiveShadow=true;scene.add(slab);
scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(2048,1024);
Object.assign(key.shadow.camera,{left:-3.2,right:3.2,top:2,bottom:-1,near:.2,far:14});key.shadow.bias=-.0002;key.target.position.set(0,.9,0);scene.add(key,key.target);
const fill=new T.DirectionalLight(0xffffff,.9);fill.position.set(4,2,-3);scene.add(fill);

// Camera: "focus" is null (compare all) or an option's index. View buttons
// work around whatever is in focus. Moves glide over about a third of a second.
const camera=new T.PerspectiveCamera(36,1,.01,60),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.6;controls.maxDistance=12;
const allCentre=new T.Box3().setFromObject(lineup).getCenter(new T.Vector3());
const directions={front:[0,.04,1],side:[1,.04,0],back:[0,.04,-1],top:[0,1,.0004],angled:[.5,.2,.85]};
let focus=null,viewName='front',glide=null;
function distance(){// close enough to fill the screen with one torso, or all of them
 const half=Math.tan(camera.fov*Math.PI/360),across=focus===null?SPACING*TORSO_OPTIONS.length:1;
 return Math.max(1.7,(across/2+.1)/(half*Math.min(1,camera.aspect)))*1.05;
}
function frame(){
 const target=focus===null?allCentre:options[focus].centre,dir=new T.Vector3(...directions[viewName]).normalize();
 glide={fromPos:camera.position.clone(),fromTarget:controls.target.clone(),toTarget:target.clone(),toPos:target.clone().add(dir.multiplyScalar(distance())),t:0};
}
function setFocus(index){
 focus=index;
 // Looking at one: the others are hidden so no neighbour blocks the side views.
 options.forEach((o,i)=>{o.group.visible=index===null||i===index;});
 frame();
 for(const b of document.querySelectorAll('[data-option]'))b.setAttribute('aria-pressed',String(b.dataset.option===(index===null?'all':TORSO_OPTIONS[index].id)));
 const o=index===null?null:options[index];
 document.querySelector('#note').textContent=o?o.option.note:'All five side by side, left to right. Tap one to look at it closely.';
 document.querySelector('#info').textContent=o?o.triangles.toLocaleString()+' triangles':TORSO_OPTIONS.length+' torso shapes';
}
function view(name){viewName=name;frame();for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}

// Buttons: one per option, plus "Compare all".
const list=document.querySelector('#options');
const button=(id,text)=>{const b=document.createElement('button');b.dataset.option=id;b.textContent=text;b.setAttribute('aria-pressed','false');list.append(b);return b;};
button('all','Compare all').onclick=()=>setFocus(null);
TORSO_OPTIONS.forEach((o,i)=>{button(o.id,o.label).onclick=()=>setFocus(i);});
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
controls.addEventListener('start',()=>{glide=null;for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});

function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.fov=camera.aspect<.7?46:36;camera.updateProjectionMatrix();renderer.setSize(width,height);}
new ResizeObserver(resize).observe(stage);resize();
setFocus(null);view('front');
camera.position.copy(glide.toPos);controls.target.copy(glide.toTarget);glide=null;controls.update();// start in place
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});

// Light enough to draw every frame (keeps a phone's graphics chip awake).
let last=0;
renderer.setAnimationLoop(ms=>{
 const dt=Math.min(1/30,last?(ms-last)/1000:0);last=ms;
 if(glide){glide.t=Math.min(1,glide.t+dt/.35);const k=glide.t*glide.t*(3-2*glide.t);
  camera.position.lerpVectors(glide.fromPos,glide.toPos,k);controls.target.lerpVectors(glide.fromTarget,glide.toTarget,k);if(glide.t>=1)glide=null;}
 controls.update();renderer.render(scene,camera);
});
window.newAvatarLab={scene,camera,controls,renderer,lineup,options,setFocus,view,torso,getFocus:()=>focus};
document.querySelector('#loading').hidden=true;window.newAvatarReady=true;
