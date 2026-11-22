// Shared pieces for building the three kart models (GoKart, GT GoKart and
// F1 GoKart): materials, part groups, wheels in each kart's rim style,
// double-wishbone suspension, seats and steering wheels placed from the
// seated driver's real pose, and a grey driver dummy built from the avatar's
// body sizes (to judge scale). Every model follows the same layout:
//   root
//   ├─ body (raised by the off-road set-up)
//   │   ├─ design space (scaled by kart.scale; holds the lofted bodywork,
//   │   │   built in the design units measured from the approved pictures)
//   │   │   ├─ chassis
//   │   │   └─ part:<slot> (one group per swappable body part)
//   │   └─ cockpit (seat and steering wheel, in real metres)
//   ├─ wheels (real metres, always on the ground)
//   └─ suspension (real metres, joins the body to the wheels)
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {STOCK, AVATAR, wheelsOf, driverPose, checkKart, setupProblems} from './spec.js';
import {tube, curvedTube, paint, merge} from './shapes.js';

/** Surface finish, easy to tune: paint is slightly glossy, rubber is matte. */
export const FINISH = Object.freeze({paint: {roughness: .42, metalness: .08}, rubber: {roughness: .9, metalness: 0}, dummy: {roughness: .6, metalness: 0}});

/** One standard material with vertex colours for paint, one for rubber. */
export function kartMaterials() {
  return {
    body: new T.MeshStandardMaterial({vertexColors: true, ...FINISH.paint}),
    rubber: new T.MeshStandardMaterial({vertexColors: true, ...FINISH.rubber}),
  };
}

/** A mesh from several geometries merged into one (one draw call). */
export function meshOf(name, geometries, material) {
  const m = new T.Mesh(merge(geometries), material); m.name = name; m.castShadow = true; m.receiveShadow = true; return m;
}

/** A swappable body part: a group named `part:<slot>` recording its style. */
export function partGroup(slot, styleId, meshes) {
  const g = new T.Group(); g.name = `part:${slot}`; g.userData = {slot, style: styleId};
  for (const m of meshes) g.add(m);
  return g;
}

/** A rounded box (three.js RoundedBoxGeometry) with its centre and size. */
export function roundedBlock(centre, size, radius, color, segments = 2) {
  const g = new RoundedBoxGeometry(...size, segments, Math.min(radius, ...size.map(s => s/2 - 1e-3)));
  g.translate(...centre); return paint(g, color);
}

/** The skeleton of a model (see the layout at the top of this file). The
 *  kart's data and the set-up are checked first: a wrongly tuned number stops
 *  the build with a clear message instead of making a broken kart. */
export function modelSkeleton(kart, setup = STOCK) {
  const problems = [...checkKart(kart, {...STOCK, ...setup}), ...setupProblems(setup)];
  if (problems.length) throw new Error(`Cannot build ${kart.label ?? 'kart'}: ${problems.join('; ')}`);
  const root = new T.Group(); root.name = `${kart.id} model`;
  const body = new T.Group(); body.name = 'body'; body.position.y = setup.rideHeight ?? 0; root.add(body);
  const design = new T.Group(); design.name = 'design space'; design.scale.setScalar(kart.scale); body.add(design);
  const cockpit = new T.Group(); cockpit.name = 'cockpit'; body.add(cockpit);
  const wheels = new T.Group(); wheels.name = 'wheels'; root.add(wheels);
  root.userData = {kartId: kart.id, mode: kart.mode};
  return {root, body, design, cockpit, wheels};
}

/** Rim styles of the three approved designs. */
export const RIMS = Object.freeze({
  gokart: {spokes: 5, color: '#c9d0d8', hub: '#3d4654', inner: .58, spokeWidth: .05},
  gt:     {spokes: 8, color: '#f5b800', hub: '#1b1e22', inner: .64, spokeWidth: .028},
  f1:     {spokes: 6, color: '#ff7a1c', hub: '#12161b', inner: .62, spokeWidth: .036},
});

/** One wheel (real metres): a lathe-turned tire with rounded shoulders and a
 *  spoked rim in the kart's style. The wheel spins about its X axis. */
