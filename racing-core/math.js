export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const wrap = (v, n) => ((v % n) + n) % n;
export const angle = v => Math.atan2(Math.sin(v), Math.cos(v));
export const approach = (v, target, amount) => v < target ? Math.min(target, v + amount) : Math.max(target, v - amount);
export function finite(value, name) { if (!Number.isFinite(value))
    throw new TypeError(`${name} must be finite`); return value; }
export function interpolate(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, yaw: a.yaw + angle(b.yaw - a.yaw) * t }; }
export function triangleHeight(x, z, a, b, c) { const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z); if (Math.abs(d) < 1e-10)
    return null; const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / d, v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / d, w = 1 - u - v; return Math.min(u, v, w) >= -1e-7 ? u * a.y + v * b.y + w * c.y : null; }
