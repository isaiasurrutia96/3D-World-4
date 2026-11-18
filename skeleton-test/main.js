// Skeleton test (sections 2 and 3): the approved avatar on the new skeleton.
// Poses now move smoothly (section 3), and "Wave" plays a looping wave on
// the left arm as a layer. "Show bones" draws the skeleton. Visuals are
// placeholders.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import {createSkeletonAvatar} from './attach.js';

import {POSES,CLIPS} from '../motion-core/skeleton/poses.js';
import {createPosePlayer} from '../motion-core/skeleton/pose.js';
import {shoulderFollow} from '../motion-core/skeleton/shoulder.js';
import {reach} from '../motion-core/skeleton/reach.js';
import {blend,EASE} from '../motion-core/skeleton/pose.js';

const stage=document.querySelector('#stage');
const A=createSkeletonAvatar();
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363');scene.add(A.root);
A.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});
const slab=new T.Mesh(new T.BoxGeometry(4,.6,4),new T.MeshStandardMaterial({color:'#8f9295',roughness:1}));slab.position.y=-.3;slab.receiveShadow=true;scene.add(slab);
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

const player=createPosePlayer(A.skeleton);let current='rest';
// Reaching demos (section 4). Placeholder props: a step and a ball.
const prop=new T.MeshStandardMaterial({color:'#c9c4ba',roughness:1});
const step=new T.Mesh(new T.BoxGeometry(.34,.2,.3),prop);step.position.set(.15,.1,.36);step.castShadow=step.receiveShadow=true;step.visible=false;scene.add(step);
const ball=new T.Mesh(new T.SphereGeometry(.035,20,14),new T.MeshStandardMaterial({color:'#ff9a3c',roughness:.6}));ball.visible=false;scene.add(ball);
const sk=A.skeleton,L1=sk.bones[sk.index.get('thigh.L')].length,L2=sk.bones[sk.index.get('shin.L')].length,smooth01=t=>EASE.inOut(Math.min(1,Math.max(0,t)));
/** How far back the hips go in a squat, so each shin tips no more than 10° (the ankle allows 18°). */
const hipsBack=drop=>{const b=10*Math.PI/180,kz=L2*Math.sin(b),ky=L2*Math.cos(b),h=L1+L2-drop;return Math.min(0,kz-Math.sqrt(Math.max(0,L1*L1-(h-ky)**2)));};
let demo=null,demoTime=0,demoWeight=0;
const SOLE={L:[.15,0,.025],R:[-.15,0,.025]};
const demos={
 // Squat up and down; feet stay planted and flat, the chest leans and the arms come forward for balance.
 squat:t=>{const drop=.16*(1-Math.cos(t*2.2)),k=drop/.32;return {pose:{root:{position:[0,-drop,hipsBack(drop)],rotation:{x:0,y:0,z:0}},chest:{x:15*k,y:0,z:0},'upperArm.L':{x:-80*k,y:0,z:8},'upperArm.R':{x:-80*k,y:0,z:-8},'lowerArm.L':{x:-15*k,y:0,z:0},'lowerArm.R':{x:-15*k,y:0,z:0}},
  goals:{'foot.L':{sole:SOLE.L,heading:0},'foot.R':{sole:SOLE.R,heading:0}}};},
 // Lift the left foot onto the step (an arc up and over), hold, then step back down.
 step:t=>{const c=t%4,p=c<1.2?smooth01(c/1.2):c<2.6?1:1-smooth01((c-2.6)/1.2),top=step.position.y*2;
  const sole=[.15,top*p+.07*Math.sin(Math.PI*p),SOLE.L[2]+(step.position.z-SOLE.L[2])*p];
  return {pose:{root:{position:[-.02*p,0,.04*p],rotation:{x:0,y:0,z:0}}},goals:{'foot.L':{sole,heading:0},'foot.R':{sole:SOLE.R,heading:0}}};},
 // The left hand follows a ball circling in front of him; the shoulder follows the arm.
 ball:t=>{const a=t*1.4,pos=new T.Vector3(.24+.16*Math.cos(a),1.32+.18*Math.sin(a),.42+.06*Math.sin(2*a));ball.position.copy(pos);
  // The wrist stops a hand's length short of the ball, so the palm touches it.
  const wrist=pos.clone().sub(pos.clone().sub(new T.Vector3(.298,1.246,0)).setLength(.1));
  return {pose:{},goals:{'hand.L':{position:wrist.toArray()},'foot.L':{sole:SOLE.L,heading:0},'foot.R':{sole:SOLE.R,heading:0}}};},
};
function setDemo(name){
 demo=demos[name]?name:null;demoTime=0;step.visible=demo==='step';ball.visible=demo==='ball';
 for(const b of document.querySelectorAll('[data-demo]'))b.setAttribute('aria-pressed',String(b.dataset.demo===demo));
 if(demo)for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed','false');
}
for(const b of document.querySelectorAll('[data-demo]'))b.onclick=()=>{setPose('rest');setDemo(b.dataset.demo===demo?null:b.dataset.demo);};
/** The pose for this frame: the pose player, then (fading in and out smoothly) the reaching demo. */
let lastDemo=null;
function framePose(dt){
 let pose=player.update(dt);
 demoWeight=Math.min(1,Math.max(0,demoWeight+(demo?dt:-dt)/.5));
 if(demo)lastDemo=demo;
 if(demoWeight>0&&lastDemo){
  demoTime+=dt;const d=demos[lastDemo](demoTime),w=EASE.inOut(demoWeight);
  const mixed=blend(pose,{...pose,...d.pose},w),r=d.pose.root??{position:[0,0,0],rotation:{x:0,y:0,z:0}};
  mixed.root={position:r.position.map(v=>v*w),rotation:{x:r.rotation.x*w,y:r.rotation.y*w,z:r.rotation.z*w}};
  // Reach with the blended body; while fading, mix the reached limbs in by the same amount.
  const reached=reach(sk,mixed,d.goals,{follow:true}).pose;
  pose=w>=1?reached:{...blend(shoulderFollow(sk,mixed),reached,w),root:mixed.root};
  if(!demo&&demoWeight===0)lastDemo=null;
  return pose;
 }
 return shoulderFollow(sk,pose);
}

