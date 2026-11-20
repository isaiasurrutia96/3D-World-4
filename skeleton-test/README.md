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

Avatar switch: Detailed (approved, about 3.6 million triangles), Light (about
261,000) and Game (about 29,000, phone-ready). Light and Game are separate
copies made by `scripts/build-light-avatar.mjs` (Game: `LIGHT_MODE=game`) with
the same parts and joints; the approved files are never changed.
