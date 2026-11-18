import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { solveKartContacts, createRailBarriers, trackBarriers, CONTACT, NO_BARRIERS } from './index.ts';
import { sweepCapsules } from './geometry.ts';
import { createKartContactResolver, stepContactKarts } from './karts.ts';
import { createKartController, KART, kartVelocity } from '../kart/index.ts';
import { createTrack, TRACK_IDS } from '../track/index.ts';
import reference from '../track/reference.json' with { type: 'json' };
const rates = [30, 60, 120, 144], checks = [], flat = { heightAt: (x, z, max) => max >= 0 ? 0 : null };
const near = (a, b, tol = 1e-8) => assert(Math.abs(a - b) <= tol, `${a} != ${b}; error ${Math.abs(a - b)}`);
const segment = (id, x1, z1, x2, z2, y = 0, thickness = 0) => ({ id, a: { x: x1, y, z: z1 }, b: { x: x2, y, z: z2 }, height: 1.2, thickness });
const wallSegments = [segment('wall', 0, -100, 0, 100)], wall = createRailBarriers(wallSegments);
const energy = b => (b.vx * b.vx + b.vz * b.vz + (b.angularVelocity ?? 0) ** 2 / CONTACT.inverseInertia) / (b.inverseMass ?? 1);
const asBody = (s, id = 'kart') => { const v = kartVelocity(s); return { id, x: s.x, y: s.y, z: s.z, yaw: s.yaw, vx: v.x, vz: v.z, angularVelocity: s.impactYawRate, cooldown: s.railContactTime, recovery: s.impactRecovery }; };
function run(c, seconds, fps, input = {}, observe = () => { }) { const script = (tick, t, state) => { observe(state, tick); return typeof input === 'function' ? input(tick, t, state) : input; }; for (let frame = 0; frame < Math.ceil(seconds * fps - 1e-10); frame++)
    c.advance(Math.min(1 / fps, seconds - frame / fps), script); observe(c.state, c.clock.ticks); return c.state; }
function controller(initial, barriers = wall, world = flat) { return createKartController({ world, initial, resolveMotion: createKartContactResolver(barriers) }); }
function check(rule, input, expected, measure, verify) { test(rule, () => { let measured; try {
    measured = measure();
    verify(measured);
    checks.push({ rule, input, expected, measured, status: 'PASS' });
}
catch (error) {
    checks.push({ rule, input, expected, measured: measured ?? null, status: 'FAIL', error: error.message });
    throw error;
} }); }
function equalRateStates(rows) { for (const row of rows.slice(1))
    for (const [key, value] of Object.entries(row.state)) {
        if (typeof value === 'number')
            near(value, rows[0].state[key], 1e-9);
        else
            assert.equal(value, rows[0].state[key]);
    } }
// Independent distance oracle: endpoint distances + explicit segment intersection.
function pointDistance(p, a, b) { const dx = b.x - a.x, dz = b.z - a.z, den = dx * dx + dz * dz, t = den ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / den)) : 0; return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t); }
function axis(s) { return [-1, 1].map(sign => ({ x: s.x + Math.sin(s.yaw) * CONTACT.halfLength * sign, z: s.z + Math.cos(s.yaw) * CONTACT.halfLength * sign })); }
function segmentDistance(a, b, c, d) { const ux = b.x - a.x, uz = b.z - a.z, vx = d.x - c.x, vz = d.z - c.z, den = ux * vz - uz * vx; if (Math.abs(den) > 1e-12) {
    const dx = c.x - a.x, dz = c.z - a.z, t = (dx * vz - dz * vx) / den, u = (dx * uz - dz * ux) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1)
        return 0;
} return Math.min(pointDistance(a, c, d), pointDistance(b, c, d), pointDistance(c, a, b), pointDistance(d, a, b)); }
function wallPenetration(s, segments) { let depth = 0; const [a, b] = axis(s); for (const rail of segments) {
    const base = (rail.a.y + rail.b.y) / 2;
    if (s.y >= base + rail.height || s.y + CONTACT.height <= base)
        continue;
    if (s.x + 2 < Math.min(rail.a.x, rail.b.x) || s.x - 2 > Math.max(rail.a.x, rail.b.x) || s.z + 2 < Math.min(rail.a.z, rail.b.z) || s.z - 2 > Math.max(rail.a.z, rail.b.z))
        continue;
    depth = Math.max(depth, CONTACT.radius + (rail.thickness ?? 0) / 2 - segmentDistance(a, b, rail.a, rail.b));
} return Math.max(0, depth); }
check('Head-on normal and boost-speed hits rebound once and settle under Gas', { fps: rates, speeds: [8, 40, KART.boostSpeed], script: 'Start x=-5 facing a long wall; hold Gas for 5 s.' }, 'Never cross/penetrate the wall; first reverse speed is at most 1.5 m/s; one rebound; final speed and unwanted yaw are near zero; results match every FPS.', () => {
    const rows = [];
    for (const speed of [8, 40, KART.boostSpeed]) {
        const byRate = [];
        for (const fps of rates) {
            const c = controller({ x: -5, yaw: Math.PI / 2, speed });
            let first = null, maxPenetration = 0, rebounds = 0, backing = false, maxYawStep = 0, lastYaw = c.state.yaw;
            run(c, 5, fps, { throttle: 1 }, s => { maxPenetration = Math.max(maxPenetration, wallPenetration(s, wallSegments)); maxYawStep = Math.max(maxYawStep, Math.abs(s.yaw - lastYaw)); lastYaw = s.yaw; if (s.contacts && first === null)
                first = s.speed; const now = s.speed < -.05; if (now && !backing)
                rebounds++; backing = now; });
            assert(first !== null);
            byRate.push({ fps, first, rebounds, maxPenetration, maxYawStep, state: c.state });
        }
        equalRateStates(byRate);
        rows.push({ speed, byRate });
    }
    return { rows };
}, m => { for (const r of m.rows)
    for (const x of r.byRate) {
        assert(x.first < 0 && x.first >= -1.5 - 1e-8);
        assert.equal(x.rebounds, 1);
        assert(x.maxPenetration < 1e-6);
        assert(Math.abs(x.state.speed) < 1e-6);
        assert(Math.abs(x.state.yaw - Math.PI / 2) < 1e-6);
    } });
