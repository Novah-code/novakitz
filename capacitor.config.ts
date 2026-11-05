import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.novakitz.app',
  appName: 'Novakitz',
  // Produced by `npm run build:app` (scripts/build-app.sh), not by `next build`.
  webDir: '.appbuild/out',
  ios: {
    // The page draws under the status bar and the home indicator itself
    // (viewport-fit=cover; every screen pads with env(safe-area-inset-*)).
    // 'automatic' made iOS shrink the web view by those same insets, which left
    // the web view's own white background showing as a band at the screen edge.
    contentInset: 'never',
    // What shows behind the page if a gap ever appears: the sky's own cream,
    // not white.
    backgroundColor: '#F4EEE5',
  },
};

export default config;
