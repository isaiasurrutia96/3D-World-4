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
3. `npm run test:karts`: 17 checks, including every style on every kart of
   its mode for four set-ups (150+ combinations).
4. After building: `node kart-parts/browser.mjs` (page at three sizes, kart
   switching, style swaps, inside the Test Lab).
5. Page: `karts/` (Test Lab section "Karts"), built by `npm run build:karts`.

Chunk plan (owner approved the order, 21 Nov 2026): 1 foundation and GoKart
chassis, 1b part places from the approved designs with mounts, styles and the
driver zone (this), 2 GoKart body, 3 GT GoKart, 4 F1 GoKart, 5 paint and the
five variations, 6 swapping parts in the Test Lab.
