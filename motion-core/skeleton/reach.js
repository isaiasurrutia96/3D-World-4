// Skeleton · section 4: reaching.
//
// Tell a hand or a foot where to go, and the arm or leg bends to get it
// there. This is what lets feet land exactly on the ground (flat floor,
// steps, slopes) without sliding or sinking, and hands grab things.
//
//   reach(skeleton, pose, goals, options) → {pose, error}
//
//   goals: { 'hand.L': {position:[x,y,z], pole?}, 'foot.R': {sole:[x,y,z], pole?, flat?}, ... }
//     position  where the wrist / ankle joint should be (avatar or world space,
//               whatever space pose.root uses; with no root, avatar space)
//     sole      for a foot: the point on the ground under the ankle; the foot
//               is then set flat on the ground there
//     pole      which way the elbow / knee should point (a direction);
//               default: knees forward, elbows back and slightly out
//     flat      for a foot: keep it flat on the ground (default true with sole)
//     heading   for a foot: which way it faces (degrees about the vertical; default:
//               the way the body faces). Planted feet keep their own heading.
//   options.follow  let the shoulders follow the arms (shoulder.js) while reaching
//
// How it works (the standard "two-bone" method, solved exactly, no guessing
// loops):
//   1. Bend the elbow / knee just enough that shoulder-to-wrist (hip-to-ankle)
//      is the right distance. This is an exact formula for a hinge.
//   2. Turn the whole limb at the shoulder / hip so it points at the target.
//   3. Spin the limb around that line so the elbow / knee points the chosen
//      way (the "pole").
//   4. Turn those world turns into this skeleton's joint angles and keep
//      every joint inside its limits. If a target is out of reach, the limb
//      stretches toward it as far as its limits allow (error says how far
//      short it is).
//   5. Feet: tilt the ankle so the sole lies flat.
// Everything is computed from the pose alone (no memory between frames), so
// a smoothly moving target gives a smoothly moving limb at any frame rate.
import {Euler, Quaternion, Vector3} from 'three';
import {shoulderFollow} from './shoulder.js';

const RAD = Math.PI / 180, X = new Vector3(1, 0, 0);
const LIMBS = {hand: ['upperArm', 'lowerArm', 'hand'], foot: ['thigh', 'shin', 'foot']};

/** Wrap an angle in degrees to (-180, 180]. */
const wrap = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a === -180 ? 180 : a; };

/** A bone's change from rest for joint angles a: R(a) · R(rest)⁻¹ (all body-frame bones). */
function deltaOf(bone, a, out = new Quaternion()){
 return out.setFromEuler(new Euler(a.x * RAD, a.y * RAD, a.z * RAD, bone.order)).multiply(bone.restInv);
}

/**
 * Joint angles for a wanted change from rest (body-frame bone), inside the
 * limits. Every turn has two angle triples; pick the one that fits the
 * limits best (closest to `near` if both fit), then clamp.
 */
function anglesFor(bone, delta, near){
 const q = delta.clone().multiply(bone.restQ), e = new Euler().setFromQuaternion(q, bone.order);
 const o = bone.order.toLowerCase(), one = {x: e.x / RAD, y: e.y / RAD, z: e.z / RAD};
 const two = {...one}; two[o[0]] = wrap(one[o[0]] + 180); two[o[1]] = wrap(180 - one[o[1]]); two[o[2]] = wrap(one[o[2]] + 180);
 const L = bone.limits, over = a => ['x', 'y', 'z'].reduce((s, k) => s + Math.max(0, L[k][0] - a[k], a[k] - L[k][1]), 0);
 const dist = a => near ? ['x', 'y', 'z'].reduce((s, k) => s + Math.abs(wrap(a[k] - near[k])), 0) : 0;
 const pick = over(one) < over(two) - 1e-9 || (Math.abs(over(one) - over(two)) <= 1e-9 && dist(one) <= dist(two)) ? one : two;
 return Object.fromEntries(['x', 'y', 'z'].map(k => [k, Math.min(L[k][1], Math.max(L[k][0], pick[k]))]));
}

/**
 * Default pole (which way the elbow / knee points), in the body's own space:
 * knees forward; elbows down, a little back and out. A second choice is used,
 * blended in smoothly, when the hand or foot is straight along the first one
 * (e.g. reaching straight down), so the elbow never spins.
 */
