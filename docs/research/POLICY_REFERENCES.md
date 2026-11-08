# Policy References for Shipping MathQuest Kids

Research date: **2026-11-06**. Every source below was accessed on **2026-11-06** unless noted otherwise.

Scope: official requirements that apply to shipping MathQuest Kids. The app is local-first and offline. It has no ads, accounts, or analytics, and covers roughly US Kindergarten to Grade 3. It is packaged for Android and iOS with Capacitor.

> **Not legal advice.** This is an engineering and product summary of public primary sources. Store policies and law change often, so re-check each link before every release, and get qualified counsel before relying on any legal conclusion.

Conventions:
- Text "in quotes" is copied verbatim from the cited page.
- **Not verified** means the claim could not be confirmed from a primary source during this research.

---

## 0. Quick reference: current values (as of 2026-11-06)

| Item | Current value | Source |
|---|---|---|
| Google Play target API (new apps and updates) | **Android 16, API level 36 or higher**, from **31 Aug 2026**. Extension available to **1 Nov 2026** (now passed). | [Android Developers: Target API level](https://developer.android.com/google/play/requirements/target-sdk) |
| Google Play target API (existing apps, for visibility to new users) | API 35 or higher | same |
| Android App Bundle | Required for new apps since August 2021 | [Play Console Help 9844279](https://support.google.com/googleplay/android-developer/answer/9844279?hl=en) |
| New personal Play developer accounts (created after 13 Nov 2023) | Closed test with **at least 12 testers**, opted in for **at least 14 consecutive days** | [Play Console Help 14151465](https://support.google.com/googleplay/android-developer/answer/14151465) |
| Apple minimum toolchain for uploads | **Xcode 26 or later with the iOS/iPadOS 26 SDK**, since **28 Apr 2026** | [Apple: Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) |
| Apple age-rating questionnaire | New questions had to be answered by **31 Jan 2026**. New tiers: 4+, 9+, 13+, 16+, 18+. | [Apple news ks775ehf](https://developer.apple.com/news/?id=ks775ehf), [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) |
| COPPA amended Rule | Effective **23 Jun 2025**. Compliance date **22 Apr 2026**, except some safe-harbor provisions. | [Federal Register 2025-05904 (govinfo)](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm) |
| Capacitor current stable major | **8** (npm `latest` = 8.6.0). 9.0.0-beta.0 is on the `next` tag. | [npm registry @capacitor/core](https://registry.npmjs.org/@capacitor/core) |
| Capacitor 8 defaults | minSdk **24**, compileSdk **36**, targetSdk **36**, iOS deployment target **15.0**, Xcode **26.0+**, Android Studio **Otter 2025.2.1+**, Node **22+** | [Capacitor: Updating to 8.0](https://capacitorjs.com/docs/updating/8-0) |
| WCAG version | WCAG 2.2, W3C Recommendation (12 Dec 2024 version) | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) |

---

## 1. COPPA (US Federal Trade Commission)

### 1.1 Amended COPPA Rule, 16 CFR Part 312 (2025 amendments)
- **Source:** Federal Trade Commission, "Children's Online Privacy Protection Rule," Final rule, *Federal Register* doc. 2025-05904, published 22 Apr 2025. URL: https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm. The canonical FederalRegister.gov page, https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule, redirected to a bot check during this research. Accessed 2026-11-06.
- **Dates (verbatim):** "Effective date: The amended Rule is effective June 23, 2025." and "Compliance date: Except with respect to Sec. 312.11(d)(1), (d)(4), and (g), regulated entities have until April 22, 2026 to comply." The excepted sections are safe-harbor reporting and notice obligations, which had earlier deadlines.
- **Summary of changes, from the rule's summary:**
  - A new stand-alone definition of "mixed audience" website or online service.
  - "Personal information" now also covers biometric identifiers that can recognize an individual, and government-issued identifiers.
  - Changes to direct and online notice, parental consent methods and exceptions, information security, and data retention and deletion.
  - Revised safe-harbor reporting.
  - The proposed ed-tech and school-authorization provisions were **not** finalized.
  - **Not verified from the primary text in this pass:** separate verifiable parental consent for third-party disclosure such as targeted advertising, and the "written" information-security program and retention policy wording. Secondary law-firm summaries report these, but they were not confirmed in the excerpt read.
- **Status:** The compliance date has passed. The amended Rule is fully in force for child-directed services. Secondary confirmation: [National Law Review](https://natlawreview.com/article/amendments-ftc-coppa-rule-now-effect), accessed 2026-11-06.
- **Related, secondary source:** a 25 Feb 2026 FTC policy statement on limited enforcement for age-verification-only collection by mixed and general-audience services, reported by [Mondaq](https://mondaq.com/unitedstates/privacy-protection/1771468/enforcement-begins-soon-for-significant-coppa-rule-amendments). Not verified against an FTC page. It is not relevant to an app that collects nothing.
- **Implication for MathQuest Kids:**
  - The app is clearly "directed to children," so COPPA applies **if** it collects personal information. That includes persistent identifiers such as device IDs or IP addresses sent to a server, directly or through any SDK.
  - The current design collects nothing: local-only storage, no network calls, no SDKs. That keeps the app out of the consent, notice, retention, and security-program obligations.
  - Keep it that way with a build-time guard: no analytics or crash SDKs, no remote fonts or CDNs at runtime, no `fetch` to third parties.
  - Any future feature that sends data off the device needs a full COPPA review first. That includes cloud sync, crash reporting, "email progress to parent," and remote content.

### 1.2 FTC "Complying with COPPA: Frequently Asked Questions"
- **Source:** FTC Business Guidance. URL: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions. Accessed 2026-11-06.
- **Summary:**
  - The page states "The COPPA Rule was amended on April 22, 2025." No updated "last revised" date was visible in the part read.
  - FAQ F.5 says an app that only interacts with "personal information that is stored on the device and is never transmitted" is **not** collecting personal information. The answer begins "No."
  - Persistent identifiers count as personal information. A limited exception exists when they are used solely for "support for the internal operations."
  - Operators are responsible for data collected by third-party code embedded in their service.
  - Letting children share content with others publicly, for example by email or on social platforms, generally requires parental consent.
  - The FAQ reflects FTC staff views and is not binding.
- **Implication for MathQuest Kids:**
  - FAQ F.5 directly supports the local-first design: progress kept only in on-device storage, such as Capacitor Preferences or IndexedDB, is not "collection."
  - **Do not add a "share" or "email results" feature** that a child can trigger. If a parent-only export is ever added, put it behind a parental gate, keep it on the device (for example, save a file), and review it against COPPA first.
  - Still publish a short privacy policy. The FTC recommends one even without collection, and both stores require one (see sections 2 and 3).

---

## 2. Google Play

### 2.1 Families Policy (Designed for Families / Families program)
- **Source:** Play Console Help, "Families Policies." URL: https://support.google.com/googleplay/android-developer/answer/9893335. Accessed 2026-11-06.
- **Summary:**
  - Apps whose target audience includes children must meet the Families requirements. The current page uses "Google Play Families program" and "Families Policy." The older "Designed for Families" name no longer appears on it.
  - Requirements include:
    - accurate target-audience declaration and child-appropriate content;
    - apps that solely target children "must not contain any APIs or SDKs that are not approved for use in primarily child-directed services";
    - no transmission of AAID, SIM serial, build serial, BSSID, MAC, SSID, IMEI or IMSI from children;
    - child-only apps "should not request AD_ID permission when targeting Android API 33 or higher";
    - no location permission for child-only apps;
    - disclosure of any personal and sensitive data collected from children;
    - accurate Data safety and IARC content-rating answers;
    - compliance with laws such as COPPA and GDPR.
- **Target audience setup:** [Play Console Help 9867159](https://support.google.com/googleplay/android-developer/answer/9867159), accessed 2026-11-06. Apps primarily for children are "eligible for consideration in the Teacher Approved program."
- **Implication for MathQuest Kids:**
  - Declare the target audience by age band. The K–3 range maps to roughly ages 5 and under, 6–8, and possibly 9–12 for older Grade 3 children. Select a band only if the app suits all of it.
  - Make sure the merged `AndroidManifest.xml` has **no** `com.google.android.gms.permission.AD_ID`, no location permissions, and no `INTERNET` permission if it is truly unused. Capacitor's template includes `INTERNET`; removing it is optional but strengthens the privacy story.
  - Audit every Capacitor plugin for transitive Google Play Services or Firebase dependencies.

### 2.2 Families Self-Certified Ads SDK rules
- **Sources:**
  - "Families Self-Certified Ads SDK Program," https://support.google.com/googleplay/android-developer/answer/9900633
  - "Families Self-Certified Ads SDK Policy," https://support.google.com/googleplay/android-developer/answer/12918983
  - Both from search results, accessed 2026-11-06. The program page's text was read via search snippets only.
- **Summary:**
  - Apps that serve ads to children or users of unknown age must use only a self-certified version of an ads SDK on Google's list.
  - Such ads must not use interest-based advertising or remarketing.
  - Ads must not be disruptive, for example not closable after 5 seconds, or interstitials at launch.
  - The program page currently states it is "not accepting new applicants" (snippet).
- **Implication for MathQuest Kids:** Not applicable while the app has no ads. Keep the "no ads" commitment explicit in the store listing and privacy policy. This is a differentiator.

### 2.3 Teacher Approved (optional)
- **Sources:**
  - Play Console Help, "Participate in the Teacher Approved program," https://support.google.com/googleplay/android-developer/answer/10075896?hl=en
  - "Build Teacher Approved apps," https://play.google.com/console/about/programs/teacherapproved/ (search-result snippet only)
  - Both accessed 2026-11-06.
- **Summary:**
  - Only Families-compliant, published apps with no pending policy actions are eligible. Submission is automatic once requirements are met.
  - Supported languages include English and Arabic, among others.
  - Ineligible apps include those that require another device or app, are designed to be used with an adult, are "designed primarily for classroom use," or have child-to-child social features.
  - Teachers and specialists rate quality and age-appropriateness. The page names ad and IAP appropriateness, UI quality for the age group, and language and audio quality.
  - Apps can be rejected for "insufficient downloads."
  - Approved apps get a badge and may appear on the Kids tab, and are re-reviewed on each update.
- **Implication for MathQuest Kids:**
  - The app is plausibly eligible. Do **not** market it as "designed to be used with an adult" or "primarily for classroom use."
  - An "assisted mode" is fine as long as the core experience works independently.
  - Narration and audio quality will likely affect the rating (see the benchmark doc).

### 2.4 Data safety section
- **Source:** Play Console Help, "Provide information for Google Play's Data safety section." URL: https://support.google.com/googleplay/android-developer/answer/10787469. Accessed 2026-11-06.
- **Summary:**
  - All apps published on Google Play must complete the form, including closed, open, and production tracks. Apps that are only on internal testing are exempt.
  - Apps that collect no data must still complete it and provide a privacy policy link.
  - "Collection" means "transmitting data from your app off a user's device." Data "only processed locally on the user's device and not sent off device" need not be disclosed.
- **Implication for MathQuest Kids:** Declare "No data collected" and "No data shared." This is accurate only if no plugin or WebView path transmits anything. Re-verify each release and host a privacy policy URL.

### 2.5 Target API level
- **Sources:**
  - Android Developers, "Meet Google Play's target API level requirement," https://developer.android.com/google/play/requirements/target-sdk
  - Play Console Help 11926878, https://support.google.com/googleplay/android-developer/answer/11926878
  - Both accessed 2026-11-06.
- **Summary (verbatim):** "Starting August 31 2026: New apps and app updates must target Android 16 (API level 36) or higher to be submitted to Google Play". Existing apps must target API 35 or higher to stay available to new users on newer Android versions. An extension "to November 1, 2026" could be requested; as of today that date has passed.
- **Implication for MathQuest Kids:** `targetSdkVersion` must be **36 or higher** for any new submission. Capacitor 8's default `targetSdkVersion = 36` meets this. Before upload, test Android 16 behavior changes, especially edge-to-edge display and predictive back.

### 2.6 Android App Bundle
- **Source:** Play Console Help 9844279, https://support.google.com/googleplay/android-developer/answer/9844279?hl=en. Accessed 2026-11-06.
- **Summary:** "Starting August 2021, new apps are required to publish with the Android App Bundle on Google Play." New apps larger than 200 MB can use Play Asset Delivery or Play Feature Delivery.
- **Implication for MathQuest Kids:** Ship an `.aab` built with `./gradlew bundleRelease` and enrol in Play App Signing. Keep the bundle small, for example compressed audio, so the app stays well under the size limits.

### 2.7 New personal developer account testing requirement
- **Source:** Play Console Help 14151465, https://support.google.com/googleplay/android-developer/answer/14151465. Accessed 2026-11-06.
- **Summary (verbatim):** Personal developer accounts "created after November 13, 2023" "must run a closed test for their app with a minimum of 12 testers who have been opted in continuously for at least 14 days," and "the 14 days must be consecutive."
- **Implication for MathQuest Kids:** If you publish from a new personal account, budget **at least 14 days** of closed testing with **at least 12** opted-in testers before applying for production access. The testers are adults, such as parents and teachers, using their own Google accounts. Children are not the testers.

### 2.8 Android developer verification (context)
- **Source:** Android Developers Blog, "Android developer verification" (June 2026), https://android-developers.googleblog.com/2026/06/android-developer-verification.html. Accessed 2026-11-06.
- **Summary:**
  - Developer verification enforcement began on **30 Sep 2026** for users in Brazil, Indonesia, Singapore and Thailand. A global rollout is planned for 2027.
  - Over 99% of Play apps were registered automatically, but developers should confirm registration in Play Console.
- **Implication for MathQuest Kids:** Confirm the app shows as registered in Play Console. This also matters if you ever distribute an APK outside Play.

---

## 3. Apple App Store

### 3.1 App Review Guidelines 1.3 (Kids Category) and 5.1.4 (Kids)
- **Source:** Apple, "App Review Guidelines." URL: https://developer.apple.com/app-store/review/guidelines/. Accessed 2026-11-06. No "last updated" date was visible in the text read.
- **Summary of 1.3:**
  - Kids Category apps "must not include links out of the app, purchasing opportunities, or other distractions to kids unless reserved for a designated area behind a parental gate."
  - They "may not send personally identifiable information or device information to third parties."
  - They "should not include third-party analytics or third-party advertising." There are narrow exceptions for analytics that collect nothing identifying, and for human-reviewed contextual ads.
  - Once in the category, an app must keep meeting these rules even if the category is later deselected.
- **Summary of 5.1.4:**
  - Developers must comply with COPPA, GDPR and similar laws.
  - Apps may ask for birthdate or parental contact only to comply with those laws.
  - Apps "intended primarily for kids should not include third-party analytics or third-party advertising."
  - A privacy policy is required for Kids Category apps.
  - The "parental gate requirement… is generally not the same as securing parental consent."
- **Related guideline 2.3.8:** Terms like "For Kids" and "For Children" in metadata are reserved for the Kids Category.
- **Implication for MathQuest Kids:**
  - Enrol in the **Kids Category** and pick an age band; see 3.2.
  - Put any external link (privacy policy, website, support email) and any settings that matter behind a parental gate.
  - Do not include third-party analytics.
  - Because the product name contains "Kids," joining the Kids Category also avoids conflict with 2.3.8. This is an inference: confirm how App Review applies 2.3.8 to app names.

### 3.2 Parental gates and age bands
- **Source:** Apple, "Building apps for kids," https://developer.apple.com/app-store/kids-apps/. Accessed 2026-11-06.
- **Summary:**
  - Parental gates are "adult-level tasks that must be completed in order to continue." Apple's examples include a math task and a question task.
  - For pre-literate children, Apple suggests a voiceover prompt telling the child to fetch a parent.
  - Age bands are "5 and under, 6-8, or 9-11."
  - Kids apps "should not transmit personally identifiable information or device information to third parties — even in sections intended for adults — unless the parent explicitly consents."
- **Implication for MathQuest Kids:**
  - **A math-based gate is risky for a math app.** A Grade 3 child can solve "7 × 8." Use a task that is genuinely adult-level for this audience, for example reading-dependent instructions plus a press-and-hold, or multi-digit arithmetic well beyond Level 4. Add a spoken "Ask a grown-up" prompt.
  - Choose a single band (likely 6–8), or 5 and under if Level 1 is the core. This is a product decision.

### 3.3 App Privacy details ("privacy nutrition labels")
- **Source:** Apple, "App privacy details on the App Store," https://developer.apple.com/app-store/app-privacy-details/. Accessed 2026-11-06.
- **Summary:**
  - Privacy answers in App Store Connect are required for new apps and updates, including third-party code.
  - "'Collect' refers to transmitting data off the device…"
  - "Data that is processed only on device is not 'collected' and does not need to be disclosed."
- **Implication for MathQuest Kids:** Answer "Data Not Collected." This is accurate only while no data leaves the device.

### 3.4 Privacy manifest (PrivacyInfo.xcprivacy) and required-reason APIs
- **Sources:**
  - Apple, "Describing use of required reason API," https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api, plus the reason-code reference for `NSPrivacyAccessedAPIType`, read via Apple's documentation JSON at https://developer.apple.com/tutorials/data/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype.json
  - Apple, "Upcoming requirements," which says approved reasons have been required for uploads since 1 May 2024
  - Capacitor, "Privacy Manifest," https://capacitorjs.com/docs/ios/privacy-manifest
  - Capacitor core's bundled manifest, https://raw.githubusercontent.com/ionic-team/capacitor/main/ios/Capacitor/Capacitor/PrivacyInfo.xcprivacy (main branch)
  - All accessed 2026-11-06.
- **Summary:**
  - Apps and SDKs must declare approved reasons for each category of "required reason" API they use. Categories include **UserDefaults**, **File timestamp**, System boot time, Disk space, and Active keyboards.
  - UserDefaults reason **CA92.1**: "access user defaults to read and write information that is only accessible to the app itself."
  - File timestamp reason **C617.1**: "access the timestamps, size, or other metadata of files inside the app container, app group container, or the app's CloudKit container." **DDA9.1** is for displaying timestamps to the user.
  - The file-timestamp category includes `FileAttributeKey.creationDate` and `.modificationDate`, `URLResourceKey.contentModificationDateKey` and `.creationDateKey`, and `stat`, `fstat`, `lstat`, `getattrlist` and similar calls.
  - Capacitor's docs say `@capacitor/preferences`, which uses UserDefaults, and `@capacitor/filesystem` "may necessitate a Privacy Manifest File." The docs' example declares UserDefaults with **CA92.1**.
  - Capacitor core's own bundled `PrivacyInfo.xcprivacy` on the main branch declares **no** accessed API types, no collected data, and `NSPrivacyTracking` false.
- **Implication for MathQuest Kids:**
  - Add an app-level `ios/App/App/PrivacyInfo.xcprivacy` with `NSPrivacyTracking = false` and empty collected-data types.
  - Declare `NSPrivacyAccessedAPICategoryUserDefaults` with **CA92.1** if you use `@capacitor/preferences` or any native UserDefaults access.
  - Declare `NSPrivacyAccessedAPICategoryFileTimestamp` with **C617.1** if you use `@capacitor/filesystem` stat/metadata calls or any plugin that reads file dates in the container.
  - Whether Capacitor core or WKWebView usage itself triggers an ITMS-91053 warning was **not verified**. Upload a build to TestFlight and act on any App Store Connect email listing missing reasons.

### 3.5 Minimum Xcode/SDK for uploads (as of Nov 2026)
- **Source:** Apple, "Upcoming requirements," https://developer.apple.com/news/upcoming-requirements/. Accessed 2026-11-06.
- **Summary (verbatim):** Since 28 Apr 2026, "Apps uploaded to App Store Connect must be built with Xcode 26 or later using an SDK for iOS 26, iPadOS 26, tvOS 26, visionOS 26, or watchOS 26." The same page also lists "iOS and iPadOS apps uploaded to App Store Connect must target iOS 13 or later" with a "since September 9, 2026" heading.
- **Implication for MathQuest Kids:**
  - Builds need a Mac with Xcode 26 or later; this matches Capacitor 8's Xcode 26.0+ requirement.
  - Capacitor's iOS 15.0 deployment target already exceeds the iOS 13 floor.

### 3.6 Age-rating changes (2025–2026)
- **Sources:**
  - Apple Developer News, "Updated age ratings in App Store Connect," https://developer.apple.com/news/?id=ks775ehf (from search result)
  - "Upcoming requirements" (above)
  - Both accessed 2026-11-06.
- **Summary:**
  - Apple's new system adds **13+, 16+ and 18+** to the existing 4+ and 9+. Per secondary press, 12+ and 17+ were removed.
  - New questions cover in-app controls, capabilities, and medical or wellness topics.
  - Developers had to answer the updated questions by **31 Jan 2026** to avoid interruptions when submitting updates.
  - Ratings show on devices running OS version 26 or later.
- **Implication for MathQuest Kids:** Complete the new questionnaire; expect **4+**. Answer "no" to user-generated content, messaging, web access and similar items only if that is accurate.

---

## 4. Capacitor (capacitorjs.com)

- **Sources:**
  - npm registry, https://registry.npmjs.org/@capacitor/core: dist-tags `latest` 8.6.0 and `next` 9.0.0-beta.0
  - "Updating to 8.0," https://capacitorjs.com/docs/updating/8-0
  - "Environment Setup," https://capacitorjs.com/docs/getting-started/environment-setup
  - "Android," https://capacitorjs.com/docs/android
  - "iOS," https://capacitorjs.com/docs/ios
  - "cap add," https://capacitorjs.com/docs/cli/commands/add
  - CLI source, https://raw.githubusercontent.com/ionic-team/capacitor/main/cli/src/ios/update.ts
  - Ionic blog, "The Road to Capacitor 9" (28 Aug 2026), read via https://ionic.io/blog/wp-json/wp/v2/posts/6904
  - All accessed 2026-11-06.
- **Current stable major:** **Capacitor 8**; npm `latest` is 8.6.0. The docs default to v8, and the version selector also lists v9. Ionic forecast Capacitor 9 "to launch at the end of November" 2026, and 9.0.0-beta.0 is on npm's `next` tag.
- **Android defaults (Capacitor 8 `variables.gradle`):** `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36`. The docs say "API 24+ (Android 7 or later) is supported" and that a WebView with Chrome 60 or later is required. Android Studio Otter 2025.2.1 or newer.
- **iOS:** deployment target **iOS 15.0**; the docs say "iOS 15+ is supported." Xcode 26.0+ is required. The CLI creates **Swift Package Manager** iOS projects by default in v8. Node.js 22 or later.
- **Windows and `npx cap add ios`:**
  - The docs say "To build iOS apps, you will need macOS." The `cap add` page has no Windows note.
  - In the CLI source, iOS update steps are skipped when tools are missing, rather than failing:
    - "Skipping pod install because CocoaPods is not installed" (CocoaPods projects only)
    - 'Unable to find "xcodebuild". Skipping xcodebuild clean step...'
  - With the v8 SPM default, no CocoaPods step runs. On Windows, `cap add ios` and `cap sync ios` can therefore generate and update the `ios/` native project and copy web assets. Building, signing, simulator runs and App Store upload need macOS with Xcode.
  - That this works end-to-end on Windows was **not verified by running it**; it is inferred from the source code and docs.
- **CocoaPods note:** Ionic urges migration to SPM before CocoaPods trunk becomes read-only on **2 Dec 2026**.
- **Implication for MathQuest Kids:**
  - Pin `@capacitor/*` to `^8` for the first release. Re-evaluate Capacitor 9 after it reaches GA, since its plugin and Cordova changes are breaking.
  - Keep the iOS project on SPM.
  - The defaults (targetSdk 36, Xcode 26) already satisfy both stores' current floors.

---

## 5. WCAG 2.2 (W3C), key criteria for a touch-first kids app

- **Source:** W3C, "Web Content Accessibility Guidelines (WCAG) 2.2," W3C Recommendation (12 Dec 2024 version), https://www.w3.org/TR/WCAG22/. Accessed 2026-11-06.

| SC | Level | Requirement (verbatim or close paraphrase) | URL | Implication for MathQuest Kids |
|---|---|---|---|---|
| 2.5.8 Target Size (Minimum) | AA | "The size of the target for pointer inputs is at least 24 by 24 CSS pixels," with exceptions for spacing, equivalent, inline, user-agent control, and essential | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | 24 px is a floor. For ages 5–9, aim much larger, such as 44–64 px answer tiles with generous spacing. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content." | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html | Sticky headers, toasts and the on-screen number pad must not cover the focused control. This matters for switch, keyboard and Bluetooth-keyboard users. |
| 2.5.7 Dragging Movements | AA | "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging, unless dragging is essential…" | https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html | Every drag-to-place activity (number line, counters, ordering) needs a tap-to-select then tap-to-place alternative. |
| 3.3.7 Redundant Entry | **A**, not AA (Level A criteria are included in AA conformance) | Information previously entered by or provided to the user that must be entered again in the same process is "either: auto-populated, or available for the user to select" (exceptions apply) | https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html | Do not make a child re-enter an answer or name after an error or retry. Keep their working on "try again." |
| Also relevant: 2.5.1 Pointer Gestures (A), 2.5.2 Pointer Cancellation (A), 3.3.8 Accessible Authentication (Minimum) (AA) | — | Multipoint and path gestures need single-pointer alternatives. Activate on up-event or allow abort. No cognitive-test logins. | https://www.w3.org/TR/WCAG22/ | No multi-finger gestures. Answer buttons fire on release. The parental gate is not "authentication" in the WCAG sense, but keep it operable. |

---

## 6. State and international notes (brief; not legal advice)

- **California Age-Appropriate Design Code Act (AB 2273, Cal. Civ. Code §1798.99.28 et seq.):**
  - Litigation: *NetChoice v. Bonta*. On **12 Mar 2026**, a Ninth Circuit panel affirmed in part and vacated in part the district court's second preliminary injunction, reported as 170 F.4th 744.
  - Several provisions remain enjoined, including age estimation and certain data-use and dark-pattern provisions. Others, including the coverage definition, may take effect.
  - The case remains at the preliminary-injunction stage. Sources: [Cooley, 30 Mar 2026](https://www.cooley.com/news/insight/2026/2026-03-30-netchoice-v-bonta-ninth-circuit-narrows-injunction-against-californias-ageappropriate-design-code-act) and [Holland & Knight, 19 Mar 2026](https://www.hklaw.com/en/insights/publications/2026/03/ninth-circuit-issues-mixed-ruling-on-california-age-appropriate-design-code-act), both accessed 2026-11-06.
  - Any developments after May 2026 (en banc, Supreme Court, or final judgment) were **not verified**.
  - Implication: the law targets businesses meeting CCPA thresholds, so a small no-data app likely falls below them. Applicability was **not verified**. Privacy-by-default design aligns with the Act regardless.
- **Texas App Store Accountability Act (SB 2420) and Utah's equivalent:**
  - Texas's law was preliminarily enjoined on 23 Dec 2025. Secondary reports say the Fifth Circuit stayed that injunction in May–June 2026.
  - CCIA dismissed its Utah challenge in April 2026 after amendments.
  - Sources: [Troutman Privacy](https://www.troutmanprivacy.com/2025/12/federal-district-court-grants-preliminary-injunction-of-texas-app-store-accountability-act/) and [CCIA litigation page](https://ccianet.org/litigation/ccia-v-paxton/), accessed 2026-11-06.
  - Current enforceability was **not verified**.
  - Implication: these laws mainly place age-verification and consent duties on app stores, with developer duties to use store age signals. Monitor Apple's and Google's developer age-signal APIs.
- **EU GDPR, Art. 8:** Where consent is the legal basis for information society services offered directly to a child, parental consent is needed under 16. Member states may lower this to 13. Source: Regulation (EU) 2016/679, https://eur-lex.europa.eu/eli/reg/2016/679/oj, accessed 2026-11-06; the URL is standard and the page was not re-fetched in this pass. Implication: no processing means no consent basis is needed, but EU distribution still needs a privacy notice and EU trader-status (DSA) information in App Store Connect.
- **UK Age Appropriate Design Code (ICO Children's code):**
  - 15 standards apply to information society services "likely to be accessed by children." They include best interests, DPIA, high-privacy default settings, data minimisation, geolocation off by default, parental controls transparency, profiling off, and no nudge techniques.
  - Conformance has been expected since 2 Sep 2021.
  - Source: ICO, https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/. Accessed 2026-11-06 via search result; a direct fetch returned HTTP 403.
  - Implication: the no-data design satisfies most standards by construction. Document a short DPIA-style note and avoid streak or loss-aversion "nudges" that push extended play.

---

## 7. Release checklist derived from the above

1. Android: `targetSdkVersion` 36 or higher; AAB; Play App Signing; no `AD_ID` or location permission; Data safety "No data collected"; target audience set to child age bands; IARC questionnaire; privacy policy URL; 12 testers for 14 days if on a new personal account.
2. iOS: Xcode 26 or later with the iOS 26 SDK; Kids Category with an age band; parental gate on all external links and settings; `PrivacyInfo.xcprivacy` with CA92.1 if using UserDefaults and C617.1 if using file metadata; privacy label "Data Not Collected"; new age-rating questionnaire answered.
3. Both: no third-party analytics, ads or crash SDKs; no runtime network calls; privacy policy stating exactly that; WCAG 2.2 AA review covering target size, drag alternatives, and focus visibility.
