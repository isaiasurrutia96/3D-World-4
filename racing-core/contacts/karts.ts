/** Contact adapter for the checked handling kernel; no races, opponents, or device controls. */
import { prepareKartStep, finishKartStep, KART } from '../kart/index.ts';
import type { KartState, KartInput, KartMotion, KartMotionResolver, SurfaceWorld } from '../kart/index.ts';
import { solveKartContacts } from './index.ts';
import type { KartProfile, ProfileId } from '../kart/profiles.ts';
import { resolveKartProfile } from '../kart/profiles.ts';
import type { ContactBody, BarrierWorld } from './index.ts';
function body(id: string, motion: KartMotion): ContactBody {
    const s = motion.state;
    return { id, x: s.x, y: s.y, z: s.z, yaw: s.yaw, vx: motion.vx, vz: motion.vz, angularVelocity: s.impactYawRate, cooldown: s.railContactTime, recovery: s.impactRecovery };
}
function movement(result: ReturnType<typeof solveKartContacts>, id: string) {
    const b = result.bodies.find(b => b.id === id);
    if (!b)
        throw new Error('Missing contact body');
    return { x: b.x, z: b.z, vx: b.vx, vz: b.vz, impactYawRate: b.angularVelocity, railContactTime: b.cooldown, impactRecovery: b.recovery, contacts: result.events.filter(e => e.a === id || e.kind === 'kart' && e.b === id).length };
}
export function createKartContactResolver(barriers: BarrierWorld): KartMotionResolver {
    return motion => movement(solveKartContacts([body('kart', motion)], KART.step, barriers), 'kart');
}
export type KartTickEntry = Readonly<{
    id: string;
    state: KartState;
    input?: KartInput;
    activateBoost?: boolean;
    profile?: ProfileId | KartProfile;
}>;
/** One simultaneous 120 Hz tick for future race coordination. Does not create NPCs or race rules. */
export function stepContactKarts(entries: readonly KartTickEntry[], world: SurfaceWorld, barriers?: BarrierWorld) {
    const prepared = entries.map(e => ({ id: e.id, motion: prepareKartStep(e.state, e.input ?? {}, e.activateBoost ?? false, resolveKartProfile(e.profile), world) }));
    const solved = solveKartContacts(prepared.map(e => body(e.id, e.motion)), KART.step, barriers);
    const states = prepared.map(e => Object.freeze({ id: e.id, state: finishKartStep(e.motion, movement(solved, e.id), world) }));
    return Object.freeze({ states: Object.freeze(states), events: solved.events, iterations: solved.iterations });
}