export function buildWheel(w, rimStyle, materials) {
  const r = w.radius, half = w.width/2, inner = r*rimStyle.inner, side = Math.sign(w.at[0]);
  const profile = [[inner, -half], [r*.9, -half], [r*.985, -half*.78], [r, -half*.42], [r, half*.42], [r*.985, half*.78], [r*.9, half], [inner, half]];
  const tire = new T.LatheGeometry(profile.map(([a, b]) => new T.Vector2(a, b)), 32); tire.rotateZ(Math.PI/2);
  const rim = [paint(new T.CylinderGeometry(inner, inner, w.width*.9, 28, 1, true).rotateZ(Math.PI/2), rimStyle.color)];
  rim.push(paint(new T.CylinderGeometry(inner*.97, inner*.97, w.width*.04, 28).rotateZ(Math.PI/2).translate(-side*half*.15, 0, 0), rimStyle.hub));
  const face = side*half*.55;
  for (let i = 0; i < rimStyle.spokes; i++) {
    const a = i*2*Math.PI/rimStyle.spokes, spoke = new T.BoxGeometry(.03*r/.3, inner*.88, rimStyle.spokeWidth*r/.3);
    spoke.translate(0, inner*.44, 0); spoke.rotateX(a); spoke.translate(face, 0, 0); rim.push(paint(spoke, rimStyle.color));
  }
  rim.push(paint(new T.CylinderGeometry(r*.19, r*.19, w.width*.62, 14).rotateZ(Math.PI/2).translate(side*.015, 0, 0), rimStyle.hub));
  rim.push(paint(new T.CylinderGeometry(r*.08, r*.08, w.width*.7, 6).rotateZ(Math.PI/2).translate(side*.03, 0, 0), '#c7ced6'));
  const g = new T.Group(); g.name = `wheel-${w.id}`; g.position.set(...w.at);
  g.add(meshOf('tire', [paint(tire, '#16191e')], materials.rubber), meshOf('rim', rim, materials.body));
  return g;
}

/** All four wheels of a kart. */
export function addWheels(group, kart, setup, rimStyle, materials) {
  for (const w of wheelsOf(kart, setup)) group.add(buildWheel(w, rimStyle, materials));
}

/** Double-wishbone suspension for one wheel (real metres): upper and lower
 *  A-arms from two chassis points each to the upright, a push rod and a
 *  steering or toe link. `pts` are six chassis points (right side). */
export function wishbones(w, pts, color) {
  const s = Math.sign(w.at[0]), x = Math.abs(w.at[0]) - w.width/2 - .015, z = w.at[2], r = w.radius;
  const up = [s*x, r + .3*r, z], low = [s*x, r - .4*r, z], [u1, u2, l1, l2, push, link] = pts.map(([px, py, pz]) => [s*px, py, pz]);
  return [tube(u1, up, .012, color), tube(u2, up, .012, color), tube(l1, low, .014, color), tube(l2, low, .014, color),
    tube([s*x, r - .3*r, z - .02], push, .01, color), tube(link, [s*x, r, z + .06], .009, color),
    paint(new T.BoxGeometry(.04, .8*r, .06).translate(s*(x - .015), r, z), color)];
}

/** A bucket seat (real metres) under the seated driver: a cushion below the
 *  hips and a back along the spine, with raised side bolsters. */
export function seat(kart, color, trim) {
  const {hip, recline} = driverPose(kart), up = new T.Vector3(0, Math.cos(recline), -Math.sin(recline));
  const parts = [roundedBlock([0, hip[1] - .1, hip[2] + .05], [.5, .07, .46], .03, color)];
  const backLen = AVATAR.hipToShoulder + .08, centre = new T.Vector3(...hip).add(new T.Vector3(0, -.06, -.1)).addScaledVector(up, backLen/2);
  const back = roundedBlock([0, 0, 0], [.52, backLen, .07], .03, color); back.rotateX(-recline); back.translate(...centre.toArray()); parts.push(back);
  for (const s of [-1, 1]) {
    const bolster = roundedBlock([0, 0, 0], [.07, backLen*.8, .16], .03, color); bolster.rotateX(-recline);
    bolster.translate(...centre.clone().add(new T.Vector3(s*.27, 0, 0)).addScaledVector(up, -.04).add(new T.Vector3(0, 0, .05)).toArray()); parts.push(bolster);
    parts.push(roundedBlock([s*.27, hip[1] - .04, hip[2] + .05], [.07, .1, .42], .03, color));
  }
  if (trim) {// a trim tube around the top edge of the back (as on the GoKart design)
    const top = new T.Vector3(...hip).addScaledVector(up, backLen + .04).add(new T.Vector3(0, -.06, -.14));
    parts.push(curvedTube([[-.28, top.y - .25, top.z + .1], [-.27, top.y, top.z], [0, top.y + .03, top.z - .01], [.27, top.y, top.z], [.28, top.y - .25, top.z + .1]], .018, trim));
  }
  return parts;
}

