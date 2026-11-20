// Skeleton test (sections 2 and 3): the approved avatar on the new skeleton.
// Poses now move smoothly (section 3), and "Wave" plays a looping wave on
// the left arm as a layer. "Show bones" draws the skeleton. Visuals are
// placeholders.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import {loadOfficialAvatar,OFFICIAL_AVATAR} from '../avatar/src/official-avatar.js';
import {loadLightAvatar,loadGameAvatar,LIGHT_AVATAR,GAME_AVATAR} from '../avatar/src/light-avatar.js';

import {POSES,CLIPS} from '../motion-core/skeleton/poses.js';
import {createPosePlayer} from '../motion-core/skeleton/pose.js';


const stage=document.querySelector('#stage');
async function start(){
// Which avatar to draw: the detailed approved one (default) or the light copy
// (about 14 times fewer triangles) or the game copy (about 29,000 triangles,
// phone-ready) for testing smoothness. The choice is remembered; changing it
// reloads the page.
let avatarMode='detailed';try{const saved=localStorage.getItem('skeletonAvatar');if(saved==='light'||saved==='game')avatarMode=saved;}catch{}
const A=avatarMode==='light'?await loadLightAvatar():avatarMode==='game'?await loadGameAvatar():await loadOfficialAvatar();
for(const b of document.querySelectorAll('[data-avatar]')){
 b.setAttribute('aria-pressed',String(b.dataset.avatar===avatarMode));
 b.onclick=()=>{if(b.dataset.avatar===avatarMode)return;try{localStorage.setItem('skeletonAvatar',b.dataset.avatar);}catch{}location.reload();};
}
let needsRender=true;
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
const scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(A.root);
A.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});
const floorSize=document.documentElement.dataset.avatarView==='avatar-test'?12:4;
const slab=new T.Mesh(new T.BoxGeometry(floorSize,.6,floorSize),new T.MeshStandardMaterial({color:'#8f9295',roughness:1}));slab.position.y=-.3;slab.receiveShadow=true;scene.add(slab);
scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-1.8,right:1.8,top:2,bottom:-1,near:.2,far:12});key.shadow.bias=-.0002;key.target.position.set(0,.9,0);scene.add(key,key.target);
const fill=new T.DirectionalLight(0xffffff,.9);fill.position.set(4,2,-3);scene.add(fill);

// Quality levels (Low, Medium, High) for testing smoothness on a slow device.
// The shadow draws the whole 3.6M-triangle avatar a second time, so it is the
// biggest saving. ratio = most drawn pixels per screen pixel; shadow = shadow
// map size (0 = no shadow); every = refresh the shadow on every Nth changed
// frame (a still pose always gets a fresh shadow). Edit the numbers to tune.
const QUALITY={low:{ratio:1,shadow:0,every:1},medium:{ratio:1,shadow:512,every:3},high:{ratio:1.5,shadow:1024,every:1}};
let quality='high',poseFrames=0,shadowStale=false;
function applyQuality(name){
 const q=QUALITY[name];if(!q)return;
 quality=name;
 renderer.setPixelRatio(Math.min(devicePixelRatio,q.ratio));
 key.castShadow=q.shadow>0;
 if(q.shadow>0&&key.shadow.mapSize.x!==q.shadow){key.shadow.mapSize.set(q.shadow,q.shadow);key.shadow.dispose();key.shadow.map=null;key.shadow.mapPass=null;}
 renderer.shadowMap.needsUpdate=true;shadowStale=false;
 resize();needsRender=true;
 for(const b of document.querySelectorAll('[data-quality]'))b.setAttribute('aria-pressed',String(b.dataset.quality===name));
 try{localStorage.setItem('skeletonQuality',name);}catch{}
}
for(const b of document.querySelectorAll('[data-quality]'))b.onclick=()=>applyQuality(b.dataset.quality);

