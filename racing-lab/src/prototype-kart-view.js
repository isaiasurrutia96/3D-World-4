import { Quaternion, Vector3 } from 'three';
import { buildKartPrototype } from '../../kart-parts/product-prototypes.js';

export function createPrototypeKartView(id) {
    const { root, wheels: nodes, dimensions, steering } = buildKartPrototype(id);
    const wheels = nodes.map(node => ({
        node, front: node.name.startsWith('wheel-front'), left: node.position.x < 0,
    }));
    const steeringRest = steering.quaternion.clone();
    const spin = new Quaternion(), steeringAxis = new Vector3(0, 0, 1);
    const eye = { eyeHeight: dimensions.hip.y + Math.cos(dimensions.hip.recline) * .86,
        eyeForward: dimensions.hip.z - Math.sin(dimensions.hip.recline) * .64 };
    function update(state) {
        root.position.set(state.x, state.y, state.z);
        root.rotation.set(state.pitch, state.yaw, state.bank, 'YXZ');
        const sign = Math.sign(-state.steering);
        const { wheelbase, frontTire, rearTire } = dimensions;
        const radius = sign === 0 ? Infinity : wheelbase / Math.tan(Math.abs(state.steering));
        const inner = Math.atan2(wheelbase, Math.max(.01, radius - frontTire.halfTrack));
        const outer = Math.atan2(wheelbase, radius + frontTire.halfTrack);
        for (const wheel of wheels) {
            const ratio = wheel.front ? rearTire.radius / frontTire.radius : 1;
            const yaw = wheel.front ? sign * ((sign < 0) === wheel.left ? inner : outer) : 0;
            wheel.node.rotation.set(state.wheelRotation * ratio, yaw, 0, 'YXZ');
        }
        steering.quaternion.copy(steeringRest).multiply(spin.setFromAxisAngle(steeringAxis, -state.steering * 2.5));
    }
    return { root, update, wheels, eye, dimensions };
}
