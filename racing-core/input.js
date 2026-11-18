import { clamp } from './math.js';
// Adapts the existing universal lab's input snapshot; no second device layer.
export function fromLabInput(sample, cameraYaw, { brake = false, boost = false } = {}) {
    const yaw=cameraYaw-(sample.look?.x??0),x=sample.moveX??0,z=sample.moveZ??0;
    let throttle=clamp(-x*Math.sin(yaw)-z*Math.cos(yaw),-1,1);
    let steer=clamp(-x*Math.cos(yaw)+z*Math.sin(yaw),-1,1);
    // Keyboard axes are independent; analog devices keep their real strength.
    if(sample.source==='keyboard'){throttle=Math.abs(throttle)>1e-6?Math.sign(throttle):0;steer=Math.abs(steer)>1e-6?Math.sign(steer):0;}
    return {throttle:throttle||0,steer:steer||0,brake,boost};
}
