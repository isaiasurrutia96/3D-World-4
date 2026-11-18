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
   - New materials get a style once, in `MATERIAL_STYLE` in `src/island.ts`.

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
    step, after the owner checks this. Waiting for the owner's check.
