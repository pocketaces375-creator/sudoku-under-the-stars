# Launch day — what is actually possible

## The honest timeline

**App Store today: not possible.** Not because of anything missing on our side. Apple requires a paid Developer Program membership before you can submit anything, and enrollment is officially 24–48 hours — while many developers in early 2026 report 2–7+ weeks with no communication. After that, a new app typically sits 1–3 days in "Waiting for Review". Nobody can compress this, and no amount of preparation changes it.

**What IS possible today:** the game live on a public link that installs on every iPhone and Android on earth, plus an Android APK you can send directly. That is a real launch. Most people will never know it isn't a store app.

---

## TODAY — three things, about an hour total

### 1. Put the game online (15 min, free)
Hand Jett the brick from earlier. It creates the GitHub repo, enables Pages, and deploys. You end with:
`https://<username>.github.io/sudoku-under-the-stars/`

**iPhone:** open in Safari → Share → Add to Home Screen.
**Android:** open in Chrome → menu → Install app.

Both get the Orion icon, fullscreen, offline. This is your launch.

### 2. Build the Android APK (20–40 min, mostly waiting)
`./build_apk.sh debug` on the mini PC. Send the file to anyone directly.

### 3. Tell people (10 min)
Text the link to ten people today. That is your first real feedback and it costs nothing.

---

## TODAY — start the Apple clock

Do this today even though the launch is later, because enrollment is the long pole.

1. Go to developer.apple.com/programs/enroll and pay the $99.
2. **Enroll as Venderisgreat LLC, not as an individual,** if you want the company name on the listing. This needs a D-U-N-S number, which is free from Dun & Bradstreet but adds days. If you want speed, enroll as an individual — you can change it later.
3. Make sure the legal name you enter matches your government ID **exactly**. A formatting mismatch is the single most common cause of multi-week enrollment stalls.
4. Then wait. Nothing else you do affects this.

While waiting, everything Apple needs is already built:
- Screenshots: `store/screenshots/` (6.9-inch set is all that is required)
- Every metadata field: `store/APP_STORE_METADATA.md`
- Privacy policy: goes live automatically at `/privacy.html` when Pages deploys — Apple will not accept a submission without this URL
- iOS project and a macOS build pipeline: `ios/` and `.github/workflows/ios.yml`

---

## WHEN ENROLLMENT CLEARS — the submission day

1. App Store Connect → new app, bundle ID `com.lucidmind.sudokustars`.
2. Paste every field from `store/APP_STORE_METADATA.md`. Upload the screenshots.
3. Add your Apple certificates as GitHub secrets (listed in `DISTRIBUTION.md`), push a tag, and the iOS workflow builds and uploads the build to TestFlight automatically. **You never need a Mac.**
4. Put it in front of 10–20 TestFlight testers for a few days first. Bugs found by testers cost you nothing; bugs found by a reviewer cost you a rejection cycle.
5. Submit. **Submit Tuesday or Wednesday morning, never Friday** — weekend queues are the worst.

### One thing to verify before you submit
As of 28 April 2026, builds uploaded to App Store Connect must use the iOS 26 SDK or later. The iOS workflow uses GitHub's `macos-14` runner. Before submitting, run the iOS workflow once and check it compiles; if it fails on an SDK version, change `macos-14` to `macos-15` (or the newest available) in `.github/workflows/ios.yml`. This is a one-word edit.

---

## Google Play, in parallel

$25 once. Worth starting today too, because personal accounts created after November 2023 must run a **closed test with 12 testers for 14 days** before publishing publicly. That 14-day clock is the bottleneck, so start it now.

If you register as **Venderisgreat LLC** rather than personally, that 12-tester requirement works differently — worth checking against your own situation, since you already have the company.

---

## Realistic dates, if you start today

| | |
|---|---|
| Today | PWA live, APK in hands, both store accounts paid for |
| Today + 2 to 14 days | Apple enrollment clears (could be longer) |
| + 1 day | Build uploaded, TestFlight running |
| + 3 days | Submit to review |
| + 1 to 3 days | Approved |
| **Realistic App Store live** | **1 to 3 weeks out** |
| **Realistic Play live** | **~3 weeks** (the 14-day closed test governs) |

The link works today. That is the part that matters.
