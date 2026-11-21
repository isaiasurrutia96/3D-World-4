// New avatar (version 2): the chosen torso and the joint-ball choices, side by
// side. The torso is Athletic (light) (avatar-v2/torso-variants.js, drawn by
// torso-shape.js); the balls have exactly 300, 400 and 500 triangles
// (avatar-v2/ball-shape.js). "Compare all" frames everything; each item's
// button moves the camera in on that one and hides the rest. The approved
// avatar is not used or changed here.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import torso from '../avatar-v2/torso.json' with {type:'json'};
import {buildTorsoSurface} from '../avatar-v2/torso-shape.js';
import {TORSO_OPTIONS,makeTorsoOption} from '../avatar-v2/torso-variants.js';
import {buildBall,BALL_OPTIONS,BALL_RADIUS} from '../avatar-v2/ball-shape.js';

const GAP=.3;// metres of space between items, left to right
const stage=document.querySelector('#stage');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363');
const lineup=new T.Group();lineup.name='torso-options';scene.add(lineup);
const material=new T.MeshStandardMaterial({color:new T.Color().setRGB(...torso.color),roughness:torso.roughness});

/** A small label (a rounded tag) that always faces the camera. */
function label(text){
 const canvas=document.createElement('canvas'),g=canvas.getContext('2d'),font='600 64px system-ui,sans-serif';g.font=font;
 const w=Math.max(128,Math.ceil(g.measureText(text).width)+64);canvas.width=w;canvas.height=128;
 g.fillStyle='rgba(255,255,255,.92)';g.beginPath();g.roundRect(4,8,w-8,112,56);g.fill();
 g.fillStyle='#343b40';g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,68);
 const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas)}));sprite.scale.set(.11*w/128,.11,1);return sprite;
}

// Everything on show: the torso(s), then the balls. Each item knows its mesh,
// its centre and its width (for framing the camera).
const geometryOf=({positions,index,normals})=>{
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(index);
 if(normals)g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));else g.computeVertexNormals();
 g.computeBoundingBox();return g;
};
const items=[
 ...TORSO_OPTIONS.map(option=>({id:option.id,label:option.label,note:option.note,tag:'Torso',geometry:geometryOf(buildTorsoSurface(makeTorsoOption(torso.shape,option)))})),
 ...BALL_OPTIONS.map(option=>{
  const geometry=geometryOf(buildBall({radius:BALL_RADIUS,triangles:option.triangles}));
  geometry.translate(0,1.14,0);geometry.computeBoundingBox();// shown at chest height, next to the torso
  return {id:option.id,label:option.label,note:option.note,tag:String(option.triangles),geometry};
 }),
];
let x=0;
const options=items.map((item,i)=>{
 const box=item.geometry.boundingBox,width=box.max.x-box.min.x;
 if(i>0)x+=GAP;x+=width/2;
 const mesh=new T.Mesh(item.geometry,material);mesh.name=item.id;mesh.castShadow=true;
 const group=new T.Group();group.name='item-'+item.id;group.position.x=x;group.add(mesh);x+=width/2;
 const tag=label(item.tag);tag.position.set(0,box.min.y-.1,0);group.add(tag);lineup.add(group);
 return {...item,option:item,group,mesh,width,centre:box.getCenter(new T.Vector3()).add(group.position),triangles:item.geometry.index.count/3};
});
lineup.position.x=-x/2;// centre the row
for(const o of options)o.centre.x-=x/2;

const slab=new T.Mesh(new T.BoxGeometry(x+1.6,.6,3),new T.MeshStandardMaterial({color:'#8f9295',roughness:1}));slab.position.y=-.3;slab.receiveShadow=true;scene.add(slab);
scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(2048,1024);
Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-1,near:.2,far:14});key.shadow.bias=-.0002;key.target.position.set(0,.9,0);scene.add(key,key.target);
const fill=new T.DirectionalLight(0xffffff,.9);fill.position.set(4,2,-3);scene.add(fill);

// Camera: "focus" is null (compare all) or an option's index. View buttons
// work around whatever is in focus. Moves glide over about a third of a second.
const camera=new T.PerspectiveCamera(36,1,.01,60),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.25;controls.maxDistance=12;
const allCentre=new T.Box3().setFromObject(lineup).getCenter(new T.Vector3());
const directions={front:[0,.04,1],side:[1,.04,0],back:[0,.04,-1],top:[0,1,.0004],angled:[.5,.2,.85]};
let focus=null,viewName='front',glide=null;
function distance(){// close enough to fill the screen with one item, or with all of them
 const half=Math.tan(camera.fov*Math.PI/360),across=focus===null?x+.4:options[focus].width*1.7;
 return Math.max(focus===null?1.7:.45,(across/2)/(half*Math.min(1,camera.aspect)))*1.05;
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
 for(const b of document.querySelectorAll('[data-option]'))b.setAttribute('aria-pressed',String(b.dataset.option===(index===null?'all':options[index].id)));
 const o=index===null?null:options[index];
 document.querySelector('#note').textContent=o?o.note:'The chosen torso and three joint balls, side by side. Tap one to look at it closely.';
 document.querySelector('#info').textContent=o?o.triangles.toLocaleString()+' triangles':options.map(o=>o.triangles.toLocaleString()).join(' · ')+' triangles';
}
function view(name){viewName=name;frame();for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}

// Buttons: one per option, plus "Compare all".
const list=document.querySelector('#options');
const button=(id,text)=>{const b=document.createElement('button');b.dataset.option=id;b.textContent=text;b.setAttribute('aria-pressed','false');list.append(b);return b;};
button('all','Compare all').onclick=()=>setFocus(null);
options.forEach((o,i)=>{button(o.id,o.label).onclick=()=>setFocus(i);});
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
