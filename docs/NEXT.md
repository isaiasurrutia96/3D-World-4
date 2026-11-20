# Movement roadmap and saved requests

Recorded 17 November 2026.

1. Movement should feel like Super Mario 64 as if it were made today:
   modern, grounded, with real foot contact.
2. Use foot locking (step 3 of the plan): planted feet stay fixed on the
   ground while the body moves; legs bend with IK; feet step when the body
   gets too far ahead. No gliding or sliding.
3. Focus on the feet. The owner may build new feet (with Claude Code) for
   natural foot movement; foot locking should work with those feet.
4. Status: the earlier foot-locking attempt was deleted at the owner's request.
   A fresh flat-floor walking/running test now lives under `movement/`, using
   the Checkpoint 2 assembly, world-space planted contacts, leg IK, foot roll,
   analogue floating joystick and independent right-side camera touch.
   This stage covers the flat slab; terrain, jumping and the remaining SM64
   actions still need development. Keep the frozen checkpoint intact.
   The owner rejected the current walking look: excessive hip drops and knee
   bends resemble descending imaginary stairs. Numeric foot-locking checks
   alone do not establish a convincing gait. Use the original SM64 walk-pose
   reference at `/references/sm64-walk/` before rebuilding the walk cycle.

7. Claude's own movement test, to compare with Codex's `/movement/`:
   `/motion-lab/` (folder `motion-lab/`). Plan approved 17 Nov 2026, built
   one stage at a time with owner approval: 1 standing (approved), 2 slow walk
   (built, waiting for approval), 3 run, 4 start/stop/turn/skid, 5 jump and other
   SM64 moves. Feet lead, planted feet never slide, knee solve, SM64 walk
   reference. Do not touch Codex's movement files.

## Owner favourite (remember)

5. The owner **really likes the banked NASCAR-style oval** (Oval Lab,
   `src/oval.ts`, from 3D-WORLD-3 commit 17d170b). Keep it; build on it.

## Build rule for blocks (approved 17 Nov 2026)

6. Every material has one fixed style, used everywhere in the world:
   - **Merged** (one solid shape, rounded only on outside edges): large and
     flat materials (grass, dirt) and big, regular, perfectly shaped objects
     (tree trunk).
   - **Separate blocks** (each block its own rounded cube): natural detail
     (stone, rock, leaves, bush).
   - Flowers stay exactly as approved.
   - New blocks get their style once, in the rulebook (`src/world/rulebook.ts`).

## Platform decision (approved 18 Nov 2026)

8. Build the full game for the web first (Three.js + TypeScript): free,
   works on the owner's 2015/2016 MacBook, and every version can be
   played on a phone by link within minutes.
9. Keep the rules (the "brain": movement, skeleton, balance, karts, races,
   collisions) separate from the drawing (the "face"), each with automatic
   checks and plan files, so the game can later be ported to consoles
   (rebuilt in a console-ready engine such as Unity, Godot with a console
   partner, or Unreal, by us or a porting studio).
10. Shared controls layer for every device (keyboard, touch, controllers);
    3D models and sounds in standard file types every engine can open.
11. Selling before consoles: wrap the web game for Steam and the phone
    stores. The iPhone store will need a recent Mac (or a rented cloud
    Mac) only when it is time to submit.
12. The owner wants to learn: Claude acts as a game-development mentor,
    explaining each step in simple words with alternatives, never
    assuming. Terms are collected in `docs/LEARNING.md`.

## Avatar hand tilt (approved 18 Nov 2026)

13. Both hands rest turned 8° at the wrist (fingertips slightly forward),
    each turning about its wrist ball so it stays cradled in the forearm
    socket (`avatar-lab/src/avatar.js` HAND_TILT_DEGREES; checks:
    `npm run test:hand-tilt`). Approved; Checkpoint 2 updated in place with
    the same name (`checkpoints/avatar-2/`, see its CHECKPOINT.json updates).

## Chest and pelvis split (approved 18 Nov 2026)

14. Owner chose option 1: the torso is now a chest and a pelvis joined by a
    ball-and-socket waist, keeping the approved outer shape except a thin
    seam (`avatar-lab/src/torso-split.js`; checks: `npm run test:torso`).
    The chest turns on the hips ±35° (throwing, swinging); leaning at the
    waist is kept at 0 for now. Next after approval: collarbones and the
    pelvis-to-hip connection in the skeleton, and bone links in the bones
    view. Owner approved the look and the waist turn; Checkpoint 2 updated
    in place (same name).

