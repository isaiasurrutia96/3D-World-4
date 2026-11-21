# New avatar (version 2)

The rebuild of the avatar, one part at a time, shown in the Test Lab section
**New avatar** (`new-avatar/`). The approved avatar (`avatar/`) is the look
reference and is never changed from here.

Current state: the **torso as one piece** and **both arms with the new elbow**,
all drawn from numbers rather than stored meshes. Shoulders and wrists are plain
rounded ends until those joints are built.

The joint approach (owner-approved): a round ball at each joint; each socket is
deep where the joint does not bend and cut away where it does (the elbow is deep
at the back, open at the front); limbs stay slimmer than the balls so the body
never looks puffy; an inner crease lets the limbs fold. Rigid limbs this thick
bend cleanly to about 130° at the elbow; the skeleton allows 150° (left as is
until the owner decides).

| File | What it is |
|---|---|
| `torso-shape.js` | Turns the torso numbers (stacked rings, one radius per direction, rounded caps) into a sealed surface. Used by the page and the builder. |
| `torso.json` | The torso numbers, plus `attach`: where the old arm and leg balls sat, kept as data for adding limbs later. |
| `fit-torso.mjs` | Makes `torso.json` by measuring the reference torso, filling the socket dents and the seam, and smoothing. Tuning values are at the top. |
| `torso-source.json` | The reference: chest and pelvis copied from the Game avatar by `build-torso.mjs`. |
| `limb-shape.js` | Any limb with its sockets: shaft thickness profile, cup rims (depth per direction), crease, rounded caps; also the inside test used by the collision checks. |
| `arm.js` | The arm's numbers: joint centres from the skeleton, thickness, socket rims, crease, and the clean bend range. |
| `check-elbow.mjs` | Bends and twists the elbow through its range and checks for collisions, seating, sealed shells, thickness and existing poses. |
| `measure-arm.mjs` | Prints the old arm's thickness profile (reference only). |
| `check-torso.mjs` | Checks: one piece, sealed, faces outward, no dents or grooves, same size as before, under 6,000 triangles. |

Commands: `node avatar-v2/fit-torso.mjs` (rebuild the torso, same result every
time), `npm run test:new-avatar` (checks), `node new-avatar/build.mjs` (page).
