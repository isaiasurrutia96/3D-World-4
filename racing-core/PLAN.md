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

## Steering buttons — second small inward adjustment

The owner's “a little more” requests another 12 CSS pixels inward. Increase only the steering-group translation from 12 to 24 px; the normal inset becomes 48 px. Keep widths, button gap, pedals, app setup and driving unchanged. Existing browser layout checks now verify both steering button centers remain on the left and steering/pedals remain separated even on 320 px phones. Wait for user feedback after the verified link.

Verification: 12 build-time Node checks and the complete driving browser suite pass. All five screen sizes measure the 48 px normal inset and 12 px button gap; the steering and pedal buttons do not overlap. Portrait/landscape touch combinations, input cancellation, keyboard/gamepad, camera and video-scroll regressions pass with zero page errors.

## Mobile controls — larger primary buttons and stacked pedals

The owner requested Brake / Reverse above Gas at its existing size, noticeably larger Left/Right/Gas buttons, and another 12 px steering inset. This is a mobile/touch layout change only.

- Touch/narrow layouts use the original responsive group widths as a sizing reference. Container units keep the calculation relative to the actual control area and its safe-area insets. Each primary button becomes 25% wider and grows from 58 to 74 px high; labels are 16 px. Brake / Reverse keeps its original responsive width and 58 px height, above Gas with a 12 px gap. Both pedals align to the right edge.
- Steering translation grows from 24 to 36 px only for touch/narrow layouts, so its normal inset is now 60 px. Button widths and the 12 px steering gap are independent of this translation. The larger buttons remain separated from the pedals on narrow phones.
- At the shortest narrow landscape size, Boost sits at top center to avoid the taller pedal stack. Other mobile/desktop header, view, app-launch, video-scroll and input behavior stays as before. Wide mouse-driven desktop controls retain their previous geometry and placement. Driving physics/speeds are untouched.
- Independent before/after browser measurements at 320×568, 390×844, 568×320, 667×375, 844×390, 768×1024 and 1280×800 touch viewports confirm 1.25× primary widths, 74 px primary heights, unchanged Brake width/height, exactly +12 px steering translation, stacked pedals and zero button overlap. A separate 1280×800 mouse-driven desktop retains the former 48 px inset and 104×58 px steering button.

Stop after the verified link and wait for the owner's feedback.

Final verification: 12 build-time Node checks and the complete driving browser suite pass with zero page errors. Seven touch layouts, actual portrait/landscape multi-touch steering/pedals, Reverse/cancellation, keyboard/gamepad, views/FPV, video scrolling and disabled driving zoom pass. The before/after sizing comparison above also passes. No handling or simulation source changed.

## Mobile Gas/Boost inset and Boost size

The owner requested Gas and Boost 24 px closer to center and a primary-sized Boost button. Normal touch/narrow layouts now shift Gas left 24 px and add a 24 px inset to the right-anchored Boost. Boost exactly matches Gas width and 74 px height, sharing the stage's responsive sizing variables; steering retains its existing width/height and Brake / Reverse stays in place. Both are unchanged by the sizing-variable refactor in measured before/after comparisons.

Responsive fit exceptions are explicit: at widths up to 360 px Gas uses a 16 px shift so it does not overlap steering; at the existing shortest narrow-landscape layout Boost remains centered at the top. Those are layout guards, not changes to the driving model. Wide mouse-driven desktop controls, steering/brake geometry, input semantics, app launch, page layout and speed/handling are unchanged.

Verification: 12 build Node checks and full driving browser checks pass, including actual simultaneous Gas + enlarged Boost, cancellation, portrait/landscape steering/pedals, FPV/views, scroll-to-videos and gamepad/keyboard paths. Independent before/after geometry checks pass at seven touch sizes; extra 340/355/360/361 px measurements check the narrow guard's boundary. Boost matches Gas dimensions, normal insets are 24 px, other control geometry is preserved, and no controls overlap. Stop after the verified live link for owner feedback.

## Gas only — fast extra 24 px inward

The owner requested another 24 px Gas shift and a fast turnaround. Increase the requested mobile Gas inset from 24 to 48 px; Boost and all other controls stay as before. A single clearance calculation preserves at least 5 px between Gas and steering on narrow portraits instead of allowing overlap. This replaces the prior fixed 16 px narrow exception with the largest safe shift up to 48 px.

