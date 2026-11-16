# 19 — Legal Guide for Game Development

**Not legal advice.** A summary of the main rules (mostly US, plus EU/UK where
it matters) gathered November 2026. Before selling, spend an hour with a games
or IP lawyer — flat-fee packages for indie developers exist.

## A) Copyright: what you can and can't copy

1. **Ideas, rules and mechanics are not protected.** Copyright protects
   *expression* (code, art, music, text, character designs, level layouts,
   distinctive look and feel), not the idea of "match three" or "kart racing".
2. **But copying the look and feel loses.** *Tetris Holding v. Xio (2012):* Xio
   copied only "rules", but its pieces, board and visuals looked the same —
   the court found infringement because the expression was nearly identical.
3. *Spry Fox v. Lolapps/6waves (2012):* *Yeti Town* swapped art for *Triple
   Town*'s, but the court let the claim proceed because the overall
   selection/arrangement was copied; settled with the clone's copyright given
   to Spry Fox.
4. **Practical rule:** take inspiration from mechanics, never copy a specific
   game's names, characters, art, music, levels, UI layout or distinctive
   look. Make your own designs from scratch.
5. **Your own work is protected automatically** when created. Registering with
   the US Copyright Office (~$45–65 online) is optional but required before
   suing in the US and enables statutory damages.
6. **AI-generated content:** the US Copyright Office says purely
   AI-generated material is not copyrightable (human-authored parts are).
   Some stores (e.g. Steam) require disclosure of AI content. Keep records of
   what you made by hand.

## B) Trademarks: names and logos

1. Your **game title, studio name and logo** can conflict with existing
   trademarks. Search before committing: USPTO trademark search, EUIPO,
   app stores, Steam, Google.
2. Registering a US trademark costs roughly $350 per class online (games are
   class 9 software and class 41 entertainment).
3. Don't use other companies' trademarks in a way that suggests endorsement.

## C) Real-world things inside games (very relevant to sports games)

1. **Leagues, teams and players:** NFL, NBA, real team names, logos, jerseys
   and athlete names/likenesses require licences (EA/2K pay heavily for them).
   Use invented teams and players. Generic sports ("football", "bowling") are
   free to make.
2. **Right of publicity:** using a real person's name or likeness to sell a
   product needs permission (state laws in the US).
3. **Cars, guns, brands:** real vehicle and weapon designs are often licensed;
   *AM General v. Activision (2020)* — Activision won over Humvees in Call of
   Duty on artistic-relevance grounds — but lawsuits are costly. Use made-up
   designs.
4. **Tattoos on real athletes:** *Solid Oak v. 2K (2020)* 2K won; *Alexander v.
   Take-Two (2022)* the tattoo artist won a small verdict. Another reason to
   use fictional athletes.
5. **Real places:** generally fine; avoid recognisable trademarked buildings
   or logos in prominent ways.

## D) Assets, code and music you didn't make

1. **Read every licence.** Free ≠ free to sell.
2. **Permissive open-source** (MIT, BSD, Apache 2.0): fine for commercial and
   App Store games; keep the licence notice (e.g. in a credits/licences screen).
   **Three.js is MIT.**
3. **GPL/LGPL:** GPL's requirements conflict with App Store terms — avoid
   GPL code in an iOS app unless the author offers another licence.
4. **Creative Commons:** CC0 and CC-BY are fine (CC-BY needs credit); avoid
   NC (non-commercial) and ND (no derivatives) for a paid game.
5. **Music:** a real song needs two licences (composition + recording). Use
   music you commission (with written transfer of rights) or royalty-free
   libraries whose licence allows games.
6. **Fonts** have licences too; check app embedding is allowed.
7. **Store asset packs** (Unity/Unreal/itch): licences usually allow use in
   your game but not reselling the raw files.

## E) People who help you

1. **Written IP assignment from every contractor** (artists, coders,
   musicians). Paying someone does not by itself transfer copyright.
2. Friends who contribute: same rule — get it in writing.
3. Publishers/investors will ask for these documents.

## F) Your business

1. **Sole proprietor vs LLC:** you can publish as an individual. An LLC
   separates personal and business liability, looks more professional on the
   App Store (organisation name instead of your personal name) and requires a
   free D-U-N-S number for Apple organisation accounts. State fees vary
   (~$50–$500).
2. Separate business bank account; keep receipts.
3. **Taxes:** Apple and Google act as the seller and handle sales tax/VAT in
   most countries; you report the payouts as income (self-employment tax in
   the US). App Store Connect needs a W-9 (US) and bank details.

## G) Privacy and children

1. **Privacy policy** is required by both app stores for every app, even if you
   collect nothing (then say so).
2. **COPPA (US, under 13):** amended rule published April 22, 2025, main
   compliance deadline April 22, 2026: verifiable parental consent before
   collecting children's data, separate consent before sharing with third
   parties (e.g. ad networks), written data-retention and security policies,
   more detailed notices. Applies to child-directed games and mixed-audience
   games with actual knowledge of child users. Epic paid $275M (largest
   COPPA penalty).
3. **Simplest safe path:** collect **no personal data**, no ads SDKs, no
   accounts, no analytics — the game runs offline. Then most privacy duties
   become trivial.
4. **GDPR (EU/UK):** applies if you process EU users' personal data; consent
   and data rights. Again, collecting nothing avoids most of it.
5. **US state laws** (California CCPA etc.) mostly apply above revenue/data
   thresholds, but be truthful in your policy.

## H) Monetisation rules

1. **Loot boxes / paid random items:** Apple and Google require showing the
   odds before purchase. **Belgium** treats paid loot boxes as illegal
   gambling; **Brazil** bans sales to under-18s from March 2026; the
   **Netherlands** position is contested. **US:** FTC v. Cognosphere (Genshin
   Impact, Jan 2025) — $20M settlement, no loot box sales to under-16s without
   parental consent, clear odds and currency rates. Simplest: don't sell
   random items.
2. **Virtual currency:** show real-money cost clearly; no tricks
   ("dark patterns") — the FTC has fined Epic ($245M) over them.
3. **Ads:** need disclosure, privacy labels, and for kids strict rules.
4. **Subscriptions:** clear terms and easy cancellation.

## I) Other legal items

1. **EULA / Terms of Service:** Apple provides a standard EULA you can use;
   custom terms only if needed (online multiplayer, user content).
2. **Age ratings:** Apple's questionnaire (new tiers 4+, 9+, 13+, 16+, 18+ since
   2025); Google uses IARC; consoles/Steam regions may need ESRB/PEGI via IARC.
3. **EU Digital Services Act:** Apple requires declaring "trader" status; traders
   must show address, phone and email on the EU store page (apps without
   status were removed from the EU store from Feb 17, 2025).
4. **Export compliance:** apps using only standard HTTPS/OS encryption are
   typically exempt; answer Apple's encryption question (set
   `ITSAppUsesNonExemptEncryption` to NO when true).
5. **Accessibility:** not generally mandated for games in the US, but good
   practice; communication features can fall under the CVAA.
6. **User-generated content / multiplayer chat:** needs reporting, blocking,
   moderation and terms (Apple guideline 1.2).

## J) Short checklist before selling

1. Everything in the game is yours, licensed, or MIT/CC0/CC-BY with credits.
2. No real brands, teams, players, songs or copied game designs.
3. Name and logo searched for trademarks.
4. Written rights from anyone who helped.
5. Privacy policy published; ideally no data collected.
6. Monetisation without loot boxes or dark patterns.
7. Age rating answered honestly; trader status declared.
8. One consultation with a games lawyer.
