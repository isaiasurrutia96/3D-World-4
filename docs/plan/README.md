# LetsGo plan folder

Reports, research and decisions from the "LetsGo Plan" Claude chat, 23 to 24 November 2026. Each numbered file is a short plain-English
report; the `appendix/` files hold the full research data behind it. These files gather evidence and decisions for the master plan; they do
not replace the existing records (`docs/IDEAS-INDEX.md` lists where every idea lives).

**How this was made.** Every topic followed the owner's number-one rule (`docs/HOW-TO-WORK-WITH-ME.md` section A): research proven methods,
compare them, test them on the real code where possible, then an independent skeptic tried to refute the result. About 60 research agents ran
in total. Nothing in the game code was changed.

## A. Files

1. [01-DIAGNOSTIC-REPORT.md](01-DIAGNOSTIC-REPORT.md): the deep diagnostic of the whole project (23 Nov). Appendix A1.
2. [02-CHAT-SETUP.md](02-CHAT-SETUP.md): how to organize chats (23 Nov). Appendix A2.
3. [03-GOING-PRIVATE.md](03-GOING-PRIVATE.md): GitHub Pro and a private repo, decided 24 Nov, with the steps. Appendix A3.
4. [04-MOVEMENT-PLAN.md](04-MOVEMENT-PLAN.md): the approved "body foundation first" movement plan and its double-check. Appendix A4.
5. [05-MINIATURE-ISLAND-RESEARCH.md](05-MINIATURE-ISLAND-RESEARCH.md): island, six tracks, practice stations, physics, movements, skate park,
   one world on a phone, time savers, planning method. Appendix A5.
6. [06-DECISIONS-AND-OPEN-QUESTIONS.md](06-DECISIONS-AND-OPEN-QUESTIONS.md): what the owner decided and what is still open.
7. [07-SIGN-UPS.md](07-SIGN-UPS.md): accounts and free tools that would save time (being finished).

## B. What comes next

1. A second Claude Code chat double-checks this folder (prompt below).
2. The master plan step is rerun with the owner's ideas (`docs/LETSGO-MASTER-PLAN-NOTES.md`, `docs/IDEAS-INDEX.md`, `docs/KART-DESIGN.md`).
3. The owner answers the open questions one at a time, then approves the master plan.

## C. Prompt for the reviewing chat

> Please double-check the LetsGo plan folder. Fetch the branch `claude/nice-cannon-50ao74` and read `docs/plan/README.md`, then every numbered
> file and, where you need details, its appendix. Follow `docs/HOW-TO-WORK-WITH-ME.md`. For every claim, check it against the repo and the
> cited sources and try to refute it. Look for factual errors, numbers that do not match, missed options, conflicts with confirmed owner
> decisions (CLAUDE.md section C, docs/COLLABORATION.md, docs/HANDOFF.md "Confirmed by the owner"), things too hard for one person, and better
> or faster ways to reach the same goal. Do not change game code. Write your findings to `docs/plan/REVIEW-2026-11-24.md` in the same lettered,
> numbered style (most important first, each with evidence and a suggested fix), commit it on your own branch, and give the owner a short
> summary with what they need to decide.
