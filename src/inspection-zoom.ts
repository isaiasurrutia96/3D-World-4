import {Camera, Mesh, Object3D, PerspectiveCamera, Plane, Raycaster, Scene, Vector2, Vector3} from 'three';

/** Keep a world point at the requested screen position after native zoom/pan. */
export function keepZoomPoint(camera:Camera,baseCamera:Camera,target:Vector3,anchor:Vector3,plane:Plane,screen:Vector2):Vector3|null{
 camera.updateMatrixWorld(true);
 const ray=new Raycaster();ray.setFromCamera(screen,camera);
 const under=ray.ray.intersectPlane(plane,new Vector3());if(!under)return null;
 const shift=anchor.clone().sub(under);if(![shift.x,shift.y,shift.z].every(Number.isFinite))return null;
 target.add(shift);baseCamera.position.add(shift);if(camera!==baseCamera)camera.position.add(shift);
 baseCamera.updateMatrixWorld(true);camera.updateMatrixWorld(true);return shift;
}
export function pickZoomPoint(scene:Scene,camera:Camera,screen:Vector2,target:Vector3):Vector3{
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const ray=new Raycaster();ray.setFromCamera(screen,camera);
 for(const hit of ray.intersectObjects(scene.children,true)){
  if(!(hit.object instanceof Mesh))continue;let visible=true;
  for(let node:Object3D|null=hit.object;node;node=node.parent){if(!node.visible){visible=false;break;}}
  if(visible)return hit.point.clone();
 }
 const plane=new Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()),target);
 return ray.ray.intersectPlane(plane,new Vector3())??target.clone();
}
/** Put the orbit plane at the selected surface depth without moving the camera. */
export function focusZoomDepth(camera:Camera,target:Vector3,point:Vector3){
 if(!(camera instanceof PerspectiveCamera))return null;
 const direction=camera.getWorldDirection(new Vector3()),depth=point.clone().sub(camera.position).dot(direction);
 if(depth<=camera.near)return null;
 const shift=direction.multiplyScalar(point.clone().sub(target).dot(direction));target.add(shift);return {shift,distance:depth};
}
type Options={scene:Scene;camera:Camera;canvas:HTMLCanvasElement;getTarget:()=>Vector3;getCamera:()=>Camera;canPinch?:()=>boolean;onTargetShift?:(shift:Vector3)=>void;onFocusDistance?:(distance:number)=>void};
/** Observe existing controls; never replaces their move/look/zoom input handling. */
export function installInspectionZoom(options:Options){
 const {canvas}=options,pointers=new Map<number,{x:number;y:number}>();
 let anchor:{point:Vector3;plane:Plane;screen:Vector2;kind:'pinch'|'wheel';accepted:boolean;frames:number}|null=null;
 const screen=(x:number,y:number)=>{const r=canvas.getBoundingClientRect();return new Vector2((x-r.left)/Math.max(1,r.width)*2-1,1-(y-r.top)/Math.max(1,r.height)*2);};
 const midpoint=()=>{const p=[...pointers.values()];return screen((p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2);};
 function begin(position:Vector2,kind:'pinch'|'wheel'){
  const camera=options.getCamera(),target=options.getTarget(),point=pickZoomPoint(options.scene,camera,position,target);
  const focus=focusZoomDepth(camera,target,point);if(focus){options.onTargetShift?.(focus.shift);options.onFocusDistance?.(focus.distance);}
  anchor={point,plane:new Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()),point),screen:position,kind,accepted:kind==='wheel'||!options.canPinch,frames:2};
 }
 function accept(){if(anchor?.kind==='pinch'&&options.canPinch?.())anchor.accepted=true;}
 canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse')return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===2&&!options.canPinch)begin(midpoint(),'pinch');else if(pointers.size>2)anchor=null;},true);
 // The native input listener runs first and decides whether this is zoom or stick + look.
 canvas.addEventListener('pointerdown',()=>{if(pointers.size===2&&options.canPinch?.())begin(midpoint(),'pinch');});
 canvas.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===2&&anchor?.kind==='pinch'){accept();anchor.screen=midpoint();anchor.frames=2;}},true);
 canvas.addEventListener('pointerup',event=>{accept();pointers.delete(event.pointerId);if(anchor?.kind==='pinch')anchor.frames=2;},true);
 const reset=()=>{pointers.clear();anchor=null;};
 canvas.addEventListener('pointercancel',reset,true);
 canvas.addEventListener('wheel',event=>{if(event.deltaY){const position=screen(event.clientX,event.clientY);if(anchor?.kind==='wheel'&&anchor.screen.distanceToSquared(position)<1e-12)anchor.frames=2;else begin(position,'wheel');}},{capture:true,passive:true});
 window.addEventListener('blur',reset);window.addEventListener('resize',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 document.addEventListener('click',event=>{if((event.target as Element)?.closest?.('[data-view],#reset'))reset();},true);
 return {reset,getState:()=>({anchor:anchor?.point.toArray()??null,screen:anchor?.screen.toArray()??null}),apply(camera:Camera){
  if(!anchor)return;accept();const held=anchor.kind==='pinch'&&pointers.size===2;
  if(anchor.accepted){const shift=keepZoomPoint(camera,options.camera,options.getTarget(),anchor.point,anchor.plane,anchor.screen);if(shift)options.onTargetShift?.(shift);}
  if(!held&&--anchor.frames<=0)anchor=null;
 }};
}
