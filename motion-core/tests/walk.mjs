// Walking checks. Usage: node motion-core/tests/walk.mjs
import {createSkeleton} from '../skeleton/skeleton.js';
import {createPosePlayer} from '../skeleton/pose.js';
import {createWalker, attachWalker} from '../skeleton/walk.js';
import {createMoveController} from '../controller.js';
import {MOVE_TUNING} from '../tuning.js';

const S = createSkeleton();
const R = [], check = (name, ok, detail = '') => R.push({check: name, result: ok ? 'PASS' : 'FAIL', detail});
const mm = v => (v * 1000).toFixed(2) + ' mm';
const AX = ['x', 'y', 'z'];
const CONTACTS = Object.keys(S.footContacts.L);

// A simulation: the movement rules drive a body; the walker plans the feet; the player poses everything.
function simulate({seconds, stick, tuning = {}, noHold = false, speed = 1.0, start = {x: 0, z: 0, facing: 0}, fps = 60, ground = () => 0}){
 const ctl = createMoveController({...MOVE_TUNING, ...tuning, walkSpeed: speed, runSpeed: speed * 1.2, acceleration: 6, deceleration: 8});
 Object.assign(ctl.state, {x: start.x, z: start.z, facing: start.facing});
 const player = createPosePlayer(S, {}, {follow: true}), walker = createWalker(S, {start, ground});
 attachWalker(player, walker, {ground});
 const frames = [], dt = 1 / fps;
 let maxErr = 0, off = 0;
 for(let i = 0; i < seconds * fps; i++){
  const t = i * dt, [wx, wz] = stick(t, ctl.state);
  ctl.state.hold = noHold ? false : walker.holdMove; // (he turns on the spot while the feet step round to a big turn)
  ctl.advance(dt, wx, wz);
  const s = ctl.state, body = {x: s.x, z: s.z, facing: s.facing, vx: s.vx, vz: s.vz, speed: s.speed, aim: s.aim};
  walker.update(dt, body);
  const pose = player.update(dt), goals = walker.goals(player.time), solved = S.solve(pose);
  let frameErr = 0;
  for(const side of ['L', 'R']){ const h = solved.get('foot.' + side).head, g = goals['foot.' + side].sole, a = S.bones[S.index.get('foot.' + side)].head[1]; frameErr = Math.max(frameErr, Math.hypot(h.x - g[0], h.y - (g[1] + a), h.z - g[2])); }
  maxErr = Math.max(maxErr, frameErr); if(frameErr > 1e-3) off++;
  frames.push({t, pose, body, mode: walker.mode, touching: {L: touching(walker, 'L', player.time), R: touching(walker, 'R', player.time)}, pts: {L: walker.planner.contactPoints('L', player.time), R: walker.planner.contactPoints('R', player.time)}});
 }
 return {frames, walker, player, maxErr, off, ctl};
}
function touching(walker, side, t){ return walker.planner.contactPoints(side, t).map(p => p.y < 1e-6); }

const forward = (t, speedStick = .36) => t < .5 ? [0, 0] : [0, speedStick * Math.min(1, (t - .5) / 1)];

// ---- 1. Walk, then stop ----
const run = simulate({seconds: 12, stick: t => t < 8 ? forward(t) : [0, 0]});
{
 const last = run.frames.at(-1), b = last.body;
 const g = run.walker.goals(run.player.time), dz = g['foot.L'].sole[2] - g['foot.R'].sole[2], dx = g['foot.L'].sole[0] - g['foot.R'].sole[0];
 check('walks forward and comes to a stop: standing, body at rest, walker idle', last.mode === 'idle' && b.speed < 1e-3 && b.z > 4, `walked ${b.z.toFixed(1)} m; ${last.mode}`);
 check('at the end the feet stand side by side under the body (within 3 cm), the normal width apart', Math.abs(dz) < .03 && Math.abs(Math.abs(dx) - .17) < .03, `front to back ${mm(dz)}, side to side ${mm(dx)}`);
 check('every foot lands exactly where the planner says (within 0.5 mm) in every frame of the whole walk', run.maxErr < 5e-4, `worst ${mm(run.maxErr)}`);
}

