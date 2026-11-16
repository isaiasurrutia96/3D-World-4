# 03 — Cameras

"Cameras are most noticeable when they fail." — John Nesky (Journey), "50
Camera Mistakes", GDC 2014. Dynamic third-person cameras are the hardest kind.

## A) Third-person follow camera

1. **Orbit around a target point** slightly above the character (chest/head),
   not the feet. Store yaw, pitch and distance; compute the position.
2. **Smooth with damping**, not hard locking: `pos = lerp(pos, desired, 1 -
   exp(-k * dt))`. Frame-rate-independent damping uses the exponential form.
3. **Respect player input.** Never fight the player's stick. Auto-rotation
   behind the character should be gentle and pause for a while after the
   player moves the camera.
4. **Collision:** cast a ray/sphere from the target to the camera; if it hits a
   wall, pull the camera in front of it. Move in fast, ease back out slowly.
5. **Look ahead:** shift the target slightly toward where the character is
   moving so the player sees what's coming.
6. **Don't follow every bob.** Ignore small vertical motion (jumps) unless the
   character lands on a new height; Mario-style cameras only adjust height on
   landing.
7. **Clamp pitch** (roughly −30° to +70°) so the camera never flips.
8. **Field of view:** 60–75° for third person. Widening FOV slightly at high
   speed (racing, sprinting) sells speed.

## B) Common mistakes (from Nesky's talk and others)

1. Rotating the camera when the player didn't ask.
2. Letting geometry block the character.
3. Snapping/cutting abruptly during gameplay.
4. Framing only the character instead of where they need to go.
5. Changing control direction mid-move when the camera swings (keep the old
   input direction until the stick is released).
6. Shake and motion that cause nausea; give an option to reduce it.

## C) Other camera types

1. **Super Mario 64 (Lakitu):** the camera is a character holding the camera,
   which explains its behavior to the player. Players move it with the C
   buttons. The team built the camera system first, before levels.
2. **Orbit/inspect camera:** for viewers (Three.js `OrbitControls`): drag to
   orbit, pinch/scroll to zoom, damping on.
3. **Racing chase camera:** behind and above the car, lagging slightly in
   rotation, pulling back and widening FOV with speed, never passing through
   walls.
4. **Sports cameras:** golf — behind the ball for aiming, then follow the ball
   in flight, then a view of where it lands; bowling — behind the ball down
   the lane; basketball/football — broadcast side view or behind the player.
5. **First person (Call of Duty):** camera at eye height with subtle head bob,
   weapon drawn as a separate layer with its own sway and recoil animation.

## D) Deep dive: framing like Cinemachine (Unity)

1. **Screen position:** where on screen the target should sit (0.5, 0.5 is
   centre; slightly below centre for third-person so the player sees ahead).
2. **Dead zone:** a rectangle in the middle of the screen where the target can
   move without the camera reacting at all. Removes jitter from small
   movements.
3. **Soft zone:** around the dead zone; when the target enters it the camera
   eases to bring it back, with **damping** controlling how fast (small =
   responsive, large = heavy camera).
4. **Hard limit:** outside the soft zone the camera follows instantly so the
   target never leaves the screen.
5. **Look-ahead:** aim at where the target will be in N seconds based on its
   velocity — helpful, but amplifies jittery animation, so smooth the
   velocity first.
6. **Separate position and rotation behaviour:** one component moves the
   camera (follow distance, orbit), another rotates it (aim/composer).
