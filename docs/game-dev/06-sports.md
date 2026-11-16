# 06 — Sports Games: Golf, Bowling, Football, Basketball

Common rule: **the player controls intent and timing; the game turns that into
physics.** Good sports games hide complex simulation behind one or two simple
inputs, then show clear feedback on how well the player did.

## A) Golf

1. **Swing input styles:**
   1. **Three-click meter** (since 1980s Nintendo Golf; EA PGA Tour, Mario
      Golf): click to start, click to set power as a bar rises, click to set
      accuracy as it returns through a target zone. Very precise and readable.
   2. **Two-click** (simpler; Mario Golf: Super Rush) — less precise.
   3. **Analog stick swing** (Tiger Woods/EA, The Golf Club): pull back, push
      forward; tempo and straightness set power and direction. Feels physical
      but is less exact.
   4. **Motion control** (Wii Sports): the real swing speed is power.
   5. **Touch:** drag back and release (mini golf on phones).
2. **Shot setup:** club choice sets launch angle, max distance and spin; aim
   line shows predicted landing area; wind arrow; lie (fairway, rough, sand)
   reduces power or adds randomness.
3. **Ball flight:** simulate gravity + drag + Magnus lift from backspin (see
   `05-physics.md`). Real models use lift coefficient by spin parameter
   `S = ωR/v`. Sidespin from mis-timed accuracy click → hook or slice.
4. **Landing:** bounce with restitution depending on surface (green soft,
   fairway medium, cart path hard), then roll with friction; backspin can make
   the ball stop or spin back on greens.
5. **Putting:** separate mode; show the green's slope (grid lines or arrows),
   power by drag length, ball rolls under slope gravity and friction.
6. **Camera:** behind the ball to aim, follow during flight, show landing.
7. **Mini golf:** no flight model needed — top-down/angled aim, drag for
   power, ball rolls with friction and bounces off walls; obstacles, ramps,
   holes. The cup "captures" a ball below a speed threshold.

## B) Bowling

1. **Wii Sports bowling** (directed by Shimamura): the ball moves exactly as
   thrown — no hidden randomness — yet the team still couldn't bowl 300 easily.
   Freedom (you can even throw backwards or into other lanes) made it feel
   real.
2. **Inputs:** position along the foul line, aim direction, power, spin
   (twist the wrist / curve gesture / slider).
3. **Hook physics:** the ball skids first (oil on the front of the lane = low
   friction), then hooks when friction rises on the dry back end; spin around
   a tilted axis turns into sideways motion when the ball grips. Arcade
   version: apply sideways acceleration proportional to spin once past a set
   distance.
4. **Pins:** rigid bodies (a physics engine like Rapier is right here). Pin
   action comes from pins hitting each other and bouncing off the side walls.
   Use simplified collision shapes (stacked cylinders or a capsule) but the
   right mass (~1.5 kg pin, ~5–7 kg ball) and center of mass.
5. **The pocket:** hitting between the 1 and 3 pin (right-hander) at an angle
   gives the most strikes; reward that angle, it is what real bowlers chase.
6. **Scoring:** 10 frames; strike = 10 + next two balls, spare = 10 + next ball.

## C) Throwing a football

1. **Madden-style passing:** select a receiver (button per receiver), the game
   throws to where the receiver will be (lead). The left stick nudges the lead
   direction. **Placement** modes show a target circle.
2. **Trajectory types:** bullet (fast, low, risky through defenders), touch
   (medium), lob (high, over defenders) — chosen by how long/hard the button is
   pressed or a modifier button.
3. **Accuracy:** the thrower's skill, pressure from defenders, and throwing on
   the run add error to the target point.
4. **Implementation:** pick flight time from distance and pass type; solve the
   launch velocity to land at the receiver's predicted position (see
   `05-physics.md`, leading a target). Spiral rotation is visual only.
5. **Catching:** check ball arrival vs receiver's catch radius and timing;
   contested catches decided by skill/position.
6. **Simple throwing (non-sim):** aim with stick/drag, hold to charge power,
   release; show a dotted arc preview.

## D) Basketball

1. **NBA 2K shot meter** (since 2K15): the meter fills during the shot; release
   at the right moment. The window size comes from the player's ratings, the
   shot difficulty and the defense. Release timing sets the make chance; very
   early or late is a near-certain miss. Shot outcome is partly a dice roll
   weighted by timing and ratings.
