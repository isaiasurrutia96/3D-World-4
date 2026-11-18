# Kart contacts — section 3

The owner authorized kart contacts and clarified that **their block-collision work with Claude is still in progress**. This layer builds the racing response and its adapter boundary. It does not import, modify or claim completion of the block engine. All decisions/approvals remain in [PLAN.md](../PLAN.md).

## What is built

A pure TypeScript 120 Hz contact step, with no graphics, browser, NPC, avatar, race rules, inventory or prototype vehicle/session imports. The contact footprint matches LetsGo: a horizontal capsule with radius 1.18 m, half-axis 0.35 m and height 1.8 m. Normal impact restitution is 0.075 with a 1.5 m/s rebound target cap; tangential friction is 0.10. Small sustained drive loads do not generate angular impulses. Genuine impacts can add bounded yaw rate (up to 0.8 rad/s), damped by the handling kernel. Fresh impacts have a 0.12-second recovery; a 0.3-second contact cooldown suppresses repeated rebounds. Driver steering can turn away from a rail under Gas, as in the reference.

Sweeps find the earliest contact along the entire translation path, including capsule long sides, round ends, rail endpoints, parallel sides and zero-length posts. They do not rely on a final-position overlap test. All karts advance on one timeline, using relative-motion sweeps for pairs. Simultaneous contacts and already-touching neighbors form one constraint set, so an impact can transmit through a stationary kart into a wall. Sorting stable ids makes results independent of caller array order.

Normal and friction impulses dissipate energy in the tested coasting cases. Pair impulses preserve linear momentum, including unequal masses. For translation sweeps, yaw is held at its prepared orientation within each tick; bounded angular response is applied by the next handling tick. A final translational constraint removes any remaining inward center velocity instead of allowing an angular impulse to carry translation through a barrier. This is a deliberate arcade approximation, not continuous 3D rotational rigid-body simulation. Small rotation/spawn overlaps are corrected geometrically, without injecting velocity. Road support, pitch/bank and wheel travel are then calculated at the resolved location.

The solver has explicit bounds: at most 32 bodies, at most 1/120 second per call and at most 4 m of initial travel per tick (the 180 mph kart travels about 0.67 m). Impossible initial configurations, malformed hits and exhausted contact budgets throw rather than silently advancing through a wall. `createKartController` commits a frame only after all ticks succeed, preserving rollback of authoritative state/clock on a failed adapter. The report verifies scripted cases; it is not an exhaustive proof for every possible future world.

## API and the pending block adapter

- `solveKartContacts(bodies, seconds, barriers?)` advances immutable numeric contact bodies and returns immutable bodies, contact events and diagnostics. Body ids must be unique and stable. Units are metres, seconds and radians; velocities are world X/Z. `inverseMass` defaults to 1 and must be positive. Walls are static.
- `createKartContactResolver(barriers)` plugs into `createKartController({world,initial,resolveMotion})` for one kart. The default handling controller still has no contact response unless explicitly connected.
- `stepContactKarts(entries, surfaceWorld, barriers?)` prepares every kart's handling tick, resolves them simultaneously and finishes each tick against the actual supporting road. This is the fixed-tick primitive for a later race coordinator, not a race session. Each entry supplies `id,state,input` and an optional granted `activateBoost` event. It does not invent opponents or item charges.
- `createRailBarriers(segments)` / `trackBarriers(track)` adapt the **existing track rails**. They maintain a numeric spatial index and query the actual height of each sloping wall, so different bridge decks do not contact. Optional thickness is used for thin-rail checks.

The racing-side `BarrierWorld` contract in `world.ts` is intentionally separate from any final Claude API:

1. `sweep(body, move)` returns candidate hits along the requested capsule translation. Each hit has a stable `id`, a fraction in [0,1], an outward unit `normal`, a world-space contact `point` and nonnegative penetration `depth`.
2. `overlaps(body)` returns current penetrations **and resting/near contacts within 1 micrometre** (depth 0 for a separated/touching body). Resting neighbors must be available even when not moving, otherwise a multi-kart pileup can push into a wall. The solver validates every supplied hit.
3. Geometry adapters must account for the capsule's full radius/axis and vertical span. Candidate hits for other road levels must be excluded. Surface support remains a separate `heightAt` query.

When Claude's block engine is ready, a racing adapter can translate its finished queries into this contract. It must then pass the same response tests plus actual voxel face/seam/edge integration tests. The test rail with 10.75 cm thickness proves that this response/sweep path can handle a thin barrier; **it does not prove Claude's blocks or a completed voxel adapter**. Current standalone track and Test Lab pages remain track inspection only.

## Checks

Run `npm run test:racing-contacts` for 26 Node checks, including strict TypeScript with ES2022 only and no ambient browser types. Deployment's existing `test:racing-core` command imports them automatically. [CHECK-RESULTS.md](CHECK-RESULTS.md) and JSON record the plain rule, scripted input, measured results and PASS/FAIL for each check.

Timed controller/combined-kart cases run at 30, 60, 120 and 144 FPS. Further cases compare jitter and 250 ms catch-up frames. Measurements cover fresh/resting head-on impacts, thin rails from both sides, glancing energy/sliding, corner pressure, steering away, curved rails on all four tracks, all captured overpass levels, opposing boost-speed karts, crossing/lateral bumps, three- and five-kart chains, unequal-mass momentum, initial overlap correction, immutable/order-independent data and adapter rollback. Independent segment-distance and temporally sampled oracles check sweep results without reusing the production closest-segment implementation.

The 50 original handling checks continue to compare 31 recorded LetsGo scenarios; no-contact behavior is retained. Owner review is required before race rules. Block integration, actual-device/browser driving and subjective contact feel remain separate future checks.
