// Checks for the shape methods and the three kart models. Run: npm run test:karts
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {KARTS, GOKART, GT_GOKART, F1_GOKART, LIMITS, MAX_OFFROAD, wheelsOf, placePart, driverZones, driverPose, AVATAR} from './spec.js';
import {naca4, loft, superellipse, mirrorX, wing, pchip, stationCurve} from './shapes.js';
import {MODELS, buildKart} from './models.js';
import {driverDummy} from './kart-model.js';

const close = (a, b, tolerance) => Math.abs(a - b) <= tolerance;
const MAX_TRIANGLES = 20000, MAX_MESHES = 24;// per kart: light enough for phones with a grid of karts
const boxOf = object => { object.updateWorldMatrix(true, true); return new T.Box3().setFromObject(object); };// parents too
function* worldVertices(object) {
  object.updateWorldMatrix(true, true);
  const v = new T.Vector3(), meshes = [];
  object.traverse(o => { if (o.isMesh) meshes.push(o); });
  for (const mesh of meshes) { const p = mesh.geometry.attributes.position; for (let i = 0; i < p.count; i++) yield v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld); }
}
const inside = (v, z) => v.x > z.min[0] && v.x < z.max[0] && v.y > z.min[1] && v.y < z.max[1] && v.z > z.min[2] && v.z < z.max[2];
const built = Object.fromEntries(KARTS.map(k => [k.mode, buildKart(k)]));

// --- Shape methods -------------------------------------------------------

test('NACA 4-digit airfoil follows the published shape', () => {
  const pts = naca4(0, .4, .12, 40);// symmetric 0012
  let thickest = 0, at = 0;
  for (const [x, y] of pts.slice(0, 41)) if (2*y > thickest) { thickest = 2*y; at = x; }
  assert.ok(close(thickest, .12, .003), `max thickness ${thickest}`);
  assert.ok(at > .25 && at < .35, `thickest at ${at} of the chord`);
  assert.ok(close(pts[0][0], 1, 1e-9) && close(pts[0][1], 0, 1e-3), 'closed trailing edge');
  const mid = naca4(.06, .4, .12, 40).slice(0, 41).reduce((best, p) => Math.abs(p[0] - .4) < Math.abs(best[0] - .4) ? p : best);
  assert.ok(mid[1] > .06, 'camber lifts the upper surface');
});

test('PCHIP passes through every point and never overshoots (no ripples)', () => {
  const xs = [0, 1, 2, 3, 4], ys = [0, 1, 1, .4, .4], f = pchip(xs, ys);
  xs.forEach((x, i) => assert.ok(close(f(x), ys[i], 1e-12)));
  for (let x = 0; x <= 4; x += .01) {
    const i = Math.min(3, Math.floor(x)), lo = Math.min(ys[i], ys[i + 1]), hi = Math.max(ys[i], ys[i + 1]);
    assert.ok(f(x) >= lo - 1e-12 && f(x) <= hi + 1e-12, `overshoot at ${x}`);
  }
  assert.throws(() => pchip([0, 0], [1, 2]), /increase/);
  const s = stationCurve([{z: 0, w: 1}, {z: 1, w: 2}]);
  assert.ok(close(s(.5).w, 1.5, 1e-12));
});

test('lofted nose tops are smooth: height only ever goes down from back to tip', async () => {
  for (const kart of [GOKART, F1_GOKART]) {
    const nose = built[kart.mode].getObjectByName('part:nose'), tops = new Map();
    for (const v of worldVertices(nose)) { const z = Math.round(v.z*200)/200; tops.set(z, Math.max(tops.get(z) ?? -1, v.y)); }
    const zs = [...tops.keys()].sort((a, b) => a - b), back = zs[0] + .05, ys = zs.filter(z => z > back).map(z => tops.get(z));
    let rises = 0; for (let i = 1; i < ys.length; i++) if (ys[i] > ys[i - 1] + .002) rises++;
    assert.equal(rises, 0, `${kart.label} nose top ripples`);
  }
});

