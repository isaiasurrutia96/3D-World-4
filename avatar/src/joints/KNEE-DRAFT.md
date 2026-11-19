# Knee appearance draft

Private screenshot approval only. Nothing imports this draft into a live page,
the Test Lab, the assembled avatar or a checkpoint. No animation is added.

`knee-design.js` uses the actual original thigh and the accepted molded calf
from `foot-lab/src/foot-study.js`. One sphere is 90% of the narrower calf
width: 224.623 mm across. Its center is exactly `shin.L`'s existing head,
`[0.15, 0.4724, 0.025]`, read from `motion-core/skeleton/bones.js`.
No bones, joint definitions, limits or source scales are edited.

The approved elbow molding, conservative inner-edge sculpt and bounded fairing
are reused through optional scale and cap settings. An exact local half-turn
adapts their inner-side convention to the knee: this joint bends backward
about +X, so -Z gets the lower lips and more exposed ball. Socket centers are
converted back into the original geometry frame before rigid display seating.
Shared defaults preserve the approved elbow's geometry and shading exactly.

Only the knee-facing caps are refined and rounded to their original authored
hemisphere before molding. Subdividing their original 14-sided polygons alone
leaves a scalloped rim. Original shaft and lower-calf positions and normals
are preserved; in particular, all 58,484 original vertices at or below local
y = -0.09 and the prior ankle construction metadata stay exact. The new knee
metadata is separate from the existing ankle metadata.

Both real spherical sockets capture a mean 16% of the ball's diameter. The
rolling-circle fillets are 6.190 mm, proportional to the accepted elbow.
The original surface sampler also guards the shared mold's height measurement
against an exact ray missing the top cap at a triangle edge. Existing wrist,
ankle and elbow checks must continue to pass after this correction.

Run:

```
node --test tests/avatar/knee-sockets.mjs tests/avatar/elbow-sockets.mjs wrist-lab/tests/study.test.mjs foot-lab/tests/ankle.test.mjs
```

The eight knee checks prove the fixed ball and socket centers, proportional
size, finite geometry, preserved ankle, actual spherical and circular fillet
fit, more rear exposure, all-triangle ball clearance, bounded fairing with
reduced normal variation, static bend seating, and closed outward-wound solids.
They do not certify complete limb-to-limb clearance during animation. Minor
overlap is allowed by the owner. Full-avatar attachment and animation belong
to later approved work; the translations here only seat this isolated study.

`node scripts/preview-knee.mjs` writes a private renderer and losslessly checked
asset into `/tmp/knee-socket-preview`, and screenshots into
`/workspace/previews/knee-joint`. The viewer receives baked geometry rather
than rebuilding procedural sockets in a browser. Construction-only metadata
is omitted from this private rendering asset; geometry, normals, indices,
materials and transforms pass the existing exact round-trip checks.

Static inspections use 0, 90 and 130 degrees of knee flexion (180, 90 and 50
degrees inside). Each pose has front, side and rear-angled 1800 x 2400 PNGs,
plus a directly rendered 2700 x 1200 three-view sheet. The renderer checks
coincident centers in every pose, exact return to rest, and no page errors.
These are inspection poses, not a new movement system.

Await owner appearance feedback. Do not integrate, publish, freeze a new
checkpoint or start another joint without direction.

## Checked result

All 35 checks pass: 8 knee, 8 elbow, 8 wrist and 11 ankle. Maximum actual
triangle/sphere intrusion is 0.01276 mm (below the 0.2 mm tolerance), and
spherical/fillet vertex errors are below 7.5 nanometers. Rear contact depths
are 16.72 mm thigh / 20.77 mm calf, versus 49.47 / 45.44 mm at the front.
Normal variation falls about 52% / 43%; fairing stays within the scaled
3.095 mm bound. Approved elbow attributes, index buffers and world transforms
also match their pre-knee SHA-256 comparison exactly.

The private browser passes all three poses and views, exact reset, lossless
asset verification and no page errors. Maximum posed center error is below
5.6e-17 m. All nine individual PNGs and three comparison sheets were checked
for correct dimensions; all three final sheets were visually inspected.
This remains an uncommitted appearance draft awaiting owner approval.
