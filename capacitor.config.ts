import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.vampiresurvivors',
  appName: '小俠想要活下去',
  webDir: 'dist',
  android: {
    minSdkVersion: 24,
    targetSdkVersion: 34,
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'release',
    },
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
