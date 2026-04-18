/**
 * Capacitor Preferences wrapper — typed key/value with web fallback.
 *
 * Storage backend:
 *   - Native (iOS / Android): Capacitor Preferences plugin → UserDefaults
 *     on iOS, SharedPreferences on Android. Persists across app updates,
 *     wiped on app uninstall.
 *   - Web preview: localStorage fallback so dev builds in `npm run dev`
 *     behave identically to the device.
 *
 * Keys are namespaced `tenu.<area>.<name>` to avoid collisions if the
 * app ever ships SDKs that share the same backing store.
 */
import { Preferences } from "@capacitor/preferences";
import { isNative } from "./platform";

/** All preference keys live here so we never typo a string at the call site. */
export const PrefKey = {
  IntroCompletedV1: "tenu.intro.v1.completed",
  PreferredLocale: "tenu.locale.preferred",
} as const;
export type PrefKeyValue = (typeof PrefKey)[keyof typeof PrefKey];

/** Read a string. Returns null if unset. */
export async function prefGet(key: PrefKeyValue): Promise<string | null> {
  if (!isNative()) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  }
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return null;
  }
}

/** Write a string. */
export async function prefSet(key: PrefKeyValue, value: string): Promise<void> {
  if (!isNative()) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
    return;
  }
  try {
    await Preferences.set({ key, value });
  } catch {
    /* swallow — preferences are not load-bearing for the app to function */
  }
}

/** Convenience: boolean accessors layered on top of string get/set. */
export async function prefGetBool(key: PrefKeyValue): Promise<boolean> {
  const v = await prefGet(key);
  return v === "1" || v === "true";
}

export async function prefSetBool(key: PrefKeyValue, value: boolean): Promise<void> {
  await prefSet(key, value ? "1" : "0");
}
