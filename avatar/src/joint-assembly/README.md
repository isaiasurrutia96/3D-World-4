# Original approved-shape assembly

The owner restored this original assembly after rejecting the cylinder limb
experiment on 19 November 2026. Keep the original approved limb shapes; do not
reshape them into cylinders or use the retired experiment without a new request.

The owner asked to put every approved joint on the actual avatar, centered on
`motion-core/skeleton/bones.js`, with no bone, head, neck or chest-seam redesign.
The owner approved the restored assembly for official Test Lab integration on
19 November 2026. `avatar/official.json` pins this exact asset. Both Our avatar
and Skeleton use `avatar/src/official-avatar.js`. Movement code and frozen
checkpoints are unchanged. Earlier source factories remain authoring references.

## Layers

1. `collect.js` builds the actual approved shoulder, elbow, wrist, hip, knee
   and ankle studies and records the existing skeleton avatar. Build-time only.
2. `fit.js` fits the straight limb shafts between two immutable cup regions.
   Both end cups translate rigidly; their sphere radii and rounded lips never
   scale. A bounded, smooth longitudinal map fits the original bone lengths,
   with analytic inverse-transpose normal transport and positive-Jacobian guards.
3. `torso.js` mirrors the one approved shoulder, keeps both approved hip cups,
   fits those cups to their skeleton anchors and reuses the original internal
   waist ball/cup, lips and seam. Boundary subdivisions are stitched explicitly.
   The existing seam's normal field is carried through the join.
4. `build.js` assembles 28 meshes: head, neck, chest, pelvis, twelve limb/hand/
   foot shells and twelve separate balls. Every ball is centered at the existing
   corresponding bone head; every joint has two matching socket centers.
5. `bind.js` attaches drawing to the existing skeleton. `apply(pose)` consumes
   its degree-based pose contract; it creates no movement timing, IK or gait.
   It reuses the existing soft chest-bend function. `loadJointAvatar(url)` loads
   the prebuilt geometry so procedural molding never runs on the phone.

The straight shafts required fitting because the isolated joint studies used
independent display placement. Distances between cup centers, in meters:

| Part | Isolated study | Existing skeleton | Minimum shaft stretch |
|---|---:|---:|---:|
| Upper arm | 0.333292 | 0.309949 | 0.821449 |
| Forearm | 0.295207 | 0.287086 | 0.915918 |
| Thigh | 0.458479 | 0.367100 | 0.542491 |
| Calf | 0.433009 | 0.308880 | 0.300656 |

These are surface-fitting changes, not bone-length or joint-point changes.
Head/neck geometry and placements, hand/foot geometry, and both fitted end-cup
shapes remain the approved source shapes. The minimum torso deformation
Jacobian is 0.535663; no surface folds are accepted.

## Rebuild and check

Run `node scripts/build-joint-assembly.mjs` from the repository root. It builds
all source studies, verifies a lossless round trip and writes a hashed asset
plus manifest under `avatar/assembled-joints/`. The manifest includes source
geometry hashes. Viewer builds verify its hash against the official release
pin; changing a shape requires owner approval and an explicit pin update.

Run `node --test tests/avatar/joint-assembly.mjs`. By default this regenerates
source parts, then checks the assembly against its saved asset. For iteration
on the same verified source inputs, set `JOINT_ASSEMBLY_INPUT` to the local
V8 snapshot emitted by the build (`/tmp/avatar-assembly/verified-sources.bin`).
The build accepts `--sources` with that snapshot too. No runtime path depends
on the temporary workspace or on an earlier preview cache.

Run `node scripts/preview-joint-avatar.mjs` for private screenshots. It loads
only the baked mesh data and drawing adapter. It does not add or publish a lab.
Screenshots are written to `/workspace/previews/assembled-avatar`: front,
side, angled, three-view sheet, joint-dot sheet and a mobile viewport capture.

## Proven scope

Twelve Node checks prove unchanged skeleton definitions; exactly twelve balls;
all 24 cup centers seated; spherical contact; rigid end cups; positive shaft/
torso maps; original head/neck/hands/feet and chest seam; exact mirroring;
finite watertight, outward-wound solids; actual triangle-to-ball intrusion
below the unchanged 0.2 mm limit; lossless saved asset; static limb poses and
exact resets; identical final results and joint centers at 30/60/120/144 updates
per second. Rest center error is below 1.2e-16 m, posed below 1.1e-15 m.
Maximum actual triangle intrusion is 0.17549 mm. The source forearm's existing
wrist contact error is 0.00048356 mm; fitting changes it by under one nanometer.
The contact check compares against that measured source, plus float precision.

## Handoff to Claude

Use `bindJointAssembly(decodedStudy)` or `loadJointAvatar(assetUrl)`. Returned
`root`, `skeleton`, `attached`, `apply` and `solved` expose the existing bone
contract. Each mesh carries `userData.assembly.bone`, its local socket frames
and, for balls, joint name and radius. Reflection and source shape data are
retained for the hands/feet. All fitting is baked into rest geometry; do not
repeat it every frame or move joint dots to make a mesh fit.

This section does not add animation clips, rebind fingers/toes, prove full
shell clearance through every combined anatomical limit or certify new chest/
clavicle combinations. Minor shell overlap remains allowed by the owner.
Keep the approved hand/foot shapes while implementing those movement layers.
The live inspection asset retains all approved geometry (3,586,000 triangles;
35.8 MB compressed). It is an inspection-quality master, not a game-performance
certification. Optimize a separately checked game asset before gameplay use;
do not silently change this approved master. See `avatar/ANIMATION-HANDOFF.md`.
