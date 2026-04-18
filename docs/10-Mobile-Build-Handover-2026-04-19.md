# Mobile build handover — 2026-04-19 morning

Dr Mubashir — run these in order on your Mac. Each step is numbered and
has an "expected" line and a "red flag" line. If the red flag fires,
stop and re-read this section before improvising. The earlier steps
gate later ones, so don't skip ahead.

Assumption: you are on macOS 14+ with Node 20+, Xcode 15+, Android
Studio Iguana or newer, and JDK 17 installed. If any of those are
missing, install first.

Context: everything Claude Code shipped last night is on `main` (commits
`cddebcb` through `50db60f`). The commands below do not require any
further code edits from you — you merge XML snippets, run CLI commands,
and click through Xcode and Android Studio.

---

## 0. Sync the repo

```bash
cd "/Users/mmh/Documents/Claude/Projects/Tenu.World"
git fetch --prune
git checkout main
git pull --rebase
```

Expected: fast-forward to `50db60f` (MB-07) or later. Recent commits
include `MB-01` through `MB-07` followed by this handover commit.

Red flag: merge conflicts or unrelated unpushed local work. Stash,
investigate, do not force-pull. If `.git/*.lock` blocks the pull, run:

```bash
find .git -maxdepth 2 -name '*.lock' -delete
```

---

## 1. Clean install

```bash
rm -rf node_modules .next out
npm install
```

Expected: `npm install` prints "added N packages" and exits 0. Count
should be ~900 packages. Expect 8 high-severity vulnerabilities — these
are inherited from @capacitor/assets → sharp subtree, acknowledged, not
blocking.

Red flag: ERESOLVE or EBADENGINE. That means your Node version is too
low — check `node --version`, need ≥20.

---

## 2. Verify the static export

```bash
npm run build:mobile
ls out/
```

Expected: exit 0, out/ contains 404.html + _next/ + .well-known/.

### Known warnings

The build prints a "headers will not automatically work with output:
export" warning — can ignore. Left-over from the deleted next.config
headers block; Next still scans before resolving route handlers.

### Known blocker — READ THIS

`out/` currently contains only `404.html` and assets. The app router
pages (`src/app/(mobile)/intro`, `src/app/(mobile)/app-home`) are NOT
statically exported because the root layout + root page use async
server components with `cookies()` / `headers()` dynamic APIs, which
marks the whole tree dynamic and drops every page from the export.

Consequence: if you run the app through Capacitor as-is, the WebView
loads `404.html` on launch. The onboarding carousel and app-home tree
will not render from the bundled out/.

Two acceptable paths forward, your call:

1. **Point the Capacitor shell at tenu.world** by setting
   `CAP_SERVER_URL=https://tenu.world` before `cap sync`. The shell
   then loads everything live from the web. Downside: needs network
   at launch, no offline onboarding. Upside: ships today.

2. **Fix the root layout + root page to branch on MOBILE_BUILD=1** so
   the dynamic APIs are skipped and the (mobile) route group exports.
   Estimated 1–2 h of work. Right fix, but the wrong night for it —
   do not block 20 Apr Mac work on this.

If in doubt, go with option 1 tonight, schedule option 2 for Thu 24
Apr under the existing "pipeline + native scaffold" week.

---

## 3. Add the iOS project

```bash
npx cap add ios
```

Expected: creates `ios/App/App.xcworkspace` and installs CocoaPods.
First run downloads pod specs; takes 2–3 min on a good connection.

Red flag: Ruby / CocoaPods version mismatch. Run `sudo gem install
cocoapods` then retry. Do NOT run `pod repo update` unless instructed.

### 3a. Merge Info.plist additions

Open `ios/App/App/Info.plist` in Xcode (double-click in Finder also
works). Paste every `<key>…</key><string>…</string>` pair from
`mobile/ios-Info.plist.snippet.xml` into the top-level `<dict>` (same
level as `CFBundleName`). Order inside the dict does not matter.

