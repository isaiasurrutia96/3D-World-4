# Appendix A3: Going private, hosting research
Raw research data, generated on 24 November 2026 from the multi-agent runs. Every finding here passed an independent skeptic unless marked otherwise. Paths marked "(scratch folder, not saved)" were temporary test files that no longer exist. Plain-English summaries and decisions live in the numbered files one folder up; this appendix is for checking details.

## Research: github
**Summary:** Short answer: making the repo private does not require a terminal. With either GitHub-only route below, the owner keeps testing by opening a link on the iPhone, and the assistants keep pushing as they do now. There are two GitHub-only ways to do this. (1) GitHub Pro, about $4 a month, keeps the same link isaiasurrutia96.github.io/3D-World-4/. (2) Stay on Free: keep the source repo private and publish only the built site to a second, public repo. In both cases the test site itself stays public. GitHub's docs say login-only Pages needs Enterprise Cloud: an organization at $21 per user per month, with a new random *.pages.github.io address. Codespaces can show a login-only preview for $0 within its quota, but the owner has to start it by hand each time, so it is not a good daily testing path.

The biggest finding is about Actions minutes, not the plan price. Since the browser gate was added (22 Nov 05:10 UTC), runs take about 9–11 min each on today's free public runners. Busy days used about 230–320 billed-equivalent minutes. Private repos get slower runners: 2 CPUs and 8 GB, against 4 CPUs and 16 GB for public repos. So the current workflow would use roughly 4,000 to over 10,000 minutes a month if private. That is well above Free ($12 of included compute, which buys 2,000 Linux minutes) and Pro ($18, 3,000 minutes). Extra minutes cost $0.006 each. With no card on file, Actions simply stop, which means publishing stops, part-way through the month. Staying free therefore needs workflow changes: skip docs-only pushes, publish only when something is ready to test, and run the heavy racing browser suites only when racing files change, or nightly or on demand. With roughly 5–8 publishes a day, the estimate drops to about 1,100–2,200 minutes a month.

The cheapest route with little risk is Option 2 plus these trims, at $0 a month. The simplest is Pro with the same trims. GitHub no longer lists Pro on github.com/pricing; the $4 price comes from an official but 2020-era docs FAQ.

Checked 23 Nov 2026, about 22:00 UTC. docs.github.com, github.blog and playwright.dev were blocked in this session, so I read GitHub's docs source on raw.githubusercontent.com/github/docs (main) and Playwright's docs source on raw.githubusercontent.com/microsoft/playwright, and opened github.com pages directly. Run timings come from the repo's own Actions API (read-only). Workflow file: /home/user/3D-World-4/.github/workflows/deploy.yml.

### Options

1. **1. GitHub Pro + private repo (same link, site stays public)**
   - How it works: The owner upgrades the personal account to Pro and switches 3D-World-4 to private. Pro allows Pages from private repos, so the workflow (peaceiris pushing to gh-pages with GITHUB_TOKEN) and the link isaiasurrutia96.github.io/3D-World-4/ stay as they are. The source, docs and history become private. The built site stays public: on Pro, Pages sites are public even when the repo is private. The phone workflow does not change.
   - Cost: Pro is $4 a month (official GitHub docs FAQ about the 2020 price cut; still in the docs source on 23 Nov 2026). github.com/pricing no longer lists Pro, and the pricing calculator shows a Pro section with no price, so treat $4 as likely, not confirmed on the current pricing page. A community post says $48 a year (unconfirmed). Pro includes $18 a month of Actions compute, about 3,000 minutes on Linux 2-core at $0.006 a minute; extra is $0.006 a minute. It includes 1 GB of Actions artifact storage (pooled with Packages; overage $0.25 per GB-month) and 10 GB of cache per repo. At today's pace with today's workflow (est. 4,000–10,000+ min a month on the slower private runners), Actions overage would be about $6–$42+ a month on top of the $4. With the trims in option 3: likely $4 a month total.
   - Site private possible: No. The docs say publishing a Pages site privately needs an organization on GitHub Enterprise Cloud. On Pro the site is public to anyone with the URL.
   - Limits: Pages (docs): published site at most 1 GB (ours is about 160 MB); deployments time out after 10 minutes; soft bandwidth 100 GB a month; soft 10 builds an hour for branch builds (measured peak: 9 an hour, no custom-workflow exemption today). Git blocks files over 100 MiB and warns over 50 MiB, so the 35.8 MB file is fine. Repos are recommended to stay under 1 GB (API size today about 167 MB). Terms: Pages may not be used to run an online business, e-commerce or commercial SaaS. A free test build is fine; a paid game later may not be. Private-repo runners have 2 CPUs and 8 GB, against 4 CPUs and 16 GB for public repos, so runs will likely be slower. The slowdown has not been measured.
   - Setup effort: Owner, about 5 minutes in a phone browser: (1) github.com/settings/billing, upgrade to Pro, add a card. (2) Repo Settings > General > Danger zone > Change visibility > Private. (3) Settings > Pages: confirm the site is still live. (4) Recommended: set an Actions budget or alert under Billing > Budgets to cap overage. Assistants: no deploy change needed. Trim the workflow (option 3) before or right after the switch. Confirm the Claude GitHub App and the Codex connector can still reach the now-private repo.
   - Fits this repo: Yes, unchanged: a 160 MB site and a 35.8 MB file are within the limits. Storage risk: each Pages deploy uploads a 'github-pages' artifact. Right now there are 20 unexpired ones, about 137 MB each and about 2.65 GB in total, each kept for 1 day. If these count toward private-repo artifact storage (1 GB on Pro), the overage is about $0.25 per GB-month, so well under $1–2 a month at this level. Without a card, uploads might fail with 'Artifact storage quota has been hit'. Whether Pages artifacts count is NOT confirmed. The docs only list Pages under free runner compute. Fewer publishes means fewer stored artifacts.
   - Risks: Minute overage is the real cost driver. Without a card, publishing stops once $12 or $18 of compute is used. Not confirmed: whether the separate 'pages build and deployment' runs (measured about 1 billed minute each, about 300 in 8 days) would count; the docs say standard runners are free 'For GitHub Pages', so probably not. The game is still visible to anyone who has or guesses the URL. Anything that was public before may already have been copied (API today: 0 forks, 0 stars). GitHub could change the Pro price or allowances.
   - Sources: https://raw.githubusercontent.com/github/docs/main/content/get-started/learning-about-github/githubs-plans.md (rendered: https://docs.github.com/en/get-started/learning-about-github/githubs-plans); https://raw.githubusercontent.com/github/docs/main/data/reusables/gated-features/pages.md; https://raw.githubusercontent.com/github/docs/main/content/get-started/learning-about-github/faq-about-changes-to-githubs-plans.md; https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/actions-included-quotas.md; https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/actions-standard-runner-prices.md; https://raw.githubusercontent.com/github/docs/main/content/billing/concepts/product-billing/github-actions.md; https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/github-pages-limits.md; https://raw.githubusercontent.com/github/docs/main/data/reusables/actions/supported-github-runners.md; https://github.com/pricing; https://github.com/pricing/calculator; https://github.com/orgs/community/discussions/151560 (all checked 23 Nov 2026)

2. **2. Free plan: private source repo, built site pushed to a second PUBLIC repo**
   - How it works: The source repo goes private on Free (its own Pages site is unpublished automatically). The private repo's workflow still tests and builds, then peaceiris/actions-gh-pages pushes only dist/ to a public repo using external_repository plus a token (personal_token) or SSH deploy key stored as a secret. GITHUB_TOKEN cannot write to another repo; the peaceiris README says this, and its README describes exactly this setup for Free accounts. The public repo serves the site with Pages. Two choices: (a) a new repo such as '3D-World-4-site', giving isaiasurrutia96.github.io/3D-World-4-site/ (new link; home-screen icons must be re-added; base is './', so the build works under any path); or (b) the user-site repo 'isaiasurrutia96.github.io' with destination_dir: 3D-World-4, which should keep the exact current link (likely, not confirmed in the docs; test before going private; I could not check whether this repo exists). Avoid the trick of renaming the source repo and reusing the name '3D-World-4' for the public repo: assistant sessions bound to the old name could then push to the wrong repo.
   - Cost: $0 if private-repo Actions stay within Free's $12 a month (2,000 Linux 2-core minutes at $0.006). Pages builds and storage in the public repo are free: standard runners in public repos are 'free and unlimited'. The private repo pays for the test and build minutes exactly as in option 1, against a lower allowance (2,000 instead of 3,000). It needs option 3's trims to stay free; otherwise add a card and pay $0.006 a minute over. Private artifact storage on Free is 500 MB, but the big 'github-pages' artifacts would live in the public repo, not the private one.
   - Site private possible: No. The site lives in a public repo; anyone can open the URL and browse or download the build in the repo.
   - Limits: The same Pages limits as option 1 (1 GB site, 10-minute deploy, 100 GB a month soft bandwidth, soft 10 builds an hour for branch builds, no commercial-SaaS use). The public repo with force_orphan keeps about 160 MB in its single current commit (keep it under the recommended 1 GB). Fine-grained token: expiry 1–366 days, or none if allowed; up to 50 fine-grained tokens per user.
   - Setup effort: Owner, about 10–15 minutes in a phone browser: (1) github.com/new, create a public repo (for example 3D-World-4-site). (2) Create a fine-grained token from a prefilled link such as https://github.com/settings/personal-access-tokens/new?name=Site+deploy&contents=write&expires_in=none (the docs support prefilled links); choose 'Only select repositories', that public repo only, Contents: Read and write. (3) In the private repo: Settings > Secrets and variables > Actions > New secret (for example SITE_DEPLOY_TOKEN), paste the token. (4) After the assistants' first deploy, in the public repo: Settings > Pages > Deploy from branch gh-pages. (5) Check the link works, then make the source repo private. Assistants: change the publish step to personal_token plus external_repository (and destination_dir for choice b) and add the option 3 trims. I advise against the SSH deploy key route, because someone would have to generate the key pair and paste the private key, which risks it showing up in chat.
   - Fits this repo: Yes. A 160 MB, 187-file site fits. What becomes public in the build repo is everything already public on today's site, plus easy browsing and download as a repo: built HTML and JS (most lab bundles use esbuild minify:true; avatar-test, elbow-lab, skeleton-test and wrist-lab builds set no minify flag and should be checked; Vite emits no source maps by default), all GLB/model files (35.8 MB master, 20 MB, 5 MB), PWA manifests and icons, and the checkpoint folders copied verbatim, including their README.md and CHECKPOINT.json files (for example the driving-1 README lists speeds and handling). These stay private: docs/, TypeScript source, tests, CLAUDE.md and AGENTS.md, and the source commit history.
   - Risks: The token can expire or be revoked, which silently breaks publishing; choose no expiry or a calendar reminder. If the token leaks, the damage is limited to write access on the public build repo, provided it is scoped to that repo alone. The game itself stays public and discoverable as a public repo, so the idea is only partly protected (the same is true of option 1). Choice (b) depends on the user site serving /3D-World-4/ once the project site is unpublished; this is likely but unverified. Two assistants pushing to one site repo is fine because CI does the publishing, not the assistants.
   - Sources: https://raw.githubusercontent.com/peaceiris/actions-gh-pages/main/README.md (sections 'Deploy to external repository' and 'Create SSH Deploy Key'); https://raw.githubusercontent.com/github/docs/main/content/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility.md; https://raw.githubusercontent.com/github/docs/main/content/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens.md; https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/what-is-github-pages.md; https://raw.githubusercontent.com/github/docs/main/data/reusables/actions/supported-github-runners.md; /home/user/3D-World-4/vite.config.ts and /home/user/3D-World-4/scripts/build-checkpoints.mjs (checked 23 Nov 2026)

