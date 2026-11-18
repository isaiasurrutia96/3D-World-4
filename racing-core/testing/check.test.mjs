import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createDrivingTest, readDrivingInput, TRACK_IDS } from './drive.ts';
import { KART } from '../kart/index.ts';
import source from '../kart/reference.json' with { type: 'json' };
import { createOriginalKartView } from '../../racing-lab/src/kart-view.js';
const checks = [], rates = [30, 60, 120, 144], near = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
function check(rule, input, expected, measure, verify) { test(rule, () => { let measured; try {
    measured = measure();
    verify(measured);
    checks.push({ rule, input, expected, measured, status: 'PASS' });
}
catch (e) {
    checks.push({ rule, input, expected, measured: measured ?? null, status: 'FAIL', error: e.message });
    throw e;
} }); }
const snapshot = (x, y, yaw, source = 'keyboard', look = 0) => ({ moveX: -Math.sin(yaw - look) * y + Math.cos(yaw - look) * x, moveZ: -Math.cos(yaw - look) * y - Math.sin(yaw - look) * x, source, look: { x: look } });
check('Independent keyboard throttle and steering do not depend on the camera', { yaws: [0, Math.PI / 2, Math.PI, -1.1], script: 'Up/Down/Left/Right and diagonals, including simultaneous camera look.' }, 'Up=+throttle, Down=-throttle, Left=+steer, Right=-steer; diagonal keyboard commands remain full strength.', () => { let probes = 0; for (const yaw of [0, Math.PI / 2, Math.PI, -1.1])
    for (const look of [0, .2])
        for (const [x, y] of [[0, 1], [0, -1], [-1, 0], [1, 0], [-Math.SQRT1_2, Math.SQRT1_2], [Math.SQRT1_2, Math.SQRT1_2]]) {
            const c = readDrivingInput(snapshot(x, y, yaw, 'keyboard', look), yaw);
            near(c.throttle, Math.sign(y));
            near(c.steer, -Math.sign(x));
            probes++;
        } return { probes }; }, m => assert.equal(m.probes, 48));
check('Analog steering survives mapping without accidental Gas', { script: 'Three gentle stick strengths at four camera headings, with a sideways-only stick.' }, 'Analog steering stays 0.2/0.5/0.8, and floating-point residue cannot accelerate a steering-only kart.', () => { let probes = 0; for (const yaw of [0, .7, Math.PI / 2, Math.PI])
    for (const x of [.2, .5, .8]) {
        const c = readDrivingInput(snapshot(x, 0, yaw, 'gamepad'), yaw);
        near(c.steer, -x);
        assert.equal(c.throttle, 0);
        probes++;
    } return { probes }; }, m => assert.equal(m.probes, 12));
check('Held phone buttons use fixed kart directions and a dedicated reverse command', { script: 'Left/Right/Gas/Reverse, opposites and independent Brake/Boost.' }, 'Left is +steer, right -steer, both cancel; Reverse is -throttle; Gas+Reverse applies the brake; independent Brake/Boost are retained.', () => { const read = actions => readDrivingInput({ actions }, .8); near(read({ left: true }).steer, 1); near(read({ right: true }).steer, -1); near(read({ left: true, right: true }).steer, 0); near(read({ gas: true }).throttle, 1); near(read({ reverse: true }).throttle, -1); assert(read({ gas: true, reverse: true }).brake); assert(read({ brake: true, boost: true }).brake && read({ brake: true, boost: true }).boost); return { combinations: 7 }; }, m => assert.equal(m.combinations, 7));
for (const id of TRACK_IDS)
    check(id + ': complete driving-test adapter is frame independent', { fps: rates, script: 'Eight seconds: Gas, Brake, Reverse, steering, boost, release; use checked track rails.' }, 'One kart, no other actors; identical authoritative state after exactly 960 physics ticks at all rendering rates.', () => { const byRate = []; for (const fps of rates) {
        const d = createDrivingTest(id);
        for (let frame = 0; frame < fps * 8; frame++)
            d.advance(1 / fps, tick => tick < 120 ? { throttle: 1 } : tick < 240 ? { brake: true } : tick < 360 ? { throttle: -1 } : tick < 480 ? { throttle: 1, steer: .3 } : tick < 600 ? { throttle: 1, boost: tick === 480 } : { throttle: 0 });
        const s = d.getState();
        assert.equal(s.karts, 1);
        assert.equal(s.avatars, 0);
        assert.equal(s.opponents, 0);
        assert.equal(s.clock.ticks, 960);
        byRate.push({ fps, state: s.physics });
    } for (const r of byRate.slice(1))
        assert.deepEqual(r.state, byRate[0].state); return { byRate }; }, m => assert.equal(m.byRate.length, 4));
