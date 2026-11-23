# Where every idea lives (for the master plan)

The owner is creating a master plan for the whole game (23 November 2026: "I want every idea, every old idea and new
idea, every old idea that I approved and every new idea that I add inside of that repo"). This page lists where each
kind of idea is recorded, so the master plan can gather all of them. It is an index, not a new set of rules: each file
below stays the place where its ideas are kept, with its status.

**Status words used everywhere:** approved (the owner said yes), proposed (suggested, not decided), deferred (wanted,
but later), rejected (the owner said no; do not bring back unless the owner does), done (built and approved).

**Rule for every session:** record each new idea the moment it comes up, in the file below that fits it, with who
suggested it, the date and its status. An alternative being discussed is not an approval.

Start the project review with the [draft master plan](MASTER-PLAN.md). The [design archive](design-archive/README.md) gathers earlier visual studies and notes.

## A. How we work

1. `CLAUDE.md` and `AGENTS.md`: entry points for Claude and Codex.
2. `docs/HOW-TO-WORK-WITH-ME.md`: the owner's main guide for how to work with them.
3. `docs/COLLABORATION.md`: who owns what (Claude: avatar movement; Codex: racing and driving) and review rules.

## B. The game as a whole

1. `docs/FEATURES.md`: every game feature idea, each with its status and feature card.
2. `docs/WORLD-RULES.md`: the world's building blocks and rules.
3. `docs/MINIGAMES.md`: minigame ideas.
4. `docs/LEARNING.md`: learning notes.
5. `docs/game-dev/`: game development knowledge (movement, cameras, animation, physics, sports, racing, shooters,
   open world, AI, rendering, feel, production, level design, networking, legal, App Store plan). Start at its
   `README.md`.

## C. The avatar

1. `docs/HANDOFF.md`, section "Confirmed by the owner": the numbered log of every avatar request, decision, rejection
   and result (avatar items 1 to 82, then 83 onward after the kart items; the newest are the imaginary waist ball, the
   spine, the research rule and this index, items 83 to 88).
2. `docs/AVATAR-DIRECTION.md`: how the avatar should look and move (athletic, deliberate weight, no sharp edges,
   golden-ratio proportions). The game-feel wording in handoff item 75 is waiting for approval before it goes here.
3. `docs/AVATAR-POLISH-LIST.md`: every small flaw found, its cause, the proposed fix and the owner's decision.
4. `docs/research/inventing-movement/REPORT.md` and its notes: how people invent systems that do not exist yet, and a
   proposed 12-step process for the avatar's movement (not chosen yet).

## D. Movement

1. `motion-core/PLAN.md`: the movement plan and its approved decisions (speeds, layers, controls on every device).
2. `docs/NEXT.md`: the movement roadmap and saved requests (items 41 to 46 describe removed code).
3. `motion-lab/README.md`: the Motion Lab's notes, kept until the owner decides.

## E. Karts and racing (Codex's area)

1. `docs/KARTS.md` and `docs/karts/`: kart designs, parts, driving references and sizes.
2. `docs/HANDOFF.md`, section "Codex driving handoff", and the kart items placed after avatar item 82 (they reuse
   the numbers 36 to 43).
3. [Kart concept catalog](karts/concepts/README.md): current paired sheets, images and build-reference handoff.
4. [Kart design decisions](karts/concepts/DECISIONS.md): tiers, racing palettes, owner revisions and deferred ideas.

## F. Ideas still waiting for a decision (23 November 2026)

1. The spine (three-piece torso on two imaginary balls): waiting for "approved" (handoff item 84).
2. The game-feel wording: waiting for approval (handoff item 75).
3. A phone test of the physics engine (Rapier 0.21 with JoltPhysics.js beside it), and hinge elbows and knees:
   from the research report, not decided (handoff item 86).
4. A range-of-motion test after the spine: proposed (handoff item 88).
5. The smoothed forearm on the shorter version, or keep only the 6 ft 4 in version; locking in the 6 ft 4 in version;
   polish items 2, 3, 7 and 8 (`docs/AVATAR-POLISH-LIST.md`).
6. Deferred: an elbow cut-out for 90-degree bends; players modifying karts.
7. Later: a ground-up rebuild of the avatar in solid, lean code once the owner is fully satisfied, and near the end of
   the game, a recheck of every line of code.
