# Karts: choices, tiers and racing modes

The shared source of truth for kart designs, for the owner, Claude and Codex
(started 21 November 2026). Codex owns driving, handling and racing; Claude
builds look-only kart models when asked. A kart design never changes handling
unless the owner approves that separately. Like every owner decision, these
can change when something better is found (`docs/HOW-TO-WORK-WITH-ME.md`, E).

Related approved cards: free-roam driving (3) and custom kart building (18) in
`docs/FEATURES.md`; kart racing in `docs/MINIGAMES.md`.

## A. Confirmed by the owner (21 November 2026)

1. The current test kart (`racing-lab/src/reference-kart.js`) stays as it is
   and is not replaced. It is the **starter kart everyone begins with**.
2. New karts show in the **Test Lab**, next to the main kart, never instead
   of it.
3. Direction: **superkarts** (karts with full bodywork and small wings).
4. Ten concept images were made (Higgsfield, 21 November). From those:
   1 Classic, 2 Mini Formula, 3 Retro cigar, 4 Endurance prototype,
   5 Brawler, 6 Stealth wedge, 7 Rally, 8 Future, 9 Muscle dragster,
   10 Toy cartoon.
5. **Most expensive karts: 3, 4, 7 and 9.**
6. **Go-to (main) karts: 2 and 6.**
7. **Three racing modes: Regular kart, GT kart and F1 kart.** Each mode can
   have its own unique tracks.
8. Kart 7 (Rally) should drive better off road, **or** off-road parts could
   make any kart better off road. Which one (or both) is still open.
9. Players can own **several karts with different driving styles**.
10. Players will eventually modify their karts (see card 18). Deferred.
11. Presentation: concept sheets must show **big, easy-to-read numbers**.

12. (Later the same day) Mode names: **GoKart, GT GoKart and F1 GoKart**.
    Looks are a base for now and get refined after the bases are built.
13. Kart 4 reads as a Le Mans (endurance) car. The **GT GoKart takes the
    overall shape of kart 5 (Brawler), with its wheels covered**.
14. Driving feel per mode (owner and Codex will tune it):
    1. **F1 GoKart:** feels real, heavier, and the **fastest**.
    2. **GT GoKart:** feels real and somewhat heavy, with **more grip,
       handling and turning**; not as fast as F1.
    3. **GoKart:** lighter, **arcade feel with some realism**, a tiny bit
       slower.
15. Tracks per mode: F1 tracks suit F1 GoKarts, GT tracks suit GT GoKarts,
    and **GoKart tracks are smaller with sharper turns**.

## B. Proposed, not approved

1. Build karts from swappable parts described as data (body, nose, wings,
   wheels, paint), so choosing and modifying karts share one foundation.
2. Looks per mode: GoKart = open frame and bumpers (owner agreed in
   general); GT = wheels covered by fenders (agreed); F1 = open wheels, long
   nose, front and rear wings (agreed).

## C. Open questions

1. Are karts 2 and 6 the main karts for the F1 mode, or the main karts
   overall? (Not answered yet.)
2. Which mode do the expensive karts 3, 4, 7 and 9 belong to?
3. Off-road: Rally kart, off-road parts, or both (A8)?
