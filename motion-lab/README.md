# Universal Motion Lab

Live page: `/motion-lab/`. This is the reusable movement test template. Its visuals are deliberately plain placeholders. The older general object Test Lab and its checkpoint remain available separately.

Work code first: structure and controls, automatic checks, then visual refinement. Do not edit `motion-core/` from lab work.

`src/main.js` supplies only the title, section name and video-card definitions. Every future test uses `src/page.js`, the same `shell.html`, and the one shared `src/input.js` module. The page imports `createMoveController`, calls `advance(seconds, moveX, moveZ)` each frame, reads x/z/facing/speed/mode, and moves a disc-and-arrow marker. The follow camera follows the same state. No avatar is mounted.

Controls: E/S/D/F or arrows move; J/L/I/K look. Mouse drag looks and wheel zooms. On phones, the left floating stick moves with analog strength, the right side looks, and two-finger pinch zooms. Movement and looking work simultaneously. Standard browser-mapped Xbox, PlayStation and Switch controllers use left stick to move and right stick to look. The radial dead zone is 0.12 and the remaining range is remapped to 0..1. Neutral drift/disconnects release input. Blur, pointer cancellation, page hiding and leaving the stage release controls.

`createInput(canvas).sample(frameSeconds, cameraYaw)` returns `{moveX, moveZ, strength, look:{x,y}, zoom, source}`. The world-space movement vector already includes analog strength and the camera heading after this frame's horizontal look; the page applies `yaw -= look.x`. Every device uses that same output. Mouse controls the camera, as specified; keyboard, touch and gamepads move the marker.

The sticky header contains the title, section, Behind/Front/Side/Top/Angled and Reset. The stage fills the rest of the screen; its background/theme is `#405363`. The off-white solid slab has no grid and is lighter than clay `#b9b2a6`. It expands for long marker journeys without changing movement rules. Below are Test videos cards with titles, descriptions and Passed tags. These videos are recordings of passing keyboard and analog checks, not new authored animations.

Build: `npm run build`. Verify: `npm run test:motion-lab`. Gamepad tests inject the browser API for three standard controller identities; they do not certify physical hardware. Generate the clips after the checks pass: `node motion-lab/capture.mjs` (Chromium and ffmpeg required). The optional `direction` or `analog` argument captures one clip. Copy generated public files with the next build before testing playback.

Approved code-first baseline: `/checkpoints/motion-lab-1/`, tag `motion-lab-checkpoint-1-2026-11-17`. It freezes the self-contained page and both clips; its manifest records the untouched motion-core hashes. Keep the checkpoint and tag immutable. Future visuals and movement sections continue on the live page.

For advanced tests, `createMotionLab` accepts an optional `createSimulation({scene,renderer,stage,floor})` adapter. The Racing Lab uses this hook for its existing core, road and kart views while retaining the same shell, camera buttons, shared device input and frame lifecycle. Basic marker pages still only configure title, section and videos. Shared input also exposes optional gas/left/right/brake/boost actions, used by racing and ignored by marker movement. Racing calls `setTouchStick(false)` to use hold buttons; the default touch joystick remains enabled for marker pages.
