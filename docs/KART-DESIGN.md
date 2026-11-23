# LetsGo kart design brief

Recorded 23 November 2026.

LetsGo should keep the quick, approachable steering of the 3D World 3 racing game and give each kart believable weight, momentum and grip. Build the karts as one family around the same avatar. Use real vehicle dimensions and behavior as references for the geometry and tuning of each kart. The engineering stages and original arcade behavior are documented in the repo. [Racing rebuild plan](../racing-core/PLAN.md) · [Original handling capture](../racing-core/kart/README.md)

## The three classes

| Class | What it should look like | How it should drive |
| --- | --- | --- |
| **GoKart** | A compact, regular go-kart. Review a slight size increase alongside the earlier layout. | Closest to the original LetsGo arcade feel. Quick to place and easy to recover, with enough momentum to feel the kart's weight under braking and through direction changes. |
| **GT GoKart** | A believable miniature GT race car, using the Porsche 911 race car as the styling reference. A wide, planted stance and distinct fenders over the wheels. | Between original LetsGo and the F1 GoKart. Stable under braking, responsive at turn-in, and able to hold a steady arc at the right speed. The front tires should lose grip progressively when pushed past their limit. |
| **F1 GoKart** | A believable miniature Formula 1 car. Keep the low cockpit, open wheels, long nose and wider rear tires. Fit the avatar into a kart-sized version of those proportions. | Use the fast, planted feel of the F1 prototype the owner liked in the standalone Driving Test as a reference. Aim for quick initial response and a smooth, grippy arc when the player holds a turn at speed. |

### Stock chassis dimensions

Wheelbase measures between the front and rear axle centers. Track measures between the left and right tire centers on an axle. Dimensions below are in millimeters.

| Class and status | Overall L × W × H | Wheelbase | Track F / R | Tires F / R (diameter × width) | Drawing |
| --- | ---: | ---: | ---: | --- | --- |
| F1 GoKart **approved** | **4,315 × 1,500 × 1,170** | **2,650** | **1,200 / 1,150** | **565 × 225 / 570 × 300** | [Dimensioned sketch](karts/f1-kart-dimensioned-sketch.png) |
| GT GoKart **selected** | **3,650 × 1,680 × 1,385** | **1,980** | **1,340 / 1,350** | **535 × 240 / 560 × 245** | [Dimensioned sketch](karts/gt-kart-dimensioned-sketch.png) · [Full-size Porsche comparison](karts/gt-kart-and-real-porsche-comparison.png) |
| GoKart (S Kart) **approved** | **2,450 × 1,450 × 1,050** | **1,490** | **1,120 / 1,230** | **400 × 155 / 420 × 200** | [Dimensioned sketch](karts/s-kart-dimensioned-sketch.png) · [Real Sodi RT10 comparison](karts/s-kart-and-real-kart-comparison.png) |

#### A. GT and S Kart cockpit measurements

Distances are in millimeters. Longitudinal positions start at the tail and increase toward the nose. Heights are measured from the ground. The drawings illustrate the same stock dimensions.

| Measurement | GT GoKart | S Kart |
| --- | ---: | ---: |
| Rear / front axle from tail | 820 / 2,800 | 390 / 1,880 |
| Hip center from tail / above ground | 1,445 / 400 | 880 / 450 |
| Steering wheel center from tail / above ground | 1,815 / 645 | 1,330 / 735 |
| Pedal face from tail / above ground | 2,385 / 280 | 1,840 / 290 |
| Steering grip span | 360 | 360 |
| Cockpit opening / clear footwell width | 1,020 / 650 | 980 / 660 |
| Ground clearance | 75 | 70 |
| Rear wing or spoiler height | 1,260 | 805 |

The approved F1 baseline uses roughly 79% of the real 2026 Mercedes-AMG Formula 1 car's estimated wheelbase and published width. Its rear wing sits at 780 mm, and its roll hoop reaches 1,170 mm around the seated avatar. The model and simulation should read these dimensions from the same vehicle definition so later dimensional changes can use the same driving code. [Mercedes-AMG specifications](https://www.mercedesamgf1.com/f1-w17-2026-technical-specifications)

The selected GT baseline uses the **2026 Porsche 911 GT3 R Evo**. Porsche led the global GT World Challenge manufacturers' standings on 23 November, with the final round still to run. The 911 GT3 R also won the 2026 DTM driver and team titles with Manthey. Chevrolet's Corvette won the IMSA GTD Pro manufacturers' title, and BMW won the driver and team titles. The Porsche combines strong results across different circuits with the styling the owner picked for the GT. [GT World Challenge standings](https://www.gt-world-challenge.com/standings) · [DTM](https://www.dtm.com/en/news/Third-team-title-in-four-years-Manthey-tops-off-milestone-season) · [IMSA](https://www.imsa.com/news/2026/october/05/imsa-honors-all-its-best-at-2026-weathertech-night-of-champions)

