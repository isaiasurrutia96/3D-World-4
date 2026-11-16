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
