# Google Play Submission Checklist

Legend: ✅ done with evidence · ⏳ pending (owner action, device, or external review) · ❌ not done. Sources: [research/POLICY_REFERENCES.md §2](research/POLICY_REFERENCES.md).

## Build and technical

| Item | Status | Evidence / action |
|---|---|---|
| Target API level 36 or higher (required for new apps and updates since 31 Aug 2026) | ✅ configured | `android/variables.gradle` targetSdk 36 |
| Android App Bundle (.aab) | ⏳ | `./gradlew bundleRelease` on a machine with the Android SDK ([ANDROID_BUILD.md](ANDROID_BUILD.md)) |
| Play App Signing and upload key | ⏳ | Owner creates the upload key; secrets are never committed |
| Final applicationId | ⏳ | Provisional `com.alsammani.mathquestkids`; confirm before the first upload |
| versionCode / versionName | ✅ | 2000001 / 2.0.0 |
| No advertising ID (`AD_ID`), location, contacts, camera or microphone permissions | ✅ | Manifest lists INTERNET only; plugins add none (the merged manifest must be confirmed after a Gradle build ⏳) |
| Physical-device testing | ⏳ | Test plan in ANDROID_BUILD.md |
| Pre-launch report reviewed | ⏳ | After the internal-testing upload |

## Families policy and content

| Item | Status | Evidence / action |
|---|---|---|
| Target audience and content: choose age groups (e.g., "5 and under" and/or "6–8", "9–12") | ⏳ owner decision | Suggested: **6–8** primary, with 5 and under and 9–12 also selected if appropriate ([store/STORE_LISTING.md](store/STORE_LISTING.md)) |
| Families policy: no ads, no Families-ineligible SDKs | ✅ | No ads or analytics SDKs (`docs/ASSET_INVENTORY.md`) |
| Content appropriate for children; no violent or scary content | ✅ developer review · ⏳ independent review | Story themes in `src/engine/generators/stories.ts` |
| No external links, purchases or social features in the child area | ✅ | None exist; parent area behind gate |
| IARC content rating questionnaire | ⏳ | Expected Everyone / PEGI 3 (no violence, chat, purchases, or user-generated content) |
| Teacher Approved (optional) | ⏳ optional | Requires Google review; not guaranteed |

## Data safety form (answers based on the implementation)

| Question | Answer | Basis |
|---|---|---|
| Does the app collect or share any of the required user data types? | **No** | Nothing is transmitted off the device ([PRIVACY_AND_DATA_FLOW.md](PRIVACY_AND_DATA_FLOW.md)) |
| Is all user data encrypted in transit? | Not applicable (no transmission) | — |
| Can users request that data be deleted? | Data is stored only on the device; in-app "Erase everything" plus uninstall | E2E-tested erase |
| Independent security review | No | — |

⚠️ Re-check these answers if any network feature, SDK or analytics is ever added.

## Store listing

| Item | Status | Location |
|---|---|---|
| App name, short description, full description | ✅ draft | [store/STORE_LISTING.md](store/STORE_LISTING.md) |
| Phone and tablet screenshots (7" and 10") | ⏳ | Specs in STORE_LISTING.md; capture from emulator or device builds |
| Feature graphic 1024×500 | ❌ | To design (original art only) |
| App icon 512×512 | ✅ | `public/icons/icon-512.png` (original) |
| Privacy policy URL (publicly hosted) | ⏳ | Draft: [store/PRIVACY_POLICY_DRAFT.md](store/PRIVACY_POLICY_DRAFT.md); needs legal review and hosting |
| Support email / website | ⏳ | Placeholders in STORE_LISTING.md |
| Contact details and developer verification | ⏳ | Owner's Play Console account |

## Account and testing

| Item | Status |
|---|---|
| Play Console developer account (one-time fee; owner's decision) | ⏳ |
| If a **new personal account** (created after 13 Nov 2023): **closed test with at least 12 testers opted in for at least 14 consecutive days** before production access | ⏳ |
| Internal → closed → production rollout plan | ⏳ |

**Not submitted. Not approved.** Nothing has been uploaded to Play Console.
