import { trackBarriers } from '../contacts/index.ts';
import { resolvePreparedKartContacts } from '../contacts/karts.ts';
import { createKartController, finishKartStep, interpolateKartState, KART, prepareKartStep } from '../kart/index.ts';
import type { InputScript, KartInitial, KartInput, KartState } from '../kart/index.ts';
import type { KartProfile } from '../kart/profiles.ts';
import type { Track } from '../track/index.ts';

export const PARKED_KARTS = 'parked-karts';

function parkAt(track: Track, distance: number, offset: number): KartInitial {
    const { point, normal, forward } = track.sample(distance);
    const x = point.x + normal.x * offset, z = point.z + normal.z * offset;
    const y = track.heightAt(x, z, point.y + KART.supportReach);
    if (y === null)
        throw new Error('A parked kart needs road support');
    return { x, y, z, yaw: Math.atan2(forward.x, forward.z) };
}

type ParkedFrame = { previous: readonly KartState[]; current: readonly KartState[] };

/** The existing player controller owns the clock and boost latch for all three karts. */
export function createParkedKartController(track: Track, profile: KartProfile) {
    const initial = { ...track.start.point, yaw: track.start.yaw };
    const barriers = trackBarriers(track);
    const starts = Object.freeze([
        createKartController({ world: track, profile, initial: parkAt(track, 28, 0) }).state,
        createKartController({ world: track, profile, initial: parkAt(track, 43, 4) }).state,
    ]);
    let committed: ParkedFrame = { previous: starts, current: starts };
    let working: ParkedFrame | null = null;
    const player = createKartController({
        world: track, profile, initial,
        resolveMotion(motion) {
            if (!working)
                throw new Error('Kart contacts require an active frame');
            const previous = working.current;
            const parked = previous.map((state, i) => ({
                id: 'parked-' + i,
                motion: prepareKartStep(state, {}, false, profile, track),
            }));
            const solved = resolvePreparedKartContacts([{ id: 'player', motion }, ...parked], barriers);
            working = {
                previous,
                current: Object.freeze(parked.map((kart, i) => finishKartStep(kart.motion, solved.movements[i + 1], track))),
            };
            return solved.movements[0];
        },
    });

    function requireIdle() {
        if (working)
            throw new Error('Cannot change the driving test during a physics frame');
    }

    return Object.freeze({
        profile,
        get state() { return player.state; },
        get clock() { return player.clock; },
        get parkedStates() { return committed.current; },
        sample: player.sample,
        sampleParked() {
            const { alpha } = player.clock;
            return Object.freeze(committed.current.map((state, i) => interpolateKartState(committed.previous[i], state, alpha)));
        },
        advance(seconds: number, input?: KartInput | InputScript) {
            requireIdle();
            working = committed;
            try {
                const state = player.advance(seconds, input);
                committed = working;
                return state;
            }
            finally {
                working = null;
            }
        },
        reset(placement?: KartInitial) {
            requireIdle();
            const state = player.reset(placement);
            committed = { previous: starts, current: starts };
            return state;
        },
        cancelInput() {
            requireIdle();
            player.cancelInput();
        },
    });
}
