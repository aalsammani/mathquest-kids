import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// `--mode e2e` (and `--mode e2e-pages`, the same build under the GitHub Pages base) builds expose a read-only test hook (window.__mqTest) used by
// Playwright to read the expected answer. Production builds never include it.
//
// Base path (where the built files are served from):
//   - Default (`npm run build` -> dist/, used by Capacitor for Android/iOS): relative './',
//     so the bundle works from https://localhost (Android) and capacitor://localhost (iOS).
//     This build is never affected by BASE_PATH, so native apps cannot pick up a web path.
//   - GitHub Pages (`npm run build:pages` -> dist-pages/, i.e. `--mode pages`): '/mathquest-kids/',
//     the project-site path https://<user>.github.io/mathquest-kids/.
//     The BASE_PATH environment variable overrides it (e.g. BASE_PATH=/new-repo-name/); the
//     GitHub Actions workflow sets it from the repository's Pages settings.
const PAGES_MODES = new Set(['pages', 'e2e-pages']);
function resolveBase(mode: string): string {
  if (!PAGES_MODES.has(mode)) return './';
  let base = process.env.BASE_PATH?.trim() || '/mathquest-kids/';
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base += '/';
  return base;
}

/**
 * Static-host extras, emitted only for absolute-base builds (GitHub Pages):
 *   - 404.html: any unknown URL under the site redirects to the app's start page.
 *     (The app navigates between screens in memory, so there are no deep links to keep.)
 *   - .nojekyll: disables Jekyll processing if the site is ever published from a branch.
 */
function staticHostFiles(base: string): Plugin {
  return {
    name: 'mq-static-host-files',
    apply: 'build',
    generateBundle() {
      if (base === './') return;
      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${base}">
<title>MathQuest Kids</title>
</head>
<body style="font-family:sans-serif;padding:24px">
<p>This page does not exist. <a href="${base}">Open MathQuest Kids</a>.</p>
</body>
</html>
`;
      this.emitFile({ type: 'asset', fileName: '404.html', source: html });
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
    },
  };
}

export default defineConfig(({ mode }) => {
  const base = resolveBase(mode);
  return {
    base,
    define: {
      __E2E__: JSON.stringify(mode === 'e2e' || mode === 'e2e-pages'),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '2.0.0-rc.1'),
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 600,
    },
    plugins: [
      staticHostFiles(base),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false, // registered manually (skipped inside native shells)
        includeAssets: ['icons/*.png', 'icons/*.svg'],
        manifest: {
          name: 'MathQuest Kids',
          short_name: 'MathQuest',
          description: 'Reasoning-centered math adventures for young learners. No ads, no accounts, works offline.',
          // './' for relative builds; the absolute site path (e.g. /mathquest-kids/) for GitHub Pages.
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'any',
          background_color: '#EAF8FF',
          theme_color: '#8B6FF0',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
          globIgnores: ['**/404.html'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          // A new deployment takes over on the next load instead of waiting for every tab to close.
          skipWaiting: true,
          clientsClaim: true,
        },
      }),
    ],
  };
});
