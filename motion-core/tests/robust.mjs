// Robustness checks: many random but repeatable cases for the legs, the foot planner and balance.
// Usage: node motion-core/tests/robust.mjs
import {createSkeleton} from '../skeleton/skeleton.js';
import {reach} from '../skeleton/reach.js';
import {createFootPlanner} from '../skeleton/footplan.js';
import {createPosePlayer} from '../skeleton/pose.js';
import {balanceShift} from '../skeleton/balance.js';
import {Vector3} from 'three';

const S = createSkeleton();
const R = [], check = (name, ok, detail = '') => R.push({check: name, result: ok ? 'PASS' : 'FAIL', detail});
const mm = v => (v * 1000).toFixed(2) + ' mm';
const makeRand = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// ---- 1. Legs: random smooth foot paths, frame by frame, carrying on from the last frame ----
{
 let frames = 0, invalid = 0, unreachable = 0, edge = 0, snaps = 0, worst = 0, info = '', landed = 0, landedOk = 0;
 for(const seed of [7, 99, 2024]){
  const rnd = makeRand(seed), ru = (a, b) => a + (b - a) * rnd();
  for(let n = 0; n < 40; n++){
   const A = {x: ru(0, .12), y: ru(0, .2), z: ru(0, .25)}, F = {x: ru(.3, 1.2), y: ru(.3, 1.2), z: ru(.3, 1.2)}, P = {x: ru(0, 6), y: ru(0, 6), z: ru(0, 6)};
   const base = [ru(.1, .25), ru(0, .1), ru(-.05, .25)], rootA = [ru(0, .15), ru(0, .03), ru(0, .08)], rootF = [ru(.2, .8), ru(.2, .8), ru(.2, .8)], hd = ru(-20, 20), pitch = ru(-10, 12);
   let prev = null, prevQ = null; const steps = [];
   for(let i = 0; i <= 240; i++){
    const t = i / 60, w = 6.2832;
    const sole = [base[0] + A.x * Math.sin(F.x * t * w + P.x), base[1] + A.y * (.5 + .5 * Math.sin(F.y * t * w + P.y)), base[2] + A.z * Math.sin(F.z * t * w + P.z)];
    const root = {position: [-rootA[0] * Math.sin(rootF[0] * t * w), -rootA[1] * (.5 + .5 * Math.sin(rootF[1] * t * w)), rootA[2] * Math.sin(rootF[2] * t * w)], rotation: {x: 0, y: 0, z: 0}};
    const r = reach(S, {...(prev ?? {}), root}, {'foot.L': {sole, heading: hd, pitch}}, {continuing: true});
    prev = r.pose; frames++;
    const e = r.error['foot.L'];
    if(!Number.isFinite(e) || Object.values(r.pose).some(v => v && typeof v === 'object' && 'x' in v && !(Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)))) invalid++;
    // A fully straight leg (knee at 0) is at the edge of its reach: a target up to 1 mm beyond is the edge, not a miss.
    if(r.pose['shin.L'].x < .5){ if(e > 1e-3) unreachable++; else edge++; }
    else { landed++; if(e < 1e-4) landedOk++; else unreachable++; }
    const q = S.solve({...r.pose, root}).get('thigh.L').rotation.clone();
    steps.push(prevQ && e < 1e-4 ? q.angleTo(prevQ) / Math.PI * 180 : null);
    prevQ = q;
   }
   // A snap is a one-frame turn much bigger than the frames either side of it; at the very edge of the leg's reach
   // (fully straight, a singular pose) one is expected, so frames next to an unreachable one are not counted.
   for(let i = 3; i < steps.length - 3; i++){
    if([i - 3, i - 2, i - 1, i, i + 1, i + 2, i + 3].some(k => steps[k] === null)) continue;
    const nb = Math.max(steps[i - 1], steps[i + 1], .3);
    if(steps[i] > 3 * nb && steps[i] > 2){ snaps++; if(steps[i] > worst){ worst = steps[i]; info = `seed ${seed} path ${n} frame ${i}: ${steps[i].toFixed(2)}° (neighbours ${steps[i - 1].toFixed(2)}, ${steps[i + 1].toFixed(2)})`; } }
   }
  }
 }
 check('legs: no invalid numbers on 28,800 random frames, wherever the foot is asked to go', invalid === 0, `${frames} frames, ${invalid} invalid`);
 check('legs: whenever the leg is bent (target well within reach) the foot lands on its spot within 0.1 mm', landed > 0 && landedOk === landed, `${landedOk} of ${landed} frames within 0.1 mm (${edge} frames at the edge of reach within 1 mm; ${unreachable} out of reach, reported as such)`);
 check('legs: away from the very edge of reach, no random path makes the leg snap (no one-frame turn over 3 times its neighbours)', snaps === 0, snaps ? `${snaps} snaps; worst ${info}` : `none in ${frames} frames`);
}

