// Running checks (the game's own movement numbers: a gentle push walks up to 3.1 m/s, a full push runs at 8.6).
// Usage: node motion-core/tests/run.mjs
import {createSkeleton} from '../skeleton/skeleton.js';
import {createPosePlayer} from '../skeleton/pose.js';
import {createWalker, attachWalker} from '../skeleton/walk.js';
import {createMoveController} from '../controller.js';
import {MOVE_TUNING} from '../tuning.js';

const S = createSkeleton(), AX = ['x', 'y', 'z'];
const R = [], check = (name, ok, detail = '') => R.push({check: name, result: ok ? 'PASS' : 'FAIL', detail});
const mm = v => (v * 1000).toFixed(1) + ' mm';
const inLimits = p => S.bones.filter(b => b.parent && p[b.name]).every(b => AX.every(k => p[b.name][k] >= b.limits[k][0] - 1e-6 && p[b.name][k] <= b.limits[k][1] + 1e-6));

/** Drive the whole stack for `seconds` with stick(t) -> [x, z]; measure from `from` seconds on. */
function simulate(stick, seconds, from = 0){
 const ctl = createMoveController(MOVE_TUNING), player = createPosePlayer(S, {}, {follow: true}), walker = createWalker(S, {start: {x: 0, z: 0, facing: 0}});
 attachWalker(player, walker);
 const out = {frames: 0, off: 0, maxErr: 0, bad: 0, nan: 0, low: Infinity, slide: 0, air: 0, steps: 0, vMax: 0, ctl, walker, player};
 let last = null, lastLand = {L: false, R: false};
 for(let i = 0; i < seconds * 60; i++){
  const t = i / 60, [wx, wz] = stick(t);
  ctl.state.hold = walker.holdMove; ctl.advance(1 / 60, wx, wz);
  const st = ctl.state; walker.update(1 / 60, {x: st.x, z: st.z, facing: st.facing, vx: st.vx, vz: st.vz, speed: st.speed, aim: st.aim});
  const pose = player.update(1 / 60), g = walker.goals(player.time), q = S.solve(pose);
  if(t < from){ last = null; continue; }
  out.frames++; out.vMax = Math.max(out.vMax, st.speed);
  let fe = 0, anyDown = false; const pts = {}, tc = {};
  for(const sd of ['L', 'R']){
   const h = q.get('foot.' + sd).head, gl = g['foot.' + sd].sole; fe = Math.max(fe, Math.hypot(h.x - gl[0], h.y - (gl[1] + .1635), h.z - gl[2]));
   pts[sd] = walker.planner.contactPoints(sd, player.time); tc[sd] = pts[sd].map(p => p.y < 1e-6);
   pts[sd].forEach(p => { out.low = Math.min(out.low, p.y); }); if(tc[sd].some(x => x)) anyDown = true;
   if(tc[sd].some(x => x) && !lastLand[sd]) out.steps++;
   lastLand[sd] = tc[sd].some(x => x);
  }
  out.maxErr = Math.max(out.maxErr, fe); if(fe > 1e-3) out.off++;
  if(!anyDown) out.air++;
  if(!inLimits(pose)) out.bad++;
  for(const b of Object.values(pose)) if(b && typeof b === 'object' && 'x' in b && !(Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.z))) out.nan++;
  if(last) for(const sd of ['L', 'R']) pts[sd].forEach((p, k) => { if(last.tc[sd][k] && tc[sd][k]) out.slide = Math.max(out.slide, Math.hypot(p.x - last.pts[sd][k].x, p.z - last.pts[sd][k].z)); });
  last = {pts, tc};
 }
 return out;
}

// ---- 1. Steady runs at the speeds the stick gives ----
for(const [stick, label, relaxed] of [[.3, 'a jog', false], [.55, 'the top of a walk push (3.1 m/s)', false], [.7, 'a run', false], [.85, 'a fast run', false], [1, 'flat out (8.6 m/s)', true]]){
 const r = simulate(t => t < .5 ? [0, 0] : [0, stick], 9, 3.5);
 const exact = relaxed ? r.off / r.frames < .25 && r.maxErr < .01 : r.off / r.frames < .01 && r.maxErr < .002;
 check(`steady ${label}: feet exact${relaxed ? ' (within 1 cm, 25% of frames over 1 mm: the legs are at their limit)' : ' (within 1 mm in 99% of frames)'}, never slide, nothing below the ground, every joint inside its limits, no invalid numbers`,
  exact && r.slide < 1e-6 && r.low > -1e-9 && r.bad === 0 && r.nan === 0, `${r.ctl.state.speed.toFixed(1)} m/s: ${(100 * r.off / r.frames).toFixed(1)}% of frames over 1 mm, worst ${mm(r.maxErr)}; slide ${r.slide.toExponential(1)}; lowest ${mm(r.low)}; ${r.bad} frames past a limit`);
 if(stick >= .55) check(`steady ${label}: both feet are in the air for part of every step (a real run, not a fast walk)`, r.air / r.frames > .1, `${(100 * r.air / r.frames).toFixed(0)}% of the time in the air; ${(r.steps / 5.5).toFixed(1)} steps a second`);
}

