// Balance · where the body's weight is, which feet carry it, and the smooth
// shift that puts the weight over them.
//
// How it fits in the stack:
//   pose player → joint angles + root position
//   balance     → how far the whole body must move sideways (and optionally
//                 fore/aft) so its centre of mass sits over the feet that carry it
//   reach       → keeps those feet planted, so the legs bend to match
//
// Pure functions first (centre of mass, support, target), then a smooth
// follower that turns the wanted shift into a gentle movement.

import {Vector3} from 'three';

/**
 * Body segments for the centre of mass. Standard human proportions
 * (Winter/Dempster): each segment's share of the body's mass and where its
 * centre sits between two points of the skeleton (0 = first, 1 = second).
 * Points are 'bone.head' / 'bone.tail'. The shares add up to 1.
 */
export const SEGMENTS = Object.freeze([
 {name:'trunk',       mass:.497, from:'pelvis.head',  to:'neck.head',     at:.5},
 {name:'head+neck',   mass:.081, from:'neck.head',    to:'head.tail',     at:.5},
 {name:'upperArm.L',  mass:.028, from:'upperArm.L.head', to:'upperArm.L.tail', at:.436},
 {name:'upperArm.R',  mass:.028, from:'upperArm.R.head', to:'upperArm.R.tail', at:.436},
 {name:'forearm.L',   mass:.016, from:'lowerArm.L.head', to:'lowerArm.L.tail', at:.430},
 {name:'forearm.R',   mass:.016, from:'lowerArm.R.head', to:'lowerArm.R.tail', at:.430},
 {name:'hand.L',      mass:.006, from:'hand.L.head',  to:'hand.L.tail',   at:.506},
 {name:'hand.R',      mass:.006, from:'hand.R.head',  to:'hand.R.tail',   at:.506},
 {name:'thigh.L',     mass:.100, from:'thigh.L.head', to:'thigh.L.tail',  at:.433},
 {name:'thigh.R',     mass:.100, from:'thigh.R.head', to:'thigh.R.tail',  at:.433},
 {name:'shin.L',      mass:.0465, from:'shin.L.head', to:'shin.L.tail',   at:.433},
 {name:'shin.R',      mass:.0465, from:'shin.R.head', to:'shin.R.tail',   at:.433},
 {name:'foot.L',      mass:.0145, from:'foot.L.head', to:'foot.L.tail',   at:.5},
 {name:'foot.R',      mass:.0145, from:'foot.R.head', to:'foot.R.tail',   at:.5},
]);

const point = (solved, ref) => {
 const i = ref.lastIndexOf('.'), b = solved.get(ref.slice(0, i));
 return b[ref.slice(i + 1)];
};

/** Centre of mass of the whole body (a Vector3, avatar space) for a solved pose (skeleton.solve). */
export function centreOfMass(solved){
 const c = new Vector3(), a = new Vector3();
 for(const s of SEGMENTS){
  a.copy(point(solved, s.from)).lerp(point(solved, s.to), s.at);
  c.addScaledVector(a, s.mass);
 }
 return c;
}

/** Contact points carried by each foot bone: the toe point rides on the toes, the rest on the foot. */
const CARRIER = {heel:'foot', heelInner:'foot', heelOuter:'foot', ballInner:'foot', ballOuter:'foot', toe:'toes'};

/** World positions of one foot's ground contact points for a solved pose. */
export function footContactPoints(skeleton, solved, side){
 const out = {};
 for(const [name, rest] of Object.entries(skeleton.footContacts[side])){
  const bone = CARRIER[name] + '.' + side, rb = skeleton.bones[skeleton.index.get(bone)], b = solved.get(bone);
  out[name] = new Vector3(rest[0] - rb.head[0], rest[1] - rb.head[1], rest[2] - rb.head[2]).applyQuaternion(b.rotation).add(b.head);
 }
 return out;
}

/**
 * The contact points that carry weight: a point counts when it is within
 * `tolerance` metres of the ground under it. `ground(x, z)` gives the ground
 * height (flat at 0 by default); a game with terrain or stairs passes its own.
 * Returns {points: Vector3[], feet: ['L'|'R', ...]}.
 */
export function supportPoints(skeleton, solved, {ground = () => 0, tolerance = .02} = {}){
 const points = [], feet = [];
 for(const side of ['L', 'R']){
  let any = false;
  for(const p of Object.values(footContactPoints(skeleton, solved, side))){
   if(p.y - ground(p.x, p.z) <= tolerance){ points.push(p); any = true; }
  }
  if(any) feet.push(side);
 }
 return {points, feet};
}