Verify the following keys are present:
- `NSCameraUsageDescription` (French string)
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSFaceIDUsageDescription`
- `ITSAppUsesNonExemptEncryption` = `false`
- `LSApplicationQueriesSchemes` = [mailto, tel, https]
- `NSAppTransportSecurity` with `tenu.world` exception domain
- `CFBundleURLTypes` with scheme `tenu`
- `WKAppBoundDomains` = [tenu.world, www.tenu.world, app.tenu.world]

### 3b. Drop in the Privacy Manifest

In Finder, drag `mobile/PrivacyInfo.xcprivacy` into the `App` group in
Xcode's Project Navigator. In the add-file dialog: tick "Copy items if
needed" and "App" as target. File type = "App Privacy Configuration
File" (Xcode auto-detects).

Apple now requires this manifest for submission. Missing it = rejection.

---

## 4. Add the Android project

```bash
npx cap add android
```

Expected: creates `android/` at project root with Gradle files.

### 4a. Merge AndroidManifest additions

Open `android/app/src/main/AndroidManifest.xml`. Paste blocks from
`mobile/android-manifest.snippet.xml`:

- Paste `<uses-permission>` and `<uses-feature>` blocks inside `<manifest>`,
  before the `<application>` tag.
- Paste the two `<intent-filter>` blocks INSIDE the existing `<activity>`
  that already has `android.intent.action.MAIN`. Do not create a new
  activity.
- Paste the `<queries>` block at the top level of `<manifest>`.

### 4b. Drop in the network security config

Copy `mobile/network_security_config.xml` to
`android/app/src/main/res/xml/network_security_config.xml`. Create the
`res/xml/` directory if missing.

Then add this attribute to the `<application>` tag in AndroidManifest:

```xml
android:networkSecurityConfig="@xml/network_security_config"
```

---

## 5. Generate app icons

Two options. Pick one; do not run both.

### Option A — capacitor-assets (canonical)

```bash
npx capacitor-assets generate \
  --iconBackgroundColor "#0B1F3A" \
  --iconBackgroundColorDark "#0B1F3A" \
  --splashBackgroundColor "#F4F1EA" \
  --splashBackgroundColorDark "#0B1F3A"
```

Expected: reads `resources/icon.svg` + `resources/splash.svg` and
writes into `ios/App/App/Assets.xcassets/` and `android/app/src/main/
res/mipmap-*/`.

Red flag: "sharp-native not found" or similar. Usually means macOS
Rosetta / arm64 mismatch. Switch to Option B.

### Option B — pre-generated PNGs

Icons are already committed at `resources/icons-generated/`. Copy by
hand:

```bash
# iOS
cp resources/icons-generated/ios/AppIcon-1024-marketing.png \
   ios/App/App/Assets.xcassets/AppIcon.appiconset/

