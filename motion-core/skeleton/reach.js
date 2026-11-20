// Skeleton · section 4: reaching.
//
// Tell a hand or a foot where to go, and the arm or leg bends to get it
// there. This is what lets feet land exactly on the ground (flat floor,
// steps, slopes) without sliding or sinking, and hands grab things.
//
//   reach(skeleton, pose, goals, options) → {pose, error, facing, pointing, tilt}
//     tilt: for a foot, how many degrees its real angle is from the angle asked for
//     (heading, pitch, roll) — more than 0 when the ankle's own limit holds it back
//
//   goals: { 'hand.L': {position:[x,y,z], pole?}, 'foot.R': {sole:[x,y,z], pole?, flat?}, ... }
//     position  where the wrist / ankle joint should be (avatar or world space,
//               whatever space pose.root uses; with no root, avatar space)
//     sole      for a foot: the point on the ground under the ankle; the foot
//               is then set flat on the ground there
//     pole      which way the elbow / knee should point (a direction);
//               default: knees forward, elbows back and slightly out
//     palm      for a hand: where the palm centre should be (instead of the wrist);
//               face: which way the palm should face (a direction);
//               fingers: which way the fingers should point (along the palm)
//     grip      for a hand: {shapes, opposition, together}: the fingers curl around
//               the shapes until they touch them (hands.js)
//     touch     for a hand: the centre of a ball to touch, with radius: the palm
//               centre lands on its surface, facing its centre
//     flat      for a foot: keep it flat on the ground (default true with sole); a
//               number 0..1 mixes flat with the ankle's own angle (relaxed in the air)
//     heading   for a foot: which way it faces (degrees about the vertical; default:
//               the way the body faces). Planted feet keep their own heading.
//     pitch     for a foot: tilt its toes down (degrees, negative: up) from flat, about
//               its own sideways axis; roll: tilt it about its own forward axis.
//               A swinging foot hangs toes-down instead of being forced flat.
//   options.follow  let the shoulders follow the arms (shoulder.js) while reaching
//   options.clavicles  the pose's own collarbones (if the pose already includes a follow)
//   options.continuing the pose's limbs are last frame's answer: carry on smoothly from
//                      it (never jump to a different answer)
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
import {grip} from './hands.js';

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
/**
 * Ease into a limit instead of hitting it: inside [lo + m, hi − m] nothing
 * changes; closer to a limit the angle approaches it smoothly (never past it),
 * so a joint arriving at its limit slows down instead of stopping dead.
 */
function softClamp(v, lo, hi, m){
 // tanh: same angle, speed and acceleration where it joins, so the ease-in has no corner.
 if(v > hi - m) return hi - m + m * Math.tanh((v - (hi - m)) / m);
 if(v < lo + m) return lo + m + m * Math.tanh((v - (lo + m)) / m);
 return v;
}
/** Margin (degrees) for joints that should ease into their limits (the ankle keeping the foot flat). */
const SOFT = 8;

