# 05 — Physics

## A) Collision detection

1. **Broad phase** finds pairs that might touch (grids, bounding volume trees,
   octrees). **Narrow phase** tests exact shapes.
2. **Use simple shapes for physics** even when the visible mesh is detailed:
   spheres for balls, capsules for characters, boxes for walls and pins'
   approximations, convex hulls for cars. A UC Davis bowling simulation used a
   sphere for the ball and boxes for the lane.
3. **Tunneling:** fast small objects (balls, bullets) can skip through thin
   walls between steps. Fixes: sub-steps, continuous collision detection (CCD),
   or raycasting along the movement each step.
4. **Raycasts** answer "what is in this direction": ground checks, line of
   sight, hitscan bullets, camera collision.
5. Three.js has an `Octree` + `Capsule` helper (used in 3D-WORLD-3) good for
   character-vs-world collision without a full physics engine.

## B) Physics engines for the browser

1. **Rapier** (Rust compiled to WebAssembly): fastest, deterministic, has CCD.
   Recommended for anything with many bodies (bowling pins, crates).
2. **cannon-es:** pure JavaScript, simplest to use, slower, no built-in CCD.
   Good for prototypes and small scenes.
3. **Ammo.js** (Bullet port): many features (soft bodies, vehicles) but hard to
   use; considered legacy now.
4. **Hand-written physics** is often better for the core mechanic (a golf ball,
   a basketball arc, a kart) because it can be tuned exactly; use an engine
   for messy secondary stuff (pins scattering, props).

## C) Integrating motion

1. **Semi-implicit Euler** (update velocity first, then position with the new
   velocity) is the standard simple integrator and is stable for games.
2. Use a **fixed timestep** (see `01-foundations.md`).
3. **Drag:** `velocity *= exp(-k * dt)` for simple damping, or the real formula
   for balls (below).

## D) Ball physics (shared by golf, basketball, football, bowling)

1. **Forces on a ball in flight:**
   1. Gravity: 9.81 m/s² down.
   2. Drag: `F = 0.5 · ρ · Cd · A · v²`, opposite the velocity (ρ ≈ 1.2 kg/m³).
   3. Magnus lift from spin: `F = 0.5 · ρ · Cl · A · v²`, perpendicular to
      velocity and the spin axis (direction `ω × v`). Backspin makes a golf ball
      rise and float; sidespin curves it (hook/slice).
2. **Spin decays** slowly during flight (a few percent per second).
3. **Bounce:** on impact split velocity into normal and tangential parts.
   Normal part reverses and is multiplied by restitution (0.5–0.8 typical);
   tangential part is reduced by friction, and spin converts into tangential
   speed (backspin makes a golf ball check or roll back).
4. **Rolling:** apply rolling resistance; on slopes add gravity along the
   slope. Greens in golf games are just this.
5. **Arcade vs real:** real numbers are a starting point. Games exaggerate
   (bigger curves, more forgiving bounces) so outcomes are readable and fun.

## E) Hitting a target with a projectile

1. **Without drag**, launch velocity to reach a target at horizontal distance
   `d` and height difference `h` with angle `θ`:
   `v² = g·d² / (2·cos²θ · (d·tanθ − h))`.
2. **Leading a moving target:** solve for the time `t` when the projectile and
   the target meet (iterate: guess `t`, predict target position, recompute
   `t`). Used for football passes and AI aiming.
3. With drag/spin, simulate the flight a few times and adjust (shooting
   method), or precompute a table.
