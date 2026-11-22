# Kart parts kit (DRAFT, waiting for owner approval)

Written 22 November 2026 for the owner, Claude and Codex. It lists every part
each kart class has, numbered so anyone can point to one ("GT-07"). It builds
on the parts the owner already approved (`docs/KARTS.md`, C and D) and on the
part slots in the code (`kart-parts/spec.js`). **Nothing here is approved
until the owner says so.** Sizes and mount positions are not in this file:
they are measured after the owner approves the kart sizes.

## A. How the kit works

1. **Every part has a fixed spot on each kart.** Developers call the kind of
   part a *slot* and the spot it attaches to a *mount*. Every style of a part
   snaps onto the same mount, so a short spoiler and a tall wing both fit the
   same place.
2. **Part numbers:** `S` = shared by every kart, `GK` = GoKart, `GT` = GT
   GoKart, `F1` = F1 GoKart, `U` = hidden upgrades. The name in brackets is
   the slot name used in the code.
3. **Six styles per part per class** for the first design pictures. More
   styles are cheap to add later in the 3D build.
4. **"Driving"** means the part noticeably changes how the kart drives
   (owner decision, `docs/KARTS.md` D1). Everything else is looks only.
   Codex tunes the actual effects.
5. Paint, skins, stickers and effects (boost flame, underglow, tire smoke,
   horn) are not parts: they go over any part (`docs/KARTS.md` C).
6. No number or name plates (`docs/KARTS.md` C6).

## B. Shared parts (one design set, fits every kart)

1. **S-01 Rims** (`wheels`): many styles, sized to each class's wheels.
2. **S-02 Tires** (`wheels`): track tires and off-road tires. Driving.
   Off-road tires fit any kart and let it drive on grass and dirt, but are
   not better on the track.
3. **S-03 Seat** (`seat`).
4. **S-04 Steering wheel** (`steering`).
5. **S-05 Exhaust** (`exhaust`): single pipe, twin pipes, quad tips, side
   pipes, big chrome.
6. **S-06 Lights** (`lights`): headlights, tail lights, light bars, glowing
   light strips. Off-road lights are bought parts.
7. **S-07 Mirrors** (`mirrors`): optional on any kart.

## C. GoKart (small) parts

1. **GK-01 Nose** (`nose`): the front of the kart.
2. **GK-02 Front bumper** (`frontBumper`): driving with airflow versions.
3. **GK-03 Front wing** (`frontWing`): driving. For winged GoKarts such as
   styles 14, 16 and 18.
4. **GK-04 Hood** (`hood`): the panel in front of the steering wheel; driving
   with airflow versions.
5. **GK-05 Side panels** (`sidePanels`): one on each side of the seat.
6. **GK-06 Rear wing or spoiler** (`wing`): driving. A GoKart may also have
   no wing.
7. **GK-07 Rear bumper** (`rearBumper`).
8. **GK-08 Small diffuser** (`diffuser`): driving.
9. **GK-09 Fenders** (`fenders`): add-on pods over the wheels; driving with
   airflow versions.
10. **GK-10 Mud flaps** (`mudFlaps`).
11. **GK-11 Roll bar** (`rollHoop`): optional, as on style 15.

## D. GT GoKart (medium) parts

1. **GT-01 Front bumper** (`frontBumper`): the GT's face, with the grille and
   intakes; driving with airflow versions.
2. **GT-02 Front splitter or front wing** (`frontWing`): driving.
3. **GT-03 Hood** (`hood`): vents and scoops; driving with airflow versions.
4. **GT-04 Side skirts** (`sidePanels`).
5. **GT-05 Fenders** (`fenders`): always on a GT, arching over the wheels
   with the rims visible; styles range from smooth arches to bolt-on flares
   with rivets; driving with airflow versions.
6. **GT-06 Rear wing or spoiler** (`wing`): driving.
7. **GT-07 Rear bumper** (`rearBumper`).
8. **GT-08 Diffuser** (`diffuser`): driving.
9. **GT-09 Mud flaps** (`mudFlaps`).
10. **GT-10 Roll bar** (`rollHoop`): always on a GT.

## E. F1 GoKart (large) parts

1. **F1-01 Nose** (`nose`): long, from needle-thin to blunt.
2. **F1-02 Front wing** (`frontWing`): driving. One to three layers, split or
   whole.
3. **F1-03 Side pods** (`sidePanels`): with air intakes.
4. **F1-04 Engine cover** (`engineCover`): carries fins, scoops and the air
   intake above the driver's head.
5. **F1-05 Rear wing** (`wing`): driving.
6. **F1-06 Rear bumper** (`rearBumper`).
7. **F1-07 Diffuser** (`diffuser`): driving.
8. **F1-08 Fenders** (`fenders`): optional small wheel covers, as on F1
   style 10; driving with airflow versions.
9. **F1-09 Mud flaps** (`mudFlaps`).
10. **F1-10 Roll hoop** (`rollHoop`): always on an F1.
11. **F1-11 Halo bar** (new slot, not yet in the code): optional bar over the
    cockpit, as on F1 style 17. Looks only.

## F. Hidden parts and upgrades (every kart)

1. **U-01 Frame** (`frame`): the base everything bolts onto (the chassis).
2. **U-02 Floor** (`floor`).
3. **U-03 Suspension** (`suspension`): upgradable; driving. The GoKart has a
   solid rear axle instead at the back (`axles`), like real karts.
4. **U-04 Chassis weight** (upgrade): lighter or heavier; driving.
5. **U-05 Off-road set-up** (upgrade): raise the kart and push the wheels out
   a little, like real off-road cars; driving.

## G. Reference styles for the first pictures

Use these as the base look of each class until the owner picks otherwise:
GoKart style 11, GT style 3, F1 style 1 (`docs/karts/styles/`).

## H. Open points for the owner

1. Approve or change any numbered item.
2. GK-03: front wings on GoKarts (included because the mid-tier GoKarts 16
   and 18 have them).
3. GK-06: a GoKart may have no rear wing.
4. F1-11: the halo is looks only.