function setPose(name){
 current=name;
 if(name==='wave'){player.transitionTo(POSES.rest,{duration:.6});player.setLayer('wave',{clip:CLIPS.wave,fade:.5});}
 else{player.clearLayer('wave',.4);player.transitionTo(POSES[name]??{},{duration:.6});}
 for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed',String(b.dataset.pose===name));
}
for(const b of document.querySelectorAll('[data-pose]'))b.onclick=()=>{setDemo(null);setPose(b.dataset.pose);};
const bonesButton=document.querySelector('#bones');
function showBones(on){bonesView.visible=on;bonesButton.setAttribute('aria-pressed',String(on));bonesButton.textContent=on?'Hide bones':'Show bones';}
bonesButton.onclick=()=>showBones(!bonesView.visible);

const target=new T.Vector3(0,.95,0),camera=new T.PerspectiveCamera(36,1,.01,40),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1;controls.maxDistance=9;controls.target.copy(target);
const views={front:[0,.1,4.4],side:[4.4,.1,0],back:[0,.1,-4.4],top:[0,4.4,.001],angled:[2.4,.9,3.9]};
function view(name){camera.position.copy(target).add(new T.Vector3(...views[name]));controls.target.copy(target);controls.update();for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
controls.addEventListener('start',()=>{for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});
function resize(){const {width,height}=stage.getBoundingClientRect();camera.aspect=width/height;camera.fov=camera.aspect<.7?46:36;camera.updateProjectionMatrix();renderer.setSize(width,height);}
new ResizeObserver(resize).observe(stage);resize();view('angled');setPose('rest');
let last=0;
renderer.setAnimationLoop(ms=>{const dt=Math.min(.1,last?(ms-last)/1000:0);last=ms;drawBones(A.apply(framePose(dt)));controls.update();renderer.render(scene,camera);});
window.skeletonLab={camera,controls,scene,setPose,setDemo,showBones,view,avatar:A,player,poses:Object.keys(POSES),demos:Object.keys(demos)};
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});
document.querySelector('#loading').hidden=true;window.skeletonTestReady=true;
