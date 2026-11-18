import * as T from 'three';
import {createTrack,TRACK_IDS} from '../../racing-core/track/index.ts';
import {createCheckedTrackView,createStartLine} from './checked-track-view.js';
export function createTrackPreview({scene,stage,floor}){
 document.body.classList.add('track-preview-page');floor.visible=false;
 const label=document.createElement('label');label.className='track-picker';label.innerHTML='Track <select id="race-track" aria-label="Choose track"></select>';document.querySelector('#topbar .identity').after(label);
 for(const id of TRACK_IDS){const option=document.createElement('option');option.value=id;option.textContent=createTrack(id).name;label.querySelector('select').append(option);}
 const facts=document.createElement('aside');facts.className='race-hud';facts.id='track-facts';stage.append(facts);
 let selected=TRACK_IDS.includes(new URLSearchParams(location.search).get('track'))?new URLSearchParams(location.search).get('track'):'original',track,view,startLine,bindings=null;
 const center=new T.Vector3(),marker=new T.Group(),state={x:0,y:0,z:0,facing:0,speed:0,mode:'Track inspection'};scene.add(marker);
 const api={marker,fov:45,distance:1000,minDistance:8,maxDistance:15000,targetHeight:0,fitDistance:(aspect,yaw,pitch)=>fitCamera(aspect,yaw,pitch),controller:{state,place:()=>load(selected)},advance(){},bind(value){bindings=value;value.input.setTouchStick(false);value.canvas.tabIndex=-1;},afterFrame(){if(bindings){const camera=bindings.camera;camera.near=Math.max(.05,camera.position.distanceTo(bindings.target??center)*.02);camera.far=Math.max(20000,camera.near*1000);camera.updateProjectionMatrix();}}};
 function fitCamera(aspect,yaw,pitch){
  const b=track.bounds,tanV=Math.tan(Math.PI/8)*.86,tanH=tanV*aspect,sin=Math.sin(yaw),cos=Math.cos(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);let distance=8;
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const dx=x-center.x,dy=y-center.y,dz=z-center.z,h=dx*cos-dz*sin,v=-dx*sin*sp+dy*cp-dz*cos*sp,toward=dx*sin*cp+dy*sp+dz*cos*cp;distance=Math.max(distance,toward+Math.abs(h)/tanH,toward+Math.abs(v)/tanV);}
  return distance;
 }
 function fit(){const {width,height}=stage.getBoundingClientRect(),aspect=Math.max(.2,width/Math.max(1,height)),fov=Math.PI/4,horizontal=2*Math.atan(Math.tan(fov/2)*aspect),b=track.bounds,radius=Math.hypot(b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z)/2;api.distance=radius/Math.sin(Math.min(fov,horizontal)/2)*1.1;}
 function load(id){
  if(!TRACK_IDS.includes(id))throw Error('Unknown track');
  if(!track||track.id!==id){if(view){scene.remove(view.root,startLine);view.dispose();startLine.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});}track=createTrack(id);view=createCheckedTrackView(track);startLine=createStartLine(track);scene.add(view.root,startLine);}
  selected=id;label.querySelector('select').value=id;const b=track.bounds;center.set((b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,(b.min.z+b.max.z)/2);Object.assign(state,{x:center.x,y:center.y,z:center.z});fit();facts.textContent=`${track.name} · ${track.length.toLocaleString(undefined,{maximumFractionDigits:1})} m · Road width ${track.halfWidth*2} m`;
 }
 label.querySelector('select').onchange=()=>{selected=label.querySelector('select').value;bindings.reset();bindings.setView('angled');document.activeElement?.blur();};
 let previous='';new ResizeObserver(()=>{const r=stage.getBoundingClientRect(),key=r.width+'x'+r.height;if(key!==previous){previous=key;if(bindings){bindings.reset();bindings.setView('angled');}}}).observe(stage);
 load(selected);window.trackLab={get track(){return track;},get view(){return view;},selectTrack(id){selected=id;bindings.reset();bindings.setView('angled');},getState:()=>({trackId:track.id,accessBridge:track.accessBridge,seamMode:track.seamMode,seamGap:track.seamEdgeGap,roadSegments:track.segments.length,rails:track.rails.length,karts:0,avatars:0})};window.trackLabReady=true;return api;
}
