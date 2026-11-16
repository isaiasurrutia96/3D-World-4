# 01 — Foundations

## A) The game loop

1. Every game runs the same loop many times per second: **read input → update
   the world → draw the frame.** In the browser this is `requestAnimationFrame`,
   which fires once per screen refresh (60 Hz on most phones, 120 Hz on newer
   iPhones and gaming monitors).
2. **Never tie game speed to frame rate.** A game that moves things "5 units per
   frame" runs twice as fast on a 120 Hz screen. Multiply movement by the time
   since the last frame (`delta`), or better, use a fixed timestep.
3. **Fixed timestep (Glenn Fiedler, "Fix Your Timestep").** Physics and gameplay
   run in fixed steps (for example 1/60 s or 1/120 s). Each frame adds real
   elapsed time to an accumulator and runs as many fixed steps as fit:

   ```ts
   acc += Math.min(frameDelta, 0.25);      // clamp so a stall can't spiral
   while (acc >= STEP) { update(STEP); acc -= STEP; }
   const alpha = acc / STEP;               // 0..1 between last two states
   render(lerp(previousState, currentState, alpha));
   ```

   Benefits: identical behavior on every device, stable collisions, jumps that
   reach the same height every time, and replays/networking become possible
   (determinism). Interpolating by `alpha` keeps motion smooth when the screen
   refresh doesn't line up with the step.
4. **Clamp huge deltas.** When a tab is hidden or the phone stalls, the next
   delta can be seconds long. Clamp it (0.1–0.25 s) or objects tunnel through
   walls.
5. **Sub-stepping.** Super Mario 64 splits Mario's movement into four "quarter
   steps" per frame, checking collision on each, so fast movement doesn't pass
   through thin walls. The same idea works anywhere: split a big move into
   smaller moves and check each.

## B) Input

1. **Map physical buttons to actions** ("jump", "throw") in one table, so
   rebinding and supporting keyboard, gamepad and touch all go through one
   place.
2. **Buffer presses.** Store "jump was pressed at time T" and consume it if it
   becomes valid within ~100–150 ms (see `02-movement.md`). Games feel
   unresponsive when a press slightly too early is simply lost.
3. **Read input once per frame** into a snapshot, then let the fixed steps read
   the snapshot. Detect "pressed this frame" by comparing with last frame.
4. **Touch controls:** a virtual stick that appears where the thumb lands
   ("floating stick") is easier than a fixed one. Buttons need to be at least
   ~44 px, spaced so thumbs don't hit two at once, and every control must
   release on `pointercancel`, blur, and page hide or it will stick down.
5. **Gamepad (Gamepad API):** poll every frame; apply a dead zone (~0.15) and
   rescale so the stick still reaches full value. Browsers only reveal a
   gamepad after a button is pressed.
6. **Latency matters.** Call of Duty's team measured controller-to-screen
   latency and treated it as a core feature ("Fighting Latency on Call of Duty
   Black Ops III", GDC 2016). In the browser: avoid heavy work in input
   handlers, keep frames short, don't use post-processing that adds frames of
   delay.

## C) Code structure

1. **Components / entity-component-system (ECS).** Big engines describe each
   thing in the world as an entity made of components (position, mesh,
   physics body, health) processed by systems. It scales well to thousands of
   objects. For a small browser game, plain classes per thing (Player, Ball,
   Kart) plus a list of updatables is simpler and fine.
2. **State machines** for anything with modes: a player who can be on the
   ground, in the air, swimming, climbing; a golf shot that is aiming, swinging,
   flying, rolling. Each state has enter/update/exit. This prevents the classic
   bug soup of boolean flags.
3. **Data-driven tuning.** Keep all feel numbers (jump height, gravity, max
   speed, drift grip) in one tuning file. Designers at every big studio tune
   constantly; one file makes that fast.
4. **Separate simulation from presentation.** The physics/gameplay state is the
   truth; meshes, particles and sounds just display it. This makes testing,
   replays and networking possible.

## D) C++ vs the web (the owner's question)

1. **Why AAA studios use C++:** Call of Duty (IW engine), GTA V (RAGE), Unreal
   and most console engines are C++. C++ gives exact control over memory (no
   garbage-collection pauses that cause hitches), runs close to the hardware,
   uses all CPU cores, and has decades of tools. Super Mario 64 was written in
   C, the predecessor of C++.
2. **Do we need C++ here? No.** 3D-World-4 runs in a web browser, where the
   languages are JavaScript/TypeScript. Three.js talks to the GPU through
   WebGL (or WebGPU). For a stylized game, the GPU does most of the heavy work
   and JavaScript is fast enough.
3. **If something ever becomes too slow** (big physics simulations), the web
   answer is **WebAssembly**: code written in C++ or Rust compiled to run in the
   browser. The Rapier physics engine already does this, so we can use C++/Rust
   speed without writing C++ ourselves.
4. **Browser limits to respect:** one main thread (workers are possible but
   awkward), smaller memory budgets on phones, garbage-collection pauses
   (avoid creating new objects every frame: reuse vectors), and thermal
   throttling on phones.

## E) Deep dive: latency budgets

1. **Perception:** players feel the difference between ~50 ms and ~100 ms of
   input delay; ~100 ms is noticeable in shooters, ~200 ms is annoying
   (research summarised in an arXiv G-SYNC study). Steve Swink's rule of thumb
   for real-time control: about 50 ms feels like an extension of the body,
   above 100 ms lag is noticed, above ~240 ms control breaks down.
2. **Touch is more sensitive than mouse:** dragging on phones is affected by as
   little as ~25 ms; budget phones can already have 100 ms touch-to-screen.
   Browsers add event-loop and compositor delay on top. Keep the browser
   pipeline lean: no extra post-processing passes, react to input in the same
   frame.
3. **Consistency beats average:** uneven frame times feel worse than steady
   slightly-higher latency. Aim for a steady 60 fps over a jittery 90.
4. **Each buffered frame costs ~16.7 ms at 60 fps.** 30 fps games sit around
   100 ms controller latency; 60 fps games can go below.

## F) Deep dive: memory and allocation in JavaScript

1. **Object pooling:** create bullets, particles and effects up front and
   recycle them instead of `new` each time; this removes garbage-collection
   stutter. Only worth it for short-lived, frequent objects.
2. **Hidden allocations:** vector math that returns new objects, array
   `map/filter` in the loop, closures created per frame, string building.
   Use scratch vectors: `const tmp = new Vector3()` at module level.
3. **Spatial hashing:** divide the world into cells (e.g. 2–4× the typical
   object size); store objects per cell; only test collisions against objects
   in the same and neighbouring cells. Turns O(n²) checks into ~O(n).
4. **Profile first** (browser Performance tab) before optimizing.

## G) The "30 seconds of fun" principle (Halo, Jaime Griesemer)

Bungie's combat designer described Halo 1 as "maybe 30 seconds of fun that
happened over and over" — then varied it with different environments, weapons,
vehicles and enemies. Build and polish the core 30-second loop first; content
is variation on that loop.
