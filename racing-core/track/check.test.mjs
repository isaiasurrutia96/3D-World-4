import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createTrack, TRACK_IDS, SOURCE } from './index.ts';
import reference from './reference.json' with { type: 'json' };
const checks = [], trackMetrics = [], rates = [30, 60, 120, 144], tolerance = 1e-8;
const hash = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
const xyz = p => [p.x, p.y, p.z], distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const near = (actual, expected, epsilon = tolerance) => assert(Math.abs(actual - expected) <= epsilon, `${actual} differs from ${expected} by ${Math.abs(actual - expected)}`);
function check(track, rule, input, expected, measure, verify) {
    test((track || 'All tracks') + ': ' + rule, () => {
        let measured;
        try {
            measured = measure();
            verify(measured);
            checks.push({ track, rule, input, expected, measured, status: 'PASS' });
        }
        catch (error) {
            checks.push({ track, rule, input, expected, measured: measured ?? null, status: 'FAIL', error: error.message });
            throw error;
        }
    });
}
for (const id of TRACK_IDS) {
    const raw = reference.tracks.find(t => t.id === id), track = createTrack(id), candidate = createTrack(id, {}, { seam: 'weld' });
    trackMetrics.push({ id, name: track.name, segments: track.segments.length, rails: track.rails.length, roadWidth: track.halfWidth * 2, curbWidth: track.curbWidth, totalWidth: track.outer * 2, physicalLength: track.length, sourceLength: track.sourceLength, referenceEdgeGap: track.seamEdgeGap, proposedEdgeGap: candidate.seamEdgeGap, bridgeCrossings: raw.expected.crossings.length, referenceSeamStatus: track.seamEdgeGap <= tolerance ? 'PASS' : 'FAIL', proposedSeamStatus: candidate.seamEdgeGap <= tolerance ? 'PASS' : 'FAIL' });
    check(id, 'Road corners and wall endpoints exactly match the pinned source', 'Hash every double-precision road corner and rail endpoint, without rounding.', 'Both SHA256 digests equal the independent source capture.', () => ({ road: hash(track.segments.map(s => s.corners.map(xyz))), walls: hash(track.rails.map(r => [...xyz(r.a), ...xyz(r.b)])) }), m => { assert.equal(m.road, raw.expected.roadCornersSHA256); assert.equal(m.walls, raw.expected.railsSHA256); });
    check(id, 'Road width, height and triangle data are finite and nondegenerate', 'Visit every road segment and its four corners.', 'Asphalt is 26 m wide, each curb is 1.1 m, total is 28.2 m; both triangle areas are positive.', () => {
        let widthError = 0, minArea = Infinity, nonFinite = 0;
        for (const s of track.segments) {
            for (const p of [s.a, s.b, ...s.corners])
                for (const v of xyz(p))
                    if (!Number.isFinite(v))
                        nonFinite++;
            widthError = Math.max(widthError, Math.abs(distance(s.corners[0], s.corners[3]) - 28.2), Math.abs(distance(s.corners[1], s.corners[2]) - 28.2));
            for (const [a, b, c] of s.triangles)
                minArea = Math.min(minArea, Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) / 2);
        }
        return { asphaltWidth: track.halfWidth * 2, curbWidth: track.curbWidth, maximumWidthError: widthError, minTriangleArea: minArea, nonFinite };
    }, m => { assert.equal(m.asphaltWidth, 26); assert.equal(m.curbWidth, 1.1); near(m.maximumWidthError, 0); assert(m.minTriangleArea > 1e-8); assert.equal(m.nonFinite, 0); });
    check(id, 'Centerline joins close and distance sampling wraps consistently', 'Compare every consecutive centerline endpoint and sample negative, zero and multi-lap distances.', 'Zero centerline gap; identical wrapped positions to 0.00000001 m; sample(0) is the original start.', () => {
        let maximumJoinGap = 0, maximumWrapError = 0;
        for (let j = 0; j < track.segments.length; j++)
            maximumJoinGap = Math.max(maximumJoinGap, distance(track.segments[j].b, track.segments[(j + 1) % track.segments.length].a));
        for (const fraction of [0, .17, .5, .91])
            for (const turns of [-3, -1, 1, 4])
                maximumWrapError = Math.max(maximumWrapError, distance(track.sample(track.length * fraction).point, track.sample(track.length * (fraction + turns)).point));
        return { maximumJoinGap, maximumWrapError, startError: distance(track.sample(0).point, track.start.point) };
    }, m => { near(m.maximumJoinGap, 0); near(m.maximumWrapError, 0); near(m.startError, 0); });
    check(id, 'Every road segment supports interior probes along its length', 'Probe each segment at t=0, 0.5 and 0.999 and at 2%, 50% and 98% across its four-corner strip.', 'Every one of the scripted strip-interior points has road support below its interpolated height + 0.65 m.', () => {
        let probes = 0, missing = 0;
        const mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
        for (const segment of track.segments)
            for (const t of [0, .5, .999])
                for (const lateral of [.02, .5, .98]) {
                    const [a, b, c, d] = segment.corners, p = mix(mix(a, b, t), mix(d, c, t), lateral);
                    probes++;
                    if (track.roadHeightAt(p.x, p.z, p.y + .65) === null)
                        missing++;
                }
        return { probes, missing };
    }, m => assert.equal(m.missing, 0));
    check(id, 'Road-height queries match independently captured source results', 'Probe source segments every 19 samples at five lateral positions and a maximum height of road + 0.65 m.', 'Every supported height matches to 0.00000001 m; every empty result agrees.', () => {
        let maximumError = 0, mismatches = 0;
        for (const [x, z, max, expected] of raw.expected.probes) {
            const actual = track.roadHeightAt(x, z, max);
            if (actual === null || expected === null) {
                if (actual !== expected)
                    mismatches++;
            }
            else
                maximumError = Math.max(maximumError, Math.abs(actual - expected));
        }
        return { probes: raw.expected.probes.length, maximumError, mismatches };
    }, m => { near(m.maximumError, 0); assert.equal(m.mismatches, 0); });
    check(id, 'Bridge crossings keep their lower and upper road surfaces separate', 'At every source centerline crossing separated by at least 4 m, query below and above the upper deck.', 'Both source heights match; the lower query never jumps to the upper deck.', () => {
        let maximumError = 0, wrongDeck = 0;
        for (const c of raw.expected.crossings) {
            assert.notEqual(c.lowerSupport, null);
            assert.notEqual(c.upperSupport, null);
            const low = track.roadHeightAt(c.x, c.z, c.low + .65), high = track.roadHeightAt(c.x, c.z, c.high + .65);
            assert.notEqual(low, null);
            assert.notEqual(high, null);
            maximumError = Math.max(maximumError, Math.abs(low - c.lowerSupport), Math.abs(high - c.upperSupport));
            if (high - low < 3)
                wrongDeck++;
        }
        return { crossings: raw.expected.crossings.length, maximumError, wrongDeck };
    }, m => { assert(m.crossings > 0); near(m.maximumError, 0); assert.equal(m.wrongDeck, 0); });
    check(id, 'All 13 gates retain their source positions, directions and order', 'Read each source gate and map its source station onto the physical polyline.', '13 gates; zero position/direction error; strictly increasing physical distances starting at 0.', () => {
        let positionError = 0, directionError = 0;
        for (let i = 0; i < 13; i++) {
            const gate = track.gates[i], r = raw.gates[i];
            positionError = Math.max(positionError, distance(gate.center, { x: r[0], y: r[1], z: r[2] }));
            directionError = Math.max(directionError, Math.abs(gate.forward.x - r[3]), Math.abs(gate.forward.z - r[4]));
            if (i)
                assert(gate.distance > track.gates[i - 1].distance);
            assert(gate.distance < track.length);
        }
        return { count: track.gates.length, positionError, directionError, firstDistance: track.gates[0].distance };
    }, m => { assert.equal(m.count, 13); near(m.positionError, 0); near(m.directionError, 0); assert.equal(m.firstDistance, 0); });
    check(id, 'Directed gate sweeps agree at 30, 60, 120 and 144 FPS', 'At each FPS, move a point at 180 mph straight through every gate for two seconds. Also sweep backward, too high and outside the gate. No vehicle simulation is used.', 'One forward crossing per gate at t=1 s, identical hit points and times at every FPS; zero invalid crossings.', () => {
        const speed = 180 * .44704, byRate = [];
        let rejected = 0, maximumTimeError = 0, maximumPositionError = 0;
        for (const fps of rates) {
            const times = [];
            for (const gate of track.gates) {
                const at = t => ({ x: gate.center.x + gate.forward.x * speed * (t - 1), y: gate.center.y, z: gate.center.z + gate.forward.z * speed * (t - 1) });
                let hits = 0;
                for (let frame = 1; frame <= fps * 2; frame++) {
                    const hit = track.crossGate(gate.index, at((frame - 1) / fps), at(frame / fps));
                    if (hit) {
                        hits++;
                        const time = (frame - 1 + hit.fraction) / fps;
                        times.push(time);
                        maximumTimeError = Math.max(maximumTimeError, Math.abs(time - 1));
                        maximumPositionError = Math.max(maximumPositionError, distance(hit.point, gate.center));
                    }
                }
                assert.equal(hits, 1);
                const a = at(0), b = at(2), shift = p => ({ ...p, x: p.x + gate.forward.z * (gate.halfWidth + 1), z: p.z - gate.forward.x * (gate.halfWidth + 1) });
                for (const hit of [track.crossGate(gate.index, b, a), track.crossGate(gate.index, { ...a, y: a.y + 5 }, { ...b, y: b.y + 5 }), track.crossGate(gate.index, shift(a), shift(b))]) {
                    assert.equal(hit, null);
                    rejected++;
                }
            }
            byRate.push({ fps, forwardCrossings: times.length, earliest: Math.min(...times), latest: Math.max(...times) });
        }
        return { byRate, maximumTimeError, maximumPositionError, rejected };
    }, m => { near(m.maximumTimeError, 0, 1e-10); near(m.maximumPositionError, 0); assert.equal(m.rejected, 13 * 3 * 4); });
    check(id, 'Road, access bridge and intentional wall openings stay distinct', 'Check the access bridge center and far-away empty space, then query every wall midpoint.', 'Bridge supports its source height; empty space has no floor; all rail midpoints are found on their own deck.', () => {
        const a = raw.access, x = (a.minX + a.maxX) / 2, z = (a.minZ + a.maxZ) / 2;
        const bridge = track.heightAt(x, z, a.height + .01), empty = track.heightAt(track.bounds.max.x + 1000, track.bounds.max.z + 1000);
        let missing = 0, maxWallError = 0;
        for (const rail of track.rails) {
            const p = { x: (rail.a.x + rail.b.x) / 2, y: (rail.a.y + rail.b.y) / 2 + .5, z: (rail.a.z + rail.b.z) / 2 }, hit = track.nearestWall(p, .001);
            if (!hit)
                missing++;
            else
                maxWallError = Math.max(maxWallError, hit.distance);
        }
        return { bridge, expectedBridge: a.height, empty, railMidpoints: track.rails.length, missing, maxWallError };
    }, m => { near(m.bridge, m.expectedBridge); assert.equal(m.empty, null); assert.equal(m.missing, 0); near(m.maxWallError, 0); });
    check(id, 'A translated and rotated island placement preserves road geometry', 'Translate by (1234,70,-890) m and rotate by 0.7 radians; sample 60 locations around the loop.', 'Sample positions, road heights and projection distances agree after the same transform; no voxel-grid rounding.', () => {
        const angle = .7, sin = Math.sin(angle), cos = Math.cos(angle), placed = createTrack(id, { x: 1234, y: 70, z: -890, yaw: angle });
        let maximumError = 0;
        for (let i = 0; i < 60; i++) {
            const d = (i + .37) / 60 * track.length, base = track.sample(d), p = placed.sample(d), wanted = { x: base.point.x * cos + base.point.z * sin + 1234, y: base.point.y + 70, z: base.point.z * cos - base.point.x * sin - 890 };
            maximumError = Math.max(maximumError, distance(p.point, wanted));
            const h = track.roadHeightAt(base.point.x, base.point.z, base.point.y + .65), h2 = placed.roadHeightAt(p.point.x, p.point.z, p.point.y + .65);
            assert.notEqual(h, null);
            assert.notEqual(h2, null);
            maximumError = Math.max(maximumError, Math.abs(h2 - h - 70));
            const q = placed.project(p.point, { hintDistance: d, maxDelta: 2 });
            assert(q);
            maximumError = Math.max(maximumError, Math.abs(q.distance - d));
        }
        return { positions: 60, maximumError };
    }, m => near(m.maximumError, 0, 1e-6));
    check(id, 'Projection can stay on the intended route at a crossing', 'Project each crossing position with separate hints for its two source segments.', 'Both branch hints return their own segment and height; a tiny impossible progress window returns null.', () => {
        let checks = 0;
        for (const c of raw.expected.crossings) {
            for (const y of [c.low, c.high]) {
                const p = { x: c.x, y, z: c.z }, q = track.project(p);
                assert(q);
                assert(Math.abs(q.heightError) < .05);
                const again = track.project(p, { hintDistance: q.distance, maxDelta: 2 });
                assert(again);
                assert.equal(again.segmentIndex, q.segmentIndex);
                checks++;
            }
        }
        const p = track.sample(track.length * .4).point;
        assert.equal(track.project(p, { hintDistance: 0, maxDelta: .001 }), null);
        return { branchChecks: checks };
    }, m => assert(m.branchChecks >= 2));
    check(id, 'Reference seam mismatch is measured; the proposed weld closes only the seam', 'Compare reference mode against the explicit, unapproved seam-weld option.', 'Welded edge gap is zero; route length, centerline and every gate stay unchanged. Maximum edit is under 5 cm.', () => {
        let changedCorners = 0, maximumRoadEdit = 0, changedWallEnds = 0, maximumWallEdit = 0;
        for (let i = 0; i < track.segments.length; i++)
            for (let j = 0; j < 4; j++) {
                const d = distance(track.segments[i].corners[j], candidate.segments[i].corners[j]);
                if (d > 1e-12)
                    changedCorners++;
                maximumRoadEdit = Math.max(maximumRoadEdit, d);
            }
        for (let i = 0; i < track.rails.length; i++) {
            const d = distance(track.rails[i].b, candidate.rails[i].b);
            if (d > 1e-12)
                changedWallEnds++;
            maximumWallEdit = Math.max(maximumWallEdit, d);
        }
        assert.equal(track.length, candidate.length);
        for (let i = 0; i < 13; i++)
            assert.deepEqual(track.gates[i], candidate.gates[i]);
        for (let i = 0; i < track.segments.length; i++)
            assert.deepEqual(track.segments[i].a, candidate.segments[i].a);
        return { referenceEdgeGap: track.seamEdgeGap, proposedEdgeGap: candidate.seamEdgeGap, changedCorners, maximumRoadEdit, changedWallEnds, maximumWallEdit, enabledByDefault: track.seamMode };
    }, m => { near(m.proposedEdgeGap, 0); assert.equal(m.enabledByDefault, 'reference'); assert(m.maximumRoadEdit < .05 && m.maximumWallEdit < .05); assert.equal(m.changedCorners, id === 'original' ? 2 : 0); assert.equal(m.changedWallEnds, id === 'original' ? 2 : 0); });
}
check(null, 'Fresh track TypeScript passes strict checking without a browser library', 'Run the TypeScript compiler on track/tsconfig.json with ES2022 libraries and strict checking.', 'Compiler exits successfully with zero diagnostics.', () => {
    const diagnostics = execFileSync(process.execPath, [fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url)), '-p', fileURLToPath(new URL('./tsconfig.json', import.meta.url))], { encoding: 'utf8', timeout: 30000 });
    return { diagnostics: diagnostics.trim().length };
}, m => assert.equal(m.diagnostics, 0));
check(null, 'Invalid inputs fail explicitly and exposed geometry cannot be changed', 'Try missing tracks, NaN/Infinity coordinates, invalid gate indexes, invalid placement, and negative search radii.', 'All invalid requests throw; public geometry is frozen.', () => {
    const t = createTrack('original');
    let rejected = 0;
    const invalid = [() => createTrack('missing'), () => createTrack('original', { x: NaN }), () => createTrack('original', {}, { seam: 'guess' }), () => t.sample(Infinity), () => t.heightAt(NaN, 0), () => t.heightAt(0, 0, NaN), () => t.project({ x: 0, y: Infinity, z: 0 }), () => t.project({ x: 0, y: 0, z: 0 }, { maxDelta: -1 }), () => t.nearestWall({ x: 0, y: 0, z: 0 }, -1), () => t.crossGate(13, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), () => { t.segments[0].corners[0].x = 99; }, () => { t.rails.push({}); }];
    for (const operation of invalid) {
        assert.throws(operation);
        rejected++;
    }
    return { rejected };
}, m => assert.equal(m.rejected, 12));
test.after(() => {
    const result = { section: 1, source: SOURCE, referenceDataSHA256: createHash('sha256').update(readFileSync(new URL('./reference.json', import.meta.url))).digest('hex'), fps: rates, approval: 'Awaiting owner review; seam repair is proposed, not enabled.', summary: { passed: checks.filter(c => c.status === 'PASS').length, failed: checks.filter(c => c.status === 'FAIL').length }, tracks: trackMetrics, checks };
    writeFileSync(new URL('./CHECK-RESULTS.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
    const n = value => Number(value.toFixed(9));
    let md = '# Track layer 1: measured results\n\nThis is track logic only. No avatar, kart handling, visual preview or later racing layer is approved by these checks.\n\nSource: LetsGo Racing `' + SOURCE.revision + '`. Every rule below is executed in Node.\n\n';
    md += '| Track | Road segments | Rails | Physical length (m) | Source station length (m) | Source seam gap (m) | Proposed seam gap (m) | Source seam closed? |\n|---|---:|---:|---:|---:|---:|---:|---|\n';
    for (const t of trackMetrics)
        md += `| ${t.name} | ${t.segments} | ${t.rails} | ${n(t.physicalLength)} | ${n(t.sourceLength)} | ${n(t.referenceEdgeGap)} | ${n(t.proposedEdgeGap)} | ${t.referenceSeamStatus} |\n`;
    md += '\nThe source station length comes from its spline lookup table. Physical length is measured along the actual 3D road samples; gates keep their exact source positions.\n\n';
    md += '**Open decision:** Original Circuit has a 0.046163501 m (4.62 cm) road-edge seam mismatch in the source. Its centerline closes. Reference mode preserves it. The tested weld option closes that seam and adjusts two rail endpoints by at most 4.67 cm, without moving the centerline or gates. The repair is not enabled by default and needs owner approval. The other three seams are already closed.\n\n';
    md += `**Node verification: ${result.summary.passed} PASS, ${result.summary.failed} FAIL.** This verifies the recorded reference issue and the candidate repair; it does not mean the reference seam is watertight.\n\n`;
    for (const c of checks)
        md += `### ${c.track || 'All tracks'} — ${c.rule}\n\n- Rule: ${c.expected}\n- Scripted input: ${c.input}\n- Measured result: \`${JSON.stringify(c.measured)}\`\n- **${c.status}**${c.error ? ': ' + c.error : ''}\n\n`;
    md += 'Frame-rate checks sweep geometric probes, not karts. Vehicle timing, contact response, race scoring, AI, ghosts, device hardware and final appearance remain unproven in this fresh rebuild.\n';
    writeFileSync(new URL('./CHECK-RESULTS.md', import.meta.url), md);
});
