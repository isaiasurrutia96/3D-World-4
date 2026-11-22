// The F1 GoKart, built from the approved design (docs/karts/base-shapes.jpg and
// the measured side/top views in docs/karts/blueprints/). Every size comes
// from the F1 kart's data in spec.js: its wheels, mounts, part boxes and
// driver zone. Body parts are separate groups named `part:<slot>` so they can
// be swapped later; the chassis (tub, engine cover, suspension, cockpit) is
// one group. Looks only: nothing here moves the kart.
import * as T from 'three';
import {F1_GOKART, wheelsOf, placePart, STOCK} from './spec.js';
import {superellipse, loft, wing, plate, tube, curvedTube, block, paint, mirrorX, merge} from './shapes.js';

/** Colours of the approved design: teal body, orange accents, dark carbon. */
export const F1_COLORS = Object.freeze({teal: '#13a59d', orange: '#ff7a1c', carbon: '#20272e', dark: '#12161b', rubber: '#16191e', silver: '#c7ced6'});
const C = F1_COLORS;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const lerp = (a, b, t) => a + (b - a)*t;

/** Interpolates a list of numbered stations ({z, ...values}) at z. */
function station(stations, z) {
  let i = 0; while (i < stations.length - 2 && z > stations[i + 1].z) i++;
  const a = stations[i], b = stations[i + 1], t = smooth(a.z, b.z, z), out = {z};
  for (const key of Object.keys(a)) if (key !== 'z') out[key] = lerp(a[key], b[key], t);
  return out;
}
const range = (from, to, steps) => Array.from({length: steps + 1}, (_, i) => from + (to - from)*i/steps);

// --- Survival cell (tub): from behind the seat to the nose. The cockpit is
// opened by lowering the top of the rings between the side walls ("open").
const TUB = [
  {z: -.62, w: .26, bottom: .12, top: .62, open: 0},
  {z: -.40, w: .33, bottom: .11, top: .66, open: 0},
  {z: -.33, w: .34, bottom: .11, top: .68, open: 1},
  {z: .18,  w: .33, bottom: .12, top: .70, open: 1},
  {z: .30,  w: .29, bottom: .14, top: .72, open: 0},
  {z: .70,  w: .25, bottom: .26, top: .78, open: 0},
];
const COCKPIT_FLOOR = .16, WALL = .055;
function tubRing(s) {
  return superellipse({cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 3.2, count: 40,
    shapeTop: (x, y) => s.open ? lerp(y, COCKPIT_FLOOR, s.open*smooth(s.w - WALL, s.w - WALL - .03, Math.abs(x))) : y});
}

// --- Nose: continues the tub forward and tapers to a rounded tip.
const NOSE = [
  {z: .70,  w: .25, bottom: .26, top: .78},
  {z: 1.00, w: .21, bottom: .26, top: .67},
  {z: 1.40, w: .16, bottom: .255, top: .51},
  {z: 1.75, w: .11, bottom: .26, top: .39},
  {z: 2.02, w: .055, bottom: .27, top: .33},
];
const noseRing = s => superellipse({cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 2.8, count: 40});
/** An orange stripe down the top centre (`du` = half its width around the ring). */
const stripe = du => (x, y, z, u) => u >= 0 && Math.abs(u - .5) < du ? C.orange : C.teal;

// --- Engine cover and airbox: from the roll hoop back over the gearbox.
const COVER = [
  {z: -1.14, w: .07, bottom: .22, top: .40},
  {z: -.95, w: .15, bottom: .24, top: .58},
  {z: -.72, w: .23, bottom: .30, top: .82},
  {z: -.48, w: .24, bottom: .40, top: 1.02},
  {z: -.33, w: .19, bottom: .52, top: 1.10},
];
const coverRing = s => superellipse({cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 2.6, count: 32});

// --- Side pods (right side; the left is a mirror): wide at the intake,
// narrowing towards the back ("coke bottle").
const POD = [
  {z: -.50, cx: .50, w: .11, bottom: .17, top: .44},
  {z: -.20, cx: .56, w: .19, bottom: .155, top: .64},
  {z: .22,  cx: .585, w: .215, bottom: .155, top: .76},
  {z: .50,  cx: .585, w: .215, bottom: .17, top: .76},
];
const podRing = s => superellipse({cx: s.cx, cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 3.4, count: 32});