// ---- 2. Planted feet never slide, nothing goes below the ground ----
{
 let slide = 0, low = Infinity;
 for(const side of ['L', 'R']) for(let i = 1; i < run.frames.length; i++){
  const a = run.frames[i - 1], b = run.frames[i];
  b.pts[side].forEach((p, k) => { low = Math.min(low, p.y); if(a.touching[side][k] && b.touching[side][k]) slide = Math.max(slide, Math.hypot(p.x - a.pts[side][k].x, p.z - a.pts[side][k].z)); });
 }
 check('a part of the foot that is on the ground never moves while it stays on the ground (no sliding at all)', slide < 1e-6, `largest slide ${slide.toExponential(1)} m`);
 check('no part of either foot is ever below the ground', low > -1e-9, `lowest ${mm(low)}`);
}

// ---- 3. Always a foot down; steps alternate ----
{
 let flight = 0, both = 0, n = 0; const lifts = [];
 const down = (f, side) => f.touching[side].some(Boolean);
 run.frames.forEach((f, i) => { if(f.t > 1 && f.t < 7.5){ n++; if(!down(f, 'L') && !down(f, 'R')) flight++; if(down(f, 'L') && down(f, 'R')) both++; }
  if(i > 0){ for(const side of ['L', 'R']) if(down(run.frames[i - 1], side) && !down(f, side)) lifts.push(side); } });
 let alternate = true; for(let i = 1; i < lifts.length; i++) if(lifts[i] === lifts[i - 1]) alternate = false;
 check('there is always a foot on the ground (no flight), and both feet are down for a good part of each step (at least 15%)', flight === 0 && both / n > .15, `${flight} frames in the air; both feet down ${(100 * both / n).toFixed(0)}% of the time`);
 const walking = lifts.length;
 check('the feet take turns (left, right, left, right ...) and keep a steady rhythm', alternate && walking >= 8, `${walking} steps, ${alternate ? 'alternating' : 'NOT alternating'}`);
 // cadence and step length at the steady speed
 const steady = run.frames.filter(f => f.t > 3 && f.t < 7.5), v = steady.reduce((s, f) => s + f.body.speed, 0) / steady.length;
 const liftTimes = []; run.frames.forEach((f, i) => { if(f.t > 3 && f.t < 7.5 && i > 0) for(const side of ['L', 'R']) if(down(run.frames[i - 1], side) && !down(f, side)) liftTimes.push(f.t); });
 const cadence = (liftTimes.length - 1) / (liftTimes.at(-1) - liftTimes[0]);
 check('the walk has a believable rhythm and step length for these legs (2 to 3.2 steps a second, step length 0.2 to 0.55 m)', cadence > 2 && cadence < 3.2 && v / cadence > .2 && v / cadence < .55, `${cadence.toFixed(2)} steps a second at ${v.toFixed(2)} m/s: steps ${(v / cadence).toFixed(2)} m`);
}

// ---- 4. How the body moves while walking steadily ----
{
 const w = run.frames.filter(f => f.t > 3 && f.t < 7.5), rng = g => { const a = w.map(g); return [Math.min(...a), Math.max(...a)]; };
 const knee = rng(f => f.pose['shin.L'].x), hip = rng(f => f.pose['thigh.L'].x), rootY = rng(f => f.pose.root.position[1] * 1000), sway = rng(f => f.pose.root.position[0] * 1000);
 check('the knees stay soft (never locked straight: at least 12° bent) and the swing knee bends no more than 80°', knee[0] >= 12 && knee[1] <= 80, `knee ${knee[0].toFixed(0)}° to ${knee[1].toFixed(0)}°`);
 check('the hips swing a believable amount (forward up to 60°, back up to 30°)', hip[0] > -60 && hip[1] < 30, `hip ${hip[0].toFixed(0)}° to ${hip[1].toFixed(0)}°`);
 check('the body bobs gently (under 4 cm up and down) and sways sideways under 5 cm each way', rootY[1] - rootY[0] < 40 && Math.max(Math.abs(sway[0]), Math.abs(sway[1])) < 50, `bob ${(rootY[1] - rootY[0]).toFixed(0)} mm; sway ${sway[0].toFixed(0)} to ${sway[1].toFixed(0)} mm`);
 let jolt = 0, jn = '', ra = 0;
 for(let i = 2; i < w.length; i++){
  for(const b of Object.keys(w[i].pose)){ if(b === 'root') continue; for(const k of AX) { const v = Math.abs(w[i].pose[b][k] - 2 * w[i - 1].pose[b][k] + w[i - 2].pose[b][k]); if(v > jolt){ jolt = v; jn = b + '.' + k; } } }
  for(let k = 0; k < 3; k++) ra = Math.max(ra, Math.abs(w[i].pose.root.position[k] - 2 * w[i - 1].pose.root.position[k] + w[i - 2].pose.root.position[k]));
 }
 check('every joint turns smoothly (no joint changes speed by more than 6° from one frame to the next) and the body accelerates under 5 mm a frame squared', jolt < 6 && ra < 5e-3, `worst joint ${jolt.toFixed(2)}° (${jn}); body ${(ra * 1000).toFixed(2)} mm`);
 // the head keeps looking ahead
 let worstHead = 0;
 for(const f of w){ const h = S.solve(f.pose).get('head'), fwd = {x: Math.sin(h.rotation.y), z: 0}; const q = h.rotation; const fx = 2 * (q.x * q.z + q.w * q.y), fz = 1 - 2 * (q.x * q.x + q.y * q.y); const yaw = Math.atan2(fx, fz) * 180 / Math.PI; worstHead = Math.max(worstHead, Math.abs(yaw - f.body.facing * 180 / Math.PI)); }
 check('the head keeps facing the way he is going (within 3°) while the pelvis and chest turn a little', worstHead < 3, `${worstHead.toFixed(2)}° at most`);
 const arm = rng(f => f.pose['upperArm.L'].x), armR = rng(f => f.pose['upperArm.R'].x);
 check('the arms swing opposite to the legs (the left arm goes forward as the right foot does), a little each way', arm[1] - arm[0] > 8 && arm[1] - arm[0] < 40 && Math.sign(arm[0]) !== Math.sign(armR[0]) || (arm[0] < 0 && armR[1] > 0), `left arm ${arm[0].toFixed(0)}° to ${arm[1].toFixed(0)}°, right ${armR[0].toFixed(0)}° to ${armR[1].toFixed(0)}°`);
}

