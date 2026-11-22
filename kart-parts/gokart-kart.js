// The GoKart (small), built from the approved design (docs/karts/base-shapes.jpg,
// measured side/top views in docs/karts/blueprints/gokart-*.jpg): a red
// wedge nose with a white stripe, boxy side panels, a rear bumper block, an
// exposed silver tube frame with a tube front bumper, a navy bucket seat with
// a silver trim and five-spoke silver rims. Real karts have no suspension:
// stub axles and a solid rear axle, as here. Same methods as the F1 GoKart.
//
// Every part is its own builder below (one per style id in the kart's parts
// list in spec.js); assembleKart puts them together.
import {GOKART, STOCK} from './spec.js';
import {superellipse, loft, tube, curvedTube, mirrorX, stationCurve, range} from './shapes.js';
import {assembleKart, meshOf, seat, roundWheel, roundedBlock, wheelSet, RIMS} from './kart-model.js';

export const GOKART_COLORS = Object.freeze({red: '#e1342c', white: '#f4f4f2', silver: '#c3cad2', navy: '#22304a', dark: '#2a3038', tire: '#16191e'});
const C = GOKART_COLORS;
const lofted = (curve, from, to, steps, ring, color) => loft(range(from, to, steps).map(z => ({z, ring: ring(curve(z))})), color);
const ringOf = exponent => s => superellipse({cx: s.cx ?? 0, cy: (s.bottom + s.top)/2, halfWidth: s.w, halfHeight: (s.top - s.bottom)/2, exponent, count: 36});

// Nose (design units), measured from the side and top views: a flat-topped
// wedge that tapers into a rounded tip.
const NOSE = stationCurve([
  {z: .70,  w: .40, bottom: .26, top: .66},
  {z: 1.05, w: .41, bottom: .25, top: .67},
  {z: 1.45, w: .36, bottom: .24, top: .56},
  {z: 1.75, w: .27, bottom: .24, top: .45},
  {z: 1.97, w: .11, bottom: .27, top: .36},
]);
// Side panels (right side), rounded boxes beside the seat.
const POD = stationCurve([
  {z: -.53, cx: .555, w: .125, bottom: .20, top: .51},
  {z: -.44, cx: .555, w: .155, bottom: .165, top: .565},
  {z: .50,  cx: .555, w: .155, bottom: .165, top: .565},
  {z: .63,  cx: .555, w: .135, bottom: .20, top: .50},
]);

