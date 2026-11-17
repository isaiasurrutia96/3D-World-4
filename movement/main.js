import * as T from 'three';
import {GroundedMovement,TUNING} from './controller.js';
import {MovementInput} from './input.js';

async function start(){
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.body.prepend(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#405363');scene.fog=new T.Fog('#405363',38,85);
 // A single, stationary dark-grey slab. Very faint metre lines make planted
 // feet readable without adding any objects to the running area.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#484a4e';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#434549';ctx.lineWidth=1;ctx.strokeRect(.5,.5,127,127);
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(TUNING.slabSize,TUNING.slabSize);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const top=new T.MeshStandardMaterial({color:0xffffff,map:texture,roughness:.95}),side=new T.MeshStandardMaterial({color:'#37393d',roughness:.95});
 const slab=new T.Mesh(new T.BoxGeometry(TUNING.slabSize,.8,TUNING.slabSize),[side,side,top,side,side,side]);slab.position.y=-.4;slab.receiveShadow=true;scene.add(slab);
 const player=new GroundedMovement();scene.add(player.root);
 scene.add(new T.HemisphereLight(0xffffff,0x9fa6b0,1.7));
 const sun=new T.DirectionalLight(0xffffff,2.5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.2,far:18});sun.shadow.bias=-.00018;sun.shadow.normalBias=.003;scene.add(sun,sun.target);
 const fill=new T.DirectionalLight(0xffffff,.65);fill.position.set(4,3,-4);scene.add(fill);
 const camera=new T.PerspectiveCamera(50,1,.05,140),input=new MovementInput(renderer.domElement),follow=new T.Vector3(0,1.0,0);let yaw=Math.PI,pitch=.30,distance=5.0,override=null;
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
 const debug=new URLSearchParams(location.search).has('debug'),markers=debug?player.legs.map(()=>{const m=new T.Mesh(new T.RingGeometry(.025,.041,20),new T.MeshBasicMaterial({color:'#80ed9a',side:T.DoubleSide}));m.rotation.x=-Math.PI/2;scene.add(m);return m;}):[];
 const status=document.querySelector('#status');let last=0,accumulator=0;
 renderer.setAnimationLoop(ms=>{
  const dt=Math.min(.05,last?(ms-last)/1000:1/60);last=ms;
  const look=input.consumeLook();yaw-=look.x;pitch=T.MathUtils.clamp(pitch+look.y,.12,1.05);distance=T.MathUtils.clamp(distance*(1+look.zoom),3.0,9.0);
  const stick=override||input.update(),fx=-Math.sin(yaw),fz=-Math.cos(yaw),x=fx*stick.y-fz*stick.x,z=fz*stick.y+fx*stick.x;
  accumulator+=dt;while(accumulator>=1/120){player.step(1/120,x,z);accumulator-=1/120;}player.pose(dt);
  follow.x=T.MathUtils.damp(follow.x,player.position.x,8,dt);follow.z=T.MathUtils.damp(follow.z,player.position.z,8,dt);
  camera.fov=(camera.aspect<.8?60:50)+player.runBlend*3;camera.updateProjectionMatrix();camera.position.set(follow.x+Math.sin(yaw)*Math.cos(pitch)*distance,follow.y+Math.sin(pitch)*distance,follow.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(follow);
  sun.position.set(player.position.x-3,6,player.position.z+4);sun.target.position.set(player.position.x,.8,player.position.z);
  for(let i=0;i<markers.length;i++){const leg=player.legs[i];markers[i].visible=leg.planted;if(leg.probeAnchor)markers[i].position.set(leg.probeAnchor.x,.006,leg.probeAnchor.z);}
  const label=player.speed<.04?'Standing':player.speed>3?'Running':'Walking';if(status.textContent!==label)status.textContent=label;
  renderer.render(scene,camera);
 });
 window.movement={player,input,scene,camera,slab,getState:()=>({...player.getState(),camera:{yaw,pitch,distance},stick:input.stick?{x:input.stick.x,y:input.stick.y}:null}),setIntent:(x,y)=>{override=x===null?null:{x,y};},setCamera:(y,p,d)=>{yaw=y;pitch=p;distance=d;}};
 document.querySelector('#loading').hidden=true;window.movementReady=true;
}
start().catch(error=>{console.error(error);document.querySelector('#loading').textContent='The movement test could not open. Please reload to try again.';});
