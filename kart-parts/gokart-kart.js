// The GoKart (small), built from the approved design (docs/karts/base-shapes.jpg,
// measured side/top views in docs/karts/blueprints/gokart-*.jpg): a red
// wedge nose with a white stripe, boxy side panels, a rear bumper block, an
// exposed silver tube frame with a tube front bumper, a navy bucket seat with
// a silver trim and five-spoke silver rims. Real karts have no suspension:
// stub axles and a solid rear axle, as here. Same methods as the F1 GoKart.
import * as T from 'three';
import {GOKART, STOCK, wheelsOf} from './spec.js';
import {superellipse, loft, tube, curvedTube, paint, mirrorX, stationCurve, range} from './shapes.js';
import {kartMaterials, meshOf, partGroup, modelSkeleton, addWheels, seat, steeringPoint, roundWheel, roundedBlock, RIMS} from './kart-model.js';

export const GOKART_COLORS = Object.freeze({red: '#e1342c', white: '#f4f4f2', silver: '#c3cad2', navy: '#22304a', dark: '#2a3038'});
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

/** Builds the whole GoKart (see kart-model.js for the layout). */
export function buildGoKart(kart = GOKART, setup = STOCK) {
  if (kart.mode !== 'gokart') throw new Error('buildGoKart needs a GoKart');
  const materials = kartMaterials(), k = kart.scale, lift = setup.rideHeight ?? 0;
  const {root, design, cockpit, wheels} = modelSkeleton(kart, setup);
  const y = kart.frameHeight;

  // Chassis (design units): perimeter tube frame, cross tubes, floor pan,
  // rear side bars, stub-axle carriers, and the rear axle bearings.
  const chassis = [];
  chassis.push(curvedTube([[-.52, y, -1.10], [-.56, y, -.30], [-.54, y, .55], [-.42, y, 1.22], [0, y, 1.38], [.42, y, 1.22], [.54, y, .55], [.56, y, -.30], [.52, y, -1.10], [0, y, -1.16]], .032, C.silver, true));
  for (const z of [-.95, -.30, .40, 1.0]) { const half = z > .9 ? .44 : .55; chassis.push(tube([-half, y, z], [half, y, z], .026, C.silver)); }
  for (const s of [-1, 1]) {
    chassis.push(tube([s*.52, y, -1.05], [s*.52, .49, -.86], .024, C.silver), tube([s*.52, .49, -.86], [s*.52, .49, -.58], .024, C.silver));
    chassis.push(tube([s*.52, .32, -1.08], [s*.52, .32, -.55], .024, C.silver));
  }
  chassis.push(roundedBlock([0, y - .02, -.1], [.86, .025, 1.7], .01, C.dark));// floor pan
  const front = wheelsOf(kart, setup).filter(w => w.axle === 'front');
  for (const w of front) {// kingpin carriers out to the front stub axles
    const s = Math.sign(w.at[0]), inner = (Math.abs(w.at[0]) - w.width/2)/k - .03;
    chassis.push(tube([s*.42, y, w.at[2]/k], [s*inner, w.radius/k, w.at[2]/k], .03, C.silver), roundedBlock([s*(inner + .015), w.radius/k, w.at[2]/k], [.05, .16, .07], .015, C.dark));
  }
  const chassisGroup = new T.Group(); chassisGroup.name = 'chassis'; chassisGroup.add(meshOf('chassis body', chassis, materials.body)); design.add(chassisGroup);

  // Rear axle (real metres): one solid axle between the rear wheels.
  const rear = wheelsOf(kart, setup).filter(w => w.axle === 'rear');
  const axleX = Math.abs(rear[0].at[0]) - rear[0].width*.4;
  root.add(meshOf('rear axle', [tube([-axleX, rear[0].radius, rear[0].at[2]], [axleX, rear[0].radius, rear[0].at[2]], .022, C.silver),
    ...[-1, 1].map(s => roundedBlock([s*.25, rear[0].radius + lift*0, rear[0].at[2]], [.06, .08, .08], .015, C.dark))], materials.body));

  // Cockpit (real metres): the design's tall navy bucket seat with a silver
  // trim, and a round three-spoke wheel within the driver's reach.
  const grip = steeringPoint(kart, .62, -.10);
  const parts = [...seat(kart, C.navy, C.silver), ...roundWheel(grip, .15, [0, (y + .06)*k, .62*k], '#16191e', C.silver)];
  cockpit.add(meshOf('seat and steering', parts, materials.body));

  addWheels(wheels, kart, setup, RIMS.gokart, materials);

  // Body parts of the approved design (design units).
  const nose = lofted(NOSE, .70, 1.97, 22, ringOf(3.4), (x, yy, z, u) => u >= 0 && Math.abs(u - .5) < .035 ? C.white : C.red);
  design.add(partGroup('nose', kart.design.nose, [meshOf('nose', [nose], materials.body)]));

  const bumper = curvedTube([[-.50, .205, 1.38], [-.48, .195, 1.70], [-.30, .185, 1.86], [0, .18, 1.89], [.30, .185, 1.86], [.48, .195, 1.70], [.50, .205, 1.38]], .026, C.silver);
  const bumperStruts = [-1, 1].map(s => tube([s*.40, .23, 1.37], [s*.50, .205, 1.40], .022, C.silver));// short brackets onto the frame's front loop
  design.add(partGroup('frontBumper', kart.design.frontBumper, [meshOf('front bumper', [bumper, ...bumperStruts], materials.body)]));

  const podRight = lofted(POD, -.53, .63, 18, ringOf(5), () => C.red);
  design.add(partGroup('sidePanels', kart.design.sidePanels, [meshOf('side panels', [podRight, mirrorX(podRight)], materials.body)]));

  design.add(partGroup('rearBumper', kart.design.rearBumper, [meshOf('rear bumper', [roundedBlock([0, .375, -1.18], [.86, .24, .30], .07, C.red, 3)], materials.body)]));

  root.userData.steering = grip;
  return root;
}
