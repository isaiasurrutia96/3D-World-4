# Driving tuning contract

The owner authorized this code-first driving pass on 20 November 2026. This
extends the existing 120 Hz kart controller, ground support and swept contact
pipeline. Each kart has exactly one active handling profile. No presentation
code integrates its position. The approved avatar/motion code is untouched.

## Entry points

`createKartController({world, initial, resolveMotion, profile})` accepts a built-in
profile id or an immutable profile returned by `createHandlingProfile(changes)`.
The default remains `original` so existing integrations and recorded reference
checks retain their exact behavior. `createDrivingTest(trackId, {profile})` uses
the same pipeline. The live driving page explicitly selects `fast` by default.

| Profile | Normal limit | Boost limit | Purpose |
| --- | ---: | ---: | --- |
| original | 120 mph | 180 mph | Accepted LetsGo reference, unchanged numeric traces |
| balanced | 150 mph | 200 mph | Slower comparison with stronger arcade grip |
| fast | 180 mph | 220 mph | Owner-requested stronger arcade grip |
| f1-targets | 98.3 m/s (~220 mph) | same | Headless performance reference |

All computation uses metres, seconds and radians. The HUD converts to mph.
Mass is not a tuning knob in this acceleration-based model: adding an unused
800 kg constant would not change its behavior. Contacts retain their existing
relative inverse-mass mechanism. This is not a wheel/suspension simulation.
The owner permitted resizing, but measured geometry gives no reason to change
the accepted kart: 2.87 m long, 2.39 m wide, 2.03 m wheelbase, 0.38 m wheel
radius. Its conservative capsule is 3.06 m long and 2.36 m wide. Preserve its
seat, wheel and camera transforms for the later avatar/animation integration.

## Inputs, response and grip

`advance(frameSeconds, input)` owns the fixed-step accumulator, rollback and
interpolation. `sample()` only reads/interpolates. `KartInput` retains signed
throttle and steering, boolean brake and externally granted boost; optional
`brakeAmount` adds continuous 0–1 braking. Boolean brake wins. Phone
Brake/Reverse still brakes forward travel before backing up; Space/LT stop
without selecting reverse. Steering direction and every key binding are kept.

The driving-only pedal adapter preserves continuous standard Gamepad API
RT/LT values with a 5% trigger dead zone. The shared input module still supplies
movement, analog steering, look, keyboard and phone holds. Digital commands
retain priority. Xbox, PlayStation and Switch identities use the browser's
standard mapping. Browser checks emulate these devices; physical hardware and
console certification are not claimed.

Throttle, brake and wheel input have explicit response times. A bounded yaw
response provides weight; world momentum does not instantly align with body
yaw. Speed-dependent cornering and brake curves share an acceleration ellipse.
Excess demand causes progressive separation of travel direction/body direction.
Traction assistance reduces excess powered demand separately from the tire
budget. This is a virtual rear-drive arcade abstraction, not individual rear
wheel forces, slip ratios or suspension. There is no automatic drift or boost.

Full-throttle acceleration is the supplied *net* curve, with smooth joins; no
second drag term is subtracted. Coasting and adjustable lift assistance are
separate. Lift builds over 0.24 s; explicit service braking, lift/coast and
post-boost recovery use the strongest requested deceleration rather than
stacking three brake systems. The tire ellipse still bounds that request.
Releasing Gas and Boost can slow a kart while its two-second grant is active.
A held Boost still acts as Gas, triggers once, and does not extend its grant.
Overspeed returns gradually after boost rather than snapping the velocity.

The raw F1 brake curve produces 200–60 mph in **1.95 s / 103.90 m**. That
conflicts with the requested 2–3 s / 120–170 m window. Fast/Balanced use 80%
service-brake strength and measure **2.43 s / 129.15 m**. The reference profile
retains the raw curve. Acceleration milestones measure **2.642 / 5.208 / 10.575 s**
for 62 / 124 / 186 mph in the reference profile, including pedal response.

## Compatibility boundaries

Profiles copy/freeze their curves, validate inputs and expose a stable physics
fingerprint. Id/label changes do not change it; physical settings do. The
fingerprint is a compatibility label, not a security hash or online anti-cheat.
Custom kart parts can later create profiles through the same factory without
changing input, contacts, cameras or animation. Do not hot-swap profiles on a
live state: construct/reset with the new profile. Batch contact entries must
supply the matching profile; mismatches throw instead of silently changing
handling. If future records/ghosts use these profiles, their version/identity
must become part of record validation before cross-profile comparisons.

