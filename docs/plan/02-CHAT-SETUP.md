# How to organize chats for LetsGo (23 November 2026)

Researched by the "LetsGo Plan" chat: official Claude Code documentation, experienced builders' practice, and this repo's own history,
10 setups compared and scored, then a skeptic tried to refute the winner. Full data: [appendix A2](appendix/A2-chat-setup-research.md).
Status: **recommended; the owner accepted it in principle** (renamed this chat "LetsGo Plan", archived two finished chats). The routine below
is added to `CLAUDE.md` only after the owner's Go, as part of the clean-up chunk.

## A. The main idea: the repo remembers, chats do not

1. Renaming a chat only changes its label; it gives the chat no memory.
2. Chats share nothing with each other or with Codex. Only what is saved in the repo carries over.
3. Long chats cost more on every message (the whole conversation is re-sent) and their answers get worse as they grow.
4. Anthropic's own guidance: a new task gets a new chat; name chats; save plans and decisions to repo files.
5. This repo showed the cost: 9 commits stranded on a side branch, a chat left waiting on a question answered elsewhere, 51 catch-up merges.

## B. The setup: two kinds of Claude chat

1. **LetsGo Plan**: questions, comparisons, planning, setup, decisions. It never builds game code. A fresh one per big topic or about weekly.
2. **LetsGo Avatar: [job]** or **LetsGo Movement: [job]**: one approved job per chat, archived when the job is saved and recorded. The next job
   starts a new chat with the same first words.
3. At most one Claude build chat at a time, plus the Plan chat. Codex keeps racing and driving in its own area and can use the same naming.
4. No separate review chat by default: Codex already reviews Claude's avatar work (`docs/COLLABORATION.md`).

## C. Claude does the bookkeeping, not the owner

1. Start: the chat checks it has the newest `main`, names itself, reads its area's status page, explains its plan and waits for "Go".
2. Finish: it saves code and decisions in the same push, confirms nothing is left only on its branch, then asks to be archived.
3. The owner's whole routine: open a new chat on **main**, say the area and the job, say Go, say yes to archive.

## D. Scores (out of 5, weighted for one person on a phone)

1. One chat per job, starting from saved notes: 4.4 (winner).
2. Area chats restarted at milestones: 4.3 (its naming idea was kept).
3. One chat per GitHub issue: 3.8.
4. Separate spec, plan, build and review chats: 3.7.
5. Claude Projects (beta): 3.0, worth a trial later if it appears.
6. A planner chat plus area chats kept forever: 2.75.
7. One chat per area kept forever: 2.6.
8. One long chat for everything: 2.4.
9. Many build chats at once: 1.7.

## E. What must happen first

1. Every new chat is told to read `docs/HANDOFF.md` (over 13,000 words). A one-screen status page per area must replace it as required
   reading before many short chats make sense. This is part of the clean-up chunk.
2. The three different "read this first" instructions (`CLAUDE.md`, `docs/HANDOFF.md`, `AGENTS.md`) must agree.

## F. Unconfirmed

1. Whether chats can be archived from the phone app.
2. Whether old messages stay readable after `/clear` in cloud sessions.
3. Whether Claude Projects is available on this account.
