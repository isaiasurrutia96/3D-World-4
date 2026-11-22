# Kart parts kit

Written 22 November 2026 for the owner, Claude and Codex. It lists every part
each kart class has, numbered so anyone can point to one ("GT-07"). Sections
A to G were **approved by the owner on 22 November 2026** with the changes
they asked for. Section H covers models per class. Sizes and mount positions are not in this file: they are
measured after the owner approves the kart sizes (`docs/KARTS.md`, G).
Weapons are part of racing, which Codex owns: Claude builds the look of the
weapon parts, Codex builds how they work.

## A. How the kit works

1. **Three classes:** **S Karts** (S Class, the small karts, formerly
   "GoKart"), **GT Karts** (GT Class, medium) and **F1 Karts** (F1 Class,
   large).
2. **Every part has a fixed spot on the kart.** Developers call the kind of
   part a *slot* and the spot it attaches to a *mount*.
3. **Part numbers:** `S` = shared by every kart, `SK` = S Karts, `GT` = GT
   Karts, `F1` = F1 Karts, `W` = weapons, `U` = hidden upgrades. Names in
   brackets are the slot names in `kart-parts/spec.js`; "new" means the slot
   is not in the code yet.
4. **Six styles per part** for the first design pictures; more later.
5. ⚡ **Driving:** the part noticeably changes how the kart drives (owner,
   `docs/KARTS.md` D1). Codex tunes the effects. Everything else is looks.
6. Paint, skins, stickers and effects (boost flame, tire smoke, horn) go over
   any part. No number or name plates.
7. The world has a **night mode**, so lights and neon parts matter.

## B. Shared parts (fit every kart)

1. **S-01 Rims** (`wheels`): many styles, sized to each class's wheels.
2. **S-02 Tires** ⚡ (`wheels`): track or off-road. Off-road tires fit any
   kart and drive on grass and dirt, but are not better on the track.
3. **S-03 Seat** (`seat`): several styles.
4. **S-04 Steering wheel** (`steering`): several styles.
5. **S-05 Exhaust** (`exhaust`): single, twin, quad, side pipes, chrome. The
   pipes sit in the diffuser, which holds any pipe arrangement.
6. **S-06 Lights** (`lights`): headlights, tail lights, light bars.
7. **S-07 Neon lighting** (new): glowing strips around the kart and
   underglow underneath.
8. **S-08 Roll bar** (`rollHoop`): around the seat on every class, including
   F1. Players mainly pick its colour; a version with lights.
9. **S-09 Mirrors** (`mirrors`): really show who is beside or behind. Start
   with one rear-view mirror and test the speed on phones before adding side
   mirrors, because each working mirror is like an extra camera.
10. **S-10 Front lip** (new): a thin lip under the front, every class.
11. **S-11 Side lips** (new): thin lips along the sides, every class.
12. **S-12 Mud flaps** (`mudFlaps`): four, one behind each wheel, every
    class.

## C. S Kart (small) parts

1. **SK-01 Nose** (`nose`).
2. **SK-02 Front bumper** ⚡ (`frontBumper`): airflow versions add downforce.
3. **SK-03 Front wing** ⚡ (`frontWing`): for winged S Karts (styles 14, 16,
   18).
4. **SK-04 Hood** ⚡ (`hood`): airflow versions add downforce. Holds the
   hidden cannon (W-01).
5. **SK-05 Side panels** (`sidePanels`).
6. **SK-06 Rear wing or spoiler** ⚡ (`wing`): or no wing at all.
7. **SK-07 Rear bumper** (`rearBumper`): holds the oil dropper (W-02).
8. **SK-08 Small diffuser** ⚡ (`diffuser`): holds the exhaust pipes.
9. **SK-09 Fenders** ⚡ (`fenders`): optional pods over the wheels.

## D. GT Kart (medium) parts

1. **GT-01 Front bumper** ⚡ (`frontBumper`): the GT's face; grille, intakes.
2. **GT-02 Splitter or front wing** ⚡ (`frontWing`).
3. **GT-03 Hood** ⚡ (`hood`): vents and scoops.
4. **GT-04 Side skirts or side pods** (`sidePanels`): hold the hidden
   cannons (W-01), one on each side.
5. **GT-05 Fenders** ⚡ (`fenders`): always on; rims stay visible.
6. **GT-06 Rear wing or spoiler** ⚡ (`wing`).
7. **GT-07 Rear bumper** (`rearBumper`): holds the oil dropper (W-02).
8. **GT-08 Diffuser** ⚡ (`diffuser`): holds the exhaust pipes.
9. **GT-09 Push bar with lights** (new): a guard across the front like a
   police car's push bar, with lights for night mode.

## E. F1 Kart (large) parts

1. **F1-01 Nose** (`nose`): needle-thin to blunt.
2. **F1-02 Front wing** ⚡ (`frontWing`): one to three layers, or split.
3. **F1-03 Side pods** (`sidePanels`): air intakes; hold the hidden cannons
   (W-01), one on each side.
4. **F1-04 Engine cover** (`engineCover`): fins, scoops, the intake above the
   head.
5. **F1-05 Rear wing** ⚡ (`wing`).
6. **F1-06 Rear bumper** (`rearBumper`): holds the oil dropper (W-02).
7. **F1-07 Diffuser** ⚡ (`diffuser`): holds the exhaust pipes.
8. **F1-08 Fenders** ⚡ (`fenders`): optional small wheel covers.
9. **No halo:** it would block the first-person view (owner).

## F. Weapons (instead of banana-style items)

1. **W-01 Cannon** (new): shoots torpedoes and bouncing bullets. It hides
   inside its panel, pops out to shoot, then quickly hides again, like the
   Rolls-Royce hood ornament that sinks into the car. Spots: the centre of
   the hood on S Karts (shots leave from the middle, where the driver aims);
   a pair on the side pods on GT and F1 Karts (the F1 has no hood, and a
   pair keeps the shots centred).
2. **W-02 Oil dropper** (new): a small hidden part in the rear bumper that
   releases oil behind the kart so other karts slip.

## G. Hidden upgrades (every kart)

1. **U-01 Engine** ⚡: top speed.
2. **U-02 Turbo** ⚡: acceleration and boost.
3. **U-03 Suspension kit** ⚡: handling. The S Kart's rear has a solid axle
   like real karts.
4. **U-04 Chassis weight** ⚡: lighter or heavier frame (this is the "frame
   upgrade").
5. **U-05 Off-road kit** ⚡: raised kart, wheels pushed out a little.
6. No transmission upgrade: it would overlap with engine and turbo.

## H. Models per class

1. **Each class shares one base** (developers call it a *platform*): the
   same length, width, wheel spacing, wheels, seat, roll bar and the mounts
   for shared parts, the rear wing, exhaust and weapons. Shared parts (B),
   rear wings, mud flaps and weapons fit every model in the class.
2. **Each model has its own body** (bumpers, hood, side panels, fenders,
   lips, nose, push bar). These body parts fit only their own model: GT
   style 1 gets several bumpers of its own, which will not fit style 5 or
   16. Racing games with body kits work the same way: each car has its own
   kit.
3. **Owner decision (22 November 2026): start with one model per class** to
   get the driving fundamentals right first. Later models are fine-tuned to
   their own body shape. Starting models: S Kart style 11, GT style 3, F1
   style 1 (`docs/karts/styles/`), unless the owner picks others. Three
   styles per body part per model to start.
4. More models can be added later without changing anything already built,
   because they use the same class base.
