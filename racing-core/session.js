import { getTrack } from './track.js';
import { createVehicle, stepVehicle, resolveKartContact, normalizeInput, VEHICLE } from './vehicle.js';
import { createDriver, readDriver } from './driver.js';
import { createProgress, updateProgress, standings } from './progress.js';
import { createRecorder, createGhostStore } from './ghosts.js';
import { finite } from './math.js';
export function createRaceSession({ trackId = 'original', mode = 'race', laps = 3, countdown = 3, storage = null } = {}) {
    const track = getTrack(trackId);
    if (!['race', 'time-trial'].includes(mode) || !Number.isInteger(laps) || laps < 1 || laps > 9 || !Number.isFinite(countdown) || countdown < 0 || countdown > 10)
        throw new RangeError('Invalid race options');
    const specs = [{ id: 'player', lane: -3.3, pace: 1 }, ...(mode === 'race' ? [{ id: 'npc-1', lane: 3.3, pace: 1 }, { id: 'npc-2', lane: -3.3, pace: .98 }, { id: 'npc-3', lane: 3.3, pace: 1.02 }, { id: 'npc-4', lane: -3.3, pace: .96 }] : [])];
    const racers = specs.map((s, i) => { const distance = -8 * Math.floor((i + 1) / 2), p = track.at(distance, s.lane); return { id: s.id, state: createVehicle(p), progress: createProgress(track, distance), driver: s.id === 'player' ? null : createDriver(s), respawns: 0 }; });
    const player = racers[0], ghosts = createGhostStore(track, storage), recorder = createRecorder();
    let carry = 0, elapsed = 0, phase = 'grid', countdownLeft = countdown, totalTicks = 0;
    function start() { if (phase === 'grid')
        phase = countdownLeft > 0 ? 'countdown' : 'racing'; }
    function respawn(id = 'player') { const racer = racers.find(r => r.id === id); if (!racer)
        throw new RangeError('Unknown racer'); const distance = racer.progress.lastGateDistance, p = track.at(distance + 2, racer.driver?.lane ?? -3.3); const boosts=racer.state.boosts;Object.assign(racer.state, createVehicle(p));racer.state.boosts=boosts; racer.progress.distance = distance + 2; racer.progress.lastWrapped = ((distance + 2) % track.length + track.length) % track.length; racer.progress.invalidReason = ''; racer.progress.validForRecord = false; racer.respawns++; if (id === 'player')
        recorder.stop(); }
    function step(raw) {
        if (phase === 'grid' || phase === 'finished')
            return;
        if (phase === 'countdown') {
            countdownLeft = Math.max(0, countdownLeft - VEHICLE.step);
            if (countdownLeft < 1e-8) {
                countdownLeft = 0;
                phase = 'racing';
            }
            return;
        }
        const controls = normalizeInput(raw), previous = racers.map(r => ({ ...r.state })), traffic = racers.map(r => r.state), inputs = racers.map(r => r.progress.finishTime !== null ? { brake: true } : r.driver ? readDriver(r.driver, r.state, track, VEHICLE.step, traffic) : controls);
        racers.forEach((r, i) => stepVehicle(r.state, inputs[i], VEHICLE.step, track));
        for (let a = 0; a < racers.length; a++)
            for (let b = a + 1; b < racers.length; b++)
                resolveKartContact(racers[a].state, racers[b].state, track);
        for (let i = 0; i < racers.length; i++) {
            const r = racers[i], events = updateProgress(r.progress, track, previous[i], r.state, VEHICLE.step, elapsed, laps);
            if (r === player && mode === 'time-trial') {
                for (const event of events) {
                    if (event.type === 'start')
                        recorder.start(event.time, event.pose);
                    if (event.type === 'lap') {
                        const ghost = recorder.finish(event.time, event.pose, track);
                        if (event.valid && ghost)
                            ghosts.save(ghost);
                        if (r.progress.finishTime === null)
                            recorder.start(event.time, event.pose);
                    }
                    if (event.type === 'finish')
                        recorder.stop();
                }
                if (r.progress.validForRecord && !r.progress.invalidReason)
                    recorder.push(elapsed + VEHICLE.step, r.state);
                else
                    recorder.stop();
            }
        }
        elapsed += VEHICLE.step;
        totalTicks++;
        if (racers.every(r => r.progress.finishTime !== null))
            phase = 'finished';
    }
    function advance(seconds, input = {}) { finite(seconds, 'frameSeconds'); if (seconds < 0 || seconds > .25)
        throw new RangeError('Frame must be between 0 and 0.25 seconds'); carry += seconds; while (carry >= VEHICLE.step - 1e-10) {
        step(input);
        carry -= VEHICLE.step;
    } return getState(); }
    function getState() { return { trackId: track.id, mode, phase, countdownLeft, elapsed, totalTicks, standings: standings(racers), player: { ...player.state }, racers: racers.map(r => ({ id: r.id, state: { ...r.state }, progress: { ...r.progress, lapTimes: r.progress.lapTimes.slice() }, respawns: r.respawns })) }; }
    return { track, player, racers, ghosts, start, advance, respawn, getState };
}
