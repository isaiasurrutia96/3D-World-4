# SM64 walking animation reference

This reference uses the original `MARIO_ANIM_WALKING` (`0x48`) animation channels and high-detail Mario model from `n64decomp/sm64`, revision `9921382a68bb0c865e5e45eb594d9c64db59b1af`. It is a new, in-place reference render, not footage recorded from the game. Face textures are simple substitutes; the mesh, rig offsets, joint rotations and vertical motion are read from the source data.

The pose hierarchy follows `mario_geo_body` and the default closed-hand branches: 20 animated nodes and 15 visible body parts. The original 77-frame channel table has 2,549 signed values and 126 count/index entries. Matrices use the game's `mtxf_rotate_xyz_and_translate` formula. Translation multiplier is 1: Mario's default `unkB0 = 0xBD` matches the animation's 189 divisor. No planted-foot solver or hip-height corrections are applied.

Normal playback uses the source walk's mid-speed setting: forward speed 12 gives animation advance 12/4 = 3 source frames per 30 Hz game tick. The MP4 resamples this 90-source-frames/second timeline to 60 fps, over five cycles. The GIF shows a single cycle at half that speed. The page defaults to half-speed playback so poses are easier to inspect.

Files under `public/references/sm64-walk/` are the deliverable: a phone-friendly video player, MP4, slow GIF, poster and source metadata. Vite copies these assets unchanged to `dist/references/sm64-walk/`. This work does not edit the avatar, locomotion code or checkpoint files.

Reproduction requires Python/Pillow, the project's Playwright/Three dependencies, Chromium and ffmpeg. `extract.py` downloads the three pinned source files into `/tmp`, `textures.py` creates the simplified reference face graphics, and `capture.mjs` renders the 77 integer poses. Capture size is 720 × 900. The source data are downloaded only for generation; the published video page needs no 3D runtime or external assets.
