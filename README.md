# 3D-World-4

**Official avatar, 19 November 2026:** the approved original body shapes and
ball-and-socket assembly are pinned in [avatar/official.json](avatar/official.json).
Our avatar and Skeleton in the universal Test Lab use this same model.
Claude's movement work should use the [animation handoff](avatar/ANIMATION-HANDOFF.md)
and `avatar/src/official-avatar.js`; earlier checkpoints remain historical.

Historical avatar baseline: **Checkpoint 2**, saved on 17 November 2026.

[Drive the Racing Lab](https://isaiasurrutia96.github.io/3D-World-4/racing-lab/): section 1 tests solo driving on any of the four tracks, using Left/Right and Gas buttons on phones, keyboard or a controller. No NPC racers are spawned.

[Racing core](racing-core/README.md) is the code-first rebuild of Original, Skyline, Suzuka and Winding from 3D-World-3. It separates track geometry, kart physics, four NPC opponents, race rules and ghost records from presentation. Run `npm run test:racing-core`; [recorded test results](racing-core/TEST-RESULTS.json) include five-kart, three-lap races on every circuit.

[Open Motion Lab](https://isaiasurrutia96.github.io/3D-World-4/motion-lab/): the code-first movement test template, using one keyboard/mouse/touch/gamepad input module and Claude's unmodified motion core. It currently shows a marker, with placeholder visuals. [Motion Lab checkpoint 1](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/motion-lab-1/) preserves this working baseline.

[Open Test Lab](https://isaiasurrutia96.github.io/3D-World-4/test-lab/): one workspace for the avatar, walking, running, hands, feet and world studies. View buttons sit below the model; scroll down for test controls and walking/running videos with slow playback. The avatar's athletic movement direction is saved in [AVATAR-DIRECTION.md](docs/AVATAR-DIRECTION.md).

Approved lab baseline: [Test Lab checkpoint 1](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/test-lab-1/), with its own frozen tests and videos. Restore editable sources from tag `test-lab-checkpoint-1-2026-11-17`.

[Try the walking test](https://isaiasurrutia96.github.io/3D-World-4/walk-test/) or the separate [running test](https://isaiasurrutia96.github.io/3D-World-4/run-test/) on the slate-blue stage and dark-grey slab. Mobile: drag anywhere on the left to move; push farther for more speed. Drag the right side to look around. Walking uses its own gait, with no airborne phases. The [earlier prototype](https://isaiasurrutia96.github.io/3D-World-4/movement/) remains available.

The current run uses the reviewed motion, adapted to floor contact. [Compare Mario and our avatar performing the same motion](https://isaiasurrutia96.github.io/3D-World-4/references/motion-compare/) side by side, frame for frame, with shared Normal/Slow playback. The comparison preserves the earlier pose study; the walking and running links above are interactive tests. The [original SM64 reference](https://isaiasurrutia96.github.io/3D-World-4/references/sm64-walk/) and [earlier avatar preview](https://isaiasurrutia96.github.io/3D-World-4/references/avatar-walk/) remain available.

[Open the frozen checkpoint](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/avatar-2/).

Permanent Git tag: `avatar-checkpoint-2-2026-11-17`. Its manifest is [CHECKPOINT.json](checkpoints/avatar-2/CHECKPOINT.json). It preserves the earlier assembly with saved hand/foot motion.

Historical editable assembly: [avatar-lab/src/avatar.js](avatar-lab/src/avatar.js), viewed at `/avatar-lab/`. Current avatar work uses the official entry point above. Keep saved checkpoint files and tags intact.

The previous `avatar-approved-2026-11-17` checkpoint remains available. See [checkpoint history](checkpoints/README.md).