2. **Real shot physics:** good shots have a high arc (studies: about 52–60°
   release for free throws) and backspin (~3 revolutions/s). Backspin deadens
   the ball when it hits the rim, so it's more likely to drop in. A ball
   entering at a steep angle sees a bigger "target" opening.
3. **Implementation options:**
   1. **Decide make/miss first**, then animate a trajectory that goes in or
      clangs off the rim convincingly (most sports games).
   2. **Full physics** with rim and backboard colliders (more emergent, harder
      to make fair).
4. **Dribbling and layups** are mostly animation-driven; the ball is attached
   to the hand with procedural bounce.
5. **Feedback:** show timing result ("Early/Good/Perfect/Late"), swish sound.

## E) Shared sports techniques

1. **Show the result of each input immediately** (meter color, text, sound).
2. **Assist levels:** aim guides, prediction lines and bigger timing windows
   for beginners; remove for experts.
3. **Ratings/stats** scale timing windows and accuracy instead of changing
   controls.
4. **Replays** and slow motion on great shots add excitement cheaply.

## F) Deep dive: bowling ball motion (USBC research)

1. The USBC Bowling Ball Motion Study found the phase order is **skid → hook →
   roll** (not skid–roll–hook as people assumed).
2. **Skid:** low friction on the oiled front of the lane; the ball keeps its
   direction and spin.
3. **Hook:** in the mid/back lane friction rises and the spin pulls the ball
   sideways in an arc.
4. **Roll:** about two-thirds down the lane the ball reaches full forward
   rolling and travels in a straight line into the pins; maximum rev rate is at
   the second transition.
5. **The lane decides** when the hook starts (oil pattern), not only the ball.
6. **Game recipe:** model friction as a function of distance down the lane
   (low → high). While skidding, side force ≈ friction × spin; once rolling,
   no more hook. The ideal strike enters the pocket at a few degrees of angle.

## G) Deep dive: golf swing inputs in motion games

1. The original Wii Remote only sensed linear acceleration, so a golf swing's
   rotation couldn't be captured; Wii MotionPlus added a gyroscope for full
   rotation (Iwata Asks).
2. Wii Sports Resort used motion data for **direction and spin** but its own
   speed model — the game deliberately did not map swing speed 1:1 to ball
   speed (it would be frustrating).
3. On phones the equivalents are touch-drag (power by drag length, direction
   by drag angle) or tilt (DeviceOrientation API).

## H) Deep dive: modern basketball shooting (NBA 2K25)

1. **Green window:** the span of release time (e.g. ~50 ms) that produces a
   perfect make; its size depends on shooting ratings, badges, shot difficulty
   and defence.
2. **Shot timing profiles:** high-risk (small window, big reward), normal,
   low-risk (forgiving, lower ceiling). The gameplay director said low-risk
   makes anyone competent on smart shots but limits good timers.
3. **Visual cue setting** chooses when the release point is (at the set point,
   at the top of the jump, etc.).
4. **Rhythm shooting** (stick timing) reportedly widens the window versus a
   button press (community testing).
5. Design lesson: give players a choice between safe and risky input styles.

## I) Deep dive: arcade sports exaggeration (NBA Jam)

1. Most rules removed; turbo button; impossibly high dunks.
2. **"On Fire":** three baskets in a row without the opponent scoring gives
   unlimited turbo, near-certain shots and flaming visuals until the opponent
   scores. A comeback-free streak reward that creates hype.
3. Rubber-band AI kept games close (community observation).
4. Lesson: for fun sports minigames, exaggerate and reward streaks rather than
   simulate.

## J) Deep dive: football play AI (Madden)

1. Zone defenders follow **spot-drop** logic (cover an area) by default, with
   "match" rules that pick up a receiver entering the zone; Madden 23 added
   **drift** logic to react to receivers approaching sooner.
2. Man defenders track one receiver; switching assignments during motion is a
   classic AI failure point.
3. Each zone assignment has its own rule set (EA Madden 17 notes).
4. For a simple throwing minigame: receivers run predefined spline routes;
   defenders pick the nearest receiver or a zone; the pass is judged by ball
   arrival vs. receiver and defender positions.
