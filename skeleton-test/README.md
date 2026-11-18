# Skeleton test (sections 2 and 3)

The approved Checkpoint 2 avatar hung on the new skeleton
(`motion-core/skeleton/`). Each clay part rides on one bone and turns about
the centre of its joint ball, so sockets stay seated. The chest is the one
exception: it rides on the waist bone and its surface bends softly toward
the upper-chest bone (`avatar-lab/src/chest-bend.js`). Poses move smoothly
(section 3); "Show bones" draws the skeleton.

`attach.js` is the glue (skeleton → meshes). Checks: `npm run test:attach`
and `npm run test:chest`. Build: `node skeleton-test/build.mjs`. Open in the
Test Lab as "Skeleton". Visuals are placeholders.
