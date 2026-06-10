import Link from "next/link";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import LanguageToggle from "@/components/ui/LanguageToggle";
import TenuMark from "@/components/brand/TenuMark";
import UserMenu from "./UserMenu";

/**
 * Global site header — rendered once in the root layout.
 *
 * Éditorial v2 chrome (#T149, 2026-06-10): white ground, 1px hairline
 * bottom border, ink nav links set as underlined typographic links.
 * Flat to the canvas — no scroll effects, no fill change, no shadow.
 * The disc mark + Inter Tight wordmark are UNCHANGED per MH; only the
 * mark's container colour follows the achromatic chrome (ink on white).
 * The sign-up action is a primary commercial action and therefore uses
 * the approved filled-black exception (.t-cta-primary).
 *
 * Not a client component: auth state lives server-side. The avatar
 * menu (UserMenu) is the only client island and only mounts when a
 * user is signed in.
 */
export default async function GlobalHeader() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale: Locale = cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
  const uiLocale: "fr" | "en" = locale === "fr" ? "fr" : "en";

  const dict = (await getDictionary(locale)) as Record<
    string,
    Record<string, string>
  >;
  const nav = dict.nav ?? {};

  // Pull the session. If anything throws (service down, cold start),
  // render anonymous chrome rather than 500-ing the entire site.
  let email: string | null = null;
  let fullName: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      email = data.user.email ?? null;
      // Read profile row for display name. Anon key is fine here because
      // the user is reading their own row and RLS policy allows it.
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      fullName = (profile?.full_name as string | null) ?? null;
    }
  } catch {
    // Swallow — fall through to anonymous chrome.
  }

  const isAuthed = !!email;

  return (
    <header className="border-b t-hairline bg-tenu-canvas">
      <div className="ed-frame flex h-16 items-center justify-between">
        <Link
          href="/"
          className="hig-press flex items-center gap-2"
          aria-label="Tenu — home"
        >
          <TenuMark container="disc" size={28} title="Tenu" fill="#000000" carve="#ffffff" />
          <span className="t-wordmark text-xl">tenu</span>
        </Link>

        <nav className="flex items-center gap-4 md:gap-6">
          <LanguageToggle currentLocale={locale} chrome="light" />

          <Link
            href="/pricing"
            className="ed-link hidden min-h-11 items-center text-base sm:inline-flex"
          >
            {nav.pricing ?? (uiLocale === "fr" ? "Tarifs" : "Pricing")}
          </Link>

          {isAuthed ? (
            <UserMenu email={email!} fullName={fullName} locale={uiLocale} />
          ) : (
            <>
              <Link
                href="/auth/login"
                className="ed-link hidden min-h-11 items-center text-base sm:inline-flex"
              >
                {nav.login ?? (uiLocale === "fr" ? "Connexion" : "Log in")}
              </Link>
              {/* Approved exception: sign-up is a primary commercial
                  action — filled black rectangle, 0px radius. h-9 visual
                  inside the 64px chrome; before-overlay keeps the 44px
                  touch floor. */}
              <Link
                href="/auth/login"
                className="hig-press relative inline-flex h-9 items-center bg-tenu-cta px-4 text-sm font-medium text-white before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']"
              >
                {nav.signup ?? (uiLocale === "fr" ? "S'inscrire" : "Sign up")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
