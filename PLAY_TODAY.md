# Google Play — today

## What today can actually be

Two things decide this, and you need to know both before you start.

**1. New apps must now target API 36.** Since 31 August 2026, Google Play requires every new app and update to target Android 16 (API 36). Your project was on 34 and **would have been rejected on upload**. I have upgraded it to Capacitor 8, which targets 36, and rebuilt both native projects. That is fixed.

**2. The 12-tester rule decides your timeline.** A personal Play account created after 13 November 2023 cannot publish to production until 12 testers have been opted in to a *closed* test continuously for 14 days, and Google checks that those testers actually used the app. Organization accounts sit outside that requirement — but an organization account needs a D-U-N-S number, which can take up to 30 days. For one app, doing the 14-day test is usually faster than forming the org account, even though you already have Venderisgreat LLC.

**So: public Play listing today is not possible on a new personal account.** What *is* possible today is genuinely good:

- **Internal testing** gives you a real Play Store install link for up to 100 people, with no 14-day wait. Your app is on Google Play today, installed through the Play Store, by anyone you invite.
- **The closed test starts today**, which starts the 14-day clock immediately. Every day you delay is a day added to the public launch.

---

## Today, in order

### 1. Create the account — $25, once
play.google.com/console → pay $25 (one time, no renewal) → complete identity verification.
Choose **personal** unless you already have a D-U-N-S number in hand. It is the faster path for a single app.

### 2. Build the signed AAB
Play needs an `.aab`, not an APK. Run on the mini PC:
```
./build_apk.sh release
```
It creates the signing key on first run, then prints `UPLOAD THIS TO GOOGLE PLAY: sudoku-under-the-stars-release-<stamp>.aab`.

**Back up `sudoku-stars-release.jks` and `keystore.properties` outside the project immediately.** That key must sign every future update forever. Lose it and the app can never be updated.

### 3. Create the app in Play Console
Everything to paste is in `store/PLAY_STORE_METADATA.md`. Graphics are ready:
- icon: `store_icon_1024.png`
- feature graphic: `store_feature_graphic_1024x500.png`
- screenshots: `store/screenshots/*_play_phone.png`
- privacy policy URL: your Pages site + `/privacy.html` (required — deploy the PWA first)

Data safety: answer **No** to collecting or sharing any data. That is accurate; the app makes no network calls.

### 4. Upload to Internal testing FIRST
Upload the AAB to the **Internal testing** track. Add your own email. Install it from the Play Store link within minutes. Test it on a real phone before anyone else sees it.

### 5. Then promote the same build to Closed testing
This is the one that counts. Create a closed test, add your tester emails, and send them the opt-in link **today**. The 14-day clock starts when you have 12 opted in.

---

## Recruiting 12 testers

Real requirements people get wrong:
- 12 **distinct Google accounts**, opted in through your link, installed on a real device.
- Continuously opted in for 14 days. If someone opts out, the clock resets — **recruit 14 or 15, not exactly 12.**
- They must actually *use* the app. Twelve silent installs gets rejected with "continue testing with real testers."

Where to find yours: family, friends, coworkers at the airport, your vending accounts. Ask for one thing — play a few puzzles every few days for two weeks. That is a small ask and the app is genuinely fun, which helps.

Paid tester services exist (roughly $20) if you cannot find 12. They work, but real players give you real feedback.

---

## Realistic dates from today

| | |
|---|---|
| Today | $25 paid, AAB built, internal testing live, closed test started |
| Today | PWA live too — send that link to anyone who is not a tester |
| Day 14 | Closed test complete, apply for production access |
| Day 14–21 | Google reviews the application, then the app |
| **Public on Play** | **about 3 weeks from today** |

Apple later, as planned. The iOS project is already built and waiting in `ios/`.

---

## Verify before you upload

The upgrade to Capacitor 8 regenerated both native projects. I reapplied portrait lock, the signing config, and all launcher icons, and retested the game at phone portrait, phone landscape, tablet portrait and tablet landscape with zero errors. One consequence of API 36 worth knowing: on screens 600dp and wider, Android 16 ignores orientation locks, so the app **will** run landscape on tablets. It now has a proper landscape layout — grid on the left, constellation and keypad on the right — rather than the squashed mess it would have been.
