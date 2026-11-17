// Keep browser gestures separate from intentional model controls.
export function protectPage(w){
 const doc=w.document;
 let viewport=doc.querySelector('meta[name="viewport"]');
 if(!viewport){viewport=doc.createElement('meta');viewport.name='viewport';doc.head.append(viewport);}
 viewport.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
 const editable=target=>target?.closest?.('textarea,input:not([type=range]),[contenteditable=true]');
 for(const type of ['contextmenu','selectstart','dragstart'])doc.addEventListener(type,e=>{if(!editable(e.target))e.preventDefault();});
 for(const type of ['gesturestart','gesturechange','gestureend'])doc.addEventListener(type,e=>e.preventDefault(),{passive:false});
 doc.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
 doc.addEventListener('touchmove',e=>{if(e.touches.length>1&&!e.target.closest?.('canvas'))e.preventDefault();},{passive:false});
 const style=doc.createElement('style');style.textContent='html,body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior-x:none;touch-action:pan-y}canvas{touch-action:none}input,select,button{font-size:max(16px,1em)}textarea,input:not([type=range]),[contenteditable=true]{-webkit-user-select:text;user-select:text}';doc.head.append(style);
}
