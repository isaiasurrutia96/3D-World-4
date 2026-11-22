import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Vector3 } from 'three';
import { buildKartPrototype } from '../../kart-parts/product-prototypes.js';
import { F1_2026_PROFILE } from '../kart/f1-2026-profile.ts';
import { KART_PROTOTYPES, PROTOTYPE_HANDLING } from '../kart/prototypes.ts';
import { ORIGINAL_PROFILE, PREVIOUS_FAST_PROFILE, steeringLimit, steeringResponse } from '../kart/profiles.ts';
import { createDrivingTest, PARKED_KARTS } from './drive.ts';

const ids = ['gokart', 'gt', 'f1'];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-4, `${a} should match ${b}`);

test('Prototype meshes and fixed-step geometry use the selected size and axle stations', () => {
    const expected = [[1.35, 2.35, 1.46], [2.19, 3.25, 2.10], [2.02, 4.60, 3.04]];
    for (const [i, id] of ids.entries()) {
        const { root, wheels, dimensions } = buildKartPrototype(id);
        const bounds = new Box3().setFromObject(root, true);
        const size = bounds.getSize(new Vector3());
        near(size.x, expected[i][0]);
        near(size.z, expected[i][1]);
        near(size.y, dimensions.height);
        near(bounds.min.y, 0);
        near(bounds.min.z, dimensions.tail);
        near(bounds.max.z, dimensions.nose);
        assert.equal(wheels.length, 4);
        for (const wheel of wheels) {
            const front = wheel.name.startsWith('wheel-front');
            near(wheel.position.z, front ? dimensions.frontProbe : -dimensions.rearProbe);
            near(wheel.position.y, dimensions[front ? 'frontTire' : 'rearTire'].radius);
        }
        const wheelbase = wheels[0].position.z - wheels[2].position.z;
        near(wheelbase, expected[i][2]);
        assert(root.getObjectByName('part:sidePanels'));
        assert(root.getObjectByName('part:seat'));
    }
    assert.equal(PROTOTYPE_HANDLING.f1, PREVIOUS_FAST_PROFILE);
});

test('F1 tune selection keeps the early profile and uses the same starting pose', () => {
    const early = createDrivingTest('original', { prototype: 'f1', f1Tune: 'early' });
    const modern = createDrivingTest('original', { prototype: 'f1', f1Tune: '2026' });
    const earlyState = early.getState();
    const modernState = modern.getState();
    assert.deepEqual(createDrivingTest('original', { prototype: 'f1' }).getState(), earlyState);
    assert.equal(earlyState.f1Tune, 'early');
    assert.equal(earlyState.fingerprint, 'kart-v1-a86c3ae8d1936d52');
    assert.equal(modernState.f1Tune, '2026');
    assert.equal(modern.controller.profile, F1_2026_PROFILE);
    assert.notEqual(modernState.fingerprint, earlyState.fingerprint);

    const { handling: earlyHandling, ...earlyPose } = earlyState.physics;
    const { handling: modernHandling, ...modernPose } = modernState.physics;
    assert.deepEqual(modernPose, earlyPose);
    assert.equal(earlyHandling.formula, undefined);
    assert.equal(modernHandling.formula.energyJ, 4_000_000);
    assert.throws(() => createDrivingTest('original', { prototype: 'f1', f1Tune: 'typo' }), /Unknown F1 tune/);
});

test('Only the F1 kart uses the F1 comparison tune', () => {
    for (const prototype of [undefined, 'gokart', 'gt']) {
        const baseline = createDrivingTest('original', { prototype });
        const withF1Option = createDrivingTest('original', { prototype, f1Tune: '2026' });
        assert.equal(baseline.controller.profile, prototype ? PROTOTYPE_HANDLING[prototype] : ORIGINAL_PROFILE);
        assert.deepEqual(withF1Option.getState(), baseline.getState());
        for (let frame = 0; frame < 30; frame++) {
            const input = { throttle: 1, steer: .1, brakeAmount: frame > 20 ? .4 : 0 };
            baseline.advance(1 / 30, input);
            withF1Option.advance(1 / 30, input);
        }
        assert.deepEqual(withF1Option.getState(), baseline.getState());
    }

    const parked = createDrivingTest(PARKED_KARTS);
    const selectedF1 = createDrivingTest(PARKED_KARTS, { prototype: 'f1', f1Tune: '2026' });
    assert.deepEqual(selectedF1.getState(), parked.getState());
    selectedF1.selectTrack('original');
    assert.equal(selectedF1.getState().f1Tune, '2026');
    assert.equal(selectedF1.controller.profile, F1_2026_PROFILE);
});