check('Reset and track selection clear held driving state and momentum', { script: 'Drive and boost for 0.1 s; Reset; switch to Skyline; try an invalid track.' }, 'Reset returns to the exact start with zero speed/timers; switching uses the new supported start; a bad selection cannot corrupt the active test.', () => { const d = createDrivingTest(); d.advance(.1, { throttle: 1, boost: true }); d.reset(); let count = 0; for (const id of TRACK_IDS) {
    d.selectTrack(id);
    const s = d.getState();
    assert.equal(s.physics.speed, 0);
    assert.equal(s.physics.boostTime, 0);
    assert.equal(s.clock.ticks, 0);
    near(s.physics.x, d.track.start.point.x);
    near(s.physics.y, d.track.heightAt(s.physics.x, s.physics.z, s.physics.y + .01));
    count++;
} const before = d.getState(); assert.throws(() => d.selectTrack('bad')); assert.deepEqual(d.getState(), before); return { starts: count }; }, m => assert.equal(m.starts, 4));
check('Pausing clears a queued Boost without moving or resetting the kart', { script: 'Queue Boost for half a physics tick, cancel input, advance the other half tick.' }, 'No delayed boost is activated; position/clock are retained and speed remains zero.', () => { const d = createDrivingTest(); d.advance(1 / 240, { boost: true }); const before = d.controller.state; d.cancelInput(); assert.deepEqual(d.controller.state, before); d.advance(1 / 240, {}); return { boost: d.controller.state.boostTime, speed: d.controller.state.speed, ticks: d.controller.clock.ticks }; }, m => { assert.equal(m.boost, 0); assert.equal(m.speed, 0); assert.equal(m.ticks, 1); });
check('The driving adapter actually uses the checked rail-contact solver', { fps: rates, script: 'From Original start, aim directly at the outer rail at 180 mph for 1 s.' }, 'A real contact is recorded; the kart does not pass outside the rail.', () => ({ byRate: rates.map(fps => { const d = createDrivingTest(), p = d.track.sample(0); d.controller.reset({ ...p.point, yaw: Math.atan2(p.normal.x, p.normal.z), speed: KART.boostSpeed, boostTime: 2 }); let contacts = 0; for (let i = 0; i < fps; i++)
        d.advance(1 / fps, (tick, t, s) => { contacts += s.contacts; return { throttle: 1 }; }); const offset = d.track.project(d.controller.state).offset; return { fps, contacts, offset }; }) }), m => { for (const r of m.byRate) {
    assert(r.contacts > 0);
    assert(r.offset < 14.25);
} });
check('The kart model is the exact pinned original and its wheels read the checked pose', { script: 'Hash model source; apply a turning/rolling pose, then apply a zero pose.' }, 'Source SHA256 matches the independent original capture; four original wheel nodes exist; front wheels steer, rear wheels do not, and steering/roll reset.', () => { const hash = createHash('sha256').update(readFileSync(new URL('../../racing-lab/src/reference-kart.js', import.meta.url))).digest('hex'); assert.equal(hash, source.source.files['kart.js']); const view = createOriginalKartView(), s = { x: 4, y: 2, z: 8, yaw: .3, pitch: .1, bank: .05, steering: .1, wheelRotation: 2 }; view.update(s); assert.equal(view.root.position.x, 4); assert.equal(view.root.rotation.order, 'YXZ'); for (const w of view.wheels) {
    near(w.node.rotation.x, 2);
    if (w.front)
        assert(Math.abs(w.node.rotation.y) > 0);
    else
        near(w.node.rotation.y, 0);
} view.update({ ...s, steering: 0, wheelRotation: 0 }); for (const w of view.wheels) {
    near(w.node.rotation.x, 0);
    near(w.node.rotation.y, 0);
} return { hash, wheels: view.wheels.length }; }, m => assert.equal(m.wheels, 4));
check('Driving test rules compile as strict ES2022 without a browser', { script: 'Run testing/tsconfig.json; submit a nonfinite input snapshot.' }, 'Strict typecheck succeeds; malformed controls throw.', () => { execFileSync(process.execPath, [fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url)), '-p', fileURLToPath(new URL('./tsconfig.json', import.meta.url))], { stdio: 'pipe' }); assert.throws(() => readDrivingInput({ moveX: NaN }, 0)); return { typecheck: 'PASS' }; }, m => assert.equal(m.typecheck, 'PASS'));
test.after(() => { const r = { section: 'Driving-feel test wiring', fps: rates, summary: { passed: checks.filter(c => c.status === 'PASS').length, failed: checks.filter(c => c.status === 'FAIL').length }, checks }; writeFileSync(new URL('./CHECK-RESULTS.json', import.meta.url), JSON.stringify(r, null, 2) + '\n'); let md = '# Driving test code checks\n\n' + r.summary.passed + ' PASS; ' + r.summary.failed + ' FAIL. These checks verify wiring and controls; the owner still needs to judge driving feel.\n\n'; for (const c of checks)
    md += '## ' + c.rule + '\n\n- Rule: ' + c.expected + '\n- Input: `' + JSON.stringify(c.input) + '`\n- Measured: `' + JSON.stringify(c.measured) + '`\n- **' + c.status + '**\n\n'; writeFileSync(new URL('./CHECK-RESULTS.md', import.meta.url), md); });
