# LetsGo master plan

Working draft for owner review · 23 November 2026

LetsGo is an open world to explore on foot and by kart. The prototype phase
established what the owner likes about the world, driving, avatar and parts.
This draft proposes a first playable slice and gathers the decisions that
should guide it. [Full ideas index](IDEAS-INDEX.md)

## A. Direction already recorded

1. **Exploration and activities.** The world connects free-roam driving,
   trails, tracks, water and places to play. The watch, free-roam kart rules,
   swimming and the world’s shared surface rules already have their own
   records. [Game features](FEATURES.md) · [World rules](WORLD-RULES.md) ·
   [Minigames](MINIGAMES.md)
2. **Controls and game feel.** The web is the first target, with shared
   keyboard, touch and controller input. The owner wants readable weight and
   momentum in both handling and movement, and tests feel on the actual
   devices. [Platform decision](NEXT.md) · [Racing plan](../racing-core/PLAN.md) ·
   [Avatar direction](AVATAR-DIRECTION.md)
3. **Three kart classes.** S, GT and F1 have recorded stock body choices,
   dimensions and separate handling goals. Each class has four planned tiers
   called Standard, Premium, Exotic and Special Edition (working name).
   Classics and rare designs can appear in either of the last two tiers.
   The owner wants a base and an upgraded visual for each body.
   [Stock design brief](KART-DESIGN.md) · [Kart concept catalog](karts/concepts/README.md)
4. **One source of truth per system.** Claude leads avatar movement; Codex
   leads driving and racing. Use the shared division of responsibilities
   when the player and kart meet. The owner approves appearance and feel.
   [Collaboration](COLLABORATION.md) · [Current handoff](HANDOFF.md)

## B. Where the project stands

| Area | Evidence and next gap |
| --- | --- |
| Driving | The standalone Driving Test and frozen driving checkpoints provide behavior references. The selected stock bodies, their real dimensions, and progression still need to be verified in the live driving path. [Driving plan](../racing-core/PLAN.md) · [Checkpoints](../checkpoints/README.md) |
| Kart art | The archive contains numbered GT and S pairings plus F1 explorations. The production shortlist, individual turnarounds and fitted 3D parts are still pending. [Kart catalog](karts/concepts/README.md) |
| Avatar | The shared handoff records the visible ball-joint direction, current 6′4″ proportion study, polish, and pending choices. Cockpit art used the stock drawing; confirm fit with the chosen in-game rig. [Handoff](HANDOFF.md) · [Avatar polish](AVATAR-POLISH-LIST.md) |
| World | Terrain rules and feature cards are recorded. Island studies show possible layouts. The first playable area and what it should connect are owner decisions. [World rules](WORLD-RULES.md) · [World studies](design-archive/README.md#b-world-and-blocks) |
| Later game | Progression, the broader minigame roster, online play and sales belong to the ideas and feature records. Their order and release scope are open. [Ideas index](IDEAS-INDEX.md) · [Feature cards](FEATURES.md) |

## C. Proposed build order

1. **Review this plan and pick the first loop.** Start with one small
   connected area using existing terrain and driving references. The proposed
   loop is to walk to a parked S kart, get in, drive from road to a second
   surface, try one short time trial, park, and get back out to explore.
   That one loop lets us check the handoff between avatar, kart, controls,
   surfaces and the open world together.
2. **Fit one stock kart per class in the Driving Test.** Start with the S
   kart for the first loop. Check the actual seated avatar, hand and pedal
   reach, steering sweep, wheel clearances, enter and exit space, camera,
   reset and recovery. Use the measured stock chassis and compare handling
   to the checkpoints before tuning across the three classes.
3. **Turn selected concepts into modular assets.** Record the chosen kart
   IDs and parts. Make front, rear, left, right, top and underside views at
   one scale, both three-quarter views, and mounting close-ups. Keep axle
   centers and the floor datum consistent. Fit one assembled kart and one
   meaningful upgrade before expanding the catalog. Continue the F1
   exploration with four base karts and four matching upgraded builds per
   themed batch. [Art handoff and status](karts/concepts/README.md)
4. **Review the first loop on real hardware.** Check walking and driving
   feel, touch controls, camera and frame pacing on the owner’s phone.
   Check keyboard and controller behavior and agree what needs improving.
   Save an owner-reviewed checkpoint when the loop is ready.
5. **Grow outward from that loop.** Add connected areas, surfaces, race
   formats, the watch and garages as their dependencies become ready. Plan
   day and night, gear and progression, other activities, and online play
   from the feature cards. Review performance, saves and release scope as
   those systems are introduced.

## D. First owner review

1. Agree on the starting area and which activity should anchor the first
   ten minutes of exploring.
2. Pick the kart concept IDs to turn around for Claude and identify which
   body and parts should be built first.
3. Confirm which finished game-avatar rig should be used for cockpit fit.
4. Review the four tier names and decide how classics, rares, lights and
   other upgrades fit into unlocks or purchases.
5. Review which existing ideas belong in the first playable checkpoint,
   which should come later, and which still need experiments.

## E. Where to look

1. [Ideas index](IDEAS-INDEX.md) tracks older and new ideas in their owning
   documents with approval, proposal, deferral and rejection status.
2. [Kart design brief](KART-DESIGN.md) and [parts kit](karts/PARTS-KIT.md)
   contain stock dimensions and part definitions.
3. [Kart concept catalog](karts/concepts/README.md) gives the numbered
   sheets and explains which revision to use.
4. [Design archive](design-archive/README.md) contains the older world and
   avatar studies and the earlier workspace design notes.
