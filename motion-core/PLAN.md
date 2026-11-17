# Motion core: plan and decisions

The source of truth for Claude's movement work. Codex builds all visuals
(test lab, joystick look, UI); nothing visual here is permanent.

## Decisions (approved by the owner, 17 Nov 2026)

1. Rebuild the 3D-WORLD-3 movement from the ground up, in layers, code first.
   Each layer has automatic checks and is approved before the next starts.
2. Layers: 1 movement rules, 2 balance, 3 foot planning, 4 legs and feet,
   5 upper body. Running, jumps and other SM64 moves come after, on top.
3. Speeds stay exactly as in 3D-WORLD-3: walk 3.1 m/s, full run 8.6 m/s.
4. Goal feel: an athletic person fully in tune with their body; every
   movement purposeful. No clumsy leaning or tripping.
5. Code lives in `motion-core/`, separate from Codex's lab files.
7. Controls must work the same on every device: keyboard, phone touch, and
   game controllers (Xbox, PlayStation, Nintendo Switch) through the
   browser's Gamepad API, with real analog stick strength. The movement code
   only takes a direction and a strength, so every device feeds it the same
   way; a shared input layer (built later) will translate each device.
6. Codex is building the universal test lab and will save it as a
   checkpoint; Claude then connects this code to it (a marker to steer
   during sections 1 to 3).

## Section 1 · Movement rules (built, waiting for approval)

Files: `tuning.js` (all numbers), `controller.js` (the rules),
`tests/compare.mjs` (checks: `npm run test:motion-core`).

The rules, in plain words (ported from 3D-WORLD-3 `Player.updateGround`):

1. The stick gives a direction and a strength. Up to 55% strength he walks
   (0 to 3.1 m/s); from 55% to 100% he runs (3.1 to 8.6 m/s).
2. He turns toward the stick at a limited rate: 13 rad/s when nearly still,
   down to 5.2 rad/s at full speed, so fast running makes wide arcs.
3. Speed is tracked along the way he faces. Sideways drift left over from a
   turn fades quickly, so he curves into a turn instead of sliding.
4. Speeding up is 32 m/s², slowing down 26 m/s².
5. Pushing hard against his travel above 5.2 m/s is a skid: he sheds speed
   (46 m/s²) before accepting the new direction.
6. Letting go above 5.4 m/s is a braking slide. Its length depends on how
   long he had been running: 0.76 m after a short burst, up to 2.03 m after
   a long run. It ends below 1.2 m/s.
7. The game version always works in fixed 1/120 s steps, so the movement is
   the same at any frame rate.

Results: the new code matches the old code exactly (0.000 mm, 0.000 m/s,
0.000°) on all 10 scripted stick tests at 60 fps.
