# Mirrored hip socket appearance draft

Owner requested the actual torso, two hip balls and both upper legs separated,
with the spheres molding softly rounded sockets on both contacting parts.
This is private screenshot work, not full-avatar integration, animation,
a Test Lab addition, publication or a frozen checkpoint.

## Source and one-side construction

`hip-design.js` clones the actual torso from
`createAssembledAvatar({torsoSplit:false})`. Only the previous Gaussian hip
recesses are reset to the original profile before pressing the new sphere.
The source shoulders, broad chest, waist and central lower silhouette remain.
The upper leg comes from the approved knee draft, retaining that lower cup.
The knee-facing source region is never remolded for the hip.

The right/source half (+X) of the torso is carved once and reflected across
x = 0. Its original matching seam and pole samples retain authored normals;
welding those attributes changed the old apex shading during an initial
check, so the source-style coincident samples are kept. The geometric surface
is checked closed across that seam. The upper leg is molded once, then its
positions and normals are reflected and triangle winding reversed. This is
an exact mirrored copy, not an independently calibrated second socket.

The public study keys `thighL`/`ballL` identify the avatar's own left (+X);
the source rig's legacy mesh naming calls that screen-right. Both balls share
one sphere geometry. Each is 90% of the original top-cap width: 230.4 mm
diameter from the original 128 mm cap radius. A check independently measures
that source ring rather than relying only on the configuration number.

## Mold and placement contract

The accepted wrist/ankle rolling-circle solver creates actual spherical
contact surfaces, with 8 mm tangent fillets, current mean capture of 30% of the ball
diameter (69.120 mm) on each part. Refine and round only the thigh's upper
cap before pressing, so the source's 14 polygon sides do not scallop its lip.
No raised collar, separate rim mesh, or flat sharp-edged Boolean cut is added.

Both spheres stay exactly at the existing `thigh.L`/`thigh.R` heads:
`[+/-0.15, 0.8395, 0.025]`. These are read from the existing skeleton.
No bone, pivot, joint limit, skeleton file or motion behavior is changed.
`separate(false)` seats the four socket centers on those points for numerical
fit checks. The default `separate(true)` translates only the display torso
and upper legs to give 55 mm of clear vertical separation from the balls.
Toggling back and forth returns exactly to the same display positions.

The seated transforms are for this isolated appearance study. They do not
prove that a complete assembled avatar retains every other joint's world
placement. Later approved assembly must fit all existing bone endpoints
without moving the skeleton; this draft does not update that assembly.

## Verification and images

Run `node --test tests/avatar/hip-sockets.mjs` for eight hip checks. They cover
fixed skeleton points, measured proportional size, exact bilateral reflection,
closed finite outward-wound solids, real sphere/circular fillet fit and
tangency, mean capture depth, exact protected torso/knee positions and normals,
seated center coincidence, repeated exploded placement and every triangle's
distance from its seated ball. These are static geometry checks, not a claim
of full animated shell clearance.

The complete joint regression command is:

```
node --test tests/avatar/hip-sockets.mjs tests/avatar/knee-sockets.mjs tests/avatar/elbow-sockets.mjs wrist-lab/tests/study.test.mjs foot-lab/tests/ankle.test.mjs
```

The initial 22% capture draft passed all 43 checks. Its maximum triangle intrusion was 0.114515 mm,
below the 0.2 mm sphere-mesh tolerance. Sphere and rim vertex errors are below
30 nanometers; maximum tangent-slope mismatch is 8.5e-11. The checks preserve
13,284 upper-torso samples and 61,997 approved lower-thigh/knee samples exactly.

`node scripts/preview-hips.mjs` writes only `/tmp/hip-socket-preview` and
`/workspace/previews/hip-joint`. It verifies the lossless baked geometry,
normals, exact indices, materials and transforms before opening the private
renderer. Procedural construction and QA metadata do not run in the browser.
The browser verifies five separated parts, unchanged transforms/visibility
after capture, and no page errors. All screenshots use the actual geometry.

Outputs:

- `front.png`, `side.png`, `angled.png`: 1800 x 2400 each.
- `all-views.png`: directly rendered 2700 x 1200 three-view sheet.
- `socket-details.png`: directly rendered 2400 x 1200 close-up sheet,
  showing the torso underside and upper-leg cups from above.

Both final sheets were visually inspected. Nothing is added to a live lab,
the saved avatar, motion code or a checkpoint. Await owner visual feedback
before combining these parts or continuing to another section.

## Seated inspection requested by owner

The owner subsequently requested putting these five parts together.
`node scripts/preview-hips.mjs --seated` now uses the existing
`separate(false)` placement, without changing any surface, normal, index,
material, quaternion, scale or ball position. SHA-256 comparisons enforce
that protection before baking; all four socket-center errors are exactly
zero. The browser again verifies the lossless asset, five static parts,
unchanged capture transforms/visibility and no page errors.

The new private cache is `/tmp/hip-seated-preview`, keeping the separated
cache intact. Output `/workspace/previews/hip-seated` contains front, side
and angled 1800 x 2400 PNGs and an inspected 2700 x 1200 three-view sheet.
This combines only the torso, hip balls and upper legs for static appearance
review. Full-avatar attachment, animation, publication and a checkpoint are
still outside this task.

## Current closer fit

Owner requested pressing the torso and upper legs closer together. Capture
now increases from 22% to 30% of the unchanged ball diameter on both cups.
The same 8 mm soft rolling fillets and exact mirrored construction remain.
Compared with the previous seated asset, the torso moves down 29.392 mm and
both thighs move up 42.197 mm: 71.589 mm closer in total. A measured before/
after asset comparison verifies unchanged ball positions, radius, geometry,
normal buffers and indices. Skeleton points remain unchanged.

Deeper pressing stretches the pelvic triangles near the sphere's equator.
Pre-carve subdivision alone did not fix the resulting 0.413 mm chord
intrusion. The final private helper refines the ACTUAL molded surface by
3D edge length, then reprojects only new samples onto the original sphere
and rolling-circle profiles. All original fitted vertices/normals remain
exact. The same result is mirrored, rather than remolding the opposite side.

The lip's nearly vertical tangent has a slope around 1201. Comparing raw
slopes is ill-conditioned there. Its direction is now checked by angular
difference, with a 1e-7 radian bound; measured mismatch is 2.27e-11 radians.
This measures physical tangent continuity without changing geometry tolerances.
All eight hip checks pass. Maximum triangle intrusion is 0.114514 mm, below
the unchanged 0.2 mm limit; sphere/rim errors stay below 30 nanometers.
Protected upper-torso/knee samples, fixed balls, symmetry, closure and reset
checks continue to pass. Unrelated joint geometry and shared solvers are
unchanged; no extra movement or full-avatar assembly is introduced.

Latest screenshots: `/workspace/previews/hip-snug`, three 1800 x 2400 views
and the inspected 2700 x 1200 `all-views.png`. The earlier separated and
seated screenshots/caches are preserved. Reproduce with:

```
HIP_PREVIEW_CACHE=/tmp/hip-snug-preview HIP_PREVIEW_DIR=/workspace/previews/hip-snug node scripts/preview-hips.mjs --seated
```

The renderer verifies seated center error below 1.2e-16 m, lossless geometry
round trip, static capture, unchanged geometry during seating and no page
errors. This remains a private appearance draft awaiting visual feedback.
