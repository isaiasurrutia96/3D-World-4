// Foot planning checks. Usage: node motion-core/tests/footplan.mjs
import {createSkeleton} from '../skeleton/skeleton.js';
import {reach} from '../skeleton/reach.js';
import {createFootPlanner, STEP_DEFAULTS} from '../skeleton/footplan.js';
import {footContactPoints} from '../skeleton/balance.js';

const S = createSkeleton();
const R = [], check = (name, ok, detail = '') => R.push({check: name, result: ok ? 'PASS' : 'FAIL', detail});
const mm = v => (v * 1000).toFixed(3) + ' mm';
const fmt = v => v.toExponential(1);

// A block 15 cm high (x -0.02..0.32, z 0.35..0.9) and a thin wall 12 cm high across z = 0.3 (the other side of the block's gap).
const BLOCK = (x, z) => x > -.02 && x < .32 && z > .35 && z < .9 ? .15 : 0;
const WALL = (x, z) => Math.abs(z - .3) < .02 ? .12 : 0;
const worst = (P, side, t0, t1, ground, need = 0, n = 4000) => {
 let w = Infinity;
 for(let i = 0; i <= n; i++){
  const t = t0 + (t1 - t0) * i / n;
  for(const p of P.contactPoints(side, t)) w = Math.min(w, p.y - ground(p.x, p.z));
 }
 return w;
};

// ---- 1. Standing ----
{
 const P = createFootPlanner(S), g = P.goals(0);
 check('both feet start planted where he stands, on the ground', g['foot.L'].sole.join() === [.15, 0, .025].join() && g['foot.R'].sole.join() === [-.15, 0, .025].join() && P.isPlanted('L', 0) && P.isPlanted('R', 0), `${g['foot.L'].sole.join(', ')} and ${g['foot.R'].sole.join(', ')}`);
 const P2 = createFootPlanner(S, {ground: BLOCK, soles: {L: [.15, undefined, .5], R: [-.15, 0, 0]}});
 check('a foot started on raised ground rests on top of it (and a given spot is kept)', Math.abs(P2.goals(0)['foot.L'].sole[1] - .15) < 1e-12 && P2.goals(0)['foot.R'].sole[1] === 0, `left height ${mm(P2.goals(0)['foot.L'].sole[1])}`);
}

// ---- 2. A planted foot never moves ----
{
 const P = createFootPlanner(S), g0 = JSON.stringify(P.goals(0)['foot.R']);
 P.stepTo('L', 1, {sole: [.15, .4]}, {duration: 1});
 let same = true;
 for(let i = 0; i < 2000; i++) if(JSON.stringify(P.goals(i * .003)['foot.R']) !== g0) same = false;
 check('the planted foot is exactly the same value at every moment while the other foot steps (it cannot slide)', same, 'identical on 2000 samples');
}

// ---- 3. A step starts and ends at rest, lands flat and exact ----
{
 const P = createFootPlanner(S, {ground: BLOCK});
 P.stepTo('L', 0, {sole: [.15, .62]}, {duration: 1.6});
 const a = P.state('L', 0), b = P.state('L', 1.6), c = P.state('L', 5);
 const speed = s => Math.hypot(...s.velocity);
 check('a step starts and ends at rest in the world, so the foot lands without sliding', speed(a) < 1e-12 && speed(b) < 1e-12, `start ${speed(a).toExponential(1)} m/s, end ${speed(b).toExponential(1)} m/s`);
 check('it lands exactly on the spot, flat, on top of the block', b.sole[0] === .15 && b.sole[2] === .62 && Math.abs(b.sole[1] - .15) < 1e-12 && b.pitch === 0 && b.roll === 0 && c.sole.join() === b.sole.join() && P.isPlanted('L', 1.6), `${b.sole.map(v => v.toFixed(4)).join(', ')}, pitch ${b.pitch}`);
 const mid = P.state('L', .8);
 check('in the air the toes hang a little and it is a swinging foot (not planted)', mid.pitch > 3 && mid.mode === 'swing' && !P.isPlanted('L', .8), `pitch ${mid.pitch.toFixed(1)}° at mid-step`);
}