The optional `world.surfaceAt(x,z,y)` returns numeric `{grip,speed,resistance}`
multipliers, defaulting to 1. Changes blend over 0.15 s. Invalid results throw
and the controller rolls back the entire frame. The hook includes road height
for multi-level worlds. It does not choose final world material values or
implement another team's world system. `heightAt` and existing collision
adapters remain independent of input and rendering.

The approved game cards were read: racing, solo time trials, future ghosts,
free-roam kart use, balanced custom parts and Claude-owned seating/steering
animation fit these boundaries. No opponents, race rules, inventory, mystery
boxes, nitro charges or other minigames were added. Existing prototype features
are preserved; they are not claimed as newly rebuilt/proven by this tuning.

## Diagnostics and checks

Use `?drive=1&handling=fast`, `balanced`, or `original`; `&debug=1` enables a
non-interactive temporary diagnostic panel. `state.handling` exposes filtered
inputs, wheel limit, yaw rate, surface multipliers, applied tire acceleration,
braking/sideways G, slip angle, grip utilization and a filtered slip-demand
indicator. That indicator is not an individual-wheel slip measurement. Tire
telemetry excludes the separate collision impulse; `contacts` reports impacts.

`npm run test:racing-core` includes configuration, tuning and complete-course
checks. Racing builds also run pure pedal and presentation/scale checks. See
`PROFILE-CHECKS.json`, `TUNING-CHECKS.json/.md` and `COURSE-CHECKS.json` for each
plain rule, scripted input, independent measured result and PASS/FAIL.
Time-dependent scenarios compare 30/60/120/144 FPS on one 120 Hz clock; jitter,
250 ms catch-up, sub-tick boost pulses and five-minute seeded stress also run.
Known-radius results are measured from actual velocity direction changes,
not just a reported force. Energy checks verify steering cannot manufacture
speed. Complete courses use only ordinary scripted controls, never pose writes
or visible opponents, and compare the exact completion state/tick at all rates.

Manual browser commands: `node racing-lab/tests/driving-browser.mjs`,
`node racing-lab/tests/tuning-browser.mjs`, and
`node racing-lab/tests/chase-camera-browser.mjs`. They cover the live page,
profile links, actual adapter values, phone/desktop layouts, FPV, zoom lock,
scrolling, cancellation and the original climb at 180/220 mph. Automated checks
establish these cases; the owner's drive is still needed to judge the feel.


## Increased arcade grip after the first drive

The owner approved the overall feel and requested substantially more turning
ability. Fast, Balanced and custom-profile defaults now use **twice** the
previous lateral budget: 28/40/56/76/98 m/s² at the existing speed knots. The
steering limit reads the same curve, so wheel angle and tire capacity increase
together. This is an explicit arcade choice; the F1 reference curve is kept.
`PREVIOUS_FAST_PROFILE` retains every setting and the exact fingerprint of the
first approved Fast setup for numerical comparisons; it is not a new UI mode.

Input build/release is 0.18/0.14 s; yaw response remains finite at 0.10 s with
a 10 rad/s² bound, and slip settles over 0.14 s. Low-speed wheel lock stays
30 degrees. Actual velocity-derived turn radii at unchanged speed measure
132.15→66.07 m at 180 mph and 197.41→98.70 m at 220 mph. Straight acceleration,
lift, braking, reverse and boost traces match the previous profile tick for tick.

Releasing the brake restores more of the existing shared tire budget to
turning; the brake command fades rather than snapping the kart's heading or
adding a grip/speed bonus. A scripted brake→release transition measures the
real velocity change and the same acceleration ellipse. See `GRIP-CHECKS.json`
and `.md` for the comparison, release/reversal and transition evidence at all
four display rates. Subjective handling still needs the owner's next drive.


The owner specifically clarified **lifting off Gas before the turn**. The
approved gradual lift-off slowing remains active; as speed falls, the same
grip curve permits a tighter path. A dedicated before-turn test compares Gas
held/released and previous/current profiles using actual velocity curvature.
This verifies the requested effect directly, rather than substituting a
brake-release test or adding an unexplained temporary grip multiplier.
