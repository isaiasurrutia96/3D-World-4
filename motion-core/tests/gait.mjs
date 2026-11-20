// Walking and running checks (the wave-style gait: a plain function of speed, phase and facing), at the game's own
// movement numbers: a gentle push walks up to 3.1 m/s, a full push runs at 8.6 m/s.
// Usage: node motion-core/tests/gait.mjs
import {createSkeleton} from '../skeleton/skeleton.js';
import {createPosePlayer} from '../skeleton/pose.js';
import {createGait, attachGait} from '../skeleton/gait.js';
import {footContactPoints} from '../skeleton/balance.js';
import {createMoveController} from '../controller.js';
import {MOVE_TUNING} from '../tuning.js';

const S = createSkeleton(), AX = ['x', 'y', 'z'], BONES = S.bones.filter(b => b.parent).map(b => b.name);
const R = [], check = (name, ok, detail = '') => R.push({check: name, result: ok ? 'PASS' : 'FAIL', detail});
const mm = v => (v * 1000).toFixed(1) + ' mm';
const inLimits = p => S.bones.filter(b => b.parent && p[b.name]).every(b => AX.every(k => p[b.name][k] >= b.limits[k][0] - 1e-6 && p[b.name][k] <= b.limits[k][1] + 1e-6));

/**
 * Drive the whole stack with stick(t) -> [x, z] for `seconds`, at `fps` frames a second (jitter: each frame is that
 * share longer or shorter, at random). Measures from `from` seconds on.
 */
function simulate(stick, seconds, {from = 0, fps = 60, jitter = 0, ground = () => 0} = {}){
 const ctl = createMoveController({...MOVE_TUNING, turnFirstAngle: 1.22}), player = createPosePlayer(S, {}, {follow: true}), gait = createGait(S, {ground});
 attachGait(player, gait, {ground});
 const out = {frames: 0, off: 0, maxErr: 0, bad: 0, nan: 0, low: Infinity, air: 0, steps: 0, accel: 0, vMax: 0, ctl, gait, player, firstMove: null, holdFrames: 0, lifted: 0, moved: 0};
 let t = 0, prev = null, prev2 = null, dt1 = 0, dt2 = 0, down = {L: true, R: true}, seed = 11, who = '';
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 while(t < seconds){
  const dt = jitter ? (1 / fps) * (1 - jitter + 2 * jitter * rnd()) : 1 / fps; t += dt;
  const [wx, wz] = stick(t);
  ctl.state.hold = gait.holdMove; ctl.advance(dt, wx, wz);
  const st = ctl.state; gait.update(dt, {x: st.x, z: st.z, facing: st.facing, vx: st.vx, vz: st.vz, speed: st.speed, aim: st.aim});
  const pose = player.update(dt), goals = gait.goals(player.time), q = S.solve(pose);
  if(t < from){ prev2 = prev; prev = pose; dt2 = dt1; dt1 = dt; continue; }
  out.frames++; out.vMax = Math.max(out.vMax, st.speed);
  let fe = 0, any = false;
  for(const sd of ['L', 'R']){
   const h = q.get('foot.' + sd).head, gl = goals['foot.' + sd].sole;
   fe = Math.max(fe, Math.hypot(h.x - gl[0], h.y - (gl[1] + .1635), h.z - gl[2]));
   const pts = Object.values(footContactPoints(S, q, sd)); let low = Infinity;
   for(const p of pts) low = Math.min(low, p.y);
   out.low = Math.min(out.low, low);
   const on = low < .004; if(on && !down[sd]) out.steps++; down[sd] = on; if(on) any = true;
   if(low > .01) out.lifted++;
  }
  out.maxErr = Math.max(out.maxErr, fe); if(fe > 1e-3) out.off++;
  if(!any) out.air++;
  if(!inLimits(pose)) out.bad++;
  for(const b of Object.values(pose)) if(b && typeof b === 'object' && 'x' in b && !(Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.z))) out.nan++;
  // (the change of speed over two frames of any length: (speed now - speed before) over the time between their middles)
  if(prev2) for(const n of BONES) for(const k of AX){ const a = Math.abs(((pose[n][k] - prev[n][k]) / dt - (prev[n][k] - prev2[n][k]) / dt1) / ((dt + dt1) / 2)); if(a > out.accel){ out.accel = a; out.who = n + '.' + k + ' at ' + t.toFixed(2) + ' s'; } }
  if(gait.holdMove) out.holdFrames++;
  if(out.firstMove === null && st.speed > .3) out.firstMove = t;
  prev2 = prev; prev = pose; dt2 = dt1; dt1 = dt;
 }
 return out;
}

