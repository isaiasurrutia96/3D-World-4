# Appendix A2: How to organize chats, research and comparison
Raw research data, generated on 24 November 2026 from the multi-agent runs. Every finding here passed an independent skeptic unless marked otherwise. Paths marked "(scratch folder, not saved)" were temporary test files that no longer exist. Plain-English summaries and decisions live in the numbered files one folder up; this appendix is for checking details.

## Research: official
**Summary:** Official Anthropic guidance, read from the current Claude Code docs (code.claude.com, fetched 23 Nov 2026), the Help Center and two Anthropic engineering posts, supports using several sessions with clear names. It does not support keeping a few chats open for weeks.

How cloud sessions work:
- Every cloud session is its own isolated VM. It starts from a fresh clone of the repo and works on its own branch.
- A session keeps running after the phone or laptop is closed. After a few minutes idle the VM pauses with its files saved, and it can later be reclaimed. Reopening a reclaimed session brings back the conversation but not unpushed background work.
- Sessions share no memory. Each one begins with an empty context window. What carries over is the repo's CLAUDE.md (part of the clone) and anything else committed to the repo. Claude's auto memory stays on one machine and is not shared across cloud environments.
- Renaming a session (with /rename and a name in cloud sessions, or by clicking the title in the app) only changes the label you see. It does not give the session any context.

Long chats and cost:
- Running out of context is now rare: most current models have a 1M-token window and compaction is automatic. Cloud sessions compact earlier than the full window; this session showed CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=92.
- Compaction keeps the project-root CLAUDE.md, but instructions given only in chat get summarized and can be lost.
- The real problem with long chats is cost and focus. Every message re-sends the whole conversation, at a discount while the cache is warm. On subscriptions that cache lasts about an hour, so the first message after a longer break re-processes everything. /compact is itself a large request, while /clear costs nothing.
- Usage limits (a 5-hour window plus weekly limits) are shared across claude.ai, Claude Code and Desktop. Parallel sessions use them proportionately faster.

Anthropic's own advice:
- Run /clear or start a fresh session between unrelated tasks.
- After two failed corrections, start over with a better prompt instead of a third correction.
- Name sessions so you can find them later.
- Write specs, plans and decisions to repo files, then start a fresh session to build from them.
- Use a second session as an independent reviewer.
- Give each parallel piece of work its own checkout; cloud sessions already do this.
- Keep CLAUDE.md short (under 200 lines) and limited to what Claude can't work out from the repo. Put procedures in skills.
- The engineering posts back this up: write progress files plus git history so each fresh session can get up to speed, and work on one feature at a time.

Projects, a new option:
- "Projects" in claude.ai/code is in public beta on Pro, Max and Ultra and still rolling out. It is one coordinator chat that starts parallel cloud "threads". They share project memory and project instructions (up to 16,000 characters), and an Overview pane shows which threads are done or need you.
- It suits work that runs for days or weeks, but it uses the plan faster. It needs the Claude GitHub App installed on the repo. Anthropic says a single task that fits in one session should just be a normal cloud session.

For this owner, the evidence points to a hybrid:
- A small number of clearly named sessions, one per area or chunk (for example "LetsGo – Avatar: shoulders"), started fresh for each chunk rather than one endless chat per area.
- The repo as the single source of truth: HOW-TO-WORK-WITH-ME.md, CLAUDE.md, HANDOFF.md and the decision record, committed and pushed.
- Projects worth trying if it shows up on the account.

Repo check:
- CLAUDE.md is 89 lines and HANDOFF.md is 185 lines.
- Several claude/* branches already exist on origin, which shows the owner already runs multiple sessions.

### Facts

1. **Each cloud session runs in its own fresh, isolated VM (Ubuntu 24.04) with the repository cloned; anything not committed to the repo is not available.**
   - Evidence: https://code.claude.com/docs/en/cloud-environments.md, 'What's available in cloud sessions': 'each session gets a fresh virtual machine (VM)... with your repository cloned' and 'Cloud sessions start from a fresh clone of your repository. Anything you commit to the repo is available.'
   - Confidence: confirmed

2. **Each cloud task gets its own session and its own branch. Claude pushes the branch at a stopping point, and the session stays open afterwards for a PR or more messages.**
   - Evidence: https://code.claude.com/docs/en/web-quickstart.md: 'Each task gets its own session and its own branch, so you don't need to wait for one to finish before starting another.' and 'The session doesn't close when the branch is pushed.'
   - Confidence: confirmed

3. **Cloud sessions keep running after you close the laptop or tab, and can be watched and steered from the Claude mobile app's Code tab.**
   - Evidence: https://code.claude.com/docs/en/claude-code-on-the-web.md: 'The session keeps running after you close your laptop, and you can check on it or steer it from any device.' Also https://code.claude.com/docs/en/mobile.md
   - Confidence: confirmed

4. **Lifetime: after a few minutes idle the VM pauses with its files saved, and a paused VM can later be reclaimed. Reopening a reclaimed session restores the conversation history, but not background work (shell commands, subagents, session-scoped scheduled tasks).**
   - Evidence: https://code.claude.com/docs/en/cloud-environments.md 'Time limits' (Idle sessions); https://code.claude.com/docs/en/claude-code-on-the-web.md 'Environment expired': 'Restored: your conversation history. Not restored: background work...'
   - Confidence: confirmed

5. **Sessions do not share memory or context. Each session begins with a fresh context window; only CLAUDE.md files and auto memory carry knowledge across sessions.**
   - Evidence: https://code.claude.com/docs/en/memory.md: 'Each Claude Code session begins with a fresh context window. CLAUDE.md files and auto memory carry knowledge across sessions'
   - Confidence: confirmed

6. **Auto memory stays on one machine and is NOT shared across machines or cloud environments. For cloud sessions, the reliable shared memory is whatever is committed to the repo (CLAUDE.md, docs).**
   - Evidence: https://code.claude.com/docs/en/memory.md 'Storage location': 'Auto memory is machine-local... Files are not shared across machines or cloud environments.'
   - Confidence: confirmed

7. **In cloud sessions the repo's CLAUDE.md, .claude/rules, skills, agents and commands load because they are part of the clone. The user's own ~/.claude/CLAUDE.md does not load (it can be written by a setup script instead).**
   - Evidence: https://code.claude.com/docs/en/cloud-environments.md 'What carries over from your setup' table: 'Your repo's CLAUDE.md | Yes | Part of the clone'; 'Your user ~/.claude/CLAUDE.md | No'
   - Confidence: confirmed

8. **CLAUDE.md is loaded into every session, so every line costs attention on every task. Anthropic says to keep it short (target under 200 lines) and include only what Claude cannot find in the repo, decisions not in the repo, and anything corrected twice.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md 'Keep CLAUDE.md short'; https://code.claude.com/docs/en/memory.md 'Write effective instructions': 'target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence.'
   - Confidence: confirmed

9. **Adding IMPORTANT, ALL CAPS or other emphasis to instructions is outdated advice and can make Claude over-apply a rule. A rule with no exceptions belongs in a hook or deny rule; a line getting lost means the file needs to be shorter.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md 'What you can stop doing' table, and the note 'If Claude keeps ignoring a line that is in CLAUDE.md, adding IMPORTANT probably won't fix it.'
   - Confidence: confirmed

10. **Procedures and specialised knowledge belong in skills (.claude/skills/<name>/SKILL.md). These load only when needed, so they are lighter on context than CLAUDE.md.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md 'Put team procedures in skills'; https://code.claude.com/docs/en/costs.md 'Move instructions from CLAUDE.md to skills'
   - Confidence: confirmed

11. **Context window: most current models have a 1M-token window with automatic compaction, so running out of context is rare. Anthropic still recommends /clear between tasks because focused context gives better answers and costs less.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md 'Keep cost and context down' and 'What you can stop doing': 'Most current models have a 1M-token window and compaction happens on its own... /clear between tasks is still worth doing'
   - Confidence: confirmed

12. **Cloud sessions set CLAUDE_AUTOCOMPACT_PCT_OVERRIDE themselves, so compaction starts partway through the window. In this cloud session the value was 92.**
   - Evidence: https://code.claude.com/docs/en/claude-code-on-the-web.md 'Manage context'; observed by running env in this session: CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=92
   - Confidence: confirmed

13. **What survives compaction: the project-root CLAUDE.md and auto memory are re-read from disk, but conversation history (including instructions given only in chat) is summarized. If an instruction vanished after compaction, it was only in conversation; add it to CLAUDE.md to make it persist.**
   - Evidence: https://code.claude.com/docs/en/context-window.md 'What survives compaction'; https://code.claude.com/docs/en/memory.md 'Instructions seem lost after /compact'
   - Confidence: confirmed

14. **Long chats cost more per message. Every request sends the whole conversation, re-read at the cached rate while the cache is warm, so a one-line question in an all-day session still uses usage for the whole conversation. A session holding three unrelated tasks re-reads all three on every turn of the fourth.**
   - Evidence: https://code.claude.com/docs/en/costs.md 'Why usage climbs in a long session'; https://code.claude.com/docs/en/best-practices.md 'Keep cost and context down'
   - Confidence: confirmed

15. **On a subscription the main conversation's prompt cache lasts about one hour (5 minutes for subagents). The first message after a longer break misses the cache and re-processes the full context. A session past about 200K tokens that sits idle is compacted shortly before the cache expires.**
   - Evidence: https://code.claude.com/docs/en/prompt-caching.md 'Which TTL each request gets'; https://code.claude.com/docs/en/best-practices.md note under 'Keep cost and context down'
   - Confidence: confirmed

16. **/clear costs nothing. /compact is itself a large request (it reads the whole conversation), and larger still after the cache has expired.**
   - Evidence: https://code.claude.com/docs/en/costs.md 'Why usage climbs...': 'When you want a fresh start instead of continuity, /clear costs nothing'; https://code.claude.com/docs/en/prompt-caching.md 'Compacting the conversation'
   - Confidence: confirmed

17. **/clear, /compact and /context work in cloud sessions; /clear starts a fresh conversation with empty context in the same cloud session. /resume and /plugin do not work in cloud sessions or the mobile app.**
   - Evidence: https://code.claude.com/docs/en/claude-code-on-the-web.md 'Manage context' table; https://code.claude.com/docs/en/mobile.md 'Limitations'
   - Confidence: confirmed

18. **Usage limits: paid plans have a session limit that resets every five hours plus weekly limits. Usage on claude.ai, Claude Code and Claude Desktop counts toward the same limit. The Help Center suggests starting a new conversation when nearing the limit in a long chat.**
   - Evidence: https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work ('Updated over 2 weeks ago')
   - Confidence: confirmed

19. **Cloud sessions share rate limits with all other Claude usage on the account, and running several tasks in parallel uses limits proportionately faster.**
   - Evidence: https://code.claude.com/docs/en/claude-code-on-the-web.md 'Limitations': 'Running multiple tasks in parallel consumes more rate limits proportionately.'; https://code.claude.com/docs/en/agents.md note: 'Running several sessions or subagents at once multiplies token usage.'
   - Confidence: confirmed

20. **Anthropic's steering advice: after two failed corrections, run /clear and write one better prompt instead of a third correction, because the conversation already holds two failed attempts that Claude keeps re-reading.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md 'Steer the session' tip and the /clear bullet
   - Confidence: confirmed

21. **Anthropic recommends writing a spec (for example, have Claude interview you and write SPEC.md), then starting a fresh session to build from it so the build begins with clean context and a written definition of done.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md 'Brainstorm with Claude first': 'Once SPEC.md exists, start a fresh session to build from it'
   - Confidence: confirmed

22. **Anthropic recommends naming sessions so they can be found later, especially when running several in parallel. In cloud sessions /rename takes the name as an argument (/rename name); in the desktop app you click the session title; unnamed sessions get a title generated from the first prompt.**
   - Evidence: https://code.claude.com/docs/en/sessions.md 'Name your sessions'; https://code.claude.com/docs/en/claude-code-on-the-web.md 'Manage context' (/rename with argument); https://code.claude.com/docs/en/desktop.md 'Organize and find sessions'
   - Confidence: confirmed

23. **Parallel sessions: give each separate piece of work its own checkout so edits can't collide. Cloud sessions provide this automatically (one clone and branch each) and do not need git worktrees.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md 'Run sessions in parallel'; https://code.claude.com/docs/en/claude-projects.md 'How projects relate...': 'Cloud threads don't need them: each clones its repositories into its own cloud sandbox and works on its own branch.'; https://code.claude.com/docs/en/web-quickstart.md 'without managing multiple worktrees'
   - Confidence: confirmed

24. **A second session is the easiest independent reviewer: one session writes the code, another reviews it without having watched it being written.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md end of 'Run sessions in parallel'
   - Confidence: confirmed

25. **Anthropic Help Center 'Claude Code power user tips' calls running 3–5 sessions in parallel, each in its own git worktree, 'the biggest productivity unlock' (aimed at local terminal users). It also mentions one engineer keeping a notes directory per task, updated after every PR, with CLAUDE.md pointing at it.**
   - Evidence: https://support.claude.com/en/articles/14554000-claude-code-power-user- ('Updated over 3 weeks ago')
   - Confidence: confirmed

26. **Subagents keep noisy output (searches, logs, test runs) out of the main chat and allow independent review, but each costs extra tokens and does not give a smarter answer.**
   - Evidence: https://code.claude.com/docs/en/best-practices.md 'Know what subagents cost'; https://code.claude.com/docs/en/agents.md table
   - Confidence: confirmed

27. **Anthropic lists five ways to run parallel work: subagents, agent view (local, research preview), agent teams (experimental, off by default), dynamic workflows, and Projects. Projects fit work spanning many tasks over days or weeks that should keep running while your machine is off.**
   - Evidence: https://code.claude.com/docs/en/agents.md 'Run agents in parallel' table
   - Confidence: confirmed

28. **Projects (claude.ai/code, desktop and mobile app): public beta on Pro, Max and Ultra, rolling out gradually, not on Team or Enterprise. A project is one coordinating conversation; Claude starts a thread (usually a cloud session with its own branch and PR) per task. Threads share project instructions (up to 16,000 characters) and project memory, and an Overview pane shows what is finished or waiting on you.**
   - Evidence: https://code.claude.com/docs/en/claude-projects.md (intro note, 'How a project is organized', 'Give a project standing context')
   - Confidence: confirmed

29. **Projects: you don't manage context windows; threads compact automatically and the coordinator works from recent messages, recent threads and project memory. Project memory is separate from repo CLAUDE.md: repo rules go in CLAUDE.md and project notes in project memory.**
   - Evidence: https://code.claude.com/docs/en/claude-projects.md 'Choose models and let Claude manage context' and 'Give a project standing context'
   - Confidence: confirmed

