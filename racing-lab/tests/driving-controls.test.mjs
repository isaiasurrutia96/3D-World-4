import assert from 'node:assert/strict';
import {numericChecks} from './numeric-report.mjs';
import {createDrivingHolds} from '../src/driving-holds.js';
import {bindDrivingButtons} from '../src/driving-controls.js';
const check=numericChecks(new URL('../CONTROL-RELEASE-CHECKS.json',import.meta.url),'Driving button ownership and release');
class Target extends EventTarget {
    attributes=new Map(); captured=new Set(); failCapture=false;
    contains(target){return target===this;}
    focus(){} setAttribute(name,value){this.attributes.set(name,value);}
    setPointerCapture(id){if(this.failCapture)throw Error('capture unavailable');this.captured.add(id);}
    hasPointerCapture(id){return this.captured.has(id);}
}
function fixture(test) {
    const savedWindow=globalThis.window,savedDocument=globalThis.document;
    const win=new Target(),doc=new Target();doc.hidden=false;globalThis.window=win;globalThis.document=doc;
    const buttons=Object.fromEntries(['left','right','gas','reverse','boost'].map(n=>[n,new Target()]));
    const input={enabled:true,focused:true,actions:Object.fromEntries(Object.keys(buttons).map(n=>[n,false])),setAction(name,value){this.actions[name]=value;}};
    const canvas=new Target(),binding=bindDrivingButtons(input,canvas,buttons);
    const fire=(target,type,fields={})=>{const event=new Event(type,{cancelable:true});Object.assign(event,fields);target.dispatchEvent(event);return event;};
    const down=(name,id)=>fire(buttons[name],'pointerdown',{pointerId:id,pointerType:'touch'});
    try{return test({win,doc,buttons,input,binding,fire,down});}
    finally {binding.dispose();if(savedWindow===undefined)delete globalThis.window;else globalThis.window=savedWindow;if(savedDocument===undefined)delete globalThis.document;else globalThis.document=savedDocument;}
}
check('A release reaching the window clears steering without cancelling Gas',
 'Press Gas with pointer1 and Right with pointer2; deliver pointerup2 only to the window.',
 'Right false, Gas true; releasing pointer1 leaves no holds.',()=>fixture(({win,input,binding,fire,down})=>{
    down('gas',1);down('right',2);fire(win,'pointerup',{pointerId:2});assert.equal(input.actions.right,false);assert.equal(input.actions.gas,true);
    fire(win,'pointerup',{pointerId:1});assert.equal(binding.getState().pointerCount,0);return {...input.actions};
}));
check('A shared input reset cannot resurrect an old hold after a fresh tap',
 'Press Right2; reset shared actions; sync; press/release a new Right3.',
 'No active pointer tokens or Right command after the new release.',()=>fixture(({input,binding,buttons,down,fire})=>{
    down('right',2);for(const key of Object.keys(input.actions))input.actions[key]=false;binding.sync();
    down('right',3);fire(buttons.right,'pointerup',{pointerId:3});assert.equal(input.actions.right,false);assert.equal(binding.getState().pointerCount,0);return binding.getState();
}));
check('Cancellation, lifecycle loss and disabled input clear private ownership',
 'For each of pointercancel, blur, pagehide, freeze, document hidden, disabled and unfocused: hold Gas+Right and interrupt.',
 'All holds/actions clear; re-enabling input and tapping cannot restore an old command.',()=>{
    const cases=['pointercancel','blur','pagehide','freeze','hidden','disabled','unfocused'];
    for(const kind of cases)fixture(({win,doc,input,binding,fire,down})=>{
        down('right',1);down('gas',2);
        if(kind==='pointercancel'){fire(win,'pointercancel',{pointerId:1});fire(win,'pointercancel',{pointerId:2});}
        else if(kind==='hidden'){doc.hidden=true;fire(doc,'visibilitychange');}
        else if(kind==='disabled'){input.enabled=false;binding.sync();}
        else if(kind==='unfocused'){input.focused=false;binding.sync();}
        else fire(kind==='freeze'?doc:win,kind);
        assert.equal(binding.getState().pointerCount,0,kind);assert(Object.values(input.actions).every(v=>!v),kind);
        doc.hidden=false;input.enabled=input.focused=true;down('right',3);fire(win,'pointerup',{pointerId:3});assert.equal(input.actions.right,false);
    });return {cases:cases.length};
});
check('Thousands of rapid taps leave no stale steering while another finger holds Gas',
 'Gas pointer1 held;5000 Right down/up pairs with changing IDs; all releases delivered globally.',
 'Right false after every tap, Gas true until its own release; no token accumulation.',()=>fixture(({win,input,binding,fire,down})=>{
    down('gas',1);for(let i=2;i<5002;i++){down('right',i);assert.equal(input.actions.right,true);fire(win,'pointerup',{pointerId:i});assert.equal(input.actions.right,false);assert.equal(input.actions.gas,true);assert.equal(binding.getState().pointerCount,1);}
    fire(win,'pointerup',{pointerId:1});assert.equal(binding.getState().pointerCount,0);return {taps:5000,remainingPointers:0};
}));
check('Each pointer has one owner and one finger ending cannot release another',
 'Press Right with two pointers; release one; transfer the other to Left; deliver a delayed Right capture loss.',
 'Right persists until its last contact ends; transferred Left remains active; final release clears it.',()=>fixture(({win,input,binding,buttons,fire,down})=>{
    down('right',1);down('right',2);fire(win,'pointerup',{pointerId:1});assert.equal(input.actions.right,true);
    down('left',2);assert.equal(input.actions.right,false);assert.equal(input.actions.left,true);
    buttons.right.captured.delete(2);fire(buttons.right,'lostpointercapture',{pointerId:2});assert.equal(input.actions.left,true);
    fire(win,'pointerup',{pointerId:2});assert.equal(binding.getState().pointerCount,0);return {...input.actions};
}));
check('A delayed old capture loss does not cancel a newly captured contact with a reused ID',
 'Press/release Right7; press Right7 again; deliver an old loss while the new capture is active.',
 'New Right remains held until the current pointerup.',()=>fixture(({win,input,buttons,fire,down})=>{
    down('right',7);fire(win,'pointerup',{pointerId:7});down('right',7);fire(buttons.right,'lostpointercapture',{pointerId:7});assert.equal(input.actions.right,true);
    fire(win,'pointerup',{pointerId:7});assert.equal(input.actions.right,false);return {newContactPreserved:true};
}));
check('A failed capture and a genuinely lost capture have safe release paths',
 'Throw from setPointerCapture then release globally; separately lose a real capture.',
 'No exception/stuck action; both paths clear ownership.',()=>fixture(({win,input,buttons,binding,fire,down})=>{
    buttons.right.failCapture=true;down('right',8);assert.equal(input.actions.right,true);fire(win,'pointerup',{pointerId:8});assert.equal(input.actions.right,false);
    buttons.right.failCapture=false;down('right',9);buttons.right.captured.delete(9);fire(buttons.right,'lostpointercapture',{pointerId:9});assert.equal(input.actions.right,false);
    return {remainingPointers:binding.getState().pointerCount};
}));
check('Long holds have no automatic expiry and repeated key events do not accumulate',
 'Keep pointer42 held across10000 sync calls; then repeat Space/Enter keydown and release each separately/global keyup.',
 'Long hold remains valid until release; both keyboard tokens are tracked independently and fully clear.',()=>fixture(({win,input,buttons,binding,fire,down})=>{
    down('right',42);for(let i=0;i<10000;i++)binding.sync();assert.equal(input.actions.right,true);fire(win,'pointerup',{pointerId:42});
    for(let i=0;i<20;i++)fire(buttons.left,'keydown',{code:'Space'});fire(buttons.left,'keydown',{code:'Enter'});
    fire(win,'keyup',{code:'Space'});assert.equal(input.actions.left,true);fire(win,'keyup',{code:'Enter'});assert.equal(input.actions.left,false);
    assert.equal(binding.getState().buttons.left.keys,0);return {syncs:10000,keysRemaining:0};
}));
check('Button blur clears keyboard ownership and disposal removes all event handlers',
 'Hold button Space and a pointer; blur the button, then dispose and dispatch new events.',
 'Blur cancels its key but preserves its contact; disposal clears all holds and later events do nothing.',()=>fixture(({input,buttons,binding,fire,down})=>{
    fire(buttons.right,'keydown',{code:'Space'});down('right',11);fire(buttons.right,'blur');assert.equal(input.actions.right,true);assert.equal(binding.getState().buttons.right.keys,0);
    binding.dispose();down('right',12);assert.equal(input.actions.right,false);assert.equal(binding.getState().pointerCount,0);return {disposed:true};
}));
check('The ownership ledger rejects unknown buttons/IDs and returns immutable snapshots',
 'Unknown button,missing/fractional ID,duplicate names; mutate returned diagnostics.',
 'Invalid ownership rejected; snapshots cannot mutate active internal state.',()=>{
    const states={},h=createDrivingHolds(['right','gas'],(n,v)=>states[n]=v);assert.throws(()=>h.pressPointer('unknown',1));assert.throws(()=>h.pressPointer('right',undefined));assert.throws(()=>h.pressPointer('right',.5));assert.throws(()=>createDrivingHolds(['x','x'],()=>{}));h.pressPointer('right',1);
    const snapshot=h.getState();assert.throws(()=>snapshot.buttons.right.held=false);h.releasePointer(1);assert.equal(snapshot.buttons.right.held,true);assert.equal(h.getState().buttons.right.held,false);return {rejected:4,snapshotIsolated:true};
});

