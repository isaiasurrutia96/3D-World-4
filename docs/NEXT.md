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
22. Seated hands turned 20° toward the middle of the body (thumbs closer to
    the body), owner's request (skeleton-test/demos.js HANDS_IN = 20; easy to
    change). Also: palm solver no longer searches spins inside its own steps
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
