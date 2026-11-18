// Skeleton · shoulders follow the arms.
//
// In a real body the collarbone moves with the arm: raise your arm high and
// the shoulder lifts a little; reach forward and the shoulder comes forward
// too. shoulderFollow(skeleton, pose) adds that to any pose, so poses only
// need to say where the arms go. The follow is added on top of whatever the
// pose sets for the collarbones (a shrug pose still shrugs), and the result
// stays inside the collarbone's limits.
//
// How much (his left side; the right is the mirror):
//   lift:    nothing until the arm is 60° up from hanging, then rising
//            evenly to the full shrug (4°) with the arm straight up (160°).
//   forward: nothing with the arms hanging (up to 20°), then up to the full
//            4° when the arm points straight ahead; less as it points up or out.
import {Euler, Vector3} from 'three';

const RAD = Math.PI / 180, DOWN = new Vector3(0, -1, 0);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const v = new Vector3(), e = new Euler();

/** Where the upper arm points (unit vector, avatar space) for its joint angles. */
function armDirection(a){
 return v.copy(DOWN).applyEuler(e.set(a.x * RAD, a.y * RAD, a.z * RAD, 'XYZ'));
}

/** Collarbone angles that go with this upper-arm angle, his left side. */
export function followAngles(arm){
 const d = armDirection(arm), raised = Math.acos(clamp(-d.y, -1, 1)) / RAD;
 const lift = 4 * clamp((raised - 60) / 100, 0, 1);
 const forward = 4 * clamp(d.z, 0, 1) * clamp((raised - 20) / 70, 0, 1);
 return {x: 0, y: -forward, z: lift};
}

/** The pose with the collarbones' follow added on top (kept inside their limits). */
export function shoulderFollow(skeleton, pose){
 const out = {...pose};
 for(const side of ['L', 'R']){
  const name = 'clavicle.' + side, own = pose[name] ?? {x: 0, y: 0, z: 0}, lim = skeleton.bones[skeleton.index.get(name)].limits;
  const arm = pose['upperArm.' + side] ?? skeleton.bones[skeleton.index.get('upperArm.' + side)].rest;
  // His right side: mirror the arm into his left, work it out, mirror back.
  const a = side === 'L' ? arm : {x: arm.x, y: -arm.y, z: -arm.z};
  const f = followAngles(a);
  const add = side === 'L' ? f : {x: f.x, y: -f.y, z: -f.z};
  out[name] = Object.fromEntries(['x', 'y', 'z'].map(k => [k, clamp(own[k] + add[k], lim[k][0], lim[k][1])]));
 }
 return out;
}
