# Racing rebuild: one approved layer at a time

Updated 18 November 2026. This is the single plan and approval record for the fresh rebuild.

## Owner direction and approvals

- **Approved:** start fresh, with LetsGo Racing as the behavior and eventual appearance target. The owner explicitly declined a comparison/audit against the previous rebuild.
- **Approved to implement:** section 1, track logic, following the owner's “okay go.”
- **Approved by owner:** section 1 and its measured results, in “Yes the fix in the original and everything else okay go.”
- **Approved and enabled:** Original Circuit seam repair; welded geometry is now the default.
- **Approved by owner:** the track preview and inspection controls, followed by the discussion of section 2 and the owner's “okay do the code first, really build a solid code as usual.”
- **Approved to continue:** section 2 results, by the owner’s explicit instruction to build the next code layer after discussing contacts.
- **Authorized to implement:** section 3, kart-contact response (“Okay focus on building the code first for the next part”). Owner clarified their block-collision work with Claude is still in progress. The response/interface can be checked independently; actual block integration remains pending. No playable visual kart page is authorized by this section.
- **Rejected as the new foundation:** extending/tuning the earlier racing prototype. Its existing demo stays available while replacement layers are reviewed; none of its logic is imported by the new track module.

The process applies to the owner's other projects as well: code first, one section at a time, automatic checks before visuals, plain-language results, then owner approval before continuing. Keep logic in `racing-core/` and the future visual adapter in `racing-lab/`. Do not edit `motion-core/` or frozen checkpoints.

## Target and source

The targets are the existing Original, Skyline, Suzuka and Winding circuits from `isaiasurrutia96/3D-World-3`, revision `573664e824a04234240a24dfc2eae2273e30a4ca`. This was the reference repository's latest main when captured. It is reference-only.

The fresh modules are **`track/index.ts`** and **`kart/index.ts`**, each with strict TypeScript checking and Node tests. The older `track.js`, root `index.js` and their vehicle/session modules are the superseded prototype, not dependencies of this rebuild.

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
| 1V | Track-only visual inspection, no kart/avatar | Draw from the checked geometry; reproduce original materials/curbs/barriers; check views and device layouts | Owner accepted preview/inspection and authorized section 2 |
| 2 | Kart speed, steering, grip, braking, boost, road following | Scripted reference input traces; numerical results at all four frame rates | 50 Node checks pass; owner authorized the next contact layer |
| 3 | Wall and kart contacts | Head-on/glancing/resting contacts, deck separation, no tunnelling at maximum/boost speed | Contact response built: 26 Node checks pass; block adapter pending Claude; review pending |
| Driving feel | One original kart, checked handling/contacts and shared controls | 12 Node checks, browser controls/camera/layout checks and working link | Authorized; ready for owner feel feedback after verification |
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

The owner subsequently accepted the preview/inspection work and explicitly authorized section 2. Continue to require a separate go for every subsequent section.

## Approved update: isolated test tracks

18 November 2026: the owner requested removal of the bridges/stubs connecting each circuit to LetsGo’s shared floor slab. This is a track-foundation change, not just hiding a mesh.

- Default `accessBridge: false`: no access triangles, access descriptor or entrance point; connector-only space has no road support; no connector curbs/rails; bounds and framing cover the circuit only.
- Rebuild complete perimeter rails and enable the missing curb segments, closing the former entry openings. Each circuit has exactly two rails per road segment, with zero join gaps.
- The loop’s road corners, physical length, gates, elevations and internal overpasses are identical to the approved welded profile with a connector.
- Explicit `accessBridge: true` retains the old connector as an optional source profile for future reference; it is not enabled in the preview. Exact original diagnostics use both `seam: 'reference'` and `accessBridge: true`.
- Node checks verify absent support on connector-only points, null entrance/access values, empty connector geometry, closed walls/curbs and unchanged loop/gates. The presentation consumes that same profile; it creates seven static track mesh objects per circuit and no access bridge/curb objects.

This track-only stop was superseded by the owner's explicit section 2 authorization recorded above.

## Owner-requested inspection controls

