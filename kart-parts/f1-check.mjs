// Checks for the shape methods and the F1 GoKart model. Run: npm run test:karts
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {F1_GOKART, GOKART, STYLES, LIMITS, MAX_OFFROAD, wheelsOf, placePart, driverZones} from './spec.js';
import {naca4, loft, superellipse, mirrorX, wing} from './shapes.js';
import {buildF1Kart} from './f1-kart.js';

const close = (a, b, tolerance) => Math.abs(a - b) <= tolerance;
const MAX_TRIANGLES = 16000, MAX_MESHES = 24;// whole kart, light enough for phones with a full grid of karts
const boxOf = object => { object.updateWorldMatrix(true, true); return new T.Box3().setFromObject(object); };// parents too
function* worldVertices(object) {
  object.updateWorldMatrix(true, true);
  const v = new T.Vector3();
  for (const mesh of (object.isMesh ? [object] : object.getObjectsByProperty('isMesh', true))) {
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) yield v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
  }
}
const inside = (v, z) => v.x > z.min[0] && v.x < z.max[0] && v.y > z.min[1] && v.y < z.max[1] && v.z > z.min[2] && v.z < z.max[2];

test('NACA 4-digit airfoil follows the published shape', () => {
  const pts = naca4(0, .4, .12, 40);// symmetric 0012
  let thickest = 0, at = 0;
  for (const [x, y] of pts.slice(0, 41)) if (2*y > thickest) { thickest = 2*y; at = x; }
  assert.ok(close(thickest, .12, .003), `max thickness ${thickest}`);
  assert.ok(at > .25 && at < .35, `thickest at ${at} of the chord`);
  assert.ok(close(pts[0][0], 1, 1e-9) && close(pts[0][1], 0, 1e-3), 'closed trailing edge');
  assert.ok(Math.min(...pts.map(p => p[0])) >= -1e-9, 'starts at the leading edge');
  const cambered = naca4(.06, .4, .12, 40), mid = cambered.slice(0, 41).reduce((best, p) => Math.abs(p[0] - .4) < Math.abs(best[0] - .4) ? p : best);
  assert.ok(mid[1] > .06, 'camber lifts the upper surface');
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

const kart = buildF1Kart();

test('the F1 GoKart has every part of the approved design, each in its own swappable group', () => {
  for (const [slot, style] of Object.entries(F1_GOKART.design)) {
    const g = kart.getObjectByName(`part:${slot}`);
    assert.ok(g, `missing ${slot}`); assert.equal(g.userData.style, style);
  }
  for (const name of ['chassis', 'wheels', 'suspension']) assert.ok(kart.getObjectByName(name), `missing ${name}`);
  assert.throws(() => buildF1Kart(GOKART), /needs an F1 kart/);
});

test('every body part sits inside its measured part box', () => {
  for (const [slot, style] of Object.entries(F1_GOKART.design)) {
    const group = kart.getObjectByName(`part:${slot}`), allowed = new T.Box3();
    for (const b of placePart(F1_GOKART, slot, style)) allowed.union(new T.Box3(new T.Vector3(...b.centre.map((c, i) => c - b.size[i]/2)), new T.Vector3(...b.centre.map((c, i) => c + b.size[i]/2))));
    allowed.expandByScalar(.02);
    for (const mesh of group.children.filter(m => !m.userData.strut)) assert.ok(allowed.containsBox(boxOf(mesh)), `${slot}: ${mesh.name} reaches outside its box`);
  }
  assert.ok(STYLES.wing['f1-wing']);
});

test('the rear wing struts start exactly at the wing mount (the wing snaps onto it)', () => {
  const struts = kart.getObjectByName('rear wing struts'), mount = new T.Vector3(...F1_GOKART.mounts.wing.at);
  const lowest = boxOf(struts).min;
  assert.ok(close(lowest.y, mount.y, .03), `struts start at ${lowest.y.toFixed(3)}, mount at ${mount.y}`);
  const posts = boxOf(kart.getObjectByName('chassis')).max.y >= mount.y;
  assert.ok(posts, 'chassis reaches up to the mount');
});

test('no body part and nothing of the chassis is in the driver\'s head space; body parts stay out of the body space', () => {
  const zones = driverZones(F1_GOKART);
  for (const slot of Object.keys(F1_GOKART.design)) {
    let hits = 0; for (const v of worldVertices(kart.getObjectByName(`part:${slot}`))) if (inside(v, zones.head) || inside(v, zones.body)) hits++;
    assert.equal(hits, 0, `${slot} enters the driver zone`);
  }
  let head = 0; for (const v of worldVertices(kart.getObjectByName('chassis'))) if (inside(v, zones.head)) head++;
  assert.equal(head, 0, 'chassis enters the head space');
});

test('wheels: on the ground, in the measured places, F1 front wheels smaller', () => {
  for (const w of wheelsOf(F1_GOKART)) {
    const tire = kart.getObjectByName(`wheel-${w.id}`).getObjectByName('tire'), b = boxOf(tire), c = b.getCenter(new T.Vector3());
    assert.ok(close(b.min.y, 0, .002), `${w.id} touches the ground`);
    assert.ok(close(b.max.y - b.min.y, 2*w.radius, .003), `${w.id} diameter`);
    assert.ok(close(c.x, w.at[0], .003) && close(c.z, w.at[2], .003), `${w.id} place`);
  }
});

test('the whole kart is symmetric, inside the kart space and sits on the ground', () => {
  const b = boxOf(kart);
  assert.ok(close(b.min.y, 0, .002), `lowest point ${b.min.y}`);
  assert.ok(close(b.min.x, -b.max.x, .005), 'left and right match');
  assert.ok(b.max.x <= LIMITS.halfWidth && b.max.y <= LIMITS.maxY && Math.max(-b.min.z, b.max.z) <= LIMITS.halfLength);
});

test('light enough for phones and free of broken numbers', () => {
  let triangles = 0, meshes = 0;
  kart.traverse(o => {
    if (!o.isMesh) return; meshes++;
    const g = o.geometry; triangles += (g.index ? g.index.count : g.attributes.position.count)/3;
    for (const name of ['position', 'normal', 'color']) assert.ok(g.attributes[name]?.array.every(Number.isFinite), `${o.name} ${name}`);
  });
  assert.ok(triangles <= MAX_TRIANGLES, `${triangles} triangles`); assert.ok(meshes <= MAX_MESHES, `${meshes} meshes`);
  console.log(`  F1 GoKart: ${triangles} triangles in ${meshes} meshes`);
});

test('raised for off-road: the body rises, the wheels stay on the ground', () => {
  const raised = buildF1Kart(F1_GOKART, MAX_OFFROAD);
  assert.ok(close(boxOf(raised.getObjectByName('part:nose')).min.y - boxOf(kart.getObjectByName('part:nose')).min.y, MAX_OFFROAD.rideHeight, 1e-6));
  for (const w of wheelsOf(F1_GOKART, MAX_OFFROAD)) assert.ok(close(boxOf(raised.getObjectByName(`wheel-${w.id}`).getObjectByName('tire')).min.y, 0, .002));
});
