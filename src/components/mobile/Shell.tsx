"use client";

/**
 * Mobile shell — mounts the native plugins (status bar, splash, deep
 * link listener) and wraps children with safe-area padding.
 *
 * Uses env(safe-area-inset-*) so the layout respects the notch on iOS
 * and the gesture bar on Android.
 *
 * Éditorial v2 (#T150): pure white canvas, black ink. The status bar
 * uses dark content (Style.Light) over the white surface. Hex values
 * below are intentional: the StatusBar plugin and the splash → first
 * paint colour match cannot read CSS custom properties, so the
 * editorial canvas/ink values are pinned here (and must stay in sync
 * with --palette-canvas / --palette-ink in theme.css).
 */
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StatusBar, Style as StatusBarStyle } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { isNative } from "@/lib/mobile/platform";
import { initDeepLinks } from "@/lib/mobile/deepLink";
import { useMagicLinkHandler } from "@/lib/mobile/useMagicLinkHandler";
import { initPushNotifications, setPushNavigate } from "@/lib/mobile/notifications";

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const router = useRouter();

  // Handle magic-link deep links and Stripe payment-return intents.
  useMagicLinkHandler();

  useEffect(() => {
    if (!isNative()) return;

    // Hide splash once React has painted once. The 300ms grace avoids
    // a flash of background color on slower devices.
    const hideTimer = setTimeout(() => {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => { /* ignore */ });
    }, 300);

    // Style.Light = dark status-bar content for a light surface.
    StatusBar.setStyle({ style: StatusBarStyle.Light }).catch(() => { /* ignore */ });
    StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => { /* ignore */ });

    initDeepLinks();

    // Wire push notification navigate fn before registering, so tap-to-open
    // events have a router before the first notification arrives.
    setPushNavigate((path: string) => router.push(path));
    void initPushNotifications();

    return () => clearTimeout(hideTimer);
  }, [router]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        // Editorial canvas + ink. Inline so the splash → first paint
        // colour match is bulletproof regardless of how the Tailwind
        // tokens resolve. Keep in sync with theme.css palette.
        backgroundColor: "#ffffff",
        color: "#000000",
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