function partGroup(slot, styleId, meshes) {
  const g = new T.Group(); g.name = `part:${slot}`; g.userData = {slot, style: styleId};
  for (const m of meshes) g.add(m);
  return g;
}
function meshOf(name, geometries, material) {
  const m = new T.Mesh(merge(geometries), material); m.name = name; m.castShadow = true; m.receiveShadow = true; return m;
}

/** One F1 wheel: a fat low-profile tire, six-spoke orange rim and a hub nut. */
function f1Wheel(w, materials) {
  const r = w.radius, half = w.width/2, inner = r*.62, side = Math.sign(w.at[0]);
  const profile = [[inner, -half], [r*.9, -half], [r*.985, -half*.8], [r, -half*.45], [r, half*.45], [r*.985, half*.8], [r*.9, half], [inner, half]];
  const tire = new T.LatheGeometry(profile.map(([a, b]) => new T.Vector2(a, b)), 28); tire.rotateZ(Math.PI/2);
  const rimParts = [paint(new T.CylinderGeometry(inner, inner, w.width*.9, 24, 1, true).rotateZ(Math.PI/2), C.orange)];
  const face = side*half*.55;
  rimParts.push(paint(new T.CylinderGeometry(inner*.98, inner*.98, .012, 24).rotateZ(Math.PI/2).translate(-side*half*.2, 0, 0), C.dark));
  for (let i = 0; i < 6; i++) {
    const a = i*Math.PI/3, spoke = new T.BoxGeometry(.03, inner*.9, .045);
    spoke.translate(0, inner*.45, 0); spoke.rotateX(a); spoke.translate(face, 0, 0); rimParts.push(paint(spoke, C.orange));
  }
  rimParts.push(paint(new T.CylinderGeometry(.06, .06, w.width*.62, 12).rotateZ(Math.PI/2).translate(side*.02, 0, 0), C.dark));
  rimParts.push(paint(new T.CylinderGeometry(.028, .028, w.width*.7, 6).rotateZ(Math.PI/2).translate(side*.04, 0, 0), C.silver));
  const g = new T.Group(); g.name = `wheel-${w.id}`; g.position.set(...w.at);
  g.add(meshOf('tire', [paint(tire, C.rubber)], materials.rubber), meshOf('rim', rimParts, materials.body));
  return g;
}

/** Double-wishbone suspension for one wheel: upper and lower A-arms from the
 *  chassis to the upright, a push rod and a steering (or toe) link. */
function suspension(w, chassisPoints) {
  const s = Math.sign(w.at[0]), x = Math.abs(w.at[0]) - w.width/2 - .02, z = w.at[2], r = w.radius;
  const up = [s*x, r + .1, z], low = [s*x, r - .14, z], parts = [];
  const [u1, u2, l1, l2, push, link] = chassisPoints.map(([px, py, pz]) => [s*px, py, pz]);
  parts.push(tube(u1, up, .014, C.carbon), tube(u2, up, .014, C.carbon), tube(l1, low, .016, C.carbon), tube(l2, low, .016, C.carbon));
  parts.push(tube([s*x, r - .1, z - .02], push, .012, C.carbon), tube(link, [s*x, r - .02, z + .07], .011, C.carbon));
  parts.push(block([s*(x - .02), r, z], [.05, .3, .07], C.carbon));// upright
  return parts;
}

/** Builds the whole F1 GoKart. Returns a group with `chassis`, `wheels` and
 *  one `part:<slot>` group for each body part of the approved design. */
