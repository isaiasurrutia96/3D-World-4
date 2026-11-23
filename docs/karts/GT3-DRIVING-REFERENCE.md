# GT3 GoKart driving reference

The owner chose **GT option 05**, inspired by the 2026 Porsche 911 GT3 R.
The standalone Driving Test uses the playable GT chassis for both the
first-drive and GT3 tunes. The option 05 artwork is the body design
reference. [Stock body](PARTS-KIT.md#h-models-per-class) ·
[Playable dimensions](../../racing-core/kart/prototypes.ts)

## A. Race references

1. Porsche's 2026 racing car is **4.619 m long and 2.050 m wide** at the
   rear, with a **2.507 m wheelbase**. The factory quotes about **1,265 kg**
   depending on Balance of Performance, a rear-mounted **4.194 L** flat-six
   rated at about **416 kW**, a **9,250 rpm** limit and **six sequential
   gears**. The brake system uses 390 mm front and 370 mm rear discs, race
   ABS and adjustable balance. Porsche also specifies rear-wheel traction
   control, adjustable engine braking and a mechanical limited-slip
   differential. [Porsche technical sheet](https://newsroom.porsche.com/dam/jcr%3A3b5e8287-01fb-481f-9d5c-2add88364f30/250808e_Technical%20Data%20911%20GT3%20R26.pdf)
2. Daytona GTD Pro timing gives a same-race comparison. Speeds come from
   green-flag timing records excluding marked pit laps. Minimum mass
   excludes fuel and driver.

   | 2026 Daytona entry | Minimum mass | Fastest recorded speed | Mean of five fastest |
   | --- | ---: | ---: | ---: |
   | Porsche 911 GT3 R #77 | 1,356 kg | 288.7 km/h | 286.7 km/h |
   | Ferrari 296 GT3 EVO #033 | 1,323 kg | 288.7 km/h | 286.7 km/h |
   | BMW M4 GT3 EVO #1 | 1,350 kg | 292.6 km/h | 289.6 km/h |
   | Ford Mustang GT3 #64 | 1,374 kg | 291.9 km/h | 288.8 km/h |

   At Monza, the Italian GT race recorded **276.9 km/h** for Porsche #20
   and **278.4 km/h** for BMW #77. These readings depend on event rules,
   track layout, setup and traffic. The BMW's **2.917 m** wheelbase and
   Ferrari's **2.660 m** wheelbase also show how different layouts can
   achieve similar straight speeds. [Daytona time cards](https://imsa.results.alkamelcloud.com/Results/26_2026/02_Daytona%20International%20Speedway/01_IMSA%20WeatherTech%20SportsCar%20Championship/202601241340_Race/24_Hour%2024/23_Time%20Cards_Race.CSV) ·
   [Daytona Balance of Performance](https://www.imsa.com/wp-content/uploads/sites/32/2026/01/08/TB-IWSC-26-12-Daytona-ROAR-and-ROLEX-24-BoP-01082026.pdf) ·
   [Monza timing](https://www.acisport.it/public/2026/pdf/CIGT/2026_8291System.String%5B%5D/Gara_05_04_01_99_001_all_0_join.pdf) ·
   [BMW data](https://www.bmw-m.com/en/fastlane/motorsport/race-cars/bmw-m4-gt3-evo.html) ·
   [Ferrari data](https://www.gt-world-challenge-europe.com/news/2378/ferrari-296-gt3-a-v6-for-a-new-sporting-history)
3. Jorge Segers's logged GT3 lap at Nogaro reached **0.84 g acceleration**,
   **1.95 g braking** and **2.37 g in the faster direction of cornering**.
   A logged Sebring GT3 lap shows about **1.65 g** through medium-speed
   corners. Acura reports **2.0–2.5 g** braking for the NSX GT3 Evo at Sebring
   and estimates **4.35 s** to 60 mph for its Mid-Ohio comparison. An older
   public iRacing Lamborghini GT3 trace took **7.38 s** from 100 to 200 km/h
   on corner exit. It serves as a secondary simulator check on rolling
   acceleration. A current Porsche GT3 R pedal and speed trace would help
   refine the fit. [Nogaro data, Table 18.1](https://doi.org/10.4271/R-408) ·
   [Sebring data, Figure 66](https://repositorio.ufsc.br/bitstream/handle/123456789/223061/AVI%20ARIEL%20-%20Multi-Objective%20Optimization%20of%20Suspension%20Kinematics%20%282021%29.pdf?isAllowed=y&sequence=1) ·
   [Acura braking](https://acuranews.com/en-US/releases/release-cab753139a71d6210c0bc3ba040053e8-video-acura-pro-drivers-swap-race-cars-at-sebring-test) ·
   [Acura launch estimate](https://acuranews.com/en-US/releases/release-5f625f09686b4c9f97bf9b9df27ea718-road-car-vs-race-car-acura-pits-nsx-supercar-against-racing-counterpart-the-nsx-gt3-evo) ·
   [Raw simulator trace](https://github.com/JBonifay/motec-file-parser/blob/34edb90bfc0374f500817cdb7151a99f3e9a98b5/sample.ld)

## B. Chassis and modeling choices

1. The first-drive baseline uses the **3.25 × 2.19 m** body and **2.10 m**
   wheelbase. Its tire diameters are **0.67 m front** and **0.73 m rear**.
   This body is 30% shorter and 7% wider than the Porsche reference, with
   a wheelbase 16% shorter. At the same road-wheel angle, the shorter
   wheelbase gives 19% greater low-speed curvature before tire forces
   become limiting.
2. The fixed-step controller already handles slope, steering response,
   contact and shared tire force for longitudinal and lateral demands.
   The GT3 preset uses that controller with speed-dependent dry force
   and power curves plus a rear-driven axle model. A four-wheel
   suspension and slip model would require tire, suspension and aero data
   for this chassis. The current approach can be checked through timed
   speed gates and repeatable corner entries while using the actual axle
   spacing for steering and load transfer. [Axle-load model](https://www.mathworks.com/help/sdl/ref/vehiclebody.html) ·
   [Bosch race ABS reference](https://www.bosch-motorsport.com/technology-and-innovation/product-highlights/abs-m5-kit/)
3. With the same CG height and 1.5 g braking, a 10 cm wheelbase
   extension lowers longitudinal load transfer by **1.3 percentage
   points**. The benefit gets smaller once the tires set the turning
   radius. Sweeping the prototype's front tires through its steering
   range showed that an axle-only extension also intersects the existing
   bumper and fender. Moving the front bodywork along with the axle
   kept the tires clear in the sweep. It would require fitting new
   bodywork and mounts. In controlled runs across all four tracks,
   extending the wheelbase by 10 or 20 cm changed a lap by less than
   **0.02 s** with speeds reaching 174–179 km/h. A 144 km/h straight
   stop covered about **57.3 m** in all three cases. The test uses
   the **2.10 m** wheelbase for both tunes.

## C. GT3 preset and verification

1. Pick **GT3** or **First-drive GT** in the standalone Driving Test's Kart
   menu. Both start a fresh run on the selected track. The first-drive
   profile keeps fingerprint `kart-v1-2cb884a348f1e733`. The GT3
   automatic shift schedule uses a **9,050 rpm** estimated shift point
   with hysteresis, a brief **0.06 s** torque reduction and the published
   **9,250 rpm** limit. Rear tire rolling radius determines wheel rpm.
   Approximate upshift road speeds on this chassis are **105, 142, 179,
   215 and 250 km/h**. The prototype speed cap is **286 km/h**. With
   a smaller **0.30 m** rear radius in a separate test, sixth-gear
   redline limits the kart to **242.8 km/h**. The selected prototype
   uses the **0.365 m** rear radius.
   [Open GT3](https://isaiasurrutia96.github.io/3D-World-4/racing-lab/?drive=1&kart=gt&gtTune=gt3&track=original)
2. Axle transfer uses an estimated **43:57** static weight balance, a
   **0.40 m** CG height proxy from the seat position, and **58%** front
   brake bias. The speed-dependent force curves include an estimate of
   fixed aero grip. Brake pressure reduction and rear torque control use
   available axle force, with a shared braking and cornering limit. A
   wheel-by-wheel ABS calibration would need measured slip and pressure.
   The HUD shows gear, RPM and aid activity. Use `debug=1` to inspect
   brake reduction, torque reduction and front axle load.
   [GT3 profile](../../racing-core/kart/gt3-profile.ts) ·
   [GT3 systems](../../racing-core/kart/gt3-systems.ts)
3. Dry, level-road checks with the same starting conditions give these
   values. Braking times include the buildup of pedal force.

   | Benchmark | First-drive GT | GT3 |
   | --- | ---: | ---: |
   | Standing 0–60 mph | 3.25 s | **3.74 s** |
   | Standing 0–180 km/h | 8.30 s | **9.10 s** |
   | Rolling 100–200 km/h, continuous throttle | Above normal speed cap | **7.29 s** |
   | Full brake 160→60 km/h | 2.14 s / 64.4 m | **1.92 s / 58.3 m** |
   | Full brake 250→100 km/h | Above normal speed cap | **2.45 s / 117.1 m / 2.10 g peak** |
   | Speed one second after lifting at 150 km/h | 136.2 km/h | **143.4 km/h** |

   The first release delivered **1.65 g at 120 km/h** and **2.25 g at
   240 km/h** in the held-turn check. In a repeatable 175 km/h corner
   entry, easing the brake from early heavy application to light trail
   braking brought lateral
   force from **0.43 to 1.36 g** while staying within the combined tire
   limit. These tests check the prototype against representative class
   behavior. The sampled races, simulator comparison and model estimates
   are listed above. [Calibration checks](../../racing-core/kart/gt3-profile.test.mjs)

## D. Handling refinement

1. The first release filtered steering input and chassis rotation in
   series. It took longer to turn in than First-drive GT at medium
   speeds. Shortening both responses and the steering release brought
   the front in sooner. In the Original Circuit fixture, both runs
   entered the first tightening corner at **105 km/h** and reached
   **99.9 km/h** after a one-second steering hold. Initial lateral force
   rose from **0.52 to 0.79 g** at 0.2 s, and the final distance from
   the centerline fell from **3.59 to 2.78 m**. Both runs finished
   the maneuver on the road. [Track regression](../../racing-core/testing/prototypes.test.mjs) ·
   [Transient test method reference](https://www.iso.org/standard/54144.html)
2. The revised dry grip curve delivered **1.74 g** at 120 km/h in the
   held-turn check, up from **1.65 g**. The 240 km/h target stays at
   **2.25 g**. The mid-speed increase is a tuning choice for this
   chassis. The fixed-step tire limit still shares grip between braking,
   cornering and rear drive. The timing, launch, braking distance and
   top-speed checks in section C still agree at their stated precision.
   [Steering and grip checks](../../racing-core/kart/gt3-profile.test.mjs)
3. While moving forward, GT3's phone **Brake / Reverse** button now
   starts the service-brake ramp as soon as it is pressed. At rest the
   held button selects reverse. From the same **171.4 km/h** gas-to-brake
   transition, the phone control reached 1 g braking in **0.075 s** and
   slowed to 120 km/h in **38.1 m**. The first release took **0.217 s**
   and **45.3 m**. Explicit braking takes precedence over a simultaneous
   direction command. [Pedal and reversal checks](../../racing-core/kart/gt3-systems.test.mjs)

## E. Chassis-scaled steering response

1. The 2026 Porsche 911 GT3 R has a **2.507 m** wheelbase. The GT
   GoKart's **2.10 m** wheelbase gives a **0.838** ratio. The controller
   already uses the actual wheelbase to calculate the path from road-wheel
   angle. At the same 29° lock, that geometry gives **3.79 m** and **4.52 m**
   low-speed radii respectively. At race speeds the shared tire-force
   limit governs the available curvature. [Porsche technical sheet](https://newsroom.porsche.com/dam/jcr%3A3b5e8287-01fb-481f-9d5c-2add88364f30/250808e_Technical%20Data%20911%20GT3%20R26.pdf)
2. The GT3 chassis response uses wheelbase divided by reference wheelbase
   to scale transient time at equal speed. The **0.135 s** yaw setting
   yields **0.113 s** on the playable kart. Its angular acceleration limit
   scales inversely so it can make the same rate change in scaled time.
   The earlier game parameter is the calibration starting point. The
   published Porsche data give geometry and hardware, and measuring
   physical yaw response also requires tire data and rotational inertia.
   The steering release was set to **0.11 s** based on control tests.
   [Dimensionless vehicle model, equations 3–5](https://www.me.psu.edu/toboldlygo/Publications/Conferences/2000_Brennan_RobustStabilizationOfAGeneralizedVehicleANondimensionalApproach.pdf) ·
   [Chassis code](../../racing-core/kart/dynamics.ts)
3. In Original Circuit's S-bend, the kart's direction of travel began
   turning the opposite way **0.233 s** after the steering switch, down
   from **0.292 s**. Both entries were **75 km/h** and both exited at
   **70.58 km/h**. The distance from the centerline after the maneuver
   dropped from **2.82 to 2.32 m**. At 120 km/h in a flat-road pulse test,
   lateral acceleration after steering release fell below **0.05 g**
   in **0.392 s**, down from **0.492 s**. The held-turn check measured
   **1.74 g**.
   [S-bend regression](../../racing-core/testing/prototypes.test.mjs) ·
   [Two-wheelbase grip and response check](../../racing-core/kart/gt3-profile.test.mjs)
