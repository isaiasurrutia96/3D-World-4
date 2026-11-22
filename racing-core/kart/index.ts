import { prepareTunedStep, initialHandling } from './dynamics.ts';
import type { HandlingState, SurfaceSample } from './dynamics.ts';
import { resolveKartProfile } from './profiles.ts';
import type { KartProfile, ProfileId } from './profiles.ts';
/** Headless LetsGo-style handling. Optional numeric contact response; no renderer or race rules. */
export const KART = Object.freeze({
    step: 1 / 120,
    maxFrameSeconds: .25,
    topSpeed: 120 * .44704,
    boostSpeed: 180 * .44704,
    reverseSpeed: 8,
    acceleration: 24,
    boostAcceleration: 48,
    braking: 36,
    reverseAcceleration: 8,
    boostRecoveryDeceleration: 12,
    coastingResistance: 1.8,
    coastingDrag: .0035,
    steeringLock: .415,
    steeringSpeedScale: 11,
    steeringBuild: 6.5,
    steeringRelease: 14,
    heldSteerThreshold: .55,
    heldSteerDelay: .5,
    heldSteerRamp: .8,
    heldSteerGain: .20,
    wheelbase: 2.03,
    wheelRadius: .38,
    frontProbe: 1.03,
    rearProbe: 1,
    halfTrackWidth: .8,
    lateralGrip: 7,
    gravity: 22,
    supportReach: .65,
    orientationReach: .7,
    orientationResponse: 12,
    maxPitch: .4,
    maxBank: .3,
    boostDuration: 2,
});
export type KartGeometry = Readonly<{
    wheelbase: number;
    wheelRadius: number;
    frontProbe: number;
    rearProbe: number;
    halfTrackWidth: number;
}>;

function resolveGeometry(geometry: KartGeometry | undefined): KartGeometry {
    if (geometry === undefined) return KART;
    const { wheelbase, wheelRadius, frontProbe, rearProbe, halfTrackWidth } = geometry;
    if (![wheelbase, wheelRadius, frontProbe, rearProbe, halfTrackWidth].every(n => Number.isFinite(n) && n > 0) ||
        Math.abs(frontProbe + rearProbe - wheelbase) > 1e-8)
        throw new RangeError('Invalid kart geometry');
    return Object.freeze({ wheelbase, wheelRadius, frontProbe, rearProbe, halfTrackWidth });
}

