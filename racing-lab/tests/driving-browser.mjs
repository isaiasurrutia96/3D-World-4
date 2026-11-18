import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const server = createServer(async (q, r) => { try {
    let path = new URL(q.url, 'http://local').pathname;
    if (path.endsWith('/'))
        path += 'index.html';
    r.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png' })[extname(path)] || 'application/octet-stream');
    r.end(await readFile(resolve('dist', '.' + path)));
}
catch {
    r.statusCode = 404;
    r.end();
} });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }), base = `http://127.0.0.1:${server.address().port}/racing-lab/?drive=1`, errors = [], results = [];
async function pressOption(page, selector) {
    await page.locator(selector).click();
}
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(base);
    await p.waitForFunction(() => window.drivingLabReady && window.motionLabReady);
    const read = () => p.evaluate(() => drivingLab.getState()), reset = async () => { await p.locator('#reset').click(); await p.waitForFunction(() => drivingLab.test.controller.state.speed === 0); };
    assert.equal(await p.title(), 'Driving test');
    assert.equal(await p.locator('#race-track option').count(), 4);
    assert.equal(await p.evaluate(() => drivingLab.getState().opponents), 0);
    assert.equal(await p.evaluate(() => drivingLab.kart.wheels.length), 4);
    assert(await p.locator('.input-stick').isHidden());
    for (const id of ['original', 'skyline', 'suzuka', 'winding']) {
        await p.locator('#race-track').selectOption(id);
        await p.waitForFunction(id => drivingLab.getState().trackId === id, id);
        await p.keyboard.down('ArrowUp');
        await p.waitForFunction(() => drivingLab.test.controller.state.speed > 5);
        await p.keyboard.up('ArrowUp');
        await p.keyboard.down('Space');
        await p.waitForFunction(() => drivingLab.test.controller.state.speed === 0);
        await p.keyboard.up('Space');
        await reset();
    }
    results.push('All four tracks: keyboard Gas, braking, Reset, one original kart.');
    // Measure actual driving against the initial chase-camera image, not the steering variable.
    for(const [key,direction] of [['s',-1],['f',1],['ArrowLeft',-1],['ArrowRight',1]]){
        await reset();await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const initial=await p.evaluate(()=>{const c=motionLab.camera,s=drivingLab.test.controller.state,v=c.position.clone().set(s.x,s.y+.6,s.z).project(c);return {yaw:s.yaw,screenX:v.x,view:c.matrixWorldInverse.toArray(),projection:c.projectionMatrix.toArray()};});
        await p.keyboard.down('e');await p.keyboard.down(key);
        await p.waitForFunction(yaw=>{const s=drivingLab.test.controller.state;return s.speed>5&&Math.abs(s.yaw-yaw)>.04;},initial.yaw);
        await p.keyboard.up(key);await p.keyboard.up('e');
        const delta=await p.evaluate(initial=>{const c=motionLab.camera,s=drivingLab.test.controller.state,v=c.position.clone().set(s.x,s.y+.6,s.z);v.applyMatrix4(c.matrixWorldInverse.clone().fromArray(initial.view));v.applyMatrix4(c.projectionMatrix.clone().fromArray(initial.projection));return v.x-initial.screenX;},initial);
        assert(delta*direction>1e-4,`${key} steers to the wrong side of the chase view: ${delta}`);
    }
    results.push('Actual S/Left keys turn left; F/Right keys turn right in the chase-camera image.');
    await p.keyboard.down('ArrowUp');
    await p.keyboard.down('ArrowLeft');
    await p.waitForFunction(() => drivingLab.test.controller.state.steering < -.01 && drivingLab.test.controller.state.speed > 3);
    await p.keyboard.up('ArrowLeft');
    await p.keyboard.up('ArrowUp');
    assert(await p.evaluate(() => drivingLab.kart.wheels.filter(w => w.front).every(w => Math.abs(w.node.rotation.y) > .001)));
    await reset();
    await p.keyboard.down('ArrowUp');
    await p.keyboard.down('Shift');
    await p.waitForFunction(() => drivingLab.test.controller.state.boostTime > 1);
    await p.keyboard.up('Shift');
    await p.keyboard.up('ArrowUp');
    await reset();
    const cam = await p.evaluate(() => motionLab.getState().camera.yaw);
    await p.mouse.move(700, 300);
    await p.mouse.down();
    await p.mouse.move(820, 330, { steps: 4 });
    await p.mouse.up();
    await p.waitForFunction(y => Math.abs(motionLab.getState().camera.yaw - y) > .1, cam);
    await p.getByRole('button', { name: 'Behind', exact: true }).click();
    assert.equal(await p.evaluate(() => motionLab.getState().camera.view), 'back');
    const distance = await p.evaluate(() => motionLab.getState().camera.distance);
    await p.mouse.move(640, 400);
    await p.mouse.wheel(0, 100);
    await settle(p);
    assert.equal(await p.evaluate(() => motionLab.getState().camera.distance), distance);
    assert.equal(await p.evaluate(() => motionLab.zoom.getState().enabled), false);
    await reset();
    await p.waitForFunction(() => { const c = motionLab.camera, model = drivingLab.kart.root, v = c.position.clone().copy(model.position); v.y += .6; v.project(c); return Math.abs(v.x) < .8 && Math.abs(v.y) < .8 && v.z >= -1 && v.z <= 1; });
    results.push('Steering/wheels, boost, drag look, disabled wheel zoom and Behind return pass.');
    // First-person camera must only change the view, including while driving.
    await reset();await p.getByRole('button',{name:'FPV',exact:true}).click();
    await p.waitForFunction(()=>motionLab.camera.fov===76&&motionLab.getState().camera.view==='fpv');
    const eye=await p.evaluate(()=>{const model=drivingLab.kart.root,expected=model.localToWorld(motionLab.camera.position.clone().set(0,1.32,-.78));return expected.distanceTo(motionLab.camera.position);});assert(eye<1e-8);
    assert.equal(await p.evaluate(()=>motionLab.zoom.getState().enabled),false);
    const fpvPose=await p.evaluate(()=>drivingLab.getState().physics),fpvStage=await p.locator('#stage').boundingBox();
    await p.mouse.move(700,fpvStage.y+150);await p.mouse.down();await p.mouse.move(780,fpvStage.y+170,{steps:4});await p.mouse.up();
    await p.waitForFunction(()=>Math.abs(drivingLab.getCameraState().headYaw)>.1);
    assert.equal(await p.evaluate(()=>motionLab.getState().camera.view),'fpv');assert.equal(await p.evaluate(()=>drivingLab.getState().physics.x),fpvPose.x);
    await p.getByRole('button',{name:'FPV',exact:true}).click();assert.equal(await p.evaluate(()=>drivingLab.getCameraState().headYaw),0);
    const beforeWheel=await p.evaluate(()=>motionLab.camera.position.toArray());await p.mouse.wheel(0,200);await p.waitForTimeout(100);const afterWheel=await p.evaluate(()=>motionLab.camera.position.toArray());assert(Math.hypot(...beforeWheel.map((v,i)=>v-afterWheel[i]))<1e-8);
    await p.keyboard.down('e');await p.waitForFunction(()=>drivingLab.test.controller.state.speed>8);
    await p.getByRole('button',{name:'Behind',exact:true}).click();await p.waitForFunction(()=>motionLab.camera.fov===45);assert(await p.evaluate(()=>drivingLab.test.controller.state.speed>8));assert.equal(await p.evaluate(()=>motionLab.zoom.getState().enabled),false);
    await p.getByRole('button',{name:'FPV',exact:true}).click();await p.waitForFunction(()=>motionLab.camera.fov===76);assert(await p.evaluate(()=>drivingLab.test.controller.state.speed>8));await p.keyboard.up('e');await p.keyboard.down('Space');await p.waitForFunction(()=>drivingLab.test.controller.state.speed===0);await p.keyboard.up('Space');await reset();assert.equal(await p.evaluate(()=>motionLab.getState().camera.view),'fpv');
    for(const id of ['original','skyline','suzuka','winding']){await p.locator('#race-track').selectOption(id);await p.waitForFunction(id=>drivingLab.getState().trackId===id&&motionLab.camera.fov===76,id);assert.equal(await p.evaluate(()=>motionLab.getState().camera.view),'fpv');}
    await p.getByRole('button',{name:'Behind',exact:true}).click();await p.waitForFunction(()=>motionLab.camera.fov===45);
    results.push('FPV: seated eye, forward view, look/recenter, fixed eye on wheel input, live switches, Reset/track persistence; driving settings unchanged.');
    await p.evaluate(() => { window.testPad = { id: 'Xbox Controller', connected: true, mapping: 'standard', axes: [.4, 0, 0, 0], buttons: Array.from({ length: 8 }, () => ({ value: 0, pressed: false })) }; testPad.buttons[7] = { value: 1, pressed: true }; Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [testPad] }); });
    for (const id of ['Xbox Controller', 'DualSense Wireless Controller', 'Nintendo Switch Pro Controller']) {
        await reset();
        await p.evaluate(id => { testPad.id = id; testPad.axes = [.4, 0, 0, 0]; testPad.buttons[7] = { value: 1, pressed: true }; testPad.connected = true; }, id);
        await p.waitForFunction(() => drivingLab.test.controller.state.speed > 3 && drivingLab.test.controller.state.steering > .01);
        await p.evaluate(() => { testPad.buttons[7] = { value: 0, pressed: false }; testPad.buttons[6] = { value: 1, pressed: true }; });
        await p.waitForFunction(() => drivingLab.test.controller.state.speed === 0);
        await p.evaluate(() => { testPad.buttons[6] = { value: 0, pressed: false }; testPad.connected = false; });
    }
    results.push('Standard Gamepad API: three identities, analog steering, RT Gas, LT brake and disconnect.');
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.on('pageerror', e => errors.push(e.message));
    await mobile.goto(base);
    await mobile.waitForFunction(() => window.drivingLabReady && window.motionLabReady);
    const cdp = await mobile.context().newCDPSession(mobile);
    async function touch(name, id) { const b = await mobile.locator('#race-' + name).boundingBox(); return { id, x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
    const gas = await touch('gas', 1), left = await touch('left', 2);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [gas, left] });
    await mobile.waitForFunction(() => drivingLab.test.controller.state.speed > 3 && drivingLab.test.controller.state.steering < -.01);
    assert.equal(await mobile.evaluate(() => motionLab.input.stick), null);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await mobile.waitForFunction(() => !motionLab.input.actions.gas && !motionLab.input.actions.left);
    await pressOption(mobile, '#reset');
    const reverse = await touch('reverse', 3);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [reverse] });
    await mobile.waitForFunction(() => drivingLab.test.controller.state.speed < -1);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pressOption(mobile, '#reset');
    const g = await touch('gas', 4);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [g] });
    await mobile.waitForFunction(() => motionLab.input.actions.gas);
    await mobile.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await mobile.evaluate(() => motionLab.input.actions.gas), false);
    const clock = await mobile.evaluate(() => drivingLab.test.controller.clock.ticks);
    await mobile.waitForTimeout(100);
    assert.equal(await mobile.evaluate(() => drivingLab.test.controller.clock.ticks), clock);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.evaluate(() => window.dispatchEvent(new Event('focus')));
    await pressOption(mobile, '#reset');
    results.push('Phone: simultaneous Left + Gas, cancellation, Reverse, blur clears/pauses, Reset.');
    const stage = await mobile.locator('#stage').boundingBox(), d = await mobile.evaluate(() => motionLab.getState().camera.distance);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 5, x: 210, y: stage.y + 140 }, { id: 6, x: 310, y: stage.y + 140 }] });
    const anchoredDistance = await mobile.evaluate(() => motionLab.getState().camera.distance);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 5, x: 190, y: stage.y + 140 }, { id: 6, x: 340, y: stage.y + 140 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settle(mobile);
    assert.equal(await mobile.evaluate(() => motionLab.getState().camera.distance), anchoredDistance);
    assert.equal(await mobile.evaluate(() => motionLab.zoom.getState().enabled), false);
    assert.equal(await mobile.evaluate(() => visualViewport.scale), 1);
    await pressOption(mobile, '#reset');
    await pressOption(mobile, '[data-view=fpv]');await mobile.waitForFunction(()=>motionLab.camera.fov===76);
    const fpvTouchStage=await mobile.locator('#stage').boundingBox(),fpvBefore=await mobile.evaluate(()=>drivingLab.getCameraState().headYaw);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:7,x:230,y:fpvTouchStage.y+160}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:7,x:310,y:fpvTouchStage.y+175}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await mobile.waitForFunction(y=>Math.abs(drivingLab.getCameraState().headYaw-y)>.1,fpvBefore);assert.equal(await mobile.evaluate(()=>motionLab.getState().camera.view),'fpv');
    await pressOption(mobile, '#reset');assert.equal(await mobile.evaluate(()=>motionLab.getState().camera.view),'fpv');
    results.push('Phone FPV toggles, touch look and Reset preserve the first-person view.');
    // Original controls remain visible, including after selecting a view or track.
    for (const view of ['back','front','side','top','angled','fpv']) {
        await pressOption(mobile, `[data-view=${view}]`);
        assert.equal(await mobile.evaluate(() => motionLab.getState().camera.view), view);
        assert.equal(await mobile.evaluate(() => motionLab.zoom.getState().enabled), false);
    }
    await mobile.locator('#race-track').selectOption('skyline');
    await mobile.waitForFunction(() => drivingLab.getState().trackId === 'skyline');
    assert.equal(await mobile.locator('#driving-options-toggle').count(), 0);
    results.push('Original top controls stay visible: all six views, track selection and Reset work without a dropdown.');
    const layouts = [];
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
        await mobile.setViewportSize(viewport);
        await mobile.evaluate(() => scrollTo(0,0));
        await settle(mobile);
        await mobile.waitForFunction(() => Math.abs(document.querySelector('#stage').getBoundingClientRect().bottom - innerHeight) < 3);
        assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert(await mobile.locator('#test-videos').isVisible());
        const stage = await mobile.locator('#stage').boundingBox();
        assert(stage.y <= 120, `Compact original header takes too much space: ${stage.y}`);
        assert(stage.height >= viewport.height - 120);
        const videosTop = (await mobile.locator('#test-videos').boundingBox()).y;
        assert(videosTop >= viewport.height - 2, JSON.stringify({rule:'Videos must start below the initial driving screen',viewport,stage,videosTop,scrollY:await mobile.evaluate(()=>window.scrollY)}));
        await mobile.mouse.move(viewport.width*.6,stage.y+90);
        await mobile.mouse.wheel(0, 500);
        await settle(mobile);
        assert.equal(await mobile.evaluate(() => scrollY), 0);
        const left = await mobile.locator('#race-left').boundingBox(), right = await mobile.locator('#race-right').boundingBox();
        assert(right.x - left.x - left.width >= 12 - .1, 'Steering targets need a clear gap');
        assert(right.x + right.width / 2 < viewport.width / 2, 'Steering centers must stay on their own side');
        const gasBounds = await mobile.locator('#race-gas').boundingBox();
        assert(gasBounds.x - right.x - right.width >= 4, 'Steering and pedals must remain separate on narrow phones');
        assert(left.x >= 44 && left.x <= 52, 'Steering should have the requested second 12 px inward adjustment');
        const buttons = await mobile.locator('.drive-controls button,#race-boost,#reset,[data-view],#race-track').evaluateAll(bs => bs.map(b => { const r = b.getBoundingClientRect(); return { text: b.textContent, x: r.x, y: r.y, right: r.right, bottom: r.bottom, w: r.width, h: r.height }; }));
        for (const b of buttons) {
            assert(b.w >= 44 && b.h >= 44, JSON.stringify(b));
            assert(b.x >= 0 && b.right <= viewport.width && b.y >= 0 && b.bottom <= viewport.height, JSON.stringify(b));
        }
        await mobile.locator('.drive-videos-link').tap();
        await mobile.waitForFunction(() => scrollY > 0 && document.querySelector('#test-videos h2').getBoundingClientRect().bottom <= innerHeight);
        assert.equal((await mobile.locator('#topbar').boundingBox()).y, 0);
        await mobile.evaluate(() => scrollTo(0,0));
        await mobile.waitForFunction(() => scrollY === 0 && motionLab.getState().active);
        layouts.push({ ...viewport, stageHeight:stage.height, headerHeight:stage.y, steeringGap:right.x-left.x-left.width, steeringLeft:left.x });
    }
    results.push('Five layouts: original header controls visible at full width, smaller header height, steering near edge, videos below the first screen and reachable by scrolling; driving zoom stays disabled.');
    await mobile.setViewportSize({width:390,height:844});
    await settle(mobile);
    const scrollLink = await mobile.locator('.drive-videos-link').boundingBox(), scrollX=scrollLink.x+scrollLink.width/2, scrollY=scrollLink.y+scrollLink.height/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:20,x:scrollX,y:scrollY}]});
    for(let step=1;step<=6;step++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:20,x:scrollX,y:scrollY-step*50}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await mobile.waitForFunction(()=>window.scrollY>40);
    await mobile.evaluate(()=>scrollTo(0,0));
    await mobile.waitForFunction(()=>window.scrollY===0&&motionLab.getState().active);
    results.push('Phone touch swipe from the video link scrolls to the video section; returning to the stage resumes driving.');
    await mobile.setViewportSize({width:844,height:390});
    await settle(mobile);
    // Prove separated targets still deliver the correct real touch input after rotating.
    await pressOption(mobile, '#reset');
    const gasLandscape=await touch('gas',10), rightLandscape=await touch('right',11);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[gasLandscape,rightLandscape]});
    await mobile.waitForFunction(()=>drivingLab.test.controller.state.speed>3&&drivingLab.test.controller.state.steering>.01);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await mobile.waitForFunction(()=>!motionLab.input.actions.gas&&!motionLab.input.actions.right);
    await pressOption(mobile, '#reset');
    await mobile.screenshot({path:'/tmp/driving-landscape.png'});
    results.push('Landscape phone: simultaneous Right + Gas and touch cancellation still work after rotation.');
    await mkdir('/tmp/driving-test-shots', { recursive: true });
    await p.screenshot({ path: '/tmp/driving-test-shots/desktop.png' });
    assert.deepEqual(errors, []);
    await writeFile(resolve('racing-lab/DRIVING-BROWSER-CHECKS.json'), JSON.stringify({ passed: true, checks: results, layouts, pageErrors: errors }, null, 2) + '\n');
    for (const r of results)
        console.log('PASS:', r);
}
finally {
    await browser.close();
    server.close();
}
