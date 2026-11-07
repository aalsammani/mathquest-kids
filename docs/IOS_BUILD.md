# iOS / iPadOS Build Guide

**Status (2026-11-06):** the Capacitor 8 iOS project was generated **on Windows**. It uses Swift Package Manager, so no CocoaPods were needed. The web build is synced and icons and splash screens are generated. `Info.plist` and `PrivacyInfo.xcprivacy` were validated as well-formed property lists. **Native compilation, signing, archiving, simulator runs and device testing are all pending**, because they require macOS with **Xcode 26 or later** (Apple's requirement for uploads since 28 Apr 2026, and Capacitor 8's requirement).

## Configuration

| Item | Value | Where |
|---|---|---|
| Bundle identifier | `com.alsammani.mathquestkids` (**provisional**) | `ios/App/App.xcodeproj` (PRODUCT_BUNDLE_IDENTIFIER) |
| Display name | MathQuest Kids | `Info.plist` |
| Version / build | `MARKETING_VERSION 2.0.0`, `CURRENT_PROJECT_VERSION 1` (increment for every upload) | project.pbxproj |
| Deployment target | iOS 15.0 (Capacitor 8 default; Apple's floor is iOS 13) | project.pbxproj |
| Orientation | iPhone: portrait + landscape. iPad: all four. | `Info.plist` |
| Privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy`: `NSPrivacyTracking=false`, no collected data types. Required-reason APIs: UserDefaults **CA92.1** and FileTimestamp **C617.1**. | file exists; **must be added to the App target in Xcode** (step 4 below) |
| Export compliance | `ITSAppUsesNonExemptEncryption = NO` | `Info.plist` |
| Usage descriptions | None (no camera, microphone, photos, location, or tracking) | `Info.plist` |
| WebView | `limitsNavigationsToAppBoundDomains: true` | `capacitor.config.ts` |
| Safe areas | `viewport-fit=cover` plus CSS `env(safe-area-inset-*)` padding | `index.html`, `components.css` |

## Steps on a Mac (pending)

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios        # opens ios/App/App.xcodeproj
```

1. In Xcode, select the **App** target. Under **Signing & Capabilities**, choose your Team. Confirm or replace the bundle id.
2. Let Xcode resolve the Swift packages: **File → Packages → Resolve Package Versions**.
3. Build and run on the iPhone and iPad simulators, then on a physical device.
4. **Add the privacy manifest to the target:** drag `App/PrivacyInfo.xcprivacy` into the App group and tick "Add to target: App". Verify it appears in **Build Phases → Copy Bundle Resources**.
5. Check the App Icon set and Launch screen in `Assets.xcassets`.
6. **Product → Archive**, then **Distribute App → App Store Connect → Upload** (to TestFlight first).
7. If App Store Connect emails an **ITMS-91053** (missing required-reason API) warning, add the listed category and reason to `PrivacyInfo.xcprivacy`.

## Signing and provisioning checklist

- [ ] Apple Developer Program membership (paid; owner's decision)
- [ ] App ID registered with the final bundle id
- [ ] Distribution certificate (Xcode can manage this automatically)
- [ ] App Store provisioning profile (automatic signing is recommended)
- [ ] App record in App Store Connect: SKU, primary language English (US), **Kids Category with an age band**
- [ ] TestFlight internal group; external testing requires Beta App Review

## Device test plan (pending)

| Area | Checks |
|---|---|
| Devices | An older iPhone (iOS 15/16), a current iPhone (iOS 26), an iPad (split view and Stage Manager) |
| Layout | Notch and Dynamic Island safe areas; rotation; iPad landscape; Dynamic Type at the largest sizes |
| Lifecycle | Background mid-question then resume; low-memory termination then relaunch keeps progress |
| Offline | Airplane mode from first launch |
| VoiceOver | The full script in [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| Read-aloud | Native TTS voice availability (en-US); silent switch behavior |
| Export | Share sheet to Files, Mail, AirDrop; restore through the file picker |
| Parental gate | Press-and-hold works with touch and with VoiceOver (double-tap and hold) |
