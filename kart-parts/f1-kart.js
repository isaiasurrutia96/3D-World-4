// The F1 GoKart (large), built from the approved design (docs/karts/base-shapes.jpg,
// measured side/top views in docs/karts/blueprints/). Bodywork is in design
// units inside the scaled "design space"; wheels, suspension, seat, steering
// wheel and the driver dummy are in real metres around the seated avatar.
// Methods (kart-parts/README.md): lofted superellipse sections joined with
// PCHIP curves, NACA 4-digit wings, double-wishbone suspension.
//
// Every part is its own builder below (one per style id in the kart's parts
// list in spec.js); assembleKart puts them together.
import * as T from 'three';
import {F1_GOKART, STOCK, placePart} from './spec.js';
import {superellipse, loft, wing, plate, tube, curvedTube, block, paint, mirrorX, stationCurve, range} from './shapes.js';
import {assembleKart, meshOf, wishbones, seat, roundedBlock, wheelSet, RIMS} from './kart-model.js';

/** Colours of the approved design: teal body, orange accents, dark carbon. */
export const F1_COLORS = Object.freeze({teal: '#13a59d', orange: '#ff7a1c', carbon: '#20272e', dark: '#12161b', silver: '#c7ced6'});
const C = F1_COLORS;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const lerp = (a, b, t) => a + (b - a)*t;
/** An orange stripe down the top centre (`du` = half its width around the ring). */
const stripe = du => (x, y, z, u) => u >= 0 && Math.abs(u - .5) < du ? C.orange : C.teal;

// Survival cell (tub), design units. "open" lowers the top between the side
// walls to open the cockpit; it is wide enough for the avatar's shoulders.
const TUB = stationCurve([
  {z: -.62, w: .30, bottom: .12, top: .62, open: 0},
  {z: -.42, w: .44, bottom: .11, top: .66, open: 0},
  {z: -.34, w: .46, bottom: .11, top: .68, open: 1},
  {z: .28,  w: .45, bottom: .13, top: .71, open: 1},
  {z: .42,  w: .36, bottom: .17, top: .73, open: 0},
  {z: .70,  w: .25, bottom: .26, top: .78, open: 0},
]);
const COCKPIT_FLOOR = .16, WALL = .06;
const tubRing = s => superellipse({cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 3.2, count: 40,
  shapeTop: (x, y) => s.open > .001 ? lerp(y, COCKPIT_FLOOR, Math.min(1, s.open)*smooth(s.w - WALL, s.w - WALL - .03, Math.abs(x))) : y});

// Nose: continues the tub forward and tapers to a rounded tip.
const NOSE = stationCurve([
  {z: .70,  w: .25, bottom: .26, top: .78},
  {z: 1.00, w: .21, bottom: .26, top: .67},
  {z: 1.40, w: .16, bottom: .255, top: .51},
  {z: 1.75, w: .11, bottom: .26, top: .39},
  {z: 2.02, w: .055, bottom: .27, top: .33},
]);
const noseRing = s => superellipse({cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 2.8, count: 40});

// Engine cover and airbox: from just behind the driver's head back over the gearbox.
const COVER = stationCurve([
  {z: -1.14, w: .07, bottom: .22, top: .40},
  {z: -.97, w: .15, bottom: .24, top: .58},
  {z: -.80, w: .23, bottom: .30, top: .82},
  {z: -.64, w: .25, bottom: .40, top: 1.02},
  {z: -.55, w: .20, bottom: .52, top: 1.10},
]);
const coverRing = s => superellipse({cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 2.6, count: 32});

// Side pods (right side; the left is a mirror), wide at the intake and
// narrowing towards the back ("coke bottle").
const POD = stationCurve([
  {z: -.50, cx: .55, w: .11, bottom: .17, top: .44},
  {z: -.20, cx: .61, w: .19, bottom: .155, top: .64},
  {z: .22,  cx: .635, w: .215, bottom: .155, top: .76},
  {z: .50,  cx: .635, w: .215, bottom: .17, top: .76},
]);
const podRing = s => superellipse({cx: s.cx, cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent: 3.4, count: 32});
const lofted = (curve, from, to, steps, ring, color) => loft(range(from, to, steps).map(z => ({z, ring: ring(curve(z))})), color);

