#!/usr/bin/env bash
# Builds Sudoku Under the Stars for Android. Run from the project root.
# Usage: ./build_apk.sh debug | release
set -euo pipefail
MODE="${1:-debug}"
cd "$(dirname "$0")"

echo "== 1/5 toolchain check"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
[ -x "$JAVA_HOME/bin/java" ] || { echo "FAIL: JDK 17 not at $JAVA_HOME. Set JAVA_HOME."; exit 2; }
[ -d "$ANDROID_HOME/platforms" ] || { echo "FAIL: Android SDK not at $ANDROID_HOME. Set ANDROID_HOME to the SDK Godot uses (see ~/.config/godot/editor_settings-4.3.tres export/android/android_sdk_path)."; exit 2; }
command -v node >/dev/null || { echo "FAIL: node missing (need 18+)"; exit 2; }
echo "java=$("$JAVA_HOME/bin/java" -version 2>&1 | head -1)  sdk=$ANDROID_HOME  node=$(node -v)"
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

echo "== 2/5 web assets -> android"
[ -d node_modules ] || npm install --no-audit --no-fund
npx cap sync android

if [ "$MODE" = "release" ]; then
  echo "== 3/5 signing key"
  if [ ! -f keystore.properties ]; then
    KS="$PWD/sudoku-stars-release.jks"
    PW="$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | head -c 20)"
    "$JAVA_HOME/bin/keytool" -genkeypair -v -keystore "$KS" -alias sudokustars -keyalg RSA -keysize 2048 -validity 10000 \
      -storepass "$PW" -keypass "$PW" -dname "CN=Sudoku Under the Stars, O=The Lucid Mind Collection, C=US"
    printf 'storeFile=%s\nstorePassword=%s\nkeyAlias=sudokustars\nkeyPassword=%s\n' "$KS" "$PW" "$PW" > keystore.properties
    chmod 600 keystore.properties "$KS"
    echo "NEW KEYSTORE CREATED: $KS  (password in keystore.properties). BACK BOTH UP - Play updates need this exact key."
  fi
  cp keystore.properties android/keystore.properties
fi

echo "== 4/5 gradle ($MODE)"
cd android
chmod +x gradlew
if [ "$MODE" = "release" ]; then ./gradlew --no-daemon assembleRelease bundleRelease; else ./gradlew --no-daemon assembleDebug; fi
cd ..

echo "== 5/5 result"
STAMP=$(date +%Y%m%d-%H%M)
APK=$(ls -t android/app/build/outputs/apk/$MODE/*.apk | head -1)
OUT="sudoku-under-the-stars-$MODE-$STAMP.apk"
cp "$APK" "$OUT"; ls -la "$OUT"
"$ANDROID_HOME"/build-tools/*/apksigner verify --print-certs "$OUT" 2>/dev/null | head -3 || true
if [ "$MODE" = "release" ]; then
  AAB=$(ls -t android/app/build/outputs/bundle/release/*.aab 2>/dev/null | head -1)
  if [ -n "$AAB" ]; then
    OUTAAB="sudoku-under-the-stars-release-$STAMP.aab"
    cp "$AAB" "$OUTAAB"; ls -la "$OUTAAB"
    echo "UPLOAD THIS TO GOOGLE PLAY: $OUTAAB"
  fi
fi
echo "TARGET SDK: $(grep targetSdkVersion android/variables.gradle | tr -dc 0-9)"
echo "DONE: $OUT"
