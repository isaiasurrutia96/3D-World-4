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

### Collarbones move (18 Nov 2026)

Each collarbone shrugs (+z, up to 4°, down 1°) and moves forward/back
(−y forward 4°, back 4°). The chest around each socket follows it, applied
after the chest's own bend and twist from the chest's firm top, so the
sockets stay snug in every mix (checked: under 1 mm). The strip under each
socket (4 cm, behind the upper arm) takes the shrug's stretch; it is
checked on its own (67–173% with everything at its limit). Shoulders follow
the arms automatically (`skeleton/shoulder.js`, added on top of any pose).

### Section 4 · Reaching (18 Nov 2026)

`skeleton/reach.js`: reach(skeleton, pose, goals, {follow}) → {pose, error}.
Goals per hand/foot: wrist/ankle position, or a foot's ground point (sole)
plus heading (foot set flat). Exact two-bone solve: the hinge (elbow/knee)
from the distance, then point the limb, then spin it so the elbow/knee
faces the pole (blending to a second pole near the line). When a joint
limit blocks that, both hinge answers and the smallest workable spin are
used, so motion stays continuous. Feet: the spin is fine-tuned so the
ankle (which cannot twist) needs no twist, then the ankle sets the sole
flat. Stateless (pure function of the pose), so any frame rate gives the
same result. Checks: 600/600 random reachable targets within 0.5 mm, feet
planted and flat through a 32 cm squat with sway and turn, smooth following
(under 1° per step), exact mirror, about 0.1 ms for both feet and a hand.

Palm goals (18 Nov 2026): a hand can reach with its palm centre
(skeleton.palms, measured; `palm`, `face`, or `touch` + `radius`). The palm
point rides on the hand bone, so the arm is solved for that point; the palm
turns to face the target with the forearm roll and the wrist together
(inside limits, choosing the most relaxed mix), then a final exact solve
lands the palm. Checked: palm on a moving ball within 0.01 mm, facing
within 0.1°, smooth.

### Ankle ball and two rigid sockets — owner-authorized mechanical update

The owner paused the next racing section and explicitly authorized adding the ankle joint before hands, with a proportional ball, two smooth cradling sockets, numerical checks first, and more ankle range for Claude's movement work. This authorization includes the necessary mechanical skeleton limits/attachment update; no pose-player, reaching solver, demo motion algorithm or frozen checkpoint is changed.

Implementation:
- Rendering-independent `avatar/src/joints/ankle-contract.js`:115mm ball radius,0.6mm radial cavity clearance,45° cups,5mm rolled lips; isolated ankle−36/+48°, roll±20°, heel30° and toes25°. These double the previous isolated ankle/roll ranges.
- `foot-lab/src/ankle-socket.js`: measure the original uncarved foot's center first; carve a spherical foot bowl and construct a closed rigid calf cup with C1 rolled lip/blend. Preserve original sole/toe points, X/Z outline, upper calf and knee placement. Refine only the foot-lip mesh to avoid coarse edges. A separate sphere uses the same clay material. No tiny connector or scaled ball substitute.
- `foot-rig.js`: foot rotates around the actual sphere center; calf geometry no longer deforms to imitate a joint. Ball/calf/foot centers stay coincident through heel motion and ground lift. Shared normalization keeps UI, geometry and skeleton limits consistent.
- Actual shell tests found that blindly adding48° point+30° heel would drive the heel into the calf: penetration starts at66° total, rising to34mm at78°. The physical sum is therefore capped at60°, including±20° roll, while isolated48° point and30° heel remain fully available. `normalizeAnklePose` resolves a48+30 request to30+30; sliders display the resolved pose. This is a measured coupled limit, not a guessed range increase.
- Skeleton uses Claude's latest 63 bones (including his new palm bones); the ankle adds no bone. Attach the two ankle balls to the existing foot bones:18 visible body meshes. Correct the old rounded ankle Y=.1635 to its exact measured.163520006775856; rest mesh placements, sole, contacts and knee stay fixed. Foot bone uses[-36,60] bend and±20° tilt, with twist locked.
- Focused lab adds Joint/Foot socket/Calf socket/Ball inspection choices. The universal viewer mirrors those controls beside the model automatically. All checks and live pages remain separate from frozen checkpoints pending owner visual approval.

