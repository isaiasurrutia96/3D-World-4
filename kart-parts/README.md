# Kart parts system (Claude, look only)

The foundation every new kart is built on. Owner's decisions: `docs/KARTS.md`.
Codex owns driving; nothing here moves a kart.

1. `spec.js`: plain data and checks, no three.js. Every part slot (frame, seat,
   steering, wheels, nose, hood, bumpers, side panels, fenders, diffuser, wing,
   mud flaps, exhaust, lights), the upgrade values for Codex (chassis weight,
   suspension, off-road raise, wheels sticking out, tires), and each kart's
   part places. `resolveKart` expands mirrored parts and applies a set-up
   (raising lifts the body; wheels stay on the ground and move out; fenders
   and mud flaps follow the wheels). `checkKart` lists problems.
2. `build.js`: builds the real chassis and see-through boxes for the body
   parts. New karts keep the main kart's wheel places and size, so the same
   driving code can move them.
3. Checks: `npm run test:karts` (11 data and model checks) and, after
   building, `node kart-parts/browser.mjs` (page at three sizes and inside the
   Test Lab).
4. Page: `karts/` (Test Lab section "Karts"), built by `npm run build:karts`.

Chunk plan (owner approved the order, 21 Nov 2026): 1 foundation and GoKart
chassis (this), 2 GoKart body, 3 GT GoKart, 4 F1 GoKart, 5 paint and the five
variations, 6 swapping parts in the Test Lab.
