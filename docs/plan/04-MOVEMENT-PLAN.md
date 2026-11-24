# Movement plan: body foundation first (approved 23 November 2026, double-checked)

**Owner decision (23 November 2026):** restart the code cleanly while keeping every idea, and build movement as "body foundation first":
a foundation where every joint moves through a real human range, hands and feet reach any target (like the old "Follow the ball" test), the
body keeps its balance and looks where it is going; then base motion patterns; then specific moves built from them; ragdoll reactions last.

The owner asked for the plan to be double-checked for a better way. Three researchers (industry methods, sports science, and tests on the real
`motion-core` code), an improver and a skeptic did that. Full data: [appendix A4](appendix/A4-movement-plan-check.md).
Status: **structure approved; the improvements below are proposals for the owner's review.**

## A. The verdict

1. The structure holds. Game studios (Ubisoft's IK Rig, Overgrowth, Valve's Half-Life: Alyx) and sports science build movement the same way.
2. Tested on the real code: a throw built only from base patterns (plant, hip turn, trunk turn, arm swing) moved in the right whip order,
   legs then hips then chest then arm, in 40 of 40 tries with random timing changes. Hand speed about 30 m/s.
3. The old Follow-the-ball reach landed the palm on the ball in 100% of frames at 30, 60 and 120 frames per second (but the palm point itself
   is about 12 cm off and must be re-measured on the 6 ft 4 in avatar).

## B. Improvements the check recommends

1. **Moving balance.** Standing balance keeps weight over the feet; moving balance comes from where the next foot lands. One rule gives
   deliberate steps, recovery steps and stopping steps.
2. **Muscle layer.** Joints follow their target like weighted springs, so heavy limbs carry momentum and follow through.
3. **Two families of moves.** Power moves (throw, kick, bat, golf drive) whip from the legs up. Precision moves (darts, putt, pool, archery)
   stay calm and steady. One timing setting per move.
4. **Walk and run from key poses.** Build them from 4 to 6 key poses taken from real video (ideally the owner or friends filmed on a phone),
   with foot-planting, stride adjustment and lean added on top. This is what shipped games do, and it avoids a third pure-math walk.
5. **Human joint ranges.** Today the waist cannot lean, the chest bends only 15 degrees, the collarbone moves 4 degrees and the arm cannot cross
   the body. Store limits as a cone plus a twist with soft end stops. Any socket or rim change is shown to the owner as pictures first.
6. **Look ahead.** The head leads about 0.2 seconds ahead of a turn, taken from the stick's direction.
7. **Real moves early.** Build each foundation piece just in time for benchmark moves: Follow the ball, step and stop, step and throw, a dart
   or putt, jump and land, then walking.

## C. Corrections the skeptic made (applied above)

1. A "perfect prediction" test was circular; future-path prediction is only reliable about a quarter second ahead.
2. Nothing that moves the body or clamps joints may run after the hand and foot placement step, or planted feet slide.
3. Lean and grip checks must be "stylised" where the game keeps its fast speeds.
4. Hard starts and sharp turns at speed belong in the foot-sliding question, because that is where the old feet failed.
5. Solve the pose once per displayed frame (iPhone Safari runs at 60 frames per second) while the movement rules stay at 120 steps a second.
6. Build test tools only when a step needs them, and add an automatic filmstrip self-check so the AI looks at frames before the owner does.

## D. Build order (each step needs the owner's Go)

1. Step 0, decisions only: speed versus gait, where feet may slide, joint-range shape changes, body-weight model, throw or walk first.
2. Clean base: rig measured from the 6 ft 4 in avatar, fixed frame order, replay, the wave carried over in a test room (Skeleton section).
3. Joint ranges, then Follow the ball returns, then standing weight shift and a recovery step, then the muscle layer (blind A/B choice).
4. One deliberate step, then step-and-throw beside a real throw video, then a dart or putt, then jump and land.
5. Walking (in place first), then running, turns, skids and the braking slide.
6. Then one move at a time: station moves grouped by family, kart in and out, skateboarding. Ragdoll last, after an iPhone physics test.

## E. The discovery the owner must decide on

The walk speed (3.1 m/s) is a jog for this avatar's leg length, a full run is reached in about a quarter second (about 3 g), and stops are
several times harder than athletes can manage. No body code can make that look natural. Options will be presented one at a time: keep the
speeds and let the body jog above about 2 m/s (recommended), lower the top walking speed, or keep the earlier quick cartoon steps (decision 43b
in `docs/NEXT.md`).

## F. To reconcile in the master plan

The other Claude chat's research (`docs/research/inventing-movement/REPORT.md`) proposes driving the body with physics joint motors (Rapier)
from the start. This check and the physics benchmark (appendix A5) recommend procedural layers with springs first and physics for ragdoll
later, partly because Rapier's JavaScript joint limits have traps (hinge limits silently ignored, ball-joint limits only through the raw API).
Both are proposals; the master plan will compare them and recommend one.

## G. Owner questions waiting (taste only, asked one at a time)

1. Walking speed and running look (see section E).
2. Where feet may slide: skids, braking slide, ice, hard starts, sharp turns.
3. May the waist, collarbone and shoulder shapes change so he can bend, shrug and reach across his body?
4. After Follow the ball and single steps: step-and-throw first (recommended) or walking first?
5. Realism level: real human timing or slightly exaggerated like animated films (a slider can decide by eye).
6. Body weight: human athlete weight distribution (recommended) or his stylised build.
7. Natural variation: subtle or clearly visible.
8. Willing to film yourself or friends doing moves on the phone for reference videos?
