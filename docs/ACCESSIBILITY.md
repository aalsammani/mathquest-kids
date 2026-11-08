# Accessibility

**Target:** WCAG 2.2 Level AA where applicable, plus mobile expectations (TalkBack, VoiceOver, touch targets). **Status:** automated checks pass. **Manual screen-reader testing on physical devices is pending.**

## Implemented

| Need | Implementation |
|---|---|
| Text contrast (1.4.3) | v1.1 put white text on #35C26B, #3FB4F6 and #FF6B6B (**2.3–2.8:1, failing**). v2 keeps the bright hues for decoration and uses deeper shades of the same hues for text surfaces: #1A7F45 5.0:1, #0B6FAD 5.4:1, #B83434 5.9:1, #5F44CC 6.6:1. Faint text was 3.0:1 and is now 5.1:1. |
| Non-color cues (1.4.1) | ✓/✗ marks plus text labels on answers. Ten-frame second color is a **ring shape**, not just red. Fraction shading uses **stripes**. State pills have icons and words. |
| Keyboard (2.1.1) | Every control is a native `button` or `input`. Number keys 1–6 choose answers, H gives a hint, Enter moves to Next. The number line works with arrow keys, Home and End. Shade circles use focusable `role=checkbox` paths. |
| No dragging required (2.5.7) | The number line also accepts taps and ◀ ▶ buttons. Ordering and matching are tap-based. |
| Target size (2.5.8) | Buttons are at least 44×44 CSS px (most are 48 px). An E2E test measures every visible button on the activity screen. |
| Focus (2.4.7, 2.4.11) | A visible 3 px outline plus a ring. Focus moves to the screen heading on navigation. Modals trap focus, close on Escape, and restore focus (E2E-tested). |
| Names (4.1.2, 2.5.3) | Accessible names come from visible text, with screen-reader-only separators where needed (axe `label-content-name-mismatch` was found and fixed). The `role=listitem` misuse on level buttons was found and fixed. |
| Status messages (4.1.3) | Feedback, hints, toasts and keypad display use live regions. |
| Math visuals (1.1.1) | Every SVG/DOM model has `role=img` and a descriptive label, e.g. "A circle cut into 4 equal parts with 3 shaded" or "Bar graph … each grid line is 2". |
| Reading support | **Read aloud** on every question (native TTS in the apps, Web Speech in browsers), slow reading, and volume. Short sentences for Level 1. Speech is never required to complete a task. |
| Motion (2.3.3) | Calm mode and `prefers-reduced-motion` stop animations, clouds, confetti and moving balloons. Balloon Pop defaults to relaxed, untimed play. |
| Timing (2.2.1) | No time limits in lessons, practice, Skill Checks or stories. Timed games are off by default and parent-controlled. |
| Text size (1.4.4) | Large-text setting. Layouts reflow at 390 px width with no horizontal scroll (E2E-tested on phone, tablet and desktop). |
| High contrast | A high-contrast mode, also scanned by axe. |
| Orientation (1.3.4) | Portrait and landscape are supported. |

## Automated test results (2026-11-06)

- **axe-core 4.14.0 via @axe-core/playwright 4.14.0, tags wcag2a/aa, wcag21a/aa, wcag22aa**: 13 screens/states × 3 viewports (phone, tablet, desktop) = **39 scans, 0 violations of any severity, 942 passing rule checks**. States scanned: welcome, home, map, lesson, activity, tools, a tool, collection, the settings modal, the parental gate, dashboard, dashboard skills, and home in high contrast with large text. Evidence: one JSON file per scan in `reports/e2e/axe/`.
- **Keyboard E2E:** focus trap, Escape, focus restore, number-key answering, and Enter for Next.
- **Target-size E2E:** no visible button under 44×44 on the activity screen.

## Pending (cannot be completed in this environment)

- **TalkBack** (Android) and **VoiceOver** (iOS/iPadOS) walkthroughs on physical devices.
- Switch Control and Voice Control.
- Testing with children who use assistive technology, and with early readers.
- 400% zoom and Android font scaling at 200% on real devices.
- Checking native TTS voice quality on several devices.

### Manual test script (for the pending device checks)

1. With TalkBack/VoiceOver on, complete onboarding, open Level 1, and finish one practice round using swipe navigation only.
2. Do the same for one Math Story Adventure, including the Plan step.
3. Use the number line, shade, array and match interactions with the screen reader.
4. Check that each math visual's description matches what is drawn.
5. Open Settings, then the parental gate (press and hold with assistive-technology gestures), then export a CSV.
6. Turn on large system font sizes and repeat step 1, checking that no text is clipped.

## Known accessibility limitations

- Emoji used for counted objects are rendered by the operating system's emoji font; their appearance varies by platform.
- The press-and-hold parental gate may be hard for some adults with motor impairments. Keyboard (hold Enter or Space) and pointer both work. A switch-friendly alternative should be evaluated.
- The app is English-only. Read-aloud uses an en-US system voice when one is available.
