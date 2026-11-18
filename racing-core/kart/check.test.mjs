import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createKartController, KART, maxKartSteering, normalizeKartInput, kartVelocity } from './index.ts';
import { createTrack, TRACK_IDS } from '../track/index.ts';
import reference from './reference.json' with { type: 'json' };
import trackReference from '../track/reference.json' with { type: 'json' };
const rates = [30, 60, 120, 144], checks = [], tracks = Object.fromEntries(TRACK_IDS.map(id => [id, createTrack(id)]));
const near = (a, b, tolerance = 1e-8) => assert(Math.abs(a - b) <= tolerance, `${a} != ${b}; error ${Math.abs(a - b)}`);
const flat = { heightAt: (x, z, maximum) => maximum >= 0 ? 0 : null };
function worldFor(id) { if (tracks[id])
    return tracks[id]; return { heightAt(x, z, max) { if (id === 'ledge' && z > 20)
        return null; return (id === 'decks' ? [12, 0] : [id === 'slope' ? .08 * z + .03 * x : 0]).find(y => y <= max) ?? null; } }; }
function run(controller, seconds, fps = 120, input = {}) { for (let frame = 0; frame < Math.ceil(seconds * fps - 1e-10); frame++)
    controller.advance(Math.min(1 / fps, seconds - frame / fps), input); return controller.state; }
function check(rule, input, expected, measure, verify) { test(rule, () => { let measured; try {
    measured = measure();
    verify(measured);
    checks.push({ rule, input, expected, measured, status: 'PASS' });
}
catch (error) {
    checks.push({ rule, input, expected, measured: measured ?? null, status: 'FAIL', error: error.message });
    throw error;
} }); }
function eachRate(script) { return rates.map(fps => ({ fps, ...script(fps) })); }
function sameStates(states) { for (const s of states.slice(1))
    for (const key of Object.keys(s.state)) {
        if (typeof s.state[key] === 'number')
            near(s.state[key], states[0].state[key], 1e-10);
        else
            assert.equal(s.state[key], states[0].state[key]);
    } }