check('Time of impact uses the full swept path, not the end position', { script: 'At x=-2, vx=80 m/s, yaw=pi/2, sweep into x=0 for one 1/120-s tick.' }, 'Collision time is (2-1.18-0.35)/80=0.005875 s; remaining time moves with the rebound velocity; no penetration.', () => {
    const r = solveKartContacts([{ id: 'a', x: -2, y: 0, z: 0, yaw: Math.PI / 2, vx: 80, vz: 0 }], KART.step, wall), b = r.bodies[0];
    return { time: r.events[0].time, x: b.x, vx: b.vx, penetration: wallPenetration(b, wallSegments), iterations: r.iterations };
}, m => { near(m.time, .005875); near(m.vx, -1.5); near(m.x, -1.53 - 1.5 * (KART.step - .005875) - CONTACT.skin); assert(m.penetration < 1e-7); });
check('A 10.75 cm thin barrier catches a boost-speed kart from either side', { fps: rates, script: 'Approach a 0.1075-m-thick test rail at 180 mph from left and right; hold Gas for 1 s.' }, 'No tunnelling, no penetration above 1e-6 m, and identical FPS results. This tests a thin rail adapter, not Claude’s unfinished block engine.', () => {
    const segments = [segment('thin', 0, -100, 0, 100, 0, .1075)], w = createRailBarriers(segments), rows = [];
    for (const side of [-1, 1]) {
        const byRate = [];
        for (const fps of rates) {
            const c = controller({ x: side * 4, yaw: -side * Math.PI / 2, speed: KART.boostSpeed, boostTime: 2 }, w);
            let maximumPenetration = 0, crossed = false;
            run(c, 1, fps, { throttle: 1 }, s => { maximumPenetration = Math.max(maximumPenetration, wallPenetration(s, segments)); crossed ||= s.x * side < 0; });
            byRate.push({ fps, maximumPenetration, crossed, state: c.state });
        }
        equalRateStates(byRate);
        rows.push({ side, byRate });
    }
    return { rows };
}, m => { for (const r of m.rows)
    for (const x of r.byRate) {
        assert(!x.crossed);
        assert(x.maximumPenetration < 1e-6);
    } });