## Collarbones and hip bones (approved 18 Nov 2026)

15. The skeleton now has 52 bones: a collarbone on each side (base of the
    neck to the shoulder ball; the arm hangs from it) and a hip bone on
    each side (pelvis centre to the hip ball; the leg hangs from it). Both
    are locked at 0 for now: the shoulder ball sits in the one-piece chest,
    so a shrug needs that socket redesigned first. The bones view also draws
    thin links where a bone does not start at its parent's end (pelvis to
    waist, wrist to each knuckle). Nothing on the clay avatar changed.

## Pelvis control moved low and chest bending (18 Nov 2026)

16. The pelvis control (the skeleton's root, the one handle that moves and
    turns the whole body) now sits exactly between the two hip balls, as in
    the owner's reference picture, and reaches up to the waist. It was 15 cm
    higher. The clay avatar did not change. Kept: one waist joint (no extra
    chest pieces).
17. Owner said go: subtle chest movement by gentle bending of the chest
    surface instead of more pieces (`avatar-lab/src/chest-bend.js`; checks:
    `npm run test:chest`). A new upper-chest bone (53 bones) bends forward
    up to 15° and twists ±15°, pivoting on the chest's centre line level
    with the shoulder balls. Forward bend: shared evenly up the chest, so
    each shoulder ball turns in place and the waist seam never moves.
    Twist: the sides (shoulder sockets) turn fully, the front and back of
    the belly lag smoothly; the rim and waist ball only slide round
    themselves. Collarbones following the shoulders (shrugs) is the next
    step, after the owner checks this. Owner approved ("looks good").
18. Collarbones now move (owner approved, "looks good"): shrug up 4°
    (about 2 cm), down 1°, forward 4°, back 4°. The chest around each
    shoulder socket follows its collarbone softly, so the ball stays snug.
    Shoulders also follow the arms on their own
    (`motion-core/skeleton/shoulder.js`): they lift when the arms go up
    and come forward when reaching. Kept small because the chest has only
    about 4 cm below each socket to stretch (behind the upper arm).
    New poses: Shrug, Reach forward.
19. Skeleton section 4, reaching (waiting for the owner's check;
    `motion-core/skeleton/reach.js`, checks: `npm run test:reach`). Tell a
    hand or foot where to go and the arm or leg bends to get there, solved
    exactly (two-bone method), inside every joint limit. Feet: give the
    ground point and heading, the foot lands flat. Elbows point down, a
    little back and out; knees forward. Out of reach: the limb points
    straight at the target. Shoulders follow while reaching. Note: the
    approved ankle tips the toes up only 18°, so a deep squat with flat
    feet needs the hips back (like a real squat). Demos: Squat, Foot on
    step, Follow the ball.
