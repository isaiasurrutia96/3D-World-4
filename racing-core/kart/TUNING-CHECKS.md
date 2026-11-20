# Driving tuning: measured checks

28 PASS, 0 FAIL. Numeric checks establish the scripted behavior; subjective feel still needs the owner’s test.

## The reference acceleration curve reaches the three supplied milestones

Rule: 62mph in2.6±.15s;124mph in5.2±.15s;186mph in10.5±.2s; exact same results at every FPS.

Scripted input: `{"fps":[30,60,120,144],"script":"Full throttle from rest for12s on flat dry ground; sample every120Hz tick."}`

Measured: `[{"fps":30,"times":{"62":2.6416666666666666,"124":5.208333333333333,"186":10.575}},{"fps":60,"times":{"62":2.6416666666666666,"124":5.208333333333333,"186":10.575}},{"fps":120,"times":{"62":2.6416666666666666,"124":5.208333333333333,"186":10.575}},{"fps":144,"times":{"62":2.6416666666666666,"124":5.208333333333333,"186":10.575}}]`

**PASS**

## Normal and boost caps are explicit and the original controller remains available

Rule: Normal caps120/150/180mph and boost caps180/200/220mph; no overshoot; exact per-profile rate agreement.

Scripted input: `{"fps":[30,60,120,144],"script":"Flat straight: full throttle30s, then one granted boost for2s; all comparison profiles."}`

Measured: `[{"id":"original","byRate":[{"fps":30,"normal":120,"boost":180.00000000000003},{"fps":60,"normal":120,"boost":180.00000000000003},{"fps":120,"normal":120,"boost":180.00000000000003},{"fps":144,"normal":120,"boost":180.00000000000003}]},{"id":"balanced","byRate":[{"fps":30,"normal":150,"boost":200},{"fps":60,"normal":150,"boost":200},{"fps":120,"normal":150,"boost":200},{"fps":144,"normal":150,"boost":200}]},{"id":"fast","byRate":[{"fps":30,"normal":180.00000000000003,"boost":220},{"fps":60,"normal":180.00000000000003,"boost":220},{"fps":120,"normal":180.00000000000003,"boost":220},{"fps":144,"normal":180.00000000000003,"boost":220}]}]`

**PASS**

## Arcade braking matches the requested stopping window without stacking lift braking

Rule: 2–3s and120–170m; brake beats Gas/Boost; no powered drag is subtracted twice.

Scripted input: `{"fps":[30,60,120,144],"script":"Start200mph; full independent brake until below60mph."}`

Measured: `[{"fps":30,"seconds":2.433333333333333,"distance":129.14528699624148},{"fps":60,"seconds":2.433333333333333,"distance":129.14528699624148},{"fps":120,"seconds":2.433333333333333,"distance":129.14528699624148},{"fps":144,"seconds":2.433333333333333,"distance":129.14528699624148}]`

**PASS**

## Raw F1 braking limits and the requested distance conflict is measured honestly

Rule: Record actual raw-curve result; arcade profile uses80% service strength to meet owner stopping target.

Scripted input: `{"script":"Reference profile with100% stated brake curve from200mph to60mph."}`

Measured: `{"seconds":1.95,"distance":103.90470907274214,"rawBrakeStrength":1,"arcadeBrakeStrength":0.8}`

**PASS**

## Lift-off slowing is smooth, stronger at speed and does not reverse a stopped kart

Rule: Monotonic speed decrease; high speed slows more; lift rises within.24s; no reverse or rest creep; frame rates agree.

Scripted input: `{"fps":[30,60,120,144],"script":"Start30/90/180mph; no pedals for10s; observe every physics tick."}`

Measured: `[{"mph":0,"quarterSpeed":0,"peakDecel":0,"endSpeed":0},{"mph":30,"quarterSpeed":13.062153738340907,"peakDecel":2.2677319568066423,"endSpeed":1.625224991416361},{"mph":90,"quarterSpeed":38.80655431084884,"peakDecel":9.624189349810024,"endSpeed":6.0598682937518635},{"mph":180,"quarterSpeed":77.22287461729269,"peakDecel":21.546263441674114,"endSpeed":9.37212053551875}]`

