// New avatar (version 2). Step 2: the torso as one continuous piece (numbers in
// avatar-v2/torso.json, drawn by torso-shape.js). Step 3: the arms with the new
// elbow: a ball, a socket deep at the back and cut away in front, and slimmer
// limbs with an inner-elbow crease (avatar-v2/arm.js, limb-shape.js). The
// shoulder and wrist ends are plain rounded caps until those joints are built.
// The approved avatar is not used or changed here.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import torso from '../avatar-v2/torso.json' with {type:'json'};
import {buildTorsoSurface} from '../avatar-v2/torso-shape.js';
import {buildLimb} from '../avatar-v2/limb-shape.js';
import {UPPER_ARM,FOREARM,ELBOW_BALL,ELBOW_REST,ELBOW_CLEAN_BEND} from '../avatar-v2/arm.js';

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
// Arms. The left arm is built from the numbers; the right is its mirror image.
// The forearm and the elbow ball hang from a pivot at the elbow centre and turn
// the way the skeleton turns them: change from rest = R(bend, twist) · R(rest)⁻¹.
const clay=()=>new T.MeshStandardMaterial({color:new T.Color().setRGB(...torso.color),roughness:torso.roughness});
function limbMesh(spec){
 const {positions,index}=buildLimb(spec),geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(index);geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,clay());mesh.name=spec.name;mesh.castShadow=true;return mesh;
}
const elbowCentre=new T.Vector3(...ELBOW_BALL.centre),RAD=Math.PI/180;
const restInv=new T.Quaternion().setFromEuler(new T.Euler(ELBOW_REST.x*RAD,ELBOW_REST.y*RAD,ELBOW_REST.z*RAD,'XYZ')).invert();
const elbows=[];
for(const side of [1,-1]){
 const arm=new T.Group();arm.name=side>0?'arm.L':'arm.R';arm.scale.x=side;body.add(arm);
 arm.add(limbMesh(UPPER_ARM));
 const pivot=new T.Group();pivot.position.copy(elbowCentre);arm.add(pivot);
 const fore=limbMesh(FOREARM);fore.position.copy(elbowCentre).negate();pivot.add(fore);
 const ball=new T.Mesh(new T.SphereGeometry(ELBOW_BALL.radius,32,20),clay());ball.name='ball-elbow';ball.castShadow=true;pivot.add(ball);
 elbows.push(pivot);
}
let bend=ELBOW_REST.x,twist=0,goalBend=bend,goalTwist=0;
function setElbow(b,t=goalTwist){goalBend=Math.max(ELBOW_CLEAN_BEND,Math.min(0,b));goalTwist=Math.max(-80,Math.min(80,t));
 for(const btn of document.querySelectorAll('[data-bend]'))btn.setAttribute('aria-pressed',String(Number(btn.dataset.bend)===b));
 for(const btn of document.querySelectorAll('[data-twist]'))btn.setAttribute('aria-pressed',String(Number(btn.dataset.twist)===goalTwist));}
function applyElbow(){const q=new T.Quaternion().setFromEuler(new T.Euler(bend*RAD,twist*RAD,0,'XYZ')).multiply(restInv);for(const p of elbows)p.quaternion.copy(q);}
for(const btn of document.querySelectorAll('[data-bend]'))btn.onclick=()=>setElbow(Number(btn.dataset.bend));
for(const btn of document.querySelectorAll('[data-twist]'))btn.onclick=()=>setElbow(goalBend,Number(btn.dataset.twist));
applyElbow();
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
{let tris=0;body.traverse(o=>{if(o.isMesh)tris+=o.geometry.index.count/3;});document.querySelector('#info').textContent=tris.toLocaleString()+' triangles · torso and arms';}
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});
// Small and light, so it draws every frame (keeps a phone's graphics chip awake).
// The elbow eases toward its goal (about a third of a second), framerate-independent.
let last=0;
renderer.setAnimationLoop(ms=>{const dt=Math.min(1/30,last?(ms-last)/1000:0);last=ms;const k=1-Math.exp(-dt*9);
 bend+=(goalBend-bend)*k;twist+=(goalTwist-twist)*k;applyElbow();controls.update();renderer.render(scene,camera);});
window.newAvatarLab={scene,camera,controls,renderer,body,view,torso,setElbow,getElbow:()=>({bend,twist})};
document.querySelector('#loading').hidden=true;window.newAvatarReady=true;