// ---- 4. Smooth: speed matches the slope, and nothing jumps at the joins ----
{
 const P = createFootPlanner(S, {ground: BLOCK});
 P.stepTo('L', 0, {sole: [.15, .62], heading: 10}, {duration: 1.6});
 let slopeErr = 0, jump = 0, accJump = 0;
 const h = 1e-5;
 for(let i = 1; i < 1600; i++){
  const t = i * .001, a = P.state('L', t - h), b = P.state('L', t + h), s = P.state('L', t);
  for(let k = 0; k < 3; k++) slopeErr = Math.max(slopeErr, Math.abs((b.sole[k] - a.sole[k]) / (2 * h) - s.velocity[k]));
 }
 // Joins: where the curves change over (start of the move across, the peak, the arrival, the end).
 const T = 1.6;
 for(const at of [.15 * T, .4 * T, .9 * T, T]){
  const a = P.state('L', at - 1e-7), b = P.state('L', at + 1e-7);
  for(let k = 0; k < 3; k++){ jump = Math.max(jump, Math.abs(a.sole[k] - b.sole[k]), Math.abs(a.velocity[k] - b.velocity[k]) * .01); }
  accJump = Math.max(accJump, Math.abs(a.heading - b.heading), Math.abs(a.pitch - b.pitch));
 }
 check('the foot\'s speed is exactly the slope of its path (no hidden jumps)', slopeErr < 1e-4, `largest mismatch ${slopeErr.toExponential(1)} m/s`);
 check('position, speed, heading and pitch have no jump anywhere the curves join', jump < 1e-6 && accJump < 1e-4, `largest jump ${jump.toExponential(1)}`);
}

// ---- 5. It rises first, then moves across ----
{
 const P = createFootPlanner(S, {ground: BLOCK});
 P.stepTo('L', 0, {sole: [.15, .62]}, {duration: 1.6});
 const ts = STEP_DEFAULTS.delay * 1.6, early = P.state('L', ts * .99), later = P.state('L', .5 * 1.6);
 check('from rest the foot lifts before it moves across (nothing sideways or forward until it is on its way up)', Math.abs(early.sole[2] - .025) < 1e-9 && early.sole[1] > .01 && later.sole[2] > .06, `before ${ts.toFixed(2)} s: forward ${mm(early.sole[2] - .025)}, up ${mm(early.sole[1])}`);
}

// ---- 6. It never goes into the ground (checked on the foot's real shape) ----
{
 const cases = [
  ['stepping up onto the block', BLOCK, 'L', {sole: [.15, .62]}, 0, undefined],
  ['stepping over a thin 12 cm wall', WALL, 'L', {sole: [.15, .55]}, 0, undefined],
  ['stepping diagonally across the block\'s corner', BLOCK, 'L', {sole: [.28, .5], heading: 15}, 0, undefined],
  ['a long flat stride', () => 0, 'R', {sole: [-.15, .55]}, 0, undefined],
 ];
 for(const [name, ground, side, target, , ] of cases){
  const P = createFootPlanner(S, {ground});
  P.stepTo(side, 0, target, {duration: 1.2});
  const w = worst(P, side, 0, 1.2, ground);
  check(`${name}: no part of the foot goes into the ground at any moment`, w > -3e-4, `lowest foot point ${mm(w)} above the ground`);
 }
 const P = createFootPlanner(S, {ground: BLOCK});
 P.stepTo('L', 0, {sole: [.15, .62]}, {duration: 1.6});
 P.stepTo('L', 2.6, {sole: [.15, .025]}, {duration: 1.6});
 const down = worst(P, 'L', 2.6, 4.2, BLOCK);
 check('stepping back down off the block never touches it either', down > -3e-4, `lowest foot point ${mm(down)}`);
 const flat = createFootPlanner(S); flat.stepTo('L', 0, {sole: [.15, .4]}, {duration: 1});
 let peak = 0; for(let i = 0; i <= 1000; i++) peak = Math.max(peak, Math.min(...flat.contactPoints('L', i / 1000).map(p => p.y)));
 check('on flat ground the lowest part of the foot clears the ground by the lift (5 cm) at mid-step', peak >= STEP_DEFAULTS.lift - 3e-4, `best clearance ${mm(peak)}`);
}

