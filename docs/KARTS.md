# Karts

The shared source of truth for kart designs and kart customizing, for the
owner, Claude and Codex. Approved by the owner on 21 November 2026. Codex owns
driving, handling and racing; Claude builds look-only kart models when asked.
Everything here is general: details get refined later. Like every owner
decision, it can change when something better is found
(`docs/HOW-TO-WORK-WITH-ME.md`, E).

Related approved cards: free-roam driving (3) and custom kart building (18) in
`docs/FEATURES.md`; kart racing in `docs/MINIGAMES.md`.

## A. Three racing modes

1. **GoKart, GT GoKart and F1 GoKart.** Every kart belongs to one mode.
2. Each mode has its own driving feel (tuned by the owner and Codex):
   1. **GoKart:** lighter, arcade feel with some realism, a little slower.
   2. **GT GoKart:** feels real and somewhat heavy, with the most grip,
      handling and turning; slower than F1.
   3. **F1 GoKart:** feels real, heavier, and the fastest.
3. Each mode has its own tracks. F1 tracks suit F1 GoKarts and GT tracks suit
   GT GoKarts. **GoKart tracks are smaller with sharper turns.**

## B. Looks (approved pictures in `docs/karts/`)

1. `base-shapes.jpg`: one base shape per mode.
   1. **GoKart:** based on our current test kart, a bit cooler, no wing.
   2. **GT GoKart:** compact and wide, "like F1 and regular GoKarts had a
      baby"; fenders arch over the wheels and **the rims stay visible**.
   3. **F1 GoKart:** long and low, open wheels, front and rear wings.
2. `gokart-variations.jpg`, `gt-variations.jpg`, `f1-variations.jpg`: five
   approved variations per mode. Same overall shape; details and colours
   differ. The owner loves all of them.
3. The current test kart (`racing-lab/src/reference-kart.js`) stays as it is
   and is never replaced. **Everyone starts with it.**
4. New karts show in the **Test Lab** next to the main kart.
5. Players can own several karts with different driving styles. There will
   be more expensive karts later, each in one of the three modes.
6. Concept pictures: no logos, no real teams, no copied real cars. Picture
   sheets use big numbers and a normal (not long and skinny) layout.

## C. What players can customize

1. **Paint:** main and second colour, finish (shiny, matte, metallic, chrome).
2. **Skins** with patterns (stripes, flames, camo and more).
3. **Stickers** to really customize a kart (our own designs, no real brands).
4. **Body parts:** rims, tires, rear wing or spoiler, front nose and bumper,
   rear bumper, diffuser, side panels, tire fenders, mud flaps, hood, seat,
   steering wheel, exhaust, lights.
5. **Effects:** boost flame colour, underglow, tire smoke and drift sparks
   colour, horn sound.
6. **No number or name plates.**

## D. Parts that change driving

1. Some parts improve driving, for example more airflow through the bumper,
   fenders or hood for downforce, spoilers and tire grip. **The improvement
   is noticeable.**
2. **Off-road tires fit any kart.** They let a kart drive on grass and dirt,
   but on the track they are **not** an improvement. They are for players who
   want a different kind of kart.
3. Off-road wheels and lights are parts players buy.
4. **Off-road set-up for any kart:** the kart can be raised, and the wheels
   can stick out a little more, like real off-road cars.
5. **Suspension** (the system that holds the wheels to the kart) can be
   upgraded.
6. **Chassis upgrade:** a heavier or lighter chassis.
7. (21 November) The owner confirmed D1 over the older "slight overall edge"
   wording; card 18 in `docs/FEATURES.md` now matches.

## E. Open points

1. Exact part list per mode, prices, rarity and how parts are unlocked are
   not decided.

2. **GT production licensing (open, 27 November 2026).** The owner asked how closely an original GT kart can resemble a specific real car in the published game. [Legal reference](game-dev/19-legal.md#c-real-world-things-inside-games-very-relevant-to-sports-games)

## F. Build progress

1. (21 November) **Chunk 1 built, waiting for owner review:** the kart parts
   system (`kart-parts/`) and the GoKart's real chassis with see-through boxes
   where its body parts go, in the Test Lab section "Karts" beside the
   unchanged main kart. Next chunk: the GoKart body, after the owner's Go.
2. (21 November) **Chunk 1b built, waiting for owner review:** the owner asked
   how parts really snap on. Part places are now measured from side and top
   views of the three approved designs (`docs/karts/blueprints/`). Parts snap
   onto mounts; every part comes in styles (several wings and bumpers), and a
   longer wing snaps onto the same spot. A driver zone keeps every part away
   from the driver's body and head; parts that do not fit are rejected. The
   Test Lab shows all three karts and lets the owner swap styles.
3. (22 November) **The whole F1 GoKart built, waiting for owner review:** the
   owner asked for the full F1 kart using the best proven methods. Built from
   the approved design with lofted bodywork, NACA airfoil wings and
   double-wishbone suspension (`kart-parts/README.md`, D). Shown in the Test
   Lab's Karts section; the body parts stay swappable.
4. (22 November) **A fresh set of three karts, sized around the avatar.**
   Owner: the old test kart is only for driving tests; the new set follows
   the approved pictures. Sizes from the owner's size picture with a driver in
   each kart: **GoKart small, GT medium, F1 large, all close in size**; the
   F1 a tiny bit bigger, and **F1 wheels the same size as the GT's**. All
   three built with the F1's methods (lofting with smooth PCHIP curves, NACA
   wings, lathe-turned arches and tires). The wavy nose top is fixed. The
   Test Lab shows all three side by side with a grey driver of the avatar's
   size in each seat. Waiting for owner review.

