# Track layer 1: measured results

This is track logic only. The owner approved track logic and the Original Circuit seam fix. These checks do not approve kart handling or later racing layers.

Source: LetsGo Racing `573664e824a04234240a24dfc2eae2273e30a4ca`. Every rule below is executed in Node.

| Track | Road segments | Rails | Physical length (m) | Source station length (m) | Source seam gap (m) | Approved seam gap (m) | Source seam closed? |
|---|---:|---:|---:|---:|---:|---:|---|
| Original Circuit | 1200 | 2395 | 3682.701867103 | 3679.832947424 | 0.046163501 | 0 | FAIL |
| Skyline Circuit | 1800 | 3594 | 4513.430721129 | 4510.258330488 | 0 | 0 | PASS |
| Suzuka Circuit | 2400 | 4794 | 5757.437844709 | 5757.526739055 | 0 | 0 | PASS |
| Winding Circuit | 2400 | 4794 | 6635.147404997 | 6635.60023163 | 0 | 0 | PASS |

The source station length comes from its spline lookup table. Physical length is measured along the actual 3D road samples; gates keep their exact source positions.

**Approved fix:** Original Circuit has a 0.046163501 m (4.62 cm) road-edge seam mismatch in the source. Its centerline closes. Reference mode preserves it. The tested weld option closes that seam and adjusts two rail endpoints by at most 4.67 cm, without moving the centerline or gates. The owner approved this repair; it is now enabled by default. Reference mode remains available for source-fidelity checks. The other three seams are already closed.

**Node verification: 50 PASS, 0 FAIL.** This verifies the recorded reference issue and the candidate repair; it does not mean the reference seam is watertight.

### original — Road corners and wall endpoints exactly match the pinned source

- Rule: Both SHA256 digests equal the independent source capture.
- Scripted input: Hash every double-precision road corner and rail endpoint, without rounding.
- Measured result: `{"road":"9400e7f2543476de801ae7affcff3cee4b88b56b807ff9a2d3e29d4b64969570","walls":"9baa126fb03f40dfc6eae1b9602122b5f42ee042ab4b07f9d6c795ca29e3ee44"}`
- **PASS**

### original — Road width, height and triangle data are finite and nondegenerate

- Rule: Asphalt is 26 m wide, each curb is 1.1 m, total is 28.2 m; both triangle areas are positive.
- Scripted input: Visit every road segment and its four corners.
- Measured result: `{"asphaltWidth":26,"curbWidth":1.1,"maximumWidthError":1.1013412404281553e-13,"minTriangleArea":3.833540464936746,"nonFinite":0}`
- **PASS**

### original — Centerline joins close and distance sampling wraps consistently

- Rule: Zero centerline gap; identical wrapped positions to 0.00000001 m; sample(0) is the original start.
- Scripted input: Compare every consecutive centerline endpoint and sample negative, zero and multi-lap distances.
- Measured result: `{"maximumJoinGap":0,"maximumWrapError":2.744571917763205e-12,"startError":5.684341886080802e-14}`
- **PASS**

### original — Every road segment supports interior probes along its length

- Rule: Every one of the scripted strip-interior points has road support below its interpolated height + 0.65 m.
- Scripted input: Probe each segment at t=0, 0.5 and 0.999 and at 2%, 50% and 98% across its four-corner strip.
- Measured result: `{"probes":10800,"missing":0}`
- **PASS**

### original — Road-height queries match independently captured source results

- Rule: Every supported height matches to 0.00000001 m; every empty result agrees.
- Scripted input: Probe source segments every 19 samples at five lateral positions and a maximum height of road + 0.65 m.
- Measured result: `{"probes":320,"maximumError":0,"mismatches":0}`
- **PASS**

### original — Bridge crossings keep their lower and upper road surfaces separate

- Rule: Both source heights match; the lower query never jumps to the upper deck.
- Scripted input: At every source centerline crossing separated by at least 4 m, query below and above the upper deck.
- Measured result: `{"crossings":1,"maximumError":0,"wrongDeck":0}`
- **PASS**

### original — All 13 gates retain their source positions, directions and order

- Rule: 13 gates; zero position/direction error; strictly increasing physical distances starting at 0.
- Scripted input: Read each source gate and map its source station onto the physical polyline.
- Measured result: `{"count":13,"positionError":0,"directionError":0,"firstDistance":0}`
- **PASS**

### original — Directed gate sweeps agree at 30, 60, 120 and 144 FPS

