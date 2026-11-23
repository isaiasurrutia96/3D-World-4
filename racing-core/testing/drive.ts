/** Driving-feel tests using checked handling and contacts. */
import { createTrack, TRACK_IDS } from '../track/index.ts';
import type { TrackId } from '../track/index.ts';
import { createKartController, normalizeKartInput } from '../kart/index.ts';
import { KART_PROTOTYPES, PROTOTYPE_HANDLING, isKartPrototype } from '../kart/prototypes.ts';
import type { PrototypeId } from '../kart/prototypes.ts';
import { createPrototypeLapClock } from './prototype-laps.ts';
import { resolveKartProfile } from '../kart/profiles.ts';
import { F1_2026_PROFILE } from '../kart/f1-2026-profile.ts';
import { GT3_PROFILE } from '../kart/gt3-profile.ts';
import { GT3_V3_PROFILE } from '../kart/gt3-v3-profile.ts';
import type { KartProfile, ProfileId } from '../kart/profiles.ts';
import type { KartInput, InputScript } from '../kart/index.ts';
import { trackBarriers } from '../contacts/index.ts';
import { createKartContactResolver } from '../contacts/karts.ts';
import { createParkedKartController, PARKED_KARTS } from './parked-karts.ts';
import { NEIGHBORHOOD, NEIGHBORHOOD_WORLD } from './neighborhood.ts';
export { TRACK_IDS, PARKED_KARTS, NEIGHBORHOOD };
export type DrivingSelection = TrackId | typeof PARKED_KARTS | typeof NEIGHBORHOOD;
export type F1Tune = 'early' | '2026';
export type GTTune = 'early' | 'gt3' | 'gt3-v3';
export type DrivingSample = Readonly<{
    moveX?: number;
    moveZ?: number;
    source?: string;
    look?: Readonly<{
        x?: number;
    }>;
    pedals?: Readonly<{ throttle: number; brake: number }>;
    analogBrake?: number;
    actions?: Readonly<{
        left?: boolean;
        right?: boolean;
        gas?: boolean;
        reverse?: boolean;
        brake?: boolean;
        boost?: boolean;
    }>;
}>;
/** Recover independent device axes from the shared camera-relative movement snapshot. */
export function readDrivingInput(sample: DrivingSample, cameraYaw: number): KartInput {
    const x = sample.moveX ?? 0, z = sample.moveZ ?? 0, yaw = cameraYaw - (sample.look?.x ?? 0);
    if (![x, z, yaw].every(Number.isFinite))
        throw new TypeError('Driving input must be finite');
    const clean = (value: number) => Math.abs(value) < 1e-8 ? 0 : Math.max(-1, Math.min(1, value));
    let throttle = clean(-x * Math.sin(yaw) - z * Math.cos(yaw)), steer = clean(x * Math.cos(yaw) - z * Math.sin(yaw));
    if (sample.source === 'keyboard') {
        throttle = Math.sign(throttle);
        steer = Math.sign(steer);
    }
    const a = sample.actions ?? {};
    if (sample.pedals) {
        if (![sample.pedals.throttle, sample.pedals.brake].every(Number.isFinite)) throw new TypeError('Pedals must be finite');
        throttle = clean(sample.pedals.throttle);
    }
    if (!sample.pedals && (a.gas || a.reverse))
        throttle = a.reverse ? -1 : 1;
    if (a.left || a.right)
        steer = Number(Boolean(a.right)) - Number(Boolean(a.left));
    return normalizeKartInput({ throttle, steer, brake: sample.pedals ? false : Boolean(a.brake || a.gas && a.reverse), ...(sample.pedals ? { brakeAmount: sample.pedals.brake } : sample.analogBrake !== undefined ? { brakeAmount: sample.analogBrake } : {}), boost: Boolean(a.boost) });
}
export function createDrivingTest(initialSelection: DrivingSelection = 'original', options: Readonly<{
    profile?: ProfileId | KartProfile;
    prototype?: PrototypeId;
    f1Tune?: F1Tune;
    gtTune?: GTTune;
}> = {}) {
    const originalProfile = resolveKartProfile(options.profile);
    const kart = options.prototype;
    const f1Tune = options.f1Tune ?? 'early';
    const gtTune = options.gtTune ?? 'early';
    if (kart !== undefined && !isKartPrototype(kart)) throw new RangeError('Unknown kart prototype');
    if (f1Tune !== 'early' && f1Tune !== '2026') throw new RangeError('Unknown F1 tune');
    if (gtTune !== 'early' && gtTune !== 'gt3' && gtTune !== 'gt3-v3') throw new RangeError('Unknown GT tune');
    const empty = Object.freeze([]);
    function createScenario(selection: DrivingSelection) {
        const isParked = selection === PARKED_KARTS;
        const track = selection === NEIGHBORHOOD
            ? NEIGHBORHOOD_WORLD
            : createTrack(isParked ? 'original' : selection);
        const prototype = isParked ? undefined : kart;
        const geometry = prototype ? KART_PROTOTYPES[prototype] : undefined;
        let profile = prototype ? PROTOTYPE_HANDLING[prototype] : originalProfile;
        if (prototype === 'f1' && f1Tune === '2026') profile = F1_2026_PROFILE;
        if (prototype === 'gt' && gtTune !== 'early') profile = gtTune === 'gt3' ? GT3_PROFILE : GT3_V3_PROFILE;
        if (track.id === NEIGHBORHOOD) {
            const controller = createKartController({
                profile, world: track, geometry, initial: { ...track.start.point, yaw: track.start.yaw },
            });
            return { selection, track, controller, profile, prototype, parked: null, clock: null };
        }
        const parked = isParked ? createParkedKartController(track, profile) : null;
        const footprint = geometry && Object.freeze({
            radius: geometry.width / 2,
            halfLength: (geometry.length - geometry.width) / 2,
            height: geometry.height,
            offsetZ: (geometry.tail + geometry.nose) / 2,
        });
        const clock = prototype ? createPrototypeLapClock(track) : null;
        const controller = parked ?? createKartController({
            profile, world: track, geometry,
            initial: { ...(prototype ? track.sample(-4.5).point : track.start.point), yaw: track.start.yaw },
            resolveMotion: createKartContactResolver(trackBarriers(track), footprint),
        });
        return { selection, track, controller, profile, prototype, parked, clock };
    }
    let scenario = createScenario(initialSelection);
    return Object.freeze({
        get selection() { return scenario.selection; },
        get track() { return scenario.track; },
        get controller() { return scenario.controller; },
        get lap() { return scenario.clock?.read(scenario.controller.clock.seconds); },
        advance(seconds: number, input: KartInput | InputScript = {}) {
            const { clock, controller } = scenario;
            if (!clock || !('advanceWithTrace' in controller)) return controller.advance(seconds, input);
            const trace = controller.advanceWithTrace(seconds, input);
            clock.observe(trace.from, trace.firstTick, trace.states);
            return controller.state;
        },
        sample() { return scenario.controller.sample(); },
        sampleParked() { return scenario.parked?.sampleParked() ?? empty; },
        cancelInput() { scenario.controller.cancelInput(); },
        reset() {
            const state = scenario.controller.reset();
            scenario.clock?.reset();
            return state;
        },
        selectTrack(selection: DrivingSelection) {
            scenario = createScenario(selection);
            return scenario.controller.state;
        },
        getState() {
            const { selection, track, controller, parked, profile, prototype, clock } = scenario;
            const parkedKarts = parked?.parkedStates ?? empty;
            return Object.freeze({
                selection, trackId: track.id, profile: profile.id, fingerprint: profile.fingerprint,
                karts: 1 + parkedKarts.length, avatars: 0, opponents: 0, parkedKarts,
                ...(prototype ? { prototype, lap: clock?.read(controller.clock.seconds) } : {}),
                ...(prototype === 'f1' ? { f1Tune } : {}),
                ...(prototype === 'gt' ? { gtTune } : {}),
                physics: controller.state, clock: controller.clock, pose: controller.sample(),
            });
        },
    });
}
