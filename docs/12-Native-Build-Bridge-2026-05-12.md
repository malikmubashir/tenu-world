# Native Build Bridge — 2026-05-12

Dr Mubashir — this doc covers everything between soft launch (11 May) and both
store submissions. The window is 11–25 May. Each section is numbered, has an
"Expected" line and a "Red flag" line. If a red flag fires, stop and read that
section fully before improvising. Steps gate each other: do not skip ahead.

All commands are copy-pasteable as-is. Versions are pinned to what the repo
ships today (2026-05-06). Do not upgrade packages mid-run.

**Prerequisite hardware/software**

| Requirement | Version | Check |
|---|---|---|
| macOS | 14.0+ (Sonoma) | `sw_vers -productVersion` |
| Xcode | 16.2+ | `xcodebuild -version` |
| Xcode Command Line Tools | same as Xcode | `xcode-select -p` |
| Android Studio | Meerkat (2024.3) | Help → About |
| Java (JDK) | 17 (LTS) | `java -version` |
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x+ | `npm --version` |
| Capacitor CLI | 7.2.x | `npx cap --version` |

If any of those are missing, install first. The rest of this doc assumes
they are present.

---

## 0. Sync the repo (start here every session)

```bash
cd "/Users/mmh/Documents/Claude/Projects/Tenu.World"
git fetch --prune
git checkout main
git pull --rebase
```

Expected: fast-forward, no conflicts. HEAD should be at the EX-6 commit
(`feat(mobile): EX-6 — camera retry, upload-resume intent cache, reconnect drain`)
or later.

Red flag: merge conflicts or ERESOLVE on pull. Stash your work, investigate,
do NOT force-pull. If `.git/*.lock` blocks the pull:

```bash
find .git -maxdepth 2 -name '*.lock' -delete
```

---

## 1. Clean install

```bash
rm -rf node_modules .next out
npm install
```

Expected: `added N packages` (N ≈ 900), exits 0.
There will be ~8 high-severity advisories from `@capacitor/assets → sharp`.
These are known and acknowledged — not blocking.

Red flag: `EBADENGINE` → your Node is too old (need ≥20). Run `nvm use 20`
or install from nodejs.org. `ERESOLVE` → a dep lock mismatch, usually from
a manual package.json edit. Run `npm install --legacy-peer-deps` as a
temporary escape hatch, then file a TASKS.md issue.

---

## 2. Build the static export (Capacitor web layer)

```bash
npm run build:mobile
```

Expected: exits 0, `out/` contains `404.html`, `_next/`, `.well-known/`,
and any locale-prefixed paths that are statically exported.

Known warning you can ignore:

```
⚠ "headers" option in next.config is not supported with "output: export".
```

Red flag: route errors (missing `generateStaticParams`) or `out/` only
contains `404.html`. That means a new dynamic route was added without
static params. Find the new file under `src/app/`, add `generateStaticParams`,
rebuild.

---

## 3. Install or verify native platforms

Run this check first — if the folders already exist from a prior session,
skip the `cap add` commands:

```bash
ls ios/ android/ 2>/dev/null && echo "platforms present" || echo "need cap add"
```

If "need cap add":

```bash
npx cap add ios
npx cap add android
```

Expected: `ios/` and `android/` directories created. Capacitor prints
"✅ ios platform added" and "✅ android platform added".

Red flag: `Plugin "CapacitorSQLite" not found` during `cap add`. Run
`npm install @capacitor-community/sqlite` then retry.

---

## 4. Sync Capacitor (always run before opening native IDE)

```bash
npx cap sync
```

Expected: "Sync finished in X.Xs". Plugins listed include Camera, SQLite,
Network, SplashScreen, StatusBar, Filesystem, Preferences.

Red flag: `Plugin "CapacitorCamera" version mismatch`. Your native platform
was built against an older Capacitor version. Delete `ios/` and `android/`,
re-run steps 3–4.

---

## 5. Merge native config snippets

These files under `mobile/` need to be merged into the native projects once
after `cap add`. If you already did this in April, skip to step 6 — but
verify the files exist first.

### 5a. iOS — Info.plist camera + photo library usage strings

Open `ios/App/App/Info.plist` in any text editor. Find the `<dict>` root.
Add these keys if not already present (copy from
`mobile/ios-Info.plist.snippet.xml`):

```xml
<key>NSCameraUsageDescription</key>
<string>Tenu uses your camera to photograph rooms during a move-in or move-out inspection.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Tenu reads photos from your library when you choose to upload existing images.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Tenu never saves photos to your library — this permission is not used.</string>
```

Expected: no Xcode build errors about missing usage descriptions.

Red flag: App Store Connect rejects with "Missing Privacy Manifest" — see
step 5c.

### 5b. Android — AndroidManifest permissions + network security config

Open `android/app/src/main/AndroidManifest.xml`. Confirm these lines are
present inside `<manifest>` (before `<application>`):

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

Also confirm `<application>` has:

```xml
android:networkSecurityConfig="@xml/network_security_config"
```

The file `android/app/src/main/res/xml/network_security_config.xml` should
already exist (from `mobile/network_security_config.xml`). If not:

