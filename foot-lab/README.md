# Foot socket at the ankle height

The original230mm ankle ball molds the foot at its measured ankle height: centerY0.1635200068m above the sole. Current socket X/Z[0,0] stays fixed. `ANKLE_REST_HEIGHT` records that existing measurement; a Node check verifies it against the live original lower-leg geometry. Press depth is now derived from this seat (about151mm), instead of another guessed distance below the dome. No visible ball, calf socket or motion rig is created.

`src/ball-mold.js` retains the exact115mm spherical core through70°. Its second-order continuation matches height, slope and curvature before a10mm compact C2 smooth-min blends into the original clay. The wider blend softens the rim more than the prior6mm blend. This continuation is necessary when the lowered ball's equator meets a foot surface higher than its center; cutting off at the equator would leave a sharp seam. No raised trim or trough is added.

`src/refine-mold-surface.js` refines only the socket patch with shared-edge splits before carving. Original source vertices remain a prefix; new midpoint triangles conform without T seams. Source outline, sole, toes and raw calf stay exact. The deeper cut needs finer geometry: its maximum spherical triangle approximation error is now0.0544mm, better than the last rendered ankle ball's0.200mm.

`foot.userData.socketMold` records the exact local center, radius, derived depth, core angle and blend. Geometry metadata records exact sphere-contact indices and the refined original positions. `createFootStudy({socket:false})` preserves the untouched two-shape baseline. The actual socket center leaves about48.52mm of solid foot above the original sole.

Five numerical checks run before the viewer build: baseline/preserved parts, actual depth, closed oriented solid, independently fitted original sphere and triangle accuracy, plus the measured ankle target and continuous softened transition. Vertical top/bottom rays verify positive thickness without internal crossings. Deep concave normals can correctly turn more than90° from the old dome; projected winding and actual shell separation replace the old normal-dot shortcut. `npm run test:foot-lab` checks desktop/phone views, orbit, floor and framing.

Claude's motion and frozen checkpoints stay untouched. Review this foot refinement before another layer; the next checkpoint waits until the owner finishes both sockets and ball placement. Open `/test-lab/?test=feet`.
