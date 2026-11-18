# Foot and ankle lab

The live foot keeps the approved asymmetric toe outline, flat sole, ground-contact points and toe hinge. The upper ankle area now holds a separate spherical joint between two smooth sockets. Frozen avatar checkpoints remain unchanged.

## Mechanical contract

`avatar/src/joints/ankle-contract.js` is the rendering-independent source of truth. The ball radius is115mm (230mm diameter, about90% of the calf's256mm depth). Both cavities use a115.6mm radius: the deliberate0.6mm radial clearance prevents coincident surfaces while keeping the joint visually seated. Each true cup covers a45° cap, with a5mm rolled lip. All three meshes are closed solids. The foot lip alone is locally refined so its small curve has sufficient geometry; original sole and toe vertices remain in place.

The original ankle center is measured before carving: foot-local `[0.0006089437,0.1635200068,0.0147097013]`. Calf placement, its upper profile/knee contact, and the standing sole stay fixed. `createFootRig` exposes `ankleBall` and `pivot`; foot/calf geometry exposes local `ankleCenter`, `socketRadius` and true spherical `cavityIndices`. `avatar.lowerLegs` exposes each ball for skeleton attachment.

Isolated ankle bend is−36°/+48° and side tilt±20°—twice the former range. Toe bend25° and heel raise30° remain available. Pointing and heel raise share one physical ankle: `normalizeAnklePose` caps their sum at60°. Actual outer-shell probes found intersections beginning at66°, so adding48°+30° is not safe. The skeleton uses the same60° combined cap. Motion/IK algorithms consume those limits; they are not rewritten here.

During articulation the calf and ball remain rigid. The foot rotates about their common center. Heel raise moves the common center and calf together while the front stays planted; only the toe region deforms. Rest restores buffers and transforms exactly. These lab poses do not replace Claude's movement animation.

## Inspect and check

Open `/test-lab/?test=feet` for the shared viewer, or `/foot-lab/` for the focused lab. Joint, Foot socket, Calf socket and Ball buttons expose the individual pieces; Top shows the foot bowl, Sole shows the calf bowl. Use the existing poses/sliders, orbit, zoom and inspection-floor controls on phone or desktop.

`npm run test:ankle` runs independent Node geometry checks: fitted centers/radii, manifold/winding, true-cap gap, all-face sphere clearance, full foot/calf shell probes, composed motion limits, unchanged sole/toes/upper calf and exact rest. Results are saved to `ANKLE-CHECKS.json`. These checks also run before every Foot Lab build. `npm run test:foot-lab` exercises browser controls and mobile framing.

Review the live joint before approving a new frozen checkpoint.