**PASS**

## Natural coasting is configurable separately from lift assistance

Rule: First-tick deceleration=.3+.0004*40²=.94m/s²; exact FPS agreement; no hidden aerodynamic subtraction.

Scripted input: `{"fps":[30,60,120,144],"script":"Disable lift and powered jerk; start40m/s with no pedals for1s."}`

Measured: `{"firstDeceleration":0.94,"finalSpeed":39.06705725201202}`

**PASS**

## Pedals and steering retain real analog strength

Rule: Larger inputs produce larger acceleration/braking; no digital threshold in the physics; clamp inputs safely.

Scripted input: `{"fps":[30,60,120,144],"script":"Use25%,50%,100% throttle for1s; independent analog braking from40m/s."}`

Measured: `[{"input":0.25,"speed":2.433313891499132,"brakeSpeed":35.14475887813217},{"input":0.5,"speed":5.063371897171853,"brakeSpeed":30.86252244328065},{"input":1,"speed":10.013749020135672,"brakeSpeed":24.104685361555816}]`

**PASS**

## Steering builds and recentres within the configured times without rotating at rest

Rule: Full normalized wheel input at.25s; zero after.18s; stationary yaw stays fixed; moving yaw changes gradually.

Scripted input: `{"fps":[30,60,120,144],"script":"At rest steer fully for.25s then release for.2s. Separately start10m/s and steer for one tick."}`

Measured: `[{"fps":30,"firstYaw":-0.0000795795486094896},{"fps":60,"firstYaw":-0.0000795795486094896},{"fps":120,"firstYaw":-0.0000795795486094896},{"fps":144,"firstYaw":-0.0000795795486094896}]`

**PASS**

## Left/right motion is mirrored and response changes through forces

Rule: Equal speed; mirrored X/yaw; independent travel direction; no instant yaw match or numeric oscillation.

Scripted input: `{"fps":[30,60,120,144],"script":"At30m/s drive±.35 steering for3s, then countersteer for1s."}`

Measured: `{"x":-100.37154772073791,"yaw":-0.9701071984761472,"lateralSpeed":0.08139626547852785}`

**PASS**

## Known-radius demands use v²/r rather than a per-corner fixed speed

Rule: For feasible commanded wheel angles, measured travel curvature yields sideways force within15% of v²/r; same FPS trace.

Scripted input: `{"fps":[30,60,120,144],"script":"Circles15/50/100/150/200m at30/65/110/160/180mph. Maintain target speed with proportional throttle; observe final3s of8s."}`

Measured: `[{"radius":15,"mph":30,"required":11.990685695999998,"measured":12.094123823843526,"maxSpeedError":0.05776904154937412},{"radius":50,"mph":65,"required":16.8868823552,"measured":16.936585178984725,"maxSpeedError":0.04277369085346905},{"radius":100,"mph":110,"required":24.181216153599998,"measured":24.19097196478539,"maxSpeedError":0.009970244671016815},{"radius":150,"mph":160,"required":34.10683931306666,"measured":33.98327159835158,"maxSpeedError":0.12961600660281647},{"radius":200,"mph":180,"required":32.3748513792,"measured":32.245718213604064,"maxSpeedError":0.16058340683181882}]`

**PASS**

## Over-demanded turns slide progressively instead of following a forced circle

Rule: Travel curvature remains grip-limited; slip grows over time; body and travel directions separate; same FPS states.

Scripted input: `{"fps":[30,60,120,144],"script":"At30m/s demand30deg steering with an intentionally uncapped test profile for2s."}`

Measured: `{"maximumSlip":8.260743194328708,"maximumSideAcceleration":40.486027861327585,"slipAngle":-1.3854148991797766}`

**PASS**

## Braking and cornering share the same tire budget

Rule: Applied acceleration ellipse≤1+1e-10 using each tick’s independently recomputed input-speed limits; cannot produce both maxima.

Scripted input: `{"fps":[30,60,120,144],"script":"Start60m/s, brake and steer hard for2s; recompute ellipse independently each tick."}`

