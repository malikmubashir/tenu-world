/**
 * Push notification registration for Capacitor native apps.
 *
 * Call `initPushNotifications()` once, early in the native app shell
 * (e.g. from MobileGate or the root mobile layout), after the user has
 * authenticated. It will:
 *   1. Request OS permission (iOS: shows the system prompt once per install).
 *   2. Retrieve the FCM/APNs registration token.
 *   3. POST the token to /api/mobile/push-token so the server can send
 *      scan-complete + letter-ready pushes.
 *   4. Wire foreground notification display (optional in-app banner).
 *   5. Wire notification tap routing (deep-link to the right report).
 *
 * On web (Capacitor.getPlatform() === "web") the entire module is a no-op
 * so the same codebase renders in Next.js dev mode without errors.
 *
 * FCM setup required (MH task before native sprint):
 *   - Create Firebase project → Add Android app (package world.tenu.app)
 *   - Add iOS app (bundle world.tenu.app)
 *   - Download google-services.json → android/app/
 *   - Download GoogleService-Info.plist → ios/App/App/
 *   - npx cap sync
 *   - Add FCM_PROJECT_ID + FCM_SERVICE_ACCOUNT_EMAIL + FCM_PRIVATE_KEY to Vercel env
 */
import { isNative, platformName } from "./platform";

// Lazily import Capacitor plugins — they throw in the Next.js SSR context
// (no window, no native bridge). The dynamic import() wrapping prevents
// that. The types are imported statically so tsc still checks them.
import type {
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";

type NavFn = (path: string) => void;

let _navigate: NavFn | null = null;
let _registered = false;

/**
 * Supply a navigation function so tap handlers can route to the right page.
 * Call before `initPushNotifications`.
 */
export function setPushNavigate(fn: NavFn): void {
  _navigate = fn;
}

/**
 * Initialise push notifications for a native app session.
 * Safe to call multiple times — registers only once.
 * Requires the user to be authenticated (token saved against their userId
 * server-side via /api/mobile/push-token).
 */
export async function initPushNotifications(): Promise<void> {
  if (!isNative() || _registered) return;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // 1. Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") {
      console.warn("[push] permission not granted:", permResult.receive);
      return;
    }

    // 2. Register with the OS (triggers 'registration' or 'registrationError')
    await PushNotifications.register();

    // 3. On success: save token to server
    await PushNotifications.addListener("registration", async (token) => {
      _registered = true;
      const platform = platformName() as "ios" | "android";
      try {
        await fetch("/api/mobile/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.value, platform }),
        });
      } catch (err) {
        console.warn("[push] failed to save token:", err);
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[push] registration error:", err.error);
    });

    // 4. Foreground notification: log only (system badge + sound handles UX)
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("[push] foreground notification:", notification.title);
      }
    );

    // 5. Notification tap: route to the deep-link if present
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        const data = action.notification.data as Record<string, string> | undefined;
        const link = data?.["link"] ?? data?.["url"];
        if (link && _navigate) {
          try {
            const url = new URL(link);
            _navigate(url.pathname + url.search);
          } catch {
            _navigate(link);
          }
        }
      }
    );
  } catch (err) {
    // Plugin not bridged (web preview, old Capacitor version) — safe to ignore
    console.warn("[push] init failed:", err);
  }
}

/**
 * Remove this device's token on logout. Best-effort — does not throw.
 */
export async function deregisterPushToken(): Promise<void> {
  if (!isNative()) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const { value: token } = await PushNotifications.getDeliveredNotifications()
      .then(() => ({ value: "" }))
      .catch(() => ({ value: "" }));

    // We stored the token in the registration listener. The cleanest approach
    // for logout is to call the DELETE route with every token the server holds
    // for this user — but that requires a server-side list endpoint.
    // For v0.1 we let the server prune stale tokens on 404 from FCM instead.
    // If a token was stored in preferences, send it now.
    const { Preferences } = await import("@capacitor/preferences");
    const { value: storedToken } = await Preferences.get({ key: "push_token" });
    if (storedToken) {
      await fetch("/api/mobile/push-token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: storedToken }),
      });
      await Preferences.remove({ key: "push_token" });
    }
    void token; // suppress unused warning
  } catch {
    // best-effort
  }
}
