import assert from 'node:assert/strict';
import test from 'node:test';
import { createKartController, KART } from './index.ts';
import { F1_2026_PROFILE } from './f1-2026-profile.ts';
import { KART_PROTOTYPES } from './prototypes.ts';
import { PREVIOUS_FAST_PROFILE, STANDARD_GRAVITY, sampleCurve, steeringLimit } from './profiles.ts';

const flatRoad = { heightAt: () => 0 };
const geometry = KART_PROTOTYPES.f1;
const kmh = speed => speed * 3.6;
const makeController = (profile = F1_2026_PROFILE, initial = {}) =>
    createKartController({ geometry, profile, world: flatRoad, initial });

// OpenF1 session 11361, Russell, lap 1. The data cadence limits precision.
const launchGates = [[100, 2.374], [200, 4.500], [250, 6.540], [280, 7.600], [300, 8.961]];

function launch(frameRate) {
    const kart = makeController();
    const crossings = [];
    for (let frame = 0; frame < frameRate * 14 && crossings.length < launchGates.length; frame++) {
        const trace = kart.advanceWithTrace(1 / frameRate, { throttle: 1 });
        let previous = trace.from;
        for (const [i, state] of trace.states.entries()) {
            if (crossings.length === launchGates.length) break;
            const target = launchGates[crossings.length][0] / 3.6;
            if (previous.speed < target && state.speed >= target) {
                const fraction = (target - previous.speed) / (state.speed - previous.speed);
                crossings.push((trace.firstTick + i + fraction) * KART.step);
            }
            previous = state;
        }
    }
    return crossings;
}

test('2026 F1 launch matches sampled speed gates at phone and desktop frame rates', () => {
    const times = launch(30);
    assert.equal(times.length, launchGates.length);
    assert.deepEqual(launch(144), times);
    for (const [i, [speed, observedTime]] of launchGates.entries()) {
        assert.ok(Math.abs(times[i] - observedTime) < .30, `${speed} km/h in ${times[i]} s`);
    }
    assert.ok(F1_2026_PROFILE.topSpeed > 330 / 3.6);
    const earlyDrop = sampleCurve(PREVIOUS_FAST_PROFILE.acceleration, 55.5) - sampleCurve(PREVIOUS_FAST_PROFILE.acceleration, 56.5);
    const currentDrop = sampleCurve(F1_2026_PROFILE.acceleration, 55.5) - sampleCurve(F1_2026_PROFILE.acceleration, 56.5);
    assert.ok(currentDrop < earlyDrop / 4, `The old 200 km/h power drop was ${earlyDrop}, now ${currentDrop}`);
});

test('The 2026 F1 spends energy at the speed cap and loses speed on a depleted battery', () => {
    const kart = makeController();
    for (let frame = 0; frame < 20 * 60; frame++) kart.advance(1 / 60, { throttle: 1 });
    const atCap = kart.state;
    assert.ok(Math.abs(kmh(atCap.speed) - 338.1) < .01);
    assert.equal(atCap.handling.formula.aeroOpening, 1);
    assert.ok(atCap.handling.formula.deploymentPowerW > 0);
    assert.equal(atCap.handling.formula.recoveryPowerW, 0);
    for (let frame = 0; frame < 45 * 60; frame++) kart.advance(1 / 60, { throttle: 1 });
    assert.equal(kart.state.handling.formula.energyJ, 0);
    assert.ok(kmh(kart.state.speed) < 335);
});

function stopAt(profile, entryKmh, exitKmh) {
    const speed = entryKmh / 3.6;
    const kart = makeController(profile, {
        speed,
        boostTime: speed > profile.topSpeed ? KART.boostDuration : 0,
    });
    const target = exitKmh / 3.6;
    let peak = 0;
    for (let step = 0; step < 8 / KART.step; step++) {
        const previous = kart.state;
        const state = kart.advance(KART.step, { brakeAmount: 1 });
        assert.ok(state.grounded);
        peak = Math.max(peak, state.handling.brakingG);
        if (state.speed <= target) {
            const fraction = (previous.speed - target) / (previous.speed - state.speed);
            return {
                seconds: (step + fraction) * KART.step,
                metres: previous.z + fraction * (state.z - previous.z),
                peak,
            };
        }
    }
    assert.fail(`${entryKmh} km/h to ${exitKmh} km/h did not complete`);
}

test('2026 F1 braking improves the fit to time and distance over five reference zones', () => {
    // Brembo modeled runs recorded in docs/karts/F1-DRIVING-REFERENCE.md.
    const zones = [[276, 132, 1.67, 91], [283, 104, 2.81, 135], [306, 149, 1.93, 109], [285, 86, 3.32, 145], [313, 140, 2.13, 123]];
    let originalError = 0;
    let currentError = 0;
    for (const [entry, exit, seconds, metres] of zones) {
        const early = stopAt(PREVIOUS_FAST_PROFILE, entry, exit);
        const current = stopAt(F1_2026_PROFILE, entry, exit);
        const relativeError = value => Math.abs(value.seconds / seconds - 1) + Math.abs(value.metres / metres - 1);
        originalError += relativeError(early);
        currentError += relativeError(current);
        assert.ok(current.peak > 3.5 && current.peak < 4.4, `Peak force in ${entry}→${exit}: ${current.peak} g`);
    }
    assert.ok(currentError < originalError * .75, `${currentError} vs ${originalError}`);
    const monza = stopAt(F1_2026_PROFILE, 305, 92);
    assert.ok(Math.abs(monza.seconds - 2.72) < .30 && Math.abs(monza.metres - 123) < 20,
        `Monza speed window in ${monza.seconds} s over ${monza.metres} m`);
});

