# Foot socket with a rounded rim

The socket now has a real12.5mm circular round-over, like a rounded cube edge. This replaces the former height-blend transition, which did not give the edge the rounded shape the owner wanted. The original230mm ankle ball and measured center height0.1635200068m remain fixed, as does current socket X/Z[0,0].

`src/socket-roundover.js` samples the original foot's surface and solves rolling-circle fillets around the opening. Each fillet center sits12.5mm below the outer surface along its radial normal and exactly(ball radius + fillet radius) from the ankle-ball center. Its circular arc joins the outer foot and spherical cavity tangentially. Both position and slope match at the joins. This is curved mesh geometry, with no raised separate trim or shader-only smoothing. The fillet only removes material from the original clay.

`src/refine-mold-surface.js` uses conforming shared-edge splits around the entire rim with a2mm target edge size. All original source vertices remain a prefix; source X/Z outline, sole and toes stay exact. The spherical core retains the original ball's curvature and ankle height. The cavity bottom remains about48.52mm above the sole. The separate calf socket is described below.

Geometry metadata includes the refined original positions, true sphere-contact vertices, actual fillet contact vertices/centers and eight radial fillet sections. Six Node checks verify the baseline, preserved parts, closed/positive/nonfolded solid, original sphere fit and mesh accuracy, actual12.5mm fillet arcs and tangency, and independently ray-measured circular cross-sections of the final triangle mesh. These checks run before building the viewer. `npm run test:foot-lab` verifies geometry plus desktop/phone views, floor and real orbit controls.

The viewer shows the original ankle ball at the exact stored mold center. `createFootStudy({ball:true})` adds only this sphere, using the foot material; the geometry-test default leaves the ball hidden. Ball placement does not alter foot/calf buffers, transforms, materials or overall framing bounds. The live viewer additionally enables the calf socket below. No motion rig is added. Claude's motion and frozen checkpoints stay unchanged. The next checkpoint waits until the owner finishes both sockets and ball placement. Open `/test-lab/?test=feet`.

## Calf socket layer

The live study now also carves the calf's underside at75% of the measured foot press depth: about113.24mm versus150.99mm. This follows the owner's last three-quarters target (25% shallower); it does not resize the230mm ball. The same12.5mm physical rounded rim is reused. Foot, seated ball, calf pose and upper calf remain unchanged.

`src/calf-socket.js` turns the local calf geometry exactly180° to reuse the checked spherical/rolling-fillet solver on its underside, then returns it to the original frame. Lower seam indices are joined before conforming refinement; original source vertices stay a prefix. It preserves upper source positions/normals and removes stale untextured UVs after subdivision. Untouched surface normals are interpolated from the original calf; cavity normals follow the ball and rounded arc, avoiding a shading seam from the coarse source faces. The separate calf remains available for review; no second ball or movement code is added.

The new numerical suite verifies the actual75% depth by ray measurement, original ball radius and physical fillets, a closed outward-wound solid and positive thickness, original upper calf, and bit-identical foot/ball geometry and positions. Vertical probe rays avoid the original lathe's exact UV/pole axes; welded topology is checked independently. `createFootStudy({calfSocket:true})` enables this layer. Checkpoint waits for remaining refinements.

## Seat the calf on the ball

The live viewer opts into `createFootStudy({ball:true,calfSocket:true,seatCalf:true})`. This adds only a rigid calf translation: transform its stored socket center into the shared group, then move that center onto the original seated ball. Foot and ball transforms, all geometry buffers, materials, rotations and scales stay unchanged. The separate assembly remains the default for earlier shape checks.

The seating regression checks coincident world-space centers, exact geometry preservation, foot/calf shell clearance and closest points on every calf triangle. Maximum triangle intrusion into the ideal sphere is 0.00888 mm, below the original rendered ball's 0.20 mm faceting tolerance. No animation or new checkpoint is added.