```bash
mkdir -p android/app/src/main/res/xml
cp mobile/network_security_config.xml android/app/src/main/res/xml/
```

### 5c. iOS — Privacy Manifest (PrivacyInfo.xcprivacy)

Copy the manifest into the native project:

```bash
cp mobile/PrivacyInfo.xcprivacy ios/App/App/PrivacyInfo.xcprivacy
```

Then open Xcode (step 6a) and confirm it appears in the Project navigator
under `App → App → PrivacyInfo.xcprivacy`. If not, drag it in from Finder.

---

## 6. iOS — TestFlight submission

### 6a. Open Xcode

```bash
npx cap open ios
```

Expected: Xcode opens with the `App.xcworkspace` project.

Red flag: Xcode opens `App.xcodeproj` instead of the workspace. Close it,
then `open ios/App/App.xcworkspace` manually. Always use the workspace —
the project file omits CocoaPods / SPM integrations.

### 6b. Select the "Any iOS Device (arm64)" build target

In the scheme selector (top-left toolbar), set:
- Target: **App**
- Destination: **Any iOS Device (arm64)**

Do NOT select a simulator — simulators cannot generate an `.ipa`.

### 6c. Set the version and build number

Navigate to: **Project navigator → App → TARGETS → App → General**

| Field | Value |
|---|---|
| Version | 1.0.0 |
| Build | Increment by 1 from last TestFlight upload |

If this is the first upload, set Build to **1**. App Store Connect will
reject duplicate build numbers for the same version.

### 6d. Sign the app

Still in **General → Signing & Capabilities**:

- Automatically manage signing: **✓ enabled**
- Team: **Global Apex NET** (or whichever entity owns the Apple Developer account)
- Bundle Identifier: `world.tenu.app`

Expected: Xcode shows "Signing Certificate: Apple Development: …" with no
red warning banners.

Red flag: "No account for team". Open **Xcode → Settings → Accounts**,
add the Apple ID tied to the developer account, then re-visit Signing.

### 6e. Archive the build

Menu: **Product → Archive**

Expected: Xcode builds (~3–8 min), then the Organizer window opens showing
a new archive row.

Red flag: build errors about missing symbols from Capacitor plugins. Most
common cause: `npx cap sync` was not run after the last `npm install`. Close
Xcode, run `npx cap sync`, reopen, retry archive.

### 6f. Upload to App Store Connect (TestFlight)

In the Organizer:
1. Select the new archive → **Distribute App**
2. Choose **TestFlight & App Store**
3. Choose **Upload**
4. Leave all options at defaults (include symbols: yes, manage version: yes)
5. Click **Upload**

Expected: "Package uploaded successfully". Processing in App Store Connect
takes 5–30 minutes.