Measured: `{"maximumEllipse":1.000000000000018,"maximumBrakeDuringTurn":3.073223125439907}`

**PASS**

## Traction assistance is adjustable separately from the tire limits

Rule: Same tire limits; assistance reduces excess demand/slip; no automatic drift/boost.

Scripted input: `{"fps":[30,60,120,144],"script":"At14m/s hold full throttle/steer for2s, assist0 compared with1."}`

Measured: `[{"assistance":0,"integratedSlip":3.2442319023373383,"endSpeed":34.57220545942063},{"assistance":1,"integratedSlip":0.6570600760952832,"endSpeed":34.48559973690483}]`

**PASS**

## Pure steering cannot create kinetic energy

Rule: Every tick speed² never rises beyond1e-8; exact FPS agreement.

Scripted input: `{"fps":[30,60,120,144],"script":"Disable all coast/lift resistance; start50m/s; alternate steering for20s without Gas."}`

Measured: `{"maximumEnergyGain":4.547473508864641e-13,"endSpeed":49.99593930342197}`

**PASS**

## Reverse is limited and braking cannot turn into unintended reverse

Rule: Reverse reaches5.6m/s cap; brake stops; forward/reverse cross zero safely; no cap violations.

Scripted input: `{"fps":[30,60,120,144],"script":"Reverse from rest5s, independent brake3s, forward5s, reverse request10s."}`

Measured: `{"reverseSpeed":-5.6}`

**PASS**

## Boost release, braking and expiry remain controllable

Rule: Release slows during active timer; brake overrides; held Boost grants once; expiry returns gradually to180mph.

Scripted input: `{"fps":[30,60,120,144],"script":"Boost-only from140mph for.5s, release both pedals.5s, brake1s, then Gas5s. Separately hold Boost10s."}`

Measured: `[{"fps":30,"before":73.54795427534212,"after":68.74678474563275,"maxDrop":0.06666666666666288},{"fps":60,"before":73.54795427534212,"after":68.74678474563275,"maxDrop":0.06666666666666288},{"fps":120,"before":73.54795427534212,"after":68.74678474563275,"maxDrop":0.06666666666666288},{"fps":144,"before":73.54795427534212,"after":68.74678474563275,"maxDrop":0.06666666666666288}]`

**PASS**

## Surface changes are smooth numeric hooks without world/animation coupling

Rule: Multipliers approach supplied values continuously in~.15s; no abrupt speed cap; no unsupported world imports.

Scripted input: `{"fps":[30,60,120,144],"script":"Synthetic surface changes atz=30: grip.65, speed.7,resistance2. Straight and steering runs."}`

Measured: `{"maximumGripStep":0.01891418588263205,"final":{"fingerprint":"kart-v1-9addaf0b5acc2976","throttle":1,"brake":0,"lift":0,"steerInput":0,"yawRate":0,"driveAcceleration":0,"recoveryDeceleration":0,"gripMultiplier":0.6500000000001244,"surfaceSpeedMultiplier":0.7000000000001065,"surfaceResistanceMultiplier":1.999999999999645,"longitudinalLimit":23.94970656407923,"lateralLimit":47.44334610298297,"acceleration":0,"brakingG":0,"lateralG":0,"tireSlip":0,"slipAngle":0,"tireUtilization":0,"steeringLimit":0.03034618834332181}}`

**PASS**

## Airborne controls cannot create tire forces or turn the kart in midair

Rule: Horizontal momentum preserved until landing; no air yaw from tires; shared gravity still acts.

Scripted input: `{"fps":[30,60,120,144],"script":"Starty=100 with30m/s forward and3m/s lateral, unsupported; Gas/Brake/steer/Boost for1s."}`

Measured: `{"speed":30,"lateral":3.0000000000000027,"y":88.9083333333333}`

**PASS**

## All tuned state is immutable, isolated and resettable

Rule: Mutation rejected; reset clears all response/slip/boost/contact timers; caller data and other kart unaffected.

Scripted input: `{"script":"Mutate nested handling; reset after mixed inputs; run custom and standard karts independently."}`

