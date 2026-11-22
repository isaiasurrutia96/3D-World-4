import { STANDARD_GRAVITY } from './profiles.ts';

// FIA 2026 Technical Regulations issue 21, C3.10/C3.11 and C5.2.7–12.
// See docs/karts/F1-DRIVING-REFERENCE.md for telemetry and setup sources.
export const F1_2026_SYSTEMS = Object.freeze({
    massKg: 772,
    frontWeightFraction: .45,
    energyCapacityJ: 4_000_000,
    motorPowerLimitW: 350_000,
    motorTorqueLimitNm: 500,
    aeroTransitionSeconds: .4,
    engineRpmLimit: 15_000,
});

const reference = F1_2026_SYSTEMS;
// Use the FIA power-limited-sector ceiling for routine deployment on the test
// courses. Overtake is a driver command with the C5.2.8(ii) speed curve.
const routinePowerLimitW = 250_000;
const deploymentMinimumKph = 50;
// FIA's published 2026 ICE power target anchors the routine power split.
const combustionReferencePowerW = 400_000;

const airDensity = 1.225;
// Effective areas tuned for Classic Formula. Only the differences between modes
// enter the driving solver, whose acceleration and cornering data are already
// calibrated to straight-line and cornering observations, respectively.
const straightDragArea = .5;
const cornerDragAreaDifference = .2;
const cornerDownforceAreaDifference = .5;
const referencePressure = .5 * airDensity * (250 / 3.6) ** 2;
const weight = reference.massKg * STANDARD_GRAVITY;
const cornerDownforceArea = weight * (4.65 / 1.43 - 1) / referencePressure;

// First upshift estimated from Russell's 113–134 km/h race-start sample bracket.
// Remaining upshifts and downshifts are telemetry medians. The 8→7 threshold
// uses the 7→6 band's width because the sampled 8→7 shift was discontinuous.
const upshiftKph = [124, 157, 184, 212, 239, 269, 304] as const;
const downshiftKph = [99, 129, 155, 193, 206, 234, 269] as const;
const shiftRpm = [11395, 11009, 11615, 11451, 10878, 10708, 11104] as const;
const rpmPerKph = [...upshiftKph.map((speed, i) => shiftRpm[i] / speed), 34.4];
const idleRpm = 4035;

export type F12026SystemState = Readonly<{
    energyJ: number;
    deploymentPowerW: number;
    recoveryPowerW: number;
    aeroOpening: number;
    gear: number;
    rpm: number;
}>;

type F12026Inputs = Readonly<{
    dt: number;
    speed: number;
    throttle: number;
    brake: number;
    steer: number;
    overtake: boolean;
    grounded: boolean;
    reverse: boolean;
    coasting: boolean;
    driveEnabled?: boolean;
    baselineDriveAcceleration: number;
}>;

type F12026Preparation = Readonly<{
    aeroOpening: number;
    gripMultiplier: number;
    dragAcceleration: number;
    deploymentAccelerationDelta: number;
    deploymentPowerW: number;
    canRecover: boolean;
    gear: number;
    rpm: number;
}>;

type F12026Motion = Readonly<{
    dt: number;
    speed: number;
    nextSpeed: number;
    grounded: boolean;
    poweredAcceleration: number;
    maintainingSpeed?: boolean;
    rearLoadFraction?: number;
    recoverableDeceleration?: number;
}>;

export function initialF12026Systems(): F12026SystemState {
    return Object.freeze({
        energyJ: reference.energyCapacityJ, deploymentPowerW: 0, recoveryPowerW: 0,
        aeroOpening: 0, gear: 1, rpm: idleRpm,
    });
}

/** FIA positive electrical DC power envelope. Speed is in m/s. */
export function electricalPowerLimitW(speed: number, overtake: boolean): number {
    const kph = speed * 3.6;
    const limitKw = overtake ? 7100 - 20 * kph : kph < 340 ? 1800 - 5 * kph : 6900 - 20 * kph;
    return Math.min(reference.motorPowerLimitW, Math.max(0, limitKw * 1000));
}

function automaticGear(previousGear: number, speedKph: number, reverse: boolean): number {
    if (reverse) return -1;
    let gear = Math.max(1, previousGear);
    while (gear <= upshiftKph.length && speedKph >= upshiftKph[gear - 1]) gear++;
    while (gear > 1 && speedKph < downshiftKph[gear - 2]) gear--;
    return gear;
}

function motorTorquePowerLimitW(rpm: number): number {
    return reference.motorTorqueLimitNm * rpm * (Math.PI / 30);
}

const dynamicPressure = (speed: number) => .5 * airDensity * speed * speed;

