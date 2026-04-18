import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Tenu mobile shell.
 *
 * The native app is a thin wrapper around a static Next.js export.
 * API calls go to https://tenu.world/api/* over HTTPS — no secrets
 * or AI keys ever ship on-device.
 *
 * To (re)generate native projects on your Mac:
 *   npm install
 *   npm run build:mobile            # produces ./out
 *   npx cap add ios
 *   npx cap add android
 *   npm run cap:ios                 # opens Xcode
 *
 * See MOBILE-RUNBOOK.md for the full dance.
 */
const config: CapacitorConfig = {
  appId: "world.tenu.app",
  appName: "Tenu",
  webDir: "out",

  /**
   * iOS + Android content security — the shell MUST only load content
   * from tenu.world in production. Localhost is whitelisted for `cap run`
   * development against `next dev`.
   */
  server: {
    androidScheme: "https",
    iosScheme: "https",
    // For local device testing against a dev laptop:
    //   set CAP_SERVER_URL=http://192.168.x.y:3000 before cap sync.
    // Unset in CI + release builds.
    url: process.env.CAP_SERVER_URL,
    cleartext: process.env.CAP_SERVER_URL?.startsWith("http://") ? true : false,
    allowNavigation: ["tenu.world", "*.tenu.world"],
  },

  ios: {
    contentInset: "always",
    scheme: "Tenu",
    // Background color shown during webview load — matches iOS splash.
    backgroundColor: "#F5F1E8",
    limitsNavigationsToAppBoundDomains: true,
  },

  android: {
    backgroundColor: "#F5F1E8",
    allowMixedContent: false,
    captureInput: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: "#F5F1E8",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#0F3B2E",
      overlaysWebView: false,
    },
    Camera: {
      // Capacitor Camera prompts natively. We never auto-grant.
      // Usage descriptions live in Info.plist + AndroidManifest.
    },
    CapacitorSQLite: {
      iosDatabaseLocation: "Library/CapacitorDatabase",
      iosIsEncryption: false,
      iosKeychainPrefix: "world.tenu",
      iosBiometric: {
        biometricAuth: false,
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
      },
    },
  },
};

export default config;
