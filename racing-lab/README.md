# Playable Racing Lab

Open `/racing-lab/`, pick Original, Skyline, Suzuka or Winding, then Start race. The three-second countdown leads to a three-lap race against four physics-driven opponents. Reset creates a fresh grid on the selected track; Recover returns to the last validated checkpoint and preserves spent boost charges.

The page uses the existing Motion Lab shell, renderer/camera loop and `motion-lab/src/input.js`. `createSimulation` supplies the racing controller and view; ordinary Motion Lab pages retain their original marker behavior. No frozen checkpoints or `motion-core/` files are edited.

- Keyboard: E/Up gas, S F/Left Right steer, D/Down brake then reverse. Space brakes; Shift boosts.
- Mouse: drag to look; wheel zooms. Behind restores the chase camera.
- Phone: left floating stick drives; right side looks; pinch zooms. Hold Brake or Boost for those actions.
- Standard browser gamepads: left stick drives, right stick looks, left trigger brakes, standard button 0 (Xbox A / PlayStation Cross / corresponding Switch button) boosts. Analog strength and the shared dead zone are preserved.

Steering input is independent of camera orientation. The core's yaw convention is unchanged; the adapter maps device right to the correct turn in chase view. Keyboard throttle and steering remain independent when pressed together, while touch/gamepad axes retain their actual analog strength. Blur, hidden pages and pointer cancellation release controls.

`src/track-view.js` builds the road from the exact `track.segments[].triangles` used by physics, including centerline-split ramps. Rails use the same segment endpoints. There is no visual-only driving surface or replay-driven NPC. Cars are intentionally plain boxes and wheels. The chase camera follows elevation and heading; direct look input releases automatic rotation. Road/deck raycasts shorten the camera offset if a bridge blocks the kart.

HUD: lap, position, elapsed/finish time, speed, remaining boosts, wrong-way/off-course status. A finish banner uses the core's standings. The single test clip records live keyboard input through this same page and simulation. Visuals are placeholders for reviewing handling and race flow.

Build with `npm run build`. Run `npm run test:racing-lab`, `npm run test:motion-lab` and `npm run test:racing-core`. Browser checks use `/usr/bin/chromium`; gamepads are injected through the Gamepad API, not physical hardware. Regenerate the smoke clip after the checks pass with `node racing-lab/capture.mjs`, then build again to copy public media.