// Bones view: a line for each bone and a dot at each joint, drawn on top.
const S=A.skeleton,lineGeo=new T.BufferGeometry(),linePos=new Float32Array(S.bones.length*6);lineGeo.setAttribute('position',new T.BufferAttribute(linePos,3));
const lines=new T.LineSegments(lineGeo,new T.LineBasicMaterial({color:'#ffb347',depthTest:false,transparent:true}));lines.renderOrder=10;lines.frustumCulled=false;
const dots=new T.InstancedMesh(new T.SphereGeometry(.012,10,8),new T.MeshBasicMaterial({color:'#ffe2b8',depthTest:false,transparent:true}),S.bones.length);dots.renderOrder=11;dots.frustumCulled=false;
// Links: where a bone does not start at the end of its parent (pelvis to waist,
// wrist to each finger's knuckle), a thinner line joins it to its parent's joint.
const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<.001;
const links=S.bones.map((b,i)=>[b.parentIndex,i]).filter(([p,i])=>p>=0&&!near(S.bones[i].head,S.bones[p].tail)&&!near(S.bones[i].head,S.bones[p].head));
const linkGeo=new T.BufferGeometry(),linkPos=new Float32Array(links.length*6);linkGeo.setAttribute('position',new T.BufferAttribute(linkPos,3));
const linkLines=new T.LineSegments(linkGeo,new T.LineBasicMaterial({color:'#ffd9a0',depthTest:false,transparent:true,opacity:.55}));linkLines.renderOrder=10;linkLines.frustumCulled=false;
const bonesView=new T.Group();bonesView.add(lines,linkLines,dots);bonesView.visible=false;scene.add(bonesView);
const m4=new T.Matrix4();
function drawBones(s){s.bones.forEach((b,i)=>{b.head.toArray(linePos,i*6);b.tail.toArray(linePos,i*6+3);m4.makeTranslation(b.head.x,b.head.y,b.head.z);dots.setMatrixAt(i,m4);});links.forEach(([p,i],k)=>{s.bones[p].head.toArray(linkPos,k*6);s.bones[i].head.toArray(linkPos,k*6+3);});linkGeo.attributes.position.needsUpdate=true;lineGeo.attributes.position.needsUpdate=true;dots.instanceMatrix.needsUpdate=true;}

const player=createPosePlayer(A.skeleton,{},{follow:true});let current='rest';
/** The pose for this frame. */
function framePose(dt){
 return player.update(dt);
}

function setPose(name){
 current=name;
 if(name==='wave'){player.transitionTo(POSES.rest,{duration:.6});player.setLayer('wave',{clip:CLIPS.wave,fade:.5});}
 else{player.clearLayer('wave',.4);player.transitionTo(POSES[name]??{},{duration:.6});}
 for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed',String(b.dataset.pose===name));
}
for(const b of document.querySelectorAll('[data-pose]'))b.onclick=()=>{setPose(b.dataset.pose);};
const bonesButton=document.querySelector('#bones');
function showBones(on){bonesView.visible=on;needsRender=true;bonesButton.setAttribute('aria-pressed',String(on));bonesButton.textContent=on?'Hide bones':'Show bones';}
bonesButton.onclick=()=>showBones(!bonesView.visible);

