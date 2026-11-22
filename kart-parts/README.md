# Kart parts system (Claude, look only)

The foundation every new kart is built on. Owner's decisions: `docs/KARTS.md`.
Codex owns driving; nothing here moves a kart.

## A. How parts snap on

1. **Mounts.** Each kart has the points where a kind of part bolts on: a
   point (optionally mirrored left/right), the top of every tire (fenders) or
   the back of each rear tire (mud flaps).
2. **Styles.** Each style of a part (tube bumper, airflow bumper, low spoiler,
   tall extended wing...) carries its own size and its offset from the mount,
   and says which modes it is made for. Every style of a part snaps onto the
   same mount; a longer wing simply reaches further. New styles are one line
   in `STYLES`.
3. **Checks.** Every placed part must stay out of the driver zone (body, legs,
   head), out of the wheels, above the ground and inside the kart's space, for
   every set-up (stock, raised, wheels out, full off-road). A `shell` nose may
   wrap over the legs, never the body or head. A part that does not fit is
   rejected with the reason and drawn red.
4. **Set-ups.** Raising lifts the body, the mounts and the driver zone; wheels
   stay on the ground and move out; fenders and mud flaps follow the wheels.

## B. Where the numbers come from

Part places were measured from side and top views of the three approved
designs (`docs/karts/blueprints/`), using the wheels as the ruler (0.76 m
across). The GoKart's measured wheelbase was 2.02 m against the main kart's
2.03 m, so it keeps the main kart's wheels exactly. The GT GoKart measured
compact (wheelbase 1.55 m); the F1 GoKart longer (1.89 m) with smaller front
wheels. These are measurements of concept pictures, so they are close, not
exact; refine by eye in the Test Lab. The driver zone sizes are estimates
until the avatar sits in the karts.

## C. Files and checks

1. `spec.js`: data and checks, no three.js.
2. `build.js`: the GoKart chassis, wheels, part boxes and the driver zone.
3. `f1-kart.js` and `shapes.js`: the whole F1 GoKart (see D).
4. `npm run test:karts`: 28 checks (`check.mjs` and `f1-check.mjs`), including every style on every kart of
   its mode for four set-ups (150+ combinations).
5. After building: `node kart-parts/browser.mjs` (page at three sizes, kart
   switching, style swaps, inside the Test Lab).
6. Page: `karts/` (Test Lab section "Karts"), built by `npm run build:karts`.

Chunk plan (owner approved the order, 21 Nov 2026): 1 foundation and GoKart
chassis, 1b part places from the approved designs with mounts, styles and the
driver zone (this), 2 GoKart body, 3 GT GoKart, 4 F1 GoKart, 5 paint and the
five variations, 6 swapping parts in the Test Lab.

## D. The F1 GoKart model (owner: "design the whole F1 kart, best methods")

Built in `f1-kart.js` with standard, proven techniques (`shapes.js`):

1. **Lofting superellipse cross-sections** for the tub, nose, side pods and
   engine cover (the fuselage and hull method; the superellipse moves between
   oval and boxy). The cockpit is opened by lowering the top of the rings
   between the side walls, blended in and out so the shape stays smooth.
2. **NACA 4-digit airfoils** (the published equations) for the front and rear
   wings and their flaps, mounted upside down like real race-car wings.
3. **Double-wishbone suspension**: upper and lower A-arms, push rods and
   steering links, as on real formula cars.
4. **Earcut triangulation** (three.js ShapeUtils) to close the loft ends, and
   **per-face colour by place around the ring**, so stripes run cleanly along
   the body.
5. **One shared material with vertex colours and merged geometry**: about
   12,600 triangles in 15 meshes for the whole kart.

Every body part is its own `part:<slot>` group and is checked to sit inside
its measured part box; the rear wing's struts start exactly at the wing mount.
No part enters the driver's head or body space. Colours come from the approved
design (teal, orange, dark carbon).