// Chassis pick-up points for the wishbones (design units, right side):
// upper front/back, lower front/back, push rod, steering or toe link.
const PICKUPS = {
  front: [[.20, .58, .82], [.18, .56, 1.10], [.17, .30, .80], [.15, .30, 1.12], [.19, .64, .90], [.20, .36, 1.04]],
  rear: [[.15, .56, -.74], [.13, .52, -1.08], [.13, .26, -.70], [.11, .26, -1.10], [.16, .62, -.80], [.14, .30, -1.02]],
};

/** The F1 GoKart's parts, by style id. Each returns where it belongs and its pieces. */
export const F1_BUILDERS = Object.freeze({
  // Survival cell with the cockpit opened in it, and the cockpit rim.
  'f1-tub': ({materials}) => ({space: 'design', parts: [meshOf('survival cell', [
    lofted(TUB, -.62, .70, 34, tubRing,
      (x, y, z, u) => y < COCKPIT_FLOOR + .03 && Math.abs(x) < .4 && z > -.36 && z < .3 ? C.dark : z > .42 && stripe(.045)(x, y, z, u) === C.orange ? C.orange : C.teal),
    curvedTube([[-.40, .69, -.31], [-.40, .705, 0], [-.37, .72, .26], [0, .74, .36], [.37, .72, .26], [.40, .705, 0], [.40, .69, -.31], [0, .70, -.40]], .026, C.carbon, true)], materials.body)]}),
  'f1-floor': ({materials}) => {
    const outline = new T.Shape([[-.60, -.5], [.60, -.5], [.60, .42], [.34, .62], [-.34, .62], [-.60, .42]].map(([x, z]) => new T.Vector2(x, z)));
    const floor = new T.ExtrudeGeometry(outline, {depth: .03, bevelEnabled: false}); floor.rotateX(Math.PI/2); floor.translate(0, .11, 0);
    return {space: 'design', parts: [meshOf('floor', [paint(floor, C.carbon)], materials.body)]};
  },
  // Engine cover and airbox, the gearbox, and the posts up to the wing mount.
  'f1-engine-cover': ({kart, materials}) => {
    const mount = kart.mounts.wing.at, pieces = [lofted(COVER, -1.14, -.55, 16, coverRing, stripe(.05))];
    pieces.push(paint(new T.CylinderGeometry(.085, .1, .02, 16).rotateX(Math.PI/2).translate(0, 1.0, -.545), C.dark));// airbox intake
    pieces.push(roundedBlock([0, .32, -1.17], [.22, .22, .3], .03, C.carbon));// gearbox and crash structure
    for (const s of [-1, 1]) pieces.push(block([s*.09, (.5 + mount[1])/2, mount[2]], [.04, mount[1] - .5, .12], C.carbon));
    return {space: 'design', parts: [meshOf('engine cover', pieces, materials.body)]};
  },
  // Just above and behind the driver's head, whatever the seat's tuning.
  'f1-roll-hoop': ({head, materials}) => {
    const z = Math.min(-.58, head.back - .08), top = Math.max(1.40, head.top + .07);
    return {space: 'design', parts: [meshOf('roll hoop', [curvedTube([[-.18, .95, z + .02], [-.15, top - .18, z], [0, top, z - .01], [.15, top - .18, z], [.18, .95, z + .02]], .035, C.teal)], materials.body)]};
  },
  'f1-mirrors': ({materials}) => ({space: 'design', parts: [meshOf('mirrors', [-1, 1].flatMap(s => [
    tube([s*.40, .72, .33], [s*.52, .82, .31], .01, C.carbon), roundedBlock([s*.56, .83, .31], [.12, .06, .05], .015, C.teal)]), materials.body)]}),
  'f1-seat': ({kart, materials}) => ({space: 'cockpit', parts: [meshOf('seat', seat(kart, C.dark), materials.body)]}),
  // An F1-style wheel: a flat panel with grips, on a short column.
  'f1-steering': ({grip, materials}) => {
    const panel = roundedBlock([0, 0, 0], [.24, .11, .035], .02, C.dark); panel.rotateX(-.35); panel.translate(...grip);
    const pieces = [panel, tube([0, grip[1] - .08, grip[2] + .16], [0, grip[1] - .01, grip[2] + .02], .014, C.carbon)];
    for (const s of [-1, 1]) pieces.push(tube([s*.1, grip[1] - .005, grip[2] + .005], [s*.145, grip[1] - .03, grip[2] + .015], .022, C.orange));
    return {space: 'cockpit', parts: [meshOf('steering wheel', pieces, materials.body)]};
  },
  'f1-wheels': ctx => ({space: 'ground', parts: [wheelSet(ctx, RIMS.f1)]}),
  'f1-wishbones': ({k, lift, wheels, materials}) => ({space: 'ground', parts: [meshOf('suspension',
    wheels.flatMap(w => wishbones(w, PICKUPS[w.axle].map(([x, y, z]) => [x*k, y*k + lift, z*k]), C.carbon)), materials.body)]}),
  // Body parts of the approved design (design units).
  'f1-nose': ({materials}) => ({space: 'design', parts: [meshOf('nose', [lofted(NOSE, .70, 2.02, 22, noseRing, stripe(.045))], materials.body)]}),
  'f1-front-wing': ({materials}) => {
    const pieces = [wing({span: 1.56, chord: .40, y: .085, leadingZ: 1.95, airfoil: [.06, .4, .12], angle: .04}, C.teal),
      wing({span: 1.40, chord: .20, y: .17, leadingZ: 1.62, airfoil: [.05, .4, .10], angle: .32}, C.orange)];
    for (const s of [-1, 1]) {
      pieces.push(plate({x: s*.79, zMin: 1.34, zMax: 1.96, yMin: .035, yMax: .30, radius: .06}, C.orange));
      pieces.push(plate({x: s*.08, zMin: 1.58, zMax: 1.78, yMin: .09, yMax: .27, thickness: .018, radius: .03}, C.carbon));// pylons under the nose
    }
    return {space: 'design', parts: [meshOf('front wing', pieces, materials.body)]};
  },
  'f1-pods': ({materials}) => {
    const right = lofted(POD, -.50, .50, 16, podRing, (x, y, z, u) => u < 0 || (u > .2 && u < .8) ? C.orange : C.teal);
    const intake = [paint(new T.CylinderGeometry(1, 1, .02, 24).scale(.165, 1, .25).rotateX(Math.PI/2).translate(.635, .48, .505), C.dark)];
    for (const y of [.38, .44, .50, .56]) intake.push(block([.635, y, .51], [.26, .014, .02], C.carbon));// intake slats
    return {space: 'design', parts: [meshOf('side pods', [right, ...intake, mirrorX(right), ...intake.map(mirrorX)], materials.body)]};
  },
  // A rear wing on struts that start at the wing mount (on the engine cover's posts).
  'f1-wing': ({kart, k, materials}) => {
    const box = placePart(kart, 'wing', 'f1-wing')[0], mount = kart.mounts.wing.at;
    const top = (box.centre[1] + box.size[1]/2)/k, back = (box.centre[2] - box.size[2]/2)/k, front = (box.centre[2] + box.size[2]/2)/k;
    const planes = [wing({span: 1.34, chord: .30, y: top - .29, leadingZ: front - .03, airfoil: [.07, .4, .12], angle: .1}, C.teal),
      wing({span: 1.34, chord: .16, y: top - .13, leadingZ: back + .2, airfoil: [.06, .4, .10], angle: .45}, C.teal)];
    for (const s of [-1, 1]) planes.push(plate({x: s*.68, zMin: back, zMax: front, yMin: top - .40, yMax: top, radius: .05}, C.orange));
    const struts = meshOf('rear wing struts', [-1, 1].map(s => tube([s*.09, mount[1], mount[2]], [s*.09, top - .27, front - .12], .018, C.carbon)), materials.body);
    struts.userData = {strut: true};
    return {space: 'design', parts: [meshOf('rear wing', planes, materials.body), struts]};
  },
});

/** Builds the whole F1 GoKart from its parts list. */
export function buildF1Kart(kart = F1_GOKART, setup = STOCK) {
  if (kart.mode !== 'f1') throw new Error('buildF1Kart needs an F1 kart');
  return assembleKart(kart, setup, F1_BUILDERS);
}
