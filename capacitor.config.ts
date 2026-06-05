import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.synccv.app',
  appName: 'SyncCV',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
