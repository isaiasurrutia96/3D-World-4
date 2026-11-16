# 14 — Sources

Collected 16 November 2026. Community sources are marked; treat their exact
numbers as starting points to tune.

## A) Foundations and feel
1. Glenn Fiedler, "Fix Your Timestep" — gafferongames.com/post/fix_your_timestep/
2. Jakub Tomšů, input in fixed timestep — https://jakubtomsu.github.io/posts/input_in_fixed_timestep
3. Martin Jonasson & Petri Purho, "Juice it or Lose it" (GDC 2012); summary — https://gamejuice.pages.dev/articles/juice-it-or-lose-it-lessons
4. Coyote time / buffering (community) — https://gamemaker.io/fr/blog/flynn-advanced-jump-mechanics

## B) Super Mario 64
1. n64decomp/sm64 decompilation — https://github.com/n64decomp/sm64
2. Ukikipedia (community wiki: surfaces, quarter steps, camera) — https://ukikipedia.net
3. The Cutting Room Floor, SM64 bugs — https://tcrf.net/Bugs:Super_Mario_64_(Nintendo_64)
4. Wikipedia, Super Mario 64 (development, camera first) — https://en.wikipedia.org/wiki/Super_Mario_64

## C) Cameras and animation
1. John Nesky, "50 Camera Mistakes" (GDC 2014) — https://gdcvault.com/play/1020460/50-Camera
2. Simon Clavet, "Motion Matching and The Road to Next-Gen Animation" (GDC 2016) — https://www.gdcvault.com/play/1022985/Motion-Matching-and-The-Road
3. Euphoria in GTA IV — https://www.gamedeveloper.com/pc/product-i-grand-theft-auto-iv-i-using-naturalmotion-s-euphoria

## D) GTA V
1. Adrian Courrèges, GTA V Graphics Study (parts 1–3) — https://www.adriancourreges.com/blog/2015/11/02/gta-v-graphics-study/
2. Development of Grand Theft Auto V — https://www.wikipedia.org/wiki/Development_of_Grand_Theft_Auto_V

## E) Call of Duty and shooters
1. Activision research, controller-to-display latency — https://www.activision.com/cdn/research/Hogge_Akimitsu_Controller_to_display.pdf
2. Modern Warfare II engine tech — https://www.callofduty.com/blog/2022/12/call-of-duty-modern-warfare-II-next-gen-tech-advanced-game-performance
3. Modern Warfare photogrammetry — https://gamesbeat.com/call-of-duty-modern-warfares-photogrammetry-captures-gritty-realism-like-never-before/
4. Modern Warfare sound/gun recording — https://www.inverse.com/article/58506-call-of-duty-modern-warfare-gun-bench-scanning-captain-price-sound
5. Weapon behavior changes in MW — https://gamesradar.com/heres-why-call-of-duty-modern-warfares-weapons-may-feel-a-little-different-than-you're-used-to
6. Aim assist: Witchfire devs — https://www.theastronauts.com/2019/02/witchfire-aim-assist ; Halopedia — https://www.halopedia.org/Aim_assist
7. Valve, Source Multiplayer Networking — https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
8. Yahn Bernier, Latency Compensating Methods — https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization

## F) Racing
1. "Vehicle Physics and Tire Dynamics" (GDC) — https://gdcvault.com/play/1026035/Vehicle-Physics-and-Tire-Dynamics
2. Need for Speed Heat handling model — https://ea.com/games/need-for-speed/need-for-speed-heat/news/under-the-hood-the-handling-model
3. Mario Kart Mini-Turbo (community wiki) — https://www.mariowiki.com/Mini_Turbo
4. Game AI Pro, AI in racing games — https://www.gameaipro.com/GameAIPro/GameAIPro_Chapter38_An_Architecture_Overview_for_AI_in_Racing_Games.pdf

## G) Sports
1. Iwata Asks: Wii Sports — https://iwataasks.nintendo.com/interviews/wii/wii_sports/0/0
2. Engadget, Wii Bowling has no random variables — https://www.engadget.com/2006-10-25-wii-sports-has-depth.html
3. Golf three-click swing history — https://wireframe.raspberrypi.com/articles/killer-feature-golfs-innovative-control-method
4. Golf ball aerodynamics (open-source model) — https://docs.rs/crate/opengolfcoach/0.3.0/source/src/trajectory.rs
5. Basketball free throw physics (Tran & Silverberg) — https://www.nbcnews.com/id/wbna48270436 ; arXiv 1702.07234
6. NBA 2K15 shot meter (designer posts, community) — https://www.osftw.com/news/756249/nba-2k15-new-shot-meter-explained
7. Madden passing guides (community) — https://primagames.com/gaming/madden-nfl-25-passing-guide-controls-settings-pass-types-and-more
8. Bowling physics — https://www.real-world-physics-problems.com/physics-of-bowling.html ; UC Davis simulation — https://research.engineering.ucdavis.edu/biosport/bowling-collision-simulation-using-blender

