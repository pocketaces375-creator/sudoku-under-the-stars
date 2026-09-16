# Getting Sudoku Under the Stars onto phones

## The thing to understand first

There is no APK for Apple. Android uses `.apk`, which anyone can install from a link you send them. iOS uses `.ipa`, and Apple only permits installation through the App Store or TestFlight. You can run an iOS app on your own phone for nothing, but you cannot put it in front of a stranger for nothing.

So "send out the APK to both" isn't a single action. It's three different paths, and one of them is free and works on both platforms today.

---

## Path 1 — The web app (free, both platforms, works right now)

This is the one to start with. The game is already a full PWA: installs to the home screen, runs fullscreen with no browser chrome, works offline, saves progress.

**Setup (about ten minutes, $0):**

1. Push this project to a GitHub repo.
2. Repo Settings → Pages → Source: "GitHub Actions".
3. The included `.github/workflows/pwa.yml` deploys `www/` automatically on every push to `main`.
4. You get a URL like `https://yourname.github.io/sudoku-stars/`.

**What people do with that link:**
- **iPhone:** open in Safari → Share → Add to Home Screen. Must be Safari; Chrome on iOS cannot install PWAs.
- **Android:** open in Chrome → menu → Install app.

Both end up with the Orion icon on the home screen, launching fullscreen, indistinguishable from a store app for a game like this. HTTPS is required for offline caching, which GitHub Pages provides free.

**Honest limits:** no store listing, no discovery, no in-app purchases, and iOS may evict cached data after extended non-use. For getting it into hands this week, none of that matters.

---

## Path 2 — Android APK direct (free, Android only)

Build it and send the file. No store, no fee, no review.

- On the mini PC: `./build_apk.sh release` (see `JETT_TASK.md`)
- Or in the cloud: push a tag `v1.0.0` and `.github/workflows/android.yml` builds it on GitHub's runners, no local toolchain needed.

Recipients enable "Install unknown apps" for whatever app opens your link, then tap the APK. Good for friends, family, testers, and gift-shop demos.

**Keep the keystore.** The same signing key must sign every future update, forever. Back up `sudoku-stars-release.jks` and `keystore.properties` somewhere outside the project. Lose it and you cannot update the app on Play — you'd have to ship a new listing and lose your reviews.

---

## Path 3 — The stores

### Google Play — $25, one time
The registration fee is $25 USD paid once, with no renewal and no per-app charge. Upload the `.aab` (the Android workflow builds it alongside the APK).

Two things that catch first-timers: identity verification, and a closed-testing requirement — new personal accounts must run a closed test with 12 testers for 14 days before they can publish publicly. Budget 2–4 weeks from signup to live, not 2 days. If you register as an organization rather than a personal account, the 12-tester rule does not apply the same way — worth checking against your situation, since you already have Venderisgreat LLC.

### Apple App Store — $99/year
The Apple Developer Program is $99 USD per membership year, and it renews annually. There is no free path to the store. It covers unlimited apps under one account.

What you get: App Store distribution, and TestFlight for up to 100 internal testers and 10,000 external testers.

**TestFlight is the answer to "how do I send the app to iPhone people."** It's included in the $99, external testers install via an email invite or a public link, and builds go out before any store submission. External TestFlight builds need a beta review, but it is lighter than full App Store review.

---

## Building for iOS without a Mac

You have a Windows PC and an Ubuntu mini PC. Xcode only runs on macOS, so neither can build an iOS app locally. You do **not** need to buy a Mac.

`.github/workflows/ios.yml` runs on GitHub's `macos-14` runners. It:
- builds unsigned by default, which proves the app compiles
- builds signed and exports an `.ipa` once you add your certificates as repo secrets
- uploads straight to TestFlight if you add App Store Connect API keys

The iOS project is already generated at `ios/App`, with all 15 icon sizes and portrait lock configured.

**Secrets to add** (Repo → Settings → Secrets and variables → Actions), once you have the $99 membership:

| Secret | Where it comes from |
|---|---|
| `IOS_CERT_BASE64` | Distribution certificate exported as `.p12`, then `base64 -i cert.p12` |
| `IOS_CERT_PASSWORD` | The password you set on that `.p12` |
| `IOS_PROVISION_PROFILE_BASE64` | App Store provisioning profile, base64'd |
| `APPLE_TEAM_ID` | App Store Connect → Membership |
| `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_API_KEY_BASE64` | App Store Connect → Users and Access → Integrations → App Store Connect API |

Android secrets, for signed cloud builds: `KEYSTORE_BASE64` (`base64 -i sudoku-stars-release.jks`), `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

---

## What I'd actually do, in order

1. **This week — ship the PWA.** Free, both platforms, live in ten minutes. Put the link in the back of the book. Every reader with a phone becomes a player, and you learn whether people like the game before spending anything.
2. **Also this week — build the Android APK** and send it to a handful of people directly. Real install, real feedback.
3. **If people play it — pay the $25** and go to Google Play. Start the closed test early since the 14-day clock is the bottleneck.
4. **Only if Android shows traction — pay the $99** for Apple. It is a recurring cost and the review process is stricter. Let Android prove the game first.

Year one on both stores is $124, then $99/year for Apple alone. But the PWA costs nothing and answers the actual question — can people play this — today.

---

## Cross-promotion worth setting up

The book and the app sell each other:

- **In the book:** a page in the back with the PWA link and a QR code. Costs one page and turns readers into players.
- **In the app:** a quiet line on the star map — "200 more puzzles in print" — linking to your Amazon listing.

Same Orion, same constellation data, same star facts. That consistency is the brand, and it's the part competitors can't copy by generating a thousand sudoku grids.