30. **Projects use the plan faster than a single session (each running thread is a full session, plus the coordinator); Pro users should expect to hit limits sooner. Hard limit: 500 new threads per day. An idle project uses nothing. Threads are auto-resolved after a week without activity.**
   - Evidence: https://code.claude.com/docs/en/claude-projects.md 'Usage and cost' and 'See what needs you in Overview'
   - Confidence: confirmed

31. **Anthropic says when a project is not the right fit: 'One task that fits in a session: Fix the flaky login test. Start a cloud session yourself.'**
   - Evidence: https://code.claude.com/docs/en/claude-projects.md 'When something else fits better'
   - Confidence: confirmed

32. **Project prerequisites and limits: the Claude GitHub App must be installed on the repo (a /web-setup token is not enough). Threads do not apply the repo's .claude/settings.json hooks, permission rules or env. A project belongs to one user; threads can't be moved between projects. An existing cloud session can be moved in with 'Continue in project'.**
   - Evidence: https://code.claude.com/docs/en/claude-projects.md 'Check the prerequisites', 'What threads pick up from your repositories', 'Limitations', 'Start from an existing session'
   - Confidence: confirmed

33. **A project thread's sandbox pauses between turns. If it can't be resumed, the thread continues from a fresh clone and uncommitted changes can be lost. Anthropic advises asking Claude to commit and push work in progress on long tasks.**
   - Evidence: https://code.claude.com/docs/en/claude-projects.md 'Limitations'
   - Confidence: confirmed

34. **For new work, a fresh thread or session can use less than reviving a large old one, because a thread idle for over an hour re-reads its whole conversation before doing anything.**
   - Evidence: https://code.claude.com/docs/en/claude-projects.md 'See and reduce a project's usage'
   - Confidence: confirmed

35. **Cross-session messaging lets one session send plain-text messages to the owner's other sessions, but never conversation history or files. A cloud session cannot reply with SendMessage to a message from another machine. Each delivered message counts toward usage.**
   - Evidence: https://code.claude.com/docs/en/cross-session-messaging.md intro and 'Replies from other machines and cloud sessions'
   - Confidence: confirmed

36. **Anthropic engineering ('Effective harnesses for long-running agents', Justin Young, 26 Nov 2025): each new session begins with no memory, so agents keep a progress file (claude-progress.txt) plus git history, work on one feature at a time, and a fresh session reads the git log and progress files to get up to speed.**
   - Evidence: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
   - Confidence: confirmed

37. **Anthropic engineering ('Effective context engineering for AI agents', 29 Sep 2025): recall degrades as context grows ('context rot'), so context is a finite resource. Recommended techniques are compaction, structured note-taking outside the context window (for example a NOTES.md or to-do list), and sub-agents with clean context.**
   - Evidence: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
   - Confidence: confirmed

38. **The older Anthropic engineering post 'Claude Code best practices' now permanently redirects (308) to the docs page, so the docs page is the current source.**
   - Evidence: WebFetch of https://www.anthropic.com/engineering/claude-code-best-practices returned '308 Permanent Redirect' to https://code.claude.com/docs/en/best-practices
   - Confidence: confirmed

39. **When teleporting a compacted cloud session to the terminal, earlier summarized messages are not copied; the original messages are still visible by scrolling up on claude.ai or in the mobile app.**
   - Evidence: https://code.claude.com/docs/en/claude-code-on-the-web.md 'Continue a cloud session in your terminal' note
   - Confidence: confirmed

40. **Sessions can be archived to remove them from the sidebar (Archived tab at claude.ai/code/sessions). An archived cloud session cannot accept new messages until unarchived. The desktop auto-archive-after-PR-merge setting does not apply to cloud sessions.**
   - Evidence: https://code.claude.com/docs/en/claude-code-on-the-web.md 'Archive sessions' and error table ('is archived and cannot accept new messages'); https://code.claude.com/docs/en/desktop.md 'Archive a session'
   - Confidence: confirmed

41. **Cloud session resource and time limits: about 4 vCPUs, 16 GB RAM and 30 GB disk. Foreground commands default to 2 minutes (up to 10), and a setup script is cached only if it finishes in about 5 minutes. Per the platform's resource guidance, when a session's allowance is spent you commit and push, and the next session starts on a fresh machine.**
   - Evidence: https://code.claude.com/docs/en/cloud-environments.md 'Resource limits' and 'Time limits'; claude-code-remote read_documentation topic session.resources
   - Confidence: confirmed

