# GitHub Pages deployment

The web app is published at **https://aalsammani.github.io/mathquest-kids/**. This is a GitHub *project site*, so every file is served under the path `/mathquest-kids/`.

## Two builds, two base paths

| Build | Command | Output | Base path | Used by |
|---|---|---|---|---|
| Native / default | `npm run build` | `dist/` | `./` (relative) | `npx cap sync` → Android (`https://localhost`) and iOS (`capacitor://localhost`) |
| GitHub Pages | `npm run build:pages` | `dist-pages/` | `/mathquest-kids/` | `.github/workflows/deploy.yml` |
| E2E under Pages path | `npm run build:e2e:pages` | `dist-e2e-pages/` | `/mathquest-kids/` | `playwright.pages.config.ts` (adds the read-only test hook) |

The base path is chosen in `vite.config.ts` by **build mode**, not by an environment variable. A Pages path therefore cannot leak into the native apps. Only the `pages` and `e2e-pages` modes read `BASE_PATH`, which overrides `/mathquest-kids/`. The workflow sets `BASE_PATH` from the repository's Pages settings, so the site keeps working if the repository is renamed or used as a user site (`/`).

`capacitor.config.ts` still uses `webDir: 'dist'`. Run `npx cap sync` only after `npm run build`.

## What the Pages build contains

- `index.html` with absolute bundle URLs (`/mathquest-kids/assets/…`). Fonts are bundled (`.woff2`, referenced from CSS), and icons sit in `icons/`.
- `manifest.webmanifest` with `start_url` and `scope` set to `/mathquest-kids/`.
- `sw.js` (Workbox), scoped to `/mathquest-kids/`. It precaches the app shell for offline use and uses `skipWaiting` + `clientsClaim` + `cleanupOutdatedCaches`. A new deployment replaces the old cache on the next visit, and a second reload shows the new version. Each file has a content hash, so stale bundles are never mixed with new HTML.
- `404.html` redirects any unknown URL under the site to `/mathquest-kids/`. The app switches screens in memory, so there are no deep links to preserve, and refreshing any screen reloads `index.html`.
- `.nojekyll` (harmless with Actions deployment; it matters only if the site is published from a branch).

## Checks

- `scripts/verify-pages-build.mjs` fails the build if the output contains raw source or `/src/main.ts`. It also fails if any file referenced from `index.html`, CSS `url()`s, the manifest, or the service-worker precache list is missing, uses a root path outside the base, or points to another origin, or if `start_url`/`scope` are wrong.
- `scripts/serve-pages.mjs` serves a folder the way GitHub Pages does: only under the base path, a 301 for the path without a trailing slash, and `404.html` with status 404, with **no** single-page-app fallback.
- `tests/pages/deploy.spec.ts` runs against the exact production build on phone, iPhone-size and desktop viewports. It covers JS/CSS/font/icon loading, console errors and failed requests, all four levels (lesson + practice question), stories, all seven tools, both games, the parental gate, refresh and direct URLs, the 404 redirect, manifest and service-worker scope, and offline use.
- The full E2E suite (`tests/e2e`) also runs under `/mathquest-kids/`. The tests use base-relative URLs (`page.goto('./')`), so the same specs work at `/` and under the Pages path.
