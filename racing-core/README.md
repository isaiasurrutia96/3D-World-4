> **Fresh restart:** the owner rejected extending this prototype. The approved track rebuild is in [track/](track/README.md); the newly authorized handling layer is in [kart/](kart/README.md), awaiting review of its measured results. The authorized contact response is in [contacts/](contacts/README.md); its block-engine integration is pending Claude’s work. Decisions and approvals are in [PLAN.md](PLAN.md). Everything below describes the previous prototype, retained temporarily for existing demos. Its checks do not approve the new rebuild.

# Racing core — code-first rebuild

Four circuits from **3D-World-3 `573664e824a04234240a24dfc2eae2273e30a4ca`**: Original, Skyline, Suzuka and Winding. That revision introduces four NPC opponents on every circuit. The original repository is reference only; all implementation work here is in 3D-World-4. `motion-core/` and approved checkpoints are untouched.

This rebuild is a renderer-independent racing domain. It includes all four elevated courses, kart dynamics and contacts, four physics-driven opponents, countdowns, ordered lap gates, standings, finish times, wrong-way detection, recovery, time trials, and track-specific saved ghosts. It does not load the old scene, drive cars along a prerecorded animation, or require a browser to prove a race works. Character mounting, island entrances and weapon/item presentation are outside this track/race module. Boost is a bounded vehicle mechanic; combat items remain a separate system.

## Modules

| File | Responsibility |
| --- | --- |
| `tracks/reference.json` | Versioned authoring samples and original starting indexes for all four routes. Elevation, width and ordering are retained. |
| `track.js` | Rebuild one closed physical road from samples: arc length, width, gates, spatial index, triangle support and rails. The same explicit road triangles feed support queries and a future renderer. |
| `vehicle.js` | Fixed-step acceleration, braking/reverse, grip, steering, boosts, gravity, deck-aware support, substepped rail contacts and kart contacts. |
| `driver.js` | Ordinary throttle/brake/steer commands from curvature preview, pursuit, lane choice and traffic. It never places the kart. |
| `progress.js` | Continuous, height-aware course progress and forward-only, ordered gate crossings. Finish times are interpolated within the physics tick. |
| `session.js` | Fresh grid and race state for any track; player + four NPCs or solo time trial; countdown, standings, finish and respawn rules. |
| `ghosts.js` | Bounded 15 Hz pose recordings, interpolation, validation, four best times per layout, safe storage/import/export. |
| `input.js` | Adapter for the universal Motion Lab input snapshot; no new keyboard, touch or gamepad implementation. |

## Public contract

Import from `racing-core/index.js`. `createRaceSession({trackId, mode, laps, countdown, storage})` accepts `original`, `skyline`, `suzuka`, or `winding`; `mode` is `race` or `time-trial`. A new session is a fresh grid, never a reused race with stale progress. Call `start()`, then `advance(frameSeconds, {throttle, steer, brake, boost})` for frames from 0 through 0.25 seconds. The accumulator advances at 120 Hz. Throttle and steer are bounded -1..1; an edge-triggered boost consumes one of three charges. `getState()` returns positions, speeds, race phase, standings and finish times. `respawn(id)` returns to the last validated gate and makes the current lap ineligible for a ghost record.

The coordinate convention is metres/seconds, +Y up, yaw zero toward +Z, positive steer/yaw toward +X. Top speed and boost targets retain the old 120/180 mph values; the rebuilt core now matches LetsGo’s flat-ground tap, held-turn, release, countersteer and full-throttle/brake/reverse traces at 120 Hz. Four independent captured reference traces live in `tests/fixtures/letsgo-handling.json`, generated from the unmodified controller at the pinned source revision. This is a handling baseline, not a claim that all wall contacts or analog behavior are identical.

Ghosts are separate per layout and time trials only; racing against NPCs does not overwrite solo records. Missing, denied or full browser storage cannot break a race. Imports reject wrong tracks, invalid time order, non-finite data, off-road samples, teleports and traces that do not pass the ordered lap gates. This is client-side validation, not authoritative multiplayer scoring.

## Correctness rules

- Road triangles, split along the authored centerline so a twisting quad cannot lift it, decide support. A lower deck cannot snap onto an upper crossing.
- Near-parallel hairpins use continuity-limited projection. Gate crossing still needs the correct height, direction, lateral width and order.
- Reverse finish-line crossings cannot earn a lap. Teleports and missing support invalidate progress until recovery.
- Rail collisions use <=22 cm movement substeps even at boost speed. Kart contacts respect deck separation.
- NPCs use the same vehicle function and wall contacts as the player; pursuit changes inputs, never position.
- Full-race tests require all five cars to complete three laps on each of the four circuits with no respawns. Additional trials exercise ghost recording and playback.

## Verification and provenance

Run `npm run test:racing-core`. `TEST-RESULTS.json` records actual full-race outcomes; the tests fail if any circuit cannot be completed. No visual scene is part of the pass criteria.

The only imported legacy content is authoring data. It was sampled from the reference track generators using the repository's Three.js 0.180.0, rounded to micrometres, then rebuilt into new numeric geometry. Runtime distance is recomputed from the physical 3D segments rather than trusting a spline's approximate arc-length table. This makes tiny length differences from the legacy table explicit. Original starting points remain tied to their authored sample indexes. The import tool documents and pins the source revision; the application has no dependency on a checkout of 3D-World-3.