## G. Locked size target (owner, 22 November 2026)

The owner locked the sizes shown in `docs/karts/sizes/size-target-front.jpg`
(front view, the main reference) and `size-target-side.jpg` (side view), measured
against the avatar standing beside the karts:

1. **GoKart (small):** the top of the seat reaches the avatar's belly button;
   narrow, a little narrower than the avatar is tall; small wheels.
2. **GT GoKart (medium):** the top of the rear wing and roll bar reaches the
   avatar's neck; the widest of the three, wide and planted.
3. **F1 GoKart (large):** the top of the rear wing reaches the avatar's neck;
   a little narrower than the GT; clearly the longest, long and low with a
   long nose (make it long in the 3D build; the side picture came out a bit
   short).
4. **Every variation of a kind keeps that kind's size** (owner: "make sure
   each variation of the gokarts are the same size").
5. The pictures are AI images, so exact numbers are measured and locked when
   the 3D test karts are built with the real avatar.

## H. GoKart styles and tiers (owner, 22 November 2026)

Twenty shape styles of the regular GoKart are in `docs/karts/styles/`
(`gokart-styles-01-05.jpg` to `gokart-styles-16-20.jpg`, numbered on each
picture). Styles 11 to 20 follow the owner's example pictures: chunky toy
karts, a black neon high-end kart and a colourful winged kart. The owner's
favourites are 11, 13, 14, 15, 16, 17, 18 and 19.

1. **Low tier:** 11 (chunky toy: wrap-around bumper with a grille, striped
   raised hood, small rear wing) and 19 (sport tub: rounded body, roll bar,
   rear wing, sharp side vents).
2. **Mid tier:** 16 and 18 (winged karts: wide front wing, boxy side pods,
   tall rear wing, visible shocks). The owner sees 14, 16 and 18 as the same
   overall look, which suits the mid tier.
3. **High tier:** 17 (neon toy: smooth rounded body with glowing light
   strips) and 15 (high-end aero: sharp bodywork, roll bar, rear wing,
   glowing light strips and underglow).
4. Style 13 (chunky tub) is also a favourite; its tier is not set yet.
5. Every style keeps the locked GoKart size (section G). The pictures came
   out a little small; the exact size is set in the 3D build.

## I. GT GoKart and F1 GoKart styles (22 November 2026, waiting for owner picks)

Picture sheets in `docs/karts/styles/`, numbered on each picture. Same paint
within each mode so only the shapes differ, with the grey avatar for scale.

1. **GT GoKart, 20 styles** (`gt-styles-01-06.jpg` to `gt-styles-19-20.jpg`):
   1 widebody street tuner and 2 aero muscle (both from the owner's street-car
   pictures), 3 classic GT3, 4 endurance, 5 retro 70s, 6 rally, 7 drift,
   8 time attack, 9 jelly bean, 10 stealth, 11 hypercar, 12 muscle, 13 mini,
   14 long tail, 15 touring car, 16 tunnel aero, 17 cyber, 18 brawler,
   19 halo, 20 track day. The owner: "These all looked cool."
2. **F1 GoKart, 20 styles** (`f1-styles-01-06.jpg` to `f1-styles-19-20.jpg`):
   each picture also lays out the kart's swappable parts separately (front
   wing and nose, side pods, engine cover, rear wing, rear bumper, diffuser,
   rims, tires, seat, steering wheel, roll hoop, exhaust, lights), useful for
   the 3D build. 1 classic, 2 shark, 3 bulldog, 4 retro cigar, 5 stealth,
   6 future, 7 twin deck, 8 low rider, 9 muscle, 10 endurance, 11 off-road,
   12 hyper aero, 13 rounded, 14 split wing, 15 speedster, 16 brawler,
   17 halo, 18 turbo, 19 open frame, 20 light show.
3. Open: the owner's tier picks for GT and F1, the tier for GoKart style 13,
   and the planned part-variation pictures (proposed, not started).

## J. Kart concept review notes

Owner notes recorded 27 November 2026.

1. **F1 Special Edition reference.** The owner picked options 2, 4, 6, 7, 8 and 9 from the original ten-kart board as styling references for new F1 Special Editions. The ten options are listed in the [project handoff](HANDOFF.md#confirmed-by-the-owner).
2. **F1 rear-wheel experiment (proposed).** The owner asked to try one F1 concept with larger rear wheels while keeping the approved wheel-center spacing.
3. **Earlier 32-design F1 proposal.** The owner sketched six groups of four, covering miniature F1 starters, upscale basics, faster-looking builds with neon throughout, rare or old-school looks, off-road builds, and a full parts-kit showcase with mudflaps. That breakdown left eight of the 32 slots unspecified.
4. **GT recolor preference.** Keep each GT kart's existing body shape while varying the racing liveries across the lineup.
5. **Personal Civic study (archive status unverified).** The owner requested an open-top GT kart with one center seat that closely matches the photos of their red four-door 2014 Civic Si, with a slight wheelbase stretch allowed for this study. [Roofed reference study](https://github.com/isaiasurrutia96/3D-World-4/blob/e8e6ad6cf0258e611236e45bc351591bcd2d971e/docs/karts/concepts/archive/gt/2014-civic-si-roofed-study.png)
6. **Concept-sheet format.** The owner also accepts portrait layouts for kart concept sheets.
