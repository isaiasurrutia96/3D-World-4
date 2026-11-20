// Looking and aiming checks. Usage: node motion-core/tests/look.mjs
import {createSkeleton} from '../skeleton/skeleton.js';
import {lookAt, createLook, distribute, LOOK_WEIGHTS} from '../skeleton/look.js';
import {createPosePlayer} from '../skeleton/pose.js';
import {Vector3} from 'three';

const S = createSkeleton();
const R = [], check = (name, ok, detail = '') => R.push({check: name, result: ok ? 'PASS' : 'FAIL', detail});
const AX = ['x', 'y', 'z'];
const makeRand = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const headFront = (pose, angles) => { const q = S.solve({...pose, ...angles}).get('head'); return {q, f: new Vector3(0, 0, 1).applyQuaternion(q.rotation)}; };
const inLimits = (angles, eps = 1e-9) => Object.entries(angles).every(([b, a]) => { const L = S.bones[S.index.get(b)].limits; return AX.every(k => a[k] >= L[k][0] - eps && a[k] <= L[k][1] + eps); });
const world = (yawDeg, upDeg, dist = 3, from = new Vector3(0, 1.78, 0)) => { const y = yawDeg * Math.PI / 180, u = upDeg * Math.PI / 180; return from.clone().add(new Vector3(Math.sin(y) * Math.cos(u), Math.sin(u), Math.cos(y) * Math.cos(u)).multiplyScalar(dist)); };

// ---- 1. Sharing a turn between joints ----
{
 const parts = [{w: .12, lo: -35, hi: 35}, {w: .08, lo: -15, hi: 15}, {w: .30, lo: -40, hi: 40}, {w: .50, lo: -40, hi: 40}];
 const a = distribute(60, parts), b = distribute(-60, parts), c = distribute(130, parts), d = distribute(200, parts), e = distribute(0, parts);
 const sum = x => x.amounts.reduce((s, v) => s + v, 0);
 check('a turn is shared in proportion to the weights (head most, then neck, waist, chest) and adds up exactly', Math.abs(sum(a) - 60) < 1e-9 && a.amounts[3] > a.amounts[2] && a.amounts[2] > a.amounts[0] && a.amounts[0] > a.amounts[1] && Math.abs(a.amounts[3] / a.amounts[2] - .5 / .3) < 1e-9, `${a.amounts.map(v => v.toFixed(1)).join(' / ')} (waist/chest/neck/head)`);
 check('a joint that is full takes only what it can and the others take the rest; both directions match; nothing is placed past the limits', Math.abs(sum(c) - 130) < 1e-9 && c.amounts.every((v, i) => v <= parts[i].hi + 1e-9) && Math.abs(sum(d) - 130) < 1e-9 && Math.abs(d.left - 70) < 1e-9 && b.amounts.every((v, i) => Math.abs(v + a.amounts[i]) < 1e-9) && sum(e) === 0, `130: ${c.amounts.map(v => v.toFixed(1)).join(' / ')}; 200 leaves ${d.left.toFixed(1)} unplaced`);
}

// ---- 2. Pointing the face exactly (targets in range, body facing any way) ----
{
 const rnd = makeRand(8), ru = (a, b) => a + (b - a) * rnd();
 let worst = 0, limitsOk = true, n = 0;
 for(let i = 0; i < 300; i++){
  const rootYaw = ru(-180, 180), pose = {root: {position: [ru(-1, 1), 0, ru(-1, 1)], rotation: {x: 0, y: rootYaw, z: 0}}};
  const head = S.solve({...pose}).get('head').head;
  const t = world(rootYaw + ru(-70, 70), ru(-30, 20), ru(1, 8), head);
  const r = lookAt(S, pose, t);
  const q = S.solve({...pose, ...r.pose}).get('head'), f = new Vector3(0, 0, 1).applyQuaternion(q.rotation), want = t.clone().sub(q.head);
  worst = Math.max(worst, f.angleTo(want) * 180 / Math.PI); n++;
  if(!inLimits(r.pose)) limitsOk = false;
 }
 check('the face points exactly at targets within reach of the joints, whichever way the body faces (within 0.05°)', worst < .05, `${n} random targets (up to 70° to either side, 30° down to 20° up); worst ${worst.toFixed(4)}°`);
 check('every joint stays inside its limits', limitsOk, 'all within limits');
}

