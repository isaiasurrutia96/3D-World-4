// Walking and running, made the way the wave is made: everything is a plain function of time, speed and facing
// (a repeating cycle, like a clip), with no step-by-step decisions. It cannot get into a state; pressing a button, a
// slow frame or a jumpy frame cannot confuse it. It is a stylised, arcade gait on purpose: the game's speeds
// (3.1 m/s walking up to 8.6 m/s running) are far beyond what this avatar's short legs could do the real way, so the
// cycle gets quicker and leaps further as he speeds up, and at the top speeds the feet skate a little on the ground
// (the way a cartoon runner does) instead of snapping.
//
//   const gait = createGait(skeleton, {ground})
//   attachGait(player, gait)                     // feet goals, arms/torso layer, height (balance without a weight shift)
//   each frame:  gait.update(dt, body)           // body: {x, z, facing, vx, vz, speed, aim?} from the movement rules
//                player.update(dt)
//
// The cycle (one foot's turn, p from 0 to 1; the other foot is half a turn behind):
//   stance  p in [0, duty)   the foot is on the ground and moves back past the body (heel strike, flat, heel up)
//   swing   p in [duty, 1)   it leaves the ground, swings forward over an arc and lands again
// Slow, a foot is down more than half the time (a walk). Fast, less than half: between steps both feet are in the air
// (a run). The two are blended by speed, so there is no switch. Cadence, stride, lift, arm swing, elbow bend, lean and
// body bounce all follow the speed. Standing still, the feet rest under the body; turning on the spot, they step in place.
// Leaning into a turn is part of it (the athletic, arcade lean).
import {createFootPlanner} from './footplan.js';

const DEG = 180 / Math.PI;

/** The numbers of the gait (metres, seconds, degrees). Every one can be changed. */
export const GAIT = Object.freeze({
 footHalfWidth: .09,      // moving, each foot's centre line is this far from the body's middle line...
 swingRelax: .6,          // the foot is less pointed in the middle of a swing by this share (a relaxed foot; it also keeps the hip from twisting)
 swingWiden: .06,         // running: a swinging foot goes this much further out from the middle line (metres)
 standHalfWidth: .15,     // ...standing, this far (the skeleton's own rest stance, so letting go of the gait changes nothing)
 walkCadence0: 1.9,       // walking: steps a second at a crawl...
 walkCadencePer: .55,     // ...plus this for each metre a second
 runCadence0: 2.7,        // running: steps a second at a jog...
 runCadencePer: .30,      // ...plus this for each metre a second
 maxCadence: 5,           // the quickest the legs go (steps a second)
 runFrom: 1.0,            // between these two speeds (m/s) the walk turns into a run
 runTo: 2.0,
 walkDuty: .62,           // the share of a foot's turn spent on the ground when walking
 runDuty: .44,            // running: this at the start of a run...
 runDutyPer: .016,        // ...less this for each metre a second...
 minDuty: .3,             // ...but never less than this
 maxStance: .45,           // a foot never moves further than this back past the body during its stance (beyond that it skates)
 walkLift: .04,           // walking: the foot clears the ground by this in mid-swing...
 walkLiftPer: .02,        // ...plus this for each metre a second
 runLift: .07,            // running: ...
 runLiftPer: .035,
 maxLift: .12,
 walkStanceEase: .08,      // walking: the same, over this share (small, so the planted foot hardly slides)
 stanceEase: .25,          // the foot speeds up (and slows down) past the body over this share of its stance
 velocityMatch: 0,        // a foot leaves and lands moving back past the body at this share of its stance speed (1 = no jerk at all, but it swings further back)
 heelStrike: -6,          // walking: the foot lands toes up by this much (degrees)
 toeOff: 14,              // walking: and leaves heel up by this much
 forefootFrom: 1,     // running slower than this, the foot lands flat; faster, it lands and stays on its toes, more and more (a sprinter's forefoot)
 forefootTo: 2.5,
 runPitch: 32,           // running: the foot lands and stays toes-down by this much (forefoot, which also keeps the ankle inside its range)
 runToeOff: 46,          // running: heel up this much at toe-off
 walkBob: .012,           // walking: the body rises and falls this much each step (metres)...
 walkBobPer: .008,
 maxWalkBob: .03,
 runBob: .015,            // running: it sinks over the standing foot by this much...
 runBobPer: .004,
 maxRunBob: .030,
 runCrouch0: .02,        // running: it rides lower than standing by this much at a jog...
 runCrouchPer: .01,      // ...plus this for each metre a second...
 runCrouch: .04,          // running: and rides this much lower than standing
 moveExtension: .985,    // moving, the leg is never straighter than this share of its length (a straight knee jerks; a bent one is smooth and athletic)
 walkSlack: .012,         // walking: the standing leg stays this much short of straight
 standSlack: .001,        // standing: this much
 armWalk: 12,             // arm swing (degrees at the shoulder): walking 12 plus 14 for each metre a second (at most 28)...
 armWalkPer: 14,
 maxArmWalk: 28,
 armRun: 35,              // ...running 35 plus 4 for each metre a second (at most 70)
 armRunPer: 4,
 maxArmRun: 70,
 elbowWalk: 20,           // elbow bend (degrees)
 elbowRun: 90,
 pelvisYaw: 3,            // the pelvis turns toward the forward leg: 3 degrees plus 2.5 for each metre a second (at most 3 m/s)
 pelvisYawPer: 2.5,
 chestYaw: 1.3,           // the chest turns back this many times as far
 leanPer: 1.1,            // running: the whole body leans forward this many degrees for each metre a second (at most 10)
 maxLean: 10,
 chestLeanPer: 1.6,       // and the chest this many more (at most 15)
 bank: .35,               // leaning into a turn: the lean (degrees) is this times the turn rate (radians a second) times the speed times 5
 maxBank: 8,
 attack: .12,             // seconds the stepping takes to build up when he starts moving...
 release: .35,            // ...and to settle when he stops
 maxTurnRate: 400,        // the fastest the body is drawn turning (degrees a second)
 styleSmoothing: .25,     // seconds over which walk turns into run (or back) in style: arms, elbows, lean
 speedSmoothing: .06,     // seconds over which the gait follows a change of speed (so nothing in it jumps)
 turnStepFrom: 40,        // turning on the spot faster than this (degrees a second) makes him step in place; fully at turnStepTo
 turnStepTo: 220,
 turnFirst: true,         // false: never hold him back for a big turn from standing
 pivotAngle: 70,          // a turn bigger than this (degrees) from standing is made on the spot first
});

