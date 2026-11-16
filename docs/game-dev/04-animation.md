# 04 — Animation

## A) Basics

1. **Skeletal animation:** a mesh is bound to bones; animations rotate bones
   over time. Three.js: `SkinnedMesh`, `AnimationMixer`, `AnimationClip`.
2. **Procedural animation:** bones/parts are rotated by code (sine waves for a
   walk cycle, lean into turns). The clay avatar in 3D-WORLD-3 is fully
   procedural. Cheap, tunable, no files needed.
3. **The 12 animation principles (Disney)** apply directly: squash and stretch,
   anticipation (a crouch before a jump), follow-through, ease in/out, arcs,
   exaggeration. Anticipation must be very short in games or controls feel
   laggy — move the body immediately, put anticipation in the pose.

## B) Blending

1. **Cross-fade** between clips over ~0.1–0.25 s to avoid pops.
2. **Blend trees / blend spaces:** mix walk and run by speed, and strafe
   directions by angle, so movement speed always matches the legs.
3. **Layers:** upper body plays "aim/throw" while lower body plays "run".
4. **Foot sliding** happens when animation speed doesn't match movement speed.
   Fix by scaling playback rate with speed, or by root motion.

## C) Root motion vs in-place

1. **In-place:** code moves the character; animation plays on the spot.
   Responsive; standard for platformers and shooters.
2. **Root motion:** the animation itself moves the character. Realistic weight
   (GTA, sports games) but less responsive. Many games mix: root motion for
   special moves, code-driven for basic movement.

## D) Inverse kinematics (IK)

1. IK solves joint angles so a hand or foot reaches a target.
2. **Foot IK:** raycast under each foot and adjust the leg so feet sit on
   slopes and stairs.
3. **Hand IK:** hands stay on a ledge while climbing, on a steering wheel, on a
   ball before a throw.
4. Two-bone IK (upper arm/forearm, thigh/shin) has a simple exact solution with
   the law of cosines.

## E) Advanced techniques used by AAA games

1. **Motion matching (Ubisoft, For Honor, GDC 2016, Simon Clavet):** instead of
   hand-built transitions, search a big database of motion capture every few
   frames for the clip whose pose and future trajectory best match what the
   player wants. Very natural, but needs lots of mocap data and CPU. Not
   practical for this project.
2. **Euphoria / active ragdoll (GTA IV, GTA V, Red Dead):** characters are
   physics bodies with simulated muscles that try to keep balance and protect
   themselves while falling or being hit, layered on top of normal animation.
   Plain ragdoll is limp physics used for unconscious characters.
3. **Motion capture + facial capture (Call of Duty):** actors' bodies and faces
   recorded together; characters are digital doubles of the actors.

## F) For this project

Procedural animation fits a stylized clay character and costs nothing to load.
If clips are ever needed, use glTF files with an `AnimationMixer`.
