# Official avatar — handoff to Claude

The owner approved the restored **original body shapes**, with the approved
ball-and-socket joints, on 19 November 2026. The can/cylinder experiment was
rejected. `official.json` is the release pin; the geometry manifest and SHA-256
are in `assembled-joints/`. No temp files, preview caches or authoring factories
are needed by the browser. The checked asset is copied once to the build.

## Entry point and ownership

Import `loadOfficialAvatar` from `avatar/src/official-avatar.js` and await it.
Pass `assetBaseURL` for apps outside the one-level lab routes. It returns:

- `root` / `group`: add to the scene; root name `official-avatar`.
- `skeleton`: the unchanged `createSkeleton()` contract from motion-core.
- `apply(pose)`: draw an existing skeleton pose; returns `solved`.
- `attached`: labels, bone names, rest matrices, original joint heads, local
  socket records and ball radii. `solved` is the latest solved skeleton.
- `chestBend`: the existing approved soft chest deformation. Chest attachments
  expose `firmMatrix` and the two `shoulderMatrix` transforms.
- `version`, `capabilities`, `dispose()`: explicit release, supported drawing
  layers and an idempotent GPU-resource cleanup hook.

Do not add a second movement system in this adapter. Claude owns timing,
locomotion, IK, balance, gripping and animation. This integration only replaces
the drawing used by `/avatar-test/` and `/skeleton-test/`; their existing pose
player and reaching demos are reused, not rewritten. Frozen checkpoints and
`motion-core/` are unchanged.

## Frames and units

Geometry and translations use **meters**. The existing pose API uses
**degrees**, as defined by motion-core; do not feed radian values into it.
The avatar is Y-up, +Z forward, his left at +X. Each ball rides on the bone
whose head is the joint, including wrist `hand.*` and ankle `foot.*`. Use
`skeleton.index` / `solved.get(name)`, never copied display coordinates.

Drawing matrix = translation to solved head × solved rest-relative rotation
× translation from original head × mesh rest matrix. All fitting is baked;
do not refit lengths each frame. Apply an optional scene/world transform above
the root; the skeleton's coordinates remain avatar-local. Both sides have
positive scale, reflected geometry and corrected triangle winding.

There are **28 mesh parts, 12 balls and 24 socket centers**. All ball/cup
centers coincide at rest. A loader guard rejects missing or mismatched joints.
Approved small shell overlaps are allowed; joint points must not be moved to
hide them. Head, neck, hands, feet and the existing chest seam retain their
approved shapes. The seam bends with the chest as before.

## What remains movement work

`capabilities.fingerSkin` and `toeSkin` are explicitly false: these approved
hand/foot surfaces currently ride rigidly on their existing wrist/ankle bones.
Finger/toe weighting for this final mesh is Claude's next integration layer.
Source authoring metadata and reflection information are retained on those
meshes. Do not reuse weights from the old avatar by vertex index: socket
refinement changed topology. Preserve the accepted rest positions and normals
byte-for-byte when adding skin weights. Do not imply the historical hand/foot
motion controls certify this new topology.

The existing pose/reach rules still use their original palm and sole targets;
recheck actual surface contact against this final model when rebuilding motion.
This work does not certify all combined limits, gripping or locomotion. The
approved soft chest can change shoulder contact radius by about 0.69 mm at a
15-degree compound chest bend; preserve its accepted gentle appearance.

The inspection-quality master is 35.8 MB compressed / 3,586,000 triangles.
Procedural molding is excluded from viewer builds, but download/decode and GPU
cost still matter on phones. A future optimized game LOD needs separate shape
and joint-fit checks. Do not silently simplify the approved master.

## Verification

`npm run test:official-avatar` checks the release hash, runtime binding,
invalid-joint rejection, pose/reset agreement, resource disposal and the
preserved soft chest. `npm run test:joint-assembly` regenerates source studies
and proves the actual geometry, watertight solids and fit. For local iteration
the latter also accepts its documented verified-source snapshot.

`npm run test:official-avatar-browser` checks both live routes in the universal
Test Lab, mobile/desktop framing, joint dots, mirrored pose controls, reset,
failure recovery and deployment under a repository URL prefix.
