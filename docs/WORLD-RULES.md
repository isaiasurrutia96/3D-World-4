# World rules (approved by the owner, 19 Nov 2026)

The one place for the world's blocks, their rules and the minigames they
serve. Claude and Codex both follow it. Exact numbers (grip, speed, bounce)
are added after the owner approves them.

In code: `src/world/rulebook.ts` (the blocks), `src/world/checker.ts` (every
world must pass it), `src/world/world.ts` (a world is a list of parts).

## A. Who owns what

1. Claude owns the block rulebook (code), the solid ground and the world
   checker that every world must pass.
2. Codex owns how blocks and worlds look, and builds worlds using the rulebook.
3. Most blocks behave the same in every minigame (grass is grass for walking,
   karts and balls).
4. Players cannot break or place blocks. The world is fixed.

## B. Minigames chosen

1. Kart racing (circuit tracks).
2. Time trial.
3. Mini golf.
4. Full golf.
5. Bowling.
6. Basketball (shooting hoops).
7. Football: throwing only, at nets, barrels, running NPCs or online players
   on routes. Not a full game.
8. Soccer: penalty shootouts only.
9. Baseball: batting only.
10. Archery.
11. Darts.
12. Frisbee golf.
13. Skee-ball.
14. Billiards (pool).
15. Obstacle course.
16. Long jump and high jump.
17. Diving off a high board.
18. Ice skating race.
19. Skiing down a slope (pushing with poles to go faster).
20. Swimming for exploring and travel, like a lazy river, partly through
    tunnels.
21. Messing around (remember): punch or kick other players or NPCs and they
    stumble and fall; throw a ball at anyone; whack someone with a pool cue.
    Not a boxing game. Needs balance first.

## C. Shared systems

1. One ball system for every ball game and throw.
2. One hit system for punches, kicks, thrown balls and cue whacks (the person
   stumbles and falls).
3. One rod grip system: hands grip pole shapes (rails, ski poles, bat, pool
   cue, steering wheel). Built on the existing hand grip code.

## D. Settings any block can have

1. Colour: any colour.
2. Paint: a painted design (arrow, stripes, checkered, lines, mowed stripes).
   How a block behaves always comes from the block itself (painted concrete
   is still concrete).
3. Bouncy: landing on it launches him higher (more the higher he falls
   from); balls bounce high. Karts never bounce upward.
4. Water only: a current (flow direction) for the lazy river, or a falling
   current for waterfalls (pushes him down).
5. Decor only: solid or walk-through, chosen when placed.

## E. Blocks (26 approved, 19 Nov 2026, one card each)

Common to all unless noted: smooth (rounded) edges and corners; merged.
"Shapes" means cube, wedge, smooth surface. Sounds come later.

1. Grass: main ground. Bright green. Big only. All shapes. Solid. Normal
   walk; karts slower than dirt and slippery; balls roll slow and short.
2. Dirt: under grass, pond floor, rally sections. Tan brown. Big only. All
   shapes. Solid. Normal walk; karts grip better and go faster than on grass
   (rally), slower than road; balls roll slowly.
3. Sand: beaches, bunkers, long-jump pit, also under water. Pale yellow. Big
   only. All shapes. Solid. Walk and run very slightly slower; karts very
   slow, slide a lot; balls barely roll.
4. Bedrock: the stone under every island. One grey colour. Merged, smooth
   (replaces the earlier tiny-sharp-edge choice). Big only. Cube. Solid.
5. Concrete: the universal building block: track sides and curbs (painted
   red/white), sidewalks, parking lot, outdoor court, oval wall, signs,
   poles, hoops, bridges, arches, rails. Light grey (lighter than bedrock).
   Any size. All shapes. Solid. Normal walk; karts full grip and speed;
   balls bounce well, roll far.