The GT keeps about 79% of the Porsche's published length and wheelbase and about 82% of its width. The rounded fenders and rear wing carry over to an open cockpit with a 1,020 mm opening, 650 mm footwell, 1,260 mm rear wing height and 75 mm floor clearance. The selected layout has about 128 mm of longitudinal room from the avatar's toes to the front tire's steering envelope in side view. These checks cover the shown seated pose. Confirm pedal travel, steering sweep and fender clearance on the actual model. [Porsche Motorsport technical data](https://newsroom.porsche.com/dam/jcr%3A3b5e8287-01fb-481f-9d5c-2add88364f30/250808e_Technical%20Data%20911%20GT3%20R26.pdf)

The **S Kart stock size**, approved on 23 November 2026, keeps the selected red wraparound-bumper style. It adds 100 mm in both length and width to the 2,350 × 1,350 mm fit study and adds 30 mm between the axles. Its 1,120 mm front and 1,230 mm rear track are close to the race-kart reference of approximately 1,090 mm and 1,220 mm. The adult Sodi RT10 rental kart provides an overall-size reference, and the adult Sodi Sigma RS3 competition kart publishes a 1,050 mm wheelbase. The S Kart uses more space front-to-back for the seated avatar and the stock tire package. [Sodi RT10](https://www.sodikart.com/en-gb/karts/rental/rt10-42.html) · [Sodi Sigma RS3](https://www.sodikart.com/en-gb/karts/racing/sigma-rs3-2025-39.html) · [Birel ART race kart setup](https://www.birelart.com/public/immagini/download/TECHNICAL_DOCUMENTATION/SETUP%20KART%20OK.pdf)

The 980 mm cockpit opening and 660 mm footwell fit the shown 1,894 mm avatar pose. The seat hoop reaches 1,050 mm and the rear spoiler reaches 805 mm. The static layout check uses the stock tire dimensions, a 25 mm footwell shell on each side, an assumed 32° front wheel angle, and 10 mm between each rear tire's outer edge and the overall width. The narrow comparison places the front tire envelope about 17 mm into the footwell shell. The chosen width leaves about 33 mm of clearance per side. The widest comparison adds more clearance and increases the footprint. These are packaging results. Verify tire and bumper clearance in the actual model and measure the handling in the standalone Driving Test.

| S Kart layout checked | Overall width | Wheelbase | Static front tire to footwell clearance |
| --- | ---: | ---: | ---: |
| Earlier width | 1,350 mm | 1,460 mm | 17 mm overlap |
| **Approved stock** | **1,450 mm** | **1,490 mm** | **33 mm clearance** |
| Wider comparison | 1,530 mm | 1,530 mm | 73 mm clearance |

For the fit study, the owner supplied a **1,865 mm** reference avatar and reported **1,894 mm** for the game avatar. The measurements below are from the reference avatar. Verify the proposed seat, pedal and steering-wheel positions with the intended in-game rig and seated pose.

| Reference avatar measurement | Size |
| --- | --- |
| Hip ball center to top of head / standing floor | 1,001 / 864 mm |
| Hip center to knee / knee to ankle | 366 / 305 mm |
| Foot length × width | 456 × 257 mm |
| Shoulder to elbow / elbow to wrist / wrist to fingertips | 309 / 285 / 327 mm |
| Shoulder ball spacing / hip ball spacing / across thighs | 808 / 505 / 533 mm |

## Real-world wheel references

All three layouts share a 250 mm grid and a rear-axle line. White dots mark tire centers. [Top-down wheel-spacing sheet](karts/wheel-spacing-reference.png)

| Real-world reference | Wheelbase | Front / rear track | Front / rear tire size | Source |
| --- | ---: | ---: | --- | --- |
| Birel ART RY30 adult race kart | 1,045 mm | ≈1,090 / ≈1,220 mm | 10×4.50-5 / 11×7.10-5 nominal sizes | [Chassis specs](https://www.birelart.com/public/karts/modelli/pdf/7/Brochure%20Birelart%20S19.pdf) · [Setup sheet](https://www.birelart.com/public/immagini/download/TECHNICAL_DOCUMENTATION/SETUP%20KART%20OK.pdf) · [LeCont sizes](https://www.lecont.com/product/set-loh-cik-option/) |
| OTK Viper Senior adult rental kart | 1,060 mm | — | — | [OTK specs](https://www.viperkart.com/viper_senior_eng.php) |
| McLaren 720S GT3 Evo | 2,696 mm | ≈1,745 / ≈1,716 mm | 30/68-18 / 31/71-18 on the sheet as the IMSA GT3 reference | [McLaren specs](https://mclaren.pagetiger.com/coeljug/1/page3.htm) · [Michelin IMSA bulletin](https://www.imsa.com/wp-content/uploads/sites/32/2025/10/01/MMTB_IWSC_2026_01_Tire_Specification_Change_GTDPRO_GTD_Revised.pdf) |
| Porsche 911 GT3 RS road car | 2,457 mm | 1,630 / 1,582 mm | 275/35 ZR20 / 335/30 ZR21 | [Porsche specs](https://download.newsroom.porsche.com/dam/jcr%3A1d390f77-93c3-49c0-89c7-634f5f02b26a/S22_3515_en.pdf) |
| Porsche 911 GT3 R race car, model year 2026 | 2,507 mm | — | 30/68-18 / 31/71-18 | [Porsche Motorsport specs](https://newsroom.porsche.com/dam/jcr%3A3b5e8287-01fb-481f-9d5c-2add88364f30/250808e_Technical%20Data%20911%20GT3%20R26.pdf) |
| Mercedes W17, 2026 F1 | ≈3,350 mm | ≈1,520 / ≈1,450 mm | 280 × 705 mm / 375 × 710 mm published width × diameter, 18-inch rims | [Mercedes overhead image](https://www.mercedes-amg.com/en/w17) · [Tire specs](https://www.mercedesamgf1.com/news/what-are-the-tyre-options-for-the-2026-monaco-gp) · [FIA technical rules](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_21_-_2026-10-19.pdf#page=11) |

- The Birel tracks are estimates from its 1,205 mm and 1,400 mm outside wheel spans and the nominal LeCont tire widths. OTK quotes a 1,367 mm maximum overall width for the Viper. [Birel setup sheet](https://www.birelart.com/public/immagini/download/TECHNICAL_DOCUMENTATION/SETUP%20KART%20OK.pdf) · [OTK specs](https://www.viperkart.com/viper_senior_eng.php)
- The W17 wheelbase and tracks are estimates from Mercedes' overhead image scaled by the published tire diameters. The FIA's **3,400 mm** wheelbase is a class limit. The F1 rear tires are roughly **34% wider** than the front tires and only **5 mm taller**, a useful starting proportion for the F1 GoKart. [Mercedes tire specs](https://www.mercedesamgf1.com/news/what-are-the-tyre-options-for-the-2026-monaco-gp) · [FIA technical rules](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_21_-_2026-10-19.pdf#page=11)

### GT3 wheelbase comparison

Five different models ranked by their quickest valid laps across GTD and GTD Pro in 2026 Daytona Rolex 24 qualifying. The classes ran in separate qualifying groups. The ranking is specific to that event. [IMSA official starting grid](https://www.imsa.com/wp-content/uploads/sites/32/2026/01/24/2026_Rolex24_StartingGrid.pdf)

| Model | Lap | Wheelbase | Source |
| --- | ---: | ---: | --- |
| Corvette Z06 GT3.R | 1:45.106 | 2,722 mm | [TF Sport](https://www.tfsport.co.uk/cars-details-corvette-gt3.php) |
| Aston Martin Vantage GT3 Evo | 1:45.113 | 2,761 mm | [SUPER GT](https://supergt.net/en/team_detail/2026-round3-dstation-racing) |
| Mercedes-AMG GT3 | 1:45.187 | 2,625 mm | [SUPER GT](https://supergt.net/en/team_detail/2026-round6-goodsmile-racing-teamukyo) |
| BMW M4 GT3 Evo | 1:45.265 | 2,917 mm | [BMW Motorsport](https://www.bmw-m.com/en/fastlane/motorsport/race-cars/bmw-m4-gt3-evo.html) |
| McLaren 720S GT3 Evo | 1:45.425 | 2,696 mm | [McLaren](https://mclaren.pagetiger.com/coeljug/1/page3.htm) |

## Connect the model to the feel

- Author wheel centers and mounted tire dimensions once per kart so the model and driving code use the same geometry. Wheelbase affects the low-speed arc at a given steering angle. Tire radius feeds wheel rotation and the relationship between wheel torque and drive force. Use front and rear track where the model calculates lateral load transfer.
- Give the assembled kart a mass, front-to-rear balance, center-of-mass height and resistance to rotation. Use those properties to tune how quickly it turns, settles and responds to braking. Assign meaningful physical effects to upgrades where we can validate them. For example, a tire swap can change radius and grip, an engine upgrade can change the power curve, and a functional aero part can change drag or downforce at speed.
- Use real-world tire proportions, acceleration, braking and cornering data to set reference targets. Adapt those targets to our final wheel layout, mass and track speeds. Judge arcade feel against the original LetsGo and the F1 feel against the Driving Test build the owner liked.
- Support keyboard and touch buttons, physical controller sticks, and the phone joystick. Buttons should reach a stable, speed-sensitive steering angle quickly and unwind predictably on release. Sticks should have a quiet center and give proportional control for small corrections or holding part of a turn. Both input styles should drive the same vehicle simulation. [NVIDIA vehicle input reference](https://nvidiagameworks.github.io/PhysX/4.1/documentation/physxapi/files/group__vehicle.html)

## Next review

1. Use the stock geometry baselines above to fit the seated avatar to the seat, wheel and pedals in the actual models. Check leg and arm reach, steering and wheel clearance, and room for alternate parts. Then use those dimensions to build the part-by-part prototypes.
2. Once the prototype is ready, compare the same corner in the **standalone Driving Test** on buttons, a controller stick and the phone joystick. Check quick taps, a steady hold, release, and a left-right transition. Measure turn-in, the path held through the bend, and how the kart runs wide or slips as speed increases. Use those results to tune each class.
