import { createHandlingProfile, MPH, PREVIOUS_FAST_PROFILE } from './profiles.ts';

export type PrototypeId = 'gokart' | 'gt' | 'f1';

type PrototypeSize = Readonly<{
    label: string;
    length: number;
    width: number;
    wheelbase: number;
    rearOverhang: number;
    frontTire: Readonly<{ radius: number; width: number }>;
    rearTire: Readonly<{ radius: number; width: number }>;
    fenderInset: number;
    height: number;
    hip: Readonly<{ y: number; fromTail: number; recline: number }>;
    grip: Readonly<{ y: number; aheadOfHip: number }>;
}>;

function prototype(size: PrototypeSize) {
    const rearProbe = size.wheelbase / 2;
    const frontProbe = size.wheelbase - rearProbe;
    const tail = -rearProbe - size.rearOverhang;
    const nose = tail + size.length;
    const halfWidth = size.width / 2;
    const frontTire = Object.freeze({ ...size.frontTire, halfTrack: halfWidth - size.fenderInset - size.frontTire.width / 2 });
    const rearTire = Object.freeze({ ...size.rearTire, halfTrack: halfWidth - size.fenderInset - size.rearTire.width / 2 });
    return Object.freeze({
        ...size, tail, nose, frontProbe, rearProbe, frontTire, rearTire,
        halfTrackWidth: (frontTire.halfTrack + rearTire.halfTrack) / 2,
        wheelRadius: rearTire.radius,
        hip: Object.freeze({ ...size.hip, z: tail + size.hip.fromTail }),
        grip: Object.freeze({ ...size.grip, z: tail + size.hip.fromTail + size.grip.aheadOfHip }),
    });
}

/** Metres, from the cockpit fit study and the owner's size selections. */
export const KART_PROTOTYPES = Object.freeze({
    gokart: prototype({
        label: 'GoKart', length: 2.35, width: 1.35, wheelbase: 1.46, rearOverhang: .37,
        frontTire: { radius: .255, width: .16 }, rearTire: { radius: .27, width: .19 }, fenderInset: 0,
        height: 1.05, hip: { y: .43, fromTail: .87, recline: 15 * Math.PI / 180 }, grip: { y: .71, aheadOfHip: .443 },
    }),
    gt: prototype({
        label: 'GT GoKart', length: 3.25, width: 2.19, wheelbase: 2.10, rearOverhang: .49,
        frontTire: { radius: .335, width: .24 }, rearTire: { radius: .365, width: .30 }, fenderInset: .04,
        height: 1.4755, hip: { y: .40, fromTail: 1.21, recline: 25 * Math.PI / 180 }, grip: { y: .642, aheadOfHip: .363 },
    }),
    f1: prototype({
        label: 'F1 GoKart', length: 4.60, width: 2.02, wheelbase: 3.04, rearOverhang: .56,
        frontTire: { radius: .37, width: .28 }, rearTire: { radius: .40, width: .35 }, fenderInset: 0,
        height: 1.4755, hip: { y: .29, fromTail: 1.78, recline: 40 * Math.PI / 180 }, grip: { y: .460, aheadOfHip: .261 },
    }),
});

export function isKartPrototype(value: unknown): value is PrototypeId {
    return typeof value === 'string' && Object.hasOwn(KART_PROTOTYPES, value);
}

/** First-drive settings for the two new classes. F1 uses the exact early tune. */
export const PROTOTYPE_HANDLING = Object.freeze({
    gokart: createHandlingProfile({
        id: 'gokart-prototype', label: 'GoKart prototype', topSpeed: 68 * MPH, boostSpeed: 82 * MPH,
        acceleration: [[0, 7.2], [10, 7.2], [22, 4.3], [31, 1.6]],
        boostAcceleration: [[0, 11], [18, 11], [38, 5]],
        braking: [[0, 11], [18, 11], [38, 12]],
        cornering: [[0, 10.4], [10, 10.4], [24, 11.4], [38, 11.4]],
        liftOff: [[0, 0], [8, .58], [24, 1.25], [38, 2.0]],
        steeringRiseSeconds: .20, steeringReleaseSeconds: .17,
        steeringResponse: { lowSpeedRiseSeconds: .26, lowSpeedExponent: 1.13, blendStart: 3, blendEnd: 13 },
        steeringBlendStart: 6, steeringBlendEnd: 14, yawResponseSeconds: .12,
        yawAcceleration: 8, slipResponseSeconds: .17, tractionAssistance: .72,
    }),
    gt: createHandlingProfile({
        id: 'gt-prototype', label: 'GT GoKart prototype', topSpeed: 120 * MPH, boostSpeed: 138 * MPH,
        acceleration: [[0, 8.8], [18, 8.8], [31, 5.8], [52, 3.0], [61, 1.35]],
        boostAcceleration: [[0, 15], [22, 15], [55, 8], [62, 3.5]],
        braking: [[0, 15], [20, 15], [45, 19], [62, 21]],
        cornering: [[0, 13], [15, 13], [32, 16], [52, 20], [62, 21]],
        liftOff: [[0, 0], [9, .8], [27, 2.1], [48, 4.3], [62, 6.0]],
        steeringRiseSeconds: .25, steeringReleaseSeconds: .20,
        steeringResponse: { lowSpeedRiseSeconds: .30, lowSpeedExponent: 1.10, blendStart: 8, blendEnd: 25 },
        steeringBlendStart: 8, steeringBlendEnd: 20, yawResponseSeconds: .15,
        yawAcceleration: 7.5, slipResponseSeconds: .20, tractionAssistance: .56,
    }),
    f1: PREVIOUS_FAST_PROFILE,
});