test('2026 F1 spends energy on the straight, recharges under braking and resets', () => {
    const driving = createDrivingTest('original', { prototype: 'f1', f1Tune: '2026' });
    const start = driving.getState();
    for (let frame = 0; frame < 12; frame++) driving.advance(.25, { throttle: 1 });
    const powered = driving.getState().physics;
    assert.equal(powered.contacts, 0);
    assert(powered.handling.formula.energyJ < start.physics.handling.formula.energyJ);
    assert(powered.handling.formula.deploymentPowerW > 0);
    assert.equal(powered.handling.formula.aeroOpening, 1);
    assert(powered.handling.formula.frontWeightFraction < start.physics.handling.formula.frontWeightFraction);

    for (let frame = 0; frame < 2; frame++) driving.advance(.25, { brakeAmount: 1 });
    const braking = driving.getState().physics;
    assert.equal(braking.contacts, 0);
    assert(braking.speed < powered.speed);
    assert(braking.handling.formula.energyJ > powered.handling.formula.energyJ);
    assert(braking.handling.formula.recoveryPowerW > 0);
    assert.equal(braking.handling.formula.aeroOpening, 0);
    assert(braking.handling.formula.frontWeightFraction > start.physics.handling.formula.frontWeightFraction);

    driving.reset();
    assert.deepEqual(driving.getState(), start);
});

function replayLap(prototype, fps, f1Tune) {
    const driving = createDrivingTest('original', { prototype, f1Tune });
    const { track } = driving, profile = driving.controller.profile;
    assert.equal(profile, f1Tune === '2026' ? F1_2026_PROFILE : PROTOTYPE_HANDLING[prototype]);
    const start = driving.getState();
    const wheelbase = KART_PROTOTYPES[prototype].wheelbase;
    let station = -4.5;

    function input(_tick, _seconds, state) {
        const position = track.project(state, { hintDistance: station, maxDelta: 30 });
        assert(position);
        const d = position.distance - station;
        station += d - Math.round(d / track.length) * track.length;
        const speed = Math.hypot(state.speed, state.lateralSpeed);
        const { point } = track.sample(station + 8 + speed * .42);
        const error = Math.atan2(point.x - state.x, point.z - state.z) - state.yaw;
        const distance = Math.hypot(point.x - state.x, point.z - state.z);
        const angle = Math.atan(wheelbase * 2 * Math.sin(error) / distance);
        const steer = Math.pow(Math.abs(angle) / steeringLimit(profile, speed, wheelbase), 1 / steeringResponse(profile, speed).exponent);
        return { throttle: speed < 14 ? Math.min(1, (14 - speed) / 4 + .22) : 0,
            brakeAmount: speed > 15 ? Math.min(1, (speed - 15) / 6) : 0,
            steer: -Math.sign(angle) * Math.min(1, steer) };
    }
    for (let frame = 0; frame < fps * (Math.ceil(track.length / 12) + 30) && driving.lap.laps === 0; frame++) {
        driving.advance(1 / fps, input);
        assert(driving.controller.state.grounded);
    }

    assert.equal(driving.lap.laps, 1, `${prototype} must complete a timed lap`);
    assert(driving.lap.best > 0);
    assert.equal(driving.lap.last, driving.lap.best);
    assert.equal(driving.getState().prototype, prototype);
    assert.equal(driving.getState().fingerprint, profile.fingerprint);
    const time = driving.lap.best;
    driving.reset();
    assert.deepEqual(driving.getState(), start);

    driving.selectTrack(PARKED_KARTS);
    assert.equal(driving.lap, undefined);
    assert.equal(driving.getState().karts, 3);
    driving.selectTrack('original');
    assert.deepEqual(driving.getState(), start);
    return time;
}

for (const id of ids) {
    test(`${id} races a complete lap and records the same time at 30 and 144 Hz`, () => {
        assert.equal(replayLap(id, 30), replayLap(id, 144));
    });
}

test('2026 F1 completes and records the same timed lap at 30 and 144 Hz', () => {
    assert.equal(replayLap('f1', 30, '2026'), replayLap('f1', 144, '2026'));
});
