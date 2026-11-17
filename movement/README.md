# Grounded walking and running

Open `/movement/`. This is the Checkpoint 2 avatar on a single 60 × 60 metre dark-grey floor slab, with faint metre lines for reading foot contact. The slab is 0.8 m thick; its top and the movement ground are both at Y = 0.

On a phone, touching anywhere on the left half creates a joystick at that exact point. A small drag walks, farther travel blends into running, and release brakes to a stop. A 10% dead zone prevents drift. A separate right-side touch rotates the follow camera while the joystick remains active. On desktop use WASD/arrows, hold Shift to run, drag to look and scroll to zoom.

The tuned kinematic controller accelerates toward the analogue speed, brakes on release/reversal and turns toward actual travel. The animation is generated from world-space foot contacts rather than an independent repeating clip:

- Each planted foot keeps its position and yaw until lift-off. The authored forefoot contact stays pinned while the heel rises and the foot bends across the ball.
- Swing feet follow a short arc toward a predicted landing position. Only airborne targets can be re-aimed during a turn or stop; planted contacts are never translated to compensate.
- An analytic two-bone solve places the hip and knee around each actual ankle. Body height adjusts for reach and weight instead of stretching the legs or dragging the feet.
- Walking retains support; running permits brief flight phases. Body lean, landing response and opposing arm swings follow travel and the actual foot positions.
- The calf shafts remain rigid. Only their existing socket lips flex between the independently planted feet and solved lower-leg orientations.

The authored meshes, proportions, hand shapes and mirrored feet come from the saved assembly. The frozen Checkpoint 2 files and its source remain unchanged. `/avatar-lab/` continues to provide the hand/foot pose controls; this page is the locomotion test.

This first movement stage is restricted to the flat slab, with a margin at its edges. Jumps, general terrain collision, slopes and the other SM64 moves are future work. No additional moves have been added here.

`window.movement.player.getState()` exposes support states, plant IDs, measured contact displacement and IK reach errors for verification. `?debug=1` shows contact rings; the normal page keeps this hidden. Build with `npm run build`, test with `npm run test:movement`.