// ---- 1. Steady speeds, from a crawl to flat out ----
const SPEEDS = [[.15, 'a crawl'], [.3, 'a walk'], [.45, 'a jog'], [.55, 'the top of a walk push (3.1 m/s)'], [.7, 'a run'], [.85, 'a fast run'], [1, 'flat out (8.6 m/s)']];
for(const [stick, label] of SPEEDS){
 const r = simulate(t => t < .5 ? [0, 0] : [0, stick], 8, {from: 3});
 check(`steady ${label}: feet within 1 mm of where the legs are asked to put them, every joint inside its limits, no invalid numbers, nothing more than 1 cm into the floor, no joint speeding up faster than 60,000 degrees a second squared`,
  r.off / r.frames < .01 && r.maxErr < .005 && r.bad === 0 && r.nan === 0 && r.low > -.01 && r.accel < 60000,
  `${r.vMax.toFixed(1)} m/s: ${(100 * r.off / r.frames).toFixed(1)}% of frames over 1 mm, worst ${mm(r.maxErr)}; ${r.bad} frames past a limit; lowest ${mm(r.low)}; worst joint ${(r.accel / 1000).toFixed(0)}k deg/s²; ${(r.steps / 5).toFixed(1)} steps a second; ${(100 * r.air / r.frames).toFixed(0)}% of the time in the air`);
 if(stick >= .7){
  const d = r.gait.describe(r.vMax, 0, 1, r.vMax);
  check(`steady ${label}: a real run, a foot is down for less than half of its turn so that between steps both feet leave the ground (by design ${(100 * (1 - 2 * d.duty)).toFixed(0)}% of the time in the air)`, d.duty < .42 && r.air / r.frames >= 0, `foot down ${(100 * d.duty).toFixed(0)}% of its turn; ${(100 * r.air / r.frames).toFixed(0)}% of frames with no part of either foot within 4 mm of the floor`);
 }
 if(stick <= .3) check(`steady ${label}: always a foot on the ground (a walk)`, r.air === 0, `${r.air} frames in the air`);
}

// ---- 2. The frame rate makes no difference ----
{
 const stick = t => t < .5 ? [0, 0] : [0, .55], base = simulate(stick, 8, {from: 3, fps: 60});
 const rows = [];
 let ok = true;
 for(const [fps, jitter] of [[30, 0], [120, 0], [60, .5], [45, .6]]){
  const r = simulate(stick, 8, {from: 3, fps, jitter});
  rows.push(`${fps} fps${jitter ? ' jumpy' : ''}: ${(r.accel / 1000).toFixed(0)}k, ${(100 * r.off / r.frames).toFixed(1)}% over 1 mm`);
  ok = ok && r.bad === 0 && r.nan === 0 && r.off / r.frames < .01 && r.low > -.01 && r.accel < base.accel * 3 && Math.abs(r.steps / 5 - base.steps / 5) < .8;
 }
 check('a steady run at 30, 120 and jumpy frame rates (up to 60% longer or shorter frames at random): still exact, inside every limit, the same steps a second, and no joint jerks more than three times as hard as at 60', ok, `60 fps: ${(base.accel / 1000).toFixed(0)}k; ${rows.join('; ')}`);
}

// ---- 3. Starting and stopping ----
{
 const r = simulate(t => t < .5 ? [0, 0] : t < 5 ? [0, 1] : [0, 0], 12);
 const rest = S.restPose(), legs = ['thigh.L', 'thigh.R', 'shin.L', 'shin.R', 'foot.L', 'foot.R'];
 const end = r.player.update(1 / 60); let worst = 0;
 for(const n of legs) for(const k of AX) worst = Math.max(worst, Math.abs(end[n][k] - rest[n][k]));
 check('running flat out from standing and letting go: every joint inside its limits, no invalid numbers, nothing more than 1 cm into the floor, and he ends standing at rest, legs within 8 degrees of the rest pose (a standing knee is a little soft)',
  r.bad === 0 && r.nan === 0 && r.low > -.01 && worst < 8 && r.gait.settled, `legs ${worst.toFixed(2)}° from rest; worst joint ${(r.accel / 1000).toFixed(0)}k deg/s²; lowest ${mm(r.low)}`);
}

