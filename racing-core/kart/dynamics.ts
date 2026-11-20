/** Force-limited handling within the existing fixed-step/contact pipeline. No renderer. */
import type { KartState, KartInput, KartMotion, SurfaceWorld } from './index.ts';
import { sampleCurve, steeringLimit, STANDARD_GRAVITY } from './profiles.ts';
import type { HandlingProfile } from './profiles.ts';
export type SurfaceSample = Readonly<{ grip?: number; speed?: number; resistance?: number }>;
export type HandlingState = Readonly<{
    fingerprint: string;
    throttle: number; brake: number; lift: number; steerInput: number; yawRate: number;
    driveAcceleration: number; recoveryDeceleration: number;
    gripMultiplier: number; surfaceSpeedMultiplier: number; surfaceResistanceMultiplier: number;
    longitudinalLimit: number; lateralLimit: number;
    acceleration: number; brakingG: number; lateralG: number; tireSlip: number;
    slipAngle: number; tireUtilization: number; steeringLimit: number;
}>;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const approach = (n: number, target: number, amount: number) => n < target ? Math.min(target, n + amount) : Math.max(target, n - amount);
export function initialHandling(profile: HandlingProfile): HandlingState {
    return Object.freeze({ fingerprint: profile.fingerprint, throttle: 0, brake: 0, lift: 0, steerInput: 0, yawRate: 0, driveAcceleration: 0, recoveryDeceleration: 0, gripMultiplier: 1, surfaceSpeedMultiplier: 1, surfaceResistanceMultiplier: 1, longitudinalLimit: 0, lateralLimit: 0, acceleration: 0, brakingG: 0, lateralG: 0, tireSlip: 0, slipAngle: 0, tireUtilization: 0, steeringLimit: profile.steeringLock });
}
function surface(world: SurfaceWorld | undefined, state: KartState): Required<SurfaceSample> {
    const raw = world?.surfaceAt ? world.surfaceAt(state.x, state.z, state.y) : {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError('surfaceAt must return numeric multipliers');
    const value = { grip: raw.grip ?? 1, speed: raw.speed ?? 1, resistance: raw.resistance ?? 1 };
    for (const [key, n] of Object.entries(value)) {
        if (!Number.isFinite(n) || n < 0 || n > 10 || key === 'speed' && n === 0) throw new RangeError('Invalid surface ' + key);
    }
    return value;
}
/** Positive steer keeps the approved chase-view direction (negative world yaw). */
export function prepareTunedStep(source: KartState, input: KartInput, activateBoost: boolean, profile: HandlingProfile, world: SurfaceWorld | undefined, geometry: Readonly<{ step: number; wheelbase: number; boostDuration: number }>): KartMotion {
    const dt = geometry.step, previous = source.handling ?? initialHandling(profile);
    if (previous.fingerprint !== profile.fingerprint) throw new Error('Kart state/profile mismatch; reset with the selected profile');
    const h = { ...previous }, s = { ...source };
    const road = surface(world, source), blend = 1 - Math.exp(-dt / profile.surfaceResponseSeconds);
    h.gripMultiplier += (road.grip - h.gripMultiplier) * blend;
    h.surfaceSpeedMultiplier += (road.speed - h.surfaceSpeedMultiplier) * blend;
    h.surfaceResistanceMultiplier += (road.resistance - h.surfaceResistanceMultiplier) * blend;
    s.railContactTime = Math.max(0, s.railContactTime - dt);
    s.impactRecovery = Math.max(0, s.impactRecovery - dt);
    s.impactYawRate *= Math.exp(-6 * dt); s.contacts = 0;
    if (activateBoost) s.boostTime = geometry.boostDuration;
    const boosting = s.boostTime > 0;
    s.boostTime = Math.max(0, s.boostTime - dt);
    // A held Boost is still an accelerator, but a released pedal can now slow
    // the kart even while the granted boost timer has not expired.
    const throttle = input.throttle ?? 0, requested = input.boost && throttle >= 0 ? 1 : throttle;
    const brake = Math.max(Number(Boolean(input.brake)), input.brakeAmount ?? 0);
    const desiredThrottle = brake > 0 ? 0 : requested;
    const throttleTime = Math.abs(desiredThrottle) > Math.abs(h.throttle) && desiredThrottle * h.throttle >= 0 ? profile.throttleRiseSeconds : profile.throttleReleaseSeconds;
    h.throttle = approach(h.throttle, desiredThrottle, dt / throttleTime);
    h.brake = approach(h.brake, brake, dt / (brake > h.brake ? profile.brakeRiseSeconds : profile.brakeReleaseSeconds));
    const liftTarget = requested === 0 && brake === 0 ? 1 : 0;
    h.lift = approach(h.lift, liftTarget, dt / (liftTarget > h.lift ? profile.liftRiseSeconds : profile.liftReleaseSeconds));
    const steer = input.steer ?? 0;
    const steeringTime = steer * h.steerInput >= 0 && Math.abs(steer) > Math.abs(h.steerInput) ? profile.steeringRiseSeconds : profile.steeringReleaseSeconds;
    // Countersteering first returns through centre, then builds the other way.
    if (steer * h.steerInput < 0) h.steerInput = approach(h.steerInput, 0, dt / profile.steeringReleaseSeconds);
    else h.steerInput = approach(h.steerInput, steer, dt / steeringTime);
    const sin = Math.sin(source.yaw), cos = Math.cos(source.yaw);
    const vx0 = sin * source.speed + cos * source.lateralSpeed, vz0 = cos * source.speed - sin * source.lateralSpeed;
    const v = Math.hypot(vx0, vz0), direction = source.speed < -.001 ? -1 : source.speed > .001 ? 1 : Math.sign(h.throttle) || 1;
    h.steeringLimit = steeringLimit(profile, v, geometry.wheelbase, h.gripMultiplier);
    s.steering = h.steerInput * h.steeringLimit;
    const turnSpeed = s.railContactTime > 0 && requested > 0 ? Math.max(source.speed, 2) : source.speed;
    const yawTarget = source.grounded ? -turnSpeed / geometry.wheelbase * Math.tan(s.steering) : 0;
    const requestedYaw = h.yawRate + (yawTarget - h.yawRate) * (1 - Math.exp(-dt / profile.yawResponseSeconds));
    h.yawRate = source.grounded ? approach(h.yawRate, requestedYaw, profile.yawAcceleration * dt) : 0;
    const yawDelta = (h.yawRate + s.impactYawRate) * dt;
    const midYaw = source.yaw + yawDelta / 2;
    s.yaw += yawDelta;
    let heading = v > 1e-8 ? Math.atan2(vx0, vz0) : midYaw + (direction < 0 ? Math.PI : 0);
    const alignment = Math.cos(heading - midYaw), sideways = v * Math.sin(heading - midYaw);
    const lateralLimit = Math.max(1e-9, sampleCurve(profile.cornering, v) * h.gripMultiplier);
    const longitudinalLimit = Math.max(1e-9, sampleCurve(profile.braking, v) * h.gripMultiplier);
    const cap = (direction < 0 ? profile.reverseSpeed : boosting ? profile.boostSpeed : profile.topSpeed) * h.surfaceSpeedMultiplier;
    const opposing = h.throttle * direction < -.001;
    let engine = Math.abs(h.throttle) * (direction < 0 ? profile.reverseAcceleration : sampleCurve(boosting ? profile.boostAcceleration : profile.acceleration, v));
    if (opposing || v >= cap || s.impactRecovery > 0 || brake > 0) engine = 0;
    h.driveAcceleration = approach(h.driveAcceleration, engine, profile.driveJerk * dt);
    if (engine === 0 && (v >= cap || brake > 0 || opposing || s.impactRecovery > 0)) h.driveAcceleration = 0;
    const service = longitudinalLimit * profile.brakeStrength * Math.max(h.brake, opposing ? Math.abs(h.throttle) : 0);
    const coast = (profile.coastConstant + profile.coastQuadratic * v * v) * h.surfaceResistanceMultiplier * (1 - Math.abs(h.throttle));
    const lift = sampleCurve(profile.liftOff, v) * h.lift * profile.liftStrength;
    const recoveryTarget = v > cap + 1e-8 ? profile.boostRecoveryDeceleration : 0;
    h.recoveryDeceleration = approach(h.recoveryDeceleration, recoveryTarget, profile.boostRecoveryDeceleration * dt / profile.boostRecoverySeconds);
    const recovery = Math.min(h.recoveryDeceleration, Math.max(0, v - cap) / dt);
    let normal = v * h.yawRate - sideways * direction / profile.slipResponseSeconds;
    const slipDrag = Math.min(lateralLimit, Math.abs(sideways) / profile.slipResponseSeconds) * Math.abs(Math.sin(heading - midYaw));
    let drive = h.driveAcceleration * Math.max(0, direction * alignment);
    const sidewaysUse = Math.min(1, Math.abs(normal) / lateralLimit);
    const availableDrive = longitudinalLimit * Math.sqrt(Math.max(0, 1 - sidewaysUse * sidewaysUse));
    drive -= Math.max(0, drive - availableDrive) * profile.tractionAssistance;
    let tangential = drive - Math.max(service, lift + coast, recovery) - slipDrag;
    if (s.impactRecovery > 0) tangential = Math.min(tangential, -6 * v);
    const requestedUtilization = Math.hypot(tangential / longitudinalLimit, normal / lateralLimit);
    const scale = 1 / Math.max(1, requestedUtilization);
    tangential *= scale; normal *= scale;
    if (!source.grounded) { tangential = normal = 0; }
    // Integrate speed and travel direction separately: a perpendicular tire
    // force changes direction without inventing kinetic energy on each tick.
    let nextSpeed = Math.max(0, v + tangential * dt);
    if (engine > 0 && v <= cap) nextSpeed = Math.min(cap, nextSpeed);
    const midSpeed = (v + nextSpeed) / 2;
    if (midSpeed > .01) heading += normal / midSpeed * dt;
    if (nextSpeed < 1e-10) nextSpeed = 0;
    const vx = Math.sin(heading) * nextSpeed, vz = Math.cos(heading) * nextSpeed;
    h.longitudinalLimit = longitudinalLimit; h.lateralLimit = lateralLimit;
    h.acceleration = (nextSpeed - v) / dt;
    h.brakingG = Math.max(0, -h.acceleration) / STANDARD_GRAVITY;
    h.lateralG = Math.abs(normal) / STANDARD_GRAVITY;
    h.slipAngle = nextSpeed > .1 ? Math.atan2(Math.sin(heading - s.yaw) * direction, Math.cos(heading - s.yaw) * direction) : 0;
    const slipTarget = clamp(Math.max(0, requestedUtilization - 1) + Math.abs(h.slipAngle), 0, 10);
    h.tireSlip += (slipTarget - h.tireSlip) * (1 - Math.exp(-dt / profile.slipResponseSeconds));
    h.tireUtilization = source.grounded ? Math.min(1, requestedUtilization) : 0;
    for (const [key, value] of Object.entries(h)) if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('Nonfinite handling ' + key);
    s.handling = Object.freeze(h);
    return Object.freeze({ state: Object.freeze(s), vx, vz });
}
