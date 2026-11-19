# Foot socket study

The live study shows a tiny shallow socket in the foot and the original calf separately. No calf socket, ankle ball or movement rig is created. Existing camera/zoom/floor controls work on phone and desktop.

`src/small-socket.js` is independent of the earlier joint prototype. It carves a circular depression at foot-local X/Z[0,0], radius40mm and depth16mm. The radial displacement reaches zero with zero first and second derivatives at its edge; a smooth height mask protects the sole. No raised rim or extra mesh is added. Original topology, X/Z outline, sole and toes stay unchanged.

`createFootStudy({socket:false})` retains the exact original two-shape baseline. `createFootStudy()` applies only this tiny foot socket. The calf remains uncarved and separated. Existing avatar/skeleton consumers and frozen checkpoints stay unchanged.

`node --test foot-lab/tests/study.test.mjs` checks the baseline and measured tiny bowl, localized depth, original calf, topology, sole and toes. `npm run test:foot-lab` checks camera views, mobile framing, floor and touch orbit. The build retains separate joint checks for existing avatar consumers.

The current refinement doubles the original8mm depth to16mm, keeping the same footprint and C2 edge. Checks also verify that every actual triangle remains oriented and the mesh stays closed with positive volume. Keep refining the foot socket, calf socket and ball placement with the owner; save a new checkpoint only after those refinements are approved. Open `/test-lab/?test=feet` or `/foot-lab/`.
