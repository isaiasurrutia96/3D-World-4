# Universal Motion Lab

The owner's testing hub is `/test-lab/`. `/motion-lab/` is the marker/input harness for the reusable page and input modules used by track inspection and driving. It has deliberately plain visuals and does not represent the current avatar's walking/running animation. Keep the shared implementation and frozen baseline intact.

Work code first: structure and controls, automatic checks, then visual refinement. Do not edit `motion-core/` from lab work.

`src/main.js` supplies only the title, section name and video-card definitions. Every future test uses `src/page.js`, the same `shell.html`, and the one shared `src/input.js` module. The page imports `createMoveController`, calls `advance(seconds, moveX, moveZ)` each frame, reads x/z/facing/speed/mode, and moves a disc-and-arrow marker. The follow camera follows the same state. No avatar is mounted.

Controls: E/S/D/F or arrows move; J/L/I/K look. Mouse drag looks and wheel zooms. On phones, the left floating stick moves with analog strength, the right side looks, and two-finger pinch zooms. Movement and looking work simultaneously. Standard browser-mapped Xbox, PlayStation and Switch controllers use left stick to move and right stick to look. The radial dead zone is 0.12 and the remaining range is remapped to 0..1. Neutral drift/disconnects release input. Blur, pointer cancellation, page hiding and leaving the stage release controls.

`createInput(canvas).sample(frameSeconds, cameraYaw)` returns `{moveX, moveZ, strength, look:{x,y}, zoom, source}`. The world-space movement vector already includes analog strength and the camera heading after this frame's horizontal look; the page applies `yaw -= look.x`. Every device uses that same output. Mouse controls the camera, as specified; keyboard, touch and gamepads move the marker.

The sticky header contains the title, section, Behind/Front/Side/Top/Angled and Reset. The stage fills the rest of the screen; its background/theme is `#405363`. The off-white solid slab has no grid and is lighter than clay `#b9b2a6`. It expands for long marker journeys without changing movement rules. Below are Test videos cards with titles, descriptions and Passed tags. These videos are recordings of passing keyboard and analog checks, not new authored animations.

Build: `npm run build`. Verify: `npm run test:motion-lab`. Gamepad tests inject the browser API for three standard controller identities; they do not certify physical hardware. Generate the clips after the checks pass: `node motion-lab/capture.mjs` (Chromium and ffmpeg required). The optional `direction` or `analog` argument captures one clip. Copy generated public files with the next build before testing playback.

Approved code-first baseline: `/checkpoints/motion-lab-1/`, tag `motion-lab-checkpoint-1-2026-11-17`. It freezes the self-contained page and both clips; its manifest records the untouched motion-core hashes. Keep the checkpoint and tag immutable. Future visuals and movement sections continue on the live page.

For advanced tests, `createMotionLab` accepts an optional `createSimulation({scene,renderer,stage,floor})` adapter. The Racing Lab uses this hook for its existing core, road and kart views while retaining the same shell, camera buttons, shared device input and frame lifecycle. Basic marker pages still only configure title, section and videos. Shared input also exposes optional gas/left/right/brake/boost actions, used by racing and ignored by marker movement. Racing calls `setTouchStick(false)` to use hold buttons; the default touch joystick remains enabled for marker pages.

Inspection zoom uses the same existing input gestures while retaining a persistent camera-focus offset. Pinch focuses beneath the fingers and supports moving the midpoint to pan; wheel zoom focuses under the cursor. The shared presentation handles both perspective and embedded isometric rendering. Static inspection adapters receive the mutable camera `target` in `bind` so near/far calculations follow the inspected part. Reset clears the focus offset; static fitted view buttons reframe the whole subject.

Optional presentation-only `cameraRig` supplies extra view presets, `handles(view)`, `setView(view,camera)` and `update({camera,controls,seconds,state})`. A handled view keeps camera-look input in that mode, may override the rendered camera, and suspends inspection zoom. Reset preserves an active handled view. The driving test uses this for FPV; ordinary labs retain their existing view behavior.


Page activity is shared through `src/page-activity.js`. Home Screen/page return,
focus, viewport resize and the first fresh stage touch recheck visible activity;
pagehide/freeze release input immediately. A next-frame bounds check covers
foreground layout settling. Offscreen and hidden stages stay paused.
The racing build runs its Node lifecycle regressions, and
`npm run test:racing-home-screen` exercises native touch and page-return ordering.
Set `TEST_BROWSER=webkit` to run the browser checks with an installed WebKit.

Shared-input release guards are checked by `motion-lab/tests/input.test.mjs`:
paused samples include neutral action flags, capture failure has a global release
fallback, reset releases captured contacts, and releases run in window capture
phase. Existing key mappings and analog strength are unchanged. Run
`npm run test:lab-foundations` and, after a build,
`npm run test:lab-foundations-browser`; the latter checks this marker harness,
track inspection, driving and app return before publication.
