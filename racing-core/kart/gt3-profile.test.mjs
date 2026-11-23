import assert from 'node:assert/strict';
import test from 'node:test';
import { createKartController, KART } from './index.ts';
import { F1_2026_PROFILE } from './f1-2026-profile.ts';
import { GT3_PROFILE } from './gt3-profile.ts';
import { KART_PROTOTYPES } from './prototypes.ts';
import { STANDARD_GRAVITY } from './profiles.ts';

const flatRoad = { heightAt: () => 0 };
const velocity = state => Math.hypot(state.speed, state.lateralSpeed);
const makeController = (speedKmh = 0, profile = GT3_PROFILE) => createKartController({
    geometry: KART_PROTOTYPES.gt, profile, world: flatRoad, initial: { speed: speedKmh / 3.6 },
});

function inRange(measured, min, max, label) {
    assert.ok(measured >= min && measured <= max, `${label}: ${measured}, expected ${min}–${max}`);
}

function accelerationGates(frameRate) {
    const targets = [60 * 1.609344, 100, 150, 200, 250, 275, 286].map(kmh => kmh / 3.6);
    const kart = makeController();
    const crossings = [];
    let peakG = 0;
    for (let frame = 0; frame < 50 * frameRate && crossings.length < targets.length; frame++) {
        const trace = kart.advanceWithTrace(1 / frameRate, { throttle: 1 });
        let previous = trace.from;
        for (const [offset, state] of trace.states.entries()) {
            const target = targets[crossings.length];
            peakG = Math.max(peakG, state.handling.acceleration / STANDARD_GRAVITY);
            if (previous.speed < target && state.speed >= target) {
                const fraction = (target - previous.speed) / (state.speed - previous.speed);
                crossings.push((trace.firstTick + offset + fraction) * KART.step);
            }
            previous = state;
        }
    }
    assert.equal(crossings.length, targets.length);
    return { crossings, peakG };
}

test('GT3 launch and rolling acceleration are repeatable across display frame rates', () => {
    const result = accelerationGates(30);
    assert.deepEqual(accelerationGates(144), result);
    const [toSixty, to100, to150, to200, to250, to275, toCap] = result.crossings;
    // Acura's 4.35 s to 60 mph is an estimate for a race NSX GT3 Evo. The
    // 100–200 band is a secondary comparison to a public iRacing lap.
    inRange(toSixty, 3.6, 4.35, '0–60 mph in seconds');
    inRange(to200 - to100, 7, 8.1, '100–200 km/h in seconds');
    assert.ok(to200 - to150 > to150 - to100, 'The equal speed increments take longer at speed');
    assert.ok(to250 - to200 > to200 - to150);
    inRange(toCap - to275, 5, 13, 'The governor is approached gradually');
    inRange(result.peakG, .70, .86, 'Peak acceleration in g');
});

function stopAt(entryKmh, exitKmh) {
    const kart = makeController(entryKmh);
    const target = exitKmh / 3.6;
    let peakG = 0;
    for (let tick = 0; tick < 6 / KART.step; tick++) {
        const before = kart.state;
        const after = kart.advance(KART.step, { brakeAmount: 1 });
        assert.ok(after.grounded);
        peakG = Math.max(peakG, after.handling.brakingG);
        if (after.speed <= target) {
            const fraction = (before.speed - target) / (before.speed - after.speed);
            return {
                seconds: (tick + fraction) * KART.step,
                metres: before.z + fraction * (after.z - before.z),
                peakG,
            };
        }
    }
    assert.fail(`Did not complete ${entryKmh}→${exitKmh} km/h stop`);
}

test('GT3 straight-line braking builds to the measured GT3-class peak at speed', () => {
    const fast = stopAt(250, 100);
    const slow = stopAt(100, 0);
    inRange(fast.peakG, 1.95, 2.2, 'Fast peak braking in g');
    inRange(fast.seconds, 2.2, 2.9, '250–100 km/h in seconds');
    inRange(fast.metres, 104, 139, '250–100 km/h full brake distance in metres');
    inRange(slow.peakG, 1.25, 1.55, 'Low-speed peak braking in g');
});

