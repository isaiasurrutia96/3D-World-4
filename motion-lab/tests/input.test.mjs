import assert from 'node:assert/strict';
import test from 'node:test';
import {createInput, radialStick} from '../src/input.js';

class Target extends EventTarget {
    style = {}; hidden = false; captured = new Set(); failCapture = false;
    append() {} setAttribute() {} closest() { return null; }
    getBoundingClientRect() { return {left:0,top:0,width:800,height:600}; }
    setPointerCapture(id) { if (this.failCapture) throw Error('Capture unavailable'); this.captured.add(id); }
    hasPointerCapture(id) { return this.captured.has(id); }
    releasePointerCapture(id) { this.captured.delete(id); }
}
function fixture(run) {
    const names=['window','document','navigator'],saved=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
    const win=new Target(),doc=new Target(),canvas=new Target();doc.hidden=false;doc.createElement=()=>new Target();canvas.parentElement=new Target();
    let pads=[];
    for(const [name,value] of Object.entries({window:win,document:doc,navigator:{getGamepads:()=>pads}}))Object.defineProperty(globalThis,name,{configurable:true,value});
    const input=createInput(canvas);
    // Event.target is read-only; let EventTarget supply it for actual controls.
    const emit=(target,type,fields={})=>{const event=new Event(type,{cancelable:true});Object.assign(event,fields);target.dispatchEvent(event);};
    const down=(id,x=80,y=300,pointerType='touch')=>emit(canvas,'pointerdown',{pointerId:id,pointerType,button:0,clientX:x,clientY:y});
    const drag=(id,x,y,fields={})=>emit(canvas,'pointermove',{pointerId:id,clientX:x,clientY:y,...fields});
    try { return run({win,doc,canvas,input,emit,down,drag,setPads:value=>{pads=value;}}); }
    finally { for(const name of names){if(saved[name])Object.defineProperty(globalThis,name,saved[name]);else delete globalThis[name];} }
}
function neutral(sample) {
    assert([sample.moveX,sample.moveZ,sample.strength,sample.look.x,sample.look.y,sample.zoom].every(value=>value===0));
    assert.equal(sample.source,'none');
    assert.deepEqual(sample.actions,{gas:false,reverse:false,left:false,right:false,brake:false,boost:false});
}

