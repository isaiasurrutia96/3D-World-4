import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Vector3 } from 'three';
import { buildKartPrototype } from '../../kart-parts/product-prototypes.js';
import { KART_PROTOTYPES, PROTOTYPE_HANDLING } from '../kart/prototypes.ts';
import { PREVIOUS_FAST_PROFILE, steeringLimit, steeringResponse } from '../kart/profiles.ts';
import { createDrivingTest, PARKED_KARTS } from './drive.ts';

const ids = ['gokart', 'gt', 'f1'];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-4, `${a} should match ${b}`);

test('Prototype meshes and fixed-step geometry use the selected size and axle stations', () => {
    const expected = [[1.35, 2.35, 1.46], [2.19, 3.25, 2.10], [2.02, 4.60, 3.04]];
    for (const [i, id] of ids.entries()) {
        const { root, wheels, dimensions } = buildKartPrototype(id);
        const bounds = new Box3().setFromObject(root, true);
        const size = bounds.getSize(new Vector3());
        near(size.x, expected[i][0]);
        near(size.z, expected[i][1]);
        near(size.y, dimensions.height);
        near(bounds.min.y, 0);
        near(bounds.min.z, dimensions.tail);
        near(bounds.max.z, dimensions.nose);
        assert.equal(wheels.length, 4);
        for (const wheel of wheels) {
            const front = wheel.name.startsWith('wheel-front');
            near(wheel.position.z, front ? dimensions.frontProbe : -dimensions.rearProbe);
            near(wheel.position.y, dimensions[front ? 'frontTire' : 'rearTire'].radius);
        }
        const wheelbase = wheels[0].position.z - wheels[2].position.z;
        near(wheelbase, expected[i][2]);
        assert(root.getObjectByName('part:sidePanels'));
        assert(root.getObjectByName('part:seat'));
    }
    assert.equal(PROTOTYPE_HANDLING.f1, PREVIOUS_FAST_PROFILE);
});

function replayLap(prototype, fps) {
    const driving = createDrivingTest('original', { prototype });
    const { track } = driving, profile = driving.controller.profile;
    const wheelbase = KART_PROTOTYPES[prototype].wheelbase;
    let station = -4.5;

    function input(_tick, _seconds, state) {
        const position = track.project(state, { hintDistance: station, maxDelta: 30 });
        assert(position);
        const d = position.distance - station;
        station += d - Math.round(d / track.length) * track.length;
        const speed = Math.hypot(state.speed, state.lateralSpeed);
        const { point } = track.sample(station + 8 + speed * .42);
        const error = Math.atan2(point.x - state.x, point.z - state.z) - state.yaw;
        const distance = Math.hypot(point.x - state.x, point.z - state.z);
        const angle = Math.atan(wheelbase * 2 * Math.sin(error) / distance);
        const steer = Math.pow(Math.abs(angle) / steeringLimit(profile, speed, wheelbase), 1 / steeringResponse(profile, speed).exponent);
        return { throttle: speed < 14 ? Math.min(1, (14 - speed) / 4 + .22) : 0,
            brakeAmount: speed > 15 ? Math.min(1, (speed - 15) / 6) : 0,
            steer: -Math.sign(angle) * Math.min(1, steer) };
    }
    for (let frame = 0; frame < fps * (Math.ceil(track.length / 12) + 30) && driving.lap.laps === 0; frame++) {
        driving.advance(1 / fps, input);
        assert(driving.controller.state.grounded);
    }

    assert.equal(driving.lap.laps, 1, `${prototype} must complete a timed lap`);
    assert(driving.lap.best > 0);
    assert.equal(driving.lap.last, driving.lap.best);
    assert.equal(driving.getState().prototype, prototype);
    assert.equal(driving.getState().fingerprint, PROTOTYPE_HANDLING[prototype].fingerprint);
    const time = driving.lap.best;
    driving.reset();
    assert.equal(driving.lap.best, null);
    assert.equal(driving.lap.running, false);

    driving.selectTrack(PARKED_KARTS);
    assert.equal(driving.lap, undefined);
    assert.equal(driving.getState().karts, 3);
    driving.selectTrack('original');
    assert.equal(driving.getState().prototype, prototype);
    return time;
}

for (const id of ids) {
    test(`${id} races a complete lap and records the same time at 30 and 144 Hz`, () => {
        assert.equal(replayLap(id, 30), replayLap(id, 144));
    });
}
