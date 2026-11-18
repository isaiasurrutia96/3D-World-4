// Skeleton · section 5: hands.
//
// A hand shape is a few simple numbers, the same ones the approved hand uses
// (hand-lab/src/hand-rig.js):
//   index, middle, ring, little, thumb   how curled each finger is: 0 straight,
//                                        0.25 the approved rest curl, 1 fully curled
//   opposition                           the thumb swinging across the palm (0..1)
//   together                             the fingers closing toward the middle one (0..1)
// handPose(skeleton, side, shape) turns them into finger joint angles, so a
// hand shape is part of a normal pose: it blends, transitions and layers like
// every other joint. handShape(pose, side) reads them back.
import {Euler, Quaternion, Vector3} from 'three';
import {FINGERS, PALM_BONES, FINGER_RADII} from './bones.js';

export const DIGITS = ['index', 'middle', 'ring', 'little', 'thumb'];
const REST = .25;
/** The approved rest hand. */
export const HAND_REST = Object.freeze({index: REST, middle: REST, ring: REST, little: REST, thumb: REST, opposition: 0, together: 0});
/** A few shapes for tests and demos (the approved hand's own presets). */
export const HAND_SHAPES = {
 rest: {...HAND_REST},
 open: {...HAND_REST, index: 0, middle: 0, ring: 0, little: 0, thumb: 0},
 relax: {...HAND_REST, together: .6},
 curl: {...HAND_REST, index: 1, middle: 1, ring: 1, little: 1, thumb: .6, opposition: .35},
 point: {...HAND_REST, index: 0, middle: .9, ring: .9, little: .9, thumb: .45, opposition: .25},
};
const clamp01 = v => Math.min(1, Math.max(0, v));

/** The three joint angles (degrees) of a finger for a curl amount (exactly as the approved hand). */
export function curlAngles(digit, curl){
 const f = FINGERS[digit], c = clamp01(curl);
 return f.rest.map((a, j) => c <= REST ? a * c / REST : a + (f.closed[j] - a) * (c - REST) / (1 - REST));
}
/** The curl amount from a finger's first joint angle (the inverse of curlAngles). */
export function curlOf(digit, knuckle){
 const f = FINGERS[digit], a = f.rest[0], b = f.closed[0];
 return clamp01(knuckle <= a ? REST * knuckle / a : REST + (1 - REST) * (knuckle - a) / (b - a));
}

/** Finger joint angles for a hand shape (one side). Returns pose entries. */
export function handPose(skeleton, side, shape){
 const s = {...HAND_REST, ...shape}, out = {}, flip = a => side === 'R' ? {x: a.x, y: -a.y, z: -a.z} : a;
 for(const d of DIGITS){
  // The palm bone: the thumb swings across the palm; the others close together.
  const L = PALM_BONES[d].limits;
  out[`${d}0.${side}`] = flip(d === 'thumb' ? {x: 0, y: L.y[0] * clamp01(s.opposition), z: L.z[0] * clamp01(s.opposition)}
   : {x: 0, y: 0, z: (L.z[0] < 0 ? L.z[0] : L.z[1]) * clamp01(s.together)});
  const angles = curlAngles(d, s[d]);
  for(let j = 0; j < 3; j++) out[`${d}${j + 1}.${side}`] = {x: angles[j], y: 0, z: 0};
 }
 return out;
}

/** Read a hand shape back from a pose (missing fingers: the approved rest). */
export function handShape(skeleton, pose, side){
 const out = {...HAND_REST};
 for(const d of DIGITS){ const p = pose[`${d}1.${side}`]; if(p) out[d] = curlOf(d, p.x); }
 const t = pose[`thumb0.${side}`]; if(t) out.opposition = clamp01(Math.abs(t.z) / Math.abs(PALM_BONES.thumb.limits.z[0]));
 const m = pose[`index0.${side}`]; if(m) out.together = clamp01(Math.abs(m.z) / Math.abs(PALM_BONES.index.limits.z[0]));
 return out;
}