function poles(kind, side){
 const s = side === 'L' ? 1 : -1;
 return kind === 'foot' ? [new Vector3(0, 0, 1), new Vector3(0, -1, 0)]
  : [new Vector3(.35 * s, -1, -.35).normalize(), new Vector3(.5 * s, 0, -1).normalize()];
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** The part of v square to the unit axis t. */
const across = (v, t) => v.clone().sub(t.clone().multiplyScalar(v.dot(t)));

/** Solve one limb. Returns the new angles for its three bones. */
function solveLimb(skeleton, pose, solved, kind, side, goal){
 const [uName, mName, eName] = LIMBS[kind].map(n => `${n}.${side}`);
 const B = n => skeleton.bones[skeleton.index.get(n)], U = B(uName), Mb = B(mName), E = B(eName);
 const cur = n => ({...B(n).rest, ...(pose[n] ?? {})});
 const S0 = new Vector3(...U.head), E0 = new Vector3(...Mb.head), H0 = new Vector3(...E.head);
 const P = solved.get(U.parent).rotation, Sw = solved.get(uName).head;
 // Body turn (for poles and flat feet): the pelvis's world turn.
 const bodyQ = solved.get('pelvis').rotation, bodyYaw = new Euler().setFromQuaternion(bodyQ, 'YXZ').y;
 const target = new Vector3(...(goal.position ?? goal.sole));
 if(!goal.position) target.y += H0.y; // sole → ankle height above the ground (foot flat)
 // Feet face a heading (world turn about the vertical, degrees; default: where the body faces).
 const heading = goal.heading !== undefined ? goal.heading * RAD : bodyYaw, headingQ = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), heading);

 // 1. Hinge: bend so |shoulder → wrist| = distance to the target. In rest space the
 //    hinge turns the lower bone about X through the elbow/knee; the lower bone's own
 //    twist (forearm roll) is kept: H(t) = E0 + Rx(t)·G·(H0 − E0).
 const m = cur(mName), rx = Mb.rest.x * RAD;
 const G = new Quaternion().setFromAxisAngle(X, rx).multiply(new Quaternion().setFromEuler(new Euler(0, m.y * RAD, m.z * RAD, 'XYZ'))).multiply(new Quaternion().setFromAxisAngle(X, -rx));
 const p = H0.clone().sub(E0).applyQuaternion(G), s = S0.clone().sub(E0);
 const pPar = X.clone().multiplyScalar(p.dot(X)), pPerp = p.clone().sub(pPar), q = X.clone().cross(pPerp);
 const A0 = s.clone().sub(pPar).lengthSq() + pPerp.lengthSq(), a = 2 * s.dot(pPerp), b = 2 * s.dot(q), R = Math.hypot(a, b);
 const d = target.distanceTo(Sw), base = Math.atan2(b, a);
 const lim = Mb.limits.x, tOf = ax => (ax - Mb.rest.x) * RAD, dOf = t => Math.sqrt(Math.max(0, A0 - a * Math.cos(t) - b * Math.sin(t)));
 const hinges = [], c = (A0 - d * d) / R;
 if(Math.abs(c) <= 1) for(const sgn of [1, -1]){ const ax = Mb.rest.x + wrap((base + sgn * Math.acos(c)) / RAD); if(ax >= lim[0] - 1e-9 && ax <= lim[1] + 1e-9) hinges.push(Math.min(lim[1], Math.max(lim[0], ax))); }
 if(!hinges.length){ // Out of reach within the limits: the limit that comes closest.
  hinges.push([lim[0], lim[1]].reduce((best, ax) => Math.abs(dOf(tOf(ax)) - d) < Math.abs(dOf(tOf(best)) - d) ? ax : best));
 }

 // 2–3. For a hinge angle and a spin about the shoulder→target line: the upper
 // joint's angles (inside limits) and how far the wrist/ankle lands from the target.
 const want = target.clone().sub(Sw); if(want.lengthSq() < 1e-12) want.set(0, -1e-6, 0);
 const tHat = want.clone().normalize();
 const [pole1, pole2] = goal.pole ? [new Vector3(...goal.pole).normalize(), poles(kind, side)[1].applyQuaternion(bodyQ)]
  : poles(kind, side).map(v => v.applyQuaternion(kind === 'foot' ? headingQ : bodyQ));
 // Which way the elbow/knee should face across the line (blending to the second pole near the line).
 const p1 = across(pole1, tHat), p2 = across(pole2, tHat), w = smooth(.15, .45, p1.length());
 const poleDir = p1.normalize().multiplyScalar(w).add(p2.normalize().multiplyScalar(1 - w));
 const elbowOf = new Vector3(), tmp = new Quaternion(), d2 = new Quaternion();
 function attempt(hingeX, extraSpin){
  const H = p.clone().applyAxisAngle(X, tOf(hingeX)).add(E0), r0 = H.clone().sub(S0);
  const point = new Quaternion().setFromUnitVectors(r0.normalize(), tHat);
  const e1 = across(elbowOf.copy(E0).sub(S0).applyQuaternion(point), tHat);
  let spin = extraSpin;
  if(e1.lengthSq() > 1e-12 && poleDir.lengthSq() > 1e-12) spin += Math.atan2(e1.clone().cross(poleDir).dot(tHat), e1.dot(poleDir));
  const W1 = new Quaternion().setFromAxisAngle(tHat, spin).multiply(point);
  const upper = anglesFor(U, P.clone().invert().multiply(W1), cur(uName)), mid = {x: hingeX, y: m.y, z: m.z};
  // Where the wrist/ankle really lands with the (limited) angles.
  const W1a = tmp.copy(P).multiply(deltaOf(U, upper)), elbowW = E0.clone().sub(S0).applyQuaternion(W1a).add(Sw);
  const W2a = W1a.clone().multiply(deltaOf(Mb, mid, d2)), wrist = H0.clone().sub(E0).applyQuaternion(W2a).add(elbowW);
  return {upper, mid, W2a, err: wrist.distanceTo(target), spin: extraSpin};
 }
 // Try each hinge solution with the elbow/knee facing the pole; if a joint limit gets
 // in the way, look around the line for the nearest spin that still lands.
 let best = null;
 for(const hx of hinges){ const r = attempt(hx, 0); if(!best || r.err < best.err - 1e-9) best = r; }
 if(best.err > 1e-4){
  for(const hx of hinges) for(let k = -17; k <= 18; k++){ const r = attempt(hx, k * 10 * RAD); if(r.err < best.err - 1e-9 || (Math.abs(r.err - best.err) <= 1e-9 && Math.abs(r.spin) < Math.abs(best.spin))) best = r; }
  if(best.err < 1e-5){
   // It lands with some spin: find the smallest spin that still lands (the elbow/knee
   // swings only as far as the limit needs, so the motion stays continuous).
   let lo = 0, hi = best.spin;
   for(let k = 0; k < 24; k++){ const mid = (lo + hi) / 2; if(attempt(best.mid.x, mid).err < 1e-5) hi = mid; else lo = mid; }
   best = attempt(best.mid.x, hi);
  } else {
   // Out of reach even so: refine around the closest spin.
   for(let step = 5 * RAD; step > .01 * RAD; step /= 2){
    for(const dSpin of [-step, step]){ const r = attempt(best.mid.x, best.spin + dSpin); if(r.err < best.err - 1e-12) best = r; }
   }
  }
 }
 let end = cur(eName);
 // 5. Feet flat, facing their heading: the ankle undoes the leg's turn. The ankle
 //    cannot twist, so the leg's spin is fine-tuned until the twist the ankle would
 //    need is zero (the foot decides exactly where the knee points).
 if(kind === 'foot' && (goal.flat ?? !!goal.sole)){
  const twistNeeded = r => new Euler().setFromQuaternion(r.W2a.clone().invert().multiply(headingQ).multiply(E.restQ), E.order).y;
  let s0 = best.spin, f0 = twistNeeded(best), s1 = s0 + .01, f1 = twistNeeded(attempt(best.mid.x, s1));
  for(let k = 0; k < 12 && Math.abs(f1) > 1e-10 && Math.abs(f1 - f0) > 1e-14; k++){
   const s2 = s1 - f1 * (s1 - s0) / (f1 - f0); s0 = s1; f0 = f1; s1 = s2; f1 = twistNeeded(attempt(best.mid.x, s1));
  }
  const tuned = attempt(best.mid.x, s1);
  if(tuned.err <= best.err + 1e-6 && Math.abs(f1) < Math.abs(twistNeeded(best))) best = tuned;
  end = anglesFor(E, best.W2a.clone().invert().multiply(headingQ), end);
 }
 return {[uName]: best.upper, [mName]: best.mid, [eName]: end};
}

/** Reach every goal; see the top of this file. */
export function reach(skeleton, pose, goals, {follow = false, passes = 3} = {}){
 let out = {...pose};
 const rounds = follow ? passes : 1;
 for(let r = 0; r < rounds; r++){
  // The follow is worked out afresh from the pose's own collarbones each pass (never piled up).
  if(follow) out = shoulderFollow(skeleton, {...out, 'clavicle.L': pose['clavicle.L'], 'clavicle.R': pose['clavicle.R']});
  const solved = skeleton.solve(out);
  for(const [name, goal] of Object.entries(goals)){
   const [kind, side] = name.split('.');
   if(!LIMBS[kind]) throw Error('Can only reach with hand.L/R or foot.L/R, not ' + name);
   Object.assign(out, solveLimb(skeleton, out, solved, kind, side, goal));
  }
 }
 // How far each goal is from being reached (metres).
 const solved = skeleton.solve(out), error = {};
 for(const [name, goal] of Object.entries(goals)){
  const at = solved.get(name).head, t = new Vector3(...(goal.position ?? goal.sole));
  if(!goal.position) t.y += skeleton.bones[skeleton.index.get(name)].head[1];
  error[name] = at.distanceTo(t);
 }
 return {pose: out, error};
}
