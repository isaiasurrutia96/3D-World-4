# Synchronized motion comparison

The owner found the previous avatar preview looked like walking while the Mario reference looked like running. The earlier retarget used its own stance, knee recovery and hip-height curves, so equal clip durations did not make the movements comparable.

This version pairs original source frame `f` with avatar frame `f`. Both arms and both legs use the original source limb directions, including the full knee folding and recovery, without independent phase offsets or attenuation. Hip bounce follows the original curve scaled to the avatar's measured leg length. Saved mesh generators and limb lengths are unchanged. Both characters perform the animation in place; this is a pose comparison before gameplay foot locking and steering.

`../avatar-walk/matched.js` constructs this independent comparison model. The old avatar preview and saved checkpoint remain available. The new deliverable is `/references/motion-compare/`, with one composite video and one shared player, guaranteeing frame synchronization through playback, pausing, seeking and speed changes. Normal playback uses the same 90 source frames/second as the original Mario clip; Slow halves both together.

Reproduce from the repository root, after generating the original 77 Mario frames using `../sm64-walk/`:

```sh
node references/motion-compare/test.mjs
node references/motion-compare/capture.mjs
node references/motion-compare/encode.mjs
npm run build
```

The capture reuses `/tmp/sm64-reference-render/frames/` instead of rebuilding Mario's artwork. Intermediate output goes to `/tmp/motion-compare-render/`. `SOURCE.json` records the measured source-direction errors, unchanged avatar bone lengths and media hashes.
