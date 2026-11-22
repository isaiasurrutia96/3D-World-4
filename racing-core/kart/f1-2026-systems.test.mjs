import assert from 'node:assert/strict';
import test from 'node:test';
import { electricalPowerLimitW, F1_2026_SYSTEMS, finishF12026Systems, initialF12026Systems, prepareF12026Systems } from './f1-2026-systems.ts';

const dt = 1 / 120;
const speed = 320 / 3.6;
const controls = Object.freeze({
    dt, speed, throttle: 1, brake: 0, steer: 0, overtake: false, grounded: true,
    reverse: false, coasting: false, baselineDriveAcceleration: 4,
});
const motion = Object.freeze({ dt, speed, nextSpeed: speed + 4 * dt, grounded: true, poweredAcceleration: 4 });
const close = (actual, expected, tolerance = 1e-8) => {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} versus ${expected}`);
};

test('2026 motor ceilings match the FIA normal and Overtake envelope breakpoints', () => {
    for (const [kph, normalKw, overtakeKw] of [[0, 350, 350], [290, 350, 350], [310, 250, 350],
        [320, 200, 350], [337.5, 112.5, 350], [340, 100, 300], [342.5, 50, 250], [345, 0, 200],
        [352.5, 0, 50], [355, 0, 0], [360, 0, 0]]) {
        close(electricalPowerLimitW(kph / 3.6, false), normalKw * 1000);
        close(electricalPowerLimitW(kph / 3.6, true), overtakeKw * 1000);
    }
});

test('Available routine assist is already in the calibrated net curve and Overtake supplies the difference', () => {
    const state = initialF12026Systems();
    const routine = prepareF12026Systems(state, controls);
    const overtake = prepareF12026Systems(state, { ...controls, overtake: true });
    const empty = prepareF12026Systems({ ...state, energyJ: 0 }, controls);
    assert.equal(routine.deploymentAccelerationDelta, 0);
    assert.ok(routine.deploymentPowerW > 0 && routine.deploymentPowerW <= 200_000);
    assert.equal(overtake.deploymentPowerW, 350_000);
    assert.equal(empty.deploymentPowerW, 0);
    close(overtake.deploymentAccelerationDelta, (350_000 - routine.deploymentPowerW) / (772 * speed));
    close(empty.deploymentAccelerationDelta, -routine.deploymentPowerW / (772 * speed));
    assert.equal(prepareF12026Systems(state, { ...controls, speed: 49.99 / 3.6, overtake: true }).deploymentPowerW, 0);
    const rollout = prepareF12026Systems(state, { ...controls, speed: 50 / 3.6, overtake: true });
    assert.ok(rollout.deploymentPowerW > 0 && rollout.deploymentPowerW < 350_000);
    close(rollout.deploymentPowerW, 500 * Math.PI / 30 * rollout.rpm);
});

test('Aero opens and closes over 400 milliseconds, changing speed-dependent grip and drag', () => {
    let state = initialF12026Systems();
    for (let tick = 0; tick < 48; tick++) {
        const step = prepareF12026Systems(state, controls);
        close(step.aeroOpening, (tick + 1) / 48);
        state = finishF12026Systems(state, step, motion);
    }
    close(state.aeroOpening, 1);
    const limited = prepareF12026Systems(state, { ...controls, driveEnabled: false });
    close(limited.aeroOpening, 1);
    assert.equal(limited.deploymentPowerW, 0);
    for (let tick = 0; tick < 48; tick++) {
        const step = prepareF12026Systems(state, { ...controls, brake: .1 });
        close(step.aeroOpening, 1 - (tick + 1) / 48);
        state = finishF12026Systems(state, step, { ...motion, nextSpeed: speed - dt, poweredAcceleration: 0 });
    }
    close(state.aeroOpening, 0);
    const corner = inputSpeed => prepareF12026Systems(state, { ...controls, speed: inputSpeed, steer: .3 });
    const straight = inputSpeed => prepareF12026Systems({ ...state, aeroOpening: 1 }, { ...controls, speed: inputSpeed });
    close(corner(60).dragAcceleration, 4 * corner(30).dragAcceleration);
    close(straight(60).dragAcceleration, 0);
    assert.ok(straight(60).gripMultiplier < straight(30).gripMultiplier);
    close(corner(60).gripMultiplier, 1);
});

test('Deployment spends only available charge and requires actual propulsive work', () => {
    const state = { ...initialF12026Systems(), energyJ: 20 };
    const step = prepareF12026Systems(state, { ...controls, overtake: true });
    close(step.deploymentPowerW * dt, 20);
    const used = finishF12026Systems(state, step, motion);
    assert.ok(Object.isFrozen(used));
    close(used.energyJ, 0);
    close(used.deploymentPowerW * dt, 20);
    const stopped = finishF12026Systems(state, step, { ...motion, poweredAcceleration: 0 });
    assert.equal(stopped.energyJ, state.energyJ);
    assert.equal(stopped.deploymentPowerW, 0);
    const airborne = finishF12026Systems(state, step, { ...motion, grounded: false });
    assert.equal(airborne.energyJ, state.energyJ);
});

test('Regeneration follows forward negative work, rear load and remaining battery headroom', () => {
    const state = { ...initialF12026Systems(), energyJ: 20 };
    const braking = prepareF12026Systems(state, { ...controls, brake: 1, throttle: 0 });
    const moving = { ...motion, nextSpeed: speed - .05, poweredAcceleration: 0 };
    const normalRear = finishF12026Systems(state, braking, { ...moving, rearLoadFraction: .55 });
    const lightRear = finishF12026Systems(state, braking, { ...moving, rearLoadFraction: .3 });
    assert.ok(lightRear.energyJ > state.energyJ && normalRear.energyJ > lightRear.energyJ);
    close(normalRear.energyJ - state.energyJ, normalRear.recoveryPowerW * dt);
    const stronger = finishF12026Systems(state, braking, { ...moving, nextSpeed: speed - .3 });
    assert.equal(stronger.recoveryPowerW, F1_2026_SYSTEMS.motorPowerLimitW);

    const almostFull = { ...state, energyJ: F1_2026_SYSTEMS.energyCapacityJ - 20 };
    close(finishF12026Systems(almostFull, braking, moving).energyJ, F1_2026_SYSTEMS.energyCapacityJ);
    for (const situation of [{ reverse: true, brake: 1 }, { grounded: false, brake: 1 }, { brake: 0 }]) {
        const step = prepareF12026Systems(state, { ...controls, throttle: 0, ...situation });
        assert.equal(finishF12026Systems(state, step, moving).energyJ, state.energyJ);
    }
    const coast = prepareF12026Systems(state, { ...controls, throttle: 0, coasting: true });
    assert.ok(finishF12026Systems(state, coast, moving).energyJ > state.energyJ);
    const dragOnly = finishF12026Systems(state, coast, { ...moving, nextSpeed: speed - .004 });
    assert.equal(dragOnly.recoveryPowerW, 0);
    const governorOnly = finishF12026Systems(state, coast, { ...moving, recoverableDeceleration: 0 });
    assert.equal(governorOnly.recoveryPowerW, 0);
});

test('Eight forward gears reproduce the measured upshift bands with hysteresis on deceleration', () => {
    let state = initialF12026Systems();
    const shiftSpeeds = [124, 157, 184, 212, 239, 269, 304];
    for (const [i, speedKph] of shiftSpeeds.entries()) {
        const before = prepareF12026Systems(state, { ...controls, speed: (speedKph - .01) / 3.6 });
        const after = prepareF12026Systems(state, { ...controls, speed: (speedKph + .01) / 3.6 });
        assert.equal(before.gear, i + 1);
        assert.equal(after.gear, i + 2);
        assert.ok(before.rpm > after.rpm && before.rpm <= F1_2026_SYSTEMS.engineRpmLimit);
        state = finishF12026Systems(state, after, motion);
        assert.equal(prepareF12026Systems(state, { ...controls, speed: (speedKph - .01) / 3.6 }).gear, after.gear);
    }
    assert.equal(prepareF12026Systems(state, { ...controls, speed: 200 / 3.6 }).gear, 5);
    assert.equal(prepareF12026Systems(state, { ...controls, speed: 0 }).gear, 1);
    assert.equal(prepareF12026Systems(state, { ...controls, reverse: true }).gear, -1);
});
