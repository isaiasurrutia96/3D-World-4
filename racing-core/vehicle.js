import { clamp, approach, finite } from './math.js';
export const VEHICLE = Object.freeze({ step: 1 / 120, topSpeed: 120 * .44704, boostSpeed: 180 * .44704, acceleration: 24, braking: 36, reverseSpeed: 8, steeringLock: .415, steeringBuild: 6.5, steeringRelease: 14, heldSteerDelay: .5, heldSteerRamp: .8, heldSteerGain: .20, wheelbase: 2.03, radius: 1.05, gravity: 18, grip: 7 });
export function createVehicle(p = { x: 0, y: 0, z: 0, yaw: 0 }) { return { x: p.x, y: p.y, z: p.z, yaw: p.yaw, vx: 0, vz: 0, speed: 0, steering: 0, steerHoldTime: 0, steerHoldDirection: 0, railContactTime: 0, verticalSpeed: 0, grounded: true, pitch: 0, bank: 0, boostLeft: 0, boosts: 3, contacts: 0 }; }
export function normalizeInput(input = {}) { return { throttle: clamp(Number.isFinite(input.throttle) ? input.throttle : 0, -1, 1), steer: clamp(Number.isFinite(input.steer) ? input.steer : 0, -1, 1), brake: !!input.brake, boost: !!input.boost }; }
export function maxSteering(speed, holdSeconds = 0) {
    const hold = clamp((holdSeconds - VEHICLE.heldSteerDelay) / VEHICLE.heldSteerRamp, 0, 1);
    return VEHICLE.steeringLock / (1 + Math.abs(speed) / 11) * (1 + VEHICLE.heldSteerGain * hold * hold * (3 - 2 * hold));
}
export function stepVehicle(s, raw, dt, track) {
    finite(dt, 'dt');
    if (dt <= 0 || dt > VEHICLE.step + 1e-8)
        throw new RangeError('Vehicle must use fixed substeps');
    const input = normalizeInput(raw), T = VEHICLE;
    s.railContactTime = Math.max(0, (s.railContactTime || 0) - dt);
    if (input.boost && !s.boostLatch && s.boosts > 0) {
        s.boostLeft = 1.5;
        s.boosts--;
    }
    s.boostLatch = input.boost;
    s.boostLeft = Math.max(0, s.boostLeft - dt);
    const top = s.boostLeft > 0 ? T.boostSpeed : T.topSpeed;
    const sin = Math.sin(s.yaw), cos = Math.cos(s.yaw);
    let forward = s.vx * sin + s.vz * cos, side = (s.vx * cos - s.vz * sin) * Math.exp(-T.grip * dt);
    if (input.brake)
        forward = approach(forward, 0, T.braking * dt);
    else if (input.throttle > 0)
        forward = approach(forward, top * input.throttle, (s.boostLeft > 0 ? 48 : T.acceleration) * dt);
    else if (input.throttle < 0)
        forward = approach(forward, -T.reverseSpeed * -input.throttle, (forward > 0 ? T.braking : 8) * dt);
    else
        forward = approach(forward, 0, (1.8 + .0035 * forward * forward) * dt);
    // LetsGo's short taps build gently; release/countersteer straightens sooner.
    // Holding a turn gains up to 20% lock after half a second.
    const heldDirection = Math.abs(input.steer) > .55 && forward > 2 && s.grounded && !input.brake ? Math.sign(input.steer) : 0;
    s.steerHoldTime = heldDirection ? (s.steerHoldDirection === heldDirection ? s.steerHoldTime : 0) + dt : 0;
    s.steerHoldDirection = heldDirection;
    const targetSteering = input.steer * maxSteering(forward, s.steerHoldTime);
    const building = input.steer * s.steering >= 0 && Math.abs(targetSteering) > Math.abs(s.steering);
    s.steering += (targetSteering - s.steering) * (1 - Math.exp(-(building ? T.steeringBuild : T.steeringRelease) * dt));
    const turnSpeed = s.railContactTime > 0 && input.throttle > 0 ? Math.max(forward, 2) : forward;
    if (s.grounded)
        s.yaw += turnSpeed / T.wheelbase * Math.tan(s.steering) * dt;
    s.vx = Math.sin(s.yaw) * forward + Math.cos(s.yaw) * side;
    s.vz = Math.cos(s.yaw) * forward - Math.sin(s.yaw) * side;
    const steps = Math.max(1, Math.ceil(Math.hypot(s.vx, s.vz) * dt / .22));
    s.contacts = 0;
    for (let i = 0; i < steps; i++) {
        const x = s.x + s.vx * dt / steps, z = s.z + s.vz * dt / steps, r = track.resolve(x, z, s.y, T.radius), dx = r.x - x, dz = r.z - z, depth = Math.hypot(dx, dz);
        s.x = r.x;
        s.z = r.z;
        if (depth > 1e-7) {
            s.contacts++;
            s.railContactTime = .3;
            const nx = dx / depth, nz = dz / depth, closing = s.vx * nx + s.vz * nz;
            if (closing < 0) {
                s.vx -= nx * closing * 1.03;
                s.vz -= nz * closing * 1.03;
            }
        }
    }
    const surface = track.support(s.x, s.z, s.y + .65);
    if (s.grounded && surface !== null && surface >= s.y - .65) {
        s.y = surface;
        s.verticalSpeed = 0;
    }
    else {
        s.grounded = false;
        const oldY = s.y;
        s.verticalSpeed -= T.gravity * dt;
        s.y += s.verticalSpeed * dt;
        const ground = track.support(s.x, s.z, oldY + .01);
        if (s.verticalSpeed <= 0 && ground !== null && oldY >= ground - .02 && s.y <= ground) {
            s.y = ground;
            s.verticalSpeed = 0;
            s.grounded = true;
        }
    }
    s.speed = s.vx * Math.sin(s.yaw) + s.vz * Math.cos(s.yaw);
    if (s.grounded) {
        const a = track.support(s.x + Math.sin(s.yaw), s.z + Math.cos(s.yaw), s.y + .7), b = track.support(s.x - Math.sin(s.yaw), s.z - Math.cos(s.yaw), s.y + .7);
        s.pitch = a !== null && b !== null ? Math.atan2(b - a, 2) : 0;
    }
    return s;
}
export function resolveKartContact(a, b, track) {
    if (Math.abs(a.y - b.y) > 1.3)
        return false;
    let dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), limit = VEHICLE.radius * 2;
    if (d >= limit)
        return false;
    const nx = d > 1e-8 ? dx / d : 1, nz = d > 1e-8 ? dz / d : 0, push = (limit - d + .00001) / 2;
    Object.assign(a, track.resolve(a.x - nx * push, a.z - nz * push, a.y));
    Object.assign(b, track.resolve(b.x + nx * push, b.z + nz * push, b.y));
    const closing = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
    if (closing < 0) {
        const impulse = -closing * .55;
        a.vx -= nx * impulse;
        a.vz -= nz * impulse;
        b.vx += nx * impulse;
        b.vz += nz * impulse;
    }
    for (const s of [a, b])
        s.speed = s.vx * Math.sin(s.yaw) + s.vz * Math.cos(s.yaw);
    return true;
}
