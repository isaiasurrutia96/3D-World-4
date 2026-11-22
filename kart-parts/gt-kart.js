// The GT GoKart (medium), built from the approved design (docs/karts/base-shapes.jpg,
// measured side/top views in docs/karts/blueprints/gt-*.jpg): compact and
// wide, yellow and black, a sloping hood and nose, a front bumper with
// intakes, wheel arches over every wheel with the rims still visible, side
// skirts with yellow inserts, a roll bar over the driver's head and a rear
// wing on struts. Same methods as the F1 GoKart.
import * as T from 'three';
import {GT_GOKART, STOCK, placePart, driverPose, AVATAR, wheelsOf} from './spec.js';
import {superellipse, loft, wing, plate, tube, curvedTube, paint, mirrorX, stationCurve, range} from './shapes.js';
import {kartMaterials, meshOf, partGroup, modelSkeleton, addWheels, wishbones, seat, steeringPoint, roundWheel, roundedBlock, RIMS} from './kart-model.js';

export const GT_COLORS = Object.freeze({yellow: '#f5b800', black: '#1b1e22', dark: '#111417', grey: '#3a4048'});
const C = GT_COLORS;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const lerp = (a, b, t) => a + (b - a)*t;
const lofted = (curve, from, to, steps, ring, color) => loft(range(from, to, steps).map(z => ({z, ring: ring(curve(z))})), color);
/** A black band down the top centre, yellow elsewhere (the design's stripe). */
const band = du => (x, y, z, u) => u >= 0 && Math.abs(u - .5) < du ? C.black : C.yellow;

// Body tub (design units): narrow over the wheels, widest at the cockpit,
// which is opened between the side walls and fits the avatar's shoulders.
const TUB = stationCurve([
  {z: -1.30, w: .48, bottom: .12, top: .58, open: 0},
  {z: -1.05, w: .55, bottom: .08, top: .80, open: 0},
  {z: -.46,  w: .55, bottom: .08, top: .86, open: 0},
  {z: -.34,  w: .58, bottom: .08, top: .86, open: 1},
  {z: .30,   w: .58, bottom: .08, top: .82, open: 1},
  {z: .44,   w: .54, bottom: .09, top: .84, open: 0},
  {z: .78,   w: .50, bottom: .10, top: .80, open: 0},
  {z: 1.22,  w: .46, bottom: .12, top: .66, open: 0},// footwell under the hood, up to the nose
]);
const FLOOR = .14, WALL = .07;
const tubRing = s => superellipse({cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 4, count: 40,
  shapeTop: (x, y) => s.open > .001 ? lerp(y, FLOOR, Math.min(1, s.open)*smooth(s.w - WALL, s.w - WALL - .03, Math.abs(x))) : y});
const HOOD = stationCurve([
  {z: .66, w: .48, bottom: .62, top: .95},
  {z: .95, w: .49, bottom: .62, top: .90},
  {z: 1.20, w: .49, bottom: .62, top: .78},
  {z: 1.34, w: .47, bottom: .62, top: .70},
]);
const NOSE = stationCurve([
  {z: 1.20, w: .52, bottom: .28, top: .68},
  {z: 1.45, w: .52, bottom: .27, top: .62},
  {z: 1.62, w: .46, bottom: .30, top: .52},
  {z: 1.70, w: .36, bottom: .34, top: .44},
]);
const BUMPER = stationCurve([
  {z: 1.44, w: .73, bottom: .07, top: .43},
  {z: 1.66, w: .72, bottom: .07, top: .42},
  {z: 1.80, w: .60, bottom: .10, top: .36},
]);
const ring = exponent => s => superellipse({cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent, count: 36});

/** A wheel arch over one wheel (design units): the arch's rectangular
 *  cross-section spun around the axle from 15 to 165 degrees (LatheGeometry),
 *  which shades smoothly along the curve; corner points are doubled a hair
 *  apart so the edges stay crisp; both ends are closed. Wider than the tire
 *  and stopping above the hub, so the rim stays visible. */
function arch(cx, cy, cz, inner, outer, width, color) {
  const h = width/2, e = .002, a0 = 15*Math.PI/180, a1 = 165*Math.PI/180;
  const profile = [[inner, -h + e], [inner + e, -h], [outer - e, -h], [outer, -h + e], [outer, h - e], [outer - e, h], [inner + e, h], [inner, h - e], [inner, -h + e]];
  const g = new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), 28, 2*Math.PI - a1, a1 - a0);
  g.rotateZ(-Math.PI/2);// lathe axis (Y) becomes the axle (X); angles then run over the top
  const caps = [a0, a1].map((a, i) => {// flat end faces
    const pts = [[-h, inner], [h, inner], [h, outer], [-h, outer]].map(([x, r]) => new T.Vector3(x, Math.sin(a)*r, Math.cos(a)*r));
    const cap = new T.BufferGeometry().setFromPoints(i ? [pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]] : [pts[0], pts[2], pts[1], pts[0], pts[3], pts[2]]);
    cap.computeVertexNormals(); return cap;
  });
  return [g, ...caps].map(part => paint(part.translate(cx, cy, cz), color));
}

