// Checks for the kart parts system. Run: npm run test:karts
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {SLOTS, UPGRADES, STYLES, KARTS, GOKART, GT_GOKART, F1_GOKART, MAIN_KART_WHEELS, LIMITS, STOCK, MAX_OFFROAD,
  stylesFor, defaultChoices, wheelsOf, placePart, fitProblems, layoutKart, checkKart, driverZones, overlaps} from './spec.js';
import {buildChassis, buildWheels, buildOutlines, buildDriverZone, countTriangles} from './build.js';
import {createKartFrame} from '../racing-lab/src/reference-kart.js';

const close = (a, b, tolerance = 1e-6) => Math.abs(a - b) <= tolerance;
const MAX_CHASSIS_TRIANGLES = 8000;// light enough for phones with many karts on track
const SETUPS = {stock: STOCK, offroad: MAX_OFFROAD, raisedOnly: {...STOCK, rideHeight: .15}, wideOnly: {...STOCK, wheelOffset: .12}};

test('all three approved karts pass their own checks', () => {
  for (const kart of KARTS) assert.deepEqual(checkKart(kart), [], kart.label);
  assert.deepEqual(KARTS.map(k => k.mode), ['gokart', 'gt', 'f1']);
});

test('every part the owner approved has a slot, and every upgrade exists', () => {
  for (const name of ['nose','hood','frontBumper','frontWing','rearBumper','sidePanels','fenders','diffuser','wing','mudFlaps','exhaust','lights','seat','steering','wheels','frame'])
    assert.ok(SLOTS[name], `missing slot ${name}`);
  for (const name of ['chassisWeight','suspension','rideHeight','wheelOffset','tires']) assert.ok(UPGRADES[name], `missing upgrade ${name}`);
  assert.deepEqual(UPGRADES.chassisWeight.choices, ['light','standard','heavy']);
});

test('several styles exist for wings, bumpers and wings snap onto the same mount', () => {
  for (const kart of KARTS) assert.ok(stylesFor(kart, 'wing').length >= 3, `${kart.label} wing styles`);
  assert.ok(stylesFor(GOKART, 'frontBumper').length >= 2 && stylesFor(GOKART, 'rearBumper').length >= 2);
  const short = placePart(GOKART, 'wing', 'low-spoiler')[0], long = placePart(GOKART, 'wing', 'tall-wing')[0];
  assert.deepEqual(short.anchor, long.anchor, 'same mount point');
  assert.ok(long.centre[2] < short.centre[2] && long.centre[1] > short.centre[1], 'the extended wing reaches further back and higher');
});

test('every style fits every kart of its mode, for every set-up (no part in the driver zone or the wheels)', () => {
  let combinations = 0;
  for (const kart of KARTS) for (const [name, setup] of Object.entries(SETUPS))
    for (const slot of Object.keys(kart.mounts)) for (const id of stylesFor(kart, slot)) {
      combinations++;
      assert.deepEqual(fitProblems(kart, slot, id, setup), [], `${kart.label} ${slot} ${id} (${name})`);
    }
  assert.ok(combinations >= 150, `${combinations} combinations`);
});

test('wings never come near the driver\'s head, on any kart', () => {
  for (const kart of KARTS) {
    const head = driverZones(kart).head;
    for (const id of stylesFor(kart, 'wing')) {
      const wing = placePart(kart, 'wing', id)[0], front = wing.centre[2] + wing.size[2]/2;
      assert.ok(front <= head.min[2] - .15, `${kart.label} ${id}: ${(head.min[2] - front).toFixed(2)} m behind the head`);
    }
  }
});

