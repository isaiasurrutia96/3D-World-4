// Keyboard (E S D F or arrows move, J L I K turn the camera), mouse drag to
// look, wheel to zoom. Touch: left half is a floating stick, right half looks.
export function createInput(canvas){
 const keys=new Set(),move={x:0,y:0},look={x:0,y:0};let zoom=0,stick=null,lookP=null,drag=null;
 addEventListener('keydown',e=>{if(e.code.startsWith('Arrow'))e.preventDefault();keys.add(e.code);});
 addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();stick=lookP=drag=null;show();});
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom+=e.deltaY*.0015;},{passive:false});
 const base=document.createElement('div'),knob=document.createElement('div');
 for(const [el,s] of [[base,120],[knob,56]]){Object.assign(el.style,{position:'fixed',width:s+'px',height:s+'px',borderRadius:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',display:'none',background:s>100?'rgba(255,255,255,.12)':'rgba(255,255,255,.4)',border:s>100?'2px solid rgba(255,255,255,.3)':'0'});document.body.append(el);}
 function show(){base.style.display=knob.style.display=stick?'block':'none';if(!stick)return;let dx=stick.x-stick.x0,dy=stick.y-stick.y0;const l=Math.hypot(dx,dy);if(l>50){dx*=50/l;dy*=50/l;}
  base.style.left=stick.x0+'px';base.style.top=stick.y0+'px';knob.style.left=stick.x0+dx+'px';knob.style.top=stick.y0+dy+'px';}
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);
  if(e.pointerType==='mouse'){drag={x:e.clientX,y:e.clientY};return;}
  const r=canvas.getBoundingClientRect();
  if(e.clientX<r.left+r.width/2&&!stick){stick={id:e.pointerId,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY};show();}
  else if(!lookP)lookP={id:e.pointerId,x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'){if(drag){look.x+=(e.clientX-drag.x)*.006;look.y+=(e.clientY-drag.y)*.006;drag={x:e.clientX,y:e.clientY};}return;}
  if(stick&&e.pointerId===stick.id){stick.x=e.clientX;stick.y=e.clientY;show();}
  else if(lookP&&e.pointerId===lookP.id){look.x+=(e.clientX-lookP.x)*.008;look.y+=(e.clientY-lookP.y)*.008;lookP.x=e.clientX;lookP.y=e.clientY;}});
 const up=e=>{if(e.pointerType==='mouse')drag=null;if(stick&&e.pointerId===stick.id){stick=null;show();}if(lookP&&e.pointerId===lookP.id)lookP=null;};
 canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 return {move,look,get zoom(){return zoom;},update(dt){
  let x=0,y=0;
  if(keys.has('KeyE')||keys.has('ArrowUp'))y+=1;if(keys.has('KeyD')||keys.has('ArrowDown'))y-=1;
  if(keys.has('KeyS')||keys.has('ArrowLeft'))x-=1;if(keys.has('KeyF')||keys.has('ArrowRight'))x+=1;
  if(x||y){const l=Math.hypot(x,y);x/=l;y/=l;}
  else if(stick){const dx=(stick.x-stick.x0)/50,dy=(stick.y-stick.y0)/50,l=Math.hypot(dx,dy),a=l<.1?0:Math.min(1,(l-.1)/.9);x=l?dx/l*a:0;y=l?-dy/l*a:0;}
  move.x=x;move.y=y;const t=2.2*dt;
  if(keys.has('KeyJ'))look.x-=t;if(keys.has('KeyL'))look.x+=t;if(keys.has('KeyI'))look.y-=t;if(keys.has('KeyK'))look.y+=t;
 },endFrame(){look.x=look.y=0;zoom=0;}};
}