- Rule: One forward crossing per gate at t=1 s, identical hit points and times at every FPS; zero invalid crossings.
- Scripted input: At each FPS, move a point at 180 mph straight through every gate for two seconds. Also sweep backward, too high and outside the gate. No vehicle simulation is used.
- Measured result: `{"byRate":[{"fps":30,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":60,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":120,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":144,"forwardCrossings":13,"earliest":1,"latest":1}],"maximumTimeError":0,"maximumPositionError":0,"rejected":156}`
- **PASS**

### original — Road, access bridge and intentional wall openings stay distinct

- Rule: Bridge supports its source height; empty space has no floor; all rail midpoints are found on their own deck.
- Scripted input: Check the access bridge center and far-away empty space, then query every wall midpoint.
- Measured result: `{"bridge":0,"expectedBridge":0,"empty":null,"railMidpoints":2395,"missing":0,"maxWallError":1.1368683772161603e-13}`
- **PASS**

### original — A translated and rotated island placement preserves road geometry

- Rule: Sample positions, road heights and projection distances agree after the same transform; no voxel-grid rounding.
- Scripted input: Translate by (1234,70,-890) m and rotate by 0.7 radians; sample 60 locations around the loop.
- Measured result: `{"positions":60,"maximumError":6.821210263296962e-13}`
- **PASS**

### original — Projection can stay on the intended route at a crossing

- Rule: Both branch hints return their own segment and height; a tiny impossible progress window returns null.
- Scripted input: Project each crossing position with separate hints for its two source segments.
- Measured result: `{"branchChecks":2}`
- **PASS**

### original — Approved seam weld closes only the source seam

- Rule: Welded edge gap is zero; route length, centerline and every gate stay unchanged. Maximum edit is under 5 cm.
- Scripted input: Compare reference mode against the approved default seam weld.
- Measured result: `{"referenceEdgeGap":0.04616350088989525,"proposedEdgeGap":0,"changedCorners":2,"maximumRoadEdit":0.04616350088989525,"changedWallEnds":2,"maximumWallEdit":0.04665460196316793,"enabledByDefault":"weld"}`
- **PASS**

### skyline — Road corners and wall endpoints exactly match the pinned source

- Rule: Both SHA256 digests equal the independent source capture.
- Scripted input: Hash every double-precision road corner and rail endpoint, without rounding.
- Measured result: `{"road":"ea0a59a9b867abea83859dd7d08499eee72d30df1d89299a58b0d7dc49359d26","walls":"6cfab832bc2be1b418cde51e269bd4e467f2d20add8a7124362d7913d7e1821d"}`
- **PASS**

### skyline — Road width, height and triangle data are finite and nondegenerate

- Rule: Asphalt is 26 m wide, each curb is 1.1 m, total is 28.2 m; both triangle areas are positive.
- Scripted input: Visit every road segment and its four corners.
- Measured result: `{"asphaltWidth":26,"curbWidth":1.1,"maximumWidthError":1.1723955140041653e-13,"minTriangleArea":13.62440443477525,"nonFinite":0}`
- **PASS**

### skyline — Centerline joins close and distance sampling wraps consistently

- Rule: Zero centerline gap; identical wrapped positions to 0.00000001 m; sample(0) is the original start.
- Scripted input: Compare every consecutive centerline endpoint and sample negative, zero and multi-lap distances.
- Measured result: `{"maximumJoinGap":0,"maximumWrapError":1.8269655220124374e-12,"startError":5.542233338928781e-13}`
- **PASS**

### skyline — Every road segment supports interior probes along its length

- Rule: Every one of the scripted strip-interior points has road support below its interpolated height + 0.65 m.
- Scripted input: Probe each segment at t=0, 0.5 and 0.999 and at 2%, 50% and 98% across its four-corner strip.
- Measured result: `{"probes":16200,"missing":0}`
- **PASS**

### skyline — Road-height queries match independently captured source results

- Rule: Every supported height matches to 0.00000001 m; every empty result agrees.
- Scripted input: Probe source segments every 19 samples at five lateral positions and a maximum height of road + 0.65 m.
- Measured result: `{"probes":475,"maximumError":0,"mismatches":0}`
- **PASS**

### skyline — Bridge crossings keep their lower and upper road surfaces separate

- Rule: Both source heights match; the lower query never jumps to the upper deck.
- Scripted input: At every source centerline crossing separated by at least 4 m, query below and above the upper deck.
- Measured result: `{"crossings":10,"maximumError":0,"wrongDeck":0}`
- **PASS**

