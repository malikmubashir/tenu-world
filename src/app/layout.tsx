import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getDirection } from "@/lib/i18n/config";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenu — Your Rights. Your Language. Your Deposit.",
  description:
    "AI-powered tenant rights companion for international renters in France and the UK.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://tenu.world"),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get("locale")?.value;
  const locale = cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);

  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-tenu-cream text-tenu-slate antialiased">
        {children}
      </body>
    </html>
  );
}
