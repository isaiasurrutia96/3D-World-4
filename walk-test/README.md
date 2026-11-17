# Walking test

Open `/walk-test/`. Touch and drag anywhere on the left to walk, push farther for a faster walk, and use a second touch on the right to look around. Release to stop. The Run test link opens the separate running page. Desktop uses WASD/arrows and Shift for full walking speed.

This is a distinct walking gait, not the running clip played slowly. It has a 1.1-second cycle, a measured one-metre full stride and approximately 0.91 m/s maximum speed. Each foot spends 62% of the cycle on the floor, creating double support and no airborne phases. Feet lift about 4.5 cm, with heel strike and a gentle ball-of-foot push-off. The torso is more upright, the arms swing gently in opposition, and the hands are relaxed.

The saved avatar and actual thigh/calf lengths are reused unchanged. Two-bone IK connects the knees to the fitted feet; swing clearance adapts if needed to avoid stretching a leg. A moving forefoot trajectory derives the character's travel so the supporting point stays pinned. The optimized contact controller, pose cache, input and slate-blue stage are shared with the running test. Hand pose overrides remain independent for future carried objects.

The running page and its animation remain available. `PlayableRun` now accepts a motion factory, cycle duration and contact schedule; its defaults preserve the existing running test. Walking supplies its own `WalkingMotion` and continuous support schedule.

Build with `node walk-test/build.mjs` or `npm run build`. Verify with `node walk-test/test.mjs`: low foot lift, overlapping support, no flight, fixed bone lengths, planted contact drift, turning/reversal, slow/full joystick control, camera multitouch and stopping. The frozen avatar checkpoints remain unchanged.
