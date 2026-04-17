"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Check } from "lucide-react";
import { clsx } from "clsx";
import WithdrawalWaiver, {
  type WaiverState,
} from "@/components/legal/WithdrawalWaiver";
import { WAIVER_TEXT_VERSION } from "@/lib/legal/withdrawal-waiver";

// Pricing page — pre-scan. Only the scan is sold here.
// The dispute letter is a post-scan add-on (verdict-gated) and is
// purchased from the report page once the scan output is known.
// Selling a combo pre-scan would charge users for a letter that may
// fail the eligibility gate after the scan runs.

// Shape mirrored from /api/checkout GET (calculatePrice output).
// We don't import the type from lib/payments/stripe.ts because this is
// a client bundle and that module is server-only (Stripe SDK inside).
interface PricePreview {
  tier: "t1" | "t2" | "t3" | "t4" | "t5_maison";
  tierLabel: string;
  principalRoomCount: number;
  serviceRoomCount: number;
  partiePrivativeCount: number;
  totalReportPrice: number;
  disputeLetterPrice: number;
  exitOnlyPrice: number;
  currency: string;
}

const FALLBACK_PREVIEW: PricePreview = {
  tier: "t1",
  tierLabel: "Studio / T1",
  principalRoomCount: 1,
  serviceRoomCount: 0,
  partiePrivativeCount: 0,
  totalReportPrice: 1500,
  disputeLetterPrice: 2000,
  exitOnlyPrice: 2500,
  currency: "eur",
};

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  if (currency === "gbp") return `£${amount.toFixed(0)}`;
  return `€${amount.toFixed(0)}`;
}

