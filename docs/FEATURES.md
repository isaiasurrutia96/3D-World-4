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

1. **The watch** (approved 19 Nov, detailed; renamed from "watch door")
   1. Why: a shortcut to islands and minigames, no menus or loading screens.
   2. How: open the watch, pick a place or Start minigame → pick a game; a
      plain door (no glow) appears in front of him; he walks up and opens
      it; the destination is already visible through it (a portal, kept
      light for the old MacBook); he walks through; it closes and vanishes.
   3. Get it: from the start; the watch is always on him.
   4. Lose or keep: never lost, never stolen.
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
   The watch also: zaps his kart next to him, opens the map, shop and
   invites, and reaches his stored items from anywhere (take any stored
   item into his carried items and use it anywhere).
   The watch's look is designed by the owner with Codex.
2. **Home island** (approved 19 Nov, detailed)
   1. Why: his own place to store stuff, build and show off; a goal.
   2. How: unlock it; a small plain island (grass, dirt, bedrock) appears.
      Reached only by the watch's door or the menu screen (no bridges or
      roads). Build, place game kits, store items; buy land to expand.
   3. Get it: unlocked around level 3.
   4. Lose or keep: never lost; stored items safe when he dies.
   5. Where: no stealing on home islands. Build mode: the avatar disappears
      and he builds freely with a camera, any block anywhere, plus big
      shapes (a whole wall or floor slab at once).
   6. Screen: build-mode menu (blocks, big shapes, colours, paint, kits),
      storage chest, land expansion in the watch.
   7. Works with: coins, shop (land, kits), watch invites, rulebook
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
       or swimming (the watch's door is a shortcut).
    2. How: islands linked by walking bridges, roads and rivers; nearby
       islands load as he gets close, far ones unload to stay fast. Each
       island has a theme (town, forest, canyon, snow, volcano, tropical);
       minigames match their island.
    3. Get it: from the start; some islands open at higher levels.
    4. Lose or keep: nothing to lose; falling off respawns him near where he
       fell.
    5. Where: the shared world (home islands are separate: door or menu only).
    6. Screen: a world map in the watch (islands, minigames, where he is).
    7. Works with: watch's door, minigame gates, island themes, levels.
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
17. **Prizes** (approved 19 Nov, detailed)
    1. Why: winning feels special, beyond coins.
    2. How: win a minigame → a short prize reveal on the results screen →
       into his items or storage.
    3. Get it: sometimes after a win, more often for 1st; bigger prizes for
       records and target times.
    4. Lose or keep: carried prizes follow the death rule (stored ones safe).
    5. What: any prize (items, rides, gear, cosmetics, outfit
       pieces, kart parts, game kits, rarely land). This replaces "matched
       to the game".
    6. Screen: the prize reveal; a "new" badge in the item wheel.
    7. Works with: coins (duplicates become coins), shop, home storage,
       outfits, custom karts.
    8. Online: everyone sees each player's prize on the results screen.
    9. Saved: prizes owned.
    10. Edge cases: storage full → waits in a mailbox on his home island;
        duplicate → coins.
    11. Movements: none.
    12. Numbers later: drop chance, rarity.
6. **Shop** (approved 19 Nov, detailed)
   1. Why: where coins become items, land and kits.
   2. How: open it in the watch or walk into a shop building; browse by
      category; buy; items go to his items (land and kits to his home).
   3. Get it: from the start.
   4. Lose or keep: purchases follow the death rule; items lost on death
      show first for quick rebuying.
   5. Sells: skateboard, karts, swim gear, sports gear (clubs,
      balls, bat, cue, paint markers), outfits and cosmetics, kart parts,
      home-island land, game kits.
   6. Screen: categories, prices, coin count, a "rebuy" row at the top.
   7. Works with: coins, item wheel, home island, outfits, custom karts,
      levels (some items unlock at higher levels).
   8. Online: same shop for all; no trading between players for now.
   9. Saved: everything bought.
   10. Edge cases: not enough coins → how many more; owned → marked owned;
       level-locked → shows the level needed.
   11. Movements: none.
   12. Numbers later: every price, level locks.
7. **Item pull-out** (approved 19 Nov, detailed; like GTA)
   1. Why: use any item he owns, anywhere, instantly.
   2. How: hold a button → item wheel → pick → it is in his hands → use it
      → put it away or pick another. One item in hand at a time.
   3. Get it: from the start.
   4. Lose or keep: carried items lost on death; a punch knocks the held
      item out of his hands (not in minigames or on home islands).
   5. Where: anywhere in the free world; only swim gear while swimming; not
      during minigames (they give the gear). E.g. a golf club and ball to hit
      from any block, even a cloud.
   6. Screen: the item wheel with icons; the held item in a corner.
   7. Works with: shop, prizes, hits (held items can be swung and beat
      punches), watch (the kart and door live in the watch, not the wheel).
   8. Online: others see what he is holding.
   9. Saved: what he is carrying.
   10. Edge cases: too many items → pages; no room to use one (skateboard
       indoors) → message.
   11. Movements: pull out, hold, put away, swing.
   12. Numbers later: how many items he can carry.
8. **Losing loot and stealing** (approved 19 Nov, detailed)
   1. Why: dying and being robbed matter a little, without frustration.
   2. How: he dies (lava, landing on a cactus, drowning) → respawns at the
      last safe spot → carried items are gone; the kart goes back to the
      watch.
   3. Get it: always on.
   4. Lose or keep: lost: carried items. Kept: the watch, coins, kart,
      outfits and cosmetics, home island and everything in storage (pull it
      back out through the watch anytime).
   5. Where: free world only. No stealing in minigames or on home islands.
      Falling off an island is not a death (respawn near where he fell).
   6. Screen: a short "You died" message, then what was lost with "take from
      storage" and "rebuy" buttons.
   7. Works with: watch (storage), shop (rebuy), hits (a punch knocks a held
      item loose).
   8. Online: a knocked-loose item drops; anyone can grab it.
   9. Saved: what was lost (rebuy list).
   10. Edge cases: item knocked into water or lava is gone; an ungrabbed
       dropped item returns to its owner after a while.
   11. Movements: death fall, respawn, item flying out of his hands.
   12. Numbers later: respawn time, how long a dropped item stays.

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
    visitors only through the owner's watch invite. NPCs walk and run
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
