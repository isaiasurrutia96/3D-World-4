# Fresh track layer

The current approved work is recorded in [../PLAN.md](../PLAN.md). This is a new track-only module. It does not import the previous prototype's track, vehicle, session or math modules.

Run `node --test racing-core/track/check.test.mjs` from the repository root with Node 24 and the project's installed development dependencies. The checks include strict TypeScript compilation and write [CHECK-RESULTS.md](CHECK-RESULTS.md) and [CHECK-RESULTS.json](CHECK-RESULTS.json). No browser is needed.

## Contract

Import `createTrack`, `TRACK_IDS`, `SOURCE` and `APPEARANCE` from `index.ts`.

`createTrack(id, placement?, options?)` accepts `original`, `skyline`, `suzuka` and `winding`. Placement is a rigid `{x,y,z,yaw}` transform in metres/radians, applied about the original scene origin. It preserves scale. `options.seam` is `weld` by default: the owner approved the Original Circuit seam correction on 18 November 2026. Use explicit `reference` only for source-fidelity diagnostics.

Public geometry is immutable:

- `segments`: source road corners and two exact support triangles per segment.
- `rails`: original endpoints, including entry openings and access rails, plus the source physical wall height. No collision response is implemented.
- `accessTriangles`: the source bridge's supported surface. The shared hub, voxel island and global floor are not part of a track.
- `gates`: original world positions and horizontal forward directions, with physical distances and source distances both labelled.
- `start`, `entrance`, `bounds`, widths, thickness, `length`, `sourceLength` and `seamEdgeGap` expose the measured layout.

Queries return new values rather than mutating geometry:

- `sample(metres)` follows the physical 3D centerline, relative to the source start. Negative and multi-lap distances wrap. Its normal is the interpolated **source left-normal**, not a vehicle steering vector.
- `roadHeightAt(x,z,maximum)` queries only the source road triangles and returns the highest surface not above `maximum`, or null. The default maximum is Infinity; a vehicle must supply an appropriate height limit at an overpass.
- `heightAt(x,z,maximum)` also includes the access bridge. No floor exists elsewhere.
- `project(point,{hintDistance,maxDelta})` returns route position and height error. Positive `lateral` is to the **right** of the forward direction. Optional hints keep the result within an explicit physical-distance window at nearby branches; no valid match returns null.
- `nearestWall(point,radius)` queries rail geometry within a horizontal distance and the wall's vertical span. It does not resolve contacts, sweep a body or prove anti-tunnelling.
- `crossGate(index,from,to)` returns a forward crossing fraction/point within the gate's width and height band, or null. Arriving on the plane counts; departing from the plane does not count twice. It does not award a lap or enforce checkpoint order.
- `toLocal(point)` reverses placement.

Y is up. Yaw zero faces +Z; positive yaw turns toward +X. The source data is kept at full double precision; future renderers can convert it to GPU buffers without inventing a second driving surface. `APPEARANCE` records original colors and dimensions only; it is not a visual preview.

## Reproducible source capture

`node racing-core/tools/capture-track-reference.mjs /path/to/3D-World-3` reads a fixed Git archive at revision `573664e824a04234240a24dfc2eae2273e30a4ca`. It uses Three.js 0.180.0 solely to evaluate the original generators, records source file hashes, and captures independent height/crossing expectations with the original road-surface function. It writes `reference.json` without timestamps or rounding. This explicit tool is not run during a game build and never changes the reference repository.

Original Circuit's source seam issue and the approved repair are documented in PLAN.md and the results. The authored below-zero dip is preserved. The track-only Racing Lab now uses this module; frozen checkpoints remain unchanged.
