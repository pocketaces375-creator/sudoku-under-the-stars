# Sudoku Under the Stars — app

Playable web build in `www/` (open `www/index.html` in any browser; works offline, saves progress in localStorage).
Android project in `android/` (Capacitor). Build with `./build_apk.sh debug` or `./build_apk.sh release` on a machine with JDK 17 + Android SDK.
Store assets: `store_icon_1024.png`, `store_feature_graphic_1024x500.png`.
Hand-off instructions for the build agent: `JETT_TASK.md`.

Game: 88 levels, one per IAU constellation, ordered Easy (1–30) → Medium (31–60) → Hard (61–88). Every puzzle is generated deterministically from the level seed and verified to have exactly one solution. Constellation figures are drawn from real star positions; the fact shown on the win screen rotates each time a level is replayed.
