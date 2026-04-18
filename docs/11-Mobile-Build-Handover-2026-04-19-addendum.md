# Mobile build — 2026-04-19 evening addendum

Sequel to [10-Mobile-Build-Handover-2026-04-19.md](10-Mobile-Build-Handover-2026-04-19.md).

Claude Code ran the Mac-side scaffolding tonight after you installed Xcode
and Android Studio. Both native projects exist, configs merged, Pods
installed. What's blocked from here is TCC (macOS Full Disk Access) and
Apple Developer enrolment — you need to hit "build" yourself.

## What shipped (local to your Mac only; ios/ and android/ are still gitignored)

### iOS — `ios/App/`

- `Info.plist` — the Capacitor-generated plist rewritten with every key
  from `mobile/ios-Info.plist.snippet.xml`: camera usage (FR), photo
  library usage, Face ID, `ITSAppUsesNonExemptEncryption=false`,
  `LSApplicationQueriesSchemes` (mailto/tel/https), ATS domain exception
  for tenu.world, `CFBundleURLTypes` with scheme `tenu`, `WKAppBoundDomains`
  locked to tenu.world / www.tenu.world / app.tenu.world. Also changed
  `CFBundleDevelopmentRegion` en → fr and restricted iPhone orientations
  to portrait.
- `PrivacyInfo.xcprivacy` — dropped into `App/` folder. **Not yet added
  to the Xcode target.** See step 1 below.
- `Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` — replaced with
  the 1024×1024 Tenu Disc mark on paper.
- `Assets.xcassets/Splash.imageset/splash-2732x2732*.png` — regenerated
  from `resources/splash.svg` at 2732×2732 on paper background.
- Pods installed (`pod install` from `ios/App/`). 12 Capacitor pods + 3
  transitive (IONFilesystemLib, SQLCipher, ZIPFoundation).
- Web assets synced to `ios/App/App/public/` — real mobile routes
  (`/intro/`, `/app-home/*`, `/.well-known/*`) from the fixed static
  export. 48 KB `index.html` ≠ placeholder 404.

### Android — `android/`

- `app/src/main/AndroidManifest.xml` — full rewrite merging every block
  from `mobile/android-manifest.snippet.xml`: CAMERA, READ_MEDIA_IMAGES,
  POST_NOTIFICATIONS, ACCESS_NETWORK_STATE, legacy storage with
  maxSdkVersion guards, camera feature flags, `<queries>` for HTTPS
  intents, deep-link intent-filters for tenu:// + App Links on
  tenu.world/www/app with `autoVerify=true`,
  `networkSecurityConfig="@xml/network_security_config"` on
  `<application>`.
- `app/src/main/res/xml/network_security_config.xml` — dropped in, blocks
  cleartext for tenu.world, allows localhost + 10.0.2.2.
- `app/src/main/res/values/ic_launcher_background.xml` — color flipped to
  Tenu Navy `#0B1F3A` so adaptive icon renders Portal foreground on navy.
- `app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/` —
  `ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`,
  `ic_launcher_background.png` copied from `resources/icons-generated/`.
- Web assets synced to `android/app/src/main/assets/public/` — same
  routes as iOS.

### Build script hardening — `scripts/build-mobile.sh`

- Added `sweep_icloud_dupes` trap. macOS iCloud Drive spawns
  `<name> (N).tsx` zero-byte duplicates whenever rapid `mv` operations
  happen inside `~/Documents`. The script's stash/restore dance triggered
  ~80 of them under `src/app/`. Now cleaned at the end of every build.
- Commit: this addendum + the script fix.

## What is blocked — TCC (Full Disk Access)

`xcodebuild` and `./gradlew` both fail with `Operation not permitted`
when they try to write/read inside `~/Documents/...`. macOS 15+ requires
each terminal/tool binary to be granted Full Disk Access in
System Settings → Privacy & Security → Full Disk Access.

Observed failures:
- **iOS xcodebuild Debug simulator build** — `rsync: open <path>:
  Operation not permitted` inside `IONFilesystemLib.xcframework/`.
- **Android `./gradlew assembleDebug`** — `Cannot create directory
  android/.gradle/8.11.1/fileHashes`.
- **Also `pod install` from `npx cap sync`** — `File.expand_path:
  Operation not permitted - getcwd`.

Workarounds that work without TCC:
1. **Open Xcode.app / Android Studio.app directly**. Both were granted
   Full Disk Access on install; the GUI-driven builds succeed.