for (const scenario of reference.scenarios) {
    check('Matches original LetsGo: ' + scenario.name, { world: scenario.world, initial: scenario.initial, phases: scenario.phases, fps: rates }, 'Every captured numeric state field is within 0.00000001 of the unmodified original; booleans and physics tick counts agree at every FPS.', () => {
        const fields = Object.keys(scenario.samples[0].state), expected = new Map(scenario.samples.map(sample => [sample.tick, sample.state])), duration = scenario.phases.reduce((n, p) => n + p.ticks, 0), byRate = [];
        for (const fps of rates) {
            const c = createKartController({ world: worldFor(scenario.world), initial: scenario.initial });
            let maximumError = 0, compared = 0;
            const compare = (tick, state) => { const e = expected.get(tick); if (!e)
                return; compared++; for (const key of fields) {
                if (typeof e[key] === 'boolean')
                    assert.equal(state[key], e[key]);
                else
                    maximumError = Math.max(maximumError, Math.abs(state[key] - e[key]));
            } };
            const script = (tick, time, state) => { compare(tick, state); let start = 0; for (const phase of scenario.phases) {
                if (tick < start + phase.ticks)
                    return { ...phase.input, boost: Boolean(phase.boost && tick === start) };
                start += phase.ticks;
            } return {}; };
            run(c, duration * KART.step, fps, script);
            compare(duration, c.state);
            assert.equal(c.clock.ticks, duration);
            assert.equal(compared, scenario.samples.length);
            byRate.push({ fps, compared, maximumError, state: c.state });
        }
        sameStates(byRate);
        return { byRate: byRate.map(({ state, ...rest }) => rest), final: byRate[0].state };
    }, m => { for (const rate of m.byRate)
        near(rate.maximumError, 0); });
}
check('Normal acceleration, cap, braking time and stopping distance are measured', { fps: rates, script: 'Gas for 4 s, then Brake for 2 s on an unbounded flat plane.' }, 'At 1 s speed=24 m/s and distance=12.1 m; normal cap=53.6448 m/s; stop takes 1.491666667 s and 39.74562 m, without reversing.', () => ({ byRate: eachRate(fps => {
        const c = createKartController({ world: flat });
        run(c, 1, fps, { throttle: 1 });
        const atOne = { speed: c.state.speed, distance: c.state.z };
        run(c, 3, fps, { throttle: 1 });
        const cap = c.state.speed, z = c.state.z;
        let stoppedAt = null;
        run(c, 2, fps, (tick, t, state) => { if (state.speed === 0 && stoppedAt === null)
            stoppedAt = t - 4; return { brake: true }; });
        return { atOne, cap, stopSeconds: stoppedAt, stopDistance: c.state.z - z, finalSpeed: c.state.speed };
    }) }), m => { for (const r of m.byRate) {
    near(r.atOne.speed, 24);
    near(r.atOne.distance, 12.1);
    near(r.cap, 53.6448);
    near(r.stopSeconds, 179 / 120);
    near(r.stopDistance, 39.74562);
    assert.equal(r.finalSpeed, 0);
} });
check('Opposite steering produces mirrored paths at every FPS', { fps: rates, script: 'Gas + full left/right for 2 s.' }, 'Left/right positions, headings, wheel angles and distances mirror to within 1e-10; both move forward initially.', () => ({ byRate: eachRate(fps => {
        const left = createKartController({ world: flat }), right = createKartController({ world: flat });
        run(left, 2, fps, { throttle: 1, steer: 1 });
        run(right, 2, fps, { throttle: 1, steer: -1 });
        return { mirrorError: Math.max(Math.abs(left.state.x + right.state.x), Math.abs(left.state.z - right.state.z), Math.abs(left.state.yaw + right.state.yaw), Math.abs(left.state.steering + right.state.steering)), leftYaw: left.state.yaw, rightYaw: right.state.yaw };
    }) }), m => { for (const r of m.byRate) {
    near(r.mirrorError, 0, 1e-10);
    assert(r.leftYaw < 0 && r.rightYaw > 0);
} });
check('Steering holds ramp only after the reference delay and clear on release or reversal', { fps: rates, script: 'Start at 20 m/s; hold left 0.5 s, continue 0.8 s, release one tick, hold and reverse.' }, 'No held gain at 0.5 s; full +20% gain at 1.3 s; hold timer clears on release and restarts at one tick on reversal.', () => ({ byRate: eachRate(fps => {
        const c = createKartController({ world: flat, initial: { speed: 20 } });
        run(c, .5, fps, { throttle: 1, steer: 1 });
        const delayedGain = maxKartSteering(c.state.speed, c.state.steerHoldTime) / maxKartSteering(c.state.speed);
        run(c, .8, fps, { throttle: 1, steer: 1 });
        const heldGain = maxKartSteering(c.state.speed, c.state.steerHoldTime) / maxKartSteering(c.state.speed);
        c.advance(KART.step, {});
        const released = c.state.steerHoldTime;
        run(c, .5, fps, { throttle: 1, steer: 1 });
        const angle = c.state.steering;
        c.advance(KART.step, { throttle: 1, steer: -1 });
        return { delayedGain, heldGain, released, reversedTimer: c.state.steerHoldTime, reversedDirection: c.state.steerHoldDirection, beforeAngle: angle, afterAngle: c.state.steering };
    }) }), m => { for (const r of m.byRate) {
    near(r.delayedGain, 1);
    near(r.heldGain, 1.2);
    assert.equal(r.released, 0);
    near(r.reversedTimer, KART.step);
    assert.equal(r.reversedDirection, -1);
    assert(r.afterAngle > 0 && r.afterAngle < r.beforeAngle);
} });
check('Analog steering strength is preserved without adding a speed-target shortcut', { fps: rates, script: 'At 20 m/s apply 0.25, 0.5 and 1.0 steering for 0.25 s, before held gain begins.' }, 'Wheel response scales in 1:2:4 proportion. Positive pedal magnitude retains original button acceleration rather than a fractional top-speed target.', () => ({ byRate: eachRate(fps => {
        const angles = [.25, .5, 1].map(steer => { const c = createKartController({ world: flat, initial: { speed: 20 } }); run(c, .25, fps, { throttle: 1, steer }); return c.state.steering; });
        return { halfRatio: angles[1] / angles[2], quarterRatio: angles[0] / angles[2] };
    }) }), m => { for (const r of m.byRate) {
    near(r.halfRatio, .5);
    near(r.quarterRatio, .25);
} });
check('Coasting cannot add energy and lateral grip decays at its measured rate', { fps: rates, script: 'Release inputs for 1 s from forward=20 m/s and sideways=8 m/s.' }, 'Kinetic-speed squared never increases; sideways speed after one second equals 8*exp(-7); grip never shifts the kart toward a track center.', () => ({ byRate: eachRate(fps => {
        const c = createKartController({ world: flat, initial: { speed: 20, lateralSpeed: 8 } });
        let last = 464, largestIncrease = 0;
        run(c, 1, fps, (tick, time, state) => { const energy = state.speed ** 2 + state.lateralSpeed ** 2; largestIncrease = Math.max(largestIncrease, energy - last); last = energy; return {}; });
        return { sideways: c.state.lateralSpeed, expectedSideways: 8 * Math.exp(-7), largestIncrease };
    }) }), m => { for (const r of m.byRate) {
    near(r.sideways, r.expectedSideways);
    assert(r.largestIncrease < 1e-9);
} });
check('A held boost grants one bounded activation and returns gradually to normal speed', { fps: rates, script: 'Start at normal cap, hold granted boost + Gas for 5 s, then release/repress boost.' }, 'Peak reaches 80.4672 m/s; the held command does not refill its timer; after 5 s speed is normal cap; releasing/repressing activates a new 2-second boost.', () => ({ byRate: eachRate(fps => {
        const c = createKartController({ world: flat, initial: { speed: KART.topSpeed } });
        let peak = 0, activeTicks = 0;
        run(c, 5, fps, (tick, time, state) => { peak = Math.max(peak, state.speed); if (state.boostTime > 0)
            activeTicks++; return { throttle: 1, boost: true }; });
        const before = c.state;
        run(c, .1, fps, { throttle: 1 });
        c.advance(KART.step, { throttle: 1, boost: true });
        return { peak, activeTicks, expired: before.boostTime, finalSpeed: before.speed, repressed: c.state.boostTime };
    }) }), m => { for (const r of m.byRate) {
    near(r.peak, KART.boostSpeed);
    assert(r.activeTicks >= 239 && r.activeTicks <= 241);
    assert.equal(r.expired, 0);
    near(r.finalSpeed, KART.topSpeed);
    near(r.repressed, 2 - KART.step);
} });
check('A boost press shorter than one physics tick is retained', { script: 'Press boost for 1/240 s, release for 1/240 s.' }, 'Exactly one physics tick executes and starts boost; the release does not lose the pending press.', () => {
    const c = createKartController({ world: flat });
    c.advance(1 / 240, { boost: true });
    const before = c.state.boostTime;
    c.advance(1 / 240, {});
    return { before, after: c.state.boostTime, ticks: c.clock.ticks, speed: c.state.speed };
}, m => { assert.equal(m.before, 0); near(m.after, 2 - KART.step); assert.equal(m.ticks, 1); near(m.speed, .4); });
check('Jittered frames and 250 ms catch-up preserve the same timeline', { script: '12 s of tick-timed accelerate/tap/boost/brake/reverse; compare fixed 30/60/120/144 FPS, alternating 1/55,1/144,1/30,1/240, and 0.25 s batches.' }, 'All state fields match within 1e-10, with exactly 1440 physics ticks and no discarded elapsed time.', () => {
    const script = (tick) => tick < 240 ? { throttle: 1, steer: tick >= 90 && tick < 110 ? .8 : 0 } : tick < 540 ? { throttle: 1, steer: -.25, boost: tick === 240 } : tick < 840 ? { brake: true } : tick < 1080 ? { throttle: -1, steer: .3 } : { throttle: 1 };
    const patterns = [...rates.map(fps => ({ name: fps + ' FPS', times: [1 / fps] })), { name: 'jitter', times: [1 / 55, 1 / 144, 1 / 30, 1 / 240] }, { name: 'catch-up', times: [.25] }], states = [];
    for (const p of patterns) {
        const c = createKartController({ world: flat });
        let elapsed = 0, i = 0;
        while (elapsed < 12 - 1e-11) {
            const dt = Math.min(p.times[i++ % p.times.length], 12 - elapsed);
            c.advance(dt, script);
            elapsed += dt;
        }
        assert.equal(c.clock.ticks, 1440);
        states.push({ name: p.name, state: c.state });
    }
    sameStates(states);
    return { patterns: states.map(s => s.name), ticks: 1440, maximumStateError: Math.max(...states.flatMap(s => Object.keys(s.state).filter(k => typeof s.state[k] === 'number').map(k => Math.abs(s.state[k] - states[0].state[k])))) };
}, m => near(m.maximumStateError, 0, 1e-10));
check('Render interpolation is smooth and never advances physics', { fps: rates, script: 'Advance 0.1 s, sample 101 fractions between the last two fixed states; try to modify the returned pose.' }, 'Interpolated travel is continuous and bounded between physics ticks; snapshots are immutable; simulation state/clock remain unchanged.', () => ({ byRate: eachRate(fps => {
        const c = createKartController({ world: flat });
        run(c, .1, fps, { throttle: 1, steer: .5 });
        const before = JSON.stringify({ state: c.state, clock: c.clock }), a = c.sample(0), b = c.sample(1);
        let largestStep = 0, last = a;
        for (let i = 1; i <= 100; i++) {
            const p = c.sample(i / 100);
            largestStep = Math.max(largestStep, Math.hypot(p.x - last.x, p.y - last.y, p.z - last.z));
            assert.throws(() => { p.x = 1; });
            last = p;
        }
        assert.equal(JSON.stringify({ state: c.state, clock: c.clock }), before);
        return { largestStep, tickTravel: Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) };
    }) }), m => { for (const r of m.byRate)
    near(r.largestStep, r.tickTravel / 100, 1e-10); });