Verification: 12 build Node checks pass. Targeted browser geometry checks pass at eight touch sizes; landscape/tablet layouts measure the exact 48 px inset. Narrow portrait fits remain clear (320: 16.7 px, 360: 23.7 px, 390: 28.95 px). Actual simultaneous Left + Gas and touch cancellation pass at the new position. Other simulation tests were not rerun for this CSS-only position adjustment. Stop for feedback after the verified link.

## Original bridge approach — camera blackout fix

The owner reports a dark/blue blackout on the circled climb before the Original Circuit's raised crossing, while confirming the handling feels good. Preserve every driving/track/control setting.

Root cause reproduced: chase X/Z already followed the interpolated kart directly, but target Y had a separate 10/s damped lag. At 180 mph on the uphill grade near x=458–459, z=0–7 (about station 1391–1399 relative to the start), the camera aim point fell below the road. The existing road-obstruction ray then shortened the camera arm to its 0.5 m minimum. Replaying the actual page camera measured only 0.476127 m from the kart; the camera was effectively inside the model/road. The same actual driving section stays grounded at all four display rates, so this is not a missing-road or handling change.

Fix: `motion-lab/src/camera-follow.js` follows the existing interpolated chase pose consistently on X/Y/Z, including the existing target height/inspection offset. Shared `page.js` uses that helper. Ordinary inspection/movement labs retain the previous exponential damping; FPV still uses its seated pose. Camera yaw rate, arm dimensions, obstruction behavior, kart/track geometry, input and all simulation constants are unchanged. No edits to motion-core/ or frozen checkpoints.

Checks:
- Four new Node regressions run in the racing build. The old vertical lag reproduces sub-road aim and 0.5 m arm collapse. The fix keeps 1 m aim clearance and the full 10.59481 m arm through the climb at 30/60/120/144 FPS. A two-second real boost drive stays grounded and produces identical complete physics states with and without camera tracking, also identical across the four rates. Non-chase target damping/offsets match the previous calculation.
- Actual page-camera replay in two mobile orientations at all four rates (eight cases): minimum aim clearance 1 m; minimum camera-to-kart distance 10.965856 m; kart remains framed; rendered pixels, WebGL context and FPV eye checks pass with zero page errors. See `CHASE-CAMERA-CHECKS.json` and `CHASE-CAMERA-BROWSER-CHECKS.json`. The page replay supplies road poses to isolate the camera; the Node drive separately checks real kart support/handling.
- Full production build passes, including all 16 presentation/camera/app Node checks. Additional shared Motion Lab and driving-browser regressions are run before delivery.

Stop after delivering the verified fixed driving link. The owner's positive handling feedback is recorded; no tuning or later racing layer is authorized by this fix.

Final regression verification: full shared Motion Lab browser suite and full driving browser suite pass, including all four tracks, actual device-input paths, FPV, mobile layout, Reset and video scrolling. No page errors. The new camera checks are included in every racing build so this exact bridge/boost regression stays covered.

## 20 November — authorized driving-feel code pass

The owner's final **Go** authorizes a complete code-first tuning pass, with
rigorous checks between internal layers and no further per-layer approval
stops. Preserve the approved original handling as a selectable numeric
baseline. Do not redesign the tracks/kart/controls, add opponents or race
rules, edit motion-core, or change frozen checkpoints. Camera/audio/art
feedback remains a later layer. End with a checked driving test. The owner
subsequently authorized kart resizing if the measurements justify it.

### Foundation and compatibility decisions

- Existing baseline: 167 racing checks pass, including all four frame rates.
- Extend the current 120 Hz controller and contact/support pipeline. One
  controller owns each kart; drawing remains read-only. The original profile
  retains exact pinned-reference results.
- SI units and immutable, validated per-kart profiles. All tunable curves,
  response times, assist strengths and caps live in one data layer. Give each
  profile a stable version/fingerprint for future saved runs/custom karts.
- Keep original kart dimensions, wheelbase and contact shape. The owner's
  800 kg / 5.5 m / 3.6 m-wheelbase figures describe a full F1-sized vehicle;
  applying those would conflict with the accepted kart/model/track scale.
  Use the acceleration, grip and braking performance targets as references;
  do not invent suspension or a second wheel simulation.
- The old 24 m/s² acceleration is substantially stronger than the provided
  F1 low-speed target. Reference-like acceleration will soften takeoff.
  Legacy coast drag is also already strong: about 24.5 m/s² at 180 mph.
  Build smooth, explicit lift-off assistance instead of blindly stacking
  additional drag onto it or double-counting drag under full throttle.
