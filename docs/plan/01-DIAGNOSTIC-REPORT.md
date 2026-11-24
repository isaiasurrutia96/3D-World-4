# Deep diagnostic of LetsGo (23 November 2026)

Written by the "LetsGo Plan" Claude chat from a read-only, multi-agent check: 10 inspectors, each checked by an independent skeptic,
then a draft plan and a completeness critic (22 agents). 171 findings survived the skeptics; 1 was thrown out as wrong. Nothing in the
project was changed. Every finding, with its evidence, is in [appendix A1](appendix/A1-diagnostic-findings.md).

**Summary.** The project has strong pieces and strong safety habits, but no blueprint. It is a set of excellent test pages that have never
been joined into one game, and the approved idea list is far bigger than one person can build. The fastest road to a working game is mostly
connecting parts that already exist, not starting over.

## A. Where the project stands, in skyscraper terms

Studios go concept, then prototypes, then a **first playable** (one small loop you can play start to finish), then a vertical slice, alpha,
beta and launch. LetsGo is in the **late prototype stage of pre-production**: lots of good test pieces, but the concept page was skipped and the
first-playable gate has not been reached.

1. 427 commits in 9 working days since 4 November (Claude 304, the owner's name 104, mostly Codex's work, and Codex 17).
2. The driving feel is approved and frozen twice (Driving Checkpoints 1 and 2), the most finished part of the game.
3. The avatar can hold 8 poses but cannot walk; walking and running were removed on 20 November.
4. The block island in `src/world` has real solid ground but is only about 6 m across.
5. 35 design cards are approved (15 features, 20 minigames).
6. The avatar, the kart and the island have never been in one world, and there is no race with a finish line yet.

## B. What is genuinely strong (keep all of it)

1. Approved versions are frozen with a fingerprint on every file, and the build refuses to publish if a frozen file changed.
2. The build passes, and about 1,160 automatic checks that run without a browser all pass.
3. Codex's racing engine (`racing-core`) is separate from the graphics, runs the same on slow and fast phones, and works in other worlds.
4. Phone basics are handled: touch controls, notched screens, sharpness caps, pausing when hidden.
5. The 12-question feature card template is professional practice.
6. The design reuses parts well: one ball system, one hit system, one grip system, one minigame flow.
7. Records are honest and dated, including rejections.
8. In a test, the island, the phone avatar, the movement rules, the kart physics and the controls built into one file with zero errors.
9. No passwords or keys were found anywhere in the history, and every outside library allows commercial use.

## C. Problem 1: there is no blueprint

1. No one-sentence pitch, no written core loop, no target player age, no design pillars.
2. No Version 1 list and no first-playable target, so nothing says when the game is done or what is out of scope.
3. "Levels" unlock things in about 10 places, but no card explains how a level is earned.
4. The feel is unsettled: some notes say cartoon arcade, others realism (2026 F1 data, six-gear GT).
5. Seeds of strong pillars already exist: the chunky ragdoll athlete whose throws look unlike other games, real-feeling sports with no aim
   guides, a connected world with no loading screens, one block world where every surface behaves the same.

## D. Problem 2: the plan is studio-sized

1. 15 feature cards, 20 minigames, 26 blocks, 3 kart classes with 20 styles each, a connected island world and building.
2. Online worlds of 100 to 200 players appear in 14 of 15 feature cards; online is the riskiest feature for one person.
3. The cards need about 50 to 65 avatar movements.
4. All 35 cards were approved on one day (19 November) with no order of priority.
5. Research: every solo hit checked took several times longer than planned (Stardew Valley about 4 years, Animal Well 7).
6. Good sign: the owner already cuts scope well inside cards (football is throwing only, bikes removed, one kart model per class first).

## E. Problem 3: looks before the game works

1. From 21 to 23 November about 55% of commits were small New avatar changes and about 27% kart design.
2. Claude's movement code had not changed since the 20 November reset.
3. Each small "a bit deeper" change cost a full round trip (message, code, push, about a 10-minute publish, phone check).
4. The New avatar is about 509,000 to 517,000 triangles, about 17 times the approved 29,000 phone budget (a lean rebuild is planned).
5. Racing widened too: 10 handling setups and detailed GT3 and 2026 F1 simulations while race rules were "not started".

