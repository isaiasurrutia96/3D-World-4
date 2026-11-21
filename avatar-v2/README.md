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
**Chosen arm: 2, Athletic** (21 November 2026). The elbow ball is now sized
from the limbs: 92% of the thinner limb end (11.8 cm wide), slightly thinner
than the limbs. With joint centres unchanged, that leaves longer limbs: upper
arm 24.5 cm (+15%), forearm 22.2 cm (+17%).

**Girl avatar started:** five female torsos (`FEMALE_OPTIONS`: Athletic,
Hourglass, Slim, Strong, Toy) with narrower shoulders than hips, a defined
waist, fuller hips, softer shoulders and a modest stylized chest, all at the
light detail. Shown next to the chosen arm. Open point: the girl may need her
own proportions (height, limb lengths); for now she uses the same base sizes.

**21 November 2026, later:** five **athletic women's torsos** (`WOMEN_OPTIONS`:
Classic, Runner, Swimmer, Soft athletic, Gymnast) between F1 and F2: waist
78-82%, hips 104-108%, two modest chest bumps (17-25 mm). **Legs**: five thigh +
knee ball + calf options (`LEG_OPTIONS`), same capsule and ball rules as the
arms (one shared pair builder, `buildPair`). **Girl limbs**: any boy limb made
8% slimmer (`girlVersion`), her ball follows the 92% rule and joints stay put.
Assembly guideline: fingertips around the middle of the knee; the skeleton
already puts them at knee height (47.1 cm at rest, knee joint 47.2 cm).
The page shows these in three tabs.

**Chosen: Strong legs (3) and the girl's torso W5 Gymnast** (`CHOSEN_LEG`,
`GIRL_LEG`, `CHOSEN_GIRL_TORSO`). Legs may bulge up to 1.65x the knee ball (a
real thigh is far wider at the hip than the knee); arms keep 1.5x.

**Head and neck** (`head-options.js`, checks `check-head.mjs`): the old head sat
right on the shoulders (5 mm gap), so a neck ball lifts the head. Five options
from +3.6 cm to +19.8 cm (full or small ball, resting or half sunk into the
torso top, or a slightly smaller head). Head: Fibonacci sphere, 800 triangles.
Open for the joints discussion: with a neck ball, the head's natural pivot is
the ball's centre, not the head's centre as in today's skeleton.

**Chosen neck: option 5** (sunk ball, 19 cm head): the owner wants the head to
snap back when hit, which needs a pivot at the neck; measured, a head without a
neck ball can only tip 9 degrees before hitting the shoulders, option 5 about
60 degrees for only +3.6 cm.

**Heads with a face** (`head-shapes.js`): five round mannequin heads (Classic,
Strong jaw, Soft and young, Heroic, Extra round) shaped by numbers: egg, chin
narrowing and smooth features (nose, brow, jaw, chin, cheeks, eye hollows). The
ball's triangle layout is kept and points moved, so hollows work. Points are
packed toward the face (about 1 cm apart there, 2.9 cm at the back) with 2,400
triangles; evenly spread 1,500 had smoothed the face away.

**Painted faces** (`face.js`, checks `check-face.mjs`), the owner's new
direction: the head stays round and plain; the face is drawn (big oval eyes, a
line mouth) and pressed onto the head with three.js DecalGeometry. Concepts were
made with Higgsfield (about 5 credits); sizes measured from the sheet the owner
preferred. Five base-face options (eyes vary, same mouth). Design: every
character has the base face; other expressions are emotes the player picks and
keeps as long as they want. Owner-approved originality guidance: simple shapes
are fine, never a known character's exact combination.

Earlier open point for the joints discussion: with a separate 18 cm elbow ball the limbs
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
| `limb-options.js` | Arm and leg options and the girl's slimmer versions: capsule limbs from a thickness profile, cross-section and muscle bumps; one pair builder places the limb-sized ball between three skeleton joint centres. |
| `check-limbs.mjs` | Checks every limb set (arms, legs, girl versions): sealed, exact lengths, capsule-shaped (with a test of that test), ball sized from the limbs and separate, joints unchanged, options distinct. |
| `shape-checks.js` | Shared dent and groove measuring used by the torso and arm checks. |
| `head-options.js` | Head and neck options: neck ball size and placement on the torso's neck seat, head size, and the height change each causes. |
| `check-head.mjs` | Checks the head options: sizes, placement, sealed spheres, honest height change. |
| `head-shapes.js` | Mannequin heads with a face: egg, chin and features by numbers; face-focused point layout. |
| `face.js` | Painted faces as data (eyes, mouth) turned into simple shapes and drawn on a canvas; the base-face options. |
| `check-face.mjs` | Checks the faces: sizes from the concept, mirrored, same mouth, fits the front of the head, drawing. |
| `check-torso.mjs` | Checks the torso and every option: sealed, faces outward, no dents or grooves (with a test of that test), same height, left/right symmetric, distinct from each other, under 6,000 triangles. |

Commands: `node avatar-v2/fit-torso.mjs` (rebuild the torso, same result every
time), `npm run test:new-avatar` (checks), `node new-avatar/build.mjs` (page).
