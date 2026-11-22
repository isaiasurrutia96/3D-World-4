import { ends, sweepCapsules, plus, sub, dot } from './geometry.ts';
import type { Capsule, V2 } from './geometry.ts';
import { NO_BARRIERS } from './world.ts';
import type { BarrierWorld, BarrierHit } from './world.ts';
export { createRailBarriers, trackBarriers } from './rails.ts';
export { NO_BARRIERS } from './world.ts';
export type { BarrierWorld, BarrierHit, Capsule, V2 };
/** Original LetsGo footprint and bounded, dissipative contact tuning. */
export const CONTACT = Object.freeze({ radius: 1.18, halfLength: .35, height: 1.8, inverseInertia: .65, restitution: .075, maxRebound: 1.5, friction: .10, cooldown: .3, recovery: .12, maxYawRate: .8, skin: 1e-7, iterations: 20, maxEvents: 64, maxTravel: 4 });
export type ContactFootprint = Readonly<{ radius: number; halfLength: number; height: number; offsetZ: number }>;
export type ContactBody = Readonly<{
    id: string;
    x: number;
    y: number;
    z: number;
    yaw: number;
    vx: number;
    vz: number;
    angularVelocity?: number;
    cooldown?: number;
    recovery?: number;
    inverseMass?: number;
    footprint?: ContactFootprint;
}>;
type Body = {
    -readonly [P in keyof Required<Omit<ContactBody, 'footprint'>>]: Required<ContactBody>[P];
} & { footprint?: ContactFootprint };
export type ContactEvent = Readonly<{
    kind: 'barrier' | 'kart';
    a: string;
    b: string;
    time: number;
    normal: V2;
    rebound: number;
}>;
type Constraint = {
    a: Body;
    b: Body | null;
    id: string;
    normal: V2;
    point: V2;
    depth: number;
    fraction: number;
    target: number;
    ia: number;
    ib: number;
    ra: V2;
    rb: V2;
};
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const originalFootprint: ContactFootprint = Object.freeze({
    radius: CONTACT.radius, halfLength: CONTACT.halfLength, height: CONTACT.height, offsetZ: 0,
});
function pose(b: Body): Capsule {
    const { radius, halfLength, height, offsetZ } = b.footprint ?? originalFootprint;
    return { x: b.x + Math.sin(b.yaw) * offsetZ, y: b.y, z: b.z + Math.cos(b.yaw) * offsetZ, yaw: b.yaw, radius, halfLength, height };
}
const overlapY = (a: Capsule, b: Capsule) => a.y + a.height > b.y + 1e-9 && b.y + b.height > a.y + 1e-9;
const velocity = (b: Body): V2 => ({ x: b.vx, z: b.vz });
const lever = (r: V2, n: V2) => r.z * n.x - r.x * n.z;
function validateHit(hit: BarrierHit): void {
    if (typeof hit.id !== 'string' || !hit.id || ![hit.fraction, hit.normal.x, hit.normal.z, hit.point.x, hit.point.z, hit.depth].every(Number.isFinite) || hit.fraction < 0 || hit.fraction > 1 || hit.depth < 0 || Math.abs(Math.hypot(hit.normal.x, hit.normal.z) - 1) > 1e-6)
        throw new TypeError('Invalid barrier hit');
}
function barrierConstraint(a: Body, hit: BarrierHit): Constraint {
    validateHit(hit);
    return { a, b: null, id: hit.id, normal: hit.normal, point: hit.point, depth: hit.depth, fraction: hit.fraction, target: 0, ia: 0, ib: 0, ra: { x: 0, z: 0 }, rb: { x: 0, z: 0 } };
}
function pairConstraint(a: Body, b: Body, seconds: number, nearContacts = false): Constraint | null {
    const ap = pose(a), bp = pose(b);
    if (!overlapY(ap, bp))
        return null;
    const [a0, a1] = ends(ap), [b0, b1] = ends(bp), relative = { x: (a.vx - b.vx) * seconds, z: (a.vz - b.vz) * seconds };
    const margin = nearContacts ? 1e-6 : 0;
    const hit = sweepCapsules(a0, a1, relative, b0, b1, ap.radius + bp.radius + margin, nearContacts);
    if (!hit)
        return null;
    const worldPoint = plus(hit.a, { x: b.vx * seconds, z: b.vz * seconds }, hit.fraction);
    return { a, b, id: b.id, normal: hit.normal, point: { x: worldPoint.x - hit.normal.x * ap.radius, z: worldPoint.z - hit.normal.z * ap.radius }, depth: Math.max(0, hit.depth - margin), fraction: hit.fraction, target: 0, ia: 0, ib: 0, ra: { x: 0, z: 0 }, rb: { x: 0, z: 0 } };
}
function shift(c: Constraint, depth: number): void {
    const total = c.a.inverseMass + (c.b?.inverseMass ?? 0), a = depth * c.a.inverseMass / total, b = depth * (c.b?.inverseMass ?? 0) / total;
    c.a.x += c.normal.x * a;
    c.a.z += c.normal.z * a;
    if (c.b) {
        c.b.x -= c.normal.x * b;
        c.b.z -= c.normal.z * b;
    }
}
function impulse(c: Constraint, n: V2, value: number, angular = true): void {
    c.a.vx += n.x * value * c.a.inverseMass;
    c.a.vz += n.z * value * c.a.inverseMass;
    if (angular)
        c.a.angularVelocity = clamp(c.a.angularVelocity + lever(c.ra, n) * value * c.ia, -CONTACT.maxYawRate, CONTACT.maxYawRate);
    if (c.b) {
        c.b.vx -= n.x * value * c.b.inverseMass;
        c.b.vz -= n.z * value * c.b.inverseMass;
        if (angular)
            c.b.angularVelocity = clamp(c.b.angularVelocity - lever(c.rb, n) * value * c.ib, -CONTACT.maxYawRate, CONTACT.maxYawRate);
    }
}
function relativeSpeed(c: Constraint, n: V2): number {
    return (c.a.vx - (c.b?.vx ?? 0)) * n.x + (c.a.vz - (c.b?.vz ?? 0)) * n.z + c.a.angularVelocity * lever(c.ra, n) - (c.b?.angularVelocity ?? 0) * lever(c.rb, n);
}
function solveManifold(constraints: Constraint[]): void {
    for (const c of constraints) {
        c.ra = sub(c.point, c.a);
        c.rb = c.b ? sub(c.point, c.b) : { x: 0, z: 0 };
        const closing = -relativeSpeed(c, c.normal), fresh = c.a.cooldown <= 0 && (!c.b || c.b.cooldown <= 0);
        c.target = fresh && closing > 1.5 ? Math.min(CONTACT.maxRebound, closing * CONTACT.restitution) : 0;
        // Tiny repeated drive loads must not spin a resting chassis.
        c.ia = closing > 2 ? CONTACT.inverseInertia * c.a.inverseMass : 0;
        c.ib = closing > 2 && c.b ? CONTACT.inverseInertia * c.b.inverseMass : 0;
    }
    for (let iteration = 0; iteration < CONTACT.iterations; iteration++)
        for (const c of constraints) {
            const ra = lever(c.ra, c.normal), rb = lever(c.rb, c.normal), den = c.a.inverseMass + (c.b?.inverseMass ?? 0) + ra * ra * c.ia + rb * rb * c.ib;
            const change = c.target - relativeSpeed(c, c.normal);
            if (change <= 1e-9)
                continue;
            const normalImpulse = change / den;
            impulse(c, c.normal, normalImpulse);
            const tangent = { x: -c.normal.z, z: c.normal.x }, ta = lever(c.ra, tangent), tb = lever(c.rb, tangent), tden = c.a.inverseMass + (c.b?.inverseMass ?? 0) + ta * ta * c.ia + tb * tb * c.ib;
            impulse(c, tangent, clamp(-relativeSpeed(c, tangent) / tden, -CONTACT.friction * normalImpulse, CONTACT.friction * normalImpulse));
        }
    // Translation CCD holds yaw fixed within this tick. Prevent center velocities from
    // entering a barrier/pair while a bounded angular impulse is applied next tick.
    // This projection only removes normal translation energy.
    for (let iteration = 0; iteration < CONTACT.iterations; iteration++)
        for (const c of constraints) {
            const normal = (c.a.vx - (c.b?.vx ?? 0)) * c.normal.x + (c.a.vz - (c.b?.vz ?? 0)) * c.normal.z;
            if (normal < 0)
                impulse(c, c.normal, -normal / (c.a.inverseMass + (c.b?.inverseMass ?? 0)), false);
        }
    for (const c of constraints) {
        c.a.cooldown = CONTACT.cooldown;
        if (c.b)
            c.b.cooldown = CONTACT.cooldown;
        if (c.target > 0) {
            c.a.recovery = CONTACT.recovery;
            if (c.b)
                c.b.recovery = CONTACT.recovery;
        }
    }
}
/** Continuous X/Z contact step. All karts share one timeline; array order is irrelevant. */
export function solveKartContacts(input: readonly ContactBody[], seconds: number, world: BarrierWorld = NO_BARRIERS) {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 1 / 120 + 1e-12)
        throw new RangeError('Contacts require a fixed step of at most 1/120 second');
    if (!Array.isArray(input) || input.length > 32)
        throw new RangeError('Expected at most 32 contact bodies');
    if (typeof world.sweep !== 'function' || typeof world.overlaps !== 'function')
        throw new TypeError('A barrier sweep/overlap adapter is required');
    const bodies: Body[] = input.map(b => {
        const copy = { ...b, angularVelocity: b.angularVelocity ?? 0, cooldown: b.cooldown ?? 0, recovery: b.recovery ?? 0, inverseMass: b.inverseMass ?? 1 };
        if (typeof copy.id !== 'string' || !copy.id || ![copy.x, copy.y, copy.z, copy.yaw, copy.vx, copy.vz, copy.angularVelocity, copy.cooldown, copy.recovery, copy.inverseMass].every(Number.isFinite) || copy.inverseMass <= 0 || copy.cooldown < 0 || copy.recovery < 0 || Math.abs(copy.angularVelocity) > CONTACT.maxYawRate + 1e-9)
            throw new TypeError('Invalid contact body');
        if (copy.footprint) {
            const { radius, halfLength, height, offsetZ } = copy.footprint;
            if (![radius, halfLength, height, offsetZ].every(Number.isFinite) || radius <= 0 || halfLength < 0 || height <= 0)
                throw new RangeError('Invalid kart contact footprint');
        }
        if (Math.hypot(copy.vx, copy.vz) * seconds > CONTACT.maxTravel)
            throw new RangeError('Contact movement exceeds the 4 m fixed-step budget');
        return copy;
    }).sort((a, b) => a.id.localeCompare(b.id));
    if (new Set(bodies.map(b => b.id)).size !== bodies.length)
        throw new TypeError('Kart ids must be unique');
    const events: ContactEvent[] = [];
    let largestCorrection = 0;
    // Recover small spawn/rotation overlaps with position correction, never velocity injection.
    for (let pass = 0; pass < 32; pass++) {
        let maximum = 0;
        for (const a of bodies)
            for (const hit of world.overlaps(pose(a))) {
                const c = barrierConstraint(a, hit);
                if (c.depth > 1e-7) {
                    shift(c, c.depth + CONTACT.skin);
                    maximum = Math.max(maximum, c.depth);
                }
            }
        for (let i = 0; i < bodies.length; i++)
            for (let j = i + 1; j < bodies.length; j++) {
                const c = pairConstraint(bodies[i], bodies[j], 0);
                if (c && c.depth > 1e-7) {
                    shift(c, c.depth + CONTACT.skin);
                    maximum = Math.max(maximum, c.depth);
                }
            }
        largestCorrection = Math.max(largestCorrection, maximum);
        if (maximum <= 1e-7)
            break;
        if (pass === 31)
            throw new Error('Contact configuration cannot be separated');
    }
    let remaining = seconds, elapsed = 0, iterations = 0;
    while (remaining > 1e-12) {
        const candidates: Constraint[] = [];
        for (const a of bodies)
            for (const hit of world.sweep(pose(a), { x: a.vx * remaining, z: a.vz * remaining })) {
                const c = barrierConstraint(a, hit);
                if (c.depth > 1e-6)
                    throw new Error('Barrier adapter returned unresolved penetration');
                if (a.vx * c.normal.x + a.vz * c.normal.z < -1e-9)
                    candidates.push(c);
            }
        for (let i = 0; i < bodies.length; i++)
            for (let j = i + 1; j < bodies.length; j++) {
                const c = pairConstraint(bodies[i], bodies[j], remaining);
                if (c && dot(sub(velocity(c.a), velocity(c.b!)), c.normal) < -1e-9)
                    candidates.push(c);
            }
        const first = candidates.length ? Math.min(...candidates.map(c => c.fraction)) : 1;
        for (const b of bodies) {
            b.x += b.vx * remaining * first;
            b.z += b.vz * remaining * first;
        }
        const moved = remaining * first;
        elapsed += moved;
        remaining -= moved;
        if (!candidates.length)
            break;
        const constraints = candidates.filter(c => Math.abs(c.fraction - first) < 1e-7);
        // Include already touching neighbors: an impact can transmit load into a
        // resting wall or the next kart, even when that neighbor was not moving.
        for (const a of bodies)
            for (const hit of world.overlaps(pose(a)))
                if (!constraints.some(c => c.a === a && !c.b && c.id === hit.id))
                    constraints.push(barrierConstraint(a, hit));
        for (let i = 0; i < bodies.length; i++)
            for (let j = i + 1; j < bodies.length; j++) {
                const c = pairConstraint(bodies[i], bodies[j], 0, true);
                if (c && !constraints.some(old => old.a === c.a && old.b === c.b))
                    constraints.push(c);
            }
        constraints.sort((a, b) => a.a.id.localeCompare(b.a.id) || a.id.localeCompare(b.id));
        solveManifold(constraints);
        for (const c of constraints) {
            shift(c, CONTACT.skin);
            events.push(Object.freeze({ kind: c.b ? 'kart' : 'barrier', a: c.a.id, b: c.id, time: elapsed, normal: Object.freeze({ ...c.normal }), rebound: c.target }));
        }
        if (++iterations > CONTACT.maxEvents)
            throw new Error('Contact event budget exhausted; tick was not committed');
    }
    for (const b of bodies)
        if (![b.x, b.z, b.vx, b.vz, b.angularVelocity].every(Number.isFinite))
            throw new Error('Nonfinite contact result');
    return Object.freeze({ bodies: Object.freeze(bodies.map(b => Object.freeze(b))), events: Object.freeze(events), iterations, largestCorrection });
}
