# Audio and read-aloud compatibility (v2.1)

**Status: improved in code and tested with mocked speech engines and WebKit emulation. Not yet verified on a physical iPad.** Sound quality on an iPad can only be judged on a real device. Use [IPAD_TEST_CHECKLIST.md](IPAD_TEST_CHECKLIST.md).

## 1. The reported problem

Read-aloud was understandable on Windows and Android but unclear or hard to hear on iPad.

## 2. Root causes found in the code (v2.0)

| # | Cause | Effect on iPad |
|---|---|---|
| S1 | The voice was chosen as **the first on-device en-US voice** in `speechSynthesis.getVoices()`. | iPadOS lists Apple's novelty and sound-effect voices (Albert, Bad News, Bahh, Bells, Boing, Bubbles, Cellos, Good News, Jester, Organ, Superstar, Trinoids, Whisper, Wobble, Zarvox) and older robotic voices (Fred, Junior, Ralph, Eddy, Flo, Grandma, …) alongside the clear ones. They are all marked on-device and usually come first alphabetically, so the app could pick a novelty voice. On Windows (Microsoft David/Zira) and Android ("English United States") the first such voice happens to be a clear one, which is why those platforms sounded fine. |
| S2 | Utterance `volume` was tied to the **sound-effects** slider (default 0.8) and pitch was 1.05. | Speech was 20 % quieter than the engine's maximum, on a device whose built-in speakers are already quiet. The raised pitch made it slightly less natural. |
| S3 | `speechSynthesis.cancel()` was immediately followed by `speak()`. | WebKit can drop or clip an utterance queued in the same tick as `cancel()`. This happened at every new question, hint and feedback. |
| S4 | Speech started 250 ms after rendering, outside any user gesture. There was no unlock step and no recovery from a paused engine. | iOS blocks speech until the page has had a user gesture. After an interruption (a call, Siri, switching apps) the engine can stay paused. Both fail silently. |
| S5 | Voices were read once, plus `voiceschanged`. | Safari often returns an empty list at first and may not fire `voiceschanged`. |
| S6 | There was no status, no test button and no voice choice. | Failures were silent, and families could not pick a better voice. |
| S7 | Math symbols were passed through (`−`, `×`, `÷`, `=`, `3/4`, `___`). | Engines read these inconsistently, for example "3 slash 4" or skipping the minus sign. |

## 3. What v2.1 does (`src/ui/speech.ts`, used by `src/ui/media.ts`)

- **Voice ranking:** English only; en-US first, then other English variants. On-device voices are preferred (they work offline and send nothing anywhere). Novelty voices are never chosen, robotic ones only if nothing clearer exists, and Enhanced/Premium voices get a bonus. Known clear voices are recognised on Apple (Samantha, Ava, Allison, Karen, Daniel, …), Microsoft (David, Zira, Aria, Jenny, …) and Google/Android. Names alone never decide: language and on-device status come first.
- **No regression on Windows and Android:** the ranking picks the same voice as before on representative Windows Edge, Chrome desktop and Android voice lists (unit-tested).
- **Rate and pitch:** pitch 1.0. Rate 0.9 on WebKit/iPad and 0.95 elsewhere; **Slow** is 0.72 / 0.75. Utterance **volume is always 1.0**, and the device volume controls loudness. The sound-effects slider now affects only sound effects.
- **No overlaps:** every request increments a generation counter. If the engine is busy, the controller cancels, waits 140 ms on WebKit (40 ms elsewhere), and speaks only if no newer request has arrived. Rapid taps on 🔊 Listen produce one reading, never overlapping ones.
- **iPad gesture rules:** the first tap or key press anywhere speaks a silent utterance inside the gesture, which unlocks speech. Before that, automatic reading is skipped (not attempted and failed) and the screen shows "Tap 🔊 Listen to hear it." 🔊 Listen always speaks synchronously inside its own tap. Web Audio (sound effects) is also resumed on every tap, because iOS suspends it after interruptions.
- **Robustness:** a paused engine is resumed. Voices are re-read on `voiceschanged` and polled for up to about 4 s when Safari stays silent. A chosen voice that disappears falls back to automatic. Long text is split into sentences of 180 characters or fewer. Utterances are kept referenced so their events fire.
- **No silent failures:** a status (`speaking`, `needs-tap`, `unavailable`, `error`) is shown under the question and in Settings. If nothing starts within 3.5 s, the child sees: "No sound? Check that the volume is up and the silent switch is off, then tap 🔊 Listen again." Errors caused by our own cancel (`interrupted`, `canceled`) are ignored.
- **Clearer text:** `7 − 3` → "7 minus 3", `4 × 5` → "4 times 5", `=` → "equals", `3/4` → "three fourths", `___` → "blank". Emoji are removed.
- **Speech stops** when the child moves to the next question, leaves an activity, or the app goes to the background.
- **Settings (⚙️) → 🔊 Read aloud:**
  - Read questions aloud: on/off (on by default).
  - Speed: 🐢 Slow / 🐇 Normal.
  - Voice: Automatic (recommended), or a list of up to 8 clear **on-device** English voices. Shown only when there is a real choice.
  - 🔊 Test voice ("Hi! Let's solve this problem together. Count the shapes. How many do you see?").
  - A live status line, and on iPad a tip about Silent Mode and downloading an Enhanced voice.
