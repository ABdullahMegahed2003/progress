import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymapp.app',
  appName: 'Gym App',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