6. Water: pond, lakes, lazy river (also through tunnels), diving pool, golf
   hazards. See-through blue; underwater view in shades of blue with
   bubbles. One flat surface, edges as the current pond (small gap at the
   grass's outside corners, sharp inside corners). Any size. Cube. Not
   solid: he swims (slower than walking). Kart respawns at the last safe
   spot; golf ball is out (penalty); other balls float.
7. Ice: frozen ponds, skating rink and race, tricky spots in mini golf only.
   Pale shiny blue. Any size. All shapes. Solid. He slides (glides fast on
   skates); karts slide a lot; balls glide far.
8. Snow: ski slope, snowy ground. White, slight cool tint. Any size. All
   shapes (long runs use smooth surfaces). Solid. Walk and run a bit slower;
   skis glide fast, push with poles; karts slow, slide (less than ice);
   balls barely roll. Later: ski tracks.
9. Road: tracks and free-roam roads; start/finish is road painted
   checkered. Dark grey asphalt. Any size. All shapes (banked turns use
   smooth surfaces). Solid. Karts: most grip, fastest. Balls roll far.
   Sounds same as concrete.
10. Fairway: full golf and frisbee golf (and sports fields with painted
    lines). Darker green, mowed stripes. Big only. All shapes. Solid. Like
    grass, but balls roll farther and smoother.
11. Green: putting surface; the whole mini-golf course. Brighter, smooth
    green. Big only. All shapes. Solid. Balls roll smoothest and farthest.
12. Green with cup: a green block with a 10.75 cm cup in its centre (white
    rim). Big only. Cube. A slow ball drops in; a fast one can skip over.
    Flag built from small painted concrete.
13. Bowling lane: lanes and approach; maybe skee-ball. Polished light wood,
    painted arrows. Any size. Cube. Solid. He can slide a little at the
    line; balls glide with almost no slowing.
14. Court floor: indoor basketball. Honey wood, painted lines. Any size.
    Cube. Solid. Good grip; karts full grip; highest ball bounce.
15. Rock: boulders, obstacle course. Grey, slight shade per block. Separate
    blocks, rounded. Any of 43, 21.5, 10.75 cm. Cube. Solid.
16. Tree trunk: trunks, branches, logs. Brown, any colour. Any size. Cube
    and wedge (flared base, angled branches; use sparingly). Solid, climbable.
17. Roots: roots spreading from trunks. Brown like the trunk. Separate
    blocks: not merged with the trunk or with each other (owner, 19 Nov).
    Quarter size. Cube. Solid, low steps he walks up.
18. Leaves: tree tops and bushes. Any colour (fall, cherry blossom).
    Separate blocks. Any size. Cube. Solid: climb and stand on; balls
    bounce off.
19. Flower: stem, centre, petals; kept exactly as approved. Walk-through.
20. Decor: small details (tufts, mushrooms, pebbles, lights, lily pads on
    water, vines). Any colour and paint. Separate blocks. Half or quarter.
    Cube and wedge. Solid or walk-through, chosen when placed.
21. Gravel: rally sections, cart paths, trails. Grey-brown speckled. Big
    only. All shapes. Solid. Karts slower than dirt, slide more; balls stop
    fast.
22. Wood: bridges, docks, huts, fences, wooden curbs. Any size. Cube and
    wedge. Solid. Normal walk; karts full grip; balls bounce.
23. Glass: windows, greenhouses, display cases. See-through, any tint. Any
    size. Cube. Solid.
24. Lava: volcano islands. Glowing orange. Any size. All shapes. Touching it
    bumps him away; falling in respawns him (kart too); balls are lost.
25. Cactus: desert/canyon islands. Green, separate blocks, half or quarter,
    cube. Solid. Touching bumps him back; landing directly on top kills him.
26. Cloud: high up, hard to reach. Soft white, separate puffy blocks, big or
    half. Solid on top: stand on it, grab its edge to hang and pull up.
    Balls bounce softly.

Built from other blocks, not their own: track curb, start/finish line,
white lines, rails, bush, snowy pine (trunk + leaves + snow),
canyon/volcanic rock and palm trees (colour), waterfall (water setting),
bouncy mushroom (decor with bouncy, wedge top for roundness).
Removed: rough (grass does it), field (fairway), mud, vines, lily pads.
Balls, bowling pins and other moving objects are not made of blocks.

## F. Shapes

1. Cubes on the one grid (43 cm, 21.5 cm, 10.75 cm).
2. Wedge (triangle) blocks for everyday ramps and small hills, in a few fixed
   steepnesses.
3. Smooth surfaces laid over stacked blocks (as the oval track does) for long
   ski runs and banked track turns.
4. A block's rules are the same whatever its shape.
5. Tunnels are normal blocks with empty space inside.

## G. Ideas

All feature ideas (watch door, home island, coins, items, riding, climbing,
hits, objects) are in `docs/FEATURES.md`.
