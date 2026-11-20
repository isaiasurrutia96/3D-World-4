# More arcade handling: measured checks

11 PASS, 0 FAIL.

## Only cornering and steering response change from the exact approved Fast setup

Rule: Seven deliberate handling changes; all speed/pedal/braking/boost/surface settings identical; both reference hashes unchanged.

Script: `"Compare every physical setting and pin previous Fast and F1 fingerprints."`

Measured: `{"changed":["cornering","slipResponseSeconds","steeringReleaseSeconds","steeringResponse","steeringRiseSeconds","yawAcceleration","yawResponseSeconds"],"previousFingerprint":"kart-v1-a86c3ae8d1936d52","currentFingerprint":"kart-v1-c0934f4555677c0e","f1Fingerprint":"kart-v1-b2666c008706e548"}`

**PASS**

## Both live speed profiles retain their specified grip without altering speed caps or low-speed lock

Rule: Balanced has twice the reference lateral budget; Fast has 2.12 times after its 6% tire upgrade. Unchanged30degree low-speed lock; wheel limits remain finite and continuous.

Script: `"Sweep0–120m/s in.01m/s increments; compare Fast/Balanced with the prior profile."`

Measured: `{"speedProbes":24002,"maximumGripError":2.842170943040401e-14,"maximumWheelStepRadians":0.0004244744428124614}`

**PASS**

## 180mph turns are half as wide at the same actual speed

Rule: New radius≤52% of previous; speed differs by<.1mph; actual velocity-derived radius and every physics field agree across all FPS.

Script: `{"fps":[30,60,120,144],"script":"Start180mph; Gas+full Right for1.5s; Boost held only for220mph. Measure travel curvature from world velocity changes during the final.5s."}`

Measured: `{"results":[{"profile":"fast-before-grip","radius":132.14983184402425,"minimumMPH":179.9999999793691},{"profile":"fast","radius":62.333979128634006,"minimumMPH":179.9999999885233}],"radiusRatio":0.47169170220516415}`

**PASS**

## 220mph turns are half as wide at the same actual speed

Rule: New radius≤52% of previous; speed differs by<.1mph; actual velocity-derived radius and every physics field agree across all FPS.

Script: `{"fps":[30,60,120,144],"script":"Start220mph; Gas+full Right for1.5s; Boost held only for220mph. Measure travel curvature from world velocity changes during the final.5s."}`

Measured: `{"results":[{"profile":"fast-before-grip","radius":197.41433042610424,"minimumMPH":219.99999998123988},{"profile":"fast","radius":93.11488520643546,"minimumMPH":219.99999999500474}],"radiusRatio":0.4716723705186643}`

**PASS**

## High-speed button steering reaches full input sooner and still releases smoothly

Rule: Full input in≤.18s+one120Hz tick, centered in≤.14s+one tick; both faster than the pre-grip setup; no discontinuous input jumps.

Script: `{"fps":[30,60,120,144],"script":"At180mph hold Gas+Right.4s and then Gas straight.3s; observe the exact first full/zero physics tick."}`

Measured: `[{"profile":"fast-before-grip","fullSeconds":0.25,"releaseSeconds":0.18333333333333335,"maxNormalizedStep":0.04629629629629631},{"profile":"fast","fullSeconds":0.18333333333333332,"releaseSeconds":0.1416666666666666,"maxNormalizedStep":0.059523809523809534}]`

**PASS**

## A quick lane-change command responds more while preserving finite momentum

Rule: More lateral movement than before; body yaw and travel change continuously; no single-tick yaw jump>.03rad.

Script: `{"fps":[30,60,120,144],"script":"Start180mph; hold Gas+Right for.35s, then Gas straight for.65s."}`

Measured: `[{"profile":"fast-before-grip","lateralDistance":9.49853493596076,"yaw":-0.19120098217740578,"maximumYawStep":0.004257469101735856},{"profile":"fast","lateralDistance":22.17710297081609,"yaw":-0.4256210652416649,"maximumYawStep":0.00990188399195796}]`

