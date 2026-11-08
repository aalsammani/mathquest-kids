import type { CapacitorConfig } from '@capacitor/cli';

/**
 * PROVISIONAL identifiers — confirm before the first store upload (they cannot change afterward):
 *   appId 'com.alsammani.mathquestkids' (reverse-DNS; owner should use a domain they control)
 * See docs/ANDROID_BUILD.md and docs/IOS_BUILD.md.
 */
const config: CapacitorConfig = {
  appId: 'com.alsammani.mathquestkids',
  appName: 'MathQuest Kids',
  webDir: 'dist',
  // Assets are served from the app bundle (https://localhost on Android, capacitor://localhost on iOS).
  server: { androidScheme: 'https' },
  android: {
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    scheme: 'MathQuest Kids',
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: { launchShowDuration: 600, launchAutoHide: false, backgroundColor: '#EAF8FF', showSpinner: false },
    StatusBar: { style: 'LIGHT', overlaysWebView: false, backgroundColor: '#EAF8FF' },
  },
};

export default config;