test('Lifting at 250 km/h gives a distinct coast phase', () => {
    const coast = profile => {
        const kart = makeController(profile, { speed: 230 / 3.6 });
        while (kmh(kart.state.speed) < 250 && kart.clock.seconds < 8) kart.advance(KART.step, { throttle: 1 });
        assert.ok(kmh(kart.state.speed) >= 250, 'Reached the lift gate');
        const liftGate = kmh(kart.state.speed);
        for (let tick = 0; tick < 120; tick++) kart.advance(KART.step, {});
        return liftGate - kmh(kart.state.speed);
    };
    const early = coast(PREVIOUS_FAST_PROFILE);
    const current = coast(F1_2026_PROFILE);
    assert.ok(current > 15 && current < 29 && current < early * .65, `${current} from 250 km/h vs early ${early}`);
});

test('Lifting shifts the motor from deployment to recovery without doing both at once', () => {
    const kart = makeController(F1_2026_PROFILE, { speed: 250 / 3.6 });
    for (let tick = 0; tick < 24; tick++) kart.advance(KART.step, { throttle: 1 });
    assert.ok(kart.state.handling.formula.deploymentPowerW > 0);
    let recovered = false;
    for (let tick = 0; tick < 120; tick++) {
        const { deploymentPowerW, recoveryPowerW } = kart.advance(KART.step, {}).handling.formula;
        assert.ok(deploymentPowerW === 0 || recoveryPowerW === 0);
        recovered ||= recoveryPowerW > 0;
    }
    assert.ok(recovered);
});

test('2026 F1 dry steering matches the tire budget at hairpin, medium and fast speeds', () => {
    const cases = [[50, 15], [150, 65], [250, 110]];
    for (const [kmPerHour, targetRadius] of cases) {
        const speed = kmPerHour / 3.6;
        const angle = steeringLimit(F1_2026_PROFILE, speed, geometry.wheelbase);
        const radius = geometry.wheelbase / Math.tan(angle);
        const availableLateral = sampleCurve(F1_2026_PROFILE.cornering, speed);
        assert.ok(radius <= targetRadius, `Can follow a ${targetRadius} m curve at ${kmPerHour} km/h`);
        assert.ok(speed ** 2 / radius <= availableLateral * (1 + 1e-12), 'The steering cap respects the lateral force budget');
    }
});

test('Full-lock hairpin at 50 km/h tracks the velocity with less sideslip', () => {
    const targetSpeed = 50 / 3.6;
    const turn = profile => {
        const kart = makeController(profile, { speed: targetSpeed });
        for (let tick = 0; tick < 120; tick++) {
            const speed = Math.hypot(kart.state.speed, kart.state.lateralSpeed);
            // Keep speed near the fixture so the profiles face comparable load.
            const throttle = Math.min(1, Math.max(.0001, .06 + 2 * (targetSpeed - speed)));
            kart.advance(KART.step, { throttle, steer: 1 });
        }
        const speed = Math.hypot(kart.state.speed, kart.state.lateralSpeed);
        assert.ok(Math.abs(kmh(speed) - 50) < 3);
        return {
            slipDegrees: Math.abs(kart.state.handling.slipAngle) * 180 / Math.PI,
            radius: speed ** 2 / (kart.state.handling.lateralG * STANDARD_GRAVITY),
        };
    };
    const early = turn(PREVIOUS_FAST_PROFILE);
    const current = turn(F1_2026_PROFILE);
    assert.ok(current.slipDegrees < 3 && current.slipDegrees < early.slipDegrees / 4);
    assert.ok(current.radius < 15, `Actual path radius is ${current.radius} m`);
});

test('Releasing brake as steering builds gives the 2026 F1 increasing lateral force', () => {
    const kart = makeController(F1_2026_PROFILE, { speed: 170 / 3.6 });
    let initialLateral;
    let initialDeceleration;
    for (let tick = 0; tick <= 90; tick++) {
        // Trail braking from a 170 km/h corner entry.
        const blend = Math.min(1, Math.max(0, (tick - 24) / 66));
        const { handling } = kart.advance(KART.step, { brakeAmount: .82 - .60 * blend, steer: .20 + .60 * blend });
        const longUse = Math.abs(handling.acceleration) / handling.longitudinalLimit;
        const lateralUse = handling.lateralG * STANDARD_GRAVITY / handling.lateralLimit;
        assert.ok(Math.hypot(longUse, lateralUse) <= 1 + 1e-9, 'Combined acceleration stays inside the tire ellipse');
        if (tick === 24) {
            initialLateral = handling.lateralG;
            initialDeceleration = handling.brakingG;
        }
    }
    assert.ok(kart.state.handling.brakingG < initialDeceleration * .6);
    assert.ok(kart.state.handling.lateralG > initialLateral + .3);
});
