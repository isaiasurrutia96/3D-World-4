import { KART } from '../kart/index.ts';
import type { KartState } from '../kart/index.ts';
import type { createTrack } from '../track/index.ts';

export function createPrototypeLapClock(track: ReturnType<typeof createTrack>) {
    let gate = 0, start: number | null = null, last: number | null = null, best: number | null = null, laps = 0, valid = true;

    function observe(from: KartState, firstTick: number, states: readonly KartState[]) {
        let previous = from;
        for (const [i, state] of states.entries()) {
            const crossing = state.grounded && previous.grounded ? track.crossGate(gate, previous, state) : null;
            previous = state;
            if (!state.grounded) valid = false;
            if (!crossing) continue;

            if (gate === 0) {
                const time = (firstTick + i + crossing.fraction) * KART.step;
                if (start !== null && valid) {
                    last = time - start;
                    best = best === null ? last : Math.min(best, last);
                    laps++;
                }
                start = time;
                valid = true;
            }
            gate = (gate + 1) % track.gates.length;
        }
    }

    return {
        observe,
        read(seconds: number) { return { running: start !== null, elapsed: start === null ? 0 : seconds - start, last, best, laps, valid }; },
        reset() { gate = 0; start = last = best = null; laps = 0; valid = true; },
    };
}