- Initial comparison profiles: **balanced 150/200 mph**, **fast 180/220 mph**,
  and the original 120/180 mph. Fast is the new hands-on default because the
  owner preferred the existing 180 mph drive. A 220 mph reference profile is
  for checking the supplied 0–62/124/186 performance targets.
- Preserve boost as an externally granted two-second command, not inventory.
  Starting nitro charges are unresolved in the game cards; approved mystery
  boxes/items remain future work. No automatic drifting or free boosts.
- Honor approved racing/time-trial/free-roam/custom-kart rules through clean
  input, numeric surface, profile and state boundaries. No fixed global
  terrain numbers or world/animation implementation is part of this pass.
- Preserve E/D/S/F and arrows, Space brake, Shift boost, J/L/I/K camera,
  current phone buttons/layout and the shared controller/camera path.
  Driving-only adapters may retain real analog pedal/steering strength.

### Internal layers and required evidence

1. Configuration/math: validate/copy/freeze profiles, smooth curves and
   steering limits; prove fingerprints and invalid-input rejection.
2. Longitudinal response: acceleration targets, lift-off/brake ramps,
   reverse/no-creep behavior, boost/cap recovery and no double drag.
3. Direction and grip: persistent world momentum, bounded yaw response,
   shared traction ellipse, progressive slip and separate traction assist.
   Prove circles of known radius, release/countersteer and dissipative coast.
4. Contacts/support/integration: repeat rails/pairs at 220 mph, overpass and
   bridge/camera regressions, reset/pause/rollback, profile isolation and
   input/controller mappings. No position integration in presentation.
5. Existing driving-page wiring and browser/device regression, then final
   measured results and working link. No screenshot approvals needed.

Every new numerical check records a plain rule, scripted input, measured
result and PASS/FAIL at 30/60/120/144 FPS where timing is relevant. Repeat
earlier suites after each relevant change; no claim that numbers certify
subjective feel or every possible future race.


### Implemented foundation and measured tuning decisions

- The accepted model measures 2.87 m long by 2.39 m wide, with a 2.03 m
  wheelbase and 0.38 m wheel radius; its existing capsule remains a suitable
  conservative envelope. No resize is needed. Full F1 car dimensions/mass
  remain reference context, not misleading unused physics parameters.
- Configuration, longitudinal response, force-limited direction/grip and
  contact/support integration are implemented in the existing controller.
  Original numerical reference behavior passes unchanged. Tuned nested state
  is immutable and profile-specific; invalid adapters roll back a whole frame.
- The raw supplied brake curve stops 200–60 mph in 1.95 s / 103.90 m, outside
  the requested 2–3 s / 120–170 m window. Arcade service strength is 0.8 and
  measures 2.433 s / 129.15 m; the reference keeps strength 1.0.
- The reference reaches 62/124/186 mph in 2.642/5.208/10.575 s, including
  pedal response. Fast is capped at 180 mph normally and 220 mph under boost;
  Balanced remains available at 150/200 mph. Original stays at 120/180 mph.
- No powered drag is counted twice. Lift-off assistance builds gradually,
  brakes can override boost, and expiry reduces overspeed gradually.
- Pure tire ellipse checks and velocity-derived known-radius turns pass.
  Five-minute seeded tests, 220 mph thin-wall/pair contacts, stopped-wall
  escape, all four complete courses, reset/rollback and profile isolation pass
  at every required display rate. Course completion states/ticks match exactly;
  course fixtures have zero contacts/falls and less than 1.16 m lateral error.
- The driving-only adapter restores analog RT/LT values without changing the
  shared input module. Current keys, all precise phone button placements,
  track/view controls, FPV, zoom lock and scrollable video section are retained.
  The optional diagnostic panel is off by default. No visual redesign.
- API, measured conflicts, tuning and game-card compatibility are documented in
  `kart/TUNING.md`. New headless checks run through the existing CI entry point;
  new pedal/scale checks run in the racing build. Browser reports cover actual
  page wiring and emulated device inputs, not physical controller certification.
- Approval status: this code pass is authorized and internally checked. Driving
  feel still awaits the owner's hands-on test; no tuning is claimed final.
  Race rules, opponents, items, ghosts and avatar animation remain deferred.

### Final verification before delivery

