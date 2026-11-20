/** Driving-feel tests using checked handling and contacts. */
import { createTrack, TRACK_IDS } from '../track/index.ts';
import type { TrackId } from '../track/index.ts';
import { createKartController, normalizeKartInput } from '../kart/index.ts';
import { resolveKartProfile } from '../kart/profiles.ts';
import type { KartProfile, ProfileId } from '../kart/profiles.ts';
import type { KartInput, InputScript } from '../kart/index.ts';
import { trackBarriers } from '../contacts/index.ts';
import { createKartContactResolver } from '../contacts/karts.ts';
import { createParkedKartController, PARKED_KARTS } from './parked-karts.ts';
export { TRACK_IDS, PARKED_KARTS };
export type DrivingSelection = TrackId | typeof PARKED_KARTS;
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
export function createDrivingTest(initialSelection: DrivingSelection = 'original', options: Readonly<{ profile?: ProfileId | KartProfile }> = {}) {
    const profile = resolveKartProfile(options.profile);
    const empty = Object.freeze([]);
    function createScenario(selection: DrivingSelection) {
        const track = createTrack(selection === PARKED_KARTS ? 'original' : selection);
        const parked = selection === PARKED_KARTS ? createParkedKartController(track, profile) : null;
        const controller = parked ?? createKartController({
            profile, world: track, initial: { ...track.start.point, yaw: track.start.yaw },
            resolveMotion: createKartContactResolver(trackBarriers(track)),
        });
        return { selection, track, controller, parked };
    }
    let scenario = createScenario(initialSelection);
    return Object.freeze({
        get selection() { return scenario.selection; },
        get track() { return scenario.track; },
        get controller() { return scenario.controller; },
        advance(seconds: number, input: KartInput | InputScript = {}) { return scenario.controller.advance(seconds, input); },
        sample() { return scenario.controller.sample(); },
        sampleParked() { return scenario.parked?.sampleParked() ?? empty; },
        cancelInput() { scenario.controller.cancelInput(); },
        reset() { return scenario.controller.reset(); },
        selectTrack(selection: DrivingSelection) {
            scenario = createScenario(selection);
            return scenario.controller.state;
        },
        getState() {
            const { selection, track, controller, parked } = scenario;
            const parkedKarts = parked?.parkedStates ?? empty;
            return Object.freeze({
                selection, trackId: track.id, profile: profile.id, fingerprint: profile.fingerprint,
                karts: 1 + parkedKarts.length, avatars: 0, opponents: 0, parkedKarts,
                physics: controller.state, clock: controller.clock, pose: controller.sample(),
            });
        },
    });
}
