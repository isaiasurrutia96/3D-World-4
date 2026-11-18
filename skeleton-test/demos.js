// Skeleton test · reaching demos (section 4). Pure functions of time, so the
// checks (skeleton-test/demos-check.mjs) can test exactly what the page shows.
//
// Every number here is either measured from the approved model, worked out
// from the skeleton's own bone lengths, or a stated choice:
//   squat / sit  thighs end exactly level (hips at knee height); the hips go
//                back so each shin tips forward 10° (the approved ankle allows
//                18°); feet stay planted and flat.
//   squat        the upper body leans forward at the hips up to 28° at the
//                bottom (gym squat), arms held level in front, eyes ahead.
//                28° because level thighs plus the lean must stay inside the
//                hip's 120° bend: 90° + 28° = 118°.
//   sit          upright; lowers once onto a simple block and stays; palms
//                rest on top of the thighs, three quarters of the way to the
//                knees, palms down, fingers pointing along the thigh to the knee
//                (thighRests(): a point measured on the thigh that rides with it). The block's top is measured to touch the
//                body exactly (seatTop()).
//   step         a simple block 15 cm tall, starting 3 cm in front of the toes
//                (measured on the foot model);
//                the foot rises straight up first (10 cm above the block: the
//                toes droop when the leg lifts, as the ankle pulls them up only
//                18°), moves over, then sets down,
//                so it never touches the block on the way.
//   ball         the palm centre touches a 3.5 cm ball circling in front of
//                him and faces its centre.
import {Vector3, Quaternion, Euler, Mesh, Raycaster} from 'three';
import {EASE} from '../motion-core/skeleton/pose.js';

const RAD = Math.PI / 180, ease = t => EASE.inOut(Math.min(1, Math.max(0, t)));
const band = (a, b, t) => ease((t - a) / (b - a));

/**
 * foot: the left foot model's reach in front of and behind the ankle at rest
 * ({toe, heel}, metres, measured on the mesh); defaults to the skeleton's
 * foot contact points.
 */
