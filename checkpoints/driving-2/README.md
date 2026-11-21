# Driving checkpoint 2 — approved tire and handling tune

Approved by the owner on 20 November 2026 after testing the small tire upgrade.
Keep this archive immutable. Continue future changes on the live racing code.

Open: https://isaiasurrutia96.github.io/3D-World-4/checkpoints/driving-2/?drive=1&handling=fast

This is the exact self-contained viewer the owner approved. All four tracks,
keyboard/touch/gamepad controls, camera views, FPV and Home Screen resume fixes
are included. The query selects driving mode in the unchanged viewer; its
manifest and installation icons are local to this checkpoint.

Compared with Driving Checkpoint 1, Fast has 6% more cornering grip and a
slightly shorter lateral settling response (.140 to .135 seconds). Input
response, speed/acceleration, braking, lift-off, boost, geometry and other
profiles retain their approved settings. Normal/boost caps remain 180/220 mph.
Physics fingerprint: kart-v1-c0934f4555677c0e.

Approved source: 97d2ba878f4a4ba4f0cbcb02b3613f97fc1e8b73.
Source tag: driving-source-2-2026-11-20.
Archive tag: driving-checkpoint-2-2026-11-20.
The source tag saves the complete repository revision. Restore racing files
selectively so newer movement work by Claude remains intact.

PROFILES.json saves all settings. CHECKPOINT.json pins archive and source
SHA256s; the standard checkpoint build verifies the archive before publishing.
checks/ contains the source release evidence and fresh numerical rechecks.
CHECKPOINT-SMOKE.json verifies this exact frozen viewer on desktop and phones.
Driving Checkpoint 1 and all other existing checkpoints remain unchanged.
