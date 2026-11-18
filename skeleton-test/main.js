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
function setPose(name){
 current=name;
 if(name==='wave'){player.transitionTo(POSES.rest,{duration:.6});player.setLayer('wave',{clip:CLIPS.wave,fade:.5});}
 else{player.clearLayer('wave',.4);player.transitionTo(POSES[name]??{},{duration:.6});}
 for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed',String(b.dataset.pose===name));
}
for(const b of document.querySelectorAll('[data-pose]'))b.onclick=()=>setPose(b.dataset.pose);
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
renderer.setAnimationLoop(ms=>{const dt=Math.min(.1,last?(ms-last)/1000:0);last=ms;drawBones(A.apply(player.update(dt)));controls.update();renderer.render(scene,camera);});
window.skeletonLab={camera,controls,scene,setPose,showBones,view,avatar:A,player,poses:Object.keys(POSES)};
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});
document.querySelector('#loading').hidden=true;window.skeletonTestReady=true;
