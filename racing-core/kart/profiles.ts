/** Per-kart driving data. Metres, seconds, radians; no devices or rendering. */
export const MPH = .44704;
export const STANDARD_GRAVITY = 9.80665;
export type Curve = readonly (readonly [speed: number, value: number])[];
export type LegacyProfile = Readonly<{
    mode: 'legacy'; id: 'original'; label: string; version: 1;
    topSpeed: number; boostSpeed: number; fingerprint: string;
}>;
export type HandlingSettings = {
    id: string;
    label: string;
    topSpeed: number;
    boostSpeed: number;
    reverseSpeed: number;
    reverseAcceleration: number;
    acceleration: Curve;
    boostAcceleration: Curve;
    braking: Curve;
    brakeStrength: number;
    cornering: Curve;
    liftOff: Curve;
    liftStrength: number;
    liftRiseSeconds: number;
    liftReleaseSeconds: number;
    coastConstant: number;
    coastQuadratic: number;
    throttleRiseSeconds: number;
    throttleReleaseSeconds: number;
    brakeRiseSeconds: number;
    brakeReleaseSeconds: number;
    steeringLock: number;
    steeringRiseSeconds: number;
    steeringReleaseSeconds: number;
    steeringBlendStart: number;
    steeringBlendEnd: number;
    yawResponseSeconds: number;
    yawAcceleration: number;
    slipResponseSeconds: number;
    tractionAssistance: number;
    surfaceResponseSeconds: number;
    boostRecoveryDeceleration: number;
    boostRecoverySeconds: number;
    driveJerk: number;
};
export type HandlingProfile = Readonly<HandlingSettings & {
    mode: 'tuned'; version: 1; fingerprint: string;
}>;
export type KartProfile = LegacyProfile | HandlingProfile;
const approved = new WeakSet<object>();

// These are performance targets, not a claim that all F1 cars have these
// specifications. They already include net full-throttle acceleration.
const referenceDefaults: HandlingSettings = {
    id: 'fast', label: 'Fast', topSpeed: 180 * MPH, boostSpeed: 220 * MPH,
    reverseSpeed: 5.6, reverseAcceleration: 6,
    acceleration: [[0, 10.8], [28, 10.8], [55.5, 10.8], [56.5, 5.1], [83, 5.1], [95, 1.5], [98.3, 0]],
    boostAcceleration: [[0, 32], [56, 32], [83, 26], [95, 18], [110, 14]],
    brakeStrength: .8,
    braking: [[0, 15], [20, 15], [40, 25], [60, 38], [80, 49], [140, 49]],
    cornering: [[0, 14], [15, 14], [30, 20], [45, 28], [60, 38], [75, 49], [140, 49]],
    liftOff: [[0, 0], [3, .5], [15, 2], [30, 7], [60, 15], [80, 19], [110, 21]],
    liftStrength: 1, liftRiseSeconds: .24, liftReleaseSeconds: .12,
    coastConstant: .3, coastQuadratic: .0004,
    throttleRiseSeconds: .15, throttleReleaseSeconds: .10,
    brakeRiseSeconds: .10, brakeReleaseSeconds: .08,
    steeringLock: Math.PI / 6, steeringRiseSeconds: .25, steeringReleaseSeconds: .18,
    steeringBlendStart: 10, steeringBlendEnd: 25,
    yawResponseSeconds: .12, yawAcceleration: 8, slipResponseSeconds: .18,
    tractionAssistance: .65, surfaceResponseSeconds: .15,
    boostRecoveryDeceleration: 8, boostRecoverySeconds: .20, driveJerk: 120,
};
// Arcade cornering deliberately exceeds the reference F1 grip. Changing the
// shared curve increases both available tire force and the matching wheel
// angle; increasing the wheel angle alone would just create more sliding.
const defaults: HandlingSettings = {
    ...referenceDefaults,
    cornering: [[0, 28], [15, 28], [30, 40], [45, 56], [60, 76], [75, 98], [140, 98]],
    steeringRiseSeconds: .18, steeringReleaseSeconds: .14,
    yawResponseSeconds: .10, yawAcceleration: 10, slipResponseSeconds: .14,
};
const curveKeys = ['acceleration', 'boostAcceleration', 'braking', 'cornering', 'liftOff'] as const;
const unitKeys = ['liftStrength', 'tractionAssistance', 'brakeStrength'] as const;
const nonnegativeKeys = ['coastConstant', 'coastQuadratic', 'boostRecoveryDeceleration', 'steeringBlendStart'] as const;
const numericKeys = Object.keys(defaults).filter(key => typeof defaults[key as keyof HandlingSettings] === 'number') as (keyof HandlingSettings)[];
const fields = new Set(Object.keys(defaults));

