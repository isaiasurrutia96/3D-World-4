# Appendix A4: Movement plan double-check
Raw research data, generated on 24 November 2026 from the multi-agent runs. Every finding here passed an independent skeptic unless marked otherwise. Paths marked "(scratch folder, not saved)" were temporary test files that no longer exist. Plain-English summaries and decisions live in the numbered files one folder up; this appendix is for checking details.

## Research: industry
**Summary:** Overall, the approved "body foundation first" plan is close to how proven games make movement that adapts to the situation. Ubisoft's IK Rig, Overgrowth's few-key-poses method and Valve's Half-Life: Alyx walkers all run simple rules on top of a solid body and aim hands and feet at targets. Nothing found argues for throwing the plan away. It needs six changes, and the first two matter most.

(1) Add a "where am I going" layer at the bottom of the Foundation. The game's movement rules are deterministic, so the body can know its exact future path. I tested this on the repo's own controller: the 1-second prediction was exact, it cost about 33 microseconds on this server, and when he lets go at full run it knows he will stop 1.98 m ahead in 0.46 s. Real people work this way too: the head turns toward a new direction about 0.2 s before the path changes. This one input is what lets the body anticipate turns, stops and landings, instead of reacting late.

(2) Treat balance as something you keep by stepping, not by staying still over your feet. Research on human walking and on simulated walkers shows that where the next foot lands is the main way people keep balance while moving. That same rule produces deliberate steps, recovery steps and stopping steps.

(3) Add a "muscle" layer: each joint follows its target pose like a weighted spring. This gives heavy limbs, momentum and follow-through cheaply, with no physics engine. It is the Overgrowth idea plus the blending trick used in Gears of War.

(4) Take step rate and stride length from real human data, scaled to his leg length. By that calculation, 3.1 m/s is a jog for this body, not a walk. A natural top-speed run would be about 4.5 steps per second, but the removed run used 7.6. The fast cartoon stepping came mainly from feet that only reached 20 cm in front of and behind the hip, not from the speeds or the no-slide rule. This is a calculation, not a game test, and it questions an earlier owner decision, so it should go to the owner as an option.

(5) Make the "whip" timing (legs, then hips, chest, arms) adjustable for each move. Power moves (throw, kick, bat, drive) whip. Precision moves (dart, putt, push) move the parts more at the same time.

(6) Fix one order for the layers and measure each one in the body test room, beside real video of a person doing the same move.

Each specific sport move should be a few named phases, such as wind-up, contact and follow-through, aimed at targets. Nintendo's experience shows why: once Miis had arms, the move count went from about 30 to over 650 animations.

What to leave out: fully physics-driven characters (Gang Beasts, Human Fall Flat) are floppy on purpose, which goes against the athletic goal. Learned physics controllers (DeepMimic, AMP) need GPU training, motion-capture data and expert tuning, and have no phone results. Motion matching needs hours of motion capture licensed for commercial use, so keep it only as a fallback for walking and running. Ragdoll reactions should come later, built so that the physics body follows the same target pose with an adjustable strength.

### Findings