// ---- 3. Mirror, and behind ----
{
 const a = lookAt(S, {}, world(50, 10)), b = lookAt(S, {}, world(-50, 10));
 let diff = 0;
 for(const bone of ['spine', 'chest', 'neck', 'head']){ diff = Math.max(diff, Math.abs(a.pose[bone].y + b.pose[bone].y), Math.abs(a.pose[bone].x - b.pose[bone].x), Math.abs(a.pose[bone].z - b.pose[bone].z)); }
 check('looking to the right is the exact mirror of looking to the left', diff < 1e-9, `largest difference ${diff.toExponential(1)}°`);
 const back = lookAt(S, {}, world(180, 0)), total = ['spine', 'chest', 'neck', 'head'].reduce((s, b) => s + back.pose[b].y, 0);
 check('a target directly behind turns as far as the joints allow (130° in all) and says so; no number is invalid', Math.abs(Math.abs(total) - 130) < 1e-6 && back.saturated && AX.every(k => Object.values(back.pose).every(a => Number.isFinite(a[k]))), `turned ${total.toFixed(1)}°, ${back.error.toFixed(1)}° short`);
 const keep = lookAt(S, {}, world(-175, 0), {side: 1}), sum = ['spine', 'chest', 'neck', 'head'].reduce((s, b) => s + keep.pose[b].y, 0);
 check('nearly behind, it stays on the side it was on instead of snapping to the other', sum > 100, `kept ${sum.toFixed(0)}° on the right side for a target at -175°`);
 const straightUp = lookAt(S, {}, new Vector3(0, 6, 0));
 check('a target straight above asks for no sideways turn (and no invalid numbers)', ['spine', 'chest', 'neck', 'head'].every(b => Math.abs(straightUp.pose[b].y) < 1e-6) && Object.values(straightUp.pose).every(a => AX.every(k => Number.isFinite(a[k]))), 'no turn');
}

// ---- 4. Up and down: the chest bends only forward, so looking up is the neck and head ----
{
 const up = lookAt(S, {}, world(0, 35, 3)), down = lookAt(S, {}, world(0, -35, 3));
 check('looking up uses the neck and head only; looking down also bends the chest forward a little (it cannot bend back)', up.pose.chest.x === 0 && up.pose.neck.x < 0 && up.pose.head.x < 0 && down.pose.chest.x > 0 && down.pose.neck.x > 0 && down.pose.head.x > 0, `up: chest ${up.pose.chest.x.toFixed(1)}, neck ${up.pose.neck.x.toFixed(1)}, head ${up.pose.head.x.toFixed(1)}; down: ${down.pose.chest.x.toFixed(1)}, ${down.pose.neck.x.toFixed(1)}, ${down.pose.head.x.toFixed(1)}`);
}