3. **3. Cut Actions minutes (needed with option 1 or 2 to stay within the included compute)**
   - How it works: Measured step times on 23 Nov runs (public, 4-CPU): setup, checkout and npm ci about 10–20 s; unit tests about 75–110 s (racing-core 69–99 s); build 107–145 s; Playwright install 33–44 s (one run took 720 s); browser checks 270–346 s; publish about 10 s; about 9–11 min in total. Pushes: 353 push runs from 16 to 23 Nov (about 44 a day, peak 82 a day and 18 in one hour); 112 of 421 commits touched only docs or .md files. Cuts, from largest to smallest effect: (a) Publish only when something is ready to test: the assistants put a marker in the final commit message, or trigger workflow_dispatch; intermediate commits use [skip ci], which GitHub honours for push events. (b) Add paths-ignore for docs/** and **/*.md (about 27% of commits). (c) Split the work: on each publish run only the unit tests, build and deploy (measured about 4–4.5 min); run the roughly 5-minute browser gate only when racing-lab/, racing-core/, kart-parts/, karts/, src/, test-lab/, motion-lab/src/, scripts/, package* or the workflow changed (about 58% of non-docs commits), or nightly or on demand. (d) Install only Chromium on normal runs and keep the WebKit suite for nightly or on-demand runs (WebKit's apt dependencies are heavy). (e) Lower timeout-minutes from 35 to about 20 so a hung run cannot burn 35 minutes. (f) Keep cancel-in-progress, but note that cancelled runs still bill the minutes they used, rounded up per job. Caching Playwright browsers helps little: Playwright's own docs advise against it, because restoring takes about as long as downloading and the Linux OS packages cannot be cached. The official image mcr.microsoft.com/playwright:v1.65.1-noble skips the apt step (image pull time not measured). Further options: run the browser checks for free in the public site repo (option 2) by sending dist plus the test harness there (this exposes the test scripts and two racing-core TS imports); or have the assistants build and test in their own sandboxes and push dist straight to the public repo, which costs about 0 private minutes but removes the CI gate and risks a stale build overwriting a newer one.
   - Cost: Estimates, monthly minutes ≈ publishes per day × billed minutes per publish × 30. On private 2-CPU runners, assume 1–2× today's times (not measured). Today's workflow at today's pace: about 7,000–9,600 a month if every day were like 22–23 Nov on 4-CPU, and more on 2-CPU; the 8-day average implies about 4,100. With docs skipped but the full gate on every push: about 9,600–14,400. With about 8 publishes a day and the full gate: about 2,400–3,600, around Pro's limit. With about 8 publishes a day running unit tests, build and deploy (5–7 min), plus one nightly full browser run (12–18 min): about 1,560–2,220, borderline for Free and inside Pro. With about 5 publishes a day light plus a nightly full run: about 1,110–1,590, inside Free's 2,000. With browser checks moved to the public repo, or builds done by the assistants: about 0–1,000 private minutes. Other price levers from the docs: Linux arm64 2-core costs $0.005 a minute in private repos (Playwright on Linux arm64 untested here); ubuntu-slim 1-core costs $0.002 a minute but has a 15-minute job limit and is 'not suitable for typical heavyweight CI/CD builds'.
   - Site private possible: Not applicable; this only lowers the minutes for options 1 and 2.
   - Limits: Skip markers only apply to push and pull_request events, and only to the commit that carries them. Path filters leave required checks 'Pending', which only matters if branch protection requires them. The pull_request trigger has not fired in the last 652 runs, so it costs nothing today, but PR-based work would double the runs.
   - Setup effort: Assistants only: edit deploy.yml (paths-ignore, a light publish job, a path-gated or nightly or on-demand browser job, Chromium-only install, a lower timeout) and agree a commit convention ([skip ci] on intermediate pushes, a publish marker when ready). Owner: nothing, apart from approving the change. Removing the duplicate 35.8 MB master file from the published site would shrink deploys, but it sits inside the frozen checkpoint avatar-joints-1, and CLAUDE.md rule 17 says frozen files stay unchanged, so that is the owner's decision.
   - Fits this repo: Yes. Timings and counts come from this repo's own runs (Actions API, read-only, 23 Nov 2026). The browser gate was added on 22 Nov 05:10 UTC ('Strengthen shared lab input and gate publishing with browser regressions'), so the 16–23 Nov total of about 1,086–1,137 minutes understates the cost of the current workflow.
   - Risks: Fewer automatic browser checks per publish means a regression could reach the test link before the nightly or path-gated run catches it. The assistants already run checks locally, but this weakens the current 'gate before publish'. Path gating needs a correct list of paths or it can miss shared code. The 2-CPU slowdown is unmeasured; measure one private run before trusting the numbers.
   - Sources: https://raw.githubusercontent.com/github/docs/main/content/actions/how-tos/manage-workflow-runs/skip-workflow-runs.md; https://raw.githubusercontent.com/github/docs/main/content/billing/concepts/product-billing/github-actions.md; https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/actions-standard-runner-prices.md; https://raw.githubusercontent.com/github/docs/main/content/actions/reference/runners/github-hosted-runners.md; https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/ci.md ('Caching browsers'); https://github.com/pricing/calculator; repo Actions API runs/jobs/artifacts for isaiasurrutia96/3D-World-4 (read 23 Nov 2026); /home/user/3D-World-4/.github/workflows/deploy.yml; /home/user/3D-World-4/scripts/check-lab-foundations-browser.mjs

4. **4a. GitHub Codespaces as a login-only phone preview**
   - How it works: The owner starts a codespace on the private repo from a browser. A devcontainer start command pulls main, builds and runs vite preview. The forwarded port URL https://<codespace-name>-<port>.app.github.dev is private by default: only the codespace owner, after signing in to GitHub, can open it. The codespace stops after 30 minutes idle by default.
   - Cost: $0 within the personal quota: Free gives 120 core-hours (60 hours on a 2-core machine) and 15 GB-month of storage; Pro gives 180 core-hours and 20 GB-month. Beyond that: 2-core $0.18 an hour, storage $0.07 per GB-month. Without a card, use is blocked at the quota. Codespaces does not use Actions minutes.
   - Site private possible: Yes. A private port needs the owner's GitHub sign-in. It is the only login-only preview available on Free or Pro.
   - Limits: It only works while the codespace is running; idle timeout is 30 minutes by default; unused codespaces are deleted after 30 days by default. A new codespace gets a new name and therefore a new URL. No official guide covers starting a codespace or opening a private port from iPhone Safari. Community reports mention a cramped interface, pop-up blocking, and one case where a private port downloaded a file instead of showing the page.
   - Setup effort: Assistants: add a .devcontainer config that builds and serves on start. Owner, every test session: open github.com/codespaces on the phone, start or resume the codespace, wait for the build (est. 2–4 min, not measured), open the port link, stay signed in to GitHub in Safari. The assistants cannot start it for him from their sessions.
   - Fits this repo: Technically yes: the repo is about 167 MB and the build about 160 MB, well within 15 GB. Running the build on 2 cores uses quota.
   - Risks: Much more friction than tapping a link: a manual start every time, waits, and changing URLs. iPhone behaviour is unconfirmed, so it is a poor fit for an owner who tests by link and often while away from a desk. Best as an occasional private preview, not the main route.
   - Sources: https://raw.githubusercontent.com/github/docs/main/content/billing/concepts/product-billing/github-codespaces.md; https://raw.githubusercontent.com/github/docs/main/content/codespaces/troubleshooting/troubleshooting-included-usage.md; https://raw.githubusercontent.com/github/docs/main/data/reusables/codespaces/port-forwarding-sharing.md; https://raw.githubusercontent.com/github/docs/main/content/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace.md; community: https://github.com/orgs/community/discussions/16753 (checked 23 Nov 2026)

5. **4b. GitHub Enterprise Cloud org with privately published Pages (login-only test site)**
   - How it works: Create an organization on Enterprise Cloud, transfer the repo into it, and set Pages visibility to private. Only people with read access to the repo can open the site, after signing in to GitHub.
   - Cost: $21 per user per month (github.com/pricing, 23 Nov 2026). Includes $300 a month of Actions compute (about 50,000 Linux minutes) and 50 GB of artifact storage, so minutes stop being a concern. A trial is referenced in the docs; its terms were not checked.
   - Site private possible: Yes. This is the only GitHub-native login-only Pages option.
   - Limits: Private sites live on a unique random *.pages.github.io subdomain (a custom domain is possible), so the current link changes. Access control works only for project sites from private or internal repos the organization owns. The docs say existing private sites stay private if the organization later leaves Enterprise Cloud, but whether updates keep deploying after that is not stated; do not plan around it.
   - Setup effort: Owner: create the organization, start or buy Enterprise Cloud, transfer the repo, set Pages to private, sign in to GitHub in iPhone Safari. Assistants: re-point their sessions or connectors to the organization's repo path.
   - Fits this repo: Yes; same Pages size limits.
   - Risks: About 5 times Pro's cost. The repo path changes (assistant sessions need updating) and so does the test URL. Over-built for a single-person project.
   - Sources: https://github.com/pricing; https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/about-privately-published-github-pages-sites.md; https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site.md; https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/actions-included-quotas.md (checked 23 Nov 2026)

### Facts

1. **On GitHub Free, Pages works only in public repos. Pro, Team, Enterprise Cloud and Enterprise Server allow Pages from private repos.**
   - Source: https://raw.githubusercontent.com/github/docs/main/data/reusables/gated-features/pages.md and githubs-plans.md (GitHub docs source, main, fetched 23 Nov 2026)
   - Confidence: confirmed

2. **Pages sites are publicly available even when the repo is private. Publishing a site privately needs an organization on GitHub Enterprise Cloud.**
   - Source: https://raw.githubusercontent.com/github/docs/main/content/get-started/learning-about-github/githubs-plans.md; .../about-privately-published-github-pages-sites.md
   - Confidence: confirmed

3. **Making a repo private on Free automatically unpublishes its Pages site. Existing public forks stay public.**
   - Source: https://raw.githubusercontent.com/github/docs/main/content/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility.md
   - Confidence: confirmed

4. **GitHub Pro costs $4 a month. Official source: a GitHub docs FAQ about the 2020 price change, still in the docs. github.com/pricing (checked 23 Nov 2026) does not list Pro, and the calculator shows a Pro section with no price.**
   - Source: https://raw.githubusercontent.com/github/docs/main/content/get-started/learning-about-github/faq-about-changes-to-githubs-plans.md; https://github.com/pricing; https://github.com/pricing/calculator; community https://github.com/orgs/community/discussions/151560
   - Confidence: likely

5. **Team is $4 per user per month and Enterprise is $21 per user per month. Free lists '2,000 CI/CD minutes/month', Team 3,000 and Enterprise 50,000. Pages for Free: 'Public repositories'.**
   - Source: https://github.com/pricing (WebFetch 23 Nov 2026)
   - Confidence: confirmed

6. **GitHub docs now express Actions allowances in dollars. Free gets $12 a month of included compute and Pro gets $18. The non-cloud docs version still says 2,000 and 3,000 minutes. Linux 2-core x64 costs $0.006 a minute, so $12 equals 2,000 minutes and $18 equals 3,000.**
   - Source: https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/actions-included-quotas.md; .../actions-standard-runner-prices.md; .../content/billing/reference/product-usage-included.md
   - Confidence: confirmed

7. **Runner rates: Linux 1-core (ubuntu-slim) $0.002 a minute; Linux 2-core x64 $0.006; Linux 2-core arm64 $0.005; Windows $0.010; macOS $0.062. Extra minutes are billed at these rates. Without a valid payment method, usage is blocked once the included compute is used up.**
   - Source: https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/actions-standard-runner-prices.md; .../content/billing/concepts/product-billing/github-actions.md; https://github.com/pricing/calculator
   - Confidence: confirmed

8. **Actions artifact storage included: Free 500 MB, Pro 1 GB (pooled with Packages). Overage costs $0.25 per GB-month, accrued hourly. Cache: 10 GB per repo included; extra costs $0.07 per GB-month.**
   - Source: https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/actions-included-quotas.md; .../content/billing/concepts/product-billing/github-actions.md
   - Confidence: confirmed

9. **Standard GitHub-hosted runners are free in public repos, 'For GitHub Pages' and for Dependabot. Whether the free Pages exemption covers custom deploy workflows, or storage for 'github-pages' artifacts, is not stated. A 2022 GitHub blog post reportedly said private-repo Pages builds use minutes; github.blog could not be opened from this session.**
   - Source: https://raw.githubusercontent.com/github/docs/main/content/billing/concepts/product-billing/github-actions.md
   - Confidence: unconfirmed

10. **Private-repo standard Linux runners have 2 CPUs, 8 GB RAM and 14 GB SSD. Public-repo runners have 4 CPUs and 16 GB, and are 'free and unlimited'. Moving to private will probably make the current runs slower; the slowdown has not been measured.**
   - Source: https://raw.githubusercontent.com/github/docs/main/data/reusables/actions/supported-github-runners.md
   - Confidence: confirmed

11. **Recent publish runs on public 4-CPU runners: 9.1, 10.9 and 20.6 min. Steps: racing-core unit tests 69–99 s; build 107–145 s; Playwright install 33–44 s (one outlier 720 s); browser checks 270–346 s; peaceiris publish 8–11 s.**
   - Source: Repo Actions API: repos/isaiasurrutia96/3D-World-4/actions/runs/{45273957860,45252505999,45235177129}/jobs (read 23 Nov 2026)
   - Confidence: confirmed

12. **353 push-triggered publish runs from 16 to 23 Nov (about 44 a day; peak 82 a day, 18 in one hour), plus about 300 'pages build and deployment' runs of about 1 minute each. Rounded-up push-run minutes: about 1,137 in total; 318 on 22 Nov and 229 on 23 Nov (until 22:03 UTC). The browser gate was added 22 Nov 05:10 UTC. No pull_request runs appeared among the last 652 runs.**
   - Source: Repo Actions API runs list (read-only, 23 Nov 2026); git log of /home/user/3D-World-4/.github/workflows/deploy.yml
   - Confidence: confirmed

13. **112 of 421 commits since 16 Nov touched only docs/ or .md files. 164 touched racing or shared paths (racing-lab, racing-core, kart-parts, karts, test-lab, src, motion-lab/src, scripts/check-lab, package files, vite config, .github). 117 touched other code or assets.**
   - Source: git log in /home/user/3D-World-4 (23 Nov 2026)
   - Confidence: confirmed

14. **There are currently 20 unexpired 'github-pages' artifacts, about 137 MB each and about 2.65 GB in total, kept for 1 day. Test-result artifacts are about 1 KB each.**
   - Source: Repo Actions API artifacts list (read 23 Nov 2026)
   - Confidence: confirmed

15. **Repo today: public, 0 forks, 0 stars, about 167 MB (API size 170,911 KB), Pages enabled.**
   - Source: gh api repos/isaiasurrutia96/3D-World-4 (23 Nov 2026)
   - Confidence: confirmed

16. **Pages limits: published site at most 1 GB; deployments time out after 10 minutes; soft bandwidth 100 GB a month; soft 10 builds an hour (not applied to custom Actions workflows); not allowed for an online business, e-commerce or commercial SaaS.**
   - Source: https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/github-pages-limits.md
   - Confidence: confirmed

17. **Git file limits: blocked over 100 MiB, warning over 50 MiB, browser upload at most 25 MiB. Repos recommended under 1 GB, strongly under 5 GB.**
   - Source: https://raw.githubusercontent.com/github/docs/main/data/variables/large_files.yml; .../about-large-files-on-github.md
   - Confidence: confirmed

18. **peaceiris/actions-gh-pages can deploy to another repo with external_repository, using deploy_key or personal_token. GITHUB_TOKEN has no permission on external repos. The README gives 'private source repo to public github.io repo' as the Free-plan use case.**
   - Source: https://raw.githubusercontent.com/peaceiris/actions-gh-pages/main/README.md
   - Confidence: confirmed

19. **Fine-grained tokens can be created from prefilled URLs (for example contents=write, expires_in=1–366 or none). A personal account allows unlimited lifetimes unless a policy blocks them. Up to 50 fine-grained tokens per user.**
   - Source: https://raw.githubusercontent.com/github/docs/main/content/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens.md
   - Confidence: confirmed

20. **[skip ci], [ci skip], [no ci], [skip actions] or [actions skip] in a commit message stops workflows triggered by push or pull_request for that commit.**
   - Source: https://raw.githubusercontent.com/github/docs/main/content/actions/how-tos/manage-workflow-runs/skip-workflow-runs.md
   - Confidence: confirmed

21. **Playwright's docs say caching browser binaries is not recommended (restoring takes about as long as downloading, and Linux OS dependencies cannot be cached). Its official Docker image is mcr.microsoft.com/playwright:v<version>-noble.**
   - Source: https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/ci.md
   - Confidence: confirmed

22. **Codespaces quotas: Free 120 core-hours and 15 GB-month; Pro 180 core-hours and 20 GB-month. 2-core costs $0.18 an hour and storage $0.07 per GB-month. Default idle timeout 30 minutes. Forwarded ports are private unless shared, and public ports need no login.**
   - Source: https://raw.githubusercontent.com/github/docs/main/content/billing/concepts/product-billing/github-codespaces.md; .../codespaces/troubleshooting/troubleshooting-included-usage.md; .../data/reusables/codespaces/port-forwarding-sharing.md
   - Confidence: confirmed

23. **Starting a codespace and opening a private forwarded port from iPhone Safari works reliably.**
   - Source: No official guide found; community and vendor reports only (for example https://github.com/orgs/community/discussions/16753)
   - Confidence: unconfirmed

24. **With the source repo private and its project site unpublished, a user-site repo isaiasurrutia96.github.io with a 3D-World-4/ folder would serve the same URL isaiasurrutia96.github.io/3D-World-4/. I could not check whether that repo already exists.**
   - Source: Inference from how Pages user and project sites are laid out (what-is-github-pages.md); not stated in the docs
   - Confidence: likely

25. **The built site uses relative paths (vite base './'), so it works under a different repo path. Most lab bundles use esbuild minify:true; avatar-test, elbow-lab, skeleton-test and wrist-lab builds set no minify flag. Checkpoint folders, including README.md and JSON manifests, are copied verbatim into dist.**
   - Source: /home/user/3D-World-4/vite.config.ts; /home/user/3D-World-4/*/build.mjs; /home/user/3D-World-4/scripts/build-checkpoints.mjs
   - Confidence: confirmed

26. **docs.github.com, github.blog and playwright.dev were unreachable from this session (DNS blocked). GitHub docs were read from their source on raw.githubusercontent.com (main branch, 23 Nov 2026, about 22:00 UTC). The rendered pages may differ slightly.**
   - Source: Session network errors during WebFetch
   - Confidence: confirmed

## Research: cloudflare
**Summary:** Short answer to the owner's question: no, going private does not force him onto a laptop terminal. With Cloudflare hosting, the game is still built and published automatically on every push to main. He keeps testing by opening a link on his iPhone. The only change is a login screen; the login lasts up to one month, and the default is 24 hours. He needs about 15 to 30 minutes of one-time setup in a web browser (my estimate). That covers making a Cloudflare account, turning on Zero Trust Free (it asks for card or PayPal details but does not charge), and either approving the Cloudflare GitHub app or creating one API token and pasting it into two GitHub secrets. The assistants do the rest.

Cost: $0 on Cloudflare. The site gets a free *.workers.dev or *.pages.dev address, so no custom domain is needed. Static file requests and bandwidth are free and unlimited. The login-only layer, Cloudflare Access, is free for up to 50 users.

Recommendation: Cloudflare Workers with static assets. Cloudflare's own Pages docs now say "Start new projects with Workers". A Worker can be locked behind login for production and previews in one dashboard step. Pages protects only preview URLs by default, and covering the main pages.dev address takes a documented workaround.

Two things must change in the repo for any Cloudflare option:
1. The 35,810,859-byte avatar master file (34.15 MiB) is over the 25 MiB per-file limit. Wrangler stops the whole deploy with "Pages only supports files up to 25 MiB". Live pages appear to load only the 19.04 MiB delivery file, so the copy in dist/avatar/assembled-joints can be left out. But the frozen page checkpoints/avatar-joints-1/index.html does fetch the master at runtime. That one page breaks unless the file is served another way, such as R2 plus a Worker route, which leaves the frozen files unchanged.
2. Both Pages and Workers answer video Range requests with a full 200 response instead of a partial 206. Cloudflare's own docs say Safari needs range support to play video. The test-lab and motion-lab MP4s may not play on the iPhone until a small Worker route serves 206 responses. This must be tested on a real iPhone.

GitHub Actions minutes: deploying from the existing Actions workflow keeps the Playwright checks in front of every publish. At today's pace, though (about 1,086 minutes in 8 days, roughly 4,000 a month), a private repo would go over the Free allowance (about 2,000, figure from earlier today, not rechecked) unless the workflow is trimmed. Letting Cloudflare do the build (Workers Builds: 3,000 free build minutes a month; Pages Git: 500 builds a month) moves that cost off GitHub. The browser checks then stop gating publishes unless they are kept separately.

Sources: developers.cloudflare.com and www.cloudflare.com are blocked in this session. I read the official docs from their source repo (raw.githubusercontent.com/cloudflare/cloudflare-docs, production branch) on 2026-11-23. Pricing-page facts (the 50-user cap, $7 per user) come from search snippets only.

### Options

1. **A. Cloudflare Workers static assets, deployed from the existing GitHub Actions workflow (wrangler deploy) + Cloudflare Access on the Worker  [recommended if keeping test gating]**
   - How it works: GitHub Actions keeps running the same tests and build. The last step swaps peaceiris/actions-gh-pages for cloudflare/wrangler-action, which runs 'wrangler deploy'. A small wrangler.jsonc names the Worker and points assets.directory at ./dist. The site is served at <worker-name>.<account-subdomain>.workers.dev. Vite base is './', so serving from the root works. Access is switched on once for the Worker (All traffic), so every visit needs a login. The owner opens the same kind of link on his iPhone, signs in once (session can be set up to 1 month), and tests as now. The owner does one thing once: create the Cloudflare account and an API token, and paste two GitHub secrets.
   - Cost: Cloudflare $0. Workers Free: static asset requests are free and unlimited, with no charge for storing assets. Worker-code requests are capped at 100,000/day on Free (only relevant if a Worker route is added for video ranges or R2). Workers Paid ($5/month minimum) is not needed. Zero Trust Free is $0 for up to 50 users, but payment details are required at signup. GitHub Actions: unchanged runs of about 8-10 min each now bill against the private-repo allowance. At the measured ~136 min/day (~4,000/month projected) that exceeds Free (~2,000, unverified) and Pro (~3,000, unverified) unless trimmed. Ideas: don't run the full pipeline on both the PR and the push, run the racing browser suites (~290 s) only when racing files change, cache Playwright browsers. The wrangler upload step adds roughly a minute (estimate; uploads after the first send only changed files, per Wrangler's hash check, likely).
   - Site private possible: Yes, free. Workers & Pages > Worker > Access tab > 'Protect this Worker behind Access' > All traffic. This protects the workers.dev URL, preview URLs, routes and custom domains together, and needs a Zero Trust organization (Free plan). Login choices on iPhone: (1) Cloudflare account login, the default identity provider for new orgs, limited to account members; (2) email one-time PIN, added in Zero Trust > Integrations > Identity providers; the code is emailed from noreply@notify.cloudflare.com and expires after 10 minutes; (3) Google login, which needs a Google Cloud OAuth client created by the owner first. Session: the application and global session can each be set up to one month (default 24 h). The app cookie lives on the protected hostname, and the global session on <team>.cloudflareaccess.com gives SSO across previews. Free plan: 50 users; the owner uses 1 seat. Access service tokens let automated checks through without using seats. No custom domain needed.
   - Limits: Workers Free static assets: 20,000 files per version (paid 100,000), 25 MiB per file, 100 _headers rules, 2,100 redirects. No total-site-size limit is listed. Bandwidth/egress: free. Workers Free: 100 Workers per account, 100,000 Worker-code requests/day, 10 ms CPU (irrelevant for pure static). Previews: 100 per Worker on Free. Versions kept 30 days, plus the 100 most recent and the deployed one. No monthly deploy count is listed for wrangler deploy from CI. Range requests return 200 with the full file (no 206). Commercial use: no explicit clause found; see facts (unconfirmed).
   - Setup effort: Owner (browser only, roughly 15-30 min, estimate): (1) sign up at dash.cloudflare.com/sign-up, verify email, turn on 2FA; (2) open Zero Trust, pick a team name, choose the Free plan, enter payment details (not charged); (3) Account API tokens > Create Token > template 'Edit Cloudflare Workers', scoped to this account; copy the token and Account ID; (4) GitHub repo > Settings > Secrets and variables > Actions > add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID; (5) after the first deploy, Worker > Access > Protect this Worker > All traffic, add his email or one-time PIN, set session to 1 month (an assistant can do this via API if given a token with Access permissions); (6) once the Cloudflare link works on his phone, change the repo to private. Assistants: add wrangler.jsonc and dist/.assetsignore (exclude the master .json.gz), swap the deploy step, add a Worker route for video Range (206) if the iPhone test shows videos fail, decide what to do about the avatar-joints-1 checkpoint (R2 + Worker route, or accept it is unavailable), create an Access service token for their own automated checks, update docs/links. New Cloudflare accounts have a limit on project creation in their first 48 hours (stated for Pages).
   - Fits this repo: 187 files and ~160 MB: fits (limit 20,000 files, no total-size limit listed). 35,810,859 B = 34.15 MiB master file: does not fit 25 MiB (26,214,400 B), and wrangler aborts the whole deploy. Fix: list it in dist/.assetsignore, which Wrangler skips, or drop line 37 of scripts/build-official-avatar-page.mjs that copies it into dist. Live loader avatar/src/official-avatar.js fetches delivery.asset (19,962,239 B = 19.04 MiB, fits); the 5 MB light file fits. The frozen checkpoints/avatar-joints-1/index.html fetches parts-4d3988607a0d4159.json.gz at runtime, so that page would fail unless the file is served from R2 through a Worker route at the same path (keeps frozen files intact). MP4s in public/test-lab/media, public/motion-lab/videos and public/references may not play in iPhone Safari without 206 support; Cloudflare documents the fix (run_worker_first for those paths, return 206 from env.ASSETS.fetch()). The ~3 MB HTML pages are fine.
   - Risks: (1) iPhone video playback because there is no 206 (documented by Cloudflare; real-device test needed). (2) The .gz assets: Pages adds Content-Encoding for encoded assets, and whether Cloudflare changes .gz bytes is unconfirmed. The pages' SHA-256 checks would show any mismatch loudly; test it. (3) Access blocks assistants' own browser checks of the live site unless they send a service token; this cloud session currently cannot reach cloudflare.com hosts at all, so the environment allowlist would need the site host (and api.cloudflare.com if running wrangler here). workers.dev also runs Browser Integrity Check, which rejects some default library User-Agents. (4) Zero Trust Free needs card/PayPal on file. Community posts say checkout asks consent for overage billing (unofficial). (5) GitHub Actions minutes overrun on a private repo if the workflow is left as is. (6) Worker-level Access does not support WebSockets (not used by this static site, as far as seen).
   - Sources: https://developers.cloudflare.com/workers/static-assets/ ; https://developers.cloudflare.com/workers/platform/limits/#static-assets ; https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ (free asset requests; Range returns 200; Safari note) ; https://developers.cloudflare.com/workers/static-assets/binding/#ignoring-assets ; https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/ ; https://developers.cloudflare.com/workers/configuration/cloudflare-access/ ; https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ ; https://developers.cloudflare.com/workers/previews/ ; https://developers.cloudflare.com/workers/platform/pricing/ ; https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/ ; https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/ ; https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/cloudflare/ ; https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/ ; https://developers.cloudflare.com/cloudflare-one/setup/ ; https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/workers-shared/utils/constants.ts (MAX_ASSET_SIZE 25 MiB). All docs read from the github.com/cloudflare/cloudflare-docs production-branch source on 2026-11-23.

2. **B. Cloudflare Pages, Direct Upload from the existing GitHub Actions workflow (wrangler pages deploy) + Access**
   - How it works: Same as A, but the final step runs 'wrangler pages deploy dist --project-name=<name>' through cloudflare/wrangler-action. The site is served at <project>.pages.dev. Pushes to other branches (or --branch) become preview URLs <hash>.<project>.pages.dev plus a branch alias <branch>.<project>.pages.dev. The owner tests by link as now.
   - Cost: Cloudflare $0. Pages static asset requests are free and unlimited on all plans, with no egress charge. Zero Trust Free is $0 for 50 users (payment details required). GitHub Actions minutes: same as A (full pipeline runs on GitHub, so the private-repo allowance is used and trimming is likely needed).
   - Site private possible: Yes, free, no custom domain needed, but in two steps. Project > Settings > General > 'Enable access policy' protects only preview deployments (hash and branch-alias URLs), not <project>.pages.dev. To also protect the main pages.dev address, follow Cloudflare's 'Known issues' recipe: open the created Access app, delete the '*' wildcard from the subdomain, save, then re-enable the access policy so two Access apps exist (one for <project>.pages.dev, one for *.<project>.pages.dev). The default policy limits viewing to members of the Cloudflare account. Login options, session length (up to 1 month) and the 50-seat Free plan are the same as A.
   - Limits: Pages Free: 20,000 files per site, 25 MiB per file (Wrangler upload: 20,000 files / 25 MiB; dashboard drag-and-drop: 1,000 files). No total-size limit is listed. 100 projects per account; 100 custom domains per project. Deployments kept 30 days plus the 100 most recent and the current production one. 1 concurrent build and 500 builds/month (the Pages overview card calls it '500 deploys per month'); whether direct uploads count against it is not stated (unconfirmed; a community answer says no). _headers max 100 rules; _redirects 2,100. HTTP Range requests return 200, not 206 (Pages serving docs).
   - Setup effort: Owner: same as A, but the API token is a Custom token with permission Account > Cloudflare Pages > Edit. Then add the two GitHub secrets, enable the access policy and do the known-issues steps (or let an assistant do them via API), then make the repo private. Assistants: create the Pages project (wrangler pages project create, or the first deploy creates it), change the deploy step, delete the master .json.gz from dist before upload (Pages has no .assetsignore; Wrangler only skips node_modules, .DS_Store, .git), handle the checkpoint page and video Range issue, add a service token for checks. A Direct Upload project can never be switched to Git integration later.
   - Fits this repo: Same as A: the files and total size fit. The 34.15 MiB master fails the deploy, and wrangler source throws 'Error: Pages only supports files up to 25 MiB in size' (pages/validate.ts). Remove it from dist before deploy; live pages appear not to need it, but checkpoints/avatar-joints-1 does (R2 via a Pages Function would be needed to keep that page working; Pages Functions requests count against the 100,000/day Workers Free quota). Video Range: same Safari risk; on Pages a fix would need Pages Functions or _worker.js (not specifically documented by Cloudflare for Pages).
   - Risks: Cloudflare's Pages docs carry the banner 'Are you sure you want to use Pages? ... Start new projects with Workers', so Pages is de-emphasized; it still works and is documented, but new features land on Workers first. Protecting the main pages.dev URL relies on a documented workaround with two Access apps; easy to misconfigure. The '500 deploys per month' wording may or may not count CI uploads, and ~410-510 pushes/month at today's pace (estimate) would sit near that line if it does. Direct Upload cannot be converted to Git integration. Same video, .gz, Access-vs-automation and Actions-minutes risks as A.
   - Sources: https://developers.cloudflare.com/pages/platform/limits/ ; https://developers.cloudflare.com/pages/ (banner and '500 deploys per month' card) ; https://developers.cloudflare.com/pages/get-started/direct-upload/ ; https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/ ; https://developers.cloudflare.com/pages/configuration/preview-deployments/ ; https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain ; https://developers.cloudflare.com/pages/configuration/serving-pages/ (Range returns 200) ; https://developers.cloudflare.com/pages/functions/pricing/ (static requests free) ; https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/wrangler/src/pages/validate.ts and .../pages/constants.ts ; community (unofficial) on direct uploads and build count: https://answeroverflow.com/m/1239028265079799901. Checked 2026-11-23.

3. **C. Cloudflare Pages with Git integration (Cloudflare clones the private repo and builds it) + Access**
   - How it works: The owner installs the 'Cloudflare Workers and Pages' GitHub App on his account, limited to 3D-World-4, and connects the repo in the Cloudflare dashboard (build command 'npm run build', output 'dist', NODE_VERSION=24). Every push to main builds and publishes <project>.pages.dev. Every other branch and every PR gets a preview URL, and GitHub shows Cloudflare check runs. GitHub Actions can be switched off or cut down to tests only, so Cloudflare does the build work instead of GitHub.
   - Cost: Cloudflare $0 (Pages Free, Zero Trust Free). GitHub Actions minutes: about 0 if the workflow is removed, or only whatever tests are kept on GitHub (e.g., Playwright on PRs or manual runs only). This is the main way to avoid the private-repo minutes problem.
   - Site private possible: Same as B: free; 'Enable access policy' protects previews only, and the known-issues recipe is needed for <project>.pages.dev. Same login options, session length and 50-seat Free plan as A.
   - Limits: Pages Free: 500 builds/month, 1 build at a time, 20-minute build timeout. 20,000 files, 25 MiB per file, no total-size limit listed. Previews are created for pushes to any branch (configurable with branch build controls) and count as builds and deployments. A commit message starting with [skip ci] / [CF-Pages-Skip] skips a build. Private repos supported: 'Both private and public repositories are supported.' Range requests return 200.
   - Setup effort: Owner: create the Cloudflare account and Zero Trust Free org; Workers & Pages > Create > Pages > Connect to Git > GitHub. On GitHub, authorize and install the app with 'Only select repositories' = 3D-World-4. Enter the build settings (an assistant can tell him the exact values) and enable the access policy plus the known-issues steps. No API token or GitHub secrets needed. Assistants: make the build pass in Cloudflare's image, make sure the master .json.gz is not in dist (build-script change, e.g. removing the copy in scripts/build-official-avatar-page.mjs line 37, since Pages has no ignore file), decide where tests run, handle video Range and the checkpoint page. A Git-integrated project cannot be switched to Direct Upload later; automatic builds can be paused and wrangler used instead.
   - Fits this repo: Same file-size issue as A/B: the build output must not contain the 34.15 MiB master or the deploy fails. Build time should fit 20 minutes (GitHub runs take 8-10 min including ~5 min of Playwright; Cloudflare build time is not measured). Whether Playwright Chromium/WebKit with system deps can run in Cloudflare's build image is unconfirmed, so the browser checks would most likely stay on GitHub or be dropped from the publish gate. At today's pace (~14-17 runs/day, ~410-510/month, estimate) the 500 builds/month cap is tight; limit preview builds to main plus selected branches.
   - Risks: 500 builds/month could be hit on busy months; after that, publishing stops until the month resets (Cloudflare's limit-increase form exists). Tests no longer gate publishing unless kept on GitHub. One build at a time means queued builds on busy days. Pages is de-emphasized versus Workers. Same Access two-app workaround, video Range, .gz and Access-vs-automation risks.
   - Sources: https://developers.cloudflare.com/pages/get-started/git-integration/ (partial: 'Both private and public repositories are supported.') ; https://developers.cloudflare.com/pages/configuration/git-integration/ ; https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/ ; https://github.com/apps/cloudflare-workers-and-pages ; https://developers.cloudflare.com/pages/platform/limits/ ; https://developers.cloudflare.com/pages/configuration/build-image/ ; https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain. Checked 2026-11-23.

4. **D. Cloudflare Workers static assets with Workers Builds (Cloudflare builds the private repo) + Access on the Worker**
   - How it works: Like C, but on Workers, the platform Cloudflare now recommends. The owner connects the private repo to a Worker through the same GitHub App. Workers Builds runs the build command, then 'npx wrangler deploy', on each push to main. Preview builds for other branches can be enabled (wrangler preview). Access 'Protect this Worker' covers production and previews in one step, as in A.
   - Cost: Cloudflare $0. Workers Builds Free: 3,000 build minutes/month, then the paid plan is needed (paid: 6,000 included, then $0.005/min). Static asset requests are free and unlimited. Zero Trust Free $0 (payment details required). GitHub Actions: about 0 if the workflow is removed, or only what is kept for tests.
   - Site private possible: Yes, free: Worker > Access tab > Protect this Worker behind Access > All traffic (production workers.dev, previews and any custom domain together). Same login options, session up to 1 month, 50-seat Free plan, and service tokens for automation as A.
   - Limits: Workers Builds Free: 3,000 build minutes/month, 1 concurrent build, 20-minute timeout, 2 vCPU, 8 GB memory, 20 GB disk, Ubuntu 24.04 image with Node 22 and 24 preinstalled. Static assets: 20,000 files per version, 25 MiB per file, no total-size limit listed. Previews: 100 per Worker (Free). Range requests return 200.
   - Setup effort: Owner: create the Cloudflare account and Zero Trust Free org; Workers & Pages > Create > import the GitHub repo, authorize and install the GitHub App on 3D-World-4 only; turn on Access for the Worker. No API token or GitHub secrets needed. Assistants: add wrangler.jsonc (name, compatibility_date, assets.directory ./dist) and dist/.assetsignore, set the build and deploy commands, handle the master file, video Range Worker route, checkpoint page and service token, and decide which tests stay on GitHub.
   - Fits this repo: The files fit; the 34.15 MiB master must be excluded (.assetsignore works here). A ~3-5 min Cloudflare build (estimate, without Playwright) would allow roughly 600-1,000 builds/month inside 3,000 minutes, more headroom than Pages' 500 builds. Running Playwright inside Workers Builds is unconfirmed (it needs browser system packages). Same checkpoint and video notes as A.
   - Risks: Playwright gating moves off the publish path unless kept on GitHub. Preview builds on Workers are 'not yet as configurable as Pages' (Cloudflare's own matrix). Busy months could use the 3,000 free minutes if builds are slow. Same video Range, .gz, Access-vs-automation and Zero Trust payment-details caveats as A.
   - Sources: https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/ ; https://developers.cloudflare.com/workers/ci-cd/builds/build-image/ ; https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/ ; https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ (compatibility matrix; previews footnote) ; https://developers.cloudflare.com/workers/configuration/cloudflare-access/ ; https://developers.cloudflare.com/workers/previews/. Checked 2026-11-23.

### Facts

1. **Docs access caveat: developers.cloudflare.com and www.cloudflare.com are blocked by this cloud session's network policy. All doc facts below were read on 2026-11-23 from the official source repo github.com/cloudflare/cloudflare-docs (production branch, via raw.githubusercontent.com), which is the source of developers.cloudflare.com. To fetch those hosts directly, they would have to be allowed in the session's network settings.**
   - Source: Session fetch errors; https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/pages/platform/limits.mdx
   - Confidence: confirmed

2. **Cloudflare now steers new projects to Workers. The Pages docs show: 'Are you sure you want to use Pages? Workers supports most Pages use cases and offers a broader feature set... It is Cloudflare's primary platform for building applications. Start new projects with Workers.'**
   - Source: https://developers.cloudflare.com/pages/ (partial pages/workers-for-new-projects)
   - Confidence: confirmed

3. **Pages Free limits: 1 build at a time; 500 builds per month (Pro 5,000); builds time out after 20 minutes; 20,000 files per site (paid 100,000); max 25 MiB per asset; 100 custom domains per project; 100 projects per account; deployments kept 30 days plus the 100 most recent and the current production one. No total site size limit is listed.**
   - Source: https://developers.cloudflare.com/pages/platform/limits/
   - Confidence: confirmed

4. **The Pages overview card describes the cap as '500 deploys per month on the Free plan'. Whether Wrangler direct uploads from GitHub Actions count toward it is not stated. A community answer says they do not.**
   - Source: https://developers.cloudflare.com/pages/ ; https://answeroverflow.com/m/1239028265079799901
   - Confidence: unconfirmed

5. **Workers static assets: 20,000 files per version on Free (100,000 paid), 25 MiB per file. Requests to static assets are free and unlimited, with no extra cost for storing assets. Workers Free allows 100,000 Worker-code requests per day.**
   - Source: https://developers.cloudflare.com/workers/platform/limits/#static-assets ; https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
   - Confidence: confirmed

6. **On Pages, requests to static assets are free and unlimited on both free and paid plans. Workers pricing says there is no charge for egress bandwidth. Workers Paid is a $5/month minimum (not needed here).**
   - Source: https://developers.cloudflare.com/pages/functions/pricing/ ; https://developers.cloudflare.com/workers/platform/pricing/
   - Confidence: confirmed

7. **Workers Builds Free: 3,000 build minutes/month, 1 concurrent build, 20-minute timeout (paid: 6,000 minutes, then $0.005/min).**
   - Source: https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
   - Confidence: confirmed

8. **Pages Git integration supports private GitHub repos ('Both private and public repositories are supported.') through the 'Cloudflare Workers and Pages' GitHub App. The owner installs the app, can limit it to 'Only select repositories', and authorizes it once.**
   - Source: https://developers.cloudflare.com/pages/get-started/git-integration/ ; https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
   - Confidence: confirmed

9. **Direct Upload from GitHub Actions is officially documented. It needs a Custom API token (Account > Cloudflare Pages > Edit) plus the Account ID, stored as the GitHub secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID, and uses cloudflare/wrangler-action@v4 with 'pages deploy <dir> --project-name=<name>'. For Workers the token template is 'Edit Cloudflare Workers' and the command is 'wrangler deploy'.**
   - Source: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/ ; https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
   - Confidence: confirmed

10. **A Direct Upload Pages project cannot be switched to Git integration later. A Git-integrated project cannot be switched to Direct Upload, but its automatic deployments can be disabled and Wrangler used instead.**
   - Source: https://developers.cloudflare.com/pages/get-started/direct-upload/ ; https://developers.cloudflare.com/pages/configuration/git-integration/
   - Confidence: confirmed

11. **The avatar master file parts-4d3988607a0d4159.json.gz is 35,810,859 bytes (34.15 MiB), over the 25 MiB (26,214,400-byte) per-file limit. Wrangler's Pages validation throws 'Error: Pages only supports files up to 25 MiB in size', and Workers uses the same MAX_ASSET_SIZE = 25 * 1024 * 1024, so the whole deploy fails. The delivery file (19,962,239 B = 19.04 MiB) and the light file (5,167,402 B) fit.**
   - Source: Local file sizes in /home/user/3D-World-4/avatar/assembled-joints and /home/user/3D-World-4/checkpoints/avatar-joints-1 ; https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/wrangler/src/pages/validate.ts ; https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/workers-shared/utils/constants.ts
   - Confidence: confirmed

12. **scripts/build-official-avatar-page.mjs line 37 copies the master into dist/avatar/assembled-joints. The live loader avatar/src/official-avatar.js fetches delivery.asset, not the master, so live pages appear not to need it. But the frozen page checkpoints/avatar-joints-1/index.html fetches the master (new URL(Ks.asset, ...)) at runtime, so excluding the file breaks that one checkpoint page on Cloudflare unless it is served another way.**
   - Source: /home/user/3D-World-4/scripts/build-official-avatar-page.mjs ; /home/user/3D-World-4/avatar/src/official-avatar.js ; /home/user/3D-World-4/checkpoints/avatar-joints-1/index.html
   - Confidence: likely

13. **Ways to keep oversized files off the upload: Workers reads a .gitignore-style '.assetsignore' file in the assets directory and skips matching files. Pages has no equivalent documented for user files, so the file must be removed from dist before deploy. Cloudflare suggests R2 for files over 25 MiB. R2 Free includes 10 GB-month, but the r2.dev URL is for non-production use and cannot use Access, which needs a custom domain or serving through a Worker binding.**
   - Source: https://developers.cloudflare.com/workers/static-assets/binding/#ignoring-assets ; https://developers.cloudflare.com/pages/platform/limits/#file-size ; https://developers.cloudflare.com/r2/buckets/public-buckets/ ; https://developers.cloudflare.com/r2/pricing/
   - Confidence: confirmed

14. **Both Pages and Workers static assets return 200 with the full file for HTTP Range requests, not 206. Cloudflare notes that 'Some clients need range support, for example Safari when it plays video'. Its documented fix for Workers is run_worker_first plus a 206 response built from env.ASSETS.fetch(). The repo serves MP4s (e.g. public/test-lab/media/run.mp4 and walk.mp4, public/motion-lab/videos/*.mp4, public/references/*/*.mp4), so iPhone video playback must be tested.**
   - Source: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/#range-requests ; https://developers.cloudflare.com/pages/configuration/serving-pages/ ; local find in /home/user/3D-World-4/public
   - Confidence: confirmed

15. **On Pages, 'Enable access policy' protects only preview deployments, not <project>.pages.dev or custom domains. Protecting <project>.pages.dev without a custom domain is possible with a documented workaround (edit the Access app, delete the '*' subdomain wildcard, then re-enable for previews), which leaves two Access apps.**
   - Source: https://developers.cloudflare.com/pages/configuration/preview-deployments/#customize-preview-deployments-access ; https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain
   - Confidence: confirmed

16. **On Workers, one dashboard step (Worker > Access > 'Protect this Worker behind Access' > All traffic) protects the workers.dev URL, preview URLs, routes and custom domains. It requires a Zero Trust organization. Worker-level Access does not support WebSockets.**
   - Source: https://developers.cloudflare.com/workers/configuration/cloudflare-access/ ; https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
   - Confidence: confirmed

17. **Zero Trust Free is $0 for up to 50 users (Pay-as-you-go about $7 per user per month). This was read only from search-result snippets of Cloudflare's pricing pages and Access product page, because the pages could not be fetched here.**
   - Source: https://www.cloudflare.com/plans/zero-trust-services/ ; https://www.cloudflare.com/plans/sase-zero-trust.md ; https://www.cloudflare.com/sase/products/access/ ; https://blog.cloudflare.com/teams-plans
   - Confidence: likely

18. **Zero Trust onboarding asks for a subscription plan and payment details even on the Free plan ('this step is still needed but you will not be charged'). Community posts say the checkout asks consent for overage charges (unofficial).**
   - Source: https://developers.cloudflare.com/cloudflare-one/setup/ (partial cloudflare-one/choose-team-name) ; https://community.cloudflare.com/t/zero-trust-free-checkout-overage-consent-and-a-strict-0-spending-cap/976954
   - Confidence: confirmed

19. **A user uses one seat once they authenticate, no matter how many apps or logins. Seats are freed only by removing the user or by optional inactivity expiry. Access service tokens let automated clients in without using seats.**
   - Source: https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/
   - Confidence: confirmed

20. **Login methods: new Zero Trust orgs get the Cloudflare identity provider by default (sign in with a Cloudflare account, restricted to account members). Email one-time PIN can be added (the code expires 10 minutes after the request; sender noreply@notify.cloudflare.com). Google login works without Google Workspace, but the owner must first create an OAuth client in Google Cloud Console.**
   - Source: https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/cloudflare/ ; https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/ ; https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/
   - Confidence: confirmed

21. **Session length: the global session can be set from 15 minutes to one month (default 24 h), and the application/policy session from immediate to one month (default 24 h). When the app token expires, Access re-issues it without a new login while the global session is valid.**
   - Source: https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/
   - Confidence: confirmed

22. **How long the Access login actually lasts on iPhone Safari (cookie handling) is not covered in Cloudflare docs; it must be checked on the owner's phone. Private browsing or cleared site data will require logging in again.**
   - Source: No official source found
   - Confidence: unconfirmed

23. **Commercial use: no explicit allow or deny clause for Pages/Workers free plans was found. Cloudflare's 2023 terms update says the old large-file/video restriction (former section 2.8) now applies only to CDN use, and the Developer Platform terms allow hosting content. The terms pages could not be fetched here to confirm current wording.**
   - Source: https://www.cloudflare.com/service-specific-terms-developer-platform/ ; https://blog.cloudflare.com/updated-tos/
   - Confidence: unconfirmed

24. **The site builds with Vite base './' (relative paths), so it can be served from the root of a *.pages.dev or *.workers.dev host. Some browser tests hard-code the local prefix '/3D-World-4/', which applies to the local test server, not hosting.**
   - Source: /home/user/3D-World-4/vite.config.ts ; /home/user/3D-World-4/racing-lab/tests/app-browser.mjs
   - Confidence: confirmed

25. **The current workflow runs on push and pull_request to main, with cancel-in-progress concurrency, and publishes with peaceiris/actions-gh-pages (force_orphan). Replacing only that last step with cloudflare/wrangler-action keeps every existing test gate.**
   - Source: /home/user/3D-World-4/.github/workflows/deploy.yml
   - Confidence: confirmed

26. **Estimated run count from the measured ~1,086 minutes over 16-23 Nov at 8-10 min per run: about 14-17 runs/day, or roughly 410-510 per month. That is near Pages Git's 500 builds/month, and if those runs moved to GitHub's private-repo billing, about 4,000 Actions minutes per month.**
   - Source: Arithmetic on the lead's measured figures
   - Confidence: likely

27. **How Cloudflare serves the pre-compressed .gz assets (whether it adds or strips Content-Encoding and changes the bytes) is not documented for this case. Pages adds Content-Encoding and Cache-Control: no-transform for 'encoded' assets. The avatar loaders check SHA-256, so any change would show as a load error; test after the first deploy.**
   - Source: https://developers.cloudflare.com/pages/configuration/serving-pages/
   - Confidence: unconfirmed

28. **In their first 48 hours, new accounts face a limit on how many new Pages projects they can create, which lifts automatically.**
   - Source: https://developers.cloudflare.com/pages/platform/limits/#projects
   - Confidence: confirmed

## Research: others
**Summary:** I checked all of this on 2026-11-23. Most host websites are blocked in this session: netlify.com, vercel.com, azure, firebase, render, surge, aws, deno, ngrok and tailscale could not be opened with WebFetch or curl. For those hosts I used web-search summaries of their official pages, marked "likely". I could read the source files of the official docs directly from GitHub for Cloudflare, Azure Static Web Apps, GitLab, Deno, MDN, GitHub Pages and the peaceiris action. Those are marked "confirmed". For full first-hand checks, those hosts have to be allowed in the session's network settings.

Bottom line: four hosts can make the test site login-only for $0 with no laptop.
1. **Cloudflare Pages + Cloudflare Access.** Free, no traffic cap on static files, and login by a code sent to email or by an identity provider. But each file can be at most 25 MiB. The 35.8 MB (34.15 MiB) master file cannot be uploaded. The frozen checkpoint page avatar-joints-1 does seem to load its copy of that file, so that page would break unless the file is excluded or moved elsewhere.
2. **Netlify with "private project".** On the Free plan, only the team owner can open a private project, after logging in to Netlify. The catch: every production deploy costs 15 of the 300 monthly credits, so at most 20 per month. Today's pace is about 400 to 500 publishes a month (my estimate from the measured minutes). So publishing would have to use non-production deploys (draft, preview or branch deploys, which cost 0 credits to create) or be batched.
3. **Azure Static Web Apps Free.** GitHub login plus an invitation-based custom role, enforced by route rules, works on the Free plan. The limit is 250 MB per environment: the 160 MB site fits today, with about 90 MB of room to grow. It needs an Azure account with a card.
4. **Vercel Hobby.** Vercel Authentication can protect all deployments on every plan. But Hobby allows only personal or non-commercial use. Also, Hobby content is opted in to AI-model training by default; you can opt out. Both clash with the goal of protecting a game idea.

GitLab Pages also has login-only access on its Free plan. But it means moving the repo, the Free plan includes only 400 CI minutes a month, and Claude and Codex push through GitHub.

These hosts are weak fits: Firebase has no built-in login. Render has no login and only 5 GB of traffic a month. Surge charges $30 a month for a password. Amplify has a free password feature, but you pay AWS as you go and need a card. Deno Deploy shuts down in April 2027.

Laptop fallbacks: plain Wi-Fi testing (http://192.168.x.x) will break the avatar pages. They call crypto.subtle.digest, which browsers only allow over HTTPS or on localhost. Any laptop route therefore needs HTTPS.
- **Tailscale Serve:** a private, stable HTTPS link that only the owner's own devices can open.
- **cloudflared quick tunnel:** free and HTTPS, but the link changes every run. The `--allowed-mail` email check needs cloudflared 2026.9.3 or newer.
- **ngrok free:** only 1 GB of traffic a month and a warning page, which is too small for this site.

Every laptop route needs the laptop on, a `git pull`, a build and two commands each time.

GitHub Actions minutes: if the repo goes private and the full test-and-publish workflow stays in Actions, the measured pace is roughly 4,000 billed minutes a month (1,086 in 8 days), whatever the host. That is above the roughly 2,000 included on Free and 3,000 on Pro. Letting Cloudflare, Netlify, Vercel or Amplify run the build moves those minutes off GitHub, but the browser checks would no longer block a bad publish.

### Options

1. **Cloudflare Pages (Direct Upload from GitHub Actions) + Cloudflare Access (Zero Trust Free)**
   - How it works: GitHub Actions keeps running the tests and build, then uploads dist/ to a Cloudflare Pages project with `npx wrangler pages deploy dist` (or a Cloudflare-run build from the private repo through Git integration). Cloudflare Access sits in front of the site. When the owner opens the link on the iPhone, they log in once: a one-time code sent to an allowed email, or an identity provider such as GitHub. After that the session cookie lets them through. One time only, the owner creates a Cloudflare account, turns on Zero Trust Free, adds their email to an Access policy, and creates an API token for the assistants to store as a GitHub secret.
   - Cost: $0. Static file requests are free and unlimited on Pages. Zero Trust Free is $0 for up to 50 users (Cloudflare pricing page via search). OTP docs suggest the Free plan checkout may ask for a payment method without charging. Actions minutes: unchanged if Actions keeps testing and building (roughly 4,000 per month at the current pace on a private repo). With Cloudflare Git builds instead, GitHub minutes drop to about 0, within 500 builds per month and a 20-minute timeout, but the Playwright checks would no longer block publishing.
   - Site private possible: Yes, for free. Preview deployments (random hash URLs and branch aliases such as test.<project>.pages.dev) are protected with one toggle: Settings > General > Enable access policy. Protecting the main *.pages.dev domain needs a documented manual workaround (edit the Access app and delete the wildcard subdomain). A custom domain needs its own Access application. I infer, but did not see stated, that branch aliases are covered, because the Access app is created for *.<project>.pages.dev.
   - Limits: Free plan: 20,000 files per site, max 25 MiB per file (also 25 MiB for Workers static assets), 500 builds per month and 1 build at a time when Cloudflare builds, 20-minute build timeout, 100 projects. Deployments are kept 30 days, but the 100 most recent and the current production deploy are always kept. Direct Upload with Wrangler: 20,000 files, 25 MiB per file. Bandwidth: static requests free and unlimited (Pages Functions would count toward 100k requests per day). No commercial-use restriction found.
   - Setup effort: Owner (about 15 to 20 minutes, one time): make a Cloudflare account, enable Zero Trust Free, add the email OTP login method and a policy allowing only their email, create an API token, paste the token and account ID into GitHub repo secrets. Assistants: add a wrangler deploy step to deploy.yml in place of peaceiris (or next to it), change the publish path, exclude files over 25 MiB, test the login flow on a preview URL, and update the docs and links (the base path is './', so a new domain needs no rebuild).
   - Fits this repo: Only partly, as things stand. The 160 MB site and 187 files are fine. 35,810,859 bytes is 34.15 MiB, which exceeds the 25 MiB per-file cap, so both copies of parts-4d3988607a0d4159.json.gz (avatar/assembled-joints/ and the frozen checkpoints/avatar-joints-1/) would be rejected. The 20 MB delivery file (19.04 MiB) and the 5 MB light file fit. Live pages avatar-test and skeleton-test name the master file in metadata; whether they actually download it was not verified. The frozen checkpoint avatar-joints-1 folder holds only that data file, and its page calls fetch() on its study asset, so that checkpoint page would likely break. Options: leave the file out of the upload and accept a broken frozen-checkpoint page on this host; serve it from R2 through a redirect (an external URL needs CORS, and privacy needs Access on a custom domain); or re-encode it under 25 MiB, which would change a frozen checkpoint and clash with CLAUDE.md rule 17.
   - Risks: The 25 MiB cap will also block any future large avatar file. Protecting the production *.pages.dev domain is a multi-step workaround that is easy to get wrong. Using only preview or branch URLs is simpler. Access login sessions expire, so the owner re-enters an email code from time to time. Two vendors to manage (GitHub and Cloudflare) plus an API token secret. Untested here: how Cloudflare serves the .json.gz/.bin.gz files (headers, auto-compression) and whether the pages still decode them correctly.
   - Sources: https://developers.cloudflare.com/pages/platform/limits/ (source read from raw.githubusercontent.com/cloudflare/cloudflare-docs, 2026-11-23); https://developers.cloudflare.com/pages/configuration/preview-deployments/ ; https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain ; https://developers.cloudflare.com/pages/get-started/direct-upload/ ; https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/ ; https://developers.cloudflare.com/workers/platform/limits/#static-assets ; https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ ; https://developers.cloudflare.com/pages/functions/pricing/ (via search) ; https://www.cloudflare.com/plans/zero-trust-services/ (via search: Free $0 up to 50 users) ; https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/ (via search)

2. **Netlify (Free / Personal / Pro, credit-based) with private project visibility**
   - How it works: Netlify hosts the built site. Either GitHub Actions uploads dist/ with the Netlify CLI, or Netlify builds from the private repo. Setting the project to Private means only the team owner can open it, after logging in to Netlify. On Free and Personal that is the only person who can. One time only, the owner creates a Netlify account, connects GitHub or creates an access token, and sets the project to Private.
   - Cost: Free: $0, 300 credits per month, a hard cap. When credits run out, projects pause until the next cycle. Personal: $9 per month for 1,000 credits. Pro: $20 per month for 3,000 credits (Netlify pricing and changelog via search; the docs defer to the dashboard for current prices). Credit costs: each successful production deploy 15 credits; Deploy Previews and branch deploys 0 credits to create; bandwidth 20 credits per GB; 2 credits per 10,000 web requests (including requests to previews). Example: Free allows at most 20 production deploys a month, Personal about 66, Pro base 200, against an estimated 400 to 500 publishes a month today. Actions minutes: unchanged if Actions builds and uploads; about 0 if Netlify builds (no Playwright gate then).
   - Site private possible: Yes, on Free. Project visibility can be set to Private: only the Team Owner on Free and Personal, reached through Netlify login. Previews (Deploy Previews, branch deploys) are private by default, with separate visibility settings for production and previews. Teams created on or after 2026-07-28 default to private for new projects. A shared password is Pro only.
   - Limits: Credit caps as above. No official per-file deploy size limit found; a Netlify forum reply (not official) recommends files of 10 MB or less. Free and Personal are single-seat. Commercial use is allowed on Free per Netlify's FAQ (via search); reselling hosting is discouraged in older staff forum answers.
   - Setup effort: Owner (about 10 minutes): create an account, connect GitHub or create a personal access token for the secret, set the project to Private, log in to Netlify once in iPhone Safari. Assistants: add a CLI deploy step with --alias or a branch deploy so each publish lands on a stable non-production URL (avoiding the 15-credit production charge), and verify the credit use after a few days.
   - Fits this repo: Probably. 160 MB and 187 files are small for Netlify. The 35.8 MB and 20 MB files exceed the forum's 'recommended 10 MB', but no hard official per-file limit was found, so this needs a real test deploy. Using production deploys on every push does NOT fit the Free plan; using draft or branch deploys does, if traffic stays modest. Rough guess (not measured): owner-only testing of 3 to 15 GB a month would cost 60 to 300 credits in bandwidth alone, so Free could run out in a heavy month. Personal ($9) has more room.
   - Risks: Running out of credits pauses the site mid-month on Free. Several 2026 forum threads report Free production deploys blocked even with credits shown as available (user reports). It is unconfirmed whether CLI draft deploys with --alias count as zero-credit 'previews'. One search summary suggested the 0-credit preview rule might be Enterprise-only, which conflicts with other docs results. Pricing changed twice in 2025-2026.
   - Sources: https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/ ; https://docs.netlify.com/deploy/protect-deploys/ ; https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ ; https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ ; https://www.netlify.com/pricing/ ; https://www.netlify.com/changelog/2026-07-14-pro-plan-credit-tiers/ ; https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/ ; https://answers.netlify.com/t/what-is-the-maximum-allowed-object-size/145182 (forum, not official). All via WebSearch on 2026-11-23; netlify.com could not be fetched directly from this session.

3. **Azure Static Web Apps (Free plan) with GitHub login + invitation role**
   - How it works: GitHub Actions builds and tests as now, then the Azure/static-web-apps-deploy action uploads dist/ (with skip_app_build). A staticwebapp.config.json route rule allows only a custom role (for example 'owner') on '/*' and redirects 401s to /.auth/login/github. The owner accepts an invitation link once, which ties their GitHub login to that role. On the iPhone they sign in with GitHub when asked.
   - Cost: Free plan $0, with 100 GB bandwidth a month included. Overage is unavailable on Free. Standard is billed per app (a Microsoft Q&A answer says about $9 a month). The official pricing page showed a placeholder price in search, so NOT confirmed. Needs an Azure account: a phone plus a non-prepaid credit or debit card for identity verification, with a temporary $1 hold. Actions minutes: the deploy runs inside GitHub Actions, so on a private repo it uses about the same minutes as today plus the upload step.
   - Site private possible: Yes, on Free. GitHub and Microsoft Entra ID logins are preconfigured on all plans. Custom roles through invitations are available on Free (25 per app). Route rules restricting a role are available on all plans. Password protection, custom auth providers and roles assigned by a function need Standard.
   - Limits: Free: 250 MB per environment (500 MB total across environments), 15,000 files, 3 preview environments, 2 custom domains, 100 GB per month bandwidth per subscription, 30 MB request size limit. Standard: 500 MB per environment, 2 GB total. No documented per-file size limit found. The plans page labels Free 'For personal projects'.
   - Setup effort: Owner (about 20 to 30 minutes): create an Azure account (card verification), create the Static Web App resource, put its deployment token in a GitHub secret, create the role invitation and open it on the iPhone. Assistants: add the deploy action and staticwebapp.config.json route rules, test logged-out and logged-in behaviour.
   - Fits this repo: Yes for now: 160 MB is under 250 MB per environment, and 187 files is far under 15,000. Only about 90 MB of headroom, though, and new avatar files or frozen checkpoints could push it over. The 35.8 MB file is not blocked by any documented per-file limit (unverified; needs a test).
   - Risks: Size ceiling is close to current growth. A third vendor with a card on file. Invitation and role setup is fiddly. A route-rule mistake (for example using the built-in 'authenticated' role) would let ANY GitHub user in. The Standard price is unconfirmed.
   - Sources: https://learn.microsoft.com/en-us/azure/static-web-apps/quotas ; https://learn.microsoft.com/en-us/azure/static-web-apps/plans ; https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization ; https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-custom#manage-roles ; https://learn.microsoft.com/en-us/azure/static-web-apps/password-protection (all read from raw.githubusercontent.com/MicrosoftDocs/azure-docs on 2026-11-23) ; https://azure.microsoft.com/en-us/pricing/details/app-service/static/ (via search, price not shown) ; https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account (via search)

4. **Vercel (Hobby free / Pro $20) with Vercel Authentication**
   - How it works: Vercel builds from the private GitHub repo on each push (Git integration) and serves the site. Vercel Authentication requires a logged-in Vercel account that belongs to the team before a deployment can be viewed. The owner logs in to Vercel once on the iPhone.
   - Cost: Hobby $0, with the first 100 GB a month of Fast Data Transfer included. Projects pause instead of being billed when they exceed the free usage. Pro: $20 a month platform fee, including 1 deploying seat and $20 of usage credit, then on-demand usage (default $200 on-demand budget). Actions minutes: about 0 if Vercel builds, but then the GitHub Actions Playwright checks would not block publishing unless kept separately.
   - Site private possible: Yes, likely even on Hobby. The docs and a changelog say Vercel Authentication can protect All Deployments, production included, on every plan. A Vercel KB guide says All Deployments is Pro/Enterprise only, and a community thread reports a Hobby owner blocked by a likely bug. Standard Protection (everything except production domains) is on all plans. Password Protection is not on Hobby.
   - Limits: Hobby: 100 deployments per day; 45-minute build max; CLI source upload max 100 MB (Hobby) / 1 GB (Pro), with 15,000 files per CLI deployment. No per-file static asset limit found. Hobby is personal or non-commercial only (Terms; Fair Use Guidelines define commercial use broadly as financial gain for anyone involved).
   - Setup effort: Owner (about 10 minutes): create a Vercel account with GitHub, import the repo, turn on Vercel Authentication > All Deployments, opt out of AI training in Team Settings > Data Preferences. Assistants: set build settings (Node version, output dir dist), check that all 40 pages build on Vercel, and decide where the tests run.
   - Fits this repo: Probably by Git integration (build on Vercel, no CLI upload). Uploading the 160 MB prebuilt dist/ from Actions with the CLI would likely exceed the Hobby 100 MB CLI limit. Per-file limits for the 35.8 MB file are unknown and need a test deploy.
   - Risks: Hobby is restricted to non-commercial use, and a game the owner wants to protect may become commercial, which would require Pro. Per the Vercel Terms and the March 2026 changelog, Hobby users' content is opted in by default to use for training Vercel's AI models and may be shared with third parties, unless they opt out. That directly conflicts with protecting the game idea; opt out immediately if chosen. The All Deployments availability on Hobby has conflicting sources.
   - Sources: https://vercel.com/docs/plans/hobby ; https://vercel.com/docs/deployment-protection ; https://vercel.com/docs/deployment-protection/usage-and-pricing ; https://vercel.com/docs/limits ; https://vercel.com/docs/plans/pro-plan ; https://vercel.com/pricing ; https://vercel.com/legal/terms ; https://vercel.com/changelog/updates-to-terms-of-service-march-2026 ; https://vercel.com/docs/limits/fair-use-guidelines ; https://community.vercel.com/t/hobby-team-owner-blocked-from-changing-vercel-authentication-to-all-deployments/49714 . All via WebSearch on 2026-11-23; vercel.com could not be fetched from this session.

5. **GitLab Pages with Pages access control (move the repo, or mirror the built site)**
   - How it works: Full move: the repo lives in a private GitLab project, GitLab CI builds, tests and publishes Pages, and access control is set to 'Only project members'. The owner logs in to GitLab on the iPhone. Hybrid (no repo move): the GitHub repo stays private, GitHub Actions pushes dist/ to a private GitLab project, and a tiny GitLab 'pages' job publishes it with the same access control.
   - Cost: GitLab Free $0. Free namespaces get 400 compute minutes a month, against roughly 4,000 a month for the current workflow, so a full move would need paid minutes or a much lighter CI. The hybrid's pages job would be short (not measured). Actions minutes: full move, none on GitHub; hybrid, unchanged on GitHub.
   - Site private possible: Yes, on Free (GitLab.com, Free/Premium/Ultimate tiers). For a private project, access control 'Only project members' means only signed-in project members can browse the site.
   - Limits: GitLab.com Pages: max site size 1 GB (tied to the 1 GB artifact limit). Free: 10 GiB storage per project (repo + LFS), 5 users per private top-level namespace, 400 compute minutes a month. Per-file Pages limit not stated beyond the artifact and site size.
   - Setup effort: Full move: large. Migrating the repo and history, rewriting CI from GitHub Actions to .gitlab-ci.yml, and re-pointing both AI assistants, which today push to GitHub. This session's tools are GitHub-based; whether Claude cloud sessions and Codex can work on GitLab was not verified. Hybrid: owner creates a GitLab account and a project token (about 15 minutes); assistants add a push step and a minimal .gitlab-ci.yml.
   - Fits this repo: 160 MB fits under 1 GB, and the 35.8 MB file is within the site and artifact limits. The full move does not fit the 400-minute budget with today's ~9-minute runs. The hybrid fits, but pushing a 160 MB build to a git repo hundreds of times a month could hit the 10 GiB project storage limit unless old history is pruned.
   - Risks: High switching cost and workflow disruption for the full move. The hybrid has two moving parts and repo-storage growth. Pages access-control changes can take up to about a minute to apply because of caching.
   - Sources: https://docs.gitlab.com/user/project/pages/pages_access_control/ ; https://docs.gitlab.com/user/gitlab_com/#gitlab-pages ; https://docs.gitlab.com/ci/pipelines/compute_minutes/ ; https://docs.gitlab.com/user/storage_usage_quotas/ ; https://docs.gitlab.com/user/free_user_limit/ (all read from the official mirror raw.githubusercontent.com/gitlabhq/gitlabhq/master/doc on 2026-11-23)

6. **Firebase Hosting (Spark free plan)**
   - How it works: GitHub Actions runs `firebase deploy` to upload dist/ to Firebase Hosting. The site is served from web.app or firebaseapp.com.
   - Cost: Spark $0: Hosting storage 10 GB, data transfer 360 MB per day, hard limits. Blaze pay-as-you-go: $0.026 per GB stored and $0.15 per GB transferred beyond that. Actions minutes unchanged.
   - Site private possible: No built-in login or password for Hosting found on the official pages searched. A server-side gate (Cloud Functions or Cloud Run in front) would need the Blaze plan and custom code. My general knowledge, not confirmed on an official page.
   - Limits: Max 2 GB per file. 10 GB storage includes the release history, so old releases must be pruned or a release-retention limit set. 360 MB per day transfer on Spark.
   - Setup effort: Owner: Google/Firebase account and project, CI token (about 15 minutes). Assistants: firebase.json and a deploy step.
   - Fits this repo: Size fits (the 35.8 MB file is far below 2 GB). But 360 MB per day is only a handful of full test sessions with 20 MB avatar loads. About 60 releases of 160 MB would fill 10 GB unless old releases are pruned. Does not meet the 'site private' goal.
   - Risks: No privacy without extra paid infrastructure. Daily transfer cap could cut testing off mid-day.
   - Sources: https://firebase.google.com/pricing ; https://firebase.google.com/docs/hosting/usage-quotas-pricing (via WebSearch 2026-11-23; firebase.google.com not fetchable from this session)

7. **AWS Amplify Hosting (password-protected branch)**
   - How it works: Connect the private GitHub repo (Amplify builds), or upload the prebuilt site manually or from CI. Amplify Access control can require a username and password (basic auth) per branch or for all branches. The owner types the password once in Safari.
   - Cost: Pay as you go. Standard build instance $0.01 per minute after 1,000 free minutes a month; storage $0.023 per GB-month after 5 GB; data transfer $0.15 per GB after 15 GB a month. The free allowances are listed as 12 months for new accounts. Since 2025-07-15, new AWS accounts instead get $100 in credits plus up to $100 more and a 6-month free plan. Rough estimate after free allowances (not from AWS): a few dollars a month for owner-only traffic, more if Amplify runs every build. Requires an AWS account with a card. Actions minutes: about 0 if Amplify builds.
   - Site private possible: Yes. Per-branch or global username and password, a built-in feature, with throttling of failed attempts. It is a shared password, not a personal login.
   - Limits: Amplify file and site size limits not found in the searched pages (unconfirmed). Pricing as above.
   - Setup effort: Owner: AWS account with card, create the Amplify app, set the branch password (about 20 to 30 minutes, AWS console is complex). Assistants: build spec, check the output, set a billing alarm.
   - Fits this repo: Unknown for the 35.8 MB file (no documented per-file limit found; needs a test). 160 MB is small for storage pricing.
   - Risks: An open-ended AWS bill and console complexity for a non-programmer. A shared password is weaker than a personal login.
   - Sources: https://aws.amazon.com/amplify/pricing/ ; https://docs.aws.amazon.com/amplify/latest/userguide/access-control.html ; https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/ (via WebSearch 2026-11-23; AWS sites not fetchable from this session)

8. **Render static site**
   - How it works: Render builds from the GitHub repo and serves the static site on onrender.com.
   - Cost: Static sites free. The Hobby workspace includes 5 GB outbound bandwidth a month; beyond that $0.15 per GB if a card is linked, otherwise services spin down until next month.
   - Site private possible: No built-in authentication for static sites (Render community and staff). Workarounds are client-side page encryption (PageCrypt or StatiCrypt, a single shared password, assets must be inlined) or an OAuth2 proxy service, which is not for static sites.
   - Limits: 5 GB a month bandwidth on Hobby. File-size limits not found.
   - Setup effort: Low for public hosting; privacy would need custom work.
   - Fits this repo: Poor. 5 GB a month is only a few hundred loads of the 20 MB avatar file, and there is no login.
   - Risks: No privacy; bandwidth cap.
   - Sources: https://render.com/docs/free ; https://render.com/docs/outbound-bandwidth ; https://community.render.com/t/password-protect-support/2484 ; https://render.com/blog/static-site-auth-pagecrypt (via WebSearch 2026-11-23)

9. **Surge**
   - How it works: GitHub Actions runs `surge dist <name>.surge.sh` with a token.
   - Cost: Free tier for public sites. Password protection (AUTH) needs Surge Pro at $30 a month, per account.
   - Site private possible: Only with Pro ($30 a month), as a password for a whole domain or specific paths.
   - Limits: File and site size limits not found on the searched pages.
   - Setup effort: Low: account and token.
   - Fits this repo: Unknown for the large files. Privacy costs more than GitHub Pro.
   - Risks: Expensive for privacy; unknown limits.
   - Sources: https://surge.sh/pricing ; https://surge.sh/docs/platform/plans (via WebSearch 2026-11-23)

10. **Deno Deploy**
   - How it works: Upload the static files (or a tiny Deno server that checks a password and then serves the files) with `deno deploy`.
   - Cost: Free plan: 1M requests a month, 20 GiB egress a month (deno.com pricing via search). Pro $20 a month.
   - Site private possible: No built-in site protection found. It would need custom server code.
   - Limits: Total deployment size should not exceed 1 GB (official docs). The service is in 'initial public beta' with no uptime guarantees.
   - Setup effort: Medium (custom auth code).
   - Fits this repo: Size fits under 1 GB, but the service is ending.
   - Risks: Deno's own pages say Deno Deploy will be shut down in April 2027, following 'Deno is joining Cloudflare'. Not recommended.
   - Sources: https://docs.deno.com/deploy/pricing_and_limits/ (read from raw.githubusercontent.com/denoland/docs, last_modified 2026-11-12) ; https://deno.com/deploy/pricing ; https://deno.com/blog/cloudflare (via WebSearch 2026-11-23)

11. **Private source repo + separate PUBLIC repo that only holds the built site (GitHub Pages on Free)**
   - How it works: Make 3D-World-4 private. Its workflow builds and publishes dist/ to a second public repo using peaceiris `external_repository` with a deploy key or token. GitHub Pages on Free serves that public repo exactly like today, at isaiasurrutia96.github.io/<public-repo>/.
   - Cost: $0 for hosting. Actions minutes: the private repo's workflow counts against the included minutes (roughly 4,000 a month at the current pace vs about 2,000 on Free), so the CI would need trimming. Moving the workflow into the public repo would make minutes free, but its logs and test artifacts would then be public.
   - Site private possible: No. The site stays public like today; only the source code is private. Minified JS, models and pages are still downloadable by anyone who finds the URL.
   - Limits: GitHub Pages: published site max 1 GB, soft bandwidth 100 GB a month, source repo recommended max 1 GB; the 10 builds-per-hour soft limit does not apply to custom Actions workflows.
   - Setup effort: Owner: create the public repo and add a deploy key (about 10 minutes), or let the assistants do it. Assistants: add external_repository plus deploy_key to deploy.yml and update the links.
   - Fits this repo: Yes: 160 MB and all files work today on Pages. The URL path changes.
   - Risks: Does not hide the game from anyone who has the link (the same exposure as today). The minutes problem remains. A deploy key must be managed.
   - Sources: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits (read from raw.githubusercontent.com/github/docs 2026-11-23) ; https://github.com/peaceiris/actions-gh-pages#%EF%B8%8F-deploy-to-external-repository-external_repository (README read 2026-11-23)

12. **Fallback: laptop server on the same Wi-Fi (LAN)**
   - How it works: Each time: open the laptop, `git pull` to get the assistants' latest pushes, `npm ci` when dependencies change, `npm run build`, then `npx vite preview --host` (vite.config.ts sets server.host 127.0.0.1, so --host is required). The iPhone, on the same Wi-Fi, opens http://<laptop-ip>:4173/... The laptop must stay awake.
   - Cost: $0. No Actions minutes are needed for testing.
   - Site private possible: Yes by nature: only devices on the home network can reach it.
   - Limits: Home Wi-Fi only. The laptop must be on.
   - Setup effort: Owner, every time: about 5 commands in a terminal plus finding the laptop's IP. Assistants could write a one-click script, but the laptop is still required.
   - Fits this repo: Not as plain HTTP. The avatar loaders (src/load-binary-study.js, used by avatar/src/official-avatar.js and avatar/src/light-avatar.js; also inlined in avatar-test and skeleton-test pages) call crypto.subtle.digest. Per MDN, crypto.subtle exists only in secure contexts (HTTPS or localhost), so on http://192.168.x.x the avatar pages would fail on the iPhone. It would need HTTPS with a self-signed or mkcert certificate trusted on the iPhone (extra one-time setup). Not verified on a real device.
   - Risks: Defeats the 'no laptop' goal. HTTPS certificate setup is fiddly. Easy to test stale code if `git pull` is forgotten.
   - Sources: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle (read from raw.githubusercontent.com/mdn/content 2026-11-23: SecureContext) ; repo files /home/user/3D-World-4/src/load-binary-study.js line 8, /home/user/3D-World-4/vite.config.ts

13. **Fallback: Cloudflare quick tunnel (cloudflared)**
   - How it works: With the laptop serving the site locally, run `cloudflared tunnel --url http://localhost:4173`. It prints a random https://<words>.trycloudflare.com link to open on the phone, from anywhere. With cloudflared 2026.9.3+, adding `--allowed-mail you@example.com` makes visitors prove their email with a one-time code first.
   - Cost: $0, no Cloudflare account needed.
   - Site private possible: Partly. The random URL is public to anyone who has it, unless --allowed-mail is used (email one-time PIN; sessions up to 4 hours; access ends when cloudflared stops).
   - Limits: Up to 200 in-flight requests per tunnel (more get HTTP 429). No uptime guarantee. No Server-Sent Events. The hostname changes every run. No bandwidth cap stated.
   - Setup effort: Owner, every time: start the local server, start cloudflared, read the new URL from the terminal and open it on the phone. One time: install cloudflared.
   - Fits this repo: Works with the large files (no file-size cap stated). HTTPS makes crypto.subtle work. The laptop must be on.
   - Risks: New link every session. Laptop dependency. Testing-only tool per Cloudflare.
   - Sources: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/ ; https://developers.cloudflare.com/pages/how-to/preview-with-cloudflare-tunnel/ (read from the docs repo 2026-11-23) ; https://blog.cloudflare.com/protected-quick-tunnels ; https://developers.cloudflare.com/changelog/post/2026-10-02-protected-quick-tunnels/ (via WebSearch)

14. **Fallback: ngrok (free plan)**
   - How it works: `ngrok http 4173` on the laptop gives a stable free dev domain (*.ngrok-free.dev or .app) to open on the phone.
   - Cost: Free plan: $0 (described as $5 of one-time included usage). Paid plans remove the warning page (price not confirmed here).
   - Site private possible: Not by default; access rules need a traffic policy (not verified for the free plan).
   - Limits: Free: 1 GB a month data transfer out, 20,000 HTTP requests a month, 4,000 requests per minute, and a browser warning page before HTML (cookie skips it for 7 days).
   - Setup effort: Owner: ngrok account and authtoken once; every time start the server plus ngrok.
   - Fits this repo: No. 1 GB a month is only about 50 loads of the 20 MB avatar file.
   - Risks: Quota exhausted quickly; warning page; laptop dependency.
   - Sources: https://ngrok.com/docs/pricing-limits/free-plan-limits ; https://ngrok.com/pricing (via WebSearch 2026-11-23)

15. **Fallback: Tailscale Serve (private HTTPS link to the laptop)**
   - How it works: Install Tailscale on the laptop and the iPhone (same account). On the laptop run `tailscale serve --bg 4173` once. Afterwards the phone opens a stable https://<laptop>.<tailnet>.ts.net link from anywhere while both devices are signed in. Each test still needs the laptop on with fresh code built and the local server running.
   - Cost: $0 on the free Personal plan (Serve not found to be restricted to paid plans; pricing page not checked).
   - Site private possible: Yes. Only devices in the owner's tailnet can reach it. Not exposed to the public internet.
   - Limits: Laptop must be on and online. Needs MagicDNS and HTTPS certificates, enabled by default for new tailnets.
   - Setup effort: Owner, one time: install the app on both devices and log in. Every time: pull, build, start the server (Serve can stay configured in the background).
   - Fits this repo: Yes for file sizes. A valid HTTPS certificate makes crypto.subtle work. Still needs the laptop.
   - Risks: Laptop dependency and stale-code risk. A VPN app on the iPhone.
   - Sources: https://tailscale.com/docs/features/tailscale-serve ; https://tailscale.com/docs/reference/tailscale-cli/serve (via WebSearch 2026-11-23)

### Facts

1. **Cloudflare Pages Free: max 25 MiB per file, 20,000 files per site, 500 builds per month, 1 concurrent build, 20-minute build timeout; Wrangler Direct Upload 20,000 files and 25 MiB per file.**
   - Source: https://developers.cloudflare.com/pages/platform/limits/ and https://developers.cloudflare.com/pages/get-started/direct-upload/ (source read from raw.githubusercontent.com/cloudflare/cloudflare-docs on 2026-11-23)
   - Confidence: confirmed

2. **The 35.8 MB master file is 35,810,859 bytes = 34.15 MiB, over Cloudflare's 25 MiB per-file cap. The 20 MB delivery file (19,962,239 bytes = 19.04 MiB) is under it. Both copies of parts-4d3988607a0d4159.json.gz exist: avatar/assembled-joints/ and checkpoints/avatar-joints-1/.**
   - Source: Local repo: /home/user/3D-World-4/avatar/assembled-joints/, /home/user/3D-World-4/checkpoints/avatar-joints-1/
   - Confidence: confirmed

3. **The frozen checkpoint page checkpoints/avatar-joints-1/index.html fetches a study asset, and that folder's only data file is the 35.8 MB parts file, so that page most likely downloads it. Hosts with a 25 MiB cap would break that page.**
   - Source: /home/user/3D-World-4/checkpoints/avatar-joints-1/index.html (fetch(i) in the study loader); folder listing
   - Confidence: likely

4. **Cloudflare Pages: an 'Enable access policy' toggle protects preview deployments with Cloudflare Access. Protecting the *.pages.dev production domain needs a documented manual workaround, and a custom domain needs its own Access app.**
   - Source: https://developers.cloudflare.com/pages/configuration/preview-deployments/ ; https://developers.cloudflare.com/pages/platform/known-issues/ (read 2026-11-23)
   - Confidence: confirmed

5. **Requests to static assets are free and unlimited on Cloudflare Workers static assets and on Pages (Pages Functions requests count toward the Workers free quota of 100k per day).**
   - Source: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ (read 2026-11-23); https://developers.cloudflare.com/pages/functions/pricing/ (via search)
   - Confidence: confirmed

6. **Cloudflare Zero Trust Free plan is $0 for up to 50 users; the email one-time PIN login method must be added manually for new organizations.**
   - Source: https://www.cloudflare.com/plans/zero-trust-services/ and https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/ (via WebSearch 2026-11-23)
   - Confidence: likely

7. **Netlify credit-based Free plan: 300 credits per month, hard cap, projects pause when credits run out. Each successful production deploy costs 15 credits; Deploy Previews and branch deploys cost 0 credits to create; bandwidth 20 credits per GB; web requests 2 credits per 10,000.**
   - Source: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ (via WebSearch 2026-11-23; netlify.com blocked for direct fetch)
   - Confidence: likely

8. **Netlify Personal is $9/month with 1,000 credits; Pro is $20/month with 3,000 credits (higher Pro tiers up to 20,000 credits). The docs defer to the dashboard for current prices.**
   - Source: https://www.netlify.com/pricing/ ; https://www.netlify.com/changelog/2026-07-14-pro-plan-credit-tiers/ (via WebSearch 2026-11-23)
   - Confidence: likely

9. **Netlify project visibility: on credit-based Free and Personal plans a Private project can be seen only by the Team Owner, through Netlify login. Previews are private by default. Shared-password protection is Pro only. Teams created on or after 2026-07-28 default to private for new projects.**
   - Source: https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/ ; https://docs.netlify.com/deploy/protect-deploys/ (via WebSearch 2026-11-23)
   - Confidence: likely

10. **No official Netlify per-file deploy size limit was found; a forum reply (not official) recommends 10 MB or less per file.**
   - Source: https://answers.netlify.com/t/what-is-the-maximum-allowed-object-size/145182 (via WebSearch)
   - Confidence: unconfirmed

11. **Netlify's FAQ says the Free plan has no restriction on commercial use.**
   - Source: netlify.com pages via WebSearch 2026-11-23 (exact page not opened)
   - Confidence: likely

12. **Vercel Hobby is limited to personal or non-commercial use; Hobby includes 100 GB a month Fast Data Transfer and 100 deployments per day; Hobby projects pause instead of paying overage.**
   - Source: https://vercel.com/legal/terms ; https://vercel.com/docs/plans/hobby ; https://vercel.com/docs/limits (via WebSearch 2026-11-23; vercel.com blocked for direct fetch)
   - Confidence: likely

13. **Vercel Authentication can protect All Deployments, production included, on all plans including Hobby. One Vercel KB guide says Pro/Enterprise only, and a community thread reports a likely bug blocking it on Hobby. Password Protection is not on Hobby.**
   - Source: https://vercel.com/docs/deployment-protection ; https://vercel.com/docs/deployment-protection/usage-and-pricing ; https://community.vercel.com/t/hobby-team-owner-blocked-from-changing-vercel-authentication-to-all-deployments/49714 (via WebSearch)
   - Confidence: likely

14. **Under Vercel's Terms (March 2026 update), Hobby and trial-Pro users are opted in by default to Vercel using their content to train AI models (and sharing it with third parties); they can opt out in Team Settings > Data Preferences.**
   - Source: https://vercel.com/legal/terms ; https://vercel.com/changelog/updates-to-terms-of-service-march-2026 (via WebSearch 2026-11-23)
   - Confidence: likely

15. **Vercel Pro is a $20/month platform fee including one deploying seat and $20 of usage credit. The Vercel CLI source upload limit is 100 MB on Hobby and 1 GB on Pro.**
   - Source: https://vercel.com/docs/plans/pro-plan ; https://vercel.com/docs/limits (via WebSearch)
   - Confidence: likely

16. **Azure Static Web Apps Free: 250 MB storage per environment (500 MB total), 15,000 files, 100 GB bandwidth a month (no overage on Free), 3 preview environments, 25 custom-role invitations, 30 MB request size limit. Standard: 500 MB per environment, 2 GB total.**
   - Source: https://learn.microsoft.com/en-us/azure/static-web-apps/quotas (read from raw.githubusercontent.com/MicrosoftDocs/azure-docs 2026-11-23)
   - Confidence: confirmed

17. **Azure Static Web Apps: preconfigured GitHub and Microsoft Entra ID login and all authentication features in that article are available on all plans; custom roles can be assigned with the invitations system; custom providers, role functions and password protection need Standard.**
   - Source: https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization ; https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-custom ; https://learn.microsoft.com/en-us/azure/static-web-apps/password-protection (read 2026-11-23)
   - Confidence: confirmed

18. **Azure Static Web Apps Standard costs about $9 per app per month.**
   - Source: Microsoft Q&A answers via WebSearch; https://azure.microsoft.com/en-us/pricing/details/app-service/static/ showed only a placeholder in search
   - Confidence: unconfirmed

19. **An Azure account needs a phone number and a non-prepaid credit or debit card for identity verification (temporary hold of about $1).**
   - Source: https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account (via WebSearch)
   - Confidence: likely

20. **GitLab Pages access control is available on the Free tier on GitLab.com. For a private project, 'Only project members' limits the site to signed-in members.**
   - Source: https://docs.gitlab.com/user/project/pages/pages_access_control/ (read from github.com/gitlabhq/gitlabhq mirror 2026-11-23)
   - Confidence: confirmed

21. **GitLab.com: Pages max site size 1 GB; Free namespaces get 400 compute minutes a month; 10 GiB storage per Free project; private top-level namespaces on Free are limited to 5 users.**
   - Source: https://docs.gitlab.com/user/gitlab_com/ ; https://docs.gitlab.com/ci/pipelines/compute_minutes/ ; https://docs.gitlab.com/user/storage_usage_quotas/ ; https://docs.gitlab.com/user/free_user_limit/ (read 2026-11-23)
   - Confidence: confirmed

22. **Firebase Hosting Spark: 10 GB storage and 360 MB per day transfer (hard limits); max 2 GB per file; no built-in Hosting password or login found.**
   - Source: https://firebase.google.com/pricing ; https://firebase.google.com/docs/hosting/usage-quotas-pricing (via WebSearch); the no-login point is from general knowledge
   - Confidence: likely

23. **Render Hobby workspace includes 5 GB outbound bandwidth a month and static sites count against it; Render has no built-in auth for static sites.**
   - Source: https://render.com/docs/outbound-bandwidth ; https://render.com/docs/free ; https://community.render.com/t/password-protect-support/2484 (via WebSearch)
   - Confidence: likely

24. **Surge password protection requires Surge Pro at $30 a month.**
   - Source: https://surge.sh/pricing (via WebSearch)
   - Confidence: likely

25. **AWS Amplify Hosting supports a username and password per branch or for all branches. Pricing after free allowances: build $0.01 per minute, storage $0.023 per GB-month, transfer $0.15 per GB. New AWS accounts since 2025-07-15 get a credit-based free plan ($100 plus up to $100 more, 6 months).**
   - Source: https://docs.aws.amazon.com/amplify/latest/userguide/access-control.html ; https://aws.amazon.com/amplify/pricing/ ; https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/ (via WebSearch)
   - Confidence: likely

26. **Deno Deploy: total deployment size should not exceed 1 GB; Deno's pages say the service will be shut down in April 2027.**
   - Source: https://docs.deno.com/deploy/pricing_and_limits/ (read from github denoland/docs 2026-11-23) ; https://deno.com/deploy and https://deno.com/blog/cloudflare (via WebSearch)
   - Confidence: likely

27. **The avatar loaders use crypto.subtle.digest, which browsers expose only in secure contexts (HTTPS or localhost). Plain-HTTP Wi-Fi testing at http://192.168.x.x would therefore break avatar loading on the iPhone.**
   - Source: /home/user/3D-World-4/src/load-binary-study.js line 8 (imported by avatar/src/official-avatar.js and avatar/src/light-avatar.js); https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle (SecureContext, read from mdn/content 2026-11-23)
   - Confidence: confirmed

28. **vite.config.ts sets base './' (relative paths, so moving to another host needs no base-path change) and server.host '127.0.0.1' (LAN testing needs --host).**
   - Source: /home/user/3D-World-4/vite.config.ts
   - Confidence: confirmed

29. **Cloudflare quick tunnels need no account, give a random trycloudflare.com hostname that changes each run, allow 200 in-flight requests, and have no uptime guarantee. cloudflared 2026.9.3+ adds --allowed-mail email one-time-PIN protection.**
   - Source: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/ ; https://blog.cloudflare.com/protected-quick-tunnels ; https://developers.cloudflare.com/changelog/post/2026-10-02-protected-quick-tunnels/ (via WebSearch)
   - Confidence: likely

30. **ngrok free plan: 1 GB a month data transfer, 20,000 HTTP requests a month, and a browser warning page in front of HTML.**
   - Source: https://ngrok.com/docs/pricing-limits/free-plan-limits (via WebSearch)
   - Confidence: likely

31. **Tailscale Serve exposes a local server over HTTPS only to devices in the owner's tailnet and works with a free Personal account.**
   - Source: https://tailscale.com/docs/features/tailscale-serve (via WebSearch)
   - Confidence: likely

32. **GitHub Pages: published sites max 1 GB, soft bandwidth 100 GB a month; the 10 builds-per-hour soft limit does not apply to custom Actions workflows. peaceiris/actions-gh-pages can publish to another repo with external_repository plus deploy_key or personal_token.**
   - Source: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits ; https://github.com/peaceiris/actions-gh-pages (both read from raw.githubusercontent.com 2026-11-23)
   - Confidence: confirmed

33. **At the measured 1,086 billed minutes in 8 days, a private repo running the same workflow would use roughly 4,000 Actions minutes a month, about 400 to 500 publish runs at about 9 minutes each. Derived from the lead's figures, not measured by me.**
   - Source: Arithmetic on the facts given in the task
   - Confidence: likely

34. **This session could not open netlify.com, vercel.com, azure.microsoft.com, learn.microsoft.com, firebase.google.com, render.com, surge.sh, aws.amazon.com, deno.com, ngrok.com, developers.cloudflare.com or docs.gitlab.com directly (DNS/proxy block). Those hosts must be allowed in the session's network settings for first-hand page checks.**
   - Source: WebFetch and curl errors in this session, 2026-11-23
   - Confidence: confirmed

## Research: fit
**Summary:** I measured how well the repo fits each hosting route by reading the checkout and the local origin/gh-pages ref. That ref is the deploy commit 8748d6a, built from source 271405b at 16:42 UTC on 23 Nov 2026. main has moved on to 8afe021, so sizes may differ slightly.

Published site: 188 files (187 plus the empty .nojekyll), 161,304,323 bytes, 40 HTML pages.

Files over 20 MB or over 25 MiB: exactly 2. Both are copies of the 35,810,859-byte avatar master parts-4d3988607a0d4159.json.gz:
- dist/avatar/assembled-joints/: no live page fetches this copy. tests/avatar/official-browser.mjs:67 asserts that the browser never fetches it.
- dist/checkpoints/avatar-joints-1/: the frozen viewer DOES fetch this copy every time it opens (checkpoints/avatar-joints-1/index.html:3866: `xb()` → `_u()` → `fetch(new URL("parts-4d39…json.gz", page))`). No page or menu links to that checkpoint; only docs mention it.

The next-largest file is delivery-46ecd0edf2e3c07b.bin.gz at 19,962,239 B, just under 20 MB. The Skeleton page loads it by default.

Paths:
- All published pages use relative URLs (vite base './', and the custom builds use './' and '../'). No root-absolute src or href and no hard-coded site URL appear in any published file, so the site works on another domain or path without code changes.
- No service worker exists anywhere.
- The home-screen app manifest is fully relative.

The one coupling that would block a publish is a test. test-lab/foundation-browser.mjs:27-32 reads the README links "Open Test Lab", "Drive the Racing Lab" and "Inspect the tracks" and asserts that their path starts with /3D-World-4/. If the README links change to a root path (pages.dev, netlify.app) or to a different repo name, the CI browser check fails and nothing publishes, unless the test prefix is changed too (or the site is uploaded inside a /3D-World-4/ subfolder).

What changes on each route:
- **GitHub Pro:** nothing in the repo or workflow.
- **Build-only public repo:** about 3 lines in deploy.yml (external_repository plus a deploy key or token), and README and test-prefix edits unless the URL path stays /3D-World-4/.
- **Cloudflare direct upload:** replace the peaceiris step with a wrangler step and 2 secrets. Also stop publishing the two 35.8 MB files, because Cloudflare's per-file limit is 25 MiB (from search results, not fetched). That breaks the frozen avatar-joints-1 viewer unless its file is hosted elsewhere.
- **Netlify:** replace the peaceiris step with a netlify-cli step and 2 secrets. No hard file cap was found. A forum moderator recommends files of 10 MB or less (unconfirmed), and 3 files exceed that.

Actions minutes: the brief's 1,086 billed minutes for 16-23 Nov extrapolate to roughly 4,000 per month. That is above both the Free allowance (about 2,000) and the Pro allowance (about 3,000), on any route that keeps building privately on Actions. The workflow also runs the full suite on pull_request events.

Domain change: the home-screen icon keeps opening the old URL and must be re-added. localStorage and the avatar Cache Storage start empty on a new origin, so the first visit downloads the 20 MB avatar file again.

3D-WORLD-3: nothing in the build, CI or runtime reads that repo or its Pages site. There are only doc and provenance links, plus manual capture tools that take a local path.

Network limits: developers.cloudflare.com, docs.netlify.com and answers.netlify.com do not resolve from this session. isaiasurrutia96.github.io returns 403 from the proxy. All web limits below come from search-result summaries and are marked as such.

### Options

1. **GitHub Pro (make 3D-World-4 private, keep Pages from the gh-pages branch)**
   - How it works: The owner upgrades the account to Pro and switches the repo to private. The existing workflow keeps running tests, building, and pushing dist to the gh-pages branch of the same repo with GITHUB_TOKEN. Pages keeps serving the same URL. The owner does this once, in GitHub settings.
   - Cost: Pro is about $4/month per third-party sites. This was NOT confirmed on github.com/pricing (from the brief, not re-checked here). Actions: all runs become billed minutes against Pro's included allowance of about 3,000 per month (brief). The measured 1,086 minutes over 16-23 Nov extrapolate to about 4,070 per 30 days (1,086/8×30), which would exceed 3,000 unless the workflow is trimmed. Trims: the pull_request trigger at deploy.yml:7-9 runs the full suite without publishing; Playwright runs every time at deploy.yml:34-37.
   - Site private possible: No. Per the brief's verified facts, a Pages site from a private repo is still public, and access-controlled Pages needs Enterprise Cloud. The public site also exposes the minified game bundles plus 66 JSON and 2 MD files: checkpoint README.md, CHECKPOINT.json, PROFILES.json and the checks/*.json test results under checkpoints/driving-1 and driving-2.
   - Limits: These are the current GitHub Pages limits, which the site already fits. The 35.8 MB file is published today with no problem.
   - Setup effort: Owner: upgrade to Pro, then Settings → General → Change visibility to private. Confirm Settings → Pages still shows the gh-pages branch source. Assistants: no code change needed. Optionally trim the workflow to save minutes. Both assistants' GitHub access must cover a private repo; it likely already does but was not checked.
   - Fits this repo: Yes, with zero file changes. deploy.yml is unchanged: permissions contents: write at lines 12-13 and peaceiris with github_token at lines 45-52 both work in the same repo. The URL stays isaiasurrutia96.github.io/3D-World-4/, so README links, the test-lab/foundation-browser.mjs:31 prefix check, docs links and the home-screen icon all keep working.
   - Risks: Expected minutes (about 4,000/month) exceed the Pro allowance unless the workflow is trimmed, so overage billing or blocked runs are possible. The site stays publicly reachable by URL. The game idea is still visible to anyone who finds the URL.
   - Sources: .github/workflows/deploy.yml:1-52; test-lab/foundation-browser.mjs:7,27-32; README.md:5-7. Pro price and minute allowances come from the lead's brief, unconfirmed on github.com/pricing.

2. **Build-only public repo (source private on Free; built site pushed to a separate public repo's Pages)**
   - How it works: 3D-World-4 becomes private on the Free plan. A new public repo (for example isaiasurrutia96/<site-repo>) holds only the built output on its gh-pages branch, and Pages serves it. The private repo's workflow builds and tests as now, then pushes dist into the public repo with a deploy key. The owner creates the public repo once and adds one secret.
   - Cost: $0 in plan fees. Actions minutes for build and test are billed in the private repo against the Free allowance of about 2,000 per month (brief). The extrapolated about 4,070 per month would exceed that unless the workflow is trimmed. The Pages build in the public site repo runs there, not in the private repo.
   - Site private possible: No. The site repo and the site are public. The built site contains the minified game code, all assets, checkpoint README/CHECKPOINT/PROFILES files and test-result JSON, so the idea stays visible to anyone with the URL. Only the readable source and history become private.
   - Limits: Same GitHub Pages limits as today; the current site already fits.
   - Setup effort: Owner, once:
1. Create the public site repo.
2. Enable Pages from gh-pages.
3. Add a deploy key with write access to the site repo (public half).
4. Add the private half as secret ACTIONS_DEPLOY_KEY in 3D-World-4 (or use a PAT as PERSONAL_TOKEN).

Assistants: edit deploy.yml lines 45-52. Add `external_repository: isaiasurrutia96/<site-repo>` and replace `github_token` with `deploy_key: ${{ secrets.ACTIONS_DEPLOY_KEY }}`. Per the action's docs (via search), GITHUB_TOKEN cannot push to an external repo. If the URL path changes, also update the README links and the `prefix` constant in test-lab/foundation-browser.mjs:7. The other three local test prefixes are only local-server paths and can stay.
   - Fits this repo: Yes, as long as the path issue is handled. A new repo name changes the URL to isaiasurrutia96.github.io/<site-repo>/. Relative paths make every page work there unchanged. test-lab/foundation-browser.mjs:31 asserts that README link paths start with '/3D-World-4/', so README edits without a test edit would fail CI and block publishing. Only the URL path can be kept: rename the private source repo, then name the new public site repo 3D-World-4. Per GitHub's rename docs (not re-fetched today), reusing an old name breaks the rename redirects, so every assistant's git remote would have to be repointed to the renamed source repo. Doc links in 18 files go stale but break nothing functional.
   - Risks: The site and the built game stay public. A second repo is one more thing to maintain. A deploy key or PAT secret is a credential to manage. Using a new URL means re-adding the home-screen icon. The rename trick risks assistants pushing to the wrong repo.
   - Sources: .github/workflows/deploy.yml:45-52; test-lab/foundation-browser.mjs:7,27-32. peaceiris external_repository/deploy_key behavior from search-result summaries of the action's README and source: https://deepwiki.com/peaceiris/actions-gh-pages/2-authentication-methods and https://redirect.github.com/peaceiris/actions-gh-pages/blob/32bd89aa59ae39e1698902e7604f3d20e9234352/src/set-tokens.ts. GitHub rename redirect caveat from memory of https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository (not fetched).

3. **Cloudflare Pages, direct upload from GitHub Actions (wrangler)**
   - How it works: The repo goes private on Free. The same workflow builds and tests, then uploads dist to a Cloudflare Pages project with `wrangler pages deploy` instead of pushing to gh-pages. The site lives at <project>.pages.dev (or a custom domain). The owner creates a Cloudflare account and project once and adds 2 GitHub secrets.
   - Cost: Cloudflare pricing was not verified in this topic; the official pages were unreachable from this session. Actions minutes are the same as the build-only route: billed against Free's about 2,000 per month (brief), with about 4,070 per month extrapolated, so trimming is needed.
   - Site private possible: Possibly, via Cloudflare Access (Zero Trust) in front of the pages.dev or custom domain. NOT checked in this topic; other agents should confirm terms and free-user limits. Login cookies inside an iPhone home-screen web app may need a separate login; untested.
   - Limits: Per-file limit is 25 MiB on every plan. Free plan: 20,000 files per site; paid: 100,000. Both come from search-result summaries of https://developers.cloudflare.com/pages/platform/limits/ and the 2026-01-23 changelog; I could not fetch the official pages directly. This repo: 2 files exceed 25 MiB (both 35,810,859 B). The next largest is 19,962,239 B, under the limit. 188 files is far below 20,000.
   - Setup effort: Owner, once: create a Cloudflare account and Pages project, create an API token with Pages edit rights, and add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID as GitHub secrets. If wanted, set up Access.

Assistants:
1. Replace deploy.yml:45-52 with a wrangler step.
2. Drop `contents: write` (lines 12-13) to read-only.
3. Keep both 35.8 MB files out of the upload. Either remove the copy at scripts/build-official-avatar-page.mjs:37 (unused by live pages, proven by tests/avatar/official-browser.mjs:67), or `rm` both from dist before deploying. The frozen checkpoint copy comes in via scripts/build-checkpoints.mjs:17, which copies the whole folder. The repo files stay; the build hash-checks them at scripts/build-checkpoints.mjs:12-14 and build-official-avatar-page.mjs:11-14.
4. Handle the path: either update the README links and the test prefix, or upload dist inside a '3D-World-4/' subfolder so paths stay /3D-World-4/… and only the host changes in the README.
   - Fits this repo: Only with changes. The 25 MiB cap forces dropping both copies of the master file. Dropping the live copy is harmless. Dropping the checkpoints/avatar-joints-1 copy makes that frozen viewer show its load error (checkpoints/avatar-joints-1/index.html:3866). Keeping it working means hosting the file elsewhere and redirecting, which needs CORS on the target; that path is untested and unconfirmed. Relative paths work at pages.dev root or under a subfolder. The README-path test at test-lab/foundation-browser.mjs:31 must be handled as described.
   - Risks: The avatar loader hashes the raw downloaded bytes and gunzips them itself (src/load-binary-study.js:5-10; src/study-binary.js:53-58; src/study-asset.js:16). If a host serves *.gz files with `Content-Encoding: gzip`, the browser decompresses them automatically and the page fails with 'Saved avatar checksum mismatch'. GitHub Pages works today. Cloudflare's behaviour is unverified, so do one test deploy and open the Skeleton, New avatar, wrist and elbow pages. Other risks: a new domain means re-adding the home-screen icon, and Cloudflare is one more account and token to manage.
   - Sources: Cloudflare limits from WebSearch summaries of https://developers.cloudflare.com/pages/platform/limits and https://developers.cloudflare.com/changelog/2026-01-23-pages-file-limit-increase/ (direct fetch failed: host not resolvable from this session). Repo: scripts/build-official-avatar-page.mjs:11-14,37; scripts/build-checkpoints.mjs:12-17; tests/avatar/official-browser.mjs:67; checkpoints/avatar-joints-1/index.html:3866; src/load-binary-study.js:5-22.

4. **Netlify, deploy built dist from GitHub Actions (netlify-cli)**
   - How it works: The repo goes private on Free. The workflow builds and tests, then runs `netlify deploy --prod --dir=dist` with a Netlify token, instead of using peaceiris. The site lives at <name>.netlify.app. The owner creates the Netlify account and site once and adds 2 secrets.
   - Cost: Netlify pricing was not verified in this topic; docs.netlify.com was unreachable from this session. Actions minutes are the same as the build-only route: Free about 2,000 per month vs about 4,070 per month extrapolated, so trimming is needed.
   - Site private possible: Netlify offers password and visitor access control. Plan requirements and price were NOT checked in this topic; another agent should confirm.
   - Limits: No hard per-file or total cap was found. Per WebSearch summaries of Netlify forum answers, a moderator recommends individual deploy files of no more than 10 MB, and larger files can upload unreliably. This is unconfirmed and not an official hard limit (https://answers.netlify.com/t/what-is-the-maximum-allowed-object-size/145182). This repo has 3 files over 10 MB: the 35.8 MB master ×2 and the 19.96 MB delivery file. The delivery file is the default model of the Test Lab Skeleton page (skeleton-test/main.js:21-22; public/test-lab/main.js:6).
   - Setup effort: Owner, once: create the Netlify account and site, create a personal access token, and add NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID as GitHub secrets.

Assistants:
- Replace deploy.yml:45-52 with a netlify-cli step.
- Drop the unused live master copy (scripts/build-official-avatar-page.mjs:37).
- Decide what to do with the checkpoints/avatar-joints-1 copy.
- Handle the README-path test the same way as on Cloudflare.
   - Fits this repo: Probably, but with upload-reliability risk for the 3 files over 10 MB. Removing the unused 35.8 MB live copy is a cheap improvement on any route; it cuts the site to 125,493,464 B. Relative paths work at netlify.app root. The same README path test (test-lab/foundation-browser.mjs:31) must be handled.
   - Risks: Same .gz Content-Encoding risk as Cloudflare: the behaviour is unverified, so one test deploy is needed. Large-file upload flakiness could fail publishes. A new domain means the home-screen icon must be re-added and storage starts empty. Netlify is one more account and token.
   - Sources: WebSearch summaries of https://answers.netlify.com/t/what-is-the-maximum-allowed-object-size/145182 and https://answers.netlify.com/t/free-plan-website-size-limit/2084 (direct fetch failed). Repo: skeleton-test/main.js:21-22; public/test-lab/main.js:6-7; scripts/build-official-avatar-page.mjs:37.

### Facts

1. **The published site (local origin/gh-pages ref, deploy commit 8748d6a of source 271405b, 16:42 UTC 23 Nov 2026) has 188 files including an empty .nojekyll, totalling 161,304,323 bytes, with 40 HTML files. main has since moved to 8afe021 (18:08 UTC).**
   - Source: git ls-tree -r -l origin/gh-pages in /home/user/3D-World-4 (checked 23 Nov 2026)
   - Confidence: confirmed

2. **Files over 20 MB and over 25 MiB (26,214,400 B): exactly 2, both 35,810,859 B, at avatar/assembled-joints/parts-4d3988607a0d4159.json.gz and checkpoints/avatar-joints-1/parts-4d3988607a0d4159.json.gz. Next largest: avatar/assembled-joints/delivery-46ecd0edf2e3c07b.bin.gz at 19,962,239 B, under 20 MB. Files over 10 MB: 3. Files over 5 MB: 5 (adding new-avatar/torso-sockets.bin at 6,536,120 B and light-33cc0f6789deec6f.bin.gz at 5,167,402 B).**
   - Source: git ls-tree -r -l origin/gh-pages
   - Confidence: confirmed

3. **No live page fetches the 35.8 MB master copy at dist/avatar/assembled-joints/. Live avatar pages load delivery-*.bin.gz (avatar/src/official-avatar.js:18-19) or the light and game copies (avatar/src/light-avatar.js:22). tests/avatar/official-browser.mjs:67 asserts 'The browser must not fetch the large master'. The build copies the master anyway at scripts/build-official-avatar-page.mjs:37.**
   - Source: /home/user/3D-World-4/avatar/src/official-avatar.js; scripts/build-official-avatar-page.mjs; tests/avatar/official-browser.mjs; scan of all published HTML/JS for `new URL(<partsVar>.asset` (0 hits in avatar-test and skeleton-test)
   - Confidence: confirmed

4. **The frozen checkpoint viewer checkpoints/avatar-joints-1/index.html DOES load its own copy of parts-4d3988607a0d4159.json.gz each time it opens. Its entry point xb() calls _u(), which fetches new URL(Ks.asset, document.baseURI), where Ks.asset = 'parts-4d3988607a0d4159.json.gz'. All of this is on line 3866. No page or menu links to this checkpoint; it is only mentioned in avatar/README.md:3, avatar/ANIMATION-HANDOFF.md:3 and avatar/VALIDATION.json:57.**
   - Source: /home/user/3D-World-4/checkpoints/avatar-joints-1/index.html:3866; grep for 'avatar-joints-1'
   - Confidence: confirmed

5. **The master file must stay in the repo, even if it is not published. The build hash-checks it at scripts/build-official-avatar-page.mjs:11-14 and scripts/build-checkpoints.mjs:12-14, which reads CHECKPOINT.json files_sha256. CI tests read it from disk at tests/avatar/official-avatar.mjs:11 and tests/avatar/delivery.mjs:12. scripts/build-checkpoints.mjs:17 copies each whole checkpoint folder into dist.**
   - Source: repo files listed
   - Confidence: confirmed

6. **Removing both 35.8 MB copies from the upload would cut the published site to 89,682,605 B. Removing only the unused live copy gives 125,493,464 B.**
   - Source: arithmetic on git ls-tree sizes
   - Confidence: confirmed

7. **All pages use relative URLs: vite.config.ts:5 has base './'; custom builds use './' and '../' (for example avatar/src/official-avatar.js:18 '../avatar/assembled-joints/', public/test-lab/index.html '../racing-lab/'). A scan of all published HTML and JS found no root-absolute src or href, no absolute fetch, and no '3D-World-4' or github.io URL except the fflate license URL and the <title> of index.html.**
   - Source: scan of origin/gh-pages files saved to (scratch folder, not saved) hosting/pages
   - Confidence: confirmed

8. **The CI browser check couples the README to the URL path. test-lab/foundation-browser.mjs:27-32 reads README.md links 'Open Test Lab', 'Drive the Racing Lab' and 'Inspect the tracks' (README.md:5-7) and asserts that url.pathname starts with '/3D-World-4/'; only the host is ignored. Changing those links to a root path or another repo name without changing `prefix` (line 7) fails deploy.yml:37, so nothing publishes. Other local-server prefixes, which never touch the real domain: tests/avatar/official-browser.mjs:7, racing-lab/tests/home-screen-browser.mjs:11, racing-lab/tests/app-browser.mjs:7.**
   - Source: /home/user/3D-World-4/test-lab/foundation-browser.mjs; scripts/check-lab-foundations-browser.mjs:11-23
   - Confidence: confirmed

9. **Hard-coded 'isaiasurrutia96.github.io/3D-World-4' URLs exist only in docs, data and tests, never in shipped page code. They are in README.md:5,6,7,11,23,24; checkpoints/README.md:8,20,28,38; checkpoints/driving-1/README.md:7; checkpoints/driving-2/README.md:6; preview_url in checkpoints/{avatar-2,test-lab-1,motion-lab-1,island-1,driving-1,driving-2}/CHECKPOINT.json (frozen); racing-core/PLAN.md:551,667; avatar-lab/README.md:9; docs/karts/F1-DRIVING-REFERENCE.md:190; docs/karts/GT3-DRIVING-REFERENCE.md:96,213; docs/HANDOFF.md:154; and racing-lab/tests/app.test.mjs:6, where it is a sample base for URL math only and passes on any domain. The checkpoint README.md files in driving-1 and driving-2 are hash-pinned in files_sha256 and should not be edited.**
   - Source: grep -rn 'isaiasurrutia96.github.io' (18 files)
   - Confidence: confirmed

10. **There is no service worker anywhere in the repo. PWA manifests: racing-lab/manifest.webmanifest (id './?drive=1', start_url './?drive=1', scope './', relative icons) and frozen copies in checkpoints/driving-1 and checkpoints/driving-2. Apple tags are injected by racing-lab/build.mjs:12 (apple-touch-icon ./icons/apple-touch-icon.png). racing-core/PLAN.md:205-206 records the relative URLs and the absence of a service worker.**
   - Source: /home/user/3D-World-4/racing-lab/manifest.webmanifest; racing-lab/build.mjs:12-17; racing-core/PLAN.md:205-208
   - Confidence: confirmed

11. **With GitHub Pro the home-screen app is unaffected because the URL stays the same. On a domain or path change, the existing iPhone icon keeps opening the old saved URL, so the owner must open the new link in Safari and use Share → Add to Home Screen again, then delete the old icon. On Free-plan private, the old URL stops serving.**
   - Source: racing-core/PLAN.md:207 (manual add flow); general web-app behaviour, not tested on a device
   - Confidence: likely

12. **Browser storage is per origin, so a domain change resets it. That covers the skeleton page's localStorage keys 'skeletonAvatar' and 'skeletonQuality' (skeleton-test/main.js:21,25,54,98) and the Cache Storage 'approved-study-bytes-v1' that keeps the verified avatar bytes (src/load-binary-study.js:4,14-21). The first visit on a new domain re-downloads the about 20 MB delivery file.**
   - Source: repo files; same-origin storage rule of the web platform
   - Confidence: confirmed

13. **Gzip serving risk on a new host. The avatar loader SHA-256-checks the raw downloaded bytes, then gunzips in JS (src/load-binary-study.js:5-10; src/study-binary.js:53-58; src/study-asset.js:16). A host that served *.gz with Content-Encoding: gzip would make the browser decompress them, and loading would fail with 'Saved avatar checksum mismatch'. GitHub Pages works today. Cloudflare and Netlify behaviour was not verified, so one test deploy is needed.**
   - Source: repo code; host behaviour unverified (live hosts blocked from this session)
   - Confidence: unconfirmed

14. **deploy.yml runs on push to main, on pull_request to main, and manually (lines 3-10). Every run does npm ci, three Node test sets, the build, a Playwright install of chromium and webkit, and 11 sequential browser suites (scripts/check-lab-foundations-browser.mjs:11-23, each with a 300 s timeout). Publishing is skipped only for PRs (line 46). Concurrency cancels in-progress runs on the same ref (lines 15-17). racing-lab/build.mjs:7 re-runs 8 Node test files during the build.**
   - Source: /home/user/3D-World-4/.github/workflows/deploy.yml; scripts/check-lab-foundations-browser.mjs; racing-lab/build.mjs
   - Confidence: confirmed

15. **The brief's 1,086 billed minutes for 16-23 Nov extrapolate to about 4,070 minutes per 30 days (about 4,650 if the window was 7 days). That is above both the Free allowance (about 2,000) and the Pro allowance (about 3,000), on any route that keeps building privately on GitHub Actions. main received 421 commits since 16 Nov in the local ref: 300 from Claude, 17 from Codex, 104 from the owner's account.**
   - Source: lead brief figures plus arithmetic; git log origin/main --since=2026-11-16
   - Confidence: likely

16. **Nothing in CI, the build or runtime reads the 3D-WORLD-3 repo or its Pages site. References are provenance data (racing-core/kart/reference.json:3, racing-core/tracks/reference.json:1, racing-core/track/reference.json:1, CHECK-RESULTS.json files, avatar-v2/original-limbs.json:1) and manual capture tools that take a local checkout path (racing-core/tools/capture-kart-reference.mjs:11, capture-track-reference.mjs:11, import-reference.mjs:8; not in CI). avatar-v2/check-original-body.mjs:33 only regex-matches the string locally. Links that would break if 3D-WORLD-3 went private on Free: avatar/README.md:32 and avatar/APPROVED.json:7 (https://isaiasurrutia96.github.io/3D-WORLD-3/avatar-preview/?v=e023230), and docs/karts/GT3-DRIVING-REFERENCE.md:221 (github.com blob link).**
   - Source: grep -rni '3D-WORLD-3' in /home/user/3D-World-4
   - Confidence: confirmed

17. **The public site also exposes project notes, whatever the repo's visibility: 66 JSON and 2 MD files, including checkpoints/driving-1|2/README.md, PROFILES.json, CHECKPOINT.json and checks/**/*.json test results, plus all minified game bundles. No source maps are published.**
   - Source: git ls-tree origin/gh-pages, grouped by file extension
   - Confidence: confirmed

18. **Cloudflare Pages: maximum single asset size is 25 MiB on all plans; Free allows 20,000 files per site and paid plans 100,000.**
   - Source: WebSearch summary of https://developers.cloudflare.com/pages/platform/limits and https://developers.cloudflare.com/changelog/2026-01-23-pages-file-limit-increase/ (direct fetch blocked: host not resolvable from this session; checked 23 Nov 2026)
   - Confidence: likely

19. **Netlify: no hard per-file cap found. Forum moderators recommend deploy files of no more than 10 MB, citing the docs' 'Large files or sites' troubleshooting section.**
   - Source: WebSearch summary of https://answers.netlify.com/t/what-is-the-maximum-allowed-object-size/145182 (direct fetch blocked; checked 23 Nov 2026)
   - Confidence: unconfirmed

20. **peaceiris/actions-gh-pages cannot push to an external repository with GITHUB_TOKEN; it needs deploy_key (secret ACTIONS_DEPLOY_KEY) or personal_token.**
   - Source: WebSearch summaries of the action's README and source (https://deepwiki.com/peaceiris/actions-gh-pages/2-authentication-methods; https://redirect.github.com/peaceiris/actions-gh-pages/blob/32bd89aa59ae39e1698902e7604f3d20e9234352/src/set-tokens.ts)
   - Confidence: likely

21. **The test site's default Skeleton model is the 19.96 MB delivery file: skeleton-test/main.js:21-22 defaults to 'detailed', which calls loadOfficialAvatar. The Test Lab lists Skeleton and New avatar (public/test-lab/main.js:6-7). New avatar loads the light and game copies plus new-avatar/torso-sockets.bin.**
   - Source: skeleton-test/main.js; public/test-lab/main.js; published new-avatar/index.html
   - Confidence: confirmed

22. **Hosts unreachable from this session: developers.cloudflare.com, docs.netlify.com and answers.netlify.com fail DNS; isaiasurrutia96.github.io returns 403 from the proxy. Live response headers and official limit pages could not be read directly.**
   - Source: WebFetch and curl attempts, 23 Nov 2026
   - Confidence: confirmed

## Ranking

### Ranking

1. **1. GitHub Pro + make 3D-World-4 private + trim the Actions workflow (same link; the test site itself stays public)**
   - Monthly cost: 3/5. Pro is about $4 a month. That figure comes from an official 2020-era GitHub docs FAQ that is still in the docs source, and 2026 third-party guides give the same number. It is not shown on github.com/pricing (checked 23 Nov 2026). Pro includes $18 a month of Actions compute, about 3,000 Linux minutes. Extra minutes cost $0.006 each. Without trims the current workflow would likely need 4,000 to 10,000+ private minutes a month, which is about $6 to $42+ of overage. With the trims, the expected total is about $4 a month.
   - Site private: 3/5. The source, docs, tests and history become private. The test site stays public to anyone who has the URL, because login-only Pages needs Enterprise Cloud. The site already exposes the minified bundles, models, checkpoint README/CHECKPOINT/PROFILES files and check JSON.
   - Owner effort: 4/5. About 5 to 10 minutes once, in Safari: upgrade to Pro and add a card, set an Actions budget alert, confirm the assistants' GitHub apps can see the repo, then flip visibility. Nothing changes day to day.
   - Phone testing same as now: 5/5. Identical. The link stays isaiasurrutia96.github.io/3D-World-4/, the home-screen icon, localStorage and avatar cache keep working, and no terminal or laptop is needed. Publishing stays automatic on push to main.
   - Main risks: Risk 4/5. The deploy step (peaceiris with GITHUB_TOKEN to gh-pages) works unchanged in a private repo on Pro. The main risk is Actions minutes. Private runners have 2 CPUs and 8 GB instead of 4 CPUs and 16 GB, and the slowdown is unmeasured, so overage could be billed or runs blocked if the trims are not enough. Not confirmed: whether the separate 'pages build and deployment' runs and the roughly 137 MB 'github-pages' artifacts (20 live, about 2.65 GB, 1-day retention) count against private-repo minutes or the 1 GB artifact storage. At worst that is about $0.25 per GB-month. If Pro is not active when visibility flips, the site unpublishes, but flipping back to public restores it. The price could change. Anything already copied while the repo was public stays out there (today: 0 forks, 0 stars).
   - Assistant effort: 4/5. No deploy change. Edit deploy.yml to: drop or keep the unused pull_request trigger; add paths-ignore for docs/** and **/*.md; on normal publishes run only the unit tests, build and deploy; run the roughly 5-minute browser gate only when racing/shared paths change, plus nightly or on demand; install only Chromium on normal runs; lower timeout-minutes from 35 to about 20. Agree a [skip ci] convention for intermediate pushes. Then measure the first private run.
   - Score: 3.85

2. **2. Stay on Free: private source repo; CI pushes only dist/ to a second PUBLIC repo served by Pages (+ the same workflow trims)**
   - Monthly cost: 5/5. $0, provided private-repo Actions stay within Free's $12 a month (about 2,000 Linux minutes). That requires the trims, at an estimated 1,100 to 2,200 minutes a month at about 5 to 8 publishes a day, which is borderline on busy months. Pages and storage in the public repo are free.
   - Site private: 2.5/5. The source, docs, tests and history become private. The site is public, and the build is now also easy to browse and download as a public repo, including the verbatim checkpoint folders with README/JSON. Four lab builds (avatar-test, elbow-lab, skeleton-test, wrist-lab) set no minify flag.
   - Owner effort: 3/5. About 10 to 15 minutes once, in Safari: (1) create a public repo; (2) create a fine-grained token scoped to that repo only, with Contents read and write and no expiry; (3) paste it as an Actions secret in 3D-World-4; (4) after the first deploy, turn on Pages from gh-pages in the new repo; (5) flip the source repo to private. Creating the token is the step most likely to confuse a non-programmer.
   - Phone testing same as now: 4/5. Still by link, with no laptop. The link changes to isaiasurrutia96.github.io/<site-repo>/, so the home-screen icon must be re-added and localStorage and the avatar cache start empty once. Keeping the exact link through a user-site repo isaiasurrutia96.github.io/3D-World-4/ is likely but unverified. I could not check whether that repo exists, because the proxy returned 403.
   - Main risks: Risk 3/5. Without a card, Free blocks Actions once the included compute is used up, so publishing would stop mid-month if the trims fall short. If the token expires or is revoked, publishing silently stops. test-lab/foundation-browser.mjs:7,27-32 checks that README links start with /3D-World-4/. Changing the README links without also changing that prefix fails CI, and then nothing publishes. Do not rename the source repo to reuse the name '3D-World-4' for the public repo, because assistant sessions could push to the wrong repo.
   - Assistant effort: 3/5. Change the peaceiris step to external_repository plus personal_token (or deploy_key), adding destination_dir if the user-site variant is used. Update the README links and the test prefix if the path changes. Make the same trims as option 1.
   - Score: 3.55

3. **3. Cloudflare Workers static assets + Cloudflare Access (login-only site); repo private on Free; deploy from the existing Actions workflow with wrangler (+ trims), or let Workers Builds build it**
   - Monthly cost: 4.5/5. $0 on Cloudflare: static asset requests and bandwidth are free and unlimited, and Workers Builds Free includes 3,000 build minutes a month. Zero Trust Free is $0 for up to 50 users, but that figure comes only from search snippets. Zero Trust signup asks for card or PayPal details without charging. GitHub Actions minutes are the same as option 2 (Free about 2,000) if Actions keeps testing, or about 0 if Workers Builds does the build.
   - Site private: 5/5. The repo is private, and the site needs a login (Cloudflare account login or an email one-time code). One dashboard step, Worker > Access > 'Protect this Worker behind Access' > All traffic, covers workers.dev, previews and custom domains.
   - Owner effort: 2/5. About 15 to 30 minutes once, by estimate: create a Cloudflare account with 2FA, start Zero Trust Free (enter payment details), create an API token and copy the Account ID, add two GitHub secrets (or install the Cloudflare GitHub App instead), and turn on Access for his email with a one-month session. That is one more vendor to manage.
   - Phone testing same as now: 3.5/5. Still by link, with no laptop, but there is a new *.workers.dev link, a login screen up to about once a month (default 24 hours; iPhone cookie persistence untested), a home-screen icon to re-add, and fresh storage. Videos may not play in Safari until a Worker route returns HTTP 206 for Range requests. The frozen avatar-joints-1 checkpoint page breaks unless its 34.15 MiB file is served from R2.
   - Main risks: Risk 2/5. The 25 MiB per-file cap makes wrangler abort the whole deploy while the 35,810,859-byte master is in dist (exclude it with .assetsignore). Range requests return 200, not 206, which Cloudflare documents as a Safari video issue. Whether Cloudflare changes pre-compressed .gz bytes is unverified; if it does, the avatar SHA-256 check fails. Access blocks the assistants' own live checks unless they use a service token. Cloudflare hosts are blocked from this cloud session. The README path test would need an update. If Workers Builds is used, the Playwright gate no longer blocks publishing. Cloudflare Pages variants (Direct Upload or Git) score lower: protecting the main pages.dev address takes a two-app workaround, and Git builds are capped at 500 a month.
   - Assistant effort: 2/5. Add wrangler.jsonc and dist/.assetsignore and swap the deploy step. Add a Worker route for video 206 if the iPhone test fails. Decide between R2 and accepting a broken avatar-joints-1 page. Create an Access service token. Fix the README links and test prefix. Request network allowlist changes. Update the docs.
   - Score: 3.48

4. **4. Azure Static Web Apps Free with GitHub login + invitation-only custom role**
   - Monthly cost: 4.5/5. $0 on the Free plan (100 GB a month of bandwidth). An Azure account needs a card for identity verification, with a temporary hold of about $1. Actions minutes are the same as option 2, so trims are needed.
   - Site private: 5/5. A route rule allows only an invited custom role, and the owner signs in with GitHub.
   - Owner effort: 1.5/5. About 20 to 30 minutes once in the complex Azure portal: create the account with a card, create the resource, add the deployment token secret, and accept the role invitation on the iPhone.
   - Phone testing same as now: 3/5. Still by link, with no laptop, but there is a new link, a GitHub login, and the home-screen icon must be re-added.
   - Main risks: Risk 2/5. Each environment is capped at 250 MB and the site is about 160 MB today, which leaves about 90 MB of growth. If the built-in 'authenticated' role is used by mistake, any GitHub user gets in. How Azure serves the .gz files and whether there is a per-file limit are unverified. It adds a third vendor with a card.
   - Assistant effort: 2.5/5. Add the deploy action, staticwebapp.config.json route rules, the README and test prefix changes, and the trims.
   - Score: 3.33

5. **5. Netlify with Private project visibility (owner-only, Netlify login)**
   - Monthly cost: 3/5. Free is $0 with 300 credits a month as a hard cap: 15 credits per production deploy (so at most 20 a month), 0 to create preview or branch deploys, and 20 credits per GB of bandwidth. Personal is $9 a month for 1,000 credits. All of this comes from search summaries only.
   - Site private: 5/5. A Private project is visible only to the team owner, after logging in to Netlify (Free and Personal).
   - Owner effort: 3/5. About 10 minutes once: create the account, create a token for the secret, set the project to Private, and log in once in Safari.
   - Phone testing same as now: 3/5. Still by link, with no laptop, but there is a new link and a Netlify login. Publishes would have to go to an alias or branch URL to avoid the 15-credit production charge.
   - Main risks: Risk 2/5. When credits run out, the site pauses mid-month. It is unconfirmed whether CLI alias deploys count as 0-credit previews. There are 2026 forum reports of blocked Free deploys. A forum post recommends files of 10 MB or less, and this repo has 3 files over that. How Netlify serves the .gz files is unverified. Pricing changed twice in 2025 and 2026.
   - Assistant effort: 3/5. Add a netlify-cli deploy step with an alias, drop the unused master copy, and handle the README test.
   - Score: 3.3

6. **6. GitHub Enterprise Cloud organization with privately published Pages**
   - Monthly cost: 1/5. $21 per user per month (github.com/pricing, 23 Nov 2026). It includes about 50,000 Linux minutes, so minutes stop being a concern.
   - Site private: 5/5. This is the only login-only Pages option that GitHub provides itself.
   - Owner effort: 2.5/5. Create the organization, buy or trial Enterprise Cloud, transfer the repo, and set Pages to private.
   - Phone testing same as now: 3.5/5. Still by link, but on a new random *.pages.github.io URL with a GitHub login in Safari.
   - Main risks: Risk 3.5/5. The repo path and the URL both change, so assistant sessions need re-pointing. It costs about 5 times as much as Pro and is over-built for one person.
   - Assistant effort: 3/5. Re-point sessions and connectors, update the README and test prefix.
   - Score: 3.1

7. **7. Vercel Hobby with Vercel Authentication**
   - Monthly cost: 4/5. $0 on Hobby (100 GB a month). Pro is $20 a month.
   - Site private: 3/5. Login-only is possible, but sources conflict on whether 'All Deployments' works on Hobby. Hobby content is opted in to AI-model training by default (opt-out available), which clashes with protecting the idea.
   - Owner effort: 3/5. About 10 minutes: sign up with GitHub, import the repo, turn on protection, and opt out of AI training.
   - Phone testing same as now: 3/5. Still by link, but there is a new link and a Vercel login.
   - Main risks: Risk 2/5. Hobby is for personal and non-commercial use only. The CLI upload limit is 100 MB, below the 160 MB dist, so Vercel would have to build the site itself. If it does, the Playwright gate no longer blocks publishing. The per-file limit is unknown.
   - Assistant effort: 3/5. Configure the Vercel build, decide where the tests run, and update the README and test prefix.
   - Score: 3.1

8. **8. Laptop fallback (best of them: Tailscale Serve private HTTPS link; also cloudflared quick tunnel, ngrok, plain Wi-Fi)**
   - Monthly cost: 5/5. $0.
   - Site private: 5/5. With Tailscale, only the owner's own devices can open it.
   - Owner effort: 1/5. Every test session: laptop on, git pull, npm ci when needed, npm run build, start the server.
   - Phone testing same as now: 1/5. This fails the owner's must-have: it needs the laptop and the terminal every time. Plain http://192.168.x.x breaks the avatar pages because crypto.subtle needs HTTPS. ngrok free (1 GB a month) is too small. A quick tunnel gives a new URL on every run.
   - Main risks: Risk 3/5. Stale code if git pull is forgotten. A VPN app is needed on the iPhone.
   - Assistant effort: 4/5. A one-click script at most.
   - Score: 3.1

9. **9. GitHub Codespaces private forwarded port as the phone preview**
   - Monthly cost: 5/5. $0 within the quota (Free: 120 core-hours and 15 GB-month).
   - Site private: 5/5. A private port needs the owner's GitHub sign-in.
   - Owner effort: 1/5. Every session: start or resume the codespace on the phone, wait an estimated 2 to 4 minutes for the build, and open the port link.
   - Phone testing same as now: 1/5. No standing link. Each new codespace gets a new URL, it stops after 30 minutes idle, and iPhone Safari behaviour is unconfirmed.
   - Main risks: Risk 3/5. Lots of friction, and community reports describe iPhone problems.
   - Assistant effort: 3/5. A .devcontainer that builds and serves on start.
   - Score: 3
**Recommendation:** Answer to the owner's question: no, he will not need a laptop or terminal. Recommend Option 1: upgrade the personal account to GitHub Pro (about $4 a month), have the assistants trim the Actions workflow first, then switch 3D-World-4 to private. It scores highest (3.85/5) because it is the only private route where phone testing stays exactly as now. The same link (isaiasurrutia96.github.io/3D-World-4/), the same home-screen icon and automatic publishing on every push all stay. It also needs zero change to the deploy step: peaceiris with GITHUB_TOKEN to gh-pages keeps working in a private repo on Pro.

What it does not do: the test site itself stays public to anyone with the URL. On GitHub, login-only Pages needs Enterprise Cloud at $21 per user per month. What going private protects is the source, docs, design notes, tests and commit history.

The real cost driver is Actions minutes, not the plan price. Private repos bill every run, on slower 2-CPU runners. The current workflow (about 44 pushes a day, about 9 to 11 minutes each since the browser gate was added on 22 Nov) projects to roughly 4,000 to 10,000+ minutes a month, against the 3,000 included with Pro. The trims must therefore land before the flip: skip docs-only pushes, use [skip ci] on intermediate pushes, run the browser gate only when racing or shared paths change (plus nightly or on demand), install only Chromium on normal runs, and lower the timeout to about 20 minutes. With the trims, the estimate is about 1,100 to 2,200 minutes a month, about $4 a month in total. An Actions budget alert caps surprises.

If the owner later wants the site login-only too, Cloudflare Workers plus Access (option 3) can be added on top at $0, and then Pro would no longer be needed. For reference, staying public would score about 4.2 on these weights, because protection is only 20% of the total. The owner has asked for private, so that option is not ranked.

Firebase, Render, Surge, AWS Amplify, Deno Deploy (shutting down April 2027) and GitLab (repo move, 400 CI minutes) are dominated by the options above and are not ranked in detail.

Sources: https://raw.githubusercontent.com/github/docs/main/data/reusables/gated-features/pages.md ; https://raw.githubusercontent.com/github/docs/main/content/get-started/learning-about-github/faq-about-changes-to-githubs-plans.md ; https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/actions-included-quotas.md ; https://raw.githubusercontent.com/github/docs/main/data/reusables/actions/supported-github-runners.md ; https://raw.githubusercontent.com/github/docs/main/content/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility.md ; https://github.com/pricing. These were checked on 23 Nov 2026 around 22:00 to 22:25 UTC. docs.github.com itself was blocked, so I read the docs source on raw.githubusercontent.com.
**Runner up:** Option 2 (3.55/5): stay on Free at $0. Make the source repo private and have CI push only the built dist/ to a second public repo that serves Pages. Choose it if the owner does not want to pay $4 a month.

The trade-offs:
- The link changes to isaiasurrutia96.github.io/<site-repo>/, so the home-screen icon must be re-added. Keeping the exact link through a user-site repo is likely but unverified.
- The owner must create a fine-grained token scoped to that one repo and paste it as a secret.
- The built game becomes browsable as a public repo.
- The smaller 2,000-minute Free allowance is a hard stop without a card, so publishing could halt mid-month if the trims are not enough.

Essentially tied at 3.48/5 is Cloudflare Workers plus Access. It is the best choice if a login-only test site matters more than keeping the link and keeping setup simple. It costs $0, but it brings a new link, a periodic login, a required exclusion for the 34.15 MiB file, and possible iPhone video issues (no HTTP 206).

### Owner steps
1. Wait for the assistants to say the workflow trim is live and one publish run passed. You do nothing until then except say "Go" on that change.
2. On your iPhone, open Safari, go to github.com and sign in. If a setting below is missing on the phone layout, tap the "aA" button in the address bar and choose "Request Desktop Website".
3. Tap your profile picture (top right), then Settings.
4. In the left menu, open "Billing and licensing" (direct link: github.com/settings/billing). Find the plans or licensing section and tap "Upgrade" next to GitHub Pro.
5. Choose monthly billing, enter your card and confirm. The price shown should be about $4 a month. If it shows something very different, stop and tell the assistants.
6. Back on the billing page, check that your plan now reads "GitHub Pro". Do not go further until it does.
7. Still in Billing and licensing, open "Budgets and alerts", tap "New budget" and pick Actions. Set a small amount (for example $5) and leave the email alerts on.
8. Go back to Settings and open "Applications", then the "Installed GitHub Apps" tab. Tap Configure next to Claude and make sure Repository access says "All repositories" or lists 3D-World-4. Do the same for the Codex/ChatGPT app.
9. Open github.com/isaiasurrutia96/3D-World-4 and tap the Settings tab (gear icon) of the repository.
10. Stay on the General page and scroll to the very bottom, to the red "Danger Zone".
11. Tap "Change repository visibility", choose "Change to private", read the warning and confirm. GitHub may ask you to type the repository name or approve with your password or 2FA.
12. In the same repository Settings, open "Pages" in the left menu. It should still say your site is live at isaiasurrutia96.github.io/3D-World-4/, with the source set to the gh-pages branch.
13. Open your usual test link or home-screen icon and test as normal.
14. Tell the assistants it is done. They will check that the next publish still works and measure how many minutes a private run uses. If anything looks wrong, you can switch the repository back to public in the same Danger Zone.

### Must do before going private
1. Upgrade to GitHub Pro and confirm that the plan page reads "GitHub Pro" BEFORE changing visibility. On Free, making the repo private automatically unpublishes its Pages site, so the link breaks (setting-repository-visibility.md, GitHub docs source, 23 Nov 2026).
2. Merge and verify the Actions trim in /home/user/3D-World-4/.github/workflows/deploy.yml, with one green publish run. The trim is: paths-ignore for docs/** and **/*.md; a [skip ci] convention for intermediate pushes; on normal publishes only unit tests, build and deploy; the browser gate path-gated to racing-lab, racing-core, kart-parts, karts, src, test-lab, motion-lab/src, scripts, package* and .github, plus nightly or workflow_dispatch; Chromium only on normal runs, with WebKit nightly; timeout-minutes about 20; keep cancel-in-progress. Without it, private runs likely exceed Pro's 3,000 included minutes.
3. Set an Actions budget with email alerts under Billing and licensing > Budgets and alerts, so overage cannot run up unnoticed.
4. Confirm that the Claude GitHub App and the Codex connector have access to 3D-World-4 as a private repo (Installed GitHub Apps > Configure > Repository access). Cloud sessions may currently read it through the public git proxy, and after the flip they need the app's access to clone and push.
5. Do not rename the repo, delete the gh-pages branch or change Pages away from 'Deploy from a branch: gh-pages / (root)'. The link depends on all three staying as they are.
6. Agree that the assistants measure the first private run's billed minutes right after the flip. The 2-CPU private runner slowdown is unmeasured, and they should tighten the trims if needed.
7. Optional, owner's decision: stop publishing the unused 35.8 MB live master copy (scripts/build-official-avatar-page.mjs:37) to shrink each deploy from about 161 MB to about 125 MB. The frozen checkpoints/avatar-joints-1 copy stays untouched under CLAUDE.md rule 17.

### Unconfirmed
1. GitHub Pro price of $4 a month: it comes from an official but 2020-era GitHub docs FAQ and from 2026 third-party guides. github.com/pricing does not list Pro, and the pricing calculator shows Pro with no price (checked 23 Nov 2026 about 22:00 UTC; WebSearch 22:22 UTC).
2. How much slower the 2-CPU private runners are than today's 4-CPU public runners. All private-minute estimates (4,000 to 10,000+ untrimmed, 1,100 to 2,200 trimmed) depend on it.
3. Whether the separate 'pages build and deployment' runs (about 1 minute each) and the roughly 137 MB 'github-pages' artifacts count against a private repo's Actions minutes or its 1 GB artifact storage on Pro. The docs only say standard runners are free 'For GitHub Pages'.
4. Whether a Pro account gets a default $0 Actions budget, which would block runs at the limit instead of billing overage. Also the exact menu names and plan-upgrade path in GitHub's current billing UI, especially on the mobile web layout.
5. Whether a user-site repo isaiasurrutia96.github.io exists, and whether it would keep the exact /3D-World-4/ link for option 2. The check returned proxy 403 from this session.
6. Whether the Claude GitHub App and the Codex connector are currently installed with access that will cover the repo once it is private.
7. Cloudflare: Zero Trust Free at $0 for 50 users comes only from search snippets. Also unconfirmed: how long the Access login lasts in iPhone Safari or a home-screen web app, whether .gz assets are served byte-for-byte, real-iPhone video playback without HTTP 206, and current commercial-use terms.
8. Netlify credit rules (whether CLI alias deploys cost 0 credits) and per-file limits; Vercel 'All Deployments' protection on Hobby; Azure SWA Standard price; Codespaces behaviour in iPhone Safari.
9. Whether anyone already cloned or copied the repo while it was public. The API shows 0 forks and 0 stars, but clone history was not checked.

## Skeptic challenge
**Holds up:** True

### Factual errors
1. The untrimmed minute estimate starts too low. '4,000 to 10,000+ a month' and '$6 to $42+ of overage' use the 8-day average, and most of those 8 days came before the browser gate was added. I re-pulled the runs from the Actions API (read-only). After the gate, the publish workflow used 318 rounded-up minutes on 22 Nov (gate active from 05:10 UTC) and 231 on 23 Nov (up to 22:17 UTC). Those are today's 4-CPU runners. That works out to about 7,000 to 9,600 minutes a month before any slowdown on the 2-CPU private runners. On Pro that is about $24 to $40+ a month of overage, unless a budget stops it first.
2. Owner step 7 says to 'set a small amount and leave the email alerts on', and the recommendation says a budget 'caps surprises'. That is wrong unless 'Stop usage when budget limit is reached' is also ticked. GitHub's docs say that without it you get an email but 'usage will not be stopped' (https://raw.githubusercontent.com/github/docs/main/content/billing/how-tos/set-up-budgets.md, read 23 Nov 2026).
3. The comparison lists the 'pages build and deployment' runner minutes as unconfirmed. The current billing doc says standard GitHub-hosted runners are free 'For GitHub Pages' (https://raw.githubusercontent.com/github/docs/main/content/billing/concepts/product-billing/github-actions.md), so their compute is free. The only open question is whether the roughly 137 MB 'github-pages' artifacts (20 live, 2,652 MB in total, re-checked) count toward the 1 GB artifact storage.
4. Docs-only commits are 102 of 421 since 16 Nov by my git-log count (about 24%), not 112 (27%). This is minor, but the paths-ignore saving is a little smaller than stated.
5. 'Assistants: edit deploy.yml' leaves out the project's own split of work. docs/COLLABORATION.md line 36 names Codex as the default coordinator for 'Build, release integration and deployment coordination'. Section C of CLAUDE.md gives racing and driving to Codex, and 9 of the 11 browser suites are racing or driving suites. Trimming or gating them must be agreed with Codex first.
6. 'Install only Chromium on normal runs' is presented as a cheap trim. Only 1 of the 11 browser suites runs in WebKit: 'WebKit app return and pause' in scripts/check-lab-foundations-browser.mjs. It is the only check that uses Safari's engine (the iPhone's engine), so dropping it from each publish removes the most phone-relevant check, not a minor one.
7. 'If Pro is not active when visibility flips ... flipping back to public restores it' is not stated in GitHub's docs. The visibility doc only says the site 'will be automatically unpublished'. Pages may have to be switched on again by hand. Treat this as unconfirmed.
8. The upgrade path in the owner steps is off. GitHub's docs give: Settings > Billing & Licensing > Licensing > next to 'Current plan' click Upgrade (https://raw.githubusercontent.com/github/docs/main/content/billing/how-tos/manage-plan-and-licenses/upgrade-plan.md). It is not 'Upgrade next to GitHub Pro' on github.com/settings/billing.
9. The 'others' research says the soft limit of 10 builds an hour does not apply. The docs exempt sites that 'build and publish' with a custom Actions workflow. This repo builds with a custom workflow but publishes through a branch (peaceiris pushes to gh-pages, which triggers the dynamic 'pages build and deployment' run), so the limit probably applies. Measured peak: 9 an hour. Trimming publishes removes the risk anyway.
10. GitHub's docs disagree on Pro storage. The quotas table says Pro has 1 GB of artifact storage, but githubs-plans.md says Pro includes '2 GB Packages storage', and the two share one pool. The comparison states 1 GB as settled.
11. 'The only private route where phone testing stays exactly as now' is too strong. Option 2b (a public user-site repo isaiasurrutia96.github.io with a 3D-World-4 folder) might also keep the exact link at $0. This is unverified: the proxy blocked the check on whether that repo exists.

### Problems

1. **The trimmed estimate (about 1,100 to 2,200 minutes a month) assumes about 5 to 8 publishes a day. Measured after the gate: 26 to 52 publish runs a day, of which 16 to 39 succeeded. Getting there depends on two assistants remembering [skip ci] on every intermediate push. That convention fails open: one forgotten marker burns minutes. Even with paths-ignore and a light publish job (about 4 to 4.5 min on 4 CPUs, unmeasured on 2), about 30 non-docs pushes a day would use about 180 minutes a day, roughly 5,400 a month. That is above Pro's 3,000.**
   - Fix: Make publishing opt-in rather than opt-out. Keep paths-ignore for docs/** and **/*.md. Run the publish job only when the head commit message carries a marker such as [publish], or on workflow_dispatch. Use a job-level `if:`, so a skipped job uses no runner. Forgetting the marker then costs 0 minutes. It also fits CLAUDE.md B5 ('never give a link before it actually works'): the assistant publishes when it hands the owner a test, then checks the link. Run the full browser gate, including the WebKit suite, on racing or shared path changes, nightly, and on demand. Target about 8 to 10 publishes a day; the estimate of about 2,100 to 2,400 minutes a month assumes about 6 billed minutes per light publish on 2-CPU runners, which is unmeasured.

2. **Nobody knows what Actions budget the account already has. The docs say that with a payment method, spending 'may be limited by one or more budgets'. Search results say migrated accounts can carry auto-made budgets copied from the old $0 spending limit. Either overage is billed with no cap, or Actions stop once the $18 included compute is used, which would halt publishing mid-month. The comparison does not tell the owner which.**
   - Fix: Owner step: open Billing & Licensing > Budgets and alerts once after upgrading. If no Actions budget exists, create a product-level Actions budget (for example $5), TICK 'Stop usage when budget limit is reached', and turn on included-usage alerts (90% and 100%). Tell him plainly that a hard stop means publishing pauses instead of billing more.

3. **The 2-CPU slowdown on private runners is unmeasured. The browser suites render WebGL in software, which depends on CPU. Each suite has a 300 s timeout and some waits are 90 s, so slower runners could cause flaky failures that block publishing. The proposed job timeout of about 20 minutes could kill a legitimate full run: one 4-CPU run already took 20.7 min because of a 720 s browser install.**
   - Fix: Use a timeout of about 15 to 20 min for the light publish job and keep 35 min for the full browser job. Measure billed minutes and pass rate on the first two or three private runs before trusting any estimate. Switching back to public stays the escape hatch.

4. **The deploy and gate changes fall in Codex's coordination area (docs/COLLABORATION.md:36) and mostly in its racing suites. A [skip ci] or [publish] convention also only works if both assistants follow it.**
   - Fix: Claude proposes the workflow change to Codex (through the owner) before editing it. The agreed commit convention goes into AGENTS.md and CLAUDE.md so both assistants read it, and is in place before the repo goes private.

5. **The test site stays public, and its URL is easy to guess from the account name plus '3D-World-4'. No page has a noindex tag. The published dist also carries checkpoint README.md files, PROFILES.json, CHECKPOINT.json and check-result JSON that describe the driving design. A robots.txt under /3D-World-4/ would not help, because crawlers only read robots.txt at the root of the domain.**
   - Fix: At $0 and with no change for the owner: add <meta name="robots" content="noindex"> to the live page shells and leave the frozen checkpoints untouched. Optionally, and only if the owner agrees given rule 17, leave checkpoint README and JSON files out of dist at build time without changing the frozen source files. Their index.html files do not reference those names, but check for runtime fetches first. My one search found the site not indexed (one search engine only; unconfirmed).

6. **The history has been public until now. Going private stops future copies, such as GitHub Archive Program inclusion (setting-repository-visibility.md), but cannot recall copies that may already exist. Software Heritage-style archiving of public repos is from general knowledge and is not confirmed for this repo.**
   - Fix: Tell the owner honestly that 'private' protects what happens from now on. Today the API shows 0 forks and 0 stars.

7. **If Pro lapses (a failed card or a downgrade), Pages from the private repo stops and the test link dies. The downgrade doc says private-repo Pages is lost on Free.**
   - Fix: Tell the owner to keep the card valid. If he ever downgrades, make the repo public first, or move to Option 2.

8. **Owner step 8 (check the Claude and Codex app access) costs his time for little gain. Both assistants already push to main, which needs installed apps with write access to this repo, and a visibility change does not alter which repos an app can see. The real gap is elsewhere: read-only research or subagent sessions that read through the public git proxy will lose access unless the repo is attached with credentials.**
   - Fix: Make it an optional 30-second check. The assistants confirm their own access after the change. Note that research or workflow sessions need the repo attached once it is private.

9. **The Pro price ($4) appears only in a 2020-era docs FAQ and in third-party guides. github.com/pricing (fetched 23 Nov 2026) lists only Free, Team ($4 per user) and Enterprise ($21).**
   - Fix: Keep the 'stop if the price is very different' step. Fallback: GitHub Team at $4 per user per month (confirmed on github.com/pricing) gives the same private-repo Pages and $18 of compute. It needs an organization and a repo transfer, so the link changes to <org>.github.io/3D-World-4/ and the assistants must re-point. Use it only if Pro cannot be bought.

10. **Option 2b has an unmentioned trap. peaceiris force_orphan rebuilds the whole target branch, so combining it with destination_dir: 3D-World-4 in a user-site repo would delete everything else in that repo.**
   - Fix: If Option 2b is ever used, drop force_orphan (or use keep_files), or use a dedicated site repo instead.

11. **The Cloudflare and Access options overstate 'log in once, lasts up to a month' for this owner. iPhone home-screen web apps keep their own cookie store, separate from Safari (WebKit bug 181849: https://bugs.webkit.org/show_bug.cgi?id=181849). There are reports of home-screen app cookies being deleted after 7 days (https://bugs.webkit.org/show_bug.cgi?id=237350). The Access login also redirects to <team>.cloudflareaccess.com, which is outside the Driving Test manifest scope ('./', display standalone). Login inside the home-screen app is untested and may fail or repeat often. Workers also answer video requests with 200 rather than 206, which Cloudflare's own docs flag as a Safari video problem (confirmed in the cloudflare-docs source).**
   - Fix: Keep Cloudflare as a later, optional step only if the playable site itself must be login-only, and test login in both Safari and the home-screen app on his real iPhone before any switch. It does not change the ranking: Option 1 stays first.
**Improved recommendation:** Answer to the owner: no, going private does not mean using a laptop or terminal. With GitHub Pro he keeps opening the same link (isaiasurrutia96.github.io/3D-World-4/) and the same home-screen icon on his iPhone. The assistants keep pushing and the site keeps publishing on its own. The trade-off stays the same: the playable test site is still public to anyone who has or guesses the URL. Going private hides the source, docs, plans, tests and history. GitHub only offers login-only Pages on Enterprise Cloud ($21 per user per month), which is overkill here.

Recommended route: Option 1, GitHub Pro plus a private repo. The workflow change has to land first, and it should be opt-in.

1. Before anything else, the assistants agree with Codex, which coordinates deployment under docs/COLLABORATION.md:36, and then change .github/workflows/deploy.yml:
- (a) Add paths-ignore for docs/** and **/*.md.
- (b) Publish only when the head commit carries a [publish] marker, or on a manual run. Forgetting the marker then costs 0 minutes. The assistant publishes when it hands the owner a test and checks the link first, which matches 'never give a link before it works'.
- (c) The publish job runs unit tests, build and deploy, with a 15–20 min timeout.
- (d) The full browser gate, including the WebKit 'app return and pause' suite (the only check that uses Safari's engine), runs on racing or shared path changes, nightly, and on demand, with a 35 min timeout.
- (e) Add <meta name="robots" content="noindex"> to the live page shells, leaving frozen checkpoints untouched.
- (f) Write the commit convention into AGENTS.md and CLAUDE.md so both assistants follow it.
Target about 8–10 publishes a day. The rough estimate is about 2,100–2,400 private minutes a month, inside Pro's $18 (3,000 minutes at $0.006). This is unmeasured on 2-CPU runners. Without the change, the measured pace is about 7,000–9,600 minutes a month even on today's faster runners.

2. Owner, in Safari:
- Settings > Billing & Licensing > Licensing > 'Current plan' > Upgrade to Pro. The price should be about $4 a month; stop if it is very different. Confirm the plan reads GitHub Pro.
- Then Billing & Licensing > Budgets and alerts. If there is no Actions budget, create one: Actions, $5, TICK 'Stop usage when budget limit is reached', and turn on included-usage alerts. A hard stop pauses publishing instead of billing more.
- Then repo Settings > General > Danger Zone > Change visibility > Private.
- Check that Settings > Pages still shows the site live from gh-pages, then test as usual.

3. The assistants measure billed minutes and pass rate on the first two or three private runs, then adjust the publish count. If anything breaks, switching back to public is the escape hatch. Pages may need to be switched on again.

Expected cost: about $4 a month. That price is from the GitHub docs FAQ and third-party guides; github.com/pricing (fetched 23 Nov 2026) does not list Pro. Overage is capped at $5 by the budget.

Fallbacks:
- If he will not pay, use Option 2: a private repo on Free with CI pushing dist/ to a public site repo. It is $0, but it means a new link, a token to create, and a hard 2,000-minute cap ($12) that stops publishing when used up, so publishes must be batched harder (about 5 a day). Do not combine force_orphan with destination_dir in a user-site repo.
- If Pro cannot be bought, GitHub Team at $4 per user (confirmed on github.com/pricing) works the same way, but needs an organization, so the link changes.
- If the playable site itself must be hidden, Cloudflare Workers plus Access is about $0. It needs real-iPhone tests first: home-screen apps keep their own cookies, videos may not play without 206 responses, and the 34.15 MiB master file must be left out of the upload. It is a later step, not the first one.

Sources, checked 23 Nov 2026 about 22:20–22:50 UTC. docs.github.com does not resolve from this session, so I read GitHub's docs source on raw.githubusercontent.com/github/docs (main): githubs-plans.md, actions-included-quotas.md, supported-github-runners.md, billing/concepts/product-billing/github-actions.md, billing/how-tos/set-up-budgets.md, upgrade-plan.md, downgrade-plan.md, setting-repository-visibility.md, github-pages-limits.md, skip-workflow-runs.md, faq-about-changes-to-githubs-plans.md. Also https://github.com/pricing (WebFetch); the Cloudflare docs source raw.githubusercontent.com/cloudflare/cloudflare-docs/production (workers/static-assets/billing-and-limitations.mdx, workers/configuration/cloudflare-access.mdx); and the repo's Actions API runs, jobs and artifacts (read-only). Repo facts I re-checked: 188 published files, 161,304,323 bytes, 40 HTML pages; two 35,810,859-byte master copies, with the live copy unused (scripts/build-official-avatar-page.mjs:37, tests/avatar/official-browser.mjs:67); the README prefix test at test-lab/foundation-browser.mjs:7,27-32; one WebKit suite out of 11.

Process note: one of my web searches included the site's github.io hostname, to check whether it is indexed. Nothing was found. No other personal details were sent.