export function createDemos(skeleton, foot = null){
 const B = n => skeleton.bones[skeleton.index.get(n)];
 const L1 = B('thigh.L').length, L2 = B('shin.L').length, ankle = B('foot.L').head[1];
 const SOLE = {L: [B('foot.L').head[0], 0, B('foot.L').head[2]], R: [B('foot.R').head[0], 0, B('foot.R').head[2]]};
 const toeReach = foot?.toe ?? Math.max(...Object.values(skeleton.footContacts.L).map(p => p[2])) - B('foot.L').head[2];
 const heelReach = foot?.heel ?? B('foot.L').head[2] - Math.min(...Object.values(skeleton.footContacts.L).map(p => p[2]));
 const pelvis = new Vector3(...B('pelvis').head);
 const SHIN_TIP = 10 * RAD;
 /** Hip joints this far below standing, how far back they go so each shin tips SHIN_TIP. */
 const hipsBack = drop => {
  const kz = L2 * Math.sin(SHIN_TIP), ky = L2 * Math.cos(SHIN_TIP), h = L1 + L2 - drop;
  return Math.min(0, kz - Math.sqrt(Math.max(0, L1 * L1 - (h - ky) ** 2)));
 };
 /** The drop at which the thighs are exactly level. */
 const LEVEL = L1 + L2 * (1 - Math.cos(SHIN_TIP));
 /** Body position for a hip drop and a forward lean (turning about the pelvis control, between the hips). */
 const body = (drop, lean) => {
  const q = new Quaternion().setFromEuler(new Euler(lean * RAD, 0, 0)), c = pelvis.clone();
  const pos = c.clone().sub(c.clone().applyQuaternion(q)).add(new Vector3(0, -drop, hipsBack(drop)));
  return {position: pos.toArray(), rotation: {x: lean, y: 0, z: 0}};
 };
 const feet = {'foot.L': {sole: SOLE.L, heading: 0}, 'foot.R': {sole: SOLE.R, heading: 0}};

 // The step block (centre and size, metres).
 const STEP = {height: .15, depth: .55, width: .34, gap: .03};
 STEP.front = SOLE.L[2] + toeReach + STEP.gap;                      // its near edge, 3 cm past the toes
 STEP.centre = [SOLE.L[0], STEP.height / 2, STEP.front + STEP.depth / 2];
 const stepSoleZ = STEP.front + heelReach + .015;                    // heel lands 1.5 cm inside the near edge
 // The ball.
 const BALL = {radius: .035};

 return {
  SOLE, STEP, BALL, LEVEL, hipsBack,
  squat(t){
   const k = (1 - Math.cos(t * 1.8)) / 2, drop = LEVEL * k, lean = 28 * k, chest = 5 * k, tip = lean + chest;
   const neck = Math.min(20, tip * .5), head = Math.min(25, tip - neck);
   return {pose: {root: body(drop, lean), chest: {x: chest, y: 0, z: 0},
    // Arms level in front: hanging is 0, level forward is -90 in the world, less the lean.
    'upperArm.L': {x: -(90 - tip) * Math.min(1, k * 3), y: 0, z: 8}, 'upperArm.R': {x: -(90 - tip) * Math.min(1, k * 3), y: 0, z: -8},
    'lowerArm.L': {x: -10, y: 0, z: 0}, 'lowerArm.R': {x: -10, y: 0, z: 0},
    neck: {x: -neck, y: 0, z: 0}, head: {x: -head, y: 0, z: 0}}, goals: feet};
  },
  /** Sitting: lowers over 1.4 s, then stays. handGoals(palms) gives the palm goals once the thigh tops are known. */
  sit(t){
   const k = band(0, 1.4, t), drop = LEVEL * k;
   return {pose: {root: body(drop, 0)}, goals: feet, handWeight: k};
  },
  step(t){
   const c = t % 5, up = c < 1.6 ? band(0, 1.6, c) : c < 2.6 ? 1 : c < 4.2 ? 1 - band(2.6, 4.2, c) : 0;
   // Straight up first, over, then down onto the block (each overlapping smoothly).
   const clear = .10, y = (STEP.height + clear) * band(0, .32, up) - clear * band(.78, 1, up);
   const z = SOLE.L[2] + (stepSoleZ - SOLE.L[2]) * band(.3, .85, up);
   const shift = band(0, .25, up) - band(.75, 1, up), forward = band(.45, 1, up);
   return {pose: {root: {position: [-.025 * shift, -.01 * shift - .03 * forward, .12 * forward], rotation: {x: 0, y: 0, z: 0}}},
    goals: {'foot.L': {sole: [SOLE.L[0], y, z], heading: 0}, 'foot.R': {sole: SOLE.R, heading: 0}}};
  },
  ball(t){
   const a = t * 1.4, c = [.24 + .16 * Math.cos(a), 1.32 + .18 * Math.sin(a), .42 + .06 * Math.sin(2 * a)];
   return {pose: {}, ball: c, goals: {'hand.L': {touch: c, radius: BALL.radius}, ...feet}};
  },
 };
}

/**
 * The top of the sitting block: the lowest point of the pelvis and thighs over
 * the block's footprint, with the body posed seated (measured, so the block
 * touches him exactly). Returns {top, front, back} (metres).
 */
/** The left foot model's reach in front of and behind its ankle at rest (metres). */
export function footReach(avatar){
 const a = avatar.attached.find(x => x.label === 'foot.L'), P = a.mesh.geometry.attributes.position, z0 = avatar.skeleton.bones[avatar.skeleton.index.get('foot.L')].head[2];
 let lo = Infinity, hi = -Infinity; const v = new Vector3();
 for(let i = 0; i < P.count; i++){ v.fromBufferAttribute(P, i).applyMatrix4(a.rest); lo = Math.min(lo, v.z); hi = Math.max(hi, v.z); }
 return {toe: hi - z0, heel: z0 - lo};
}

