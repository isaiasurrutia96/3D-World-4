# 18 — Build Recipes (TypeScript + Three.js)

Short, concrete plans for features this project may need. Each lists the
pieces in build order. Only build what the owner asks for.

## A) Third-person character on a floor

1. Scene, camera, renderer, hemisphere + directional light, floor plane.
2. Input map (keyboard, touch stick, gamepad) → move vector + action presses.
3. Fixed-timestep loop (`01-foundations.md`).
4. Capsule collider + ground check + gravity + jump (`02-movement.md`
   formulas: height/time-to-peak, coyote, buffer, variable height).
5. Camera-relative movement, acceleration curves, turning.
6. Orbit follow camera with collision and damping (`03-cameras.md`).
7. Procedural walk/idle animation, squash on land, dust particles.

## B) Mini golf hole

1. Course built from boxes/ramps with collision; hole cup as a trigger.
2. Ball: sphere, velocity, rolling friction, wall bounce with restitution
   (~0.6), slope gravity.
3. Input: drag back from the ball (touch/mouse), arrow shows direction and
   power; release to shoot; disable input while the ball moves.
4. Cup capture when ball overlaps the cup and speed < threshold, else it lips
   out; stroke counter; reset if out of bounds.
5. Camera: angled view behind the ball, follows during the roll.

## C) Bowling lane

1. Lane 18.29 m × 1.05 m with gutters; pins in a 30.5 cm-spaced triangle.
2. Physics engine (Rapier) for ball and pins (pins as stacked
   cylinders/convex hull, mass 1.5 kg, low center of mass; ball 6–7 kg).
3. Input: slide to set position, aim arrow swings, power and spin by swipe.
4. Ball model: friction low for first ~2/3 of lane (skid), then higher; spin
   applies sideways force only while skidding/hooking (`06-sports.md`).
5. Detect fallen pins (tilt > ~30° or moved off spot) after settle time; reset
   rack; 10-frame scoring.

## D) Throwing a ball at a target (football/basketball)

1. Aim with stick/drag; hold to charge; release throws.
2. Compute launch velocity to reach the target point (`05-physics.md`), add
   error scaled by timing quality.
3. Show a dotted arc preview (simulate the trajectory a few dozen steps).
4. Basketball: decide make/miss from timing window, then pick a trajectory
   that swishes or rims out; backspin visual.
5. Football: target = receiver's predicted position at arrival time.

## E) Arcade kart

1. Raycast vehicle (`07-racing.md` G): one body, 4 suspension rays, side grip,
   throttle curve.
2. Drift button: hop, reduced rear grip, spark charge levels, boost on
   release.
3. Chase camera with FOV widening by speed.
4. Track spline for laps, position, AI look-ahead driving, wrong-way check.
5. Touch: separate Left, Right, Gas, Brake buttons.

## F) Object viewer (inspect a model)

1. `OrbitControls` (damping on, pan off), or a turntable group rotated by drag.
2. Light from the front-ish key light + soft hemisphere; neutral background.
3. Fit camera distance to the model's bounding box.
4. Full pixel ratio is fine (single still object).

## G) Checklist before showing anything

1. Runs at 60 fps on a phone-size test, no console errors.
2. Controls work on keyboard and touch.
3. Nothing the owner didn't ask for was added or changed.
