# 09 — Open Worlds: How GTA V Is Built

## A) Engine

1. GTA V runs on Rockstar's **RAGE** engine (C++), with NaturalMotion's
   **Euphoria** for physical character reactions (since GTA IV) and Bullet
   physics underneath.
2. The map is far too big for memory, so everything depends on **streaming**.

## B) Streaming and level of detail (LOD)

1. **Streaming:** the world is split into chunks; chunks near the player are
   loaded, far ones unloaded, continuously and in the background while you
   move. Speed of travel (cars, planes) decides how far ahead to load.
2. **LOD chains:** each object has several versions — detailed close up,
   simpler at distance, and far away whole city blocks merge into single
   low-detail meshes. GTA V shows the whole map at low detail from the sky.
3. **Hide the switch:** dithered fades between LOD levels, switching at
   distances where the change is too small to notice.
4. **Texture streaming:** lower-resolution mipmaps load first, sharper ones
   arrive when close.
5. **In the browser:** split levels into separate files, load with `fetch` as
   the player approaches, use `THREE.LOD` objects, dispose of far chunks to free
   memory.

## C) Rendering (from Adrian Courrèges' GTA V graphics study)

1. **Deferred rendering:** first pass writes surface data (color, normals,
   depth, material) into several buffers (G-buffer), then lighting is computed
   per pixel. Handles many lights cheaply.
2. **HDR lighting** with tone mapping and eye adaptation.
3. **Logarithmic / reversed depth buffer** to keep precision across huge view
   distances (no flickering far away).
4. **Cascaded shadow maps** for the sun: several shadow maps covering near to
   far distances.
5. **Reflections** via a low-detail paraboloid/cube map of the surroundings.
6. **Post effects:** bloom, depth of field (computed with a compute shader),
   lens flare scaled by camera aperture, motion blur, FXAA/TAA anti-aliasing.

## D) Bringing the world alive

1. **Population density rules:** pedestrians and cars spawn just outside view
   according to area (downtown dense, desert sparse) and time of day, and
   despawn when far or out of sight. The total is capped for performance.
2. **Level of simulation:** nearby NPCs run full AI (schedules, reactions,
   conversations); distant ones use cheap behavior; unseen ones barely exist.
3. **Traffic:** cars follow a road network graph (lanes, junctions, traffic
   lights); drivers have personalities (careful, aggressive).
4. **Reactions and systems:** police wanted level, witnesses, ambient events
   (robberies, accidents) spawned near the player to create stories.
5. **Day/night cycle and weather** change lighting, NPC behavior and traffic.

## E) Lessons for a small project

1. Only simulate and draw what's near the player.
2. Spawn life just out of view, remove it when out of view.
3. Fake distance: low-detail silhouettes and fog hide the edge of the world.
4. Small dense worlds feel bigger than large empty ones.

## F) Deep dive: GTA V police and wanted system

1. GTA IV used a fixed circular search zone, which players exploited by hiding
   in the same alley. GTA V switched to **line-of-sight vision cones**: each
   officer (and helicopter, with a wider cone) projects a cone shown on the
   minimap.
2. To lose the stars, stay out of every cone for a time that grows with the
   wanted level; being seen again resets the timer; police search your last
   known position.
3. Helicopters navigate with a 3D navmesh of the airspace.
4. Lesson: stealth/escape systems feel fair when perception is visible to the
   player (cones, last-known-position markers).

## G) Deep dive: population tiers (community analysis)

1. Nearby NPCs: full agent AI (goals, schedules, reactions).
2. Distant NPCs: cheap flow/ambient behaviour.
3. Spawn by density rules just outside the streaming radius; despawn outside
   it; traffic capped to keep streaming/physics cost stable on old consoles.
