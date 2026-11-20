// Skeleton test · reaching demos (section 4). Pure functions of time, so the
// checks (skeleton-test/demos-check.mjs) can test exactly what the page shows.
//
// Every number here is either measured from the approved model, worked out
// from the skeleton's own bone lengths, or a stated choice:
//   squat / sit  driven by bend: the thighs turn from upright to exactly level
//                while each shin tips forward up to 10° (the approved ankle
//                allows 18°); the hips go down and back smoothly; feet stay
//                planted and flat.
//   squat        the upper body leans forward at the hips up to 28° at the
//                bottom (gym squat), arms held level in front, eyes ahead.
//                28° because level thighs plus the lean must stay inside the
//                hip's 120° bend: 90° + 28° = 118°.
//   sit          upright; lowers once onto a simple block and stays; palms
//                rest on top of the thighs, near the knees (73% of the way for the palm centre), palms down, fingers turned in toward each other (55°), elbows flared out
//                (thighRests(): a point measured on the thigh that rides with it). The block's top is measured to touch the
//                body exactly (seatTop()).
//   step         a simple block 15 cm tall, starting 3 cm in front of the toes
//                (measured on the foot model). The foot planner (motion-core/
//                skeleton/footplan.js) plans every step: the foot rises, moves
//                over with its toes hanging, and sets down flat, never touching
//                the block; the other foot stays planted; the balance layer
//                shifts the weight over the planted foot.
//   ball         the palm centre touches a 3.5 cm ball circling in front of
//                him and faces its centre.
//   run          the avatar jogs, runs flat out and slows down, at the game's own speeds (3.1 and 8.6 m/s); then comes home
//   walk         the avatar walks a scripted route (straight, a wide turn, straight) and walks back to where it
//                started before stopping; the gait (motion-core/skeleton/gait.js) is a plain function of speed and phase, like the wave.
//   look         a ball swings from side to side and up and down in front of
//                him (2.4 m away, up to 95° either side); the head leads, the
//                neck, chest and waist follow (motion-core/skeleton/look.js).
import {Vector3, Quaternion, Euler, Mesh, Raycaster} from 'three';
import {EASE} from '../motion-core/skeleton/pose.js';
import {createFootPlanner} from '../motion-core/skeleton/footplan.js';
import {createLook} from '../motion-core/skeleton/look.js';
import {createGait, attachGait} from '../motion-core/skeleton/gait.js';
import {createMoveController} from '../motion-core/controller.js';
import {MOVE_TUNING} from '../motion-core/tuning.js';