const wrapDeg = a => ((a + 180) % 360 + 360) % 360 - 180;
const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
const frac = x => x - Math.floor(x);

export function createGait(skeleton, {ground = () => 0, tuning = {}} = {}){
 const G = {...GAIT, ...tuning};
 const planner = createFootPlanner(skeleton, {ground}); // (only for where a rocking foot's ankle goes)
 let time = 0, body = {x: 0, z: 0, facing: 0, vx: 0, vz: 0, speed: 0}, phase = 0, vg = 0, vs = 0, act = 0, facing = null, omega = 0, lastFacing = null, holding = false, aim = 0;
 const forward = psi => [Math.sin(psi), Math.cos(psi)], leftOf = psi => [Math.cos(psi), -Math.sin(psi)];

 /** What the gait is like at a speed (metres a second): everything that changes with it. */
 function describe(v, turnStep = 0, active = smooth(.04, .6, v), style = v){
  const runK = smooth(G.runFrom, G.runTo, style);   // walk or run in style: follows a slower version of the speed, so arms and body settle gently
  const cadence = Math.min(G.maxCadence, lerp(G.walkCadence0 + G.walkCadencePer * v, G.runCadence0 + G.runCadencePer * v, runK));
  const duty = lerp(G.walkDuty, Math.max(G.minDuty, G.runDuty - G.runDutyPer * v), runK);
  const moving = active;                                       // 0 standing, 1 on the move (eased: it takes a moment to settle after he stops)
  const stanceTime = duty * 2 / cadence;                       // seconds a foot is down
  const stance = Math.min(G.maxStance, v * stanceTime) * moving;   // how far it moves back past the body while down
  const lift = Math.min(G.maxLift, lerp(G.walkLift + G.walkLiftPer * v, G.runLift + G.runLiftPer * v, runK)) * Math.max(moving, .6 * turnStep);
  const fore = smooth(G.forefootFrom, G.forefootTo, style);  // 0 flat-footed, 1 on the toes (a sprint)
  return {runK, fore, cadence, duty, moving, stance, lift};
 }

 /** Where the gait is at time t (a plain function of the present state; nothing is remembered between frames). */
 function at(t){
  // (never further than a moment from now: if nothing updates the gait any more, it stands where it was instead of running off)
  const ahead = Math.max(-.1, Math.min(.1, t - time)), d = describe(vg, smooth(G.turnStepFrom, G.turnStepTo, Math.abs(omega * DEG)), act, vs);
  const bx = body.x + body.vx * ahead, bz = body.z + body.vz * ahead, face = body.facing + omega * ahead;
  return {d, bx, bz, face, p: phase + d.cadence / 2 * ahead};
 }

 /** One foot at its phase p (0..1): its flat spot along the body (x forward, metres), its lift, its angle. */
 function footAt(p, d){
  p = frac(p);
  const toeOff = lerp(G.toeOff, G.runToeOff, d.runK), strike = lerp(lerp(G.heelStrike, 0, d.runK), G.runPitch, d.fore), mid = G.runPitch * d.fore; // (running, the foot stays toes-down: forefoot, as a sprinter does)
  if(p < d.duty){ // on the ground: it moves back past the body, rolling from heel to toe
   const u = p / d.duty;
   // (it speeds up over the first part of the stance and slows down over the last, so its speed past the body has no jump
   // where the swing ends and begins; in the middle it matches the ground)
   const r = lerp(G.walkStanceEase, G.stanceEase, d.runK), vp = 1 / (1 - r), g = u < r ? vp * u * u / (2 * r) : u > 1 - r ? 1 - vp * (1 - u) * (1 - u) / (2 * r) : vp * (r / 2 + u - r);
   return {x: d.stance / 2 - d.stance * g, y: 0, wide: 0, pitch: d.moving * (strike * (1 - smooth(0, .3, u)) + mid * smooth(0, .3, u) + (toeOff - mid) * smooth(.55, 1, u))};
  }
  // In the air: forward over an arc. It leaves, and lands, still moving back past the body at (most of) the speed of the
  // stance, so nothing in the leg jerks at take-off or touch-down (a foot that stopped dead and then moved back would).
  const u = (p - d.duty) / (1 - d.duty), m = -d.stance * (1 - d.duty) / d.duty * G.velocityMatch, x0 = -d.stance / 2, x1 = d.stance / 2;
  const x = (2 * u * u * u - 3 * u * u + 1) * x0 + (u * u * u - 2 * u * u + u) * m + (-2 * u * u * u + 3 * u * u) * x1 + (u * u * u - u * u) * m;
  return {x, y: d.lift * Math.pow(Math.sin(Math.PI * u), 3), wide: Math.sin(Math.PI * u), pitch: d.moving * lerp(toeOff, strike, smooth(0, 1, u)) * (1 - G.swingRelax * Math.sin(Math.PI * u))};
 }

 /** How far the pelvis is turned from the way he faces, at phase p (degrees): toward the forward leg. The feet turn with it, so the hips never have to twist. */
 function pelvisYaw(p, d){ return -(G.pelvisYaw + G.pelvisYawPer * Math.min(vg, 3)) * Math.cos(2 * Math.PI * p) * d.moving; }

 /** The height of the body below standing at time t (metres, 0 or less): it bounces with the steps. */
 function bodyHeight(t){
  const {d, p} = at(t), v = vg;
  // Each step is half a turn of the cycle; w is how far through the step from the middle of a foot's stance.
  const w = frac(p - d.duty / 2) * 2 % 1, c = (1 + Math.cos(2 * Math.PI * w)) / 2;
  const walk = G.standSlack + (G.walkSlack - G.standSlack) * d.moving + Math.min(G.maxWalkBob, G.walkBob + G.walkBobPer * v) * d.moving * (1 - c);
  const run = Math.min(G.runCrouch, G.runCrouch0 + G.runCrouchPer * v) * d.moving + Math.min(G.maxRunBob, G.runBob + G.runBobPer * v) * d.moving * c;
  return -lerp(walk, run, d.runK);
 }

 return {
  planner, describe,
  get time(){ return time; },
  /** True while he is asked for a big turn from standing: give it to the movement rules (`controller.state.hold = gait.holdMove`) so he turns on the spot first. */
  get holdMove(){ return holding; },
  get phase(){ return phase; },
  get facing(){ return body.facing; },
  /** Standing still (not moving, not turning): the feet are resting under the body. */
  get settled(){ return vg < .03 && Math.abs(omega) < .05; },
  /** How much stepping there is (0 standing still, 1 on the move): it takes a moment to settle after he stops. */
  get activity(){ return act; },

  /** Advance by dt seconds with the body as the movement rules have it now. */
  update(dt, b){
   time += dt;
   // The body turns as fast as the movement rules say, but it is drawn turning no faster than a body can (a flick that spins it
   // 180 degrees in a quarter of a second would throw the legs about); it catches up a moment later.
   if(facing === null) facing = b.facing;
   { let dd = ((b.facing - facing + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; const most = G.maxTurnRate / DEG * dt; facing += Math.max(-most, Math.min(most, dd * Math.min(1, dt * 14))); }
   body = {...b, facing};
   if(lastFacing !== null && dt > 0){ let dd = facing - lastFacing; dd = ((dd + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; omega += (dd / dt - omega) * Math.min(1, dt * 10); }
   lastFacing = facing;
   vg += (b.speed - vg) * Math.min(1, dt / G.speedSmoothing);
   vs += (b.speed - vs) * Math.min(1, dt / G.styleSmoothing);
   const raw = smooth(.04, .6, b.speed);
   act += (raw - act) * Math.min(1, dt / (raw > act ? G.attack : G.release)); // quick to start stepping, slow to settle
   phase = frac(phase + describe(vg, 0, act, vs).cadence / 2 * dt);
   aim = b.aim ?? b.facing;
   holding = G.turnFirst && b.speed < .6 && Math.abs(wrapDeg((aim - b.facing) * DEG)) > G.pivotAngle;
  },

  /** Reaching goals for both feet at time t (for player.setGoals). */
  goals(t){
   const {d, bx, bz, face, p} = at(t), f = forward(face), l = leftOf(face), out = {};
   for(const side of ['L', 'R']){
    const sgn = side === 'L' ? 1 : -1, foot = footAt(p + (side === 'L' ? 0 : .5), d);
    const half = lerp(G.standHalfWidth, G.footHalfWidth, d.moving) + foot.wide * G.swingWiden * d.runK * d.moving; // (a swinging foot goes out toward the hip's line, so the hip need not twist to bring the knee through)
    const x = bx + f[0] * foot.x + l[0] * sgn * half, z = bz + f[1] * foot.x + l[1] * sgn * half;
    const heading = face * DEG + pelvisYaw(p, d), y = ground(x, z) + foot.y, sole = planner.rolled(side, {x, y, z, heading}, foot.pitch);
    out['foot.' + side] = {sole, heading, pitch: foot.pitch, roll: 0, flat: 1};
   }
   return out;
  },

  bodyHeight,
  /** How near straight the standing leg may get (a number the balance layer reads): straighter when standing. */
  hardExtension(){ return lerp(.9995, G.moveExtension, act); },
  hardSoftness(){ return lerp(.001, .02, act); },

  /** The body's pose at time t (for player.setLayer): where it is and faces, lean, arms, pelvis and chest, head. */
  pose(t){
   const {d, bx, bz, face, p} = at(t), v = vg, moving = d.moving, k = d.runK;
   const arm = lerp(Math.min(G.maxArmWalk, G.armWalk + G.armWalkPer * v), Math.min(G.maxArmRun, G.armRun + G.armRunPer * v), k) * moving;
   const elbow = lerp(G.elbowWalk, G.elbowRun, k * moving);
   const swing = Math.cos(2 * Math.PI * p);                       // 1 as the left foot lands (it is forward), -1 half a turn later
   const pelvis = pelvisYaw(p, d), chest = -pelvis * G.chestYaw;
   const lean = k * Math.min(G.maxLean, G.leanPer * v) * moving, chestLean = Math.min(15, k * G.chestLeanPer * v * moving);
   // Leaning into a turn (head toward the inside): more the faster and the tighter.
   const bank = -Math.max(-G.maxBank, Math.min(G.maxBank, G.bank * omega * v * 5)) * moving;
   const turn = pelvis + chest, tip = lean + chestLean;
   const armL = arm * swing, armR = -arm * swing;                 // the left arm goes forward as the right foot does
   return {
    root: {position: [bx, 0, bz], rotation: {x: lean, y: face * DEG + pelvis, z: bank}},
    chest: {x: chestLean, y: 0, z: 0}, spine: {x: 0, y: chest, z: 0},
    'upperArm.L': {x: armL, y: 0, z: 11}, 'upperArm.R': {x: armR, y: 0, z: -11},
    'lowerArm.L': {x: -elbow - Math.max(0, -armL) * .3, y: 0, z: 0}, 'lowerArm.R': {x: -elbow - Math.max(0, -armR) * .3, y: 0, z: 0},
    neck: {x: -tip * .45, y: -turn * .55, z: 0}, head: {x: -tip * .45, y: -turn * .45, z: 0},
   };
  },
 };
}

/** Put a gait on a pose player: the feet, the arms and torso, and the body height (balance without a weight shift). */
export function attachGait(player, gait, {ground = () => 0, balance = {}} = {}){
 player.setGoals('feet', t => gait.goals(t), {fade: 0});
 player.setLayer('walk', {fn: t => gait.pose(t), fade: 0});
 player.setBalance({shift: false, duration: .16, lowerDuration: .04, lookahead: .02, height: t => gait.bodyHeight(t), hardExtension: () => gait.hardExtension(), hardSoftness: () => gait.hardSoftness(), hardBlend: .004, ground, ...balance});}
