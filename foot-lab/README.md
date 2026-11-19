# Foot and calf shape study

The live Foot Lab is reset to two original shapes, shown separately: the asymmetric foot and the reference avatar calf. No ankle ball, socket carving or motion controller is created by this page. Orbit, zoom, fixed views and floor inspection still work on phone and desktop.

`src/foot-study.js` builds this baseline using `createFootShape()` and `createCalf(foot, {socket:false})`. Both original geometry buffers stay unchanged. `createCalf` keeps its existing default behavior for other consumers; resetting this study does not rewrite Claude's avatar animation or frozen checkpoints.

Next authorized workflow: build the foot socket as one independent layer, prove its geometry, then ask the owner to review it. Do not add a calf socket or ankle ball in that step. Do not automatically restore the previous joint prototype.

`node --test foot-lab/tests/study.test.mjs` proves that exactly two original meshes are present, uncarved, on the floor and visibly apart. `npm run test:foot-lab` checks the static study, five views, floor controls, mobile framing and real touch orbit. The build also retains the separate joint checks for existing avatar consumers.

Open `/test-lab/?test=feet` for the universal viewer or `/foot-lab/` for the focused study.