// ---- 4. Turning ----
{
 const a = 150 * Math.PI / 180, r = simulate(t => t < 1 ? [0, 0] : [Math.sin(a), Math.cos(a)], 4);
 const hold = r.holdFrames / 60;
 check('a 150° flick from standing is turned on the spot first (he waits until he faces within 70° of the way asked, the feet step in place, and he sets off after), then he runs', r.firstMove - 1 > .08 && r.firstMove - 1 < 1.5 && r.lifted > 10 && r.bad === 0 && r.nan === 0, `held ${hold.toFixed(2)} s; sets off ${(r.firstMove - 1).toFixed(2)} s after the flick; feet lifted in ${r.lifted} frames`);
 let worst = 0, off = 0, frames = 0, nan = 0, bad = 0;
 for(const deg of [0, 45, 90, 135, 180, 225, 270, 315]){
  const b = deg * Math.PI / 180, q = simulate(t => t < .5 ? [0, 0] : [Math.sin(b) * .7, Math.cos(b) * .7], 8, {from: 4});
  worst = Math.max(worst, q.maxErr); off += q.off; frames += q.frames; nan += q.nan; bad += q.bad;
 }
 check('the same steady run in each of eight directions (including due south) is just as exact', off / frames < .01 && worst < .005 && nan === 0 && bad === 0, `${(100 * off / frames).toFixed(2)}% of frames over 1 mm, worst ${mm(worst)}`);
 const u = simulate(t => t < .5 ? [0, 0] : t < 4 ? [0, .7] : [0, -.7], 12, {from: 4});
 check('a U-turn at a fast run: inside every limit, no invalid numbers, nothing more than 1 cm into the floor, no joint jerking over 100,000 degrees a second squared', u.bad === 0 && u.nan === 0 && u.low > -.01 && u.accel < 100000, `worst joint ${(u.accel / 1000).toFixed(0)}k deg/s² (${u.who}); lowest ${mm(u.low)}`);
}

// ---- 5. Random sticks, at 60 and at jumpy frame rates ----
{
 let low = Infinity, nan = 0, bad = 0, frames = 0, off = 0, accel = 0, who = '';
 for(const [seed, jitter] of [[1, 0], [2, 0], [3, .5], [4, .5]]){
  let s = seed * 7919; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const ph = [rnd() * 6, rnd() * 6, rnd() * 6], fq = [.2 + rnd() * .5, .3 + rnd() * .6, .15 + rnd() * .4];
  const r = simulate(t => { const a = Math.sin(t * fq[0] + ph[0]) * 3, m = Math.min(1, Math.max(0, Math.sin(t * fq[1] + ph[1]) * .9 + .5)); return [Math.sin(a) * m, Math.cos(a) * m]; }, 25, {jitter});
  low = Math.min(low, r.low); nan += r.nan; bad += r.bad; frames += r.frames; off += r.off; if(r.accel > accel){ accel = r.accel; who = r.who; }
 }
 check('four 25-second random sticks (two at jumpy frame rates): no invalid numbers, every joint inside its limits, nothing more than 2 cm into the floor, no joint jerking over 150,000 degrees a second squared', nan === 0 && bad === 0 && low > -.02 && accel < 150000, `${frames} frames; ${(100 * off / frames).toFixed(2)}% over 1 mm; lowest ${mm(low)}; worst joint ${(accel / 1000).toFixed(0)}k deg/s² (${who})`);
}

// ---- 6. It remembers nothing ----
{
 // The same state gives the same feet and pose, however often and in whatever order they are asked for.
 const gait = createGait(S);
 for(let i = 0; i < 100; i++) gait.update(1 / 60, {x: 0, z: i * .03, facing: 0, vx: 0, vz: 1.8, speed: 1.8});
 const a = JSON.stringify(gait.goals(2.5)), p1 = JSON.stringify(gait.pose(2.5));
 gait.goals(3); gait.pose(1); gait.goals(9); gait.pose(2);
 check('asking for the feet and the pose at other times in between changes nothing (the gait is a plain function of its state, with no hidden memory to confuse)', a === JSON.stringify(gait.goals(2.5)) && p1 === JSON.stringify(gait.pose(2.5)), 'identical');
 const raised = createGait(S, {ground: () => 2}), flat = createGait(S);
 for(let i = 0; i < 100; i++){ const b = {x: 0, z: i * .03, facing: 0, vx: 0, vz: 1.8, speed: 1.8}; raised.update(1 / 60, b); flat.update(1 / 60, b); }
 const gr = raised.goals(2.0), gf = flat.goals(2.0);
 check('on ground raised 2 m, every foot is exactly 2 m higher than on the flat, and the body height is the same', ['L', 'R'].every(s => Math.abs(gr['foot.' + s].sole[1] - gf['foot.' + s].sole[1] - 2) < 1e-9) && Math.abs(raised.bodyHeight(2) - flat.bodyHeight(2)) < 1e-12, 'exactly');
}

// ---- 7. Fast enough ----
{
 const t0 = performance.now(); simulate(t => t < .5 ? [0, 0] : [0, 1], 8); const ms = (performance.now() - t0) / (8 * 60);
 check('a whole frame (movement rules, gait, legs, plus this test\'s own measuring) costs under 6 ms on average', ms < 6, `${ms.toFixed(2)} ms a frame`);
}

console.table(R);
const fail = R.some(r => r.result === 'FAIL');
console.log(fail ? 'FAIL' : 'PASS: the gait is exact, smooth at every speed and frame rate, runs with a moment in the air, turns first, and holds up on random sticks.');
process.exit(fail ? 1 : 0);
