import reference from './tracks/reference.json' with { type: 'json' };
import { clamp, wrap, finite, triangleHeight } from './math.js';
const CELL = 24;
function indexSegments(segments, padding) { const cells = new Map(); for (const s of segments)
    for (let x = Math.floor((Math.min(s.a.x, s.b.x) - padding) / CELL); x <= Math.floor((Math.max(s.a.x, s.b.x) + padding) / CELL); x++)
        for (let z = Math.floor((Math.min(s.a.z, s.b.z) - padding) / CELL); z <= Math.floor((Math.max(s.a.z, s.b.z) + padding) / CELL); z++) {
            const key = `${x},${z}`;
            if (!cells.has(key))
                cells.set(key, []);
            cells.get(key).push(s);
        } return (x, z) => cells.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) || []; }
export function createTrack(data) {
    const n = data.points.length - 1;
    if (n < 16)
        throw Error('A closed course needs at least 16 samples');
    const samples = data.points.map(([x, y, z, nx, nz]) => ({ x: finite(x, 'x'), y: finite(y, 'y'), z: finite(z, 'z'), nx, nz, s: 0 }));
    if (Math.hypot(samples[n].x - samples[0].x, samples[n].y - samples[0].y, samples[n].z - samples[0].z) > 1e-4)
        throw Error('Course seam is open');
    for (let i = 1; i <= n; i++) {
        const a = samples[i - 1], b = samples[i];
        b.s = a.s + Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        if (!(b.s > a.s))
            throw Error('Degenerate road segment');
    }
    const length = samples[n].s, startS = samples[data.startIndex].s, outer = data.halfWidth + data.curbWidth;
    const segments = [], rails = [];
    const offset = (p, side) => ({ x: p.x + p.nx * side, y: p.y, z: p.z + p.nz * side });
    for (let i = 0; i < n; i++) {
        const a = samples[i], b = samples[i + 1], dx = b.x - a.x, dz = b.z - a.z, span = b.s - a.s;
        const corners = [offset(a, -outer), offset(b, -outer), offset(b, outer), offset(a, outer)];
        // Split at the authored centerline so twisting ramp quads cannot lift it.
        const triangles = [[corners[0],corners[1],b],[corners[0],b,a],[a,b,corners[2]],[a,corners[2],corners[3]]];
        segments.push({ index: i, a, b, dx, dz, span, length2: dx * dx + dz * dz, corners, triangles });
        for (const side of [-1, 1])
            rails.push({ a: offset(a, side * outer), b: offset(b, side * outer) });
    }
    const nearby = indexSegments(segments, outer + 3), nearRails = indexSegments(rails, 3);
    function at(distance, lateral = 0) { const d = wrap(startS + distance, length); let lo = 0, hi = n; while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (samples[mid].s <= d)
            lo = mid;
        else
            hi = mid;
    } const a = samples[lo], b = samples[lo + 1], t = (d - a.s) / (b.s - a.s); let nx = a.nx + (b.nx - a.nx) * t, nz = a.nz + (b.nz - a.nz) * t; const norm = Math.hypot(nx, nz); nx /= norm; nz /= norm; return { x: a.x + (b.x - a.x) * t + nx * lateral, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t + nz * lateral, fx: nz, fz: -nx, nx, nz, distance, yaw: Math.atan2(nz, -nx) }; }
    function project(p, hint = null, maxDelta = Infinity) { let best = null, cost = Infinity; for (const s of nearby(p.x, p.z)) {
        const t = clamp(((p.x - s.a.x) * s.dx + (p.z - s.a.z) * s.dz) / s.length2, 0, 1), x = s.a.x + s.dx * t, z = s.a.z + s.dz * t, y = s.a.y + (s.b.y - s.a.y) * t, off = Math.hypot(p.x - x, p.z - z), height = Math.abs(p.y - y), distance = wrap(s.a.s + s.span * t - startS, length);
        let score = off * off + height * height * 16;
        if (hint !== null) {
            const delta = Math.abs(wrap(distance - hint + length / 2, length) - length / 2);
            if (delta > maxDelta)
                continue;
            score += delta * delta * .1;
        }
        if (score < cost) {
            cost = score;
            const c = at(distance);
            best = { ...c, distance, height, off, lateral: (p.x - x) * c.nx + (p.z - z) * c.nz, segment: s.index };
        }
    } return best; }
    function support(x,z,maximum=Infinity) {
        let best=null;
        for(const segment of nearby(x,z)) for(const [a,b,c] of segment.triangles) {
            const y=triangleHeight(x,z,a,b,c);
            if(y!==null&&y<=maximum+1e-6&&(best===null||y>best)) best=y;
        }
        return best;
    }
    function resolve(x, z, y, radius = 1.05) { for (let pass = 0; pass < 4; pass++)
        for (const rail of nearRails(x, z)) {
            const dx = rail.b.x - rail.a.x, dz = rail.b.z - rail.a.z, t = clamp(((x - rail.a.x) * dx + (z - rail.a.z) * dz) / (dx * dx + dz * dz), 0, 1), px = rail.a.x + dx * t, pz = rail.a.z + dz * t, py = rail.a.y + (rail.b.y - rail.a.y) * t;
            if (y > py + 1.3 || y + 1.2 < py)
                continue;
            const d = Math.hypot(x - px, z - pz);
            if (d >= radius)
                continue;
            let nx = (x - px) / (d || 1), nz = (z - pz) / (d || 1);
            if (d < 1e-8) {
                const span = Math.hypot(dx, dz);
                nx = -dz / span;
                nz = dx / span;
            }
            x = px + nx * radius;
            z = pz + nz * radius;
        } return { x, z }; }
    const gates = Array.from({ length: 13 }, (_, i) => ({ ...at(i * length / 13), index: i }));
    return Object.freeze({ id: data.id, name: data.name, key: `racing-v1:${reference.revision}:${data.id}`, length, legacyLength: data.length, samples, segments, rails, halfWidth: data.halfWidth, outer, start: at(0), gates, at, project, support, resolve });
}
const cache = new Map();
export const TRACK_IDS = Object.freeze(reference.tracks.map(t => t.id));
export function getTrack(id) { if (!TRACK_IDS.includes(id))
    throw new RangeError(`Unknown track: ${id}`); if (!cache.has(id))
    cache.set(id, createTrack(reference.tracks.find(t => t.id === id))); return cache.get(id); }
export const provenance = Object.freeze({ repository: reference.repository, revision: reference.revision, samplingThreeVersion: reference.samplingThreeVersion });
