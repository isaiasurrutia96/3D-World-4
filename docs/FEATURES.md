# Game features (ideas list, 19 Nov 2026)

Every feature idea the owner has had, in one place. Status: **idea** means
noted, not approved yet. Each one gets its own card, approved one at a time
(like the blocks), and then its status becomes **approved**. Blocks are in
`docs/WORLD-RULES.md`.

## Feature card template (approved 19 Nov)

Every feature card answers: 1 Why. 2 How it works (start to finish). 3 Get
it (start, unlock, buy, win). 4 Lose or keep (death, theft, leaving).
5 Where it works and where not (minigames, home islands, water). 6 Screen
(what shows on screen or in the watch). 7 Works with (coins, shop, hits...).
8 Online (what changes with other players). 9 Saved (remembered between
sessions). 10 Edge cases (tight space, mid-air, full inventory). 11 Movements
needed (go into the movement plan). 12 Numbers to set later (prices,
timings, limits). The cards below are being redone with it, one at a time.

## A. Travel and home

1. **Watch door** (approved 19 Nov, detailed)
   1. Why: a shortcut to islands and minigames, no menus or loading screens.
   2. How: open the watch, pick a place or Start minigame → pick a game; a
      plain door (no glow) appears in front of him; he walks up and opens
      it; the destination is already visible through it (a portal, kept
      light for the old MacBook); he walks through; it closes and vanishes.
   3. Get it: bought with coins or won as a prize.
   4. Lose or keep: lost when he dies; cannot be stolen (on his wrist).
   5. Where: indoors and outdoors, on land. Not underwater, mid-air, in a
      kart or during a minigame. Another player's home island only when
      invited.
   6. Screen: destination list in the watch (islands, home, minigames);
      "Door needs space" when blocked.
   7. Works with: shop, prizes, home-island invites, minigame gates.
   8. Online: others see his door; only he (and invited friends, for his
      home) can go through.
   9. Saved: whether he owns it; places visited.
   10. Edge cases: no space → message; someone else walks in → not taken;
       he walks away → the door vanishes after a few seconds.
   11. Movements: opening a door, walking through.
   12. Numbers later: price, space needed, how long it stays open.
   The watch's look is designed by the owner with Codex.
2. **Home island** (approved 19 Nov, detailed)
   1. Why: his own place to store stuff, build and show off; a goal.
   2. How: unlock it; a small plain island (grass, dirt, bedrock) appears.
      Reached only by the watch door or the menu screen (no bridges or
      roads). Build, place game kits, store items; buy land to expand.
   3. Get it: unlocked around level 3.
   4. Lose or keep: never lost; stored items safe when he dies.
   5. Where: no stealing on home islands. Build mode: the avatar disappears
      and he builds freely with a camera, any block anywhere, plus big
      shapes (a whole wall or floor slab at once).
   6. Screen: build-mode menu (blocks, big shapes, colours, paint, kits),
      storage chest, land expansion in the watch.
   7. Works with: coins, shop (land, kits), watch-door invites, rulebook
      and world checker (every build must pass).
   8. Online: friends visit only by invite; he can zap a door to wherever
      the friend is and they walk through. He chooses whether guests can
      build, hit or just look.
   9. Saved: every block placed, kits, stored items, land size.
   10. Edge cases: a build that fails the checker will not place (message
       says why); storage full → message; a friend inside when he leaves is
       sent back to their last spot.
   11. Movements: none for building (avatar hidden).
   12. Numbers later: land prices, size limits, storage size. Which devices
       can run the full game: decided later (older laptops may not).
   Players cannot design their own minigame rules; game kits are for fun.