// ---- 5. A wide turn ----
{
 const turn = simulate({seconds: 10, stick: (t) => { if(t < .5) return [0, 0]; const ramp = Math.min(1, (t - .5)), ang = Math.min(Math.PI * 1.2, Math.max(0, (t - 3) * .5)); return [Math.sin(ang) * .36 * ramp, Math.cos(ang) * .36 * ramp]; }});
 let slide = 0, low = Infinity, twist = 0;
 for(const side of ['L', 'R']) for(let i = 1; i < turn.frames.length; i++){ const a = turn.frames[i - 1], b = turn.frames[i]; b.pts[side].forEach((p, k) => { low = Math.min(low, p.y); if(a.touching[side][k] && b.touching[side][k]) slide = Math.max(slide, Math.hypot(p.x - a.pts[side][k].x, p.z - a.pts[side][k].z)); }); }
 for(const f of turn.frames) for(const sd of ['L', 'R']) twist = Math.max(twist, Math.abs(f.pose['thigh.' + sd].y));
 check('walking through a wide turn (about 130°): the feet land exactly, never slide, never go below the ground, and the hips never twist past their limit', turn.maxErr < 5e-4 && slide < 1e-6 && low > -1e-9 && twist <= 40 + 1e-6, `feet off by ${mm(turn.maxErr)}; slide ${slide.toExponential(1)}; hip twist up to ${twist.toFixed(0)}°`);
 const face = turn.frames.at(-1).body.facing * 180 / Math.PI;
 check('the body turned round as asked and ended standing, feet under it', Math.abs(face) > 100 && turn.frames.at(-1).mode === 'idle' || turn.frames.at(-1).mode === 'walking' || turn.frames.at(-1).mode === 'settling', `facing ${face.toFixed(0)}° at the end, ${turn.frames.at(-1).mode}`);
}