check('Invalid time, controls, world data and scripts cannot corrupt the controller', { script: 'Submit NaN/infinite/negative/oversized time, malformed input, invalid initial state, bad surface heights, and a script failing midway through a catch-up batch.' }, 'All invalid operations throw, state/clock stay unchanged after failed batches, and a subsequent valid step still works.', () => {
    let rejected = 0;
    const c = createKartController({ world: flat }), before = JSON.stringify({ state: c.state, clock: c.clock });
    for (const op of [() => c.advance(NaN), () => c.advance(Infinity), () => c.advance(-.01), () => c.advance(.251), () => c.advance(.1, { steer: NaN }), () => c.advance(.1, { throttle: Infinity }), () => c.advance(.1, { brake: 'yes' }), () => c.advance(.1, null), () => c.reset({ x: NaN }), () => c.reset({ boostTime: 3 }), () => c.sample(-.1), () => c.sample(NaN), () => c.advance(.1, tick => tick === 4 ? { steer: NaN } : { throttle: 1 })]) {
        assert.throws(op);
        rejected++;
        assert.equal(JSON.stringify({ state: c.state, clock: c.clock }), before);
    }
    for (const value of [NaN, Infinity, 10]) {
        const d = createKartController({ world: { heightAt: () => value } }), start = JSON.stringify({ state: d.state, clock: d.clock });
        assert.throws(() => d.advance(.1, { throttle: 1 }));
        assert.equal(JSON.stringify({ state: d.state, clock: d.clock }), start);
        rejected++;
    }
    assert.throws(() => createKartController({ world: {} }));
    rejected++;
    c.advance(KART.step, { throttle: 1 });
    near(c.state.speed, .2);
    return { rejected, validStepSpeed: c.state.speed };
}, m => assert.equal(m.rejected, 17));
check('Reset clears momentum, clock remainder and queued boost without changing track data', { script: 'Advance 1/240 s with boost queued, reset onto an elevated track start, then advance one tick with no input.' }, 'All motion and timers reset; no old boost fires; track geometry remains byte-identical.', () => {
    const t = tracks.skyline, before = JSON.stringify(t.segments), c = createKartController({ world: t });
    c.advance(1 / 240, { boost: true });
    c.reset({ ...t.start.point, yaw: t.start.yaw });
    c.advance(KART.step, {});
    assert.equal(JSON.stringify(t.segments), before);
    return { boost: c.state.boostTime, speed: c.state.speed, ticks: c.clock.ticks, remainder: c.clock.remainder, grounded: c.state.grounded };
}, m => { assert.equal(m.boost, 0); assert.equal(m.speed, 0); assert.equal(m.ticks, 1); assert.equal(m.remainder, 0); assert(m.grounded); });
check('Both road levels remain seated at every captured overpass', { fps: rates, script: 'Place a stopped kart on each lower and upper source crossing, then brake for 0.25 s.' }, 'Every kart stays grounded on its initial deck; zero false lifts to an upper road and height error below 1e-8 m.', () => {
    let probes = 0, maximumHeightError = 0;
    for (const raw of trackReference.tracks)
        for (const crossing of raw.expected.crossings)
            for (const level of ['lowerSupport', 'upperSupport'])
                for (const fps of rates) {
                    const y = crossing[level];
                    const c = createKartController({ world: tracks[raw.id], initial: { x: crossing.x, y, z: crossing.z } });
                    run(c, .25, fps, { brake: true });
                    assert(c.state.grounded);
                    maximumHeightError = Math.max(maximumHeightError, Math.abs(c.state.y - y));
                    probes++;
                }
    return { probes, maximumHeightError };
}, m => { assert(m.probes > 100); near(m.maximumHeightError, 0); });
check('Rigidly placed island tracks preserve handling and support', { fps: rates, script: 'Drive 1 s from the same Original start before/after translation (500,70,-900) and yaw=0.73.' }, 'Rotating/translating the road and initial pose produces the same local kart trajectory, wheel rotation, pitch and bank to within 1e-8.', () => {
    const pose = { x: 500, y: 70, z: -900, yaw: .73 }, t = createTrack('original', pose), a = tracks.original;
    return { byRate: eachRate(fps => { const c = createKartController({ world: a, initial: { ...a.start.point, yaw: a.start.yaw } }), d = createKartController({ world: t, initial: { ...t.start.point, yaw: t.start.yaw } }); run(c, 1, fps, { throttle: 1, steer: .1 }); run(d, 1, fps, { throttle: 1, steer: .1 }); const local = t.toLocal(d.state); return { positionError: Math.hypot(local.x - c.state.x, local.y - c.state.y, local.z - c.state.z), yawError: Math.abs(d.state.yaw - c.state.yaw - pose.yaw), wheelError: Math.abs(d.state.wheelRotation - c.state.wheelRotation), pitchError: Math.abs(d.state.pitch - c.state.pitch), bankError: Math.abs(d.state.bank - c.state.bank) }; }) };
}, m => { for (const r of m.byRate)
    for (const [key, value] of Object.entries(r))
        if (key !== 'fps')
            near(value, 0); });
