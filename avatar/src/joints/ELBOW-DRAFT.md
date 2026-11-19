# Elbow socket appearance draft

Private screenshot approval only. This module is not imported by a live
viewer or the Test Lab, and it does not alter any saved checkpoint.

`elbow-design.js` starts with the actual accepted upper arm, approved molded
forearm and 181.454 mm ball from `createElbowStudy`. The ball remains exactly
at `lowerArm.L` in `motion-core/skeleton/bones.js`. No bone, pose, scale or
joint position changes. Both new spherical cavities share that center.

The existing skeleton bends forward about -X. The inside/front is +Z, so
local end relief lowers both rims there before molding. The same accepted
ankle/wrist rolling-circle solver cuts the actual spherical surfaces and
5 mm soft rims. Mean capture is 16% of the diameter; front contact depths
are about 14.9 mm upper arm and 16.9 mm forearm, versus 39.4/37.7 mm behind.
The ball is consequently more exposed inside the bend. The original shafts
and the previously approved wrist cavity stay exact outside the elbow ends.

The shared mold helper gains only an optional `centerXZ` argument. Existing
wrist callers retain the old default and checks. The elbow uses [0,0] so
asymmetric shaping cannot move its socket off the limb's center line.
End shaping uses a monotonic smooth deformation and transforms the authored
normal field with its inverse-transpose Jacobian. A positive-Jacobian guard
rejects folded surfaces. This avoids a hard shading band from recomputing
coarse facet normals. The preview uses clean studio lighting without
self-shadow-map artifacts.

Run `node --test tests/avatar/elbow-sockets.mjs wrist-lab/tests/study.test.mjs`
before rendering. Checks cover the original fixed ball, coincident socket
centers, untouched shafts/wrist, actual spherical and roundover surfaces,
asymmetric exposure, every triangle's distance from the sphere, closed
consistently wound solids and a conservative inside contact-arc opening
budget at 90 degrees. The angular budget is not certification of the whole
animated arm's collision-free range; later motion work must test its shells.

`node scripts/preview-elbow.mjs` builds only a private page in
`/tmp/elbow-socket-preview` and writes 1800 x 2400 PNGs to
`/workspace/previews/elbow-sockets` (override `ELBOW_PREVIEW_DIR` if needed).
It uses the actual geometry, lossless build-time asset verification and
orthographic front, side and angled cameras. It never writes to `dist/`,
Test Lab pages or checkpoints. Await owner appearance feedback before
changing this draft, integrating it or publishing anything.

Final checks: all 6 elbow and 8 existing wrist checks pass. Maximum actual
socket-triangle intrusion is 0.01271 mm; sphere/rim vertex errors stay below
7.5 nanometers. Both socket centers coincide with the original ball point.
The inside contact arcs plus conservative rim allowances occupy 75.22°,
leaving an opening budget for the future 90° fold. Browser rendering passes
all three views with static geometry and no page errors. The live Test Lab
and all published/frozen files remain unchanged; this is an uncommitted
appearance draft awaiting owner feedback.

## Static bent-pose screenshots

Owner requested a 90° pose and a tighter human-like fold. The private viewer
can rigidly rotate the existing forearm forward about the original ball
center, from the saved straight pose. It changes no vertices, sockets,
bones, upper-arm placement or ball position, and adds no animation system.
`node scripts/preview-elbow.mjs --bends --reuse-asset` reuses the already
verified private asset for pose-only work. Omit `--reuse-asset` after any
geometry change so the asset is rebuilt from the actual source.

Outputs are in `/workspace/previews/elbow-bends`: 90° flexion (90° inside
angle) and 130° flexion (50° inside angle). Each has 1800 x 2400 front/side/
angled PNGs and a 2700 x 1200 three-view sheet rendered directly from the
same 3D scene. Cavity center errors are below 1.2e-16 m in both poses; the
browser verifies exact return to rest and has no page errors.

The tighter fold visibly overlaps the upper arm and forearm. This posing
request does not fix or hide that overlap, redesign the shapes or certify
movement clearance. Keep the current ball/pivot fixed for any later owner-
approved clearance refinement. The live Test Lab remains unchanged.

## Conservative refinement from the owner's red marks

Owner explicitly accepts a little overlap and requested modest rounding
of the two marked inside edges. `elbow-inner-edge.js` adds a smooth +Z
inward sculpt with a 12 mm maximum and a 210 mm reach from the joint.
It preserves the exact spherical contact surfaces and 5 mm rims, the ball,
joint center, backs of both limbs and the accepted wrist. It deliberately
does not carve the full envelope needed to eliminate all tight-fold overlap.

An optional 3D edge-length limit in the existing conforming refiner adds
enough shaft samples for a curved contour. Existing ankle/wrist callers
keep their original default behavior. The sculpt uses its analytic normal
transform with a positive-Jacobian guard, giving smooth joins without folding.

All 15 combined checks pass: 7 elbow and 8 existing wrist. Maximum actual
inset is 11.20 mm upper arm / 10.84 mm forearm; volume retained is 98.58% /
98.01%. Fitted sphere/rim vertices stay exact. Closed outward-wound topology,
ball clearance, finite attributes and protected back/wrist checks pass.
The ball remains seated in the 90° and 130° flexion screenshots with the
same sub-1.2e-16 m center errors and no browser errors. Some overlap remains.

Updated screenshots are in `/workspace/previews/elbow-inner-refinement`:
front/side/angled at 1800 x 2400 for each pose, plus 2700 x 1200 three-view
sheets. Earlier images remain available for comparison. This is still an
uncommitted private appearance draft; nothing was added to the live Test Lab.

## Further corner trim and smooth transitions

The owner re-marked the two corners, then circled the remaining cap ridge
and small lumps and requested smooth surfaces. The local sculpt now adds
up to 10 mm of extra trim, fading monotonically between 80 and 160 mm from
the pivot. It keeps the earlier 12 mm general inset outside that corner.
Before final fairing, measured maximum total inset is 19.63 mm upper arm /
18.72 mm forearm, retaining 98.03% / 97.24% of the pre-sculpt volume.

`elbow-smooth.js` welds coincident surface samples for a local, bounded
Taubin fairing pass. Positions on both real spherical cups and circular
fillets remain pinned. Actual maximum movement is 1.5404 mm upper arm /
0.3520 mm forearm, below the 2.5 mm limit. Topology, ball and all joint
positions remain unchanged. Backs and the wrist stay exact.

The source's coarse lathe normals were producing a reversal in the outer
cap shading. Simply averaging geometric face normals reintroduced facets
and was rejected during review. The final pass diffuses the authored normal
field, preserves spherical-contact normals, and blends an analytic rounded-
cap normal field over the outer transition. Fillet shading can blend while
its exact 5 mm geometry stays pinned. Normal variation decreases by about
57% in the upper transition and 49% in the forearm transition.

All 16 combined checks pass (8 elbow, 8 existing wrist). They also verify
bounded smoothing, reduced normal variation, exact contact/rim positions,
fixed contact normals, protected backs, sealed solids and ball clearance.
The private browser render passes both poses and all three views, with
fixed centers, exact return to rest and no page errors. The latest checked
screenshots are `/workspace/previews/elbow-cap-blended`, with six individual
1800 x 2400 PNGs and two 2700 x 1200 three-view sheets. Intermediate smoothing
renders in other folders are superseded. Some tight-fold overlap remains
as the owner explicitly permits. No live page, bone, movement or checkpoint
was changed, and nothing was published.
