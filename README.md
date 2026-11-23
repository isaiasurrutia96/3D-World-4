# 3D-World-4

## A. Current pages

1. [Open Test Lab](https://isaiasurrutia96.github.io/3D-World-4/test-lab/): the shared workspace for avatar, Skeleton, new-avatar, kart and world studies. Choose a subject, inspect it, and open Motion for its available controls. Video animation is intentionally empty while movement is rebuilt.
2. [Drive the Racing Lab](https://isaiasurrutia96.github.io/3D-World-4/racing-lab/?drive=1&handling=fast): the approved driving-feel test on four tracks. It uses the original test kart, separate phone buttons, keyboard or controller input. This is a solo test, not a complete race session.
3. [Inspect the tracks](https://isaiasurrutia96.github.io/3D-World-4/test-lab/?test=tracks): checked track geometry without driving. Its workspace also links to the driving test. The standalone `/racing-lab/` URL is inspection; `?drive=1` enables driving.

## B. Current work and approved references

1. Fresh racing logic is in `racing-core/track/`, `kart/`, `contacts/` and `testing/`. Decisions and measured results are in [racing-core/PLAN.md](racing-core/PLAN.md). The approved Fast handling reference is [Driving Checkpoint 2](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/driving-2/?drive=1&handling=fast). Earlier root-level racing modules and their NPC/lap/ghost results belong to the superseded prototype; they do not establish a finished race in the fresh rebuild.
2. The original approved joint assembly is pinned in [avatar/official.json](avatar/official.json), with its [animation handoff](avatar/ANIMATION-HANDOFF.md). Skeleton has Detailed, Light and Game copies. New-avatar and Karts are separate ongoing studies; their presence is not approval to replace the driving model or handling.
3. Current avatar movement status, ownership and the owner's latest decisions are in [docs/HANDOFF.md](docs/HANDOFF.md) and [docs/COLLABORATION.md](docs/COLLABORATION.md). Older walking/running pages do not represent the current approved movement work.
4. The [kart design brief](docs/KART-DESIGN.md) records the stock kart measurements, cockpit positions, and dimensioned drawings.

## C. Build and regression checks

1. Install dependencies with `npm ci`. Run `npm run test:lab-foundations`, `npm run test:official-avatar` and `npm run test:racing-core`, then `npm run build`.
2. Install the test browsers with `npx playwright install --with-deps chromium webkit`, then run `npm run test:lab-foundations-browser`. The same checks gate publishing and run on pull requests. They cover active routes, shared input, driving, camera and app-return regressions. Physical-device smoothness and subjective feel still need owner testing at an appropriate milestone.
3. [Foundation notes](test-lab/FOUNDATIONS.md) explain the scope, input contract and checks. The [Motion Lab](motion-lab/README.md) remains a marker/input harness and shared implementation dependency, not a second avatar-development hub.

## D. Historical studies and checkpoints

1. Frozen releases remain in [checkpoint history](checkpoints/README.md), including [Test Lab checkpoint 1](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/test-lab-1/), [Motion Lab checkpoint 1](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/motion-lab-1/) and [Avatar checkpoint 2](https://isaiasurrutia96.github.io/3D-World-4/checkpoints/avatar-2/). Their files, manifests and tags stay intact.
2. `/walk-test/`, `/run-test/`, `/movement/`, the site root and the [motion comparison](https://isaiasurrutia96.github.io/3D-World-4/references/motion-compare/) preserve earlier prototypes and references. Use the current Test Lab and handoff when judging present work.
