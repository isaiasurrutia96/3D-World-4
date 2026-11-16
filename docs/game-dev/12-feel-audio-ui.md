# 12 — Game Feel ("Juice"), Audio and Interface

## A) Juice

From "Juice it or Lose it" (Jonasson & Purho, 2012): a dull Breakout clone
becomes fun just by adding feedback, without changing the rules.

1. **Squash and stretch:** stretch on take-off, squash on landing or impact.
2. **Screen shake:** short, decaying, scaled to impact size. Use noise, not
   pure random jumps. Offer a "reduce shake" option.
3. **Hit stop:** freeze the involved objects for a few frames on impact
   (~2 frames light hit, 8–10 heavy). Makes hits feel heavy.
4. **Particles:** dust on landing, sparks on collision, confetti on success.
5. **Tweening:** UI and objects ease in/out instead of popping (ease-out-back
   for a little overshoot).
6. **Flash:** hit objects flash white for a frame.
7. **Trails** behind fast objects (balls, karts).
8. **Restraint:** juice the important moments; constant shaking is noise.

## B) Audio

1. **Every action needs a sound:** footsteps, jump, land, throw, hit, UI clicks.
   Sound sells weight more than visuals.
2. **Vary repeats:** randomize pitch (±5–10%) and pick among several samples.
3. **Layering:** a gunshot or impact = close punch + body + tail/echo.
4. **3D audio:** Web Audio `PannerNode` (Three.js `PositionalAudio`) for sounds
   that come from places.
5. **Engine sounds:** pitch rises with speed/RPM (racing).
6. **Mobile rule:** browsers block audio until the first tap; unlock the audio
   context on the first user gesture.
7. **Music:** adaptive layers that intensify with action; duck music under
   important sounds.

## C) Interface (HUD and menus)

1. **Minimal HUD:** show only what's needed now; context prompts ("Pick up")
   appear only when relevant.
2. **Readable at phone size:** large text, high contrast, safe-area insets for
   the notch and home bar.
3. **Feedback for every input:** buttons press visually; meters show timing
   zones clearly.
4. **Onboarding:** teach by doing, one mechanic at a time, instead of text
   walls.
5. **Accessibility:** remappable controls, subtitles, color-blind-safe
   colors, reduced motion/shake options, adjustable difficulty or assists.

## D) Deep dive: "The Art of Screenshake" (Jan Willem Nijman, Vlambeer, 2013)

He took a dull shooter and applied ~30 small tweaks, each making it feel
better. Highlights:

1. Basic animation and sound for everything; bigger bullets; faster shooting.
2. Muzzle flash; impact effects; enemies flash and get knocked back.
3. **Camera kick:** in Nuclear Throne a pistol shot pushes the camera ~6 px
   away from the aim direction and adds 4 to a screenshake value that decays
   quickly.
4. Lower enemy health (more kills, more feedback); more enemies.
5. Bigger explosions; smoke and debris that **stay** on the ground
   (permanence shows impact).
6. Sleep/hit stop on kills; slow motion moments; player knockback on firing.
7. Camera leads toward where you aim.
8. Too much becomes noise — tune down.

## E) Deep dive: Web Audio for games (MDN, web.dev)

1. Use **Web Audio API** (`AudioContext`, `AudioBufferSourceNode`) rather than
   `<audio>` tags: precise timing, many overlapping sounds, effects, 3D panning.
2. **Unlock on first gesture:** on the first tap/click call
   `context.resume()` (and optionally play a silent buffer). Pick one clear
   moment (e.g. a Start button). iPhone's silent switch mutes Web Audio and
   can't be detected.
3. **Audio sprites:** pack many short sounds in one file; play by offset and
   duration — fewer downloads.
4. **Limit voices:** cap simultaneous copies of the same sound (e.g. 4) and
   recycle the oldest.
5. **Positional audio:** `PannerNode` (Three.js `PositionalAudio` attaches it to
   objects); units are arbitrary, so set distance model and ref distance to
   match world scale.
6. Bluetooth headphones add ~100–300 ms that can't be compensated.