- 206 distinct racing-core checks pass: the 205-check full suite plus the
  added world-rotation/translation invariance check (and its entire 28-check
  tuning suite rerun). Deployment runs the full updated entry point again.
- 25 racing build-time checks pass, including pure analog pedal and measured
  model/collision-scale checks. Full production build exits successfully.
- Approved official-avatar regression: 8 PASS. No changes in motion-core,
  frozen checkpoints, avatar geometry or the shared Motion Lab/input module.
- Full driving browser suite: 12 scenario groups PASS, including all seven
  touch layouts and all current controls. Profile/analog browser checks PASS.
  Bridge camera replay: 16 cases PASS (180/220 mph, four display rates, two
  mobile orientations), zero page/WebGL errors or blank/obstructed renders.
- Reports contain plain rules, scripted inputs, expected and measured numbers,
  and PASS/FAIL. Additional adapter/scale reports: racing-lab/PEDAL-CHECKS.json
  and SCALE-CHECKS.json. Hardware controller/subjective feel review remains
  the owner's test; this pass does not implement a later racing/game layer.


## 20 November — more arcade handling after the owner's drive

The owner says the driving feels great, but turns are too realistic and push
him into railings. **Go** authorizes a focused increase in handling, code first.
Keep the speed/acceleration/braking/lift/boost settings he just liked, all
controls and layout, the accepted kart/track scale, and the existing camera.

- Increase lateral grip to twice the previous curve at every speed. Both the
  tire budget and its matching speed-sensitive wheel angle read this one curve;
  changing steering lock alone would just request more sliding.
- Quicker steering build/release: 0.18/0.14 s (previously 0.25/0.18 s).
  Retain finite body response: yaw response 0.10 s (previously 0.12), bounded
  yaw acceleration 10 rad/s² (previously 8). Slip recovery 0.14 s (was 0.18).
- Keep low-speed wheel lock 30°, analog strength, persistent momentum and the
  shared grip ellipse. No instant yaw changes, snapping, automatic rail
  avoidance, speed reduction, extra boost or second movement system.
- The extra grip is deliberate arcade tuning, not a claim of real F1 forces.
  Fast/Balanced and custom-profile defaults receive it; the original LetsGo
  and F1 reference profiles retain their previous physics. Preserve the exact
  approved Fast profile for measured before/after regressions.
- Check actual turn radius/response, held-turn/slalom scripts, left/right
  symmetry, release/reversal stability, speed/brake/lift equality, tire-budget
  invariants and all course/contact/input regressions at 30/60/120/144 FPS.
  Record plain rules, inputs, measured results and PASS/FAIL before release.


The owner clarified that he means **releasing Gas before the turn**, rather
than releasing the brake. Keep the approved gradual lift-off slowing and prove
its interaction with the stronger grip. A new velocity-derived trajectory
check compares Gas held/released before the same turn on both profiles: lift
should build smoothly, speed should fall, and the real path should tighten
without snapping the heading or granting a speed/grip bonus. The existing
shared tire budget still applies. Earlier independent and phone brake-release
checks remain useful regressions, but are not the owner's requested effect.

### More-handling verification and delivery

- 217 distinct headless racing checks PASS: the 216-check full suite plus the
  added Gas-lift comparison, with all 11 grip/response checks rerun. Deployment
  reruns the complete updated entry point, including the prior regressions.
  Exact 30/60/120/144 FPS states remain equal in the timed cases.
- At actual 180 mph, measured full-steer radius is 132.150→66.073 m; at 220 mph
  it is 197.414→98.702 m. Speed is equal within 0.1 mph (measured differences
  far smaller). These are measured travel paths, not wheel-angle claims.
- Full wheel input: 0.250→0.183 s; release: 0.183→0.142 s on the 120 Hz clock.
  Repeated direction changes remain smooth and settle to negligible yaw/slip.
- Every straight-line trajectory, speed, pedal and boost/contact value matches
  the previous approved Fast trace for 16 s of Gas/lift/brake/reverse/boost.
- Brake release: measured sideways acceleration at 0.7 s is 48.407 m/s² while
  holding versus 55.764 m/s² after releasing; lateral grip share 85.90→98.19%.
  The actual phone Brake/Reverse adapter separately measures 48.827→56.208
  m/s². Both transitions obey the shared ellipse and create no boost or
  powered acceleration; braking/response coefficients themselves are preserved.
