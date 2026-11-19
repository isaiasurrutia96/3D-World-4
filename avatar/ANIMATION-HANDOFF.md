# Official smooth arcade avatar — handoff to Claude

The owner approved the continuous skin and natural arcade limb contours on
19 November 2026. `avatar/official.json` pins the live release. The original
jointed model remains frozen at `/checkpoints/avatar-joints-1/`, with its own
viewer, asset and hashes. Earlier frozen checkpoints are unchanged.

## Runtime contract

Import `loadOfficialAvatar` from `avatar/src/official-avatar.js` and await it.
Apps outside one-level lab routes must supply `assetBaseURL` explicitly.

- `root`: add to the scene. One visible `skin` (`THREE.SkinnedMesh`) forms the
  entire connected outer surface; no mechanical balls or separate shells draw.
- `skeleton`: the existing logical motion-core skeleton, unchanged.
- `apply(pose)` / `solved`: consume the existing degree-based pose API and
  expose the solved joint heads and rest-relative rotations.
- `graphicsSkeleton`: flat drawing bones named exactly like the logical
  bones. They receive solved transforms; do not apply parent rotations twice.
- `jointNames`: the twelve existing limb pivot names, for inspection/QA.
- `attached`: sixteen **measurement-only** rest-surface proxies retained for
  the lab's existing helpers. They are not the rendered limbs. Move the skin
  using `apply`, never by moving a proxy.
- `capabilities`, `version`, `dispose()`: explicit support, release identity
  and idempotent cleanup. Position/translation units are meters; poses retain
  motion-core's degrees. The avatar is Y-up, +Z forward, left at +X.

## Drawing and binding

Four normalized `skinIndex`/`skinWeight` slots per vertex bind the surface to
existing bone names and heads. The loader rejects a different skeleton or
invalid weights. The shape is baked in rest coordinates; nothing is remolded,
resampled or retargeted during a frame. GPU dual-quaternion skinning preserves
joint volume better than linear matrix blending during deep bends. Surface,
depth and shadow materials share this binding; `skin.getVertexPosition` uses
its matching CPU equations for picking and measurement. A host scene transform
can sit above `root`; animation poses remain avatar-local.

Claude owns animation, gait, balance, IK, gripping and all timing. This layer
adds no animation clips or movement controller and changes no motion-core
files, joint points, bone lengths, limits or rest angles. Existing body pose
and reach demos remain available. Seat measurement now queries the deformed
skin rather than treating the body as rigid segments.

## Hands and feet

The retained palm/finger surfaces come directly from the saved jointed hand,
without resampling or finger repositioning. Only the old socket interior/lip
is replaced by a smooth wrist loft. `handSourceIndex` maps surviving vertices
to the corresponding `hand.L`/`hand.R` in the original saved jointed asset;
`-1` denotes new body/loft vertices. `handMask` identifies the connector and
hand. The original source SHA is in the skin manifest. Keep the hand's accepted
rest shape when implementing finger weights. Never reuse old bind indices on
the new whole-body vertex numbering.

`fingerSkin` and `toeSkin` remain **false**. They are Claude's next rendering/
animation integration layer; hands and feet currently follow wrist and ankle
motion, with soft transitions into the limb. Current palm/sole IK goals are
unchanged; verify actual contact when rebuilding grips and locomotion.

## Authoring and verification

`avatar/src/skin/field.js` describes anatomical limb envelopes around the
original pivots. Feet retain the original surface reference with the ankle
cavity filled. A 4.5 mm authoring grid produces a conforming tetrahedral
surface; one side is optimized with its centre border locked, then mirrored.
The body's simplification error is explicitly bounded in meters. Original
hands are grafted with shared boundary loops, not welded through fingers.
The final result must be one closed, outward-wound, connected solid (Euler 2),
with no open seams or non-manifold edges. The original sole plane stays y=0.

Run `npm run build:avatar-skin` for a fresh reproducible authoring build. The
optional `--cached` development path uses a fingerprint-checked raw surface;
no production/runtime path depends on `/tmp`. `npm run test:official-avatar`
checks the real artifact, skeleton contract, hand-source positions, topology,
corruption rejection, poses/reset, 30/60/120/144 update agreement and disposal.
`npm run test:official-avatar-browser` checks both live lab routes and controls.
`npm run preview:avatar-skin` is an internal three-view/pose capture helper.

The approved appearance concept is `continuous-skin/CONCEPT.png`. It is an
appearance reference; actual joint positions always come from the skeleton.
This is an inspection-quality asset, not a certification of game performance,
all combined pose limits, collision clearance or gripping. Small surface
intersections at extreme bends still need animation-specific checks. Do not
move joint dots to hide them. Retain the frozen jointed reference.