test('lofts face outward everywhere, including the end caps', () => {
  const rings = [0, .5, 1].map(z => ({z, ring: superellipse({cy: 1, halfWidth: .3, halfHeight: .2, exponent: 3, count: 24})}));
  const g = loft(rings, () => '#fff'), p = g.attributes.position, nrm = g.attributes.normal;
  let wrong = 0;
  for (let f = 0; f < p.count; f += 3) {
    const a = new T.Vector3().fromBufferAttribute(p, f), b = new T.Vector3().fromBufferAttribute(p, f + 1), c = new T.Vector3().fromBufferAttribute(p, f + 2);
    const face = b.clone().sub(a).cross(c.clone().sub(a)).normalize(), centre = a.add(b).add(c).divideScalar(3);
    const out = Math.abs(face.z) > .99 ? new T.Vector3(0, 0, Math.sign(centre.z - .5)) : new T.Vector3(centre.x, centre.y - 1, 0).normalize();
    if (face.dot(out) <= 0) wrong++;
  }
  assert.equal(wrong, 0, 'faces pointing inward');
  for (let i = 0; i < nrm.count; i++) assert.ok(close(new T.Vector3().fromBufferAttribute(nrm, i).length(), 1, 1e-4));
  assert.throws(() => loft([{z: 1, ring: rings[0].ring}, {z: 0, ring: rings[0].ring}], () => '#fff'), /back to front/);
});

test('mirroring keeps faces outward', () => {
  const g = wing({span: 1, chord: .3, y: 0, leadingZ: 0}, '#fff'); g.translate(1, 0, 0);
  const m = mirrorX(g); m.computeBoundingBox();
  assert.ok(m.boundingBox.max.x <= -.5 + 1e-6, 'moved to the other side');
  const volume = geom => { const p = geom.attributes.position; let v = 0; for (let i = 0; i < p.count; i += 3) {
    const a = new T.Vector3().fromBufferAttribute(p, i), b = new T.Vector3().fromBufferAttribute(p, i + 1), c = new T.Vector3().fromBufferAttribute(p, i + 2);
    v += a.dot(b.cross(c))/6; } return v; };
  assert.ok(volume(g) > 0 && volume(m) > 0, 'both enclose positive volume (outward faces)');
});

// --- The three karts -----------------------------------------------------

test('sizes: GoKart small, GT medium, F1 large, all close (each step under a third bigger)', () => {
  const size = mode => { const b = boxOf(built[mode]); return {length: b.max.z - b.min.z, width: b.max.x - b.min.x}; };
  const [s, m, l] = ['gokart', 'gt', 'f1'].map(size);
  assert.ok(s.length < m.length && m.length < l.length, 'lengths in order');
  assert.ok(s.width < m.width && m.width < l.width, 'widths in order');
  assert.ok(m.length/s.length < 1.33 && l.length/m.length < 1.33, 'close in size');
  console.log(`  lengths ${[s, m, l].map(x => x.length.toFixed(2)).join(' / ')} m, widths ${[s, m, l].map(x => x.width.toFixed(2)).join(' / ')} m`);
});

test('F1 wheels are the same size as the GT wheels', () => {
  const r = kart => wheelsOf(kart).map(w => w.radius);
  for (const radius of r(F1_GOKART)) assert.ok(close(radius, r(GT_GOKART)[0], 1e-9));
});

