# More arcade handling: measured checks

10 PASS, 0 FAIL.

## Only cornering and steering response change from the exact approved Fast setup

Rule: Six deliberate handling changes; all speed/pedal/braking/boost/surface settings identical; both reference hashes unchanged.

Script: `"Compare every physical setting and pin previous Fast and F1 fingerprints."`

Measured: `{"changed":["cornering","slipResponseSeconds","steeringReleaseSeconds","steeringRiseSeconds","yawAcceleration","yawResponseSeconds"],"previousFingerprint":"kart-v1-a86c3ae8d1936d52","currentFingerprint":"kart-v1-9addaf0b5acc2976","f1Fingerprint":"kart-v1-b2666c008706e548"}`

**PASS**

## Both live speed profiles get stronger grip without altering speed caps or low-speed lock

Rule: Exactly twice lateral budget, unchanged30degree low-speed lock; wheel limits remain finite and continuous.

Script: `"Sweep0–120m/s in.01m/s increments; compare Fast/Balanced with the prior profile."`

Measured: `{"speedProbes":24002,"maximumGripError":0,"maximumWheelStepRadians":0.0004244744428124614}`

**PASS**

## 180mph turns are half as wide at the same actual speed

Rule: New radius≤52% of previous; speed differs by<.1mph; actual velocity-derived radius and every physics field agree across all FPS.

Script: `{"fps":[30,60,120,144],"script":"Start180mph; Gas+full Right for1.5s; Boost held only for220mph. Measure travel curvature from world velocity changes during the final.5s."}`

Measured: `{"results":[{"profile":"fast-before-grip","radius":132.14983184402425,"minimumMPH":179.9999999793691},{"profile":"fast","radius":66.07323161877429,"minimumMPH":179.9999999921732}],"radiusRatio":0.4999872545941653}`

**PASS**

## 220mph turns are half as wide at the same actual speed

Rule: New radius≤52% of previous; speed differs by<.1mph; actual velocity-derived radius and every physics field agree across all FPS.

Script: `{"fps":[30,60,120,144],"script":"Start220mph; Gas+full Right for1.5s; Boost held only for220mph. Measure travel curvature from world velocity changes during the final.5s."}`

Measured: `{"results":[{"profile":"fast-before-grip","radius":197.41433042610424,"minimumMPH":219.99999998123988},{"profile":"fast","radius":98.7021975707509,"minimumMPH":219.99999999197055}],"radiusRatio":0.4999748364655671}`

**PASS**

## Button steering reaches full input sooner and still releases smoothly

Rule: Full input in≤.18s+one120Hz tick, centered in≤.14s+one tick; both faster than before; no stationary yaw or discontinuous input jumps.

Script: `{"fps":[30,60,120,144],"script":"At rest hold Right.4s and then release.3s; observe the exact first full/zero physics tick."}`

Measured: `[{"profile":"fast-before-grip","fullSeconds":0.25,"releaseSeconds":0.18333333333333335,"maxNormalizedStep":0.04629629629629631},{"profile":"fast","fullSeconds":0.18333333333333332,"releaseSeconds":0.1416666666666666,"maxNormalizedStep":0.059523809523809534}]`

**PASS**

## A quick lane-change command responds more while preserving finite momentum

Rule: More lateral movement than before; body yaw and travel change continuously; no single-tick yaw jump>.03rad.

Script: `{"fps":[30,60,120,144],"script":"Start180mph; hold Gas+Right for.35s, then Gas straight for.65s."}`

Measured: `[{"profile":"fast-before-grip","lateralDistance":9.49853493596076,"yaw":-0.19120098217740578,"maximumYawStep":0.004257469101735856},{"profile":"fast","lateralDistance":20.979096169111806,"yaw":-0.4015333059442185,"maximumYawStep":0.009341421447215614}]`

**PASS**

## Steering release and repeated reversals settle without snapping or a persistent slide

Rule: Mirrored paths; no yaw discontinuity>.03rad; final yaw rate<.001rad/s and lateral speed<.01m/s; exact four-rate states.

Script: `{"fps":[30,60,120,144],"script":"Start180mph; Gas held; alternate full steering each.5s for4s, then straight2s; mirror the entire input."}`

Measured: `{"maximumYawStep":0.009964851293227439,"finalYawRate":-5.034514827764363e-9,"finalLateralSpeed":-9.088229795395364e-7}`

**PASS**

## Straight acceleration, lift-off, brake, reverse and boost traces are unchanged

Rule: Every position/speed/pedal/boost/contact value is identical; only steering-limit metadata and profile identity differ.

Script: `{"fps":[30,60,120,144],"script":"16s: Gas6s, Gas+Boost2s, lift1s, brake1s, Reverse3s, brake1s, Gas2s; compare every authoritative tick with previous Fast."}`

Measured: `{"rates":[30,60,120,144],"comparedTicks":7680,"maximumDifference":0}`

**PASS**

## Releasing the brake smoothly frees more tire grip for turning

Rule: After.1s, released brake has at least10% more measured lateral force and grip share; brake fades to0, no acceleration/boost or yaw snap, shared ellipse still≤1.

Script: `{"fps":[30,60,120,144],"script":"Start60m/s; hold full brake+Right for.6s. Compare continuing the brake with releasing it while Right stays held; no Gas."}`

Measured: `[{"release":false,"lateral":48.40688909919893,"gripShare":0.8590290361709035,"brake":1,"speed":46.05878868927662,"maximumEllipse":1.00000000000009},{"release":true,"lateral":55.76402381727656,"gripShare":0.9819258464841101,"brake":0,"speed":46.749843246091494,"maximumEllipse":1.00000000000009}]`

**PASS**

## Releasing the phone Brake/Reverse button also restores turning grip

Rule: At.7s the released pedal is centered, forward motion remains, and velocity-derived lateral force is at least10% greater than holding the brake; exact rate states.

Script: `{"fps":[30,60,120,144],"script":"Use the actual driving input adapter: start60m/s, hold phone Right+Brake/Reverse for.6s, then release only Brake/Reverse; compare keeping it held."}`

Measured: `[{"release":false,"lateral":48.82733061420931,"normalizedPedal":-1,"forwardSpeed":46.471551181162184},{"release":true,"lateral":56.2081840533114,"normalizedPedal":0,"forwardSpeed":47.118884924894196}]`

**PASS**