### skyline — All 13 gates retain their source positions, directions and order

- Rule: 13 gates; zero position/direction error; strictly increasing physical distances starting at 0.
- Scripted input: Read each source gate and map its source station onto the physical polyline.
- Measured result: `{"count":13,"positionError":0,"directionError":0,"firstDistance":0}`
- **PASS**

### skyline — Directed gate sweeps agree at 30, 60, 120 and 144 FPS

- Rule: One forward crossing per gate at t=1 s, identical hit points and times at every FPS; zero invalid crossings.
- Scripted input: At each FPS, move a point at 180 mph straight through every gate for two seconds. Also sweep backward, too high and outside the gate. No vehicle simulation is used.
- Measured result: `{"byRate":[{"fps":30,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":60,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":120,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":144,"forwardCrossings":13,"earliest":1,"latest":1}],"maximumTimeError":0,"maximumPositionError":0,"rejected":156}`
- **PASS**

### skyline — Road, access bridge and intentional wall openings stay distinct

- Rule: Bridge supports its source height; empty space has no floor; all rail midpoints are found on their own deck.
- Scripted input: Check the access bridge center and far-away empty space, then query every wall midpoint.
- Measured result: `{"bridge":0,"expectedBridge":0,"empty":null,"railMidpoints":3594,"missing":0,"maxWallError":1.1368683772161603e-13}`
- **PASS**

### skyline — A translated and rotated island placement preserves road geometry

- Rule: Sample positions, road heights and projection distances agree after the same transform; no voxel-grid rounding.
- Scripted input: Translate by (1234,70,-890) m and rotate by 0.7 radians; sample 60 locations around the loop.
- Measured result: `{"positions":60,"maximumError":9.094947017729282e-13}`
- **PASS**

### skyline — Projection can stay on the intended route at a crossing

- Rule: Both branch hints return their own segment and height; a tiny impossible progress window returns null.
- Scripted input: Project each crossing position with separate hints for its two source segments.
- Measured result: `{"branchChecks":20}`
- **PASS**

### skyline — Approved seam weld closes only the source seam

- Rule: Welded edge gap is zero; route length, centerline and every gate stay unchanged. Maximum edit is under 5 cm.
- Scripted input: Compare reference mode against the approved default seam weld.
- Measured result: `{"referenceEdgeGap":0,"proposedEdgeGap":0,"changedCorners":0,"maximumRoadEdit":0,"changedWallEnds":0,"maximumWallEdit":0,"enabledByDefault":"weld"}`
- **PASS**

### suzuka — Road corners and wall endpoints exactly match the pinned source

- Rule: Both SHA256 digests equal the independent source capture.
- Scripted input: Hash every double-precision road corner and rail endpoint, without rounding.
- Measured result: `{"road":"18a77fd08ba546a1242e1dc681ce5f70e7071f8d761a299782f2adb3bc491376","walls":"1bec50440758d7cb300a08c3877d5d14938ca1a7f6ebb36c7c22f9e4c2d16fe4"}`
- **PASS**

### suzuka — Road width, height and triangle data are finite and nondegenerate

- Rule: Asphalt is 26 m wide, each curb is 1.1 m, total is 28.2 m; both triangle areas are positive.
- Scripted input: Visit every road segment and its four corners.
- Measured result: `{"asphaltWidth":26,"curbWidth":1.1,"maximumWidthError":2.877698079828406e-13,"minTriangleArea":6.136653573483595,"nonFinite":0}`
- **PASS**

### suzuka — Centerline joins close and distance sampling wraps consistently

- Rule: Zero centerline gap; identical wrapped positions to 0.00000001 m; sample(0) is the original start.
- Scripted input: Compare every consecutive centerline endpoint and sample negative, zero and multi-lap distances.
- Measured result: `{"maximumJoinGap":0,"maximumWrapError":3.6324800232117925e-12,"startError":0}`
- **PASS**

### suzuka — Every road segment supports interior probes along its length

- Rule: Every one of the scripted strip-interior points has road support below its interpolated height + 0.65 m.
- Scripted input: Probe each segment at t=0, 0.5 and 0.999 and at 2%, 50% and 98% across its four-corner strip.
- Measured result: `{"probes":21600,"missing":0}`
- **PASS**

### suzuka — Road-height queries match independently captured source results

