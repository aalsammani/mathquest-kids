# Release Readiness — 2.0.0-rc.1

**Assessed:** 2026-11-06 · Legend: ✅ PASS (with evidence) · ⏳ PENDING · ❌ FAIL / not done

## Overall status (distinguishing what is and is not proven)

| Milestone | Status | Evidence / blocker |
|---|---|---|
| Development complete (release candidate) | ✅ | All features in scope implemented — see CHANGELOG |
| Automated testing passed | ✅ | `npm run test:all`: typecheck, 213 unit/property, 364,000 validated questions, 50 E2E (0 failed), 39 axe scans 0 violations — [TEST_REPORT.md](TEST_REPORT.md) |
| Android build & device validation | ⏳ | No Android SDK/JDK here; Gradle build + device tests pending ([ANDROID_BUILD.md](ANDROID_BUILD.md)) |
| iOS build & device validation | ⏳ | Requires macOS + Xcode 26+ ([IOS_BUILD.md](IOS_BUILD.md)) |
| Privacy & legal review | ⏳ | Policy draft + data-flow analysis ready; qualified review pending |
| Educational content review | ⏳ | Developer self-review only; expert review + pilot pending ([EDUCATIONAL_VALIDATION.md](EDUCATIONAL_VALIDATION.md)) |
| Ready for store submission | ⏳ | Blocked by the four rows above + accounts, signing, screenshots, hosted policy |
| Store approved | ❌ | Nothing submitted (by instruction) |

## Final acceptance criteria (from the brief)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | All four learning levels implemented | ✅ | 59 skills; [CURRICULUM.md](CURRICULUM.md); E2E checks labels |
| 2 | Existing features preserved or responsibly replaced | ✅ | All 37 v1.1 topics mapped; games, mascots, shop, badges, certificates→print report, settings kept; chest/streak/XP replaced (rationale in audit) |
| 3 | All known mathematical errors corrected | ✅ | Audit C1–C4, M1, m1–m10 fixed; mutation tests |
| 4 | All active generators pass rigorous validation | ✅ | 364/364 combinations, 0 failures; property tests |
| 5 | Word problems verified & coherent | ✅ (automated) · ⏳ (human) | Story spec checks: expression, givens = text numbers, visual/structure, phases |
| 6 | Reasoning activities integrated | ✅ | Reasoning slots in every practice round; all levels have explain/story items (property test) |
| 7 | Mastery distinguishes independent vs assisted | ✅ | `mastery.ts`; regression tests; dashboard columns |
| 8 | Persistence & migration tested | ✅ | `data.test.ts`, E2E migration/persistence/corrupt recovery |
| 9 | Works across supported screen sizes | ✅ (web) · ⏳ (devices) | E2E phone/tablet/desktop, no horizontal scroll |
| 10 | No known critical security/privacy issues | ✅ | No network, strict CSP, sanitized input, 0 prod vulns; legal review ⏳ |
| 11 | Accessibility testing performed & documented | ✅ automated · ⏳ manual SR | [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| 12 | Core app works offline | ✅ | E2E offline test (service worker); native bundles assets |
| 13 | Automated suites pass | ✅ | TEST_REPORT |
| 14 | Android release-build preparation complete | ✅ prep · ⏳ build | Project, SDK 36, versioning, signing template, icons, backup rules, permission audit, checklist |
| 15 | iOS project preparation complete | ✅ prep · ⏳ build | Project (SPM), privacy manifest, plist, icons, version, checklist |
| 16 | Unverified platform requirements documented | ✅ | Build guides, checklists, KNOWN_LIMITATIONS |
| 17 | Store metadata accurate | ✅ draft | [store/STORE_LISTING.md](store/STORE_LISTING.md) — features only, no outcome claims |
| 18 | No unauthorized third-party content | ✅ | [ASSET_INVENTORY.md](ASSET_INVENTORY.md) (fonts OFL; original art; OS emoji rendered at runtime) |
| 19 | No unapproved external deployments | ✅ | None performed |
| 20 | GitHub remote untouched | ✅ | Local git only; `git remote -v` empty; nothing pushed |

## Unresolved blockers before submission (owner actions)

1. Install Android Studio (accept SDK license) → `./gradlew bundleRelease`; test on ≥ 2 physical devices; decide on removing `INTERNET`.
2. On a Mac with Xcode 26+: add `PrivacyInfo.xcprivacy` to the target, sign, archive, TestFlight, device tests.
3. Confirm final app/bundle id; create upload key; Play & Apple developer accounts (paid).
4. Legal review + public hosting of the privacy policy; support email/URL.
5. Independent educational content review (Part A of EDUCATIONAL_VALIDATION.md); manual TalkBack/VoiceOver tests.
6. Store screenshots and Play feature graphic (original art).
7. Google Play: closed test with ≥ 12 testers × 14 days if on a new personal account.
