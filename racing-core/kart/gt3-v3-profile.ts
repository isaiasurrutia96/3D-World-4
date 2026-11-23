import { GT3_PROFILE } from './gt3-profile.ts';
import { createHandlingProfile, STANDARD_GRAVITY } from './profiles.ts';
import type { Curve } from './profiles.ts';

const { mode, version, fingerprint, ...gt3 } = GT3_PROFILE;

// Dry grip in g, fitted to matched-speed turns on the 2.10 m chassis.
// The increase is concentrated around the Original Circuit's tightening bend.
const gripTargets: Curve = [
    [0, 1.32], [50, 1.515], [90, 1.82], [120, 1.94], [155, 2.01],
    [190, 2.07], [240, 2.25], [286, 2.40],
];

/** Steering and cornering tune for the GT3 V3 driving comparison. */
export const GT3_V3_PROFILE = createHandlingProfile({
    ...gt3,
    id: 'gt3-v3', label: 'GT3 V3',
    // Small corrections build progressively near mechanical lock. At road
    // speeds the steering takes up sooner, with a quick release for reversals.
    steeringResponse: { lowSpeedRiseSeconds: .225, lowSpeedExponent: 1.18, blendStart: 7, blendEnd: 22 },
    steeringRiseSeconds: .165,
    steeringReleaseSeconds: .09,
    yawResponseSeconds: .115,
    cornering: gripTargets.map(([kmh, grip]) => [kmh / 3.6, grip * STANDARD_GRAVITY]),
});