1. **A fixed order of layers for every frame: base motion, then upper-body actions limited to their own bones, then added offsets (lean, turn, breathing), then joint springs, then IK for contacts, then look-at, with physics or ragdoll added later as the last stage.**
   - What it means for the plan: Write the layer order into the Foundation before any movement is built. Each feature (wave, follow-the-ball, step, swing) then has its own slot and its own checks, and a new layer cannot quietly break an older one. The many rebuilt-and-rejected walks partly came from features being tangled together.
   - Evidence: Industry engines all use layered pipelines. Unreal combines play rate, Stride Warping and Orientation Warping after the base motion (Lyra blog: https://www.unrealengine.com/tech-blog/adapting-lyra-animation-to-your-ue5-game). Unity Animation Rigging runs Two Bone IK, Chain IK, Multi-Aim and Damped Transform as jobs on top of the animation (https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.0/manual/ConstraintComponents.html). In the repo, three.js 0.180 ships AnimationUtils.makeClipAdditive and examples/jsm/animation/CCDIKSolver.js (checked in node_modules), and motion-core/skeleton/pose.js already has per-bone layers with fade in and out (PLAN.md section 3).
   - Fit: adopt
   - Why: It costs almost nothing, lets each piece be tested on its own, and the later ragdoll stage fits in without rewriting anything. The exact order of the IK, look-at and spring stages varies between engines; the order above is a common pattern, not a single documented standard.

2. **A 'motion intent' predictor: the body knows its own future path by running the deterministic movement rules ahead of time.**
   - What it means for the plan: Make this Foundation item zero. Each frame, copy the controller state and run it about 0.5 to 1 s ahead with the current stick. Feed the result to foot placement (where the feet must land), lean (curvature ahead), head look-ahead, and stop planning: at release the body knows exactly where the stop ends, so it can brace and place its last steps. This is what turns the owner's 'anticipates turns, stops and landings' into code.
   - Evidence: Measured on the repo's own motion-core/controller.js, run read-only from (scratch folder, not saved) movement/industry/tests/predict.mjs. Holding the stick, the 1 s prediction matched the real outcome with 0.00 m error. Letting go at 8.60 m/s, the predicted stop is 1.983 m ahead after 0.458 s. One 1 s prediction (120 fixed steps plus a state copy) cost 32.6 microseconds on this server; phone cost was not measured. Industry uses the same idea: motion matching chooses poses by future trajectory (Clavet, GDC 2016, https://www.gdcvault.com/play/1022985/Motion-Matching-and-The-Road), and Valve's Half-Life: Alyx uses footstep prediction plus stride retargeting (https://history.siggraph.org/?p=76822). Humans do it too: head direction leads changes in walking direction by about 200 ms, and the head starts turning 0.2 to 0.6 s before the trunk (Grasso et al. and Prévost 2002, summarised at https://www.frontiersin.org/articles/10.3389/fnhum.2015.00312/full).
   - Fit: adopt
   - Why: It is exact, cheap, and fits the existing fixed 1/120 s controller. Without it, every 'anticipation' is really a delayed reaction to the current speed.

3. **Dynamic balance: keep the extrapolated centre of mass (also called the capture point) over the feet, and use foot placement as the main way to stay balanced while moving.**
   - What it means for the plan: Change the Foundation's 'keeps balance over the feet' to two cases. Standing: the extrapolated centre of mass stays inside the support area, which the existing balance.js already does with the plain centre of mass. Moving: each next foot lands relative to the capture point, the SIMBICON-style rule 'base offset plus gain times position error plus gain times velocity error'. One rule then gives deliberate steps, recovery steps after a hard stick flick, and stopping steps.
   - Evidence: Hof, Gazendam and Sinke 2005: the extrapolated centre of mass is the centre-of-mass position plus its velocity divided by the pendulum frequency, and dynamic stability means it stays inside the base of support (https://braceworks.ca/wp-content/uploads/2016/05/hof-condition-for-dynamic-stability.pdf). It equals the instantaneous capture point of Pratt et al. 2006 (as cited at https://pmc.ncbi.nlm.nih.gov/articles/PMC7952635). Foot placement is the primary balance strategy in walking (Hof 2007, as cited there). SIMBICON (Yin, Loken, van de Panne, SIGGRAPH 2007) uses linear feedback on swing-foot placement from centre-of-mass position and velocity, with the hip midpoint as a proxy (https://www.cs.ubc.ca/~van/papers/2007-siggraph-simbicon.pdf). The exact SIMBICON gain values were not confirmed.
   - Fit: adopt
   - Why: A static centre-of-mass-over-feet rule is correct only for standing. Walking and running are controlled falling, so a moving body balanced the static way looks stiff or slides.

4. **When steering, the head leads and the body follows (gaze, then head, then trunk, then feet). When producing force, the order runs the other way (legs, then hips, then chest, then arms).**
   - What it means for the plan: The Foundation item 'the head looks where it goes' should become 'looks where it will be': a point on the predicted path roughly 0.2 to 0.6 s ahead, better held at a fixed distance ahead than a fixed time. Turns then ripple top-down: head, chest, pelvis, feet. Step 2's whip timing stays bottom-up for throws and swings. Both directions belong in the pattern layer.
   - Evidence: Grasso, Glasauer, Takei and Berthoz 1996: head direction anticipates walking direction by about 200 ms on curved paths. Head turns start 0.2 to 0.6 s before the trunk. Prévost 2002: the head turns at a constant distance, not a constant time, before a corner. Authié et al. 2015: gaze leads head, which leads trunk, feet and path (https://www.frontiersin.org/articles/10.3389/fnhum.2015.00312/full; https://web.math.princeton.edu/~sswang/CB-pediatric/grasso_berthoz98_locomotor-children.pdf). These figures come from abstracts and secondary citations, not the full papers.
   - Fit: adopt
   - Why: It is cheap, measurable (head lead time can be checked automatically), and it is one of the clearest visible signs of a body that is in tune with itself.

5. **A 'muscle' layer: each joint follows its target angle through a spring with momentum, scaled to the limb's mass, and switches between moves are blended from the current motion (inertialization) instead of cross-fading two whole motions.**
   - What it means for the plan: Put this between the target pose and the drawn pose. Heavy segments (thigh, trunk) get lower spring frequency and more lag; light ones (hand, forearm) respond faster, so overshoot and follow-through come out naturally. IK contacts are enforced after the springs, so planted feet and gripping hands stay exact. The existing quintic transitions remain for authored moves. This delivers HANDOFF 75(b) ('heavy limbs with momentum and a ragdoll-like follow-through') without a physics engine.
   - Evidence: Rosen's GDC 2014 'An Indie Approach to Procedural Animation' (https://gdcvault.com/play/1020049/Animation-Bootcamp-An-Indie-Approach) uses very few keyframes with spring interpolation. Second-hand claims of '13 keyframes in total' (https://discussions.unity.com/t/an-indie-approach-to-procedural-animation-gdc-video-talk/538228) and springs for crouching (https://polycount.com/discussion/comment/2093086) are not confirmed against the talk. Inertialization: Bollo, GDC 2018 (https://gdcvault.com/play/1025165/Inertialization-High-Performance-Animation-Transitions); Gears of War 4 replaced blended transitions with this post-process and so evaluates fewer animation states. Holden's Spring-It-On and Dead Blending (https://theorangeduck.com/page/spring-roll-call, https://theorangeduck.com/page/dead-blending) were seen only through search summaries; the site was blocked here. Repo docs/game-dev/04-animation.md section G already holds the spring formula.
   - Fit: adopt
   - Why: It is the cheapest proven way to get weight and momentum on a phone. The risk is lag, so springs must not delay what the controls do (04-animation A3: anticipation in games must be very short).

6. **Full-body IK systems (Unreal Full Body IK, Final IK's full-body biped solver, Unity Animation Rigging).**
   - What it means for the plan: Keep the exact two-bone limb solve in reach.js. Add a small 'torso assist' stage in front of it: when a hand or foot target is out of the limb's comfortable reach, the pelvis, spine and chest lean, turn and shift within their joint limits, weighted by stiffness, while balance is kept. Then the analytic limb solve lands the hand exactly. This is what makes reaching any target (like Follow the ball) look athletic instead of a stretched arm. Do not port a general iterative solver first.
   - Evidence: Unreal's Control Rig Full Body IK is built on a position-based solver (the PBIK node). It handles multiple chains and effectors from a pelvis root, with per-bone rotation and position stiffness, and is still marked Experimental (https://dev.epicgames.com/documentation/en-us/unreal-engine/control-rig-full-body-ik-in-unreal-engine, https://dev.epicgames.com/documentation/unreal-engine/API/Plugins/PBIK/FRigUnit_PBIK). Unity Two Bone IK uses a hint to set the bend direction, plus Chain IK and Multi-Aim (https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.2/manual/constraints/TwoBoneIKConstraint.html). Repo PLAN.md section 4: reach.js reaches 600/600 random targets within 0.5 mm in about 0.1 ms for both feet and a hand, and holds the palm on a moving ball within 0.01 mm.
   - Fit: adapt
   - Why: The repo's exact analytic solver is faster and more precise than a general one. What is missing is the trunk taking part, which is the main thing full-body IK adds visually.

7. **Stride and speed matching: gait phase driven by distance travelled (a 'stride wheel'), stride warping within limits, foot locking during stance, and a clear rule for when sliding is allowed.**
   - What it means for the plan: In the base-pattern step, advance the gait cycle by distance travelled, not by time. Lock planted feet. Set step rate and stride as functions of speed and leg length. State explicitly that feet may slide only in skids and braking slides, which the controller already flags.
   - Evidence: Unreal Stride Warping: StrideScale = LocomotionSpeed / RootMotionSpeed (https://dev.epicgames.com/documentation/en-us/unreal-engine/pose-warping-in-unreal-engine). Epic's Lyra blog gives a rule of thumb of at most 15-20% play-rate or warp change, past which it is often better to allow foot sliding (https://www.unrealengine.com/tech-blog/adapting-lyra-animation-to-your-ue5-game). A forum post says Rosen's 'stride wheel' or 'surveyor wheel' slide appears at about 5:30 of the GDC 2014 talk (https://forum.unity.com/threads/surveyor-wheel-technique.251435/); not seen directly. Johansen's 2009 thesis covers semi-procedural locomotion with a footbase constraint (https://runevision.com/thesis/), and Valve's Alyx stride retargeting was based largely on it (https://runevision.com/tech/locomotion/).
   - Fit: adopt
   - Why: It removes foot sliding at its source and works the same for a gait generated from code. Industry accepts small slides beyond modest warps; the owner's no-slide rule should name its exceptions.

8. **Gait numbers scaled to his leg length from human data (dynamic similarity using the Froude number, speed squared divided by gravity times leg length).**
   - What it means for the plan: Use human-data bands as the reference for the gait instead of numbers found by search. For this skeleton, 3.1 m/s is a jog, not a walk, so the walk should become a jog at about 2.0 m/s while the controller speeds stay unchanged. A human-like top speed is about 4.5 steps/s with roughly 56% of each step in the air and the foot sweeping about 0.84 m under the hip. The removed run used 7.6 steps/s and a 0.4 m sweep. This questions owner decision 43(b) ('quick steps, long hops'), so give it to the owner as an option with this evidence.
   - Evidence: Calculation in (scratch folder, not saved) movement/industry/tests/gait_scale.mjs with hip height 0.8395 m (motion-core/skeleton/bones.js, thigh head). Walk-run switch at Froude 0.5 is 2.03 m/s; the walking limit at Froude 1 is 2.87 m/s; 3.1 m/s is Froude 1.17, the same as a 3.2-3.3 m/s human jog; 8.6 m/s is like an 8.9-9.15 m/s human sprint. Human anchors: walk-run switch at about 2.1 m/s, Froude 0.5, 135-140 steps/min (https://www.pubmed.gov/37336086/, https://pubmed.ncbi.nlm.nih.gov/16286854/). Jog at about 3.3 m/s is roughly 165-175 steps/min (regression in https://pubmed.ncbi.nlm.nih.gov/31079578/, as interpreted by the search tool; units not confirmed). Elite sprint: 10.59 m/s, 2.25 m steps, 4.71 steps/s, 0.090 s contact, 0.124 s flight; flight time is not related to top speed (https://pmc.ncbi.nlm.nih.gov/articles/PMC8580521). Scaled estimates: 2.9-3.1 steps/s at 3.1 m/s (removed gait: 4.7); 4.53 steps/s and 1.90 m steps at 8.6 m/s. Removed-gait figures are from docs/NEXT.md item 42.
   - Fit: adopt
   - Why: It gives the gait an objective human reference and shows the earlier cartoon cadence was a design choice (a short stance reach), not forced by the speeds or the no-slide rule. These are estimates from group averages, not a game test, and the newer 185 cm avatar may have a different leg length.

9. **The controller's braking slide is far harder than a human running stop.**
   - What it means for the plan: The stop from release at a full run must look like a slide: braced, leaning back, with feet allowed to slide. It should be chosen at the moment of release using the predictor. It should not be a stepping stop, because the feet cannot step that stop without sliding.
   - Evidence: Measured in predict.mjs: 8.60 m/s to 0 in 1.983 m and 0.458 s, an average of about 18.7 m/s² (v²/2d). For comparison, team-sport match analysis classes decelerations below -3 m/s² as high intensity (https://e-space.mmu.ac.uk/641040/1/ejsc.70014.pdf). The human maximum deceleration was not confirmed in this search.
   - Fit: adapt
   - Why: It stops the next walk or run from failing on a physically impossible stop. The controller numbers are an owner-confirmed decision, so the body adapts to them rather than the other way round.

10. **Proximal-to-distal (whip) timing as an adjustable setting from 'sequential' to 'simultaneous', not a universal rule.**
   - What it means for the plan: Step 2 gets a sequencing setting for each move: whip-like for throws, kicks, bat and racket swings and drives; close to simultaneous for darts, putting, pushes or shot-put style moves, and the bow draw. Late twisting rotations (upper-arm inward rotation, forearm turn) may peak after the 'whip' order would predict.
   - Evidence: Putnam 1993, J Biomech 26 Suppl 1:125-135: striking and throwing are generally sequenced proximal-to-distal, explained by how the segments interact (https://pubmed.ncbi.nlm.nih.gov/8505347/). Elliott and colleagues found the strict sequence does not hold once upper-arm rotation is included, and Marshall's review notes exceptions (ISBS proceedings, e.g. https://ojs.ub.uni-konstanz.de/cpa/article/view/3498/3291). Neal 2007 on golf: added inertial load shifts timing toward simultaneous on a sequential-simultaneous continuum (https://people.stfx.ca:443/smackenz/Courses/DirectedStudy/Articles/Neal%202007%20Body%20Segment%20Sequencing%20and%20Timing%20in%20Golf.pdf). A specific source tying dart throwing to a push-like pattern was not found; that example is my inference.
   - Fit: adapt
   - Why: A strict whip for every sport would make precision moves look wrong. One setting keeps a single pattern system that covers all about 20 minigames.

11. **Build specific moves from named-phase key poses plus targets, with natural variation added (the approach behind Ubisoft's IK Rig and Overgrowth), not one animation clip per situation.**
   - What it means for the plan: Each sport move is 4-6 phases (ready, load, launch, contact, follow-through, recover). Key poses come from real reference video, the pattern layer sets the timing, and IK aims at targets (hands on the bat, foot to the ball contact point) while balance is kept. Natural variation comes from small seeded changes to phase timing and key-pose offsets, within joint limits, so no two attempts match; the outcome then depends on the body, not a dice roll.
   - Evidence: Ubisoft IK Rig (Bereznyak, nucl.ai 2015 and GDC 2016): per-frame rules output desired positions to an IK system that drives the bones, and it 'changes base animations to produce new actions' (https://gdcvault.com/play/1022984/IK-Rig-Procedural-Pose, https://80.lv/articles/how-ubisoft-revolutionises-animation-in-games). Nintendo: Wii Sports Miis had about 30 motions and no arms. Switch Sports needed over 650 motions once arms were attached, because each hit angle and movement direction needed its own motion (https://www.nintendo.com/sg/interview/as8s/03.html). No industry source was checked for how large the variation should be; those amounts are a proposal.
   - Fit: adopt
   - Why: It is the approved step 3 with a concrete authoring format. Aiming at targets is what stops the number of clips from exploding the way Nintendo's did.

12. **Motion matching (For Honor, The Last of Us Part II, Unreal 5.4, Learned Motion Matching).**
   - What it means for the plan: Do not use it as the base. Borrow its two cheap ideas, which are already in the findings above: future-trajectory features and blended transitions. Keep full motion matching only as a fallback for walking and running if the procedural gait fails owner review again, and only with commercially licensed motion capture.
   - Evidence: Clavet, GDC 2016: a deliberately brute-force search of motion-capture data for the best matching frame; first shipped in For Honor (https://www.gdcvault.com/play/1022985/Motion-Matching-and-The-Road, https://montreal.ubisoft.com/en/drecon-data-driven-responsive-control-of-physics-based-characters/). The Last of Us Part II talk by Mach and Zhuravlov, GDC 2021 (https://www.naughtydog.com/blog/naughty_dog_at_gdc_2021). Unreal 5.4 made motion matching production-ready, used in Fortnite on all platforms including mobile (native, not browser) (https://www.unrealengine.com/blog/unreal-engine-5-4-is-now-available). Holden's open-source demo compiles to the web with emscripten, but its data (Ubisoft LaFAN1) is licensed CC BY-NC-ND 4.0, non-commercial (README at https://github.com/orangeduck/Motion-Matching). Learned Motion Matching removes the stored clips but needs network training (https://www.theorangeduck.com/page/learned-motion-matching).
   - Fit: later
   - Why: It needs hours of retargeted, commercially usable motion capture plus tooling, works against the code-first procedural plan, and gives little help for 20 bespoke sports moves.

13. **Active ragdoll that follows the animation (Euphoria in GTA IV and Red Dead Redemption 2; Final IK's PuppetMaster).**
   - What it means for the plan: Keep it later, as approved, but plan for it now: express every joint as a target plus a strength, which the spring layer already provides. A later physics copy of the body, driven by joint motors, can then follow the kinematic pose, and hits or falls just lower the strength. The rigid ball-jointed mannequin maps one-to-one to physics bodies, which is a strong fit.
   - Evidence: Euphoria (NaturalMotion's Dynamic Motion Synthesis) was first shipped in GTA IV. Rockstar says it uses Euphoria to enhance physics reactions in Red Dead Redemption 2 (https://wccftech.com/rockstar-euphoria-evolved-rdr2/). NaturalMotion ended licensing in 2017 (https://en.wikipedia.org/wiki/Euphoria_(software)). PuppetMaster: pin weight and muscle spring blend animation with ragdoll and allow partial unpinning for hit reactions, falls and get-ups; one user reported large slowdowns with 60 characters (https://discussions.unity.com/t/puppetmaster-advanced-character-physics-tool-released/599766?page=110, https://assetstore.unity.com/packages/tools/physics/puppetmaster-48977/reviews). Browser engines: JoltPhysics.js is available in WASM and multithread builds (https://github.com/jrouwe/JoltPhysics.js), and Rapier has joints; no iPhone ragdoll benchmark was found (https://github.com/isaac-mason/javascript-physics-library-tests).
   - Fit: later
   - Why: It is the right final layer for hits and falls, but expensive and prone to instability. Designing the target-plus-strength interface now costs nothing.

14. **Characters driven entirely by physics (Gang Beasts, Human Fall Flat, Totally Accurate Battle Simulator).**
   - What it means for the plan: Do not use as the main method. Borrow only for comedy falls or knockdowns later, through the active-ragdoll layer.
   - Evidence: Reviews describe Human Fall Flat's Bob as figures that 'wobble and sway like soft dough' (https://keengamer.com/article/14019_human-fall-flat-review). Boneloaf says the physics requirements dictated Gang Beasts' character design, and its patch notes say physics engine changes have knock-on effects on gameplay (https://unity3d.com/case-study/gang-beasts, https://gangbeasts.game/posts). No developer technical write-ups were found for any of the three; Landfall's system is described only second-hand (https://medium.com/@junk.u.spam/analysis-of-active-ragdolls-in-games-82c95f8ed7a5).
   - Fit: reject
   - Why: They are deliberately clumsy, which contradicts the owner's athletic, precise goal and 'no clumsy leaning or tripping' (PLAN.md decision 4). They are also fragile to tune.

15. **Learned physics controllers (DeepMimic, AMP, ASE, DReCon, NVIDIA humanoid policies) running in a phone browser.**
   - What it means for the plan: Not now. Revisit only for falls and get-ups after everything else works, if browser tools and phone performance mature.
   - Evidence: DeepMimic: about 60 million samples per skill, about 2 days on an 8-core CPU (paper, https://arxiv.org/pdf/1804.02717), or about 1 day with 16 workers (https://github.com/xbpeng/DeepMimic README). AMP, SIGGRAPH 2021 (https://xbpeng.github.io/projects/AMP/). ASE, 2022: a massively parallel GPU simulator and over a decade of simulated experience (https://arxiv.org/abs/2205.01906v1). DReCon (Ubisoft La Forge and McGill, 2019): motion matching plus a learned policy, described as 'surprisingly low runtime cost' with no numbers given (https://www.ubisoft.com/en-us/studio/laforge/news/VjEIwquaIyEZZSw5RZI0V/drecon-datadriven-responsive-control-of-physicsbased-characters). Browser running exists through MuJoCo WASM plus ONNX Runtime Web (mjswan/muwanx, Humanoid Policy Viewer). NVIDIA's Metatron card recommends WebGPU and says the CPU/WASM path does not guarantee real time (https://huggingface.co/nvidia/Metatron-v1). No phone benchmarks were found.
   - Fit: reject
   - Why: Training needs GPUs, motion-capture data and expert tuning for every sport. Results are hard to control, and phone performance is unknown. The fit is good in one respect only: these controllers simulate rigid bodies, which the mannequin already is.

16. **How sports-game studios make movement (EA FC HyperMotion, NBA 2K ProPLAY, Wii Sports and Switch Sports).**
   - What it means for the plan: Lesson only. AAA sports realism comes from huge captured libraries, which a solo developer cannot reach. Nintendo's route (few motions, stylised characters, timing-centred play) is the realistic analogue, and aiming at targets is the lever that avoids the clip explosion. The owner's 'no power meters' rule fits outcomes that come from the body's own timing.
   - Evidence: FIFA 22 HyperMotion: 22 players in Xsens suits through full 11v11 matches, 8.7 million frames, and machine learning producing about 4,000 animations (https://ea.com/games/fifa/fifa-22/hypermotion, https://www.xsens.com/resources/blog/fifa-22-motion-capture, https://80.lv/articles/ea-uses-machine-learning-for-animations-in-fifa-22). NBA 2K25 ProPLAY: 9,000 animations, including 1,500 dribbles and 1,100 signature shots, from NBA footage; 2K26 has a machine-learning Motion Engine (https://developer.microsoft.com/en-us/games/articles/2024/09/closer-look-at-nba-2k25-proplay-system/, https://nba.2k.com/2k26/courtside-report/gameplay/). Wii Sports: about 30 motions, Miis without arms; Switch Sports: over 650 (https://www.nintendo.com/sg/interview/as8s/03.html).
   - Fit: adapt
   - Why: It sets realistic expectations and confirms the plan's direction: targets plus a few authored phases, not libraries.

17. **A simple physical core with procedural limbs (Rain World, Grow Home, Overgrowth).**
   - What it means for the plan: Drive the pelvis and centre of mass with a tiny physical model and place the limbs procedurally around it. For walking that is an inverted pendulum; for running and landings it is a spring-mass model, which gives the bounce and landing squash. The result is weight and landing compression without a full ragdoll, and it works naturally with the capture-point stepping above.
   - Evidence: Rain World: the slugcat's body is two physics chunks kept a fixed distance apart, with limbs and tail added as procedurally animated pieces (https://unity.com/blog/exploring-procedural-design-rain-world). GDC 2016 talk by Jakobsson and Therrien (https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures). Grow Home's BUD: foot strikes and limb flailing are generated on the fly; the game started as a procedural-animation experiment by a physics programmer (https://www.pcgamer.com/grow-up-takes-bud-the-robot-to-new-frontiers, https://en.wikipedia.org/wiki/Grow_Home). The spring-mass running model is Blickhan 1989, J Biomech 22:1217; that citation is from memory and was not checked in this search.
   - Fit: adapt
   - Why: It is cheap, gives real weight transfer and fits a rigid robot-like mannequin. It must stay subordinate to the controller's fixed speeds, which decide where the body goes.

18. **A body test room with objective checks plus side-by-side comparison with a real person.**
   - What it means for the plan: Each Foundation and pattern item gets automatic checks: foot slide during stance, joint-limit margin, joint speed jumps per frame (the removed run reached about 190° per frame), margin between the extrapolated centre of mass and the feet, cadence against the human band, and head lead time. The owner then judges the move beside a real-person reference clip at the same speed.
   - Evidence: Epic's Game Animation Sample (over 500 animations, built as a showcase and test project) is an industry example of a dedicated movement test level (https://www.unrealengine.com/blog/game-animation-sample). The repo's Motion Lab pages already take per-page videos (CLAUDE.md rule 16). The removed-run figures (about 190° per frame, 20% of frames over 1 mm) come from docs/NEXT.md item 42.
   - Fit: adopt
   - Why: Passing numbers do not prove a move looks right, but these checks catch the specific failures behind earlier rejections before the owner spends time looking.

### Tests run

1. **Future-path prediction with the repo's own movement rules (motion-core/controller.js, imported read-only) from (scratch folder, not saved) movement/industry/tests/predict.mjs, run in Node.**
   - Result: Holding the stick, the 1 s prediction matched the actual outcome with 0.00 m error. Letting go at 8.60 m/s, the predicted stop is 1.983 m ahead after 0.458 s (about 18.7 m/s² average). Cost: 32.6 microseconds per 1 s prediction (120 fixed steps plus a state copy), averaged over 5,000 runs.
   - Limits: Timed on this cloud server, not an iPhone. Phone cost is likely several times higher but was not measured. It covers ground movement only, with no jumps.

2. **Froude (dynamic similarity) calculation of the game's speeds against the motion-core skeleton's leg length, from (scratch folder, not saved) movement/industry/tests/gait_scale.mjs.**
   - Result: With hip height 0.8395 m: walk-run switch at Froude 0.5 is 2.03 m/s, and the walking limit is 2.87 m/s. 3.1 m/s is Froude 1.17 (a 3.2-3.3 m/s human jog), and 8.6 m/s is Froude 8.98 (an 8.9-9.15 m/s human sprint). Estimated natural cadence is 2.9-3.1 steps/s at 3.1 m/s and about 4.5 steps/s with 1.90 m steps and 56% of each step in the air at 8.6 m/s. The removed gait used 4.7 and 7.6 steps/s.
   - Limits: This is arithmetic from published group averages: the 0.90-0.95 m human leg length is assumed, and the jog cadence comes from a regression whose units are not confirmed. The leg length is from motion-core/skeleton/bones.js, and the newer 185 cm avatar may differ. It was not tried in the game.

3. **Repo inspection (read-only): three.js version and animation helpers, installed physics libraries, and earlier gait notes.**
   - Result: three 0.180.0 includes examples/jsm/animation/CCDIKSolver.js and AnimationUtils.makeClipAdditive. No physics or machine-learning runtime is installed (no rapier, cannon, jolt, ammo or onnx). docs/NEXT.md items 41-43 record the removed gait's cadence, its 0.2 m stance reach, its joint speed jumps, and owner decision 43(b).
   - Limits: Inspection only; no repo files were changed.

4. **Network reachability for primary sources.**
   - Result: Only github.com and raw.githubusercontent.com could be reached. WebFetch to gamedeveloper.com and theorangeduck.com failed because those hosts are outside the session's allowed network. gdcvault.com, arxiv.org, Epic and Unity docs, and Wikipedia were also unreachable with curl. All other evidence comes from WebSearch result summaries and GitHub READMEs (Motion-Matching, DeepMimic, JoltPhysics.js, mujoco_wasm).
   - Limits: Several talk details are second-hand: Rosen's '13 keyframes', the stride wheel at about 5:30, and the exact SIMBICON gains. GDC talk contents could not be watched or read.

### Risks
1. The Froude-based gait advice questions owner decision 43(b) (cartoon 'quick steps, long hops' running). It must go to the owner as an option with evidence, not be applied automatically.
2. The controller speeds and braking slide are owner-confirmed and physically extreme: a walk at Froude 1.17 and a stop averaging about 18.7 m/s². Some foot sliding during skids and braking is unavoidable, so the no-slide rule needs named exceptions.
3. The springs in the muscle layer add lag. Tuned too soft, they make controls feel slow, so contacts must be enforced after the springs and anticipation kept very short.
4. Capture-point stepping has to keep up with a body whose position comes from the code, not from the feet. At hard flicks and full-speed turns the feet may still lag (the removed run had 20% of frames off by more than 1 mm). Plan graceful recovery steps or allowed slides.
5. Much of the industry evidence is second-hand because of network limits. GDC talks, Holden's articles and Epic and Unity docs were seen only through search summaries; exact figures from Rosen, SIMBICON, Grasso and others should be re-checked if they become load-bearing.
6. Phone performance is unmeasured: the predictor was timed on a server, and no iPhone ragdoll or WASM physics benchmark was found. Whether iOS Safari supports WASM SIMD and threads was not checked.
7. Scope risk: about 20 minigames still need hand-authored key poses for each phase. The targets approach reduces but does not remove that work.
8. Licensing of reference motion data: Ubisoft LaFAN1 is non-commercial (CC BY-NC-ND 4.0). Mixamo terms were found only in forum posts, and the CMU motion-capture licence was not checked. Use such data as visual reference only unless the licences are confirmed.
9. The leg length used (0.8395 m hip pivot) is from the motion-core skeleton. The newer avatar's proportions may differ (HANDOFF item 75e), which would shift every gait number.

## Research: biomech
**Summary:** The owner's order is right: body abilities first, then base motion patterns, then specific moves, then ragdoll. It matches how sports science builds skill, where fundamental movement skills (moving, controlling objects, staying stable) are the building blocks for sport skills. I found six changes that would make it noticeably better.

(1) "Balance" in the foundation should mean physics, not only "weight over the feet". Viewers judge weight and effort from how the body moves. So the foundation needs dynamic balance (where the body is heading as well as where it is), believable grip on the ground, and correct flight in jumps.

(2) The existing movement numbers are physically impossible for a human body. The repo's own note admits they are "game-feel numbers (faster than real life)". The avatar reaches full run in 0.27 s at 3.3 g, stops in 0.76 m at about 4.9 g, and "walks" at 3.1 m/s. With his 0.84 m legs, 3.1 m/s is past the speed where walking turns into running (about 2.0 m/s) and past the theoretical walking limit (about 2.9 m/s). No body layer can make that look athletic. This may be one reason walking kept failing (not proven), and the owner needs to decide it, because "speeds stay exactly" was their earlier decision.

(3) The current joint limits block key athletic shapes. The waist cannot lean forward or sideways at all. The chest bends only 15°. The collarbones move only 4°. Throwing, golf, bowling and archery all need trunk tilt and shoulder-blade motion. Fixing this means changing the joint and socket geometry, not just the code.

(4) The patterns need two families. Fast moves (throw, bat, golf drive, kick) work like a whip: legs, then hips, then chest, then arm. Precision moves (darts, putt, pool, archery, free throw) use few joints moving together, with a steady body. The plan's "everything is a whip" should become "a whip or a steady push".

(5) Anticipation and natural variation should be shared rules for every move, with measurable timings. The head leads a turn by about 0.2 s, and the body sets itself about 0.1 s before an arm action. Repeats should differ in the details that don't matter while keeping the outcome accurate.

(6) Build the foundation in the order a few benchmark moves need it, judged by automatic checks first, so visible progress comes early. Good benchmarks: start, step and stop; step and throw; jump and land; follow the ball.

Deliverables are in the findings. (1) A minimal set of 12 base patterns: 8 needed first, 4 for board, ice, snow, climbing and kart. Each planned move maps to patterns. (2) A joint range-of-motion table covering the 20 body bones that need limits, with sources and gaps. (3) About 30 automatic checks with numbers from research.

Caveats: WebFetch was blocked (two hosts failed to resolve), so every value comes from search-result summaries of papers, not full texts. The joint-range values differ between sources. No Mario/SM64 data was used.

### Findings

1. **Keep the owner's overall order: body abilities, then base patterns, then specific moves, then ragdoll reactions.**
   - What it means for the plan: No restructuring needed. The plan mirrors how physical education and coaching build skill: general movement abilities first, combined later into sport-specific skills.
   - Evidence: Gallahue, Ozmun & Goodway split fundamental movement skills (FMS) into locomotor skills (run, hop, jump, slide, gallop, leap), object-control skills (strike, dribble, kick, throw, underarm roll, catch) and stability skills, as summarized in a PLOS One paper (https://pmc.ncbi.nlm.nih.gov/articles/PMC4607429). Lloyd & Oliver's Youth Physical Development Model (2012) treats FMS as the building blocks for sport-specific patterns (https://britishjudo.org.uk/wp-content/uploads/2024/10/LTAD-Youth-Physical-Development.pdf). A follow-up defines Athletic Motor Skill Competencies (https://pure.cardiffmet.ac.uk/en/publications/developing-athletic-motor-skill-competencies-in-young-athletes/); I could not confirm its exact item list. The Athletic Skills Model book (Wormhoudt, Savelsbergh, Teunissen, Davids 2018) starts from 'Basic Movement Skills' (https://www.routledge.com/products/9781138707320); I could not confirm its list. The IPLA definition of physical literacy names 'physical competence' alongside motivation and confidence (https://www.physical-literacy.org.uk/about/). Developmental throwing research (Roberton components model) shows the order in which pieces appear: a contralateral step must exist before the trunk can rotate on the legs, and follow-through has a large effect on ball speed (https://us.humankinetics.com/blogs/excerpt/characteristics-of-early-overarm-throwing ; Beseler et al. 2022, https://ro.ecu.edu.au/ecuworks2022-2026/1416).
   - Fit: adopt
   - Why: It agrees with both the FMS literature and motor-development research, and it lets every sport move reuse tested building blocks instead of being animated from scratch.

2. **DELIVERABLE 1. A minimal set of 12 base motion patterns (8 core, 4 specialised) plus shared rules, mapped to every planned move.**
   - What it means for the plan: Stage 2 becomes a concrete list. Each sport move becomes a recipe of patterns plus targets, so about 20 minigames need about 12 patterns, not 20 separate animations. Build the 8 core patterns first. Lean & Edge and Hang & Support can wait until skating, skiing, the obstacle course or karts need them.
   - Evidence: FOUNDATION ABILITIES (stage 1, not motions): F1 joint limits; F2 reach/IK for hands, feet and pelvis (exists: reach.js); F3 balance and physics of weight (CoM, extrapolated CoM, support polygon, friction, flight); F4 look/orient cascade (eyes, head, chest, pelvis); F5 grip and contact (hands on objects, two-hand closed chains on clubs/bats, sitting contact).

CORE PATTERNS: P1 Set & Shift (athletic stance, weight shift between feet and heel/toe, countermovement load). P2 Step/Push-off (one deliberate step: unweight, swing, place, accept weight; variants: forward, side, cross-over, back, recovery step, lateral skate push, run step with flight). P3 Plant & Brace (lead foot lands ahead of the CoM and the leg stiffens to stop or redirect momentum: stops, cuts, throw/kick support leg, batting stride, bowling slide, take-offs). P4 Lower & Rise (squat or hip-hinge; sit/stand; pick up; crouch; absorb). P5 Propel & Land (jump: hip, then knee, then ankle extension with an arm swing; landing: ankle, knee and hip flex to absorb). P6 Coil & Uncoil (pelvis turns first, chest lags behind (hip-shoulder separation), then the chest overtakes and the pelvis slows; axis tilt sets overarm, sidearm or underarm). P7 Limb Whip, arm (ballistic shoulder, elbow, wrist chain in overarm, sidearm/backhand or underarm-pendulum planes). P8 Steady Push/Pull (precision: few joints moving together on a straight path with a still base: dart, putt, cue stroke, free-throw arm, bow push plus draw, steering, climbing pull).

SPECIALISED PATTERNS: P9 Limb Whip, leg (hip flexion, then knee extension: kick, run swing leg, high-jump lead leg, skate push leg). P10 Reciprocal coupling (opposite arm and leg, pelvis-chest counter-rotation: walk, run, skate, ski poling, climbing). P11 Lean & Edge (whole-body lean into a turn plus hip/knee/ankle angulation: run curves, skating, skiing, skateboard carving, moving platforms). P12 Hang & Support (weight through the hands: ledge grab, climb, swing bars, vault, using the kart frame, getting up).

SHARED RULES (applied to every pattern, not patterns themselves): phases (prepare, execute, follow-through, settle); anticipation; proximal-to-distal timing for whips, simultaneous timing for steady pushes; structured variation; scaling with the task.

MAPPING:
- Walk: P2+P10 (+P11 on curves), F3, F4.
- Run: P2 with flight+P10+P11.
- Stop: P3+P1.
- Cut: P3+P11+P2.
- Standing jump: P1+P5. Long jump: P2+P3+P5+P9 (free-leg swing). High jump: P2+P11+P3+P5+P9.
- Kart in: P2 (step over the side)+P12 (hands on frame)+P4 (lower into seat). Kart out: the reverse. Driving: P4 posture+P8 on the wheel+F4 (look into turns). Car-entry studies report several distinct entry/exit strategies and use of hand contact (Causse et al. SAE 2009, https://saemobilus-test.cld.sae.org/articles/dynamic-analysis-car-ingress-egress-movement-experimental-protocol-preliminary-results-2009-01-2309 ; Fernandes 2023: 5 entry and 3 exit strategies, https://doaj.org/article/af7399d4240c450a97cbb261af27dc7c).
- Skateboard push: P1+P4+P9/P2+P10. Carve: P11+P1. Ollie: P4+P5+F2 (feet on board)+landing. Front-knee flexion correlates with board height, and the arms matter for balance (https://revista-apunts.com/en/3d-kinematic-analysis-of-the-ollie-maneuver-on-the-skateboard/).
- Ice skating: P2 lateral push+P4 (deep knee)+P10+P11. Push-off direction drives forward speed, and the trunk is near horizontal in speed skating (Houdijk 2000, https://research.vu.nl/ws/files/1657479/HouKonGro%202000.pdf).
- Skiing: P4+P11+P8 (pole plant). Knee and hip angulation raise CoM inclination and edging (https://koreascience.kr/article/JAKO201721242144242.page).
- Obstacle course: P2, P5, P12, plus the F3 hip strategy on beams.
- Mini-golf putt: P1+P8 pendulum+F4.
- Golf drive: P1+P3+P6+P7 two-hand sidearm (F5 closed chain).
- Bowling: P2 (4-5 step approach)+P3 slide+P4 lunge+P7 underarm pendulum (https://pubmed.ncbi.nlm.nih.gov/37837114/).
- Basketball: P4 dip+P5+P8 push.
- Football throw: P2+P3+P6+P7 overarm.
- Soccer kick: P2 (angled approach)+P3 (support foot beside the ball)+P6+P9+opposite-arm swing.
- Batting: P1 load back+P2 short stride+P3+P6+P7 two-hand (F5)+F4 tracking the ball.
- Archery: P1+P8 (bow-arm push plus draw-arm pull, shoulder blade back)+F4 hold.
- Darts: P1+P8 elbow-led.
- Frisbee backhand: P2+P3+P6+P7 backhand. The backhand relies more on trunk and pelvis rotation than the forehand (Kim, Park, Byun, via https://ojs.ub.uni-konstanz.de/cpa/article/view/6904).
- Skee-ball: P4+P7 underarm.
- Pool: P4 hinge+P8 cue stroke (forearm swings from a still upper arm)+F2 bridge hand.
- Paintball: P2/P4 movement+P8 aiming hold+F4.
- Pick up gear: P4+F2+F5. Catch: F2 intercept+F4+P1 absorb.
- Swimming is not covered and needs its own water model later.
   - Fit: adapt
   - Why: It turns the owner's 'step, plant, hip turn, arm swing, leg swing' into a complete but small set that also covers board, ice, snow, kart and climbing needs. It also adds the steady-push family that precision games require.

3. **Split patterns into two families. Whip-like for speed (throw, bat, golf drive, kick, frisbee, bowling). Steady-push-like for accuracy (darts, putt, pool, archery, free throw).**
   - What it means for the plan: Don't apply 'legs, hips, chest, arms like a whip' to every move. Precision games should show a quiet, stable body and few moving joints, or they will look wrong. The automatic checks must also differ per family.
   - Evidence: Whip timing: Putnam 1993 (J Biomech 26 Suppl 1:125-135) found segment motions in striking and throwing are generally ordered proximal to distal, explained by interaction between segments (https://pubmed.ncbi.nlm.nih.gov/8505347/). Precision examples:
- Darts: the elbow flexion-extension joint leads, and experts use interaction torques to brake elbow extension, which is tied to precision rather than speed (Rezzoug et al. 2018, Human Movement Science, via search). Expert dart throwers use timing-error-reducing strategies (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6797117/).
- Putting: modelled as a pendulum driven at twice its natural frequency, giving a backswing about twice as long as the downswing. Backswing length scales distance. A full golf swing has a ratio near 3 (Grober, https://arxiv.org/pdf/0903.1762 ; https://arxiv.org/pdf/physics/0611291).
- Free throw: proficient shooters still sequence knee, pelvis and elbow with longer gaps and less arm workload (ISBS, https://commons.nmu.edu/isbs/vol42/iss1/93). Release comes before peak wrist velocity.
- Archery: elite archers make postural adjustments before string release earlier and more often (https://arxiv.org/abs/2402.12389v1).
- Pushing is described as a simultaneous joint pattern with a near-straight path at the end of the chain (course handout citing Hamilton & Luttgens; I could not confirm the Kreighbaum & Barthels textbook framing).
   - Fit: adopt
   - Why: Research shows precision skills are organised differently from maximum-speed skills, and players will watch these moves in slow, close-up minigames.

4. **DELIVERABLE 2. A joint range-of-motion table for the foundation's limits, compared with the current repo limits.**
   - What it means for the plan: Of the 63 bones, 20 body bones need real limits: spine, chest, neck and head, plus clavicle, upper arm, lower arm, hand, thigh, shin, foot and toes on each side. Pelvis is the free root, the two hip bones are fixed, and the 40 finger and palm bones need simple one-axis limits. Most arm and leg limits already match human norms. The big gaps are the trunk and the shoulder girdle, and fixing those means geometry work (rims and sockets), not only number changes.
   - Evidence: Format: joint (avatar bone): human norm [source] | repo now (motion-core/skeleton/bones.js) | recommendation.

1) TRUNK (spine + chest combined): thoracolumbar flexion 80, extension 25, lateral bend 35 per side, rotation 45 per side [AAOS values as reproduced in flashcards https://knowt.com/flashcards/8fba0a68-4bf9-41bb-b455-d9780d98461b ; a 2023 goniometer study of 300 young adults found lumbar flexion about 70 and lateral bend about 36]. About 80% of trunk twist happens in the thoracic spine [White & Panjabi, cited in https://openrepository.aut.ac.nz/bitstreams/a5518ca9-d63a-45a0-b74e-18f639dd4252/download] | flexion 15 (chest only), extension 0, lateral 0, twist 35 at the waist + 15 at the chest | twist about ±45 total with the larger share at the chest; lateral ±20-30; forward 40-60 (the rest from the hips); extension 15-25, shell permitting. Greater forward trunk tilt and glove-side lateral tilt at release correlate with pitch velocity (https://pmc.ncbi.nlm.nih.gov/articles/PMC6044599).
2) NECK+HEAD: cervical flexion 45, extension 45, lateral 45, rotation 60 [AAOS table in the Hendriks et al. supplement, https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf]; other references give 50/60/45/80 | combined about +55/-45, side ±40, twist ±80 | keep.
3) CLAVICLE (sternoclavicular joint, stand-in for the shoulder blade): raising the arm combines the ball joint with shoulder-blade upward rotation in a classic 2:1 ratio (Inman 1944). The ratio varies across the arc, for example 2.34:1 overall in one inclinometer study (https://pages.uoregon.edu/biomech/obl/articles/2001_mcclure_jses2001.pdf). The clavicle elevates, retracts and rotates backward as the arm rises (pinned-bone study, https://pmc.ncbi.nlm.nih.gov/articles/PMC2657311). I could not confirm exact sternoclavicular degrees | ±4 forward/back, -1/+4 shrug | as much as the chest shell allows, plus automatic coupling: arm elevation above about 60° also lifts and rotates the clavicle. Archery draw and throw cocking need retraction; follow-through needs protraction.
4) SHOULDER (upperArm): flexion 180, extension 60, abduction 180 [Hendriks AAOS table]; internal rotation 70, external rotation 90 [AAOS flashcards https://brainscape.com/flashcards/aaos-normal-values-8291725/packs/13631830; sources disagree on internal rotation]. Throwing layback reaches about 165-176° of combined humerothoracic external rotation (322 professionals: 165.2±9.7° at max external rotation; another study 175.98±6.82°), produced by trunk extension, shoulder blade and ball joint together (https://pmc.ncbi.nlm.nih.gov/articles/PMC9284251). Daily tasks need about 121 flexion, 128 abduction and 116 cross-body adduction (https://researchdiscovery.drexel.edu/esploro/outputs/journalArticle/Defining-functional-shoulder-range-of-motion/991019276220704721) | flex 170, ext 50, abd 170, add 10, twist ±90 | swing cone up to 180, extension 60, cross-body adduction about 120+, twist 70 internal / 90 external at the side, with external rotation rising (about 110-120 is my estimate) when the arm is out at 90°. The rest of the layback should come from the clavicle and trunk.
5) ELBOW (lowerArm x): flexion 150, extension 0 [Hendriks]; some tables say 140 | 0..150 | keep.
6) FOREARM twist (lowerArm y): pronation 80, supination 80 [flashcards; Canadian chart] | ±80 | keep.
7) WRIST (hand): flexion 80, extension 70 [Hendriks]; radial deviation 20 (confirmed); ulnar deviation 30 (common, but one chart says 20) | x ±70, z -20/+30 | flexion 80 / extension 70.
8) HIP (thigh): flexion 120, extension 30, abduction 45, adduction 30, internal and external rotation 45 [1965 AAOS values as commonly cited]; the Hendriks AAOS table gives extension 20, abduction 40, adduction 20 | flex 120, ext 30, rotation ±40, add 20, abd 45 | keep, plus coupling: with the knee straight, hamstrings limit hip flexion (straight-leg raise typically 40-85°, under 80 counted as reduced; https://dxpprod.nsca.com/contentassets/79357780ccd544738a784216b885f92e/ptq-7.1.2-muscle-extensibility-testing-for-the-lower-extremity-a-review-for-the-personal-trainer.pdf).
9) KNEE (shin): flexion 135 [Hendriks], 150 in other tables; extension 0 | 0..150 | keep.
10) ANKLE (foot x): dorsiflexion 20, plantarflexion 50 [commonly cited AAOS; the CDC protocol measures with the knee bent at least 30°]. Weight-bearing dorsiflexion in squats is larger (not verified here) | 36 up, 48 down, combined cap 60 | keep. Consider less dorsiflexion with the knee straight (calf muscle coupling; unverified).
11) SUBTALAR roll (foot z): inversion 35, eversion 15 [commonly cited; not confirmed in this session] | ±20 | asymmetric (more inversion) if the shell allows. Skating and skiing edges, uneven ground and cuts use it.
12) TOES (MTP): big-toe extension about 70, flexion about 45 [commonly cited; unconfirmed] | lift 55, no flexion | keep.
13) FINGERS: MCP 90, PIP 100, DIP 90 [commonly cited; unconfirmed] | much smaller (e.g. index 32/45/15) because the fingers are thick | judge by per-object grip tests instead.

SOURCE NOTE: the CDC/Soucie 2011 study (674 people) found range of motion falls with age and differs from the most-used norms (https://pesquisa.bvsalud.org/bvsvs/resource/pt/mdl-21070485). Its tables could not be fetched.
   - Fit: adopt
   - Why: Using clinical norms gives the 'realistic human range' the owner asked for. Comparing them with the repo shows exactly where the rigid shell is the real limit.

5. **Store limits as swing-and-twist cones with coupled and 'comfort vs hard' ranges, in a form the later ragdoll physics can reuse.**
   - What it means for the plan: One limits module serves posing, reaching, balance and later ragdoll joints, so behaviour can't drift between animation and physics. Poses should normally stay inside a comfort zone and touch hard limits only at ballistic peaks such as layback or follow-through.
   - Evidence: Baerlocher & Boulic (2001) compare ways to describe a ball-and-socket joint and recommend swing-and-twist for realistic joint boundaries (https://link.springer.com/chapter/10.1007/978-0-306-47002-8_16). Herda et al. show that shoulder swing and twist limits are correlated and should not be treated independently (https://www.cs.utoronto.ca/~urtasun/publications/HerdaUHF03.pdf). Game ragdoll joints such as Unity's Character Joint use a symmetric swing limit plus an asymmetric twist limit (https://docs.unity3d.com/Manual/class-CharacterJoint.html). The repo currently uses per-axis Euler boxes (x/y/z min-max, XYZ order). Daily-task ranges (e.g. shoulder about 121° flexion) sit well inside the maximum ranges, which supports the comfort-zone idea. The exact comfort percentage is a design choice, not a sourced number.
   - Fit: adopt
   - Why: Euler boxes give odd limits near extreme poses, and the later ragdoll stage would otherwise need a second, inconsistent set of limits.

6. **Make 'balance' dynamic. Use the extrapolated centre of mass and the support polygon, and give the body human balance responses (ankle, then hip, then step), not just 'weight over the feet'.**
   - What it means for the plan: The current balance.js keeps the CoM over the feet, which is static and fine for standing. Running, stopping, throwing and landing need balance that accounts for speed, plus a stepping response. That stepping response is also what makes later ragdoll hits look human, because people step before they fall.
   - Evidence: Hof, Gazendam & Sinke 2005 (J Biomech 38:1-8): static rule = CoM projection inside the base of support (BoS); dynamic rule = extrapolated CoM, XCoM = x + v/ω0 with ω0 = sqrt(g/l), must lie inside the BoS. Margin of stability = BoS edge minus XCoM (https://braceworks.ca/wp-content/uploads/2016/05/hof-condition-for-dynamic-stability.pdf ; Curtze, Buurke & McCrum notes, https://cris.maastrichtuniversity.nl/files/177130543/Notes_on_the_margin_of_stability_2023_Curtze_Buurke_McCrum_Preprint_v2.pdf). For a CoM about 1 m high, ω0 ≈ 3.13/s, a time constant of about 0.32 s (my computation). Horak & Nashner 1986: small disturbances are handled by an ankle strategy (body sways as one rigid segment), narrow bases or fast corrections by a hip strategy; these form a continuum, with stepping beyond them (summarised in https://pmc.ncbi.nlm.nih.gov/articles/PMC5144705). The repo's balance.js already uses Winter/Dempster segment masses, which can be reused for CoM and XCoM.
   - Fit: adapt
   - Why: Static balance cannot explain or check any moving athletic action, and a step response is needed later for hits and falls.

7. **Add 'physics of weight' to the foundation, and flag that the current movement controller asks for impossible human accelerations.**
   - What it means for the plan: Before rebuilding walking, decide whether the body drives movement (believable weight) or movement drives the body (game feel), and how much the game may cheat. If the controller keeps 3-5 g pushes, no body layer can show convincing weight transfer, lean or foot placement. This changes an earlier owner decision ('speeds stay exactly'), so the owner must decide it; it should not be changed silently.
   - Evidence: Repo values (motion-core/tuning.js, labelled 'game-feel numbers (faster than real life)'): acceleration 32 m/s², deceleration 26, skid 46, turn rate 5.2 rad/s at 8.6 m/s, brake slide 0.762-2.03 m from above 5.4 m/s down to 1.2 m/s.

My computations (scratch script froude.py):
- 0 to 8.6 m/s at 32 m/s² takes 0.27 s, a 3.3 g push.
- With ground grip μ = 0.7-1.0, the fastest physically possible 0 to 8.6 m/s is 0.88-1.25 s, and the shortest stop from 8.6 m/s is 3.8-5.4 m.
- The short brake slide needs about 47.6 m/s² (4.9 g); the long one about 17.9 m/s² (1.8 g).
- Holding 32 m/s² steadily would need a body lean of about 73° from vertical (lean = atan(a/g)).

Human grip reference: peak traction used in cutting averaged 0.74±0.20, 95% range 0.41-1.07 (ISBS abstract, preliminary, https://ojs.ub.uni-konstanz.de/cpa/article/view/1672/1574). Turning while walking needs 0.38-0.54. Leaning matches force direction in sprint acceleration: more forward lean goes with a more horizontal push (Kugler & Janshen 2010, as cited in sprint-force papers; Morin's ratio of forces). Viewers see weight in movement: observers judged lifted-box weight from point-light joint markers alone (Runeson & Frykholm 1981, https://bvbvf1.bib-bvb.de/vufind/PrimoRecord/cdi_proquest_miscellaneous_73681772). They also detect errors in jump flight, especially horizontal-velocity errors and added accelerations (Reitsma & Pollard 2003, https://ri.cmu.edu/?p=8709).
   - Fit: adapt
   - Why: 'Heavy limbs, momentum, weight transfer' cannot be shown on top of a root that moves several times faster than feet can push. This is a cheap decision now and a very expensive one after the body layers are built.

8. **The top walking speed of 3.1 m/s is faster than this avatar's legs can walk naturally.**
   - What it means for the plan: Walking should switch to running at about 2.0 m/s for his leg length, with a natural stroll near 1.4 m/s. Otherwise the 'walk' will look like race-walking or a shuffle no matter how good the leg code is. This may be one reason walking was rejected 5-7 times; that is plausible but not proven. It needs an owner decision because the speeds were an earlier owner choice.
   - Evidence: The Froude number Fr = v²/(gL), with L = leg length, sets walking limits. Adults switch from walk to run at about Fr 0.5. The simple inverted-pendulum walk is impossible above Fr 1, and in reduced gravity people switch at about the same Froude number (https://en.wikipedia.org/wiki/Transition_from_walking_to_running ; Kram et al. 1997, https://cob.silverchair.com/jeb/article/200/4/821/7425/Effect-of-reduced-gravity-on-the-preferred-walk ; https://pmc.ncbi.nlm.nih.gov/articles/PMC1617162).

The avatar's hip-ball height is 0.8395 m (bones.js). My computations:
- Fr 0.25 (typical stroll) = 1.43 m/s.
- Fr 0.5 (walk-to-run switch) = 2.03 m/s.
- Fr 1.0 (walking limit) = 2.87 m/s.
- The repo's walk at 3.1 m/s is Fr 1.17. Run at 8.6 m/s is Fr 9.0, a strong sprint.

Human norms: self-selected walking speed 1.30-1.46 m/s (Frontiers table, https://pmc.ncbi.nlm.nih.gov/articles/PMC8217618/table/T3). If the new 191 cm avatar has different leg length, recompute from its hip height.
   - Fit: adapt
   - Why: A physics-based walking speed band is the cheapest fix with the most visible effect on the gait, and it can be checked automatically.

9. **Make anticipation and phases shared, measurable rules for every move: prepare, execute, follow through, settle.**
   - What it means for the plan: Every move gets the same skeleton:
- a preparation the viewer can see (weight shift, look, countermovement);
- the action;
- a follow-through where the near segments slow while the far ones carry on;
- a recovery step or settle.
The timings are set from research, not guessed.
   - Evidence: Preparation timing:
- Anticipatory postural adjustments come about 100 ms before a movement (Aruin & Latash 1995/96), and about 50-60 ms before a fast wrist movement (Aoki 1991) (review: https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2016.00525/full ; https://pmc.ncbi.nlm.nih.gov/articles/PMC3094180).
- Starting to walk: the centre of pressure first moves backward and toward the swing leg, which drives the CoM forward and onto the stance leg (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5013047/).

Looking ahead:
- The head leads changes in walking direction by about 200 ms (Grasso et al. 1996), or by 0.2-0.6 s before the trunk across studies, with a peak head-to-path offset of 20-40° (Sreenivasa et al. 2008, https://link.springer.com/article/10.1007/s00221-008-1525-3).
- The head starts turning at a constant distance before a corner, not a constant time (Prévost 2002).
- Fixing the head changes trunk turn timing (Hollands et al. 2001, https://link.springer.com/doi/10.1007/s002210100811).
- During locomotion the head stays stabilised, with pitch under 20° and pitch velocities under 140°/s (Pozzo, Berthoz & Lefort 1990, https://scilit.com/publications/38ade9dab7675eda3317621e0d6cefde).

Perception: being able to see preparatory motion before a jump appears to matter for noticing errors, and viewers are more sensitive on more human-like characters (Reitsma, Andrews & Pollard 2008, https://www.ri.cmu.edu/?p=10106).

Animation craft: Lasseter 1987 says timing, anticipation, follow-through and overlap carry over directly to 3D (https://www.ics.uci.edu/~fowlkes/class/ics162/exercises/lasseter.pdf). Squash and stretch does not suit a rigid mannequin; overlap comes from joint lag instead.

Follow-through and stopping:
- In golf the pelvis slows before impact while the next segments speed up (Neal 2007, https://people.stfx.ca/smackenz/Courses/DirectedStudy/Articles/Neal%202007%20Body%20Segment%20Sequencing%20and%20Timing%20in%20Golf.pdf).
- Stopping or cutting uses a braking 'penultimate step' (https://link.springer.com/doi/10.1007/s40279-021-01583-x).
   - Fit: adopt
   - Why: These are exactly the owner's words ('the body anticipates turns, stops and landings'), turned into rules that every move inherits and a test can measure.

10. **Build natural variation as structured variability. Vary the details that don't matter, keep the task outcome accurate, and scale the movement with the task.**
   - What it means for the plan: 'No two attempts identical' should not mean random noise on every joint, which looks shaky. Small differences in timing, stance and joint paths should keep the release, contact point or foot placement on target. Larger tasks (farther throws, longer putts) should change amplitude (longer stride, more rotation, longer backswing) rather than speed alone.
   - Evidence: - Uncontrolled manifold: motor variability is concentrated in a redundant subspace, not suppressed everywhere (Scholz & Schöner 1999, Exp Brain Res 126:289-306).
- Optimal feedback control corrects deviations only when they affect the goal, so variability builds up in task-irrelevant dimensions (Todorov & Jordan 2002, https://www.nature.com/articles/nn963.pdf ; https://papers.neurips.cc/paper/2002/hash/8c5f6ecd29a0eb234459190ca51c16dd-Abstract.html).
- Free-throw study: joint-angle variability along the chain at release had no adverse effect, while release-velocity standard deviation alone predicted shooting performance (https://jssm.org/jssm-20-508.xml-Fulltext).
- Pros' kinematic-sequence timing is participant-specific (Cheetham et al. 2008, via secondary sources).
- Putting: double the backswing length and the ball goes about four times as far (Grober).
- Soccer: a wider approach angle increases pelvis rotation and thigh abduction (Scurr & Hall 2009, https://www.jssm.org/jssm-08-230.xml-Fulltext).
- Crowds: viewers spot motion clones regardless of the model they play on (McDonnell et al. 2008, https://research.gold.ac.uk/id/eprint/16142), and motion variety matters more than body-shape variety (Vyas & O'Sullivan 2024, https://arxiv.org/html/2412.16151v1). That matters for NPCs in lobbies.
   - Fit: adopt
   - Why: It produces human-looking variety without making the avatar look clumsy or the games feel random, and it follows the best-supported motor-control theory.

11. **DELIVERABLE 3. Automatic 'athletic' checks to run before the owner looks.**
   - What it means for the plan: Each pattern and move gets numeric pass/fail checks in the body test room. The owner only judges by eye once the numbers pass. Ranges come from research; thresholds marked 'design' are my suggestions to tune.
   - Evidence: A. PHYSICS OF WEIGHT (every move)
A1 Foot skate: a planted foot moves at most about 1 cm per stance (design). Sliding is allowed only along the blade on ice, skates or skis. Penetration at most about 0.5 cm (design). Same metric definitions as HUMOS: skate = share of frames where a contact foot has non-zero velocity; penetration = depth below the floor (https://arxiv.org/pdf/2409.03944).
A2 Support: while on the ground, the ZMP/CoP stays inside the support polygon; report the share of frames outside and the worst distance (HUMOS; DynaValid, https://perso.liris.cnrs.fr/npronost/Papers/DynaValid_GRAPHITE06.pdf). Quasi-static tasks (aiming darts, archery, putt, idle): XCoM inside the BoS with margin at least about 2 cm (design).
A3 Grip: horizontal CoM acceleration / (g + vertical acceleration) at most about 0.8-1.0 on normal ground (cutting peak 0.74±0.20, 95% up to 1.07). On ice, about 0.1 except for edge pushes (design).
A4 Lean matches acceleration: the angle of the CoP-to-CoM line ≈ atan(a/g) within about ±5° (design) during sustained acceleration, braking and curves. Standard physics, consistent with Kugler & Janshen 2010.
A5 Flight: with no contacts, CoM vertical acceleration = -9.81 ±0.3 m/s², horizontal velocity constant, angular momentum about the CoM constant. Viewers notice horizontal-velocity errors and added accelerations most (Reitsma & Pollard 2003).
A6 Smoothness: no jumps in joint velocity across blends (continuous up to acceleration). For discrete reaches, SPARC (spectral arc length) within the range of human reference data. SPARC is negative and closer to 0 means smoother; it does not depend on movement time, unlike jerk metrics (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9919347/). Reaches should have one bell-shaped speed peak (Flash & Hogan 1985).
A7 Limits: 0 frames past hard limits; end-range time only at ballistic peaks (design).

B. COORDINATION
B1 Whip order: peak angular speeds go pelvis, then thorax, then arm/forearm, then hand/implement (or thigh, then shank, then foot), each peak larger than the last.
- Pitching reference: pelvis 535-621°/s, upper trunk 1058-1155°/s, elbow extension 2202-2346°/s, shoulder internal rotation about 6700-7800°/s (Fortenbaugh & Fleisig ISBS table via search; I could not confirm the exact paper URL).
- Pitching timing: pelvis peak at about 28-35% and trunk peak at about 47-53% of the pitch timeline (Fortenbaugh, Fleisig & Andrews 2009, https://pubmed.ncbi.nlm.nih.gov/23015888/).
- Batting: hips 714°/s, then shoulders 937°/s, bat 31 m/s, front foot force 123% of body weight (Welch et al. 1995, doi 10.2519/jospt.1995.22.5.193).
- Golf: proximal-to-distal timing and rising peak speeds held across shot types, sexes and skill levels (https://pubmed.ncbi.nlm.nih.gov/21309298/).
- Soccer: thigh, then shank, then foot peaks; the thigh slows as the shank speeds up (https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235).
Use order plus tolerance, not exact timings, because timing varies by person.
B2 Hand-off: each proximal segment slows after its peak before the next one peaks (golf pelvis slows before impact, Neal 2007).
B3 Hip-shoulder separation: the pelvis opens before the chest.
- Pitching at foot contact: pelvis about 33±10° open while shoulders stay about 15° closed (Fleisig review via search). High-school separation 22-31° (https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989).
- Golf: separation grows early in the downswing (X-factor stretch 19% skilled vs 13% less skilled; Cheetham 2001 via https://acuresearchbank.acu.edu.au, Cole 2009 review).
- The separation-velocity link is weak and varies by individual, so require it present, not a fixed size.
B4 Plant: lead foot contact comes before the peak pelvis turn; lead knee about 45±9° at contact (pros 47-49°) and it must not collapse before release. Pitching stride about 77-85% of height. Kick support foot beside the ball, approach 30-45° (Isokawa & Lees via Scurr & Hall 2009).
B5 Steady push: fewer joints moving.
- Darts: elbow-led with a near-still upper arm.
- Putt: backswing about 2× the downswing duration, amplitude scaled with distance, little head movement (experts showed lower head displacement, not significant).
- Free throw: release before peak wrist velocity, release angle about 52° (Tran & Silverberg, via https://public-pages-files-2025.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2026.1732293/pdf).
B6 Jump: hip, then knee, then ankle extension, with the arm swing in sync. A longer proximal-to-distal delay correlated with jump height (r = 0.82 with arms) (https://read.qxmd.com/read/24476777/proximal-to-distal-sequencing-in-vertical-jumping-with-and-without-arm-swing).
B7 Landing: ankle, knee and hip all flex after touchdown. Soft drop landings from 59 cm reached 117° knee flexion vs 77° when stiff (DeVita & Skelly 1992, https://www.bisp-surf.de/Record/PU199305054938). Scale down for small hops.
B8 Gait.
- Walking: stance about 60%, double support about 20-24%, cadence about 111-122 steps/min near 1.3-1.46 m/s (https://medicine.missouri.edu/sites/default/files/pm-r/Normal_Gait.pdf), CoM vertical about 5 cm peak-to-peak (Lin, Gfoehler & Pandy 2014, https://www.doi.org/10.1016/j.jbiomech.2014.02.002), minimum toe clearance about 1.3 cm (Winter 1.29±0.45 cm, literature range 0.85-3.5 cm), opposite arm-leg swing.
- Running: no double support, a flight phase, and foot contact not far ahead of the CoM (overstriding).
- Walk only below Fr 0.5.
B9 Look ahead: head yaw starts 0.2-0.6 s before the trunk in turns, offset 20-40°; head pitch range under 20° during locomotion.
B10 Set before acting: CoP moves back and toward the swing foot before the first step; postural shift about 50-100 ms before fast arm actions.
B11 Stops and cuts: braking penultimate step with a lowered CoM for direction changes of 60° or more.
B12 Not frozen: adjacent joints should not move in rigid lockstep (lag greater than 0 between proximal and distal peaks). Learners first freeze degrees of freedom (Vereijken et al. 1992, https://scilit.net/publications/a9d4a6361e6be6ff52a2fb22c13a066a ; 10 of 13 studies support this, https://www.frontiersin.org/articles/10.3389/fpsyg.2020.01295/full).

C. VARIATION
C1 Ten repeats differ: between-trial joint-angle SD greater than 0. Outcome spread (release speed and point, contact point) should be smaller than joint spread alone would cause (uncontrolled-manifold ratio above 1).
C2 Timing differs a little each repeat (about 2-5%, design).
C3 No two NPCs play identical motion at the same time.
   - Fit: adopt
   - Why: Numbers catch physics and timing faults cheaply and objectively. That saves the owner's time and usage and makes 'athletic' a testable target, while the owner keeps the final visual judgment.

12. **Design the body test room to make the invisible visible, and judge the final look on the real mannequin, not a stick figure.**
   - What it means for the plan: The test room should offer:
- slow motion and ghost trails;
- overlays for CoM, XCoM, CoP and the support polygon;
- small live plots of segment angular speeds (to see the whip order);
- foot-contact markers;
- a side-by-side 'robotic baseline': the same move with all joints starting and stopping together on linear easing, so the owner's eye learns what to look for.
Use stick or debug views for checking numbers, but the owner's approval should happen on the actual rigid mannequin.
   - Evidence: Viewers were better at spotting motion differences on a polygonal human model than on a stick figure (Hodgins, O'Brien & Tumblin 1998; Graphics Interface 1997 precursor, https://graphicsinterface.org/proceedings/gi1997/gi1997-3/). Sensitivity to some ballistic errors was higher on more human-like characters (Reitsma, Andrews & Pollard 2008). Weight and dynamics are perceivable from joint motion alone (Runeson & Frykholm 1981). The owner already uses the Test Lab and slow motion (docs/AVATAR-DIRECTION.md says to judge by look and by numbers).
   - Fit: adapt
   - Why: It makes the owner's eye judgement faster and more consistent, and avoids approving motion that only looks fine in a simplified debug view.

13. **Build the foundation just in time for a few benchmark moves instead of completing every foundation piece first.**
   - What it means for the plan: Pick 3-4 benchmark moves that together use every layer, build only the foundation and pattern pieces they need, and pass the checks before widening:
(a) stand, step, stop: balance, getting ready to move, step, plant;
(b) step and throw overarm: coil, whip, plant, follow-through;
(c) jump and land;
(d) Follow the ball: reach, look, balance.
This keeps 'foundation first' while giving the owner something real to judge within the first chunks, which matters after walking was rejected 5-7 times.
   - Evidence: This is my process reasoning, not a sourced finding. It rests on the project history (docs/HANDOFF.md items 1-2: walking and running rejected and removed; last commit 747d0ba) and on the FMS/assessment tradition of judging competence with a small representative skill set (locomotor plus object-control items, e.g. Gallahue's categories, https://pmc.ncbi.nlm.nih.gov/articles/PMC4607429). Follow the ball was an earlier removed layer the owner liked enough to name in the plan.
   - Fit: adapt
   - Why: It lowers the risk of a long invisible foundation phase that later proves wrong for real moves, and every benchmark doubles as a regression test.

14. **Compare against real human recordings as reference envelopes, not just published averages (later).**
   - What it means for the plan: Once the core patterns exist, plot the avatar's joint-angle curves against real human recordings of the same action (walking, running, throwing) to see whether its curves fall inside the human range. Check data licences first.
   - Evidence: The CMU Graphics Lab Motion Capture Database is widely used, but sources conflict on its licence: some say free for all uses, others research-only (https://mocap.cs.cmu.edu/resources.php ; https://paperswithcode.com/dataset/cmu-motion-capture). A 2024 FBX conversion is CC BY-NC 4.0, i.e. non-commercial only (https://data.4tu.nl/datasets/0448aab2-3332-449f-a8e2-d208cb58c7df). I did not verify licences for open gait or running datasets (e.g. Fukuchi 2018 PeerJ).
   - Fit: later
   - Why: It is valuable for validation, but not needed to start, and the licence questions must be settled before any data enters a game project.

15. **Do not hard-code 'ideal technique' numbers from coaching material as exact targets.**
   - What it means for the plan: Use research values as ranges with tolerances (order of events, presence of separation, plausible magnitudes), not single 'perfect' angles or timings. Coaching-organisation numbers (e.g. TPI tour averages) should be labelled as coaching, not science.
   - Evidence: Pros' kinematic-sequence timing is participant-specific (Cheetham et al. 2008, via secondary sources). Hip-shoulder separation had only a weak link to pitch velocity and varied within pitchers (PubMed 41389727). X-factor size at the top of the backswing did not separate amateurs from pros (McTeigue 1994, cited in the Cole 2009 review). In a simulation, peak energies rose proximal to distal but peak timing did not follow a strict sequence (Kenny 2008). A strict proximal-to-distal pattern also breaks down if upper-arm internal rotation is excluded (critique cited alongside Putnam 1993). Some golf numbers found came from TPI coaching articles, not peer review.
   - Fit: reject
   - Why: Exact targets would make every swing identical and robotic, contradicting the owner's goal of natural variation, and many are not well supported.

16. **Check finger range and grips per object later.**
   - What it means for the plan: The fingers curl far less than human norms because the hand is thick and stylised. Instead of chasing human finger angles, add a grip test per object (bat, club, cue, bow, dart, ball, frisbee rim) when each minigame arrives.
   - Evidence: Repo finger 'closed' angles (bones.js FINGERS), e.g. index 32/45/15° and little 40/55/22°, versus commonly cited human MCP 90 / PIP 100 / DIP 90 (unconfirmed in this session). Finger radii are about 2.6-3.9 cm (FINGER_RADII), so less curl may still wrap an object. hands.js already curls fingers until they touch shapes.
   - Fit: later
   - Why: Grip quality depends on the object and the stylised hand, so a per-object test answers the real question more directly than a finger range-of-motion table.

### Tests run

1. **Physics calculations in a scratch script ((scratch folder, not saved) movement/biomech/froude.py and an inline python run): Froude walking limits for the avatar's 0.8395 m leg length, lean angle and grip needed for the controller's accelerations and turns, braking distances.**
   - Result: Walk-to-run switch at about 2.03 m/s, pendulum walking limit about 2.87 m/s; the repo walk at 3.1 m/s is Fr 1.17. 0 to 8.6 m/s takes 0.27 s in the repo, against a 0.88-1.25 s physical minimum at μ 0.7-1.0. Brake slides need 4.9 g (short) or 1.8 g (long); the shortest human stop from 8.6 m/s is 3.8-5.4 m. A steady 32 m/s² would need a 73° lean.
   - Limits: These are physics bounds from simple formulas. Fr 0.5 and Fr 1 are population and model values. I did not run the controller itself to measure actual path accelerations, and the effective lateral acceleration depends on how drift fading works in controller.js, which I did not inspect.

2. **Read repo files to compare research values with the current code: motion-core/skeleton/bones.js (limits), avatar/src/joints/ankle-contract.js, motion-core/tuning.js, motion-core/skeleton/balance.js and reach.js headers, motion-core/PLAN.md, docs/AVATAR-DIRECTION.md, docs/MINIGAMES.md, docs/HANDOFF.md (parts).**
   - Result: Confirmed 63 bones (5 centre + 9×2 side + 20×2 finger/palm). Trunk lateral and forward bend limits are 0 at the waist, chest forward bend 0-15°, clavicle ±4°. balance.js is a static CoM-over-feet model using Winter/Dempster masses. tuning.js labels its speeds as game-feel numbers.
   - Limits: Read only; nothing in the repo was modified. I did not run the repo's own test suites.

3. **Web research through WebSearch (about 45 queries) on FMS taxonomies, kinetic chain and sport biomechanics, joint range-of-motion norms, balance, anticipation, perception of motion, variability, gait norms, joint-limit representations and motion-quality metrics.**
   - Result: Sources are listed in each finding. Most claims are confirmed by at least one search summary of the primary paper or of a secondary source citing it. Unconfirmed values are marked as such.
   - Limits: WebFetch failed: www.physio-pedia.com and archive.cdc.gov did not resolve in this cloud session, so I stopped trying further hosts. No full texts were read; numbers come from search-result summaries. Some range-of-motion values (inversion/eversion, toe and finger ranges, ulnar deviation 30) and some sport numbers (Fleisig review values, Fortenbaugh ISBS table URL) could not be traced to an exact primary page.

### Risks
1. Range-of-motion norms differ between sources (AAOS 1965 vs Greene & Heckman 1994 vs Kendall vs Soucie 2011). Values here come from secondary reproductions, so verify against the AAOS book or the CDC tables (archive.cdc.gov must be allowed in the network settings) if exact numbers matter.
2. The rigid shell, not the code, may be the real limit: wider trunk bend and clavicle motion need socket and rim geometry changes. Those touch owner-approved visuals and the 'no sharp edges' rule.
3. Making movement physically plausible conflicts with the owner's earlier decision to keep 3D-WORLD-3 speeds and accelerations exactly. It must go to the owner as a choice: plausible body-led motion, game-feel root motion with the body faking it, or a capped blend.
4. Most sport numbers come from adult, often elite, male lab subjects. This avatar is stylised (0.84 m legs on a 1.9 m body; the new avatar's proportions may differ), so speeds and timings should be scaled by leg length and treated as ranges.
5. Strict ordering checks can fail on realistic motion, because timing varies by person and some studies question strict proximal-to-distal order. Use order plus tolerance, and don't require exact timings.
6. Numbers can pass while the motion still looks wrong, and stylised game feel may want controlled exaggeration (Lasseter). The owner's eye stays the final judge; checks only filter out clear faults.
7. CMU motion-capture licensing is unclear and a common conversion is non-commercial. Don't ship or train on any reference data until its licence is verified.
8. Swimming is not covered by the 12 patterns and needs its own water and buoyancy model.
9. The controller.js drift and turn behaviour was not inspected, so the actual lateral accelerations may be lower than the heading-rate calculation suggests. They are still bounded by the 26 m/s² drift bleed, well above human grip.

## Research: feasibility
**Summary:** The approved "body foundation first" plan holds up against the real code. Five changes would make it safer. I tested it with the repo's own modules, imported read-only and run from the scratch folder; nothing in the repo was changed (git status is clean).

What works: the reaching code is solid where the joint limits allow the pose. The removed "Follow the ball" demo, rebuilt through the same pose-player calls, landed the palm on the ball in 100% of frames at 30, 60 and 120 fps and at jumpy frame rates. Error was 0.0 mm and each frame cost about 0.5 ms on this server.

A test throw built only from base patterns (step-and-plant, hip turn, trunk turn, arm swing) gave the right "whip" order. Pelvis, then trunk, then upper arm, then forearm, then hand each peaked later and faster: 791, 972, 3121, 3170 and 4068 °/s. The hand reached about 30 m/s. The order held in 40 of 40 throws with random timing jitter, so natural variation does not break it. That only worked once each pattern was given an explicit time for its peak speed. With the existing keyframe clips (Catmull-Rom), the peaks landed 40 ms early, in the wrong order, and the hand had only half its speed at release.

The five changes:

1. Re-measure the skeleton from the new 6 ft 4 in avatar. Today's bones come from the old 1.89 m model.

2. Replace the per-axis joint limits with "cone plus twist" limits set to human ranges. Today the trunk cannot bend sideways or backward and bends forward only 15° (human about 80°). The arm cannot cross the body (10° allowed). Reaching across the chest failed 100% of the time. With a human-like limit the same solver reached exactly.

3. Use soft limits so a joint eases into its end stop instead of snapping. Every IK jump over 8° in a frame happened at a joint limit. The palm-facing success rate dropped from 94% to 66% as targets moved toward the edges of the range.

4. Treat balance as moving balance, not standing balance. Plan the stride with a simple falling-pendulum model (capture point). The current balance code only checks standing balance. With pendulum timing, both feet stayed exactly on their spots and the centre of mass stayed over the back foot through the whole stride. With my hand-made timing it was off the support in 67% of stride frames. Keep the current balance code as a final corrector: it worked out the 4.3 cm fix for an unstable end stance.

5. In step 3, make "targets" a real solver that meets a release point and direction while keeping the timing. Timing patterns alone threw the ball 50° into the ground. Fixing the direction by choosing better key poses broke the whip order and cost 30% of the hand speed.

The plan also needs to say:
- "Plant" includes releasing the back foot (letting it lift or drag through). Otherwise the back leg locks straight and its foot slips 13 cm.
- These short legs limit a realistic stride to about 0.30 m.
- Springs on joints add follow-through but do not create the whip.
- Real momentum and ragdoll later means physics (powered ragdoll joints).

Limits of this work: nothing was rendered, no phone was measured, and I hand-tuned a single throw.

### Findings

1. **Keep the solid core libraries: forward kinematics, quintic curves, pose player layers and fades, two-bone reach, palm solver, centre of mass and support code. Rebuild them cleanly; do not reinvent them.**
   - What it means for the plan: Foundation step 1 (reach any target) can start from proven algorithms. Rebuild effort goes into limits, balance dynamics and code hygiene, not new IK math.
   - Evidence: Test 2, t2_follow.mjs. The removed Follow-the-ball was rebuilt exactly: same path c=[.24+.16cos(1.4t), 1.32+.18sin(1.4t), .42+.06sin(2.8t)], touch radius 3.5 cm, player.setGoals with fade .6 and follow:true. Success (palm surface error <1 mm, facing <2°) was 661/661 frames at 60 fps, 100% at 30 fps, 120 fps and jittery 8-50 ms. Worst error 0.0 mm, p99 facing ≤0.12°, max joint step 0.9°/frame at 60 fps. Mean 0.45-0.63 ms per frame, p95 0.87-1.36 ms. With planted feet plus balance: mean 1.47 ms. A 3x faster ball (about 0.7 m/s) still scored 100%. Position-only goals on a random reachable path: 100%. skeleton.solve takes 10.7 µs per call.
   - Fit: adopt
   - Why: Measured to work at every frame rate. The removed layers' failures were not in these modules.

2. **Re-measure the skeleton (bones.js) from the new 6 ft 4 in avatar before any movement work.**
   - What it means for the plan: Add a step 0 to the foundation: joint centres, bone lengths, contact points, palm point and waist pivot come from the new avatar, with automatic checks that every ball stays seated.
   - Evidence: bones.js says its pivots were measured from Checkpoint 2 at 1.8945 m. HANDOFF items 69-79 changed the new avatar. Height is 1.9304 m. Thighs are +3.57 cm and calves +2.97 cm. Hip balls moved 8.2 mm closer to the middle. Wrist balls went 5 cm deeper, so the arms are 5 cm shorter. The neck is a plain cylinder. The torso is split at the waist (item 81). avatar-v2/limb-options.js imports SIDE from motion-core/skeleton/bones.js but then moves joints.
   - Fit: adopt
   - Why: Every later number (reach, stride, balance) depends on bone lengths. The tests here used the old skeleton, so stride limits will shift a little with the longer legs.

3. **Replace per-axis Euler box limits on ball joints (shoulder, hip, waist, neck) with swing-twist limits stored as quaternions: a cone or ellipse for where the bone points, plus a twist range about the bone.**
   - What it means for the plan: Foundation item 'every joint moves through a realistic human range' needs a new joint-limit representation, not just new numbers. Author poses as 'point the limb here, turn it this much', not Euler triples.
   - Evidence: Test 1b/1c/1d (t1_rom.mjs). Uniform samples inside the shoulder box gave twist about the arm's own axis above 90° in 34.4% of poses and above 120° in 17.4%, max 180°. This is indicative only, because the twist reference is shortest-arc. The hip box is fine (max twist 80°). The same Euler 'y' swings the arm forward or back depending on 'x'. In t3_cal.mjs a follow-through key came out pointing backward, so I had to author arm keys as direction plus twist (throwlib.mjs armAngles). Baerlocher & Boulic recommend swing-and-twist for ball-and-socket range of motion.
   - Fit: adopt
   - Why: Box limits both allow impossible twists and forbid common poses. Swing-twist is the published standard for anatomical ball-joint limits.

4. **Widen limits to human norms where gameplay needs them. Shoulder: horizontal adduction across the body and a larger collarbone range. Trunk: real flexion, extension, side-bend and rotation at the new waist joint. Front hip: adduction. Check each against the mesh.**
   - What it means for the plan: Throws, swings, two-handed grips, catching across the body and bowling all need across-body arms and trunk tilt. List these as foundation acceptance tests.
   - Evidence: Test 1a (t1_out.txt), skeleton vs AAOS-style norms (from memory; partly confirmed by search snippets). Trunk flexion 15 vs ~80, extension 0 vs 25-30, side-bend 0 vs 35, rotation 50 vs 45. Collarbone shrug 4 vs ~30-45, protraction 4 vs ~15-30. Shoulder adduction 10 vs 30-50. Hip adduction 20 vs 30. Toe extension 55 vs 70-90. Ankle dorsiflexion 36 vs 20 (more than human). Test 1d: the upper arm can point at most 10.0° toward the midline, so the elbow can never be more than 5.4 cm inward of the shoulder. Test 2 B4 (across body): 0% success, worst 73 mm. Test 2b brute force: a wrist target at x=-0.10 is 101.6 mm out of reach inside the limits. With shoulder adduction -50° (what-if), reach.js landed x=0.00 and x=-0.10 at 0.0 mm. In the throw, missing trunk side-bend forced about 125° of shoulder elevation instead of the human ~95° for an overhand-looking release. In the throws: front hip at its -20° adduction limit in 67-72 of 150 frames. Shoulder Euler y at ±90 in 56 frames. Back ankle roll at ±20 in 74-76 frames.
   - Fit: adopt
   - Why: Cheap to change, and it directly unblocks planned sports motions. The owner already accepted cup overlap when joints bend (HANDOFF 75c), so the mesh check is about not distorting the shape.

5. **Soft joint limits (ease into the end of range, as reach.js already does for the ankle with tanh) plus elbow and knee swivel continuity, instead of hard clamping.**
   - What it means for the plan: The foundation should guarantee no snaps near limits. That is the 'spaz' symptom the owner saw before.
   - Evidence: Test 2b. On a random reachable wrist path, 18 frames jumped more than 8° per frame. All 18 had a joint at its limit (upperArm z, elbow about -118°), with 10-29° swivel jumps over about 6 frames. Palm plus facing on paths that are guaranteed reachable: 93.8% success with joints in the middle 40% of range (0 jumps). 84.2% at 60% (43 jumps, max 179.7°/frame). 65.5% at 80% (135 jumps, worst miss 130 mm). This matches NEXT.md item 40b's known limit. clampPose in skeleton.js hard-clamps every joint. Only the ankle uses softClamp (SOFT=8).
   - Fit: adopt
   - Why: Limit-binding is where every measured discontinuity came from. Smooth limits are a small, contained change.

6. **Build base patterns as sums of min-jerk (quintic) changes, each with an explicit peak-speed time and duration. Use these, not Catmull-Rom keyframe clips, for athletic sequencing.**
   - What it means for the plan: Step 2 (base motion patterns with proximal-to-distal timing) is feasible with the existing quintic machinery. The timing becomes plain numbers that the owner's feedback can tune, and natural variation is a small jitter on those numbers.
   - Evidence: Test 3 (t3_throw.mjs, throwlib.mjs). It uses only the repo's pose player: fn layers, 2 planted-feet reach goals and shoulder follow, at 120 Hz.
Version 0, arm as existing createClip keys: order false (upper arm peaked at .758, after forearm and hand at .750). Hand peak 22.4 m/s at .750, 40 ms before the planned .79 release. 11.1 m/s at release.
Version A, min-jerk patterns:
- order true, sizes increasing: pelvis yaw 791°/s @.617, trunk 972 @.650, upper arm 3121 @.775, forearm 3170 @.783, hand 4068 @.792.
- palm peak 30.5 m/s @.783; 28.1 m/s at the planned release .79.
- front foot 0.0 mm off after contact.
Test 3a (t3d_var.mjs), 40 jittered throws (peak times ±6-10 ms s.d., amplitudes ±3° s.d.): order kept 40/40. Speed 30.3 ± 0.6 m/s. Release direction varied ±3.6° left-right and ±6.1° up-down.
A search snippet reports peak pelvis velocity at 25-39% and peak upper-torso velocity at 51-52% of the foot-contact-to-release time. My pelvis and trunk peaks fell at 9% and 26%, earlier than that. With explicit peaks this is a one-number retune.
   - Fit: adopt
   - Why: It directly gives the owner's whip-like timing, survives randomness, and costs nothing extra. Keyframes made peak placement uncontrolled.

7. **Specific moves (plan step 3) need a small solver that meets task-space targets together with the timing: release point, release direction and speed, and hands on the bat. 'Patterns plus targets' should not mean blending IK on top afterwards.**
   - What it means for the plan: Make step 3 explicit: each move is a few timing parameters plus a few key poses, fitted by a solver to the targets with peak order preserved. Fit offline per move, or at runtime with a handful of parameters. Then check it in the body test room.
   - Evidence: Test 3/3e. Version A's palm velocity at peak speed pointed 50.3° downward and 33.8° sideways: into the ground. t3e_dir.mjs grid search over follow-through key direction and arm timing (75 combinations, across-body directions excluded by the limit). The best release direction was yaw -10°, pitch -8°, but proximal-to-distal order became false and peak hand speed dropped to 21.4 m/s (from about 30). Timing and hand path are coupled in joint space.
   - Fit: adapt
   - Why: The plan already says 'plus targets'. The test shows targets must be solved together with timing, otherwise you get correct timing with wrong direction, or the reverse.

8. **Make balance dynamic. Plan the centre of mass for steps, plants and weight transfer with a linear inverted pendulum (capture point or divergent component of motion). Keep the existing static balance.js as a final corrector. Add margin-of-stability and ZMP plausibility checks to the test room.**
   - What it means for the plan: Foundation item 'body keeps balance over the feet' should be the dynamic kind. This is also what physically produces 'the body anticipates': it leans before it steps.
   - Evidence: balance.js only checks centre of mass over support (static). Phase breakdown, version A (hand-authored hip travel), stride phase: static centre of mass off the support in 67% of frames, extrapolated centre of mass (XCoM) off in 69%, ZMP (cart-table) off in 91%. COM was accelerated about 8x faster than gravity allows from that lean. Version C3 (t3c2.mjs): COM along the throw planned as a pendulum over the back foot, with the centre of pressure 5 cm toward its rear edge (a push), a 0.65 s stride and root = planned COM minus measured offset (tracking error 0.2 mm after 4 passes). Results: back foot 0.0 mm and front 4.2 mm off; stride phase static COM off 0%, ZMP off 13%; peak order still true. Variants with a 0.35-0.5 m/s rock-back start diverged exponentially: COM 63-84 cm ahead at contact, feet off 37-66 cm. So plan with boundary conditions (capture point), not by integrating forward. C3 final stance: COM 4.3 cm outside a narrow in-line base. balance.js balanceShift (axes xz, policy inside) returned exactly the -4.3 cm fix. Sources: Hof 2005 XCoM; Pratt 2006 capture point; Kajita 2003 ZMP preview control.
   - Fit: adopt
   - Why: Static balance is the wrong test for athletic motion (Hof 2005). Pendulum planning is cheap (closed-form, 1-D per axis), deterministic, and measurably fixed the stride.

9. **The 'plant' pattern must include its partner, 'release and step-through' of the trailing foot. Size stride limits from leg reach.**
   - What it means for the plan: In base patterns, plant comes with release, pivot and drag. For throws, swings and kicks, the trail foot must be allowed to lift or drag. Stride is reach-limited for this avatar.
   - Evidence: Version A: after t=0.72 the back foot was up to 132 mm off its spot in 65/150 frames. The back knee was locked straight (shin x=0) in 65 frames, and the body would have needed 52 cm of lowering (capped at 15). Changing stride length to 0.35, 0.45 or 0.60 m changed nothing, because the hips' forward travel caused it. A pivot on the ball of the foot alone (35° turn, 22° heel up) still left 145 mm. Gravity-timed versions: stride 0.36 m left the front foot 93 mm short; stride 0.30 m worked (feet 0.60 m apart, about 31% of height). This is consistent with HANDOFF item 76: thigh about 20% short of human proportion.
   - Fit: adopt
   - Why: Real throwers' trailing legs come off the ground. A planted-forever back foot is physically impossible once the hips drive forward.

10. **Use joint springs (second-order lag) only for follow-through and heavy-limb overlap, not to create the whip. Real momentum and ragdoll follow-through later means physics-driven joints, e.g. Rapier (WASM) joints with motors.**
   - What it means for the plan: The 'heavy limbs, ragdoll-like follow-through' goal splits in two: a cheap kinematic secondary-motion layer now, physics later with the ragdoll phase.
   - Evidence: t3d_var.mjs: one simultaneous arm command filtered by critically damped springs, distal joints slower. With 8/16/24 ms: upper arm and forearm peaked at the same instant (.792), hand at .800; hand speed 26.7 m/s vs 31.8 unfiltered (-16%). With 15/30/45 ms: all three peaked at the same instant, 23.5 m/s (-26%). The order check passed only because ties count as passing. Rapier's documentation says its spherical and revolute joints support motors with a target position, stiffness and damping (Rust guide; JS bindings exist but method names were not checked).
   - Fit: later
   - Why: Springs smear the peaks rather than sequence them, but they are a valid cheap way to add lag. True interaction torques (Putnam 1993) need dynamics.

11. **Use a quaternion root that turns about the pelvis, not Euler XYZ about the feet origin with linear Euler blending.**
   - What it means for the plan: Clean-rebuild contract for the body's position and turn.
   - Evidence: skeleton.solve applies root rotation as Euler XYZ about the avatar origin (0,0,0, at floor level). blend() mixes root Euler angles linearly. To lean forward while side-on (yaw -90), throwlib.mjs had to compose a yaw-then-pitch quaternion, convert it back to XYZ, and offset the position so the turn happens about the pelvis point. The removed demos.js body() did the same by hand.
   - Fit: adopt
   - Why: It removes a class of gimbal and wrong-axis bugs, like the world-frame sideways-shift bug found in NEXT.md 44a.

12. **Make the hot paths allocation-free (preallocated vectors and typed arrays) and budget per-avatar cost.**
   - What it means for the plan: A 'professional, solid' rebuild criterion with a measurable target (for example no garbage per frame, and a p99 budget per avatar).
   - Evidence: t4_cost.mjs on an Intel Xeon 2.1 GHz, Node 22, 30 repetitions after warm-up at 60 Hz. Throw stack (5 layers, 2 planted feet, shoulder follow): mean 0.686 ms, p95 1.04, p99 1.66, max 10.96. Layers only: 0.231 ms. Two planted feet: 0.303 ms. Feet plus balance: 0.671 ms. Palm on a ball: 0.768 ms. t4_gc.mjs: at least 17 KB of heap garbage per frame; 992 minor GCs during the benchmark. Likely the cause of the 5-11 ms max spikes (inferred, not proven). Not measured on an iPhone.
   - Fit: adopt
   - Why: One avatar fits easily in a frame, but several avatars plus phone GC pauses make spikes visible. Fixing this during the rebuild is cheap.

13. **Restore the removed layers' good ideas as clean modules after the foundation; keep the lessons from why walking failed.**
   - What it means for the plan: Head-look and foot planning return as foundation modules. Walk and run return only after step 2, with an explicit speed-to-gait contract.
   - Evidence: git show 747d0ba. look.js distributes a turn across waist, chest, neck and head within limits (19 checks in NEXT.md 40a). footplan.js: plants held exactly, steps as pure functions of time, clearance checked 320 times per step (27 checks, NEXT.md 38). Walking failures, per NEXT.md 41-47: game speeds of 3.1 and 8.6 m/s on 0.68 m legs forced 4.7-7.6 steps/s and skating at 40-60% of body speed; a reactive walker glitched on button switching; everything was judged in stick figures and numbers. In the throw test, neck plus head (±80°) could not keep facing the target while side-on: head and neck yaw at their limits in about 75 of 150 frames.
   - Fit: adopt
   - Why: These modules passed their own tests. The rejections came from the speed and leg-length mismatch and from integration, not from their core math.

14. **Give the body test room automatic pass/fail checks shown next to the owner's visual judgement. Checks: joint limits and soft-limit margin, foot slip, swivel jumps per frame, XCoM margin, ZMP plausibility, peak order and timing, release direction and speed, jitter spread, cost per frame.**
   - What it means for the plan: Every step of the plan gets measurable acceptance criteria before the owner looks, which saves owner usage.
   - Evidence: Every defect in this report was caught by such a number before any rendering: backward release, back-foot slip, front-hip limit, non-physical stride acceleration, unstable final stance. The scripts in the scratch folder already compute all of them.
   - Fit: adopt
   - Why: Passing checks do not prove the motion looks right (CLAUDE.md A3), but they stop obviously broken motion from reaching the owner.

### Tests run

1. **Test 1a: joint-by-joint range of motion of the current 63-bone skeleton (motion-core/skeleton/bones.js), compared with human norms. Script: (scratch folder, not saved) movement/feasibility/t1_rom.mjs; output: (scratch folder, not saved) movement/feasibility/t1_out.txt**
   - Result: 62 of 63 bones have limits (pelvis root has none). Locked axes: spine x,z; chest z; collarbone x; elbow z; wrist y; hip bone all; knee y,z; ankle twist; toes y,z. Close to human: knee, elbow, forearm, wrist, hip flexion, extension and abduction, neck and head rotation. Far below human: trunk flexion (15 vs ~80), extension (0 vs 25-30), side-bend (0 vs 35); collarbone (4° vs ~15-45); shoulder adduction (10 vs 30-50); toe extension (55 vs 70-90). Above human: ankle dorsiflexion (36 vs 20).
   - Limits: Human values are AAOS-style norms from memory, only partly confirmed by search snippets. The CDC/Soucie tables and AAOS handbook were not read in full; pmc.ncbi.nlm.nih.gov is not reachable from this session (DNS blocked). The anatomical reading of each Euler axis is valid only near the hanging pose.

2. **Test 1b-1d: swing-twist analysis of the per-axis Euler box on shoulder and hip (200,000 uniform samples), 15 athletic target orientations, and exact maximum across-midline angle.**
   - Result: Shoulder: twist >90° in 34.4% and >120° in 17.4% of box poses, max 180°. Hip: max 80°. Representable: throw cocking, layback ER ~150, release, hand behind back, kick follow-through, pitching stride hip, deep squat. Not representable: arm across the body (45-65° outside the box), golf/bat lead arm across chest (45°), bowling backswing (10°). Upper arm can point at most 10.0° across the midline; thigh 20.0°.
   - Limits: The twist reference is shortest-arc from hanging, so twist percentages are indicative (Codman's paradox). Target orientations were constructed by me, not taken from motion capture.

3. **Test 2: reach/IK following moving targets through the real pose player, rebuilt Follow-the-ball setup, 10 scenarios. Script: (scratch folder, not saved) movement/feasibility/t2_follow.mjs; output: (scratch folder, not saved) movement/feasibility/t2_out.txt**
   - Result: Original ball: 100% success at 30, 60, 120 fps and jittery 8-50 ms. 0.0 mm error, max 0.9°/frame at 60 fps. Mean 0.45-0.63 ms (1.47 ms with feet plus balance). 3x faster ball: 100%. Wide path (overhead, low, far, near midline): 38.9% overall (81.7% of frames within arm length; 47.7% success on those), 118 frames over 8°/frame. Random reachable palm path with facing from the shoulder: 61.6%. Random reachable wrist path (position only): 100% but 22 frames over 8°. Across the body: 0%, worst 73 mm.
   - Limits: Success threshold is my choice (<1 mm and <2°). Timings are from Node on a server Xeon, not a phone. The touch goal's facing rule (face away from the shoulder) is not always feasible, so 'reachable' only means within arm length.

4. **Test 2b: failure diagnosis. Guaranteed-feasible palm-plus-facing paths at 40, 60 and 80% of joint range; brute-force (400k samples plus refinement) feasibility of wrist targets across the chest; what-if shoulder adduction -50°; location of position-IK jumps. Script: (scratch folder, not saved) movement/feasibility/t2b_diag.mjs**
   - Result: Feasible palm paths: 93.8%, 84.2% and 65.5% success (0, 43 and 135 jumps over 8°). Across-chest wrist targets: x=0.00 best possible 2.3 mm (reach.js 18.5); x=-0.10 best 101.6 mm (reach.js 198.3). With adduction -50°, reach.js reached x=0.00 and x=-0.10 at 0.0 mm. All 18 position-IK jumps happened with a joint at its limit (upperArm z, elbow about -118°).
   - Limits: Brute force covers wrist position only (4 joint angles), not palm facing.

5. **Test 3: throw composed from base patterns (stride and plant, pelvis turn, trunk turn with separation, arm swing, glove arm, head look) using only the existing pose player, layers, clips and reach. No rendering, 120 Hz. Versions: 0 (clip arm), A (min-jerk patterns), B (back-foot pivot). Scripts: (scratch folder, not saved) movement/feasibility/throwlib.mjs and t3_throw.mjs; output: (scratch folder, not saved) movement/feasibility/t3_out.txt**
   - Result: Version 0: order false, hand peak 22.4 m/s 40 ms early, 11.1 m/s at release. Version A: order true and increasing (791, 972, 3121, 3170, 4068 °/s at .617, .650, .775, .783, .792 s); palm 30.5 m/s peak, 28.1 at release; front foot 0.0 mm. Back foot off up to 132 mm after t=0.72 (back knee locked straight in 65 frames). Stride phase: static centre of mass off 67%, XCoM off 69%, ZMP off 91%. After contact: static 0%, XCoM 11%. Joints at limits: front hip adduction (~70 frames), shoulder Euler y (56), back ankle roll (~75), neck and head yaw (~75).
   - Limits: One throw, hand-tuned by me; key poses are my judgement of a plausible overhand throw. Angular velocities come from finite differences of world rotations. ZMP uses the cart-table point-mass model and ignores angular momentum, so it is only indicative in the arm-acceleration phase. Literature values for pitchers are not fully verified (only IR about 7500-7700 °/s and peak timing percentages, from a search snippet).

6. **Test 3c: centre of mass planned with a linear inverted pendulum during single support, iterated root correction, back-foot pivot. Variants C2-C6. Scripts: t3c_lipm.mjs, t3c2.mjs and t3c_end.mjs in (scratch folder, not saved) movement/feasibility/**
   - Result: C3 (centre of pressure 5 cm back, stride 0.30 m, 0.65 s stride): feet 0.0 / 4.2 mm off; stride phase static off 0%, ZMP off 13%; order true; release 27.9 m/s. Drive phase still ZMP off 67-72%. Final stance 4.3 cm outside; existing balance.js computed exactly a -4.3 cm correction. C2 (gravity fall from rest, 0.36 m stride): front foot 93 mm short. C4-C6 (rock-back start): exponential divergence, feet off 37-66 cm.
   - Limits: 1-D (along the throw) pendulum with constant height. Sideways and post-contact phases were not planned dynamically. Cart-table ZMP model.

7. **Test 3d/3e: natural variation (40 jittered throws), springs on a simultaneous command vs authored offsets, and a 75-point search for a forward release direction. Scripts: t3d_var.mjs and t3e_dir.mjs; output: t3d_out.txt (same scratch folder)**
   - Result: Jitter: order kept 40/40; 30.3 ± 0.6 m/s; direction ±3.6° left-right and ±6.1° up-down, but the mean was 50.3° downward and 33.8° sideways. Springs 8/16/24 ms: peaks bunched (upper arm = forearm at .792), -16% hand speed. 15/30/45 ms: all equal, -26%. Best key-pose release: yaw -10°, pitch -8°, but order false and 21.4 m/s.
   - Limits: Euler-space interpolation of arm keys. The search space was small (follow-through direction and one timing shift).

8. **Test 4: stable per-frame cost (30 repetitions after warm-up) and garbage per frame. Scripts: t4_cost.mjs and t4_gc.mjs; output: t4_out.txt (same scratch folder)**
   - Result: Throw stack mean 0.686 ms (p95 1.04, p99 1.66, max 10.96). Layers only 0.231. Two planted feet 0.303. Feet plus balance 0.671. Palm on ball 0.768. Forward kinematics 10.7 µs. At least 17 KB garbage per frame; 992 minor GCs during the run.
   - Limits: Intel Xeon 2.1 GHz, Node 22 (V8). No phone measurement. Linking the GC count to the max spikes is an inference.

### Risks
1. Nothing was rendered. Every result is numeric, and only the owner's eyes (and a real phone) can judge whether the throw looks athletic. The throw is one example I hand-tuned (key poses, timings), not a general system.
2. All tests used the old skeleton (Checkpoint 2, 1.8945 m). The new 6 ft 4 in avatar has longer legs and 5 cm shorter arms, so stride and reach numbers will shift. Re-measuring is a prerequisite.
3. Human range-of-motion norms in the table are AAOS-style values from memory, only partly confirmed by search snippets. pmc.ncbi.nlm.nih.gov does not resolve in this session's network, so the CDC/Soucie tables and pitching papers were not read in full. Pitching segment velocities beyond IR ~7500-7700 °/s and the peak-timing percentages are unverified.
4. The ZMP check uses the cart-table point-mass model, which ignores angular momentum from the trunk and arm. Its 'outside' percentages during arm acceleration overstate the problem. A full multi-body ZMP needs segment inertias the skeleton does not have yet.
5. Swing-twist percentages for the shoulder box use a shortest-arc twist reference (Codman's paradox), so they are indicative, not exact.
6. Widening limits (shoulder adduction, trunk side-bend and extension, collarbone) may make the rigid mesh visibly intersect or distort. The owner accepted cup overlap but not distortion. Each widened range needs a mesh check.
7. Cost numbers are from a 2.1 GHz Xeon under Node/V8. iPhone Safari (JavaScriptCore) performance was not measured. Several avatars multiply the cost roughly linearly.
8. Provenance: controller.js and tuning.js are ported from 3D-WORLD-3, and NEXT.md items 13-27 refer to an SM64 walk-pose reference (/references/sm64-walk/). Under this task's rule (no Mario/SM64 data), the rebuild should confirm none of its numbers or references come from SM64 material. I did not use any.
9. Pendulum (capture point) planning is exponentially sensitive. The rock-back variants diverged by 37-66 cm, so it must be implemented as a boundary-value planner (capture point / DCM), not forward integration, or it will reintroduce glitches.
10. The dynamic-balance and task-target solver recommendations add real complexity. If they are not staged and tested one at a time (owner rule: one movement at a time), they risk repeating the 5-7 rejected walking attempts.

## Improved plan
**Verdict on owner plan:** Sound. Keep the owner's three layers. 'Body foundation first, then base motion patterns, then specific moves, ragdoll later' is how proven games build movement that adapts to the situation: Ubisoft's IK Rig, Overgrowth and Valve's Half-Life: Alyx walkers all run simple rules on a solid body and aim hands and feet at targets. Sports science builds skill the same way, with basic movement skills first and sport skills built from them. None of the three research teams found anything arguing for a different structure. A read-only test on the repo's own code backs it up: a throw built only from step, plant, hip turn, trunk turn and arm swing produced the correct legs-to-hand whip order in 40 of 40 attempts with random timing changes. As written, though, the plan has gaps that could cause another rejection. (1) There is no step zero for the decisions everything rests on. The biggest one: the game's walk speed (3.1 m/s) and its acceleration (about 3.3 g) are more than this body's legs can believably show. Even with the new 6 ft 4 in legs, 3.1 m/s is just past the natural walking limit (my estimate). Earlier walks failed partly because of this, no body layer can fix it, and the owner must decide it before walking returns. (2) 'Balance over the feet' covers standing only. A moving body keeps its balance through where the next foot lands. (3) 'Looks where it goes' should become 'looks where it will be'. That needs a cheap 'where am I going' predictor, which tested exact on the repo's controller. (4) Human joint ranges need a new way of storing limits, not just new numbers. Some ranges (trunk bend, collarbone, arm across the body) are blocked by approved sockets, so widening them is an owner decision. (5) The whip suits power moves only. Precision moves (darts, putt, archery, pool) need a 'steady push' family. (6) Targets must be solved together with timing: timing alone threw the test ball 50 degrees into the ground. (7) Heavy limbs need a cheap 'muscle' spring layer. (8) Building the whole foundation before any real move risks a long phase with nothing to judge. Each foundation piece should be built just in time for a few benchmark moves, so the owner judges real moves early.

### Alternatives compared

1. **A. Improved body-foundation-first: the owner's three layers plus a step zero, moving balance, predictor, muscle layer, two timing families, target solver and benchmark build order (recommended)**
   - Score: 4.2
   - Why: Athletic look 4, adaptability 5, solo-dev cost 3, phone 4, fit with rigid ball-jointed avatar 5, low rejection risk 4. It keeps every strength of the owner's plan and adds the proven pieces that answer the owner's own words ('anticipates turns, stops and landings', 'heavy limbs', 'no two attempts identical'). The look is capped at 4 because procedural motion without motion capture rarely reaches AAA realism. Cost is moderate because about 20 sport moves still need hand-authored key poses.

2. **B. The owner's approved plan exactly as written**
   - Score: 3.8
   - Why: Athletic look 3, adaptability 4, cost 3, phone 5, fit 5, rejection risk 3. The structure is right. As written, static balance would make moving actions look stiff, a whip on every move would make precision games look wrong, and the speed-versus-leg-length problem is not mentioned, so walking could fail for the same reason again.

3. **C. Vertical slice first: finish one complete move end to end (for example a throw), then extract the foundation from it**
   - Score: 3.8
   - Why: Athletic look 4, adaptability 2, cost 4, phone 5, fit 5, rejection risk 3. It shows the owner something real very quickly, but one-off code tends to need rewriting for the next move. Its best idea, judging real moves early, is grafted into plan A as benchmark moves.

4. **D. Locomotion first: rebuild walk and run, then put everything else on top (the old order)**
   - Score: 3.3
   - Why: Athletic look 3, adaptability 3, cost 3, phone 5, fit 5, rejection risk 1. Walking is the move people judge most harshly, and it is the move most affected by the unresolved speed problem. This order was rejected 5 to 7 times.

5. **E. Hand-keyed clip library per move with blending (Wii Sports style)**
   - Score: 3.2
   - Why: Athletic look 3, adaptability 2, cost 2, phone 5, fit 4, rejection risk 3. It is simple at runtime, but the clip count explodes: Nintendo went from about 30 motions to over 650 once Miis had arms. The feasibility test also showed keyframe curves put the whip peaks in the wrong order and early.

6. **F. Markerless video motion capture as the runtime base (owner films moves on a phone, an AI tool turns the video into clips)**
   - Score: 3.5
   - Why: Athletic look 4, adaptability 3, cost 3, phone 5, fit 3, rejection risk 3. It gives real human timing cheaply. But the avatar's proportions (4.9 heads tall, thighs about 20% short, fingertips below the knees) would make retargeted clips slide and miss contacts, and the tools' commercial licence terms were not found (Move.ai, Rokoko, DeepMotion; Cascadeur is non-commercial on its free tier). Use it as reference for key poses and timing, not as the engine.

7. **G. Motion matching with licensed motion capture (For Honor, The Last of Us Part II, Unreal 5.4)**
   - Score: 2.8
   - Why: Athletic look 5 for walking and running, adaptability 2, cost 1, phone 3, fit 3, rejection risk 3. It needs hours of commercially licensed capture plus tooling, gives little help for 20 bespoke sport moves, and retargets badly to these proportions. Keep it only as a fallback for walking and running.

8. **H. Active ragdoll as the base: a physics body with joint motors always following the pose (Euphoria, PuppetMaster)**
   - Score: 3
   - Why: Athletic look 3, adaptability 4, cost 2, phone 2, fit 5, rejection risk 2. It gives real momentum, but it is hard to tune, can go unstable, and no iPhone browser ragdoll benchmark was found. It is the right final layer for hits and falls, which is where plan A puts it.

9. **I. Fully physics-driven characters (Gang Beasts, Human Fall Flat)**
   - Score: 2.5
   - Why: Athletic look 1, adaptability 3, cost 2, phone 3, fit 5, rejection risk 1. These are floppy on purpose, the opposite of the athletic, deliberate goal.

10. **J. Learned physics controllers (DeepMimic, AMP)**
   - Score: 2.3
   - Why: Athletic look 4, adaptability 2, cost 1, phone 1, fit 4, rejection risk 2. They need GPU training, motion capture and expert tuning for every sport, and have no phone results.

### Improved plan

#### Layers

1. **Layer 0. Ground rules (new; comes before any movement)**
   - What: The decisions and shared contract that every later layer rests on. (a) Owner decisions: speed versus gait, where feet may slide, which body-weight model to use, and whether the trunk, collarbone and shoulder ranges may be widened (see taste questions). (b) A body rig measured from the final 6 ft 4 in avatar, kept as data with a re-measure script, so later avatar polish does not break movement. (c) One fixed order of work for every frame: intent and predictor, then pattern or move targets, then added offsets (lean, variation), then balance plan, then muscle springs, then contact IK with trunk assist, then neck and head look, then soft limits and a final balance correction, with physics added last much later. (d) One input path: a single 'intent' (stick direction and strength plus move requests) that test buttons also use, so no button drives the body directly. (e) Fixed 1/120 s update with smooth drawing between steps, seeded randomness and exact replay. (f) A per-avatar cost budget measured on a real iPhone.
   - How built: Rebuilt in TypeScript strict mode inside motion-core/. Each stage is a small pure module over preallocated typed arrays, with no garbage per frame. The body root is a quaternion that turns about the pelvis, not Euler angles about the feet. Rig data is generated from the avatar file. A replay file stores inputs and the random seed. The approved wave is carried over unchanged as the first regression test.
   - Test: Rig: every ball stays seated (for example within 0.1 mm) in hundreds of random poses after re-measuring. Determinism: the same inputs and seed give the identical pose at 30, 60, 120 and jittery frame rates. Zero heap garbage per frame. iPhone timing p95 within budget (the budget is a design value, set after the first phone measurement). The wave looks and measures the same as before.

2. **Layer 1a. Foundation: human joint ranges**
   - What: Every joint moves through a realistic human range. Ball joints (shoulder, hip, waist, neck) get a cone for where the bone points plus a twist range, instead of per-axis boxes. Each joint has a comfort zone and a hard limit, eases softly into its end stop instead of snapping, and has natural couplings: the collarbone lifts as the arm rises past about 60 degrees, and a straight knee limits hip flexion (hamstrings).
   - How built: One limits module, shared later by the ragdoll joints. Values come from the clinical range table in the research (AAOS-style norms, marked where unconfirmed), clipped to what the rigid shell allows. A slow 'range tour' shows each joint on the real mannequin with an overlap check against the mesh.
   - Test: Zero frames past hard limits. No joint jumps more than a set amount per frame near limits (all 18 measured IK jumps over 8 degrees happened at a hard limit). Arm-across-body reach succeeds once the owner approves the wider range: 0% today, exact with shoulder adduction of 50 degrees. Mesh overlap and distortion are checked at every limit.

3. **Layer 1b. Foundation: reach and look**
   - What: Hands and feet reach any target (Follow the ball returns). When a target is far, the pelvis, spine and chest lean, turn and shift within their limits to help, so it looks like an athlete reaching, not a stretched arm. Looking runs eyes, then head, then chest, then pelvis. The head aims at a point on the predicted path about 0.2 to 0.6 s ahead, better held at a fixed distance ahead than a fixed time.
   - How built: Keep the exact two-bone limb solver and palm solver from reach.js. Add a small trunk-assist stage weighted by stiffness, and elbow and knee swivel continuity. The look distribution comes back from the removed look.js (in commit 747d0ba), rebuilt cleanly.
   - Test: Palm on the moving ball within 1 mm and 2 degrees in 100% of frames at every frame rate (the old code already scored 661/661). Joint step per frame stays bounded. Head lead time before a turn is 0.2 to 0.6 s. Head pitch range stays under 20 degrees during movement.

4. **Layer 1c. Foundation: balance and contacts**
   - What: Balance in two cases. Standing: the centre of mass, pushed forward by its speed, stays inside the feet's support area, using ankle, then hip, then a step as the disturbance grows. Moving: each next foot lands relative to where the body's momentum is carrying it (the 'capture point'). One rule then gives deliberate steps, recovery steps and stopping steps. Contacts: planted feet are locked, gripping hands stay on objects, nothing sinks into the floor.
   - How built: Plan the centre of mass with a simple falling-pendulum model solved toward its end point (not stepped forward, which diverged by 37 to 66 cm in the test). Keep balance.js and its Winter and Dempster segment masses as the final corrector; it computed the exact 4.3 cm fix in the test. Store weight shifts in the body's own frame (lesson from the old world-frame bug).
   - Test: Extrapolated centre-of-mass margin during standing and aiming tasks (for example at least 2 cm, a design value). Planted foot slides at most about 1 cm per stance except where sliding is allowed. Floor penetration at most about 0.5 cm. Lean matches acceleration (angle close to atan of acceleration over gravity) during sustained pushes.

5. **Layer 1d. Foundation: 'where am I going' predictor**
   - What: Every frame the body copies the movement rules and runs them 0.5 to 1 s ahead with the current stick. It then knows the future path, how sharply the path curves, and, at release, exactly where a stop will end. This is what lets it lean before a turn, place its last steps, brace for a stop and look ahead.
   - How built: Reuse controller.js unchanged (deterministic, fixed 1/120 s). Clone its state and step it ahead. Jumps are added to the predictor when jumping is built.
   - Test: Prediction matches the real outcome (measured 0.00 m error over 1 s). Cost per prediction measured on iPhone (32.6 microseconds on a server). Stop-point prediction at release (for example 1.98 m ahead in 0.46 s from a full run).

6. **Layer 1e. Foundation: muscle layer (weight and follow-through)**
   - What: Each joint follows its target like a weighted spring. Heavy segments (thigh, trunk) lag more and light ones (forearm, hand) respond faster, so overshoot and follow-through appear naturally. Switching moves starts from the body's current motion instead of cross-fading two motions (inertialization). Every joint is expressed as a target plus a strength, ready for the later ragdoll.
   - How built: Critically damped springs per joint, scaled by segment mass, placed before contact IK so planted feet and gripping hands stay exact. Kept short so controls never feel slow. Springs add lag and overlap but do not create the whip; the whip comes from the pattern timing.
   - Test: A blind side-by-side with springs on and off. Added control delay stays below a small design limit. Contacts stay exact after the springs. In the test, springs on a single arm command cut hand speed 16 to 26% and merged the peaks, so the throw checks must still pass with springs on.

7. **Layer 2. Base motion patterns**
   - What: Twelve reusable patterns (8 core, 4 specialised; listed in base_patterns) plus shared rules that every pattern inherits: phases (prepare, act, follow through, settle); visible anticipation (the body sets about 50 to 100 ms before a fast arm action, and the head leads a turn by about 0.2 s); a timing family adjustable from 'whip' to 'steady push'; small seeded variation in details that do not affect the result; and bigger tasks scaling amplitude, not just speed. Walking and running are patterns too: the step pattern repeated, with the cycle advanced by distance travelled and stride and cadence scaled from human data to his leg length.
   - How built: Each pattern is a small function of time or phase and a few parameters. It outputs joint targets and contact targets, built from the existing quintic (minimum-jerk) curves, each with an explicit time of peak speed and a duration. Patterns combine through bone-masked layers in the pose player. Catmull-Rom keyframe clips are kept only for loops like the wave: in the test they put whip peaks 40 ms early and in the wrong order. 'Plant' always includes letting the trailing foot lift, pivot or drag, which the test needed to stop a 13 cm back-foot slip.
   - Test: For each pattern, in every direction and at uneven frame rates, together with every earlier pattern: peak order within tolerance (pelvis, then trunk, then arm, then hand; each peak larger), foot slip, joint-limit margin, joint-speed jumps, extrapolated centre-of-mass margin, cadence inside the human band scaled to his legs, head lead time, preparation before the action, and 40 jittered repeats all valid.

8. **Layer 3. Specific moves**
   - What: Each sport or game move is a recipe: 4 to 6 named phases (ready, load, launch, contact or release, follow-through, recover), a few key poses taken from real reference video, the patterns it uses, and its targets (release point, direction and speed; hands on the bat; foot to the ball). The result comes from the body's own timing, with no power meters or aim guides.
   - How built: A small solver fits each move's few timing and key-pose numbers to its targets while keeping the peak order. It runs offline per move, with a handful of parameters adjusted at runtime. Variation stays in the directions that do not change the outcome. Timing alone threw the test ball 50 degrees down; fixing it by hand-picking key poses broke the whip and cost 30% of hand speed, so the two must be solved together.
   - Test: Outcome accuracy (release direction and speed within tolerance), whip or steady-push checks for its family, 10 repeats that visibly differ while the outcome stays on target, every earlier move still passing, and a side-by-side with a real person doing the same move at the same speed.

9. **Layer 4. Reactions: ragdoll hits and falls (later)**
   - What: A physics copy of the rigid parts, one body per part, which suits this mannequin very well. Its joint motors follow the target pose from layers 1 to 3. A hit or fall lowers the strength; the step response from layer 1c gives human-looking recovery before a fall; then he gets up.
   - How built: Choose between Rapier and Jolt (both WebAssembly) only after an iPhone ragdoll benchmark. Reuse the shared limits module and the target-plus-strength interface from layer 1e.
   - Test: iPhone benchmark first. No instability over thousands of random hits. A smooth return to the animated pose. All earlier moves unaffected when strength is full.

#### Base patterns
1. P1 Set and shift: athletic stance, weight moving between the feet and between heel and toe, and a small dip to load before acting.
2. P2 Step and push-off: one deliberate step (lift, swing, place, take the weight). Variants: forward, side, cross-over, back, recovery step, skate push, and a running step with time in the air.
3. P3 Plant and brace: the lead foot lands ahead of the body and the leg firms up to stop or redirect momentum (stops, cuts, the throw or kick support leg, the batting stride, the bowling slide). It always includes releasing the trailing foot.
4. P4 Lower and rise: squat or hip hinge (sit, stand, pick up, crouch, absorb).
5. P5 Propel and land: jump with hip, then knee, then ankle extension and an arm swing; land with ankle, knee and hip bending to absorb.
6. P6 Coil and uncoil: the pelvis turns first while the chest lags behind, then the chest overtakes and the pelvis slows. The tilt of the turning axis decides overarm, sidearm or underarm.
7. P7 Arm whip: a fast shoulder, elbow, wrist chain in overarm, sidearm or backhand, and underarm pendulum versions.
8. P8 Steady push and pull: precision with few joints moving together on a straight path from a still base (dart, putt, cue stroke, free-throw arm, bow push and draw, steering, climbing pull).
9. P9 Leg whip (specialised): hip, then knee (kick, running swing leg, skate push leg).
10. P10 Opposite arm and leg (specialised): arms counter the legs and the chest counter-rotates against the pelvis (walk, run, skate, ski poling, climbing).
11. P11 Lean and edge (specialised): whole-body lean into turns plus hip, knee and ankle angling (curved running, skating, skiing, skateboard carving).
12. P12 Hang and support (specialised): weight through the hands (ledge grab, climb, vault, the kart frame when getting in and out, getting up).
13. Shared rule: every move has four phases (prepare, act, follow through, settle).
14. Shared rule: visible anticipation with measured timings (the body sets about 50 to 100 ms before fast arm actions; the head leads turns by about 0.2 to 0.6 s).
15. Shared rule: one timing setting from 'whip' (power moves) to 'simultaneous' (precision moves), set per move.
16. Shared rule: structured variation, with small seeded differences in timing, stance and joint paths that leave the release, contact point or foot placement on target.
17. Shared rule: bigger tasks change amplitude (longer stride, more rotation, longer backswing), not just speed.

#### Build order
1. Before every step below, the same routine (the owner's rule): research and compare, a short plan, the owner's Go, build with tests, automatic checks pass, then the owner looks on the phone. Decisions are recorded.
2. Step 0. Decisions only, no code: the owner answers the taste questions on speed versus gait, where feet may slide, the joint-range socket changes, the body-weight model, and whether the throw or the walk comes first.
3. Step 1. Clean base: rig measured from the 6 ft 4 in avatar, the fixed frame order, the single intent path, replay, the iPhone cost readout, and the test room shell, with the wave carried over. The owner sees the mannequin standing and waving in the new room exactly as before.
4. Step 2. Joint ranges: cone-and-twist soft limits and the 'range tour' on the real mannequin. Any socket or rim change is shown as pictures and options first, because approved shapes are not changed without the owner. The owner sees whether each joint moves like a person's, with no clipping or distortion.
5. Step 3. Follow the ball returns: reach plus trunk assist plus a head that looks ahead. The ball's path slowly widens until the trunk has to join in and the hand crosses the body. The owner sees whether he reaches like an athlete and his head leads.
6. Step 4. Standing weight shift (P1) with balance overlays. Then the ball moves out of reach and he shifts, then takes one recovery step (the first use of stepping balance). The owner sees whether the weight looks real.
7. Step 5. Muscle layer: blind A/B of steps 3 and 4 with springs on and off. The owner picks the one that feels heavier without feeling slow.
8. Step 6. One deliberate step (P2 and P3) forward, side, back and cross-over, then 'stand, step, stop' driven by the predictor from a slow stick. The owner sees foot placement and weight transfer.
9. Step 7. Step-and-throw benchmark (P1, P2, P3, P6, P7, with the trailing foot released), plus the release-direction solver and variation: 10 throws in a row beside a real throw video. The owner sees whip, plant and follow-through, with no two throws the same.
10. Step 8. Precision benchmark (dart or putt) to prove the steady-push family. The owner sees a quiet, controlled body.
11. Step 9. Jump and land (P4 and P5). The owner sees the load, a believable flight and a soft landing.
12. Step 10. Walking: in place first (the owner's earlier rule), then moving at slow speeds, then start, stop and turn using the predictor and head look-ahead, at the speed band the owner chose. Beside a real walking video at the same speed.
13. Step 11. Running, turns, skids and the braking slide (braced, leaning back, feet allowed to slide only here if the owner agrees). Beside a real running video.
14. Step 12 onward. One move at a time, each with its own research, recipe, solver fit, checks and owner look: minigame moves (grouped by shared patterns: throws, then swings, then kicks, then precision), kart in and out, skateboarding. The ragdoll comes last, after an iPhone physics benchmark.
**Body test room:** Use the Skeleton section of the Test Lab (Claude's area, the owner's main testing place), with the slate-blue #405363 background. Final approval always happens on the real rigid mannequin. Stick figures and debug views are only for checking numbers, because viewers spot motion faults better on a human-like model (Hodgins, O'Brien and Tumblin). Tools: slow motion and frame stepping; ghost trails; overlays for the centre of mass, its extrapolated position, the support area, foot contacts and joints near their limits (coloured); small live plots of segment speeds so the whip order is visible; a side-by-side real-person reference video at the same speed (ideally filmed by the owner, which avoids licence questions); a 'robotic baseline' toggle (the same move with all joints starting and stopping together) so the eye learns what to look for; a blind A/B mode that shows two unlabelled versions for the owner to pick from (the standard two-alternative forced-choice method in motion-naturalness studies); a replay button, so 'attempt 37 looked wrong' can be reproduced exactly from its seed; a pass/fail panel of the automatic checks next to the view; a phone frame-time readout; and every earlier movement still available, as a regression check. Automatic checks run before the owner looks: foot slip per stance, floor penetration, joint-limit margin, joint-speed jumps per frame, extrapolated centre-of-mass margin, lean against acceleration, correct flight in the air, peak order and timing for whips, a quiet base for steady pushes, cadence inside the human band scaled to his legs, head lead time, preparation before an action, outcome accuracy, spread across 10 repeats, and cost per frame.

#### Owner checkpoints
1. Step 0: decide speed versus gait, where sliding is allowed, socket changes for wider ranges, the body-weight model, and whether the throw or the walk comes first.
2. Step 1: the mannequin and wave look exactly as before in the new room, and the phone frame rate is fine.
3. Step 2: each joint's range looks human, with no ugly overlap or distorted shape; approve or reject any proposed socket change from pictures.
4. Step 3: Follow the ball looks like an athlete reaching, with the trunk joining in for far targets and the head leading the hand.
5. Step 4: weight shifts and the recovery step look like real weight moving over the feet.
6. Step 5: blind A/B pick of springs on or off; heavier limbs without slow controls.
7. Step 6: single steps and stand-step-stop show deliberate foot placement and weight transfer.
8. Step 7: the throw beside a real throw video shows the legs-to-hand whip, a firm plant, follow-through, and natural differences between 10 throws.
9. Step 8: the dart or putt looks calm and precise, not whippy.
10. Step 9: the jump loads, flies believably and lands softly.
11. Step 10: the walk beside a real walk at the same speed, in place first, then moving, starting, stopping and turning, on the phone.
12. Step 11: the run, turns, skids and braking slide beside real video, on the phone.
13. Every later move: judged beside a real person doing the same move, and after the automatic checks pass, so the owner's time goes only on look and feel.

### Improvements over owner plan
1. Add a step zero for decisions and the shared contract (speed versus gait, sliding exceptions, weight model, socket changes, rig from the final avatar, fixed frame order, single input path, replay, phone budget). The earlier walks failed on exactly these, not on the core math.
2. Raise the speed-versus-leg-length problem now. With the new legs (hip about 0.92 m, my estimate from HANDOFF items 76 and 77), the walk-to-run switch is about 2.1 m/s and the walking limit about 3.0 m/s, so the 3.1 m/s walk is slightly past it (old skeleton: Froude 1.17). The removed run used 7.6 steps per second where human data scaled to his legs suggests about 4.5. That questions owner decision 43(b), so it goes to the owner as a choice.
3. Make balance dynamic: momentum-aware balance standing, and foot placement from the capture point while moving (Hof 2005; Pratt 2006; SIMBICON). It gives deliberate, recovery and stopping steps from one rule.
4. Add the 'where am I going' predictor, so anticipation is real rather than a late reaction (tested exact, about 33 microseconds per 1 s prediction on a server).
5. Change 'looks where it goes' to 'looks where it will be': eyes, then head, then chest, then pelvis for steering (head leads by about 0.2 to 0.6 s), while force still flows legs, then hips, then chest, then arms.
6. Store joint limits as cone plus twist with comfort and hard zones, soft end stops and couplings. Every measured IK snap happened at a hard limit, and the current boxes allow impossible arm twists while blocking the arm across the body.
7. Add trunk assist in front of the exact limb solver, so far reaches look athletic.
8. Split patterns into two families, whip and steady push, with one timing setting per move. A strict whip would make darts, putting and archery look wrong.
9. Build patterns from minimum-jerk curves with explicit peak times instead of keyframe clips. Measured: correct whip order, 30 m/s hand speed, survives random timing; keyframes peaked 40 ms early in the wrong order.
10. Make 'plus targets' a real solver that fits timing and key poses together.
11. Make 'plant' always include releasing the trailing foot.
12. Add the muscle spring layer and inertialized switching for heavy limbs and follow-through, with a target-plus-strength interface that makes the later ragdoll a drop-in.
13. Treat natural variation as structured: vary what does not matter and keep the outcome accurate (uncontrolled manifold, Todorov and Jordan 2002), not random noise on joints.
14. Build the foundation just in time for benchmark moves (Follow the ball, stand-step-stop, step-and-throw, a precision move, jump-and-land), so the owner judges real moves within the first few chunks and each benchmark becomes a regression test.
15. Give the test room automatic checks with research-based numbers, blind A/B, replay by seed, real-person reference video and a robotic baseline. Approval happens on the real mannequin, never on stick figures (earlier walks were judged in stick figures and numbers).
16. Use real reference video (ideally filmed by the owner) for key poses and timing, and optionally a markerless video-capture tool once its commercial licence terms are confirmed.
17. Professional rebuild details: TypeScript strict mode, allocation-free hot paths (today at least 17 KB of garbage per frame), a quaternion root turning about the pelvis, deterministic replay, and iPhone timing from the first step.

### What to keep from old code
1. motion-core/controller.js and tuning.js: deterministic, fixed 1/120 s, matches the old game exactly. It becomes the predictor's engine as well as the movement rules. Numbers change only by owner decision.
2. motion-core/skeleton/quintic.js: minimum-jerk curves, the basis of the pattern layer.
3. motion-core/skeleton/pose.js ideas: per-bone layers with fades, bone masks, and quintic transitions that start from the current motion and never jerk when interrupted. Rebuild them cleanly. Keep Catmull-Rom clips only for loops like the wave.
4. motion-core/skeleton/reach.js: the exact two-bone limb solver, the palm solver and the ankle soft clamp. 600 of 600 random targets within 0.5 mm, and Follow the ball rebuilt at 100% of frames at every frame rate.
5. motion-core/skeleton/balance.js: centre of mass and support area with Winter and Dempster segment masses, and balanceShift as the final corrector (it computed the exact 4.3 cm fix in the test).
6. motion-core/skeleton/skeleton.js forward kinematics (about 10.7 microseconds per solve) and the mirroring approach. Replace Euler box limits with cone-and-twist, and the Euler root with a quaternion root about the pelvis.
7. motion-core/skeleton/shoulder.js: the collarbone-follows-the-arm coupling, extended into proper shoulder rhythm once the collarbone range is widened.
8. motion-core/skeleton/hands.js: fingers curl until they touch the object. Grips are judged per object later.
9. motion-core/skeleton/bones.js structure, regenerated from the 6 ft 4 in avatar with a re-measure script (its pivots come from the old 1.89 m model).
10. From commit 747d0ba: look.js (turn spread across waist, chest, neck and head; 19 checks) and footplan.js (exactly planted feet and swing clearance checked 320 times per step; 27 checks), rebuilt cleanly as foundation modules.
11. From commit 747d0ba: gait.js's idea of a gait as a plain function of phase with no hidden state (it cannot get stuck), advanced by distance instead of time. Not its numbers: 2.4 to 5 steps per second on 0.68 m legs, with feet skating at 40 to 60% of body speed.
12. Test ideas from the old suites (robust.mjs and others): every pair of button presses, random presses at jittery frame rates, all eight directions, U-turns, random sticks. Plus all current tests (skeleton, pose, reach, balance, grip, compare) as regressions.
13. Lessons, kept in writing: store weight shifts in the body's own frame (the old world-frame bug); add one movement at a time and test it with all earlier ones; judge on the real mannequin in a real browser on the phone.

### Risks
1. The speed and acceleration problem may not be decided. If the 3.1 m/s walk and 3.3 g starts stay unchanged and no gait style is agreed, walking can fail again however good the body code is.
2. The avatar is still being polished (the owner plans to rebuild it 'in solid code' once satisfied; the elbow cannot yet reach 90 degrees, HANDOFF 75d). Movement built on changing proportions needs the re-measurable rig, or it will break with each change.
3. Wider trunk, collarbone and across-body ranges need socket and rim changes to approved shapes. If the owner declines, throws, golf, bowling and archery will look stiffer, and the plan must adapt to the ranges the shell allows.
4. The stylised proportions (4.9 heads tall, thighs about 20% short, fingertips below the knees, heavy hands and feet) mean human timings and strides do not map one to one. The test throw's stride was limited to about 0.30 m on the old skeleton, against about 77 to 85% of height for a real pitcher. Moves will need adapting, and the owner should expect that.
5. Phone performance is unmeasured. Every timing came from a server under Node, and the current code makes at least 17 KB of garbage per frame. Several avatars on screen multiply the cost.
6. Springs add lag. Tuned too soft, the controls feel slow.
7. Pendulum balance planning is very sensitive. Stepped forward, it diverged by 37 to 66 cm in the test, so it must be solved toward an end point.
8. Complexity creep: predictor, dynamic balance, springs and a target solver are each sound, but adding them together could repeat the tangled-layer failures. One at a time, with checks, behind the fixed frame order.
9. Numbers can pass while the motion still looks wrong, and stylised game feel may want some exaggeration. The owner's eye stays the final judge.
10. Much evidence is second-hand (GDC talks, Holden's articles, the SIMBICON gains, some range-of-motion values seen only through search summaries). Re-check any figure that becomes load-bearing.
11. Licences: Ubisoft LaFAN1 and a common CMU conversion are non-commercial, and the commercial terms of markerless video-capture tools (Move.ai, Rokoko, DeepMotion) were not found. Use such data as visual reference only until licences are confirmed; filming the owner avoids the issue.
12. Provenance: controller.js and tuning.js were ported from 3D-WORLD-3. Under the 'no Mario data' rule, confirm none of those numbers came from Mario material before they become permanent. Not checked here.
13. Owner usage: many checkpoints. Automatic checks must filter out clearly broken motion so owner looks are few and meaningful.

### Owner taste questions
1. Walking speed: keep the controller speeds and let the body move from a walk into a jog at about 2.1 m/s (my recommendation: gameplay feel unchanged, honest-looking gait); or lower the top walking speed to about 2.1 m/s so the walk button always looks like a walk; or keep the earlier quick cartoon steps.
2. Running look: human-like strides scaled to his legs (about 4.5 steps a second at full speed, long time in the air), which fits the new 'performed by a human body' goal; or the earlier quick cartoon steps (decision 43b, about 7.6 steps a second).
3. Starts and stops are far harder than a person can manage (full run in 0.27 s; stops of 0.76 to 2.03 m). Keep them and have the body fake it with a strong push-off pose and a braced braking slide (my recommendation for now, to revisit after seeing it); or soften them a little so a person could really do it, which changes how the game plays.
4. Sliding feet: allowed only in skids, the braking slide and on ice, and nowhere else?
5. Joint ranges: may the waist and collarbone sockets and the shoulder be reshaped so he can bend forward and sideways, shrug, and bring his arm across his body? Throws, golf, bowling, archery and catching need it. It would be shown as pictures first, and approved shapes stay unless you say so.
6. Order: after Follow the ball and single steps, would you rather see a step-and-throw first (my recommendation: it shows athletic coordination without depending on the speed decision) or walking first?
7. Realism level: real human timing, or slightly exaggerated (longer wind-up, bigger follow-through) like animated films? A slider in the test room would let you choose by eye.
8. Body weight: should he move like a human athlete (human weight distribution for balance and swing, my recommendation), or like his actual stylised build (big head, heavy hands and feet), which would read more toy-like?
9. Natural variation: subtle (only noticed over many attempts) or clearly visible each time?
10. Reference videos: are you willing to film yourself or friends doing moves on your phone, so each move can be compared side by side with a real person (free, and no licence problems)?

## Skeptic challenge (corrections applied in 04-MOVEMENT-PLAN.md)
**Holds up:** True

### Problems

1. **The 'where am I going' predictor is oversold. Its '0.00 m error' test is circular: it predicted with the same unchanging stick that was then fed in, so the deterministic code simply agreed with itself. That proves nothing about anticipating a real thumb. When the stick changes, the prediction is only good about a quarter of a second ahead, and the look-ahead point jumps wildly from frame to frame.**
   - Evidence: industry/tests/predict.mjs predicts with the stick held at [1,0.2], then applies the same [1,0.2]. My test, (scratch folder, not saved) movement/challenge/predict_real.mjs, uses the repo controller read-only with a seeded synthetic phone-thumb trace: heading changes every 0.3-1.2 s, ~2 degrees of touch jitter, occasional releases, mean speed 5.9 m/s. Prediction error at 0.25 s ahead: median 0.04 m, p90 0.55 m. At 0.5 s: median 0.44 m, p90 2.39 m. At 1.0 s: median 3.16 m, p90 7.10 m, max 12.35 m. The 1 s look-ahead point moved up to 7.56 m in a single 60 Hz frame (p99 3.28 m). The trace is synthetic and probably harsher than calm play, but the circularity holds regardless. Also measured: from a 90-degree stick change, the controller's facing arrives after 0.14 s at 1.5 m/s, 0.16 s at 3.1 m/s and 0.31 s at 8.6 m/s. That gap between input and body is the only real 'lead' the game gives. A short-burst stop takes just 0.20 s (0.766 m), which is less than one running step, so the body cannot 'place its last steps'.
   - Fix: Base head lead on the stick's intended direction (the intent), which naturally runs 0.14-0.31 s ahead of the body, the human ~0.2 s figure (Grasso et al. 1996). Use path prediction only for short horizons (0.25-0.3 s) and for the planned stop point once the stick is released. Filter every predicted target. Describe stops as a reaction at release (a braced slide), not as anticipation. Re-test against recorded real thumb input from the owner's phone.

2. **The fixed frame order in Layer 0(c) would break contacts as written. It runs neck/head look after contact IK, and soft limits plus a final balance correction after that. Anything that moves the pelvis, waist or chest, or clamps joints, after IK pulls planted feet and gripping hands off their targets. The existing code already does it the right way round: balance first, then IK.**
   - Evidence: motion-core/skeleton/pose.js describes the balance shift as 'metres to move the whole body before the reaching layers'. The removed look.js spread a turn across waist, chest, neck and head (NEXT.md 40a), so running it after hand IK moves the hands. The improved plan's order: '...muscle springs, then contact IK with trunk assist, then neck and head look, then soft limits and a final balance correction'.
   - Fix: Order: intent/targets, then blend, then springs on free limbs, then balance pelvis shift (trial solves, as pose.js does now), then trunk look and trunk assist, then limb IK with soft limits enforced inside the solver, then neck/head-only look, then a contact check that only measures and never clamps. No stage after IK may move bones above a contact.

3. **The plan's own physics checks contradict the controller numbers it recommends keeping. 'Lean matches acceleration (atan a/g)' and 'grip at most 0.8-1.0' cannot pass with 3.3 g starts, 4.6 g turns and 4.9 g stops. A body that follows those checks would lean 73-78 degrees.**
   - Evidence: predict_real.mjs: 0 to 8.6 m/s in 0.275 s needs a 73-degree lean (atan(32/9.81)). Peak sideways acceleration in a 90-degree stick change is 17.6 m/s² at 1.5 m/s (61 degrees), 31.7 at 3.1 m/s (73 degrees) and 44.8 at 8.6 m/s (4.6 g, 78 degrees). A short-burst stop averages 48.2 m/s². For comparison, soccer match decelerations are about -5.7 to -6.3 m/s² (Harper et al. 2022 review, https://link.springer.com/content/pdf/10.1007/s40279-022-01693-0.pdf). Biomech checks A3/A4 and the Layer 1c test require physical lean and grip.
   - Fix: If the owner keeps the speeds (the plan's own recommendation), switch these checks to 'stylised' versions: lean rises steadily with acceleration and is capped (for example 20-30 degrees, a design value), changes smoothly and points the right way. Keep the true-physics checks only for actions the body drives itself (jumps in the air, throws, standing tasks).

4. **The list of places where feet may slide leaves out where the old feet actually failed. The taste question offers 'only in skids, the braking slide and on ice'. The worst foot errors in the removed walkers came from hard starts and full-speed turns, so a strict no-slide rule there sets up another rejection.**
   - Evidence: NEXT.md 42(d): a hard start left a foot behind by up to 0.5 m; tight full-speed turns put feet up to ~0.7 m off; random sticks gave 20% of frames over 1 mm. NEXT.md 44(c) and 46(b): errors stayed concentrated in hard starts, and running feet skated at 40-60% of body speed. My test: a full-speed 90-degree turn completes in 0.31 s at 4.6 g, which leaves room for about one step.
   - Fix: Add 'hard starts' and 'sharp turns at speed' to the slide question. Offer three choices: allow a short pivot or scramble slide there; soften the acceleration and turn rate a little; or add a 'push-off' and 'plant-and-cut' rule that hides the slide in a pivot. Record the owner's choice as an explicit exception list, enforced by the foot-slip check.

5. **The industry evidence for a code-first walk is weaker than the plan claims. Ubisoft's IK Rig and Valve's Half-Life: Alyx adjust authored or captured animation; they do not generate gait from rules. Overgrowth also relies on keyed poses. A gait generated purely from code is exactly what failed twice (the reactive walk.js, then the phase-function gait.js), and Layer 2 still builds walking that way.**
   - Evidence: Alyx SIGGRAPH 2021 talk 'The Right Foot in the Wrong Place': 'stride retargeting system, footstep prediction, and a custom motion matching system' that picks the closest clip (https://history.siggraph.org/wp-content/uploads/2022/06/2021-Talks-Heuvel_The-Right-Foot-in-the-Wrong-Place.pdf). IK Rig 'change[s] base animations to produce new actions' (https://gdcvault.com/play/1022984/IK-Rig-Procedural-Pose). Overgrowth: forum accounts say about 13 keyframes in total and 'a lot of the animation ... is controlled by keyed poses' (https://discussions.unity.com/t/an-indie-approach-to-procedural-animation-gdc-video-talk/538228, https://polycount.com/discussion/comment/2093086; second-hand, unconfirmed against the talk). NEXT.md 41, 46 and 47 record both procedural gaits being rejected.
   - Fix: Build walk and run from 4-6 key poses per gait, taken from reference video: contact, down, passing and up for the walk; contact, mid-stance, toe-off and flight for the run. Interpolate them by distance-driven phase with quintic or spring easing, then apply foot lock, stride warp, lean and look as procedural layers. That is the pattern shipped games use. Keep pattern functions for foot targets and timing, not as the source of the body's shape.

6. **The '0.30 m stride limit' that the plan attributes to the stylised proportions is mostly a limit built into the test. Passed to the owner unchanged, it would wrongly suggest the avatar cannot take a real stride.**
   - Evidence: feasibility/throwlib.mjs line 86 caps body lowering at 15 cm (pos.y-=Math.min(.15,drop)), and the back foot was held planted. The report itself says the body 'would have needed 52 cm of lowering (capped at 15)'. The pendulum variant also kept a constant height. With the new legs (hip about 0.92 m, from HANDOFF 76-77: 0.46 x 1.865 + 0.0654), leg length is close to an average adult's. Plain geometry: feet 1.2 m apart need roughly a 25 cm pelvis drop, a normal amount for a throwing stride.
   - Fix: Remove or reword the risk 'stride limited to about 0.30 m'. Re-run the throw on the 6 ft 4 in rig without the drop cap and with the trailing foot released, before claiming any body limit.

7. **Writing key poses for about 20 moves is the real bottleneck, and the plan leaves it to hand-tuning. The one hand-tuned test throw released the ball 50 degrees into the ground. 'Key poses from real reference video' has no concrete method behind it.**
   - Evidence: Feasibility tests 3 and 3e: release 50.3 degrees down and 33.8 degrees sideways; the best key-pose fix broke the whip order and lost 30% of hand speed. MediaPipe's code is Apache-2.0 (confirmed from the LICENSE at https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/LICENSE). Its Pose Landmarker runs in the browser through @mediapipe/tasks-vision and gives 33 3D world landmarks in metres, centred on the hips (https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js). The model-weights licence was not confirmed.
   - Fix: Add an offline tool: run the owner's own phone videos through MediaPipe Pose Landmarker, turn the landmarks into bone directions (not positions, because the proportions differ) and phase timings, and use those as starting key poses and peak times. Treat single-camera depth as approximate and let the solver or IK correct it. Use it only for reference data; never ship the model.

8. **Switching joint limits to cone-plus-twist quietly loses a guarantee the current code depends on: 'any mix of two allowed poses is also allowed'. If poses are blended as quaternions and clamped afterwards, the clamps cause the very snaps the plan is trying to remove.**
   - Evidence: The pose.js header says Euler box limits are convex, so a blend can never leave them. Feasibility test 2b: every IK jump over 8 degrees happened at a hard limit.
   - Fix: Store and blend joints as swing-twist parameters (a 2-D swing vector plus a twist angle), where elliptical cones and twist ranges are convex. Linear blends then stay valid. Make couplings such as shoulder rhythm deterministic functions. Defer the hamstring coupling until a move needs it.

9. **The human trunk range table does not fit the new rigid torso. The new avatar has a single waist split at the navel. Human trunk motion is spread along the spine (about 80% of twist is thoracic), so 60-80 degrees of bend at one rigid hinge will look like folding and open the seam. Separately, the plan calls trunk range a new owner decision about sockets, but the owner has already said the waist can twist, bend and lean.**
   - Evidence: HANDOFF 81: the torso is split at the navel, a 6 mm cut with a 5 mm lip and a hidden ball. HANDOFF 82: the owner was told the waist line can twist, bend forward and back, and lean, with human limits set in code later, and that a second split is only needed 'if deep bends look like folding'. The current skeleton has two trunk joints (spine and chest), while the new mesh has one visible trunk seam.
   - Fix: Map trunk motion to the one waist joint, take deep bends (golf address, pool, bowling, pick-up) mainly from the hips, and set the waist range by a mesh check on the seam. Keep the collarbone and arm-across-body ranges as open owner questions, since the 2 cm-separated shoulder balls and a 61 cm chest make crossing the arm a mesh problem.

10. **Running the whole body pipeline at a fixed 1/120 s wastes phone time. Safari on iPhone runs requestAnimationFrame at 60 fps by default, so every displayed frame would pay for two full pose solves.**
   - Evidence: WebKit: frame rates above 60 fps only when 'Prefer Page Rendering Updates near 60fps' is turned off, and it is on by default (https://www.macrumors.com/how-to/enable-smoother-120hz-browsing-in-safari/, https://bugs.webkit.org/show_bug.cgi?id=272226). Feasibility test 4: the throw stack costs 0.69 ms mean and 1.66 ms p99 per solve on a server Xeon; an iPhone was not measured. The old pose system was already frame-rate independent (Follow the ball scored 100% at 30-120 fps and with jittery frames).
   - Fix: Keep the controller at 1/120 s, since it is cheap. Evaluate the pose once per displayed frame from the interpolated controller state, using exact closed-form damped springs that do not depend on frame rate. For exact replay, record each frame's time step together with the inputs and the random seed.

11. **Items from the owner's own records are missing. (1) Turn-first (owner decision 43a) needs a controller change (hold/aim), which contradicts 'reuse controller.js unchanged', and the reset removed that code. (2) The owner complained that the Follow-the-ball ball sat at the heel of the palm, and NEXT.md 47 measured the palm point 12 cm too far toward the wrist. The '100% of frames' score was measured at that same wrong point. (3) A nose or face so the owner can read where he looks.**
   - Evidence: NEXT.md 43(a), 44(b) and 45-47. The current controller.js has no hold or aim fields. HANDOFF 78-79: the wrist ball was pushed 5 cm deeper and the arms are 5 cm shorter, so the palm point moves on the new avatar anyway. HANDOFF 20: a painted face now exists.
   - Fix: Step 3 must re-measure and fix the palm contact point on the 6 ft 4 in avatar before showing Follow the ball again. Add turn-first to Step 6/10 and list the controller change as an owner-visible change (it was off by default before). Check whether the painted eyes make the gaze readable.

12. **The predictor's capture-point stepping and the springs are applied loosely. The capture-point (pendulum) model has no flight phase, so it does not describe running: at 8.6 m/s the capture point is about 2.6 m ahead. Because the controller drives the centre of mass, these rules make the body look plausible; they do not actually keep it balanced. And if the springs work in local joint space, they never respond to the body's starts and turns. If they work in world space, a 3.3 g start throws the upper body backward, the opposite of an athlete's forward lean.**
   - Evidence: v/omega = 8.6 / sqrt(9.81/0.92) ≈ 2.6 m. The Raibert running heuristic places the foot at the neutral point, about v x T_stance / 2, plus a velocity-error gain (secondary summaries, e.g. https://arxiv.org/pdf/2211.06223). Layer 1e describes springs only as 'each joint follows its target'.
   - Fix: Use capture-point placement for standing recovery and walking, and Raibert-style neutral-point placement for running, both fed by the short-horizon predictor. State that the springs are local (on pose changes only), and drive lean in starts and turns with an explicit capped lean rule instead of spring lag.

13. **There is scope and complexity risk for one person with AI help, plus a blind spot: the AI that builds the motion cannot see it moving, which is how the old walks reached the owner unchecked. The plan stacks a test room with about 12 tools, about 30 checks, a move-fitting solver, springs, a predictor and dynamic balance before the first sport move. Each piece is sound; together they repeat the 'too much at once' pattern. The old walk was built, rebuilt and rejected within a single day (20 Nov).**
   - Evidence: NEXT.md 41-47 all happened on 20 Nov 2026. HANDOFF 'Confirmed by the owner' item 1: one movement at a time. The repo has playwright 1.65.1 and three 0.180.0 in package.json, so headless rendering is available.
   - Fix: Build test-room tools only when a step needs them. Before writing a fitting solver for Layer 3, try the simpler hybrid first: pelvis and trunk on joint-space whip timing, with the hand following a minimum-jerk path through the release point and direction via the exact two-bone IK. Add an internal filmstrip self-check: Playwright renders 8-12 frames of the real mannequin beside reference-video frames at matching phases, and the AI inspects them before asking the owner to look (not sent to the owner unless asked).

### Factual errors
1. 'Prediction matches the real outcome (measured 0.00 m error over 1 s)', offered as proof that anticipation works, is circular. The test fed the same constant stick into both the prediction and the real run. With a changing stick (synthetic trace), the 1 s error has a median of 3.16 m and a p90 of 7.10 m; at 0.25 s the median is 0.04 m and the p90 0.55 m.
2. 'Ubisoft's IK Rig, Overgrowth's few-key-poses method and Valve's Half-Life: Alyx walkers all run simple rules on top of a solid body' misstates the sources. Alyx's NPC locomotion combines stride retargeting and footstep prediction with a custom motion-matching system over animation clips (SIGGRAPH 2021). IK Rig modifies base animations. Overgrowth also relies on keyed poses (second-hand).
3. 'The test throw's stride was limited to about 0.30 m on the old skeleton ... Moves will need adapting' blames the proportions for a test artefact: throwlib.mjs caps body lowering at 15 cm and keeps the back foot planted.
4. 'Some ranges (trunk bend, collarbone, arm across the body) are blocked by approved sockets, so widening them is an owner decision' is partly outdated for the trunk. HANDOFF 82 records that the new waist line can twist, bend forward and back, and lean, with human limits to be set in code. Collarbone and arm-across-body remain open questions.
5. Industry's 'the human maximum deceleration was not confirmed' can now be filled: soccer match-play decelerations are about -5.7 to -6.3 m/s² (Harper et al. 2022 review). The controller's 48.2 m/s² short stop (measured: 0.766 m in 0.200 s) is about 8 times that, and its ~18.7 m/s² long stop about 3 times.
6. Confirmed correct: 0 to 8.6 m/s in 0.275 s (32 m/s², 73-degree physical lean). Nintendo's 'over 650 motions vs about 30' (Ask the Developer Vol. 5). Grasso et al. 1996: head direction leads walking direction by about 200 ms (NeuroReport 7(6):1170-1174). New-avatar hip about 0.92 m, which puts 3.1 m/s at Froude about 1.06.
**Final recommendation:** Keep the owner's approved order (body abilities first, then base patterns, then specific moves, ragdoll last) and most of the improved plan: Step 0 decisions, the single input path, human joint ranges, Follow the ball first, the whip and steady-push families, structured variation, benchmark moves and a test room with checks. But do not send it to the owner as written. Make these corrections first.

1. Downgrade the predictor. Head lead should come from the stick's direction, which naturally runs 0.14-0.31 s ahead of the body. Use path prediction only about 0.25 s ahead, filtered, and for the stop point once the stick is released. Remove the '0.00 m exact' claim; that test was circular.

2. Fix the frame order: balance shift, then trunk look and assist, then limb IK with limits inside the solver, then neck and head only. Nothing that moves the body or clamps joints may run after IK.

3. Make the lean and grip checks stylised (capped, steady, pointing the right way) wherever the owner keeps the game's speeds.

4. Add hard starts and sharp turns at speed to the sliding question. That is where the old feet failed.

5. Build walk and run from a few key poses taken from video, with procedural foot-lock, stride warp and lean on top. That matches what IK Rig, Alyx and Overgrowth actually do, and avoids a third purely code-generated gait.

6. Get key poses and timings from the owner's own phone videos using MediaPipe Pose Landmarker (Apache-2.0 code, offline, reference only; the model-weights licence still needs checking).

7. Blend joints in swing-twist parameters so blends stay inside the limits. Take deep bends mainly from the hips, since the new torso has a single navel hinge, and check the waist range on the mesh.

8. Run the controller at 120 Hz but solve the pose once per displayed frame. iPhone Safari defaults to 60 fps.

9. Fix the palm point before showing Follow the ball again, and restore turn-first as a controller change the owner can see.

10. Correct the '0.30 m stride' claim (a test cap), and re-measure everything on the 6 ft 4 in rig.

11. Build test tools only as each step needs them, try a simple hybrid release (trunk whip timing plus a hand path aimed by IK) before any fitting solver, and add a filmstrip self-check: Playwright renders the real mannequin beside reference frames for the AI to inspect before the owner looks.

With these changes I would score the plan above alternatives B and C. Without them, the frame-order, slide-rule and predictor gaps are the likeliest causes of another rejected walk.

Not verified: every timing was taken on a server; my thumb trace is synthetic; nothing was rendered or tested on an iPhone; the MediaPipe model-weights licence and the Overgrowth details are unconfirmed. No Mario or SM64 data was used. Whether tuning.js (copied from 3D-WORLD-3) came from such material is still unchecked.
