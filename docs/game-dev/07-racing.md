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
