// Skeleton test (sections 2 and 3): the approved avatar on the new skeleton.
// Poses now move smoothly (section 3), and "Wave" plays a looping wave on
// the left arm as a layer. "Show bones" draws the skeleton. Visuals are
// placeholders.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import {loadOfficialAvatar,OFFICIAL_AVATAR} from '../avatar/src/official-avatar.js';

import {POSES,CLIPS} from '../motion-core/skeleton/poses.js';
import {createPosePlayer} from '../motion-core/skeleton/pose.js';
import {reach} from '../motion-core/skeleton/reach.js';
import {createDemos,seatTop,thighRests,footReach,createDemoRunner} from './demos.js';


const stage=document.querySelector('#stage');
async function start(){
const A=await loadOfficialAvatar();
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
// Reaching demos (section 4, skeleton-test/demos.js). Placeholder props: simple blocks and a ball.
const sk=A.skeleton,D=createDemos(sk,footReach(A)),RESTS=thighRests(A);
const prop=new T.MeshStandardMaterial({color:'#c9c4ba',roughness:1});
const step=new T.Mesh(new T.BoxGeometry(D.STEP.width,D.STEP.height,D.STEP.depth),prop);step.position.set(...D.STEP.centre);step.castShadow=step.receiveShadow=true;step.visible=false;scene.add(step);
const ball=new T.Mesh(new T.SphereGeometry(D.BALL.radius,24,16),new T.MeshStandardMaterial({color:'#ff9a3c',roughness:.6}));ball.visible=false;scene.add(ball);
// The seat: a simple block whose top is measured to touch him exactly when seated.
const seatPose=reach(sk,D.sit(99).pose,D.sit(99).goals).pose,seatFit=seatTop(A,seatPose);A.apply(sk.restPose());
const seat=new T.Mesh(new T.BoxGeometry(.5,seatFit.top,seatFit.front-seatFit.back+.04),prop);seat.position.set(0,seatFit.top/2,(seatFit.front+seatFit.back-.04)/2);seat.castShadow=seat.receiveShadow=true;seat.visible=false;scene.add(seat);
// Demos run on the pose player (smooth starts and stops); the shoulders follow inside the player.
const runner=createDemoRunner(player,D,RESTS);
function setDemo(name){
 if(!name||name===runner.active)runner.stop();else runner.start(name);
 const on=runner.active;step.visible=on==='step';ball.visible=on==='ball';seat.visible=on==='sit';
 for(const b of document.querySelectorAll('[data-demo]'))b.setAttribute('aria-pressed',String(b.dataset.demo===on));
 if(on)for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed','false');
}
for(const b of document.querySelectorAll('[data-demo]'))b.onclick=()=>setDemo(b.dataset.demo===runner.active?null:b.dataset.demo);
/** The pose for this frame (the ball prop follows the ball demo's time). */
function framePose(dt){
 const pose=player.update(dt);
 if(runner.active==='ball')ball.position.set(...D.ball(runner.time).ball);
 return pose;
}

function setPose(name){
 current=name;
 if(name==='wave'){player.transitionTo(POSES.rest,{duration:.6});player.setLayer('wave',{clip:CLIPS.wave,fade:.5});}
 else{player.clearLayer('wave',.4);player.transitionTo(POSES[name]??{},{duration:.6});}
 for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed',String(b.dataset.pose===name));
}
for(const b of document.querySelectorAll('[data-pose]'))b.onclick=()=>{if(runner.active)setDemo(null);setPose(b.dataset.pose);};
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
let last=0,lastPose='',lastPresentation='';
// The animation clock is unchanged. A still inspection does not redraw the
// 3.6M-triangle master and its shadow sixty times a second on a phone.
renderer.setAnimationLoop(ms=>{
 const dt=Math.min(.1,last?(ms-last)/1000:0);last=ms;
 const pose=framePose(dt),poseKey=JSON.stringify(pose);
 if(poseKey!==lastPose){lastPose=poseKey;drawBones(A.apply(pose));renderer.shadowMap.needsUpdate=true;needsRender=true;}
 controls.update();
 const presentation=JSON.stringify(window.testLabScene?.getState());
 if(presentation!==lastPresentation){lastPresentation=presentation;needsRender=true;}
 if(needsRender){renderer.render(scene,camera);needsRender=false;}
});
window.skeletonLab={camera,controls,scene,renderer,setPose,setDemo,showBones,view,avatar:A,player,release:OFFICIAL_AVATAR,poses:Object.keys(POSES),demos:['squat','sit','step','ball']};
window.avatarLab=window.skeletonLab;
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});
drawBones(A.solved);renderer.render(scene,camera);
document.querySelector('#loading').hidden=true;window.skeletonTestReady=true;window.avatarLabReady=true;
}
start().catch(error=>{console.error(error);window.avatarLoadError=error.message;document.querySelector('#loading').textContent='The avatar could not open. Choose Reset to try again.';});