function finite(value: unknown, field: string): asserts value is number {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(field + ' must be finite');
}
function copyCurve(value: Curve, name: string): Curve {
    if (!Array.isArray(value) || value.length < 2) throw new TypeError(name + ' needs at least two curve points');
    let previous = -1;
    const points = value.map((point, index) => {
        if (!Array.isArray(point) || point.length !== 2) throw new TypeError('Invalid ' + name + ' curve point');
        const [speed, amount] = point;
        finite(speed, name + ' speed'); finite(amount, name + ' value');
        if (speed < 0 || speed <= previous || amount < 0 || index === 0 && speed !== 0) throw new RangeError('Invalid ' + name + ' curve order/range');
        previous = speed;
        return Object.freeze([speed, amount] as const);
    });
    return Object.freeze(points);
}
// Stable content identity for saved runs/custom profiles, not a security hash.
function fingerprint(data: object): string {
    // Names/cosmetics do not change a run's physics. Sort ASCII keys without
    // locale-dependent collation; curve order and every numeric bit matter.
    const sorted = Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'id' && key !== 'label').sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
    const text = JSON.stringify(sorted);
    let hash = 0xcbf29ce484222325n;
    for (let i = 0; i < text.length; i++) hash = BigInt.asUintN(64, (hash ^ BigInt(text.charCodeAt(i))) * 0x100000001b3n);
    return 'kart-v1-' + hash.toString(16).padStart(16, '0');
}
export function createHandlingProfile(changes: Partial<HandlingSettings> = {}): HandlingProfile {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new TypeError('Profile settings must be an object');
    for (const key of Object.keys(changes)) if (!fields.has(key)) throw new TypeError('Unknown kart setting: ' + key);
    const data = { ...defaults, ...changes };
    if (typeof data.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(data.id) || data.id === 'original') throw new TypeError('Invalid tuning profile id');
    if (typeof data.label !== 'string' || !data.label.trim() || data.label.length > 80) throw new TypeError('Invalid tuning profile label');
    for (const key of numericKeys) finite(data[key], key);
    for (const key of curveKeys) data[key] = copyCurve(data[key], key);
    for (const key of numericKeys) {
        const value = data[key] as number;
        if ((nonnegativeKeys as readonly string[]).includes(key)) { if (value < 0) throw new RangeError(key + ' must be nonnegative'); }
        else if ((unitKeys as readonly string[]).includes(key)) { if (value < 0 || value > 1) throw new RangeError(key + ' must be in [0,1]'); }
        else if (value <= 0) throw new RangeError(key + ' must be positive');
    }
    if (data.boostSpeed < data.topSpeed || data.reverseSpeed > data.topSpeed || data.steeringLock >= Math.PI / 2 || data.steeringBlendEnd <= data.steeringBlendStart) throw new RangeError('Inconsistent kart profile limits');
    for (const name of ['braking', 'cornering'] as const) if (data[name].some(point => point[1] <= 0)) throw new RangeError(name + ' limits must be positive');
    const profile = Object.freeze({ ...data, mode: 'tuned' as const, version: 1 as const, fingerprint: fingerprint(data) });
    approved.add(profile); return profile;
}
export const ORIGINAL_PROFILE: LegacyProfile = Object.freeze({ mode: 'legacy', version: 1, id: 'original', label: 'Original', topSpeed: 120 * MPH, boostSpeed: 180 * MPH, fingerprint: 'letsgo-573664e824a0' });
approved.add(ORIGINAL_PROFILE);
// Keep the exact previously approved physics available to numeric regressions.
export const PREVIOUS_FAST_PROFILE = createHandlingProfile({ ...referenceDefaults, id: 'fast-before-grip', label: 'Fast before increased grip' });
export const DRIVING_PROFILES = Object.freeze({
    original: ORIGINAL_PROFILE,
    balanced: createHandlingProfile({ id: 'balanced', label: 'Balanced', topSpeed: 150 * MPH, boostSpeed: 200 * MPH }),
    fast: createHandlingProfile(),
    'f1-targets': createHandlingProfile({ ...referenceDefaults, id: 'f1-targets', label: 'F1 performance reference', topSpeed: 98.3, boostSpeed: 98.3, brakeStrength: 1 }),
});
export type ProfileId = keyof typeof DRIVING_PROFILES;
export function resolveKartProfile(value: ProfileId | KartProfile = 'original'): KartProfile {
    if (typeof value === 'string') {
        if (!Object.hasOwn(DRIVING_PROFILES, value)) throw new RangeError('Unknown driving profile: ' + value);
        return DRIVING_PROFILES[value];
    }
    if (!value || !approved.has(value)) throw new TypeError('Use createHandlingProfile to validate a custom profile');
    return value;
}
export function sampleCurve(points: Curve, speed: number): number {
    if (points.length < 2) throw new RangeError('A sampled curve needs two points');
    finite(speed, 'Curve speed'); speed = Math.abs(speed);
    if (speed <= points[0][0]) return points[0][1];
    if (speed >= points[points.length - 1][0]) return points[points.length - 1][1];
    let low = 0, high = points.length - 1;
    while (high - low > 1) { const mid = (low + high) >>> 1; if (points[mid][0] <= speed) low = mid; else high = mid; }
    const [a, x] = points[low], [b, y] = points[high], t = (speed - a) / (b - a), smooth = t * t * (3 - 2 * t);
    return x + (y - x) * smooth;
}
export function steeringLimit(profile: HandlingProfile, speed: number, wheelbase: number, gripMultiplier = 1): number {
    finite(speed, 'Steering speed'); finite(wheelbase, 'Wheelbase'); finite(gripMultiplier, 'Grip multiplier');
    if (wheelbase <= 0 || gripMultiplier < 0) throw new RangeError('Invalid steering scale');
    const v = Math.abs(speed), calculated = Math.atan(wheelbase * sampleCurve(profile.cornering, v) * gripMultiplier / Math.max(v * v, 1e-12));
    const t = Math.max(0, Math.min(1, (v - profile.steeringBlendStart) / (profile.steeringBlendEnd - profile.steeringBlendStart))), blend = t * t * (3 - 2 * t);
    return Math.min(profile.steeringLock, profile.steeringLock + (calculated - profile.steeringLock) * blend);
}
