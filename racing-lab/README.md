# Track Lab: section 1V

`/racing-lab/` now shows the four checked LetsGo tracks without a kart or avatar. In the universal Test Lab, choose **Tracks (section 1)**. The superseded driving prototype is not mounted by this page.

This is the track-only visual review authorized after section 1 approval. See `racing-core/PLAN.md` for the single approval record. Handling, contacts, race rules, opponents, ghosts, full device driving and island scenery need their own later approvals.

`src/checked-track-view.js` draws the immutable road/curb/rail/access geometry from `racing-core/track/index.ts`. It reproduces the original materials and exact mesh construction. `tests/track-view.test.mjs` runs in Node without a browser and compares all original mesh buffer/instance/material signatures captured from the pinned source. The approved Original seam fix is enabled; reference mode exists only for source diagnostics.

`src/track-preview.js` supplies a static inspection adapter to the shared Motion Lab factory. Track choices, orbit/pinch/wheel zoom, camera views and Reset work on phones and desktops. The camera fits complete tracks when loading/resizing, uses appropriate depth precision at track scale, and never changes track coordinates. No fake floor is added. The embedded Test Lab supports its true Isometric view; Inspection is unavailable because the road is the subject rather than a presentation floor. The video section is empty.

Build with `npm run build` (or `npm run build:racing-lab` after dependencies exist). The build first runs `node --test racing-lab/tests/track-view.test.mjs`. Verify with `npm run test:racing-lab`, `node test-lab/test.mjs` and `npm run test:motion-lab`. Chromium browser checks test actual rendering/input and fitted phone/desktop layouts; they do not approve the visuals on the owner’s behalf.

The earlier `src/simulation.js`, `src/track-view.js` and old capture script are unused prototype files, kept temporarily for history. They are not the foundation for subsequent approved layers.

The default preview omits the former hub connectors in both logic and rendering. Curbs and guardrails close those entry gaps; the main loops and internal overpasses stay intact. Seven static mesh objects make up each track view. Optional source-fidelity tests enable the original connector explicitly.

Inspection supports off-center pinch and cursor-focused wheel zoom, plus two-finger panning, through the shared viewer. Camera near/far precision follows the current inspection target rather than the course center, allowing close inspection of outer turns and elevated sections.
