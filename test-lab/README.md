# Universal Test Lab

The published workspace is `/test-lab/`. Its static UI lives in `public/test-lab/` and is copied to `dist/` by Vite.

`main.js` registers the existing live tests and their ready signals. One iframe is mounted at a time. The workspace forwards view buttons and mirrors each test's existing controls, keeping its model and motion code in its own app. When most of the viewer has scrolled away, its animation clock pauses and input is released; it resumes when the viewer returns.

Add future subjects to the test registry and selector. Prefer exposing the same ready flag, camera/view API and native controls used by the existing labs. Saved checkpoints remain separate and untouched.

This is the shared workspace for Codex and Claude Code. New tests must call `installTestLabScene` from `src/test-lab-scene.ts`, passing their renderer, scene, perspective camera, target getter and explicit floor/shadow objects. It activates only in the embedded lab (`?lab=...`), preserving standalone studies and frozen checkpoints. A test without a floor gets a separate presentation plane; never mark parts of the subject (such as island terrain) as the lab floor.

The toolbar has Front, Side, Back, Top, Angle, Isometric and Inspection. Isometric uses an orthographic camera with equal X/Y/Z foreshortening; Angle remains a perspective view. Inspection hides only the lab floor and its contact shadow, leaving simulation and subject geometry intact. This choice persists while switching subjects or resetting. Floors use light grey `#c9cdd1` against the slate-blue background. Model dragging returns to perspective, and deliberate model zoom remains available.

The toolbar wraps into two rows on small phones and respects safe areas in portrait and landscape. Page selection, long-press callouts and browser touch zoom are suppressed in both the shell and embedded viewer; model controls and native form controls remain usable. Keep device sizes, keyboard/mouse and touch covered when changing the shared UI. The owner will review this lab before a frozen lab checkpoint is created.

The video panel plays avatar-only walking and running captures, plus the earlier side-by-side reference comparison. Videos have native pause/seeking, three playback rates and downloads. Regenerate the avatar clips with `npm run build` followed by `node test-lab/capture.mjs` (requires Chromium and ffmpeg). The capture renders the existing motion through one whole cycle and encodes three cycles at the gait's normal speed; it does not author another animation.

After building, run `node test-lab/test.mjs` for phone layout, view selection, mirrored hand controls, native touch movement, off-screen pause, video playback/seeking and all subject loading checks. The browser harness uses `/usr/bin/chromium` and saves inspection screenshots only under `/tmp`.