2. **Move the project out of `~/Documents`** (e.g. to `~/Developer/`).
   iCloud sync doesn't apply there either — would also eliminate the
   0-byte duplicate problem at the source.
3. **Grant your terminal Full Disk Access**: System Settings →
   Privacy & Security → Full Disk Access → `+` → select
   `/Applications/Utilities/Terminal.app` (or iTerm, whatever you use).

Pick one. Option 1 is zero-effort if you only plan to build via the IDE.
Option 2 is the right long-term choice if you plan to script anything.

## Your next steps — Xcode

Open the workspace:

```bash
cd "/Users/mmh/Documents/Claude/Projects/Tenu.World/ios/App"
open App.xcworkspace
```

### Step 1 — Add PrivacyInfo.xcprivacy to the target

Xcode left-sidebar → right-click on the `App` yellow group → "Add Files
to 'App'…" → pick `ios/App/App/PrivacyInfo.xcprivacy`. Ensure:
- "Copy items if needed" — unticked (the file is already in place).
- "Add to targets" — `App` ticked.
- File Inspector (right panel) → Identity and Type → Type =
  "App Privacy Configuration File" (auto-detects).

### Step 2 — Signing and capabilities (blocked on Apple Developer)

Select the `App` project → `App` target → Signing & Capabilities.

Blocked until Apple Developer enrolment completes (D-U-N-S → enrolment
→ wait for welcome email). Once unblocked:
- Team: `Global Apex.Net SAS`.
- Signing: Automatic.
- `+ Capability` → Camera, Push Notifications, Associated Domains.
- Associated Domains — add three entries exactly:
  - `applinks:tenu.world`
  - `applinks:www.tenu.world`
  - `applinks:app.tenu.world`

### Step 3 — Run on iPhone 17 Pro simulator

No signing needed for simulator. Cmd-R. Expected: app launches, shows
the Portal mark splash for ~600ms, then renders the intro carousel in
French.

Red flag: white screen → Console.app, filter "Tenu" process, find first
error. Most common: missing Info.plist key (re-open Info.plist and
verify the key is there).

## Your next steps — Android Studio

Open the project:

```bash
open -a "Android Studio" "/Users/mmh/Documents/Claude/Projects/Tenu.World/android"
```

### Step 1 — Let Gradle sync

2–5 min first time. Accept any "install SDK component X" prompts.
Targets Android 14 (API 34) — confirm SDK Manager has it.

### Step 2 — Generate the release keystore

Build → Generate Signed Bundle/APK → Android App Bundle → Create new.

- Store path: `~/.tenu/tenu-release.keystore` (create the `.tenu` dir
  first — do NOT put it inside the project).
- Password: strong, store in 1Password. Key password same.
- Key alias: `tenu`.
- Validity: 25 years.
- First/Last name: Malik Mubashir Hassan.
- Org: Global Apex.Net SAS.

### Step 3 — Capture SHA-256 for assetlinks.json

```bash
keytool -list -v \
  -keystore ~/.tenu/tenu-release.keystore \
  -alias tenu | grep SHA256
```

Paste the `AA:BB:CC:...` string into
`src/app/.well-known/assetlinks.json/route.ts`, replacing
`REPLACE_WITH_SHA256_FROM_KEYSTORE`. Commit, push, wait for Vercel
redeploy before testing App Links on a device.

### Step 4 — Run on Pixel 8 emulator

Device Manager → create Pixel 8 virtual device with API 34 → Run.
Expected: app launches to intro carousel.

## Should we commit ios/ and android/?

`.gitignore` currently excludes both. That's fine for the "regenerate
from snippets every time" model, but it means:
- Your signing team + capabilities + entitlements (stored in .pbxproj
  inside `ios/`) are lost on every `cap add ios`.
- Custom AndroidManifest edits are lost on every `cap add android`.

Industry standard for a real App Store + Play deployment is to commit
both. If you want to flip the gate, I can do it next session. Tonight
I left them local-only so you can review what's there without a git
review bloat.

## Outstanding

1. **D-U-N-S lookup** — unchanged blocker.
2. **Apple Developer enrolment** — unchanged blocker.
3. **Play Console account** — unchanged blocker.
4. **TCC decision** — pick your workaround from the list above.
5. **Commit ios/ + android/?** — your call next session.