// ---- 2. Foot planner: random steps, changes of course and ground ----
{
 let steps = 0, finite = true, worstPen = 0, worstJump = 0, worstVelJump = 0, planted = true, landExact = true, info = '';
 for(const seed of [3, 11, 77]){
  const rnd = makeRand(seed), ru = (a, b) => a + (b - a) * rnd();
  for(let n = 0; n < 25; n++){
   // random ground: up to 3 boxes of height 0 to 20 cm
   const boxes = Array.from({length: 1 + Math.floor(rnd() * 3)}, () => ({x0: ru(-.1, .3), x1: ru(.0, .45), z0: ru(.1, .8), z1: ru(.3, 1.1), h: ru(.02, .2)}));
   const ground = (x, z) => boxes.reduce((h, b) => x > b.x0 && x < Math.max(b.x1, b.x0 + .05) && z > b.z0 && z < Math.max(b.z1, b.z0 + .05) ? Math.max(h, b.h) : h, 0);
   const P = createFootPlanner(S, {ground});
   const side = rnd() < .5 ? 'L' : 'R', mirror = side === 'L' ? 1 : -1;
   let t = 0; const events = [];
   for(let k = 0; k < 1 + Math.floor(rnd() * 4); k++){
    const opts = {duration: ru(.5, 1.8), lift: ru(.03, .08), toesDown: ru(0, 8), delay: ru(.05, .25)};
    const target = {sole: [mirror * ru(.08, .3), ru(-.1, 1.0)], heading: ru(-25, 25)};
    P.stepTo(side, t, target, opts); steps++; events.push({t, target, opts});
    t += rnd() < .4 ? ru(.05, .3) : opts.duration + ru(0, .6); // sometimes changed in the air, sometimes after landing
   }
   const end = t + 3, dt = .002;
   let prev = null, prevV = null, restV = null;
   for(let s = 0; s <= end; s += dt){
    const st = P.state(side, s), pts = P.contactPoints(side, s);
    if(![...st.sole, ...st.velocity, st.heading, st.pitch].every(Number.isFinite)) finite = false;
    // Never into the ground (a changed course in the air may dip a few millimetres).
    for(const p of pts) worstPen = Math.max(worstPen, ground(p.x, p.z) - p.y);
    if(prev){ const vmax = Math.hypot(...st.velocity) + Math.hypot(...prevV) + .5; worstJump = Math.max(worstJump, Math.hypot(st.sole[0] - prev[0], st.sole[1] - prev[1], st.sole[2] - prev[2]) / (vmax * dt)); for(let k = 0; k < 3; k++) worstVelJump = Math.max(worstVelJump, Math.abs(st.velocity[k] - prevV[k])); }
    prev = st.sole; prevV = st.velocity;
   }
   // After the last step: planted, exactly on the last spot, at rest, flat.
   const last = P.state(side, end), lt = events.at(-1).target;
   if(!(last.mode === 'planted' && last.sole[0] === lt.sole[0] && last.sole[2] === lt.sole[1] && Math.hypot(...last.velocity) === 0 && last.pitch === 0)) landExact = false;
   const a = P.state(side, end - .5), b = P.state(side, end - .001);
   if(JSON.stringify(a.sole) !== JSON.stringify(b.sole)) planted = false;
  }
 }
 check('planner: every number is finite on 75 random sequences of steps (500 samples a second throughout)', finite, `${steps} steps planned`);
 check('planner: across random ground and random changes of course, no part of the foot goes more than 3 mm into the ground', worstPen < 3e-3, `deepest ${mm(worstPen)}`);
 check('planner: the foot never jumps (distance moved per sample is never more than speed times time, plus a little)', worstJump < 1.5, `largest ratio ${worstJump.toFixed(2)}`);
 check('planner: the speed never jumps (largest change in one 2 ms sample under 0.2 m/s)', worstVelJump < .2, `${worstVelJump.toFixed(3)} m/s`);
 check('planner: after the last step the foot is planted exactly on its spot, flat, at rest, and does not move afterwards', landExact && planted, landExact && planted ? 'exact' : 'a foot ended in the wrong place or kept moving');
}

// ---- 3. Balance: random feet and stances, never invalid, never moves a planted foot ----
{
 let ok = true, planted = 0, n = 0;
 const rnd = makeRand(5), ru = (a, b) => a + (b - a) * rnd();
 for(let i = 0; i < 60; i++){
  const lift = {L: rnd() < .5 ? ru(.05, .18) : 0, R: 0};
  const goals = {'foot.L': {sole: [ru(.1, .22), lift.L, ru(-.05, .1)], heading: ru(-15, 15)}, 'foot.R': {sole: [-ru(.1, .22), 0, ru(-.05, .1)], heading: ru(-15, 15)}};
  const P = createPosePlayer(S, {}, {follow: true});
  P.setGoals('feet', () => goals, {fade: 0});
  P.setBalance({policy: rnd() < .5 ? 'inside' : 'centre', axes: rnd() < .3 ? 'xz' : 'x', stance: ru(0, .02)});
  let pose;
  for(let f = 0; f < 150; f++) pose = P.update(1 / 60);
  const q = S.solve(pose);
  if(!Object.values(pose).every(v => !v || typeof v !== 'object' || !('x' in v) || (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)))) ok = false;
  if(!pose.root.position.every(Number.isFinite)) ok = false;
  const bs = balanceShift(S, q);
  if(bs && !Number.isFinite(bs.shift[0])) ok = false;
  const r = q.get('foot.R').head, g = goals['foot.R'].sole, a0 = S.bones[S.index.get('foot.R')].head[1];
  planted = Math.max(planted, Math.hypot(r.x - g[0], r.y - (g[1] + a0), r.z - g[2])); n++;
 }
 check('balance: 60 random stances (either foot lifted, any policy, any stance) all finite and settled', ok, `${n} stances`);
 check('balance: the planted foot ends exactly on its spot in every one of them (within 0.5 mm)', planted < 5e-4, `worst ${mm(planted)}`);
}

