import * as T from 'three';
import {createForearmHandAssembly} from '../hand-study/assembly.js';
import {createCharacterRig} from '../reference/PlayerModel.ts';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const scene=new T.Scene();scene.background=new T.Color('#f1f1ee');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));document.body.prepend(renderer.domElement);
const rig=createCharacterRig({plain:true});
for(const [shoulder,side] of [[rig.shoulderLeft,-1],[rig.shoulderRight,1]]){shoulder.position.x=side*.28;shoulder.rotation.set(-.04,0,side*.20);}
rig.root.updateMatrixWorld(true);
// Locate the socket at the upper arm's rounded shoulder, in torso space.
const shoulderContact=rig.torso.worldToLocal(rig.shoulderRight.localToWorld(new T.Vector3(0,-.09,0)));
const socketY=shoulderContact.y,socketZ=shoulderContact.z;
const profile=[[0,-.2],[.108,-.195],[.186,-.168],[.238,-.108],[.26,-.03],[.268,.056],[.264,.136],[.256,.192],[.272,.248],[.286,.3],[.29,.345],[.272,.388],[.206,.424],[.124,.448],[0,.46]];
const curve=new T.CatmullRomCurve3(profile.map(([r,y])=>new T.Vector3(r*.93,y,0)),false,'centripetal');
const points=curve.getPoints(240).map(p=>new T.Vector2(Math.max(0,p.x),p.y));
const geometry=new T.LatheGeometry(points,160);const position=geometry.attributes.position;
// Fit the recess to the actual rounded upper arm, with 2 mm clearance.
const armCapRadius=.100,socketRadius=armCapRadius+.002;
function smoothMin(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
for(let i=0;i<position.count;i++){
 const x=position.getX(i),y=position.getY(i),z=position.getZ(i),side=Math.sign(x);
 const capWeight=T.MathUtils.smoothstep(Math.abs(x),.10,.19);
 const upperLip=.026*Math.exp(-Math.pow((y-(socketY+.083))/.035,2)-Math.pow((z-socketZ)/.108,2))*capWeight;
 let surface=Math.abs(x)+upperLip;
 const radial=socketRadius*socketRadius-(y-socketY)**2-(z-socketZ)**2;
 if(radial>0){const innerWall=shoulderContact.x-Math.sqrt(radial);surface=smoothMin(surface,innerWall,.006);}
 position.setX(i,side*surface);
const lowerWeight=1-T.MathUtils.smoothstep(y,-.13,.015);
const legSocket=.12*Math.exp(-Math.pow((Math.abs(x)-.15)/.082,2)-Math.pow((z-.025)/.105,2))*lowerWeight;
position.setY(i,y+legSocket);}
geometry.computeVertexNormals();geometry.computeBoundingBox();

rig.torso.children[0].geometry=geometry;rig.torso.children[0].name='socket-torso';
const handParts=[],forearmParts=[],lowerArmParts=[];
// Build the accepted pair once; mirror it for the opposite side so both
// thumbs point forward and both palms face the body.
const acceptedPair=createForearmHandAssembly(rig.elbowRight.children[0].material);
for(const [elbow,side] of [[rig.elbowLeft,-1],[rig.elbowRight,1]]){
 elbow.rotation.x=-.22;
 const oldForearm=elbow.children[0],oldHand=elbow.children[1];
 const assembly=side===1?acceptedPair.assembly:acceptedPair.assembly.clone(true);
 const forearm=assembly.getObjectByName('isolated-forearm');
 const hand=assembly.getObjectByName('isolated-emoji-hand');
 const mount=new T.Group();mount.name=side===1?'right-lower-arm':'left-lower-arm';
 mount.scale.x=side;
 mount.add(assembly);
 // Preserve the accepted elbow contact height from the previous avatar.
 const foreTop=oldForearm.position.y+assembly.userData.unscaledForearmTop;
 mount.position.y=foreTop-forearm.geometry.boundingBox.max.y;
 elbow.remove(oldHand,oldForearm);
 elbow.add(mount);
 forearm.name='forearm-hand-socket';
 hand.name=side===1?'right-emoji-hand':'left-emoji-hand';
 handParts.push(hand);forearmParts.push(forearm);
 lowerArmParts.push({side,mount,assembly,forearm,hand});
}
for(const [hip,side] of [[rig.hipLeft,-1],[rig.hipRight,1]]){
 hip.position.x=side*.15;hip.position.z=.025;
 // Seat the rounded thigh tops just inside the existing hip recesses.
 hip.children[0].position.y=-.23;
 const foot=hip.children[1].children[1].children[0];foot.position.z+=.04;foot.name='forward-foot';
}
rig.head.name='original-head';rig.torso.children[1].name='original-neck';scene.add(rig.root);
rig.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(rig.root);const centre=bounds.getCenter(new T.Vector3());rig.root.position.sub(centre);
const cam=new T.PerspectiveCamera(36,1,.01,30);cam.position.set(2.2,.65,4.0);
const controls=new OrbitControls(cam,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.4;controls.maxDistance=8;controls.target.set(0,0,0);controls.update();
scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,1.8));const sun=new T.DirectionalLight(0xffffff,2.6);sun.position.set(-3,7,5);scene.add(sun);const fill=new T.DirectionalLight(0xffffff,.7);fill.position.set(4,1,-3);scene.add(fill);const lowerFill=new T.DirectionalLight(0xffffff,.7);lowerFill.position.set(-2,-4,3);scene.add(lowerFill);
function resize(){cam.aspect=innerWidth/innerHeight;cam.fov=cam.aspect<.65?40:36;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
const views={front:[0,.10,4.3],side:[4.3,.10,0],back:[0,.10,-4.3],top:[0,4.3,.001],bottom:[0,-4.3,.001],reset:[2.2,.65,4.0]};
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{controls.reset();cam.position.set(...views[button.dataset.view]);controls.target.set(0,0,0);controls.update();};
const toggle=document.querySelector('#hand-toggle');toggle.onclick=()=>{const visible=!handParts[0].visible;for(const part of handParts)part.visible=visible;toggle.textContent=visible?'Hide hands':'Show hands';toggle.setAttribute('aria-pressed',String(!visible));};
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,cam);});
window.viewer={scene,cam,controls,rig,handParts,forearmParts,lowerArmParts,assembled:true,shoulderContact,socketY,socketZ,socketRadius,armCapRadius};window.ready=true;