3. **Free-roam driving** (approved 19 Nov, detailed)
   1. Why: drive anywhere, not just on tracks.
   2. How: the kart stays parked in the world where he left it; if it is
      too far away he zaps it next to him with the watch; hops in, drives on
      any reachable ground; hops out and it stays parked.
   3. Get it: a normal, slower starter kart around level 2; faster karts
      from the shop or prizes; his custom kart later.
   4. Lose or keep: the kart is never lost; if he dies it goes back into the
      watch. Lava: the kart sinks and he has a few seconds to climb onto it
      and jump to safety, or he dies. Water: kart and he respawn at the last
      safe spot.
   5. Where: anywhere outdoors in the big world, and on his home island,
      including his own custom track to race on. Not indoors or during
      non-racing minigames.
   6. Screen: speed and a small map.
   7. Works with: watch (zap it), shop, block grip, hits (karts send people
      ragdolling), home-island tracks.
   8. Online: others see him drive and see his parked kart; kart crashes
      bump both.
   9. Saved: karts owned, colours and parts, where it is parked.
   10. Edge cases: no space to zap → message; flipped → rights itself;
       stuck → respawn button.
   11. Movements: get in, sit and steer, get out, climb onto a sinking kart
       and jump off, ragdoll when hit.
   12. Numbers later: grip and speed per block, kart speeds by type, how
       long a kart takes to sink in lava.
4. **Swimming travel** (approved 19 Nov, detailed)
   1. Why: explore and travel, with secrets underwater.
   2. How: walk or jump in; swim on the surface; dive under (breath meter
      appears); come up to breathe. A lazy-river current carries him, partly
      through tunnels. He can swim up a waterfall if it is big enough.
   3. Get it: from the start; swim gear (snorkel with air tank, flippers)
      from the shop or prizes.
   4. Lose or keep: drowning is a death (carried items lost, kart back to
      the watch); swim gear is carried, so lost on death.
   5. Where: any water; diving boards around the world, just for fun.
   6. Screen: breath meter underwater; air-tank meter with the snorkel.
   7. Works with: item wheel (only swim gear while swimming), shop, coins
      hidden underwater, water current setting. Underwater caves in big ponds.
   8. Online: others swim alongside; no hits underwater.
   9. Saved: swim gear owned, secrets found.
   10. Edge cases: current pushes him into a wall → slides along it; breath
       runs out in a cave → drowns; underwater view: shades of blue, bubbles.
   11. Movements: surface swim, dive, underwater swim, climb out, swim up a
       waterfall, dive off boards.
   12. Numbers later: swim speed, breath time, air-tank time, flipper boost,
       current strength.

16. **Big connected world** (approved 19 Nov, detailed)
    1. Why: one world; every island and game reachable by walking, driving
       or swimming (the watch door is a shortcut).
    2. How: islands linked by walking bridges, roads and rivers; nearby
       islands load as he gets close, far ones unload to stay fast. Each
       island has a theme (town, forest, canyon, snow, volcano, tropical);
       minigames match their island.
    3. Get it: from the start; some islands open at higher levels.
    4. Lose or keep: nothing to lose; falling off respawns him near where he
       fell.
    5. Where: the shared world (home islands are separate: door or menu only).
    6. Screen: a world map in the watch (islands, minigames, where he is).
    7. Works with: watch door, minigame gates, island themes, levels.
    8. Online: other players share the same world.
    9. Saved: islands visited and unlocked.
    10. Edge cases: an island not loaded yet shows a simple version until
        ready; falling between islands → respawn near the edge.
    11. Movements: walk, run, cross bridges (nothing new).
    12. Numbers later: islands at launch (start small), loading distance,
        which levels unlock which islands.

## B. Money and items

5. **Coins** (approved 19 Nov, detailed)
   1. Why: the reward for playing; spent on items, land and upgrades.
   2. How: coins are added on a game's results screen, or on the spot in the
      free world; spent in the shop or watch.
   3. Get it: minigames (more for 1st, some just for playing), duplicate
      prizes, arcade tickets, small amounts hidden around the world, and a
      few coins for cool moments in the free world (a skateboard trick,
      hitting a target, shooting a hoop).
   4. Lose or keep: always kept; never lost on death or stolen.
   5. Where: earned anywhere; spent in the shop, watch, home build mode.
   6. Screen: coin count in a corner and in the watch; a +coins pop-up.
   7. Works with: shop, prizes, home-island land, game kits, levels.
   8. Online: coins cannot be traded between players (anti-cheat), for now.
   9. Saved: coin total; history of earning and spending.
   10. Edge cases: not enough coins → the shop shows how many more; leaving
       a game early → no coins.
   11. Movements: none.
   12. Numbers later: coins per game and place, prices, hidden amounts,
       free-world rewards.
   No real money for now.