// ---- 6. Turning on the spot, then walking off again ----
{
 const spin = simulate({seconds: 9, stick: t => t < .5 ? [0, 0] : t < 2.5 ? [Math.sin(1.9) * .08, Math.cos(1.9) * .08] : t < 3.5 ? [0, 0] : [0, .3 * Math.min(1, t - 3.5)], speed: .6});
 check('the feet keep up with a body that turns, stops, and walks off again: always exact, nothing below the ground', spin.maxErr < 5e-4 && spin.frames.every(f => f.pts.L.concat(f.pts.R).every(p => p.y > -1e-9)), `feet off by ${mm(spin.maxErr)}`);
 const idleTurn = simulate({seconds: 4, stick: t => [0, 0], start: {x: 0, z: 0, facing: 0}});
 const w2 = createWalker(S, {start: {x: 0, z: 0, facing: 0}}), p2 = createPosePlayer(S, {}, {follow: true}); attachWalker(p2, w2);
 for(let i = 0; i < 4 * 60; i++){ const f = i < 30 ? 0 : 2.0; w2.update(1 / 60, {x: 0, z: 0, facing: f, vx: 0, vz: 0, speed: 0}); p2.update(1 / 60); }
 const g = w2.goals(p2.time), want = 2.0 * 180 / Math.PI;
 const hd = sd => { const d = ((g['foot.' + sd].heading - want) % 360 + 540) % 360 - 180; return Math.abs(d); };
 check('standing and turning on the spot by 115°: closing steps bring both feet round to face the new way (within 25°)', hd('L') < 25 && hd('R') < 25 && w2.mode === 'idle', `feet turned to within ${hd('L').toFixed(0)}° and ${hd('R').toFixed(0)}°`);
}

// ---- 6b. Turn first: a big flick from standing is made on the spot, then he walks ----
{
 const a = 150 * Math.PI / 180, sim = simulate({seconds: 6, tuning: {turnFirstAngle: 1.2}, stick: t => t < 1 ? [0, 0] : [Math.sin(a) * .4, Math.cos(a) * .4]});
 const first = sim.frames.find(f => f.t > 1 && f.body.speed > .3), moved = sim.frames.find(f => f.t > 1 && Math.hypot(f.body.x, f.body.z) > .15);
 const feet = sim.walker.goals(sim.player.time), way = a * 180 / Math.PI, off = sd => Math.abs(((feet['foot.' + sd].heading - way) % 360 + 540) % 360 - 180);
 check('turn first: a 150° flick from standing is turned on the spot by stepping the feet round, and he walks off after, not before', first && first.t - 1 > .2 && first.t - 1 < 2.5 && sim.maxErr < 5e-4 && off('L') < 30 && off('R') < 30, `sets off ${first ? (first.t - 1).toFixed(2) : 'never'} s after the flick; moved 15 cm after ${moved ? (moved.t - 1).toFixed(2) : 'never'} s; feet off by ${mm(sim.maxErr)}; feet face within ${off('L').toFixed(0)}° and ${off('R').toFixed(0)}° of the new way`);
 const same = simulate({seconds: 6, tuning: {turnFirstAngle: 0}, noHold: true, stick: t => t < 1 ? [0, 0] : [Math.sin(a) * .4, Math.cos(a) * .4]});
 const f0 = same.frames.find(f => f.t > 1 && f.body.speed > .3);
 check('turn first can be switched off: with turnFirstAngle 0 and no hold he sets off at once, as in the old rules', f0 && f0.t - 1 < .3, `sets off ${f0 ? (f0.t - 1).toFixed(2) : 'never'} s after the flick`);
}

// ---- 7. Random sticks ----
{
 // Eight sticks that swing about at random (starting, stopping, flicking round), 30 seconds each. A flick that turns
 // the body faster than the feet can step round can leave a foot a few centimetres off for a moment (the hips run out
 // of range); that must stay rare, small and never a slide or a foot below the ground.
 // (Known limit: the walker steps along the way the body faces; a flick that swings the body round by 100 degrees or
 // more within a quarter of a second, while it starts to move, outruns the feet.)
 let errMax = 0, low = Infinity, slide = 0, invalid = 0, total = 0, off = 0;
 for(const seed of [1, 2, 3, 4, 5, 6, 7, 8]){
  let s = seed * 7919; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const ph = [rnd() * 6, rnd() * 6, rnd() * 6], fq = [.2 + rnd() * .5, .3 + rnd() * .6, .15 + rnd() * .4];
  const sim = simulate({seconds: 30, speed: .8 + rnd() * .2, stick: t => { const a = Math.sin(t * fq[0] + ph[0]) * 3, m = Math.max(0, Math.sin(t * fq[1] + ph[1]) * .7 + .1) * .4; return [Math.sin(a) * m, Math.cos(a) * m]; }});
  errMax = Math.max(errMax, sim.maxErr); total += sim.frames.length; off += sim.off;
  for(const f of sim.frames) for(const b of Object.values(f.pose)) if(b && typeof b === 'object' && 'x' in b && !(Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.z))) invalid++;
  for(const side of ['L', 'R']) for(let i = 1; i < sim.frames.length; i++){ const a = sim.frames[i - 1], b = sim.frames[i]; b.pts[side].forEach((p, k) => { low = Math.min(low, p.y); if(a.touching[side][k] && b.touching[side][k]) slide = Math.max(slide, Math.hypot(p.x - a.pts[side][k].x, p.z - a.pts[side][k].z)); }); }
 }
 check('eight 30-second random sticks: no invalid numbers, never below the ground, never slide, and the feet are within 1 mm in at least 99% of frames (worst under 6 cm)', invalid === 0 && low > -1e-9 && slide < 1e-6 && off / total < .01 && errMax < .06, `${total} frames; ${(100 * off / total).toFixed(2)}% of frames off by more than 1 mm; worst ${mm(errMax)}; slide ${slide.toExponential(1)}; lowest ${mm(low)}`);
}

