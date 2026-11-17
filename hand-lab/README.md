# Hand Lab

The owner-approved hand is the fixed starting shape. This separate page adds live finger curling, thumb movement, pose transitions and a motion test. It does not change the saved avatar or the walking world.

Open `/hand-lab/`. Drag to orbit, pinch or scroll to zoom, then try Rest, Open, Curl, Point, individual finger sliders and Thumb across palm. Rest restores the approved position and normal arrays exactly.

`npm run build:hand-lab` writes a self-contained viewer to `hand-lab/index.html` and `dist/hand-lab/index.html`. The normal project build includes it in GitHub Pages.

The lab build observes the original generator's pre-rest data through `capture-rest.js`. It calls the original rest function unchanged and imports the original approved assembly. The approved source files and checkpoint are untouched. Deformation runs from immutable reference arrays on every update; it never accumulates changes into the hand's shape. The palm attachment is fixed. Finger bends use smooth centreline arcs with rotated cross-sections, based on the animation guide's procedural posing and blending approach.

These are movement controls, not completed object-specific grips or physical grasp simulation. Later work can build club, ball, trigger and steering poses on this movement layer.
