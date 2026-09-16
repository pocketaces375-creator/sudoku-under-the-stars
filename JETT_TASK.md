# TASK-SUDOKU-APK-1 — build the Sudoku Under the Stars Android APK

**Deliverable (first line, plain English):** a signed release APK of Sudoku Under the Stars, installed and launched on Trikzos' phone, screenshot of the title screen as evidence.

## What you are given
The complete app, already built and tested. `www/` holds the finished game (index.html + three .js files). `android/` is a generated Capacitor Gradle project with icons, portrait lock, and a release signing config already wired. **Do not edit anything in `www/` or `android/app/src/main/java`.** Your job is the compile step only.

## Steps (progressive — stop at the first FAIL and report it, do not retry the same command)
1. `cd` to the project directory and run `./build_apk.sh debug`.
   - It checks JDK 17 and the Android SDK first. The SDK is the one Godot uses for Runewake; if the script cannot find it, read `export/android/android_sdk_path` from `~/.config/godot/editor_settings-4.3.tres` and run `ANDROID_HOME=<that path> ./build_apk.sh debug`.
   - First run downloads Gradle (~150 MB) and Android build deps. This can take 10–20 minutes. Run it detached (`nohup setsid bash -l -c './build_apk.sh debug' > build_debug.log 2>&1 &`) and poll the log; do not restart it while it is still downloading.
2. When it prints `DONE: sudoku-under-the-stars-debug-*.apk`, send that APK to the Telegram group so Trikzos can sideload and confirm it launches.
3. Only after Trikzos confirms the debug build runs: `./build_apk.sh release`. This generates a NEW keystore on first run and prints where it is. Copy `sudoku-stars-release.jks` and `keystore.properties` to a backup location outside the project directory and tell Trikzos where. Losing this key means the app can never be updated on Google Play.
4. Send the release APK to the group. Report: file size, `versionCode` (in `android/app/build.gradle`, currently 1), and the signer CN from the script's apksigner line.

## Acceptance (all required, with evidence)
- [ ] `build_debug.log` ends with `DONE:` and the debug APK is > 3 MB and < 20 MB
- [ ] release APK exists and apksigner reports a signer CN of "Sudoku Under the Stars"
- [ ] keystore + properties backed up outside the project and the path reported
- [ ] Trikzos confirms the app launches on his phone (his screenshot or his word in the group)

## Known-good facts / traps
- `android/local.properties` is written by the script; if Gradle says "SDK location not found", ANDROID_HOME was wrong — fix the variable, do not edit Gradle files.
- If Gradle fails on a JDK version error, JAVA_HOME must point to JDK 17 exactly (`/usr/lib/jvm/java-17-openjdk-amd64`), not a newer one.
- If the phone refuses to install the release APK over a debug one, uninstall the debug build first (same package id `com.lucidmind.sudokustars`, different signatures).
- The app stores progress in WebView localStorage; uninstalling wipes it. That is expected for now.
- Nothing here touches Runewake lanes, the queue, or `~/.hermes/config.yaml`. Work in this project directory only.

## For later versions (not this task)
- To change the app: edit `www/`, then `npx cap sync android`, then rebuild. Bump `versionCode` and `versionName` in `android/app/build.gradle` for every Play upload.
