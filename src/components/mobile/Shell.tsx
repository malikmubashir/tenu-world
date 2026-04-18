"use client";

/**
 * Mobile shell — mounts the native plugins (status bar, splash, deep
 * link listener) and wraps children with safe-area padding.
 *
 * Uses env(safe-area-inset-*) so the layout respects the notch on iOS
 * and the gesture bar on Android. The default color behind the content
 * matches capacitor.config.ts background to avoid the "white flash"
 * on app launch.
 */
import { useEffect, type ReactNode } from "react";
import { StatusBar, Style as StatusBarStyle } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { isNative } from "@/lib/mobile/platform";
import { initDeepLinks } from "@/lib/mobile/deepLink";

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  useEffect(() => {
    if (!isNative()) return;

    // Hide splash once React has painted once. The 300ms grace avoids
    // a flash of background color on slower devices.
    const hideTimer = setTimeout(() => {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => { /* ignore */ });
    }, 300);

    StatusBar.setStyle({ style: StatusBarStyle.Light }).catch(() => { /* ignore */ });
    StatusBar.setBackgroundColor({ color: "#0F3B2E" }).catch(() => { /* ignore */ });

    initDeepLinks();

    return () => clearTimeout(hideTimer);
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col bg-tenu-cream text-tenu-slate"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {children}
    </div>
  );
}
