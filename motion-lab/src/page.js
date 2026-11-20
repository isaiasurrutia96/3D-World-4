import * as T from 'three';
import {createMoveController} from '../../motion-core/controller.js';
import {createInput} from './input.js';
import {bindStageActivity} from './page-activity.js';
import {updateFollowTarget} from './camera-follow.js';
import {protectPage} from '../../public/test-lab/interactions.js';
import {installTestLabScene} from '../../src/test-lab-scene.ts';
export function createMotionLab({title,section,videos=[],createSimulation=null,helpText=null}){
 protectPage(window);document.title=title;document.querySelector('#lab-title').textContent=title;document.querySelector('#section-name').textContent=section;
 if(helpText)document.querySelector('#test-videos .help').textContent=helpText;
 const videoCards=document.querySelector('#video-cards');
 for(const entry of videos){const card=document.createElement('article'),video=document.createElement('video'),heading=document.createElement('h3'),description=document.createElement('p'),tag=document.createElement('span');video.src=entry.src;video.controls=true;video.playsInline=true;video.muted=true;video.preload='metadata';video.setAttribute('aria-label',entry.title);heading.textContent=entry.title;description.textContent=entry.description;tag.textContent=entry.passed?'Passed':'Pending';tag.className='passed';card.append(video,heading,description,tag);videoCards.append(card);}
 const stage=document.querySelector('#stage'),topbar=document.querySelector('#topbar');
 const syncBar=()=>document.documentElement.style.setProperty('--bar-height',topbar.getBoundingClientRect().height+'px');new ResizeObserver(syncBar).observe(topbar);window.addEventListener('resize',syncBar);syncBar();
 const renderer=new T.WebGLRenderer({antialias:!matchMedia('(pointer:coarse)').matches,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));stage.prepend(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#405363');
 const floor=new T.Mesh(new T.BoxGeometry(200,.8,200),new T.MeshStandardMaterial({color:'#eeeae2',roughness:1}));floor.position.y=-.4;scene.add(floor);
 scene.add(new T.HemisphereLight(0xffffff,0xb4b7bb,1.5));const light=new T.DirectionalLight(0xffffff,1.6);light.position.set(-5,10,5);scene.add(light);
 const simulation=createSimulation?.({scene,renderer,stage,floor})||null;
 const marker=simulation?.marker||new T.Group();
 if(!simulation){const disc=new T.Mesh(new T.CylinderGeometry(.34,.34,.08,32),new T.MeshStandardMaterial({color:'#b9b2a6',roughness:.8}));disc.position.y=.045;marker.add(disc);marker.add(new T.ArrowHelper(new T.Vector3(0,0,1),new T.Vector3(0,.12,-.18),.95,0x333a3e,.24,.19));scene.add(marker);}
 const controller=simulation?.controller||createMoveController(),input=createInput(renderer.domElement),camera=new T.PerspectiveCamera(45,1,.05,simulation?20000:500),target=new T.Vector3(0,.1,0),inspectionOffset=new T.Vector3();let inspectionZoom=null;
 let yaw=Math.PI,pitch=.5,distance=simulation?.distance||10,last=0,active=true,viewName='back';
 const cameraRay=new T.Raycaster(),rayDirection=new T.Vector3();
 function resize(){const rect=stage.getBoundingClientRect();camera.aspect=Math.max(1,rect.width)/Math.max(1,rect.height);camera.updateProjectionMatrix();renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height));if(simulation?.fitDistance&&viewName!=='free')distance=simulation.fitDistance(camera.aspect,yaw,pitch);}new ResizeObserver(resize).observe(stage);resize();
 function setView(name){const views={back:[Math.PI,simulation?.chasePitch??.5],front:[0,.5],side:[Math.PI/2,.4],top:[Math.PI,Math.PI/2],angled:[Math.PI*.78,.6],...(simulation?.cameraRig?.views??{})};const entry=views[name];if(!entry)return;simulation?.cameraRig?.setView(name,camera);inspectionZoom?.setEnabled(simulation?.zoomEnabled!==false&&!simulation?.cameraRig?.handles(name));inspectionZoom?.reset();if(simulation?.fitDistance||simulation?.recenterOnView){inspectionOffset.set(0,0,0);const s=controller.state;target.set(s.x,(s.y||0)+(simulation?.targetHeight??.1),s.z);}yaw=controller.state.facing+entry[0];pitch=entry[1];if(simulation?.recenterOnView)distance=simulation.distance||10;if(simulation?.fitDistance)distance=simulation.fitDistance(camera.aspect,yaw,pitch);viewName=name;for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===name));}
 function reset(){const resetView=simulation?.cameraRig?.handles(viewName)?viewName:'back';inspectionZoom?.reset();inspectionOffset.set(0,0,0);input.reset();controller.place();const s=controller.state;target.set(s.x,(s.y||0)+(simulation?.targetHeight??.1),s.z);distance=simulation?.distance||10;setView(resetView);}
 for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>setView(button.dataset.view);document.querySelector('#reset').onclick=reset;
 function setActive(value){const next=value&&!document.hidden;if(next!==active){last=0;if(!next)simulation?.onPause?.();}active=next;input.setEnabled(active);}
 bindStageActivity({stage,topbar,input,setActive});
 function tick(seconds){
  const inputYaw=yaw,controls=input.sample(seconds,yaw);yaw-=controls.look.x;pitch=T.MathUtils.clamp(pitch+controls.look.y,.08,Math.PI/2);distance=T.MathUtils.clamp(distance*Math.exp(simulation?.zoomEnabled===false?0:controls.zoom),simulation?.minDistance??3,simulation?.maxDistance??30);
  if((controls.look.x||controls.look.y)&&!simulation?.cameraRig?.handles(viewName)){viewName='free';for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed','false');}
  if(simulation)simulation.advance(seconds,controls,inputYaw);else controller.advance(seconds,controls.moveX,controls.moveZ);const state=controller.state;
  marker.position.set(state.x,state.y||0,state.z);marker.rotation.set(state.pitch||0,state.facing,state.bank||0);
  // The plain test slab grows if a long test travels beyond its starting area.
  if(!simulation){floor.scale.x=Math.max(1,Math.ceil((Math.abs(state.x)+50)/100));floor.scale.z=Math.max(1,Math.ceil((Math.abs(state.z)+50)/100));}
  updateFollowTarget(target,state,seconds,simulation,inspectionOffset);
  if(simulation?.chase&&viewName==='back')yaw+=Math.atan2(Math.sin(state.facing+Math.PI-yaw),Math.cos(state.facing+Math.PI-yaw))*(1-Math.exp(-(simulation.chaseRate??8)*seconds));
  camera.fov=simulation?.fov??(simulation?60+Math.min(6,Math.max(0,state.speed)/10):45);camera.updateProjectionMatrix();
  camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.up.set(0,pitch>1.55?0:1,pitch>1.55?-1:0);camera.lookAt(target);camera.updateMatrixWorld(true);
  const customCamera=Boolean(simulation?.cameraRig?.handles(viewName));if(customCamera)simulation.cameraRig.update({camera,controls,seconds,state});
  if(!customCamera&&simulation?.cameraObstacles?.length){rayDirection.copy(camera.position).sub(target);const full=rayDirection.length();cameraRay.set(target,rayDirection.normalize());cameraRay.near=.2;cameraRay.far=full;const hit=cameraRay.intersectObjects(simulation.cameraObstacles,false)[0];if(hit)camera.position.copy(target).addScaledVector(rayDirection,Math.max(.5,hit.distance-.35));camera.lookAt(target);camera.updateMatrixWorld(true);}
  document.querySelector('#status').textContent=`${state.mode} · ${state.speed.toFixed(1)} m/s · ${Math.round(controls.strength*100)}% input · ${state.x.toFixed(1)}, ${state.z.toFixed(1)} m`;
  simulation?.afterFrame?.(seconds);renderer.render(scene,camera);
 }
 renderer.setAnimationLoop(ms=>{const dt=Math.min(simulation?.maxFrameSeconds??.05,last?(ms-last)/1000:1/60);last=ms;if(active)tick(dt);});
 simulation?.bind?.({input,camera,target,reset,setView,canvas:renderer.domElement});if(simulation)reset();
 inspectionZoom=installTestLabScene({scene,camera,renderer,floors:simulation?[]:[floor],createFloor:!simulation,getTarget:()=>target,canPinch:()=>Boolean(input.pinch),onTargetShift:shift=>inspectionOffset.add(shift),onFocusDistance:value=>{distance=value;}});
 window.motionLab={controller,input,zoom:inspectionZoom,marker,floor,renderer,scene,camera,view:setView,setCamera:(y,p)=>{yaw=y;pitch=p;viewName='free';},reset,tick,getState:()=>({movement:{...controller.state},input:input.getState(),camera:{yaw,pitch,distance,view:viewName,target:target.toArray()},active})};
 window.motionLabReady=true;setView('back');
}