- All four full-course fixtures PASS with zero contacts/falls and <1.55 m
  centerline error. Their completion snapshots/ticks match exactly across FPS.
- 25 racing build-time checks PASS. Actual driving browser suite PASS: current
  keys/buttons, seven touch layouts, three emulated controller identities,
  analog triggers, cancellation, FPV, disabled zoom and scrolling videos.
  The rendered-wheel assertion now runs while the key is held, so correct
  faster centering cannot race a post-release assertion.
- Live profile/analog browser checks and all 16 bridge-camera replay cases PASS
  at 180/220 mph in both mobile orientations, zero page/WebGL errors.
- Only handling data, measured checks/reports and this contract/plan change.
  Kart size, track geometry, renderer/camera/control layout, motion-core,
  avatar shapes and frozen checkpoints retain the approved version.
- The owner approved the previous overall feel. This stronger handling is the
  requested next tuning pass and awaits his next drive, not a later race layer.


Gas clarification verification: the before-turn Gas-lift test passes at every
required FPS with exact states. At 1.5 s into the same 180 mph turn, holding Gas
measures a 66.071 m radius; releasing Gas before entry progressively lowers
speed to 130.386 mph and measures a 47.952 m radius. The prior-grip lifted path
is 94.841 m. No positive speed jump, automatic boost or yaw discontinuity is
introduced. The approved lift-off response already provides this behavior;
the stronger lateral curve makes it substantially more capable. This follow-up
adds the explicit proof and corrected request record, not another physics model.

## 20 November — progressive control and intermittent slide/input investigation

The owner authorizes code-first work on a possible stuck Right input or
rightward slide after oversteering, plus gentler low-speed corrections and
stronger turning with a longer hold. He likes a driver-caused slide/spin and
wants that retained. No visual redesign, track/kart changes, new racing layer,
or changes in motion-core or frozen checkpoints.

Investigation before edits:
- 108 flat-ground hard-turn/release combinations (nine speeds, six hold
  durations, Gas held/released) recover without persistent neutral-input yaw;
  worst sideways speed after two seconds is 0.000217 m/s. Large initial slip
  angles also settle. This does not reproduce the owner's exact phone event
  and is not a reason to remove normal sliding or replace the force model.
- The button ledger has two reproduced stale-input paths: a release delivered
  outside the button with capture interrupted is not handled globally; and
  resetting shared actions while its private held-token set survives allows
  an old Right hold to return after a later tap. Stage pause currently resets
  shared input but does not clear that private ledger. These can occur on any
  track; fix the lifecycle boundary and test it independently of physics.
- Build tests before fixes, keep a prior bundle for browser comparisons, then
  implement input ownership/release cleanup and speed-dependent progressive
  steering. Maintain the approved high-speed turning capacity, lift-off,
  brake/boost behavior and physical slide/recovery. Compare timed traces at
  30/60/120/144 FPS; no position/heading snapping or automatic steering expiry.

### Implemented layers and measured results

- Input ownership: a pure browser-independent ledger has one owner per pointer,
  independent keyboard/contact tokens, immutable diagnostics and no hold timer.
  The DOM adapter adds window capture releases, native touch fallback, safe
  capture failure/loss, lifecycle cleanup and reset reconciliation. Stage pause
  clears the ledger explicitly. All 14 new Node input checks PASS, including
  5,000 rapid taps, separate Gas contact, key repeats and valid long holds.
- Browser comparisons against the exact captured pre-fix f40e962 page reproduce
  the interrupted-release and paused/private-hold failures. The new page clears
  Right in those cases while preserving Gas. Native 150-tap stress, real stage
  pause/resume and controller release checks PASS, with zero page errors.
- Progressive steering: optional, deeply immutable profile data builds input
  over 0.50 s at <=12m/s, shapes small demand with exponent1.35, and blends to
  the approved .18s/linear response by45m/s. Full-angle/grip limits are unchanged;
  reference profiles disable the optional group and retain their identities.
- 226/226 complete Node racing checks PASS. Nine new steering/recovery checks
  include exact high-speed trace equality, gentle tap paths, gradual long holds,
  actual hard-turn spin/slip, 432 recovery scenarios and large initial slip.
- At8m/s, a100ms press gives0.754deg eventual heading change (was6.122deg);
  a200ms press gives4.148deg (was24.585deg). Full low-speed input is observed
  at.5s and center at.142s after full release. No milestone can pass as null.
