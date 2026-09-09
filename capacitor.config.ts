import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tredro.dashboard',
  appName: 'tredro-dashborad',
  webDir: "out",
  plugins: {
    PushNotifications: {
      // Ensures Android/iOS show the system tray notification (with sound) even
      // while the app is in the foreground, instead of only firing the JS listener.
      presentationOptions: ["badge", "sound", "alert", "banner", "list"],
    },
  },
};

export default config;
