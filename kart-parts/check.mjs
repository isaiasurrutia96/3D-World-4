// Checks for the kart parts system. Run: npm run test:karts
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {SLOTS, UPGRADES, STYLES, KARTS, GOKART, GT_GOKART, F1_GOKART, LIMITS, STOCK, MAX_OFFROAD, AVATAR,
  stylesFor, defaultChoices, wheelsOf, placePart, fitProblems, layoutKart, checkKart, driverZones, driverPose, overlaps, hitsWheel} from './spec.js';
import {buildOutlines, buildDriverZone, countTriangles} from './build.js';
import {CENTRE, SIDE} from '../motion-core/skeleton/bones.js';

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
  const shoved = {...GOKART, mounts: {...GOKART.mounts, wing: {kind: 'point', at: [0, .42, -.3], mirrored: false}}};
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

test('the measured designs keep their character: GT compact with arches, F1 long, GoKart without a wing', () => {
  const wheelbase = k => (k.wheels.frontZ - k.wheels.rearZ)*k.scale;
  assert.ok(wheelbase(GT_GOKART) < wheelbase(F1_GOKART), 'GT shorter between the wheels than F1');
  const nose = k => { const b = placePart(k, 'nose', k.design.nose)[0]; return b.centre[2] + b.size[2]/2; };
  assert.ok(nose(F1_GOKART) > nose(GT_GOKART), 'F1 nose reaches further forward than GT');
  assert.equal(GT_GOKART.design.fenders, 'arch', 'GT wheels are covered by arches');
  assert.equal(GOKART.design.wing, undefined, 'the approved GoKart has no wing');
  assert.deepEqual(KARTS.map(k => k.size), ['small', 'medium', 'large']);
  assert.ok(GOKART.scale < GT_GOKART.scale && GT_GOKART.scale < F1_GOKART.scale);
});

test('the avatar sizes match the avatar\'s skeleton', () => {
  const joint = name => [...CENTRE, ...SIDE].find(b => b.name === name);
  const hipY = joint('pelvis').head[1];
  assert.ok(Math.abs(joint('chest').tail[1] - hipY - AVATAR.hipToShoulder) < .002, 'hip to shoulder');
  assert.ok(Math.abs(joint('head').head[1] - hipY - AVATAR.hipToHead) < .002, 'hip to head centre');
  assert.ok(Math.abs(joint('head').tail[1] - joint('head').head[1] - AVATAR.headRadius) < .002, 'head radius');
  assert.ok(AVATAR.shoulderHalf > joint('clavicle').tail[0], 'shoulders include the arm');
  const thigh = joint('thigh'), calf = joint('shin');
  assert.ok(AVATAR.legReach < (thigh.head[1] - thigh.tail[1]) + (calf.head[1] - calf.tail[1]) + .25, 'bent legs and feet reach less than straight legs and feet');
});

test('the driver zone comes from the seat: hips, a leaning torso, legs forward and the head on top', () => {
  for (const kart of KARTS) {
    const {hip, shoulder, head} = driverPose(kart), z = driverZones(kart);
    assert.ok(shoulder[2] < hip[2] && head[2] < shoulder[2], `${kart.label} leans back`);
    assert.ok(Math.abs(Math.hypot(head[1] - hip[1], head[2] - hip[2]) - AVATAR.hipToHead) < 1e-9);
    assert.ok(z.legs.max[2] > hip[2] + .5 && z.head.max[1] > z.body.max[1]);
  }
});

test('wheel hits are exact (a cylinder, not a box): an arch above the tire is clear, one touching it is not', () => {
  const w = {at: [0, .3, 0], radius: .3, width: .25};
  assert.equal(hitsWheel({min: [-.1, .61, -.2], max: [.1, .7, .2]}, w), false, 'just above the tire');
  assert.equal(hitsWheel({min: [-.1, .55, .26], max: [.1, .7, .4]}, w), false, 'beside the tire\'s curve, inside its square');
  assert.equal(hitsWheel({min: [-.1, .55, -.1], max: [.1, .7, .1]}, w), true);
  assert.equal(hitsWheel({min: [.2, 0, -.1], max: [.3, .7, .1]}, w), false, 'past the tire\'s side');
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
    assert.equal(buildDriverZone(kart).children.length, 4);
  }
});