Verification:10 independent Node geometry checks pass, including145 poses with nanometer-scale center/radial drift, positive sphere-face clearance, closed manifold surfaces and 311,322 full-vertex shell probes after local lip refinement, with zero intersections. Skeleton28, attachment5 (including112 ankle/body poses), pose18 and reach9 checks pass; demo checks 13 PASS with the existing Step planning/smoothness item KNOWN. After integrating Claude's concurrent hand updates (471180c), the 63-bone skeleton, attachment, pose, reaching, GPU-hand and grip checks all pass again; Claude's hand work and optimizations are preserved. Only that diagnostic's obsolete18° wording is corrected; its motion/check logic is unchanged. Full production build also verifies frozen checkpoint integrity. Final browser results: focused Foot Lab and assembled Avatar Lab pass, including socket inspection, compound slider limits, exact rest, phone touch/orbit and framing, with no page errors. The complete avatar retains its 1.8945200003 m standing height and saved upper-body geometry; maximum knee seating error is 0.0000018 mm. Universal Test Lab and Motion panel pass six device layouts, mirrored controls, pose toggles, reset and model visibility. The Motion panel test now waits for its measured ResizeObserver layout instead of assuming a 150 ms delay is sufficient. The final production build passes. The integrated Motion panel browser suite passes again with Claude's latest hand code. Universal viewer cache versions are advanced so returning users receive the new joint. Complete triangle-to-sphere tests retain at least 0.413 mm foot clearance and 0.544 mm calf clearance; the nominal spherical socket clearance is 0.6 mm.

Stop after the verified live review link. The owner must review the appearance before a new frozen checkpoint is made. Claude's next animation/balance work should use the shared joint contract and ball-center pivots, not reintroduce the old deforming calf cuff or sum independent angle maxima.


### Foot cuff fit refinement — 19 Nov 2026

Owner approved a modestly higher foot cuff, enough to look snug around the ball rather than like an open slipper. Foot-only cap changes from45° to52° (10.57mm rim rise); calf, ball radius, center, foot sole/toes and joint limits stay fixed. A separate FOOT_SOCKET_CAP_ANGLE preserves the calf's original45° cap. The circular rolled lip and outer blend use the actual tangent at52°, keeping both joins smooth. Existing seating, closed-surface, sphere clearance and full shell/extreme-pose checks pass without changing movement code or limits. Frozen checkpoints stay untouched pending appearance approval.

Verification: all10 ankle geometry checks, all5 full-avatar attachment checks (112 ankle/body poses) and the focused Foot Lab browser suite pass. Phone framing, touch orbit/sliders, inspection choices, exact rest and rigid calf remain correct, with no page errors. 335,412 full-shell probes at the tested extremes show zero intersections; socket clearance stays0.6mm. Full production build and frozen-checkpoint integrity pass. Ready for owner visual review; no checkpoint created.


### Simple foot socket — owner correction, 19 Nov 2026

Owner rejected the raised cuff as still slipper-like and requested soft edges, a simple socket and code work in layers. Root cause: the circular rolled ridge followed by a negative-slope trough made trim; a hard upper-surface vertex filter and refinement limited to the lip left a jagged transition. Replaced only the foot socket profile with a spherical core, a curvature-continuous outward continuation (the heel gently flattens), and a6mm compact C2 smooth-min. No raised ring or dip. Every vertex uses the same carve-only field, with the entire bowl/outer transition refined consistently. Ball, calf, knee/sole/toes and motion limits remain fixed. The first uniform outward continuation failed the60° composed shell test; the lower heel continuation resolves this without loosening tests or changing motion.

Code layer: rendering-independent foot-lab/src/socket-profile.js. Eleven Node geometry checks pass, including the new five-direction/no-ridge/no-dip and slope/curvature continuity check, existing145 seating poses, closed surfaces and full shell/collision checks. Full production build and frozen-checkpoint integrity pass. Appearance/mobile verification recorded after inspection. Do not advance to another feature or create a checkpoint before owner appearance approval.

