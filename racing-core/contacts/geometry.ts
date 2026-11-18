/** Numeric X/Z capsule geometry. No block grid or renderer. */
export type V2 = Readonly<{
    x: number;
    z: number;
}>;
export type Capsule = Readonly<{
    x: number;
    y: number;
    z: number;
    yaw: number;
    radius: number;
    halfLength: number;
    height: number;
}>;
export type Sweep = Readonly<{
    fraction: number;
    normal: V2;
    a: V2;
    b: V2;
    depth: number;
}>;
export const EPS = 1e-9;
export const dot = (a: V2, b: V2) => a.x * b.x + a.z * b.z;
export const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, z: a.z - b.z });
export const plus = (a: V2, b: V2, t = 1): V2 => ({ x: a.x + b.x * t, z: a.z + b.z * t });
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
export function ends(c: Capsule): readonly [
    V2,
    V2
] {
    const x = Math.sin(c.yaw) * c.halfLength, z = Math.cos(c.yaw) * c.halfLength;
    return [{ x: c.x - x, z: c.z - z }, { x: c.x + x, z: c.z + z }];
}
export function closest(p: V2, a: V2, b: V2): V2 {
    const d = sub(b, a), length2 = dot(d, d);
    return plus(a, d, length2 ? clamp(dot(sub(p, a), d) / length2, 0, 1) : 0);
}
export function closestSegments(a: V2, b: V2, c: V2, d: V2): {
    a: V2;
    b: V2;
    distance: number;
} {
    const u = sub(b, a), v = sub(d, c), w = sub(a, c), aa = dot(u, u), bb = dot(u, v), cc = dot(v, v), dd = dot(u, w), ee = dot(v, w);
    let s = 0, t = 0;
    if (aa <= EPS && cc <= EPS) { /* two points */ }
    else if (aa <= EPS)
        t = clamp(ee / cc, 0, 1);
    else if (cc <= EPS)
        s = clamp(-dd / aa, 0, 1);
    else {
        const denominator = aa * cc - bb * bb;
        s = denominator > EPS ? clamp((bb * ee - cc * dd) / denominator, 0, 1) : 0;
        if (denominator <= EPS) {
            const c0 = dot(sub(c, a), u) / aa, c1 = dot(sub(d, a), u) / aa;
            const low = Math.max(0, Math.min(c0, c1)), high = Math.min(1, Math.max(c0, c1));
            if (low <= high)
                s = (low + high) / 2;
        }
        t = (bb * s + ee) / cc;
        if (t < 0) {
            t = 0;
            s = clamp(-dd / aa, 0, 1);
        }
        else if (t > 1) {
            t = 1;
            s = clamp((bb - dd) / aa, 0, 1);
        }
    }
    const pa = plus(a, u, s), pb = plus(c, v, t);
    return { a: pa, b: pb, distance: Math.hypot(pa.x - pb.x, pa.z - pb.z) };
}
function pointSweep(p: V2, move: V2, a: V2, b: V2, radius: number): number[] {
    const hits: number[] = [], axis = sub(b, a), length = Math.hypot(axis.x, axis.z);
    if (length > EPS) {
        const normal = { x: -axis.z / length, z: axis.x / length }, speed = dot(move, normal), distance = dot(sub(p, a), normal);
        if (Math.abs(speed) > EPS)
            for (const side of [-1, 1]) {
                const t = (side * radius - distance) / speed;
                if (t < -EPS || t > 1 + EPS)
                    continue;
                const q = plus(p, move, t), along = dot(sub(q, a), axis) / (length * length);
                if (along >= -EPS && along <= 1 + EPS)
                    hits.push(clamp(t, 0, 1));
            }
    }
    const aa = dot(move, move);
    if (aa > EPS * EPS)
        for (const end of [a, b]) {
            const offset = sub(p, end), bb = 2 * dot(offset, move), cc = dot(offset, offset) - radius * radius, disc = bb * bb - 4 * aa * cc;
            if (disc < -EPS)
                continue;
            const t = (-bb - Math.sqrt(Math.max(0, disc))) / (2 * aa);
            if (t >= -EPS && t <= 1 + EPS)
                hits.push(clamp(t, 0, 1));
        }
    return hits;
}
/** Earliest translation contact between two capsule axes, including long-side/end contacts. */
export function sweepCapsules(a: V2, b: V2, move: V2, c: V2, d: V2, radius: number, includeTouches = false): Sweep | null {
    const initial = closestSegments(a, b, c, d), times = initial.distance <= radius + EPS ? [0] : [];
    times.push(...pointSweep(a, move, c, d, radius), ...pointSweep(b, move, c, d, radius));
    const reverse = { x: -move.x, z: -move.z };
    times.push(...pointSweep(c, reverse, a, b, radius), ...pointSweep(d, reverse, a, b, radius));
    times.sort((x, y) => x - y);
    for (const fraction of times) {
        const pair = closestSegments(plus(a, move, fraction), plus(b, move, fraction), c, d);
        if (pair.distance > radius + 1e-7)
            continue;
        let normal: V2;
        if (pair.distance > EPS)
            normal = { x: (pair.a.x - pair.b.x) / pair.distance, z: (pair.a.z - pair.b.z) / pair.distance };
        else {
            const axis = sub(d, c), length = Math.hypot(axis.x, axis.z), speed = Math.hypot(move.x, move.z);
            normal = length > EPS ? { x: -axis.z / length, z: axis.x / length } : speed > EPS ? { x: -move.x / speed, z: -move.z / speed } : { x: 1, z: 0 };
            if (dot(normal, move) > 0)
                normal = { x: -normal.x, z: -normal.z };
        }
        const depth = Math.max(0, radius - pair.distance);
        if (!includeTouches && fraction === 0 && depth < 1e-7 && dot(move, normal) >= -EPS)
            continue;
        return Object.freeze({ fraction, normal: Object.freeze(normal), a: Object.freeze(pair.a), b: Object.freeze(pair.b), depth });
    }
    return null;
}