/** Convex hull (x, z) of points, counter-clockwise (monotone chain). */
function hull(pts){
 const p = pts.map(v => [v.x, v.z]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
 if(p.length < 3) return p;
 const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
 const build = list => { const h = []; for(const q of list){ while(h.length >= 2 && cross(h.at(-2), h.at(-1), q) <= 1e-12) h.pop(); h.push(q); } h.pop(); return h; };
 return [...build(p), ...build(p.slice().reverse())];
}

/** The middle of the support area: the area centre of its hull, or the average of its points when it is a line or a dot. */
export function supportCentre(points){
 const h = hull(points);
 let area = 0, cx = 0, cz = 0;
 for(let i = 0; i < h.length; i++){
  const [x0, z0] = h[i], [x1, z1] = h[(i + 1) % h.length], w = x0 * z1 - x1 * z0;
  area += w; cx += (x0 + x1) * w; cz += (z0 + z1) * w;
 }
 if(Math.abs(area) > 1e-9) return [cx / (3 * area), cz / (3 * area)];
 const n = points.length;
 return [points.reduce((s, v) => s + v.x, 0) / n, points.reduce((s, v) => s + v.z, 0) / n];
}

/**
 * Where the centre of mass should be, and how far the body must move to get it there.
 *   axes   'x' (sideways only, default) or 'xz'
 *   fore   with 'xz', where fore/aft the weight sits on the support area: 0 heels, 1 toes
 *   ground, tolerance   see supportPoints
 * Returns {shift: [dx, dz], com, target: [x, z], feet} or null when nothing carries weight.
 */
export function balanceShift(skeleton, solved, {axes = 'x', fore = .5, ground, tolerance} = {}){
 const {points, feet} = supportPoints(skeleton, solved, {ground, tolerance});
 if(!points.length) return null;
 const com = centreOfMass(solved), [cx, cz] = supportCentre(points);
 let tz = cz;
 if(axes === 'xz'){
  const zs = points.map(p => p.z), lo = Math.min(...zs), hi = Math.max(...zs);
  tz = hi - lo > 1e-6 ? lo + fore * (hi - lo) : cz;
 }
 return {shift: [cx - com.x, axes === 'xz' ? tz - com.z : 0], com, target: [cx, tz], feet};
}

/**
 * How far the body must lower (metres, 0 or more) so every planted foot in
 * `goals` can still reach its spot. A straight leg cannot follow the hips
 * sideways without them dropping: this is what keeps a weight shift honest.
 * `solved` is the pose with the body already shifted; goals are the reach
 * goals ({'foot.L': {sole: [x, y, z]}, ...}).
 */
export function reachDrop(skeleton, solved, goals, {extension = 1} = {}){
 let drop = 0;
 for(const side of ['L', 'R']){
  const g = goals['foot.' + side];
  if(!g?.sole) continue;
  const at = n => skeleton.bones[skeleton.index.get(n + '.' + side)];
  const reachLen = (at('thigh').length + at('shin').length) * extension, hip = solved.get('thigh.' + side).head;
  const ankleY = g.sole[1] + at('foot').head[1], across = Math.hypot(hip.x - g.sole[0], hip.z - g.sole[2]);
  const highest = Math.sqrt(Math.max(0, reachLen * reachLen - across * across));
  drop = Math.max(drop, hip.y - ankleY - highest);
 }
 return drop < 1e-9 ? 0 : drop;
}

/**
 * Smooth follower for the wanted shift. Each time the wanted value changes the
 * movement is re-planned as a fifth-power (quintic) curve from where the body
 * is now, with the speed and acceleration it already has, to the new value at
 * rest, over `duration` seconds. So it never kinks, and once the wanted value
 * stops changing it arrives exactly and stays still.
 */
export function createShiftFollower({duration = .3, deadband = 1e-5, size = 2} = {}){
 const st = Array.from({length: size}, () => ({p0: 0, v0: 0, a0: 0, p1: 0}));
 let elapsed = 0, T = duration;
 // Position, speed and acceleration of one axis's curve at the current time.
 function eval1(c, t){
  const s = Math.min(1, Math.max(0, t / T)), s2 = s * s, s3 = s2 * s, s4 = s3 * s, s5 = s4 * s;
  const p0 = c.p0, v0 = c.v0 * T, a0 = c.a0 * T * T, p1 = c.p1;
  if(s >= 1) return {p: p1, v: 0, a: 0};
  return {
   p: (1 - 10*s3 + 15*s4 - 6*s5)*p0 + (s - 6*s3 + 8*s4 - 3*s5)*v0 + (.5*s2 - 1.5*s3 + 1.5*s4 - .5*s5)*a0 + (10*s3 - 15*s4 + 6*s5)*p1,
   v: ((-30*s2 + 60*s3 - 30*s4)*p0 + (1 - 18*s2 + 32*s3 - 15*s4)*v0 + (s - 4.5*s2 + 6*s3 - 2.5*s4)*a0 + (30*s2 - 60*s3 + 30*s4)*p1) / T,
   a: ((-60*s + 180*s2 - 120*s3)*p0 + (-36*s + 96*s2 - 60*s3)*v0 + (1 - 9*s + 18*s2 - 10*s3)*a0 + (60*s - 180*s2 + 120*s3)*p1) / (T * T),
  };
 }
 return {
  /** Current shift, one number per axis. */
  get value(){ return st.map(c => eval1(c, elapsed).p); },
  /** Current speed per axis (metres per second). */
  get speed(){ return st.map(c => eval1(c, elapsed).v); },
  /** Where it is heading, per axis. */
  get goal(){ return st.map(c => c.p1); },
  /** Re-plan toward new wanted values (an array, one per axis). Ignores changes under the deadband. */
  retarget(wanted, seconds = duration){
   if(wanted.every((w, i) => Math.abs(w - st[i].p1) <= deadband)) return;
   const now = st.map(c => eval1(c, elapsed));
   T = Math.max(1e-6, seconds);
   st.forEach((c, i) => { c.p0 = now[i].p; c.v0 = now[i].v; c.a0 = now[i].a; c.p1 = wanted[i]; });
   elapsed = 0;
  },
  /** Move time forward; returns the current shift. */
  update(dt){ elapsed = Math.max(0, elapsed + dt); return this.value; },
  /** Jump to a value at rest (for starting over). */
  reset(values = new Array(size).fill(0)){ st.forEach((c, i) => { c.p0 = c.p1 = values[i] ?? 0; c.v0 = c.a0 = 0; }); elapsed = 0; },
 };
}
