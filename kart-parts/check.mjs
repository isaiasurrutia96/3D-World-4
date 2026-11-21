// Checks for the kart parts foundation (chunk 1). Run: npm run test:karts
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {SLOTS, UPGRADES, KARTS, GOKART, MAIN_KART_WHEELS, LIMITS, resolveKart, checkKart} from './spec.js';
import {buildChassis, buildOutlines, countTriangles} from './build.js';
import {createKartFrame} from '../racing-lab/src/reference-kart.js';

const close = (a, b, tolerance = 1e-6) => Math.abs(a - b) <= tolerance;
const MAX_CHASSIS_TRIANGLES = 8000;// light enough for phones with many karts on track

test('every kart passes its own checks', () => {
  for (const kart of KARTS) assert.deepEqual(checkKart(kart), []);
});

test('every part the owner approved has a slot', () => {
  for (const name of ['nose','hood','frontBumper','rearBumper','sidePanels','fenders','diffuser','wing','mudFlaps','exhaust','lights','seat','steering','wheels','frame'])
    assert.ok(SLOTS[name], `missing slot ${name}`);
  for (const name of ['chassisWeight','suspension','rideHeight','wheelOffset','tires']) assert.ok(UPGRADES[name], `missing upgrade ${name}`);
  assert.deepEqual(UPGRADES.chassisWeight.choices, ['light','standard','heavy']);
});

test('the GoKart has every body slot either built in or as an optional place', () => {
  const placed = new Set([...Object.keys(GOKART.body), ...Object.keys(GOKART.optional)]);
  for (const [name, slot] of Object.entries(SLOTS)) if (slot.group === 'body') assert.ok(placed.has(name), `${name} has no place`);
  assert.equal(GOKART.body.wing, undefined, 'the approved GoKart has no wing built in');
});

test('wheels match the main test kart exactly, so the same driving code can move it', () => {
  const main = createKartFrame(); main.updateMatrixWorld(true);
  const ours = resolveKart(GOKART).wheels;
  for (const w of ours) {
    const [axle, side] = w.id.split('-');
    const node = main.getObjectByName(`${axle}_axle_${side}_wheel`);
    const p = node.getWorldPosition(new T.Vector3());
    assert.ok(close(p.x, w.at[0]) && close(p.y, w.at[1]) && close(p.z, w.at[2]), `${w.id}: ${p.toArray()} vs ${w.at}`);
  }
  const tire = main.getObjectByName('front_axle_left_wheel').getObjectByName('tire');
  tire.geometry.computeBoundingBox();
  assert.ok(close(tire.geometry.boundingBox.max.x, MAIN_KART_WHEELS.radius), 'tire radius');
});

test('mirrored parts are exact left/right copies', () => {
  const parts = resolveKart(GOKART).parts;
  for (const p of parts.filter(p => p.side === 'left')) {
    const twin = parts.find(q => q.id === p.id.replace(/left$/, 'right'));
    assert.ok(twin, `no right side for ${p.id}`);
    assert.equal(p.at[0], -twin.at[0]); assert.deepEqual([p.at[1], p.at[2]], [twin.at[1], twin.at[2]]); assert.deepEqual(p.size, twin.size);
  }
  assert.equal(parts.filter(p => p.slot === 'fenders').length, 4, 'one fender per wheel');
});

test('off-road set-up raises the body, keeps wheels on the ground and pushes wheels and fenders out', () => {
  const base = resolveKart(GOKART), setup = {...GOKART.upgrades, rideHeight: .12, wheelOffset: .08, tires: 'offroad'};
  const raised = resolveKart(GOKART, setup);
  assert.deepEqual(checkKart(GOKART, setup), []);
  assert.ok(close(raised.frameHeight - base.frameHeight, .12));
  raised.wheels.forEach((w, i) => {
    assert.equal(w.at[1], MAIN_KART_WHEELS.radius, 'wheel still touches the ground');
    assert.ok(close(Math.abs(w.at[0]) - Math.abs(base.wheels[i].at[0]), .08));
  });
  raised.parts.forEach((p, i) => {
    assert.ok(close(p.at[1] - base.parts[i].at[1], .12), `${p.id} raised`);
    const pushed = p.slot === 'fenders' || p.slot === 'mudFlaps';
    assert.ok(close(Math.abs(p.at[0]) - Math.abs(base.parts[i].at[0]), pushed ? .08 : 0), `${p.id} sideways`);
  });
});

