# New avatar (version 2)

The rebuild of the avatar, one part at a time, shown in the Test Lab section
**New avatar** (`new-avatar/`). The approved avatar (`avatar/`) is the look
reference and is never changed from here.

Current state: the **clean one-piece torso** plus torso options made from it
by numbers (`torso-variants.js`), shown side by side for the owner to choose
from. Round 1 (five body types) is kept in code; the owner liked Athletic.
Round 2, shown now: five athletic torsos (Athletic; Full chest with rounded
shoulders instead of the sharp upper edge; Pecs; and two light versions of
Full chest at about 1,600 and 600 triangles).

Shape tools (all in `torso-variants.js`, checked in `check-torso.mjs`): width
and front/back depth curves, roundness, squareness, **bumps** (smooth raises
placed by height and direction; mirrored for pecs), **shoulderRoll** (shoulders
curve in toward the neck), **detail** (rebuild at any triangle count) and
**basedOn** (an option reuses another's settings).

The arm/elbow draft (`arm.js`, `limb-shape.js`, `check-elbow.mjs`) was
**rejected by the owner on looks** (21 November 2026) and is no longer shown.
Its code is kept for reference: the approach (round balls; sockets deep where a
joint does not bend, cut away where it does) is still the agreed direction, but
the limbs will be redone one thing at a time after the torso is chosen.

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
| `torso-variants.js` | The torso options (Original, Athletic, Round, Lean, Blocky): width, front and back depth along the height, roundness and squareness. |
| `check-torso.mjs` | Checks the torso and every option: sealed, faces outward, no dents or grooves (with a test of that test), same height, left/right symmetric, distinct from each other, under 6,000 triangles. |

Commands: `node avatar-v2/fit-torso.mjs` (rebuild the torso, same result every
time), `npm run test:new-avatar` (checks), `node new-avatar/build.mjs` (page).