check('Glancing hits retain tangential travel and lose energy without heading snaps', { fps: rates, degrees: [10, 30, 60], script: 'At 40 m/s coast into a straight rail, then continue for 1 s.' }, 'Slides along the rail, never penetrates; coasting kinetic energy does not increase; yaw change per tick stays below 0.01 rad.', () => ({ rows: [10, 30, 60].map(degrees => { const byRate = rates.map(fps => { const c = controller({ x: -3, yaw: degrees * Math.PI / 180, speed: 40 }); let last = energy(asBody(c.state)), largestEnergyIncrease = 0, maximumPenetration = 0, maxYawStep = 0, previousYaw = c.state.yaw, contacts = 0, firstContactZ = null; run(c, 1, fps, {}, s => { const next = energy(asBody(s)); largestEnergyIncrease = Math.max(largestEnergyIncrease, next - last); last = next; maximumPenetration = Math.max(maximumPenetration, wallPenetration(s, wallSegments)); maxYawStep = Math.max(maxYawStep, Math.abs(s.yaw - previousYaw)); previousYaw = s.yaw; contacts += s.contacts; if (s.contacts && firstContactZ === null)
        firstContactZ = s.z; }); return { fps, largestEnergyIncrease, maximumPenetration, maxYawStep, contacts, afterContactTravel: c.state.z - (firstContactZ ?? c.state.z), state: c.state }; }); equalRateStates(byRate); return { degrees, byRate }; }) }), m => { for (const r of m.rows)
    for (const x of r.byRate) {
        assert(x.contacts > 0);
        assert(x.afterContactTravel > 1);
        assert(x.maximumPenetration < 1e-5);
        assert(x.largestEnergyIncrease < 1e-5);
        assert(x.maxYawStep < .01);
    } });
check('Drive pressure at a right-angle corner stays stable', { fps: rates, script: 'Drive diagonally into two perpendicular walls from (-5,-5) at boost speed; hold Gas for 4 s.' }, 'Neither wall is crossed, penetration stays below 1e-5 m, and the kart settles without event-budget failure.', () => {
    const segments = [...wallSegments, segment('z', -100, 0, 100, 0)], barriers = createRailBarriers(segments), byRate = rates.map(fps => { const c = controller({ x: -5, z: -5, yaw: Math.PI / 4, speed: KART.boostSpeed }, barriers); let maximumPenetration = 0; run(c, 4, fps, { throttle: 1 }, s => { maximumPenetration = Math.max(maximumPenetration, wallPenetration(s, segments)); assert(s.x < 0 && s.z < 0); }); return { fps, maximumPenetration, speed: Math.abs(c.state.speed), state: c.state }; });
    equalRateStates(byRate);
    return { byRate };
}, m => { for (const x of m.byRate) {
    assert(x.maximumPenetration < 1e-5);
    assert(x.speed < .01);
} });
check('Steering can pull away from a settled head-on contact', { fps: rates, script: 'Hold Gas against wall for 3 s, then hold Gas + Left/Right for 4 s.' }, 'Either direction leaves the wall: more than 5 m side travel, forward speed above 5 m/s, contact cooldown expires.', () => ({ rows: [-1, 1].map(steer => { const byRate = rates.map(fps => { const c = controller({ x: -5, yaw: Math.PI / 2, speed: 40 }); run(c, 3, fps, { throttle: 1 }); run(c, 4, fps, { throttle: 1, steer }); return { fps, state: c.state }; }); equalRateStates(byRate); return { steer, byRate }; }) }), m => { for (const r of m.rows)
    for (const x of r.byRate) {
        assert(x.state.x < -5);
        assert(Math.abs(x.state.z) > 5);
        assert(x.state.speed > 5);
        assert.equal(x.state.railContactTime, 0);
    } });
for (const id of TRACK_IDS)
    check(id + ': curved rails and joins block boost-speed outward shots', { fps: rates, script: 'At five route stations, shoot toward both road edges at 180 mph; run 80 physics ticks.' }, 'All trajectories stay inside their original rail side, remain supported and have less than 1e-5 m rail penetration; FPS states match.', () => {
        const t = createTrack(id), barriers = trackBarriers(t), segments = t.rails.map(r => ({ ...r, id: String(r.index) })), rows = [];
        for (const ratio of [.1, .25, .5, .7, .9])
            for (const side of [-1, 1]) {
                const p = t.sample(t.length * ratio), byRate = rates.map(fps => { const c = controller({ ...p.point, yaw: Math.atan2(p.normal.x * side, p.normal.z * side), speed: KART.boostSpeed, boostTime: 2 }, barriers, t); let maximumPenetration = 0, maximumOffset = 0, airborne = 0, contacts = 0; run(c, 80 / 120, fps, { throttle: 1 }, s => { maximumPenetration = Math.max(maximumPenetration, wallPenetration(s, segments)); const q = t.project(s); if (q)
                    maximumOffset = Math.max(maximumOffset, q.offset); if (!s.grounded)
                    airborne++; contacts += s.contacts; }); return { fps, maximumPenetration, maximumOffset, airborne, contacts, state: c.state }; });
                equalRateStates(byRate);
                rows.push({ ratio, side, byRate });
            }
        return { rows };
    }, m => { for (const r of m.rows)
        for (const x of r.byRate) {
            assert(x.contacts > 0);
            assert(x.maximumPenetration < 1e-5);
            assert(x.maximumOffset < 14.25);
            assert.equal(x.airborne, 0);
        } });
