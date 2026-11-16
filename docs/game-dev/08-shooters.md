# 08 — Shooters: How Call of Duty Is Made

## A) Engine and performance

1. Call of Duty runs on Infinity Ward's **IW engine** (C++), continuously
   upgraded since the Quake III era. Its signature is **60 fps** on consoles
   (now higher on PC/new consoles), which Treyarch credits for the "fluid" feel.
2. **Latency is treated as a feature:** the team measured controller-to-screen
   delay and cut it (GDC 2016, "Fighting Latency on Call of Duty Black Ops
   III").
3. Modern Warfare (2019) rebuilt the engine for photogrammetry assets,
   physically based rendering, volumetric lighting and large player counts
   (Warzone).

## B) Weapon feel ("gunplay")

1. **Instant feedback on every shot:** muzzle flash, recoil kick of the camera
   and weapon model, shell ejection, layered sound (close shot, mechanical
   click, distant echo/tail), hit marker on hit with a distinct sound, blood or
   impact effects on the surface.
2. **Recoil patterns:** a learnable mostly-vertical pattern plus a small random
   part; players counter it with the stick/mouse. Visual recoil (model moves)
   is separate from actual aim movement.
3. **Aim down sights (ADS):** zooms FOV, reduces spread, slows movement; ADS
   time is a key stat.
4. **Time-to-kill (TTK):** CoD keeps TTK short so encounters are decided fast;
   that drives map design and pace.
5. **Hitscan vs projectile:** classic CoD bullets were hitscan (instant ray).
   Modern Warfare moved toward bullet travel and drop at range for variety and
   skill.
6. **Hit locations:** headshots deal more damage; per-limb multipliers.
7. **Sound design:** for Modern Warfare (2019) the team recorded every weapon
   with ~20 microphones, and consulted military advisers on how weapons work.

## C) Aim assist (controller)

1. **Slowdown/friction:** look speed drops when the crosshair is near an enemy,
   so it's easier to stop on target. Often uses two nested zones (starts in
   the outer one, full strength in the inner one).
2. **Rotational/tracking assist:** while the player moves, the aim slightly
   follows a moving target. Only works when the player provides input.
3. **Bullet magnetism:** shots are nudged toward a target the crosshair just
   missed (acts like a larger hitbox), without curving bullets around cover.
4. **Snap-to-target:** when aiming down sights, the aim snaps toward a nearby
   enemy (strong; often reduced or removed in competitive modes).
5. Tuned per weapon and distance; usually controller-only.

## D) Multiplayer netcode

1. **Authoritative server:** clients send inputs; the server decides what
   really happened (prevents cheating).
2. **Client-side prediction:** your own movement and shots happen instantly on
   your screen; the client corrects if the server disagrees.
3. **Entity interpolation:** other players are drawn slightly in the past
   (Source engine default ~100 ms) between server snapshots so they move
   smoothly despite packet loss.
4. **Lag compensation:** when you fire, the server rewinds other players to
   where you saw them (your latency + interpolation delay) to check the hit.
   This is why you sometimes die "behind cover".
5. **Tick rate:** how many times per second the server simulates (e.g. 20–128;
   CS2 uses 64 with sub-tick timing).
6. In the browser, real-time multiplayer uses WebSockets or WebRTC data
   channels with the same ideas.

## E) Production pipeline

1. **Photogrammetry:** real locations and objects photographed from many
   angles and turned into 3D models (Infinity Ward used a ~200-camera rig to
   scan people in under a second; desert field trips produced terabytes of
   data).
2. **Performance capture:** actors' body, face (head-mounted cameras) and voice
   recorded together; characters are digital doubles.
3. **Huge teams:** several studios share one engine and ship yearly; each game
   has campaign, multiplayer and a third mode built in parallel.
4. **Constant playtesting and telemetry** tune maps, weapons and spawns.

## F) What transfers to small projects

Instant feedback, readable hit confirmation, tight controls, 60 fps, short
latency, sound layering, and simple aim assist on touch/controller.

## G) Deep dive: map design and spawns

1. **Three-lane maps** (Crossfire in CoD4, most Treyarch maps): two side lanes
   and a middle lane connecting the two spawn areas. Easy to learn, natural
   flow; each lane needs a purpose (long sightlines, close quarters,
   flanking). Modern Warfare (2019) deliberately broke from this for more
   realistic, irregular maps, which was controversial.
2. **Spawn selection** (Black Ops 7 patch notes, secondary): candidate spawns
   are scored by **enemy influence** (how close/many enemies are), **sight
   distance checks** (could an enemy see it soon) and objective ownership. A
   patent describes precomputing, per spawn point, the minimum distance an
   enemy must travel to get line of sight — cheaper than ray traces at
   runtime. Bad spawns (spawning in sight of your killer) are a top complaint.
3. **Influence maps** in general: a grid where each cell stores a score (e.g.
   enemy presence decaying with distance); pick the spawn cell with the best
   score.

## H) Deep dive: aim assist numbers in practice

1. Witchfire's developers use two circles around the crosshair: slowdown
   begins when the larger circle touches an enemy and reaches full strength
   at the smaller one; values differ per weapon and distance.
2. Halo applies magnetism only within a distance and only for controllers.
3. Rotational assist only helps when the player moves the stick; holding still
   gives nothing.
