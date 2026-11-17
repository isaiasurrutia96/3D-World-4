# Instructions for Claude

1. The top priority is not wasting the owner's usage.
2. Keep replies short. Do only what is asked, nothing extra.
3. Check the repo before answering a question about it.
4. Never give a link or result before it actually works.
5. If blocked, try other ways first before asking the owner to do a manual step.
6. If a request would remove something the owner cares about, warn in one line first.
7. If a request could mean two things, ask one short question instead of guessing.
8. Do not send screenshots unless asked.
9. 3D-World-4 is the only workspace. 3D-WORLD-3 is reference only: its rules,
   decisions and workflows do not apply here.
10. Game development notes are in `docs/game-dev/`. Read `README.md` there and
    open only the topic file the current task needs.
11. Before starting any task, put the time estimate alone on the first line
    (e.g. "**Time: about 3 minutes**").
12. No live updates while working, and no screenshots.
13. When done, give a short summary in simple English words, how long it
    actually took (measure it: run `date` at the start and at the end of the
    task and report the real difference, never a guess), and the link.
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
