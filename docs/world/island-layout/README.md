# LetsGo floating island layout

The owner chose the illustrated island as the overall design on 25 November 2026. The front and back views below use the same measured scene, laid out around that image.

[Selected island image](../floating-island-all-activities-concept.png) · [Front view](front-view.png) · [Back view](back-view.png) · [Shared plan and tunnel sections](layout-plan.png)

## A. Districts

1. **Front waterfront.** An inset diving lagoon and a winding lazy river sit below the main terrace. Stairs lead down from the promenade. The two large waterfalls spill from the front cliff beneath the skyway.
2. **Center.** The carnival has a Ferris wheel, carousel, mini golf, bowling, skee-ball, billiards and darts. The domed conservatory, fountain and garden walks sit uphill behind it. The S-kart road winds around the carnival, with check-in and staging by the front straight.
3. **West terraces.** Full golf and disc golf use the green slopes beneath the mountain tunnel.
4. **East terraces.** The upper terrace has basketball shooting, soccer penalties, baseball batting, football throwing, archery and paintball. The lower one has the obstacle course, jumping events and skate racing.
5. **Rear ridge.** The snow peak, ski slope, ice-skating loop and alpine village occupy the rear terraces. A footbridge crosses above the ski slope. Smaller cascading pools lead down toward the gardens.

## B. Connected routes

| Route | Measured layout |
| --- | --- |
| F1 sky circuit | Closed 1,396 m lap around the compact island with a 58 m mountain tunnel in the northwest. The route emerges beside the ski ridge and curves back around the rear. Road width is 13.76 m. |
| S-kart circuit | Closed 564 m lap around the carnival with a staging apron and three walking bridges into the precinct. Road width is 6.88 m. |
| Swim-through | A 29 m covered stretch connects the lazy-river basin to the diving lagoon at a single water level. |
| Walking network | 15 shared district gates, including access to both lagoons, a skyway overlook and the S-kart staging area. |

1. The owner's reference sets the compact perimeter. The tunnel approach uses a tighter sequence of turns between long, open sweepers. The full Nürburgring GP outline is documented in the earlier route study. [Nürburgring study](../connected-island/README.md)
2. The plan uses grouped 4.30 m terrain cells on the approved 43 cm block grid. Both views use the same coordinates and opposite cameras. Road continuity and clearance, isolated race decks, covered tunnel lengths, a connected wet channel and joined walking decks were checked numerically.
3. Lap lengths, slopes and individual venue dimensions are review measurements for this layout. Driving and swimming feel belong to in-game testing. [Layout coordinates](layout.json) · [Verification results](checks.json) · [World blocks](../../WORLD-RULES.md) · [Minigame cards](../../MINIGAMES.md)

## C. Rebuild the views

1. Run `python build_layout.py` and `python draw_plan.py` with NumPy, SciPy and Matplotlib to reproduce the coordinates, verification results and plan.
2. Run `blender -b --python scene.py` with Blender 4.3 for the two transparent renders. Run `python compose_views.py ../connected-island/sky-plate.png` with Pillow to composite the views over the archived cloud plate.
