export class MovementInput{
 constructor(canvas){
  this.canvas=canvas;this.move={x:0,y:0};this.look={x:0,y:0};this.zoom=0;this.keys=new Set();this.stick=null;this.cameraPointer=null;this.radius=56;
  this.base=document.createElement('div');this.base.id='joystick';this.base.setAttribute('aria-hidden','true');this.base.hidden=true;this.knob=document.createElement('div');this.knob.className='knob';this.base.append(this.knob);document.body.append(this.base);
  canvas.addEventListener('pointerdown',e=>this.down(e));canvas.addEventListener('pointermove',e=>this.drag(e));for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>this.up(e));
  canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom+=e.deltaY*.002;},{passive:false});
  window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);});window.addEventListener('keyup',e=>this.keys.delete(e.code));
  window.addEventListener('blur',()=>this.release());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.release();});
 }
 down(e){
  e.preventDefault();this.canvas.setPointerCapture(e.pointerId);
  if(e.pointerType!=='mouse'&&e.clientX<innerWidth/2&&!this.stick){this.stick={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0};this.base.style.left=e.clientX+'px';this.base.style.top=e.clientY+'px';this.base.hidden=false;this.knob.style.transform='translate(-50%,-50%)';}
  else if(!this.cameraPointer)this.cameraPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
 }
 drag(e){
  if(this.stick?.id===e.pointerId){const s=this.stick;s.dx=e.clientX-s.x;s.dy=e.clientY-s.y;const scale=Math.min(1,this.radius/Math.max(1,Math.hypot(s.dx,s.dy)));this.knob.style.transform=`translate(calc(-50% + ${s.dx*scale}px),calc(-50% + ${s.dy*scale}px))`;}
  else if(this.cameraPointer?.id===e.pointerId){this.look.x+=(e.clientX-this.cameraPointer.x)*.006;this.look.y+=(e.clientY-this.cameraPointer.y)*.005;this.cameraPointer.x=e.clientX;this.cameraPointer.y=e.clientY;}
 }
 up(e){if(this.stick?.id===e.pointerId){this.stick=null;this.base.hidden=true;}if(this.cameraPointer?.id===e.pointerId)this.cameraPointer=null;}
 release(){this.keys.clear();this.stick=null;this.cameraPointer=null;this.base.hidden=true;this.move.x=this.move.y=0;this.look.x=this.look.y=0;}
 update(){
  let x=0,y=0;if(this.keys.has('KeyW')||this.keys.has('ArrowUp'))y++;if(this.keys.has('KeyS')||this.keys.has('ArrowDown'))y--;if(this.keys.has('KeyD')||this.keys.has('ArrowRight'))x++;if(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))x--;
  if(x||y){const scale=(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?1:.48)/Math.hypot(x,y);x*=scale;y*=scale;}
  else if(this.stick){const {dx,dy}=this.stick,r=Math.hypot(dx,dy)/this.radius,amount=r<=.10?0:Math.min(1,(r-.10)/.90);if(r){x=dx/(r*this.radius)*amount;y=-dy/(r*this.radius)*amount;}}
  this.move.x=x;this.move.y=y;return this.move;
 }
 consumeLook(){const value={x:this.look.x,y:this.look.y,zoom:this.zoom};this.look.x=this.look.y=this.zoom=0;return value;}
}