18 November 2026: visual approval is paused while the shared Test Lab viewer gains off-center inspection. Pinch focuses beneath the two-finger midpoint and moving the midpoint pans; wheel/trackpad zoom focuses beneath the cursor. Perspective focus depth follows the picked surface so a close zoom approaches that part without crossing it. The shared Motion Lab camera retains the target offset until Reset or an explicit fitted view. Isometric presentation and ordinary OrbitControls labs use the same correction. Camera gestures do not alter the checked track geometry or any movement-core code. Ten Node point/depth/picking tests include frame-split equivalence; browser checks measure projected pixel stability for off-center track perspective/isometric gestures and an avatar part, wheel focus, release stability and page-zoom suppression. This is an inspection fix, not approval to start kart handling.

## Section 2 — kart handling, authorized and built for review

The owner's “okay do the code first, really build a solid code as usual” authorizes the headless handling layer discussed immediately beforehand. The preceding “everything is good” and subsequent discussion accept the track/inspection stage. The owner prefers the existing kart, without an avatar, when a hands-on visual test is separately ready; no kart visual or playable page has been built in this section.

Implementation: `kart/index.ts`, with a strict ES2022-only typecheck and no runtime imports. It implements original acceleration/caps, braking/reverse, coasting, speed-sensitive steering/tap/release/held gain, lateral grip, granted boost/expiry, gravity/landing, deck-aware support, pitch/bank and wheel travel. The 120 Hz controller owns all motion; immutable interpolated poses are provided for a future view. Jitter/catch-up retain elapsed time. Invalid calls roll back a whole frame batch. Short boost presses survive frames smaller than one physics tick.

Reference decisions:

- Pinned original LetsGo revision is unchanged. A separate capture tool executes its unmodified controller against flat/sloped/ledge/deck surfaces and the original four road surfaces, with horizontal contact resolution disabled. Only local numeric traces are used by the tests; the retired rebuild is never imported by fresh handling.
- Preserve the original steering convention (positive-right from the chase view), original button-pedal semantics and original arcade grip. No new top-speed target from fractional throttle or more-realistic tire model is substituted. Analog steering strength is retained. Future pressure-sensitive pedals need an explicit decision.
- Nitro lasts 2 seconds with the source's possible extra floating-point boundary tick (1/120 s), and decays back to normal speed at 12 m/s² under Gas. Boost is a granted edge command; inventory/charges/pickups remain later work.
- Surface support uses only the supplied checked road: no hub bridges, floor slab, invisible centerline guide or wall constraint. Gravity handles driving off an edge. Staying within the guardrails and impact response require section 3.

**Checks: 50 PASS, zero FAIL** in [kart/CHECK-RESULTS.md](kart/CHECK-RESULTS.md); structured companion JSON includes every input, rule and measurement. 31 original scenarios / 998 sampled states agree at 30/60/120/144 FPS; maximum numeric source difference is 1.171e-11 across state fields. First-second speed is 24 m/s over 12.1 m. Normal cap is 53.6448 m/s (120 mph), boost cap 80.4672 m/s (180 mph). Stopping from normal cap takes 1.491666667 s over 39.74562 m, with no reverse motion. Frame splits, mixed/jittered inputs, 250 ms batches, 60-second seeded driving and all captured bridge decks pass. Exact independent measurements, not visual appearance or subjective feel, are what is approved for review.

Deployment integration: `npm run test:racing-core` passes all 128 checks: 50 fresh track, 50 fresh handling, and 28 separately retained prototype regressions. Re-running the source capture produces the same SHA256 reference-data hash. The prototype results are regression coverage, not approval of its architecture or later layers.

This section 2 stop was superseded by the owner’s explicit go for contact response. No later section starts automatically. No NPC, avatar/steering-wheel grips, race session, ghosts, device UI, scenery or visual polish is included.


## Section 3 — kart-contact response; block integration pending

The owner authorized the next code layer, then corrected that the block engine being built with Claude is **not complete**. Preserve that work and do not present it as finished. The workspace/GitHub connection recovered without repository settings changes. This section implements only the racing response and a numeric adapter contract, using existing rails/test barriers to prove it independently.

