import { wrap, interpolate } from './math.js';
import { VEHICLE } from './vehicle.js';
export function createProgress(track, startDistance = 0) { return { distance: startDistance, lastWrapped: wrap(startDistance, track.length), expectedGate: 0, lastGateDistance: startDistance, started: false, laps: 0, lapStart: 0, finishTime: null, lapTimes: [], validForRecord: true, invalidReason: '', wrongWay: false }; }
function cross(gate, a, b, width) { const before = (a.x - gate.x) * gate.fx + (a.z - gate.z) * gate.fz, after = (b.x - gate.x) * gate.fx + (b.z - gate.z) * gate.fz; if (before > 1e-7 || after <= 0 || after - before < 1e-9)
    return null; const t = Math.max(0, Math.min(1, -before / (after - before))), p = interpolate(a, b, t); return Math.abs((p.x - gate.x) * gate.nx + (p.z - gate.z) * gate.nz) <= width && Math.abs(p.y - gate.y) < 1.25 ? t : null; }
export function updateProgress(p, track, previous, current, dt, elapsed, lapCount) {
    if (p.finishTime !== null || p.invalidReason)
        return [];
    const travel = Math.hypot(current.x - previous.x, current.y - previous.y, current.z - previous.z), projection = track.project(current, p.distance, travel * 3 + 2);
    if (!projection || projection.off > track.outer + .3 || projection.height > .9 || !current.grounded || travel > VEHICLE.boostSpeed * dt + .12) {
        p.invalidReason = 'Off course or impossible movement';
        p.validForRecord = false;
        return [];
    }
    let delta = wrap(projection.distance - p.lastWrapped + track.length / 2, track.length) - track.length / 2;
    if (Math.abs(delta) > travel * 3 + 2.01) {
        p.invalidReason = 'Course branch skipped';
        p.validForRecord = false;
        return [];
    }
    p.distance += delta;
    p.lastWrapped = projection.distance;
    p.wrongWay = current.speed > 1 && (Math.sin(current.yaw) * projection.fx + Math.cos(current.yaw) * projection.fz) < -.25;
    const gate = track.gates[p.expectedGate], hit = cross(gate, previous, current, track.outer + .2);
    if (hit === null)
        return [];
    // Geometric gate crossing alone is insufficient at a self-crossing.
    const base = Math.floor((p.distance - gate.distance + track.length / 2) / track.length) * track.length + gate.distance;
    if (Math.abs(p.distance - base) > Math.max(6, travel * 2))
        return [];
    const time = elapsed + dt * hit, pose = interpolate(previous, current, hit), events = [];
    p.lastGateDistance = base;
    if (p.expectedGate === 0) {
        if (!p.started) {
            p.started = true;
            p.lapStart = time;
            events.push({ type: 'start', time, pose });
        }
        else {
            const duration = time - p.lapStart;
            p.laps++;
            p.lapTimes.push(duration);
            events.push({ type: 'lap', time, pose, duration, valid: p.validForRecord });
            p.lapStart = time;
            p.validForRecord = true;
            if (p.laps >= lapCount) {
                p.finishTime = time;
                events.push({ type: 'finish', time, pose });
            }
        }
    }
    p.expectedGate = (p.expectedGate + 1) % track.gates.length;
    return events;
}
export function standings(racers) { return [...racers].sort((a, b) => { const af = a.progress.finishTime, bf = b.progress.finishTime; if (af !== null || bf !== null)
    return af === null ? 1 : bf === null ? -1 : af - bf || a.id.localeCompare(b.id); return b.progress.distance - a.progress.distance || a.id.localeCompare(b.id); }).map((r, i) => ({ id: r.id, position: i + 1, laps: r.progress.laps, distance: r.progress.distance, finishTime: r.progress.finishTime, invalidReason: r.progress.invalidReason, wrongWay: r.progress.wrongWay })); }