42. **Repo state: CLAUDE.md is 89 lines (under Anthropic's 200-line target), AGENTS.md 15, docs/HOW-TO-WORK-WITH-ME.md 106, docs/HANDOFF.md 185 (read on request, not auto-loaded), docs/COLLABORATION.md 64. There is no .claude/ directory (no skills or rules yet). Origin has several claude/* branches (brave-hamilton-l04w49, lucid-pascal-xqtrwb, nice-cannon-50ao74, relaxed-wozniak-iznto4), so the owner already runs multiple sessions.**
   - Evidence: wc -l and ls -a in /home/user/3D-World-4; git branch -a output
   - Confidence: confirmed

43. **Because CLAUDE.md exists, Claude Code reads CLAUDE.md and not AGENTS.md by default. The repo's CLAUDE.md already points to docs/HOW-TO-WORK-WITH-ME.md, so Claude and Codex share one guide by reference.**
   - Evidence: https://code.claude.com/docs/en/memory.md 'AGENTS.md' table ('An AGENTS.md and a CLAUDE.md... Your CLAUDE.md files only'); /home/user/3D-World-4/CLAUDE.md first paragraph
   - Confidence: confirmed

44. **A CLAUDE.local.md (personal, gitignored) would not reach cloud sessions, because cloud sessions only get what is committed to the repo.**
   - Evidence: Inference from https://code.claude.com/docs/en/best-practices.md (CLAUDE.local.md goes in .gitignore) combined with https://code.claude.com/docs/en/cloud-environments.md ('Anything you commit to the repo is available')
   - Confidence: likely

45. **Whether the Projects beta is visible on this owner's account is unknown; the docs say to look for 'Projects' in the claude.ai/code sidebar or under 'More', otherwise the rollout hasn't reached the account.**
   - Evidence: https://code.claude.com/docs/en/claude-projects.md intro note; not checked for this account
   - Confidence: unconfirmed

46. **Two cloud sessions changing the same files on separate branches can still conflict when both are merged into main; separate clones prevent edit collisions during work, not at merge time.**
   - Evidence: Inference from https://code.claude.com/docs/en/agents.md ('Do the tasks touch the same files? Isolate the work...') and the per-session branch model in https://code.claude.com/docs/en/web-quickstart.md; no Anthropic page states the merge-conflict case for cloud sessions directly
   - Confidence: likely

### Options seen
1. A. One long chat for everything. Anthropic advises against it: unrelated tasks pile up, every message re-sends the whole history, compaction drops chat-only instructions, and focus gets worse.
2. B. One long-lived chat per area (for example 'LetsGo – Avatar', 'LetsGo – Racing'), renamed and reused for weeks. Easy to find, but it builds the same long-context cost and drift inside each area; it only works if /clear is used between tasks and decisions are recorded in the repo.
3. C. One fresh cloud session per task or chunk, named after the chunk (for example 'Avatar – shoulder balls'), archived when merged, with handoff through repo files (HANDOFF.md, decision records, specs). This is the closest match to Anthropic docs, the Help Center ('start a new conversation') and the engineering posts (progress file plus git).
4. D. Hybrid: a few named sessions open at once, one per active area or chunk. Inside each, use /clear (cloud: /clear starts a fresh conversation in the same session) or start a new session when the task changes, or after two failed corrections.
5. E. Claude Code Projects (public beta: Pro, Max, Ultra): one coordinator chat for the whole LetsGo stream, which starts parallel cloud threads per task with shared project instructions and memory and an Overview of what needs you. Built for multi-week work, uses the plan faster, needs the Claude GitHub App.
6. F. Writer plus reviewer pattern: a second session (or a reviewer subagent) reviews code it didn't watch being written.
7. G. Plan or spec session, then build session: one session interviews the owner and writes SPEC.md or a plan into the repo; a fresh session builds from it.
8. H. Subagents inside one session for searches, logs and test runs, keeping the main chat lighter (costs extra tokens).
9. I. Agent teams (experimental, off by default) and dynamic workflows: Claude-run fan-out for big audits or migrations. Overkill for this owner's step-by-step approval style.
10. J. Local terminal or desktop sessions with git worktrees (claude -w), agent view or /batch. Not applicable to a phone-first, cloud-only owner.
11. K. Cross-session messaging: sessions pass plain-text findings to each other. Cloud sessions can't reply to messages from other machines, and each message costs usage.
12. L. Cloud scheduled tasks (/schedule) for repeating jobs with no conversation, such as a weekly report.
13. M. Shared memory layers: repo CLAUDE.md (every session, keep under 200 lines), .claude/rules (path-scoped), .claude/skills (on-demand procedures), docs/HANDOFF.md and decision records (read when pointed to), Projects memory (threads only). Local auto memory does not cross cloud sessions.

### Pitfalls
1. Sessions share no memory. A decision the owner states in one chat is invisible to every other chat, including the Codex side, unless it is written to a repo file and pushed. Renaming a session does not carry context.
2. Auto memory stays on one machine and does not reach other cloud sessions. In cloud work the repo (CLAUDE.md, HOW-TO-WORK-WITH-ME.md, HANDOFF.md) is the only reliable shared memory.
3. Very long chats cost more on every message, because the whole history is re-sent. The first message after more than about an hour idle re-processes everything at full cost, and /compact on a huge, cold chat is itself expensive. This conflicts with the owner's 'save usage' priority.
4. Compaction keeps CLAUDE.md but summarizes the conversation. Rules given only in chat, such as 'apply my rule 10x', can quietly disappear later in a long chat.
5. Parallel sessions multiply usage, and Projects use the plan faster, especially on Pro. The 5-hour and weekly limits are shared with claude.ai chat and Desktop.
6. Two sessions working on the same files on separate branches can still conflict when both are pushed or merged to main (the GitHub Pages branch). Give each session a clear, non-overlapping area. This matters even more with Claude and Codex both pushing to main.
7. A reclaimed VM loses uncommitted work. Ask the session to commit and push work in progress at milestones (the docs advise this for project threads).
8. Too many ALL-CAPS or 'IMPORTANT' rules, or a CLAUDE.md that keeps growing, lowers adherence. Anthropic says to keep CLAUDE.md under about 200 lines and move procedures to skills. A rule with no exceptions needs a hook, not stronger wording. 'Apply it 10 times more' is best expressed as a concrete checklist or check, not more emphasis.
9. HANDOFF.md is already 185 lines and grows as a dated log. Fresh sessions must read all of it to get up to speed, so a short current-state summary at the top plus a separate decision log would be easier. This is an inference, not an Anthropic rule.
10. /resume and /plugin don't work in cloud sessions or the mobile app. Returning to an old cloud chat means finding it in the sidebar, so clear names matter.
11. Projects is a public beta, rolling out gradually and possibly not visible on the account yet. It needs the Claude GitHub App on the repo (a /web-setup token is not enough). Threads ignore the repo's .claude/settings.json hooks and permissions, can't be moved between projects, and a project can't be shared.
12. Archived cloud sessions can't receive messages until unarchived, and auto-archive on PR merge does not apply to cloud sessions, so the sidebar fills up unless the owner archives finished ones.
13. Third-party guides (builder.io and others) offer rules of thumb such as 'start with 3 sessions'. Only the Help Center's '3–5 parallel sessions, each in its own git worktree' line is Anthropic's, and it is written for local terminal users, not phone-first cloud users.
14. The 1M-token window can make a long chat seem harmless. Anthropic's current docs say running out is rare, but cost and focus still argue for /clear or a fresh session between unrelated tasks.

## Research: practice
**Summary:** The owner's idea is several chats, each renamed for one area of LetsGo. The evidence supports chat names as a filing label, but not long-lived chats that hold the project's memory. Official Claude Code guidance, the Cursor team, Anthropic's long-running-agent work and well-known practitioners (Simon Willison, Jesse Vincent, Addy Osmani, Harper Reed) mostly agree on four points.

(1) Start a new session for each new task. A chat gets worse as it grows ("context rot"; Chroma measured it across 18 models) and it keeps old versions of files and decisions. Long chats also use up more of the plan's usage, according to Claude's own help center.
(2) The project's memory belongs in repo files that every chat and agent reads, such as a short instructions file, a decisions log or ADRs (architecture decision records), and a progress or handoff note. It should not live in chat history.
(3) Work split across chats or agents often goes wrong in two ways. Each one makes its own unstated choices, and the choices clash. Agents also edit the same files and cause merge conflicts. A July 2026 preprint found textual conflicts between pull requests from DIFFERENT agents 41.7% of the time, against 19.8% between pull requests from the same agent. That matters here because the owner runs both Claude and Codex.
(4) The human is the bottleneck. Running agents in parallel multiplies cost (Anthropic puts multi-agent systems at about 15x the tokens of a chat) while review stays single-threaded. Willison and Osmani both say this. Anthropic also says coding has fewer truly parallel tasks than research.

The best-supported patterns are: short task chats with a handoff file; a planner/architect role that writes the spec and plan while fresh chats implement; a writer and a reviewer in separate fresh contexts (this repo already does it, with Codex reviewing Claude); and parallel work only when each agent has its own branch or worktree and its own files. For a non-expert on a phone, the evidence points to few active chats at once, each named area + task, each closed once its work is merged. The next task starts from the repo's handoff file, not from an old chat.

Repo observation: today the decisions are spread over at least 8 to 10 files (HOW-TO-WORK-WITH-ME.md, CLAUDE.md, AGENTS.md, HANDOFF.md, COLLABORATION.md, NEXT.md, motion-core/PLAN.md, racing-core/PLAN.md, KARTS.md and others). That is exactly the setup in which the sources report contradictions and stale decisions being followed.

Limitations: simonwillison.net and lucumr.pocoo.org could not be fetched because this session's network does not allow them. After that I stopped fetching pages, so every web fact below comes from WebSearch result snippets and summaries, not full-page reads. Quoted wording should be checked against the original before it is quoted to the owner.

### Facts

1. **Official Claude Code guidance: most best practices follow from one constraint. The context window fills quickly, and performance degrades as it fills.**
   - Evidence: https://code.claude.com/docs/en/best-practices (anthropic.com/engineering/claude-code-best-practices now 308-redirects here). Search snippet: 'Most best practices are based on one constraint: Claude's context window fills up fast, and performance degrades as it fills.'
   - Confidence: likely

2. **Anthropic's session-management guidance: when you start a new task, also start a new session. The four options are continue (only while everything in context is still needed), /clear with a short brief, compact, and subagents. A bigger (1M) context window does not remove the need for new sessions.**
   - Evidence: https://claude.com/blog/using-claude-code-session-management-and-1m-context (official). The 'new task, new session' line was seen in a mirror and secondary copies (weihaoqu.github.io/learnAIDoc, techtwitter.com).
   - Confidence: likely

3. **Claude Code docs recommend writing a spec first and then starting a fresh session to build from it. They also recommend a second, fresh session as an independent reviewer, because it has not seen the writer's reasoning.**
   - Evidence: https://code.claude.com/docs/en/best-practices. Snippets: 'Once SPEC.md exists, start a fresh session to build from it'; 'A second session is also the easiest independent reviewer you can get. A fresh reviewer does help, because it hasn't seen your reasoning'.
   - Confidence: likely

4. **In Claude Code cloud sessions (claude.ai/code and the mobile app), each task runs in its own session, isolated VM and git branch. Sessions keep running after the browser is closed and can be monitored from the phone.**
   - Evidence: https://code.claude.com/docs/en/web-quickstart and https://code.claude.com/docs/en/claude-code-on-the-web. Snippet: 'Parallel tasks: run several independent tasks at once, each in its own session and branch'.
   - Confidence: likely

5. **Claude Code has git worktree support (--worktree flag; the desktop app gives each new session its own worktree). An unnamed session with no changes has its worktree removed automatically, while a named session asks first. A worktree is a fresh checkout, so gitignored files like .env and installed dependencies are missing.**
   - Evidence: https://code.claude.com/docs/en/worktrees.md and https://code.claude.com/docs/en/best-practices (search snippets).
   - Confidence: likely

6. **Sessions can be named with /rename and resumed by name (claude --resume <name> or /resume <name>). In some 2026 versions, users reported that renamed sessions could not be resumed by name or that the name did not show in the list.**
   - Evidence: https://code.claude.com/docs/en/sessions. Bug reports: https://github.com/anthropics/claude-code/issues/26249 (reported resolved 20 Feb 2026); claudeissues.com issue 31394 (March 2026, v2.1.70, status unknown).
   - Confidence: likely

7. **Claude's help center says longer conversations use more of the usage limit and suggests starting a new conversation when a long chat is near the limit. It also suggests keeping project instructions short and removing unused files.**
   - Evidence: https://support.claude.com/en/articles/11647753-usage-and-length-limits (search summary: 'Longer conversations that trigger automatic context management consume more of your usage limit'; 'start a new conversation if you're approaching your usage limit in a longer chat').
   - Confidence: likely

8. **Chroma's 'Context Rot' report (July 2025) tested 18 LLMs. Performance became increasingly unreliable as input length grew, even on simple tasks. (Caveat: Chroma sells retrieval tooling.)**
   - Evidence: https://research.trychroma.com/context-rot and https://github.com/chroma-core/context-rot. Snippet: 'models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows.'
   - Confidence: likely

9. **Cursor's official agent guidance: long conversations make the agent lose focus because noise builds up after many turns and summaries. Start a new chat and pull in only the earlier context you need (@Past Chats).**
   - Evidence: https://cursor.com/blog/agent-best-practices. Snippet: 'Long conversations can cause the agent to lose focus. After many turns and summarizations, the context accumulates noise...'
   - Confidence: likely

10. **Anthropic's long-running-agent harness treats each session as starting with no memory. An initializer session writes a feature list, a progress log, an init script and a first git commit. Later coding sessions make step-by-step progress, commit with descriptive messages and update the progress file. One summary says the feature list is kept in JSON because the model tends to rewrite Markdown.**
   - Evidence: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents. Snippet: 'each new session begins with no memory of what came before'. JSON detail from a secondary source: pub.towardsai.net article.
   - Confidence: likely

11. **Anthropic: multi-agent systems use about 15x the tokens of a chat (single agents about 4x) and pay off only for high-value tasks. Most coding tasks have fewer truly parallel parts than research, and agents struggle to coordinate and delegate in real time.**
   - Evidence: https://www.anthropic.com/engineering/multi-agent-research-system. The exact sentences were seen only in secondary copies: https://tech.slashdot.org/story/25/06/21/0442227 and the ZenML summary.
   - Confidence: likely

12. **Claude Code Agent Teams cost more tokens than subagents because each teammate is a separate Claude instance. Task claiming uses file locking, but that locks the shared task list, not source files. Third-party guides say two teammates editing the same file can silently overwrite each other ('last write wins') and recommend splitting file ownership by directory, or using worktrees.**
   - Evidence: https://code.claude.com/docs/en/agent-teams (official, on cost and task locking). https://eirwin.github.io/agent-team-topologies/docs/anti-patterns.html and the dev.to 'Claude Code Agent Teams: what the docs don't tell you' post (on same-file overwrites).
   - Confidence: likely

13. **Cognition (makers of Devin), June 2025: in multi-agent setups decisions get too dispersed and context can't be shared fully. Parallel agents make conflicting unstated choices about style and edge cases. Their April 2026 follow-up says what works is agents contributing intelligence while writes stay single-threaded, and that review works best when the reviewer does NOT share the coder's context.**
   - Evidence: https://cognition.ai/blog/dont-build-multi-agents and https://cognition.com/blog/multi-agents-working (search snippets).
   - Confidence: likely

14. **Simon Willison (Oct 2025) runs several Claude Code or Codex sessions at once, in the same repo or in separate checkouts or worktrees. He mainly uses them for research, proofs of concept, small maintenance and directed work. He says review is the natural bottleneck. Later (Mar 2026) he advised capping how much code agents generate per day to match your ability to review it. Secondary reports quote him saying four parallel agents leave him drained by about 11am.**
   - Evidence: https://simonwillison.net/2025/Oct/5/parallel-coding-agents/ (snippet: 'the natural bottleneck on all of this is how fast I can review the results') and https://simonwillison.net/2026/Mar/25/thoughts-on-slowing-the-fuck-down/. The site could not be fetched here, and the 11am line is a paraphrase from secondary coverage.
   - Confidence: likely

15. **Addy Osmani: running more agents does not make your thinking parallel. The agent generates, but evaluating, deciding and integrating stay single-threaded on the human's side. Open-ended threads demand indefinite attention, while time-boxed threads demand bounded attention. Secondary sources put his practical ceiling in the 'low single digits'.**
   - Evidence: https://addyosmani.com/blog/cognitive-parallel-agents/ and https://addyosmani.com/blog/orchestration-tax/. The 'low single digits' figure comes from a secondary German article (drweb.de) and was not verified.
   - Confidence: likely

16. **Addy Osmani describes two modes: 'conductor' (one agent, tight loop, the human approves each change) and 'orchestrator' (several autonomous agents working through pull requests). Summaries of his talk name 'slicing work into non-overlapping pieces' as the core challenge of parallel agents.**
   - Evidence: https://addyosmani.com/blog/future-agentic-coding/ and https://www.oreilly.com/radar/conductors-to-orchestrators-the-future-of-agentic-coding/ (the slicing point is from a secondary summary).
   - Confidence: likely

17. **Jesse Vincent runs a separate 'architect' session and an 'implementer' session and relays reviews between them himself. He clears the implementer rather than compacting it after each batch. He rewinds the architect to an earlier checkpoint before review, to keep its context small and unbiased.**
   - Evidence: https://blog.fsck.com/2025/10/05/how-im-using-coding-agents-in-september-2025 (search summary). Also mentioned in Willison's Oct 2025 post.
   - Confidence: likely

18. **Harper Reed's workflow has separate phases: shape a spec through one-question-at-a-time Q&A (spec.md), have a reasoning model turn it into a prompt plan and todo checklist (prompt_plan.md, todo.md), then execute step by step. He later switched execution to Claude Code. One summary says he warns against parallel agents on a shared codebase; this was not verified.**
   - Evidence: https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/ and https://simonwillison.net/2025/Feb/21/my-llm-codegen-workflow-atm/ (search summaries).
   - Confidence: likely

19. **Armin Ronacher: use subtasks or subagents to save context; a CLAUDE.md that is too long stops helping; needing /compact means you have already lost; too many MCP tools speed up context rot.**
   - Evidence: https://lucumr.pocoo.org/2025/6/12/agentic-coding/ (could not be fetched here; taken from search snippets and Willison's summary at https://www.simonwillison.net/2025/Jun/12/agentic-coding-recommendations).
   - Confidence: likely

20. **Preprint (July 2026) on 33,596 agent pull requests in 2,807 repos: textual merge conflicts occurred far more often between pull requests from different agents (41.7%) than between pull requests from the same agent (19.8%). 79.4% of agent pull requests overlapped in time with other pull requests. Git-level measurement undercounts semantic conflicts.**
   - Evidence: https://arxiv.org/abs/2607.04697 (search summary; peer-review status unknown). A related dataset paper, https://arxiv.org/pdf/2604.03551, found larger pull requests more prone to conflicts.
   - Confidence: likely

21. **An ETH Zurich study (arXiv 2602.11988, Feb 2026) found that repo context files (AGENTS.md / CLAUDE.md) generated by an LLM tended to reduce task success and raised inference cost by over 20%. Human-written files helped slightly (about +4%). The authors recommend short human-written files limited to things an agent cannot work out for itself.**
   - Evidence: https://arxiv.org/abs/2602.11988; https://infoq.com/news/2026/03/agents-context-file-value-review/ (search summaries). The ICLR workshop version words the result more cautiously ('no improvement').
   - Confidence: likely

22. **Decision records stored in the repo help agents because the agents start with no memory. The risk is agents obeying stale decisions. A suggested fix is to mark each record accepted, proposed or superseded, and to let agents challenge a decision rather than silently override it.**
   - Evidence: https://www.oreilly.com/radar/coding-agents-love-decision-records/ (search summary).
   - Confidence: likely

23. **Claude Code's memory docs recommend a CLAUDE.md that imports AGENTS.md (@AGENTS.md), so Codex and Claude read one set of instructions without duplication. A symlink is an alternative.**
   - Evidence: https://code.claude.com/docs/en/memory (search summary). Sources disagree on whether Claude reads AGENTS.md natively.
   - Confidence: likely

24. **OpenAI's Codex guidance: AGENTS.md is a short, practical 'README for agents' that loads automatically. Add rules only when a mistake repeats, and define 'done' and how to verify it.**
   - Evidence: https://developers.openai.com/codex/learn/best-practices (search summary, including localized versions).
   - Confidence: likely

25. **GitHub's Copilot coding agent guidance: give clear, well-scoped, single-feature tasks with acceptance criteria and explicit 'do not change' limits, split big features into smaller issues, and keep broad or complex tasks for yourself. No source stated a 'one PR per task' rule.**
   - Evidence: https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results and https://github.github.io/awesome-copilot/learning-hub/using-copilot-coding-agent (search summaries).
   - Confidence: likely

26. **Steve Yegge built 'Beads', a git-backed issue tracker that serves as agents' memory across sessions. He says agents have no memory between sessions ('Memento... Fifty First Dates'). Thoughtworks put Beads in 'Trial' on its Nov 2026 Technology Radar.**
   - Evidence: https://steve-yegge.medium.com/introducing-beads-a-coding-agent-memory-system-637d7d92514a, https://github.com/steveyegge/beads and https://www.thoughtworks.com/en-es/radar/tools/beads (search summaries).
   - Confidence: likely

27. **Amp replaced its /compact command with a 'Handoff' tool. A reported internal OpenAI finding linked Codex auto-compaction to gradually declining performance. A 2026 preprint found that compressing state at a handoff can drop constraints that matter for decisions, so a handoff is not lossless either.**
   - Evidence: https://tessl.io/blog/amp-retires-compaction-for-a-cleaner-handoff-in-the-coding-agent-context-race and https://arxiv.org/abs/2607.18265 (search summaries; the OpenAI claim is secondhand).
   - Confidence: unconfirmed

28. **Anthropic's 'Building effective agents': find the simplest solution possible and add complexity only when needed. In the orchestrator-workers pattern, a central model splits the task, delegates the parts and combines the results.**
   - Evidence: https://www.anthropic.com/engineering/building-effective-agents (search summary; the post notes its tooling details date from Dec 2024).
   - Confidence: likely

29. **METR's randomized study (July 2025): 16 experienced developers took 19% longer with AI tools, yet believed they had been 20% faster. Users can misjudge AI-assisted productivity, which is relevant to judging 'more chats = faster'.**
   - Evidence: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ and https://arxiv.org/abs/2507.09089.
   - Confidence: likely

30. **Game-dev anecdotes: one solo developer kept a DECISIONS.md in the repo and pasted it into every new Claude session. A Godot RTS developer found conflicting information about character movement in the context when design notes were split across several markdown files. InnoGames uses a Specify → Plan → Task → Implement pipeline with quality gates.**
   - Evidence: https://dev.to/pickuma/building-addictive-web-games-with-claude-opus-47-a-2-day-solo-dev-case-study-24ao, https://dev.to/datadeer/part-1-building-an-rts-in-godot-what-if-claude-writes-all-code-49f9 and https://blog.innogames.com/beyond-vibe-coding-a-disciplined-workflow-for-ai-assisted-software-development-with-claude-code/ (search summaries; anecdotal).
   - Confidence: unconfirmed

31. **Non-programmer anecdotes: ask for small targeted changes rather than full rewrites (rewrites silently undid days of work), start new chats often, and keep a written spec of decisions outside the chat.**
   - Evidence: https://hackernoon.com/what-i-learned-vibe-coding-apps-as-a-non-coder; SaaStr guide https://www.saastr.com/the-live-complete-guide-to-vibe-coding-without-a-developer-what-we-actually-learned-after-building-5-production-apps (search summaries; anecdotal).
   - Confidence: unconfirmed

32. **In this repo, decision and instruction text is spread over many files: docs/HOW-TO-WORK-WITH-ME.md (declares itself the main source of truth and wins on conflicts), CLAUDE.md, AGENTS.md (a pointer file that says not to keep a second rule list), docs/HANDOFF.md (status and confirmed decisions), docs/COLLABORATION.md (ownership), docs/NEXT.md, motion-core/PLAN.md, racing-core/PLAN.md, docs/KARTS.md and docs/game-dev/13-production.md ('Decide, record, keep').**
   - Evidence: Local files: /home/user/3D-World-4/docs/HOW-TO-WORK-WITH-ME.md lines 1-5 and 84-89; /home/user/3D-World-4/AGENTS.md; /home/user/3D-World-4/docs/HANDOFF.md; /home/user/3D-World-4/docs/COLLABORATION.md; grep results for 'decision' across the repo.
   - Confidence: confirmed

33. **The repo already uses a writer/reviewer split across assistants (Claude builds avatar parts, Codex reviews) and splits ownership by area (Claude: motion-core/ and the Skeleton section; Codex: racing and driving). This matches the sources' advice to split by files or directories.**
   - Evidence: /home/user/3D-World-4/docs/COLLABORATION.md (ownership table, owner update of 20 Nov 2026); /home/user/3D-World-4/CLAUDE.md section C.
   - Confidence: confirmed

### Options seen
1. One long continuous chat for everything. Simplest to track. All sources advise against it for unrelated tasks because of context rot, stale file versions and higher usage cost.
2. One long-lived chat per area or feature, renamed by topic (the owner's idea). No source endorses keeping these open indefinitely; the same rot and stale-state problems apply inside each one. Area names work well as labels if each chat is per task.
3. Short-lived one-task chats with handoff or progress files in the repo: new task, new session, and state lives in files (Anthropic harness with progress log and feature list, Claude Code docs, Cursor @Past Chats, Amp Handoff).
4. A lead, planner or architect chat that writes the spec and plan, plus fresh worker or implementer chats that build each step (Jesse Vincent architect/implementer, Harper Reed spec → plan → execute, Anthropic orchestrator-workers).
5. Chats per phase: research or spec → plan → implement → review, each in a fresh session (Claude docs 'fresh session to build from SPEC.md', GitHub Spec Kit specify/plan/tasks/implement, InnoGames Specify-Plan-Task-Implement).
6. A writer/reviewer pair in separate fresh contexts, one building and one reviewing without the builder's reasoning (Claude Code docs, Cognition 2026, Jesse Vincent). Codex reviewing Claude in this repo is already a version of this.
7. Parallel agents, each in its own git worktree, checkout or cloud branch (Claude Code --worktree and desktop auto-worktrees, cloud sessions one branch each, Codex cloud tasks, Simon Willison).
8. Subagents or Agent Teams inside one session: a lead with teammates and a shared task list, clean child contexts that return only summaries (Claude Code subagents, Agent Teams).
9. Issue tracker or task list as the shared memory: each agent or chat takes one ticket and produces one pull request (Steve Yegge's Beads, GitHub Copilot coding agent issue → PR).
10. Split by domain ownership between assistants or chats, assigning files or directories to one owner (agent-team guides; this repo's Claude=avatar, Codex=racing split).
11. Throwaway parallel chats only for low-risk work such as research, proofs of concept or small maintenance, while one main build thread stays single-threaded (Simon Willison; Cognition's 'writes stay single-threaded').
12. Decision records or a decisions log as the single source of truth that every chat reads at the start (O'Reilly 'coding agents love decision records', the game-dev DECISIONS.md anecdote, the AGENTS.md/CLAUDE.md import pattern).

### Pitfalls
1. Context rot: chat quality drops as the conversation grows, even on simple tasks (Chroma, 18 models; Claude Code docs; Cursor blog). A long-lived 'area chat' degrades over time even if renamed.
2. Stale context: a long chat remembers old versions of files and decisions and may refer to code that has been deleted. Other chats and Codex keep changing main, so an older area chat's picture of the project goes out of date.
3. Contradicting decisions: separate chats or agents each make unstated choices that clash (Cognition). Decisions recorded in several files drift apart (Godot RTS anecdote). This repo currently spreads decisions across 8 to 10 files.
4. Stale decision records followed blindly: agents obey old ADRs or rules unless records are marked accepted, superseded or proposed and agents may flag conflicts (O'Reilly).
5. Merge conflicts: isolated branches or worktrees only delay conflicts until merge time. A July 2026 preprint found cross-agent pull requests conflict about twice as often as same-agent ones (41.7% vs 19.8%), which matters with Claude and Codex both pushing to main. Semantic conflicts that git merges cleanly are not caught.
6. Same-file edits by parallel agents can silently overwrite each other ('last write wins'). Split file ownership by directory, or run the work one after another.
7. Cost: long chats use more of the usage limit (Claude help center). Multi-agent setups use about 15x the tokens of a chat (Anthropic). Each Agent Teams teammate is a separate instance. Context files raise inference cost by over 20% (ETH).
8. Human review bottleneck: running more agents does not add judgment capacity (Willison, Osmani). For a non-expert who cannot read code and often uses a phone, parallel output can exceed what they can test and approve. METR found people overestimate the speedup.
9. Coding is less parallelizable than research (Anthropic). Many game tasks depend on each other (avatar joints → movement → animation), so parallel chats wait on each other or rework.
10. Compaction loses the 'why'. Handoff summaries can drop constraints (arXiv 2607.18265). Handoff files need the decision and the reason, plus a check that a fresh chat can continue from them alone.
11. Instruction-file bloat: a long CLAUDE.md stops helping (Ronacher). LLM-generated context files reduced success (ETH). Duplicate rule lists for Claude and Codex invite drift; the docs recommend one file imported by the other.
12. Too many named chats: the owner loses track of which chat has the latest state, and a chat title can wrongly suggest that chat 'owns' knowledge that should live in the repo.
13. Worktree or cloud-session setup gaps: a fresh checkout lacks .env and installed dependencies (Claude docs). Cloud sessions cannot see uncommitted local work (third-party Codex guidance).
14. Renaming tool quirks: some 2026 Claude Code versions had bugs resuming or showing sessions by their new name (GitHub issues 26249, 31394).
15. Research gap: no rigorous study compares chat-per-area against chat-per-task for non-experts. The non-expert and game-dev evidence is anecdotal. All web evidence here came from search snippets, because simonwillison.net and lucumr.pocoo.org were blocked by the session network and full pages were not fetched.

## Research: repo
**Summary:** The repo's own history shows the owner already works across several chats, and it shows the problems that come with doing it the way it is done now. Commit trailers and the session list show at least five LetsGo Claude chats. Three of them pushed commits: "New chapter setup" (16 to 20 Nov, 158 commits, covered everything and ended by writing CLAUDE.md and HANDOFF.md), "Official LetsGo Project" (20 Nov to now, 89 commits, the avatar rebuild, still pushing today) and "Kart appearance review" (21 to 22 Nov, 29 commits). Two more pushed nothing: "Fix the flaky driving browser test" (22 Nov) and this one. Codex works separately. Only 18 commits carry the Codex name. About 104 commits under the owner's own git name are driving, Test Lab and some avatar socket work, so they were most likely made by Codex. Each Claude chat works on its own randomly named claude/* branch. Work reaches main by merging main into the branch and then pushing the branch to main. There have been no pull requests, and main has 51 "Merge origin/main into <branch>" commits, 18 of them on 22 Nov, the day three writers pushed in parallel.

The hand-off problems are concrete:
(1) One shared, append-only log, docs/HANDOFF.md, is 185 lines but 13,101 words. 72% of it is avatar item history, and 93 of 378 non-merge commits on main edited it. It has duplicate item numbers (36 to 43 appear twice), a "renumber kart items after merge" fix-up commit, a header that still says "Written 20 November" and a State section about the Skeleton page.
(2) Work is stranded on a chat branch. claude/relaxed-wozniak-iznto4 has 9 commits that are not on main, including a different version of handoff items 63 to 70 than the one on main.
(3) A chat was left waiting on a decision another chat had already made differently. The kart chat is still marked blocked on "confirm S Kart 11, GT 3 and F1 1". About an hour after its last commit, Codex recorded the owner choosing GT option 05.
(4) The same things were built more than once across assistants and chats: walking, avatar sockets and kart bodies.
(5) Rules are duplicated and conflict. CLAUDE.md section B and HOW-TO section C disagree on what goes first and last in a reply. Three files each say a different file must be read "first". COLLABORATION.md still calls CLAUDE.md the shared guide. CLAUDE.md rules 14 to 17 were added in commits under the owner's git name, which explains why their origin is "not confirmed".
(6) Area docs are stale: avatar-v2/README says "Current state (21 November)", NEXT.md ends on 20 Nov, and checkpoints/README leaves out three of the seven checkpoint folders.
(7) Parallel pushes cancel and restart the roughly 10-minute Pages publish, and one assistant's failing test blocks everyone (HANDOFF item 74, deploy.yml cancel-in-progress).

A fresh chat must read at least four files before it can work: CLAUDE.md, HOW-TO-WORK-WITH-ME.md, HANDOFF.md and COLLABORATION.md. Together they are 444 lines and about 15,600 words, very roughly 20,000 tokens (an estimate). Each area then needs its own docs on top: about 3,300 words for avatar, about 15,900 for movement, about 8,400 for karts and about 10,800 for driving. A chat named "LetsGo - Avatar" gets its current state today only by reading HANDOFF items 9 to 79 (about 11,200 words of chronological log). The latest status is item 79, plus docs/AVATAR-POLISH-LIST.md (added to main today and not yet in this local checkout), plus a stale avatar-v2/README.md. No short per-area "current state" page exists. Decisions are recorded in at least 17 different markdown files rather than one decisions record.

### Facts

1. **There are 4 claude/* remote-tracking branches locally, and origin has 3 claude/* branches today (brave-hamilton-l04w49, lucid-pascal-xqtrwb, relaxed-wozniak-iznto4). There are 0 codex branches. The other branches are main, gh-pages and an old avatar-preview branch (1 commit, 16 Nov, not on main).**
   - Evidence: `git branch -r | wc -l` gives 7, `grep -c claude/` gives 4, `grep -ci codex` gives 0. `git ls-remote --heads origin` lists avatar-preview, the 3 claude/* branches, gh-pages and main. claude/nice-cannon-50ao74, this session's branch, exists only locally.
   - Confidence: confirmed

2. **Codex did not use its own branches. It worked on a local branch called 'work', merged origin/main into it and pushed to main. Most of its later commits are authored under the owner's own git name, not 'Codex'.**
   - Evidence: main has 7 merges titled "Merge remote-tracking branch 'origin/main' into work" (17 to 18 Nov). `git log --all --format='%an <%ae> | %cn <%ce>'` shows 10 Codex/Codex, 8 commits authored by Codex but committed under the owner's identity, and 104 commits under the owner's identity. Those 104 are driving, racing, Test Lab and socket-lab work, e.g. 'Add GT3 V3 driving comparison preset' and 'Document shared ownership and fresh-session handoff for both assistants'.
   - Confidence: likely

3. **Commit trailers show 3 distinct Claude Code sessions that pushed commits. The session list gives their titles: 'New chapter setup' (session_01Qq9FAnthsgdpiPGZDsxgfd, 16 to 20 Nov, 158 commits, skeleton, motion core and Test Lab, ended by writing CLAUDE.md and HANDOFF.md in a0e8108), 'Official LetsGo Project' (session_01Qq9FAkqSMc6gnXmDjNpDo1, 20 Nov to today, 89 commits, almost all 'New avatar:'), and 'Kart appearance review' (session_01Qq9FAp1Tx2RPoXcVNaohq2, 21 to 22 Nov, 29 commits, karts, the parts kit and 2 'Working guide' edits).**
   - Evidence: `git log --all --author=Claude --format=%B | grep Claude-Session | sort | uniq -c` gives 158, 89 and 29. mcp list_sessions(mine:true) returns these titles and dates.
   - Confidence: confirmed

4. **The owner already has other LetsGo chats, some named for one area or one task: 'Fix the flaky driving browser test' (22 Nov, blocked waiting for 'Go', no commits found), 'LetsGo 2' (3 to 17 Nov, which mentions docs/DECISIONS.md, a file that does not exist in this repo), and this chat, 'LetsGo game architecture review'. One session in the list is unrelated to LetsGo and was ignored.**
   - Evidence: mcp list_sessions(mine:true) titles and post_turn_summary. `ls docs/DECISIONS.md` gives 'No such file'. It is not confirmed that LetsGo 2 was working in 3D-WORLD-3.
   - Confidence: confirmed

5. **Work moves from chat branches to main without pull requests. The chat merges origin/main into its claude/* branch and then pushes that branch to main. main holds 51 merge commits: 19 into lucid-pascal, 10 into brave-hamilton, 10 into relaxed-wozniak, 7 into 'work' and 5 others. After 22 Nov 12:56 UTC, main is linear.**
   - Evidence: `git log main --merges --format=%s | sort | uniq -c`. A search for 'pull request' in all commits gives 0. Merges per day: 17 Nov 9, 18 Nov 17, 20 Nov 4, 21 Nov 3, 22 Nov 18. The last merge is df308ee at 2026-11-22 12:56.
   - Confidence: confirmed

6. **Each push to main runs the full test suite and publishes Pages. A newer push cancels the run that is still going (concurrency with cancel-in-progress), so parallel chats and Codex delay each other, and a failing test from one assistant blocks everyone's publish.**
   - Evidence: .github/workflows/deploy.yml has 'concurrency: group: pages-${{ github.ref }}, cancel-in-progress: true'. docs/HANDOFF.md item 74 says: 'my neck push (05:23) was cancelled two minutes later by a Codex push, that Codex run then failed its own driving test ... every push from either of us restarts the ~10-minute publish, and a failing test blocks everyone's changes.'
   - Confidence: confirmed

7. **Work is stranded on a chat branch. claude/relaxed-wozniak-iznto4 has 9 commits that are not on main, including its own handoff items 63 to 70. main's HANDOFF.md has different items under the same numbers 63 to 70.**
   - Evidence: `git rev-list --count main..claude/relaxed-wozniak-iznto4` gives 9. The branch's items 63 to 70 cover hip balls, knee cups and shoulder chiselling, while main's items 63 to 70 cover the torso sockets tab and hip restart through thigh presses. main's HANDOFF item 63 says this work 'is not on main'.
   - Confidence: confirmed

8. **A chat was left blocked on a decision that was later made in another assistant's work, with a different answer. The Claude kart chat's last state asks the owner to 'confirm S Kart 11, GT 3 and F1 1 as the starting models'. Codex commits about an hour later record the owner choosing S Kart option 01 (style 11), GT option 05 (GT3 R-inspired) and F1 option 01.**
   - Evidence: list_sessions post_turn_summary for 'Kart appearance review'. docs/karts/PARTS-KIT.md section H items 3 to 6. git log for PARTS-KIT.md: Claude 3a9309d at 20:07 UTC, then the owner-identity commits 1dec107, 017659d and f5fffb4 at 20:59 to 21:15 UTC ('Record GT stock selection ...').
   - Confidence: confirmed

9. **The same features were built more than once by different assistants or chats. Walking/running: Codex built /movement/, walk-test and run-test, while Claude built motion-lab and motion-core walk layers (items 41, 42 and 44, all superseded by 46). Both were rejected and removed in a reset. Avatar sockets: elbow-lab, wrist-lab and foot-lab socket studies were committed under the owner's identity on 19 Nov, then Claude rebuilt every socket in avatar-v2 on 21 to 23 Nov. Kart bodies: Claude built kart-parts/models.js (GoKart, GT, F1) on 22 Nov, and Codex built kart-parts/product-prototypes.js plus racing-core/kart/prototypes.ts and stock lineups the same day.**
   - Evidence: First and last commit per folder: movement, foot-lab and hand-lab first by Codex on 17 Nov; elbow-lab and wrist-lab by the owner identity on 19 Nov; avatar-v2 and new-avatar by Claude from 20 Nov. docs/NEXT.md item 7 ('Claude's own movement test, to compare with Codex's /movement/') and item 47 (RESET). Commits 6ca8577 (Claude karts) and 4ff999c (prototypes under the owner identity).
   - Confidence: likely

10. **docs/HANDOFF.md is the shared append-only log and a merge hotspot. It is 185 lines but 13,101 words (78,920 bytes). It was edited in 93 of 378 non-merge commits on main and in 114 commits across all branches. Item numbers 36 to 43 appear twice, once for avatar and once for karts, and there is a fix-up commit 'Handoff: renumber kart items after merge'.**
   - Evidence: `wc -lcw docs/HANDOFF.md`. `git log main --no-merges -- docs/HANDOFF.md | wc -l` gives 93. `grep -oE '^[0-9]+\. ' docs/HANDOFF.md | sort -n | uniq -d` shows 36 to 43 (lines 50 to 57 and 95 to 102). Commit 35acdc3 on 2026-11-21.
   - Confidence: confirmed

11. **HANDOFF.md is mostly one area's history. About 11,226 of 13,101 words (about 86%) are avatar items 1 to 79, 782 are kart items, 533 are Codex driving notes and 193 are the header and State section. Its header still says 'Written 20 November 2026', and its State section describes the Skeleton page, not the current avatar.**
   - Evidence: `sed -n 14,93p docs/HANDOFF.md | wc -w` gives 11,226. Lines 95 to 102 give 782 and lines 119 to 185 give 533. Lines 3 and 9 to 12.
   - Confidence: confirmed

12. **The docs disagree about which file to read first: CLAUDE.md says to read HOW-TO-WORK-WITH-ME.md first and also that 'A new session should also read docs/HANDOFF.md first'. HANDOFF.md says 'Read CLAUDE.md first'. AGENTS.md says HOW-TO first. COLLABORATION.md (20 Nov) still says to 'Use the common workflow and communication guide in ../CLAUDE.md', which predates HOW-TO becoming the main source of truth on 21 Nov.**
   - Evidence: CLAUDE.md lines 3 and 17. docs/HANDOFF.md line 3. AGENTS.md line 3. docs/COLLABORATION.md line 7. docs/HANDOFF.md item 13.
   - Confidence: confirmed

13. **Reply-format rules are duplicated and conflict between CLAUDE.md section B and HOW-TO section C. B10 puts the time estimate alone on the first line, B13 leads with one line saying what the owner must do, and B12 ends with a summary. HOW-TO C1 starts with a summary and C2 ends with what the owner needs to do. CLAUDE.md says HOW-TO wins. AGENTS.md says 'do not maintain a second rule list'.**
   - Evidence: CLAUDE.md section B items 10 to 13. docs/HOW-TO-WORK-WITH-ME.md section C items 1 to 3. AGENTS.md line 10.
   - Confidence: confirmed

14. **CLAUDE.md section C rules 14 to 17 were added in commits authored under the owner's git identity on 17 Nov (most likely Codex). That is why CLAUDE.md says their 'exact origin is not confirmed'.**
   - Evidence: `git log -p -- CLAUDE.md`: rule 14 added in fce43a1, rule 15 in 07a8afb, rule 16 in 325625b and 1a07325, rule 17 in 1a07325, all authored under the owner's identity. CLAUDE.md, notes on section C.
   - Confidence: likely

15. **Workflow rules the owner gave inside an area chat were recorded only in that area's log, not in the main guide. Examples: 'show pictures first; once the owner approves, push without asking again' (HANDOFF item 66), 'push automatically' (item 69) and 'layers no longer wait for the owner's approval' (NEXT.md item 37, motion-core/PLAN.md). The kart-named chat also edited the global working guide.**
   - Evidence: docs/HANDOFF.md items 66 and 69. docs/NEXT.md item 37. motion-core/PLAN.md decision 1. Session 01Qq9FAp1Tx2RPoXcVNaohq2 commits 'Working guide: the owner's most important rule, in full' and 'Working guide: name what each choice is'.
   - Confidence: confirmed

16. **Area status docs are stale. avatar-v2/README.md says 'Current state (21 November 2026)', although the avatar has since moved to sockets and a 6 ft 4 in version. docs/NEXT.md, the movement log of 511 lines and 6,851 words, ends at item 49 on 20 Nov and numbers items out of order (1 to 4, 7, 5, 6, 8 ...). NEXT.md item 47 says items 31 to 46 describe removed code, while HANDOFF practical note 4 says 41 to 46. checkpoints/README.md lists avatar, island, test-lab and motion-lab checkpoints but not driving-1, driving-2 or avatar-joints-1, which exist as folders and, for driving, as tags.**
   - Evidence: avatar-v2/README.md line 7. `grep -n '^## \|^[0-9]\+\. ' docs/NEXT.md`. docs/NEXT.md line 494 and docs/HANDOFF.md line 117. `ls checkpoints`, `git tag`, and `grep -c -iE 'driving|avatar-joints' checkpoints/README.md` gives 0.
   - Confidence: confirmed

17. **Some decisions also conflict across ownership docs. motion-core/PLAN.md says 'Codex builds all visuals'. COLLABORATION.md's recommended row says 'Avatar appearance changes: Codex implements', later replaced by the owner's update that Claude builds the avatar parts. Meanwhile Claude built kart looks (kart-parts/, karts/) inside Codex's racing area, and Codex edited kart-parts/ and motion-lab/.**
   - Evidence: motion-core/PLAN.md line 3. docs/COLLABORATION.md recommended-assignments table and the 'Owner update (20 November 2026)' paragraph. kart-parts was created by Claude on 21 Nov and last edited by the owner identity on 22 Nov. motion-lab was last edited by the owner identity on 22 Nov.
   - Confidence: confirmed

18. **Decisions are recorded in at least 17 markdown files, not one place. The most are in HANDOFF.md (26 matches) and NEXT.md (20), followed by motion-core/PLAN.md, racing-core/PLAN.md, KARTS.md, PARTS-KIT.md, WORLD-RULES.md, avatar-v2/README.md and others. AVATAR-DIRECTION.md and the new AVATAR-POLISH-LIST.md also hold owner rules. The repo has 79 markdown files outside node_modules and checkpoints, about 101,760 words.**
   - Evidence: A grep for 'owner (approved|picked|chose|decided|decision)|owner decision|approved by the owner|confirmed by the owner' across *.md matched 17 files. `find . -name '*.md' ... | wc -l` gives 79, with 101,760 words.
   - Confidence: confirmed

19. **The minimum reading for a fresh chat is CLAUDE.md (89 lines), docs/HOW-TO-WORK-WITH-ME.md (106), docs/HANDOFF.md (185 lines, 13,101 words) and docs/COLLABORATION.md (64). That is 444 lines and 15,592 words, roughly 20,000 tokens by the usual 1.3 tokens-per-word estimate. CLAUDE.md section C also points to docs/game-dev/README.md (33 lines), docs/AVATAR-DIRECTION.md (18) and motion-lab/README.md (40).**
   - Evidence: `wc -lw CLAUDE.md docs/HOW-TO-WORK-WITH-ME.md docs/HANDOFF.md docs/COLLABORATION.md` gives 444 lines and 15,592 words. The token figure is an estimate, not measured.
   - Confidence: confirmed

20. **Per-area reading on top of the core: Avatar about 3,256 words (avatar-v2/README.md 1,830, avatar/ANIMATION-HANDOFF.md 892, avatar/README.md 284, AVATAR-DIRECTION.md 250), plus docs/AVATAR-POLISH-LIST.md (28 lines, on main only). Movement about 15,858 words (motion-core/PLAN.md 6,397, NEXT.md 6,851, motion-lab/README 748, game-dev 02 and 04). Karts about 8,371 words (KARTS.md, the docs/karts/*.md references, PARTS-KIT.md, kart-parts/README.md). Driving about 10,780 words (racing-core/PLAN.md 10,187, test-lab/FOUNDATIONS.md 593).**
   - Evidence: `wc -lw` output for each set.
   - Confidence: confirmed

21. **Today a chat named for the avatar would find the current avatar state only in HANDOFF items 9 to 79. The latest status is item 79 (wrist balls 5 cm into the forearms; the 6 ft 4 in version not yet locked in), plus docs/AVATAR-POLISH-LIST.md (polish items, 'nothing fixed until the owner goes through it'). The avatar-v2/README 'current state' is two days old. It would also need COLLABORATION.md for ownership, AVATAR-DIRECTION.md for look rules (golden ratio, no sharp edges), avatar/official.json and checkpoints for approved references, and git branch state (9 unmerged commits on relaxed-wozniak). No single short page gives the current avatar state.**
   - Evidence: docs/HANDOFF.md items 78 and 79 (lines 92 and 93). docs/AVATAR-POLISH-LIST.md on origin/main (commits 0723559 and 271405b). avatar-v2/README.md line 7. docs/AVATAR-DIRECTION.md. README.md B2.
   - Confidence: confirmed

22. **While this chat was open, the avatar chat ('Official LetsGo Project') pushed 2 more commits to main (16:10 and 16:33 UTC today). The local checkout here (cb77276) is now 2 commits behind origin/main (271405b), so parallel chats make each other's checkouts stale within hours.**
   - Evidence: `git rev-parse HEAD` gives cb77276. `git ls-remote --heads origin` shows main at 271405b. Both new commits carry the trailer Claude-Session session_01Qq9FAkqSMc6gnXmDjNpDo1.
   - Confidence: confirmed

23. **Commit volume is high. main has 429 commits in about 8 days (16 to 23 Nov). Claude commits per day: 9, 45, 38, 63, 29, 47, 68, 16. Owner-identity commits per day: 20, 33, 20, 11, 0, 19, 1.**
   - Evidence: `git log --all --author=... --format=%ad --date=short | sort | uniq -c`.
   - Confidence: confirmed

24. **Branch names do not show the area. claude/<adjective>-<name>-<id> names are random, so the only link between a branch and an area is the session trailer in the commits or the session title.**
   - Evidence: Branch names brave-hamilton-l04w49 (kart chat), relaxed-wozniak-iznto4 (avatar chat), lucid-pascal-xqtrwb ('New chapter setup'), mapped through Claude-Session trailers.
   - Confidence: confirmed

25. **The two assistants use different numbering for the same kart choices, which risks mix-ups across chats: 'style 3' in the early style sheets versus 'option 05' in the later stock lineup for GT.**
   - Evidence: docs/karts/PARTS-KIT.md section H item 3 ('initial references were S Kart style 11, GT style 3, and F1 style 1') versus item 5 ('GT option 05, GT3 R-inspired').
   - Confidence: confirmed

### Options seen
1. One long general chat that covers everything, then a handoff document written at the end for the next chat. Examples: 'New chapter setup' (16 to 20 Nov, 158 commits, ended with CLAUDE.md and HANDOFF.md rewritten) and 'LetsGo 2'.
2. One long chat per major area, open for days and generically named. Example: 'Official LetsGo Project', the avatar rebuild, 20 Nov to today, 89 commits.
3. One chat per area or feature, named for it. Example: 'Kart appearance review' (21 to 22 Nov, 29 commits, own branch).
4. One chat per single task or bug. Example: 'Fix the flaky driving browser test' (22 Nov, no commits, waiting for Go).
5. One chat per question or review. Example: 'LetsGo game architecture review' (this chat).
6. Split by assistant. Claude chats run in the cloud on claude/* branches, and Codex runs on a local 'work' branch, committing mostly under the owner's git identity and pushing straight to main.
7. Each chat gets its own random claude/* branch, and work reaches main by merging origin/main into the branch and pushing it (no PRs). Since late 22 Nov, pushes to main have been linear.
8. Handoff through shared docs: one append-only log (docs/HANDOFF.md), an ownership table (docs/COLLABORATION.md), a working-rules file (docs/HOW-TO-WORK-WITH-ME.md plus CLAUDE.md and AGENTS.md as entry points) and per-area plan files (motion-core/PLAN.md, racing-core/PLAN.md, docs/KARTS.md, docs/karts/PARTS-KIT.md, docs/AVATAR-POLISH-LIST.md, avatar-v2/README.md).
9. Frozen checkpoints with git tags as approved baselines (checkpoints/ folders plus tags such as avatar-checkpoint-2-2026-11-17 and driving-checkpoint-2-2026-11-20).

### Pitfalls
1. Parallel chats and Codex all push to main. Each push cancels the running publish and restarts it (about 10 minutes), and one assistant's failing test blocks everyone's publish (deploy.yml cancel-in-progress; HANDOFF item 74).
2. One shared append-only HANDOFF.md that every chat writes to causes merge conflicts and numbering collisions: items 36 to 43 appear twice, a 'renumber after merge' fix-up was needed, and 93 of 378 non-merge commits on main touched it. It also makes every fresh chat read about 13,100 words, mostly about other areas.
3. Work and records get stranded on chat branches. relaxed-wozniak has 9 commits not on main, including a different set of handoff items 63 to 70 under the same numbers as main's.
4. Chats are left 'blocked' on questions that were already answered elsewhere, sometimes differently. The kart chat still waits on 'GT 3', while Codex recorded the owner choosing GT option 05.
5. Two assistants or chats build the same thing in parallel: walking (Codex /movement/ versus Claude motion-lab), avatar sockets (19 Nov socket labs versus Claude's avatar-v2 rebuild) and kart bodies (Claude models.js versus Codex product-prototypes.js).
6. Rules end up in several files and conflict: CLAUDE.md section B versus HOW-TO section C, three different 'read this first' instructions, and COLLABORATION.md still pointing to CLAUDE.md as the guide.
7. Workflow rules the owner gives in one area chat ('push automatically', 'show pictures first', 'layers no longer wait for approval') are recorded only in that area's log, so other chats never see them. An area chat (karts) also edited the global working guide.
8. Status pages go stale because only the active chat's log is updated: avatar-v2/README says 'current state 21 Nov', NEXT.md ends on 20 Nov, HANDOFF's header and State section date from 20 Nov, and checkpoints/README leaves out driving-1, driving-2 and avatar-joints-1.
9. Commit history hides who did what. Codex commits mostly carry the owner's git name, so rules it added to CLAUDE.md (14 to 17) became rules of 'unconfirmed origin'.
10. Random branch names (claude/brave-hamilton-...) do not say which area or chat they belong to, and the main avatar chat's generic title ('Official LetsGo Project') does not either.
11. A chat's local checkout falls behind main within hours while another chat pushes, as happened during this session. Each chat must pull or check main before it works or pushes.
12. Option-numbering schemes differ between chats and assistants ('style 3' versus 'option 05'), so a choice quoted in one chat can mean something else in another.
13. General point, not shown in the repo: very long chats (the avatar chat has been running since 20 Nov) can lose early context to summarisation, so they rely on the docs being current. This is unconfirmed for these specific sessions.

## Comparison and recommendation

### Criteria

1. **C1. One source of truth: decisions stay in one place and stay consistent**
   - Weight: 20
   - Why: The owner wants one authoritative record, and HOW-TO-WORK-WITH-ME.md section E says to record every decision with its reason. Chats share no memory (code.claude.com/docs/en/memory.md), and renaming a chat gives it no context. The repo shows what happens when decisions live in chats: they are spread over at least 17 markdown files, area chats kept rules only in their own logs (HANDOFF items 66 and 69, NEXT.md item 37), and the kart chat is still waiting on a question the owner later answered differently in Codex's work (docs/karts/PARTS-KIT.md section H). Weighted highest because every other criterion depends on it.

2. **C2. Saves usage**
   - Weight: 18
   - Why: CLAUDE.md B3 says not wasting usage is the top priority. Every message re-sends the whole conversation. The cache lasts about 1 hour, so the first message after a break re-processes everything. /compact is expensive and /clear is free. Parallel sessions use limits proportionately faster, and limits are shared with claude.ai (code.claude.com/docs/en/costs.md, prompt-caching.md, claude-code-on-the-web.md; support.claude.com article 11647753).

3. **C3. Simple for one non-expert person on a phone**
   - Weight: 15
   - Why: The owner is one person with no coding background, often on a phone and sometimes driving. Review is the human bottleneck (Willison and Osmani, from search snippets). /resume does not work in cloud or mobile, so the owner finds chats by name in the sidebar (mobile.md). The owner says named chats help them personally.

4. **C4. Avoids conflicting edits and duplicate work**
   - Weight: 13
   - Why: The repo shows real costs: 51 merge commits on main (18 on 22 Nov alone), the same things built twice (walking, avatar sockets, kart bodies), 9 commits stranded on claude/relaxed-wozniak-iznto4, and deploy.yml cancel-in-progress, so each push restarts the roughly 10-minute publish (HANDOFF item 74). A July 2026 preprint (arXiv 2607.04697, search summary only) found pull requests from different agents conflict 41.7% of the time, against 19.8% from the same agent. That matters because Claude and Codex both push to main.

5. **C5. Answer quality and focus (avoids context rot)**
   - Weight: 12
   - Why: Quality drops as context grows (Anthropic 'Effective context engineering'; Chroma Context Rot across 18 models; Cursor agent best practices). Anthropic's advice is to start fresh between unrelated tasks and after two failed corrections (best-practices.md). Compaction can lose instructions given only in chat (context-window.md).

6. **C6. Orderly, one-floor-at-a-time building**
   - Weight: 10
   - Why: The owner wants to build like a skyscraper (HOW-TO section G): a plan explained first, nothing started without 'Go' (section B), approved parts kept unchanged (D2), and checkpoints. Anthropic's long-running-agent harness works on one feature at a time. Coding has fewer truly parallel parts than research, and avatar work comes before movement.

7. **C7. Easy to resume after breaks**
   - Weight: 7
   - Why: Idle VMs pause and can be reclaimed. Reopening one restores the conversation but not uncommitted work (cloud-environments.md). A chat's checkout falls behind main within hours: this session fell 2 commits behind while the avatar chat kept pushing. Resuming should depend on repo files, not on an old chat.

8. **C8. Works with Codex**
   - Weight: 5
   - Why: Codex cannot read Claude chats or Projects memory. Only committed repo files reach both assistants. AGENTS.md and CLAUDE.md both point to the same guide. Weighted low only because every option can meet it by writing to the repo. It is still a hard requirement.

### Options

1. **1. One long chat for everything**
   - How it works: One cloud session holds planning, the avatar, movement, questions and reviews, compacting itself as it grows. Closest repo example: 'New chapter setup' (16 to 20 Nov, 158 commits), which ended by rewriting CLAUDE.md and HANDOFF.md for the next chat.
   - Best for: A very short project or a single sitting. Not a multi-week game.
   - Scores: C1 2: it feels like one place, but decisions sit in chat history that compaction summarizes, and Codex cannot see it. C2 1: every message re-sends the whole history, cold-cache returns re-process everything, and /compact on a huge chat is expensive (costs.md). C3 4: nothing to keep track of, though finding an old decision means scrolling a huge phone thread. C4 4: only one Claude writer, so no Claude-against-Claude conflicts; Codex conflicts remain. C5 1: unrelated tasks pile up and old versions of files and decisions stay in context (best-practices.md, Chroma). C6 3: naturally one thing at a time, but it drifts. C7 3: always clear where to go, but expensive after breaks and the summary may drop details. C8 2: invisible to Codex unless everything is copied into files. Weighted total 243/500 = 2.43/5.
   - Total: 2.43
   - Dangers: Rules given only in chat (such as 'apply my rule 10x') quietly disappear after compaction. Cost grows every day. Anthropic and Cursor both advise against this for unrelated tasks.

2. **2. One chat per area, kept forever (the owner's idea as asked)**
   - How it works: Chats such as 'LetsGo - Avatar', 'LetsGo - Racing' and 'LetsGo - Planning' are renamed once and reused for weeks. Closest repo example: 'Official LetsGo Project', the avatar chat running since 20 Nov with 89 commits.
   - Best for: Owners who navigate by area name. It is the right labeling idea with the wrong lifespan.
   - Scores: C1 2: knowledge splits across chats; rules recorded only in area logs, and the kart chat blocked on an already-answered question, show this happening in the repo. C2 2: each area chat becomes its own long, costly thread with cold-cache re-reads. C3 4: few stable names, easy to find on a phone, matches how the owner thinks. C4 3: area split reduces overlap, but a long-lived chat's picture of main goes stale and work gets duplicated (kart bodies built twice on 22 Nov). C5 2: context rot inside each chat. C6 3: area focus helps, but invites several areas moving at once. C7 3: easy to find by name, but the checkout is stale and early details are compacted away. C8 2: area knowledge stays in chat. Weighted total 260/500 = 2.60/5.
   - Total: 2.6
   - Dangers: The chat title suggests the chat 'owns' the area's knowledge, when that knowledge must live in the repo. No source found endorses keeping chats open indefinitely. Branch drift and stranded commits, as on relaxed-wozniak.

3. **3. Headquarters/planner chat plus area chats, all kept forever**
   - How it works: A permanent 'LetsGo - HQ' chat plans and records decisions, while permanent area chats build. The owner carries decisions between them. Related pattern: Jesse Vincent's architect and implementer sessions.
   - Best for: Keeping planning separate from building, if the chats are not kept forever.
   - Scores: C1 3: HQ gives decisions a home, but only if HQ writes them to the repo; otherwise they are trapped in yet another chat. C2 1: more long-lived chats than option 2, plus relay messages between them (cross-session messages cost usage, cross-session-messaging.md). C3 3: more chats, and the owner becomes the messenger. C4 4: HQ can order work and assign files, which prevents duplicate builds. C5 2: every chat still rots over weeks. C6 4: HQ keeps the build in order, floor by floor. C7 3: findable, but stale. C8 3: HQ plans are readable by Codex if written down. Weighted total 275/500 = 2.75/5.
   - Total: 2.75
   - Dangers: Two long-lived layers double the cost. A 'forever' HQ becomes the very chat-based source of truth this setup is meant to avoid.

4. **4. Short one-task chats that start from a handoff file and end when the task ships**
   - How it works: Each new task gets a new cloud session with a fresh clone of main, named after the task. It reads CLAUDE.md plus a short status/handoff file, does one chunk, pushes to main, updates the files, and is archived. This matches Anthropic's harness (progress file plus git), the docs ('new task, new session'; spec, then a fresh session), the Help Center, Cursor and Amp Handoff.
   - Best for: Saving usage, keeping one truth in the repo, and staying current with main while Codex also pushes.
   - Scores: C1 5: every chat must write its result to the repo before it ends, which is the strongest single-source habit (Anthropic harness). C2 5: the smallest context per message, and fresh is cheaper than reviving a big idle chat (claude-projects.md usage section). C3 3: many chats to name and archive, and a start message to paste each time; the sidebar fills unless archived, and auto-archive does not apply to cloud sessions. C4 4: a fresh clone of current main, small changes and quick merges (larger PRs conflict more, arXiv 2604.03551). C5 5: clean context every time. C6 4: one feature at a time, but without a planner the order rests on the owner. C7 4: resuming means opening a new chat that reads the status file, but today the start-up reading is heavy (core files about 15,600 words, HANDOFF alone 13,101). C8 5: everything lands in files Codex reads. Weighted total 440/500 = 4.40/5.
   - Total: 4.4
   - Dangers: Only as good as the handoff file: today's 13,101-word append-only HANDOFF.md is costly to read and has duplicate item numbers. Handoff summaries can drop the reasons behind decisions (arXiv 2607.18265, unconfirmed). Without naming discipline the sidebar becomes a list of anonymous chats.

5. **5. Hybrid: a few named area chats, retired and restarted at milestones, all feeding one source-of-truth file**
   - How it works: One chat per active area (for example 'LetsGo · Avatar'). Inside it, /clear between tasks, which works in cloud sessions and costs nothing. At each milestone (a checkpoint or approved part) it writes status and decisions to the repo, the owner archives it, and a fresh chat with the same area name continues. All decisions go to one repo file.
   - Best for: An owner who likes stable area names and wants low cost, as long as /clear and milestone restarts actually happen.
   - Scores: C1 4: one source file and a write-back step at retirement, but decisions can sit in chat between milestones. C2 4: /clear keeps it almost as cheap as option 4, but there is a risk of forgetting to /clear and drifting back into option 2. C3 5: few stable names, matches the owner's preference, easy on a phone. C4 4: one chat per area means one writer per folder, but the reused VM's checkout goes stale unless main is pulled each time. C5 4: fresh per milestone, medium-length chats. C6 5: milestone restarts line up with 'Go' gates and checkpoints, the skyscraper floors. C7 4: a known name to return to; needs a pull and a status file after VM reclaim. C8 5: same repo file for Codex. Weighted total 430/500 = 4.30/5.
   - Total: 4.3
   - Dangers: Relies on the owner remembering /clear. A milestone that drags on turns the chat into option 2. The same branch collects several chunks, which risks stranded commits. It is unconfirmed whether /clear also hides old messages in the mobile app view.

6. **6. Chats per project phase (spec, then plan, then build, then review, each fresh)**
   - How it works: For each feature, one chat interviews the owner and writes SPEC.md, a fresh chat turns it into a plan, a fresh chat builds, and a fresh chat reviews. Sources: Claude docs ('start a fresh session to build from SPEC.md'), Harper Reed (spec, prompt plan, todo), GitHub Spec Kit, InnoGames.
   - Best for: Big, well-defined features where a written spec pays for itself.
   - Scores: C1 4: specs and plans are strong written truth, but they add files to an already scattered set of 17 or more decision files. C2 3: 3 to 4 chats per feature, each re-reading the core docs (roughly 20,000 tokens, an estimate). C3 2: the owner must track which phase each feature is in across several chats. C4 4: a single builder per feature. C5 5: very clean contexts. C6 5: highly orderly. C7 3: must know which phase you are in. C8 4: specs are readable by Codex. Weighted total 367/500 = 3.67/5.
   - Total: 3.67
   - Dangers: Too much ceremony for small chunks. The owner's HOW-TO section A loop (research, compare, choose, explain, do, record) already runs inside one chat, so splitting it into phases mostly adds chats to manage.

7. **7. Claude Code Projects (public beta): one coordinator plus parallel threads**
   - How it works: One project coordinator chat starts a cloud thread per task. Threads share project instructions (up to 16,000 characters) and project memory, and an Overview pane shows what is done or needs you (code.claude.com/docs/en/claude-projects.md).
   - Best for: Multi-week work with several tasks in flight, if it is available on the account and usage allows.
   - Scores: C1 3: project memory is a second memory, separate from the repo, that Codex cannot see. C2 2: Anthropic says it uses the plan faster (coordinator plus a full session per thread). C3 3: the Overview pane suits a phone, but it needs the Claude GitHub App installed and its availability is unconfirmed. C4 3: separate branches, but the coordinator may start parallel threads that touch the same files, and threads ignore .claude/settings.json hooks and permissions. C5 4: threads are fresh and managed automatically. C6 3: built for parallel work, which works against the step-by-step 'Go' style unless steered. C7 5: designed for resuming multi-week work. C8 2: project memory is invisible to Codex. Weighted total 303/500 = 3.03/5.
   - Total: 3.03
   - Dangers: Beta, rolling out gradually, and not checked for this account. It uses usage faster. It creates a second source of truth outside the repo. Anthropic itself says a single task that fits one session should be a normal cloud session.

8. **8. Parallel power-user fan-out (3 to 5 build chats running at once)**
   - How it works: Several build chats run at the same time on different features, each on its own branch. The Help Center calls 3 to 5 parallel sessions in git worktrees 'the biggest productivity unlock', but that advice is aimed at local terminal users.
   - Best for: Experienced developers who can review code quickly. Not this owner.
   - Scores: C1 2: decisions scatter and parallel agents make clashing unstated choices (Cognition). C2 1: usage grows proportionately (claude-code-on-the-web.md); multi-agent systems use about 15x chat tokens (Anthropic, secondary copies). C3 1: a non-expert cannot test 3 to 5 streams from a phone (Willison, Osmani). C4 1: merges, cancelled publishes and duplicate builds, exactly as the repo saw on 22 Nov. C5 4: each chat's context is focused. C6 1: the opposite of one floor at a time. C7 2: many threads to track. C8 2: more collisions with Codex on main. Weighted total 168/500 = 1.68/5.
   - Total: 1.68
   - Dangers: Every push cancels the running publish (deploy.yml cancel-in-progress), and one failing test blocks everyone. METR found people believe AI made them faster when it made them slower, so 'more chats = faster' is not a safe assumption.

9. **9. Writer plus independent reviewer chat (an add-on, not a full setup)**
   - How it works: One chat builds. A fresh chat that never watched the build reviews the result against the decisions record. The repo already does this across assistants: Codex reviews Claude's avatar work (docs/COLLABORATION.md).
   - Best for: A quality gate at milestones, layered on top of option 4 or 5.
   - Scores: Scored as if added to a setup. C1 3: neutral; it checks work against the decisions file. C2 3: one extra short chat per milestone. C3 3: one extra chat to open occasionally. C4 4: catches problems before merge. C5 5: the reviewer's context is clean, which Anthropic docs and Cognition 2026 recommend. C6 4: a quality gate on each floor. C7 3: neutral. C8 4: fits the existing Codex-reviews-Claude arrangement. Weighted total 352/500 = 3.52/5.
   - Total: 3.52
   - Dangers: Pure overhead if used on every small change. Duplicates Codex's review role if both are used for the same thing.

10. **10. Task-board chats: one chat per GitHub Issue (issue tracker as memory)**
   - How it works: Each piece of work is a GitHub Issue. A chat takes one issue, ships one change and closes it. Sources: Steve Yegge's Beads (Thoughtworks Radar 'Trial'), GitHub Copilot coding agent issue-to-PR guidance.
   - Best for: Teams already living in GitHub Issues.
   - Scores: C1 4: a clear task list, but decisions still need their own record. C2 4: short chats. C3 2: another tool for a non-expert to learn on a phone. C4 4: one issue, one owner. C5 5: fresh context. C6 4: ordered backlog. C7 4: the open issues show what is next. C8 3: whether Codex reads GitHub Issues in this setup was not researched (unconfirmed). Weighted total 377/500 = 3.77/5. Evidence for this owner's situation is thin.
   - Total: 3.77
   - Dangers: Adds a second place to look (issues plus repo docs) and a new tool to learn. Weakly supported for non-experts; the evidence comes only from search summaries.

### Recommendation
**Setup:** How the scores were computed: each option gets 1 to 5 on each criterion, multiplied by the criterion's weight (weights add up to 100), giving a weighted total out of 5. Recommended: named chunk chats plus a small HQ. This takes option 4's lifecycle (a fresh chat per chunk, ended when it ships) and option 5's naming (stable area names, which the owner likes), plus a light HQ from option 3 and the reviewer add-on from option 9 at milestones. Options 4 (4.40) and 5 (4.30) are within judgment of each other. Option 4 wins on cost, freshness against main and single truth, and option 5 wins on phone simplicity and the owner's stated preference, so the blend keeps both strengths. The single most important point, backed by every source: the repo is the memory and chats are disposable. A chat name is only a label (renaming gives a chat no context), so an 'area' lives on as a name prefix plus a short status page in the repo, not as a chat kept open for weeks.

Day to day: at most one Claude build chat at a time, plus HQ when planning. Codex works in its own area. A second Claude build chat runs only when the two touch completely separate folders and the owner has time to test both. Each build chat does one approved chunk: it pulls main, reads CLAUDE.md and its area status page, explains the plan, waits for 'Go', builds and tests, pushes to main, updates the status page and the decisions record, then says it is safe to archive.

Repo changes this setup needs. All are proposals that need the owner's 'Go', and they are inferences from the evidence, not Anthropic rules: (a) one decisions record, e.g. docs/DECISIONS.md, which does not exist today, with each entry marked accepted, proposed or superseded (O'Reilly 'coding agents love decision records'). (b) One short current-state page per area, so a fresh chat reads one page instead of the 13,101-word HANDOFF.md. (c) Turn HANDOFF.md into a short summary and move the old items to an archive. (d) Fix the conflicting rules: CLAUDE.md B10 to B13 against HOW-TO C1 and C2, three different 'read first' instructions, and COLLABORATION.md line 7 still pointing to CLAUDE.md as the guide.

Moving over from today's chats (owner choices, each to be presented as options): rename 'Official LetsGo Project' to 'LetsGo · Avatar – <current chunk>' and retire it at its next milestone (for example the 6 ft 4 in lock-in), after it writes the avatar status page. Archive 'Kart appearance review': its open question was answered later in Codex's work (GT option 05, PARTS-KIT.md section H). Decide whether 'Fix the flaky driving browser test' belongs to Codex, since driving is Codex's area. Decide whether to keep or drop the 9 commits stranded on claude/relaxed-wozniak-iznto4. Archive 'New chapter setup' and 'LetsGo 2' (LetsGo 2 may come from an older workspace; unconfirmed). This chat can become the first HQ. Try Projects (option 7) once later, only if it appears in the claude.ai/code sidebar and usage allows; it is not the main system today.

Where evidence is thin: no study compares chat-per-area against chat-per-task for non-experts. Practitioner evidence (Willison, Osmani, Vincent, Reed, Ronacher) comes from search snippets because the full pages were blocked. Projects availability on this account is unchecked. Whether /clear hides old messages in the mobile app is unconfirmed. Codex's own chat and naming features were not researched. The roughly 20,000-token start-up reading figure is an estimate.

#### Chat list

1. **LetsGo · HQ**
   - Purpose: Planning, comparing options, setup questions and questions that span areas (like this one). It turns the owner's decisions into the decisions record and the shared guide. It is the only chat allowed to edit global rule files (HOW-TO-WORK-WITH-ME.md, CLAUDE.md, COLLABORATION.md, DECISIONS). It never writes game code. It writes each chunk plan into the area status page so a fresh build chat can start from it (Anthropic: spec, then a fresh session to build).
   - Lifespan: One open at a time. /clear between unrelated questions (free). Replaced by a fresh 'LetsGo · HQ' at each milestone or about weekly, after confirming everything it decided is pushed to the repo.

2. **LetsGo · Avatar – <chunk> (e.g. 'LetsGo · Avatar – 6ft4 lock-in')**
   - Purpose: Builds one approved avatar chunk in Claude's area. Reads CLAUDE.md plus the avatar status page, pulls main, gives the plan, waits for 'Go', builds and tests, pushes to main, updates the status page and decisions.
   - Lifespan: One chunk, usually hours to about 2 days. Archived once merged to main and the status page is updated. The next chunk is a new chat with the same 'Avatar' prefix.

3. **LetsGo · Movement – <chunk>**
   - Purpose: motion-core work, which is Claude's area. Opened only after the avatar milestone it depends on is done, because the work is sequential and parallel areas wait on each other or redo work.
   - Lifespan: Same as the Avatar chats: one chunk, then archived.

4. **LetsGo · Review – <chunk>**
   - Purpose: Optional fresh reviewer at a milestone when Codex is not reviewing. It checks the change against the decisions record and the approved parts (D2) without having watched it being built (best-practices.md).
   - Lifespan: Minutes to an hour. Archived once its findings are recorded in the repo.

5. **LetsGo · Quick – <question>**
   - Purpose: One-off questions or tiny fixes, so they do not bloat a build chat or HQ.
   - Lifespan: Same day, then archived. If it turns into real work, the result moves to HQ or a build chat via the repo.

6. **(Codex side) LetsGo · Racing / Driving / Karts – <chunk>**
   - Purpose: Codex owns racing and driving. Same naming, same repo status pages and decisions record, so both assistants read one truth. Claude chats do not work in these areas without first saying why (CLAUDE.md section C).
   - Lifespan: Same one-chunk lifespan. Codex's own session features were not researched (unconfirmed).

#### Rules that make it work
1. 1. The repo is the memory and chats are disposable. A decision counts only once it is written to the decisions record and pushed. Chats share no memory, Codex cannot read Claude chats, and compaction can drop chat-only instructions (memory.md, context-window.md).
2. 2. Naming: 'LetsGo · <Area> – <chunk>'. Rename with /rename <name> in a cloud session or by tapping the title (sessions.md, claude-code-on-the-web.md). The name is a label for finding the chat, not a store of knowledge.
3. 3. One area, one owner, one active chat. Never two chats, or Claude and Codex, editing the same folder at once. Check the ownership table in docs/COLLABORATION.md first.
4. 4. Start ritual (the owner pastes one message): 'Read CLAUDE.md and the <Area> status page, pull latest main, then explain the plan for <chunk> and wait for Go.' This could later become a skill that loads only when needed (best-practices.md 'Put team procedures in skills').
5. 5. End ritual before archiving: commit and push, update the area status page and the decisions record with the reason for each decision, confirm nothing is left only on the chat's branch, then the owner archives the chat. This prevents relaxed-wozniak-style stranded work and the kart chat's stale 'blocked' state.
6. 6. Retire the chat and start fresh when any of these happens: the chunk has shipped; the topic changes; two corrections have failed (Anthropic: start over with a better prompt instead of a third correction); the owner returns after more than about an hour and the next step is new work (the cache has expired, so a fresh chat is cheaper than reviving a big one); the chat has auto-compacted (an inference: past that point early details are summarized).
7. 7. Inside a chat, use /clear for an unrelated side question (free). Avoid /compact on a big idle chat, which is itself a large request.
8. 8. Rules the owner gives in any chat are recorded by HQ in HOW-TO-WORK-WITH-ME.md. Area chats may propose rule changes but never edit the global guide themselves (the repo shows the kart chat editing it and area-only rules being lost).
9. 9. Pull main before starting and again before pushing. Push one chat at a time where possible, because every push to main restarts the roughly 10-minute Pages publish and cancels the run in progress (deploy.yml cancel-in-progress, HANDOFF item 74).
10. 10. The number-one rule (HOW-TO section A) is strengthened by turning it into a concrete checklist each chat follows (research, compare, choose with evidence, explain simply, do, test, record), not by louder wording. Anthropic says IMPORTANT or ALL CAPS can cause over-application and does not fix ignored lines (best-practices.md 'What you can stop doing').
11. 11. Give choices stable names in the decisions record (e.g. 'GT option 05, GT3 R-inspired'), so a choice quoted in one chat means the same in every chat and in Codex. The repo has 'style 3' against 'option 05' for the same GT choice.
12. 12. Keep CLAUDE.md short (under about 200 lines, today 89) and free of duplicated rules. Point to HOW-TO and the decisions record rather than copying them (memory.md; ETH Zurich arXiv 2602.11988 on bloated context files).

#### What not to do
1. Do not keep area chats open for weeks as the 'memory' of an area. Renaming does not carry context, and long chats rot and cost more on every message.
2. Do not state a decision only in a chat. Other chats, future chats and Codex will never see it.
3. Do not run more than two Claude build chats at once, and never two writers (Claude or Codex) on the same files. It multiplies usage, causes merge conflicts and cancelled publishes, and goes beyond what one person can test from a phone.
4. Do not let area chats rewrite global rules or the shared guide. Route rule changes through HQ.
5. Do not revive a big old idle chat for new work. Start a fresh one from the status page.
6. Do not rely on /compact as routine housekeeping. Retire the chat and start fresh instead.
7. Do not leave work on a chat branch. Merge it to main or record that it was dropped before archiving.
8. Do not leave a chat 'blocked' on a question after it has been answered elsewhere. Record the answer in the repo and archive the chat.
9. Do not make Projects (beta) or project memory the main source of truth. Codex cannot see it, it uses usage faster, and its availability on this account is unconfirmed.
10. Do not strengthen rules with ALL CAPS or 'IMPORTANT', or keep growing CLAUDE.md. Use concrete checklists, and use a hook only for rules with no exceptions.
11. Do not make these repo changes (decisions record, status pages, HANDOFF trim) without the owner's 'Go'. They are proposals.

#### Evidence basis
1. https://code.claude.com/docs/en/cloud-environments.md: each session is a fresh VM with a fresh clone; idle VMs pause and can be reclaimed; the repo CLAUDE.md carries over, the user's ~/.claude/CLAUDE.md does not
2. https://code.claude.com/docs/en/web-quickstart.md: each task gets its own session and branch
3. https://code.claude.com/docs/en/claude-code-on-the-web.md: /clear, /compact, /context and /rename work in cloud sessions; parallel tasks use limits proportionately; archiving; auto-compact override (92 observed in this session)
4. https://code.claude.com/docs/en/mobile.md: /resume and /plugin are unavailable in cloud sessions and the mobile app
5. https://code.claude.com/docs/en/memory.md: each session starts with a fresh context window; auto memory is not shared across cloud environments; keep CLAUDE.md under 200 lines
6. https://code.claude.com/docs/en/best-practices.md: /clear between tasks; start over after two failed corrections; spec then a fresh session; a fresh reviewer session; skills for procedures; drop IMPORTANT and ALL CAPS
7. https://code.claude.com/docs/en/costs.md and https://code.claude.com/docs/en/prompt-caching.md: long sessions re-send the whole history; the cache lasts about 1 hour on subscriptions; /clear is free and /compact is expensive
8. https://code.claude.com/docs/en/context-window.md: what survives compaction (CLAUDE.md is re-read; chat is summarized)
9. https://code.claude.com/docs/en/sessions.md: name your sessions
10. https://code.claude.com/docs/en/claude-projects.md: Projects is a public beta; uses the plan faster; needs the GitHub App; a fresh thread can cost less than reviving an old one; a single task should be a normal session
11. https://code.claude.com/docs/en/cross-session-messaging.md: messages carry no history and count toward usage
12. https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work: shared 5-hour and weekly limits; start a new conversation in long chats
13. https://support.claude.com/en/articles/14554000-claude-code-power-user-: 3 to 5 parallel sessions, aimed at local terminal users
14. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents: progress file plus git, one feature at a time
15. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents: context rot and note-taking outside the context window
16. https://www.anthropic.com/engineering/multi-agent-research-system: about 15x tokens; coding is less parallelizable (seen via secondary copies)
17. https://research.trychroma.com/context-rot (search snippet)
18. https://cursor.com/blog/agent-best-practices (search snippet)
19. https://cognition.ai/blog/dont-build-multi-agents and https://cognition.com/blog/multi-agents-working (search snippets)
20. https://simonwillison.net/2025/Oct/5/parallel-coding-agents/ and https://addyosmani.com/blog/cognitive-parallel-agents/: review is the bottleneck (search snippets; pages not fetched)
21. https://blog.fsck.com/2025/10/05/how-im-using-coding-agents-in-september-2025 (architect and implementer) and https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/ (spec, plan, execute) (search summaries)
22. https://www.oreilly.com/radar/coding-agents-love-decision-records/: status-marked decision records (search summary)
23. https://arxiv.org/abs/2607.04697: cross-agent PR conflicts 41.7% against 19.8% (preprint, search summary)
24. https://arxiv.org/abs/2602.11988: LLM-written context files reduce success (search summary)
25. https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/: perceived against actual speedup
26. /home/user/3D-World-4/docs/HOW-TO-WORK-WITH-ME.md: section A (number-one rule), B ('Go'), D2, E (record decisions), G (build like a house)
27. /home/user/3D-World-4/CLAUDE.md: section B rules 10 to 13 conflict with HOW-TO section C; section C ownership (Claude: motion-core and Skeleton; Codex: racing and driving)
28. /home/user/3D-World-4/docs/HANDOFF.md: 185 lines, 13,101 words; header 'Written 20 November' and 'Read CLAUDE.md first'; duplicate item numbers 36 to 43; item 74 on cancelled publishes
29. /home/user/3D-World-4/docs/COLLABORATION.md line 7: still points to ../CLAUDE.md as the guide
30. /home/user/3D-World-4/.github/workflows/deploy.yml lines 15 to 17: concurrency with cancel-in-progress: true
31. /home/user/3D-World-4/docs/karts/PARTS-KIT.md section H: GT option 05 recorded after the kart chat asked about 'GT 3'
32. git: main..claude/relaxed-wozniak-iznto4 = 9 commits not on main; docs/DECISIONS.md does not exist; 51 'Merge origin/main' commits on main; session trailers show chats 'New chapter setup' (158 commits), 'Official LetsGo Project' (89), 'Kart appearance review' (29)

## Skeptic challenge
**Holds up:** True

### Problems

1. **The plan contradicts itself about who writes decisions. The LetsGo HQ chat is called 'the only chat allowed to edit' DECISIONS, but every build chat's purpose and end ritual (rule 5) also says to 'update the area status page and the decisions record'.**
   - Evidence: recommendation.chat_list[0].purpose ('only chat allowed to edit global rule files (... DECISIONS)'); chat_list[1].purpose ('updates the status page and decisions'); rules_that_make_it_work #5.
   - Fix: Each chat writes the owner's decisions into its own area section, in the same push as the work it decided. Working-style rule changes go into HOW-TO only, in wording the owner has approved. The planning chat checks that records agree but does not act as a gatekeeper, so the owner never has to relay decisions between chats.

2. **A single new shared docs/DECISIONS.md, appended to by every Claude chat and by Codex, would just become the next HANDOFF.md hotspot. Without a migration step it would also become the 18th place where decisions live.**
   - Evidence: HANDOFF.md was edited in 93 of 378 non-merge commits on main. Item numbers 36-43 appear twice, and there is a commit titled 'Handoff: renumber kart items after merge'. Decisions already sit in at least 17 .md files. 'LetsGo 2' mentioned a docs/DECISIONS.md that never existed in this repo (`git log --all -- docs/DECISIONS.md` is empty).
   - Fix: Give each area its own fixed section, edited in place rather than appended to the end. Identify decisions by date instead of running numbers, and mark each one accepted or replaced. Mark the old files (HANDOFF log, NEXT.md, decision lists in PLAN files) as history that points to the new place. Update AGENTS.md and CLAUDE.md so Codex reads the same record.

3. **The order is wrong. Many short fresh chats will be costly today, because CLAUDE.md tells every new session to read the 13,101-word HANDOFF.md first. That is roughly 20k tokens with the other core files, an estimate.**
   - Evidence: /home/user/3D-World-4/CLAUDE.md line 16: 'A new session should also read `docs/HANDOFF.md` first.' `wc -w docs/HANDOFF.md` gives 13101.
   - Fix: Make the first chunk the cleanup: shorten HANDOFF into short per-area status sections and fix the conflicting 'read first' and reply-format rules. Switch to one chat per job only after that.

4. **It is too complex for a non-expert on a phone. It has six chat types (HQ, Avatar, Movement, Review, Quick, Codex), 12 rules, 11 don'ts, a start message to paste every time, and names with special characters ('·', '–'). It also hands the owner the job of judging retirement triggers (cache over an hour, auto-compaction).**
   - Evidence: recommendation.chat_list and rules_that_make_it_work. HOW-TO C6 asks for one instruction at a time. CLAUDE.md B13 says the owner often reads while driving.
   - Fix: Use two kinds of Claude chat: one planning chat and one build chat per job. Drop the Quick chats (side questions go to the planning chat). Drop the default Review chat, since COLLABORATION.md already has Codex reviewing Claude's movement and avatar work. Use plain names such as 'LetsGo Avatar: 6ft4 lock-in'. Claude, not the owner, decides when a chat should restart and says so.

5. **It gives the owner chores that Claude can do: renaming, pasting a start message, archiving. Archiving is documented only through the sidebar ⋯ menu (browser or desktop), and archiving from the mobile app is not documented.**
   - Evidence: claude-code-on-the-web.md: '/rename' takes the name as an argument in cloud sessions. 'Archive sessions' describes hovering in the sidebar and opening the ⋯ menu. This session's own toolset includes set_session_title, archive_session and list_sessions (observed here; whether every session has them is unconfirmed).
   - Fix: Put a short start and finish routine in CLAUDE.md, which every session loads automatically, once the owner says Go. At the start, Claude checks it is on the latest main, names its own session (set_session_title, or /rename as a fallback), reads the area status, gives the plan and waits for Go. At the finish, Claude pushes code and records together, confirms nothing is left only on its branch, and archives the chat or says it is safe to archive once the owner says yes.

6. **Docs-only pushes restart the publish. The plan adds separate doc pushes from HQ and an end-of-chat record push, and each one cancels the publish that is running and restarts the roughly 10-minute run. That delays the owner's phone testing.**
   - Evidence: .github/workflows/deploy.yml runs on every push to main with no paths filter, and has 'concurrency: ... cancel-in-progress: true'. docs/HANDOFF.md item 74 describes a cancelled publish.
   - Fix: Send record updates in the same push as the code. Batch planning-chat doc edits. Optionally propose to Codex, who is the recommended deployment coordinator (not confirmed), a paths-ignore rule for Markdown-only pushes, with the owner's Go.

7. **The limit on parallel chats is stated two ways: 'at most one Claude build chat at a time' and 'Do not run more than two Claude build chats at once'.**
   - Evidence: recommendation.setup ('Day to day') versus what_not_to_do #3.
   - Fix: State one number: one Claude build chat at a time, plus the planning chat. Codex works in parallel only in its own area.

8. **Using /clear inside a reused area chat (option 5) keeps the same VM and the same claude/* branch. Several jobs then pile onto one branch, which is how commits get stranded, and the checkout goes stale. /resume does not work in cloud sessions, and nobody has confirmed whether the old conversation can still be read after /clear in cloud or mobile. That matters for a visual learner who rereads explanations.**
   - Evidence: commands.md: /clear 'Start a new conversation with empty context... Resume the previous conversation with /resume'. claude-code-on-the-web.md: /resume is not available and /clear 'Starts a fresh conversation ... in the same cloud session'. 9 commits sit on claude/relaxed-wozniak-iznto4 and are not on origin/main.
   - Fix: End each job by opening a new chat. Use /clear only for unrelated side questions in the planning chat.

9. **The weighting understates simplicity and the blend was never scored. Option 4's low simplicity score (3) comes from rituals that can be automated, and once they are, option 4 alone wins clearly without the HQ or Review add-ons. Projects is also undervalued: the docs list 'an area you keep feeding' and 'a goal that outlasts one session and keeps producing tasks' as good fits, and the Overview pane suits a visual learner.**
   - Evidence: comparison.options[3] C3 note; recommendation.setup blends options 3, 4, 5 and 9 without scoring the blend. code.claude.com/docs/en/claude-projects.md 'When to use a project'.
   - Fix: Recommend option 4 with area-prefixed names and the routine automated. Present Projects as an optional one-week trial of the planning role if it appears in the sidebar, with 'one thread at a time' (the docs say this is a preference, not a cap) and 'decisions go to repo files'. Warn that it uses the plan faster.

10. **The 41.7% figure on conflicts between agents is presented as general support, but it covers only pull-request pairs that were open at the same time, and cross-agent pairs were a tiny subset. This repo uses no pull requests.**
   - Evidence: arxiv.org/abs/2607.04697, from search results only: cross-agent pairs were 0.5% of co-active pairs, in about 4.3% of 2,807 repos. A search for 'pull request' across this repo's commits finds 0 PRs.
   - Fix: Lead with the repo's own evidence: 51 merge commits on origin/main, the same things built twice, cancelled publishes, and a chat left waiting on a question that had already been answered. Cite the preprint as weak supporting evidence only.

11. **Calling the owner 'phone-first, cloud-only' is overstated. Most LetsGo chats were started from the desktop app, which has click-to-rename and archive.**
   - Evidence: list_sessions origins: 'LetsGo game architecture review', 'Fix the flaky driving browser test', 'Official LetsGo Project' and 'LetsGo 2' are desktop_app. 'Kart appearance review' and 'New chapter setup' are ios.
   - Fix: Design the setup so it works on both, and say which steps are easier on the desktop app.

12. **There is an unresolved conflict over the number-one rule, and a risk that '10x' gets written down as a permanent louder rule. HOW-TO section A wins over CLAUDE.md B3 ('top priority is not wasting usage'), and heavy research on every step multiplies usage. Anthropic says emphasis causes rules to be over-applied.**
   - Evidence: CLAUDE.md first paragraph (HOW-TO wins); CLAUDE.md B3; HOW-TO A; best-practices.md 'What you can stop doing' (IMPORTANT/ALL CAPS 'mostly makes Claude over-apply the rule').
   - Fix: Apply the rule as a concrete checklist, with research depth matched to the risk ('as many options as the topic really has'). Ask the owner whether '10x' was meant for this answer or as a standing rule, and do not add louder wording to the guide.

13. **The migration steps arrive as one batch of five decisions. That breaks HOW-TO C6 (one instruction at a time) and is hard to handle while driving.**
   - Evidence: recommendation.setup 'Moving over from today's chats'; HOW-TO C6.
   - Fix: Present one step at a time, each with a short description of every choice. Let Claude do the session housekeeping (renaming, archiving) after a yes.

14. **A chat started from the phone can begin on the wrong branch, because the mobile flow asks for a repository and a branch. If the owner picks an old claude/* branch, the chat starts stale.**
   - Evidence: code.claude.com/docs/en/mobile.md: 'select a repository and branch, describe the task'.
   - Fix: Tell the owner to always pick main, and have the start routine check that the checkout is the latest main and say so.

### Factual errors
1. The research says '/compact is itself a large request' and the plan says 'Do not rely on /compact as routine housekeeping'. Both overstate the cost. prompt-caching.md says that with a warm cache a mid-session /compact 'costs a fraction of what the context size suggests', and it is expensive mainly after a break longer than the cache lifetime. The same page recommends running /compact at natural breaks between tasks.
2. The repo research summary says 72% of HANDOFF.md is avatar history, but its own fact gives 11,226 of 13,101 words, which is about 86%.
3. The official research lists claude/nice-cannon-50ao74 among origin's branches. `git ls-remote --heads origin` lists only brave-hamilton-l04w49, lucid-pascal-xqtrwb and relaxed-wozniak-iznto4. nice-cannon exists only as a local or stale tracking ref.
4. 'Textual conflicts between pull requests from DIFFERENT agents 41.7% of the time' is misleading framing. The figure covers concurrently open PR pairs in the same repo, and cross-agent pairs were only 0.5% of those pairs (arXiv 2607.04697, from search results).
5. 'Phone-first, cloud-only owner' is not accurate. Four of the six LetsGo sessions were started from the desktop app (list_sessions origin field). They are still cloud sessions.
6. 'Codex worked on a local branch called work' is unconfirmed on the 'local' part. The merge titles show a branch named 'work' but do not show whether Codex ran on the owner's machine or in Codex's cloud.
**Improved recommendation:** Short answer: yes, use several named chats, but name each one for a single job, not for an area you keep open forever. The repo is the project's memory. Chats are workbenches you put away when a job is done. Renaming a chat only changes its label and gives it no memory. Chats share nothing with each other or with Codex, and long chats cost more on every message (code.claude.com docs: memory, costs, prompt-caching).

1. Two kinds of Claude chat, at most two open at once.
(a) "LetsGo Plan": questions, comparing options, setup, and how the pieces fit together. It never builds game code. Start a fresh one for each big topic or about weekly. Side questions go here rather than into separate "Quick" chats.
(b) "LetsGo Avatar: <job>" or "LetsGo Movement: <job>": one approved chunk per chat, and only one build chat at a time. The chat ends when the chunk is pushed and recorded, and the next chunk gets a new chat with the same area prefix. A separate Claude review chat is not needed by default, because COLLABORATION.md already has Codex reviewing Claude's avatar and movement work. Codex keeps racing, driving and karts in its own area under the same naming.

2. Claude does the bookkeeping, not the owner. With the owner's Go, add a short start and finish routine to CLAUDE.md, which every session loads automatically.
- Start: check the chat is on the latest main, name its own session "LetsGo <Area>: <job>" (with its own title tool if it has one, otherwise /rename), read that area's status section, explain the plan in short steps and wait for Go.
- Finish: push the code together with the status and decision updates in one push, confirm nothing is left only on the chat's branch, then archive the chat after the owner says yes, or tell them it is safe to archive.
The owner's whole routine is: open a new chat on main, type the area and the job, say Go, and say yes to archive.

3. One record both assistants read. Each area gets one short "current state, next step, open questions, decisions" section, edited in place. Decisions carry dates instead of running numbers, are marked accepted or replaced, and are written in the same push as the work that produced them. Working-style rules live only in HOW-TO-WORK-WITH-ME.md. The old logs (the HANDOFF item list, NEXT.md, decision lists inside the PLAN files) are kept as history and point to the new place. AGENTS.md and CLAUDE.md point there too, so Codex follows the same record. The planning chat checks occasionally that records agree, but it is not a gatekeeper.

4. Do the cleanup first. Today every new chat must read the 13,101-word HANDOFF.md, so many short chats would be expensive until that is fixed. The first chunk is: shorten HANDOFF into the per-area status sections, and fix the conflicting "read this first" and reply-format rules. Switch to one chat per job only after that.

5. Moving over from today's chats. Present one step at a time, each the owner's choice, with Claude doing the housekeeping.
- Let "Official LetsGo Project" finish its current avatar job, write the avatar status section, then retire it.
- Archive "Kart appearance review": its open question was answered later (GT option 05, docs/karts/PARTS-KIT.md section H).
- Decide whether "Fix the flaky driving browser test" belongs to Codex, since driving is Codex's area.
- Decide whether to keep or drop the 9 commits stranded on claude/relaxed-wozniak-iznto4.
- Archive "New chapter setup" and "LetsGo 2".
This chat can become the first Plan chat.

6. Saving usage.
- One build chat at a time.
- A new job means a new chat. Do not revive a big chat that has sat idle for more than about an hour to start new work.
- Claude says when a chat should restart, for example after two failed corrections or after it has compacted.
- Send doc updates in the same push as code, because every push to main restarts the roughly 10-minute publish and cancels the run in progress. Optionally ask Codex, with the owner's Go, to skip publishing for Markdown-only pushes.
- Visual checks wait until the owner is not driving. Approvals need only a word like "Go".

7. Projects, optional. If "Projects" appears in the claude.ai/code sidebar, a one-week trial as the Plan chat is reasonable. The docs list "an area you keep feeding" as a good fit, and the Overview pane is visual. Run it with "one thread at a time" and "decisions go into repo files, not project memory". Warn that it uses the plan faster and that a thread limit is only a preference. It is not the main system until it has been tried.

8. The number-one rule. Strengthen it with a concrete checklist (research, compare, choose with evidence, explain simply, do, test, record), with research depth matched to the risk, not with louder wording. Ask the owner whether "10 times more" was meant for this answer or as a standing rule.

Still unconfirmed:
- Whether every session has the self-rename and archive tools that this session has.
- Whether chats can be archived from the mobile app.
- Whether old messages stay readable after /clear in cloud sessions.
- Whether Projects is visible on this account.
- Codex's own chat-naming features.
