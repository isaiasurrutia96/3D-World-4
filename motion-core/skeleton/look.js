// Upper body · looking and aiming. The head, neck, chest and waist turn together to point the face at a place.
//
//   lookAt(skeleton, pose, target, options) → {pose, error, saturated}
//   createLook(skeleton, options)           → a smooth follower: the head leads, the body follows
//
// The turn is shared between the waist (turns only), chest (bends a little forward, turns a little), neck and
// head, in proportion to weights (the head does most, the waist least), and never past any joint's limit: what
// one joint cannot take is passed to the others. Looking behind is as far as the joints allow (never a snap
// to the other side): the side it was already on is kept until the target is clearly on the other one.
import {Euler, Vector3} from 'three';
import {createShiftFollower} from './balance.js';

const RAD = Math.PI / 180;
const wrap = a => ((a + 180) % 360 + 360) % 360 - 180;

/** The default shares of a turn (they only need to be in proportion). The head leads. */
export const LOOK_WEIGHTS = Object.freeze({
 yaw: {spine: .12, chest: .08, neck: .30, head: .50},
 pitch: {chest: .15, neck: .35, head: .50},
});

/**
 * Share `total` between parts in proportion to their weights, never past a part's [lo, hi]: a part that is full
 * takes only what it can and the rest is shared by the others. Returns the amounts, and what could not be placed.
 */
export function distribute(total, parts){
 const out = parts.map(() => 0), free = new Set(parts.keys());
 let rest = total;
 for(let guard = 0; guard < parts.length + 1 && free.size && Math.abs(rest) > 1e-12; guard++){
  const w = [...free].reduce((s, i) => s + parts[i].w, 0);
  if(w <= 0) break;
  let capped = false;
  for(const i of [...free]){
   const want = out[i] + rest * parts[i].w / w, c = Math.min(parts[i].hi, Math.max(parts[i].lo, want));
   if(c !== want){ // full: it takes what it can, and leaves the others to share the rest
    rest -= c - out[i]; out[i] = c; free.delete(i); capped = true; break;
   }
  }
  if(!capped){ for(const i of free) out[i] += rest * parts[i].w / w; rest = 0; break; }
 }
 return {amounts: out, left: rest};
}

const limitsOf = (skeleton, bone, k) => skeleton.bones[skeleton.index.get(bone)].limits[k];
const yawOf = d => Math.atan2(d.x, d.z) / RAD;
const downOf = d => -Math.asin(Math.max(-1, Math.min(1, d.y / d.length()))) / RAD;

/**
 * The joint angles that point the face at `target` (a world point). `pose` is the full pose of the rest of the
 * body (its root says where and which way the body faces). options: weights, side (+1 / -1: which way to keep
 * turning when the target is nearly behind). Returns the angles for spine, chest, neck and head, how far the face
 * is still from the target (degrees), and whether a joint limit stopped it.
 */
export function lookAt(skeleton, pose, target, {weights = LOOK_WEIGHTS, side = 0} = {}){
 const base = {...pose};
 for(const b of ['spine', 'chest', 'neck', 'head']) base[b] = {...skeleton.bones[skeleton.index.get(b)].rest};
 const tp = target instanceof Vector3 ? target : new Vector3(...target);
 const solve0 = skeleton.solve(base), headAt = solve0.get('head').head;
 const want = tp.clone().sub(headAt);
 if(want.lengthSq() < 1e-12) return {pose: {spine: {x: 0, y: 0, z: 0}, chest: {x: 0, y: 0, z: 0}, neck: {x: 0, y: 0, z: 0}, head: {x: 0, y: 0, z: 0}}, error: 0, saturated: false};
 // The yaw that the face needs, relative to where the pelvis faces now.
 const pelvisYaw = new Euler().setFromQuaternion(solve0.get('pelvis').rotation, 'YXZ').y / RAD;
 const yawParts = ['spine', 'chest', 'neck', 'head'].map(b => ({b, w: weights.yaw[b], lo: limitsOf(skeleton, b, 'y')[0], hi: limitsOf(skeleton, b, 'y')[1]}));
 const pitchParts = ['chest', 'neck', 'head'].map(b => ({b, w: weights.pitch[b], lo: limitsOf(skeleton, b, 'x')[0], hi: limitsOf(skeleton, b, 'x')[1]}));
 const yawRange = [yawParts.reduce((s, p) => s + p.lo, 0), yawParts.reduce((s, p) => s + p.hi, 0)];
 let needYaw = wrap(yawOf(want) - pelvisYaw), needDown = downOf(want);
 // Nearly behind: keep to the side the head was already on (the turn is more than it can take, either way).
 if(side && Math.abs(needYaw) > 150 && Math.sign(needYaw) !== side) needYaw += 360 * side;
 if(Math.hypot(want.x, want.z) < 1e-3) needYaw = 0; // straight up or down: no turn is asked for
 let totalYaw = needYaw, totalDown = needDown, angles = null, err = 0;
 for(let it = 0; it < 14; it++){
  const y = distribute(totalYaw, yawParts), p = distribute(totalDown, pitchParts);
  angles = {spine: {x: 0, y: y.amounts[0], z: 0}, chest: {x: p.amounts[0], y: y.amounts[1], z: 0}, neck: {x: p.amounts[1], y: y.amounts[2], z: 0}, head: {x: p.amounts[2], y: y.amounts[3], z: 0}};
  // Where the face really points now (the joints turn about different axes, and the head moves a little as the
  // chest bends, so the shares are not exact): correct the shares by what is left.
  const q = skeleton.solve({...base, ...angles}).get('head'), f = new Vector3(0, 0, 1).applyQuaternion(q.rotation), now = tp.clone().sub(q.head);
  err = f.angleTo(now) / RAD;
  if(err < 1e-4) break;
  const dyaw = wrap(yawOf(now) - yawOf(f)), ddown = downOf(now) - downOf(f);
  if(Math.hypot(now.x, now.z) > 1e-3) totalYaw += dyaw;
  totalDown += ddown;
 }
 const saturated = err > .05;
 return {pose: angles, error: err, saturated};
}

