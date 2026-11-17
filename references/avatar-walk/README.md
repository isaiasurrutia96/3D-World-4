# Avatar walking preview

Uses the saved Checkpoint 2 model, without changing its proportions or mesh generators. The source animation is the existing pinned SM64 `MARIO_ANIM_WALKING` (0x48), decoded from the same channels as `../sm64-walk/`. No Mario model or texture assets are used here.

Source step timing, swing progression, knee recovery timing, and shoulder/elbow curves drive the preview. This is an adaptation, not a direct copy of every joint angle. Actual saved thigh/calf lengths determine stride, clearance and support height. Two-bone IK seats the knees onto independent planted feet; only the existing ankle socket lip flexes. The body returns close to standing height during support rather than remaining in the previous crouch. The camera follows forward travel over a fixed floor grid.

One cycle takes 77/90 seconds. Normal playback moves approximately 0.99 m/s over a full-cycle distance of 0.8463 m. The video repeats five cycles. Half speed is selected initially; the GIF is also half speed.

From the repository root:

```sh
node references/avatar-walk/test.mjs
node references/avatar-walk/capture.mjs
node references/avatar-walk/encode.mjs
npm run build
```

Capture uses installed Chromium through Playwright; encoding uses ffmpeg. `source-walk.js` contains only the pinned bone offsets and animation channels. Intermediate frames and test metrics go under `/tmp/`. `public/references/avatar-walk/SOURCE.json` records measured bone lengths, foot contact and IK checks, plus media hashes.

The existing `/movement/` controller and frozen checkpoint remain untouched. Walking is being reviewed before integrating starts, stops, steering, mobile controls or running.