check('No hidden wall collision, route centering or floor exists in this layer', { fps: rates, script: 'Drive across the checked Original road edge and out over empty space for 2 s.' }, 'Kart crosses the edge according to its inputs and falls under gravity; it is never snapped back to the road or placed on an artificial floor.', () => ({ byRate: eachRate(fps => {
        const t = tracks.original, p = t.sample(0), c = createKartController({ world: t, initial: { ...p.point, yaw: Math.atan2(p.normal.x, p.normal.z), speed: 30 } });
        run(c, 2, fps, { throttle: 1 });
        const projection = t.project(c.state);
        return { grounded: c.state.grounded, height: c.state.y, offset: projection?.offset ?? null, verticalVelocity: c.state.verticalVelocity };
    }) }), m => { for (const r of m.byRate) {
    assert.equal(r.grounded, false);
    assert(r.verticalVelocity < 0);
    assert(r.height < 0);
    if (r.offset !== null)
        assert(r.offset > tracks.original.outer);
} });
check('Airborne wheels and stopped steering cannot turn the chassis', { fps: rates, script: 'Full steering while parked for 1 s, then at 12 m/s in unsupported air for 1 s; compare forward and reverse steering.' }, 'Parked/airborne heading change is zero. The same wheel input reverses the direction of chassis turning when backing up.', () => ({ byRate: eachRate(fps => {
        const parked = createKartController({ world: flat }), air = createKartController({ world: { heightAt: () => null }, initial: { y: 100, grounded: false, speed: 12 } }), forward = createKartController({ world: flat, initial: { speed: 8 } }), reverse = createKartController({ world: flat, initial: { speed: -8 } });
        run(parked, 1, fps, { steer: 1 });
        run(air, 1, fps, { steer: 1 });
        run(forward, .5, fps, { throttle: 1, steer: 1 });
        run(reverse, .5, fps, { throttle: -1, steer: 1 });
        return { parkedYaw: parked.state.yaw, airYaw: air.state.yaw, forwardYaw: forward.state.yaw, reverseYaw: reverse.state.yaw };
    }) }), m => { for (const r of m.byRate) {
    assert.equal(r.parkedYaw, 0);
    assert.equal(r.airYaw, 0);
    assert(r.forwardYaw < 0 && r.reverseYaw > 0);
} });
check('Wheel rotation measures actual forward and reverse travel', { fps: rates, script: 'Drive straight in forward/reverse for 2 s, and drift sideways for 1 s.' }, 'wheelRotation * 0.38 equals signed forward travel; sideways-only drift does not roll the wheels.', () => ({ byRate: eachRate(fps => {
        const errors = [];
        for (const direction of [-1, 1]) {
            const c = createKartController({ world: flat });
            run(c, 2, fps, { throttle: direction });
            errors.push(Math.abs(c.state.wheelRotation * KART.wheelRadius - c.state.z));
        }
        const drift = createKartController({ world: flat, initial: { lateralSpeed: 5 } });
        run(drift, 1, fps, {});
        return { maximumError: Math.max(...errors), sidewaysWheelRotation: drift.state.wheelRotation };
    }) }), m => { for (const r of m.byRate) {
    near(r.maximumError, 0);
    near(r.sidewaysWheelRotation, 0);
} });
check('Clamped input, immutable snapshots and independent controllers protect shared callers', { script: 'Clamp steering/throttle outside [-1,1], try mutating state and control snapshots, alter the caller initial pose after construction, then reset.' }, 'Controls clamp to [-1,1]; caller objects remain unchanged; snapshots reject mutation; reset retains the original copied pose; a second controller is unaffected.', () => {
    const raw = { throttle: 3, steer: -5, brake: false }, controls = normalizeKartInput(raw), initial = { x: 3 }, a = createKartController({ world: flat, initial }), b = createKartController({ world: flat });
    assert.deepEqual(raw, { throttle: 3, steer: -5, brake: false });
    assert.throws(() => { controls.steer = 0; });
    assert.throws(() => { a.state.x = 80; });
    initial.x = 900;
    a.advance(.1, raw);
    assert.equal(b.state.x, 0);
    assert.equal(b.clock.ticks, 0);
    a.reset();
    return { throttle: controls.throttle, steer: controls.steer, resetX: a.state.x, otherX: b.state.x };
}, m => { assert.equal(m.throttle, 1); assert.equal(m.steer, -1); assert.equal(m.resetX, 3); assert.equal(m.otherX, 0); });
check('A seeded one-minute mixed-input stress trace stays bounded and repeatable', { fps: rates, script: '60 s; change seeded throttle, steering, brake and granted boost every 30 physics ticks; use seed 0x415120.' }, 'All fields remain finite, steering remains within 0.498 rad, reverse never exceeds 8 m/s, speed never exceeds the 180 mph cap, and all FPS results match to 1e-10.', () => {
    let seed = 0x415120;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }, inputs = Array.from({ length: 240 }, () => ({ throttle: random() > .25 ? 1 : -1, steer: random() * 2 - 1, brake: random() < .12, boost: random() < .1 })), states = [];
    let maximumSpeed = 0, maximumWheel = 0, minimumSpeed = 0;
    for (const fps of rates) {
        const c = createKartController({ world: flat });
        run(c, 60, fps, (tick, time, state) => { maximumSpeed = Math.max(maximumSpeed, state.speed); minimumSpeed = Math.min(minimumSpeed, state.speed); maximumWheel = Math.max(maximumWheel, Math.abs(state.steering)); return inputs[Math.floor(tick / 30)]; });
        assert.equal(c.clock.ticks, 7200);
        states.push({ fps, state: c.state });
    }
    sameStates(states);
    return { seconds: 60, physicsTicks: 7200, maximumSpeed, minimumSpeed, maximumWheel, byRate: states };
}, m => { assert(m.maximumSpeed <= KART.boostSpeed + 1e-8); assert(m.minimumSpeed >= -8 - 1e-8); assert(m.maximumWheel <= .498 + 1e-8); });
check('Fresh handling is strict TypeScript with no browser, graphics or prototype dependencies', { script: 'Compile kart/tsconfig.json with ES2022 only and no ambient types; inspect imports.' }, 'Strict compilation passes and runtime imports no DOM/Three/old racing or motion modules.', () => { execFileSync(process.execPath, [fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url)), '-p', fileURLToPath(new URL('./tsconfig.json', import.meta.url))], { stdio: 'pipe' }); const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8'); assert(!/^import\s/m.test(source)); return { typecheck: 'PASS', runtimeImports: 0 }; }, m => assert.equal(m.runtimeImports, 0));
test.after(() => {
    const result = { section: 2, source: reference.source, referenceDataSHA256: createHash('sha256').update(readFileSync(new URL('./reference.json', import.meta.url))).digest('hex'), fps: rates, approval: 'Owner authorized implementation; results await review. Contacts, race rules, opponents, input devices and visuals are later approvals.', summary: { passed: checks.filter(c => c.status === 'PASS').length, failed: checks.filter(c => c.status === 'FAIL').length }, checks };
    writeFileSync(new URL('./CHECK-RESULTS.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
    let md = '# Kart handling layer 2: measured results\n\nHeadless Node checks. Source: LetsGo Racing `' + reference.source.revision + '`. No browser, visual demo, wall response, NPC or avatar is used. This report proves the scripted behavior below, not subjective driving feel.\n\n';
    md += '**' + result.summary.passed + ' PASS, ' + result.summary.failed + ' FAIL.** All rate-dependent scenarios run at 30, 60, 120 and 144 FPS with 120 Hz physics. Original comparisons use independently captured source output; source code is not imported at runtime.\n\n';
    for (const c of checks)
        md += '## ' + c.rule + '\n\n- Rule: ' + c.expected + '\n- Scripted input: `' + JSON.stringify(c.input) + '`\n- Measured result: `' + JSON.stringify(c.measured) + '`\n- **' + c.status + '**' + (c.error ? ': ' + c.error : '') + '\n\n';
    md += 'Stop for owner review. Contacts and a playable/visual kart test are not implemented or approved by this report.\n';
    writeFileSync(new URL('./CHECK-RESULTS.md', import.meta.url), md);
});