check('Native touch release clears only ended buttons even if pointerup is missing',
 'Hold Gas1 and Right2; deliver only touchend with Gas still in touches, then touchend with no touches.',
 'Right releases, Gas remains held; final touch release clears all contacts.',()=>fixture(({win,input,buttons,binding,fire,down})=>{
    down('gas',1);down('right',2);fire(win,'touchend',{touches:[{identifier:91,target:buttons.gas}]});
    assert.equal(input.actions.right,false);assert.equal(input.actions.gas,true);
    fire(win,'touchend',{touches:[]});assert.equal(binding.getState().pointerCount,0);return {...input.actions};
}));

check('Signed browser pointer IDs activate controls and release independently',
 'Press Gas with pointer -2147483648 and Right with pointer -37; release Right globally, then Gas.',
 'Gas and Right activate without an exception; releasing one preserves the other; no stale holds remain.',()=>fixture(({win,input,binding,fire,down})=>{
    down('gas',-2147483648);down('right',-37);assert.equal(input.actions.gas,true);assert.equal(input.actions.right,true);
    fire(win,'pointerup',{pointerId:-37});assert.equal(input.actions.right,false);assert.equal(input.actions.gas,true);
    fire(win,'pointerup',{pointerId:-2147483648});assert.equal(input.actions.gas,false);assert.equal(binding.getState().pointerCount,0);
    return {signedIdsAccepted:true,remainingPointers:0};
}));
check('Touch fallback preserves a second finger and keyboard hold on the same button',
 'Two Right contacts plus Space; one contact remains during touchend, then all contacts end, then keyup.',
 'Right stays held while any valid contact/key remains; final keyboard release clears it.',()=>fixture(({win,input,buttons,binding,fire,down})=>{
    down('right',1);down('right',2);fire(buttons.right,'keydown',{code:'Space'});
    fire(win,'touchend',{touches:[{identifier:55,target:buttons.right}]});assert.equal(input.actions.right,true);
    fire(win,'touchend',{touches:[]});assert.equal(input.actions.right,true);assert.equal(binding.getState().pointerCount,0);
    fire(win,'keyup',{code:'Space'});assert.equal(input.actions.right,false);return {independentContactsAndKeys:true};
}));
check('Touch cancellation cannot leave an old contact attached to the next tap',
 'Cancel a Right contact through touchcancel only, then start/release a fresh Right contact.',
 'No old pointer token returns after the new release.',()=>fixture(({win,input,binding,fire,down})=>{
    down('right',3);fire(win,'touchcancel',{touches:[]});assert.equal(input.actions.right,false);
    down('right',4);fire(win,'pointerup',{pointerId:4});assert.equal(input.actions.right,false);assert.equal(binding.getState().pointerCount,0);return {remainingPointers:0};
}));

check('Mouse steering ends when the primary button is no longer held',
 'Hold primary mouse on Right, move with primary held, then miss pointerup and move with no primary button; separately try a secondary click.',
 'Primary hold persists correctly; buttons0/secondary-only movement releases it; a secondary click cannot activate driving.',()=>fixture(({win,input,buttons,fire})=>{
    fire(buttons.right,'pointerdown',{pointerId:1,pointerType:'mouse',button:0});fire(win,'pointermove',{pointerId:1,pointerType:'mouse',buttons:1});assert.equal(input.actions.right,true);
    fire(win,'pointermove',{pointerId:1,pointerType:'mouse',buttons:0});assert.equal(input.actions.right,false);
    fire(buttons.right,'pointerdown',{pointerId:1,pointerType:'mouse',button:0});fire(win,'pointermove',{pointerId:1,pointerType:'mouse',buttons:2});assert.equal(input.actions.right,false);
    fire(buttons.right,'pointerdown',{pointerId:2,pointerType:'mouse',button:2});assert.equal(input.actions.right,false);return {primaryPreserved:true,missingReleaseCleared:true,secondaryDoesNotDrive:true};
}));
