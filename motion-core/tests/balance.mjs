// Balance checks: centre of mass, support, the shift that centres the weight,
// and the smooth follower. Usage: node motion-core/tests/balance.mjs
import {createSkeleton} from '../skeleton/skeleton.js';
import {reach} from '../skeleton/reach.js';
import {createPosePlayer} from '../skeleton/pose.js';
import {SEGMENTS, centreOfMass, supportPoints, supportCentre, balanceShift, reachDrop, createShiftFollower} from '../skeleton/balance.js';

const S = createSkeleton();
const R = [], check = (name, ok, detail = '') => R.push({check: name, result: ok ? 'PASS' : 'FAIL', detail});
const mm = v => (v * 1000).toFixed(3) + ' mm';
const rest = () => S.solve(S.restPose());
const feetAt = (lift = {}) => ({
 'foot.L': {sole: [.15, lift.L ?? 0, .025], heading: 0},
 'foot.R': {sole: [-.15, lift.R ?? 0, .025], heading: 0},
});
const rootAt = (dx, drop, dz) => ({position: [dx, -drop, dz], rotation: {x: 0, y: 0, z: 0}});
// The body shifted by (dx, dz) and lowered just enough for the planted feet to reach (feet planted by the reach layer).
const settle = (goals, dx = 0, dz = 0) => {
 const drop = reachDrop(S, S.solve({root: rootAt(dx, 0, dz)}), goals);
 const root = rootAt(dx, drop, dz), pose = {...reach(S, {root}, goals).pose, root};
 return {solved: S.solve(pose), drop};
};
const solvedWith = (goals, dx, dz) => settle(goals, dx, dz).solved;

// ---- 1. The mass shares add up to the whole body ----
{
 const total = SEGMENTS.reduce((s, g) => s + g.mass, 0);
 check('segment mass shares add up to 1 (the whole body)', Math.abs(total - 1) < 1e-9, `total ${total.toFixed(6)}`);
}

// ---- 2. Standing at rest ----
const c0 = centreOfMass(rest());
check('standing: the centre of mass is exactly on the middle line (left and right balance)', Math.abs(c0.x) < 1e-9, `x ${mm(c0.x)}`);
{
 const hipY = S.bones[S.index.get('thigh.L')].head[1], neckY = S.bones[S.index.get('neck')].head[1];
 check('standing: the centre of mass sits in the lower trunk (above the hips, below mid-trunk)', c0.y > hipY && c0.y < (hipY + neckY) / 2, `${c0.y.toFixed(3)} m; hips ${hipY.toFixed(3)} m, mid-trunk ${((hipY + neckY) / 2).toFixed(3)} m`);
}

