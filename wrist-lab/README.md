# Static wrist fit study

The accepted forearm and emoji hand, fitted around the existing 181.454 mm
ball. This is a standalone appearance study; it adds no animation, pose
controls or avatar movement. Skeleton source and joint coordinates stay
unchanged. The ball and both socket centers share the existing `hand.L` point.
Mounting the approved study onto the full avatar remains a later step.
Rotation-clearance testing belongs to a later approved motion step.

`createWristStudy` retains three construction stages for checks:

- `original`: the exact saved parts, separated as in the first wrist review.
- `rounded`: the forearm's old recess filled with a solid rounded end.
- `molded`: the live static fit with both sockets.

`round-forearm.js` preserves the authored cylinder and elbow above its
−55 mm join. A smooth elliptical cap replaces the entire old wrist recess.
The source shaft's positions and normals remain exact at and above the join.

`mold-socket.js` reuses the actual ankle's rolling-circle surface solver.
The cavities follow the real ball, with 5 mm circular rounded rims that join
the original outer surfaces tangentially. There are no flat cap trims or
separate raised cuffs. A finer wrist rim fits the requested depth while
retaining material around this ball, which is 90% of the forearm width.

The requested captured cap depth is measured from the spherical contact rim
to the pole, averaged over eight radial directions. The rounded source tip
extends past that rim, so the mold's travel from that tip is recorded
separately. Measuring only that travel would leave too much ball exposed.
Current targets are one-third of the diameter in the forearm (60.485 mm) and,
after the owner's further refinement, one-seventh in the hand (25.922 mm).
Rims follow each part's curved shape rather than a flat common plane.

The owner chose a slightly larger hand instead of reducing the ball. A
2 mm outward surface expansion makes it fuller while preserving its mesh
scale and orientation and leaving all bone definitions fixed. Finger-region
growth is checked against that offset. The source hand's collapsed triangles
and opposite coincident internal face pairs are cleaned by index only;
vertex order remains intact.

Eight numerical checks run before the viewer build. They cover the original
baseline, ball size, untouched upper forearm, hand surface growth, coincident
centers, actual sphere/fillet contact, independently ray-measured captured
depth, closed outward-wound solids with positive volume, and every triangle's
distance from the ball. Triangle intrusion must stay below 0.2 mm. The
steep-rim axial depth probe allows 0.25 mm for triangle chord approximation.

Calibration uses eight directions, then the final mesh uses the ankle
solver's full 256-anchor construction. Existing ankle callers retain the
unchanged default behavior. Run `npm run build:wrist-lab`, then
`npm run test:wrist-lab` for static placement, desktop/phone framing, views,
inspection and real touch orbit. Open `/test-lab/?test=wrist`.

Review the fit before further refinements, mirroring or a new checkpoint.
