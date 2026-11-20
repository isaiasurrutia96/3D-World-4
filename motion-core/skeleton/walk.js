// Walking and running. The feet lead: each foot is planted exactly (it never slides) until it lifts, swings
// forward and lands; the body travels as the movement rules say, and the layers underneath (balance, foot
// planning, the legs) make it stand on those feet.
//
//   const walker = createWalker(skeleton, {ground})
//   attachWalker(player, walker)                  // feet, arms and torso go on the pose player; balance is set up
//   each frame:  controller.state.hold = walker.holdMove   // (optional: he turns on the spot before a big turn)
//                controller.advance(dt, stickX, stickZ)
//                walker.update(dt, body)          // body: {x, z, facing, vx, vz, speed} from the movement rules
//                player.update(dt)
//
// Walking (slower than `runOn`): a foot lifts when it has fallen behind the body by the distance the body travels
// over half a stance (so the rhythm follows the speed, even a quick start), rolls off its toe, swings ahead of the
// hips by half a stance on a smooth path, lands on its heel and rolls flat. There is always a moment with both
// feet down.
// Running (faster): the feet run on a clock. A foot leaves when its short stance is over, half a stride after the
// other one, and lands ahead of the hip by the same short reach; between the two there is a moment with both feet
// in the air. The body sinks over each standing foot and rises in the air; the arms swing wider with the elbows
// bent, and the chest leans forward. (At the game's speeds the short legs need a very quick, cartoon-like gait.)
// Standing, turning and stopping: closing steps bring the feet under the body or round to a new way. For a big turn
// from standing, `holdMove` is true while the feet step round: give it to the movement rules so he turns first.
// Arms swing opposite to the legs, in proportion to how far apart the feet are; the pelvis turns a little toward
// the forward foot and the chest the other way, and the head stays facing ahead.
import {createFootPlanner} from './footplan.js';

const DEG = 180 / Math.PI;