check('Overpass rail queries never collide across vertically separated decks', { fps: rates, script: 'At all captured overpass crossings, compare barriers on both levels while the kart remains on the other level.' }, 'Rails whose complete height lies below/above the kart produce zero contacts; no lower/upper deck confusion.', () => {
    let probes = 0, falseContacts = 0;
    for (const raw of reference.tracks)
        for (const c of raw.expected.crossings)
            for (const fps of rates) {
                for (const [y, barrierY] of [[c.lowerSupport, c.upperSupport], [c.upperSupport, c.lowerSupport]]) {
                    const w = createRailBarriers([segment('other', c.x, c.z - 10, c.x, c.z + 10, barrierY)]), surface = { heightAt: (x, z, max) => [c.upperSupport, c.lowerSupport].find(h => h <= max) ?? null }, kart = controller({ x: c.x - 2, y, z: c.z, yaw: Math.PI / 2, speed: 80 }, w, surface);
                    run(kart, .25, fps, {}, s => { falseContacts += s.contacts; });
                    assert.equal(kart.state.y, y);
                    probes++;
                }
            }
    return { probes, falseContacts };
}, m => { assert(m.probes > 100); assert.equal(m.falseContacts, 0); });
function joint(initial, seconds, fps, barriers = NO_BARRIERS, inputs = () => ({}), surface = flat) {
    let entries = initial.map(e => ({ id: e.id, state: createKartController({ world: surface, initial: e.initial }).state })), remainder = 0, tick = 0, events = 0, maximumPenetration = 0, largestEnergyIncrease = 0, last = entries.reduce((n, e) => n + energy(asBody(e.state)), 0);
    for (let frame = 0; frame < Math.ceil(seconds * fps - 1e-10); frame++) {
        remainder += Math.min(1 / fps, seconds - frame / fps);
        while (remainder + 1e-12 >= KART.step) {
            const r = stepContactKarts(entries.map(e => ({ ...e, input: inputs(tick, e.id) })), surface, barriers);
            entries = r.states;
            events += r.events.length;
            tick++;
            remainder = Math.max(0, remainder - KART.step);
            for (let i = 0; i < entries.length; i++)
                for (let j = i + 1; j < entries.length; j++) {
                    const a = entries[i].state, b = entries[j].state;
                    if (Math.abs(a.y - b.y) < CONTACT.height) {
                        const aa = axis(a), bb = axis(b);
                        maximumPenetration = Math.max(maximumPenetration, 2 * CONTACT.radius - segmentDistance(aa[0], aa[1], bb[0], bb[1]));
                    }
                }
            const next = entries.reduce((n, e) => n + energy(asBody(e.state)), 0);
            largestEnergyIncrease = Math.max(largestEnergyIncrease, next - last);
            last = next;
        }
    }
    return { states: [...entries].sort((a, b) => a.id.localeCompare(b.id)), events, maximumPenetration, largestEnergyIncrease, ticks: tick };
}
check('Two opposing boost-speed karts cannot pass through each other', { fps: rates, script: 'Two karts start 10 m apart, heading toward one another at 180 mph; coast for 2 s.' }, 'They collide, preserve their original side, separate without overlap >1e-5 m, dissipate kinetic energy and match at every FPS.', () => {
    const initial = [{ id: 'a', initial: { x: -5, yaw: Math.PI / 2, speed: KART.boostSpeed } }, { id: 'b', initial: { x: 5, yaw: -Math.PI / 2, speed: KART.boostSpeed } }], byRate = rates.map(fps => ({ fps, ...joint(initial, 2, fps) }));
    for (const r of byRate.slice(1))
        assert.deepEqual(r.states, byRate[0].states);
    return { byRate };
}, m => { for (const r of m.byRate) {
    assert(r.events > 0);
    assert(r.states[0].state.x < r.states[1].state.x);
    assert(r.maximumPenetration < 1e-5);
    assert(r.largestEnergyIncrease < 1e-5);
} });
check('Moving pair impulses preserve linear momentum while dissipating energy', { script: 'In one tick, collide unequal masses (inverse masses 1 and 0.5), at yaw pi/2 and opposite velocities 50/-20 m/s.' }, 'Total linear momentum changes by less than 1e-8; kinetic energy does not grow; a real contact is recorded.', () => {
    const a = { id: 'a', x: -1.55, y: 0, z: 0, yaw: Math.PI / 2, vx: 50, vz: 0, inverseMass: 1 }, b = { id: 'b', x: 1.55, y: 0, z: 0, yaw: Math.PI / 2, vx: -20, vz: 0, inverseMass: .5 }, before = energy(a) + energy(b), r = solveKartContacts([a, b], KART.step), after = r.bodies.reduce((n, b) => n + energy(b), 0);
    return { momentumError: Math.abs(r.bodies.reduce((n, b) => n + b.vx / b.inverseMass, 0) - (a.vx / a.inverseMass + b.vx / b.inverseMass)), beforeEnergy: before, afterEnergy: after, events: r.events.length };
}, m => { near(m.momentumError, 0); assert(m.afterEnergy <= m.beforeEnergy + 1e-8); assert(m.events > 0); });
check('Karts on different bridge levels do not contact', { fps: rates, script: 'Cross two opposing 180 mph trajectories with a 6 m deck separation.' }, 'Zero kart events while both follow their distinct road heights; positions agree across rates.', () => {
    const initial = [{ id: 'a', initial: { x: -5, y: 0, z: 0, yaw: Math.PI / 2, speed: KART.boostSpeed } }, { id: 'b', initial: { x: 5, y: 6, z: 0, yaw: -Math.PI / 2, speed: KART.boostSpeed } }], surface = { heightAt: (x, z, max) => [6, 0].find(h => h <= max) ?? null }, byRate = rates.map(fps => ({ fps, ...joint(initial, 1, fps, NO_BARRIERS, () => ({}), surface) }));
    for (const r of byRate.slice(1))
        assert.deepEqual(r.states, byRate[0].states);
    return { byRate };
}, m => { for (const r of m.byRate) {
    assert.equal(r.events, 0);
    assert(r.states[0].state.x > r.states[1].state.x);
    assert.equal(r.states[0].state.y, 0);
    assert.equal(r.states[1].state.y, 6);
} });
check('Three-kart pileups remain stable and independent of array order', { fps: rates, script: 'Three touching lanes approach a wall; compare initial kart array with its reversal over 2 s.' }, 'No tunnelling, overlap <=1e-5 m, finite states, and exactly the same states regardless of array order or rendering rate.', () => {
    const initial = [{ id: 'a', initial: { x: -3.1, yaw: Math.PI / 2, speed: 40 } }, { id: 'b', initial: { x: -6.25, yaw: Math.PI / 2, speed: 60 } }, { id: 'c', initial: { x: -9.4, yaw: Math.PI / 2, speed: 80 } }], byRate = [];
    for (const fps of rates) {
        const a = joint(initial, 2, fps, wall), b = joint([...initial].reverse(), 2, fps, wall);
        assert.deepEqual(a.states, b.states);
        for (const e of a.states)
            assert(e.state.x < 0);
        byRate.push({ fps, ...a });
    }
    for (const r of byRate.slice(1))
        assert.deepEqual(r.states, byRate[0].states);
    return { byRate };
}, m => { for (const r of m.byRate) {
    assert(r.events > 0);
    assert(r.maximumPenetration < 1e-5);
    assert(r.largestEnergyIncrease < 1e-5);
} });
check('Crossing and side-by-side karts resolve without overlap', { fps: rates, script: 'Perpendicular crossing at 40 m/s and a side-by-side lateral bump; coast for 1 s.' }, 'Real contacts occur, pair penetration remains below 1e-5 m and coasting energy never grows.', () => {
    const cases = [[{ id: 'a', initial: { x: -4, z: 0, yaw: Math.PI / 2, speed: 40 } }, { id: 'b', initial: { x: 0, z: -4, yaw: 0, speed: 40 } }], [{ id: 'a', initial: { x: -1.4, speed: 20, lateralSpeed: 8 } }, { id: 'b', initial: { x: 1.4, speed: 20, lateralSpeed: -8 } }]];
    return { cases: cases.map(initial => ({ byRate: rates.map(fps => ({ fps, ...joint(initial, 1, fps) })) })) };
}, m => { for (const c of m.cases)
    for (const r of c.byRate) {
        assert(r.events > 0);
        assert(r.maximumPenetration < 1e-5);
        assert(r.largestEnergyIncrease < 1e-5);
    } });
