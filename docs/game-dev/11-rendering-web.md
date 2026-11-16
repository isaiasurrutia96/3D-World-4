# 11 — Rendering and Performance in the Browser (Three.js)

## A) Performance budgets

1. **Draw calls matter more than triangles.** Each separate mesh/material is a
   draw call. Targets: under ~100–150 on phones for 60 fps, a few hundred on
   desktop. Check `renderer.info.render.calls`.
2. **Reduce draw calls:**
   1. `InstancedMesh` for many copies of the same thing (trees, pins, coins).
   2. `BatchedMesh` for different shapes sharing one material.
   3. Merge static geometry with `BufferGeometryUtils.mergeGeometries`.
   4. Share materials; use vertex colors instead of many materials.
3. **Pixel ratio:** phones have 3× screens; rendering at full 3× is costly.
   Cap at ~1.5–2 for games (3 only for still viewers).
4. **Shadows are expensive:** one directional light with shadows, small shadow
   area that follows the player, 1024–2048 map; fake shadows (a dark blob
   under characters) are cheap.
5. **Avoid garbage:** reuse `Vector3`/`Quaternion` objects instead of creating
   them every frame; GC pauses cause hitches.
6. **Dispose** geometries, materials and textures you remove.
7. **Textures:** power-of-two sizes, compressed formats (KTX2/Basis) for big
   projects, mipmaps on.
8. **Frustum culling** is automatic in Three.js; keep objects' bounding boxes
   correct and split huge meshes so off-screen parts are skipped.
9. **Quality tiers** (Low/Medium/High) that change pixel ratio, shadows,
   anti-aliasing and effects, never gameplay.

## B) Lighting and materials

1. **Physically based rendering (PBR):** `MeshStandardMaterial` with
   roughness/metalness; looks right under any light.
2. **Typical setup:** hemisphere light (sky/ground ambient) + one directional
   "sun" with shadows; optional rim light for characters.
3. **Environment map** (`RoomEnvironment` or an HDR) gives soft realistic
   reflections and lighting cheaply.
4. **Tone mapping:** ACES Filmic or AgX, sRGB output color space.
5. **Stylized looks:** toon shading (`MeshToonMaterial`), outlines (inverted
   hull or post-process), flat colors with soft gradients. Often cheaper and
   more timeless than realism.

## C) Rendering techniques used by big games (for reference)

1. Deferred shading, cascaded shadow maps, screen-space ambient occlusion,
   temporal anti-aliasing, bloom, depth of field, volumetric fog, global
   illumination (baked lightmaps or real-time probes). See `09-open-world.md`.
2. Most are possible in Three.js through post-processing (`EffectComposer`),
   but each costs frame time; on phones use few.

## D) WebGL vs WebGPU

1. **WebGL 2:** supported everywhere; Three.js default.
2. **WebGPU:** newer, lower CPU overhead and compute shaders; Three.js has a
   `WebGPURenderer`. Good for heavy scenes; check device support.
3. How you use the API (batching, instancing) matters more than which API.

## E) Loading

1. **glTF/GLB** is the standard 3D format for the web (models, materials,
   animations). Compress with Draco or meshopt.
2. Show a loading message immediately; load big assets progressively.
3. Build tools (Vite) bundle code; keep the first download small.

## F) Deep dive: stylized (toon) rendering in Three.js

1. `MeshToonMaterial` with a **gradient map**: a tiny ramp texture (2–5
   pixels) of light levels. Set `minFilter` and `magFilter` to
   `THREE.NearestFilter` or the bands blur together.
2. **Outlines:**
   1. **Inverted hull:** draw the mesh again, scaled out slightly along normals,
      black, with only back faces rendered. Cheap; gaps on hard edges and
      concave parts.
   2. **`OutlineEffect`** (three addons) does the hull trick for a whole
      scene.
   3. **Post-process edge detection** on depth/normals: accurate on any
      shape, costs a full-screen pass.
3. **Rim light** (fresnel term) adds the anime/clay edge glow.
4. Breath of the Wild's art team chose an abstract painterly toon style partly
   because realistic or Wind Waker HD styles clashed with its physics- and
   chemistry-driven world (GDC 2017).

## G) Deep dive: multiplicative gameplay (Zelda: Breath of the Wild)

1. Nintendo moved from "additive" design (each puzzle authored) to
   "multiplicative" design: objects follow general rules and interact with
   each other and the player, so fun situations emerge.
2. A **physics engine** governs motion; a separate **chemistry engine**
   governs state (fire burns wood, ice freezes water, wind pushes, metal
   conducts electricity).
3. Lesson: a few consistent rules that combine beat many special cases.
