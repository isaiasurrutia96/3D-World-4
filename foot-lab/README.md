# Foot socket with a rounded rim

The socket now has a real12.5mm circular round-over, like a rounded cube edge. This replaces the former height-blend transition, which did not give the edge the rounded shape the owner wanted. The original230mm ankle ball and measured center height0.1635200068m remain fixed, as does current socket X/Z[0,0].

`src/socket-roundover.js` samples the original foot's surface and solves rolling-circle fillets around the opening. Each fillet center sits12.5mm below the outer surface along its radial normal and exactly(ball radius + fillet radius) from the ankle-ball center. Its circular arc joins the outer foot and spherical cavity tangentially. Both position and slope match at the joins. This is curved mesh geometry, with no raised separate trim or shader-only smoothing. The fillet only removes material from the original clay.

`src/refine-mold-surface.js` uses conforming shared-edge splits around the entire rim with a2mm target edge size. All original source vertices remain a prefix; source X/Z outline, sole, toes and the raw separate calf stay exact. The spherical core retains the original ball's curvature and ankle height. The cavity bottom remains about48.52mm above the sole.

Geometry metadata includes the refined original positions, true sphere-contact vertices, actual fillet contact vertices/centers and eight radial fillet sections. Six Node checks verify the baseline, preserved parts, closed/positive/nonfolded solid, original sphere fit and mesh accuracy, actual12.5mm fillet arcs and tangency, and independently ray-measured circular cross-sections of the final triangle mesh. These checks run before building the viewer. `npm run test:foot-lab` verifies geometry plus desktop/phone views, floor and real orbit controls.

No visible ball, calf socket or motion rig is added. Claude's motion and frozen checkpoints stay unchanged. The next checkpoint waits until the owner finishes both sockets and ball placement. Open `/test-lab/?test=feet`.