function anglesFor(bone, delta, near, soft = 0){
 const q = delta.clone().multiply(bone.restQ), e = new Euler().setFromQuaternion(q, bone.order);
 const o = bone.order.toLowerCase(), one = {x: e.x / RAD, y: e.y / RAD, z: e.z / RAD};
 const two = {...one}; two[o[0]] = wrap(one[o[0]] + 180); two[o[1]] = wrap(180 - one[o[1]]); two[o[2]] = wrap(one[o[2]] + 180);
 const L = bone.limits, over = a => ['x', 'y', 'z'].reduce((s, k) => s + Math.max(0, L[k][0] - a[k], a[k] - L[k][1]), 0);
 const dist = a => near ? ['x', 'y', 'z'].reduce((s, k) => s + Math.abs(wrap(a[k] - near[k])), 0) : 0;
 const pick = over(one) < over(two) - 1e-9 || (Math.abs(over(one) - over(two)) <= 1e-9 && dist(one) <= dist(two)) ? one : two;
 return Object.fromEntries(['x', 'y', 'z'].map(k => [k, soft && L[k][1] - L[k][0] > 2 * soft ? softClamp(pick[k], L[k][0], L[k][1], soft) : Math.min(L[k][1], Math.max(L[k][0], pick[k]))]));
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
function solveLimb(skeleton, pose, solved, kind, side, goal, endRest = null, targetOverride = null, spinOffset = null, own = pose, kit = null){
 // kit: when the same limb is solved many times in a row toward the same target (the
 // palm solver), everything that does not change between tries is worked out once.
 if(!kit || !kit.ready){
  const k = kit ?? {};
  const [uName, mName, eName] = LIMBS[kind].map(n => `${n}.${side}`);
  const B = n => skeleton.bones[skeleton.index.get(n)];
  Object.assign(k, {uName, mName, eName, U: B(uName), Mb: B(mName), E: B(eName)});
  k.S0 = new Vector3(...k.U.head); k.E0 = new Vector3(...k.Mb.head); k.H0 = new Vector3(...k.E.head);
  k.P = solved.get(k.U.parent).rotation; k.Pinv = k.P.clone().invert(); k.Sw = solved.get(uName).head;
  // Body turn (for poles and flat feet): the pelvis's world turn.
  k.bodyQ = solved.get('pelvis').rotation; k.bodyYaw = new Euler().setFromQuaternion(k.bodyQ, 'YXZ').y;
  k.target = targetOverride ? targetOverride.clone() : new Vector3(...(goal.position ?? goal.sole));
  if(!targetOverride && !goal.position) k.target.y += k.H0.y; // sole → ankle height above the ground (foot flat)
  // Feet face a heading (world turn about the vertical, degrees; default: where the body faces).
  k.heading = goal.heading !== undefined ? goal.heading * RAD : k.bodyYaw; k.headingQ = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), k.heading);
  // The foot's own turn: heading, then toes down (pitch) about its sideways axis, then roll about its forward axis.
  k.footQ = k.headingQ.clone();
  if(goal.pitch) k.footQ.multiply(new Quaternion().setFromAxisAngle(X, goal.pitch * RAD));
  if(goal.roll) k.footQ.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), goal.roll * RAD));
  k.ready = !!kit;
  kit = k;
 }
 const {uName, mName, eName, U, Mb, E, S0, E0, H0, P, Pinv, Sw, bodyQ, headingQ, footQ, target} = kit;
 const B = n => skeleton.bones[skeleton.index.get(n)];
 const cur = n => ({...B(n).rest, ...(pose[n] ?? {})});
 // The point of the limb that must land (wrist / ankle, or the palm centre for palm goals).
 const END = endRest ?? H0;

 // 1. Hinge: bend so |shoulder → wrist| = distance to the target. In rest space the
 //    hinge turns the lower bone about X through the elbow/knee; the lower bone's own
 //    twist (forearm roll) is kept: H(t) = E0 + Rx(t)·G·(H0 − E0).
 const m = cur(mName), rx = Mb.rest.x * RAD;
 const G = new Quaternion().setFromAxisAngle(X, rx).multiply(new Quaternion().setFromEuler(new Euler(0, m.y * RAD, m.z * RAD, 'XYZ'))).multiply(new Quaternion().setFromAxisAngle(X, -rx));
 const p = END.clone().sub(E0).applyQuaternion(G), s = S0.clone().sub(E0);
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
 if(!kit.tHat || kit.poleKey !== goal.pole){
  const want = target.clone().sub(Sw); if(want.lengthSq() < 1e-12) want.set(0, -1e-6, 0);
  kit.tHat = want.clone().normalize(); kit.poleKey = goal.pole;
  const [pole1, pole2] = goal.pole ? [new Vector3(...goal.pole).normalize(), poles(kind, side)[1].applyQuaternion(bodyQ)]
   : poles(kind, side).map(v => v.applyQuaternion(kind === 'foot' ? headingQ : bodyQ));
  // Which way the elbow/knee should face across the line (blending to the second pole near the line).
  const p1 = across(pole1, kit.tHat), p2 = across(pole2, kit.tHat), w = smooth(.15, .45, p1.length());
  kit.poleDir = p1.normalize().multiplyScalar(w).add(p2.normalize().multiplyScalar(1 - w));
 }
 const tHat = kit.tHat, poleDir = kit.poleDir;
 const elbowOf = new Vector3(), tmp = new Quaternion(), d2 = new Quaternion();
 function attempt(hingeX, extraSpin){
  const H = p.clone().applyAxisAngle(X, tOf(hingeX)).add(E0), r0 = H.clone().sub(S0);
  const point = new Quaternion().setFromUnitVectors(r0.normalize(), tHat);
  const e1 = across(elbowOf.copy(E0).sub(S0).applyQuaternion(point), tHat);
  let spin = extraSpin;
  if(e1.lengthSq() > 1e-12 && poleDir.lengthSq() > 1e-12) spin += Math.atan2(e1.clone().cross(poleDir).dot(tHat), e1.dot(poleDir));
  const W1 = new Quaternion().setFromAxisAngle(tHat, spin).multiply(point);
  const upper = anglesFor(U, Pinv.clone().multiply(W1), cur(uName)), mid = {x: hingeX, y: m.y, z: m.z};
  // Where the wrist/ankle really lands with the (limited) angles.
  const W1a = tmp.copy(P).multiply(deltaOf(U, upper)), elbowW = E0.clone().sub(S0).applyQuaternion(W1a).add(Sw);
  const W2a = W1a.clone().multiply(deltaOf(Mb, mid, d2)), wrist = END.clone().sub(E0).applyQuaternion(W2a).add(elbowW);
  return {upper, mid, W2a, err: wrist.distanceTo(target), spin: extraSpin};
 }
 // Try each hinge solution with the elbow/knee facing the pole; if a joint limit gets
 // in the way, look around the line for the nearest spin that still lands.
 // Ties go to the bend closest to the pose's own (so the arm never flips to the other answer).
 hinges.sort((a1, a2) => Math.abs(a1 - m.x) - Math.abs(a2 - m.x));
 let best = null;
 // A given spin (the palm solver chooses it) is used as is: no searching.
 for(const hx of hinges){ const r = attempt(hx, (spinOffset ?? 0) * RAD); if(!best || r.err < best.err - 1e-9) best = r; }
 if(best.err > 1e-4 && spinOffset === null){
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
 // The hand / foot starts from the pose as given (not an earlier pass), so a partly flat
 // foot never creeps toward flat over passes or frames.
 let end = {...E.rest, ...(own[eName] ?? {})};
 // 5. Feet flat, facing their heading: the ankle undoes the leg's turn. The ankle
 //    cannot twist, so the leg's spin is fine-tuned until the twist the ankle would
 //    need is zero (the foot decides exactly where the knee points).
 if(kind === 'foot' && (goal.flat ?? !!goal.sole) !== false && (goal.flat ?? !!goal.sole) !== 0){
  const twistNeeded = r => new Euler().setFromQuaternion(r.W2a.clone().invert().multiply(footQ).multiply(E.restQ), E.order).y;
  const spinStart = best.spin;
  let s0 = best.spin, f0 = twistNeeded(best), s1 = s0 + .01, f1 = twistNeeded(attempt(best.mid.x, s1));
  for(let k = 0; k < 12 && Math.abs(f1) > 1e-10 && Math.abs(f1 - f0) > 1e-14; k++){
   const s2 = s1 - f1 * (s1 - s0) / (f1 - f0); s0 = s1; f0 = f1; s1 = s2; f1 = twistNeeded(attempt(best.mid.x, s1));
  }
  const tuned = attempt(best.mid.x, s1), twistBefore = Math.abs(twistNeeded(best));
  if(tuned.err <= best.err + 1e-6 && Math.abs(f1) < twistBefore) best = tuned;
  else if(Math.abs(f1) < 1e-6 && twistBefore > 1e-6){
   // The exact answer is blocked by a joint limit (e.g. the hip cannot twist that far). Go as far
   // toward it as the limit allows, rather than not at all: all-or-nothing makes the leg snap at the
   // moment the limit starts to bind.
   const spinAt = u => spinStart + u * (s1 - spinStart), ok = u => attempt(best.mid.x, spinAt(u)).err <= best.err + 1e-6;
   let lo = 0, hi = 1;
   for(let u = .05; u <= 1 + 1e-9; u += .05){ if(ok(Math.min(1, u))) lo = Math.min(1, u); else { hi = Math.min(1, u); break; } }
   if(lo < 1 && hi > lo) for(let k = 0; k < 30; k++){ const mid = (lo + hi) / 2; if(ok(mid)) lo = mid; else hi = mid; }
   const part = attempt(best.mid.x, spinAt(lo));
   if(part.err <= best.err + 1e-6 && Math.abs(twistNeeded(part)) < twistBefore) best = part;
  }
  // flat may be a number 0..1: how flat (1) versus the ankle's own angle in the pose (0),
  // e.g. fully flat near the ground and relaxed while the foot is in the air.
  const flatAngles = anglesFor(E, best.W2a.clone().invert().multiply(footQ), end, SOFT), w = typeof goal.flat === 'number' ? Math.min(1, Math.max(0, goal.flat)) : 1;
  end = Object.fromEntries(['x', 'y', 'z'].map(k => [k, end[k] + (flatAngles[k] - end[k]) * w]));
 }
 return {[uName]: best.upper, [mName]: best.mid, [eName]: end, forearm: best.W2a, err: best.err};
}

