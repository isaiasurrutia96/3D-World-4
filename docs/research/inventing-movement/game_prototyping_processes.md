# Proven processes for building brand-new gameplay systems (with a focus on movement, controls and physics)

*Research note, 23 November 2026. How the sources were gathered: this session's network blocked direct page fetches (gamedeveloper.com, gdcvault.com, wikipedia.org, maddymakesgames.com, extremeprogramming.org and others failed to resolve). So every finding below comes from web-search result summaries and snippets of the cited pages, not from full reads. Exact wording and numbers should be checked against the originals before anyone quotes them as final. Evidence labels: **[primary]** means the developers' own talk, slides, article or interview. **[secondary]** means press or another writer summarising them. **[measured]** means a count or metric. **[anecdotal]** means a practitioner's experience or opinion.*

## 1. What are the established practices for going from "no system exists" to a working, fun system?

### Takeaway
The proven processes share one loop: build the smallest playable thing that tests the core feel, play it right away, keep what is fun, cut or throw away the rest, and repeat in short timeboxes before investing in content or art. The named methods differ mainly in scale:
- **Small, fast experiments:** spikes, 7-day prototypes, toy-first rooms.
- **Testing a level's shape:** greybox or blockout levels.
- **Go/no-go milestones:** Cerny's publishable first playable, vertical slices.
- **The tuning layer that comes last:** game feel and juice work.

Nearly all the evidence is case-based and anecdotal. No controlled studies compare these processes.

### Cited Findings