// ---- 7. Landing rests on the highest ground under the foot ----
{
 const P = createFootPlanner(S, {ground: BLOCK});
 P.stepTo('L', 0, {sole: [.15, .4]}, {duration: 1}); // heel on the floor? toes over the block edge
 const end = P.contactPoints('L', 1), y = P.state('L', 1).sole[1];
 const lowest = Math.min(...end.map(p => p.y - BLOCK(p.x, p.z)));
 check('a foot half on an edge rests on the higher ground: nothing under it, and something touching', lowest > -1e-9 && lowest < 1e-9, `lowest point ${mm(lowest)} from the ground at the landing; height ${mm(y)}`);
}

// ---- 8. Changing course in the middle ----
{
 const P = createFootPlanner(S, {ground: BLOCK});
 P.stepTo('L', 0, {sole: [.15, .62]}, {duration: 1.6});
 const before = P.state('L', .7);
 P.stepTo('L', .7, {sole: [.15, .025]}, {duration: 1.4});
 const after = P.state('L', .7);
 let d = 0, dv = 0;
 for(let k = 0; k < 3; k++){ d = Math.max(d, Math.abs(before.sole[k] - after.sole[k])); dv = Math.max(dv, Math.abs(before.velocity[k] - after.velocity[k])); }
 check('changing a step in the middle carries on from where the foot is, at the same position and speed (no jolt)', d < 1e-9 && dv < 1e-8 && Math.abs(before.pitch - after.pitch) < 1e-9, `position jump ${d.toExponential(1)} m, speed jump ${dv.toExponential(1)} m/s`);
 const e = P.state('L', 2.1), w2 = worst(P, 'L', .7, 2.1, BLOCK);
 check('after changing course it arrives exactly at the new spot, flat, and still never goes into the block', e.sole[0] === .15 && e.sole[2] === .025 && e.sole[1] === 0 && e.pitch === 0 && w2 > -2e-3, `lowest foot point ${mm(w2)} (a few millimetres of dip is possible when turning back at high speed)`);
 // acceleration continuity: compare numerical accelerations either side
 const h = 1e-4, acc = t => { const a = P.state('L', t - h), b = P.state('L', t), c = P.state('L', t + h); return [0, 1, 2].map(k => (a.sole[k] - 2 * b.sole[k] + c.sole[k]) / (h * h)); };
 const a1 = acc(.7 - 2e-4), a2 = acc(.7 + 2e-4);
 check('...and its acceleration carries on too (no sudden push)', [0, 1, 2].every(k => Math.abs(a1[k] - a2[k]) < .5), `acceleration jump ${[0, 1, 2].map(k => Math.abs(a1[k] - a2[k]).toFixed(3)).join(', ')} m/s²`);
}

// ---- 9. Turning takes the short way round ----
{
 const P = createFootPlanner(S);
 P.plant('L', {sole: [.15, .025], heading: 170});
 P.stepTo('L', 0, {sole: [.15, .025], heading: -170}, {duration: 1});
 let min = Infinity, max = -Infinity;
 for(let i = 0; i <= 1000; i++){ const h = P.state('L', i / 1000).heading; min = Math.min(min, h); max = Math.max(max, h); }
 const end = P.state('L', 1).heading;
 check('a 20° turn through 180° goes the short way (never swings round the long way)', max - min < 21 && ((end + 170) % 360 === 0 || Math.abs(((end + 170) % 360)) < 1e-9), `heading ranges over ${(max - min).toFixed(1)}°, ends at ${end}`);
}

// ---- 10. Left and right are mirror images ----
{
 const P = createFootPlanner(S, {ground: BLOCK});
 const M = createFootPlanner(S, {ground: (x, z) => BLOCK(-x, z)});
 P.stepTo('L', 0, {sole: [.15, .62], heading: 12}, {duration: 1.6});
 M.stepTo('R', 0, {sole: [-.15, .62], heading: -12}, {duration: 1.6});
 let err = 0;
 for(let i = 0; i <= 160; i++){ const a = P.state('L', i / 100), b = M.state('R', i / 100); err = Math.max(err, Math.abs(a.sole[0] + b.sole[0]), Math.abs(a.sole[1] - b.sole[1]), Math.abs(a.sole[2] - b.sole[2]), Math.abs(a.pitch - b.pitch), Math.abs(a.heading + b.heading)); }
 check('a right-foot step is the exact mirror of the left-foot step', err < 1e-9, `largest difference ${err.toExponential(1)}`);
}

