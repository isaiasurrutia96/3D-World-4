# Handoff for a fresh session

Written 20 November 2026 at the owner's request. Read `CLAUDE.md` first. Anything marked uncertain is a guess, not a decision.

## State
1. Repo 3D-World-4. Develop on branch `claude/lucid-pascal-xqtrwb`; the owner has allowed pushing to `main`, which is what publishes the site (GitHub Pages from `main`). At the time of writing nothing was uncommitted and the branch and `main` matched.
2. The Skeleton section of the Test Lab (`/skeleton-test/`) is reset to the wave point: Rest, Arms out, Arms up, Wave, Elbows bent, Kick, Knee up and Look. It also has Low/Medium/High quality buttons and a Detailed/Light avatar switch (the Light copy is a separate test asset with about 14 times fewer triangles; the approved avatar file is untouched; `scripts/build-light-avatar.mjs` makes it).
3. Preserved and untouched: all game code, assets and checkpoints, Codex's racing and driving work, and the Motion Lab with its README and checkpoint.

## Confirmed by the owner
1. Add one movement at a time. Test each with all earlier ones, at uneven frame rates, and by looking at it in a real browser. Walking and running come back in place first. Move on only when the owner says it looks good.
2. Walking and running were rejected and removed. Everything removed is in git history; the last commit before the reset is `747d0ba`.
3. Claude owns avatar movement and the Skeleton section; Codex owns racing and driving. The owner says rules and past decisions are suggestions they can change, and wants to be challenged when something is better.
4. The owner calls the whole testing page the Test Lab; the Skeleton page is one section of it.

## Open items from the owner (for when each movement returns)
A nose (small triangle) on the head for the look pose; the ball in the middle of the palm (the palm point sits about 12 cm too far toward the wrist); sit with hands grabbing the knees; whether the squat should spread the legs first.

## Uncertain or unresolved
1. The small delay after the first button press. The frame rate dips before the first press and jumps after it, even with the Light avatar. My unproven guess is that the device slows down when nothing changes and wakes up on the press. Not confirmed on a real device.
2. The avatar triangle budget is undecided. The detailed avatar is about 3.59 million triangles, the Light copy 261,300. Codex suggested about 20,000 to 30,000 for a mobile multiplayer game. Who builds that version, and whether the original or the refined avatar is the base, is the owner's decision.
3. The old `CLAUDE.md` rules were not individually confirmed. They are kept in section C of `CLAUDE.md` as written. The Motion Lab may hold important information (Codex's view); do not delete it without the owner's decision.
4. Two safety tags (`before-reset-2026-11-20`, `gait-v1-reactive-2026-11-20`) exist only on the machine used and could not be pushed (error 403). Do not trust the first one; use commit `747d0ba`. The older `island-checkpoint-1-2026-11-17` tag also looked local-only.

## Practical notes
1. Building or testing can modify tracked files that belong to Codex (`racing-core`, `motion-lab`, `racing-lab`). After a build or test, run `git status` and look at what changed. Restore only files you changed by accident, and only after checking each one. Never revert whole folders automatically.
2. Check a deploy with `git fetch origin gh-pages`, then look at `skeleton-test/index.html` there.
3. Some timing tests (balance worst-frame time, hand grip speed) are load-dependent and can fail without a real problem.
4. `docs/NEXT.md` is a long log. Items 41 to 46 describe code that no longer exists; item 47 onward is current.