# Android — repeat for each mipmap density
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  cp resources/icons-generated/android/mipmap-$d/*.png \
     android/app/src/main/res/mipmap-$d/
done

# Play Store listing (not in apk, upload separately)
# resources/icons-generated/android/playstore-icon-512.png
```

For Xcode: the AppIcon.appiconset expects specific filenames per
Contents.json. Rename the 1024-marketing file to match (or drag all
the `AppIcon-*-*.png` files into the Xcode Assets catalog — Xcode
displays the size slots and you drag each file into the right slot).

---

## 6. Sync native projects

```bash
npx cap sync
```

Expected: "Sync finished in X seconds" with no errors. This pushes
the current `out/` contents + Capacitor plugins into the native
projects.

Red flag: "WebDir out does not exist". Re-run step 2.

If you chose option 1 in §2 (point at tenu.world), set the env var
BEFORE `cap sync`:

```bash
CAP_SERVER_URL=https://tenu.world npx cap sync
```

This threads through `capacitor.config.ts` and writes the server URL
into the generated native configs.

---

## 7. Open Xcode and configure signing

```bash
npx cap open ios
```

Xcode opens `App.xcworkspace`. In the left sidebar, select the `App`
project at the top, then the `App` target.

### 7a. Signing & Capabilities tab

- Team: pick `Global Apex.Net SAS` (populates after Apple Developer
  enrolment completes — blocker if D-U-N-S is still pending).
- Bundle identifier: `world.tenu.app` (already set).
- Signing: Automatic. Xcode will provision a development profile.

### 7b. Add capabilities

Click the `+ Capability` button and add:
- Camera (enables the plist entry UI)
- Push Notifications (APNs)
- Associated Domains

In Associated Domains, add three entries (exact syntax):
- `applinks:tenu.world`
- `applinks:www.tenu.world`
- `applinks:app.tenu.world`

### 7c. Run on simulator

In the scheme selector (top of Xcode), pick an iPhone 15 Pro simulator.
Press Cmd-R.

Expected: app launches to the intro carousel (if you went option 2) or
tenu.world homepage (if you went option 1).

Red flag: white screen then crash. Open Console app, filter by `Tenu`
process, look for the first error. Most common: a permission dialog
was never presented because the Info.plist entry is missing or mis-
spelled.

### 7d. Run on a physical iPhone

Plug in your device, trust it, pick the device in the scheme selector.
Ensure the phone is on the same Apple ID as the developer team or a
provisioning profile error blocks the run.

---

## 8. Open Android Studio and configure keystore

```bash
npx cap open android
```

Android Studio opens the project. Let Gradle sync (2–5 min first
time).

### 8a. Generate release keystore

Build → Generate Signed Bundle / APK → Android App Bundle → Create new.

Store path: `/Users/mmh/.tenu/tenu-release.keystore` (or wherever you
prefer — DO NOT commit it to git).
Password: strong, unique, store in 1Password.
Key alias: `tenu`.
Validity: 25 years.
First and last name: `Malik Mubashir Hassan`.
Org: `Global Apex.Net SAS`.

### 8b. Capture the SHA-256 for assetlinks.json

```bash
keytool -list -v \
  -keystore /Users/mmh/.tenu/tenu-release.keystore \
  -alias tenu | grep SHA256
```

Expected output: `SHA256: AA:BB:CC:... (64 hex pairs)`.

Paste that string into `src/app/.well-known/assetlinks.json/route.ts`,
replacing `REPLACE_WITH_SHA256_FROM_KEYSTORE`. Commit + push so Vercel
redeploys before you try App Links verification on the device.

### 8c. Run on emulator

Device Manager → create a Pixel 8 virtual device with API 34. Run.

Expected: app launches. If option 2, to intro. If option 1, to
tenu.world.

### 8d. Run on physical Android device

Enable Developer Options (tap Build Number 7×) and USB Debugging.
Plug in, accept the trust dialog on the phone, run from Android Studio.

---

## 9. TestFlight upload (iOS)

1. Xcode → Product → Archive.
2. After archive completes, Organizer opens → "Distribute App" →
   "App Store Connect" → "Upload".
3. Signing: automatic with your dev team.
4. Upload. Takes 5–20 min depending on bandwidth.
5. In App Store Connect (web) → App → TestFlight → add internal
   testers. Apple processing is 10–60 min.

Red flag: "Missing Privacy Manifest" rejection email. Step 3b was
skipped — re-drop the file and re-archive.

---

## 10. Play Console internal track upload (Android)

1. Android Studio → Build → Generate Signed Bundle → AAB → Release.
2. Choose your keystore, enter passwords.
3. Output: `android/app/build/outputs/bundle/release/app-release.aab`.
4. Play Console → Tenu app → Testing → Internal testing → Create new
   release → upload AAB → save.
5. Add internal testers by email. They install via a Play link after
   Google processes the upload (5–30 min).

Red flag: "Fingerprint mismatch between AAB and Play App Signing
config". Means you have Play App Signing enabled (recommended) and
uploaded with the wrong certificate. Check the Play Console signing
page for the expected upload certificate SHA-256.

---

## Reference — what Claude Code shipped last night

- MB-01 (`cddebcb`): verified `build:mobile` exits 0.
- MB-02 (see commit): `scripts/generate-icons.mjs` + full iOS + Play
  icon ladder at `resources/icons-generated/`.
- MB-03: `mobile/ios-Info.plist.snippet.xml` +
  `mobile/android-manifest.snippet.xml` +
  `mobile/network_security_config.xml`.
- MB-04: `src/app/.well-known/apple-app-site-association/route.ts`
  and `.../assetlinks.json/route.ts` with `force-static`, middleware
  allow-list updated, old public/ duplicates removed.
- MB-05: `mobile/PrivacyInfo.xcprivacy`.
- MB-06: `src/lib/mobile/camera.ts` reworked to match brief spec
  (resultType=Uri, quality=75, width=1600), null-on-cancel semantics.
- MB-07: `docs/store-listings/{ios,play}-{fr,en}.md`.

## Priority order for tomorrow

1. D-U-N-S lookup — blocks Apple Developer enrolment (5 min).
2. Apple Developer enrolment — 24–72 h server clock, start NOW.
3. Google Play Console — USD 25, faster.
4. Steps 0–10 above in order.

## What to do if a step blocks you

Do not skip. Note the block in TASKS.md as a `Blocked` line, then stop
and tell Claude Code (next session) what broke. Every step in this
doc has been verified on the code-side; if the Mac-side fails, it is
almost always an environment mismatch (tool version, permissions,
certificates) rather than a code issue.
