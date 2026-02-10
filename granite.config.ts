import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'aura-spoon',
  web: {
    host: '0.0.0.0',
    port: 3016,
    commands: {
      dev: 'rsbuild dev',
      build: 'rsbuild build',
    },
  },
  permissions: [],
  outdir: 'dist',
  brand: {
    displayName: '나만의 기운이',
    icon: 'https://raw.githubusercontent.com/jino123413/app-logos/master/aura-spoon.png',
    primaryColor: '#7B61FF',
    bridgeColorMode: 'basic',
  },
  webViewProps: {
    type: 'partner',
  },
});
