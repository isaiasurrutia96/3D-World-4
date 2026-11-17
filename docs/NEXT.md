# Movement roadmap and saved requests

Recorded 17 November 2026.

1. Movement should feel like Super Mario 64 as if it were made today:
   modern, grounded, with real foot contact.
2. Use foot locking (step 3 of the plan): planted feet stay fixed on the
   ground while the body moves; legs bend with IK; feet step when the body
   gets too far ahead. No gliding or sliding.
3. Focus on the feet. The owner may build new feet (with Claude Code) for
   natural foot movement; foot locking should work with those feet.
4. Status: the earlier foot-locking attempt was deleted at the owner's request.
   A fresh flat-floor walking/running test now lives under `movement/`, using
   the Checkpoint 2 assembly, world-space planted contacts, leg IK, foot roll,
   analogue floating joystick and independent right-side camera touch.
   This stage covers the flat slab; terrain, jumping and the remaining SM64
   actions still need development. Keep the frozen checkpoint intact.

## Owner favourite (remember)

5. The owner **really likes the banked NASCAR-style oval** (Oval Lab,
   `src/oval.ts`, from 3D-WORLD-3 commit 17d170b). Keep it; build on it.