- A hard held turn still creates11.72m/s lateral motion and0.997rad slip, with
  6.254rad body rotation at release. It recovers to negligible sideways/yaw
  motion after release. The force/energy/grip/contact model is not replaced.
- Existing force/radius/course tests calibrate scripted input through the new
  response when requesting a known physical angle; their measured path and
  safety tolerances are not relaxed. All four course fixtures and previous
  contact/braking/boost/rollback checks PASS across the required display rates.
- The full driving browser suite passes: four tracks, current keys/phone buttons,
  analog gamepads, all seven layouts, FPV, disabled driving zoom and video scroll.
  No visual redesign or changes to motion-core, avatar, frozen checkpoints,
  track geometry, kart dimensions or approved high-speed speed/grip settings.
- This fixes reproduced stale-input paths. The exact intermittent phone incident
  remains unconfirmed; ordinary recoverable slides/spins are intentionally kept.


Final delivery verification: full production build passes, followed by 39/39
final racing build-time Node checks (including the 14 input checks). All eight
captured-before/current browser scenarios pass with both HTML SHA256s recorded.
The standard 12-group driving browser suite, profile/analog browser checks and
16 bridge-camera replay cases pass with zero page/WebGL errors. Renderer,
layout, avatar assets, motion-core and frozen source files have no changes.
The final mouse guard also clears a missed primary-button release and prevents
secondary clicks from driving; its explicit Node event-sequence check passes.

Incoming collaboration: preserve and rebase onto Claude's movement changes
through 0685fc5. This racing pass does not modify those motion/hand/skeleton
sources. Rebuild the racing bundle against the updated shared imports and
repeat the captured-before/current input regressions plus the full 12-group
driving browser suite: all PASS, zero page errors. The follow-up checkpoint
contains the rebuilt racing HTML and its updated browser-evidence SHA256.


## 20 November — approved driving checkpoint 1

The owner approved the current driving feel and said “okay save checkpoint.”
Save this exact baseline before considering further tire or handling upgrades.
This checkpoint does not retune physics, controls, cameras, kart dimensions,
tracks or avatar/motion code. Further upgrades remain unstarted.

- Frozen page: https://isaiasurrutia96.github.io/3D-World-4/checkpoints/driving-1/?drive=1&handling=fast
- Approved source: `0e488a2888268c702339e0ca1c054f092507933e`;
  source tag `driving-source-1-2026-11-20`.
- Archive tag: `driving-checkpoint-1-2026-11-20`. The existing checkpoint
  build preserves and verifies all archived files before publishing.
- The viewer is the exact verified published bundle, SHA256
  `3c55cffd851756971534c67068baaba134f9be2f4259da577dca0dc37655dc6f`.
- Profile `fast`, physics fingerprint `kart-v1-025c0e69a91e540a`: 180 mph,
  boost 220 mph, approved progressive steering and input-release fixes.
- Preserved the release's numerical/browser evidence and a JSON snapshot of
  every driving profile. Source hashes plus the source tag allow selective
  racing restoration while preserving Claude's newer movement work.
- Exact frozen viewer smoke checks PASS on desktop and both phone orientations:
  all four tracks, keyboard/native simultaneous touch, separate Right release
  while Gas stays held, Reset, FPV, disabled driving zoom and no overflow.
  Zero page errors; no application asset requests outside the checkpoint.
- Integrity checks PASS, including rejection of a modified settings file in a
  temporary copy. All pre-existing checkpoints remain unchanged.


## 20 November — Home Screen input resume repair

The owner reports that the frozen checkpoint works from the phone app, while
the previously installed Home Screen driving test ignores Gas. This is a
launch/resume/input investigation, not another handling upgrade. Preserve
Driving Checkpoint 1 and all other frozen archives and tags.

- Reproduced against the exact approved frozen HTML: after pausing, pageshow,
  focus or resume without an additional visibilitychange leaves the stage
  disabled; an otherwise valid native Gas touch is then ignored. A foreground
  visibility event with temporarily empty bounds also leaves it disabled.
  These are controlled browser lifecycle reproductions, not a captured trace
  of the owner's actual iOS task switch.
- The shared lab page now has one activity adapter. It checks current viewport
  bounds on foreground/resize, rechecks on the next frame, and recovers before
  the first stage pointer handler. Hidden/offscreen pages remain paused.
  Pagehide/freeze immediately disable input and release the existing holds.
  It does not integrate motion or change any movement/vehicle physics.
