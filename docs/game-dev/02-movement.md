# 02 — Character Movement and Game Feel

## A) What makes movement feel good

1. **Responsiveness:** the character reacts on the very next frame after a
   press. Animation can lag behind; the physics response must not.
2. **Acceleration and deceleration curves:** reaching top speed in ~0.15–0.3 s
   and stopping in ~0.1–0.2 s feels snappy. Long ramps feel like ice.
   Super Mario 64 uses quick acceleration plus a visible skid when reversing,
   which tells the player what happened.
3. **Turning:** at low speed turn almost instantly; at high speed turn over a
   few frames and allow a skid/turnaround move when reversing hard. Rotate the
   character toward the stick direction relative to the camera.
4. **Camera-relative controls:** "up" on the stick means "away from the
   camera". Compute the move direction from the camera's yaw, not the
   character's facing.
5. **Analog speed:** a small stick push walks, a full push runs. Keyboards need
   a walk modifier key.

## B) Jumps

1. **Design a jump from height and time, not from raw gravity.** Choose jump
   height `h` and time to the top `t`, then:
   `gravity = 2h / t²`, `jumpVelocity = 2h / t`. This makes tuning intuitive.
2. **Heavier falling than rising.** Multiply gravity by ~1.5–2.5 on the way
   down. Jumps then feel snappy instead of floaty.
3. **Variable jump height:** if the button is released while still rising, cut
   upward velocity (e.g. multiply by 0.5) or raise gravity. Tap = small hop,
   hold = full jump.
4. **Coyote time:** allow a jump for ~100–150 ms after walking off a ledge.
5. **Jump buffering:** remember a jump press for ~100–150 ms before landing and
   fire it on touchdown. Buffer covers early presses; coyote covers late ones.
6. **Air control:** some steering in the air (Mario has a lot; realistic games
   have little). Reduce, don't remove.
7. **Corner correction:** if the head barely clips a ledge corner, nudge the
   player sideways instead of stopping the jump.
8. **Landing:** a short squash, dust particles and a sound make landings
   readable. Heavy landings can briefly slow the player.

## C) Super Mario 64 techniques (from the decompilation and community docs)

1. **Quarter steps:** Mario's movement is split into four collision-checked
   sub-steps per frame, so fast movement doesn't pass through thin walls.
2. **Surfaces are classified by their normal.** A triangle whose normal points
   up enough is a floor; pointing down is a ceiling; otherwise a wall. Floors
   have types (slippery, normal, not slippery, lava, etc.) that change
   friction and behavior.
3. **Walls push out horizontally.** Wall checks run at a couple of heights on
   the body and push Mario out along the wall's normal; floors snap him to the
   ground height below.
4. **Many moves, one state machine.** Single, double and triple jump (chained
   by jumping within a few frames of landing while moving fast), long jump
   (crouch while running, then jump), backflip (crouch still, then jump), side
   flip (jump while reversing direction), wall kick (jump while touching a wall
   in the air), ground pound, dive, ledge grab and climb, swimming, carrying.
   Each is a state with its own physics.
5. **Slopes:** steep slopes make Mario slide; walking speed adjusts on slopes.
6. **Known flaws to avoid:** 16-bit collision coordinates caused invisible
   walls and gaps; mismatched floor/wall math caused glitches. Use floats and
   consistent collision for everything.
7. **Level design served movement:** each course is a sandbox with seven stars
   (missions named as hints) so players revisit the same space with new goals.

## D) Collision for characters

1. Represent the character as a **capsule** (cylinder with rounded ends).
2. Move, then resolve overlap by pushing out along the contact normal. Slide
   along walls by removing the velocity component into the wall.
3. **Ground check** with a short downward ray or sphere cast; snap to the
   ground on gentle slopes and small steps so the character doesn't bounce
   down stairs.
4. **Step-up:** allow climbing small ledges (~0.3–0.5 m for a human) without
   jumping.
5. **Max walkable slope** around 45–50°; steeper surfaces count as walls.

## E) The existing avatar

The clay avatar from 3D-WORLD-3 already implements most of section C in
TypeScript (capsule collision, quarter steps, the full move set, ledges,
ladders, swimming, carrying). If movement is needed again, reuse or study it
rather than starting from scratch — only when the owner asks.

## F) Deep dive: Super Mario 64 numbers (Ukikipedia / TASVideos, community)

SM64 runs at 30 frames per second; speeds are in game units per frame
(roughly 1 m ≈ 100 units is a common rough conversion; Mario is ~160 units
tall).

1. **Jump velocity:** single jump starts at 42 + ¼ of horizontal speed
   (units/frame); double jump uses 52 + ¼ horizontal speed. Running faster
   makes jumps higher — momentum feeds the jump.
2. **Gravity:** vertical speed falls by 4 units per frame in a normal fall;
   terminal velocity −75 units/frame. Releasing A early during a rising jump
   cuts the upward speed sharply (variable jump height; exact factor: check
   the decompilation before copying).
3. **Walking speed cap:** 48 units/frame on flat ground (running).
4. **Quarter steps:** 4 collision sub-steps per frame on ground and in air.

## G) Deep dive: Celeste/TowerFall movement (Maddy Thorson)

1. Only two physics classes: **Solids** (level geometry, moving platforms) and
   **Actors** (player, arrows, enemies). All boxes are axis-aligned with
   integer positions.
2. **Movement with remainders:** add the move amount to a fractional
   remainder; move the whole-pixel part one pixel at a time, checking for a
   Solid before each pixel; stop and call a collision callback on contact.
   Pixel-perfect, never tunnels.
3. **Riding and pushing:** a moving Solid carries Actors standing on it
   (riding) and pushes Actors it overlaps; if an Actor is pushed into another
   Solid it is **squished** (callback: die or nudge out).
4. Lesson for 3D: simple, predictable, step-wise collision beats a general
   physics engine for the player character.

## H) Deep dive: character controllers in engines

1. **Kinematic controller** (Unity CharacterController, Rapier's
   KinematicCharacterController, OpenKCC): you set the desired move each step;
   it slides along walls, climbs steps under a **step offset**, walks slopes
   under a **slope limit**, and **snaps to ground** going down steps/slopes.
   It does not react to forces by itself — gameplay code adds gravity, knock-
   back, etc. This is what most games use for players.
2. **Physics (dynamic) controller:** the character is a rigid body moved by
   forces. Reacts naturally to the world but is harder to make tight.
3. **Rapier for three.js** has a ready kinematic character controller with
   autostep, snap-to-ground, max slope and sliding.
4. **Moving platforms:** add the platform's movement this step to the
   character before its own movement.
