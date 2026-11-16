# 20 — Blueprint: From Idea to the App Store (like building a house)

Gathered November 2026. Prices and rules change; check Apple's and Google's
official pages when you reach each step.

## A) What you need overall

1. **Apple Developer Program:** $99/year. Individual (your name shows as the
   seller) or Organization (needs a legal entity like an LLC + free D-U-N-S
   number; allow 1–4 weeks for enrolment).
2. **A Mac with Xcode** for building, signing and testing iOS apps — or a cloud
   Mac service (Codemagic, Expo EAS, Capawesome) that builds and uploads to
   App Store Connect without owning one. Testing on a real iPhone is a must
   either way.
3. **A real iPhone** (and ideally an older one) for testing.
4. **A wrapper** to turn the web game into an app: **Capacitor** (by Ionic) puts
   the Three.js game inside a native iOS app (WKWebView). Three.js games have
   been approved this way.
5. **Optional Google Play:** $25 one-time; new personal accounts must run a
   closed test with **12 testers for 14 continuous days** before production.
6. **Apple's cut:** 30% of sales/in-app purchases, or **15%** under the Small
   Business Program (under $1M/year — apply, no extra fee). In the US, apps
   may also link to web purchases (Epic v. Apple; Apple may charge a
   court-limited commission after the Dec 2025 appeal).

## B) The house analogy, step by step

### 1. Dream and blueprint (design) — before building anything
1. One-sentence concept; who plays it; how it makes money (paid upfront,
   free + in-app purchases, or free).
2. **Game design document:** core loop, controls, modes, art style, screens.
3. **Scope:** the smallest version worth selling (a "starter home").
4. **Name check:** App Store search + trademark search (`19-legal.md` B).
5. Budget: developer fee, devices, art/music, lawyer hour, cloud build.

### 2. Permits (accounts and legal setup)
1. Decide individual vs LLC; get D-U-N-S if LLC.
2. Enrol in the Apple Developer Program.
3. In App Store Connect: sign the **Paid Apps agreement**, add **tax forms**
   and **bank account** (needed before selling anything).
4. Declare **EU trader status**.
5. Write a **privacy policy** and host it at a public URL (e.g. on GitHub
   Pages).

### 3. Foundation (technology choices)
1. Engine: Three.js + TypeScript + Vite (current setup).
2. Wrapper: Capacitor iOS project.
3. **Bundle all game files inside the app.** Loading the game from a website
   inside the app, or changing game code remotely, risks rejection.
4. Plan for iPhone screen sizes, notch/safe areas, portrait or landscape,
   touch controls, and 60 fps on older phones.

### 4. Framing (core gameplay prototype)
1. Build the core action with plain shapes and tune until it's fun
   (`13-production.md`).
2. Playtest with a few people early.

### 5. Plumbing and electrical (systems)
1. Saving progress (local storage on device; iCloud optional).
2. Sound (Web Audio, unlocked on first tap), music, settings, pause.
3. **In-app purchases** (if any) must use Apple IAP for digital items in the
   app (a Capacitor plugin such as RevenueCat or capacitor IAP plugins);
   include a **Restore Purchases** button.
4. Handle the app going to background, phone calls, and iOS reclaiming WebGL
   memory (the screen can go black — rebuild the scene when the context
   restores).
5. If you add accounts, you must also add **in-app account deletion**.

### 6. Interior design (art, UI, sound, polish)
1. Original art and music only (or properly licensed).
2. App icon (1024×1024), launch screen, menus, tutorial.
3. Juice and feel (`12-feel-audio-ui.md`).

### 7. Inspection (testing and checking)
1. Test on several iPhones/iPads, old and new; check frame rate, heat,
   battery, memory.
2. **TestFlight:** Apple's beta testing — internal testers instantly,
   external testers after a quick beta review; up to 10,000 testers.
3. Crash-free, no placeholder content, no broken links, no debug text.
4. **Guideline 4.2 (minimum functionality):** Apple rejects apps that are just
   a website in a box. A complete, offline, touch-controlled game passes;
   a thin web page doesn't.
5. Accessibility basics (readable text, adjustable sound, no reliance on
   colour only).

### 8. Paperwork (store listing)
1. App name (30 characters), subtitle, description, keywords, category
   (Games + subcategory), support URL, privacy policy URL.
2. **Screenshots** for required iPhone sizes (and iPad if supported); optional
   preview video.
3. **App Privacy "nutrition label":** declare what data is collected — must
   match reality ("Data Not Collected" if none).
4. **Privacy manifest** entries for "required reason" APIs and for any SDKs.
5. **Age rating questionnaire** (new 13+/16+/18+ tiers).
6. **Export compliance** answer (standard encryption only → exempt).
7. Price tier and countries.

### 9. Final walkthrough (App Review)
1. Upload the build (Xcode or cloud service), select it in App Store Connect,
   submit for review. Reviews usually take a day or two.
2. Common rejections: crashes, incomplete features, misleading screenshots,
   privacy label mismatch, missing account deletion, guideline 4.2, using
   non-Apple payment for digital goods, placeholder text.
3. If rejected: read the note, fix, reply in Resolution Center, resubmit; you
   can appeal.

### 10. Moving in (launch)
1. Release manually or automatically after approval; phased release option.
2. Marketing: trailer, social posts, a simple website, press/creators, App
   Store "Featuring nominations" form.

### 11. Maintenance (after launch)
1. Fix bugs, answer reviews, update for new iOS versions and new Apple
   requirements (e.g. Xcode SDK minimums each spring).
2. Renew the developer membership yearly or the app is removed.
3. Track sales and payouts in App Store Connect.

## C) Rough timeline for a small game

1. Design and setup: 1–2 weeks (organisation enrolment can add 1–4 weeks).
2. Prototype to complete game: weeks to months, depending on scope.
3. Wrapping, testing on devices, TestFlight: 1–3 weeks.
4. Store listing and review: a few days.

## D) Decisions the owner will need to make later

1. Individual or LLC.
2. Paid upfront vs free with purchases vs free.
3. iPhone only, or iPad too; Android too.
4. Own a Mac, borrow one, or use a cloud build service.
