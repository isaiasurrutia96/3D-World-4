// The GT GoKart (medium), built from the approved design (docs/karts/base-shapes.jpg,
// measured side/top views in docs/karts/blueprints/gt-*.jpg): compact and
// wide, yellow and black, a sloping hood and nose, a front bumper with
// intakes, wheel arches over every wheel with the rims still visible, side
// skirts with yellow inserts, a roll bar over the driver's head and a rear
// wing on struts. Same methods as the F1 GoKart.
//
// Every part is its own builder below (one per style id in the kart's parts
// list in spec.js); assembleKart puts them together.
import * as T from 'three';
import {GT_GOKART, STOCK, placePart} from './spec.js';
import {superellipse, loft, wing, plate, tube, curvedTube, paint, mirrorX, stationCurve, range} from './shapes.js';
import {assembleKart, meshOf, wishbones, seat, roundWheel, roundedBlock, wheelSet, RIMS} from './kart-model.js';

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

/** The GT GoKart's parts, by style id. Each returns where it belongs and its pieces. */
export const GT_BUILDERS = Object.freeze({
  // Body tub with the cockpit opened in it, and the cockpit rim.
  'gt-tub': ({materials}) => ({space: 'design', parts: [meshOf('body tub', [
    lofted(TUB, -1.30, 1.22, 40, tubRing,
      (x, y, z, u) => y < FLOOR + .03 && Math.abs(x) < .5 && z > -.36 && z < .32 ? C.dark : u >= 0 && (u < .2 || u > .8) ? C.black : band(.06)(x, y, z, u)),
    curvedTube([[-.51, .85, -.32], [-.51, .835, 0], [-.48, .82, .30], [0, .84, .38], [.48, .82, .30], [.51, .835, 0], [.51, .85, -.32], [0, .86, -.40]], .03, C.black, true)], materials.body)]}),
  'gt-floor': ({materials}) => ({space: 'design', parts: [meshOf('floor', [roundedBlock([0, .07, -.25], [1.0, .03, 2.0], .01, C.dark)], materials.body)]}),
  // Just above and behind the driver's head, whatever the seat's tuning.
  'gt-roll-bar': ({head, materials}) => {
    const z = Math.min(-.52, head.back - .06), top = Math.max(1.56, head.top + .06);
    return {space: 'design', parts: [meshOf('roll bar', [curvedTube([[-.32, .84, z + .03], [-.30, top - .22, z], [0, top, z - .02], [.30, top - .22, z], [.32, .84, z + .03]], .045, C.black)], materials.body)]};
  },
  'gt-seat': ({kart, materials}) => ({space: 'cockpit', parts: [meshOf('seat', seat(kart, C.black), materials.body)]}),
  'gt-steering': ({k, grip, materials}) => ({space: 'cockpit', parts: [meshOf('steering wheel', roundWheel(grip, .15, [0, .80*k, .75*k], C.black, C.grey, 2), materials.body)]}),
  'gt-wheels': ctx => ({space: 'ground', parts: [wheelSet(ctx, RIMS.gt)]}),
  // Mostly hidden double wishbones, from the body to each upright.
  'gt-wishbones': ({k, lift, wheels, materials}) => {
    const arms = wheels.flatMap(w => {
      const z = w.at[2]/k, toe = w.axle === 'front' ? .10 : -.10;
      return wishbones(w, [[.40, .52, z - .14], [.40, .52, z + .14], [.40, .22, z - .16], [.40, .22, z + .16], [.38, .60, z - .06], [.40, .30, z + toe]]
        .map(([px, py, pz]) => [px*k, py*k + lift, pz*k]), C.grey);
    });
    return {space: 'ground', parts: [meshOf('suspension', arms, materials.body)]};
  },
  // Body parts of the approved design (design units).
  'gt-hood': ({materials}) => ({space: 'design', parts: [meshOf('hood', [lofted(HOOD, .66, 1.34, 14, ring(4), band(.07))], materials.body)]}),
  'gt-nose': ({materials}) => ({space: 'design', parts: [meshOf('nose', [lofted(NOSE, 1.20, 1.70, 10, ring(3.6), band(.07))], materials.body)]}),
  'gt-front-bumper': ({materials}) => {
    const pieces = [lofted(BUMPER, 1.44, 1.80, 8, ring(4.5), () => C.black)];
    for (const s of [-1, 1]) pieces.push(roundedBlock([s*.42, .24, 1.785], [.32, .10, .03], .012, C.yellow));// intakes
    pieces.push(roundedBlock([0, .22, 1.79], [.30, .12, .02], .01, C.dark));// grille
    return {space: 'design', parts: [meshOf('front bumper', pieces, materials.body)]};
  },
  'gt-skirts': ({materials}) => {
    const right = [roundedBlock([.685, .285, .015], [.18, .44, .73], .05, C.black), roundedBlock([.77, .30, .015], [.02, .10, .50], .01, C.yellow)];
    return {space: 'design', parts: [meshOf('side skirts', [...right, ...right.map(mirrorX)], materials.body)]};
  },
  'gt-rear': ({materials}) => ({space: 'design', parts: [meshOf('rear bumper',
    [roundedBlock([0, .28, -1.22], [1.16, .34, .22], .06, C.black), roundedBlock([0, .36, -1.33], [.72, .05, .02], .01, C.yellow)], materials.body)]}),
  // One arch over each wheel; arches follow their wheels when they move out.
  'arch': ({k, wheels, materials}) => ({space: 'design',
    parts: [meshOf('wheel arches', wheels.flatMap(w => arch(w.at[0]/k, w.radius/k, w.at[2]/k, w.radius/k + .03, w.radius/k + .09, .40, C.black)), materials.body)]}),
  // A rear wing on struts that start at the wing mount.
  'gt-wing': ({kart, k, materials}) => {
    const box = placePart(kart, 'wing', 'gt-wing')[0], mount = kart.mounts.wing.at;
    const top = (box.centre[1] + box.size[1]/2)/k, back = (box.centre[2] - box.size[2]/2)/k, front = (box.centre[2] + box.size[2]/2)/k;
    const planes = [wing({span: 1.18, chord: .30, y: top - .10, leadingZ: front - .03, airfoil: [.06, .4, .12], angle: .08}, C.black)];
    for (const s of [-1, 1]) planes.push(plate({x: s*.62, zMin: back + .01, zMax: front - .01, yMin: top - .28, yMax: top - .01, radius: .05}, C.yellow));
    const struts = meshOf('rear wing struts', [-1, 1].map(s => tube([s*.2, mount[1], mount[2]], [s*.2, top - .16, front - .1], .022, C.black)), materials.body);
    struts.userData = {strut: true};
    return {space: 'design', parts: [meshOf('rear wing', planes, materials.body), struts]};
  },
});

/** Builds the whole GT GoKart from its parts list. */
export function buildGTKart(kart = GT_GOKART, setup = STOCK) {
  if (kart.mode !== 'gt') throw new Error('buildGTKart needs a GT GoKart');
  return assembleKart(kart, setup, GT_BUILDERS);
}
