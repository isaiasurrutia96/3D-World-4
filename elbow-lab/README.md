# Separated elbow study

The original avatar upper arm above one elbow ball, with the approved wrist
study's forearm below. These are three separate, static parts. No elbow
sockets, movement, hand, skeleton edits or full-avatar mounting are added.
The approved Wrist page remains available unchanged.

The ball is 90% of the narrower transverse limb width (181.454 mm diameter).
Its center is exactly the existing `lowerArm.L` point in
`motion-core/skeleton/bones.js`. Display translations center the limbs above
and below it with equal 45 mm gaps; geometry, orientation and scale remain
exact. These exploded display positions are not animation mount transforms.

The forearm comes directly from `createWristStudy({stage:'molded'})`, preserving
its accepted wrist-end socket. Unused hand/ball resources are disposed while
the shared forearm material stays alive. No new elbow carving is performed.

`node --test elbow-lab/tests/study.test.mjs` checks exact source buffers,
orientation, scale, source color, preserved wrist mold metadata, ball size,
existing elbow point, separate centered bounds and finite geometry.
The numerical checks run before `npm run build:elbow-lab` builds the viewer.
`npm run test:elbow-lab` checks desktop and three phone layouts, all camera
views, framing, unchanged parts, touch orbit and floor inspection.

Open `/test-lab/?test=elbow`. Review these separated parts before any next
joint-design layer or checkpoint.

The live page loads a compressed, content-hashed asset instead of running
`createElbowStudy` on the device. Build-time baking verifies every geometry
buffer, transform, material and metadata value against that factory. Only
the upper arm, forearm and ball are included; no hand is built at runtime.
See `scripts/bake-study.mjs` and `src/study-asset.js`. Original source geometry
remains editable and is rebuilt automatically when the source changes.