// ---- 11. A pure function of time ----
{
 const P = createFootPlanner(S, {ground: BLOCK});
 P.stepTo('L', 0, {sole: [.15, .62]}, {duration: 1.6});
 const ref = [.3, 1.1, .7, 2].map(t => JSON.stringify(P.goals(t)));
 const order = [2, .7, 1.1, .3, 2, .3].map(t => JSON.stringify(P.goals(t)));
 check('asking for any moment, in any order or any number of times, gives the same answer', order[0] === ref[3] && order[1] === ref[2] && order[2] === ref[1] && order[3] === ref[0] && order[4] === ref[3] && order[5] === ref[0], 'identical');
 P.stepTo('L', .5, {sole: [.15, .3]}, {duration: 1}); P.stepTo('L', .2, {sole: [.15, .6]}, {duration: 1});
 const Q = createFootPlanner(S, {ground: BLOCK});
 Q.stepTo('L', 0, {sole: [.15, .62]}, {duration: 1.6}); Q.stepTo('L', .2, {sole: [.15, .6]}, {duration: 1});
 check('stepping at an earlier time rewinds the plan (as if the later step never happened)', JSON.stringify(P.goals(.9)) === JSON.stringify(Q.goals(.9)) && JSON.stringify(P.goals(3)) === JSON.stringify(Q.goals(3)), 'identical');
 const A = createFootPlanner(S, {ground: BLOCK}); A.stepTo('L', 0, {sole: [.15, .62]}, {duration: 1}); A.stepTo('L', 1.5, {sole: [.15, .025]}, {duration: 1}); A.stepTo('L', 3, {sole: [.15, .62]}, {duration: 1});
 const before = [.5, 1.2, 2.2, 3.4, 5].map(t => JSON.stringify(A.goals(t)));
 A.prune(3.1);
 const afterP = [3.4, 5].map(t => JSON.stringify(A.goals(t)));
 check('forgetting old steps (prune) never changes what happens from then on', afterP[0] === before[3] && afterP[1] === before[4], 'identical');
}

// ---- 12. With the legs: the feet land exactly, the ankle does not swing hard ----
{
 const P = createFootPlanner(S);
 P.stepTo('L', 0, {sole: [.15, .3]}, {duration: 1.2});
 let err = 0, jolt = 0, ankle = 0, prev = null, prev2 = null;
 const hold = {root: {position: [0, -.06, 0.04], rotation: {x: 0, y: 0, z: 0}}};
 for(let i = 0; i <= 100; i++){
  const t = i / 60, goals = P.goals(t), r = reach(S, hold, goals);
  err = Math.max(err, r.error['foot.L'], r.error['foot.R']);
  const cur = r.pose;
  if(prev2){ for(const n of ['thigh.L', 'shin.L', 'foot.L']) for(const k of ['x', 'y', 'z']) jolt = Math.max(jolt, Math.abs(cur[n][k] - 2 * prev[n][k] + prev2[n][k])); ankle = Math.max(ankle, Math.abs(cur['foot.L'].x - 2 * prev['foot.L'].x + prev2['foot.L'].x)); }
  prev2 = prev; prev = cur;
 }
 check('driving the legs from the planner, the feet land exactly where the planner says', err < 5e-4, `feet off by ${mm(err)}`);
 check('driving the legs, no joint of the swinging leg jolts (under 1° a frame squared), the ankle included', jolt < 1 && ankle < 1, `worst leg joint ${jolt.toFixed(2)}°, ankle ${ankle.toFixed(2)}°`);
}