// ---- 5. The smooth follower: head first, body after, arriving exactly ----
{
 const L = createLook(S), target = world(70, 0), rows = [];
 L.sample(0, world(0, 0));
 for(let i = 1; i <= 90; i++){ const r = L.sample(i / 60, target); rows.push({t: i / 60, p: r.pose}); }
 const share = (row, b) => row.p[b].y / L.goal[b].y;
 const early = rows[9]; // 0.15 s in
 check('the head turns first and the waist last (at 0.15 s the head has done more of its turn than the neck, the neck more than the chest, the chest more than the waist)',
  share(early, 'head') > share(early, 'neck') && share(early, 'neck') > share(early, 'chest') && share(early, 'chest') > share(early, 'spine'), ['head', 'neck', 'chest', 'spine'].map(b => `${b} ${(100 * share(early, b)).toFixed(0)}%`).join(', '));
 const end = rows.at(-1);
 check('every joint arrives exactly at its answer and stays (the head leads, going past its share at first, then settles back as the body catches up)', ['spine', 'chest', 'neck', 'head'].every(b => Math.abs(end.p[b].y - L.goal[b].y) < 1e-9) && Math.max(...rows.map(r => r.p.head.y)) > L.goal.head.y + 1, `head peaked at ${Math.max(...rows.map(r => r.p.head.y)).toFixed(1)}° and settled at ${end.p.head.y.toFixed(1)}°`);
 const q = headFront({}, end.p).f, want = target.clone().sub(headFront({}, end.p).q.head);
 check('so the face ends up pointing at the target', q.angleTo(want) * 180 / Math.PI < .05, `${(q.angleTo(want) * 180 / Math.PI).toFixed(4)}° off`);
 // The face closes in on the target (70° to one side) and may pass it by a little as the head leads (under 4% of the turn), then settles on it.
 let pastBy = -Infinity;
 for(const r of rows){ const f = headFront({}, r.p), yawFace = Math.atan2(f.f.x, f.f.z) * 180 / Math.PI; pastBy = Math.max(pastBy, yawFace - 70.0); }
 const settledErr = (() => { const f = headFront({}, rows.at(-1).p); return f.f.angleTo(target.clone().sub(f.q.head)) * 180 / Math.PI; })();
 check('the face closes in on the target and passes it by less than 4% of the turn (as a head leading its body does), then settles exactly on it', pastBy < 2.8 && settledErr < .05, `passes it by at most ${pastBy.toFixed(2)}° of 70°; settles ${settledErr.toFixed(4)}° off`);
 // Smooth: no joint speeds up faster than a smooth turn of its own largest size and time can.
 const T = {head: .18, neck: .28, chest: .4, spine: .55}; let ratio = 0;
 for(const b of ['head', 'neck', 'chest', 'spine']){ const D = Math.max(...rows.map(r => Math.abs(r.p[b].y))); for(let i = 2; i < rows.length; i++){ const acc = Math.abs(rows[i].p[b].y - 2 * rows[i - 1].p[b].y + rows[i - 2].p[b].y) * 3600; ratio = Math.max(ratio, acc / (5.7735 * D / (T[b] * T[b]))); } }
 check('the turn is as smooth as a quintic of the same size allows (no joint ever speeds up faster than that, so nothing adds a kick)', ratio < 1.1, `largest ${(100 * ratio).toFixed(1)}% of the bound`);
 const a1 = L.sample(2, target), a2 = L.sample(2, target);
 check('asking for the same moment twice gives the same answer (safe for the player to look twice)', JSON.stringify(a1.pose) === JSON.stringify(a2.pose), 'identical');
 let threw = false; try { L.sample(1, target); } catch { threw = true; }
 check('time must not go backwards (it says so instead of guessing)', threw, 'raises an error');
}

// ---- 6. A target sweeping round the back: no snap in any frame ----
{
 const L = createLook(S); let prev = null, worst = 0, flips = 0;
 L.sample(0, world(0, 0));
 for(let i = 1; i <= 600; i++){
  const yaw = 270 - i * 0.9 + 0, target = world(yaw, 0);   // from the right-hand side, round the back, to the left
  const r = L.sample(i / 60, target), total = ['spine', 'chest', 'neck', 'head'].reduce((s, b) => s + r.pose[b].y, 0);
  if(prev !== null){ worst = Math.max(worst, Math.abs(total - prev)); if(Math.abs(total - prev) > (600 + 400 + 220 + 160) / 60 * 1.05) flips++; }
  prev = total;
 }
 check('a target going right round the back never makes the head snap: when it comes round the other side the head unwinds, but never faster than the joints can turn (23° a frame in all)', flips === 0, `largest one-frame change in total turn ${worst.toFixed(2)}° (limit ${((600 + 400 + 220 + 160) / 60).toFixed(1)}°)`);
}

// ---- 7. In the pose player (a looking layer with the feet planted) ----
{
 const L = createLook(S), P = createPosePlayer(S, {}, {follow: true}), target = world(40, 8);
 P.setGoals('feet', () => ({'foot.L': {sole: [.15, 0, .025], heading: 0}, 'foot.R': {sole: [-.15, 0, .025], heading: 0}}), {fade: 0});
 P.setLayer('look', {fn: t => L.sample(t, target).pose, fade: 0});
 let pose; for(let i = 0; i < 120; i++) pose = P.update(1 / 60);
 const {q, f} = headFront(pose, {}), want = target.clone().sub(q.head);
 check('as a layer of the pose player, with both feet planted, the face ends up on the target', f.angleTo(want) * 180 / Math.PI < .05, `${(f.angleTo(want) * 180 / Math.PI).toFixed(4)}° off`);
}

// ---- 8. Fast ----
{
 const t0 = performance.now(); for(let i = 0; i < 500; i++) lookAt(S, {}, world(i % 120 - 60, i % 40 - 20));
 const ms = (performance.now() - t0) / 500;
 check('fast enough for every frame (under 0.3 ms to work out where all the joints go)', ms < .3, `${(ms * 1000).toFixed(0)} µs`);
}

console.table(R);
const fail = R.some(r => r.result === 'FAIL');
console.log(fail ? 'FAIL' : 'PASS: the head, neck, chest and waist aim exactly, lead and follow, and respect their limits.');
process.exit(fail ? 1 : 0);
