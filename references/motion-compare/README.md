# Synchronized motion comparison

The owner found the previous avatar preview looked like walking while the Mario reference looked like running. The earlier retarget used its own stance, knee recovery and hip-height curves, so equal clip durations did not make the movements comparable.

This version pairs original source frame `f` with avatar frame `f`. Legs keep the original source directions, including full knee folding and recovery, without independent phase offsets or attenuation. Hip bounce follows the original curve scaled to the avatar's measured leg length. Saved mesh generators and limb lengths are unchanged. Both characters perform the animation in place; this is a pose comparison before gameplay foot locking and steering.

The requested refinements add about 8 degrees of forward torso lean, with the arms tucked closer to the sides and following that lean, and up to 30 degrees of smooth ball-of-foot bending during push-off. The source foot pitch and ankle contact stay seated: the toe bend counteracts part of the toe-down angle as the heel rises, then releases as the foot lifts. Only the foot ball and existing socket lip deform; the calf shaft stays rigid. The arms retain their forward/back swing angles and timing while lateral flare is reduced; shoulder positions and limb lengths remain fixed. Mario's original reference motion is preserved for comparison.

Running hands use a gentle curl through the existing Hand Lab rig, with a little thumb opposition and finger adduction. The accepted palm/socket vertices stay fixed. Each hand has its own geometry and pose controller, so a held-object grip can override one hand without changing the other; advancing the running animation never resets that grip. Capture and geometry tests use the same bind-observer build plugin as Avatar Lab, leaving the approved generator unchanged.

Arm swing is 15% smaller around its original mean, preserving cadence and elbow bending. Future carrying/aiming should blend or override this empty-hand arm layer, attach props to the relevant hand transform, and add second-hand IK for two-handed objects while locomotion continues.

`../avatar-walk/matched.js` constructs this independent comparison model. The old avatar preview and saved checkpoint remain available. `/references/motion-compare/` offers Side, Front and Feet close-up. Each camera has one composite video and a shared player, keeping both characters synchronized through playback, pausing, seeking and speed changes. Camera switching preserves time, pause state and playback speed. Normal playback uses the same 90 source frames/second as the original Mario clip; Slow halves both together.

Reproduce from the repository root, with the previously extracted Mario data and textures from `../sm64-walk/` in `/tmp/sm64-reference-render/`:

```sh
node references/motion-compare/test.mjs
node references/motion-compare/capture.mjs
node references/motion-compare/encode.mjs
npm run build
node references/motion-compare/browser.mjs
```

The capture reuses the extracted Mario model and textures for all three cameras. Intermediate output goes to `/tmp/motion-compare-render/{side,front,feet}/frames/`. `SOURCE.json` records the measured direction errors, unchanged avatar bone lengths, forward lean and toe bend ranges, and media hashes. Earlier `comparison.mp4` and `comparison-slow.gif` files retain the previous pose-only comparison; the current player uses the three named camera files.
