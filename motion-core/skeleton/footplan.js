// Foot planning · where each foot is, how it travels to the next spot, how it lands.
//
//   const planner = createFootPlanner(skeleton, {ground})
//   planner.stepTo('L', now, {sole: [x, z]})      // start a step at time `now`
//   planner.goals(t)  →  {'foot.L': {sole, heading, pitch, roll}, 'foot.R': {...}}
//
// The goals go straight into the reaching layer (player.setGoals), which bends
// the legs to put the feet there. Everything here is a plain function of time:
// ask for the same moment twice, in any order, at any frame rate, and the
// answer is identical (nothing is stepped forward frame by frame).
//
// What a step looks like:
//   - A planted foot is held at an exact spot: it never slides, drifts or floats.
//   - A swinging foot travels on smooth curves (position, speed and
//     acceleration are all continuous). It rises first, then moves across, then
//     comes down; its toes hang a little while it is in the air and level out
//     to land flat. Keep `lift` modest (about 6 cm): a very high lift folds the
//     leg past 90 degrees at the hip, where the hip's angles are unstable
//     (a known limit of the legs, to be fixed in the legs layer).
//   - It lifts high enough that no part of the foot goes into the ground on the
//     way, including stairs, blocks and edges (`ground(x, z)` gives the ground
//     height anywhere; flat at 0 by default). This is checked against the
//     foot's real shape, not only its middle.
//   - It starts and ends at rest in the world, so it lands without sliding.
//   - A step can be changed in the middle (a new spot, or back where it came
//     from): the new step carries on from where the foot is, with its speed and
//     acceleration, so nothing jolts.
import {Vector3} from 'three';
import {quintic} from './quintic.js';

const RAD = Math.PI / 180;

/** Step shape (all can be overridden per step). */
export const STEP_DEFAULTS = Object.freeze({
 duration: .5,       // seconds for the whole step
 lift: .05,          // metres the lowest part of the foot clears the ground at mid-step
 toesDown: 5,        // degrees the toes hang while the foot is in the air
 apexAt: .4,         // when the foot is highest (0..1 of the step)
 delay: .15,         // from rest, the foot rises this much of the step before moving across
 arriveEarly: .1,    // it has arrived over its spot this much of the step before the end (then it settles down)
 relax: 0,           // 0 keeps the foot at its planned angle in the air; up to 1 lets the ankle go slack (it then dangles, which can hit things)
 landPitch: 0,       // the angle it touches down at, degrees (toes up is negative: it lands on its heel; roll it flat with rollTo)
});

const CH = ['x', 'z', 'heading', 'y', 'pitch', 'roll', 'flat'];
const SAMPLES = 320, MAX_RAISE_TRIES = 24, TOUCH = 2e-4;

/** A smooth hump: 0 at both ends (with zero speed and acceleration there), 1 in the middle. */
const hump = s => { const u = Math.min(1, Math.max(0, s)); return 64 * u ** 3 * (1 - u) ** 3; };

