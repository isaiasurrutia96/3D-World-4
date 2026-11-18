# Kart handling — section 2

This is the fresh handling foundation, separate from the retired `racing-core/vehicle.js`. Import `createKartController` from `racing-core/kart/index.ts`. It requires only numbers and a `heightAt` surface. The checked `track/index.ts` track already implements that interface. No browser, renderer, avatar, NPC, old vehicle/session code, or new visual page is imported.

The owner authorized this layer after accepting the track/inspection work. Results await review; the next section is wall/kart contacts. See the single approval record in [PLAN.md](../PLAN.md).

## Behavior and units

Metres, seconds and radians. +Y is up, +Z is forward at yaw 0, and positive yaw points toward +X. **Positive steering turns left**, matching the original LetsGo controller. The future device adapter must preserve that sign; it must not assume that screen-right is +steer.

The pinned reference is LetsGo Racing, `isaiasurrutia96/3D-World-3`, revision `573664e824a04234240a24dfc2eae2273e30a4ca`. Original handling constants and behavior are retained:

- 120 mph / 53.6448 m/s normal cap; 180 mph / 80.4672 m/s boost cap.
- 24 m/s² normal acceleration; 48 m/s² boost; 36 m/s² braking; 8 m/s reverse cap.
- Soft steering build, quicker release/countersteer, less lock at higher speeds, and up to 20% additional lock after a 0.5-second continuous hold and 0.8-second ramp.
- Arcade grip follows chassis heading in ordinary driving; sideways velocity decays at 7/s. This is the reference's arcade model, not a tire-force simulator. No invented centerline attraction or auto-steering.
- Original coasting drag, gradual post-boost return to normal speed, 22 m/s² gravity, height-aware landing, and smoothed pitch/bank from the road footprint.
- Wheel rotation measures actual signed forward travel using the original 0.38 m radius.

`throttle` is in [-1,1], `steer` in [-1,1], `brake`/`boost` are booleans. Values outside the numeric range clamp; nonfinite values or malformed flags throw. Positive/negative **pedal signs retain the original button semantics**: a fractional positive pedal applies the same acceleration as Gas; it does not lower top speed. Steering magnitude remains fully analog. Pressure-sensitive pedal acceleration, if desired, is a later explicit behavior decision; it is not silently substituted for the existing feel.

Boost is a **granted engine command**, not inventory. Its rising edge activates the reference 2-second Nitro and cancels reverse speed. Holding the command does not refill it, and a short press is retained until the next physics tick. There are no invented starter charges, boxes, item probabilities or item UI. Future race/items code must decide whether to grant an activation. Reference floating-point timer behavior is retained: expiration can consume one extra 1/120-second tick at the boundary. Recorded expiry traces are checked against the original, rather than hiding that difference.

## Controller contract

`createKartController({world, initial})` returns:

- `advance(frameSeconds, input)`: accumulate time and run **only 1/120-second physics steps**. Optional `InputScript(tick, seconds, state)` samples a deterministic script at the start of each physics tick. Literal input is held for that rendering frame. Identical timestamped physics inputs give matching results at 30/60/120/144 FPS; real input sampling latency still depends on hardware/events.
- `state`: immutable authoritative state. `x,y,z` are the road-contact origin; `speed`/`lateralSpeed` are chassis-local metres/second. `kartVelocity(state)` exposes world X/Z velocity. Yaw stays continuous, allowing smooth interpolation through ±π.
- `sample(alpha?)`: immutable interpolated pose between the last two physics states. The default alpha is the remaining fraction of a tick. Rendering reads this pose without advancing physics; it intentionally trails authoritative state by at most one tick.
- `clock`: immutable physics tick count, simulated seconds, remainder and interpolation alpha.
- `reset(initial?)`: restore the copied initial placement or a new explicit one, clearing momentum, previous pose, clock, held-steer history and queued boost. Race respawn policy is not defined here.

Frame duration must be finite and in [0,0.25]. Oversized/suspended-tab frames throw rather than silently discard simulation time; a future page's visibility lifecycle must pause/rebase its wall clock. 250 ms catch-up batches, jittered frames and the four requested rates produce the same timeline. Zero-duration calls can queue an input edge without advancing physics. A failed script or malformed surface result rolls back the entire frame batch, including its clock and boost latch.

`world.heightAt(x,z,maximum)` must return the highest supporting height at/below `maximum`, or null over empty space. The checked track preserves bridge levels and has no floor beneath it. The kart follows supported heights, falls off unsupported edges and lands under gravity. Footprint probes tilt the body; they do not make wall contacts or chassis collision geometry. Contacts, rail recovery steering, impact spin/recovery, anti-tunnelling, race rules, inventories, device controls, jumps and driver grips belong to later layers. A kart going beyond a road edge falls rather than being snapped back.

## Proof and reproduction

Run `npm run test:racing-kart` for 50 checks, including strict TypeScript compilation with **ES2022 only and no ambient browser types**. Every check writes its rule, scripted input, measured result and PASS/FAIL to [CHECK-RESULTS.md](CHECK-RESULTS.md) and [CHECK-RESULTS.json](CHECK-RESULTS.json). `npm run test:racing-core` also imports these checks for deployment CI, alongside the approved track checks and separately retained old-prototype regressions.

The independent reference capture has 31 scenarios and 998 sampled states, compared at all four frame rates. It covers taps, sustained turns, countersteering, analog steering, button-pedal behavior, acceleration, braking/reverse, coasting/grip, boost/expiry/overrides, slope orientation, airborne/landing/ledge behavior, both road levels and original starts/ramps on all four tracks. Further checks measure stopping distance, mirrors, edge retention, interpolation, immutable/reset/error handling, every captured overpass, rigid island placement, jitter/catch-up, and a seeded one-minute mixed-control trace. Numeric agreement establishes these cases; subjective driving feel will still need the owner's hands-on test.

To deliberately recapture from the original repository, run `node racing-core/tools/capture-kart-reference.mjs /path/to/3D-World-3`. It unpacks the pinned Git archive to a temporary directory, executes the unmodified source controller/road function with identity horizontal contacts, records source hashes and writes local numeric data. Boost phases reproduce the source Nitro grant. It does not read the old rebuild or modify either checkout. Runtime/build/CI require no reference checkout, network, Three.js or browser to run the handling tests.

## Optional contact integration (section 3)

`resolveMotion` can now be supplied to the controller. `prepareKartStep` and `finishKartStep` expose the two halves of the same fixed tick so the contact module can solve all karts on one timeline before road support is evaluated. The default path retains all 50 no-contact handling checks. Contact state adds bounded `impactYawRate`, `impactRecovery`, `railContactTime` and the current tick's `contacts` count; reset clears them. See [contacts/](../contacts/README.md). Claude's block collision engine and its integration are still pending; do not treat the rail adapter as a completed block system.