/**
 * The head's own angles (x, y) that point the face at `target` when the waist, chest and neck are as given
 * (they may be behind where they are heading): the head makes up what they have not done yet, within its limits.
 */
function aimHead(skeleton, base, others, target, start){
 const tp = target instanceof Vector3 ? target : new Vector3(...target);
 const L = ['x', 'y'].map(k => limitsOf(skeleton, 'head', k));
 let hx = start.x, hy = start.y;
 for(let it = 0; it < 8; it++){
  const q = skeleton.solve({...base, ...others, head: {x: hx, y: hy, z: 0}}).get('head'), f = new Vector3(0, 0, 1).applyQuaternion(q.rotation), now = tp.clone().sub(q.head);
  if(f.angleTo(now) < 1e-4 * RAD) break;
  hy = Math.min(L[1][1], Math.max(L[1][0], hy + wrap(yawOf(now) - yawOf(f))));
  hx = Math.min(L[0][1], Math.max(L[0][0], hx + downOf(now) - downOf(f)));
 }
 return {x: hx, y: hy, z: 0};
}

/**
 * A smooth follower for looking. Call sample(t, target, pose) each frame (t in seconds, never going back; the
 * same t asked for twice gives the same answer): it returns the angles to apply. Every joint chases its answer on
 * its own time (the head fastest, the waist slowest), so the head turns first and the body follows, and each
 * arrives exactly (the curves are the same smooth quintics as balance's).
 *   times: seconds each part takes to turn (default head 0.18, neck 0.28, chest 0.4, waist 0.55)
 *   maxSpeed: the fastest each part may turn, degrees a second (default head 600, neck 400, chest 220, waist 160):
 *     a big change (a target that flips to the other side) takes as long as it needs instead of whipping round
 */
export function createLook(skeleton, {times = {head: .18, neck: .28, chest: .4, spine: .55}, maxSpeed = {head: 600, neck: 400, chest: 220, spine: 160}, weights = LOOK_WEIGHTS} = {}){
 const channels = [['spine', 'y'], ['chest', 'x'], ['chest', 'y'], ['neck', 'x'], ['neck', 'y'], ['head', 'x'], ['head', 'y']];
 const followers = channels.map(([b]) => createShiftFollower({duration: times[b], deadband: 1e-4, size: 1}));
 let last = null, side = 0, current = {spine: {x: 0, y: 0, z: 0}, chest: {x: 0, y: 0, z: 0}, neck: {x: 0, y: 0, z: 0}, head: {x: 0, y: 0, z: 0}}, result = null;
 const read = () => {
  const out = {spine: {x: 0, y: 0, z: 0}, chest: {x: 0, y: 0, z: 0}, neck: {x: 0, y: 0, z: 0}, head: {x: 0, y: 0, z: 0}};
  channels.forEach(([b, k], i) => { out[b][k] = followers[i].value[0]; });
  return out;
 };
 return {
  sample(t, target, pose = {}){
   if(last !== null && t < last - 1e-12) throw Error('look.sample: time must not go back');
   if(last === null || t > last){
    const aim = lookAt(skeleton, pose, target, {weights, side}), totalYaw = Object.values(aim.pose).reduce((s, a) => s + a.y, 0);
    if(Math.abs(totalYaw) > 20) side = Math.sign(totalYaw);
    // Each joint takes its own time, but never turns faster than it can: a quintic's top speed is 1.875 times
    // distance over time, so a long way takes longer.
    const dt = last === null ? 0 : t - last, headIdx = channels.map(([b]) => b).indexOf('head');
    channels.forEach(([b, k], i) => { if(b === 'head') return; const away = Math.abs(aim.pose[b][k] - followers[i].value[0]); followers[i].retarget([aim.pose[b][k]], Math.max(times[b], 1.875 * away / maxSpeed[b])); });
    channels.forEach(([b], i) => { if(b !== 'head') followers[i].update(dt); });
    // The head leads: it points where the face must go given where the waist, chest and neck have got to so far.
    const body = read(), others = {spine: body.spine, chest: body.chest, neck: body.neck}, base = {...pose};
    for(const b of ['spine', 'chest', 'neck', 'head']) base[b] = {...skeleton.bones[skeleton.index.get(b)].rest};
    const headGoal = aimHead(skeleton, base, others, target, {x: aim.pose.head.x, y: aim.pose.head.y});
    for(const k of ['x', 'y']){ const i = channels.findIndex(([b, kk]) => b === 'head' && kk === k), away = Math.abs(headGoal[k] - followers[i].value[0]); followers[i].retarget([headGoal[k]], Math.max(times.head, 1.875 * away / maxSpeed.head)); followers[i].update(dt); }
    aim.pose.head = headGoal;
    last = t; current = read(); result = {pose: current, error: aim.error, saturated: aim.saturated, target: aim.pose};
   }
   return result;
  },
  /** The angles it is heading for now. */
  get goal(){ return result?.target ?? null; },
  /** Where it starts from: look straight ahead at once. */
  reset(){ followers.forEach(f => f.reset([0])); last = null; side = 0; result = null; },
 };
}
