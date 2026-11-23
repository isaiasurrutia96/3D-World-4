import assert from 'node:assert/strict';
import test from 'node:test';
import { F1_2026_PROFILE } from '../kart/f1-2026-profile.ts';
import { GT3_PROFILE } from '../kart/gt3-profile.ts';
import { kartVelocity, KART } from '../kart/index.ts';
import { DRIVING_PROFILES, ORIGINAL_PROFILE } from '../kart/profiles.ts';
import { KART_PROTOTYPES, PROTOTYPE_HANDLING } from '../kart/prototypes.ts';
import { createDrivingTest } from './drive.ts';
import { NEIGHBORHOOD, NEIGHBORHOOD_WORLD } from './neighborhood.ts';

const { ground, streetCenters, roadHalfWidth } = NEIGHBORHOOD_WORLD.layout;
const paved = { grip: 1, speed: 1, resistance: 1 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

test('Neighborhood crossings are continuous paved unions on level ground', () => {
    const { heightAt, surfaceAt } = NEIGHBORHOOD_WORLD;
    const edges = [-roadHalfWidth - .01, -roadHalfWidth, 0, roadHalfWidth, roadHalfWidth + .01];
    for (const x of streetCenters) {
        for (const z of streetCenters) {
            for (const offset of edges) {
                assert.deepEqual(surfaceAt(x + offset, z, 0), paved);
                assert.deepEqual(surfaceAt(x, z + offset, 0), paved);
                assert.equal(heightAt(x + offset, z, 0), 0);
                assert.equal(heightAt(x, z + offset, 0), 0);
            }
        }
    }

    const between = (streetCenters[0] + streetCenters[1]) / 2;
    const streetEdge = streetCenters[1] - roadHalfWidth;
    assert.deepEqual(surfaceAt(streetEdge, between, 0), paved);
    const grass = surfaceAt(streetEdge - .01, between, 0);
    assert.ok(grass.grip < paved.grip && grass.resistance > paved.resistance);
    assert.equal(heightAt(streetEdge - .01, between, 0), 0);
    assert.equal(heightAt(ground.maxX, ground.maxZ, 0), 0);
    assert.equal(heightAt(ground.maxX + .01, ground.maxZ, 0), null);
    assert.equal(heightAt(0, 0, -.01), null);
});

test('Neighborhood preserves every kart choice and leaves race timing to circuits', () => {
    const choices = [
        [{}, ORIGINAL_PROFILE],
        [{ profile: 'fast' }, DRIVING_PROFILES.fast],
        [{ prototype: 'gokart' }, PROTOTYPE_HANDLING.gokart],
        [{ prototype: 'gt' }, PROTOTYPE_HANDLING.gt],
        [{ prototype: 'gt', gtTune: 'gt3' }, GT3_PROFILE],
        [{ prototype: 'f1' }, PROTOTYPE_HANDLING.f1],
        [{ prototype: 'f1', f1Tune: '2026' }, F1_2026_PROFILE],
    ];
    for (const [options, profile] of choices) {
        const driving = createDrivingTest(NEIGHBORHOOD, options);
        const start = driving.getState();
        assert.equal(driving.track, NEIGHBORHOOD_WORLD);
        assert.equal(start.selection, NEIGHBORHOOD);
        assert.equal(start.trackId, NEIGHBORHOOD);
        assert.equal(start.karts, 1);
        assert.equal(driving.controller.profile, profile);
        for (const [axis, coordinate] of Object.entries(driving.track.start.point)) {
            assert.equal(start.physics[axis], coordinate);
        }
        assert.equal(start.physics.yaw, driving.track.start.yaw);
        assert.equal(driving.lap, undefined);

        driving.advance(.25, { throttle: 1 });
        const running = driving.getState();
        assert.ok(running.physics.speed > 0 && running.physics.grounded);
        assert.equal(running.lap, undefined);
        driving.reset();
        assert.deepEqual(driving.getState(), start);

        driving.selectTrack('original');
        assert.equal(driving.getState().trackId, 'original');
        assert.equal(driving.controller.profile, profile);
        if (options.prototype) assert.equal(driving.lap.laps, 0);
        driving.advance(.25, { throttle: 1 });
        driving.selectTrack(NEIGHBORHOOD);
        assert.deepEqual(driving.getState(), start);
    }
});

function driveAcrossJunction(options, fps) {
    const driving = createDrivingTest(NEIGHBORHOOD, options);
    const geometry = options.prototype ? KART_PROTOTYPES[options.prototype] : KART;
    const usesBinaryThrottle = driving.controller.profile.mode === 'legacy';
    const { x: approachX } = driving.track.start.point;
    // Follow a 6.6 m radius inside the crossroads at about 14 km/h.
    const radius = 6.6, entryZ = -5.8, centerX = approachX - radius;
    const arcLength = radius * Math.PI / 2, exitZ = entryZ + radius;

    function target(state) {
        const angle = clamp(Math.atan2(state.z - entryZ, state.x - centerX), 0, Math.PI / 2);
        const station = state.z < entryZ ? state.z - entryZ
            : state.x >= centerX ? radius * angle : arcLength + centerX - state.x;
        const lookAhead = station + 2.8;
        if (lookAhead <= 0) return { x: approachX, z: entryZ + lookAhead };
        if (lookAhead >= arcLength) return { x: centerX + arcLength - lookAhead, z: exitZ };
        const nextAngle = lookAhead / radius;
        return { x: centerX + radius * Math.cos(nextAngle), z: entryZ + radius * Math.sin(nextAngle) };
    }

    function input(_tick, _time, state) {
        assert.ok(state.grounded);
        assert.equal(state.y, 0);
        assert.equal(state.verticalVelocity, 0);
        assert.equal(state.contacts, 0);
        assert.deepEqual(driving.track.surfaceAt(state.x, state.z, state.y), paved);
        const sin = Math.sin(state.yaw), cos = Math.cos(state.yaw);
        for (const axle of [geometry.frontProbe, -geometry.rearProbe]) {
            for (const side of [-geometry.halfTrackWidth, geometry.halfTrackWidth]) {
                const x = state.x + sin * axle + cos * side;
                const z = state.z + cos * axle - sin * side;
                assert.deepEqual(driving.track.surfaceAt(x, z, state.y), paved);
            }
        }
        const next = target(state);
        const bearing = Math.atan2(next.x - state.x, next.z - state.z);
        const steer = clamp(-4 * Math.sin(bearing - state.yaw), -1, 1);
        const throttle = usesBinaryThrottle ? Number(state.speed < 4) : clamp(.06 + .65 * (4 - state.speed), 0, .8);
        return { throttle, steer };
    }

    for (let frame = 0; frame < 12 * fps; frame++) driving.advance(1 / fps, input);
    const { physics, lap, clock } = driving.getState();
    const velocity = kartVelocity(physics);
    assert.ok(physics.x < -20 && Math.abs(physics.z) < roadHalfWidth - 1);
    assert.ok(velocity.x < -3 && Math.abs(velocity.z) < .5);
    assert.equal(physics.contacts, 0);
    assert.ok(physics.grounded);
    assert.equal(lap, undefined);
    assert.equal(clock.ticks, 1440);
    return physics;
}

test('Stock, GT3 and 2026 F1 can turn onto a crossing street at 30 and 144 Hz', () => {
    for (const options of [{}, { prototype: 'gt', gtTune: 'gt3' }, { prototype: 'f1', f1Tune: '2026' }]) {
        assert.deepEqual(driveAcrossJunction(options, 144), driveAcrossJunction(options, 30));
    }
});
