# TASK-SUDOKU-PLAY-1 — build the Play Store bundle

**Deliverable:** a signed .aab file for Google Play, plus the release .apk, with the keystore backed up and its location reported.

This is a NEW project, unrelated to Runewake. Work only in /home/fictive/sudoku-stars. Do not touch runewake lanes, TASKS_QUEUE.md, the foreman, the burn guard, or ~/.hermes/config.yaml.

## Rules
- One step at a time. Check the success condition before moving on.
- On failure: STOP, report the exact command and error to the Telegram group, do not retry the same command.
- Long downloads are not failures. Poll the log, do not restart.
- NEVER commit or send a .jks file or keystore.properties to git or anywhere public.

## STEP 1 — replace the project with the new build
The old copy targets API 34 and Google Play will reject it. You need the new zip.
Run: ls -la /home/fictive/sudoku-stars-v2.zip
Run: unzip -l /home/fictive/sudoku-stars-v2.zip | grep -c "ios/"
Success: greater than 50.
Run: cd /home/fictive && rm -rf sudoku-stars-old && mv sudoku-stars sudoku-stars-old 2>/dev/null; mkdir -p sudoku-stars && unzip -o sudoku-stars-v2.zip -d sudoku-stars && cd sudoku-stars && ls -a
Success: you see .github, android, ios, www, build_apk.sh, store, PLAY_TODAY.md.

## STEP 2 — confirm the target SDK
Run: grep targetSdkVersion android/variables.gradle
Success: it says 36. If it says anything lower, STOP and report — the upload will be rejected.

## STEP 3 — build the release bundle
Run: cd /home/fictive/sudoku-stars && nohup setsid bash -l -c './build_apk.sh release' > build_release.log 2>&1 &
This creates a signing key and downloads Gradle 8.14.3 and the API 36 build tools. First run can take 20 to 40 minutes.
Poll every 3 minutes: tail -5 build_release.log
If it reports the Android SDK was not found, run once:
  grep android_sdk_path ~/.config/godot/editor_settings-4.3.tres
then: nohup setsid bash -l -c 'ANDROID_HOME=<that path> ./build_apk.sh release' > build_release2.log 2>&1 &
If it fails because the SDK has no API 36 platform, run:
  yes | "$ANDROID_HOME"/cmdline-tools/latest/bin/sdkmanager "platforms;android-36" "build-tools;36.0.0"
then re-run the build ONCE.
Success: the log contains a line starting "UPLOAD THIS TO GOOGLE PLAY:" and a line starting "DONE:".

## STEP 4 — back up the signing key
Run: cd /home/fictive/sudoku-stars && cp sudoku-stars-release.jks keystore.properties /home/fictive/keys-backup/ 2>/dev/null || (mkdir -p /home/fictive/keys-backup && cp sudoku-stars-release.jks keystore.properties /home/fictive/keys-backup/)
Run: ls -la /home/fictive/keys-backup/
Success: both files are there.
Post to the group: "Keystore backed up at /home/fictive/keys-backup/ — Trikzos, copy this off the machine too. Without it the app can never be updated on Play."

## STEP 5 — deliver
Send the .aab file to the Telegram group. Do NOT send the .jks.
Report: the .aab filename and size in MB, the .apk filename and size, the target SDK line, and the signer CN printed by apksigner.

## Acceptance
- [ ] build_release.log contains "UPLOAD THIS TO GOOGLE PLAY:"
- [ ] an .aab file exists in the project directory
- [ ] target SDK confirmed as 36
- [ ] keystore and properties copied to /home/fictive/keys-backup/
- [ ] .aab sent to the group, .jks NOT sent

## Do not
- Do not create a Google Play or Apple account. That costs money and is Trikzos' decision.
- Do not edit anything in www/, android/ or ios/.
- Do not enable the ios.yml workflow. It needs Apple secrets that do not exist yet.
