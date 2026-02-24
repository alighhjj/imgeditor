import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imageeditor.app',
  appName: '图片编辑器',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      permissions: ['read', 'write']
    },
    CapacitorMediaScanner: {
      permissions: ['read']
    }
  }
};

export default config;
