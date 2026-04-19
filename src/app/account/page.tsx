import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { parseLocaleFromCookie, parseLocaleFromHeader } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import DeleteAccountButton from "./DeleteAccountButton";

/**
 * /account — minimal settings page.
 *
 * Shows what we hold on the user (email, name, preferred language,
 * consent status) and gives two primary actions: log out (via the
 * global UserMenu) and delete account (GDPR Art. 17).
 *
 * This page deliberately does NOT let the user edit email, password,
 * or identity fields yet — those flows are Supabase Auth-gated and
 * gated until post-soft-launch (11 May). We only surface read state
 * and the erasure action because that is the regulatory floor.
 */

const COPY = {
  fr: {
    title: "Mon compte",
    subtitle: "Informations et gestion de votre compte Tenu.",
    identity: "Identité",
    email: "Email",
    fullName: "Nom",
    notProvided: "Non renseigné",
    preferredLanguage: "Langue préférée",
    country: "Pays",
    createdAt: "Compte créé le",
    consents: "Consentements",
    consentsEmpty: "Aucun consentement enregistré.",
    consentDpa: "Acceptation des CGU / Politique de confidentialité",
    consentWaiver: "Renonciation au droit de rétractation (L221-28)",
    consentMarketing: "Communications marketing",
    consentCookies: "Cookies non-essentiels",
    consentGranted: "Accepté",
    consentWithdrawn: "Retiré",
    consentNever: "Jamais accepté",
    dangerZone: "Suppression du compte",
    dangerCopy:
      "Conformément à l'article 17 du RGPD, vous pouvez demander la suppression définitive de votre compte et de toutes les données associées. Cette action est irréversible.",
  },
  en: {
    title: "My account",
    subtitle: "Information and management of your Tenu account.",
    identity: "Identity",
    email: "Email",
    fullName: "Name",
    notProvided: "Not provided",
    preferredLanguage: "Preferred language",
    country: "Country",
    createdAt: "Account created",
    consents: "Consents",
    consentsEmpty: "No consent records.",
    consentDpa: "Terms and Privacy Policy acceptance",
    consentWaiver: "Waiver of withdrawal right (L221-28)",
    consentMarketing: "Marketing communications",
    consentCookies: "Non-essential cookies",
    consentGranted: "Granted",
    consentWithdrawn: "Withdrawn",
    consentNever: "Never given",
    dangerZone: "Delete account",
    dangerCopy:
      "Under GDPR Article 17, you may request permanent deletion of your account and all associated data. This action is irreversible.",
  },
} as const;

async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("locale")?.value;
  return cookieLocale
    ? parseLocaleFromCookie(cookieLocale)
    : parseLocaleFromHeader(headerStore.get("accept-language") ?? undefined);
}

type ConsentRow = {
  consent_type: string;
  created_at: string;
  checkbox_checked: boolean;
};

// Widened copy type: both locales share shape but differ in literals
// under `as const`. Widening lets helper fns accept either.
type CopyShape = { [K in keyof (typeof COPY)["fr"]]: string };

function pickLatest(
  rows: ConsentRow[],
  type: string,
): ConsentRow | null {
  return rows.find((r) => r.consent_type === type) ?? null;
}