/** The GoKart's parts, by style id. Each returns where it belongs and its pieces. */
export const GOKART_BUILDERS = Object.freeze({
  // Perimeter tube frame, cross tubes, rear side bars and the kingpin carriers
  // out to the front stub axles (kept at hub height even when raised).
  'gokart-frame': ({kart, k, lift, wheels, materials}) => {
    const y = kart.frameHeight, tubes = [];
    tubes.push(curvedTube([[-.52, y, -1.10], [-.56, y, -.30], [-.54, y, .55], [-.42, y, 1.22], [0, y, 1.38], [.42, y, 1.22], [.54, y, .55], [.56, y, -.30], [.52, y, -1.10], [0, y, -1.16]], .032, C.silver, true));
    for (const z of [-.95, -.30, .40, 1.0]) { const half = z > .9 ? .44 : .55; tubes.push(tube([-half, y, z], [half, y, z], .026, C.silver)); }
    for (const s of [-1, 1]) {
      tubes.push(tube([s*.52, y, -1.05], [s*.52, .49, -.86], .024, C.silver), tube([s*.52, .49, -.86], [s*.52, .49, -.58], .024, C.silver));
      tubes.push(tube([s*.52, .32, -1.08], [s*.52, .32, -.55], .024, C.silver));
    }
    for (const w of wheels.filter(w => w.axle === 'front')) {
      const s = Math.sign(w.at[0]), inner = (Math.abs(w.at[0]) - w.width/2)/k - .03, hubY = (w.radius - lift)/k;
      tubes.push(tube([s*.42, y, w.at[2]/k], [s*inner, hubY, w.at[2]/k], .03, C.silver), roundedBlock([s*(inner + .015), hubY, w.at[2]/k], [.05, .16, .07], .015, C.dark));
    }
    return {space: 'design', parts: [meshOf('frame', tubes, materials.body)]};
  },
  'gokart-floor': ({kart, materials}) => ({space: 'design', parts: [meshOf('floor', [roundedBlock([0, kart.frameHeight - .02, -.1], [.86, .025, 1.7], .01, C.dark)], materials.body)]}),
  // One solid rear axle between the rear wheels, with bearing hangers that
  // reach the frame at any ride height.
  'gokart-axles': ({kart, k, lift, wheels, materials}) => {
    const rear = wheels.filter(w => w.axle === 'rear'), hub = rear[0].radius, z = rear[0].at[2], frameY = kart.frameHeight*k + lift;
    const x = Math.abs(rear[0].at[0]) - rear[0].width*.4, pieces = [tube([-x, hub, z], [x, hub, z], .022, C.silver)];
    for (const s of [-1, 1]) pieces.push(roundedBlock([s*.25, hub, z], [.06, .08, .08], .015, C.dark), tube([s*.25, hub, z], [s*.25, frameY, z - .001], .018, C.silver));
    return {space: 'ground', parts: [meshOf('rear axle', pieces, materials.body)]};
  },
  // The design's tall navy bucket seat with a silver trim.
  'gokart-seat': ({kart, materials}) => ({space: 'cockpit', parts: [meshOf('seat', seat(kart, C.navy, C.silver), materials.body)]}),
  // A round three-spoke wheel within the driver's reach.
  'gokart-steering': ({kart, k, grip, materials}) => ({space: 'cockpit',
    parts: [meshOf('steering wheel', roundWheel(grip, .15, [0, (kart.frameHeight + .06)*k, .62*k], C.tire, C.silver), materials.body)]}),
  'gokart-wheels': ctx => ({space: 'ground', parts: [wheelSet(ctx, RIMS.gokart)]}),
  // Body parts of the approved design (design units).
  'gokart-nose': ({materials}) => ({space: 'design',
    parts: [meshOf('nose', [lofted(NOSE, .70, 1.97, 22, ringOf(3.4), (x, y, z, u) => u >= 0 && Math.abs(u - .5) < .035 ? C.white : C.red)], materials.body)]}),
  'tube-bumper': ({materials}) => {
    const bumper = curvedTube([[-.50, .205, 1.38], [-.48, .195, 1.70], [-.30, .185, 1.86], [0, .18, 1.89], [.30, .185, 1.86], [.48, .195, 1.70], [.50, .205, 1.38]], .026, C.silver);
    const brackets = [-1, 1].map(s => tube([s*.40, .23, 1.37], [s*.50, .205, 1.40], .022, C.silver));// short brackets onto the frame's front loop
    return {space: 'design', parts: [meshOf('front bumper', [bumper, ...brackets], materials.body)]};
  },
  'gokart-pods': ({materials}) => {
    const right = lofted(POD, -.53, .63, 18, ringOf(5), () => C.red);
    return {space: 'design', parts: [meshOf('side panels', [right, mirrorX(right)], materials.body)]};
  },
  'gokart-rear': ({materials}) => ({space: 'design', parts: [meshOf('rear bumper', [roundedBlock([0, .375, -1.18], [.86, .24, .30], .07, C.red, 3)], materials.body)]}),
});

/** Builds the whole GoKart from its parts list. */
export function buildGoKart(kart = GOKART, setup = STOCK) {
  if (kart.mode !== 'gokart') throw new Error('buildGoKart needs a GoKart');
  return assembleKart(kart, setup, GOKART_BUILDERS);
}
