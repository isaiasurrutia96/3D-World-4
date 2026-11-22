/** Page lifecycle only: returning to an installed lab must restore visible input. */
export function bindStageActivity({stage,topbar,input,setActive}) {
    let suspended=false,frame=0,disposed=false;
    function refresh() {
        if(disposed)return;
        const rect=stage.getBoundingClientRect(),bar=topbar.getBoundingClientRect();
        const height=window.visualViewport?.height??window.innerHeight;
        setActive(!suspended&&!document.hidden&&rect.width>0&&rect.height>0&&rect.bottom>Math.max(0,bar.bottom)&&rect.top<height);
    }
    function recheck() {
        if(disposed)return;
        refresh();
        cancelAnimationFrame(frame);
        // iOS may deliver foreground events before its viewport/layout settles.
        frame=requestAnimationFrame(()=>{frame=0;refresh();});
    }
    function resume() {
        if(disposed)return;
        suspended=false;input.focused=true;recheck();
    }
    function pause() {
        suspended=true;cancelAnimationFrame(frame);frame=0;setActive(false);
    }
    const observer=new IntersectionObserver(refresh,{threshold:0.02});observer.observe(stage);
    const listeners=[];
    const on=(target,name,handler,options)=>{
        target.addEventListener(name,handler,options);
        listeners.push(()=>target.removeEventListener(name,handler,options));
    };
    on(window,'pagehide',pause);on(document,'freeze',pause);
    on(window,'pageshow',resume);on(window,'focus',resume);on(document,'resume',resume);
    on(document,'visibilitychange',()=>document.hidden?pause():resume());
    on(window,'resize',recheck);
    // A sticky header can cover the remaining stage without crossing the
    // observer's intersection threshold. Scroll provides the exact bounds.
    on(window,'scroll',refresh,{passive:true});
    if(window.visualViewport)on(window.visualViewport,'resize',recheck);
    // Recover before the button/canvas handler sees input.enabled. A missed
    // OS resume notification must not make every subsequent tap a no-op.
    on(stage,'pointerdown',resume,{capture:true});
    recheck();
    return ()=>{if(disposed)return;disposed=true;pause();observer.disconnect();for(const remove of listeners)remove();};
}
