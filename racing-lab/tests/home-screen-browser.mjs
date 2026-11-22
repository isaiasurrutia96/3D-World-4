import {launchTestBrowser} from '../../scripts/test-browser.mjs';
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Exercise resume ordering independently of an iPhone's task switcher. The
// optional exact pre-fix bundle proves that these are real regression cases.
const baseline=process.env.BASELINE_HTML, engine=process.env.TEST_BROWSER||'chromium';
const prefix='/3D-World-4/', rows=[], errors=[];
const server=createServer(async(req,res)=>{
    try {
        let path=new URL(req.url,'http://local').pathname;
        if (!path.startsWith(prefix)) throw Error('Outside project');
        path=path.slice(prefix.length); if(path.endsWith('/')) path+='index.html';
        res.setHeader('Content-Type',({'.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream');
        res.end(await readFile(path==='before/index.html'&&baseline?baseline:resolve('dist',path)));
    } catch {res.statusCode=404;res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await launchTestBrowser(engine);
const settle=page=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
try {
    for(const version of baseline?['before','after']:['after']) {
        const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
        page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(()=>{
            window.testHidden=false;
            Object.defineProperty(document,'hidden',{get:()=>window.testHidden});
            Object.defineProperty(navigator,'standalone',{get:()=>true});
        });
        await page.goto(`http://127.0.0.1:${server.address().port}${prefix}${version==='before'?'before':'racing-lab'}/?drive=1&handling=fast`);
        await page.waitForFunction(()=>window.drivingLabReady&&window.motionLabReady);
        await settle(page);
        const state=()=>page.evaluate(()=>({active:motionLab.getState().active,enabled:motionLab.input.enabled,gas:motionLab.input.actions.gas,right:motionLab.input.actions.right}));
        const hide=()=>page.evaluate(()=>{window.testHidden=true;document.dispatchEvent(new Event('visibilitychange'));});
        const restore=()=>page.evaluate(()=>{window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'));scrollTo(0,0);});
        for(const event of ['pageshow','focus','resume']) {
            await restore();await settle(page);await hide();
            assert.equal((await state()).enabled,false);
            await page.evaluate(event=>{
                window.testHidden=false;
                (event==='resume'?document:window).dispatchEvent(event==='pageshow'?new PageTransitionEvent(event,{persisted:true}):new Event(event));
            },event);
            await settle(page);
            const measured=await state();
            assert.equal(measured.active,version==='after',JSON.stringify({version,event,measured}));
            assert.equal(measured.enabled,version==='after');
            rows.push({rule:version==='before'?'Captured pre-fix page stays disabled after app return.':'Returning to a visible installed page restores input without requiring another visibility event.',input:{version,event},expected:{active:version==='after',enabled:version==='after'},measured,status:'PASS'});
        }
        await restore();await settle(page);await hide();
        await page.evaluate(()=>{
            window.testHidden=false;
            const stage=document.querySelector('#stage'),rect=stage.getBoundingClientRect;
            stage.getBoundingClientRect=()=>({width:0,height:0,top:0,bottom:0,left:0,right:0});
            document.dispatchEvent(new Event('visibilitychange'));
            stage.getBoundingClientRect=rect;
        });
        await settle(page);
        const delayed=await state();assert.equal(delayed.enabled,version==='after');
        rows.push({rule:version==='before'?'Captured pre-fix page remains disabled after transient foreground layout.':'A temporarily empty layout during foreground notification is rechecked after layout settles.',input:{version,script:'Hide; restore visibility while stage bounds are temporarily zero; restore real bounds before next frame.'},expected:{enabled:version==='after'},measured:delayed,status:'PASS'});

        await restore();await settle(page);await hide();
        await page.evaluate(()=>{window.testHidden=false;});
        // Real touch must recover a visible stage even when resume signals were missed.
        await page.evaluate(()=>{
            window.testTouch=[];
            window.addEventListener('pointerdown',event=>{if(event.target.id==='race-gas')testTouch.push({id:event.pointerId,gas:motionLab.input.actions.gas,enabled:motionLab.input.enabled});});
        });
        await page.locator('#race-gas').tap();await settle(page);
        const tapped=await page.evaluate(()=>testTouch.at(-1));
        assert.equal(tapped.gas,version==='after');assert.equal(tapped.enabled,version==='after');
        rows.push({rule:version==='before'?'Captured pre-fix page ignores the first real Gas touch after missed resume signals.':'The first real Gas touch restores a visible stage before the button handler runs.',input:{version,script:'Foreground without lifecycle notifications; native touchscreen Gas tap.'},expected:{gas:version==='after',enabled:version==='after'},measured:tapped,status:'PASS'});

        if(version==='after') {
            await restore();await settle(page);
            for(const event of ['pagehide','freeze']) {
                await page.evaluate(()=>{motionLab.input.setAction('gas',true);motionLab.input.setAction('right',true);});
                await page.evaluate(event=>(event==='freeze'?document:window).dispatchEvent(new Event(event)),event);
                const paused=await state();assert.deepEqual(paused,{active:false,enabled:false,gas:false,right:false});
                rows.push({rule:'Leaving or freezing the app immediately pauses and releases every driving command.',input:event,measured:paused,status:'PASS'});
                await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await settle(page);
            }
            await page.evaluate(()=>{document.querySelector('#test-videos').style.minHeight='120vh';scrollTo(0,document.body.scrollHeight);});
            await page.waitForFunction(()=>!motionLab.getState().active);
            await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.dispatchEvent(new Event('focus'));});await settle(page);
            assert.equal((await state()).enabled,false);
            await hide();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await settle(page);
            assert.equal((await state()).enabled,false);
            await restore();await page.waitForFunction(()=>motionLab.input.enabled);
            if(engine==='chromium') {
                const cdp=await page.context().newCDPSession(page),box=await page.locator('#race-gas').boundingBox();
                await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:4,x:box.x+box.width/2,y:box.y+box.height/2}]});
                await page.waitForFunction(()=>drivingLab.test.controller.state.speed>3);
                await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
                assert.equal((await state()).gas,false);
            }
            rows.push({rule:'Hidden/offscreen stages stay paused; returning restores visible input.',input:{engine,script:'Scroll to videos, restore/focus while offscreen, hide/focus, return; Chromium also holds Gas until speed exceeds 3 m/s.'},measured:{...await state(),heldGasSpeedVerified:engine==='chromium'},status:'PASS'});
        }
        await page.close();
    }
    assert.deepEqual(errors,[]);
    const sha=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
    await writeFile(`racing-lab/HOME-SCREEN-${engine.toUpperCase()}-CHECKS.json`,JSON.stringify({passed:true,engine,baselineCompared:Boolean(baseline),currentSHA256:await sha('dist/racing-lab/index.html'),baselineSHA256:baseline?await sha(baseline):null,checks:rows,pageErrors:errors,limitation:'Automates browser lifecycle ordering and native touch. Actual installed iOS app launch and OS task switching still require device verification.'},null,2)+'\n');
    for(const row of rows)console.log('PASS:',row.rule,JSON.stringify(row.input));
} finally {await browser.close();server.close();}