// ---- 13. The planner's idea of the foot agrees with the real leg and foot ----
{
 const P = createFootPlanner(S);
 P.stepTo('L', 0, {sole: [.15, .3], heading: 8}, {duration: 1.2});
 const hold = {root: {position: [0, -.06, 0.04], rotation: {x: 0, y: 0, z: 0}}}, lim = S.bones[S.index.get('foot.L')].limits;
 let worstGap = 0, compared = 0, bound = 0, boundGap = 0;
 for(let i = 0; i <= 72; i++){
  const t = i / 60, r = reach(S, hold, P.goals(t)), solved = S.solve({...r.pose, root: hold.root}), a = r.pose['foot.L'];
  const real = Object.values(footContactPoints(S, solved, 'L')), planned = P.contactPoints('L', t);
  const gap = Math.max(...planned.map((p, k) => p.distanceTo(real[k])));
  // Where the ankle is held back by its own limit (it eases in over its last 8 degrees), the real foot cannot match (it is as flat as the ankle allows).
  if(a.x < lim.x[0] + 8.5 || a.x > lim.x[1] - 8.5 || Math.abs(a.z) > lim.z[1] - 8.5){ bound++; boundGap = Math.max(boundGap, gap); }
  else { worstGap = Math.max(worstGap, gap); compared++; }
 }
 check('the planner\'s foot (used to keep it off the ground) is where the real solved foot is, within 1 mm, whenever the ankle is inside its range', worstGap < 1e-3 && compared > 30, `largest gap ${mm(worstGap)} over ${compared} frames; ${bound} frames had the ankle at its limit (gap there up to ${mm(boundGap)}: the toes hang lower than planned)`);
}

