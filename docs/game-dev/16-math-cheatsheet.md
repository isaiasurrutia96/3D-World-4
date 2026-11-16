# 16 — Math Cheat Sheet for Game Code

## A) Vectors

1. **Dot product** `a·b = |a||b|cosθ`: is something in front (> 0) or behind;
   project a vector onto a direction; remove the part of velocity into a wall
   (`v -= n * dot(v, n)`).
2. **Cross product** `a×b`: a vector perpendicular to both; which side
   something is on; surface normals; Magnus force direction `ω × v`.
3. **Normalize** before using a vector as a direction.
4. **Distance checks:** compare squared distances to avoid `sqrt`.

## B) Rotations

1. **Quaternions** avoid gimbal lock and interpolate smoothly
   (`slerp`). Three.js: `Quaternion.setFromAxisAngle`, `.slerp`,
   `Object3D.quaternion`.
2. **Yaw from a direction:** `Math.atan2(dir.x, dir.z)`.
3. **Shortest angle difference:**
   `((b - a + 3π) % 2π) - π`.

## C) Smoothing and interpolation

1. **Lerp:** `a + (b - a) * t`.
2. **Frame-rate independent smoothing:** `a = lerp(a, b, 1 - Math.exp(-k * dt))`
   (k ≈ how many "time constants" per second). Never `lerp(a, b, 0.1)` per
   frame — speed changes with frame rate.
3. **Easing:** ease-out-cubic `1 - (1-t)³`, ease-in-out
   `t<.5 ? 4t³ : 1 - (-2t+2)³/2`, ease-out-back for a small overshoot.
4. **Springs:** see `04-animation.md` (frequency, damping, response).
5. **Inverse lerp / remap:** `t = (x - a) / (b - a)`; remap to a new range.
6. **Smoothstep:** `t² (3 - 2t)`.

## D) Motion and physics

1. **Semi-implicit Euler:** `v += a·dt; p += v·dt`.
2. **Jump from height h and time-to-peak t:** `g = 2h/t²`, `v₀ = 2h/t`.
3. **Time to fall height h:** `√(2h/g)`.
4. **Projectile peak:** `v_y² / (2g)`; range on flat ground
   `v² sin(2θ) / g` (45° max without drag).
5. **Launch speed for a target** (no drag): `v² = g d² / (2 cos²θ (d tanθ − h))`.
6. **Drag:** `F = ½ ρ C_d A v²` (air ρ ≈ 1.2 kg/m³). Magnus: `½ ρ C_l A v²`.
7. **Bounce:** `v_n' = −e·v_n` (restitution e), tangential reduced by
   friction.
8. **Damping per step:** `v *= Math.exp(-k * dt)`.

## E) Randomness

1. Seeded random (e.g. mulberry32) for reproducible levels and replays.
2. **Shuffle bags** instead of pure random for item drops: put N items in a
   bag, draw without replacement — fair streaks.
3. Weighted random from a table (Mario Kart items by position).
4. Noise (Perlin/Simplex) for terrain, camera shake, wind — smooth randomness.

## F) Collision tests

1. Sphere–sphere: distance < r1 + r2.
2. Sphere–plane: `dot(center − point, n) < r`.
3. AABB overlap: intervals overlap on all three axes.
4. Ray–sphere, ray–plane, ray–triangle (Möller–Trumbore): Three.js `Raycaster`
   and `Ray` cover these.
5. Capsule = segment + radius: distance from point to segment < radius.

## G) Units

Use **meters, seconds, kilograms** everywhere (Three.js has no units, but
physics constants assume real ones). A human is ~1.8 m; gravity 9.81 m/s²
(games often use 15–30 for snappier jumps).
