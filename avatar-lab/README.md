# Assembled avatar

Saved as **Checkpoint 2** on 17 November 2026: `avatar-checkpoint-2-2026-11-17`. [Frozen preview](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/avatar-2/) · [Manifest](../checkpoints/avatar-2/CHECKPOINT.json).

The saved clay avatar, assembled with the latest rounded feet, separate ankle balls with foot/calf sockets, and hand/foot movement from the two labs. Open `/avatar-lab/` on desktop or phone. Use Hands and Feet to switch controls, Play motion to animate both, or Rest all to restore the saved shapes. Drag to orbit, pinch/scroll to zoom, and use Angle, Front, Side, Back or Top.

`src/avatar.js` reuses `createApprovedAvatar` without editing the approved checkpoint. All 11 upper-body, thigh, arm and hand meshes keep their geometry, material, poses and relative transforms. Only the original calves and feet are replaced. The model still has exactly 15 visible body meshes, with no extra joint balls. Feet retain their authored size; the opposite foot is mirrored so both big toes face inward.

Each fitted calf is mounted at the original knee contact. The body is grounded above the new fitted feet, without rescaling any part; measured rest height is about 1.895 m. Both feet move together, and the body translates with their calf tops, preserving knee contact during ankle poses and tiptoe. The front soles stay planted during tiptoe. The complete calves and their socket cups remain rigid; the feet rotate about the shared ankle-ball centers. Both ankle balls are exposed as lowerLegs[].ankleBall. The shared ankle contract doubles isolated ankle bend/tilt and enforces a geometry-tested60° combined point/heel limit.

The saved hands share geometry through mirrored mounts. The same observer used by Hand Lab captures their bind data without editing the hand generator, and the existing hand rig drives both in sync. Protected palm attachments stay fixed. Rest restores the position and normal buffers exactly.

This is the assembled movement viewer. Walking, leg IK, jumping/landing and locomotion foot locking are separate work; the game's movement runtime and the earlier saved avatar checkpoint are not replaced.

Build: `npm run build:avatar-lab` (also included in the project build). Test: `npm run test:avatar-lab`.