20. Reaching fixes (owner asked, 18 Nov 2026; waiting for the owner's check):
    hands reach with the palm centre, measured on the approved hand
    (`avatar-lab/src/palm.js`: halfway wrist→knuckles, halfway across, on the
    palm surface); the palm turns to face its target using the forearm roll
    and the wrist together. Sit (renamed from the old squat): lowers once
    onto a simple block measured to touch him exactly, thighs level, palms
    resting on the thighs. Squat: gym form, upper body leaning 28° (level
    thighs + lean must stay inside the hip's 120° bend). Foot on step: the
    block starts 3 cm past the measured toes; the foot rises 10 cm above it
    first (the toes droop because the ankle lifts them only 18°), then over,
    then down; checked never to touch the block. Leg out: left leg 35° out to
    the side. Checks: `npm run test:demos`. Owner rule: never guess; ask and
    explain first.
21. Sit fix (owner's item 1 of 3): no more arm glitching, hands lie flat.
    Causes found: the thigh-top point was looked up fresh each frame and was
    sometimes not found while the thighs were near upright; when two elbow
    bends both worked the arm could flip to the other; the palm solver let
    the elbow and forearm roll chase each other. Fixes: the palm rest point
    is measured once on the front of the thigh (3/4 to the knee) and rides
    with it; ties go to the bend closest to the current pose; the palm is
    turned by one smooth solver (arm spin + forearm roll + wrist together,
    Levenberg-Marquardt) that starts from last frame; the hands travel from
    hanging to the thighs while he sits. Checked: under 2.2° change per frame
    while sitting, still once seated, palms flat within 0.6°, fingers along
    the thigh. Next: item 2 (squat smoothness), then item 3 (step).
22. Seated hands turned 55° toward the middle of the body: middle fingers aim
    at each other, thumbs angle back toward the belly button (owner's request,
    20 Nov 2026; skeleton-test/demos.js HANDS_IN = 55, ELBOW_OUT = 1.25: the
    elbows flare out while sitting so the wrist stays inside its 20° limit and
    the sit stays smooth; stable from ELBOW_OUT 0.75 to 1.5). Earlier it was 20°.
    Palm centre now halfway along the palm (ball sits mid-palm); seated palm
    rest point 73% along the thigh (was 78% with the old, lower palm centre). Also: palm solver no longer searches spins inside its own steps
    (was 85 ms a frame while sitting, now about 3 ms). Known, to fix next with
    the smoothness items: at the very end of sitting the elbows swing out a
    little quickly (3.8° a frame; the check's limit is 3°); standing up from
    Sit snaps instead of rising smoothly.
23. Mentor plan agreed (owner, 18 Nov 2026): stop tuning demo visuals; build the
    fundamentals in order: (1) smooth switching in the core, (2) Section 5
    hands and feet (fingers bend and grip; fixes overlapping fingers and
    holding the knee), (3) balance and weight shift (makes squat and step
    athletic). Demos are only checked, not tweaked.
24. Step 1 done: smooth switching in the core (`motion-core/skeleton/pose.js`).
    The body's position (root) moves through the same quintic transitions and
    clips as the joints; reaching is a player layer (setGoals/clearGoals) that
    fades in and out, carries on from last frame, and can be released after a
    wait; layers can follow a function of time; fades that change course keep
    their speed (no kink); the shoulders follow inside the player. Demos now
    run through the player (`createDemoRunner` in skeleton-test/demos.js):
    Sit stands back up smoothly (hands travel back, feet released when
    standing); Squat and Step stop smoothly; Squat/Sit are driven by bend angle
    (no corner near standing). Core fixes found by the new checks: a partly
    flat foot crept toward flat over reaching passes; ankles now ease into
    their limits (tanh, 3°). Known (step 3): when the stepping knee is high the
    ankle reaches its limit (a small jolt), fixed by weight shift and foot
    planning. Checks: `npm run test:pose`, `npm run test:demos` (start/stop of
    every demo frame by frame).
25. Step 2 (hands) built, waiting for the owner's check. Hands bend on the
    graphics card (`avatar-lab/src/hand-skin.js`, about 14 µs a frame for
    both; the hand lab's rig takes about 40 ms a hand), weighted from the
    approved rig's own binding; matches the approved hand within 4 mm
    anywhere (about 1 mm on average), palm and wrist ball rigid. New palm
    bones (one per finger, 63 bones in all) carry the thumb's swing across
    the palm and the fingers closing together, as the approved hand does.
    Hand shapes (`motion-core/skeleton/hands.js`): the approved hand's own
    numbers (curl per finger, opposition, together) as finger angles.
    Gripping: each finger curls until it touches the shape and stops
    (measured finger thickness); fingers glide to the grip. Sit: palms at
    78% along the thigh (closer, the arms hit the shoulder limit and flip),
    fingers wrap over the knees. Checks: `npm run test:hands`,
    `npm run test:grip`, `npm run test:demos`. Note: a 12 cm ball is bigger
    than this stylized hand can wrap (the approved curl is about 90°); rods,
    rims and knees are fine. Small one-line addition in hand-lab/src/hand-rig.js:
    it now also returns its binding (read only; no change to how it bends).
26. Speed clean-up (no visible change): a palm that faces its target now costs
    about 0.26 ms a frame (was about 3 ms): the palm solver works out the
    fixed parts of the limb once per frame instead of every step, stops once
    settled, and the shoulder-follow second pass is skipped when the shoulders
    moved under 0.05°. Gripping: about 0.3 ms a hand (was 0.67). Checks
    tightened to match (palm under 1 ms, grip under 0.5 ms).
27. Owner-authorized ankle mechanics: a real ankle ball and two rigid smooth sockets.
    Shared contract: avatar/src/joints/ankle-contract.js; radius115mm, radial
    clearance0.6mm, unchanged knee/sole/contact locations. Foot Lab now exposes
    Joint / Foot socket / Calf socket / Ball for inspection. Isolated ankle
    up36/down48 androll±20 double the prior range. Point+heel total is capped
    at60 (actual shells intersect from66); use normalizeAnklePose, not48+30.
    Skeleton keeps Claude's 63 bones and 18 rigid attachments, including ankle balls; pose/reach
    algorithms and demos remain Claude's work. Geometry/attachment checks cover
    seating and actual shell collisions. Await owner's visual review before
    updating a frozen checkpoint. Full details: motion-core/PLAN.md and
    foot-lab/README.md.

## World rules (approved 19 Nov 2026)

28. The block list, minigames, shapes and who owns what are in
    `docs/WORLD-RULES.md`, the one source for the world. 25 blocks approved
    one card at a time (19 Nov). The stone underside is now "bedrock": merged,
    smooth, one colour (replaces the tiny-edge choice; code not changed yet).
    Code (19 Nov): the rulebook `src/world/rulebook.ts` (26 blocks, feel
    numbers not set yet), the world checker `src/world/checker.ts` (9 rules),
    and `src/world/world.ts` (one list of parts is drawn, made solid and
    checked). The island now uses it: bedrock merged and smooth; roots are
    their own separate block again (owner, 19 Nov), not merged. Checks: npm run test:world, npm run test:island.
    Next: block numbers, one game at a time.

29. Movement plan addition (owner, 19 Nov): ledge grab and climbing, after
    balance and jumping. Grab edges and hang, pull up, shimmy sideways, let
    go; climb almost any solid block (trees, leaves, rock, walls; not lava or
    cactus); hands use the rod grip for poles and branches.
30. Movement plan addition (owner, 19 Nov): a juke (quick dodge) to avoid
    a punch or hit, plus the hit movements (punch, kick, throw, swing,
    stumble, knock-down, get up). After balance.
31. Movement plan addition (owner, 19 Nov): ragdoll (a loose, floppy fall
    when a kart hits someone), then getting back up.

## How changes are handled (owner, 19 Nov 2026)

32. The owner may change any approved decision later, once things are
    actually built. Claude never pushes back with "but you suggested this".
    Instead Claude confirms the change plainly, e.g. "Earlier you wanted X;
    now you want Y, correct?", then updates the notes after the owner says yes.

## Plan for the movement restart (owner, 19 Nov 2026; after the jointed avatar is approved)

33. Go back to the last movement state with no issues or glitches, from
    before the owner started asking for quick visual changes. Claude finds
    that point in the history and confirms it with the owner before
    restoring anything.
34. Focus hard on the code: build the foundational movements first, the ones
    that open up the others (balance and weight shift, standing, stepping),
    each layer solid and checked before the next.
35. Fixed 20 Nov 2026: in "follow the ball", the ball is now in the middle of the
    palm (the palm centre is measured halfway along the palm, not a quarter of
    the way). Seated palm rest point and the grip test's rod moved back 2 cm to
    match.
36. Layer 2, balance, built 20 Nov 2026 (`motion-core/skeleton/balance.js`,
    `npm run test:balance`, 28 checks). Foundation, not a fixed number: it works
    out the body's centre of mass (standard human mass shares per segment) and
    which foot contact points carry weight (those within 2 cm of the ground
    under them; `ground(x, z)` can be raised for steps or terrain), then shifts
    the whole body so the weight sits over them while the planted feet stay
    exactly put (the legs bend; the body also lowers just enough that a straight
    leg can still reach). The shift is a smooth follower (quintic curves that
    carry speed and acceleration when the target changes, arrive exactly, never
    overshoot). In the pose player: `setBalance({axes, duration, ground})`,
    `clearBalance({after})`, `balanceShift`. Sideways only by default
    (`axes: 'xz'` with `fore` 0 heels to 1 toes also does fore/aft). Costs about
    0.8 ms a frame. The step demo uses it (the hand-made sideways shift in the
    step is gone) and the feet are now let go 0.6 s after the foot is down so the
    weight can settle first. The ankle swing that was left in the step (3.7° a frame)
    is fixed by foot planning (item 38).
37. Owner rule change (20 Nov 2026): layers no longer wait for the owner's
    approval. Claude codes and checks each layer thoroughly (automatic checks
    plus a look at the result) before starting the next; the owner reviews when
    they wish. Recorded in `motion-core/PLAN.md` decision 1.
38. Layer 3, foot planning, built 20 Nov 2026 (`motion-core/skeleton/footplan.js`,
    `npm run test:footplan`, 27 checks). A planted foot is held at an exact spot
    (never slides). A step is a smooth path (position, speed and acceleration
    all continuous): the foot rises first, moves across, comes down flat, starts
    and ends at rest in the world, and clears the ground using the foot's real
    shape (`ground(x, z)` gives stairs or blocks; checked 320 times along every
    step). Changing a step in the middle carries the foot's speed and
    acceleration on (no jolt); turning takes the short way round; left and right
    are exact mirrors. It is a pure function of time (`planner.goals(t)` feeds
    `player.setGoals`), so it works at any frame rate and trial passes are
    harmless. The reach layer now understands foot `pitch` and `roll`.
    The step demo uses it, and that finished the step: the old known ankle jolt
    is gone (0.9° a frame against a 1° limit; the body ends exactly at rest).
    (Its findings were then worked on in layer 4, item 39.)
39. Layer 4, legs and feet, in progress 20 Nov 2026. Done so far:
    (a) The leg solver no longer snaps when a joint limit starts to bind: when
    the hip cannot twist as far as the foot's direction needs, the leg goes as
    far toward it as the limit allows instead of all or nothing (a thigh snap of
    10° in one frame became 0.08°; regression test in `test:reach`, which fails
    on the old solver).
    (b) `reach` now reports `tilt` for feet: how many degrees the real foot angle
    is from the one asked for (0 normally; more when the ankle's own limit holds
    it back).
    (c) The foot planner no longer adds lift on top of a foot that is already
    high when a step is changed in the air.
    (d) Balance defaults changed to what tested best over the whole step cycle:
    `policy: 'inside'` (move the weight just 4 cm inside the support instead of
    to its centre: a 94 mm shift instead of 176 mm, so the free leg splays far
    less) and `stance: 0.012` (the legs stay 12 mm short of straight, like an
    athlete's, so a leg is never run to fully straight, where the knee angle
    changes infinitely fast and snapped by 6° to 8° a frame). The stance and the
    shift ease in and out; keep the feet goals until `balanceShift` is null
    again after `clearBalance`. `policy: 'centre'` and `stance: 0` are still
    available. The step demo check now has three runs (stopped while rising,
    after landing on the block, while stepping back down); the old check only
    watched the first second and could not see the landing. All stay under 0.9°.
    (e) `npm run test:robust` (10 checks, about 10 s): many random but
    repeatable cases. 28,900 random leg frames (no invalid numbers; any bent leg
    lands within 0.1 mm; no snap anywhere away from the edge of the leg's reach,
    and it catches 5 snaps in the solver from before item (a)), 75 random
    sequences of foot steps over random ground (finite, never more than 3 mm
    into the ground, no jumps in position or speed, exact landing), and 60
    random balanced stances. The one thing a plain IK cannot do is stay smooth
    at the very edge of the leg's reach (fully straight, a singular pose): that
    is avoided by keeping the legs slightly bent (the balance stance), not by
    the solver.
    Decided to postpone: heel-to-toe foot roll (heel strike, flat, heel lift,
    toe-off). A rigid pivot makes the ankle's speed jump when the pitch passes
    through zero, and a real gait gets around that through the body's own
    motion, so it is built together with walking; the foot mesh also does not
    bend at the toes yet.
    Still open for layer 4: the swinging foot's angle can still be up to about
    9° off when its ankle hits its limit (12 of 108 frames in the step; reach
    now reports it as `tilt`).
40. Layer 5, upper body, built so far 20 Nov 2026:
    (a) Looking and aiming (`motion-core/skeleton/look.js`, `npm run test:look`,
    19 checks): `lookAt` shares a turn between the waist (turns only), chest
    (turns a little, bends only forward), neck and head by weights (the head
    most), never past any joint's limit; a joint that is full passes the rest on.
    The face hits any target within the joints' reach to 0.0001° whichever way
    the body faces; targets past that (far to one side and steeply up or down at
    once, or behind) go as far as the joints allow and say so (`saturated`,
    `error`). Looking behind keeps the side it was on instead of snapping. 
    `createLook` is the smooth follower: the neck, chest and waist follow on
    their own times, the head leads and makes up for whatever the body has not
    done yet (it may pass the target by under 4% of the turn, then settles), no
    joint turns faster than a person's (head 600°/s), and `sample(t, target)` is
    a pure function of time like the foot planner. The Skeleton page has a
    "Look at the ball" demo (a ball swinging up to 95° to either side; the face
    stays within 4.5° of it).
    (b) Arms and hands were fuzz-tested like the legs: palm goals made from real
    arm poses in the middle 40% of each joint's range are landed to 0.5 mm in
    every frame, facing right, with no snaps (14,460 frames in `test:robust`).
    Known limit, for when climbing arrives: near the extremes of the shoulder,
    forearm roll and wrist (beyond about 60% of their range) the palm solver
    can flip between two equally good arm poses from one frame to the next and
    some frames miss (about 0.3% of frames in a harsh test); plain position goals
    (no facing) are solid everywhere. More solver iterations help the facing but
    not the flips.
    Still to do in this layer: the chest's lean into movement and counter-twist,
    and arm swing, which depend on walking and are built with it.
41. Layer 6, walking, built 20 Nov 2026 (`motion-core/skeleton/walk.js`, `npm run test:walk`, 19 checks;
    the Skeleton page has a "Walk" demo and `skeleton-test/demos-check.mjs` checks it as the page runs it):
    (a) How it works: the feet lead. A standing foot lifts when it has fallen far enough behind the body, rolls
    off its toe, swings (clearing the ground), strikes with its heel and rolls flat, placed ahead of the hips by
    half a stance for the speed and acceleration the body will have when it lands. The planner stays exact: every
    foot lands where it says (0.00 mm), no part of a planted foot ever slides, nothing goes below the ground.
    Balance, body height (the stride of a rigid leg, so the body bobs about 12 mm), sideways sway (about 3 cm),
    pelvis and chest turn and arm swing all come from the foot positions. A turn too quick for the feet is eased
    (the body may not twist past what the hips allow from a standing foot while it is slow, and never turns faster
    than 250°/s). The knees are never locked: soft in the walk
    (22° to 63°), nearly straight standing (about 10°).     (b) Numbers at 0.65 m/s: 2.3 steps a second, steps 0.28 m, both feet down 30% of the time, worst joint speed
    change 3.7° a frame, 1.2 ms a frame for the whole stack. Top walking speed is 1.0 m/s (the run gait is next).
    (c) Turn first (approved by the owner 20 Nov 2026, same day): a big turn from standing is made on the spot
    before he sets off. The walker asks the movement rules to hold him (`controller.state.hold = walker.holdMove`,
    set once a frame before `advance`) while both feet face more than 70° away from the way he is asked to face;
    meanwhile closing steps turn the feet round (up to 55° a step, 0.3 s a step: a 150° flick sets off after about
    0.65 s). The knobs, all easy to change: walker `turnFirst` (false = off), `pivotAngle` (70), `pivotStep` (55),
    `pivotStepTime` (.3), `maxTurnRate` (250°/s), `maxBodyTwist` (32); movement rules `turnFirstAngle` (radians,
    0 = off, the 3D-WORLD-3 feel; above 0 any turn bigger than this from nearly still is made first even without
    the walker) and `turnFirstSpeed`. `test:motion-core` still matches the old controller (the new rule is off by
    default there).
    (d) Known limits, honest: (1) a very hard flick while already moving can still outrun the feet: hips run out
    of range and a foot can be off its spot by a few centimetres for a moment (random sticks: 0.18% of frames over
    1 mm, worst 3.4 cm; it was 0.6% and 10 cm before turn first). (2) The start of a step from standing shows a
    knee jolt of up to 13° a frame (a nearly straight knee moves like a square root); the body now sits 12 mm
    lower while a foot is in the air to soften it. (3) The walk was only seen in a stick-figure view and in numbers;
    it needs the owner's eyes. (4) Speeds above about 1.0 m/s show jolts of 8-10° and 3.5 cm of bob until the run
    gait exists (the game's own walk speed is 3.1 m/s and run 8.6 m/s, so the gait must be scaled for those).
    (e) Other changes made with it: foot roll in the planner (`rollTo`, heel strike and heel lift, exact pivots),
    balance can follow a heading, exclude unloaded feet, plan the body height from outside and soften its safety
    drop (`hardExtension`, `hardSoftness`, numbers or functions of time), the ankle eases into its limit over its
    last 8° (was 3°; the footplan check now allows for that), the walk demo stops, turns on the spot and walks
    home by way of a spot behind the start so it ends facing the way it began.
42. Layer 6b, running, built 20 Nov 2026 (in `motion-core/skeleton/walk.js`, `npm run test:run`, 14 checks; the
    Skeleton page has a "Run" button that uses the game's own movement numbers):
    (a) The scale problem, in plain words: the game's speeds (walk push up to 3.1 m/s, full run 8.6 m/s) are far
    beyond what these short legs (0.68 m) can do the real way, so feet that never slide force a very fast, cartoon
    gait: about 4.7 steps a second at 3.1 m/s, 6.7 at 6.8 m/s and 7.6 flat out, with a long moment in the air in
    every step (30-45% of the time). Nothing about the game or the avatar was changed for it. The numbers are all
    in `WALK` (runCadence0, runCadencePer, runReach, runKick, runLaunch, runBob*, runArmSwing, runElbow, runLean,
    runOn 1.3 / runOff 1.05 m/s for walk <-> run, runAhead) and were found by a search that kept every foot exact.
    (b) How it works: above runOn (or as soon as he is speeding up so hard that he will be there within a quarter
    of a second) the feet run on a clock: a foot leaves when its short stance (at most 0.2 m behind the hip) is
    over, half a stride after the other one, leaves the ground already moving forward (`launch`, `kick`, new in
    the foot planner), and lands ahead of the hip by the same 0.2 m, placed where the body will be (along its
    arc on a bend). The body sinks over each standing foot and rises in the air; arms swing wider with the elbow
    bent about 85°; the chest leans forward (2.2° for each m/s, at most 15°). Balance holds its weight shift in
    the air and keeps following the planned body height.
    (c) Results: steady runs at 1.7, 3.1, 4.9 and 6.8 m/s keep every foot within 1 mm in every frame, never
    slide, never go below the ground; flat out (8.6 m/s) 12.7% of frames are over 1 mm (worst 1.4 mm).
    (d) Known limits, honest: (1) a hard start from standing (0 to 8.6 m/s in 0.3 s) leaves a foot behind for
    a moment (worst 0.5 m); tight turns at full speed and a skid and re-start also leave feet off by up to about
    0.7 m for moments (random sticks at game speed: 20% of frames over 1 mm). (2) Flat out, the thigh swings to
    about -104° (limit -120°) and the knee snaps straight at landing: joint speed jolts up to about 190° a frame,
    so the top-speed run looks violent. Steady 3.1 m/s jolts are 12-15°. (3) Between the walk and the run (about
    1.0-1.7 m/s) the change is eased over 0.35 s but not tuned. (4) Nobody has looked at it yet; it needs the
    owner's eyes, and the owner may well want the cadence slower and the leaps longer, which means the
    feet-never-slide rule would have to bend at the top speeds: that is the owner's call.
43. Owner decisions, 20 Nov 2026 (confirmed): (a) Turn first is wanted (a big turn from standing is made on the spot).
    (b) The running gait keeps the cartoon, arcade feel that the game's speeds force (quick steps, long hops):
    "kind of like Super Mario", with the ragdoll feel but athletic. Do not slow the game's speeds or change the
    avatar for it. (c) Everything must stay flexible: tuning numbers live in `WALK` (walker), `MOVE_TUNING`
    (movement rules) and can be changed after the owner tests ("it was a bit too real" is a normal thing to say).
    (d) A line-by-line review of the walking and running code was done the same day. Fixed: old steps were never
    forgotten (the planner would have grown and slowed for as long as the game ran: now pruned each second, with
    a test), the stand-up crouch used absolute foot height (wrong on raised ground), a walker started facing
    another way had its feet facing north, the balance release left a jump, dead code and misplaced comments,
    and the Skeleton page's slab was only 4 m wide (it now goes along under a walking or running body, with 1 m
    grid lines so the movement shows). The demo also lets go after 60 s whatever happens.

