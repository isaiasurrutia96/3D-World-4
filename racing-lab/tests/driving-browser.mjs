import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const server = createServer(async (q, r) => { try {
    let path = new URL(q.url, 'http://local').pathname;
    if (path.endsWith('/'))
        path += 'index.html';
    r.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(path)] || 'application/octet-stream');
    r.end(await readFile(resolve('dist', '.' + path)));
}
catch {
    r.statusCode = 404;
    r.end();
} });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }), base = `http://127.0.0.1:${server.address().port}/racing-lab/?drive=1`, errors = [], results = [];
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
    await p.keyboard.down('ArrowUp');
    await p.keyboard.down('ArrowLeft');
    await p.waitForFunction(() => drivingLab.test.controller.state.steering > .01 && drivingLab.test.controller.state.speed > 3);
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
    await p.waitForFunction(d => motionLab.getState().camera.distance > d, distance);
    await reset();
    await p.waitForFunction(() => { const c = motionLab.camera, model = drivingLab.kart.root, v = c.position.clone().copy(model.position); v.y += .6; v.project(c); return Math.abs(v.x) < .8 && Math.abs(v.y) < .8 && v.z >= -1 && v.z <= 1; });
    results.push('Steering/wheels, boost, drag/wheel camera and Behind return pass.');
    await p.evaluate(() => { window.testPad = { id: 'Xbox Controller', connected: true, mapping: 'standard', axes: [.4, 0, 0, 0], buttons: Array.from({ length: 8 }, () => ({ value: 0, pressed: false })) }; testPad.buttons[7] = { value: 1, pressed: true }; Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [testPad] }); });
    for (const id of ['Xbox Controller', 'DualSense Wireless Controller', 'Nintendo Switch Pro Controller']) {
        await reset();
        await p.evaluate(id => { testPad.id = id; testPad.axes = [.4, 0, 0, 0]; testPad.buttons[7] = { value: 1, pressed: true }; testPad.connected = true; }, id);
        await p.waitForFunction(() => drivingLab.test.controller.state.speed > 3 && drivingLab.test.controller.state.steering < -.01);
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
    await mobile.waitForFunction(() => drivingLab.test.controller.state.speed > 3 && drivingLab.test.controller.state.steering > .01);
    assert.equal(await mobile.evaluate(() => motionLab.input.stick), null);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await mobile.waitForFunction(() => !motionLab.input.actions.gas && !motionLab.input.actions.left);
    await mobile.locator('#reset').tap();
    const reverse = await touch('reverse', 3);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [reverse] });
    await mobile.waitForFunction(() => drivingLab.test.controller.state.speed < -1);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.locator('#reset').tap();
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
    await mobile.locator('#reset').tap();
    results.push('Phone: simultaneous Left + Gas, cancellation, Reverse, blur clears/pauses, Reset.');
    const stage = await mobile.locator('#stage').boundingBox(), d = await mobile.evaluate(() => motionLab.getState().camera.distance);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 5, x: 210, y: stage.y + 140 }, { id: 6, x: 310, y: stage.y + 140 }] });
    const anchoredDistance = await mobile.evaluate(() => motionLab.getState().camera.distance);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 5, x: 190, y: stage.y + 140 }, { id: 6, x: 340, y: stage.y + 140 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.waitForFunction(d => motionLab.getState().camera.distance < d - .1, anchoredDistance);
    assert.equal(await mobile.evaluate(() => visualViewport.scale), 1);
    await mobile.locator('#reset').tap();
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
        await mobile.setViewportSize(viewport);
        await mobile.waitForFunction(() => Math.abs(document.querySelector('#stage').getBoundingClientRect().bottom - innerHeight) < 3);
        assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const buttons = await mobile.locator('.drive-controls button,#race-boost,#reset').evaluateAll(bs => bs.map(b => { const r = b.getBoundingClientRect(); return { text: b.textContent, x: r.x, y: r.y, right: r.right, bottom: r.bottom, w: r.width, h: r.height }; }));
        for (const b of buttons) {
            assert(b.w >= 44 && b.h >= 44, JSON.stringify(b));
            assert(b.x >= 0 && b.right <= viewport.width && b.y >= 0 && b.bottom <= viewport.height, JSON.stringify(b));
        }
    }
    results.push('Pinch zoom without page zoom and five phone/tablet/desktop layouts pass.');
    await mkdir('/tmp/driving-test-shots', { recursive: true });
    await p.screenshot({ path: '/tmp/driving-test-shots/desktop.png' });
    assert.deepEqual(errors, []);
    await writeFile(resolve('racing-lab/DRIVING-BROWSER-CHECKS.json'), JSON.stringify({ passed: true, checks: results, pageErrors: errors }, null, 2) + '\n');
    for (const r of results)
        console.log('PASS:', r);
}
finally {
    await browser.close();
    server.close();
}
