# Wrist study, first layer

The original accepted forearm and emoji hand from
`avatar/src/hand-study/assembly.js`, displayed as three separate parts:
forearm above, a ball in the middle, hand below. Geometry buffers, original
hand scale, local orientation and materials are preserved. There is no new
socket carving, hand rig, skeleton edit or movement layer.

The ball diameter is 90% of the narrower transverse forearm dimension:
181.454 mm. Both vertical gaps are 45 mm, measured from the actual transformed
bounds. The ball stays at the existing `hand.L` head from
`motion-core/skeleton/bones.js`; only the surrounding parts move for this
separated presentation. It does not mount the hand onto the avatar.

The three numerical checks run before the viewer build: exact original
position/normal/index buffers and scale/orientation; ball size and fixed
joint point; centered ordering, equal positive gaps and finite geometry.
Run `npm run build:wrist-lab`, then `npm run test:wrist-lab` for desktop/phone
camera, framing, inspection and real touch checks. Open `/test-lab/?test=wrist`.

The rejected full-body draft was parked outside the repository. Continue
one wrist part at a time after owner review; no new checkpoint yet.
