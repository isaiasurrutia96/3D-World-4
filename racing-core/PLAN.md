# Racing rebuild: one approved layer at a time

Updated 18 November 2026. This is the single plan and approval record for the fresh rebuild.

## Owner direction and approvals

- **Approved:** start fresh, with LetsGo Racing as the behavior and eventual appearance target. The owner explicitly declined a comparison/audit against the previous rebuild.
- **Approved to implement:** section 1, track logic, following the owner's “okay go.”
- **Approved by owner:** section 1 and its measured results, in “Yes the fix in the original and everything else okay go.”
- **Approved and enabled:** Original Circuit seam repair; welded geometry is now the default.
- **Authorized to build:** section 1V, the track-only preview, by the owner's go. Its visual review remains pending. All later gameplay layers remain unstarted and need a separate go.
- **Rejected as the new foundation:** extending/tuning the earlier racing prototype. Its existing demo stays available while replacement layers are reviewed; none of its logic is imported by the new track module.

The process applies to the owner's other projects as well: code first, one section at a time, automatic checks before visuals, plain-language results, then owner approval before continuing. Keep logic in `racing-core/` and the future visual adapter in `racing-lab/`. Do not edit `motion-core/` or frozen checkpoints.

## Target and source

The targets are the existing Original, Skyline, Suzuka and Winding circuits from `isaiasurrutia96/3D-World-3`, revision `573664e824a04234240a24dfc2eae2273e30a4ca`. This was the reference repository's latest main when captured. It is reference-only.

The fresh module is **`track/index.ts`**, with its own geometry functions, data, strict TypeScript check and Node tests. The older `track.js`, root `index.js` and their vehicle/session modules are the superseded prototype, not dependencies of this rebuild.

`tools/capture-track-reference.mjs` reads a pinned Git archive and extracts full-precision authoring samples, exact rail endpoints, access bridges, start/gates and appearance constants. It records SHA256 hashes of the source files. Independent height probes and crossing heights are calculated by LetsGo's original road-surface function during capture. Runtime code imports only local numeric data and fresh geometry functions; it requires no browser, Three.js or old checkout.

## Section 1 decisions

1. Preserve all race-loop road corners, elevations, start positions and 13 gates per course. Owner-approved update: remove the old hub entrance connectors from the default test tracks and close their rail/curb openings. No curve redesign or rounding to a voxel grid.
2. Preserve 26 m asphalt width, 1.1 m curbs on each side, 28.2 m total width, 0.65 m road thickness and the source's 1.2 m physical wall height.
3. Use the original two triangles per road segment for surface queries, matching the reference road. Do not invent an unseen driving surface or ground slab.
4. Keep true physical distance along the 3D sample polyline separate from the source spline's approximate station-length table. Both measurements are reported. Gates retain their exact world positions while obtaining physical-distance coordinates.
5. Geometry queries are stateless. Gate-plane intersection is geometric data; countdowns, lap counting, ordering, standings, respawn and vehicle timing are later layers.
6. Gate crossing uses an arrival-inclusive/departure-exclusive rule to avoid counting a point on the plane twice. It rejects reverse, outside-width and wrong-height crossings. Session behavior when spawning directly on the line remains a later decision.
7. Expose a rigid placement transform so islands can be added without changing track dimensions. Island terrain will use the approved voxel style and 43 cm block scale. The supplied six-island image is context only; it does not replace LetsGo's routes or authorize new themes/layouts.
8. Save appearance constants as reference data only. No renderer, kart, avatar, scenery, new driving page or visual polish is part of this section.

## Source issue and approved repair

**Original Circuit's source centerline closes exactly, but its first and last road-edge normals differ. The road edges miss by 0.046163501 m (4.62 cm).** The source also includes a small below-zero road dip; that authored elevation is preserved.

- Diagnostic `seam: 'reference'` preserves the exact source road and rails, including that measurable seam mismatch.
- Approved default `seam: 'weld'` reuses the first cross-section at the last endpoint and adjusts the matching two wall endpoints. Only two road corners and two rail endpoints move, by under 5 cm. Centerline positions, physical route length and every checkpoint stay unchanged.
- Both modes are tested. **The owner approved the repair. It is enabled by default and used by the track-only preview.** Reference mode is retained solely for exact-source diagnostics.
- Skyline, Suzuka and Winding already have closed seams; the option makes no edits to those tracks.

The unmodified reference seam remains labelled as a source issue. All default tracks now have zero seam gap. The owner has approved the repair; do not ask again.

## Checks and their practical limits

Run `node --test racing-core/track/check.test.mjs`. This includes the strict TypeScript compiler check. Results are written to [track/CHECK-RESULTS.md](track/CHECK-RESULTS.md) and its structured JSON counterpart. Every check states a plain rule, scripted input, measured result and PASS/FAIL.

The current run has **50 passing verification checks and zero unexpected failures**:

