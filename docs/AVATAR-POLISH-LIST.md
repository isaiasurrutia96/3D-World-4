# New avatar: polish list

The owner and Claude go over the avatar piece by piece and write every issue here first. **Nothing on this list is
fixed until the owner has gone through it and says to fix it** (owner, 23 November 2026: "ur not supposed to
immediately try to fix that just make a note ... once we go [through] it we can actually fix it").
Each item: what it is, its measured cause, the proposed fix (not applied), and the owner's decision.

## A. Items

1. **Forearm: a faint line about a third of the way down, just below the elbow cup.** Fixed on the 6 ft 4 in version
   (owner, 23 November 2026: "Lets do the forearm first, smooth it out").
   - First diagnosis (the original forearm's profile, coarse rings) was wrong: smoothing the original shape left the
     line. Measured cause, by rays down the finished forearm's front: the side widens at about 12 degrees and then
     flattens to about 0 within 2 to 4 mm, 14.2 cm below the elbow ball, at the forearm's middle. The rounded forearm's
     widening top meets its straight lower part at its middle, and the shortening to Our avatar's joint-to-joint length
     squeezes that middle the most (about 3.3 times), turning a gentle bend into a crease.
   - Fix (`smoothForearmMiddle`, on the 6 ft 4 in version only): the finished forearm's profile smoothed around its
     middle (local linear regression with Gaussian weights, 1.2 cm, per direction round the forearm), and the forearm
     built from finer rings (twice as many each way, including its straight lower part). The original profile is kept.
   - Result: the sharpest change in shading down the visible forearm is 0.9 degrees per 2 mm (was 3.6 on the version
     beside it, 12.6 on the first attempt); before-and-after close-ups show the line gone. Sealed; page check passes.
   - Still to do when the owner says: put it on the shorter version too (or keep only the 6 ft 4 in version).
2. **Hand: a small flaw near the fingertips** (four edges shared by more than two triangles, in the original hand
   shape). Cause and fix to be looked at in the review. Owner decision: pending.
3. **Some limbs look slightly faceted along their outline in close-ups** (the original limb shapes have few sides).
   Cause and fix to be looked at in the review. Owner decision: pending.

4. **Waist line looks like it can only turn** (owner, 23 November 2026: "it looks like it can only rotate cus the bottom
   torso and top torso look like the cutout is too sealed"). A flat, level, tight cut reads as a swivel. Proposed (not
   applied): make the cut a curved surface centred on the hidden joint ball (the pelvis top a gentle dome, the chest's
   underside a matching cup, both concentric with the pivot), the way ball-jointed dolls and action-figure ab joints
   are built, so the chest visibly can tilt forward, back and sideways over the pelvis without a gap opening or the
   pieces colliding. Owner: "can you do that and show me a pic".
   - Tried (23 November 2026), not on the page: `splitTorsoCurved` (a spherical shell cut around the hidden pivot,
     closed with the sockets' own fill, now shared as `fillRimOnPath`; the sockets checked byte-identical after that
     change). At 45 degrees, and again at 25, the edge inside the gap came out ragged with streaks: the slanted cut
     leaves the chest's lower edge a thin wedge that the 5 mm rounding cannot round cleanly. Not solved; the flat waist
     stays on the page. Paused while the owner decides about an invisible spine and a third torso piece (item 6).
6. **Bending forward looks odd** (owner, 23 November 2026: "he might need an invisible spine, or something cus it looks
   odd when he bends forward, let me know what u think before u try to fix that"). Then the owner's own idea, an
   imaginary ball between chest and pelvis that carves sockets like every other joint but is never drawn, and then a
   spine. Built in pictures on the 6 ft 4 in version (handoff items 83 and 84): three pieces (chest, belly, pelvis) on
   two imaginary balls, bending shared with the hips by measured human data. **Waiting for the owner's "approved"; not
   on the page.** This also answers item 4 differently: the flat lines stay, and the hidden balls give the pivots.
7. **The torso's triangle count grows with every cut** (about 76,600 before any cut, 182,000 with the waist line on
   the page now, about 263,000 with the spine's two lines): each cut refines the surface around it. Not urgent in the
   prototype; the rebuild makes every piece lean. Owner decision: pending.
8. **In deep forward bends the back shows open wedges, like stacked plates** (rigid pieces turning about hidden balls
   that sit near the back). Front overlap is fine with the owner; the back wedges have not been discussed yet. Owner
   decision: pending.
5. **Joint balls stay 300 triangles** (confirmed decision, for smooth movement and frame rate): not on this list as a
   fix. The rebuild makes every piece lean (the prototype is about 517,000 triangles).

## B. Working rules for this list

1. When two versions are side by side, change only the new one unless the owner says otherwise (owner, 23 November
   2026: "I wish u did it only to the new one so i can see the difference").
2. How to ask for approval (owner, 23 November 2026): "check the pics, let me know what u think, if u like it say
   approved". Then push once the owner says approved.