/**
 * A hand goal by the palm: the palm centre lands exactly on the point, and the
 * palm faces the given way (and, if asked, the fingers point the given way).
 * Four things turn the palm without moving where it lands: the spin of the
 * whole arm about the shoulder→palm line, the forearm's roll, and the wrist's
 * two turns. They are solved together, smoothly (Levenberg-Marquardt), with a
 * tiny preference for the most relaxed answer (the elbow toward its pole, the
 * roll and wrist near the pose's own), so a small change in the target always
 * gives a small change in the arm. Then a final exact solve lands the palm.
 */
function solvePalm(skeleton, out, solved, side, goal, continuing = false, rough = false){
 const name = 'hand.' + side, fname = 'lowerArm.' + side, hand = skeleton.bones[skeleton.index.get(name)], fore = skeleton.bones[skeleton.index.get(fname)];
 const H0 = new Vector3(...hand.head), palm0 = new Vector3(...skeleton.palms[side].point), n0 = new Vector3(...skeleton.palms[side].normal);
 const f0 = new Vector3(...hand.tail).sub(H0); f0.sub(n0.clone().multiplyScalar(f0.dot(n0))).normalize();
 const centre = goal.touch ? new Vector3(...goal.touch) : null, r = goal.radius ?? 0;
 let face = goal.face ? new Vector3(...goal.face).normalize() : null;
 if(centre){
  // Touch a ball: the palm meets it coming from the shoulder, facing its centre, the palm
  // centre on its surface (a steady choice that does not chase itself).
  face = centre.clone().sub(solved.get('upperArm.' + side).head); if(face.lengthSq() < 1e-12) face.set(0, 0, 1); face.normalize();
 }
 const target = centre ? centre.clone().addScaledVector(face, -r) : new Vector3(...goal.palm);
 const fingers = goal.fingers && face ? (() => { const f = new Vector3(...goal.fingers); return f.sub(face.clone().multiplyScalar(f.dot(face))).normalize(); })() : null;
 const foreNow = {...fore.rest, ...(out[fname] ?? {})}, wristNow = {...hand.rest, ...(out[name] ?? {})}, kit = {};
 const at = ([spin, roll, wx, wz]) => {
  const o = {...out, [fname]: {...foreNow, y: roll}, [name]: {...wristNow, x: wx, z: wz}};
  const endRest = palm0.clone().sub(H0).applyQuaternion(deltaOf(hand, o[name])).add(H0);
  return {o, res: solveLimb(skeleton, o, solved, 'hand', side, goal, endRest, target, spin, o, kit)};
 };
 // No facing asked: land the palm with the forearm roll and wrist as they are.
 if(!face){ const {o, res} = at([0, foreNow.y, wristNow.x, wristNow.z]); return finish(o, res, 0); }
 const lim = [[-180, 180], fore.limits.y, hand.limits.x, hand.limits.z], clampAt = (x, j) => Math.min(lim[j][1], Math.max(lim[j][0], x));
 // Start from the pose given (e.g. last frame), with a very gentle preference for a
 // relaxed answer. When the hand's whole turn is set (palm and fingers, e.g. resting on
 // the thighs), that preference is the joints' natural rest, so nothing can drift. When
 // only the palm's facing is set (e.g. touching a ball), the hand may need a big forearm
 // roll, so the preference is the pose's own (it moves along with the hand).
 const start = [0, foreNow.y, wristNow.x, wristNow.z], anchor = fingers ? [0, fore.rest.y, hand.rest.x, hand.rest.z] : start.slice(), RELAX = 1e-6, NEAR = 100;
 const residual = v => {
  const {res} = at(v), W2a = res.forearm, Dw = deltaOf(hand, {x: v[2], y: 0, z: v[3]});
  const n = n0.clone().applyQuaternion(Dw).applyQuaternion(W2a).sub(face).multiplyScalar(Math.SQRT1_2), out3 = [n.x, n.y, n.z];
  if(fingers){ const f = f0.clone().applyQuaternion(Dw).applyQuaternion(W2a); f.sub(face.clone().multiplyScalar(f.dot(face))); const d = f.normalize().sub(fingers).multiplyScalar(Math.SQRT1_2); out3.push(d.x, d.y, d.z); }
  out3.push(NEAR * res.err); // only grows if a joint limit stops the palm landing
  for(let j = 0; j < 4; j++) out3.push(Math.sqrt(RELAX) * (v[j] - anchor[j]));
  return out3;
 };
 // (An early pass, only to place the arm for the shoulder follow, takes a few steps.)
 let v = leastSquares(residual, start, clampAt, rough ? {iterations: 3} : {});
 // If a joint limit left it stuck short of facing the right way, try a few other
 // starting turns and keep the best (rare; normally the pose's own start is enough).
 const cost = x => residual(x).reduce((a, y) => a + y * y, 0), off = x => { const r3 = residual(x); return r3[0] ** 2 + r3[1] ** 2 + r3[2] ** 2; };
 // (Not when carrying on from last frame: jumping to another answer would be a visible snap.)
 if(!continuing && !rough && off(v) > 1e-3){
  let best = cost(v);
  for(const seed of [[0, -60, 0, 0], [0, -30, 0, 0], [0, 40, 0, 0], [30, -45, 0, 15], [-30, -45, 0, 15]]){
   const w = leastSquares(residual, seed.map((x, j) => j === 0 ? x : x + (j === 1 ? 0 : start[j])), clampAt), c = cost(w);
   if(c < best - 1e-12){ best = c; v = w; }
  }
 }
 const {o, res} = at(v);
 return finish(o, res, v[0]);

 function finish(o, res, spin){
  Object.assign(out, {[fname]: res[fname], [name]: o[name], ['upperArm.' + side]: res['upperArm.' + side]});
  return {target, face, fingers, f0};
 }
}