- New `contacts/` module: full horizontal capsule translation sweeps, earliest impact time, height-aware rail adapter, friction/bounded rebound/yaw response, resting constraints, simultaneous moving-kart contacts, position-only overlap recovery and immutable diagnostics. No new block grid, block geometry, block runtime imports or changes to Claude’s files.
- The original footprint/tuning is retained (1.18 m radius, 0.35 m half-axis, 1.8 m height, 0.075 restitution, capped 1.5 m/s normal rebound target, 0.10 friction). The solver is fresh continuous translation code, not an assertion of identical source collision trajectories. Yaw is held fixed during each contact sweep and bounded angular response is integrated on the next handling tick; a dissipative translational constraint prevents center motion into a barrier.
- Handling exposes immutable prepare/finish fixed-tick phases plus an optional motion resolver. Single-kart and simultaneous-kart adapters share that same handling kernel; the 50 original handling checks still pass. No race coordinator, NPC or controls UI is built.
- All touching neighbors are solved together. A three-kart pileup test caught repeated wall/pair ping-pong in the first implementation; adding resting-contact constraints fixed it. Three- and five-kart chain tests now pass without contact-budget failure.
- `BarrierWorld` consumes sweep hits and current penetrations/resting contacts. It is a racing-side adapter boundary, not a demand that Claude change their final API. Once the block system is ready, connect it through an adapter and run actual voxel face/seam/edge integration checks. Those remain **pending**, not passed.
- 26 Node response checks pass, including 30/60/120/144 FPS, jitter/catch-up, thin 10.75 cm test rails from both sides, all four track rail sets, bridge deck separation, oblique sliding/energy, held Gas/corners, steering away, moving pair momentum, crossing/side bumps, chain pressure, rotating footprint support, independent sweep-distance oracles and failed-adapter rollback. Detailed inputs, expected rules, measured results and PASS/FAIL are in `contacts/CHECK-RESULTS.{md,json}`. No final visual or subjective feel is claimed.

Validation: `npm run test:racing-core` passes all **154** checks (50 track, 50 handling, 26 contact response and 28 retained prototype regressions). Independent rail-distance probes measure zero penetration in the four-track outward-shot cases. The five-kart pressure chain’s largest pair overlap is 1.215e-7 m, identical at all four rendering rates. This tolerance does not claim exact zero overlap in an iterative numerical solver.

This contact-layer stop was superseded only for the owner-authorized driving-feel test below. Section 4 and further features still require a separate go.

## Driving-feel test — immediate priority authorized by owner

The owner corrected the proposed sequencing: after proving handling/contact code, the next step is to drive it and judge feel, not start another racing layer. “Make sure u completed all the code that has to do with the testing … and then we can test the driving feel” authorizes the necessary one-kart test adapter, original kart presentation, shared controls and automated browser checks. Keep this task strictly on that test. Do not begin race rules, additional features or visual polish while waiting for feel feedback.

- `testing/drive.ts` composes the checked track/handling/contact code; one kart, explicit track selection and Reset, immutable authoritative state and interpolated render pose. A separate input mapper reconstructs axes from the existing shared device snapshot, with consistent kart-relative button steering and analog strength.
- `/racing-lab/?drive=1` mounts the exact original LetsGo kart source, without additional actors, on any of the four checked tracks. Default track inspection is preserved. View/wheels/steering read the same checked pose. The camera uses the original chase dimensions and returns to normal framing on Behind. Controls remain accessible beside the stage on phones and desktops.
- Phone Left/Right/Gas/Brake-Reverse hold buttons use the shared input module. Pointer capture, release/cancel, blur/reset clearing and simultaneous touches are checked. Shared input adds optional Reverse and RT Gas actions; movement pages ignore those actions. Keyboard and standard Gamepad API controls use the same path.
- A small input-cancellation API clears a queued Boost during pause without teleporting the kart or altering its clock. The shared page resets its frame clock across active/inactive transitions; driving pauses when unfocused. This prevents a long inactive frame or stale held input from distorting the test.
- 12 Node checks cover the complete test adapter, four-rate state equality, input direction/analog/no-creep behavior, Reset/selection, pending-input cancellation, real contact wiring, strict typechecking and the original model's hash/rig. Browser checks cover the actual controls, four tracks, chase visibility, touch combinations/cancel/reverse, blur pause, three injected standard controller identities, pinch and five device layouts.