export function createFootPlanner(skeleton, {ground = () => 0, soles = null} = {}){
 const bone = n => skeleton.bones[skeleton.index.get(n)];
 const ankleRest = {L: bone('foot.L').head, R: bone('foot.R').head};
 const ankleHeight = ankleRest.L[1];
 const contactRest = {L: Object.values(skeleton.footContacts.L), R: Object.values(skeleton.footContacts.R)};
 const feet = {};

 // The foot's contact points as offsets from the ankle (at rest the foot is flat and faces forward).
 const offsets = {};
 for(const side of ['L', 'R']) offsets[side] = contactRest[side].map(c => [c[0] - ankleRest[side][0], c[1] - ankleRest[side][1], c[2] - ankleRest[side][2]]);
 const scratch = new Float64Array(3 * offsets.L.length);
 // The contacts a rigid foot rocks on: the heel (toes up) and the toe tip (heel up), as offsets from the ankle.
 const contactNames = Object.keys(skeleton.footContacts.L), pivots = {};
 for(const side of ['L', 'R']) pivots[side] = {heel: offsets[side][contactNames.indexOf('heel')], toe: offsets[side][contactNames.indexOf('toe')]};

 /**
  * The foot's contact points in the world for a foot whose sole is at (x, y, z) facing `heading`,
  * toes down `pitch`, tilted `roll` (degrees): the turn is heading, then pitch about the foot's
  * sideways axis, then roll about its forward axis, about the ankle. Fills `out` with x, y, z per point.
  */
 function contactsInto(out, side, x, y, z, heading, pitch, roll){
  const ch = Math.cos(heading * RAD), sh = Math.sin(heading * RAD), cp = Math.cos(pitch * RAD), sp = Math.sin(pitch * RAD), cr = Math.cos(roll * RAD), sr = Math.sin(roll * RAD);
  // M = Ry(heading) · Rx(pitch) · Rz(roll)
  const m00 = ch * cr + sh * sp * sr, m01 = -ch * sr + sh * sp * cr, m02 = sh * cp;
  const m10 = cp * sr, m11 = cp * cr, m12 = -sp;
  const m20 = -sh * cr + ch * sp * sr, m21 = sh * sr + ch * sp * cr, m22 = ch * cp;
  const ay = y + ankleHeight;
  offsets[side].forEach((o, i) => {
   out[3 * i] = x + m00 * o[0] + m01 * o[1] + m02 * o[2];
   out[3 * i + 1] = ay + m10 * o[0] + m11 * o[1] + m12 * o[2];
   out[3 * i + 2] = z + m20 * o[0] + m21 * o[1] + m22 * o[2];
  });
  return out;
 }

 /**
  * Where the sole point is for a planted foot whose flat spot is `spot` (x, y, z, heading) rocked to `pitch`
  * degrees: it turns about its heel when its toes are up (pitch below 0) and about its toe tip when its heel is
  * up (pitch above 0), and that contact stays exactly where it was on the ground.
  */
 function rolledSole(side, spot, pitch){
  if(pitch === 0) return [spot.x, spot.y, spot.z];
  const rel = pitch < 0 ? pivots[side].heel : pivots[side].toe, h = spot.heading * RAD, ch = Math.cos(h), sh = Math.sin(h), cp = Math.cos(pitch * RAD), sp = Math.sin(pitch * RAD);
  // flat: the pivot is at ankle + Ry(h) rel; rocked: the ankle is that pivot minus Ry(h) Rx(pitch) rel
  const fx = ch * rel[0] + sh * rel[2], fz = -sh * rel[0] + ch * rel[2];
  const ry = cp * rel[1] - sp * rel[2], rz = sp * rel[1] + cp * rel[2];
  const rx = rel[0], gx = ch * rx + sh * rz, gz = -sh * rx + ch * rz;
  return [spot.x + fx - gx, spot.y + rel[1] - ry, spot.z + fz - gz];
 }

 /** The same, as Vector3s. */
 function worldContacts(side, x, y, z, heading, pitch, roll){
  const a = contactsInto(new Float64Array(scratch.length), side, x, y, z, heading, pitch, roll);
  return offsets[side].map((_, i) => new Vector3(a[3 * i], a[3 * i + 1], a[3 * i + 2]));
 }

 /** The height at which a flat foot at this spot rests: on the highest ground under any part of it. */
 function restHeight(side, x, z, heading){
  let h = -Infinity;
  for(const p of worldContacts(side, x, 0, z, heading, 0, 0)) h = Math.max(h, ground(p.x, p.z) - p.y);
  return h;
 }

 // Both feet start planted: where they stand at rest, on the ground under them (or where `soles` puts them).
 for(const side of ['L', 'R']){
  const spot = soles?.[side] ?? [ankleRest[side][0], undefined, ankleRest[side][2]];
  feet[side] = {segs: [], base: {x: spot[0], z: spot[2], heading: 0, pitch: 0, roll: 0, flat: 1, y: spot[1] ?? restHeight(side, spot[0], spot[2], 0)}};
 }

 // ---- Evaluating a step ----
 // A step stores, for each channel, where it started (value, speed, acceleration) and where it ends.
 // x, z and heading: one smooth curve from `ts` to `te`. y and pitch: up to a peak, then down to the end.
 function evalSeg(seg, tau){
  const out = {}, {T, ts, te, sa} = seg;
  for(const c of ['x', 'z', 'heading']){
   const f = seg.from[c], end = seg.end?.[c] ?? seg.to[c];
   out[c] = tau < ts ? {p: f.p, v: 0, a: 0} : quintic(f.p, f.v, f.a, end, te - ts, tau - ts);
  }
  for(const c of ['y', 'pitch', 'flat']){
   const f = seg.from[c], peak = seg.peak[c];
   const end = c === 'y' ? (seg.end?.y ?? seg.to.y) : seg.to[c];
   out[c] = tau < sa * T ? quintic(f.p, f.v, f.a, peak, sa * T, tau) : quintic(peak, 0, 0, end, (1 - sa) * T, tau - sa * T);
  }
  const r = seg.from.roll;
  out.roll = quintic(r.p, r.v, r.a, seg.to.roll, T, tau);
  return out;
 }

 const held = (base, side) => {
  const out = Object.fromEntries(CH.map(c => [c, {p: base[c], v: 0, a: 0}]));
  if(base.pitch !== 0){ const [x, y, z] = rolledSole(side, base, base.pitch); out.x.p = x; out.y.p = y; out.z.p = z; }
  return out;
 };

 /** The foot's full state (value, speed, acceleration per channel) at time t, and the step it is in (if any). */
 function stateAt(side, t){
  const f = feet[side];
  let last = null;
  for(const s of f.segs){ if(s.t0 <= t) last = s; else break; }
  if(!last) return {ch: held(f.base, side), seg: null};
  const tau = t - last.t0;
  if(tau >= last.T - 1e-9) return {ch: held(last.to, side), seg: null, done: last};
  if(last.kind === 'roll'){
   // Rocking about a contact: the pitch follows its curve and the sole point goes where that keeps the contact still.
   const at = u => { const q = quintic(last.from.p, last.from.v, last.from.a, last.to.pitch, last.T, u); return {q, sole: rolledSole(side, last.to, q.p)}; };
   // (Speed and acceleration of the sole point come from the curve a hair either side; outside the roll the curve holds still, which matches its ends.)
   const h = 1e-4, mid = at(tau), lo = at(tau - h), hi = at(tau + h), ch = held({...last.to, pitch: mid.q.p}, side);
   ['x', 'y', 'z'].forEach((c, k) => { ch[c].p = mid.sole[k]; ch[c].v = (hi.sole[k] - lo.sole[k]) / (2 * h); ch[c].a = (hi.sole[k] - 2 * mid.sole[k] + lo.sole[k]) / (h * h); });
   ch.pitch = mid.q;
   return {ch, seg: null, rolling: last, tau};
  }
  return {ch: evalSeg(last, tau), seg: last, tau};
 }

 /** How close the foot comes to the ground, beyond what the lift curve asks, over a step: {worst, at (0..1)}. */
 function clearanceMin(side, seg, need){
  let worst = Infinity, at = 0;
  for(let i = 0; i <= SAMPLES; i++){
   const s = i / SAMPLES, ch = evalSeg(seg, s * seg.T), want = need * hump(s);
   contactsInto(scratch, side, ch.x.p, ch.y.p, ch.z.p, ch.heading.p, ch.pitch.p, ch.roll.p);
   for(let k = 0; k < scratch.length; k += 3){
    const c = scratch[k + 1] - ground(scratch[k], scratch[k + 2]) - want;
    if(c < worst){ worst = c; at = s; }
   }
  }
  return {worst, at};
 }

 /** Wrap a heading so that turning from `from` to it takes the short way round. */
 const nearest = (from, to) => to + 360 * Math.round((from - to) / 360);

 // ---- Public ----
 const api = {
  /**
   * Put a foot down at an exact spot at once (before any step). spot: {sole: [x, z] or [x, y, z], heading?}.
   * Without a height it rests on the ground under it.
   */
  plant(side, spot, at = -Infinity){
   const f = feet[side], [x, a, b] = spot.sole, z = b ?? a, heading = spot.heading ?? 0;
   const y = b !== undefined ? a : restHeight(side, x, z, heading);
   f.segs = f.segs.filter(s => s.t0 < at);
   if(f.segs.length === 0) f.base = {x, z, heading, pitch: 0, roll: 0, y, flat: 1};
   else f.segs.push({t0: at, T: 0, to: {x, z, heading, pitch: 0, roll: 0, y, flat: 1}});
  },

  /**
   * Start a step at time `now` to a new spot. target: {sole: [x, z] or [x, y, z], heading?}. Options: see
   * STEP_DEFAULTS, plus `y` is taken from the sole if three numbers are given (else the ground under the
   * foot). If a step is already under way it is replaced: the new one carries on from where the foot is.
   */
  stepTo(side, now, target, options = {}){
   const o = {...STEP_DEFAULTS, ...options}, f = feet[side];
   f.segs = f.segs.filter(s => s.t0 < now); // stepping at an earlier time rewinds the plan
   const {ch: from} = stateAt(side, now);
   const [tx, ta, tb] = target.sole, tz = tb ?? ta, heading = nearest(from.heading.p, target.heading ?? from.heading.p);
   const ty = tb !== undefined ? ta : restHeight(side, tx, tz, heading);
   const T = Math.max(.05, o.duration);
   const atRest = ['x', 'z'].every(c => Math.abs(from[c].v) < 1e-9 && Math.abs(from[c].a) < 1e-9);
   // A kick (a sprinter's foot leaving the ground is already speeding up): extra starting acceleration [x, z] in m/s², so the foot is not left far behind the body.
   if(o.launch){ from.x = {...from.x, v: from.x.v + o.launch[0]}; from.z = {...from.z, v: from.z.v + o.launch[1]}; } // (and a speed to leave with)
   if(o.kick){ from.x = {...from.x, a: from.x.a + o.kick[0]}; from.z = {...from.z, a: from.z.a + o.kick[1]}; }
   const seg = {
    t0: now, T, sa: o.apexAt, ts: atRest ? o.delay * T : 0, te: (1 - o.arriveEarly) * T,
    from, to: {x: tx, z: tz, heading, pitch: o.landPitch, roll: 0, y: ty, flat: 1}, peak: {y: 0, pitch: o.toesDown, flat: 1 - o.relax},
   };
   // Where the sole point ends: the flat spot, or (landing on the heel) where rocking to that angle puts it.
   const endSole = rolledSole(side, seg.to, o.landPitch);
   seg.end = {x: endSole[0], y: endSole[1], z: endSole[2]};
   // The peak height: clear the highest ground along the way, then raise it until no part of the foot,
   // at any moment of the step, comes closer to the ground than the lift curve asks.
   let highest = ty;
   for(let i = 0; i <= SAMPLES; i++){
    const u = i / SAMPLES, h = from.heading.p + (heading - from.heading.p) * u;
    for(const p of worldContacts(side, from.x.p + (tx - from.x.p) * u, 0, from.z.p + (tz - from.z.p) * u, h, 0, 0)) highest = Math.max(highest, ground(p.x, p.z) - p.y);
   }
   // Lift above the highest ground on the way; a foot already higher than that (changing a step in the air) does not rise further.
   seg.peak.y = Math.max(highest + o.lift, from.y.p);
   // Raise the peak until nothing comes closer than asked. How much a raise helps depends on when the
   // closest moment is (late in the descent the foot is already near the end height), so measure it.
   for(let k = 0; k < MAX_RAISE_TRIES; k++){
    const {worst, at} = clearanceMin(side, seg, o.lift);
    if(worst >= -TOUCH) break;
    const y0 = evalSeg(seg, at * T).y.p;
    seg.peak.y += 1e-2;
    const gain = (evalSeg(seg, at * T).y.p - y0) / 1e-2;
    seg.peak.y -= 1e-2;
    seg.peak.y += (-worst + 2e-4) / Math.max(gain, .02);
   }
   f.segs.push(seg);
   return seg;
  },

  /** Where a foot is at time t: {mode: 'planted' | 'swing', phase (0..1 of its step), sole, velocity, heading, pitch, roll}. */
  state(side, t){
   const {ch, seg, tau} = stateAt(side, t);
   return {
    mode: seg ? 'swing' : 'planted', phase: seg ? tau / seg.T : 1,
    sole: [ch.x.p, ch.y.p, ch.z.p], velocity: [ch.x.v, ch.y.v, ch.z.v],
    heading: ch.heading.p, pitch: ch.pitch.p, roll: ch.roll.p, flat: ch.flat.p,
   };
  },

  /**
   * Rock a planted foot to a new angle (degrees, toes down is positive) starting at time `now`: heel strike
   * (toes up, negative), flat (0), heel lift (positive). The foot turns about its heel when its toes are up and its
   * toe tip when its heel is up; that contact stays exactly still on the ground. A roll that is already under way is
   * replaced and carries on from its own speed. The foot must be planted. Pass through 0 only at rest (end one roll
   * at 0 before starting one the other way): the two pivots move the ankle differently, so changing sides at speed
   * would give the ankle a jolt.
   */
  rollTo(side, now, pitch, {duration = .25} = {}){
   const f = feet[side];
   f.segs = f.segs.filter(s => s.t0 < now);
   const {ch, seg, rolling, done} = stateAt(side, now);
   if(seg) throw Error('rollTo: the foot is in a step, not planted');
   const spot = rolling ? rolling.to : done ? done.to : f.base;
   f.segs.push({kind: 'roll', t0: now, T: Math.max(.02, duration), from: {...ch.pitch}, to: {x: spot.x, y: spot.y, z: spot.z, heading: spot.heading, pitch, roll: spot.roll, flat: spot.flat}});
  },

  /** Where the foot is heading at time t: the end of the step it is in, or where it stands. [x, y, z]. */
  destination(side, t){
   const {ch, seg} = stateAt(side, t), to = seg ? seg.to : {x: ch.x.p, y: ch.y.p, z: ch.z.p};
   return [to.x, to.y, to.z];
  },

  /** Is the foot planted (not in a step) at time t? */
  isPlanted: (side, t) => !stateAt(side, t).seg,

  /** World positions of the foot's ground contact points at time t. */
  contactPoints(side, t){
   const {ch} = stateAt(side, t);
   return worldContacts(side, ch.x.p, ch.y.p, ch.z.p, ch.heading.p, ch.pitch.p, ch.roll.p);
  },

  /** Reaching goals for both feet at time t (for player.setGoals). */
  goals(t){
   const out = {};
   for(const side of ['L', 'R']){
    const {ch} = stateAt(side, t);
    out['foot.' + side] = {sole: [ch.x.p, ch.y.p, ch.z.p], heading: ch.heading.p, pitch: ch.pitch.p, roll: ch.roll.p, flat: Math.min(1, Math.max(0, ch.flat.p))};
   }
   return out;
  },

  /** Forget steps that finished before time t (keeps memory small in a long game). */
  prune(t){
   for(const side of ['L', 'R']){
    const f = feet[side];
    let keep = 0;
    f.segs.forEach((s, i) => { if(s.t0 + s.T <= t) keep = i + 1; });
    if(keep > 0){
     const last = f.segs[keep - 1];
     f.base = {...last.to};
     f.segs = f.segs.slice(keep);
    }
   }
  },
 };
 return api;
}