- Rule: Every supported height matches to 0.00000001 m; every empty result agrees.
- Scripted input: Probe source segments every 19 samples at five lateral positions and a maximum height of road + 0.65 m.
- Measured result: `{"probes":635,"maximumError":0,"mismatches":0}`
- **PASS**

### suzuka — Bridge crossings keep their lower and upper road surfaces separate

- Rule: Both source heights match; the lower query never jumps to the upper deck.
- Scripted input: At every source centerline crossing separated by at least 4 m, query below and above the upper deck.
- Measured result: `{"crossings":1,"maximumError":0,"wrongDeck":0}`
- **PASS**

### suzuka — All 13 gates retain their source positions, directions and order

- Rule: 13 gates; zero position/direction error; strictly increasing physical distances starting at 0.
- Scripted input: Read each source gate and map its source station onto the physical polyline.
- Measured result: `{"count":13,"positionError":0,"directionError":0,"firstDistance":0}`
- **PASS**

### suzuka — Directed gate sweeps agree at 30, 60, 120 and 144 FPS

- Rule: One forward crossing per gate at t=1 s, identical hit points and times at every FPS; zero invalid crossings.
- Scripted input: At each FPS, move a point at 180 mph straight through every gate for two seconds. Also sweep backward, too high and outside the gate. No vehicle simulation is used.
- Measured result: `{"byRate":[{"fps":30,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":60,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":120,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":144,"forwardCrossings":13,"earliest":1,"latest":1}],"maximumTimeError":0,"maximumPositionError":0,"rejected":156}`
- **PASS**

### suzuka — Road, access bridge and intentional wall openings stay distinct

- Rule: Bridge supports its source height; empty space has no floor; all rail midpoints are found on their own deck.
- Scripted input: Check the access bridge center and far-away empty space, then query every wall midpoint.
- Measured result: `{"bridge":0,"expectedBridge":0,"empty":null,"railMidpoints":4794,"missing":0,"maxWallError":2.2737367544323206e-13}`
- **PASS**

### suzuka — A translated and rotated island placement preserves road geometry

- Rule: Sample positions, road heights and projection distances agree after the same transform; no voxel-grid rounding.
- Scripted input: Translate by (1234,70,-890) m and rotate by 0.7 radians; sample 60 locations around the loop.
- Measured result: `{"positions":60,"maximumError":9.094947017729282e-13}`
- **PASS**

### suzuka — Projection can stay on the intended route at a crossing

- Rule: Both branch hints return their own segment and height; a tiny impossible progress window returns null.
- Scripted input: Project each crossing position with separate hints for its two source segments.
- Measured result: `{"branchChecks":2}`
- **PASS**

### suzuka — Approved seam weld closes only the source seam

- Rule: Welded edge gap is zero; route length, centerline and every gate stay unchanged. Maximum edit is under 5 cm.
- Scripted input: Compare reference mode against the approved default seam weld.
- Measured result: `{"referenceEdgeGap":0,"proposedEdgeGap":0,"changedCorners":0,"maximumRoadEdit":0,"changedWallEnds":0,"maximumWallEdit":0,"enabledByDefault":"weld"}`
- **PASS**

### winding — Road corners and wall endpoints exactly match the pinned source

- Rule: Both SHA256 digests equal the independent source capture.
- Scripted input: Hash every double-precision road corner and rail endpoint, without rounding.
- Measured result: `{"road":"3038c0cda30a1eea4e76741a0e586af4fd6b0ef42a2436b1aa4c6dc71652cf08","walls":"b0d93ee06fab50910ea33869e9006ae24444239b7a6c1cf842b5f78171c1614d"}`
- **PASS**

### winding — Road width, height and triangle data are finite and nondegenerate

- Rule: Asphalt is 26 m wide, each curb is 1.1 m, total is 28.2 m; both triangle areas are positive.
- Scripted input: Visit every road segment and its four corners.
- Measured result: `{"asphaltWidth":26,"curbWidth":1.1,"maximumWidthError":2.3092638912203256e-13,"minTriangleArea":9.19875956901478,"nonFinite":0}`
- **PASS**

### winding — Centerline joins close and distance sampling wraps consistently

- Rule: Zero centerline gap; identical wrapped positions to 0.00000001 m; sample(0) is the original start.
- Scripted input: Compare every consecutive centerline endpoint and sample negative, zero and multi-lap distances.
- Measured result: `{"maximumJoinGap":0,"maximumWrapError":1.8198773652309366e-12,"startError":0}`
- **PASS**