**Stop after delivering the verified driving-test link. The next action belongs to the owner: drive it and give handling feedback.** Do not interpret this test authorization as permission to advance another racing layer.

Final local verification for the driving test: **166 racing Node checks pass**, including the 12 new test-wiring checks; the complete build passes. Browser validation covers the driving app plus shared input and default track-preview regressions. These are implementation checks; handling feel awaits the owner’s test.


## Driving-test steering correction

The owner reported S steering right and F steering left. The device adapter had inverted the original steering convention: positive steer produces a right turn from a behind-camera view. Corrected only the adapter's horizontal axis/button sign; S/Left now sends negative steer, F/Right positive steer, consistently for keyboard, phone buttons and gamepad. Handling rates, grip, speed and camera behavior are unchanged. Corrected the misleading sign annotation in the handling contract. A new regression projects actual driven paths through a chase camera at four headings and all four rendering rates; it failed on the old mapping. Browser checks now use actual S/F and arrow key events and measure screen-space turn direction, rather than treating a wheel-angle sign as proof of a left/right turn. Stop for the owner's driving feedback after the updated link.

Steering correction verification: 13 driving-test Node checks pass, including 96 actual-path/chase-camera direction probes. Browser keypress checks confirm S/Left and F/Right screen-space movement, with touch and controller regressions also passing; full build passes. Physics tuning is unchanged.

## First-person view — authorized comparison step

After discussing possible F1-inspired tuning, the owner accepted the proposed staged order: first add FPV, then stop to compare the same driving from both perspectives (“okay and also ill see if its too fast or not go”). This go authorizes the view only. The proposed 150 mph normal / 200 mph boost tuning, acceleration/coasting/steering adjustments, any resize and deeper grip changes remain proposals awaiting a separate go.

- FPV button on the existing driving test; Behind restores the original chase view. Camera reads the existing interpolated pose from a seated offset, with bounded look and the original first-person FOV. It changes no driving state or settings.
- Reset and track changes preserve FPV; reselecting FPV centers head look. Mouse, touch and controller look stay within the mode. Point-focused inspection zoom is suspended in FPV and restored for the external views, keeping the eye fixed to the kart.
- Five Node camera checks pass and run before the racing page build. Desktop/mobile browser checks pass for seated pose, looking/centering, live switches without speed reset, Reset/track persistence and five screen layouts with six view buttons. The current 120 mph normal / 180 mph boost caps and all handling parameters remain unchanged.

**Stop after the verified FPV link. Wait for the owner’s view/speed-feel feedback before implementing any proposed tuning.**

## Mobile driving layout — owner-requested correction

The owner requested more driving space on phones, collapsible track/view options, inward steering buttons with clear separation, and no pinch/zoom in the driving test. This authorizes presentation/input-camera changes only.

- The empty Test videos section is hidden in driving mode. Its control instructions remain available in the compact Controls menu. The stage fills the remaining dynamic viewport, without page scrolling; safe-area insets protect the HUD and pedals.
- On phones, touch devices and narrow windows, the header keeps the title and a Controls arrow. The existing track picker, six view buttons and Reset open in an overlay, without shrinking the stage. Selection, retapping the arrow, outside touch and Escape close the panel. Wide mouse-driven desktops retain the existing header controls.
- Steering buttons move inward on wider displays and have a 12–24 px gap. Left remains Left and Right remains Right; simultaneous steering and pedals still use the shared input module.
- Driving opts out of both camera-distance zoom and point-focused inspection zoom in every view. Drag-to-look remains available. Track/object inspection and other labs retain their existing zoom behavior.
- The owner found the existing **180 mph boost** more enjoyable. Save that as feedback for the next speed/F1-feel discussion, not authorization to tune the handling. Normal/boost caps, acceleration, braking, steering, grip, kart dimensions and all authoritative racing logic are unchanged.

Verification results are recorded in `racing-lab/DRIVING-BROWSER-CHECKS.json`. Stop after delivering the verified mobile driving link; discuss tuning with the owner before changing it.