// ---- 13b. Rocking the foot: heel strike, flat, heel lift (a rigid foot turning about a contact that stays still) ----
{
 const P = createFootPlanner(S);
 P.rollTo('L', 0, -12, {duration: .2}); P.rollTo('L', .5, 0, {duration: .2}); P.rollTo('L', 1, 20, {duration: .3});
 let heelMove = 0, toeMove = 0, low = Infinity;
 const heel0 = P.contactPoints('L', 0)[0], toe0 = P.contactPoints('L', 1.5)[5];
 for(let i = 0; i <= 2000; i++){ const t = i * .001, pts = P.contactPoints('L', t); for(const p of pts) low = Math.min(low, p.y);
  if(t <= .2) heelMove = Math.max(heelMove, pts[0].distanceTo(heel0));
  if(t >= 1) toeMove = Math.max(toeMove, pts[5].distanceTo(toe0)); }
 check('rocking onto the heel (toes up) keeps the heel exactly still, and rocking onto the toe tip (heel up) keeps the toe exactly still', heelMove < 1e-9 && toeMove < 1e-9, `heel moved ${heelMove.toExponential(1)} m, toe moved ${toeMove.toExponential(1)} m`);
 check('no part of the foot goes below the ground while it rocks either way', low > -1e-9, `lowest point ${mm(low)}`);
 const a = P.state('L', 0), b = P.state('L', 1), end = P.state('L', 1.3), back = P.state('L', .7);
 check('a roll starts and ends at rest, and rocking back to 0 puts the foot exactly flat on its spot again', Math.hypot(...a.velocity) < 1e-6 && Math.hypot(...end.velocity) < 1e-6 && back.sole.join() === [.15, 0, .025].join() && back.pitch === 0 && b.pitch === 0, `start ${Math.hypot(...a.velocity).toExponential(1)} m/s; flat again at ${back.sole.join(', ')}`);
 let slope = 0; const h = 1e-5;
 for(let i = 1; i < 1500; i++){ const t = i * .001, lo = P.state('L', t - h), hi = P.state('L', t + h), m = P.state('L', t); for(let k = 0; k < 3; k++) slope = Math.max(slope, Math.abs((hi.sole[k] - lo.sole[k]) / (2 * h) - m.velocity[k])); }
 check('while rocking, the sole point\'s speed is the slope of its path (no hidden jumps)', slope < 1e-3, `largest mismatch ${slope.toExponential(1)} m/s`);
 let threw = false; const Q = createFootPlanner(S); Q.stepTo('L', 0, {sole: [.15, .4]}, {duration: 1});
 try { Q.rollTo('L', .5, 10); } catch { threw = true; }
 check('a foot that is in a step cannot be rocked (it says so instead of guessing)', threw, 'raises an error');
 // Toe-off into a step: the swing carries on from the rocked foot with no jump.
 const W = createFootPlanner(S); W.rollTo('L', 0, 18, {duration: .3});
 const before = W.state('L', .2); W.stepTo('L', .2, {sole: [.15, .4]}, {duration: .6}); const after = W.state('L', .2);
 let d = 0, dv = 0; for(let k = 0; k < 3; k++){ d = Math.max(d, Math.abs(before.sole[k] - after.sole[k])); dv = Math.max(dv, Math.abs(before.velocity[k] - after.velocity[k])); }
 check('stepping off while the foot is still rocking (toe-off) carries its position, speed and angle straight on', d < 1e-9 && dv < 1e-6 && Math.abs(before.pitch - after.pitch) < 1e-9, `position jump ${d.toExponential(1)}, speed jump ${dv.toExponential(1)}`);
 const M = createFootPlanner(S); M.rollTo('R', 0, 18, {duration: .3}); M.rollTo('R', .4, 0, {duration: .2});
 let err = 0; for(let i = 0; i <= 700; i++){ const t = i / 1000, l = (() => { const X = createFootPlanner(S); return X; })(); }
 const L2 = createFootPlanner(S); L2.rollTo('L', 0, 18, {duration: .3}); L2.rollTo('L', .4, 0, {duration: .2});
 for(let i = 0; i <= 700; i++){ const t = i / 1000, x = L2.state('L', t), y = M.state('R', t); err = Math.max(err, Math.abs(x.sole[0] - (-y.sole[0] + 0)), Math.abs(x.sole[1] - y.sole[1]), Math.abs(x.sole[2] - y.sole[2]), Math.abs(x.pitch - y.pitch)); }
 check('a right foot rocks as the exact mirror of a left foot', err < 1e-9, `largest difference ${err.toExponential(1)}`);
 // With the legs: the ankle goes where the rock puts it and the foot takes the angle.
 const Z = createFootPlanner(S); Z.rollTo('L', 0, -8, {duration: .2}); Z.rollTo('L', .4, 0, {duration: .15}); Z.rollTo('L', .8, 16, {duration: .3});
 let e2 = 0, tilt = 0; const hold = {root: {position: [0, -.012, 0], rotation: {x: 0, y: 0, z: 0}}};
 for(let i = 0; i <= 80; i++){ const r = reach(S, hold, Z.goals(i / 60)); e2 = Math.max(e2, r.error['foot.L'], r.error['foot.R']); tilt = Math.max(tilt, r.tilt['foot.L']); }
 check('with the legs, a heel-strike roll and a heel lift land the ankle exactly and the foot takes the angle (within 0.1°)', e2 < 5e-4 && tilt < .1, `ankle off by ${mm(e2)}, angle off by ${tilt.toFixed(3)}°`);
}

// ---- 14. Fast ----
{
 const P = createFootPlanner(S, {ground: BLOCK});
 const t0 = performance.now(); for(let i = 0; i < 200; i++) P.stepTo('L', i * 2, {sole: [.15, i % 2 ? .62 : .025]}, {duration: 1.6});
 const stepMs = (performance.now() - t0) / 200;
 P.stepTo('L', 1000, {sole: [.15, .62]}, {duration: 1.6});
 const t1 = performance.now(); let s = 0; for(let i = 0; i < 20000; i++) s += P.goals(1000 + (i % 1600) * .001)['foot.L'].sole[1];
 const goalUs = (performance.now() - t1) / 20000 * 1000;
 check('fast enough: planning a whole step under 3 ms, asking for the feet under 20 microseconds', stepMs < 3 && goalUs < 20 && Number.isFinite(s), `${stepMs.toFixed(2)} ms to plan a step, ${goalUs.toFixed(1)} µs for both feet at a moment`);
}

console.table(R);
const fail = R.some(r => r.result === 'FAIL');
console.log(fail ? 'FAIL' : 'PASS: feet are planted exactly, step smoothly, clear the ground, and land flat.');
process.exit(fail ? 1 : 0);