test('GT3 has a progressive lift response between steady power and full braking', () => {
    function liftAt(kmh) {
        const kart = makeController(kmh - 5);
        while (kart.state.speed * 3.6 < kmh && kart.clock.seconds < 5) {
            kart.advance(KART.step, { throttle: 1 });
        }
        const entry = kart.state.speed * 3.6;
        assert.ok(entry >= kmh);
        const first = kart.advance(KART.step, {}).handling.brakingG;
        let peak = first;
        for (let tick = 1; tick < 1 / KART.step; tick++) {
            peak = Math.max(peak, kart.advance(KART.step, {}).handling.brakingG);
        }
        return { first, peak, speedLoss: entry - kart.state.speed * 3.6 };
    }
    const medium = liftAt(120);
    const fast = liftAt(250);
    inRange(medium.speedLoss, 4, 8, '120 km/h lift speed loss in one second');
    inRange(fast.speedLoss, 11, 18, '250 km/h lift speed loss in one second');
    assert.ok(fast.first < fast.peak * .60);
    assert.ok(fast.peak > medium.peak && fast.peak < .6);
});

function heldTurn(kmh, profile = GT3_PROFILE) {
    const initialSpeed = kmh / 3.6;
    const kart = makeController(kmh, profile);
    let initialLateral;
    for (let tick = 0; tick < 2 / KART.step; tick++) {
        // Keep the test at the selected speed using a light throttle correction.
        const error = initialSpeed - velocity(kart.state);
        const throttle = Math.max(.0001, Math.min(1, .07 + 1.5 * error));
        const state = kart.advance(KART.step, { throttle, steer: 1 });
        if (tick === 23) initialLateral = state.handling.lateralG;
    }
    assert.ok(Math.abs(velocity(kart.state) * 3.6 - kmh) < 3);
    return { handling: kart.state.handling, initialLateral };
}

test('GT3 holds the dry grip envelope with progressive turn-in', () => {
    for (const [kmh, minG, maxG] of [[50, 1.2, 1.4], [120, 1.6, 1.7], [240, 2.1, 2.4]]) {
        const { handling } = heldTurn(kmh);
        inRange(handling.lateralG, minG, maxG, `${kmh} km/h lateral g`);
        assert.ok(Math.abs(handling.slipAngle) < 3 * Math.PI / 180);
    }
    const gt = heldTurn(120);
    // Use the same geometry to isolate the handling tune from wheelbase.
    const formula = heldTurn(120, F1_2026_PROFILE);
    assert.ok(gt.initialLateral < formula.initialLateral * .85);
    assert.ok(gt.initialLateral < gt.handling.lateralG * .55);
});

test('GT3 trail braking transfers tire capacity from braking to steering', () => {
    const kart = makeController(175);
    let entry;
    let peakUsage = 0;
    for (let tick = 0; tick <= 90; tick++) {
        const blend = Math.min(1, Math.max(0, (tick - 24) / 66));
        const { handling } = kart.advance(KART.step, {
            brakeAmount: .97 - .77 * blend, steer: .52 + .38 * blend,
        });
        const longitudinal = handling.brakingG * STANDARD_GRAVITY / handling.longitudinalLimit;
        const lateral = handling.lateralG * STANDARD_GRAVITY / handling.lateralLimit;
        const usage = Math.hypot(longitudinal, lateral);
        peakUsage = Math.max(peakUsage, usage);
        assert.ok(usage <= 1 + 1e-9, `Combined tire budget ${usage}`);
        if (tick === 24) entry = handling;
    }
    assert.ok(peakUsage > .97, 'The transition exercises the combined grip limit');
    const exit = kart.state.handling;
    assert.ok(exit.brakingG < entry.brakingG * .40);
    assert.ok(exit.lateralG > entry.lateralG + .50);
    assert.ok(Math.abs(exit.slipAngle) < 4 * Math.PI / 180);
});