const target=new T.Vector3(0,.95,0),camera=new T.PerspectiveCamera(36,1,.01,40),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1;controls.maxDistance=9;controls.target.copy(target);
const views={front:[0,.1,4.4],side:[4.4,.1,0],back:[0,.1,-4.4],top:[0,4.4,.001],angled:[2.4,.9,3.9]};
function view(name){camera.position.copy(target).add(new T.Vector3(...views[name]));controls.target.copy(target);controls.update();needsRender=true;for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
controls.addEventListener('start',()=>{for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
controls.addEventListener('change',()=>{needsRender=true;});
function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.fov=camera.aspect<.7?46:36;camera.updateProjectionMatrix();renderer.setSize(width,height);needsRender=true;}
new ResizeObserver(resize).observe(stage);resize();view('angled');setPose('rest');
{let saved='high';try{saved=localStorage.getItem('skeletonQuality')||'high';}catch{}applyQuality(QUALITY[saved]?saved:'high');}
let last=0,lastPose='',lastPresentation='';
const MAX_STEP=1/30,KEEP_WARM=avatarMode!=='detailed';
// The animation clock is unchanged. A still inspection does not redraw the
// 3.6M-triangle master and its shadow sixty times a second on a phone.
// A small frame-rate readout (top left, in a dark box so it reads on any screen): how many frames a second, and the slowest frame in the last second. It says whether a
// lag is the page or the device, and it costs nothing.
const fpsBox=document.createElement('div');fpsBox.style.cssText='position:fixed;left:8px;top:84px;font:12px/1.3 system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.6);padding:3px 8px;border-radius:6px;pointer-events:none;z-index:50';document.body.appendChild(fpsBox);
let fpsFrames=0,fpsWorst=0,fpsSince=0;
renderer.setAnimationLoop(ms=>{
 if(last){const gap=ms-last;fpsFrames++;fpsWorst=Math.max(fpsWorst,gap);}
 if(!fpsSince)fpsSince=ms;
 if(ms-fpsSince>=1000){fpsBox.textContent=Math.round(fpsFrames*1000/(ms-fpsSince))+' fps · slowest frame '+Math.round(fpsWorst)+' ms';fpsFrames=0;fpsWorst=0;fpsSince=ms;}
 // A late frame moves the pose at most 1/30 s, so a slow frame (for example
 // the graphics chip waking up on the first tap) slows the motion a moment
 // instead of making it jump.
 const dt=Math.min(MAX_STEP,last?(ms-last)/1000:0);last=ms;
 const pose=framePose(dt),poseKey=JSON.stringify(pose);
 if(poseKey!==lastPose){
  lastPose=poseKey;drawBones(A.apply(pose));
  poseFrames++;
  if(poseFrames%QUALITY[quality].every===0){renderer.shadowMap.needsUpdate=true;shadowStale=false;}else shadowStale=true;
  needsRender=true;
 }else if(shadowStale){renderer.shadowMap.needsUpdate=true;shadowStale=false;needsRender=true;}
 controls.update();
 const presentation=JSON.stringify(window.testLabScene?.getState());
 if(presentation!==lastPresentation){lastPresentation=presentation;needsRender=true;}
 // Light and Game avatars draw every frame even when still, so the phone keeps
 // its graphics chip awake and the first tap does not start on a cold chip.
 // The shadow is still only redrawn when the pose changes. The Detailed
 // avatar keeps the saving (it is too heavy to redraw while still).
 if(needsRender||KEEP_WARM){renderer.render(scene,camera);needsRender=false;}
});
window.skeletonLab={camera,controls,scene,renderer,setPose,showBones,view,setQuality:applyQuality,getQuality:()=>quality,avatar:A,player,release:avatarMode==='light'?LIGHT_AVATAR:avatarMode==='game'?GAME_AVATAR:OFFICIAL_AVATAR,avatarMode,poses:Object.keys(POSES)};
window.avatarLab=window.skeletonLab;
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});
// Warm-up while the loading screen is still up: move the body to another pose
// and draw it once (with its shadow), then put it back. Any first-time work
// for a moving body (graphics programs, uploads, shadow pass) happens now
// instead of on the first tap.
A.apply(POSES['arms-up']??POSES.kick);renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);
drawBones(A.apply(player.update(0)));renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);
document.querySelector('#loading').hidden=true;window.skeletonTestReady=true;window.avatarLabReady=true;
}
start().catch(error=>{console.error(error);window.avatarLoadError=error.message;document.querySelector('#loading').textContent='The avatar could not open. Choose Reset to try again.';});