test('bad data is caught, not silently accepted', () => {
  const bad = {...GOKART, mode: 'boat', body: {...GOKART.body, wings: GOKART.optional.wing}, upgrades: {...GOKART.upgrades, chassisWeight: 'feather', rideHeight: .5}};
  const problems = checkKart(bad).join('\n');
  for (const text of ['unknown mode', 'unknown part "wings"', 'chassisWeight', 'rideHeight']) assert.match(problems, new RegExp(text));
  const far = {...GOKART, body: {...GOKART.body, nose: {at: [0, .4, 2.5], size: [1, .2, .5]}}};
  assert.match(checkKart(far).join('\n'), /nose" reaches outside/);
  const flipped = {...GOKART, body: {...GOKART.body, sidePanels: {...GOKART.body.sidePanels, at: [-.62, .43, -.18]}}};
  assert.match(checkKart(flipped).join('\n'), /mirrored "sidePanels"/);
});

test('the built chassis has every chassis part, sits on the ground and is light enough', () => {
  const chassis = buildChassis(GOKART); chassis.updateMatrixWorld(true);
  for (const name of ['frame', 'seat', 'steering', 'wheels', 'steering_wheel', 'rear axle'])
    assert.ok(chassis.getObjectByName(name), `missing ${name}`);
  assert.equal(chassis.getObjectByName('wheels').children.length, 4);
  const box = new T.Box3().setFromObject(chassis);
  assert.ok(close(box.min.y, 0, 1e-3), `lowest point ${box.min.y}`);
  assert.ok(Math.abs(box.min.x) <= LIMITS.halfWidth && box.max.x <= LIMITS.halfWidth && box.max.y <= LIMITS.maxY);
  assert.ok(box.max.z <= LIMITS.halfLength && box.min.z >= -LIMITS.halfLength);
  const triangles = countTriangles(chassis);
  assert.ok(triangles <= MAX_CHASSIS_TRIANGLES, `${triangles} triangles`);
  console.log(`  chassis: ${Math.round(triangles)} triangles, ${(box.max.x - box.min.x).toFixed(2)} x ${(box.max.y - box.min.y).toFixed(2)} x ${(box.max.z - box.min.z).toFixed(2)} m`);
});

test('the seat faces forward and the steering wheel is in front of it', () => {
  const chassis = buildChassis(GOKART); chassis.updateMatrixWorld(true);
  const seat = new T.Box3().setFromObject(chassis.getObjectByName('seat_shell'));
  const wheel = chassis.getObjectByName('steering_wheel').getWorldPosition(new T.Vector3());
  assert.ok(seat.max.z < wheel.z, 'steering wheel ahead of the seat');
  const back = seat.min.z, front = seat.max.z;
  assert.ok(back < -.8 && front > -.15 && front < .1, `seat from ${back.toFixed(2)} to ${front.toFixed(2)}`);
  assert.ok(seat.max.y > .9, 'seat back is the tall end');
});

test('the raised chassis keeps its wheels on the ground', () => {
  const chassis = buildChassis(GOKART, {...GOKART.upgrades, rideHeight: .15, wheelOffset: .12}); chassis.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(chassis);
  assert.ok(close(box.min.y, 0, 1e-3));
  assert.ok(box.max.x <= LIMITS.halfWidth, 'still inside the kart space with wheels pushed out');
});

test('outlines: one named box per part place, built-in and optional kept apart', () => {
  const outlines = buildOutlines(GOKART), parts = resolveKart(GOKART).parts;
  assert.equal(outlines.children.length, parts.length);
  for (const p of parts) {
    const g = outlines.getObjectByName(`slot:${p.id}`);
    assert.ok(g, `no outline for ${p.id}`);
    assert.equal(g.userData.optional, p.optional);
    assert.deepEqual(g.position.toArray(), p.at);
  }
  assert.equal(countTriangles(outlines), 0, 'outlines are not counted as kart geometry');
});
