# Kart parts system and the three kart models (Claude, look only)

Owner's decisions: `docs/KARTS.md`. Codex owns driving; nothing here moves a kart.
A fresh set of three karts (owner, 22 Nov 2026): GoKart (small), GT GoKart
(medium) and F1 GoKart (large), all close in size, sized around the avatar.
The old test kart is only for driving tests and is not part of this set.

## A. How parts snap on

1. **Mounts.** Each kart has the points where a kind of part bolts on: a
   point (optionally mirrored left/right), the top of every tire (fenders) or
   the back of each rear tire (mud flaps).
2. **Styles.** Each style of a part carries its own size, its offset from
   the mount and the modes it is made for. Every style of a part snaps onto
   the same mount; a longer wing simply reaches further. A new style is one
   line in `STYLES`.
3. **Checks.** Every placed part must stay out of the driver zone, out of the
   wheels (tested exactly, as cylinders), above the ground and inside the
   kart's space, for every set-up. A `shell` nose or hood may cover the legs,
   never the hips, body or head; a `wrapsWheel` arch may wrap its own wheel
   (the model checks prove it clears the tire).
4. **Set-ups.** Raising lifts the body, mounts and driver; wheels stay on the
   ground and move out; fenders and mud flaps follow the wheels.

## B. Sizes and the driver

1. Part places were measured from side and top views of the approved designs
   (`docs/karts/blueprints/`) with the wheels as the ruler ("design units").
2. Each kart has a `scale` that turns design units into real metres, chosen
   from the owner's size picture with a driver in each kart: GoKart small, GT
   a little bigger, F1 a little bigger again. The F1's wheels are the same
   real size as the GT's (owner).
3. The **driver zone comes from the avatar** (`AVATAR`, checked against
   `motion-core/skeleton/bones.js`) seated in each kart's seat: hips, a
   leaning torso with shoulders, legs forward with bent knees, and the head.
   The cockpits are wide enough for the avatar's shoulders, the roll bars sit
   just above its head and the steering wheels are within its reach.

## C. How the models are built (every method is a standard, proven one)

1. **Lofting superellipse cross-sections** for tubs, noses, pods, hoods and
   covers (the hull/fuselage method), joined with **PCHIP** (monotone cubic,
   Fritsch-Carlson as in SciPy's PchipInterpolator): smooth and never
   overshooting, so surfaces have no ripples. Cockpits are opened by lowering
   the top of the rings between the side walls.
2. **NACA 4-digit airfoils** (published equations) for wings, upside down
   like real race-car wings.
3. **Double-wishbone suspension** on the GT and F1; stub axles and a solid
   rear axle on the GoKart (real karts have no suspension).
4. **Lathe-turned** tires and GT wheel arches (smooth along the curve, crisp
   edges), **earcut** to close loft ends, **RoundedBoxGeometry** for blocks.
5. **Per-face colour by place around the ring**, so stripes run cleanly
   along the body; **one shared vertex-colour material and merged geometry**
   per part (about 14,000 to 18,000 triangles and under 20 meshes per kart).
6. Every body part is its own `part:<slot>` group and is checked to sit
   inside its part box; wing struts start exactly at the wing mount.

## D. Files and checks

1. `spec.js`: data and checks (no three.js). `shapes.js`: shape methods.
   `kart-model.js`: shared pieces (wheels, suspension, seats, steering,
   driver dummy). `gokart-kart.js`, `gt-kart.js`, `f1-kart.js`: the models;
   `models.js`: `buildKart(kart)`. `build.js`: part boxes and driver zone.
2. `npm run test:karts`: 51 checks (`check.mjs`, `models-check.mjs`).
3. After building: `node kart-parts/browser.mjs` (page at three sizes and
   inside the Test Lab, including the copied side panel).
4. Page: `karts/` (Test Lab section "Karts"), built by `npm run build:karts`.
   Never rebuild its side panel; hide and show buttons instead (the Test Lab
   copies the panel once).

## E. Fine-tuning guide (where each thing lives)

Every number below can be changed safely: the checks catch a value that makes
a part hit the driver or a wheel, and a kart that cannot be built says why on
the Karts page instead of breaking it. Run `npm run test:karts` after a change.

1. **Kart size:** `scale` on each kart in `spec.js` (GoKart, GT, F1).
2. **Wheels:** `wheels` on each kart (radius, width, track, front and rear
   places), in design units.
3. **Where the driver sits:** `seat` on each kart (hip place, recline, and
   `feetY` for the F1's footwell). Roll bars, cockpits and steering wheels
   follow the driver automatically.
4. **The avatar's body sizes:** `AVATAR` in `spec.js` (a test compares them
   with the avatar's skeleton).
5. **Where parts bolt on:** `mounts` on each kart; **part shapes and sizes:**
   `STYLES` (add a new bumper or wing as one more line).
6. **Upgrade ranges** (off-road raise, wheels sticking out, chassis weight,
   suspension, tires): `UPGRADES`; Codex decides what they do when driving.
7. **Body shapes:** the station lists (`NOSE`, `TUB`, `POD`...) at the top of
   each `*-kart.js` file: each line is one measured cross-section.
8. **Colours:** `GOKART_COLORS`, `GT_COLORS`, `F1_COLORS`; **rims:** `RIMS`;
   **gloss:** `FINISH` in `kart-model.js`.