/** Walking numbers (metres, seconds, degrees). Every one can be overridden. */
export const WALK = Object.freeze({
 footHalfWidth: .085,     // each foot's centre line is this far from the body's middle line (the hips are wider)
 cadenceBase: 2.1,        // steps a second at a standstill...
 cadencePerSpeed: .4,    // ...plus this for each metre a second
 maxBehind: .34,          // the standing foot is never let fall further behind the body than this (the leg could not reach)
 minSwing: .2,            // a step takes at least this long (seconds)
 duty: .64,               // the share of a stride (one foot's step cycle) that a foot spends on the ground
 runOn: 1.3,              // above this speed (metres a second) he runs: a stance short enough to leave a moment in the air
 runAhead: .25,           // seconds ahead he is judged by when speeding up (so a hard start begins with a running step)
 runOff: 1.05,            // ... and below this he walks again
 runReach: .203,            // running, a foot lands at most this far ahead of the hip (and leaves as far behind)
 minStance: .06,          // running, the shortest time a foot stays down
 minFlight: .012,          // running, the shortest time both feet are in the air in each step
 runCadence0: 2.89,        // running, steps a second at the start of the run...
 runCadencePer: .58,      // ...plus this for each metre a second
 runKick: 7.5,             // running, a foot leaving the ground speeds up at this many metres a second squared for each metre a second of body speed
 runLaunch: .58,           // running, a foot leaves the ground already moving forward at this share of the body's speed
 runLift0: .06,           // running, the foot clears the ground by this in mid-swing...
 runLiftPer: .03,         // ...plus this for each metre a second
 runLandPitch: 0,         // running, the foot lands at this angle (degrees, toes down)
 runBob0: .015,           // running, the body sinks this far (metres) over the standing foot...
 runBobPer: .008,         // ...plus this for each metre a second (at most runBobMax)
 runBobMax: .075,
 runBase: .02,            // running, the body rides this much lower than standing
 runArmSwing: 62,         // running, arm swing (degrees for a stride)
 runElbow: 85,            // running, the elbow bend (degrees)
 runLean: 2.2,            // running, the chest leans forward this many degrees for each metre a second (at most 15)
 runEase: .35,            // seconds to change between the walk's body and the run's
maxSpeed: 1.0,           // the fastest this walk goes (more would be a jog; running is separate)
 maxHalfStep: .36,        // never place a foot more than this far ahead of the hip
 heelLead: 0,             // the foot lands on its heel, which is behind the ankle: the ankle goes this much further ahead
 toeOffPitch: 10,         // how far the heel lifts before the foot leaves the ground (degrees, toes down)
 heelStrikePitch: -6,     // the angle the foot lands at (toes up)
 midSwingToes: 6,         // toes down in the middle of the swing
 rollOut: .14,            // seconds from the heel starting to lift until the foot leaves the ground
 rollIn: .15,             // seconds from touchdown until the foot is flat
 stepCrouch: .012,        // standing, the body sits this much lower (metres) while a foot is in the air
 standEase: .5,          // seconds the legs take to settle between walking and standing
 standSlack: .006,      // standing, the leg may be nearly straight (a person stands with soft, not bent, knees)
 standExtension: .998,   // (the share of straight the standing leg may reach, at most)
 standSoftness: .003,
 legSlack: .01,          // the stance leg stays this much (metres) short of straight, so the knee never locks
 liftBase: .035,          // clearance of the lowest part of the foot in mid-swing...
 liftPerSpeed: .02,       // ...plus this for each metre a second
 minTrigger: .04,         // even at a crawl a foot must fall this far behind before it lifts
 minDouble: .06,          // both feet stay down at least this long after one lands
 startSpeed: .1,          // the body must be going this fast to start walking
 stopSpeed: .12,          // slower than this and walking ends
 maxLead: 60,              // how far ahead of the body's facing a foot is turned for a turn in progress (degrees)
  pivotStep: 55,            // turning on the spot, a foot steps round at most this far (degrees) past the foot that stands
 pivotStepTime: .3,        // seconds a big turning step takes
 turnFirst: true,         // false: never hold him back for a turn (the feet may lag a flick)
 pivotAngle: 70,           // a walk waits (turning on the spot) while both feet are further than this from the way the body is asked to face
 maxFaceAccel: 0,         // how fast its turning speed may change (degrees a second, a second); 0 = no limit
 maxTurnRate: 250,        // the fastest the body turns (degrees a second)
 maxBodyTwist: 32,        // the body never turns further than this from a foot that is standing (degrees): the hip can only twist so far
 maxFootTurn: 28,         // a standing foot turned further than this from the body (degrees) steps round at once, ahead of its turn
 settleDistance: .05,     // when standing, feet more than this from where they should be get a closing step
 settleAngle: 20,         // ...or turned more than this from the body (degrees)
 closingStep: .4,         // seconds a closing step takes
 armSwing: 38,            // degrees of arm swing for each metre the feet are apart front to back
 elbowBend: 22,           // degrees the elbows stay bent
 pelvisTurn: 7,           // degrees of pelvis turn for each metre the feet are apart
 chestTurn: 11,           // degrees of chest counter-turn for each metre
});