**Rapid prototyping in a week (Experimental Gameplay Project, Kyle Gabler / 2D Boy)**
- The Experimental Gameplay Project ran in spring 2005. Four Carnegie Mellon grad students worked under three constraints: each game had to be made in under a week, by one developer, on a shared theme such as "gravity" or "vegetation". They made about 50 games in one semester [primary/measured]. — [Gamasutra article mirror, "How to Prototype a Game in Under 7 Days"](https://www.cs.hmc.edu/~markk/SWE_copies/gabler_prototyping.html); [Escapist](https://www.escapistmagazine.com/prototype-making-games-in-seven-days-or-less/)
- The authors' main lesson was that short cycles beat long ones and that most gameplay ideas can be prototyped well in under a week [primary, anecdotal]. — [Gamasutra article mirror](https://www.cs.hmc.edu/~markk/SWE_copies/gabler_prototyping.html)
- Gabler built Tower of Goo in about a week. It became the seed of World of Goo (2008), so this is a direct prototype-to-hit lineage [primary/secondary]. — [GDC 2006 Gabler talk recording, Internet Archive](https://archive.org/details/GDC2006Gabler); [Tomorrow Corporation (Wikipedia)](https://en.wikipedia.org/wiki/Tomorrow_Corporation)
- Critique: Jesper Juul argued that the one-week format makes basic mechanics easy to prototype but makes a finished-feeling game harder to reach. He suggested a two-week, two-person variant [secondary, opinion]. — [Jesper Juul, The Ludologist](https://www.jesperjuul.net/ludologist/2005/10/29/how-to-prototype-a-game-in-under-7-days/)

**Spike solutions (Extreme Programming)**
- A spike is "a very simple program to explore potential solutions" to a hard problem. Beck's advice: "Build a system which only addresses the problem under examination and ignore all other concerns." The goal is "reducing the risk of a technical problem or increasing the reliability of a user story's estimate" [primary via secondary quotation]. — [C2 wiki, SpikeSolution](https://c2.com/xp/SpikeSolution.html); [Extreme Programming Installed (O'Reilly)](https://www.oreilly.com/library/view/extreme-programming-installed/0201708426/0201708426_ch06lev1sec3.html)
- Spikes are expected to be thrown away. Beck is quoted as saying "Most spikes are not good enough to keep, so expect to throw it away." Ward Cunningham's wiki says spikes "should take minutes in most cases, not hours." The name is linked to "driving a spike through the entire design," meaning a thin vertical cut that tests feasibility [secondary quotations of primary]. — [C2 wiki](https://c2.com/xp/SpikeSolution.html); [James Shore, The Art of Agile Development: Spike Solutions](https://www.jamesshore.com/v2/books/aoad1/spike_solutions); [Spike (software development)](https://www.wikipedia.org/wiki/Spike_(software_development))
- Beck also called it an "architectural prototype" and said spikes are for when "you are knowledge limited, not time limited" [secondary quotation]. — [C2 wiki](https://c2.com/xp/SpikeSolution.html)

**Toy-first design (Will Wright, Shigeru Miyamoto)**
- Will Wright called SimCity (1989) a "toy," not a game: an open-ended simulation that cannot be won or lost. He has said he "always wanted it to be much more open-ended, more of a toy." The idea grew from his discovery that building maps in his own level tool for Raid on Bungeling Bay was more fun than the game itself [primary interview and secondary]. — [Museum of Play, Will Wright's notebooks](https://www.museumofplay.org/blog/will-wrights-video-game-notebooks/); [Game Developer, The Replay Interviews: Will Wright](https://gamedeveloper.com/business/the-replay-interviews-will-wright); [SF Encyclopedia](https://sf-encyclopedia.com/entry/wright_will)
- Amanda Cote's academic paper ("I really think of these things more as toys") studies Wright's design notebooks. It explains why he calls himself a toymaker and traces toy-based inspiration back to SimCity [secondary, scholarly]. — [DiGRA paper](https://dl.digra.org/index.php/dl/article/download/2115/2114/2111)
- Super Mario 64 started as a movement toy, not as levels. Miyamoto (1996): "There was a room made of simple lego-like blocks, and Mario and Luigi could run around in there, climb slopes, jump around, etc. It gave us, as designers, a chance to play around with Mario in a diorama world" [primary, translated interview]. — [Shmuplations, Super Mario 64 interviews](https://shmuplations.com/mario64/)
- That block room ran on Silicon Graphics workstations before the N64 hardware was finished. Secondary accounts say the team spent months on little beyond the feel of movement, and that Miyamoto asked designers for as many movements as possible [secondary]. — [Super Luigi Bros guide](https://superluigibros.com/super-mario-64/); [The Cutting Room Floor, SM64 early development](https://tcrf.net/Prerelease:Super_Mario_64_(Nintendo_64)/Early_Development)

**Finding the fun (Valve, Nintendo, Supergiant)**
- Valve's first version of Half-Life was scrapped. The recovery started with a small group that put "every interesting idea that existed in a working state into a single prototype level." They then studied why that level was fun, a quality Ken Birdwell called "experiential density." The cross-discipline "Cabal" groups (with rotating membership to avoid burnout) then wrote a design document of over 200 pages [primary article via secondary excerpts]. — [Ken Birdwell, "The Cabal: Valve's Design Process for Creating Half-Life" (1999)](https://www.gamedeveloper.com/design/the-cabal-valve-s-design-process-for-creating-i-half-life-i-); [excerpt repost](https://rapidnotes.wordpress.com/2014/05/18/the-cabal-valves-design-process-for-creating-half-life/); [Process Street summary](https://www.process.st/organizational-management/)
- At Nintendo, Super Mario Odyssey director Kenta Motokura preferred to call brainstormed gameplay concepts "prototypes," and the team's only aim was a fun experience [secondary interview]. — [GeekDad interview](https://geekdad.com/2017/10/super-mario-odyssey-developer-interview/)
- Supergiant: Greg Kasavin said early access was "the very first thing that we decided, before anything else on Hades." Hades was in early access from December 2018 and released in full in September 2020, so live player feedback became the iteration loop [primary interview]. — [RPG Site interview (2026)](https://www.rpgsite.net/interview/20348-supergiant-games-interview-2026-greg-kasavin-darren-korb-hades-2-ending-music-future-coffee); [Hades (Wikipedia)](https://en.wikipedia.org/wiki/Hades_(video_game))
- Pyre's concept "came out from prototyping several game ideas," and Supergiant spent "a lot of time prototyping the art and audio" for Transistor [secondary quoting the developers]. — [Pyre (Wikipedia)](https://en.wikipedia.org/wiki/Pyre_(video_game)); [Transistor (Wikipedia)](https://en.wikipedia.org/wiki/Transistor_(video_game)); [Game Maker's Notebook podcast with Amir Rao and Greg Kasavin](https://interactive.libsyn.com/hades-with-supergiant-games-amir-rao-and-greg-kasavin)

**Prototyping philosophy (Chris Hecker, Chaim Gingold, Jonathan Blow)**
- Hecker and Gingold's "Advanced Prototyping" (GDC 2006) drew on Spore and four years of Indie Game Jams. It was reportedly the highest-rated talk of that GDC, above Will Wright's [primary page; secondary report]. — [Chris Hecker, Advanced Prototyping](https://www.chrishecker.com/Advanced_Prototyping); [Joystiq interview via Engadget](https://www.engadget.com/2006-11-13-joystiq-interviews-spores-chaim-gingold-and-chris-hecker.html)
- Juul's notes on the talk: good prototypes are testable, quick to make and built to ask questions. Prototype code must be "agile and fast" but not robust, elegant or optimal. Prefer toolkits over frameworks [secondary notes]. — [Jesper Juul, GDC 2006 notes](https://www.jesperjuul.net/ludologist/2006/04/04/my-gdc-2006-notes/)
- Gingold says he made "dozens of prototypes" for Will Wright and the Spore team. One key prototype proved the 3D creature editor (body-part editing) could be fun [primary/secondary]. — [Chaim Gingold's site](https://chaim.io/); [Game Developer, "Spore: My View of the Elephant"](https://www.gamedeveloper.com/design/spore-my-view-of-the-elephant)
- Jonathan Blow's Independent Games Summit 2007 talk on rapid prototyping used Braid as the case study. He also showed a gesture-based combat game he had prototyped heavily [secondary coverage of primary talk]. — [Game Developer, IGS video: Jon Blow on indie prototyping](https://gamedeveloper.com/game-platforms/igs-video-jon-blow-on-indie-prototyping-i-braid-i-); [Game Developer, GDC: Prototyping for indie developers](https://www.gamedeveloper.com/pc/gdc-prototyping-for-indie-developers); [Rutgers lecture slides citing the talk](https://sakai.rutgers.edu/access/content/group/0a4e9ee5-ee55-4b15-b778-52a05786e504/lectures/05_indieprototyping.pdf)

**Mark Cerny's "Method" (preproduction to find the core)**
- Cerny describes preproduction ("capture lightning") and production ("build the game") as phases "as different as night and day." The 2002 date for the talk is best supported, but one Medium post says DICE 2012 [secondary]. — [Videogames Chronicle, Who is Mark Cerny](https://www.videogameschronicle.com/features/who-is-mark-cerny/); [Mateusz Janczewski, Producer's Diary (Medium)](https://medium.com/@mateuszjanczewski/producers-diary-the-seven-deadly-sins-of-pre-production-81d58d0529c4)
- Preproduction ends with a "publishable first playable." This is a slice (often two levels, for some variety) that is good enough for people to play and test, built on target technology, and judged against already-published competitors. If it is not successful, the project should be cancelled, because "your project will not miraculously get better during Production" [secondary summaries]. — [Janczewski, The Game Development Method by Mark Cerny](http://www.mateuszjanczewski.pl/game-development-tips/the-game-development-method-by-mark-cerny/); [Medium post](https://medium.com/@mateuszjanczewski/producers-diary-the-seven-deadly-sins-of-pre-production-81d58d0529c4)

**Playtesting and iteration loops (Valve, Tracy Fullerton, Bungie)**
- Valve (Mike Ambinder, GDC 2009) treats game designs as hypotheses and playtests as experiments: evaluate, revise, repeat. The slides say playtesting is "not for bug testing," not for balancing and "definitely not focus testing" [primary slides]. — [Valve's Approach to Playtesting, slides PDF](https://cdn.cloudflare.steamstatic.com/apps/valve/2009/GDC2009_ValvesApproachToPlaytesting.pdf); [GDC Vault](https://www.gdcvault.com/play/1566/Valve-s-Approach-to-Playtesting)
- The Level Design Book calls the talk foundational and stresses direct observation. Mark Brown reports about 100 playtesters per Half-Life 2 chapter [secondary; the count is a secondhand figure]. — [Level Design Book, Playtesting](https://book.leveldesignbook.com/process/blockout/playtesting); [Mark Brown, "Valve's Secret Weapon"](https://gmtk.substack.com/p/valves-secret-weapon)
- Tracy Fullerton's "playcentric" approach involves "the player in your design process from conception through completion." It tests ideas early because once production starts "it becomes increasingly difficult to alter the software design." The iteration list starts with setting player experience goals, which the 5th edition frames as emotion-focused [primary book excerpt]. — [Game Developer, Game Design Workshop excerpt](https://gamedeveloper.com/design/book-excerpt-game-design-workshop); [Routledge, 5th edition](https://www.routledge.com/Game-Design-Workshop-A-Playcentric-Approach-to-Creating-Innovative-Games/Fullerton/p/book/9781032607009)
- Fullerton treats playtesting as a full process (selection, recruiting, preparation, controls, analysis) and keeps it separate from internal design review (3rd edition preview) [primary]. — [O'Reilly preview, Game Design Workshop ch. 9](https://www.oreilly.com/library/view/game-design-workshop/9781482217179/K22093_C009.xhtml)
- Bungie's core-loop test: Jaime Griesemer, "In Halo 1, there was maybe 30 seconds of fun that happened over and over and over and over again." Engadget notes the philosophy was studio-wide long before the documentary quote [primary quote via secondary]. — [Halopedia, Jaime Griesemer](https://www.halopedia.org/Jaime_Griesemer); [Engadget interview](https://www.engadget.com/2011-07-14-half-minute-halo-an-interview-with-jaime-griesemer.html); [Microsoft blog on Halo 4, "30 seconds of fun – early and often"](https://blogs.microsoft.com/blog/2012/12/10/meet-the-halo-4-engineers-delivering-30-seconds-of-fun-early-and-often/)

**Greyboxing / blockouts and vertical slices**
- Greyboxing (blockout) is "the process of making a playable rough draft of a level to get a sense of its gameplay before polishing its look." Epic's guidance: treat the first pass as the blockout, iterate, and "add props and art once you are happy with how the level plays." Include physical checks such as whether vehicles fit through gaps [primary engine docs]. — [Epic, Greyboxing in UEFN](https://dev.epicgames.com/documentation/en-us/uefn/greyboxing-in-unreal-editor-for-fortnite)
- Robert Yang points readers to his free Level Design Book's Blockout chapter as the fuller resource [primary]. — [Robert Yang, How to graybox/blockout a 3D video game](https://www.blog.radiator.debacle.us/2017/09/how-to-graybox-blockout-3d-video-game.html)
- Vertical slices are contested:
  - Ron Gilbert argues against them, saying games are built from foundations upward [primary blog].
  - Volition's Greg Donovan says the industry term is "a distortion of the original idea." Saints Row's slice was meant to test feasibility, predict challenges and convince the publisher [secondary summary of talk].
  - Tadhg Kelly compares a slice request to "asking to see a piece of the final cake before agreeing to pay for the whole" [secondary].

  Sources: [Ron Gilbert, Grumpy Gamer](https://grumpygamer.com/vertical_slice); [Game Developer, "Why we should stop saying vertical slices"](https://gamedeveloper.com/design/why-we-should-stop-saying-vertical-slices-); [Homegrown write-up](https://write.as/blake/what-does-a-vertical-slice-look-like-for-homegrown)

**Game feel and juice (Swink, Nijman, Jonasson & Purho)**
- Steve Swink (2009) defines game feel as "real-time control of virtual objects in a simulated space, with interactions emphasised by polish." Its three parts are real-time control, simulated space (collision and response) and polish (animation, sound, particles, camera shake) [primary book]. — [Game Feel ch. 1 PDF](https://puccjogos.github.io/balanceamento-2017-1s/materiais/GameFeel_Chap1.pdf); [Game Developer, "Principles of Virtual Sensation"](https://www.gamedeveloper.com/design/principles-of-virtual-sensation)
- An academic survey notes critics who separate Swink's narrow "Game Feel" (the feeling of control) from broader "game feel" (any feeling a game communicates) [secondary, scholarly]. — [arXiv 2011.09201](https://arxiv.org/pdf/2011.09201)
- Jan Willem Nijman (Vlambeer), "The Art of Screenshake" (Control Conference, Amsterdam): he takes a dull side-scrolling shooter and applies about 30 small tweaks one at a time, each making it better [primary talk via secondary]. — [Game Developer coverage](https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games)
- Partial reconstructed list of the tweaks: basic animation and sound, lower enemy HP, more enemies, bigger explosions, muzzle flash, faster bullets, impact effects, enemy knockback, camera lerp, screenshake, player knockback, hit pause, weapon recoil, lingering smoke ("permanence") and slow motion. This list comes from a student's notes and a recreation; it is not confirmed as Nijman's exact list [secondary]. — [Bayreuth GxD slides](https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf); [DK Liao recreation devlog](https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog/451576/quick-breakdown-of-all-the-effects)
- Martin Jonasson and Petri Purho, "Juice It or Lose It" (GDC Europe 2012; some sources say Nordic Game Indie Night): juicy things "wobble, squirt, bounce around, and make little cute noises." Juice means "maximum output for minimum input." They add juice step by step to a simple block-breaker; that detail is secondhand [primary listing plus secondary]. — [GDC Vault](https://gdcvault.com/play/1016487/Juice-It-or-Lose); [Game Developer, "Is your game juicy enough?"](https://gamedeveloper.com/design/video-is-your-game-juicy-enough-)
- Counterpoint: Folmer Kelly's GDC Europe 2014 talk "Don't Juice It or Lose It," and Game Developer's "Indies, resist the urge to juice it or lose it" [primary listing/secondary]. — [GDC Vault, Don't Juice It or Lose It](https://gdcvault.com/play/1020861/Don-t-Juice-It-or); [Game Developer](https://gamedeveloper.com/design/video-indies-resist-the-urge-to-juice-it-or-lose-it-)

**Studio-level timeboxed prototyping (Double Fine Amnesia Fortnight)**
- Double Fine's two-week internal prototype jams produced shipped games:
  - Costume Quest began as a prototype in the first, non-public session.
  - Hack 'n' Slash and Spacebase DF-9 came from the 2012 session; MobyGames also lists Autonomous.
  - The Happy Song prototype became Sesame Street: Once Upon a Monster.
  - Kiln (2017 prototype) was announced as a full release.

  These are examples, not a full tally [secondary/measured]. — [MobyGames, Amnesia Fortnight 2012](https://www.mobygames.com/game/71177/amnesia-fortnight-2012/); [Giant Bomb, Amnesia Fortnight](https://giantbomb.com/wiki/Concepts/Amnesia_Fortnight); [Amnesia Fortnight 2012 (Wikipedia)](https://en.wikipedia.org/wiki/Amnesia_Fortnight_2012)

### Inferences
- The processes are not competitors; they form a pipeline:
  1. A spike or toy room answers "can this work, and is it fun to touch?"
  2. Greybox spaces answer "does it work in a level?"
  3. A first playable or vertical slice answers "is this worth producing?"
  4. Juice and polish come last, as tuning on a system that is already fun.
- The examples that start with movement (Mario 64's block room, Odyssey's parallel prototypes, Spider-Man's swing as the first thing built) suggest a rule for feel-heavy systems: make the avatar fun to control in an empty space before building any content around it.
- The evidence base is almost entirely case-based. The visible successes (World of Goo, Half-Life, Mario 64) suffer from survivorship bias, since failed projects that used the same processes are rarely written up. Supercell's kill counts (section 3) are the main counter-example where failures are recorded.

### Gaps
- I could not fetch the full Gabler/Gamasutra article, so its specific tip list (e.g., "make the toy first") is unconfirmed here. The Harvey Mudd mirror linked above is reported to hold the full text.
- I found no primary source tying the phrase "find the fun" to Nintendo, Valve or Supergiant specifically. It shows up as an industry saying, but its origin is unconfirmed.
- I found no detailed, primary account of Supergiant's prototyping steps for Hades. The Game Maker's Notebook podcast is the most likely source, but no transcript was available.
- Fullerton's full step-by-step iterative cycle was cut off in the search snippets.

## 2. How do developers isolate one hard technical question and answer it fast (tech prototypes, test scenes, debug visualization, tuning tools, A/B comparison)?

### Takeaway
Developers isolate a hard question with five recurring moves:
1. Build a throwaway spike or test scene that does only that one thing.
2. Express feel in designer-friendly parameters rather than raw physics constants.
3. Expose those parameters for live tweaking.
4. Draw graphs and debug views of the motion over time.
5. Compare variants by turning features on and off, or by making big changes (double or halve) so that differences are obvious.

### Cited Findings
- **Single-question spikes.** XP's rule is to build only what addresses the problem under examination and ignore all else. The point is to reduce technical risk or improve an estimate [primary via secondary]. — [C2 wiki](https://c2.com/xp/SpikeSolution.html); [James Shore](https://www.jamesshore.com/v2/books/aoad1/spike_solutions)
- **Prototype as a question.** In Hecker and Gingold's framing, a good prototype is testable, quick and built to ask a question. The code is deliberately not robust, elegant or optimal [secondary notes]. — [Juul GDC 2006 notes](https://www.jesperjuul.net/ludologist/2006/04/04/my-gdc-2006-notes/)
- **A test space with a simpler view (Breath of the Wild).** Nintendo tested its physics and "chemistry" ideas in a top-down, NES-Zelda-style prototype: bushes catching fire, chopping and pushing logs, water floating objects. Nintendo later clarified that the prototype ran BotW's real 3D physics and chemistry engine underneath a 2D view [primary GDC 2017 panel via secondary]. — [Zelda Universe GDC report](https://zeldauniverse.net/2017/03/09/zelda-team-discusses-breath-of-the-wilds-development-and-2d-zelda-prototype-at-gdc/); [Engadget](https://www.engadget.com/2017/03/12/breath-of-the-wild-gdc-talk/); [Destructoid](https://destructoid.com/?p=218127); [Kotaku](https://kotaku.com/heres-what-legend-of-zelda-breath-of-the-wild-looked-l-1792868700)
- **BotW's two layers.** Technical director Takuhiro Dohta described the chemistry engine as changing the "state" of objects, while the physics engine handles movement. The finished game used a modified Havok physics engine [primary via secondary]. — [Game Developer, "Forging Zelda's future by revisiting its past"](https://gamedeveloper.com/design/forging-i-zelda-i-s-future-by-revisiting-its-past); [Engadget](https://www.engadget.com/2017/03/12/breath-of-the-wild-gdc-talk/)
- **Feel parameters instead of raw constants (Kyle Pittman, "Building a Better Jump," GDC 2016 Math for Game Programmers).** Instead of guessing a force value, specify the desired apex height and the time (or horizontal distance) to apex, then derive gravity and launch velocity [primary talk via secondary].
  - A community reconstruction gives gravity ≈ 2H/t² and initial velocity ≈ 2H/t. This is third-party and not confirmed from the slides.
  - Pittman reportedly cites Swink on Mario's gravity rising sharply after the apex.

  Sources: [GDC Vault](https://gdcvault.com/play/1023148/contactUs); [Traversing Virtual blog](https://traversingvirtual.blogspot.com/2024/07/designing-platformer-player-controls.html); [community implementation gist](https://gist.github.com/Geokureli/ad91c450a356ef4b7597641e8bae741a)
- **Why parameters help, from a practitioner's devlog:** "Tweaking one number until something feels good is okay, but tweaking two numbers at a time is a pain." The fix is to expose intuitive parameters and derive acceleration and deceleration from them [anecdotal]. — [Archetype devlog, Character Controller Tech Talk](https://serfofcinder.itch.io/archetype-portal-to-hell/devlog/714077/character-controller-tech-talk)
- **Live "tweakables" (Shawn Hargreaves, MotoGP).** The team needed to "experiment with different numbers and immediately see the results." Quake's console was the model, and the team used tweakables across effects, physics, AI, cameras, sound and debug features [primary blog]. — [Shawn Hargreaves, MotoGP tweakables](https://www.shawnhargreaves.com/blog/motogp-tweakables.html)
- **Debug graphs for 3D movement (Ryan Darcey).** He built frame-by-frame analysis tools for 3D character movement. One example is keeping a history of recent acceleration values and plotting them over time [primary article]. — [Game Developer, "Analyzing core character movement in 3D"](https://gamedeveloper.com/design/analyzing-core-character-movement-in-3d)
- **Saved tuning sets you can compare.** Commercial tools such as Hot Tuner let developers mark values as tunable, edit them live on device, and save named tuning sets as diffable JSON for side-by-side comparison [vendor claim]. — [Hot Tuner forum post](https://forums.unrealengine.com/t/gdworks-hot-tuner/2745106)
- **A/B by layering one effect at a time.** Both Nijman's talk (about 30 tweaks applied one after another) and Jonasson and Purho's talk (adding juice step by step to a block-breaker) work by isolating one effect at a time and comparing before and after [primary talks via secondary]. — [Game Developer on Nijman](https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games); [GDC Vault, Juice It or Lose It](https://gdcvault.com/play/1016487/Juice-It-or-Lose)
- **"Double it or cut it in half" (attributed to Sid Meier).** If a unit feels weak, double its strength instead of trimming its cost by 5%. Iteration cycles are limited, so make changes big enough to give a clear reaction, then narrow down. The attribution chain is Soren Johnson's column, and Schell → Brian Reynolds → Meier [secondary]. — [Game Developer, "Analysis: Sid Meier's Key Design Lessons"](https://www.gamedeveloper.com/game-platforms/analysis-sid-meier-s-key-design-lessons); [Soren Johnson, Designer Notes "Sid's Rules"](https://www.designer-notes.com/?p=119); [Notes by Lex](https://notesbylex.com/doubling-or-halving-as-a-game-balancing-technique)
- **Small numeric changes can still matter a lot.** Griesemer's GDC talk describes the Halo 3 sniper rifle's fire interval going from 0.5 s to 0.7 s, a "tiny tweak" that changed the game. He also gave a whole talk on tuning one value (plasma rifle bolt velocity on Legendary) across the Halo series [primary talks via secondary]. — [Game Developer, "0.2 seconds to balancing Halo 3's sniper rifle"](https://gamedeveloper.com/design/video-0-2-seconds-to-balancing-i-halo-3-i-s-sniper-rifle); [Game Developer, plasma rifle muzzle velocity](https://gamedeveloper.com/design/video-tuning-the-i-halo-i-plasma-rifle-s-muzzle-velocity-on-legendary-difficulty)
- **Isolating a technique, not just a parameter: procedural animation.** David Rosen (Wolfire, GDC 2014 Animation Bootcamp) showed how simple procedural methods give fluid, interactive animation from very few key frames (Overgrowth, Receiver, Black Shades). A Polycount commenter notes Overgrowth still drives much of its animation from keyed poses, so it is a hybrid [primary listing plus secondary]. — [GDC Vault](https://gdcvault.com/play/1020049/Animation-Bootcamp-An-Indie-Approach); [Game Developer video post](https://gamedeveloper.com/design/video-an-indie-approach-to-procedural-animation); [Polycount](https://polycount.com/discussion/comment/2093086)
- **Isolating a technique: motion matching.** Simon Clavet (Ubisoft Montreal, GDC 2016, For Honor) aimed at one problem: conventional clip blending left feet sliding while gameplay needed precise response. Motion matching searches all the motion-capture data every frame and jumps to the best-matching frame, then applies procedural touch-ups. It costs a lot of memory and CPU. For Honor was the first game to ship it [primary via secondary]. — [GDC Vault](https://www.gdcvault.com/play/1022985/Motion-Matching-and-The-Road); [Game Watch report (Japanese)](https://game.watch.impress.co.jp/docs/news/749136.html); [Ubisoft La Forge](https://montreal.ubisoft.com/en/drecon-data-driven-responsive-control-of-physics-based-characters/); [Game Developer roundup](https://gamedeveloper.com/programming/most-inspiring-game-animation-tech-talks-of-2016)
- **Interactive teaching tool for jump tuning.** Mark Brown's (GMTK) Platformer Toolkit lets users tune jump and movement parameters live and feel the result. It shows how parameter sliders plus instant feedback make feel tunable [primary tool]. — [GMTK Platformer Toolkit](https://gmtk.itch.io/platformer-toolkit/comments?after=0)

### Inferences
- For a feel-heavy 3D avatar, the strongest isolation pattern in the evidence has four parts:
  - a dedicated test scene with nothing but the mechanic;
  - feel parameters (apex height, time to apex, turn rate, stopping distance) that derive the physics constants;
  - a live tweak panel with saved presets so variants can be swapped instantly (A/B);
  - graphs of velocity and acceleration over time, so judgments of feel can be checked against the actual numbers.
- Double-or-halve fits early exploration best, when you are looking for the right range. Halo's 0.2-second example shows that fine adjustments still matter late in tuning.
- BotW's 2D-view-on-a-real-engine trick generalises: change the view or presentation to make the question cheaper to see, but keep the real simulation underneath so the answer transfers to the final game.

### Gaps
- I found no GDC talk focused purely on runtime tuning tools or debug visualization for character controllers. The evidence is a blog (MotoGP), one Game Developer article (Darcey) and practitioner devlogs.
- The exact formulas and slides in Pittman's talk could not be checked (GDC Vault access was blocked or gated).
- I found no measured evidence (controlled A/B playtests with numbers) that any of these tuning methods produces better feel. All the support is anecdotal.

## 3. How do teams decide when a prototype has succeeded or should be thrown away, and how do they move from prototype to production code?

### Takeaway
Success is judged by watching people play and by whether the core loop holds up when repeated. Some teams formalise this: Cerny's go/no-go on a publishable first playable, Valve's hypothesis-and-experiment playtests, and Supercell's team-led kill decisions backed by metrics. The near-universal rule for code is to keep the knowledge and throw away (or heavily rewrite) the prototype code. The main risk is a prototype that looks finished and gets shipped as production code.

### Cited Findings
- **Cerny's go/no-go.** If the first playable is not successful, cancel. Compare it against published competitors, because the project "will not miraculously get better during Production" [secondary summaries]. — [Janczewski on Cerny's Method](http://www.mateuszjanczewski.pl/game-development-tips/the-game-development-method-by-mark-cerny/)
- **Valve's evidence standard.** Designs are hypotheses and playtests are experiments, judged mainly by direct observation, not by focus-group opinion [primary slides]. — [Ambinder slides PDF](https://cdn.cloudflare.steamstatic.com/apps/valve/2009/GDC2009_ValvesApproachToPlaytesting.pdf); [Level Design Book](https://book.leveldesignbook.com/process/blockout/playtesting)
- **Supercell's kill funnel [measured, self-reported].**
  - Of 10 games discussed by Supercell's Jon Dower, 7 were killed in prototype and 2 at soft launch; one (Clash Royale) launched globally.
  - Team leads make the call. "Financial goals are secondary to quality," and the decision ultimately rests on the team lead's gut, with metrics part of the conversation.
  - Another report says games that miss 30-day retention targets are killed.
  - Supercell said it had killed 14 games by 2016. In February 2023 the CEO said "30+ games" killed against 5 hits.

  Sources: [GamesBeat, "How Supercell kills its darlings"](https://gamesbeat.com/how-supercell-kills-its-darlings-to-focus-on-potential-hits/); [Game Developer, "Quality is worth killing for"](https://gamedeveloper.com/business/quality-is-worth-killing-for-supercell-s-ruthless-approach-to-production); [Morgan Linton](https://www.morganlinton.com/supercell-killed-fourteen-games-on-the-road-to-building-four/); [Game World Observer](https://gameworldobserver.com/2024/03/14/all-games-killed-by-supercell-everdale-hay-day-pop-clash-mini)
- **Repeatable core loop as a test.** Bungie's "30 seconds of fun" sets a concrete bar: a short loop that stays fun "over and over" in different environments, weapons and enemies [primary quote via secondary]. — [Halopedia](https://www.halopedia.org/Jaime_Griesemer); [Engadget](https://www.engadget.com/2011-07-14-half-minute-halo-an-interview-with-jaime-griesemer.html)
- **Experiential density.** Valve kept the parts of its prototype level that were fun, cut the rest, then analysed why the remaining parts worked [primary via secondary]. — [The Cabal (Game Developer)](https://www.gamedeveloper.com/design/the-cabal-valve-s-design-process-for-creating-i-half-life-i-); [excerpt](https://rapidnotes.wordpress.com/2014/05/18/the-cabal-valves-design-process-for-creating-half-life/)
- **Early prototypes may not be fun yet.** A secondhand quote in Rutgers course slides says Blow described a game's early prototypes as not enjoyable for months. The same slides note that Miegakure was the third in a series of higher-dimension prototypes, with the first two dropped [secondary, unverified]. — [Rutgers lecture slides](https://sakai.rutgers.edu/access/content/group/0a4e9ee5-ee55-4b15-b778-52a05786e504/lectures/05_indieprototyping.pdf)
- **Throwaway by default (XP).** "Most spikes are not good enough to keep, so expect to throw it away," though "sometimes something is salvaged" [secondary quotation]. — [C2 wiki](https://c2.com/xp/SpikeSolution.html)
- **Prototype code is meant to be fast, not robust.** Hecker and Gingold say prototype code should be agile and fast, not robust, elegant or optimal. The implication is that it should not become the production base unchanged [secondary notes]. — [Juul GDC 2006 notes](https://www.jesperjuul.net/ludologist/2006/04/04/my-gdc-2006-notes/)
- **Practitioner guidance on the move to production [anecdotal]:**
  - Salvage "the knowledge, not the code."
  - Reusing prototype code "looks like a time saver" but often backfires at the first serious problem.
  - Prototypes skip error handling and repeatable deployment.
  - A polished prototype creates pressure to ship it.
  - Rewrites can stall, and can lose edge-case handling the prototype got right by accident.

  Sources: [Macrobian Games, Unity prototype vs production](https://macrobiangames.com/blog/unity-prototype-vs-production-readiness/); [O'Reilly, Practical Game Design excerpt](https://www.oreilly.com/library/view/practical-game-design/9781787121799/28d78190-7a85-4f18-8589-259bf87b0985.xhtml); [Cimpleo, Prototype to production](https://cimpleo.com/blog/prototype-to-production/)
- **One team's experience.** An indie devlog reports discarding all prototype code after greenlight and getting a cleaner foundation [anecdotal]. — [Logic and Chaos devlog](https://logicandchaos.itch.io/endless-prose/devlog/573430/from-prototype-to-production)
- **Build the milestone on target technology.** Cerny's first playable is meant to run on the real engine and hardware, which reduces the gap between prototype and production [secondary]. — [Medium, Janczewski](https://medium.com/@mateuszjanczewski/producers-diary-the-seven-deadly-sins-of-pre-production-81d58d0529c4)
- **Vertical slices can mislead about scope.** A polished single level can hide how much work the rest of the game needs. This is an opinion from blogs and essays; the "80% takes 800%" line is rhetoric, not data [anecdotal]. — [Game Developer, "Why we should stop saying vertical slices"](https://gamedeveloper.com/design/why-we-should-stop-saying-vertical-slices-); [Grumpy Gamer](https://grumpygamer.com/vertical_slice)

### Inferences
- A practical pass/fail test for a movement prototype, combining the sources above:
  1. Do untrained players, watched without coaching, do the intended things and keep playing in an empty test space (Valve-style observation)?
  2. Does the short core loop stay fun when repeated (Halo)?
  3. Does it hold up next to the best games of the same kind (Cerny)?

  If not, change the design boldly (double or halve) or discard it, and do not carry it into content production.
- For moving to production, the safest pattern in the evidence is a hybrid:
  - Keep the tuned parameter values, the formulas and a written record of what was learned.
  - Re-implement the system cleanly inside the production architecture.
  - Use the prototype as a reference to compare against, so feel does not drift during the rewrite. Saved tuning presets from section 2 make this comparison possible.
- Spider-Man (section 4) is an example of a core movement system that was built first and kept evolving for years, rather than being thrown away. "Throw it away" applies most strongly to spike-level code, not to the design itself.

### Gaps
- I found no primary industry study measuring the cost of shipping prototype code versus rewriting it. The guidance is practitioner opinion.
- Supercell's figures are self-reported and come from free-to-play mobile games, where retention metrics exist. They may not carry over to a single-player or feel-focused project.
- I found no primary source stating explicit numeric "kill criteria" for a feel or movement prototype.

## 4. What documented postmortems describe inventing a novel movement or control system this way?

### Takeaway
The best-documented cases follow the same pattern:
- **Movement is built first:** Mario 64, Spider-Man.
- **It is tested in an isolated or simplified space:** Mario 64's block room, BotW's 2D-view prototype.
- **It comes from many quick prototypes:** Celeste's 4-day jam, Odyssey's parallel groups, Titanfall's early wall-run prototype.
- **It is tuned over years with player feedback,** often by adding invisible forgiveness and assist systems (Celeste's coyote time and jump buffering, Spider-Man's building repulsion and smart web targeting).

Detailed primary write-ups exist for Celeste, Spider-Man, BotW, Valve and motion matching. Journey's surfing, Getting Over It and Untitled Goose Game are much more thinly documented.

### Cited Findings

**Celeste (Maddy Thorson, Noel Berry)**
- The original Celeste was made in about four days for a PICO-8 game jam in August 2015, so the movement core was a jam prototype [secondary]. — [Celeste (Wikipedia)](https://en.wikipedia.org/wiki/Celeste_(video_game)); [Celeste Classic on itch.io](https://mattmakesgames.itch.io/celesteclassic)
- Thorson said "a lot of the lessons from TowerFall make their way into Celeste" [primary interview]. — [Nintendo Life interview](https://www.nintendolife.com/news/2018/01/feature_conquering_the_indie_mountain_with_celeste_creator_matt_makes_games)
- Thorson's 2020 thread (later an article) listed 10 hidden "game feel" forgiveness mechanics, starting with coyote time (still able to jump briefly after leaving a ledge) and jump buffering (a jump pressed just before landing happens on the landing frame). Thorson said they did not invent any of these [primary via secondary]. — [Maddy Thorson, "Celeste & Forgiveness"](https://maddymakesgames.com/articles/celeste_and_forgiveness/); [Thread archive](https://threadreaderapp.com/thread/1238338574220546049.html); [Blizzard Watch](https://blizzardwatch.com/2020/03/13/celeste-developer-game-feel/); [GameSpot](https://www.gamespot.com/articles/celeste-dev-explains-how-they-made-their-game-feel/1100-6474775/)

**Super Mario 64 and Super Mario Odyssey (Nintendo)**
- Mario 64: a block-room diorama for running, climbing slopes and jumping, built before levels, on SGI workstations [primary interview, translated]. — [Shmuplations](https://shmuplations.com/mario64/); [TCRF](https://tcrf.net/Prerelease:Super_Mario_64_(Nintendo_64)/Early_Development)
- Odyssey: cap throwing was a starting theme. Producer Koizumi pushed for using the Joy-Con for different actions, and throwing was "a very natural idea" [primary interview via secondary]. — [My Nintendo News, GQ interview summary](https://mynintendonews.com/2017/10/25/nintendos-kenta-motokura-yoshiaki-koizumi-discussed-super-mario-odyssey-with-gq/); [Nintendo Everything](https://nintendoeverything.com/director-on-super-mario-odyssey-throwable-cap-planned-from-the-start-more/)
- Why a cap: something familiar suited Mario better than a new object [primary via secondary]. — [Game Informer](https://www.gameinformer.com/b/news/archive/2017/06/17/marios-developers-on-hat-capture-and-peachs-love-for-mario.aspx)
- Capture came from fusing parallel prototypes. A 4Gamer interview with Koizumi describes three groups working at the same time on possession, cap throwing, and possession-style actions from other games; their ideas merged into "using the cap to possess things" [primary via secondary; the original 4Gamer text was not retrieved]. — [Super Mario Wiki development notes](https://www.mariowiki.com/User:Shokora/Odyssey_development)

**Breath of the Wild (Nintendo, GDC 2017)**
- A top-down, NES-style prototype on the real 3D physics and chemistry engine tested systemic interactions (fire, logs, water) before the full 3D build [primary via secondary]. — [Zelda Universe](https://zeldauniverse.net/2017/03/09/zelda-team-discusses-breath-of-the-wilds-development-and-2d-zelda-prototype-at-gdc/); [Destructoid](https://destructoid.com/?p=218127)
- Nintendo returned to GDC in 2024 to explain the physics design behind Tears of the Kingdom; I did not get the content [secondary]. — [TechSpot](https://www.techspot.com/news/102483-nintendo-explains-philosophy-behind-zelda-physics-gdc.html)

**Marvel's Spider-Man web swinging (Insomniac)**
- Game director Ryan Smith: swinging was "one of our first or literally the first thing we actually worked on." The traversal team decided early that "swinging had to be physics-based and webs had to attach to buildings" [primary quotes via press; the search summary did not say which of the two outlets carried which quote]. — [GameSpot, "How Insomniac Spun Its Web"](https://www.gamespot.com/articles/marvels-spider-man-how-insomniac-spun-its-web/1100-6464062/); [The Ringer](https://www.theringer.com/2018/09/24/video-games/marvels-spider-man-swing-success)
- The team hand-tuned the physics. It added a repulsion force from buildings so players can swing down streets more easily, and web attachment takes the player's momentum and direction into account (a shorter web to a nearer object for hairpin turns). Smith called it "a multi-year process of iteration, getting feedback, adjusting, simplifying" [primary via secondary]. — [Cheat Code Central](https://www.cheatcc.com/articles/how-insomniac-tuned-spider-man-s-swing-to-feel-so-fast/); [The Ringer](https://www.theringer.com/2018/09/24/video-games/marvels-spider-man-swing-success)
- Doug Sheahan's GDC 2019 talk "Concrete Jungle Gym" covered how swinging "was originally executed and the process through which it evolved." An early single-clip animation for the whole swing arc was replaced to allow "a lot more animation variety" [primary slides]. — [Sheahan GDC 2019 slides PDF](https://media.gdcvault.com/gdc2019/presentations/Sheahan_Doug_ConcreteJungleGym.pdf); [Game Developer preview](https://www.gamedeveloper.com/design/swing-by-gdc-and-learn-about-the-making-of-i-marvel-s-spider-man-i-from-top-to-bottom)

**Titanfall wall-running (Respawn)**
- Designer Justin Hendry: "there was a wall running prototype that I think they did in Source before we had chosen that engine… I gravitated to wall running immediately" [primary interview]. — [Prima Games Titanfall eGuide, Behind the Scenes](https://primagames.com/eguides/titanfall-eguide/behind-the-scenes/game-design)
- A designer interview describes wall-running starting as letting players walk freely on walls, pulled toward the wall instead of down by gravity, and tested for days [primary interview via search snippet]. — [Game Developer, "Getting Titanfall's controls just right"](https://www.gamedeveloper.com/design/designer-interview-getting-i-titanfall-i-s-controls-just-right)
- A GameSpot headline says Titanfall was first prototyped on a Ratchet & Clank engine. Only the headline was seen [secondary, unverified detail]. — [GameSpot](https://gamespot.com/articles/xbox-and-pc-game-titanfall-was-originally-prototyped-running-on-a-ratchet-clank-engine/1100-6419042/)
- Titanfall 2 kept iterating from external testing: after the technical test, Respawn said it would increase wall-running speed [secondary]. — [IBTimes](https://www.ibtimes.co.uk/titanfall-2-respawn-speed-movement-improve-titan-meter-following-technical-test-feedback-1577954)
- Related talks: Chin Xiang Chong's GDC 2017 talk on how the rodeo (Titan-riding) system evolved through early prototypes, and Christopher Dionne's GDC 2018 talk on building Titanfall 2's single-player from "action blocks" (rapid prototyping) [primary listings]. — [Game Developer, rodeo evolution](https://gamedeveloper.com/design/video-the-evolution-of-rodeoing-giant-robots-in-i-titanfall-i-); [Game Developer, rapid prototyping for Titanfall 2 single-player](https://gamedeveloper.com/design/video-rapid-prototyping-for-i-titanfall-2-i-s-single-player-mode); [GDC Vault](https://gdcvault.com/play/1024094/)

**Journey sand surfing (thatgamecompany)**
- Surfing was added because walking alone was not engaging enough, and a jump button would have made players hop instead of walk [primary pre-release interview]. — [Siliconera](https://www.siliconera.com/the-inspiration-and-goal-behind-thatgamecompanys-journey/)
- The team spent three years refining and rewriting its sand rendering and wanted sand to feel almost liquid. The team also reportedly went to the beach to run, jump and play in sand as research [primary listing; secondary]. — [GDC Vault, Sand Rendering in Journey (John Edwards, 2013)](https://gdcvault.com/play/1017742/Sand-Rendering-in); [Alan Zucconi shader analysis](https://www.alanzucconi.com/2019/10/08/journey-sand-shader-1/); [Escapist forum post](https://v1.escapistmagazine.com/forums/read/7.404615-Journey-Developer-Hit-the-Beach-to-Learn-the-Art-of-Sand)
- A discarded top-down 2D prototype ("Dragon") reportedly had players follow other players' trails to move faster through sand [secondary, unverified]. — [Video Game Positioning (Substack)](https://videogamepositioning.substack.com/p/journey-stripped-everything-and-owned)

**Untitled Goose Game (House House)**
- The movement was inspired by Super Mario 64 ("We wanted to make our little Mario 64"). A non-goose prototype came first and did not work. The team soon had a working concept animation of the goose walking, which they used to test interactions with rocks and people (Unity, Blender, FMOD) [primary interviews via secondary]. — [GamesRadar](https://gamesradar.com/untitled-goose-game-preview); [Game Developer, Road to the IGF](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-house-house-s-i-untitled-goose-game-i-); [Vice](https://www.vice.com/en/article/honks-vs-quacks-a-long-chat-with-the-developers-of-untitled-goose-game/)

**Getting Over It and Baby Steps (Bennett Foddy and collaborators)**
- Getting Over It's mouse-controlled hammer climbing follows Jazzuo's Sexy Hiking. Foddy has described "B-games" and "messy, realtime physics puzzle games" as a major inspiration [primary interviews]. — [Game Developer, How B-games influenced Getting Over It](https://gamedeveloper.com/design/how-b-games-influenced-the-design-of-i-getting-over-it-i-); [PC Gamer, Foddy and Derek Yu on Sexy Hiking](https://pcgamer.com/the-creators-of-spelunky-and-getting-over-it-with-bennett-foddy-on-sexy-hiking-and-b-games); [Game Developer designer interview](https://gamedeveloper.com/design/designer-interview-the-aesthetics-of-frustration-in-i-getting-over-it-i-)
- Baby Steps is the later physics-walking game by Gabe Cuzzillo, Maxi Boch and Foddy. A hands-on report says its leg-by-leg control scheme was Cuzzillo's idea and changed little from early development, and Cuzzillo demonstrated how the controls evolved [secondary; the search summary wrongly attributed this to Getting Over It]. — [GamesRadar Baby Steps demo](https://www.gamesradar.com/games/open-world/behold-the-most-intimidating-demo-ive-had-in-12-years-of-covering-video-games-playing-literal-walking-simulator-baby-steps-in-front-of-getting-over-it-mastermind-bennett-foddy/)

**Character animation systems built to serve movement**
- Motion matching (For Honor) and Overgrowth's procedural animation (both covered in section 2) are documented examples of inventing an animation system specifically to fix a movement-feel problem: foot sliding and responsiveness in For Honor, fluid interactivity from few keys in Overgrowth [primary listings via secondary]. — [GDC Vault, Clavet](https://www.gdcvault.com/play/1022985/Motion-Matching-and-The-Road); [GDC Vault, Rosen](https://gdcvault.com/play/1020049/Animation-Bootcamp-An-Indie-Approach)

### Inferences
- Common moves in these cases that apply directly to a new 3D avatar movement system:
  1. Build the movement first, in an empty test space (Mario 64, Spider-Man).
  2. Make several quick competing prototypes and merge the best ideas (Odyssey's three groups).
  3. Keep the physics honest but add invisible assists where the player's intent and the simulation disagree (Celeste's forgiveness, Spider-Man's building repulsion and smart web targeting).
  4. Expect years of iteration on the feel layer, driven by watched playtests and external tests (Spider-Man, Titanfall 2).
- Several cases (Untitled Goose Game's early walk animation, Spider-Man's animation rework, motion matching, Overgrowth) show that animation is part of the movement system's feel, not just decoration. It should be prototyped alongside the controller, not added after.
- Journey's reasoning (no jump button because it would turn walking into hopping) shows that leaving a verb out is a design decision. A prototype is also a way to discover what to remove.

### Gaps
- I found no primary GDC talk dedicated to Titanfall's wall-running design. The evidence is interviews and a strategy-guide feature.
- Journey's surfing mechanic has no detailed primary iteration history in what I found. The GDC talk covers rendering, not movement design.
- Getting Over It's hammer physics development is not described in detail in the snippets I saw. The 2018 Game Developer designer interview is the likely primary source but could not be read.
- I found no primary source on Super Mario Odyssey's movement tuning beyond the capture-mechanic origin.
- Exact Celeste timing values (frame counts for coyote time and buffering) are in Thorson's article but could not be confirmed here, so they are left out.
- I did not find primary material on Psychonauts 2's jump. Double Fine's "Behind the Code: Designing Raz's Jump" exists but was not read. — [Double Fine](https://www.doublefine.com/news/devin-article-raz-jump)
