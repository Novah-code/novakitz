import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'shop.novakitz.app',
  appName: 'Novakitz',
  // Produced by `npm run build:app` (scripts/build-app.sh), not by `next build`.
  webDir: '.appbuild/out',
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