Final verification: full-avatar attachment checks5/5 pass, including112 ankle/body poses and1.08ms whole-body posing. Focused browser suite passes desktop/phone views, real touch controls, part inspection, exact rest, rigid calf and preserved sole/toes with no page errors. Geometry checks11/11 pass; 513,336 shell probes show zero intersections. Internal visual inspection confirms the previous jagged mouth and rolled trim are gone. Universal viewer cache advanced for this socket revision. Stop for owner review after live verification.


### Reset to shape baseline — owner decision, 19 Nov 2026

Owner requested going back to just the foot and calf and rebuilding the foot socket first, rather than constructing both sockets and the ball together. The live Foot Lab now uses createFootStudy: original uncarved foot and original reference calf, separated and grounded. No ball, socket or motion rig is created on this page. Removed its joint-parts/pose/play/slider UI; the universal Motion control is disabled for this static study. Node baseline check proves both source geometries/normals/indices are untouched and exactly two meshes are present and apart.

This is a study reset, not a rewrite of Claude's avatar/skeleton work or a frozen checkpoint. Existing default avatar factory and its checks stay protected. Next step requires the owner's go: foot socket only, then its own geometry checks and appearance approval. Calf socket, ball and reintegration are deferred. No socket is rebuilt in this reset task.

Reset verification: raw baseline Node check passes; both position/normal/index buffers match the original shapes exactly, with17.4cm separation. Focused browser suite passes all five views, floor, orbit, camera reset and three phone layouts with no errors. Targeted universal viewer checks pass at1440×900,390×844 and844×390, including disabled Motion, six views, Inspection/Isometric and actual Reset. Full production build, existing avatar-joint checks and frozen checkpoint integrity pass. Stop after the verified baseline link.


### Tiny foot socket only — owner go, 19 Nov 2026

Owner authorized a tiny socket in the foot only. Independent small-socket.js applies a shallow circular C2 indentation (40mm radius,8mm depth, X/Z[0,0] at the dome peak), with no raised lip. Does not reuse the rejected large joint/socket prototype. The raw calf stays separate; no calf socket, ball or movement rig is added. createFootStudy({socket:false}) preserves the original baseline. Shape checks confirm an actual concave bowl and exact original calf, X/Z/topology, sole and toes. Do not advance beyond this foot socket before owner appearance review.

Verification: both study Node checks pass, including actual concavity measured from the mesh. The browser suite measures7.999mm maximum displacement across261 upper-patch vertices; original calf, sole, toes, X/Z outline and topology stay exact. Desktop and three phone layouts, framing, floor, orbit and camera reset pass with no errors. Full production build and existing joint/frozen checks pass. Internal Top-view review confirms a tiny soft depression with no raised rim. Stop for owner review after publishing; no next layer or checkpoint.


### Deepen the foot socket — owner go, 19 Nov 2026

Owner described pressing an invisible ball farther into the socket, keeping a soft blended edge, and requested the geometry code be checked before updating visuals. Increase only small-socket.js depth8→16mm. Keep radius40mm, center[0,0], C2 radial shape and height fade fixed; no added rim, calf socket or ball. The height mapping remains strictly ordered (minimum vertical derivative0.5 at16mm), while displacement and first/second derivatives remain zero at the radial edge.

Code-first checks:3 study tests pass before the viewer build. Actual socket depth is measured from the mesh; original calf, X/Z/topology, sole and toes stay exact. Added full-mesh checks for noncollapsed/nonflipped triangles, closed and consistently wound seams, positive volume and finite normals. Original no-socket baseline remains available. No avatar motion or joint prototype changes.

Checkpoint decision: the owner will continue refining this foot socket, then the calf socket and ball placement. Save the next checkpoint only after those refinements are approved. Do not freeze this intermediate study or start another layer automatically.

Viewer verification: focused browser suite passes desktop and3 phone layouts, real orbit, floor, view reset and framing, with no page errors. Actual maximum depth15.9983mm across261 vertices. Top/angle internal inspection confirms the deeper bowl retains its blended edge. Full production build, existing joint checks and frozen integrity pass. Publish this refinement for review; checkpoint remains pending the owner's continuing socket and ball refinements.