check('Separating and stationary contacts do not receive repeated bounces', { fps: rates, script: 'Place a stationary or already separating kart exactly against a wall; simulate 1 s.' }, 'No unsolicited rebound, no new kinetic energy and no drift for the stationary case.', () => ({ byRate: rates.map(fps => { const still = controller({ x: -1.53, yaw: Math.PI / 2 }), away = controller({ x: -1.53, yaw: -Math.PI / 2, speed: 5 }); run(still, 1, fps, {}); run(away, 1, fps, {}); return { fps, stillX: still.state.x, stillSpeed: still.state.speed, awayX: away.state.x }; }) }), m => { for (const r of m.byRate) {
    near(r.stillX, -1.53);
    near(r.stillSpeed, 0);
    assert(r.awayX < -3);
} });
check('Small initial overlaps are removed without adding velocity', { script: 'Spawn a stopped kart 5 cm inside a wall footprint, and two coincident stopped karts; resolve a fixed tick.' }, 'Geometric overlap is corrected; stopped velocities remain zero; no infinite loop or velocity injection.', () => {
    const a = solveKartContacts([{ id: 'a', x: -1.48, y: 0, z: 0, yaw: Math.PI / 2, vx: 0, vz: 0 }], KART.step, wall), b = solveKartContacts([{ id: 'a', x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0 }, { id: 'b', x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0 }], KART.step);
    return { wallDepth: wallPenetration(a.bodies[0], wallSegments), maximumSpeed: Math.max(...[...a.bodies, ...b.bodies].map(b => Math.hypot(b.vx, b.vz))), pairDistance: Math.hypot(b.bodies[0].x - b.bodies[1].x, b.bodies[0].z - b.bodies[1].z) };
}, m => { assert(m.wallDepth < 1e-7); assert.equal(m.maximumSpeed, 0); assert(m.pairDistance >= 2 * CONTACT.radius); });
check('Input order, barrier order and caller mutation cannot change saved geometry', { script: 'Reverse both rail segment order and direction; mutate caller segment points after constructing the adapter; attempt mutation of solver results.' }, 'Equivalent barriers give equivalent movement; caller data is copied; output snapshots reject mutation.', () => {
    const segs = [...wallSegments, segment('z', -100, 0, 100, 0)], original = structuredClone(segs), a = createRailBarriers(segs), b = createRailBarriers([...segs].reverse().map(s => ({ ...s, a: s.b, b: s.a })));
    segs[0].a.x = 1000;
    const input = [{ id: 'a', x: -1.6, y: 0, z: -1.6, yaw: Math.PI / 4, vx: 40, vz: 40 }], ra = solveKartContacts(input, KART.step, a), rb = solveKartContacts(input, KART.step, b);
    assert.deepEqual(input, [{ id: 'a', x: -1.6, y: 0, z: -1.6, yaw: Math.PI / 4, vx: 40, vz: 40 }]);
    assert.throws(() => { ra.bodies[0].x = 99; });
    assert.throws(() => ra.events.push({}));
    const error = Math.max(...['x', 'z', 'vx', 'vz', 'angularVelocity'].map(k => Math.abs(ra.bodies[0][k] - rb.bodies[0][k])));
    return { error, events: ra.events.length };
}, m => { near(m.error, 0); assert(m.events > 0); });
check('Malformed collision adapters roll back a whole controller frame', { script: 'Return a malformed/nonunit/NaN hit and throw from the adapter on a later tick in a 0.1 s batch.' }, 'Each failure throws and preserves the original kart state and physics clock; no partial frame is committed.', () => {
    let rejected = 0;
    for (const failAt of [1, 4]) {
        let calls = 0;
        const broken = { overlaps: () => [], sweep() { calls++; if (calls === failAt)
                return [{ id: 'bad', fraction: .5, normal: { x: NaN, z: 0 }, point: { x: 0, z: 0 }, depth: 0 }]; return []; } };
        const c = controller({ speed: 20 }, broken), before = JSON.stringify({ s: c.state, c: c.clock });
        assert.throws(() => c.advance(.1, { throttle: 1 }));
        assert.equal(JSON.stringify({ s: c.state, c: c.clock }), before);
        rejected++;
    }
    const body = { id: 'a', x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0 };
    for (const operation of [() => solveKartContacts([body], NaN), () => solveKartContacts([body], .1), () => solveKartContacts([body, { ...body }], KART.step), () => solveKartContacts([{ ...body, vx: Infinity }], KART.step), () => solveKartContacts([{ ...body, vx: 1e9 }], KART.step), () => createRailBarriers([segment('bad', 0, 0, 1, 1, NaN)]), () => createRailBarriers([segment('same', 0, 0, 1, 1), segment('same', 0, 1, 1, 2)])]) {
        assert.throws(operation);
        rejected++;
    }
    return { rejected };
}, m => assert.equal(m.rejected, 9));
check('Analytical sweeps agree with an independent sampled-distance oracle', { script: 'Seed 0x43; 160 moving capsule/segment cases, including endpoint, parallel and point barriers; compare 2000 temporal samples.' }, 'A sampled overlap is never missed; analytical first contact is no later than the first sampled overlap, and differs by at most one sample interval.', () => {
    let seed = 0x43;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    let overlaps = 0, maximumTimeDifference = 0;
    for (let i = 0; i < 160; i++) {
        const a = { x: (rnd() - .5) * 6, z: (rnd() - .5) * 6 }, angle = rnd() * Math.PI * 2, b = { x: a.x + Math.sin(angle) * .7, z: a.z + Math.cos(angle) * .7 }, c = { x: (rnd() - .5) * 4, z: (rnd() - .5) * 4 }, d = i % 5 ? { x: c.x + (rnd() - .5) * 6, z: c.z + (rnd() - .5) * 6 } : c, move = { x: (rnd() - .5) * 5, z: (rnd() - .5) * 5 }, radius = .4;
        let sampled = null;
        for (let j = 0; j <= 2000; j++) {
            const t = j / 2000, aa = { x: a.x + move.x * t, z: a.z + move.z * t }, bb = { x: b.x + move.x * t, z: b.z + move.z * t };
            if (segmentDistance(aa, bb, c, d) <= radius) {
                sampled = t;
                break;
            }
        }
        const hit = sweepCapsules(a, b, move, c, d, radius);
        if (sampled !== null) {
            assert(hit, 'Missed oracle overlap');
            assert(hit.fraction <= sampled + 1e-8);
            maximumTimeDifference = Math.max(maximumTimeDifference, sampled - hit.fraction);
            overlaps++;
        }
        else if (hit)
            assert(hit.fraction >= 0 && hit.fraction <= 1);
    }
    return { cases: 160, overlaps, maximumTimeDifference };
}, m => { assert(m.overlaps > 10); assert(m.maximumTimeDifference <= 1 / 2000 + 1e-7); });
check('Five-kart contact chains remain stable under continued drive pressure', { fps: rates, script: 'Five scripted karts at x=-3.1,-6.25,-9.4,-12.55,-15.7 face the same wall; hold Gas for 6 s.' }, 'All karts remain on the original wall side, pair penetration stays below 1e-5 m, no solver budget is exhausted and states match at all FPS.', () => {
    const initial = Array.from({ length: 5 }, (_, i) => ({ id: 'kart' + i, initial: { x: -3.1 - i * 3.15, yaw: Math.PI / 2, speed: 20 + i * 12 } })), byRate = rates.map(fps => ({ fps, ...joint(initial, 6, fps, wall, () => ({ throttle: 1 })) }));
    for (const row of byRate.slice(1))
        assert.deepEqual(row.states, byRate[0].states);
    return { byRate };
}, m => { for (const row of m.byRate) {
    assert(row.events > 0);
    assert(row.maximumPenetration < 1e-5);
    for (const e of row.states)
        assert(e.state.x < 0);
} });
check('Jittered and catch-up frames preserve the complete contact timeline', { script: '6 s: Gas into wall, steer away after tick 240. Compare 30/60/120/144 FPS, jitter and 250 ms batches.' }, 'All motion and contact state fields agree within 1e-9, with exactly 720 physics ticks and no dropped time.', () => {
    const script = tick => ({ throttle: 1, steer: tick >= 240 ? 1 : 0 }), patterns = [...rates.map(fps => [1 / fps]), [1 / 55, 1 / 144, 1 / 30, 1 / 240], [.25]], states = [];
    for (const times of patterns) {
        const c = controller({ x: -5, yaw: Math.PI / 2, speed: KART.boostSpeed });
        let elapsed = 0, i = 0;
        while (elapsed < 6 - 1e-11) {
            const dt = Math.min(times[i++ % times.length], 6 - elapsed);
            c.advance(dt, script);
            elapsed += dt;
        }
        assert.equal(c.clock.ticks, 720);
        states.push({ state: c.state });
    }
    equalRateStates(states);
    return { patterns: patterns.length, ticks: 720, states };
}, m => assert.equal(m.patterns, 6));
check('Bounded impact rotation cannot turn a touching capsule through a railing', { fps: rates, script: 'Place a stationary capsule beside a wall, with a bounded 0.8 rad/s impact yaw; let it decay over 2 s.' }, 'The rotating footprint remains outside the wall to within 1e-6 m; no linear kinetic energy is introduced.', () => ({ byRate: rates.map(fps => {
        const c = controller({ x: -1.181, yaw: 0, impactYawRate: .8, railContactTime: .3 });
        let penetration = 0, maximumSpeed = 0;
        run(c, 2, fps, {}, s => { penetration = Math.max(penetration, wallPenetration(s, wallSegments)); maximumSpeed = Math.max(maximumSpeed, Math.hypot(s.speed, s.lateralSpeed)); });
        return { fps, penetration, maximumSpeed, state: c.state };
    }) }), m => { equalRateStates(m.byRate); for (const r of m.byRate) {
    assert(r.penetration < 1e-6);
    assert(r.maximumSpeed < 1e-8);
} });
check('Parallel sides, zero-length posts and long-side contacts are swept explicitly', { script: 'Sweep parallel capsule axes toward each other; sweep past a point post; sweep a long capsule side into the end of a short rail.' }, 'Every deliberate contact is found at a valid fraction and independent segment distance equals the chosen contact radius.', () => {
    const cases = [{ a: { x: -2, z: -2 }, b: { x: -2, z: 2 }, c: { x: 0, z: -3 }, d: { x: 0, z: 3 }, move: { x: 3, z: 0 }, radius: .4 }, { a: { x: -2, z: -.35 }, b: { x: -2, z: .35 }, c: { x: 0, z: 0 }, d: { x: 0, z: 0 }, move: { x: 3, z: 0 }, radius: .4 }, { a: { x: -3, z: -2 }, b: { x: -3, z: 2 }, c: { x: 0, z: -.1 }, d: { x: 0, z: .1 }, move: { x: 4, z: 0 }, radius: .4 }];
    let maximumDistanceError = 0;
    for (const c of cases) {
        const hit = sweepCapsules(c.a, c.b, c.move, c.c, c.d, c.radius);
        assert(hit);
        const a = { x: c.a.x + c.move.x * hit.fraction, z: c.a.z + c.move.z * hit.fraction }, b = { x: c.b.x + c.move.x * hit.fraction, z: c.b.z + c.move.z * hit.fraction };
        maximumDistanceError = Math.max(maximumDistanceError, Math.abs(segmentDistance(a, b, c.c, c.d) - c.radius));
    }
    return { cases: cases.length, maximumDistanceError };
}, m => near(m.maximumDistanceError, 0));
check('Contact code is strict ES2022 TypeScript without a browser or block runtime', { script: 'Run contacts/tsconfig.json; inspect all contact runtime imports.' }, 'Strict checking succeeds; no renderer, browser, old vehicle/session or Claude block engine is imported.', () => {
    execFileSync(process.execPath, [fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url)), '-p', fileURLToPath(new URL('./tsconfig.json', import.meta.url))], { stdio: 'pipe' });
    for (const file of ['index.ts', 'geometry.ts', 'rails.ts', 'world.ts', 'karts.ts']) {
        const source = readFileSync(new URL(file, import.meta.url), 'utf8');
        assert(!/from ['"](?:three|.*src\/world|.*vehicle\.js|.*session\.js)/.test(source));
    }
    return { typecheck: 'PASS', blockEngineImported: false };
}, m => assert.equal(m.blockEngineImported, false));
test.after(() => { const result = { section: 3, fps: rates, blockIntegration: 'Deferred: owner and Claude are still building block collisions. No block runtime is imported, modified or claimed complete.', summary: { passed: checks.filter(c => c.status === 'PASS').length, failed: checks.filter(c => c.status === 'FAIL').length }, checks }; writeFileSync(new URL('./CHECK-RESULTS.json', import.meta.url), JSON.stringify(result, null, 2) + '\n'); let md = '# Kart contact layer 3 — measured results\n\nCode-first Node checks. Block-engine integration is pending Claude’s work. Existing track rails and thin test barriers exercise the adapter contract; they are not a replacement block system. No visual page, race rules, avatar or NPC is built.\n\n**' + result.summary.passed + ' PASS, ' + result.summary.failed + ' FAIL.**\n\n'; for (const c of checks)
    md += '## ' + c.rule + '\n\n- Rule: ' + c.expected + '\n- Scripted input: `' + JSON.stringify(c.input) + '`\n- Measured result: `' + JSON.stringify(c.measured) + '`\n- **' + c.status + '**' + (c.error ? ': ' + c.error : '') + '\n\n'; md += 'Owner review is required before the next layer. The final block engine, browser integration and subjective feel remain to be tested separately.\n'; writeFileSync(new URL('./CHECK-RESULTS.md', import.meta.url), md); });
