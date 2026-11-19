# Minigames (19 Nov 2026)

20 minigames. Every one follows the shared template (A); each game's own
card (C) covers only what is unique to it. Status per card: proposed or
approved. The owner wants to revisit the feature cards (docs/FEATURES.md)
for more detail later.

## A. Shared template (all minigames) — saved, 19 Nov

1. Join: walk, drive or swim to the game's gate, or use the watch door.
2. Lobby: friends join; NPCs fill empty spots; choose NPC difficulty (easy,
   medium, hard).
3. Own gear: he plays with the items he owns (kart, clubs, skateboard), with
   their won colours and parts.
4. Countdown: 3, 2, 1, go.
5. Play: the game's own rules.
6. Finish timer: once someone wins, the others get a short time to finish.
7. Results: places or scores, coins by result, maybe a prize.
8. Records: best times and scores are saved.
9. Leaving early counts as last; an NPC takes over his spot.
10. No punching or stealing during minigames.
11. After: play again, or leave back to the gate.
12. Movements a game needs (getting in and out of karts, picking up gear)
    go in the movement plan.
13. Feel: how every game controls and plays (putting, throwing, steering)
    is tested by the owner and refined as he tests it.

Racing games only (karts, skate racing, ice skating, skiing): checkpoints,
wrong-way warning, lap times, respawn at the last checkpoint.

## B. Power-ups — proposed (not approved yet)

1. Kart racing: each racer starts with 3 nitro charges (2 seconds each, top
   speed 120 → 180 mph, as built in racing-core); no other pickups.
2. Skate racing, ice skating, skiing: no nitro; speed comes from pushing
   well and good lines.

## C. Game cards

### 1. Kart racing (approved 19 Nov)
Owner of the racing code: Codex (racing-core). Controls as in the other repo.
1. Grid: up to 8 karts; NPCs fill empty spots. Start lights red, red, red,
   green. 3 laps through checkpoints. First across the line after 3 laps wins.
2. Mystery boxes on the track (Codex builds and refines after the avatar
   visuals): boost, shield, torpedo, a smooth oval rock, banana; the player in
   last place can get a shock that hits everyone else. Legal note
   (docs/game-dev/19-legal.md): give items our own names and looks so the set
   does not read as a copy of another kart game. Whether racers also start
   with nitro charges (section B) is settled with Codex.
3. Cutting across grass allowed but slow; bumping allowed.
4. Blocks: road, concrete with painted curbs, checkered start/finish, grass
   and dirt off track. Objects: turn arrow signs, start lights, barriers,
   mystery boxes. Prizes: kart colours and parts. Where: race islands.

### 2. Time trial (approved 19 Nov)
1. Solo on the track: no other racers, no mystery boxes. A see-through ghost
   kart replays his best lap (racing-core already saves ghosts).
2. 3 timed laps; best lap and total time saved; leaderboard with friends
   (everyone once online exists).
3. Respawning makes that lap not count for a record. Nitro as decided with
   Codex for kart racing.
4. Controls and tracks as kart racing. Prizes for beating target times
   (bronze, silver, gold).

### 3. Mini golf (approved 19 Nov)
1. Courses on multiple islands, small ones too, each with its own holes
   (around 9, more or fewer).
2. Players take turns counting strokes; aim, pull back for power, release.
   A hole ends with the ball in the cup or at a stroke limit (e.g. 6).
   Fewest total strokes wins.
3. Out of bounds or in water: +1 stroke, ball back where it was hit from.
   Hole in one: bonus coins.
4. Blocks: green, green with cup, ice for tricky spots, wedges for slopes,
   concrete or wood walls. Objects: ball, putter, obstacles (windmills,
   ramps, tunnels), flags. Prizes: ball colours, putters. Putting feel is
   tuned with the owner.

### 4. Full golf (approved 19 Nov)
1. 9 holes per island course (tee, fairway, green) on bigger islands.
   Turns, strokes counted. Pick a club (driver, iron, wedge, putter), aim,
   swing with a power meter. No wind. The ground (fairway, grass, sand,
   water) affects where the ball ends up. Fewest total strokes wins.
2. Water: +1, dropped near where it went in. Out of bounds: +1, hit again.
   Par per hole; birdies and holes in one give bonus coins.
3. Blocks: fairway, green, green with cup, grass (as rough), sand (bunkers),
   water. Objects: ball, clubs, tee markers, flags. Walk between shots, or a
   golf cart later. Prizes: clubs, balls, outfits.

### 5. Bowling (approved 19 Nov)
1. 10 frames, up to 2 rolls each to knock down 10 pins; players take turns.
   Pick a ball, step up, aim, swing, add spin to curve it. Standard bowling
   scoring (strikes and spares earn bonus points). Highest score wins.
2. Over the foul line: that roll scores 0. Gutter balls: 0. Strikes in a
   row: bonus coins.
3. Blocks: bowling lane; wood or concrete for the alley building. The
   pin-setting machine and ball return are built from small blocks. Objects:
   pins, balls (weights, colours). Prizes: ball colours and designs. Where:
   town alleys; also a home-island game kit.

## D. The 20 minigames

1. Kart racing. 2. Time trial. 3. Mini golf. 4. Full golf. 5. Bowling.
6. Basketball. 7. Football throwing. 8. Soccer penalties. 9. Baseball
batting. 10. Archery. 11. Darts. 12. Frisbee golf. 13. Skee-ball.
14. Billiards. 15. Obstacle course. 16. Long jump and high jump.
17. Diving. 18. Ice skating race. 19. Skiing. 20. Skate racing.