Red flag: "Invalid signature" or "The binary is not signed". Your signing
certificate may have expired or the provisioning profile is stale. Go to
[developer.apple.com/account/resources/certificates](https://developer.apple.com/account/resources/certificates),
revoke the expired certificate, let Xcode regenerate it under Automatic
Signing.

### 6g. Add Dr Mubashir as internal tester

In [App Store Connect → TestFlight → Internal Testing](https://appstoreconnect.apple.com):
1. Create group "Internal" if it doesn't exist
2. Add mubashirr@gmail.com
3. Enable the build once it passes Apple's automated review (~15–30 min)

Internal testers get the build immediately — no Apple review needed.

---

## 7. Android — Play Store internal track submission

### 7a. Open Android Studio

```bash
npx cap open android
```

Expected: Android Studio opens with the Gradle project.

Red flag: "Gradle sync failed". In Android Studio, go to **File → Project
Structure → SDK Location** and verify the Android SDK path is set. If
missing, install the SDK via **SDK Manager → SDK Platforms → API 35**.

### 7b. Sync Gradle

**File → Sync Project with Gradle Files**

Expected: BUILD SUCCESSFUL in the build output tab.

Red flag: `minSdk` conflict. Our `android/variables.gradle` sets minSdkVersion
to 23. If a Capacitor plugin requires higher, update `minSdkVersion` in that
file (not in the app's build.gradle directly).

### 7c. Generate a signed APK / AAB

Menu: **Build → Generate Signed Bundle / APK**

1. Choose **Android App Bundle (.aab)** — required for Play Store
2. Click **Next**
3. Key store path: browse to your keystore file (`.jks`)
   - If you do not have a keystore yet, click **Create new** and fill in:
     - Store path: `~/tenu-release.jks`
     - Password: store in 1Password as "Tenu Play Store keystore"
     - Alias: `tenu-release`
     - Key validity: 25 years
     - First and last name: Dr Mubashir (or Global Apex NET)
4. Select build variant: **release**
5. Click **Finish**

Expected: `android/app/release/app-release.aab` created.

Red flag: "Keystore was tampered with, or password was incorrect". Password
mismatch — retrieve from 1Password and try again. Do NOT generate a new
keystore if you already uploaded one to Play Console — the signing key is
permanently bound to the app listing.

### 7d. Upload to Play Console — internal testing track

1. Go to [play.google.com/console](https://play.google.com/console)
2. Select **Tenu** → **Testing → Internal testing**
3. Click **Create new release**
4. Upload `android/app/release/app-release.aab`
5. Release name: `1.0.0 (build N)` — use the same build number you set in step 7c
6. What's new: leave blank for internal track
7. Click **Save → Review release → Start rollout to Internal testing**

Expected: status changes to "In review" then "Available" within ~1 hour
(internal track bypasses most Play review).

Red flag: "App bundle contains errors: The minSdkVersion (X) is higher than
the target device". This means a test device runs an Android version below
API 23. For internal testing only, swap the device.

### 7e. Add internal testers

In **Play Console → Internal testing → Testers**:
1. Create a list called "Internal"
2. Add mubashirr@gmail.com (and any other testers)
3. Share the opt-in link from Play Console with testers

---

## 8. Screenshot requirements (for store review submissions)

Both stores require screenshots before the public submission. Internal
testing does not require them.

### iOS screenshots (required before App Store Review)

| Device | Size | Count |
|---|---|---|
| iPhone 16 Pro Max (6.9") | 1320×2868 px | 3–10 |
| iPad Pro 13" (6th gen) | 2048×2732 px | 3–10 (if supporting iPad) |

Quickest path: run the app in the iOS Simulator (iPhone 16 Pro Max),
navigate through the onboarding and inspection flow, and capture with
**Device → Screenshot** (⌘S in Simulator). Upload via App Store Connect
under the relevant version's metadata.

### Android screenshots (required before Google Play Review)

| Device | Size | Count |
|---|---|---|
| Phone | 1080×1920 px or 1440×2560 px | 2–8 |

Capture from the Android emulator (Pixel 9 Pro, API 35) via the camera
button in the emulator toolbar. Upload in Play Console under the store
listing for the internal → production promotion.

---

## 9. Updating reviewer notes before public review submission

The canonical reviewer notes file is
`docs/store-listings/reviewer-notes.md`.

Before submitting for App Store Review or Google Play full review, open
that file and update:

1. The test account credentials (if the demo account changed)
2. The build date and version string
3. Any new permissions added since last submission

Then attach the content of that file to the App Review information
section in both consoles.

---

## 10. Timeline checklist

| Date | Action | Owner |
|---|---|---|
| 2026-05-11 | Soft launch (web only) | Dr Mubashir |
| 2026-05-12–13 | Run steps 0–7 above; get TestFlight build to internal testers | Dr Mubashir |
| 2026-05-13–17 | Internal iOS + Android testing; gather feedback | Dr Mubashir |
| 2026-05-18–19 | Capture screenshots, update reviewer notes | Dr Mubashir |
| 2026-05-20 | Submit iOS for App Store Review | Dr Mubashir |
| 2026-05-20 | Promote Android to internal → production in Play Console | Dr Mubashir |
| 2026-05-25 | Target: both stores live (optimistic) | — |
| 2026-06-30 | Target: both stores live (pessimistic) | — |

Apple App Store Review typically takes 1–3 business days for a new app.
Google Play production review takes 3–7 business days. Submit as early as
possible in the week — reviews submitted Friday afternoon often stall over
the weekend.

---

## 11. Common failure modes and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Blank white screen on device | `out/` is empty or stale | Re-run `npm run build:mobile && npx cap sync` |
| Camera permission dialog never shows | Info.plist missing NSCameraUsageDescription | Re-check step 5a |
| Photos not uploading on device | `startSyncLoop` not wired or token expired | Verify AuthGate.tsx imports startSyncLoop; check Supabase session in Capacitor Preferences |
| `cap sync` warnings about missing plugins | Plugin installed after last `cap add` | Run `npx cap sync` again after each `npm install` |
| Xcode "Module not found" build error | Capacitor native files out of sync | `npx cap sync`, then clean build in Xcode (⇧⌘K) |
| Android "App not installed" during sideload | APK/AAB signed with wrong key | Use the release keystore from 1Password, not the debug keystore |
| SQLite "database is locked" crash | Multiple Capacitor instances in dev mode | Only one Capacitor WebView instance should open the DB; check for double-mount |

---

## 12. Environment variables on device

The app communicates with `https://tenu.world` at runtime. The API base is
hardcoded via `NEXT_PUBLIC_API_BASE_URL` which defaults to `https://tenu.world`
in `syncEngine.ts`. No secrets ship in the bundle.

For local device testing against a dev laptop (same Wi-Fi network):

```bash
CAP_SERVER_URL=http://192.168.x.y:3000 npx cap sync
```

Replace `192.168.x.y` with your Mac's local IP (`ifconfig en0 | grep inet`).
This temporarily overrides the production URL in `capacitor.config.ts`.
**Unset before building for TestFlight/Play Store** — a production build
must not point to a localhost server.

```bash
# To revert:
unset CAP_SERVER_URL
npx cap sync
```

---

*This document covers the 2026-05-12 to 2026-05-25 native build window.
Updated 2026-05-06. Supersedes sections of doc 10 and 11 for the submission
flow only — those docs remain valid for the mobile scaffold context.*
