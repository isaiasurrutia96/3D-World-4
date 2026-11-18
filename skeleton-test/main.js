// Skeleton test (section 2): the approved avatar hanging on the new skeleton,
// with a few fixed poses and a "show bones" view. Poses switch instantly;
// smooth blending between poses is section 3. Visuals are placeholders.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import {createSkeletonAvatar} from './attach.js';

const POSES={
 rest:{},
 'arms-out':{'upperArm.R':{x:0,y:0,z:88},'upperArm.L':{x:0,y:0,z:-88},'lowerArm.R':{x:0,y:0,z:0},'lowerArm.L':{x:0,y:0,z:0}},
 'arms-up':{'upperArm.R':{x:-165,y:0,z:8},'upperArm.L':{x:-165,y:0,z:-8},'lowerArm.R':{x:-5,y:0,z:0},'lowerArm.L':{x:-5,y:0,z:0}},
 // Natural wave: upper arm out at shoulder height, forearm straight up, palm forward;
 // the hand tilted 10° back (clockwise seen from his waving side) about its own middle.
 wave:{'upperArm.R':{x:-83.2,y:-5.1,z:79.2},'lowerArm.R':{x:-74.6,y:-14.6,z:0},'hand.R':{x:-1.2,y:0,z:8.5}},
 elbows:{'upperArm.R':{x:-15,y:0,z:12},'upperArm.L':{x:-15,y:0,z:-12},'lowerArm.R':{x:-120,y:0,z:0},'lowerArm.L':{x:-120,y:0,z:0},'hand.R':{x:30,y:0,z:0},'hand.L':{x:30,y:0,z:0}},
 kick:{'thigh.R':{x:-70,y:0,z:0},'shin.R':{x:35,y:0,z:0},'foot.R':{x:20,y:0,z:0},'upperArm.R':{x:25,y:0,z:12},'upperArm.L':{x:-35,y:0,z:-12}},
 knee:{'thigh.L':{x:-95,y:0,z:0},'shin.L':{x:115,y:0,z:0},'foot.L':{x:30,y:0,z:0},'upperArm.R':{x:-30,y:0,z:20},'upperArm.L':{x:20,y:0,z:-20}},
 look:{'neck':{x:5,y:25,z:0},'head':{x:-10,y:15,z:6}},
};

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
const bonesView=new T.Group();bonesView.add(lines,dots);bonesView.visible=false;scene.add(bonesView);
const m4=new T.Matrix4();
function drawBones(s){s.bones.forEach((b,i)=>{b.head.toArray(linePos,i*6);b.tail.toArray(linePos,i*6+3);m4.makeTranslation(b.head.x,b.head.y,b.head.z);dots.setMatrixAt(i,m4);});lineGeo.attributes.position.needsUpdate=true;dots.instanceMatrix.needsUpdate=true;}

let current='rest';
function setPose(name){current=name;drawBones(A.apply(POSES[name]??{}));for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed',String(b.dataset.pose===name));}
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
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
window.skeletonLab={camera,controls,scene,setPose,showBones,view,avatar:A,poses:Object.keys(POSES)};
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});
document.querySelector('#loading').hidden=true;window.skeletonTestReady=true;