export default function PricingPage() {
  const searchParams = useSearchParams();
  const inspectionId = searchParams.get("inspectionId");
  const locale: "fr" | "en" =
    searchParams.get("locale") === "en" ? "en" : "fr";

  const [preview, setPreview] = useState<PricePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(Boolean(inspectionId));
  const [previewError, setPreviewError] = useState("");

  const [waiverOpen, setWaiverOpen] = useState(false);
  const [waiver, setWaiver] = useState<WaiverState>({
    priorConsent: false,
    waiver: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const waiverReady = waiver.priorConsent && waiver.waiver;

  // Fetch the live tier/price from the server the moment we have an
  // inspectionId. Server is the single source of truth — we never let
  // the client guess the tier from URL params.
  useEffect(() => {
    if (!inspectionId) {
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout?inspectionId=${encodeURIComponent(inspectionId)}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setPreviewError(data.error ?? "Unable to load pricing");
          setPreview(FALLBACK_PREVIEW);
        } else if (data.pricing) {
          setPreview(data.pricing as PricePreview);
        } else {
          setPreview(FALLBACK_PREVIEW);
        }
      } catch {
        if (!cancelled) {
          setPreviewError("Network error");
          setPreview(FALLBACK_PREVIEW);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inspectionId]);

  async function proceedToPayment() {
    if (!inspectionId) {
      setError("No inspection selected. Start a new inspection first.");
      return;
    }
    if (!waiverReady) {
      setError(
        locale === "fr"
          ? "Les deux cases de renonciation doivent être cochées."
          : "Both waiver boxes must be ticked.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "report",
          inspectionId,
          successUrl: `${window.location.origin}/inspection/${inspectionId}/report?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?inspectionId=${inspectionId}&cancelled=true`,
          waiverConsent: {
            priorConsent: waiver.priorConsent,
            waiver: waiver.waiver,
            locale,
            textVersion: WAIVER_TEXT_VERSION,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  // What the user sees for price + tier.
  // If we failed to fetch, we fall back to the T1 baseline so the page
  // isn't empty, but we also surface the error so the user knows.
  const activePreview = preview ?? FALLBACK_PREVIEW;
  const priceLabel = formatPrice(activePreview.totalReportPrice, activePreview.currency);
  const disputeLabel = formatPrice(activePreview.disputeLetterPrice, activePreview.currency);

  const features: string[] =
    locale === "fr"
      ? [
          "Analyse IA de chaque pièce principale, service et annexe",
          "Estimation des retenues équitables (grille vétusté française)",
          "Dossier photo horodaté et conservé pour preuve",
          "Rapport PDF téléchargeable",
          "Résultats en moins de 2 minutes",
        ]
      : [
          "AI photo analysis of every principal, service and annexe room",
          "Fair-deduction estimate per room (French vétusté grid)",
          "Timestamped photo evidence pack for your records",
          "Downloadable PDF report",
          "Results in under 2 minutes",
        ];

  return (
    <div className="min-h-screen bg-tenu-cream">
      <header className="border-b border-tenu-cream-dark bg-white px-6 py-4">
        <Link href="/" className="text-xl font-bold text-tenu-forest">
          tenu
        </Link>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-tenu-forest">
            {locale === "fr" ? "Protégez votre dépôt" : "Protect your deposit"}
          </h1>
          <p className="mt-2 text-tenu-slate/70">
            {locale === "fr"
              ? "Rapport IA d'état des lieux pour anticiper les retenues avant la sortie."
              : "AI inspection report to anticipate deductions before you hand back the keys."}
          </p>
          <p className="mt-3 text-xs text-tenu-slate/60">
            {locale === "fr"
              ? `La lettre de contestation (${disputeLabel}) se commande après le scan, selon le verdict.`
              : `The dispute letter (${disputeLabel}) is ordered after the scan, based on the verdict.`}
          </p>
        </div>

        <div className="grid gap-6">
          <div
            className={clsx(
              "relative flex flex-col rounded-2xl border border-tenu-forest bg-white p-6 shadow-lg",
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-tenu-forest" />
                <h2 className="text-lg font-semibold text-tenu-forest">
                  {locale === "fr" ? "Scan risque IA" : "AI Risk Scan"}
                </h2>
              </div>
              {!previewLoading && (
                <span className="rounded-full border border-tenu-forest/30 bg-tenu-cream px-3 py-1 text-xs font-medium text-tenu-forest">
                  {activePreview.tierLabel}
                </span>
              )}
            </div>

            <p className="mb-4 text-sm text-tenu-slate/70">
              {locale === "fr"
                ? "Connaissez le risque sur votre dépôt avant de signer l'état des lieux de sortie."
                : "Know your deposit risk before the landlord signs the exit EDL."}
            </p>

            <p className="mb-2 text-3xl font-bold text-tenu-forest">
              {previewLoading ? "…" : priceLabel}
              <span className="text-sm font-normal text-tenu-slate/50">
                {" "}
                {locale === "fr" ? "TTC" : "inc. VAT"}
              </span>
            </p>

            {!previewLoading && (
              <p className="mb-6 text-xs text-tenu-slate/60">
                {locale === "fr"
                  ? `${activePreview.principalRoomCount} pièce${activePreview.principalRoomCount > 1 ? "s" : ""} principale${activePreview.principalRoomCount > 1 ? "s" : ""}`
                  : `${activePreview.principalRoomCount} principal room${activePreview.principalRoomCount > 1 ? "s" : ""}`}
                {activePreview.serviceRoomCount > 0 && (
                  <>
                    {" · "}
                    {activePreview.serviceRoomCount}{" "}
                    {locale === "fr"
                      ? `de service`
                      : `service`}
                  </>
                )}
                {activePreview.partiePrivativeCount > 0 && (
                  <>
                    {" · "}
                    {activePreview.partiePrivativeCount}{" "}
                    {locale === "fr" ? "annexe" : "annexe"}
                    {activePreview.partiePrivativeCount > 1 ? "s" : ""}
                  </>
                )}
              </p>
            )}

            <ul className="mb-6 flex-1 space-y-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-tenu-slate"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-tenu-forest" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="mb-4 text-xs text-tenu-slate/60">
              {locale === "fr"
                ? "Colocation : chaque colocataire achète son scan au tarif du logement. Un couple partageant le même bail = un seul tenant."
                : "Colocation: each housemate buys a scan at the flat's tier. A couple sharing one tenancy counts as one tenant."}
            </p>

            {!waiverOpen ? (
              <button
                onClick={() => {
                  setWaiverOpen(true);
                  setWaiver({ priorConsent: false, waiver: false });
                  setError("");
                }}
                disabled={loading || previewLoading || !inspectionId}
                className="w-full rounded-lg bg-tenu-forest px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-tenu-forest-light disabled:opacity-50"
              >
                {locale === "fr"
                  ? `Lancer mon scan — ${priceLabel}`
                  : `Run my scan — ${priceLabel}`}
              </button>
            ) : (
              <div className="space-y-3">
                <WithdrawalWaiver
                  locale={locale}
                  value={waiver}
                  onChange={setWaiver}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setWaiverOpen(false)}
                    className="flex-1 rounded-lg border border-tenu-cream-dark px-4 py-3 text-sm font-medium text-tenu-slate hover:bg-tenu-cream"
                  >
                    {locale === "fr" ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    onClick={proceedToPayment}
                    disabled={!waiverReady || loading}
                    className="flex-[2] rounded-lg bg-tenu-forest px-4 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? locale === "fr"
                        ? "Redirection…"
                        : "Redirecting…"
                      : locale === "fr"
                        ? `Payer ${priceLabel}`
                        : `Pay ${priceLabel}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {previewError && (
          <p className="mt-6 text-center text-xs text-tenu-danger">
            {previewError}
          </p>
        )}

        {error && (
          <p className="mt-6 text-center text-sm text-tenu-danger">{error}</p>
        )}

        {!inspectionId && (
          <div className="mt-8 text-center">
            <Link
              href="/inspection/new"
              className="text-sm text-tenu-forest underline hover:no-underline"
            >
              {locale === "fr"
                ? "Commencez par créer une inspection"
                : "Start a new inspection first"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