const RAD = Math.PI / 180, ease = t => EASE.inOut(Math.min(1, Math.max(0, t)));
const band = (a, b, t) => ease((t - a) / (b - a));
/** From value p0 (speed v0, acceleration a0) to p1 at rest, over T seconds; the value at time t. */
const quintic = (p0, v0, a0, p1, T, t) => {
 const s = Math.min(1, Math.max(0, t / T)), s2 = s * s, s3 = s2 * s, s4 = s3 * s, s5 = s4 * s;
 return (1 - 10 * s3 + 15 * s4 - 6 * s5) * p0 + (s - 6 * s3 + 8 * s4 - 3 * s5) * v0 * T + (.5 * s2 - 1.5 * s3 + 1.5 * s4 - .5 * s5) * a0 * T * T + (10 * s3 - 15 * s4 + 6 * s5) * p1;
};

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
 /**
  * Where the hip joints are for a bend k (0 standing, 1 thighs level): the
  * thigh turns from upright to level (k × 90°) while the shin tips forward
  * k × 10°, both smoothly, so the hips go down and back smoothly too (a
  * squat moves by joint angle; measuring it by height instead puts a sharp
  * corner at standing). Returns how far down and how far forward (−: back).
  */
 const hips = k => {
  const th = k * Math.PI / 2, be = k * SHIN_TIP;
  return {drop: L1 + L2 - (L2 * Math.cos(be) + L1 * Math.cos(th)), back: L2 * Math.sin(be) - L1 * Math.sin(th)};
 };
 /** The drop at which the thighs are exactly level. */
 const LEVEL = hips(1).drop;
 /** Body position for a bend k and a forward lean (turning about the pelvis control, between the hips). */
 const body = (k, lean) => {
  const q = new Quaternion().setFromEuler(new Euler(lean * RAD, 0, 0)), c = pelvis.clone(), h = hips(k);
  const pos = c.clone().sub(c.clone().applyQuaternion(q)).add(new Vector3(0, -h.drop, h.back));
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

 /** The ground height under a point (the floor, or the top of the step block): balance uses it to know which foot carries weight. */
 const ground = (x, z) => Math.abs(x - STEP.centre[0]) <= STEP.width / 2 && Math.abs(z - STEP.centre[2]) <= STEP.depth / 2 ? STEP.height : 0;

 /**
  * The stepping demo. The foot planner plans each step (up onto the block, later back to the floor);
  * the body follows the foot: it leans forward by how far across the foot has come.
  */
 function stepper(shape = {}){
  const planner = createFootPlanner(skeleton, {ground}), floor = [SOLE.L[0], SOLE.L[2]], top = [SOLE.L[0], stepSoleZ];
  let next = 0, stopped = false;
  // Steps are scheduled as time reaches them (planning is a pure function of time, so asking again is harmless).
  const ensure = t => {
   while(!stopped){
    const up = next % 2 === 0, at = Math.floor(next / 2) * 5 + (up ? 0 : 2.6);
    if(at > t) break;
    planner.stepTo('L', at, {sole: up ? top : floor}, {duration: 1.6, ...shape});
    next++;
   }
  };
  return {
   planner,
   at(t){
    ensure(t);
    const z = planner.state('L', t).sole[2], across = Math.min(1, Math.max(0, (z - floor[1]) / (top[1] - floor[1]))), forward = band(.45, 1, across);
    return {pose: {root: {position: [0, -.03 * forward, .12 * forward], rotation: {x: 0, y: 0, z: 0}}}, goals: planner.goals(t)};
   },
   /** Bring the foot back to the floor: from the block, or turning round mid-step, carrying its speed. */
   stop(t){
    ensure(t);
    stopped = true;
    const to = planner.destination('L', t);
    if(Math.abs(to[0] - floor[0]) > 1e-9 || Math.abs(to[2] - floor[1]) > 1e-9) planner.stepTo('L', t, {sole: floor}, {duration: 1.6, ...shape});
   },
  };
 }
 const defaultStepper = stepper();

 return {
  skeleton, SOLE, STEP, BALL, LEVEL, hips, feet, body, ground,
  squat(t){
   const k = (1 - Math.cos(t * 1.8)) / 2, lean = 28 * k, chest = 5 * k, tip = lean + chest;
   const neck = Math.min(20, tip * .5), head = Math.min(25, tip - neck);
   return {pose: {root: body(k, lean), chest: {x: chest, y: 0, z: 0},
    // Arms level in front: hanging is 0, level forward is -90 in the world, less the lean.
    'upperArm.L': {x: -(90 - tip) * band(0, 1 / 3, k), y: 0, z: 8}, 'upperArm.R': {x: -(90 - tip) * band(0, 1 / 3, k), y: 0, z: -8},
    'lowerArm.L': {x: -10, y: 0, z: 0}, 'lowerArm.R': {x: -10, y: 0, z: 0},
    neck: {x: -neck, y: 0, z: 0}, head: {x: -head, y: 0, z: 0}}, goals: feet};
  },
  /** Sitting: lowers over 1.4 s, then stays. handGoals(palms) gives the palm goals once the thigh tops are known. */
  sit(t){
   const k = band(0, 1.4, t);
   return {pose: {root: body(k, 0)}, goals: feet, handWeight: k};
  },
  /** The step demo's pose and feet at a time in the 5 s cycle (up 1.6 s, wait, back down 1.6 s, wait). */
  step(t){ return defaultStepper.at(t); },
  /** A new step demo: planned by the foot planner; stop(t) brings the foot back to the floor from wherever it is. */
  stepper,
  /** Where the look demo's ball is at a time: swinging up to 95° to either side and 15° up and down, 2.4 m from his head. */
  look(t){
   const head = new Vector3(...B('head').head), yaw = 95 * Math.sin(.7 * t) * RAD, up = 15 * Math.sin(1.1 * t) * RAD;
   return {target: head.add(new Vector3(Math.sin(yaw) * Math.cos(up), Math.sin(up), Math.cos(yaw) * Math.cos(up)).multiplyScalar(2.4)).toArray()};
  },
  /** The stick for the walk demo at a time: [x, z] in the world (length 0..1): standing, straight, a wide turn, straight. */
  walkStick(t){
   const ramp = Math.min(1, Math.max(0, (t - .6) / 1.2)), strength = .2 * ramp; // (a walk: about 1.1 m/s at the game's own speeds)
   if(t < .6) return [0, 0];
   const turn = t < 4.5 ? 0 : t < 9 ? (t - 4.5) / 4.5 * Math.PI * .75 : Math.PI * .75; // heading, radians
   return [Math.sin(turn) * strength, Math.cos(turn) * strength];
  },
  /** The stick for the run demo: stand, a jog, a run, the fastest run with a wide turn, then slowing right down (the game's own speeds). */
  runStick(t){
   if(t < .6) return [0, 0];
   const strength = t < 3.5 ? .3 + .25 * Math.min(1, (t - .6) / 1) : t < 7 ? .55 + .45 * Math.min(1, (t - 3.5) / 1.5) : t < 10 ? 1 : t < 12 ? .55 : .3;
   const turn = t < 5 ? 0 : t < 9 ? (t - 5) / 4 * Math.PI * .6 : Math.PI * .6;
   return [Math.sin(turn) * strength, Math.cos(turn) * strength];
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
 * Where each palm rests when sitting: on the front of the thigh, PALM_ALONG
 * (78%) of the way from the hip to the knee, so the fingers reach over the knee
 * (closer than 78% the arms reach their shoulder limit and flip), on the thigh's centre line (measured on
 * the thigh model at rest). The point rides on the thigh, so when he sits
 * (thigh level) it is the top of the thigh, and it moves smoothly all the way
 * down. Returns, per side, the point and the surface direction at rest.
 */
export function thighRests(avatar){
 const out = {}, sk = avatar.skeleton;
 for(const s of ['L', 'R']){
  const thigh = sk.bones[sk.index.get('thigh.' + s)], hip = new Vector3(...thigh.head), knee = new Vector3(...thigh.tail);
  const axis = knee.clone().sub(hip).normalize(), at = hip.clone().lerp(knee, PALM_ALONG);
  // Come in from the front, at rest, along the centre line: the first surface met.
  const a = avatar.attached.find(x => x.label === 'thigh.' + s), m = new Mesh(a.mesh.geometry);
  m.matrixAutoUpdate = false; m.matrix.copy(a.rest); m.matrixWorld.copy(a.rest);
  const hit = new Raycaster(at.clone().add(new Vector3(0, 0, .5)), new Vector3(0, 0, -1)).intersectObject(m, false)[0];
  if(!hit) throw Error('Thigh surface not found');
  const best = hit.point.clone();
  const normal = best.clone().sub(at); normal.sub(axis.clone().multiplyScalar(normal.dot(axis))).normalize();
  // The thigh's thickness there (its axis to its surface), for the fingers to wrap around.
  out[s] = {point: best, normal, head: hip, radius: best.clone().sub(at).sub(axis.clone().multiplyScalar(best.clone().sub(at).dot(axis))).length()};
 }
 return out;
}

/**
 * Palm goals for sitting, k = how far down he is (0 standing, 1 seated). The
 * hands travel naturally: from where they hang (base: the solved pose before
 * the hands are placed) to the thigh rest point, the palm turning from facing
 * in to facing down, the fingers from pointing down to pointing along the
 * thigh. At k = 1: palm centre on the thigh rest point, palm against the
 * thigh, fingers turned in toward each other.
 */
/** How far along the thigh (hip 0, knee 1) the seated palm centres rest: near the knee, so the fingers hold it (the palm centre is halfway along the palm). */
export const PALM_ALONG = .73;

/** How far the seated hands turn in toward the middle of the body (degrees; the owner's wish: fingers almost pointing at each other, thumbs toward the belly button). */
/** How far the seated elbows swing out (0 keeps them hanging; 1 adds a sideways push as long as the hanging offset). */
export const ELBOW_OUT = 1.25;

export const HANDS_IN = 55;

export function sittingHands(solved, rests, k = 1, base = solved, skeleton = null){
 const goals = {};
 for(const s of ['L', 'R']){
  const t = solved.get('thigh.' + s), r = rests[s];
  const point = r.point.clone().sub(r.head).applyQuaternion(t.rotation).add(t.head), into = r.normal.clone().applyQuaternion(t.rotation).negate();
  // Fingers along the thigh, turned HANDS_IN° toward the middle of the body (about the way
  // the palm faces): the middle fingers aim at each other and the thumbs angle back toward the belly.
  const along = t.tail.clone().sub(t.head).normalize().applyAxisAngle(into, (s === 'L' ? 1 : -1) * HANDS_IN * Math.PI / 180);
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
  // Sitting: the elbows swing out as the hands arrive, so the forearms can angle in toward the lap.
  const ln = h.head.clone().sub(sh).normalize(), flare = new Vector3(s === 'L' ? 1 : -1, 0, 0); flare.sub(ln.clone().multiplyScalar(flare.dot(ln)));
  pole.addScaledVector(flare.normalize(), ELBOW_OUT * k * pole.length());
  // Once the palm is on the thigh the fingers wrap around the thigh and over the knee
  // (each stops where it touches), easing in as the hands arrive.
  const knee = t.tail, holds = {shapes: [{capsule: [t.head.toArray(), knee.toArray()], radius: r.radius}, {sphere: knee.toArray(), radius: r.radius}], opposition: .3, outer: true, from: 0, weight: band(.8, 1, k)};
  goals['hand.' + s] = {palm: palm0.lerp(point, k).toArray(), face: turn(n0, into).toArray(), fingers: turn(f0, along).toArray(), pole: pole.toArray(), grip: holds};
 }
 return goals;
}

/**
 * Runs the demos on the pose player, through its smooth layers, so every start
 * and every stop is smooth (nothing is computed outside the player):
 *   sit    the body lowers (a transition), feet planted (a reaching layer), the
 *          hands fade onto the thighs (a reaching layer). Stop: stands up the same
 *          way, hands let go, and the feet are released only once he is standing.
 *   squat  a moving layer, feet planted. Stop: the layer fades out (he rises),
 *          feet released once he is up.
 *   step   a moving layer and a moving feet layer. Stop: the foot goes back
 *          down the same path it came, then both are released.
 *   ball   a hand reaching layer. Stop: it fades out.
 */
/** Seconds balance needs to ease out (more than its 0.5 s) before the feet may be let go. */
const SETTLE = .6;

export function createDemoRunner(player, D, rests){
 let active = null, pending = null, began = 0, stepper = null, walk = null;
 const now = () => player.time;
 /** Hands layer for sitting: k(t) = how far the hands are along their path to the thighs. */
 const sitHands = k => player.setGoals('hands', (t, pose, sk) => { const q = sk.solve(pose); return sittingHands(q, rests, k(t), q, sk); }, {fade: 0, glide: .2});
 /** Walk and Run share one body: the game's own movement rules drive a gait (a plain function of speed and phase). */
 function startLocomotion(kind){
  const ctl = createMoveController({...MOVE_TUNING, turnFirstAngle: 1.22});
  const gait = createGait(D.skeleton, {});
  attachGait(player, gait);
  walk = {ctl, gait, t: 0, homing: false, kind};
 }
 /** Let go of a walk or run at once (another button was pressed): clean, never left running in the background. */
 function abortLocomotion(){
  if(!walk) return;
  player.clearBalance(); player.clearLayer('walk', .12); player.clearGoals('feet', 0); // (the feet go at once: their goals stay where he was, far from the start he is put back to)
  walk = null;
 }
 const run = {
  sit(){ player.transitionTo({root: D.body(1, 0)}, {duration: 1.4}); player.setGoals('feet', D.feet, {fade: 0});
   // The hands travel from hanging to the thighs along a path, arriving as he sits.
   sitHands(t => band(0, 1.4, t)); },
  squat(){ player.setLayer('squat', {fn: t => D.squat(t).pose, fade: .5}); player.setGoals('feet', D.feet, {fade: 0}); },
  step(){ stepper = D.stepper(); const st = stepper; player.setLayer('step', {fn: t => st.at(t).pose, fade: .3}); player.setGoals('feet', t => st.at(t).goals, {fade: 0}); player.setBalance({ground: D.ground}); },
  ball(){ player.setGoals('ball', t => ({'hand.L': D.ball(t).goals['hand.L']}), {fade: .6}); },
  walk(){ startLocomotion('walk'); },
  run(){ startLocomotion('run'); },
  look(){ const look = createLook(D.skeleton); player.setLayer('look', {fn: t => look.sample(t, D.look(t).target).pose, fade: .5}); },
 };
 const end = {
  sit(){
   // Stand up the same way: the hands travel back to hanging (from wherever they are, at
   // the speed they are moving), then everything lets go.
   const t0 = now() - began, k0 = band(0, 1.4, t0), h = 1 / 240, v0 = (band(0, 1.4, t0 + h) - band(0, 1.4, t0 - h)) / (2 * h);
   player.transitionTo({}, {duration: 1.4}); sitHands(t => quintic(k0, v0, 0, 0, 1.4, t));
   // The hands layer fades out over the same time, so letting go at the end is invisible.
   player.clearGoals('hands', 1.4); player.clearGoals('feet', 0, {after: 1.4});
  },
  squat(){ player.clearLayer('squat', .8); player.clearGoals('feet', 0, {after: .8}); },
  step(){
   // The foot goes back to the floor from wherever it is (the planner carries its speed, so turning
   // back never jolts); once it is down balance eases out (the body rises from its ready stance and
   // returns to the middle), and only then are the feet let go.
   stepper.stop(now() - began);
   player.clearLayer('step', 0, {after: 1.6}); player.clearBalance({after: 1.6}); player.clearGoals('feet', 0, {after: 1.6 + SETTLE});
  },
    ball(){ player.clearGoals('ball', .6); },
  look(){ player.clearLayer('look', .8); },
  walk(){ if(walk) walk.homing = true; },
  run(){ if(walk) walk.homing = true; },
 };
 return {
  /**
   * Call once a frame BEFORE player.update(dt): moves what runs outside the player (the walking body and its feet).
   * A stopped walk keeps going until the body is back where it started and standing, then lets go.
   */
  tick(dt){
   // A demo waiting its turn starts as soon as the avatar is free (nothing left playing).
   if(pending && !active && !walk && !player.layers.length && !player.goalLayers.length && !player.balanceShift){ const n = pending; pending = null; active = n; began = now(); run[n](); }
   if(!walk) return;
   walk.t += dt;
   let wish;
   if(!walk.homing) wish = walk.kind === 'run' ? D.runStick(walk.t) : D.walkStick(walk.t);
   else {
    // Stopped by the owner: come to a halt first, then walk back to the start by way of a spot a little behind it, so it
    // arrives facing the way it began; feet square again, it lets go.
    const s = walk.ctl.state;
    if((walk.leg ?? 1) === 1 && walk.halted && Math.hypot(s.x, s.z + 1.2) < .3){ walk.leg = 2; walk.halted = false; walk.facingHome = false; } // (stop, turn on the spot, go on)
    const aim = walk.leg === 2 ? [0, 0] : [0, -1.2], dx = aim[0] - s.x, dz = aim[1] - s.z, d = Math.hypot(dx, dz);
    if(!walk.halted && s.speed < .03 && walk.gait.settled) walk.halted = true;
    // Turn on the spot first (a tiny push on the stick turns the body but hardly moves it, and the feet step round by
    // themselves), and walk only once the feet face the way to go.
    const way = Math.atan2(dx, dz) * 180 / Math.PI, goals = walk.gait.goals(walk.gait.time);
    const off = ['L', 'R'].map(f => Math.abs(((goals['foot.' + f].heading - way) % 360 + 540) % 360 - 180));
    if(d > .15 && Math.max(...off) < 25) walk.facingHome = true;
    const push = walk.kind === 'run' ? Math.min(.5, .12 + d * .1) : Math.min(.34, .12 + d * .3);
    wish = !walk.halted ? [0, 0] : d <= .05 ? [0, 0] : !walk.facingHome ? [dx / d * .03, dz / d * .03] : [dx / d * push, dz / d * push];
    walk.square = walk.leg === 2 && d <= .05 && Math.max(...['L', 'R'].map(f => Math.abs(((goals['foot.' + f].heading) % 360 + 540) % 360 - 180))) < 21;
   }
   walk.ctl.state.hold = walk.gait.holdMove;
   walk.ctl.advance(dt, wish[0], wish[1]);
   const s = walk.ctl.state;
   walk.gait.update(dt, {x: s.x, z: s.z, facing: s.facing, vx: s.vx, vz: s.vz, speed: s.speed, aim: s.aim});
   // (Let go only after standing still and square for a moment, so no closing step is left to start.)
   walk.still = walk.homing && walk.square && s.speed < .02 && walk.gait.settled && walk.gait.activity < .01 ? (walk.still ?? 0) + dt : 0;
   // (Never stuck for ever: if it has not got home and squared up within 60 seconds, it lets go anyway.)
   if(walk && walk.homing) walk.homeT = (walk.homeT ?? 0) + dt;
   if(walk.still > .3 || (walk.homeT ?? 0) > 60){
    player.clearBalance(); player.clearLayer('walk', .5, {after: .4}); player.clearGoals('feet', .1, {after: .4});
    walk = null;
   }
  },
  /**
   * Start a demo. If another one is running, it is stopped the way it stops by itself (sit stands up, and so on) and the new
   * one starts when the avatar is standing free again: only one thing ever drives the avatar, so two can never fight.
   * A walk or run lets go at once (it would take half a minute to walk home).
   */
  start(name){
   if(!run[name]) return;
   if(walk){ abortLocomotion(); active = null; pending = name; return; } // (it starts the moment the avatar is free: see tick)
   if(active){ pending = name; this.stop(); return; }
   pending = null; active = name; began = now(); run[name]();
  },
  stop(){ pending = null; if(!active) return; end[active](); active = null; },
  get active(){ return pending ?? active; },
  /** Is a walk still going on (the walking body has not yet come home and stopped)? */
  get walking(){ return !!walk; },
  /** Time since the current demo began (for props such as the ball). */
  get time(){ return now() - began; },
 };
}