// ---- Gripping ----
//
// grip(skeleton, pose, side, shapes, {opposition, together, from, outer}) curls each
// finger (and the thumb) from its relaxed curl (from, default the rest curl)
// until it first touches one of the shapes, and
// stops there, so fingers wrap around what they hold and never pass into it.
// A finger that touches nothing closes fully. Shapes (avatar / world space):
//   {sphere: [x,y,z], radius}            a ball, a knee
//   {capsule: [[x,y,z],[x,y,z]], radius} a rod, a thigh, a steering-wheel rim piece
// Fingers are measured capsules (FINGER_RADII) along their bones. Returns the
// finger joint angles (pose entries) for that hand.

const RAD = Math.PI / 180;
/** Closest distance between segments p1–q1 and p2–q2. */
function segSeg(p1, q1, p2, q2){
 const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
 let s, t;
 if(a <= 1e-12 && e <= 1e-12) return p1.distanceTo(p2);
 if(a <= 1e-12){ s = 0; t = Math.min(1, Math.max(0, f / e)); }
 else { const c = d1.dot(r); if(e <= 1e-12){ t = 0; s = Math.min(1, Math.max(0, -c / a)); }
  else { const b = d1.dot(d2), den = a * e - b * b; s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t = (b * s + f) / e;
   if(t < 0){ t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if(t > 1){ t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); } } }
 return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, t));
}
/** How far a finger segment's surface is from a shape's surface (negative: inside). */
function gap(a, b, r, shape){
 if(shape.sphere){ const c = new Vector3(...shape.sphere); return segSeg(a, b, c, c) - r - shape.radius; }
 return segSeg(a, b, new Vector3(...shape.capsule[0]), new Vector3(...shape.capsule[1])) - r - shape.radius;
}

export function grip(skeleton, pose, side, shapes, {opposition = 0, together = 0, from = REST, outer = false} = {}){
 const B = n => skeleton.bones[skeleton.index.get(n)];
 const hand = skeleton.solve(pose).get('hand.' + side);
 const deltaQ = (b, a) => b.frameQ.clone().multiply(new Quaternion().setFromEuler(new Euler(a.x * RAD, a.y * RAD, a.z * RAD, b.order))).multiply(b.restInv).multiply(b.frameInv);
 const base = handPose(skeleton, side, {opposition, together});
 /** The finger's joints and tip (world) for a curl amount. */
 function chain(d, curl){
  const angles = curlAngles(d, curl), names = [0, 1, 2, 3].map(j => `${d}${j}.${side}`);
  let rot = hand.rotation.clone(), head = hand.head.clone(), parent = B('hand.' + side);
  const pts = [];
  names.forEach((n, j) => {
   const b = B(n), a = j === 0 ? base[n] : {x: angles[j - 1], y: 0, z: 0};
   head = new Vector3(...b.head).sub(new Vector3(...parent.head)).applyQuaternion(rot).add(head);
   rot = rot.clone().multiply(deltaQ(b, a));
   if(j > 0) pts.push(head.clone());
   if(j === 3) pts.push(new Vector3(...b.tail).sub(new Vector3(...b.head)).applyQuaternion(rot).add(head));
   parent = b;
  });
  return pts; // knuckle, middle joint, end joint, tip
 }
 const r0 = d => side === 'L' ? FINGER_RADII[d] : FINGER_RADII[d];
 // outer: only the two outer segments count (the palm rests on the surface, so the
 // segment by the knuckle lies along it whatever the fingers do).
 const touching = (d, curl) => { const p = chain(d, curl), r = r0(d); let m = Infinity; for(let j = outer ? 1 : 0; j < 3; j++) for(const s of shapes) m = Math.min(m, gap(p[j], p[j + 1], r[j], s)); return m <= 0; };
 const curls = {};
 for(const d of DIGITS){
  // Close step by step until the first touch, then find the touch exactly.
  // (Fingers start from their relaxed curl, `from`: a grip never straightens them past it.)
  let lo = from, hi = null;
  if(touching(d, from)){ curls[d] = from; continue; }
  for(let k = 1; k <= 24; k++){ const c = from + (1 - from) * k / 24; if(touching(d, c)){ hi = c; break; } lo = c; }
  if(hi === null){ curls[d] = 1; continue; }
  for(let k = 0; k < 14; k++){ const c = (lo + hi) / 2; if(touching(d, c)) hi = c; else lo = c; }
  curls[d] = lo;
 }
 return handPose(skeleton, side, {...curls, opposition, together});
}
