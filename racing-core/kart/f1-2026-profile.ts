import { createHandlingProfile, MPH, PREVIOUS_FAST_PROFILE } from './profiles.ts';
import type { Curve } from './profiles.ts';

const { mode: _mode, version: _version, fingerprint: _fingerprint, ...earlySettings } = PREVIOUS_FAST_PROFILE;
const metresPerSecond = (curve: Curve): Curve => curve.map(([speed, value]) => [speed / 3.6, value]);
const normalCap = 338.1 / 3.6;

// A smooth fit to Russell's Monza launch speed gates. Public samples are
// about .24 s apart, so the fit avoids copying brief changes from single samples.
const raceAcceleration = metresPerSecond([
    [0, 11.12], [100, 13.62], [140, 13.77], [200, 9.51], [240, 6.6], [280, 6.6],
    [300, 2.87], [338.1, .8], [354.06, 0],
]);

// Fit full-pedal deceleration against the Brembo zones and the timing of the
// three Monza brake phases. The service fraction leaves room in the combined
// tire budget for turning and avoids constraining the measured launch.
const serviceFraction = .72;
const brakeDeceleration = metresPerSecond([
    [0, 10], [85, 12.5], [125, 15.8], [160, 15.8], [200, 21.4], [235, 34.1],
    [270, 38.1], [305, 40.8], [338.1, 43.3],
]);

/** Performance fit and trace limitations are in docs/karts/F1-DRIVING-REFERENCE.md. */
export const F1_2026_PROFILE = createHandlingProfile({
    ...earlySettings,
    id: 'f1-2026', label: '2026 F1', formula: '2026',
    // The 220 mph gameplay cap is separate from the FIA motor-power taper.
    topSpeed: normalCap, boostSpeed: 220 * MPH,
    // At the return to the normal speed cap, use the drag at that speed.
    boostRecoveryDeceleration: earlySettings.coastConstant + earlySettings.coastQuadratic * normalCap ** 2,
    acceleration: raceAcceleration,
    // Normal net acceleration includes regular deployment. The hybrid system
    // supplies the difference between ordinary power and Overtake power.
    boostAcceleration: raceAcceleration,
    brakeStrength: serviceFraction,
    braking: brakeDeceleration.map(([speed, force]) => [speed, force / serviceFraction]),
    cornering: metresPerSecond([
        [0, 14], [50, 14], [100, 20], [150, 27], [200, 35], [250, 45.6], [290, 49],
    ]),
    // Public throttle-off samples bound the response and lack a clean high-speed
    // straight-line coast trace. Aim at about .75 g settled including drag at 250 km/h.
    liftOff: metresPerSecond([
        [0, 0], [15, .4], [50, 1.2], [100, 1.6], [154, 2.2], [200, 3.5],
        [250, 5.1], [300, 5.8], [355, 6.2],
    ]),
    // With the 3.04 m wheelbase and dry grip of 14 m/s², the 30° mechanical
    // lock starts exceeding tire capacity at 8.6 m/s. Complete the blend first.
    steeringBlendStart: 0, steeringBlendEnd: 8,
});