test('a part that does not fit is rejected with the reason', () => {
  const shoved = {...GOKART, mounts: {...GOKART.mounts, wing: {kind: 'point', at: [0, .42, -.6], mirrored: false}}};
  assert.match(fitProblems(shoved, 'wing', 'tall-wing').join('\n'), /driver's (head|body)/);
  const inWheel = {...GT_GOKART, mounts: {...GT_GOKART.mounts, frontBumper: {kind: 'point', at: [0, .25, .8], mirrored: false}}};
  assert.match(fitProblems(inWheel, 'frontBumper', 'gt-front-bumper').join('\n'), /would hit the front-(left|right) wheel/);
  assert.match(fitProblems(GOKART, 'wing', 'f1-wing').join('\n'), /not made for gokart karts/);
  assert.match(fitProblems(F1_GOKART, 'hood', 'gt-hood').join('\n'), /not made for f1|no mount/);
  assert.throws(() => placePart(GOKART, 'wing', 'nope'), /Unknown wing style/);
});

test('shell noses may cover the legs but never the body or head', () => {
  assert.ok(STYLES.nose['f1-nose'].shell && STYLES.nose['gokart-nose'].shell);
  const pushedBack = {...F1_GOKART, mounts: {...F1_GOKART.mounts, nose: {kind: 'point', at: [0, .30, -.2], mirrored: false}}};
  assert.match(fitProblems(pushedBack, 'nose', 'f1-nose').join('\n'), /driver's (body|head)/);
});

test('bad data is caught, not silently accepted', () => {
  const bad = {...GOKART, mode: 'boat', mounts: {...GOKART.mounts, wings: GOKART.mounts.wing}, upgrades: {...STOCK, chassisWeight: 'feather', rideHeight: .5}};
  const problems = checkKart(bad, bad.upgrades).join('\n');
  for (const text of ['unknown mode', 'unknown part "wings"', 'chassisWeight', 'rideHeight']) assert.match(problems, new RegExp(text));
  const flipped = {...GOKART, mounts: {...GOKART.mounts, sidePanels: {kind: 'point', at: [-.62, .24, .05], mirrored: true}}};
  assert.match(checkKart(flipped).join('\n'), /mirrored "sidePanels"/);
  const noMount = {...GOKART, design: {...GOKART.design, frontWing: 'slim-front-wing'}};
  assert.match(checkKart(noMount).join('\n'), /no mount/);
});

test('the GoKart\'s wheels match the main test kart exactly, so the same driving code can move it', () => {
  const main = createKartFrame(); main.updateMatrixWorld(true);
  for (const w of wheelsOf(GOKART)) {
    const p = main.getObjectByName(`${w.axle}_axle_${w.side}_wheel`).getWorldPosition(new T.Vector3());
    assert.ok(close(p.x, w.at[0]) && close(p.y, w.at[1]) && close(p.z, w.at[2]), `${w.id}: ${p.toArray()} vs ${w.at}`);
    assert.equal(w.radius, MAIN_KART_WHEELS.radius);
  }
});

test('the measured designs keep their character: GT is compact, F1 is long with smaller front wheels', () => {
  const wheelbase = k => k.wheels.frontZ - k.wheels.rearZ;
  assert.ok(wheelbase(GT_GOKART) < wheelbase(GOKART) && wheelbase(GT_GOKART) < wheelbase(F1_GOKART));
  assert.ok(F1_GOKART.wheels.front.radius < F1_GOKART.wheels.rear.radius);
  const nose = k => { const b = placePart(k, 'nose', k.design.nose)[0]; return b.centre[2] + b.size[2]/2; };
  assert.ok(nose(F1_GOKART) > nose(GT_GOKART), 'F1 nose reaches further forward than GT');
  assert.equal(GT_GOKART.design.fenders, 'arch', 'GT wheels are covered by arches');
  assert.equal(GOKART.design.wing, undefined, 'the approved GoKart has no wing');
});

test('off-road set-up: body and driver rise, wheels stay on the ground and move out, fenders and flaps follow', () => {
  for (const kart of KARTS) {
    const setup = {...STOCK, rideHeight: .12, wheelOffset: .08};
    wheelsOf(kart, setup).forEach((w, i) => {
      const base = wheelsOf(kart)[i];
      assert.equal(w.at[1], w.radius, 'wheel still on the ground');
      assert.ok(close(Math.abs(w.at[0]) - Math.abs(base.at[0]), .08));
    });
    assert.ok(close(driverZones(kart, setup).head.min[1] - driverZones(kart).head.min[1], .12));
    for (const slot of ['fenders', 'mudFlaps', 'wing']) {
      const before = placePart(kart, slot, stylesFor(kart, slot)[0]), after = placePart(kart, slot, stylesFor(kart, slot)[0], setup);
      after.forEach((b, i) => {
        assert.ok(close(b.centre[1] - before[i].centre[1], .12), `${kart.label} ${b.id} raised`);
        const pushed = slot !== 'wing';
        assert.ok(close(Math.abs(b.centre[0]) - Math.abs(before[i].centre[0]), pushed ? .08 : 0), `${kart.label} ${b.id} sideways`);
      });
    }
  }
});

test('mirrored parts are exact left/right copies; one fender per wheel, one flap per rear wheel', () => {
  for (const kart of KARTS) {
    const layout = layoutKart(kart).flatMap(p => p.boxes);
    for (const b of layout.filter(b => b.id.endsWith('left'))) {
      const twin = layout.find(c => c.id === b.id.replace(/left$/, 'right'));
      assert.ok(twin, `no right side for ${b.id}`);
      assert.ok(close(b.centre[0], -twin.centre[0])); assert.deepEqual(b.centre.slice(1), twin.centre.slice(1)); assert.deepEqual(b.size, twin.size);
    }
    assert.equal(layout.filter(b => b.slot === 'fenders').length, 4);
    assert.equal(layout.filter(b => b.slot === 'mudFlaps').length, 2);
  }
});

test('overlap test: touching boxes do not count, real overlaps do', () => {
  assert.equal(overlaps({min: [0, 0, 0], max: [1, 1, 1]}, {min: [1, 0, 0], max: [2, 1, 1]}), false);
  assert.equal(overlaps({min: [0, 0, 0], max: [1, 1, 1]}, {min: [.9, .5, .5], max: [2, 2, 2]}), true);
});

test('the GoKart chassis has every chassis part, sits on the ground and is light enough', () => {
  const chassis = buildChassis(GOKART); chassis.updateMatrixWorld(true);
  for (const name of ['frame', 'seat', 'steering', 'wheels', 'steering_wheel', 'rear axle']) assert.ok(chassis.getObjectByName(name), `missing ${name}`);
  assert.equal(chassis.getObjectByName('wheels').children.length, 4);
  const b = new T.Box3().setFromObject(chassis);
  assert.ok(close(b.min.y, 0, 1e-3), `lowest point ${b.min.y}`);
  assert.ok(Math.max(-b.min.x, b.max.x) <= LIMITS.halfWidth && b.max.y <= LIMITS.maxY && Math.max(-b.min.z, b.max.z) <= LIMITS.halfLength);
  const triangles = countTriangles(chassis);
  assert.ok(triangles <= MAX_CHASSIS_TRIANGLES, `${triangles} triangles`);
  const raised = buildChassis(GOKART, MAX_OFFROAD); raised.updateMatrixWorld(true);
  const rb = new T.Box3().setFromObject(raised);
  assert.ok(close(rb.min.y, 0, 1e-3) && Math.max(-rb.min.x, rb.max.x) <= LIMITS.halfWidth, 'raised chassis keeps wheels on the ground');
});

test('the GoKart seat sits inside the driver zone and the steering wheel is in front of it', () => {
  const chassis = buildChassis(GOKART); chassis.updateMatrixWorld(true);
  const seat = new T.Box3().setFromObject(chassis.getObjectByName('seat_shell'));
  const wheel = chassis.getObjectByName('steering_wheel').getWorldPosition(new T.Vector3());
  const body = driverZones(GOKART).body;
  assert.ok(seat.max.z < wheel.z, 'steering wheel ahead of the seat');
  assert.ok(seat.min.z >= body.min[2] - .1 && seat.max.z <= .1, `seat from ${seat.min.z.toFixed(2)} to ${seat.max.z.toFixed(2)}`);
});

test('GT and F1 wheels are built with their own sizes', () => {
  for (const kart of [GT_GOKART, F1_GOKART]) {
    const wheels = buildWheels(kart); wheels.updateMatrixWorld(true);
    assert.equal(wheels.children.length, 4);
    const front = new T.Box3().setFromObject(wheels.getObjectByName('wheel-front-left'));
    assert.ok(close(front.max.y - front.min.y, 2*kart.wheels.front.radius, 1e-3), `${kart.label} front wheel size`);
  }
});

test('outlines: one named box per part, coloured by design, optional or blocked', () => {
  for (const kart of KARTS) {
    const choices = defaultChoices(kart), outlines = buildOutlines(kart, choices), layout = layoutKart(kart, choices);
    assert.equal(outlines.children.length, layout.reduce((n, p) => n + p.boxes.length, 0));
    for (const part of layout) for (const b of part.boxes) {
      const g = outlines.getObjectByName(`slot:${b.id}`);
      assert.ok(g, `no outline for ${b.id}`); assert.equal(g.userData.optional, part.optional); assert.equal(g.userData.fits, true);
      assert.deepEqual(g.position.toArray(), b.centre);
    }
    assert.equal(countTriangles(outlines), 0, 'outlines are not counted as kart geometry');
    assert.equal(buildDriverZone(kart).children.length, 3);
  }
});
