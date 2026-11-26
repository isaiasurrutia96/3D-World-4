# Floating island route study

26 November 2026 · Proposed visual layout for the LetsGo world.

The front garden view and back alpine view come from the same scene. Roads,
terrain, venue pads, water, and portal positions are shared between cameras.
The plan sketch is drawn from those same coordinates. [Front view](front-view.png) ·
[Back view](back-view.png) · [Plan and tunnel sections](layout-plan.png)

## A. Race and water routes

| Route | Length | Layout |
| --- | ---: | --- |
| F1 skyway | 2,155 m | Closed Grand Prix-derived centreline with a 66 m mountain bore, extended clear-air spans, 13.76 m road width and 2.91% maximum centreline grade. |
| S kart circuit | 293 m | Independent closed route on the carnival terrace, 6.88 m road width and 3.03% maximum centreline grade. |
| Swim-through | 18 m under cover | Two lagoon basins share one continuous water level through the masonry bore. The tunnel is independent of the F1 road. |

1. The F1 route is a uniform 42% plan-scale adaptation of the Nürburgring
   **Grand Prix** centreline, lightly smoothed between source points. Track
   elevations, road width, supports, and the tunnel are for this floating
   island. [FIA 2020 Eifel Grand Prix circuit map](https://www.fia.com/sites/default/files/decision-document/2020%20Eifel%20Grand%20Prix%20-%20Circuit%20Map.pdf) · [Survey source](https://github.com/bacinger/f1-circuits)
2. Rough terrain uses grouped 4.30 m cells aligned to the approved 43 cm
   grid. The terrain is cleared at road and water openings, with smooth
   road surfaces over the blockwork. The island connects its outdoor
   and indoor activity terraces via 13 venue gates.
3. The layout checks sampled both roads across their widths, checked
   terrain clearance in both bores, and found no centerline crossings
   or nonadjacent road-strip overlap. A four-neighbor flood fill checked
   the continuous wet surface between the lagoon basins. The two
   circuit centerlines have at least 14.6 m of plan separation in this
   layout. [Check results](checks.json) · [Shared layout data](layout.json)

## B. Activity layout

1. The carnival and its short kart circuit occupy the northwestern
   plateau, beside the full golf and frisbee golf areas. The carnival
   court contains mini golf and the open bowling, skee-ball, billiards,
   and darts pavilions.
2. The eastern sports terrace has basketball shooting, soccer penalties,
   baseball batting, American football throwing, archery, and paintball.
   Below it are the obstacle course, the jump stations, and the skatepark.
3. Ski gates run down the snow ridge. A separate ice skating circuit has
   its own approach on the lower shelf. The southern swimming terraces
   include water entries and the diving board. The two southern
   waterfalls and the smaller north garden cascade have their own
   spillways.
4. The art shows planned venues and circulation for review. Physics,
   camera at player height, driving feel, and final venue dimensions
   belong to the build and playtest stages. [Minigame cards](../../MINIGAMES.md) ·
   [Block cards](../../WORLD-RULES.md)

## C. Rebuild the review images

1. Use `build_layout.py` with Python, NumPy, SciPy and Matplotlib to
   regenerate the shared terrain and routes. `draw_plan.py` draws the
   plan. The transformed survey is saved with its MIT notice.
2. Render the two cameras with Blender 4.3 using
   `blender -b --python scene.py`. Composite each alpha render over the
   supplied sky plate. The back presentation mirrors the sky plate.
