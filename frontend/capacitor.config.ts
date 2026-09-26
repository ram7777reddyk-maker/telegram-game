import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.telegramrummy.app',
  appName: 'Telegram Rummy',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;
