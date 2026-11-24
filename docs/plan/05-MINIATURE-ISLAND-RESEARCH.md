# Miniature island research (23 to 24 November 2026)

**Owner direction (23 November 2026):** build a miniature version first where everything works: one island big enough for two race tracks
per kart class (S Kart / GoKart, GT, F1), a small skate park or skate obstacle course, and a practice field with a small practice station for
every minigame (for example a little hoop next to a soccer net), like the obstacle course in the old 3D-WORLD-3 repo. Keep it small enough
that it does not take years, keep it flexible, then build the big world.

Nine researchers each compared proven methods and ran tests; nine skeptics re-checked and re-tested them. Full data:
[appendix A5](appendix/A5-miniature-island-research.md). Status: **research done; the master plan step will be rerun with the owner's latest
ideas** (`docs/LETSGO-MASTER-PLAN-NOTES.md`, `docs/IDEAS-INDEX.md`), the movement plan and the hosting decision. The skeptics' versions are
used below wherever they corrected the researcher.

## A. Island size and layout

1. One "racing park" island: the F1 circuit rings the edge; the GT and S Kart circuits, the practice field, the skate spot, the obstacle strip
   and the hub sit inside it. No bridges or tunnels.
2. Each class keeps its own roads; its two tracks are two layouts sharing part of one road (like Silverstone's National and GP layouts).
3. Plan about 430 x 335 m (about 14 hectares) for medium road widths (S Kart about 13 m, GT 17 m, F1 20 m). Narrow roads allow about
   390 x 300 m; today's 26 m roads need about 480 x 375 m. For scale, the whole island is smaller than the old Original Circuit alone.
4. Road width is a feel choice: the owner drives one short loop at three widths on the phone before the island is fixed.
5. Laps of about 22 to 44 seconds were measured with the real racing-core karts on the test layout.
6. The ground must be a new height-map method; today's block storage cannot hold even a 220 m square. The approved 14 x 14 island stays as is.

## B. Six tracks in the racing engine (Codex's area)

1. The engine already drives, collides and times laps on short island tracks with every kart class: 70 of 70 test laps, zero falls.
2. The only hard block is a fixed list of four track names; a small fix works but needs one extra type fix (the first patch broke one check).
3. No driving feel needs retuning: track size per class sets lap time. Rough sizes: S Kart 500 to 600 m, GT 850 to 1,000 m, F1 1,000 to 1,250 m.
4. Build one complete race on one track first (start lights, 3 laps, checkpoints, wrong-way, respawn, results), then the other tracks.
5. The old race logic is a guide and test reference, not copied code, because Codex's notes retire the old prototype.
6. A reversed layout or a shared-road layout could count as a class's second track (owner's choice).

## C. Practice field

1. One compact sports park around a plaza: each station offers free play plus one short challenge with bronze, silver and gold medals and a saved best.
2. Start with exactly the owner's picture: one futsal goal with a basketball hoop at the real 3.05 m height, plus the shared pieces (challenge
   runner, one aim-and-power control with 2 or 3 phone styles to try, a "go to station" button).
3. Use each game's own short round as its challenge where the card has one (basketball's 60 seconds, archery's 10 arrows, darts' quick mode).
4. Two small hand-written systems (ball flight, rolling balls) can drive most stations from tiny data files; four fixes found by the skeptic
   come first (baskets only count downward through the rim, balls bounce off walls, cheap checks for arrows and darts, exact gravity).
5. Build stations in batches by what the ball does: target games, things that stick, table and lane games, hitting with a tool. Walking,
   jumping and riding stations wait for avatar movement.
6. Field about 46 x 64 m plus separate zones for skate, ice and ski.

## D. Physics

1. Keep hand-written physics for karts, walking and the ball system.
2. Add Rapier (pinned 0.21.0, plain build) only when the first station that needs tumbling objects (bowling pins) is built; load it only there.
3. Rapier's JavaScript joint limits have traps; if ragdoll falls look wrong, test Jolt. Decide when the hit system is built, with the owner watching.
4. Budget about 1.5 to 3 ms per frame for physics during play at phone-like speed; confirm on the real iPhone.

