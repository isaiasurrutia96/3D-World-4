import { launchTestBrowser } from '../../scripts/test-browser.mjs';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const html = await readFile(new URL('../../dist/racing-lab/index.html', import.meta.url));
const server = createServer((request, response) => {
    if (new URL(request.url, 'http://local').pathname !== '/racing-lab/') {
        response.writeHead(404).end();
        return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
});
const browser = await launchTestBrowser();
const errors = [];
const startPose = page => page.evaluate(() => {
    const { x, y, z, yaw, speed } = drivingLab.getState().physics;
    return { x, y, z, yaw, speed };
});

try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/racing-lab/?drive=1`;
    const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    desktop.setDefaultTimeout(15_000);
    desktop.on('pageerror', error => errors.push(error.message));
    await desktop.goto(`${base}&kart=gt&gtTune=gt3`);
    await desktop.waitForFunction(() => window.drivingLabReady && window.motionLabReady);
    const trackMenu = desktop.locator('#race-track');
    const kartMenu = desktop.locator('#driving-kart');
    const lapPrompt = desktop.getByText('Cross the line to start', { exact: true });
    assert(await lapPrompt.isVisible());
    await trackMenu.selectOption({ label: 'Neighborhood' });
    assert.equal(await trackMenu.inputValue(), 'neighborhood');
    assert(await kartMenu.isEnabled());
    assert(await lapPrompt.isHidden());
    assert(await desktop.evaluate(() => {
        const { root } = drivingLab.trackView;
        return root.name === 'Neighborhood' && root.parent === motionLab.scene
            && root.getObjectByName('Pavement and ground')?.isMesh
            && root.getObjectByName('Street markings')?.isMesh
            && !motionLab.scene.getObjectByName('Start / finish');
    }));

    const kartChoices = [
        ['gokart', 'gokart'], ['gt', 'gt', 'early'], ['gt-gt3', 'gt', 'gt3'], ['gt-gt3-v3', 'gt', 'gt3-v3'],
        ['f1', 'f1', undefined, 'early'], ['f1-2026', 'f1', undefined, '2026'], ['original'],
    ];
    for (const [option, prototype, gtTune, f1Tune] of kartChoices) {
        await kartMenu.selectOption(option);
        const options = await desktop.evaluate(() => {
            const { selection, trackId, prototype, gtTune, f1Tune, lap, karts } = drivingLab.getState();
            return { selection, trackId, prototype, gtTune, f1Tune, lap, karts, visible: drivingLab.kart.root.visible };
        });
        assert.deepEqual(options, {
            selection: 'neighborhood', trackId: 'neighborhood', prototype, gtTune, f1Tune, lap: undefined, karts: 1, visible: true,
        });
    }

    const startingPose = await startPose(desktop);
    await desktop.locator('#stage canvas').focus();
    await desktop.keyboard.down('ArrowUp');
    await desktop.waitForFunction(start => {
        const { z, speed, grounded } = drivingLab.getState().physics;
        return grounded && z > start.z + 1 && speed > 3;
    }, startingPose);
    await desktop.keyboard.up('ArrowUp');
    await desktop.locator('#reset').click();
    assert.deepEqual(await startPose(desktop), startingPose);
    assert.equal(await trackMenu.inputValue(), 'neighborhood');
    await kartMenu.selectOption('gt-gt3');
    await trackMenu.selectOption('original');
    assert(await lapPrompt.isVisible());
    assert.equal(await kartMenu.inputValue(), 'gt-gt3');
    assert(await desktop.evaluate(() => drivingLab.getState().trackId === 'original'
        && drivingLab.getState().gtTune === 'gt3' && motionLab.scene.getObjectByName('Start / finish')?.visible
        && !motionLab.scene.getObjectByName('Neighborhood')));
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.setDefaultTimeout(15_000);
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(`${base}&track=neighborhood&kart=gt&gtTune=gt3-v3`);
    await mobile.waitForFunction(() => window.drivingLabReady && window.motionLabReady);
    assert.equal(await mobile.locator('#race-track').inputValue(), 'neighborhood');
    assert.equal(await mobile.locator('#driving-kart').inputValue(), 'gt-gt3-v3');
    assert.equal(await mobile.evaluate(() => drivingLab.getState().gtTune), 'gt3-v3');
    const mobileStart = await startPose(mobile);
    const cdp = await mobile.context().newCDPSession(mobile);
    async function touch(name, id) {
        const box = await mobile.locator(`#race-${name}`).boundingBox();
        assert(box, `Touch button ${name} must be visible`);
        return { id, x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await touch('gas', 1), await touch('right', 2)] });
    await mobile.waitForFunction(start => {
        const { x, speed, steering } = drivingLab.getState().physics;
        return speed > 3 && steering > .01 && x < start.x - .1;
    }, mobileStart);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await mobile.waitForFunction(() => !motionLab.input.actions.gas && !motionLab.input.actions.right);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await touch('reverse', 3)] });
    await mobile.waitForFunction(() => drivingLab.getState().physics.speed < .5);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.locator('#reset').click();
    assert.deepEqual(await startPose(mobile), mobileStart);
    assert.equal(await mobile.locator('#race-track').inputValue(), 'neighborhood');

    assert.deepEqual(errors, []);
    console.log('PASS: Neighborhood menu and direct link, all kart choices, keyboard driving, reset, circuit return, and phone steering and pedals.');
}
finally {
    await browser.close();
    server.close();
}