/** Builds the whole GT GoKart (see kart-model.js for the layout). */
export function buildGTKart(kart = GT_GOKART, setup = STOCK) {
  if (kart.mode !== 'gt') throw new Error('buildGTKart needs a GT GoKart');
  const materials = kartMaterials(), k = kart.scale, lift = setup.rideHeight ?? 0;
  const {root, design, cockpit, wheels} = modelSkeleton(kart, setup);
  const {head} = driverPose(kart), headTop = (head[1] + AVATAR.headRadius)/k, headBack = (head[2] - AVATAR.headRadius)/k;

  // Chassis (design units): body tub, cockpit rim, roll bar just above and
  // behind the head, and the floor.
  const chassis = [];
  chassis.push(lofted(TUB, -1.30, 1.22, 40, tubRing,
    (x, y, z, u) => y < FLOOR + .03 && Math.abs(x) < .5 && z > -.36 && z < .32 ? C.dark : u >= 0 && (u < .2 || u > .8) ? C.black : band(.06)(x, y, z, u)));
  chassis.push(curvedTube([[-.51, .85, -.32], [-.51, .835, 0], [-.48, .82, .30], [0, .84, .38], [.48, .82, .30], [.51, .835, 0], [.51, .85, -.32], [0, .86, -.40]], .03, C.black, true));
  const barZ = Math.min(-.52, headBack - .06), barTop = Math.max(1.56, headTop + .06);
  chassis.push(curvedTube([[-.32, .84, barZ + .03], [-.30, barTop - .22, barZ], [0, barTop, barZ - .02], [.30, barTop - .22, barZ], [.32, .84, barZ + .03]], .045, C.black));
  chassis.push(roundedBlock([0, .07, -.25], [1.0, .03, 2.0], .01, C.dark));
  const chassisGroup = new T.Group(); chassisGroup.name = 'chassis'; chassisGroup.add(meshOf('chassis body', chassis, materials.body)); design.add(chassisGroup);

  // Cockpit (real metres): black seat and a round wheel within reach.
  const grip = steeringPoint(kart, .43, .16);
  cockpit.add(meshOf('seat and steering', [...seat(kart, C.black), ...roundWheel(grip, .15, [0, .80*k, .75*k], C.black, C.grey, 2)], materials.body));

  // Wheels and (mostly hidden) double-wishbone suspension.
  addWheels(wheels, kart, setup, RIMS.gt, materials);
  const susp = [];
  for (const w of wheelsOf(kart, setup)) {
    const front = w.axle === 'front', z = w.at[2]/k;
    susp.push(...wishbones(w, [[.40, .52, z - .14], [.40, .52, z + .14], [.40, .22, z - .16], [.40, .22, z + .16], [.38, .60, z - .06], [.40, .30, z + (front ? .10 : -.10)]]
      .map(([px, py, pz]) => [px*k, py*k + lift, pz*k]), C.grey));
  }
  root.add(meshOf('suspension', susp, materials.body));

  // Body parts of the approved design (design units).
  design.add(partGroup('hood', kart.design.hood, [meshOf('hood', [lofted(HOOD, .66, 1.34, 14, ring(4), band(.07))], materials.body)]));
  design.add(partGroup('nose', kart.design.nose, [meshOf('nose', [lofted(NOSE, 1.20, 1.70, 10, ring(3.6), band(.07))], materials.body)]));
  const bumper = [lofted(BUMPER, 1.44, 1.80, 8, ring(4.5), () => C.black)];
  for (const s of [-1, 1]) bumper.push(roundedBlock([s*.42, .24, 1.785], [.32, .10, .03], .012, C.yellow));// intakes
  bumper.push(roundedBlock([0, .22, 1.79], [.30, .12, .02], .01, C.dark));
  design.add(partGroup('frontBumper', kart.design.frontBumper, [meshOf('front bumper', bumper, materials.body)]));
  const skirt = [roundedBlock([.685, .285, .015], [.18, .44, .73], .05, C.black), roundedBlock([.77, .30, .015], [.02, .10, .50], .01, C.yellow)];
  design.add(partGroup('sidePanels', kart.design.sidePanels, [meshOf('side skirts', [...skirt, ...skirt.map(mirrorX)], materials.body)]));
  design.add(partGroup('rearBumper', kart.design.rearBumper, [meshOf('rear bumper',
    [roundedBlock([0, .28, -1.22], [1.16, .34, .22], .06, C.black), roundedBlock([0, .36, -1.33], [.72, .05, .02], .01, C.yellow)], materials.body)]));
  const arches = wheelsOf(kart, setup).flatMap(w => arch(w.at[0]/k, w.radius/k, w.at[2]/k, w.radius/k + .03, w.radius/k + .09, .40, C.black));
  design.add(partGroup('fenders', kart.design.fenders, [meshOf('wheel arches', arches, materials.body)]));

  const box = placePart(kart, 'wing', kart.design.wing)[0], mount = kart.mounts.wing.at;
  const top = (box.centre[1] + box.size[1]/2)/k, back = (box.centre[2] - box.size[2]/2)/k, frontZ = (box.centre[2] + box.size[2]/2)/k;
  const rw = [wing({span: 1.18, chord: .30, y: top - .10, leadingZ: frontZ - .03, airfoil: [.06, .4, .12], angle: .08}, C.black)];
  for (const s of [-1, 1]) rw.push(plate({x: s*.62, zMin: back + .01, zMax: frontZ - .01, yMin: top - .28, yMax: top - .01, radius: .05}, C.yellow));
  const struts = meshOf('rear wing struts', [-1, 1].map(s => tube([s*.2, mount[1], mount[2]], [s*.2, top - .16, frontZ - .1], .022, C.black)), materials.body);
  struts.userData = {strut: true};
  design.add(partGroup('wing', kart.design.wing, [meshOf('rear wing', rw, materials.body), struts]));

  root.userData.steering = grip;
  return root;
}