/** Minimise the sum of squares of residual(v) (Levenberg-Marquardt), keeping each v[j] inside clampAt. */
function leastSquares(residual, start, clampAt, {iterations = 20, h = 1e-3} = {}){
 const n = start.length, sq = r => r.reduce((a, x) => a + x * x, 0);
 let v = start.map((x, j) => clampAt(x, j)), r0 = residual(v), c0 = sq(r0), lambda = 1e-3;
 for(let it = 0; it < iterations; it++){
  const J = v.map((_, j) => { const vh = v.slice(); vh[j] += h; return residual(vh).map((x, i) => (x - r0[i]) / h); });
  const A = J.map(a => J.map(b => a.reduce((s, x, m) => s + x * b[m], 0))), g = J.map(a => a.reduce((s, x, m) => s + x * r0[m], 0));
  for(let i = 0; i < n; i++) A[i][i] += lambda * (A[i][i] + 1e-9);
  const d = solveLinear(A, g.map(x => -x)); if(!d) break;
  const tryV = v.map((x, j) => clampAt(x + d[j], j)), r1 = residual(tryV), c1 = sq(r1);
  if(c1 < c0){ const moved = Math.max(...tryV.map((x, j) => Math.abs(x - v[j]))), gain = c0 - c1; v = tryV; r0 = r1; c0 = c1; lambda = Math.max(1e-7, lambda / 4); if(moved < 3e-5 || gain < 1e-12 * (1 + c1)) break; }
  else { lambda *= 8; if(lambda > 1e8) break; }
 }
 return v;
}

