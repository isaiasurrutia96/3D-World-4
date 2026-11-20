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
import {quintic} from './quintic.js';

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
 * `exclude`: sides to leave out (a foot that is about to lift counts as unloaded, so the body shifts before it goes).
 * Returns {points: Vector3[], feet: ['L'|'R', ...]}.
 */
export function supportPoints(skeleton, solved, {ground = () => 0, tolerance = .02, exclude = []} = {}){
 const points = [], feet = [];
 for(const side of ['L', 'R']){
  if(exclude.includes(side)) continue;
  let any = false;
  for(const p of Object.values(footContactPoints(skeleton, solved, side))){
   if(p.y - ground(p.x, p.z) <= tolerance){ points.push(p); any = true; }
  }
  if(any) feet.push(side);
 }
 return {points, feet};
}

/** Convex hull (x, z) of points, counter-clockwise (monotone chain). */
export function hull(pts){
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
 * The range of x that stays at least `margin` inside the support area at a given z (null when the area is
 * too small to leave that margin). The hull points go counter-clockwise, so the inside is to the left of each edge.
 */
function insideRange(h, z, margin){
 let lo = -Infinity, hi = Infinity;
 for(let i = 0; i < h.length; i++){
  const [x0, z0] = h[i], [x1, z1] = h[(i + 1) % h.length], ex = x1 - x0, ez = z1 - z0, len = Math.hypot(ex, ez);
  if(len < 1e-9) continue;
  // inside: (ex * (z - z0) - ez * (x - x0)) / len >= margin  →  a * x >= b
  const a = -ez / len, b = margin - (ex * (z - z0)) / len - (ez * x0) / len;
  if(Math.abs(a) < 1e-12){ if(0 < b - 1e-12) return null; continue; }
  if(a > 0) lo = Math.max(lo, b / a); else hi = Math.min(hi, b / a);
 }
 return lo <= hi + 1e-12 && Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : null;
}

/**
 * Where the centre of mass should be, and how far the body must move to get it there.
 *   axes   'x' (sideways only, default) or 'xz'
 *   policy 'centre' (default): aim at the middle of the support area, the most stable place.
 *          'inside': move only as far as needed to bring the weight at least `margin` metres
 *          inside the support area (not at all if it is already there): less swaying, far less
 *          leg splay on a wide stance, and still safely supported.
 *   margin (with 'inside', default 3 cm)
 *   heading the way the body faces, in radians about the vertical (default 0: the world axes); 'x' is then
 *          sideways to that, so walking in any direction sways sideways to it
 *   fore   with 'xz' and 'centre', where fore/aft the weight sits on the support area: 0 heels, 1 toes
 *   ground, tolerance, exclude   see supportPoints
 * Returns {shift: [dx, dz], com, target: [x, z], feet} or null when nothing carries weight.
 */
export function balanceShift(skeleton, solved, {axes = 'x', fore = .5, policy = 'centre', margin = .03, heading = 0, ground, tolerance, exclude} = {}){
 const sp = supportPoints(skeleton, solved, {ground, tolerance, exclude});
 if(!sp.points.length) return null;
 const cosH = Math.cos(heading), sinH = Math.sin(heading);
 // Work in the body's own frame: x is sideways (his left), z is the way he faces (heading 0: the world axes).
 const toBody = (x, z) => ({x: x * cosH - z * sinH, z: x * sinH + z * cosH});
 const points = sp.points.map(p => { const b = toBody(p.x, p.z); return {x: b.x, y: p.y, z: b.z}; }), feet = sp.feet;
 const comW = centreOfMass(solved), cb = toBody(comW.x, comW.z), com = {x: cb.x, y: comW.y, z: cb.z};
 const [cx, cz] = supportCentre(points);
 let tx = cx, tz = cz;
 if(axes === 'xz'){
  const zs = points.map(p => p.z), lo = Math.min(...zs), hi = Math.max(...zs);
  tz = hi - lo > 1e-6 ? lo + fore * (hi - lo) : cz;
 }
 if(policy === 'inside'){
  const h = hull(points), zs = h.map(p => p[1]), zlo = Math.min(...zs), zhi = Math.max(...zs);
  if(axes === 'xz'){
   // Move the weight to the nearest point that is inside by the margin (sideways first, then fore/aft).
   const zi = Math.min(zhi - margin, Math.max(zlo + margin, com.z)), zRange = zhi - zlo > 2 * margin;
   const zTarget = zRange ? zi : cz, r = insideRange(h, zTarget, margin);
   tz = zTarget; tx = r ? Math.min(r[1], Math.max(r[0], com.x)) : cx;
  } else {
   // Sideways only: the margin is asked of the two sides only, over the whole width of the support (a foot far
   // ahead of or behind the body, or a thin heel strike, still gives its full width to stand within).
   const xs = h.map(p => p[0]), lo = Math.min(...xs) + margin, hi = Math.max(...xs) - margin;
   tx = lo <= hi ? Math.min(hi, Math.max(lo, com.x)) : (Math.min(...xs) + Math.max(...xs)) / 2;
   tz = com.z;
  }
 }
 // Back to the world: the shift is along his sideways direction (and, with 'xz', the way he faces).
 const lat = tx - com.x, fwd = axes === 'xz' ? tz - com.z : 0;
 return {shift: [lat * cosH + fwd * sinH, -lat * sinH + fwd * cosH], com: new Vector3(comW.x, comW.y, comW.z), target: [tx * cosH + tz * sinH, -tx * sinH + tz * cosH], feet};
}

/**
 * How far the body must lower (metres, 0 or more) so every planted foot in
 * `goals` can still reach its spot. A straight leg cannot follow the hips
 * sideways without them dropping: this is what keeps a weight shift honest.
 * `solved` is the pose with the body already shifted; goals are the reach
 * goals ({'foot.L': {sole: [x, y, z]}, ...}).
 */
/** How far over its reach the planted feet are (metres, can be negative: slack); see reachDrop. */
export function reachNeed(skeleton, solved, goals, {extension = 1, exclude = []} = {}){
 let need = -Infinity;
 for(const side of ['L', 'R']){
  const g = goals['foot.' + side];
  if(!g?.sole || exclude.includes(side)) continue;
  const at = n => skeleton.bones[skeleton.index.get(n + '.' + side)];
  const reachLen = (at('thigh').length + at('shin').length) * extension, hip = solved.get('thigh.' + side).head;
  const ankleY = g.sole[1] + at('foot').head[1], across = Math.hypot(hip.x - g.sole[0], hip.z - g.sole[2]);
  const highest = Math.sqrt(Math.max(0, reachLen * reachLen - across * across));
  need = Math.max(need, hip.y - ankleY - highest);
 }
 return need;
}

export function reachDrop(skeleton, solved, goals, {extension = 1, exclude = []} = {}){
 const need = reachNeed(skeleton, solved, goals, {extension, exclude});
 return need < 1e-9 ? 0 : need;
}

/** A smooth version of max(0, x) that is never below it: exactly x from x = w upward, 0 below -w, curved between. */
export function softPlus(x, w){
 if(x >= w) return x;
 if(x <= -w) return 0;
 return (x + w) * (x + w) / (4 * w);
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
 const eval1 = (c, t) => quintic(c.p0, c.v0, c.a0, c.p1, T, t);
 return {
  /** Current shift, one number per axis. */
  get value(){ return st.map(c => eval1(c, elapsed).p); },
  /** Current speed per axis (metres per second). */
  get speed(){ return st.map(c => eval1(c, elapsed).v); },
  /** Where it is heading, per axis. */
  get goal(){ return st.map(c => c.p1); },
  /** Re-plan toward new wanted values (an array, one per axis). Ignores changes under the deadband unless `exact` (used to come to rest exactly). */
  retarget(wanted, seconds = duration, exact = false){
   if(!exact && wanted.every((w, i) => Math.abs(w - st[i].p1) <= deadband)) return;
   if(exact && wanted.every((w, i) => w === st[i].p1)) return;
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
