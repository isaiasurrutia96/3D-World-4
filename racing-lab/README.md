# Racing Lab: section 1 — solo driving

Open `/racing-lab/`, pick Original, Skyline, Suzuka or Winding, then Start drive. This section tests acceleration, steering and braking with only the player kart. It uses the core’s solo session; no NPCs, NPC meshes or ghosts are spawned. The three-second countdown and three-lap counter help repeat tests. Reset creates a fresh grid on the selected track; Recover returns to the last validated checkpoint and preserves spent boost charges.

The page uses the existing Motion Lab shell, renderer/camera loop and `motion-lab/src/input.js`. `createSimulation` supplies the racing controller and view; ordinary Motion Lab pages retain their original marker behavior. No frozen checkpoints or `motion-core/` files are edited.

- Keyboard: E/Up gas, S F/Left Right steer, D/Down brake then reverse. Space brakes; Shift boosts.
- Mouse: drag to look; wheel zooms. Behind restores the chase camera.
- Phone: hold Gas and the Left/Right steering buttons. Drag the stage to look and pinch to zoom. Brake and Boost remain hold buttons. The Racing Lab disables its touch joystick; other Motion Lab pages retain theirs.
- Standard browser gamepads: left stick drives, right stick looks, left trigger brakes, standard button 0 (Xbox A / PlayStation Cross / corresponding Switch button) boosts. Analog strength and the shared dead zone are preserved.

Steering input is independent of camera orientation. The core's yaw convention is unchanged; the adapter maps device right to the correct turn in chase view. Keyboard throttle and steering remain independent when pressed together, while gamepad axes retain their actual analog strength. Blur, hidden pages and pointer cancellation release controls.

`src/track-view.js` builds the road from the exact `track.segments[].triangles` used by physics, including centerline-split ramps. Rails use the same segment endpoints. The road and the driving surface use the same geometry. Cars are intentionally plain boxes and wheels. The chase camera follows elevation and heading; direct look input releases automatic rotation. Road/deck raycasts shorten the camera offset if a bridge blocks the kart.

HUD: lap, elapsed/finish time, speed, remaining boosts, wrong-way/off-course status. No race-position HUD is shown in this solo section. The single test clip records live keyboard input through this same page and simulation. Visuals are placeholders for reviewing handling.

Build with `npm run build`. Run `npm run test:racing-lab`, `npm run test:motion-lab` and `npm run test:racing-core`. Browser checks use `/usr/bin/chromium`; gamepads are injected through the Gamepad API, not physical hardware. Regenerate the smoke clip after the checks pass with `node racing-lab/capture.mjs`, then build again to copy public media.
