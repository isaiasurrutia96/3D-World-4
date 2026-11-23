import assert from 'node:assert/strict';
import test from 'node:test';
import { createKartController, KART, kartVelocity } from '../kart/index.ts';
import { GT3_PROFILE } from '../kart/gt3-profile.ts';
import { GT3_V3_PROFILE } from '../kart/gt3-v3-profile.ts';
import { MPH, STANDARD_GRAVITY } from '../kart/profiles.ts';
import { KART_PROTOTYPES } from '../kart/prototypes.ts';
import { createDrivingTest, NEIGHBORHOOD, PARKED_KARTS } from './drive.ts';

const geometry = KART_PROTOTYPES.gt;
const speed = state => Math.hypot(state.speed, state.lateralSpeed);
const travelHeading = state => {
    const { x, z } = kartVelocity(state);
    return Math.atan2(x, z);
};

test('GT3 V3 keeps its own tune across circuit, Neighborhood and reset', () => {
    const options = { prototype: 'gt', gtTune: 'gt3-v3' };
    const driving = createDrivingTest('original', options);
    const original = driving.getState();
    const current = createDrivingTest('original', { prototype: 'gt', gtTune: 'gt3' });
    assert.equal(driving.controller.profile, GT3_V3_PROFILE);
    assert.equal(current.controller.profile, GT3_PROFILE);
    assert.notEqual(original.fingerprint, current.getState().fingerprint);
    for (const track of ['original', NEIGHBORHOOD]) {
        driving.selectTrack(track);
        const start = driving.getState();
        assert.equal(start.gtTune, 'gt3-v3');
        assert.equal(driving.controller.profile, GT3_V3_PROFILE);
        assert.ok(start.physics.handling.gt3);
        assert.equal(driving.lap === undefined, track === NEIGHBORHOOD);
        driving.advance(.25, { throttle: 1, steer: .25 });
        assert.ok(driving.controller.state.speed > 0);
        driving.reset();
        assert.deepEqual(driving.getState(), start);
    }
    driving.selectTrack(PARKED_KARTS);
    assert.deepEqual(driving.getState(), createDrivingTest(PARKED_KARTS).getState());
    driving.selectTrack('original');
    assert.deepEqual(driving.getState(), original);
});

function compoundTurn(gtTune, addGas) {
    const driving = createDrivingTest('original', { prototype: 'gt', gtTune });
    const station = 443, track = driving.track;
    const { point, forward } = track.sample(station);
    const yaw = Math.atan2(forward.x, forward.z);
    driving.controller.reset({ ...point, yaw, speed: 82 / 3.6 });

    const liftTicks = Math.round(.55 / KART.step);
    const testTicks = Math.round(1.5 / KART.step);
    let turnIn = 0, peakOffset = 0;
    for (let tick = 1; tick <= testTicks; tick++) {
        const state = driving.advance(KART.step, { steer: 1, throttle: Number(addGas && tick > liftTicks) });
        assert.ok(state.grounded);
        assert.equal(state.contacts, 0);
        const support = track.heightAt(state.x, state.z, state.y + KART.supportReach);
        assert.ok(support !== null && Math.abs(state.y - support) < 1e-6, 'The kart stays on the road surface');
        const h = state.handling;
        const tireLoad = Math.hypot(h.acceleration / h.longitudinalLimit, h.lateralG * STANDARD_GRAVITY / h.lateralLimit);
        assert.ok(tireLoad <= 1 + 1e-8, `Combined tire load ${tireLoad}`);
        const line = track.project(state, { hintDistance: station, maxDelta: 55 });
        assert.ok(line);
        peakOffset = Math.max(peakOffset, Math.abs(line.offset));
        if (tick === Math.round(.20 / KART.step)) turnIn = yaw - travelHeading(state);
    }
    return { turnIn, peakOffset, exitKmh: speed(driving.controller.state) * 3.6 };
}

test('GT3 V3 turns sooner and follows a tighter line at similar road speed', () => {
    for (const addGas of [false, true]) {
        const gt3 = compoundTurn('gt3', addGas);
        const v3 = compoundTurn('gt3-v3', addGas);
        assert.ok(gt3.turnIn > 0 && v3.turnIn > gt3.turnIn * 1.15, `Turn-in: GT3 ${gt3.turnIn}, V3 ${v3.turnIn}`);
        assert.ok(v3.peakOffset < gt3.peakOffset * .8, `Peak line offset: GT3 ${gt3.peakOffset} m, V3 ${v3.peakOffset} m`);
        assert.ok(Math.abs(v3.exitKmh - gt3.exitKmh) < 1, `Exit speed: GT3 ${gt3.exitKmh} km/h, V3 ${v3.exitKmh} km/h`);
    }
});

function steeringRun(profile, targetSpeed, seconds, steerAtTick) {
    const world = { heightAt: () => 0 };
    const kart = createKartController({ world, profile, geometry, initial: { speed: targetSpeed } });
    const trace = [];
    for (let tick = 0; tick < Math.round(seconds / KART.step); tick++) {
        const throttle = Math.max(.0001, Math.min(1, .07 + 1.5 * (targetSpeed - speed(kart.state))));
        trace.push(kart.advance(KART.step, { throttle, steer: steerAtTick(tick) }));
    }
    return trace;
}

test('GT3 V3 responds to a short road-speed tap and retains progressive low-speed steering', () => {
    const tapTicks = Math.round(.125 / KART.step);
    const tap = tick => Number(tick < tapTicks);
    const gt3Tap = steeringRun(GT3_PROFILE, 100 / 3.6, .625, tap);
    const v3Tap = steeringRun(GT3_V3_PROFILE, 100 / 3.6, .625, tap);
    const headingAtRelease = trace => Math.abs(travelHeading(trace[tapTicks - 1]));
    assert.ok(headingAtRelease(v3Tap) > headingAtRelease(gt3Tap) * 1.2);
    assert.equal(v3Tap.at(-1).steering, 0);
    assert.ok(v3Tap.at(-1).handling.lateralG < .05, 'Lateral motion settles after release');

    const partialTicks = Math.round(.75 / KART.step);
    const slowTurn = tick => tick < partialTicks ? .35 : 1;
    const gt3Slow = steeringRun(GT3_PROFILE, 16 * MPH, 2, slowTurn);
    const v3Slow = steeringRun(GT3_V3_PROFILE, 16 * MPH, 2, slowTurn);
    const smallInputG = v3Slow[partialTicks - 1].handling.lateralG;
    const gt3SmallInputG = gt3Slow[partialTicks - 1].handling.lateralG;
    assert.ok(smallInputG > .25 && smallInputG <= gt3SmallInputG * 1.03);
    const radius = state => speed(state) ** 2 / (state.handling.lateralG * STANDARD_GRAVITY);
    assert.ok(Math.abs(radius(v3Slow.at(-1)) / radius(gt3Slow.at(-1)) - 1) < .05, 'Slow full-lock radius stays close to GT3');
});
