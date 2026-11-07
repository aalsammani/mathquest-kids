# Android Build Guide

**Status (2026-11-06):** the Capacitor 8 Android project is generated and configured, and the web build is synced, with icons, adaptive icons and splash screens generated. A **Gradle build has not been run**, because this Windows environment has no JDK or Android SDK. Installing the SDK requires accepting Google's SDK license, which is the owner's decision. **No APK or AAB has been produced or device-tested yet.**

## Configuration

| Item | Value | Where |
|---|---|---|
| applicationId / namespace | `com.alsammani.mathquestkids` (**provisional**: confirm before the first upload; it cannot change afterwards) | `capacitor.config.ts`, `android/app/build.gradle` |
| minSdk / compileSdk / targetSdk | 24 / 36 / 36. Play requires target API 36 for new apps and updates from 31 Aug 2026. | `android/variables.gradle` |
| versionName / versionCode | `2.0.0` / `2000001` | `android/app/build.gradle` |
| Versioning rule | `versionCode = MAJOR×1,000,000 + MINOR×10,000 + PATCH×100 + BUILD` | same |
| Backup | `allowBackup=false`, `fullBackupContent=false`, and `data_extraction_rules.xml` excludes all domains from cloud backup and device transfer | `AndroidManifest.xml`, `res/xml/data_extraction_rules.xml` |
| Permissions | `INTERNET` only (template default). No runtime permissions. | `AndroidManifest.xml` |
| Package visibility | `<queries>` for `android.intent.action.TTS_SERVICE` (read-aloud) | `AndroidManifest.xml` |
| WebView | `androidScheme: https`, mixed content off, WebView debugging off | `capacitor.config.ts` |
| Icons / splash | Original artwork from `scripts/make-icons.mjs` → `resources/` → `@capacitor/assets` (24 mipmaps, 26 splash variants including dark) | `android/app/src/main/res/` |
| Signing | Optional `android/keystore.properties` (git-ignored). Template: `android/keystore.properties.example`. | `android/app/build.gradle` |

## Prerequisites (owner's machine)

- **Android Studio Otter 2025.2.1 or newer** (Capacitor 8 requirement), with its bundled **JDK 21**.
- **Android SDK Platform 36** and Build-Tools via SDK Manager. You will be asked to accept Google's SDK license.
- **Node.js 22 or newer**.

## Commands

```bash
npm install
npm run build          # type-check + production web build (dist/)
npx cap sync android   # copy dist/ and plugins into android/
npx cap open android   # open in Android Studio
```

In Android Studio, run on an emulator or device with ▶. From the command line:

```bash
cd android
./gradlew assembleDebug          # app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease          # app/build/outputs/bundle/release/app-release.aab (signed if keystore.properties exists)
```

## Signing (do not commit secrets)

1. Create an **upload key** (Play App Signing holds the app signing key):
   `keytool -genkeypair -v -keystore android/release/mathquest-upload.jks -alias mathquest-upload -keyalg RSA -keysize 4096 -validity 10000`
2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill it in. Both the file and `android/release/` are git-ignored.
3. Back up the keystore and passwords securely. Losing the upload key requires a reset through Play support.
4. Enroll in **Play App Signing** when creating the app in Play Console.

## Decision pending device verification: removing INTERNET

The app makes no network requests. The CSP blocks them and an E2E test proves it. Capacitor serves assets from `https://localhost` inside the app. To remove the permission:
1. Add `xmlns:tools="http://schemas.android.com/tools"` to `<manifest>`.
2. Add `<uses-permission android:name="android.permission.INTERNET" tools:node="remove" />`.
3. **Test on at least two physical devices** (Android 8 and 15+): cold start, lessons, read-aloud, export/share, and an app update.
4. If anything fails, revert. Keeping INTERNET is acceptable as long as the Data safety form remains "No data collected".

## Device test plan (pending)

| Area | Checks |
|---|---|
| Devices | A low-cost phone (2–3 GB RAM, Android 8–10), a modern phone (Android 15/16), a 10" tablet |
| Lifecycle | Cold start under 3 s on the low-cost phone; pause/resume mid-question keeps the state; Android back button navigates and exits only from home; rotation |
| Offline | Airplane mode from first launch: everything works |
| Read-aloud | Google TTS and a vendor TTS; slow reading; volume |
| Storage | Kill the app and relaunch: progress kept; clear cache: progress kept; uninstall: data removed |
| Export | CSV and backup through the share sheet (Files, Drive, email); restore from a file picker |
| Accessibility | TalkBack walkthrough ([ACCESSIBILITY.md](ACCESSIBILITY.md)); font scale 200%; display size largest |
| Performance | Scroll and animation smoothness; Balloon Pop; memory over a 20-minute session |
| Pre-launch report | Upload to internal testing and review Play's pre-launch report |

## Release artifact

Play requires an **Android App Bundle (.aab)** for new apps. If the account is a new personal developer account, Play requires a **closed test with at least 12 testers opted in for at least 14 days** before production (see [GOOGLE_PLAY_CHECKLIST.md](GOOGLE_PLAY_CHECKLIST.md)).
