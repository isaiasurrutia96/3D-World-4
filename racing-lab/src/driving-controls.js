import {createDrivingHolds} from './driving-holds.js';
/** Browser events feed a single ownership ledger; every contact ends globally. */
export function bindDrivingButtons(input, canvas, buttons) {
    const holds=createDrivingHolds(Object.keys(buttons),(name,down)=>{
        input.setAction(name,down); buttons[name].setAttribute('aria-pressed',String(down));
    });
    const removers=[];
    const on=(target,type,handler,options)=>{
        target.addEventListener(type,handler,options);
        removers.push(()=>target.removeEventListener(type,handler,options));
    };
    const enabled=()=>input.enabled!==false && !document.hidden;
    const touchPointers=new Map();
    function releasePointer(id,name) {
        holds.releasePointer(id,name);
        if (name===undefined || touchPointers.get(id)===name) touchPointers.delete(id);
    }
    function clear() { holds.clear(); touchPointers.clear(); }
    const endPointer=event=>releasePointer(event.pointerId);
    function endTouches(event) {
        if (!event.touches) return;
        // TouchEvent is an independent release fallback on mobile browsers.
        // Its stable start target tells us which buttons still have contact;
        // no unsafe assumption about Touch.identifier versus pointerId.
        const active=new Set();
        for (const touch of Array.from(event.touches)) for (const [name,button] of Object.entries(buttons)) {
            if (touch.target===button || button.contains?.(touch.target)) active.add(name);
        }
        for (const [id,name] of touchPointers) if (!active.has(name)) releasePointer(id,name);
    }
    // Capture-phase releases work outside the button and ahead of handlers
    // which stop propagation. One finger ending must not cancel another.
    on(window,'pointerup',endPointer,true);
    on(window,'pointercancel',endPointer,true);
    on(window,'pointerdown',event=>releasePointer(event.pointerId),true);
    on(window,'touchend',endTouches,{capture:true,passive:true});
    on(window,'touchcancel',endTouches,{capture:true,passive:true});
    on(window,'pointermove',event=>{
        if (event.pointerType==='mouse' && (event.buttons&1)===0) endPointer(event);
    },true);
    on(window,'keyup',event=>holds.releaseKey(event.code),true);
    for (const [name,button] of Object.entries(buttons)) {
        on(button,'pointerdown',event=>{
            if (!enabled() || event.pointerType==='mouse' && (event.button??0)!==0) return;
            event.preventDefault(); canvas.focus({preventScroll:true}); input.focused=true;
            // Capture is helpful, but a browser failing it must not throw out
            // the only release path or leave a half-updated action behind.
            try { button.setPointerCapture(event.pointerId); } catch { /* global release remains available */ }
            holds.pressPointer(name,event.pointerId);
            if (event.pointerType==='touch') touchPointers.set(event.pointerId,name);
        });
        on(button,'pointerup',endPointer);
        on(button,'pointercancel',endPointer);
        on(button,'lostpointercapture',event=>{
            // Ignore a delayed loss from an earlier contact when this button
            // has already captured a new contact with the reused pointer id.
            if (!button.hasPointerCapture?.(event.pointerId)) releasePointer(event.pointerId,name);
        });
        on(button,'keydown',event=>{
            if ((event.code==='Space' || event.code==='Enter') && enabled()) {
                event.preventDefault(); input.focused=true; holds.pressKey(name,event.code);
            }
        });
        on(button,'keyup',event=>{
            if (event.code==='Space' || event.code==='Enter') { event.preventDefault(); holds.releaseKey(event.code,name); }
        });
        on(button,'blur',()=>holds.blurButton(name));
    }
    on(window,'blur',clear);
    on(window,'pagehide',clear);
    on(document,'freeze',clear);
    on(document,'visibilitychange',()=>{ if (document.hidden) clear(); });
    function sync() {
        if (!enabled() || input.focused===false) clear();
        for (const [name,button] of Object.entries(buttons)) {
            // LabInput.reset() can run independently (pause/scroll/reset).
            // Reconcile its cleared actions so an old private token cannot
            // resurrect a hold when a new contact is released later.
            if (holds.isHeld(name) && !input.actions[name]) { holds.clearButton(name); for (const [id,owner] of touchPointers) if (owner===name) touchPointers.delete(id); }
            button.setAttribute('aria-pressed',String(Boolean(input.actions[name])));
        }
    }
    return Object.freeze({ clear, sync, getState:()=>holds.getState(),
        dispose() { clear(); for (const remove of removers.splice(0)) remove(); },
    });
}