## H) Web tech
1. Three.js performance tips — https://www.utsubo.com/blog/threejs-best-practices-100-tips
2. Physics engines for the web — https://developer.playcanvas.com/user-manual/physics/ammo-alternatives/
3. C++ vs JavaScript for games (opinion) — https://discourse.threejs.org/t/why-isnt-threejs-considered-a-serious-game-development-option-main-shortcomings/63807

## I) Added in the deep-research pass
1. Celeste & TowerFall Physics (Maddy Thorson) — https://maddymakesgames.com/articles/celeste_and_towerfall_physics
2. SM64 speeds and gravity (community) — https://ukikipedia.net/wiki/Speed ; https://tasvideos.org/GameResources/N64/SuperMario64
3. Gaffer on Games, Networked Physics / Deterministic Lockstep — https://gafferongames.com/post/deterministic_lockstep/
4. Rocket League physics (GDC 2018, Jared Cone) — https://www.gdcvault.com/play/1024972/
5. Toyful Games raycast car (via open reimplementation) — https://awesome.ecosyste.ms/projects/github.com%2Femilymclean%2Funitycardemo
6. Rapier character controller — https://rapier.rs/docs/user_guides/javascript/character_controller
7. Unity CharacterController manual — https://docs.unity.com/en-us/engine/current/manual/physics-section/physics-overview/character-control-section/class-character-controller
8. Cinemachine Composer docs — https://docs.unity3d.com/Packages/com.unity.cinemachine@2.7/manual/CinemachineAimComposer.html
9. Allen Chou, numeric springing — https://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing
10. David Rosen, An Indie Approach to Procedural Animation (GDC 2014) — https://gdcvault.com/play/1020049/Animation-Bootcamp-An-Indie-Approach
11. Power IK walk node (procedural stepping) — https://poweranimated.github.io/unreal/walk_node
12. Halo "30 seconds of fun" — https://www.engadget.com/2011-07-14-half-minute-halo-an-interview-with-jaime-griesemer.html
13. Steve Swink, Game Feel (summary) — https://arxiv.org/pdf/2011.09201
14. Vlambeer, Art of Screenshake — https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games
15. Nintendo four-step level design — https://www.mcvuk.com/development/video-nintendos-level-design-secrets-in-four-steps ; https://kotaku.com/what-made-super-mario-3d-world-so-great-1691916400
16. Breath of the Wild GDC 2017 — https://www.engadget.com/2017/03/12/breath-of-the-wild-gdc-talk/
17. Super Mario Odyssey design analysis — https://gamedeveloper.com/design/mario-64-v-odyssey
18. USBC bowling ball motion (skid-hook-roll) — https://www.bowlingball.com/BowlVersity/Bowling-Ball-Motion-Phases-And-Transition-Points
19. Wii MotionPlus (Iwata Asks) — https://iwataasks.nintendo.com/interviews/wii/wiimotionplus/0/0
20. NBA 2K25 shot timing — https://www.operationsports.com/nba-2k25-shot-timing-visual-cue-explained ; https://www.nba2klab.com/2k25-shot-profile
21. NBA Jam — https://en.wikipedia.org/wiki/NBA_Jam_(1993_video_game)
22. Madden zone logic — https://www.ea.com/inside-ea/news/gridiron-notes-madden-nfl-23-gameplay-foundational-football
23. GTA V handling guide — https://eddlm.github.io/Handling-Tools/guide
24. GTA V wanted level — https://gta.wiki/wiki/Wanted_Level_in_GTA_V
25. Mario Kart item tables — https://www.mariowiki.com/Mario_Kart_Wii_item_probability_distributions ; MrL314 AI video — https://hackaday.com/2022/07/04/think-you-know-how-mario-kart-works
26. CoD map design — https://news.xbox.com/en-us/2025/10/27/how-treyarch-crafts-multiplayer-maps-call-of-duty-black-ops-7/ ; spawn patent — https://www.patentarcade.com/video-game-patent/US10226701/system-and-method-for-identifying-spawn-locations-in-a-video-game
27. Aim assist (Witchfire) — https://www.theastronauts.com/2019/02/witchfire-aim-assist
28. Input latency research — https://arxiv.org/pdf/2506.19084
29. Three.js toon material — https://threejs.org/docs/pages/MeshToonMaterial.html
30. Web Audio for games — https://web.dev/articles/webaudio-games ; https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games
31. Red Blob Games, A* — https://www.redblobgames.com/pathfinding/a-star/introduction.html
32. Object pooling in JS — https://www.abratabia.com/game-architecture/object-pooling.php

Note: direct page reading was blocked by this session's network policy; this
pass used search results, so details marked "community" should be verified
before relying on exact numbers.
