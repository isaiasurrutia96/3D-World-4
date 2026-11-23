import assert from 'node:assert/strict';
import test from 'node:test';
import { GT3_PROFILE } from './gt3-profile.ts';
import { createKartController, KART } from './index.ts';
import { createHandlingProfile, STANDARD_GRAVITY } from './profiles.ts';
import { KART_PROTOTYPES } from './prototypes.ts';
import { gt3BrakeDemand, gt3FrontLoad, initialGt3Systems, resolveGt3TireDemand, stepGt3Gear } from './gt3-systems.ts';

const profile = createHandlingProfile({ grandTouring: 'gt3' });
const balance = profile.gt3Balance;
const geometry = KART_PROTOTYPES.gt;
const world = { heightAt: () => 0 };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} versus ${expected}`);

test('GT3 balance is validated, immutable and part of the physics fingerprint', () => {
    const changes = { frontBrakeBias: .59, centerOfGravityHeight: .4, frontWeightFraction: .43 };
    const alternate = createHandlingProfile({ grandTouring: 'gt3', gt3Balance: changes });
    assert.notEqual(alternate.fingerprint, profile.fingerprint);
    assert.notEqual(profile.fingerprint, createHandlingProfile().fingerprint);
    assert.equal(profile.fingerprint, createHandlingProfile({ grandTouring: 'gt3', gt3Balance: { ...balance } }).fingerprint);
    assert.ok(Object.isFrozen(alternate.gt3Balance));
    changes.frontBrakeBias = .61;
    assert.equal(alternate.gt3Balance.frontBrakeBias, .59);
    assert.throws(() => createHandlingProfile({ gt3Balance: changes }), /requires GT3/);
    assert.throws(() => createHandlingProfile({ formula: '2026', grandTouring: 'gt3' }), /cannot combine/);
    assert.throws(() => createHandlingProfile({ grandTouring: 'gt2' }), /Unknown grand touring/);
    assert.throws(() => createHandlingProfile({ grandTouring: 'gt3', gt3Balance: { ...balance, frontWeightFraction: 1 } }), /GT3 balance/);
});

test('Six forward gears use wheel RPM, hysteresis and a short torque cut', () => {
    const coast = (previous, kph, radius = geometry.wheelRadius) => stepGt3Gear(previous, kph / 3.6, radius, false, KART.step);
    const stopped = initialGt3Systems(balance);
    const first = coast(stopped, 104);
    const second = coast(first, 106);
    assert.equal(first.gear, 1);
    assert.equal(second.gear, 2);
    assert.ok(second.rpm < first.rpm && second.driveMultiplier < 1);
    assert.equal(coast(second, 100).gear, 2);
    assert.equal(coast(second, 96).gear, 1);
    assert.equal(coast(first, 104, geometry.wheelRadius * .96).gear, 2);
    assert.ok(coast(first, 104, geometry.wheelRadius * 1.1).rpm < first.rpm);
    assert.equal(coast(second, 300).gear, 6);
    assert.equal(coast(second, 400).rpm, 9_250);
    let settled = second;
    for (let tick = 0; tick < 12; tick++) settled = coast(settled, 107);
    assert.equal(settled.driveMultiplier, 1);
    const reverse = stepGt3Gear(settled, 4, geometry.wheelRadius, true, KART.step);
    assert.equal(reverse.gear, -1);
    assert.equal(reverse.driveMultiplier, 1);
    assert.equal(coast(reverse, 0).gear, 1);
});

test('Longitudinal axle load transfer follows CG height, wheelbase and downward load', () => {
    const { frontWeightFraction, centerOfGravityHeight } = balance;
    const load = (acceleration, wheelbase = geometry.wheelbase, scale = 1) => gt3FrontLoad(balance, acceleration, wheelbase, scale);
    close(load(STANDARD_GRAVITY), frontWeightFraction - centerOfGravityHeight / geometry.wheelbase);
    close(load(-STANDARD_GRAVITY), frontWeightFraction + centerOfGravityHeight / geometry.wheelbase);
    assert.ok(load(-STANDARD_GRAVITY, 2.3) < load(-STANDARD_GRAVITY));
    assert.ok(load(-STANDARD_GRAVITY, 2.1, 1.5) < load(-STANDARD_GRAVITY));
    assert.equal(load(1000), 0);
    assert.equal(load(-1000), 1);
});

test('ABS and rear traction control respond to the shared force budget', () => {
    const limits = {
        lateralLimit: 16, longitudinalLimit: 18, frontWeightFraction: .60,
        frontBrakeBias: balance.frontBrakeBias, tractionAssistance: .65,
    };
    const brakes = (lateral, pedal) => resolveGt3TireDemand({ ...limits, lateral, drive: 0, service: gt3BrakeDemand(18, pedal) });
    const gentle = brakes(4, .3);
    const straight = brakes(0, 1);
    const trail = brakes(16, 1);
    assert.equal(gentle.absIntervention, 0);
    close(straight.service, 18);
    assert.ok(straight.absIntervention > 0 && trail.absIntervention > straight.absIntervention);
    assert.ok(trail.lateral > 0 && trail.service > 0);
    assert.ok(Math.hypot(trail.lateral / 16, trail.service / 18) <= 1 + 1e-9);

    const drive = (lateral, frontWeightFraction) => resolveGt3TireDemand({ ...limits, lateral, frontWeightFraction, service: 0, drive: 7 });
    assert.equal(drive(0, .4).tractionIntervention, 0);
    const loadedRear = drive(13, .4);
    const unloadedRear = drive(13, .6);
    assert.ok(loadedRear.drive > unloadedRear.drive && unloadedRear.tractionIntervention > loadedRear.tractionIntervention);
});

test('The controller applies GT3 shift, load and aid changes without generic boost', () => {
    const session = initial => createKartController({ world, profile, initial, geometry });
    const normal = session({ speed: 104 / 3.6 });
    const boosted = session({ speed: 104 / 3.6, boostTime: 1 });
    const input = { throttle: 1 };
    const first = normal.advanceWithTrace(.2, input);
    assert.deepEqual(first, boosted.advanceWithTrace(.2, { ...input, boost: true }));
    const shift = first.states.findIndex(state => state.handling.gt3.gear === 2);
    assert.ok(shift > 0);
    assert.ok(first.states[shift].handling.driveAcceleration < first.states[shift - 1].handling.driveAcceleration);
    for (let frame = 1; frame < 5; frame++) {
        assert.deepEqual(normal.advance(.2, input), boosted.advance(.2, { ...input, boost: true }));
    }
    assert.ok(normal.state.handling.gt3.gear > 1 && normal.state.handling.gt3.frontWeightFraction < balance.frontWeightFraction);

    const straightBrake = session({ speed: 40 });
    const brakingTurn = session({ speed: 40 });
    straightBrake.advance(.25, { brake: true });
    brakingTurn.advance(.25, { brake: true, steer: 1 });
    const raceBrakes = brakingTurn.state.handling.gt3;
    assert.ok(raceBrakes.frontWeightFraction > balance.frontWeightFraction);
    assert.ok(raceBrakes.absIntervention > straightBrake.state.handling.gt3.absIntervention);

    const powerTurn = session({ speed: 30 });
    powerTurn.advance(.25, { throttle: 1, steer: 1 });
    powerTurn.advance(.25, { throttle: 1, steer: 1 });
    assert.ok(powerTurn.state.handling.gt3.tractionIntervention > 0);
});

test('GT3 redline limits ground speed with smaller rear tires and recovers seeded overspeed', () => {
    const wheelRadius = .30;
    const redlineSpeed = 289 / 3.6 * (9_250 / 9_050) * (wheelRadius / geometry.wheelRadius);
    const start = speed => createKartController({
        world, profile: GT3_PROFILE, initial: { speed }, geometry: { ...geometry, wheelRadius },
    });
    const gas = { throttle: 1 };
    const accelerating = start(235 / 3.6);
    for (let i = 0; i < 12; i++) {
        const frame = accelerating.advance(.25, gas);
        assert.ok(frame.speed <= redlineSpeed + 1e-9);
    }
    close(accelerating.state.speed, redlineSpeed);
    assert.equal(accelerating.state.handling.gt3.gear, 6);
    close(accelerating.state.handling.gt3.rpm, 9_250);

    const initialOverspeed = 250 / 3.6;
    const seeded = start(initialOverspeed);
    const firstTick = seeded.advance(KART.step, gas);
    assert.ok(firstTick.speed < initialOverspeed && firstTick.speed > redlineSpeed);
    for (let i = 0; i < 8; i++) seeded.advance(.25, gas);
    close(seeded.state.speed, redlineSpeed);
});

test('Spawning or resetting a moving GT3 selects its actual gear without a shift cut', () => {
    const wheelRadius = .33;
    const kart = createKartController({
        world, profile: GT3_PROFILE, initial: { speed: 104 / 3.6 }, geometry: { ...geometry, wheelRadius },
    });
    assert.equal(kart.state.handling.gt3.gear, 2);
    close(kart.state.handling.gt3.rpm, 9_050 * (104 / 142) * (geometry.wheelRadius / wheelRadius));
    assert.equal(kart.advance(KART.step, { throttle: 1 }).handling.gt3.shiftRemainingSeconds, 0);
    const reverse = kart.reset({ speed: -5 }).handling.gt3;
    assert.equal(reverse.gear, -1);
    close(reverse.rpm, 9_050 * (18 / 105) * (geometry.wheelRadius / wheelRadius) * 1.15);
    assert.equal(reverse.shiftRemainingSeconds, 0);
});
