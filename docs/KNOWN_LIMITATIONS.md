# Known Limitations

## Not yet verified
- **Native builds:** no Android Gradle build, APK/AAB, iOS Xcode build, simulator, or device run has been done. These need the Android SDK and macOS with Xcode 26 or later.
- **Physical devices:** performance on low-end Android, TalkBack and VoiceOver, native TTS voices, share-sheet export, lifecycle behavior, and safe areas on notched devices.
- **Browsers:** Chromium (Microsoft Edge and Playwright Chromium) is fully automated. Since v2.1 the E2E suites also run in Playwright **WebKit** with iPad and iPhone **emulation** (`playwright.ipad.config.ts`). That covers Safari's layout and touch behaviour, but it is not a physical device. Firefox is untested.
- **iPad read-aloud (v2.1):** the speech fixes are verified with mocked speech engines and emulation only. **Sound quality on a physical iPad has not been verified.** Run [IPAD_TEST_CHECKLIST.md](IPAD_TEST_CHECKLIST.md). Voices installed on each device differ, and JavaScript cannot change the device volume, Silent Mode or the audio route ([AUDIO_COMPATIBILITY.md](AUDIO_COMPATIBILITY.md)).
- **Learning effectiveness:** there has been no study with children, so no learning-outcome claims are made ([EDUCATIONAL_VALIDATION.md](EDUCATIONAL_VALIDATION.md)).
- **Expert review:** content validity, standards alignment (the CCSS codes are a developer mapping), reading level, and cultural review are all pending.
- **Legal:** the privacy policy and the COPPA, Families and Kids Category analysis are drafts and not legal advice.

## Design limitations
- Mastery thresholds are **provisional rules**, not calibrated psychometric cut scores. Items are not IRT-calibrated.
- The validator proves internal consistency (the answer key matches the givens and no other option is also correct). It cannot prove that wording is optimal. Non-arithmetic explanation sentences are checked by reviewed templates with truth flags, not semantic proof.
- Misconception (error-category) tags exist only in distractor design. They are not yet reported to parents.
- The app is English (US) only, with no localization.
- Emoji are rendered by the OS, so the appearance of objects and mascots varies by platform.
- Read-aloud depends on the device's speech engine. Some browsers may route speech through online voices, which is outside the app's control.
- The parental gate deters children; it is not security. Press-and-hold may be hard for some adults with motor impairments.
- Android keeps the template `INTERNET` permission until device testing confirms it can be removed.
- Web storage (`localStorage`) can be cleared by the browser or the user. Parents should use the backup export. The native apps use Preferences.
- Data is per device, with no sync between devices (by design, for privacy).
- "Drag-and-drop matching" from the brief is implemented as **tap-to-match** (an accessible alternative under WCAG 2.5.7). Drag is offered only on the number line.
- There is no free-text drawing or "construct a representation" canvas. Construction is limited to arrays, shading, number-line placement, and the manipulative tools.
- Shape builder, pattern builder, measurement tools, and graph-building were not built as separate tools. They are covered by question types and lessons instead (the brief asked for no features for their own sake).
- Dev-only toolchain dependencies have 10 low/moderate `npm audit` advisories; none ship in the app.

## Product decisions still open (owner)
- Final app ID and bundle ID; store age bands; support email and URL; privacy-policy hosting; whether to enroll in Google Play Teacher Approved; developer accounts (paid).
