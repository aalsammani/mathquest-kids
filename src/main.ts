/** Boot: fonts (bundled, OFL), storage, migration, screens, platform hooks, offline service worker. */
import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './styles/base.css';
import './styles/components.css';

import { Store, WebKV } from './data/storage';
import { initNative, isNative, nativeKV } from './platform/native';
import { App } from './ui/app';
import { initVoice, play, warmAudio } from './ui/media';
import { ActivityScreen } from './ui/screens/activity';
import { BalloonScreen, CollectionScreen, GamesScreen, MemoryScreen, ShopScreen, StoriesScreen } from './ui/screens/hubs';
import { HomeScreen, openSettings, WelcomeScreen } from './ui/screens/home';
import { LessonScreen, MapScreen } from './ui/screens/map';
import { ParentScreen } from './ui/screens/parent';
import { ToolScreen, ToolsScreen } from './ui/screens/tools';

async function boot() {
  const kv = isNative() ? await nativeKV() : new WebKV();
  const store = new Store(kv);
  const load = await store.init();
  const app = new App(store);
  app.register(HomeScreen, WelcomeScreen, MapScreen, LessonScreen, ActivityScreen, StoriesScreen, ToolsScreen, ToolScreen, GamesScreen, BalloonScreen, MemoryScreen, CollectionScreen, ShopScreen, ParentScreen);

  // Global error boundary: show a friendly recovery panel; progress is already saved.
  window.addEventListener('error', e => { app.logError('window', e.error ?? e.message); });
  window.addEventListener('unhandledrejection', e => { app.logError('promise', e.reason); });

  document.getElementById('btn-back')!.addEventListener('click', () => { play('click'); void app.back(); });
  document.getElementById('btn-home')!.addEventListener('click', () => { play('click'); void app.home(); });
  document.getElementById('btn-settings')!.addEventListener('click', () => { play('click'); openSettings(app); });
  document.getElementById('btn-profile')!.addEventListener('click', () => { play('click'); void app.go('collection'); });
  document.addEventListener('pointerdown', warmAudio, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') app.pause(); });
  window.addEventListener('pagehide', () => app.pause());
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) void app.back(); });

  await initVoice();
  await initNative({ back: () => { void app.back().then(handled => { if (!handled && app.currentId !== 'home') void app.home(); }); return app.currentId !== 'home'; }, pause: () => app.pause(), resume: () => app.refreshTopbar() });

  if (!store.state.onboarded) app.replace('welcome');
  else app.replace('home');
  if (load.source === 'migrated-v1') setTimeout(() => app.toast('Welcome back! Your progress from the earlier version was carried over.'), 600);
  if (load.source === 'repaired-corrupt') setTimeout(() => app.toast('Some saved data could not be read. A copy was kept safely.'), 600);

  // Offline support for the web build (native apps bundle all assets already).
  if (!isNative() && 'serviceWorker' in navigator && import.meta.env.PROD) {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  }
  if (__E2E__) (window as unknown as { __mqApp: App }).__mqApp = app;
}

declare const __E2E__: boolean;
void boot().catch(err => {
  console.error(err);
  const main = document.getElementById('main');
  if (main) main.textContent = 'Sorry — MathQuest Kids could not start. Please reload the page.';
});
