# Apple App Store Submission Checklist

Legend: ✅ done with evidence · ⏳ pending · ❌ not done. Sources: [research/POLICY_REFERENCES.md §3](research/POLICY_REFERENCES.md).

## Build and technical

| Item | Status | Evidence / action |
|---|---|---|
| Built with Xcode 26 or later and the iOS 26 SDK (required for uploads since 28 Apr 2026) | ⏳ | Requires a Mac ([IOS_BUILD.md](IOS_BUILD.md)) |
| iOS project generated (Capacitor 8, SPM) | ✅ | `ios/App/` |
| Bundle id final | ⏳ | Provisional `com.alsammani.mathquestkids` |
| Version 2.0.0, build number incremented per upload | ✅ / ⏳ | `MARKETING_VERSION 2.0.0` |
| Privacy manifest present with required-reason APIs (UserDefaults CA92.1, FileTimestamp C617.1), no tracking | ✅ file · ⏳ add to target | `ios/App/App/PrivacyInfo.xcprivacy` |
| No usage-description keys (no camera, microphone, location, photos, or tracking) | ✅ | `Info.plist` |
| `ITSAppUsesNonExemptEncryption = NO` | ✅ | `Info.plist` |
| App icons and launch screen | ✅ generated · ⏳ verify in Xcode | `Assets.xcassets` |
| iPhone and iPad layouts, safe areas, orientations | ✅ web E2E (phone/tablet viewports) · ⏳ devices | E2E reports |
| Simulator and device testing | ⏳ | Plan in IOS_BUILD.md |
| TestFlight build | ⏳ | — |

## Kids Category (Guidelines 1.3 and 5.1.4)

| Requirement | Status | Evidence |
|---|---|---|
| Enroll in the Kids Category and choose an age band (5 and under, 6–8, or 9–11) | ⏳ owner decision | Suggested **6–8** ([store/STORE_LISTING.md](store/STORE_LISTING.md)) |
| No links out of the app, purchases or distractions unless behind a parental gate | ✅ | No external links and no purchases. Dashboard, exports and settings sit behind the gate. |
| Parental gate is an adult-level task | ✅ implemented · ⏳ review | Worded 2-digit × 1-digit problem plus a 1.2 s press-and-hold and a spoken "ask a grown-up" prompt. It is not authentication. |
| No third-party analytics or advertising | ✅ | No SDKs ([ASSET_INVENTORY.md](ASSET_INVENTORY.md)) |
| No PII or device information sent to third parties | ✅ | No network requests (E2E-tested) |
| Privacy policy (required for Kids apps) | ⏳ | Draft ready; legal review and hosting pending |
| "For Kids" terms in metadata reserved for the Kids Category | ✅ noted | The name contains "Kids"; enrolling in the Kids Category is planned |

## App Privacy ("nutrition label")

| Question | Answer | Basis |
|---|---|---|
| Data collection | **Data Not Collected** | Apple counts data as "collected" only when it is transmitted off the device; this app transmits nothing |
| Tracking | No | — |

## Metadata

| Item | Status |
|---|---|
| Name, subtitle, description, keywords, promotional text | ✅ draft ([store/STORE_LISTING.md](store/STORE_LISTING.md)) |
| Screenshots: 6.9" iPhone (1320×2868 or 1290×2796), 13" iPad (2064×2752 or 2048×2732) | ⏳ |
| Age-rating questionnaire (new 2025–26 version) | ⏳ expected **4+** |
| Support URL and marketing URL | ⏳ placeholders |
| Copyright line | ✅ "© 2025 Abdallah Alsammani" |
| Review notes: explain the parental gate (worded problem + press and hold) and that the app is fully offline | ⏳ draft in STORE_LISTING.md |

**Not submitted. Not approved.** Nothing has been uploaded to App Store Connect.
