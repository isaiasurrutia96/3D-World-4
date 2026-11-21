# Driving checkpoint 1 — frozen approved baseline

The owner approved the driving feel and requested this checkpoint on
20 November 2026. Do not retune or rebuild this archive. Future changes belong
in the live racing-core/racing-lab code and should be compared with this baseline.

Open: https://isaiasurrutia96.github.io/3D-World-4/checkpoints/driving-1/?drive=1&handling=fast

The HTML is the exact previously verified published viewer, including the
four circuits, kart, input cleanup, progressive steering, FPV, controls and
camera. No live source modules or external engine libraries are loaded.
The query selects driving mode in the unchanged viewer; its local app manifest
also starts in driving mode. Icons and manifest stay local to this archive.

Fast: 180 mph, 220 mph with boost. Low-speed steering builds to full in 0.5 s,
then blends to the existing 0.18 s response at high speed. The tire-force model,
lift-off slowing, braking and recoverable slides/spins are the approved version.

Full approved source: 0e488a2888268c702339e0ca1c054f092507933e.
Source tag: driving-source-1-2026-11-20.
Archive tag: driving-checkpoint-1-2026-11-20.
Use the source tag to inspect or restore racing files selectively; preserve
Claude's newer motion-core work and other live changes.

CHECKPOINT.json pins settings, source and all archive-file SHA256s. The existing
checkpoint build verifies these files before copying them to the published site.
Historical test reports are saved under checks/; they document the release
checks. CHECKPOINT-SMOKE.json verifies the exact frozen viewer separately.