- **Words are always on screen.** Speech is an aid, never the only channel. Prompts that used to be spoken only ("Type a number first") are now also shown.
- **Native apps** (Capacitor, Android/iOS) keep using the system text-to-speech plugin, now with pitch 1.0, volume 1.0 and the same math wording.

**What JavaScript cannot do:** change the device's hardware volume, the Ring/Silent switch or Silent Mode, the audio output route (speaker, headphones, Bluetooth), or which voices iPadOS has installed. The app explains these instead of pretending to control them.

## 4. Platform findings

| Platform | Engine | Expected behaviour after v2.1 | Evidence |
|---|---|---|---|
| Windows: Edge, Chrome | Web Speech (Microsoft SAPI voices; Chrome also lists Google network voices) | Same on-device voice as before (e.g. Microsoft David). Network voices are not chosen automatically and not offered in the picker. | Unit tests with representative voice lists. Full E2E suite in Edge (Chromium) on phone, tablet and desktop viewports with the real engine present. |
| Android: Chrome | Web Speech (Google TTS on-device voices) | Same voice as before ("English United States"). | Unit test with a representative list. Not run on a physical Android device in this pass. |
| Android app (Capacitor) | Native TTS plugin | Unchanged path; pitch 1.0 and volume 1.0. | Code review only (no device build in this pass). |
| iPad/iPhone: Safari, and every iOS browser (all use WebKit) | Web Speech on AVSpeechSynthesizer | Clear voice (Samantha, or an installed Enhanced voice), no novelty voices, gesture unlock, no clipped utterances, resume after interruption, visible status. | Unit tests with an iPadOS-style voice list. E2E with an iPad Safari user agent and a recording engine. All E2E suites in **WebKit** with iPad portrait/landscape and iPhone emulation. **No physical iPad test yet.** |
| iOS app (Capacitor) | Native TTS plugin | Unchanged path. | Not built in this pass (needs macOS/Xcode). |

## 5. Fallback strategy (if a real iPad is still unclear)

Bundling recorded narration was considered and **not** implemented in v2.1, for these reasons:
- Most spoken text is generated: numbers, names and story details vary with every question. Recordings could cover only the fixed phrases (cheers, "Try again", instructions), not the questions.
- It needs licensed recordings of good quality (a human voice actor, or synthetic audio whose licence permits redistribution), plus about 1–3 MB of offline assets. No such assets exist in the project, and cloud TTS services are not allowed (privacy, no external services).

**Recommended order if the device test fails:**
1. Choose a voice in ⚙️ Settings, or download an Enhanced English voice in iPadOS Settings → Accessibility → Spoken Content → Voices.
2. Report which voice and iPadOS version were used. The ranking can be tuned in `src/ui/speech.ts` (`CLEAR`, `ROBOTIC`, `rankVoice`).
3. Only then, commission licensed recordings for the roughly 40 fixed phrases and play them with an `<audio>` element. The controller's status and cancel logic can wrap that player.

## 6. Privacy

No new network requests, services, SDKs or permissions. The chosen voice (`settings.voiceName`) is stored only on the device with the other settings. On-device voices are preferred, so question text does not leave the device. Network voices are offered only on a device that has no on-device English voice at all.
