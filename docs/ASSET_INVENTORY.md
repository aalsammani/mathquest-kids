# Asset and License Inventory

## Code and fonts shipped in the app

| Component | Version | License | Notes |
|---|---|---|---|
| MathQuest Kids source | 2.0.0-rc.1 | MIT (© 2025 Abdallah Alsammani) | `LICENSE` |
| @capacitor/core, android, ios, app, preferences, filesystem, share, splash-screen, status-bar | 8.x | MIT | No network calls, no analytics |
| @capacitor-community/text-to-speech | 8.0.2 | MIT | Uses the device's TTS engine |
| workbox-window (via vite-plugin-pwa) | 7.4.1 | MIT | Web only; service worker caches the app's own files |
| Baloo 2 (weights 500, 700; Latin subset) via @fontsource/baloo-2 | 5.3.0 | **SIL OFL 1.1** | Bundled `.woff2`; no Google Fonts requests |
| Nunito (weights 700, 800, 900; Latin subset) via @fontsource/nunito | 5.3.0 | **SIL OFL 1.1** | Bundled `.woff2` |

Production dependency audit (`npm audit --omit=dev`) on 2026-11-06: **0 vulnerabilities**. Dev-only tooling reported 10 low/moderate advisories in transitive build/test dependencies; these do not ship in the app.

## Visual assets

| Asset | Origin | License |
|---|---|---|
| App icon, adaptive icon, maskable icon, splash screens | **Original.** Generated from SVG by `scripts/make-icons.mjs` (rounded tile in the app's sun→coral gradient with +, −, ×, ÷ tiles) | MIT (project) |
| All math diagrams (number lines, fraction bars/circles, arrays, clock, base-ten blocks, bar graphs, balance, ruler, shapes) | **Original**, drawn programmatically in `src/ui/visuals.ts` | MIT (project) |
| UI styling ("Sunny Meadow" palette, toy-block buttons, trail map) | Carried over from v1.1 (same author), with accessibility color adjustments | MIT (project) |
| Emoji (mascots, counted objects, icons) | **Not bundled.** They are Unicode characters rendered by the operating system's emoji font (Apple, Google, Microsoft). Appearance varies by platform. No emoji images are included in the app or store art. | Characters are not copyrightable; the glyph art belongs to each OS vendor and is rendered at runtime under the platform's license. Store screenshots will show OS glyphs, which is common practice; confirm with the owner's counsel if concerned. |
| Sounds | **None bundled.** Tones are synthesized at runtime with WebAudio. | — |

## Generative AI

No generative-image models were used for diagrams or art. The code, content and documentation were written by the project owner with an AI coding assistant (Claude). Every mathematical item is machine-validated, and human expert review is still pending ([EDUCATIONAL_VALIDATION.md](EDUCATIONAL_VALIDATION.md)).

## Third-party products referenced

Competitor apps are named only in `docs/COMPETITIVE_BENCHMARK.md` for analysis. No proprietary code, art, characters, interface designs or content were copied.
