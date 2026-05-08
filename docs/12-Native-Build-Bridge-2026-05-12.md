# 12 — Native Build Bridge — Week of 12–25 May 2026

**Owner:** Dr Mubashir (MH) with CC support  
**Goal:** Ship to TestFlight + Play internal track by 25 May. App Store + Play public by end of June.  
**Prerequisites before starting this doc:** web F&F launch (Mon 11 May) complete and stable.

---

## Current state (as of 2026-05-08 T-3)

All scaffolding is done. Nothing below requires code changes to `src/`.

| Artefact | State |
|---|---|
| `ios/App/` Capacitor project | Exists on `main`. Pods installed. Info.plist has all snippet keys. |
| `android/app/` Capacitor project | Exists on `main`. AndroidManifest merged. network_security_config.xml in place. |
| Brand icons + splash | Committed 2026-05-08 — all Android density buckets + iOS AppIcon + Splash imageset |
| `out/` static export | Runs via `npm run build:mobile`. Blocker: dynamic server components drop most pages (see §2 below). |
| `cap sync` | Verified clean (2026-05-08). Requires `xattr` fix on `ios/App/build` if it reappears. |
| iOS simulator build | **BUILD SUCCEEDED** 2026-05-08 (unsigned, iphonesimulator SDK, arm64 + x86_64) |
| Android APK | **BLOCKED** — Java runtime missing on this Mac. Install JDK 17 first (§1). |

---

## §1 — Prerequisites (MH: install before Week of 12 May)

### Java (Android build blocker)

```bash
# Install via Homebrew (recommended)
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
java -version   # must show: openjdk 17.x
```

### Android SDK env var (needed by Gradle)

```bash
echo 'export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"' >> ~/.zshrc
source ~/.zshrc
echo $ANDROID_SDK_ROOT   # should print /Users/mmh/Library/Android/sdk
```

### Xcode signing (for TestFlight — not needed for simulator)

1. Open Xcode → Preferences → Accounts → add your Apple ID (the one enrolled in the Apple Developer Program)
2. Team must show **Global Apex NET** or your personal team if personal enrolment
3. Bundle ID must be `world.tenu.app` — verify in the project target settings

### Android keystore (for Play internal track)

