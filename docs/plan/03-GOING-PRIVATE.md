# Going private: GitHub Pro (decided 24 November 2026)

Researched by the "LetsGo Plan" chat: GitHub routes, Cloudflare, nine other hosts and this repo's own publishing setup, ranked, then checked
by a skeptic. Full data: [appendix A3](appendix/A3-going-private-hosting-research.md).

**Owner decision (24 November 2026):** use GitHub Pro (about $4 a month) and make the repo private. Testing stays exactly as now: same link,
same home-screen icon, automatic publishing, no laptop or terminal.

## A. What going private does and does not do

1. Hidden from the public: code, docs, design notes, plans, tests and history.
2. Still public: the test website itself, to anyone who has or guesses the link. Login-only GitHub Pages needs Enterprise Cloud ($21 per user
   per month); Cloudflare plus Access could do it for free later, but needs real-iPhone tests first.
3. It protects everything from now on; it cannot recall copies made while public (0 forks and 0 stars so far).
4. The $4 price comes from GitHub's own docs FAQ and third-party guides; github.com/pricing does not list Pro (checked 23 November). Stop and
   check if the billing page shows a very different price.

## B. Why the publishing setup must change first

1. Private repos pay for publishing minutes. Pro includes about 3,000 Linux minutes a month ($18 of compute).
2. At the pace measured after the browser checks were added (22 to 23 November), the current setup would use about 7,000 to 9,600 minutes a
   month, more on the slower private machines.
3. The change, proposed to Codex first because Codex coordinates releases (`docs/COLLABORATION.md`) and most browser checks are racing checks:
   1. Pushes that change only notes do not publish.
   2. Publishing is opt-in: it runs when a commit is marked for publishing or on a manual run, so a forgotten marker costs nothing.
   3. A normal publish runs the unit tests, the build and the deploy (about 15 to 20 minute limit).
   4. The full browser checks, including the one Safari-engine (WebKit) check, run when racing or shared files change, nightly and on demand.
   5. A "do not list in search engines" tag goes on the live pages (frozen checkpoints untouched).
   6. The commit convention is written into `AGENTS.md` and `CLAUDE.md` so both assistants follow it.
4. Estimated result: about 2,100 to 2,400 private minutes a month, inside Pro's allowance (unmeasured on private machines; measure the first
   two or three private runs).

## C. The owner's steps (only after the change above is live and one publish passed)

1. In Safari: GitHub, Settings, Billing and licensing, Licensing, next to "Current plan" tap Upgrade, choose Pro, monthly.
2. Check the plan now reads "GitHub Pro".
3. Billing and licensing, Budgets and alerts: if there is no Actions budget, create one for $5, tick "Stop usage when budget limit is
   reached", and turn on the usage alerts. A hard stop pauses publishing instead of billing more.
4. Repository Settings, General, Danger Zone, Change visibility, Private.
5. Repository Settings, Pages: check the site is still live from the gh-pages branch, then open the usual test link.
6. Tell the assistants. They measure the first private runs. Switching back to public is the escape hatch (Pages may need to be turned on again).

## D. Fallbacks

1. If Pro cannot be bought: GitHub Team at $4 per user (confirmed on github.com/pricing) works the same way but needs an organization, so the link changes.
2. Free route: a private repo plus a public repo holding only the built pages. $0, but a new link, a token to create, and a hard 2,000-minute limit.
3. If the test site itself must be hidden: Cloudflare Workers plus Access, about $0, after real-iPhone tests (home-screen apps keep their own login cookies, videos may need extra work, the unused 35.8 MB avatar file must be left out).

## E. Related protection steps (cheap, recommended)

1. Turn on a passkey or two-step login for the GitHub account (being checked in the sign-up research).
2. Block force-pushes and deletion on `main` (a free GitHub setting).
3. Hide the personal email in GitHub email settings, after switching commit emails to GitHub's noreply address.
4. Take the Mario-derived pages off the published site (owner decision for the copy inside frozen checkpoint test-lab-1).
5. Make the older public repos (3D-WORLD-3, Gemini-3D-WORLD) private too.
