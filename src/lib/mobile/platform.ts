/**
 * Platform detection helpers.
 *
 * Rule: NEVER assume running in Capacitor. Every mobile utility must
 * degrade gracefully on the web (Next.js dev server, browser preview)
 * so the same codebase renders in both.
 */
import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function isIOS(): boolean {
  return Capacitor.getPlatform() === "ios";
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}

export function isWeb(): boolean {
  return Capacitor.getPlatform() === "web";
}

/** The string "ios" | "android" | "web". Useful for logging. */
export function platformName(): string {
  return Capacitor.getPlatform();
}
