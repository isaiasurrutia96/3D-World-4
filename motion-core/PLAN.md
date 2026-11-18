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

## Skeleton (approved plan, 18 Nov 2026)

The owner chose to build the body's joints before hands, feet and walking,
the way game developers do: an invisible skeleton of bones joined at
pivots, with the clay parts hung on the bones later. Order:

1. The skeleton (built).
2. Attach the clay body parts to the bones, sockets staying seated (approved).
3. Poses: set and blend joint angles smoothly (built, waiting for approval).
4. Reaching: work out joint angles from where a hand or foot must go.
5. Hands and feet detail (finger curl, spread, thumb, toes, ball of the
   foot, tiptoe), rebuilt to match the approved Codex hand and foot.
6. Then the movement layers: balance, foot planning, legs, upper body.
Grips for mini games come later, built on the hand layer.

### Section 1 · The skeleton

Files: `skeleton/bones.js` (the bones, measured from Checkpoint 2),
`skeleton/skeleton.js` (building, limits, mirroring, forward kinematics),
`tests/skeleton.mjs` (`npm run test:skeleton`).

1. 53 bones: pelvis (root), spine (waist), chest (upper chest), neck, head; each side collarbone, upper
   arm, lower arm, hand, hip bone, thigh, shin, foot, toes, and three bones
   per finger and thumb.
2. Every joint pivot was measured from the approved Checkpoint 2 model.
   Angles are absolute (0 = limb hanging straight, finger straight); the
   rest angles reproduce the approved model exactly.
3. Each joint has limits: knees only bend backwards, elbows only forwards,
   ankle and toes use the approved foot's range, fingers the approved
   hand's curl range.
4. Only the right side is written; the left is its exact mirror.
5. Fingers: pivots at the middle of the approved hand's three bending
   zones. Curling them lands each fingertip within 4 mm (rest) and 6 mm
   (fully curled) of the approved hand. The exact finger surface will come
   from the approved hand's own bending in section 5.
6. No visuals yet; shown in the Test Lab once the body parts are attached.

### Section 2 · Body parts on the bones

Files: `skeleton-test/attach.js` (glue), `skeleton-test/main.js` (Test Lab
page "Skeleton (section 2)"), `skeleton-test/check.mjs` (`npm run test:attach`).

1. While attaching, the checks showed several old pivots sat at the edge of
   each joint ball, which would pop balls out of their sockets. All pivots
   now sit at the centre of the child part's joint ball (sphere-fitted on the
   approved model): shoulders, elbows, wrists, hips, knees, head.
2. All 15 clay parts hang on a bone. The rest pose matches Checkpoint 2
   exactly; every joint ball stays within 0.07 mm of its socket centre in
   40 random poses.
3. Not bending yet: fingers and toes (one piece each, hands-and-feet
   section), the waist (the torso is one piece from hips to shoulders), and
   the ankle socket lip (Codex's foot rebuilds it; hands-and-feet section).

### Naming fix (approved 18 Nov 2026)

Bone names now use the avatar's own left and right (.L / .R). He faces +Z,
so +X is his left. The approved model's older code calls +X parts "right"
(screen-right when facing him); the skeleton no longer follows that.

### Section 3 · Poses and smooth movement

Files: `skeleton/pose.js` (easing, blending, clips, pose player),
`skeleton/poses.js` (pose library and the looping wave clip),
`tests/pose.mjs` (`npm run test:pose`). Shown in the Skeleton test.

1. Blending mixes joint angles; every in-between pose stays inside every
   joint limit (a blend can never bend a knee backwards).
2. Transitions use a quintic curve: they start with the position, speed
   and acceleration the body already has and arrive exactly on time, at
   rest. Interrupting one mid-way never jerks. Same result at any frame rate.
3. Layers play a clip or pose on only the bones it names (the wave on the
   left arm) and fade in and out smoothly.
4. Clips: poses at times joined by smooth curves (Catmull-Rom), looping
   seamlessly. The wave swings the forearm from the elbow (bending and
   straightening it) with the hand a quarter-beat behind; the elbow stays
   put, the hand swings about 17 cm.
5. Any future pose (point, thumbs up, grips, kart poses) is just a list of
   joint angles added to poses.js.

### Waist (18 Nov 2026)

The torso is a chest on a pelvis with a ball-and-socket waist. The spine
bone now pivots at the chest ball's centre; it turns (y) ±35° and does not
lean yet. The pelvis bone carries the pelvis piece and the legs.

### Collarbones and hip bones (18 Nov 2026)

Each arm hangs from a collarbone (base of the neck to the shoulder ball)
and each leg from a hip bone (pelvis centre to the hip ball). Both are
locked at 0: the hip bones are part of the solid pelvis, and the shoulder
ball sits in a socket in the one-piece chest, so shrugging or reaching the
shoulder forward needs that socket redesigned before the collarbone moves.

### Pelvis control (18 Nov 2026)

The root (pelvis bone) sits exactly between the two hip balls and reaches
up to the waist pivot, like the owner's reference picture. Moving or
turning it carries the whole body; the hip bones start from it.

### Chest bending (18 Nov 2026)

The upper-chest bone (pivot on the centre line, level with the shoulder
balls; order YXZ: bend, then twist) bends forward 0–15° and twists ±15°.
The chest stays one piece: its surface bends softly
(`avatar-lab/src/chest-bend.js`). Each point turns about the pivot by its
own share of the bend (shared evenly by height above the seam rim) and of
the twist (full at the sides where the shoulder sockets are, lagging at
the front and back). Checks (`npm run test:chest`): exact at rest, seam and
waist ball unchanged, top of chest firm, shoulder sockets snug (under
1 mm), no folds, no pinching below 60%, no new crease over 8°, volume kept,
about 1.3 ms per changing frame and nothing when still.
