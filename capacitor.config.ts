import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.vanshmala.app',
  appName: 'Vanshmala',
  webDir: 'dist',
  server: {
    // Allow navigation to external domains used by the app
    allowNavigation: [
      '*.supabase.co',
      '*.razorpay.com',
      'vanshmala.in',
      '*.vanshmala.in',
    ],
    // On Android, use cleartext for local dev if needed
    androidScheme: 'https',
  },
  android: {
    // Allow the WebView to load mixed content (http inside https)
    allowMixedContent: true,
    // Capture console output from WebView in Android logcat
    captureInput: true,
    webContentsDebuggingEnabled: true, // Set to false before Play Store release
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
    },
  },
};

export default config;