Measured: `{"resetSpeed":0,"resetSlip":0}`

**PASS**

## Failed surface, input or contact adapters roll back a whole frame atomically

Rule: No partial state/clock changes; next valid advance matches a fresh controller exactly.

Scripted input: `{"script":"Throw after first valid tick of a.25s frame; compare state/clock/boost latch with untouched control."}`

Measured: `{"adapters":3,"rollback":"atomic"}`

**PASS**

## Jitter, catch-up and144Hz sub-tick boost pulses use one120Hz clock

Rule: Identical1440 authoritative ticks and all state values; pulse retained exactly once.

Scripted input: `{"script":"Mixed controls12s at30/60/120/144FPS and jitter; queue a2ms boost pulse."}`

Measured: `{"ticks":1440,"jitterFrames":207,"pulseBoostTime":1.9916666666666667}`

**PASS**

## A seeded five-minute stress trace stays finite, bounded and deterministic

Rule: No nonfinite state or tire limit violation; no speed above220mph; all rates produce exactly the same state.

Scripted input: `{"fps":[30,60,120,144],"script":"Seed0x20261120;2400 input changes, every15ticks;5min per rate."}`

Measured: `{"secondsPerRate":300,"ticksPerRate":36000,"maxSpeedMPH":220.00000000000006,"maxSlip":0.3062974316154493}`

**PASS**

## 220mph contacts cannot tunnel through thin rails from either side

Rule: Kart remains on its original side with capsule clearance; exact rate agreement.

Scripted input: `{"fps":[30,60,120,144],"script":"Start±5m facing.1075m-thick wall; full Gas+granted Boost1s."}`

Measured: `[{"side":-1,"minimumClearance":9.999999991266995e-8,"endX":-1.5837500999999998},{"side":1,"minimumClearance":9.999999991266995e-8,"endX":1.5837500999999998}]`

**PASS**

## Tuned pair contacts share one solver without profile contamination

Rule: No crossing/persistent overlap; different profiles remain attached; upper deck does not collide.

Scripted input: `{"fps":[30,60,120,144],"script":"Two karts approach head-on at220mph; one fast, one balanced;1s and a second case8m apart vertically."}`

Measured: `{"contacts":1,"lowerZ":-1.7852223983939695,"upperZ":1.7852223983939695,"separateDeckContacts":0}`

**PASS**

## Driving tests keep all tracks and clean lifecycle with an explicit profile

Rule: One checked kart, stable profile identity, clean clocks; original remains default for existing callers.

Scripted input: `{"fps":[30,60,120,144],"script":"For every track, drive1s, reset, select another track; no race/NPC/avatar construction."}`

Measured: `[{"id":"original","speed":10.013749020135641,"grounded":true},{"id":"skyline","speed":10.013749020135668,"grounded":true},{"id":"suzuka","speed":10.013749020135629,"grounded":true},{"id":"winding","speed":10.013749020135606,"grounded":true}]`

**PASS**

## Mismatched profiles and malformed surface values fail before state can be corrupted

Rule: Reject all invalid boundaries and preserve controller state/clock.

Scripted input: `{"script":"Supply tuned state to legacy or a different profile; query null/array/NaN/negative surface data."}`

Measured: `{"rejected":8}`

**PASS**

## A stopped kart can steer away from a rail under held Gas

Rule: Turns away and resumes movement without tunnelling; same rate state.

Scripted input: `{"fps":[30,60,120,144],"script":"Start touching a wall at90degrees, hold Gas+Right5s."}`

Measured: `{"endX":-3.9884597425769344,"endSpeed":10.650851010536154,"endYaw":-6.6425346488334505}`

**PASS**

## Moving the same scenario elsewhere or rotating the world does not alter handling

Rule: World trajectory rotates/translates correctly; speed, slip and steering agree within1e-8, identically across FPS.

Scripted input: `{"fps":[30,60,120,144],"script":"Mixed pedals/steering8s; compare origin with offset(1000,-700),yaw1.234radians."}`

Measured: `{"maximumWorldTransformError":1.7100329565086351e-12}`

**PASS**