**PASS**

## Steering release and repeated reversals settle without snapping or a persistent slide

Rule: Mirrored paths; no yaw discontinuity>.03rad; final yaw rate<.001rad/s and lateral speed<.01m/s; exact four-rate states.

Script: `{"fps":[30,60,120,144],"script":"Start180mph; Gas held; alternate full steering each.5s for4s, then straight2s; mirror the entire input."}`

Measured: `{"maximumYawStep":0.0105627278668603,"finalYawRate":-5.336509253134912e-9,"finalLateralSpeed":-6.318076302136433e-7}`

**PASS**

## Straight acceleration, lift-off, brake, reverse and boost traces are unchanged

Rule: Every position/speed/pedal/boost/contact value is identical; only steering-limit metadata and profile identity differ.

Script: `{"fps":[30,60,120,144],"script":"16s: Gas6s, Gas+Boost2s, lift1s, brake1s, Reverse3s, brake1s, Gas2s; compare every authoritative tick with previous Fast."}`

Measured: `{"rates":[30,60,120,144],"comparedTicks":7680,"maximumDifference":0}`

**PASS**

## Releasing the brake smoothly frees more tire grip for turning

Rule: After.1s, released brake has at least10% more measured lateral force and grip share; brake fades to0, no acceleration/boost or yaw snap, shared ellipse still≤1.

Script: `{"fps":[30,60,120,144],"script":"Start60m/s; hold full brake+Right for.6s. Compare continuing the brake with releasing it while Right stays held; no Gas."}`

Measured: `[{"release":false,"lateral":51.2662357094864,"gripShare":0.8582248420738553,"brake":1,"speed":46.06408010903836,"maximumEllipse":1.00000000000009},{"release":true,"lateral":59.05460205686124,"gripShare":0.9810239195652161,"brake":0,"speed":46.747641888236956,"maximumEllipse":1.0000000000000855}]`

**PASS**

## Releasing the phone Brake/Reverse button also restores turning grip

Rule: At.7s the released pedal is centered, forward motion remains, and velocity-derived lateral force is at least10% greater than holding the brake; exact rate states.

Script: `{"fps":[30,60,120,144],"script":"Use the actual driving input adapter: start60m/s, hold phone Right+Brake/Reverse for.6s, then release only Brake/Reverse; compare keeping it held."}`

Measured: `[{"release":false,"lateral":51.71207829809165,"normalizedPedal":-1,"forwardSpeed":46.45933601363393},{"release":true,"lateral":59.52328269578975,"normalizedPedal":0,"forwardSpeed":47.104017163315035}]`

**PASS**

## Releasing Gas before a turn progressively tightens the real travel path

Rule: Lift reaches full by.25s without yaw/speed snaps; at1.5s into the turn the released-Gas radius is at least15% tighter than holding Gas; new lifted radius≤55% of the previous lifted radius; no boost and exact FPS states.

Script: `{"fps":[30,60,120,144],"script":"Start180mph, Gas straight1s; then hold Right2s. Compare keeping Gas held with releasing it before entering the turn, for previous and stronger grip."}`

Measured: `[{"profile":"fast-before-grip","release":false,"radius":132.14225052408014,"mph":179.99999999554734,"throttle":1,"lift":0,"maximumYawStep":0.005074514457923174,"maximumRiseAfterLift":0},{"profile":"fast-before-grip","release":true,"radius":94.84104970335174,"mph":129.8270448461906,"throttle":0,"lift":1,"maximumYawStep":0.005433279704340821,"maximumRiseAfterLift":0},{"profile":"fast","release":false,"radius":62.33760944861145,"mph":179.99999999999994,"throttle":1,"lift":0,"maximumYawStep":0.010757852701914317,"maximumRiseAfterLift":0},{"profile":"fast","release":true,"radius":45.26003660026771,"mph":130.27544253414536,"throttle":0,"lift":1,"maximumYawStep":0.011626640652208642,"maximumRiseAfterLift":0}]`

**PASS**
