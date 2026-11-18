# Racing rebuild: one approved layer at a time

Updated 18 November 2026. This is the single plan and approval record for the fresh rebuild.

## Owner direction and approvals

- **Approved:** start fresh, with LetsGo Racing as the behavior and eventual appearance target. The owner explicitly declined a comparison/audit against the previous rebuild.
- **Approved to implement:** section 1, track logic, following the owner's “okay go.”
- **Awaiting owner review:** section 1's implementation and measured results. Passing automated checks is not owner approval.
- **Awaiting decision:** whether to enable the proposed Original Circuit seam repair described below.
- **Not started:** the track-only visual preview and all later gameplay layers. Explain each next section and obtain the owner's go first.
- **Rejected as the new foundation:** extending/tuning the earlier racing prototype. Its existing demo stays available while replacement layers are reviewed; none of its logic is imported by the new track module.

The process applies to the owner's other projects as well: code first, one section at a time, automatic checks before visuals, plain-language results, then owner approval before continuing. Keep logic in `racing-core/` and the future visual adapter in `racing-lab/`. Do not edit `motion-core/` or frozen checkpoints.

## Target and source

The targets are the existing Original, Skyline, Suzuka and Winding circuits from `isaiasurrutia96/3D-World-3`, revision `573664e824a04234240a24dfc2eae2273e30a4ca`. This was the reference repository's latest main when captured. It is reference-only.

The fresh module is **`track/index.ts`**, with its own geometry functions, data, strict TypeScript check and Node tests. The older `track.js`, root `index.js` and their vehicle/session modules are the superseded prototype, not dependencies of this rebuild.

`tools/capture-track-reference.mjs` reads a pinned Git archive and extracts full-precision authoring samples, exact rail endpoints, access bridges, start/gates and appearance constants. It records SHA256 hashes of the source files. Independent height probes and crossing heights are calculated by LetsGo's original road-surface function during capture. Runtime code imports only local numeric data and fresh geometry functions; it requires no browser, Three.js or old checkout.

## Section 1 decisions

1. Preserve all authored road corners, elevations, rail openings, access bridge dimensions, start positions and 13 gates per course. No curve redesign or rounding to a voxel grid.
2. Preserve 26 m asphalt width, 1.1 m curbs on each side, 28.2 m total width, 0.65 m road thickness and the source's 1.2 m physical wall height.
3. Use the original two triangles per road segment for surface queries, matching the reference road. Do not invent an unseen driving surface or ground slab.
4. Keep true physical distance along the 3D sample polyline separate from the source spline's approximate station-length table. Both measurements are reported. Gates retain their exact world positions while obtaining physical-distance coordinates.
5. Geometry queries are stateless. Gate-plane intersection is geometric data; countdowns, lap counting, ordering, standings, respawn and vehicle timing are later layers.
6. Gate crossing uses an arrival-inclusive/departure-exclusive rule to avoid counting a point on the plane twice. It rejects reverse, outside-width and wrong-height crossings. Session behavior when spawning directly on the line remains a later decision.
7. Expose a rigid placement transform so islands can be added without changing track dimensions. Island terrain will use the approved voxel style and 43 cm block scale. The supplied six-island image is context only; it does not replace LetsGo's routes or authorize new themes/layouts.
8. Save appearance constants as reference data only. No renderer, kart, avatar, scenery, new driving page or visual polish is part of this section.

## Source issue and concrete proposed repair

**Original Circuit's source centerline closes exactly, but its first and last road-edge normals differ. The road edges miss by 0.046163501 m (4.62 cm).** The source also includes a small below-zero road dip; that authored elevation is preserved.

- Default `seam: 'reference'` preserves the exact source road and rails, including that measurable seam mismatch.
- Candidate `seam: 'weld'` reuses the first cross-section at the last endpoint and adjusts the matching two wall endpoints. Only two road corners and two rail endpoints move, by under 5 cm. Centerline positions, physical route length and every checkpoint stay unchanged.
- Both modes are tested. **The candidate is not enabled by default or connected to the live game.** It is ready for owner review.
- Skyline, Suzuka and Winding already have closed seams; the option makes no edits to those tracks.

Do not label the unmodified Original road seam as watertight. Ask the owner about the tested repair when reporting this section, before enabling it or adding visuals.

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
- All 15,577 wall midpoints can be queried, access bridges support their source height, and empty space has no invented floor.
- Island placement, loop wrapping, route-branch hints, seam diagnosis/candidate repair, immutable geometry and invalid-input handling pass.

These checks prove geometry/query behavior. They do **not** prove kart handling, collision response or anti-tunnelling, finished laps, AI, ghosts, hardware input, performance on a phone, or visual resemblance. Those require their own sections. Frame-rate checks here sweep points through gate geometry; they do not animate or simulate a kart.

## Proposed sequence and approval gates

| Section | Focus | Required proof before review | Status |
|---|---|---|---|
| 1 | Track geometry, access, walls, gate data | Source fidelity, surface support, bridge separation, dimensions, placement and frame-split gate probes | Implemented; awaiting owner review and seam decision |
| 1V | Track-only visual inspection, no kart/avatar | Draw from the checked geometry; reproduce original materials/curbs/barriers; check views and device layouts | Deferred; requires go after section 1 approval |
| 2 | Kart speed, steering, grip, braking, boost, road following | Scripted reference input traces; numerical results at all four frame rates | Not started; requires go |
| 3 | Wall and kart contacts | Head-on/glancing/resting contacts, deck separation, no tunnelling at maximum/boost speed | Not started; requires go |
| 4 | Race rules | Countdown, ordered gates/laps, reverse/wrong-way, respawn, standings and interpolated finish times | Not started; requires go |
| 5 | Computer opponents | Same vehicle and inputs as player; real completed laps, no position shortcuts | Not started; requires go |
| 6 | Ghosts and time trials | Record/replay fidelity, per-track storage, malformed-data checks | Not started; requires go |
| 7 | Shared device controls | Numeric input mapping/analog/dead-zone tests, then real browser integration | Not started; requires go |
| 8 | Playable racing build outside the Test Lab | Use checked logic; visuals never move vehicles independently; device/browser checks | Deferred; requires go |

The exact kart model may be reused later without its avatar. Claude owns avatar movement and steering-wheel grips; seat/wheel/pedal attachment data can be agreed when that integration is approved. Island construction and scenery are separate later work.

**Stop here after reporting section 1. No automatic move to a preview, handling, or any other section.**
