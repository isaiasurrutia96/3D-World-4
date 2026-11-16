# 07 — Racing Games

## A) Arcade vs simulation

1. **Simulation** (Gran Turismo, Forza): real tire models such as the Pacejka
   "Magic Formula", suspension, weight transfer, gearboxes.
2. **Arcade/"simcade"** (Mario Kart, Need for Speed, Burnout): handling is
   designed for fun and readability. A GDC talk ("Vehicle Physics and Tire
   Dynamics") argued Pacejka isn't ideal for arcade handling and used a simpler
   designer-friendly model. Need for Speed exposes tuning for steering,
   differential and tire model to designers.
3. For a stylized kart game, **arcade is the right choice.**

## B) Arcade kart handling recipe

1. Keep velocity as a vector; separate it into **forward** and **sideways**
   parts relative to the kart.
2. **Grip:** each step remove most of the sideways velocity (high grip) —
   `side *= exp(-grip * dt)`. Less grip = sliding.
3. **Acceleration** toward a top speed with a curve (fast at low speed, slower
   near the top). Braking stronger than acceleration. Reverse slower.
4. **Steering** rate decreases slightly at high speed for stability, but stays
   responsive; steering at zero speed does nothing.
5. **Ground alignment:** raycast down from wheels or the body, align the kart
   to the ground normal, apply gravity when airborne, and auto-level in the
   air.
6. **Collisions with walls:** bounce off with reduced speed and a slight turn
   along the wall instead of a dead stop.

## C) Drifting and boosts (Mario Kart)

1. **Drift:** a button press starts a hop, then the kart slides at an angle with
   lowered grip; steering adjusts the drift radius rather than direction.
2. **Mini-turbo:** holding a drift charges sparks — blue (mini-turbo), then
   orange (super mini-turbo), then purple/pink in newer games. Releasing gives
   a speed boost proportional to the charge. Mario Kart Wii made charging
   time-based; Double Dash and DS used steering wiggles ("snaking").
3. **Trade-off design:** longer drifts give bigger boosts but a predictable
   line, so the player is exposed to items.
4. **Boosts:** temporary higher top speed + acceleration, wider FOV, motion
   lines, exhaust flames, sound. Boost pads, start boost (timing at the
   countdown), trick boosts after ramps.
5. **Drafting/slipstream:** being behind another racer for a moment grants a
   boost.

## D) AI drivers

1. **Racing line:** a spline (smooth curve) along the ideal line; each AI car
   steers toward a look-ahead point some distance ahead on the spline, and
   slows based on the upcoming curvature. Waypoints can have a width so cars
   spread out and overtake.
2. **Variation:** give each AI an offset from the line, skill level, and
   mistakes so they don't drive in a single file.
3. **Avoidance:** steer away from nearby cars and obstacles ahead.
4. **Progress tracking:** distance along the track spline gives race position,
   lap counting, and wrong-way detection. Use checkpoints/gates to prevent
   shortcut cheating.
5. **Ghosts:** record player input or positions per step and replay them
   (3D-WORLD-3's racing game already stores ghosts).

## E) Catch-up mechanics (rubber banding)

1. **AI rubber banding:** AI drivers speed up when behind the player and ease
   off when far ahead, keeping races close.
2. **Position-weighted items (Mario Kart):** the item pool depends on race
   position — leaders get weak items (bananas, coins), trailing racers get
   strong ones (stars, bullet bill); the blue shell targets the leader.
3. Use it lightly; players notice and resent obvious cheating.

## F) Track and presentation

1. Track width, clear edges (curbs, rails), readable turns, signs before sharp
   corners, shortcuts that reward skill.
2. Speed sensation: FOV widening, camera pullback, motion blur/lines, roadside
   objects passing close, engine pitch rising.
3. Countdown, lap counter, position, minimap, finish celebration.

## G) Deep dive: raycast vehicle model (Very Very Valet, Toyful Games)

1. The whole car is **one rigid body**; each wheel is a **raycast** downward
   from its mount point — no wheel colliders.
2. Per wheel, three forces at the contact point:
   1. **Suspension:** spring force = stiffness × compression − damping ×
      compression speed, applied upward along the car's up axis.
   2. **Steering/side grip:** remove a fraction of the wheel's sideways
      velocity (force = −side velocity × grip × mass share / dt). Lower grip
      on rear wheels = drifts.
   3. **Acceleration/rolling:** forward force from throttle along the
      wheel's forward direction, using a torque curve over speed; rolling
      resistance when coasting.
3. Steering rotates the front wheels' forward direction.
4. Toyful's point: write your own core mechanic (car physics) so you can tune
   it, rather than fighting engine wheel colliders.

## H) Deep dive: GTA V handling parameters (handling.meta, modding docs)

GTA V describes every car with ~70 numbers. The important ideas:

1. **Mass, drag, centre of mass offset.**
2. **Drive force and drive bias** (front/rear power split), top speed, gears.
3. **Brake force and brake bias.**
4. **Traction curve max/min and lateral curve** — grip at the limit and how it
   falls off when sliding; **traction loss multiplier** for grass/dirt (surface
   grip from a materials table).
5. **Suspension force, damping, raise, and anti-roll bars.** Weight transfer
   means tyres on the side the car leans toward grip more.
6. **Steering lock** angle. Lesson: a data table per vehicle lets designers
   create many cars from one physics model.

## I) Deep dive: Mario Kart item odds

Community-mined tables (Mario Kart DS, Wii) list a separate item probability
row for each race position, and different tables for CPU racers. Front
positions mostly get bananas/green shells/coins; back positions get
mushrooms, stars, bullet bills; blue shells only for mid/back. AI catch-up is
hand-tuned per track so CPU drivers don't fall off narrow sections.