/** Calculate power and aero inputs to the tire solver. Account for delivery after it resolves grip. */
export function prepareF12026Systems(previous: F12026SystemState, input: F12026Inputs): F12026Preparation {
    const { dt, speed, throttle, brake, steer, overtake, grounded, reverse, coasting, driveEnabled = true, baselineDriveAcceleration } = input;
    const speedKph = speed * 3.6;
    const gear = automaticGear(previous.gear, speedKph, reverse);
    const rpm = Math.min(reference.engineRpmLimit, Math.max(idleRpm, speedKph * rpmPerKph[Math.max(0, gear - 1)]));
    const fastEnough = speedKph >= deploymentMinimumKph;
    // Standalone test tracks use the driver's straight-line commands as the
    // eligibility signal. Actual F1 uses designated deployment zones.
    const straight = grounded && !reverse && fastEnough && throttle >= .95 && brake === 0 && Math.abs(steer) <= .05;
    const travel = dt / reference.aeroTransitionSeconds;
    const aeroOpening = straight ? Math.min(1, previous.aeroOpening + travel) : Math.max(0, previous.aeroOpening - travel);
    const pressure = dynamicPressure(speed);
    const gripMultiplier = 1 - aeroOpening * pressure * cornerDownforceAreaDifference / (weight + pressure * cornerDownforceArea);
    const dragAcceleration = (1 - aeroOpening) * pressure * cornerDragAreaDifference / reference.massKg;

    let deploymentPowerW = 0, deploymentAccelerationDelta = 0;
    const canDrive = driveEnabled && grounded && !reverse && fastEnough && throttle > 0 && brake === 0;
    if (canDrive) {
        const torqueLimit = motorTorquePowerLimitW(rpm);
        const normalLimit = Math.min(routinePowerLimitW, electricalPowerLimitW(speed, false), torqueLimit);
        // The net launch curve already includes routine assist and straight-line
        // drag. Estimate the assist using wheel work before straight-line drag,
        // then pass only a signed acceleration difference to the solver.
        const demandedPower = (baselineDriveAcceleration * reference.massKg + pressure * straightDragArea) * speed * throttle;
        const routinePower = Math.min(normalLimit, demandedPower * normalLimit / (combustionReferencePowerW + normalLimit));
        const desiredPower = overtake ? Math.min(electricalPowerLimitW(speed, true), torqueLimit) * throttle : routinePower;
        deploymentPowerW = Math.min(desiredPower, previous.energyJ / dt);
        deploymentAccelerationDelta = (deploymentPowerW - routinePower) / (reference.massKg * speed);
    }
    return {
        aeroOpening, gripMultiplier, dragAcceleration, deploymentAccelerationDelta, deploymentPowerW,
        canRecover: grounded && !reverse && (brake > 0 || coasting), gear, rpm,
    };
}

export function finishF12026Systems(previous: F12026SystemState, step: F12026Preparation, motion: F12026Motion): F12026SystemState {
    const { dt, speed, nextSpeed, grounded, poweredAcceleration } = motion;
    const averageSpeed = (speed + nextSpeed) / 2;
    const straightDragForce = dynamicPressure(averageSpeed) * straightDragArea;
    const positiveWorkPower = poweredAcceleration > 0 || motion.maintainingSpeed
        ? (reference.massKg * poweredAcceleration + straightDragForce) * averageSpeed : 0;
    const deploymentPowerW = grounded ? Math.min(step.deploymentPowerW, positiveWorkPower) : 0;

    let recoveryPowerW = 0;
    if (grounded && step.canRecover && deploymentPowerW === 0 && nextSpeed < speed) {
        const kineticLossPower = .5 * reference.massKg * (speed * speed - nextSpeed * nextSpeed) / dt;
        const dragPower = (straightDragForce + reference.massKg * step.dragAcceleration) * averageSpeed;
        const rearLoadFraction = motion.rearLoadFraction ?? (1 - reference.frontWeightFraction);
        const decelerationPower = (motion.recoverableDeceleration ?? Infinity) * reference.massKg * averageSpeed;
        const availablePower = Math.max(0, Math.min(kineticLossPower - dragPower, decelerationPower)) * rearLoadFraction;
        recoveryPowerW = Math.min(reference.motorPowerLimitW, motorTorquePowerLimitW(step.rpm), availablePower,
            (reference.energyCapacityJ - previous.energyJ) / dt);
    }
    const energyJ = Math.max(0, Math.min(reference.energyCapacityJ, previous.energyJ + (recoveryPowerW - deploymentPowerW) * dt));
    return Object.freeze({ energyJ, deploymentPowerW, recoveryPowerW, aeroOpening: step.aeroOpening, gear: step.gear, rpm: step.rpm });
}
