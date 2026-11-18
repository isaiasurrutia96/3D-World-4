/** Renderer-free geometry for the fresh track layer. Distances are metres. */
export type Point = Readonly<{
    x: number;
    y: number;
    z: number;
}>;
export const EPSILON = 1e-9;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const wrap = (value: number, length: number) => ((value % length) + length) % length;
export function finite(value: number, name: string): number { if (!Number.isFinite(value))
    throw new TypeError(name + ' must be finite'); return value; }
export function point(x: number, y: number, z: number): Point { return Object.freeze({ x, y, z }); }
export function checkPoint(p: Point): void { finite(p.x, 'x'); finite(p.y, 'y'); finite(p.z, 'z'); }
export function lerp(a: Point, b: Point, t: number): Point { return point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t); }
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export function heightInTriangle(x: number, z: number, a: Point, b: Point, c: Point): number | null {
    const denominator = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    if (Math.abs(denominator) < 1e-10)
        return null;
    const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / denominator;
    const v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / denominator, w = 1 - u - v;
    return Math.min(u, v, w) >= -1e-7 ? u * a.y + v * b.y + w * c.y : null;
}
export function closestOnSegment(p: Point, a: Point, b: Point) {
    const dx = b.x - a.x, dz = b.z - a.z, length2 = dx * dx + dz * dz;
    const t = length2 ? clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / length2, 0, 1) : 0;
    const position = lerp(a, b, t);
    return { position, t, offset: Math.hypot(p.x - position.x, p.z - position.z) };
}
/** Index actual bounds, including slanted corners. No renderer or world floor. */
export function spatialIndex<T>(items: readonly T[], vertices: (item: T) => readonly Point[], padding = 0) {
    const cells = new Map<string, T[]>(), size = 24;
    for (const item of items) {
        const points = vertices(item), xs = points.map(p => p.x), zs = points.map(p => p.z);
        const x0 = Math.floor((Math.min(...xs) - padding) / size), x1 = Math.floor((Math.max(...xs) + padding) / size);
        const z0 = Math.floor((Math.min(...zs) - padding) / size), z1 = Math.floor((Math.max(...zs) + padding) / size);
        for (let x = x0; x <= x1; x++)
            for (let z = z0; z <= z1; z++) {
                const key = x + ',' + z;
                const list = cells.get(key);
                if (list)
                    list.push(item);
                else
                    cells.set(key, [item]);
            }
    }
    return (x: number, z: number, radius = 0): T[] => {
        if (radius === 0)
            return cells.get(Math.floor(x / size) + ',' + Math.floor(z / size)) || [];
        const found = new Set<T>();
        for (let i = Math.floor((x - radius) / size); i <= Math.floor((x + radius) / size); i++)
            for (let j = Math.floor((z - radius) / size); j <= Math.floor((z + radius) / size); j++)
                for (const item of cells.get(i + ',' + j) || [])
                    found.add(item);
        return [...found];
    };
}