// ---- 3. Mirror ----
{
 const p = S.restPose();
 p['upperArm.L'] = {x: -60, y: 0, z: -10}; p['lowerArm.L'] = {x: -40, y: 0, z: 0}; p['thigh.L'] = {x: -30, y: 0, z: 0};
 const a = centreOfMass(S.solve(p)), b = centreOfMass(S.solve(S.mirrorPose(p)));
 check('a mirrored pose has the mirrored centre of mass', Math.abs(a.x + b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9 && Math.abs(a.z - b.z) < 1e-9, `x ${mm(a.x)} vs ${mm(b.x)}`);
}

// ---- 4. Support ----
{
 const s = supportPoints(S, rest());
 const [cx] = supportCentre(s.points);
 check('standing on both feet: all 12 contact points carry weight and the support centre is on the middle line', s.points.length === 12 && s.feet.join() === 'L,R' && Math.abs(cx) < 1e-9, `${s.points.length} points, feet ${s.feet.join('+')}, centre x ${mm(cx)}`);
}
{
 const solved = solvedWith(feetAt({L: .15}), 0, 0), s = supportPoints(S, solved), s2 = supportPoints(S, solved, {ground: (x) => x > 0 ? .15 : 0});
 check('a lifted foot carries no weight (flat ground), but does when the ground under it is raised', s.feet.join() === 'R' && s2.feet.join() === 'L,R', `flat: ${s.feet.join('+')}; raised ground under left: ${s2.feet.join('+')}`);
}
{
 const s = supportCentre([{x: 0, z: 0}, {x: 1, z: 0}, {x: 1, z: 1}, {x: 0, z: 1}, {x: .5, z: .5}]);
 const line = supportCentre([{x: 0, z: 0}, {x: 2, z: 0}]);
 check('support centre: the middle of a square; the average of a line', Math.abs(s[0] - .5) < 1e-9 && Math.abs(s[1] - .5) < 1e-9 && Math.abs(line[0] - 1) < 1e-9, `square (${s[0].toFixed(3)}, ${s[1].toFixed(3)}), line x ${line[0].toFixed(3)}`);
}

// ---- 5. The shift that centres the weight (feet stay planted; the legs bend) ----
{
 const goals = feetAt({L: .15});
 let dx = 0, dz = 0, last = null;
 for(let i = 0; i < 4; i++){
  const solved = solvedWith(goals, dx, dz), b = balanceShift(S, solved);
  last = b; dx += b.shift[0];
 }
 const finalSolved = solvedWith(goals, dx, 0), fin = balanceShift(S, finalSolved);
 const lx = finalSolved.get('foot.L').head, rx = finalSolved.get('foot.R').head;
 check('left foot lifted: shifting the body moves the weight over the right foot (centre of mass within 0.5 mm of the support centre)', last.feet.join() === 'R' && Math.abs(fin.shift[0]) < 5e-4 && dx < -.05,
  `shift ${mm(dx)} sideways; weight off by ${mm(fin.shift[0])}; support ${last.feet.join('+')}`);
 check('while shifting, the planted foot stays exactly where it was', Math.abs(rx.x - -.15) < 1e-6 && Math.abs(rx.y - S.bones[S.index.get('foot.R')].head[1]) < 1e-6, `right ankle off by ${mm(Math.hypot(rx.x + .15, rx.z - .025))}`);
}
{
 const goals = feetAt({R: .15});
 let dx = 0;
 for(let i = 0; i < 4; i++) dx += balanceShift(S, solvedWith(goals, dx, 0)).shift[0];
 const goalsL = feetAt({L: .15});
 let dxL = 0;
 for(let i = 0; i < 4; i++) dxL += balanceShift(S, solvedWith(goalsL, dxL, 0)).shift[0];
 check('lifting the other foot shifts the body the other way by the same amount (mirror)', Math.abs(dx + dxL) < 1e-4 && dx > 0, `right lifted ${mm(dx)}, left lifted ${mm(dxL)}`);
}
{
 const b = balanceShift(S, rest(), {axes: 'xz', fore: .5});
 const heel = balanceShift(S, rest(), {axes: 'xz', fore: 0}), toe = balanceShift(S, rest(), {axes: 'xz', fore: 1});
 check('fore/aft: asking for weight on the toes moves the target forward of asking for the heels', toe.target[1] > b.target[1] && b.target[1] > heel.target[1] && balanceShift(S, rest()).shift[1] === 0, `heels z ${heel.target[1].toFixed(3)}, middle ${b.target[1].toFixed(3)}, toes ${toe.target[1].toFixed(3)}`);
 check('nothing on the ground: no balance answer (not a guess)', balanceShift(S, rest(), {ground: () => -1}) === null);
}

// ---- 6. The smooth follower ----
const DT = 1 / 120;
{
 const f = createShiftFollower({duration: .3, size: 1}), pos = [], vel = [];
 f.retarget([.12]);
 for(let i = 0; i < 60; i++){ pos.push(f.update(DT)[0]); vel.push(f.speed[0]); }
 const acc = pos.slice(2).map((p, i) => (p - 2 * pos[i + 1] + pos[i]) / (DT * DT));
 check('a shift starts and ends at rest, arrives exactly, and never overshoots', vel[0] < .01 && Math.abs(pos.at(-1) - .12) < 1e-12 && Math.max(...pos) <= .12 + 1e-12 && Math.abs(vel.at(-1)) < 1e-12, `first speed ${vel[0].toFixed(4)} m/s, last ${vel.at(-1).toExponential(1)}, peak ${Math.max(...pos).toFixed(6)}`);
 check('a 12 cm shift in 0.3 s is gentle (peak acceleration under 10 m/s squared)', Math.max(...acc.map(Math.abs)) < 10, `peak ${Math.max(...acc.map(Math.abs)).toFixed(2)} m/s²`);
}
{
 const f = createShiftFollower({duration: .3, size: 1});
 f.retarget([.12]);
 for(let i = 0; i < 14; i++) f.update(DT);
 const p0 = f.value[0], v0 = f.speed[0];
 f.retarget([-.05]);
 const p1 = f.value[0], v1 = f.speed[0];
 const a = f.update(DT)[0], b = f.update(DT)[0];
 check('changing course mid-way carries position and speed straight on (no kink)', Math.abs(p1 - p0) < 1e-12 && Math.abs(v1 - v0) < 1e-9 && Math.abs((b - a) / DT - v0) < .15, `speed before ${v0.toFixed(4)} m/s, right after ${v1.toFixed(4)} m/s`);
 for(let i = 0; i < 80; i++) f.update(DT);
 check('after changing course it still arrives exactly and stays still', Math.abs(f.value[0] + .05) < 1e-12 && Math.abs(f.speed[0]) < 1e-12, `${mm(f.value[0] + .05)} from target`);
}
{
 const f = createShiftFollower({duration: .3, size: 1});
 f.retarget([.1]);
 for(let i = 0; i < 100; i++) f.update(DT);
 const v = f.value[0];
 f.retarget([.1 + 5e-6]);
 for(let i = 0; i < 5; i++) f.update(DT);
 check('tiny changes in the wanted value (under 10 micrometres) are ignored, so it can settle', f.value[0] === v, `moved ${mm(f.value[0] - v)}`);
}
{
 const f = createShiftFollower({duration: .3, size: 2});
 f.retarget([.1, -.2]);
 for(let i = 0; i < 80; i++) f.update(DT);
 check('two axes move together and each arrives exactly', Math.abs(f.value[0] - .1) < 1e-12 && Math.abs(f.value[1] + .2) < 1e-12, `${f.value.map(v => v.toFixed(4)).join(', ')}`);
}

// ---- 7. In the pose player: lift a foot and the body shifts over the other ----
{
 const lift = t => { const s = Math.min(1, Math.max(0, (t - .5) / 1)); return .15 * (10*s**3 - 15*s**4 + 6*s**5); };
 const run = (balance, seconds, drop = false) => {
  const P = createPosePlayer(S, {}, {follow: true}), frames = [];
  P.setGoals('feet', t => ({'foot.L': {sole: [.15, drop ? .15 - lift(t) : lift(t), .025], heading: 0}, 'foot.R': {sole: [-.15, 0, .025], heading: 0}}), {fade: 0});
  if(balance) P.setBalance();
  for(let i = 0; i < seconds * 60; i++){ const pose = P.update(1 / 60); frames.push({pose, shift: P.balanceShift ? [...P.balanceShift] : null}); }
  return {P, frames};
 };
 const {P, frames} = run(true, 4);
 const q = S.solve(frames.at(-1).pose), fin = balanceShift(S, q), R0 = S.bones[S.index.get('foot.R')].head;
 let planted = 0, accel = 0;
 frames.forEach((f, i) => { const h = S.solve(f.pose).get('foot.R').head; planted = Math.max(planted, Math.hypot(h.x - R0[0], h.y - R0[1], h.z - R0[2])); if(i >= 2) accel = Math.max(accel, Math.abs(f.pose.root.position[0] - 2 * frames[i - 1].pose.root.position[0] + frames[i - 2].pose.root.position[0])); });
 check('player with balance: lifting the left foot puts the weight over the right foot (within 1 mm)', fin.feet.join() === 'R' && Math.abs(fin.shift[0]) < 1e-3, `weight off by ${mm(fin.shift[0])}; body shifted ${mm(frames.at(-1).shift[0])}`);
 check('player with balance: the planted foot never moves while the body shifts', planted < 1e-6, `largest movement ${mm(planted)}`);
 check('player with balance: the shift is smooth (body acceleration under 1.5 mm per frame squared)', accel < 1.5e-3, `${(accel * 1000).toFixed(2)} mm`);
 check('player with balance: once settled the body is perfectly still', Math.abs(frames.at(-1).shift[0] - frames.at(-2).shift[0]) < 1e-12 && Math.abs(frames.at(-1).pose.root.position[0] - frames.at(-2).pose.root.position[0]) < 1e-12, `moved ${((frames.at(-1).shift[0] - frames.at(-2).shift[0]) * 1000).toExponential(1)} mm in the last frame`);
 const off = run(false, 4);
 check('player without balance: the body does not move (balance is only used when asked for)', off.frames.every(f => f.pose.root.position.every(v => v === 0)) && off.P.balanceShift === null, 'root stays at 0');
 const back = run(true, 6, true);
 const last = back.frames.at(-1);
 check('foot goes back down: the weight returns to the middle on its own (within 0.05 mm)', Math.abs(last.shift[0]) < 5e-5 && Math.abs(last.pose.root.position[0]) < 5e-5, `body ${mm(last.pose.root.position[0])} from the middle`);
}
{
 const P = createPosePlayer(S, {}, {follow: true});
 P.setGoals('feet', () => ({'foot.L': {sole: [.15, 0, .025], heading: 0}, 'foot.R': {sole: [-.15, 0, .025], heading: 0}}), {fade: 0});
 P.setBalance(); for(let i = 0; i < 120; i++) P.update(1 / 60);
 const both = P.balanceShift[0];
 P.clearBalance(); for(let i = 0; i < 90; i++) P.update(1 / 60);
 check('standing on both feet: balance changes nothing; after clearBalance it is gone', Math.abs(both) < 1e-9 && P.balanceShift === null, `shift ${mm(both)}, then ${P.balanceShift === null ? 'off' : 'still on'}`);
 const Q = createPosePlayer(S, {}, {follow: true});
 Q.setBalance(); for(let i = 0; i < 60; i++) Q.update(1 / 60);
 check('balance with no planted feet does nothing (no goals, no sliding)', Math.abs(Q.balanceShift[0]) < 1e-12, `${mm(Q.balanceShift[0])}`);
}

{
 const P = createPosePlayer(S, {}, {follow: true});
 P.setGoals('feet', t => ({'foot.L': {sole: [.15, .15 * Math.min(1, t), .025], heading: 0}, 'foot.R': {sole: [-.15, 0, .025], heading: 0}}), {fade: 0});
 P.setBalance();
 for(let i = 0; i < 60; i++) P.update(1 / 60);
 const t0 = performance.now(); let worst = 0;
 for(let i = 0; i < 240; i++){ const a = performance.now(); P.update(1 / 60); worst = Math.max(worst, performance.now() - a); }
 const avg = (performance.now() - t0) / 240;
 check('a whole frame with balance (feet planted, weight shifting) is fast: under 2 ms on average and under 5 ms at worst', avg < 2 && worst < 5, `${avg.toFixed(2)} ms average, ${worst.toFixed(2)} ms worst`);
}

// ---- 8. Fast enough ----
{
 const solved = solvedWith(feetAt({L: .15}), 0, 0);
 const t0 = performance.now();
 for(let i = 0; i < 1000; i++) balanceShift(S, solved);
 const us = (performance.now() - t0) / 1000 * 1000;
 check('fast enough for every frame (under 0.1 ms for centre of mass, support and shift)', us < 100, `${us.toFixed(1)} µs`);
}

console.table(R);
const fail = R.some(r => r.result === 'FAIL');
console.log(fail ? 'FAIL' : 'PASS: balance finds the weight, the support, and shifts smoothly.');
process.exit(fail ? 1 : 0);