export function seatTop(avatar, pose){
 avatar.apply(pose);
 const parts = avatar.attached.filter(a => /^(pelvis|thigh\.)/.test(a.label));
 const knee = avatar.solved.get('shin.L').head, hip = avatar.solved.get('thigh.L').head;
 const front = hip.z + .6 * (knee.z - hip.z);           // the block reaches 60% of the way to the knees
 let top = Infinity, back = Infinity;
 const v = new Vector3();
 for(const a of parts){
  const P = a.mesh.geometry.attributes.position;
  for(let i = 0; i < P.count; i++){
   v.fromBufferAttribute(P, i).applyMatrix4(a.mesh.matrix);
   back = Math.min(back, v.z);
   if(v.z <= front) top = Math.min(top, v.y);
  }
 }
 return {top, front, back};
}

/**
 * Where each palm rests when sitting: on the front of the thigh, three quarters
 * of the way from the hip to the knee, on the thigh's centre line (measured on
 * the thigh model at rest). The point rides on the thigh, so when he sits
 * (thigh level) it is the top of the thigh, and it moves smoothly all the way
 * down. Returns, per side, the point and the surface direction at rest.
 */
export function thighRests(avatar){
 const out = {}, sk = avatar.skeleton;
 for(const s of ['L', 'R']){
  const thigh = sk.bones[sk.index.get('thigh.' + s)], hip = new Vector3(...thigh.head), knee = new Vector3(...thigh.tail);
  const axis = knee.clone().sub(hip).normalize(), at = hip.clone().lerp(knee, .75);
  // Come in from the front, at rest, along the centre line: the first surface met.
  const a = avatar.attached.find(x => x.label === 'thigh.' + s), m = new Mesh(a.mesh.geometry);
  m.matrixAutoUpdate = false; m.matrix.copy(a.rest); m.matrixWorld.copy(a.rest);
  const hit = new Raycaster(at.clone().add(new Vector3(0, 0, .5)), new Vector3(0, 0, -1)).intersectObject(m, false)[0];
  if(!hit) throw Error('Thigh surface not found');
  const best = hit.point.clone();
  const normal = best.clone().sub(at); normal.sub(axis.clone().multiplyScalar(normal.dot(axis))).normalize();
  out[s] = {point: best, normal, head: hip};
 }
 return out;
}

/**
 * Palm goals for sitting, k = how far down he is (0 standing, 1 seated). The
 * hands travel naturally: from where they hang (base: the solved pose before
 * the hands are placed) to the thigh rest point, the palm turning from facing
 * in to facing down, the fingers from pointing down to pointing along the
 * thigh. At k = 1: palm centre on the thigh rest point, palm against the
 * thigh, fingers along the thigh toward the knee.
 */
export function sittingHands(solved, rests, k = 1, base = solved, skeleton = null){
 const goals = {};
 for(const s of ['L', 'R']){
  const t = solved.get('thigh.' + s), r = rests[s];
  const point = r.point.clone().sub(r.head).applyQuaternion(t.rotation).add(t.head), into = r.normal.clone().applyQuaternion(t.rotation).negate();
  const along = t.tail.clone().sub(t.head).normalize();
  if(!skeleton){ goals['hand.' + s] = {palm: point.toArray(), face: into.toArray(), fingers: along.toArray()}; continue; }
  // Where the palm is now, which way it faces and points (hands hanging).
  const h = base.get('hand.' + s), b = skeleton.bones[skeleton.index.get('hand.' + s)], H0 = new Vector3(...b.head);
  const palm0 = new Vector3(...skeleton.palms[s].point).sub(H0).applyQuaternion(h.rotation).add(h.head);
  const n0 = new Vector3(...skeleton.palms[s].normal).applyQuaternion(h.rotation);
  const f0 = new Vector3(...b.tail).sub(H0).applyQuaternion(h.rotation).normalize();
  const turn = (a, c) => a.clone().applyQuaternion(new Quaternion().slerp(new Quaternion().setFromUnitVectors(a, c), k));
  // The elbow keeps pointing the way it hangs (out and back), so the arm never flips.
  const sh = base.get('upperArm.' + s).head, el = base.get('lowerArm.' + s).head, line = h.head.clone().sub(sh).normalize();
  const pole = el.clone().sub(sh); pole.sub(line.multiplyScalar(pole.dot(line)));
  goals['hand.' + s] = {palm: palm0.lerp(point, k).toArray(), face: turn(n0, into).toArray(), fingers: turn(f0, along).toArray(), pole: pole.toArray()};
 }
 return goals;
}
