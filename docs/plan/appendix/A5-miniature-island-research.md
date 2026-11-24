# Appendix A5: Miniature island research (23-24 November 2026)
Raw research data, generated on 24 November 2026 from the multi-agent runs. Every finding here passed an independent skeptic unless marked otherwise. Paths marked "(scratch folder, not saved)" were temporary test files that no longer exist. Plain-English summaries and decisions live in the numbered files one folder up; this appendix is for checking details. The final critic step was lost in a machine restart; the plan step will be rerun with the owner's ideas.

## Island size, zones and scale: research
**Question:** How big must the miniature LetsGo island be, and how should it be laid out, to hold 6 race tracks (2 each for GoKart, GT, F1), a skate park, a practice field with small stations for every minigame, an obstacle course and a spawn hub, as small as possible while still fun and phone-friendly?
**Summary:** The F1 tracks decide the island size. A good F1 lap needs roughly 0.9 to 1.2 km of road, and a loop that long encloses about 7 to 8 hectares. Everything else (GT and GoKart tracks, hub, practice fields, skate park, obstacle course) fits inside the F1 loop's infield, the way Indianapolis has golf holes inside its oval. I drew five real candidate layouts and checked each one with a script. I also drove all 30 tracks with Codex's own racing-core karts, and every kart stayed on the road. Six fully separate tracks need a 444 x 460 m island (20.4 ha). Letting the two tracks of each class share road, like Silverstone's National and GP layouts, and nesting everything inside the F1 loop, needs only 390 x 297 m (11.6 ha) with no bridges. That uses 35% less road and fits all laps in about 22 to 44 seconds. Smaller is possible: 370 x 270 m (10 ha) if GT and F1 share one circuit, or 340 x 260 m (8.8 ha) with a figure-8 bridge, but each step costs quality or decisions. I recommend the 390 x 297 m nested "racing park" (about 907 x 691 blocks). For scale, it is smaller than the old Original Circuit alone (669 x 496 m).

### Options

1. **S1: six separate tracks (no shared road, no bridges; smaller tracks nested in bigger infields where they fit)**
   - How it works: Each of the 6 tracks is its own closed road. F1-GP runs around the top half with GT-Long and the practice zones inside it; F1-Sprint, GT-Short and GK-Short are nested inside each other in the bottom half; GK-Long sits beside them.
   - Pros: Every track is fully independent: changing one never affects another. No junctions. Matches 'each mode has its own tracks' in the strictest sense.
   - Cons: Biggest island (20.4 ha) and most road to build (4.58 km, +54% vs S2b). More voids. Tracks still had to be nested to keep it this small.
   - Evidence: Layout file (scratch folder, not saved) plan2/island/s1separate.mjs; results in run-all.txt and results-s1separate+s2nested+s2compact+s3combined+s4stacked.json in the same folder.
   - Test result: Island 444 x 460 m = 20.42 ha; 0 layout problems; road to build 4,584 m; 0 bridges. Careful-driver flying laps: F1-GP 1,172 m 35.7 s, F1-Sprint 888 m 27.2 s, GT-Long 971 m 49.3 s, GT-Short 626 m 31.8 s, GK-Long 520 m 40.6 s, GK-Short 519 m 40.7 s; max distance from centre-line 0.32 m (all on road).

2. **S2a: shared road per class (2 layouts per network), nested inside the F1 ring, roomy**
   - How it works: Three road networks (F1, GT, GoKart). Each class's two tracks are two configurations of its network sharing most of the road (like Silverstone GP vs National, Bahrain GP vs Outer). The F1 network rings the island; GT network in the north infield, GoKart network plus hub in the south infield.
   - Pros: No bridges, no cross-class sharing, every network has one constant road width (fits racing-core's one halfWidth per track). Extra slack for future changes.
   - Cons: 13.4 ha, some empty infield space; 3.22 km of road.
   - Evidence: s2nested.mjs in the scratch folder; run-all.txt.
   - Test result: Island 420 x 320 m = 13.44 ha; 0 problems; road 3,223 m; 0 bridges. Careful laps: F1-GP 1,273 m 36.4 s, F1-Sprint 984 m 30.5 s, GT-Long 891 m 47.0 s, GT-Short 614 m 31.5 s, GK-Long 559 m 44.4 s, GK-Short 479 m 40.8 s; max lateral error 0.31 m.

3. **S2b (RECOMMENDED): shared road per class, nested inside the F1 ring, tightened 'racing park'**
   - How it works: Same as S2a but packed tight: F1 ring (GP = full ring, Sprint = south loop via a cut road); GT network (Long with a technical hairpin notch, Short via a mid cut) in the north infield with practice field A, skate park and obstacle course inside it; GoKart network (Long and Short sharing a hairpin section), hub, pond and practice field B in the south infield. Road widths in whole blocks: GoKart 24 blocks (10.32 m), GT 30 (12.9 m), F1 34 (14.62 m), plus 4 m runoff. Minimum corner radii: GoKart 12 m, GT 16 m, F1 30-35 m.
   - Pros: No bridges or tunnels needed for karts. No conflict with KARTS.md A3 (each class keeps its own roads). One constant width per network. Each class can be redesigned without touching the others. 43% smaller and 35% less road than S1. Practice stations use only 26% and 56% of their fields, which leaves room for the owner's changes. Every zone is within about 27 s of running from the hub.
   - Cons: 1.6 ha bigger than S3. The F1-Sprint lap is on the short side with the Fast profile (25 s careful); 2 or 3 extra corners in the same space would fix it. Zones in the GT infield are reached by crossing 2 roads (fine for single player; online may want 1 or 2 footbridges or tunnels).
   - Evidence: s2compact.mjs, winner-map.txt, sensitivity.mjs, stations.mjs, render-results.json in (scratch folder, not saved) plan2/island. Real-world precedents: Silverstone GP 5.891 km / National 2.639 km / International ~2.98 km; Bahrain GP 5.412 / Outer 3.543 / Paddock 3.823 / Endurance 6.299 / Inner 2.554 km (Wikipedia via search: https://en.wikipedia.org/wiki/Silverstone_Circuit, https://en.wikipedia.org/wiki/Bahrain_International_Circuit). Gran Turismo 7 turns ~34-39 venues into 63 (launch) to ~116-118 layouts, e.g. Kyoto Driving Park Yamagiwa / Miyabi / Yamagiwa+Miyabi (https://www.techradar.com/how-to/gran-turismo-7-track-list, https://www.gtplanet.net/forum/threads/gran-turismo-7-master-track-list.394378/). Indianapolis has 4 golf holes inside the oval, reached by a tunnel (https://www.indianapolismotorspeedway.com/news-multimedia/news/2020/03/11/brickyard-crossing-history-overview).
   - Test result: Island 390 x 297 m = 11.58 ha (907 x 691 blocks); 0 problems; road to build 2,970 m; 0 bridges.
Careful / skilled flying laps (racing-core controllers, flat ground): F1-GP 1,154 m 30.9 / 26.9 s; F1-Sprint 882 m 25.4 / 21.8 s; GT-Long 803 m 44.2 / 39.6 s; GT-Short 534 m 29.0 / 26.0 s; GK-Long 539 m 43.3 / 38.8 s; GK-Short 459 m 39.6 / 35.4 s. Max lateral error 0.29 m.
With the other F1 profiles the F1 laps get longer: F1-GP 42.8 s (fast-before-grip) and 41.7 s (f1-2026); F1-Sprint 35.1 and 34.4 s. GT3 profile: 42.8 and 28.2 s.
ASCII map (1 column = 5 m, 1 row = 10 m, north up; f = F1-GP-only road, F = F1 road also used by Sprint, g/G = GT Long-only/shared, k/K = GoKart Long-only/shared, S = start line, H = hub, P = practice A (ball and target games), Q = practice B (jumps, ice, ski hill, paintball), R = skate park, O = obstacle course, W = pond, ~ = sea):
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~............................................................................~
~.....ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff.....~
~...ff..................................................................ff...~
~...f......GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgggggggggggggggggggg......f...~
~...f....GGG.......................RRRRRRR....GG..................ggg....ff..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...RRRRRRR.....GG...................g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...RRRRRRR......G...................g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...RRRRRRR......G...................g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...OOOOOOOOO....G......gggggg.......g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...OOOOOOOOO....G.....gg....gg......g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...OOOOOOOOO...GG.....g......g......g.....f..~
~...f....GG........................OOOOOOOOO...G......g......g.....gg.....f..~
~...f.....GGGGGGGGGGGGGGGGGGGGSGGGGGGGGGGGGGGGGGgggggg........gggggg......f..~
~...f.....................................................................f..~
~...f..FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...f..~
~...fFFF..............................................................FFF.f..~
~...FF....KKKKKKKK........KKKKKKKKkkkkkkkk....WWWWWW.......HHHHHHHH.....FFf..~
~...F....KK......KKK....KKK......KKK.....kkk..WWWWWW.......HHHHHHHH......FF..~
~...F....K.........K....K..........K.......k..WWWWWW.......HHHHHHHH.......F..~
~...F....K.........K....K..........K.......k..WWWWWW.......HHHHHHHH.......F..~
~...F....K.........KK..KK..........K.......k..QQQQQQQQQQQQ.HHHHHHHH.......F..~
~...F....K..........KKKK...........K.......k..QQQQQQQQQQQQ................F..~
~...F....K.........................K.......k..QQQQQQQQQQQQ................F..~
~...F....K........................KK......kk..QQQQQQQQQQQQ...............FF..~
~...F....KKKKKKKKKKKKKKKSKKKKKKKKKKkkkkkkkk...QQQQQQQQQQQQ...............F...~
~....FF................................................................FF....~
~.....FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFSFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.....~
~............................................................................~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

4. **S3: GT and F1 share one wide circuit (4 layouts), GoKart keeps its own network**
   - How it works: One F1-width road network carries all four big-kart layouts: F1-GP (full ring), F1-Sprint (south loop), GT-Long (north loop plus a technical hairpin notch), GT-Short (north-west loop). Real circuits work this way: Bahrain and Silverstone host both F1 and GT racing on different configurations, and Mario Kart runs every engine class on the same tracks. The GoKart network, hub and zones sit in the infields.
   - Pros: Smallest bridge-free option: 370 x 270 m = 9.99 ha (−14% vs S2b), 2,262 m of road (−24%). Still one constant width per track.
   - Cons: GT tracks share straights and widths (14.6 m) with F1, so GT and F1 tracks feel more alike. Changing the F1 circuit also changes GT tracks (the classes are coupled). This may read against KARTS.md A3 ('each mode has its own tracks'), so it needs the owner's OK. The infields are full, which leaves little room for changes.
   - Evidence: s3combined.mjs; Bahrain layouts (https://en.wikipedia.org/wiki/Bahrain_International_Circuit); Mario Kart engine classes share tracks (general knowledge, not separately sourced).
   - Test result: 0 problems; 0 bridges. Careful / skilled laps: F1-GP 1,060 m 29.1 / 25.3 s; F1-Sprint 844 m 24.8 / 21.2 s; GT-Long 881 m 45.5 / 40.7 s; GT-Short 597 m 30.6 / 27.4 s; GK-Long 541 m 43.4 / 38.9 s; GK-Short 461 m 39.8 / 35.5 s; max lateral 0.29 m.

5. **S4: stacked/elevated, figure-8 F1 GP over one bridge (Suzuka-style)**
   - How it works: A smaller ring with an X through the middle. F1-GP runs a figure-8 that crosses itself on one bridge. F1-Sprint is the plain ring. The two GT layouts each use one diagonal (sharp 119° hairpins). The GoKart network squeezes into the east infield piece and the zones go into the other three pieces.
   - Pros: Smallest island that passes every check: 340 x 260 m = 8.84 ha; least road (2,036 m). The bridge ramps fit (52 m needed each side at 10% grade for 4.3 m clearance; 113 m of straight available).
   - Cons: Needs a bridge, ramps, two-level collision for karts and avatar, and camera and shadow handling under the overpass. The X chops the infield into four awkward pieces. The two GT tracks are mirror twins (both 717 m). GK-Short shrinks to 295 m (24 s laps). All big-kart layouts share one network. Saves only 1.2 ha vs S3 and 2.7 ha vs S2b.
   - Evidence: s4stacked.mjs; Suzuka figure-8 crossover is common knowledge; ramp check in engine.mjs (evaluate → ramps).
   - Test result: 0 problems with 1 declared bridge (crossing at 170,130, 57°). Careful / skilled laps: F1-GP 1,232 m 41.5 / 35.9 s; F1-Sprint 980 m 27.5 / 23.9 s; GT-A and GT-B 717 m 34.1 / 30.6 s; GK-Long 444 m 31.5 / 28.4 s; GK-Short 295 m 24.0 / 21.5 s; max lateral 0.31 m.

6. **Reuse the existing racing-core tracks as they are (26 m roads, 3.7-6.6 km)**
   - How it works: Put the current TRACK_IDS (original, skyline, suzuka, winding) on the island.
   - Pros: No new track work for those four tracks.
   - Cons: Each track alone is bigger than the whole recommended island: Original's bounding box is 669 x 496 m, Suzuka's 2,014 x 927 m. Only 4 tracks, not 6, and they are not split by class. Lap times run 92 s+ (Original took 92.3 s in Codex's own course check).
   - Evidence: /home/user/3D-World-4/racing-core/track/reference.json (lengths 3,680 / 4,510 / 5,758 / 6,636 m, halfWidth 13 m, curb 1.1 m); /home/user/3D-World-4/racing-core/kart/COURSE-CHECKS.json (original, completionSeconds 92.275).
   - Test result: Not laid out. I measured their bounding boxes from reference.json and they cannot fit a miniature island. Keep them for the later big world.

### Tests run

1. **Real-physics lap test on all 30 candidate tracks (5 layouts x 6 tracks), 2 driver skills**
   - How: Node 22 with --experimental-strip-types imports racing-core read-only: createKartController plus KART_PROTOTYPES geometry. Profiles: GoKart = gokart-prototype, GT = gt-prototype, F1 = DRIVING_PROFILES.fast (the approved Fast feel). Flat world (heightAt = 0). A pure-pursuit fixture driver modeled on Codex's course-check.test.mjs plans speed from the profile's own cornering and braking curves. 'careful' = 50% of grip and 55% of braking; 'skilled' = 65% and 75%. Standing and flying laps; max distance from the centre-line is compared with the road half-width. Script: engine.mjs driveLap, run.mjs; output run-all.txt.
   - Result: All 30 tracks drivable. Max lateral error 0.14-0.32 m against half-widths of 5.16-7.31 m. Careful flying laps 24-49 s; skilled 21-44 s (per-track numbers are in options).
   - Limits: No barriers, opponents, items, nitro, slopes or surfaces. A scripted driver is not a phone player. The rectangle-based shapes are placeholders for real corner design.

2. **Driver diagnosis (why the GoKart first left the road)**
   - How: diag.mjs logged the worst lateral error on Canyon Switchbacks. The fixture had planned 9 m/s² braking, but the GoKart can only brake about 8.8 m/s² (braking curve x brakeStrength 0.8). I changed the fixture to plan from each profile's own braking curve.
   - Result: Before the fix: GoKart up to 5.8 m off line (sliding at hairpin exit, lateral speed 3.7 m/s). After: ≤0.24 m everywhere. So the problem was the driver script, not the geometry.
   - Limits: Shows the track geometry is drivable, not that a human finds it easy.

3. **Old repo Canyon Switchbacks replayed with today's karts**
   - How: Imported createCanyonRoute from /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-garden/src/canyon-layout.js (read-only) and drove it with all three classes (canyon.mjs).
   - Result: 502.7 m, centre-line box 84 x 90 m, 8.6 m road, 9 m hairpins. Careful / skilled laps: GoKart 56.9 / 50.4 s, GT 51.1 / 45.3 s, F1 36.1 / 31.9 s; max lateral 0.24-0.44 m. Its ten hairpins make a slow lap for its length.
   - Limits: Flat (the canyon's height bumps were ignored); no rails.

4. **Calibration loops (lap time vs length per class)**
   - How: calibrate.mjs on rounded rectangles and notched shapes.
   - Result: Roughly: GoKart ~340 m gives ~21 s; GT ~700 m ~31 s; F1 ~980 m ~29 s (careful). This set the targets: GoKart 450-550 m, GT 530-900 m, F1 0.85-1.25 km.
   - Limits: Early fixture version (before the braking fix); used only for sizing.

5. **Layout checker on 5 strategies**
   - How: engine.mjs evaluate(). Checks: track centre-lines are rounded polygons whose corner fillets must fit their edges; minimum corner radius per class (GoKart 10, GT 14, F1 18 m); road + 4 m runoff + 6 m beach inside the island; no road through any zone; zones inside the island and not overlapping; road-to-road clearance (different networks need both half-widths + 8 m); within one network, roads must coincide or form short junctions (<70 m); true crossings by segment intersection (>20°) need a declared bridge; bridge ramp check (4.3 m clearance at 10% grade + 9.3 m); unique road length; roads to cross from hub to each zone.
   - Result: All 5 final layouts: 0 problems. Areas: S1 20.42 ha, S2a 13.44, S2b 11.58, S3 9.99, S4 8.84. Road to build: 4,584 / 3,223 / 2,970 / 2,262 / 2,036 m. Bridges: only S4 (1, ramps feasible).
   - Limits: Islands are rectangles. No terrain heights. Runoff and beach widths are my assumptions.

6. **Kart profile sensitivity on the recommended S2b**
   - How: sensitivity.mjs swaps F1 profiles (fast, fast-before-grip prototype, f1-2026) and GT profiles (gt-prototype, gt3).
   - Result: F1-GP 30.9 / 42.8 / 41.7 s; F1-Sprint 25.4 / 35.1 / 34.4 s; GT-Long 44.2 vs 42.8 s; GT-Short 29.0 vs 28.2 s. Track lengths stay in a good window whichever F1 tune Codex and the owner choose.
   - Limits: Careful driver only.

7. **Practice-station packing**
   - How: stations.mjs: greedy shelf packing with 3 m walkways. Practice A (100 x 60 m, 12 stations: bowling lane 25 x 2.5, batting cage 21.3 x 4.3, archery 22 x 5, football lane 32 x 10, soccer penalty 20 x 18, half court 15 x 14, frisbee 20 x 11, mini golf 12 x 7, golf bay 6 x 5, skee-ball 5 x 4, darts 4 x 3, billiards 5.2 x 4.3). Practice B (60 x 46 m: long jump 38 x 3, high jump 15 x 12, ice loop 30 x 15, ski hill 30 x 12, paintball 25 x 18).
   - Result: Both fit. A: rows use 33.5 of 60 m, stations cover 26% of the field. B: rows use 39 of 46 m, 56% coverage.
   - Limits: Station sizes are my small-practice estimates from real dimensions. The ski hill needs a 6-8 m mound.

8. **Phone-style render test of the whole island**
   - How: three.js 0.180 (copied from the repo's node_modules) in Chromium via Playwright, 390 x 844 viewport. CPU throttle 1x and 4x via CDP. Scene: island box, sea, every layout's road ribbon + 2 curb strips + 2 low walls (shared road drawn several times, so this over-counts), zone slabs, 720 instanced props, 8 moving karts. Chase and top views, 300 measured frames (render-test.cjs, web/index.html).
   - Result: S2b: 12.6k triangles / 24 draw calls (chase), 30.6k / 39 (top). CPU time per frame median 0.4-0.5 ms at 1x, 1.6-1.9 ms at 4x (p95 ≤5 ms). S3 similar (≤30.7k triangles, 39 calls).
   - Limits: SwiftShader software GPU, so only CPU-side JS times mean anything; this is not real GPU frame time. No block-built terrain, avatar, shadows or real art.

### Recommendation
**Choice:** Plan the miniature as a nested 'racing park' island of about 390 x 300 m (about 907 x 691 blocks, 11.6 ha), layout S2b. The F1 circuit rings the island: F1-GP is the full ring (~1.15 km) and F1-Sprint is the south loop via a cut road (~0.9 km). The GT circuit sits in the north infield: GT-Long ~0.8 km with a technical hairpin section, GT-Short ~0.53 km. The GoKart circuit sits in the south infield (GK-Long ~0.54 km, GK-Short ~0.46 km, sharing a hairpin section). Practice field A, the skate park and the obstacle course go inside the GT loop; the hub, pond and practice field B go beside the GoKart circuit. No bridges or tunnels for karts. Road widths in whole blocks: GoKart 24 (10.3 m), GT 30 (12.9 m), F1 34 (14.6 m). Each track should be stored as a list of named corner points, so the owner's changes are data edits.
**Why:** It meets every need with zero bridges and passes every geometry check. Every track is drivable by racing-core's own karts, and laps run about 22-44 s. That matches arcade norms: Mario Kart 8 Deluxe's 150cc Mario Kart Stadium record is 1:34.047 for 3 laps, about 31 s per lap, and SuperTuxKart's track guide measures length by clean-lap time. It is 43% smaller and needs 35% less road than separate tracks. Sharing road inside each class is proven practice: Silverstone has GP, National and International layouts, Bahrain has five or six, and Gran Turismo 7 turns about 38 venues into about 116 layouts. It keeps each class on its own roads, so it does not touch KARTS.md A3, keeps one road width per track as racing-core expects, and lets Codex or the owner change one class without breaking another. The two smaller options save only 1.6-2.7 ha. One makes GT and F1 share a circuit; the other needs a bridge with ramps and two-level collision, and gives mirror-twin GT tracks. Empty grass is cheap: the whole island's roads and zones rendered at about 31k triangles and 39 draw calls. Bridges and coupled tracks cost real build and test time.
**Confidence:** medium
**Conflicts with confirmed decisions:** None with the confirmed list. Three things to flag. (1) The proposed road widths (10.3 / 12.9 / 14.6 m) are much narrower than racing-core's current 26 m roads, and the approved Fast feel was tuned on 26 m roads. Width is not a confirmed decision, but it changes how hard tracks feel, so the owner should feel-test it. (2) The plan needs six new short tracks and a centre-line-to-track generator, because TRACK_IDS is fixed to the four long tracks. That is Codex's area. (3) Option S3 would share roads between GT and F1, which may read against KARTS.md A3, so it is offered only as an owner choice.
**What would change it:** If the owner is happy for GT and F1 tracks to share some road (like real circuits do), pick S3 (370 x 270 m, 10 ha, 24% less road). If the owner wants every track to look totally separate, plan ~444 x 460 m (S1). If Codex and the owner choose the f1-2026 or prototype F1 tune, F1 laps grow to 34-43 s, so the F1 tracks could be shortened ~10-20% and the island would shrink a little. If phone tests show the narrower roads are too hard, widen them (about +5% area). If the obstacle course must match the old yard (about 88 x 86 m), the GT infield needs to grow by about 40 m.

### Key numbers
1. Recommended island S2b: 390 x 297 m = 11.58 ha (907 x 691 blocks of 0.43 m); 2,970 m of road; 0 bridges (scratch s2compact.mjs + engine.mjs)
2. Other measured islands: separate tracks 444 x 460 m = 20.42 ha (4,584 m road); roomy nested 420 x 320 = 13.44 ha; GT+F1 shared 370 x 270 = 9.99 ha (2,262 m); figure-8 with bridge 340 x 260 = 8.84 ha (2,036 m) (run-all.txt)
3. S2b track lengths and careful/skilled flying laps: F1-GP 1,154 m 30.9/26.9 s; F1-Sprint 882 m 25.4/21.8 s; GT-Long 803 m 44.2/39.6 s; GT-Short 534 m 29.0/26.0 s; GK-Long 539 m 43.3/38.8 s; GK-Short 459 m 39.6/35.4 s (racing-core controllers, flat world)
4. F1 laps on S2b with other F1 tunes: 41.7-42.8 s (GP) and 34.4-35.1 s (Sprint) (sensitivity.mjs)
5. Kart prototypes (racing-core/kart/prototypes.ts): GoKart 2.35 m long, 1.35 m wide, wheelbase 1.46 m, top 68 mph; GT 3.25 x 2.19 m, wb 2.10, 120 mph; F1 4.60 x 2.02 m, wb 3.04; Fast profile 180 mph (profiles.ts); steering lock 30° gives low-speed turning radius 2.5 / 3.6 / 5.3 m
6. Current racing-core tracks: original 3,680 m (box 669 x 496 m), skyline 4,510, suzuka 5,758 (box 2,014 x 927), winding 6,636; all 26 m road (halfWidth 13) + 1.1 m curb (racing-core/track/reference.json); Original course check 92.3 s (kart/COURSE-CHECKS.json)
7. Old Canyon Switchbacks: 502.7 m, centre-line box 84 x 90 m, 8.6 m road, 9 m hairpins (3d-world-3 apps/letsgo-garden/src/canyon-layout.js); today's GoKart laps it in 56.9 s careful / 50.4 s skilled
8. Old 3d-world-3 island: 160 m across, ~175,000 triangles with rounded blocks; Original Circuit ~660 x 490 m beside it, joined by a 48 x 11 block bridge (3d-world-3 docs/DECISIONS.md, 13-14 Nov); old yard obstacle course roughly 88 x 86 m (Course.ts constants)
9. CIK-FIA karting licence criteria for new circuits from 2025: min length 1,100 / 1,000 / 800 m and min width 8 / 7 / 6 m for Grades 1/2/3 (Appendix 13, https://www.fiakarting.com/sites/default/files/2025-11/Appendix%2013%20-%20Licence%20Criteria.pdf, via search summary; the PDF host was blocked for direct reading)
10. Typical serious kart track ~1,100-1,200 m long, 7-9 m wide (https://en.wikipedia.org/wiki/Kart_circuit via search); South Garda Karting Lonato 1,200 m (https://iame-motorsport.com/event_78.html)
11. Silverstone GP 5.891 km, National 2.639 km, International ~2.98 km; Bahrain GP 5.412, Outer 3.543, Paddock 3.823, Endurance 6.299, Inner 2.554 km (Wikipedia via search)
12. Red Bull Ring F1 race lap record 1:05.619 (Sainz, 2020), the shortest F1 lap on the calendar (https://www.pirelli.com/global/en-ww/race/racingspot/formula-1/f1-gp-five-fast-facts-about-the-austrian-gp-86165/); Brands Hatch Indy ~1.93-1.944 km, race lap record 38.032 s (Wikipedia via search)
13. Mario Kart 8 Deluxe 150cc Mario Kart Stadium 3-lap record 1:34.047 (~31 s per lap); sample player profiles ~1:41-1:51 (https://mkleaderboards.com/mk8dx/world_records/standard via search snippet; direct fetch blocked)
14. Gran Turismo 7: 34 base tracks become 63 layouts at launch; later about 116-118 layouts over 38-39 locations (https://www.techradar.com/how-to/gran-turismo-7-track-list, https://www.giantbomb.com/wd/3030-78951)
15. Mario Kart World: all courses in one open map, about 202 connecting routes (https://www.mariowiki.com/Mario_Kart_World via search)
16. Skatepark size bands: skate spot ~150-600 m² (1,500-6,000 sq ft), neighbourhood ~460-1,400 m² (5,000-15,000 sq ft) (https://skateparktour.ca/skatepark-typology and planning guides via search); skate zone used here 32 x 26 m = 832 m²
17. Batting cage standard 70 x 14 x 12 ft (https://coversports.com/resources/field-guides/batting-cage-dimensions-setup-guide); long jump runway ≥40 m x 1.22 m (World Athletics page via search: https://worldathletics.org/disciplines/jump/long-jump)
18. Render test of the S2b island (roads + curbs + walls + zones + 720 props + 8 karts): 30.6k triangles, 39 draw calls; CPU 0.5 ms per frame (1x), 1.9 ms (4x throttle), SwiftShader (render-results.json)
19. Bridge ramp need: 4.3 m clearance at 10% grade = 43 m + 9.3 m each side, about 52 m (engine.mjs ramp check)
20. Wuhu Island (Wii Sports Resort): no official size found; Iwata Asks confirms one island was the shared setting for all sports so players learn its layout (https://iwataasks.nintendo.com/interviews/wii/wiisportsresort/0/1)

### Time savers
1. Store every track as data: a road network is a short list of named corner points (x, z, radius), and each track is a list of corner names. Two tracks per class then share one road, and moving one corner updates both. The owner's changes become one-line edits. engine.mjs and helpers.mjs in the scratch folder are a working prototype of this.
2. Use the Node checker plus lap test (about 7 s for six tracks, about 37 s for five whole islands) to validate every layout change before any browser publish. Racing browser suites currently take about 290 of the 308 s of checks per publish.
3. Build no bridges or tunnels in the miniature. The test shows they save only about 1.2-2.7 ha here, but they add elevation, ramps, two-level collision for karts and the avatar, and camera and shadow work.
4. Nest everything inside the F1 loop, so one compact island holds all six tracks and every zone, with no access roads or bridges between islands.
5. Keep the four existing long tracks for the later big world instead of shrinking them. Each one is bigger than the whole miniature island.
6. The old Canyon Switchbacks layout (Codex's code in 3d-world-3) already drives well with today's GoKart (0.24 m line error), so it can be ported as a GoKart candidate. Drop 2-4 of its 10 hairpins to bring the lap from about 50-57 s down to about 40 s.
7. The practice fields have slack (stations cover 26% and 56%), so the owner can add or resize stations without moving any track.
8. Until walking returns, the hub can teleport to each game's gate (the watch's door in MINIGAMES.md A1). Run distances from the hub are only 7-27 s anyway.

### Risks
1. The lap times come from a scripted driver on flat ground, with no barriers, opponents, items, nitro or slopes. Real phone players will differ, and the owner must judge fun on a real phone.
2. The shapes are simple rounded rectangles standing in for real corner design (Codex's area). More interesting corners usually add length in the same space, which helps short laps like F1-Sprint, but may need about 10% more room. Keep some headroom.
3. The proposed narrower roads (10.3 / 12.9 / 14.6 m vs today's 26 m) change difficulty and 8-kart racing room, and they are untested with packs of karts. The approved Fast feel was tuned on 26 m roads.
4. racing-core's TRACK_IDS is fixed to the four long tracks with one constant half-width each. The miniature needs a centre-line-to-track generator and six new track entries (Codex's area, needs coordination).
5. Terrain built from blocks can cost far more triangles than the roads. The old 160 m island was about 175k triangles. A 390 x 297 m island at the same detail could blow the phone budget unless flat areas are merged into large faces and detail stays near features. The render test covered roads, zones and props only.
6. Kart sizes disagree (Claude's F1 2.9 m vs Codex's 4.6 m). I used Codex's prototypes; with a shorter F1 the widths still work.
7. Zones inside the GT loop need 2 road crossings on foot. That is harmless in single player; online play may want 1-2 footbridges or tunnels later (Indianapolis uses a tunnel).
8. Several web sources (fiakarting.com, mkleaderboards.com, supertuxkart.net) could not be opened directly because the session network blocks those hosts, so their numbers come from search summaries. The '40-70 s, sweet spot 60 s' SuperTuxKart figure appeared only in a search summary and could not be confirmed.
9. Browser numbers come from the SwiftShader software GPU. Only the CPU-side times are meaningful; real iPhone GPU frame time is not tested.

### Owner taste questions
1. May the GT and F1 tracks share some road, as different layouts on one circuit the way Bahrain and Silverstone host both kinds of racing? Options: (a) No, each class keeps its own roads (recommended S2b, about 390 x 300 m); (b) Yes, which saves about 14% of the island and 24% of the road (S3, about 370 x 270 m) but makes GT and F1 tracks feel more alike.
2. Is it OK for a class's two tracks to be two versions of one circuit sharing a main straight (like Silverstone National and GP), or must they look completely different? Options: (a) Versions are fine (recommended, about 11.6 ha); (b) Completely different tracks (about 20 ha and about 55% more road to build).

## Island size, zones and scale: skeptic
**Holds up:** False

### Problems

1. **The headline size (390 x 297 m) is packed to the last metre, and its fallback claim is wrong. The report says that if narrow roads turn out too hard on the phone, widening them costs 'about +5% area'. In fact any wider road breaks the layout, and the real cost is 5 to 10 times higher.**
   - Evidence: My own independent checker (my own geometry code, not the researcher's engine) confirms S2b passes as drawn, but only just: the smallest gap between road networks is 8.2 m against an 8 m rule, and the smallest gap to a zone is 5.5 m against a 4 m rule. I then pushed the road lines apart by exactly the extra width, kept every zone the same size, and rechecked. Medium roads (GoKart 13 m, GT 17 m, F1 20 m) need 432 x 333 m = 14.41 ha (+24%). Game-wide roads (16 / 22 / 26 m, where 26 m is today's approved racing-core road) need 481 x 375 m = 18.06 ha (+56%). Scaling the whole layout uniformly gives 16.96 and 24.69 ha. Scripts: widen-s2b.mjs and check-s2b.mjs in (scratch folder, not saved) plan2/verify-island.
   - Fix: Do not lock 390 x 300 m. Reserve about 430 x 335 m (about 14 ha), which fits medium roads with the same layout. Keep every road width and corner position as data, and shrink back only after the owner's phone test picks narrow roads.

2. **'Every kart stayed on the road' is offered as proof that the narrow roads are drivable, but it only shows that a perfect robot can drive them. Simulation cannot settle road width for a human on a phone.**
   - Evidence: My robot driver reproduced the report's lap times within 0.2 to 0.8 s (for example F1-GP 30.1 vs 30.9 s, GT-Long 44.0 vs 44.2 s, GK-Long 42.8 vs 43.3 s). I then added a 0.15 s reaction delay (still analog steering). The F1 drifted up to 12.3 m off the centre line on the 14.6 m road and was off the road 22 s over 3 laps; the GT drifted 8.2 m. Driving with Left/Right buttons only (the phone controls in racing-lab) was worse. As a control, I ran the same delayed drivers on the approved 26 m Original Circuit, which the owner has already driven and approved on the phone. They also left that road (22 m off line, 12.8 s off the road). So these driver models are too harsh to judge width, and the robot's 0.3 m says nothing about humans. Scripts: drive.mjs, drive-s2b.mjs and drive-control.mjs.
   - Fix: Before fixing the island size, have Codex put one short test loop with three road widths into the racing lab, and let the owner drive it on the phone. Treat road width as a feel decision the owner makes by testing.

3. **Missed blocker: today's block world code (src/world) cannot build an island anywhere near this size, on a phone or anywhere else. The report's line 'Empty grass is cheap' is only true once a new ground method exists.**
   - Evidence: I measured the code without changing the repo. The approved 14 x 14 block island (6 x 6 m) draws 253,450 triangles in 19 meshes, with 77,064 collision cells. A flat slab of 3 block layers drawn with addMergedBlocks costs 319 to 353 triangles per 0.43 m column, which works out to about 200 million triangles for 907 x 691 columns. VoxelWorld stores every 10.75 cm cell in a JS Map and costs about 2.9 to 4.1 KB per block, so one ground layer of 907 x 691 blocks would need 40.1 million entries and about 1.84 GB. A single layer of 600 x 600 blocks (258 m square) already fails with 'RangeError: Map maximum size exceeded' (V8 caps a Map at 2^24 entries). Scripts: blocks-scale.mjs and real-island.mjs. The report's render test used plain boxes for the ground, not blocks.
   - Fix: Plan a new island-scale ground method as its own work item. Use a height grid in typed arrays for standing, walking and kart height (racing-core only needs heightAt). For drawing, use big merged flat faces (greedy meshing, https://0fps.net/2012/06/30/meshing-in-a-minecraft-game/), do the per-block colour variation in the shader, and keep the rounded-block mesher only for small features. Build it as a new path so the approved 14 x 14 island and checkpoints/island-1 stay unchanged (HOW-TO D2), and let the owner compare the looks. Owners: Claude for the solid ground (WORLD-RULES A1), Codex for looks (A2). This is needed whatever size is chosen, and its cost grows with area.

4. **The old-repo data point on triangle cost is wrong, so the size of the terrain risk is understated by about 100 times.**
   - Evidence: 3d-world-3 docs/DECISIONS.md, 13 Nov, seventh and tenth entries: the roughly 175,000-triangle rounded-block island was 64 x 76 blocks (about 29 x 34 m). The '160 metres across' island in the same file (around line 800) was a smooth, non-block floating island.
   - Fix: Correct the number. The rounded-block cost is roughly 175k triangles per 0.1 ha, not per 2 ha.

5. **The extra work of shared roads is not counted. S2b has 6 junctions (2 in each class's network). Each needs a merged road surface, gaps in the curbs, barriers that change with the chosen layout, and correct progress and wrong-way handling where the road forks. Only S1's 'no junctions' is mentioned as a plus.**
   - Evidence: In s2compact.mjs, the F1-Sprint cut joins at cutW and cutE, GT-Short joins at n2 and s2, and GK-Short joins at cN and cS. racing-core takes one centre line and one halfWidth per track (track/index.ts, TRACK_IDS fixed to 4).
   - Fix: List this work under Codex. Load only the active layout's centre line into racing-core and draw the whole network with layout barriers on top. To save time, the first version can skip the cut variants (see the reverse option).

6. **In the miniature, the F1 never reaches the approved 180 mph top speed of the Fast feel. That is a feel and identity point the owner should know about.**
   - Evidence: Robot driver on S2b: F1 peaks at 135 mph on the 280 to 290 m straights. Firing nitro once per lap gives 173 to 175 mph and saves only about 0.7 s a lap (boost.mjs). Working from the Fast profile's acceleration curve, reaching 180 mph from a corner exit at about 60 mph takes roughly 440 m, plus about 70 m to brake (my estimate from profiles.ts, not a simulation).
   - Fix: Ask the owner whether that is fine for the miniature (F1 is still clearly the fastest: 135 mph vs GT 95 and GoKart 61). If not, one longer F1 straight of about 500 m makes the island about 100 m longer.

7. **Building 6 tracks on 3 networks in one go is a big chunk for a one-person project.**
   - Evidence: S2b has 3 networks, 6 layouts and 6 junctions, and needs a new centre-line-to-track generator (racing-core TRACK_IDS is fixed).
   - Fix: Build in phases inside the reserved plan. Phase 1: hub, practice field and one track per class. Phase 2: the second track of each class, as the cut variant, or the same road driven in reverse if the owner accepts that as a stand-in.

8. **A few research numbers are wrong or weaker than stated.**
   - Evidence: Gran Turismo 7 launched with 97 layouts at 34 locations ('over 90 layouts' officially, Feb 2022 State of Play), not 63. The later count of about 118 includes reversed layouts. The Mario Kart 8 Deluxe 1:34.047 time is an undated leaderboard snapshot and may be out of date after the September 2026 speed update (GamesRadar). Skatepark size bands differ a lot between sources (Seattle treats 1,500 to 10,000 sq ft as a 'skatespot').
   - Fix: Correct GT7 to 97 at launch and about 118 including reverses. Mark the Mario Kart record as a dated snapshot. Cite one skatepark typology by name.

### Factual errors
1. 'Old 3d-world-3 island: 160 m across, ~175,000 triangles with rounded blocks' is wrong. The 175k triangles were for the 64 x 76-block (about 29 x 34 m) island (DECISIONS.md, 13 Nov, seventh and tenth entries). The 160 m island was smooth, not built from blocks.
2. 'Gran Turismo 7 turns ~34-39 venues into 63 (launch)...' is wrong. The official launch figure was 97 layouts at 34 locations ('over 90 layouts'). The later count of about 118 includes reversed layouts (screenrant / sportskeeda / gtplanet via search; techradar could not be opened from this session).
3. 'If phone tests show the narrower roads are too hard, widen them (about +5% area)' is wrong. Measured cost: +24% for 13/17/20 m roads and +56% for 16/22/26 m roads, even with targeted widening.
4. 'Empty grass is cheap' does not apply to the current block ground. The approved 6 x 6 m island alone is 253,450 triangles, and the block collision store cannot hold one ground layer bigger than about 510 x 510 blocks.
5. The '1:34.047' Mario Kart Stadium record is an undated leaderboard snapshot, and a September 2026 speed update may have changed the records (not confirmed either way).
**Retest:** All scripts are in (scratch folder, not saved) plan2/verify-island. They import the repo read-only, run on Node 22 with --experimental-strip-types, and wrote nothing to either repo.
(1) geom.mjs + check-s2b.mjs: my own fillet track builder and layout checker. On S2b it gives 0 problems and exactly the same track lengths (1154/882/803/534/539/459 m), but tight margins: 8.2 m between networks and 5.5 m to zones. S3 also passes (9.99 ha).
(2) widen-s2b.mjs: targeted road widening. Medium widths need 432x333 m (14.41 ha); game-wide widths need 481x375 m (18.06 ha). Uniform scaling gives 16.96 and 24.69 ha (S3: 13.68 and 19.30).
(3) drive.mjs + drive-s2b.mjs: racing-core's createKartController on my geometry. The robot reproduces the report's laps within 0.2 to 0.8 s. With a 0.15 s or 0.25 s delay, or button-only steering, the karts leave the narrow roads.
(4) drive-control.mjs: the same delayed drivers also leave the approved 26 m Original Circuit (robot lap 89.5 s vs Codex's course check of 92.3 s). Conclusion: no simulation here can judge road width, so it has to be tested on the phone.
(5) boost.mjs: F1 peaks at 135 mph without nitro and 173 to 175 mph with it; nitro saves about 0.7 s a lap.
(6) reverse.mjs: reversed layouts drive fine. On these placeholder rectangles the lap times are identical, so reversing only adds variety once real corners exist.
(7) blocks-scale.mjs + real-island.mjs: the approved 14x14 island is 253,450 triangles. Flat merged slabs cost about 320 to 350 triangles per column. VoxelWorld costs about 3 KB per block, and a 600x600 single layer throws 'Map maximum size exceeded'.
(8) facts.mjs + canyon-check.mjs: confirmed Original 3,680 m with a 669 x 496 m box, course check 92.275 s, and Canyon 502.7 m with an 84 x 90 m box and 8.6 m road.
Web checks: confirmed Bahrain (5.412 / 3.543 / 3.823 / 6.299 / about 2.55 km) and Silverstone National 2.639 km / International 2.979 km. The CIK-FIA 2025 table (1100/1000/800 m long, 8/7/6 m wide) was confirmed via search summary only; leisure-karting guidance is 7 m minimum for fast tracks and 5 m for others. The SuperTuxKart track guide gives road widths of about 8 to 18 units and no target lap time. Not tested: real iPhone GPU frame time, real human drivers, packs of 8 karts.
**Improved recommendation:** Keep the researcher's layout idea, which checks out. It is one island with the F1 circuit around the edge and the GT and GoKart circuits inside it. Each class has its own roads, and that class's two tracks share part of one road, like Silverstone's National and Grand Prix layouts. There are no bridges or tunnels. The practice fields, skate park, obstacle course and hub sit inside the loops.

Do not lock in 390 x 300 m, because that size only works with roads about half as wide as today's approved racing roads, with no room to spare. Plan the island at about 430 x 335 m (about 14 hectares, about 1,000 x 780 blocks). That fits medium-width roads (GoKart 13 m, GT 17 m, F1 20 m) in the same arrangement. If the owner later likes narrow roads, shrink toward 390 x 300 m. If he wants today's 26 m F1 road, plan about 480 x 375 m.

Do two things before building the island:
1. Codex lets the owner drive one short test loop at three road widths on his phone. Width is a feel choice, and no computer test can settle it.
2. Claude, for solid ground, and Codex, for looks, build a new big-island ground method: a height grid for standing and for kart height, plus big merged flat surfaces for drawing. Today's block code cannot hold even a 220 m square of ground. The approved small island stays exactly as it is.

Then build in phases:
- Phase 1: the hub, the practice field and one track per class.
- Phase 2: the second track per class, made as a shortcut version of the same circuit. If the owner accepts it, the same road driven in reverse can stand in at first.

Keep every corner position and road width as data, and check every change with the fast Node layout and lap checker before publishing.

Questions for the owner (taste):
- Road width, after the phone test.
- Whether a reversed track counts as a second track.
- Whether it is fine that the miniature F1 tops out around 135 mph (175 with nitro) instead of its 180 mph top speed.
- The researcher's question on whether GT and F1 may share road. Sharing gives a 370 x 270 m island but goes against KARTS.md A3.

### Missed options
1. Reverse direction as a class's second track. It costs almost nothing to build and needs no extra space. It is proven in games: Gran Turismo 7's 118 configurations count reversed layouts, and Mario Kart Tour has R (reverse) variants. Whether it counts as a 'different track' is the owner's choice.
2. Plan with spare room and adjustable road widths instead of packing tight, so a feel change does not force a new layout. About 14 ha covers medium widths.
3. A phone road-width feel test on one short loop before the island size is fixed.
4. Build the ground in a new way for the big island: a height grid for collision, merged flat faces with shader colour variation for drawing, and rounded blocks only on small features. Without this, no island bigger than about 20 m is practical.
5. Build in phases: one track per class first, with space reserved for the second.
6. GoKart circuits twisty like the old Canyon Switchbacks (502.7 m inside an 84 x 90 m box), which fits KARTS.md A3 ('smaller with sharper turns') and could free infield space.
7. One longer F1 straight (about 500 m) if the owner wants the F1 to reach its approved top speed in the miniature, at the cost of about 100 m more island length.
**Confidence:** medium

## Six tracks in the racing engine (Codex area): research
**Question:** What does the racing engine (racing-core) need so one island can hold 6 tracks (2 each for S Kart/GoKart, GT and F1) with 3 kart classes and real races? What can be reused, what is missing, what is the smallest set of changes, and what speed target fits each class on island-sized tracks?
**Summary:** The racing engine is much closer to island-ready than it looks. I built five new short tracks (436 to 1,206 m) from plain lists of points, and the existing driving, crash and lap-timing code drove every kart class around all of them. That was 70 of 70 test laps with zero falls, all without changing a single repo file. The only real block is that the track code looks up tracks by name from a fixed list of four. I wrote a 56-line fix in a copy of the code; all 80 existing track, contact and course checks still pass, and the four old tracks come out byte-for-byte identical. The old race prototype (countdown, ordered checkpoints, laps, wrong-way, standings, respawn, ghosts) also works on new tracks. With a small adapter it ran full 5-kart, 3-lap races on the new engine with the class karts and the approved Fast kart: 8 of 8 races finished and 8 of 8 ghosts saved and validated. No driving feel needs to change. On island tracks the karts rarely reach top speed, so the right lever is track size per class, not retuning. I recommend S Kart tracks of 500-650 m, GT 850-1,000 m and F1 1,100-1,400 m. With the existing profiles those all give laps of about 30-45 s, so a 3-lap race takes about 2 minutes, close to a Mario Kart 3-lap time. The main new work is: a track-authoring tool with automatic design checks, island ground and grass next to the road, rail options, a race coordinator on the new engine, computer drivers that understand the new handling, and keeping 8 karts at 120 Hz cheap enough for a phone.

### Options

1. **Track authoring A: control points + centripetal Catmull-Rom curve (LetsGo's own method)**
   - How it works: You list about 15-20 points around the loop. A smooth curve passes through them and is sampled every 2 m into the same blueprint format the four existing tracks use (position, sideways direction, distance), plus 13 evenly spaced checkpoint gates.
   - Pros: Same data format and same three.js call (CatmullRomCurve3 'centripetal', closed) as the original LetsGo tracks, so the checked track code, renderer and lap clock use it unchanged. Few numbers to edit, which suits an owner who will change things often. The centripetal type is mathematically proven to avoid cusps and loops within a segment.
   - Cons: It does not control the tightest corner. My first S Kart draft accidentally had a 4.98 m radius, so it needs an automatic validator (built and tested). Total length changes when you move points.
   - Evidence: Original builder: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-racing/src/track-builder.js (THREE.CatmullRomCurve3(points,true,'centripetal')). Blueprint fields used: /home/user/3D-World-4/racing-core/track/index.ts createTrack. Yuksel/Schaefer/Keyser: centripetal is the only uniform-to-chordal choice with no cusps or self-intersections within segments (https://cemyuksel.com/research/catmullrom_param/ , https://people.engr.tamu.edu/schaefer/research/catmull_rom.pdf; from abstract and slides, full paper not opened). Tool: (scratch folder, not saved) plan2/racing/author.mjs
   - Test result: Built kart-a (604.5 m, 8.6 m road), gt-a (920.8 m, 12 m) and f1-a (1,206 m, 14 m). Validator results: min radius 7.44 / 9.21 / 13.66 m, no inner-edge fold, no overlap; bounding boxes 136x206, 216x312 and 315x427 m. All drive and race correctly (see lap matrix).

2. **Track authoring B: pieces (straights + constant-radius arcs), as in the old Canyon Switchbacks**
   - How it works: Turtle-style list such as ['S',80],['R',14,90],['R',12,180]..., where each piece continues from the last one.
   - Pros: Exact corner radii and lengths, and it can be easy to read ('a 12 m hairpin'). The old repo's Canyon Switchbacks (503 m, 8.6 m road, ten 9 m hairpins) packs tightly into 93x99 m.
   - Cons: Closing the loop by hand is fiddly and needs a closure solver or checker. Steering input jumps where a straight meets an arc; road engineers fix this with clothoid transitions, which add maths (Fresnel integrals).
   - Evidence: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-garden/src/canyon-layout.js; clothoids are standard road transition curves with curvature changing linearly with distance (https://www.wikipedia.org/wiki/Transition_curve , search summary only).
   - Test result: kart-pieces loop: 435.9 m, closure gap 1.1e-14 m, min radius 11.99 m, all classes lap cleanly. The old Canyon route converted unchanged to a blueprint: 502.7 m, min radius 8.98 m, closest non-adjacent road 18 m; all classes lap with zero falls.

3. **Track authoring C: procedural generation (random points, convex hull, displaced midpoints, spline)**
   - How it works: An algorithm generates track shapes automatically; a person picks the good ones.
   - Pros: Very fast variety; no self-crossing by construction (convex hull).
   - Cons: Shapes are not designed: corner rhythm, overtaking spots and island fit are random, so they still need hand editing and the same validator. Not worth it for only 6 tracks.
   - Evidence: Gustavo Maciel 2013, 'Generating procedural racetracks' (https://gamedeveloper.com/programming/generating-procedural-racetracks; search snippet only, host blocked for fetch). GDC 2019 'Procedural Race Tracks for Mobile Games' (https://vimeo.com/325761499, description only).
   - Test result: not tested: low value for 6 hand-designed tracks.

4. **Track authoring D: visual editor (paint/drag the road), like ModNation Racers or a Trackmania-style block editor**
   - How it works: An in-game editor where you draw the road (ModNation) or snap grid pieces (Trackmania).
   - Pros: Best for an owner who changes things often. ModNation's editor let players paint a circuit very quickly.
   - Cons: Biggest build cost. Grid pieces on 0.43 m blocks would stair-step a racing surface (WORLD-RULES F3 allows smooth surfaces for roads anyway).
   - Evidence: ModNation talk 'User generated terrain in ModNation Racers' (https://history.siggraph.org/learning/user-generated-terrain-in-modnation-racers-by-grieve-hanson-zhang-granito-and-snyder); PlayStation blog walkthrough (https://blog.playstation.com/2009/12/23/modnation-racers-track-studio-walkthrough-with-track-designer-mark-riddell/comment-page-2); Trackmania editor wiki (https://wiki.trackmania.io/content-creation/map-editor). All from search summaries.
   - Test result: not tested. Recommended later as a small Test Lab page: drag option A's points, see validator results, press Drive.

5. **New-track API: zero-change injection vs a proper createTrackFromBlueprint**
   - How it works: Injection: push blueprints into the same JSON object that track/index.ts reads before it loads. createTrack(id) has no runtime check against TRACK_IDS; that list only limits the TypeScript type. Proper fix: split createTrack into a lookup plus createTrackFromBlueprint(blueprint), with a TrackBlueprint type and basic validation.
   - Pros: Injection proves the runtime, renderer-free driving stack, lap clock and contacts accept new data with no code change. The proper fix is small and keeps the four reference tracks identical.
   - Cons: Injection is a test trick only. The proper fix still needs a place for island track data (for example racing-core/track/island/*.json) and a widened track-id type in testing/drive.ts and racing-lab pickers.
   - Evidence: Patch: (scratch folder, not saved) plan2/racing/track-patch.diff (56 lines). Patched copy: (scratch folder, not saved) plan2/racing/copy/racing-core/track/index.ts. Injection: .../plan2/racing/inject.mjs
   - Test result: Patched copy: strict tsc passes, and node --test track/check + contacts/check + kart/course-check gives 80 pass / 0 fail. Geometry hashes of all 5 new tracks are identical between injection and patch. All 4 built-in tracks are byte-identical before and after. A bad blueprint is rejected, as is accessBridge on a track without one.

6. **Race rules: reuse the old prototype's progress.js/ghosts.js via an adapter on the new engine**
   - How it works: A roughly 25-line view gives the new track the old interface (at, project, gates). The old ordered-gate lap counter, wrong-way flag, branch-skip and teleport guard, standings and respawn-to-last-gate then run on new kart states. Ghost recorder, validator and store work unchanged.
   - Pros: About 250 lines of already-tested logic reused. Matches the approved card: checkpoints, wrong-way, lap times, respawn at last checkpoint, 3 laps.
   - Cons: Hard-coded old constants: VEHICLE.boostSpeed (180 mph) is the 'impossible movement' and ghost-teleport limit, but Fast boosts to 220 mph. It must use the kart profile. The new project() returns null off the road, so grass runoff (approved card 1.3) needs a padded projection. Missing: start lights, finish timer after the winner, a ghost key tied to track content so edited tracks don't keep stale ghosts, and nitro charges (not approved yet).
   - Evidence: /home/user/3D-World-4/racing-core/progress.js, ghosts.js, session.js; adapter: (scratch folder, not saved) plan2/racing/race-adapter.mjs; results: .../race-adapter.json. Common industry pattern (ordered checkpoints, sort by checkpoint count then distance, respawn with stored direction) from community sources: https://discussions.unity.com/t/logic-of-calculating-player-positions-in-a-race/389359 , https://unitycoder.com/blog/2018/01/31/checking-last-known-good-position-for-a-car-in-the-track
   - Test result: 8 of 8 five-kart, 3-lap races finished on new tracks using new handling and contacts (gokart-prototype on canyon/kart-a/kart-pieces, gt3-v3 on gt-a, f1-2026 on f1-a, Fast on kart-a/gt-a/f1-a). 0 respawns, 0 wrong-way ticks, kart bumping present. 8 of 8 time-trial ghosts saved, validated, reloaded and sampled. Rule probes: a reversed crossing counts no lap and sets wrongWay; a teleport is invalidated; a respawn keeps expectedGate=5 and laps=1, lands 2.99 m from the gate, grounded, and voids the record. As-is old prototype (old 120 mph physics) also finished 5-kart races and ghosts on all 5 new tracks, 0 respawns.

7. **Computer opponents A: path following + precomputed speed plan (recommended first)**
   - How it works: Pure-pursuit steering toward a point ahead on a lane line, converted to the tuned handling's steering limit. Target speed comes from a per-track table computed once from curvature, class cornering grip and braking. The old driver.js traffic and lane-change and stuck-reverse logic is kept. Difficulty = grip/pace fraction (easy/medium/hard lobby setting).
   - Pros: Uses the same inputs and physics as the player (racing-core PLAN section 5 rule). Cheap at runtime. Proven: pure pursuit is a standard path tracker.
   - Cons: Centreline/lane AI is slower and less natural than a true racing line. Old driver.js as-is uses the OLD vehicle's steering sign and limits, so steering and speed must be rewritten for tuned profiles (done in the adapter).
   - Evidence: Coulter, 'Implementation of the Pure Pursuit Path Tracking Algorithm', CMU-RI-TR-92-01 (https://www.ri.cmu.edu/publications/implementation-of-the-pure-pursuit-path-tracking-algorithm/). Old repo AI used a recorded reference line (offset+speed): /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-racing/src/npc/driver.js
   - Test result: Races above used this AI. Cost with live look-ahead: 547-798 µs per tick for 5 karts in Node. With the precomputed speed table: 18-27 µs per tick for 8 karts in Node, about 97-124 µs at 4x CPU throttle in Chromium. The table takes 1.3-18 ms to build per track.

8. **Computer opponents B: precomputed racing line (minimum-curvature) or recorded owner laps**
   - How it works: At tool time, compute a line that uses the full road width (minimum curvature), or record the owner's best ghost lap as the reference line (what old LetsGo did with offset+speed samples).
   - Pros: Faster, more natural AI. The minimum-curvature line is close to the minimum-time line in corners. Recording the owner's laps reuses the ghost recorder.
   - Cons: Extra tool. TUMFTM's reference code is Python under LGPL-3.0, so port the idea rather than copy the code.
   - Evidence: TUMFTM global_racetrajectory_optimization; Heilmeier et al., Vehicle System Dynamics, DOI 10.1080/00423114.2019.1631455 (https://github.com/TUMFTM/laptime-simulation and search summary).
   - Test result: not tested (the scripted test driver follows the centreline, so measured lap times are conservative).

9. **Catch-up ('rubber banding') for opponents**
   - How it works: AI speeds up when far behind and eases off when far ahead, to keep the pack near the player.
   - Pros: Keeps races tense. Used widely (Mario Kart; Black Rock's Pure team found that without it the player spent too much time racing alone).
   - Cons: Often criticised as cheating when visible. Should be capped and gentle, or limited by difficulty.
   - Evidence: Search summaries only (fetch blocked): https://gamedeveloper.com/design/rubber-banding-as-a-design-requirement , https://gamedeveloper.com/design/the-pure-advantage-advanced-racing-game-ai , https://giantbomb.com/wiki/Concepts/Rubber_Band_AI (cites US Patent 7278913; patent text not read).
   - Test result: not tested. Whether to use it is a taste question for the owner.

10. **Per-class speed for compact tracks: size tracks per class, keep all handling profiles unchanged (recommended)**
   - How it works: Do not retune. Give each class tracks whose straights let it reach a satisfying share of its top speed and whose laps take about 30-45 s.
   - Pros: Respects the frozen approved Fast feel and all 10 profiles. Measured: top speed is rarely the limit on island tracks; corners are.
   - Cons: On tight tracks the classes separate less than on big ones: F1-2026 vs GT3-V3 on kart-a is 27.9 s vs 28.7 s. Class identity on the island must come from track design (width, radius, straight length) as much as speed.
   - Evidence: Lap matrix (scratch folder, not saved) plan2/racing/lap-matrix.json; straight-line test .../straight.mjs.
   - Test result: 70 runs (5 tracks x 7 kart setups x 2 driver skills): every lap completed, 0 airborne ticks, 0 off-road ticks; only gokart 'skilled' on canyon touched a rail (3 contact ticks). Lap times are identical to full precision at 30/60/120/144 fps (gokart kart-a 34.2708 s; Fast f1-a 25.8422 s).

11. **Per-class speed alternatives: speed caps per track, dynamic camera FOV, near-road detail, motion blur**
   - How it works: Cap top speed on small tracks; widen the FOV with speed; add close-by posts and stripes (edge rate); blur.
   - Pros: Wider FOV measurably raises perceived speed. Edge rate (nearby texture passing by) was the strongest cue in Larish and Flach.
   - Cons: Speed caps are pointless because caps are rarely reached. FOV changes touch the approved camera and need the owner's OK and a phone test. Motion blur did not improve player experience in a Split/Second study and costs GPU on phones.
   - Evidence: FOV and camera altitude study: https://rd.springer.com/chapter/10.1007/978-3-319-55834-9_14 ; Disney Research motion blur: https://studios.disneyresearch.com/2013/11/06/simulated-motion-blur-does-not-improve-player-experience-in-racing-game/ ; Larish & Flach 1990: https://corescholar.libraries.wright.edu/psychology/367 ; Hargreaves on velocity-linked FOV: https://www.shawnhargreaves.com/blog/speed-is-a-matter-of-perspective.html (all from search summaries).
   - Test result: not tested (needs a rendered phone view; the SwiftShader browser here cannot judge feel).

### Tests run

1. **Build new closed tracks from arbitrary centre points using racing-core's own track code**
   - How: author.mjs (Catmull-Rom + pieces) produces blueprints; inject.mjs appends them to the JSON object track/index.ts reads, then createTrack(id), createDrivingTest and contacts run unchanged. Also a patched copy with createTrackFromBlueprint.
   - Result: 5 tracks built: canyon 502.7 m, kart-a 604.5 m, kart-pieces 435.9 m, gt-a 920.8 m, f1-a 1,206 m; 13 gates each; rails generated automatically. Injection and patch give identical geometry hashes. Patched copy: 80/80 existing checks pass and the 4 built-in tracks are identical.
   - Limits: Flat or simple-height test layouts, not final island designs; no island ground or scenery.

2. **Lap-time matrix: 5 new tracks x 7 kart setups x 2 driver skills**
   - How: laps.mjs: real createKartController with class geometry, contact resolver with class footprint, prototype lap clock (gate crossings); scripted pure-pursuit driver on the centreline, using 50% ('careful', same as racing-core's course-check fixture) or 80% ('skilled') of cornering grip.
   - Result: Flying laps, careful to skilled (s). Canyon: Fast 33.0/27.7, gokart 51.7/46.0, gt3-v3 44.7/38.3, f1-2026 44.4/38.5. kart-a: Fast 25.1/19.8, gokart 40.0/34.3, gt3-v3 34.8/28.7, f1-2026 34.2/27.9. kart-pieces: Fast 21.5/17.8, gokart 31.4/28.8. gt-a: Fast 29.9/22.9, gokart 49.2/42.7, gt3-v3 42.0/34.8, f1-2026 40.0/32.6. f1-a: Fast 33.4/25.8, gokart 55.7/49.7, gt3-v3 46.5/39.2, f1-2026 43.1/35.4. Top speeds actually reached: canyon 48-65 mph for all; Fast up to 116 (kart-a), 149 (gt-a), 161 (f1-a); f1-2026 up to 144; gt3-v3 up to 114; gokart 67. Braking makes up 17-54% of a lap.
   - Limits: Scripted centreline driver, not a racing line or a human; times are relative. Old 'original' legacy profile not included (different steering model).

3. **Straight-line distance each class needs to reach its top speed**
   - How: straight.mjs: flat world, full throttle from 30 and 50 mph; full brake from 98% top speed to 30 mph.
   - Result: From 30 mph, metres to 80/90/98% of top speed: Fast/F1 early 236/344/440 m (180 mph); gokart 44/69/102 m (68 mph); gt-prototype 142/210/281 m (120 mph); gt3-v3 609/1,073/1,858 m (178 mph); f1-2026 298/466/852 m (210 mph). Braking top to 30 mph: Fast 127 m, gokart 41 m, gt-proto 94 m, gt3-v3 168 m, f1-2026 172 m.
   - Limits: No boost, flat road.

4. **Old prototype as-is (old physics) on new tracks**
   - How: old-asis.mjs appends old-format tracks to racing-core/tracks/reference.json's object before index.js loads; createRaceSession with 5 karts and 3 laps, plus a time-trial ghost.
   - Result: All 5 tracks: races finished, 0 respawns, 0 invalid. Ghosts saved, valid and reloaded (e.g. kart-a race 103.7 s winner, ghost 35.15 s).
   - Limits: Uses the superseded 120 mph vehicle, not approved handling.

5. **Old race logic on the new engine (adapter)**
   - How: race-adapter.mjs: old progress.js and ghosts.js plus a new-track view; new kart handling; simultaneous contacts with per-kart geometry/footprint; profile-aware AI.
   - Result: 8/8 five-kart 3-lap races finished, 0 respawns, 0 wrong-way. Ghosts 8/8 valid. Rule probes pass (wrong-way, teleport rejection, respawn keeps gate and laps).
   - Limits: Player was also AI-driven; no device input; no start lights or finish timer; rails on both sides (no grass runoff).

6. **CPU cost of 8 karts at 120 Hz on island tracks**
   - How: bench-core.mjs (patched copy, precomputed AI speed plan, real contacts), 20 s of race time. Node, and Chromium via Playwright with CDP Emulation.setCPUThrottlingRate 1 and 4.
   - Result: Node: physics 207-496 µs per tick plus AI 18-27 µs, i.e. 2.7-6.2% of one core. Chromium 1x: 3.4-5.7%. Chromium 4x throttle: physics 1,180-2,106 µs per tick plus AI 97-124 µs, i.e. 155-266 ms per game second = 15.5-26.6% of one core (worst: Fast or F1 karts bunched with many contacts).
   - Limits: 4x throttle is only a rough phone stand-in; not measured on a real iPhone. CPU only; rendering not included (SwiftShader GPU numbers are meaningless).

7. **Frame-rate independence on new tracks**
   - How: fps.mjs: same scripted driver at 30/60/120/144 display fps.
   - Result: Best lap identical to full precision at all four rates (gokart kart-a 34.27081794990386 s; Fast f1-a 25.84220437194414 s). Tick counts differ by 1-2 only because the test stopped at a frame boundary.
   - Limits: Two track/kart pairs only.

### Recommendation
**Choice:** Keep every handling profile, the approved Fast feel and the 4 reference tracks unchanged, and build island racing on the existing engine with these changes, in order. (1) Add createTrackFromBlueprint plus a track-content fingerprint (patch already tested). (2) Add a tool-time authoring script: control points into a centripetal Catmull-Rom blueprint, with an optional pieces mode for exact hairpins and an automatic validator for minimum radius, overlap, width and footprint. Save island tracks as JSON. (3) Add an island world adapter: road plus island ground, heightAt/surfaceAt so grass is slower (the kart code already supports surfaceAt), and per-track rail options (both sides / outer only / none), because grass cutting is approved. (4) Give stepContactKarts per-kart geometry and footprint. (5) Port progress.js and ghosts.js onto the new track API: profile-based speed limits instead of the 180 mph constant, an off-road-tolerant projection, start lights, a finish timer, and a ghost key tied to the track fingerprint. (6) Build AI = old driver traffic logic + tuned-profile steering + a precomputed speed table, with difficulty set by grip/pace; add a racing line later. (7) Small racing-lab fixes: track picker from the island list, start line using the track width instead of 26 hard-coded squares, and removing the 'original' special case. Per-class island targets: S Kart 500-650 m tracks, 8.6 m road (20 blocks), radius at least 9 m, longest straight 80-120 m, laps 30-40 s, about 65 mph reached. GT 850-1,000 m, 12 m road, radius at least 12 m, straight about 200 m, laps 35-42 s, about 100-115 mph. F1 1,100-1,400 m, 14 m road, radius at least 15 m, straight 250-350 m, laps 35-45 s, about 140-160 mph. A first S Kart track can be the old Canyon Switchbacks layout, if the owner approves porting it.
**Why:** Tests show the engine already drives, collides, times laps and runs full races on new short tracks with every class. The only hard block is a name lookup, fixable in 56 lines with zero regressions. Top speed is rarely reached on island tracks (Fast peaked at 116-161 mph out of 180), so changing feel would not help, while track size per class controls lap time and speed directly. Equal 30-45 s laps give about 2-minute 3-lap races, close to Mario Kart 8 Deluxe's 150cc staff ghost on Mario Kart Stadium (1:53.191 for 3 laps, about 38 s per lap). Reusing the old race logic saves an estimated rebuild of about 250 lines of tested code.
**Confidence:** medium
**What would change it:** The owner driving the Fast kart or class karts on a test island track and finding it too twitchy or brake-heavy (Fast spends 39-43% of kart-a braking). A real-iPhone measurement showing 8 karts at 120 Hz is too heavy (4x-throttled Chromium showed 15-27% of a core). A decision that the approved Fast kart must race on S Kart tracks (laps 18-25 s, much faster than the GoKart class). Codex, who owns racing, preferring to rebuild race rules rather than port progress.js.
**Conflicts with confirmed decisions:** No handling, camera, frozen checkpoint or reference-track change is proposed. Three things need explicit owner or Codex go-ahead. (a) racing-core/PLAN.md section 1 decision 7 says new island layouts are not authorized by the six-island image; the owner's 23 Nov direction to build 6 island tracks is the needed authorization, but Codex should record it. (b) PLAN.md sections 4 (race rules) and 5 (opponents) each 'require go'. (c) Using the Canyon Switchbacks layout means porting from 3D-WORLD-3, which is reference only (CLAUDE.md rule 9) and needs approval. Also, current tracks have rails on both sides, while approved MINIGAMES card 1.3 allows slow grass cutting, so island tracks need a rail option rather than the reference-track rails.

### Key numbers
1. Existing tracks: 4 fixed IDs, 3.68-6.64 km, 26 m road, 28.2 m total width (racing-core/track/README.md, COURSE-CHECKS.json)
2. Test tracks built: canyon 502.7 m / 8.6 m road / min radius 8.98 m / 93x99 m box; kart-a 604.5 m / 8.6 m / 7.44 m / 136x206 m; kart-pieces 435.9 m / 8.6 m / 11.99 m / 88x147 m; gt-a 920.8 m / 12 m / 9.21 m / 216x312 m; f1-a 1,206 m / 14 m / 13.66 m / 315x427 m (scratch bp-*.authoring.json)
3. First Catmull-Rom S Kart draft had a 4.98 m minimum radius before the validator caught it (validate-run.mjs output)
4. Track API patch: 56-line diff; 80/80 track+contacts+course checks pass; 4 built-ins byte-identical (track-patch.diff, patch-equivalence.mjs)
5. Lap matrix: 70/70 runs completed laps, 0 airborne ticks, 0 off-road ticks (lap-matrix.json)
6. Skilled flying laps: gokart 28.8-49.7 s, gt3-v3 28.7-39.2 s, f1-2026 23.7-38.5 s, approved Fast 17.8-27.7 s across 436-1,206 m tracks (lap-matrix.json)
7. Highest speeds reached on island tracks: Fast 161 mph (f1-a), f1-2026 144, gt3-v3 114, gokart 67; on Canyon all classes 48-65 mph (lap-matrix.json)
8. Straight needed from 30 mph to 98% of top speed: Fast 440 m, gokart 102 m, gt-prototype 281 m, f1-2026 852 m, gt3-v3 1,858 m (straight.mjs)
9. Old race logic on new engine: 8/8 five-kart 3-lap races finished, 8/8 ghosts valid, 0 respawns (race-adapter.json)
10. 8 karts at 120 Hz, 4x CPU throttle Chromium: 155-266 ms per game second = 15.5-26.6% of one core; AI with precomputed speed table 97-124 µs per tick (bench-browser.json)
11. Mario Kart 8 Deluxe Mario Kart Stadium 150cc staff ghost 1:53.191 for 3 laps, about 37.7 s per lap (https://www.mariowiki.com/Mario_Kart_Stadium, via search summary)
12. FIA karting circuits (2025 criteria): minimum length 800-1,100 m, minimum width 6-8 m, longest straight 150-200 m by grade (https://www.fiakarting.com/sites/default/files/2025-11/Appendix%2013%20-%20Licence%20Criteria.pdf, from search summary; fetch blocked)
13. Rough island footprint estimate for 6 compact tracks: about 0.2-0.3 km² before skate park and practice field (my estimate from measured footprints, not a tested layout)

### Time savers
1. No retuning: all existing profiles (gokart-prototype, gt3/gt3-v3, f1-2026, approved Fast) already give 30-45 s laps when tracks are sized per class.
2. Reuse old progress.js and ghosts.js through an adapter of about 25 lines (tested 8/8 races) instead of rebuilding race rules from scratch.
3. Keep the existing blueprint format, so the checked track code, lap clock, contacts and checked-track-view renderer work on island tracks immediately.
4. The Canyon Switchbacks layout from 3D-WORLD-3 already works as an S Kart track (with porting approval): one of six tracks nearly free.
5. Precompute AI speed tables per track at tool time; this cut AI cost from about 550-800 µs per tick (5 karts) to about 20-27 µs per tick (8 karts).
6. Add island race checks as fast Node tests (each full race took 6-12 s of CPU) rather than more browser suites, since browser racing suites already take about 290 of 308 s of each publish.
7. Save space by nesting S Kart tracks inside F1 infields and using overpasses (racing-core already supports stacked road decks), instead of junction-based shared layouts, which would need new barrier and junction code.
8. A track-content fingerprint on ghosts and records stops stale times when the owner edits tracks, which avoids manual cleanup.

### Risks
1. The approved Fast feel on small tracks is brake-heavy (39-43% of kart-a laps braking, 18-25 s laps); only the owner driving it can judge it.
2. Classes separate less on tight tracks (F1-2026 vs GT3-V3 within about 3-10% lap time); class identity must come from track width, radius and straight length.
3. CPU: 8 karts at 120 Hz cost 15-27% of one core at 4x throttle; heightAt/orientation probes and contact solving dominate. Needs a real-iPhone check; mitigations include optimizing probes and giving far-away AI karts cheaper updates.
4. Narrow 8.6 m roads with original-size footprints mean many bumps (1,417 contact ticks in one 5-kart canyon race) and grid lanes near the curbs.
5. Off-road is currently a fall (no ground), and project() returns null off the road; grass runoff needs world ground plus an off-road-tolerant projection.
6. Hard-coded 180 mph limits in old progress/ghost checks would wrongly invalidate legitimate 220 mph Fast boost laps on long straights.
7. stepContactKarts ignores per-kart geometry and footprint today; mixed or prototype classes in multi-kart races would use the wrong wheelbase and collision shape until fixed.
8. Some sources come from search summaries only: fiakarting.com and gamedeveloper.com could not be fetched from this session (not allowed by the network settings); Mario Kart, FIA and rubber-banding facts are not verified from primary pages.
9. Measured lap times come from a scripted centreline driver; real players and racing-line AI will be faster.
10. Browser numbers use SwiftShader; only CPU numbers are meaningful, and frame-time and rendering cost are untested.

### Owner taste questions
1. Which class should the approved Fast test kart race in on the island? (a) F1 class (closest speeds, 180/220 mph), (b) its own 'open' class with its own events, (c) not raced, kept as the free-roam and test kart. On S Kart tracks it would lap about 18-25 s, against 29-50 s for the GoKart class.
2. Should computer opponents use gentle catch-up (slightly faster when far behind, slightly slower when far ahead)? (a) yes, on all difficulties, (b) only on easy/medium, (c) never, so races are decided purely by speed and skill.
3. Is a race length of about 2 minutes (3 laps of 30-45 s) right for every class? (a) yes, (b) shorter, about 1.5 minutes (smaller tracks, more island space left), (c) longer, about 3 minutes (bigger F1/GT tracks, bigger island).

## Six tracks in the racing engine (Codex area): skeptic
**Holds up:** True
**Confidence:** medium

### Problems

1. **The track patch is not regression-free. It changes the track's id from one of four fixed names to any text. That breaks the strict type check of testing/drive.ts, which tells the Neighborhood world apart from a track by its id. One existing check now fails: 'Driving test rules compile as strict ES2022 without a browser'. The researcher only ran the track, contacts and course suites.**
   - Evidence: My copy, unpatched: tsc -p racing-core/testing/tsconfig.json is clean, and testing/check.test.mjs + prototypes passes 15/15 once three, racing-lab and kart-parts are provided. My copy with the researcher's track-patch.diff applied: 3 TS errors at drive.ts lines 92, 99 and 102, and testing/check.test.mjs passes 14/15. The 80 track+contacts+course checks do pass 80/80 in both copies. The tuning, prototype and gt3-v3 suites pass 47/47 in both.
   - Fix: Keep the patch, but narrow the Neighborhood case in drive.ts by selection rather than track.id (or keep a literal id type for the four reference tracks). Then run ALL racing-core suites plus the four tsc projects (track, contacts, kart, testing) before calling it regression-free.

2. **Porting the old progress.js/ghosts.js conflicts with the racing owner's recorded architecture, and the report did not flag it. Codex's docs call the top-level prototype superseded and 'not dependencies of this rebuild'. They say its race/NPC/ghost checks 'do not establish those features in the fresh rebuild'. track/index.ts opens with 'No imports from the retired racing implementation'.**
   - Evidence: /home/user/3D-World-4/racing-core/README.md line 1; PLAN.md line 26; track/index.ts line 1; kart/README.md line 3.
   - Fix: Use progress.js/ghosts.js as the written spec and as a test oracle. Re-implement the rules as a fresh strict-TS race module, which is PLAN section 4. The rules are small, so this costs little and keeps Codex's layering. Let Codex decide.

3. **The reuse saving is overstated. Only progress.js (56 lines) and ghosts.js (83 lines), 139 lines in all, ran unchanged. session.js (70) and driver.js (45) were effectively rewritten inside the adapter. The adapter is 159 lines, not about 25. The ~25-line figure covers only the old-style track view.**
   - Evidence: (scratch folder, not saved) plan2/racing/race-adapter.mjs: oldView ~14 lines, readAi ~28 (new steering and speed), stepKarts ~11, createIslandRace ~41 (replaces session.js).
   - Fix: Describe the saving as reusing tested rule DESIGN (ordered gates, wrong-way, branch-skip, standings, respawn-to-last-gate, ghost validation), not about 250 lines of code.

4. **'Real races' leaves out approved parts of the racing card. Card 1 says: up to 8 karts, start lights red-red-red-green, and mystery boxes (boost, shield, torpedo, rock, banana, last-place shock). Card 2 is the time trial with a ghost. The report mentions start lights but never mentions items. Also, the engine grants unlimited boosts: my scripted driver fired boost 16 times in one 1 km lap. A race without a boost limit lets players just spam boost.**
   - Evidence: /home/user/3D-World-4/docs/MINIGAMES.md lines 44-62. Boost is a rising-edge 2 s grant with no charge count (racing-core/kart/index.ts lines 173-181). Boost test: sk-g1 Fast, boostPresses 16.
   - Fix: Put this in the plan explicitly. First playable = clean races with a boost limit (fixed charges or none), start lights and 3 laps. Mystery boxes come next, which matches the card's own 'after the avatar visuals' timing. Whether the miniature needs items at first is a purpose question for the owner.

5. **The report missed two proven ways to get 6 tracks with less work and less island: reverse-direction layouts, and several layouts on one venue sharing road. Six separate class-sized tracks fill boxes totalling about 0.46 km² before nesting. Walking speed is 3.1 m/s.**
   - Evidence: Sum of the researcher's own boxes: 2x(136x206 + 216x312 + 315x427) = 459,826 m². Precedents: Mario Kart Tour R (reverse) variants; GT7 reverse layouts and Sainte-Croix layouts A/B/C (search summaries); Bahrain International Circuit's six layouts on one site (https://www.ferrari.com/en-EN/hypercar/bahrain, search summary). My test: reversed kart and GT layouts drive with laps within 1% of forward, with 0 rail contacts, 0 falls and 0 lost-projection ticks. Each race loads only one Track object, so overlapping layouts need no junction physics, only per-track rail options (already in the plan) and merged visuals.
   - Fix: Offer the owner three choices: (a) 6 separate layouts; (b) 3 layouts x forward/reverse, which halves authoring and area; (c) one venue per class with a long and a short layout on shared road. Whether a reversed layout 'counts' as a second track is a taste question for the owner.

6. **The 'island world adapter' is presented as new work, but a working template already exists in racing-core. testing/neighborhood.ts has flat ground, road, and a slower grass surface (grip .78, speed .9, resistance 1.5) that the kart code already reads through surfaceAt.**
   - Evidence: /home/user/3D-World-4/racing-core/testing/neighborhood.ts lines 31-49; kart/dynamics.ts lines 32-50. My test (grass-test.mjs): K1 track + flat ground + neighborhood grass, NO rails. The GoKart lapped with 0 falls, and the kart left the road and drove on grass. A naive corner-cutting driver was slower (37.6 and 43.7 s vs 28.6 s), but that does not prove shortcuts are impossible.
   - Fix: Build the island race world by copying the neighborhood pattern: road heightAt from the track, otherwise island ground; surfaceAt is pavement on road and grass elsewhere. Add a shortcut check to the authoring validator, such as 'infield crossings shorter than the road distance by more than X m'.

7. **The per-class size targets are not backed by tracks that meet them. The researcher's own test tracks broke their own minimum-radius rules.**
   - Evidence: kart-a 7.44 m (rule: at least 9), gt-a 9.21 m (rule: at least 12), f1-a 13.66 m (rule: at least 15). In my tests, F1-2026 lapped a 1,024 m, 12 m-wide GT-sized track in 32.4-38.8 s, so F1 laps of 30-45 s are already reached near 1,000-1,250 m, below the proposed 1,100-1,400 m.
   - Fix: Set targets by lap time, not metres. Have the authoring tool run the scripted driver for each class (6-12 s of CPU per track) and print predicted lap time, top speed reached and braking share next to the radius and overlap checks. Starting ranges: S Kart about 500-600 m, GT about 850-1,000 m, F1 about 1,000-1,250 m. Then scale them to the owner's race-length choice.

8. **Too much in the first step for a one-person project. Two authoring modes, ghosts with track fingerprints, rail options and a racing line are all in the core list before any single race is playable.**
   - Evidence: Recommendation steps 1-7 (pieces mode, fingerprinted ghosts, AI, picker fixes) carry no slice or milestone.
   - Fix: Build one complete race on one track first (vertical slice), then add the other five tracks, then ghosts, items and difficulty. Use one authoring method (control points + centripetal curve + validator). Keep pieces only as a converter if the owner approves porting Canyon Switchbacks.

9. **Approval gates are under-reported. PLAN.md marks sections 6 (ghosts and time trials), 7 (shared device controls) and 8 (playable racing build outside the Test Lab) as 'Not started; requires go', besides 4 and 5. The ghost port and an island race page fall under 6 and 8.**
   - Evidence: /home/user/3D-World-4/racing-core/PLAN.md lines 79-83.
   - Fix: List all five gates (4-8) in the conflicts section so Codex and the owner can grant them together.

10. **The risk from the 180 mph limit in old progress/ghost checks is real but small on the island. The check trips only above 212 mph per tick (180 mph x dt + 0.12 m). With boost spam, the approved Fast kart peaked at 180 mph on a 1,024 m track.**
   - Evidence: boost-test.mjs: old per-tick limit 0.7906 m = 212.2 mph. Fast with boost: 119 mph (499 m), 128 mph (670 m), 180 mph (1,024 m).
   - Fix: Still use profile.boostSpeed in the fresh module, but rank this as a low-priority detail.

11. **The claim that projection returns null off the road is correct, and I confirmed it. The fix is smaller than it sounds: the shared spatialIndex helper already takes a padding argument.**
   - Evidence: proj-scan.mjs: points 2 m beyond the road edge get no answer 0.3% (kart) and 4.2% (GT) of the time; at 8 m, 4.8% and 13.8%. The cause is the 24 m grid cells (track/geometry.ts line 32).
   - Fix: Give the race module a separate padded index for projection, and relax old progress.js's 'off > outer + 0.3 = off course' rule so grass counts as on course.

### Factual errors
1. 'All 80 existing track, contact and course checks still pass' / zero regressions: the 80 pass, but the same patch breaks testing/check.test.mjs 'Driving test rules compile as strict ES2022 without a browser' (3 TS errors in racing-core/testing/drive.ts lines 92, 99, 102), which the researcher did not run.
2. 'About 250 lines of already-tested logic reused' and 'an adapter of about 25 lines': only progress.js + ghosts.js (139 lines) ran unchanged; session.js and driver.js logic was rewritten in a 159-line adapter.
3. The proposed minimum radii (S Kart 9 m, GT 12 m, F1 15 m) are presented as test-backed, but the researcher's own kart-a (7.44 m), gt-a (9.21 m) and f1-a (13.66 m) did not meet them.

### Missed options
1. Reverse-direction variants (Mario Kart Tour 'R', GT7 reverse layouts): 3 layouts x 2 directions = 6 tracks. Tested here: reversed layouts drive cleanly, with laps within 1% of forward.
2. Several layouts per venue on shared road (Bahrain's six layouts, GT7 Sainte-Croix A/B/C): each race loads one Track object, so this needs only per-track rail options and merged visuals, not junction physics.
3. Reuse the existing testing/neighborhood.ts ground + grass surfaceAt pattern as the island race world instead of designing a new adapter.
4. The authoring tool runs the scripted driver per class and reports predicted lap time, top speed and braking share, so the owner can reshape a track and see the class fit at once.
5. Re-implement race rules fresh in strict TS using old progress.js/ghosts.js as the spec and test oracle (respects Codex's 'no imports from the retired implementation').
6. A boost-limit rule (charges or mystery-box-only boost) as part of the first race rules, since the engine grants unlimited boosts.
7. Scope the approved mystery boxes (card 1.2) explicitly: clean races first, items second.
8. Fallback if the island gets too big: Mario Kart's model of all classes sharing the same tracks (any kart already drives any track), each class keeping 2 'home' tracks.
**Retest:** I worked only in (scratch folder, not saved) plan2/verify-racing, on my own copies of racing-core (unpatched and patched). TypeScript and three were linked read-only from the repo, and racing-lab and kart-parts were copied for tests.

(1) Patch check. I applied the researcher's track-patch.diff to my copy. Track + contacts + course suites: 80/80 pass, the same as unpatched. Tuning, prototypes and gt3-v3: 47/47 in both. But tsc on testing/ fails with 3 errors only in the patched copy, and testing/check.test.mjs drops from 15/15 to 14/15. That is a real regression.

(2) My own builder (builder.mjs, my own centripetal Catmull-Rom code) and validator. I built 5 tracks: an S Kart loop (499 m, 8.6 m road, minimum radius 12.75 m, box 128x166 m), its reverse, a figure-8 with a 6.5 m overpass (670 m, 10 m road), a GT loop (1,024 m, 12 m road, box 309x293 m) and its reverse. I pushed them into the unpatched copy's JSON object, so the runtime needs no TRACK_IDS change (confirmed).

(3) drive-test.mjs used the repo's own course-check fixture logic, ported with per-class wheelbase: 5 tracks x 4 karts (approved Fast, GoKart, GT3-V3, F1-2026) x 2 driver levels = 40/40 laps. Every run had 0 rail contacts, 0 airborne ticks and 0 lost projections. On the figure-8, karts used the right deck at the crossing: heights 0 and 6.5 m.
- S Kart 499 m: GoKart 29.2-33.2 s; Fast 16.6-20.8 s.
- GT 1,024 m: GT3-V3 34.9-41.1 s; F1-2026 32.4-38.8 s; GoKart 44-49.5 s.
- Reverse laps were within 1% of forward.
This matches the researcher's lap matrix.

(4) boost-test.mjs: the old progress limit trips above 212 mph. Fast with boost peaked at 180 mph on the 1,024 m track. The engine allowed 16 boosts in one lap.

(5) bench.mjs uses the repo's unchanged stepContactKarts. Node: 8 karts cost 476-512 µs physics plus 25-30 µs AI per 120 Hz tick, about 6.1-6.4% of one desktop core. That matches the researcher's 207-496 µs and 2.7-6.2%. I did not re-run the Chromium 4x-throttle number.

(6) grass-test.mjs and proj-scan.mjs: projection fails just past the road edge (up to 4.2% of points at +2 m), confirming the researcher's claim. A neighborhood-style ground + grass world with no rails drives with 0 falls.

(7) Web: I confirmed by search summary the MK8 Deluxe Mario Kart Stadium 150cc staff ghost of 1:53.191 (mariowiki), the FIA karting minimums (800-1,100 m length, 6-8 m width, longest straight at most 150-200 m), Mario Kart Tour R variants, GT7 reverse and multi-layout venues, and Bahrain's six layouts. I did not re-verify the gamedeveloper.com rubber-banding sources or the patent.

Limits: scripted centreline drivers, not humans; no phone or real-GPU measurement; no rendering cost.
**Improved recommendation:** The researcher's main finding is right, and I confirmed it on my own tracks: the racing engine can already drive, collide and time laps on small island tracks with every kart class, without changing any driving feel. Nothing needs retuning. The approved Fast feel, the class profiles and the four original tracks all stay as they are. Change the plan in five ways:

1) Build one complete race on one track before making all six. Order:
- (a) The small track-loading fix, plus a one-line type fix in testing/drive.ts. The patch as written breaks one existing check, so run every racing test suite.
- (b) One authoring method: a list of points made into a smooth curve, with automatic checks for tight corners, overlaps and shortcuts. The tool should also print the predicted lap time and top speed for each class.
- (c) One S Kart track.
- (d) Fresh race rules: start lights, 3 laps, ordered checkpoints, wrong-way warning, respawn, results, and a limit on boosts. Use the old prototype's rules as the written guide and test, not as copied code, because Codex's own notes retire that code.
- (e) Computer drivers that follow the road with a speed table computed once per track.
- (f) Island ground and slow grass beside the road, copying the existing Neighborhood test world.
- (g) Fast race checks that run without a browser.
Then add the other tracks, then time-trial ghosts, then mystery boxes and difficulty.

2) Six tracks do not have to mean six separate road shapes. Two proven shortcuts each halve the design work and the island space: drive each layout in both directions (tested: reversed tracks work perfectly), or give each class one venue with a long and a short layout sharing road, like real circuits. The owner decides whether a reversed layout counts as a second track.

3) Size tracks by lap time (about 30-40 s), not by fixed metres. Rough starting sizes: S Kart 500-600 m, GT 850-1,000 m, F1 1,000-1,250 m. Change them later to match the owner's preferred race length.

4) Treat mystery boxes as approved but second. The miniature's first races are clean races with a boost limit.

5) Codex owns racing, so Codex must approve the work and record it in PLAN.md: the island tracks and PLAN sections 4-8 (race rules, opponents, ghosts, controls, playable build). Porting Canyon Switchbacks needs owner approval because 3D-WORLD-3 is reference only.

Questions for the owner (purpose or taste only):
- Do reversed or shared-road layouts count toward 'two tracks per class'?
- Mystery boxes in the first miniature, or later?
- Race length?
- Where does the approved Fast kart race?
- Should computer drivers use catch-up?

## Practice stations: research
**Question:** How can the miniature island get a practice field with small, working practice versions of every minigame, built cheaply and kept flexible?
**Summary:** The cheapest proven pattern is a compact sports park around a central plaza. Each station offers free play plus one short challenge, like "make 5 hoops" or "beat 30 s", with bronze, silver and gold medals and a saved best score. Mario Kart World's 20-40 second P-Switch missions, the Tony Hawk's Pro Skater 2-minute goal runs, the Wii Sports Resort 3-Point Contest and Rocket League training packs all use this pattern. Stations should use real-size equipment but only one of each (one hoop, one lane, one goal), so each station's code can grow into the full minigame later without being rebuilt. I tested the idea: one hand-written "ball flight" system ran six different stations from small data files, each 3 to 14 lines (hoop, goal, barrels, frisbee basket, skee-ball, archery and darts). It scored correctly in 3,500 random shots, and its cost on a slowed-down CPU was tiny. A second small hand-written "rolling balls on a flat surface" system handles mini golf, billiards and bowling pins. No physics engine is needed for the first version: Rapier would add about 1.17 MB, and bowling ran at the same cost with or without an engine. My layout puts all practice stations on a field about 46 x 64 m (about 107 x 149 blocks). The skate park, an ice loop and a short ski slope get their own zones, about 1,800 m² more. Thirteen of the 20 minigames can be built now. Five are waiting on avatar movement (walking, jumping, skating, skiing, skateboarding), and kart racing and time trial are practised on the six tracks.

### Options

1. **A. Full minigames on the island (every game with full rules, lobby, NPCs)**
   - How it works: Build each of the 20 minigames to its complete card in docs/MINIGAMES.md (10 frames of bowling, 9 holes of golf, 5-kick shootout with goalie, lobbies, NPCs, results) and place them on the island.
   - Pros: Players get the real games right away, with no second pass later.
   - Cons: This is the 'takes years' path the owner wants to avoid. It means 20 separate rule sets, plus NPC opponents, lobbies and results screens, before anything can be played. It needs much more land, for example full golf holes and 9-hole frisbee courses.
   - Evidence: docs/MINIGAMES.md section A (12-item shared template) and cards 1-21. The owner's 23 Nov direction asks for 'small practice versions', not full sets.
   - Test result: Not tested. It is out of scope by the owner's direction.

2. **B. Practice stations, free play only (no win condition)**
   - How it works: Each station gives you equipment and targets, for example a hoop with a ball rack, and you play freely. Nothing is scored or saved.
   - Pros: Cheapest per station. Feel can be tuned with the owner immediately.
   - Cons: There is no goal, so it gets boring fast in single player. Rec Room and NBA 2K courts stay lively because other players are there, and online comes later here. Nothing tells the owner whether a station is 'working' beyond eyeballing it.
   - Evidence: Rec Room's Rec Center is a social hub whose doors lead to full games (earlyguides.com/rec-room; rec-room.fandom.com). NBA 2K's City and Park are social pickup courts (nba.2k.com/2k27/features/the-city/). Both rely on other players.
   - Test result: Not tested separately. It is the free-play half of option E, which was tested.

3. **C. Short challenge stations (one 20-90 s goal each, bronze/silver/gold, best score saved)**
   - How it works: Each station has one short challenge that starts and finishes in under about a minute and a half, such as 'make 5 hoops in 30 s', 'score 3 of 5 penalties', 'beat 30 s' or '9 skee-balls for 200+'. A single shared challenge runner handles the countdown, timer, counter, medal tiers and the saved best score. That runner is a small seed of MINIGAMES template A items 4, 7, 8 and 11.
   - Pros: It gives a clear goal and a clear test of 'everything works'. One runner serves all 20 stations. This is proven at scale: Mario Kart World hides about 394 short missions behind P-Switches with 20-40 s limits. Tony Hawk's Pro Skater 1-3 used 2-minute goal runs. Wii Sports Resort's 3-Point Contest is 5 spots x 5 balls in 60 s. Rocket League's training packs are preset shots. The bronze/silver/gold idea already exists in this project's time-trial card.
   - Cons: Each challenge needs target numbers tuned once the feel is approved. Without free play, players can't just mess around.
   - Evidence: Mario Kart World mission types and time limits: mariowiki.com/List_of_Mario_Kart_World_missions and mariowiki.com/User:Cloudwalker/List_of_missions_in_Mario_Kart_World (fan-maintained). Count of 394: nintendolife.com/guides/mario-kart-world-all-p-switch-locations (fan count, not confirmed by Nintendo). Tony Hawk's 2-minute goals: tonyhawkgames.fandom.com/wiki/Career_Mode and strategywiki.org/wiki/Tony_Hawk%27s_Pro_Skater_2/Walkthrough (fan wikis). Wii Sports Resort 3-Point Contest: strategywiki.org/wiki/Wii_Sports_Resort/Basketball. Rocket League training packs and free-play ball controls: rocketleague.com/news/using-the-new-free-play-controls-and-training-pack-refresh (search snippet only; the host was blocked from fetching). docs/MINIGAMES.md card 2 (bronze/silver/gold target times).
   - Test result: The scoring triggers every challenge depends on were tested (see tests_run). The challenge runner itself was not built.

4. **D. Free-play props only ('toy box': loose balls and targets lying around the island)**
   - How it works: Balls, frisbees and targets sit around the world, and the player can kick, throw or hit them anywhere at any time. There are no stations or scores.
   - Pros: Very cheap once the ball system exists. It matches the 'toy' design philosophy (Team Asobi: 'the joy of just playing with a toy') and the owner's football card ('throw to NPCs anytime, for fun') and coins card ('a few coins for shooting a hoop').
   - Cons: It gives no structure or practice feedback on its own. It also needs the hit system (WORLD-RULES C2) for balls hitting people.
   - Evidence: Astro Bot director on the toy aspect: blog.playstation.com/2024/09/09/astro-bot-how-team-asobi-created-a-unified-vision-for-fun/ (via search snippet; gamedeveloper.com could not be fetched). docs/MINIGAMES.md card 7 item 2. docs/FEATURES.md card 5 item 3.
   - Test result: The same ball kernel was used, so the props would cost almost nothing extra. Not tested as a separate mode.

5. **E. Hybrid of C + D: free play by default, one short challenge per station, loose balls at every station (RECOMMENDED)**
   - How it works: Walk into a station and play freely with its gear. Tap 'Challenge' for the one short goal, and the medal and best score are saved. Balls can be carried off and kicked around the field. Everything runs on three shared pieces: (1) a ball-flight system for anything thrown, kicked, shot or hit through the air, (2) a rolling system for things on a table or lane, and (3) one challenge runner plus one aim-power-release input module with 2-3 swappable control schemes, because the owner chooses controls after testing (MINIGAMES A14). Each station is a small data file listing what the ball bounces off and what scores. The 20 cards are in the next entry.
   - Pros: It combines the strengths of B, C and D. Each new station is mostly configuration: in the prototype, station files were 3-14 lines each, against about 150 lines of shared kernel. Later full minigames extend the same runner and kernels instead of starting over.
   - Cons: A little more work than B. The challenge numbers and feel numbers still need the owner's testing.
   - Evidence: Prototype: (scratch folder, not saved) plan2/stations/ball3d.mjs (154 lines), stations.mjs (85 lines, 8 station builders of 3-14 lines each), disc2d.mjs (44 lines).
   - Test result: Built and tested headless. 7 test groups pass (results-kernel.json). Basketball: 2,000 free throws with 0 disagreements against an independent check. Soccer: 1,500 kicks with 0 disagreements. Darts: triple 20 = 60, bull = 50. Archery: drop compensation gives a 10. Barrels, frisbee basket, skee-ball (10-100 incl. corner 100s) and mini-golf cup (slow ball drops, fast ball skips) all score. A moving bat hits a pitched ball.

6. **Station cards: the recommended set for option E (one per minigame, with build batch)**
   - How it works: Footprints are in metres, followed by the shared system and the build batch. Batch 0 is the foundation: station zone, Play/Challenge prompt, challenge runner, aim-power input, the two kernels, simple camera presets, and a way to move between stations. | 1 Kart racing: no field station; practised on the 6 island tracks (racing-core). | 2 Time trial: no field station; time-trial mode on each track with the ghost racing-core already saves; bronze/silver/gold lap targets. | 3 Mini golf: 3 short holes about 4.3 x 2.6 m each (like the old garden hole); challenge 'par 2 on each hole'; area 12 x 7; rolling system + cup capture; batch 3. | 4 Full golf: range tee at the island edge hitting out over the sea to 3 floating target greens with distance buoys (real aqua driving ranges do this); challenge 'land 2 of 5 on a green'; land 6 x 6 plus a 6 x 18 clear lane; ball flight + swing; batch 4. | 5 Bowling: one full-length lane (18.3 m + approach, 24 x 2.5); 10 pins, 2 rolls; challenge 'spare or strike'; rolling system with scripted pin falls; batch 3. | 6 Basketball: one hoop on an 11 x 8 half-court pad with a ball rack, next to the soccer goal as the owner described; challenge 'around the world' over 5 spots or '5 in 30 s'; ball flight (rim ring + backboard + 'through the hoop going down' trigger); batch 1. | 7 Football throwing: 6 x 25 lane with barrels at 8/14/20 m, later a target sliding on a rail (scripted); challenge '3 barrels in 5 throws'; ball flight; batch 1. | 8 Soccer penalties: real 7.32 x 2.44 goal with an 11 m spot (16 x 14 pad) and top-corner targets; goalie later (scripted dive); challenge 'score 3 of 5'; ball flight (posts, crossbar, net, whole-ball-over-the-line rule); batch 1. | 9 Baseball batting: 5 x 24 cage facing the sea; pitching machine (scripted launch); hits fly out over distance zones; challenge '3 deep hits from 10 pitches'; ball flight + moving bat; batch 4. | 10 Archery: 4 x 22 lane with targets at 10/15/20 m against the cliff or sea; challenge '25+ with 3 arrows'; ball flight with 'stick on hit' + ring scoring; batch 2. | 11 Darts: board on the arcade-shed wall, 2.37 m throw line (2 x 3.5); challenge 'hit the bull' or 'beat 60 with 3 darts'; same as archery with a dartboard score table; batch 2. | 12 Frisbee golf: one basket about 24 m from a tee (4 x 26); challenge 'basket in 3 throws'; ball flight with glide (lighter gravity + curve) + basket; batch 1. | 13 Skee-ball: one machine (3.1 m lane, 2 x 5 area) in the arcade shed; challenge '9 balls for 200+'; ball flight + ring scores 10-50 with 100-point corners; batch 1. | 14 Billiards: one 7-ft table in the shed (5.2 x 4.2 room); challenge 'trick shot: sink 3 in 5 shots'; rolling system with 8 substeps; batch 3. | 15 Obstacle course: 24 x 8 warm-up run (steps, gaps, balance beam, bouncy mushroom, timer, checkpoints); challenge 'beat 30 s with no falls'; avatar movement + scripted moving platforms; batch 5, blocked until walk, jump, gravity and collision return. | 16 Long and high jump: 30 x 3 runway + sand pit, and a 10 x 8 high-jump area with a rising bar; challenge 'beat your distance/height'; avatar; batch 5, blocked. | 17 Diving: not a minigame; optional diving board at a pond. | 18 Ice skating: 24 x 12 frozen loop with a timing gate (own zone); challenge 'lap under N s'; avatar on skates; batch 6, blocked. | 19 Skiing: 15 x 40 slope on the hill with 5 flag gates and a 'magic carpet' conveyor lift (scripted); challenge 'all gates under N s'; avatar on skis; batch 6, blocked. | 20 Skate racing: a timed line, plus Tony Hawk-style letter pickups, through the owner's skate park (30 x 30 own zone); challenge 'beat 40 s'; skateboard movement; batch 6, blocked. | 21 Paintball: 8 x 15 shooting gallery with pop-up targets (scripted) behind block cover; challenge '10 hits in 30 s'; ball flight with fast sticky pellets; batch 2. || BATCHES: 0 Foundation. 1 Ball at a target: basketball, soccer, football, skee-ball, frisbee. 2 Things that stick: archery, darts, paintball. 3 Table and lane: mini golf, billiards, bowling. 4 Hit with a tool: golf range, batting cage (gameplay can start with a timing swing; holding the club or bat uses the WORLD-RULES rod grip). 5 Avatar skills: obstacle run, long/high jump. 6 Ride zones: skate line, ice loop, ski slope; karts on tracks. Batches 1-4 (13 games) need no new avatar movement.
   - Pros: Every minigame gets a small station, or a clear home on the tracks or in a ride zone. Each batch shares one mechanic, so after its first station the rest are mostly data. Scripted motion (goalie dive, pitching machine, rail targets, pop-up targets, conveyor lift, moving platforms) is cheap and needs no engine.
   - Cons: Five stations wait for avatar movement work. Real-size equipment snaps to the 10.75 cm block grid, for example a rim at 3.01 m or 3.12 m instead of 3.05 m.
   - Evidence: Regulation sizes: rim 3.05 m, inner diameter 45.7 cm (docs/game-dev/05-physics.md F); dartboard 451 mm, bull at 1.73 m, throw line 2.37 m (dlgsc.wa.gov.au/sport-and-recreation/sports-dimensions-guide/darts; winmau.com/pages/blade-x-setup); bowling lane 41.5 in wide, 60 ft to the head pin, approach at least 15 ft (topendsports.com/sport/tenpin/dimensions.htm; bowlingball.com/BowlVersity/regulation-bowling-lanes); Skee-Ball Classic 10 ft lane, 10'3" x 2'5" machine (skeeball.com/shop/alley-games/classic/). Old mini-golf hole 4.3 x 2.58 m, hand-written 2D roll at 1/120 s: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-garden/src/mini-golf.js (77 lines, tests in tests/golf.test.js). It mixes drawing and logic, so a port would need splitting and owner approval (CLAUDE.md rule 9). Aqua driving ranges with floating target greens: aquagreens (supplier since 1994, via search snippet), usga.org 'still afloat' article. Magic carpet and the floating-range idea are design proposals, not tested.
   - Test result: The batch 1-3 mechanics were tested in the prototype (tests_run). Batch 5-6 stations were not tested: the avatar cannot walk yet (diagnostic of 22 Nov).

7. **Layout L1 + L3: compact sports park around a central plaza, clustered by mechanic, ranges pointing out to sea (RECOMMENDED layout)**
   - How it works: The plaza is the spawn point, watch-door arrival point and score board, with every cluster visible from it (Disneyland 'hub' and 'weenie' idea). The north band is long ranges (golf, batting, archery, football, paintball, frisbee) firing out over the island edge, so the sea gives free distance. The middle band is courts (soccer goal next to the hoop, mini golf) beside the plaza. The south band is the arcade shed (darts, skee-ball, pool), the bowling lane and the athletics/obstacle strip. Clusters stay separate so stations can be added, moved or removed without touching others, as the old 3D-WORLD-3 island did with 'one plot each'.
   - Pros: Easy to find everything, little walking, one place to test. Stations are clustered by shared kernel, which matches the build batches. The sea saves land and blocks for the longest stations. It fits the owner's picture of 'a field full of practice games'.
   - Cons: Balls flying off the edge are lost (fine for golf by the water rule). The south band depends on avatar features. The layout is a first draft that the owner has not reviewed.
   - Evidence: Hub wayfinding: csus.edu/indiv/s/shawg/articles/theme_parks/miracle.html ('Miracle of the Hub'); mouseplanet.com/wayfinding-at-disney/658/. Old repo lesson: the 13-station snake course was replaced on 11 Nov by the open 'yard' because the owner wanted more than one way through (/home/user/isaiasurrutia96/3d-world-3/docs/DECISIONS.md, entries of 4 Nov thirteenth and 11 Nov). 13 Nov island plan used 'one plot each' for golf, tower, pond and mini games (same file). Wuhu Island as a resort hub players learn by heart: iwataasks.nintendo.com/interviews/wii/wiisportsresort/0/1.
   - Test result: area.mjs: a hand layout with an automatic overlap check finds 0 overlaps. The field is 46 x 64 m = 2,944 m² (107 x 149 blocks): stations 1,884 m², walkways and open space 1,060 m². Own zones add 1,788 m² (skate park 30x30, ice loop 24x12, ski slope 15x40). The ASCII map is in results-area.txt.

8. **Layout L2: one linear snake course through all stations**
   - How it works: Stations sit in a fixed order along one path, each finishing facing the next (the old 3D-WORLD-3 13-station course).
   - Pros: No wayfinding problem. Easy to test in order.
   - Cons: The owner rejected this pattern in the old repo on 11 Nov in favour of a freer 'yard'. It forces walking past everything, and adding or moving a station breaks the chain.
   - Evidence: /home/user/isaiasurrutia96/3d-world-3/docs/DECISIONS.md, 4 Nov thirteenth entry (snake course) and 11 Nov ('The yard replaces the row of stations').
   - Test result: Not tested. Rejected on the old repo's history.

9. **Layout L4: stations scattered around the whole island like side activities**
   - How it works: Put each station somewhere different on the island, as GTA and Red Dead place darts, golf and tennis, or as Mario Kart World places P-Switches.
   - Pros: More exploring, and it suits the long-term big world.
   - Cons: More walking, harder to test, and it spreads build work across terrain. Better saved for the big world after the miniature.
   - Evidence: Mario Kart World free-roam missions spread over the map (gamesradar.com/games/super-mario/mario-kart-world-p-switch-locations). Rockstar side activities (rockstarintel.com, opinion piece). A former Rockstar developer on introducing activities through quests so players return to them (gamereactor.eu, former GTA VI and RDR2 developer on open-world fatigue).
   - Test result: Not tested.

10. **Physics P1: hand-written shared kernels, no engine (RECOMMENDED for v1)**
   - How it works: Kernel 1 (ball flight, 3D) handles gravity, drag, bounce on world blocks (using the repo's own VoxelWorld.groundBelow), bounce off simple shapes (ring for rims, segment for posts, bats and poles, thin rectangle for boards and nets), and scoring triggers checked along the ball's whole path each step. It also adds extra small steps automatically for fast balls. Kernel 2 (rolling discs, 2D) handles balls and pins on a flat table or lane, with cushions and pockets. Moving shapes (bat, windmill, goalie) are supported by bouncing in the moving shape's frame.
   - Pros: No new dependency, matching the repo today (only three and cdt2d). The cost is microseconds. Feel can be tuned exactly, which the project's own notes recommend for core mechanics. Repeat runs give the same result. The same code runs in Node tests without a browser, so tests are fast.
   - Cons: Bowling pins become 'slide and fall' discs with a canned topple animation, not real tumbling. A new shape needs a few lines of maths. Sloped blocks (wedges) would need surface normals, because VoxelWorld treats every block as a square cube.
   - Evidence: docs/game-dev/05-physics.md B4 ('Hand-written physics is often better for the core mechanic'). docs/game-dev/06-sports.md A7 (mini golf needs no flight model) and D3 (basketball: physics with rim and backboard colliders). /home/user/3D-World-4/src/world/collision.ts (groundBelow, materialAt). Prototype files: ball3d.mjs, disc2d.mjs, stations.mjs in the scratch folder.
   - Test result: Chromium measurements: 1.05 µs per ball step unthrottled and 3.84 µs at 4x CPU throttle (about 10 balls at 120 Hz cost about 0.08 ms per frame). Billiards with 16 balls and 8 substeps cost 0.30 ms per frame at 4x throttle. A 32-40 m/s ball through a 1 cm net at 120 Hz passed through 33/60 and 34/60 times without automatic substeps, and 0/60 with them. Billiards break at 10 m/s: 16.9 mm ball overlap with 1 substep, 0-0.09 mm with 8 substeps.

11. **Physics P2: cannon-es (pure JavaScript engine) for bowling pins**
   - How it works: A real rigid-body engine. Each pin is a compound of 6 cylinders shaped like a real pin; the lane, walls and ball are bodies.
   - Pros: Small (36 KB gzipped), MIT licence, real tumbling pin action.
   - Cons: Unmaintained: the last publish was August 2022. It assumes each body's centre of mass is at the body's origin. I hit that bug: with the pin origin at its base, pins could not fall over until I offset the shapes by hand. Cost about 3.2 ms per frame for one lane at 4x CPU throttle. Rapier produced more strikes than cannon-es in the sweep.
   - Evidence: npm view cannon-es: version 0.20.0, last modified 2022-08-12, licence MIT. Measured min+gzip 36,030 bytes (scratch cannon.min.js). Bug and fix recorded in bowling.mjs comment.
   - Test result: Pins at rest: 0 fell in 5 s. Sweep of 21 hit positions: pins down '3 3 3 7 7 6 9 7 8 9 9 8 9 9 5 5 6 7 6 3 3', 0 strikes; pocket hit = 9. Same result on a repeat run. Chromium: 0.34 ms per step at 1x and 1.58 ms at 4x throttle.

12. **Physics P3: Rapier (Rust/WebAssembly engine) for bowling pins**
   - How it works: Same pin compound and setup as P2, using Rapier 0.21.0. It works out each body's centre of mass automatically.
   - Pros: Best-quality pin action in the test (the only method that produced strikes in the sweep). Actively maintained (0.21.0 published 25 Sep 2026), Apache-2.0 licence, has continuous collision checks (CCD).
   - Cons: Very large download: the wasm file is 3.08 MB raw / 1.17 MB gzipped, about 6.5x three.js's roughly 179 KB gzipped (the base64 'compat' build is 1.65 MB gzipped). Startup took 44 ms unthrottled and 174 ms at 4x throttle. It costs about the same CPU as cannon-es for one lane (2.5 ms per frame at 4x throttle). It would be a new dependency and a separate integration project.
   - Evidence: Measured in the scratch folder: node_modules/@dimforge/rapier3d/rapier_wasm3d_bg.wasm (3,082,103 bytes, gzip 1,168,722) and node_modules/@dimforge/rapier3d-compat/dist/rapier.mjs (4,340,292 bytes, gzip 1,652,936). three.js 0.180 three.module.min.js 78,879 bytes gzipped plus three.core.min.js 100,338 bytes gzipped, measured from /home/user/3D-World-4/node_modules. Third-party figure of about 816 KB gzipped for 0.19.3 compat (depscope.dev) did not match my measurement of 0.21.0.
   - Test result: Pins at rest: 0 fell, drift 0 mm. Sweep: '4 3 7 6 6 7 8 9 10 8 9 10 10 8 8 6 7 8 8 4 3', 3 strikes; pocket hit = 9; same result on a repeat run. Chromium: 0.31 ms per step at 1x and 1.25 ms at 4x throttle.

13. **Physics P4: hand-written 2D 'disc' pins (arcade bowling, no engine)**
   - How it works: Pins and ball are discs on the lane. A pin hit faster than a threshold counts as 'down' and keeps sliding, knocking others; the side walls kick pins back. The visual topple is canned.
   - Pros: Essentially free: 0.008 ms per step at 4x throttle, about 400x cheaper than the engines. No dependency, and the result is the same every run. It reuses the same rolling kernel as billiards and mini golf.
   - Cons: Pins don't tumble realistically, so it may look 'gamey'. Strike frequency needs tuning (0 strikes in the sweep, 10 on the pocket shot).
   - Evidence: bowling.mjs runDiscs; disc2d.mjs.
   - Test result: Pins at rest: 0 fell. Sweep: '4 3 5 4 5 6 6 9 8 7 7 9 8 7 6 7 6 6 6 5 3', 0 strikes; pocket hit = 10; same result on a repeat run. Chromium: 0.002 ms per step at 1x and 0.008 ms at 4x throttle.

### Tests run

1. **Shared ball-flight kernel scoring correctness (basketball)**
   - How: node tests.mjs. 2,000 simulated free throws (release 2.1 m, 4.57 m from the board, launch angle 52°±3°, speed ±2%, sideways noise) against a regulation rim (ring collider) and backboard. The trigger result was compared with an independent check written separately, which interpolates the recorded path through the rim plane at 3.05 m and through 2.90 m. Also 200 balls thrown upward through the hoop from below.
   - Result: 545 makes (27.3% with this deliberately large noise). 0 disagreements with the independent check. 0 false scores from upward throws. 1,776 shots touched the rim and 758 the board, so the collisions were exercised. Two earlier versions of my independent check were wrong (one counted balls that sneaked under the front rim, one assumed a net) and were fixed. The trigger code itself never changed.
   - Limits: No net is modelled. The make percentage depends on my noise settings, not real skill. The bounce numbers are placeholders.

2. **Soccer goal scoring and tunnelling**
   - How: 1,500 random kicks (12-30 m/s) from 7 m at a 3.0 x 1.5 m practice goal with posts, crossbar and back net. The trigger was compared with an independent 'whole ball fully over the line inside the frame' check. Then 60 shots at 32 and 40 m/s, at different starting offsets, into a 1 cm back net, with and without automatic substeps.
   - Result: 795 goals, 0 disagreements, 451 post or crossbar hits. Without substeps the ball passed through the net 33/60 times at 32 m/s and 34/60 at 40 m/s. With automatic substeps it passed through 0/60 times.
   - Limits: Mini-goal geometry; the real 7.32 m goal uses the same code with different numbers. No goalie.

3. **Archery, darts, barrels, frisbee basket, skee-ball, mini-golf cup, moving bat**
   - How: Same kernel and test file: (a) arrow at 55 m/s to an 18 m target; (b) darts aimed at triple 20 and the bull with standard board geometry; (c) football throws into 3 barrels at 8/14/20 m; (d) a frisbee with arcade glide (gravity x0.45) into a basket 12 m away; (e) skee-ball lobs at the ring board; (f) putts at different speeds toward a 10.75 cm cup; (g) a pitch at 33 m/s against a bat moving at 32 m/s, at 5 timing offsets.
   - Result: (a) Aimed at the centre the arrow scored ring 2 (drop 52.5 cm); aimed higher by the drop it scored 10. (b) Triple 20 = 60, bull = 50, sector check = 32. (c) All 3 barrels scored, worth 1, 2 and 3 points. (d) 1 make. (e) Scores 0/20/50/30/10 and a corner pocket worth 100. (f) 4.2 m/s went in; 3.6-4.0 stopped short; 4.4+ rolled past. (g) All 5 timings hit the ball, and the timing changed the result (141-218 m).
   - Limits: Baseball distances are unrealistic because drag is untuned, so the test only proves that the moving collider works and that timing matters. The frisbee lift model is a placeholder. The mini-golf result used the grass placeholder friction.

4. **Kernel CPU cost on a phone-like CPU**
   - How: Bundled with esbuild and run in headless Chromium (playwright), unthrottled and with CDP Emulation.setCPUThrottlingRate rate 4. Measured: 120,000 ball steps against the hoop and the real VoxelWorld ground, and a 16-ball billiards break with 8 substeps.
   - Result: Ball flight: 1.05 µs per step unthrottled, 3.84 µs at 4x. Billiards: 0.083 ms per frame unthrottled, 0.30 ms at 4x. Node alone gave 1.13-1.25 µs per ball step.
   - Limits: SwiftShader software rendering was not involved (no drawing), so these CPU numbers are meaningful. A real iPhone was not tested, and a 4x throttle only approximates one.

5. **Bowling pins: cannon-es vs Rapier vs hand-written 2D discs**
   - How: bowling.mjs (Node) and bowling-browser-entry.mjs (Chromium at 1x and 4x throttle). 10 pins shaped as a compound of 6 cylinders (5-12 cm diameter, 38.1 cm tall, 1.5 kg), a 6.5 kg ball at 8 m/s with a 3° entry angle, a 41.5 in lane with kickback walls, and 120 Hz. Measured: 5 s at rest, 21 hit positions from -40 to +40 cm, a pocket hit, a repeat run, ms per step, and Rapier startup time.
   - Result: All three keep the pins standing at rest and repeat exactly. Strikes in the sweep: Rapier 3, cannon-es 0, discs 0 (discs = 10 on the pocket hit). CPU per step at 4x throttle: cannon-es 1.58 ms, Rapier 1.25 ms, discs 0.008 ms. Rapier startup: 44 ms (1x), 174 ms (4x). I found and fixed a cannon-es centre-of-mass pitfall during the test.
   - Limits: The pin shape is an approximation, and friction and bounce were not tuned to real lanes. There is no oil pattern or hook. Strike rates depend on tuning, so they show what each method can do, not the final feel.

6. **Library download sizes**
   - How: npm installed cannon-es 0.20.0 and @dimforge/rapier3d(-compat) 0.21.0 in the scratch folder. Measured raw and gzip -9 sizes; cannon-es was minified with esbuild. three.js sizes were read from the repo's node_modules (read only).
   - Result: Rapier wasm 3.08 MB / 1.17 MB gzipped; Rapier compat 4.34 MB / 1.65 MB gzipped; cannon-es minified 125 KB / 36 KB gzipped; three.js 0.180 module+core about 179 KB gzipped.
   - Limits: gzip -9 approximates what a server sends. Brotli would be somewhat smaller. Parse and compile time on an iPhone was not measured.

7. **Practice-field area and layout**
   - How: area.mjs: station footprints with real equipment dimensions, a hand layout with the sea to the north and 3 m / 2 m walkways, an automatic overlap check, and an ASCII map at 2 m per character.
   - Result: Field 46 x 64 m = 2,944 m² (107 x 149 blocks of 0.43 m); stations 1,884 m²; open space 1,060 m²; 0 overlaps. Own zones: skate park 900 m², ice loop 288 m², ski slope 600 m², total 1,788 m². The current src/world island is about 36 m² (14 x 14 blocks). Using a mini 3 x 1.5 m soccer goal instead of the real one would save about 164 m².
   - Limits: Footprints are my estimates from regulation sizes, not owner-approved. The layout is a first draft. Terrain, cliffs and how the field fits beside the 6 tracks are not modelled.

### Recommendation
**Choice:** Option E with layout L1+L3 and physics P1. Build a compact sports park (about 46 x 64 m) around a plaza, with one real-size practice station per minigame. Each station offers free play, one short challenge with bronze, silver and gold medals and a saved best score, and loose balls to mess around with. All of it runs on two hand-written shared systems (ball flight and rolling balls) plus one challenge runner and one aim-power input module. Build in batches by shared mechanic: 0 foundation; 1 ball at a target (hoop, goal, barrels, skee-ball, frisbee); 2 things that stick (archery, darts, paintball); 3 table and lane (mini golf, billiards, bowling with scripted pins); 4 hit with a tool (golf range and batting cage over the sea); then 5 avatar skills and 6 ride zones once avatar movement allows. No physics engine for version 1. Bowling is the only station where one is worth reconsidering, and only if the owner judges the scripted pins fake.
**Why:** The owner wants everything to work, the fastest path, and flexibility. Short challenges are a proven pattern (Mario Kart World missions, Tony Hawk goal runs, the Wii Sports Resort 3-Point Contest, Rocket League training packs) that gives single-player goals cheaply. The tests show one small kernel scores six different stations correctly from tiny data files at negligible CPU cost, so each new station is mostly configuration. Real sizes, one of each, mean the practice code becomes the full minigame later instead of being thrown away. Skipping an engine avoids 1.17 MB and a separate integration project, and it keeps the repo's current all-hand-written approach. Bowling ran at the same CPU cost with either engine, and the 2D method was about 150-200x cheaper.
**Confidence:** medium
**Conflicts with confirmed decisions:** No confirmed decision is overridden, but five things need checking. (1) CLAUDE.md rule 16 says every future lab page shares motion-lab/src/page.js and its input file. If the practice field is built as a lab page it must follow that; I suggest it become the first game page instead, which needs the owner's decision. (2) docs/COLLABORATION.md recommends Codex as lead for minigame gameplay systems. WORLD-RULES C1 asks for 'one ball system' without naming an owner, so who builds the ball kernel must be agreed between Claude, Codex and the owner. (3) Real equipment sizes must snap to the 10.75 cm block grid (WORLD-RULES F1), so a rim lands at 3.01 m or 3.12 m, not 3.05 m. (4) Porting the old mini-golf hole is reference material from 3D-WORLD-3 (rule 9): it needs the owner's approval, and it must be split into logic and drawing to match 'game logic separate from drawing'. (5) Stations skip MINIGAMES template A's lobby and NPC steps. That is a deliberate subset, not a change to the template. No aiming guide lines are proposed (MINIGAMES A15 is kept).
**What would change it:** If the owner prefers toy-sized equipment, switch to mini goal, short lane and similar (about 164 m² saved on soccer alone), accepting rework later. If the scripted bowling pins look fake to the owner, add Rapier (best pin action, 1.17 MB) or cannon-es (36 KB, unmaintained), after a real-phone load test. If phone testing shows one aim-power control scheme doesn't fit some stations, add per-station schemes. If avatar walking stays unavailable, use an interim plaza board or 'teleport to station' (the watch-door idea) so stations are testable now. If the island area budget beside the 6 tracks is tight, shrink the long range lanes by overlapping them or pointing more of them at the sea.

### Key numbers
1. Practice field (my layout): 46 x 64 m = 2,944 m² = 107 x 149 blocks of 0.43 m; stations 1,884 m², walkways/open 1,060 m², 0 overlaps (scratch area.mjs, results-area.json)
2. Own zones outside the field: skate park 30x30 = 900 m², ice loop 24x12 = 288 m², ski slope 15x40 = 600 m², total 1,788 m² (area.mjs; sizes are my estimates)
3. Current src/world island: 14 x 14 blocks = about 6 x 6 m = 36 m² (diagnostic of 22 Nov; area.mjs)
4. Old 3D-WORLD-3 floating island: 160 m across (/home/user/isaiasurrutia96/3d-world-3/docs/DECISIONS.md, 13 Nov entry)
5. Old mini-golf hole: 4.3 x 2.58 m footprint, 77 lines, hand-written 2D roll at 1/120 s (/home/user/isaiasurrutia96/3d-world-3/apps/letsgo-garden/src/mini-golf.js)
6. Prototype size: ball kernel 154 lines, rolling kernel 44 lines, 8 station builders of 3-14 lines each (wc -l in the scratch folder)
7. Ball kernel CPU: 1.05 µs per ball step unthrottled, 3.84 µs at 4x CPU throttle in Chromium (results-perf-browser.json)
8. Tunnelling at 120 Hz: a 32-40 m/s ball passed through a 1 cm net 33/60 and 34/60 times without substeps, 0/60 with automatic substeps (results-kernel.json)
9. Basketball: 2,000 shots, 0 scoring disagreements, 0 false scores from 200 upward throws (results-kernel.json)
10. Soccer: 1,500 kicks, 0 scoring disagreements (results-kernel.json)
11. Darts: triple 20 = 60, bull = 50; archery drop 52.5 cm at 18 m for a 55 m/s arrow (results-kernel.json)
12. Bowling CPU per step at 4x throttle: cannon-es 1.58 ms, Rapier 1.25 ms, 2D discs 0.008 ms; Rapier startup 174 ms at 4x (results-bowling-browser.json)
13. Bowling strikes in a 21-position sweep: Rapier 3, cannon-es 0, discs 0 (discs 10 on the pocket hit) (results-bowling.json)
14. Download sizes gzipped: Rapier 0.21.0 wasm 1.17 MB (compat 1.65 MB); cannon-es 0.20.0 36 KB; three.js 0.180 module+core about 179 KB (measured)
15. cannon-es last published 2022-08-12, MIT; Rapier 0.21.0 published 2026-09-25, Apache-2.0 (npm view)
16. Billiards, 16 balls: 8 substeps keep ball overlap at 0-0.09 mm, 1 substep lets it reach 16.9 mm at 10 m/s; 0.30 ms per frame at 4x throttle (disc2d.mjs, results-perf-browser.json)
17. Regulation sizes: rim 3.05 m, inner diameter 45.7 cm (docs/game-dev/05-physics.md); dartboard 451 mm, bull 1.73 m, throw line 2.37 m (dlgsc.wa.gov.au darts guide; winmau.com setup); bowling lane 41.5 in wide, 60 ft to the head pin, approach at least 15 ft (topendsports.com); Skee-Ball Classic 10 ft lane, 10'3" x 2'5" machine (skeeball.com); Pop-A-Shot 12 in rim at 65 in, backboard 87 in (popashot.net)
18. Short-challenge benchmarks: Mario Kart World missions 20-40 s (MarioWiki user list, fan data), about 394 missions (Nintendo Life fan count); Wii Sports Resort 3-Point Contest 5 spots x 5 balls in 60 s, max 30 (StrategyWiki); Tony Hawk's 1-3 used 2-minute goal runs (fan wikis); Fall Guys rounds aim for 80% skill / 20% chaos (Mediatonic via search snippet)
19. Scope count: 13 of 20 minigames can get stations now (batches 1-4); 2 are practised on the tracks (kart, time trial); 5 wait on avatar movement (obstacle, long/high jump, ice skating, skiing, skate racing)

### Time savers
1. Use real-size equipment but only one of each. Each station's code then becomes the full minigame's core, with no rebuild when full rules come later. Shrink the count, not the size.
2. Make stations data, not code: one ball-flight kernel plus one rolling kernel; each new station is a 3-14 line config plus placeholder art.
3. Use one challenge runner (free play / count / score / time, bronze-silver-gold, best saved) for all 20 stations instead of 20 rule sets. It also seeds MINIGAMES template A.
4. Use one aim-power-release input module with 2-3 swappable schemes, since the owner picks controls after testing (MINIGAMES A14).
5. Point long stations (golf, batting, archery) out over the sea: free distance, less land and fewer blocks to build, and lost golf balls already follow the water rule.
6. Skip the physics engine for version 1 (saves 1.17 MB and an integration project). Only bowling might need one later, and only if the owner says the pins look fake.
7. Build the 13 stations that need no new avatar movement (batches 1-4) while avatar walking and jumping are rebuilt, so the two AIs can work in parallel.
8. Test stations headless in Node with scripted shots (as in tests.mjs). That runs in seconds, with no browser, and checks scoring against an independent check. Use the station config as test data, following the old yard's 'tests read named places' lesson (COURSE_MARKS).
9. Build all stations inside ONE practice-field page instead of new separate lab pages. The repo already has about 18-20 pages with their own scenes, and browser checks dominate the 6-10 minute publish time.
10. Port the old garden mini-golf hole (77 lines, already tested) after splitting logic from drawing, rather than writing it from scratch. This needs owner approval under CLAUDE.md rule 9.
11. Use scripted motion for goalie dives, the pitching machine, rail and pop-up targets, moving platforms and the ski conveyor. The kernel already supports moving colliders.

### Risks
1. The avatar cannot walk (removed 20 Nov), so the field cannot be walked around until motion-core gets walking, gravity and collision back. Interim: a plaza board or teleport-to-station.
2. Feel numbers are placeholders: the rulebook keeps ballRoll and ballBounce as null until the owner approves them. Every station needs the owner's feel testing on a real iPhone.
3. Basketball and soccer have no modelled net. A satisfying 'swish' and net catch need a simple net collider and visuals. Without them, balls through the hoop at an angle keep flying (seen in testing).
4. Scripted 2D bowling pins may look fake. The upgrade path is Rapier (1.17 MB, 174 ms startup at 4x throttle) or cannon-es (unmaintained since 2022, centre-of-mass pitfall), and either needs a phone load test.
5. Touch controls for about 15 aiming stations on an iPhone are unproven. One input design might not suit them all.
6. Each station needs a camera preset (behind the ball, side view for bowling, top-down for pool), which is extra work not covered by the kernels.
7. Ownership overlap: Codex is the recommended lead for minigame gameplay, while the shared 'one ball system' has no named owner. This must be agreed before building, to avoid parallel edits.
8. Real dimensions snap to the 10.75 cm grid (rim 3.01 m or 3.12 m). The difference is minor but visible to experts.
9. VoxelWorld treats every block as a square cube, so balls rolling over wedges or slopes would need surface normals added. Flat fields are fine.
10. Web research gaps: gamedeveloper.com and rocketleague.com could not be fetched from this session, so those points rest on search-result snippets. Several game-design facts (Tony Hawk timers, Mario Kart World counts) come from fan wikis.
11. The layout and footprints are my first draft, not owner-reviewed, and they don't model terrain or how the field sits beside the 6 race tracks.

### Owner taste questions
1. Practice gear size: (a) real full-size gear but only one of each, so the practice station later grows into the full game (recommended); or (b) cute toy-sized versions (a small 3 m soccer goal, a short bowling lane), which are smaller and quicker to look at but get redone for the full games.
2. What each station offers: (a) free play plus one short challenge with bronze/silver/gold medals and a saved best score (recommended); (b) free play only, with no goals; or (c) full rules right away for 2-3 favourite games and free play for the rest.
3. Long-distance stations: (a) golf, batting and archery hit out over the sea from the island edge, with floating target greens and distance buoys (balls lost in the water); or (b) fenced ranges on land with nets at the end.
4. How the field is arranged: (a) one tidy sports park around a central plaza where everything is visible (recommended for the miniature); or (b) stations scattered around the island like little secrets to find.
5. Rewards in the practice field for now: (a) medals and best scores only; or (b) small coin rewards too (the coins card already mentions coins for shooting a hoop).

## Practice stations: skeptic
**Holds up:** True
**Confidence:** medium

### Problems

1. **The basketball scoring check gives false baskets. It counts a ball that goes UNDER the rim and pops up inside the hoop as a basket. The '0 disagreements in 2,000 shots' result came only from free throws, which always drop from above, so the test never reached this case.**
   - Evidence: My test (scratch folder, not saved) plan2/verify-stations/probe.mjs (A2) used the researcher's unchanged kernel. 19,258 random shots came from all around the hoop (1-7 m away, 25-65 degrees, ±4% speed). The trigger scored 2,135 of them, and 676 of those (31.7%) never passed down through the rim. 581 never rose above the rim at all; 95 came in under it from the side. The researcher's own 'independent check' was the correct two-level rule. The trigger only checks one level, 15 cm below the rim.
   - Fix: Use a two-level trigger: the ball 'arms' when its centre passes down through the rim level inside the ring, and scores when it then passes the lower level. I tested this in fixes.mjs (F1) on the same 19,258 shots: 1,459 baskets, 0 false. Add a simple net shape later for looks and to catch side entries.

2. **Balls go straight through walls made of world blocks. The kernel only asks VoxelWorld for the floor under the ball, so block walls, cover, sheds and block-built goals and hoops (cards 6 and 8 say these are built from blocks) do not stop a ball. The report says the kernel handles 'bounce on world blocks', but that is true only for floors.**
   - Evidence: probe.mjs (B) built a 2.15 m concrete block wall. Balls at 8, 15 and 25 m/s all passed through it. They climbed up through it step by step, because groundBelow keeps returning a higher block top inside the wall, then flew out the other side (end positions z = -13.9, -21.6 and -35.6 m, with the wall at z = -4.7 m).
   - Fix: Push the ball out of every solid 10.75 cm cell it overlaps, using the closest point on the cell's box, in every direction, not just down. I tested this in fixes.mjs (F2): all three speeds bounced off. Cost in Chromium: 3.1 µs per step unthrottled and 12.7 µs at 4x throttle (floor-only was 1.0 and 4.9).

3. **Small, fast projectiles (arrows, darts, paintball pellets) cost 30-40 times more than the report says. The kernel's automatic sub-step rule ('never move more than half a radius') explodes for tiny radii.**
   - Evidence: Measured in Chromium at 4x CPU throttle (results-bench-browser.json): an arrow (55 m/s, r = 4 mm) gets 230 sub-steps per step and costs 180 µs per step; a paintball pellet (90 m/s) gets 175 sub-steps and costs 158 µs; a basketball costs 4.9 µs. Ten pellets in flight cost about 3.2 ms per 60 fps frame, against the report's 'about 10 balls ... about 0.08 ms per frame'. In Node with VoxelWorld ground an arrow costs 70 µs per step.
   - Fix: Add a 'ray mode' for small projectiles. Each step is one swept segment, tested against shapes and against block cells with the standard voxel walk (Amanatides & Woo 1987). I tested this in fixes.mjs (F3): arrow with drop compensation = 10, dart at triple 20 = 60, pellet stopped by block cover, 0 of 60 pellets through a 1 cm net at 90 m/s. Cost 1.5-1.7 µs per step at 4x throttle, about 100 times cheaper.

4. **Gravity is applied with a simple step method, so balls fly slightly low, and how low depends on how many sub-steps a shot happened to get. This is small for balls but large enough to matter for darts.**
   - Evidence: bias.mjs: a free throw aimed exactly at the rim centre arrives at 3.011 m instead of 3.050 m (3.9 cm low). My first version of ray mode used the same method and turned a triple-20 dart into a single 20 (the triple ring is 8 mm wide). It scored 60 once I used the exact formula.
   - Fix: Use the exact constant-gravity update, a one-line change (position += velocity*dt + ½*gravity*dt², then update velocity). The path then no longer depends on the sub-step count.

5. **The 'scored correctly in 3,500 random shots' claim is overstated. The 'independent check' rebuilt the same geometric rule and ran it on the same narrow set of shots, so it only shows consistency, not correctness.**
   - Evidence: tests.mjs: the free throws are all 52°±3° from the line, and the soccer truth check repeats the trigger's own frame test. A broader set of shots (A2 above) breaks the basketball trigger.
   - Fix: Test each station with broad random shots (all angles, low shots, rim hits) plus rule checks such as 'never scores unless the ball came down through the rim', and keep a few golden scripted shots as regression tests.

6. **The challenges are invented practice rules ('around the world', '3 barrels in 5 throws', '3 deep hits from 10 pitches', '25+ with 3 arrows', 'beat 60 with 3 darts'), even though many minigame cards already define a short single-player round. Writing separate practice rules means two rule sets per game, and the practice ones get replaced later.**
   - Evidence: docs/MINIGAMES.md. Basketball: 60-second round, 2 points close, 3 behind the line, money ball (card 6). Football: 60 s or a set number of throws (card 7). Baseball: 10 pitches scored by zone (card 9). Archery: 10 arrows (card 10). Darts quick mode: highest score in 10 darts (card 11). Skee-ball: 9 balls (card 13). Soccer: 5 kicks with a diving goalie (card 8).
   - Fix: For those 7 games, make the station's challenge the card's own solo round (no lobby, NPCs or multiplayer), with bronze, silver and gold set as score thresholds. Only bowling (1-3 frames), golf (range), frisbee (1 hole), mini golf (3 holes), billiards (solo trick rack) and paintball (gallery) need cut-down versions. Soccer needs the scripted goalie in the first version, because shooting at an empty goal is not a real test.

7. **The basketball footprint (11 x 8 m half-court) is too small for the 3-point line that card 6 asks for.**
   - Evidence: FIBA 3-point arc: 6.75 m from the basket (6.60 m in the corners), with the basket 1.575 m from the end line. That needs roughly 14-15 m x 10 m. These numbers are from my own knowledge and were not fetched this session.
   - Fix: Either make the pad about 15 x 10 m (about 60 m² more), or follow card 6's arcade style: one lane with a close spot and a short 3-point line. The combined goal-and-hoop unit in missed_options also covers this.

8. **'Loose balls at every station, carried off and kicked around the field' is described as almost free, but it needs walking, picking up, carrying and kicking, plus the hit system (WORLD-RULES C2), and none of these exist yet.**
   - Evidence: Diagnostic of 22 Nov: the avatar cannot walk, and motion-core has no jump, gravity or collision. MINIGAMES A12 puts the movements a game needs into the movement plan.
   - Fix: Leave loose balls out of the first version. Add them after walking and pick-up return.

9. **'Batches 1-4 (13 games) need no new avatar movement' is only true for a placeholder version. Every station eventually needs a throw, kick, swing, bowl, putt, cue stroke or bow draw, and those are avatar movements, which are Claude's area and part of the movement plan.**
   - Evidence: MINIGAMES A12 and A13; docs/COLLABORATION.md (character movement and animation are Claude's).
   - Fix: Say it plainly: stations can be built and tested with the avatar standing still and the ball launched from the hand position. Each station's movement is added to the movement plan later.

10. **The plan builds 5 batch-1 stations before anything is tested on the owner's iPhone. The riskiest unknowns (touch aiming, station camera, challenge runner, getting to a station without walking) are shared by every station.**
   - Evidence: The report's own risks: touch controls for about 15 aiming stations are unproven, every station needs a camera preset, and walking is missing. Each publish waits 6-10 minutes.
   - Fix: Make the first milestone a vertical slice of only the owner's own example: one hoop next to one goal, with the foundation pieces. Expand batch by batch only after the owner has tested it on the phone.

11. **The world store the kernel relies on (VoxelWorld keeps every 10.75 cm cell in one Map) is heavy at practice-field size, and much heavier for an island that also holds 6 tracks. This belongs to the world/terrain topic, but the stations depend on it.**
   - Evidence: probe.mjs (D): one 43 cm layer of the proposed 46 x 64 m field = 15,943 blocks = 1,020,352 cells, about 45 MB of heap, 409 ms to build in Node. Not measured on an iPhone.
   - Fix: Stations should talk to the world through a small query interface (ground height and material, solid cell, ray hit), so the world storage can switch to coarser blocks, chunks or a heightfield without touching station code. Flag this to whoever owns the world rulebook (Claude, per WORLD-RULES A1).

12. **Mini golf is inconsistent: the station card says the 2D rolling system, but the cup test ran on the 3D ball kernel.**
   - Evidence: tests.mjs test 5 uses stepBall from ball3d.mjs; the station card for mini golf says 'rolling system + cup capture'.
   - Fix: Use the 3D kernel for mini golf and full golf: it already rolls, captures the ball in the cup, and can add slopes later. Keep the 2D disc system only where many balls touch each other (billiards, bowling pins), or add ball-to-ball contact to the 3D kernel and have one kernel.

13. **The physics engine comparison left out two maintained WebAssembly engines that are smaller than Rapier.**
   - Evidence: npm view and gzip -9 in my folder: jolt-physics 1.1.2, MIT, updated 2026-11-21, wasm 2,027,832 bytes (747,158 gzipped); @babylonjs/havok 1.3.14, MIT, updated 2026-09-07, wasm 2,094,563 bytes (658,471 gzipped). Rapier 0.21.0 is 1,168,722 gzipped. Neither was tested with bowling pins.
   - Fix: If bowling ever needs an engine, compare Jolt and Havok with Rapier, using the same pin test and a real-phone load test.

14. **Saved best scores could disappear on the owner's iPhone.**
   - Evidence: WebKit's 7-day cap on script-writable storage (the 2020 post 'Full Third-Party Cookie Blocking and More', webkit.org/?p=10218, seen only through search snippets and mirrors) clears localStorage for a site not visited for 7 days of Safari use. Home Screen web apps reportedly keep their own counter.
   - Fix: Low risk. Mention it to the owner, add the page to the Home Screen if needed, and move records to an online save when online play arrives.

### Factual errors
1. Summary: 'bowling ran at the same cost with or without an engine'. The report's own data contradicts this: at 4x throttle cannon-es takes 1.58 ms per step and Rapier 1.25 ms, against 0.008 ms for the 2D discs (results-bowling-browser.json). The two engines cost about the same as each other, not the same as no engine.
2. P4 pros: 'about 400x cheaper than the engines'. The report's own numbers give 156-198x at 4x throttle (1.25/0.008, 1.58/0.008) and 155-170x unthrottled. The 'why' section's '150-200x' is the correct figure.
3. Summary: 'one ... system ran six different stations ... (hoop, goal, barrels, frisbee basket, skee-ball, archery and darts)'. That list names seven, and the mini-golf cup makes eight station builders.
4. 'Stations 1,884 m²' includes the 196 m² plaza and the 108 m² golf flight lane. Actual stations are about 1,580 m². The field total of 2,944 m² is correct.
5. 'It scored correctly in 3,500 random shots' is overstated. It only checks agreement with a near-copy of the same rule on narrow shot sets. Broader shots give 676 false baskets out of 2,135 (probe A2).
6. Physics P1: the kernel 'handles ... bounce on world blocks'. Only floors are handled. Balls pass through block walls at 8-25 m/s (probe B).
7. Physics P1: 'about 10 balls at 120 Hz cost about 0.08 ms per frame' holds only for large, slow balls. Arrows and pellets cost 158-180 µs per step at 4x throttle, so 10 pellets take about 3.2 ms per frame.
8. 'Batches 1-4 (13 games) need no new avatar movement' is true only with a standing-still placeholder. Throw, kick, swing, bowl, putt, cue and bow-draw movements are still needed (MINIGAMES A12).
9. Checked and correct: Rapier 0.21.0 published 2026-09-25, Apache-2.0, wasm 3,082,103 bytes / 1,168,722 gzipped; cannon-es 0.20.0 last modified 2022-08-12, MIT; three.js 0.180 module + core 78,879 + 100,338 bytes gzipped; arrow drop 52.5 cm; dartboard ring geometry and sector order; area arithmetic and 0 overlaps; the old repo's DECISIONS entries of 4 Nov (13-station snake), 11 Nov (yard) and 13 Nov (160 m island, one plot each). Wii Sports Resort 3-Point Contest (60 s, 5 racks of 5, 2-point bonus ball, maximum 30) and Mario Kart World's 394 missions match fan sources only, as the report itself said.

### Missed options
1. A combined goal with a hoop above it, a standard piece of street-sports equipment for multi-use games areas (MUGAs). This is exactly the owner's 'little hoop right next to a soccer net'. Examples: the Zaun CombiGoal (3 m x 2 m goal, basket at 3.05 m), the Kompan Multi Goal (3 x 2 m goal sized to FIFA futsal and IHF handball rules, hoop at NBA height) and the Proludic Large Multi Goal (10.2 x 2.61 m footprint). All of these come from search snippets; the product sites could not be fetched from this session. A futsal goal is a real regulation goal, so the soccer station is both real-size and small. One unit on a pad of about 12 x 12 m replaces the report's separate 16 x 14 m penalty pad and 11 x 8 m half-court (312 m²). The futsal penalty mark is 6 m, from my own knowledge and not verified this session.
2. Use each card's own short solo round as the challenge (basketball, football, baseball, archery, darts, skee-ball, soccer) instead of inventing practice rules, so each game has one rule set.
3. A vertical slice first: only the hoop and goal, plus the foundation, tested on the iPhone before any other station is built.
4. Proven phone touch-input families: flick/swipe shooting, where one gesture sets direction, power and curve with no aim line (Flick Kick Football's App Store listing; MobyGames keeps a 'Gameplay mechanic: Flick shooting' game group), pull-back-and-release, and a timing meter. One input module with these three modes fits MINIGAMES A14 (the owner picks controls after testing), and flick also fits A15 (no aim lines). This is design research only; nothing was tested on a phone.
5. Ray mode with a voxel walk for arrows, darts and pellets: the standard projectile method, about 100 times cheaper, and tested here.
6. Jolt (0.75 MB gzipped, MIT, maintained) and Havok (0.66 MB gzipped, MIT) as smaller engine candidates than Rapier, if bowling ever needs one.
7. A station-select menu or teleport as a permanent quick-access feature, not just a stopgap. It removes the dependency on walking and saves the owner time when testing one station on the phone.
8. Let the practice field also serve as the place automated tests run, as the old yard did in 3D-WORLD-3 (DECISIONS 13 Nov, item 3), with tests reading named station spots.
**Retest:** All my work is in (scratch folder, not saved) plan2/verify-stations.

(1) I copied the researcher's ball3d.mjs, stations.mjs and tests.mjs unchanged into rerun/ and ran them. Every number matched: 545 makes with 0 mismatches, 795 goals, 33/60 and 34/60 tunnelling, triple 20 = 60, bull = 50, and so on.

(2) probe.mjs, using the unchanged kernel and real VoxelWorld:
- A2: 19,258 shots from all around the hoop. The trigger scored 2,135, of which 676 (31.7%) never went down through the rim. 581 never rose above it.
- B: a 2.15 m block wall. Balls at 8, 15 and 25 m/s all went through it.
- C: sub-steps per step. Basketball 1, arrow 230, pellet 175, dart 47. Arrow 70 µs per step in Node with VoxelWorld.
- D: one 43 cm layer of the 46 x 64 m field = 1,020,352 cells, about 45 MB of heap, 409 ms to build.

(3) fixes.mjs:
- Two-level hoop trigger: 1,459 baskets, 0 false.
- Ball pushed out of block cells: no ball passes the wall.
- Ray mode with exact gravity: arrow 10, dart 60, pellet stopped by block cover, 0/60 through a 1 cm net at 90 m/s.

(4) bias.mjs: a free throw aimed at the rim centre arrives 3.9 cm low (3.011 m vs 3.050 m).

(5) Chromium through Playwright, unthrottled and with the CDP 4x CPU throttle (results-bench-browser.json), per step at 4x:
- Kernel: basketball 4.9 µs, arrow 180 µs, pellet 158 µs.
- Ray mode: arrow 1.71 µs, pellet 1.52 µs.
- Ball pushed out of block cells: 12.7 µs.
These are CPU numbers with no drawing, so SwiftShader is not involved. They are not from a real iPhone.

(6) npm view and gzip -9:
- Confirmed: Rapier 0.21.0 (2026-09-25, Apache-2.0, 1,168,722 bytes gzipped), cannon-es 0.20.0 (2022-08-12, MIT), three.js sizes.
- Added: Jolt 747,158 bytes gzipped and Havok 658,471 bytes gzipped, both MIT.

(7) Web searches:
- Confirmed from fan sources: Wii Sports Resort 3-Point Contest details, Mario Kart World's 394 missions.
- Found: combined goal-and-hoop units, flick-shooting mobile controls, and the Safari 7-day storage cap (secondhand).
- proludic.com could not be fetched: the host is not allowed in this session's network.

Not tested: touch input on a phone, any visuals, bowling with Jolt or Havok, real-iPhone memory.
**Improved recommendation:** Keep the researcher's main plan, because it holds up. Each station gives free play plus one short challenge, with bronze, silver and gold medals and a saved best score. Stations sit in one compact sports park around a plaza. The first version uses no physics engine, only small hand-written ball systems. But change six things before building:

1. Start with exactly the owner's own picture, and nothing else. Use one combined soccer goal with a basketball hoop above it, a standard piece of equipment in real street sports cages: a 3 x 2 m futsal goal with the hoop at the real 3.05 m height, on a pad of about 12 x 12 m. Around it, build the shared foundation: the challenge runner, one aim-and-power input with 2-3 phone control styles to try (flick, pull back and release, timing meter), a camera for the station, and a 'go to station' button so nobody has to wait for walking. The owner tests this on the iPhone before any other station is built.

2. Use each game's own short round as its challenge wherever the card already has one: basketball's 60-second round, football's 60 seconds, baseball's 10 pitches, archery's 10 arrows, darts' 10-dart quick mode, skee-ball's 9 balls, and soccer's 5 kicks against a simple scripted goalie. Medals are score targets. Each game then has one set of rules that later grows into the full game. Only bowling, golf, frisbee golf, mini golf, billiards and paintball need cut-down practice versions.

3. Fix the ball system before building stations on it. All four fixes were tested here and are small:
- Baskets only count if the ball comes down through the rim (the current check gave false baskets on about 3 in 10 scores from low shots).
- Balls bounce off block walls, not just floors (today they fly through walls).
- Arrows, darts and paint pellets use a cheap straight-line check (about 100 times cheaper than now).
- Gravity uses the exact formula, so darts land where they are aimed.

4. Leave 'loose balls you can carry around the field' until walking and picking things up are back, because they are not free.

5. Then add the other stations in the researcher's batches, which group them by what the ball does: target games, things that stick, table and lane games, hitting with a tool. The walking, jumping and riding stations stay in the plan and wait for avatar movement. Every station starts with the avatar standing still. Its throw, kick or swing movement goes on the movement list for later.

6. Keep stations independent of how the world stores its blocks. The current block store would use about 45 MB for one layer of the field alone, so the world owner will probably need a lighter store before the island is built.

Owner decisions still needed:
- Combined goal and hoop, or a separate full-size goal and court?
- Gear size: real size (recommended, since changing it later is mostly a number change) or toy size?
- Long ranges shooting out over the sea, or fenced ranges on land?
- Medals only, or coins too?

Coordination needed: who builds the shared ball system (Codex is the recommended lead for minigame systems), and whether the practice field is the first real game page rather than a lab page under CLAUDE.md rule 16.

If bowling pins ever look fake, test Jolt or Havok (0.66-0.75 MB) next to Rapier (1.17 MB) on a real phone.

## Physics engine benchmark: research
**Question:** Which physics approach should the island's minigame stations and ragdoll goals use, alongside the existing hand-written kart physics and character controller?
**Summary:** I tested 8 options on the same 5 test scenes, in Node and in headless Chrome slowed down 4x to act like a phone: our own hand-written code, Rapier (3 builds), Jolt, Havok, cannon-es, Bounce and crashcat. Every engine that compiles to WebAssembly (Rapier, Jolt, Havok) was fast enough. A realistic practice field, with one basketball, 10 bowling pins and one ragdoll, costs about 0.1 to 0.3 ms per physics step at 4x slowdown, a small slice of a phone's 16.7 ms frame. Havok was the fastest and smallest download. But its code is closed (only the compiled file is free to use, under the MIT licence), its own documentation is written around Babylon.js, and it needs iOS 16.4 or newer. cannon-es and Bounce let fast golf balls pass straight through a thin wall (47 of 50 shots), and cannon-es is 4 to 7 times slower on pins. Our own hand-written ball code was the cheapest of all and accurate for balls, but writing pins and ragdolls by hand would take weeks. My recommendation is a hybrid. Keep our own code for karts, walking and the flight and roll of balls. Add Rapier as the one ready-made engine, only for things that tumble and knock into each other: bowling pins, the avatar falling like a ragdoll when hit, and loose props. Put it behind a small adapter, about 60 lines, so we can swap to Havok or Jolt later in about a day if a real iPhone test says so.

### Options

1. **Keep hand-written only (extend the project's own code)**
   - How it works: Our own code moves balls (gravity, bounce, friction, splitting fast moves into small steps so balls cannot skip through walls). Pins and ragdolls would also need our own rigid-body and joint solver, for example the Verlet/constraint method from Hitman (Jakobsen, GDC 2001).
   - Pros: No download and no new dependency. Fastest by far for balls (0.006 ms per step for the hoop at 4x slowdown). Fully tunable for feel. Works directly on the block grid, so rolling balls never catch on the seams between 0.43 m blocks. Matches how racing-core and motion-core are already built.
   - Cons: Tumbling pins, stacked props and ragdolls with joint limits need a real rigid-body solver. Writing and tuning one is weeks of work and risky, and the project wants to save time. My test version could not do pins or joints at all.
   - Evidence: Scratch: engines/hand.mjs (about 110 lines; spheres vs boxes and capsules, ball-ball impulses, speed-based sub-steps). docs/game-dev/05-physics.md B4 already says hand-written is best for core mechanics like the golf ball, basketball arc and kart, and an engine for messy secondary stuff like scattering pins. Jakobsen, Advanced Character Physics: https://gamedeveloper.com/programming/advanced-character-physics
   - Test result: Chromium 4x: 100 balls 0.128 ms per step, hoop 0.006, tunnel 0.004. Golf ball at 70 m/s: 0 of 50 passed through the 2 cm wall. Hoop: 23 balls touched the rim vs 24 expected from geometry. The same run gave identical results every time. Pins and chain: not supported, so not tested. Node vs Chrome gave different results in the hoop scene (Math.hypot differs between the two V8 versions).

2. **Rapier (@dimforge/rapier3d-compat 0.21.0, Rust compiled to WebAssembly)**
   - How it works: An open-source engine compiled to WebAssembly. We create bodies (sphere, box, capsule, cylinder, triangle mesh, compound), joints and a world, and step it at 1/120 s. It has built-in continuous collision for fast objects and a ready-made character controller.
   - Pros: Apache-2.0 and open source, actively released (0.21.0 on 25 Sep 2026). The most common engine in three.js projects: three.js 0.180 ships a RapierPhysics addon, and the project's own docs already pick it for pins, so AI assistants know it best. Uses plain JS objects, so there is no manual memory freeing. Continuous collision verified (0 of 50 tunnelled). Joints stayed tight (0.06 mm error). Same results every run, and Node and Chrome gave bit-identical results. A deterministic build with the same API exists, for future online play or replays. The plain build needs no SIMD (wide iPhone support), and the -compat build needs no Vite setup.
   - Cons: Biggest download: 1,605 KB gzip for compat (wasm inlined), or about 1,148 KB gzip for the separate .wasm. Start-up took 139 to 177 ms at 4x slowdown. About 2x slower than Havok in the 100-ball scene (1.16 vs 0.58 ms at 4x), though not significant at our body counts. It reacts to the rim up to 11 mm before touching (look-ahead contact; tunable).
   - Evidence: node_modules/@dimforge/rapier3d-compat/README.md (lists the main build as locally deterministic only and the -deterministic build as cross-platform deterministic). rapier.rs JS determinism page (search summary only; fetch blocked): https://rapier.rs/docs/user_guides/javascript/determinism . three.js addon: /home/user/3D-World-4/node_modules/three/examples/jsm/physics/RapierPhysics.js (loads rapier3d-compat@0.17.3 from a CDN). Project docs: docs/game-dev/05-physics.md B1, docs/game-dev/06-sports.md item 4 (pins: Rapier). npm view: license Apache-2.0, 0.21.0 published 2026-09-25.
   - Test result: Chromium 4x, ms per step: balls 1.163, hoop 0.046, bowling 0.175, chain 0.061, tunnel 0.036 (Node: 0.338 / 0.017 / 0.055 / 0.011 / 0.007). Pins down: 8 of 10. Hoop: 37 of 50 baskets, 26 rim deflections vs 24 expected. Tunnel: 0 of 50. Chain joint error 0.064 mm. Same results in all 3 runs, and Node = Chrome. The SIMD build was about 35% faster on balls (0.747) but needs Safari 16.4 or newer, and showed one 188 ms stall in the chain scene. The deterministic build matched the standard build bit for bit in every scene and ran within about 15% of its speed (balls 1.317 at 4x).

3. **Havok (@babylonjs/havok 1.3.14, closed-source WebAssembly)**
   - How it works: The commercial Havok engine compiled to WebAssembly and given away by the Babylon.js team. It is used through a low-level HP_* function API (handles plus arrays), without needing Babylon.js.
   - Pros: Fastest in every scene (100 balls 0.577 ms at 4x, bowling 0.057, chain 0.040). Smallest WebAssembly download (658 KB gzip, JS plus wasm). Continuous collision is on without any setting (0 of 50 tunnelled). Most accurate rim contact (reacts only 3.8 mm early, no visible overlap). The LICENSE file in the package is MIT. Same results every run, and Node = Chrome. Fast start-up (94 ms at 4x).
   - Cons: Closed source: only the compiled file is free to use (MIT); the source code is not available. We cannot read or fix the engine, and its future depends on the Babylon.js team. Its documentation and examples are written around Babylon.js, and the raw API is low-level. There is no character controller in the raw API. The binary needs WebAssembly SIMD (my check of the wasm file confirmed this), so iPhones need iOS 16.4 or newer; Babylon forum users report errors on older iOS. Some forum reports of Safari load failures and out-of-bounds memory errors (anecdotal; not checked).
   - Evidence: node_modules/@babylonjs/havok/LICENSE (MIT, Copyright 2023 Babylon.js). Babylon forum thread (search summary: maintainer says Havok is closed source; .wasm usage is MIT): https://forum.babylonjs.com/t/havok-with-babylon-js-license-free-to/59637 . Babylon.js 6.0 announcement: https://blogs.windows.com/windowsdeveloper/2023/04/20/part-1-announcing-babylon-js-6-0/ . Old iOS failing: https://forum.babylonjs.com/t/webassembly-error-havok-project-in-old-ios-device-iphone-6s/40213 . Safari SIMD support from 16.4: https://caniuse.com/wasm-simd
   - Test result: Chromium 4x, ms per step: balls 0.577, hoop 0.014, bowling 0.057, chain 0.040, tunnel 0.026 (Node: 0.173 / 0.004 / 0.014 / 0.006 / 0.003). Pins down: 8 of 10. Hoop: 38 of 50 baskets, 23 deflections vs 24 expected. Tunnel: 0 of 50. Joint error 0.535 mm. Same results in all runs, and Node = Chrome. wabt check: the binary requires simd, bulk_memory and sign_extension.

4. **Jolt (jolt-physics 1.1.1, C++ compiled to WebAssembly)**
   - How it works: The open-source C++ engine used in Horizon Forbidden West, compiled to WebAssembly through emscripten bindings. Objects are created with new Jolt.X() and must be freed by hand with Jolt.destroy().
   - Pros: MIT and open source, very actively maintained (1.1.2 on 21 Nov 2026), now built into the Godot engine. It has the best ragdoll tools: swing-twist joints made for ragdolls, a Ragdoll class, motors that drive a ragdoll toward an animation pose, and the CharacterVirtual controller. Continuous collision verified (0 of 50). Mid-size download (932 KB gzip compat). Same results every run, and Node = Chrome.
   - Cons: Manual memory management: in my test, 2 million temporary vectors created without Jolt.destroy() permanently lost about 53 MB, a real risk in AI-written code. The API is long-winded (layer setup, settings objects). Slowest start-up (418 ms at 4x). Slowest WebAssembly engine on 100 balls (1.743 ms at 4x). It deflects balls off the rim up to 19.6 mm before contact (look-ahead contact combined with bounciness; tunable). The multithreaded build cannot run on GitHub Pages, which cannot send the cross-origin isolation headers threads need.
   - Evidence: node_modules/jolt-physics/README.md (SIMD off by default except in multithread builds; CROSS_PLATFORM_DETERMINISTIC is a build option). node_modules/jolt-physics/dist/types.d.ts (SwingTwistConstraintSettings, RagdollSettings, Ragdoll, CharacterVirtual, SkeletalAnimation). Guerrilla: https://www.guerrilla-games.com/read/architecting-jolt-physics-for-horizon-forbidden-west . Godot 4.4 built-in Jolt: https://docs.godotengine.org/en/4.4/tutorials/physics/using_jolt_physics.html . PlayCanvas (only the Rapier and Jolt web bindings are maintained by the engine authors): https://developer.playcanvas.com/user-manual/physics/ammo-alternatives/
   - Test result: Chromium 4x, ms per step: balls 1.743, hoop 0.026, bowling 0.173, chain 0.057, tunnel 0.032 (Node: 0.407 / 0.004 / 0.036 / 0.011 / 0.004). Pins down: 8 of 10. Hoop: 36 of 50 baskets, 25 deflections vs 24 expected, earliest deflection 19.6 mm before contact. Tunnel: 0 of 50. Joint error 0.319 mm. Deterministic, and Node = Chrome. Memory test (jolt-leak.mjs): free wasm memory fell from 126.9 MB to 73.5 MB.

5. **cannon-es 0.20.0 (pure JavaScript)**
   - How it works: A pure JavaScript rigid-body engine (a fork of cannon.js). It needs no WebAssembly and has no start-up delay.
   - Pros: Tiny (36 KB gzip), instant start, simple API, MIT.
   - Cons: No continuous collision: 47 of 50 golf balls went through the 2 cm wall. The basketball sank 35 mm into the rim before being pushed out. 4 to 7 times slower than Rapier on pins and chains at 4x. Last npm release was 12 Aug 2022. Results differed between Node's and Chrome's JavaScript engines.
   - Evidence: npm view cannon-es: 0.20.0, last modified 2022-08-12, repository github.com/pmndrs/cannon-es. cannon.js has no real CCD: https://github.com/schteppe/cannon.js/issues/202 . docs/game-dev/05-physics.md B2.
   - Test result: Chromium 4x, ms per step: balls 3.076, hoop 0.041, bowling 1.302, chain 0.501, tunnel 0.012. Pins down: 6 of 10. Tunnel: 47 of 50 passed through. Rim: deepest overlap 34.9 mm. Same results within one JS engine, but Node and Chrome results differed in 4 of 5 scenes.

6. **Bounce (@perplexdotgg/bounce 1.10.0, pure TypeScript)**
   - How it works: A new pure-TypeScript engine inspired by Jolt and Rapier, which says it is deterministic. The official three.js ball-pool example uses it.
   - Pros: Small (72 KB gzip), no WebAssembly, MIT, can save and restore the world state. The tightest joints in my test (0.007 mm). Fine speed for small scenes.
   - Cons: The slowest engine on many bodies (100 balls 6.29 ms at 4x). No continuous collision (47 of 50 tunnelled). Balls sank 14 mm into the floor (its default penetration allowance). Its joint list has no cone or swing-twist limits for ragdolls. Speed is capped at 30 m/s by default. Two authors. Results differed between Node's and Chrome's JavaScript engines.
   - Evidence: node_modules/@perplexdotgg/bounce/README.md and docs/documentation.md (Point, Distance, Fixed and Hinge constraints; maxLinearSpeed 30 by default). https://codeberg.org/perplexdotgg/bounce
   - Test result: Chromium 4x, ms per step: balls 6.288, hoop 0.040, bowling 0.390, chain 0.212, tunnel 0.021. Pins 6-7 of 10 (Node vs Chrome). Tunnel 47 of 50. Floor sink: minimum ball height 0.1057 m for a 0.12 m radius. Not identical between Node and Chrome.

7. **crashcat 0.0.5 (pure JavaScript, Jolt-style design)**
   - How it works: A brand-new pure-JS engine modelled on Jolt. It has continuous collision, 8 joint types (including swing-twist), a kinematic character controller, and can be trimmed to only the parts used.
   - Pros: Surprisingly fast for pure JS (bowling 0.169 ms and chain 0.051 ms at 4x, close to Jolt). 126 KB gzip with every feature included. Continuous collision verified (0 of 50).
   - Cons: Version 0.0.5 from October 2026 with one maintainer, far too young. Its README says determinism is 'not deeply tested yet', and my test confirmed it: the tunnel scene gave three different results in three identical runs. It shares Jolt's 19.6 mm early rim deflection.
   - Evidence: node_modules/crashcat/README.md (features list; Determinism section). npm view: 0.0.5, 2026-10-30.
   - Test result: Chromium 4x, ms per step: balls 1.654, hoop 0.012, bowling 0.169, chain 0.051, tunnel 0.016. Pins 7 of 10. Tunnel 0 of 50. Not deterministic: tunnel hashes 05fb3ce5 / 4f5850a7 / 57f38b26 in one process.

8. **ammo.js, oimo.js / OimoPhysics, PhysX (researched, not benchmarked)**
   - How it works: ammo.js is an old Bullet port to JavaScript/WebAssembly. Oimo is a small pure-JS engine. PhysX is NVIDIA's engine, available through physx-js-webidl.
   - Pros: ammo.js has many features (soft bodies, vehicles). PhysX is powerful and its bindings are current (2.9.1, Oct 2026).
   - Cons: ammo.js: the npm 'ammo.js' package is 0.0.10 from 2022 with no licence field; the project's own docs call it legacy; PlayCanvas recommends alternatives. oimophysics: npm printed 'Package no longer supported' on install. PhysX: 10.4 MB unpacked and heavy to integrate; no three.js-world adoption evidence found.
   - Evidence: npm view outputs in this session; install warning for oimophysics@1.2.2; docs/game-dev/05-physics.md B3; https://developer.playcanvas.com/user-manual/physics/ammo-alternatives/
   - Test result: not tested: each is legacy, deprecated or much heavier, and stronger maintained options covered the same needs.

### Tests run

1. **Same 5-scene benchmark for 9 builds (hand-written, rapier3d-compat, rapier3d-simd-compat, rapier3d-deterministic-compat, jolt wasm-compat, havok, cannon-es, bounce, crashcat) in Node 22 (V8 12.4)**
   - How: An engine-neutral adapter per engine (scratch engines/*.mjs, about 10 functions each) runs scenes.mjs: (1) 100 balls in a 3x3 m box, 1,000 steps; (2) basketball dropped 50 times through a 24-capsule rim ring (0.457 m inside diameter), 60 steps each; (3) 10 cylinder pins hit by a 7 kg ball at 8 m/s, 1,000 steps; (4) 10 capsules joined by ball joints falling onto the floor, 1,000 steps; (5) extra: 50 golf balls at 70 m/s fired at a 2 cm wall. Fixed dt 1/120 s. Only the step call is timed. 3 runs each; the 3rd run is reported. Materials, damping and continuous-collision flags were matched where the APIs allow.
   - Result: All scenes ran on every engine that supports them. Node ms per step for 100 balls: havok 0.173, rapier-simd 0.250, rapier-det 0.319, rapier 0.338, crashcat 0.387, jolt 0.407, cannon 0.641, bounce 1.887, hand 0.034. Full results: scratch node-all.json.
   - Limits: A desktop Xeon at 2.1 GHz, not a phone. Simplified shapes (pins as cylinders, rim as a capsule ring, a chain instead of a full ragdoll with joint limits). Mostly default engine settings. The hand-written balls have no spin.

2. **The same benchmark in headless Chromium 157, normal speed and with CPU throttling rate 4**
   - How: esbuild bundles per engine (web/*.js), served locally with COOP/COEP headers (crossOriginIsolated=true, giving fine-grained timers). Playwright with a CDP Emulation.setCPUThrottlingRate {rate: 4}, a fresh browser context per engine.
   - Result: At 4x, ms per step (balls / hoop / bowling / chain / tunnel): hand 0.128/0.006/-/-/0.004; rapier 1.163/0.046/0.175/0.061/0.036; rapier-simd 0.747/0.080/0.247/0.250/0.035; rapier-det 1.317/0.053/0.201/0.046/0.027; jolt 1.743/0.026/0.173/0.057/0.032; havok 0.577/0.014/0.057/0.040/0.026; cannon 3.076/0.041/1.302/0.501/0.012; bounce 6.288/0.040/0.390/0.212/0.021; crashcat 1.654/0.012/0.169/0.051/0.016. Results: scratch browser-all.json.
   - Limits: No drawing was involved, so SwiftShader did not affect these numbers; they are CPU-only. 4x throttling of a Xeon is a rough proxy: recent iPhones may be faster, and Safari's JavaScriptCore engine was NOT tested, because WebKit is not installed here and installing browsers was not allowed. One 188 ms stall was seen once (rapier-simd chain, at 4x).

3. **Accuracy checks: tunnelling, rim contact, pins, joint drift**
   - How: Tunnel: count balls ending behind the wall. Hoop: a deflection is any sideways movement over 0.5 mm, compared with 24 rim touches expected from the geometry; also the gap at the first deflection and the deepest overlap. Pins: tilt over 30 degrees counts as down. Chain: largest gap between joint anchor points after 1,000 steps.
   - Result: Tunnelled (of 50): 0 for hand, Rapier (all builds), Jolt, Havok and crashcat; 47 for cannon-es and Bounce. Earliest rim deflection: hand 2 mm, Havok 3.8 mm, Rapier 11 mm, Jolt/Bounce/crashcat 19.6 mm. cannon-es overlapped the rim by up to 34.9 mm. Baskets made: 35 to 39 of 50 across engines. Pins down: 8 for Rapier, Jolt and Havok; 6 to 7 for cannon-es, Bounce and crashcat. Joint error: 0.007 mm (Bounce) to 0.535 mm (Havok).
   - Limits: No real-world reference data for the pin result. Distances are measured to a perfect circle, while the rim is a 24-sided ring (about 2 mm difference).

4. **Determinism**
   - How: A hash of the bit-exact final positions and rotations. 3 runs in the same process, then Node vs Chromium. Re-ran the minified bundles in Node to rule out bundling as the cause.
   - Result: Same results in all 3 runs for every engine except crashcat (3 different tunnel results). The WebAssembly engines (Rapier, Jolt, Havok) gave bit-identical results in Node and Chrome. The pure-JS engines (cannon-es, Bounce, crashcat, and the hand-written hoop) did not, and the bundles run in Node reproduced the Node hashes, so the difference comes from the two V8 versions (most likely their Math functions). Rapier standard and deterministic builds gave identical results.
   - Limits: Only two V8 versions on x86 were compared. Safari and ARM phones were not tested, so cross-platform determinism is not proven here.

5. **Download size**
   - How: esbuild minified bundles containing only the engine and its adapter, plus gzip -9 and brotli 11 (scratch sizes.mjs).
   - Result: gzip: hand 1 KB; cannon-es 36 KB; bounce 72 KB; crashcat 126 KB; havok 658 KB (js + wasm); jolt wasm-compat 932 KB (separate-wasm build 870 KB); rapier3d-compat 1,605 KB; rapier3d separate .wasm about 1,148 KB (wasm only); rapier-simd-compat 1,604 KB; rapier-deterministic-compat 1,612 KB.
   - Limits: GitHub Pages serves gzip; brotli is shown for reference. The Rapier separate-wasm figure leaves out its JS glue.

6. **WebAssembly features each binary needs (affects which iPhones work)**
   - How: wabt readWasm + validate with each feature switched off in turn (scratch wasm-features.mjs).
   - Result: Havok requires simd, bulk_memory and sign_extension, so Safari/iOS 16.4 or newer. rapier3d-compat, rapier3d-deterministic-compat and jolt (non-simd) need bulk_memory, sign_extension and sat_float_to_int, with no SIMD. rapier-simd requires simd.
   - Limits: Jolt's wasm-compat inlined binary was assumed to match its separate .wasm build (the README says SIMD is off by default for single-thread builds).

7. **Manual memory risk in Jolt**
   - How: Created 2,000,000 Jolt.Vec3 objects without Jolt.destroy() and read JoltInterface.sGetFreeMemory (scratch jolt-leak.mjs).
   - Result: Free wasm memory fell from 126.9 MB to 73.5 MB and was never recovered.
   - Limits: A synthetic test, but it shows the kind of bug AI-written code could easily introduce.

### Recommendation
**Choice:** Hybrid. Keep the hand-written kart physics (racing-core) and character controller (motion-core plus src/world/collision.ts). Build the shared ball system (WORLD-RULES C1) as our own code: flight with drag and spin, bounce and roll using the block rulebook values, sub-steps against fast-ball tunnelling, and simple exact shapes for fixed station parts (rim, backboard, posts, cup). Add Rapier (@dimforge/rapier3d-compat 0.21.0, plain non-SIMD build) as the single rigid-body engine for things that tumble or are jointed: bowling pins and the bowling ball, ragdoll falls and hits (the hit system, WORLD-RULES C2), and loose props. Load it in the background after the first frame. Put it behind a small physics adapter (the scratch engines/*.mjs pattern) so Havok or Jolt can replace it without touching game code.
**Why:** (1) Speed does not decide it: a realistic practice field (1 ball, 10 pins, 1 ragdoll) measured about 0.28 ms per step at 4x slowdown with Rapier, 0.26 with Jolt and 0.11 with Havok. At 2 steps per 60 fps frame, that is under 0.6 ms of a 16.7 ms frame. (2) Safety and accuracy: Rapier had 0 of 50 tunnelling, stable joints (0.06 mm), the same results every run, and identical results in Node and Chrome. cannon-es and Bounce failed the tunnelling test (47 of 50). (3) Lowest risk for an owner who builds through AI assistants: open source (Apache-2.0); no manual memory freeing, unlike Jolt where my test lost 53 MB; the most examples in the three.js world (three.js ships a Rapier addon), and the project's own docs already pick Rapier for pins. The plain build has no SIMD requirement, unlike Havok, and needs no Vite setup in its -compat form. A deterministic build with the same API is ready for online play later. (4) Hand-written ball code was 10 to 100 times cheaper than any engine and avoids rolling balls catching on the seams between 0.43 m blocks. Golf and mini golf need custom drag and spin anyway, so keeping the ball system our own saves tuning time. (5) Writing pins and ragdolls by hand would cost weeks; the engine gives them in days.
**Confidence:** medium
**Conflicts with confirmed decisions:** None of the confirmed game decisions are overridden. It does add a third runtime dependency (today only three@0.180.0 and cdt2d), which the owner should approve. It keeps 'game logic separate from drawing', because Rapier runs without three.js. It fits the rigid ragdoll avatar (one rigid body per rigid limb) and the frozen driving checkpoints, since racing-core is untouched. WORLD-RULES C1 'one ball system' holds: the ball system stays one module, and for bowling its forces are applied to a Rapier ball, because that ball must hit pins. Ownership: per docs/COLLABORATION.md, Codex is the recommended lead for minigame systems and Claude for ragdoll and avatar falls, so the adapter should be agreed as shared code.
**What would change it:** A real-iPhone test where Rapier's 1.1 to 1.6 MB download or 140 to 180 ms start-up hurts: switch to Havok (658 KB, 2x faster) through the adapter, accepting closed source and iOS 16.4 or newer. If the owner wants active ragdolls that try to keep their balance or follow animation poses: Jolt's Ragdoll and motor tools become worth its manual-memory cost. If online lockstep or rollback networking is chosen: swap to @dimforge/rapier3d-deterministic-compat (same API; about 15% slower in my test). If Safari/JavaScriptCore numbers come out very different from Chrome's: re-run scenes.mjs there before committing.

### Key numbers
1. ms per physics step, Chromium with 4x CPU throttle (balls100 / hoop / 10 pins / 10-body chain / golf-ball tunnel): hand-written 0.128 / 0.006 / n/a / n/a / 0.004 | rapier-compat 1.163 / 0.046 / 0.175 / 0.061 / 0.036 | rapier-simd 0.747 / 0.080 / 0.247 / 0.250 / 0.035 | rapier-deterministic 1.317 / 0.053 / 0.201 / 0.046 / 0.027 | jolt 1.743 / 0.026 / 0.173 / 0.057 / 0.032 | havok 0.577 / 0.014 / 0.057 / 0.040 / 0.026 | cannon-es 3.076 / 0.041 / 1.302 / 0.501 / 0.012 | bounce 6.288 / 0.040 / 0.390 / 0.212 / 0.021 | crashcat 1.654 / 0.012 / 0.169 / 0.051 / 0.016 (source: scratch browser-all.json)
2. ms per step in Node, no throttle (same order): hand 0.034 / 0.001 / - / - / 0.001 | rapier 0.338 / 0.017 / 0.055 / 0.011 / 0.007 | rapier-simd 0.250 / 0.013 / 0.038 / 0.010 / 0.007 | rapier-det 0.319 / 0.015 / 0.055 / 0.013 / 0.009 | jolt 0.407 / 0.004 / 0.036 / 0.011 / 0.004 | havok 0.173 / 0.004 / 0.014 / 0.006 / 0.003 | cannon 0.641 / 0.010 / 0.273 / 0.130 / 0.003 | bounce 1.887 / 0.010 / 0.089 / 0.035 / 0.006 | crashcat 0.387 / 0.005 / 0.040 / 0.013 / 0.006 (source: scratch node-all.json)
3. Practice-field estimate at 4x (hoop + pins + chain, per step): havok 0.11 ms, jolt 0.26 ms, rapier 0.28 ms, bounce 0.64 ms, cannon-es 1.84 ms (sum of the measured rows above)
4. Golf ball at 70 m/s vs a 2 cm wall, tunnelled out of 50: 0 for hand, Rapier (all builds), Jolt, Havok and crashcat; 47 for cannon-es and 47 for Bounce (scratch scenes.mjs sceneTunnel)
5. Basketball rim: 24 touches expected from geometry. Measured deflections: hand 23, Havok 23, cannon 23, Jolt/Bounce/crashcat 25, Rapier 26. Earliest deflection before contact: hand 2 mm, Havok 3.8 mm, Rapier 11 mm, Jolt/Bounce/crashcat 19.6 mm. cannon-es overlapped the rim by 34.9 mm. Baskets made: 35 to 39 of 50
6. Bowling (pocket hit at 8 m/s): 8 of 10 pins down for Rapier, Jolt and Havok; 6 to 7 for cannon-es, Bounce and crashcat
7. Ragdoll-like chain, joint gap after 1,000 steps: Bounce 0.007 mm, Rapier 0.064 mm, cannon 0.083 mm, Jolt 0.319 mm, crashcat 0.371 mm, Havok 0.535 mm
8. Download, gzip: hand 1 KB, cannon-es 36 KB, bounce 72 KB, crashcat 126 KB, havok 658 KB (43 KB JS + 2,094,563 B wasm raw), jolt wasm-compat 932 KB, rapier3d-compat 1,605 KB (rapier wasm alone 1,148 KB gzip, 3,082,103 B raw) (scratch sizes.mjs)
9. Engine start-up at 4x throttle: havok 94 ms, rapier 139 ms, rapier-det 168 ms, rapier-simd 178 ms, jolt 418 ms, pure-JS engines 0-3 ms
10. Determinism: identical results in 3 same-process runs for all engines except crashcat (tunnel scene differed every run). Node vs Chrome bit-identical only for the WebAssembly engines (Rapier, Jolt, Havok)
11. WebAssembly feature needs (wabt): Havok needs SIMD, so iOS Safari 16.4 or newer (caniuse wasm-simd: iOS 16.4+). Rapier plain and Jolt plain need no SIMD
12. Jolt leak test: 2,000,000 un-destroyed Vec3 objects took free wasm memory from 126.9 MB to 73.5 MB
13. Licences: Rapier Apache-2.0; Jolt MIT; Havok MIT for the binary only, closed source (package LICENSE file); cannon-es MIT (last release 2022-08-12); Bounce MIT; crashcat MIT (v0.0.5)

### Time savers
1. Reuse the scratch adapter pattern ((scratch folder, not saved) plan2/physics/engines/rapier.mjs and siblings, about 60 lines each) as the project's physics port. Changing engines later is about a day, not a rewrite.
2. Reuse (scratch folder, not saved) plan2/physics/scenes.mjs as fast Node regression tests (hash = same-result check). It runs in seconds, so it adds almost nothing to the roughly 10-minute publish, which is dominated by browser suites.
3. Use the -compat Rapier package first: zero Vite or wasm configuration. Switch to the separate-.wasm build later only if download size matters (same API, about 450 KB gzip smaller).
4. Do not write a hand-made rigid-body or ragdoll solver; engine joints (spherical, generic/limited, motors) give pins and falls in days.
5. Keep ball rolling on the block grid hand-written: it avoids the engine 'ghost bump' problem at the seams between the 0.43 m blocks, which would otherwise require merging colliders.
6. Leave racing-core physics alone: it needs only ground height, and no engine integration is needed for karts.
7. Load Rapier in the background after the first frame, and only once a station or hit needs it; it sleeps resting bodies, so an idle field costs almost nothing.
8. Skip cannon-es, Bounce, crashcat, ammo.js, Oimo and PhysX: tested or researched, each fails on tunnelling, maturity, maintenance or weight.

### Risks
1. Not tested on Safari or a real iPhone: JavaScriptCore speed, WebAssembly start-up and memory may differ from Chrome. Run scenes.mjs on the owner's phone once before committing.
2. Download: Rapier compat adds about 1.6 MB gzip (one-time, then cached). On a weak mobile connection this is noticeable unless loaded lazily.
3. One 188 ms stall was seen once (rapier-simd chain at 4x), likely first-use compilation. Warm the engine up during loading.
4. Early contact: engines react to a basketball rim before touching it (Rapier 11 mm, Jolt 19.6 mm). For swish-vs-rim feel, keep the rim in the hand-written ball system, or tune the engine's prediction distance.
5. Pure-JS physics, including our own hand-written code if it uses Math.hypot, sin or cos, gave different results on different JavaScript engines. Fine for single player; matters only for future lockstep online play, where the deterministic Rapier build or careful math would be needed.
6. Two systems (hand-written ball plus engine) must agree where they meet: ball hits ragdoll, ball hits pin. Define one clear handoff in the hit system.
7. Adding a dependency to a repo that has only three and cdt2d: pin the exact version (0.21.0) and keep the adapter thin so an upstream change or abandonment is cheap to escape.
8. Rapier's ragdoll joint-limit tooling is less complete than Jolt's (no ready Ragdoll class). Athletic, active ragdolls may need extra work or a later switch to Jolt.

### Owner taste questions
1. When the avatar gets hit or trips, how should the fall feel? (a) Loose and floppy like a classic ragdoll. (b) Athletic: he stumbles, tries to catch his balance, then falls if pushed hard enough (needs more work; Jolt's ragdoll tools help most here). (c) Mostly animated falls with only a little physics at the end.
2. How messy should the practice field be? (a) Everything can be knocked around at any time: kick the soccer ball into the bowling pins, push the cones over. (b) Balls and pins only move while you are playing that station, then reset neatly.

## Physics engine benchmark: skeptic
**Holds up:** True
**Confidence:** medium

### Problems

1. **The report overstates how ready Rapier is for ragdolls. In Rapier's JavaScript version, ball-and-socket joints (shoulders, hips, neck) have no public way to set limits. Limits set the normal way on hinge joints (elbows, knees) are silently ignored. Linked-chain ('multibody') joints cannot take limits from JavaScript at all. The report's 'joints stayed tight, 0.06 mm' came from a chain with no limits, so it says nothing about a real ragdoll.**
   - Evidence: Source in @dimforge/rapier3d 0.21.0: SphericalImpulseJoint only has motor methods; JointData.intoRaw passes limits only for Prismatic (the Revolute case calls RawGenericJoint.revolute with no limits); RawMultibodyJointSet has only limit getters. My 15-body ragdoll (verify-physics/rapier-tests.mjs, ragdoll-rapier-results.json): with limits applied properly (joint.setLimits for hinges, raw impulseJoints.raw.jointSetLimits for ball joints), elbows went 12.3 deg past their limit at the default 4 solver iterations and 6.1 deg at 8. The ragdoll never fell asleep at the defaults, even after 3,600 steps (30 s); it did at 8 iterations. Per-axis limits make a box, not a cone: neighbouring parts swung up to 92 deg against an intended 69 deg. The same ragdoll in Jolt 1.1.2 with SwingTwist and Hinge constraints (jolt-ragdoll.mjs) went 9.4 deg past at the elbows, stayed within 0.3 deg at the knees, swung at most 72.5 deg, and all bodies fell asleep at default settings. My first Rapier attempt fell into the silently-ignored-limits trap myself: elbows reached 180 deg.
   - Fix: If ragdolls use Rapier, put all joint setup in one tested helper (setLimits after creating a hinge, raw-API limits for ball joints, 8 solver iterations or extra iterations per body) and add a check that fails when a limit is overshot. Treat Jolt as the real alternative for ragdolls, not only for 'active' ragdolls, and decide when the hit system is actually built.

2. **The seams reason for keeping balls hand-written is weak. Rapier has a ready-made block-grid collider ('voxels') that removes bumps at the seams between 0.43 m blocks, and the project's own world code already describes every cell as a full grid cube for collisions.**
   - Evidence: ghostBumps test (node-results.json, also re-run in Chromium): a 0.11 m ball rolling over 40x8 blocks. One Rapier box per block: hops up to 13 mm at 3 m/s and 161 mm at 8 m/s, speed fell from 8 to 3.2 m/s, and it drifted 114 mm sideways on a diagonal. ColliderDesc.voxels(cells, 0.43) and a trimesh with FIX_INTERNAL_EDGES: 0 mm rise, 0 drift, the same as one flat box. src/world/merged.ts: 'Every cell is still a full grid cube for collisions.' The researcher's hand-written ball also showed 0 bumps (hand-seams-results.json), so both ways work.
   - Fix: Base the case for hand-written balls on the real reasons: block-by-block roll and bounce values from the rulebook, drag and spin, and the fact that Rapier has no rolling resistance (my test ball rolled at 2.0 m/s for 60 s on flat ground). Add a rule: in Rapier, build the ground as one voxels collider per block size from the same cell list, never one box per block.

3. **The cost estimates use averages. These hide the spikes at the moment of impact, and the 'idle field costs almost nothing' claim is false at default settings.**
   - Evidence: Chromium at 4x slowdown (browser-results.json): Rapier pins averaged 0.29 ms per step, but 1.05 ms at the 95th percentile and 3.1 ms at the worst step during impact. Without slowdown the 95th percentile was about 2x the average. My mixed field (10 pins, a bowling ball, 16 pool balls, 3 loose balls; 30 bodies) at 4x: 0.79 ms average, 1.59 ms 95th percentile. It stayed at 0.71 ms when idle because only 10 of 30 bodies fell asleep: balls keep rolling with no damping. A world where everything sleeps costs about 0.012 ms per step against 0.10 ms awake (Node, 30 boxes). Chrome's CPU slowdown may exaggerate single spikes.
   - Fix: Plan for about 1.5 to 3 ms per frame at 4x slowdown during play (2 steps per frame), not under 0.6 ms. Set damping on rolling balls and check that each station falls asleep when idle.

4. **The first-use stall is not only in the SIMD build. The plain Rapier build also freezes the first time joints are used.**
   - Evidence: The first ragdoll step was 75 ms in Node, 80 ms in Chromium without slowdown and 341 ms at 4x. Repeat runs were under 1 ms (ragdoll-rapier-results.json, browser-results.json firstRagdollMaxMs).
   - Fix: Always run a hidden warm-up scene (one pin knock and one ragdoll fall) while the page loads, whichever build is used.

5. **'No manual memory freeing' is overstated.**
   - Evidence: leak3.mjs: 2 million position reads and 200,000 ray casts did not grow memory (1.1 to 1.2 MB). But 300 small worlds never freed grew memory by about 20 MB, and freed ones stayed flat. crash2.mjs: dense worlds never freed reached the 4 GB WebAssembly limit and crashed with 'RuntimeError: unreachable' at world 87.
   - Fix: Keep one Rapier world per page and reuse it, or call world.free() whenever a station resets. Say 'far less manual freeing than Jolt', not 'none'.

6. **The '60-line adapter, swap engines in about a day' claim is optimistic, and building it now adds work that may never pay off.**
   - Evidence: The benchmark adapter covers only basic bodies and unlimited ball joints. A real game also needs joint limits, which work very differently per engine (Rapier per-axis via the raw API, Jolt swing-twist cones, Havok per-axis constraint modes), plus collision groups, contact events, kinematic bodies and per-engine tuning. My Jolt ragdoll needed different joint frames and limit settings than the Rapier one. Not timed; this is my estimate.
   - Fix: Write one game-level physics module (for example spawnPins, makeRagdoll, applyHit) that uses Rapier directly inside. Do not build a layer that tries to hide several engines. Switching engines later means rewriting that one module and re-tuning: days, not one day.

7. **Timing does not fit the miniature. The avatar cannot walk yet, and the hit/ragdoll system is recorded as 'after balance' (FEATURES.md, NEXT.md item 31). Only the bowling station truly needs tumbling bodies.**
   - Evidence: docs/MINIGAMES.md and docs/FEATURES.md (hits: 'all after balance'); HANDOFF: walking was removed on 20 Nov.
   - Fix: Do not add Rapier on day one. Build the hand-written ball system and the ball-only stations first, and add Rapier, loaded only when needed, when the first station with things that tumble (bowling pins) is built.

8. **The report claims no conflict with WORLD-RULES C1 ('one ball system'). In fact the plan uses two ball backends: hand-written for most balls and a Rapier ball for bowling.**
   - Evidence: Recommendation text: 'for bowling its forces are applied to a Rapier ball'.
   - Fix: Say it plainly: one ball module with shared rules, two backends, and a fixed rule per station for which one is used. Hits from a thrown ball are one-way pushes into the ragdoll, so the two systems never have to push back and forth on each other.

9. **'three.js ships a Rapier addon' is used as a reason to pick Rapier, but it is not a differentiator, and those addons should not be used in the game.**
   - Evidence: node_modules/three 0.180.0 examples/jsm/physics contains AmmoPhysics.js, JoltPhysics.js (loads jolt-physics@0.23.0 from jsDelivr) and RapierPhysics.js (loads rapier3d-compat@0.17.3 from Skypack).
   - Fix: Import the pinned npm package (rapier3d-compat 0.21.0). Never load an old engine version from a CDN while the game runs.

10. **The hand-written benchmark ball slides instead of rolling (it has no spin), so the '10 to 100 times cheaper' claim compares unequal features.**
   - Evidence: hand-seams-results.json: at 3 m/s on flat ground the researcher's hand ball stopped after about 3 m from sliding friction. A real rolling ball would carry on much farther.
   - Fix: Present hand-written balls as cheap and tunable, not as measured 10 to 100 times faster than a finished equivalent.

11. **The advice that the separate .wasm file saves about 450 KB assumes the web host compresses .wasm files. That was not checked.**
   - Evidence: Raw rapier_wasm3d_bg.wasm is 3,082,103 B (1,168,722 B gzip); the compat JS is 1,652,936 B gzip. I could not confirm whether GitHub Pages compresses application/wasm: github.io is blocked from this session and the search found nothing official.
   - Fix: Before switching builds, check the Content-Encoding header on the live site. If .wasm is served uncompressed, the compat build is smaller in practice.

### Factual errors
1. 'Rapier uses plain JS objects, so there is no manual memory freeing': partly wrong. World (and EventQueue and controllers) must be freed. My test leaked about 64 KB per small world never freed, and crashed at the 4 GB limit with dense worlds.
2. 'engine joints (spherical, generic/limited, motors) give pins and falls in days': Rapier JS spherical and generic joints have no public limit API (raw API only), and JointData limits on revolute joints are silently ignored (only prismatic reads them). Multibody joints cannot take limits from JavaScript at all.
3. The 188 ms stall is presented as a SIMD-build event. The plain rapier3d-compat build also stalls on first joint use: 75 ms in Node, 80 ms in Chromium without slowdown, 341 ms at 4x.
4. 'it sleeps resting bodies, so an idle field costs almost nothing': not at default settings. Balls roll forever (Rapier has no rolling resistance), and a joint-limited ragdoll at the default 4 iterations never sleeps. My idle field still cost 0.71 ms per step at 4x.
5. The practice-field estimate (about 0.28 ms per step, 'under 0.6 ms of a 16.7 ms frame') adds up averages only. Impact steps reached 1.05 ms at the 95th percentile and 3.1 ms at worst at 4x, for pins alone.
6. 'rolling balls catching on the seams ... would otherwise require merging colliders': Rapier's built-in voxels collider (and trimesh FIX_INTERNAL_EDGES) removes the bumps with one collider built from the cell list (tested: 0 mm, against 161 mm with one box per block).
7. 'Bounce: the official three.js ball-pool example uses it': I could not confirm this. Nothing was found, and the examples folder is not in the npm package. Treat it as unverified.
8. Minor: the Havok download is 658,471 B gzip for the .wasm alone (plus 13,314 B for the JS), so about 672 KB, not 658 KB. Other sizes and npm dates checked out (rapier3d-compat 0.21.0 on 2026-09-25, jolt-physics 1.1.2 on 2026-11-21, havok 1.3.14 MIT, cannon-es 2022-08-12).

### Missed options
1. Rapier's voxels collider (ColliderDesc.voxels with 0.43 m cells, linked across block sizes and materials with combineVoxelStates), or a trimesh with FIX_INTERNAL_EDGES, as the ground for any engine body. This matches the existing grid-cube collision model in src/world.
2. Jolt specifically for ragdolls: tested better out of the box than Rapier on limits and sleeping (cone limits, 9.4 deg elbow overshoot, all bodies asleep), at similar cost (about 0.08 to 0.11 ms per step in Node for one 15-body ragdoll).
3. Rapier multibody joints for ragdolls: tested and not viable from JavaScript. About 10x slower (1.0 ms against 0.04 to 0.1 ms per step in Node) and no way to set limits.
4. Box3D (Erin Catto, MIT, released about 30 June 2026, labelled alpha): only community WebAssembly builds exist (box3d.js 0.1.1 from Aug 2026, box3d-wasm 0.2.0 from Jul 2026). Too young now; worth re-checking later.
5. Waiting to add the engine: build every ball-only station first and add Rapier only with the bowling station (and later the hit system).
6. One-way pushes for hits (a hand-written ball hits a person and starts the ragdoll with an impulse) instead of making the two physics systems push back and forth.
7. Per-surface damping for engine balls (look up the block under the ball and set damping), the counterpart of the rulebook's roll values.
**Retest:** All work is in (scratch folder, not saved) plan2/verify-physics. I wrote my own scenes; I did not reuse the researcher's. The only exception is hand-seams.mjs, which imports their hand.mjs read-only to test their own claim. Engines: @dimforge/rapier3d-compat 0.21.0, @babylonjs/havok 1.3.14, jolt-physics 1.1.2. Node 22 plus headless Chromium 157 with COOP/COEP headers (crossOriginIsolated true), at 1x and with CDP CPUThrottlingRate 4.

(1) Replication (bench-min.mjs, min-node-results.json, browser-results.json). 100 balls, ms per step, Node: Rapier 0.32, Havok 0.19 (researcher: 0.338 and 0.173). At 4x: Rapier 1.36, Havok 0.84 (researcher: 1.163 and 0.577). Pins at 4x: Rapier 0.29 average, 1.05 at the 95th percentile, 3.1 worst; Havok 0.076, 0.64 and 1.37. 8 of 10 pins fell in both, matching the researcher. The ranking and sizes are confirmed: Rapier compat 1,652,936 B gzip, Rapier .wasm 3,082,103 B raw (1,168,722 B gzip), Havok .wasm 658,471 B gzip, Jolt compat 912,077 B gzip.

(2) Seam bumps (rapier-tests.mjs ghostBumps). One box per block: hops up to 161 mm at 8 m/s and speed lost from 8 to 3.2 m/s. Voxels collider and trimesh with FIX_INTERNAL_EDGES: 0 mm. The researcher's hand-written ball: 0 mm, but it slides and stops after about 3 m at 3 m/s.

(3) Spherical-joint limits through the raw API do work: a pendulum swung at 80 deg was held to 30.4 deg against a 28.6 deg limit.

(4) 15-body ragdoll. Rapier with limits applied correctly: 12.3 deg overshoot and never sleeps at 4 iterations; 6.1 deg and sleeps at 8. Neighbour swing 92 deg. 0.07 to 0.11 ms per step in Node, 0.31 at 4x. Ten ragdolls: 0.75 ms in Node, 2.86 ms average and 8.5 ms worst at 4x. Jolt: 9.4 deg overshoot, 72.5 deg swing, sleeps, 0.08 to 0.11 ms (ten ragdolls 0.69 ms). Rapier ragdoll hashes were identical in Node and Chromium (992722b8, 7b534571, 7bd93938), which confirms the cross-environment determinism claim for V8.

(5) Rolling and sleep (sleep-check.mjs). A Rapier ball still rolled at 2.0 m/s after 60 s; with angular damping 0.5 it stopped at about 25 s and fell asleep. A sleeping world cost 0.012 ms per step against 0.10 ms awake.

(6) Practice field, 30 bodies: 0.79 ms average and 1.59 ms 95th percentile at 4x; still 0.71 ms when idle because only 10 of 30 bodies slept.

(7) First-use stall in the plain build: 75 ms Node, 80 ms at 1x, 341 ms at 4x.

(8) Memory (leak3.mjs, crash2.mjs). Reads and ray casts: flat. Worlds never freed: about 64 KB each for small worlds; dense ones crashed at 4 GB ('unreachable').

Not tested: Safari/JavaScriptCore or a real iPhone (no WebKit installed, and installing browsers was not allowed); whether GitHub Pages compresses .wasm (github.io blocked); a Havok ragdoll. developer.playcanvas.com and box2d.org were blocked, so those claims rest on search summaries. The web search budget ran out before I could look for a rapier.js issue about missing spherical limits. CDP slowdown on a desktop Xeon is only a rough stand-in for a phone, and it may exaggerate single-step spikes.
**Improved recommendation:** Mostly agree with the researcher, with five corrections.

1. Keep our own code for karts (racing-core), walking (motion-core and the world collision code) and the shared ball system. Ball flight, bounce and roll should use each block's rulebook values plus drag and spin. The reason is tuning and the rulebook values, not seams. Rapier also has no rolling resistance, so we would have to add that by hand anyway.

2. Use Rapier (@dimforge/rapier3d-compat, pinned at 0.21.0, the plain build without SIMD) as the one ready-made engine for things that tumble: bowling pins, knock-over targets and loose props. But add it only when the first station that needs it is built, probably bowling near the end of the practice field. Do not add it on day one. Load it only on that station, and run a hidden warm-up scene while loading, because the first joint use froze for up to 341 ms at 4x slowdown.

3. Inside Rapier, follow a few rules. Build the ground as one block-grid ('voxels') collider per block size from the island's own cell list, never one box per block; one box per block made balls hop up to 16 cm. Give balls damping that depends on the surface so they stop rolling. Reuse one world per page and free it when a station resets.

4. Ragdolls (the hit system, after balance): first try Rapier with one tested joint helper and an automatic check for overshooting the joint limits. Rapier's JavaScript joint API has traps: limits set the normal way on hinges are silently ignored, and ball joints can only be limited through the raw API. If falls look wrong, or the body does not settle, move ragdolls to Jolt. In my test Jolt held limits better and settled at default settings, at the cost of manual memory freeing. Decide this when the hit system is built, with the owner looking at it.

5. Do not build a layer that tries to hide several engines. Write one game-level physics module (spawn pins, make a ragdoll, apply a hit) that uses Rapier directly. Rule for each station: exactly one system owns its objects. Bowling uses the engine's ball. A thrown ball hitting a person is a one-way push into the ragdoll.

Budget about 1.5 to 3 ms per frame at 4x slowdown during play, not under 0.6 ms. Before committing, check on the real iPhone and check whether the live site compresses .wasm files.

Skip cannon-es, Bounce, crashcat, ammo.js, Oimo, PhysX, Rapier multibody joints and Box3D (alpha, community WebAssembly builds only) for now.

Possible owner questions (taste only): how floppy versus athletic a fall should look, and whether practice-field objects reset after each use or stay knocked around.

## Avatar movement method: research
**Question:** What is the fastest proven way to give the rigid ball-jointed avatar every movement the miniature version needs (walking was built and rejected about 5-7 times), and how should the conflict between fast game speeds (run 8.6 m/s), short legs and "feet must never slide" be handled?
**Summary:** I recommend a hybrid. Each movement is written down as a short list of key poses (data) and played by the pose player motion-core already has. The existing leg and hand solvers sit on top and pin planted feet to the ground and put hands on balls, bats and steering wheels. This ends the cycle of inventing a new motion algorithm for every movement, which is what the 5-7 rejected walk attempts were. My tests show the existing player already plays a data clip exactly. On its own a data clip lets the feet slide 5-35% of the running speed. With the foot-pinning layer added, the heel and ball of the foot stay exactly in place. What is left is a small toe creep of about 1-2.5 cm per step, which comes from where the toe joint sits and can be fixed. The real cause of the speed conflict is the game's speeds, not mainly the short legs. 3.1 m/s is already faster than anyone can physically walk, and 8.6 m/s on these legs is like a person sprinting at about 9 m/s. So at full speed there are only three choices: very quick steps or long leaping hops with feet planted, calmer strides with a little slip, or a lower top speed. The owner decides which by eye. That matches what the industry does (Epic's Lyra guidance: adjust playback and stride by at most 15-20%, then accept some slide). It also matches the owner's own history: in the old repo the owner said "wow i love it" to a run whose feet slid, and had the foot-locking versions reverted. Ready-made CC0 animation packs technically fit the 63-bone skeleton (I tested a CC0 Quaternius robot pack). But each clip clashed with our joint limits and would need cleanup, so they are useful as references, not as the main source. Mixamo, motion matching and physics-based animation are not worth it for version 1.

### Options

1. **(a) Procedural math per movement (the current approach)**
   - How it works: Each movement is a hand-written function. For example, a gait computed from speed and phase, a foot planner, or sine waves for hips and knees. The code decides every joint angle every frame.
   - Pros: No asset files and very small to load. It reacts to any speed, so it works well for small things layered on top: leaning, bobbing, breathing, banking into turns. The owner approved one of these in the old repo (3D-WORLD-3 checkpoint-1 run, simple sine waves).
   - Cons: Every new movement is a new algorithm. Each rejection meant rewriting code, not adjusting a pose: a reactive planner, then a phase function, then a full reset on 20 Nov. The look comes out of the math, so the owner cannot point at 'this pose' and change it. Solvers that force exact feet also decided the stride and posture, giving the 'sprinter's crouch with fast legs' the owner disliked.
   - Evidence: /home/user/3D-World-4/docs/NEXT.md items 41-47: the reactive gait kept feet exact but looked violent at 8.6 m/s (7.6 steps/s); the rebuilt phase gait skated 40-60% when running; both were rejected, then the reset. /home/user/isaiasurrutia96/3d-world-3/docs/DECISIONS.md, '4 November 2026, second entry' (about lines 1311-1338): the sine-wave run slides and sinks; the full IK fix 'decides the stride, the posture and the cadence' and was reverted. Same file, lines 495-510: checkpoint-1 approved with 'wow i love it' even though the feet dip. /home/user/isaiasurrutia96/3d-world-3/src/player/PlayerAnimation.ts lines 404-445: the approved run is 2.6+5.4·speed rad/s of phase, hip swing 0.42-1.0 rad.
   - Test result: Not rebuilt here, because its history is in the repo. I calculated from the old approved run: at full stick it gives 2.55 steps/s, which at 8.6 m/s means about 3.4 m of ground per step. So its feet must slide heavily, and the owner still loved it.

2. **(b) Key-pose clips as data, played by the existing motion-core pose player (on their own)**
   - How it works: Each movement is 4-12 key poses (joint angles at set times, optionally written as foot and hand targets and turned into angles once by reach.js). createClip joins them with smooth Catmull-Rom curves. createPosePlayer plays them as layers, blends, masks and transitions. This is the same machinery as the approved wave.
   - Pros: One engine for every movement. Fixing a rejected movement means editing numbers in a pose, not rewriting code. The owner can approve still pictures of the key poses before any motion. It does not depend on frame rate. It is how animators work (pose-to-pose) and how Overgrowth built fluid animation from very few keyframes. The owner approved a key-pose walk before (3D-WORLD-3 letsgo-racing run-clip.js: 'retains the approved walking poses').
   - Cons: On its own the feet slide and dip between keys, because a smooth curve through joint angles does not keep a foot still. Cadence grows with speed if playback is tied to speed. Someone still has to author good poses. The player has no playback-rate option yet (a closure-clock workaround works).
   - Evidence: /home/user/3D-World-4/motion-core/skeleton/pose.js (createClip, setLayer with clip/pose/fn, fades, masks); /home/user/3D-World-4/motion-core/skeleton/poses.js (wave clip). Overgrowth GDC 2014 talk: https://gdcvault.com/play/1020049/Animation-Bootcamp-An-Indie-Approach ('fluid animation from very few keyframes'). /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-racing/README.md line 74 and src/animation/run-clip.js (approved key-pose walking baked with two-bone IK).
   - Test result: TESTED (scratch gaitclip.mjs). (1) The pose player plays the data clip exactly: after joint limits, player and clip differ by at most 2e-15°. Against the raw curve they differ by 0.1-3.3°, only where the curve overshoots a joint limit. (2) Walk clip (native 1.12 m/s at 2.0 steps/s) with playback rate tied to speed, at 1 / 3 / 8.6 m/s: cadence 1.79 / 5.36 / 15.4 steps/s. Mean slide of touching foot points as a share of speed: 4 keys 32 / 32 / 35%; 6 keys 12 / 13 / 17%; 8 keys 13 / 13 / 15%; 12 keys 4.9 / 5.1 / 6.8%. Even 12 keys leaves about 31 mm of planted slide per step at 1 m/s. (3) Run clip (native 3.9 m/s at 3 steps/s) at 3 / 5 / 8.6 m/s: 17-23% slide, 6.6 steps/s at 8.6, dips of 22-45 mm between keys. (4) Mixed 30/90 fps gave the same result as steady 120 fps (11.2% vs 12.1%).

3. **(c1) Ready-made CC0 animation packs retargeted onto the 63-bone skeleton (Quaternius Universal Animation Library 1/2, Quaternius RobotExpressive, KayKit Character Animations, Kenney Animated Characters)**
   - How it works: Download the GLB/FBX clips. Map their bones to ours. Copy trunk rotations, scale hand and foot positions by limb length, and let reach.js bend our limbs to them (the 'IK retargeting' idea). Then store the result as a motion-core clip.
   - Pros: CC0 means free for commercial use, with no attribution or redistribution limits, so it is safe in a public repo and a web build. There are many generic locomotion and emote clips. The tool needs about 150 lines on top of the existing reach.js. Good as timing and pose references.
   - Cons: Generic indie-game look, while the owner wants motions 'unlike other games' (HANDOFF item 5). Few or none of the exact station sports motions (bowling, archery, billiards, set shot) are confirmed in these packs. Our joint limits (hip back 30°, no waist lean, chest 0-15°, collarbone ±4°, head ±40°) clip many source motions, so each clip needs review and cleanup. The avatar's proportions (4.9 heads tall, arms 0.88 of leg length) differ from the sources. Kenney packs only have idle, jump and run.
   - Evidence: Quaternius UAL is CC0 (pack page via search: https://quaternius.com/packs/universalanimationlibrary.html; https://opengameart.org/content/universal-animation-library; itch page https://quaternius.itch.io/universal-animation-library lists free Standard plus paid Pro and Source; a search snippet said Standard has 45 animations, not confirmed). UAL2 is CC0, free version about 70% of the set: https://quaternius.com/packs/universalanimationlibrary2.html. RobotExpressive is CC0 1.0 by Tomás Laulhé (Quaternius): https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/models/gltf/RobotExpressive/README.md. KayKit Character Animations, CC0, with walk, run and idle: https://opengameart.org/content/kaykit-character-animations. Kenney Animated Characters, CC0, idle/jump/run: https://opengameart.org/content/animated-characters-1.
   - Test result: PARTLY TESTED. UAL could not be downloaded because quaternius.com, itch.io and opengameart.org are blocked from this session. As a proxy I downloaded RobotExpressive.glb (CC0, same author, 43 joints, 14 clips). Results: 35 of our 63 bones map by name; the unmapped ones are fingertips, palm bones, little finger, toes and the fixed hip bones, which the hand/grip layer covers. The robot's feet are separate IK bones, not children of the shins; IK retargeting handled that. I retargeted 8 clips at 60 fps: Wave, Sitting, ThumbsUp and Dance reached every hand and foot goal (0 mm error). Walking and Running fell short 28 / 274 mm at the feet, because the robot swings its legs up to 59° (walk) and 82° (run) behind the pelvis while our hip limit is 30°. Punch and Jump fell short 259 / 88 mm because the source rig itself stretches its IK feet to 1.37× / 1.13× leg length. The right collarbone would need 10.9° (walk) and 59° (wave) against our ±4°, and the head 154° in Dance. The pose player then played the retargeted Walking as a 9-key clip exactly (3.2e-12°). Conversion cost was 0.15-0.85 ms per frame, done offline.

4. **(c2) Motion-capture databases (CMU Graphics Lab), retargeted**
   - How it works: Download BVH or ASF/AMC trials of real people (the CMU database has thousands, including some sports moves), clean them up, and retarget with the same IK tool.
   - Pros: Real human timing and weight shift. Secondary sources say it is free including commercial use, as long as the raw data is not resold.
   - Cons: Raw mocap needs cleanup (foot contact, noise, root drift), and its human proportions and full spine movement clash with our limits. Realistic mocap on a 4.9-head ragdoll can look odd. Through AMASS the same data is non-commercial only. I could not read CMU's own terms page.
   - Evidence: https://mocap.cs.cmu.edu/resources.php (could not open: host blocked). Secondary: https://paperswithcode.com/dataset/cmu-motion-capture ('free for all uses' / 'free for research'). The FBX conversion carries a CC BY-NC label: https://data.4tu.nl/datasets/0448aab2-3332-449f-a8e2-d208cb58c7df. AMASS is non-commercial: https://amass.is.tue.mpg.de/license.html.
   - Test result: Not tested: mocap.cs.cmu.edu is blocked from this session. The license was not confirmed from the primary page.

5. **(c3) Restricted-license libraries: Mixamo, Rokoko Motion Library, Unity Asset Store, Fab/Unreal Marketplace, LAFAN1**
   - How it works: Download clips under each vendor's terms and retarget them.
   - Pros: Large, polished catalogs. Mixamo is free and royalty-free in games.
   - Cons: Mixamo: Adobe staff say raw character and animation files may not be distributed. This repo is public and a web build serves its files to anyone, which is a real license risk. It also needs an Adobe login. Unity Asset Store: can be used in other engines but not shared as downloadable resources, the same public-repo problem. Fab/Unreal: Epic's own content is Unreal-only; current Fab terms not verified. Rokoko: 2020 coverage says free moves are licensed for commercial use, but I could not read the formal terms, and it needs a login. LAFAN1 is CC BY-NC-ND, so it is not allowed in a commercial game.
   - Evidence: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html (royalty-free incl. video games); https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/td-p/13234775 (no distributing raw files). https://support.unity.com/hc/en-us/articles/34387186019988-Can-I-use-assets-from-the-Asset-Store-with-other-engines. https://unity.com/legal/as-terms. https://www.cgchannel.com/2020/03/get-150-free-mocap-moves-from-rokokos-motion-library. https://github.com/ubisoft/ubisoft-laforge-animation-dataset (CC BY-NC-ND 4.0).
   - Test result: Not tested: license review only. mixamo.com and rokoko.com are blocked from this session.

6. **(d) HYBRID: key-pose data clips + existing IK/balance/grip layers + playback tied to speed + blending between walk/run(/sprint) by speed**
   - How it works: Same data clips as (b). The clip decides when each foot is down and how it rolls from heel to toe. A foot-lock layer (reach.js) pins each planted foot where it landed, fading in over 2-3 frames. Playback rate follows ground speed within each clip's speed band. Walk, run and sprint clips cross-fade by speed while sharing the step phase. The lock absorbs up to ±20% speed mismatch (stride warping). Grip and palm goals put hands on objects, layers with masks let the upper body throw while the legs stand, and balance shifts weight. Action clips (shot, kick, swing, throw) are short one-shot clips with grip goals.
   - Pros: This is the standard industry stack (Lyra: play rate + stride warping + foot IK). Nearly everything it needs already exists in motion-core and passes its tests. Fixes are pose edits. Heel and ball contact are exact at any speed when the cadence matches. Stored foot and hand targets can be re-solved when the avatar is rebuilt with new bone lengths. It is cheap enough for a phone.
   - Cons: Still needs good key poses and owner review by eye. Very calm cadence at 8.6 m/s is physically impossible with planted feet. The toes pivot sits 6.5 cm above the sole, so the toe tip creeps 13-25 mm per step during the heel-to-toe roll unless that is fixed. Landing needs a short blend (the pop measured 1-55 mm without one).
   - Evidence: Lyra tech blog, rule of thumb of 15-20% maximum play-rate and stride-warp change, beyond which it is often better to allow foot sliding: https://www.unrealengine.com/tech-blog/adapting-lyra-animation-to-your-ue5-game. Stride Warping node: https://dev.epicgames.com/documentation/en-us/unreal-engine/pose-warping-in-unreal-engine. Pražák, Hoyet, O'Sullivan 2011: viewers notice foot sliding under 21 mm, and a simple limb-lengthening fix was preferred over complex IK: https://diglib.eg.org/items/74844741-a900-4f91-886f-b89bf331cf98/full. Valve's Half-Life: Alyx 'footbase' (slowing a character without sliding by scaling motion): https://history.siggraph.org/wp-content/uploads/2022/06/2021-Talks-Heuvel_The-Right-Foot-in-the-Wrong-Place.pdf. Local: /home/user/3D-World-4/motion-core/skeleton/reach.js, balance.js, hands.js.
   - Test result: TESTED (scratch gaitclip.mjs, debug2.mjs, bench-browser.mjs). Walk 6 keys + lock at 1 / 2 / 3 m/s: lock error 0 mm, planted slide 13 mm per step (2.1-2.9% of speed), penetration 3.8 mm, the lock changes leg angles by at most 9.9°. Run 8 keys + lock at 3 / 5 / 8.6 m/s: lock error 0 mm, 21-25 mm per step, lock changes at most 17.7°. A trace confirmed the heel stays at z 0.191 m and the ball at 0.524-0.526 m through the whole stance; the leftover is toe-tip creep from the raised toe pivot. Stride-warp limit: the run clip at fixed rate with ground speed ×0.8 / 0.9 / 1.1 / 1.2 kept the lock exact (0 mm); at ×1.4 the leg fell 104 mm short. Cost in Chromium (software GPU, CPU numbers): 0.20-0.39 ms per frame normally, 0.95-1.65 ms per frame at 4× CPU slowdown for clip + forward kinematics + lock.

7. **(e1) Motion matching / learned motion matching**
   - How it works: Every few frames, search a large motion-capture database for the frame whose pose and future path best match what the player wants, and jump there.
   - Pros: Very natural locomotion with no hand-built transitions (For Honor, The Last of Us Part II).
   - Cons: Needs hours of consistent mocap on one rig (the For Honor team reportedly ran mocap sessions about weekly), plus heavy memory and CPU. The best free dataset (LAFAN1) is non-commercial. Not compatible with a stylized 4.9-head ragdoll or a one-person team.
   - Evidence: https://www.gdcvault.com/play/1022985/Motion-Matching-and-The-Road (Clavet, GDC 2016). Weekly mocap sessions per CG World: https://cgworld.jp/feature/1604-gdc2016-03-2.html. LAFAN1 license: https://github.com/ubisoft/ubisoft-laforge-animation-dataset. Also /home/user/3D-World-4/docs/game-dev/04-animation.md section E1 ('not practical for this project').
   - Test result: Not tested: no commercially usable dataset exists for this rig, so a test would prove nothing.

8. **(e2) Physics-based animation (active ragdoll, Euphoria-style, DeepMimic/DReCon)**
   - How it works: The body is simulated with motors at the joints that try to follow reference motions and keep balance. Often trained with reinforcement learning.
   - Pros: Fits the 'ragdoll' feel. Natural reactions to hits and falls. Throws could vary naturally.
   - Cons: Research-grade. It still needs reference motions (so it does not replace a), b) or c)) and needs training and tuning. Hard to make reliable and deterministic on a phone. Better kept for later secondary effects (stumble, fall, follow-through wobble) on top of clips.
   - Evidence: https://montreal.ubisoft.com/en/drecon-data-driven-responsive-control-of-physics-based-characters/. /home/user/3D-World-4/docs/game-dev/04-animation.md section E2.
   - Test result: Not tested: out of scope for version 1, and it needs the reference clips anyway.

9. **(e3) Tools for making key poses faster: AI video-to-mocap (Rokoko Video, Move.ai, DeepMotion) or Cascadeur**
   - How it works: The owner films a motion on the phone, an AI service turns it into a skeleton animation, and our IK retarget tool turns that into a data clip. Or an animator poses it in Cascadeur.
   - Pros: Gives real human timing for the station sports motions (the owner could film their own basketball shot). The IK retarget tool tested in (c1) would import the result.
   - Cons: Free tiers are small and their commercial terms are unclear. Cascadeur's free plan is non-commercial and exports only .casc; Indie costs $8-19 a month with a $100k revenue cap. These are desktop or web apps the AI assistants cannot drive.
   - Evidence: https://www.cgchannel.com/2022/12/rokoko-launches-powerful-free-ai-mocap-tool-rokoko-video. https://cascadeur.com/plans. Pricing and terms for Move.ai and DeepMotion came only from third-party summaries, not confirmed.
   - Test result: Not tested: the services need accounts, and their hosts are not reachable from this session.

10. **(f) Reuse the owner's own approved movements from 3D-WORLD-3 as starting key poses (with approval)**
   - How it works: Sample the owner-approved checkpoint-1 run, jumps and letsgo-racing walk poses at 4-8 phases and copy their joint angles into data clips for our skeleton. Then add the foot lock.
   - Pros: Starts from motions the owner has already said they love, so fewer first-round rejections. It is the owner's own code, allowed with approval (CLAUDE.md rule 9: reference only).
   - Cons: Different rig and proportions, so angles need re-fitting. The old run's calm cadence slides at 8.6 m/s (taste question 1).
   - Evidence: /home/user/isaiasurrutia96/3d-world-3/src/player/PlayerAnimation.ts lines 404-445. /home/user/isaiasurrutia96/3d-world-3/docs/DECISIONS.md lines 495-510. /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-racing/src/animation/run-clip.js, jump-clip.js.
   - Test result: Not tested: porting needs the owner's approval. I only read the files and computed the old run's cadence (2.55 steps/s at full stick).

### Tests run

1. **Can the existing pose player play a keyframe walk clip written as data?**
   - How: Bundled /home/user/3D-World-4/motion-core (read-only) with esbuild into the scratch folder. Baked walk clips of 4, 6, 8 and 12 keys: foot targets with heel strike, flat foot and toe roll, turned into joint angles once with reach.js, then createClip. Played through createPosePlayer.setLayer with an fn that reads my own clip clock, so the rate could vary. Compared player output with clip.sample every frame. Script: (scratch folder, not saved) plan2/animation/scripts/gaitclip.mjs
   - Result: Yes. After joint limits the player matches the clip within 2e-15°. Against the raw curve it differs by 0.1-3.3°, only where the Catmull-Rom curve overshoots a joint limit. There is no built-in playback-rate option; the fn-with-own-clock workaround works, and a 'rate' option would be a small addition in pose.js.
   - Limits: My clips are simple test gaits (no arm or chest subtlety), not polished animation.

2. **Foot slide at 1, 3 and 8.6 m/s with playback rate tied to speed (clip alone)**
   - How: Moved the body forward at v, advanced clip time at v / native speed, solved forward kinematics and tracked the 6 foot contact points from bones.js. Slide = horizontal speed of points within 1 cm of the ground while that foot is in stance. Also tracked the pivot-only slide per step, landing pop and penetration.
   - Result: Walk clip (native 1.12 m/s): cadence 1.79 / 5.36 / 15.4 steps/s at 1 / 3 / 8.6 m/s. Slide 32-35% of speed (4 keys), 12-17% (6 keys), 13-15% (8 keys), 4.9-6.8% (12 keys). Run clip (native 3.9 m/s): 6.62 steps/s at 8.6 m/s, 17-23% slide. Sprint clip built for 8.6 m/s at 4.41 steps/s: needs 0.62 m of stance travel in 0.073 s, at the very edge of leg reach (16.7 mm short at bake).
   - Limits: Depends on authoring quality. The 1 cm contact threshold is my choice.

3. **Hybrid: same clips plus an IK foot-lock layer**
   - How: While the clip says a foot is in stance, pin its ground point in world space with reach.js (heel/flat/ball pivots and exact toe angle); measure the same metrics.
   - Result: Lock error 0 mm. Heel and ball exact (trace). Planted slide 13 mm per step for walking at 1-3 m/s and 21-25 mm per step for running at 3-8.6 m/s, all from the toe tip creeping because the toes pivot sits 6.5 cm above the sole. Penetration 3.8 mm (walk) and 10.7 mm (run). The lock changes the clip's leg angles by 9.9° (walk) and 17.7° (run). The landing pop without a blend is 1-55 mm.
   - Limits: No blend-in implemented. The toe pivot height is a skeleton detail that could be fixed.

4. **How far can the foot lock stretch strides (stride warping) and calm the cadence at 8.6 m/s?**
   - How: Run clip at fixed rate 1 with ground speed ×0.8-×1.4 plus lock. Run clip at 8.6 m/s with cadence capped at 3.0, 3.6 and 4.4 steps/s, with and without lock.
   - Result: From ×0.8 to ×1.2 the lock stays exact (0 mm error). At ×1.4 the leg is 104 mm short. This agrees with Epic's 15-20% guideline. With the cadence capped at 3.0 / 3.6 / 4.4 at 8.6 m/s: slide 49 / 40 / 27% of speed without the lock; with the lock the leg falls 589 / 370 / 165 mm short. Planted feet at full speed with calm legs is physically impossible.
   - Limits: Flat-ground straight running only; no turns, starts or stops tested.

5. **Frame-rate independence**
   - How: Walk 8 keys at 1.2 m/s with frames alternating 1/30 and 1/90 s, compared with steady 120 fps.
   - Result: Same behaviour: 11.2% vs 12.1% slide and the same cadence (sampling differences only). Clips are a pure function of clip time.
   - Limits: One clip, one speed.

6. **CPU cost on a phone-like CPU**
   - How: Bundled the gait test for the browser and ran it in Playwright Chromium, normal and with CDP Emulation.setCPUThrottlingRate rate 4. Script: (scratch folder, not saved) plan2/animation/scripts/bench-browser.mjs
   - Result: Per frame (pose player + clip + forward kinematics + contact measurement): normal 0.20-0.39 ms; at 4× slowdown 0.95 ms (run clip), 1.29 ms (run + lock), 1.45 ms (walk), 1.65 ms (walk + lock). That is well inside a 16.7 ms frame.
   - Limits: SwiftShader software GPU, so these are CPU-only numbers. Not measured on the owner's real iPhone. Includes measurement overhead.

7. **CC0 animation file: bone names and clip list**
   - How: Downloaded the CC0 RobotExpressive.glb (Quaternius / Tomás Laulhé, three.js r180 examples) and parsed the GLB JSON. Script: scripts/inspect-glb.mjs
   - Result: 43 joints (Hips, Abdomen, Torso, Neck, Head, Shoulder/UpperArm/LowerArm, Palm1-3, Thumb, Index, Middle, Ring per side, UpperLeg/LowerLeg, separate Foot IK bones and PoleTargets). 14 clips: Dance, Death, Idle, Jump, No, Punch, Running, Sitting, Standing, ThumbsUp, Walking, WalkJump, Wave, Yes. Facing +Z with .L at +X, the same convention as motion-core.
   - Limits: The Quaternius Universal Animation Library itself could not be downloaded (quaternius.com, itch.io and opengameart are blocked), so its bone names are not verified.

8. **Mapping and retargeting feasibility onto the 63-bone skeleton**
   - How: IK retargeting in Node with three.js GLTFLoader and AnimationMixer. Calibrated on Idle frame 0. Copied hip and trunk rotations, scaled hand and foot positions by limb length, solved with reach.js, checked joint-limit overflows, stored the result as a motion-core clip and played it. Scripts: scripts/retarget.mjs, hipangle.mjs, stretch-check.mjs, play-retargeted.mjs
   - Result: 35 of 63 bones mapped. Wave, Sitting, ThumbsUp and Dance: all goals reached. Walking, Running, Punch and Jump: feet short by 28 / 274 / 259 / 88 mm, caused by the source legs swinging 59-82° behind the pelvis (our limit is 30°) and the source's own IK feet stretching to 1.37×. Collarbone needed up to 59° (our limit ±4°), head 154° in Dance (ours ±40°). The pose player played the retargeted Walking exactly (3.2e-12°).
   - Limits: The source is a cartoon robot, not human mocap; human mocap would clash less at the hips. No visual check was done.

9. **Why the speeds clash with planted feet (dynamic similarity)**
   - How: Froude number v²/(g·L) with L = hip height from bones.js (0.8395 m). Walk-to-run change at Fr ≈ 0.5 and walking limit at Fr = 1 (Kram et al. 1997; Alexander and Jayes).
   - Result: For this avatar the walk-to-run change is at 2.03 m/s and the walking limit at 2.87 m/s. 3.1 m/s is Fr 1.17, above the physical walking limit, so it must look like a jog. It is above the limit even for a typical 1.75 m man (Fr 1.06). 8.6 m/s on these legs is like a typical man running about 9.0 m/s, a fast sprint. The legs only add about 5%; the main cause is the speeds. The 6 ft 4 in rebuild (hip about 0.89 m) moves the walk-to-run change only to 2.09 m/s.
   - Limits: The typical-man hip height (0.53 × height) is an approximate anthropometric ratio.

### Recommendation
**Choice:** Use the hybrid (d) for every movement: key poses written as data (foot and hand targets plus body height, solved once into joint angles) played by the existing motion-core pose player, with the existing reach/foot-lock, grip and balance layers on top. Playback follows ground speed inside each clip's band, walk, run and sprint cross-fade by speed, and the foot lock absorbs up to ±20%. Use CC0 clips (Quaternius UAL/UAL2, RobotExpressive, KayKit) and the owner-approved 3D-WORLD-3 motions only as timing and pose references, imported through the tested IK retarget tool when one fits. No Mixamo, motion matching or physics animation in version 1. A realistic version-1 list is about 22 data clips in three batches. Batch 1 makes the island playable (11): idle, walk, run, jump (crouch, take-off, air, land), turn on the spot, kart get-in, kart seated drive (one sit pose per class, hands on the wheel and feet on the pedals by IK, steering lean layer), kart get-out, skate ride stance with carve-lean layer, skate push, ollie (plus get on/off the board). Batch 2, the practice field (10 clips covering about 13 stations, by family): basketball set shot; soccer kick; overhand throw (football); dart throw; underhand roll (bowling and skee-ball, scaled); bat swing; golf putt, plus a full swing only if a range is built; archery draw-hold-release; billiards cue stroke; frisbee backhand; paintball aim and fire. Long jump and the obstacle course reuse run and jump; pick-up/hold uses the grip layer. Batch 3, later: sprint variant (depends on the owner's choice), skid, celebrate, climb, swim, skating and skiing.
**Why:** It is the only option that avoids writing a new algorithm per movement. All the expensive machinery (clips, layers, masks, smooth transitions, two-bone IK, grip, balance) already exists and passes its tests, so each movement becomes data the owner can judge as stills and then in motion. My tests show the data clip plays exactly in the existing player. A clip alone slides 5-35%, while the clip with the lock keeps heel and ball contact exact (0 mm lock error) at every tested speed. It costs about 1-1.7 ms per frame on a 4×-slowed CPU, and it does not depend on frame rate. It is the industry-standard locomotion stack (Lyra: play rate + stride warping + foot IK, with 15-20% limits, then accept slide). The owner has approved this style before (key-pose walk in letsgo-racing). It also keeps 'game logic separate from drawing': clips are plain data and motion-core has no rendering. Libraries are less useful because every robot clip that moved the legs or shoulders hit our joint limits, they rarely contain the station sports moves, and their look is generic.
**Confidence:** high
**Conflicts with confirmed decisions:** (1) 'Feet must never slide' (NEXT.md item 2, AVATAR-DIRECTION) together with 'do not slow the game's speeds' (NEXT.md 43b): the hybrid keeps feet planted at 8.6 m/s only with quick steps (about 6.6 steps/s with my run clip) or a sprint gait with long hops and about 0.07 s ground contact. Calm long strides at 8.6 m/s cannot keep feet planted (the leg falls 165-589 mm short), so the owner must choose (taste question 1); I do not override either rule. (2) NEXT.md items 1 and 7 tell assistants to use the SM64 walk reference (/home/user/3D-World-4/references/sm64-walk, built from n64decomp Mario animation data, with MP4/GIF renders published from public/references/sm64-walk). This conflicts with the never-use-Mario/SM64 rule; I recommend it is not used as reference or data. (3) The hybrid replaces the 'gait as a plain function of phase' approach of NEXT.md item 46 (already removed at the reset) but keeps every kept layer; no approved avatar part is reshaped. (4) Ownership: clips and the lock layer are avatar movement (Claude, motion-core). Station gameplay (Codex-led per COLLABORATION.md) should trigger clips through a small 'play action X at target Y' interface, so neither assistant edits the other's area.
**What would change it:** If the owner rejects key-posed motion as stiff after two or three rounds of stills plus motion, add AI video mocap of the owner (option e3) imported through the tested IK retarget tool. If a downloadable CC0 pack (UAL1/2 once the host is reachable) turns out to contain good sports motions in a compatible style, import more and author less. If the avatar rebuild changes joint limits a lot (for example the pending waist tilt), re-solve the stored targets; storing poses as targets is what makes this cheap. If the owner picks calm strides at top speed, cap playback at the sprint band and accept a measured slip there.

### Key numbers
1. Avatar legs: hip height 0.8395 m, thigh 0.367 m, shin 0.309 m, hip-to-ankle 0.676 m, standing height 1.8945 m (motion-core/skeleton/bones.js, measured via createSkeleton().solve)
2. Joint limits that matter for motion: thigh back 30° / forward 120°, waist turn ±35° with no lean, chest bend 0-15°, collarbone ±4°, head ±40° turn (/home/user/3D-World-4/motion-core/skeleton/bones.js)
3. Game speeds: walk 3.1 m/s, run 8.6 m/s, fixed 1/120 s (/home/user/3D-World-4/motion-core/tuning.js)
4. Walk-to-run change at Froude 0.5: 2.03 m/s for this avatar; walking physically impossible above 2.87 m/s (Fr 1); 3.1 m/s = Fr 1.17 (calculated; Fr ≈ 0.5 from Kram et al. 1997 https://www.sfu.ca/locomotionlab/assets/dynsimwalk1997.pdf)
5. 8.6 m/s on 0.84 m legs is dynamically similar to about 9.0 m/s for a typical man, a fast sprint (calculated, typical-man hip height approximate)
6. Data clip alone, playback tied to speed: slide 32-35% (4 keys), 12-17% (6), 13-15% (8), 4.9-6.8% (12) of ground speed; run clip 17-23% (scratch results-gaitclip.json)
7. Walk clip cadence with rate tied: 1.79 / 5.36 / 15.4 steps/s at 1 / 3 / 8.6 m/s; run clip 6.62 steps/s at 8.6 m/s (scratch tests)
8. Hybrid (clip + foot lock): 0 mm lock error, heel/ball exact, 13-25 mm per step of toe-tip creep, leg angle change ≤ 9.9° walk / ≤ 17.7° run (scratch tests)
9. Stride warping: ±20% speed mismatch kept exact; +40% left the leg 104 mm short (scratch); Epic's rule of thumb is a 15-20% maximum (https://www.unrealengine.com/tech-blog/adapting-lyra-animation-to-your-ue5-game)
10. Calm cadence at 8.6 m/s: 3.0 / 3.6 / 4.4 steps/s gives 49 / 40 / 27% slide; with the lock the leg is 589 / 370 / 165 mm short (scratch)
11. Zero-slide sprint at 8.6 m/s needs about 0.62 m of stance travel in about 0.073 s of ground contact (scratch sprint bake)
12. Viewers notice foot sliding below 21 mm in most conditions (Pražák, Hoyet, O'Sullivan 2011, https://diglib.eg.org/items/74844741-a900-4f91-886f-b89bf331cf98/full)
13. Animation cost: 0.95-1.65 ms per frame at 4× CPU slowdown in Chromium for clip + forward kinematics (+ lock) (scratch bench-browser.mjs)
14. Old approved 3D-WORLD-3 run: 2.55 steps/s at full stick, about 3.4 m of ground per step at 8.6 m/s, so heavy slide, yet approved 'wow i love it' (/home/user/isaiasurrutia96/3d-world-3/src/player/PlayerAnimation.ts lines 404-445; docs/DECISIONS.md lines 495-510)
15. RobotExpressive CC0: 43 joints, 14 clips; 35/63 of our bones map; source legs swing 59° (walk) and 82° (run) behind the pelvis vs our 30° limit (scratch results-retarget.json)
16. Proportions: arm/leg length ratio 0.88 for our skeleton vs 1.32 for the robot; avatar is 4.9 heads tall with thigh about 20% short of the human average (HANDOFF item 76)

### Time savers
1. One engine for all ~22 movements: every movement is a data clip on the existing pose player plus existing layers. No new algorithm per movement, which is where the 5-7 walk rebuilds went.
2. Approve key poses as still pictures first, then the motion. The owner prefers pictures, and it avoids 6-10 minute publish waits for poses that would be rejected anyway.
3. Batch owner reviews: several clips per Test Lab visit, and no docs-only pushes during a review window (every push restarts the 6-10 minute publish).
4. Reuse families: one underhand roll (bowling + skee-ball), one overhand throw (football; darts as a small variant only if it looks right), one swing (bat; golf as a variant), one kick, one sit pose per kart class with IK hands and feet. About 10 station clips cover about 13 stations.
5. Store key poses as foot and hand targets plus body height, solved into angles by reach.js. When the 6 ft 4 in avatar is rebuilt in code, re-solve instead of re-animating.
6. Start from motions the owner already approved (3D-WORLD-3 checkpoint-1 run and jumps, letsgo-racing walk poses), ported with approval, so first versions are closer to taste.
7. Use the tested IK retarget tool to pull in a CC0 clip as a draft or timing reference in minutes when one fits (Quaternius RobotExpressive works today; UAL once the host is reachable).
8. Check every clip automatically before the owner sees it: slide, penetration, joint limits, uneven frame rates and cost. The scratch harness (gaitclip.mjs) already measures these.
9. Settle the top-speed look (taste question 1) once, with a side-by-side A/B in the Skeleton section, before polishing any run. That avoids another rebuild cycle.
10. Skip motion matching, physics animation and paid libraries for version 1. They add months or license risk without helping a stylized ragdoll.

### Risks
1. The owner may still reject the looks: data clips change how fixes are made, not whether the pose is liked. Mitigate with stills first, A/B choices and starting from motions the owner already approved.
2. The skeleton will change when the New avatar (6 ft 4 in, longer legs, new joint centres) is rebuilt in code. Clips stored as raw joint angles would need redoing; store targets and re-solve.
3. Current joint limits (hip back 30°, no waist lean, chest 0-15°, collarbone ±4°) will cramp throws, kicks and swings. Retargeted clips already hit them. The pending waist-tilt item (AVATAR-POLISH-LIST item 4) affects this; widening limits is a skeleton change the owner must approve.
4. The toes pivot 6.5 cm above the sole makes the toe tip creep 13-25 mm per step during the heel-to-toe roll, around the 21 mm noticeable threshold. It needs a small foot-model fix or a toe-pose rule.
5. Catmull-Rom curves overshoot joint limits between keys (0.1-3.3° clamps measured) and dip feet 22-45 mm in run clips without the lock. Use more keys or a non-overshooting curve, and always run the lock.
6. Landing pop of 1-55 mm when the lock grabs a foot. Needs a 2-3 frame blend-in.
7. The SM64 walk reference in the public repo (references/sm64-walk and the published public/references/sm64-walk walk.mp4 / walk-slow.gif / poster.jpg, rendered from n64decomp Mario data) contradicts the never-use-Mario rule and NEXT.md still points to it. This is a legal and policy risk for the lead to raise.
8. Mixamo and Unity Asset Store terms forbid distributing raw files, and a public repo or web build exposes them. Rokoko, Fab, CMU and the AI-mocap terms were not confirmed from primary pages (hosts blocked).
9. Test limits: Chromium used a software GPU, timings are CPU-side at 4× throttle and not on the owner's iPhone. My test gaits are simplified (flat ground, straight lines, no turns or starts and stops), and the slide percentages depend on authoring quality.
10. Quaternius UAL could not be downloaded, so its bone names, clip list and suitability are unverified; RobotExpressive (same author) was used as a proxy.
11. Ownership boundary: station gameplay is Codex-led and avatar motion is Claude's. Without a small agreed 'play action' interface both may end up editing the same code.

### Owner taste questions
1. At full running speed (8.6 m/s), how should the legs look? (A) Feet stay exactly planted, which means very quick steps (about 6-7 a second) or long leaping hops with very short ground contact. (B) Calmer, longer strides where the feet slip a little, like the old 3D-WORLD-3 run you said 'wow i love it' to. (C) Lower the top running speed so calm strides can stay planted. A side-by-side test in the Skeleton section would let you pick by eye.
2. The gentle-stick speed tops out at 3.1 m/s, which is faster than anyone can actually walk, so the top of the 'walk' range will look like a light jog. (A) Keep 3.1 m/s and accept a jog look at the top of the gentle range. (B) Make the gentle range a true walk up to about 2 m/s, with a jog above that.

## Avatar movement method: skeptic
**Holds up:** True

### Problems

1. **Taste question 1 is presented as open, and option (C) 'lower the top running speed' goes against a decision the owner already confirmed. The owner answered this on 20 Nov 2026.**
   - Evidence: /home/user/3D-World-4/docs/NEXT.md item 43(b): 'The running gait keeps the cartoon, arcade feel that the game's speeds force (quick steps, long hops): "kind of like Super Mario" ... Do not slow the game's speeds or change the avatar for it.' Item 42(d)(4) had raised exactly this trade-off just before. The reset in item 47 removed code. It did not withdraw owner decisions.
   - Fix: Ask the owner to reconfirm 43(b), not to make a fresh three-way choice. Offer only options that keep 8.6 m/s, or label option C clearly as reversing a confirmed decision.

2. **The report says planted feet with a calm cadence at full speed are 'physically impossible' (the leg falls 589 / 370 / 165 mm short at 3.0 / 3.6 / 4.4 steps/s). That shortfall comes from keeping the run clip's ground-contact share fixed. Cadence is not the cause.**
   - Evidence: My re-test (scripts/reach-map.mjs, gait-verify2.mjs, tilt-check.mjs). With a rolling foot (heel strike, then flat, then heel-off), reach.js keeps the foot planted for 0.79 m of body travel at only 3 cm of hip drop, 0.85-0.95 m at 5-8 cm, and 0.84 m flat-footed at 15 cm. Bounding clips authored for 8.6 m/s at 3.0, 3.6 and 4.4 steps/s, with 0.087-0.099 s of contact, bake with at most 2.6 mm of error at 6 cm drop. Heel and ball slide is 0.1-1.4% of speed (96 keys). Thigh stays at -37° to +19° (limit +30° back), so the 30° hip limit is not what binds. The owner's own old code does the same thing: 3D-WORLD-3 apps/letsgo-racing/src/animation/sprint-clip.js plus README line 82 describe a 6.0 m cycle (3 m steps) at 4.35 steps/s, 12% contact, 13 m/s, with ankle travel matched to body travel.
   - Fix: Add 'long-hop bounding' as a real, testable top-speed option: calm steps, planted feet, about 0.1 s on the ground and 0.13-0.24 s in the air per step. This is what the owner asked for in 43(b) ('long hops'). Show it next to the 6.6 steps/s quick run.

3. **The claim that 'a data clip alone slides 5-35%' comes from interpolating a few joint-angle keys directly. Data clips do not slide by nature. The report concludes that the runtime foot lock is what stops sliding, but for steady straight running a densely baked clip already does that.**
   - Evidence: gait-verify2.json, walk clip with rolling feet and playback rate tied to speed, clip only, no lock. With 6 keys: 9.5% of speed (heel 15%). With 12 keys: 4.6%. With 48 keys: heel 0.2-0.7% and ball 0.1-0.4% at 1 / 1.2 / 3.1 / 8.6 m/s, and the planted pivot drifts about 1 mm per stance. Uneven 1/30 + 1/90 s frames gave the same result (1.4%). The pose player matched clip.sample exactly in every case (0° difference). The leftover 6% 'toe' slide is the raised toe-pivot geometry the researcher found. The letsgo-racing baker samples 120 and 480 times per cycle (run-clip.js samples=120, sprint-clip.js samples:480).
   - Fix: Author a few key poses, but store and play them baked densely (48-120 samples per cycle). Use the runtime foot lock only where it is really needed: wedges, quarter-block steps, turns, and speeds outside a clip's range.

4. **The runtime foot lock changes the approved key poses by a visible amount. That works against the 'approve still pictures first' workflow the report recommends.**
   - Evidence: gait-verify2.json: the lock changes leg angles by 3.8-7.9° in steady walk and run (48 keys), 12-15° with 12 keys, and 11.6-26.6° when it absorbs a ground-speed mismatch of x0.9 to x1.1. At x1.2 it breaks completely (147 mm error) because my run was near full leg extension. The researcher also reported up to 17.7°. Speeding up runs out of room first, slowing down tolerates more. How much it can absorb depends on how close the clip is to a straight leg.
   - Fix: Keep runtime corrections small. Author each clip at its own speed range, blend between clips, and treat the ±15-20% Lyra figure as the most a clip can absorb, not the normal working range.

5. **The report missed that the owner's own 3D-WORLD-3 code already implements the recommended pipeline end to end. This is the biggest time saver and the report left it out.**
   - Evidence: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-racing/src/animation/run-clip.js (bakeGaitClip: authored foot-path curves for contact, compression, toe-off, recovery and passing, baked with two-bone IK into keyframe clips), sprint-clip.js (long-stride sprint), running.js (walk and sprint blended by speed with a shared stride phase, jump blend, landing dip, shoe-penetration guard), running-controller.js line 49 (phase += travelled / stride, with stride interpolated by speed, so the phase is driven by distance travelled). The README calls the walk poses 'approved'. The report cited only run-clip.js, as a pose reference.
   - Fix: With the owner's approval (CLAUDE.md rule 9: reference only), port this baker and the distance-phased blend into motion-core as clip data on the existing pose player. Then refit the curves to our 63-bone skeleton.

6. **The report missed a CC0 human animation library that this session can actually download. It also wrongly says the station sports motions are 'few or none' in CC0 packs.**
   - Evidence: Mesh2Motion (github.com/scottpetrovic/mesh2motion-app, HEAD 017169a, 20 Nov 2026). The README says 'The art assets (3d models, rigs, animations) are all licensed under CC0', and LICENSE-CC0.MD names 'All 3d models, blend files, rigs, animations'. The code is MIT. static/assets/manifest.json lists 234 human clips, 87 of them tagged 'quaternius'. They include Bow Pull Back / Bow Release (archery), OverhandThrow, Throw Object, Spear/Knife/Grenade throws, Kick Front / Side, Two_Handed_Horizontal_Swing (bat-like), Driving (seated), Sitting_Enter / Exit, Jump_Start / air / Land, Walk / Jog / Sprint, climbing, swimming, Pick Up and Victory. Missing: basketball set shot, bowling roll, billiards, putt, skateboard, frisbee. I fetched it with a blobless git clone. A secondary news item (cgworld.jp) says some character models carry other CC licenses, so check each asset.
   - Fix: Use Mesh2Motion CC0 clips as drafts for the stations they cover, imported through the IK retarget idea. Its MIT retargeter (src/retarget/human-retargeting/) is worth studying. Keep a copy of the license with each imported clip and check each clip's source.

7. **The report blames library-clip clashes mainly on the 30° hip-back limit, using a cartoon robot. Human CC0 clips show the real blockers are in the torso. Hand-authored athletic moves will hit the same walls.**
   - Evidence: scripts/inspect-human.mjs, out/human-inspect.json, 12 Mesh2Motion human clips. Walk fits the legs (thigh 20° back, trunk lean 7-9°). 11 of 12 clips move the collarbone more than our ±4° (5-39°). Jog, Sprint, OverhandThrow, Throw Object, Jump_Start / Land and Sitting_Enter lean the trunk 26-57° forward, against our 0-15° chest bend with no waist lean. Kick Front and OverhandThrow lean back 18-23°. Throw Object and Bow Pull twist 63-68°, against our 35 + 15 = 50°. Kick Front lifts the thigh 135° (our limit is 120°). If the whole body tilts to make up the lean, the thigh-back need rises to 48° (jog), 56° (sprint) and 72° (overhand throw).
   - Fix: Make the torso joint ranges a gate before authoring throws, swings and kicks: waist tilt (AVATAR-POLISH-LIST item 4, pending), collarbone range and total twist. This changes the skeleton, so it needs the owner's approval (HOW-TO D2).

8. **The report's process conflicts with a confirmed owner rule. It plans '22 clips in three batches' and lists 'batch owner reviews: several clips per visit' as a time saver.**
   - Evidence: /home/user/3D-World-4/docs/HANDOFF.md 'Confirmed by the owner' item 1 and NEXT.md item 47: 'Add one movement at a time ... Move on only when the owner says it looks good.'
   - Fix: Flag this as a process question for the owner, for example whether practice-station motions may be approved as 'good enough for now' placeholders in groups so the field becomes playable sooner. Until the owner answers, plan for sequential single-movement reviews and estimate time on that basis.

9. **The report did not address the owner's pending game-feel goal for throws. Fixed clips play back the same way every time.**
   - Evidence: /home/user/3D-World-4/docs/HANDOFF.md item 75(b), waiting for approval: 'natural variation so no two attempts land the same; heavy limbs with momentum and a ragdoll-like follow-through; no power meters'. The report pushes physics and secondary motion to 'later'.
   - Fix: Plan two cheap layers on top of the action clips. First, aim and power that move the IK hand targets, plus 2-3 blended variants. Second, a damped-spring follow-through layer on arm and chest joints. pose.js already uses a critically damped spring for fingers (glideFingers). Not tested.

10. **The report understates the SM64 exposure, and the fix runs into the frozen-checkpoint rule.**
   - Evidence: Besides references/sm64-walk, references/avatar-walk/README.md says its source is 'the existing pinned SM64 MARIO_ANIM_WALKING (0x48)' retargeted onto our avatar. references/motion-compare does the same. /run-test/ plays it ('the original source step sequence retargeted'; run-test/build.mjs imports references/motion-compare/hand-bind.mjs). README.md line 24 links the motion comparison publicly. checkpoints/test-lab-1/run-test and walk-test are frozen copies.
   - Fix: The lead should raise this with the owner. Never use run-test, avatar-walk or motion-compare as a starting point. Removing them from a frozen checkpoint conflicts with 'frozen checkpoints never change', so that is the owner's call.

11. **The report overstates how new the hybrid is. A clip with planted contacts matched to stride was already tried in this repo, and most earlier rejections were about looks and glitches, not technique.**
   - Evidence: /home/user/3D-World-4/run-test/README.md, 17 Nov: 'During support, that contact point stays fixed horizontally ... Forward travel and clip phase follow the same measured stride.' NEXT.md item 4 ('descending imaginary stairs'), item 42(d)(2) ('knee snaps straight ... looks violent'), item 45 ('glitches', 'spaz' after button presses), item 46(b) ('feet skate').
   - Fix: Present the hybrid as a change in how fixes are made (edit poses by eye), not as a guarantee of approval. Keep the owner's specific complaints as automatic checks: hip drop, knee snap and joint jolt, slide, switching between buttons.

12. **Version 1 is too heavy for one person. Walk / run / sprint cross-fades, stride warping, runtime lock, balance and grip all at once bring back the many moving parts that glitched in the reactive gait.**
   - Evidence: NEXT.md items 41-46 (moving parts, button-switching bugs). My tests show distance-phased dense clips need no runtime lock on flat ground. docs/WORLD-RULES.md has wedges and quarter-size steps, which need foot IK later.
   - Fix: Order the work as follows. (1) Flat-ground locomotion from dense clips, with the phase driven by distance. (2) Jump, land and kart get in/out. (3) Ground-adapt foot lock for wedges and steps. (4) Action clips with hand targets.

13. **The report's sequencing ignores that the skeleton is about to change.**
   - Evidence: HANDOFF items 77-80: the 6 ft 4 in avatar has longer thighs and calves, and the owner said 'once i am 100% satisfied you will then rebuild that exact avatar in solid code'. bones.js still holds the old lengths.
   - Fix: Settle the bone lengths and joint limits first, then author clips. Store poses as foot and hand targets plus body height (the report suggests this, rightly) so they can be re-solved.

### Factual errors
1. '3.1 m/s is already faster than anyone can physically walk' is false. Competitive race walkers keep up roughly 4.2-4.4 m/s over 20 km (my recollection is a world record of about 1:16-1:17; I could not re-verify it because the web-search budget ran out). The correct statement: 3.1 m/s is above the normal walk-to-run change (about 2 m/s) and above Froude 1, so on these legs it reads as a jog unless it uses a race-walk hip action.
2. 'Planted feet at full speed with calm legs is physically impossible' is false for this skeleton. My tests show a rolling-foot stance of 0.75-0.85 m is reachable, and bounding clips at 8.6 m/s with 3.0 / 3.6 / 4.4 steps/s bake with at most 2.6 mm error and 0.1-1.4% heel/ball slide. The 165-589 mm shortfalls only hold if the contact share stays at the run clip's value.
3. The report says 'On its own a data clip lets the feet slide 5-35% of the running speed.' That is true only when a few joint-angle keys are interpolated directly. A clip baked densely from the same foot paths slides 0.2-0.7% at the heel and 0.1-0.4% at the ball at 1-8.6 m/s, with no lock.
4. Taste question 1 is not open. The owner chose 'quick steps, long hops ... do not slow the game's speeds' on 20 Nov (NEXT.md 43b).
5. 'Few or none of the exact station sports motions ... are confirmed in these packs' is outdated. Mesh2Motion's CC0 human set includes archery (Bow Pull Back / Bow Release), an overhand throw, kicks, a two-handed horizontal swing, driving and sitting enter/exit.
6. The report implies a clip with planted contacts is untried here. /run-test/ (17 Nov) already plays a retargeted clip with stride-matched planted forefoot contacts on phones, built from SM64 data.
7. The SM64 risk is described as references/sm64-walk only. references/avatar-walk, references/motion-compare and /run-test/ also use MARIO_ANIM_WALKING data on our avatar, and README.md links the comparison publicly.
**Retest:** I wrote all tests from scratch in (scratch folder, not saved) plan2/verify-animation/scripts. They import the read-only motion-core files directly and never modify them. Outputs are in (scratch folder, not saved) plan2/verify-animation/out.

(1) reach-map.mjs: the longest stance where reach.js keeps the foot planted (error under 1 mm, joint limits respected), with the foot rolling heel, then flat, then heel-off. At hip drop 0 / 3 / 5 / 8 / 10 / 15 cm: flat foot 0.06 / 0.40 / 0.50 / 0.64 / 0.69 / 0.84 m; with 15° heel strike and 30° heel-off 0.20 / 0.79 / 0.85 / 0.95 / 0.99 / 1.08 m.

(2) gait-verify2.mjs: walk (1.2 m/s, 2 steps/s, 0.72 m stance) and run (3.9 m/s, 3 steps/s, 0.78 m) gaits written as foot-path data. Each was baked into createClip with 6, 12 or 48 keys and played through createPosePlayer.setLayer({fn}) with my own clip clock, so playback rate follows speed. Player and clip.sample matched exactly (0°) in every run. Walk slide, clip only, as a share of speed: 6 keys 9.5% (heel 15%), 12 keys 4.6%, 48 keys 1.2-1.7% overall, of which heel 0.2-0.7% and ball 0.1-0.4% at 1 / 1.2 / 3.1 / 8.6 m/s. Planted pivot drift was about 1 mm per stance, plus about 6% toe creep from the toe pivot sitting 6.5 cm up. Cadence at 3.1 m/s was 5.17 steps/s and at 8.6 m/s 14.3 steps/s, so one clip cannot cover the whole speed range. With my foot lock (heel pinned at touchdown, rolled ankle goals): heel 0.1-0.2%, ball 0%, pivot drift 0 mm. The lock changed leg angles by 3.8-7.9° (48 keys). Uneven 1/30 + 1/90 s frames gave the same result. Stride-warp test (run at fixed rate, ground speed changed, with lock): x0.8 / 0.9 / 1.1 held (8 mm, the same as the bake error) but changed angles by 21.5 / 11.6 / 26.6°; x1.2 to x1.4 failed with 147-296 mm error.

Bounding clips authored for 8.6 m/s at 3.0, 3.6 and 4.4 steps/s (stance 0.75-0.85 m, 0.087-0.099 s contact): bake error 2.6 mm (6 cm drop) or 11 mm (3 cm drop). With 96 keys, heel and ball slide 0.1-1.4% and pivot drift 0.1-5.5 mm.

(3) tilt-check.mjs: in those stances the foot orientation is exact (0° tilt), thigh -37° to +19°, ankle -34° to +19°, all inside limits. The legs come close to full extension, so knees can look locked unless the hip drops more.

(4) cost.mjs: in Node, unthrottled, clip plus forward kinematics took 0.22 ms per frame, and with a two-foot lock 0.35 ms. This agrees with the researcher's 0.20-0.39 ms. I did not re-run their 4x-throttled Chromium measurement.

(5) inspect-human.mjs on 12 Mesh2Motion CC0 human GLBs (meshopt-compressed, UE-mannequin-style rig with 66 joints: pelvis, spine_01-03, clavicle_l, thigh_l, calf_l, foot_l, ball_l and so on). The torso clashes listed under problems were measured from world-space joint positions. This method is approximate.

(6) I checked the claims against the repo and the old repo. Confirmed: DECISIONS.md lines 495-510 and 1311-1338; PlayerAnimation.ts 2.55 steps/s; the joint limits; the bone lengths; 63 bones; the Froude arithmetic. Found: NEXT.md 43(b) and 47, HANDOFF items 75-80, letsgo-racing sprint-clip.js / running.js / running-controller.js, and the run-test, avatar-walk and motion-compare READMEs.

Web: the Pražák 2011 finding (sliding under 21 mm is noticeable; corrected motion preferred; limb lengthening preferred over IK) is confirmed by the abstract via search. The Lyra 15-20% rule is confirmed by a search snippet only, because unrealengine.com is blocked here.

Not tested: anything visual, turns, starts and stops, slopes, the bounding gait's up-and-down body arc (my body height stayed constant), real iPhone timing, retargeting the Mesh2Motion clips onto our skeleton (I only measured their ranges), and per-asset legal review of those clips. The web-search budget ran out, so I could not verify the race-walk record, Cascadeur pricing or Kenney pack contents.
**Improved recommendation:** Keep the researcher's main choice. Each movement is a short list of key poses stored as data and played by the pose player motion-core already has, with the existing leg and hand solvers on top. No Mixamo, no motion matching, no physics-driven animation in version 1. Change five things to save time and avoid another rejected round.

1. Settle the skeleton first. The avatar is about to be rebuilt in code at 6 ft 4 in with longer legs. Almost every athletic move needs the torso to lean and twist, and it currently cannot: the collarbones move only 4°, the waist cannot lean, and total twist is 50°. Free human animations break those limits in 11 of 12 clips. So decide bone lengths and these joint ranges with the owner (waist tilt is already polish item 4) before making many movements. Store every pose as "where the feet and hands go" so it can be re-solved after any change.

2. Do not rebuild walking from scratch. The owner's old LetsGo Racing code (3D-WORLD-3) already does what is needed: a few hand-made key poses baked into smooth clips, walk and sprint blended by speed, and leg timing driven by distance travelled. My tests show this keeps heel and ball planted within about a millimetre on flat ground, with no extra solver running. With the owner's approval, port it onto the new skeleton. Add the foot-planting solver later, only for ramps, small steps and sharp turns.

3. Top running speed. The owner already said on 20 Nov: keep 8.6 m/s, cartoon feel, "quick steps, long hops, like Super Mario". Planted feet at that speed are possible. Show three planted versions side by side and let the owner pick by eye: quick steps (about 6.6 a second), sprinter steps (about 4.4), and long leaping hops (about 3 a second, mostly in the air). Add a fourth that lets the feet slip a little at top speed, like the old run the owner loved, by fading the foot lock as speed rises.

4. Practice-field motions. Make them as short one-off clips with hand targets on balls, bats and bows. A free CC0 library (Mesh2Motion: 234 human clips, MIT code) has drafts for the throw, archery, kicks, a two-handed swing (bat), driving, sitting down, getting up and jumps. Use those as starting points and adjust them to the avatar. Make the rest by hand: basketball shot, bowling roll, putt, billiards cue and skateboard. For throws, add aim and power that change the hand targets and a small "heavy follow-through" spring, so no two throws look the same. This matches the owner's pending game-feel note.

5. Process. The owner's confirmed rule is one movement at a time, approved by eye. Ask the owner one question: can practice-station motions be approved in groups as "good enough for now" placeholders, so the field becomes playable sooner? Never build on /run-test/, avatar-walk or motion-compare, because they use Mario data. Ask the owner what to do about the frozen copies.

A realistic version-1 list, in order:
- (a) idle, walk, run and the chosen top-speed style
- (b) jump (take-off, air, land) and turn on the spot
- (c) kart get-in, seated drive (one sit pose per kart class, hands on the wheel and feet on the pedals by IK), get-out
- (d) skateboard stance with carve lean, push, ollie, getting on and off
- (e) about 10 station clips by family: set shot, kick, overhand throw (football and darts), underhand roll (bowling and skee-ball), bat swing, putt, archery, cue stroke, frisbee, aim and fire

Long jump and the obstacle course reuse run and jump.

### Missed options
1. Port the owner's own 3D-WORLD-3 letsgo-racing clip pipeline (run-clip.js bakeGaitClip, sprint-clip.js, running.js, running-controller.js) as the locomotion template, with approval. It is option (d) already built in the owner's own code.
2. Mesh2Motion CC0 human animation library (234 clips, 87 from Quaternius) plus its MIT human retargeter. Downloadable here via git from github.com/scottpetrovic/mesh2motion-app. Covers archery, overhand throw, kicks, a two-handed swing, driving, sitting enter/exit, jumps, walk / jog / sprint, climbing and swimming.
3. Leg timing driven by distance travelled divided by a speed-dependent stride length, instead of time-based playback rate. Used in letsgo-racing and /run-test/. The legs stop when the body is blocked, and start/stop acceleration stays consistent.
4. Bounding sprint authored for 8.6 m/s: planted feet with a calm cadence of 3-4.4 steps/s, about 0.1 s contact and a long flight. Tested as feasible on this skeleton.
5. Foot-lock weight that depends on speed (setGoals weight): a single tuning knob from fully planted at walking speed to a little arcade slide at top speed, so the owner can choose by eye.
6. Cheap secondary motion: critically damped springs on arm and chest joints for follow-through and heavy limbs, plus aim and power driving the IK hand targets and 2-3 blended variants, for the 'no two throws alike' goal (HANDOFF 75b). The spring pattern already exists in pose.js glideFingers.
7. Placeholder-first station motions (CC0 drafts or quick key poses) so the practice field becomes functional sooner, if the owner agrees to relax the one-movement-at-a-time rule for stations.
**Confidence:** medium

## Skate park: research
**Question:** What is the smallest fun skateboarding system and skate park for the miniature island, and how should it be built?
**Summary:** Build skateboarding as its own small "board vehicle" that sticks to whatever surface it rolls on: flat ground, ramps, even a vertical wall. Use no physics engine. I built and tested this in plain JavaScript at 120 steps per second. It climbed and came back down quarter pipes at every tested speed, never sank into the ramp, never lost contact with the ramp by mistake, and cleared or landed on a 0.43 m block with timing windows of about 0.2 to 0.4 seconds at normal speeds (4 to 6 m/s). Two other methods failed the same tests. The existing kart ground model drives straight up any ramp at constant speed and never comes back. A real physics engine (Rapier) bounced off ramps, flipped in the air, and with one setting stuck to the ramp and even gained speed. The best fun per hour of work comes from a short move list: push, lean to steer, brake, one-button ollie, automatic grind on blocks marked "grindable", a simple air spin, and a fall with a quick get-up. Leave flip tricks, grabs, manuals and bowls for later. A skate plaza of about 40 x 28 blocks (17 x 12 m, the size of a real small "skate spot") fits a mini ramp, a kicker, a ledge, a low box, a flat rail and a funbox. It can share a concrete pad with the obstacle course, and its paths can form the skate race. One thing must come first, and it helps other games too: the island's collision currently treats every block as a full cube, so ramp shapes (wedges and smooth curves) must be added before any ramp can be ridden.

### Options

1. **A. Surface-aligned kinematic board on a 3D surface query (RECOMMENDED)**
   - How it works: The board is a point between the wheels plus a heading and an up direction. Each 1/120 s step: rotate heading/velocity about the surface normal for steering; add push, rolling resistance, brake; apply only the along-surface part of gravity; move; re-project onto the surface with a signed-distance query; rotate velocity with the surface so speed is kept. It leaves the surface only when free flight would carry it above the surface (the physical 'normal force reaches zero' test), so it sticks inside curved ramps but launches off lips and kinks. Air is plain ballistic flight with sub-steps; landing checks board-vs-motion angle and impact speed (bail). Steep faces are rideable only on ramp shapes, never on block sides. Optional 'vert lock' (THPS-style) cancels motion over the deck when leaving a steep lip so the rider drops back in.
   - Pros: Passed every core test; tiny cost (0.037 ms per step on a 4x-slowed CPU); no new dependency; deterministic fixed step like racing-core; handles sub-vertical and true vertical ramps, kickers, ledges, grinds with one code path; every feel number is a plain parameter the owner can tune.
   - Cons: Hand-written, so edge cases must be found by tests (I found and fixed 5 during this session). Needs a new surface query for wedge/smooth shapes. The board is a point plus probes: rolling slowly off a high edge still chatters, and it needs two-truck pitch like the kart's front and rear probes. Angled airs need a landing assist.
   - Evidence: Prototype: (scratch folder, not saved) plan2/skate/board.mjs (288 lines) and surfaces.mjs (122 lines); results in final-results.json and browser-bench.txt in the same folder. Technique matches common practice: downward ray/normal alignment and faking/snapping half-pipe behaviour (Unity forum 'Tony Hawk style Skateboard Game' https://discussions.unity.com/t/tony-hawk-style-skateboard-game/67137 ; Roblox DevForum 'Orient skateboard to ground' https://devforum.roblox.com/t/orient-skateboard-to-ground/1630305 ; Godot forum edge-detection thread https://godotforums.org/d/41345-detecting-sharp-edges-raycasting). THPS has a default vert lock with a 'break out of vert in the air' trigger (Activision support controls page, seen only as a localized search snippet: https://support.activision.com/tony-hawks-pro-skater-1-2/articles/controls-and-tricks-in-tony-hawks-pro-skater-1-2).
   - Test result: Quarter pipe sized to the block grid (4 blocks long, 3 high, radius 1.79 m, 73.7 deg lip), 120 Hz: entries of 3/4/5 m/s returned to flat with 77/85/89% of their speed (the rolling-resistance number is a placeholder), 0 false detaches, 0 mm sinking into the ramp. Without vert lock, 5.5-8 m/s went over the 74 deg lip and landed on the deck, as a real mini ramp does. With vert lock, 5.5-8 m/s rose 0.06-1.56 m above the lip and returned (landing impact 0.22-3.85 m/s, 77-88% speed kept). True vertical ramp (1.94 m lip): returned at every speed from 3 to 8 m/s; at 7 and 8 m/s it rose 0.33 and 1.05 m above the lip and came back in (impact 0.18-0.28 m/s, 92-93% speed). Angled entries of 20 and 40 deg on a 16-block-wide ramp all returned except 40 deg at 6.5 m/s on the 74 deg ramp (landed 83 deg sideways: bail). On the 8-block-wide ramp, angled riders rolled off the side. Ollie over the 0.43 m block, checked independently against the island's own VoxelWorld.boxBlocked: 0 disagreements beyond 1 cm.

2. **B. Height-field board (racing-core kart style: heightAt(x,z))**
   - How it works: World answers only 'ground height under x,z'. A: kart-like (horizontal speed, y snapped to height, vertical speed zero on ground, no slope gravity). B: same plus slope gravity and a launch test.
   - Pros: Reuses the kart's existing world interface; very simple.
   - Cons: A cannot skate at all. B cannot represent a vertical wall (a height field has one height per spot), so true vert and anything overhanging is impossible; still needs the same air/landing/grind code as option A.
   - Evidence: racing-core/kart/index.ts lines 230-246: grounded y = heightAt and verticalVelocity = 0; pitch clamped to 0.4 rad (maxPitch); README says jumps belong to later layers. Test script: (scratch folder, not saved) plan2/skate/heightfield.mjs, results heightfield-results.txt.
   - Test result: A (kart-style): at every speed from 4 to 8 m/s it drove straight up both quarter pipes onto the deck at constant horizontal speed, never slowing, never airing, never returning. B (slope gravity): fine below the lip (4 and 5 m/s returned at 3.5 and 4.6 m/s), and launched off the 74 deg lip onto the deck, but on the true vertical ramp it failed. At 6 m/s it glitched at the collapsed vertical step and came back faster than it went in (6.2 vs 6.0 m/s). At 7 and 8 m/s it rode onto the deck instead of going up and falling back in.

3. **C. Physics-engine rigid body board (Rapier 0.14, WASM)**
   - How it works: Dynamic body with 4 frictionless wheel balls plus a deck box, rider mass lumped low; ramp as a triangle mesh with internal-edge fix; ollie = upward velocity kick.
   - Pros: Real collisions for free; ollie over a simple block worked (253-367 ms windows at 3-6 m/s).
   - Cons: Adds about 767 KB gzipped to every phone download. Needs hand-written balance, steering, air levelling, landing and grind code on top anyway, which together make up most of option A. Contact behaviour on ramps was unreliable.
   - Evidence: Script (scratch folder, not saved) plan2/skate/rapier-test.mjs; results rapier-results-noccd.json and rapier-results-ccd.json. Bundle measured: node_modules/@dimforge/rapier3d-compat/rapier.es.js 2,059,628 bytes raw, 766,613 bytes gzip. Roblox's own built-in skateboard class (SkateboardPlatform) is deprecated (https://create.roblox.com/docs/en-us/reference/engine/classes/SkateboardPlatform).
   - Test result: Without continuous collision: the 74 deg ramp at 4 m/s returned (97.5% speed). At 5 m/s the wheels lost contact for 36 of 164 ramp steps and the board tilted up to 18 deg away from the ramp. At 6 and 7 m/s it aired off the lip and FLIPPED (no air control). The true vertical ramp returned at 4-7 m/s but lost contact for 25% of ramp steps at 6-7 m/s. With continuous collision ON: the board stalled at 0.47-0.79 m height whatever the speed, and on the vertical ramp it came back FASTER than it entered (102-112%), so the solver was adding energy. Cost 0.03-1.4 ms per step in Node.

4. **D. Spline / line rails for grinds (path-following), auto-built from 'grindable' blocks**
   - How it works: Grind lines are straight segments along the exposed top edges of blocks that have the rulebook's universal 'grindable' setting, merged into long lines. While airborne and dropping onto a line (within 0.25 m sideways, at most 60 deg off its direction), the board locks to it: it slides along the line with grind friction plus gravity along the line, leaves at the end, or ollies out.
   - Pros: No hand-placed rails: any ledge, box or rail built from grindable blocks becomes grindable automatically. This is how Sonic games treat rails too (a path flag, no collision needed). Forgiving capture windows. About 90 lines of code.
   - Cons: Sloped handrails and curved rails need the same code with sloped or curved segments (the code allows slope, but I did not test it). Balance or 'perfect grind' is not modelled.
   - Evidence: grindEdges() in (scratch folder, not saved) plan2/skate/tests.mjs; rulebook universal setting 'grindable' (src/world/rulebook.ts UNIVERSAL_SETTINGS; docs/WORLD-RULES.md D.6). Sonic rails as spline flags without collision: https://info.sonicretro.org/SCHG_How-to:Create_Splines_For_Sonic_Generations . EA Skate has no grind button (https://www.gamesradar.com/skate-hands-on/2); OlliOlli World holds the stick toward the rail (NME/VGC coverage).
   - Test result: Edge extraction on a 6 x 1 block ledge gave exactly 2 long edges of 2.58 m and 2 short edges of 0.43 m. Automatic capture windows on a 0.43 m ledge edge (pop time swept every 5 ms): 10 deg approach 575-1020 ms, 20 deg 330-1270 ms, 30 deg 240-350 ms, 45 deg 175-265 ms. With grind friction 0.15 g, every 45 deg / 3.5 m/s grind stalled (53 of 53). At 0.06 g all 53 exited cleanly (average exit speed 1.55 m/s).

5. **E. Scripted/authored ramps (THPS-style fake vert: per-ramp 2D curve paths, snapping)**
   - How it works: Each ramp carries a hand-authored path; on entry the skater is locked to a 2D curved plane and moves along it; air off a lip is locked to come back in.
   - Pros: Very predictable, arcade-friendly; used by hobby projects and advised on forums.
   - Cons: Every ramp needs authored data. Free 3D carving across ramps at an angle is lost. The vert-lock part already exists as one option inside A, at about 10 lines.
   - Evidence: Unity forum advice to fake half-pipes with predefined ramps and a snapping mode (https://discussions.unity.com/t/tony-hawk-style-skateboard-game/67137); hobby project treating vert as a 2D curved plane (tutasmaster.github.io/project/skate, seen only in a search summary: host blocked here).
   - Test result: Not tested as a separate system, because option A with vert lock already passed the same quarter-pipe tests without per-ramp authoring.

6. **F. Move set: minimal / recommended / full**
   - How it works: Minimal = push, steer, brake, ollie, bail. Recommended = minimal + automatic grind + vert-lock airs + simple air spin (180/360) + quick get-up. Full = + manuals, flip tricks, grabs, reverts, wallrides, combo scoring, balance meters.
   - Pros: Recommended set covers every verb in docs/FEATURES.md card 9 item 11 (stand, push, lean, ollie, grind, land, fall off, swing) and skate racing's grind shortcut (MINIGAMES card 20), using almost only physics code already prototyped. Card 9 itself says 'Tricks later'.
   - Cons: Full set is mostly animation work and scoring UI with little new physics; poor fun per hour for a first playable.
   - Evidence: Approximate prototype code per feature (board.mjs): ground riding with steer/push/brake/walls/vert-lock about 85 lines; air, landing and bail about 75; grind about 60 (+30 edge extraction); ollie about 6; air spin about 2. Games: OlliOlli World uses one push button and stick flicks (NME https://www.nme.com/features/roll7-co-founders-talk-olliolli-world-its-a-love-letter-to-skateboarding-3148282); Session's realistic one-stick-per-foot scheme has a steep learning curve (Red Bull https://www.redbull.com/us-en/session-skateboarding-game-launch-interview ; Softpedia review); SkateBIRD's simplified controls drew 'imprecise controls' criticism (https://nintendoworldreport.com/review/58349 , https://www.windowscentral.com/skatebird-xbox-review); Roblox skate games commonly use Space = jump/ollie (Sportskeeda Skate Obby guide); GTA 5 skating exists only as a mod (gta5mod.net), and I found no official GTA 6 or Fortnite skateboard mechanic.
   - Test result: Air-spin landing check: spins of 0, 30, 135 and 180 deg rode away (180 lands as fakie). 60 and 90 deg bailed (rule: more than 50 deg across the motion). Ollie height sweep over the one-block obstacle: 0.5 m ollie needs at least 4 m/s and gives only 63-88 ms windows at 4-5 m/s, which is too strict. 0.6 m gives 70/178/224/283/329+ ms at 3/4/5/6/7 m/s. 0.7 m gives 140/243/320/392 ms at 3/4/5/6 m/s.

7. **G. Park layout: skate dot / skate plaza / plaza + skate race loop**
   - How it works: Dot (about 24 x 20 blocks = 10.3 x 8.6 m, 89 m2): one quarter pipe (7 x 12 blocks), one kicker (2 x 4), one ledge (6 x 1 x 1 high), one low box (6 x 2 x half high). Plaza (RECOMMENDED, about 40 x 28 blocks = 17.2 x 12.0 m, 206 m2): mini ramp (two block-fitted quarter pipes, 3 blocks deck each, 6 blocks flat bottom: 20 x 12 blocks), kicker 1:2 (0.86 x 0.43 m) with at least 9 blocks of clear landing, ledge 6 x 1 x 1, low box 6 x 2 x half (0.215 m, the same as a real 9-inch grind box), flat rail 6 blocks long at 3 quarter-blocks (0.32 m), funbox 7 x 4 x 1, approach lanes of at least 8 blocks. Plus race loop = plaza + the island's concrete paths (3-4 blocks wide) as a skate race course, with the ledge as the grind shortcut. No bowl: it needs surfaces curved in two directions, which the block 'smooth surface' shape does not cover.
   - Pros: The plaza is the size of a real small 'skate spot' and every piece is blocks plus one reusable quarter-pipe smooth piece. The race loop costs only paths.
   - Cons: The plaza takes about 206 m2 of island; the dot is cheaper but has little variety. A 0.43 m ledge is a bit taller than typical real ledges (12-15 in, 0.30-0.38 m), but it is one block and tested clearable.
   - Evidence: Real size tiers: Seattle skate dot under 1,500 sq ft (139 m2), skate spot 1,500-10,000 sq ft; NRPA says one simple element needs about 1,500 sq ft including approach (search summaries of https://www.westsideseattle.com/node/8877 , https://skateparktour.ca/skatepark-typology , https://nrpa.org/parks-recreation-magazine/2012/february/skate-spots ). Ramp feel is set by radius and height; a 6 ft radius is cited as good for beginners (search summary, OC Ramps pages). Grind box 9 in (https://ocramps.com/products/grind-box-4-foot); ledges 12-15 in (https://www.skateboardhere.com/skateboard-ledge.html); deck 28-32 in long, wheelbase 13-15 in (https://www.evo.com/guides/skateboard-guide-and-size-chart). Block-fitted transition: 4 blocks long and 3 high gives R = (1.72^2+1.29^2)/(2*1.29) = 1.79 m, about a standard '4 ft mini ramp with 6 ft radius'.
   - Test result: Elements tested in the prototype: the quarter pipe (above); the kicker 1:2 needs more than 3 m/s (at 3 m/s it reached 0.37 m and rolled back) and jumped 0.89/1.71/2.65/3.72 m past the lip at 4/5/6/7 m/s with landing impacts of 3.1-3.9 m/s; the 1:1 wedge jumped 0.82-4.88 m at 4-7 m/s; the ledge was landed on with 253-320 ms windows at 3-5 m/s (0.6 m ollie). Layout footprints are calculated, not playtested.

### Tests run

1. **Quarter-pipe climb and return (surface-aligned board)**
   - How: Plain JS prototype, fixed 1/120 s. Two ramps (74 deg block-fitted mini ramp; true vertical with a half-block vertical extension), entry speeds 3-8 m/s, with and without vert lock, plus 20 and 40 deg angled entries on a 16-block-wide ramp. Script tests.mjs, output final-results.json.
   - Result: Returned to flat in all non-lock cases up to 5 m/s (74 deg) and all cases 3-8 m/s (vertical). With vert lock, all 74 deg cases 5.5-8 m/s returned. 0 false detaches, 0 sinking into the ramp in every passing case. Speed kept 77-93%. One angled case bailed (40 deg at 6.5 m/s, landed 83 deg sideways).
   - Limits: Point board with 5 probes, no two-truck pitch. Rolling resistance 0.02 is a placeholder (no measured value found). Rolling slowly off the back of a 1.29 m deck produced 4-5 one-tick re-landings and up to 11-12 cm momentary sinking before dropping. Rider body collisions not modelled.

2. **Ollie over a 0.43 m block and onto a 1.72 m ledge, cross-checked with the island collision code**
   - How: Swept the pop point every 1 cm for speeds 2-7 m/s and ollie heights 0.5/0.6/0.7 m. Every flight was checked independently with VoxelWorld.boxBlocked imported from /home/user/3D-World-4/src/world/collision.ts (read-only import).
   - Result: 0.6 m ollie, one block: windows of 70/178/224/283/≥329 ms at 3/4/5/6/7 m/s; ledge land-on-top 253/298/320/300/230 ms at 3-7 m/s. Final run: 0 disagreements with the voxel check (1 cm tolerance). Earlier runs found and fixed a bug where the board tail passed 13 cm through the block.
   - Limits: Perfect scripted input. Human touch latency on a phone was not measured. Windows at 6-7 m/s were cut off by the sweep starting at 1.5 m, so they may be larger.

3. **Kicker jumps**
   - How: Three wedge sizes (1:2, 1:1, 2:3 in blocks), approach 3-7 m/s, no input.
   - Result: 1:2 wedge: no launch at 3 m/s; 0.89/1.71/2.65/3.72 m jumps at 4/5/6/7 m/s; landing impact 3.1-3.9 m/s; no bails.
   - Limits: Board levels itself in the air at a fixed 4 rad/s; landing assist not tuned.

4. **Automatic grind on a ledge edge auto-extracted from voxel cells**
   - How: 6 x 1 ledge, approach angles 10/20/30/45 deg at 3.5 and 5 m/s, pop time swept every 5 ms; grind friction 0.15 g vs 0.06 g (grindfriction.mjs).
   - Result: Capture windows 175-1270 ms. At 0.15 g, 45 deg at 3.5 m/s stalled every time; at 0.06 g all exits were clean.
   - Limits: Straight rails only. Sloped and curved rails, balance and the grind button option were not tested.

5. **Air spin landing rule**
   - How: Ollie at 5 m/s with 0-180 deg of air spin.
   - Result: 0/30/135/180 deg rode away; 60/90 deg bailed.
   - Limits: Bail threshold of 50 deg is a placeholder feel number.

6. **Height-field controllers (kart-style and slope-gravity)**
   - How: heightfield.mjs on the same two quarter pipes, 4-8 m/s.
   - Result: Kart-style drove onto the deck at constant speed every time. Slope-gravity worked below vertical but failed the vertical ramp: an energy gain at 6 m/s, and at 7-8 m/s it rode onto the deck.
   - Limits: Simplified 1D re-implementation of the kart's ground logic, not the kart module itself.

7. **Physics-engine rigid body (Rapier 0.14.0)**
   - How: rapier-test.mjs, same ramps and block, with continuous collision off and on.
   - Result: Off: ramp contact lost for 18-25% of steps at higher speeds and the board flipped when airing off the 74 deg lip. On: board stalled on the ramp and gained energy (102-112% return speed). Ollie over the block OK (253-367 ms).
   - Limits: Only 0.14.0 tested (npm lists up to 0.21.0). No tuning of solver settings, no balance controller.

8. **CPU cost**
   - How: Bundled prototype run in Playwright Chromium, CDP Emulation.setCPUThrottlingRate 1 and 4, 7,200 steps (60 s of riding) with 3, 12 and 30 shapes (simple union, no spatial grid). bench-browser.cjs, browser-bench.txt.
   - Result: 4x throttle: 0.037 / 0.073 / 0.165 ms per step (2 steps per 60 fps frame = 0.07-0.33 ms). About 22 surface queries per ground step.
   - Limits: SwiftShader software rendering, CPU only; not a real phone. Measured mostly on flat ground. An earlier run showed a board can fall forever off the edge of the world, so a respawn is needed.

### Recommendation
**Choice:** Build skateboarding as a separate surface-aligned kinematic 'board vehicle' (option A, no physics engine) with the recommended move set: push, lean-steer, brake, one-button ollie of about 0.6-0.7 m, automatic grind on grindable edges with friction about 0.06 g, vert lock on quarter pipes, simple air spin, landing check plus quick get-up. Place it in a roughly 40 x 28 block skate plaza (mini ramp from two block-fitted 4 x 3 quarter pipes 12 blocks wide, 1:2 kicker, 6-block ledge, half-block box, flat rail, funbox) beside the obstacle course on one concrete pad, and let the skate race loop use the plaza plus island paths. Step zero: add wedge and smooth-surface shapes (signed distance plus normal) to the world's collision, then write the board's headless tests before any visuals.
**Why:** It was the only approach that passed every core test (quarter-pipe return, true-vert re-entry, ollie clearance with 0 voxel disagreements, grinds, landings) at a tiny CPU cost and with no new download. The kart height-field model and Rapier both failed in measurable ways. The short move set covers every verb in FEATURES card 9 and the skate race's grind shortcut, while the expensive parts (tricks, grabs, bowls) add little fun per hour for a first playable. Riding works like a vehicle (the avatar is posed on the board, like sitting in a kart), so skating does not have to wait for walking or jumping in motion-core.
**Confidence:** medium
**Conflicts with confirmed decisions:** None directly. Notes: (1) skating uses real gravity 9.81 m/s2, while the approved kart uses an arcade 22 m/s2; avatar jump gravity is not decided yet. (2) The skateboard cannot reuse racing-core's kart ground model (heightAt), because the test shows it cannot ride ramps. This does not touch the frozen driving checkpoints. (3) Any skate test page should follow CLAUDE.md rule 16 (shared motion-lab page.js and input file). (4) Ownership of the board controller is not assigned in docs/COLLABORATION.md: driving is Codex, avatar poses and bails are Claude, minigame systems are recommended for Codex.
**What would change it:** Owner phone tests showing that the timing windows feel too strict or the feel is wrong (tune the parameters, not the approach). A decision to make the whole game use a physics engine for everything (then compare again with a newer Rapier and solver tuning). The island layout team giving the skate area less than about 90 m2 (use the skate-dot layout instead). The owner preferring realistic mini-ramp behaviour (turn vert lock off).

### Key numbers
1. Block-fitted quarter pipe: 4 blocks long x 3 high (1.72 x 1.29 m) gives radius 1.79 m and a 73.7 deg lip, close to a standard 4 ft mini ramp with 6 ft radius (calculation; 6 ft beginner radius from OC Ramps search summary)
2. True vert option: radius 1.72 m (4 blocks) + 0.215 m vertical piece = 1.94 m lip (prototype)
3. Quarter pipe without vert lock: returns to flat up to 5 m/s entry; above 5.5 m/s the 74 deg lip sends the rider onto the deck (final-results.json)
4. Vert lock on: 5.5-8 m/s air of 0.06-1.56 m above the lip, landing impact 0.22-3.85 m/s, 77-88% speed kept (final-results.json)
5. True vert: 7/8 m/s give 0.33/1.05 m air, re-entry impact 0.18/0.28 m/s, 92/93% speed kept (final-results.json)
6. Ollie 0.6 m: one-block (0.43 m) timing windows 70/178/224/283/≥329 ms at 3/4/5/6/7 m/s; ledge land-on 253/298/320/300/230 ms (final-results.json)
7. Ollie 0.5 m is too strict: one block needs ≥4 m/s and gives only 63-88 ms (final-results.json)
8. Kicker 1:2 (0.86 x 0.43 m): no launch at 3 m/s; jumps 0.89/1.71/2.65/3.72 m at 4/5/6/7 m/s (final-results.json)
9. Auto-grind capture windows: 10 deg 575-1020 ms, 20 deg 330-1270, 30 deg 240-350, 45 deg 175-265 ms (final-results.json)
10. Grind friction 0.06 g: all 45 deg / 3.5 m/s grinds exit cleanly; 0.15 g: all 53 stall (grindfriction.mjs)
11. Air spin landing: 0/30/135/180 deg ride away; 60/90 deg bail (final-results.json)
12. Controller cost in Chromium at 4x CPU throttle: 0.037 ms/step (3 shapes), 0.073 (12), 0.165 (30, no spatial grid); about 22 surface queries per ground step (browser-bench.txt)
13. Rapier 0.14.0 rapier.es.js: 2,059,628 bytes raw, 766,613 bytes gzip (measured)
14. Rapier with continuous collision: stalled at 0.47-0.79 m height and returned at 102-112% of entry speed on the vertical ramp (rapier-results-ccd.json)
15. Real ollie study: board centre of mass rose about 0.24 m and skater centre of mass about 0.18 m, 6 experienced skaters (Oliveira et al. 2020, redalyc.org, from search summary)
16. Skateboard: length 28-32 in (0.71-0.81 m), width 7.5-8.25 in, wheelbase 13-15 in (0.33-0.38 m) (evo.com guide, search summary); prototype uses 0.80 m deck, 0.36 m wheelbase
17. Real grind box about 9 in (0.23 m) = half block 0.215 m; real ledges 12-15 in (0.30-0.38 m) vs one block 0.43 m (OC Ramps; skateboardhere.com, search summaries)
18. Skate park tiers: Seattle skate dot < 1,500 sq ft (139 m2), skate spot 1,500-10,000 sq ft; NRPA single element about 1,500 sq ft incl. approach (search summaries). Recommended plaza 40 x 28 blocks = 17.2 x 12.0 m = 206 m2; dot option 24 x 20 blocks = 89 m2
19. EA Skate: control scheme first proven in a text-based prototype built in 2-3 days; input read at 120 Hz, physics at 60 Hz (Game Developer interview with Scott Blackwood, search summary only)
20. Current island collision: every block is a full cube; wedge and smooth shapes have no collision yet (src/world/collision.ts header, src/world/world.ts solidWorld)
21. Kart ground model: y snapped to heightAt, vertical speed zeroed on ground, pitch clamp 0.4 rad, gravity 22 m/s2 (racing-core/kart/index.ts lines 33-37, 230-246)
22. Old repo obstacle course: 13-station snake (4 Nov) replaced by the 'yard' (11 Nov) with roofs at 7 m and 14 m, about 88 x 86 m by its own constants (my reading of 3d-world-3 src/world/Course.ts and docs/DECISIONS.md)
23. Prototype size: board.mjs 288 lines, surfaces.mjs 122 lines

### Time savers
1. Treat the skateboard as a vehicle: the board controller moves, and the avatar is posed on it with the existing joint/IK work, like sitting in a kart. Skating does not wait for walking, jumping or gravity in motion-core. Only hop-on/off and bails need standing and falling poses.
2. Build ONE surface query for wedge and smooth shapes (signed distance + normal) inside src/world. The same layer serves skating, avatar walking on ramps, ball rolling on ramps (mini golf, skee-ball) and future kart ramps.
3. Generate grind lines automatically from blocks that have the existing 'grindable' setting (tested: the 6-block ledge gave 4 correct edges), so no rails are placed by hand.
4. Use one block-fitted quarter-pipe piece (4 x 3 blocks, R 1.79 m) for every ramp, mini ramp and race-course bank, instead of designing many shapes.
5. Tune with headless sweeps like the ones here (timing windows in ms, jump distances, speeds kept) and publish named element marks for tests, as the old yard's COURSE_MARKS did. The owner's phone time is then spent only on feel.
6. Do not add a physics engine: it saves about 767 KB gzip per page load, and it failed the ramp tests anyway.
7. Leave out bowls, flip tricks, grabs, manuals, combo scoring and balance meters from the miniature version (FEATURES card 9 already says 'Tricks later').
8. Skate racing reuses the plaza and island paths plus the racing template (checkpoints, lap times, respawn). racing-core's old session/progress logic could supply checkpoints and progress (idea, not tested).
9. Put the plaza beside the obstacle course on one concrete pad and share spawn/checkpoint pads, signs that name moves rather than keys, and the 'falling costs nothing' rule from the old yard.
10. Mirror racing-core's controller contract (advance at fixed 1/120 s, immutable state, sample/interpolate for drawing, reset), so the render loop, camera and input adapter treat the board like a kart.

### Risks
1. Prerequisite gap: src/world collision has no wedge or smooth shapes (every block is a cube), so no ramp can be ridden until that layer exists.
2. Timing windows were measured with perfect scripted input; phone touch latency and thumb timing were not measured and will shrink the real windows.
3. Prototype board is a point with probes: rolling slowly off a high edge (1.29 m deck back) caused 4-5 one-tick re-landings and up to about 11-12 cm momentary sinking. It needs two-truck pitch (like the kart's front and rear probes) before shipping.
4. Angled airs on the 74 deg ramp can land sideways and bail (40 deg entry at 6.5 m/s landed 83 deg off). It needs a landing assist or auto-rotate, which is a feel choice.
5. Ramps 8 blocks (3.44 m) wide let angled riders roll off the side; use about 12+ blocks or side walls.
6. Rolling resistance (0.02), bail angle (50 deg), ollie height, vert-lock drift and grind friction are placeholders, not measured values. I found no measured rolling-resistance figure for skateboard wheels.
7. A board can fall forever off the world edge (seen in a benchmark), so island-edge, water and respawn rules (FEATURES card 9: falls in water, board floats back) must be in the first version.
8. Ownership of the board controller is not assigned (driving is Codex, avatar is Claude, minigame systems are recommended for Codex); it needs agreement before work starts.
9. All CPU numbers come from the sandbox and Chromium with SwiftShader and 4x throttling, not a real iPhone.
10. Several web sources could only be read as search summaries (gamedeveloper.com, 80.lv and tutasmaster.github.io were blocked for direct fetch). The THPS vert-lock control and the EA Skate prototype details are therefore not fully confirmed.
11. Rapier was tested only at version 0.14.0 with default solver settings; a newer version or tuning might behave better (this does not change the recommendation, because of the size and the code still needed on top).

### Owner taste questions
1. Quarter-pipe airs: (a) game style, where every air drops you back into the ramp (like Tony Hawk; recommended, tested), or (b) realistic, where airing off a mini ramp carries you onto the platform behind it, as in real life (also tested).
2. Grinding: (a) automatic when you land on a grindable edge (like EA Skate; recommended, forgiving 175-1270 ms windows), or (b) hold a button or the stick toward the rail to grind (like Tony Hawk / OlliOlli). Both can be put in the test page for you to try.
3. How big the ollie feels: (a) about 0.6 m, a strong pro-level pop (recommended), (b) about 0.7 m, bigger and easier, or (c) a more realistic 0.3-0.4 m, which cannot clear a one-block obstacle.
4. How forgiving landings are: (a) forgiving, where the game straightens the board if you land up to about 70 deg off, or (b) strict, where landing more than about 50 deg sideways knocks you off (current prototype).
5. Skate area size: (a) skate plaza about 17 x 12 m with a mini ramp and 5 street pieces (recommended), or (b) a small skate corner about 10 x 9 m with one quarter pipe, a kicker, a ledge and a box.

## Skate park: skeptic
**Holds up:** False
**Confidence:** medium

### Problems

1. **The ollie timing windows are inflated. Part of every 'success' comes from the nose or tail probe touching the block and being counted as a landing. When that happens the board's centre jumps more than 10 cm in a single step, which a player would see as a teleport. The claim of '0 disagreements with the island collision' only holds because that cross-check skipped the landing step.**
   - Evidence: I imported their board.mjs read-only and re-ran their exact sweep (audit-their-ollie.mjs/.txt). With a 0.6 m ollie I got their numbers back: 70/178/224/283/329 ms at 3/4/5/6/7 m/s. Of those, 50/53/32/40/33 ms were first landings made by a nose or tail probe, and 43/45/32/32/33 ms involved a centre jump of more than 10 cm. Counting only clean clears, their own board gives 0/103/168/218/253 ms. My separate exact geometry model gives 4/106/168/209/238 ms (ollie-geometry.mjs/.txt), and so does the closed-form formula. In tests.mjs line 79 firstLanded is set before the voxel check on the same iteration, so the landing step is never checked.
   - Fix: Report the honest windows. Either raise the default ollie to about 0.7 m (clean clear 93/195/256/298/327 ms at 3-7 m/s) or make tail-clip forgiveness a deliberate assist that does not teleport the centre. Check collision on the landing step too.

2. **The test that decided the method was unfair to the height-based option. That option had no vert lock, and it only lost on a true vertical ramp, which the recommended park does not even include. On the ramps the report actually recommends, a height-based board does the same job.**
   - Evidence: In heightfield.mjs, option B has no vert lock, and its vertical extension becomes a step ('collapses to a step'). Without vert lock, B already behaved like A on the 74 degree ramp (returned at 4-5 m/s, landed on the deck at 6-8). I wrote my own height-query board from scratch (hf-board.mjs, run with --kinkfix; output hf-board-kinkfix.txt): slope gravity, speed kept along the surface, the same 'free flight above ground' launch test plus a convex-kink check, and the same vert lock. On the 74 degree quarter pipe with vert lock it returned at 3 to 8 m/s: 0.18/0.43/1.02/1.70 m of air at 5.5/6/7/8 m/s, landing impacts 1.06-3.56 m/s, 84-97% of speed kept. On the 1:2 kicker it jumped 0.88/1.72/2.62/3.70 m at 4-7 m/s, against A's 0.89/1.71/2.65/3.72, and it did not launch at 3 m/s, as in A. Without the kink check it missed the launch at 5.5 m/s. That is a fixable edge case, like the 5 the researcher fixed in A.
   - Fix: Base the board on a narrow ground query: height plus normal plus material/grindable, multi-level like VoxelWorld.groundBelow. Avatar walking, karts (racing-core already uses heightAt) and rolling balls need that same query anyway. Keep the board's world interface small enough that an SDF can be added later if true vert, wallrides or loops are ever wanted.

3. **The mini ramp cannot be ridden back and forth with the prototype as written. Push always acts along the board's facing direction, so pushing while rolling backward (fakie) brakes the board. Back-and-forth riding, the main point of a mini ramp, was never tested.**
   - Evidence: audit-their-miniramp.mjs/.txt uses their board on a mini ramp built from two quarter pipes, with vert lock and push held. It made 10 passes in 30 s, with peaks of 1.69, 0.25, 1.05, 0.01, 0.79 ... 0.11 m, ending at 0.23 m/s. 18 of the 53 pushes happened while rolling backward (board.mjs stepGround adds the push along s.f). My board pushes in the direction of travel and kept going: 15 passes in 30 s, all reaching the lip, with steady 0.5 m airs (peak 1.79 m), for starts of 4, 5 and 6 m/s. Without pushing, both boards slow down and stop within about 10 to 13 passes.
   - Fix: Push in the direction of travel (aware of fakie). Add a required headless test of at least 10 sustained mini-ramp passes. Consider an automatic 'pump' on transitions as a later feel option.

4. **The report understates how much a physics engine would add to the download. It measured an old Rapier version; the current one is about twice as large.**
   - Evidence: I measured with npm pack in verify-skate/pk. Rapier 0.14.0: compat bundle 2,059,628 B raw / 765,513 B gzip; WASM alone 1,439,831 / 528,607 B. Rapier 0.21.0, the current npm release (modified 2026-09-25): WASM 3,082,103 B raw / 1,168,722 B gzip; compat rapier.mjs 4,340,292 / 1,652,936 B gzip.
   - Fix: Quote about 1.2 MB gzip (separate .wasm) to 1.65 MB (compat) for current Rapier. This makes the case for no engine stronger.

5. **The CPU numbers in the report do not match the benchmark file it cites, and that benchmark only covered riding on flat ground.**
   - Evidence: The report says 0.037/0.073/0.165 ms per step at 4x throttle. The saved browser-bench.txt says 0.029/0.0666/0.1191. bench-browser.cjs hard-codes airShare: 0, and the board ended at y≈0. My own benchmark (bench-browser.cjs/.txt) rode their board on a mini ramp with vert lock and push: 0.065 ms per step with 3 shapes and 0.150 ms with 31 shapes at 4x throttle in Chromium. My board is 2D and analytic, so its 0.0007 ms is not comparable.
   - Fix: Cite numbers that match the files. The conclusion that the cost is tiny (under 0.3 ms per 60 fps frame) still stands.

6. **The report puts the hardest piece of world work, smooth curved collision, first, even though skate racing and a fun first version do not need curved ramps.**
   - Evidence: MINIGAMES card 20 lists the skate-racing blocks as road, concrete, wood ramps and rails (grindable), and wedges, with no quarter pipe. WORLD-RULES F.2 already plans wedges 'for everyday ramps' and F.3 limits smooth surfaces to ski runs and banked turns. src/world/collision.ts treats every block as a cube, so there is no wedge collision yet either.
   - Fix: Build it in stages. Stage 1 is a street-style skate spot that needs only flat wedges: kicker, ledge, low box, flat rail, auto-grind, ollie, bail, respawn. Stage 2 adds one mini ramp made from a single block-fitted quarter-pipe piece, once smooth-surface heights exist. Using a smooth surface for a quarter pipe is new to the shape list, so show it to the owner.

7. **The owner question about realistic versus game-style airs leaves out what the realistic option actually means in play.**
   - Evidence: hf-board-kinkfix.txt, without vert lock: at 5.5 to 7 m/s the rider lands on the 3-block deck. At 8 m/s it flies past the whole deck and lands on the ground behind the ramp from about 3 m (impact 7.64 m/s, just under the 8 m/s bail limit). With push held and no vert lock, the rider left the mini ramp entirely, ending 150 m or more away.
   - Fix: Tell the owner that with realistic airs, any run at full speed ends on the platform. The ramp then needs a turnaround or a back rail and a deeper deck to be ridden back and forth.

8. **Some things the miniature version needs are missing: phone touch controls, a simpler way to get the board than the item wheel, and how long the work would take.**
   - Evidence: FEATURES card 9 has the player pulling the board out of the item wheel, which the miniature does not have. MINIGAMES A.14 says the owner picks controls after testing. The report gives no estimate of effort or time.
   - Fix: Use a board pickup pad at the skate spot. Offer two touch schemes on the test page (for example, a steer stick with a big ollie button and auto-push, or the same with a push button). Give a rough estimate per stage, clearly labelled as an estimate.

### Factual errors
1. The ollie windows for a 0.6 m ollie over one block (70/178/224/283/≥329 ms at 3-7 m/s) count nose and tail probe 'landings' where the board's centre jumps more than 10 cm. Clean clears are 0/103/168/218/253 ms with their own board and 4/106/168/209/238 ms with exact geometry.
2. '0 disagreements with the island collision (VoxelWorld.boxBlocked)' is true only because the check skipped the landing step (tests.mjs: firstLanded is set before the overlap check in the same loop).
3. 'Ollie 0.5 m ... needs at least 4 m/s and gives 63-88 ms' is optimistic. Exact geometry gives 0 ms at 4 m/s and 54 ms at 5 m/s.
4. 'The only approach that passed every core test' is overstated. The height-field option was tested without vert lock and failed only on a true-vertical ramp, which is not in the recommended park. A height-query board with the same launch rule and vert lock matched option A on the 74 degree quarter pipe and the 1:2 kicker.
5. The CPU figures 0.037/0.073/0.165 ms per step at 4x do not match the cited browser-bench.txt (0.029/0.0666/0.1191), and that benchmark measured flat-ground riding only (airShare hard-coded to 0).
6. 'Rapier adds about 767 KB gzipped' holds only for the old 0.14.0 compat bundle. The current Rapier 0.21.0 is about 1.17 MB gzip (WASM alone) or 1.65 MB gzip (compat).
7. Mini ramp as prototyped: holding push does not keep the rider going, because push brakes when rolling backward (18 of 53 pushes in 30 s), so the ride dies after about 10 passes. The report never tested back-and-forth riding.
8. Not an error but a definition: the 77/85/89% 'speed kept' figures include the flat run before and after the ramp. Measured at the ramp foot, my model keeps 94-97%. Both rest on a placeholder rolling-resistance value.

### Missed options
1. A height-query board (TESTED here): the world answers 'ground height and normal below this point', multi-level like VoxelWorld.groundBelow, with slope gravity, surface speed, launch test plus convex-kink check, and vert lock. It matched the SDF board on the recommended ramps, and it shares one query with avatar walking, karts and balls.
2. A staged park: wedges and grind pieces first, with no curved collision; the mini ramp second. Skate racing (MINIGAMES card 20) needs no quarter pipe.
3. An automatic 'pump' on transitions, so the mini ramp can be ridden without pushing on the 2.58 m flat bottom. Not tested.
4. A board pickup pad at the skate spot instead of the item wheel in the miniature version.
5. Rapier's ray-cast vehicle controller and kinematic character controller, Jolt Physics (jolt-physics 1.1.2 on npm), three.js's Octree+Capsule addon (ships in three 0.180, so no new dependency, but it would put three.js maths into game logic, unlike racing-core), and three-mesh-bvh 0.9.18 (MIT). None was tested. Current Rapier's size alone (about 1.2-1.65 MB gzip) argues against the engine options.
6. Two touch-control schemes offered side by side on the test page, so the owner chooses after testing (MINIGAMES A.14).
**Retest:** All work is in (scratch folder, not saved) plan2/verify-skate.

(1) ollie-geometry.mjs / ollie-geometry.txt: my own exact geometry for a level board in ballistic flight against a 0.43 m box, under the researcher's board assumptions (wheels ±0.207 m, tails raised 0.04 m, also tried 0.08 m). One-block clean-clear windows at 3/4/5/6/7 m/s: 0.5 m ollie 0/0/54/95/119 ms; 0.6 m 4/106/168/209/238 ms (the closed-form formula agrees); 0.7 m 93/195/256/298/327 ms. Ledge, both trucks landing on top, 0.6 m: 200/250/272/227/194 ms.

(2) audit-their-ollie.mjs / .txt: their board.mjs imported read-only. It reproduces their 70/178/224/283/329 ms. The deck-end-probe part is 50/53/32/40/33 ms; strict clean clears are 0/103/168/218/253 ms.

(3) hf-board.mjs (hf-board.txt raw, hf-board-kinkfix.txt with --kinkfix): my independent 2D height-query board. Geometry check: R = 1.7917 m, lip angle 73.74 deg (the researcher's figures are correct). Quarter pipe with vert lock returned at 3-8 m/s; air 0.18/0.43/1.02/1.70 m at 5.5/6/7/8 m/s; landing impacts 1.06-3.56 m/s; 84-97% speed kept, measured at the ramp foot. Without the kink check, 5.5 m/s missed the launch. Kicker 1:2: 0.88/1.72/2.62/3.70 m at 4-7 m/s, landing impacts 3.10-3.95 m/s, no launch at 3 m/s, matching A within 3 cm. Mini ramp with vert lock and push: 15 passes in 30 s, all reaching the lip, steady 0.5 m air. With no pushing it dies out within 8-13 passes. Without vert lock and with push, the rider leaves the ramp.

(4) audit-their-miniramp.mjs / .txt: their board on the same mini ramp with push held makes 10 passes and dies out; 18 of 53 pushes happened while rolling backward.

(5) bench-browser.cjs / .txt: Playwright Chromium with CDP throttle 1x and 4x. Their board riding the mini ramp: 0.015/0.034 ms per step at 1x and 0.065/0.150 ms at 4x (3/31 shapes). This is CPU only, with SwiftShader and no real phone, so these are not iPhone numbers.

(6) pk/: npm pack size measurements for Rapier 0.14.0 and 0.21.0 (listed under problems).

Code read: racing-core/kart/index.ts confirms the grounded kart has y = support height, verticalVelocity = 0, pitch for looks only, and no slope term (the researcher's kart claim is correct). src/world/collision.ts confirms every block is a full cube. rulebook.ts has the 'grindable' universal setting and the shapes cube/wedge/smooth. The old repo has no skate code (grep), and its Course.ts is a parkour yard.

Not re-tested: grind capture and friction, angled 3D entries, a 3D height-query board with block walls, true vert, and Rapier behaviour (only its size).

Web: my search budget was already used up, and support.activision.com, nrpa.org, ocramps.com and create.roblox.com do not resolve in this sandbox. So the THPS vert-lock control, skate park size tiers, grind box and ledge sizes, the Roblox deprecation and the Oliveira 2020 ollie study could not be re-verified. Treat them as search-summary-level only.
**Improved recommendation:** The report's main direction holds; several specifics do not. Keep a hand-written, fixed-step 'board vehicle' with no physics engine. Current Rapier would add about 1.2 to 1.65 MB to every phone download, about twice what the report said. Keep the short move set: push, lean to steer, brake, one-button ollie, automatic grind on grindable edges, simple air spin, fall and quick get-up. Leave flip tricks, grabs, manuals and bowls for later. Treat riding like driving a kart: the avatar is posed on the board, so skating does not wait for walking. Change five things.

(1) Build the board on the island's own 'ground below this point' query, extended so wedges and the smooth quarter-pipe piece return a height and a slope direction. Avatar walking, karts and rolling balls need that same query, so it is built once. The report's separate 'signed distance' layer is only needed for true vertical walls, wallrides or loops, which the miniature does not have. My test shows the simpler board rides the recommended ramps just as well. Keep the board's connection to the world small, so the bigger layer can be added later if wanted.

(2) Build in two stages. Stage 1 is a street-style skate spot with no curved pieces: flat concrete, a 1:2 wedge kicker, a one-block ledge, a half-block box and a flat rail, with auto-grind, ollie, fall and respawn. This is everything skate racing needs. Stage 2 adds one mini ramp: two block-fitted quarter pipes, 4 x 3 blocks each, about 12 blocks wide, with game-style vert lock. Reserve the report's roughly 40 x 28 block plaza on the shared concrete pad beside the obstacle course and practice field. Fill the street half first.

(3) Start the ollie at about 0.7 m, or keep 0.6 m with a deliberate forgiveness assist that never makes the board jump visibly. Honest windows for clearing one block at 0.6 m are about 0.1 s at 4 m/s and almost nothing at 3 m/s.

(4) Pushing must work in the direction of travel, including riding backward (fakie). Make 'ride the mini ramp back and forth 10+ times' a required test. The prototype as written stalls after about 10 passes.

(5) In the miniature, the player gets the board from a pickup pad at the skate spot, not the item wheel. Put two touch-control layouts on the test page so the owner can pick after trying them.

Headless tests come before any visuals: timing windows, jump distances, sustained ramp riding, and collision checks that include the landing moment. All feel numbers stay as tunable settings.

Questions for the owner (taste only): game-style or realistic quarter-pipe airs (realistic means any run at full speed ends on the platform, so the ramp needs a turnaround); automatic or button grinds; ollie size; how forgiving landings are; whether Stage 2 (the mini ramp) is wanted in the miniature at all.

Who builds the board controller is still not assigned in docs/COLLABORATION.md and needs agreement.

## One world: structure and phone performance: research
**Question:** How should we build ONE playable world (island, 6 tracks, practice stations, skate park, avatar, karts) so it runs smoothly on an iPhone and stays easy to rearrange?
**Summary:** Build the mini world as one new game page. It should be its own small TypeScript app under Vite. It reuses the project's existing shared pieces: the universal input file, the iPhone page-lifecycle file, racing-core, motion-core and the world rulebook. It should not grow the lab shell (motion-lab/src/page.js) into a game. Load the whole island when the game starts, then let only the area near the player "wake up" and run its physics. Streaming the island in pieces is not needed at this size: in the test, the whole 1.5 km island was built in under 1 second on a CPU slowed to phone speed, and loading pieces during play caused stalls of up to about 40 ms.

Drawing cost depends mostly on how things are grouped, not on how big the island is. Drawing every object separately took about 1,233 draw calls and 18 ms of CPU per frame in the worst view. Merging the static scenery into 250 m squares cut that to 29-44 calls and about 2 ms. The same idea cut a race grid of 8 of the project's real karts from 245 calls to 19. The ground needs a different approach: the current block collision and block drawing code cannot cover a 1-2 km island. One flat layer only 86 m wide already used 122 MB, and a coding limit creates "ghost walls" beyond about 440 m from the centre. So the big ground should be a height map that is painted with the approved block materials, and real blocks should be kept for built things.

To keep the world flexible, describe zones, stations and spawn points in one data file. An automatic checker tests the file, so moving the hoop next to the soccer goal is a one-line change. Save progress with a small versioned save module on localStorage, with a project-specific key prefix. All numbers come from a software-only browser emulator, so the budgets must be confirmed with one test link on the owner's iPhone before they are final.

### Options

1. **A. Grow the shared lab shell (motion-lab/src/page.js) into the game**
   - How it works: The island becomes another createSimulation adapter inside createMotionLab, the way racing-lab's driving test already plugs in. The shell keeps its one renderer, orbit/chase camera, view buttons, Reset, status line and loop.
   - Pros: It satisfies CLAUDE.md rule 16 to the letter. It is the fastest way to get something on screen, because racing-lab proves the adapter works, and it reuses camera buttons, Reset, page lifecycle and input with zero new shell code.
   - Cons: The shell is a test harness. It has a sticky header and test-video cards, one controller, an orbit camera built around yaw and pitch, a slab floor, preserveDrawingBuffer:true (which costs memory bandwidth on tile-based phone GPUs such as iPhones), and near 0.05 m / far 20,000 m. Every lab page and the publish-gating lab-foundation browser checks depend on it, so game changes would put racing-lab and motion-lab at risk. Switching between walking, kart, race and station modes does not fit its single-controller camera.
   - Evidence: /home/user/3D-World-4/motion-lab/src/page.js (createSimulation hook, preserveDrawingBuffer:true, setPixelRatio(min(dpr,1.5)), camera far 20000 when a simulation is present). /home/user/3D-World-4/racing-lab/src/main.js uses it. /home/user/3D-World-4/docs/HANDOFF.md 'Uncertain' item 3: retiring the Motion study page and moving reusable helpers is already a proposed cleanup. On the tile-based GPU cost of preserveDrawingBuffer: https://codereview.chromium.org/614883002 and the Arm Mali blog https://community.arm.com/groups/arm-mali-graphics/blog/2014/05/16/mali-performance-3-is-eglbufferpreserved-a-good-thing (search excerpts; neither benchmarks the cost directly).
   - Test result: Not tested as a game. I read the code and dependencies only.

2. **B. New single-page TypeScript game app under Vite that imports the shared modules (RECOMMENDED)**
   - How it works: A new entry (for example game/index.html, added to vite.config.ts rollupOptions.input) with its own small loop, mode state machine (on foot / free drive / race / station / menu), camera rigs, world builder, zone modules and save module. It imports motion-lab/src/input.js and page-activity.js unchanged (one input implementation), racing-core (driving and sessions), motion-core (avatar movement) and src/world (rulebook, checker). It is registered in the Test Lab registry so the owner opens it from the usual hub.
   - Pros: It is game-first and keeps game logic separate from drawing. Lab pages and their publish checks stay untouched. TypeScript strict and Vite are already in the repo (tsc --noEmit plus vite build run in npm run build). The game keeps identical controls because it imports the same input file. Its own small budget test stays separate from the roughly 290 s racing browser suites.
   - Cons: It conflicts with the wording of CLAUDE.md rule 16 and the motion-lab README ('every future page shares page.js'). The input and lifecycle files are shared, but the lab shell is not. The Test Lab README also says new tests must call installTestLabScene. It needs about 200-300 new lines of shell (loop, camera, quality, resize), which A gets for free.
   - Evidence: /home/user/3D-World-4/vite.config.ts (already multi-page: main, lab, oval, island, movement). Vite multi-page guide: https://vite.dev/guide/build.html. /home/user/3D-World-4/docs/COLLABORATION.md recommends Codex as lead for the shared framework, input plumbing, minigame systems and build. /home/user/3D-World-4/test-lab/README.md (iframe registry; 'add future subjects to the test registry'). The old repo had the same pattern of a separate island app that pulls in the shared avatar controller and kart: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-island/README.md.
   - Test result: Not built. The rendering, collision and save choices it would use were tested separately (see tests_run).

3. **C. Port the old repo's src/core/Engine.ts structure**
   - How it works: Copy the 3D-WORLD-3 Engine class: renderer with fallback attempts, scene, sky, fog, sun, quality presets, bloom/EffectComposer, studio and underwater looks, plus its World/Player classes.
   - Pros: It is the owner's own working code. It has a useful renderer-fallback routine (tries antialias/high-performance, then plainer contexts) and well-documented quality presets (pixelRatioCap, shadows, viewDistance, fog).
   - Cons: It is a 481-line monolith tied to old features (underwater, studio mode, bloom post-processing, which is costly on phones). CLAUDE.md rule 9 makes 3D-WORLD-3 reference-only, so porting needs approval. Its player and physics differ from the approved motion-core and racing-core.
   - Evidence: /home/user/isaiasurrutia96/3d-world-3/src/core/Engine.ts (createRenderer fallback; EffectComposer, UnrealBloomPass). /home/user/isaiasurrutia96/3d-world-3/src/core/Settings.ts (QUALITY_PRESETS: low pixelRatioCap 1, renderScale 0.8, no shadows, viewDistance 420; medium 1.25, shadows 1024). /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-island/src/quality.js (Low/Medium/High pixel ratio 1/1.5/2).
   - Test result: Not tested. Recommendation: copy only the renderer-fallback function and the quality-preset idea into option B, with approval.

4. **D. Light component pattern: zones and stations as plain data plus small modules (RECOMMENDED inside B)**
   - How it works: Each zone or station is a data entry (id, kind, position, rotation, params) plus a small module that returns optional sim (step at the fixed rate), optional view (built once, merged or instanced) and a wake radius. No ECS library.
   - Pros: Adding, moving or removing a station touches one data entry and at most one module. Physics runs only when the player is near, which is the 'only simulate what is near' lesson already in docs/game-dev/09-open-world.md. It matches Nystrom's Component pattern intent (an entity spans several domains without coupling them).
   - Cons: It needs discipline: each module must keep logic and drawing apart. There is no automatic query system like a full ECS.
   - Evidence: https://gameprogrammingpatterns.com/component.html (pattern intent). /home/user/3D-World-4/docs/game-dev/09-open-world.md E1. /home/user/3D-World-4/src/world/world.ts already follows 'a world is a list of parts; the same list is drawn, made solid and checked'.
   - Test result: Partly tested. The 'wake by distance' rendering version was measured: with merged scenery it barely helps drawing (29 to 27 calls), with separate meshes it helps a lot (291 to 182 calls, 7.1 to 5.5 ms). Its main value is skipping physics for far stations, which was not measured.

5. **E. Full ECS library (bitECS, miniplex or koota)**
   - How it works: Entities are IDs. Components are stored in typed arrays (bitECS) or plain objects (miniplex). Systems loop over queries.
   - Pros: It is fast with many thousands of entities, and serialization exists (bitECS).
   - Cons: It is overkill for a mini world with about 50 kinds of things and a few hundred moving objects. It adds a dependency (the project currently depends only on three and cdt2d), changes code style, and racing-core and motion-core do not use it.
   - Evidence: https://github.com/NateTheGreatt/bitECS (data-oriented ECS); https://github.com/hmans/miniplex (plain-object entities, developer-experience focus); https://github.com/bytro/ecs-benchmark (third-party ops/sec table). No source claims small games need ECS.
   - Test result: Not tested. The entity counts here are far below where ECS speed matters.

6. **F. Switch to another engine (PlayCanvas, Babylon.js, Godot web export)**
   - How it works: Rebuild on an engine that has an editor, streaming and batching built in.
   - Pros: It comes with a visual editor and built-in tools.
   - Cons: It conflicts with the confirmed three.js 0.180 + TypeScript + Vite decision and throws away all approved racing, motion and avatar code.
   - Evidence: Confirmed decisions list in the task; PlayCanvas guidelines are still a useful reference for budgets.
   - Test result: Not tested. Rejected because of the confirmed decision.

7. **G. World loading: everything loaded at start plus distance-based zone activation (RECOMMENDED)**
   - How it works: Build all island geometry once at start (merged or instanced). Each frame, wake only the sims within a radius of the player (stations about 50-80 m; race AI only during races). Distant drawing is handled by normal frustum culling plus fog and a far plane of about 1,200-1,500 m. Distant small props can optionally be hidden per zone.
   - Pros: It is simple and has no hitches during play. Total build is 0.51-0.94 s and JS heap 16-37 MB at 4x CPU throttle in the test. Moving a zone needs no streaming bookkeeping.
   - Cons: The whole world sits in memory, which is fine at 1.5 km with code-made geometry but not for the future big world.
   - Evidence: Unreal World Partition streams grid cells by loading range (https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine); the Chinese-language docs, per a search excerpt, use 256 m cells with a 768 m range as an example. That machinery is aimed at much bigger maps.
   - Test result: Tested. Whole-world build 514-941 ms, first render (shader compile + upload) 84-196 ms, heap 16-37 MB, at 390x844, 4x CPU throttle, headless Chromium + SwiftShader.

8. **H. Chunk streaming (load and unload squares by distance)**
   - How it works: Split the island into 100-250 m squares, build or load them as the player approaches, and dispose of far ones.
   - Pros: It is needed later for the big world, and the memory ceiling stays flat no matter how big the world gets.
   - Cons: Building a square during play stalls frames unless the work is moved to a worker thread. It adds async state, ordering and test complexity, which the mini world does not need.
   - Evidence: /home/user/3D-World-4/docs/game-dev/09-open-world.md B (GTA streaming). The old island batched faces in 16x16-cell chunks: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-island/src/block-mesh.js.
   - Test result: Tested on the main thread. Merging one 250 m square took a median of 8.6 ms (max 38 ms), and its first draw took up to 47 ms. For a 100 m square: median 1.6 ms (max 15), first draw up to 35 ms. Done during play, these are visible stutters. Deferred to the big world, preferably with a Web Worker.

9. **I. Separate scenes per activity with loading screens (Wii Sports Resort style)**
   - How it works: The island is a hub. Entering a track or station loads that area as its own scene.
   - Pros: Each scene has the lowest memory and the simplest budget, and it is proven (Wuhu Island holds almost all events, each reached separately).
   - Cons: You can no longer drive from the field to a track, which is the open feel Mario Kart World chose ('driving between race courses rather than a loading screen').
   - Evidence: https://en.wikipedia.org/wiki/Wii_Sports_Resort (Wuhu Island; golf on Wedge Island). https://www.thedrive.com/news/mario-kart-world-goes-open-world-with-free-roam-for-nintendo-switch-2.
   - Test result: Not tested. Kept as a fallback if the iPhone memory ceiling is hit.

10. **J. Static scenery drawing: merge per 250 m square, shared vertex-color material (RECOMMENDED default)**
   - How it works: At build time, bake terrain, track ribbons and fixed props into one mesh per 250 m square (or per zone) using BufferGeometryUtils.mergeGeometries, with colors stored per vertex so one material is shared.
   - Pros: It gave the fewest draw calls among cullable options and the lowest CPU cost. It is plain drawElements, which is the safest path on Safari. The repo already uses vertex-colored merged meshes (src/world/merged.ts).
   - Cons: A merged square is all-or-nothing for culling, so it draws more triangles than needed (about 100k vs 58k in the field view). Moving one prop means rebuilding its square (median 8.6 ms, fine when editing, not during play).
   - Evidence: three.js manual 'Optimize Lots of Objects' (https://threejs.org/manual/en/optimize-lots-of-objects.html): 'Drawing 2 things has more overhead than drawing 1'. Forum caution that one giant merged mesh defeats frustum culling (https://discourse.threejs.org/t/how-to-batch-different-meshes-with-same-materials-into-one-draw-call/17035, search excerpt).
   - Test result: Tested, two runs. Field / track / overview views: 29 / 32 / 44 draw calls, render CPU 1.8-2.0 ms median (p95 at most 4.7 ms), 100k / 112k / 197k triangles. The 100 m-square version: 46 / 57 / 116 calls, 2.5-3.3 ms, 72k / 76k / 157k triangles. Merging everything into one mesh: 22 calls, 1.4-2.0 ms, but always 250k triangles. Separate meshes (2,249 objects): 291 / 327 / 1,233 calls, 7.1-7.4 / 7.8-8.8 / 17.7-18.4 ms (overview p95 up to 34.5 ms).

11. **K. Repeated props and avatar parts: InstancedMesh (RECOMMENDED, verify on iPhone)**
   - How it works: One InstancedMesh per prop type (trees, cones, fence panels, pins), ideally per zone so far zones can be hidden. Rigid ragdoll parts of all characters share one InstancedMesh per part shape.
   - Pros: It draws many copies in one call. The rigid ragdoll (no skinning) is naturally instancing-friendly. In the race test, karts merged per kart by material plus driver parts instanced across all 8 drivers dropped from 245 to 19 calls and from 3.4 to 1.3 ms. src/world/blocks.ts already uses InstancedMesh for separate blocks.
   - Cons: three.js culls an InstancedMesh as a whole, so island-wide instancing draws every copy whenever one is visible (124-148k triangles vs 100-112k merged). A 2020 WebKit bug reported slow instanced draws on iPhone 12 Pro; its current status is unverified.
   - Evidence: WebKit bug 218949 (https://bugs.webkit.org/show_bug.cgi?id=218949, search excerpt; page not reachable from this session). three.js PR #21507: users must recompute bounding spheres for culling (https://github.com/mrdoob/three.js/pull/21507). /home/user/3D-World-4/src/world/blocks.ts.
   - Test result: Tested. Island props: 44 / 42 / 72 calls, 2.0-2.6 ms. Race grid of 8 real kart-parts models (F1: 21 meshes, 17,400 triangles each) with 18-part drivers: 245 calls / 3.4 ms separate vs 19 calls / 1.3 ms optimized. Go-karts: 215 to 19 calls, 3.1 to 1.3 ms.

12. **L. BatchedMesh (different shapes, one material, per-object culling)**
   - How it works: All prop shapes go into one BatchedMesh. Each instance is frustum-culled on its own (perObjectFrustumCulled defaults to true), and it uses WEBGL_multi_draw when available.
   - Pros: It has the fewest triangles of the cullable options (78k field) with 28 calls. Instances can be hidden per zone with setVisibleAt.
   - Cons: It spends more CPU on per-object culling (2.5-2.9 ms vs about 1.9 ms merged). It depends on multi-draw: caniuse lists iOS Safari support from 15, but a WebKit bug comment (per a search excerpt) said multi-draw was once disabled in Safari. three.js counts a multi-draw as 1 call in renderer.info even if the driver loops internally.
   - Evidence: https://threejs.org/docs/pages/BatchedMesh.html; https://caniuse.com/mdn-api_webgl_multi_draw; WebKit bug 239015 (https://bugs.webkit.org/show_bug.cgi?id=239015, unverified). three.js 0.180 source: WebGLRenderer.js falls back to a per-draw loop without WEBGL_multi_draw; WebGLIndexedBufferRenderer.renderMultiDraw calls info.update(...,1).
   - Test result: Tested. 28 / 33 / 45 calls, 2.5-2.9 ms. With 400 m zones: 26 / 29 / 37 calls, 64k / 80k / 141k triangles. SwiftShader reported WEBGL_multi_draw available; iPhone behaviour not tested.

13. **M. Phone rendering settings: pixel ratio, shadows, textures, LOD, depth range**
   - How it works: Pixel ratio 1.5 by default (Low 1, High 2). One directional light at most, with a small shadow box that follows the player, used only on High; otherwise a dark blob under karts and avatar. No post-processing. Vertex colors and 1-3 shared materials, no textures for now. LOD deferred, because low-poly code-made props do not need it. Near plane at least 0.1 m, far plane about 1,500 m with fog. preserveDrawingBuffer false.
   - Pros: It cuts pixel work, the main GPU cost on high-DPI phones. Shadows in particular get expensive when the world is drawn as separate meshes.
   - Cons: A lower pixel ratio is slightly softer on a 3x screen. Blob shadows look simpler.
   - Evidence: /home/user/3D-World-4/docs/game-dev/11-rendering-web.md A3/A4. PlayCanvas runtime DPR guidance (https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/; its guidelines page per a search excerpt gives 100-200 draw calls for low-end mobile). three.js shadows manual (https://threejs.org/manual/en/shadows.html). Forum report of shadows roughly doubling calls (https://discourse.threejs.org/t/question-about-shadows-and-their-influence-on-draw-calls-and-polygon-counts/7262). three.js reverse depth example (https://threejs.org/examples/webgl_reverse_depth_buffer.html).
   - Test result: Tested. Pixel ratio 1 / 1.5 / 2 / 3 gave SwiftShader frame intervals of 33 / 50 / 83 / 117 ms; this shows only how pixel cost scales, not real GPU speed. Shadows (2048 map, 60 m box): merged squares went from 29 to 32 calls including the shadow pass and 2.0 to 2.4-2.7 ms; separate meshes went from 291 to 372 calls and 7.1 to 10.5-10.6 ms. Note: in three.js 0.180, renderer.info.render.calls leaves out shadow-pass draws, because info.reset runs after shadowMap.render (WebGLRenderer.js lines 1606/1612), so budget tests must set info.autoReset=false. Depth precision with near 0.05 was not tested.

14. **N. Ground and collision for a 1-2 km island: height map plus road triangles plus local block worlds (RECOMMENDED)**
   - How it works: One ground query (same shape as racing-core's world adapter: heightAt(x,z), surfaceAt(x,z,y)) asks three sources and returns the highest hit below. (1) A terrain height map (0.86 m cells, Int16 height plus Uint8 block material from the rulebook). (2) racing-core's road triangles for the tracks. (3) Small VoxelWorlds, each with its own local origin, for block-built stations, skate park pieces and buildings.
   - Pros: Height map: 9.1 MB at 0.86 m cells (36.5 MB at 0.43 m), about 13-44 ns per query. It keeps the approved block materials and rules (grass is grass for walking, karts and balls) and the existing collision code for built things. racing-core already expects exactly this kind of adapter.
   - Cons: Smooth or stepped terrain is a different look from 'everything is 0.43 m blocks', which conflicts with the wording of WORLD-RULES and must be shown to the owner. Collision.ts needs local origins or a new key scheme (Claude's area per WORLD-RULES A1).
   - Evidence: /home/user/3D-World-4/src/world/collision.ts (Map key ((i+4096)*8192+(j+4096))*8192+(k+4096) on 10.75 cm cells, i.e. ±440 m). /home/user/3D-World-4/src/world/merged.ts (6x6 point grid per open face). /home/user/3D-World-4/racing-core/testing/neighborhood.ts (heightAt/surfaceAt world). The old island also used a height function (topCell/surfaceHeight) over a polygon plan: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-island/src/layout.js.
   - Test result: Tested in Node (not throttled). One flat layer in VoxelWorld: 14x14 blocks (6 m) = 0.8 MB / 1.9 ms; 100x100 (43 m) = 30.6 MB / 176 ms; 200x200 (86 m) = 122 MB / 1.14 s. It grows with area, so a 1.5 km layer would be about 37 GB (extrapolated, not run). Key aliasing confirmed: a block at z=+452 m made solidAt true at z=-428.7 m, 10.75 cm higher. merged.ts drawing: a flat 43 m slab = 1,060,800 triangles (about 574 per m², so about 1.3 billion for 1.5 km², extrapolated). Height map: see pros.

15. **O. Layout: data file plus checker (RECOMMENDED), in-game drag mode later, versus hand-placed code, Blender or the three.js editor**
   - How it works: One layout.json (island size; zones with origin and rotation; stations in zone-local coordinates; spawn points; track references) is validated by a checker in npm test (inside the island, no overlaps, clear of tracks, valid spawns), in the spirit of src/world/checker.ts. A debug overlay shows zone names and coordinates so the owner can say 'move the skate park 40 m north'. Optional later: a ?edit=1 top-down drag mode that copies JSON to the clipboard (Pages is static, so it cannot save directly).
   - Pros: Changes are one-line edits plus automatic checks. Zone-local coordinates move whole stations together. The same file can later be written by an editor. The owner's old island already used an explicit data plan (reference-layout.js).
   - Cons: It needs a small schema and checker up front. The drag editor is extra work, so it is deferred.
   - Evidence: Hand-placed constants today: /home/user/3D-World-4/src/world/island/layout.ts. Data plan precedent: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-island/src/reference-layout.js. Blender custom properties arrive as userData through glTF extras, with caveats (https://discourse.threejs.org/t/solved-why-cant-get-the-value-of-blender-customattribute/6667; https://github.com/mrdoob/three.js/issues/18445), but that means a Blender learning curve for the owner. The three.js editor round trip is described on the forum as 'export/import hacks' (https://threejs.org/docs/pages/ObjectLoader.html and the related discourse threads).
   - Test result: Not built. One related number: rebuilding one 250 m square after a move takes a median of 8.6 ms, so live re-layout in an edit mode is feasible.

16. **P. Saves: versioned localStorage module now, IndexedDB for ghosts later, plus export/import**
   - How it works: save.ts reads and writes one JSON document {version, settings, records, unlocks} under a project-unique prefix (for example 'lg4.'), uses try/catch for private mode or a full quota, and runs migrations when the version changes. An 'Export save' / 'Import save' text box gives a backup. Large ghost recordings move to IndexedDB when 6 tracks exist. Cloud save comes with online play.
   - Pros: It is tiny and synchronous, already matches racing-core's storage interface (getItem/setItem), and works offline.
   - Cons: localStorage holds about 5-10 MB per origin (sources disagree). Every GitHub Pages repo of the same account shares one origin, and that quota, with 3D-WORLD-3. The old repo already used 'letsgo.' keys. racing-core/ghosts.js allows up to 8,000,000 bytes per track, so 6 tracks could exceed the quota (writes fail quietly). Safari deletes script-written storage after 7 days of Safari use without visiting, but not for Home Screen web apps.
   - Evidence: /home/user/3D-World-4/racing-core/ghosts.js (MAX_GHOST_BYTES = 8000000; storage.getItem/setItem). The old key 'letsgo.island.graphics.v1' is in /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-island/src/quality.js. Shared origin: https://tomashubelbauer.github.io/github-pages-local-storage. Quotas: https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria (search excerpt says 10 MiB) vs https://web.dev/articles/storage-for-the-web (about 5 MB; 7-day eviction does not apply to installed home-screen PWAs). WebKit Safari 17 storage policy: https://webkit.org/blog/14403/updates-to-storage-policy/ (could not open; search excerpts only). racing-lab already ships a web manifest.
   - Test result: Not tested in a browser. Origin, key and limit facts were confirmed from repo files and sources.

### Tests run

1. **Can the existing block collision (src/world/collision.ts VoxelWorld) scale to a 1-2 km island?**
   - How: Bundled the repo's collision.ts with esbuild into my scratch folder. Added one flat layer of n x n 43 cm blocks (n = 14, 50, 100, 200) and measured heap (node --expose-gc) and time. Script: (scratch folder, not saved) plan2/architecture/voxel/scale.mjs
   - Result: 6 m: 12,544 cells, 0.8 MB, 1.9 ms. 21.5 m: 9.5 MB, 32 ms. 43 m: 30.6 MB, 176 ms. 86 m: 2.56M cells, 122.4 MB, 1.14 s. Memory grows with area, so a 1.5 km x 1.5 km single layer would be about 37 GB (extrapolated). Conclusion: not usable for island-wide ground.
   - Limits: Node on the server CPU, not throttled, and the machine was shared with other agents' benchmarks. Extrapolation, not a run. Only one layer was tested; real terrain has several.

2. **Ghost-wall bug from VoxelWorld's key packing beyond ±440 m**
   - How: Added one block at z = 451.98 m and queried solidAt at the predicted wrapped location (same script).
   - Result: Confirmed. solidAt is true at the real block and also at z = -428.66 m, 10.75 cm higher (but false at the same height), because k overflows into j in the packed key.
   - Limits: Only the z axis was tested. x and y overflow the same way by inspection of the code.

3. **Triangle cost of the current merged-block drawing (src/world/merged.ts) for large flat ground**
   - How: Called addMergedBlocks on flat n x n grass slabs (n = 14, 50, 100) and counted triangles.
   - Result: 6 m: 23,296 triangles (39 ms). 21.5 m: 270,400 (314 ms). 43 m: 1,060,800 (801 ms). About 574 triangles per m², so about 1.3 billion for a 1.5 km island (extrapolated). The current block drawing is for small built things, not island ground.
   - Limits: Flat slab only. A greedy mesher with rounding only on exposed edges would be far cheaper, but it was not built or tested.

4. **Height-map ground alternative: memory and query speed**
   - How: Int16 height plus Uint8 material arrays covering 1.5 km at 0.43, 0.86 and 1.72 m cells, with bilinear height queries. Script: .../voxel/heightfield.mjs
   - Result: 0.43 m: 36.5 MB, filled in 226 ms. 0.86 m: 9.1 MB, 70 ms. 1.72 m: 2.3 MB, 26 ms. Queries about 13-44 ns each.
   - Limits: Node, not throttled, noisy shared CPU. The material lookup and the combined road and station query were not built.

5. **Island-scale rendering comparison: separate meshes vs merged vs instanced vs batched, with and without distance zones**
   - How: Throwaway three.js 0.180 page (scratch folder, npm three@0.180.0). The scene: a 1.5 km heightfield island (172 chunks of 100 m, 137,600 triangles); 6 closed track ribbons of 662-1,290 m (5.95 km total; road, 2 curbs, 2 walls; 21,680 triangles); 1,350 prop parts of 28 types (about 780 props: trees, rocks, lamps, stands, garages, a practice field with hoops, goals, bowling lane, pins, targets, pool table, cones, a skate park, 20 houses; 56,472 triangles); a 30-part avatar stand-in of about 29k triangles; 6 moving karts; a sea plane. Headless Chromium (SwiftShader) at 390x844, DPR 3 capped to 1.5, CDP Emulation.setCPUThrottlingRate 4, 20 warm-up frames plus 120 (repeat run 200) measured frames per view. Views: chase camera on the practice field, kart camera on an F1-size track, high overview. CPU time measured around renderer.render. Files: .../bench/world.js, bench.js, run.mjs; results in .../bench/results-main.json and results-repeat.json.
   - Result: Field / track / overview draw calls and median render CPU. Separate: 291 / 327 / 1,233 calls; 7.1-7.4 / 7.8-8.8 / 17.7-18.4 ms (overview p95 up to 34.5 ms). Separate + 400 m zones: 182 / 163 / 833 calls; 5.5 / 5.2 / 12.1 ms. Merge-all: 22 calls; 1.4-2.0 ms; always 250k triangles. Merged 250 m squares: 29 / 32 / 44 calls; 1.8-2.0 ms; 100k / 112k / 197k triangles. Merged 100 m: 46 / 57 / 116 calls; 2.5-3.3 ms. Merged 250 + zones: 27 / 28 / 36 calls; 1.8-1.9 ms. Instanced props: 44 / 42 / 72 calls; 2.0-2.6 ms. Batched: 28 / 33 / 45 calls; 2.5-2.9 ms. Batched + zones: 26 / 29 / 37 calls. Build 514-941 ms; first render 84-196 ms; JS heap 16-37 MB. The repeat run agreed within about 1 ms.
   - Limits: SwiftShader is a software GPU, so frame intervals (50-200 ms) are NOT real iPhone GPU numbers. Only CPU-side render() time and draw-call and triangle counts are meaningful. Chromium is not Safari. 4x throttle on this server CPU is only a rough stand-in for an iPhone. Other agents' benchmarks ran on the same 4-core machine during testing, which adds noise. Stand-in geometry, not the real avatar or real stations.

6. **Real draw calls with shadows on**
   - How: Same page with one 2048 shadow-mapped directional light and a 60 m follow box. A second build sets renderer.info.autoReset=false so the shadow pass is counted. Files: .../bench/bench-shadowcount.js, run3.mjs; results-shadowcount.json
   - Result: With default counting, calls did not change (29 to 29), because three.js 0.180 resets info after the shadow pass (WebGLRenderer.js lines 1606/1612). With true counting: merged squares 29 to 32 calls (+26k triangles), render CPU 2.0 to 2.4-2.7 ms; separate meshes 291 to 372 calls, 7.1 to 10.5-10.6 ms.
   - Limits: GPU cost of the shadow map not measurable on SwiftShader. Only one shadow-box size.

7. **Cost of streaming one chunk during play**
   - How: Built each 250 m (and 100 m) square's merged geometry one at a time and timed the merge plus its first draw, at 4x throttle. Files: .../bench/hitch.js, run2.mjs, hitch.log
   - Result: 250 m: 33 squares, merge median 8.6 ms (max 38.1), first draw median 1.4 ms (max 47.4), median 6,980 triangles per square. 100 m: 172 squares, merge median 1.6 ms (max 15.0), first draw max 34.8 ms. Generating all world data: 531-565 ms.
   - Limits: Main thread only. Worker-based building not tested. SwiftShader upload time is not iPhone upload time.

8. **Pixel-ratio cost scaling**
   - How: One merged terrain scene at pixel ratio 1, 1.5, 2 and 3, measuring the rAF interval.
   - Result: Drawing buffers 390x844, 585x1266, 780x1688 and 1170x2532 gave 33.4, 50, 83.3 and 116.7 ms.
   - Limits: SwiftShader rasterizes on the CPU, so this shows only relative pixel cost, not iPhone frame times.

9. **Race grid budget with the project's real kart models**
   - How: Bundled /home/user/3D-World-4/kart-parts/models.js (forced to one three.js copy) into a test page. 8 karts, each with an 18-part driver stand-in, chase camera, 4x throttle. 'Separate' = cloned kart groups plus per-part driver meshes. 'Optimized' = each kart merged by material (2 meshes) plus driver parts as 2 InstancedMeshes shared by all drivers. Also counted meshes and triangles per kart in Node. Files: .../bench/race.js, run4.mjs, race.log; .../voxel/kart-entry.js
   - Result: Kart models today: go-kart 17 meshes / 14,012 triangles, GT 22 / 18,444, F1 21 / 17,400 (the kart check allows 24 meshes / 20,000). F1 grid: 313 meshes, 245 calls, 3.4 ms separate vs 19 calls, 1.3 ms optimized. Go-kart grid: 215 calls, 3.1 ms vs 19 calls, 1.3 ms. Karts and drivers, not the island, are the biggest draw-call risk.
   - Limits: Wheel spin and steering are ignored in the merged version (wheels would stay separate or instanced). The driver is a stand-in of the right size, not the real avatar. SwiftShader caveat as above.

### Recommendation
**Choice:** Build the mini world as one new Vite + TypeScript game page (option B). Use the light zone/station data-plus-module pattern (D) and load everything at start, waking zones by distance (G). Draw static scenery merged per 250 m square with one vertex-color material (J). Use InstancedMesh for repeated props and for rigid avatar parts across characters, and bake each kart into one mesh per material at load (K). Use a height-map ground combined with racing-core road triangles and small local-origin block worlds (N). Put the layout in one JSON data file checked by tests, with a coordinates overlay; add a drag editor later (O). Save with a versioned, prefixed localStorage module, with IndexedDB for ghosts later (P). Provisional phone budgets, to be confirmed on the owner's iPhone: at most 100 draw calls per frame including the shadow pass (hard cap 150); at most about 300k visible triangles normally, about 500k in a full race; pixel ratio 1.5 (Low 1, High 2); shadows only on High with a small follow box, otherwise blob shadows; no post-processing; far plane about 1,500 m with fog; near at least 0.1 m; preserveDrawingBuffer false.
**Why:** The tests show draw calls, not island size, decide the CPU cost. Separate meshes reached 1,233 calls and 18 ms; merged squares stayed at 29-44 calls and about 2 ms at 4x throttle. The real 8-kart grid dropped from 245 to 19 calls when baked and instanced. Merged geometry uses the plainest WebGL path, which is the safest on Safari given the reported history of instancing and multi-draw issues. Loading everything costs under 1 s, while streaming caused stalls of up to about 40 ms. The existing block collision and drawing cannot cover island-wide ground (122 MB for an 86 m layer, ghost walls beyond 440 m, about 574 triangles per m²), so a height map painted with block materials is required. A separate game page leaves the lab shell and its publish-gating checks untouched while still sharing the one input file. A data file plus checker makes the owner's frequent layout changes one-line edits.
**Confidence:** medium
**Conflicts with confirmed decisions:** 1) CLAUDE.md rule 16 and motion-lab/README say every future page shares motion-lab/src/page.js. The recommendation shares input.js and page-activity.js but not the page.js shell. The fallback that keeps rule 16 literal is option A (the island as a createSimulation adapter). 2) test-lab/README says new tests must call installTestLabScene; the game page would not use the lab slab or isometric presentation. 3) WORLD-RULES / 'world built from 0.43 m blocks': island-wide ground becomes a height map painted with the 26 block materials. Real blocks stay for built features. The look (stepped vs smooth) is put to the owner as a taste question. 4) CLAUDE.md rule 14 (slate blue #405363) covers test labs; a game world might want a sky, which is a taste question. 5) HANDOFF says 'rigid ragdoll, not a skinned mesh'. The instancing plan keeps that. A rigid-skinning trick (one bone per vertex, one draw call per avatar) would technically use skinning and must not be used without owner approval. 6) Ownership: COLLABORATION.md recommends Codex lead the shared framework and build; collision.ts changes for local origins are Claude's area (WORLD-RULES A1). racing-core's fixed 4 TRACK_IDS and the 8 MB-per-track ghost limit are Codex's area.
**What would change it:** A real-iPhone run of a budget page. If InstancedMesh or BatchedMesh turn out slow in iOS Safari, use merged geometry plus per-kart baking only. If 60 fps is not reached at these budgets, lower the triangle and pixel-ratio budgets. If the tab is killed for memory, fall back to option I (separate scenes per activity). If the owner wants rule 16 kept literally, use option A first. If the owner chooses a stepped block look for the whole island, a greedy block mesher and chunked collision are needed, which is more work. If the island must grow well past about 2 km, chunk streaming (H) with a worker is needed.

### Key numbers
1. Bench island: 1.5 km across, 6 loops 662-1,290 m (5.95 km total), about 780 props / 1,350 parts, about 215k static triangles. The 6 loops fit around a centre about 220 m in radius for the field, skate park and hub (source: .../bench/lens.mjs output).
2. Separate meshes: 291 / 327 / 1,233 draw calls; 7.1-7.4 / 7.8-8.8 / 17.7-18.4 ms render CPU at 4x throttle (field / track / overview) (results-main.json, results-repeat.json)
3. Merged 250 m squares: 29 / 32 / 44 calls; 1.8-2.0 ms; 100k / 112k / 197k triangles (same files)
4. Merge-everything: 22 calls, 1.4-2.0 ms, always 250k triangles (no culling) (same files)
5. Instanced props: 44 / 42 / 72 calls, 2.0-2.6 ms. Batched: 28 / 33 / 45 calls, 2.5-2.9 ms (same files)
6. Distance zones at 400 m: separate meshes 291 to 182 calls (7.1 to 5.5 ms); merged squares only 29 to 27 calls (main.log)
7. Shadows (2048 map, 60 m box), counted correctly: merged 29 to 32 calls; separate meshes 291 to 372 calls and 7.1 to 10.6 ms. three.js 0.180 renderer.info excludes the shadow pass by default (WebGLRenderer.js lines 1606/1612) (results-shadowcount.json)
8. Whole-world build 514-941 ms, first render 84-196 ms, JS heap 16-37 MB at 4x throttle (results-main.json)
9. Streaming one 250 m square: merge median 8.6 ms / max 38 ms, first draw max 47 ms; 100 m square: 1.6 / 15 ms, first draw max 35 ms (hitch.log)
10. Real kart models: go-kart 17 meshes / 14,012 triangles; GT 22 / 18,444; F1 21 / 17,400 (kart-parts/models.js via .../voxel/kart-entry.js; the check allows 24 meshes / 20,000)
11. 8-kart F1 grid with drivers: 245 calls / 3.4 ms separate vs 19 calls / 1.3 ms baked and instanced (race.log)
12. VoxelWorld one flat layer: 86 m square = 2.56M cells, 122 MB, 1.14 s, so about 37 GB for 1.5 km (extrapolated) (voxel/scale.mjs)
13. VoxelWorld key range ±4,096 tiny cells = ±440 m; a block at z=+452 m creates a ghost solid at z=-428.7 m (confirmed by test)
14. merged.ts flat ground: 43 m slab = 1,060,800 triangles, about 574 per m² (voxel/scale.mjs)
15. Height map for 1.5 km: 36.5 MB at 0.43 m cells, 9.1 MB at 0.86 m, 2.3 MB at 1.72 m; about 13-44 ns per query (voxel/heightfield.mjs)
16. Pixel ratio 1 / 1.5 / 2 / 3 = 1x / 2.25x / 4x / 9x pixels; SwiftShader frame interval 33 / 50 / 83 / 117 ms (relative only) (hitch.log)
17. Existing shell: pixel ratio min(dpr,1.5), antialias off on touch, preserveDrawingBuffer true, camera near 0.05 / far 20,000 with a simulation (/home/user/3D-World-4/motion-lab/src/page.js)
18. racing-core ghosts allow up to 8,000,000 bytes per track (/home/user/3D-World-4/racing-core/ghosts.js); localStorage is about 5-10 MB per origin (web.dev vs MDN excerpt disagree)
19. PlayCanvas guidelines (search excerpt): 100-200 draw calls for low-end mobile; project note 11-rendering-web.md: under about 100-150 on phones

### Time savers
1. Load the whole mini island at start and skip streaming. It costs under 1 s to build, while streaming needs worker threads and extra state. Save streaming for the big world.
2. Make all mini-world scenery from code-made shapes with vertex colors and one shared material: no textures, no Blender, no download pipeline. Merging then needs no extra work (src/world/merged.ts already works this way).
3. Bake each kart into one mesh per material when the game loads, and instance avatar parts across all drivers. Keep parts separate in the data so per-part editing still works. This removes the biggest draw-call risk (245 to 19 calls) without touching the kart or avatar designs.
4. Put the layout in one JSON file with an automatic checker and a coordinates overlay. Every 'move this next to that' becomes a one-line edit verified by tests, with no rewrites. Build the drag editor only if the owner asks.
5. Build one tiny budget page/test that prints FPS, draw calls (including the shadow pass, using info.autoReset=false) and triangles at 3 scripted camera spots, and run it on the owner's iPhone once. This replaces guessing and avoids redoing work later.
6. Import motion-lab/src/input.js and page-activity.js instead of copying them, so controls and iPhone lifecycle fixes stay identical and are maintained once.
7. From the old repo, with approval, reuse only small proven bits: createRenderer's fallback from Engine.ts, the quality-preset idea from Settings.ts and letsgo-island/quality.js, and the 16-cell chunk batching idea from letsgo-island/block-mesh.js. Do not port the whole Engine.
8. CI (Codex's area): add path filters so docs-only pushes skip publishing and the ~290 s racing browser suites run only when racing files change. deploy.yml already installs WebKit, so the game smoke test can run in WebKit, the engine closest to iPhone Safari.
9. Keep both racing-core and motion-core on their existing 120 Hz accumulators and feed them frame time, as page.js does today. New systems (stations, ball, skate) use the same 120 Hz step, so no approved module needs changing.

### Risks
1. All performance numbers come from headless Chromium with SwiftShader (a software GPU) and 4x CPU throttling on a shared 4-core server where other agents were also running benchmarks. GPU frame times are not meaningful, and Safari can differ from Chromium. Budgets are provisional until measured on the owner's iPhone.
2. iOS Safari kills tabs that exceed an undocumented memory ceiling (WebKit bug 300782, search excerpt). GPU memory was not measured. Keep geometry modest, dispose of what is removed, and listen for webglcontextlost.
3. Safari history of slow instanced draws (WebKit bug 218949, 2020) and of multi-draw being disabled (bug 239015, per a search excerpt) means the current status is unverified. InstancedMesh and BatchedMesh need a device check. Merged geometry is the safe baseline.
4. VoxelWorld ghost walls: any block structure placed more than about 440 m from the origin in world coordinates silently creates a solid copy elsewhere. Use local origins per station or a new key scheme before building the island.
5. Depth precision: the shell's near 0.05 m / far 20,000 m can make curbs, road paint and the road surface flicker at distance. Not tested; use near at least 0.1 m and far about 1,500 m with fog, or three.js reversed depth.
6. Saves: every GitHub Pages repo of the same account shares one origin and its localStorage quota (3D-WORLD-3 used 'letsgo.' keys). Ghosts at up to 8 MB per track across 6 tracks can overflow, and writes fail silently. Safari deletes browser-tab storage after 7 days of Safari use without a visit (not for Home Screen apps).
7. Rule conflicts that must be shown, not silently overridden: CLAUDE.md rule 16 (page.js), the Test Lab README installTestLabScene requirement, WORLD-RULES 'built from 0.43 m blocks' for island ground, and rule 14 slate background (labs only).
8. Race scenes are the stress case: 8 karts at 14-18k triangles plus 8 drivers at about 29k = about 350k triangles before the world. NPC drivers likely need a lighter distance version (Claude's area: avatar distance variants), still rigid and jointed.
9. Splitting work: the game shell is the framework Codex is recommended to lead, while avatar and collision integration is Claude's. Unclear ownership could cause parallel edits to shared files (input.js, collision.ts).

### Owner taste questions
1. Island ground look: (a) stepped blocks everywhere, like today's little island (costs the most work and triangles); (b) smooth rolling ground, with blocks used for built things like stations, the skate park and buildings (cheapest); (c) smooth ground with a stepped block edge only at cliffs and shores.
2. Game background: (a) a sky with fog and clouds for the playable world; (b) keep the slate blue test-lab background for now.
3. Rearranging things: (a) tell the AI 'move the hoop next to the soccer net' and it edits the layout file (fastest, available from day one); (b) also add a simple drag-to-move mode on the phone later.
4. Getting around: (a) walk or drive across the island to everything (one connected world); (b) also add a quick-travel menu to jump straight to a track or station.

## One world: structure and phone performance: skeptic
**Holds up:** True

### Problems

1. **The plan to draw every driver's avatar parts with one InstancedMesh per part was only tested in the best case: all 8 karts bunched on the grid in front of the camera. Drivers move, so the InstancedMesh has to have culling switched off, and then every driver is drawn every frame, even the ones behind the camera or on the far side of the track.**
   - Evidence: My race scene used the REAL Game avatar (28 parts, 28,892 triangles, decoded from /home/user/3D-World-4/avatar/assembled-joints/game-cca1d05f83501637.bin.gz) and the real F1 and go-kart models from kart-parts/models.js. Setup: 8 racers on a loop, chase camera, 390x844, 4x CPU throttle. With racers spread around the track: separate meshes 60 calls / 155k triangles; InstancedMesh avatars 41 calls / 357k triangles, so about 200k triangles wasted on drivers no one can see; BatchedMesh avatars 14 calls / 155k. On the grid: separate 291 / 378k, instanced 53 / 462k, batched 26 / 397k. Files: (scratch folder, not saved) plan2/verify-architecture/results-race-t4.json and results-race3-t4.json.
   - Fix: For moving characters, use a BatchedMesh: every part of every driver in one draw call, and each part is still hidden when off screen. Set frustumCulled=false on the BatchedMesh object and keep perObjectFrustumCulled on. As a fallback that needs no multi-draw support, bake each NPC's seated driver into its kart mesh (see missed options). Keep InstancedMesh for static repeated props only.

2. **Pitfall the report does not mention: BatchedMesh and InstancedMesh work out their overall bounding sphere once. When their instances move, that sphere is stale and three.js can hide the whole object. My first BatchedMesh race run lost all 8 avatars this way and reported a false 231k triangles.**
   - Evidence: three 0.180 src/objects/BatchedMesh.js computes boundingSphere only when it is null (lines 525-548); setMatrixAt (line 1074) does not update it. After I set batch.frustumCulled=false, the grid count went from 231k to 397k triangles, which matches separate meshes (378k).
   - Fix: Write the rule into the game's rendering notes and its budget test: any batched or instanced object with moving instances sets frustumCulled=false, or recomputes its bounds every frame.

3. **The ghost-wall bug was presented as needing 'local origins or a new key scheme', and the plan added 'small VoxelWorlds, each with its own local origin'. That is extra machinery. A one-line change to the key fixes it.**
   - Evidence: I copied collision.ts to my scratch folder and changed the key to ((i+65536)*131072+(j+65536))*131072+(k+65536). The largest key is 2.25e15, below 2^53. Result: the block at z=+452 m still works, the ghost at z=-428.5 m is gone, and the range grows to about ±7 km (keyfix/test.mjs). The original key reproduced the ghost, so the report's bug claim is correct.
   - Fix: Widen the key (Claude's area, WORLD-RULES A1) and keep one world coordinate system. Drop the local-origin block worlds from the plan.

4. **The report gives no memory size for block-built stations. VoxelWorld stores 64 tiny cells per 43 cm block, about 3.1-3.5 KB per block, so a solid block floor for a skate park gets heavy on a phone.**
   - Evidence: keyfix/mem.mjs (Node, --expose-gc): 30x30 blocks (12.9 m floor) = 2.8 MB; 70x70 blocks (30 m floor) = 17.3 MB, 3,525 bytes per block.
   - Fix: Put flat floors (skate park base, practice field) in the height-map ground. Use blocks only for ramps, rails, walls and goals. Later, Claude can store whole blocks instead of tiny cells, which uses 64 times fewer entries.

5. **The owner question on ground look says 'stepped blocks everywhere costs the most work and triangles'. That is not true when the steps come from the same height map and the faces are merged. The owner should choose on look, not on a false cost difference.**
   - Evidence: stepped.mjs: a 1.5 km island quantised to 0.43 m steps with merged top faces and side walls only where columns differ comes to 0.95 M triangles at 0.43 m columns, or 0.48 M at 0.86 m columns, for the WHOLE island. A smooth terrain at 2.5 m cells is a similar size (my bench terrain shows 416k in overview). The owner's old island already built block terrain from a height function: /home/user/isaiasurrutia96/3d-world-3/apps/letsgo-island/src/layout.js topCell/surfaceHeight feeding block-mesh.js. Limits: gentle test terrain only; merged flat faces lose the rounded block edges of merged.ts; the walking and kart collision for steps was not built.
   - Fix: Reword owner question 1: stepped block look and smooth ground cost about the same when made from one height map; the difference is the look, plus bumps for karts driving off-road on steps.

6. **The save risk is overstated. Ghosts do not threaten the localStorage quota in normal use. The real problems are a single ghost at the 8,000,000-character ceiling (which cannot be saved at all) and a quota shared with the other repos on the same github.io origin. The '5-10 MB, sources disagree' line is also unclear.**
   - Evidence: Measured in Chromium (lsQuota in bench.js, results-smoke-t4.json): the most one origin can store is about 5,238,784 characters (counted in characters, not bytes: a non-ASCII string at 90% of that length also fit). An 8,000,000-character ghost throws QuotaExceededError, and so do two 3M-character keys. racing-core/ghosts.js records 15 rows per second of 5 numbers, so a 60 s lap is about 36,684 characters. 4 ghosts x 6 tracks of 60 s laps is about 0.88 M characters, about 17% of the quota. Both repos live at isaiasurrutia96.github.io (git remote and README link). Safari's limit was not tested (no WebKit build here); MDN could not be fetched (host blocked).
   - Fix: Use localStorage only for the mini world: settings, records and ghosts, under an 'lg4.' prefix. Lower the per-ghost limit to something realistic (for example 1 MB), and show a message when a save fails instead of failing quietly. Add IndexedDB only if real usage approaches about 3 MB.

7. **Option A (grow the lab shell) is described as less workable than it is. page.js already lets a simulation supply its own camera rig, per-frame update, after-frame hook, pause hook and controller, so a game adapter needs no page.js edits. The real limits are the hard-coded preserveDrawingBuffer:true and the lab page layout (header, nav, test-video cards).**
   - Evidence: /home/user/3D-World-4/motion-lab/src/page.js exposes simulation.cameraRig.handles/update, simulation.advance, afterFrame, onPause, controller, maxFrameSeconds and fov (checked with grep). racing-lab's driving page already hides the status line and compresses the top bar with CSS.
   - Fix: Keep B as the main recommendation, but tell the owner that A is the zero-shell-code way to get a first walk-and-drive prototype if speed matters more, and that rule 16 is the owner's rule to confirm or relax. Also note that the labs are built with esbuild build.mjs plus shell.html, not as Vite entries. The game can use either; Vite's dev server is the reason to pick Vite.

8. **Merging per 250 m grid square fits the 'move things around' goal less well than merging per zone, and costs no less.**
   - Evidence: My static bench merged one mesh per zone (hub, field, skate, 6 tracks, plus 250 m bins for nature and terrain; 41 objects). Field / track / overview: 18 / 12 / 47 draw calls, render CPU median 0.1-0.6 ms, p95 1.2-2.6 ms. The report measured 29 / 32 / 44 calls for 250 m squares. Separate meshes: 248 / 31 / 845 calls, 2-8 ms. Instanced per zone: 41 / 22 / 103 calls. Batched per zone: 18 / 11 / 45 calls, 0.2-3.6 ms (results-static-t4.json).
   - Fix: Make the zone the single unit: one data entry, one merged mesh, one wake radius. Moving the hoop rebuilds only the field zone. Use grid bins only for scattered nature and terrain.

9. **Absolute CPU times are not reliable across benches. On the same machine, my separate-mesh overview (845 calls) took about 7.9 ms median, while the report's (1,233 calls) took 17.7-18.4 ms. That is roughly twice the cost per call, probably from different timing methods (SwiftShader backpressure). Saying separate meshes 'take 18 ms' overstates it.**
   - Evidence: results-static-t4.json versus the report's results-main.json. Both benches agree on the order: merged < batched ≈ instanced < separate.
   - Fix: Quote only the order and the draw-call and triangle counts as findings. Leave milliseconds to the iPhone budget page.

10. **The report never measured physics CPU cost, so its 'phone performance' answer covered drawing only. Physics turns out to be small, which moves the real risk to the iPhone GPU: triangles, shadows and pixels.**
   - Evidence: benchPhysics: 8 racing-core kart controllers on a 1.5 km height-map world adapter at 120 Hz, 4x throttle. F1 2026: 0.7 ms median / 1.9 p95 at 2 steps per frame (60 fps) and 1.0 / 2.2 ms at 4 steps (30 fps). GT3: 0.6 / 0.9 ms. Go-kart: 0.5 / 0.9 ms. 20 karts: 1.2 ms. At no throttle it is about 3-4 times faster, which confirms the throttle works (results-physics-t4.json, -t1.json). Not included: kart-to-kart contacts, track surface lookup, avatar or ball physics.
   - Fix: Present the CPU budget as comfortable (physics plus render about 2-5 ms at 4x throttle with merged or batched drawing). Make the iPhone test focus on GPU: frame rate with and without shadows in the 8-kart race view, and triangle counts that include the shadow pass.

11. **The triangle budget of 'about 500k in a full race' is broken as soon as shadows are on, and the report did not count race triangles with the shadow pass.**
   - Evidence: 8 F1 racers with the real avatar, grid view, counted with info.autoReset=false: separate 692 calls / 819k triangles / 6.7 ms; batched 52 calls / 838k; baked drivers 35 calls / 873k (results-race-t4.json, race2, race3).
   - Fix: No shadow maps in races on phones by default (blob shadows instead). NPC drivers get a distance version early, not later (still rigid and jointed, Claude's area). The budget test must report triangles including the shadow pass.

12. **Smaller unverified or untested claims: 'past about 2 km streaming is needed' (no test supports that threshold); the WebKit bugs 218949 and 239015, the PlayCanvas 100-200 draw-call figure and the Safari 7-day rule are search excerpts I could not re-check. My web search budget was used up and MDN, web.dev and caniuse are blocked in this session.**
   - Evidence: MDN browser-compat-data 8.1.10 (2026-11-19, installed from npm) lists WEBGL_multi_draw in Safari and iOS Safari from 15, and EXT_clip_control (needed for three.js reversed depth) from 17.4.
   - Fix: Mark these as unverified. Have the iPhone budget page print whether WEBGL_multi_draw and EXT_clip_control are available, so the device answers directly.

### Factual errors
1. 'Stepped blocks everywhere costs the most work and triangles': merging faces from a stepped height map gives 0.48-0.95 M triangles for the whole 1.5 km island, about the same as smooth terrain (stepped.mjs). The 574 triangles per m² figure applies only to merged.ts, which builds every block on its own.
2. 'Ghosts ... across 6 tracks can overflow' the quota: typical ghosts are about 37k characters per 60 s lap, so 24 ghosts are about 0.88 M of Chromium's roughly 5.24 M-character per-origin quota. What fails is a single ghost near the 8,000,000-character MAX_GHOST_BYTES, which can never be stored (QuotaExceededError in Chromium).
3. 'localStorage holds about 5-10 MB per origin (sources disagree)': Chromium measured about 5,238,784 characters for one origin, and it counts characters, not bytes. The MDN wording could not be re-checked (host blocked), so the 'disagree' framing is unconfirmed.
4. 'Collision.ts needs local origins or a new key scheme': a one-line wider key fixes the ghost walls out to about ±7 km (tested), so local-origin block worlds are unnecessary.
5. 'Separate meshes ... 17.7-18.4 ms': the absolute time depends on the bench. An independent run on the same machine gave about 7.9 ms for 845 calls. Only the order is reliable.
6. The 'race grid 245 to 19 calls' result does not carry over to InstancedMesh avatars in a real race: with drivers spread out, instancing draws 357k triangles where per-part culling draws 155k.
7. Option B says to add the game to vite.config.ts rollupOptions.input as if that were the repo's pattern; the live labs (racing-lab, motion-lab) are actually built by esbuild build.mjs scripts that inline the bundle into motion-lab/shell.html.

### Missed options
1. Merge per zone, not per 250 m square. The zone becomes the single unit for layout, waking and merging, with the same draw-call cost (tested: 12-47 calls).
2. BatchedMesh for the rigid ragdoll avatar: all parts of all drivers in one draw call, each part still hidden when off screen, matrices updated each frame. It fits 'rigid parts, not skinned' directly (tested: 14-26 calls, same triangles as separate meshes).
3. Bake each NPC's seated driver into its kart as one vertex-colour mesh while driving (a distance or NPC version; the player's own avatar stays fully jointed). Tested: 12-18 calls, 0.1-0.3 ms render CPU, plain drawElements with no multi-draw dependency. Trade-off: NPC arms do not move.
4. Stepped block-look ground built from the same height map (merged faces, walls only at steps). It keeps the 'world of blocks' look at height-map cost, and the owner's old letsgo-island did this (topCell height function into block faces).
5. Widen the VoxelWorld key with one line instead of keeping separate local-origin block worlds.
6. A first prototype inside the existing shell through createSimulation (cameraRig, advance, afterFrame and onPause already exist). It needs no new shell code and keeps rule 16 literally; graduate to the game page when the lab layout gets in the way.
7. Make the layout a typed TypeScript data file (or JSON checked against a TS type), so the existing tsc --noEmit build step checks its shape for free; the overlap and placement checker still runs in tests.
8. Later: an in-game 'move mode' that saves zone positions to localStorage and has a 'copy layout' button, so layout tuning on the phone does not cost a 6-10 minute publish per tweak.
9. Trim the Game avatar download for the game: the asset is 2.0 MB gzipped, but its header holds 4.3 MB of JSON (userData.assembly) while the geometry itself is about 0.75 MB raw. Whether the runtime needs that data was not investigated.
**Retest:** I built my own bench, without reusing the researcher's code, in (scratch folder, not saved) plan2/verify-architecture. It uses three@0.180.0 forced to one copy with an esbuild plugin, bundles the REAL kart-parts/models.js, racing-core kart controllers and profiles, and the REAL Game avatar geometry, which I decoded with the repo's src/study-binary.js (28 parts, 28,892 triangles). Browser setup: headless Chromium (SwiftShader), 390x844, DPR 3 capped to 1.5, CDP CPU throttle 4, renderer.info.autoReset=false so shadow-pass draws are counted, 20 warm-up frames then 100 measured frames, CPU timed around update plus render with no GPU sync per frame.

(1) Static island: 1.5 km height-map island, 6 track ribbon loops, hub, field and skate zones, 700 nature props; 2,005 parts in total. Field / track / overview views. Separate meshes: 248/31/845 calls, 2.0-7.9 ms median. Merged per zone: 18/12/47 calls, 0.1-0.6 ms. Instanced per zone: 41/22/103 calls. Batched per zone: 18/11/45 calls, 0.2-3.6 ms. With shadows: separate 332/47/846 calls; merged 26/20/48. This confirms the report's order and rough call counts.

(2) Race with 8 real racers: listed under problems above (separate, instanced, batched, baked drivers; grid and spread; with and without shadows). Main finding: instancing wastes about 200k triangles when racers are spread out. I also hit the stale-bounds pitfall in BatchedMesh and fixed it.

(3) racing-core physics for 8 karts at 120 Hz: 0.5-1.0 ms median, p95 at most 2.2 ms, at 4x throttle, for both 2 and 4 steps per frame. 20 karts: 1.2 ms. Unthrottled is about 3-4 times faster.

(4) localStorage in Chromium: about 5,238,784 characters per origin; an 8M-character ghost fails; two 3M-character keys fail.

(5) Node tests: a one-line wider VoxelWorld key removes the ghost wall (the original key reproduced it); VoxelWorld uses 3.1-3.5 KB per block, 17.3 MB for a 30 m floor; stepped height-map island 0.48-0.95 M triangles.

(6) Repo and source checks: page.js hooks, preserveDrawingBuffer:true and near 0.05 / far 20,000 confirmed; three.js lines 1606/1612 (info reset after the shadow pass) confirmed; multi-draw counted as 1 call confirmed; InstancedMesh and BatchedMesh bounds computed once confirmed; MDN browser-compat-data says WEBGL_multi_draw on iOS 15+ and EXT_clip_control on iOS 17.4+.

Limits: SwiftShader GPU timings are meaningless, and Chromium is not Safari. No WebKit build was available here (deploy.yml installs one in CI). The machine was shared with other agents (load average up to 4.6 on 4 cores). My web search budget was used up, and MDN, web.dev and caniuse are blocked in this session, so several web claims could not be re-checked.
**Improved recommendation:** Keep the report's main plan, with these changes.

1) Build the mini world as one new game page (option B). It imports the shared input file, the page-lifecycle file, racing-core and motion-core. The game page goes against the wording of CLAUDE.md rule 16, so ask the owner to confirm it. Also tell them the zero-extra-code fallback: a first walk-and-drive prototype can run inside the existing lab shell through its createSimulation hook (option A), because that hook already lets a game supply its own camera.

2) Make the zone the one building block. Each zone (hub, practice field, skate park, each track) is one entry in a typed layout data file. It is drawn as one merged mesh, and it wakes up (runs its physics) only when the player is near. Moving the hoop next to the soccer goal is then a one-line change that rebuilds only the field. A test checks that nothing overlaps or leaves the island. Load the whole island at start; no streaming.

3) Ground: one height map covers the whole island, combined with racing-core's road triangles. Small block-built pieces (ramps, rails, goals, walls) sit on top. Put flat floors in the height map, not in blocks: a 30 m block floor alone costs 17 MB. Fix the ghost-wall bug with the one-line wider collision key (tested) instead of separate local block worlds. Tell the owner that the stepped block look and smooth ground cost about the same when built from the height map, so they choose purely on look.

4) Characters and karts: bake each kart into one mesh per material when the game loads. For drivers, use a BatchedMesh, which draws every jointed part of every driver in one call and still skips parts that are off screen (set frustumCulled=false on it). If the iPhone shows BatchedMesh is slow, bake each NPC's seated driver into its kart; the player's own avatar always stays fully jointed. Do not use InstancedMesh for moving drivers, because it draws every driver every frame.

5) Phone settings: pixel ratio 1.5 (Low 1, High 2). No shadow maps in races on phones; use blob shadows instead (with shadows, a full race reached about 820-870k triangles). No post-processing. Far plane about 1,500 m with fog, near plane at least 0.1 m, preserveDrawingBuffer false. Provisional budgets: at most 100 draw calls including the shadow pass; about 300k visible triangles while exploring; about 400k in a full race without shadows. NPC drivers get a lighter distance version early.

6) Saves: one small versioned localStorage module with an 'lg4.' prefix and a visible message when a save fails. Ghosts fit easily (about 37k characters per minute of lap), so IndexedDB is not needed yet. Lower racing-core's 8,000,000-character ghost limit, which can never actually be stored.

7) Physics costs little (8 karts at 120 Hz took about 1 ms at phone-like CPU speed), so the real unknown is the iPhone's graphics chip. Before building content, make one tiny budget page and open it once on the owner's iPhone. It should show frame rate, draw calls and triangles (both including the shadow pass) at three scripted views (field, track, 8-kart race), each with and without shadows. It should also print whether WEBGL_multi_draw and EXT_clip_control are available. That one check settles BatchedMesh versus baked drivers and the final budgets.
**Confidence:** medium

## Time savers: research
**Question:** Which changes would save the owner the most time and usage while building the miniature LetsGo island, and in what order should they be done?
**Summary:** The biggest measured waste is the publish pipeline. Every push re-runs about 5 minutes of racing browser checks and about 1.2 minutes of rebuilding three avatar labs nobody has touched since 19 November. Docs-only pushes publish too, and 38 of the 60 cancelled publishes this week were cut off by a docs-only push, which made the real code link wait even longer. Publishing now takes about 9 to 10 minutes per push (it was under a minute on 17 November). For half of recent pushes, a change-aware pipeline would bring that down to roughly 2 minutes. The second-biggest saver is letting the owner tune sizes and feel with sliders on the phone, then paste the values into chat. 40% of avatar commits since 19 November were small number tweaks, each costing a round trip of about 24 minutes. Third is porting the owner's own proven code from 3D-WORLD-3. I tested a copy here: it builds, its 32 tests pass, the avatar walks and jumps in the yard, and Canyon Switchbacks and mini golf load. motion-core already ported its ground controller, so there is a precedent. It needs a check for Mario/SM64 material and the owner's approval. Cheaper habits come after that: a one-screen status page instead of the 13,596-word HANDOFF as required reading, a build stamp on every page, and one chat per job. Free CC0 assets, a layout editor and AI 3D generators are worth doing later or not at all.

### Options

1. **1. Run racing checks only when racing or shared files change**
   - How it works: A small step at the start of the publish workflow lists the files changed since the last push (git diff of the before and after commits). Only when a racing or shared file changed does it run the racing unit tests (72 s) and the racing browser suites (about 298 s). The Test Lab links check (6 s) and Motion Lab input check (15.5 s) still run every time. The list of racing files must come from the real import map, not a hand-written guess. If history is unknown, it runs everything. A daily full run is the safety net, and the owner or an assistant can force a full run.
   - Pros: Biggest measured saving. Since 21 November, 52 of 105 pushes (50%) touched no racing or shared file. For those, publish drops from about 9.6 minutes to about 2.2 minutes. Racing pushes keep the full checks. The owner has nothing to set up.
   - Cons: A check that is skipped by mistake could let a regression through, so the file list has to be right. A hand-written list would have missed kart-parts/, motion-core/, src/inspection-zoom.ts and src/test-lab-scene.ts, which racing-lab imports. Codex's suite runner (scripts/check-lab-foundations-browser.mjs) needs a small switch, and COLLABORATION.md recommends Codex coordinate build and release.
   - Evidence: Measured from /home/user/3D-World-4 .github/workflows/deploy.yml runs via gh run list and gh api job steps and logs. Last 25 successful runs: job median 546 s. racing-core step median 72 s. Browser-check step median 290 s. By log (9 runs) the racing-related suites total about 298 of 320 s, and 'Driving controls, FPV and device layouts' alone is 193 s. GitHub's docs say path filters compare head and base SHAs on pushes, and a push of more than 1,000 commits always runs (raw.githubusercontent.com/github/docs/main/data/reusables/actions/workflows/triggering-a-workflow-paths5.md). Job-level skipping avoids the 'required check stays pending' problem that whole-workflow path filters have (search summary of docs.github.com troubleshooting-required-status-checks; this repo has no PR checks, so it does not apply anyway). Prototype: (scratch folder, not saved) plan2/timesavers/changed-areas.mjs. Draft workflow: .../timesavers/lint/deploy-draft.yml.
   - Test result: I replayed the classifier over 342 real push pairs (16-23 Nov), with racing paths taken from the import graph: 101 racing plus study-lab rebuild, 87 docs only, 87 no racing plus study-lab reuse, 57 racing plus study-lab reuse, and 14 unknown (these run everything). Since 21 Nov: 52 no racing, 34 racing, 19 docs only. The esbuild import map of racing-lab/src/main.js showed 47 files from racing-lab, racing-core, kart-parts, motion-core, motion-lab, public, src/inspection-zoom.ts and src/test-lab-scene.ts. The draft workflow passes actionlint 2.0.6 (wasm) with no problems. Not run on real GitHub runners, because that would need a push to the repo.

2. **2. Docs-only pushes do not publish (and no longer cancel a running publish)**
   - How it works: Add a paths filter to deploy.yml: run for '**', but not 'docs/**' or '**/*.md'. README.md and docs/WORLD-RULES.md are added back, because tests read them (test-lab/foundation-browser.mjs reads README.md links, tests/world/rulebook.mjs reads WORLD-RULES.md). A docs-only push then starts no run, so it cannot cancel a code publish that is in progress.
   - Pros: About 10 lines, near-zero risk, nothing for the owner to do. It removes about 25% of all runs. Most importantly, a code link is no longer delayed when an assistant pushes a notes update right after the code.
   - Cons: Someone must remember the two test-linked docs, and the exceptions are already in the draft. Gitignored or generated .md files written by racing tests (CHECK-RESULTS.md) arrive with code changes anyway.
   - Evidence: 357 publish runs in 7 days. 60 were cancelled, and 38 of those were cancelled by a docs-only push, throwing away 68 minutes of work already done. The most edited docs were FEATURES.md (32 docs-only pushes), MINIGAMES.md (24), NEXT.md (9), CLAUDE.md (7) and HANDOFF.md (5). GitHub's paths filter: 'When all the path names match patterns in paths-ignore, the workflow will not run', and negation order matters (raw github/docs reusables triggering-a-workflow-paths1/3/5.md).
   - Test result: I simulated the proposed filter with minimatch, using GitHub's rule that the last matching pattern wins, over 342 push pairs: 82 skipped, 260 run, 14 unknown. The 5 docs-only pushes that touched docs/WORLD-RULES.md would still run. Spot checks: README.md runs, WORLD-RULES.md runs, FEATURES.md skips, CLAUDE.md skips, a code file runs.

3. **3. Slider tuning panels with a 'Copy values for chat' button**
   - How it works: Pages that show something the owner judges by eye (avatar parts, kart size, island zones, hoop height, ramp angle, camera distance) get a small panel of sliders. The sliders start at the approved values and have a 'Back to approved' button. The owner drags until it looks right, taps Copy, and pastes one line (for example: TUNE {"hipDepthCm":4.25}) into chat. The assistant then makes one commit.
   - Pros: It turns several 24-minute round trips into one. It suits the owner: visual, on the phone, and approved parts are never changed without them, which respects HOW-TO D2. It adds no new dependency, because lil-gui (MIT) ships inside three 0.180. It is reusable for the island layout and for kart sizes, where the F1 length still disagrees (2.9 m vs 4.6 m).
   - Cons: It only helps with number tweaks, not shape-quality work like creases or seams (about 60% of avatar commits). Baked geometry (the new-avatar torso sockets take about 40 s to bake) cannot always update live. lil-gui's default slider is too narrow on a phone, so it needs phone styling or native range inputs. Rule 16 says lab pages share motion-lab/src/page.js, so the panel belongs there, and that file is in Codex's shared area.
   - Evidence: Since 19 Nov, 35 of 88 avatar commits are number or position tweaks (for example on 22 Nov: 'hip balls about 1 cm deeper (63%)', '2 cm deeper (80%)'; 8 hip commits between 09:18 and 13:11). The median gap between avatar commits in active streaks is 23.9 min (75 gaps), of which about 9.6 min is publish wait on 22-23 Nov. lil-gui 0.17.0 (MIT) is at node_modules/three/examples/jsm/libs/lil-gui.module.min.js. The repo already uses range inputs for poses (avatar-lab/src/main.js, hand-lab/src/main.js) but not for sizes. Prototype: .../timesavers/tune/index.html and tunetest.cjs. Screenshot: .../timesavers/tune-phone.png.
   - Test result: Prototype on iPhone 13 emulation (Chromium, touch, 4x CPU throttle via CDP): a touch drag moved 'Hip balls depth' from 2 to 4.25. Time from input to the next frame: 38 ms median, 43 ms max (SwiftShader, so real GPU timings will differ). Copy produced 'TUNE {"hipDepthCm":4.25,"hipGapCm":21.5}'. No page errors. Diagnosis: the lil-gui slider track is only 47 CSS px wide at 390 px, too small for fine thumb control, so it needs a wider phone layout. Not tested on a real iPhone or Safari/WebKit (only Chromium is available here).

4. **4. Port proven code from the owner's old repo (with an audit), instead of rebuilding**
   - How it works: Reuse the pieces that already work, rewritten to fit 3D-World-4's rules (logic separate from drawing, the block world, racing-core, the ragdoll avatar). (a) Jump, gravity and landing from 3D-WORLD-3's src/player/Player.ts and Tuning.ts, continuing the ground-controller port already in motion-core. (b) The kart get-in and get-out functions canEnterVehicle, findExitPosition and resolveParkedKart from apps/letsgo-racing/src/vehicle-controller.js, wired to racing-core karts. (c) The mini-golf ball simulation and its 3 tests from apps/letsgo-garden/src/mini-golf.js, adapted to the shared ball system. (d) The Canyon Switchbacks compact-route authoring (503 m, 8.6 m road on the same 0.43 m grid) as a model for the six short tracks, done by Codex in racing-core. (e) The yard (src/world/Course.ts) as a layout source for the obstacle part of the practice field.
   - Pros: Likely saves weeks. These are working, tested systems the owner already tuned and played. The 0.43 m grid already matches. There is a precedent: motion-core/controller.js is described as 'a pure, drawing-free port of the 3D-WORLD-3 ground controller', and tuning.js 'copied exactly from 3D-WORLD-3'.
   - Cons: CLAUDE.md rule 9 makes 3D-WORLD-3 reference only, so each port needs the owner's approval. The old apps/letsgo-racing contains SM64 decompilation material: references/sm64-backflip.json, src/preview/backflip*.js citing n64decomp/sm64js, and public/references/backflip-study.md. Its animation/running.js imports a backflip clip. All of that must be excluded, and every file needs a provenance check, because old DECISIONS.md says Super Mario 64 was the movement reference. The old code mixes drawing with logic (createMiniGolf takes THREE, renderer and camera). The old island kart uses the old racing physics, so it must be swapped to racing-core (Codex's approved 'Fast' feel). The old avatar is a clay model, not the 63-bone ragdoll. HANDOFF 'Confirmed by the owner' item 1 says movements come back one at a time, walking and running first.
   - Evidence: Old code sizes (lines; the files are dense): Player.ts 2,717; CollisionWorld.ts 213; Course.ts 1,054; island app 2,094 in total; garden app 731 in total. Old dependencies: three 0.180.0 only (same version as 3D-World-4). Island imports: ../../letsgo-racing/src/vehicle-controller.js, ../../../src/player/Player.ts, ../../../src/physics/CollisionWorld.ts. Grep found no SM64 references in old src/ apart from comments mentioning Mario's proportions and worlds.
   - Test result: Copied to scratch (.../timesavers/old3) with npm ci. Builds: main 1.5 s, island 1.4 s, garden 1.2 s. Tests: island 18/18 pass (terrain 6, renderer 4, avatar 4, track-link 4), garden 14/14 pass (including 3 golf and 7 canyon tests). Headless Chromium: the yard (?arena) is ready in 1.8 s. The avatar walked 4.5 m in 2.5 s holding forward, jumped to 0.76 m and landed (state 'jump' then 'fall' then ground). The island avatar walked 8.3 m in 2 s. The garden loads Canyon Switchbacks in 2.1 s with drive and golf APIs and its Drive track and Play golf buttons. No page errors. Screenshots: old-course.png, old-garden.png. I did not test kart get-in in the browser (the track-link unit tests pass).

5. **5. Build cache for untouched labs (freeze old labs automatically)**
   - How it works: The foot, wrist and elbow lab builds run their own tests and bake geometry on every push. Instead, take a fingerprint of their input files (avatar/, motion-core/, the three lab folders, scripts/bake-study.mjs, src/study-asset.js, package-lock.json). When nothing changed, reuse the last output (actions/cache in CI, a .cache folder locally). The new avatar can use the same approach.
   - Pros: 75 s saved on most pushes (foot 11.6 + wrist 27.8 + elbow 35.8 s median in CI). It is automatic, so no owner decision to freeze anything is needed, and a lab rebuilds the moment one of its inputs changes. Works locally too.
   - Cons: Inputs read at runtime (data files not seen by imports) must be listed by hand. Hashing whole folders keeps this safe but can cause extra rebuilds.
   - Evidence: Per-lab build timings from 9 CI logs. git log: foot-lab, wrist-lab and elbow-lab are unchanged since 2026-11-19. Their build scripts run tests (for example elbow-lab/build.mjs runs node --test elbow-lab/tests/study.test.mjs), then bake. The esbuild metafile shows wrist and elbow depend on src/study-asset.js, scripts/bake-study.mjs, avatar, motion-core, wrist-lab and foot-lab.
   - Test result: Prototype input-hash cache on a scratch copy of the repo: elbow-lab first build 44.3 s, second run 0.15 s (116 input files unchanged, output reused). After editing an input file it correctly rebuilt (44.3 s).

6. **6. One-screen STATUS page as required reading; HANDOFF becomes a reference log**
   - How it works: A page of about 500 words: current goal, what works, what is next, who owns what, open decisions, links. It replaces docs/HANDOFF.md in the start-of-session reading list. HANDOFF (mostly the 12,526-word 'Confirmed by the owner' list) is searched when needed rather than read in full.
   - Pros: Cuts start-of-session reading from about 16,100 words (CLAUDE.md, HOW-TO, HANDOFF, COLLABORATION; about 21k tokens) to about 2,500 words (about 3-4k tokens), saving about 17k tokens per fresh session and per subagent. Less risk of acting on stale or contradicting notes. Cheaper to keep current: HANDOFF was changed in 107 commits this week, and editing an 82 KB file usually means reading it first.
   - Cons: Someone must keep STATUS up to date (a finish routine does it). Decisions must still be recorded somewhere permanent. CLAUDE.md and AGENTS.md point to HANDOFF, so changing them is an owner-visible process change.
   - Evidence: wc: HANDOFF.md 13,596 words, 81,819 chars, 188 lines (about 17.7k tokens at 1.3 tokens per word, about 20.5k at 4 chars per token; it was 13,101 words yesterday). Anthropic's best-practices guidance: CLAUDE.md is loaded every session, so it should hold only broadly applicable things, and context filling up degrades performance (search summary of code.claude.com/docs/en/best-practices and claude.com/blog/using-claude-md-files; pages not fetched because they are blocked here). Codex reads AGENTS.md up to a 32 KiB default limit (secondary sources only; not confirmed on developers.openai.com).
   - Test result: Measured only (word, character and line counts, and commit counts). The token figures are estimates, not tokenizer output. The ~2M tokens a week figure for HANDOFF edits is an unverified upper bound (107 edits x ~20k tokens, if each edit re-read the whole file).

7. **7. Build stamp on every page plus cache-busting links**
   - How it works: Every page shows a small 'build <commit> <time>' label. Every link an assistant gives the owner ends in ?v=<short commit>. The owner can see at a glance whether the phone shows the new version.
   - Pros: About 30 minutes of work. It prevents 'I don't see the change' round trips caused by GitHub Pages caching. The owner's old repo added exactly this because, in its own words, stale-page problems 'all three have happened'.
   - Cons: Small. The label must stay out of the way in screenshots and on the phone.
   - Evidence: Old 3D-WORLD-3 vite.config.ts buildStamp() comment. No build stamp exists in 3D-World-4 (grep for BUILD_STAMP and buildStamp found nothing). GitHub Pages reportedly sends Cache-Control max-age=600 and users cannot change it (search summary citing a GitHub Support quote and jakearchibald.com/2016/caching-best-practices; not confirmed directly, because the live site is blocked by this session's proxy).
   - Test result: Not tested: the github.io headers could not be fetched here (proxy 403).

8. **8. One chat per job, with a start and finish routine**
   - How it works: Start: read STATUS, check git state, agree the chunk. Finish: update STATUS, push once, give the link, end the chat. The next job starts in a fresh chat.
   - Pros: Smaller context per message, so less usage and less quality loss from very long chats. Anthropic advises clearing between unrelated tasks. Pairs with item 6.
   - Cons: Needs STATUS (item 6) to work well. It changes the owner's habit, and the owner may like long threads.
   - Evidence: Commit trailers show long sessions: one Claude session made 158 commits from 16 Nov 18:30 to 20 Nov 19:17, another 83 commits from 20 Nov to 23 Nov. Anthropic support advises running /clear when switching tasks (search summary of support.claude.com/en/articles/14553240).
   - Test result: Not testable here. The usage saving depends on how the owner's plan counts cached context, which is unknown.

9. **9. Data-driven stations and island layout**
   - How it works: The island and practice field are described in one data file: zones, track footprints, and stations such as {type:'hoop', x, z, rotation, height}. One shared template builds each station type, so adding a station is one line and moving it is a number change. Sliders (item 3) and a later layout editor (item 11) write to the same data.
   - Pros: Fits the owner's 'keep everything flexible'. Matches the shared minigame template (MINIGAMES.md section A) and the 26 approved block types. It is the standard Type Object or data-driven pattern.
   - Cons: The schema needs a careful first design (a foundation decision, so deep research applies). It is probably covered in more depth by the architecture researcher.
   - Evidence: gameprogrammingpatterns.com/type-object.html (Nystrom; chapter located by search, not fetched). Greybox first, art later reduces wasted work (Epic greyboxing docs, dev.epicgames.com/documentation/en-us/uefn/greyboxing-in-unreal-editor-for-fortnite; search summary).
   - Test result: Not tested (design-level).

10. **10. One quick-check command**
   - How it works: npm run check uses the same changed-files classifier as item 1. It runs the TypeScript check, the unit tests for the touched areas, and the cached builds of the touched pages, before an assistant pushes.
   - Pros: Assistants no longer have to choose among about 70 npm scripts each time, which saves usage. It also catches area tests that CI never runs: test:new-avatar (35 s locally) is not in deploy.yml.
   - Cons: CI failures are already rare (4 failures in 357 runs), so the time saved comes mainly from less assistant deliberation, not fewer red builds.
   - Evidence: package.json lists about 70 scripts. Local timings on the scratch copy: tsc 1.4 s, vite build 1.8 s, test:lab-foundations 1.2 s, test:official-avatar 6.5 s, test:new-avatar 35 s, build:new-avatar 41 s.
   - Test result: Component timings measured locally (4-CPU container). The combined command was not built.

11. **11. Phone-friendly 2D layout editor**
   - How it works: A top-down map of the island on the 0.43 m grid. The owner drags zones and stations with a finger, then taps 'Copy layout' and pastes it into chat, using the same mechanism as the sliders.
   - Pros: It removes 'move the hoop 3 m left' round trips while the owner reshapes the island, which they expect to do often.
   - Cons: About a day of assistant work. It only pays off once item 9 exists. A 3D gizmo (three's TransformControls) is clumsy on a phone, and desktop editors (Tiled, LDtk, Blender, the three.js editor) do not fit a phone-only owner.
   - Evidence: TransformControls ships in three/addons. The copy-to-chat mechanism worked in the slider prototype.
   - Test result: Not tested separately (the same copy mechanism worked in item 3's prototype).

12. **12. Free CC0 asset kits for props (later, in the looks phase)**
   - How it works: For the looks pass, use glTF models from Kenney (Minigolf Kit, Racing Kit, Mini Skate), Quaternius (CC0), and only the CC0 or credited CC-BY models from Poly Pizza, loaded with three's GLTFLoader.
   - Pros: Hundreds of ready props that fit the miniature directly (golf holes, track dressing, skate ramps). CC0 needs no credit. The repo's own legal note (docs/game-dev/19-legal.md section D) says CC0 and CC-BY are fine.
   - Cons: The style may clash with the 0.43 m block world and the code-made look. CLAUDE.md rule 16 keeps visuals as placeholders until controls pass, and simple sports props (hoop, net, cones) are trivial to make from primitives. Poly Pizza is mostly CC-BY, licensed per model. It adds an asset pipeline and triangle-budget checks.
   - Evidence: Kenney: all game assets CC0, credit optional (search summary of kenney.nl/support). The Minigolf Kit is listed as CC0 with 125 assets (kenney.nl/assets/minigolf-kit). The Racing Kit is CC0 with glTF (kenney.nl/assets/racing-kit; opengameart.org/content/racing-kit). Mini Skate: 20 models in OBJ/FBX/glTF, CC0 (kenney-assets.itch.io/mini-skate). Quaternius packs are CC0 (quaternius.com/packs/fantasypropsmegakit.html). Poly Pizza licenses are per model, mostly CC-BY (third-party guides only). All via search summaries; the pages are blocked for direct fetch here.
   - Test result: Not tested (licence pages not fetchable here; verify each pack's licence file on download).

13. **13. Two-level research rule (owner's call)**
   - How it works: Deep research and testing for foundations: physics, data formats, controls, the pipeline. For look or taste choices: 2-3 quick visual mockups the owner reacts to, because their eyes are the deciding evidence.
   - Pros: Fewer long research passes on small visual choices. Consistent with HOW-TO A's 'bring me options to react to' for taste questions.
   - Cons: It changes the owner's number-one rule ('for every step, however small'), so only the owner can decide.
   - Evidence: HOW-TO-WORK-WITH-ME.md section A.
   - Test result: Not measurable from the repo.

14. **14. Batch small changes into one push**
   - How it works: Commit the code and its notes together and push once.
   - Pros: With cancel-in-progress, every quick follow-up push restarts the roughly 9-minute publish. 180 of 356 pushes came within 10 minutes of the previous one.
   - Cons: Item 2 already removes the worst case (docs follow-ups), so what is left is small. It also delays the first link slightly.
   - Evidence: Run timing gaps from gh run list. 139 minutes of cancelled publish work in 7 days.
   - Test result: Measured only.

15. **15. Faster racing test suites (Codex's area)**
   - How it works: Run racing-core's 17 test files as separate files so node --test runs them in parallel. Profile and possibly split the 193 s 'Driving controls, FPV and device layouts' browser suite.
   - Pros: Shortens the racing pushes that item 1 cannot skip.
   - Cons: It is Codex's code, so Codex should do it.
   - Evidence: racing-core/tests/core.test.mjs imports all 17 test files into one process. The Driving suite takes 60% of browser-check time.
   - Test result: Locally the same 285 tests run as parallel files took 59 s against 93 s serial, all 285 passing (4 CPUs; GitHub public-repo runners are also commonly 4 vCPU, not confirmed here).

16. **16. Browser install: chromium only when no WebKit suite runs (and do not bother caching)**
   - How it works: Install WebKit and its system packages only when the racing WebKit 'app return' suite will run. Skip caching browser binaries.
   - Pros: Most of the 140 MB of system packages (gstreamer and other multimedia libraries) are there for WebKit. Two of 25 recent runs lost 12-14 minutes to slow Ubuntu mirrors on exactly those packages.
   - Cons: The chromium-only install time on GitHub runners was not measured. Caching would save only about 11 s, and Playwright's docs advise against it.
   - Evidence: CI log 45278325206: apt installed 185 packages (140 MB) in about 34 s, and the browser downloads took about 11 s. Log 45280900832: the same apt step took about 12 minutes, stalling on multimedia packages. 107 of the 211 new package names are multimedia or gstreamer. Playwright docs: 'Caching browser binaries is not recommended, since the amount of time it takes to restore the cache is comparable to the time it takes to download the binaries... operating system dependencies... are not cacheable' (raw.githubusercontent.com/microsoft/playwright/main/docs/src/ci.md, published at playwright.dev/docs/ci#caching-browsers).
   - Test result: Analysed the logs only. Locally, playwright install-deps --dry-run reported chromium dependencies already satisfied while WebKit needs the gstreamer packages (Ubuntu 24.04 here; the GitHub runner is Ubuntu 26.04).

17. **17. AI 3D model generators (not now)**
   - How it works: Generate props from text or images with tools such as Meshy, Tripo, Hunyuan3D or TRELLIS.
   - Pros: Fast for complex one-off props.
   - Cons: Licence traps: Meshy's free plan output is CC BY 4.0 with paid plans 'Private'. The Hunyuan3D licence excludes the EU, UK and South Korea. TRELLIS is MIT but depends on NVIDIA's non-commercial nvdiffrast. Tripo's terms are unconfirmed. Output tends to be heavy (the phone avatar budget is about 29k triangles), does not match the block style, and the miniature's props are simple shapes.
   - Evidence: Search summaries of docs.meshy.ai/pricing and help.meshy.ai/en/articles/9992001; huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE; github.com/microsoft/TRELLIS/issues/298 and cgworld.jp/flashnews/01-202601-TRELLIS2.html. None were fetched directly.
   - Test result: Not tested (no accounts, and not needed for the miniature).

### Tests run

1. **Current publish time and where it goes**
   - How: gh run list (357 runs, 16-23 Nov) plus gh api job steps for the 25 most recent successful runs, and job logs for 9 runs parsed for per-suite and per-lab timings. Scripts: .../timesavers/steps.py, suites.py, build.py
   - Result: Job median 546 s (mean 601, max 1389). racing-core 72 s. Build 102 s, of which foot, wrist and elbow labs total 75 s and new-avatar 23 s. Browser install 44 s median, with 720 s and 832 s outliers. Browser checks 290 s median by step (320 s by log), about 298 s of it racing suites, and 'Driving controls, FPV' alone 193 s. pages-build-deployment median 32 s. Daily median publish rose from 0.3 min (17 Nov) to 10.3 min (23 Nov). 60 runs were cancelled, 38 of them by a docs-only push (68 min of progress discarded).
   - Limits: Wall-clock time on GitHub's shared runners varies. Artifact downloads were blocked, so per-suite times come from log timestamps.

2. **Which pushes need which checks**
   - How: For each consecutive pair of runs I ran git diff --name-only between their head SHAs (read-only on the repo) and fed the result to the prototype classifier .../timesavers/changed-areas.mjs
   - Result: 342 known pairs: 87 docs only, 158 racing or shared, 97 no racing (plus 14 unknown, which run everything). Since 21 Nov (105): 52 no racing with study-lab reuse, 34 racing, 19 docs only.
   - Limits: A pair of runs is a stand-in for a push (cancelled runs merge pushes). The racing path list is only as good as the import map.

3. **Whether a hand-written racing file list is safe**
   - How: esbuild metafile bundle of racing-lab/src/main.js and motion-lab/src/main.js in the scratch copy
   - Result: racing-lab imports from kart-parts, motion-core, src/inspection-zoom.ts and src/test-lab-scene.ts besides racing folders. My first hand-written list missed these, so the list must be generated from imports.
   - Limits: Runtime-loaded files (fetch or readFile) do not show up in the import graph.

4. **Proposed docs-only paths filter**
   - How: minimatch simulation of GitHub's last-pattern-wins rule over 342 pairs (.../timesavers/lint/pathsim.mjs)
   - Result: 82 pushes skipped, 260 run. README.md and docs/WORLD-RULES.md still trigger a run. CLAUDE.md, FEATURES.md and PNGs under docs skip.
   - Limits: minimatch approximates GitHub's matcher. Not exercised on GitHub itself.

5. **Draft workflow validity**
   - How: actionlint 2.0.6 (npm wasm build) on .../timesavers/lint/deploy-draft.yml and on the current deploy.yml
   - Result: No problems in either.
   - Limits: Static lint only. The draft also needs small changes to the suite runner script and the build scripts, which were not written.

6. **Input-hash build cache**
   - How: Prototype wrapper on a scratch copy of the repo: hash of the input folders, then reuse or rebuild of dist/elbow-lab
   - Result: 44.3 s first build, 0.15 s reuse, correct rebuild (44.3 s) after editing an input.
   - Limits: Local 4-CPU container. In CI, actions/cache adds restore time (not measured).

7. **Parallel racing-core unit tests**
   - How: Ran the same 17 imported test files plus the core tests as separate files with node --test in the scratch copy
   - Result: 285/285 pass in 59 s, against 93 s for npm run test:racing-core (serial).
   - Limits: Local machine. CI speedup not measured.

8. **Old 3D-WORLD-3 code still works**
   - How: Copied to scratch with tar (excluding .git and node_modules), ran npm ci, the builds and the unit tests, served dist locally and drove it with Playwright Chromium (oldgame.cjs, oldgarden.cjs)
   - Result: All three apps build in about 1.2-1.5 s. Island 18/18 and garden 14/14 tests pass. Yard: walk 4.5 m in 2.5 s, jump peak 0.76 m, landed. Island avatar walked 8.3 m in 2 s. Garden Canyon Switchbacks plus golf load in 2.1 s. No page errors.
   - Limits: Headless SwiftShader. I did not drive the kart entry in the browser. Porting effort is estimated, not done.

9. **Slider tuning panel on a phone-sized screen**
   - How: lil-gui from three 0.180 in a small three.js page. Playwright iPhone 13 device emulation, CDP touch events, CPU throttled 4x (tunetest.cjs)
   - Result: Touch drag changed the value (2 to 4.25). Input to next frame: 38 ms median, 43 ms max. Copy produced a pasteable TUNE line. The default slider track is only 47 CSS px wide, so it needs a phone layout.
   - Limits: Chromium emulation with a software GPU. Not real iPhone Safari.

10. **Why the browser install sometimes takes 12-14 minutes**
   - How: Read the apt sections of CI logs and ran playwright install-deps --dry-run locally
   - Result: 185 packages (140 MB) per run. 107 of 211 package names are multimedia or gstreamer, needed by WebKit. The slow runs stalled downloading these from the Ubuntu mirror. Browser binaries download in about 11 s.
   - Limits: The chromium-only install time on GitHub's Ubuntu 26.04 runner was not measured.

11. **Avatar tweak round trips and session length**
   - How: git log over the avatar folders since 19 Nov, a regex for number-tweak messages, gaps under 120 min, and Claude-Session trailers
   - Result: 88 avatar commits, 35 of them number tweaks (40%). Median gap 23.9 min. Sessions: 158 commits over 4 days, 83 over 3 days, 29 over 1 day.
   - Limits: A commit gap includes the assistant's work and the owner's review, not only publishing. The regex is approximate.

12. **Required-reading size**
   - How: wc on docs, plus per-section word counts of HANDOFF
   - Result: HANDOFF 13,596 words or 81,819 chars (12,526 of them in 'Confirmed by the owner'). Required set about 16,087 words. HANDOFF changed in 107 commits in 7 days.
   - Limits: Token counts are estimates (words x 1.3, chars / 4); no tokenizer was used.

### Recommendation
**Choice:** Do these in order. Step 1, now (about 1-2 hours of assistant time, nothing for the owner to set up): a change-aware publish workflow, made of item 2 (docs-only pushes do not publish), item 1 (racing checks only when racing or shared files change, with paths taken from the import graph, a daily full run, and run-everything when unsure), item 5 (input-hash cache for the untouched labs) and item 16 (install WebKit only when its suite runs). Claude can draft it; Codex reviews or co-owns it as build/release coordinator, because it changes Codex's suite runner. Step 2, at the start of the miniature build: item 7 (build stamp), item 6 (one-screen STATUS page) and item 8 (one chat per job). Step 3, with the owner's approval: item 4 (audited ports from 3D-WORLD-3: jump, gravity and landing; kart get-in and get-out; mini-golf ball simulation; the compact Canyon-style track method; yard obstacle ideas), and item 3 (slider panels in the shared page module), added to each page the owner tunes. Later: items 9-12 (data-driven layout, then a phone layout editor, then CC0 assets in the looks phase). Skip AI generators and browser-binary caching.
**Why:** The pipeline fix is the largest measured saving and needs nothing from the owner. At the 21-23 November rate (about 35 pushes a day) it removes about 3 CI-hours a day: about 128 min from 17 no-racing pushes at about 7.4 min each, about 61 min from 6 docs-only pushes, about 27 min from lab caching on about 21 pushes, plus about 10 min a day of link delay caused by docs pushes cancelling code publishes. The link for a typical avatar or world push would arrive in about 2.2 instead of about 9.6 minutes, cutting the 24-minute avatar round trip by about 30%. If the owner actually waits on about half of the pushes, that is roughly 4-10 owner hours a week. The miniature will add more pages and suites, so publish time would otherwise keep growing (it went from 0.3 to 10.3 minutes in 6 days). Sliders and ports are probably as large or larger, but they need the owner's approval and per-page work, so they come second.
**Confidence:** high
**Conflicts with confirmed decisions:** (a) CLAUDE.md rule 9: 3D-WORLD-3 is reference only, so every port in item 4 needs explicit owner approval, a Mario/SM64 provenance check, and anything from apps/letsgo-racing preview/ or animation/backflip* and references/sm64-* excluded. (b) HANDOFF 'Confirmed by the owner' item 1: movements return one at a time, walking and running first. A ported jump must wait its turn. (c) The confirmed separation of logic from drawing: old mini-golf and garden code mix them, so the ports are rewrites, not copies. (d) COLLABORATION.md recommends Codex as build/release coordinator, and the racing suite runner is Codex's, so the pipeline change must be coordinated. (e) CLAUDE.md rule 16 says lab pages share motion-lab/src/page.js, so a slider panel goes into that shared module (Codex's shared Test Lab area). (f) HOW-TO section A ('every step, however small'): item 13 changes it, so it is listed only as an owner question. (g) Frozen checkpoints and build:checkpoints are untouched by every proposal.
**What would change it:** If the owner rarely waits on publishes, the pipeline saving becomes mostly assistant usage and CI time rather than owner hours. If Codex prefers to keep every racing suite as a gate on every push, item 1 shrinks to items 2, 5 and 16 (about 1.5 minutes saved per push instead of about 7.4). If the owner says no to porting, item 4 drops and the jump, kart-entry and golf systems are built fresh, which likely costs weeks. If a real-iPhone test shows sliders are awkward, use native range inputs or a bottom-sheet layout instead of lil-gui. If GitHub's runner shows chromium-only installs are still slow, use the official Playwright Docker image.

### Key numbers
1. 357 publish runs in 7 days (16-23 Nov); 111 since 21 Nov (about 37 a day). Source: gh run list on deploy.yml
2. Publish job median 546 s (9.1 min) over the last 25 successful runs, plus a 32 s median pages-build-deployment. Source: gh api jobs and run list
3. Daily median publish grew from 0.3 min (17 Nov) to 10.3 min (23 Nov). Source: gh run list startedAt/updatedAt
4. Racing browser suites take about 298 of about 320 s of browser checks (about 93%); 'Driving controls, FPV and device layouts' alone 193 s (60%). Source: 9 CI logs
5. racing-core unit tests 72 s median in CI; locally 93 s serial vs 59 s as parallel files (285/285 pass). Source: CI steps, local runs on a scratch copy
6. Build 102 s median: foot-lab 11.6 + wrist-lab 27.8 + elbow-lab 35.8 = 75 s for labs unchanged since 19 Nov; new-avatar 23.2 s. Source: CI logs, git log
7. Browser install 44 s median; 2 of 25 runs took 720 s and 832 s, stalled on WebKit multimedia packages (107 of 211 new packages). Source: CI logs
8. 60 cancelled runs; 38 were cancelled by docs-only pushes, discarding 68 min of publish progress. Source: gh run list plus git diff classification
9. Of 342 known pushes: 87 docs only (82 skippable under the proposed filter), 97 need no racing checks, 158 racing or shared. Since 21 Nov: 52 of 105 (50%) need no racing checks. Source: classifier replay
10. Estimated fast-path publish: about 101 s job plus 32 s pages, about 2.2 min vs about 9.6 min. Source: arithmetic on measured medians (546 - 72 - 298 - 75 s)
11. Input-hash cache: elbow-lab 44.3 s, then 0.15 s when reused. Source: local prototype
12. 88 avatar commits since 19 Nov, 35 (40%) number or position tweaks; median 23.9 min between avatar commits in active streaks. Source: git log
13. docs/HANDOFF.md: 13,596 words, 81,819 chars (about 17.7k-20.5k tokens); changed in 107 commits in 7 days; required start reading about 16,087 words. Source: wc, git log
14. Claude sessions: 158 commits over 4 days (16-20 Nov), 83 over 3 days (20-23 Nov). Source: Claude-Session commit trailers
15. Old 3D-WORLD-3: builds in 1.2-1.5 s; island 18/18 and garden 14/14 tests pass; yard avatar walked 4.5 m in 2.5 s and jumped to 0.76 m. Source: scratch copy plus Playwright
16. Slider prototype: 38 ms median input-to-frame at 4x CPU throttle (SwiftShader); lil-gui slider track 47 CSS px wide on a 390 px phone. Source: Playwright iPhone 13 emulation
17. lil-gui 0.17.0 (MIT) ships inside three 0.180 at examples/jsm/libs/lil-gui.module.min.js. Source: node_modules inspection
18. Playwright docs: caching browser binaries 'is not recommended'; measured browser download about 11 s. Source: microsoft/playwright docs/src/ci.md, CI log

### Time savers
1. Skip racing unit and browser checks when no racing or shared file changed (about 7.4 min saved per such push; 50% of recent pushes)
2. Docs-only pushes start no publish, so they stop cancelling code publishes (82 of 342 pushes; 38 of 60 cancellations)
3. Cache the foot, wrist and elbow lab builds by input fingerprint (75 s per push; tested 44 s down to 0.15 s)
4. Install WebKit only when the WebKit suite runs (avoids 12-14 min apt stalls seen in 2 of 25 runs); do not cache browser binaries (about 11 s, and not recommended)
5. Daily full run plus run-everything-when-unsure as the safety net for skipped checks
6. Slider panels plus a 'Copy values for chat' button for sizes and feel (targets the 40% of avatar commits that are number tweaks)
7. Port audited, proven systems from 3D-WORLD-3 (jump/gravity/landing, kart get-in/out, mini-golf ball simulation and tests, compact Canyon track method, yard obstacles) instead of rebuilding
8. One-screen STATUS page as required reading; HANDOFF searched on demand (about 17k tokens saved per fresh session or subagent)
9. Build stamp on every page plus ?v=<commit> on every link given to the owner
10. One chat per job with a start and finish routine
11. Data-driven station and island layout file; later a phone 2D layout editor writing the same file
12. One quick-check command for assistants that reuses the changed-files classifier
13. Codex: run racing-core test files in parallel (93 to 59 s locally) and profile the 193 s Driving suite

### Risks
1. Path-based skipping could miss a regression if the racing file list is wrong. A hand-written list missed four imported folders. Mitigate by generating it from the import graph, running everything when the history is unknown, adding a daily full run, and allowing a manual full run.
2. README.md and docs/WORLD-RULES.md are read by tests, so they must stay as 'run' paths in the docs filter.
3. The pipeline change touches Codex's suite runner and Codex's recommended build/release role, so it needs coordination or there may be parallel edits.
4. 3D-WORLD-3 contains SM64 decompilation material (references/sm64-backflip.json, preview/backflip*.js, a backflip clip imported by animation/running.js), and its old decisions name Super Mario 64 as the movement reference. Any port needs a provenance audit, and the owner rule 'never use Mario/SM64 data' wins.
5. Old code mixes drawing and logic, uses the old racing physics and a clay avatar, so ports must be rewrites to fit racing-core, the ragdoll and the block world, not copy-paste.
6. Sliders only help with number tweaks; baked geometry may not update live; the lil-gui default layout is too small for thumbs.
7. STATUS can go stale unless the finish routine updates it every time.
8. Savings estimates assume the 21-23 Nov push mix continues; owner hours depend on how often the owner actually waits for links.
9. CC0 and CC-BY licences must be checked per pack or model (Poly Pizza is mostly CC-BY). AI generator terms vary and some are restrictive (Hunyuan3D territory exclusions, TRELLIS's NVIDIA dependency).
10. All browser measurements used a software GPU (SwiftShader) in Chromium. Frame times are not real-GPU or real-iPhone numbers, and WebKit was not available here.
11. Several web sources (docs.github.com, playwright.dev, kenney.nl, quaternius.com, github.io) were blocked for direct fetch. Facts from them come from raw GitHub doc sources where possible, otherwise from search summaries, as marked.

### Owner taste questions
1. Porting old work: may the assistants port proven pieces from 3D-WORLD-3 after a Mario/SM64 check? Options: (a) port jump/gravity/landing, kart get-in/out, mini-golf ball physics and the compact-track method, each rewritten to fit this repo; (b) use the old repo only as a reference and build everything fresh; (c) port only Codex's racing and golf pieces, and build movement fresh.
2. Tuning by dragging: would you like slider panels on the phone where you drag until it looks right, tap Copy, and paste the line into chat? Options: (a) yes, on every page where you judge sizes or feel; (b) only for the avatar and karts; (c) no, keep describing changes in words.
3. How deep to research small look choices: options (a) keep full research for every step, as now; (b) deep research for foundations, and 2-3 quick visual options for looks and taste that you pick by eye; (c) option b, but you can say 'go deep' on any item.
4. Chat habit: options (a) one fresh chat per job, with a short start and finish routine and a one-screen status page; (b) keep long chats as now; (c) a fresh chat per day.

## Time savers: skeptic
**Holds up:** True
**Confidence:** high

### Problems

1. **The way it decides when to skip the racing checks is too cautious and easy to break. It guesses from a hand-made list of file patterns: racing-lab, racing-core, kart-parts, motion-core, test-lab, package.json, vite.config, .github and others. Editing any of those, even just adding a script name to package.json, re-runs about 6 minutes of racing checks. Someone also has to keep the list up to date by hand.**
   - Evidence: I rebuilt racing-lab from source at every pushed commit since 20 Nov (133 builds, git archive into scratch, 0 failures). The racing build is byte-for-byte repeatable: my fresh build at HEAD matched the committed racing-lab/index.html exactly (sha 790d6324...). Of the 105 pushes since 21 Nov, only 10 changed the built racing page and only 9 changed racing-core. Treating 'this exact thing already passed once' as the rule, the racing browser suites would have needed to run on 12 pushes and the racing-core unit tests on 8. Running the researcher's own changed-areas.mjs on the same pushes reproduces its 52 fast-path pushes, while the fingerprint method gives 74 of the 86 code pushes. Total CI time over those 105 pushes: about 956 min today, 382 min with the researcher's plan, 214 min with the fingerprint plan. I checked that the fingerprint behaves correctly: a comment-only edit in racing-lab/src/main.js left the page hash unchanged (minify strips comments), an avatar-v2 edit left it unchanged, a one-digit change in racing-core/kart/index.ts changed it, and undoing that change brought the old hash back, so a revert reuses the earlier pass.
   - Fix: Base the decision on fingerprints of the output, not on a list of files. After the build, take a fingerprint of dist/racing-lab/** plus racing-lab/tests/**, racing-core/** (minus generated .md files), scripts/test-browser.mjs, scripts/check-lab-foundations-browser.mjs and package-lock.json. Skip the racing browser suites only if that exact fingerprint has passed before, recorded with actions/cache lookup-only. Do the same for the racing-core unit tests, keyed on racing-core/** and package-lock.json. Every page that gets published has still passed its checks, which keeps Codex's 'check before publishing' guarantee intact. Draft: (scratch folder, not saved) plan2/verify-timesavers/lint/deploy-fingerprint-draft.yml (actionlint 2.0.6: no problems).

2. **The cache key for the frozen lab builds includes package.json, package-lock.json and .github, so those labs would rebuild for no reason.**
   - Evidence: Without package.json in the key, the real inputs of the foot, wrist and elbow labs (avatar, motion-core, the three lab folders, scripts/bake-study.mjs, src/study-asset.js, package-lock.json) changed on 0 of 105 pushes since 21 Nov. With package.json in the key, they would rebuild on 21 of 105. The researcher's studyLabs rule also matches .github/. The elbow lab rebuilt in 46.6 s in my scratch copy, and 30 s of that is its own node --test run. Its output was byte-identical to the committed elbow-lab/index.html (f83ab8a4...).
   - Fix: Key the lab cache on the real source folders and package-lock.json only. Leave out package.json, which changes whenever someone adds a script, and leave out .github. Use the same actions/cache fingerprint pattern as the racing checks, so the whole pipeline follows one rule.

3. **Installing WebKit only when its suite runs will not prevent the 12-14 minute install stalls, as the report claims. It only makes them smaller.**
   - Evidence: Playwright's registry code always adds the 'tools' dependency group (targets.add('tools')). On ubuntu26.04 that group includes fonts-unifont and fonts-wqy-zenhei (raw github microsoft/playwright packages/playwright-core/src/server/registry/index.ts and nativeDeps.ts). In the 832 s run (job log 45280900832), I split the 775 s of slow package downloads by package: 139 s on WebKit-only packages, 209 s on the always-installed 'tools' fonts, and 427 s on packages pulled in by other packages. Two of the 46 runs since 22 Nov had installs over 120 s (720 s and 832 s).
   - Fix: Still install WebKit only when the racing suites run, since it helps. To remove apt stalls entirely, test running the job in the official Playwright container image (all dependencies preinstalled), or test dropping --with-deps on the fast path. GitHub's runner image already includes Chrome's libraries, but this is untested and needs a real runner.

4. **The build stamp, done the way the old repo did it, would break the time savers and create constant file churn.**
   - Evidence: 3D-WORLD-3's vite.config.ts injects the commit and time into the bundle at build time (define __BUILD_STAMP__). In 3D-World-4 the built pages are committed to git (racing-lab/index.html, foot-lab, wrist-lab, elbow-lab, motion-lab index.html), and the build scripts write them back into the repo folders. A stamp baked into the bundle would change every build. Output fingerprints would then never match, and every local build would leave changed files that Claude's and Codex's pushes collide on.
   - Fix: Write the stamp after the checks, as a separate dist/version.json created in CI (shown in the draft). The Test Lab shell then reads it and shows it. Keep ?v=<commit> on links given to the owner.

5. **The report says porting from 3D-WORLD-3 'likely saves weeks', but nothing was measured to support that. The SM64 check it asks for also looks only at the old repo, while the current repo already contains SM64 material.**
   - Evidence: The named pieces are small. canEnterVehicle, findExitPosition and resolveParkedKart are about 30 lines (vehicle-controller.js has 108 lines in total). mini-golf.js is 77 dense lines (12 KB), and the canyon files are 50-110 lines each. The only large file, Player.ts (2,717 lines), is built around an SM64-style move set (combo and triple jumps, somersault) and a clay model, so it does not carry over to the ragdoll. src/world/collision.ts already provides moveBox and groundBelow. I confirmed the old builds and tests: island and garden build in about 1.4-1.6 s, island tests pass 18/18, garden tests 14/14. Separately, 3D-World-4 itself contains references/sm64-walk/ (README: 'uses the original MARIO_ANIM_WALKING ... and high-detail Mario model from n64decomp/sm64'). public/references/sm64-walk/ (walk.mp4, GIF, SOURCE.json) is copied to dist and published on the public Pages site (Codex, 17 Nov, commit 7e910f0). docs/NEXT.md line 20 tells assistants to 'Use the original SM64 walk-pose reference'. motion-core/tuning.js is 'copied exactly from 3D-WORLD-3 (src/player/Tuning.ts)', whose own comment says the run speed matches 'the reference it is matched against'. I could not find the 'never use Mario/SM64 data' rule written anywhere in the repo docs.
   - Fix: Describe porting as saving hours to a few days per piece, mostly by reusing tuned numbers and test cases, not weeks. Before any port, the lead should ask the owner whether the existing SM64 reference render in 3D-World-4 is allowed. Any provenance audit should cover 3D-World-4's references/, public/references/, docs/NEXT.md and motion-core/tuning.js, not just the old repo.

6. **The report places the slider panel in Codex's shared module and builds it on lil-gui, whose sliders are too small for a thumb.**
   - Evidence: new-avatar/main.js, the page where most number tweaks happen, does not import motion-lab/src/page.js; it imports src/test-lab-scene.ts. Only racing-lab, motion-lab, the src labs, karts, wrist-lab, run-test, walk-test, skeleton-test and motion-core-test import page.js. In my iPhone 13 emulation (Chromium), the default lil-gui panel was 245 px wide with a 72 px slider track, not the 47 px reported. That is still about 3 px per 0.25 cm step on a 0-6 cm range. A native full-width range input was 242 px wide, next to 48 px -/+ buttons. The owner already compares versions side by side (AVATAR-POLISH-LIST item 1; commits like '6 ft 4 in version ... beside him').
   - Fix: Start in Claude's own new-avatar page. Use a bottom sheet with a full-width native slider, -/+ step buttons of a fixed size (for example 0.5 cm), a 'Back to approved' button and 'Copy for chat'. Keep the approved version visible beside the one being adjusted. Move it into the shared shell only after it has proven itself. Real-iPhone Safari is not tested.

7. **Generated report files inside racing-core are rewritten on every test run and do not match across machines, which would trip any fingerprint or path rule.**
   - Evidence: After npm run test:racing-core in scratch (285/285 pass, 102 s), 2 of the 7 committed report files (kart/STEERING-CHECKS.md and kart/TUNING-CHECKS.md) differed from the committed copies only in the last floating-point digits.
   - Fix: Leave racing-core/**/*.md out of every fingerprint (done in the draft). The docs-only path filter already treats them as docs, which is harmless.

8. **The report missed direct evidence from the owner that would strengthen its priority. It also leaves out that a failing test in one area still blocks publishing in the other.**
   - Evidence: In HANDOFF item 74 (23 Nov), the owner says: 'why am i waiting all of a sudden like 10 minutes'. The note records that Claude's neck push was cancelled by a Codex push whose run then failed its driving test, so 'a failing test blocks everyone's changes'.
   - Fix: Cite this as the owner's own complaint. Be honest that fingerprints only partly remove the blocking: if Codex pushes a racing page that fails, that page never gets a 'passed' record, so the next avatar push re-runs the racing checks and is blocked too. Fully separating the areas would need checks that run after publishing or per-area publishing, which is an owner and Codex decision.

9. **Several numbers are stated more precisely than the evidence allows.**
   - Evidence: The share of avatar commits that were number tweaks depends on how commits are counted. The researcher got 35 of 88 (40%); my wider folder set and different keyword list gave 29 of 109 (27%). The median gap between avatar commits does reproduce (24.4 min, 95 gaps). The '4-10 owner hours a week' figure depends on how often the owner actually waits for a link, which nothing in the repo shows. docs/WORLD-RULES.md is re-included 'because tests read it', but CI never runs tests/world/rulebook.mjs (test:world is not in deploy.yml), so that re-include does no harm but is not needed.
   - Fix: Give a range for the tweak share (about 25-40%). Label the owner-hours figure as a scenario. Keep only README.md as a required re-include.

### Factual errors
1. Slider width: the report says the lil-gui slider track is 47 CSS px wide on a 390 px phone. I measured 72 px with the default lil-gui panel in iPhone 13 emulation. The conclusion that it is too small for a thumb still holds.
2. Browser install: the report says installing WebKit only when needed avoids the 12-14 min apt stalls. Playwright always installs its 'tools' font packages (fonts-unifont, fonts-wqy-zenhei), and those took 209 s of the 775 s of slow downloads in the 832 s run. A chromium-only install shrinks the stall but does not remove it.
3. Who owns the slider: the report says the panel must go in motion-lab/src/page.js, Codex's shared area. The new-avatar page does not import page.js, so the panel can start in Claude's own page.
4. Porting savings: the report says porting likely saves weeks. Nothing was measured; the pieces named are 30-110 lines each, and the large file (Player.ts) is mostly an SM64-style move set that does not carry over to the ragdoll.
5. WORLD-RULES.md: the report says docs/WORLD-RULES.md must still trigger a publish because tests read it. The only test that reads it, test:world, is not run in CI.
6. Which pushes need racing checks: 'Since 21 Nov, 52 of 105 pushes touched no racing or shared file' does reproduce with its own classifier. But it is not a count of pushes that needed racing checks. By the actual built output, 95 of 105 left the racing page unchanged, and racing-core changed in only 9.
7. SM64 audit scope: the report treats SM64 material as a problem of the old repo only. 3D-World-4 already contains and publishes an SM64-data reference (references/sm64-walk, public/references/sm64-walk), and docs/NEXT.md tells assistants to use it.

### Missed options
1. Output fingerprint test caching ('never do the same work twice', the principle behind Turborepo's caching, raw github vercel/turborepo apps/docs/content/docs/crafting-your-repository/caching.mdx). Skip a check only when the exact built page and test files have already passed. It is safer and saves more than the file-list approach (214 vs 382 CI minutes over the 105 pushes since 21 Nov), and it uses actions/cache 'lookup-only' (confirmed in actions/cache restore/action.yml).
2. The official Playwright container image, or dropping --with-deps on the fast path, to remove the random 12-14 min Ubuntu mirror stalls. Not tested; needs a real GitHub runner.
3. For pushes that do change racing, run the slow racing suites as separate parallel jobs (a GitHub matrix), each on its own free 4-CPU runner (GitHub docs: public-repo ubuntu-latest has 4 CPUs and 16 GB). The Driving suite (148-209 s) would run alone. This is Codex's area.
4. Publish first, check afterwards (checks that report but do not block). It would give every push, racing included, a link in about 2.5 minutes, but a broken page could go live. It undoes Codex's 22 Nov publish gate (commit a103b71), so it is an owner and Codex decision. Not recommended first.
5. Tested and rejected: switching to cancel-in-progress: false. A replay of the push times since 21 Nov gave the same median push-to-live wait (7.4 min either way) and a worse slowest-10% wait (15.3 vs 13.6 min).
6. Have the owner run /usage once to see what actually uses up their plan before changing habits. Primary source: code.claude.com/docs/en/best-practices says /usage 'breaks your usage down by skill, subagent, plugin, and MCP server'.
7. Move the start and finish routines into a project skill instead of CLAUDE.md, so they load only when used. code.claude.com/docs/en/costs: 'Move instructions from CLAUDE.md to skills ... those tokens are present even when you're doing unrelated work.'
8. Cache the new-avatar torso-socket bake by its own inputs. new-avatar takes 17-48 s per build and is the most-edited area (67 of 105 pushes). It is Claude's own area, so no coordination is needed. Not measured precisely.
9. Show 2-3 variants side by side, a method the owner already uses, together with the slider: the approved version stays visible beside the one being dragged.
10. A preview of the single-file built pages as a private Claude artifact, for a link in seconds. Not tested and Claude-only; it gives the owner a second place to look, so it is not recommended while the pipeline fix brings publishing down to about 2.5 min.
**Retest:** I worked only in (scratch folder, not saved) plan2/verify-timesavers. git status showed both repos untouched afterwards.

(1) I re-downloaded all 357 deploy.yml runs and the job steps for the 110 successful runs since 20 Nov. Confirmed: 293 success, 60 cancelled, 4 failed. Last-25 job median 546 s; racing-core 72 s, build 102 s, browser install 44 s, browser checks 290 s. Daily median publish time went from 0.3 min (16-17 Nov) to 10.3 min (23 Nov). The jump on 22 Nov came from the new browser-check step (job median 201 s on 21 Nov, 439 s on 22 Nov, 606 s on 23 Nov). 38 of the 60 cancellations were caused by a docs-only push, wasting 68 min (139 min in total). Pages deployment median 32 s over 60 runs.

(2) Parsed 6 CI logs. Racing suites were 93% of browser-check time; the Driving suite took 148-209 s and is growing. The foot, wrist and elbow labs took 72-97 s per build; new-avatar 17-48 s, growing.

(3) Rebuilt racing-lab at all 133 pushed commits since 20 Nov (git archive, read-only). The build is repeatable: it matched the committed page exactly. The racing page changed in only 10 of 105 pushes since 21 Nov. A fingerprint replay says the racing browser suites would run on 12 of 105 pushes and racing-core tests on 8. Comparing CI time over those 105 pushes: 956 min now, 382 min with the researcher's plan (I reran its own classifier and got the same 52 fast-path pushes), 214 min with fingerprints (74 of 86 code pushes on the about-2-minute path). Edit tests: a comment edit or an avatar edit left the fingerprint unchanged, a racing-core number change changed it, and reverting brought the old one back.

(4) The study labs' real inputs changed on 0 of 105 pushes, or 21 if package.json counts as an input. The elbow lab rebuilt in 46.6 s (30 s of it tests), byte-identical to the committed copy.

(5) racing-core tests: 285/285 pass in 102 s run one after another. They rewrite 2 committed report files with last-digit float differences.

(6) Playwright source: the 'tools' fonts are always installed. In the 832 s run's slow downloads, 209 of 775 s were fonts, 139 s WebKit-only packages and 427 s packages pulled in by others.

(7) A simulation of push-to-live wait showed cancel-in-progress false gives no median gain. With roughly 160 s runs, the median wait would be 2.7 min instead of the current 7.4 min.

(8) The old 3D-WORLD-3: npm ci, builds of about 1.4-1.6 s, island tests 18/18, garden tests 14/14. I measured the size of the code the report proposes to port, and found SM64 material already in 3D-World-4.

(9) Slider test in iPhone 13 emulation: lil-gui slider track 72 px; native full-width slider 242 px.

(10) Linted my draft workflow and the current deploy.yml with actionlint 2.0.6: no problems. Checked GitHub's docs on paths filters and concurrency, actions/cache lookup-only, Playwright's advice not to cache browsers, and the runner CPU count, all from raw GitHub sources. Checked Claude Code's /clear and skills guidance on code.claude.com.

Not tested: anything on real GitHub runners, a real iPhone or Safari, the GitHub Pages cache headers (proxy 403), or the Kenney, Quaternius and Poly Pizza licence pages (blocked). Kenney's own Starter-Kit-Racing README on GitHub does say its 3D models are CC0. I ran out of web searches partway through, so the later checks used direct fetches of primary sources only. All browser timings use a software GPU in Chromium and are not real-GPU or real-iPhone numbers.
**Improved recommendation:** Keep the researcher's order: fix the publish pipeline first, then the owner-facing habits, then porting. But change how the pipeline fix works.

Step 1, now (about 2-3 hours of assistant time, nothing for the owner to do; Claude drafts, Codex reviews because the racing checks are his):
(a) Pushes that change only notes stop publishing. README.md still triggers a publish because a test reads its links. This takes about 10 lines.
(b) Skip a slow check only when the exact page it checks has already passed once. After building, the workflow takes a fingerprint of the built racing page and its test files, and skips the 5-minute racing browser checks and the 72-second racing unit tests if that fingerprint already has a 'passed' record. No hand-kept list of 'racing files' is needed. Every published page has still passed its checks, so Codex's 'check before publishing' guarantee stays fully intact. A daily full run and a manual 'run everything' button act as the safety net. Over the 105 pushes since 21 November, this would have run the racing browser checks on only 12 pushes, against about 34 with the file-list approach.
(c) Reuse the frozen foot, wrist and elbow lab builds the same way, keyed only on their real source files. Since 21 November they would never have needed rebuilding.
(d) Install WebKit only when the racing checks run. If the random 12-minute install stalls keep happening, test the official Playwright container next.
Expected result: a typical avatar or world push publishes in about 2-2.5 minutes instead of about 9-10, and total CI time drops by about 78%. The owner asked about exactly this on 23 November ('why am i waiting ... 10 minutes').

Step 2, at the start of the miniature build: a build stamp written as a separate small file after the checks, never baked into the pages, plus a version tag on every link. Also a one-screen STATUS page instead of the 13,600-word HANDOFF as required reading, one chat per job, and one /usage check to see where the owner's usage actually goes.

Step 3, with the owner's approval: a tuning panel in Claude's own New avatar page first. It should have a big phone-sized slider with minus and plus buttons, a 'Back to approved' button and 'Copy for chat', with the approved version shown beside it. Also small, audited ports from 3D-WORLD-3 (kart get-in/out, mini-golf ball physics with its tests, the compact Canyon track method), each rewritten to keep game logic separate from drawing. Expect hours to days of savings, not weeks. Before any porting, the owner must decide on the SM64 question. 3D-World-4 already publishes an SM64-data walking reference, and its notes tell assistants to use it, which contradicts the 'never use SM64 data' rule if that rule stands.

Later: Codex speeds up the racing suites themselves (parallel jobs) for the pushes that do change racing; a data-driven island layout file, then a phone layout editor; CC0 props in the looks phase. Skip AI model generators, caching browser downloads, and switching off cancel-in-progress.

What would change this: if Codex's 6 new tracks make most pushes racing pushes, both approaches run the checks more often and the savings shrink to step (a), the lab caching and the parallel racing jobs. If the owner rarely waits for links, the gain is mostly CI time and assistant usage rather than owner hours.

## Planning method: research
**Question:** What is the best proven way to plan and sequence the LetsGo miniature version (one island with 6 tracks, a skate area and a practice field) so that something is always playable on the owner's phone, changes stay cheap, and Claude and Codex stay coordinated?
**Summary:** Recommendation: build one thin game that works end to end first, then grow it one area at a time. That first build is a single island page with a plain stand-in (a moving marker) and a menu or gates. After that, each area is added in rough grey-block form with its own pass/fail exit test, and polish waits until everything works. The first real area should be one short GoKart race. Racing is the only system with approved feel and engine-quality code, and my tests show its kart physics and the old race session run outside their lab with very little new code. Claude can build walking around the hub at the same time, so both assistants are busy from day one. Plan only the next two weeks in detail and keep the rest on a Now/Next/Later list. Keep the island layout, the track list, kart classes and tuning numbers in data files with on/off switches, so a change of mind means editing a value. Record every decision as a short entry marked current, on trial, or replaced; replaced entries are never deleted. The weekly rhythm is one go-ahead card on Monday and one playable phone link on Friday, plus a session with 2-5 trusted players at each milestone. The repo check found every file the plan expects to reuse. It also found three real gaps to plan for: computer karts never pass a stopped kart, karts on block ground pass through walls until the block adapter is built, and today's 6 m island is far too small to run on (a runner falls off in 0.77 s).

### Options

1. **A. Polished vertical slice first (one area at final quality)**
   - How it works: Pick one area (for example one kart track) and finish it to near-final quality (art, sound, feel) before starting any other area.
   - Pros: Shows the final look early and proves the whole pipeline from data to screen. Publishers ask for it for this reason.
   - Cons: It polishes things the owner is still changing: the avatar look is in progress and walking was removed on 20 Nov. It also delays the owner's main goal, which is everything working at small scale. Polish in one area gets redone once the other areas change shared systems.
   - Evidence: Unity Learn milestone course and Xsolla funding guide describe a vertical slice as a small part at final quality (https://learn.unity.com/tutorial/your-first-milestone-vertical-slice, https://xsolla.com/blog/funding-101-the-impact-of-the-vertical-slice). docs/game-dev/13-production.md A3 lists a vertical slice after the prototype. In docs/HANDOFF.md items 12, 22 and 42 the owner rejected avatar drafts, which shows looks are not settled yet.
   - Test result: Not tested: this is a process choice. The repo audit (T5) shows the art inputs are not ready for final quality: no approved walking, and the New avatar is about 509k triangles against the ~29k phone budget.

2. **B. Horizontal layers (build each system across all areas, then the next layer)**
   - How it works: Build all the physics for every area, then all the rules, then all the art, and so on, one layer across the whole game at a time.
   - Pros: Shared systems get designed once. Little rework inside each layer.
   - Cons: Nothing is playable for a long time. Mistakes in how layers fit together appear late. It goes against the owner's need to test on the phone often, and against 'keep the game playable every day' in 13-production.md B4.
   - Evidence: The Masaryk University PV266 course handout and the Game Developer Fragments of Him article define horizontal vs vertical slices (https://is.muni.cz/el/fi/jaro2018/PV266/um/PV266_-_Horizontal_and_Vertical_Slice_Descriptions.pdf, https://www.gamedeveloper.com/production/company-growth-and-the-development-approach-of-fragments-of-him). DORA's small-batches capability (https://dora.dev/capabilities/working-in-small-batches/, via search summary) says smaller batches shorten feedback time.
   - Test result: Not tested (process). The verified diagnostic already shows the cost of this path in the repo: about 18-20 separate lab pages, each with its own scene, camera and loop, and no first playable yet.

3. **C. Walking skeleton / thin hub first, then core-first areas in grey blocks (RECOMMENDED structure)**
   - How it works: Step 1: one island page that runs end to end: island drawn from a zone file, a spawn point, a marker you can move, Reset, and a gate or menu to each area. Step 2: add the most-ready core activity (a short kart race) as a complete loop: start, countdown, race, results, back to the hub. Step 3: add the other areas one at a time, rough and grey but fully working, each with an exit test. The hub stays a thin connector and is not polished first. Polish comes once everything works (13-production.md A5).
   - Pros: Something is playable on the phone from the first milestone, and every later step keeps it playable. It tests how the pieces fit together early. The block world already is the art style, so grey blocks look close to final, which keeps rework small. Both assistants can work in parallel from day one.
   - Cons: The early build looks plain. It needs discipline to stop the hub growing before the core areas work. Placeholder visuals need the owner's acceptance.
   - Evidence: Alistair Cockburn's 'walking skeleton' is a tiny end-to-end implementation linking all main parts (https://alistaircockburn.com/Bio, https://gojko.net/2014/06/09/forget-the-walking-skeleton-put-it-on-crutches/). A Game Developer article defines a horizontal slice as the minimum to play A to Z with rough content (Fragments of Him link above). Epic's greyboxing docs say to make a playable rough draft first and add art once it plays well (https://dev.epicgames.com/documentation/en-us/fortnite/greyboxing-in-unreal-editor-for-fortnite). Nintendo tested Mario 64 movement in a simple block room or 'garden' before the levels (https://sourcegaming.info/2017/06/21/15864/, https://www.nintendolife.com/news/2016/09/retro_freshly_translated_interview_with_miyamoto_delves_into_the_development_of_super_mario_64). Counter-evidence (https://www.gamedev.net/blogs/entry/2264142-prioritisation/): a team that built its hub and tutorial first said the core game 'suffered inattention'. That is why the hub stays thin and the core comes first. Wii Sports Resort put every sport on one island (Wuhu), treated almost as a character (https://iwataasks.nintendo.com/interviews/wii/wiisportsresort/0/1), which is the same shape as this miniature. 3D-WORLD-3's yard (docs/DECISIONS.md, 11 Nov) had tests read a list of named places, so 'moving a building moves its tests'.
   - Test result: Tested against the repo (T1-T6). T5: every file each milestone reuses exists: M0 18/18, M1 19/19, M2 8/8, M3 5/5, M4 7/7, M5 4/4, M6 4/4, M7 4/4. T2: the walk controller plus block collision work together with about 25 lines of glue (8/8 checks pass). T3: GoKart, GT and F1 prototype handling all drive on block ground through a one-line height adapter. T4: the old race session runs full races when imported from outside. T6: a zone file with on/off switches and named-place tests passes 6/6 checks.

4. **D. Toy box / garden first (build open-ended toys in a sandbox, add goals later)**
   - How it works: Make each mechanic a toy with no win or lose state (a ball you can bounce, a board you can ride) in a free sandbox, and add rules and goals only when the toy is fun.
   - Pros: Puts feel first, which the owner cares about. Cheap to change. The practice field already is a toy box by nature.
   - Cons: On its own it has no end-to-end loop (results, records, back to hub), so 'everything working' is never shown. It can drift without exit tests.
   - Evidence: Will Wright called himself a toymaker; his 'software toys' have no win or lose state (https://dl.digra.org/index.php/dl/article/download/2115/2114/2111, https://en.wikipedia.org/wiki/Will_Wright_(game_designer)). The Mario 64 movement garden is cited under C. Derek Yu, via a thread summary: 'non-dev feedback is usually the best way to find out if your core ideas are working' (https://www.gamedeveloper.com/design/-i-spelunky-i-designer-want-to-be-an-indie-then-learn-how-to-finish-games-reliably).
   - Test result: Not tested as a whole-project method. Used inside the recommendation: each practice station starts as a toy, then gets the trimmed template from MINIGAMES.md section A.

5. **E. Milestone gates with plain exit tests (Cerny's Method; first playable, alpha, beta; the racing-core gate table)**
   - How it works: Each milestone has a written list of proofs: automated checks plus what only the owner's eyes or phone can judge. The next milestone starts only after the owner approves at the gate. Early 'preproduction' continues until a first playable proves the core.
   - Pros: Already working in this repo: racing-core/PLAN.md's 'Sequence and approval gates' table drove Codex's sections 1 to 3 with the owner's Go at each gate. It matches HOW-TO B (wait for Go) and CLAUDE.md A5. It turns 'done' into pass or fail, which AI assistants need.
   - Cons: Gate paperwork can grow. Gates must be few and small: one per milestone, about one per 1-3 weeks, not one per file.
   - Evidence: Search excerpts of Cerny's Method slides: preproduction ends with a 'publishable' first playable and a macro design, and greenlight happens at first playable (https://www.slideshare.net/holtt/cerny-method; slideshare was blocked here, so this comes from search excerpts and is unverified). Insomniac's Ratchet & Clank postmortem: the first playable 'wasn't bad, it wasn't great either', so on 20 March 2001 they stopped preproduction and started over (https://www.gamedeveloper.com/game-platforms/postmortem-insomniac-games-i-ratchet-clank-i-, via search summary). For alpha and beta, the Cornell CS5152 milestone document and similar course pages say studios define the labels differently (https://www.cs.cornell.edu/courses/cs5152/2025sp/assignments/a4/). Claude Code best practices: 'Give Claude something it can run that comes back pass or fail', and 'Once SPEC.md exists... a written definition of done' (https://code.claude.com/docs/en/best-practices, fetched).
   - Test result: Exit tests for M0-M7 were written and checked against the repo in T5. The racing-core gate table (racing-core/PLAN.md lines 70-83) was read as the working local model.

6. **F. Rolling-wave planning with a Now / Next / Later roadmap**
   - How it works: Plan only the next one or two weeks in detail (Now). Keep the next milestones as short descriptions (Next) and everything after as a plain list (Later). Re-plan every week as facts arrive. Do not set fixed dates for Later.
   - Pros: Cheap to change your mind, which the owner asked for (HOW-TO E: nothing is a permanent rule). Keeps confidence honest: detailed where it is known, vague where it is not.
   - Cons: No firm finish date, so it needs a small, fixed scope (the miniature) to stay bounded. The 'Later' list must be pruned or it becomes a wish list.
   - Evidence: Wikipedia's rolling-wave planning article cites the PMBOK Guide 5th ed. section 6.2.2.2: near-term work is detailed and later work stays high level (https://en.wikipedia.org/wiki/Rolling-wave_planning). Janna Bastow (ProdPad) created Now-Next-Later as an alternative to timeline roadmaps that 'make promises product teams can't keep', with 'confidence horizons' (https://www.prodpad.com/glossary/now-next-later-roadmap/, https://www.prodpad.com/blog/invented-now-next-later-roadmap/). These are her own accounts, not independently verified.
   - Test result: Not tested (process). It fits the facts: docs/NEXT.md and docs/HANDOFF.md already mix state, ideas and decisions over 500+ lines, and no one-page plan exists.

7. **G. Time-boxed experiments with kill criteria**
   - How it works: Each risky unknown (skate grinding, ball rim bounces, getting NPCs around a stopped kart, adapting the old race session) gets a fixed effort limit, such as two working sessions. Before starting, write a 'state plus date' rule: if X is not working by then, switch to a named fallback.
   - Pros: Stops sunk-cost drift, the 'doesn't take years' risk. Makes changing course a planned, cheap event instead of a failure.
   - Cons: Needs honest measurement, and the owner must accept that some experiments get dropped.
   - Evidence: Annie Duke, Quit (2022): kill criteria combine a state and a date, set in advance, 'If by (date) I have/haven't (state), I'll quit' (https://knowledge.wharton.upenn.edu/article/its-not-you-its-your-goals-knowing-when-to-quit/). Supercell, 10 learnings in 10 years: 'When a project gets killed, we pop champagne... the learning that comes after'; 'We have launched 5 hit games but we have killed 30+' (https://supercell.com/en/news/10-learnings-10-years/7436/).
   - Test result: Applied to real unknowns found by testing. T4b: NPCs queued behind a parked kart never pass it (distance -4 m and -8 m after 200 s), so that becomes a time-boxed item in M1. T3b: a kart on block ground passes through a block wall and falls through the floor, so the kart block adapter is time-boxed and deferred.

8. **H. Lightweight decision records (ADR-lite) marked current / on trial / replaced**
   - How it works: One short entry per decision: date, the decision, status (current, on trial until a date, or replaced by D-xx), why (1-2 lines with an evidence link), where it lives (a config key or file), and how to undo it. Replaced entries stay and point to the newer one.
   - Pros: Makes changes cheap and visible ('why did this change?'). Matches HOW-TO E (record decisions with reasons, never lock the owner in). Both AIs read one place instead of rediscovering facts.
   - Cons: Needs the habit of writing a 3-line entry per decision. It must stay separate from the handoff/state notes or it bloats.
   - Evidence: Michael Nygard (2011) proposed short decision records with a status. Later write-ups add 'superseded', with a link to the replacement (https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions, blocked here; summarized by https://faq.arc42.org/questions/C-9-3/ and https://www.martinfowler.com/bliki/ArchitectureDecisionRecord.html). UK GDS: a superseded ADR 'must be clearly marked as superseded' (https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html). The old repo already used dated decision entries in 3d-world-3/docs/DECISIONS.md.
   - Test result: Not tested (documentation practice). Repo observation: decisions are currently spread across docs/HANDOFF.md (46+ numbered items, mostly avatar), docs/NEXT.md, docs/MINIGAMES.md, docs/WORLD-RULES.md and racing-core/PLAN.md.

9. **I. Data-driven config and a few feature flags**
   - How it works: Things the owner may change go in data, not code: zone positions and sizes, which zones are on, the track list, kart class to model and handling, station rules (laps, countdown, NPC count), tuning numbers, and avatar choice (marker, Game or New). A validator checks every layout. A few on/off flags (URL parameter or config) hide unfinished areas, and each flag has a 'remove by milestone' note.
   - Pros: Changing your mind is a one-value edit. Unfinished work can merge without breaking the playable build. Tests that read named places keep working when things move.
   - Cons: Flags left in too long add confusion. Data needs its own validator and tests.
   - Evidence: Pete Hodgson's feature toggle taxonomy, published on Martin Fowler's site and summarized via search (https://martinfowler.com/articles/feature-toggles.html; host blocked): release toggles should be short-lived and removed after release. Scott Bilas, GDC 2002, Dungeon Siege: 'data-driven' means 'no engineer required', and fixed code structures for game objects 'are all wrong' as designs change (https://www.sebaslab.com/wp-content/uploads/2022/07/data-driven-game-object-system1.pdf). Already partly done in this repo: motion-core/tuning.js and racing-core/kart/profiles.ts hold the numbers. racing-core/track/index.ts:6 hard-codes TRACK_IDS to 4 tracks, which is the main exception.
   - Test result: T6 prototype (zone file, validator, named places): 6/6 pass. Moving the practice field by editing 2 numbers still validates. The hoop test follows the move without being edited (hoop-to-gate distance 25.57 m before and after). An overlapping zone is rejected ('practice overlaps gt-a'). Turning a track off leaves a valid island. Turning the hub off is refused.

10. **J. Weekly playable builds and trusted playtests**
   - How it works: One playable link per week with a short 'what to try / what only your eyes can judge' list. The owner plays for 10-15 minutes and replies keep, change or drop per item. At each milestone gate, 2-5 trusted people play while the owner watches quietly and notes where they get confused.
   - Pros: Short feedback loops. Few links saves the owner's time (CLAUDE.md B3). Outside players find confusion the developers cannot see.
   - Cons: Weekly may feel slow when a fix is tiny; urgent fixes can still ship. Playtesters need the public link, and the repo is public.
   - Evidence: Valve tested Portal one week after starting, with one half-finished room. The Portal GDC 2008 postmortem: 'Watching a playtest exposes what isn't working' (https://cdn.fastly.steamstatic.com/apps/valve/2008/GDC2008_PortalPostMortem.pdf). A write-up of Valve's GDC 2009 playtesting talk describes repeated loops of about 1-2 weeks (https://game.watch.impress.co.jp/docs/news/080132.html). Nielsen: about 5 users find about 85% of usability problems; run several small rounds rather than one big one (https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/), with the noted limit that this holds for similar users. DORA: trunk-based development with small batches merged at least daily (https://dora.dev/capabilities/trunk-based-development/). 13-production.md B2 and B4.
   - Test result: Not tested (process). Repo facts: each publish waits 6-10 minutes, docs-only pushes still publish (.github/workflows/deploy.yml has no paths-ignore), and about 290 of 308 s of browser checks are racing suites (8 of the 11 suites in scripts/check-lab-foundations-browser.mjs are under racing-lab/).

### Tests run

1. **T1: are the modules to be reused free of three.js, so game logic stays separate from drawing?**
   - How: (scratch folder, not saved) plan2/method/t1-import-graph.mjs bundles 18 entries with the repo's esbuild (output only in scratch) and reads the import graph. Results are in t1-results.json in the same folder.
   - Result: 9 of 11 logic modules have no three.js: motion-core/controller.js, tuning.js, src/world/collision.ts, rulebook.ts, racing-core/kart/index.ts, track/index.ts, contacts/index.ts, the old prototype racing-core/index.js, and racing-core/testing/drive.ts. Two pull three.js: src/world/island/solid.ts and src/world/checker.ts. Both import solidWorld() from src/world/world.ts, which imports Mesh/Group from three; island/terrain.ts also imports Color from three. Fix: move isSolid/solidWorld/Part into their own file and replace Color with a small colour mixer. This is Claude's area under WORLD-RULES A1. It does not block anything, because Node can load three, but it is worth doing in M0.
   - Limits: This is a static import check, not a runtime check. Line counts are approximate (some racing files use very long lines).

2. **T2: can walking around the hub reuse motion-core/controller.js and VoxelWorld.moveBox with thin glue?**
   - How: (scratch folder, not saved) plan2/method/t2-t3-glue.mjs builds a 51.6 m flat block slab with a 3-block wall and a 10.75 cm kerb. It runs the unchanged controller and passes each fixed 1/120 s step through moveBox (0.25 m half-width, 1.8 m tall, 0.2 m step-up, placeholder gravity). Results are in t2-t3-results.json.
   - Result: All checks pass. The runner stops at the wall: z=8.349 m against a wall face at 8.600 m with a 0.25 m half-width, so no tunnelling. He stays at ground height (y=0.4300). He steps up the 10.75 cm kerb at a run. The path is identical at 30, 60 and 144 fps (spread 0 m). Cost is 174.5 microseconds per 1/120 s step on a desktop CPU. On today's 14x14-block island, a runner at full stick falls off the edge after 0.77 s, so the miniature needs a new, larger island.
   - Limits: Gravity is a placeholder, not an approved number. No jump yet, because the controller is flat-ground only. Desktop Node timing, not phone timing. No visuals and no feel judgement.

3. **T3: can racing-core karts drive on block ground with a tiny adapter?**
   - How: Same script. createKartController with world.heightAt mapped to VoxelWorld.groundBelow, for PROTOTYPE_HANDLING gokart, gt and f1, at full throttle for 2 s on the flat slab, plus a run that drives off the slab edge.
   - Result: All three stay grounded for 120 of 120 frames at y=0.43. Speed after 2 s from standstill: GoKart 13.74 m/s, GT 16.96 m/s, F1 20.81 m/s. Cost is 28-34 microseconds per 120 Hz tick per kart (desktop). Driving off the edge stays finite: the kart falls, with no exception.
   - Limits: Flat ground only. Desktop timing. These are prototype handling profiles, not the owner-approved 'Fast' feel.

4. **T3b: does a kart on block ground stop at a block wall without extra code?**
   - How: (scratch folder, not saved) plan2/method/t3b-wall.mjs runs a GoKart at full throttle into a 3-block-tall wall. A naive adapter returns null inside walls, because groundBelow returns the top of the cell containing the probe point, which can be above the kart's maximum. The first adapter attempt threw 'heightAt must return null or a finite height at/below maximum'.
   - Result: The kart passed through the wall (final z=23.98 m, wall face at 8.6 m) and fell through the floor (y=-21.0). This confirms the 'block adapter pending Claude' note in racing-core/PLAN.md section 3 is a real prerequisite wherever karts drive on block ground. Sequencing consequence: in M1, karts drive only on racing-core track geometry with its own rails (already working), and the block adapter waits until karts must drive on island blocks.
   - Limits: Naive adapter only. A proper adapter (wall contacts through resolveMotion) was not attempted.

5. **T4: does the old race prototype (session, progress, NPC drivers, ghosts) still run full races when imported from outside its lab?**
   - How: (scratch folder, not saved) plan2/method/t4-old-race.mjs imports /home/user/3D-World-4/racing-core/index.js read-only and runs 1-lap races on all 4 TRACK_IDS at 1/60 s. t4b.mjs diagnoses the result. I did not run the repo's own test:racing-core, because it writes racing-core/TEST-RESULTS.json into the repo.
   - Result: It runs. On every track, 2 NPCs finished one lap: Original (3,683 m) in 125.3 s, Skyline (4,513 m) 136.2 s, Suzuka (5,757 m) 162.8 s, Winding (6,635 m) 250.8 s. Cost was 5.4-8.3 s of CPU for ~597 s simulated. The other 2 NPCs were stuck behind the parked player for the whole run (distance -4 m and -8 m after 200 s). With the player holding throttle, all 4 NPCs finished (125.3-127.5 s). Finding: the old NPC driver cannot get around a stopped kart, so this goes into M1's exit test. A sibling run ((scratch folder, not saved) plan2/racing/race-adapter.json, not re-run by me) shows 5-kart, 3-lap races finishing on short tracks such as the 503 m Canyon (best laps about 48 s).
   - Limits: The old session uses the old track.js and vehicle.js, not the new kart/track modules. Adapting it is new work. Long tracks only in my run.

6. **T5: milestone-by-milestone reuse audit against the repo**
   - How: (scratch folder, not saved) plan2/method/t5-reuse-audit.mjs checks that every file each milestone plans to reuse exists, counts its lines, and lists what is new. Output is in t5-results.json. I also checked that racing-lab/src/main.js already runs the approved driving page inside motion-lab/src/page.js through its createSimulation hook.
   - Result: All reused files exist: M0 18/18 (~2,479 lines), M1 19/19 (~2,220), M2 8/8 (~745), M3 5/5 (~784), M4 7/7 (~1,099), M5 4/4 (~615), M6 4/4 (~1,565), M7 4/4 (~237). The new items per milestone are listed in the recommendation. The island page can follow the driving page's precedent (createSimulation inside page.js), which keeps CLAUDE.md rule 16.
   - Limits: File existence and line counts do not prove each module fits without changes. T2, T3 and T4 cover the riskiest fits.

7. **T6: is 'island layout as one data file, on/off flags, and tests that read named places' cheap and safe?**
   - How: (scratch folder, not saved) plan2/method/t6-zone-config.mjs: a zone list (hub, practice, skate, kart-a, kart-b, gt-a) with rectangles in 0.43 m blocks, a validator (inside the island, no overlaps, unique ids, a hub exists), named places, and a yard-style test. Results are in t6-results.json.
   - Result: 6/6 pass. Moving the practice field by editing 2 numbers still validates, and the hoop test follows it without being edited (25.57 m before and after). An overlap is caught ('practice overlaps gt-a'). Turning kart-a off leaves a valid island (hub and practice). Turning off the hub is refused.
   - Limits: Prototype only. Zone sizes are placeholders, not an island-size proposal; island size is a separate research topic.

### Recommendation
**Choice:** Use the walking-skeleton-then-areas structure (option C) together with E, F, G, H, I and J.

(1) Build order, each step playable on the phone:
- M0 is one island page (via page.js createSimulation, like the driving page). It shows a grey-block island read from a zone file, a spawn point, a placeholder marker, Reset, and a gate or menu per area.
- M1 is the first race: one short GoKart track on racing-core geometry, countdown, 3 laps against 4 NPCs, results, back to the hub, and a time-trial ghost.
- M2 is walking the hub: walk, run and jump on block ground with walls, steps and a respawn; walk into a gate to start an area; walk to the kart to Drive, and Exit when stopped (no animation yet). Claude builds M2 at the same time as M1.
- M3 is the first practice stations: the hoop and the soccer goal sharing one ball system.
- M4 is six tracks: 2 per class, one kart model per class, kart sizes agreed.
- M5 is a small skate area with a rideable board.
- M6 adds a tiny practice station for every other minigame, plus a yard-style obstacle strip.
- M7 is the miniature complete: everything reachable from the hub, records saved, phone budget met, trusted playtest. Swap the marker for the avatar only once walking is approved.

(2) Exit tests, in plain words:
- M0: the link opens on the owner's phone, the marker moves, Reset works, a zone turned off disappears with no errors, and all existing checks still pass.
- M1: from the hub, start Kart A; 3-2-1-go; all NPCs finish 3 laps, including getting around a stopped kart; results show places and times; Again and Back both work; the best lap is saved and its ghost replays; the same result at 30, 60 and 120 fps; the owner judges feel on the phone.
- M2: no passing through walls or falling through the floor; steps onto kerbs; falling off the edge respawns at the hub; Drive and Exit work.
- M3: hold for power and release, the ball bounces off rim or backboard and the score counts; the same ball scores in the soccer goal; no aiming line.
- M4: all 6 tracks have a finished race and a time trial.
- M5: push, ride a ramp, grind one rail, fall and get up.
- M6: every station can be played once with a score.
- M7: one session with no reload, records survive closing the page, and 2-5 playtesters' confusion list is triaged.

(3) Split:
- Codex: page shell and input plumbing, M1, M3 rules and ball system, M4, M6 rules, CI and release. The minigame and framework parts follow COLLABORATION.md's recommended (not confirmed) rows.
- Claude: world logic (rulebook, solid ground, checker, plus the zone validator and the three.js split), M2 movement (jump, gravity, collision, gates, drive/exit), the action interface for throws and kicks, the kart block adapter when needed, and the avatar swap.
- Skate (M5): proposed Claude-led, because it runs on block ground and the character controller that Claude owns, and it balances the workload; Codex reviews. The owner can switch this.
- Zone layout file: Codex builds worlds (WORLD-RULES A2); Claude's checker validates them (A1).
- One owner per file. Cross-area changes are announced first. The other AI reviews.

(4) Fixed vs config:
- Fixed (expensive to change): three.js 0.180 + TypeScript + Vite; fixed-step logic separate from drawing; the 0.43 m grid and the 26-block rulebook; the input contract in motion-lab/src/input.js; +Z forward, Y up, metres; one page and one loop; frozen checkpoints; the rigid ragdoll avatar.
- Config (one-value edits): the zone file (positions, sizes, on/off); track data files (replacing the fixed TRACK_IDS); kart class to model and handling; station rules (laps, countdown, NPCs, stroke limits); tuning files; avatar choice (marker, Game or New); quality tier; camera presets.
- Flags are few, each with a 'remove by milestone' note.

(5) Weekly rhythm:
- Monday: a one-page 'This week' card with at most 2 chunks per AI, each with its exit test. The owner's Go on the card is the Go (HOW-TO B).
- Tuesday to Thursday: small pushes, checks green, no mid-week links unless blocked (CLAUDE.md B9).
- Friday: one playable link with a 5-line 'try this / only your eyes can judge' list. The owner replies keep, change or drop.
- Weekend or Monday: the assistants update the records and Now/Next/Later, detailing only the next 2 weeks.
- At each milestone gate: 2-5 trusted players, watched quietly.

(6) Decision records: one docs/DECISIONS.md with D-numbered 3-line entries (decision, status current / on trial until X / replaced by D-yy, why plus evidence, config key or file, how to undo). docs/HANDOFF.md then holds state only. Each number-type decision points at its config key, so a change is one edited value plus one record line.
**Why:** It is the only combination that keeps a playable build from the first milestone, starts with the most-finished system, and makes the owner's changes of mind cheap. Racing is the most-finished system: racing-core is engine quality, the driving feel is approved, and T3 and T4 show it runs outside its lab with little glue. It keeps both assistants busy in parallel inside the ownership already confirmed in CLAUDE.md section C and COLLABORATION.md. It reuses the gate method that already works in racing-core/PLAN.md. It respects every confirmed decision, including rule 16, through the createSimulation precedent. The outside evidence points the same way: walking skeleton (Cockburn), greybox then art (Epic), the movement garden (Nintendo), the first-playable gate (Cerny, Insomniac), rolling wave (PMBOK) and Now/Next/Later (Bastow), kill criteria (Duke, Supercell), short decision records with superseded status (Nygard, GDS), data-driven design (Bilas), short-lived flags (Hodgson/Fowler), and small, frequent playtests (Valve, Nielsen).
**Confidence:** medium
**What would change it:** If the owner says walking around the hub (not racing) must be the first thing on the phone, swap the order of M1 and M2; the structure stays the same. If adapting the old race session onto the new kart/track modules runs past its time box (2 sessions), write a minimal new session on the new modules instead. If the island page outgrows page.js (HUD, menus, mode switches), propose a change to CLAUDE.md rule 16 to the owner instead of forking quietly. If real-phone measurements show the 120 Hz logic for walking plus 5 karts is too heavy, add a performance gate before M3. If the owner confirms different ownership for minigames or skate, re-assign those lanes.
**Conflicts with confirmed decisions:** No direct conflicts. Three points need care:
(a) CLAUDE.md rule 16 says every future page shares motion-lab/src/page.js. The island page follows this by using createSimulation, as racing-lab/src/main.js does for the approved driving page. A full game may later need its own shell, and that would need the owner to change rule 16.
(b) The owner-approved 'Fast' feel (checkpoints/driving-1 and driving-2) stays frozen. GoKart, GT and F1 on short tracks would use their own class profiles (gokart-prototype, gt3, f1-2026), and the owner judges that feel. Nothing approved is reshaped.
(c) The split for minigame systems, the Test Lab framework and release follows COLLABORATION.md rows that are recommendations, not confirmed. The skate assignment to Claude is a new proposal. Both need the owner's OK.

### Key numbers
1. Today's island is 14 x 14 blocks of 0.43 m (about 6 m). A runner at the 8.6 m/s top speed falls off its edge after 0.77 s (T2, t2-t3-results.json).
2. Walk controller plus block collision: 174.5 microseconds per 1/120 s step on a desktop CPU in Node (T2). Not a phone number.
3. Kart physics on block ground: 28-34 microseconds per 120 Hz tick per kart, desktop (T3). Speed after 2 s from standstill: GoKart 13.74, GT 16.96, F1 20.81 m/s (prototype handling, not approved feel).
4. Old race session, 1 lap with NPCs: Original 3,683 m in 125.3 s; Skyline 4,513 m in 136.2 s; Suzuka 5,757 m in 162.8 s; Winding 6,635 m in 250.8 s. 5.4-8.3 s of CPU per ~597 s simulated (T4, t4-results.json).
5. NPCs queued behind a parked kart stayed at -4 m and -8 m after 200 s; with the player moving, all 4 NPCs finished 125.3-127.5 s (T4b).
6. A kart driving into a 3-block block wall at full throttle passed through (final z 23.98 m vs face 8.6 m) and fell to y=-21.0 (T3b).
7. Logic modules free of three.js: 9 of 11; src/world/island/solid.ts and src/world/checker.ts pull three via src/world/world.ts and island/terrain.ts (T1, t1-results.json).
8. Reused files that exist per milestone: M0 18/18, M1 19/19, M2 8/8, M3 5/5, M4 7/7, M5 4/4, M6 4/4, M7 4/4 (T5, t5-results.json).
9. Zone-file prototype: 6/6 checks pass; moving a zone by 2 numbers leaves its test valid (25.57 m hoop-to-gate before and after) (T6).
10. 8 of the 11 browser suites run before publishing are under racing-lab/ (scripts/check-lab-foundations-browser.mjs lines 12-22). The workflow (.github/workflows/deploy.yml) has no paths-ignore, so docs-only pushes publish.
11. racing-core/track/index.ts line 6 fixes TRACK_IDS to 4 tracks ('original','skyline','suzuka','winding').
12. Nielsen: about 5 similar users find about 85% of usability problems in a round (nngroup.com article, via search summary).
13. Supercell: '5 hit games... killed 30+' (supercell.com 10 learnings post, via search summary).
14. Sibling result, not re-run by me: a 5-kart, 3-lap GoKart race finished on the 503 m Canyon track, best laps about 48 s ((scratch folder, not saved) plan2/racing/race-adapter.json).

### Time savers
1. Start with racing. It is the most-finished system: approved feel, and engine-quality code that runs outside its lab (T3, T4). The first playable loop needs the least new code here.
2. Run two lanes in parallel from day one: Codex builds the first race while Claude builds walking around the hub. Both are needed, and neither blocks the other.
3. Stop making separate lab pages per feature. Build one island page (createSimulation in page.js) and add areas as entries in a zone file. The repo already has about 18-20 separate pages, each with its own scene and loop.
4. Grey-block everything first. The block world already is the art style, so rough areas look close to final and rework is small. Polish comes last.
5. Keep karts on racing-core track geometry, which already has rails and contacts. Defer the kart-on-blocks adapter until karts must drive on island blocks (T3b).
6. Do not block the practice stations on avatar animation. Launch the ball from the placeholder marker first. The owner's avatar polish continues in parallel, and the marker is swapped for the avatar by one flag when walking is approved.
7. Ask Codex (default release coordinator) to skip publishing on docs-only pushes (paths-ignore for docs/** and *.md) and to run the racing browser suites only when racing files change. 8 of the 11 browser suites are racing, and docs-only pushes currently trigger a full 6-10 minute publish. Caveat: path-ignored required checks can block pull requests; whether this workflow is a required check was not verified.
8. Send one playable link per week instead of many small review links. This saves the owner's time and attention (CLAUDE.md B3).
9. Turn each exit test into an automated pass/fail check where possible (Claude Code best practices: 'Give Claude something it can run that comes back pass or fail'). The owner's phone time is then spent only on feel and looks.
10. Reuse proven designs from 3D-WORLD-3, with approval to port: Codex's 503 m Canyon Switchbacks as a kart-track candidate, the letsgo-island get-in/get-out-of-kart flow (apps/letsgo-island/src/island-kart.js), the mini golf ball code (apps/letsgo-garden/src/mini-golf.js), and the yard's named-places testing (src/world/Course.ts).
11. Use a 'state plus date' kill rule for every risky experiment: skate grinding, ball rim physics, NPCs getting around a stopped kart, and adapting the old race session. Each gets 2 sessions, then a named fallback.

### Risks
1. The hub's feel depends on walking, which the owner rejected and removed on 20 Nov. Mitigation: a placeholder marker plus a flag; do not let any area wait on the avatar.
2. CLAUDE.md rule 16 may not fit a full game shell long-term (HUD, menus, mode switches). Raise it with the owner before forking page.js.
3. Two AIs editing the same island page file at once would cause merge conflicts. Mitigation: one owner per file, each area in its own module registered in the zone file, and shared interfaces changed only after announcing.
4. The old NPC driver cannot get around a stopped kart (T4b). Races with crashes or a parked player will stall until this is fixed.
5. Karts on block ground pass through walls and floors until the block adapter exists (T3b). Any plan that has karts drive across the island on blocks must budget for it.
6. World logic is partly tied to three.js (T1). This is minor but grows if not split early.
7. Scope creep: 20 minigames could become 20 full games. Mitigation: each practice station gets the trimmed template and a time box, and 'Later' is pruned weekly.
8. Owner feedback cadence: each publish takes 6-10 minutes, and the owner often reads while driving. Too many links or long reports waste their limited time.
9. The kart size disagreement (F1 2.9 m vs 4.6 m) must be settled before M4, or track widths and the camera will be redone.
10. All performance numbers here are desktop Node or SwiftShader. Real iPhone Safari numbers can differ a lot and only the owner's phone shows them.
11. Several primary sources could not be opened from this session (slideshare.net, cognitect.com, gamedeveloper.com, martinfowler.com, dora.dev and docs.github.com did not resolve). Those points come from search-result summaries and are marked as such; they need those hosts allowed to verify.

### Owner taste questions
1. What do you want to play first on your phone: (a) a short kart race on the island (recommended: the racing engine and your approved driving feel already exist, so it comes soonest), or (b) walking around the island hub with a plain stand-in marker?
2. Until you approve walking for the avatar, how should the player look on the island: (a) a plain stand-in marker (recommended; it matches the 'placeholders until controls pass' rule), or (b) the Game avatar shown in a standing pose that slides along without a walk animation?
3. How do you want to review: (a) one bigger playable link each week with a short checklist (recommended, saves your time), or (b) a link after every small piece of work?
4. Who are 2-5 trusted people (family or friends) who could try the miniature at each milestone while you watch, and is it okay to send them the public link?
5. GoKart feel on the short tracks, once you have driven both: (a) your approved Fast feel adjusted for small tracks, or (b) the separate GoKart prototype handling? (This is a feel judgement only you can make.)

## Planning method: skeptic
**Holds up:** False
**Confidence:** medium

### Problems

1. **The first milestone breaks a recorded owner decision. M1 is built on the old race prototype: the T5 M1 reuse list is racing-core/session.js, progress.js, driver.js and ghosts.js, plus a 'race session adapter'. The fallback ('if adapting runs past 2 sessions, write a new session') turns the owner's decision upside down. The report also says 'No direct conflicts', which is wrong.**
   - Evidence: racing-core/PLAN.md, 'Owner direction and approvals': '**Rejected as the new foundation:** extending/tuning the earlier racing prototype. Its existing demo stays available while replacement layers are reviewed.' The same file says the old index.js, track.js and vehicle/session modules are 'the superseded prototype, not dependencies of this rebuild'.
   - Fix: Build race rules, computer karts and ghosts new, as racing-core sections 4, 5 and 6 of the existing gate table, each with its own Go. The old files are reference only, and porting needs the owner's OK. List this as a conflict to respect.

2. **The main reason given for racing first ('approved feel') does not carry over to the proposed M1. The approved 'Fast' feel is 180 mph on 26 m wide circuits 3.7 to 6.6 km long. A 'short GoKart track' would use the gokart prototype handling, which the owner has not approved, and that track does not exist yet (TRACK_IDS is fixed to the 4 long circuits).**
   - Evidence: V2 (my test): Fast tops out at 80.5 m/s (180 mph) and needs 9.27 s and 411 m of straight to reach 95% of that. The gokart prototype tops out at 68 mph and needs 5.82 s and 100 m. HANDOFF line ~147 records Fast as approved at 180/220 mph. racing-core/track/index.ts line 6 fixes TRACK_IDS to original, skyline, suzuka and winding.
   - Fix: Say it plainly: the engine is ready, but on a short track the feel is not approved. Make the first race loop a time trial on an existing approved circuit with the existing code (see the next problem). Once the island-scale decision is made, the owner judges GoKart feel on the first short track.

3. **M1 is far too big for one milestone. It packs a new track format, authoring a new track, race rules (section 4), computer karts (section 5), ghosts (section 6), a HUD and results, and the return to the hub into one gate. The report's own rule is 'small chunks', and the racing gate table asks for one section per Go.**
   - Evidence: racing-core/PLAN.md gate table: sections 4 'Race rules', 5 'Computer opponents' and 6 'Ghosts and time trials' are each 'Not started; requires go'.
   - Fix: Split it. M1 becomes a time trial, which is approved minigame card #2 in docs/MINIGAMES.md. Racing against computer karts becomes its own later milestone, built new.

4. **The report missed that the new racing modules already have most of a time-trial loop and already accept a world that is not one of the 4 tracks. That makes a time trial the cheapest complete loop, not a full race against computer karts.**
   - Evidence: racing-core/testing/drive.ts already gives a lap clock (racing-core/testing/prototype-laps.ts: running, elapsed, last, best, laps, valid) to the gokart, GT and F1 prototypes, and it lets you pick a world that is not a track (NEIGHBORHOOD_WORLD, built from heightAt and surfaceAt). V4 (my test): a simple scripted driver did 2 full laps of the Original circuit using only these new modules. GoKart prototype best lap 146.95 s, GT prototype 120.08 s. No old prototype code was used.
   - Fix: M1 = time trial: start it from the island menu, countdown, 3 laps, best lap saved, results, back to the island. Ghost replay is section 6. The island can be added as another world choice next to Neighborhood, which is Codex's precedent.

5. **The claim that computer karts 'never pass a stopped kart' is overstated. It came only from the starting grid, where two karts sit 4 m and 8 m directly behind a parked kart.**
   - Evidence: V1 (my test): I reproduced the grid case (npc-2 at -4 m, npc-4 at -8 m). With the stopped kart moved out onto the track, all 4 computer karts got past it in 4 of 6 positions. In the other 2 they stalled: 0 of 4 passed at 400 m in lane 3.3, and 1 of 4 at 400 m in lane 0.
   - Fix: Reword it as: the old driver is unreliable around stopped karts (it stalled in 3 of 7 setups). This matters little, because section 5 builds new computer karts anyway. Keep 'gets around a stopped or crashed kart' as an exit test for that milestone.

6. **The weekly rhythm (Monday card, Friday link, 'no mid-week links') does not match how this project actually runs, and it misreads a rule.**
   - Evidence: Read-only git log: commits per day from 17 to 23 Nov were 82, 71, 83, 40, 47, 78 and 20, made in 13 to 19 different hours each day, every day. CLAUDE.md B9 says 'No live updates while working'. That is about progress messages, not test links. CLAUDE.md A3 asks for a working test at each useful milestone.
   - Fix: Use a rhythm based on chunks. A chunk ends with one link when its checks pass, with at most one bundled link per day and 3 to 5 'try this' lines. Once a week, refresh the one-page Now/Next/Later. Keep a Go for each chunk, which costs the owner one word.

7. **Risks are left until late. The island scale and whether existing tracks are reused (which decides everything else) are only handled at M4. The phone performance budget is only checked at M7, even though 13-production.md B6 says to measure on the weakest device early.**
   - Evidence: V2: the 4 approved circuits have bounding boxes of 36.6, 40.1, 195.2 and 65.5 hectares, 337 ha in total (Suzuka alone is 2,043 x 956 m). D2 forbids shrinking approved parts to make them fit. So 'reuse the approved circuits' versus 'build new short tracks' changes the island by orders of magnitude.
   - Fix: Put both decisions into M0. Ask the owner the reuse-versus-short-tracks question before any track work. Add a short phone stress test in M0: a large empty island plus one kart on the owner's iPhone, where the owner judges smoothness. Repeat it at every milestone, not only at the end. This follows risk-first ordering (Boehm's spiral model, from prior knowledge).

8. **M6 ('a tiny station for every other minigame') has no real limit. Several of those minigames need systems that do not exist yet.**
   - Evidence: docs/WORLD-RULES.md section B lists 22 entries, including skiing, ice skating race, swimming (lazy river), diving, long and high jump, and messing around (which needs the hit system and balance). Section C lists shared ball, hit and rod-grip systems, none of them built.
   - Fix: Split the stations into batches by shared system. Ball batch: hoop, soccer, football throw, bowling, skee-ball, mini golf, batting. Aim batch: darts, archery, frisbee. Body batch: jumps, obstacle strip. Terrain batch: ski, ice, swim, diving. The owner decides which batches belong in the miniature. Give each batch an effort limit and a cut list.

9. **The plan changes a saved owner template without flagging it.**
   - Evidence: docs/MINIGAMES.md section A is marked 'Shared template (all minigames) — saved, 19 Nov', with lobby, NPCs, own gear, finish timer and more. The report gives practice stations a 'trimmed template (no lobby/NPCs)' and lists no conflict.
   - Fix: Ask the owner one purpose question: do practice stations follow the full template, or a lighter 'practice version' (just play and score)? Record the answer as a decision.

10. **M2 packs several new movements into one gate, which goes against a confirmed owner rule. Avatar actions in the practice field are further away than the plan suggests.**
   - Evidence: docs/HANDOFF.md 'Confirmed by the owner' 1: 'Add one movement at a time... Walking and running come back in place first. Move on only when the owner says it looks good.' HANDOFF confirmed item 5: the ragdoll avatar is central to 'throws and shots that look unlike other games'.
   - Fix: Split M2 into steps, each with its own owner gate. (a) The marker walks and runs on blocks, with walls, steps and respawn. (b) Jump and fall. (c) Walking into a gate starts an area. (d) Getting in and out of the kart, as a snap. Say clearly that the miniature can be 'complete' with the marker, and that avatar actions (throw, kick, ride) arrive later as their own owner-gated steps.

11. **The skate lead is inconsistent within the report, and it differs from the recommended split without saying so.**
   - Evidence: The T5 script lists M5's lead as 'proposed: Codex board physics (vehicle-like), Claude rider balance later'. The final recommendation says 'Skate (M5): proposed Claude-led'. COLLABORATION.md recommends Codex for 'New minigame rules and gameplay systems', and skate racing is minigame B22.
   - Fix: Default to a joint item. Codex builds the board physics, which works like a vehicle. Claude builds the rider's balance and pose, plus the block-ground adapter that both karts and boards need (T3b). The owner can reassign.

12. **The plan ignores work already in progress. Codex has an owner-authorized chunk that hasn't started, and Claude is partway through the owner's avatar polish list. The plan gives both assistants new lanes without deciding what goes first.**
   - Evidence: docs/HANDOFF.md, Codex driving handoff: 'The owner authorized the next controls and isometric-view chunk... No implementation for that chunk has started.' docs/AVATAR-POLISH-LIST.md: the polish is in progress and the owner runs it.
   - Fix: Make Codex's authorized controls chunk the first item in Codex's lane, since phone controls matter for playability. Ask the owner one priority question: while the time trial is built, should Claude pause avatar polish to build marker walking, or keep polishing?

13. **The time-saver of running racing browser checks only when racing files change is risky as worded. The suite count is also slightly off.**
   - Evidence: scripts/check-lab-foundations-browser.mjs lines 12-22: 11 suite runs, 9 of them under racing-lab/ (8 distinct files, because home-screen-browser.mjs runs once in Chromium and once in WebKit), not 8 of 11. app-browser.mjs and home-screen-browser.mjs test the driving page as an installed app, and that page runs inside the shared motion-lab/src/page.js. An island page built on page.js makes this coupling bigger. deploy.yml has no paths-ignore and also runs on pull_request (PRs do not publish).
   - Fix: Recommend paths-ignore for docs/** and *.md on push, which is safe and stops docs-only publishes. Any filter on the racing suites must also include the shared paths: motion-lab/src/**, src/input*, scripts/test-browser.mjs, package*.json and vite.config.ts.

14. **There is no overall time limit, even though the owner's main constraint is 'small enough that it doesn't take years'. Rolling-wave planning with no dates can quietly grow.**
   - Evidence: The owner's request (relayed): 'we can do it small enough or however big enough, that way this doesn't take years.' The report's option F says 'Do not set fixed dates for Later.'
   - Fix: Add appetites in the style of Shape Up (Basecamp, from prior knowledge; basecamp.com was blocked here). Give each milestone a fixed effort budget plus a cut list ('if we run out, drop X first'). Ask the owner for one overall budget for the miniature, which is a purpose question.

15. **Some of the test evidence is weaker than it is presented.**
   - Evidence: T5 only checks that files exist. It counts deploy.yml, the browser test runner and docs/MINIGAMES.md as 'reused modules', and its M1 list includes the rejected old modules. T6's validator was written to pass its own 6 checks. T2's '0.77 s' includes falling 1 m. V3 (my test): the island is 6.0 x 6.0 m, and from the centre the runner reaches the edge in 0.48 to 0.61 s (0.43 s from the researcher's start point).
   - Fix: Describe T5 and T6 as sanity checks, not proof of fit. The real evidence of fit is T2, T3, T3b, T4 and my V4. Report the edge time as about 0.4 to 0.6 s.

### Factual errors
1. 'No direct conflicts' is false. racing-core/PLAN.md records 'Rejected as the new foundation: extending/tuning the earlier racing prototype', and M1 reuses and adapts session.js, progress.js, driver.js and ghosts.js.
2. 'Racing is the only system with approved feel' is used to justify an M1 on a short GoKart track. The approved feel is Fast: 180 mph, on the 4 long circuits. A short GoKart track would use the unapproved gokart prototype handling (68 mph top speed in V2).
3. '8 of the 11 browser suites are under racing-lab/' should be 9 of 11 suite runs (8 distinct files; home-screen-browser.mjs runs twice) in scripts/check-lab-foundations-browser.mjs lines 12-22.
4. 'Computer karts never pass a stopped kart' is overstated. In V1 they passed in 4 of 6 positions out on the track and stalled in 2. The 'never' result came only from the starting grid.
5. 'No mid-week links unless blocked (CLAUDE.md B9)' misreads B9, which says 'No live updates while working'. It is about progress messages, not test links.
6. 'racing-core/track/index.ts:6 hard-codes TRACK_IDS... the main exception' is only partly true. racing-core/testing/drive.ts already accepts a world that is not a track (NEIGHBORHOOD_WORLD), and prototype-laps.ts already gives a lap clock on the new modules.
7. 'A runner falls off the edge after 0.77 s' is the time to fall 1 m below the ground. The centre point reaches the edge after 0.43 s from the researcher's start point and 0.48 to 0.61 s from the island centre (V3). The conclusion (the island is too small) still holds.
8. The skate lead in the recommendation (Claude) contradicts the researcher's own T5 script (Codex board physics, Claude rider).

### Missed options
1. Shape Up appetites and a 'circuit breaker' (Basecamp, Ryan Singer, 2019): fixed time with variable scope, and work that misses its budget is not extended by default. This fits 'doesn't take years' better than milestones with no limit. From prior knowledge; basecamp.com could not be reached here, so it was not re-verified.
2. Risk-first ordering (Boehm's spiral model, IEEE Computer 1988): settle island scale and track reuse, and run a phone performance spike, in week one instead of at M4 or M7. From prior knowledge.
3. Time trial as the first complete loop. It is approved minigame card #2, and most of its code already exists on the new modules (drive.ts plus prototype-laps.ts; V4 completed laps). This is cheaper than racing against computer karts.
4. Reusing the existing racing gate table (racing-core/PLAN.md sections 4-8) as the racing part of the miniature plan, instead of a new M1 that packs several sections together.
5. Adding the island as another driving world next to Neighborhood (Codex's existing precedent in racing-core/testing/neighborhood.ts), instead of a new track data format for the first loop.
6. Grouping practice stations by the shared system they need (ball, aim, body, terrain), and letting the owner choose which groups are in the miniature.
7. Limiting work in progress to one active chunk per assistant (Kanban-style), which matches the small-batch evidence the report already cites. From prior knowledge.
8. Spec-first chunks for AI assistants: a short written spec with pass/fail acceptance checks for each chunk, which extends the Claude Code best-practices point the report already cites.
**Retest:** I worked only in (scratch folder, not saved) plan2/verify-method. I imported repo files read-only, bundled them with the repo's esbuild into my own out/ folder, and wrote nothing to either repo.

V1 (v1-npc-midtrack.mjs, v1-results.json): I reproduced the researcher's grid stall (npc-2 at -4 m, npc-4 at -8 m after 200 s). Then I moved the stopped player out onto the Original circuit. All 4 computer karts got past it at 400 m lane -3.3, 1200 m lane 0, 2000 m lane -3.3 and 2800 m lane 3.3. They stalled at 400 m lane 3.3 (0 of 4 passed) and 400 m lane 0 (1 of 4). Conclusion: the old driver is unreliable, but 'never' is wrong.

V2 (v2-reach-footprint.mjs, v2-results.json): Bounding boxes of the approved circuits: Original 698x525 m (36.6 ha), Skyline 487x824 m (40.1 ha), Suzuka 2043x956 m (195.2 ha), Winding 865x757 m (65.5 ha), 337.4 ha in total. On flat open ground at full throttle: approved Fast reaches 180 mph, and 95% of that after 9.27 s and 411 m. Gokart prototype: 68 mph, 5.82 s, 100 m. GT prototype: 120 mph, 8.62 s, 262 m. F1 prototype: 180 mph, 9.27 s, 411 m. createDrivingTest gives the gokart, GT and F1 prototypes a lap clock (running, elapsed, last, best, laps, valid) with 0 opponents, and the Neighborhood world can be picked.

V3 (v3-island-hub.mjs, v3-results.json): today's island measures 6.0 x 6.0 m (14 blocks). The runner's centre point reaches the edge in 0.48 to 0.61 s from the island centre, and 0.43 s from the researcher's start. The runner reaches 95% of run speed in 0.26 s over 1.1 m, and the stop slide after a long run is 1.98 m.

V4 (v4-time-trial.mjs, v4-results.json): using only the new modules (drive.ts plus prototype-laps.ts) and a 15-line scripted steering function, 2 full laps of Original were recorded. GoKart prototype best 146.95 s, GT prototype best 120.08 s. No old prototype code was used.

Repo checks: confirmed TRACK_IDS at racing-core/track/index.ts line 6. Confirmed deploy.yml has no paths-ignore and also runs on pull_request without publishing. Confirmed 11 suite runs, 9 under racing-lab/. Confirmed racing-lab/src/main.js uses createMotionLab's createSimulation. Confirmed src/world/checker.ts and island/solid.ts reach three.js through world.ts. Confirmed HANDOFF items 12, 22 and 42 (avatar rejections and corrections). Confirmed the PLAN.md 'Rejected as the new foundation' line, MINIGAMES A 'saved, 19 Nov', HANDOFF confirmed item 1 ('one movement at a time'), and the authorized but unstarted Codex controls and isometric chunk. Git cadence (read-only git log): 20 to 83 commits a day from 17 to 23 Nov, in 13 to 19 different hours each day.

Not re-verified: none of the researcher's web sources (Cerny, Insomniac, Valve, Nielsen, Supercell, Duke, GDS, Bastow, Bilas, Hodgson). My web search budget was used up (a shared limit of 200 per turn), and basecamp.com, cdn.fastly.steamstatic.com and supercell.com did not resolve from this session. Those points still rest only on the researcher's own search summaries.

Limits: all timings were measured in desktop Node, not on a phone. The scripted driver is crude, so its lap times are not real player times. Process advice cannot be proven by tests.
**Improved recommendation:** Keep the researcher's basic structure. That means one thin island page first, then one area at a time in grey blocks, each with plain pass/fail exit tests, and tuning in data files. It also keeps Now/Next/Later planning, effort limits with kill rules, and short decision records marked current or replaced. Change the order, the size of the first steps, and the rhythm, as follows.

A. Order. Each step is playable on the phone, and each needs its own Go.
1. M0, island page plus the decisions everything depends on. One island page, built through page.js createSimulation the way the driving page is, so CLAUDE.md rule 16 is kept. It reads a zone file, shows a placeholder marker that moves, has Reset, and has a menu for each area. In the same step the owner answers three purpose questions (section F). Also run a phone stress test (a large empty island plus one kart), where the owner judges smoothness. Exit test: the link opens on the owner's iPhone, the marker moves, an area switched off disappears without errors, and all existing checks still pass.
2. M1, time trial (approved minigame card #2). Codex finishes the controls and isometric chunk the owner already authorized, then builds the time trial. Start it from the island menu, countdown, 3 laps, best lap saved, results, back to the island. It runs on one existing approved circuit, or on the first new short track once island scale is decided, using only the new racing modules. The lap clock already exists in racing-core/testing/drive.ts and prototype-laps.ts, and my test completed laps with it. Ghost replay follows as racing section 6. The old session, driver and ghost files are reference only, because the owner rejected building on the old prototype.
3. M2, marker walks the hub (Claude, alongside M1). Each step gets an owner gate, following the confirmed rule of one movement at a time: (a) walk and run on blocks with walls, steps and respawn; (b) jump and fall; (c) walking into a gate starts an area; (d) get in and out of the kart, as a snap with no animation.
4. M3, first practice pair: a hoop and a soccer goal sharing one ball system, with the ball launched from the marker.
5. M4, kart race against computer karts: racing sections 4 and 5, built new. Exit test: every computer kart finishes 3 laps, including getting past a stopped or crashed kart.
6. M5, all six tracks (2 per class). This waits on the island-scale decision and on agreeing kart sizes. Approved circuits are never shrunk to fit (D2).
7. M6, skate area. Codex builds the board physics, Claude builds the rider and the block-ground adapter, and the owner can reassign.
8. M7, practice stations in batches by shared system: ball games, aiming games, body games (jumps and an obstacle strip). The terrain games (ski, ice, swim, diving) come only if the owner keeps them in the miniature.
9. M8, miniature complete: a full session with no reload, records survive closing the page, phone check passes, and 2 to 5 trusted people play while the owner watches. The miniature counts as complete with the marker. Avatar actions arrive later as their own owner-gated steps.

B. Effort limits. Every milestone and every risky experiment (ball rim bounces, skate grinding, computer karts getting around wrecks, the kart-on-blocks adapter) gets a fixed effort budget and a written cut list ('if we run out, drop X first'), in the style of Shape Up's appetites. The owner sets one overall budget for the miniature.

C. Split. Codex: page shell and input, racing (M1, M4, M5), ball and minigame rules, CI and release. Claude: world checker and zone validator, marker movement (M2), the block-ground adapter, the action interfaces for throws and kicks, and the later avatar swap. Skate is joint. The minigame, framework and skate assignments follow rows in COLLABORATION.md that are recommendations, not confirmed, so the owner needs to OK them. Each file has one owner. Cross-area changes are announced first, and the other assistant reviews.

D. Fixed versus changeable. Fixed: the confirmed tech stack, logic kept separate from drawing, the 0.43 m grid and rulebook, the input contract, one page and one loop, frozen checkpoints, approved part sizes, and the saved minigame template unless the owner approves a 'practice version'. Changeable in data: zone positions, sizes and on/off switches; the track list; kart class to model and handling; station rules; tuning numbers; avatar choice; quality tier. Keep feature switches few, each with a 'remove by milestone' note.

E. Rhythm. This matches the measured pace of 20 to 83 commits a day, every day. Each chunk ends with a link once its checks pass, at most one bundled link per day, with 3 to 5 'try this / only your eyes can judge' lines. The owner replies keep, change or drop. The Go stays per chunk. Once a week, refresh a one-page Now/Next/Later. Trusted playtests happen at M1, M3 and M8 only.

F. Records and quick wins. Add one page, docs/MINIATURE-PLAN.md, written in the owner's lettered-sections style. It holds Now/Next/Later, the milestone table with exit tests and effort budgets, and short D-numbered decision entries from now on. Old history is not moved. racing-core/PLAN.md stays the racing gate record. Ask Codex to add paths-ignore for docs/** and *.md on push, so docs edits stop triggering 6 to 10 minute publishes. Only filter the racing browser suites if the filter includes the shared files (motion-lab/src/**, input, test-browser, package and vite config).

G. Owner questions, all about purpose or taste. (1) GT and F1 tracks: reuse the four big approved LetsGo circuits (nothing new to build, but the island becomes kilometres wide), or build new short tracks (more building, small island)? (2) How long are you willing to spend on the miniature before starting the big world? (3) Which minigames must have a practice station in the miniature, and can skiing, ice skating, swimming and diving wait? (4) Do practice stations use the full saved minigame template, or a simple 'just play and score' version? (5) While Codex builds the time trial, should Claude pause avatar polish to build marker walking, or keep polishing? Keep the researcher's questions on placeholder looks, trusted testers and GoKart feel. Drop the weekly-versus-every-change question: per-chunk links with a daily cap answer it.

## Draft plan from this research (to be redone with the owner's ideas)
**Headline:** Build one island of about 430 x 335 m (about 14 hectares). The F1 circuit runs around the edge. The GT and GoKart circuits, the practice field, the skate spot, the obstacle strip and the hub all sit inside it. Fix the slow publish pipeline first. Then put a bare island page on the phone and build a GoKart time trial and marker walking at the same time. After that, add one fully working area at a time in grey blocks. Nothing waits for the avatar: a plain marker and a 'Go to' menu stand in until walking is approved.

### Island
**Size:** Plan for about 430 x 335 m (about 14.4 hectares, about 1,000 x 780 blocks of 0.43 m). That size fits medium-width roads (GoKart about 13 m, GT about 17 m, F1 about 20 m) in the tested layout. The size follows the road width the owner picks after driving a test loop on the phone. Narrow roads (about 10 / 13 / 15 m) shrink it to about 390 x 300 m (11.6 ha), the tightest layout that passed every check. Today's approved 26 m roads grow it to about 480 x 375 m (18 ha). For scale, the whole island is smaller than the old Original Circuit alone (669 x 496 m). The four existing long tracks (3.7 to 6.6 km) are kept for the later big world, not shrunk.
**Layout strategy:** A nested 'racing park' with no bridges or tunnels. The F1 circuit rings the island. The F1 Grand Prix track is the full ring (about 1.15 km), and F1 Sprint is the south loop via a cut road (about 0.88 km). The GT circuit sits in the north infield and the GoKart circuit in the south infield. Each class keeps its own roads, which respects KARTS.md A3 ('each mode has its own tracks'). Each class's two tracks share part of one road, the way Silverstone's National and Grand Prix layouts do. All the non-racing areas sit inside the loops: practice field A, the skate spot and the obstacle strip inside the GT loop; the hub, the pond and practice field B beside the GoKart circuit. Every area is one entry in a single layout data file and is drawn as one merged mesh. Its physics only runs when the player is near. Moving the hoop or the skate spot is a one-line edit, and an automatic checker rejects overlaps, roads through areas, and anything outside the island. Every area is within about 30 s of running from the hub, and a 'Go to' menu reaches each one instantly. The ground is one height map painted with the approved block materials and drawn as stepped blocks. It keeps the block-world look at low cost. Real blocks are used only for built things (ramps, rails, goals, walls, sheds). Roads are smooth ribbons, which WORLD-RULES F3 allows. The approved 14 x 14 block island and checkpoints/island-1 stay exactly as they are.

#### Zones

1. **F1 circuit (ring)**
   - Purpose: F1 Grand Prix (full ring) and F1 Sprint (south loop through a cut road)
   - Footprint: Around the whole island edge, inside a 4 m runoff and 6 m beach. GP about 1,150 m, Sprint about 880 m. Corner radius at least about 30 m.
   - Contents: Start/finish with checkered blocks, start lights, curbs, outer-only rails or grass runoff as per-track options

2. **GT circuit**
   - Purpose: GT Long (with a technical hairpin section) and GT Short (through a middle cut)
   - Footprint: North infield. Long about 800-1,000 m, Short about 530 m. Corner radius at least about 16 m.
   - Contents: Road, curbs, start line. Practice field A, the skate spot and the obstacle strip sit inside its loop.

3. **GoKart circuit**
   - Purpose: GoKart Long and GoKart Short, sharing a hairpin section; smaller with sharper turns (KARTS.md A3)
   - Footprint: South-west infield. Long about 540 m, Short about 460 m. Corner radius at least about 9-12 m.
   - Contents: First track to be built. Candidate: the old Canyon Switchbacks layout trimmed to about 40 s laps, if the owner approves porting it.

4. **Hub / spawn plaza**
   - Purpose: Start point, 'Go to' menu board, records board, one kart pad per class, gates into each area
   - Footprint: About 40 x 50 m, south-east infield
   - Contents: Spawn point, menu board, kart pads (get in/out as a snap at first), records board

5. **Practice field A**
   - Purpose: Ball, aiming, table and hit-with-a-tool stations
   - Footprint: About 100 x 60 m inside the GT loop. Stations cover about 26% of it in the tested packing, which leaves room for changes.
   - Contents: First pad: futsal goal with a hoop right beside it (about 16 x 14 m). Later: football throw lane, frisbee basket, archery lane, golf range and batting cage (netted, with a carry-distance readout, because this field is inland, not at the sea), bowling lane, and an arcade shed for darts, skee-ball and billiards.

6. **Practice field B**
   - Purpose: Body and ride stations
   - Footprint: About 60 x 46-50 m beside the hub (about 56% used in the tested packing)
   - Contents: Long jump and high jump, an ice loop (about 24 x 12 m), a ski slope on a 6-8 m mound (about 15 x 40 m), and a paintball gallery

7. **Skate spot**
   - Purpose: Small skate plaza and the skate race start
   - Footprint: Zone about 35 x 40 m. The plaza itself is about 40 x 28 blocks (17 x 12 m), on a concrete pad shared with the obstacle strip.
   - Contents: Stage 1: kicker, ledge, low box, flat rail, board pickup pad. Stage 2 (optional): mini ramp.

8. **Obstacle strip**
   - Purpose: Yard-style warm-up run (steps, gaps, balance beam, bouncy pad, timer, checkpoints)
   - Footprint: Zone about 45 x 40 m. The run itself is about 24 x 8 m.
   - Contents: Waits for jump and gravity. Falling costs nothing (the old yard rule).

9. **Pond**
   - Purpose: Water rule test, optional diving board later
   - Footprint: About 30 x 40 m beside the hub
   - Contents: Water blocks only at first

10. **Sea and beach**
   - Purpose: Island edge, respawn rule for falling off
   - Footprint: About 6 m beach outside the F1 runoff, then sea
   - Contents: Falling into the sea respawns at the hub, or at the last checkpoint in a race
**Ascii map:** Tested arrangement (layout S2b), drawn at its tight 390 x 297 m size. The reserved 430 x 335 m version has the same arrangement with wider roads and gaps.
1 column = 5 m, 1 row = 10 m, north is up.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~............................................................................~
~.....ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff.....~
~...ff..................................................................ff...~
~...f......GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGgggggggggggggggggggg......f...~
~...f....GGG.......................RRRRRRR....GG..................ggg....ff..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...RRRRRRR.....GG...................g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...RRRRRRR......G...................g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...RRRRRRR......G...................g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...OOOOOOOOO....G......gggggg.......g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...OOOOOOOOO....G.....gg....gg......g.....f..~
~...f....G..PPPPPPPPPPPPPPPPPPPP...OOOOOOOOO...GG.....g......g......g.....f..~
~...f....GG........................OOOOOOOOO...G......g......g.....gg.....f..~
~...f.....GGGGGGGGGGGGGGGGGGGGSGGGGGGGGGGGGGGGGGgggggg........gggggg......f..~
~...f.....................................................................f..~
~...f..FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...f..~
~...fFFF..............................................................FFF.f..~
~...FF....KKKKKKKK........KKKKKKKKkkkkkkkk....WWWWWW.......HHHHHHHH.....FFf..~
~...F....KK......KKK....KKK......KKK.....kkk..WWWWWW.......HHHHHHHH......FF..~
~...F....K.........K....K..........K.......k..WWWWWW.......HHHHHHHH.......F..~
~...F....K.........K....K..........K.......k..WWWWWW.......HHHHHHHH.......F..~
~...F....K.........KK..KK..........K.......k..QQQQQQQQQQQQ.HHHHHHHH.......F..~
~...F....K..........KKKK...........K.......k..QQQQQQQQQQQQ................F..~
~...F....K.........................K.......k..QQQQQQQQQQQQ................F..~
~...F....K........................KK......kk..QQQQQQQQQQQQ...............FF..~
~...F....KKKKKKKKKKKKKKKSKKKKKKKKKKkkkkkkkk...QQQQQQQQQQQQ...............F...~
~....FF................................................................FF....~
~.....FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFSFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.....~
~............................................................................~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Key: f = F1 road used only by the Grand Prix; F = F1 road also used by the Sprint; G / g = GT road shared by both tracks / Long only; K / k = GoKart road shared / Long only; S = start line; H = hub; P = practice field A (ball, aiming, table and tool stations); Q = practice field B (jumps, ice, ski mound, paintball); R = skate spot; O = obstacle strip; W = pond; ~ = sea; . = grass.

#### Scale rules
1. 1 block = 0.43 m. Heights and small parts snap to quarter-block cells of 10.75 cm, so a real 3.05 m rim lands at 3.01 or 3.12 m.
2. Road widths are whole blocks, kept as data per class. Narrow set: 24 / 30 / 34 blocks (10.3 / 12.9 / 14.6 m). Medium set (planning default): about 30 / 40 / 46 blocks (12.9 / 17.2 / 19.8 m). Wide set: about 38 / 52 / 60 blocks (16.3 / 22.4 / 25.8 m), close to today's 26 m roads. The owner's phone drive picks one set.
3. Tracks are sized by lap time, not by fixed metres. Target 30-40 s per lap for every class (30-45 s acceptable), which gives about 2-minute 3-lap races. Starting lengths: GoKart about 500-600 m, GT about 800-1,000 m, F1 about 1,000-1,250 m.
4. Minimum corner radius, checked automatically: GoKart 9-12 m, GT 14-16 m, F1 18-30 m. Gap between different circuits: both half-widths plus 8 m. Road to any area: at least 4 m. Every road gets 4 m of runoff, and the island edge gets 6 m of beach.
5. Practice gear is real size but only one of each (one hoop, one lane, one goal), so each station can later grow into the full game without a rebuild.
6. Skate pieces use one block-fitted quarter pipe, 4 x 3 blocks (radius 1.79 m, 74 degree lip). Ramps are at least 12 blocks wide. The plaza is about 40 x 28 blocks.
7. Every area is reachable from the hub within about 30 s of running at 8.6 m/s, and always instantly through the 'Go to' menu.
8. Provisional phone budgets, to be confirmed on the owner's iPhone. At most about 100 draw calls including the shadow pass. About 300k visible triangles while exploring, about 400k in an 8-kart race. Pixel ratio 1.5 (Low 1, High 2). No shadow maps in races on the phone; blob shadows instead. No post-processing. Fog, with the far plane at about 800 m (the island diagonal is about 545 m). Near plane at least 0.1 m.

### Tracks

1. **Item 1**
   - Class: GoKart
   - Track: GK-Long
   - Length m: about 540 (range 500-600)
   - Width m: chosen by the phone test: 10.3 narrow / 12.9 medium (8.6 m, the old Canyon width, is also testable)
   - Lap target: 30-40 s
   - Notes: The first track built (M2). Sharp turns, as KARTS.md A3 asks. Candidate: the old Canyon Switchbacks layout (502.7 m, 8.6 m road, ten 9 m hairpins). Today's GoKart drives it cleanly but laps it in about 50-57 s, so drop 2-4 hairpins to get near 40 s. That needs the owner's porting approval. In the tested layout, GK-Long gave 38.8-43.3 s with a scripted driver on flat ground; real players will differ.

2. **Item 2**
   - Class: GoKart
   - Track: GK-Short
   - Length m: about 460
   - Width m: same as GK-Long (shared road)
   - Lap target: 30-40 s
   - Notes: A shorter layout on the same road as GK-Long, sharing its hairpin section. Until it is built, GK-Long driven in reverse can stand in, if the owner accepts that. Reversed layouts tested within 1% of forward lap times.

3. **Item 3**
   - Class: GT
   - Track: GT-Long
   - Length m: about 800-1,000
   - Width m: 12.9 narrow / about 17.2 medium
   - Lap target: 35-42 s
   - Notes: North infield, with a technical hairpin section and a straight of about 200 m. The GT profiles reach roughly 95-115 mph here. The tested version (803 m) gave 39.6-44.2 s scripted.

4. **Item 4**
   - Class: GT
   - Track: GT-Short
   - Length m: about 530 (stretch toward 600 if laps feel too short)
   - Width m: same as GT-Long
   - Lap target: about 30 s
   - Notes: The GT-Long road with a middle cut. It tested at 26-29 s scripted, on the short side. The authoring tool's lap prediction will show whether 1-2 extra corners are needed.

5. **Item 5**
   - Class: F1
   - Track: F1-GP
   - Length m: about 1,150 (range 1,000-1,250)
   - Width m: 14.6 narrow / about 19.8 medium
   - Lap target: 30-40 s
   - Notes: The full ring around the island edge. With the approved Fast feel it laps in 26.9-30.9 s scripted, about 42 s with the f1-2026 tune. On these straights (about 280-290 m) the F1 peaks near 135 mph, about 175 with nitro, not its 180 mph top speed. That is an owner taste decision.

6. **Item 6**
   - Class: F1
   - Track: F1-Sprint
   - Length m: about 880
   - Width m: same as F1-GP
   - Lap target: about 30 s
   - Notes: The south loop through the cut road. It tested at 21.8-25.4 s with the Fast feel, which is short. Adding 2-3 corners in the same space fixes that. Phase-1 stand-in: F1-GP reversed.

### Stations

1. **Item 1**
   - Minigame: 1 Kart racing
   - Station: No field station. Raced on the 6 island tracks: time trial first, then races against computer karts.
   - Batch: M2 / M5 / M6
   - Footprint: the tracks
   - Shared system: racing-core (unchanged handling profiles)

2. **Item 2**
   - Minigame: 2 Time trial
   - Station: Time-trial mode on every track: 3 timed laps, best lap saved, ghost replay, bronze/silver/gold target times
   - Batch: M2 (ghost replay in M5)
   - Footprint: the tracks
   - Shared system: racing-core lap clock and ghosts

3. **Item 3**
   - Minigame: 6 Basketball
   - Station: One hoop at real height on a post right beside the soccer goal, with a ball rack. Challenge: the card's own 60-second round (2 points close, 3 behind a short arcade line).
   - Batch: M4 (first station, the owner's own picture)
   - Footprint: shares one pad of about 16 x 14 m with the soccer goal
   - Shared system: ball system (rim ring, backboard, two-level 'came down through the rim' scoring)

4. **Item 4**
   - Minigame: 8 Soccer penalties
   - Station: Futsal-size goal (3 x 2 m, a real regulation goal) beside the hoop. Challenge: the card's own 5 kicks against a simple scripted diving goalie.
   - Batch: M4
   - Footprint: same pad as the hoop
   - Shared system: ball system (posts, crossbar, net, whole-ball-over-the-line rule)

5. **Item 5**
   - Minigame: 7 Football throwing
   - Station: Lane with barrels at 8 / 14 / 20 m (a sliding target later). Challenge: the card's own 60 s round.
   - Batch: Batch 1
   - Footprint: 6 x 25 m
   - Shared system: ball system

6. **Item 6**
   - Minigame: 13 Skee-ball
   - Station: One machine in the arcade shed. Challenge: the card's own 9 balls.
   - Batch: Batch 1
   - Footprint: 2 x 5 m
   - Shared system: ball system plus ring score table

7. **Item 7**
   - Minigame: 12 Frisbee golf
   - Station: One basket about 24 m from a tee. Challenge: basket in 3 throws.
   - Batch: Batch 1
   - Footprint: 4 x 26 m
   - Shared system: ball system with glide (lighter gravity plus curve)

8. **Item 8**
   - Minigame: 10 Archery
   - Station: Lane with targets at 10 / 15 / 20 m against a backstop. Challenge: the card's own 10 arrows.
   - Batch: Batch 2
   - Footprint: 4 x 22 m
   - Shared system: ball system in cheap straight-line 'ray mode', with stick-on-hit and ring scores

9. **Item 9**
   - Minigame: 11 Darts
   - Station: Board on the arcade-shed wall, 2.37 m throw line. Challenge: the card's own 10-dart quick mode.
   - Batch: Batch 2
   - Footprint: 2 x 3.5 m
   - Shared system: ray mode plus dartboard score table

10. **Item 10**
   - Minigame: 21 Paintball
   - Station: Shooting gallery with scripted pop-up targets behind block cover. Challenge: 10 hits in 30 s.
   - Batch: Batch 2
   - Footprint: 8 x 15 m
   - Shared system: ray mode (fast sticky pellets)

11. **Item 11**
   - Minigame: 3 Mini golf
   - Station: 3 short holes like the old garden hole. Challenge: par 2 on each hole.
   - Batch: Batch 3
   - Footprint: 12 x 7 m
   - Shared system: 3D ball system with cup capture (port of the old 77-line mini-golf code and its tests, if approved)

12. **Item 12**
   - Minigame: 14 Billiards
   - Station: One 7-foot table in the shed. Challenge: trick rack, sink 3 in 5 shots.
   - Batch: Batch 3
   - Footprint: 5.2 x 4.2 m
   - Shared system: 2D rolling-disc system with 8 substeps

13. **Item 13**
   - Minigame: 5 Bowling
   - Station: One full-length lane, 10 pins. Challenge: 1-3 frames, spare or strike.
   - Batch: Batch 3
   - Footprint: 24 x 2.5 m
   - Shared system: 2D rolling-disc pins with a canned topple. A physics engine (Rapier, or Jolt/Havok) only if the owner says the pins look fake.

14. **Item 14**
   - Minigame: 9 Baseball batting
   - Station: Netted batting cage with a scripted pitching machine, distance readout. Challenge: the card's own 10 pitches scored by zone.
   - Batch: Batch 4
   - Footprint: 5 x 24 m
   - Shared system: ball system plus a moving bat collider (timing swing first)

15. **Item 15**
   - Minigame: 4 Full golf
   - Station: Range tee hitting into a tall net, with a carry-distance and 'would have landed on green' readout (the field is inland, not at the sea). Challenge: 2 of 5 on target.
   - Batch: Batch 4
   - Footprint: about 6 x 40 m including a net lane
   - Shared system: ball system with drag and spin, timing swing

16. **Item 16**
   - Minigame: 15 Obstacle course
   - Station: Yard-style warm-up run with steps, gaps, balance beam, bouncy pad, timer and checkpoints. Challenge: beat 30 s with no falls.
   - Batch: Batch 5 (after jump and gravity are approved)
   - Footprint: 24 x 8 m run inside the 45 x 40 m obstacle zone
   - Shared system: marker/avatar movement plus scripted moving platforms

17. **Item 17**
   - Minigame: 16 Long jump and high jump
   - Station: Runway with sand pit, and a high-jump area with a rising bar. Challenge: beat your distance or height.
   - Batch: Batch 5
   - Footprint: 30 x 3 m plus 10 x 8 m
   - Shared system: marker/avatar movement

18. **Item 18**
   - Minigame: 20 Skate racing
   - Station: Timed line through the skate spot and island paths, with a ledge grind shortcut. Challenge: beat 40 s.
   - Batch: M7 stage 1
   - Footprint: skate plaza plus island paths
   - Shared system: board vehicle plus race checkpoints

19. **Item 19**
   - Minigame: 18 Ice skating race
   - Station: Frozen loop with a timing gate. Challenge: lap under a target time.
   - Batch: Batch 6 (last, first to cut if time runs short)
   - Footprint: 24 x 12 m
   - Shared system: ride mode, expected to reuse the board-vehicle approach (not tested)

20. **Item 20**
   - Minigame: 19 Skiing
   - Station: Short slope on a 6-8 m mound with 5 flag gates and a scripted conveyor lift. Challenge: all gates under a target time.
   - Batch: Batch 6 (last, first to cut)
   - Footprint: 15 x 40 m
   - Shared system: ride mode on a smooth surface (WORLD-RULES F3 allows smooth surfaces for ski runs)

21. **Item 21**
   - Minigame: 17 Diving
   - Station: Not a minigame (owner, 19 Nov). Optional diving board at the pond.
   - Batch: Later
   - Footprint: at the pond
   - Shared system: none yet
**Skate park:** A small street-style skate spot first, with a mini ramp second. The plaza is about 40 x 28 blocks (17 x 12 m), the size of a real small skate spot. It sits on one concrete pad with the obstacle strip, inside the GT loop.

Stage 1 needs no curved pieces. It has a 1:2 wedge kicker (0.86 x 0.43 m) with clear landing room, a one-block ledge (6 blocks long), a half-block box (0.215 m, like a real 9-inch grind box), a flat rail, and a board pickup pad. Stage 1 is everything skate racing needs.

Stage 2 is optional and the first thing to cut if time runs short. It adds one mini ramp made of two block-fitted quarter pipes (4 x 3 blocks each, about 12 blocks wide). By default it uses game-style airs: you always drop back into the ramp, like Tony Hawk. The smooth quarter-pipe piece is new to the block shape list, so it is shown to the owner first.

Skateboarding is a hand-written 'board vehicle' with no physics engine. The avatar is posed on it like sitting in a kart, so skating does not wait for walking. It rides on the island's own ground query, extended with wedge and quarter-pipe shapes that return a height and a slope.

The move set is short:
- push (it must also work while rolling backwards)
- lean to steer, and brake
- one-button ollie of about 0.7 m (0.6 m left honest timing windows of only about 0.1 s at 4 m/s)
- automatic grind on blocks marked grindable, with grind friction of about 0.06 g
- simple air spin
- fall and quick get-up
- respawn if you fall off the world

Flip tricks, grabs, manuals and bowls come later. The test page offers two touch layouts for the owner to pick from.

Required automated checks before the owner sees it:
- honest ollie windows, with collision checked on the landing step too
- grinds exit cleanly
- 10 or more back-and-forth mini-ramp passes
- no falling forever

Ollie size, airs (game or realistic), automatic or button grinds, and landing forgiveness are all settings the owner can flip on the test page.

### Tech decisions

1. **Item 1**
   - Topic: Where the island page lives
   - Decision: Build the island page inside the shared lab shell (motion-lab/src/page.js) through its createSimulation hook, the same way the approved driving page already works. Import the shared input and page-lifecycle files unchanged. Move to a separate game page only if the shell gets in the way.
   - Why: It keeps CLAUDE.md rule 16 to the letter and needs almost no new shell code. The hook already lets a page supply its own camera, update, after-frame and pause steps. Every page keeps the same controls.
   - Confidence: medium
   - Revisit when: HUD, menus and switching between walking, kart and station modes outgrow the shell, or the iPhone test shows the shell's hard-coded preserveDrawingBuffer:true costs frame rate. Then propose relaxing rule 16 to the owner.

2. **Item 2**
   - Topic: Island size and layout
   - Decision: Use the nested racing-park arrangement (layout S2b) and reserve about 430 x 335 m. No bridges. Each class gets its own road network, and each class's two tracks share part of that road. Road widths and corner points are data.
   - Why: It passed an automatic geometry check and a real-physics lap test with racing-core's own karts. It is 43% smaller and needs 35% less road than six separate tracks. It respects KARTS.md A3. The tightest 390 x 300 m version only works with narrow roads and no spare room. An independent check showed medium roads need about 430 x 335 m, and 'just widen the roads' costs 24-56% more area, not 5%.
   - Confidence: medium
   - Revisit when: The owner picks a road width after the phone drive, or picks a different form for the second track per class.

3. **Item 3**
   - Topic: Racing engine for the six tracks
   - Decision: Keep racing-core as it is: every handling profile, the frozen Fast feel and the 4 reference tracks stay unchanged. Add the small track-loading fix (createTrackFromBlueprint) plus the testing/drive.ts type fix, and run every racing suite and all four type-check projects. Store island tracks as data.
   - Why: Tested: 70 of 70 laps on five new short tracks with every class, zero falls, and identical lap times at 30 / 60 / 120 / 144 fps. The patch passes 80 of 80 track, contact and course checks. As first written it broke one testing check, which the type fix solves. Track size per class, not retuning, controls lap time, because karts rarely reach top speed on island tracks.
   - Confidence: high
   - Revisit when: The owner drives a class on a short track and finds it twitchy or brake-heavy (the Fast feel spends 39-43% of a small-track lap braking).

4. **Item 4**
   - Topic: Track authoring
   - Decision: One method: a list of named corner points made into a smooth closed curve (centripetal Catmull-Rom, the same type the original LetsGo tracks used). An automatic validator checks minimum radius, overlaps, road width, footprint and shortcuts across the grass. It also prints the predicted lap time, top speed and braking share for each class. A 'pieces' converter is used only if the Canyon Switchbacks port is approved.
   - Why: It uses the existing blueprint format, so the track code, lap clock, contacts and renderer work unchanged. The validator is required: an early draft hid a 4.98 m corner. Size checks plus lap predictions run in about 7 s in Node, before any 6-10 minute publish.
   - Confidence: high
   - Revisit when: The owner wants to drag track points on the phone (a later editor writing the same file).

5. **Item 5**
   - Topic: Race rules, computer karts and ghosts
   - Decision: Write a fresh race module in strict TypeScript (racing-core PLAN sections 4-6). It covers start lights, ordered checkpoints, 3 laps, wrong-way warning, respawn at the last checkpoint, standings, a finish timer, and a nitro limit (default: the proposed 3 charges of 2 s, settled with Codex). The old progress.js and ghosts.js serve only as the written guide and a test oracle. Computer karts steer toward a point ahead on the road and follow a speed table computed once per track, with easy, medium and hard settings. A true racing line comes later. Off-road grass copies the existing Neighborhood test world: smooth road, slower grass, a padded road lookup, and per-track rail options.
   - Why: racing-core/PLAN.md records building on the old prototype as 'Rejected as the new foundation'. The old rules still work as a specification: they ran 8 of 8 five-kart, 3-lap races on new tracks through an adapter. The engine allows unlimited boosts (16 in one lap), so races need a limit. Precomputed speed tables cut AI cost from about 550-800 to about 20-27 microseconds per tick.
   - Confidence: medium
   - Revisit when: Codex, who owns racing, prefers another structure, or the owner wants mystery boxes earlier than card 1.2's 'after the avatar visuals'.

6. **Item 6**
   - Topic: Ground and collision
   - Decision: Use one height map for the whole island, stored in typed arrays (height plus approved block material per cell). Walking, kart height and ball rolling all read it. racing-core road triangles sit on top of it. Real blocks are only for built features. Widen the block-collision key with a one-line change instead of separate local block worlds. Put flat floors (field, skate pad) in the height map, not in blocks.
   - Why: Today's block store cannot hold even an 86 m layer (122 MB). A Map hits its size limit at about 600 x 600 blocks. Blocks beyond about 440 m from the centre create 'ghost walls'. A one-line wider key fixed that out to about 7 km (tested). A height map for 1.5 km costs 9-37 MB with queries of about 13-44 ns. A 30 m block floor alone costs 17 MB.
   - Confidence: high
   - Revisit when: The big world needs more than about 7 km, or overhangs and caves on the island ground.

7. **Item 7**
   - Topic: Ground look
   - Decision: Default: a stepped block look built from the same height map (merged flat faces, walls only where columns differ), with smooth roads and the 26 approved materials.
   - Why: It keeps the confirmed 'world built from 0.43 m blocks' look. A merged stepped island costs about 0.5-0.95 million triangles even at 1.5 km, about the same as smooth ground, so the choice is about looks, not cost. Drawing the island block by block with today's mesher would be about 574 triangles per square metre, which is impossible.
   - Confidence: medium
   - Revisit when: The owner prefers smooth rolling ground, or off-road karts feel too bumpy on steps.

8. **Item 8**
   - Topic: Drawing on the phone
   - Decision: Merge each area into one mesh with a shared vertex-colour material. Use InstancedMesh only for static repeated props. Bake each kart into one mesh per material at load. Draw drivers' rigid parts with BatchedMesh: set frustumCulled=false on the object and keep per-part culling on. If BatchedMesh is slow on the iPhone, bake each computer kart's seated driver into its kart; the player's own avatar always stays fully jointed. Load the whole island at start and wake each area's physics by distance. No streaming in the miniature.
   - Why: Draw calls, not island size, decide CPU cost. Separate meshes reached 845-1,233 calls in the overview, while per-area merging stayed at about 12-47. An 8-kart grid went from 245 to 19 calls. InstancedMesh drivers drew about 200k wasted triangles when karts spread out. Building a whole test island took under 1 s at 4x CPU slowdown, while streaming chunks during play stalled up to about 40 ms.
   - Confidence: medium
   - Revisit when: The iPhone budget page shows BatchedMesh or InstancedMesh is slow in Safari, or the frame rate misses target at these budgets.

9. **Item 9**
   - Topic: Physics for balls, pins and props
   - Decision: Version 1 uses no physics engine. One hand-written 3D ball system covers anything thrown, kicked, shot, putted or hit. It ships with the four tested fixes: two-level hoop scoring, push-out from block walls in every direction, straight-line 'ray mode' for arrows, darts and pellets, and the exact gravity formula. A small 2D rolling-disc system handles billiards and bowling pins. Rapier (rapier3d-compat 0.21.0, plain build) is added only if the owner says the scripted bowling pins look fake. It would be loaded only on that station, behind one game-level module, with a voxels ground collider, warm-up, rolling damping and one world per page, and compared with Jolt and Havok on a real iPhone. Ragdoll hits are decided when the hit system is built (Rapier with a tested joint helper, or Jolt).
   - Why: The ball system runs at microseconds per step and scores correctly from 3-14 line station files. The independent check found and fixed real bugs: false baskets on about 3 in 10 scores from low shots, balls passing through block walls, and arrows costing 30-40x more than needed. Current Rapier adds about 1.2-1.65 MB gzipped. Its JavaScript joint limits have traps, and a first joint use froze up to 341 ms at 4x slowdown. The tested physics engines cost about the same as each other, roughly 150-200x more than the 2D pins.
   - Confidence: high
   - Revisit when: The owner judges the pins fake, or the hit and ragdoll system starts after balance work.

10. **Item 10**
   - Topic: Practice stations
   - Decision: Each station gives free play plus one short challenge with bronze, silver and gold medals and a saved best score. Where a minigame card already has a short solo round, that round is the challenge. One challenge runner, one aim-and-power input module with three phone styles (flick, pull back and release, timing meter), and per-station camera presets. Stations are data. Every station first works with the marker standing still and the ball launched from its hand; throw, kick and swing motions come later. Loose balls you can carry around wait until walking and picking up exist.
   - Why: Short challenges are a proven single-player pattern (Mario Kart World missions, Tony Hawk goal runs, the Wii Sports Resort 3-Point Contest, Rocket League training packs). Using the card's own round means each game keeps one set of rules that grows into the full game. MINIGAMES A14 says the owner picks controls after testing, and A15 says no aiming lines.
   - Confidence: medium
   - Revisit when: The owner wants full rules for some games sooner, or one input style suits every station.

11. **Item 11**
   - Topic: Skateboarding
   - Decision: A hand-written fixed-step board vehicle on the island ground query (height, slope and grindable flag), with no engine. Build it in stages: street pieces first, mini ramp second.
   - Why: Tested: a height-query board matched the more complex surface board on the recommended ramps and kicker, and it shares one query with walking, karts and balls. The kart's own ground model cannot ride ramps. Rapier bounced, flipped and gained energy on ramps.
   - Confidence: medium
   - Revisit when: True vertical walls, wallrides or loops are wanted (then add the signed-distance surface layer), or phone tests show the timing windows are too strict.

12. **Item 12**
   - Topic: Avatar movement (parallel lane, not blocking the miniature)
   - Decision: Each movement is a few key poses stored as foot and hand targets plus body height, baked densely (48-120 samples per cycle) into clips on the existing motion-core pose player. Leg timing is driven by distance travelled. The foot-planting solver is used only for ramps, steps and sharp turns. First settle the 6 ft 4 in bone lengths and joint ranges with the owner. Port the owner's own letsgo-racing clip baker if approved. Use Mesh2Motion CC0 clips as drafts. No Mixamo, motion matching or physics-driven animation in version 1.
   - Why: One engine for every movement ends the cycle of a new algorithm per movement (walking was rebuilt 5-7 times). Densely baked clips kept heel and ball within about 1 mm on flat ground without an extra solver. Planted feet at 8.6 m/s are possible with quick steps or long bounding hops, which keeps the owner's 20 Nov decision (NEXT.md 43b: keep the speeds, cartoon quick steps and long hops). Human CC0 clips break today's torso limits in 11 of 12 clips, so the skeleton must be settled first.
   - Confidence: medium
   - Revisit when: The owner rejects key-posed motion after a few rounds (then try video motion capture of the owner through the retarget tool).

13. **Item 13**
   - Topic: Saves
   - Decision: One small versioned localStorage module under an 'lg4.' prefix that shows a visible message when a save fails. Ask Codex to lower racing-core's 8,000,000-character per-ghost cap, because a ghost that size can never be stored. IndexedDB only if real use nears about 3 MB.
   - Why: Chromium measured about 5.24 million characters per origin, shared with the owner's other github.io repos. A 60 s ghost is about 37k characters, so 24 ghosts use about 17% of that.
   - Confidence: medium
   - Revisit when: Online play arrives (cloud saves), or Safari shows a smaller limit.

14. **Item 14**
   - Topic: Publish pipeline
   - Decision: Notes-only pushes do not publish (README.md still does, because a test reads its links). Racing browser suites and racing-core unit tests are skipped only when the exact built racing page and its test files already passed once (an output fingerprint recorded in the CI cache). There is a daily full run and a manual 'run everything' option. Frozen foot, wrist and elbow labs are reused when their real source files are unchanged. WebKit is installed only when its suite runs. A build stamp is written as a separate version.json after the checks and never baked into pages.
   - Why: Measured: publishing grew from 0.3 to about 10 minutes per push in 6 days. About 93% of browser-check time is racing suites, and 38 of 60 cancelled publishes were killed by notes-only pushes. Replayed over the 105 pushes since 21 Nov, fingerprints would have cut CI time from about 956 to about 214 minutes, against 382 with a hand-kept file list. Every published page still passes its checks, which keeps Codex's 'check before publishing' gate intact.
   - Confidence: high
   - Revisit when: Most pushes become racing pushes (then add parallel racing jobs), or random 12-minute install stalls continue (then test the official Playwright container).

15. **Item 15**
   - Topic: Planning and review rhythm
   - Decision: Thin island page first, then one area at a time in grey blocks, each with a plain pass/fail exit test and its own Go. One active chunk per assistant. Each chunk ends with one link once its checks pass, at most one bundled link a day, with 3-5 'try this / only your eyes can judge' lines. One page, docs/MINIATURE-PLAN.md, holds Now / Next / Later, the milestone table with exit tests and effort budgets, the cut list, and short numbered decision entries marked current, on trial, or replaced. Each risky experiment gets about 2 working sessions, then a named fallback. Trusted playtests (2-5 people) happen at M2, M4 and M9.
   - Why: This combines the walking skeleton (Cockburn), greybox before art (Epic), a first-playable gate, rolling-wave and Now/Next/Later planning, kill criteria (Duke, Supercell), short decision records with a 'replaced' status, and small frequent playtests (Valve, Nielsen). The commit history shows 20-83 commits every day, so a weekly-only link rhythm would not fit. The racing gate table in racing-core/PLAN.md already works this way.
   - Confidence: medium
   - Revisit when: The owner prefers fewer, bigger review links, or a fixed overall time budget forces cuts.

### Milestones

1. **M0. Faster publishing and one plan page**
   - Goal: Cut the wait for a typical non-racing push from about 9-10 minutes to about 2-2.5 minutes, and give both assistants and the owner one short plan page.
   - Builds:
     1. Notes-only pushes stop publishing; README.md still publishes because a test reads it
     
     2. Racing checks are skipped only when the exact built racing page and its tests already passed once; a daily full run and a manual full run are the safety net
     
     3. Frozen foot, wrist and elbow labs are reused when their real source files are unchanged
     
     4. WebKit is installed only when its suite runs; a build stamp is written as a separate file after the checks
     
     5. docs/MINIATURE-PLAN.md: Now / Next / Later, milestone table with exit tests and effort budgets, cut list, numbered decision entries
     
   - Exit test: A notes-only push starts no publish. An avatar-only push is live in about 2-2.5 minutes. A racing push still runs every racing check, and a deliberately broken racing test still blocks publishing. The daily full run passes. No frozen checkpoint changes.
   - Who: Claude drafts the pipeline. Codex reviews and approves, because he coordinates releases and owns the racing suite runner.
   - Rough size: 1-2 days (rough estimate, not measured)

2. **M1. Island skeleton on your phone**
   - Goal: One island page that opens by link on the iPhone with every area marked, so everything after plugs into it.
   - Builds:
     1. Island page inside the shared lab shell (createSimulation, like the driving page), using the shared controls file
     
     2. Flat grey island at the reserved size, read from one typed layout file (hub, practice fields, skate spot, obstacle strip, pond, six track outlines), with an on/off switch per area
     
     3. Island ground query: height map with block materials; one-line wider collision key; three.js removed from world logic files
     
     4. Layout checker test: inside the island, no overlaps, roads clear of areas, valid spawn points
     
     5. Placeholder marker moved by the shared controls, Reset, a 'Go to' menu that jumps to each area, a coordinates overlay
     
     6. Phone budget overlay: frame rate, draw calls and triangles (shadow pass included) at three scripted views, plus whether WEBGL_multi_draw and EXT_clip_control are available
     
   - Exit test: The link opens on the owner's iPhone and the marker moves. Reset works and 'Go to' reaches every area. Switching an area off removes it with no errors. The checker rejects an overlapping area. The budget overlay's numbers are read from the real iPhone. All existing checks pass, and the approved small island and checkpoints are unchanged.
   - Who: Claude: ground query, collision key, checker, layout file format. Codex: page-shell integration (the recommended framework lead), first in his lane after the controls and isometric-view chunk the owner already authorized. If Codex is busy, Claude builds the page and Codex reviews.
   - Rough size: 3-5 days (rough estimate)

3. **M2. First race loop: GoKart time trial (and the road-width test)**
   - Goal: One complete loop on the island: start from the hub, race 3 timed laps, see results, return. The owner also picks the road width, which fixes the island size.
   - Builds:
     1. Track-loading fix plus the testing/drive.ts type fix, with every racing suite and all four type-check projects green
     
     2. Authoring tool: corner points to smooth track, automatic checks, predicted lap time and top speed per class
     
     3. Road-width test: one short GoKart loop at three widths
     
     4. First GoKart track (trimmed Canyon Switchbacks if the port is approved, otherwise new)
     
     5. Island race world copying the Neighborhood pattern: smooth road, slower grass, outer-only rails option
     
     6. Time trial per card 2: lights, 3 timed laps, a respawn voids that lap, best lap and total saved, results, Again / Back to island
     
     7. Fast race checks in Node, not new browser suites
     
   - Exit test: From the island menu the owner starts the time trial, finishes 3 laps, and sees the best lap still saved after reloading. A respawn voids that lap. A headless run gives the same lap time at 30, 60 and 120 fps. The owner drives the three widths and picks one, and judges the GoKart feel on the phone.
   - Who: Codex. Needs the owner's Go on racing-core PLAN sections 6 and 8 (and 7 if device controls change), and Codex recording the owner's 23 Nov authorization for island tracks in PLAN.md.
   - Rough size: 1-2 weeks (rough estimate)

4. **M3. Walk the island with the marker (runs alongside M2)**
   - Goal: The marker moves around the island on real ground, in four small steps, each approved by the owner.
   - Builds:
     1. (a) Walk and run on the island ground with walls, kerbs and steps; falling off respawns at the hub
     
     2. (b) Jump and fall (gravity is a placeholder number for the owner to tune)
     
     3. (c) Walking into a gate starts that area
     
     4. (d) Get in and out of a kart as a snap, no animation (logic ported from the old repo if approved)
     
   - Exit test: Scripted checks show no passing through walls or floors, a 10.75 cm kerb climbed at a run, and the same path at 30, 60 and 144 fps. Falling off the island respawns at the hub. The owner OKs each step on the phone before the next starts (HANDOFF confirmed rule 1: one movement at a time).
   - Who: Claude (motion-core and the world collision).
   - Rough size: 1-3 weeks, depending on review rounds (rough estimate)

5. **M4. The hoop next to the soccer goal**
   - Goal: The owner's own picture working: one pad with a futsal goal and a hoop right beside it, sharing one ball system.
   - Builds:
     1. Shared ball system with the four tested fixes, plus a small world-query interface it uses (ground height and material, solid cell, ray hit)
     
     2. Challenge runner: free play, one short round, bronze / silver / gold, best score saved
     
     3. Aim-and-power input with three phone styles to try (flick, pull back and release, timing meter), no aiming lines
     
     4. Station camera preset
     
     5. Pad of about 16 x 14 m: futsal goal (3 x 2 m) and a hoop at real height on a post beside it; basketball uses card 6's 60-second round, soccer uses card 8's 5 kicks against a simple scripted goalie; the ball launches from the marker's hand
     
   - Exit test: A broad random-shot test (all angles, low shots, rim hits) gives zero false baskets: a basket only counts if the ball came down through the rim. Balls bounce off block walls. Scoring matches an independent check. The owner tries the three control styles on the iPhone and picks one. A medal and best score survive a reload.
   - Who: Codex leads, per COLLABORATION.md's recommended row for minigame systems. Claude builds the world query and reviews. If Codex's racing lane is full, the owner can hand the ball system to Claude, whose tested research prototype already exists.
   - Rough size: About 1 week (rough estimate)

6. **M5. Race against computer karts**
   - Goal: A real 3-lap race with up to 8 karts on the GoKart track.
   - Builds:
     1. Fresh race module: lights red-red-red-green, ordered checkpoints, 3 laps, wrong-way warning, respawn at the last checkpoint, standings, finish timer, nitro limit (default 3 charges, settled with Codex)
     
     2. Computer drivers: road-following steering plus a per-track speed table, easy / medium / hard
     
     3. Per-kart size in kart-to-kart collisions
     
     4. Time-trial ghost replay
     
   - Exit test: Every computer kart finishes 3 laps, including getting past a stopped or crashed kart at several track spots. Wrong-way and respawn checks pass. The ghost replays the best lap. An 8-kart race meets the phone budget on the owner's iPhone.
   - Who: Codex. Needs the owner's Go on racing-core PLAN sections 4, 5 and 6.
   - Rough size: 1-2 weeks (rough estimate)

7. **M6. All six tracks**
   - Goal: Two tracks for each of GoKart, GT and F1, each with a time trial and a race.
   - Builds:
     1. Prerequisites: road width chosen in M2; Claude and Codex agree kart sizes (F1 2.9 m vs 4.6 m) and show the owner side by side; the owner's answer on what counts as a second track
     
     2. Phase A: one GT track and one F1 track, F1 around the edge and GT in the north infield
     
     3. Phase B: the second track of each class as a shorter version sharing road (reversed layout as a stand-in until then)
     
     4. Final island layout locked in the data file; areas drawn merged; karts baked per material
     
   - Exit test: The layout and lap checker reports zero problems. All six tracks have a working time trial and race. Predicted laps are about 30-45 s. The owner judges GT and F1 feel on the phone. The track view meets the phone budget.
   - Who: Codex: tracks and racing. Claude: checker, ground under the roads, kart looks.
   - Rough size: 2-3 weeks (rough estimate)

8. **M7. Small skate spot**
   - Goal: A rideable board on a small street spot, plus a skate race line.
   - Builds:
     1. Island ground query extended with wedge shapes (and the quarter-pipe piece for stage 2)
     
     2. Board vehicle: push (also when rolling backwards), lean steer, brake, ollie about 0.7 m, auto-grind on grindable blocks, air spin, bail and get-up, respawn, board pickup pad, two touch layouts
     
     3. Stage 1 street spot: kicker, ledge, low box, flat rail; skate race line using the race checkpoints
     
     4. Stage 2 (optional, first to cut): mini ramp with game-style airs
     
   - Exit test: Automated sweeps show the ollie clears one block with timing windows of about 0.2 s or more at 4-5 m/s, with collision checked on the landing step. Grinds exit cleanly, and nothing falls forever. Stage 2: 10 or more back-and-forth mini-ramp passes. The owner tries both control layouts and judges the feel.
   - Who: Joint, as a proposal the owner can change. Codex builds the board physics (it works like a vehicle). Claude builds the wedge and quarter-pipe ground shapes, the rider pose and the falls.
   - Rough size: 2-3 weeks; stage 1 about 1-1.5 weeks (rough estimate)

9. **M8. A practice station for every other minigame (in batches)**
   - Goal: Every minigame has a small working practice version, grouped by shared mechanic so each batch is mostly data.
   - Builds:
     1. Batch 1, ball at a target: football throw lane, skee-ball, frisbee basket
     
     2. Batch 2, things that stick (straight-line ray mode): archery, darts, paintball gallery
     
     3. Batch 3, table and lane: mini golf (old garden hole ported if approved), billiards, bowling with sliding-disc pins
     
     4. Batch 4, hit with a tool: batting cage and golf range with nets and a carry-distance readout
     
     5. Batch 5, body (after jump is approved): obstacle strip, long jump and high jump
     
     6. Batch 6, ride zones (last, first to cut): ice loop, ski slope
     
   - Exit test: For each batch: every station can be played once with a score. Broad random-shot tests pass. The field view meets the phone budget. The owner tries the batch and replies keep, change or drop for each station.
   - Who: Codex leads station rules (recommended row). Claude: world query, ray-mode support, and the movements for the body batch.
   - Rough size: 3-6 weeks in total (rough estimate)

10. **M9. Miniature complete**
   - Goal: Everything works together in one session on the phone.
   - Builds:
     1. Every area reachable from the hub by walking or the 'Go to' menu
     
     2. Records survive closing the page
     
     3. Whole-island phone check at the field, track and 8-kart race views
     
     4. Trusted playtest with 2-5 people while the owner watches, then a sorted fix list
     
   - Exit test: One session with no reload covers every area. Records survive closing and reopening the page. The phone budget is met in all three views on the owner's iPhone. The playtesters' confusion list is sorted into keep, fix and drop. The miniature counts as complete with the marker.
   - Who: Both assistants.
   - Rough size: About 1 week (rough estimate)

11. **P. Parallel lane: avatar into the world (owner-paced, never blocks the miniature)**
   - Goal: Swap the marker for the avatar once the owner approves walking and running by eye.
   - Builds:
     1. Continue the owner's AVATAR-POLISH-LIST
     
     2. Settle the 6 ft 4 in bone lengths and joint ranges (waist tilt, collarbone, total twist) with the owner
     
     3. Walk, run and top-speed style as densely baked key-pose clips driven by distance travelled, starting from the owner's own letsgo-racing poses if the port is approved; show 3-4 planted top-speed versions side by side
     
     4. One switch swaps the marker for the avatar; throw, kick and swing motions come later, one at a time
     
   - Exit test: The owner approves walking and running by eye. The switch works on the island page. Phone budget still met, with computer drivers using a lighter distance version.
   - Who: Claude.
   - Rough size: Paced by the owner's review rounds (not estimated)

### Time savers

1. **Item 1**
   - Saver: Build all six tracks on racing-core as it is, with no retuning
   - How: A 56-line track-loading fix plus one type fix. Island tracks are data, and class profiles already give 30-45 s laps when tracks are sized per class.
   - Est saving: Weeks (estimate). Tested: 70 of 70 laps on new short tracks with every class and zero falls, without rewriting driving, collisions or lap timing.
   - When: M2
   - Effort: Hours for the patch; the authoring tool is about 1-2 days (estimate)

2. **Item 2**
   - Saver: Change-aware publishing
   - How: Notes-only pushes skip publishing. Racing checks skip when the exact built page already passed. Frozen labs are reused. WebKit installs only when needed.
   - Est saving: Measured replay: CI time over 105 pushes from about 956 to about 214 minutes (about 78% less). A typical avatar or world push goes live in about 2-2.5 minutes instead of about 9-10.
   - When: M0, first
   - Effort: About 2-3 hours of assistant time; nothing for the owner

3. **Item 3**
   - Saver: Nothing waits on the avatar
   - How: A plain marker plus a 'Go to' menu from day one. Stations launch the ball from the marker's hand. Karts and the skateboard are vehicles the avatar is posed on.
   - Est saving: Weeks of blocked time avoided (estimate). Walking has been rebuilt 5-7 times, and every area would otherwise wait on it.
   - When: M1 onward
   - Effort: Small: the menu and marker are part of M1

4. **Item 4**
   - Saver: Each class's two tracks share road, everything nests inside the F1 ring, and there are no bridges
   - How: Layout S2b arrangement, with a reversed layout as a temporary second track if the owner accepts it.
   - Est saving: Measured: 35% less road to build than six separate tracks (2,970 vs 4,584 m) on a 43% smaller island. No ramps, no two-level collision, no camera work under bridges.
   - When: M6 (planned from M1)
   - Effort: None extra; it is the layout choice

5. **Item 5**
   - Saver: Stations are data on one ball system, one challenge runner and one input module
   - How: Each new station is a short config file plus placeholder art. Each card's own short round is reused as the challenge.
   - Est saving: Measured prototype: station files of 3-14 lines against about 150 lines of shared code, so after the first station in each batch the rest are mostly configuration.
   - When: M4, M8
   - Effort: The shared pieces are built once in M4

6. **Item 6**
   - Saver: Tracks and layout as data, checked by fast Node checks before publishing
   - How: Layout checker plus scripted lap test (about 7 s for six tracks), ball scoring sweeps, skate sweeps, and race checks in Node instead of new browser suites.
   - Est saving: Avoids 6-10 minute publish round trips for layouts that would fail. Browser racing suites already take about 290 of 308 s.
   - When: M1 onward
   - Effort: Part of each milestone

7. **Item 7**
   - Saver: No physics engine in version 1
   - How: Hand-written ball system and 2D rolling discs; an engine only if the owner says the bowling pins look fake.
   - Est saving: About 1.2-1.65 MB less download per phone load and a whole integration project avoided (measured sizes)
   - When: M4, M8
   - Effort: None

8. **Item 8**
   - Saver: Port the owner's own proven pieces from 3D-WORLD-3 (with approval)
   - How: Canyon Switchbacks layout as GoKart track 1, the mini-golf ball code and its tests, kart get-in/get-out logic, the yard's named-places tests, and the letsgo-racing walk/run clip baker. Each is rewritten to keep logic separate from drawing, after a Mario/SM64 check.
   - Est saving: Hours to a few days per piece (estimate; the pieces are 30-110 lines each). The old code still builds, and its 32 tests pass.
   - When: M2, M3, M8, lane P
   - Effort: Small per piece, plus a provenance check

9. **Item 9**
   - Saver: Load the whole island at start; no streaming
   - How: Build every area once and wake its physics by distance.
   - Est saving: Skips building a streaming system (worker threads, load ordering). A test island built in under 1 s at 4x CPU slowdown.
   - When: M1
   - Effort: None

10. **Item 10**
   - Saver: Slider panels with 'Copy for chat'
   - How: On pages the owner judges by eye (avatar parts first, then kart sizes and zones): a big phone-sized slider, -/+ buttons, 'Back to approved', the approved version shown beside it, and a copy button that pastes one line into chat.
   - Est saving: About 25-40% of avatar commits since 19 Nov were number tweaks, each a round trip of about 24 minutes; several round trips become one.
   - When: Start in the New avatar page, then the island page
   - Effort: About half a day for the first panel (estimate)

11. **Item 11**
   - Saver: One short plan/status page as start-of-session reading
   - How: docs/MINIATURE-PLAN.md holds the current goal, next steps, owners and open decisions; HANDOFF is searched only when needed.
   - Est saving: About 17k tokens per fresh session or subagent (estimate from word counts), and less risk of acting on stale notes
   - When: M0
   - Effort: About an hour, plus updating it at the end of each chunk

12. **Item 12**
   - Saver: Build stamp and version tags on links
   - How: A small 'build commit time' label read from version.json, and ?v=<commit> on every link given to the owner.
   - Est saving: Prevents 'I don't see the change' round trips caused by caching (the old repo hit this problem)
   - When: M0
   - Effort: About 30 minutes

13. **Item 13**
   - Saver: Avatar motion as baked data clips on the existing pose player
   - How: Key poses as foot and hand targets, baked densely and driven by distance; fixes are pose edits, not new algorithms; CC0 drafts from Mesh2Motion.
   - Est saving: Avoids another rebuild cycle for each movement (estimate)
   - When: Lane P
   - Effort: Ongoing, paced by the owner's reviews

14. **Item 14**
   - Saver: One chat per job, plus one /usage check
   - How: Each job starts from the plan page in a fresh chat and ends with an updated plan page.
   - Est saving: Smaller context per message (size not measurable here)
   - When: From M0
   - Effort: Habit only

### Flexibility
1. Area positions, sizes and on/off switches live in one layout data file. Moving the hoop or the skate spot is a one-line edit, checked automatically.
2. Road widths per class are a number in blocks. The island size follows the width set the owner picks.
3. Each track is a list of named corner points. Moving one corner updates both tracks that share that road. Lap time and top speed predictions print right away.
4. Which layouts count as each class's two tracks (shorter version, reversed, or a separate road) is a setting per track.
5. Kart class to model and handling profile (GoKart, GT, F1, or the approved Fast feel) is a setting. No feel is retuned without the owner.
6. Race settings: laps, number of computer karts (up to 8), difficulty, nitro charges, rails or grass on each track.
7. Station settings: challenge rules, medal thresholds, gear size (real or toy), goalie on or off, which control style each station uses.
8. Skate settings: ollie height, game-style or realistic airs, automatic or button grinds, landing forgiveness.
9. Physics feel numbers (ball bounce and roll per block, gravity for walking and jumping) stay as settings, left empty in the rulebook until the owner approves them.
10. Ground look (stepped blocks or smooth), background (slate blue now, sky later), quality tier, pixel ratio, shadows on or off, camera presets.
11. Player look: marker, Game avatar or New avatar, by one switch.
12. The milestone order can swap. For example, walking before the time trial costs nothing structural, because both lanes plug into the same island page.

### Owner decisions

1. **What counts as the second track of each kart class?**
   - Options: (a) A shorter version of the same circuit that shares part of the road, like Silverstone's National and Grand Prix layouts. Each class keeps its own roads. (b) Six completely separate tracks, which needs an island of about 20 hectares and about 55% more road. (c) GT and F1 share one circuit's roads as different layouts. This gives the smallest island (about 10 hectares with narrow roads), but GT and F1 feel more alike, and it goes against your KARTS.md rule that each mode has its own tracks. Also: until the real second track is built, may the first track driven backwards stand in for it?
   - Recommendation: (a), and yes to driving it backwards as a temporary stand-in. It is the proven way real circuits and Gran Turismo get many layouts from few roads, and it keeps your 'each mode has its own tracks' rule.

2. **How wide should the race roads be? You pick by driving a short test loop at three widths on your phone, built in M2.**
   - Options: (a) Narrow, about 10 / 13 / 15 m for GoKart / GT / F1. Island about 390 x 300 m. Tighter and harder. (b) Medium, about 13 / 17 / 20 m. Island about 430 x 335 m. (c) Wide, about 16 / 22 / 26 m, like today's approved circuits. Island about 480 x 375 m.
   - Recommendation: Plan around (b) medium until you drive it. A computer driver cannot judge width for a human thumb on a phone, so your drive decides.

3. **On island-sized F1 tracks the F1 kart peaks around 135 mph (about 175 with nitro), not its approved 180 mph top speed. Is that OK?**
   - Options: (a) Yes. F1 is still clearly the fastest (about 135 mph against GT about 95 and GoKart about 61). (b) Add one long straight of about 500 m so F1 reaches full speed, which makes the island about 100 m longer. (c) Keep the approved Fast kart as a free-roam and test kart, and give the F1 class its own tune.
   - Recommendation: (a). It keeps the island small and the approved Fast feel unchanged.

4. **May the assistants port specific pieces of your own old 3D-WORLD-3 work? (Rule 9 says that repo is reference only unless you approve.)**
   - Options: (a) Yes, these named pieces, each rewritten to fit this repo and checked for Mario/SM64 material first: the Canyon Switchbacks layout as GoKart track 1, the mini-golf ball code and its tests, the kart get-in/get-out logic, the obstacle yard's named-places testing idea, and later the LetsGo Racing walk/run clip maker for the avatar. (b) Reference only; build everything fresh. (c) Only Codex's racing and golf pieces; build movement fresh.
   - Recommendation: (a). The old code still builds and its 32 tests pass. Each piece saves hours to days, and you already approved how they play.

5. **How long do you want to spend on the miniature before starting the big world?**
   - Options: (a) About 2 months. Skip the ice and ski stations, the skate mini ramp, and the golf range and batting cage until later. (b) About 3-4 months for the full plan, with a written cut list if it runs long. (c) No fixed limit. These durations are rough guesses, not measurements.
   - Recommendation: (b), with the cut order: ski and ice first, then the skate mini ramp, then the golf range and batting cage, then the computer-kart difficulty levels.

### Deferred
1. Mystery boxes and items in races: card 1.2 already says they come after the avatar visuals. First races are clean, with the proposed 3-charge nitro limit.
2. Online play, friend leaderboards, cloud saves, and footbridges or tunnels to the infield areas for online players
3. The big 3D world, the four existing long tracks (3.7-6.6 km), and chunk streaming with worker threads
4. Avatar actions in stations (throw, kick, swing, cue, bow draw), the athletic throw follow-through, and loose balls you can carry: after walking and picking up are approved
5. The hit system, ragdoll falls and 'messing around' (after balance). The choice between Rapier and Jolt for ragdolls is made then.
6. A physics engine for bowling pins, only if the owner says the scripted pins look fake (Rapier, Jolt or Havok, tested on a real iPhone)
7. A racing-line AI, gentle catch-up for computer karts, and other difficulty extras
8. Skate flip tricks, grabs, manuals, bowls, wallrides and true vertical ramps
9. Full minigame rules (lobbies, computer opponents, multiplayer, 9-hole courses, 10-frame bowling)
10. Diving board at the pond
11. A drag-to-move layout editor on the phone (it would write the same layout file)
12. Looks pass: sky, CC0 prop kits (Kenney, Quaternius) with per-pack licence checks, real art
13. Skeleton joint-range widening and the 6 ft 4 in avatar rebuild in code: lane P, paced by the owner
14. IndexedDB storage, and save export/import
15. Not recommended at all: AI 3D model generators (licence traps, heavy meshes), Mixamo (public-repo licence risk), motion matching, physics-driven animation, caching browser downloads in CI, turning off cancel-in-progress, and a 'two-level research rule' (the owner reaffirmed thorough research for every step)

### Risks
1. Feel and performance numbers come from scripted drivers and a software-GPU Chromium at 4x CPU slowdown, not a real iPhone in Safari. Budgets stay provisional until the M1 budget page runs on the owner's phone.
2. Road width cannot be judged by simulation. Delayed scripted drivers left even the approved 26 m circuit, so the owner's phone drive decides width, and the island size follows.
3. Race scenes are the heaviest view: 8 karts (14-18k triangles each) plus 8 drivers (about 29k each) already approach 400k triangles before the world. Computer drivers need a lighter distance version early, and race views use no shadow maps on the phone.
4. Safari's history of slow instanced draws and of disabled multi-draw is unverified today. If BatchedMesh is slow, the fallback is baking each computer kart's seated driver into its kart.
5. The approved Fast feel on small tracks is brake-heavy (39-43% of a lap braking), and the GoKart, GT and F1 prototype feels are not owner-approved. The owner must drive each class.
6. Kart sizes disagree (F1 2.9 m vs 4.6 m) and must be settled before M6, or track widths and the camera get redone.
7. Ownership overlap: minigame systems, the ball system and skate assignments follow recommended (not confirmed) rows. Two assistants editing one file would collide, so each file gets one owner and cross-area changes are announced first.
8. The publish pipeline change touches Codex's suite runner. A wrong fingerprint input could skip a needed check, so the daily full run and manual full run must stay.
9. Practice-station touch controls are unproven on an iPhone. One input module might not suit every station.
10. Walking was rejected and rebuilt 5-7 times. If marker walking is also slow to approve, the 'Go to' menu keeps every area testable.
11. Several web sources (fiakarting.com, gamedeveloper.com, mkleaderboards.com, martinfowler.com and others) could only be read as search summaries. Their figures are marked unverified in the research.
12. Scope creep: about 20 practice stations could grow into 20 full games. Each batch has an effort limit and a cut list.
13. Saved records could be cleared by Safari after 7 days without a visit, unless the page is added to the Home Screen (secondhand source).

### Changes to confirmed decisions
1. SM64 material already in 3D-World-4 conflicts with 'Mario/SM64 data must never be used'. It includes references/sm64-walk, public/references/sm64-walk (published on the live site), references/avatar-walk, references/motion-compare and /run-test/, and docs/NEXT.md items 1 and 7 tell assistants to use them. Frozen copies also sit in checkpoints/test-lab-1 (run-test, walk-test), and 'frozen checkpoints never change'. The plan never uses any of it. The owner must decide whether to unpublish the live copies and remove the NEXT.md pointers (recommended now) and what to do with the frozen copies.
2. racing-core/PLAN.md section 1 decision 7 says new island layouts are not authorized, and sections 4-8 each 'require go'. The owner's 23 Nov direction authorizes the island tracks, but Codex must record it, and each section (race rules, opponents, ghosts and time trials, device controls, playable build outside the Test Lab) still needs its own Go.
3. The plan respects 'Rejected as the new foundation: extending the earlier racing prototype' by writing a fresh race module. The old progress.js and ghosts.js are used only as a written guide and test oracle, never imported.
4. CLAUDE.md rule 16 is kept for now (the island page uses page.js createSimulation). If the game later needs its own shell, the owner would have to relax rule 16. The Test Lab README's installTestLabScene requirement also needs checking for the island page.
5. CLAUDE.md and AGENTS.md list docs/HANDOFF.md as required start reading. Replacing it with the one-page docs/MINIATURE-PLAN.md is an owner-visible process change and needs the owner's OK.
6. WORLD-RULES: the island ground is stored as a height map drawn as stepped blocks with the approved materials, a storage change rather than a look change. The smooth quarter-pipe piece for the skate mini ramp is new to the shape list (F3 limits smooth surfaces to ski runs and banked turns), so it needs the owner's OK before stage 2.
7. Adding Rapier (or Jolt or Havok) would be a third runtime dependency besides three and cdt2d, and needs the owner's approval. It is planned only if the scripted bowling pins look fake.
8. Widening skeleton joint ranges (waist tilt, collarbone, total twist) for athletic throws and kicks reshapes an approved part (HOW-TO D2). Lane P only, with the owner's approval.
9. Practice stations use a lighter 'practice version' of the saved MINIGAMES section A template (no lobby or computer players). The owner's 23 Nov 'small practice versions' direction implies this, but it should be recorded as a decision.
10. Proposed work split beyond the confirmed ownership: Codex leads minigame and station rules and the page shell (recommended rows), skate is joint, and Claude takes the ground query, checker and marker movement. This needs the owner's OK, including a possible hand-over of the ball system to Claude to balance the lanes.
11. Racing roads narrower than today's 26 m circuits: width is not a confirmed decision, but the approved Fast feel was tuned on 26 m roads, so the owner judges the narrower roads by driving them. Approved circuits are never shrunk; they are kept for the big world.
