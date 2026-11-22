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
