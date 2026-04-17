"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DPA_COPY,
  DPA_TEXT_VERSION,
  MARKETING_COPY,
  MARKETING_TEXT_VERSION,
  type Locale,
} from "@/lib/legal/consents";

/**
 * Defensive DPA gate. Reached only when the signup consent cookie
 * was lost (cross-device magic link, ad-blocker purging cookies,
 * server-side callback re-entry). The session is already valid —
 * we just cannot let the user keep using Tenu without a recorded
 * acceptance of the Terms and Privacy Policy.
 */
export default function AcceptTermsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/inspection/new";

  const locale: Locale = "fr"; // FR-only launch
  const dpaCopy = DPA_COPY[locale];
  const marketingCopy = MARKETING_COPY[locale];

  const [dpa, setDpa] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!dpa) return;
    setLoading(true);
    setError("");

    try {
      // Record DPA — required.
      const dpaRes = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "dpa_acceptance",
          locale,
          granted: true,
        }),
      });
      if (!dpaRes.ok) {
        const data = await dpaRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record acceptance");
      }

      // Record marketing decision (true or false — both auditable).
      await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "marketing_optin",
          locale,
          granted: marketing,
        }),
      });

      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tenu-cream px-4 py-10">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-bold text-tenu-forest">
          Derniere étape
        </h1>
        <p className="mb-6 text-sm text-tenu-slate/70">
          Pour finaliser la création de votre compte, confirmez votre
          acceptation de nos conditions.
        </p>

        <div className="mb-4 rounded-lg border border-tenu-cream-dark bg-tenu-cream/40 p-3 text-sm text-tenu-slate">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-tenu-forest"
              checked={dpa}
              onChange={(e) => setDpa(e.target.checked)}
              required
              data-dpa-version={DPA_TEXT_VERSION}
            />
            <span className="leading-snug">
              J&apos;accepte les{" "}
              <Link
                href="/legal/terms/fr"
                target="_blank"
                rel="noopener"
                className="text-tenu-forest underline hover:no-underline"
              >
                Conditions d&apos;utilisation
              </Link>{" "}
              et la{" "}
              <Link
                href="/legal/privacy/fr"
                target="_blank"
                rel="noopener"
                className="text-tenu-forest underline hover:no-underline"
              >
                Politique de confidentialité
              </Link>{" "}
              de Tenu.
              <span className="mt-0.5 block text-xs text-tenu-slate/60">
                {dpaCopy.required}
              </span>
            </span>
          </label>

          <label className="mt-3 flex cursor-pointer items-start gap-3 border-t border-tenu-cream-dark pt-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-tenu-forest"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              data-marketing-version={MARKETING_TEXT_VERSION}
            />
            <span className="leading-snug">
              {marketingCopy.label}
              <span className="mt-0.5 block text-xs text-tenu-slate/60">
                {marketingCopy.hint}
              </span>
            </span>
          </label>
        </div>

        {error && <p className="mb-3 text-sm text-tenu-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={!dpa || loading}
          className="w-full rounded-lg bg-tenu-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Continuer"}
        </button>
      </div>
    </div>
  );
}