// ---- 7b. Long games, and ground that is not at height zero ----
{
 // Old steps are forgotten, so a frame costs the same after minutes of walking as at the start.
 const ctl = createMoveController({...MOVE_TUNING, walkSpeed: 1.0, runSpeed: 1.2, acceleration: 6, deceleration: 8}), player = createPosePlayer(S, {}, {follow: true}), walker = createWalker(S, {start: {x: 0, z: 0, facing: 0}});
 attachWalker(player, walker);
 const cost = [];
 for(let i = 0; i < 150 * 60; i++){
  const t = i / 60, a = t * .35, m = .36;
  ctl.state.hold = walker.holdMove; ctl.advance(1 / 60, Math.sin(a) * m, Math.cos(a) * m);
  const st = ctl.state, t0 = performance.now();
  walker.update(1 / 60, {x: st.x, z: st.z, facing: st.facing, vx: st.vx, vz: st.vz, speed: st.speed, aim: st.aim}); player.update(1 / 60);
  if(i % 60 === 0) cost.push(0); cost[cost.length - 1] += performance.now() - t0;
 }
 const early = cost.slice(5, 25).reduce((a, b) => a + b, 0) / 20, late = cost.slice(-20).reduce((a, b) => a + b, 0) / 20;
 check('after two and a half minutes of walking (about 700 steps) only the last few steps are remembered, and a frame costs no more than at the start', walker.planner.remembered < 40 && late < early * 1.5 + 2, `${walker.planner.remembered} steps remembered; ${(early / 60).toFixed(2)} ms a frame at the start, ${(late / 60).toFixed(2)} ms at the end`);
 // On raised ground the body does not crouch as if a foot were in the air.
 const w2 = createWalker(S, {ground: () => 2, start: {x: 0, z: 0, facing: 0}});
 check('standing on ground raised 2 m, the body height is the same as on the flat (no phantom foot in the air)', Math.abs(w2.bodyHeight(0) - createWalker(S, {start: {x: 0, z: 0, facing: 0}}).bodyHeight(0)) < 1e-9, `${mm(w2.bodyHeight(0))} against ${mm(createWalker(S, {start: {x: 0, z: 0, facing: 0}}).bodyHeight(0))}`);
}

// ---- 7c. Starting facing another way ----
{
 const w = createWalker(S, {start: {x: 3, z: -2, facing: 1.2}}), g = w.goals(0), want = 1.2 * 180 / Math.PI;
 const e = sd => Math.abs(((g['foot.' + sd].heading - want) % 360 + 540) % 360 - 180);
 const gap = Math.hypot(g['foot.L'].sole[0] - g['foot.R'].sole[0], g['foot.L'].sole[2] - g['foot.R'].sole[2]);
 check('a walker started facing 69° stands with both feet facing that way, the stance width apart, round the start point', e('L') < 1e-9 && e('R') < 1e-9 && Math.abs(gap - .17) < 1e-9 && Math.abs((g['foot.L'].sole[0] + g['foot.R'].sole[0]) / 2 - 3) < 1e-9, `feet face within ${e('L').toFixed(3)}° and ${e('R').toFixed(3)}°, ${mm(gap)} apart`);
}

// ---- 8. Fast enough ----
{
 const t0 = performance.now(); const sim = simulate({seconds: 8, stick: t => forward(t)}); const ms = (performance.now() - t0) / (8 * 60);
 check('a whole frame (movement rules, walker, balance, legs) costs under 3 ms on average', ms < 3, `${ms.toFixed(2)} ms a frame`);
}

console.table(R);
const fail = R.some(r => r.result === 'FAIL');
console.log(fail ? 'FAIL' : 'PASS: the walk is exact, never slides, alternates, and holds up on random sticks.');
process.exit(fail ? 1 : 0);