/** +Z forward, +Y up, yaw positive towards +X. Positive steer turns right from the chase view, as in LetsGo. */
export type KartInput = Readonly<{
    throttle?: number;
    steer?: number;
    brake?: boolean;
    brakeAmount?: number;
    boost?: boolean;
}>;
export type SurfaceWorld = Readonly<{
    heightAt(x: number, z: number, maximum: number): number | null;
    surfaceAt?(x: number, z: number, y: number): SurfaceSample;
}>;
export type KartState = Readonly<{
    x: number;
    y: number;
    z: number;
    yaw: number;
    speed: number;
    lateralSpeed: number;
    steering: number;
    steerHoldTime: number;
    steerHoldDirection: number;
    wheelRotation: number;
    verticalVelocity: number;
    grounded: boolean;
    pitch: number;
    bank: number;
    boostTime: number;
    impactYawRate: number;
    railContactTime: number;
    impactRecovery: number;
    contacts: number;
    handling?: HandlingState;
}>;
type MutableState = {
    -readonly [P in keyof KartState]: KartState[P];
};
export type KartInitial = Partial<Pick<KartState, 'x' | 'y' | 'z' | 'yaw' | 'speed' | 'lateralSpeed' | 'grounded' | 'verticalVelocity' | 'boostTime' | 'impactYawRate' | 'railContactTime' | 'impactRecovery'>>;
/** A script is sampled at physics time, allowing identical traces at any rendering rate. */
export type InputScript = (tick: number, seconds: number, state: KartState) => KartInput;
type Controls = Required<Omit<KartInput, 'brakeAmount'>> & Pick<KartInput, 'brakeAmount'>;
export type KartMotion = Readonly<{
    state: KartState;
    vx: number;
    vz: number;
}>;
export type KartMovement = Readonly<{
    x: number;
    z: number;
    vx: number;
    vz: number;
    impactYawRate?: number;
    railContactTime?: number;
    impactRecovery?: number;
    contacts?: number;
}>;
export type KartMotionResolver = (motion: KartMotion) => KartMovement;
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
const approach = (n: number, target: number, step: number) => n < target ? Math.min(target, n + step) : Math.max(target, n - step);
function finite(n: number, name: string): number {
    if (!Number.isFinite(n))
        throw new TypeError(name + ' must be finite');
    return n;
}
export function normalizeKartInput(input: KartInput = {}): Controls {
    if (!input || typeof input !== 'object')
        throw new TypeError('input must be an object');
    for (const key of ['brake', 'boost'] as const)
        if (input[key] !== undefined && typeof input[key] !== 'boolean')
            throw new TypeError(key + ' must be boolean');
    return Object.freeze({ ...(input.brakeAmount === undefined ? {} : { brakeAmount: clamp(finite(input.brakeAmount, 'brakeAmount'), 0, 1) }), throttle: clamp(finite(input.throttle ?? 0, 'throttle'), -1, 1), steer: clamp(finite(input.steer ?? 0, 'steer'), -1, 1), brake: input.brake ?? false, boost: input.boost ?? false });
}
function initialState(initial: KartInitial): MutableState {
    if (!initial || typeof initial !== 'object')
        throw new TypeError('initial must be an object');
    const state: MutableState = { x: 0, y: 0, z: 0, yaw: 0, speed: 0, lateralSpeed: 0, steering: 0, steerHoldTime: 0, steerHoldDirection: 0, wheelRotation: 0, verticalVelocity: 0, grounded: true, pitch: 0, bank: 0, boostTime: 0, impactYawRate: 0, railContactTime: 0, impactRecovery: 0, contacts: 0 };
    for (const key of ['x', 'y', 'z', 'yaw', 'speed', 'lateralSpeed', 'verticalVelocity', 'boostTime', 'impactYawRate', 'railContactTime', 'impactRecovery'] as const)
        state[key] = finite(initial[key] ?? state[key], key);
    if (initial.grounded !== undefined && typeof initial.grounded !== 'boolean')
        throw new TypeError('grounded must be boolean');
    state.grounded = initial.grounded ?? true;
    if (state.boostTime < 0 || state.boostTime > KART.boostDuration)
        throw new RangeError('boostTime must be between 0 and 2 seconds');
    if (state.railContactTime < 0 || state.impactRecovery < 0 || Math.abs(state.impactYawRate) > .8)
        throw new RangeError('Invalid contact recovery state');
    return state;
}
export function maxKartSteering(speed: number, holdSeconds = 0): number {
    finite(speed, 'speed');
    finite(holdSeconds, 'holdSeconds');
    const hold = clamp((holdSeconds - KART.heldSteerDelay) / KART.heldSteerRamp, 0, 1);
    return KART.steeringLock / (1 + Math.abs(speed) / KART.steeringSpeedScale) * (1 + KART.heldSteerGain * hold * hold * (3 - 2 * hold));
}
export function kartVelocity(state: KartState) {
    const sin = Math.sin(state.yaw), cos = Math.cos(state.yaw);
    return Object.freeze({ x: sin * state.speed + cos * state.lateralSpeed, z: cos * state.speed - sin * state.lateralSpeed });
}
function support(world: SurfaceWorld, x: number, z: number, maximum: number): number | null {
    const y = world.heightAt(x, z, maximum);
    if (y !== null && (!Number.isFinite(y) || y > maximum + 1e-9))
        throw new TypeError('heightAt must return null or a finite height at/below maximum');
    return y;
}
/** Shared first half of a physics tick, also used by the simultaneous kart-contact step. */
export function prepareKartStep(source: KartState, raw: KartInput, activateBoost = false, profile: KartProfile = resolveKartProfile(), world?: SurfaceWorld, geometry: KartGeometry = KART): KartMotion {
    profile = resolveKartProfile(profile);
    if (profile.mode === 'tuned') return prepareTunedStep(source, normalizeKartInput(raw), activateBoost, profile, world, {
        step: KART.step, boostDuration: KART.boostDuration, wheelbase: geometry.wheelbase,
    });
    if (source.handling) throw new Error('Tuned kart state requires its matching profile');
    const state = { ...source }, input = normalizeKartInput(raw), t = KART, dt = t.step;
    state.railContactTime = Math.max(0, state.railContactTime - dt);
    state.impactRecovery = Math.max(0, state.impactRecovery - dt);
    state.impactYawRate *= Math.exp(-6 * dt);
    state.contacts = 0;
    // boost is a granted engine command, not an inventory/item system.
    if (activateBoost) {
        state.boostTime = t.boostDuration;
        state.speed = Math.max(0, state.speed);
    }
    const boosting = state.boostTime > 0;
    state.boostTime = Math.max(0, state.boostTime - dt);
    const throttle = boosting && input.throttle >= 0 && !input.brake ? 1 : input.throttle;
    const topSpeed = boosting ? t.boostSpeed : t.topSpeed;
    state.lateralSpeed *= Math.exp(-t.lateralGrip * dt);
    // Pedal signs retain LetsGo's button throttle; steering keeps full analog magnitude.
    if (state.impactRecovery > 0 && input.throttle >= 0)
        state.speed *= Math.exp(-6 * dt);
    if (input.brake)
        state.speed = approach(state.speed, 0, t.braking * dt);
    else if (throttle > 0 && state.impactRecovery <= 0)
        state.speed = state.speed > topSpeed ? approach(state.speed, topSpeed, t.boostRecoveryDeceleration * dt) : Math.min(topSpeed, state.speed + (state.speed < 0 ? t.braking : boosting ? t.boostAcceleration : t.acceleration) * dt);
    else if (throttle < 0)
        state.speed = clamp(state.speed - (state.speed > 0 ? t.braking : t.reverseAcceleration) * dt, -t.reverseSpeed, topSpeed);
    else if (state.impactRecovery <= 0)
        state.speed = approach(state.speed, 0, (t.coastingResistance + t.coastingDrag * state.speed * state.speed) * dt);
    const heldDirection = Math.abs(input.steer) > t.heldSteerThreshold && state.speed > 2 && state.grounded && !input.brake ? Math.sign(input.steer) : 0;
    state.steerHoldTime = heldDirection ? (state.steerHoldDirection === heldDirection ? state.steerHoldTime : 0) + dt : 0;
    state.steerHoldDirection = heldDirection;
    const target = input.steer * maxKartSteering(state.speed, state.steerHoldTime);
    const building = input.steer * state.steering >= 0 && Math.abs(target) > Math.abs(state.steering);
    state.steering += (target - state.steering) * (1 - Math.exp(-(building ? t.steeringBuild : t.steeringRelease) * dt));
    const turnSpeed = state.railContactTime > 0 && throttle > 0 ? Math.max(state.speed, 2) : state.speed;
    const travelYaw = state.yaw - (state.grounded ? turnSpeed / geometry.wheelbase * Math.tan(state.steering) * dt : 0);
    state.yaw = travelYaw + state.impactYawRate * dt;
    let vx = Math.sin(travelYaw) * state.speed + Math.cos(travelYaw) * state.lateralSpeed;
    let vz = Math.cos(travelYaw) * state.speed - Math.sin(travelYaw) * state.lateralSpeed;
    const magnitude = Math.hypot(vx, vz), limit = Math.max(topSpeed, Math.abs(state.speed));
    if (magnitude > limit) {
        vx *= limit / magnitude;
        vz *= limit / magnitude;
    }
    return Object.freeze({ state: Object.freeze(state), vx, vz });
}
/** Complete the same tick after free motion or a shared contact solve, then query the actual road. */
export function finishKartStep(motion: KartMotion, movement: KartMovement, world: SurfaceWorld, geometry: KartGeometry = KART): KartState {
    const state = { ...motion.state }, t = KART, dt = t.step;
    const oldX = state.x, oldZ = state.z, sin = Math.sin(state.yaw), cos = Math.cos(state.yaw);
    for (const key of ['x', 'z', 'vx', 'vz'] as const)
        finite(movement[key], key);
    for (const key of ['impactYawRate', 'railContactTime', 'impactRecovery', 'contacts'] as const) {
        if (movement[key] !== undefined)
            state[key] = finite(movement[key], key);
    }
    if (Math.abs(state.impactYawRate) > .8 + 1e-9 || state.railContactTime < 0 || state.impactRecovery < 0 || !Number.isInteger(state.contacts) || state.contacts < 0)
        throw new RangeError('Invalid contact result');
    const vx = movement.vx, vz = movement.vz;
    state.x = movement.x;
    state.z = movement.z;
    state.speed = vx * sin + vz * cos;
    state.lateralSpeed = vx * cos - vz * sin;
    state.wheelRotation += ((state.x - oldX) * sin + (state.z - oldZ) * cos) / geometry.wheelRadius;
    const ground = support(world, state.x, state.z, state.y + t.supportReach);
    if (state.grounded && ground !== null && ground >= state.y - t.supportReach) {
        state.y = ground;
        state.verticalVelocity = 0;
    }
    else {
        state.grounded = false;
        const previousY = state.y;
        state.verticalVelocity -= t.gravity * dt;
        state.y += state.verticalVelocity * dt;
        const landing = support(world, state.x, state.z, previousY + .001);
        if (state.verticalVelocity <= 0 && landing !== null && previousY >= landing - .02 && state.y <= landing) {
            state.y = landing;
            state.verticalVelocity = 0;
            state.grounded = true;
        }
    }
    if (state.grounded) {
        const front = support(world, state.x + sin * geometry.frontProbe, state.z + cos * geometry.frontProbe, state.y + t.orientationReach);
        const back = support(world, state.x - sin * geometry.rearProbe, state.z - cos * geometry.rearProbe, state.y + t.orientationReach);
        const left = support(world, state.x - cos * geometry.halfTrackWidth, state.z + sin * geometry.halfTrackWidth, state.y + t.orientationReach);
        const right = support(world, state.x + cos * geometry.halfTrackWidth, state.z - sin * geometry.halfTrackWidth, state.y + t.orientationReach);
        const pitch = front !== null && back !== null ? Math.atan2(back - front, geometry.wheelbase) : 0;
        const bank = left !== null && right !== null ? Math.atan2(right - left, geometry.halfTrackWidth * 2) : 0;
        const blend = 1 - Math.exp(-t.orientationResponse * dt);
        state.pitch += (clamp(pitch, -t.maxPitch, t.maxPitch) - state.pitch) * blend;
        state.bank += (clamp(bank, -t.maxBank, t.maxBank) - state.bank) * blend;
    }
    for (const [key, value] of Object.entries(state))
        if (typeof value === 'number')
            finite(value, key);
    return Object.freeze(state);
}
function step(state: KartState, input: Controls, world: SurfaceWorld, activateBoost: boolean, resolveMotion: KartMotionResolver | undefined, profile: KartProfile, geometry: KartGeometry): KartState {
    const motion = prepareKartStep(state, input, activateBoost, profile, world, geometry);
    const movement = resolveMotion ? resolveMotion(motion) : { x: state.x + motion.vx * KART.step, z: state.z + motion.vz * KART.step, vx: motion.vx, vz: motion.vz };
    return finishKartStep(motion, movement, world, geometry);
}
export function interpolateKartState(previous: KartState, current: KartState, alpha: number): KartState {
    finite(alpha, 'alpha');
    if (alpha < 0 || alpha > 1)
        throw new RangeError('alpha must be between 0 and 1');
    const pose = { ...current };
    for (const key of ['x', 'y', 'z', 'yaw', 'speed', 'lateralSpeed', 'steering', 'wheelRotation', 'verticalVelocity', 'pitch', 'bank'] as const)
        pose[key] = previous[key] + (current[key] - previous[key]) * alpha;
    return Object.freeze(pose);
}

