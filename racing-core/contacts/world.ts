import type { Capsule, V2, Sweep } from './geometry.ts';
/** Adapter boundary: Claude's unfinished block engine is not imported or modified. */
export type BarrierHit = Readonly<{
    id: string;
    fraction: number;
    normal: V2;
    point: V2;
    depth: number;
}>;
export type BarrierWorld = Readonly<{
    sweep(body: Capsule, move: V2): readonly BarrierHit[];
    /** Penetrations AND resting contacts within 1 micrometre (depth 0).
     * Resting neighbors are needed to transmit an incoming kart's impulse. */
    overlaps(body: Capsule): readonly BarrierHit[];
}>;
export const NO_BARRIERS: BarrierWorld = Object.freeze({ sweep: () => Object.freeze([]), overlaps: () => Object.freeze([]) });
export type { Capsule, V2, Sweep };