export function buildF1Kart(kart = F1_GOKART, setup = STOCK) {
  if (kart.mode !== 'f1') throw new Error('buildF1Kart needs an F1 kart');
  const lift = setup.rideHeight ?? 0;
  const materials = {
    body: new T.MeshStandardMaterial({vertexColors: true, roughness: .42, metalness: .08}),
    rubber: new T.MeshStandardMaterial({vertexColors: true, roughness: .9, metalness: 0}),
  };
  const root = new T.Group(); root.name = `${kart.id} model`;
  const body = new T.Group(); body.name = 'body'; body.position.y = lift; root.add(body);

  // Chassis: tub, cockpit rim, seat, steering wheel, mirrors, engine cover,
  // airbox, roll hoop, floor, gearbox, rear wing mount posts and suspension.
  const chassis = [];
  chassis.push(loft(range(TUB[0].z, TUB[TUB.length - 1].z, 26).map(z => ({z, ring: tubRing(station(TUB, z))})),
    (x, y, z, u) => y < COCKPIT_FLOOR + .03 && Math.abs(x) < .28 && z > -.34 && z < .22 ? C.dark : z > .25 && stripe(.045)(x, y, z, u) === C.orange ? C.orange : C.teal));
  chassis.push(curvedTube([[-.27, .69, -.30], [-.28, .705, -.02], [-.25, .72, .2], [0, .735, .27], [.25, .72, .2], [.28, .705, -.02], [.27, .69, -.30], [0, .7, -.36]], .024, C.carbon, true));
  chassis.push(block([0, .19, -.05], [.44, .06, .5], C.dark));// seat base
  const seatBack = block([0, 0, 0], [.46, .5, .06], C.dark); seatBack.rotateX(-.42); seatBack.translate(0, .43, -.27); chassis.push(seatBack);
  const wheelBox = block([0, 0, 0], [.24, .1, .03], C.dark); wheelBox.rotateX(-.35); wheelBox.translate(0, .62, .33); chassis.push(wheelBox);
  for (const s of [-1, 1]) chassis.push(tube([s*.1, .62, .335], [s*.14, .60, .34], .022, C.orange));// steering wheel grips
  chassis.push(tube([0, .5, .45], [0, .6, .35], .015, C.carbon));// steering column
  for (const s of [-1, 1]) {// mirrors on stalks
    chassis.push(tube([s*.30, .70, .36], [s*.40, .80, .34], .009, C.carbon));
    chassis.push(paint(new T.BoxGeometry(.1, .05, .045).translate(s*.43, .81, .34), C.teal));
  }
  chassis.push(loft(range(COVER[0].z, COVER[COVER.length - 1].z, 14).map(z => ({z, ring: coverRing(station(COVER, z))})), stripe(.05)));
  chassis.push(paint(new T.CylinderGeometry(.085, .1, .02, 16).rotateX(Math.PI/2).translate(0, 1.0, -.325), C.dark));// airbox intake
  chassis.push(curvedTube([[-.17, .92, -.36], [-.14, 1.22, -.37], [0, 1.4, -.38], [.14, 1.22, -.37], [.17, .92, -.36]], .035, C.teal));
  const floorShape = new T.Shape([[-.55, -.5], [.55, -.5], [.55, .42], [.32, .62], [-.32, .62], [-.55, .42]].map(([x, z]) => new T.Vector2(x, z)));
  const floor = new T.ExtrudeGeometry(floorShape, {depth: .03, bevelEnabled: false}); floor.rotateX(Math.PI/2); floor.translate(0, .11, 0);
  chassis.push(paint(floor, C.carbon));
  chassis.push(block([0, .32, -1.17], [.22, .22, .3], C.carbon));// gearbox and crash structure
  const wingMount = kart.mounts.wing.at;
  for (const s of [-1, 1]) chassis.push(block([s*.09, (.5 + wingMount[1])/2, wingMount[2]], [.04, wingMount[1] - .5, .12], C.carbon));// mount posts up to the wing mount

  // Wheels and suspension (wheels stay on the ground when the body is raised).
  const wheels = new T.Group(); wheels.name = 'wheels'; root.add(wheels);
  const susp = [];
  for (const w of wheelsOf(kart, setup)) {
    wheels.add(f1Wheel(w, materials));
    const front = w.axle === 'front';
    const pts = front
      ? [[.20, .58 + lift, .82], [.18, .56 + lift, 1.10], [.17, .30 + lift, .80], [.15, .30 + lift, 1.12], [.19, .64 + lift, .90], [.20, .36 + lift, 1.04]]
      : [[.15, .56 + lift, -.74], [.13, .52 + lift, -1.08], [.13, .26 + lift, -.70], [.11, .26 + lift, -1.10], [.16, .62 + lift, -.80], [.14, .30 + lift, -1.02]];
    susp.push(...suspension(w, pts));
  }
  const chassisGroup = new T.Group(); chassisGroup.name = 'chassis';
  chassisGroup.add(meshOf('chassis body', chassis, materials.body));
  body.add(chassisGroup);
  root.add(meshOf('suspension', susp, materials.body));

  // Body parts of the approved design, each in its own group.
  const nose = loft(range(NOSE[0].z, NOSE[NOSE.length - 1].z, 16).map(z => ({z, ring: noseRing(station(NOSE, z))})), stripe(.045));
  body.add(partGroup('nose', kart.design.nose, [meshOf('nose', [nose], materials.body)]));

  const fw = [];
  fw.push(wing({span: 1.56, chord: .40, y: .085, leadingZ: 1.95, airfoil: [.06, .4, .12], angle: .04}, C.teal));
  fw.push(wing({span: 1.40, chord: .20, y: .17, leadingZ: 1.62, airfoil: [.05, .4, .10], angle: .32}, C.orange));
  for (const s of [-1, 1]) {
    fw.push(plate({x: s*.79, zMin: 1.34, zMax: 1.96, yMin: .035, yMax: .30, radius: .06}, C.orange));
    fw.push(plate({x: s*.08, zMin: 1.58, zMax: 1.78, yMin: .09, yMax: .27, thickness: .018, radius: .03}, C.carbon));// pylons under the nose
  }
  body.add(partGroup('frontWing', kart.design.frontWing, [meshOf('front wing', fw, materials.body)]));

  const podRight = loft(range(POD[0].z, POD[POD.length - 1].z, 14).map(z => ({z, ring: podRing(station(POD, z))})),
    (x, y, z, u) => u < 0 ? C.orange : u > .2 && u < .8 ? C.orange : C.teal);
  const intake = [paint(new T.CylinderGeometry(1, 1, .02, 24).scale(.165, 1, .25).rotateX(Math.PI/2).translate(.585, .48, .505), C.dark)];
  for (const y of [.38, .44, .50, .56]) intake.push(block([.585, y, .51], [.26, .014, .02], C.carbon));// intake slats
  const pods = [podRight, ...intake, mirrorX(podRight), ...intake.map(mirrorX)];
  body.add(partGroup('sidePanels', kart.design.sidePanels, [meshOf('side pods', pods, materials.body)]));

  const rw = [], box = placePart(kart, 'wing', kart.design.wing)[0];
  const top = box.centre[1] + box.size[1]/2, back = box.centre[2] - box.size[2]/2, frontZ = box.centre[2] + box.size[2]/2;
  rw.push(wing({span: 1.34, chord: .30, y: top - .29, leadingZ: frontZ - .03, airfoil: [.07, .4, .12], angle: .1}, C.teal));
  rw.push(wing({span: 1.34, chord: .16, y: top - .13, leadingZ: back + .2, airfoil: [.06, .4, .10], angle: .45}, C.teal));
  for (const s of [-1, 1]) rw.push(plate({x: s*.68, zMin: back, zMax: frontZ, yMin: top - .40, yMax: top, radius: .05}, C.orange));
  // Struts: from the wing mount (the chassis posts) up to the main plane, so
  // the wing visibly snaps onto its mount.
  const struts = [-1, 1].map(s => tube([s*.09, wingMount[1], wingMount[2]], [s*.09, top - .27, frontZ - .12], .018, C.carbon));
  const strutMesh = meshOf('rear wing struts', struts, materials.body); strutMesh.userData = {strut: true};
  body.add(partGroup('wing', kart.design.wing, [meshOf('rear wing', rw, materials.body), strutMesh]));

  root.userData = {kartId: kart.id, materials};
  return root;
}