export function createKartController(options: Readonly<{
    world: SurfaceWorld;
    initial?: KartInitial;
    resolveMotion?: KartMotionResolver;
    profile?: ProfileId | KartProfile;
    geometry?: KartGeometry;
}>) {
    if (typeof options?.world?.heightAt !== 'function')
        throw new TypeError('A numeric heightAt world is required');
    const world = options.world, start = Object.freeze({ ...options.initial }), profile = resolveKartProfile(options.profile);
    const geometry = resolveGeometry(options.geometry);
    const initialize = (initial: KartInitial) => Object.freeze({ ...initialState(initial), ...(profile.mode === 'tuned' ? { handling: initialHandling(profile) } : {}) });
    let current: KartState = initialize(start), previous = current;
    let ticks = 0, remainder = 0, lastBoost = false, pendingBoost = false;
    function advance(frameSeconds: number, input: KartInput | InputScript = {}, trace?: KartState[]): KartState {
        finite(frameSeconds, 'frameSeconds');
        if (frameSeconds < 0 || frameSeconds > KART.maxFrameSeconds)
            throw new RangeError('frameSeconds must be between 0 and 0.25; pause/reset the clock after a suspended tab');
        if (!Number.isSafeInteger(ticks + Math.ceil(frameSeconds / KART.step)))
            throw new RangeError('Physics clock exhausted');
        const literal = typeof input === 'function' ? null : normalizeKartInput(input);
        let latch = lastBoost, queued = pendingBoost;
        const accept = (controls: Controls) => {
            if (controls.boost && !latch)
                queued = true;
            latch = controls.boost;
        };
        // Preserve an activation shorter than one physics tick at high rendering rates.
        if (literal)
            accept(literal);
        const total = remainder + frameSeconds, count = Math.floor((total + 1e-12) / KART.step);
        let next = { ...current }, prior = previous;
        for (let i = 0; i < count; i++) {
            const controls = literal ?? normalizeKartInput((input as InputScript)(ticks + i, (ticks + i) * KART.step, Object.freeze({ ...next })));
            if (!literal)
                accept(controls);
            prior = Object.freeze({ ...next });
            next = { ...step(next, controls, world, queued, options.resolveMotion, profile, geometry) };
            queued = false;
            for (const [key, value] of Object.entries(next))
                if (typeof value === 'number')
                    finite(value, key);
            if (trace) trace.push(Object.freeze(next));
        }
        // Commit only after the complete batch succeeds. Invalid scripts/worlds cannot corrupt state.
        if (count) {
            current = Object.freeze(next);
            previous = prior;
        }
        ticks += count;
        remainder = Math.max(0, total - count * KART.step);
        lastBoost = latch;
        pendingBoost = queued;
        return current;
    }
    function sample(alpha = remainder / KART.step): KartState {
        return interpolateKartState(previous, current, alpha);
    }
    return Object.freeze({
        profile,
        get state() { return current; },
        get clock() { return Object.freeze({ ticks, seconds: ticks * KART.step, remainder, alpha: remainder / KART.step }); },
        advance(frameSeconds: number, input?: KartInput | InputScript) { return advance(frameSeconds, input); },
        /** Successful fixed ticks for consumers which need sub-frame positions. */
        advanceWithTrace(frameSeconds: number, input?: KartInput | InputScript) {
            const from = current, firstTick = ticks;
            const states: KartState[] = [];
            advance(frameSeconds, input, states);
            return { from, firstTick, states };
        },
        sample,
        cancelInput() { lastBoost = pendingBoost = false; },
        reset(initial: KartInitial = start) { const state = initialize(initial); current = previous = state; ticks = remainder = 0; lastBoost = pendingBoost = false; return current; },
    });
}
export type KartController = ReturnType<typeof createKartController>;