for (const kart of KARTS) {
  const model = built[kart.mode];
  test(`${kart.label}: every part of the approved design, each in its own swappable group, inside its part box`, () => {
    for (const [slot, style] of Object.entries(kart.design)) {
      const group = model.getObjectByName(`part:${slot}`), allowed = new T.Box3();
      assert.ok(group, `missing ${slot}`); assert.equal(group.userData.style, style);
      for (const b of placePart(kart, slot, style)) allowed.union(new T.Box3(new T.Vector3(...b.centre.map((c, i) => c - b.size[i]/2)), new T.Vector3(...b.centre.map((c, i) => c + b.size[i]/2))));
      allowed.expandByScalar(.02);
      for (const mesh of group.children.filter(m => !m.userData.strut)) assert.ok(allowed.containsBox(boxOf(mesh)), `${slot}: ${mesh.name} reaches outside its box`);
    }
    for (const name of ['chassis', 'wheels', 'cockpit']) assert.ok(model.getObjectByName(name), `missing ${name}`);
  });

  test(`${kart.label}: nothing in the driver's head space; body parts stay out of the hips and body`, () => {
    const zones = driverZones(kart);
    for (const slot of Object.keys(kart.design)) {
      let hits = 0; for (const v of worldVertices(model.getObjectByName(`part:${slot}`))) if (inside(v, zones.head) || inside(v, zones.body) || inside(v, zones.hips)) hits++;
      assert.equal(hits, 0, `${slot} enters the driver zone`);
    }
    for (const name of ['chassis', 'cockpit', 'wheels', 'suspension']) {
      const o = model.getObjectByName(name); if (!o) continue;
      let head = 0; for (const v of worldVertices(o)) if (inside(v, zones.head)) head++;
      assert.equal(head, 0, `${name} enters the head space`);
    }
  });

  test(`${kart.label}: wheels on the ground in their places; the steering wheel is within the avatar's reach`, () => {
    for (const w of wheelsOf(kart)) {
      const b = boxOf(model.getObjectByName(`wheel-${w.id}`).getObjectByName('tire')), c = b.getCenter(new T.Vector3());
      assert.ok(close(b.min.y, 0, .002), `${w.id} touches the ground`);
      assert.ok(close(b.max.y - b.min.y, 2*w.radius, .003), `${w.id} diameter`);
      assert.ok(close(c.x, w.at[0], .003) && close(c.z, w.at[2], .003), `${w.id} place`);
    }
    const {shoulder} = driverPose(kart), reach = new T.Vector3(...shoulder).distanceTo(new T.Vector3(...model.userData.steering));
    assert.ok(reach > .15 && reach < .30 + .28 + .1, `steering wheel ${reach.toFixed(2)} m from the shoulders`);// upper arm + forearm + hand
  });

  test(`${kart.label}: symmetric, inside the kart space, on the ground, light enough for phones`, () => {
    const b = boxOf(model);
    assert.ok(close(b.min.y, 0, .002), `lowest point ${b.min.y}`);
    assert.ok(close(b.min.x, -b.max.x, .005), 'left and right match');
    assert.ok(b.max.x <= LIMITS.halfWidth && b.max.y <= LIMITS.maxY && Math.max(-b.min.z, b.max.z) <= LIMITS.halfLength);
    let triangles = 0, meshes = 0;
    model.traverse(o => {
      if (!o.isMesh) return; meshes++;
      const g = o.geometry; triangles += (g.index ? g.index.count : g.attributes.position.count)/3;
      for (const name of ['position', 'normal', 'color']) assert.ok(g.attributes[name]?.array.every(Number.isFinite), `${o.name} ${name}`);
    });
    assert.ok(triangles <= MAX_TRIANGLES, `${triangles} triangles`); assert.ok(meshes <= MAX_MESHES, `${meshes} meshes`);
  });

  test(`${kart.label}: raised for off-road, the body rises and the wheels stay on the ground`, () => {
    const raised = buildKart(kart, MAX_OFFROAD), slot = Object.keys(kart.design)[0];
    assert.ok(close(boxOf(raised.getObjectByName(`part:${slot}`)).min.y - boxOf(model.getObjectByName(`part:${slot}`)).min.y, MAX_OFFROAD.rideHeight, 1e-6));
    for (const w of wheelsOf(kart, MAX_OFFROAD)) assert.ok(close(boxOf(raised.getObjectByName(`wheel-${w.id}`).getObjectByName('tire')).min.y, 0, .002));
  });
}

test('GT wheel arches clear their tires (the rims stay visible below)', () => {
  const arches = built.gt.getObjectByName('part:fenders');
  for (const w of wheelsOf(GT_GOKART)) {
    let closest = Infinity, lowest = Infinity;
    for (const v of worldVertices(arches)) {
      if (Math.abs(v.x - w.at[0]) > w.width/2 + .05) continue;
      closest = Math.min(closest, Math.hypot(v.y - w.at[1], v.z - w.at[2])); lowest = Math.min(lowest, v.y);
    }
    assert.ok(closest > w.radius + .005, `${w.id} arch ${(closest - w.radius).toFixed(3)} m from the tire`);
    assert.ok(lowest > w.at[1], `${w.id} arch stays above the hub, so the rim shows`);
  }
});

test('the rear wing struts start exactly at the wing mount on the GT and F1 GoKarts', () => {
  for (const kart of [GT_GOKART, F1_GOKART]) {
    const struts = built[kart.mode].getObjectByName('rear wing struts'), mountY = kart.mounts.wing.at[1]*kart.scale;
    assert.ok(close(boxOf(struts).min.y, mountY, .03), `${kart.label} struts start at ${boxOf(struts).min.y.toFixed(3)}, mount at ${mountY.toFixed(3)}`);
  }
});

test('the driver dummy is the avatar\'s size and sits in each seat', () => {
  for (const kart of KARTS) {
    const dummy = driverDummy(kart, built[kart.mode].userData.steering), b = boxOf(dummy), {head, hip} = driverPose(kart);
    assert.ok(close(b.max.y, head[1] + AVATAR.headRadius, .01), `${kart.label} head top`);
    assert.ok(b.min.y >= 0 && hip[1] > 0, `${kart.label} sits above the ground`);
  }
  assert.deepEqual(Object.keys(MODELS), ['gokart', 'gt', 'f1']);
  assert.throws(() => MODELS.f1(GOKART), /needs an F1 kart/);
});