// ---- 1b. The same run in every direction (a body that faces north is not special) ----
{
 let worst = 0, off = 0, frames = 0, nan = 0, low = Infinity, slide = 0;
 for(const deg of [0, 45, 90, 135, 180, 225, 270, 315]){
  const a = deg * Math.PI / 180, r = simulate(t => t < .5 ? [0, 0] : [Math.sin(a) * .7, Math.cos(a) * .7], 9, 4);
  worst = Math.max(worst, r.maxErr); off += r.off; frames += r.frames; nan += r.nan; low = Math.min(low, r.low); slide = Math.max(slide, r.slide);
 }
 check('a steady run facing each of eight directions (including due south, where the turn wraps round): feet within 1 mm in 99% of frames, never slide, nothing below the ground',
  off / frames < .01 && worst < .005 && slide < 1e-6 && low > -1e-9 && nan === 0, `${(100 * off / frames).toFixed(2)}% of frames over 1 mm, worst ${mm(worst)}; slide ${slide.toExponential(1)}`);
 // And after a U-turn at speed: once round, the run is as good as before (the weight shift must not carry the old direction with it).
 const u = simulate(t => t < .5 ? [0, 0] : t < 4 ? [0, .7] : [0, -.7], 12, 7);
 check('after a U-turn at a fast run the run settles at once: feet within 1 mm in 99% of the frames from three seconds after the turn', u.off / u.frames < .01 && u.maxErr < .005, `${(100 * u.off / u.frames).toFixed(2)}% of frames over 1 mm, worst ${mm(u.maxErr)}`);
}

// ---- 2. Starting, stopping and the changes in between ----
{
 const scenes = {
  'run flat out, then let go': t => t < .5 ? [0, 0] : t < 5 ? [0, 1] : [0, 0],
  'a half push, stop, go again': t => t < .5 ? [0, 0] : (Math.floor(t / 1.5) % 2 ? [0, 0] : [0, .55]),
  'walk, jog and run, back and forth': t => t < .5 ? [0, 0] : [0, .3 + .7 * Math.abs(Math.sin(t * .5))],
 };
 for(const [name, f] of Object.entries(scenes)){
  const r = simulate(f, 14), idle = name.startsWith('walk') ? true : r.walker.mode === 'idle' || r.walker.mode === 'settling';
  check(`${name}: nothing below the ground, never slides, every joint inside its limits, no invalid numbers, and the feet are never more than 1 m from where they should be`,
   r.low > -1e-9 && r.slide < 1e-6 && r.bad === 0 && r.nan === 0 && r.maxErr < 1 && idle, `worst foot error ${mm(r.maxErr)} (${(100 * r.off / r.frames).toFixed(1)}% of frames over 1 mm); ended ${r.walker.mode} at ${r.ctl.state.speed.toFixed(1)} m/s`);
 }
}

// ---- 3. Random sticks at game speed ----
{
 let low = Infinity, slide = 0, nan = 0, bad = 0, frames = 0, off = 0;
 for(const seed of [1, 2, 3, 4]){
  let s = seed * 7919; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const ph = [rnd() * 6, rnd() * 6, rnd() * 6], fq = [.2 + rnd() * .5, .3 + rnd() * .6, .15 + rnd() * .4];
  const r = simulate(t => { const a = Math.sin(t * fq[0] + ph[0]) * 3, m = Math.min(1, Math.max(0, Math.sin(t * fq[1] + ph[1]) * .9 + .5)); return [Math.sin(a) * m, Math.cos(a) * m]; }, 25);
  low = Math.min(low, r.low); slide = Math.max(slide, r.slide); nan += r.nan; bad += r.bad; frames += r.frames; off += r.off;
 }
 check('four 25-second random sticks at game speed: no invalid numbers, nothing below the ground, never slides, every joint inside its limits', nan === 0 && low > -1e-9 && slide < 1e-6 && bad === 0, `${frames} frames; ${(100 * off / frames).toFixed(1)}% over 1 mm; slide ${slide.toExponential(1)}; lowest ${mm(low)}; ${bad} frames past a limit`);
}

// ---- 4. Fast enough ----
{
 const t0 = performance.now(); simulate(t => t < .5 ? [0, 0] : [0, 1], 8); const ms = (performance.now() - t0) / (8 * 60);
 check('a whole frame while running (movement rules, walker, balance, legs, plus this test\'s own measuring) costs under 6 ms on average', ms < 6, `${ms.toFixed(2)} ms a frame`);
}

console.table(R);
const fail = R.some(r => r.result === 'FAIL');
console.log(fail ? 'FAIL' : 'PASS: the run keeps its feet exact up to a fast run, leaves the ground between steps, and holds up on random sticks.');
process.exit(fail ? 1 : 0);
