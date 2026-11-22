# Shared Test Lab foundations

## A. Scope

1. The owner approved this foundation pass before the keyboard-layout and driving-Isometric chunk. It protects the existing driving feel, camera and device input; it does not retune handling, redesign subjects or implement race progression.
2. `/test-lab/` is the testing hub. Tracks is inspection; its workspace link opens `/racing-lab/?drive=1&handling=fast`. Old `?test=driving` bookmarks redirect to driving while retaining track, handling and debug selections. Archived demos are identified as historical in the root README.
3. Reusable `motion-lab/src/page.js` and `input.js` stay in place because driving and inspection import them. No frozen checkpoint is rebuilt or edited by this pass.

## B. Choices and reasons

1. Extend the existing input translator rather than introduce a second one. This preserves device mapping, analog strength and the approved controller behavior. The new guards address interrupted events and suspension, not vehicle physics.
2. Observe releases in the window capture phase, with per-contact ownership. Relying only on pointer capture can fail when capture is denied or event bubbling is interrupted. Timed auto-release was rejected because a legitimate long hold must continue to work.
3. Run the existing browser suites alongside focused new regressions. Creating another approximate driving demo would not verify the pages actually published. Browser suites run sequentially to avoid competing software-rendering workloads.
4. Use Playwright's version-pinned Chromium/WebKit in CI, while allowing installed Chromium or `TEST_CHROMIUM_PATH` locally. This removes the test suite's dependency on the cloud desktop's `/usr/bin/chromium` path.

## C. Input contract

1. Every sample, including disabled/hidden/unfocused output, contains `moveX`, `moveZ`, `strength`, `look`, `zoom`, `source` and all six action flags. A suspended sample is entirely neutral.
2. Reset, blur, page hide, freeze and disabling clear keys, actions, gesture state and captured contacts. Commands arriving while suspended cannot become stale commands on return.
3. A global release ends only its contact. Capture failure remains recoverable; delayed loss from an old capture cannot erase a fresh captured contact reusing its ID. Existing mouse-look buttons remain supported; motion with no held mouse button clears an interrupted gesture. Driving buttons retain their separate primary-click guard.
4. Current E/S/D/F, arrows, J/L/I/K, Space and Shift mappings are retained. Keyboard camera timing is checked at 30/60/120/144 FPS. Controller polling retains analog strength, dead zones and disconnect handling; non-finite axes are neutralized.

## D. Checks and publishing

1. `npm run test:lab-foundations` runs shared-input, driving-button, pedal, lifecycle, install-metadata, FPV, camera and inspection-zoom Node checks.
2. `npm run test:official-avatar`, `npm run test:racing-core` and `npm run build` retain the asset, physics, type and build checks already used for publication.
3. After building, `npm run test:lab-foundations-browser` runs nine suites: active routes/input, marker input, track inspection, driving, interrupted steering release, bridge camera, app installation metadata, Chromium app return and WebKit app return.
4. Install the pinned test browsers with `npx playwright install --with-deps chromium webkit`. `PLAYWRIGHT_BROWSERS_PATH` can point to a writable browser cache. `TEST_CHROMIUM_PATH` explicitly chooses a local Chromium executable; CI otherwise uses Playwright's pinned executable.
5. The publication workflow runs these checks on main and pull requests. A failed suite stops publication. Pull requests never deploy. Per-suite status/duration and route/input results are written to `.test-results/lab-foundations/` and attached to the workflow run; `TEST_REPORT_DIR` overrides that location.

## E. Practical limits

1. Native browser touch and injected Gamepad API checks exercise the production input path, not physical controllers or an actual iPhone's task switcher. They do not establish subjective feel or hardware frame rate.
2. Current numerical and browser results are recorded in `racing-core/PLAN.md`. The approved handling reference remains Driving Checkpoint 2. Keyboard changes, the driving Isometric view, performance tiers and new-kart handling are separate chunks.
