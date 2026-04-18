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
 * Identity v1 chrome (decided 2026-04-18, Option C): solid Tenu Ink
 * background, Paper link text, Disc mark + Inter Tight wordmark. The
 * primary CTA keeps the Apple-crisp emerald because task #59 locked
 * it — green reads well on navy and we don't want to retest CTA lift
 * before the 11 May soft launch.
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
    <header className="hig-header-ink sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="hig-press flex items-center gap-2"
          aria-label="Tenu — home"
        >
          <TenuMark container="disc" size={28} title="Tenu" />
          <span className="t-wordmark text-xl">tenu</span>
        </Link>

        <nav className="flex items-center gap-2 md:gap-3">
          <LanguageToggle currentLocale={locale} chrome="dark" />

          <Link
            href="/pricing"
            className="hig-press hidden rounded-lg px-3 py-2 text-sm font-medium text-brand-paper/80 hover:bg-white/10 hover:text-brand-paper sm:inline-flex"
          >
            {nav.pricing ?? (uiLocale === "fr" ? "Tarifs" : "Pricing")}
          </Link>

          {isAuthed ? (
            <UserMenu email={email!} fullName={fullName} locale={uiLocale} />
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hig-press hidden rounded-lg px-3 py-2 text-sm font-medium text-brand-paper/80 hover:bg-white/10 hover:text-brand-paper sm:inline-flex"
              >
                {nav.login ?? (uiLocale === "fr" ? "Connexion" : "Log in")}
              </Link>
              <Link
                href="/auth/login"
                className="hig-press inline-flex h-9 items-center rounded-full bg-tenu-forest px-4 text-sm font-semibold text-white hover:bg-tenu-forest-light"
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
