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

## B. Working rules for this list

1. When two versions are side by side, change only the new one unless the owner says otherwise (owner, 23 November
   2026: "I wish u did it only to the new one so i can see the difference").
