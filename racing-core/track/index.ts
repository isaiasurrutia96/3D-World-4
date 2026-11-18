/** Fresh section 1. No imports from the retired racing implementation. */
import reference from './reference.json' with { type: 'json' };
import { point, lerp, distance, finite, checkPoint, clamp, wrap, heightInTriangle, closestOnSegment, spatialIndex, EPSILON } from './geometry.ts';
import type { Point } from './geometry.ts';
export type { Point } from './geometry.ts';
export const TRACK_IDS = Object.freeze(['original', 'skyline', 'suzuka', 'winding'] as const);
export type TrackId = typeof TRACK_IDS[number];
export type TrackOptions = Readonly<{
    seam?: 'reference' | 'weld';
    accessBridge?: boolean;
}>;
export type Placement = Readonly<{
    x?: number;
    y?: number;
    z?: number;
    yaw?: number;
}>;
export type Triangle = readonly [
    Point,
    Point,
    Point
];
export type RoadSegment = Readonly<{
    index: number;
    a: Point;
    b: Point;
    sourceDistance: number;
    curbVisible: readonly boolean[];
    innerCorners: readonly Point[];
    corners: readonly [
        Point,
        Point,
        Point,
        Point
    ];
    triangles: readonly [
        Triangle,
        Triangle
    ];
    length: number;
    distance: number;
}>;
export type Rail = Readonly<{
    index: number;
    a: Point;
    b: Point;
    height: number;
}>;
export type Gate = Readonly<{
    index: number;
    center: Point;
    forward: Point;
    distance: number;
    sourceDistance: number;
    halfWidth: number;
    heightTolerance: number;
}>;
export type Projection = Readonly<{
    point: Point;
    distance: number;
    segmentIndex: number;
    offset: number;
    lateral: number;
    heightError: number;
}>;
export type ProjectionOptions = Readonly<{
    hintDistance?: number;
    maxDelta?: number;
}>;
export type TrackSample = Readonly<{
    point: Point;
    forward: Point;
    normal: Point;
    distance: number;
    segmentIndex: number;
}>;
export type Bounds = Readonly<{
    min: Point;
    max: Point;
}>;
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value))
        deepFreeze(child);
} return value; }
export const SOURCE = deepFreeze(reference.source);
export const APPEARANCE = deepFreeze(reference.appearance);
const blueprints = deepFreeze(reference.tracks);
function interval(values: readonly number[], value: number): number {
    let low = 0, high = values.length - 1;
    while (low + 1 < high) {
        const mid = (low + high) >>> 1;
        if (values[mid] <= value)
            low = mid;
        else
            high = mid;
    }
    return low;
}
function triangle(a: Point, b: Point, c: Point): Triangle { return Object.freeze([a, b, c]); }
export function createTrack(id: TrackId, placement: Placement = {}, options: TrackOptions = {}) {
    const seamMode = options.seam ?? 'weld';
    const accessBridge=options.accessBridge??false;
    if(typeof accessBridge!=='boolean')throw new TypeError('accessBridge must be boolean');
    if (!['reference', 'weld'].includes(seamMode))
        throw new RangeError('Invalid seam mode');
    const raw = blueprints.find(t => t.id === id);
    if (!raw)
        throw new RangeError('Unknown track ' + id);
    const pose = Object.freeze({ x: finite(placement.x ?? 0, 'placement.x'), y: finite(placement.y ?? 0, 'placement.y'), z: finite(placement.z ?? 0, 'placement.z'), yaw: finite(placement.yaw ?? 0, 'placement.yaw') });
    const sin = Math.sin(pose.yaw), cos = Math.cos(pose.yaw);
    const transform = (p: Point) => point(p.x * cos + p.z * sin + pose.x, p.y + pose.y, p.z * cos - p.x * sin + pose.z);
    const rotate = (p: Point) => point(p.x * cos + p.z * sin, p.y, p.z * cos - p.x * sin);
    const toLocal = (p: Point) => { const x = p.x - pose.x, z = p.z - pose.z; return point(x * cos - z * sin, p.y - pose.y, z * cos + x * sin); };
    const samples = raw.samples.map(s => ({ position: point(s[0], s[1], s[2]), normal: point(s[3], 0, s[4]), station: s[5] }));
    const count = samples.length - 1, outer = raw.halfWidth + raw.curbWidth;
    const oldEnd = { ...samples[count] };
    if (seamMode === 'weld') {
        samples[count].position = samples[0].position;
        samples[count].normal = samples[0].normal;
    }
    function railEnd(x: number, y: number, z: number): Point {
        if (seamMode === 'weld')
            for (const side of [-1, 1]) {
                const offset = side * (outer + .15);
                if (x === oldEnd.position.x + oldEnd.normal.x * offset && y === oldEnd.position.y && z === oldEnd.position.z + oldEnd.normal.z * offset)
                    return transform(point(samples[0].position.x + samples[0].normal.x * offset, y, samples[0].position.z + samples[0].normal.z * offset));
            }
        return transform(point(x, y, z));
    }
    const distances = [0];
    for (let i = 0; i < count; i++)
        distances.push(distances[i] + distance(samples[i].position, samples[i + 1].position));
    const length = distances[count], startDistance = distances[raw.startIndex];
    const cornersAt = (s: typeof samples[number], side: number, width=outer) => transform(point(s.position.x + s.normal.x * side * width, s.position.y, s.position.z + s.normal.z * side * width));
    const segments: readonly RoadSegment[] = Object.freeze(Array.from({ length: count }, (_, i) => {
        const corners = Object.freeze([cornersAt(samples[i], -1), cornersAt(samples[i + 1], -1), cornersAt(samples[i + 1], 1), cornersAt(samples[i], 1)] as const);
        const innerCorners=Object.freeze([cornersAt(samples[i],-1,raw.halfWidth),cornersAt(samples[i+1],-1,raw.halfWidth),cornersAt(samples[i+1],1,raw.halfWidth),cornersAt(samples[i],1,raw.halfWidth)]);
        return Object.freeze({ index: i, sourceDistance:samples[i].station,curbVisible:Object.freeze(raw.curbOpenings.map(indices=>!accessBridge||!indices.includes(i))),innerCorners, a: transform(samples[i].position), b: transform(samples[i + 1].position), corners, triangles: Object.freeze([triangle(corners[0], corners[1], corners[2]), triangle(corners[0], corners[2], corners[3])] as const), length: distances[i + 1] - distances[i], distance: distances[i] });
    }));
    const rails: readonly Rail[] = Object.freeze(accessBridge
        ? raw.rails.map((r,index)=>Object.freeze({index,a:transform(point(r[0],r[1],r[2])),b:railEnd(r[3],r[4],r[5]),height:reference.wallHeight}))
        : samples.slice(0,-1).flatMap((a,i)=>[-1,1].map((side,sideIndex)=>Object.freeze({index:i*2+sideIndex,a:cornersAt(a,side,outer+.15),b:cornersAt(samples[i+1],side,outer+.15),height:reference.wallHeight}))));
    const access=accessBridge?Object.freeze(raw.access):null;
    const accessCorners: readonly Point[]=Object.freeze(access?[point(access.minX,access.height,access.minZ),point(access.maxX,access.height,access.minZ),point(access.maxX,access.height,access.maxZ),point(access.minX,access.height,access.maxZ)].map(transform):[]);
    const accessTriangles: readonly Triangle[]=Object.freeze(access?[triangle(accessCorners[0],accessCorners[1],accessCorners[2]),triangle(accessCorners[0],accessCorners[2],accessCorners[3])]:[]);
    const sourceDistances = samples.map(s => s.station);
    const fromSourceDistance = (relative: number) => {
        const station = wrap(samples[raw.startIndex].station + relative, raw.sourceLength), i = interval(sourceDistances, station);
        const t = (station - sourceDistances[i]) / (sourceDistances[i + 1] - sourceDistances[i]);
        return wrap(distances[i] + (distances[i + 1] - distances[i]) * t - startDistance, length);
    };
    const gates: readonly Gate[] = Object.freeze(raw.gates.map((g, index) => Object.freeze({ index, center: transform(point(g[0], g[1], g[2])), forward: rotate(point(g[3], 0, g[4])), distance: index === 0 ? 0 : fromSourceDistance(g[5]), sourceDistance: g[5], halfWidth: outer + .5, heightTolerance: 1.25 })));
    const nearbyRoad = spatialIndex(segments, s => s.corners), nearbyRails = spatialIndex(rails, r => [r.a, r.b]);
    const allPoints = [...segments.flatMap(s => s.corners), ...accessCorners, ...rails.flatMap(r => [r.a, r.b, point(r.a.x, r.a.y + r.height, r.a.z), point(r.b.x, r.b.y + r.height, r.b.z)])];
    const bounds: Bounds = Object.freeze({ min: point(Math.min(...allPoints.map(p => p.x)), Math.min(...allPoints.map(p => p.y)) - .65, Math.min(...allPoints.map(p => p.z))), max: point(Math.max(...allPoints.map(p => p.x)), Math.max(...allPoints.map(p => p.y)), Math.max(...allPoints.map(p => p.z))) });
    function sample(metres: number): TrackSample {
        finite(metres, 'distance');
        const d = wrap(startDistance + metres, length), i = interval(distances, d), s = segments[i], t = (d - distances[i]) / s.length;
        const span = Math.hypot(s.b.x - s.a.x, s.b.z - s.a.z), normal = rotate(lerp(samples[i].normal, samples[i + 1].normal, t));
        return Object.freeze({ point: lerp(s.a, s.b, t), forward: point((s.b.x - s.a.x) / span, 0, (s.b.z - s.a.z) / span), normal, distance: metres, segmentIndex: i });
    }
    function roadHeightAt(x: number, z: number, maximum = Infinity): number | null {
        finite(x, 'x');
        finite(z, 'z');
        if (Number.isNaN(maximum))
            throw new TypeError('maximum must not be NaN');
        let highest: number | null = null;
        for (const s of nearbyRoad(x, z))
            for (const [a, b, c] of s.triangles) {
                const y = heightInTriangle(x, z, a, b, c);
                if (y !== null && y <= maximum && (highest === null || y > highest))
                    highest = y;
            }
        return highest;
    }
    function heightAt(x: number, z: number, maximum = Infinity): number | null {
        let highest = roadHeightAt(x, z, maximum);
        for (const [a, b, c] of accessTriangles) {
            const y = heightInTriangle(x, z, a, b, c);
            if (y !== null && y <= maximum && (highest === null || y > highest))
                highest = y;
        }
        return highest;
    }
    function project(p: Point, options: ProjectionOptions = {}): Projection | null {
        checkPoint(p);
        if (options.hintDistance !== undefined)
            finite(options.hintDistance, 'hintDistance');
        if (options.maxDelta !== undefined && (!Number.isFinite(options.maxDelta) || options.maxDelta < 0))
            throw new RangeError('maxDelta must be finite and nonnegative');
        let best: Projection | null = null, cost = Infinity;
        for (const s of nearbyRoad(p.x, p.z)) {
            const nearest = closestOnSegment(p, s.a, s.b);
            let metres = wrap(s.distance + s.length * nearest.t - startDistance, length);
            if (options.hintDistance !== undefined) {
                metres += Math.round((options.hintDistance - metres) / length) * length;
                if (options.maxDelta !== undefined && Math.abs(metres - options.hintDistance) > options.maxDelta)
                    continue;
            }
            const dy = p.y - nearest.position.y, score = nearest.offset ** 2 + 9 * dy * dy;
            if (score < cost) {
                const span = Math.hypot(s.b.x - s.a.x, s.b.z - s.a.z);
                cost = score;
                best = Object.freeze({ point: nearest.position, distance: metres, segmentIndex: s.index, offset: nearest.offset, lateral: ((p.x - nearest.position.x) * (s.b.z - s.a.z) - (p.z - nearest.position.z) * (s.b.x - s.a.x)) / span, heightError: dy });
            }
        }
        return best;
    }
    function nearestWall(p: Point, radius = 2) {
        checkPoint(p);
        finite(radius, 'radius');
        if (radius < 0)
            throw new RangeError('radius must be nonnegative');
        let best: Readonly<{
            point: Point;
            distance: number;
            railIndex: number;
        }> | null = null;
        for (const rail of nearbyRails(p.x, p.z, radius)) {
            const q = closestOnSegment(p, rail.a, rail.b);
            if (q.offset > radius || p.y < q.position.y - EPSILON || p.y > q.position.y + rail.height + EPSILON)
                continue;
            if (!best || q.offset < best.distance)
                best = Object.freeze({ point: q.position, distance: q.offset, railIndex: rail.index });
        }
        return best;
    }
    /** Geometry only: directed plane crossing. Scoring/order/countdown belong to layer 4. */
    function crossGate(index: number, from: Point, to: Point) {
        checkPoint(from);
        checkPoint(to);
        if (!Number.isInteger(index) || !gates[index])
            throw new RangeError('Invalid gate index');
        const gate = gates[index], signed = (p: Point) => (p.x - gate.center.x) * gate.forward.x + (p.z - gate.center.z) * gate.forward.z;
        const before = signed(from), after = signed(to);
        // Half-open crossing: arriving on the plane counts; departing from it does not count twice.
        if (before >= -EPSILON || after < -EPSILON)
            return null;
        const fraction = clamp(-before / (after - before), 0, 1), p = lerp(from, to, fraction), dx = p.x - gate.center.x, dz = p.z - gate.center.z;
        if (Math.abs(dx * gate.forward.z - dz * gate.forward.x) > gate.halfWidth || Math.abs(p.y - gate.center.y) >= gate.heightTolerance)
            return null;
        return Object.freeze({ fraction, point: p });
    }
    const seamEdgeGap = Math.max(distance(segments[0].corners[0], segments.at(-1)!.corners[1]), distance(segments[0].corners[3], segments.at(-1)!.corners[2]));
    return Object.freeze({ id, seamMode, accessBridge, name: raw.name, sourceId: raw.sourceId, placement: pose, length, sourceLength: raw.sourceLength, startIndex: raw.startIndex, halfWidth: raw.halfWidth, curbWidth: raw.curbWidth, outer, roadThickness: reference.roadThickness, segments, rails, access, accessTriangles, gates, bounds, seamEdgeGap, entrance: accessBridge?transform(raw.entrance):null, start: Object.freeze({ point: gates[0].center, yaw: Math.atan2(gates[0].forward.x, gates[0].forward.z) }), sample, roadHeightAt, heightAt, project, nearestWall, crossGate, toLocal });
}
export type Track = ReturnType<typeof createTrack>;
