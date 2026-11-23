/** Force-limited handling within the existing fixed-step/contact pipeline. No renderer. */
import type { KartState, KartInput, KartMotion, SurfaceWorld } from './index.ts';
import { sampleCurve, steeringLimit, steeringResponse, STANDARD_GRAVITY } from './profiles.ts';
import type { HandlingProfile } from './profiles.ts';
import { F1_2026_SYSTEMS, initialF12026Systems, prepareF12026Systems, finishF12026Systems } from './f1-2026-systems.ts';
import type { F12026SystemState } from './f1-2026-systems.ts';
import { GT3_REFERENCE_WHEELBASE, gt3BrakeDemand, gt3FrontLoad, gt3MechanicalSpeedLimit, initialGt3Systems, resolveGt3TireDemand, stepGt3Gear } from './gt3-systems.ts';
import type { Gt3SystemState } from './gt3-systems.ts';
export type SurfaceSample = Readonly<{ grip?: number; speed?: number; resistance?: number }>;
export type HandlingState = Readonly<{
    fingerprint: string;
    throttle: number; brake: number; lift: number; steerInput: number; yawRate: number;
    driveAcceleration: number; recoveryDeceleration: number;
    gripMultiplier: number; surfaceSpeedMultiplier: number; surfaceResistanceMultiplier: number;
    longitudinalLimit: number; lateralLimit: number;
    acceleration: number; brakingG: number; lateralG: number; tireSlip: number;
    slipAngle: number; tireUtilization: number; steeringLimit: number;
    formula?: F12026SystemState & Readonly<{ frontWeightFraction: number }>;
    gt3?: Gt3SystemState;
}>;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const approach = (n: number, target: number, amount: number) => n < target ? Math.min(target, n + amount) : Math.max(target, n - amount);
// The Classic Formula hip height is a proxy for the prototype's CG height.
// The full-size car's actual CG height and suspension settings are team data.
const FORMULA_CG_HEIGHT = .29;
export function initialHandling(profile: HandlingProfile, speed: number, wheelRadius: number): HandlingState {
    return Object.freeze({ fingerprint: profile.fingerprint, throttle: 0, brake: 0, lift: 0, steerInput: 0, yawRate: 0, driveAcceleration: 0, recoveryDeceleration: 0, gripMultiplier: 1, surfaceSpeedMultiplier: 1, surfaceResistanceMultiplier: 1, longitudinalLimit: 0, lateralLimit: 0, acceleration: 0, brakingG: 0, lateralG: 0, tireSlip: 0, slipAngle: 0, tireUtilization: 0, steeringLimit: profile.steeringLock,
        ...(profile.formula === '2026' ? { formula: Object.freeze({ ...initialF12026Systems(), frontWeightFraction: F1_2026_SYSTEMS.frontWeightFraction }) } : {}),
        ...(profile.gt3Balance ? { gt3: initialGt3Systems(profile.gt3Balance, speed, wheelRadius) } : {}),
    });
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
export function prepareTunedStep(source: KartState, input: KartInput, activateBoost: boolean, profile: HandlingProfile, world: SurfaceWorld | undefined, geometry: Readonly<{ step: number; wheelbase: number; wheelRadius: number; boostDuration: number }>): KartMotion {
    const dt = geometry.step, previous = source.handling ?? initialHandling(profile, source.speed, geometry.wheelRadius);
    if (previous.fingerprint !== profile.fingerprint) throw new Error('Kart state/profile mismatch; reset with the selected profile');
    const h = { ...previous }, s = { ...source };
    const gt3Balance = profile.gt3Balance;
    const road = surface(world, source), blend = 1 - Math.exp(-dt / profile.surfaceResponseSeconds);
    h.gripMultiplier += (road.grip - h.gripMultiplier) * blend;
    h.surfaceSpeedMultiplier += (road.speed - h.surfaceSpeedMultiplier) * blend;
    h.surfaceResistanceMultiplier += (road.resistance - h.surfaceResistanceMultiplier) * blend;
    s.railContactTime = Math.max(0, s.railContactTime - dt);
    s.impactRecovery = Math.max(0, s.impactRecovery - dt);
    s.impactYawRate *= Math.exp(-6 * dt); s.contacts = 0;
    if (gt3Balance) s.boostTime = 0;
    else if (activateBoost) s.boostTime = geometry.boostDuration;
    const boosting = s.boostTime > 0;
    s.boostTime = Math.max(0, s.boostTime - dt);
    // A held Boost is still an accelerator, but a released pedal can now slow
    // the kart even while the granted boost timer has not expired.
    const throttle = input.throttle ?? 0, requested = !gt3Balance && input.boost && throttle >= 0 ? 1 : throttle;
    const movingDirection = source.speed < -.001 ? -1 : source.speed > .001 ? 1 : 0;
    const explicitBrake = Math.max(Number(Boolean(input.brake)), input.brakeAmount ?? 0);
    // Brake/Reverse is an opposing pedal command while the GT3 is moving.
    // Use the service brake immediately, without waiting for gas to decay.
    const opposingBrake = gt3Balance && movingDirection * requested < 0 ? Math.abs(requested) : 0;
    const brake = explicitBrake || opposingBrake;
    const desiredThrottle = brake > 0 ? 0 : requested;
    const throttleTime = Math.abs(desiredThrottle) > Math.abs(h.throttle) && desiredThrottle * h.throttle >= 0 ? profile.throttleRiseSeconds : profile.throttleReleaseSeconds;
    h.throttle = approach(h.throttle, desiredThrottle, dt / throttleTime);
    h.brake = approach(h.brake, brake, dt / (brake > h.brake ? profile.brakeRiseSeconds : profile.brakeReleaseSeconds));
    const liftTarget = requested === 0 && brake === 0 ? 1 : 0;
    h.lift = approach(h.lift, liftTarget, dt / (liftTarget > h.lift ? profile.liftRiseSeconds : profile.liftReleaseSeconds));
    const sin = Math.sin(source.yaw), cos = Math.cos(source.yaw);
    const vx0 = sin * source.speed + cos * source.lateralSpeed, vz0 = cos * source.speed - sin * source.lateralSpeed;
    const v = Math.hypot(vx0, vz0);
    // At rest, a direction change must not reapply the old filtered throttle.
    const direction = movingDirection || (gt3Balance ? Math.sign(desiredThrottle) : 0) || Math.sign(h.throttle) || 1;
    const response = steeringResponse(profile, v);
    const steer = input.steer ?? 0;
    const opposing = h.throttle * direction < -.001;
    const formula = previous.formula;
    const gt3Gear = previous.gt3 && stepGt3Gear(previous.gt3, Math.abs(source.speed), geometry.wheelRadius, direction < 0, dt);
    const profileCap = (direction < 0 ? profile.reverseSpeed : boosting ? profile.boostSpeed : profile.topSpeed) * h.surfaceSpeedMultiplier;
    const cap = gt3Balance ? Math.min(profileCap, gt3MechanicalSpeedLimit(geometry.wheelRadius, direction < 0)) : profileCap;
    // The Formula powertrain can sustain road speed at the governor. Its
    // electrical work there pays for aerodynamic drag even at zero net acceleration.
    const atFormulaCap = Boolean(formula && direction > 0 && Math.abs(v - cap) <= 1e-8);
    const powered = !opposing && (v < cap || atFormulaCap) && s.impactRecovery <= 0 && brake === 0;
    const driveDemand = direction < 0 ? profile.reverseAcceleration
        : sampleCurve(boosting && !formula ? profile.boostAcceleration : profile.acceleration, v);
    const systemsGrounded = source.grounded && s.impactRecovery <= 0;
    const systems = formula && prepareF12026Systems(formula, {
        dt, speed: v, throttle: Math.max(0, h.throttle), brake: Math.max(brake, h.brake),
        steer, overtake: boosting, grounded: systemsGrounded, reverse: direction < 0,
        coasting: requested === 0, driveEnabled: powered,
        baselineDriveAcceleration: driveDemand,
    });
    const effectiveGrip = h.gripMultiplier * (systems?.gripMultiplier ?? 1);
    const steeringTime = steer * h.steerInput >= 0 && Math.abs(steer) > Math.abs(h.steerInput) ? response.riseSeconds : profile.steeringReleaseSeconds;
    // Countersteering first returns through centre, then builds the other way.
    if (steer * h.steerInput < 0) h.steerInput = approach(h.steerInput, 0, dt / profile.steeringReleaseSeconds);
    else h.steerInput = approach(h.steerInput, steer, dt / steeringTime);
    h.steeringLimit = steeringLimit(profile, v, geometry.wheelbase, effectiveGrip);
    // Shape small corrections gently at low speed. A sustained full input
    // still reaches the existing limit, including the approved high-speed grip.
    const demand = response.exponent===1 ? h.steerInput : Math.sign(h.steerInput)*Math.pow(Math.abs(h.steerInput),response.exponent);
    s.steering = demand * h.steeringLimit;
    const turnSpeed = s.railContactTime > 0 && requested > 0 && !opposingBrake ? Math.max(source.speed, 2) : source.speed;
    const yawTarget = source.grounded ? -turnSpeed / geometry.wheelbase * Math.tan(s.steering) : 0;
    // Scale the GT3 yaw transient by distance in wheelbases at equal speed.
    // The steering and tire-force limits set the available turn.
    const yawTimeScale = gt3Balance ? geometry.wheelbase / GT3_REFERENCE_WHEELBASE : 1;
    const yawResponseSeconds = profile.yawResponseSeconds * yawTimeScale;
    const requestedYaw = h.yawRate + (yawTarget - h.yawRate) * (1 - Math.exp(-dt / yawResponseSeconds));
    h.yawRate = source.grounded ? approach(h.yawRate, requestedYaw, profile.yawAcceleration * dt / yawTimeScale) : 0;
    const yawDelta = (h.yawRate + s.impactYawRate) * dt;
    const midYaw = source.yaw + yawDelta / 2;
    s.yaw += yawDelta;
    let heading = v > 1e-8 ? Math.atan2(vx0, vz0) : midYaw + (direction < 0 ? Math.PI : 0);
    const alignment = Math.cos(heading - midYaw), sideways = v * Math.sin(heading - midYaw);
    const nominalLateral = sampleCurve(profile.cornering, v);
    const lateralLimit = Math.max(1e-9, nominalLateral * effectiveGrip);
    const longitudinalLimit = Math.max(1e-9, sampleCurve(profile.braking, v) * effectiveGrip);
    let engine = powered ? Math.abs(h.throttle) * driveDemand : 0;
    if (systems && powered && direction > 0) {
        engine += systems.deploymentAccelerationDelta - systems.dragAcceleration * Math.max(0, h.throttle);
    }
    if (gt3Gear) engine *= gt3Gear.driveMultiplier;
    h.driveAcceleration = approach(h.driveAcceleration, engine, profile.driveJerk * dt);
    if (engine === 0 && (v >= cap || brake > 0 || opposing || s.impactRecovery > 0)) h.driveAcceleration = 0;
    const brakePedal = Math.max(h.brake, opposing ? Math.abs(h.throttle) : 0);
    const brakeCapacity = longitudinalLimit * profile.brakeStrength;
    let service = gt3Balance ? gt3BrakeDemand(brakeCapacity, brakePedal) : brakeCapacity * brakePedal;
    const lift = sampleCurve(profile.liftOff, v) * h.lift * profile.liftStrength;
    const recoveryTarget = v > cap + 1e-8 ? profile.boostRecoveryDeceleration : 0;
    h.recoveryDeceleration = approach(h.recoveryDeceleration, recoveryTarget, profile.boostRecoveryDeceleration * dt / profile.boostRecoverySeconds);
    const recovery = Math.min(h.recoveryDeceleration, Math.max(0, v - cap) / dt);
    let normal = v * h.yawRate - sideways * direction / profile.slipResponseSeconds;
    const slipDrag = Math.min(lateralLimit, Math.abs(sideways) / profile.slipResponseSeconds) * Math.abs(Math.sin(heading - midYaw));
    let drive = Math.max(0, h.driveAcceleration) * Math.max(0, direction * alignment);
    const staticFront = F1_2026_SYSTEMS.frontWeightFraction;
    const gt3Tires = gt3Balance && previous.gt3 && systemsGrounded && resolveGt3TireDemand({
        lateral: normal, service, drive, lateralLimit, longitudinalLimit,
        frontWeightFraction: previous.gt3.frontWeightFraction, frontBrakeBias: gt3Balance.frontBrakeBias,
        tractionAssistance: profile.tractionAssistance,
    });
    // The drive curve is net of road resistance at full power. When the
    // tires cut drive, the same fraction of that resistance is uncovered.
    const driveDelivery = gt3Tires && drive > 0 ? gt3Tires.drive / drive : 1;
    const coast = (profile.coastConstant + profile.coastQuadratic * v * v)
        * h.surfaceResistanceMultiplier * (1 - Math.abs(h.throttle) * driveDelivery);
    let driveSlip = 0;
    if (gt3Tires) {
        normal = gt3Tires.lateral;
        service = gt3Tires.service;
        drive = gt3Tires.drive;
    } else {
        const sidewaysUse = Math.min(1, Math.abs(normal) / lateralLimit);
        // Formula drive demand is fitted to static rear load.
        const rearTraction = formula ? (1 - formula.frontWeightFraction) / (1 - staticFront) : 1;
        const availableDrive = longitudinalLimit * rearTraction * Math.sqrt(Math.max(0, 1 - sidewaysUse * sidewaysUse));
        const excessDrive = Math.max(0, drive - availableDrive);
        drive -= excessDrive * (formula ? 1 : profile.tractionAssistance);
        if (formula && source.grounded) driveSlip = excessDrive / longitudinalLimit;
    }
    const powerShortfall = Math.max(0, -h.driveAcceleration);
    let tangential = drive - Math.max(service, lift + coast, recovery, powerShortfall) - slipDrag;
    if (s.impactRecovery > 0) tangential = Math.min(tangential, -6 * v);
    const requestedUtilization = Math.hypot(tangential / longitudinalLimit, normal / lateralLimit);
    const scale = 1 / Math.max(1, requestedUtilization);
    tangential *= scale; normal *= scale;
    if (!source.grounded) { tangential = normal = 0; }
    // Integrate speed and travel direction separately: a perpendicular tire
    // force changes direction without inventing kinetic energy on each tick.
    const unrestrictedSpeed = Math.max(0, v + tangential * dt);
    let nextSpeed = unrestrictedSpeed;
    if (engine > 0 && (v <= cap || atFormulaCap)) nextSpeed = Math.min(cap, nextSpeed);
    const midSpeed = (v + nextSpeed) / 2;
    if (midSpeed > .01) heading += normal / midSpeed * dt;
    if (nextSpeed < 1e-10) nextSpeed = 0;
    const vx = Math.sin(heading) * nextSpeed, vz = Math.cos(heading) * nextSpeed;
    h.longitudinalLimit = longitudinalLimit; h.lateralLimit = lateralLimit;
    h.acceleration = (nextSpeed - v) / dt;
    h.brakingG = Math.max(0, -h.acceleration) / STANDARD_GRAVITY;
    h.lateralG = Math.abs(normal) / STANDARD_GRAVITY;
    h.slipAngle = nextSpeed > .1 ? Math.atan2(Math.sin(heading - s.yaw) * direction, Math.cos(heading - s.yaw) * direction) : 0;
    const slipTarget = clamp(Math.max(0, requestedUtilization - 1) + Math.abs(h.slipAngle) + driveSlip, 0, 10);
    h.tireSlip += (slipTarget - h.tireSlip) * (1 - Math.exp(-dt / profile.slipResponseSeconds));
    h.tireUtilization = source.grounded ? Math.min(1, requestedUtilization) : 0;
    if (formula && systems) {
        const frontWeightFraction = clamp(staticFront - direction * h.acceleration * FORMULA_CG_HEIGHT / (STANDARD_GRAVITY * geometry.wheelbase), 0, 1);
        const next = finishF12026Systems(formula, systems, {
            dt, speed: v, nextSpeed, grounded: systemsGrounded,
            rearLoadFraction: 1 - frontWeightFraction,
            poweredAcceleration: powered ? Math.max(0, drive * scale - (unrestrictedSpeed - nextSpeed) / dt) : 0,
            maintainingSpeed: powered && drive > 0 && nextSpeed === cap,
            recoverableDeceleration: Math.max(service, lift) * scale,
        });
        h.formula = Object.freeze({ ...next, frontWeightFraction });
    }
    if (gt3Balance && gt3Gear) {
        // The grip curve already includes fixed aero. Its increase with speed
        // supplies a normal-load proxy for distributing that same capacity.
        const normalLoadScale = Math.max(1, nominalLateral / profile.cornering[0][1]);
        h.gt3 = Object.freeze({
            gear: gt3Gear.gear, rpm: gt3Gear.rpm, shiftRemainingSeconds: gt3Gear.shiftRemainingSeconds,
            absIntervention: gt3Tires ? gt3Tires.absIntervention : 0,
            tractionIntervention: gt3Tires ? gt3Tires.tractionIntervention : 0,
            frontWeightFraction: systemsGrounded
                ? gt3FrontLoad(gt3Balance, direction * h.acceleration, geometry.wheelbase, normalLoadScale)
                : gt3Balance.frontWeightFraction,
        });
    }
    for (const [key, value] of Object.entries(h)) if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('Nonfinite handling ' + key);
    s.handling = Object.freeze(h);
    return Object.freeze({ state: Object.freeze(s), vx, vz });
}
