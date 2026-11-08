# iPad manual test checklist (v2.1)

Automated tests used mocked speech engines and WebKit emulation. They cannot hear an iPad. Please run this once on a **real iPad** (and an iPhone if you have one) after deploying v2.1, and record the results at the bottom. Allow about 15 minutes.

**Before you start**
- iPad: Settings → General → About → note the **iPadOS version** and **model**.
- Open **https://aalsammani.github.io/mathquest-kids/** in **Safari**. Reload twice so the new version replaces the cached one. ⚙️ Settings should show a **"🔊 Read aloud"** section with **Test voice**; if it doesn't, reload again.
- Turn the volume up with the side buttons. Turn **Silent Mode off** (Control Center bell, or the Ring/Silent switch on older iPads). Disconnect Bluetooth headphones unless you mean to test them.

## A. Voice quality

| # | Step | Expected | Pass? |
|---|---|---|---|
| A1 | Tap ⚙️ → **🔊 Test voice**. | A clear, natural English voice says "Hi! Let's solve this problem together…". Not a robotic, singing, whispering or sound-effect voice. | |
| A2 | Read the **Voice** list. | "Automatic (…)" names a sensible voice such as Samantha. No Albert, Bubbles, Zarvox, Bad News, Whisper or similar. | |
| A3 | Choose another voice, then Test voice. Choose **Automatic** again. | Each choice is spoken in that voice. | |
| A4 | Tap **🐢 Slow**, then **🐇 Normal**. | Slow is clearly slower but natural; Normal is comfortable for a young child. | |
| A5 | Optional: iPad Settings → Accessibility → Spoken Content → Voices → English → download an **Enhanced** voice (e.g. Ava or Samantha Enhanced). Reload the app and open the Voice list. | The Enhanced voice is listed, and Automatic prefers it. | |

## B. Reading during activities

| # | Step | Expected | Pass? |
|---|---|---|---|
| B1 | Home → Level 1 → first skill → 🚀 Practice. | The question is read automatically, clearly and completely (not cut off). | |
| B2 | Tap **🔊 Listen** 5 times quickly. | One clean reading; no overlapping voices, no stutter loop. | |
| B3 | Answer wrong once. | "Try again…" is spoken and also shown on screen. | |
| B4 | Answer correctly. | Cheer and explanation are spoken; **Next question →** is visible without scrolling. | |
| B5 | Tap **Next question →** while it is still speaking. | Speech stops at once; the new question is read. | |
| B6 | Find a question with "−", "×" or a fraction (Level 2 subtraction, Level 4 multiplication, Level 3 Equal Parts). | It says "minus", "times", "three fourths", not "slash" or symbols. | |
| B7 | Open a 📖 Story and tap 🔊 Listen. | The whole story is read without being cut off. | |

## C. Interruptions and restrictions

| # | Step | Expected | Pass? |
|---|---|---|---|
| C1 | While it is speaking, press the Home gesture (leave Safari) and come back. | Speech stopped when you left. 🔊 Listen works again. | |
| C2 | Turn **Silent Mode on**, then tap 🔊 Listen. | The text is still on screen. If there is no sound, the app shows "No sound? Check that the volume is up and the silent switch is off…". Nothing freezes. | |
| C3 | Lock the screen for 30 s, unlock, then tap 🔊 Listen. | Speech works (the engine resumes). | |
| C4 | Close the Safari tab, open the site again, and wait on a question **without tapping**. | Either it reads, or it shows "Tap 🔊 Listen to hear it." Tapping Listen then reads. | |
| C5 | ⚙️ → turn **Read questions aloud** off. Start practice. | No automatic reading; 🔊 Listen still reads on request. | |

## D. Layout and navigation (portrait and landscape)

| # | Step | Expected | Pass? |
|---|---|---|---|
| D1 | Do a full practice round of 10 questions in **portrait**, then one in **landscape**. Rotate once mid-question. | "Question N of 10" counts up. **Next** is always visible after answering. Results appear after 10. Nothing overlaps; no sideways scrolling. | |
| D2 | Double-tap **Next question →** quickly. | It moves on exactly one question and does not answer the next one. | |
| D3 | On the results screen, tap **🔄 Practice again**, then **🗺️ Back to Level N**. | A new round starts at question 1; Back to Level shows the map. | |
| D4 | Game Room → Balloon Pop → play 10 rounds. | Finish message and **🔄 Play again**. | |
| D5 | Game Room → Memory Match → match all pairs. | Finish message and **🔄 Play again**. | |
| D6 | iPad Settings → Accessibility → Display & Text Size → Larger Text (a large size). Reload. Also try ⚙️ Large text. | Text grows; buttons stay usable; no clipped words. | |
| D7 | Optional: add to Home Screen (Share → Add to Home Screen), open it, and repeat B1. | It works the same as in Safari. | |

## Record

| Field | Value |
|---|---|
| Date / tester | |
| iPad model / iPadOS version | |
| Voice chosen by Automatic | |
| Enhanced voice installed? | |
| Failures (step numbers + what happened) | |

If any **A** or **B** step fails, note the voice name and iPadOS version. Next steps are in [AUDIO_COMPATIBILITY.md](AUDIO_COMPATIBILITY.md) §5.
