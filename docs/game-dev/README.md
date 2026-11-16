# Game Development Knowledge Base

Notes for building 3D-World-4 (deepened 16 Nov 2026: each file now ends with
"Deep dive" sections). Each file is practical: what the technique is,
how the big games do it, and how to build it here (TypeScript + Three.js in a
browser). Open only the file the current task needs, to save usage.

| File | Covers |
| --- | --- |
| `01-foundations.md` | Game loop, fixed timestep, input, code structure, C++ vs the web |
| `02-movement.md` | Character movement, jumps, Super Mario 64 techniques, game feel |
| `03-cameras.md` | Third-person and other cameras, common camera mistakes |
| `04-animation.md` | Blending, procedural animation, IK, ragdoll, motion matching |
| `05-physics.md` | Collision, physics engines, projectiles, spin, bounces |
| `06-sports.md` | Golf, bowling, football throwing, basketball shooting |
| `07-racing.md` | Car handling, drifting, boosts, AI drivers, catch-up |
| `08-shooters.md` | Call of Duty: weapon feel, hitscan, aim assist, netcode, production |
| `09-open-world.md` | GTA V: streaming, LOD, traffic and crowds, rendering |
| `10-ai.md` | State machines, behavior trees, utility AI, GOAP, pathfinding |
| `11-rendering-web.md` | Three.js performance, lighting, shadows, phone budgets |
| `12-feel-audio-ui.md` | Juice, hit stop, screen shake, sound, menus, accessibility |
| `13-production.md` | How studios work: prototyping, tuning, testing, scope |
| `14-sources.md` | Where the information came from |
| `15-level-design.md` | Nintendo's 4-step levels, teaching, worlds, venues |
| `16-math-cheatsheet.md` | Vectors, rotations, smoothing, physics formulas, randomness |
| `17-networking.md` | Lockstep, snapshots, prediction, rollback, browser options |
| `18-recipes.md` | Step-by-step build plans for likely features |

Rule of thumb from every source: **feel first, then looks.** Build the core
action (moving, throwing, driving) as a rough prototype, tune it until it is
fun with plain shapes, then add art.