```bash
keytool -genkey -v -keystore ~/.android/tenu-release.jks \
  -alias tenu -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore password in 1Password immediately. Add to `android/keystore.properties` (gitignored):

```
storeFile=/Users/mmh/.android/tenu-release.jks
storePassword=<from 1Password>
keyAlias=tenu
keyPassword=<from 1Password>
```

---

## §2 — Fix static export for mobile routes (CC task, ~2h, Week of 12 May)

The `out/` directory currently only exports `404.html`. Mobile routes
(`/intro/`, `/app-home/*`) are server components using `cookies()` /
`headers()` — Next.js marks them dynamic and drops them from the export.

**Fix:** add `export const dynamic = 'force-static'` to every mobile
route layout/page, OR migrate those routes to use `generateStaticParams`
where applicable.

Tracked as CC: `bug(mobile): fix static export — dynamic server components drop mobile routes from out/`.

Until fixed, `cap sync` copies a near-empty `out/` — the WebView loads
only the 404 page.

---

## §3 — Week of 12 May — Android debug APK

```bash
# From repo root
npm run build:mobile          # produces out/ — must be non-empty after §2 fix
npx cap sync android          # copies out/ into android/app/src/main/assets/public/

cd android
./gradlew assembleDebug 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`. APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

Red flag: `Could not resolve com.android.tools.build:gradle` → check `ANDROID_SDK_ROOT` and that build-tools 34.0.0 is installed via Android Studio SDK Manager.

---

## §4 — Week of 12 May — iOS simulator run

```bash
# From repo root
npm run build:mobile
npx cap sync ios

npx cap open ios    # opens Xcode
```

In Xcode:
1. Select scheme **App** → simulator **iPhone 16 Pro** (iOS 17+)
2. Cmd+R — should boot and show the Tenu intro or app-home
3. Check console for: `WKWebView loaded tenu.world` or similar Capacitor log

---

## §5 — Week of 14 May — Device testing

### iOS physical device

1. Connect iPhone via USB, trust Mac
2. Xcode → Devices — device appears under connected
3. Select device in scheme selector → Build & Run (Cmd+R)
4. App must open, magic link must flow through Safari and back to app (`tenu://` deep link)

### Android physical device

1. Enable Developer Options on Android phone → USB Debugging
2. `adb devices` — device listed
3. `./gradlew installDebug` from `android/`
4. App opens, test same magic-link deep-link flow

---

## §6 — Week of 18 May — TestFlight submission

```bash
# Build archive in Xcode
# Product → Archive → Distribute App → App Store Connect → Upload
```

OR via Xcode Cloud (preferred — no local signing needed):

1. Xcode → Product → Xcode Cloud → Create Workflow
2. Trigger: push to `main` branch
3. Actions: Build → Archive → TestFlight (internal)
4. Add Dr Mubashir as internal tester

Checklist before first TestFlight upload:
- [ ] Bundle ID `world.tenu.app` registered in App Store Connect
- [ ] `CFBundleVersion` incremented (Xcode manages this with Xcode Cloud)
- [ ] `PrivacyInfo.xcprivacy` added to Xcode target (not just folder — must appear in Build Phases → Copy Bundle Resources)
- [ ] App Store Connect → App Privacy filled in (camera, photos: product functionality)
- [ ] Age rating questionnaire completed (no restricted content)

---

## §7 — Week of 21 May — Play internal track

```bash
# Build release APK / AAB
cd android
./gradlew bundleRelease   # produces app-release.aab
```

Upload to Play Console → Internal testing → Create new release → Upload AAB.

Checklist:
- [ ] Signed with release keystore (§1)
- [ ] `assetlinks.json` at `https://tenu.world/.well-known/assetlinks.json` contains correct SHA-256 fingerprint
- [ ] Target API 34 confirmed in `android/app/build.gradle` (`targetSdkVersion 34`)
- [ ] Data safety form completed in Play Console

---

## §8 — Screenshots backlog (CC task)

6 iOS screenshots at 6.9-inch (1320×2868 px) and 4 Play screenshots at 16:9 (1920×1080 px) are needed before public store listing.

Approach: run the simulator with seeded inspection data, capture via Xcode/Android Studio, post-process in Figma with device frames and caption overlays.

Tracked as CC: `6 iOS screenshots at 6.9 inch + 4 Play screenshots at 16:9`.

---

## §9 — App Store reviewer notes

Key notes to include when submitting for review:

> **Demo credentials:** tenu-reviewer@tenu.world / magic link — send to reviewer@apple.com as requested  
> **Payment:** use Stripe test card 4242 4242 4242 4242  
> **Camera permission:** required for photo evidence capture; shown at runtime with French usage string  
> **Physical service exception:** Tenu analyses physical property inspections. Payment is for a service delivered outside the app. IAP not applicable per App Store Guidelines §3.1.3(b).

---

## §10 — Open TASKS.md lines that move here from launch checklist

The following items were listed as p:0 in the launch tracker but are only relevant post-web-launch. They are now formally scheduled to the week of 12–25 May:

| Task | Owner | Planned week |
|---|---|---|
| `npm run build:mobile` producing non-empty out/ | CC (§2 fix) + MH verify | W/C 12 May |
| `npx cap add ios` (if project missing) — project already exists | — | N/A |
| capacitor-assets generate — DONE 2026-05-08 | CC | Done |
| `npx cap sync` — DONE 2026-05-08 | CC | Done |
| Xcode Team ID + Bundle + capabilities + simulator run | MH | W/C 12 May |
| Android Studio emulator run | MH | W/C 12 May |
| iOS physical device build | MH | W/C 14 May |
| Android physical device install | MH | W/C 14 May |
| TestFlight internal submission | MH | W/C 18 May |
| Play internal track submission | MH | W/C 21 May |
| 6 iOS + 4 Play screenshots | CC | W/C 18 May |
| App Store review submission | MH | W/C 25 May |

---

*Created: 2026-05-08 — consolidates docs/10 + docs/11 handover notes with current build state.*
