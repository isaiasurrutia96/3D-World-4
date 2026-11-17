# Playable run test

Open `/run-test/` on a phone. Touch anywhere on the left half to create the joystick, drag to move, and push farther for more speed. A second touch on the right half rotates the follow camera. Release to brake and settle into the saved standing pose. Desktop: WASD/arrows, Shift for full speed, drag to orbit, wheel to zoom.

This uses the current reviewed motion from `MatchedMotion`: the original source step sequence retargeted to the saved avatar proportions, forward lean, toe articulation, closer arms with 15% less swing, and independently posed relaxed running hands. It does not use the earlier procedural walk from `/movement/`.

The contact trajectory is measured from this avatar's animated forefoot. During support, that contact point stays fixed horizontally and the body advances over it; heel/toe roll and heading pivots remain possible. Forward travel and clip phase follow the same measured stride, rather than sliding a looping clip at an unrelated speed. Source-derived support heights put the soles on the slab; gaps between contacts allow brief flight. Start/stop blends return to the saved standing pose, with two-bone IK preserving knee/calf connections. Calf shafts stay rigid and existing socket lips follow their feet.

Full input gives approximately 4.26 m/s at the reviewed cycle duration. The 60 m dark-grey slab has faint metre lines and a boundary margin. This is a flat-floor run test; the earlier `/movement/`, comparison clips, Motion Lab, and immutable Checkpoint 2 remain available.

Hand poses remain independent from locomotion for future object grips. Props should follow their hand transform; carrying/aiming can override the empty-hand arm layer while the legs keep running.

Build with `npm run build` or `node run-test/build.mjs`. The self-contained HTML uses the same hand-bind observer as the comparison renderer, with no changes to approved mesh generators. Test with `node run-test/test.mjs`: straight running, turning, reversal, stopping, contact drift, floor clearance, bone lengths, native floating joystick and simultaneous camera touch.

Live playback caches the measured joint transforms and smooth foot/socket surfaces, then interpolates them every displayed frame, with input, movement and camera advanced together. The source thigh sweep is reduced by 6% while retaining knee bending. The cache is about 36 MB; no dense surface rebuilding or normal filtering runs during steady movement. Starting/stopping reuses cached normals. The slate-blue stage matches the other labs, and a soft contact shadow replaces the full character shadow-map pass on the run page.
