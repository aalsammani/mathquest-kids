/**
 * Native integration via Capacitor (Android/iOS). Every call is guarded so the web build
 * works unchanged. No permissions are requested.
 */
import { Capacitor } from '@capacitor/core';
import type { KV } from '../data/storage';

export const isNative = (): boolean => Capacitor.isNativePlatform();
export const platform = (): string => Capacitor.getPlatform();

/** Capacitor Preferences-backed key/value store (durable across WebView storage eviction). */
export async function nativeKV(): Promise<KV> {
  const { Preferences } = await import('@capacitor/preferences');
  return {
    kind: 'native' as const,
    async get(key) { return (await Preferences.get({ key })).value; },
    async set(key, value) { await Preferences.set({ key, value }); },
    async remove(key) { await Preferences.remove({ key }); },
    async keys() { return (await Preferences.keys()).keys; },
  };
}

export async function initNative(handlers: { back: () => boolean; pause: () => void; resume: () => void }) {
  if (!isNative()) return;
  const { App } = await import('@capacitor/app');
  // Android hardware back: navigate inside the app; only exit from the home screen.
  void App.addListener('backButton', () => { if (!handlers.back()) void App.exitApp(); });
  void App.addListener('pause', handlers.pause);
  void App.addListener('resume', handlers.resume);
  try { const { StatusBar, Style } = await import('@capacitor/status-bar'); await StatusBar.setStyle({ style: Style.Light }); } catch { /* not available */ }
  try { const { SplashScreen } = await import('@capacitor/splash-screen'); await SplashScreen.hide(); } catch { /* not available */ }
}

/** Save a text file. Web: download link. Native: write to app cache, then open the system share sheet. */
export async function saveFile(name: string, mime: string, text: string): Promise<'downloaded' | 'shared' | 'failed'> {
  if (!isNative()) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement('a');
      a.href = url; a.download = name; a.rel = 'noopener';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return 'downloaded';
    } catch { return 'failed'; }
  }
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: name, url: res.uri, dialogTitle: 'Save or send the MathQuest file' });
    return 'shared';
  } catch { return 'failed'; }
}
