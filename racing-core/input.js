import { clamp } from './math.js';
// Adapts the existing universal lab's input snapshot; no second device layer.
export function fromLabInput(sample, cameraYaw, { brake = false, boost = false } = {}) { const yaw = cameraYaw - (sample.look?.x ?? 0), x = sample.moveX ?? 0, z = sample.moveZ ?? 0; return { throttle: clamp(-x * Math.sin(yaw) - z * Math.cos(yaw), -1, 1), steer: clamp(x * Math.cos(yaw) - z * Math.sin(yaw), -1, 1), brake, boost }; }
