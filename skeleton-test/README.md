# Skeleton test (section 2)

The approved Checkpoint 2 avatar hung on the new skeleton
(`motion-core/skeleton/`). Each clay part rides on one bone and turns about
the centre of its joint ball, so sockets stay seated. Fixed test poses and a
"Show bones" view; smooth blending between poses is section 3.

`attach.js` is the glue (skeleton → meshes). Checks: `npm run test:attach`.
Build: `node skeleton-test/build.mjs`. Open in the Test Lab as
"Skeleton (section 2)". Visuals are placeholders.
