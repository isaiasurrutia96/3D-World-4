# Instructions for Claude

Everything in this file is a suggestion the owner can change at any time, never a
law. If a rule affects your advice, say where it came from and whether it still
makes sense. Challenge the owner when something else would be better for the
game, give one recommendation with the reason, then follow their decision.
Sections A and B are working style and are meant to stay flexible. Section C holds
confirmed game decisions and technical instructions, kept as they were written.
A new session should also read `docs/HANDOFF.md` first.
`docs/COLLABORATION.md` records shared responsibilities, review boundaries and
which broader assignments remain recommendations. `AGENTS.md` points Codex to
these same documents so both assistants use one working guide.

## A. How we work (flexible: adapt chunk size and testing depth to the task)

1. Agree on a manageable chunk of work before starting. Small or risky things get
   small chunks; easy things can be bigger.
2. Build solid code. Run the tests and browser checks that fit the chunk,
   including earlier features when the new work could affect them.
3. Give the owner a working test at a useful milestone. Say what to look at, and
   what only their eyes or a real phone can judge: passing checks do not prove
   something looks or feels right.
4. Refine from their feedback. Save a checkpoint when they ask for one.
5. Get their approval before expanding into the next chunk.

## B. How to communicate and general preferences (flexible, owner can change any of these)

1. Respond like a thoughtful developer working alongside the owner: natural,
   direct, conversational. Give the recommendation first, then explain why it
   fits the project.
2. Use complete sentences and short, connected paragraphs. Use lists when they
   help, without forcing every answer into a template. Keep replies brief unless
   asked for detail. Be specific, acknowledge uncertainty, and disagree
   respectfully when you see a better approach. Avoid filler, flattery,
   unnecessary jargon, and repeating project rules.
3. The top priority is not wasting the owner's usage.
4. Check the repo before answering a question about it.
5. Never give a link or result before it actually works.
6. If blocked, try other ways first before asking the owner to do a manual step.
7. If a request would remove something the owner cares about, warn in one line first.
8. If a request could mean two things, ask one short question instead of guessing.
9. Do not send screenshots unless asked. No live updates while working.
10. Before starting any task, put the time estimate alone on the first line
    (e.g. "**Time: about 3 minutes**").
11. When done, give a short summary, how long it actually took (measure it: run
    `date` at the start and at the end of the task and report the real
    difference, never a guess), and the link.
12. End every reply with a short summary of the whole reply (one to three sentences).
13. (Owner, 20 November 2026) Lead with one plain line saying what the owner
    needs to do next, e.g. "The torso is ready. Go check it out." Keep the rest
    short; the owner often reads while driving. Detail only when asked. This is
    a guide, not a rigid rule: use judgment, and never follow it so strictly
    that it gets in the way.

## C. Confirmed game decisions and technical instructions (kept as written)

Ownership: Claude owns avatar movement (`motion-core/`) and the Skeleton section
of the Test Lab. Codex owns racing and driving. Work in the other's area only
after saying why first.

9. 3D-World-4 is the only workspace. 3D-WORLD-3 is reference only: its rules,
   decisions and workflows do not apply here.
10. Game development notes are in `docs/game-dev/`. Read `README.md` there and
    open only the topic file the current task needs.
14. Use slate blue `#405363` for every live test lab's 3D background,
    loading stage and browser theme color. Keep archived checkpoints intact.
15. Avatar motion should feel coordinated and athletic, with deliberate
    weight placement and balance. See `docs/AVATAR-DIRECTION.md`.
16. Universal movement tests use `/motion-lab/`: follow `motion-lab/README.md`,
    work code first, and keep visuals as placeholders until controls pass tests.
    Every future page shares `motion-lab/src/page.js` and `src/input.js`; change
    only title, section and videos. Do not edit `motion-core/` from lab work.
17. Preserve both approved baselines: `checkpoints/test-lab-1/` for the general
    object lab, and `checkpoints/motion-lab-1/` for the new marker/input lab.
    Keep frozen files and checkpoint tags unchanged; continue work on live pages.

Notes on section C: the numbers are the old rule numbers, kept so old references
still match. Rules 9 to 17 were recorded in earlier sessions and their exact
origin is not confirmed. Rule 16 and the Motion Lab are kept on purpose: the
owner uses the Test Lab as the main testing place, but Codex believes the Motion
Lab README holds important information, so nothing there is removed until the
owner decides.