function consentLabel(
  row: ConsentRow | null,
  t: CopyShape,
): string {
  if (!row) return t.consentNever;
  return row.checkbox_checked ? t.consentGranted : t.consentWithdrawn;
}

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const locale = await getLocale();
  const uiLocale: "fr" | "en" = locale === "en" ? "en" : "fr";
  const t = COPY[uiLocale];

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/auth/login?redirect=/account");
  }
  const user = userData.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_language, country, created_at")
    .eq("id", user.id)
    .maybeSingle();

  // Pull consents ordered newest-first so pickLatest gives current state.
  const { data: consentsData } = await supabase
    .from("consents")
    .select("consent_type, created_at, checkbox_checked")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const consents = (consentsData ?? []) as ConsentRow[];

  const dpa = pickLatest(consents, "dpa_acceptance");
  const waiver = pickLatest(consents, "withdrawal_waiver_l221_28");
  const marketing = pickLatest(consents, "marketing_optin");
  const cookiesConsent = pickLatest(consents, "cookies_nonessential");

  const createdAt = profile?.created_at
    ? new Date(profile.created_at as string).toLocaleDateString(
        uiLocale === "fr" ? "fr-FR" : "en-GB",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "—";

  const preferredLanguage =
    (profile?.preferred_language as string | undefined) ?? uiLocale;
  const country = (profile?.country as string | undefined) ?? "FR";
  const fullName = (profile?.full_name as string | undefined)?.trim() || null;

  return (
    <main className="hig-fade-in mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-tenu-forest md:text-4xl">
          {t.title}
        </h1>
        <p className="mt-2 text-sm text-tenu-slate/70">{t.subtitle}</p>
      </header>

      <section className="hig-card mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-tenu-slate/60">
          {t.identity}
        </h2>
        <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-3">
          <dt className="text-tenu-slate/60">{t.email}</dt>
          <dd className="sm:col-span-2 font-medium text-tenu-slate">
            {user.email}
          </dd>

          <dt className="text-tenu-slate/60">{t.fullName}</dt>
          <dd className="sm:col-span-2 text-tenu-slate">
            {fullName ?? (
              <span className="italic text-tenu-slate/50">
                {t.notProvided}
              </span>
            )}
          </dd>

          <dt className="text-tenu-slate/60">{t.preferredLanguage}</dt>
          <dd className="sm:col-span-2 text-tenu-slate uppercase">
            {preferredLanguage}
          </dd>

          <dt className="text-tenu-slate/60">{t.country}</dt>
          <dd className="sm:col-span-2 text-tenu-slate">{country}</dd>

          <dt className="text-tenu-slate/60">{t.createdAt}</dt>
          <dd className="sm:col-span-2 text-tenu-slate">{createdAt}</dd>
        </dl>
      </section>

      <section className="hig-card mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-tenu-slate/60">
          {t.consents}
        </h2>
        {consents.length === 0 ? (
          <p className="text-sm italic text-tenu-slate/60">
            {t.consentsEmpty}
          </p>
        ) : (
          <ul className="divide-y divide-tenu-cream-dark/60">
            <ConsentRowItem
              label={t.consentDpa}
              row={dpa}
              t={t}
              uiLocale={uiLocale}
            />
            <ConsentRowItem
              label={t.consentWaiver}
              row={waiver}
              t={t}
              uiLocale={uiLocale}
            />
            <ConsentRowItem
              label={t.consentMarketing}
              row={marketing}
              t={t}
              uiLocale={uiLocale}
            />
            <ConsentRowItem
              label={t.consentCookies}
              row={cookiesConsent}
              t={t}
              uiLocale={uiLocale}
            />
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-tenu-danger/30 bg-red-50/40 p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-tenu-danger">
          {t.dangerZone}
        </h2>
        <p className="mb-4 text-sm text-tenu-slate/80">{t.dangerCopy}</p>
        <DeleteAccountButton email={user.email ?? ""} locale={uiLocale} />
      </section>
    </main>
  );
}

function ConsentRowItem({
  label,
  row,
  t,
  uiLocale,
}: {
  label: string;
  row: ConsentRow | null;
  t: CopyShape;
  uiLocale: "fr" | "en";
}) {
  const status = consentLabel(row, t);
  const when = row?.created_at
    ? new Date(row.created_at).toLocaleDateString(
        uiLocale === "fr" ? "fr-FR" : "en-GB",
        { year: "numeric", month: "short", day: "numeric" },
      )
    : null;
  const granted = !!row?.checkbox_checked;
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-tenu-slate">{label}</span>
      <span className="text-right">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            row
              ? granted
                ? "bg-tenu-success/10 text-tenu-success"
                : "bg-tenu-warning/10 text-tenu-warning"
              : "bg-tenu-slate/10 text-tenu-slate/60"
          }`}
        >
          {status}
        </span>
        {when && (
          <span className="ml-2 text-xs text-tenu-slate/50">{when}</span>
        )}
      </span>
    </li>
  );
}
