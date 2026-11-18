// Movement rules test (motion-core section 1). A simple marker you steer,
// driven only by motion-core/controller.js. The marker is a placeholder:
// Codex will design the real visuals later.
import {installTestLabScene} from '../src/test-lab-scene.ts';
import * as T from 'three';
import {MovementInput} from '../movement/input.js';
import {createMoveController} from '../motion-core/controller.js';

const SLAB=30;
const renderer=new T.WebGLRenderer({antialias:!matchMedia('(pointer:coarse)').matches});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));document.body.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363'); // no fog: the isometric camera sits far away and fog would hide everything

// Floor with faint 1 m lines so speed is readable.
const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#8f9295';g.fillRect(0,0,128,128);g.strokeStyle='#868a8d';g.lineWidth=2;g.strokeRect(1,1,126,126);
const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(SLAB,SLAB);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
const sideM=new T.MeshStandardMaterial({color:'#6f7275',roughness:1});
const slab=new T.Mesh(new T.BoxGeometry(SLAB,.8,SLAB),[sideM,sideM,new T.MeshStandardMaterial({map:tex,roughness:1}),sideM,sideM,sideM]);slab.position.y=-.4;scene.add(slab);

// Marker: a disc with a pointer showing which way it faces, and a post for height.
const marker=new T.Group(),mat=new T.MeshStandardMaterial({color:'#f4f1e9',roughness:.6}),accent=new T.MeshStandardMaterial({color:'#e2683c',roughness:.5});
const disc=new T.Mesh(new T.CylinderGeometry(.32,.32,.06,40),mat);disc.position.y=.03;
const arrow=new T.Mesh(new T.ConeGeometry(.14,.34,24),accent);arrow.rotation.x=Math.PI/2;arrow.position.set(0,.08,.34);
const post=new T.Mesh(new T.CylinderGeometry(.05,.05,1.1,16),mat);post.position.y=.6;
const head=new T.Mesh(new T.SphereGeometry(.12,24,16),accent);head.position.set(0,1.18,0);
marker.add(disc,arrow,post,head);scene.add(marker);

scene.add(new T.HemisphereLight(0xffffff,0x9fa6b0,1.8));
const sun=new T.DirectionalLight(0xffffff,2.2);scene.add(sun,sun.target);

const move=createMoveController(),input=new MovementInput(renderer.domElement);
const camera=new T.PerspectiveCamera(50,1,.05,160),follow=new T.Vector3(0,.8,0);let yaw=Math.PI,pitch=.42,distance=7,override=null;
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();

// Game controllers (Xbox, PlayStation, Switch): left stick moves, right stick looks.
const dead=v=>Math.abs(v)<.15?0:Math.sign(v)*(Math.abs(v)-.15)/.85;
function gamepad(){for(const p of navigator.getGamepads?.()??[]){if(!p)continue;const x=dead(p.axes[0]??0),y=-dead(p.axes[1]??0),lx=dead(p.axes[2]??0),ly=dead(p.axes[3]??0);const l=Math.hypot(x,y);
 return {move:l>1?{x:x/l,y:y/l}:{x,y},look:{x:lx,y:ly}};}return null;}

const status=document.querySelector('#status'),names={idle:'Standing',walk:'Walking',run:'Running',skid:'Skidding',brake:'Braking'};let last=0;
renderer.setAnimationLoop(ms=>{
 const dt=Math.min(.05,last?(ms-last)/1000:1/60);last=ms;
 const look=input.consumeLook(),pad=gamepad();yaw-=look.x+(pad?pad.look.x*2.4*dt:0);pitch=T.MathUtils.clamp(pitch+look.y+(pad?pad.look.y*1.6*dt:0),.05,Math.PI/2-.05);distance=T.MathUtils.clamp(distance*(1+look.zoom),3,20);
 let stick=override||input.update();if(!override&&pad&&(pad.move.x||pad.move.y)&&!stick.x&&!stick.y)stick=pad.move;
 const fx=-Math.sin(yaw),fz=-Math.cos(yaw),s=move.advance(dt,fx*stick.y-fz*stick.x,fz*stick.y+fx*stick.x);
 if(Math.abs(s.x)>SLAB/2-1||Math.abs(s.z)>SLAB/2-1)move.place(0,0,s.facing); // off the slab: back to the middle
 marker.position.set(s.x,0,s.z);marker.rotation.y=s.facing;
 follow.x=T.MathUtils.damp(follow.x,s.x,8,dt);follow.z=T.MathUtils.damp(follow.z,s.z,8,dt);
 camera.position.set(follow.x+Math.sin(yaw)*Math.cos(pitch)*distance,follow.y+Math.sin(pitch)*distance,follow.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(follow);
 sun.position.set(s.x-4,8,s.z+5);sun.target.position.set(s.x,0,s.z);
 const label=`${names[s.mode]} · ${s.speed.toFixed(1)} m/s`;if(status.textContent!==label)status.textContent=label;
 renderer.render(scene,camera);
});
const player={get facing(){return move.state.facing;},get position(){return {x:move.state.x,y:0,z:move.state.z};}};
window.movement={player,input,scene,camera,move,getState:()=>({...move.state,camera:{yaw,pitch,distance}}),setIntent:(x,y)=>{override=x===null?null:{x,y};},setCamera:(y,p,d)=>{yaw=y;pitch=p;distance=Math.max(d,6);}};
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>follow});
document.querySelector('#loading').hidden=true;window.rulesTestReady=true;
