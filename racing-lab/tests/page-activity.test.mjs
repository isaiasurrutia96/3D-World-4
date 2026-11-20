import assert from 'node:assert/strict';
import {bindStageActivity} from '../../motion-lab/src/page-activity.js';
import {numericChecks} from './numeric-report.mjs';
const check=numericChecks(new URL('../PAGE-ACTIVITY-CHECKS.json',import.meta.url),'Installed lab lifecycle');
function fixture(run) {
    const names=['window','document','IntersectionObserver','requestAnimationFrame','cancelAnimationFrame'];
    const saved=Object.fromEntries(names.map(name=>[name,globalThis[name]]));
    const win=new EventTarget(),doc=new EventTarget(),stage=new EventTarget(),bar={getBoundingClientRect:()=>({bottom:50})};
    win.innerHeight=800;win.visualViewport=new EventTarget();win.visualViewport.height=800;doc.hidden=false;
    let rect={width:800,height:750,top:50,bottom:800},active=true,id=0,observer;
    const frames=new Map(),input={enabled:true,focused:true};stage.getBoundingClientRect=()=>rect;
    Object.assign(globalThis,{window:win,document:doc,requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),IntersectionObserver:class {constructor(fn){this.callback=fn;observer=this;}observe(){}disconnect(){this.disconnected=true;}}});
    const dispose=bindStageActivity({stage,topbar:bar,input,setActive:value=>{active=value;input.enabled=value;}});
    const fire=(target,type)=>target.dispatchEvent(new Event(type));
    const flush=()=>{const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn();};
    try{return run({win,doc,stage,input,fire,flush,dispose,frames,observer,get active(){return active;},setRect:value=>rect=value});}
    finally {dispose();for(const name of names)if(saved[name]===undefined)delete globalThis[name];else globalThis[name]=saved[name];}
}
check('Each foreground signal restores a visible paused stage',
 'For pageshow, focus and resume: hide stage, then restore document visibility without visibilitychange and emit the signal.',
 'Input becomes enabled and focused for every signal.',()=>{
    for(const event of ['pageshow','focus','resume'])fixture(f=>{
        f.doc.hidden=true;f.fire(f.doc,'visibilitychange');assert.equal(f.active,false);
        f.doc.hidden=false;f.input.focused=false;f.fire(event==='resume'?f.doc:f.win,event);
        assert.equal(f.active,true);assert.equal(f.input.enabled,true);assert.equal(f.input.focused,true);
    });return {signals:3};
});
check('Foreground layout is rechecked after its first empty bounds',
 'Hide, return while stage bounds are zero, restore real bounds before the queued animation frame.',
 'Initial input is disabled; the next frame enables the visible stage.',()=>fixture(f=>{
    f.doc.hidden=true;f.fire(f.doc,'visibilitychange');f.doc.hidden=false;
    f.setRect({width:0,height:0,top:0,bottom:0});f.fire(f.doc,'visibilitychange');assert.equal(f.active,false);
    f.setRect({width:800,height:750,top:50,bottom:800});f.flush();assert.equal(f.active,true);
    return {visibleAfterLayout:true};
}));
check('A fresh stage touch can recover missed operating-system resume signals',
 'Pause through pagehide; deliver a pointerdown on the visible stage without pageshow/focus.',
 'Input is enabled before the event reaches the controls.',()=>fixture(f=>{
    f.fire(f.win,'pagehide');assert.equal(f.active,false);f.fire(f.stage,'pointerdown');assert.equal(f.active,true);
    return {touchCanResume:true};
}));
check('Hidden, offscreen and empty stages cannot be enabled by foreground signals',
 'Try pageshow/focus/touch with document hidden, stage behind header, below viewport or zero-size.',
 'Input remains disabled in all cases.',()=>{
    let cases=0;
    for(const kind of ['hidden','above','below','empty'])fixture(f=>{
        if(kind==='hidden')f.doc.hidden=true;
        if(kind==='above')f.setRect({width:800,height:700,top:-800,bottom:-100});
        if(kind==='below')f.setRect({width:800,height:700,top:801,bottom:1501});
        if(kind==='empty')f.setRect({width:0,height:0,top:50,bottom:50});
        for(const event of ['pageshow','focus']){f.fire(f.win,event);f.flush();assert.equal(f.active,false);cases++;}
        f.fire(f.stage,'pointerdown');f.flush();assert.equal(f.active,false);cases++;
    });return {cases};
});
check('Leaving or freezing cancels pending foreground work immediately',
 'Queue a resume frame, then pagehide/freeze, and attempt to flush old callbacks or resize.',
 'Stage stays paused until a new valid foreground/touch signal.',()=>{
    for(const event of ['pagehide','freeze'])fixture(f=>{
        f.fire(f.win,'pageshow');assert(f.frames.size>0);f.fire(event==='freeze'?f.doc:f.win,event);
        assert.equal(f.active,false);assert.equal(f.frames.size,0);f.flush();f.fire(f.win,'resize');f.flush();assert.equal(f.active,false);
        f.fire(f.win,'pageshow');assert.equal(f.active,true);
    });return {pauseSignals:2};
});
check('Viewport changes and scrolling re-evaluate current bounds rather than stale observer snapshots',
 'Move stage offscreen and notify observer; return it, then resize the visual viewport.',
 'Offscreen pauses and visible layout resumes without a document visibility event.',()=>fixture(f=>{
    f.setRect({width:800,height:700,top:-800,bottom:-100});f.observer.callback();assert.equal(f.active,false);
    f.setRect({width:800,height:750,top:50,bottom:800});f.fire(f.win.visualViewport,'resize');assert.equal(f.active,true);
    return {offscreenPaused:true,visibleResumed:true};
}));
check('Disposed activity handlers cannot reactivate a removed page',
 'Dispose with a queued layout check, then emit every resume/resize/touch event.',
 'Observer is disconnected, pending callbacks cancelled, input remains disabled.',()=>fixture(f=>{
    f.dispose();assert.equal(f.observer.disconnected,true);assert.equal(f.frames.size,0);
    for(const event of ['pageshow','focus','resize'])f.fire(f.win,event);
    f.fire(f.doc,'resume');f.fire(f.stage,'pointerdown');f.flush();assert.equal(f.active,false);
    return {disposed:true};
}));
