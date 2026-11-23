import { createHandlingProfile, STANDARD_GRAVITY } from './profiles.ts';
import type { Curve } from './profiles.ts';

const inMetresPerSecond = (points: Curve): Curve => points.map(([speed, value]) => [speed / 3.6, value]);
const topSpeed = 286 / 3.6;

// Standing-start and rolling pace are calibration targets. The latter is
// corroborated by a simulator lap, since Porsche does not publish a 992 trace.
const acceleration = inMetresPerSecond([
    [0, 7.1], [42, 7.8], [65, 7.85], [100, 5.9], [130, 5.25], [150, 4.1],
    [175, 2.98], [200, 2.45], [230, 1.55], [260, .8], [286, .32],
]);

/** GT kart calibration and source limits are in docs/karts/GT3-DRIVING-REFERENCE.md. */
export const GT3_PROFILE = createHandlingProfile({
    id: 'gt3', label: 'GT3 Race', grandTouring: 'gt3',
    // A prototype governor within the Daytona race envelope. The GT3
    // powertrain uses the same acceleration and limit regardless of boost.
    topSpeed, boostSpeed: topSpeed,
    reverseSpeed: 5, reverseAcceleration: 3,
    acceleration, boostAcceleration: acceleration,
    brakeStrength: 1,
    // The axle model shares this longitudinal tire budget between service
    // braking and steering as the kart approaches the limit.
    braking: inMetresPerSecond([
        [0, 1.25], [70, 1.39], [120, 1.55], [170, 1.75], [210, 1.96], [250, 2.11], [286, 2.21],
    ]).map(([speed, decelerationG]) => [speed, decelerationG * STANDARD_GRAVITY]),
    // Logged GT3 laps support 1.65 g at 120 km/h and stronger grip in fast turns.
    cornering: inMetresPerSecond([
        [0, 1.32], [50, 1.32], [90, 1.49], [120, 1.65], [155, 1.77],
        [190, 1.96], [240, 2.25], [286, 2.40],
    ]).map(([speed, gripG]) => [speed, gripG * STANDARD_GRAVITY]),
    liftOff: inMetresPerSecond([
        [0, 0], [15, .22], [50, .55], [100, 1.08], [150, 1.55], [200, 2.15],
        [250, 2.75], [286, 3.15],
    ]),
    coastConstant: .17, coastQuadratic: .00037,
    liftStrength: 1, liftRiseSeconds: .27, liftReleaseSeconds: .13,
    throttleRiseSeconds: .19, throttleReleaseSeconds: .12,
    brakeRiseSeconds: .13, brakeReleaseSeconds: .10,
    steeringLock: 29 * Math.PI / 180,
    steeringResponse: { lowSpeedRiseSeconds: .31, lowSpeedExponent: 1.12, blendStart: 7, blendEnd: 23 },
    steeringRiseSeconds: .26, steeringReleaseSeconds: .20,
    // Complete the speed-based limit before the 2.10 m chassis reaches the
    // dry tire limit under full steering lock.
    steeringBlendStart: 3, steeringBlendEnd: 6.9,
    yawResponseSeconds: .17, yawAcceleration: 7, slipResponseSeconds: .20,
    tractionAssistance: .56, surfaceResponseSeconds: .15,
    // Recover gently when crossing onto a lower-speed surface.
    boostRecoveryDeceleration: 2.5, boostRecoverySeconds: .22,
    driveJerk: 65,
});
