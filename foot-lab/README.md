# Ball-molded foot socket study

The original ankle ball is now the geometric mold:115mm radius,230mm diameter, imported from the shared ankle contract. `src/ball-mold.js` measures the untouched foot's actual top at the current socket X/Z[0,0], then presses that exact sphere32mm down from that surface. It subtracts the lower hemisphere and rounds the intersection into the original foot with a6mm compact C2 smooth-min. The old polynomial dimple has been replaced. There is no raised rim, visible ball, calf socket or motion rig.

The imprint can become wider naturally as the full-size ball presses into the clay. Core cavity points match the actual115mm sphere; the soft intersection only removes extra material. The curve becomes inactive before the sphere's vertical tangent, so there is no cutoff seam. Calf, sole, toes, X/Z outline and source topology stay exact.

`foot.userData.socketMold` records the measured original surface, local3D ball center, original ball radius, press depth and blend width. `geometry.userData.moldContactIndices` exposes exact spherical-core points. This gives later ball-placement work a measured reference. `createFootStudy({socket:false})` still provides the untouched two-shape baseline.

Code-first checks:4 study tests prove the baseline, actual32mm press, unchanged parts, closed/wound/positive solid, finite normals and independent fitting of actual core vertices to the original sphere. All-face triangle distance also measures approximation error: current cavity chords deviate at most0.129mm from the ideal sphere, less than the original rendered ankle ball's own0.200mm faceting. No ball resizing or artificial clearance is hidden in the mold.

`node --test foot-lab/tests/study.test.mjs` runs these checks before the viewer build. `npm run test:foot-lab` checks desktop/phone views, floor, orbit and framing. Frozen checkpoints and Claude's avatar motion stay unchanged. The next checkpoint waits until the owner finishes refining the foot socket, calf socket and ball placement.

Open `/test-lab/?test=feet` or `/foot-lab/`.