17. **Prizes** (approved 19 Nov): sometimes after winning a minigame, more
    often for 1st place. Items (skateboard, watch door, cosmetics like colours
    and outfits), game kits, rarely home-island land. Matched to the game
    (golf prizes lean golf, racing prizes lean racing). A duplicate turns into
    coins. A short prize reveal after the win.
6. **Shop** (approved 19 Nov): opened from the watch, plus a few shop
   buildings around the world. Sells rides (skateboard), the
   watch door, swim gear, sports gear (clubs, balls, bat, cue), cosmetics, home-island
   land and game kits. Items lost on death show first for easy rebuying.
   Prices set later. Bought items go straight into his item pull-out.
7. **Item pull-out** (approved 19 Nov, like GTA): hold a button, an item
   wheel appears, pick an item and it is in his hands. Holds everything he
   owns and carries (rides, sports gear, the watch door). Works anywhere,
   e.g. a golf club and ball to hit from any block, even a cloud. One item
   in hand at a time. Not during minigames (they give him the gear).
8. **Losing loot and stealing** (approved 19 Nov): he dies from lava,
   landing on a cactus, or drowning (swimming needs a breath meter). Falling
   off an island is not a death: he respawns near where he fell, nothing
   lost. On death his carried items disappear (rebuy or win them); coins,
   cosmetics and his home island and its storage are kept; he respawns at
   the last safe spot. Stealing: a punch while he holds an item (e.g. a
   club) knocks it out of his hands; it drops and anyone can grab it. No
   stealing during minigames.

18. **Custom kart building** (idea, 19 Nov): build and customize his own
    go-kart.
19. **Outfit customizing** (idea, 19 Nov): customize his outfit.

## C. Riding

9. **Skateboarding** (approved 19 Nov): shop or prize, pulled out from the
   item wheel. Push to speed up, lean to steer, jump (ollie). Skate anywhere:
   smooth ground (road, concrete, wood) is fast; grass, dirt, sand, snow are
   slow. Skateparks (ramps, rails, bowls) around the free world. Skate
   racing is a new minigame (courses with ramps, rails and more). Grinds
   along rails and edges marked grindable. Can be swung as a weapon. A bad
   landing knocks him off (no death). Tricks later.
10. **Bikes and scooters**: removed for now (owner, 19 Nov).

## D. Moving around

11. **Ledge grab and climbing**: moved to the movement plan (it is a
    movement, owner 19 Nov): grab edges and hang, pull up, shimmy, climb
    almost any solid block (not lava or cactus), after balance and jumping.
12. **Clouds and secret ramps**: covered by the cloud block and skateboarding.

## E. Messing around

13. **Hits** (approved 19 Nov): punch, kick, throw a ball at someone, or
    swing a held item (club, bat, cue, skateboard). The person stumbles; a
    hard hit knocks them down; they get back up (no death, no damage). A
    swing beats a punch; a punch knocks an item out of someone's hands and
    anyone can grab it. Not during minigames, and not on someone's home
    island unless its owner allows it. Spam guard: about a second between
    hits from the same player, plus a moment after getting up when he cannot
    be knocked down again (no stun-locking). He can juke (dodge) a hit; the
    juke itself is in the movement plan. Movements need balance first.

## F. People

14. **Online players and NPCs** (approved 19 Nov): meet other players in
    the free world; race, play minigames and hit each other. Home islands:
    visitors only through the owner's watch-door invite. NPCs walk and run
    around the world, are targets for football throws, and are opponents
    when no players are around. Minigames: single player against NPCs, or
    multiplayer with friends. Build order: single player first; online
    later (it needs a server).

## G. Next

After the features, every minigame gets its own card the same way (how you
win, controls, blocks and objects, coins and prizes, single or multiplayer).

## H. Objects (after blocks)

15. **Objects list** (idea; folded into the minigame cards, each game names
    its own objects): turn arrow signs first, then hoops, pins,
    targets. Signs and hoops are built from small concrete blocks and paint;
    balls, pins and other moving objects are not made of blocks.