## F. Problem 4: the restart habit

1. Walking and running were built about five to seven times and all removed.
2. The avatar restarted several times; joint sockets were solved three separate times.
3. A racing version with four computer opponents was replaced the same day without comparing the two.
4. A hidden conflict likely caused some walking rejections: the game speeds (walk 3.1 m/s, run 8.6 m/s) are too fast for the avatar's legs if
   feet may never slide.
5. Standard animation methods (key-pose clips, blending, CC0 libraries) were never compared against hand-coding each move.

## G. Problem 5: the pieces have never met

1. About 18 to 20 separate test pages each build their own scene, camera, loop and controls.
2. No race exists in the current code (no countdown, laps, finish, results, opponents or ghosts), but the old 18 November prototype's race
   logic still passes its tests.
3. The avatar cannot walk, jump or stand on the island ground yet; jump and gravity code exists in the old front-page prototype.
4. A kart drives off the 6 m island in half a second; the first shared world must be bigger.
5. Two sets of kart sizes existed (fixed since then: see `docs/KART-DESIGN.md`).
6. Nobody owned "putting it all together" or kart-against-block collision.

## H. Problem 6: the workshop is slow

1. Every change waited 6 to 10 minutes before the owner could see it (under half a minute on 17 November).
2. About 290 of 308 seconds of browser checks are racing checks, and they run even for avatar-only changes.
3. One driving check caused all 3 recent failed publishes; when it fails, nobody's work goes live.
4. Every push cancels the publish already running (18 of the last 100 were cancelled).
5. About a quarter to a third of commits changed only notes, yet each ran the full publish.
6. Avatar and movement tests never run before publishing, and a few older tests are quietly broken.
7. Every new chat must read about 17,300 words first; `docs/HANDOFF.md` alone is over 13,000 words.

## I. Problem 7: the records disagree

1. About ten design contradictions (kart top speed 120 vs the approved 180; ghosts "exist" vs "not started"; blocks never placed vs home building).
2. Rule files give three different "read this first" instructions.
3. The checkpoint list leaves out three of seven checkpoints; two have no permanent tag.
4. The phone triangle budget is "approved" in one file and "undecided" or "a proposal" in others.

## J. Problem 8: the idea is public, and someone else's property is mixed in

1. The repo is public with no license: every feature card, minigame, world rule, kart plan and concept image can be read today. Very few
   people looked (32 views from 7 visitors in 14 days, 0 forks, 0 stars).
2. Game ideas cannot be copyrighted, so keeping plans private and finishing first are the real protection. Decided 24 November: GitHub Pro and
   a private repo (see [03-GOING-PRIVATE.md](03-GOING-PRIVATE.md)).
3. Nintendo's Mario model and walk animation (decoded from Super Mario 64) are on the public site, in the old walk and run test pages, inside
   frozen checkpoint test-lab-1 and in git history, and `docs/NEXT.md` tells sessions to use them. This needs an owner decision.
4. Real-world names: "Suzuka Circuit", a GT body inspired by the 2026 Porsche 911 GT3 R, and the "F1" and "GT3" labels. Cheap to rename now.
5. "LetsGo" is a working title; "Let's Go" is common and already used in Pokémon titles.
6. Most code is AI-written; purely AI-made work cannot be copyrighted, so the owner's dated decisions and hand-made design choices matter most.
7. Nothing stops a force-push or deletion on `main`; a free GitHub setting would block it.
8. The owner's personal email address appears on about 106 public commits.

## K. Corrections made after the first write-up

1. A warning that saved test results would fill paid storage was wrong: those files are about 1 KB each. The large storage is GitHub's own
   copy of the published site (about 137 MB per publish, kept one day), and whether it counts toward billing is unconfirmed.
2. The first draft plan handed the owner 19 decisions at once; the owner's rules say experts decide expertise questions and the owner decides
   purpose and taste, one step at a time.
3. The audit used a copy 5 commits older than that evening's `main`; later commits are covered by the newer research in this folder.
4. Not checked: GitHub account security (two-step login), the contents of the Gemini-3D-WORLD repo, the owner's weekly hours, and anything on a
   real iPhone. The game has no sound yet.