// ---- 4. Arms: palm goals made from real arm poses (so every goal can be reached), followed frame by frame ----
{
 const B = n => S.bones[S.index.get(n)];
 const joints = [['upperArm.L', 'x'], ['upperArm.L', 'y'], ['upperArm.L', 'z'], ['lowerArm.L', 'x'], ['lowerArm.L', 'y'], ['hand.L', 'x'], ['hand.L', 'z']];
 let frames = 0, exact = 0, faceOk = 0, snaps = 0, worstSnap = 0, worstErr = 0, info = '';
 for(const seed of [7, 31, 4242]){
  const rnd = makeRand(seed), ru = (a, b) => a + (b - a) * rnd();
  for(let n = 0; n < 20; n++){
   // each joint wanders smoothly inside the middle 40% of its range (the extremes are a known limit, see the notes)
   const P = joints.map(([b, k]) => { const L = B(b).limits[k], half = (L[1] - L[0]) / 2 * .4; return {mid: (L[0] + L[1]) / 2, amp: ru(0, half), f: ru(.2, .9), ph: ru(0, 6.28)}; });
   let prev = null, prevQ = null; const steps = [];
   for(let i = 0; i <= 240; i++){
    const t = i / 60, pose = {};
    joints.forEach(([b, k], j) => { pose[b] ??= {x: B(b).rest.x, y: B(b).rest.y, z: B(b).rest.z}; pose[b][k] = P[j].mid + P[j].amp * Math.sin(P[j].f * t * 6.2832 + P[j].ph); });
    const h = S.solve(pose).get('hand.L'), H0 = new Vector3(...B('hand.L').head), n0 = new Vector3(...S.palms.L.normal);
    const palm = new Vector3(...S.palms.L.point).sub(H0).applyQuaternion(h.rotation).add(h.head), face = n0.clone().applyQuaternion(h.rotation);
    const f0 = new Vector3(...B('hand.L').tail).sub(H0); f0.sub(n0.clone().multiplyScalar(f0.dot(n0))).normalize();
    const r = reach(S, {...(prev ?? {})}, {'hand.L': {palm: palm.toArray(), face: face.toArray(), fingers: f0.applyQuaternion(h.rotation).toArray()}}, {continuing: true});
    prev = r.pose; frames++;
    const e = r.error['hand.L']; worstErr = Math.max(worstErr, e);
    if(e < 5e-4) exact++;
    if(r.facing['hand.L'] < 1) faceOk++;
    const q = S.solve(r.pose).get('upperArm.L').rotation.clone();
    steps.push(prevQ && i >= 14 ? q.angleTo(prevQ) / Math.PI * 180 : null); prevQ = q;
   }
   for(let i = 17; i < steps.length - 3; i++){
    if([i - 3, i - 2, i - 1, i, i + 1, i + 2, i + 3].some(k => steps[k] === null)) continue;
    const nb = Math.max(steps[i - 1], steps[i + 1], .3);
    if(steps[i] > 3 * nb && steps[i] > 2){ snaps++; if(steps[i] > worstSnap){ worstSnap = steps[i]; info = `seed ${seed} path ${n} frame ${i}: ${steps[i].toFixed(2)}°`; } }
   }
  }
 }
 check('arms: palm goals made from real arm poses are landed within 0.5 mm in every frame (arm poses in the middle 40% of each joint range)', exact === frames, `${exact} of ${frames} frames; worst ${mm(worstErr)}`);
 check('arms: ...with the palm facing the right way within 1° in at least 99% of frames', faceOk / frames >= .99, `${faceOk} of ${frames} frames (${(100 * faceOk / frames).toFixed(2)}%)`);
 check('arms: ...and the arm never snaps (no one-frame turn over 3 times its neighbours)', snaps === 0, snaps ? `${snaps} snaps; worst ${info}` : `none in ${frames} frames`);
}

console.table(R);
const fail = R.some(r => r.result === 'FAIL');
console.log(fail ? 'FAIL' : 'PASS: the legs, the planner and balance hold up on random cases.');
process.exit(fail ? 1 : 0);
