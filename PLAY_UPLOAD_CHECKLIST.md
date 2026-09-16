# Google Play upload — your 30 minutes tonight

Everything is built. This is the part only you can do.

## Before you start, have these open
- The .aab Jett sent you in Telegram: `sudoku-under-the-stars-release-20260916-0904.aab`
- `store/PLAY_STORE_METADATA.md` (all the text to paste)
- `store_icon_1024.png` and `store_feature_graphic_1024x500.png`
- `store/screenshots/` — the files ending `_play_phone.png`
- Privacy policy URL: `https://pocketaces375-creator.github.io/sudoku-under-the-stars/privacy.html`

## Step 1 — Account ($25, once)
play.google.com/console/signup → **Personal** → pay $25 → identity verification with a government ID.
Use the Google account you intend to keep. Changing it later needs a formal app transfer.

## Step 2 — Create the app
Create app → App name: `Sudoku Under the Stars` → English (US) → **App** (not Game… actually choose **Game**) → **Free** → accept the declarations.

## Step 3 — The forms Play makes you fill before any upload
Work down the "Set up your app" checklist:

- **App access** → "All functionality is available without special access". No login exists.
- **Ads** → No, my app does not contain ads.
- **Content rating** → complete the questionnaire, answer **No** to everything. You will get "Everyone".
- **Target audience** → 13+. Do not select under-13; it pulls you into the stricter Families program you do not need.
- **News app** → No.
- **Data safety** → "Does your app collect or share any of the required user data types?" → **No**. That is the whole section, and it is accurate.
- **Government apps** → No.
- **Financial features** → None.
- **Privacy policy** → paste the URL above.

## Step 4 — Store listing
Paste from `store/PLAY_STORE_METADATA.md`:
- Short description (80 char)
- Full description
- App icon → `store_icon_1024.png`
- Feature graphic → `store_feature_graphic_1024x500.png`
- Phone screenshots → the five `_play_phone.png` files (Play needs at least 2; give it all 5)

## Step 5 — Internal testing FIRST
Testing → Internal testing → Create new release → upload the `.aab`.
Release name: `1.0.0`. Release notes: `First release. 88 constellations, 88 puzzles.`
Add yourself as a tester → save → review → **Start rollout to Internal testing**.

You will get an opt-in link within minutes. Open it on your phone, accept, install from the Play Store, and play a level. **Do not skip this.** It is the last chance to catch anything before other people see it.

## Step 6 — Closed testing (this starts the 14-day clock)
Testing → Closed testing → Create a track → **promote the same release** from internal (no rebuild needed).
Create an email list, add your 14–15 testers' Gmail addresses, start rollout, and send them the opt-in link tonight.

**The clock starts when 12 are opted in — not when you create the track.** Chase the stragglers.

## Step 7 — Day 14
Play Console will show a "Apply for production access" button once you have had 12 testers opted in for 14 continuous days. You fill in a short questionnaire about what feedback you got and what you changed. Then Google reviews it.

---

## The three ways people lose weeks here
1. **Exactly 12 testers.** One opts out, clock resets to zero. Get 15.
2. **Testers who never open it.** Google checks engagement. Message the group once a week.
3. **Losing the keystore.** Copy `/home/fictive/keys-backup/` onto a USB stick or your main PC tonight. Without it this app can never be updated, ever.