### winding — Every road segment supports interior probes along its length

- Rule: Every one of the scripted strip-interior points has road support below its interpolated height + 0.65 m.
- Scripted input: Probe each segment at t=0, 0.5 and 0.999 and at 2%, 50% and 98% across its four-corner strip.
- Measured result: `{"probes":21600,"missing":0}`
- **PASS**

### winding — Road-height queries match independently captured source results

- Rule: Every supported height matches to 0.00000001 m; every empty result agrees.
- Scripted input: Probe source segments every 19 samples at five lateral positions and a maximum height of road + 0.65 m.
- Measured result: `{"probes":635,"maximumError":0,"mismatches":0}`
- **PASS**

### winding — Bridge crossings keep their lower and upper road surfaces separate

- Rule: Both source heights match; the lower query never jumps to the upper deck.
- Scripted input: At every source centerline crossing separated by at least 4 m, query below and above the upper deck.
- Measured result: `{"crossings":7,"maximumError":0,"wrongDeck":0}`
- **PASS**

### winding — All 13 gates retain their source positions, directions and order

- Rule: 13 gates; zero position/direction error; strictly increasing physical distances starting at 0.
- Scripted input: Read each source gate and map its source station onto the physical polyline.
- Measured result: `{"count":13,"positionError":0,"directionError":0,"firstDistance":0}`
- **PASS**

### winding — Directed gate sweeps agree at 30, 60, 120 and 144 FPS

- Rule: One forward crossing per gate at t=1 s, identical hit points and times at every FPS; zero invalid crossings.
- Scripted input: At each FPS, move a point at 180 mph straight through every gate for two seconds. Also sweep backward, too high and outside the gate. No vehicle simulation is used.
- Measured result: `{"byRate":[{"fps":30,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":60,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":120,"forwardCrossings":13,"earliest":1,"latest":1},{"fps":144,"forwardCrossings":13,"earliest":1,"latest":1}],"maximumTimeError":0,"maximumPositionError":0,"rejected":156}`
- **PASS**

### winding — Road, access bridge and intentional wall openings stay distinct

- Rule: Bridge supports its source height; empty space has no floor; all rail midpoints are found on their own deck.
- Scripted input: Check the access bridge center and far-away empty space, then query every wall midpoint.
- Measured result: `{"bridge":0,"expectedBridge":0,"empty":null,"railMidpoints":4794,"missing":0,"maxWallError":2.2737367544323206e-13}`
- **PASS**

### winding — A translated and rotated island placement preserves road geometry

- Rule: Sample positions, road heights and projection distances agree after the same transform; no voxel-grid rounding.
- Scripted input: Translate by (1234,70,-890) m and rotate by 0.7 radians; sample 60 locations around the loop.
- Measured result: `{"positions":60,"maximumError":9.094947017729282e-13}`
- **PASS**

### winding — Projection can stay on the intended route at a crossing

- Rule: Both branch hints return their own segment and height; a tiny impossible progress window returns null.
- Scripted input: Project each crossing position with separate hints for its two source segments.
- Measured result: `{"branchChecks":14}`
- **PASS**

### winding — Approved seam weld closes only the source seam

- Rule: Welded edge gap is zero; route length, centerline and every gate stay unchanged. Maximum edit is under 5 cm.
- Scripted input: Compare reference mode against the approved default seam weld.
- Measured result: `{"referenceEdgeGap":0,"proposedEdgeGap":0,"changedCorners":0,"maximumRoadEdit":0,"changedWallEnds":0,"maximumWallEdit":0,"enabledByDefault":"weld"}`
- **PASS**

### All tracks — Fresh track TypeScript passes strict checking without a browser library

- Rule: Compiler exits successfully with zero diagnostics.
- Scripted input: Run the TypeScript compiler on track/tsconfig.json with ES2022 libraries and strict checking.
- Measured result: `{"diagnostics":0}`
- **PASS**

### All tracks — Invalid inputs fail explicitly and exposed geometry cannot be changed

- Rule: All invalid requests throw; public geometry is frozen.
- Scripted input: Try missing tracks, NaN/Infinity coordinates, invalid gate indexes, invalid placement, and negative search radii.
- Measured result: `{"rejected":12}`
- **PASS**

Frame-rate checks sweep geometric probes, not karts. Vehicle timing, contact response, race scoring, AI, ghosts, device hardware and final appearance remain unproven in this fresh rebuild.