- All four complete road-corner hashes and rail-endpoint hashes match the pinned source exactly.
- All 7,800 road segments have finite, nondegenerate geometry and the expected width.
- 70,200 strip-interior probes have road support.
- 2,065 independent source support probes agree exactly.
- All 19 source overpass intersections preserve their lower and upper support surfaces.
- All 52 source gates keep their positions, directions and ordering.
- Forward geometric sweeps at 180 mph produce the same crossing points/times at 30, 60, 120 and 144 FPS; reverse, outside and wrong-height probes are rejected.
- All 15,600 active wall midpoints can be queried. The two rail rings are continuous around each circuit. Removed connector-only points have no support; the optional source connector profile still reproduces its original surface.
- Island placement, loop wrapping, route-branch hints, seam diagnosis/approved repair, immutable geometry and invalid-input handling pass.

These checks prove geometry/query behavior. They do **not** prove kart handling, collision response or anti-tunnelling, finished laps, AI, ghosts, hardware input, performance on a phone, or visual resemblance. Those require their own sections. Frame-rate checks here sweep points through gate geometry; they do not animate or simulate a kart.

## Sequence and approval gates

| Section | Focus | Required proof before review | Status |
|---|---|---|---|
| 1 | Track geometry, access, walls, gate data | Source fidelity, surface support, bridge separation, dimensions, placement and frame-split gate probes | Approved; seam fix enabled |
| 1V | Track-only visual inspection, no kart/avatar | Draw from the checked geometry; reproduce original materials/curbs/barriers; check views and device layouts | Built for owner visual review; approval pending |
| 2 | Kart speed, steering, grip, braking, boost, road following | Scripted reference input traces; numerical results at all four frame rates | Not started; requires go |
| 3 | Wall and kart contacts | Head-on/glancing/resting contacts, deck separation, no tunnelling at maximum/boost speed | Not started; requires go |
| 4 | Race rules | Countdown, ordered gates/laps, reverse/wrong-way, respawn, standings and interpolated finish times | Not started; requires go |
| 5 | Computer opponents | Same vehicle and inputs as player; real completed laps, no position shortcuts | Not started; requires go |
| 6 | Ghosts and time trials | Record/replay fidelity, per-track storage, malformed-data checks | Not started; requires go |
| 7 | Shared device controls | Numeric input mapping/analog/dead-zone tests, then real browser integration | Not started; requires go |
| 8 | Playable racing build outside the Test Lab | Use checked logic; visuals never move vehicles independently; device/browser checks | Deferred; requires go |

The exact kart model may be reused later without its avatar. Claude owns avatar movement and steering-wheel grips; seat/wheel/pedal attachment data can be agreed when that integration is approved. Island construction and scenery are separate later work.

## Section 1V implementation and checks

The current `/racing-lab/` is a track-only preview; the Test Lab’s former Driving entry is now Tracks (section 1). It uses the shared Motion Lab page/input/camera shell and the checked `track/index.ts` geometry. No kart, avatar, opponent or driving controller is mounted. Camera distance limits are configurable per adapter so a whole metre-scale track can be inspected without changing geometry scale.

The original asphalt, underside, sidewall, red/white curb striping and instanced rail beams/posts are reproduced. The old access bridge/curbs/openings are preserved only in the explicit source profile; the default test tracks omit those connectors and close the openings. A checkerboard start line follows the original source dimensions/colors. The reference capture now includes curb-opening flags and independent original mesh signatures. In reference mode, all four preview mesh lists match source position/normal/color buffers, instance transforms/colors, object transforms and materials exactly. Approved default mode applies only the measured seam repair. This is a geometry/material match, not a claim of identical lighting or surrounding scenery.

Five Node presentation checks pass before the preview build; the build runs them automatically. Browser checks cover all four complete tracks, fitted framing, views/reset, mouse orbit/wheel, phone orbit/pinch without a joystick, five layouts and zero page errors. Shared input regression and embedded Test Lab checks are also run. Videos remain empty. Island scenery is deferred.

**Stop after delivering this preview for visual approval. Do not start kart handling or any later layer automatically.**

## Approved update: isolated test tracks

18 November 2026: the owner requested removal of the bridges/stubs connecting each circuit to LetsGo’s shared floor slab. This is a track-foundation change, not just hiding a mesh.

- Default `accessBridge: false`: no access triangles, access descriptor or entrance point; connector-only space has no road support; no connector curbs/rails; bounds and framing cover the circuit only.
- Rebuild complete perimeter rails and enable the missing curb segments, closing the former entry openings. Each circuit has exactly two rails per road segment, with zero join gaps.
- The loop’s road corners, physical length, gates, elevations and internal overpasses are identical to the approved welded profile with a connector.
- Explicit `accessBridge: true` retains the old connector as an optional source profile for future reference; it is not enabled in the preview. Exact original diagnostics use both `seam: 'reference'` and `accessBridge: true`.
- Node checks verify absent support on connector-only points, null entrance/access values, empty connector geometry, closed walls/curbs and unchanged loop/gates. The presentation consumes that same profile; it creates seven static track mesh objects per circuit and no access bridge/curb objects.

Continue to wait for visual approval before kart handling.