Validation: full production build and 10 presentation/camera Node checks pass. Driving browser checks pass for all four tracks, keyboard direction, gamepad API regression, phone portrait/landscape simultaneous pedals/steering, all six views, Reset/track persistence, menu keyboard focus/dismissal and blocked wheel/pinch zoom. Measured mobile header is 57 px; stage heights are 511/787/333/967/743 px at the five recorded screen sizes, with 12–24 px steering gaps and zero page errors. Shared Motion Lab controls/zoom and default track-inspection browser regressions also pass. No movement-core, frozen checkpoint or driving-physics source changes.

## Mobile layout correction — supersedes the collapsed header above

The owner rejected the excessive steering inset and clarified the video/header layout. Restore the original visible track picker, six camera buttons and Reset. Reduce header vertical padding/row spacing only; do not narrow its controls. Remove the Controls dropdown. Steering returns close to its original edge, at a modest 24 px inset with a 12 px separation.

Test videos stays in the document below the full first driving screen, reachable by scrolling. Remove the driving-only page-scroll lock. A small bottom-center Test videos link provides both an anchor and a touch-scroll area, since canvas gestures remain reserved for looking. Keep driving zoom disabled. No changes to speed, handling or racing logic; tuning discussion remains pending.

Correction verification: 10 presentation/camera Node checks and the driving browser suite pass. Five screen sizes retain all original header controls at usable touch sizes, a 24 px steering inset and 12 px steering gap. Videos start below the first viewport, the bottom link and an actual touch swipe reach them, the header stays visible while scrolling, and returning to the stage resumes driving. Keyboard, simultaneous portrait/landscape pedals/steering, gamepad API, views/Reset, no-page-zoom and disabled driving-zoom checks pass with zero page errors. The previous no-scroll/dropdown layout is superseded, not an approved future baseline.

## Safari browser bars — Home Screen web app

The owner reports Safari's URL/tab bars repeatedly appearing and asks for a fix. Browser chrome belongs to Safari; a normal tab cannot permanently hide it. Add a scoped standalone Home Screen launch for the existing driving test rather than changing scrolling or its approved layout.

- `racing-lab/manifest.webmanifest`: stable driving-app identity, `display: standalone`, start URL `./?drive=1`, scope `./`, slate theme/background and 192/512 PNG icons. Relative URLs preserve the GitHub project prefix. Apple capable/title/status-bar metadata and a 180 px touch icon support the Home Screen flow. Keep the system status bar's default appearance.
- The racing builder copies the manifest/icons into the published racing directory. No service worker or offline cache is introduced; launching online loads the current published test. No physics, speed, controls or page-layout changes.
- iPhone usage: open the verified driving link in Safari, Share → Add to Home Screen; keep Open as Web App enabled if offered, then launch the new icon. Safari's normal tab still owns its tabs/URL controls. The native Add to Home Screen step must be performed on the user's phone; the website cannot silently install itself or force Safari chrome off.
- Two Node checks validate scoped app identity/start URL and all declared PNG dimensions; they run in the racing build. Browser checks parse the manifest with Chromium's actual manifest API, fetch all installation icons under the project prefix, verify Apple metadata, launch the real start URL, and exercise Gas/brake and video scrolling. Native iOS installation/browser bars cannot be tested in this Linux environment. `npm run test:racing-app` records the browser results in `APP-BROWSER-CHECKS.json`.

Stop after delivering the working link and the short Home Screen instructions. Handling/speed tuning remains pending.

## Steering buttons — small inward adjustment

The owner accepted the Home Screen setup and requested both steering buttons slightly closer to center. Translate only the steering group 12 CSS pixels inward; retain button widths, 12 px button gap, pedal positions, header, video scrolling, installed-app setup and handling. The normal inset becomes 36 px, rather than the previously rejected large centered placement. Update the existing browser layout bounds to check this modest offset. Stop for the owner's feedback after publishing the checked change.

Verification: 12 build-time Node checks and the complete driving browser suite pass with zero page errors. All five layouts measure the new 36 px inset and unchanged 12 px steering gap. Portrait Left + Gas and landscape Right + Gas/cancellation still work; header, camera, video-scroll, keyboard and controller regressions pass.
