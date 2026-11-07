import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// `--mode e2e` builds expose a read-only test hook (window.__mqTest) used by
// Playwright to read the expected answer. Production builds never include it.
export default defineConfig(({ mode }) => ({
  base: './',
  define: {
    __E2E__: JSON.stringify(mode === 'e2e'),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '2.0.0-rc.1'),
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered manually (skipped inside native shells)
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'MathQuest Kids',
        short_name: 'MathQuest',
        description: 'Reasoning-centered math adventures for young learners. No ads, no accounts, works offline.',
        start_url: './',
        scope: './',
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
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
}));
