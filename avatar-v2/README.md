# New avatar (version 2)

The rebuild of the avatar, one part at a time, shown in the Test Lab section
**New avatar** (`new-avatar/`). The approved avatar (`avatar/`) is the look
reference and is never changed from here.

Current state (21 November 2026): the **chosen torso is Athletic (light)**,
round 1's Athletic shape at the light detail (1,568 triangles, within 4.5 mm of
the full version). It is shown next to **three joint-ball choices** with exactly
300, 400 and 500 triangles (`ball-shape.js`). Earlier rounds of torso options
stay in code (`FIRST_OPTIONS`, `ATHLETIC_OPTIONS`) for reference.

**Chosen ball: 300 triangles.** Now on the page: **five upper arm and forearm
options** (`limb-options.js`), each an upper arm, the elbow ball and a forearm,
hanging straight and separate. Option 1 is a plain capsule; 2 to 5 are athletic
arms with an overall capsule shape (Athletic, Strong, Defined with a Tic Tac
cross-section, Slim). Every limb is thinner than the ball, 504 triangles.
Open point for the joints discussion: with a separate 18 cm elbow ball the limbs
are 21 cm (upper arm) and 19 cm (forearm); if the shoulder and wrist balls also
sit separately, they would be about 12 cm and 9 cm.

Balls are Fibonacci spheres (points in an even spiral, wrapped by three.js's
ConvexHull): exact at any even count, and their triangles vary in size by only
1.6x, against 3.6x for a usual latitude/longitude (UV) sphere of the same count.

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
| `ball-shape.js` | Joint balls with an exact triangle count (Fibonacci sphere + convex hull), and the 300/400/500 choices. |
| `check-ball.mjs` | Checks the balls: exact counts, sealed, outward, every point on the sphere, roundness and evenness. |
| `limb-options.js` | The arm options: capsule limbs from a thickness profile, cross-section and muscle bumps; lengths from the skeleton; the ball between them. |
| `check-arms.mjs` | Checks the arm options: sealed, exact lengths, thinner than the ball, capsule-shaped (with a test of that test), ball separate and centred, options distinct. |
| `shape-checks.js` | Shared dent and groove measuring used by the torso and arm checks. |
| `check-torso.mjs` | Checks the torso and every option: sealed, faces outward, no dents or grooves (with a test of that test), same height, left/right symmetric, distinct from each other, under 6,000 triangles. |

Commands: `node avatar-v2/fit-torso.mjs` (rebuild the torso, same result every
time), `npm run test:new-avatar` (checks), `node new-avatar/build.mjs` (page).