export function createWalker(skeleton, {ground = () => 0, tuning = {}, start = null} = {}){
 // start: {x, z, facing}: begin standing there with both feet in stance (otherwise the feet start where the skeleton rests).
 const W = {...WALK, ...tuning};
 const planner = createFootPlanner(skeleton, {ground});
 if(start) for(const f of ['L', 'R']){ // both feet stand in stance under the body, facing the way it faces
  const side = f === 'L' ? 1 : -1;
  planner.plant(f, {sole: [start.x + Math.cos(start.facing) * side * W.footHalfWidth, start.z - Math.sin(start.facing) * side * W.footHalfWidth], heading: start.facing * DEG});
 }
 let time = 0, body = {x: 0, z: 0, facing: 0, vx: 0, vz: 0, speed: 0}, lastFacing = null, omega = 0, lastV = null, ax = 0, az = 0;
 let mode = 'idle', lastLifted = 'R', prunedAt = 0, liftedAt = -1, soonV = 0, running = false, runK = 0, holding = false, standK = 1, face = null, faceSpeed = 0, asked = 0;
 const wrapDeg = a => ((a + 180) % 360 + 360) % 360 - 180, smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
 const queue = [], unloaded = new Set(), state = {L: 'planted', R: 'planted'}, lastLand = {L: -1, R: -1};
 const other = f => f === 'L' ? 'R' : 'L';
 const legLength = (skeleton.bones[skeleton.index.get('thigh.L')].length + skeleton.bones[skeleton.index.get('shin.L')].length) - W.legSlack;
 const vcap = () => running ? 20 : W.maxSpeed;
 const cadence = v => W.cadenceBase + W.cadencePerSpeed * Math.min(v, W.maxSpeed);
 const forward = psi => [Math.sin(psi), Math.cos(psi)], leftOf = psi => [Math.cos(psi), -Math.sin(psi)];
 const schedule = ev => { queue.push(ev); queue.sort((a, b) => a.t - b.t); };
 // Running: a short stance (the foot lands and leaves no further from the hip than runReach), then both feet in the air a moment.
 const runGait = v => { const tau = 1 / (W.runCadence0 + W.runCadencePer * v), stance = Math.max(W.minStance, Math.min(2 * W.runReach / Math.max(v, .1), tau - W.minFlight)); return {tau, swing: 2 * tau - stance, stance}; };
 const gait = v => { if(running) return runGait(v); const tau = 1 / cadence(Math.min(v, W.maxSpeed)); return {tau, swing: 2 * tau * (1 - W.duty), stance: 2 * tau * W.duty}; };

 /** Where a foot should be when the body stands still, for this body (the sole point under the ankle). */
 const stanceSpot = (foot, b = body) => {
  const l = leftOf(b.facing), side = foot === 'L' ? 1 : -1;
  return {x: b.x + l[0] * side * W.footHalfWidth, z: b.z + l[1] * side * W.footHalfWidth, heading: b.facing * DEG};
 };

 /** How far a foot is ahead of the body along the way it faces (metres; behind is negative). */
 function aheadOf(foot, t = time){
  const f = forward(body.facing), s = planner.state(foot, t);
  return (s.sole[0] - body.x) * f[0] + (s.sole[2] - body.z) * f[1];
 }

 /** How far behind the body a standing foot may fall before it lifts: the body travels this far over half a stance. */
 const trigger = v => Math.max(W.minTrigger, Math.min(W.maxHalfStep, v * gait(v).stance / 2));

 /**
  * Where to put a foot that steps now and lands `swing` seconds from now: ahead of the hip by half the stance
  * (Raibert-style). The body is predicted at its landing time with its speed and acceleration, so a quick start
  * does not leave the feet behind.
  */
 function placement(foot, swing){
  // The way the body will face by the middle of the stance of this foot (the foot stays this way while it stands).
  // (A turn is not carried on further than a foot can follow: at most maxLead degrees, twice that running.)
  const maxLead = running ? 2 * W.maxLead : W.maxLead, lead = Math.max(-maxLead, Math.min(maxLead, omega * (swing * .5 + gait(Math.min(body.speed, vcap())).stance * .5) * DEG)) / DEG;
  const psi = body.facing + lead;
  let px = body.x + body.vx * swing + .5 * ax * swing * swing, pz = body.z + body.vz * swing + .5 * az * swing * swing;
  if(running && Math.abs(omega) > .3 && body.speed > .5){
   // Running round a bend: the body travels along an arc (at its speed, turning as it turns), not along a line.
   const th = Math.atan2(body.vx, body.vz), tr = th + omega * swing;
   px = body.x + body.speed / omega * (Math.cos(th) - Math.cos(tr)); pz = body.z + body.speed / omega * (Math.sin(tr) - Math.sin(th));
  }
  const vl = Math.min(vcap(), Math.hypot(body.vx + ax * swing, body.vz + az * swing)), g = gait((Math.min(body.speed, vcap()) + vl) / 2);
  const half = Math.min(W.maxHalfStep, vl * g.stance / 2);
  const f = forward(psi), l = leftOf(psi), side = foot === 'L' ? 1 : -1;
  const reach = half + (vl > W.startSpeed ? W.heelLead : 0);
  return {sole: [px + l[0] * side * W.footHalfWidth + f[0] * reach, pz + l[1] * side * W.footHalfWidth + f[1] * reach], heading: psi * DEG};
 }

 function lift(foot, t){
  const v = Math.min(body.speed, vcap()), g = gait(v);
  if(running){
   // Running: a foot leaves when its short stance is over; the swing is the rest of the stride. (From a standing start the
   // body is still slow but will not be: the foot leaves for the speed he is about to have, along the way he is going.)
   const vr = Math.max(v, Math.min(soonV, vcap())), dir = body.speed > .3 ? [body.vx / body.speed, body.vz / body.speed] : forward(body.facing);
   const gr = gait(vr);
   planner.stepTo(foot, t, placement(foot, gr.swing), {duration: gr.swing, lift: W.runLift0 + W.runLiftPer * vr, toesDown: W.midSwingToes, landPitch: W.runLandPitch, delay: .02, arriveEarly: .12, kick: [dir[0] * vr * W.runKick, dir[1] * vr * W.runKick], launch: [dir[0] * vr * W.runLaunch, dir[1] * vr * W.runLaunch]});
   g.swing = gr.swing;
  } else {
   // The foot that stays down must not be left too far behind while this one swings: a quick start (or a speed-up)
   // means a quicker step, never a leg stretched past its reach.
   const stayBehind = -aheadOf(other(foot), t), room = Math.max(0, W.maxBehind - Math.max(0, stayBehind));
   const along = (ax * body.vx + az * body.vz) / Math.max(body.speed, 1e-6), vSwing = Math.min(W.maxSpeed, v + Math.max(0, along) * g.swing * .6);
   g.swing = Math.max(W.minSwing, Math.min(g.swing, vSwing > .05 ? room / vSwing : g.swing));
   planner.stepTo(foot, t, placement(foot, g.swing), {duration: g.swing, lift: W.liftBase + W.liftPerSpeed * v, toesDown: W.midSwingToes, landPitch: W.heelStrikePitch, delay: .1, arriveEarly: .15});
  }
  state[foot] = 'swinging'; lastLifted = foot; liftedAt = t;
  schedule({t: t + g.swing, kind: 'land', foot});
 }

 function run(ev){
  const f = ev.foot;
  if(ev.kind === 'lift') lift(f, ev.t);
  else if(ev.kind === 'land'){ planner.rollTo(f, ev.t, 0, {duration: W.rollIn}); unloaded.delete(f); state[f] = 'planted'; lastLand[f] = ev.t; }
  else if(ev.kind === 'close'){ // a closing step to the stance spot, for a body that has stopped
   const spot = stanceSpot(f);
   // Turning on the spot: the foot goes round towards the way the body is asked to face, up to pivotStep degrees ahead of the foot that stands.
   const stand = planner.state(other(f), ev.t).heading, toward = wrapDeg(asked * DEG - stand), heading = W.turnFirst ? stand + Math.max(-W.pivotStep, Math.min(W.pivotStep, toward)) : spot.heading;
   const big = Math.abs(wrapDeg(heading - planner.state(f, ev.t).heading)) > 45, dur = big ? W.pivotStepTime : W.closingStep;
   planner.stepTo(f, ev.t, {sole: [spot.x, spot.z], heading}, {duration: dur, lift: .03, toesDown: 3, landPitch: W.heelStrikePitch / 2, delay: .08, arriveEarly: .15});
   state[f] = 'swinging'; lastLifted = f;
   schedule({t: ev.t + dur, kind: 'land', foot: f, closing: true});
  }
 }

 /** Walking begins while a closing step is still in the air: that step becomes the first walking step. */
 function takeOverClosingSteps(){
  for(let i = queue.length - 1; i >= 0; i--){
   const e = queue[i];
   if(e.kind === 'land' && e.closing){ queue.splice(i, 1); lift(e.foot, time); }
  }
 }

 /** Heel up now, and the foot leaves the ground a moment later. */
 function beginStep(foot, liftAt = time + W.rollOut){
  planner.rollTo(foot, time, W.toeOffPitch, {duration: Math.max(.02, liftAt - time)});
  unloaded.add(foot); state[foot] = 'rolling';
  schedule({t: liftAt, kind: 'lift', foot});
 }

 /** How far (m) and how turned (degrees) a foot is from where it should be for a standing body. */
 function misplaced(f){
  const spot = stanceSpot(f), s = planner.state(f, time);
  const dh = ((s.heading - spot.heading) % 360 + 540) % 360 - 180;
  return {dist: Math.hypot(s.sole[0] - spot.x, s.sole[2] - spot.z), turn: Math.abs(dh)};
 }

 const bothDown = () => state.L === 'planted' && state.R === 'planted' && !queue.some(e => e.kind === 'close' || e.kind === 'land');

 /** Where the body is at time t if it carries on as it is going, and how far apart the feet are front to back. */
 function gaitState(t){
  const ahead0 = Math.max(0, t - time), bx = body.x + body.vx * ahead0, bz = body.z + body.vz * ahead0, face = body.facing + omega * ahead0;
  const f = forward(face), s = {L: planner.state('L', t), R: planner.state('R', t)};
  const ahead = k => (s[k].sole[0] - bx) * f[0] + (s[k].sole[2] - bz) * f[1];
  // d: how far the right foot is ahead of the left, along the way he faces (metres).
  return {bx, bz, face, d: ahead('R') - ahead('L')};
 }

 /**
  * How far below standing the body should be at time t (metres, 0 or less): with the feet this far apart front to back, a
  * leg that stays about the same length lowers the body by d squared over eight legs (the stride of a rigid leg), on top
  * of the small slack that keeps the knee soft. (For balance's `height` option: it smooths this and looks ahead to it.)
  */
 function bodyHeight(t){
  const {d} = gaitState(t);
  // A foot in the air from a nearly straight standing leg makes the knee jump (a straight knee moves like a square root),
  // so just before and while a foot is up the body sits a little lower, with both knees soft.
  const up = Math.max(...[0, .1, .2].flatMap(a => ['L', 'R'].map(f => { const s = planner.state(f, t + a); return s.sole[1] - ground(s.sole[0], s.sole[2]); })));
  const crouch = W.stepCrouch * standing() * smooth(0, .03, up);
  const walkH = -(slack() + d * d / (8 * legLength) + crouch);
  if(runK <= 0) return walkH;
  // Running: the body sinks over each standing foot and rises in the air between (about a half sine for each stance).
  const g = runGait(body.speed), amp = Math.min(W.runBobMax, W.runBobPer * Math.min(body.speed, 12) + W.runBob0);
  let sink = 0;
  for(const f of ['L', 'R']){
   const land = state[f] === 'planted' ? lastLand[f] : (queue.find(e => e.kind === 'land' && e.foot === f)?.t ?? -Infinity);
   if(!Number.isFinite(land)) continue;
   for(const k of [-1, 0, 1]){ const u = (t - (land + 2 * g.tau * k)) / g.stance; if(u > 0 && u < 1) sink += Math.sin(Math.PI * u); }
  }
  return walkH * (1 - runK) - (W.runBase + amp * sink) * runK;
 }

 /** How much the body is standing rather than walking (1 standing, 0 walking): the knees may straighten when it stands. */
 function standing(){ return smooth(0, 1, standK); }
 function slack(){ const k = standing(); return W.legSlack + (W.standSlack - W.legSlack) * k; }
 function hardExtension(){ const k = standing(); return .985 + (W.standExtension - .985) * k; }
 function hardSoftness(){ const k = standing(); return .02 + (W.standSoftness - .02) * k; }

 return {
  planner,
  get time(){ return time; },
  get mode(){ return mode; },
  get facing(){ return body.facing; },
  /** True while the feet are still stepping round to a big turn: give it to the movement rules (`controller.state.hold = walker.holdMove`) so he turns on the spot before he sets off. */
  get holdMove(){ return holding; },
  /** Feet that are about to lift or in the air count as not carrying weight (for balance). */
  unloaded: () => { const out = [...unloaded]; for(const f of ['L', 'R']) if(!planner.isPlanted(f, time) && !out.includes(f)) out.push(f); return out; },

  /** Advance by dt seconds with the body as the movement rules have it now. */
  update(dt, b0){
   time += dt;
   // The body faces where the movement rules say, except that it cannot get further round than the hips can twist
   // from a foot that is standing: a turn too quick for the feet waits for them to step round.
   asked = b0.facing;
   let wanted = wrapDeg(b0.facing * 180 / Math.PI);
   if(face === null) face = wanted;
   else {
    // Standing or nearly so: not past what the hips allow from the feet that are down.
    const standing = ['L', 'R'].filter(f => planner.isPlanted(f, time)).map(f => planner.state(f, time).heading);
    if(standing.length && mode !== 'walking' && b0.speed < W.startSpeed){
     const h1 = standing[0], rel = a => wrapDeg(a - h1);
     let w = rel(wanted); const pw = rel(face); if(w - pw > 180) w -= 360; else if(w - pw < -180) w += 360;
     let lo = -W.maxBodyTwist, hi = W.maxBodyTwist;
     if(standing.length > 1){ const h2 = rel(standing[1]); lo = Math.max(lo, h2 - W.maxBodyTwist); hi = Math.min(hi, h2 + W.maxBodyTwist); }
     w = lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, w));
     wanted = wrapDeg(h1 + w);
    }
    // And never faster than a body can turn (and, if maxFaceAccel is above 0, never speeding up or slowing its turn faster than that).
    const want = Math.max(-W.maxTurnRate, Math.min(W.maxTurnRate, wrapDeg(wanted - face) * 14)), acc = W.maxFaceAccel * dt;
    faceSpeed = W.maxFaceAccel > 0 ? faceSpeed + Math.max(-acc, Math.min(acc, want - faceSpeed)) : want;
    face = wrapDeg(face + faceSpeed * dt);
   }
   const b = {...b0, facing: face * Math.PI / 180};
   if(lastFacing !== null && dt > 0){ let d = b.facing - lastFacing; d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; omega += (d / dt - omega) * Math.min(1, dt * 10); }
   if(lastV !== null && dt > 0){ const k = Math.min(1, dt * 8); ax += ((b.vx - lastV[0]) / dt - ax) * k; az += ((b.vz - lastV[1]) / dt - az) * k; }
   lastV = [b.vx, b.vz]; lastFacing = b.facing; body = b;
   // He runs once fast enough, or as soon as he is speeding up so hard that he will be within a moment (the first step must not be a slow one).
   const along = (ax * b.vx + az * b.vz) / Math.max(b.speed, 1e-6), soon = b.speed + (b.speed > .05 ? Math.max(0, along) * W.runAhead : 0);
   soonV = soon;
   if(!running && soon > W.runOn) running = true; else if(running && soon < W.runOff) running = false;
   runK = Math.max(0, Math.min(1, runK + (running ? dt : -dt) / W.runEase));
   // Standing or walking, eased over about half a second (so the knees settle straight, or bend for the walk, without a jolt).
   standK = Math.max(0, Math.min(1, standK + (b.speed < W.stopSpeed ? dt : -dt) / W.standEase));
   // Forget steps that finished long ago (the planner would otherwise grow, and slow down, for as long as the game runs).
   if(time - prunedAt > 1){ planner.prune(time - 1); prunedAt = time; }
   while(queue.length && queue[0].t <= time) run(queue.shift());
   // A walk does not start while the body is asked to face well away from its feet: it turns on the spot first (closing steps
   // bring the feet round), as a person does, instead of stepping off sideways or backwards.
   const feetWay = ['L', 'R'].map(f => Math.abs(wrapDeg(planner.state(f, time).heading - asked * DEG)));
   const pivoting = W.turnFirst && mode !== 'walking' && Math.min(...feetWay) > W.pivotAngle;
   holding = pivoting;
   const walking = b.speed >= W.stopSpeed && (mode === 'walking' || b.speed > W.startSpeed) && !pivoting;
   if(walking){
    if(mode !== 'walking'){
     takeOverClosingSteps();
     // Off the mark: the foot that is further behind steps at once (the other one is the standing foot).
     if(state.L === 'planted' && state.R === 'planted'){
      const foot = aheadOf('L') < aheadOf('R') - .02 ? 'L' : aheadOf('R') < aheadOf('L') - .02 ? 'R' : other(lastLifted);
      if(running){ lift(foot, time); } else beginStep(foot);
     }
    }
    mode = 'walking';
    if(running){
     // Running is on a clock: the foot whose turn it is leaves when its short stance is over (the other one may still be in the air).
     const foot = other(lastLifted), g = gait(b.speed), gg = other(foot);
     // (A foot left far behind goes at once, whatever the clock says: a quick start leaves it no time.)
     const behind = -aheadOf(foot) >= W.runReach * 1.5;
     if(state[foot] === 'planted' && !queue.some(e => e.kind === 'close' || e.kind === 'lift') && (behind || (time - lastLand[foot] >= g.stance - 1e-9 && time - liftedAt >= g.tau - 1e-9))
        && (state[gg] !== 'planted' || time - lastLand[gg] >= g.stance * .5 || behind)) lift(foot, time);
    } else {
    // The foot that has been down longest lifts when it has fallen back far enough (and the other foot has landed).
    // The foot whose turn it is, unless the other one is turned too far from the body (the hip can only twist so far).
    const turned = f => Math.abs(((planner.state(f, time).heading - b.facing * DEG) % 360 + 540) % 360 - 180);
    let foot = other(lastLifted);
    if(state[foot] === 'planted' && state[other(foot)] === 'planted' && turned(other(foot)) > W.maxFootTurn && turned(other(foot)) > turned(foot)) foot = other(foot);
    const g = other(foot);
    // The standing foot starts to rock onto its toe as the other one is about to touch down (so the heel is up
    // as soon as that foot is down), but it never leaves the ground before that foot has landed.
    const landing = queue.find(e => e.kind === 'land' && e.foot === g), landAt = landing ? landing.t : -Infinity;
    const otherReady = state[g] === 'planted' || (state[g] === 'swinging' && landing && !landing.closing && landAt - time <= W.rollOut);
    if(state[foot] === 'planted' && otherReady && !queue.some(e => e.kind === 'close')){
     const behind = -aheadOf(foot);
     if(behind >= trigger(b.speed) - b.speed * W.rollOut || turned(foot) > W.maxFootTurn) beginStep(foot, Math.max(time + W.rollOut, Math.max(landAt, lastLand[g]) + W.minDouble));
    }
    }
   } else if(mode === 'walking'){ mode = 'settling'; }
   if(!walking && mode !== 'walking' && bothDown() && (b.speed < W.stopSpeed || pivoting)){
    // Standing: a foot that is not where it should be (the body stopped, or turned on the spot) gets a closing step.
    const m = {L: misplaced('L'), R: misplaced('R')}, need = f => m[f].dist > W.settleDistance || m[f].turn > W.settleAngle;
    const first = need('L') && need('R') ? (m.L.dist >= m.R.dist ? 'L' : 'R') : need('L') ? 'L' : need('R') ? 'R' : null;
    if(first) schedule({t: time, kind: 'close', foot: first});
    else mode = 'idle';
   }
  },

  /** Reaching goals for both feet (for player.setGoals). */
  goals: t => planner.goals(t),
  gaitState, bodyHeight, standing, slack, hardExtension, hardSoftness,

  /** The body's pose at time t (for player.setLayer): where it is and faces, the pelvis and chest turns, the arms. */
  pose(t){
   // Asked about a moment still to come: the body is carried on at its present velocity.
   const {bx, bz, face, d} = gaitState(t);
   const dc = Math.max(-.9, Math.min(.9, d)), pelvis = W.pelvisTurn * dc, chest = -W.chestTurn * dc, arm = (W.armSwing + runK * (W.runArmSwing - W.armSwing)) * dc, elbow = W.elbowBend + runK * (W.runElbow - W.elbowBend), lean = runK * Math.min(15, W.runLean * body.speed);
   const turn = pelvis + chest; // the neck and head take back what the pelvis and chest turned, so he looks ahead
   return {
    root: {position: [bx, 0, bz], rotation: {x: 0, y: face * DEG + pelvis, z: 0}},
    spine: {x: 0, y: chest, z: 0},
    'upperArm.L': {x: -arm, y: 0, z: 11}, 'upperArm.R': {x: arm, y: 0, z: -11},
    chest: {x: lean, y: 0, z: 0},
    'lowerArm.L': {x: -elbow - Math.max(0, -arm) * .5, y: 0, z: 0}, 'lowerArm.R': {x: -elbow - Math.max(0, arm) * .5, y: 0, z: 0},
    neck: {x: 0, y: -turn * .55, z: 0}, head: {x: 0, y: -turn * .45, z: 0},
   };
  },
 };
}

/** Put a walker on a pose player: the feet, the arms and torso, and balance set up for walking. */
export function attachWalker(player, walker, {ground = () => 0, balance = {}} = {}){
 player.setGoals('feet', t => walker.goals(t), {fade: 0});
 player.setLayer('walk', {fn: t => walker.pose(t), fade: 0});
 player.setBalance({policy: 'inside', margin: .03, stance: 0, hardExtension: () => walker.hardExtension(), hardSoftness: () => walker.hardSoftness(), duration: .16, lowerDuration: .1, lookahead: .08, height: t => walker.bodyHeight(t), heading: () => walker.facing, exclude: () => walker.unloaded(), ground, ...balance});
}
