# Handoff for a fresh session

Written 20 November 2026 at the owner's request. Read `CLAUDE.md` first. Anything marked uncertain is a guess, not a decision.

Both assistants use the shared responsibilities and review record in
`docs/COLLABORATION.md`. `AGENTS.md` is the Codex entry point; it points to the
same guide and handoff rather than introducing another set of rules.

## State
1. Repo 3D-World-4. The owner's existing authorization allows pushing agreed work to `main`, whose workflow publishes GitHub Pages. Claude's handoff was prepared on `claude/lucid-pascal-xqtrwb`, then matching `main`; that is historical state, not a required branch for every contributor. Inspect the current checkout and uncommitted work before starting.
2. The Skeleton section of the Test Lab (`/skeleton-test/`) is reset to the wave point: Rest, Arms out, Arms up, Wave, Elbows bent, Kick, Knee up and Look. It also has Low/Medium/High quality buttons and a Detailed/Light avatar switch (the Light copy is a separate test asset with about 14 times fewer triangles; the approved avatar file is untouched; `scripts/build-light-avatar.mjs` makes it).
3. Preserved and untouched: all game code, assets and checkpoints, Codex's racing and driving work, and the Motion Lab with its README and checkpoint.

## Confirmed by the owner
1. Add one movement at a time. Test each with all earlier ones, at uneven frame rates, and by looking at it in a real browser. Walking and running come back in place first. Move on only when the owner says it looks good.
2. Walking and running were rejected and removed. Everything removed is in git history; the last commit before the reset is `747d0ba`.
3. Claude owns avatar movement and the Skeleton section; Codex owns racing and driving. The owner says rules and past decisions are suggestions they can change, and wants to be challenged when something is better.
4. The owner calls the whole testing page the Test Lab; the Skeleton page is one section of it.
5. (20 November 2026, new session) Keep the **rigid ragdoll avatar** with visible ball joints; it is central to the owner's goal of throws and shots that look unlike other games. Refine it rather than replace it, and do not switch to a skinned mesh. Claude does the avatar work.
6. Plan: chunk 1 is a phone-ready **Game** copy at about 29,000 triangles (Game button in the Skeleton section; made by `LIGHT_MODE=game node scripts/build-light-avatar.mjs`, approved files untouched). Chunk 2, after owner review, is refinement one item at a time: ball joint sizes, palm ball position, nose.
7. (20 November 2026) Chunk 1 approved on the owner's phone: Game on High quality is very smooth. The first-tap jolt was the graphics chip idling while nothing was drawn; Light and Game now draw every frame. **Game is the working avatar for movement work; Detailed is only for checking looks** (it is too heavy for a phone to move smoothly).
8. (20 November 2026) The owner plans to **rebuild the avatar's parts with Claude** (for example deeper arm sockets and a redone body), with **Codex reviewing the code** and the owner approving the look. **Not started:** the owner will first go over the sockets and details. This replaces the earlier plan of small refinements. The owner reminds both assistants that the rules are suggestions, not mandatory.

## Open items from the owner (for when each movement returns)
A nose (small triangle) on the head for the look pose; the ball in the middle of the palm (the palm point sits about 12 cm too far toward the wrist); sit with hands grabbing the knees; whether the squat should spread the legs first.

## Uncertain or unresolved
1. The small delay after the first button press. The frame rate dips before the first press and jumps after it, even with the Light avatar. My unproven guess is that the device slows down when nothing changes and wakes up on the press. Not confirmed on a real device.
2. The avatar triangle budget is undecided. The detailed avatar is about 3.59 million triangles, the Light copy 261,300. Codex suggested about 20,000 to 30,000 for a mobile multiplayer game. Who builds that version, and whether the original or the refined avatar is the base, is the owner's decision.
3. The old `CLAUDE.md` rules were not individually confirmed. Section C retains them during the instruction refresh. Verified dependency: `racing-lab/src/main.js` imports `motion-lab/src/page.js`, which uses the shared input module. The Test Lab is the owner's testing hub. Retiring the separate Motion study entry/page and moving reusable helpers is a proposed cleanup chunk; deleting the folder now would break driving and track inspection. This instruction/handoff work performs no cleanup or technical-rule removal.
4. Two safety tags (`before-reset-2026-11-20`, `gait-v1-reactive-2026-11-20`) exist only on the machine used and could not be pushed (error 403). Do not trust the first one; use commit `747d0ba`. The older `island-checkpoint-1-2026-11-17` tag also looked local-only.

## Practical notes
1. Building or testing can modify tracked files that belong to Codex (`racing-core`, `motion-lab`, `racing-lab`). After a build or test, run `git status` and look at what changed. Restore only files you changed by accident, and only after checking each one. Never revert whole folders automatically.
2. Check a deploy with `git fetch origin gh-pages`, then look at `skeleton-test/index.html` there.
3. Some timing tests (balance worst-frame time, hand grip speed) are load-dependent and can fail without a real problem.
4. `docs/NEXT.md` is a long log. Items 41 to 46 describe code that no longer exists; item 47 onward is current.

## Codex driving handoff

Approved reference: Driving Checkpoint 2, source
`97d2ba878f4a4ba4f0cbcb02b3613f97fc1e8b73`, frozen in
`checkpoints/driving-2/`. Tags: `driving-source-2-2026-11-20` and
`driving-checkpoint-2-2026-11-20`. Fast's physics fingerprint is
`kart-v1-c0934f4555677c0e`. The owner approved the 6% cornering-grip improvement
and .135 s settling response; normal/boost caps are 180/220 mph. The checkpoint
was rechecked with 231 racing checks, 47 control/build checks and Chromium /
WebKit checks. Numerical checks and emulation do not certify every real device.

Frozen link:
https://isaiasurrutia96.github.io/3D-World-4/checkpoints/driving-2/?drive=1&handling=fast

The owner authorized the next **controls and isometric-view chunk**, then
paused implementation to discuss assistant roles and fresh-session guidance.
No implementation for that chunk has started. Intended keyboard actions:
K Gas; M Brake/Reverse; S/F steering; Space Boost. Resolve the existing camera
and action-key conflicts; keep shared movement-page controls and the approved
handling intact. Add a zoomed-out, orbitable isometric driving view. Check the
logic and device/browser integration, deliver a working test, and stop for
owner review before the next chunk. Resume when the owner returns to it.

Later discussion: a measured F1-inspired test course and five experimental
upgrade steps. No final performance budgets, tier statistics or starter-kart
assignment have been approved. Do not implement those later chunks from these
notes alone. The separate Motion Lab cleanup is also unimplemented. The
current preparation changes documentation only; preserve game code and assets.
