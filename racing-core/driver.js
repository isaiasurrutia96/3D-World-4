import { clamp, wrap } from './math.js';
import { VEHICLE, maxSteering } from './vehicle.js';
export function createDriver({ lane = 0, pace = 1 } = {}) { return { lane, pace, offset: lane, stuck: 0, reversing: 0 }; }
function curvature(a, b, c) { const ab = Math.hypot(b.x - a.x, b.z - a.z), bc = Math.hypot(c.x - b.x, c.z - b.z), ac = Math.hypot(c.x - a.x, c.z - a.z); return 2 * Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) / Math.max(.001, ab * bc * ac); }
export function readDriver(driver, s, track, dt, traffic = []) {
    const projection = track.project(s, driver.progress ?? null, driver.progress === undefined ? Infinity : 8 + Math.abs(s.speed) * dt * 3);
    if (!projection)
        return { throttle: 0, brake: true, steer: 0 };
    const progress = projection.distance;
    driver.progress = progress;
    let lane = driver.lane, leader = null, gap = Infinity;
    for (const other of traffic) {
        if (other === s || Math.abs(other.y - s.y) > 1.3)
            continue;
        const p = track.project(other);
        if (!p)
            continue;
        const d = wrap(p.distance - progress, track.length);
        if (d < 35 && d < gap && Math.abs(p.lateral - projection.lateral) < 3) {
            leader = other;
            gap = d;
            const sign = p.lateral >= 0 ? -1 : 1;
            lane = clamp(driver.lane + sign * 4, -7, 7);
        }
    }
    driver.offset += (lane - driver.offset) * (1 - Math.exp(-2 * dt));
    const at = d => track.at(progress + d, driver.offset), look = clamp(8 + Math.max(0, s.speed) * .45, 8, 32), target = at(look), dx = target.x - s.x, dz = target.z - s.z, right = dx * Math.cos(s.yaw) - dz * Math.sin(s.yaw), wheel = Math.atan2(2 * VEHICLE.wheelbase * right, Math.max(4, dx * dx + dz * dz)), steer = clamp(wheel / maxSteering(s.speed, s.steerHoldTime), -1, 1);
    let speed = VEHICLE.topSpeed * .83 * driver.pace;
    // Leave cornering margin for the gentler steering build used by the player.
    for (const d of [0, 12, 25, 50, 90, 150]) {
        const k = curvature(at(d - 8), at(d), at(d + 8)), allowed = Math.min(VEHICLE.topSpeed, Math.sqrt(8 / Math.max(.00001, k)));
        speed = Math.min(speed, Math.sqrt(allowed * allowed + 2 * 25 * Math.max(0, d - 12)));
    }
    if (leader && gap < 10)
        speed = Math.min(speed, Math.max(0, leader.speed) + (gap - 4) * .8);
    driver.stuck = s.speed < 1 && s.contacts ? driver.stuck + dt : 0;
    if (driver.stuck > 2) {
        driver.reversing = .7;
        driver.stuck = 0;
    }
    driver.reversing = Math.max(0, driver.reversing - dt);
    if (driver.reversing)
        return { throttle: -1, steer: -steer };
    return { throttle: s.speed < speed ? 1 : 0, brake: s.speed > speed + 1, steer };
}
