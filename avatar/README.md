# Our approved avatar

The owner restored this exact approved jointed model after removing the outer skin on 19 November 2026. The frozen reference remains in `checkpoints/avatar-joints-1/`.

The owner reconfirmed this as the official avatar. Keep the original approved
shapes and joints; neither the skin nor cylinder experiments are the baseline.
The live pages use a smaller, lossless binary delivery of the same model.
Measured loading results and repeatable check commands are in
[LOADING-RESULTS.json](LOADING-RESULTS.json).

**Current official avatar (19 November 2026):** `official.json` pins the
approved original-shape joint assembly. Both `/test-lab/` → Our avatar and
Skeleton load it through `src/official-avatar.js`. See
[animation handoff](ANIMATION-HANDOFF.md) and
[assembly checks](src/joint-assembly/README.md).

The text below describes the preserved 17 November baseline. Its viewer,
source shapes and approval record remain available for authoring/history.

Approved on 17 November 2026. This is the earlier baseline.

Permanent checkpoint: `avatar-approved-2026-11-17`.

`index.html` preserves the exact approved viewer from preview revision `e023230`; its SHA-256 is recorded in `APPROVED.json`. The complete editable source and original reference rig are included, with no dependency on temporary workspace paths.

The model has the approved clay body, shoulder and hip sockets, cylindrical forearms, enlarged hands in their relaxed resting pose, inward-facing palms and forward-facing thumbs. Hand sockets stay shallow and centered. Preserve these authored parts; do not substitute older hands or add joint balls or cuffs.

To rebuild, run `npm ci --prefix avatar` and `npm run build --prefix avatar` from the repository root. To verify a rebuild without replacing the approved file, run `npm run build --prefix avatar -- /tmp/approved-avatar-rebuild.html`.

The reference rig in `src/reference/PlayerModel.ts` was copied from the owner’s 3D-WORLD-3 repository. The approved model and source are saved here in 3D-World-4; this save does not replace the existing game runtime.

[View the approved avatar](https://isaiasurrutia96.github.io/3D-WORLD-3/avatar-preview/?v=e023230)
