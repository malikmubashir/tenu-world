import { cookies, headers } from "next/headers";
import Link from "next/link";
import { Shield, Camera, BookOpen, Brain, FileText, Bell } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import LanguageToggle from "@/components/ui/LanguageToggle";

async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  return cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
}

export default async function Home() {
  const locale = await getLocale();
  const t = await getDictionary(locale) as Record<string, Record<string, Record<string, string> | string>>;

  const hero = t.hero as Record<string, string>;
  const features = t.features as Record<string, Record<string, string> | string>;
  const nav = t.nav as Record<string, string>;

  const featureList = [
    { key: "onboarding", icon: Shield },
    { key: "evidence", icon: Camera },
    { key: "rights", icon: BookOpen },
    { key: "scan", icon: Brain },
    { key: "dispute", icon: FileText },
    { key: "followup", icon: Bell },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="text-2xl font-bold text-tenu-forest">
          tenu
        </Link>
        <nav className="flex items-center gap-4">
          <LanguageToggle currentLocale={locale} />
          <Link
            href="/pricing"
            className="text-sm font-medium text-tenu-slate hover:text-tenu-forest"
          >
            {nav.pricing}
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-medium text-tenu-slate hover:text-tenu-forest"
          >
            {nav.login}
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg bg-tenu-forest px-4 py-2 text-sm font-medium text-white hover:bg-tenu-forest-light"
          >
            {nav.signup}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center px-6 py-20 text-center md:py-32">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-tenu-forest md:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-tenu-slate/80 md:text-xl">
            {hero.subtitle}
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              href="/inspection/new"
              className="rounded-lg bg-tenu-forest px-6 py-3 text-base font-medium text-white hover:bg-tenu-forest-light"
            >
              {hero.cta}
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-tenu-forest/20 px-6 py-3 text-base font-medium text-tenu-forest hover:bg-tenu-forest/5"
            >
              {hero.ctaSecondary}
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-white px-6 py-20 md:px-12">
          <h2 className="mb-12 text-center text-3xl font-bold text-tenu-forest">
            {features.heading as string}
          </h2>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featureList.map(({ key, icon: Icon }) => {
              const feat = features[key] as Record<string, string>;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-tenu-cream-dark p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-tenu-forest/10">
                    <Icon className="h-6 w-6 text-tenu-forest" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-tenu-forest">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-tenu-slate/70">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-tenu-cream-dark px-6 py-8 text-center text-sm text-tenu-slate/60">
        &copy; {new Date().getFullYear()} Global Apex NET (SAS, France). tenu.world
      </footer>
    </div>
  );
}