/** Where the hands hold the wheel: in front of the shoulders, within reach. */
export function steeringPoint(kart, reachForward, height) {
  const {shoulder} = driverPose(kart);
  return [0, shoulder[1] + height, shoulder[2] + reachForward];
}

/** A round steering wheel facing the driver, with spokes and a column. */
export function roundWheel(centre, radius, columnBase, rimColor, columnColor, spokes = 3) {
  const c = new T.Vector3(...centre), axis = c.clone().sub(new T.Vector3(...columnBase)).normalize();
  const ring = new T.TorusGeometry(radius, radius*.12, 8, 32);
  const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), axis);
  const parts = [paint(ring.applyQuaternion(q).translate(...centre), rimColor), tube(columnBase, centre, .016, columnColor)];
  for (let i = 0; i < spokes; i++) {
    const a = Math.PI/2 + i*2*Math.PI/spokes, end = new T.Vector3(Math.cos(a)*radius, Math.sin(a)*radius, 0).applyQuaternion(q).add(c);
    parts.push(tube(centre, end.toArray(), radius*.07, rimColor));
  }
  return parts;
}

/** A grey driver dummy (real metres) from the avatar's body sizes, sitting in
 *  the kart's seat with hands on the wheel (`hands`, the model's
 *  userData.steering): to judge each kart's scale. Built in the stock pose;
 *  add it to the model's `body` group so it rises with an off-road set-up. */
export function driverDummy(kart, hands) {
  const {hip, shoulder, head, recline} = driverPose(kart), parts = [];
  // Feet rest low on the pedals, below the hips (inside the nose).
  const feetY = kart.seat.feetY !== undefined ? kart.seat.feetY*kart.scale : Math.max(.09, hip[1] - .25);
  const cap = (a, b, r) => {
    const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), g = new T.CapsuleGeometry(r, Math.max(.001, d.length()), 4, 10);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize())); g.translate(...A.add(B).multiplyScalar(.5).toArray());
    return g;
  };
  parts.push(new T.SphereGeometry(AVATAR.headRadius, 20, 14).translate(...head));
  parts.push(cap(hip, shoulder, .17));
  parts.push(cap([0, shoulder[1] + .02, shoulder[2]], [0, head[1] - AVATAR.headRadius + .02, head[2] + .02], .06));// neck
  const hand = hands ?? [0, shoulder[1] - .1, shoulder[2] + .5];
  for (const s of [-1, 1]) {
    const sh = [s*.26, shoulder[1] - .04, shoulder[2]], grip = [s*.15, hand[1], hand[2] - .02];
    const elbow = [s*.3, (sh[1] + grip[1])/2 - .12, (sh[2] + grip[2])/2];
    parts.push(cap(sh, elbow, .055), cap(elbow, grip, .045), new T.SphereGeometry(.05, 10, 8).translate(...grip));
    const hp = [s*.12, hip[1], hip[2]], ankle = [s*.08, feetY, hip[2] + .64], knee = [s*.095, Math.max(hip[1], ankle[1]) + .16, hip[2] + .34];// knees close together, as in a race car
    parts.push(cap(hp, knee, .075), cap(knee, ankle, .06), new T.BoxGeometry(.08, .13, .22).translate(s*.08, ankle[1] + .03, ankle[2] + .06));
  }
  const m = new T.Mesh(merge(parts.map(g => paint(g, '#b9bfc6'))), new T.MeshStandardMaterial({vertexColors: true, ...FINISH.dummy}));
  m.name = 'driver dummy'; m.castShadow = true; m.userData.recline = recline;
  return m;
}
