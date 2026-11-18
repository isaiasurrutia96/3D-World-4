import { ends, sweepCapsules, closest, EPS } from './geometry.ts';
import type { Capsule, V2 } from './geometry.ts';
import type { BarrierHit, BarrierWorld } from './world.ts';
import type { Track } from '../track/index.ts';
export type BarrierSegment = Readonly<{
    id: string;
    a: Readonly<{
        x: number;
        y: number;
        z: number;
    }>;
    b: Readonly<{
        x: number;
        y: number;
        z: number;
    }>;
    height: number;
    thickness?: number;
}>;
/** Existing rails only. This adapter is not a block-occupancy/collision engine. */
export function createRailBarriers(segments: readonly BarrierSegment[]): BarrierWorld {
    const cellSize = 24, cells = new Map<string, BarrierSegment[]>();
    const copied = segments.map(s => {
        if (typeof s.id !== 'string' || !s.id || ![s.a.x, s.a.y, s.a.z, s.b.x, s.b.y, s.b.z, s.height, s.thickness ?? 0].every(Number.isFinite) || s.height <= 0 || (s.thickness ?? 0) < 0)
            throw new TypeError('Invalid barrier segment');
        return Object.freeze({ ...s, a: Object.freeze({ ...s.a }), b: Object.freeze({ ...s.b }) });
    });
    if (new Set(copied.map(s => s.id)).size !== copied.length)
        throw new TypeError('Barrier ids must be unique');
    for (const s of copied) {
        const pad = (s.thickness ?? 0) / 2;
        for (let i = Math.floor((Math.min(s.a.x, s.b.x) - pad) / cellSize); i <= Math.floor((Math.max(s.a.x, s.b.x) + pad) / cellSize); i++)
            for (let j = Math.floor((Math.min(s.a.z, s.b.z) - pad) / cellSize); j <= Math.floor((Math.max(s.a.z, s.b.z) + pad) / cellSize); j++) {
                const key = i + ',' + j, list = cells.get(key) ?? [];
                list.push(s);
                cells.set(key, list);
            }
    }
    function query(body: Capsule, move: V2, nearContacts = false): readonly BarrierHit[] {
        const pad = body.radius + body.halfLength, found = new Set<BarrierSegment>();
        for (let i = Math.floor((Math.min(body.x, body.x + move.x) - pad) / cellSize); i <= Math.floor((Math.max(body.x, body.x + move.x) + pad) / cellSize); i++)
            for (let j = Math.floor((Math.min(body.z, body.z + move.z) - pad) / cellSize); j <= Math.floor((Math.max(body.z, body.z + move.z) + pad) / cellSize); j++)
                for (const s of cells.get(i + ',' + j) ?? [])
                    found.add(s);
        const result: BarrierHit[] = [], [a, b] = ends(body);
        for (const s of found) {
            const margin = nearContacts ? 1e-6 : 0;
            const hit = sweepCapsules(a, b, move, s.a, s.b, body.radius + (s.thickness ?? 0) / 2 + margin, nearContacts);
            if (!hit)
                continue;
            const nearest = closest(hit.b, s.a, s.b), dx = s.b.x - s.a.x, dz = s.b.z - s.a.z, length2 = dx * dx + dz * dz, t = length2 ? ((nearest.x - s.a.x) * dx + (nearest.z - s.a.z) * dz) / length2 : 0;
            const base = s.a.y + (s.b.y - s.a.y) * t;
            if (body.y >= base + s.height - EPS || body.y + body.height <= base + EPS)
                continue;
            result.push(Object.freeze({ id: s.id, fraction: hit.fraction, normal: hit.normal, point: Object.freeze({ x: hit.a.x - hit.normal.x * body.radius, z: hit.a.z - hit.normal.z * body.radius }), depth: Math.max(0, hit.depth - margin) }));
        }
        return Object.freeze(result.sort((a, b) => a.fraction - b.fraction || a.id.localeCompare(b.id)));
    }
    return Object.freeze({ sweep: query, overlaps: (body: Capsule) => query(body, { x: 0, z: 0 }, true) });
}
export function trackBarriers(track: Track): BarrierWorld {
    return createRailBarriers(track.rails.map(rail => ({ id: track.id + ':' + rail.index, a: rail.a, b: rail.b, height: rail.height })));
}
