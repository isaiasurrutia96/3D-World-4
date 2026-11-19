# Single shoulder appearance draft

Owner requested only one side for visual review, using the same code-first
process as the other joints. It uses the actual torso from the latest 30%
hip design and the actual upper arm from the approved elbow design. The
private renderer independently compares their pre-edit position, normal and
index buffers with those earlier accepted baked assets, byte for byte.

Only one shoulder ball and one upper arm are generated, with the whole torso
for context. No new opposite-side shoulder is mirrored or rendered. The
existing opposite recess remains unchanged in the torso's source geometry.
No live avatar, lab, motion code, skeleton, bone or checkpoint changes.

The 180 mm ball is 90% of the measured 200 mm source upper-arm top width.
Its center is exactly the existing `upperArm.L` head
`[0.2979, 1.2464, 0.0035]`. The torso's side-facing socket and the arm's
upward-facing socket initially capture a mean 30% of this diameter (54 mm),
with 6 mm real rolling-circle fillets. The later medial trim removes only
the marked side of that arm cup; surviving contact stays on the same sphere. The old arm-sized recess is filled locally
before pressing the new ball; the accepted rounded upper lip is retained.
An exact signed coordinate permutation presents the torso side to the same
checked mold used by the other joints, then returns it to avatar space.

The hip's refinement/reprojection helper is extracted unchanged into
`refine-molded-cup.js`. Its defaults retain the accepted hip geometry exactly.
Shoulders use two rounds so the actual curved triangles clear the sphere;
an initial single pass measured 0.228 mm intrusion versus the 0.2 mm limit.
Pre-refining the torso patch and using the analytic rolling-circle lip normal
field removes the coarse source's jagged rim shading. Positions retain the
exact fillet; protected authored normals elsewhere remain unchanged.

## Owner's marked inside-edge refinement

During review the owner marked a sloped line down the torso-facing upper-arm
edge. The initial scoop left an overhanging lip and looked like a backwards
C; that shape is rejected. The current trim retains the half-space
`x - 0.5*y + 0.11 >= 0`, giving one continuous diagonal inner edge rather
than a notch underneath an untouched rim.

`shoulder-clearance.js` clips only that corner. Shared geometric-edge
intersections give the retained shell and cap the exact same boundary.
Pinned `cdt2d` triangulation, with 3 mm interior sampling and constrained
boundary edges, closes the trim without thin triangle fans or T seams.
Bounded local fairing softens the new edge by at most 1.5 mm. Original
retained ball-contact and rolling-rim vertices are pinned, and the approved
elbow end remains exact. Cut-face normals are accumulated by welded geometric
node, including duplicated source attribute seams, to avoid a jagged lighting
line across coincident cap/shell samples. A separate normal-only diffusion
step then smooths irregular cap/shell area weighting in the 9 mm trim band;
it moves no surface point and preserves normals outside that local band.
Measured local normal variation decreases by about 94%. Removed cup vertices are removed from its contact
metadata rather than advertised as surviving contacts. The trim retains
97.76% of the arm volume; the maximum softening displacement is 1.496 mm.

`inspectRest()` is static placement using only the existing skeleton's
upper-arm rest angles (-0.04 rad X, +0.20 rad Z); it adds no motion system.
The ball stays fixed and both cup centers stay on it. `separate()` restores
the exact separated inspection. The measured local static peak overlap
changes from 38.407 mm to 35.951 mm. Some torso overlap remains, as the
owner allows; this draft does not certify complete animated shell clearance
or full-avatar integration.

## Checks and screenshots

`node --test tests/avatar/shoulder-sockets.mjs` passes all 12 checks: one fixed
ball, measured proportions, exact spherical/circular contact and tangent
directions, smooth lip normals, protected opposite shoulder/hips/elbow,
continuous sloped trim, retained volume, reduced local normal variation,
static rest overlap,
socket seating, repeated inspection/reset, finite geometry, consistently
wound closed solids and actual triangle-to-ball fit. Maximum intrusion is
0.018041 mm; sphere/rim vertex errors are below 15 nanometers. The lip-normal
angular error is below 4.5e-8 radians. The generic helper refactor also passed
the eight hip and eight elbow regression checks before the local arm trim;
those source buffers are compared exactly again during final rendering.

The renderer uses only the real baked geometry, not an image-generation
substitute. `node scripts/preview-shoulder.mjs --compare-sources` writes a
private cache in `/tmp/shoulder-slope-preview` and screenshots in:

- `/workspace/previews/shoulder-slope`: separated front/side/angled
  1800 x 2400 PNGs, a 2700 x 1200 three-view sheet and a 2400 x 1200
  socket-detail sheet.
- `/workspace/previews/shoulder-slope-rest`: static resting front/side/angled
  1800 x 2400 PNGs and a 2700 x 1200 three-view sheet.

Earlier `/workspace/previews/shoulder-clearance` and `shoulder-rest` shots show
the rejected backwards-C scoop; do not use them as the current design.
The final browser capture checks lossless geometry/normal/index/material
fidelity, one shoulder only, seated centers at rest, exact return to the
separated placement and no page errors. Await the owner's visual feedback;
do not mirror another shoulder, integrate the avatar, publish or freeze a
checkpoint without direction.
