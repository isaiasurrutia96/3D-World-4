import {createProgress,updateProgress} from './progress.js';
import { angle, clamp, interpolate } from './math.js';
import { VEHICLE } from './vehicle.js';
export const MAX_GHOSTS = 4, MAX_GHOST_BYTES = 8000000;
const row = (t, p) => [t, p.x, p.y, p.z, p.yaw].map(v => Math.round(v * 10000) / 10000);
const pose = r => ({ x: r[1], y: r[2], z: r[3], yaw: r[4] });
export function createRecorder() { let start = null, last = null, frames = [], next = 0; return { start(time, p) { start = time; last = { time, pose: { ...p } }; frames = [row(0, p)]; next = 1 / 15; }, push(time, p) { if (start === null)
        return; while (next <= time - start + 1e-9) {
        const t = clamp((start + next - last.time) / (time - last.time || 1), 0, 1);
        frames.push(row(next, interpolate(last.pose, p, t)));
        next += 1 / 15;
    } last = { time, pose: { ...p } }; }, finish(time, p, track) { if (start === null)
        return null; this.push(time, p); const duration = time - start; if (Math.abs(frames.at(-1)[0] - duration) < .001)
        frames.pop(); frames.push(row(duration, p)); const result = { version: 1, track: track.key, duration, frames }; start = null; return result; }, stop() { start = null; frames = []; } }; }
export function validateGhost(record, track) {
    if (!record || record.version !== 1 || record.track !== track.key || !Number.isFinite(record.duration) || record.duration < track.length / VEHICLE.boostSpeed || record.duration > 1800 || !Array.isArray(record.frames) || record.frames.length < 2 || record.frames.length > 27002)
        throw Error('Invalid ghost header or track');
    let previous = null;
    for (const r of record.frames) {
        if (!Array.isArray(r) || r.length !== 5 || !r.every(Number.isFinite) || r[0] < 0 || r[0] > record.duration + .001 || previous && r[0] <= previous[0])
            throw Error('Invalid ghost frames');
        const p = track.project(pose(r));
        if (!p || p.off > track.outer + .5 || p.height > 1.25)
            throw Error('Ghost leaves road');
        if (previous && Math.hypot(r[1] - previous[1], r[2] - previous[2], r[3] - previous[3]) > VEHICLE.boostSpeed * (r[0] - previous[0]) + .2)
            throw Error('Ghost contains teleport');
        previous = r;
    }
    if (record.frames[0][0] !== 0 || Math.abs(previous[0] - record.duration) > .001)
        throw Error('Incomplete ghost');
    // Imported best laps must actually traverse all ordered gates, not merely
    // contain plausible stationary samples and a fast claimed duration.
    const progress=createProgress(track);progress.started=true;progress.expectedGate=1;
    for(let i=1;i<record.frames.length;i++) {
        const a=record.frames[i-1],b=record.frames[i],dt=b[0]-a[0];
        updateProgress(progress,track,{...pose(a),grounded:true,speed:0},{...pose(b),grounded:true,speed:0},dt,a[0],1);
        if(progress.invalidReason) throw Error('Ghost skips course progress');
    }
    if(!progress.laps&&!(progress.expectedGate===0&&progress.distance>=track.length-.1)) throw Error('Ghost has not completed a legal lap');
    return true;
}
export function sampleGhost(record, time) { if (!record || time < 0 || time > record.duration)
    return null; const rows = record.frames; let lo = 0, hi = rows.length - 1; while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid][0] <= time)
        lo = mid;
    else
        hi = mid;
} const a = rows[lo], b = rows[hi]; return interpolate(pose(a), pose(b), clamp((time - a[0]) / (b[0] - a[0] || 1), 0, 1)); }
export function createGhostStore(track, storage = null) {
    const key = `3d-world-4.ghosts.${track.key}`;
    let records = [];
    const merge = incoming => { const unique = new Map([...records, ...incoming].map(r => [JSON.stringify(r), r])); records = [...unique.values()].sort((a, b) => a.duration - b.duration).slice(0, MAX_GHOSTS); };
    try {
        const text = storage?.getItem(key);
        if (text) {
            if (text.length > MAX_GHOST_BYTES)
                throw Error('Oversize ghosts');
            const data = JSON.parse(text);
            if (!Array.isArray(data.records) || data.records.length > 4)
                throw Error('Invalid records');
            for (const r of data.records)
                validateGhost(r, track);
            merge(data.records);
        }
    }
    catch {
        records = [];
    }
    return { get records() { return records.slice(); }, save(record) { validateGhost(record, track); merge([record]); let persisted = false; try {
            if (storage) {
                storage.setItem(key, JSON.stringify({ version: 1, track: track.key, records }));
                persisted = true;
            }
        }
        catch { } return { persisted, rank: records.indexOf(record) + 1 || null }; }, export() { return JSON.stringify({ version: 1, track: track.key, records }); }, import(text) { if (typeof text !== 'string' || text.length > MAX_GHOST_BYTES)
            throw Error('Ghost file is too large'); const data = JSON.parse(text); if (data.version !== 1 || data.track !== track.key || !Array.isArray(data.records) || data.records.length > 4)
            throw Error('Wrong ghost track or version'); for (const r of data.records)
            validateGhost(r, track); merge(data.records); try {
            storage?.setItem(key, JSON.stringify({ version: 1, track: track.key, records }));
        }
        catch { } return records.length; } };
}