## E. Avatar movements

1. Every movement as a short list of key poses stored as data, played by the existing pose player, with foot-planting and hand-reaching on top.
2. The owner's old LetsGo Racing walk (3D-WORLD-3) already blends key-pose walk and sprint by speed with planted feet; port it with approval.
3. CC0 libraries (for example Mesh2Motion) have usable drafts for throw, archery, kicks, bat swing, driving and sitting; others are made by hand.
4. A version 1 list of about 22 clips: idle, walk, run, jump, turn; kart get in, drive, get out; skateboard stance, push, ollie; about 10
   station moves by family.
5. See [04-MOVEMENT-PLAN.md](04-MOVEMENT-PLAN.md) for the approved structure and the speed question.

## F. Skate park

1. A hand-written "board vehicle" that rides like a kart, no physics engine (Rapier bounced off ramps in tests).
2. Moves: push, lean to steer, brake, one-button ollie (about 0.7 m), automatic grind on grindable edges, simple air spin, fall and get up.
3. Stage 1 street spot (kicker, ledge, box, flat rail); Stage 2 one mini ramp. Riding back and forth 10+ times is a required test.
4. Needs one new world feature first: ramps (wedges and curves) in the ground query, which walking, karts and balls also use.

## G. One world on a phone

1. One new game page (or, to keep `CLAUDE.md` rule 16 literally, the existing lab shell's simulation hook first; owner to confirm).
2. Load the whole island at start; only nearby areas run their physics. No streaming at this size.
3. Merge static scenery into large pieces: separate objects cost about 1,233 draw calls in the worst view, merged about 30 to 45.
4. Every area is one entry in a single layout data file checked by tests, so "move the hoop next to the soccer net" is a one-line change.
5. Provisional phone budget: about 100 draw calls, about 300,000 visible triangles, blob shadows in races, confirmed once on the owner's iPhone.

## H. Biggest time savers (measured)

1. Change-aware publishing: notes-only pushes skip publishing; slow racing checks run only when the racing page actually changed; untouched
   old labs are reused. A typical avatar or world change would publish in about 2 to 2.5 minutes instead of 9 to 10.
2. Slider panels on the phone with a "copy for chat" button: about 40% of recent avatar commits were small number tweaks.
3. Audited ports of the owner's own proven code from 3D-WORLD-3 (kart get in and out, mini golf ball, compact track method), rewritten to keep
   logic and drawing separate. Saves hours to days, not weeks.
4. A one-screen status page instead of the long handoff as required reading.

## I. Planning method

1. One thin island page first, then one area at a time in grey blocks, each with a plain pass or fail exit test.
2. Now / Next / Later planning, detailing only the next two weeks; effort limits with a written cut list per milestone.
3. Short dated decision records marked current or replaced.
4. Codex leads racing, the ball and minigame rules, the page shell and release; Claude leads world rules, movement, the action interface for
   throws and kicks, and the avatar. The skate board is joint. These follow recommended (not confirmed) rows in `docs/COLLABORATION.md`.

## J. Owner questions this research raised (taste only, to be asked one at a time)

1. Road width after the phone test; whether reversed or shared-road layouts count as second tracks; race length; where the approved Fast kart races.
2. Combined goal and hoop or separate; real-size or toy-size gear; long ranges over the sea or fenced on land; medals only or coins too.
3. Ground look (stepped blocks or smooth; both cost about the same); sky or slate blue for the game world.
4. Skate: game-style or realistic quarter-pipe airs; automatic or button grinds; ollie size; landing forgiveness; mini ramp in the miniature or later.
5. What to play first (a short time trial or walking the hub); placeholder look until walking is approved; trusted testers; how long to spend on the miniature.
