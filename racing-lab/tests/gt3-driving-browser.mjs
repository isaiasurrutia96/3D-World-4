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
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/racing-lab/?drive=1`;
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.on('pageerror', error => errors.push(error.message));
    const cdp = await mobile.context().newCDPSession(mobile);
    const kartMenu = mobile.locator('#driving-kart');
    const sound = mobile.getByRole('button', { name: 'Engine sound' });
    async function touch(name, id) {
        const box = await mobile.locator('#race-' + name).boundingBox();
        assert(box, `Touch button ${name} must be visible`);
        return { id, x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }

    await mobile.goto(base + '&kart=gt&track=original');
    await mobile.waitForFunction(() => window.drivingLabReady && window.motionLabReady);
    const gtRevs = mobile.locator('#drive-gt-revs');
    const gtAids = mobile.locator('#drive-gt-aids');
    const boostControl = mobile.locator('#race-boost');
    const help = mobile.locator('#test-videos .help');
    assert.equal(await kartMenu.inputValue(), 'gt');
    assert.equal(await mobile.locator('option:checked').filter({ hasText: 'First-drive GT' }).count(), 1);
    assert.equal(await mobile.evaluate(() => drivingLab.getState().gtTune), 'early');
    assert.equal(await mobile.evaluate(() => drivingLab.getState().fingerprint), 'kart-v1-2cb884a348f1e733');
    assert(await gtRevs.isHidden());
    assert(await gtAids.isHidden());
    assert(await boostControl.isVisible());
    assert.match(await help.textContent(), /Shift: boost/);
    await mobile.evaluate(() => { window.comparisonGT = { kart: drivingLab.kart.root, start: drivingLab.getState().pose }; });
    await kartMenu.selectOption({ label: 'GT3' });
    assert.equal(await kartMenu.inputValue(), 'gt-gt3');
    assert(await mobile.evaluate(() => {
        const { gtTune, trackId, prototype, pose } = drivingLab.getState();
        return gtTune === 'gt3' && trackId === 'original' && prototype === 'gt' && drivingLab.kart.root === comparisonGT.kart
            && pose.x === comparisonGT.start.x && pose.z === comparisonGT.start.z && pose.yaw === comparisonGT.start.yaw;
    }));
    const initialRevs = await gtRevs.textContent();
    assert.match(initialRevs, /^Gear 1 · \d+ rpm$/);
    assert.equal(await gtAids.textContent(), 'TC ready · ABS ready');
    assert.equal(await mobile.locator('.race-hud').getAttribute('aria-live'), 'off');
    assert(await boostControl.isHidden());
    assert(await boostControl.isDisabled());
    assert(await sound.isHidden());
    assert.doesNotMatch(await help.textContent(), /boost/i);
    for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 844, height: 390 }]) {
        await mobile.setViewportSize(viewport);
        await mobile.evaluate(() => scrollTo(0, 0));
        await settle(mobile);
        assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert((await mobile.locator('#stage').boundingBox()).y <= 120);
        assert(await mobile.locator('#race-track, #driving-kart, #reset, .drive-controls button').evaluateAll(targets => targets.every(button => {
            const rect = button.getBoundingClientRect();
            return rect.width >= 44 && rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight
                && button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
        })), `GT3 controls must stay reachable at ${viewport.width} × ${viewport.height}`);
    }
    await mobile.setViewportSize({ width: 390, height: 844 });
    await settle(mobile);
    await mobile.locator('#stage canvas').focus();
    await mobile.keyboard.down('Shift');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await touch('gas', 40)] });
    await mobile.waitForFunction(text => {
        const { speed, handling: { gt3 } } = drivingLab.getState().physics;
        return speed > 15 && document.querySelector('#drive-gt-revs').textContent === `Gear ${gt3.gear} · ${Math.round(gt3.rpm / 50) * 50} rpm`
            && document.querySelector('#drive-gt-revs').textContent !== text;
    }, initialRevs);
    assert(await mobile.evaluate(() => motionLab.input.getState().actions.boost));
    assert.equal(await mobile.evaluate(() => drivingLab.getState().physics.boostTime), 0);
    await mobile.keyboard.up('Shift');
    const speedBeforeBrake = await mobile.evaluate(() => drivingLab.getState().physics.speed);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await touch('reverse', 41)] });
    await mobile.waitForFunction(speedBefore => {
        const { speed, handling: { gt3 } } = drivingLab.getState().physics;
        return speed < speedBefore - 2 && gt3.absIntervention >= .01 && document.querySelector('#drive-gt-aids').textContent.includes('ABS active');
    }, speedBeforeBrake);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.locator('#reset').click();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await touch('gas', 42), await touch('left', 43)] });
    await mobile.waitForFunction(() => {
        const { handling: { gt3 } } = drivingLab.getState().physics;
        return gt3.tractionIntervention >= .01 && document.querySelector('#drive-gt-aids').textContent.includes('TC active');
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await mobile.locator('#reset').click();
    assert.equal(await mobile.locator('#drive-speed').textContent(), '0 mph');
    assert.equal(await gtRevs.textContent(), initialRevs);
    assert.equal(await gtAids.textContent(), 'TC ready · ABS ready');

    await mobile.locator('#race-track').selectOption('parked-karts');
    assert(await kartMenu.isDisabled());
    assert(await gtAids.isHidden());
    assert(await boostControl.isVisible());
    await mobile.locator('#race-track').selectOption('original');
    assert.equal(await kartMenu.inputValue(), 'gt-gt3');
    await kartMenu.selectOption('gt');
    assert.equal(await mobile.evaluate(() => drivingLab.getState().gtTune), 'early');
    assert(await boostControl.isVisible());
    assert(await gtAids.isHidden());
    await mobile.goto(base + '&kart=gt&gtTune=gt3&track=original');
    await mobile.waitForFunction(() => window.drivingLabReady && window.motionLabReady);
    assert.equal(await kartMenu.inputValue(), 'gt-gt3');
    assert.equal(await mobile.evaluate(() => drivingLab.getState().gtTune), 'gt3');
    assert.equal(await gtRevs.textContent(), initialRevs);

    const v2Fingerprint = 'kart-v1-ab5d59ff069b51c6';
    assert.equal(await mobile.evaluate(() => drivingLab.getState().fingerprint), v2Fingerprint);
    await mobile.evaluate(() => { window.comparisonGT = { kart: drivingLab.kart.root, start: drivingLab.getState().pose }; });
    await kartMenu.selectOption({ label: 'GT3 V3' });
    assert.equal(await kartMenu.inputValue(), 'gt-gt3-v3');
    assert(await mobile.evaluate(oldFingerprint => {
        const { gtTune, trackId, prototype, fingerprint, pose } = drivingLab.getState();
        return gtTune === 'gt3-v3' && trackId === 'original' && prototype === 'gt' && fingerprint !== oldFingerprint
            && drivingLab.kart.root === comparisonGT.kart && pose.x === comparisonGT.start.x
            && pose.z === comparisonGT.start.z && pose.yaw === comparisonGT.start.yaw;
    }, v2Fingerprint));
    assert(await gtRevs.isVisible());
    assert(await gtAids.isVisible());
    assert.equal(await gtAids.textContent(), 'TC ready · ABS ready');
    assert(await boostControl.isHidden());
    assert(await boostControl.isDisabled());
    const v3Revs = await gtRevs.textContent();
    assert.match(v3Revs, /^Gear 1 · \d+ rpm$/);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await touch('gas', 44), await touch('left', 45)] });
    await mobile.waitForFunction(revs => {
        const { speed, steering, yaw } = drivingLab.getState().physics;
        return speed > 5 && steering < -.01 && yaw > comparisonGT.start.yaw + .04
            && document.querySelector('#drive-gt-revs').textContent !== revs;
    }, v3Revs);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await mobile.waitForFunction(() => !motionLab.input.actions.gas && !motionLab.input.actions.left);
    await mobile.locator('#reset').click();
    assert.equal(await gtRevs.textContent(), v3Revs);

    const trackMenu = mobile.locator('#race-track');
    await trackMenu.selectOption('neighborhood');
    assert.equal(await kartMenu.inputValue(), 'gt-gt3-v3');
    assert(await mobile.evaluate(() => {
        const { gtTune, trackId, lap } = drivingLab.getState();
        return gtTune === 'gt3-v3' && trackId === 'neighborhood' && !lap && drivingLab.kart.root === comparisonGT.kart;
    }));
    await trackMenu.selectOption('original');
    assert.equal(await kartMenu.inputValue(), 'gt-gt3-v3');
    await kartMenu.selectOption('gt-gt3');
    assert.equal(await mobile.evaluate(() => drivingLab.getState().fingerprint), v2Fingerprint);

    assert.deepEqual(errors, []);
    console.log('PASS: GT3 and GT3 V3 phone comparison, unchanged First-drive GT and chassis, direct GT3 link, reachable controls, live gear and revs, ABS and TC intervention, boost isolation, track switches, and reset.');
}
finally {
    await browser.close();
    server.close();
}