test('Every suspended input sample has the complete neutral action contract',()=>fixture(({input,doc})=>{
    for(const reason of ['disabled','unfocused','hidden']){
        input.enabled=true;input.focused=true;doc.hidden=false;input.setAction('gas',true);
        if(reason==='disabled')input.setEnabled(false);
        if(reason==='unfocused')input.focused=false;
        if(reason==='hidden')doc.hidden=true;
        neutral(input.sample(1/60,0));
    }
}));
test('Current keyboard bindings retain direction and normalized diagonal strength',()=>fixture(({win,input,emit})=>{
    for(const [code,x,z] of [['KeyE',0,-1],['ArrowUp',0,-1],['KeyD',0,1],['ArrowDown',0,1],['KeyS',-1,0],['ArrowLeft',-1,0],['KeyF',1,0],['ArrowRight',1,0]]){
        input.reset();emit(win,'keydown',{code});const s=input.sample(1/60,0);assert(s.moveX===x);assert(s.moveZ===z);assert.equal(s.strength,1);emit(win,'keyup',{code});neutral(input.sample(1/60,0));
    }
    emit(win,'keydown',{code:'KeyE'});emit(win,'keydown',{code:'KeyF'});const s=input.sample(1/60,0);assert(Math.abs(Math.hypot(s.moveX,s.moveZ)-1)<1e-12);
    emit(win,'keydown',{code:'Space'});emit(win,'keydown',{code:'ShiftLeft'});const actions=input.sample(1/60,0).actions;assert(actions.brake&&actions.boost);
}));
test('Keyboard camera rotation is frame independent and applies to movement in the same sample',()=>fixture(({win,input,emit})=>{
    for(const fps of [30,60,120,144]){
        input.reset();emit(win,'keydown',{code:'KeyL'});let sum=0;
        for(let frame=0;frame<fps;frame++)sum+=input.sample(1/fps,0).look.x;
        assert(Math.abs(sum-2.2)<1e-12);
    }
    input.reset();emit(win,'keydown',{code:'KeyL'});emit(win,'keydown',{code:'KeyE'});const s=input.sample(.1,0);assert(Math.abs(s.moveX-Math.sin(.22))<1e-12);assert(Math.abs(s.moveZ+Math.cos(.22))<1e-12);
}));
test('Controls cannot accumulate new commands while hidden, disabled or unfocused',()=>fixture(({win,doc,input,emit})=>{
    for(const reason of ['disabled','unfocused','hidden']){
        input.enabled=true;input.focused=true;doc.hidden=false;input.reset();
        if(reason==='disabled')input.setEnabled(false);if(reason==='unfocused')input.focused=false;if(reason==='hidden')doc.hidden=true;
        emit(win,'keydown',{code:'KeyE'});input.setAction('gas',true);
        input.enabled=true;input.focused=true;doc.hidden=false;neutral(input.sample(1/60,0));
    }
}));
test('Page hide, freeze, blur, reset and disabling clear all input sources and captured contacts',()=>fixture(({win,doc,canvas,input,emit,down,drag})=>{
    for(const event of ['pagehide','freeze','blur','hidden','reset','disabled']){
        input.enabled=true;input.focused=true;doc.hidden=false;
        emit(win,'keydown',{code:'KeyE'});input.setAction('gas',true);down(7);drag(7,80,240);assert(input.sample(1/60,0).strength>0);
        if(event==='reset')input.reset();else if(event==='disabled')input.setEnabled(false);else if(event==='hidden'){doc.hidden=true;emit(doc,'visibilitychange');}else emit(event==='freeze'?doc:win,event);
        input.enabled=true;input.focused=true;doc.hidden=false;neutral(input.sample(1/60,0));assert.equal(input.pointers.size,0);assert.equal(canvas.captured.size,0,event);
    }
}));
test('Failed pointer capture still allows a gesture and a global release ends it',()=>fixture(({win,canvas,input,emit,down,drag})=>{
    canvas.failCapture=true;assert.doesNotThrow(()=>input.down({pointerId:8,pointerType:'touch',clientX:80,clientY:300,preventDefault(){}}));
    drag(8,80,240);assert.equal(input.sample(1/60,0).source,'touch');emit(win,'pointerup',{pointerId:8});neutral(input.sample(1/60,0));
}));
test('Releasing a canvas stick globally keeps the independent look finger',()=>fixture(({win,input,emit,down,drag})=>{
    down(1);drag(1,80,240);down(2,600,300);assert.equal(input.pointers.size,2);
    emit(win,'pointercancel',{pointerId:1});assert.equal(input.pointers.size,1);drag(2,630,310);const s=input.sample(1/60,0);assert.equal(s.strength,0);assert(s.look.x>0);emit(win,'pointerup',{pointerId:2});neutral(input.sample(1/60,0));
}));
test('Delayed old capture loss cannot cancel a fresh contact with a reused pointer ID',()=>fixture(({win,canvas,input,emit,down,drag})=>{
    down(9);emit(win,'pointerup',{pointerId:9});down(9);drag(9,80,240);emit(canvas,'lostpointercapture',{pointerId:9});assert.equal(input.sample(1/60,0).strength,1);
    canvas.captured.delete(9);emit(canvas,'lostpointercapture',{pointerId:9});neutral(input.sample(1/60,0));
}));
test('Mouse look preserves existing buttons and ends when no mouse button remains held',()=>fixture(({win,canvas,input,emit,drag})=>{
    for(const [button,buttons] of [[0,1],[1,4],[2,2]]){
        emit(canvas,'pointerdown',{pointerId:2,pointerType:'mouse',button,clientX:500,clientY:300});
        emit(win,'pointermove',{pointerId:2,pointerType:'mouse',buttons});drag(2,540,310,{pointerType:'mouse',buttons});assert(input.sample(1/60,0).look.x>0);
        emit(win,'pointermove',{pointerId:2,pointerType:'mouse',buttons:0});drag(2,600,340);neutral(input.sample(1/60,0));
    }
}));
test('Gamepad analog strength, actions, dead zone and disconnect share the same contract',()=>fixture(({input,setPads})=>{
    for(const id of ['Xbox Controller','DualSense Wireless Controller','Nintendo Switch Pro Controller']){
        const buttons=Array.from({length:8},()=>({value:0,pressed:false}));buttons[7].value=.7;buttons[6].value=.6;buttons[0].pressed=true;
        const pad={id,connected:true,axes:[0,-.56,.56,0],buttons};setPads([pad]);const s=input.sample(1/60,0);assert(Math.abs(s.strength-.5)<1e-12);assert.equal(s.source,'gamepad');assert(s.look.x>0);assert(s.actions.gas&&s.actions.brake&&s.actions.boost);
        pad.axes=[.05,.03,0,0];pad.buttons=[];neutral(input.sample(1/60,0));pad.connected=false;pad.axes=[1,-1,1,1];neutral(input.sample(1/60,0));
    }
}));
test('Malformed controller axes never send non-finite movement into the simulation',()=>{
    for(const [x,y] of [[NaN,0],[Infinity,-Infinity],[undefined,undefined]]){
        const s=radialStick(x,y);assert(Object.values(s).every(Number.isFinite));assert.equal(s.strength,0);
    }
});
