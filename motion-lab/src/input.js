// The only input translator used by the universal Motion Lab template.
export const INPUT_DEAD_ZONE=.12;
export function radialStick(x=0,y=0,deadZone=INPUT_DEAD_ZONE){
 const length=Math.hypot(x,y);if(length<=deadZone)return {x:0,y:0,strength:0};
 const strength=Math.min(1,(length-deadZone)/(1-deadZone));return {x:x/length*strength,y:y/length*strength,strength};
}
export function createInput(canvas){return new LabInput(canvas);}
class LabInput{
 constructor(canvas){
  this.canvas=canvas;this.keys=new Set();this.pointers=new Map();this.look={x:0,y:0};this.zoom=0;this.enabled=true;this.focused=true;this.last={moveX:0,moveZ:0,strength:0,look:{x:0,y:0},zoom:0,source:'none'};
  this.stick=null;this.pinch=null;this.radius=56;this.actions={brake:false,boost:false};
  this.base=document.createElement('div');this.base.className='input-stick';this.base.hidden=true;this.base.setAttribute('aria-hidden','true');this.knob=document.createElement('span');this.base.append(this.knob);canvas.parentElement.append(this.base);
  const codes=['KeyE','KeyS','KeyD','KeyF','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','KeyJ','KeyL','KeyI','KeyK','Space','ShiftLeft','ShiftRight'];
  window.addEventListener('keydown',event=>{if(!this.enabled||event.target.closest?.('input,textarea,select,video,[contenteditable=true]'))return;if(event.code==='Space'&&event.target.closest?.('button'))return;if(codes.includes(event.code)){event.preventDefault();this.keys.add(event.code);}});
  window.addEventListener('keyup',event=>this.keys.delete(event.code));
  window.addEventListener('blur',()=>{this.focused=false;this.reset();});window.addEventListener('focus',()=>{this.focused=true;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
  canvas.addEventListener('pointerdown',event=>this.down(event));canvas.addEventListener('pointermove',event=>this.drag(event));
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>this.up(event));
  canvas.addEventListener('wheel',event=>{if(!this.enabled)return;event.preventDefault();this.zoom+=event.deltaY*.0015;},{passive:false});
  canvas.addEventListener('contextmenu',event=>event.preventDefault());
 }
 setAction(name,value){if(name in this.actions)this.actions[name]=Boolean(value);}
 setEnabled(value){if(this.enabled&&!value)this.reset();this.enabled=value;}
 reset(){this.actions.brake=this.actions.boost=false;this.keys.clear();this.pointers.clear();this.stick=null;this.pinch=null;this.base.hidden=true;this.look.x=this.look.y=this.zoom=0;this.last={moveX:0,moveZ:0,strength:0,look:{x:0,y:0},zoom:0,source:'none'};}
 down(event){
  if(!this.enabled)return;event.preventDefault();this.canvas.setPointerCapture(event.pointerId);
  const rect=this.canvas.getBoundingClientRect(),p={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,touch:event.pointerType!=='mouse',role:'look'};
  if(p.touch&&p.x<rect.left+rect.width/2&&!this.stick){p.role='stick';this.stick=p;this.base.hidden=false;this.base.style.left=(p.x-rect.left)+'px';this.base.style.top=(p.y-rect.top)+'px';this.knob.style.transform='translate(-50%,-50%)';}
  this.pointers.set(p.id,p);const touches=[...this.pointers.values()].filter(q=>q.touch);
  if(touches.length===2&&(!this.stick||Math.hypot(this.stick.x-this.stick.startX,this.stick.y-this.stick.startY)<6)){
   this.pinch={ids:touches.map(q=>q.id),distance:Math.hypot(touches[0].x-touches[1].x,touches[0].y-touches[1].y)};for(const q of touches)q.role='pinch';this.stick=null;this.base.hidden=true;this.look.x=this.look.y=0;
  }
 }
 drag(event){
  const p=this.pointers.get(event.pointerId);if(!p)return;const dx=event.clientX-p.x,dy=event.clientY-p.y;p.x=event.clientX;p.y=event.clientY;
  if(this.pinch){const [a,b]=this.pinch.ids.map(id=>this.pointers.get(id));if(a&&b){const distance=Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));this.zoom+=Math.log(Math.max(1,this.pinch.distance)/distance);this.pinch.distance=distance;}return;}
  if(p.role==='stick'){const x=p.x-p.startX,y=p.y-p.startY,k=Math.min(1,this.radius/Math.max(1,Math.hypot(x,y)));this.knob.style.transform=`translate(calc(-50% + ${x*k}px),calc(-50% + ${y*k}px))`;}
  else{this.look.x+=dx*.005;this.look.y+=dy*.004;}
 }
 up(event){if(this.pinch?.ids.includes(event.pointerId)){this.pointers.clear();this.pinch=null;this.stick=null;this.base.hidden=true;return;}this.pointers.delete(event.pointerId);if(this.stick?.id===event.pointerId){this.stick=null;this.base.hidden=true;}}
 sample(dt,cameraYaw){
  if(!this.enabled||!this.focused||document.hidden)return this.last={moveX:0,moveZ:0,strength:0,look:{x:0,y:0},zoom:0,source:'none'};
  const key=code=>this.keys.has(code)?1:0;
  let x=key('KeyF')+key('ArrowRight')-key('KeyS')-key('ArrowLeft'),y=key('KeyE')+key('ArrowUp')-key('KeyD')-key('ArrowDown'),strength=Math.min(1,Math.hypot(x,y)),source=strength?'keyboard':'none';
  if(strength){const length=Math.hypot(x,y);x/=length;y/=length;}
  const touch=this.stick?radialStick((this.stick.x-this.stick.startX)/this.radius,-(this.stick.y-this.stick.startY)/this.radius):{x:0,y:0,strength:0};
  if(touch.strength>strength){({x,y,strength}=touch);source='touch';}
  let padLook={x:0,y:0,strength:0},padBrake=false,padBoost=false;
  let pads=[];try{pads=navigator.getGamepads?.()||[];}catch{}
  for(const pad of pads){if(!pad?.connected)continue;padBrake||=(pad.buttons?.[6]?.value??0)>.15;padBoost||=Boolean(pad.buttons?.[0]?.pressed);const left=radialStick(pad.axes[0],-(pad.axes[1]||0)),right=radialStick(pad.axes[2],pad.axes[3]);if(left.strength>strength){({x,y,strength}=left);source='gamepad';}if(right.strength>padLook.strength)padLook=right;}
  const look={x:this.look.x+(key('KeyL')-key('KeyJ'))*2.2*dt+padLook.x*2.2*dt,y:this.look.y+(key('KeyK')-key('KeyI'))*1.6*dt+padLook.y*1.6*dt},zoom=this.zoom;
  const heading=cameraYaw-look.x;this.look.x=this.look.y=this.zoom=0;
  return this.last={moveX:-Math.sin(heading)*y+Math.cos(heading)*x,moveZ:-Math.cos(heading)*y-Math.sin(heading)*x,strength,look,zoom,source,actions:{brake:this.actions.brake||this.keys.has('Space')||padBrake,boost:this.actions.boost||this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')||padBoost}};
 }
 getState(){return {...this.last,look:{...this.last.look},pointers:this.pointers.size};}
}
