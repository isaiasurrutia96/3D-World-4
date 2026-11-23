/** Six-speed rear-drive GT3 systems for the fixed-step tire model. */
import { STANDARD_GRAVITY } from './profiles.ts';
import type { Gt3Balance } from './profiles.ts';

// 2026 Porsche 911 GT3 R technical data, in metres.
export const GT3_REFERENCE_WHEELBASE = 2.507;

// The 2026 911 GT3 R data sheet gives six forward ratios and a 9,250-rpm
// maximum. The ratios themselves and torque cut are prototype estimates.
const rpmLimit = 9_250;
const idleRpm = 1_750;
const shiftRpm = 9_050;
const shiftSeconds = .06;
const downshiftFraction = .92;
const referenceRadius = .365;
const kmhAtShiftRpm = [105, 142, 179, 215, 250, 289] as const;
const ratios = kmhAtShiftRpm.map(kmh => shiftRpm * (2 * Math.PI / 60) * referenceRadius / (kmh / 3.6));
const reverseRatio = ratios[0] * 1.15;

export type Gt3SystemState = Readonly<{
    gear: number;
    rpm: number;
    shiftRemainingSeconds: number;
    /** Fraction of the requested braking or drive force removed. */
    absIntervention: number;
    tractionIntervention: number;
    frontWeightFraction: number;
}>;

const wheelRpmAtSpeed = (speed: number, radius: number) => speed / radius * (60 / (2 * Math.PI));
const engineRpm = (gear: number, wheelRpm: number) =>
    Math.min(rpmLimit, Math.max(idleRpm, wheelRpm * (gear === -1 ? reverseRatio : ratios[gear - 1])));

function forwardGear(previousGear: number, wheelRpm: number): number {
    let gear = Math.max(1, previousGear);
    while (gear < ratios.length && wheelRpm * ratios[gear - 1] >= shiftRpm) gear++;
    while (gear > 1 && wheelRpm * ratios[gear - 2] < shiftRpm * downshiftFraction) gear--;
    return gear;
}

export function initialGt3Systems(balance: Gt3Balance, speed = 0, wheelRadius = referenceRadius): Gt3SystemState {
    const wheelRpm = wheelRpmAtSpeed(Math.abs(speed), wheelRadius);
    const gear = speed < 0 ? -1 : forwardGear(1, wheelRpm);
    return Object.freeze({
        gear, rpm: engineRpm(gear, wheelRpm), shiftRemainingSeconds: 0,
        absIntervention: 0, tractionIntervention: 0, frontWeightFraction: balance.frontWeightFraction,
    });
}

/** Maximum ground speed at engine redline in top gear or reverse, in m/s. */
export function gt3MechanicalSpeedLimit(wheelRadius: number, reverse: boolean): number {
    const ratio = reverse ? reverseRatio : ratios[ratios.length - 1];
    return rpmLimit / ratio * (2 * Math.PI / 60) * wheelRadius;
}

export function stepGt3Gear(previous: Gt3SystemState, speed: number, wheelRadius: number, reverse: boolean, dt: number) {
    const wheelRpm = wheelRpmAtSpeed(speed, wheelRadius);
    if (reverse) {
        return { gear: -1, rpm: engineRpm(-1, wheelRpm), shiftRemainingSeconds: 0, driveMultiplier: 1 };
    }
    const gear = forwardGear(previous.gear, wheelRpm);
    const shiftingUp = previous.gear > 0 && gear === previous.gear + 1;
    const shiftRemainingSeconds = shiftingUp ? shiftSeconds : Math.max(0, previous.shiftRemainingSeconds - dt);
    return {
        gear, rpm: engineRpm(gear, wheelRpm), shiftRemainingSeconds,
        driveMultiplier: 1 - .75 * shiftRemainingSeconds / shiftSeconds,
    };
}

/** Static balance shifted by longitudinal load transfer, as a share of total contact load. */
export function gt3FrontLoad(balance: Gt3Balance, acceleration: number, wheelbase: number, normalLoadScale: number): number {
    const transfer = acceleration * balance.centerOfGravityHeight / (STANDARD_GRAVITY * wheelbase * normalLoadScale);
    return Math.max(0, Math.min(1, balance.frontWeightFraction - transfer));
}

// Large brake requests can exceed the tire limit. The extra pressure comes
// in at the end of pedal travel so partial braking remains easy to meter.
export function gt3BrakeDemand(maximum: number, pedal: number): number {
    return maximum * pedal * (1 + .35 * pedal * pedal);
}

type Gt3TireDemand = Readonly<{
    lateral: number;
    service: number;
    drive: number;
    lateralLimit: number;
    longitudinalLimit: number;
    frontWeightFraction: number;
    frontBrakeBias: number;
    tractionAssistance: number;
}>;

// Match the linear demand at the bottom of the transition and a hard cap at
// the top. The quadratic connects them with continuous force and slope.
function limitedForce(demand: number, capacity: number, transition: number): number {
    const width = capacity * transition;
    if (width === 0) return Math.min(demand, capacity);
    if (demand <= capacity - width) return demand;
    if (demand >= capacity + width) return capacity;
    const remaining = capacity + width - demand;
    return capacity - remaining * remaining / (4 * width);
}

/** Allocate the shared tire ellipse to steering, rear drive and both brake circuits. */
export function resolveGt3TireDemand(input: Gt3TireDemand) {
    const { service, drive, lateralLimit, longitudinalLimit, frontWeightFraction, frontBrakeBias } = input;
    // Allocate steering and service braking together. Unconstrained lateral
    // demand alone would assign zero capacity to ABS under tight turn-in.
    const brakeProjection = service > 0 ? Math.max(1, Math.hypot(input.lateral / lateralLimit, service / longitudinalLimit)) : 1;
    const lateral = input.lateral / brakeProjection;
    const lateralUse = Math.min(1, Math.abs(lateral) / lateralLimit);
    const remaining = longitudinalLimit * Math.sqrt(Math.max(0, 1 - lateralUse * lateralUse));
    const frontCapacity = remaining * frontWeightFraction;
    const rearCapacity = remaining - frontCapacity;
    const frontService = limitedForce(service * frontBrakeBias, frontCapacity, .05);
    const rearService = limitedForce(service * (1 - frontBrakeBias), rearCapacity, .05);
    const appliedService = frontService + rearService;
    const appliedDrive = limitedForce(drive, rearCapacity, .15 * input.tractionAssistance);
    return {
        lateral, service: appliedService, drive: appliedDrive,
        absIntervention: service > 0 ? Math.max(0, 1 - appliedService / service) : 0,
        tractionIntervention: drive > 0 && input.tractionAssistance > 0 ? Math.max(0, 1 - appliedDrive / drive) : 0,
    };
}
