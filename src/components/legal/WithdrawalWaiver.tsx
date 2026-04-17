"use client";

/**
 * WithdrawalWaiver — two-checkbox block required before any paid
 * transaction. Enforces art. L221-28 1° Code de la consommation.
 *
 * Usage:
 *   const [waiver, setWaiver] = useState({ priorConsent: false, waiver: false });
 *   ...
 *   <WithdrawalWaiver locale="fr" value={waiver} onChange={setWaiver} />
 *
 * The parent must NOT enable the "Pay" button unless waiver is
 * valid (both booleans true). Call isValidWaiverPayload() before
 * submitting to /api/checkout.
 *
 * Server-side validation is authoritative. This component is
 * presentation + UX gate only.
 */

import Link from "next/link";
import { WAIVER_COPY, WAIVER_TEXT_VERSION } from "@/lib/legal/withdrawal-waiver";

export interface WaiverState {
  priorConsent: boolean;
  waiver: boolean;
}

interface Props {
  locale: "fr" | "en";
  value: WaiverState;
  onChange: (next: WaiverState) => void;
  /** Optional: show the hint line under the boxes when ungated */
  showHint?: boolean;
}

export default function WithdrawalWaiver({
  locale,
  value,
  onChange,
  showHint = true,
}: Props) {
  const copy = WAIVER_COPY[locale];
  const refundHref = locale === "fr" ? "/legal/refund/fr" : "/legal/refund/en";
  const bothChecked = value.priorConsent && value.waiver;

  return (
    <div
      className="rounded-xl border border-tenu-cream-dark bg-tenu-cream/40 p-4 text-sm text-tenu-slate"
      data-waiver-version={WAIVER_TEXT_VERSION}
    >
      <p className="mb-3 leading-relaxed">{copy.intro}</p>

      <label className="mb-3 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-tenu-forest"
          checked={value.priorConsent}
          onChange={(e) =>
            onChange({ ...value, priorConsent: e.target.checked })
          }
          required
        />
        <span className="leading-snug">{copy.priorConsentLabel}</span>
      </label>

      <label className="mb-3 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-tenu-forest"
          checked={value.waiver}
          onChange={(e) => onChange({ ...value, waiver: e.target.checked })}
          required
        />
        <span className="leading-snug">{copy.waiverLabel}</span>
      </label>

      <div className="flex items-center justify-between pt-1">
        <Link
          href={refundHref}
          className="text-xs text-tenu-forest underline hover:no-underline"
          target="_blank"
          rel="noopener"
        >
          {copy.refundLinkLabel}
        </Link>
        {showHint && !bothChecked && (
          <span className="text-xs text-tenu-slate/60">{copy.hint}</span>
        )}
      </div>
    </div>
  );
}