- Also corrected the input ledger's signed integer ID boundary: PointerEvent
  IDs are not necessarily positive array indices. A valid negative ID no
  longer throws before an action can activate. This separate conformance gap
  is proven by a Node event-sequence test; it is not confirmed as the cause
  on the owner's phone. Native Linux WebKit uses positive IDs in these checks.
- 47/47 build-time Node checks PASS, including seven activity lifecycle checks
  and 15 ownership/release checks. These run automatically in racing builds.
- Chrome and WebKit each pass 13 lifecycle scenarios, including five captured
  pre-fix failures and their corrected counterparts, plus hide/freeze and
  offscreen guards. Native touches reach Gas after resume. Chrome additionally
  holds Gas until actual speed exceeds 3 m/s. Reports pin both HTML hashes.
- The existing 12-group driving browser suite and the complete universal
  Motion Lab input/layout/video browser suite PASS with zero page errors.
  The latter initially needed its existing video fixtures copied into dist;
  it passes once the normal public assets are served.
- Source in motion-core, avatar geometry, racing-core physics/profile settings,
  tracks, kart dimensions, controls/layout, and checkpoint contents unchanged.
  Actual installed iOS Home Screen launch/task switching still needs the owner
  to check after completely closing and reopening the updated live app.


## 20 November — modest tire and handling upgrade

Owner request: “upgrade” the tire and handling, “but not so much.” Implement
one small Fast-profile tune on the approved driving system. Subjective feel
approval remains pending the owner's test; Driving Checkpoint 1 stays frozen.

Configuration layer:
- Only Fast changes: multiply every existing cornering-curve value by 1.06,
  and reduce lateral settling response from .140 s to .135 s. Steering input
  shaping/rise/release, wheel lock, yaw response, traction assistance, surfaces,
  engine/braking/lift-off/boost curves, dimensions and fixed timestep unchanged.
- Original, Balanced and the F1 reference retain their exact archived data and
  fingerprints. Custom-profile defaults retain the approved base configuration.
  This tune is an explicit, validated Fast override, not a global multiplier.
- Physics identity changes from `kart-v1-025c0e69a91e540a` to
  `kart-v1-c0934f4555677c0e`. The immutable checkpoint's PROFILES.json is the
  numerical control, reconstructed through the normal profile validator.

Measured logic layer:
- Added five automatic upgrade checks and included them in the core suite, so
  deployment reruns them. Rules include scripted input, expected behavior,
  measured values and PASS/FAIL. All use the existing 1/120 s simulation.
- 231/231 full core checks PASS. New turning/settling/straight comparisons agree
  exactly at 30, 60, 120 and 144 FPS. Curve sweep: 14,001 speed samples, exactly
  6% extra lateral budget within floating-point tolerance.
- Starting at 90/130/180/220 mph, matched full-input tests measure turn radii
  about 5.66–5.68% smaller, with less than .024 mph difference in end speed.
  At 180 mph, radius changes from 66.073 m to 62.334 m; at 220 mph, 98.702 m
  to 93.115 m. These are measured paths, not a new fixed corner-speed rule.
- A 4 m/s sideways disturbance at 20 m/s forward settles below .05 m/s in
  .5667 s instead of .5833 s, without a speed gain, yaw snap or forced steering.
- 11,536 compared straight-line states have zero physical difference across
  acceleration, boost, brake, lift-off and reverse phases. Caps stay 180/220 mph.
- Existing shared-grip, surface, contact, all-four-course, seeded stress and
  analog/mirrored-input checks PASS. A hard turn can still slide/spin naturally;
  all 432 release/recovery cases PASS with no retained steering.
- Historical grip tests now distinguish Balanced's 2x reference budget from
  Fast's 2.12x budget. The progressive-steering equality check compares matched
  tire packages, isolating shaping; its exact-state requirement is unchanged.

Playable integration layer:
- 47/47 existing build checks, strict TypeScript, all checkpoint integrity
  checks, the full 12-group driving browser suite and tuning/analog browser
  suite PASS. No visuals, layout, controls, camera or movement code changed.
- Chromium and WebKit each pass 13 captured-before/current Home Screen
  lifecycle cases with zero page errors. Rapid-touch/input-release regressions
  also PASS. The Home Screen resume repair remains present.
- Keep this as a small tunable profile change. Any further handling increase
  waits for owner feedback; no new frozen checkpoint is created in this pass.