/** Solve A·x = b (small, dense; Gaussian elimination with pivoting). */
function solveLinear(A, b){
 const n = b.length, M = A.map((row, i) => [...row, b[i]]);
 for(let c = 0; c < n; c++){
  let p = c; for(let i = c + 1; i < n; i++) if(Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
  if(Math.abs(M[p][c]) < 1e-300) return null;
  [M[c], M[p]] = [M[p], M[c]];
  for(let i = c + 1; i < n; i++){ const f = M[i][c] / M[c][c]; for(let k = c; k <= n; k++) M[i][k] -= f * M[c][k]; }
 }
 const x = new Array(n);
 for(let i = n - 1; i >= 0; i--){ let s = M[i][n]; for(let k = i + 1; k < n; k++) s -= M[i][k] * x[k]; x[i] = s / M[i][i]; }
 return x;
}

/** Reach every goal; see the top of this file. */
export function reach(skeleton, pose, goals, {follow = false, passes = 2, clavicles = null, continuing = false} = {}){
 let out = {...pose};
 const rounds = follow ? passes : 1, palmGoals = {};
 for(let r = 0; r < rounds; r++){
  // The follow is worked out afresh from the pose's own collarbones each pass (never piled up).
  // (clavicles: the pose's own collarbones before any follow, when the pose already has it.)
  if(follow){
   const before = {L: out['clavicle.L'], R: out['clavicle.R']};
   out = shoulderFollow(skeleton, {...out, 'clavicle.L': (clavicles ?? pose)['clavicle.L'], 'clavicle.R': (clavicles ?? pose)['clavicle.R']});
   // If the shoulders hardly moved since the last pass, the limbs are already right.
   // (Keep the shoulders the limbs were solved with, so hands and feet land exactly.)
   if(r > 0 && ['L', 'R'].every(sd => before[sd] && ['x', 'y', 'z'].every(k => Math.abs(out['clavicle.' + sd][k] - before[sd][k]) < .05))){ out['clavicle.L'] = before.L; out['clavicle.R'] = before.R; break; }
  }
  const solved = skeleton.solve(out);
  for(const [name, goal] of Object.entries(goals)){
   const [kind, side] = name.split('.');
   if(!LIMBS[kind]) throw Error('Can only reach with hand.L/R or foot.L/R, not ' + name);
   if(kind === 'hand' && (goal.palm || goal.touch)){ palmGoals[name] = solvePalm(skeleton, out, solved, side, goal, continuing, false); continue; }
   const res = solveLimb(skeleton, out, solved, kind, side, goal, null, null, null, pose);
   delete res.forearm; delete res.err; Object.assign(out, res);
  }
 }
 // Hands that grip: once the arm and palm are placed, each finger curls until it
 // touches what it holds (hands.js).
 // (grip.weight 0..1 eases the grip in from the hand's own shape.)
 for(const [name, goal] of Object.entries(goals)) if(goal.grip){
  const g = grip(skeleton, out, name.split('.')[1], goal.grip.shapes, goal.grip), w = Math.min(1, Math.max(0, goal.grip.weight ?? 1));
  for(const [b, a] of Object.entries(g)){ const own = {...skeleton.bones[skeleton.index.get(b)].rest, ...(out[b] ?? {})}; out[b] = {x: own.x + (a.x - own.x) * w, y: own.y + (a.y - own.y) * w, z: own.z + (a.z - own.z) * w}; }
 }
 // How far each goal is from being reached (metres), and for palms how far off the facing is (degrees).
 const solved = skeleton.solve(out), error = {}, facing = {}, pointing = {}, tilt = {};
 for(const [name, goal] of Object.entries(goals)){
  const b = solved.get(name), side = name.split('.')[1];
  if(palmGoals[name]){
   const H0 = new Vector3(...skeleton.bones[skeleton.index.get(name)].head), palm = new Vector3(...skeleton.palms[side].point).sub(H0).applyQuaternion(b.rotation).add(b.head);
   error[name] = palm.distanceTo(palmGoals[name].target);
   if(palmGoals[name].face) facing[name] = new Vector3(...skeleton.palms[side].normal).applyQuaternion(b.rotation).angleTo(palmGoals[name].face) / RAD;
   if(palmGoals[name].fingers){ const g = palmGoals[name], f = g.f0.clone().applyQuaternion(b.rotation), want = g.fingers.clone().sub(g.face.clone().multiplyScalar(g.fingers.dot(g.face))).normalize(); pointing[name] = f.sub(g.face.clone().multiplyScalar(f.dot(g.face))).angleTo(want) / RAD; }
   continue;
  }
  const t = new Vector3(...(goal.position ?? goal.sole));
  if(!goal.position) t.y += skeleton.bones[skeleton.index.get(name)].head[1];
  error[name] = b.head.distanceTo(t);
  // A foot set flat on a spot: how far its real angle is from the one asked for.
  if(goal.sole && (goal.flat === undefined || goal.flat === true || goal.flat === 1)){
   const yaw = goal.heading !== undefined ? goal.heading * RAD : new Euler().setFromQuaternion(solved.get('pelvis').rotation, 'YXZ').y;
   const want = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw);
   if(goal.pitch) want.multiply(new Quaternion().setFromAxisAngle(X, goal.pitch * RAD));
   if(goal.roll) want.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), goal.roll * RAD));
   tilt[name] = 2 * Math.acos(Math.min(1, Math.abs(b.rotation.dot(want)))) / RAD;
  }
 }
 return {pose: out, error, facing, pointing, tilt};
}
