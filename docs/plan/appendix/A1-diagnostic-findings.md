# Appendix A1: Deep diagnostic, all verified findings (23 November 2026)
Raw research data, generated on 24 November 2026 from the multi-agent runs. Every finding here passed an independent skeptic unless marked otherwise. Paths marked "(scratch folder, not saved)" were temporary test files that no longer exist. Plain-English summaries and decisions live in the numbered files one folder up; this appendix is for checking details.

## Project map and inventory
**Area summary:** The project has a single testing hub (the Test Lab, with 14 subjects in one menu), a driving test anyone can play, a racing area that is well organised, and approved work that is properly frozen and checked before every publish. Around that sit 32 top-level folders, and nothing in the folder tree says which ones are current. By my count 10 are current, 5 are active experiments, 6 are old prototypes, 6 have no clear status, and the rest are checkpoints, docs and tools. Several "old" folders still hold up live pages (Skeleton needs avatar-lab, Movement rules needs movement, driving needs motion-lab, the official avatar's build needs the wrist, elbow and foot labs), so the tree can't be tidied just by deleting things. Every push rebuilds and republishes all of it: about 160 MB, including retired pages, a 35.8 MB avatar file that is published twice and that no page appears to load, and reference videos made from Nintendo's Super Mario 64 data on a public site. A newcomer can understand the current state only by reading a 13,000-word handoff diary, and some records are stale (the checkpoint list, the avatar-v2 README, missing tags).

### Key facts
1. Test Lab menu links exactly 14 subjects: avatar-test (Our avatar), new-avatar, motion-core-test (Movement rules), skeleton-test, hand-lab, wrist-lab, elbow-lab, foot-lab, racing-lab (Tracks), karts, lab (Blocks), oval, island, motion-lab (Motion study). Source: public/test-lab/main.js lines 5-16 and public/test-lab/index.html line 24.
2. The published site (origin/gh-pages, deploy d8255f0 = main cb77276) has 20 page routes + 3 reference video pages + 7 frozen checkpoints, 160.5 MB in total. Pages published but NOT in the Test Lab menu: site root /, /avatar-lab/, /movement/, /run-test/, /walk-test/, /references/sm64-walk/, /references/avatar-walk/, /references/motion-compare/. Source: git ls-tree -r -l origin/gh-pages.
3. Largest published folders: avatar 63.0 MB, checkpoints 52.7 MB, references 18.6 MB, new-avatar 8.4 MB, wrist-lab 4.9 MB, racing-lab 3.1 MB. Source: git ls-tree -l origin/gh-pages summed per folder.
4. The 35.8 MB file parts-4d3988607a0d4159.json.gz is published twice (avatar/assembled-joints/ and checkpoints/avatar-joints-1/). The live avatar loader fetches only the 20 MB delivery file (avatar/src/official-avatar.js line 20). The parts name shows up in the page bundle only as metadata. Source: sha256sum, grep of skeleton-test/index.html.
5. Last 100 publish runs (since 2026-11-21 09:14 UTC): 78 succeeded, 18 were cancelled, 3 failed, 1 in progress. Successful runs took a median of 5.8 min and at most 15 min. Source: gh run list --workflow deploy.yml --limit 100.
6. When I queried, a newer push to main ('New avatar: forearm line smoothed out on the 6 ft 4 in version', 16:33 UTC) was publishing. That commit is not in this local checkout (HEAD cb77276), so this checkout is at least one commit behind GitHub. Source: gh run list.
7. Of 130 commits since 2026-11-21, 105 touched docs/ and 88 edited docs/HANDOFF.md. Other folders touched in that window: avatar-v2 in 54 commits, new-avatar 47, racing-lab 12, racing-core 9, kart-parts 8, karts 7, motion-core 0 (last motion-core commit 2026-11-20). Source: git log --since=2026-11-21 --name-only.
8. docs/HANDOFF.md is 78,920 bytes and 13,101 words, with lines up to 2,332 characters. Items 36-43 are numbered twice (avatar items at lines 50-57, kart items at lines 95-102). The repo has about 101,760 words of markdown in 79 files outside checkpoints. Source: wc, grep.
9. Git authors: Claude 304, owner identity 'Isaias U' 104 (+2 'isaiasurrutia96'), Codex 17. All 40 commits in racing-core and racing-lab are under the owner's name, so Codex's commits are mostly recorded as the owner's. Source: git log --format=%an per folder.
10. Remote tags (git ls-remote): 8 exist. island-checkpoint-1-2026-11-17 is NOT on GitHub, and checkpoints/avatar-joints-1 has no tag at all. checkpoints/README.md documents avatar, island, test-lab and motion-lab only, not avatar-joints-1, driving-1 or driving-2.
11. Twelve lab pages commit their bundled build output into the source folder (10.2 MB total), and each npm run build rewrites them, e.g. hand-lab/build.mjs line 18 and scripts/build-official-avatar-page.mjs line 47. skeleton-test/index.html has 51 commits and racing-lab/index.html 37. 77 committed check-result files are rewritten by tests. The karts and new-avatar builds write only to dist/. .git is 165 MB.
12. 'Our avatar' (avatar-test) and 'Skeleton' (skeleton-test) are one bundle with the title swapped: scripts/build-official-avatar-page.mjs line 34.
13. Source reachability (static import trace I wrote, measured roughly): of 351 JS/TS files outside checkpoints, 174 are reached from live page entry points, 116 only from tests or scripts, and 61 from neither (many are one-off generators). Confirmed dead: racing-lab/src/simulation.js and src/track-view.js (racing-lab/README.md line 13 says unused) and motion-lab/src/walker.js (no references).
14. vite.config.ts builds only 5 old pages (root, lab, oval, island, movement) and copies public/. Every current lab uses its own build script, chained in package.json 'build' (64 scripts total: 43 test, 18 build). tsconfig.json type-checks only src/.
15. Remote branch claude/relaxed-wozniak-iznto4 holds 9 commits not on main, kept on purpose per HANDOFF item 63. avatar-preview is 1 ahead and 425 behind (16 Nov).

### Findings

1. **Super Mario 64 data is in the public repo and on the public site**
   - Id: INV-3
   - Kind: risk
   - Severity: high
   - Detail: On 17 November, scripts downloaded Nintendo's original Mario walk animation and Mario's 3D model from a decompiled copy of Super Mario 64. They made reference videos from it, and they also built Mario's walk data into the old running and walking test pages. All of this is in the public GitHub repo and on the public website. A copy is also inside the frozen Test Lab checkpoint 1, which your rules say must never change. None of it belongs to the current game direction, since walking and running were rejected and removed.
   - Evidence: references/sm64-walk/README.md line 3 says it uses 'the original MARIO_ANIM_WALKING (0x48) animation channels and high-detail Mario model from n64decomp/sm64'. references/sm64-walk/extract.py downloads from raw.githubusercontent.com/n64decomp/sm64. references/avatar-walk/source-walk.js line 1 says 'Original SM64 walking channels' and embeds the animation values. grep finds 'MARIO_ANIM_WALKING|n64decomp' in run-test/index.html, walk-test/index.html, checkpoints/test-lab-1/run-test/index.html and checkpoints/test-lab-1/walk-test/index.html. Published on gh-pages: references/sm64-walk/*, references/motion-compare/*, run-test/, walk-test/. README.md section D links /references/motion-compare/. docs/NEXT.md line 21 points future walk work at /references/sm64-walk/.
   - Why it matters: Nintendo actively enforces its rights. A takedown notice against a public repo can disable the whole repository and its website, including all your current work and links. It also puts your project's name next to copied material, which could hurt you later when you want to protect your own idea.
   - Suggestion: Decide this yourself, since it touches a frozen checkpoint. My recommendation: remove the SM64 references and the old run and walk prototypes from the build and the public site, and replace the copies inside checkpoint 1 under a new, clearly recorded checkpoint decision. Keep any Mario study out of the repo. If you want movement inspiration, write down what you liked in your own words rather than keeping the data. The legal reviewer should confirm the details.
   - Verdict: confirmed
   - Verifier note: references/sm64-walk/README.md line 3 names MARIO_ANIM_WALKING (0x48) and the high-detail Mario model from n64decomp/sm64. extract.py line 16 downloads from raw.githubusercontent.com/n64decomp/sm64. references/avatar-walk/source-walk.js line 1 says 'Original SM64 walking channels' and embeds the values. grep finds MARIO_ANIM_WALKING or n64decomp in run-test/index.html, walk-test/index.html and both test-lab-1 checkpoint copies. Published MP4 and GIF renders sit in public/references/sm64-walk and motion-compare, 18.6 MB on gh-pages. README.md line 24 links motion-compare. docs/NEXT.md line 21 points to /references/sm64-walk/. The raw Mario mesh file (data.json) is not committed; it was fetched into a local cache. But rendered videos of the model and the animation values are both public. HANDOFF item 2 confirms walking and running were rejected and removed.

2. **The handoff has grown into a 13,000-word diary that every session must read**
   - Id: INV-6
   - Kind: problem
   - Severity: high
   - Detail: docs/HANDOFF.md is meant to tell a fresh session where things stand. It has become a running log of about 80 steps, oldest first, so the current state sits at the bottom. Two different lists both use the numbers 36 to 43, and the header still says it was written on 20 November. It was edited in 88 of the last 130 commits. In total the project now has about 100,000 words of markdown.
   - Evidence: docs/HANDOFF.md is 78,920 bytes and 13,101 words. Items 36-43 appear at lines 50-57 (avatar) and again at lines 95-102 (karts). Line 14 says 'Written 20 November 2026'. git log --since=2026-11-21 shows 88 HANDOFF edits out of 130 commits. CLAUDE.md tells a new session to read HOW-TO-WORK-WITH-ME.md, then HANDOFF.md. CLAUDE.md section B item 3 says 'The top priority is not wasting the owner's usage.' wc -w over 79 .md files gives 101,760.
   - Why it matters: Reading this much at the start of each session uses a lot of your usage before any work begins. Important current decisions are easy to miss inside a long history.
   - Suggestion: Split it in two. One short 'current state' page (one screen: what's live, what's being worked on, open decisions, next step) is the only thing a session must read. The step-by-step history moves to a separate log file that is read only when needed. Fix the duplicate numbering when splitting.
   - Time saving: Each new session starts faster and uses noticeably less of your usage on reading.
   - Verdict: confirmed
   - Verifier note: docs/HANDOFF.md: wc gives 13,101 words and 78,920 bytes; the longest line is 2,332 characters. Items 36-43 appear twice, at lines 50-57 and lines 95-102. Line 3 (not line 14) says 'Written 20 November 2026'. On origin/main it has already grown to item 80. The edit count depends on how you count: 87 of 130 commits (path-limited log, counting 21 merges) or 75 of 109 non-merge commits; either way most commits touch it. 79 markdown files outside checkpoints total exactly 101,760 words. The reading set a session must start with (CLAUDE.md + AGENTS.md + HOW-TO-WORK-WITH-ME + HANDOFF + COLLABORATION + README) is 16,420 words.

3. **Approved work is genuinely protected**
   - Id: INV-14
   - Kind: strength
   - Severity: high
   - Detail: Each approved version is saved as a frozen copy with a fingerprint for every file, and the build refuses to publish if any frozen file has changed. The official avatar is pinned the same way: the build stops if its file doesn't match the approved fingerprint. Eight permanent tags are on GitHub.
   - Evidence: scripts/build-checkpoints.mjs lines 9-14 compare the viewer and files_sha256 hashes and throw 'Checkpoint file changed'. scripts/build-official-avatar-page.mjs lines 9-27 assert the sha256 of the official, delivery, light and game assets. git ls-remote shows 8 tags (avatar-approved, avatar-checkpoint-2, driving-checkpoint-1/2, driving-source-1/2, motion-lab-checkpoint-1, test-lab-checkpoint-1).
   - Why it matters: Your approved looks and the approved driving feel can't be silently lost or changed by either assistant.
   - Suggestion: Keep this. Just fill the two missing tags and the checkpoint list gaps (INV-7).
   - Verdict: confirmed
   - Verifier note: scripts/build-checkpoints.mjs lines 9-15 compare viewer_sha256 and every files_sha256 entry and throw on any change. I checked all 7 checkpoints: every file except CHECKPOINT.json itself is covered by a hash. build-official-avatar-page.mjs lines 9-27 assert the official, delivery, light and game asset hashes. ls-remote lists 8 tags. A related strength: line 31 stops the heavy authoring code from ever shipping in the avatar page.

4. **Nothing in the folder tree shows what is current**
   - Id: INV-1
   - Kind: problem
   - Severity: medium
   - Detail: There are 32 top-level folders, and none of their names or locations says whether a folder is current, an experiment, or retired. Some names are confusingly alike: 'reference' and 'references' are two different things, and there are five avatar-named folders (avatar, avatar-lab, avatar-test, avatar-v2, new-avatar). By my count only 10 folders are current. Six are old prototypes, five are experiments, and six have no stated status anywhere (hand-lab, foot-lab, wrist-lab, elbow-lab, lab, oval). The README's 'Current pages' section helps, but it covers pages, not folders.
   - Evidence: Inventory in this report. reference/island-v1/README.md says 'Not used by any page'. references/ holds the SM64 and motion-compare tooling. avatar-lab/README.md line 3 says 'Historical hand/foot authoring viewer'. avatar-v2/README.md line 7 still says 'Current state (21 November 2026)' while HANDOFF runs to item 79 on 23 Nov. hand/foot/wrist/elbow labs have had no commits since 18-19 Nov and are still in the Test Lab menu (public/test-lab/main.js lines 11-14).
   - Why it matters: Every new AI session, and you, have to dig through long documents to find out what matters. That costs usage and time on every session, and it raises the chance that someone changes the wrong copy or builds on something already rejected.
   - Suggestion: Add a one-screen 'Folder status' table at the top of the README: folder, what it is, current or old, and who owns it. Keep it up to date in the same commit whenever a folder changes status. Later, after your Go and after INV-2, move retired folders into one 'archive' folder so the top level shows only live work.
   - Time saving: A fresh session can find its starting point in seconds without reading the full handoff, and fewer wrong-folder mistakes mean less rework.
   - Verdict: confirmed
   - Verifier note: There are 32 top-level folders (ls). There are five avatar-named folders, plus reference/ and references/. avatar-lab/README.md calls itself historical. avatar-v2/README.md line 7 still says 'Current state (21 November 2026)'. The hand, foot, wrist and elbow READMEs describe each study but never say whether it is current or retired. lab/ and oval/ have no README at all. hand-lab's last commit was 18 Nov; foot-lab, wrist-lab and elbow-lab were last changed 19 Nov; all four are still in the menu (public/test-lab/main.js lines 11-14). README sections A and D already split pages into current and historical, but not folders. I lowered the severity because nothing in the repo shows a real wrong-folder mistake caused by this. The cost is a likely risk, not one that has been measured. There is also a third 'reference' name, avatar/src/reference/PlayerModel.ts, which adds to the confusion.

5. **Old folders still hold up live pages, so they can't simply be deleted**
   - Id: INV-2
   - Kind: risk
   - Severity: medium
   - Detail: Some 'old' folders are still needed, but fewer than reported. The live avatar pages (Our avatar, Skeleton, New avatar) need only one small file from the historical avatar-lab: the chest-bend code. Movement rules needs the old movement input file. The driving test needs motion-lab's page code and also its page template (shell.html). The wrist, elbow and foot study folders are not used by any live page. They are only used by the tools that would rebuild the avatar's shape file, and by some tests. Deleting them would not break a live page, but it would break the ability to remake the avatar's shape file. Moving a handful of shared files first is still the right way to clean up.
   - Evidence: skeleton-test/attach.js lines 20-22 import avatar-lab/src/chest-bend.js, hand-skin.js and avatar.js. motion-core-test/main.js line 6 imports ../movement/input.js. racing-lab/src/main.js line 2 imports ../../motion-lab/src/page.js. racing-lab/src/prototype-kart-view.js line 2 imports kart-parts/product-prototypes.js. avatar/ imports wrist-lab (4 files), elbow-lab (1) and foot-lab (8). run-test/controller.js line 2 and walk-test/motion.js line 2 import references/avatar-walk/matched.js. HANDOFF 'Uncertain' item 3 already warns that deleting motion-lab would break driving.
   - Why it matters: Any tidy-up that deletes or moves an 'old' folder can silently break a working page, including the approved driving test. It also means the two assistants depend on each other's folders, so one assistant's change can break the other's page.
   - Suggestion: Before any cleanup, do one small, tested chunk that moves the few shared pieces (input handling, the page shell, chest bend, hand skin and the part generators) into one clearly named shared folder. Point the live pages there and confirm everything still passes. After that, the old folders can be retired safely.
   - Time saving: Cleanup becomes safe and quick instead of a risky, page-by-page investigation.
   - Verdict: partly_true
   - Verifier note: I traced what each page bundle pulls in using esbuild metafiles (read-only, scratch script). The Skeleton bundle pulls in exactly one avatar-lab file, avatar-lab/src/chest-bend.js, through avatar/src/joint-assembly/bind.js line 3. skeleton-test/attach.js, the file the inspector cited, is NOT in the live bundle; only collect.js, tests and skeleton-test/check.mjs import it. The wrist, elbow and foot lab files are imported only by avatar authoring files (avatar/src/joints/*-design.js and joint-assembly/collect.js). scripts/build-official-avatar-page.mjs line 31 actually blocks that authoring code from going into the page. Confirmed: motion-core-test/main.js line 6 imports ../movement/input.js. racing-lab/src/main.js line 2 imports motion-lab/src/page.js. racing-lab/build.mjs line 12 also reuses motion-lab/shell.html. prototype-kart-view.js line 2 imports kart-parts. run-test and walk-test import references/avatar-walk/matched.js and movement/controller.js. HANDOFF already warns about the motion-lab dependency (Uncertain item 3).

6. **Some records are stale or incomplete**
   - Id: INV-7
   - Kind: problem
   - Severity: medium
   - Detail: A few records that people rely on no longer match the repo. The checkpoints list leaves out three of the seven saved checkpoints, including both approved driving checkpoints. Two checkpoints have no permanent tag on GitHub. The New avatar README still describes 21 November. CLAUDE.md lists only two protected baselines and names an input file path that does not exist as written.
   - Evidence: checkpoints/README.md covers avatar, island, test-lab and motion-lab, while ls checkpoints shows avatar-2, avatar-joints-1, driving-1, driving-2, island-1, motion-lab-1 and test-lab-1. git ls-remote --tags origin lists 8 tags, with no island-checkpoint-1-2026-11-17 (its CHECKPOINT.json names that tag) and no tag for avatar-joints-1. avatar-v2/README.md line 7 says 'Current state (21 November 2026)'. CLAUDE.md line 78 says 'src/input.js', but git has src/input.ts and motion-lab/src/input.js. CLAUDE.md rule 17 names only test-lab-1 and motion-lab-1.
   - Why it matters: If you or an assistant ever need to go back to an approved version, a missing tag or an unlisted checkpoint makes that harder and slower. Stale notes can send a session in the wrong direction.
   - Suggestion: Add the three missing checkpoints to checkpoints/README.md. Create and push the two missing tags from the commits named in their manifests. Refresh the avatar-v2 README to today's state, and update CLAUDE.md rules 16 and 17 to match reality.
   - Time saving: Going back to an approved version stays a one-step job.
   - Verdict: confirmed
   - Verifier note: checkpoints/README.md covers only the avatar, island, test-lab and motion-lab families. It also still labels Avatar checkpoint 2 as 'current', although avatar-joints-1 (19 Nov) is newer. git ls-remote shows 8 tags and no island-checkpoint-1-2026-11-17, although checkpoints/island-1/CHECKPOINT.json names it. HANDOFF Uncertain item 4 already says that tag 'looked local-only'. avatar-joints-1/CHECKPOINT.json has no tag field. Both source commits (a9b6eae, 7056675) exist on remote branches, so the tags can still be created. CLAUDE.md line 78 says 'src/input.js', but only src/input.ts and motion-lab/src/input.js exist. avatar-v2/README.md line 7 is dated 21 Nov.

7. **Three avatars exist side by side, and the one the game will use is not settled**
   - Id: INV-9
   - Kind: risk
   - Severity: medium
   - Detail: The Test Lab shows 'Our avatar' (the approved 19 November model), the same model again as 'Skeleton', and the 'New avatar' rebuild. Older avatars live in checkpoints too. The handoff says the New avatar is a visuals-only prototype whose code will be rebuilt cleanly once you approve the look, and that the final lock-in is not yet confirmed. Since 21 November almost all avatar work has gone into shapes. The movement code Claude owns hasn't changed since 20 November.
   - Evidence: public/test-lab/main.js lines 5, 7 and 8 list Avatar, Skeleton and New avatar. scripts/build-official-avatar-page.mjs line 34 shows Our avatar is the Skeleton bundle retitled. HANDOFF item 64 says 'Visual prototype only (pictures first, light checks, clean rebuild after the avatar is approved)'. HANDOFF item 78 says 'lock-in not yet confirmed'. Commits since 2026-11-21: avatar-v2 54, new-avatar 47, motion-core 0 (last 2026-11-20). checkpoints/avatar-2 and avatar-joints-1 hold earlier avatars.
   - Why it matters: The game needs one avatar that can move. Until one is locked in, movement work (walking, throwing, driving with the character) can't really start, and every extra copy is more to keep in sync and more confusion about which one is real.
   - Suggestion: Pick a clear lock-in moment for the avatar's look. Then do one planned swap: the chosen avatar becomes the only 'Our avatar', gets its clean rebuild with tests, and the other avatar pages move to the archive. After that, Claude's focus can return to movement.
   - Time saving: Ends the back-and-forth between avatar copies, so effort goes to making the game playable.
   - Verdict: confirmed
   - Verifier note: public/test-lab/main.js lines 5, 7 and 8 list avatar, skeleton and newAvatar. build-official-avatar-page.mjs line 34 only swaps the title for avatar-test. HANDOFF item 64 says 'Visual prototype only ... clean rebuild after the avatar is approved'. On origin/main, item 80 quotes the owner: once 100% satisfied, Claude will rebuild that exact avatar. Since 21 Nov there were 52-53 avatar-v2 commits and 45-46 new-avatar commits (depending on HEAD vs origin/main), and 0 in motion-core (last change 2026-11-20).

8. **One clear testing hub and a helpful README front section**
   - Id: INV-15
   - Kind: strength
   - Severity: medium
   - Detail: Everything you test lives in one place: the Test Lab, with a single menu grouped into Avatar, Racing and World. The README opens with the three links that matter now and clearly labels the old ones as history.
   - Evidence: public/test-lab/main.js lines 5-16 (14 subjects, one iframe at a time, line 68). public/test-lab/index.html line 24 has the grouped menu. README.md section A lists 'Current pages', and section D is 'Historical studies and checkpoints'.
   - Why it matters: You can test on your phone from one link, and the README already starts the 'what's current' story that INV-1 suggests finishing.
   - Suggestion: Use the README's section A as the place for the folder status table.
   - Verdict: confirmed
   - Verifier note: public/test-lab/main.js lines 5-16 define 14 subjects, and public/test-lab/index.html line 24 groups them under Avatar, Racing and 'World & other studies'. README sections are A 'Current pages' and D 'Historical studies and checkpoints'.

9. **Checks run automatically before anything is published**
   - Id: INV-16
   - Kind: strength
   - Severity: medium
   - Detail: Every push runs code checks and real-browser checks before publishing, and pull requests are checked without being published. The browser checks mostly cover driving: 9 of 11 suites are racing. Only one suite uses the Safari engine. The New avatar and Karts pages are not checked at all before publishing.
   - Evidence: .github/workflows/deploy.yml runs test:lab-foundations, test:official-avatar, test:racing-core, build, then test:lab-foundations-browser on chromium and webkit. Publishing is skipped for pull_request. 78 of the last 100 runs succeeded. The gh-pages deploy commit d8255f0 = 'deploy: cb77276', which is local HEAD.
   - Why it matters: Broken changes are usually caught before you see them on your phone.
   - Suggestion: Keep this, and make it faster by publishing less (INV-4).
   - Verdict: partly_true
   - Verifier note: deploy.yml runs the three test scripts, the build and the browser check, and skips publishing for pull requests (line 46). But in scripts/check-lab-foundations-browser.mjs, 9 of the 11 browser suites are racing-lab suites. WebKit (the Safari engine) is used only for the single home-screen suite (line 22); everything else runs on Chromium. test-lab/foundation-browser.mjs loads Skeleton but not New avatar or Karts. 'The latest main commit in this checkout is the one on the live site' was true when the inspector looked (d8255f0 = cb77276). It is no longer true: gh-pages is now 8748d6a, built from 271405b, two commits ahead of this checkout.

10. **The racing area is well organised**
   - Id: INV-17
   - Kind: strength
   - Severity: medium
   - Detail: Codex's racing code is split into clear layers (track, kart, contacts, testing), each with its own README. One plan document records every approval, and all racing tests run from one entry point. It's a good model for how the rest of the project could be laid out.
   - Evidence: racing-core/{track,kart,contacts,testing}/README.md. racing-core/PLAN.md (72 KB approval record). racing-core/tests/core.test.mjs lines 1-18 import 17 test files. README.md section B item 1.
   - Why it matters: Clear structure means fewer mistakes and faster changes in the part of the game that is already playable.
   - Suggestion: Use the same layer-plus-README layout when the avatar work gets its clean rebuild.
   - Verdict: confirmed
   - Verifier note: racing-core has track/, kart/, contacts/ and testing/, each with its own README.md. PLAN.md is 72,550 bytes. core.test.mjs lines 1-18 contain 17 test-file imports. One caveat: the superseded prototype files still sit at the top level of racing-core next to the new layers.

11. **Every publish rebuilds and uploads retired pages and unused files**
   - Id: INV-4
   - Kind: problem
   - Severity: low
   - Detail: Every publish uploads about 160 MB, including retired pages, 18.6 MB of reference videos and a second copy of a 35.8 MB avatar file that no page loads. Removing them would tidy the site and cut a little build time. It would NOT noticeably shorten your wait: the upload takes about 10 seconds. Most of the 6-10 minutes goes to automatic browser checks (about 3.5-6 minutes, nearly all of them for driving) and racing tests (about 1-1.5 minutes). The recent failed publishes were all caused by one driving test timing out, not by old pages.
   - Evidence: package.json 'build' chains tsc, vite and 15 build:* scripts. The gh-pages total is 160.5 MB, with references 18.6 MB and parts-4d3988607a0d4159.json.gz (35,810,859 bytes) under both avatar/assembled-joints/ and checkpoints/avatar-joints-1/. avatar/src/official-avatar.js line 20 loads only delivery.asset. scripts/build-official-avatar-page.mjs line 37 copies manifest.asset (the 35.8 MB master) to dist anyway. Of the last 100 runs: 78 success, 18 cancelled, 3 failed, median 5.8 min, max 15.0 min. .github/workflows/deploy.yml lines 15-17 set cancel-in-progress: true. HANDOFF item 74 records your 10-minute wait complaint.
   - Why it matters: You wait after every change before you can test it on your phone. Each retired page that is still built is another way for the publish to fail and block everyone's work, as happened on 23 November.
   - Suggestion: Stop building and publishing the retired pages and the unused 35.8 MB master file (the checkpoint keeps its own copy). Keep only current pages and checkpoints in the publish. Re-measure the publish time afterwards to confirm it dropped.
   - Time saving: Shorter waits after every push, and fewer failed or cancelled publishes holding up your testing.
   - Verdict: partly_true
   - Verifier note: What the site contains is accurate. d8255f0 totals 160.5 MB. The 35,810,859-byte parts file (blob f76a80b) appears under both avatar/assembled-joints/ and checkpoints/avatar-joints-1/. official-avatar.js line 20 loads only the delivery file. build-official-avatar-page.mjs line 37 copies the master to dist anyway. 79 success, 18 cancelled, 3 failed; median 5.8 min, max 15.0 min. But the timing claim does not hold. Per-step times from the GitHub API for 6 successful runs: browser checks 214-346 s, build 66-131 s, racing-core tests 53-99 s, and the actual upload (peaceiris step) only 8-11 s. So publishing fewer files would barely shorten the wait. Also, all 3 failed runs (22 Nov 19:00, 22 Nov 21:15, 23 Nov 05:25) failed in racing-lab/tests/driving-browser.mjs with 'Timeout 30000ms exceeded'. That is a current driving test, not a retired page, so 'as happened on 23 November' is wrong. The retired Vite pages (movement, lab, oval, root) are near 0 MB, and run-test, walk-test and avatar-lab are about 0.8 MB each. Tests still need the 35.8 MB master (tests/avatar/official-avatar.mjs line 11), so it must stay in the repo; only publishing it is unnecessary.

12. **Building or testing changes saved files in both assistants' folders**
   - Id: INV-5
   - Kind: problem
   - Severity: low
   - Detail: Twelve lab pages keep their built page inside the source folder, and about 34 racing test-result files are saved in the repo too. When shared code changes, a build or test run rewrites these files, so changes can show up in folders the other assistant owns. When nothing has changed, the rebuilt files come out identical and git shows nothing. The Karts and New avatar pages already avoid this by writing only to the publish folder. It is a small, real annoyance, not a big cost.
   - Evidence: Committed bundles in avatar-lab, foot-lab, hand-lab, motion-lab, racing-lab, motion-core-test, run-test, walk-test, avatar-test, skeleton-test, wrist-lab and elbow-lab total 10.2 MB. Examples: hand-lab/build.mjs line 18 writes ['hand-lab/index.html','dist/hand-lab/index.html'], and scripts/build-official-avatar-page.mjs line 47 writes route and dist. skeleton-test/index.html has 51 commits and racing-lab/index.html 37. git ls-files counts 77 *CHECK*/RESULTS files, and racing-core and racing-lab tests call writeFileSync. HANDOFF 'Practical notes' item 1. karts/build.mjs and new-avatar/build.mjs write only to dist/. .git is 165 MB.
   - Why it matters: Every session has to stop and sort out which 'changes' are real. Someone could accidentally commit or undo the other assistant's work, and the repo grows with every build.
   - Suggestion: Copy the Karts and New avatar pattern to the other pages: write built pages only to the publish folder (dist) and test results only to the already-ignored results folder. Do it as one small tested chunk, with Codex reviewing the racing pages.
   - Time saving: No more 'what did the build change?' checks after each build, and cleaner reviews.
   - Verdict: partly_true
   - Verifier note: Twelve committed built bundles total 10.19 MB (measured with stat on the 12 index.html files). hand-lab/build.mjs line 18 and build-official-avatar-page.mjs lines 45 and 47 write into the source folders. skeleton-test/index.html has 51 commits and racing-lab/index.html 37. karts and new-avatar write only to dist. HANDOFF Practical notes item 1 documents the issue. But the '77 committed check-result files' count does not reproduce: git ls-files finds 89 CHECK/RESULTS files in total, of which 55 are inside checkpoints and never rewritten, leaving 34 outside (32 in racing-core and racing-lab). Today's file times show the bundles and racing result files in this checkout were rewritten (16:50-16:55), yet git status is clean. So rebuilding with unchanged sources gives identical files; 'changes' appear only when shared code really changes. Bundle copies in history take only 17.6 MB on disk of the 168 MB .git, so 'the repo grows with every build' is minor.

13. **The main website address opens an old 17 November prototype**
   - Id: INV-8
   - Kind: problem
   - Severity: low
   - Detail: The site's front page (the bare project URL) still shows the first walk, run and jump prototype from 17 November, with a grey background that doesn't match the lab colour rule. The README itself calls it an earlier prototype. Anyone you send the main link to, and any session that opens the root, sees outdated work instead of the Test Lab or the driving test.
   - Evidence: index.html loads /src/main.ts. src/main.ts was last changed 2026-11-17 ('Floor slab with the approved avatar: walk, run, jump'). index.html line 7 sets background #dcd9d3, while CLAUDE.md rule 14 says #405363 for live labs. README.md section D item 2 lists 'the site root' among the earlier prototypes.
   - Why it matters: It gives the wrong first impression and causes confusion about what the game currently is.
   - Suggestion: Make the front page send visitors straight to the Test Lab for now, and later to the real game. The old prototype stays in git history.
   - Time saving: No more checking 'which link is the right one'.
   - Verdict: confirmed
   - Verifier note: index.html loads /src/main.ts (line 13) and sets background #dcd9d3 on line 8 (not 7). It has had only 1 commit (16 Nov). src/main.ts was last changed 17 Nov ('Floor slab with the approved avatar: walk, run, jump'). README line 24 lists the site root among earlier prototypes. I lowered the severity because the README and the owner's own links all point to /test-lab/ and /racing-lab/, so the root page is rarely opened.

14. **The same basic job is written several times in different folders**
   - Id: INV-10
   - Kind: problem
   - Severity: low
   - Detail: Reading controls (keyboard, touch, controller) exists as four separate pieces of code, and 'move a character around' as four separate controllers, left over from different prototypes. Only some are used by current pages.
   - Evidence: Input modules: src/input.ts, movement/input.js, motion-lab/src/input.js and racing-core/input.js. Movement controllers: motion-core/controller.js, movement/controller.js, run-test/controller.js and src/player.ts. motion-core-test/main.js line 6 still uses movement/input.js, while motion-lab/src/page.js line 3 uses motion-lab/src/input.js.
   - Why it matters: A fix or improvement made in one copy doesn't reach the others, so the same controls can behave differently on different pages.
   - Suggestion: When doing the shared-folder chunk (INV-2), keep one input module and one movement controller, point every live page at them, and retire the rest.
   - Time saving: Control fixes are made once instead of chased across pages.
   - Verdict: confirmed
   - Verifier note: These files all exist: src/input.ts, movement/input.js, motion-lab/src/input.js, racing-core/input.js, motion-core/controller.js, movement/controller.js, run-test/controller.js and src/player.ts. motion-core-test/main.js line 6 uses movement/input.js; motion-lab/src/page.js line 3 uses ./input.js. racing-core/input.js is reached only through racing-core/index.js (line 7), which only the dead racing-lab/src/simulation.js imports.

15. **Dead code is kept, and some of it is still tested on every publish**
   - Id: INV-11
   - Kind: problem
   - Severity: low
   - Detail: A few files are known to be unused but are still in the tree. The racing team's old prototype (nine files at the top of racing-core) is used by no page, but the publish checks still test it every time.
   - Evidence: racing-lab/README.md line 13 says src/simulation.js and src/track-view.js are 'unused prototype files'. motion-lab/src/walker.js has no references (grep). My import trace finds no live page reaching racing-core/{driver,ghosts,session,progress,track,vehicle,input,math,index}.js, yet racing-core/tests/core.test.mjs line 20 imports createRaceSession and others from '../index.js', and CI runs it via test:racing-core (deploy.yml). racing-core/README.md line 1 calls that code 'the superseded racing prototype, retained for history'.
   - Why it matters: It adds publish time and confusion, though this is minor.
   - Suggestion: Let Codex decide whether the old prototype tests still protect anything. If not, move them and the dead files to the archive (git keeps the history).
   - Time saving: Slightly faster checks and less to read.
   - Verdict: confirmed
   - Verifier note: racing-lab/README.md line 13 calls src/simulation.js and src/track-view.js unused. motion-lab/src/walker.js is mentioned only in docs/NEXT.md and inside the frozen test-lab-1 bundle, never imported by live code. racing-core/README.md's first paragraph ends 'Everything below describes the superseded racing prototype, retained for history.' racing-core/tests/core.test.mjs line 20 imports createRaceSession and others from ../index.js. The only other importer of that index is the dead racing-lab/src/simulation.js. CI runs this file through test:racing-core, which takes about 53-99 s per publish (I cannot split out how much of that is the old prototype).

16. **Some tests are not wired in, and one known-failing test is documented as the Test Lab check**
   - Id: INV-12
   - Kind: problem
   - Severity: low
   - Detail: Several test files are never run by any script: the Test Lab's own documented check (which is already known to fail), the old run and walk tests, and four avatar socket checks. One of the inspector's examples (the track-view test) is in fact run on every build.
   - Evidence: 31 files not referenced in package.json (script output), including test-lab/test.mjs, run-test/test.mjs, walk-test/test.mjs, tests/avatar/{elbow,hip,knee,shoulder}-sockets.mjs and racing-lab/tests/track-view.test.mjs. test-lab/README.md says 'After building, run node test-lab/test.mjs'. HANDOFF kart item 37 (line 96) says test-lab/test.mjs 'already fails at its Inspection tap (line 20)'.
   - Why it matters: A test that isn't run, or is known to fail, gives false comfort.
   - Suggestion: Either fix test-lab/test.mjs and add it to the checks, or mark it retired. List or remove the draft socket tests.
   - Verdict: partly_true
   - Verifier note: Confirmed not wired anywhere (not in package.json, not imported or spawned by any script): test-lab/test.mjs, run-test/test.mjs, walk-test/test.mjs and tests/avatar/{elbow,hip,knee,shoulder}-sockets.mjs. test-lab/README.md line 34 documents test-lab/test.mjs, and HANDOFF line 96 says it 'already fails at its Inspection tap (line 20)'. But racing-lab/tests/track-view.test.mjs is NOT an orphan: racing-lab/build.mjs line 7 runs it on every build. My own scan could not reproduce the exact '31' figure.

17. **Git history doesn't show which assistant made a change**
   - Id: INV-13
   - Kind: risk
   - Severity: low
   - Detail: Most of Codex's work is recorded under your name and personal email, not 'Codex'. That makes it hard to tell later who changed what, and your personal email is visible in the public history.
   - Evidence: Authors: 'Isaias U <(owner email removed)>' 104 commits, 'Codex <codex@openai.com>' 17. All 40 racing-core and racing-lab commits are under the owner identity, with no trailer naming Codex (git log -3 --format=%B).
   - Why it matters: When something breaks, knowing which assistant made the change speeds up the fix and the review.
   - Suggestion: Ask Codex to commit under its own name, or at least add a short 'by Codex' line to each commit message, like Claude does.
   - Time saving: Faster tracing of who to ask when something breaks.
   - Verdict: confirmed
   - Verifier note: git shortlog shows 104 commits under the owner identity, 2 under the owner's GitHub username identity, 17 under Codex and 304 under Claude. All 40 racing-core and all 40 racing-lab commits are under the owner identity, with no trailer naming Codex. Stronger evidence: HANDOFF item 74 calls the 23 Nov 05:25 push a 'Codex push', and that commit ('Add Neighborhood road practice to the Driving Test') is authored under the owner identity. The owner's email is visible in public commit metadata.

18. **Ownership is written down and mostly matches the folders**
   - Id: INV-18
   - Kind: strength
   - Severity: low
   - Detail: Who owns what (Claude: movement, Skeleton, avatar rebuild, kart looks; Codex: driving and racing) is written in one table, and the git history matches it folder by folder. The newer Karts and New avatar pages are built the cleaner way, writing only to the publish folder.
   - Evidence: docs/COLLABORATION.md lines 13-15 and 32-36. Author counts: avatar-v2 65/65 Claude, new-avatar 56/56 Claude, karts 7/7 Claude, racing-core and racing-lab 40/40 owner identity (Codex). karts/build.mjs and new-avatar/build.mjs write only to dist/.
   - Why it matters: Clear ownership avoids the two assistants overwriting each other.
   - Suggestion: Record the ownership column in the folder status table (INV-1) so it is visible at a glance.
   - Verdict: confirmed
   - Verifier note: docs/COLLABORATION.md lines 13-15 hold the confirmed table, and lines 30-36 the recommended one. The owner update right after it gives the avatar rebuild to Claude, with Codex reviewing. Kart looks being Claude's comes from HANDOFF item 36, not that table. Author counts match: avatar-v2 65/65 Claude, new-avatar 56/56, karts 7/7, racing-core and racing-lab 40/40 owner identity (Codex). Older study folders are mixed: foot-lab has Claude 1, Codex 7, owner identity 23. The repo shows no record of the promised Codex review of the avatar rebuild.

### Missed by inspector found by skeptic

1. **The publish wait comes from browser checks, not from file size**
   - Kind: problem
   - Severity: high
   - Detail: After every push, the owner waits about 6 to 10 minutes before a change shows up on the phone. Almost all of that time goes to automatic browser checks, most of them for driving, plus the racing tests. Uploading the site takes only about 10 seconds. So the real way to cut the wait is to run fewer or faster checks per push, not to publish fewer files.
   - Evidence: Per-step times from the GitHub API for 6 successful deploy.yml runs (45217820916, 45141886106, 45135216079, 45127776460, 45123225143, 45118639796): 'Check actual pages before publishing' 214-346 s, 'npm run build' 66-131 s, 'npm run test:racing-core' 53-99 s, 'Install pinned test browsers' 37-68 s, peaceiris/actions-gh-pages 8-11 s. In scripts/check-lab-foundations-browser.mjs lines 11-23, 9 of the 11 suites are racing-lab and they run one after another. racing-lab/build.mjs line 7 runs 8 more racing tests inside every build. HANDOFF item 74 records the owner's 10-minute-wait complaint.
   - Suggestion: Ask Codex, who coordinates releases, to run the driving browser checks only when racing files change, or to run the suites side by side. Re-measure the wait afterwards.

2. **Every failed publish came from one driving test timing out**
   - Kind: risk
   - Severity: medium
   - Detail: All three failed publishes in the last 100 failed on the same step: a driving browser test that ran out of time. When it fails, nobody's change goes live, including avatar work that has nothing to do with driving. That is how the owner ended up waiting on 23 November.
   - Evidence: gh run view --log-failed for runs 45117726873 (23 Nov 05:25), 45071093446 (22 Nov 21:15) and 45058267889 (22 Nov 19:00) shows 'TimeoutError ... Timeout 30000ms exceeded' at racing-lab/tests/driving-browser.mjs:28 or :241. HANDOFF item 74 says that Codex run 'failed its own driving test' and that 'a failing test blocks everyone's changes'.
   - Suggestion: Ask Codex to make that driving check reliable, for example with a longer wait or one retry, and to keep a failing driving check from blocking unrelated avatar publishes.

3. **Pushes that only change notes still run the full 6-10 minute publish**
   - Kind: opportunity
   - Severity: medium
   - Detail: About a third of recent commits changed only notes and documents, which never affect the website. Each of those pushes still runs every test and the full rebuild, and it can cancel another assistant's publish that was still running.
   - Evidence: Since 2026-11-21, 33 of 109 non-merge commits on origin/main touched only docs/ or .md files (git log --name-only). deploy.yml lines 3-10 trigger on every push to main, with no paths-ignore. Lines 15-17 cancel any publish already in progress; 18 of the last 100 runs were cancelled.
   - Suggestion: Add a rule so notes-only pushes skip the publish (paths-ignore for docs/** and **/*.md). It is a small, safe change that saves several minutes per notes push.

4. **The whole game design is publicly readable**
   - Kind: risk
   - Severity: high
   - Detail: The owner wants nobody to steal the idea. Right now the full feature list, all 20 minigame designs and the world rules sit in a public GitHub repository anyone can read and copy. The repository has no license file. That means others have no legal permission to reuse the code, but it does nothing to hide the ideas. Making the repository private hides the documents. Keeping GitHub Pages working on a private repository needs a paid plan (for example GitHub Pro), and the test website itself would still be public.
   - Evidence: gh api repos/isaiasurrutia96/3D-World-4 returns private:false, visibility:public, license:null, forks_count:0. docs/FEATURES.md line 3: 'Every feature idea the owner has had, in one place.' docs/MINIGAMES.md line 3: '20 minigames.' docs/WORLD-RULES.md is 'The one place for the world's blocks, their rules and the minigames they serve.' There is no LICENSE file (git ls-files). GitHub's docs say Pages works in private repositories with Pro, Team or Enterprise, and that such sites are still public unless the account uses Enterprise Cloud: https://docs.github.com/en/get-started/learning-about-github/githubs-plans and https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
   - Suggestion: Have the legal and business reviewer weigh this. A cheap first step is to make the repository private, on a plan that keeps Pages, or to move the design documents into a separate private repository. Do this before sharing links more widely.

5. **The most-changed page has no checks before it goes live**
   - Kind: risk
   - Severity: low
   - Detail: New avatar is where most of the work happens, yet it is published without any automatic check, and the same goes for Karts. Test scripts for both exist but are never run before publishing, so a broken New avatar page would still go live. The handoff says this is on purpose while New avatar is a visual prototype ('light checks').
   - Evidence: package.json defines test:new-avatar (line 38) and test:karts (line 35). deploy.yml lines 30-37 run only test:lab-foundations, test:official-avatar, test:racing-core, build and test:lab-foundations-browser. test-lab/foundation-browser.mjs mentions 'skeleton' but never new-avatar or karts. new-avatar/build.mjs and karts/build.mjs run no checks. Since 21 Nov, new-avatar has had 45-46 commits.
   - Suggestion: Add a quick 'the page opens without errors' check for New avatar and Karts. It is cheap, and it catches a blank page before the owner sees it.

6. **The publish robot and local machines run different Node versions**
   - Kind: risk
   - Severity: low
   - Detail: The publish robot uses one version of Node (the tool that runs the build) and local sessions use another, and the project does not say which one it expects. Most of the time this does not matter, but it can cause 'works here, fails on publish' surprises.
   - Evidence: .github/workflows/deploy.yml line 27 sets node-version: 24. The local machine runs node v22.23.5. package.json has no 'engines' field, and there is no .nvmrc or .node-version file.
   - Suggestion: Write the expected Node version down in one place (an engines field or .nvmrc) and use it in both places.

7. **The avatar build blocks heavy authoring code from reaching the page**
   - Kind: strength
   - Severity: low
   - Detail: The official avatar page build refuses to include the slow shape-making code. Phones download only the finished shapes, so pages stay light, and the build fails loudly if that rule is broken.
   - Evidence: scripts/build-official-avatar-page.mjs line 31 asserts that no collect, build, shoulder-design, elbow-design, hip-design, knee-design, mold-socket or PlayerModel file appears in the bundle's inputs. The esbuild metafile trace of skeleton-test/main.js confirms no wrist-lab, elbow-lab or foot-lab files are bundled.
   - Suggestion: Keep this guard, and copy the pattern when the New avatar gets its clean rebuild.

### Inventory

1. **Item 1**
   - Path: .github/
   - Purpose: The automatic publish workflow (deploy.yml): runs checks, builds, then publishes main to GitHub Pages
   - Status: tooling
   - Owner: shared
   - Notes: 5 commits, last 22 Nov. Codex is the default release coordinator per COLLABORATION.md. Cancels an in-progress publish when a new push arrives (lines 15-17).

2. **Item 2**
   - Path: .gitignore
   - Purpose: Tells git to ignore node_modules, dist, .vite and .test-results
   - Status: tooling
   - Owner: shared
   - Notes: 2 commits, last 22 Nov.

3. **Item 3**
   - Path: AGENTS.md
   - Purpose: Codex's entry point; points to HOW-TO-WORK-WITH-ME, CLAUDE.md, HANDOFF and COLLABORATION
   - Status: docs
   - Owner: shared
   - Notes: 844 bytes, last 21 Nov. Correctly avoids a second rule list.

4. **Item 4**
   - Path: CLAUDE.md
   - Purpose: Claude's working guide plus confirmed game decisions (section C)
   - Status: docs
   - Owner: Claude
   - Notes: 17 commits, last 21 Nov. Line 78 names 'src/input.js', which is ambiguous (only src/input.ts and motion-lab/src/input.js exist). Rule 17 names 2 of the 7 checkpoints.

5. **Item 5**
   - Path: README.md
   - Purpose: Project front page: current links (A), current work (B), checks (C), history (D)
   - Status: docs
   - Owner: shared
   - Notes: 19 commits, last 22 Nov. Good current/historical split for pages; nothing on folders. Links /references/motion-compare/ (SM64-derived).

6. **Item 6**
   - Path: index.html
   - Purpose: Site root page; loads src/main.ts (17 Nov walk, run and jump prototype on a floor slab)
   - Status: superseded
   - Owner: Claude
   - Notes: 1 commit (16 Nov). It is the page at the main site URL. Background #dcd9d3, not the slate lab colour. README section D calls it an earlier prototype.

7. **Item 7**
   - Path: package.json
   - Purpose: Project scripts and dependencies (three 0.180, vite 7.1.5, typescript 5.9.2, playwright)
   - Status: tooling
   - Owner: shared
   - Notes: 82 commits, last 23 Nov. 64 scripts (43 test, 18 build). 'build' chains tsc, vite and 15 lab builds, so one failure blocks all publishing.

8. **Item 8**
   - Path: package-lock.json
   - Purpose: Exact dependency versions for npm ci
   - Status: tooling
   - Owner: shared
   - Notes: 4 commits, last 19 Nov.

9. **Item 9**
   - Path: tsconfig.json
   - Purpose: TypeScript settings for the type check
   - Status: tooling
   - Owner: shared
   - Notes: 1 commit (16 Nov). Covers only src/. Most lab code is plain JS and racing-core runs its own strict TS check.

10. **Item 10**
   - Path: vite.config.ts
   - Purpose: Vite build of the 5 early pages (root, lab, oval, island, movement) plus a copy of public/
   - Status: tooling
   - Owner: shared
   - Notes: 5 commits, last 17 Nov. Every current lab is built by its own script instead.

11. **Item 11**
   - Path: node_modules/
   - Purpose: Installed packages (not in git)
   - Status: tooling
   - Owner: shared
   - Notes: Created by npm ci. Ignored by git.

12. **Item 12**
   - Path: avatar/
   - Purpose: The official approved avatar (official.json pinned by hash, assembled-joints delivery, light and game files) loaded by Our avatar and Skeleton. Also holds the frozen Avatar Checkpoint 1 viewer (index.html) and the authoring source (joint-assembly, joint drafts, hand-study)
   - Status: live-main
   - Owner: owner/Claude
   - Notes: 62 MB, 55 files, 12 commits, 17-20 Nov. Has its own nested package.json. Imports code from wrist-lab, elbow-lab, foot-lab and reference/. The 35.8 MB master parts file is copied to the site but not fetched by pages.

13. **Item 13**
   - Path: avatar-lab/
   - Purpose: Historical hand and foot authoring viewer for Avatar Checkpoint 2
   - Status: superseded
   - Owner: owner/Claude
   - Notes: 28 commits, last 19 Nov. README says historical. Still built and published at /avatar-lab/ but not in the Test Lab menu. skeleton-test/attach.js lines 20-22 import its chest-bend, hand-skin and avatar code, so it can't be removed yet.

14. **Item 14**
   - Path: avatar-test/
   - Purpose: Test Lab 'Our avatar' page
   - Status: live-main
   - Owner: Claude
   - Notes: Only build.mjs plus a committed 621 KB bundle. It is the Skeleton bundle with the title swapped (scripts/build-official-avatar-page.mjs line 34). 39 commits, last 20 Nov.

15. **Item 15**
   - Path: avatar-v2/
   - Purpose: Source for the New avatar rebuild (torso, balls, limbs, head, face, sockets, assembled body)
   - Status: active-experiment
   - Owner: Claude
   - Notes: 41 files, 65 commits, all 20-23 Nov. HANDOFF item 64 says visuals-only prototype with a clean rebuild after approval. README is stale ('Current state 21 November'). original-body.js is 87 KB.

16. **Item 16**
   - Path: checkpoints/
   - Purpose: Seven frozen, hash-checked copies of approved versions (avatar-2, avatar-joints-1, driving-1, driving-2, island-1, motion-lab-1, test-lab-1)
   - Status: approved-checkpoint
   - Owner: shared
   - Notes: 51 MB. The build refuses to publish if any file changed. README covers only 4 families. island-1 tag not on GitHub, and avatar-joints-1 has no tag. test-lab-1 contains run and walk test bundles with SM64 data.

17. **Item 17**
   - Path: docs/
   - Purpose: Owner rules, handoff, collaboration, features, minigames, world rules, karts, learning notes, game-dev knowledge base (20 topics), kart driving references
   - Status: docs
   - Owner: shared
   - Notes: 24 MB, almost all kart concept images in docs/karts. 246 commits (Claude 225). HANDOFF.md is 79 KB and 13,101 words. NEXT.md items 41-46 describe removed code (per HANDOFF).

18. **Item 18**
   - Path: elbow-lab/
   - Purpose: Static elbow study (upper arm, ball, forearm) for the 19 Nov official avatar
   - Status: unclear
   - Owner: Codex
   - Notes: 3 commits (owner identity), all 19 Nov. Still in the Test Lab menu (Elbow) and published. Code imported by avatar/ and tests. No doc says whether the page is still current.

19. **Item 19**
   - Path: foot-lab/
   - Purpose: Foot socket and rounded-rim study (Test Lab 'Feet')
   - Status: unclear
   - Owner: Codex
   - Notes: 31 commits, 17-19 Nov (owner identity 23, Codex 7). Code imported by avatar/ (8 files), avatar-lab and wrist-lab. The page is an old study, but the code feeds the official avatar build.

20. **Item 20**
   - Path: hand-lab/
   - Purpose: Finger curl, thumb and pose study (Test Lab 'Hands')
   - Status: unclear
   - Owner: Codex
   - Notes: 15 commits, last 18 Nov. Used by avatar-lab, references and walk-test. Committed 790 KB bundle.

21. **Item 21**
   - Path: island/
   - Purpose: Vite page 'Floating island' (world blocks study)
   - Status: active-experiment
   - Owner: Claude
   - Notes: Paused since 19 Nov. Design approved as checkpoint island-1. Rebuilt cleanly in src/world with test:island and test:world. Listed under 'World & other studies'.

22. **Item 22**
   - Path: kart-parts/
   - Purpose: Look-only kart models (GoKart, GT, F1) and parts data. product-prototypes.js is the driving prototype body
   - Status: active-experiment
   - Owner: Claude
   - Notes: 8 commits, 21-22 Nov. product-prototypes.js (owner-identity, Codex) is imported by racing-lab/src/prototype-kart-view.js line 2, so the driving test depends on this folder.

23. **Item 23**
   - Path: karts/
   - Purpose: Test Lab 'Karts' page
   - Status: active-experiment
   - Owner: Claude
   - Notes: 7 commits, 21-22 Nov. Builds only to dist/ (good pattern).

24. **Item 24**
   - Path: lab/
   - Purpose: Vite page 'Blocks': early demo of a voxel diamond on the slate stage
   - Status: unclear
   - Owner: Claude
   - Notes: 3 commits, all 17 Nov. Still in the Test Lab menu. No doc says whether it is still needed.

25. **Item 25**
   - Path: motion-core/
   - Purpose: Claude's skeleton (bones, poses, reach, balance, hands) and movement controller
   - Status: live-main
   - Owner: Claude
   - Notes: 50 commits, last 20 Nov (walk/run removed). Used by Skeleton, New avatar, kart sizing and, through motion-lab, the driving page.

26. **Item 26**
   - Path: motion-core-test/
   - Purpose: Test Lab 'Movement rules (section 1)': placeholder marker steered by the motion-core controller
   - Status: live-main
   - Owner: Claude
   - Notes: 9 commits, last 18 Nov. Imports ../movement/input.js from the old movement prototype (main.js line 6). Committed 510 KB bundle.

27. **Item 27**
   - Path: motion-lab/
   - Purpose: Marker and input harness; its page.js and input.js are the shared base for the driving page. 'Motion study' in the Test Lab
   - Status: live-main
   - Owner: shared
   - Notes: 28 commits, last 22 Nov. racing-lab/src/main.js line 2 imports it. Frozen copy in checkpoints/motion-lab-1. src/walker.js is unreferenced.

28. **Item 28**
   - Path: movement/
   - Purpose: 17 Nov grounded walk and run prototype
   - Status: superseded
   - Owner: Codex
   - Notes: 2 commits (17 Nov). Still built by Vite and published at /movement/. Its input.js is imported by motion-core-test.

29. **Item 29**
   - Path: new-avatar/
   - Purpose: Test Lab 'New avatar' page; bakes the torso-sockets shapes file at build time
   - Status: active-experiment
   - Owner: Claude
   - Notes: 56 commits, 20-23 Nov. Builds only to dist/ (2.6 MB page plus a 5.7 MB baked file on the site).

30. **Item 30**
   - Path: oval/
   - Purpose: Vite page 'Oval track' (NASCAR-style oval from 3D-WORLD-3)
   - Status: unclear
   - Owner: Claude
   - Notes: 2 commits, 17 Nov. Racing tracks now live in racing-core. Still in the Test Lab menu.

31. **Item 31**
   - Path: public/
   - Purpose: Files Vite copies to the site as-is: public/test-lab (the real Test Lab UI and subject list), lab videos, and public/references (reference videos)
   - Status: live-main
   - Owner: shared
   - Notes: 19 MB, 72 commits. public/test-lab/main.js is the hub. public/references is 18 MB of reference videos including SM64 Mario renders (superseded, legal risk), published automatically.

32. **Item 32**
   - Path: racing-core/
   - Purpose: Codex's racing logic: fresh layers track/, kart/, contacts/, testing/ plus PLAN.md approval record
   - Status: live-main
   - Owner: Codex
   - Notes: 83 files, 40 commits, last 23 Nov. The nine top-level .js files are the superseded prototype kept for history and still exercised by CI's test:racing-core. Tests rewrite committed CHECK-RESULTS files.

33. **Item 33**
   - Path: racing-lab/
   - Purpose: Driving test (?drive=1) and track inspection page (Test Lab 'Tracks')
   - Status: live-main
   - Owner: Codex
   - Notes: 57 files, 40 commits, last 23 Nov. Committed 3.0 MB bundle, 14 committed check-result JSON files. src/simulation.js and src/track-view.js are unused (README line 13).

34. **Item 34**
   - Path: reference/
   - Purpose: Old island v1 code kept only so tests/island/check.mjs can prove the rebuild is identical
   - Status: superseded
   - Owner: Claude
   - Notes: 3 files, 1 commit (17 Nov). Name easily confused with references/.

35. **Item 35**
   - Path: references/
   - Purpose: 17 Nov scripts that extracted Super Mario 64 walk data and model, rendered comparison videos, and retargeted the walk onto the avatar
   - Status: superseded
   - Owner: Codex
   - Notes: 25 files, 8 commits, all 17 Nov. references/avatar-walk/matched.js and source-walk.js (embedded SM64 animation) are still imported by run-test and walk-test. Legal risk.

36. **Item 36**
   - Path: run-test/
   - Purpose: 17 Nov playable running prototype
   - Status: superseded
   - Owner: Codex
   - Notes: 22 commits, last 19 Nov. Built and published at /run-test/, not in the Test Lab menu. Its bundle contains SM64-derived motion.

37. **Item 37**
   - Path: scripts/
   - Purpose: Shared build helpers: official avatar page, study baker, checkpoint verifier, light/game avatar maker, browser foundation check, previews of old joint drafts
   - Status: tooling
   - Owner: shared
   - Notes: 18 files, 12 commits, last 22 Nov. scripts/preview/* serve the old joint drafts.

38. **Item 38**
   - Path: skeleton-test/
   - Purpose: Test Lab 'Skeleton (section 2)': the official avatar on the motion-core skeleton with 8 poses and a Detailed/Light/Game switch
   - Status: live-main
   - Owner: Claude
   - Notes: 52 commits, last 20 Nov. Committed 622 KB bundle rewritten by every build (51 commits on index.html). Depends on avatar-lab.

39. **Item 39**
   - Path: src/
   - Purpose: Mixed: shared helpers used by live labs (test-lab-scene.ts, inspection-zoom.ts, study-binary loaders), world and island code, and the old root prototype (main.ts, player.ts, input.ts)
   - Status: live-main
   - Owner: shared
   - Notes: 27 files, 44 commits, last 19 Nov. The only folder the TypeScript check covers.

40. **Item 40**
   - Path: test-lab/
   - Purpose: Docs (README, FOUNDATIONS) and checks for the Test Lab; the UI itself is in public/test-lab
   - Status: docs
   - Owner: shared
   - Notes: 23 commits, last 22 Nov. test.mjs is documented but not in package.json, and HANDOFF says it fails at the Inspection tap.

41. **Item 41**
   - Path: tests/
   - Purpose: Avatar, island and world checks plus study-asset checks
   - Status: tooling
   - Owner: shared
   - Notes: 18 files, 15 commits, last 19 Nov. tests/avatar/{elbow,hip,knee,shoulder}-sockets.mjs are drafts not wired into any script.

42. **Item 42**
   - Path: walk-test/
   - Purpose: 17 Nov walking prototype
   - Status: superseded
   - Owner: Codex
   - Notes: 20 commits, last 19 Nov. Published at /walk-test/, not in the Test Lab menu. Its bundle contains SM64-derived motion.

43. **Item 43**
   - Path: wrist-lab/
   - Purpose: Static wrist fit study (forearm, ball, hand) for the 19 Nov official avatar (Test Lab 'Wrist')
   - Status: unclear
   - Owner: Codex
   - Notes: 6 commits, all 19 Nov. Committed 4.3 MB parts file plus 548 KB bundle. Code imported by avatar/ and elbow-lab.

## Game vision and design completeness
**Area summary:** The project has a lot of careful design work. There are 15 approved feature cards, 20 approved minigame cards, 26 approved world blocks and a detailed kart plan, all written up in tidy, consistent templates. What it lacks is the short top layer that says what the game is. Nowhere in the repo is there a one-sentence pitch, a written core loop, a target player, design pillars or a defined first version, even though the repo's own production and App Store notes say to write these first. The idea list is studio-sized for one person: online worlds of 100 to 200 players, a connected island world, free building on home islands, 20 sports, three kart classes with 60 style pictures, fights and stealing, and about 65 avatar movements. So far only a solo driving test and a posing avatar actually work, because walking and running were reset on 20 Nov. Several docs contradict each other on small but real points (power meters, kart speeds, ghosts, building, the starter kart). The riskiest feature for a solo builder is online multiplayer, and the biggest hidden workload is animation.

### Key facts
1. No one-sentence pitch, core loop, design pillars, target player or first-version scope exists in any .md file. A grep for 'core loop|pillar|target player|audience|MVP|first version|vertical slice|game design document' matches only the generic advice in docs/game-dev/13-production.md:5,10 and docs/game-dev/20-app-store-blueprint.md:29-32.
2. docs/FEATURES.md has 19 numbered cards: 15 approved, 1 removed (bikes, line 304), 1 moved to the movement plan (climbing, line 308), 1 covered by other cards (clouds, line 311) and 1 still an idea (objects list, line 367).
3. docs/MINIGAMES.md has 20 approved minigame cards (numbers 1-16 and 18-21; diving, number 17, is 'just for fun'). Paintball includes a later 'big island survival' mode that 'needs online' (lines 241-244). Power-ups are 'proposed (not approved yet)' (line 35), and open-world races with spectators are an 'idea' (line 251).
4. docs/WORLD-RULES.md approves 26 blocks (line 71) and three shared systems: one ball system, one hit system and one rod grip system (lines 49-55).
5. docs/KARTS.md sets three kart classes (GoKart, GT, F1; lines 13-22), 20 shape styles per class (sections H and I) and more than 15 customizable body-part categories (line 47-49). 32 concept images are tracked in docs/karts/ (git ls-files: 35 files, 24 MB).
6. All 35 feature and minigame cards were approved on one day, 19 Nov 2026. git log shows 59 commits to FEATURES/MINIGAMES/WORLD-RULES/KARTS on 2026-11-19, 10 on 2026-11-21 and 5 on 2026-11-22.
7. Platform decision (docs/NEXT.md:46-63, approved 18 Nov): web first with Three.js and TypeScript, playable on the owner's 2015/2016 MacBook and on a phone by link, then wrapped for Steam and the phone stores, and later ported to consoles. The game logic is kept separate from the drawing code to make that easier.
8. Money: 'No real money for now' (docs/FEATURES.md:162). Paid vs free vs in-app purchases is listed as a later decision (docs/game-dev/20-app-store-blueprint.md:125-130).
9. Online: 'single player first; online later (needs a server)' (docs/FEATURES.md:345-346), with 'about 100-200 players per world (later)' (line 357). 14 of the 15 approved feature cards have an '8. Online' section.
10. Racing status (racing-core/PLAN.md:70-83): track, handling and contacts are built. Race rules, computer opponents, ghosts/time trials, shared device controls and a playable build outside the Test Lab are all 'Not started' or 'Deferred'.
11. Avatar movement status: walking and running were rejected ('absolutely terrible') and removed on 20 Nov. The Skeleton section is back to 8 poses (docs/NEXT.md:448-500, docs/HANDOFF.md:11,15-16).
12. Code search: no game code mentions watch, minigame, paintball, item wheel or multiplayer (0 files). Golf and bowling appear only as description text in src/world/rulebook.ts.
13. Since 21 Nov, 58 of 130 commits touched avatar-v2/ or new-avatar/ (avatar appearance work). Since 19 Nov, src/ (world code) has had 1 commit.
14. The closest thing to a written vision is docs/HANDOFF.md:19: the rigid ragdoll avatar 'is central to the owner's goal of throws and shots that look unlike other games'. docs/HANDOFF.md:89 (item 75b) holds a proposed game-feel goal that is still awaiting the owner's approval.
15. No final game name is recorded. 'LetsGo Racing' is the name of the old racing game in 3D-WORLD-3 that racing-core recreates (racing-core/PLAN.md:11). The page title is '3D-World-4' (index.html).

### Findings

1. **The idea list is far too big for one person and there is no first version**
   - Id: PLAN-2
   - Kind: risk
   - Severity: critical
   - Detail: The approved plan really is studio-sized: 15 features, 20 minigames with computer opponents at 3 difficulty levels, 26 blocks, 3 kart classes, a connected island world, building, and 100-200 player online worlds. There is no written Version 1 list. A few 'do this first' hints are scattered around, though: single player first, paintball team mode first, start with few islands, and one kart model per class (owner, 22 Nov). The owner already cuts scope in places. What is missing is one list that applies that habit to the whole game.
   - Evidence: docs/FEATURES.md: 15 cards marked approved (lines 21-358). docs/MINIGAMES.md: 20 approved game cards (lines 44-249), with paintball survival 'later, needs online' at lines 241-244. Every minigame lobby has NPCs with 'easy, medium, hard' (lines 11-12). docs/WORLD-RULES.md:71 lists 26 blocks. docs/KARTS.md sections H and I list 60 styles. docs/FEATURES.md:357 says 100-200 players per world. racing-core/PLAN.md:79-83 lists race rules, opponents, ghosts, controls and a playable build as 'Not started' or 'Deferred'. docs/NEXT.md:484-497 records the movement reset. A code grep finds 0 files for watch, minigame, paintball and item wheel. Only scope hint: 'islands at launch (start small)' at docs/FEATURES.md:137.
   - Why it matters: Main goal: get the game to actually work. With no finish line, a solo builder can spend months polishing pieces and still have nothing playable from start to finish. This is the single biggest threat to the game ever working.
   - Suggestion: Tag every card 'Version 1', 'Version 2' or 'Later', and keep Version 1 tiny. One recommendation: single player, one small island, walk/run/jump, the kart time trial (needs no computer opponents; racing is already the most advanced part), then a kart race with computer opponents, then one take-turns sport such as mini golf, plus coins and a small cosmetic shop. Everything else waits until that loop is fun on a real phone.
   - Time saving: Cuts the work needed for a first playable game by an estimated large majority, since roughly 30 of the 35 cards can wait. AI help also goes only to things that ship first.
   - Verdict: partly_true
   - Verifier note: The counts check out. FEATURES.md has 15 approved cards. MINIGAMES.md has 20 approved cards (1-16 and 18-21), NPC difficulty levels at lines 11-12, and the paintball survival mode at lines 241-244. WORLD-RULES.md:71 has 26 blocks, KARTS.md sections H and I have 60 styles, and FEATURES.md:357 says 100-200 players. Racing stages 4-8 are not started or deferred (racing-core/PLAN.md:79-83). One claim is overstated: 'nothing marks which cards belong in the first version'. A few ordering hints do exist: 'single player first' (FEATURES.md:345), paintball 'Team match (build first)' (MINIGAMES.md:237), 'islands at launch (start small)' (FEATURES.md:137), and, most importantly, the owner's 22 Nov decision to 'start with one model per class to get the driving fundamentals right first' (docs/karts/PARTS-KIT.md:126-130). That decision makes the 60 kart styles a smaller burden than the finding suggests. Critical is defensible, because the owner's main goal is a game that works.

2. **There is no one-page game brief (pitch, player, loop, pillars, first version)**
   - Id: PLAN-1
   - Kind: problem
   - Severity: high
   - Detail: No document says in one sentence what the game is, who it is for, what the player does minute to minute and why they keep playing, or which 3 or 4 ideas every decision must serve. The pieces are scattered across many files, but nobody has written them down together. The repo's own guides say this page comes first, before building anything.
   - Evidence: grep over all *.md for 'core loop|pillar|target player|audience|MVP|first version|vertical slice|game design document|elevator' finds only docs/game-dev/13-production.md:5 ('Concept: what is the core action and why is it fun? One sentence') and docs/game-dev/20-app-store-blueprint.md:29-32 ('One-sentence concept; who plays it; how it makes money ... Game design document: core loop ... Scope: the smallest version worth selling'). README.md lists only test pages. docs/HOW-TO-WORK-WITH-ME.md:16-17 says the owner decides 'what the game is'.
   - Why it matters: Without a short brief, every small chunk gets approved on its own and nothing says when the game is done. Both AI assistants also have no shared yardstick for saying 'this is out of scope'. That is how weeks go into details that may never ship.
   - Suggestion: Write one page (A to F sections) using material that already exists. A draft pitch for the owner to edit: 'Run, drive and swim across a connected island world as a chunky ragdoll athlete, playing real-feeling sports and kart races to win coins and prizes that customize your kart, outfit and home island.' Add the target age, the platform for version 1, the core loop, 3 or 4 pillars and the version 1 list. Ask both assistants to check every new request against it.
   - Time saving: A single reference page stops repeated discussions and out-of-scope builds. Each new chunk can be accepted or deferred in one line instead of a long talk.
   - Verdict: confirmed
   - Verifier note: I searched every .md file outside node_modules and checkpoints for core loop, pillar, target player, audience, MVP, first version, vertical slice, game design document, elevator pitch and one-sentence. The only hits are generic advice: docs/game-dev/13-production.md:5,10 and docs/game-dev/20-app-store-blueprint.md:29-31, plus a passing 'mixed-audience' in 19-legal.md:101. README.md lists only test pages. HOW-TO-WORK-WITH-ME.md:16 says the owner decides 'what the game is', but no file writes it down. The closest things are NEXT.md:4 ('Movement should feel like Super Mario 64 as if it were made today') and HANDOFF.md:19. Neither is a game brief.

3. **Online multiplayer is the riskiest feature, and it is written into almost every card**
   - Id: PLAN-3
   - Kind: risk
   - Severity: high
   - Detail: Online play with 100 to 200 players per world, real fights between players, items that others can grab, text chat, block and report, friends lists, invites and an online battle-royale paintball mode are all approved on paper. Running this needs a server that costs money every month, cheat protection, moderation and player accounts. Accounts bring more app-store rules, plus child-privacy law if kids play. The card itself wisely says 'single player first', but 14 of the 15 feature cards still describe online behavior.
   - Evidence: docs/FEATURES.md:340-358 (online card; 'single player first; online later (needs a server)' at 345-346; 'about 100-200 players per world' at 357; 'quick text or emote chat; block or report players' at 352). docs/FEATURES.md:235 ('a knocked-loose item drops; anyone can grab it'). docs/FEATURES.md:316 ('real fights between players'). docs/MINIGAMES.md:241-244 (survival mode 'needs online'). grep counts 14 '8. Online' sections in FEATURES.md. docs/game-dev/20-app-store-blueprint.md:67 ('If you add accounts, you must also add in-app account deletion'). docs/game-dev/19-legal.md:97 (COPPA). docs/game-dev/17-networking.md:52 lists server-side checks.
   - Why it matters: For one person, real-time online play is often bigger than the rest of the game put together. If the design assumes it everywhere, the single-player version can feel empty or unfinished.
   - Suggestion: Officially move online to 'Later' and make sure every Version 1 feature is fun alone or against computer players. When online comes, start with take-turns sports (golf, bowling, darts). The repo's own networking notes say these are far easier than real-time play. Leave 100-player worlds, open fights and stealing for last.
   - Time saving: Avoids designing and testing online rules for every feature now, and avoids paying for servers before anyone is playing.
   - Verdict: confirmed
   - Verifier note: Every citation checks out. FEATURES.md:345-346 ('single player first; online later (needs a server)'), :352 (chat, block, report), :357 (100-200 players), :235 (anyone can grab a dropped item) and :316 (real fights between players). MINIGAMES.md:241-244 has the survival mode that 'needs online'. grep counts exactly 14 '8. Online' sections; card 18 has 'Fairness' instead. 20-app-store-blueprint.md:67 covers account deletion, and 19-legal.md:97 covers COPPA. The risk is real, and the design leans on other players (stealing, coin loss in fights) even though online is deferred.

4. **Animation is the hidden giant: about 65 movements are needed, and walking does not work yet**
   - Id: PLAN-4
   - Kind: risk
   - Severity: high
   - Detail: By my count, the feature cards list about 45 avatar movements (door, kart in and out, 6 swim moves, 8 skateboard moves, 10 fight moves, climbing, emotes and so on). The minigames add about 20 more sport motions (putt, golf swing, bowl, shoot, throw, kick, goalie dive, bat, bow, dart, frisbee, skee-ball, pool cue, long jump, high jump, skating, skiing). Walking and running were built, rejected and fully reset on 20 Nov, and the current rule is one movement at a time with the owner's visual approval for each.
   - Evidence: '11. Movements' lines in docs/FEATURES.md:40,93-94,114-115,136,218,239,300-301,334-335,356, plus climbing and juke in docs/NEXT.md:233-241. Reset in docs/NEXT.md:448-456 and 484-497. One-at-a-time rule in docs/HANDOFF.md:15. The sport motions come from the MINIGAMES.md game cards. The counts are my own tally and are approximate.
   - Why it matters: Every feature depends on the avatar moving well. At one approved movement at a time, 65 movements could take longer than everything else combined, and the game can't be played until at least walking works.
   - Suggestion: Choose Version 1 content partly by how few new movements it needs (the kart race needs only get in, sit and steer, get out). Extend the 'one shared system' idea from WORLD-RULES to movements: one throw for football, frisbee and darts, and one swing for golf, bat and pool cue. Make walking and running the top avatar priority before more appearance work.
   - Time saving: Sharing movements across games could cut the animation list roughly in half.
   - Verdict: confirmed
   - Verifier note: I tallied the '11. Movements' lines in FEATURES.md (lines 40, 93-94, 114-115, 136, 218, 239, 300-301, 334-335, 356): 2+5+6+3+4+3+8+10+3 = 44 listed movements, with a few repeats (swing, ragdoll). NEXT.md items 29-31 (lines 230-244) add climbing, the juke and ragdoll. The sub-counts (6 swim, 8 skate, 10 fight) match. NEXT.md:484-500 (item 47) records the full reset, and HANDOFF.md:15 sets the one-movement-at-a-time rule. The 'about 20 sport motions' figure is a reasonable reading of the minigame cards. All counts are approximate, as the inspector said.

5. **Recent effort has gone into looks before the core works, against the project's own rule**
   - Id: PLAN-5
   - Kind: problem
   - Severity: high
   - Detail: Since 21 Nov, about half of all commits (67 of 140) went into the new avatar's shape, and about 6 in 10 (87 of 140) if you add the look-only kart models. The world code (src/) has had no changes since 19 Nov, and the avatar still cannot walk. Some of the avatar work also helps movement (how far joints bend), and the owner asked for it. Even so, most of the recent effort went to looks before the game has a playable loop. That goes against the project's own 'feel first, then looks' guide (docs/game-dev/README.md:31).
   - Evidence: docs/game-dev/README.md:31 ('feel first, then looks'). CLAUDE.md section C rule 16 ('keep visuals as placeholders until controls pass tests'). docs/game-dev/13-production.md:22 ('Small scope, finished'). git log since 2026-11-21: 58 of 130 commits touch avatar-v2/ or new-avatar/. Since 2026-11-19, src/ has 1 commit. docs/HANDOFF.md items 9-79 (lines 23-93) are mostly avatar shape iterations. docs/KARTS.md:123-164 covers 60 styles.
   - Why it matters: Looks are likely to change again once the game is playable, so polishing them now risks doing the work twice. The parts that make the game work (walking, a full race, one minigame) are still missing.
   - Suggestion: Freeze the avatar and kart looks at 'good enough placeholder' and agree that appearance work resumes only after the Version 1 loop is playable. Keep a 'looks wishlist' so ideas are saved rather than built now.
   - Time saving: Frees the large share of recent sessions that went to appearance and points it at playable features.
   - Verdict: partly_true
   - Verifier note: The direction is right, but some numbers and one rule citation are off. Counting from 2026-11-21 00:00 UTC, 67 of 140 commits (48%) touched avatar-v2/ or new-avatar/, not 58 of 130. Adding kart-parts/ (look-only kart models, per kart-parts/README.md:1) gives 87 of 140 (62%), so looks work is larger than the finding says. 'Since 19 Nov, src/ has had 1 commit' comes from a git --since query that started mid-day: src/ had 7 commits on 19 Nov and 0 since 20 Nov 00:00 UTC. CLAUDE.md rule 16 ('keep visuals as placeholders') is written for Motion Lab pages only, not the whole game. The general rule is game-dev/README.md:31 ('feel first, then looks'). Some avatar-v2 work also matters for movement: socket depth decides how far a joint bends (HANDOFF.md:25, elbow bends to 125 degrees), and the owner asked for the rebuild directly (HANDOFF.md:22, item 8). HANDOFF items 9-79 (lines 23-93) are indeed almost all avatar shape iterations.

6. **Several docs contradict each other**
   - Id: PLAN-6
   - Kind: problem
   - Severity: medium
   - Detail: These are small but real mismatches that could make an assistant build the wrong thing. (1) Golf and basketball cards use power meters, while the owner's proposed feel goal says no power meters. (2) The minigame doc says kart top speed is 120 (180 with boost), but the approved driving checkpoint is 180 (220 with boost). (3) The time trial card says ghosts already exist, but the racing plan says ghosts are not started. (4) World rules say players can never place blocks, but the home island lets them build with any block. (5) The starter kart is described three different ways. (6) The watch is 'always on him from the start' but also has a price and an 'owns it' flag. (7) The platform note says the game runs on the old MacBook, while the home island card says older laptops may not run it. (8) The world-rules minigame list is out of date (no paintball; lists swimming and diving). (9) An older handoff note calls kart customizing 'deferred', but it is approved.
   - Evidence: (1) docs/MINIGAMES.md:85, 106-107 vs docs/HANDOFF.md:89 (item 75b, awaiting approval). (2) docs/MINIGAMES.md:37-38 vs docs/HANDOFF.md:146 and racing-core/PLAN.md:558-559, 674. (3) docs/MINIGAMES.md:61 vs racing-core/PLAN.md:81 and README.md:11. (4) docs/WORLD-RULES.md:17 vs docs/FEATURES.md:53-55. (5) docs/FEATURES.md:76 ('around level 2') vs docs/KARTS.md:35 ('Everyone starts with it') vs docs/KARTS.md:95 ('old test kart is only for driving tests') vs docs/HANDOFF.md:163 ('No ... starter-kart assignment have been approved'). (6) docs/FEATURES.md:27 vs 37, 41. (7) docs/NEXT.md:48-50 vs docs/FEATURES.md:68-69. (8) docs/WORLD-RULES.md:19-47 (0 paintball mentions) vs docs/MINIGAMES.md:255-261. (9) docs/HANDOFF.md:95 vs docs/FEATURES.md:242-263 and docs/KARTS.md:42-66. Minor: docs/NEXT.md:223 says 25 blocks; WORLD-RULES says 26.
   - Why it matters: When two notes disagree, an assistant may follow the wrong one, and the owner later finds work built on an outdated decision. That means rework and extra back-and-forth.
   - Suggestion: Make one 30-minute cleanup pass: decide each of the 9 points, fix the losing note, and add a 'Decisions log' line with the date. Make one file the master for each topic (minigames in MINIGAMES.md, karts in KARTS.md) and have the others only link to it.
   - Time saving: Prevents rework caused by assistants following stale notes.
   - Verdict: confirmed
   - Verifier note: I checked each pair. (1) MINIGAMES.md:85 and :106-107 have power meters, while HANDOFF.md:89 item 75b says 'no power meters'. 75b is only a proposal awaiting approval, and MINIGAMES.md:28-29 says cards do not lock in controls, so this is a pending conflict, not a clash between two approved notes. (2) MINIGAMES.md:37-38 says 120->180 'as built'. That matches only the 'Original' profile. The approved Fast profile is 180/220 (racing-core/PLAN.md:558, :674; HANDOFF.md:146). (3) MINIGAMES.md:61 says ghosts exist, while racing-core/PLAN.md:81 says not started. The ghosts it means are in the superseded prototype (racing-core/ghosts.js, retired per racing-core/README.md:1), so the note is stale rather than invented. (4) WORLD-RULES.md:17 ('Players cannot break or place blocks') against FEATURES.md:53-55 (build mode): real. (5) FEATURES.md:76, KARTS.md:35, KARTS.md:94-95 and HANDOFF.md:163: real. (6) FEATURES.md:27 against :37 and :41: real. (7) NEXT.md:48-50 against FEATURES.md:68-69: real. (8) WORLD-RULES.md:19-47 has no paintball and lists swimming as item 20: real. (9) HANDOFF.md:95 against FEATURES card 18: real but historical. NEXT.md:223 says 25 blocks while the same line says the rulebook has 26. The inspector missed newer clashes from docs/karts/PARTS-KIT.md (see the missed findings).

7. **The overall feel isn't settled: arcade toy or realistic simulation?**
   - Id: PLAN-7
   - Kind: risk
   - Severity: medium
   - Detail: Some notes describe a cartoon arcade game: mystery boxes with a banana and a shock item, and a run that is 'kind of like Super Mario'. Other work aims for realism: the F1 kart preset uses measured 2026 Formula 1 acceleration, active aero and energy deployment, and the GT kart has six gears and traction control. Both can exist, but with no written pillars nobody knows which wins when they clash.
   - Evidence: docs/MINIGAMES.md:48-50 (banana, torpedo, last-place shock). docs/NEXT.md:422-425 ('kind of like Super Mario'). docs/KARTS.md:16-20 (GoKart arcade; GT and F1 'feels real'). docs/HANDOFF.md:128 ('six sequential gears ... rear traction control') and 135-139 ('2026 F1 ... active aero and energy deployment'). docs/HANDOFF.md:89 item 75b ('no power meters ... that make results easy').
   - Why it matters: Realistic physics takes far more tuning time than arcade physics, and mixing the two can confuse players. This choice decides how much work every vehicle and sport needs.
   - Suggestion: Pick one main feel as a pillar, for example 'arcade first, with a touch of realism'. Use the realistic presets only as optional extras later. Write it in the game brief so both assistants tune toward it.
   - Time saving: Avoids building and tuning detailed simulation models that the final game may not use.
   - Verdict: confirmed
   - Verifier note: I verified MINIGAMES.md:48-50 (banana, torpedo, last-place shock), NEXT.md:422-425 ('kind of like Super Mario'), KARTS.md:16-20 (GoKart arcade; GT and F1 'feels real'), HANDOFF.md:128 (six gears, traction control) and :135-139 (2026 F1 active aero and energy deployment). More evidence: docs/karts/GT3-DRIVING-REFERENCE.md (238 lines) and F1-DRIVING-REFERENCE.md (247 lines) are detailed real-car research based on Porsche and F1 data. Recent commits also include 'Add calibrated 2026 F1 tune' and several GT3 tuning commits. The arcade-versus-simulation question is open and is already using up time.

8. **Player 'levels' unlock many things, but no card says how you level up**
   - Id: PLAN-8
   - Kind: problem
   - Severity: medium
   - Detail: The home island unlocks 'around level 3', the starter kart 'around level 2', and islands and shop items are level-locked. But no card explains how a player earns levels or what a level means. This is the 'why keep playing' half of the core loop, and it is missing.
   - Evidence: docs/FEATURES.md lines 51, 76, 126, 131, 138, 154, 194, 198, 200, 254 all mention levels. A grep for 'experience points|XP|level up|levelling|leveling' in docs/ finds no text definition.
   - Why it matters: Coins, shop, prizes and unlocks only feel rewarding if there is a clear sense of progress. Without it, the loop has no backbone, and many cards point at a system that doesn't exist.
   - Suggestion: Add one short 'Progress and levels' card using the existing 12-question template, or drop levels from Version 1 and unlock things with coins only. That is simpler and may be enough at first.
   - Time saving: Settles a dependency that 10 places in the cards rely on, before any of them are built.
   - Verdict: confirmed
   - Verifier note: FEATURES.md mentions levels at lines 51, 76, 126, 131, 138, 154, 194, 198, 200 and 254 (10 lines). Searching docs/, README.md and racing-core/PLAN.md for experience point, XP, level up, levelling, leveling and 'earn levels' finds nothing. No card defines how levels are earned.

9. **The target player and money plan are undecided, but they change the design**
   - Id: PLAN-9
   - Kind: risk
   - Severity: medium
   - Detail: The toy-like karts and painted mannequin face could suit kids. But the plan also includes player fights, losing coins when knocked down, items others can steal, open chat and a shooter-style paintball mode. If kids are a main audience, child-privacy law and app-store age rules affect chat, accounts and purchases. Whether the game is paid, free, or free with purchases is also open. One note already flags 'kids + purchases'.
   - Evidence: docs/FEATURES.md:162 ('No real money for now'). docs/game-dev/20-app-store-blueprint.md:125-130 (open decisions). docs/HANDOFF.md:35 (item 21: expressions in a shop; 'kids + purchases need parental/app-store rules'). docs/FEATURES.md:315-336 (hits), 220-240 (stealing), 352 (chat). docs/game-dev/19-legal.md:93-104 (privacy and children, COPPA).
   - Why it matters: Deciding late can force a redesign of social features, the shop and saving. Deciding early lets the simple, safe version be built from the start.
   - Suggestion: Decide the main age group (for example 9+ or 13+) and the money model in the game brief. For Version 1, collecting no personal data and having no accounts and no real-money purchases keeps it simple. The repo's legal notes call that the simplest safe path (docs/game-dev/19-legal.md:104).
   - Time saving: Avoids rebuilding chat, shop and account features later to meet age rules.
   - Verdict: confirmed
   - Verifier note: I verified FEATURES.md:162 ('No real money for now'), 20-app-store-blueprint.md:125-130 (paid vs free is an open decision), HANDOFF.md:35 item 21 ('kids + purchases need parental/app-store rules'), FEATURES.md:315-336 (hits), :220-240 (stealing), :352 (chat), 19-legal.md:93-104 (COPPA) and :104 ('Simplest safe path: collect no personal data ... no accounts'). Nothing in the repo names a target age. The 'could suit kids' point is the inspector's judgment, but it is reasonable.

10. **The whole design and all kart concept art are readable by anyone**
   - Id: PLAN-10
   - Kind: risk
   - Severity: medium
   - Detail: The full design (features, minigames, world rules, kart notes) and 32 kart images (concept sheets, blueprints and size sheets) are readable by anyone because the repo is public. Ideas and purely AI-made pictures can't be protected by copyright, so going private only cuts down easy copying. It does not undo copies already made, and the dated public history is useful proof of authorship. Moving design docs and art to a private repo is a cheap, sensible step. Finishing and releasing first is the real protection.
   - Evidence: Lead fact: isaiasurrutia96/3D-World-4 is public. git ls-files docs/karts returns 35 files (32 images, 24 MB). docs/FEATURES.md, docs/MINIGAMES.md, docs/WORLD-RULES.md and docs/KARTS.md are all tracked. docs/game-dev/19-legal.md:9-11 ('Ideas, rules and mechanics are not protected') and :25-26 (purely AI-generated material is not copyrightable). docs/KARTS.md:120 ('The pictures are AI images').
   - Why it matters: The owner wants to make sure no one steals the idea. The real protection is finishing and releasing first, plus keeping unreleased plans private. Right now the plans are public.
   - Suggestion: Consider making the repo private, or moving the design docs and concept art to a private repo or folder. Note that GitHub Pages on a private repo needs a paid GitHub plan; check current pricing. Keep records of what the owner designed by hand. This is a short task to do with the business and legal review later, but worth doing early.
   - Verdict: partly_true
   - Verifier note: The facts hold. The repo is public (lead fact). git ls-files docs/karts shows 35 files: 32 images and 3 .md files, 24 MB. 19-legal.md:9-11 and :25-26 say ideas and purely AI images are not protected. KARTS.md:120 says the pictures are AI images, and HANDOFF.md:95 says they were made with Higgsfield. Three details need correcting. First, the 32 images are not all concept art: they include 6 blueprints, 6 size-review sheets, 3 stock-lineup sheets and an F1 feel chart. Second, the severity is overstated for this area. The repo's own legal notes say ideas cannot be protected anyway. The repo has been public for weeks, so making it private now does not undo copies already made. The deploy publishes dist/ (deploy.yml:49), so the Pages site stays public either way. Third, the finding leaves out an upside: public, dated commits are evidence of who created what and when. Making the design docs private is still sensible, cheap housekeeping.

11. **Fastest path to a real game moment: the kart time trial**
   - Id: PLAN-O1
   - Kind: opportunity
   - Severity: medium
   - Detail: Racing is the most advanced part of the project. Track, handling and crash contacts are built and tested, and the owner has approved the driving feel. A time trial needs no computer opponents and no online play: just a start, 3 laps, a timer, a best time and optionally a ghost. Adding coins on the results screen would give the first full 'play, win, reward' loop.
   - Evidence: racing-core/PLAN.md:74-78 (track, handling and contacts built; the driving feel is approved per docs/HANDOFF.md:142-149) and :79-81 (race rules and ghosts not started). docs/MINIGAMES.md:59-67 (time trial card). README.md:6 (Racing Lab is 'a solo test, not a complete race session').
   - Why it matters: A first complete loop on the owner's phone proves the game can work, gives something real to show people, and shows what is fun before building more.
   - Suggestion: Make 'race rules plus time trial plus coins on the results screen' the first Version 1 milestone (Codex's area), while the avatar work focuses on walking and getting into the kart.
   - Time saving: Reuses work that is already approved instead of starting new systems.
   - Verdict: confirmed
   - Verifier note: racing-core/PLAN.md:74-78 shows the track, handling and contacts built and the driving feel authorized. HANDOFF.md:141-149 records the approved Driving Checkpoint 2. PLAN.md:79-81 shows race rules and ghosts not started. README.md:6 calls the Racing Lab 'a solo test, not a complete race session'. MINIGAMES.md:59-67 is the time trial card. The inspector missed a fact that strengthens this: the superseded prototype in racing-core/ (session.js 70 lines, progress.js 56, ghosts.js 83, driver.js 45) already implemented countdown, ordered laps, standings, 4 computer opponents, time trial and saved ghosts (racing-core/README.md:1,7). Note too that Codex's next authorized chunk is controls and the isometric view (HANDOFF.md:153-160), not race rules.

12. **The kart racing item list is close to a famous kart game**
   - Id: PLAN-11
   - Kind: risk
   - Severity: low
   - Detail: The original minigame card's item list (banana, torpedo, shield, boost, last-place shock) looks a lot like a famous kart series. On 22 Nov the owner approved a newer kart parts plan that replaces 'banana-style items' with the game's own weapons: a pop-up cannon and an oil dropper. The minigame card was never updated, so the old list is still there for an assistant to follow by mistake. The 'last place shocks everyone' idea is still close to the famous series.
   - Evidence: docs/MINIGAMES.md:48-53, including 'Legal note (docs/game-dev/19-legal.md): give items our own names and looks so the set does not read as a copy'.
   - Why it matters: Changing items on paper now is free. Changing them after art, sounds and balancing are done is expensive, and close copies can bring legal or store-review trouble.
   - Suggestion: When this card's turn comes, brainstorm a set of items that fits this game's own world (sports gear, blocks, island themes) rather than reskinning the famous set.
   - Time saving: Avoids redoing item art and balancing later.
   - Verdict: partly_true
   - Verifier note: MINIGAMES.md:48-53 does list boost, shield, torpedo, rock and banana, plus a last-place shock, along with the legal note. But docs/karts/PARTS-KIT.md:93-102, approved by the owner on 22 Nov (PARTS-KIT.md:5), has a section titled 'Weapons (instead of banana-style items)'. It replaces them with a hidden pop-up cannon (torpedoes and bouncing bullets) and an oil dropper. The newer decision already moves away from the famous set. What remains is a stale MINIGAMES card that still lists the old items, and the last-place 'shock everyone' item.

13. **The 'roadmap' file is really a history log, and some notes describe deleted code**
   - Id: PLAN-12
   - Kind: problem
   - Severity: low
   - Detail: NEXT.md is called a roadmap but is a 511-line history log. Items 31 to 46 (about lines 240-483) describe walking code that was deleted, more than the 41-46 the handoff mentions. HANDOFF.md also reuses item numbers (two different item 36s), FEATURES cards are out of number order, and MINIGAMES has section E before D. Only racing has a real step-by-step plan.
   - Evidence: docs/NEXT.md:1 (title), lines 364-483 (deleted gait items). docs/HANDOFF.md:117 ('Items 41 to 46 describe code that no longer exists'). docs/FEATURES.md card order 1,2,3,4,16,5,17,6,7,8,18,19,9... (lines 21-283). docs/MINIGAMES.md:251 (E) before 255 (D).
   - Why it matters: New sessions read these files first. Stale or misleading notes cost reading time and can send an assistant the wrong way.
   - Suggestion: Create one short ROADMAP.md (Version 1 steps in order, each with 'done when'). Rename NEXT.md to a history or log file, and move deleted-code items into an archive section.
   - Time saving: Faster session starts, and less re-explaining by the owner.
   - Verdict: partly_true
   - Verifier note: NEXT.md:1 is titled 'Movement roadmap and saved requests' and is 511 lines. The FEATURES card order (1,2,3,4,16,5,17,6,7,8,18,19,9,...) and MINIGAMES section E (line 251) before D (line 255) are as described. A grep for 'roadmap' finds only NEXT.md, so racing-core/PLAN.md really is the only stage plan. The stale range is understated, though. NEXT.md:484-500 (item 47) says items 31 to 46 describe removed code, not just 41-46 (HANDOFF.md:117 says 41-46), so the stale text runs from about line 240 to 483. HANDOFF.md also reuses numbers 36 onward: avatar items 36-79 at lines 50-93, then kart items 36+ starting at line 95.

14. **Excellent feature card template**
   - Id: PLAN-S1
   - Kind: strength
   - Severity: low
   - Detail: Every feature answers the same 12 questions: why, how it works, how you get it, what you lose, where it works, what's on screen, what it connects to, online, saving, edge cases, movements needed and numbers to set later. This is professional design practice and makes each feature easy to build and test.
   - Evidence: docs/FEATURES.md:8-17 (template, approved 19 Nov), applied to all 15 approved cards. The minigame cards use a shared template (docs/MINIGAMES.md:8-33).
   - Why it matters: Clear cards mean fewer misunderstandings with the AI assistants and fewer missed edge cases.
   - Suggestion: Keep it. Add one more line to each card, 'Version: 1 / 2 / Later', and use the same template for the missing 'Progress and levels' card.
   - Time saving: Already saves explanation time on every feature.
   - Verdict: confirmed
   - Verifier note: FEATURES.md:8-17 holds the 12-question template (approved 19 Nov), and the 15 approved cards follow it. One small deviation: card 18 uses '8. Fairness' instead of '8. Online' (line 256). MINIGAMES.md:8-33 is a shared template.

15. **Smart reuse: one ball system, one hit system, one grip system, one minigame flow**
   - Id: PLAN-S2
   - Kind: strength
   - Severity: low
   - Detail: The design already says that every ball game shares one ball system, that punches, kicks and throws share one hit system, that rails, bats, cues and steering wheels share one grip system, and that every minigame shares the same join, lobby, countdown, results and records flow. Blocks behave the same in every game (grass is grass for walking, karts and balls). This is exactly how a solo builder gets lots of content cheaply.
   - Evidence: docs/WORLD-RULES.md:49-55 (shared systems), :13-15 (blocks behave the same everywhere). docs/MINIGAMES.md:8-33 (shared template). src/world/rulebook.ts (247 lines) and src/world/checker.ts already implement the block rules and the world checker.
   - Why it matters: Each new minigame becomes mostly 'new rules on shared parts' instead of a whole new program.
   - Suggestion: Keep it and extend it to movements (a shared throw and a shared swing) and to computer opponents (one opponent brain with difficulty settings).
   - Time saving: Large: shared systems are built once and reused across up to 20 games.
   - Verdict: confirmed
   - Verifier note: WORLD-RULES.md:49-55 lists the shared ball, hit and rod grip systems. WORLD-RULES.md:15-16 (not 13-15) says blocks behave the same everywhere. MINIGAMES.md:8-33 is the shared minigame flow. src/world/rulebook.ts has 247 lines and src/world/checker.ts has 112.

16. **The owner already cuts scope well at the minigame level**
   - Id: PLAN-S3
   - Kind: strength
   - Severity: low
   - Detail: The owner has already trimmed many ideas wisely. Football is throwing only, soccer is penalties only and baseball is batting only. Bikes were removed, diving is just for fun, players cannot design minigame rules, there is no trading, no real money, and online is 'single player first'. That instinct is exactly what the whole game needs.
   - Evidence: docs/WORLD-RULES.md:27-33 ('throwing only ... Not a full game', 'penalty shootouts only', 'batting only'). docs/FEATURES.md:304 (bikes removed), :70 (no player-made rules), :155 (no trading), :162 (no real money), :345-346 (single player first). docs/MINIGAMES.md:204-205 (diving not a minigame).
   - Why it matters: It shows the owner can say 'not now'. Applying the same cut to the whole game (a Version 1 list) is a small step from here.
   - Suggestion: Use the same habit for the whole project: pick the 3 to 5 cards that make Version 1 and mark the rest 'Later'.
   - Verdict: confirmed
   - Verifier note: I verified WORLD-RULES.md:27-33 (throwing only, penalties only, batting only), FEATURES.md:304 (bikes removed), :70, :155, :162, :345-346 and MINIGAMES.md:204-205. One more example the inspector missed: PARTS-KIT.md:126-130 (owner, 22 Nov: start with one kart model per class and three styles per body part).

17. **Platform decision is recorded with reasons, and game logic is kept separate from drawing**
   - Id: PLAN-S4
   - Kind: strength
   - Severity: low
   - Detail: The strength is real. The web-first platform choice and the plan to keep game rules separate from drawing are recorded with reasons in NEXT.md:46-63 and explained in LEARNING.md:39 (not lines 203-204, which don't exist).
   - Evidence: docs/NEXT.md:46-63 (platform decision, 18 Nov). docs/LEARNING.md:203-204 (brain and face). docs/game-dev/20-app-store-blueprint.md (full step list, including Guideline 4.2 and bundling files in the app).
   - Why it matters: This is a sensible, low-cost path for one person, and it avoids locking the game to one store too early.
   - Suggestion: Keep it. In the game brief, say which device Version 1 must run well on (for example 'a mid-range phone in landscape'), so performance targets are clear.
   - Verdict: partly_true
   - Verifier note: The platform decision is at NEXT.md:46-63 as cited, and the App Store blueprint exists (Guideline 4.2 at line 80). But the citation 'docs/LEARNING.md:203-204' is wrong. LEARNING.md has only 73 lines, and the 'Brain and face' entry is at line 39. The rules-versus-drawing split is also stated at NEXT.md:52-56.

18. **The racing plan is a real step-by-step roadmap and a model for the rest**
   - Id: PLAN-S5
   - Kind: strength
   - Severity: low
   - Detail: Racing has a clear table of 8 stages (track, handling, contacts, race rules, opponents, ghosts, controls, playable build). Each stage says what proof is needed and whether it is done. That is the kind of plan the whole game is missing.
   - Evidence: racing-core/PLAN.md:70-83 (sequence and approval gates table).
   - Why it matters: It shows the structure already works in this project. It just needs to be applied one level up, to the whole game.
   - Suggestion: Copy this table format into a game-wide ROADMAP.md for Version 1 (avatar walk, race rules, opponents, one sport, coins and shop, one island, phone test).
   - Time saving: Reusing a format the owner already understands makes the new roadmap quick to write and review.
   - Verdict: confirmed
   - Verifier note: racing-core/PLAN.md lines 72-83 hold the stage table: 8 numbered stages plus '1V' and 'Driving feel', each with the proof required and a status. Stages 4-8 are marked 'Not started; requires go' or 'Deferred'.

19. **A distinctive hook already exists and could become the pillars**
   - Id: PLAN-S6
   - Kind: strength
   - Severity: low
   - Detail: The notes contain the seeds of strong, original pillars. (1) A chunky ragdoll athlete whose throws and shots 'look unlike other games'. (2) Real-feeling sports with no aiming guide lines. (3) A connected world with no menus or loading screens, where the watch opens a door you walk through. (4) One consistent block world where every surface behaves the same in every game.
   - Evidence: docs/HANDOFF.md:19 (rigid ragdoll avatar 'central to the owner's goal of throws and shots that look unlike other games'). docs/MINIGAMES.md:30 ('No aiming guide lines'). docs/FEATURES.md:22 (watch: 'no menus or loading screens'), :120-121 (one connected world). docs/WORLD-RULES.md:13-15. docs/AVATAR-DIRECTION.md:1-4.
   - Why it matters: Pillars like these make the game stand out and give every decision a quick test: does this support a pillar?
   - Suggestion: Turn these four lines into the official pillars in the game brief, and finish approving the pending feel goal (HANDOFF item 75b). Use them to accept or defer new ideas.
   - Time saving: Faster yes/no decisions on every new idea.
   - Verdict: confirmed
   - Verifier note: I verified HANDOFF.md:19 (rigid ragdoll avatar 'central to the owner's goal of throws and shots that look unlike other games'), MINIGAMES.md:30 (no aiming guide lines in '(almost)' any aiming game), FEATURES.md:22 and :120-121, WORLD-RULES.md:15-16 and AVATAR-DIRECTION.md:1-8. NEXT.md:4 (movement 'like Super Mario 64 as if it were made today') is another pillar candidate.

### Missed by inspector found by skeptic

1. **The newest kart doc quietly adds new features and contradicts other docs**
   - Kind: problem
   - Severity: medium
   - Detail: A kart parts list the owner approved on 22 Nov adds kart weapons (a pop-up cannon that fires torpedoes and bouncing bullets, and an oil dropper) 'instead of banana-style items'. It also renames the small kart from 'GoKart' to 'S Kart' and says the world has a 'night mode'. None of this was copied into the main feature, minigame or kart docs, which still say GoKart and still list banana mystery boxes, and no other doc mentions night mode. Big game decisions are being made inside side documents.
   - Evidence: docs/karts/PARTS-KIT.md:5 (A-G approved 22 Nov), :8-9 (weapons are part of racing), :13-15 (S Karts, formerly 'GoKart'), :27 ('The world has a night mode'), :93-102 (Weapons instead of banana-style items). MINIGAMES.md:48-50 still lists banana and torpedo boxes. KARTS.md:15-22 still uses 'GoKart'. grep for 'night' in docs/*.md finds only PARTS-KIT.md:27 and :77.
   - Suggestion: Add a rule: any new game decision goes into the main topic file (FEATURES, MINIGAMES, KARTS) the same day, and side files only add detail. Copy the weapons, the S Kart name and night mode into the main docs, or mark them 'Later'.

2. **The chosen GT kart body copies a real Porsche, and 'F1' and 'GT3' are brand names**
   - Kind: risk
   - Severity: medium
   - Detail: The owner's stock GT kart is 'GT3 R-inspired' and 'takes its cues from the 2026 Porsche 911 GT3 R'. The notes link to Porsche's site and use Porsche data. The project's own rules say 'no copied real cars' and 'use made-up designs'. The class names 'F1' and 'GT3' are also brand names (general knowledge: 'F1' and 'Formula 1' are trademarks of the Formula One group). Changing names and shapes now costs almost nothing. Changing them after models, art and store listings are done costs a lot.
   - Evidence: docs/karts/PARTS-KIT.md:133-136 ('GT option 05, GT3 R-inspired ... cues from the 2026 Porsche 911 GT3 R' plus a Porsche link). docs/karts/GT3-DRIVING-REFERENCE.md:3 and :11-30 (Porsche data). KARTS.md:39 ('no copied real cars'). docs/game-dev/19-legal.md:47-50 ('real vehicle ... designs are often licensed ... Use made-up designs') and :30-37 (trademarks).
   - Suggestion: Keep the real-car data only as private tuning reference. Give the kart classes original names, for example small, medium and large class names the owner invents, and make sure the GT body does not read as a Porsche. Add a 'name check' step before anything is public-facing.

3. **Most of the race rules, computer opponents and ghosts already exist in old code**
   - Kind: opportunity
   - Severity: medium
   - Detail: The racing plan lists race rules, computer opponents and ghost time trials as 'not started'. But an earlier version kept in the same folder already did all of these: countdown, laps in order, standings, finish times, 4 computer drivers, time trials and saved ghosts, in about 250 lines. It was set aside when racing was restarted. Adapting it to the new, approved kart and track could make the first full race much quicker than writing everything again.
   - Evidence: racing-core/README.md:1 ('Everything below describes the superseded racing prototype') and :7 ('four physics-driven opponents, countdowns, ordered lap gates, standings, finish times, wrong-way detection, recovery, time trials, and track-specific saved ghosts'). Files: racing-core/session.js (70 lines), progress.js (56), driver.js (45), ghosts.js (83). racing-core/PLAN.md:19 records that the owner rejected extending the old prototype as the foundation, so reuse needs the owner's OK.
   - Suggestion: Ask Codex to compare 'port the old race rules, opponents and ghosts onto the new kart' with 'write fresh', and bring the owner one recommendation. This only needs the owner's yes on reusing ideas or tests, not on the old foundation.

4. **A repeated 'restart from scratch' pattern costs a lot of time**
   - Kind: risk
   - Severity: high
   - Detail: Several big pieces have been built and then thrown away or restarted: racing was rebuilt fresh, walking and running were built, rebuilt and then fully erased, the avatar is being rebuilt part by part (the owner said the first full version was 'nothing like I envisioned' and later asked to 'restart with the hip joints'), and the karts were redone as a 'fresh set of three'. Without a written picture of the target (feel, look, Version 1), each attempt is judged by eye only after it is built, which invites restarts.
   - Evidence: racing-core/README.md:1 and racing-core/PLAN.md:11,19 (start fresh; prototype rejected). NEXT.md:448-456 (item 45, 'absolutely terrible'), :457 (item 46, rebuilt), :484-500 (item 47, RESET). HANDOFF.md:22 (item 8, rebuild avatar parts), :56 (item 42, 'nothing like I envisioned'), :78 (item 64, 'restart with the hip joints again'). KARTS.md:94-95 (fresh set of three karts).
   - Suggestion: Before building anything big, agree on a short target with reference pictures or videos and 2 or 3 'done when' checks. Build the cheapest rough version first (plain shapes) and get the owner's reaction before polishing. Restarting a rough draft is cheap. Restarting a polished piece is not.

5. **Controls for the target device (phone) are not designed for any minigame**
   - Kind: risk
   - Severity: medium
   - Detail: The plan says the game should play on a phone, but 11 of the 20 minigame cards leave controls to 'after testing', and the shared template says cards do not lock in controls. On top of that there should be no aiming guide lines, and a pending feel goal says no power meters. Aiming, power and timing with thumbs on a touch screen, without meters or guides, across about 20 different sports, is a hard design problem nobody has started.
   - Evidence: grep 'controls chosen after testing' docs/MINIGAMES.md = 11 matches. MINIGAMES.md:28-29 ('Cards do not lock in controls'), :30 (no aiming guide lines). HANDOFF.md:89 item 75b (no power meters, awaiting approval). NEXT.md:48-50 (phone by link).
   - Suggestion: Design one shared touch 'aim and release' control and one shared 'swing timing' control, test them on the owner's phone with plain shapes, and reuse them across the sports. Do this for the first one or two minigames in Version 1 before writing more sport cards.

6. **'No menus or loading screens' clashes with other cards**
   - Kind: problem
   - Severity: low
   - Detail: The watch card promises 'no menus or loading screens'. The home island card says it is reached by the watch door 'or the menu screen', and the connected world card says far islands load in and show 'a simple version until ready'. This is a small promise to settle now so assistants don't build against two different ideas.
   - Evidence: docs/FEATURES.md:22 ('no menus or loading screens'), :49 ('the watch's door or the menu screen'), :129 ('door or menu only'), :122-123 and :134-135 (islands load as he gets close; simple version until ready).
   - Suggestion: Reword the watch goal to something like 'no loading screens during play', and decide whether a main menu exists (it almost certainly will, for settings and saving).

7. **The owner already applies a Version 1 mindset to karts**
   - Kind: strength
   - Severity: low
   - Detail: On 22 Nov the owner decided to start with only one kart model per class, 'to get the driving fundamentals right first', with three styles per body part. This is exactly the 'small first version' thinking the whole game needs, and it shrinks the 60-style kart workload a lot.
   - Evidence: docs/karts/PARTS-KIT.md:126-130 (owner decision: one model per class; three styles per body part) and :131-139 (one stock body chosen per class).
   - Suggestion: Point to this decision as the model for a whole-game Version 1 list.

## Process, decisions and planning history
**Area summary:** The project has moved very fast (427 commits in 9 active days) and keeps unusually honest, dated records of what the owner decided, including mistakes and rejections. Its safety habits are good: frozen checkpoints with fingerprints, git tags, and automatic tests that must pass before anything is published. The weak point is direction. No written goal says what "the game works" means, there is no first-playable target, and the parts (avatar, walking, driving, island, karts) have never been put together into one playable thing. A lot of the work has been built and then thrown away: walking and running were built about four times and then fully removed, the avatar has been restarted several times, and joint sockets were solved three separate times. In the last three days, most effort went into centimetre-level avatar sizing and kart looks rather than getting something playable. The rule and handoff documents now contradict each other and have grown too large. The handoff alone went from 610 to 13,101 words in three days, and decisions are spread over at least 15 files, several of which each claim to be "the" source of truth.

### Key facts
1. Commits per day: 4 Nov 1, 16 Nov 10, 17 Nov 82, 18 Nov 71, 19 Nov 83, 20 Nov 40, 21 Nov 47, 22 Nov 78, 23 Nov 15 (source: git log --date=short).
2. Estimated theme share of the 377 non-merge commits, from keyword sorting of commit subjects (approximate): avatar body and look 107 (about 28%: new avatar 68, original avatar, sockets and joint labs 39); Skeleton poses 24 (6%); walking, running and movement 41 (11%); racing and driving about 43 (11%); kart design 32 (8.5%); feature and minigame design cards 57 (15%, all on 19 Nov); island and world about 29 (8%); rules and process docs 25 (7%); Test Lab setup about 18 (5%). Merge commits: 50 of 427 (11.7%). Script: (scratch folder, not saved) classify.py.
3. Theme counts for 21 to 23 Nov (119 non-merge commits): new avatar 66 (55%), kart design 32 (27%), racing and driving 11 (9%, mostly the GT3 and 2026 F1 realism presets), docs 9 (source: byday.py in the scratchpad).
4. The 104 commits authored 'Isaias U' are almost all racing, driving, Test Lab and avatar joint-lab work. HANDOFF.md:141-143 credits Codex with Driving Checkpoint 2, whose source commit 97d2ba8 is authored 'Isaias U'. Another 8 commits authored by Codex have 'Isaias U' as committer. The lead's 'owner 104' figure is therefore very likely mostly Codex work.
5. Git tags (8): avatar-approved-2026-11-17 (cd25d8a), avatar-checkpoint-2-2026-11-17 (fb0ff14), test-lab-checkpoint-1-2026-11-17, motion-lab-checkpoint-1-2026-11-17, driving-source-1/2 and driving-checkpoint-1/2 (20 Nov). No island tag exists, even though checkpoints/README.md:18 lists one.
6. Remote branch origin/claude/relaxed-wozniak-iznto4 is 9 commits ahead of main. It includes 'Handoff: owner decision, new-avatar work is a visual prototype until approved' (3218182), and its HANDOFF items 63-72 mean different things from main's items 63-72.
7. docs/HANDOFF.md word count by commit: 610 (a0e8108, 20 Nov), 1,590, 2,706, 3,441, 4,343, 5,264, 7,225, 9,189, 10,692, 12,172, now 13,101. It has been edited in 104 commits. CLAUDE.md has 17 edits; docs/NEXT.md has 47.
8. Required reading before a new session can start (words): CLAUDE.md 886 + HOW-TO-WORK-WITH-ME 948 + HANDOFF 13,101 + COLLABORATION 657 + docs referenced from CLAUDE.md section C (AVATAR-DIRECTION 250, motion-lab/README 748, checkpoints/README 364, game-dev/README 328) = about 17,300. Codex also reads racing-core/PLAN.md (10,187).
9. Folders last changed: movement/ 17 Nov, oval/ 17 Nov, lab/ 17 Nov, walk-test/ and run-test/ 19 Nov, hand/foot/wrist/elbow labs 18-19 Nov, island/ 19 Nov, motion-core/ and skeleton-test/ 20 Nov (the day of the reset). Active since 21 Nov: avatar-v2/, new-avatar/, racing-core/, racing-lab/, kart-parts/, karts/.
10. Heights recorded for the new avatar in HANDOFF items 33-77 (cm): 236.8, 256, 247.9, 249.4, 213, 185, 194, 317 (pieces apart), 241, 190.6, 191.7, 191.5, 190.8, 189.8, 188.7, 186.5, then 193.04 (6 ft 4 in). The original avatar is about 189.
11. Walking/running reset commit 4348e1a: 19 files, +383 / -2,335 lines. Between the wave point 4caaad4 (18 Nov) and 747d0ba (20 Nov), motion-core/ plus skeleton-test/ had grown by 4,327 lines.
12. No game concept sentence, game design document, first-playable or vertical-slice target exists in any .md file. The project's own notes recommend these: docs/game-dev/13-production.md:5,10,22 and docs/game-dev/20-app-store-blueprint.md:31.
13. No minigame code exists. Searching .js/.ts/.mjs for bowling, basketball, minigame or archery finds only src/world/rulebook.ts and a reference PlayerModel.ts. FEATURES.md has 16+ approved feature cards, and MINIGAMES.md lists 20 approved minigames.
14. racing-core/PLAN.md gate table: sections 4 (race rules), 5 (computer opponents), 6 (ghosts), 7 (shared controls) and 8 (playable racing build) are all 'Not started; requires go'. README.md:5 calls the Racing Lab 'a solo test, not a complete race session'.
15. CI (.github/workflows/deploy.yml) uses 'concurrency: cancel-in-progress: true', so each push to main cancels the publish already running. CI does not run test:new-avatar or test:karts, even though those were the main work areas from 21 to 23 Nov.
16. For the legal inspector: docs/karts/PARTS-KIT.md:133-134 says the chosen GT stock body 'takes its cues from the 2026 Porsche 911 GT3 R'. HANDOFF item 20 (line 34) says the face is inspired by a known game character 'which must not be copied'.

### Findings

1. **No definition of 'done' and no first playable version of the game**
   - Id: PROC-1
   - Kind: problem
   - Severity: critical
   - Detail: Nowhere does the project say what the finished game, or even a first playable version, must contain. Every approval is about one small piece: a torso shape, a ball size, a kart style, a driving tune. After 427 commits there is still no page where you control the avatar in the world, get in a kart and race. The parts exist only as separate test pages.
   - Evidence: Searching all .md files for milestone, MVP, vertical slice, first playable, deadline or definition of done finds only general mentions (docs/game-dev/13-production.md:10 explains what a vertical slice is; CLAUDE.md:27 says 'working test at a useful milestone' for each chunk). README.md section A lists only the Test Lab, the Racing Lab ('a solo test, not a complete race session') and track inspection. racing-core/PLAN.md gate table: sections 4-8 (race rules, opponents, ghosts, controls, playable racing build) are 'Not started'. There is no minigame code (search of .js/.ts/.mjs). No concept sentence or game design document exists, although docs/game-dev/13-production.md:5 and 20-app-store-blueprint.md:31 recommend both.
   - Why it matters: Without a clear finish line, the assistants keep polishing whatever is in front of them, and the game never gets closer to being playable. This directly blocks the owner's main goal, which is getting the game to actually work.
   - Suggestion: Write one short page with a one-sentence description of the game and a 'First Playable' checklist built from parts that already exist. For example: the phone-ready avatar walks on the island, gets into the approved test kart and finishes one lap on one track against a timer. Mark everything else as 'later'. Judge every new task by whether it moves that checklist forward.
   - Time saving: Stops days of detail work that does not move the game toward playable, and gives both assistants the same target, so less explaining is needed each session.
   - Verdict: confirmed
   - Verifier note: Searched every .md (excluding checkpoints) for first playable, vertical slice, MVP, definition of done, milestone, deadline, game concept and GDD. The only hits are generic: docs/game-dev/13-production.md:5 (one-sentence concept) and :10 (vertical slice), 20-app-store-blueprint.md:29-31, CLAUDE.md:27, and racing tuning 'milestones'. There is no game-level target. racing-core/PLAN.md:79-83 lists sections 4-7 as 'Not started; requires go' and section 8 as 'Deferred; requires go'. README.md:6 describes the Racing Lab as 'a solo test, not a complete race session'. No page combines the avatar, the world and a kart. One nuance: the site root (index.html -> src/main.ts:2) is an old 17 Nov slab where the avatar walks, runs and jumps, so a crude controllable avatar exists, but not in the world and not with karts.

2. **The last three days went mostly to centimetre-level avatar sizing and kart looks**
   - Id: PROC-2
   - Kind: problem
   - Severity: high
   - Detail: From 21 to 23 November, about 55% of non-merge commits were small new-avatar changes and about 27% were kart design. Many changes moved one number at a time (hip ball depth 40%, 45%, 54%, 63%, then 80%). Often the owner gave no amount, so the assistant guessed and was then corrected. Heights above 200 cm came from previews that held the pieces apart, not from real changes to his height. Once put together he stayed around 185-194 cm until the owner set 6 ft 4 in.
   - Evidence: Per-day theme counts (byday.py): 21 Nov new avatar 29 / kart 11; 22 Nov new avatar 25 / kart 21 / racing presets 10; 23 Nov new avatar 12. HANDOFF items 56-59 (lines 70-73): hip ball depth 45% -> 54% -> 63% -> 80.3%, with the owner saying 'I said deeper not slightly deeper'. 12 mentions of amounts chosen by Claude in HANDOFF.md ('Claude's pick(s)', 'Claude picked', 'Amounts are Claude's', and similar). Heights in items 33-77 range from 185 to 317 cm. HANDOFF item 74 (line 88): every push restarts a publish of about 10 minutes.
   - Why it matters: Each tiny change costs a full round trip: a message, code, tests, a push, a 10-minute wait and a phone check. The owner's usage and time go into fine-tuning something that may still change once the avatar has to move.
   - Suggestion: Give the owner a simple 'tuning page' with sliders (limb length, ball size, ball depth, height) so he can set the sizes himself in one sitting, see them instantly, and lock them once. Set a time limit on avatar looks until the first playable version works.
   - Time saving: Dozens of message, code and publish cycles become one sitting where the owner drags sliders and says 'lock it'.
   - Verdict: partly_true
   - Verifier note: Theme counts check out. By author date, 21-23 Nov has 119 non-merge commits: 66 'New avatar' (55%), about 32 kart design and about 11 driving. Hip depth went 40->45->54->63->80.3% (HANDOFF lines 70-73), and the 'I said deeper not slightly deeper' quote is at line 73. 12 mentions of amounts Claude chose were confirmed. The height claim is misleading, though. The 236.8, 256, 247.9, 249.4 and 317 cm figures (lines 47-50, 58) were measured with the pieces held apart or before sockets. They are side effects of preview layouts, not changes to a height target. Once assembled, the avatar stayed between about 185 and 194 cm, and the only height the owner actually set was 6 ft 4 in (item 77, line 91).

3. **Walking and running were built about four times and then fully removed**
   - Id: PROC-3
   - Kind: problem
   - Severity: high
   - Detail: Walking and running were built five or six separate times (17 and 20 November) and rejected every time. The owner then had the newest version erased (20 November). Older rejected walking pages are still in the project and still go live, including the site's home page, but no walking has been approved. Movement work has not resumed since 20 November.
   - Evidence: 17 Nov: 01baada (Claude, walk/run/jump slab), 95e52ab (Codex, movement/), ca823ec walk-test/, eb75599 run-test/, 77cc0cd (Motion Lab slow walk). NEXT.md:18-21: walk looked like 'descending imaginary stairs'; 'Numeric foot-locking checks alone do not establish a convincing gait'. 20 Nov: dca9dd0..9603ed8 (layers 2-6b), then NEXT.md item 45 'absolutely terrible', rebuild f5b17f2, reset 4348e1a (19 files, -2,335 lines). The rule changed twice that day: NEXT.md item 37 'layers no longer wait for the owner's approval', then item 47 'add ONE movement at a time ... move on only when the owner says it looks good'. NEXT.md item 48: the detailed avatar ran at 45 fps. motion-core/ was last committed 20 Nov. About 41 commits (11% of non-merge) are in this theme.
   - Why it matters: Walking is the core of the game, and so far it is the biggest single loss of effort. If the same approach is repeated, it will probably fail the same way.
   - Suggestion: Before writing any movement system, show the owner a short video or live preview of a plain walk on the light avatar and get a yes on the look first. Use a proven, simple method (hand-made key poses played in a loop) before anything clever. Agree what 'good' looks like by picking a reference video together.
   - Time saving: Catches a 'that looks wrong' reaction in minutes instead of after a full day of building layers.
   - Verdict: partly_true
   - Verifier note: Every cited commit checks out: 01baada, 95e52ab, ca823ec, eb75599 and 77cc0cd (17 Nov); dca9dd0, 9603ed8, f5b17f2 and 4348e1a (20 Nov). 4348e1a changed 19 files, +383/-2,335. Between 4caaad4 and 747d0ba, motion-core plus skeleton-test grew by 4,327 lines. NEXT.md items 37, 45 and 47 match. However, 'No walking survives' is wrong. The reset only touched skeleton-test/ and motion-core/. Older walking prototypes are still in the repo and still built and published: movement/, walk-test/, run-test/, motion-lab/src/walker.js, and the site root (src/main.ts:2 'walks, runs and jumps'). They appear in package.json:8 and vite.config.ts:14, and README.md:24 keeps them as earlier prototypes. What does not exist is approved walking. 'About four times' undercounts, too: there were at least five or six separate attempts (Claude slab, Codex movement/, walk-test/run-test, the Motion Lab walk, the 20 Nov layered walker and its rebuild).

4. **The avatar was restarted several times, and joint sockets were solved three separate times**
   - Id: PROC-4
   - Kind: problem
   - Severity: high
   - Detail: On 18-19 November Codex built joint and socket studies for the foot, wrist and elbow and saved a jointed avatar. On 20 November the plan was 'refine, don't replace' and then, the same day, 'rebuild'. Claude's new avatar was restarted from the torso after the arms were rejected. The complete socketed body was rejected as 'nothing like I envisioned', and the hips were restarted. Socket-making code was written again each time. Two avatars now exist side by side, and nobody has decided which one the game will use.
   - Evidence: Codex labs: foot-lab 31 commits including 'Reset Foot Lab to original' (3afa2ad), wrist-lab 6, elbow-lab 3; checkpoints/avatar-joints-1 (35 MB). A continuous skin was added in bff65e4 (18:41) and removed in b2f0fdf (20:43) the same day. HANDOFF item 5 (line 19) 'Refine it rather than replace it' vs item 8 (line 22) 'This replaces the earlier plan'. Item 12 (line 26) 'looks really bad', restart. Item 41 (line 55): complete socketed body, 165,590 triangles, 22 checks; item 42 (line 56) 'nothing like I envisioned'. Branch relaxed-wozniak item 66 'ima start again'. Main item 64 (line 78) 'let's restart with the hip joints again'. README.md:10: new-avatar's 'presence is not approval to replace'. There are 10 avatar-related top-level folders.
   - Why it matters: Each restart throws away days of work, and solving the same problem again in a new way means the earlier, tested code gets wasted. Leaving the 'which avatar' question open also blocks movement, karts (seat sizing) and phone performance.
   - Suggestion: Write a one-page avatar spec before more building: reference pictures, target height, head-to-body proportion, joint style and a phone triangle budget. Then decide once, in writing, which avatar the game uses. Reuse the socket code that already exists instead of starting a new method.
   - Time saving: One agreed target up front avoids repeated rejections, and shared socket code means each joint takes much less time.
   - Verdict: confirmed
   - Verifier note: Codex socket studies: foot-lab has 31 commits (23 'Isaias U', 7 Codex, 1 Claude) including 3afa2ad 'Reset Foot Lab'. wrist-lab has 6 commits and elbow-lab has 3. checkpoints/avatar-joints-1 is 35M. bff65e4 (18:41) added a skin and b2f0fdf (20:43) removed it, both on 19 Nov. HANDOFF items 5 and 8 (lines 19, 22) are both dated 20 Nov and say 'refine' and then 'replaces the earlier plan'. Item 12 (line 26) rejects the arms. Item 41/42 (lines 55-56) has 165,590 triangles and 22 checks, then 'nothing like I envisioned'. Item 64 (line 78) restarts the hips. Socket code was rewritten several times (Codex labs, sockets.js, body-sockets.js, the later 'real cut' pushShoulderBalls). HANDOFF 'Uncertain' item 2 (line 109) says the base avatar is the owner's undecided choice. README.md:12 (not :10) says new-avatar's presence is not approval to replace anything. I count 10 avatar-related folders.

5. **The handoff turned into a 13,000-word diary that every session must read**
   - Id: PROC-7
   - Kind: problem
   - Severity: high
   - Detail: The handoff file was meant to tell a fresh session where things stand. In three days it grew from 610 to 13,101 words and became a line-by-line diary of measurements. Its numbering repeats (items 36-43 appear twice), and a branch holds a different version whose item numbers mean other things. Before starting, a new session must read about 17,300 words, and Codex adds another 10,000.
   - Evidence: HANDOFF.md word counts across commits: 610 (a0e8108) -> 12,172 (0e5ae96) -> 13,101 now; 104 commits edit it. Duplicate items 36-43: lines 50-57 (avatar) and 95-102 (karts). origin/claude/relaxed-wozniak-iznto4 has a different item list 63-72. NEXT.md numbers run 1-4, 7, 5, 6, and NEXT.md item 47 says items '31 to 46' are obsolete while HANDOFF.md:117 says '41 to 46'. Required-reading word total: about 17,282 (CLAUDE 886, HOW-TO 948, HANDOFF 13,101, COLLABORATION 657, AVATAR-DIRECTION 250, motion-lab README 748, checkpoints README 364, game-dev README 328).
   - Why it matters: A huge start-up read uses up the owner's usage before any work begins. Important current facts get buried under old measurements, so mistakes become more likely.
   - Suggestion: Cut the handoff to one page: current state, the next three tasks, open questions for the owner, and links. Move the diary into a dated history file that nobody has to read at the start. Number items only within a short list, so numbers never repeat.
   - Time saving: Saves roughly 15,000 words of reading at the start of every session, for both assistants.
   - Verdict: confirmed
   - Verifier note: My counts: HANDOFF.md is 13,101 words now. The first version (a0e8108) was 610, the end of 20 Nov was 1,276, 21 Nov was 4,888 and 22 Nov was 10,310. It appears in 104 commits including merges (92 without). Item numbers 36-43 repeat at lines 95-102 after item 79 (line 93). NEXT.md numbering runs 1-4, 7, 5, 6. NEXT item 47 says '31 to 46' are obsolete while HANDOFF.md:117 says '41 to 46'. The branch relaxed-wozniak has a different list for items 63-72. The total of 17,282 words matches my wc. Note that motion-lab README, AVATAR-DIRECTION and game-dev README are only read when relevant, so the mandatory core (CLAUDE, HOW-TO, HANDOFF, COLLABORATION) is about 15,600 words. That is still very large. The claim that Codex also reads the 10,187-word racing PLAN is an assumption. AGENTS.md does not require it.

6. **Both assistants share one publish line, so pushes cancel each other and the owner waits**
   - Id: PROC-12
   - Kind: problem
   - Severity: high
   - Detail: Every push from either assistant restarts a publish of about 10 minutes and cancels the one already running. If one assistant's tests fail, nobody's changes go live. The owner noticed this as 'why am I waiting 10 minutes'. Tiny tweaks, such as moving a button 12 pixels, were each pushed separately. The new-avatar and kart tests are not part of the publish checks.
   - Evidence: .github/workflows/deploy.yml: 'concurrency ... cancel-in-progress: true'; the gated steps are test:lab-foundations, test:official-avatar, test:racing-core, build and the browser checks (no test:new-avatar or test:karts). HANDOFF item 74 (line 88): Claude's neck push was cancelled by a Codex push, that Codex run failed, and the next publish came about 20 minutes later. Commits e1f36c7, 4d7985a and 250127d moved buttons 12, 12 and 24 px. There are 50 merge commits (11.7% of all).
   - Why it matters: The owner loses time waiting to test, and one assistant's broken test blocks the other's finished work.
   - Suggestion: Group small tweaks into one push. Give each assistant its own preview link so their work does not collide, or agree on push turns. Add the avatar and kart tests to the publish checks.
   - Time saving: Shorter and more predictable waits for every test the owner runs.
   - Verdict: confirmed
   - Verifier note: deploy.yml:15-17 uses concurrency with cancel-in-progress true. Its gates (lines 30-37) do not include test:new-avatar or test:karts. HANDOFF item 74 (line 88) matches. The 12, 12 and 24 px button commits are confirmed. There are 51 merge commits, not 50. The impact is understated. GitHub's public Actions API shows 350 push runs: 288 success, 58 cancelled, 4 failed. Median successful run time grew from 0.3 min (17 Nov) to 3.4 (20-21 Nov), 7.4 (22 Nov) and 9.4 (23 Nov). On 19 Nov alone, 35 runs were cancelled. In the latest run, the browser checks took 308 s, the build 102 s and the racing tests 72 s.

7. **The full game idea is written out in a public repository**
   - Id: PROC-16
   - Kind: risk
   - Severity: high
   - Detail: The owner wants to make sure nobody steals the idea. The project's decision records (every feature card, all 20 minigames, kart designs and tiers, world rules) are detailed and sit in a repository that the lead agent measured as public. The live test site is public too.
   - Evidence: Lead-measured fact: GitHub repo isaiasurrutia96/3D-World-4 is PUBLIC. Detailed design docs: docs/FEATURES.md (370 lines), docs/MINIGAMES.md (261), docs/KARTS.md (164), docs/WORLD-RULES.md (170), docs/karts/PARTS-KIT.md and concept images in docs/karts/. README.md:5-7 links the live GitHub Pages site.
   - Why it matters: Anyone can read the full plan for the game today. Ideas themselves are hard to protect legally, so keeping them private is the main protection a solo creator has.
   - Suggestion: Discuss with the owner (and the legal inspector) whether to make the repository private, or to move the design documents into a private repository while keeping only the test site public. Check first that GitHub Pages still works on the owner's plan if the repository goes private.
   - Verdict: confirmed
   - Verifier note: I queried api.github.com/repos/isaiasurrutia96/3D-World-4 myself: private=false, visibility=public, has_pages=true, license=null. The design docs are as described. There is no LICENSE file in the repo, so default copyright applies, but no ownership notice is posted. On GitHub's free plan, Pages works only on public repos, so going private needs a paid plan or another host. The inspector rightly flagged that this should be checked first.

8. **No single source of truth: decisions are spread over 15+ files, and several claim to be 'the' source**
   - Id: PROC-5
   - Kind: problem
   - Severity: medium
   - Detail: Each topic (karts, world, racing, movement) has its own record. That is fine in principle, but nothing links them together, and some have drifted apart: the kart notes still say they are waiting for picks the owner already made, and the world rules and minigame list disagree on which minigames exist. Big decisions such as 'web first' are filed in odd places, and parked ideas are spread over at least six files.
   - Evidence: Files that call themselves the source: CLAUDE.md:4, AGENTS.md:4, HOW-TO-WORK-WITH-ME.md:3, motion-core/PLAN.md:3, racing-core/PLAN.md:3 ('single plan and approval record'), KARTS.md:3, WORLD-RULES.md:3, FEATURES.md:3 ('in one place'), NEXT.md:223. Disagreements: KARTS.md:144 says 'waiting for owner picks', but PARTS-KIT.md:131-139 records the picks (22 Nov). WORLD-RULES.md section B lists Swimming and 'Messing around' as minigames and leaves out Paintball, unlike MINIGAMES.md:255-261. The platform decision is in NEXT.md:46-63 under 'Movement roadmap'. motion-core/PLAN.md (Claude's movement record) contains Codex foot and wrist study logs (lines 209-321). Parked ideas appear in HANDOFF items 21, 36 and 75, FEATURES.md, MINIGAMES.md E, WORLD-RULES.md G, NEXT.md 29-31 and racing-core/PLAN.md sections 4-8. The avatar-v2/README.md 'Current state' is dated 21 Nov.
   - Why it matters: When records disagree, each assistant may act on a different 'truth', and the owner has to re-explain or re-decide things. The game-dev notes themselves warn: 'write down decisions so they aren't relitigated'.
   - Suggestion: Keep three short files and nothing else for decisions: GAME-PLAN (goal, first-playable checklist, order of work), DECISIONS (one dated line per decision with a link) and IDEAS-PARKED (everything for later). Turn the other files into reference notes that point to these three.
   - Time saving: Each session reads three short files instead of hunting through 15, and old decisions stop being argued again.
   - Verdict: partly_true
   - Verifier note: Several cited 'self-claims' are wrong. CLAUDE.md:4 and AGENTS.md:4 do not call themselves the source. Both point to HOW-TO-WORK-WITH-ME.md as the source. The other files (motion-core/PLAN.md:3, racing-core/PLAN.md:3, KARTS.md:3, WORLD-RULES.md:3, FEATURES.md:3) are each the record for their own topic, which is a reasonable pattern on its own. The real problems check out. KARTS.md:144 still says 'waiting for owner picks' and uses GoKart/GT GoKart/F1 GoKart names, while PARTS-KIT.md:131-139 records the 22 Nov stock picks under S Kart/GT/Classic Formula names. WORLD-RULES.md section B lists Swimming (20) and Messing around (21) and leaves out Paintball, while MINIGAMES.md D lists Paintball. The platform decision sits under 'Movement roadmap' (NEXT.md:1 and ~46-63). Parked ideas are scattered. There is no index tying all of this together.

9. **The rule documents contradict each other**
   - Id: PROC-6
   - Kind: problem
   - Severity: medium
   - Detail: The rule files repeat and contradict each other on reply format, pictures and the Motion Lab. Both main files do say which one wins: the 'How to work with me' file beats CLAUDE.md. So the bigger cost is reading and carrying out-of-date rules, not real confusion. A few true conflicts remain, such as 'no screenshots' against 'show pictures first'.
   - Evidence: Read order: CLAUDE.md:3 (HOW-TO first) and :16 ('also read docs/HANDOFF.md first'); HANDOFF.md:3 ('Read CLAUDE.md first'). First line of a reply: CLAUDE.md:50 (time estimate alone), :56 (one plain action line), HOW-TO:52 (short summary). End of a reply: CLAUDE.md:55 (summary), HOW-TO:54 (what I need from you), HOW-TO C7 (link at bottom). Time estimate: CLAUDE.md:50 (always) vs HOW-TO:58 (only if over 2 minutes). Pictures: CLAUDE.md:49 ('Do not send screenshots unless asked') vs HOW-TO:73 ('visual learner') and HANDOFF item 66 ('show pictures first'). Length and usage: CLAUDE.md:43 ('top priority is not wasting the owner's usage') vs HOW-TO:25-26 ('five or a hundred' options) and :72 ('Explain ... as you go'). Approval: HOW-TO:45 ('Never start a task until I say Go') vs NEXT.md item 37 vs HANDOFF item 69 ('push automatically'). Role: game-dev/13-production.md:34 ('AI should implement exactly what is asked') vs HOW-TO:15 ('You research, compare, and decide'). Motion Lab: CLAUDE.md:76 rule 16 vs README.md:19 ('not a second avatar-development hub').
   - Why it matters: Every new session has to guess which rule wins, so replies and behaviour vary from session to session. That wastes the owner's reading time and causes friction.
   - Suggestion: Merge CLAUDE.md section B, the reply rules and AGENTS.md into the one HOW-TO file. Remove the duplicates and settle each conflict with the owner in a single short question list, for example 'Start of reply: action line or summary?'. Delete or archive rule 16 and the old reply rules.
   - Time saving: One short, consistent rule file means fewer misunderstandings and shorter replies in every session.
   - Verdict: partly_true
   - Verifier note: The conflicting lines exist as quoted: CLAUDE.md:49-60 against HOW-TO:52-58 and :73, and CLAUDE.md:76 rule 16 against README.md:19. But CLAUDE.md:7 ('Where anything below disagrees with it, that file wins; the notes below are kept for history') and HOW-TO:4-5 set a clear rule that HOW-TO wins. For conflicts between CLAUDE.md and HOW-TO, a session does not have to guess. Some cited 'approval' conflicts are weak. NEXT.md item 37 was overruled by item 47. HANDOFF items 66 and 69 ('once the owner approves, push without asking again') are about pushing after approval, not starting without a Go. The conflicts that remain real are CLAUDE.md B9 'no screenshots unless asked' against HANDOFF item 66 'show pictures first', game-dev/13-production.md:34 against HOW-TO:15, and rule 16 against the README/motion-lab README:3. The read-first loop (CLAUDE.md:3 and :16, HANDOFF.md:3) is circular but does no harm.

10. **Who owns what on paper does not match what actually happens, and the agreed code review is not happening**
   - Id: PROC-8
   - Kind: problem
   - Severity: medium
   - Detail: The ownership table does not match reality. Claude spent recent days on avatar looks and kart models, and Codex built avatar joint studies and worked in Claude's movement folder. Nobody has built the world's look. The promised Codex review of the new avatar never happened, and the owner later said he wants every line rechecked near the end of the game. That pushes review late, when bugs are more expensive to fix.
   - Evidence: CLAUDE.md:64 ownership line. Claude: 68 new-avatar and 24 kart-design commits. Codex: foot-lab, wrist-lab and elbow-lab (18-19 Nov), and 4ff999c added kart-parts/product-prototypes.js. COLLABORATION.md:32 ('Avatar appearance: Codex implements'), later replaced at :38-40. WORLD-RULES.md:14 ('Codex owns how blocks and worlds look'), yet island/ was last committed by Claude on 19 Nov and Codex has no commits there. HANDOFF item 8 (line 22) 'Codex reviewing the code': no Codex or 'Isaias U' commit touches avatar-v2/ or new-avatar/ after 20 Nov, and no review record was found. COLLABORATION.md was last edited 20 Nov. Kart names drift: KARTS.md (GoKart / GT GoKart / F1 GoKart) vs PARTS-KIT.md (S Kart / GT / Classic Formula).
   - Why it matters: When ownership is unclear, the two assistants duplicate work or leave gaps, like nobody building the world. A promised safety check (the code review) can quietly never happen.
   - Suggestion: Update the ownership table to match reality, or move the work back to match the table. Add an owner for 'putting it all together into the playable game'. If code review matters, make it a visible step: one short review note per chunk, filed in the decisions log.
   - Time saving: Avoids paying for the same thing twice and avoids finding out late that a review or a world builder never happened.
   - Verdict: partly_true
   - Verifier note: Ownership drift is real. Claude made 65 avatar-v2 and 56 new-avatar commits plus kart models. 'Isaias U' (Codex) made the foot, wrist and elbow labs, touched motion-core/ in 18 commits on 18-19 Nov, and added kart-parts/product-prototypes.js in 4ff999c. COLLABORATION.md:32 was overridden at :38-40. Nobody has built world looks. Two details are off. 'Isaias U' has 2 incidental commits in island/ (325625b, fce43a1: Test Lab and background colour), so 'no commits there' is not literally true. On review, the owner's later note (HANDOFF item 75a, line 89) says 'Near the end of the game, go back and recheck every single line of code', which suggests the owner pushed review to the end. No per-chunk Codex review of new-avatar exists (all 121 avatar-v2/new-avatar commits are by Claude). Kart names drift as stated.

11. **The planned scope is very large, with no order of priority**
   - Id: PROC-14
   - Kind: risk
   - Severity: medium
   - Detail: On one day the owner approved 15 detailed feature cards (including a big connected world, with 100-200 online players per world noted as 'later') and 20 minigame cards, plus 20 styles each for three kart classes. Nothing says which comes first.
   - Evidence: FEATURES.md (16+ 'approved, detailed' cards; online players and NPCs card: 'about 100–200 players per world'). MINIGAMES.md:255-261 (20 minigames). KARTS.md H-I (20 GoKart, 20 GT and 20 F1 styles). On 19 Nov, 57 commits approved design cards; none has been built. docs/game-dev/13-production.md:22 'Small scope, finished'.
   - Why it matters: With everything 'approved' and nothing ranked, work spreads thin and none of it reaches 'done'. For one person, this is the most common reason games never ship.
   - Suggestion: Rank the features and minigames into three groups: First Playable (only 1-2 things, with kart racing the furthest along), Version 1, and Later. Keep all the cards, but mark which group each belongs to.
   - Time saving: Assistants stop preparing for features that are months away.
   - Verdict: partly_true
   - Verifier note: FEATURES.md has 15 cards marked 'approved 19 Nov, detailed' (cards 1-9, 13, 14, 16-19), not '16+'. Cards 10-12 were removed or folded in, and 15 is an idea. The '100-200 players per world' line (FEATURES.md:357) is listed under 'Numbers later ... (later)'. MINIGAMES.md has exactly 20 '(approved 19 Nov)' cards. KARTS.md H-I has 20 GT and 20 F1 styles. On 19 Nov there were 59 commit-file touches on FEATURES/MINIGAMES/WORLD-RULES. No ranking or build order exists. FEATURES.md 'G. Next' only says minigames get cards next. 13-production.md:22 says 'Small scope, finished'.

12. **The rejected racing prototype is still in place and tested, and the racing plan's status table is stale**
   - Id: PROC-15
   - Kind: problem
   - Severity: medium
   - Detail: The owner rejected the first racing prototype as the foundation, yet its files still sit in the racing folder, and its race, lap and ghost tests still run before every publish. Meanwhile the fresh rebuild has not started race rules, opponents or ghosts, so that work will be built a second time. The plan's status table and the handoff describe next steps (controls, isometric camera, the block adapter) that never happened. Recent work went instead to realistic GT3 and 2026 F1 tuning.
   - Evidence: racing-core/PLAN.md:20 'Rejected as the new foundation'; README.md:9 says the earlier modules are superseded. The old files racing-core/index.js, session.js, ghosts.js, progress.js, vehicle.js, driver.js and track.js still exist. racing-core/tests/core.test.mjs (run by CI) imports createRaceSession and createGhostStore from '../index.js'. PLAN gate table: section 3 'block adapter pending Claude' (since 18 Nov); section 7 shared controls 'Not started', although motion-lab/src/input.js exists. HANDOFF.md:153-160 says the controls and isometric chunk is authorized but 'No implementation ... has started'. Codex commits 519d3cd, 56075a5 and 0e5ae96 (22-23 Nov) added the 2026 F1 and GT3 presets.
   - Why it matters: Keeping rejected code alive confuses future sessions about what is real. Stale status tables mean nobody knows what the true next racing step is.
   - Suggestion: Decide whether parts of the old race logic (laps, ghosts) can be reused. Then either move the old files to an archive or adopt them on purpose. Update the racing status table and make 'race rules: one full lap with a finish' the next racing step toward First Playable.
   - Time saving: Could avoid rebuilding lap counting and ghosts from scratch, and keeps the next racing step clear.
   - Verdict: confirmed
   - Verifier note: racing-core/PLAN.md:18 (cited as :20) says 'Rejected as the new foundation', and :26 calls the old track.js and index.js the superseded prototype. The old files index.js, session.js, ghosts.js, progress.js, vehicle.js, driver.js and track.js still exist. racing-core/tests/core.test.mjs:20 imports createRaceSession and createGhostStore from '../index.js' and runs in CI through test:racing-core. In the latest run that step took 72 s. Also, racing-lab/src/simulation.js imports the old prototype, but nothing imports simulation.js, so it is dead code. The PLAN table matches (section 3 'block adapter pending Claude'; 4-7 'Not started'), except section 8 is 'Deferred'. HANDOFF.md:153-160 says the controls/isometric chunk has not started. The README line numbers are off by about 2 (README.md:6 and :11).

13. **A First Playable version can largely be assembled from parts that already exist**
   - Id: PROC-O1
   - Kind: opportunity
   - Severity: medium
   - Detail: Several approved pieces are already built and phone-tested: a phone-ready avatar, an approved kart with tuned driving on four tracks, shared phone, keyboard and controller input, and an island built from a rulebook. Putting these together is probably much less work than any of the restarts so far.
   - Evidence: HANDOFF item 7 (Game avatar about 29,000 triangles, approved on the owner's phone). README.md:5 and HANDOFF.md:141-151 (Driving Checkpoint 2, approved Fast handling, four tracks). motion-lab/README.md:47-49 (shared input). NEXT.md item 28 (island built from src/world/rulebook.ts with a checker). racing-core/PLAN.md:30-39 (track placement transform ready for islands).
   - Why it matters: This is the fastest route to the owner's main goal: something that actually plays.
   - Suggestion: Make the next chunk 'First Playable': the existing avatar standing on the island next to the existing kart, tap to drive one lap on one track, with a finish time. Leave avatar looks and walking polish for after that works.
   - Time saving: Gets a working game loop in days by reusing approved parts instead of building new ones.
   - Verdict: confirmed
   - Verifier note: HANDOFF item 7 has the Game avatar (about 29,000 triangles) approved on the phone. HANDOFF.md:141-151 covers Driving Checkpoint 2. Shared input is in motion-lab/README.md:7-11. racing-core/PLAN.md:36 decision 7 provides 'a rigid placement transform so islands can be added'. The opportunity is bigger than reported. src/world/collision.ts already provides island ground and wall collision for a walking character (solidAt/groundBelow/moveBox, commit 5641dec). motion-core/controller.js holds walking rules that match 3D-WORLD-3 exactly (motion-core/PLAN.md:27-50). The site root (src/main.ts, src/player.ts, 329 lines) already lets you move an avatar with walk, run and jump on a slab.

14. **Codex's commits mostly appear under the owner's name**
   - Id: PROC-9
   - Kind: problem
   - Severity: low
   - Detail: About 104 commits are signed with the owner's name, but they read like Codex's work (racing, driving, Test Lab, joint labs). The handoff credits Codex for some of them. The history therefore cannot show who actually did what.
   - Evidence: git log: 104 commits authored 'Isaias U'. HANDOFF.md:141-143 names source commit 97d2ba8 (authored 'Isaias U') as Codex's Driving Checkpoint 2. 8 commits are authored by Codex but committed as 'Isaias U'.
   - Why it matters: It is harder to see each assistant's real output, to trace who made a bug, or to check whether a promised review was done.
   - Suggestion: Have Codex sign its commits with its own name, or add a short 'Made by Codex' line to each commit message.
   - Time saving: Faster tracing of problems back to whoever can fix them.
   - Verdict: confirmed
   - Verifier note: git log shows 104 'Isaias U' author commits, almost all racing, driving, Test Lab and joint labs (all 40 racing-core and 40 racing-lab commits are 'Isaias U'). 8 more commits have author Codex and committer Isaias U. HANDOFF.md:141-143 credits Driving Checkpoint 2, source 97d2ba8, to Codex, and that commit is authored 'Isaias U'. There are also 2 commits by 'isaiasurrutia96' through the GitHub web UI (initial and rename).

15. **Some safety points and decisions exist only on one machine or on an unmerged branch**
   - Id: PROC-10
   - Kind: risk
   - Severity: low
   - Detail: Two convenience labels (tags) were never uploaded, but the work they point to is safely on GitHub. The checkpoint list names an island tag that does not exist. One Codex draft was backed up outside the project. A pushed branch has 9 extra avatar-preview commits, and its main decision is already recorded on the main line.
   - Evidence: HANDOFF.md:111: tags before-reset-2026-11-20 and gait-v1-reactive-2026-11-20 'could not be pushed (error 403)'. NEXT.md items 45-46 rely on gait-v1-reactive. checkpoints/README.md:18 lists island-checkpoint-1-2026-11-17, but git tag -l shows no such tag (the files are in commit 526e323). motion-core/PLAN.md:321: 'The uncommitted full-body appearance draft was backed up outside the repository'. origin/claude/relaxed-wozniak-iznto4 is 9 commits ahead of main, including 3218182 'new-avatar work is a visual prototype until approved'.
   - Why it matters: If that one computer is lost or the branch is deleted, the work and the recorded decision go with it, and the notes point to things nobody can find.
   - Suggestion: Upload or recreate the missing tags (or fix the notes to point at real commits), and bring the useful parts of the branch into main or record them in the decisions log. Make 'nothing important lives outside GitHub' a standing rule.
   - Time saving: Avoids hours of searching or redoing work later.
   - Verdict: partly_true
   - Verifier note: HANDOFF.md:111 confirms the two unpushed tags (403). git ls-remote shows 8 remote tags and no island tag, although checkpoints/README.md:18 lists one. The island files are in 526e323. motion-core/PLAN.md:321 confirms a draft was backed up outside the repo. But the work behind the missing tags is safe: 9603ed8 and 747d0ba are both ancestors of origin/main, so only the labels are missing. The relaxed-wozniak branch is pushed to GitHub, not stored on one machine, and its key decision ('visual prototype until approved') is also on main as HANDOFF item 64 (line 78). Only the Codex full-body draft is truly outside GitHub.

16. **A 'frozen' checkpoint was changed after it was saved, and the checkpoint list is out of date**
   - Id: PROC-11
   - Kind: problem
   - Severity: low
   - Detail: Avatar Checkpoint 2 was updated in place three times on 18 November after owner approvals, against the 'never change a checkpoint' rule. The original version is still saved under its tag. The checkpoint list has not been updated since 17 November and leaves out both driving checkpoints and the jointed-avatar checkpoint.
   - Evidence: checkpoints/README.md:12 'Keep the existing tags and frozen files unchanged'; CLAUDE.md:80 rule 17. checkpoints/avatar-2 was changed in 4067ec2, 2a30bad and 0009615 (18 Nov), while the tag avatar-checkpoint-2-2026-11-17 points to fb0ff14. checkpoints/README.md was last edited 17 Nov and has no entries for checkpoints/driving-1, driving-2 (tagged) or avatar-joints-1 (untagged, 35 MB).
   - Why it matters: A checkpoint is only useful if it is exactly what was approved. If it can change, a rollback may not return to the real approved state.
   - Suggestion: Make new checkpoints instead of editing old ones, and keep the checkpoint list up to date in the same commit that saves a checkpoint.
   - Time saving: Rollbacks work the first time, with no detective work.
   - Verdict: partly_true
   - Verifier note: checkpoints/avatar-2 was edited after tag fb0ff14 in 4067ec2, 2a30bad and 0009615 (18 Nov), changing 204+/176-. That breaks the rule in checkpoints/README.md:12. But NEXT.md:69-70 and :81-82 record each in-place update as following an owner approval ('Checkpoint 2 updated in place (same name)'), and the tag still preserves the original. So it was a recorded choice, not silent tampering. checkpoints/README.md was last edited 17 Nov (7627f68). It has no entries for driving-1, driving-2 or avatar-joints-1, and it still labels avatar Checkpoint 2 as 'current'.

17. **The 'research everything' rule is being applied to throwaway visual drafts**
   - Id: PROC-13
   - Kind: problem
   - Severity: low
   - Detail: On 21-22 November, the 'research everything' rule led to heavy engineering on visual drafts that were then rejected. The owner noticed and on 22 November switched to 'visual prototype only, pictures first, light checks'. The two-level approach is already partly in place but is not written into the main rule file.
   - Evidence: HOW-TO-WORK-WITH-ME.md:22-26. HANDOFF item 14 (line 28): four sphere-building methods compared for one 300-triangle ball. Item 41 (line 55): Möller–Trumbore ray tests, PN-triangle smoothing and 22 checks, rejected in item 42 the next step. Items 64-79 (lines 78-93) are marked 'Visuals only' but still carry checks and 'tests of the tests'. CLAUDE.md:43.
   - Why it matters: Heavy work on drafts that get thrown away uses up the owner's usage and slows down getting answers to 'do you like this look?'.
   - Suggestion: Use two levels. Deep research and full tests for foundations (physics, controls, saving, online play, performance). Quick rough mockups or pictures for look decisions, with the full build only after the owner approves the look. Ask the owner to confirm this split.
   - Time saving: Look questions get answered in minutes with mockups instead of hours of engineering.
   - Verdict: partly_true
   - Verifier note: HOW-TO:21-41 has the 'five or a hundred' rule. Item 14 (line 28) compared four sphere methods. Item 41 (line 55) used Möller–Trumbore, PN triangles and 22 checks, rejected in item 42. But the owner already moved to a lighter approach on 22 Nov. Item 64 (line 78) says 'Visual prototype only (pictures first, light checks, clean rebuild after the avatar is approved)', and the branch item 72 says the same. In items 64-79, only one 'test of the test' mention appears (line 87); the rest say 'light checks' or 'Visuals only'. The heavy work on drafts applies mainly to items 14-59 (21-22 Nov).

18. **Strong checkpoint system with fingerprints and tags**
   - Id: PROC-S1
   - Kind: strength
   - Severity: low
   - Detail: Approved versions are saved as frozen copies with fingerprints, and the build checks that they have not been tampered with before publishing. Git tags mark the approved source, so any approved version can be brought back.
   - Evidence: checkpoints/README.md:10 and :30 (SHA-256 manifests checked by the build). 8 git tags: avatar 1 and 2, test lab 1, motion lab 1, driving source and checkpoint 1 and 2. checkpoints/driving-2/CHECKPOINT.json. racing-core/PLAN.md and HANDOFF.md:141-148 record the approved physics fingerprint 'kart-v1-c0934f4555677c0e'.
   - Why it matters: This protects the owner's approved work from being lost or changed by accident, which matters a lot when two AIs edit the same project.
   - Suggestion: Keep doing this. Add the missing entries to the checkpoint list and never edit a frozen folder (see PROC-11).
   - Time saving: Rolling back to an approved version takes minutes instead of rebuilding.
   - Verdict: confirmed
   - Verifier note: checkpoints/README.md:10 and :30 describe SHA-256 manifests checked by the build. git ls-remote shows all 8 tags on GitHub. checkpoints/driving-2/CHECKPOINT.json exists. HANDOFF.md:141-148 records the physics fingerprint kart-v1-c0934f4555677c0e. One caveat is PROC-11, where Checkpoint 2 was edited in place.

19. **Honest, dated decision records, including mistakes and rejections**
   - Id: PROC-S2
   - Kind: strength
   - Severity: low
   - Detail: Decisions are written down with dates and often in the owner's own words. Mistakes are recorded openly with the fix, rejected ideas are marked 'do not propose again', and test reports say what the tests do NOT prove.
   - Evidence: HANDOFF item 22 (line 36) 'Mistake and correction', which led to HOW-TO D2. Item 28 (line 42) 'Correction'. Item 71 (line 85) 'Rejected ... Do not propose it again'. racing-core/PLAN.md:66-68 'These checks prove geometry ... They do not prove kart handling ... or visual resemblance'. NEXT.md item 47 records the exact reset commit 747d0ba.
   - Why it matters: Honest records build trust and let a fresh session avoid repeating rejected ideas, as long as the records stay short enough to read.
   - Suggestion: Keep the honesty, but put it in a short, one-line-per-decision log (see PROC-5 and PROC-7).
   - Time saving: Rejected ideas are not re-proposed, so the owner does not have to say no twice.
   - Verdict: confirmed
   - Verifier note: HANDOFF item 22 (line 36) is 'Mistake and correction' and led to HOW-TO D2. Item 28 (line 42) is a 'Correction'. Item 71 (line 85) says 'Do not propose it again'. HANDOFF also lists open and uncertain points (lines 107-111). One small caveat: some records contain factual slips. For example, NEXT.md item 47 calls 747d0ba 'Rebuild walk and run the way the wave is made', but 747d0ba is a merge commit and the rebuild is f5b17f2.

20. **Small approved steps, real-phone testing and approval gates**
   - Id: PROC-S3
   - Kind: strength
   - Severity: low
   - Detail: Work is done in small chunks, the owner tests on his own phone, and the racing work follows a clear table of stages, each needing approval. Phone performance was taken seriously: a light avatar was made, and a slow page was fixed by pre-building its shapes.
   - Evidence: racing-core/PLAN.md 'Sequence and approval gates' table. HANDOFF item 7 (line 21): Game avatar (about 29,000 triangles) approved on the owner's phone, 'very smooth'. Item 72 (line 86): a page that froze a phone was fixed by baking (from 29 s to 6.2 s ready).
   - Why it matters: Real-device testing catches problems that automatic checks miss, as the walking episode showed.
   - Suggestion: Apply the same staged-approval table to the avatar and the First Playable plan.
   - Verdict: confirmed
   - Verifier note: racing-core/PLAN.md:70 has the 'Sequence and approval gates' table. HANDOFF item 7 (line 21) records the Game avatar approved on the owner's phone as 'very smooth'. Item 72 (line 86) records the baking fix and 'Now ready in 6.2 s on a computer'.

21. **Sound long-term platform strategy and automatic publish checks**
   - Id: PROC-S4
   - Kind: strength
   - Severity: low
   - Detail: The plan is to build for the web first, which is free and playable on a phone by link, while keeping the game's rules separate from its drawing so it can be moved to consoles later. Controls go through one shared input layer for keyboard, touch and controllers. Automatic tests must pass before anything is published.
   - Evidence: NEXT.md:46-63 (platform decision, 18 Nov). motion-lab/README.md:47-49 (one shared input module for all devices). .github/workflows/deploy.yml runs tests and browser checks before publishing.
   - Why it matters: This is a solid base for a one-person project and keeps future options (Steam, phone stores, consoles) open.
   - Suggestion: Move the platform decision into the main game plan so it is easy to find.
   - Verdict: confirmed
   - Verifier note: The platform decision is at NEXT.md lines ~46-63 (items 8-12, 18 Nov). Shared input for all devices is described in motion-lab/README.md:7-11. The file has only 40 lines, so the cited lines 47-49 do not exist, but the content is there. deploy.yml:30-37 gates publishing on tests and browser checks.

22. **Very high output and clear commit messages**
   - Id: PROC-S5
   - Kind: strength
   - Severity: low
   - Detail: The project produced 427 commits in 9 working days, and the commit messages describe changes in plain English, which makes the history easy to follow.
   - Evidence: git log: 82, 71, 83 and 78 commits on 17, 18, 19 and 22 Nov. Examples: 'Reset the Skeleton section to the wave point at the owner's order...' (4348e1a), 'Save approved driving checkpoint 2 after code recheck' (1f68b8f).
   - Why it matters: The speed shows the two-assistant setup can build a lot. The main gain now comes from pointing that speed at one clear target.
   - Suggestion: Point this output at the First Playable checklist (PROC-1).
   - Verdict: confirmed
   - Verifier note: Per-day counts by author date are 82, 71, 83 and 78 on 17, 18, 19 and 22 Nov. Commit subjects are plain English, for example 4348e1a and 1f68b8f.

### Missed by inspector found by skeptic

1. **The wait before every test grew 30-fold in one week, mostly from driving checks that run even for avatar changes**
   - Kind: problem
   - Severity: high
   - Detail: Every push now waits about 9 minutes before the owner can test it, up from under half a minute on 17 November. More than half of that wait is browser checks for the driving pages. They run even when only the avatar changed, while the avatar's own tests do not run at all. About one push in six is cancelled by a newer push. Each one costs the owner a test round.
   - Evidence: GitHub Actions API (public): 350 push runs, 288 success / 58 cancelled / 4 failure. Median successful run: 17 Nov 0.3 min, 18 Nov 1.1, 19 Nov 2.4, 20-21 Nov 3.4, 22 Nov 7.4, 23 Nov 9.4. 19 Nov alone: 35 cancelled. Step timings of the latest run (45217820916): browser checks 308 s, build 102 s, test:racing-core 72 s. scripts/check-lab-foundations-browser.mjs lists 11 suites run one after another, 9 of them racing-lab driving or track suites. The jump on 22 Nov matches a103b71 'gate publishing with browser regressions'. package.json:8 chains 15 per-lab builds. deploy.yml:15-17 cancel-in-progress.
   - Suggestion: Split publishing so avatar-only changes skip the driving browser checks, or run the heavy driving checks only when driving files change. Stop building and publishing old rejected test pages. Give each assistant its own preview link. Group small tweaks into one push.

2. **Rejected prototypes are still built and published, including as the site's home page**
   - Kind: problem
   - Severity: medium
   - Detail: The old walking and running pages the owner rejected, and several finished joint studies, are still rebuilt and published on every push. The site's home page is still the 17 November test where the avatar walks, runs and jumps on a slab. This adds to the publish wait. It also confuses future sessions about what is current, and anyone opening the public link lands on an old rejected test.
   - Evidence: package.json:8 build chain includes build:run-test, build:walk-test, build:motion-core-test, build:avatar-lab, build:avatar-test, build:hand-lab, build:foot-lab, build:wrist-lab, build:elbow-lab. vite.config.ts:14 includes movement/index.html. index.html loads /src/main.ts, whose line 2 reads 'A floor slab with the approved avatar on it. He walks, runs and jumps'. README.md:24 keeps /walk-test/, /run-test/, /movement/ and the site root as earlier prototypes. racing-lab/src/simulation.js imports the old racing prototype, but nothing imports it.
   - Suggestion: Move finished or rejected studies into an archive that is not built on every push (they stay in git history). Make the home page point to the Test Lab or to the future First Playable page.

3. **Claude's own movement plan file is out of date and contradicts the current rule**
   - Kind: problem
   - Severity: medium
   - Detail: The file that calls itself 'the source of truth for Claude's movement work' still lists movement pieces as built that were deleted on 20 November. Its first decision still says layers no longer wait for the owner's approval, though the owner later ruled 'one movement at a time, move on only when the owner says it looks good'. The reset is only added as a note at the very bottom. It also says 'Codex builds all visuals', which no longer matches who does the work.
   - Evidence: motion-core/PLAN.md:3 ('The source of truth for Claude's movement work. Codex builds all visuals'). :9-11 (decision 1, layers no longer wait for approval). :64 describes skeleton/footplan.js, skeleton/gait.js and skeleton/look.js as built, but `ls motion-core/skeleton/` shows only balance, bones, hands, pose, poses, quintic, reach, shoulder and skeleton. :421 adds the reset note. HANDOFF.md:15 has the current 'one movement at a time' rule.
   - Suggestion: When movement work restarts, rewrite the top of this plan to match the reset. Or replace it with a short pointer to the single decisions log, so the next session does not follow the overruled 'no approval needed' rule.

4. **A render of Nintendo's Mario model is published on the public site**
   - Kind: risk
   - Severity: medium
   - Detail: As a walking reference, the project rendered Mario's original model and walk animation from decompiled game data. The resulting video and GIF are published on the public test site. Copying another company's character this way is a legal risk. It also weakens the owner's own position when he wants others to respect his idea. This is a note for the legal inspector.
   - Evidence: references/sm64-walk/README.md:3 says it 'uses the original MARIO_ANIM_WALKING (0x48) animation channels and high-detail Mario model from n64decomp/sm64' and that 'the mesh, rig offsets, joint rotations and vertical motion are read from the source data'. public/references/sm64-walk/ contains walk.mp4 (857,055 bytes), walk-slow.gif (1,188,523 bytes) and poster.jpg, which Vite copies to dist (same README). The repo is public with Pages enabled (GitHub API: private=false, has_pages=true). Also references/motion-compare and commit d452192 'Match avatar and Mario poses'.
   - Suggestion: Take the Mario render off the public site and out of the public repo. Keep inspiration as written notes or links to official videos instead, and ask the legal inspector to confirm.

5. **Some decision records contain factual slips**
   - Kind: problem
   - Severity: low
   - Detail: The records are honest, but a few facts in them are wrong or out of order. A future session that trusts them could be misled.
   - Evidence: NEXT.md item 47 (line ~495) and motion-core/PLAN.md:421 call 747d0ba 'Rebuild walk and run the way the wave is made', but `git log -1 747d0ba` shows 'Merge remote-tracking branch origin/main into claude/lucid-pascal-xqtrwb'. The rebuild is f5b17f2. MINIGAMES.md has section E (line 251) before D (line 255), and its '20 minigames' list is numbered to 21. checkpoints/README.md:6 still marks avatar Checkpoint 2 as 'current', while HANDOFF item 7 makes the Game copy the working avatar and avatar/official.json pins the joint assembly.
   - Suggestion: When the decisions log is consolidated, check each commit reference and status label once against git.

## Code architecture and foundation
**Area summary:** There is no single game core in this repo. There are about 20 separate pages, and each one sets up its own 3D scene, camera, drawing loop and controls, so the avatar, the kart and the island have never been in the same world. A little is shared: one presentation helper (src/test-lab-scene.ts), one page template (motion-lab/src/page.js) that the Motion Lab and the Racing Lab both use, and one "universal" input file. The best parts are solid enough to build on. The racing rebuild (racing-core/track, kart, contacts, testing) works without any drawing code, runs at a fixed 120 updates a second, passes strict type checks, and only needs a tiny "how high is the ground here" question from whatever world it drives on. The motion-core movement rules and the island's solid-ground code are clean, tested modules too. I bundled the island, the phone-ready Game avatar, motion-core, the kart physics and the shared input together in a scratch test, and they compile into one file with zero errors. That means the gap to a first playable game is mostly connecting pieces, not rewriting them. The biggest real gaps are these: the avatar cannot walk right now (walking and running were removed), nothing connects a character to the island's solid ground, there is no way to get into or out of a kart, there are four different control schemes, and there is no save system. Build and repo habits also waste time: 15 custom build scripts, 13 built pages (10.5 MB) committed to git that fall out of date, and automated checks that test an old racing prototype instead of the approved one.

### Key facts
1. 18 runtime files each create their own WebGLRenderer + Scene + PerspectiveCamera (grep, excluding references/): avatar-lab, avatar viewer, elbow-lab, foot-lab, hand-lab, karts, motion-core-test, motion-lab/src/page.js, movement, new-avatar, run-test, skeleton-test, src/island-lab.ts, src/lab.ts, src/main.ts, src/oval-lab.ts, walk-test, wrist-lab.
2. 19 files run their own frame loop (setAnimationLoop/requestAnimationFrame); 12 files create their own OrbitControls; 18 files have their own resize/setSize code; 17 files set up their own lights.
3. vite.config.ts lines 9-15 lists only 5 Vite inputs (main, lab, oval, island, movement). The other pages are built by 15 separate esbuild scripts (*/build.mjs) that paste a minified bundle into an HTML shell. I found no doc explaining why.
4. 13 built pages with three.js inlined are committed to git: 10.46 MB in total (racing-lab/index.html alone is 2.9 MB). 144 of 427 commits touch them. The .git pack is 164 MB.
5. Package dependencies are only three@0.180.0 and cdt2d. There is no physics library: all physics (kart, contacts, voxel collision, character movement) is written by hand.
6. tsconfig.json includes only src/ (23 TS files). The repo tracks 47 .ts, 157 .js and 147 .mjs files outside checkpoints, and no JS file uses @ts-check. Running tsc strict by hand on racing-core and avatar TS files gave 0 errors.
7. Foundation unit tests (motion-lab input, racing-lab controls/pedals/page-activity/app, test-lab zoom): 52 of 52 passed in about 0.4 s. Island checks passed, and the solid-ground test measured 13.4 microseconds per move over 77,064 solid cells.
8. motion-core/tests/compare.mjs line 82 prints 'Old reference repo not found: comparison skipped.' and exits as a pass when the 3D-WORLD-3 checkout is missing, which it is here.
9. CI (.github/workflows/deploy.yml lines 30-37) runs test:racing-core, which imports racing-core/index.js (the superseded prototype; racing-core/README.md line 1). The approved rebuild's own checks (test:racing-kart, test:racing-contacts, test:racing-drive) are not in CI.
10. Scratch test (written only in the scratchpad): one esbuild bundle importing src/world/island (buildIsland, islandSolid), avatar/src/light-avatar.js (loadGameAvatar), motion-core/skeleton/pose.js, motion-core/controller.js, racing-core/kart/index.ts (createKartController with a one-line island ground adapter) and motion-lab/src/input.js gave 421,451 bytes, 45 inputs, 0 errors, 0 warnings. I compiled it but did not run it in a browser.
11. Units match across modules: metres, +Y up, yaw 0 facing +Z (racing-core/README.md 'coordinate convention'; motion-core/controller.js uses sin/cos(facing) the same way). Kart wheelbase is 2.03 m; the island is 14x14 blocks of 0.43 m (about 6 m across).
12. Avatar asset sizes in avatar/assembled-joints: Detailed delivery 20.0 MB gz, parts 35.8 MB gz, Light 5.2 MB gz, Game 2.0 MB gz (the Game copy is the owner-approved phone avatar, docs/HANDOFF.md item 7).
13. Of 176 runtime-candidate JS/TS files, 37 are not reachable from any page entry point (esbuild metafile scan). This includes 9 racing-core root prototype files, racing-lab/src/simulation.js, racing-lab/src/track-view.js and motion-lab/src/walker.js. Some others in that list are build-time-only tools.
14. WORKING TREE NOTE FOR THE LEAD: a full `npm run build` ran from another process during this audit (dist/ timestamps 16:50:17 to 16:51:54 UTC). I did not run it. It rewrote tracked files, and git status now shows avatar-test/index.html and motion-lab/index.html as modified. I left them untouched because of the read-only rule.
15. From dist/ folder timestamps of that concurrent build, the full build took about 97 s. The wrist-lab step took about 35 s and the elbow-lab step about 45 s, because those build scripts also run tests and bake study assets (wrist-lab/build.mjs, elbow-lab/build.mjs).

### Findings

1. **No shared game core: about 20 pages, each with its own scene, camera, loop and controls**
   - Id: ARCH-1
   - Kind: problem
   - Severity: high
   - Detail: Each lab page builds its own 3D world from scratch: its own drawing setup, camera, lights, screen-resize handling and frame loop. No single 'game' file holds the world, the player, the camera and the controls for everything else to plug into. Only a little is shared. One helper adds zoom and floor presentation to pages after they are built, and one page template (the Motion Lab page) is reused by the Racing Lab.
   - Evidence: 18 files call `new WebGLRenderer(` + `new Scene()` + `new PerspectiveCamera(`; 19 files run setAnimationLoop/requestAnimationFrame; 12 create OrbitControls. src/test-lab-scene.ts:14 says 'Shared presentation only. Physics, subject geometry and animation stay in each test.' racing-lab/src/main.js reuses motion-lab/src/page.js via createMotionLab({createSimulation}). No createGame/Engine/game loop module exists anywhere (grep).
   - Why it matters: Every new feature gets built inside one lab and has to be rebuilt or re-wired before it can live in the real game. The longer this goes on, the bigger the eventual merge job gets, and that job is exactly the step that turns 'cool demos' into 'a game'.
   - Suggestion: Make one 'game shell' page now. It would hold one world, one frame loop, one camera system, one control system and one place to add things (avatar, kart, island). Labs stay as testing pages, but new work gets written so it plugs into the shell, the same way the Racing Lab already plugs into the Motion Lab page.
   - Time saving: Stops paying for the same scene, camera and controls setup about 20 times, and avoids one large merge later.
   - Verdict: confirmed
   - Verifier note: Grep over tracked JS/TS files (excluding checkpoints, references and scripts/preview) found 18 files that create `new T.WebGLRenderer` / `new WebGLRenderer`, 21 with `new Scene(` and 21 with `new PerspectiveCamera`, about 20 runtime files that run their own setAnimationLoop/requestAnimationFrame, and 12 that create OrbitControls. The quote at src/test-lab-scene.ts:14 ('Shared presentation only. Physics, subject geometry and animation stay in each test.') is exact. racing-lab/src/main.js:2 imports createMotionLab from motion-lab/src/page.js. No createGame/Engine/GameLoop module exists.

2. **The racing rebuild is engine-quality and portable**
   - Id: ARCH-2
   - Kind: strength
   - Severity: high
   - Detail: Codex's racing rebuild works on its own, without any drawing code. It updates at a fixed speed, so it behaves the same on slow and fast phones. Its code passes strict type checks, it is heavily tested, and it only needs one small question from the world it drives on: 'how high is the ground here?'. It already drives in a second world (the neighborhood streets), which proves it is not tied to the race tracks.
   - Evidence: racing-core/kart/index.ts:66-68 `SurfaceWorld = { heightAt(x,z,maximum), surfaceAt? }`; racing-core/testing/neighborhood.ts gives a non-track world; per-folder strict tsconfig checks (racing-core/kart/check.test.mjs:296, contacts/check.test.mjs:345, track/check.test.mjs:200); my strict tsc run on racing-core TS gave 0 errors; README 'accumulator advances at 120 Hz'; no three.js imports in racing-core runtime files (only in 2 test files).
   - Why it matters: This is the kind of building block a real game can stand on. The kart can be dropped onto the island or a future open world without being rewritten.
   - Suggestion: Use racing-core as the model for how other systems should be built: logic separate from drawing, a fixed update speed, and a small clear way to connect. Point the avatar movement work at the same pattern.
   - Time saving: Driving will not need to be rebuilt when it moves into the main game.
   - Verdict: confirmed
   - Verifier note: racing-core/kart/index.ts:66-69 defines SurfaceWorld {heightAt, surfaceAt?}. KART.step is 1/120 (index.ts:7) and advance() runs only whole fixed ticks (index.ts:312-332). I ran tsc -p on kart, contacts, track and testing tsconfigs (all strict, noEmit) and every one exited 0. Only two test files in racing-core import three. testing/neighborhood.ts:38 implements heightAt for a second world. One citation is wrong: the README '120 Hz accumulator' sentence (README line 24) describes the superseded prototype, not the rebuild. The rebuild's own code and kart/README.md:28 still confirm the fixed 1/120 s step.

3. **Avatar, island, movement and kart already compile together in one file**
   - Id: ARCH-4
   - Kind: opportunity
   - Severity: high
   - Detail: The island, the Game avatar loader, the movement rules, the kart physics and the shared controls do build together into one file. A one-line connection also really lets the kart drive on the island's ground: I ran it without a browser and it works. This proves the pieces connect, not that they make a game. The build tool did not check for type mistakes. The island is only about 6 m across, so a kart drives off it in about half a second. The kart also cannot bump into walls or blocks yet, because the block-collision link it needs is listed as pending.
   - Evidence: Scratch entry (scratchpad only) bundling src/world/island/index.ts, src/world/island/solid.ts, avatar/src/light-avatar.js (loadGameAvatar), motion-core/skeleton/pose.js, motion-core/controller.js, racing-core/kart/index.ts (createKartController({world:{heightAt:(x,z,max)=>solid.groundBelow(x,z,max)?.y??null}})), motion-lab/src/input.js: 421,451 bytes minified, 45 inputs, 0 errors, 0 warnings. All modules use metres, +Y up, yaw 0 toward +Z.
   - Why it matters: The jump from 'many labs' to 'one place where you walk around the island and drive a kart' is smaller than it looks. It is mostly wiring, not starting over.
   - Suggestion: Make the next milestone a plain-shapes 'sandbox' page: island, Game avatar (or a simple marker), movement rules, island ground and one kart, all in one world, with no new art. Grow the game from that page.
   - Time saving: Shows you early whether the pieces really fit, before more time goes into separate labs.
   - Verdict: partly_true
   - Verifier note: I reproduced the bundle in the scratchpad with the same seven imports (island, islandSolid, loadGameAvatar, pose, createMoveController, createKartController with the one-line groundBelow adapter, createInput): esbuild reported 45 inputs, 0 errors, 0 warnings, about 420 KB. I also went further and ran the kart on the island ground headlessly in Node. It rolls at y=0.43 m (the grass top) and then drives off the edge: at z=3.05 m it is no longer grounded, and by 1 s it has fallen to y=-2.46 m. Three caveats. esbuild does not type-check, so '0 errors' only means the imports resolve. The island is 14 blocks x 0.43 m, about 6 m wide (src/world/island/layout.ts:7), so a kart with a 2.03 m wheelbase leaves it in about half a second. The kart only asks the world for ground height, so it would drive through blocks; kart/README.md:48 says 'Claude's block collision engine and its integration are still pending'.

4. **The avatar cannot walk anywhere right now, which is the biggest gap to a playable game**
   - Id: ARCH-10
   - Kind: risk
   - Severity: high
   - Detail: The current approved movement code moves only a marker on flat ground, with no height or jumping. It is not connected to the island's solid ground, and getting into a kart has not been started. These are the biggest gaps to a playable game. However, an older prototype on the site's front page already has a character that walks, runs and jumps with a follow camera. Its jump and gravity code could be reused rather than written again.
   - Evidence: docs/HANDOFF.md:16 'Walking and running were rejected and removed'; motion-core/controller.js:1 'Ground movement only (no jumps yet)', state at line 18 has x,z but no y; motion-core-test/main.js:1-3 drives 'a simple marker'; moveBox/groundBelow used only in tests/island/solid.mjs; racing-core/README.md:7 'Character mounting, island entrances ... are outside this track/race module'. Git: 19 commits mention walk/gait/running vs about 100 mention torso/socket/limb/elbow/ball.
   - Why it matters: Until a character can move around a world, nothing else in the game can be played or tested together. Avatar shape work is currently getting far more effort than making the avatar move.
   - Suggestion: Get basic movement working on the island first with simple placeholder animation (or just the marker), so the game is playable. Polish the look of the walk afterwards. This follows the project's own guide on prototyping with plain shapes (docs/game-dev/13-production.md item 2).
   - Time saving: Lets the owner play-test real gameplay weeks earlier, so later avatar polish goes into a game that already works.
   - Verdict: partly_true
   - Verifier note: docs/HANDOFF.md:16 does say 'Walking and running were rejected and removed'. motion-core/controller.js:1 says 'Ground movement only (no jumps yet)', and its state (line 18) has x and z but no y. moveBox/groundBelow are used only in tests/island/solid.mjs. The inspector's mounting citation (racing-core/README.md:7) is in the superseded-prototype section, but racing-core/PLAN.md:85 confirms seat and steering-wheel attachment is not started. What the inspector missed is that the site root (src/main.ts + src/player.ts, strict TypeScript) already has an older avatar that walks, runs and jumps, with gravity, coyote time, a jump buffer, falling off the slab edge and a follow camera (player.ts:1-23). My commit-subject counts were 17 for walk/gait/running and 87 for torso/socket/limb/elbow/ball, close to the inspector's 19 and about 100.

5. **Rough path from many labs to one playable game**
   - Id: ARCH-17
   - Kind: opportunity
   - Severity: high
   - Detail: The overall order is sensible: one game shell, then a character standing on solid ground, then a kart, then getting in and out, then saving. Two changes are needed. The kart cannot meaningfully drive on the current 6 m island, so the first shared test world should be bigger; the neighborhood streets the kart already drives on would work. And the kart still needs the block-collision link before it can hit walls in a block world.
   - Evidence: Existing: racing-core SurfaceWorld (kart/index.ts:66), VoxelWorld.groundBelow/moveBox (src/world/collision.ts:46,87), motion-core createMoveController, loadGameAvatar, motion-lab/src/input.js, motion-lab/src/page.js createSimulation plug-in pattern. Missing: no y/jump in motion-core state (controller.js:18), no mount code (racing-core/README.md:7), localStorage only in skeleton-test/main.js (quality setting), no game state module (grep).
   - Why it matters: This gives you a clear milestone, 'walk around the island and hop in a kart', that proves the game works before more time goes into polish.
   - Suggestion: Agree on this as the next big chunk with both assistants: Claude does the walking-on-island part, Codex does putting the kart on the island, and they meet in the shared game shell.
   - Time saving: Gives every future task a home, so nothing has to be rebuilt to fit the game later.
   - Verdict: partly_true
   - Verifier note: The pieces exist as described (SurfaceWorld, groundBelow/moveBox, createMoveController, loadGameAvatar, the createSimulation plug-in pattern), and there is no save module (localStorage appears only in skeleton-test/main.js). But step 3, 'add one kart with the island ground connection', is not a meaningful driving test. The island is about 6 m across, and in my headless run the kart left it within about 3 m of driving. The kart also has no block or wall collision until the pending block-collision integration (kart/README.md:48). A larger ground already exists and is tested with the kart: racing-core/testing/neighborhood.ts, flat streets on a 118 m square (ground rectangle -59..59).

6. **Avatar movement rules and island ground are clean, tested modules**
   - Id: ARCH-3
   - Kind: strength
   - Severity: medium
   - Detail: The movement rules and the island's solid-ground code are clean modules with no drawing code, and their tests pass. The island code really does handle wall sliding, small step-ups and falling off edges. Movement comes out the same at different frame rates when the stick is held steady. When the stick changes quickly, though, the result differs by up to about 87 cm between 30 and 144 frames per second, and the test only prints that number instead of failing.
   - Evidence: motion-core/controller.js:10-11 and line 80 advance() fixed sub-steps; motion-core/skeleton/*.js import only Vector3/Quaternion/Euler/Matrix4 from three; src/world/collision.ts:1-13 VoxelWorld with solidAt/groundBelow/moveBox; tests/island/solid.mjs passed (wall slide, step up, fall off edge, no passing through the trunk at high speed, 13.4 µs per move).
   - Why it matters: These are the right building blocks for 'a character walks around a world'. They just are not connected to each other yet.
   - Suggestion: Keep these modules as the official ones for the game, and connect them: motion-core decides where the player wants to go, and the island's solid-ground code decides where the player can actually go.
   - Time saving: No need to write collision or movement rules again; only the connecting code is missing.
   - Verdict: partly_true
   - Verifier note: motion-core/controller.js has no drawing code and advance() uses fixed sub-steps (lines 80-84). Every motion-core/skeleton import from three is a math class (Vector3/Quaternion/Euler/Matrix4). src/world/collision.ts has solidAt/groundBelow/moveBox, and I ran tests/island/solid.mjs: all PASS, 15.5 µs per move over 77,064 cells. The frame-rate claim only half holds. I ran motion-core/tests/compare.mjs: the 30/60/120/144 fps end-position spread is 0.0 cm for steady input, but 9.4 cm for 'slow circle', 37.5 cm for 'fast circle' and 86.9 cm for 'tiny taps'. Those numbers are only printed and never fail the test.

7. **15 custom build scripts, plus built pages committed to git that go out of date**
   - Id: ARCH-5
   - Kind: problem
   - Severity: medium
   - Detail: Only 5 pages use Vite. The rest are built by 14 small custom scripts, and the built pages (about 11 MB, each with its own copy of three.js) are saved into git, where 144 commits have touched them. At least one is already stale: the committed Motion Lab page no longer matches its source code. The live site is not affected, because the publish step rebuilds every page fresh. The stale copies only confuse local previews and anyone reading the repo. Karts and New avatar cannot be opened with the local preview server at all.
   - Evidence: vite.config.ts:9-15 has 5 inputs; 15 */build.mjs scripts write e.g. ['hand-lab/index.html','dist/hand-lab/index.html'] (hand-lab/build.mjs:18). 13 tracked built pages total 10.46 MB; 144 of 427 commits touch them; .git pack 164 MB. After a concurrent `npm run build` during the audit, `git diff --stat` shows avatar-test/index.html (346 lines changed, now has a third 'Game' button) and motion-lab/index.html (330 lines) differing from the committed copies. karts/ and new-avatar/ have only shell.html (no index.html), so `npm run dev` cannot serve them. No doc explains the per-lab esbuild approach.
   - Why it matters: This bloats the repo, creates merge conflicts between Claude and Codex over files nobody edits by hand, and makes the local preview show old versions. It also leaves room for confusion about what is actually live.
   - Suggestion: Move every page into Vite's list of pages (the config already supports this) and stop committing built files. Let the automated publish step build them fresh each time. Do this as one small cleanup chunk, with the browser checks run before and after.
   - Time saving: Removes 15 scripts to maintain, a large share of commit noise, and conflicts between the two assistants. The local preview would also update live while editing.
   - Verdict: partly_true
   - Verifier note: vite.config.ts lists 5 inputs, and 15 */build.mjs files exist (14 are chained in `npm run build`, plus build:checkpoints; avatar/build.mjs is not in the chain). The 13 large tracked built pages total 10,967,458 bytes (10.46 MiB), racing-lab/index.html alone is 2,998,181 bytes, `git log` shows 144 commits touching them, and the pack is 172 MB (164 MiB). karts/ and new-avatar/ have only shell.html and write only to dist/. I confirmed the out-of-date problem myself: rebuilding motion-lab in memory (write:false) gives 521,149 characters against 520,597 in the committed motion-lab/index.html. That page was last committed 2026-11-20, but motion-lab/src changed on 2026-11-22. CI rebuilds into dist/ before publishing, so the live site is current; the stale copies mislead only local previews and anyone reading the repo. The inspector's working-tree note is now out of date: `git status` is clean, and avatar-test/index.html and motion-lab/index.html have 16:52:53 timestamps, so they were restored. The claim about merge conflicts between the assistants had no evidence behind it.

8. **Old and unused code sits next to live code**
   - Id: ARCH-7
   - Kind: problem
   - Severity: medium
   - Detail: Several files are not used by any page but sit in the same folders as active code. Examples: the old racing prototype (9 files), an unused racing simulation file, Claude's old walking test, and the site's front page, which still runs an early prototype with an older avatar and its own movement code.
   - Evidence: esbuild reachability scan from all 20 page entries: unreachable include racing-core/{driver,ghosts,index,input,math,progress,session,track,vehicle}.js, racing-lab/src/simulation.js (no importers) → racing-lab/src/track-view.js, motion-lab/src/walker.js (no importers). src/main.ts uses createApprovedAvatar + src/player.ts; README.md D2 says the site root preserves earlier prototypes.
   - Why it matters: AI assistants read whole folders. Dead files make them slower, and they can lead an assistant to edit or copy the wrong version.
   - Suggestion: Move unused files into one clearly named 'archive' folder, or delete them, since git keeps the history either way. Warning: this removes things from view, so the owner should approve the list first. Keep checkpoints untouched.
   - Time saving: Less for each assistant to read and less chance of fixing the wrong file.
   - Verdict: confirmed
   - Verifier note: No page imports racing-core/{driver,ghosts,math,progress,session,track,vehicle}.js. racing-core/index.js is imported only by racing-core/tests/core.test.mjs and racing-lab/src/simulation.js, and nothing imports simulation.js. track-view.js is imported only by simulation.js and a test. Nothing imports motion-lab/src/walker.js. src/main.ts:2-4 describes an avatar that 'walks, runs and jumps' on a slab, which README.md:24 calls a preserved prototype. Caveat for the suggestion: the CI racing test imports racing-core/index.js, so removing the prototype also means editing that test. Also, archiving lab folders more broadly would break the avatar, because avatar/src imports from lab folders (see missed item).

9. **Many versions of the avatar and of movement code**
   - Id: ARCH-9
   - Kind: risk
   - Severity: medium
   - Detail: There are at least five pieces of character movement code and at least six ways to load an avatar (approved, assembled, official, light/game, joint, skeleton, plus the new avatar under construction). Each lab picked a different one. The motion-core and avatar folders also depend on each other in both directions.
   - Evidence: Movement: src/player.ts, motion-core/controller.js, movement/controller.js, motion-lab/src/walker.js, run-test/controller.js. Avatar loaders: createApprovedAvatar (avatar/src/approved-avatar.js:9), createAssembledAvatar (avatar-lab/src/avatar.js:45), loadOfficialAvatar (avatar/src/official-avatar.js:18), loadLightAvatar/loadGameAvatar (avatar/src/light-avatar.js:22), loadJointAvatar, createSkeletonAvatar, plus avatar-v2/. motion-core/skeleton/bones.js:34 imports avatar/src/joints/ankle-contract.js while avatar/src/joints/*-design.js import motion-core.
   - Why it matters: The game needs exactly one avatar and one movement system. Every extra version is a future decision, and possibly a bug, sitting in the codebase.
   - Suggestion: Write down in one line which avatar the game uses (today that is the Game copy, per HANDOFF item 7) and which movement code is official (motion-core). Treat everything else as reference until the new avatar is approved to replace it.
   - Time saving: Assistants stop spending time working out which avatar or controller is current.
   - Verdict: confirmed
   - Verifier note: All five movement files exist (src/player.ts, motion-core/controller.js, movement/controller.js, motion-lab/src/walker.js, run-test/controller.js). The loader exports are where the inspector said: createApprovedAvatar (approved-avatar.js:9), loadOfficialAvatar (official-avatar.js:18), loadLightAvatar/loadGameAvatar (light-avatar.js:22,30), loadJointAvatar (joint-assembly/bind.js:48), createSkeletonAvatar (skeleton-test/attach.js:25), createAssembledAvatar (avatar-lab/src/avatar.js:45), plus avatar-v2/. The two-way link holds: motion-core/skeleton/bones.js:34 imports avatar/src/joints/ankle-contract.js, and avatar/src/joints/shoulder-design.js:4 imports motion-core/skeleton/bones.js. HANDOFF items 8-26 show a new avatar rebuild in progress, so the Game avatar is itself likely to be replaced.

10. **The Test Lab controls each lab by clicking buttons inside an embedded page**
   - Id: ARCH-11
   - Kind: risk
   - Severity: medium
   - Detail: The main Test Lab page shows each lab inside an embedded window. It copies that lab's buttons and clicks the originals from outside. Each page also announces it is ready through its own global flag. This works as a testing tool, but it is fragile: renaming a button inside a lab can silently break the Test Lab.
   - Evidence: public/test-lab/main.js:68 creates an iframe per test; lines 53-71 copy native controls and call native.click() / dispatch events through frame.contentWindow; 18 distinct `window.xxxReady=` flags across runtime files; tests map in public/test-lab/main.js:4-17.
   - Why it matters: This is a good fit for a workshop, but it is not a base for a game. If game features keep being built to fit this setup, they will need reworking later.
   - Suggestion: Keep the Test Lab as the inspection tool, but do not build game features to fit it. Build them for the game shell, and let the Test Lab open the game shell as one more test.
   - Time saving: Avoids building features twice (once for the lab hookup, once for the game).
   - Verdict: confirmed
   - Verifier note: public/test-lab/main.js:68 creates an iframe for each test. Lines 35-59 copy each lab's own buttons and call native.click() or dispatch events through frame.contentWindow, and line 93 calls native.click(). I counted 18 distinct `window.xxxReady=` flags. The tests map is at lines 4-17 with 14 paths.

11. **Good habits: fixed timing, matching units, fast tests, mostly repeatable builds**
   - Id: ARCH-13
   - Kind: strength
   - Severity: medium
   - Detail: Good habits are real: matching units and forward direction across systems, fixed update steps, and fast unit tests. The racing code properly proves it behaves the same at different frame rates. The movement code's frame-rate test only prints numbers and can never fail, and with quickly changing stick input it shows up to about 87 cm of difference.
   - Evidence: motion-core/tests/compare.mjs:55 checks other frame rates; racing-core kart tests check 'frame-rate agreement' (racing-core/testing/README.md); 52/52 foundation tests passed in about 0.4 s; hand-lab/index.html and others were rewritten by the concurrent build with identical bytes (git clean for them); racing-core/README.md coordinate convention matches motion-core's sin/cos(facing).
   - Why it matters: These are the habits that make combining systems and adding online play possible later without painful surprises.
   - Suggestion: Keep these as rules for the game shell: fixed update speed, metres, the same forward direction, and fast automatic checks for every new module.
   - Time saving: Fewer 'works on my laptop, broken on the phone' problems.
   - Verdict: partly_true
   - Verifier note: Units and direction match: the kart uses '+Z forward, +Y up, yaw positive towards +X' (kart/index.ts:58), and motion-core uses atan2(dx,dz). The kart does have real frame-rate agreement checks (kart/README.md:28, with input sampled once per physics tick). motion-core's check (compare.mjs:55-57) only prints the spread, with no assertion. With the old reference repo missing, the test always exits 0 ('comparison skipped'), and its printed spread reaches 86.9 cm for quickly changing input. hand-lab/index.html has a 16:50:18 timestamp and git shows it clean, which supports the identical-rebuild claim. The '52/52 foundation tests' figure I did not rerun, because those tests write tracked result files.

12. **All physics is hand-written; ragdoll and sports features will probably need a physics library**
   - Id: ARCH-14
   - Kind: risk
   - Severity: medium
   - Detail: Every bit of physics (kart, collisions, island ground, walking) is written by hand. The project's own notes say that is a good choice for core mechanics like the kart. The planned features list includes ragdoll hits, throws and messy objects, though, and the same notes recommend a ready-made engine (Rapier) for that kind of physics.
   - Evidence: package.json dependencies: three, cdt2d only; no rapier/cannon/ammo imports (grep). docs/game-dev/05-physics.md:21 recommends Rapier for many bodies; :27 hand-written better for the core mechanic. docs/FEATURES.md:87, 94, 327, 335 mention ragdolling.
   - Why it matters: Hand-writing ragdoll physics would take a very long time. Choosing an engine late could mean rebuilding how characters and objects collide.
   - Suggestion: Decide early: keep the hand-written kart and walking, and plan to add Rapier only for ragdoll and loose objects. Test it in one small lab before it touches the game shell.
   - Time saving: Avoids weeks of hand-writing ragdoll physics.
   - Verdict: confirmed
   - Verifier note: package.json dependencies are three and cdt2d only, and there are no rapier, cannon or ammo imports. docs/game-dev/05-physics.md:21 recommends Rapier for many bodies, and line 27 says hand-written physics is better for the core mechanic (a kart). docs/FEATURES.md lines 87, 94, 327 and 335 mention ragdolling. HANDOFF item 5 makes the rigid ragdoll avatar central to the owner's goal.

13. **Builds and tests are slow and change tracked files**
   - Id: ARCH-15
   - Kind: problem
   - Severity: medium
   - Detail: Builds are slow because four page builds also run tests and prepare assets; the elbow and wrist tests alone take about 50 seconds. About 34 test-result files are saved in git, and several tests (some run during every build) rewrite them, so routine work keeps showing changed files.
   - Evidence: dist/ timestamps of the concurrent build: 16:50:17 → 16:51:54 (about 97 s); wrist-lab about 35 s, elbow-lab about 45 s (wrist-lab/build.mjs, elbow-lab/build.mjs run node --test and bake studies). Tests writing tracked files: racing-core/tests/core.test.mjs:55 writes TEST-RESULTS.json with a timestamp; racing-lab/tests/chase-camera.test.mjs:52, fpv.test.mjs:14, racing-core/kart/check.test.mjs:299,305 write result files; 19 tracked *CHECK-RESULTS/TEST-RESULTS files.
   - Why it matters: Slow builds and noisy changes slow down every work cycle for both assistants and make it harder to see what actually changed.
   - Suggestion: Run tests separately from building pages, save prepared assets once instead of on every build, and write test results to an ignored folder (the browser checks already use .test-results/).
   - Time saving: Probably close to a minute saved per build, and cleaner change lists to review.
   - Verdict: partly_true
   - Verifier note: elbow-lab/build.mjs and wrist-lab/build.mjs both run node --test before baking, and foot-lab and racing-lab builds also run tests. I timed the build-time tests alone: elbow 30.8 s, wrist 19.9 s, both passing. The 97 s full-build figure can no longer be checked, because dist/ has been deleted. racing-core/tests/core.test.mjs:55 writes TEST-RESULTS.json with generatedAt, and chase-camera.test.mjs:52 and fpv.test.mjs:14 write tracked JSON. racing-lab/build.mjs runs those tests, so every build rewrites them. The count is understated: about 34 tracked result files (*CHECK-RESULTS*, *TEST-RESULTS*, *-CHECKS.json/md, LOADING-RESULTS), not 19.

14. **Four different control systems with different keys**
   - Id: ARCH-8
   - Kind: problem
   - Severity: low
   - Detail: Controls are written four separate times. Most current pages already use the same keys (E S D F to move, J L I K to look); only the old preserved movement page uses W A S D. Shift is the real conflict: on one page it makes you run, and on the Motion Core test it makes you walk. One shared control system would still remove the duplicate code.
   - Evidence: src/input.ts and motion-lab/src/input.js use KeyE/KeyS/KeyD/KeyF; movement/input.js uses KeyW/KeyA/KeyS/KeyD with Shift = run (movement/index.html hint); motion-core-test/main.js:33-46 stubs out MovementInput's keyboard and adds its own listener where 'Shift walks'. racing-core/input.js adapts motion-lab's snapshot (good).
   - Why it matters: Players and the owner get confused when testing, and every new feature has to choose which control system to use. A real game needs one set of controls everywhere.
   - Suggestion: Make motion-lab/src/input.js, which is already called 'universal' and is used by racing, the only control system. Let the owner pick one key layout. Retire the other three as pages move to the game shell.
   - Time saving: One place to fix touch, keyboard and gamepad bugs instead of four.
   - Verdict: partly_true
   - Verifier note: There are four keyboard implementations: src/input.ts, motion-lab/src/input.js, movement/input.js, and the private listener in motion-core-test/main.js:33-46. Three of the four already agree on E S D F plus J L I K. Only movement/input.js, the old preserved 'Walking & running' prototype, uses W A S D. The Shift difference is real: in movement/input.js:23 Shift means full speed (run), while motion-core-test/main.js:44 scales speed to 0.45 when Shift is held (walk).

15. **Type checking covers only a small part of the code**
   - Id: ARCH-12
   - Kind: problem
   - Severity: low
   - Detail: The project uses TypeScript, which can catch many mistakes before anything runs, but the main check only looks at the src folder. Most of the code is plain JavaScript that nothing checks. Racing has its own strict checks and passes them.
   - Evidence: tsconfig.json `"include": ["src"]` (23 TS files); 157 .js files with 0 `@ts-check`; src/main.ts:24 `// @ts-ignore` to import the avatar; strict tsc on racing-core + avatar TS by hand: 0 errors.
   - Why it matters: Simple mistakes, such as a misspelled name or a wrong kind of value, show up only when the owner opens the page on a phone, which costs testing rounds.
   - Suggestion: Write the new game shell in TypeScript and add its folder to the check. Over time, turn on checking for the plain JavaScript folders the game depends on (motion-core, avatar loaders, input).
   - Time saving: Catches a class of bugs instantly instead of during the owner's manual testing.
   - Verdict: confirmed
   - Verifier note: tsconfig.json has "include": ["src"] (23 TS files under src). Outside checkpoints the repo tracks 47 .ts, 157 .js and 147 .mjs files, and none uses @ts-check. src/main.ts:24 is the `// @ts-ignore` line before the avatar import. Root `tsc --noEmit` and the four racing strict configs all exited 0 when I ran them.

16. **Shared files are written very densely**
   - Id: ARCH-16
   - Kind: problem
   - Severity: low
   - Detail: Some of the most important shared files pack many instructions onto each line, with some lines over 1,000 characters. That makes them hard for anyone, including a reviewing assistant, to read and check.
   - Evidence: Average characters per line: motion-lab/src/page.js 161 (8,377 bytes in 52 lines), public/test-lab/main.js 114, motion-lab/src/input.js 115, racing-lab/src/simulation.js 275 (longest line 1,361). TS files average 46 chars/line; .js files 72.
   - Why it matters: Code review between Claude and Codex is a key safety net, and dense code makes mistakes easier to miss.
   - Suggestion: Add an automatic code formatter (for example Prettier) for new game shell code, and format shared files when they are next touched.
   - Time saving: Faster, more reliable reviews.
   - Verdict: confirmed
   - Verifier note: Measured average characters per line: motion-lab/src/page.js 161 (52 lines, longest 923), public/test-lab/main.js 114, motion-lab/src/input.js 115, racing-lab/src/simulation.js 275 (longest 1,361). There is no Prettier or ESLint config in the repo.

### Missed by inspector found by skeptic

1. **The island is a tiny 6-metre display piece, too small to play or drive on**
   - Kind: risk
   - Severity: high
   - Detail: The island everyone treats as 'the world' is only about 6 metres across. A kart drives off it in about half a second. A full-height avatar standing on it would have his head inside the tree's leaves. It is a good test of blocks and collision, but it is not a place where gameplay can happen. The planned big world of linked islands has no code yet.
   - Evidence: src/world/island/layout.ts:7 `SIZE = 14` blocks of 0.43 m (ISLAND_WIDTH = SIZE*BLOCK, island/index.ts:14), about 6.0 m. Headless run in scratchpad (createKartController on islandSolid().groundBelow, full throttle from the centre): grounded at z=1.37 m, not grounded by z=3.05 m, y=-2.46 m after 1 s. tests/island/solid.mjs output row 14: 'a 1.89 m avatar on the main grass reaches the leaves ... lowest leaves about 1.94 m up; his head would be at 2.32 m'. docs/FEATURES.md:120-125 plans islands linked by bridges and roads that load and unload, and no streaming code exists.
   - Suggestion: Use a bigger flat test ground for the first 'walk and drive' sandbox. The neighborhood streets the kart already drives on (about 118 m square) are ready now. Keep the island as the block and collision showcase, and decide the real world size before building more island art.

2. **Core avatar code depends on the lab folders**
   - Kind: risk
   - Severity: medium
   - Detail: The avatar folder, which the game would rely on, borrows code from lab folders such as the wrist, foot, elbow and avatar labs. Even the phone-ready Game avatar loader pulls in a file from the avatar lab. So the labs cannot be archived or deleted, and cleaning up 'old labs' would quietly break the avatar.
   - Evidence: 18 imports from avatar/src into lab folders, e.g. avatar/src/joints/shoulder-design.js:5-6 (wrist-lab/src/mold-socket.js, foot-lab/src/refine-mold-surface.js), elbow-design.js:2 (elbow-lab/src/study.js), hip-design.js:2 (avatar-lab/src/avatar.js), joint-assembly/collect.js:8 (skeleton-test/attach.js), joint-assembly/bind.js:3 (avatar-lab/src/chest-bend.js). The esbuild metafile for a loadGameAvatar bundle includes avatar-lab/src/chest-bend.js.
   - Suggestion: Before archiving any lab, move the shared pieces the avatar needs into the avatar or a shared core folder, so labs become truly throwaway. Make this part of the game-shell cleanup chunk.

3. **Claude-area tests (movement rules, skeleton, island ground) never run before publishing**
   - Kind: problem
   - Severity: medium
   - Detail: The automatic publish checks run the racing tests and the browser page checks, but none of the movement, skeleton, pose, balance, reach, grip or island ground tests. All of these pass when run by hand, so a break in Claude's area could be published without anything catching it. This is the reverse of what the inspector reported about racing.
   - Evidence: deploy.yml runs test:lab-foundations, test:official-avatar, test:racing-core, build and test:lab-foundations-browser only. package.json:21-27 defines test:motion-core, test:skeleton, test:pose, test:balance, test:reach, test:grip and test:island, and none of them appears in deploy.yml or in any build.mjs. I ran motion-core/tests/{skeleton,pose,balance,reach,hands}.mjs and tests/island/solid.mjs: all PASS, together in under 10 s. motion-core/tests/compare.mjs always exits 0 when ../3D-WORLD-3 is missing.
   - Suggestion: Add the fast movement, skeleton and island tests to the publish checks; together they take about 10 seconds. Turn the frame-rate spread in the movement comparison test into a real pass/fail check.

4. **The kart cannot hit blocks or walls in a block world yet; it waits on Claude**
   - Kind: risk
   - Severity: medium
   - Detail: The kart only asks the world 'how high is the ground here?'. It cannot bump into walls, trees or blocks. The racing notes say block collision for the kart is waiting on Claude's block collision work. Neither assistant's plan schedules this, and it sits between the two owners' areas.
   - Evidence: racing-core/kart/README.md:48: "Claude's block collision engine and its integration are still pending; do not treat the rail adapter as a completed block system." SurfaceWorld (kart/index.ts:66-69) has only heightAt and surfaceAt. src/world/collision.ts moveBox handles boxes for characters only.
   - Suggestion: Name this as an explicit shared task when the game shell is planned. Claude provides a small 'what does the kart hit here?' answer from the block world, and Codex wires it into the kart's existing collision hook (resolveMotion).

5. **Older jump, gravity and follow-camera code already exists and type-checks**
   - Kind: opportunity
   - Severity: medium
   - Detail: The site's front page has an older character controller with walking, running, jumping, gravity, fall-off and a follow camera, in checked TypeScript. The approved movement rules lack exactly the jumping and height parts. Those pieces can be copied over instead of written from scratch.
   - Evidence: src/player.ts:1-23 (TUNING jumpHeight 1.1, timeToPeak 0.36, coyoteTime 0.1, jumpBuffer 0.12, fallGravityScale 1.8, GRAVITY and JUMP_VELOCITY derived), and step(dt, wishX, wishZ, jumpPressed, jumpHeld) at line 65. src/main.ts:1-4 describes the follow camera. It is covered by the root tsc check, which exits 0. motion-core/controller.js:1 says 'no jumps yet'.
   - Suggestion: When adding height and jumping to the movement rules, port the jump and gravity math from src/player.ts and then connect it to the island's moveBox. This saves building and tuning a jump from zero.

6. **Publishing is already gated on the approved racing checks and real-browser checks**
   - Kind: strength
   - Severity: low
   - Detail: Before anything goes live, the publish step runs the full approved racing test set and then opens the real pages in two browser engines. That is a solid safety net for the racing side and for the shared lab pages.
   - Evidence: racing-core/tests/core.test.mjs top-of-file imports, including the comment '// Run the fresh track checks in deployment CI too' followed by track, kart, contacts and testing check files. deploy.yml:33-37 runs the build, installs chromium and webkit, then runs test:lab-foundations-browser and uploads the results.
   - Suggestion: Extend the same gate to the movement and island tests (see the item above) so both assistants' areas are equally protected.

### Dropped as wrong

1. **Automated checks test the old racing prototype, not the approved one**
   - Id: ARCH-6
   - Verdict: refuted
   - Reason: racing-core/tests/core.test.mjs does import the old prototype (`../index.js`, line 20), but it also imports the approved rebuild's checks at the top of the file: '../kart/steering-check', 'upgrade-check', 'grip-check', 'profile-check', 'tuning', 'course-check', then the comment '// Run the fresh track checks in deployment CI too' followed by '../track/check.test.mjs', '../kart/check.test.mjs', '../contacts/check.test.mjs', '../testing/check.test.mjs', 'prototypes', 'neighborhood', 'gt3-v3', plus the f1-2026 and gt3 profile/systems tests (lines 15-18). So `npm run test:racing-core` in deploy.yml:32 already runs the approved track, kart, contacts and driving checks. The inspector looked only at the line that imports index.js.

## Tests, build and code health
**Area summary:** The build and the tests are in good shape where it counts. The full build passes in about 2 minutes, the type check is clean, and all 25 tests that run without a browser pass: about 1,160 separate checks and zero failures. The automatic publishing check on GitHub is healthy too: 142 of the last 200 runs passed, only 3 failed, and the other 55 were cancelled on purpose because a newer change came in. The weak spot is coverage. Only the racing work and the shared lab basics are checked before the site goes live. The avatar work (the new avatar, the skeleton and the motion rules), which is where most current changes happen, is never checked automatically. Some of those unchecked tests are already quietly broken. One driving test in the browser is also fragile: it caused all 3 recent publishing failures and fails every time on this machine.

### Key facts
1. npm run build: PASS in 121 seconds (tsc --noEmit, vite build, then 15 lab builds). About 66 of those seconds are tests that run inside the foot-lab, wrist-lab, elbow-lab and racing-lab builds: 22 + 10 + 3 + 47 tests, all pass (build log '# duration_ms' 13100, 20738, 31094, 1382).
2. npx tsc --noEmit: PASS, 0 errors in 1 second. It only checks the 23 files in src/ (tsconfig.json has "include": ["src"]). A manual strict check of racing-core/**/*.ts and avatar/**/*.ts (22 files) using a scratch tsconfig also gave 0 errors.
3. Node-only test scripts run, all rc=0: lab-foundations 61/61, official-avatar 8/8, racing-core 285/285 (95 s), racing-kart 50/50, racing-contacts 26/26, racing-drive 37/37, karts 55/55, inspection-zoom 10/10, ankle 11/11, joint-assembly 12/12 (186 s, the slowest), study-assets 2/2. Plain-table scripts with PASS-row counts: new-avatar 547, balance 39, skeleton 28, island 26, pose 18, world 18, reach 13, chest 10, hands 9, grip 6, torso 6, attach 5, hand-tilt 5. motion-core printed 0 checks ('Old reference repo not found: comparison skipped.'). Total time run one after another: about 390 seconds.
4. Unique checks after removing duplicates: about 434 node:test tests plus about 730 table checks, so roughly 1,160 checks, all passing.
5. Browser test test:lab-foundations-browser: FAIL at suite 4 of 11 ('Driving controls, FPV and device layouts'), after 257 s. Error: AssertionError at racing-lab/tests/driving-browser.mjs:117:120: assert(await p.evaluate(()=>drivingLab.test.controller.state.speed>8)). Running that suite alone again failed the same way. Suites 1 to 3 passed.
6. The remaining Chromium suites from the same script, run one by one, all PASS: gt3-driving 33 s, neighborhood-driving 13 s, steering-release 28 s, chase-camera 7 s, app 6 s, home-screen (chromium) 7 s. The WebKit suite was not run because WebKit is not installed here.
7. Environment limit, not a project bug: Playwright 1.65.1 expects chromium build 1255 (node_modules/playwright-core/browsers.json), but this machine has build 1243 at /opt/pw-browsers/chromium (Chrome for Testing 153). The default launch failed. It worked with TEST_CHROMIUM_PATH=/opt/pw-browsers/chromium, an override the project already supports in scripts/test-browser.mjs.
8. CI (.github/workflows/deploy.yml) runs, in order: test:lab-foundations, test:official-avatar, test:racing-core, build, playwright install chromium webkit, test:lab-foundations-browser, then publishes dist/ to gh-pages. It uses Node 24. This machine has Node 22. There is no .nvmrc file and no 'engines' field in package.json.
9. GitHub Actions (gh run list, deploy.yml, last 200 runs from 2026-11-19 to 2026-11-23): 142 success, 55 cancelled, 3 failure. All 3 failures were 'FAIL: Driving controls, FPV and device layouts', with a TimeoutError at driving-browser.mjs:123 (runs 45117726873 and 45071093446) and at :241 (run 45058267889). Typical run length is 7 to 11 minutes.
10. package.json has 43 test:* scripts and 17 build:* scripts. CI runs 4 of the test scripts directly (plus the tests embedded in the build). No test script points to a missing top-level file.
11. Not run by CI: test:new-avatar (547 checks), the motion-core scripts skeleton/pose/balance/reach/grip (104 checks), test:karts (55), test:joint-assembly (12), test:world (18), test:island (26), test:torso/chest/hands/hand-tilt/attach (35), and about 15 browser scripts.
12. Over the last 80 commits, files were touched in these folders: docs 86, avatar-v2 64, racing-core 52, racing-lab 40, new-avatar 29, kart-parts 18.
13. Tracked files changed by this audit's runs, all restored with git restore: avatar-test/index.html and motion-lab/index.html (by npm run build); racing-core/TEST-RESULTS.json, racing-core/kart/COURSE-CHECKS.json, STEERING-CHECKS.json, STEERING-CHECKS.md, TUNING-CHECKS.json and TUNING-CHECKS.md (by the racing tests); racing-lab/CHASE-CAMERA-BROWSER-CHECKS.json, HOME-SCREEN-CHROMIUM-CHECKS.json and STEERING-RELEASE-BROWSER-CHECKS.json (by the browser suites). Untracked output this audit created and then removed: dist/ and .test-results/. Final git status --short is empty, the same as at the start.
14. Probes of other browser scripts (with chromium env vars set): test:wrist-lab PASS (117 s), test:elbow-lab PASS (50 s), test:karts-browser PASS (111 s), test:new-avatar-page PASS (30 s), test:study-startup PASS (19 s). test:hand-lab FAIL ('Approved file changed: README.md'). test:avatar-lab FAIL ('Saved avatar file changed: README.md'). test:movement FAIL ('Saved avatar source changed: avatar-lab/src/avatar.js'). test:avatar-startup and test:official-avatar-browser cannot start ('executable doesn't exist at /usr/bin/chromium'). test:foot-lab is inconclusive: my 240 s timeout killed it.

### Findings

1. **The avatar work, the most active area, is never checked before the site goes live**
   - Id: TEST-1
   - Kind: risk
   - Severity: medium
   - Detail: The approved avatar is already checked before publishing (8 tests plus fingerprint checks in the build), and so are the foot, wrist and elbow joint tests. What goes live unchecked is the new avatar being built in avatar-v2 (547 checks), the skeleton and pose rules (104), the karts (55) and the world and island (44). Adding these fast checks to the publish step would cost about 47 seconds.
   - Evidence: deploy.yml runs only test:lab-foundations, test:official-avatar, test:racing-core, build and test:lab-foundations-browser. In the last 80 commits, avatar-v2 had 64 file changes and new-avatar had 29, versus racing-core 52. test:new-avatar (547 PASS rows), test:skeleton (28), test:pose (18), test:balance (39), test:reach (13), test:grip (6) and test:karts (55 tests) all passed locally, but none of them is in CI.
   - Why it matters: The owner judges progress by opening the live link. If an assistant breaks the avatar, the owner finds out by looking, maybe days later, and then has to pay for a search for what broke. TEST-3 shows this has already happened with older avatar tests.
   - Suggestion: Add the fast avatar checks to the publish check: test:new-avatar, test:skeleton, test:pose, test:balance, test:reach, test:grip, test:karts, test:world and test:island. Together they take under a minute. Leave the slow joint-assembly check (about 3 minutes) for a nightly or manual run.
   - Time saving: Breakages get caught within minutes of the change, by the assistant that made them, instead of by the owner later. That avoids whole sessions spent hunting for what broke.
   - Verdict: partly_true
   - Verifier note: deploy.yml confirms CI runs only test:lab-foundations, test:official-avatar, test:racing-core, build and test:lab-foundations-browser. I re-ran the unchecked scripts in a scratch copy and all pass: new-avatar 547 rows in 36 s, skeleton/pose/balance/reach/grip 4/1/2/1/0 s, karts 55/55 in 1 s, world 0 s, island 2 s. Together that is about 47 s, so 'under a minute' holds. But the title and summary overstate the gap. CI does check the official approved avatar: test:official-avatar has 8 tests on the live model and its smaller copies, and scripts/build-official-avatar-page.mjs lines 11-26 compare fingerprints of the official, light and game copies during the build. The build also runs 35 joint tests for the foot, wrist and elbow labs (22+10+3). 'Where most current changes happen' is true for avatar-v2 (64 file changes) and new-avatar (29), but motion-core had 0 file changes in the last 80 commits. The claim that 'TEST-3 shows this has already happened' is wrong: those are guard tests that tripped on intended edits, not avatar bugs that went live unnoticed.

2. **Several older tests are already broken, and nobody noticed because nothing runs them**
   - Id: TEST-3
   - Kind: problem
   - Severity: medium
   - Detail: Three old browser tests stop at their first step because they demand that live files never change. The hand-lab and avatar-lab tests trip on an edited avatar README, and the movement test trips on 7 later-improved avatar, foot and hand files. Two official-avatar browser tests only start on a machine with Chromium at one fixed Linux path (/usr/bin/chromium). That is missing here, on the publishing computer's default setup, and on Mac or Windows. Whether hand-lab and avatar-lab are retired is the owner's call: their pages are still published.
   - Evidence: test:movement: 'Saved avatar source changed: avatar-lab/src/avatar.js' (movement/tests/run.mjs:14 compares against checkpoints/avatar-2/CHECKPOINT.json; avatar.js last changed in d787015 on 2026-11-18). test:hand-lab: 'Approved file changed: README.md' (hand-lab/tests/browser.mjs:12; avatar/README.md changed in cd6914e on 2026-11-19). test:avatar-lab: 'Saved avatar file changed: README.md'. test:avatar-startup and test:official-avatar-browser: 'executable doesn't exist at /usr/bin/chromium'. In total, 27 files hardcode /usr/bin/chromium, only 11 use the shared scripts/test-browser.mjs, and three different setting names are in use (TEST_CHROMIUM_PATH, CHROMIUM_PATH, CHROMIUM).
   - Why it matters: A test that always fails is worse than no test. It looks like protection but gives none, and an assistant may waste time 'fixing' the game when only the test is out of date.
   - Suggestion: Sort these into two groups. Tests that guard a frozen checkpoint should check only the frozen checkpoint copy, never live files or README notes. Tests for retired pages (movement, hand-lab, avatar-lab) should be marked retired and removed from the list. Make every browser test use the one shared browser launcher.
   - Time saving: Assistants stop tripping over false failures, and the list of tests becomes a true picture of what works.
   - Verdict: partly_true
   - Verifier note: I checked the hashes without running anything. avatar/README.md no longer matches avatar/APPROVED.json, so hand-lab/tests/browser.mjs:12 and avatar-lab/tests/browser.mjs:66 fail at once. movement/tests/run.mjs:14 compares live files to checkpoints/avatar-2/CHECKPOINT.json, and 7 files differ, not just avatar.js: avatar-lab/src/avatar.js, avatar-lab/src/main.js, foot-lab/src/{ankle-socket,calf,foot-rig,main}.js and hand-lab/src/hand-rig.js. tests/avatar/startup.mjs:19 and official-browser.mjs:24 hardcode executablePath '/usr/bin/chromium' with no override, and that path does not exist here. Count check: 30 tracked files mention /usr/bin/chromium; removing the shared launcher and 2 .md docs leaves 27. 10 files, not 11, import scripts/test-browser.mjs. Setting names in use are CHROMIUM_PATH (19), CHROMIUM (1) and TEST_CHROMIUM_PATH (1). Also, 'cannot run anywhere except one specific computer' is too strong: they would run on any Linux machine that has Chromium at /usr/bin/chromium. And hand-lab and avatar-lab are still built and published by npm run build, so calling them 'retired' is an assumption, not a fact in the repo.

3. **Building and testing quietly rewrite files that are saved in the project**
   - Id: TEST-4
   - Kind: problem
   - Severity: medium
   - Detail: Running the build rewrites two saved page files, and running the tests rewrites nine saved report files. So after any check, the project looks changed even though nobody changed anything on purpose. One of the saved page copies is already out of date: the saved avatar-test page is missing the 'Game' button added on 20 November. The live site is fine, because publishing always builds fresh copies, but the saved copy misleads anyone who reads it.
   - Evidence: After npm run build, git status showed ' M avatar-test/index.html' and ' M motion-lab/index.html' (motion-lab/build.mjs:11 writes to both 'motion-lab/index.html' and 'dist/motion-lab/index.html'). The racing tests rewrote racing-core/TEST-RESULTS.json and 5 racing-core/kart/*-CHECKS files (racing-core/tests/core.test.mjs:55, racing-core/kart/course-check.test.mjs:16). The browser suites rewrote 3 racing-lab/*-CHECKS.json files. 12 generated pages are tracked (about 9.9 MB in total; racing-lab/index.html alone is 2.9 MB), with 280 versions in history (272 MB raw, 19 MB compressed).
   - Why it matters: Assistants can accidentally save these noise changes, which makes the project history harder to read and the repository bigger. It also hides the real changes in a session among fake ones.
   - Suggestion: Have builds write only to the dist folder, and have tests write reports only to the ignored .test-results folder. Then stop saving the generated page copies in the project. Keep only the deliberate, frozen checkpoint copies.
   - Time saving: Every 'what changed?' review becomes short and honest, with no fake changes to sort through.
   - Verdict: confirmed
   - Verifier note: In a scratch copy, npm run build (rc=0, 131 s) left avatar-test/index.html and motion-lab/index.html modified, 338 changed lines each. The node tests rewrote 6 racing-core files: TEST-RESULTS.json, COURSE-CHECKS.json, STEERING-CHECKS.json/.md and TUNING-CHECKS.json/.md. TEST-RESULTS.json changes on every run because core.test.mjs:55 stamps generatedAt with the current time. Code confirms motion-lab/build.mjs:11 and build-official-avatar-page.mjs:47 write both the tracked copy and the dist copy. The tracked avatar-test/index.html has no 'Game' text, while skeleton-test/shell.html has it: added in d5a4a19 on 20 Nov 20:01, after the copy was last saved in d1e9c9b on 20 Nov 15:44. motion-lab/index.html is also stale: last saved 20 Nov, while its sources changed through 22 Nov. The 12 tracked generated pages total 10.19 MB and have 280 versions in history, both matching. The newer builds (new-avatar/build.mjs, karts/build.mjs) already write only to dist, so the fix pattern exists in the repo.

4. **There is no one-command 'check everything quickly' option**
   - Id: TEST-7
   - Kind: opportunity
   - Severity: medium
   - Detail: There is no single command. The README lists the commands the publish check uses, but they have to be run one by one, and they skip the avatar checks. One quick-check command and one full-check command would still save time.
   - Evidence: package.json has 43 test:* scripts. The 25 node-only scripts took about 390 s run one after another: test:joint-assembly 186 s, test:racing-core 95 s, test:new-avatar 34 s, and everything else under 15 s each.
   - Why it matters: The owner, or a new assistant session, has no simple way to ask 'is everything still OK?' That leads to skipped checks or to wasted usage working out which commands to run.
   - Suggestion: Add two commands: a quick check (all the fast tests, under a minute) for after every change, and a full check (adding the slow and browser tests) for before a milestone. List them first in the README.
   - Time saving: A single command replaces guessing among 43, so each session spends far less time and usage on testing decisions.
   - Verdict: partly_true
   - Verifier note: There is no 'test' or 'check' script in package.json, and it has 43 test:* scripts. My run of the 25 node-only scripts took 399 s: joint-assembly 188 s (47%), racing-core 100 s, new-avatar 36 s, everything else 14 s or less. But README.md section C (lines 17-18) and docs/HANDOFF.md:176-177 do give an ordered recipe for the publish-gate checks. So there is written guidance. It is just not one command, and it leaves out the avatar checks.

5. **One fragile driving test causes every recent publishing failure**
   - Id: TEST-2
   - Kind: problem
   - Severity: low
   - Detail: All 3 recent publish failures came from this one driving test group, but Codex adjusted its reset step right after the last failure, and the 6 completed publish runs since then all passed. On this cloud machine the group still fails at a different step. That may be caused by the machine's older browser and slow software graphics rather than by the game. Reporting every failing group at the end, while still blocking the publish, is still a reasonable small improvement.
   - Evidence: Local runs: AssertionError at racing-lab/tests/driving-browser.mjs:117:120 'assert(await p.evaluate(()=>drivingLab.test.controller.state.speed>8))', reproduced twice. CI failures 45117726873 and 45071093446 (TimeoutError at driving-browser.mjs:123) and 45058267889 (TimeoutError at :241) all ended with 'FAIL: Driving controls, FPV and device layouts'. scripts/check-lab-foundations-browser.mjs calls process.exit(1) on the first failing suite. The other 6 Chromium suites passed when run one by one.
   - Why it matters: A false alarm means a re-run of 7 to 11 minutes, and it can hold back an unrelated avatar change from going live. It also teaches everyone to ignore red results, and that is how real bugs slip through.
   - Suggestion: Ask Codex (racing is Codex's area) to make this test wait for the result rather than assume a fixed speed after a camera switch, or to split the camera-switch part into its own smaller test. Also let the runner finish all the groups and report every failure at the end, not just the first one.
   - Time saving: Fewer false 'publish failed' alarms and re-runs, and when something really fails, one run shows every problem instead of one per run.
   - Verdict: partly_true
   - Verifier note: gh run list confirms 142 success, 55 cancelled and 3 failure in the last 200 runs. gh run view --log-failed shows all 3 failures are 'FAIL: Driving controls, FPV and device layouts'. Two are TimeoutErrors in reset() (driving-browser.mjs:28) called from line 123, and one is a TimeoutError at line 241, in the file versions of that time. However, Codex committed da2fb60 'Keep the browser test controller idle during reset' 9 minutes after the last failure (19f0dce). Every completed CI run since then has succeeded: da2fb60, 3589b12, 049080c, ab24b20, cb77276 and 271405b, six in a row. I reproduced the local failure once (AssertionError at 117:120, the speed>8 check after switching to FPV, 120 s). That is a different step from the CI failures, and this machine runs an older Chromium (build 1243, Chrome 153) than the pinned one (1255) with software graphics. So the local failure may come from the environment rather than a flaw in the test. Stopping at the first failing group is deliberate (the comment in scripts/check-lab-foundations-browser.mjs says a failing suite 'must stop the publish step').

6. **The main walking/running controller test always passes, because it checks nothing**
   - Id: TEST-5
   - Kind: problem
   - Severity: low
   - Detail: The test named for the motion core only prints measurements, like how fast the character reaches running speed. It never compares them to a limit. Its real comparison needs the old 3D-WORLD-3 project sitting next to this one, which is not the case, so it skips that part and reports success. The rules mark 3D-WORLD-3 as reference only. Some movement is still checked indirectly by the Motion Lab browser test.
   - Evidence: motion-core/tests/compare.mjs:12: ref=resolve(here,'../../../3D-WORLD-3'). Output: 'Old reference repo not found: comparison skipped.' Exit code 0, with 0 PASS rows. Line 46 starts with pass=true, and pass only becomes false inside the old-repo comparison (line 58).
   - Why it matters: Avatar movement is Claude's main area. A test that can't fail gives false confidence, and the 'feel' numbers could drift without anyone noticing.
   - Suggestion: Turn the printed numbers into limits that the owner has approved, for example 'reaches running speed in under 0.3 seconds'. Then the test fails if the movement feel changes by accident. Drop the dependency on the old project.
   - Time saving: Changes to the movement feel would be caught automatically instead of found by playing.
   - Verdict: confirmed
   - Verifier note: motion-core/tests/compare.mjs:12 points at '../../../3D-WORLD-3'. Line 46 sets pass=true, and line 58 can only set it false when the old repo is present. Line 83 exits with 0. My run printed the feel tables and 'Old reference repo not found: comparison skipped.' with rc=0 and no pass or fail rows. motion-lab/src/page.js imports the controller, and the Motion Lab browser suite in CI exercises it indirectly.

7. **Some tests run two or three times for no benefit**
   - Id: TEST-6
   - Kind: opportunity
   - Severity: low
   - Detail: Some tests are repeated, but in the publish check the repeat costs about 1 to 2 seconds, not a minute. The slow tests inside the build (about 66 s) are not repeated anywhere. Moving them out of the build would only make the steps clearer, not faster.
   - Evidence: racing-core/tests/core.test.mjs lines 1-18 import kart/check.test.mjs, contacts/check.test.mjs and testing/*.test.mjs, which are the same files that test:racing-kart (50), test:racing-contacts (26) and test:racing-drive (37) run. racing-lab/build.mjs runs app, chase-camera, driving-controls, driving-pedals, fpv and page-activity tests, which are also in test:lab-foundations. The tests embedded in the build took about 66 s of the 121 s build.
   - Why it matters: Every publish and every local check takes longer than it needs to, and that adds up over hundreds of commits.
   - Suggestion: Keep the tests in one place: run them in the test step, and keep the build step only for building. Write a short note saying the three small racing scripts are for quick focused checks only.
   - Time saving: About a minute saved on every build, and less waiting on each publish.
   - Verdict: partly_true
   - Verifier note: The duplications are real. core.test.mjs lines 9-14 import kart/check, contacts/check and the same 4 testing/*.test.mjs files that test:racing-kart, test:racing-contacts and test:racing-drive run. racing-lab/build.mjs:7 runs 8 test files, and 6 of them are also in test:lab-foundations. But the time saving is overstated. In CI the only repeated work is those racing-lab files, and the whole racing-lab build test step took 1.3 s for 47 tests. The ~66 s of tests inside the build (foot-lab 13.0 s, wrist-lab 20.0 s, elbow-lab 32.5 s in my run) are run nowhere else in CI. Moving them to the test step would save nothing unless they were dropped. The three small racing scripts are not run in CI at all.

8. **Good tests sit unused because no command runs them**
   - Id: TEST-8
   - Kind: opportunity
   - Severity: low
   - Detail: The four joint-socket tests pass (36 checks) and have no command in package.json. They are written up as manual steps in the joint draft notes, and they take about 2.5 minutes together, so they belong in a full check, not a quick one. Some of the other loose test files are manual steps named in READMEs, and two are not referenced anywhere.
   - Evidence: Not referenced by package.json or any build script: tests/avatar/elbow-sockets.mjs (8 pass), hip-sockets.mjs (8 pass), knee-sockets.mjs (8 pass), shoulder-sockets.mjs (12 pass). Also unconnected: test-lab/test.mjs, test-lab/zoom-browser.mjs, run-test/test.mjs, walk-test/test.mjs, racing-lab/tests/tuning-browser.mjs, avatar-v2/check-elbow.mjs.
   - Why it matters: Working protection is going to waste, and the unconnected files confuse anyone trying to understand what is covered.
   - Suggestion: Connect the four socket tests to a command (and to the quick check if they stay fast enough), and either delete the other unconnected files or move them to a clearly named 'retired' place.
   - Time saving: Gains real protection for free and shrinks the clutter assistants have to read.
   - Verdict: partly_true
   - Verifier note: The four socket tests are not referenced by package.json or any build script, and all pass in my run: elbow 8/8 in 23 s, hip 8/8 in 32 s, knee 8/8 in 21 s, shoulder 12/12 in 83 s, so 36 checks in about 159 s in total. That is too slow for a 'quick check'. They are documented as manual commands in avatar/src/joints/ELBOW-DRAFT.md:28, HIP-DRAFT.md:54,65, KNEE-DRAFT.md:35 and SHOULDER-DRAFT.md:65. Of the other files, test-lab/test.mjs (test-lab/README.md:34), walk-test/test.mjs (walk-test/README.md:11) and avatar-v2/check-elbow.mjs (avatar-v2/README.md:127) are also documented as manual commands. test-lab/zoom-browser.mjs and racing-lab/tests/tuning-browser.mjs have no references at all.

9. **Notes still list 7 test commands that were removed**
   - Id: TEST-9
   - Kind: problem
   - Severity: low
   - Detail: The planning notes still tell readers to run checks such as 'test:walk', 'test:run' and 'test:gait'. Those were removed on 20 November, when the owner ordered the skeleton reset back to the wave point. The reset itself is recorded later in the same file, but the earlier steps still read as current.
   - Evidence: docs/NEXT.md lines 140, 183, 198, 284, 319, 338, 364, 397 and 460 mention npm run test:demos, test:footplan, test:robust, test:look, test:walk, test:run and test:gait, none of which exist in package.json. Commit 4348e1a (2026-11-20) removed motion-core/skeleton/walk.js, gait.js, look.js and footplan.js and their tests. The reset is noted at docs/NEXT.md:486.
   - Why it matters: A new assistant session reading these notes may try to run commands that don't exist, or think walking is already built.
   - Suggestion: Add a short 'removed in the 20 Nov reset' tag next to each of those steps, or move them into a history section.
   - Time saving: Prevents new sessions from chasing missing commands.
   - Verdict: confirmed
   - Verifier note: docs/NEXT.md lines 140, 183, 198, 284, 319, 338, 364, 397 and 460 (and 355) mention test:demos, footplan, robust, look, walk, run and gait, and none of them is in package.json. All were removed on 20 Nov. test:walk and test:run went in f5b17f2 (09:37, the gait rebuild), and the other five went in the reset commit 4348e1a (10:10). The reset entry starts at docs/NEXT.md:484. Item 46 at line 457 does say it supersedes items 41, 42 and 44, so part of the history is already marked.

10. **Type checking skips the racing code, though it passes when checked**
   - Id: TEST-10
   - Kind: opportunity
   - Severity: low
   - Detail: The type check, an automatic check that catches typing mistakes in code, only looks at the 23 files in the src folder. The 20 racing code files are written for this kind of check but are never included. I ran it on them by hand and found zero problems, so including them costs nothing and adds protection.
   - Evidence: tsconfig.json has "include": ["src"]. tsc --listFiles shows 23 project files, all under src/. A scratch tsconfig extending the project one, with racing-core/**/*.ts and avatar/**/*.ts (22 files), gave 0 errors.
   - Why it matters: Small mistakes in the racing code would only be caught if a test happens to touch them.
   - Suggestion: Add racing-core (and the one avatar .ts file) to the type check list. It already passes, so nothing else needs fixing.
   - Time saving: Catches some mistakes in seconds instead of during play-testing.
   - Verdict: confirmed
   - Verifier note: tsconfig.json has "include": ["src"]. tsc --noEmit gives rc=0 in 1.4 s, and --listFiles shows 23 project files. src/ has 23 .ts and 4 .js files. A scratch tsconfig extending the project one with racing-core/**/*.ts and avatar/**/*.ts listed 22 files and gave rc=0 with no errors. racing-core has 20 .ts files.

11. **The computer that publishes uses a different Node version, with nothing pinning it**
   - Id: TEST-11
   - Kind: risk
   - Severity: low
   - Detail: The publishing computer uses Node 24, this machine uses Node 22, and nothing pins the version. Re-running the racing tests here changes some saved numbers in their last decimal places, but it is not proven that the Node version causes this.
   - Evidence: deploy.yml has node-version: 24, and node --version here is v22.23.5. There is no .nvmrc and no 'engines' field in package.json. The re-run report diffs show, for example, 'wheelRotation': 9664.252837642276 becoming 9664.252837642278 and ratio 0.16871078572225845 becoming ...848 in racing-core/kart/COURSE-CHECKS.json and STEERING-CHECKS.md.
   - Why it matters: Something that passes on one machine and fails on another wastes time. It is rare today, but more likely as the physics grows.
   - Suggestion: Add a one-line file naming the Node version (the same one the publishing computer uses), so every machine and assistant uses the same one.
   - Time saving: Avoids 'works here, fails there' detective work.
   - Verdict: partly_true
   - Verifier note: deploy.yml has node-version: 24, this machine has v22.23.5, and there is no .nvmrc and no engines field. My re-run produced the same tiny last-digit differences: wheelRotation 9664.252837642276 became ...278 in COURSE-CHECKS.json, and TUNING-CHECKS.json yaw -0.9170672057824546 became ...547. But CI never commits files. The saved reports came from some developer machine, and nothing shows which Node version made them. So blaming Node 24 for the drift is a guess: the machine, the CPU or code changes could explain it too. The bigger reason these files keep changing is that the tests write tracked files at all (TEST-4).

12. **The racing test report names a code version that doesn't exist**
   - Id: TEST-12
   - Kind: problem
   - Severity: low
   - Detail: The racing results file claims to come from a specific saved version of the code, but that version label is typed into the test by hand. It matches no version in the project's history, so the report cannot be traced back to the code it tested.
   - Evidence: racing-core/tests/core.test.mjs:55 has sourceRevision:'573664e824a04234240a24dfc2eae2273e30a4ca' written in. 'git cat-file -t' gave 'bad object' in a full clone (not shallow; 427 commits on HEAD, 440 across all branches). It was added in bcf2b82 on 2026-11-18.
   - Why it matters: If a racing result is ever questioned, the report can't prove which code produced it.
   - Suggestion: Have the test read the current version automatically, or remove the field.
   - Verdict: confirmed
   - Verifier note: racing-core/tests/core.test.mjs:55 hardcodes sourceRevision '573664e824a04234240a24dfc2eae2273e30a4ca'. git cat-file says it cannot get object info, the clone is not shallow, and git rev-list --all counts 440 commits. The GitHub API returned HTTP 422 'No commit found for SHA'. git log -S says it was added in bcf2b82 on 2026-11-18.

13. **Everything that runs passes, and publishing is guarded by tests**
   - Id: TEST-13
   - Kind: strength
   - Severity: low
   - Detail: The build, the type check and all 25 non-browser test commands pass. On this machine, 9 of the 11 browser groups passed, the driving group failed, and the WebKit group could not be run. On GitHub, publishing only happens after every check passes, and recent runs are green.
   - Evidence: Build rc=0 in 121 s. tsc rc=0. All 25 node-only scripts rc=0. 10 of 11 foundation browser suites pass here, and the 11th (WebKit) was not run. GitHub: 142 success, 3 failure, 55 cancelled out of 200 runs. In deploy.yml, the gh-pages publish step runs only after every test step.
   - Why it matters: This is a solid base. Making the game work means adding to it, not rescuing it.
   - Suggestion: Keep the rule that nothing goes live without passing checks, and widen what those checks cover (TEST-1).
   - Verdict: partly_true
   - Verifier note: I confirmed the build passes (rc=0, 131 s in my run), tsc is clean, all 25 node-only scripts give rc=0, and CI shows 142/3/55. In deploy.yml the gh-pages step runs only after every test step. But the evidence line '10 of 11 foundation browser suites pass here' contradicts the inspector's own key facts: suite 4 (driving) failed here, and the WebKit suite was not run. That makes it 9 passed, 1 failed and 1 not run. Also, one of the 25 'passing' scripts, test:motion-core, checks nothing (TEST-5).

14. **Tests are written in plain English and check speed and frame rate**
   - Id: TEST-14
   - Kind: strength
   - Severity: low
   - Detail: Test names read like sentences the owner can understand, for example 'the rock blocks you' or 'walking off the edge, you fall'. Many tests also check that things are fast enough for smooth play, and that results stay the same at 30, 60, 120 and 144 frames per second. The browser test honestly says it cannot replace trying the game on a real phone.
   - Evidence: tests/island output: 'the rock blocks you' PASS, 'walking off the edge, you fall' PASS. skeleton-test/check.mjs: 'fast enough for every frame (under 2 ms of a 16 ms frame...)'. The racing checks use fps [30,60,120,144]. scripts/check-lab-foundations-browser.mjs ends with 'Browser emulation does not certify physical phones or controllers.'
   - Why it matters: The owner can read test results directly, without a programmer translating, and the speed checks protect phone performance early.
   - Suggestion: Keep this style as a rule for all new tests, including the quick-check command suggested in TEST-7.
   - Time saving: The owner can judge a test report alone, which saves explanation time in each session.
   - Verdict: confirmed
   - Verifier note: My island log contains 'the rock blocks you' and 'walking off the edge, you fall'. The attach log contains 'fast enough for every frame (under 2 ms of a 16 ms frame, chest bending every frame)'. The racing reports (kart/CHECK-RESULTS.md, GRIP-CHECKS.md, contacts/CHECK-RESULTS.md) use fps [30,60,120,144]. scripts/check-lab-foundations-browser.mjs ends with 'Browser emulation does not certify physical phones or controllers.' The plain-table scripts also fail properly: they exit with code 1 when a check fails (for example motion-core/tests/skeleton.mjs:168, tests/island/check.mjs:74, avatar-v2/check-torso.mjs:198).

### Missed by inspector found by skeptic

1. **The build protects the owner's saved checkpoints and approved avatar with digital fingerprints**
   - Kind: strength
   - Severity: medium
   - Detail: Before anything is published, the build checks that every frozen checkpoint (avatar-2, avatar-joints-1, driving-1, driving-2, island-1, motion-lab-1, test-lab-1) is exactly as it was saved. It also checks that the approved avatar and its light and game copies have not been swapped or damaged. If anything was altered, publishing stops. This directly protects the owner's approved work from being changed by accident by either assistant.
   - Evidence: scripts/build-checkpoints.mjs:11 throws 'Checkpoint viewer changed' and :14 throws 'Checkpoint file changed' when a SHA-256 does not match CHECKPOINT.json. scripts/build-official-avatar-page.mjs:12 asserts 'Official release needs explicit approval before replacing its asset', and lines 13-26 check the delivery, light and game copies. Both run inside npm run build, which deploy.yml runs before publishing.
   - Suggestion: Keep this, and mention it to the owner as one of the main safety nets. Any new checkpoint should get the same fingerprint file.

2. **The full pre-publish check cannot be reproduced on this cloud machine without a workaround**
   - Kind: risk
   - Severity: medium
   - Detail: Here, the browser part of the publish check fails before it starts. The project's test tool expects a newer browser than the one installed, and the fallback location it tries does not exist on this machine. With a manual override it runs, but the driving group still fails here even though it passes on GitHub. So an assistant working in this environment cannot fully confirm a change before pushing, and finds out only from a 7 to 11 minute GitHub run. That slows every fix cycle.
   - Evidence: node_modules/playwright-core/browsers.json wants chromium revision 1255 (Playwright 1.65.1). /opt/pw-browsers only has chromium-1243 (Chrome for Testing 153.0.8010.12). scripts/test-browser.mjs falls back to /usr/bin/chromium, which is missing here. With TEST_CHROMIUM_PATH=/opt/pw-browsers/chromium, racing-lab/tests/driving-browser.mjs failed at 117:120 in my run (rc=1, 120 s), while GitHub runs since da2fb60 are all success.
   - Suggestion: Make the environment and the project agree on one browser. Either set TEST_CHROMIUM_PATH in the environment setup, or pin a Playwright version whose browser matches the installed one. Write the one-line workaround in the README's build-and-check section.

3. **The handoff notes give out-of-date test numbers**
   - Kind: problem
   - Severity: low
   - Detail: The handoff file that new sessions read first says the browser check has nine groups and the racing check has 233 checks. Today there are 11 browser groups and 285 racing tests. Small, but it makes a new session think something is missing or extra.
   - Evidence: docs/HANDOFF.md:176-180: 'runs nine actual-page suites' and '233 racing checks'. scripts/check-lab-foundations-browser.mjs lists 11 suites. My test:racing-core run printed '# tests 285'.
   - Suggestion: Update the two numbers, or better, write 'see the README check list' instead of counts that go stale.

4. **Exact version pins and a lock file keep builds repeatable**
   - Kind: strength
   - Severity: low
   - Detail: Every tool and library is pinned to one exact version, and the publishing computer installs exactly what the lock file says. A surprise update of three.js, Vite or the test browser tool cannot silently break the game overnight.
   - Evidence: package.json: three 0.180.0, vite 7.1.5, typescript 5.9.2, playwright 1.65.1, esbuild 0.25.12, @types/three 0.180.0, all without ^ or ~. package-lock.json is tracked. deploy.yml runs 'npm ci'.
   - Suggestion: Keep exact pins, and upgrade one tool at a time on purpose, with the full check run after each upgrade.

## Assets, performance, phone readiness and repo weight
**Area summary:** The game's phone basics are better than you might expect from a one-person project. Every page is set up for phone screens and touch, screen sharpness is capped so phones don't overwork, physics runs at a steady pace whatever the phone's speed, and pages pause when you leave them. The real problem is weight, not code quality. The pages that open first in the Test Lab still load the 3.6-million-triangle "Detailed" avatar: a 20 MB download that took about 22 seconds on a simulated phone. That happens even though the owner already decided the 29,000-triangle "Game" copy is the one to work with on phones. The newest avatar rebuild (the socket versions) is about 509,000 triangles per body, roughly 17 times the owner's own phone budget. The repo is still manageable (171 MB of history, a 160 MB published site, well within GitHub's limits), but it grew by about 137 MB of model and media files in one week. It also stores many build outputs that can go stale, and builds take about 2 minutes, mostly spent rebuilding old study pages.

### Key facts
1. Git history (.git) is 171 MB: 164.33 MiB packed, 5,311 objects (git count-objects -vH). Git LFS is not used: there is no .gitattributes file.
2. 705 tracked files totalling 185,346,638 bytes. No .glb or .gltf model files at all. The avatar uses a custom binary format (magic 'STUDYB2' in src/study-binary.js:6) with meshopt compression plus gzip.
3. Biggest tracked files: avatar/assembled-joints/parts-4d3988607a0d4159.json.gz 35,810,859 B (an identical copy sits in checkpoints/avatar-joints-1/), delivery-46ecd0edf2e3c07b.bin.gz 19,962,239 B, light-33cc0f6789deec6f.bin.gz 5,167,402 B, docs/karts/styles/f1-kart-stock-lineup-review.png 4,684,681 B, wrist-lab/parts-70d79fbd9a6fcdd7.json.gz 4,339,380 B, racing-lab/index.html 2,998,181 B.
4. Where git history storage goes (on disk): model data .gz/.bin 77.5 MB (9 blobs), images 26.4 MB, GIFs 21.6 MB, built index.html pages 18.8 MB (371 versions, 268 MB before compression), videos 12.0 MB.
5. Binary files added to git by the day they first appeared: 17 Nov 34.0 MB, 19 Nov 68.4 MB, 20 Nov 5.4 MB, 21 Nov 1.5 MB, 22 Nov 22.9 MB, 23 Nov 4.9 MB. That is about 137 MB in one week.
6. A fresh build in a scratch copy (npm run build, exit 0) took 2m09s and produced a 160,487,932-byte site: 187 files, 40 HTML pages. Biggest folders: dist/avatar 61 MB, dist/checkpoints 51 MB, dist/references 18 MB, dist/new-avatar 8 MB.
7. Time per build step: elbow-lab 46.2s, wrist-lab 37.2s, new-avatar 25.1s, foot-lab 11.4s, racing-lab 2.4s, vite 2.0s, tsc 1.3s. Every other step takes under 0.6s.
8. Avatar copies (from the avatar/assembled-joints/*.json manifests): master 3,586,000 triangles; Light 261,300 triangles (5.17 MB, about 14x fewer); Game 28,892 triangles (2.02 MB, about 124x fewer).
9. Measured avatar loading (avatar/LOADING-RESULTS.json, cloud Chromium with SwiftShader, 'Not a physical-device benchmark'): Detailed avatar on a simulated phone (4x CPU, 10 Mbps) is ready in 22,299 ms cold and 10,344 ms warm; desktop is ready in 2,758 ms cold.
10. Decoded geometry size: the Detailed delivery file unpacks to 85,240,792 bytes of mesh arrays; the Game copy to 610,360 bytes.
11. Owner decision on record (docs/HANDOFF.md item 7, 20 Nov): 'Game is the working avatar for movement work; Detailed is only for checking looks (it is too heavy for a phone to move smoothly)'. Recorded method (docs/game-dev/11-rendering-web.md lines 5-13): a triangle budget per part, about 29,000 for the whole phone avatar.
12. Pixel-ratio caps in live code: 1.25 (walk-test, run-test), 1.5 (most labs, Skeleton, karts, new-avatar, motion-lab), 2 (src/main.ts, lab.ts, oval-lab.ts, island-lab.ts, avatar viewer).
13. All 22 non-checkpoint page shells have a viewport meta tag with viewport-fit=cover. Canvases use touch-action:none and buttons are at least 44px tall (motion-lab/shell.html CSS seen in racing-lab/index.html).
14. CI (.github/workflows/deploy.yml) publishes with peaceiris/actions-gh-pages force_orphan:true, so the gh-pages branch keeps no history. The browser checks run in a 390x844 touch viewport (test-lab/foundation-browser.mjs:24) on Chromium and WebKit.
15. 26 of the 40 published HTML pages each contain their own full copy of three.js (grep for 'WebGLRenderer: Context Lost'). The shared Vite copy is 491,558 B, or 123,771 B gzipped.
16. GitHub limits for context: a 100 MB hard limit per file (warning at 50 MB), a 1 GB published Pages site, and about 100 GB/month soft bandwidth. The largest file is 35.8 MB and the site is about 160 MB, so all are currently within limits.

### Findings

1. **The new avatar rebuild is already far over your own phone triangle budget**
   - Id: PERF-2
   - Kind: problem
   - Severity: high
   - Detail: The new avatar's socket versions (the newest work, 23 November) are about 509,000 triangles for a full body. That is roughly 17 times the 29,000-triangle phone budget you approved on 21 November. The first tab on the New avatar page ('Longer legs') shows two of these bodies side by side, about 1 million triangles. There is an automatic budget check, but it only covers an earlier version of the body, not these socket versions. The page also downloads an 8 MB shape file plus page, which a code comment calls 'one small file'.
   - Evidence: Header of dist/new-avatar/torso-sockets.bin (5,721,708 B, 4,495,564 B gzipped): items torso-assembled, legs-now and legs-6ft4 each have 27 parts and 509,036 triangles; torso-wrist-ankle-sockets 506,444. new-avatar/main.js:185 moves 'longer-legs' to the first tab. avatar-v2/check-assembly.mjs:18 BUDGET=29000 applies only to that assembly; no budget check in new-avatar/bake-torso-sockets.mjs. new-avatar/index.html is 2,634,695 B, of which 1,501,578 B is inlined avatar-v2/hands-feet-source.json (esbuild metafile). new-avatar/torso-sockets-file.js comment: 'stored in one small file'.
   - Why it matters: If the new body is designed at this detail, it will have to be redone or reduced later to run on phones. That is the same mistake that happened with the 3.6M-triangle avatar. Catching it now is cheap; catching it after joints and animation are built on top is expensive.
   - Suggestion: Decide now whether these socket versions are 'looks-only previews' or the real game body. If they are the real body, ask Claude to add the same 29,000-triangle check to the socket versions so any version over budget fails its test automatically, and to reduce detail before going further.
   - Time saving: Prevents a second full avatar rework later. The first one cost several days (17 to 21 November).
   - Verdict: confirmed
   - Verifier note: I rebuilt new-avatar in a scratch clone (node new-avatar/build.mjs, 23.6 s) and decoded the torso-sockets.bin header (5,721,708 B; 4,495,564 B at gzip -9). torso-assembled, legs-now and legs-6ft4 each have 27 parts and 509,036 triangles; torso-wrist-ankle-sockets has 506,444. new-avatar/main.js:185 moves 'longer-legs' to the first tab, which shows legs-now and legs-6ft4 side by side (main.js:136-138). The only BUDGET=29000 check is avatar-v2/check-assembly.mjs:18,78, and it runs on assemble(), not on the original-body.js socket pipeline. Extra detail: in the assembled body the torso alone is 76,572 triangles, about 15 times its own 5,000 budget (docs/game-dev/11-rendering-web.md:5-9). The body is built from fixed imported meshes (ORIGINAL_LIMBS from avatar-v2/original-limbs.json), which have no 'detail' setting. The recorded method assumes every part has one. One caveat: docs/HANDOFF.md:109 ('Uncertain' item 2) still says the budget is undecided, which contradicts the 21 Nov approval in game-dev/11. The page also unpacks every tab's shapes when it loads (main.js:114-115, all GROUPS rows built), not just the first tab.

2. **The first avatar you see in the Test Lab is the heavy one, even though you decided the light one is for phones**
   - Id: PERF-1
   - Kind: problem
   - Severity: medium
   - Detail: The Skeleton page, where movement work happens, still opens the 3.6-million-triangle Detailed avatar on High quality the first time a device visits. That goes against the owner's decision that Game is the working avatar for movement. The 'Our avatar' page also opens Detailed, but it is the page for checking looks, which is what Detailed is meant for. The choice is remembered per browser, so the owner's own phone probably already uses Game. New testers, new devices and phones with cleared data still get the 20 MB, roughly 22-second first load (simulated phone). Separately, the automatic phone check forces Game and Low quality, so it never tries this default path.
   - Evidence: public/test-lab/main.js:120 setTest(tests[initial]?initial:'avatar'); avatar path 'avatar-test' is built from skeleton-test/main.js (scripts/build-official-avatar-page.mjs). skeleton-test/main.js:21 let avatarMode='detailed' ... loadOfficialAvatar() by default; main.js:98 saved quality defaults to 'high'. avatar/LOADING-RESULTS.json: 4x CPU/10 Mbps cold readyMS 22299, warm 10344; delivery decodes to 85,240,792 bytes. docs/HANDOFF.md item 7: 'Game is the working avatar for movement work; Detailed is only for checking looks'.
   - Why it matters: Every time you or a tester opens the Test Lab on a phone, you wait and burn mobile data on a model you already said is too heavy. Heavy pages can also crash or freeze on older iPhones, which looks like a bug in the game when it isn't one.
   - Suggestion: Make Game the default avatar on phones and touch devices, and keep Detailed as a button for checking looks. Start phones on Medium quality. This is a small change in Claude's own area (Skeleton section).
   - Time saving: Saves about 10 to 20 seconds of waiting each time you open the lab on your phone, and avoids false 'it's broken' moments while testing.
   - Verdict: partly_true
   - Verifier note: Checked public/test-lab/main.js:120 (default section 'avatar' -> path 'avatar-test'), scripts/build-official-avatar-page.mjs (avatar-test page is built from skeleton-test/main.js), skeleton-test/main.js:21 (avatarMode='detailed' unless localStorage 'skeletonAvatar' is light/game) and :98 (quality default 'high'). avatar/LOADING-RESULTS.json shows cold 22,299 ms and warm 10,344 ms on the 4x CPU / 10 Mbps simulation, labelled 'Not a physical-device benchmark'. docs/HANDOFF.md:21 holds the decision. Two things are overstated. First, the 'Our avatar' page is the looks-checking page (the build retitles it 'Official avatar · Approved shapes and joints'), and Detailed for checking looks matches the owner's decision. The real contradiction is the Skeleton page, which is the movement page. Second, the avatar choice is saved in the browser under one key shared by both pages. The owner approved Game on his phone on 20 Nov, so his phone most likely already opens Game. The slow load hits first-time testers, other devices, or a phone whose site data was cleared, not 'every time'.

3. **The phone avatar file is mostly leftover design data, not the body itself**
   - Id: PERF-3
   - Kind: opportunity
   - Severity: medium
   - Detail: The Game avatar download is 2 MB, but only about 0.36 MB of that is the actual body. The rest (about 1.66 MB compressed) is design-time socket data copied from the big master model. The live page only reads three small numbers per socket (which bone, where, how big), so the rest appears to be unused when the page runs. The same extra data is inside the Light and Detailed copies too.
   - Evidence: Decoding avatar/assembled-joints/game-cca1d05f83501637.bin.gz: metadataBytes 4,349,020 (1,660,546 gzipped) vs geometry payload 610,360 (362,413 gzipped). 4,305,336 bytes of the metadata are parts[].transform.userData.assembly.sockets (fields core/rim, e.g. core 63,763 chars and rim 24,205 for one socket). avatar/src/joint-assembly/bind.js:25-29 reads only cup.bone, cup.center, cup.radius. core/rim are used by authoring code (avatar/src/joints/*.js, joint-assembly/build.js:7).
   - Why it matters: A phone avatar about five times smaller loads faster on mobile data. The saving also adds up when there are many players on screen later, since each needs its model.
   - Suggestion: Ask Claude to make the light and game copies keep only the socket numbers the page actually uses (bone, position, size), and to keep the full design data only in the master file.
   - Time saving: Faster phone loads during every test session, with no visual change.
   - Verdict: confirmed
   - Verifier note: I decoded all three avatar files myself with the STUDYB2 header layout from src/study-binary.js. Game: metadata 4,349,020 B (1,660,546 at gzip -9) against a geometry payload of 610,360 B (362,413 gzipped). Socket userData JSON is 4,305,336 B. Light and Detailed carry the same roughly 1.66 MB of compressed metadata. avatar/src/joint-assembly/bind.js:25-29 reads only cup.bone, cup.center and cup.radius. avatar-lab/src/chest-bend.js and src/study-asset.js do not read socket core/rim. For Detailed the saving is small (1.66 of 20 MB); for Game it is about 80% of the file.

4. **Builds keep rewriting files that are saved in git, and some saved copies are already out of date**
   - Id: PERF-4
   - Kind: problem
   - Severity: medium
   - Detail: Many test pages are built into one big file that is also saved in the repo (39 files, about 24 MB). About a third of all commits change them. Two saved copies are already out of date. The saved 'Our avatar' page is missing the 20 November fix for the first-tap jolt; the live site is fine because publishing rebuilds everything. Running the racing tests also rewrites a saved results file with a new date every time, so it always shows as changed. The build itself does not rewrite the racing result files. Two pages (New avatar and Karts) already build only into the published output folder, which shows the cleaner way works here.
   - Evidence: git ls-files | grep index.html: 39 files, 23,846,864 B. git log --all on the 13 big generated pages: 145 of 440 commits. Fresh build vs HEAD: avatar-test/index.html committed 621,297 B vs fresh 622,235 B; motion-lab/index.html 520,600 vs 521,152, with differing minified code at char 3744. The build touched 41 tracked files; 8 changed content, including racing-core/TEST-RESULTS.json and racing-core/kart/*-CHECKS.*. Build scripts write to source paths, e.g. racing-lab/build.mjs writes racing-lab/index.html and dist/racing-lab/index.html; build-official-avatar-page.mjs writes avatar/assembled-joints/decode-*.js. The published site is rebuilt by CI anyway (deploy.yml: npm run build).
   - Why it matters: Stale copies and noisy changes waste your review time and can confuse the AI assistants about which version is real. They also make the repo history bigger: 268 MB of page versions before compression.
   - Suggestion: Have builds write only into the dist folder (the published output), and stop saving built pages and auto-generated test results in git, except the frozen checkpoints. CI already builds everything fresh before publishing, so nothing on the live site changes.
   - Time saving: Cleaner change lists after every session, fewer conflicts between the two assistants, and less 'which file is current?' confusion.
   - Verdict: partly_true
   - Verifier note: Confirmed: 39 tracked index.html files totalling 23,846,864 B. 144 of the 427 commits on HEAD touch the 13 big generated pages (145 of 440 with --all). The two stale copies are real: after a full build in my scratch clone, git status showed only avatar-test/index.html and motion-lab/index.html changed. avatar-test/index.html was last committed on 20 Nov at 15:44, before commit 1a5c006 (the 'first-tap jolt' fix), which rebuilt only skeleton-test/index.html. Refuted: that the build rewrites racing test-result files. The build changed no racing-core files in my run. racing-core/TEST-RESULTS.json is rewritten by the test itself (racing-core/tests/core.test.mjs:55 writes a new generatedAt timestamp on every run). So the noise comes from tests, and from builds writing into source folders (racing-lab/build.mjs:14, build-official-avatar-page.mjs writing avatar/assembled-joints/decode-*.js and the route's index.html). The repo already contains the better pattern: new-avatar/build.mjs and karts/build.mjs write only into dist.

5. **Builds take about 2 minutes, and most of that is old study pages**
   - Id: PERF-5
   - Kind: problem
   - Severity: medium
   - Detail: A full build takes about 2 minutes. Three old joint studies (Elbow, Wrist, Feet) take about 95 seconds of that, and about 50 seconds of those 95 is re-running their tests inside the build. Freezing those three pages would bring a build down to about 30 seconds. A quick 'only the page I'm working on' build could get to a few seconds. The full build would stay for publishing.
   - Evidence: Per-step timings in a scratch copy: elbow-lab 46.2s, wrist-lab 37.2s, new-avatar 25.1s, foot-lab 11.4s; all others under 2.4s; full npm run build 2m09s. elbow-lab/build.mjs:4 and wrist-lab/build.mjs:4 run node --test before building. package.json build chains 15 build:* scripts. README.md D.2 calls walk-test, run-test, movement and the root page preserved earlier prototypes.
   - Why it matters: Slow builds use your assistant time and usage on every check and make each fix-and-test round slower.
   - Suggestion: Freeze old study pages the way checkpoints are frozen, so they are copied rather than rebuilt, or split the build so a quick build covers only the pages being worked on. Keep the full build for CI.
   - Time saving: Could cut a normal build from about 2 minutes to about 15 to 20 seconds.
   - Verdict: partly_true
   - Verifier note: I reran the full build step by step in a scratch clone: 125.9 s total. elbow-lab 45.8 s, wrist-lab 37.2 s, new-avatar 22.3 s, foot-lab 12.2 s, racing-lab 1.8 s, vite 1.7 s, tsc 1.1 s; everything else at or under 0.5 s. That matches the inspector. Two corrections. First, much of the elbow and wrist time is tests that the build reruns, not page building. elbow-lab/build.mjs:4 runs node --test (31.3 s on its own) and wrist-lab/build.mjs:4 runs tests (19.0 s on their own). Second, the time saving is overstated. Freezing only the three old studies (elbow, wrist, feet) leaves about 31 s, because new-avatar (22 s) is current work. Getting to 15-20 s needs a 'build only what I am working on' option. Also, Elbow, Wrist and Feet are still sections in the Test Lab menu (public/test-lab/main.js:12-14), so they are not fully retired.

6. **No on-screen speed meter and no automatic weight limit, so phone checks depend on feel**
   - Id: PERF-8
   - Kind: opportunity
   - Severity: medium
   - Detail: The Skeleton and Our avatar pages already show frames per second and the slowest frame on screen. The other pages show nothing, and no page shows triangle or draw-call counts. No automatic check stops a page from going over the phone budget or a download-size limit before it is published. A shared, hideable speed panel and a weight check before publishing would still turn 'it feels slow' into numbers.
   - Evidence: No live source file uses renderer.info, an fps counter or stats (grep of tracked .js/.ts outside checkpoints; the only matches are in test files). avatar/LOADING-RESULTS.json: 'Not a physical-device benchmark'. racing-core/PLAN.md:68: checks 'do not prove ... performance on a phone'. deploy.yml has no size or triangle check. docs/game-dev/11-rendering-web.md:14-16 already sets a target of under about 100-150 draw calls on phones and says to check renderer.info.render.calls.
   - Why it matters: You can't easily tell an assistant 'it stutters' in a way they can fix. With a number on screen you can say 'it drops to 30 fps on the Skeleton page', and an automatic limit stops anyone from quietly going over budget again (see PERF-1 and PERF-2).
   - Suggestion: Add a small hidden speed panel to the shared page code (for example, turned on by adding ?perf=1 to the link) showing frames per second, triangles and draw calls. Add one check before publishing that fails if a live page's default view goes over the phone budget or a set download size.
   - Time saving: Turns vague phone feedback into numbers, so each fix needs fewer rounds.
   - Verdict: partly_true
   - Verifier note: Refuted in part: skeleton-test/main.js:103-110 adds an always-visible readout of frames per second and slowest frame ('fps · slowest frame N ms'), added in commit f5b17f2. It is in the built skeleton-test and avatar-test pages (grep 'slowest frame' finds 1 match in each). So the Skeleton and Our avatar pages do show frame rate on screen. Confirmed: no live page shows triangle count or draw calls (no renderer.info use outside tests). deploy.yml has no size or triangle check. The project notes do say the checks do not prove phone performance (LOADING-RESULTS.json; scripts/check-lab-foundations-browser.mjs:36 prints 'Browser emulation does not certify physical phones').

7. **A Mario model and animation from Nintendo's game is published on the public site**
   - Id: PERF-11
   - Kind: risk
   - Severity: medium
   - Detail: The reference pages include videos and GIFs made from Mario's original model and walk animation, taken from a fan project that rebuilt the Super Mario 64 code. They are published on the public website. Using it privately as a study is one thing; publishing it on a public site tied to your game is a legal exposure. This is outside the phone-speed area, but it turned up in the file-size scan.
   - Evidence: public/references/sm64-walk/SOURCE.json: "repository": "n64decomp/sm64", "character": "Mario, Nintendo", files actors/mario/model.inc.c and assets/anims/anim_48.inc.c. references/sm64-walk/README.md: 'uses the original MARIO_ANIM_WALKING ... and high-detail Mario model'. public/references/motion-compare/SOURCE.json line 2 uses the same animation. The build copies these to dist/references/ (fresh build output).
   - Why it matters: Nintendo is known for enforcing its rights. Having its character on the same public site as your game could cause takedowns or trouble later, especially once the game becomes a business.
   - Suggestion: Take the Mario reference pages off the published site (keep notes or measurements privately if they are still useful), and use your own avatar or licensed motion references instead.
   - Time saving: Avoids a legal problem later.
   - Verdict: confirmed
   - Verifier note: public/references/sm64-walk/SOURCE.json lists repository n64decomp/sm64, files actors/mario/model.inc.c and assets/anims/anim_48.inc.c, character 'Mario, Nintendo'. references/sm64-walk/README.md:3 says it uses the original walk animation and the high-detail Mario model. motion-compare (titled 'Mario & our avatar') uses the same animation. Not mentioned by the inspector: (1) the content is also in the public GitHub repo itself, along with the extraction scripts (references/sm64-walk/extract.py, render.js, textures.py), not only on the published site; (2) the frozen checkpoint checkpoints/test-lab-1 contains the same Mario comparison video (references/motion-compare/side.mp4, the same git object as the public copy). Removing it therefore touches a frozen checkpoint, which needs the owner's decision under CLAUDE.md rule 17, and it would stay in the public git history.

8. **Repo is still fine in size, but it grew fast in one week and big files can't be removed later without rewriting history**
   - Id: PERF-6
   - Kind: risk
   - Severity: low
   - Detail: Git history is 171 MB, well within GitHub's limits. About 137 MB of model, image and video files arrived between 17 and 23 November, but most of that was a one-time addition of the master avatar on 19 November, so the growth rate will probably not continue at that pace. Files deleted later stay in history; two of them, an old skin experiment and a baked shape file, are about 13 MB together. A simple 'ask before adding any file over 1 MB' rule is still a cheap safeguard. Publishing checks only download the latest version, so history size does not slow them down much.
   - Evidence: du -sh .git = 171M; size-pack 164.33 MiB. First-added binary per day: 17 Nov 34.0 MB, 19 Nov 68.4 MB, 22 Nov 22.9 MB (scratchpad analysis of git rev-list --objects --all). No .gitattributes. Largest history blobs: parts json.gz 35.8 MB, delivery 20.0 MB, avatar/continuous-skin/skin-*.json.gz 6.8 MB (an experiment since removed from the tree but still in history), wrist-lab parts (two versions of 4.3 MB each).
   - Why it matters: A huge repo makes every clone, CI run and AI session slower, and fixing it later is painful. This is cheap to prevent and expensive to fix.
   - Suggestion: Make a simple rule for the assistants: no new model, image or video file over about 1 MB goes into git without saying so first. Keep only the master avatar and the copies the live pages use. Review and design images (like the kart sheets) can live in a cloud folder instead. Only consider Git LFS later if big files must be versioned often, since it adds its own limits and setup.
   - Time saving: Avoids a future history clean-up job and keeps sessions and CI fast.
   - Verdict: partly_true
   - Verifier note: Confirmed: .git is 171M; size-pack 164.33 MiB; no .gitattributes. Binary history first added per day (my own git log --raw pass, disk size): 17 Nov 34.0, 18 Nov 0.3, 19 Nov 68.4, 20 Nov 5.4, 21 Nov 1.5, 22 Nov 22.9, 23 Nov 4.9 MiB (units are MiB, not MB). The continuous-skin 6.8 MB blob is history-only; so is new-avatar/torso-sockets.bin (6.5 MB), which the inspector did not mention. Overstated: CI uses actions/checkout@v4 (deploy.yml), which by default fetches only the latest commit, so history size barely affects CI. Identical files in the tree (for example the two 35.8 MB parts files) share one git object, so they add nothing to history. The 'about 6 weeks to 1 GB' figure is a straight-line projection from one week dominated by a one-time 19 Nov addition (the 35.8 MB master plus the 20 MB delivery copy). GitHub only recommends staying under 1 GB; it is not a hard limit.

9. **The published site carries big files no page uses, and every test page has its own copy of three.js**
   - Id: PERF-7
   - Kind: opportunity
   - Severity: low
   - Detail: The build copies the 36 MB master avatar file into the live site even though no current page downloads it (the frozen checkpoint uses its own second copy). Reference GIFs add another 12 MB next to matching videos. Separately, 26 test pages each contain a full copy of the 3D engine, so switching tests in the lab downloads it again. None of this breaks anything today: the site is 160 MB of a 1 GB limit.
   - Evidence: scripts/build-official-avatar-page.mjs:37 copyFile(manifest.asset) into dist/avatar/assembled-joints/. Live pages load delivery/light/game assets only (avatar/src/official-avatar.js:20, light-avatar.js). Only dist/checkpoints/avatar-joints-1/index.html references the parts file as a download path. GIFs: 6 files, 12,307,491 B; public/references pages play the .mp4. 26 dist HTML files contain 'WebGLRenderer: Context Lost'; three.js is about 538 KB inside each (esbuild metafile for racing-lab and skeleton-test).
   - Why it matters: It is not urgent, but trimming keeps the site well under GitHub's limits as more checkpoints are added, and makes moving between lab sections a bit faster on phones.
   - Suggestion: Stop copying the unused master file into the live site, drop or shrink the GIFs, and when the real game page is built, make it one app that shares a single engine copy instead of many self-contained pages.
   - Time saving: Small. Mostly it prevents future size problems.
   - Verdict: confirmed
   - Verifier note: scripts/build-official-avatar-page.mjs copies manifest.asset (parts-4d3988607a0d4159.json.gz, 35,810,859 B) into dist/avatar/assembled-joints. In my build, the only page that downloads it is dist/checkpoints/avatar-joints-1/index.html, which resolves it against new URL('./') (its own copy, identical by cmp). The live pages (official-avatar.js, light-avatar.js) download only the delivery, light and game files; their bundles contain the parts file name only as a data string. Tests read the master from the source folder (tests/avatar/delivery.mjs:12), not from dist. GIFs: 6 tracked, 12,307,491 B total. They are only 'Open the GIF' download links on the reference pages (public/references/*/index.html), so they add site size but do not slow page loads. three.js: 26 dist HTML files contain 'WebGLRenderer: Context Lost' (14 live, 12 checkpoints). The shared Vite copy is 123,771 B gzipped.

10. **Pages don't recover if the phone's graphics chip resets**
   - Id: PERF-9
   - Kind: risk
   - Severity: low
   - Detail: The 3D engine the project uses already tries to recover by itself when a phone resets its graphics, so pages usually come back on their own. What's missing is a clear 'graphics were reset, tap to reload' message for the cases where the phone never hands the graphics back. Pages that only redraw when something changes may also stay blank until you touch them.
   - Evidence: 0 tracked live source files contain 'webglcontextlost' or 'contextlost' (grep outside checkpoints).
   - Why it matters: A blank screen during testing looks like a game bug and can waste a session hunting for it.
   - Suggestion: Add a 'graphics were reset, tap to reload' message (or an automatic reload) to the shared page code once, so every page gets it.
   - Time saving: Avoids chasing 'random blank screen' reports.
   - Verdict: partly_true
   - Verifier note: Confirmed: no live source file listens for webglcontextlost (the only match is a test, racing-lab/tests/chase-camera-browser.mjs:28). Overstated: three.js 0.180 handles this itself. node_modules/three/src/renderers/WebGLRenderer.js:1012-1034 calls preventDefault on context loss and re-initialises on contextrestored. Because geometry arrays stay in memory, pages usually recover on their own when the browser restores the graphics. The real gaps: there is no message or reload if the browser never restores, and the Detailed mode of the Skeleton/Our avatar pages only redraws when something changes (needsRender, KEEP_WARM=false), so it may stay blank until touched.

11. **The driving page carries a 2.3 MB block of track data inside the page**
   - Id: PERF-10
   - Kind: opportunity
   - Severity: low
   - Detail: Of the 3 MB driving page, about 2.3 MB is one track reference data file built straight into the page. It still works on phones (about 1 MB after the web server compresses it), but it slows the first open and is repeated in each driving checkpoint. This is Codex's area.
   - Evidence: esbuild metafile for racing-lab/src/main.js: total 2,987,869 B, racing-core/track/reference.json 2,315,340 B. racing-lab/index.html gzip -9 = 1,011,943 B. checkpoints/driving-1 and driving-2 index.html are each about 2.9 MB.
   - Why it matters: A faster first open of the driving test on mobile data.
   - Suggestion: When Codex next works on tracks, load only the selected track's data, or store it in a compact form instead of raw text.
   - Time saving: Small, but it speeds up every phone driving test.
   - Verdict: confirmed
   - Verifier note: An esbuild metafile for racing-lab/src/main.js shows 2,987,845 B total, of which racing-core/track/reference.json is 2,315,340 B. gzip -9 of racing-lab/index.html is 1,011,943 B. checkpoints/driving-1 and driving-2 index.html are 2,906,691 and 2,907,548 B. The file holds four tracks (original 347 KB, skyline 569 KB, suzuka 708 KB, winding 709 KB as JSON), so loading only the chosen track would cut it by roughly 70-85%.

12. **The main web address still opens an old prototype with a very heavy avatar**
   - Id: PERF-12
   - Kind: problem
   - Severity: low
   - Detail: The site's front address (the root page) is an old preserved prototype. It builds an older avatar version at load time, about 700,000 triangles, and draws it every frame at up to 2x screen sharpness. Anyone you share the base link with sees this instead of current work, and it runs poorly on phones.
   - Evidence: index.html loads /src/main.ts, which imports createApprovedAvatar from avatar/src/approved-avatar.js; counting the meshes under rig.root in Node (bundled with esbuild) gave 15 meshes and 703,516 triangles. src/main.ts:37 setPixelRatio(min(dpr,2)); setAnimationLoop renders every frame. README.md D.2 calls the site root an earlier prototype.
   - Why it matters: First impressions, and confusion about which page is the real game.
   - Suggestion: Point the front address to the Test Lab (or a simple menu page), and move the old prototype to a checkpoint link.
   - Time saving: Less confusion when sharing links or reopening the project after a break.
   - Verdict: confirmed
   - Verifier note: index.html loads /src/main.ts, which imports createApprovedAvatar (src/main.ts:24). I bundled it with esbuild in a scratch clone and traversed rig.root: 15 meshes, 703,516 triangles, the same as the inspector. src/main.ts:37 caps pixel ratio at 2; :108 setAnimationLoop renders every frame. dist/index.html in my build is this page. README.md:24 calls the site root a preserved earlier prototype.

13. **Custom avatar file format instead of the standard 3D format**
   - Id: PERF-13
   - Kind: opportunity
   - Severity: low
   - Detail: The avatar is saved in a home-made file format. It is well built (compressed and checked for corruption), but no common tool can open it: not Blender, not online model viewers, not the free optimizer tools. The standard web format (GLB) can use the same compression this project already ships.
   - Evidence: 0 .glb/.gltf files tracked. src/study-binary.js:1-6 uses three/addons fflate + MeshoptDecoder with magic 'STUDYB2'. meshoptimizer 0.22.0 is in devDependencies (package.json). three.js GLTFLoader supports EXT_meshopt_compression with the same decoder.
   - Why it matters: As one person you'll want ready-made tools and assets: to view, tweak or reduce models, or buy and borrow karts and props. A standard format makes all of that possible without custom code.
   - Suggestion: Not urgent. When the avatar body is settled, ask Claude to also export it as a compressed GLB and compare the size and load speed before deciding which format to keep.
   - Time saving: Lets you use free tools instead of asking the AI to write custom code for every model change.
   - Verdict: confirmed
   - Verifier note: No .glb or .gltf files are tracked (git ls-files count is 0). src/study-binary.js:1-6 uses fflate plus MeshoptDecoder with the magic STUDYB2. package.json devDependencies include meshoptimizer 0.22.0. This is a fair low-priority suggestion.

14. **Phone controls and screen setup are done properly**
   - Id: STR-1
   - Kind: strength
   - Severity: low
   - Detail: Every page is set up for phone screens, including notched iPhones. Touch is captured so the page doesn't scroll or zoom by accident, buttons are big enough for thumbs, and controls let go cleanly if you switch apps. Gamepads work too, and the driving test can be added to the home screen like an app.
   - Evidence: All 22 non-checkpoint page shells have viewport meta with viewport-fit=cover. canvas{touch-action:none}, button min-height:44px, env(safe-area-inset-left) in motion-lab/shell.html CSS. motion-lab/src/input.js:21-38 uses pointer capture and global release; input.js:61 reads gamepads; src/input.ts:49 and racing-lab/src/driving-controls.js:72 release input on visibilitychange. racing-lab/build.mjs adds a manifest.webmanifest and apple-mobile-web-app tags.
   - Why it matters: These are the parts that usually make web games feel broken on phones, and they are already handled.
   - Suggestion: Keep all new pages on the shared page and input code (motion-lab/src/page.js and input.js) so they get this for free.
   - Time saving: No rework needed on phone controls.
   - Verdict: confirmed
   - Verifier note: All 35 non-checkpoint shell/index HTML files have a viewport meta with viewport-fit=cover (more than the 22 the inspector counted). motion-lab/shell.html has touch-action:none, min-height:44px and safe-area-inset-left. motion-lab/src/input.js has blur/visibilitychange reset (:23,25), pointer capture with a fallback (:38) and getGamepads (:61). Release on visibilitychange is at src/input.ts:49 and racing-lab/src/driving-controls.js:72. racing-lab/build.mjs adds the manifest and apple-mobile-web-app tags.

15. **Speed basics are in place: sharpness cap, quality levels, steady physics, pausing**
   - Id: STR-2
   - Kind: strength
   - Severity: low
   - Detail: Screen sharpness is capped on every page, so phones with very sharp screens don't draw 3 to 9 times more pixels than needed. The Skeleton page has Low, Medium and High quality buttons. Physics runs in fixed small steps, so the game behaves the same on slow and fast phones. Pages stop drawing when hidden or scrolled away, which saves battery.
   - Evidence: setPixelRatio(Math.min(devicePixelRatio,1.25-2)) in every live renderer (grep list). skeleton-test/main.js:43 QUALITY low/medium/high. src/main.ts:35,110 STEP=1/120 with frame clamped to 0.1s; racing-core/session.js:63-66 uses a fixed VEHICLE.step accumulator. motion-lab/src/page-activity.js pauses on pagehide/freeze/IntersectionObserver. Some pages turn antialiasing off on touch (motion-lab/src/page.js:15). Draw calls are reduced with InstancedMesh (racing-lab/src/track-view.js:12, checked-track-view.js:31,36).
   - Why it matters: These choices are hard to add late. Having them now means the game's feel won't change from phone to phone.
   - Suggestion: Copy the Skeleton page's quality levels into the shared page code, so every section (and later the game) gets the same Low/Medium/High setting.
   - Time saving: Avoids rebuilding the frame loop later.
   - Verdict: confirmed
   - Verifier note: Every live renderer caps pixel ratio between 1.25 and 2 (grep of setPixelRatio). skeleton-test/main.js:43 has QUALITY low/medium/high. racing-core/session.js:63-66 uses a fixed-step accumulator. motion-lab/src/page-activity.js:24,30 uses IntersectionObserver plus pagehide/freeze. InstancedMesh is used at racing-lab/src/track-view.js:12 and checked-track-view.js:31,36. One exception the inspector missed: the shared page code turns on preserveDrawingBuffer (see the missed items).

16. **Avatar loading is carefully engineered**
   - Id: STR-3
   - Kind: strength
   - Severity: low
   - Detail: The avatar downloads once, is checked against a fingerprint so a broken download is caught, is unpacked in the background so the page doesn't freeze, and is saved on the phone so the next visit doesn't download it again. This work cut cold phone loading time by 62%. A light Game copy at about 29,000 triangles already exists.
   - Evidence: src/load-binary-study.js: SHA-256 check (verifiedBytes), Cache API 'approved-study-bytes-v1', Worker decode. avatar/LOADING-RESULTS.json: coldPhoneReductionPercent 62.1; warmModelDownloads 0; recovery checks listed. avatar/assembled-joints/game.json: 28,892 triangles with a per-part budget table.
   - Why it matters: Once the default is switched to the light copy (PERF-1), phone loading should be fast with no extra work.
   - Suggestion: Reuse this same loader for karts and world pieces later.
   - Time saving: No new loading system needed for future models.
   - Verdict: confirmed
   - Verifier note: src/load-binary-study.js:4-20 shows the Cache API 'approved-study-bytes-v1', a SHA-256 check (crypto.subtle) and worker decoding. LOADING-RESULTS.json shows coldPhoneReductionPercent 62.1 and warmModelDownloads 0. game.json shows 28,892 triangles with a per-part budget table. Minor caveat: the cache never removes older avatar files (only cache.put, plus cache.delete on a corrupt entry), so old versions pile up on the phone as the avatar changes.

17. **Publishing is safe and well within GitHub's limits**
   - Id: STR-4
   - Kind: strength
   - Severity: low
   - Detail: Publishing is safe and well within GitHub's limits. The published branch keeps no history, the site is 160 MB of the 1 GB allowed, and approved checkpoints are fingerprinted so they cannot change by accident. The phone-sized checks mostly run in Chrome's engine, though. Safari's engine is only used for one driving-page check, and the avatar check deliberately switches to the light avatar on Low quality, so the heavy default pages are never tried before publishing.
   - Evidence: deploy.yml: test:lab-foundations-browser after playwright install chromium webkit; peaceiris/actions-gh-pages force_orphan:true. test-lab/foundation-browser.mjs:24 viewport 390x844, isMobile:true, hasTouch:true. Fresh build 160,487,932 B. checkpoints/README.md: the build checks every saved file against files_sha256. The repo is public, so GitHub Actions minutes are free.
   - Why it matters: Your approved work is protected and the live site won't hit a GitHub limit any time soon.
   - Suggestion: Keep this setup. Just add the weight and budget check from PERF-8.
   - Time saving: No hosting changes needed for now.
   - Verdict: partly_true
   - Verifier note: Confirmed: force_orphan:true; the test viewport is 390x844 with isMobile and hasTouch (test-lab/foundation-browser.mjs:24); the build checks checkpoint fingerprints (scripts/build-checkpoints.mjs:11-14); site 160,487,932 B and largest file 35.8 MB. Overstated: Safari's engine (WebKit) runs only one suite, 'WebKit app return and pause', on the driving page (scripts/check-lab-foundations-browser.mjs:22). Every Test Lab, avatar and skeleton check runs in Chromium only. The Test Lab check also forces skeletonAvatar='game' and skeletonQuality='low' (foundation-browser.mjs:25) and never opens the default Avatar section or the New avatar section.

18. **Light materials, no heavy image textures**
   - Id: STR-5
   - Kind: strength
   - Severity: low
   - Detail: The 3D scenes use plain colours and tiny textures drawn in code instead of large image files. On phones, big textures are often what uses up memory, and this project avoids them.
   - Evidence: No TextureLoader, KTX2Loader, GLTFLoader or DRACOLoader in live source; only small CanvasTexture grids (e.g. movement/main.js:12, karts/main.js:31, new-avatar/main.js:71). docs/game-dev/11-rendering-web.md item 7 already plans KTX2 for big textures later.
   - Why it matters: Lower memory use on phones and very small downloads for scenery.
   - Suggestion: Keep the simple-colour style as long as it fits the look you want. If image textures are added later, use the compressed format already noted in the docs.
   - Verdict: confirmed
   - Verifier note: No TextureLoader, KTX2Loader, GLTFLoader or DRACOLoader in live source; the only matches are the offline Mario reference renderers (references/motion-compare/mario.js, references/sm64-walk/render.js). The CanvasTexture grids are as described.

### Missed by inspector found by skeptic

1. **The automatic check before publishing skips the heavy pages on purpose**
   - Kind: problem
   - Severity: medium
   - Detail: Before anything goes live, a robot opens some pages in a phone-sized browser. It first switches the avatar to the light Game copy on Low quality, then opens only Tracks, Driving, Motion and Skeleton. It never opens the Test Lab's first section (Our avatar, which loads Detailed by default) or the New avatar section, and those are the two heaviest pages. That is how the New avatar page could stop loading on phones and still go live. On 23 November the owner had to find that himself ('Its not loading in the test lab').
   - Evidence: test-lab/foundation-browser.mjs:25 addInitScript sets localStorage skeletonAvatar='game', skeletonQuality='low'. The pages visited are Tracks/driving links, /motion-lab/ and ?test=skeleton (lines 34-85, asserting avatarMode 'game'); there is no ?test=newAvatar and no default avatar section. scripts/check-lab-foundations-browser.mjs:11-23 lists the suites, none for new-avatar. docs/HANDOFF.md:86 item 72: page frozen after 30 s at 380 MB on the 4x-slowed phone, reported by the owner.
   - Suggestion: Add the default Our avatar section and the New avatar section to the pre-publish phone check, with a time limit, for example 'must be ready within 20 seconds on the slowed phone', so a too-heavy page fails before it goes live.

2. **The New avatar page unpacks every tab's bodies when it opens, not just the one you see**
   - Kind: risk
   - Severity: medium
   - Detail: When the New avatar page opens, it builds the shapes for every tab at once, even though only one tab is visible. The baked shape file alone holds about 2.6 million triangles across its nine bodies, and the page also builds the older tabs in code. The last measurement (before the 6 ft 4 version was added) was about 18 seconds and 112 MB of memory on a simulated slow phone. Memory pressure like that is what makes iPhones reload or blank a page.
   - Evidence: new-avatar/main.js:114-115 unpacks torso-sockets.bin and builds geometry for each item via torsoParts(); the loop after :186 creates meshes for every group's row, and only visibility changes per tab (:237,251). Decoded header triangle sums: 63,022+40,596+77,772+171,340+231,140+506,444+3x509,036 = 2,617,422. docs/HANDOFF.md:86: 'ready in 6.2 s on a computer and 17.9 s on the 4x-slowed phone (112 MB); the rest is the other tabs'. Item 77 (6 ft 4 legs) was added afterwards.
   - Suggestion: Build only the tab being shown, and build the others when they are tapped. Keep older tabs as frozen checkpoints instead of loading them on every visit.

3. **The shared page code turns on a setting that can slow phone graphics**
   - Kind: risk
   - Severity: low
   - Detail: The shared page code that the driving test and the Motion page use (plus six study pages) asks the browser to keep a copy of every finished frame. This is usually only needed for taking screenshots in tests. On phone graphics chips it can add an extra copy each frame and use more battery. Its real cost here has not been measured.
   - Evidence: motion-lab/src/page.js:15 new T.WebGLRenderer({...,preserveDrawingBuffer:true}); racing-lab/src/main.js:2 imports createMotionLab from motion-lab/src/page.js. The same flag is in avatar-lab, elbow-lab, foot-lab, hand-lab, wrist-lab src/main.js and avatar/src/avatar-viewer/main.js. The Khronos WebGL spec and WebGL working-group notes describe avoiding this copy as a performance and power win on tile-based (mobile) GPUs. That it hurts this game specifically is an inference, not measured.
   - Suggestion: Turn the setting on only during automatic tests (for example with a test-only link option) and leave it off for real players. Compare frame rate on the owner's phone before and after.

4. **The handoff notes still say the phone triangle budget is undecided**
   - Kind: problem
   - Severity: medium
   - Detail: The handoff file, which every new AI session reads first, still says under 'Uncertain' that the avatar triangle budget is undecided. A later note in the game-dev docs records the owner approving about 29,000 triangles on 21 November. The 'first-tap delay' item in the same list was already solved on 20 November. An assistant reading the handoff could treat the budget as open, which helps explain how the new avatar grew to about 509,000 triangles without anyone flagging it.
   - Evidence: docs/HANDOFF.md:108-109 'Uncertain or unresolved' item 1 (first-tap delay) and item 2 'The avatar triangle budget is undecided' (added 20 Nov, commit a0e8108). docs/game-dev/11-rendering-web.md:5-9 'owner-approved, 21 November 2026 ... the whole phone avatar about 29,000' (commit c4ff0ae). docs/HANDOFF.md:21 item 7 resolves the first-tap jolt.
   - Suggestion: Update the 'Uncertain' list in the handoff: mark the budget as decided (about 29,000 for the whole phone avatar, about 5,000 for the torso) and the first-tap delay as solved, so both assistants work from the same numbers.

5. **A real racing-circuit name is published in the driving test**
   - Kind: risk
   - Severity: low
   - Detail: One of the four test tracks is named 'Suzuka Circuit' and is shown in the published driving page. Suzuka is a real circuit and a brand name owned by a company. It is fine while the page is a private study, but a commercial game should not use a real circuit's name, and possibly not its layout either, without permission.
   - Evidence: racing-core/track/reference.json tracks.suzuka.name = 'Suzuka Circuit' (from 3D-World-3 data/suzuka-layout.js per its source.fileHashes). racing-lab/src/driving-test.js contains the label 'Suzuka Circuit'. grep finds 2 matches in the tracked racing-lab/index.html.
   - Suggestion: Before the game goes public or commercial, rename the track and change its shape so it is clearly your own. This is Codex's area, so mention it to Codex when tracks come up next.

6. **Saved avatar files never get cleaned off the phone**
   - Kind: risk
   - Severity: low
   - Detail: Each avatar version is saved on the phone so it loads faster next time, but older versions are never deleted. As the avatar keeps changing, phones keep every old 2 to 20 MB copy until the browser decides to clear storage.
   - Evidence: src/load-binary-study.js:4 cacheName 'approved-study-bytes-v1'; line 20 cache.put(url,copy); line 17 cache.delete only on a corrupt entry. Asset URLs carry a content hash (e.g. delivery-46ecd0edf2e3c07b.bin.gz), so every new version is a new entry.
   - Suggestion: When a new avatar version loads, remove saved files that the current page no longer uses.

7. **Two pages already show the cleaner build-and-bake pattern**
   - Kind: strength
   - Severity: low
   - Detail: The New avatar and Karts pages build only into the published output folder and never rewrite saved files. The New avatar build also does the heavy shape work ahead of time and stores the result in a compact form (positions in 16-bit steps, directions packed into two numbers, repeated pieces stored once). That took the page from frozen on a slow phone to loading. These two pages are a ready-made model for fixing PERF-4 and for shipping the game's models later.
   - Evidence: new-avatar/build.mjs and karts/build.mjs:7 write only dist/new-avatar/* and dist/karts/index.html; git ls-files has no new-avatar/ or karts/ index.html. new-avatar/torso-sockets-file.js: Uint16 quantised positions, octahedral Int16 normals, mirror/move de-duplication. docs/HANDOFF.md:86: from frozen after 30 s at 380 MB to 17.9 s and 112 MB on the 4x-slowed phone.
   - Suggestion: Ask the assistants to switch the other page builds to this same 'output folder only' pattern, and reuse the baking approach for karts and world pieces.

## Racing and driving area (Codex-owned, read only)
**Area summary:** The racing side has a strong engine but no race yet. The track shapes, kart handling, crashes into walls and other karts, phone, keyboard and gamepad controls, and the camera are all built and well tested. The owner approved and froze the driving feel twice (Driving Checkpoints 1 and 2). What makes it a game is still missing from the current code: no countdown, no lap counting for the main kart, no computer opponents, no finish line or results, no ghosts, no items and no online play. An earlier quick version from 18 November did run full 5-kart, 3-lap races on all four tracks, but it was set aside the same morning for a cleaner rebuild. Since the feel was approved, most racing time has gone into polish and realism (10 handling setups, GT3 and 2026 F1 simulations, small button moves) rather than the race itself. Two separate sets of kart sizes, stale or misleading docs, and tests that rewrite tracked files are the main sources of future rework.

### Key facts
1. All 47 commits touching racing-core/ and racing-lab/ are authored as the owner ('Isaias U'), not 'Codex'. The 17 'Codex' commits are all 17 Nov avatar/hand work, so author counts undercount Codex's racing work (git log --format='%an' -- racing-core racing-lab).
2. Racing commits by day: 18 Nov 25, 20 Nov 10, 22 Nov 11 (plus 5 from Claude in kart areas), 23 Nov 1 (git log over racing-core racing-lab karts kart-parts oval).
3. I ran the full racing test suite in a scratch copy (not in the repo): 285 tests passed, 0 failed, about 99 seconds (node --test racing-core/tests/core.test.mjs).
4. Lab foundation tests: 61 of 61 passed. Racing page build checks: 47 of 47 passed, and the rebuilt racing-lab/index.html was byte-identical to the committed one.
5. The old 18 Nov prototype still runs full races in tests: 5 karts, 3 laps, 0 respawns on all 4 tracks. Race times were 379 s (Original), 421 s (Skyline), 495 s (Suzuka) and 753 s (Winding) (racing-core/TEST-RESULTS.json, regenerated in the scratch copy).
6. Track lengths measured with racing-core/track/index.ts: Original 3,683 m, Skyline 4,513 m, Suzuka 5,757 m, Winding 6,635 m. Each has 13 gates and a 26 m road (halfWidth 13).
7. TRACK_IDS is fixed to ['original','skyline','suzuka','winding'] (racing-core/track/index.ts:6). The only other driving world is a hand-coded flat Neighborhood (racing-core/testing/neighborhood.ts).
8. racing-core/PLAN.md: 741 lines, about 10,200 words, 31 '##' sections, 16 stop/wait markers. The words gt3, neighborhood, f1-2026 and parked appear 0 times in it.
9. Current code: about 2,438 lines of TypeScript in track/kart/contacts/testing, about 2,954 lines of racing-core tests, 989 lines in racing-lab/src and 1,314 in racing-lab/tests. The superseded prototype is 478 lines (racing-core/*.js); its session+progress+driver+ghosts files total 254 lines.
10. Handling setups defined: original, balanced, fast, fast-before-grip (shown as Early F1), f1-targets, gokart-prototype, gt-prototype (First-drive GT), gt3, gt3-v3, f1-2026, so 10 in all (racing-core/kart/profiles.ts, prototypes.ts, gt3-profile.ts, gt3-v3-profile.ts, f1-2026-profile.ts).
11. The Driving Test menus offer 6 track choices (4 circuits + Neighborhood + Parked Karts) and 7 kart choices (Original Kart, GoKart, First-drive GT, GT3, GT3 V3, Early F1, 2026 F1). The Original Kart's original/balanced/fast setups are picked by URL (racing-lab/src/driving-test.js:14-75).
12. drive.ts getState always reports avatars: 0 and opponents: 0 (racing-core/testing/drive.ts:137).
13. CI (deploy.yml) runs test:racing-core, and test:lab-foundations-browser runs 11 browser suites, 8 of them racing ones (driving, GT3, Neighborhood, steering release, bridge camera, app install, Chromium/WebKit app return) (scripts/check-lab-foundations-browser.mjs:11-23).
14. Last 40 CI runs (gh run list): 33 success, 6 cancelled, 1 failure ('Add Neighborhood road practice to the Driving Test', 2026-11-23T05:25Z).
15. Approved driving checkpoints are frozen in checkpoints/driving-1 (3.5M) and driving-2 (3.6M). Tags driving-source-1/2 and driving-checkpoint-1/2 exist locally and on origin (git ls-remote).
16. The racing runtime code does not import three.js or any browser API. Only test files import three (racing-core/testing/prototypes.test.mjs:3, check.test.mjs:9).
17. The racing page is built on the shared Motion Lab shell: racing-lab/src/main.js imports motion-lab/src/page.js, which imports motion-core/controller.js, motion-lab/src/input.js, page-activity.js, camera-follow.js, src/test-lab-scene.ts and public/test-lab/interactions.js (motion-lab/src/page.js:1-7).

### Findings

1. **Driving feel is approved, frozen and safely tagged**
   - Id: RACE-1
   - Kind: strength
   - Severity: high
   - Detail: The owner drove the kart, asked for changes, and approved the feel twice. Each approved version was frozen as its own page with its exact settings, and named save points were pushed to GitHub. Codex's handling tune, 'Fast' (180 mph, 220 mph with boost), is the approved reference, and you can always go back to it.
   - Evidence: racing-core/PLAN.md:544-568 (Checkpoint 1) and 661-690 (Checkpoint 2, viewer SHA256 9b0f7f60..., physics kart-v1-c0934f4555677c0e). checkpoints/driving-1 and driving-2 exist. Tags driving-source-1-2026-11-20, driving-checkpoint-1-2026-11-20, driving-source-2-2026-11-20 and driving-checkpoint-2-2026-11-20 are present locally and on origin.
   - Why it matters: The hardest-to-judge part of a racing game, how it feels to drive, is locked in. Later work can't quietly ruin it, because there is always a known-good version to compare against or restore.
   - Suggestion: Keep this habit: freeze a save point every time the owner says something feels right. Use Checkpoint 2 as the handling for the first real race and stop retuning it until races exist.
   - Time saving: No time lost re-finding a good driving feel after future changes.
   - Verdict: confirmed
   - Verifier note: PLAN.md:544-568 (Checkpoint 1) and 661-690 (Checkpoint 2) record the owner's approvals, SHA256 9b0f7f60..., and physics kart-v1-c0934f4555677c0e at 180/220 mph. checkpoints/driving-1 and driving-2 exist. git tag -l and git ls-remote both show driving-source-1/2 and driving-checkpoint-1/2 (2026-11-20) on origin.

2. **Racing tests are unusually strong and run before every publish**
   - Id: RACE-2
   - Kind: strength
   - Severity: high
   - Detail: Almost every racing piece has automatic checks. They compare the new kart against recordings of the original game's kart, prove the result is identical whether the game runs at 30, 60, 120 or 144 frames per second, and check walls, bridges, crashes and controls. Each check writes a plain report: the rule, what was tried, what was measured, and pass or fail. Real-browser checks of the driving page also run before anything is published.
   - Evidence: In a scratch copy, node --test racing-core/tests/core.test.mjs gave 285 pass, 0 fail in about 99 s. Lab foundations: 61/61 pass. racing-lab/build.mjs build checks: 47/47 pass. kart/README.md says 31 original scenarios / 998 states agree, max difference 1.171e-11 (PLAN.md:126). deploy.yml runs test:racing-core and 11 browser suites (scripts/check-lab-foundations-browser.mjs:11-23). CI: 33 of the last 40 runs succeeded.
   - Why it matters: For one person directing AI helpers, automatic checks are the safety net. They catch breakage the owner would otherwise only find by playing on a phone.
   - Suggestion: Keep it. When the race layers get built (laps, opponents, results), have Codex add the same style of check for each one, such as 'every computer kart finishes 3 laps on every track'.
   - Time saving: Bugs get caught by machines instead of the owner's phone testing.
   - Verdict: confirmed
   - Verifier note: In my own scratch copy, node --test racing-core/tests/core.test.mjs gave 285 pass, 0 fail (110 s here). npm run test:lab-foundations gave 61/61, and racing-lab/build.mjs gave 47/47. CI runs test:racing-core (72 s in run 45217820916) and the browser gate. One small fix: 9 of the 11 browser suites in scripts/check-lab-foundations-browser.mjs:11-23 are racing-lab suites, not 8. Track inspection also counts.

3. **There is still no playable race in the current code**
   - Id: RACE-4
   - Kind: problem
   - Severity: high
   - Detail: Today you can drive one kart alone on four tracks, a practice neighborhood, or into two parked karts. Prototype karts show a simple lap timer. Still missing in the current code: start lights or countdown, 3-lap race rules, a winner, computer opponents, positions and results, wrong-way warning, respawn, ghosts, nitro charges, mystery boxes or weapons, the avatar sitting in the kart, race islands, and any online play. The plan's own table lists race rules, opponents, ghosts, device controls and the playable build as 'Not started' or 'Deferred'.
   - Evidence: PLAN.md:79-83 (sections 4-8 'Not started; requires go' / 'Deferred'). drive.ts:137 reports opponents: 0 and avatars: 0. The lap clock exists only for prototype karts (drive.ts:99 `const clock = prototype ? createPrototypeLapClock(track) : null`). racing-lab/README.md: 'full race rules, opponents, ghosts and island scenery are separate later work'. The game cards want up to 8 karts, red-red-red-green lights, 3 laps, items (docs/MINIGAMES.md:44-57). No netcode exists anywhere in the racing code.
   - Why it matters: The owner's top goal is a game that actually works. The racing part is currently a very good driving test, not yet a game you can win or lose.
   - Suggestion: Make the next racing chunk 'first real race': one kart type (approved Fast), one track (Original, the shortest), countdown, 3 laps, 3-7 computer karts, a finish line and a results screen. Leave items, more karts and more tracks until that works.
   - Time saving: Testing races early shows which tuning really matters, so less tuning gets thrown away.
   - Verdict: confirmed
   - Verifier note: PLAN.md:79-83 lists sections 4-7 as 'Not started; requires go' and section 8 as 'Deferred'. drive.ts:137 hardcodes avatars: 0 and opponents: 0. drive.ts:99 creates the lap clock only for prototype karts. racing-lab/README.md:5 says race rules, opponents and ghosts are later work. A grep for websocket, webrtc, socket.io, colyseus and peerjs in the racing and src folders found nothing, and package.json has only three and cdt2d as runtime dependencies.

4. **Most of a race already exists and can be reused**
   - Id: RACE-5
   - Kind: opportunity
   - Severity: high
   - Detail: Useful pieces exist: the old prototype's race rules, computer drivers and ghosts (about 250 lines, still passing tests), a test-only driver that completes full laps on the new kart, gate-crossing checks, and a multi-kart crash step. But the old race code was written for the old kart and old track code, so it has to be moved over and retuned, not just plugged in. The test driver drives one kart alone and cannot pass or avoid other karts yet. It makes the race chunk smaller, not trivial.
   - Evidence: racing-core/session.js (70 lines), progress.js (56), driver.js (45) and ghosts.js (83). core.test.mjs:26 'five real karts complete three laps without respawn' passes for all 4 tracks. racing-core/kart/course-check.test.mjs:5-11 has a look-ahead fixture driver ('Automated fixture inputs, never loaded by the game'). track/README.md: crossGate(index,from,to). contacts/README.md: stepContactKarts.
   - Why it matters: Building the race on top of proven pieces is faster and less risky than designing it from zero again.
   - Suggestion: Ask Codex to build race rules and opponents by moving the proven ideas from the old prototype and the test driver onto the new kart and track code, rather than inventing new ones.
   - Time saving: Likely turns the race loop into a short chunk instead of a long one, since the logic has already been written and tested once.
   - Verdict: partly_true
   - Verifier note: session.js 70, progress.js 56, driver.js 45 and ghosts.js 83 lines exist, and the four 'five real karts complete three laps' tests pass in my run. course-check.test.mjs has a full-lap look-ahead driver. However, the old race code is built on the OLD vehicle.js and track.js (the original 120 mph kart and the old track module), not the new kart/track code. The test driver is labelled 'never loaded by the game or used as an opponent' (course-check.test.mjs:1). It drives one kart alone, with no traffic or passing logic.

5. **Polish and realism got ahead of the race itself**
   - Id: RACE-6
   - Kind: problem
   - Severity: high
   - Detail: Since the feel was approved, most racing effort has gone into more kart setups (10 handling setups, 7 kart choices, detailed GT3 and 2026 F1 simulations) rather than the race itself. The owner asked for this work, so it is a priority choice, not the AI drifting. The 18 Nov button changes were 7 published changes in about 1 hour 40 minutes, but only 3 were small pixel nudges; the rest were layout fixes the owner requested. The advice still holds: freeze tuning and build the race next.
   - Evidence: Profiles in racing-core/kart/profiles.ts:69-193, prototypes.ts, gt3-profile.ts, gt3-v3-profile.ts and f1-2026-profile.ts. Kart menu in racing-lab/src/driving-test.js:15-75. docs/karts/F1-DRIVING-REFERENCE.md:183-247 (4 MJ battery, FIA 350 kW, Brembo comparisons). GT3 commits 56075a5, 97873d3, 729ab95, beb9eb3, c334916 (22 Nov) and 0e5ae96 (23 Nov). Button commits 138ce3e, b11bb7c, e1f36c7, 4d7985a, 383cf47, 4a6e32f and 250127d between 20:11 and 21:49 on 18 Nov. docs/game-dev/07-racing.md:12 says 'For a stylized kart game, arcade is the right choice.'
   - Why it matters: Every new variant has to be retested and re-felt by the owner on a phone, and every published change waits about 10 minutes for the publish checks. Tuning without races also risks redoing it once real races show what matters, like passing, bumping and racing lines.
   - Suggestion: Freeze kart tuning now. Pick one GT setup and hide the others, park the F1 realism work, and group small layout tweaks into a single change. Come back to the GoKart/GT/F1 feel once races exist.
   - Time saving: Fewer phone test sessions and publish waits. Tuning effort goes where real races show it is needed.
   - Verdict: partly_true
   - Verifier note: There are 10 profiles (profiles.ts:69-193, prototypes.ts:62,74, gt3-profile.ts:16, gt3-v3-profile.ts:17, f1-2026-profile.ts:27) and 7 kart choices (driving-test.js:15-75). The GT3 commits 56075a5..0e5ae96 and the 07-racing.md:12 quote check out, and CI runs take about 7-11 minutes. But the F1 doc (F1-DRIVING-REFERENCE.md:185) says 'The owner authorized the full research-based driving pass'. PARTS-KIT.md item 3 also records an owner decision on 22 Nov to 'start with one model per class to get the driving fundamentals right first'. Of the 7 button commits between 20:11 and 21:49 UTC, only 3 are pixel nudges (e1f36c7 12 px, 4d7985a 12 px, 250127d 24 px). The rest were layout and size changes the owner asked for. The GT3 commits are the evening of 22 Nov in local time (-0600), which is 23 Nov UTC.

6. **Two different sets of kart sizes exist**
   - Id: RACE-8
   - Kind: risk
   - Severity: high
   - Detail: Claude's look-only karts (the Test Lab 'Karts' section) and the karts Codex drives in the Driving Test are different sizes. Claude's F1 is about 2.9 m long. Codex's F1 is 4.6 m. Claude's GT is about 2.45 m long. Codex's GT is 3.25 m. Claude's sizes come from the avatar's body. Codex's sizes drive the physics, and the GT3 and F1 tunes were fitted to them (for example a '2.10 m wheelbase' GT and a '3.04 m wheelbase' F1).
   - Evidence: Bounding boxes I measured with three.js in a scratch copy. kart-parts models: f1-base L 2.91 W 1.68, gt-base L 2.45 W 1.47, gokart-base L 2.14 W 1.25. kart-parts/product-prototypes.js (used by driving): f1 L 4.60 W 2.02, gt L 3.25 W 2.19, gokart L 2.35 W 1.35. Codex sizes: racing-core/kart/prototypes.ts:36-52. Claude sizes are tied to the avatar (kart-parts/check.mjs imports motion-core/skeleton/bones.js). docs/karts/GT3-DRIVING-REFERENCE.md:211 and F1-DRIVING-REFERENCE.md:185. HANDOFF.md items 38 and 41 note the wheel places differ.
   - Why it matters: When the karts become one thing (look + driving + avatar seat + custom parts), one side's sizes will have to change. The handling tuned on the other sizes may then need redoing.
   - Suggestion: Have the owner choose one source of truth for kart dimensions now (one file both assistants read), using the locked size pictures in docs/KARTS.md section G. Then pause new tuning on the non-chosen sizes.
   - Time saving: Prevents retuning three kart classes after the models are unified.
   - Verdict: confirmed
   - Verifier note: I measured three.js bounding boxes in a scratch copy. kart-parts models: gokart 1.25x0.96x2.14, gt 1.47x1.26x2.45, f1 1.68x1.21x2.91. product-prototypes (used by racing-lab/src/prototype-kart-view.js:2): gokart 1.35x1.05x2.35, gt 2.19x1.48x3.25, f1 2.02x1.48x4.60. prototypes.ts:36-52 gives wheelbases of 2.10 (GT) and 3.04 (F1). HANDOFF.md:97 (item 38) gives Claude's GT wheelbase as 1.55 m and F1 as 1.89 m, and items 38 and 41 both warn Codex that the wheel places differ. More evidence: KARTS.md:95-96 records the owner wanting the three karts 'all close in size', while Codex's F1 (4.60 m) is about twice the length of its GoKart (2.35 m).

7. **Kart designs and plans are visible in the public repo**
   - Id: RACE-16
   - Kind: risk
   - Severity: high
   - Detail: The full kart lineup, customization and weapon ideas, and 32 concept pictures are in a public GitHub repo where anyone can read and copy them. Moving them to a private place is sensible. But on a free GitHub account the published game only works while the repo is public. Making it private means paying for GitHub Pro or hosting the game somewhere else, and anything published as a page is still visible to everyone.
   - Evidence: docs/karts is 24M with 32 .jpg/.png files. docs/KARTS.md (three modes, tiers, customization). docs/karts/PARTS-KIT.md section F (weapon ideas such as the pop-out cannon). The lead already measured the repo as PUBLIC.
   - Why it matters: The owner wants to make sure no one steals the idea. Detailed design docs and art are the easiest parts to copy.
   - Suggestion: Covered at the repo level by the lead. For racing specifically: if the repo stays public, keep design docs and concept art in a private place. The published game only needs the built pages.
   - Verdict: partly_true
   - Verifier note: gh api shows the repo visibility as 'public', and there is no LICENSE file. docs/karts is 24M with 32 image files (all of the images in docs/). PARTS-KIT.md:93 has the weapons section. But the suggestion leaves out a key limit: GitHub's plans page says Pages works only from PUBLIC repositories on GitHub Free, and needs Pro, Team or Enterprise for a private repo. Also, a published Pages site is public even when the repo is private. Source: https://docs.github.com/en/get-started/learning-about-github/githubs-plans

8. **Clean design: game logic is separate from graphics**
   - Id: RACE-3
   - Kind: strength
   - Severity: medium
   - Detail: The racing rules and physics (racing-core) don't depend on the 3D drawing code or the browser. The physics runs in fixed small steps, 120 times a second, and its saved state can't be changed by accident. That makes it a solid base for computer opponents, ghost laps, replays and, later, online play.
   - Evidence: No runtime file in racing-core imports 'three'. Only tests do (racing-core/testing/prototypes.test.mjs:3, testing/check.test.mjs:9). There is a strict ES2022-only typecheck with no browser types (racing-core/kart/tsconfig.json: "types": [], "lib": ["ES2022"]). Fixed 1/120 s step and rollback on error: kart/README.md 'Controller contract'. The multi-kart step stepContactKarts supports up to 32 bodies (contacts/README.md).
   - Why it matters: Opponents and ghosts can reuse the exact same kart physics as the player with no second system, which avoids a whole class of bugs and rework.
   - Suggestion: When opponents are built, insist they use the same kart controller and contact step (stepContactKarts), as PLAN.md section 5 already says.
   - Verdict: confirmed
   - Verifier note: Only racing-core/testing/prototypes.test.mjs and testing/check.test.mjs import three. kart/tsconfig.json has types [] and lib ES2022. contacts/README.md:13,19 states the 32-body limit, the 1/120 s step, rollback, and that stepContactKarts is 'the fixed-tick primitive for a later race coordinator'.

9. **A working race prototype was replaced by a fresh rebuild the same day**
   - Id: RACE-7
   - Kind: risk
   - Severity: medium
   - Detail: On the evening of 17 November (owner's time), Codex built a racing version with four computer opponents. Fifteen minutes later the page was narrowed to solo driving, and a few hours later the owner chose to start fresh without comparing the two. The rebuild is higher quality but has not reached races yet. The old code is still in the repo and still tested, but you can't view it live anywhere.
   - Evidence: git log: bcf2b82 (01:54) 'Rebuild four-track racing core with physics-driven opponents', 27ba534 (02:30) 'Add playable four-track Racing Lab ... opponents', a0d5179 (09:04) 'Start fresh racing track layer'. PLAN.md:11 'The owner explicitly declined a comparison/audit against the previous rebuild.' createRaceSession is only reachable from racing-lab/src/simulation.js, which nothing imports.
   - Why it matters: Starting over is the most expensive move in a project. With AI helpers it's tempting because rebuilding looks fast, but each restart pushes the playable game further out.
   - Suggestion: Treat the current rebuild as final. Make a simple rule: no more restarts of a working layer. Improve it in place, and reuse old working logic as reference.
   - Time saving: Avoids paying twice for features (like races) that already worked once.
   - Verdict: partly_true
   - Verifier note: bcf2b82 (01:54 UTC), 27ba534 (02:30 UTC) and a0d5179 (09:04 UTC) on 18 Nov are confirmed, as is PLAN.md:11 'explicitly declined a comparison/audit'. createRaceSession is used only by racing-core/index.js, session.js, tests/core.test.mjs and racing-lab/src/simulation.js, and nothing imports simulation.js. No checkpoint keeps the old version. The times are UTC: in the owner's -0600 time zone this was the evening of 17 Nov. Also, at 02:45 UTC (14cee00, 'Focus Racing Lab on solo driving') the page dropped opponents to focus on solo driving, only 15 minutes after they were added and before the fresh start.

10. **The racing plan is long, hard to read and out of date**
   - Id: RACE-9
   - Kind: problem
   - Severity: medium
   - Detail: racing-core/PLAN.md calls itself 'the single plan and approval record', but it reads like a diary. It is 741 lines of dense technical writing, and its newest entry is the 20-22 November foundation pass. Everything since then (GT3, GT3 V3, 2026 F1, the three kart prototypes, Neighborhood, Parked Karts) is only recorded in HANDOFF.md, the kart driving references and the racing-lab README. Its status table is also stale. For example, it says device controls are 'Not started' even though a lot of control work is done.
   - Evidence: wc: 741 lines, about 10,187 words, 31 sections. grep counts in PLAN.md: gt3 0, neighborhood 0, f1-2026 0, parked 0. Status table at PLAN.md:72-83 (row 7 'Shared device controls ... Not started'; row 3 'review pending'). Newer records are in docs/HANDOFF.md:119-136, docs/karts/GT3-DRIVING-REFERENCE.md and F1-DRIVING-REFERENCE.md.
   - Why it matters: The owner can't quickly see where racing stands, and a new AI session may act on old information. Reading 10,000 words each time also burns usage.
   - Suggestion: Ask Codex to put a short 'Racing today' box (10-15 plain lines) at the top of PLAN.md: what works, what's next, what's approved. Move the diary below it, and keep the status table current with every chunk.
   - Time saving: Saves the owner and each new AI session from re-reading long history to learn the current state.
   - Verdict: confirmed
   - Verifier note: wc gives 741 lines and 10,187 words, and there are 31 '##' headings. grep -ic finds 0 matches each for gt3, neighborhood, f1-2026 and parked. Line 3 still says 'Updated 20 November 2026'. The last commit to PLAN.md is a103b71 (22 Nov 05:10 UTC). The status table at :72-83 still shows device controls as 'Not started' and Driving feel as 'ready for owner feel feedback', even though the feel was approved twice.

11. **Tests and builds rewrite files that are saved in git**
   - Id: RACE-12
   - Kind: problem
   - Severity: medium
   - Detail: Running the racing tests rewrites saved report files inside the project, even when nothing really changed (timestamps and tiny last-digit number differences). The racing page itself is a 2.9 MB packed file that is saved in git and regenerated on every build. Both assistants touch it, which creates noisy changes and possible conflicts. The handoff notes already warn about this.
   - Evidence: After running test:racing-core in a scratch copy, 6 tracked files differed: racing-core/TEST-RESULTS.json, kart/TUNING-CHECKS.md/.json, kart/COURSE-CHECKS.json and kart/STEERING-CHECKS.md/.json. Example: wheelRotation 9664.252837642276 vs ...278, and generatedAt timestamp. racing-lab/build.mjs:15 writes both racing-lab/index.html and dist/. 37 commits touched racing-lab/index.html. docs/HANDOFF.md 'Practical notes' 1: 'Building or testing can modify tracked files that belong to Codex'.
   - Why it matters: Changes that aren't real make it hard to see what actually changed. They can cause merge conflicts between Claude and Codex, or accidental undoing of each other's work.
   - Suggestion: Have test reports write to an ignored folder (CI already uses .test-results/), and stop saving the built racing page in git. Frozen checkpoints can stay saved.
   - Time saving: Fewer conflicts and less cleanup after every test or build.
   - Verdict: confirmed
   - Verifier note: After test:racing-core in my scratch copy, git status shows exactly 6 changed tracked files (TEST-RESULTS.json timestamp, COURSE-CHECKS.json with wheelRotation 9664.252837642276->...278, STEERING-CHECKS.md/.json, TUNING-CHECKS.md/.json). racing-lab/index.html is 2,998,181 bytes, has 37 commits, and build.mjs writes both it and dist. HANDOFF.md practical note 1 confirms the problem. Note: all 37 commits to the built page are under the owner's name, and Claude has never committed it. The problem is that Claude's builds and tests rewrite it, and Claude has to remember to undo that. A rebuild today was byte-identical.

12. **Only four borrowed tracks, and no way to make new ones**
   - Id: RACE-13
   - Kind: risk
   - Severity: medium
   - Detail: The four circuits were copied exactly from the older 3D-World-3 project, and the code only accepts those four. The owner's plans want separate tracks per kart type (smaller, sharper GoKart tracks), tracks built from blocks on race islands, and grass to cut across. None of that has a building path yet. Connecting tracks to the block world is waiting on Claude's block engine. The current tracks are also long: 3.7 to 6.6 km. The old prototype's 3-lap races took about 6 to 12.5 minutes.
   - Evidence: racing-core/track/index.ts:6 fixes TRACK_IDS to 4. Measured lengths: 3,683 / 4,513 / 5,757 / 6,635 m, road 26 m wide. docs/KARTS.md:23-24 (mode-specific tracks), docs/MINIGAMES.md:54-57 (blocks, grass, race islands). contacts/README.md: block adapter 'still pending'. TEST-RESULTS.json raceSeconds: 378.9, 420.6, 495.0, 752.7.
   - Why it matters: New tracks are a core part of a kart game. Without a way to create them, every new track becomes a big custom job. Race length also affects whether races feel fun.
   - Suggestion: After the first race works, have Codex add a simple way to make a new track from a list of center points (reusing the current track code). Have the owner decide a target race length, for example a couple of minutes for 3 laps.
   - Time saving: Makes each future track a small job instead of a project.
   - Verdict: confirmed
   - Verifier note: track/index.ts:6 fixes TRACK_IDS. I measured lengths with createTrack: 3683, 4513, 5757 and 6635 m, halfWidth 13, 13 gates each. TEST-RESULTS.json raceSeconds: 378.875, 420.592, 495.042, 752.692 (those used the old 120 mph kart). The per-mode tracks are at KARTS.md:21-22 (not 23-24). contacts/README.md:15,28 says the block adapter is pending. The inspector missed an existing block-built oval (see the missed items).

13. **Racing depends on shared files from the movement side**
   - Id: RACE-14
   - Kind: risk
   - Severity: medium
   - Detail: The racing page is built on the Motion Lab page shell, which also loads the avatar movement controller, and on a shared input file. Codex has edited these shared input and camera files during racing work. Codex's driving kart models also live inside Claude's kart-parts folder. Ownership of these shared pieces isn't clearly written down.
   - Evidence: racing-lab/src/main.js:2 imports motion-lab/src/page.js, and page.js:2 imports motion-core/controller.js. motion-lab/src/input.js has 6 commits under the owner's name (Codex racing passes) plus 1 from Claude. Codex also authored motion-lab/src/camera-follow.js and page-activity.js. kart-parts/product-prototypes.js imports racing-core/kart/prototypes.ts. HANDOFF.md 'Uncertain' 3: deleting motion-lab 'would break driving and track inspection'.
   - Why it matters: A change by one assistant can break the other's page. That has already happened with publishing (HANDOFF.md item 74).
   - Suggestion: Agree on a small 'shared' list (input, page shell, camera follow) with one named owner and a rule: changes there must pass both the movement and racing checks.
   - Time saving: Fewer surprise breakages between the two assistants.
   - Verdict: confirmed
   - Verifier note: racing-lab/src/main.js:2 imports motion-lab/src/page.js, and page.js:2 imports motion-core/controller.js. motion-lab/src/input.js has 6 owner-name commits (including the racing commits 27ba534, 14cee00, 6dd9b85 and a103b71) and 1 by Claude. camera-follow.js and page-activity.js were created in racing commits. kart-parts/product-prototypes.js:2 imports racing-core/kart/prototypes.ts. HANDOFF item 74 (line 88) records a Codex driving-test failure that blocked Claude's publish.

14. **Real-world names in tracks and kart designs**
   - Id: RACE-15
   - Kind: risk
   - Severity: medium
   - Detail: One track is shown in the game as 'Suzuka Circuit', the name of a real, well-known racetrack. The chosen GT stock body is described as 'inspired by the 2026 Porsche 911 GT3 R', while KARTS.md says no copied real cars. Real brands also appear in code comments and reference docs (Porsche, Brembo, F1 drivers). Using real data privately for tuning is normal. Showing real names or close copies in the released game is a legal risk.
   - Evidence: racing-lab/src/driving-test.js:50 (option label 'Suzuka Circuit'). docs/karts/PARTS-KIT.md section H item 5 (GT option 05, Porsche cues). docs/KARTS.md:44-45 ('no logos, no real teams, no copied real cars'). 39 matches for real brand/driver names across racing-core, racing-lab/src and kart docs (e.g. racing-core/kart/gt3-systems.ts:5).
   - Why it matters: Renaming a track is easy now and painful after launch. A body that looks too much like a real car could force a redesign of a chosen stock kart.
   - Suggestion: Give all tracks original names now. When the GT body is modeled, keep only general 'GT' cues, not a recognizable copy. Add these to the later legal checklist.
   - Time saving: Avoids a forced rename or redesign right before release.
   - Verdict: confirmed
   - Verifier note: driving-test.js:51 (not 50) labels the track 'Suzuka Circuit'. PARTS-KIT.md:133-136 says the selected GT option 05 'takes its cues from the 2026 Porsche 911 GT3 R' and links Porsche. KARTS.md:39 (not 44-45) says 'no logos, no real teams, no copied real cars'. Real brands also appear in code comments (gt3-systems.ts:5, gt3-profile.ts:8, f1-2026-profile.ts:15). My brand grep found 42 matches in racing-core, racing-lab/src and the kart docs.

15. **A main driving browser test failed in a newer Chrome**
   - Id: RACE-17
   - Kind: risk
   - Severity: medium
   - Detail: The main driving browser test is timing-sensitive. It already failed once on GitHub (23 November), which blocked publishing for both assistants until Codex patched it. It also fails at a different step in a newer Chrome. It is likely to break again and stop every publish, so making its waits depend on the actual condition is worth a small fix.
   - Evidence: TEST_CHROMIUM_PATH=/usr/bin/google-chrome (Chrome for Testing 153.0.8010.12) node racing-lab/tests/driving-browser.mjs gave exit 1 on 3 of 3 runs at line 117 `assert(...state.speed>8)`. Instrumented state just before: speed 25.0, contacts 1. A separate probe without the earlier steps kept speeding up normally (to 53 m/s). CI: 33/40 recent runs successful.
   - Why it matters: If the test browser is updated in CI, this test could start failing and block every publish for both assistants until someone fixes it.
   - Suggestion: Low priority: have Codex make that step wait for the condition it actually checks (or test on a straight with no rail ahead) so it doesn't depend on timing.
   - Verdict: partly_true
   - Verifier note: I reproduced it: TEST_CHROMIUM_PATH=/usr/bin/google-chrome (Chrome for Testing 153.0.8010.12) node racing-lab/tests/driving-browser.mjs exited 1 at line 117:120 (speed>8 assertion) in 1 run. I did not verify the rail-contact diagnosis. Importantly, the inspector said this suite passes on GitHub, but the same suite already failed in CI: the failed run 45117726873 ('Add Neighborhood road practice', 23 Nov 05:25Z) died in 'Driving controls, FPV and device layouts' with a waitForFunction timeout at driving-browser.mjs:28 (called from :123). It was fixed 9 minutes later by da2fb60 'Keep the browser test controller idle during reset'. HANDOFF item 74 records that this failure blocked Claude's avatar publish and made the owner wait about 10 minutes.

16. **Phone controls are thoroughly built and tested**
   - Id: RACE-19
   - Kind: strength
   - Severity: medium
   - Detail: The driving test works on phones as an installable Home Screen app. Buttons support pressing several at once, fixes cover stuck buttons and resuming the app, and there is keyboard and gamepad support. All of it is checked in both Chrome and Safari's browser engine.
   - Evidence: PLAN.md:201-210 (Home Screen app), 464-534 (stuck-input fixes, 14 input checks), 571-607 (resume repair, 13 lifecycle scenarios in Chromium and WebKit). racing-lab/manifest.webmanifest. Browser suites in scripts/check-lab-foundations-browser.mjs:15-22.
   - Why it matters: Mobile is where most players will try the game. Controls that are already reliable remove one of the biggest risks for a web game.
   - Suggestion: Reuse these controls unchanged for the real race and for free-roam driving later.
   - Verdict: confirmed
   - Verifier note: These PLAN.md sections exist at the cited lines: 201 'Safari browser bars - Home Screen web app', 464 'progressive control and intermittent slide/input investigation', 571 'Home Screen input resume repair'. racing-lab/manifest.webmanifest exists. The browser suites include Chromium and WebKit app-return checks (check-lab-foundations-browser.mjs:21-22). The foundation pass (PLAN.md:707-713) says the input layer was hardened, with 11 new regressions.

17. **Some docs describe retired code as if it works today**
   - Id: RACE-10
   - Kind: problem
   - Severity: low
   - Detail: Three lines are stale: the MINIGAMES time-trial card says racing-core already saves ghosts, the proposed nitro line says it is already built at 120 to 180 mph, and PLAN.md says the old demo is still available. The racing-core README is clearly marked as history at the top, so it is less of a problem than reported. This is a quick fix of three lines.
   - Evidence: racing-core/README.md:1 (warning) vs :7 and :17-19 (present-tense opponent/ghost claims). docs/MINIGAMES.md:37-38 and :60-61. PLAN.md:18 vs racing-lab/README.md:3 ('The superseded driving prototype is not mounted'). Fast profile 180/220 mph: PLAN.md:673-674.
   - Why it matters: The owner or an AI helper could believe ghosts and opponents are done and plan around them, then find out late that they need building.
   - Suggestion: Ask Codex to fix three lines: rewrite racing-core/README.md around the current code, correct the two MINIGAMES.md claims, and remove the 'demo stays available' line.
   - Time saving: Prevents wrong planning based on features that don't exist.
   - Verdict: partly_true
   - Verifier note: MINIGAMES.md:37-38 ('as built in racing-core', 120->180 mph) and :60-61 ('racing-core already saves ghosts') are stale. PLAN.md:18 ('Its existing demo stays available') contradicts racing-lab/README.md:3 ('not mounted'). But the warning at racing-core/README.md:1 explicitly says 'Everything below describes the superseded racing prototype ... Its race/NPC/ghost checks do not establish those features in the fresh rebuild', so that README is clearly flagged. Also, the nitro line sits in MINIGAMES section B, which is marked 'proposed (not approved yet)'. Only the ghost line is in an approved game card.

18. **Retired prototype tests slow every publish**
   - Id: RACE-11
   - Kind: problem
   - Severity: low
   - Detail: The old prototype's full-race tests take almost half of the racing test step, about 30-35 seconds of each roughly 9.5-minute publish. Some old unused page files (about 0.5 MB) also remain. Reuse the old race logic first, then move these tests to an optional command.
   - Evidence: Test durations from my run: winding 17.0 s, suzuka 12.2 s, skyline 9.3 s, original 7.0 s for the old 'five real karts complete three laps' tests. That is about 45.5 s of about 98.6 s total (racing-core/tests/core.test.mjs:26). Unused files: racing-lab/src/simulation.js and track-view.js (imported by nothing else), racing-lab/capture.mjs, racing-core/index.js/session.js/driver.js/ghosts.js/progress.js/vehicle.js/track.js and tracks/reference.json (about 564 KB together).
   - Why it matters: Every push waits on these tests, and the old files confuse anyone reading the folder.
   - Suggestion: First reuse the old race logic for the real race (see RACE-5). Then move the old tests to an optional 'history' command and delete or archive the old files. Git history keeps them anyway.
   - Time saving: About 45 seconds off every publish run, plus less confusion.
   - Verdict: partly_true
   - Verifier note: Durations from my run: original 7.4 s, skyline 10.7 s, suzuka 12.4 s, winding 19.2 s, so about 50 of 110 s (about 45%). Confirmed. But in CI the whole test:racing-core step took only 72 s (run 45217820916), so removing them saves about 30-35 s per publish, not 45 s. Old files: simulation.js and track-view.js are imported only by each other, and capture.mjs is not referenced by package.json or any script. Their sizes plus racing-core/*.js and tracks/reference.json total about 507 KB, not 564 KB.

19. **Same inputs give tiny different numbers on different machines**
   - Id: RACE-18
   - Kind: risk
   - Severity: low
   - Detail: On one computer the physics gives the same result at any frame rate, which is great. But between this machine and the one that saved the reports, the last digits of some numbers differ. That is normal for single-player. It only matters later if online races assume every player's computer calculates exactly the same thing.
   - Evidence: racing-core/kart/COURSE-CHECKS.json: committed wheelRotation 9664.252837642276 vs 9664.252837642278 in my run. Similar last-digit changes in STEERING-CHECKS.md. Here Node is v22, CI uses node-version 24 (deploy.yml).
   - Why it matters: It points future online play toward a design where one place (a server or host) decides positions, rather than every device simulating on its own.
   - Suggestion: No action now. When online racing is designed, tell Codex this fact so it picks a host- or server-decides approach.
   - Verdict: confirmed
   - Verifier note: In my run, COURSE-CHECKS.json changed wheelRotation 9664.252837642276->9664.252837642278 and some pitch/bank values in the last digits. Node here is v22.23.5, and CI uses node-version 24 (deploy.yml). The cause could be the Node version rather than the hardware, but either way the same inputs don't give bit-identical results across environments.

### Missed by inspector found by skeptic

1. **Racing checks make every publish slow, including avatar-only changes**
   - Kind: opportunity
   - Severity: high
   - Detail: Every push to GitHub, from either assistant, waits about 9-10 minutes before the game updates. Most of that time is racing checks: 9 of the 11 real-browser checks are for the driving pages, plus the racing test step. So a small avatar change waits for all the racing tests. If one racing test fails, nobody's work gets published. That already happened on 23 November and made the owner wait. Each new push also cancels the one before it and restarts the wait.
   - Evidence: Step timings for CI run 45217820916: test:racing-core 72 s, build 102 s, install browsers 37 s, 'Check actual pages before publishing' 308 s. Successful runs took 6.8-11.4 min (gh api actions/runs). scripts/check-lab-foundations-browser.mjs:11-23 has 9 of 11 suites under racing-lab/tests. deploy.yml has concurrency cancel-in-progress: true, and 6 of the last 40 runs were cancelled. HANDOFF.md:88 (item 74): a Codex push cancelled Claude's run, then failed its own driving test, so the owner waited about 10 minutes.
   - Suggestion: Have the browser checks run only for the pages that changed (racing checks when racing or shared files change, avatar checks when avatar files change), or run the suites side by side. Keep everything running on a nightly or manual full check.

2. **Docs disagree on whether the approved-feel kart will ship**
   - Kind: risk
   - Severity: medium
   - Detail: The only approved driving feel (Fast, Checkpoint 2) belongs to the old test kart. One part of the kart plan says that kart is never replaced and everyone starts with it. A later note says the owner wants it only for driving tests. None of the three planned kart types (GoKart, GT, F1) has an approved feel yet.
   - Evidence: docs/KARTS.md:34-35 'The current test kart (racing-lab/src/reference-kart.js) stays as it is and is never replaced. Everyone starts with it.' vs docs/KARTS.md:95 'Owner: the old test kart is only for driving tests'. HANDOFF.md:100 (item 41) repeats 'old kart only for driving tests'. Checkpoint 2 is profile 'fast' on the Original Kart (PLAN.md:661-690).
   - Suggestion: Ask the owner one question: does the test kart ship as everyone's starter kart? Then decide which kart the first real race uses, and fix the line in KARTS.md that no longer matches.

3. **A separate block-built oval track exists at a very different size**
   - Kind: risk
   - Severity: medium
   - Detail: Besides the four racing circuits and the Neighborhood, there is a third track: a small banked oval built from the world's blocks, with grass and dirt (the Test Lab 'Oval track'). It isn't connected to the racing code, and it is sized for the avatar, not the karts. Its road is under 2 m wide, while the racing roads are 26 m wide and several km long. The plan wants race tracks built from blocks on race islands, but nobody has decided how the block world's size and the racing size fit together.
   - Evidence: src/oval.ts:1-6 ('The small NASCAR-style oval from 3D-WORLD-3 ... banked turns built up from 43 cm blocks'), :85-88 (straights 14 x 0.43 = 6.0 m, turn radius 2.6 m, road 4 x 0.43 = 1.72 m). Test Lab entry: public/test-lab/main.js:15 oval:{name:'Oval track'}. Created by Claude 17db33b (17 Nov). Racing road halfWidth 13 (26 m, about 60 blocks across). docs/WORLD-RULES.md:159 says 43 cm cubes. docs/MINIGAMES.md:54-57 says block-built race islands.
   - Suggestion: Before any track building, have the owner settle the size link between karts and blocks (how many blocks wide a race road is, and how long a race island track should be). Have Claude and Codex agree on one track format, so the oval, the circuits and future block tracks don't become three separate systems.

## Avatar and movement area (Claude-owned)
**Area summary:** The character side has strong, well-tested building blocks, but nothing a player can actually control yet. The movement foundations are still in place and all their tests pass: a 63-bone skeleton, smooth poses, reaching (IK), balance and grip, plus the walking-and-turning rules carried over exactly from 3D-WORLD-3. Walking and running were tried about seven times between 17 and 20 November, and every attempt was rejected or replaced. Since the reset on 20 November, not one commit has touched movement code. All 77 commits in this area since then went into reshaping the avatar's body (68 "New avatar" commits). There are now two avatars side by side: the official jointed avatar, which has a phone-ready copy that works with the skeleton, and a new avatar that exists only as visuals. The new one is not connected to any skeleton, has about 509,000 triangles in 27 pieces, and its final look is not yet locked in. Standard animation methods (animation clips, blending between them, IK on top) appear in the notes only as textbook ideas. Tools like Blender or Mixamo are never compared anywhere in the repo, even though a rigid ball-jointed character like this can play normal animation clips; Super Mario 64's Mario is built the same way.

### Key facts
1. Commits touching this area's folders: 197 (git log over avatar*, new-avatar, motion-*, movement, skeleton-test, foot/hand/elbow/wrist labs, walk-test, run-test, tests/avatar, avatar checkpoints). Sorting them by keywords in their titles (approximate): about 97 body shape/joints/sockets, about 48 movement/skeleton, about 43 lab setup/driving/merges, about 9 performance.
2. Movement reset commit 4348e1a was on 2026-11-20 10:10 UTC. Since then: 77 commits in this area, 0 touching motion-core (git log 4348e1a..HEAD -- motion-core is empty), and 68 commit titles starting 'New avatar'.
3. Area commits by day: 17 Nov 38, 18 Nov 46, 19 Nov 21, 20 Nov 22, 21 Nov 30, 22 Nov 28, 23 Nov 12. Every area commit on 21, 22 and 23 November is body shape, except 3 merges/driving and 1 performance commit.
4. Code lines added and deleted (js/mjs/ts, from git numstat): avatar-v2 + new-avatar 6,913 added / 1,585 deleted; motion-core 5,090 added / 2,588 deleted (about half removed in the reset); foot/hand/wrist/elbow labs 2,962 / 757.
5. Current movement on the Skeleton page: Rest, Arms out, Arms up, Wave (looping clip), Elbows bent, Kick, Knee up, Look (docs/HANDOFF.md line 11; motion-core/skeleton/poses.js). No walk, run or jump exists in the current movement code.
6. Removed walking/running code is still in git history: the last commit before the reset is 747d0ba (docs/HANDOFF.md line 16). The safety tags gait-v1-reactive-2026-11-20 and before-reset-2026-11-20 are local-only and were never pushed (HANDOFF.md line 111).
7. Official avatar: avatar/official.json, version approved-joints-2026-11-19, 28 parts, 12 balls, 24 sockets, a 3,586,000-triangle master (35.8 MB). Light copy about 261,000 triangles, Game copy 28,892 triangles (HANDOFF items 2, 6, 7, 54). The owner approved the Game copy as smooth on their phone (HANDOFF line 21).
8. New avatar (avatar-v2/, new-avatar/): visuals only, imports nothing from motion-core (new-avatar/main.js lines 18-34). Measured by running its own build functions in a scratch script: the 6 ft 4 in version has 27 pieces and 509,036 triangles (torso 76,572; each thigh 43,154; each forearm 41,630; each foot 34,790; each hand 28,034).
9. All geometry is generated by code, then baked to binary/JSON. The repo has no .glb, .gltf, .fbx, .blend or .obj files (find returned none). The parts are rigid, one per bone. Only the older avatar-lab hands use GPU skinning (avatar-lab/src/hand-skin.js); the official avatar has fingerSkin=false (avatar/ANIMATION-HANDOFF.md).
10. Owner decision, 20 Nov: keep the rigid ragdoll avatar with visible ball joints and do not switch to a skinned mesh (docs/HANDOFF.md line 19).
11. docs/game-dev/04-animation.md covers SkinnedMesh/AnimationMixer clips, blend trees, layers, root motion and IK, then concludes in section F: 'Procedural animation fits a stylized clay character... If clips are ever needed, use glTF files'. The words 'Mixamo' and 'Blender' (as an authoring tool) appear nowhere in the repo.
12. motion-core tests I ran just now, all PASS: test:skeleton (63 bones in 60 µs), test:pose (154 µs/frame), test:balance, test:reach, test:grip; test:motion-core prints its table but skips the 3D-WORLD-3 comparison ('Old reference repo not found'). git status stayed clean.
13. CI (.github/workflows/deploy.yml lines 29-37) runs test:lab-foundations, test:official-avatar, test:racing-core, build and test:lab-foundations-browser. It does not run the motion-core tests or test:new-avatar.
14. The movement rules are kept: motion-core/controller.js plus tuning.js (walk 3.1 m/s, run 8.6 m/s, fixed 1/120 s steps), recorded as matching the old 3D-WORLD-3 code exactly (motion-core/PLAN.md, Section 1).
15. The island has a collision world (src/world/collision.ts: solidAt, groundBelow, moveBox) but the Island Lab (src/island-lab.ts) only shows it with an orbit camera, with no player in it.
16. The site root (src/main.ts + src/player.ts, commit 01baada, 17 Nov, Claude) is a single-commit prototype: the 17 Nov avatar walks, runs and jumps on a slab with a follow camera, using simple sine-wave limb swing.
17. The Test Lab (public/test-lab/main.js lines 5-16) lists 14 subjects, including the older body-part studies Hands, Wrist, Elbow and Feet. The site build chains 15 per-lab builds, including run-test and walk-test (package.json 'build').
18. Planned features name about 50 distinct character movements: door, kart, swimming, items, death, skateboard, fighting, emotes, plus ledge climbing in docs/NEXT.md item 29 (15 'Movements:' lines in docs/FEATURES.md).
19. references/avatar-walk/source-walk.js holds Super Mario 64 MARIO_ANIM_WALKING channel data decoded from n64decomp/sm64. public/references/sm64-walk/walk.mp4 is a render of the Mario model ('character': 'Mario, Nintendo' in SOURCE.json). run-test/controller.js line 2 imports MatchedMotion built from that data, and both run-test and walk-test are in the published build.

### Findings

1. **After 9 working days there is still no character a player can move, and movement work has stopped since 20 November**
   - Id: CHAR-1
   - Kind: problem
   - Severity: high
   - Detail: A player still cannot walk, run and jump on the island with the current avatar and the current movement code. Rough playable prototypes do exist: the site root, the Run test, the Walk test and Codex's movement page, all using the older 17 November avatar and motions that were rejected or replaced. Since the 20 November reset, no commit anywhere in the project has touched movement. In this area, 68 of the 77 commits reshaped the New avatar and 5 made the old avatar run smoothly on phones. Elsewhere, Claude's time went mostly into kart designs. Severity is high, not critical: this is a focus problem that can be fixed, not a permanent blocker.
   - Evidence: git log 4348e1a..HEAD -- motion-core returns 0 commits; 77 area commits since the reset, 68 titled 'New avatar'. Locomotion attempts: 01baada (site root walk/run/jump, 17 Nov), 95e52ab (Codex /movement/, rejected as 'descending imaginary stairs', docs/NEXT.md line 18), b7399ac/77cc0cd (Motion Lab stages 1-2), run-test and walk-test (17-19 Nov, SM64-retargeted), 85cd602/9603ed8 (layered walk/run, 'absolutely terrible', NEXT item 45), f5b17f2 (gait.js rebuild) followed by the 4348e1a RESET (NEXT item 47). The island is view-only (src/island-lab.ts uses OrbitControls and has no player), while src/world/collision.ts already offers moveBox.
   - Why it matters: The owner's main goal is a game that actually works. Without a character to control on the island, none of the planned features (karts, swimming, minigames, fights) can be tried or tested for fun. Each extra day spent on body shape pushes the first playable moment further away.
   - Suggestion: Make the next goal one small playable slice. Put the phone-ready Game avatar on the island, using the existing movement rules, collision, controls and a follow camera, with simple idle, walk, run and jump motions that only need to be 'good enough for now'. Keep polishing the avatar's look as a separate track that does not block this. The 17 November prototype shows a rough version was a single commit.
   - Time saving: Getting a playable loop early lets the owner judge feel by playing instead of by still pictures. It also stops rounds of body tweaks that may change anyway once he moves.
   - Verdict: partly_true
   - Verifier note: Checked: git log 4348e1a..HEAD -- motion-core returns 0 commits. 77 area commits since the reset, 68 of them titled 'New avatar'. All 7 locomotion commits cited exist (01baada, 95e52ab, b7399ac, 77cc0cd, 85cd602, 9603ed8, f5b17f2), then the reset 4348e1a. Island Lab uses OrbitControls and has no player. src/world/collision.ts moveBox is used only by tests/island/solid.mjs. Two things are overstated. (1) 'No character a player can move' is not literally true. The site root (index.html -> src/main.ts + src/player.ts) still lets you walk, run and jump the 17 Nov clay avatar on a slab with a follow camera. /run-test/ ('Playable run test', joystick on phone, about 4.26 m/s), /walk-test/ and /movement/ are also still built and published (README.md line 24 calls them preserved prototypes). (2) Not all 77 commits are body reshaping. Five on 20 Nov were Skeleton-section phone work: Light copy d1e9c9b, Game copy d5a4a19, quality levels, the first-tap jolt fix and a frame-rate readout. Severity: this is about priorities and focus. It does not block the game from ever working, so high fits better than critical. Project-wide since the reset (non-merge commits): Claude made 68 New-avatar, 26 kart and 11 docs commits; the owner's account made 12 driving and 8 kart commits; zero commits touched character locomotion.

2. **The avatar has been rebuilt many times, and the newest version is a heavy, still-image-only model with no skeleton**
   - Id: CHAR-2
   - Kind: problem
   - Severity: high
   - Detail: I count about nine avatar versions or approaches. There are four main generations: the 17 November clay avatar, Checkpoint 2 with new feet, the official jointed avatar from 19 November, and the New avatar. The New avatar has itself restarted three times: first arms with a new elbow (rejected as 'looks really bad'), then a fully socketed body (rejected as 'nothing like I envisioned'), then the current build from the original limbs. There were also two rejected experiments (an outer skin and a cylinder version) and two lighter copies made for phones. The current New avatar is marked 'visuals only, clean rebuild after approval'. It cannot move, because it is not attached to the skeleton, and it is about 17 times heavier than the phone copy the owner approved as smooth. The owner said 'I think I want to lock this in', but that lock-in is not confirmed.
   - Evidence: Versions: avatar/APPROVED.json (17 Nov), checkpoints/avatar-2 (17 Nov), avatar/official.json + checkpoints/avatar-joints-1 (19 Nov; commits bff65e4 'Add the approved continuous arcade skin' then b2f0fdf 'remove the outer skin'; 'Cylinder experiment rejected'), Light/Game copies (d1e9c9b, d5a4a19), New avatar routes in docs/HANDOFF.md items 11-12, 41-42, 63-79. The New avatar imports no motion-core code (new-avatar/main.js lines 18-34). Measured: 27 pieces, 509,036 triangles, versus the Game copy's 28,892 (HANDOFF item 54). Codex's suggested phone budget is 20,000-30,000 (HANDOFF line 109). HANDOFF item 78: lock-in 'not yet confirmed'. Joint positions moved away from the skeleton (HANDOFF items 23, 29, 77, 79: shoulder 9.5 cm out, wrist 5 cm deeper, legs longer).
   - Why it matters: Every restart throws away earlier choices and makes the owner choose again. Even after this version is approved, it still needs a cleanup rebuild, a much lighter version for phones, new skeleton measurements and bending tests before it can walk. That is a lot of hidden work still ahead.
   - Suggestion: Ask the owner to decide plainly which avatar the game uses for now, and freeze it as a checkpoint. Then fix the joint positions (where each ball sits) and treat the shapes as swappable 'skins' on the same skeleton. Because every part rides rigidly on one bone, new shapes can be dropped in later without redoing the movement. Build a phone-weight version straight away, so looks are judged at the size the game will really use.
   - Time saving: Separating 'where the joints are' from 'what the parts look like' lets movement work start now and lets body polish continue without blocking it.
   - Verdict: confirmed
   - Verifier note: I re-ran the New avatar's own build functions (separatedOriginalBody ... assembledSockets, cylinderNeck, longerLegs from avatar-v2/original-body.js) in a scratch script and got exactly 27 pieces and 509,036 triangles. Torso 76,572; thigh 43,154; forearm 41,630; foot 34,790; hand 28,034. The Game copy has 28,892 (avatar/assembled-joints/game.json), so the New avatar is 17.6 times heavier. One New-avatar hand (28,034) is almost the whole Game body, and game.json budgets a hand at 2,000. new-avatar/main.js imports nothing from motion-core. HANDOFF items 12 ('looks really bad') and 42 ('nothing like I envisioned') confirm the restarts. Item 78 says lock-in is not yet confirmed. Item 72: even after baking, the page takes 17.9 s and 112 MB on a 4x-slowed phone. Shoulder 9.5 cm out (item 24), legs lengthened (item 77). The skeleton was measured from the Checkpoint 2 avatar (motion-core/skeleton/bones.js header), and test:skeleton checks that it 'matches the live avatar'. So attaching the New avatar means refitting the skeleton and its test baselines, which makes the 'swappable skins' suggestion harder than it sounds. Newer state: remote main is 5 commits ahead of this checkout. It removed 'Our avatar' from the Test Lab menu and the New avatar page (commits 4ba8cd0 and 59402a2), and its new docs/AVATAR-POLISH-LIST.md gives the prototype as 'about 517,000 triangles'.

3. **Every movement is hand-coded one at a time, but about 50 movements are planned, and standard animation tools were never compared**
   - Id: CHAR-3
   - Kind: risk
   - Severity: high
   - Detail: Right now each movement is built from math by an AI, one at a time, and the owner checks it by eye. That produced eight approved poses and a wave in about a week, and no accepted walk. The feature plans name about 50 movements (swimming, climbing, skateboarding, punches, kart entry, emotes and more). The usual way small teams get many movements is to use ready-made or hand-made animation clips, mix them by speed, and add foot and hand corrections on top. The project's own notes describe that method but set it aside because 'procedural fits a clay character'. Tools like Blender (where you shape poses by hand) and Mixamo (a free library of motions) are never mentioned. The rigid ball-joint style does not rule this out: Mario in Super Mario 64 is also made of rigid parts on bones and plays normal clips. This project already loaded a clip onto its own avatar once, using Mario's walk, which proves it can be done technically.
   - Evidence: docs/game-dev/04-animation.md sections A-D (clips, blend trees, layers, IK) and F ('Procedural animation fits a stylized clay character... If clips are ever needed, use glTF files'). A grep for mixamo/blender across docs and code finds only an unrelated bowling-simulation link (docs/game-dev/14-sources.md line 51). The SM64 rigid-segment model is described in references/sm64-walk/README.md ('20 animated nodes and 15 visible body parts'). A clip retarget onto this avatar already exists in references/avatar-walk/retarget.js and matched.js. The existing pose player already supports keyframe clips (motion-core/skeleton/pose.js, createClip in poses.js). docs/FEATURES.md has 15 'Movements:' lines. HANDOFF line 19 records the owner's no-skinned-mesh decision.
   - Why it matters: At the current pace, building 50 movements by math one at a time would take a very long time and could run into the same 'looks wrong' problem each time. Clips let the owner judge a motion quickly and swap it out cheaply.
   - Suggestion: Before building the next movement, do the research-and-compare step the owner's own rules ask for. Compare three options: (1) keep everything math-built; (2) keyframe clips (short lists of poses with timing) made with the AI or in a simple tool, played by the existing pose player; (3) licensed motion-capture or library clips retargeted onto the rigid skeleton. Then layer the existing IK, balance and grip code on top of the clips. Keep the rigid ball-joint look; it works with every option.
   - Time saving: Reusing clips and blending them by speed is how solo developers cover dozens of movements. It could turn each new movement into hours of work instead of days of rebuilding.
   - Verdict: confirmed
   - Verifier note: I grepped the repo for mixamo and blender (excluding node_modules and .git). The only hit is the unrelated bowling link at docs/game-dev/14-sources.md:51. There are no .glb, .gltf, .fbx, .blend, .obj, .bvh or .vrm files. docs/game-dev/04-animation.md lines 56-59 (section F) say 'Procedural animation fits a stylized clay character... If clips are ever needed, use glTF files with an AnimationMixer'. The pose player supports keyframe clips (createClip in motion-core/skeleton/pose.js line 104, Catmull-Rom). FEATURES.md has 15 'Movements:' lines, which adds up to roughly 45-50 movements. One nuance supports the finding: a clip approach was actually built and made playable. On 17 Nov, run-test/controller.js used MatchedMotion (the SM64 walk clip retargeted to this avatar, with contact-fixed feet) and was playable on phones. It was later replaced by the procedural approach, and no verdict comparing the two was ever written down.

4. **The game's fast speeds and the 'feet must never slide' rule do not fit this character's short legs**
   - Id: CHAR-4
   - Kind: risk
   - Severity: high
   - Detail: The movement speeds were copied from the old game: walking up to 3.1 m/s and running up to 8.6 m/s. The avatar's legs are short. To keep each foot pinned to the ground at those speeds, the feet would have to step about 5 to 8 times a second, which looks frantic. When the rule was relaxed, the feet visibly skated. The project's own measurements found this clash, and the owner chose to keep both the speeds and the avatar. The rule against sliding feet was the owner's request, but even the Super Mario 64 walk the project studied does not pin its feet; it simply speeds the animation up with the character's speed. The current New avatar is also measured as short-legged.
   - Evidence: docs/NEXT.md item 42(a): 'the game's speeds (walk push up to 3.1 m/s, full run 8.6 m/s) are far beyond what these short legs (0.68 m) can do... about 4.7 steps a second at 3.1 m/s, 6.7 at 6.8 m/s and 7.6 flat out'. Item 46(b): planted feet skate at 40%-60% of body speed when running. Item 2: 'No gliding or sliding.' Item 43(b): do not slow speeds or change the avatar. references/sm64-walk/README.md: 'forward speed 12 gives animation advance 12/4 = 3 source frames' and 'No planted-foot solver... applied'. HANDOFF item 76: New avatar thigh at 0.196 of height versus a real-life 0.245, about 20% short.
   - Why it matters: As long as these goals contradict each other, any walk or run will look wrong in some way. That likely explains part of why every attempt was rejected, and it will keep causing rejections until one of the three gives way.
   - Suggestion: Show the owner the trade-off in plain terms and let them pick: lower the top speed, give him longer legs, or accept a little foot sliding at high speed as classic games do. The middle ground is to keep feet pinned at slow speeds and let the animation speed up with the character at fast speeds.
   - Time saving: Settling this conflict before the next walk attempt avoids an eighth rejected try.
   - Verdict: confirmed
   - Verifier note: docs/NEXT.md item 42(a) (line 400) gives the exact numbers quoted: 0.68 m legs, 4.7, 6.7 and 7.6 steps per second. Item 46(b) records planted feet skating at 40-60% of body speed when running. Item 43(b) says do not slow the speeds or change the avatar. NEXT item 2 says 'No gliding or sliding', and docs/AVATAR-DIRECTION.md (CLAUDE.md rule 15) still says to avoid sliding. motion-core/tuning.js has walkSpeed 3.1 and runSpeed 8.6. avatar-v2/our-avatar-sizes.json gives joint-to-joint thigh 0.367 plus calf 0.309, which is 0.676 m. references/sm64-walk/README.md has 'No planted-foot solver' and the speed-scaled animation advance. HANDOFF item 76: thigh at 0.196 of height versus 0.245 in real life. Even after the 6 ft 4 in stretch, the New avatar's legs are only about 0.74 m. One caution: the link between this conflict and the rejections is the inspector's inference, not a recorded reason. The owner did accept a quick, cartoon gait on 20 Nov (43b).

5. **Nintendo's Super Mario 64 animation data and Mario renders are in the public repo and on the published pages**
   - Id: CHAR-5
   - Kind: risk
   - Severity: high
   - Detail: To study a classic walk, the project decoded Mario's walking animation from a fan reverse-engineering of Super Mario 64 and saved the numbers in the repo. It also published a video of Mario's own model walking. The live Run test and Walk test pages are built on that Mario data. The repo is public and the pages are on GitHub Pages, so anyone can see and download this. This belongs to Nintendo, which is known for protecting its characters.
   - Evidence: references/avatar-walk/source-walk.js line 1 ('Original SM64 walking channels') with source n64decomp/sm64 revision 9921382a; public/references/sm64-walk/SOURCE.json ('character': 'Mario, Nintendo', 'render_note': 'Original geometry and walk joint channels'); walk.mp4 857 KB; public/references/motion-compare/comparison.mp4 (commit d452192 'Match avatar and Mario poses'); run-test/controller.js line 2 imports MatchedMotion from references/avatar-walk/matched.js; walk-test/controller.js line 1 imports run-test; both appear in the package.json build chain. Added in commits 7e910f0 (Codex) and ddc65ca/d452192 (17 Nov).
   - Why it matters: A takedown or legal complaint could hit the whole public repo and website, including the owner's own work. It also undercuts the owner's wish to protect their original idea, because it mixes someone else's property into it.
   - Suggestion: Have the legal/business review decide on this soon. The likely safe step is to remove the Mario-derived files and videos from the published site and from the repo going forward, and to keep any study material private. Future movement references should use the owner's own recordings, or clips with a clear license.
   - Verdict: confirmed
   - Verifier note: public/references/sm64-walk/SOURCE.json has 'character': 'Mario, Nintendo' and 'render_note': 'Original geometry and walk joint channels'. walk.mp4 is 857,055 bytes. references/avatar-walk/source-walk.js line 1 reads 'Original SM64 walking channels', from n64decomp/sm64 revision 9921382a. run-test/controller.js line 2 imports MatchedMotion from references/avatar-walk/matched.js, and walk-test/controller.js line 1 imports run-test. Both are in the build chain, and public/ is copied into the published site. README.md line 24 links the Mario motion comparison on the live site. The commits are 7e910f0 (Codex) plus ddc65ca and d452192, which were made under the owner's git account. The finding misses that the same material is also inside the frozen checkpoint (see the missed items), so removing it is not as simple as the suggestion implies.

6. **The quickest route to 'walk, run and jump on the island' mostly reuses parts that already exist**
   - Id: CHAR-O1
   - Kind: opportunity
   - Severity: high
   - Detail: Most ingredients for walking and running on the island already exist and only need joining: the movement rules, island collision, controls, the phone-ready Game avatar and the pose player. The movement rules cover flat ground only. They have no jumping, falling or collision yet, so the jump has to come from the rough 17 November prototype (which uses different speeds) and be joined to the island's collision code, which no character uses yet. The blocks took about four days to build, not months. The owner's current agreed plan is to bring back walking and running in place on the Skeleton page first, so the island slice is a recommendation for the owner to decide on.
   - Evidence: motion-core/controller.js + tuning.js; src/world/collision.ts (moveBox: 'slides along walls, steps up low ledges, lands on floors'); src/input.ts and motion-lab/src/input.js; avatar/src/light-avatar.js loadGameAvatar; motion-core/skeleton/pose.js (transitions, layers, Catmull-Rom clips); src/player.ts (jumpHeight 1.1, coyoteTime, jumpBuffer, follow camera in src/main.ts; one commit, 01baada).
   - Why it matters: A playable island loop is the foundation every other feature depends on, and it seems to be much closer than the recent body-shaping work suggests.
   - Suggestion: Plan one chunk: the Game avatar on the island, with the existing movement rules, collision, controls and camera. Add idle, walk, run and jump as short pose clips (playing faster as he speeds up), and treat looks as placeholders. Then improve the motions one at a time, using the owner's playtesting as the guide.
   - Time saving: It reuses months-worth of building blocks instead of writing new ones, and gives the owner something to play right away.
   - Verdict: partly_true
   - Verifier note: The ingredients exist: motion-core/controller.js plus tuning.js, src/world/collision.ts moveBox, shared input, loadGameAvatar, and the pose player with clips and layers. Gaps the finding glosses over: (1) motion-core/controller.js line 1 says 'Ground movement only (no jumps yet)'. It has no gravity, no jump and no collision hook. The only jump code is the 17 Nov src/player.ts (jumpHeight 1.1, coyoteTime), which uses different speeds (runSpeed 6 versus 8.6). (2) moveBox is used by no character, only tests/island/solid.mjs. (3) 'Months-worth of building blocks' is wrong: the repo spans 4-23 Nov, and these blocks were built in about 4 days (17-20 Nov). (4) The owner's confirmed plan (HANDOFF line 15, item 1) is 'walking and running come back in place first' on the Skeleton page, so an island slice is a recommendation to put to the owner, not the agreed next step.

7. **Small 'a bit bigger / a bit deeper' changes each cost a full round trip of about 10 minutes**
   - Id: CHAR-6
   - Kind: problem
   - Severity: medium
   - Detail: Many recent changes were small 'bigger' or 'deeper' requests with no amount given. Claude guessed an amount, pushed, and the site took about 9-10 minutes to publish (measured from GitHub's run list) before the owner could look again. The hip ball alone went 40%, 45%, 54%, 63%, then 80% deep over at least four rounds. HANDOFF records Claude choosing the amount 10 times ('Claude's pick' or 'Claude picked') and uses the word 'deeper' 26 times.
   - Evidence: docs/HANDOFF.md items 57-59 (HIP_TORSO_PRESS 0.54, then 0.63, then 0.803; commits 6cfb0b8, f5071bd, 4894560); 'Claude's pick' appears 10 times and 'deeper' 13 times in HANDOFF.md; item 74: 'every push from either of us restarts the ~10-minute publish, and a failing test blocks everyone's changes'.
   - Why it matters: These loops use up the owner's time and AI usage on choices the owner could make in seconds by eye.
   - Suggestion: Give the owner a tuning panel with sliders on the avatar page (ball depth, limb thickness, leg length). The owner can drag until it looks right, then copy the numbers into a message so they become the saved values. That keeps the owner's taste in charge without a code change for every nudge.
   - Time saving: It could replace several round trips (each about 10 minutes of publishing, plus AI usage) with one slider session.
   - Verdict: partly_true
   - Verifier note: The core holds. HANDOFF item 74 (line 88) describes the roughly 10-minute publish and pushes cancelling each other. gh run list shows push-to-live times of about 9-10 minutes (for example, pushed 16:33:21 and Pages deployed 16:43:10), a Codex run cancelled at 06:50 and a failed run at 05:25. Some counts are wrong, and the real numbers make the point stronger. The hip-ball depth went 25 (shoulder) ... 40% -> 45% -> 54% -> 63% -> 80.3% over at least four separate rounds, not three. 'Claude's pick' appears 7 times; adding 'Claude picked' (3) gives 10. 'deeper' appears 26 times in HANDOFF.md, not 13.

8. **Many old character test pages are still built, published and listed**
   - Id: CHAR-7
   - Kind: problem
   - Severity: medium
   - Detail: This area has 17 folders. Many are old studies the owner no longer uses: the old walk and run tests, Codex's movement test, the Motion Lab, the separate hand, foot, wrist and elbow studies, and the old avatar viewers. They are still built on every publish, and four of them (Hands, Wrist, Elbow, Feet) still show in the Test Lab menu. The README itself says they are historical.
   - Evidence: package.json 'build' chains 15 per-lab builds, including build:run-test, build:walk-test, build:hand-lab, build:foot-lab, build:wrist-lab, build:elbow-lab and build:avatar-lab. public/test-lab/main.js lines 11-14 register hands, wrist, elbow, feet. README.md section D.2 says walk-test, run-test and movement 'preserve earlier prototypes'. avatar-lab/README.md calls itself a 'Historical hand/foot authoring viewer'. Note: HANDOFF line 110 says racing-lab imports motion-lab/src/page.js, so motion-lab cannot simply be deleted.
   - Why it matters: Extra pages slow every build and publish, confuse new AI sessions about what is current, and make it easier to edit the wrong thing.
   - Suggestion: Move finished studies into frozen checkpoints only, take them out of the main build and the Test Lab menu, and keep one clear 'current avatar' and one 'current movement' page. Check what other pages import first (for example, racing-lab uses motion-lab).
   - Time saving: Shorter builds and less reading for each new AI session.
   - Verdict: confirmed
   - Verifier note: package.json 'build' chains 15 per-lab builds, including hand-lab, foot-lab, wrist-lab, elbow-lab, avatar-lab, run-test and walk-test. vite.config also builds /movement/. public/test-lab/main.js lines 11-14 register hands, wrist, elbow and feet among 14 subjects. README.md line 24 calls walk-test, run-test and movement preserved prototypes. 'Slows every build' was not measured; I did not run the build, because it rewrites tracked files. The caveat about racing-lab importing motion-lab is correct but incomplete: several current pages import from the 'old' folders (see the missed items).

9. **Movement and New-avatar tests are not part of the automatic publish checks**
   - Id: CHAR-8
   - Kind: risk
   - Severity: medium
   - Detail: The skeleton, pose, reach, balance and grip tests, and the New avatar checks, only run when someone remembers to run them. The automatic checks before publishing cover only the official avatar, the shared lab foundations and racing. Someone could break the movement foundations without anyone noticing.
   - Evidence: .github/workflows/deploy.yml lines 29-37 run test:lab-foundations, test:official-avatar, test:racing-core, build and test:lab-foundations-browser. package.json defines test:skeleton, test:pose, test:balance, test:reach, test:grip and test:new-avatar, none of which CI runs. I ran the five motion-core tests and they currently pass (each takes about a second or less to report).
   - Why it matters: These foundations are the most valuable movement work left after the reset. Silent breakage would cost a lot of time to track down later.
   - Suggestion: Add the fast motion-core tests (skeleton, pose, balance, reach, grip) to the automatic checks. They are quick and protect the foundation the game will need.
   - Time saving: Catches breakage at the moment it happens, instead of days later.
   - Verdict: confirmed
   - Verifier note: .github/workflows/deploy.yml lines 29-37 run only test:lab-foundations, test:official-avatar, test:racing-core, build and test:lab-foundations-browser. scripts/check-lab-foundations-browser.mjs has 11 suites, none for the Skeleton or New avatar pages. test:lab-foundations includes motion-lab input tests but no motion-core tests. I ran test:skeleton (PASS, 50 µs), test:pose (PASS, 149 µs/frame), test:balance, test:reach and test:grip (all PASS). test:motion-core skips its 3D-WORLD-3 comparison. git status stayed clean.

10. **The current New avatar has not been tested bending, and earlier tests showed the limbs collide early**
   - Id: CHAR-9
   - Kind: risk
   - Severity: medium
   - Detail: The current New avatar was judged only standing still. When an earlier version was bent at the elbow, the thick limbs touched at about 75 to 85 degrees unless the inside of the arm was specially carved. The owner has put off the elbow carving for later. A body that looks right standing may not survive throwing, crouching or sitting.
   - Evidence: docs/HANDOFF.md item 40 (plain sockets let the limbs touch at about 85°), item 48 ('golden' version touches at 75° without shaping), item 75(c)-(d) (overlap accepted; cutting the elbow front 'so it can reach 90 degrees' deferred), item 41 (the rejected socketed body was checked bending every 2°; the current route, items 63-79, is 'visuals only').
   - Why it matters: The owner's game goal is heavy, physical throws, shots and ragdoll falls. If the body cannot bend far enough, the shapes will have to be reworked again after movement starts.
   - Suggestion: Before locking in the look, pose the New avatar in a few key positions (arms up, deep crouch, sitting, wind-up to throw) and show those pictures to the owner. Fix any collisions while the shapes are still easy to change.
   - Time saving: Finding bending problems now avoids another reshape after animation work has started.
   - Verdict: confirmed
   - Verifier note: HANDOFF item 40 (line 54): plain sockets let the limbs touch at about 85°. Item 48 (line 62): the 'golden' version touches at 75° without shaping. Item 75(c)-(d) (line 89): overlapping cups are accepted, and cutting the front of the arm 'so it can reach 90 degrees' is deferred, which implies the current arm cannot cleanly reach 90°. The current route (items 63-79) is marked 'Visuals only' and has no bend checks. The owner's acceptance of overlap (75c) softens this a little, so medium is right.

11. **The project logs are so long that every new AI session spends a lot of usage just reading them**
   - Id: CHAR-10
   - Kind: problem
   - Severity: medium
   - Detail: The handoff and movement logs record every decision in great detail, which is good for honesty. But they have become very long, and a big part of them describes code that no longer exists. Every new session is told to read them first.
   - Evidence: docs/HANDOFF.md is 186 lines but about 30,500 tokens (Read tool cap warning); docs/NEXT.md is 511 lines; HANDOFF line 117 says 'Items 41 to 46 describe code that no longer exists'; CLAUDE.md tells a new session to read docs/HANDOFF.md first.
   - Why it matters: The owner's top priority is not wasting usage, and these long files use up part of every session before any work starts.
   - Suggestion: Keep a short 'current state' page of one screen (which avatar, what moves, what is next, open decisions) and move the full history into an archive file that is read only when needed.
   - Time saving: Less usage spent at the start of every session.
   - Verdict: confirmed
   - Verifier note: docs/HANDOFF.md is 185 lines but 78,920 bytes (roughly 20-30k tokens), almost all of it per-tweak avatar logs (items 11-79). docs/NEXT.md is 41,161 bytes and motion-core/PLAN.md 44,028 bytes. CLAUDE.md tells every new session to read HANDOFF first. HANDOFF line 117 says NEXT items 41-46 describe code that no longer exists. HANDOFF also numbers items 36-43 twice (avatar items, then kart items at lines 95-102), so references like 'item 40' are ambiguous. The owner's stated top priority is not wasting usage, and the file grows by a paragraph with every tweak, so medium fits better than low.

12. **Strong, fast and well-tested movement foundations survived the reset**
   - Id: CHAR-S1
   - Kind: strength
   - Severity: medium
   - Detail: The reset removed walking and running, but kept the core parts any movement will need: a detailed skeleton with joint limits, a pose player that blends smoothly and can play short clips, exact reaching for hands and feet, balance (where the body's weight is), and finger gripping. They are fast enough for every frame and each comes with automatic checks. The walking and steering rules were carried over exactly from the old game.
   - Evidence: I ran test:skeleton (PASS, 63 bones in 60 µs), test:pose (PASS, 154 µs/frame), test:balance (PASS), test:reach (PASS, 59 µs for both feet and a hand), test:grip (PASS, 214 µs per hand). motion-core/PLAN.md Section 1 says the controller matches the old 3D-WORLD-3 code '0.000 mm... on all 10 scripted stick tests'.
   - Why it matters: These are the hardest technical parts to get right. Whatever animation method is chosen next, they can be reused for IK and balance on top of clips.
   - Suggestion: Build the next step on top of these instead of starting over, and protect them with automatic checks (see CHAR-8).
   - Time saving: Avoids rebuilding the skeleton, reaching and balance a second time.
   - Verdict: confirmed
   - Verifier note: I ran all five tests: skeleton PASS (63 bones, 50 µs), pose PASS (149 µs/frame), balance PASS (8.3 µs), reach PASS (56 µs), grip PASS (329 µs per hand). motion-core/PLAN.md lines 49-50 record a 0.000 mm match on 10 stick tests. That match cannot be re-checked now, because test:motion-core prints 'Old reference repo not found: comparison skipped'. The pose library also still holds 7 poses that are not shown on the page, including a throwing 'wind-up' and a 'turn' (motion-core/skeleton/poses.js).

13. **A phone-ready avatar already exists and the owner approved it as smooth**
   - Id: CHAR-S2
   - Kind: strength
   - Severity: medium
   - Detail: The official jointed avatar has a light 'Game' copy at about 29,000 triangles. It works with the skeleton and poses, and the owner tested it on their own phone and called it very smooth. This model could be the stand-in player character right away.
   - Evidence: docs/HANDOFF.md line 20 (Game copy, LIGHT_MODE=game node scripts/build-light-avatar.mjs) and line 21 ('Chunk 1 approved on the owner's phone: Game on High quality is very smooth... Game is the working avatar for movement work'); 28,892 triangles (HANDOFF item 54); avatar/assembled-joints/game-cca1d05f83501637.bin.gz is 2.0 MB.
   - Why it matters: It removes the need to wait for the New avatar before building the first playable version.
   - Suggestion: Use the Game copy as the player in the first playable island test, and swap in the New avatar later once it has its own phone-weight version and skeleton fit.
   - Time saving: Movement work can start now instead of after the New avatar is finished.
   - Verdict: confirmed
   - Verifier note: HANDOFF lines 20-21 (items 6-7) say the Game copy was approved as very smooth on the owner's phone and is 'the working avatar for movement work'. game.json gives 28,892 triangles; game-cca1d05f83501637.bin.gz is 2,024,813 bytes. skeleton-test/main.js imports loadGameAvatar. Note: newer remote commits removed 'Our avatar' from the Test Lab menu (59402a2). The Skeleton section still has the Game copy, but the owner's attention is moving to the New avatar.

14. **The rigid ball-joint style fits ragdoll physics, cheap drawing and standard clips**
   - Id: CHAR-S3
   - Kind: strength
   - Severity: low
   - Detail: The owner chose a mannequin made of hard parts joined by visible balls. Each part maps neatly onto one physics body for ragdoll falls and hits, which the game wants. Drawing it is cheap, because nothing has to stretch. It can also play ordinary animation clips, just as rigid-part classics like Super Mario 64 do.
   - Evidence: docs/HANDOFF.md line 19 (rigid ragdoll avatar is central to throws/shots); avatar/ANIMATION-HANDOFF.md ('Each ball rides on the bone whose head is the joint'); references/sm64-walk/README.md ('20 animated nodes and 15 visible body parts'); docs/NEXT.md item 31 (ragdoll when a kart hits someone). package.json has no physics engine yet (dependencies: three, cdt2d).
   - Why it matters: It is a good, distinctive choice that does not lock the project out of any proven animation method.
   - Suggestion: Keep it, and when ragdoll falls come up, compare ready-made web physics engines rather than writing physics from scratch.
   - Verdict: confirmed
   - Verifier note: HANDOFF line 19 (item 5): keep the rigid ragdoll avatar, no skinned mesh. avatar/ANIMATION-HANDOFF.md line 36: 'Each ball rides on the bone'. package.json dependencies are only three and cdt2d, so there is no physics engine. 'Cheap to draw' refers to having no skinning. It does not hold for triangle count: the current New avatar is 509k triangles.

15. **Work is recoverable and carefully measured**
   - Id: CHAR-S4
   - Kind: strength
   - Severity: low
   - Detail: Nothing important has been lost: removed movement code is in the history, and approved avatars are frozen with fingerprints that prove they have not changed. The avatar work measures sizes, gaps and smoothness with numbers, includes tests that check the tests themselves, and writes down honest 'known limits'. A heavy page was fixed by doing the slow shape-building once at build time, cutting its loading time from about 29 seconds to about 6.
   - Evidence: Commit 747d0ba (last state before the reset); checkpoints/avatar-joints-1/*.json with SHA-256 pins; avatar/APPROVED.json; 13 avatar-v2/check-*.mjs scripts; docs/HANDOFF.md item 72 (bake-torso-sockets.mjs: 29 s down to 6.2 s on a computer, 17.9 s on a 4x-slowed phone). One gap: the gait-v1 and before-reset tags were never pushed (HANDOFF line 111).
   - Why it matters: It protects the owner's past work and makes it safe to try bolder changes.
   - Suggestion: Push any safety tags that matter, or note in the docs that commit 747d0ba is the official record, so a lost laptop cannot erase that history.
   - Verdict: confirmed
   - Verifier note: git merge-base shows 747d0ba, f5b17f2 and 9603ed8 are all ancestors of HEAD, and origin/main contains 747d0ba. So the removed walk/run code is already safe on GitHub, and the unpushed tags do not matter much. Those tags are not in this clone at all (git tag lists none of them), so 'push the tags' cannot be done from here. There are 13 avatar-v2/check-*.mjs scripts. HANDOFF item 72 (line 86): 29 s down to 6.2 s on a computer and 17.9 s on a 4x-slowed phone. checkpoints/avatar-joints-1/CHECKPOINT.json has SHA-256 pins.

### Missed by inspector found by skeptic

1. **The 'old' test folders are still wired into the current pages**
   - Kind: risk
   - Severity: medium
   - Detail: Several folders the docs call historical are still used by live pages. The current Skeleton section takes its body builder, chest bending and hand code from the old avatar viewer folder. The Movement rules page takes its controls from Codex's rejected movement test. The Run and Walk tests borrow code from the movement test and the hand study. Deleting or freezing these folders without untangling them first would break the Skeleton page and the Movement rules page.
   - Evidence: skeleton-test/attach.js lines 20-22 import ../avatar-lab/src/chest-bend.js, hand-skin.js and avatar.js (createAssembledAvatar used at line 26, createSkinnedHands at line 62). motion-core-test/main.js imports ../movement/input.js. run-test/controller.js imports solveLeg from ../movement/controller.js. walk-test/motion.js imports ../hand-lab/src/hand-rig.js. movement/controller.js imports ../avatar-lab/src/avatar.js. avatar-lab/README.md calls itself a 'Historical' viewer.
   - Suggestion: Before any cleanup, move the few shared pieces (body builder, chest bend, hand skin, input) into one clearly named shared folder. Then retire the old pages.

2. **Built pages are saved into the code history, so every build rewrites tracked files**
   - Kind: problem
   - Severity: medium
   - Detail: Eleven lab pages are stored in git as finished, compressed bundles that each carry a full copy of three.js, about 0.5 to 0.8 MB each. Building the site rewrites them, so almost every change shows up as huge file edits. Both assistants touch the same generated files, which invites clashes, and the repository has grown large. The handoff already warns that building can modify Codex's files.
   - Evidence: git ls-files lists skeleton-test/index.html (622,233 bytes), run-test (829,729), walk-test (833,315), hand-lab (790,564), avatar-lab (817,830), avatar-test, foot-lab, wrist-lab, elbow-lab, motion-lab and motion-core-test index.html as tracked. .gitignore lists only node_modules, dist, .vite and .test-results. skeleton-test/index.html changed in 51 of 52 skeleton-test commits. motion-core-test/build.mjs writes motion-core-test/index.html as well as dist/. git count-objects: size-pack 164.33 MiB. HANDOFF line 114 (practical note 1) warns that builds modify tracked files.
   - Suggestion: Have each lab build write only into the dist folder that gets published, and stop tracking the generated index.html files (frozen checkpoints can stay as they are).

3. **The Mario material is also inside a frozen checkpoint and the git history, so removing it is not simple**
   - Kind: risk
   - Severity: medium
   - Detail: Besides the public reference pages, the Mario-derived motion is baked into the frozen Test Lab checkpoint: its Run and Walk test copies and a Mario comparison video. The project's rules say frozen checkpoints must never change. Deleting the files now would also leave them in the public history. So any clean-up needs an owner decision on the checkpoint rule and possibly a history rewrite, which is a bigger step than the CHAR-5 suggestion implies.
   - Evidence: checkpoints/test-lab-1/references/motion-compare/side.mp4; checkpoints/test-lab-1/run-test/index.html and walk-test/index.html match 'Mario|SM64'. CLAUDE.md rule 17: 'Keep frozen files and checkpoint tags unchanged'. Also published: public/references/motion-compare/ (about 13 MB of videos and GIFs), public/references/avatar-walk/, public/references/sm64-walk/.
   - Suggestion: Raise it with the legal and business review as one decision: what to remove from the live site, whether the checkpoint may be edited, and whether the history needs cleaning.

4. **This snapshot is behind: the owner has since dropped the phone-ready avatar from the Test Lab**
   - Kind: risk
   - Severity: medium
   - Detail: Remote main has 5 newer commits than the checkout that was audited. At the owner's request, the approved avatar ('Our avatar', whose Game copy is the phone-ready model) was removed from the Test Lab menu and from the New avatar page, and the Test Lab now opens on the New avatar. A new polish list started piece-by-piece reviews of the New avatar, now about 517,000 triangles. Body polishing is speeding up while the only model that can move is being retired from view.
   - Evidence: gh api commits on main: 4ba8cd0 (17:34Z) 'New avatar: torso split at the waist (6 ft 4 in), Our avatar removed from the page'; 59402a2 (17:45Z) 'Test Lab: Our avatar removed from the test menu; New avatar opens first'; 0723559 and 8afe021 add docs/AVATAR-POLISH-LIST.md ('the prototype is about 517,000 triangles'). Local HEAD is cb77276 (08:50Z).
   - Suggestion: The lead should note that the findings come from a snapshot a few hours old. The case for using the Game copy as a stand-in player should be put to the owner soon, before it slips further out of use.

5. **An animation-clip approach was tried and made playable on 17 November, but nobody wrote down why it was dropped**
   - Kind: problem
   - Severity: low
   - Detail: The Run test played a real walk clip (Mario's, adapted to this avatar's proportions) with fixed foot contacts and a phone joystick. Then the project moved on to math-built movement. No note records what the owner thought of it, or why clips were abandoned, so the main comparison the owner's rules ask for is missing from the record.
   - Evidence: run-test/README.md ('Playable run test ... uses the current reviewed motion from MatchedMotion: the original source step sequence retargeted to the saved avatar proportions'); commits eb75599 'Make the reviewed avatar run playable on mobile' and ca823ec 'Add a separate grounded walking test' (17 Nov). grep of docs/ for run-test or walk-test finds only README.md line 24 ('preserve earlier prototypes').
   - Suggestion: Before the next movement attempt, ask the owner how the Run test felt compared with the later attempts, and write the answer down. It is cheap evidence for choosing between clips and math-built motion.

6. **The movement rules have no jumping, gravity or collision**
   - Kind: risk
   - Severity: medium
   - Detail: The tested movement rules only handle running around on flat ground. Jumping, falling, landing and bumping into the island's blocks are not in them. Jumping exists only in the rough 17 November prototype, which uses different speeds. This is real work still needed before 'walk, run and jump around an island' is possible.
   - Evidence: motion-core/controller.js line 1: 'Ground movement only (no jumps yet)'; no wall, collide or ground handling in controller.js. motion-core/PLAN.md: 'Running, jumps and other SM64 moves come after'. src/player.ts TUNING: runSpeed 6, jumpHeight 1.1, coyoteTime 0.1, versus motion-core/tuning.js runSpeed 8.6. src/world/collision.ts moveBox is referenced only by tests/island/solid.mjs.
   - Suggestion: Include jump, gravity and the island collision in the first playable chunk, reusing the prototype's jump code and the existing moveBox.

7. **The pose code still holds a throwing wind-up and other poses that are not on the page**
   - Kind: strength
   - Severity: low
   - Detail: The reset cut the page down to 8 buttons, but the pose library kept 7 more poses, including a 'wind-up' that is the start of a throw, a turn, reaching, a shrug and chest bends. These are a head start for the throwing goal.
   - Evidence: motion-core/skeleton/poses.js POSES holds shrug, reach, leg-side, chest-bend, chest-twist, wind-up and turn alongside the 8 page poses; skeleton-test/shell.html line 26 shows only the 8 buttons.
   - Suggestion: When throwing comes up, start from the existing wind-up pose instead of building one from scratch.

## Idea protection and public exposure
**Area summary:** Right now anyone on the internet can read the owner's full game plan. The 3D-World-4 repo is public with no license, and its docs spell out the feature cards, the 20 minigames, the world rules, the kart plans and the plan for selling on the app stores. Very few people seem to have looked so far: GitHub counted 32 page views from 7 unique visitors in 14 days, and no other website links to the repo. Nothing has been copied by forking (0 forks), and no passwords or keys were found anywhere in the history. The biggest fix is cheap and quick: make this repo and the two older public repos private. The catch is that the free GitHub plan then stops hosting the test pages, so the owner needs GitHub Pro (about $4 a month, price not confirmed on GitHub's own page) or a different free host. Two other issues need attention. First, the public site shows videos made from Nintendo's Mario model and walk animation, which goes against the repo's own legal guide. Second, the working name "LetsGo" is likely too close to existing "Let's Go" games to become a safe brand.

### Key facts
1. Repo visibility, measured with the GitHub API (gh api repos/isaiasurrutia96/3D-World-4): visibility=public, license=null, has_pages=true, forks_count=0, stargazers_count=0, created_at=2026-11-04T10:29:46Z.
2. GitHub traffic for the last 14 days (gh api .../traffic/views): 32 views from 7 unique visitors. Referrers: only github.com (3 views, 1 unique). Most-viewed pages: racing-core/README.md, racing-core/PLAN.md, docs/KARTS.md, src/world.
3. GitHub counted 6,057 clones from 1,023 unique cloners (traffic/clones). This is probably mostly automated: there have been 645 GitHub Actions runs (349 'Publish to GitHub Pages' plus 295 'pages build and deployment'), and AI cloud sessions also clone the repo. Whether any humans cloned it cannot be told from this data.
4. No LICENSE or COPYING file exists, either on HEAD or on origin/main. package.json has "private": true, but that only blocks publishing the package to npm. It does not affect who can see the repo.
5. Files that reveal the game idea and business plans: docs/FEATURES.md (370 lines, 16 feature cards marked '(approved N Nov)'), docs/MINIGAMES.md (261 lines, 20 minigames), docs/WORLD-RULES.md (170), docs/KARTS.md (164), docs/NEXT.md (511, with the platform and selling plan at lines 46-58), docs/game-dev/20-app-store-blueprint.md (130, the full path to the App Store), docs/HANDOFF.md line 19 (the ragdoll avatar with visible ball joints, which the owner sees as what makes the game different), and docs/karts/ (24 MB of kart concept images).
6. The published website (origin/gh-pages, last updated 2026-11-23 16:42 UTC) has 188 files: test labs, checkpoints and reference videos. Its only Markdown files are 2 checkpoint READMEs. The design docs are exposed through the public repo, not through the website.
7. Secret scan: git grep on HEAD for api key / token / secret / password / private-key patterns and known token formats (AKIA, ghp_, github_pat_, sk-, sk-ant-, AIza, xox, hf_) found nothing. A full-history scan (git log --all -G with the same patterns) also found nothing. No .env, .pem, .key or credential files are tracked. CI uses only the built-in secrets.GITHUB_TOKEN (.github/workflows/deploy.yml).
8. Personal info: the owner's personal gmail.com address is the author email on 104 + 2 commits (git log --all --format='%an <%ae>'). No phone numbers or other emails were found in the files.
9. Commit authors across all refs: Claude 315, owner identity 107, Codex 18. The owner-identity commit messages read like assistant-written messages (for example 'Tighten the GT3 line during sustained co...'), so almost all code appears to be AI-written. I did not confirm who actually typed those commits.
10. docs/game-dev/19-legal.md (152 lines, sections A-J) is about not copying others and about selling legally: copyright basics (ideas are not protected, protection is automatic, registration costs about $45-65 and is needed before suing), trademarks (about $350 per class, classes 9 and 41), licensed real-world things, third-party assets, contractors, LLC vs sole proprietor, privacy and COPPA, loot boxes, EULA, ratings, and a pre-sale checklist. It has no section on protecting the owner's own idea: nothing about repo visibility, trade secrets, NDAs or a license notice.
11. GitHub Pages availability, from GitHub's own docs source (https://raw.githubusercontent.com/github/docs/main/data/reusables/gated-features/pages.md): Pages works in public repos on GitHub Free, and in public AND private repos on GitHub Pro, Team, Enterprise Cloud and Enterprise Server.
12. GitHub's docs warning (https://raw.githubusercontent.com/github/docs/main/data/reusables/pages/private_pages_are_public_warning.md): 'GitHub Pages sites are publicly available on the internet, even if the repository for the site is private.' A Pages site that only chosen people can see requires an organization on GitHub Enterprise Cloud (githubs-plans.md note). Enterprise is listed at $21 per user per month on https://github.com/pricing.
13. GitHub Pro price: third-party pricing sites say $4 per month (for example https://creditforstartups.com/resources/github-pro-pricing). The official https://github.com/pricing page fetched today lists only Free ($0), Team ($4 per user) and Enterprise ($21 per user), with no Pro row. GitHub's docs source still describes a Pro plan for personal accounts that includes Pages in private repos. NOT CONFIRMED on an official price page.
14. GitHub Actions billing (https://raw.githubusercontent.com/github/docs/main/content/billing/concepts/product-billing/github-actions.md): standard runners are free in public repos. Private repos draw from an included monthly amount: $12 on Free (about 2,000 Linux minutes) and $18 on Pro (about 3,000 minutes), at $0.006 per Linux minute. Without a payment method on file, runs are blocked once the included amount is used up.
15. Measured CI usage, adding up the minutes of every 'Publish to GitHub Pages' run: about 1,086 billed minutes from 16 to 23 Nov (13, 72, 94, 209, 86, 115, 318 and 179 minutes per day). That is about $6.50 at private-repo rates. The roughly 295 short 'pages build' runs add up to about 295 more minutes.
16. Mario/Nintendo content: public/references/sm64-walk/ (walk.mp4, walk-slow.gif, poster.jpg; the page itself says 'Mario © Nintendo'), public/references/motion-compare/ (12 media files) and checkpoints/test-lab-1/references/motion-compare/side.mp4 are all on the live site. references/sm64-walk/extract.py downloads actors/mario/model.inc.c and assets/anims/anim_48.inc.c from n64decomp/sm64. references/avatar-walk/source-walk.js holds the 'Original SM64 walking channels'. run-test/controller.js line 2 imports MatchedMotion from references/avatar-walk/matched.js. motion-core/ does not import any of this (git grep).
17. The working name 'LetsGo' appears in 39 files, for example racing-core/kart/README.md line 11: 'The pinned reference is LetsGo Racing, isaiasurrutia96/3D-World-3'.
18. Web fetches of docs.github.com and www.copyright.gov failed in this session (host not allowed). GitHub facts were taken from GitHub's own docs source on raw.githubusercontent.com. Copyright Office facts come from search-result summaries of copyright.gov pages, and their exact current wording was not read directly.

### Findings

1. **The whole game plan is public on the internet right now**
   - Id: PROT-1
   - Kind: risk
   - Severity: high
   - Detail: Anyone can open the GitHub repo and read the full design of the game: every feature card, the 20 minigames, the world rules, the karts, what makes the avatar special, and the plan for selling on the app stores. The two older repos (3D-WORLD-3 and Gemini-3D-WORLD) are public too and hold earlier versions, including the original 'LetsGo Racing' tracks and handling. The good news is that very few people seem to have looked yet, and nobody has made a copy through GitHub's fork button.
   - Evidence: gh api repos/isaiasurrutia96/3D-World-4: visibility=public, forks_count=0. Traffic over 14 days: 32 views from 7 unique visitors, referrer only github.com (1 unique). Popular paths include racing-core/PLAN.md and docs/KARTS.md. Concept files: docs/FEATURES.md (370 lines), docs/MINIGAMES.md (261), docs/WORLD-RULES.md (170), docs/KARTS.md (164), docs/NEXT.md lines 46-58 (selling plan), docs/game-dev/20-app-store-blueprint.md (130), docs/HANDOFF.md line 19 ('rigid ragdoll avatar ... throws and shots that look unlike other games'). Older repos: racing-core/PLAN.md line 24 and racing-core/kart/README.md line 11 pin isaiasurrutia96/3D-World-3 revision 573664e8. Their public status was measured by the lead agent; I could not read those repos because the API is limited to this repo. Clones: 6,057 from 1,023 unique cloners, but 645 Actions runs plus AI sessions likely explain most of them. Human cloning cannot be ruled in or out.
   - Why it matters: Game ideas and rules cannot be protected by copyright, so keeping them private before launch is the main protection available. Every day the plan stays public, someone could take it, and anything already published can never be made secret again.
   - Suggestion: Make 3D-World-4 private today (GitHub, Settings, General, Danger Zone, Change visibility). Do the same for 3D-WORLD-3 and Gemini-3D-WORLD. Check PROT-2 first, so the test links do not break by surprise. After that, share playable links only, never the repo or the docs.
   - Time saving: It takes about one minute per repo and protects all future work without changing how the owner or the assistants work.
   - Verdict: confirmed
   - Verifier note: Re-ran gh api repos/isaiasurrutia96/3D-World-4: visibility=public, private=false, license=null, has_pages=true, forks_count=0, stargazers_count=0, created_at=2026-11-04T10:29:46Z. traffic/views: count 32, uniques 7. Referrers: only github.com (3 views, 1 unique). Line counts match: FEATURES 370, MINIGAMES 261, WORLD-RULES 170, KARTS 164, NEXT 511, 20-app-store-blueprint 130. NEXT.md lines 46-58 hold the platform and selling plan. HANDOFF.md line 19 is the rigid ragdoll avatar item. docs/karts is 24M. Small corrections: FEATURES.md has 15 approved feature cards plus 1 approved card template (16 'approved' headings in total), and they read '(approved 19 Nov, detailed)'. The popular paths are links pinned to a commit (blob/a0d5179/racing-core/PLAN.md, blob/4093a71/docs/KARTS.md), which look like links the assistants gave the owner, so real outside readers may be close to zero. I lowered the severity to high: the plan has been public for 19 days with no sign of copying, game ideas cannot be owned anyway, and the exposure does not stop the game from working. It is still the most important protection step.

2. **Going private will turn off the free test website unless the plan or host changes**
   - Id: PROT-2
   - Kind: risk
   - Severity: high
   - Detail: On the free GitHub plan, the test website (GitHub Pages) only works for public repos. If the repo goes private on the free plan, the test links the owner uses on the phone will stop working. GitHub Pro lets private repos keep their website. Either way, the website itself stays visible to anyone who has the link. Only the code and docs become hidden.
   - Evidence: GitHub docs source: 'GitHub Pages is available in public repositories with GitHub Free ... and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud' (https://raw.githubusercontent.com/github/docs/main/data/reusables/gated-features/pages.md). Warning: 'GitHub Pages sites are publicly available on the internet, even if the repository for the site is private' (https://raw.githubusercontent.com/github/docs/main/data/reusables/pages/private_pages_are_public_warning.md). A truly private site needs an organization on Enterprise Cloud (https://raw.githubusercontent.com/github/docs/main/content/get-started/learning-about-github/githubs-plans.md), listed at $21 per user per month on https://github.com/pricing. Pro is $4 per month per third-party sites (https://creditforstartups.com/resources/github-pro-pricing). The official pricing page fetched today did not show a Pro row, so the price is NOT CONFIRMED. A free alternative: Cloudflare Pages Free allows 500 builds per month and 20,000 files per site (https://developers.cloudflare.com/pages/platform/limits); whether it supports private repos on the free plan was not confirmed.
   - Why it matters: If the repo goes private without a plan for the website, the owner's main way to test on a phone breaks, and time gets wasted fixing it.
   - Suggestion: Simplest path: upgrade the personal account to GitHub Pro first, then make the repo private. Nothing else changes and the test links keep working. Check the price on GitHub's billing page before paying. If the owner wants to stay free, moving hosting to Cloudflare Pages is the backup option, but it takes some setup work.
   - Time saving: Upgrading to Pro avoids rebuilding the publishing setup, which could take hours of assistant time and the owner's usage.
   - Verdict: confirmed
   - Verifier note: GitHub's docs source (data/reusables/gated-features/pages.md) says Pages is available in public repos on Free, and in public and private repos on Pro, Team, GHEC and GHES. private_pages_are_public_warning.md says sites are 'publicly available on the internet, even if the repository for the site is private'. githubs-plans.md line 62 says publishing privately needs an organization on GHEC. Stronger official proof: setting-repository-visibility.md line 50 says that on GitHub Free, when a repo is made private, 'Any published GitHub Pages site will be automatically unpublished.' I fetched github.com/pricing today and it shows only Free $0, Team $4 per user and Enterprise $21 per user, with no Pro row. So the $4 Pro price comes only from third-party sites and is still NOT CONFIRMED officially. Cloudflare says Pages Git integration supports private repos (search summary of developers.cloudflare.com; I could not fetch the page directly because the host is blocked in this session). The inspector missed one free option: keep the source private and push only the built site to a separate small public repo. peaceiris/actions-gh-pages has an external_repository option that needs a deploy key or token. Actions time would still be billed on the private repo, though (see PROT-3).

3. **A private repo uses paid test-robot minutes, and current use is high on busy days**
   - Id: PROT-3
   - Kind: risk
   - Severity: high
   - Detail: If the repo goes private, the publishing robot stops being free, and the cost is probably higher than the inspector estimated. Three corrections. (1) The 295 short 'pages build' runs are free even in a private repo, because GitHub does not charge for its own Pages builds. (2) Each publish run became about 5 times longer on 22 Nov, when browser checks were added: about 8.4 minutes per successful run, up from about 1.6. Busy days now use around 300 minutes. That alone can go past Pro's monthly allowance in roughly 10 busy days. (3) The inspector missed storage completely. Each run now saves a folder of test results, about 40 MB, and keeps it for 90 days. In 1.5 days this already added up to 2.9 GB. Private repos include only 0.5 GB (Free) or 1 GB (Pro) of storage. Beyond that it costs money, or, with no way to pay, new uploads are refused. The upload step runs just before the publish step, so a refused upload would also stop the website from updating. A one-line change fixes most of it: keep the test results for 1 to 3 days, or save them only when a check fails.
   - Evidence: Measured over all 349 'Publish to GitHub Pages' runs: about 1,086 billed minutes from 16 to 23 Nov (318 on 22 Nov). There are also about 295 short 'pages build' runs. Rates: $0.006 per Linux minute; included amounts are $12 per month on Free (about 2,000 minutes) and $18 on Pro (about 3,000 minutes); 'usage is blocked once you consume the included compute usage' without a payment method (https://raw.githubusercontent.com/github/docs/main/content/billing/concepts/product-billing/github-actions.md). Rough estimate: $0 to about $15 per month above Pro's included amount at this pace. This is an estimate, not a measurement of a full month.
   - Why it matters: It is a small cost, but a sudden stop in publishing would look like a broken game and waste a session chasing it.
   - Suggestion: After going private, add a card with a low spending limit, or make the checks lighter. For example, run the slow browser checks only when asked, or group several small pushes into one. Turn on GitHub's usage email alerts at 90% and 100%.
   - Time saving: It avoids a surprise publishing stop in the middle of a test session.
   - Verdict: partly_true
   - Verifier note: I summed run durations from the Actions API: 351 'Publish to GitHub Pages' runs, 895 wall-clock minutes, 1,088 when each run is rounded up. That matches the inspector's 1,086. GitHub's docs source (content/billing/concepts/product-billing/github-actions.md) says: 'The use of standard GitHub-hosted runners is free: In public repositories; For GitHub Pages; For Dependabot.' So the pages-build-deployment runs should not be counted. Included compute is $12 on Free and $18 on Pro, at $0.006 per Linux minute (data/reusables/billing/actions-included-quotas.md). Artifact storage is 500 MB on Free and 1 GB on Pro, with overage at $0.25 per GB per month. Runs before the browser checks were added (commit a103b71, 2026-11-22 05:10 UTC): 290 runs, 1.6 min average for successful runs, 629 rounded minutes. After: 61 runs in about 35 hours, 8.4 min average for successful runs, 459 rounded minutes. Artifacts API: 73 artifacts named lab-foundation-checks, 2,891,014,173 bytes in total (1,115 MiB created on 22 Nov, 1,641 MiB on 23 Nov), expiring 2027-02-20, which means 90-day retention. deploy.yml has actions/upload-artifact@v4 with if: always() before peaceiris/actions-gh-pages@v4, and no continue-on-error. That uploads cost nothing now is certain, because the repo is public. That existing artifacts start counting after the switch, and exactly how a blocked upload behaves, are inferred from docs and community reports, not tested.

4. **Nintendo's Mario model and walk animation are published on the public test site**
   - Id: PROT-4
   - Kind: problem
   - Severity: high
   - Detail: The project took Mario's 3D model and walk animation from a Super Mario 64 code project, rendered videos of Mario, and put them on the public website. One page even writes 'Mario © Nintendo'. Some older test pages (the run and walk tests) drive the avatar with motion copied from Mario's walk. The current movement code (motion-core) does not use it. This goes against the repo's own legal guide, which says never to copy another game's characters or art.
   - Evidence: Live: public/references/sm64-walk/ (walk.mp4, walk-slow.gif, poster.jpg; index.html line 16: 'Mario © Nintendo'), public/references/motion-compare/ (12 media files), checkpoints/test-lab-1/references/motion-compare/side.mp4 (also listed in checkpoints/test-lab-1/CHECKPOINT.json lines 65-66). All are on origin/gh-pages. Source: references/sm64-walk/extract.py fetches actors/mario/model.inc.c and assets/anims/anim_48.inc.c from n64decomp/sm64. references/avatar-walk/source-walk.js line 1: 'Original SM64 walking channels'. run-test/controller.js line 2 imports MatchedMotion from references/avatar-walk/matched.js. README.md line 24 links the motion comparison publicly. docs/game-dev/19-legal.md A4: 'never copy a specific game's names, characters, art'. git grep found no motion-core import of these files.
   - Why it matters: A rights holder can send GitHub a takedown notice, and GitHub can then disable the repo or website, which could interrupt all testing. Mario-based motion must also never end up in the game the owner plans to sell.
   - Suggestion: Take the Mario pages off the public site and keep any notes on them private. Mark the old run and walk test pages as never to be reused in the real game. Removing the copy inside the frozen checkpoint conflicts with the 'keep checkpoints unchanged' rule, so the owner should decide that one. Going private (PROT-1) hides the source files but not the website videos.
   - Time saving: Removing these pages now is a small job. A takedown later could block the repo and the test links at a bad time.
   - Verdict: confirmed
   - Verifier note: All cited evidence checks out. public/references/sm64-walk/index.html line 16 contains 'Mario © Nintendo' and links to n64decomp anim_48. SOURCE.json lists actors/mario/model.inc.c, anim_48.inc.c and geo.inc.c with hashes, says 'Original geometry and walk joint channels', and has 752 triangles. public/references/motion-compare has 12 media files and its page reads 'Mario & our avatar · Same motion'. checkpoints/test-lab-1/CHECKPOINT.json lines 65-66 list the motion-compare side video and poster. extract.py line 4 lists the Mario files and line 16 downloads them from raw.githubusercontent.com/n64decomp/sm64. source-walk.js line 1 reads 'Original SM64 walking channels'. run-test/controller.js line 2 and walk-test/motion.js line 2 import MatchedMotion. README.md line 24 links the comparison. git grep finds no motion-core import. The inspector understated what is live: the published run-test/index.html, walk-test/index.html and their copies under checkpoints/test-lab-1/ embed the SM64 walk data in their JS (each contains 'n64decomp', 'anim_48', 'MARIO_ANIM_WALKING' and the 9921382a68bb revision). /references/avatar-walk/ is also published and says it uses Mario's 'Original step timing ... shoulder/elbow curves'. Removing the checkpoint copy would also break the build, not only the rule: scripts/build-checkpoints.mjs line 14 throws 'Checkpoint file changed' when a hash differs. Severity stays high, mainly because of the risk that Mario motion ends up in the real game (see the missed item). The chance of a takedown alone is low at 7 visitors in 14 days.

5. **Game rules and ideas cannot be copyrighted, so secrecy is the protection before launch**
   - Id: PROT-5
   - Kind: risk
   - Severity: medium
   - Detail: In the US, copyright protects the actual things you make (code, art, music, text, character designs), not the idea of a game, its rules or its name. Someone who reads the docs could legally build a game with the same concept as long as they make their own art and code. Business secrets are protected only when you take reasonable steps to keep them secret, and a public repo is the opposite. NDAs (signed promises to keep things secret) help when showing unreleased plans to testers, artists or partners.
   - Evidence: Copyright Office games factsheet: copyright does not protect the idea for a game, its name or title, or the method for playing it (https://www.copyright.gov/register/tx-games.html). Circular 33 excludes ideas, methods and systems (https://www.copyright.gov/circs/circ33.pdf). See also the ABA article on game rules (https://www.americanbar.org/groups/intellectual_property_law/resources/landslide/archive/why-videogame-rules-are-not-expression-protected-copyright-law/). Trade secrets are not registered with any government office (USPTO toolkit, https://www.uspto.gov/sites/default/files/documents/tradesecretsiptoolkit.pdf); the DTSA requires 'reasonable measures to keep such information secret' (18 U.S.C. 1839; https://www.winston.com/en/insights-news/reasonable-measures-for-protecting-trade-secrets-a-primer). The repo's own docs/game-dev/19-legal.md A1 already says that ideas and mechanics are not protected. The copyright.gov pages could not be fetched directly in this session; the wording comes from search summaries.
   - Why it matters: The owner's main worry is someone stealing the idea. The law alone will not stop that, so privacy, speed and a strong brand are the real defenses.
   - Suggestion: Keep the plan private (PROT-1). Show people the game, not the design docs. Use a simple NDA before sharing unreleased plans with anyone. Later, protect the finished game's art and code with copyright registration and the name with a trademark.
   - Time saving: Knowing this early avoids spending money on the wrong kind of protection, like trying to register an idea.
   - Verdict: confirmed
   - Verifier note: A search of copyright.gov confirms that the games page says the idea for a game, its name or title, and the methods for playing it are not protected (https://www.copyright.gov/register/tx-games.html; the older FL-108 wording is the same). The ABA Landslide article on game rules exists. The DTSA's 'reasonable measures' requirement (18 U.S.C. 1839) is correct law. docs/game-dev/19-legal.md A1 (lines 9-11) already says ideas, rules and mechanics are not protected. As the inspector noted, the copyright.gov pages were checked through search summaries, not read directly.

6. **Most of the code was written by AI, so the owner's own creative choices are the strongest protection**
   - Id: PROT-7
   - Kind: risk
   - Severity: medium
   - Detail: The US Copyright Office says purely AI-made material cannot be copyrighted. Writing prompts or picking one AI result out of several does not count as authorship either. Human-made parts, and the human choices in how the parts are put together, can be protected. Nearly all commits here come from Claude or Codex, and the kart concept pictures were made with an AI image tool. So the owner's decisions, the hand-shaped designs and any art they make or change themselves matter most.
   - Evidence: Commit authors: Claude 315, owner identity 107 (messages look assistant-written), Codex 18. Kart concept images were made with Higgsfield (docs/HANDOFF.md lines 64 and 95). Copyright Office Part 2 report, 29 Jan 2025: human authorship is required, prompts alone are not enough, and selecting outputs is not authorship (https://copyright.gov/newsnet/2025/1060.html; https://www.jonesday.com/en/insights/2025/02/copyrightability-of-ai-outputs-us-copyright-office-analyzes-human-authorship-requirement; https://www.crowell.com/en/insights/client-alerts/us-copyright-office-releases-part-2-of-artificial-intelligence-report-clarifying-copyrightability-of-generative-ai-outputs). docs/game-dev/19-legal.md A6 mentions this only briefly.
   - Why it matters: If someone copies the code, protection could be weaker than the owner expects. The owner's own documented creative direction is what holds up best.
   - Suggestion: Keep recording the owner's decisions in their own words with dates, as HANDOFF.md already does. Make or adjust key art and character designs by hand where possible. When registering copyright later, list which parts were made with AI, as the Copyright Office requires. A games lawyer can confirm this in the one-hour check that 19-legal.md already plans.
   - Time saving: The decision log is already being kept, so this costs almost nothing extra.
   - Verdict: confirmed
   - Verifier note: Author counts across all refs: Claude 315, 'Isaias U' 104, 'isaiasurrutia96' 2 (gmail) plus 1 (noreply), Codex 18. The owner-identity commit messages are racing and GT3 tuning work, such as 'Tighten the GT3 line during sustained cornering' and 'Add calibrated 2026 F1 tune', which is Codex's area. That fits the inspector's suspicion, but it is not proven. HANDOFF.md line 95 says the kart images were made with Higgsfield. A search confirmed the Copyright Office Part 2 report (29 Jan 2025, copyright.gov/newsnet/2025/1060.html): prompts alone are not enough, and human selection, arrangement and edits can be protected. 19-legal.md A6 (lines 25-28) covers this only briefly.

7. **The legal guide covers not copying others, but not protecting the owner's own idea**
   - Id: PROT-12
   - Kind: opportunity
   - Severity: medium
   - Detail: docs/game-dev/19-legal.md is a solid summary of how to avoid copying others and what is needed to sell legally. It says nothing about keeping the repo private, business secrets, NDAs, a license notice, or the fact that the repo and website are public. That gap is exactly the owner's main worry.
   - Evidence: docs/game-dev/19-legal.md, 152 lines, sections A-J (copyright, trademarks, real-world things, assets, helpers, business, privacy, monetisation, other, checklist). grep for 'private repo', 'trade secret', 'NDA', 'non-disclosure', 'licen[cs]e' (outside third-party asset licensing) and 'public repo' in docs/, CLAUDE.md, AGENTS.md and README.md: no match about protecting the owner's own work.
   - Why it matters: Future sessions read this file for legal guidance. Without this section, they will not warn the owner about exposure.
   - Suggestion: With the owner's approval, add a short 'Protecting our own work' section: keep repos private, share links not docs, use NDAs before showing plans, never add an open-source license, register copyright at release, and trademark the final name.
   - Time saving: Writing it once saves repeating this research in every future session.
   - Verdict: confirmed
   - Verifier note: I read all 152 lines of docs/game-dev/19-legal.md. Sections A-J match the inspector's summary: A5 automatic protection and $45-65 registration, B2 $350 per class in classes 9 and 41, E written IP assignment from contractors, and so on. A search across all *.md for trade secret, NDA, non-disclosure, private repo, public repo, visibility (about the repo) and 'all rights reserved' found nothing about protecting the owner's own work. The only 'visibility' hits are code and browser topics, and 'steal' hits are the in-game stealing feature. Section E (contractor IP assignment) is the one item that does protect the owner's rights. It is worth keeping when writing the new section.

8. **The name 'LetsGo' is probably too common and too close to existing games**
   - Id: PROT-6
   - Kind: risk
   - Severity: low
   - Detail: In this repo, 'LetsGo' is not clearly the name of the new game. It is the name of the earlier racing prototype ('LetsGo Racing', from the older 3D-WORLD-3 repo), and the new kart handling is copied from it and checked against it. The main game documents (README, HANDOFF, FEATURES, NEXT, MINIGAMES, WORLD-RULES, KARTS) never call the new game LetsGo, and the repo and site are titled '3D-World-4'. So no final name has been picked yet. If the owner does plan to use 'LetsGo' or 'Let's Go', the warning still holds: it is a common phrase, already used in Nintendo's Pokémon titles and in at least one App Store racing game, and it would be weak as a trademark. This is a later business item.
   - Evidence: The name appears in 39 files, for example racing-core/kart/README.md line 11 ('LetsGo Racing'). US registration 'LET'S GO EEVEE!' shows Registered status, registered 2020-02-11, class 009 (https://trademarks.justia.com/881/42/let-s-go-88142911.html); the owner was not shown in the result. Pokémon: Let's Go, Pikachu! and Let's Go, Eevee! came out on Switch in 2018 (https://wikipedia.com/wiki/Pok%C3%A9mon_Let%27s_Go). App Store: 'Mini4WD Let's GO', a racing game by PROTON GAME LIMITED (https://apps.apple.com/vn/app/mini4wd-lets-go/id6478915515). USPTO base fee is $350 per class (https://www.uspto.gov/trademarks/fees-payment-information/summary-2025-trademark-fee-changes). I did not run a full USPTO search for a standalone 'LET'S GO' mark.
   - Why it matters: Changing a name after building a logo, store page and following costs a lot more than choosing a strong one before launch.
   - Suggestion: Treat LetsGo as a working title only. Close to launch, pick a more unusual name, check the USPTO search, the app stores and Steam, and then file a trademark in classes 9 and 41 (about $350 each).
   - Time saving: Choosing the final name once, at the right time, avoids redoing branding and store listings.
   - Verdict: partly_true
   - Verifier note: git grep -l -i letsgo HEAD gives 35 files, not 39. The same count comes from the working tree without node_modules. Every match in a Markdown file is in racing-core/* or docs/karts/GT3-DRIVING-REFERENCE.md and refers to the old prototype (for example racing-core/PLAN.md line 11: 'start fresh, with LetsGo Racing as the behavior and eventual appearance target'; GT3-DRIVING-REFERENCE.md line 221 links to 3D-World-3/apps/letsgo-racing). A grep for letsgo in README.md, CLAUDE.md, AGENTS.md, docs/HANDOFF.md, FEATURES, NEXT, WORLD-RULES, MINIGAMES, KARTS and docs/game-dev found no matches. The index.html title is '3D-World-4'. A search confirmed the LET'S GO EEVEE! registration (Reg. 5985502, registered 2020-02-11, class 9, https://trademarks.justia.com/881/42/let-s-go-88142911.html); its owner was not shown. I lowered the severity because the name is not a current decision.

9. **No passwords, keys or tokens were found anywhere in the project's history**
   - Id: PROT-8
   - Kind: strength
   - Severity: low
   - Detail: Even though the repo is public, no secret keys, passwords or private tokens are stored in it now or in any past version. The publishing robot uses GitHub's built-in temporary key only.
   - Evidence: git grep -iE on HEAD for api key, secret key, access or auth token, password, private key, client secret and bearer: no matches. Known token formats (AKIA, ghp_, github_pat_, gho_, sk-, sk-ant-, AIza, xox, hf_): no matches. Full history scan with git log --all -G using the same patterns: no matches. No tracked .env, .pem, .key, id_rsa or credentials files. deploy.yml uses only secrets.GITHUB_TOKEN.
   - Why it matters: A leaked key can cost money or let a stranger take over accounts. That risk is not present here.
   - Suggestion: Keep it this way. If the game later needs paid services such as AI tools, stores or analytics, keep their keys out of the repo and in GitHub's secret settings.
   - Verdict: confirmed
   - Verifier note: I repeated the scans myself. git grep on HEAD for api key, secret key, access or auth token, password=, PRIVATE KEY, client secret and bearer found nothing. Token formats (AKIA, ghp_, github_pat_, gho_, sk-ant-, sk-, AIza, xox, hf_) found nothing. git log --all -p -G over the full history with the same core patterns found no added lines. git ls-files has no .env, .pem, .key, id_rsa, credential or secret files. deploy.yml line 48 uses only secrets.GITHUB_TOKEN. Small side note: free secret scanning and push protection apply to public repos. A private repo on Free or Pro loses the automatic secret alerts, so the habit of keeping keys out of the repo matters more after the switch.

10. **There is already strong dated proof that the owner created this game**
   - Id: PROT-9
   - Kind: strength
   - Severity: low
   - Detail: The project history is useful supporting evidence of who made what and when, but 'strong proof' overstates it. Commit dates come from the computer that made the commit and can be changed. Independent timestamps exist in GitHub's own records (repo creation date, the publish robot's run history) and in the dated approvals in the docs. All of this disappears if the repo is deleted or the history is rewritten, so keep an offline backup. Official copyright registration is what really counts in court.
   - Evidence: Repo created 2026-11-04T10:29:46Z. 427 commits on main and about 440 across all refs, dated 2026-11-04 to 2026-11-23. docs/FEATURES.md has 16 '(approved N Nov)' cards. docs/HANDOFF.md has 54 'Owner:' quotes. Registration is needed before suing, and statutory damages generally require timely registration under 17 U.S.C. 411-412 (https://www.fr.com/fish-litigation/seven-benefits-of-copyright-registration; https://www.copyright.gov/help/faq/faq-general.html). 'Poor man's copyright' is not a substitute for registration (Copyright Office FAQ, via search summary). Fees: $45 single, $65 standard under the 2020 schedule (https://copyright.gov/about/fees.html); a 2026 fee study may change them (https://www.copyright.gov/rulemaking/feestudy2026/proposed-fee-schedule.pdf). Current fees NOT CONFIRMED.
   - Why it matters: If anyone copies the game later, this history helps show the owner was first, and it costs nothing extra.
   - Suggestion: Keep the history intact and keep an occasional offline backup (for example a zip of the repo on the owner's own drive). Register the copyright once there is a real playable version, before or soon after it is released publicly.
   - Time saving: No extra work is needed now, because the habit is already in place.
   - Verdict: partly_true
   - Verifier note: Repo created 2026-11-04T10:29:46Z. git rev-list --all --count gives 440; origin/main has 429 and local main 427. FEATURES.md has 15 dated approved cards plus an approved template. 'Owner:' appears 39 times in HANDOFF.md case-sensitive and 60 times case-insensitive, so the inspector's '54' depends on how you count. Actions run history only starts on 16 Nov (the first runs in the API list), so GitHub's independent run timestamps do not cover 4-15 Nov. The legal points (registration needed before suing, timely registration needed for statutory damages under 17 U.S.C. 411-412, $45/$65 fees not confirmed for 2026) are stated correctly and with the right caveats.

11. **The test website shows prototypes, not the business plan**
   - Id: PROT-10
   - Kind: strength
   - Severity: low
   - Detail: The public website only holds the test labs, checkpoints and reference videos. The plan documents (features, minigames, selling plan) are not on the website. They can only be read in the repo. So making the repo private hides almost all of the plan while the test links keep working, as long as Pro or another host is in place.
   - Evidence: origin/gh-pages: 188 files. Its only .md files are checkpoints/driving-1/README.md and checkpoints/driving-2/README.md. Page titles are lab names such as 'Test Lab', 'Track Lab', 'Karts' and 'Skeleton'. No source maps (.map) are published. vite.config.ts and the build scripts do not copy docs/.
   - Why it matters: The owner can keep testing on the phone by link without exposing the game design.
   - Suggestion: Keep design docs out of the website build. When the game becomes really playable, think about which builds to share publicly, because anyone can download a web game's files.
   - Verdict: confirmed
   - Verifier note: git ls-tree -r origin/gh-pages: 188 files. The only .md files are checkpoints/driving-1/README.md and checkpoints/driving-2/README.md. 0 .map files. vite.config.ts inputs are only index, lab, oval, island and movement; public/ holds motion-lab, racing-lab, references and test-lab, with no docs. Last gh-pages commit 2026-11-23 16:42:27 UTC. Small caveats: the published bundles leak a few plan hints, such as the island rulebook block 'Bowling lane ... maybe skee-ball' in assets/island-*.js and 'Suzuka' in the checkpoints/driving-* JSON. They also contain the Mario walk data (see PROT-4). deploy.yml uses force_orphan: true, so the site branch keeps no old published versions.

12. **There is no license file, which means 'all rights reserved' by default, but that is not spelled out**
   - Id: PROT-11
   - Kind: problem
   - Severity: low
   - Detail: Without a license, nobody has legal permission to reuse, change or share the code. GitHub's rules only let people view the public repo and copy it inside GitHub. That is the right default for a game the owner wants to sell, but nothing in the repo says so. The 'private' setting in package.json can mislead: it only stops publishing the package to npm, and it does not make the repo private.
   - Evidence: No LICENSE or COPYING file on HEAD or origin/main; gh api license=null. package.json line 3: "private": true. choosealicense.com: without a license, publishing on GitHub lets others view and fork, which 'does not mean others may use, modify, or share' it (https://choosealicense.com/no-permission/). GitHub docs say the same (https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
   - Why it matters: If an assistant ever adds an open-source license by habit, that would give the game away. A clear notice makes the owner's rights obvious.
   - Suggestion: Do not add an open-source license such as MIT. Optionally add a one-line 'Copyright 2026, all rights reserved' notice to the README, and tell both assistants never to add an open-source license. This deters casual copying but will not stop someone determined.
   - Time saving: It takes under a minute and prevents a costly mistake.
   - Verdict: confirmed
   - Verifier note: No LICENSE or COPYING file in the working tree or on origin/main. gh api reports license=null. package.json line 2 has "private": true, which only blocks npm publishing. The choosealicense.com no-permission page and GitHub's licensing docs say what the inspector reports. Severity low is right.

13. **Real brand and track names in the prototype need renaming before selling**
   - Id: PROT-13
   - Kind: risk
   - Severity: low
   - Detail: The racing prototype has a 'Suzuka Circuit' track carried over from the older repo, 'F1' kart modes, and a GT kart described as inspired by the Porsche 911 GT3 R, using its real size. That is fine for private testing. The repo's own legal guide says real vehicle designs and brands often need licences, so these must be renamed or reshaped before selling.
   - Evidence: racing-core/track/CHECK-RESULTS.md line 11: 'Suzuka Circuit' with a length of about 5757 (units assumed metres; the real Suzuka is about 5.8 km, so it may be a copy of the real layout, NOT CONFIRMED). docs/KARTS.md has 16 F1/Formula 1 mentions. docs/karts/GT3-DRIVING-REFERENCE.md lines 3 and 11 (Porsche 911 GT3 R, 4.619 m long). docs/game-dev/19-legal.md C3: 'real vehicle and weapon designs are often licensed ... Use made-up designs'.
   - Why it matters: Renaming late means touching menus, store pages and marketing. Planning for it now keeps that cheap.
   - Suggestion: Keep using these as private references. Add them to the pre-sale checklist so the final game uses invented track names, mode names and car shapes.
   - Verdict: confirmed
   - Verifier note: racing-core/track/CHECK-RESULTS.md line 11: 'Suzuka Circuit' with a length of 5757.44, the unit not stated. GT3-DRIVING-REFERENCE.md line 3 says 'inspired by the 2026 Porsche 911 GT3 R' and line 11 says '4.619 m long'. 19-legal.md C3 (lines 47-50) says real vehicle designs are often licensed. Minor: 'F1|Formula 1|Formula One' matches 20 times in KARTS.md, not 16. 'Suzuka' also appears on the public site, in checkpoints/driving-1 and driving-2 index.html and the check JSON files. The real Suzuka comparison stays NOT CONFIRMED.

14. **The owner's personal email is visible in public commit history**
   - Id: PROT-14
   - Kind: risk
   - Severity: low
   - Detail: The owner's personal Gmail address is on 106 commits (104 as 'Isaias U' and 2 as 'isaiasurrutia96'), and anyone can see it while the repo is public. Hiding it in GitHub's email settings is a good idea, but turning on 'Block command line pushes that expose my email' right away could reject pushes. Most of those commits look like they were made by an assistant using the owner's computer identity, so the assistants' pushes could start failing with confusing errors. First switch the commit email on the owner's machine (and in any assistant setup that uses it) to the GitHub 'noreply' address, then turn the block on.
   - Evidence: git log --all --format='%an <%ae>': 104 commits as 'Isaias U <(owner email removed)>' and 2 as 'isaiasurrutia96 <(owner email removed)>'. 1 commit already uses the users.noreply.github.com address.
   - Why it matters: It is a small privacy leak. It matters more once the game gets attention.
   - Suggestion: In GitHub email settings, turn on 'Keep my email addresses private' and 'Block command line pushes that expose my email'. Going private also hides the old ones. Rewriting old history is not worth the disruption.
   - Time saving: It is a two-minute settings change.
   - Verdict: partly_true
   - Verifier note: git log --all --format='%an <%ae>': 104 'Isaias U' at gmail, 2 'isaiasurrutia96' at gmail, 1 'isaiasurrutia96' at users.noreply.github.com. The 'Isaias U' commits are mostly racing and GT3 tuning, for example 2026-11-22 'Fit GT3 steering response to the kart wheelbase', which matches Codex's area. That suggests an assistant committing with the owner's local git identity. This is inferred, not confirmed. If so, the push block in the suggestion would reject those pushes until the identity is changed.

### Missed by inspector found by skeptic

1. **Saved test results will fill the paid storage allowance in about a day if the repo goes private**
   - Kind: risk
   - Severity: high
   - Detail: Since 22 Nov, every publish run saves a folder of browser test results, about 40 MB per run, and GitHub keeps each one for 90 days. In a day and a half this already reached about 2.9 GB. That is free today only because the repo is public. A private repo includes just 0.5 GB of storage (Free) or 1 GB (Pro). Past that, storage costs money every month, and if GitHub cannot charge, new uploads are refused. The upload runs just before the publish step, so a refused upload would also stop the test website from updating. At the current pace the monthly storage bill could end up larger than the $4 Pro plan itself.
   - Evidence: gh api repos/isaiasurrutia96/3D-World-4/actions/artifacts: total_count 73, size_in_bytes sum 2,891,014,173. Created on 2026-11-22: 43 artifacts, 1,115 MiB. On 2026-11-23: 30 artifacts, 1,641 MiB. Name 'lab-foundation-checks', expires_at 2027-02-20 (90-day default). The upload step was added in commit a103b71 (2026-11-22 05:10 UTC, 'Strengthen shared lab input and gate publishing with browser regressions'). .github/workflows/deploy.yml: 'Save browser check results' uses actions/upload-artifact@v4 with if: always(), placed before peaceiris/actions-gh-pages@v4, with no continue-on-error and no retention-days. GitHub docs source data/reusables/billing/actions-included-quotas.md: artifact storage 500 MB (Free), 1 GB (Pro). github-actions.md storage table: shared storage $0.25 USD per GB per month. Community reports of the 'Artifact storage quota has been hit. Unable to upload any new artifacts' error: https://github.com/orgs/community/discussions/169789. Rough estimate, not a measurement: at about 1.4 GB per active day and about 13 active days a month (9 active days in the 20 days of history), 90-day retention leads to roughly 50-70 GB stored, about $12-17 a month after three months. Also measured: since the browser checks were added, successful publish runs average 8.4 min, up from 1.6 min (61 runs, 459 rounded minutes in about 35 hours).
   - Suggestion: Before going private, have the assistant who owns the publishing setup make one small change: keep the test results for only 1 to 3 days, or save them only when a check fails. Also consider running the slow browser checks only on the final push of a work session. Both changes make the private repo cheap and avoid a surprise publishing stop.

2. **The plan tells future sessions to rebuild the walk from Mario's animation, and the live walk and run test pages already contain it**
   - Kind: risk
   - Severity: medium
   - Detail: The movement roadmap tells assistants to use the original Super Mario 64 walk reference before rebuilding the walk cycle. The older walk and run test pages, which are still published, already have Mario's walk animation data built into their code. Copying how Mario moves in general (speeds, feel, foot locking) is fine, because ideas and mechanics are free to use. Copying the actual animation numbers is copying Nintendo's work. If a future session builds the real walk on that data, it would have to be torn out before selling, which means a big redo of the most important movement.
   - Evidence: docs/NEXT.md lines 20-21: 'Use the original SM64 walk-pose reference at `/references/sm64-walk/` before rebuilding the walk cycle.' Lines 26-28 (motion-lab plan): 'SM64 walk reference'. walk-test/motion.js line 2 and run-test/controller.js line 2 import MatchedMotion from references/avatar-walk/matched.js. source-walk.js line 1: 'Original SM64 walking channels'. Published bundles origin/gh-pages:run-test/index.html (829,729 bytes), walk-test/index.html, checkpoints/test-lab-1/run-test/index.html and checkpoints/test-lab-1/walk-test/index.html each contain 'n64decomp', 'anim_48', 'MARIO_ANIM_WALKING' and revision 9921382a68bb. public/references/avatar-walk/SOURCE.json: 'Original step timing, foot recovery progression and shoulder/elbow curves' from MARIO_ANIM_WALKING. Currently motion-core has no imports of these files (git grep).
   - Suggestion: Add a one-line note to the movement plan saying Mario can be used only as a 'feel' target, and no Mario animation data may be copied into any game code. Take the Mario videos and the old walk and run test pages off the public site. The owner decides what to do about the frozen checkpoint copies.

3. **Search engines are free to list the test website**
   - Kind: opportunity
   - Severity: low
   - Detail: The test pages carry no 'do not list me in search' tag. Today the public README links to them, which helps search engines find them. After the repo goes private, the website stays public, so a search listing would be the main way strangers stumble onto it. A small tag on each page asks Google and others not to list it. It will not stop someone who already has the link.
   - Evidence: git ls-tree -r origin/gh-pages: no robots.txt or sitemap. git grep -c -i noindex origin/gh-pages: 0 matches. Root index.html <head> has only charset, viewport, title and the scripts. README.md lines 5-7 and 23-24 link to isaiasurrutia96.github.io/3D-World-4 pages. On a project site, a robots.txt would have to sit at the domain root (isaiasurrutia96.github.io/robots.txt), so a per-page meta tag is the practical option. That last point is general web knowledge, not checked against a source in this session.
   - Suggestion: When the shared page template is next touched, add a 'noindex' meta tag to the test pages. It takes a few minutes and adds no risk.

4. **Going private cannot pull back copies already made, and some tools expect the old repo next to this one**
   - Kind: risk
   - Severity: low
   - Detail: Making the repo private hides it from now on, but any copy someone already downloaded stays with them. GitHub counted many downloads, most likely from the project's own robots and AI sessions, so this is mostly about setting the right expectation. Separately, a couple of the assistants' tools read the older 3D-WORLD-3 repo from a folder next to this one. Once that repo is private, a cloud session needs proper GitHub access to fetch it, or those tools stop working.
   - Evidence: traffic/clones: 6,057 clones, 1,023 unique cloners. forks_count 0. GitHub docs source setting-repository-visibility.md line 86: 'Current forks will remain public and will be detached' (none exist here). motion-core/tests/compare.mjs line 12 resolves '../../../3D-WORLD-3'. racing-core/tools/capture-track-reference.mjs line 15 runs 'git -C reference archive revision apps/letsgo-racing/src'. Both assistants already push with their own credentials (Claude 315 commits, Codex 18), so their access to this repo itself should keep working. That is inferred, not tested.
   - Suggestion: Go private soon rather than later, and accept that the last 19 days of exposure cannot be undone. After the switch, have each assistant confirm it can still pull both repos before the next work session.

5. **The project already avoids real logos and brands in its own art**
   - Kind: strength
   - Severity: low
   - Detail: The kart concept art was made with no logos or real paint schemes, and the kart plan says stickers will be the project's own designs with no real brands. That shows good instincts that make selling the game later easier.
   - Evidence: docs/HANDOFF.md line 95: 'Ten original concept images made with Higgsfield (about 7.5 credits, no logos or real liveries)'. docs/KARTS.md line 46: 'Stickers to really customize a kart (our own designs, no real brands).' docs/game-dev/19-legal.md J2 (line 146): 'No real brands, teams, players, songs or copied game designs.'
   - Suggestion: Keep this habit and extend it to track names and car shapes (see PROT-13).

## Research: how real studios and solo developers plan games
**Area summary:** The research is consistent. Studios and successful solo developers first prove that one small, rough loop is fun and that other people want to keep playing it. Only after that do they spend time on art, content and extra features. The most common reason projects fail, according to postmortem studies, is scope that is too big and keeps growing. Polishing art early, restarting over and over, and building tools instead of the game are the other repeat offenders. Every solo hit checked (Stardew Valley, Undertale, Animal Well, Balatro) took far longer than its maker expected, and each began from one small playable core, often built in days. For AI-assisted work, the best-supported advice is small, checkable steps, automatic tests that block bad changes, good version control, and one short, current plan. Measured against that research, LetsGo has strong safety habits (tests that block bad changes, checkpoints, a live link anyone can open). But its approved feature list is very large (20 minigames, online worlds of 100 to 200 players). The last four days of decisions are almost all about avatar body shapes, while walking and running are switched off and racing is not yet a full race.

### Key facts
1. Research limit: WebFetch could not open gamedeveloper.com, en.wikipedia.org or makegames.tumblr.com (DNS blocked in this sandbox), so all web evidence comes from WebSearch result summaries. Items marked 'secondary' or 'unconfirmed' were not checked against the original page.
2. Mark Cerny's 'Method' (GDC Europe 2002 talk, slides on SlideShare): pre-production ends with a 'publishable' first playable and the project is greenlit there. A team that cannot make one should be cancelled, because the game will not get better in production. Source: https://www.slideshare.net/holtt/cerny-method ; Game Developer interview https://gamedeveloper.com/marketing/conversations-from-gdc-europe-mark-cerny-jonty-barnes-jason-kingsley
3. Common studio milestone order: prototype, first playable or vertical slice (pre-alpha), alpha (feature complete), beta (content complete, then stabilize), gold or code release, then live updates. Sources: https://learn.unity.com/tutorial/the-stages-of-game-development ; Chandler, The Game Production Handbook, code-release chapter https://www.oreilly.com/library/view/the-game-production/9781449688097/
4. Petrillo et al. 2009, 'What went wrong? A survey of problems in game development' (Computers in Entertainment 7(1), DOI 10.1145/1486508.1486521). According to a slide deck that reproduces its table (secondary, ranking not confirmed), the top problems were unrealistic scope, feature creep and cutting features.
5. Politowski et al. 2021 (Information and Software Technology 134) studied 200 postmortems from 1997 to 2019 and found 927 problems in 20 types. Most root causes were about people, not technology. https://arxiv.org/abs/2009.02440
6. Stardew Valley: planned as a six-month resume project, it took about four years at 8 to 15 hours a day and came out in February 2016. A PC crash without backups nearly cancelled it. Sources: https://www.king5.com/article/tech/eric-barone-stardew-valley/281-7a596cc6-3c48-458b-bbda-672919d1c717 ; https://www.shortform.com/blog/how-was-stardew-valley-made/ ; https://www.gamesradar.com/games/simulation/stardew-valley-was-almost-canceled-after-eric-barones-pc-died-without-backups-it-feels-crazy-that-it-all-worked-out/
7. Undertale: the demo came out on 23 May 2013 after about 5 months of work. The Kickstarter asked for $5,000 and raised $51,124 from 2,398 backers. The game released on 15 September 2015, about 32 months in total. Sources: https://undertale.wiki/w/Kickstarter (fan wiki) ; https://pcgamer.com/the-making-of-undertale
8. Animal Well: Basso expected 6 months and it took 7 years, about 4 of them part-time beside a day job. He spent about 3 years on a general-purpose 3D engine that he later felt was too focused on solving problems in advance. The game has about 256 rooms, and he designed 500 or more that were cut or changed. Sources: https://wirednews.pages.dev/story/billy-basso-animal-well-whats-next-gdc ; https://gamedeveloper.com/design/why-animal-well-s-home-brewed-engine-was-key-to-its-success ; https://www.gamesradar.com/games/platformer/solo-dev-behind-breakout-metroidvania-hit-animal-well-says-his-game-has-256-encounters-but-he-had-to-cut-at-least-500-of-them-during-development
9. Balatro: started in December 2021 as a hobby while the creator worked in IT. The first 'Joker Poker' prototype came within weeks and had no jokers. He took a break from March to May 2022, and a friend played the prototype '20, 30, or 40' hours. It released in February 2024 with publisher Playstack. Sources: https://gamedeveloper.com/business/balatro-dev-gives-look-at-first-prototype-joker-poker ; https://www.pcgamer.com/games/roguelike/localthunk-had-made-hobby-games-in-the-past-but-realized-balatro-was-something-special-when-a-friend-revealed-he-had-played-it-for-20-30-or-40-hours
10. Minecraft: the first alpha took about 6 days (May 2009) and was posted on the TIGSource feedback forum on 17 May 2009. Sales began in June 2009 so development could be funded. Sources: https://www.pcgamer.com/the-first-moments-of-minecraft ; https://www.techradar.com/news/the-history-of-minecraft
11. Vampire Survivors: started in 2020 as a low-stakes side project. It used a sprite pack bought years earlier in place of placeholder art, and the creator says he 'didn't have a vision' and added pieces to see what was fun. It went from itch.io (December 2021) to Steam, and Xbox Wire quotes poncle's tech director calling the launch build 'basically a browser game'. Sources: https://www.pcgamer.com/vampire-survivors-creator-didnt-have-a-vision-when-he-started-making-the-game-that-allowed-him-to-quit-his-job ; https://www.pcgamer.com/vampire-survivors-didnt-rip-off-castlevania-sprites-after-all ; https://news.xbox.com/en-us/2023/04/13/vampire-survivors-dlc-2-launch/
12. Celeste: began as a 4-day PICO-8 game-jam game in August 2015 with 30 levels. The full game, with more than 200 rooms, released on 25 January 2018. Source: https://www.nintendolife.com/news/2018/01/feature_conquering_the_indie_mountain_with_celeste_creator_matt_makes_games
13. Tiny Glade: made by two people, it began as a weekend procedural wall generator. It was announced in December 2022, had a demo in May 2024 and launched on 23 September 2024, selling about 616,000 copies in its first month. Sources: https://80.lv/articles/exclusive-tiny-glade-developers-discuss-bevy-proceduralism-publishers-cozy-games ; https://automaton-media.com/articles/newsjp/tiny-glade-20241030-316261/
14. METR randomized trial (July 2025): experienced developers were 19% slower with early-2025 AI tools. They had expected to be 24% faster and still believed afterwards that they had been 20% faster. https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
15. DORA 2025 'State of AI-assisted Software Development' (about 5,000 respondents) lists working in small batches and strong version control among seven capabilities that boost AI's benefits, and says AI amplifies existing conditions. https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report
16. Repo facts: docs/FEATURES.md holds 19 numbered feature cards, including 'Big connected world' (line 119) and 'Online players and NPCs' (line 340, 'about 100–200 players per world', line 357). docs/MINIGAMES.md lines 255–261 list 20 minigames plus paintball, each marked approved on 19 Nov. README.md line 6 calls the Racing Lab 'a solo test, not a complete race session'. docs/HANDOFF.md line 16 says walking and running were rejected and removed.
17. Repo facts: docs/HANDOFF.md 'Confirmed by the owner' items 9 to 79 (lines 23–94, dated 20–23 Nov) are almost all decisions about avatar body shape: torso, limbs, ball-joint sizes, sockets, feet, wrists and height. Items 36 to 43 of the second list (lines 95–102) cover kart bodywork design. A rough keyword count shows 83 of 150 commit subjects since 20 Nov mention body-part words.

### Findings

1. **Make 'is the core loop fun?' the first gate, before anything else**
   - Id: RES-1
   - Kind: opportunity
   - Severity: critical
   - Detail: No playable loop exists yet. Racing is a driving test only, and walking and running were removed. There is no whole-game 'first playable' target. However, Codex's racing plan already lists the next racing step (countdown, laps, finish times, respawn) as 'not started, waiting for the owner's Go'. So the fastest first playable is mostly a decision the owner has to make, not new planning work.
   - Evidence: Cerny 'Method' slides: greenlight at first playable; 'a team that cannot create a publishable first playable should have its project canceled' (https://www.slideshare.net/holtt/cerny-method). Insomniac Ratchet & Clank postmortem, first playable 'wasn't bad, it wasn't great either', pre-production restarted (https://www.gamedeveloper.com/game-platforms/postmortem-insomniac-games-i-ratchet-clank-i-). Repo: README.md line 6 'This is a solo test, not a complete race session'. docs/HANDOFF.md line 16 'Walking and running were rejected and removed'. grep for 'core loop|pillar|first playable' in docs/ found only generic mentions (docs/game-dev/20-app-store-blueprint.md:31, docs/game-dev/13-production.md:10).
   - Why it matters: If the basic activity is not fun, no amount of art, karts or minigames will fix it, and every hour spent on those first may be wasted. The owner's main goal is 'getting the game to actually work', and this gate is exactly that test.
   - Suggestion: Write down one 'first playable' target, for example: start a race, drive 3 laps, see a finish screen and a time, then restart. Treat everything else as waiting until that target is playable and feels good on the phone.
   - Time saving: Stops weeks of work on parts that may change once the core is played. Studios cancel or restart at this gate because it is the cheapest place to change direction.
   - Verdict: partly_true
   - Verifier note: The repo facts hold up. README.md line 6 says 'This is a solo test, not a complete race session'. docs/HANDOFF.md line 16 says walking and running were rejected and removed. A search of all docs for 'core loop', 'pillar', 'first playable', 'MVP' or 'vertical slice' found only generic notes (docs/game-dev/13-production.md:10, 20-app-store-blueprint.md:31). Web sources check out: Cerny Method slide summaries say 'greenlight at first playable' and that a team that cannot make a publishable first playable shows the game is not worth publishing. The Insomniac postmortem describes a first playable that was 'not bad, not great'. But the inspector missed that racing-core/PLAN.md lines 70-83 already set out a gated sequence for racing. Line 79 is Section 4 'Race rules: countdown, ordered gates/laps, reverse/wrong-way, respawn, standings and finish times', marked 'Not started; requires go'. So a first-playable plan exists for racing. What is missing is a whole-game target and the owner's Go. I kept severity at critical: after 427 commits nothing is playable from start to finish, and that is the owner's stated main goal.

2. **Scope that is too big and keeps growing is the number one killer of games**
   - Id: RES-2
   - Kind: risk
   - Severity: high
   - Detail: Scope and feature creep are among the most often reported problems in game postmortems, though the claim that they are number one rests on a small 20-postmortem study. LetsGo's approved plan is very large: 14 approved feature cards and 20 approved minigames, all approved on one day (19 November), plus three kart racing modes, each with its own tracks. The documents already say online play comes later and single player first, but nothing marks a small first version as the only thing to build now.
   - Evidence: Petrillo et al. 2009, DOI 10.1145/1486508.1486521. Top problems per a slide deck reproducing its table (secondary, ranking not confirmed): 1) unrealistic scope 2) feature creep 3) cutting features. Shirinian's Game Developer postmortem analysis, as summarized by search: scope, feature creep and resource problems were about 23% of production problems (https://www.gamedeveloper.com/business/what-went-wrong-learning-from-past-postmortems). Repo: docs/FEATURES.md has 19 numbered feature cards. Line 119 'Big connected world (approved 19 Nov)', line 340 'Online players and NPCs (approved 19 Nov)', line 357 'about 100–200 players per world'. docs/MINIGAMES.md lines 255–261 list 20 minigames plus paintball, and headings at lines 44–235 each say '(approved 19 Nov)'.
   - Why it matters: A plan this size could take a small team many years. For one person with AI helpers, trying to keep all of it 'approved' means work spreads thin and nothing gets finished. This is the most likely way the project could stall.
   - Suggestion: Keep the big list as a 'someday' wish list, but mark it clearly as not approved for building. Choose a small first version, such as one mode with one track or one place and no online play, and only add the next feature after the first version is fun and finished.
   - Time saving: Cutting scope on paper costs minutes. Cutting it after the code exists costs weeks.
   - Verdict: partly_true
   - Verifier note: The repo scope is real. docs/FEATURES.md has 19 numbered cards, and 14 of them are marked 'approved 19 Nov', including Big connected world (line 119) and Online players and NPCs (line 340). The 20 minigames in docs/MINIGAMES.md lines 44-235 are each marked '(approved 19 Nov)'. Several details are overstated, though. (1) The research base: the scope/feature-creep ranking comes from Petrillo 2009, which looked at only 20 Gamasutra postmortems, and the ranking is secondary and unconfirmed. The large 200-postmortem study (Politowski 2021) found management and production problems roughly equal, with production problems mostly technical and design. So 'studies of hundreds of postmortems keep finding scope as #1' is not supported. Scope and feature creep are confirmed as among the most reported problems, but not as proven number one. (2) The minigame count: MINIGAMES.md line 255 lists 20 minigames including paintball (diving is excluded), not '20 plus paintball'. (3) FEATURES.md calls itself an 'ideas list' (line 1). The online card says 'single player first; online later' (line 345). The 100-200 players figure sits under 'Numbers later ... (later)' (lines 356-357). (4) The inspector missed the racing half of the scope (see missed items). I lowered severity to high because the oversized plan is still only on paper, where cutting it is cheap.

3. **Polishing how things look before the game plays is a classic trap, and the recent work fits it**
   - Id: RES-3
   - Kind: risk
   - Severity: high
   - Detail: The last four days of owner decisions are almost all avatar shape choices, and much of the kart work in the same days is bodywork and body-style choices. All of this happened while walking, running and full races do not work. Some shape work matters (the legs were measured as too short for good throws), but most look decisions are being made before anyone can test them in motion.
   - Evidence: Ron Gilbert, https://grumpygamer.com/vertical_slice: calls it 'one of the dumbest things the game industry has ever come up with', wasted time and money, but says to build a prototype when gameplay or technology is uncertain. Vampire Survivors used an asset pack bought years earlier to replace placeholder sprites (https://www.pcgamer.com/vampire-survivors-didnt-rip-off-castlevania-sprites-after-all). Counterpoint: https://unity.com/blog/placeholder-asset-problem (rough art can skew playtest feedback; suggests ready-made placeholder packs). Repo: docs/HANDOFF.md items 9–79 (lines 23–94, 20–23 Nov) are avatar-shape decisions, e.g. line 72 item 58 'Ball needs to be deeper in the torso', item 59 'another 2 cm deeper'. Kart design items 36–43 at lines 95–102. Rough keyword count: 83 of 150 commit subjects since 2026-11-20 mention body-part words.
   - Why it matters: Shapes chosen now may need to change once the avatar actually walks, throws and races. Time spent perfecting them first can be lost, and it pushes back the day the game is actually playable.
   - Suggestion: Freeze the avatar look at 'good enough to test', then use it to get walking, running and one throw working in a playable scene. Come back to shape polish later, in one time-limited pass. The owner already noted 'near the end of the game, go back and recheck' (HANDOFF line 89), and the same approach fits the visuals.
   - Time saving: Avoids reshaping parts several times. Every look decision made after movement works is made once, with real information.
   - Verdict: partly_true
   - Verifier note: Checked HANDOFF items 9-79 (lines 23-93). Nearly all are avatar shape decisions (lines 72-73 are 'Ball needs to be deeper' and 'another 2 cm deeper'). Of 150 commits since 2026-11-20, my keyword count found 71-88 subjects with body-part or avatar words, depending on the word list, so 83 is within range. But about 62 of the 150 are kart or driving commits. Many of those are also about looks ('Add twelve S Kart stock body candidates', 'Record GT stock selection and add F1 body lineup', 'Karts: the whole F1 GoKart (lofted bodywork, NACA wings...)'). So polishing before the game plays affects karts too, not only the avatar. The inspector's link to HANDOFF line 89 is misused: item 75(a) is about re-checking every line of code near the end, not about visuals. Item 75(d), 'Deferred fine-tuning', is the closer example. Ron Gilbert's quote is confirmed (grumpygamer). The Unity placeholder article is confirmed, dated 11 May 2026. One small side error in the inspector's key facts: Vampire Survivors reached itch.io on 31 March 2021, not December 2021 (Steam store version history); Steam early access was 17 December 2021. A fair counterpoint is in HANDOFF item 76 (line 90): measurements showed the legs about 20% short for realistic throws, so some shape work does affect how the game plays.

4. **Solo games take far longer than planned: plan for that from day one**
   - Id: RES-4
   - Kind: risk
   - Severity: high
   - Detail: In every case checked, the creator badly underestimated the time. Stardew Valley was meant to take 6 months and took about 4 years of long days. Animal Well was expected to take 6 months and took 7 years. Undertale's maker expected to finish in August 2014 and released in September 2015. Balatro took over two years. These were games much smaller in scope than LetsGo's full plan.
   - Evidence: Stardew 'supposed to take six months. Six months turned into four years' (https://www.king5.com/article/tech/eric-barone-stardew-valley/281-7a596cc6-3c48-458b-bbda-672919d1c717). Animal Well 'expected the project to take six months. It took seven years' (https://wirednews.pages.dev/story/billy-basso-animal-well-whats-next-gdc). Undertale expected 'as early as August 2014' (fan wiki https://undertale.wiki/w/Kickstarter), released 15 Sep 2015 after about 32 months. Balatro Dec 2021 to Feb 2024 (https://insider-gaming.com/localthunk-the-balatro-timeline-solo-dev/).
   - Why it matters: If the plan assumes everything fits in a few months, the owner will feel behind all the time and may be tempted to rush or restart. Knowing the real pattern makes it easier to cut early and calmly.
   - Suggestion: Plan in layers: a must-have first version, then 'nice next', then 'someday'. Judge progress by which layer is playable, not by how many features are on paper. When something is estimated, assume it may take several times longer.
   - Time saving: Early, honest planning prevents the costly late cuts that postmortems describe.
   - Verdict: confirmed
   - Verifier note: Searches confirmed the Stardew Valley quote ('supposed to take six months... four years'). Reported hours vary from 8 to 15 a day to about 10 a day. Animal Well took 7 years from 2017, and Game Developer describes an earlier engine phase from about 2014, so the real total is even longer. Balatro ran from 13 December 2021 to February 2024. Undertale's expected date comes from a fan wiki, which the inspector flagged. The core lesson is well supported.

5. **Use a one-page game plan with 3 pillars and a 'not doing' list**
   - Id: RES-5
   - Kind: opportunity
   - Severity: high
   - Detail: Stone Librande (EA/Maxis, GDC 2010) showed that one-page design documents work better than long ones, because most people only read the first page. Unity's beginner guide says if the essentials do not fit on one page, the scope is probably too big. It also says new ideas should not be built right away, and that the plan is a tool, not a contract. Design pillars are 3 or so short statements of what the game must feel like, and teams use them to decide what to cut. LetsGo has long detailed lists (FEATURES 370 lines, MINIGAMES 261, NEXT 511, racing PLAN 741) but no single page that says what the game is, what the core loop is, and what is out of scope.
   - Evidence: Librande, One Page Designs, GDC 2010 (https://gdcvault.com/play/1012356 ; slides at https://stonetronix.com/). Unity, 'Start simple: A one-page design document for your first game' (https://unity.com/blog/one-page-game-design-document). Pillars as a cutting filter: secondary sources only, no GDC primary confirmed (https://www.raspberrypi.com/news/how-pillars-and-triangles-can-focus-your-game-design/). Repo: wc -l shows docs/FEATURES.md 370, docs/MINIGAMES.md 261, docs/NEXT.md 511, racing-core/PLAN.md 741. grep found no pillars, core loop or one-sentence concept in docs/. README.md lists only lab pages. HANDOFF line 89 item 75(b) has a draft 'game feel goal' that could seed a pillar.
   - Why it matters: With two AI assistants and many sessions, a short shared picture of the game keeps everyone building the same thing. It also gives the owner a quick, fair way to say no to new ideas without feeling the idea is lost.
   - Suggestion: Write one page: a one-sentence pitch, 3 pillars (for example, the draft 'throws and shots feel performed by a human body' could be one), the core loop in a simple diagram, the first-version feature list, and a 'not now' list. Keep it current and have both assistants read it first.
   - Time saving: Saves repeated explanations each session and quick-checks every new idea in seconds.
   - Verdict: confirmed
   - Verifier note: wc -l confirms FEATURES 370, MINIGAMES 261, NEXT 511 and racing PLAN 741 lines. A search for 'the game is', 'game where', 'out of scope', 'not now', 'pillar' or 'core loop' in docs/, README.md and the racing PLAN found nothing. No single page says what the game is or what is out of scope. HANDOFF line 89 item 75(b) holds the draft game-feel goal, as cited. Extra support: the current official Claude Code best-practices page (code.claude.com/docs/en/best-practices) recommends writing a short SPEC.md as 'a written definition of done' before building.

6. **Time-box every experiment and decide in advance what 'fail' looks like**
   - Id: RES-6
   - Kind: opportunity
   - Severity: high
   - Detail: Many hits started as very short experiments: Carnegie Mellon's Experimental Gameplay Project made 50 one-person games in under 7 days each (one became World of Goo). Celeste began as a 4-day game jam. Minecraft's first alpha took about 6 days. Balatro's first prototype came within weeks. Supercell, a large studio, has killed more than 30 games to find 5 hits, and decides against games that the numbers say are a 'no go'. The habit worth copying is to set a time limit and a clear pass or fail question before starting each experiment.
   - Evidence: Gray, Gabler, Shodhan, Kucic, 'How to Prototype a Game in Under 7 Days', Gamasutra 2005: rules '<7 days', 'exactly one person'; Tower of Goo became World of Goo (https://www.gamedeveloper.com/game-platforms/how-to-prototype-a-game-in-under-7-days). Celeste 4-day PICO-8 jam (https://www.nintendolife.com/news/2018/01/feature_conquering_the_indie_mountain_with_celeste_creator_matt_makes_games). Supercell 30+ games killed and 5 hits (Paananen, Feb 2023), 'kill their darlings' (https://www.pocketgamer.biz/brawl-stars-was-very-much-on-the-edge/ ; https://gameworldobserver.com/2024/03/14/all-games-killed-by-supercell-everdale-hay-day-pop-clash-mini). Repo context (lead-measured): about 32 top-level folders, many of them separate labs (elbow-lab, foot-lab, hand-lab, wrist-lab, walk-test, run-test and others).
   - Why it matters: Without a time limit, an experiment can quietly turn into weeks of tweaking. A pre-agreed 'fail' rule makes it easy to stop or switch without arguing with yourself.
   - Suggestion: For each new test or lab, write one line before starting: the question it answers, the time limit (for example 2 sessions), and what counts as pass or fail. When time is up, keep it, cut it, or schedule one more round on purpose.
   - Time saving: Caps how long any dead end can eat. Many labs could be closed or merged once their question is answered.
   - Verdict: confirmed
   - Verifier note: Supercell's 'launched 5 hit games but killed 30+' is confirmed (Paananen blog, February 2023, via GamesBeat and Game World Observer). 'Kill their darlings' is a GamesBeat headline, not a confirmed Paananen quote. I added repo evidence by measuring git history per folder. elbow-lab, wrist-lab, oval, lab and movement each had commits on only one day. hand-lab was active 17-18 Nov only. walk-test and run-test stopped on 19 Nov. Yet all of these are still built on every publish: package.json 'build' chains build:hand-lab, foot-lab, wrist-lab, elbow-lab, run-test, walk-test and others. So experiments without an end date really do pile up here.

7. **Real players, not checklists, are the true 'it works' test**
   - Id: RES-7
   - Kind: opportunity
   - Severity: high
   - Detail: Balatro's creator knew he had something when a friend played the prototype for '20, 30, or 40' hours. Minecraft was posted to a developer forum within a week and improved from the feedback. Undertale released a short demo after about 5 months and used it to raise $51,124 on Kickstarter. Tiny Glade added features players asked for. LetsGo already publishes to a public web link, so it can be shared with a few people today, at no cost.
   - Evidence: Balatro friend anecdote (https://www.pcgamer.com/games/roguelike/localthunk-had-made-hobby-games-in-the-past-but-realized-balatro-was-something-special-when-a-friend-revealed-he-had-played-it-for-20-30-or-40-hours). Minecraft TIGSource post 17 May 2009 (https://www.pcgamer.com/the-first-moments-of-minecraft). Undertale demo then Kickstarter (https://pcgamer.com/the-making-of-undertale ; https://undertale.wiki/w/Kickstarter). Tiny Glade player-requested features (https://80.lv/articles/feedback-matters-tiny-glade-devs-implement-requested-features/). Repo: README.md lines 5–7 give public GitHub Pages links to the Test Lab and Racing Lab.
   - Why it matters: Automated tests can show the code runs, but only people can show it is fun and understandable. Waiting too long to show anyone risks building the wrong thing for months.
   - Suggestion: Once the first playable loop exists, watch 3 friends or family play it on their own phones without explaining anything, and note where they get confused or stop. Repeat after each big change. Since the owner worries about idea theft, keep these early tests to trusted people.
   - Time saving: One 10-minute watch session often reveals problems that would otherwise take weeks to notice.
   - Verdict: confirmed
   - Verifier note: README.md lines 5-7 give public GitHub Pages links. The Balatro friend story ('20, 30, or 40 hours') and Minecraft's TIGSource post are confirmed in search results. One nuance for the suggestion: the pages and the source code are already public, so anyone with the link can see the game today. 'Keep tests to trusted people' controls who you ask for feedback, not who can see it.

8. **Restarting, rebuilding and building tools instead of the game are common traps**
   - Id: RES-8
   - Kind: risk
   - Severity: high
   - Detail: Restarts are a real pattern here, and bigger than the inspector showed. A racing version that already had computer opponents and race checks was set aside for a fresh rebuild, without comparing the two. A complete new avatar was rejected and mostly reverted. Two assistants each built their own walking test, and both were removed. The project itself is a fresh start after 3D-WORLD-3.
   - Evidence: Duke Nukem Forever: Quake II engine to Unreal to newer Unreal, 2005 quote 'Basically, we threw everything out and started again', 1997–2011 (Wired 'Learn to Let Go' Dec 2009, https://longform.org/posts/learn-to-let-go ; https://tcrf.net/Prerelease:Duke_Nukem_Forever). Animal Well engine (https://gamedeveloper.com/design/why-animal-well-s-home-brewed-engine-was-key-to-its-success). Derek Yu, 'learn to finish games consistently and efficiently' and 'don't fall in love with your development tools' (secondary, via https://gamedeveloper.com/design/-i-spelunky-i-designer-want-to-be-an-indie-then-learn-how-to-finish-games-reliably). Schreier's interviewees blamed tools for delays (https://gamedeveloper.com/design/5-key-lessons-from-the-candid-game-dev-book-blood-sweat-and-pixels). Repo: docs/HANDOFF.md line 16 (walking and running removed), line 26 item 12 ('starting again from the clean torso'), line 78 item 64 ('let's restart with the hip joints again'). Lead-measured: build script chains 15 separate per-lab builds.
   - Why it matters: Each restart feels like progress but resets the clock. With AI, restarting is cheap to start but expensive to finish, so the pattern can repeat without anyone noticing.
   - Suggestion: Before any restart, ask: what exactly failed, and can a smaller fix solve it? Prefer adjusting the working version over starting fresh. Fair note: item 64 kept the hip work as a visual sketch without hard-coding, which is a sensible way to experiment.
   - Time saving: Each avoided restart saves the days it takes to rebuild back to where things were.
   - Verdict: partly_true
   - Verifier note: The general lesson stands, but the repo evidence is weak and misses the strongest cases. (1) Racing: commit on 2026-11-18 'Rebuild four-track racing core with physics-driven opponents and race validation'. racing-core/PLAN.md line 11 says 'start fresh... The owner explicitly declined a comparison/audit against the previous rebuild', and line 18 says 'Rejected as the new foundation: extending/tuning the earlier racing prototype'. A version with opponents and race checks was set aside for a fresh build that still has no race. (2) Avatar: HANDOFF line 56, item 42, says the complete socketed new avatar was 'nothing like I envisioned', and most parts were reverted to the original from 3D-WORLD-3 after items 9-41 of work. (3) Walking: Codex's movement/ and Claude's motion-lab/ were parallel competing walking tests (docs/NEXT.md items 4 and 7), and both were later removed. (4) The whole repo is a fresh start after 3D-WORLD-3 (CLAUDE.md rule 9). On sources: the Animal Well nuance is that his general-purpose engine-first project was the trap, while Game Developer's headline says his later game-specific engine 'was key to its success'. So focused tools paid off. The '15 per-lab builds' point is not evidence of building tools instead of the game.

9. **Small, checkable steps plus automatic tests are the best-supported way to work with AI, and the project already does this**
   - Id: RES-10
   - Kind: strength
   - Severity: high
   - Detail: Automatic checks block publishing, but only for racing, input and the old approved avatar. There are about 43 test scripts, and only 4 run before publishing. The checks for the new avatar and the karts, where most current work happens, do not block anything. The habit is strong and worth keeping, but the gate does not cover the parts being changed most.
   - Evidence: Claude Code best practices, 'Give Claude a way to verify its work' (https://code.claude.com/docs/en/best-practices). Power-user tips: 'If you only adopt one practice, make it that one' (https://support.claude.com/en/articles/14554000-claude-code-power-user-tips). DORA 2025 (https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report). Kent Beck on agents deleting tests (https://www.kentbeck.com/summaries/augmented-coding-beyond-the-vibes/ and Pragmatic Engineer interview, secondary). Willison: comprehensive test suites make coding agents effective (https://simonwillison.net/2025/Oct/7/vibe-engineering/). Repo (lead-measured): .github/workflows/deploy.yml runs test:lab-foundations, test:official-avatar, test:racing-core, build and test:lab-foundations-browser before publishing; package.json has about 60 test scripts; CLAUDE.md section A asks for chunked, tested work.
   - Why it matters: This is the main protection against the AI quietly breaking something that used to work, which a non-programmer owner could not easily spot.
   - Suggestion: Keep it. Add a simple rule that no assistant may delete, skip or loosen a test without saying so plainly in its summary. Once the first playable loop exists, add one automated 'can you play from start to finish' check for it.
   - Time saving: Catches breakages automatically instead of the owner discovering them on the phone days later.
   - Verdict: partly_true
   - Verifier note: package.json has 64 scripts in total, of which 43 are 'test:*' scripts, not about 60. The publish gate (.github/workflows/deploy.yml) runs only 4 of them: test:lab-foundations, test:official-avatar, test:racing-core and test:lab-foundations-browser. test:new-avatar (avatar-v2 checks) and test:karts (kart-parts) are not in the gate, yet those are the two most active areas since 20 Nov. So tests block bad changes for racing, input and the old official avatar, but not for the current avatar and kart work. The gate also has a cost. HANDOFF line 88 (item 74) records that a failing Codex driving test blocked Claude's avatar change, and deploy.yml has 'cancel-in-progress: true', so every push restarts the roughly 10-minute publish. The Anthropic source holds: the current page has a section 'Give Claude a check to run' and says 'the single most useful line in your CLAUDE.md is the command that runs it'.

10. **Keep one short, current source of truth for the AI assistants**
   - Id: RES-12
   - Kind: opportunity
   - Severity: high
   - Detail: The required start-of-session reading is about 15,600 words, not about 440 lines. The handoff file alone is about 13,000 words, because each item is one very long line. It mixes current state with a long history of shape tweaks. Anthropic's current guidance says to keep these files short, because every line takes attention on every task and long files make rules get lost. Moving history into an archive would save usage every session.
   - Evidence: Claude Code docs: context window 'fills up fast, and performance degrades as it fills' (https://code.claude.com/docs/en/best-practices). 'Keep CLAUDE.md concise' / 'Bloated CLAUDE.md files cause Claude to ignore your actual instructions' as quoted by third-party guides, not confirmed on the official page (https://www.datacamp.com/tutorial/writing-the-best-claude-md ; https://dev.to/iggredible/your-claudemd-is-probably-too-long-17bi). 'A GDD that does not match the game is worse than no GDD' (vendor blog, https://ziva.sh/blogs/game-design-document). Repo: wc -l gives CLAUDE.md 89, docs/HOW-TO-WORK-WITH-ME.md 106, docs/HANDOFF.md 185, docs/COLLABORATION.md 64 (444 total). CLAUDE.md line 7 'Where anything below disagrees with it, that file wins'. docs/HANDOFF.md line 117: 'docs/NEXT.md is a long log. Items 41 to 46 describe code that no longer exists'. 82 .md files outside node_modules.
   - Why it matters: When rules are spread across many files and old notes stay mixed with current ones, each assistant may follow a different or outdated version. The owner then pays for corrections.
   - Suggestion: Keep three short living files: the one-page game plan (RES-5), a current-status page (what works, what is next), and the working-style rules. Move old logs into an archive folder so assistants do not read them as current instructions.
   - Time saving: Shorter session start-up, fewer misunderstandings, less repeated correction.
   - Verdict: partly_true
   - Verifier note: The core is right, but the size is badly understated and one quote is outdated. Line counts (444) hide that HANDOFF items are very long single lines. wc shows CLAUDE.md 886 words, HOW-TO-WORK-WITH-ME 948, HANDOFF 13,101 words (78,920 bytes) and COLLABORATION 657: about 15,600 words, or roughly 95 KB, read at the start of each session. HANDOFF alone is about 84% of that. HANDOFF line 117 confirms NEXT.md items 41-46 describe code that no longer exists. I fetched code.claude.com/docs/en/best-practices. The quote 'fills up fast, performance degrades as it fills' is not on the current page, which lists 'the context window is your main constraint' under old advice you can stop following. The page does say 'Keep CLAUDE.md short... every line in it takes a little of Claude's attention on every task' and 'If the line is getting lost in a long file, the file needs to be shorter'. It also says a focused context 'gets you better answers and costs less'. I raised severity because CLAUDE.md B.3 makes 'not wasting the owner's usage' the top priority, and this cost is paid every session.

11. **Start the first complete loop from the part that already feels good: driving**
   - Id: RES-14
   - Kind: opportunity
   - Severity: high
   - Detail: Turning the approved driving test into a full race is probably the fastest way to a first playable game. The steps (countdown, laps, finish time, respawn) are already written in Codex's racing plan as the next section, waiting only for the owner's Go. It is quickest on one of the four tracks already in the new racing code, such as the Original Circuit. The owner's favourite banked oval would need to be brought over first.
   - Evidence: Tiny Glade began as a weekend procedural wall generator (https://80.lv/articles/exclusive-tiny-glade-developers-discuss-bevy-proceduralism-publishers-cozy-games). Vampire Survivors 'didn't have a vision' and added elements to see what was fun (https://www.pcgamer.com/vampire-survivors-creator-didnt-have-a-vision-when-he-started-making-the-game-that-allowed-him-to-quit-his-job). Repo: README.md line 6 'the approved driving-feel test on four tracks'. docs/NEXT.md line 32 'The owner really likes the banked NASCAR-style oval'. docs/FEATURES.md Online players card item 3: 'single player first; online later'.
   - Why it matters: Building on something already approved gives a playable game soonest and proves the whole chain: controls, phone, menus, results. It also gives friends something real to test.
   - Suggestion: Ask Codex for the smallest full race on the oval: countdown, 3 laps, lap timer, finish screen, restart. Then add the avatar walking to the kart as the next link between the two halves of the project.
   - Time saving: Reuses approved work rather than waiting for avatar movement to be finished before anything is playable.
   - Verdict: partly_true
   - Verifier note: The recommendation is sound, but one detail is wrong. The banked oval is not in the current racing core. racing-core/track/reference.json has only the original, skyline, suzuka and winding tracks. The oval lives in the old Oval Lab (src/oval.ts, added 17 Nov from 3D-WORLD-3). A race 'on the oval' would first need the oval brought into the new racing code. The inspector also missed that this exact step is already planned: racing-core/PLAN.md line 79, Section 4 'Race rules', not started and waiting for Go. README line 6, NEXT.md line 32 and FEATURES.md line 345 ('single player first; online later') are cited correctly.

12. **Backups and checkpoints: a real strength (Stardew nearly died without them)**
   - Id: RES-9
   - Kind: strength
   - Severity: medium
   - Detail: Stardew Valley was almost cancelled when its creator's PC crashed and he had no proper backups. He later called the whole development 'so sloppy'. LetsGo keeps everything in git on GitHub, saves frozen checkpoints of approved versions, and runs tests before publishing, so work is very unlikely to be lost. One small gap: two safety tags exist only on one machine because the push was refused.
   - Evidence: Stardew backup story, 2016 PC Gamer interview republished in 2026 (https://www.gamesradar.com/games/simulation/stardew-valley-was-almost-canceled-after-eric-barones-pc-died-without-backups-it-feels-crazy-that-it-all-worked-out/). Repo: checkpoints/ folder (lead-measured 51M). CLAUDE.md rule 17 preserves approved baselines. docs/HANDOFF.md line 111: 'Two safety tags ... exist only on the machine used and could not be pushed (error 403)'.
   - Why it matters: Losing work is one of the few things that can end a solo project overnight. Having this already handled means the owner can experiment more freely.
   - Suggestion: Keep this habit. Make sure every important tag or checkpoint is also on GitHub, not only on one computer. Note: the repo is public, which protects against loss but not against copying. That belongs to the separate legal and business review.
   - Time saving: Any mistake can be undone in minutes instead of being rebuilt.
   - Verdict: confirmed
   - Verifier note: docs/HANDOFF.md line 111 confirms two safety tags were never pushed (error 403), and an older tag 'also looked local'. checkpoints/ exists, and CLAUDE.md rule 17 preserves baselines. The Stardew backup story is from the cited GamesRadar article (not re-fetched). The note that a public repo does not protect against copying is correct.

13. **AI makes starting easy and finishing hard: measure progress by what is playable, not by activity**
   - Id: RES-11
   - Kind: risk
   - Severity: medium
   - Detail: A careful 2025 study found experienced developers were 19% slower with AI tools while believing they were 20% faster. Addy Osmani (Google) describes the '70% problem': non-engineers get 70% of the way quickly, but the last 30% (edge cases, fitting pieces together) gets much harder. GitClear's data suggests AI-era code has more copy-paste and less clean-up. LetsGo has very high activity (427 commits on 9 working days), but the main playable pieces (walking, running, a full race) are not done yet.
   - Evidence: METR RCT, 16 developers, 246 tasks: +19% completion time; expected −24%, believed −20% after (https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/). Osmani '70% problem' (https://newsletter.pragmaticengineer.com/p/how-ai-will-change-software-engineering ; https://www.oreilly.com/library/view/beyond-vibe-coding/9798341634749/ch03.html). GitClear 2025, 211M changed lines: in 2024 copy/pasted lines exceeded moved lines; duplicated 5+ line blocks up 8x (vendor data; https://www.devclass.com/ai-ml/2025/02/20/ai-is-eroding-code-quality-states-new-in-depth-report/1626250). Repo: lead-measured 427 commits, 9 distinct days. README.md line 6 and docs/HANDOFF.md line 16 for current playable state.
   - Why it matters: Lots of commits and new labs can feel like fast progress while the game itself stays unplayable. The owner's limited time and usage are best spent on finishing.
   - Suggestion: Track one simple progress measure: 'What can a player do today, start to finish?' Review it weekly. Ask the assistants to finish and connect existing pieces before starting new ones.
   - Time saving: Keeps effort on the last 30% that actually makes a game work, instead of many 70%-done parts.
   - Verdict: confirmed
   - Verifier note: I trust the METR, Osmani and GitClear figures as stated (they match my knowledge; GitClear is vendor data, as the inspector flagged). The repo has 427 commits on 9 distinct days (git log), and 51 of them are merge commits. Nothing playable from start to finish exists yet (README line 6; HANDOFF line 16). The finding holds.

14. **Borrow the studio milestone ladder in a tiny, solo-sized form**
   - Id: RES-13
   - Kind: opportunity
   - Severity: medium
   - Detail: A small milestone ladder with a 'done when' test for each step would help. The project already does this well for racing (Codex's plan has a gate table with required proof per step). The gap is that the whole game has no such ladder.
   - Evidence: Stage definitions: https://learn.unity.com/tutorial/the-stages-of-game-development ; Chandler, The Game Production Handbook, code-release chapter (https://www.oreilly.com/library/view/the-game-production/9781449688097/). Anthem: about 7 years in development, about 18 months in full production; E3 2017 demo 'barely even a single mission had been implemented' (Schreier, Kotaku, https://kotaku.com/how-biowares-anthem-went-wrong-1833731964). Existing repo doc docs/game-dev/13-production.md lines 3–15 already lists the stages but gives no exit tests.
   - Why it matters: Clear 'we are done with this stage when...' tests stop endless tinkering and make it obvious what to work on next.
   - Suggestion: Add a short milestone list to the one-page plan. Example: M1 first playable race loop. M2 avatar walks and runs in the same world. M3 one minigame. M4 menus and saving. M5 a small test group plays it. Give each milestone one sentence that says when it is done, and do not start the next until the owner confirms it.
   - Time saving: Removes the daily 'what next?' decision and stops polish from creeping into early stages.
   - Verdict: partly_true
   - Verifier note: docs/game-dev/13-production.md lines 3-15 list stages without exit tests, as stated. But the inspector missed that racing-core/PLAN.md lines 70-83 already use exactly this pattern: a table of sections, each with 'Required proof before review' and a status ('Not started; requires go'). So exit tests per milestone are already practiced for racing, just not for the whole game. I did not re-check the Anthem figures (7 years, about 18 months of real production); they match common reporting of Schreier's Kotaku piece.

15. **Burnout and perfectionism hit solo creators hard: pace the work**
   - Id: RES-15
   - Kind: risk
   - Severity: low
   - Detail: Solo creators often burn out (Stardew Valley's creator worked very long days for years). Pacing the work with small weekly wins is sensible general advice. There is no sign in the repo that this is happening to the owner now, and the Balatro example is about a break taken out of boredom early on, not about recovering from crunch.
   - Evidence: Stardew hours and burnout, via a summary of Schreier's 'Blood, Sweat, and Pixels' (https://www.shortform.com/blog/how-was-stardew-valley-made/); perfectionism 'almost derailed it' (https://apps.apple.com/au/story/id1440669118). Balatro crunch and health (https://gamesradar.com/games/roguelike/i-was-in-super-crunch-mode-balatro-creator-opens-up-on-the-toll-the-stress-of-indie-development-took-on-his-physical-and-mental-health); 3-month break (https://www.pcgamer.com/games/localthunk-gave-up-making-balatro-for-3-months-but-resumed-because-i-was-bored-but-the-internet-was-out-so-i-couldnt-play-rocket-league).
   - Why it matters: A one-person project only moves forward while the one person stays motivated. Endless fine-tuning of small details is a common way to lose energy without seeing the game come alive.
   - Suggestion: Set a steady weekly rhythm with a small visible win each week, such as a new playable step. Save fine-detail polish for planned polish passes, not every session.
   - Time saving: Avoids long stalls from burnout, which cost far more time than short, regular breaks.
   - Verdict: partly_true
   - Verifier note: The Stardew burnout and long hours are confirmed by multiple sources. The Balatro framing is wrong. The roughly 3-month break was in March 2022, a few months into development (PC Gamer). By the headline, he resumed 'because I was bored but the internet was out', not as recovery from crunch, and the 'super crunch' came later, near launch. So 'both games were saved partly because their makers stepped back' is not supported for Balatro. No repo evidence was offered that the owner is burning out. Commit times are spread over all 24 hours, but they are made by AI agents, so they say nothing about the owner's hours. I lowered severity because the risk is general and not shown in this project.

16. **The project's own notes already capture good studio basics: build on them**
   - Id: RES-16
   - Kind: strength
   - Severity: low
   - Detail: The project's game-development notes already teach the right order: concept, plain-shape prototype, vertical slice, production, polish. They also include the Super Mario 64 'controls first in an empty room' story and Halo's '30 seconds of fun' idea. The owner has also started writing a clear game-feel goal for throws and shots. What is missing is turning that knowledge into the actual plan and gates described above.
   - Evidence: docs/game-dev/13-production.md lines 3–15 (stages, gray boxing, Mario 64 camera-first) and lines 17–25 (habits: small scope finished, playtest with others, keep the game playable every day). docs/game-dev/01-foundations.md section G (Halo '30 seconds of fun'). docs/HANDOFF.md line 89 item 75(b) draft game-feel goal.
   - Why it matters: The owner does not need new theory. The knowledge is already written down, and the gain comes from applying it as rules for what gets built next.
   - Suggestion: Link the one-page plan and milestone list directly to these notes. When a new idea comes up, check it against 'small scope, finished' and 'keep the game playable every day' from 13-production.md.
   - Time saving: No need to research process again; reuse what is already written.
   - Verdict: confirmed
   - Verifier note: docs/game-dev/13-production.md lines 3-15 (stages, gray boxing, the Mario 64 camera-first story) and lines 17-25 (habits including 'Small scope, finished' and 'Keep the game playable every day') match. docs/game-dev/01-foundations.md line 126 is section G, the Halo '30 seconds of fun' principle. HANDOFF line 89 item 75(b) holds the draft game-feel goal.

### Missed by inspector found by skeptic

1. **The owner's 'research every substep, every line permanent' rule fights against fast prototyping**
   - Kind: risk
   - Severity: high
   - Detail: The owner's main working rule asks both assistants to research and compare 'five or a hundred' options before every task, step and substep. It also says to write every line as if it is permanent, like the foundation of a house. That fits final, approved code. But every solo hit in the research found the fun with quick, rough, throwaway tests (Minecraft in about 6 days, Celeste in 4, prototypes in under 7 days). Using the 'permanent foundation' standard on experiments makes each try slow and expensive, and makes it harder to throw a bad idea away. The owner already slips into a lighter mode sometimes ('we're just keeping the visuals, so don't try to hardwire the code').
   - Evidence: docs/HOW-TO-WORK-WITH-ME.md lines 20-26 ('This applies to every task, question, prompt, plan, step, and substep... whether that's five or a hundred'), line 45 ('Never start a task until I say Go'), lines 99-104 ('the first line of code is the foundation'; 'Write every line as if it's permanent'). HANDOFF line 78, item 64, shows an informal visuals-only prototype mode. The current Claude Code best-practices page (code.claude.com/docs/en/best-practices, 'What you can stop doing') says piling on emphasis 'mostly makes Claude over-apply the rule' and that 'keep going' style lines 'are more likely to cause over-work'.
   - Suggestion: Use two clearly named modes. 'Sketch mode' is for experiments: quick, rough, time-limited, light research, allowed to be thrown away. 'Build mode' is for anything approved to keep: full research, tests and the permanent-code standard. Say which mode each task is in when the owner says Go.

2. **The racing half is spreading wide too: three modes, real F1/GT3 car models and body lineups, while race rules have not started**
   - Kind: risk
   - Severity: high
   - Detail: The inspector looked mostly at the avatar, but the racing side shows the same widening. The plan now has three racing modes, each with its own driving feel and its own tracks. It also has a parts kit with weapons, neon lights and a night mode, and many kart body options. Codex has been tuning detailed real-world presets (a 2026 Formula 1 car with an 8-gear turbo engine, active aero and energy deployment, plus a GT3 car). Meanwhile the basic race rules (countdown, laps, finish time) are still 'not started'. More realism in more car types does not get the game closer to being playable.
   - Evidence: docs/KARTS.md lines 13-23 (three racing modes, 'Each mode has its own tracks'). docs/karts/PARTS-KIT.md line 8 (weapons), line 27 (night mode, neon), line 39 (S-07 Neon lighting). docs/karts/F1-DRIVING-REFERENCE.md line 92 (1.6 L turbo V6, 8 forward gears). docs/HANDOFF.md Codex section (GT3 V3, 2026 F1 preset). racing-core/PLAN.md line 79 (Race rules: 'Not started; requires go'). git log since 2026-11-20: about 62 of 150 subjects are kart or driving, e.g. 'Add twelve S Kart stock body candidates for review', 'Add calibrated 2026 F1 tune and driving comparison', 'Add GT3 V3 driving comparison preset'.
   - Suggestion: Pause new car classes, presets and body options. Ask Codex to start Section 4 (race rules) on one track with the already-approved Fast kart, and treat the other modes as 'later'.

3. **Racing already uses studio-style gates with proof required at each step**
   - Kind: strength
   - Severity: medium
   - Detail: Codex's racing plan is a good model for the rest of the game. Each step has a clear focus, a written 'proof required before review', and a status that waits for the owner's Go. This is exactly the 'gate' habit that studios use, already working in this project. It could be copied for the avatar and the whole game.
   - Evidence: racing-core/PLAN.md lines 70-83: table 'Sequence and approval gates' with columns Section / Focus / Required proof before review / Status. Sections 1-3 are approved or built; Sections 4-8 (race rules, opponents, ghosts, device controls, playable build) are each 'Not started; requires go' or 'Deferred'.
   - Suggestion: Reuse this same table format for a one-page whole-game milestone list, and for avatar movement (stand, walk, run, throw), so every area has the same clear 'done when' tests.

4. **The shared ~10-minute publish loop slows the owner's look-and-feel checks**
   - Kind: risk
   - Severity: medium
   - Detail: Studios stress fast iteration: change something, try it, repeat. Here, every push by either assistant restarts one shared publish that builds all 15 lab pages, which takes about 10 minutes. A failing test from one assistant blocks the other's changes from going live. The owner noticed this as 'why am I waiting like 10 minutes'. Since the owner judges almost everything by eye on the live link, this wait sits inside nearly every decision.
   - Evidence: .github/workflows/deploy.yml lines 15-17 ('concurrency: ... cancel-in-progress: true') and the build step running 'npm run build', which chains 15 per-lab builds (package.json 'build'). docs/HANDOFF.md line 88, item 74: 'every push from either of us restarts the ~10-minute publish, and a failing test blocks everyone's changes'. docs/game-dev/13-production.md section B.1 'Iterate fast on feel'.
   - Suggestion: Stop building pages for finished or abandoned labs, so the publish gets shorter. Have the assistants batch small look tweaks into one push. Consider a quicker preview link for look-only checks, so the full publish is not needed for every small change.

5. **Many Codex commits are recorded under the owner's name, so the author counts understate Codex**
   - Kind: risk
   - Severity: low
   - Detail: The lead's figures (owner 104 commits, Codex 17) likely mix Codex's work into the owner's count. Commits that match Codex's own driving handoff carry the owner's name. This matters for judging who is doing what and for any future ownership or legal record of who wrote the code.
   - Evidence: git log shows 'Add GT3 V3 driving comparison preset', 'Add calibrated 2026 F1 tune and driving comparison' and 'Rebuild four-track racing core with physics-driven opponents and race validation' authored by 'Isaias U'. docs/HANDOFF.md's 'Codex driving handoff' section describes GT3 V3 and the 2026 F1 preset as Codex's work. git log --format=%an: Claude 304, Isaias U 104, Codex 17, isaiasurrutia96 2.
   - Suggestion: Ask Codex to commit under its own name, or add a 'Co-authored-by' line, so the history clearly shows which work came from which assistant.

## First draft master plan (23 Nov, superseded by later work)
**Current phase:** Late prototype stage of pre-production. The project has not yet passed the first real studio gate, the "first playable". Studios usually go: concept page, then rough prototypes, then a first playable (one small loop you can actually play), then a vertical slice, alpha (all features in), beta (all content in, then polish), launch, and updates. LetsGo skipped the concept page: there is no one-sentence pitch, no core loop, no pillars and no Version 1 list anywhere in the repo. It now has several good prototypes that live apart from each other. The driving feel is approved and frozen twice (Fast handling, Driving Checkpoints 1 and 2). The avatar can hold 8 poses but cannot walk, because walking and running were removed on 20 Nov. There is a block island with real solid ground, and 35 approved design cards. In 9 working days (427 commits) the avatar, the kart and the island have never been in the same world, and there is no race with a finish line. The good news is that a scratch test built the island, the phone-ready Game avatar, the movement rules, the kart physics and the shared controls into one file with zero errors. So the road to a first playable is mostly decisions, connecting parts and getting a simple walk working. It is not a rewrite. Note: this checkout is about 5 commits behind GitHub, so recheck the newest state before starting.

### Biggest gaps
1. No one-page game plan. Nothing says in one sentence what the game is, who it is for, what the player does minute to minute, which 3 or 4 ideas every decision must serve, or what Version 1 contains. The repo's own production notes say this page comes first (docs/game-dev/13-production.md).
2. No first playable. The avatar, the kart and the island have never been in one world. Every page builds its own scene, camera, loop and controls (about 18 to 20 separate pages), and there is no shared 'game shell' for things to plug into.
3. No actual race. Countdown, laps, finish line, results, computer opponents and ghosts are all 'Not started; requires go' in racing-core/PLAN.md sections 4 to 8. Most of that logic already existed once, in the old 18 Nov prototype (about 254 lines that still pass tests).
4. The avatar cannot walk, run or jump. The movement rules handle flat ground only (no jumping, gravity or collision), nothing connects a character to the island's solid ground, and no movement code has changed since the 20 Nov reset.
5. No decided game avatar. The phone-ready Game copy (about 29,000 triangles, approved as smooth) can move. The New avatar has only been judged as still pictures: it is about 509,000 triangles (17 times the owner's own phone budget) and is not attached to the skeleton. Newer commits have removed the movable avatar from the Test Lab menu.
6. No reason to keep playing yet. There are no coins on a results screen, no shop, no levels and no save system. Ten places in the cards depend on 'levels', but nothing explains how you earn them.
7. No world big enough to play in. The island is about 6 m across, so a kart drives off it in half a second. Block-world sizes (the oval's road is under 2 m) and racing sizes (26 m roads, tracks several km long) have never been matched up.
8. A slow feedback loop. Each push waits about 6 to 10 minutes before the owner can look, mostly for driving browser checks, and pushes cancel each other. There is no one-command quick check, and a new session must read about 17,000 words before starting.
9. The idea is exposed. The full game design and the kart art sit in a public repo with no license, and Nintendo's Mario model and walk animation are published on the public test site.
10. Loose ends between the two assistants. There are two different sets of kart sizes (for example F1 is 2.9 m in Claude's models and 4.6 m in Codex's physics), nobody owns kart-against-block collision, and nobody owns 'putting it all together'.

### Phases

1. **Phase 0: Point the project (decide and protect)**
   - Goal: Give both assistants one clear target and close the cheapest idea-protection gaps, before any more building.
   - What gets built:
     1. A one-page GAME-PLAN: the pitch sentence, target player, 3 or 4 pillars, the core loop in a few lines, the Version 1 list, a 'not now' list, and the milestone ladder below. Claude drafts it from existing notes and the owner edits it.
     
     2. Every feature and minigame card tagged 'First Playable', 'Version 1' or 'Later'. No cards are deleted.
     
     3. A short CURRENT-STATE page (one screen: what's live, what's being worked on, open decisions, next step) that becomes the only required reading. The 13,000-word handoff diary moves to a history log that nobody has to read at the start.
     
     4. A folder status table at the top of the README: each folder, what it is, current or old, and who owns it.
     
     5. A written freeze on avatar and kart looks at 'good enough placeholder', plus a looks wishlist so ideas are saved rather than built now.
     
     6. The protection steps listed under protect_now: shorter test-result storage first, then GitHub Pro and private repos, email privacy, and the Mario pages taken off the site.
     
   - Exit test: The owner reads the one-page plan and says 'yes, that is my game'. A fresh assistant session can start by reading under about 2,000 words. The repo is private and the owner's phone test link still opens.
   - Rough size: 1 to 3 days, mostly the owner's reading and decisions. The writing itself is about 1 to 2 assistant sessions.

2. **Phase 1: Speed up the workshop**
   - Goal: Cut the wait between 'change made' and 'owner can test it', and make breakage show up right away, so every later phase moves faster.
   - What gets built:
     1. Pushes that only change notes no longer start the 6 to 10 minute publish. This is a small setting in the publish workflow.
     
     2. Browser test results are kept for 1 to 3 days, or saved only when a check fails. This also prevents a storage cap from blocking publishing once the repo is private.
     
     3. The fast checks for Claude's area (skeleton, pose, balance, reach, grip, world, island, new avatar, karts) added to the publish checks. Together they take under a minute.
     
     4. One 'quick check' command (under a minute, run after every change) and one 'full check' command (before milestones), listed first in the README.
     
     5. One file that names the Node version, matching the publish computer (Node 24).
     
     6. The site's front address sends visitors to the Test Lab instead of the 17 Nov prototype.
     
     7. The old joint study pages (Elbow, Wrist, Feet) copied as frozen pages instead of rebuilt every time. That is about 95 of the roughly 120 seconds a build takes.
     
     8. Codex makes the one timing-sensitive driving browser test wait for the real condition (Codex's area, low priority).
     
   - Exit test: A notes-only push publishes nothing. The quick check runs in under a minute. A full local build takes well under a minute. The publish time is measured before and after, and the result is written in CURRENT-STATE.
   - Rough size: About 1 to 3 assistant sessions. Codex reviews anything touching the racing checks.

3. **Phase 2: First Playable (walk to the kart, race, finish)**
   - Goal: Reach the first studio gate: one link where you control the avatar in one world, get into the approved kart, finish a real race and see your result. All looks stay placeholders.
   - What gets built:
     1. Race lane (Codex): race rules on the approved Fast kart from Checkpoint 2, on one track. That means a countdown, laps in order, wrong-way warning and respawn, finish time, results and restart, with the best time saved on the device. Codex moves the proven logic over from the old 18 Nov prototype instead of writing it fresh. Computer karts come second, reusing the old driver idea.
     
     2. Walk lane (Claude): one 'game shell' page written in TypeScript, with one world, one frame loop, one camera system and one control system (the existing universal input). Shared pieces (input, page template, chest bend and so on) move into one shared folder first, so old folders stop holding up live pages.
     
     3. Walk lane (Claude): the Game avatar (or a simple marker) on a playable-size test ground. Either the existing Neighborhood streets or a bigger block island; the assistants compare and recommend. It uses the existing movement rules plus island collision, plus jump and gravity copied from the 17 Nov front-page prototype.
     
     4. A simple key-pose idle, walk, run and jump that play faster as he speeds up. The owner approves a 30-second preview video of the walk before it is built for real, so a rejection costs minutes instead of a day.
     
     5. The join: walk up to the kart, press a button, race, see the results, step back out. The assistants agree who owns the game shell and the kart-against-block collision.
     
     6. One shared kart-size file both assistants read, so the models and the physics match.
     
     7. One automatic 'play from start to finish' check added to the publish checks.
     
   - Exit test: On the owner's own phone, from one link and without help: walk the avatar to the kart, get in, finish the race, see the time and position, get out, and do it again without reloading the page.
   - Rough size: A guess of about 2 to 4 weeks at the current pace. The race lane is probably the smaller part, because the logic was written and tested once before. The walk lane is the uncertain part: walking was rejected about 7 times. If the walk's look stalls, ship this phase with the placeholder walk and polish it later.

4. **Phase 3: Core loop and vertical slice (play, win, reward, come back)**
   - Goal: Prove the game is fun for other people: a complete 'play, earn, spend, return' loop, with one small piece shown at near-final quality.
   - What gets built:
     1. Coins on the results screen and a tiny cosmetic shop (for example a kart color, a sticker or an outfit item). No real money.
     
     2. A local save on the device for coins, best times and unlocks. No accounts and no personal data.
     
     3. One take-turns sport built on the shared ball system (for example mini golf or bowling; the owner picks). It needs only a few new movements.
     
     4. A small hub area joining the race and the sport (the watch door only if it is cheap).
     
     5. The avatar look locked in: the owner decides the look, then Claude does a clean rebuild within the 29,000-triangle phone budget. It gets fitted to the skeleton, checked in bending poses (arms up, crouch, sitting, throw wind-up), with a slider page so the owner sets sizes in one sitting.
     
     6. One near-final-quality slice, for example the race with its final kart look and sound, to prove the full art pipeline.
     
     7. A trusted playtest: 3 friends or family members play on their own phones while the owner watches silently and notes where they get stuck.
     
   - Exit test: 3 trusted testers each play about 10 minutes without help, and at least one asks to play again. Progress survives closing the browser. The game runs smoothly on the agreed target phone.
   - Rough size: Several weeks to a couple of months (very uncertain). Every solo game in the research took several times longer than its maker expected.

5. **Phase 4: Version 1 production (alpha, all Version 1 features in)**
   - Goal: Build only what is tagged 'Version 1', on top of the proven loop, and nothing else.
   - What gets built:
     1. The remaining Version 1 cards only. Likely: 2 or 3 more tracks made with a simple 'track from center points' tool, 3 to 7 computer opponents with difficulty levels, a second sport, more shop items, menus and settings, sound, and short tutorial hints.
     
     2. Shared movements reused across sports: one throw for football, frisbee and darts, and one swing for golf, bat and pool cue.
     
     3. Automatic phone-budget checks (triangles and download size) and one shared Low, Medium and High quality setting.
     
     4. A cleanup chunk: all pages built the same way (Vite), built pages no longer saved in git, and retired folders moved to an archive with the owner's approval.
     
     5. Real-world names and copies replaced: track names (Suzuka), the Porsche-inspired GT body, and the F1 and GT3 labels.
     
   - Exit test: Every Version 1 card is done and has an automatic check. Nothing was added without moving something else out. Someone outside the family can finish the Version 1 loop on a phone.
   - Rough size: Months. It depends heavily on how small the Version 1 list stays.

6. **Phase 5: Beta and launch preparation (polish plus business and legal)**
   - Goal: Make Version 1 stable and polished, and do the business and legal work needed to sell it.
   - What gets built:
     1. Bug-fixing and polish passes, and a wider private playtest where people sign a simple NDA.
     
     2. The final game name: search for existing uses, then file trademarks (classes 9 and 41).
     
     3. Copyright registration that lists which parts were AI-made, a privacy policy, an age rating, a EULA, a decision on running as an LLC or a sole proprietor, and the one-hour games-lawyer check already planned in docs/game-dev/19-legal.md.
     
     4. A store page and trailer, a choice of web host for launch, then wrapping the game for Steam and the phone stores.
     
   - Exit test: The pre-sale checklist in 19-legal.md is fully done, there are no known crash bugs, and the owner approves the launch build.
   - Rough size: Months.

7. **Phase 6: Launch and grow**
   - Goal: Release Version 1, learn what real players do, then add from the 'Later' list in order.
   - What gets built:
     1. Web launch first (the cheapest option, playable by link), then Steam and phone versions.
     
     2. Updates from the 'Later' list: more sports, more kart classes, the home island and building.
     
     3. Online play last, starting with take-turns sports (golf, bowling, darts). Worlds of 100 to 200 players, open fights and stealing come at the very end, because they need servers, moderation and accounts.
     
   - Exit test: Real players are playing, and the next update is chosen from what they actually play.
   - Rough size: Ongoing.

### Do first
1. Before any work, pull the latest main. This audit's checkout is about 5 commits behind GitHub, and those newer commits changed the Test Lab menu.
2. Owner: read this plan, say Go on Phase 0, and answer the top 5 owner decisions: the pitch, the Version 1 list, freezing looks, which avatar to use for now, and making the repo private.
3. Claude drafts the one-page GAME-PLAN from existing notes (feature cards, the pillar hints in HANDOFF line 19, the platform choice in NEXT.md), and the owner edits it. Then both assistants tag every card 'First Playable', 'Version 1' or 'Later'.
4. Write the one-screen CURRENT-STATE page, move the handoff diary to a history log, and point CLAUDE.md and AGENTS.md at the new page.
5. Protection, in this exact order. (a) Make the browser test results expire after 1 to 3 days, or save them only on failure. (b) Upgrade to GitHub Pro after checking the price on the billing page. (c) Make 3D-World-4, 3D-WORLD-3 and Gemini-3D-WORLD private. (d) Confirm the phone test link still works.
6. Take the Mario reference pages off the published site. The owner decides separately what happens to the copy inside the frozen Test Lab checkpoint 1.
7. Phase 1 quick wins: notes-only pushes skip the publish, Claude-area fast checks join the publish checks, one quick-check command, the Node version pinned, and the front page sent to the Test Lab.
8. Give Codex the Go for racing PLAN.md section 4 (race rules) on the approved Fast kart and one track, reusing the old prototype logic. In parallel, Claude starts the game shell and shows the owner a 30-second preview of a simple walk on the Game avatar before building it.

### Postpone
1. All online multiplayer: 100 to 200 player worlds, chat, friends, invites, fights between players, stealing, and the online paintball survival mode. It stays 'Later' until the single-player Version 1 is fun.
2. The big connected island world, the home island and free building.
3. 18 or 19 of the 20 minigames. Keep only the one or two chosen for Version 1.
4. Kart items and weapons (pop-up cannon, oil dropper, mystery boxes), nitro charges and night mode.
5. Extra kart classes and realism tuning (GT3, GT3 V3, 2026 F1, Early F1) and the 20-styles-per-class customization, until a real race exists.
6. Avatar look polish beyond 'good enough placeholder': centimetre sizing, ball depths and the girl avatar. It resumes in Phase 3 with a slider page.
7. About 45 or more extra movements (swimming, skateboarding, fighting, climbing, emotes), beyond what Version 1 needs.
8. A ready-made physics engine for ragdoll falls and loose objects (for example Rapier). Test it in one small lab only when throws and ragdoll falls come up.
9. Exporting the avatar as a standard GLB file instead of the custom format.
10. Moving every page to Vite and no longer saving built pages in git. Do it as one cleanup chunk after First Playable, unless conflicts force it sooner.
11. Levels and progression design. Use coins only in Version 1, unless the owner decides otherwise.
12. Business and legal work: final name, trademark, copyright registration, LLC, store pages, payments model, age rating. Only the cheap protection steps happen now.
13. Console ports and the Steam and phone store wrappers.

### Freeze or archive
1. New avatar look work: freeze at today's state as a 'looks placeholder' checkpoint and keep a wishlist. Do not delete anything. The owner approves when work resumes in Phase 3.
2. Kart look models and the extra handling setups (GT3, GT3 V3, 2026 F1, Early F1, First-drive GT, GoKart prototype): hide them from the Driving Test menu and keep the code. The approved Fast kart stays the race kart. Codex decides how, the owner approves.
3. Old prototype pages (the 17 Nov front-page prototype, walk-test, run-test, the old movement page, the avatar-lab viewer): take them off the build, the publish and the menu once the few shared files they lend to live pages have been moved to a shared folder. They stay in git history and in an archive folder. The owner approves the list.
4. Joint study pages (Hand, Wrist, Elbow, Feet): freeze them as fixed copies that are not rebuilt and remove them from the Test Lab menu. Keep their generator code, because it is needed to remake the avatar's shape file. The owner approves.
5. Old racing prototype (the 9 files at the top of racing-core): keep them until their race, driver and ghost logic has been reused. Then archive them and move their tests to an optional 'history' command. Codex decides, the owner approves.
6. Known dead files (racing-lab/src/simulation.js, racing-lab/src/track-view.js, motion-lab/src/walker.js): move them to the archive, with the owner's approval of the list.
7. SM64 and Mario reference pages and data: remove them from the publish now. The copy inside frozen checkpoint test-lab-1 needs a recorded owner decision, because the rule says frozen checkpoints never change.
8. The unused 35.8 MB avatar master file: stop publishing the second copy. The checkpoint keeps its own copy and the repo keeps the master.
9. Docs: rename NEXT.md and the HANDOFF diary as history logs, and mark the deleted-walking items as 'removed in the 20 Nov reset'. Nothing is deleted.
10. Branches claude/relaxed-wozniak-iznto4 and avatar-preview: record their useful decision in the decisions log, then leave them archived. The owner approves.

### Owner decisions
1. Game pitch: accept the drafted sentence ('Run, drive and play real-feeling sports across an island world as a chunky ragdoll athlete, winning coins and prizes to customize your kart, outfit and home'), edit it, or write your own?
2. First Playable content: (A) race first: walk to the kart, race, finish (recommended, because racing is furthest along), (B) island first: walk and jump plus one sport, or (C) both at once (slower)?
3. Main feel pillar: arcade first with a touch of realism (recommended), realistic simulation, or pure cartoon arcade?
4. Avatar for First Playable: the phone-ready Game copy of the approved avatar (moves today, 29,000 triangles; recommended), the New avatar (looks-only, about 509,000 triangles, needs a rebuild and a skeleton), or a plain marker until the look is locked?
5. Looks freeze: freeze avatar and kart looks until First Playable works (recommended), allow one time-limited look session per week, or keep going as now?
6. Speed versus foot sliding: lower the top speed, give him longer legs, accept a little foot sliding at high speed as classic games do, or keep feet pinned when slow and speed the animation up when fast (recommended middle ground)?
7. How movements get made: keep building every move with math, use short keyframe clips played by the existing pose player, or use licensed library clips fitted to the rigid skeleton? The assistants compare all three first.
8. First race: which track and how long? The Original circuit (3.7 km; about 6 minutes for 3 laps in the old prototype), a 1-lap race, a new short track, or bring over the banked oval? Also, what is the target race length in minutes?
9. First race opponents: time trial alone first (recommended), 3 computer karts, or 7?
10. Kart size source of truth: Claude's body-based sizes, Codex's physics sizes, or the locked size pictures in docs/KARTS.md section G? Also, does the approved Fast test kart ship in the game or stay a test kart?
11. Target player age: under 13, 13 and up, or all ages? This changes chat, accounts and purchases.
12. Online: officially 'Later' for all of Version 1 (recommended), or keep online rules in every card now?
13. Repo privacy: GitHub Pro plus private repos (about $4 a month, confirm the price; recommended), free hosting moved to Cloudflare Pages (more setup), or stay public?
14. Mario copy inside frozen checkpoint test-lab-1: replace it under a new recorded checkpoint decision, leave it frozen but unpublished, or rewrite git history (the biggest step)?
15. Working rules: two levels, meaning deep research and full tests for foundations but quick mockups for looks (recommended), or keep 'research every substep' for everything?
16. Who owns 'putting it all together' (the game shell) and kart-against-block collision: Claude, Codex, or split with one named lead?
17. Progress: coins only in Version 1 (recommended), or design a levels card now?
18. Real-world names (Suzuka, F1, GT3, the Porsche-inspired GT body): rename now while it is cheap (recommended), or at pre-sale?
19. Game name: keep 'LetsGo' as a working title only and pick the final name near launch (recommended), or decide now?

### Protect now
1. First, change the publish workflow so browser test results are kept for only 1 to 3 days, or saved only when a check fails. Each run currently saves about 40 MB for 90 days (about 2.9 GB in a day and a half). A private repo includes only 0.5 to 1 GB, and a refused upload would stop publishing.
2. Upgrade the GitHub account to Pro (confirm the price on GitHub's billing page; third-party sites say about $4 a month). Then make 3D-World-4 private, plus the older public repos 3D-WORLD-3 and Gemini-3D-WORLD. The test website stays reachable by link, and the design docs and code become hidden.
3. After going private, turn on GitHub's usage alerts at 90% and 100%, and set a low spending limit. Busy days use about 300 publish minutes, and Pro includes about 3,000 a month.
4. Check that cloud assistant sessions can still read 3D-WORLD-3 once it is private, because some tools look for it next to this repo.
5. Hide the owner's personal email. First switch the commit email (on the owner's machine and in any Codex setup that commits under the owner's name) to GitHub's noreply address. Then turn on 'Keep my email addresses private' and 'Block command line pushes that expose my email'.
6. Add a one-line 'Copyright 2026 [owner's name]. All rights reserved.' notice to the README, and a rule that no assistant ever adds an open-source license.
7. Take the Mario and SM64 reference pages (and the run and walk tests built on Mario's walk data) off the published site. Tell future sessions never to build movement on that data. NEXT.md currently points them to it.
8. Add a 'do not list in search engines' tag to the shared page code, so the public test site is less likely to be found by strangers.
9. Push the missing tags (the island checkpoint, avatar-joints-1, and the local safety tags from the 20 Nov reset) so nothing important lives on one machine only. Keep an occasional offline zip backup of the repo.
10. From now on share playable links only, never the repo or the design docs, and use a simple NDA before showing unreleased plans to anyone.
11. Add a short 'Protecting our own work' section to docs/game-dev/19-legal.md covering private repos, links not docs, NDAs, no open-source license, copyright registration at release, and a trademark for the final name.
12. Keep recording the owner's decisions in their own words with dates (already done), and make or adjust key designs by hand where possible. Purely AI-made code and art cannot be copyrighted, so the owner's own creative choices are the strongest evidence of authorship.

### Risks
1. Scope: the approved plan is studio-sized (15 features, 20 minigames, 3 kart classes, a connected world, 100 to 200 player online worlds) with no Version 1 list. This is the most common way games never finish.
2. The restart habit: walking was built about 7 times and removed, the avatar restarted several times, joint sockets were solved three times, and a working race prototype was replaced the same day. Without a written target, each attempt is judged only after it is built.
3. Walking may be rejected again. Settle speed versus leg length first, pick a reference video together, and approve a short preview before building.
4. The avatar split is getting worse. The newest commits removed the only movable avatar (the phone-ready Game copy) from the Test Lab, while the New avatar grew to about 509,000 to 517,000 triangles with no skeleton. That points to a second full rework later.
5. The slow, shared publish line: about 6 to 10 minutes per push (up about 30 times in a week), each push cancels the one running, and a single failing driving test blocks everyone's changes.
6. Going private without first fixing test-result storage could stop publishing in about a day. Publish minutes also start to cost money on busy days.
7. Legal: Nintendo's Mario model and animation data sit on the public site, inside a frozen checkpoint and in git history. The GT body copies the Porsche 911 GT3 R, a track is named Suzuka, 'F1' and 'GT3' are trademarks, and 'LetsGo' is a weak, common name.
8. Mismatched sizes: there are two sets of kart dimensions (F1 2.9 m versus 4.6 m), and the 6 m island does not fit the racing scale. Unifying them late means retuning all three kart classes.
9. Kart-against-block collision and the 'putting it together' work sit between the two assistants' areas with no owner, so they may never get scheduled.
10. Shared files (input, page template, camera follow) have no single owner, so a change by one assistant can break the other's pages.
11. Stale and contradictory docs (about 100,000 words of markdown, a 13,000-word handoff, nine contradictions between design files) can make an assistant build the wrong thing.
12. Weak checks in Claude's area: the movement-rules test always passes because it compares nothing, several old browser tests are already broken, and the most-changed pages are published without any check.
13. The feeling of progress from AI activity: a 2025 study found developers 19% slower with AI tools while believing they were 20% faster. Measure progress by what a player can do start to finish, not by commit count.
14. The owner's rule to research every substep and treat every line as permanent slows the quick, throwaway tests that found the fun in every solo hit studied.
15. Time: every solo hit checked took several times longer than planned (Stardew about 4 years, Animal Well 7). Plan in layers and pace the work to avoid burnout.
16. Phone performance: the Skeleton page's first visit still loads the 20 MB Detailed avatar (about 22 seconds on a simulated phone), and the New avatar page builds every tab's bodies at once (about 18 seconds and 112 MB in an earlier measurement).

## Completeness critic of the first draft

### Gaps

1. **The storage warning behind the plan's first protection step is wrong. Saved test results are tiny. The 3 GB actually comes from GitHub's own copy of the whole website, which it keeps for one day after each publish.**
   - Why it matters: The plan's first protection step (make test results expire sooner before going private) would save almost nothing. If storage turns out to matter on a private repo, the real fix is a smaller published site, so the 'publish less' cleanup moves up in priority.
   - Checked now: gh api repos/isaiasurrutia96/3D-World-4/actions/artifacts: 75 artifacts, 3,028,133,430 bytes in total. 52 are 'lab-foundation-checks' (the test results) at about 889 to 1,173 bytes each, 0.1 MB together, kept 90 days. 23 are 'github-pages' at 130 to 137 MB each (for example 137,118,089 B, created 2026-11-23T18:29:24Z, expires 2026-11-24T18:29:19Z), which is 3,028 MB. These are made by GitHub's Pages deployment, not by the upload step in deploy.yml. GitHub's billing doc source (content/billing/concepts/product-billing/github-actions.md) bills artifact storage in GB-hours. I could NOT confirm whether 'github-pages' deployment artifacts count toward that bill. Each one is the size of the whole published site (about 135 MB), so cutting the 35.8 MB duplicate master file, the 18 MB of reference media and the retired pages would shrink it directly. Also confirmed: deploy.yml uploads with if: always() and no retention-days, and the peaceiris publish step runs after it.

2. **Almost all of the publish wait comes from ONE driving browser test. The plan's speed-up phase does not deal with it, and it adds new checks instead.**
   - Why it matters: This is the single biggest time-saver for the owner, and the easiest trick available. Run the racing browser checks only when racing or shared files change, and run everything nightly or before milestones. An avatar push would then skip about 3 to 5 minutes, and the flaky driving test would stop blocking avatar work.
   - Checked now: Job log of run 45217820916 (552 s total): the browser checks took 308 s. Each suite's time comes from the 'Checking:' timestamps: Driving controls/FPV 192 s, Track inspection 46 s, Steering release 17 s, Shared marker input 13 s, GT3 12 s, WebKit app return 7 s, Neighborhood 6 s, Test Lab links 4 s, bridge camera 4 s, app URLs 3 s, Chromium app return 3 s. The racing-only suites add up to about 290 of the 308 s. Across 14 recent successful runs: browser checks 214 to 346 s, build 66 to 131 s, test:racing-core 53 to 99 s, browser install 32 to 68 s. The latest run (45235177129) took 1,238 s because 'Install pinned test browsers' took 720 s. Caching the Playwright browsers would prevent that kind of outlier. In the CI build, the wrist (27 s), elbow (35 s), new-avatar (23 s) and foot (10 s) steps take most of its 102 s. 32 of the 105 non-merge commits since 21 Nov changed only docs/ or .md files, and no build script reads docs/, so skipping the publish for those pushes is safe.

3. **The plan is built on a checkout that is 5 commits behind, and those commits change the avatar picture. Some plan statements are therefore wrong, and the owner started a new avatar process today that the plan does not mention.**
   - Why it matters: The plan says the only movable avatar was removed from the Test Lab, but it is still there in the Skeleton section. The plan also treats 'freeze the looks' as a done step, while the owner opened a piece-by-piece avatar polish review today. If that proposal does not acknowledge the owner's own process, it will clash with what he is actively doing.
   - Checked now: gh api compare cb77276...8afe021: ahead_by 5, behind_by 0. The 5 commits are 0723559, 271405b, 4ba8cd0, 59402a2 and 8afe021, all by Claude, 16:10 to 18:08 UTC on 23 Nov. In remote public/test-lab/main.js, the menu no longer has 'Our avatar' and the default subject is 'newAvatar'. But 'skeleton:{name:'Skeleton',path:'skeleton-test'...}' is still listed, and Skeleton is the same official-avatar bundle with the Game copy (scripts/build-official-avatar-page.mjs line 34). The new docs/AVATAR-POLISH-LIST.md says: 'Nothing on this list is fixed until the owner has gone through it and says to fix it'. It also says 'Joint balls stay 300 triangles (confirmed decision)' and 'The rebuild makes every piece lean (the prototype is about 517,000 triangles)'. So a lean rebuild is already planned on purpose, not an accidental future rework. The Test Lab now opens on its heaviest page (New avatar), which the pre-publish browser checks do not open.

4. **Several plan items conflict with the owner's main rules file and the ownership file, and nobody compared the plan against them.**
   - Why it matters: If the plan breaks the owner's own written rules, he has to correct it, which costs his time and trust. It also hands him too many decisions at once, for someone who often reads while driving.
   - Checked now: docs/HOW-TO-WORK-WITH-ME.md lines 15-17: 'You research, compare, and decide questions of expertise. I decide questions of purpose and taste'. The plan has 19 owner decisions, and many are expertise questions: how movements get made, who owns the game shell and collision, Pro or Cloudflare hosting, which kart-size file is the source. Line 63-65 (C6): one instruction at a time. Lines 99-106 (G): every line permanent, with tests, which clashes with the plan's placeholder walk and preview video until the owner approves the 'two levels' idea. Lines 79-82 (D2): never reshape an approved part, which affects the lean rebuild, kart-size unification and the 'longer legs' option. CLAUDE.md rule 16: 'Every future page shares motion-lab/src/page.js and src/input.js'. The plan's new TypeScript game shell contradicts this unless it builds on page.js, which racing-lab/src/main.js already imports. docs/COLLABORATION.md lines 30-36 recommend Codex as lead for 'New minigame rules and gameplay systems', the 'Shared Test Lab framework, navigation, input plumbing' and 'Build, release integration'. The plan instead gives the shell and controls to Claude and says nobody owns integration. HANDOFF.md line 78 (item 64): the owner chose 'Visual prototype only (pictures first, light checks)' for the New avatar, which conflicts with adding test:new-avatar (547 checks) to the publish gate. COLLABORATION.md lines 45-48 still call the 20,000 to 30,000 triangle target 'a proposal, not an accepted limit', which contradicts docs/game-dev/11-rendering-web.md line 5 ('owner-approved, 21 November'). That stale contradiction is not among the nine the plan lists.

5. **Protecting the owner's work from loss or accidental damage on GitHub was never checked. Nothing stops a force-push or a deleted branch or tag on main, and the plan's 'push the missing tags' step cannot work as written.**
   - Why it matters: Two AIs push straight to main. One bad force-push could wipe history, including the frozen checkpoints and tags. A free protection setting would prevent that. The tag step needs the right method, or it will fail again.
   - Checked now: gh api .../branches/main/protection returns 'Branch not protected' (404), and .../rulesets returns 0. Local tags are exactly the 8 remote tags (git tag -l compared with git ls-remote). No island-checkpoint-1 or avatar-joints-1 tag exists anywhere, so they would have to be created, not pushed. HANDOFF.md line 111: the 20 Nov safety tags 'exist only on the machine used and could not be pushed (error 403)', and they are not in this checkout. Commit 747d0ba is reachable from main (git merge-base --is-ancestor), so that work is already safe on GitHub. GitHub docs source (data/reusables/gated-features/protected-branches.md): protected branches work on public repos on Free, and on public and private repos on Pro. So if the repo goes private, branch protection also needs Pro. Suggestion: block force-pushes and deletions on main and on tags, and create the missing tags from the owner's machine or GitHub's Releases page (or just record their commit hashes in checkpoints/README.md).

6. **The owner's real test phone is not written down anywhere, but it appears to be an iPhone. Nearly every automatic check uses Chrome's engine, and no avatar page is ever checked in Safari's engine.**
   - Why it matters: On an iPhone every browser uses Safari's engine, which has tighter memory limits. That fits the owner's 23 Nov report 'It's not loading in the test lab' on the heavy New avatar page. Checks that pass in Chrome do not prove the owner's phone will work.
   - Checked now: racing-core/PLAN.md line 207 gives the owner iPhone steps ('open the verified driving link in Safari, Share → Add to Home Screen'). No doc names the phone model. In scripts/check-lab-foundations-browser.mjs, line 29 defaults each suite to 'chromium', and only suite 11 ('WebKit app return and pause', a racing check) uses webkit. scripts/test-browser.mjs line 7 is the only WebKit launch path.

7. **Making the older 3D-WORLD-3 repo private was flagged as a risk to tools, but nobody checked whether it would break publishing.**
   - Why it matters: It reassures the owner: going private will not break the automatic publish. Only manual comparison tools and one old preview link are affected.
   - Checked now: deploy.yml checks out only this repo. racing-core/tools/capture-kart-reference.mjs line 11 and capture-track-reference.mjs line 11 need a local path argument and are run by hand. motion-core/tests/compare.mjs line 12 looks for ../../../3D-WORLD-3 and already skips when it is missing. No runtime page loads anything from the 3D-WORLD-3 site: grep for github.io in source found only fflate license URLs, a test URL and avatar/APPROVED.json line 7, a preview_url on 3D-WORLD-3's Pages site that would go offline if that repo became private on the Free plan.

8. **Licenses of the outside code shipped in the game were never checked, and that matters for selling later. They are clean.**
   - Why it matters: It is good news for the later business and legal phase. All bundled libraries allow commercial use, and their notices are kept in the built pages.
   - Checked now: node_modules package.json files: three 0.180.0 MIT, cdt2d 1.0.0 MIT, meshoptimizer 0.22.0 MIT, fflate 0.8.3 MIT. The built racing-lab, skeleton-test and motion-lab index.html each contain the three.js 'Three.js Authors' license line, and the fflate notice appears in wrist-lab, avatar-test, skeleton-test, elbow-lab and avatar/assembled-joints/decode-*.js. avatar/src/reference/PlayerModel.ts and reference/island-v1 are the project's own code (commit 97eb471, Claude), not third-party code.

9. **The game has no sound at all yet, and no inspector mentioned it. Sound is a big part of how a race or a sport feels.**
   - Why it matters: It is small for a first playable, but the owner judges feel by playing. A silent race may feel unfinished and lead to extra tuning rounds.
   - Checked now: git ls-files has 0 .mp3, .ogg, .wav, .m4a or .aac files. The only sound code is racing-lab/src/f1-engine-audio.js, a synthesized F1 engine. The plan does not mention sound until Phase 4.

10. **The cost of AI usage per session was never measured, even though CLAUDE.md B3 says not wasting the owner's usage is the top priority.**
   - Why it matters: Claims like 'saves usage' (handoff split, fewer publish rounds) cannot be weighed against each other without even a rough measure.

11. **The security of the GitHub account itself (two-factor login, who has write access) was not checked. The API path for collaborators was blocked by the proxy.**
   - Why it matters: The account is the single point of failure for the code, the history, the test website and any private repos. Losing it would cost more than any copying risk.
   - Checked now: gh api .../collaborators returned 'Access to this GitHub API path is not permitted through this proxy' (403). Not verified.

12. **Nobody inspected what the third public repo (Gemini-3D-WORLD) contains, or how much time the owner has each week. The plan's phase sizes assume 'current pace'.**
   - Why it matters: The privacy step covers all three repos, and the timeline depends on the owner's real hours.

### Plan problems
1. protect_now item 1, do_first step (a) and the 'Going private without first fixing test-result storage could stop publishing in about a day' risk all rest on a wrong figure. Test-result artifacts are about 1 KB each (0.1 MB for 52). The 3 GB is GitHub Pages' own site artifacts (about 135 MB each, kept 1 day). Drop step (a) as a prerequisite. If storage billing applies, shrink the published site instead.
2. Phase 1 leaves out the biggest wait-cutter and adds checks (Claude tests plus new-avatar), which makes publishing slower overall. One suite ('Driving controls, FPV') is about 192 of 308 s, and racing suites are about 290 of 308 s. Add: run racing browser suites only when racing or shared files change (racing-core, racing-lab, motion-lab/src, public/test-lab, src/test-lab-scene.ts), run the full set nightly or before milestones, and cache the Playwright browsers (one install took 720 s).
3. Phase 1 adds test:new-avatar (547 checks) to the publish gate, against the owner's 22 Nov decision 'Visual prototype only (pictures first, light checks)' (HANDOFF item 64, line 78). Every visual tweak could then block publishing. Use one 'New avatar page loads' smoke check instead. New avatar is now the Test Lab's default page and is not opened by any pre-publish check.
4. Phase 2 has Claude build a new TypeScript 'game shell'. That contradicts CLAUDE.md rule 16 ('Every future page shares motion-lab/src/page.js and src/input.js'). It also ignores COLLABORATION.md lines 30-36, which recommend Codex as lead for gameplay systems, the shared framework, input plumbing and build/release integration. So the claim that nobody owns 'putting it together' is also inaccurate. Recommend growing the existing page.js shell (racing-lab already uses it) and asking the owner to confirm the lead, or retiring rule 16 on purpose.
5. 19 owner decisions breaks HOW-TO-WORK-WITH-ME rule A (assistants decide expertise questions, the owner decides purpose and taste) and rule C6 (one instruction at a time), and it is far too much for one person. Keep about 5 or 6 taste and money decisions (pitch, first-playable content, feel pillar, avatar look and its freeze, race length, paying for Pro). Decide the rest with a recommendation and record it.
6. Phase 0 lists 'a written freeze on avatar and kart looks' as something to build. But on 23 Nov the owner started a piece-by-piece avatar polish review (docs/AVATAR-POLISH-LIST.md on remote main: 'Nothing on this list is fixed until the owner has gone through it'). Present the freeze as a proposal that respects that list.
7. The risk 'The newest commits removed the only movable avatar (the phone-ready Game copy) from the Test Lab' is overstated. Skeleton is still in the menu at 8afe021 and uses the same official avatar with the Game copy. The '509,000 to 517,000 triangles points to a second full rework' risk is also overstated: the polish list says a lean rebuild is the intended next step.
8. The Phase 2 placeholder walk and quick preview depend on the owner accepting the 'two levels' working rule, because HOW-TO rule G says every line is permanent and tested. Make that decision a precondition of Phase 2, not item 15 of 19.
9. protect_now says 'Push the missing tags (the island checkpoint, avatar-joints-1, and the local safety tags)'. Those tags exist nowhere reachable (local tags equal the 8 remote ones), cloud tag pushes failed with 403 (HANDOFF line 111), and commit 747d0ba is already on main. Replace with: create tags from the owner's machine or the GitHub Releases page, or record commit hashes in checkpoints/README.md. Also add a free branch and tag protection rule (block force-push and deletion), which nobody proposed.
10. protect_now has 12 items, but the owner said game first, business and legal later, while still protecting the idea. Trim 'now' to: GitHub Pro then private repos, Mario pages off the site, branch protection, and email privacy. Move the NDA, the 19-legal.md section, the copyright line and the noindex tag to later.
11. Phase 1 freezes the Wrist, Elbow and Feet builds. Those builds also run tests (wrist-lab/build.mjs runs wrist-lab/tests/study.test.mjs and tests/study-asset.test.mjs; foot and elbow do the same), so freezing silently removes about 35 tests from the publish checks. Keep them in the full-check command.
12. The Phase 2 exit test is 'on the owner's own phone', which appears to be an iPhone (racing-core/PLAN.md:207). But 10 of 11 pre-publish suites run in Chrome's engine and no avatar page is checked in Safari's engine. Add a WebKit smoke run of the game page, and record the target phone in CURRENT-STATE.
13. The nine-contradiction cleanup misses a tenth: COLLABORATION.md lines 45-48 still call the about 29,000 triangle budget a proposal, while docs/game-dev/11-rendering-web.md line 5 records it as owner-approved on 21 Nov.
