"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, FileText, Check } from "lucide-react";
import { clsx } from "clsx";

const plans = [
  {
    id: "scan" as const,
    name: "AI Risk Scan",
    price: "€15",
    icon: Shield,
    description: "Know your risks before moving out",
    features: [
      "AI photo analysis of every room",
      "Risk score per room (low / medium / high)",
      "Estimated deduction amounts",
      "Downloadable PDF report",
      "Results in under 2 minutes",
    ],
  },
  {
    id: "dispute" as const,
    name: "Dispute Letter",
    price: "€20",
    icon: FileText,
    description: "Fight unfair deductions with legal backing",
    features: [
      "Everything in AI Risk Scan",
      "Formal dispute letter (FR or UK law)",
      "Plain-language explanation",
      "Jurisdiction-specific legal references",
      "Ready to send to your landlord",
    ],
    popular: true,
  },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const inspectionId = searchParams.get("inspectionId");
  const preselected = searchParams.get("product");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handlePurchase(product: "scan" | "dispute") {
    if (!inspectionId) {
      setError("No inspection selected. Start a new inspection first.");
      return;
    }

    setLoading(product);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          inspectionId,
          successUrl: `${window.location.origin}/inspection/${inspectionId}/report?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?inspectionId=${inspectionId}&cancelled=true`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      // redirect to Stripe
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-tenu-cream">
      <header className="border-b border-tenu-cream-dark bg-white px-6 py-4">
        <Link href="/" className="text-xl font-bold text-tenu-forest">
          tenu
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-tenu-forest">
            Protect your deposit
          </h1>
          <p className="mt-2 text-tenu-slate/70">
            AI-powered inspection reports that give you the evidence to fight
            unfair deductions.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={clsx(
                "relative flex flex-col rounded-2xl border bg-white p-6",
                plan.popular
                  ? "border-tenu-forest shadow-lg"
                  : "border-tenu-cream-dark",
                preselected === plan.id && "ring-2 ring-tenu-forest",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-tenu-forest px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}

              <div className="mb-4 flex items-center gap-3">
                <plan.icon className="h-6 w-6 text-tenu-forest" />
                <h2 className="text-lg font-semibold text-tenu-forest">
                  {plan.name}
                </h2>
              </div>

              <p className="mb-4 text-sm text-tenu-slate/70">
                {plan.description}
              </p>

              <p className="mb-6 text-3xl font-bold text-tenu-forest">
                {plan.price}
                <span className="text-sm font-normal text-tenu-slate/50">
                  {" "}
                  / inspection
                </span>
              </p>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-tenu-slate"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-tenu-forest" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(plan.id)}
                disabled={loading !== null}
                className={clsx(
                  "w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50",
                  plan.popular
                    ? "bg-tenu-forest text-white hover:bg-tenu-forest-light"
                    : "border border-tenu-forest text-tenu-forest hover:bg-tenu-forest hover:text-white",
                )}
              >
                {loading === plan.id ? "Redirecting..." : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-6 text-center text-sm text-tenu-danger">{error}</p>
        )}

        {!inspectionId && (
          <div className="mt-8 text-center">
            <Link
              href="/inspection/new"
              className="text-sm text-tenu-forest underline hover:no-underline"
            >
              Start a new inspection first
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
