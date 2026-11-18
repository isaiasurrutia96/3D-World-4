import * as T from 'three';
import { createKartFrame } from './reference-kart.js';
/** Exact original model; presentation reads the checked/interpolated state only. */
export function createOriginalKartView() {
    const root = createKartFrame(), wheels = [];
    root.name = 'Driving test kart';
    for (const axle of ['front_axle', 'rear_axle'])
        for (const side of ['left', 'right'])
            wheels.push({ node: root.getObjectByName(`${axle}_${side}_wheel`), front: axle === 'front_axle', side });
    const steering = root.getObjectByName('steering_wheel'), rest = steering.quaternion.clone(), spin = new T.Quaternion(), axis = new T.Vector3(0, 0, 1);
    function update(state) {
        root.position.set(state.x, state.y, state.z);
        root.rotation.set(state.pitch, state.yaw, state.bank, 'YXZ');
        const center = -state.steering, sign = Math.sign(center), radius = Math.abs(center) < 1e-8 ? Infinity : 2.03 / Math.tan(Math.abs(center)), inner = Math.atan2(2.03, Math.max(.01, radius - 1.04)), outer = Math.atan2(2.03, radius + 1.04);
        const angles = { left: sign * (sign < 0 ? inner : outer), right: sign * (sign > 0 ? inner : outer) };
        for (const w of wheels)
            w.node.rotation.set(state.wheelRotation, w.front ? angles[w.side] : 0, 0, 'YXZ');
        steering.quaternion.copy(rest).multiply(spin.setFromAxisAngle(axis, -state.steering * 2.5));
    }
    return { root, update, wheels };
}
