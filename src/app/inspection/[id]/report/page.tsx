"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ProgressStepper from "@/components/ui/ProgressStepper";
import { clsx } from "clsx";
import type { DisputeEligibility } from "@/lib/ai/dispute-eligibility";
import WithdrawalWaiver, {
  type WaiverState,
} from "@/components/legal/WithdrawalWaiver";
import { WAIVER_TEXT_VERSION } from "@/lib/legal/withdrawal-waiver";

const steps = [
  { key: "details", label: "Details" },
  { key: "capture", label: "Capture" },
  { key: "review", label: "Review" },
  { key: "report", label: "Report" },
];

interface RoomWithRisk {
  id: string;
  room_type: string;
  label: string | null;
  risk_level: string | null;
  risk_score: number | null;
  risk_notes: { issues?: { area: string; severity: string; description: string }[]; summary?: string } | null;
  estimated_deduction_eur: number | null;
}

interface Inspection {
  id: string;
  address: string;
  jurisdiction: string;
  status: string;
  dispute_purchased: boolean;
}

export default function ReportPage() {
  const params = useParams();
  const inspectionId = params.id as string;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [rooms, setRooms] = useState<RoomWithRisk[]>([]);
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [disputeLetter, setDisputeLetter] = useState<string | null>(null);
  const [disputeEligibility, setDisputeEligibility] =
    useState<DisputeEligibility | null>(null);
  const [purchasingDispute, setPurchasingDispute] = useState(false);
  const [disputeWaiverOpen, setDisputeWaiverOpen] = useState(false);
  const [disputeWaiver, setDisputeWaiver] = useState<WaiverState>({
    priorConsent: false,
    waiver: false,
  });
  // Locale for the FR/EN copy on the waiver surface. Report UI is
  // English-first; swap to "fr" when we wire the locale switcher.
  const disputeLocale: "fr" | "en" = "fr";

  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    const { data: insp } = await supabase
      .from("inspections")
      .select("id, address, jurisdiction, status, dispute_purchased")
      .eq("id", inspectionId)
      .single();

    if (insp) setInspection(insp as Inspection);

    const { data: roomData } = await supabase
      .from("rooms")
      .select(
        "id, room_type, label, risk_level, risk_score, risk_notes, estimated_deduction_eur",
      )
      .eq("inspection_id", inspectionId)
      .order("sort_order");

    if (roomData) setRooms(roomData as RoomWithRisk[]);

    // Load dispute letter if one has been generated.
    // Table name + column name align with schema.sql (was drifting against
    // the retired `disputes` table + `letter_body` column before 2026-04-18).
    const { data: disputeLetters } = await supabase
      .from("dispute_letters")
      .select("letter_content")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (disputeLetters && disputeLetters.length > 0) {
      setDisputeLetter(disputeLetters[0].letter_content);
    }

    // Fetch dispute eligibility. Ignore failures — UI falls back to
    // the conservative "no dispute CTA" state.
    try {
      const elRes = await fetch(
        `/api/dispute/eligibility?inspectionId=${inspectionId}`,
      );
      if (elRes.ok) {
        setDisputeEligibility((await elRes.json()) as DisputeEligibility);
      }
    } catch {
      setDisputeEligibility(null);
    }
  }, [inspectionId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function triggerScan() {
    setScanning(true);
    setError("");
    try {
      const res = await fetch("/api/ai/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function purchaseDispute() {
    const waiverReady =
      disputeWaiver.priorConsent && disputeWaiver.waiver;
    if (!waiverReady) {
      setError(
        disputeLocale === "fr"
          ? "Les deux cases de renonciation doivent être cochées."
          : "Both waiver boxes must be ticked.",
      );
      return;
    }

    setPurchasingDispute(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "dispute",
          inspectionId,
          successUrl: `${window.location.origin}/inspection/${inspectionId}/report?dispute_payment=success`,
          cancelUrl: `${window.location.origin}/inspection/${inspectionId}/report?dispute_cancelled=true`,
          waiverConsent: {
            priorConsent: disputeWaiver.priorConsent,
            waiver: disputeWaiver.waiver,
            locale: disputeLocale,
            textVersion: WAIVER_TEXT_VERSION,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Server-side eligibility gate will surface reason + localised message.
        throw new Error(
          data.message_fr ?? data.message_en ?? data.error ?? "Checkout failed",
        );
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPurchasingDispute(false);
    }
  }

  async function generateDispute() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDisputeLetter(data.letter.letterBody);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadReport() {
    const res = await fetch(`/api/ai/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionId, format: "html" }),
    });
    if (res.ok) {
      // Open print dialog for PDF export
      const w = window.open("", "_blank");
      if (w) {
        const html = await generateReportLocally();
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 500);
      }
    }
  }

  function generateReportLocally(): string {
    const totalDeduction = rooms.reduce(
      (sum, r) => sum + (r.estimated_deduction_eur ?? 0),
      0,
    );

    return `<!DOCTYPE html><html><head><title>Tenu Report</title>
<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px;}</style>
</head><body>
<h1 style="color:#1B4D3E">Tenu Inspection Report</h1>
<p><strong>Address:</strong> ${inspection?.address ?? ""}</p>
<p><strong>Total Estimated Deduction:</strong> €${totalDeduction.toFixed(2)}</p>
<hr>
${rooms
  .map(
    (r) => `
<h3>${r.label ?? r.room_type} — ${(r.risk_level ?? "pending").toUpperCase()}</h3>
<p>Score: ${r.risk_score != null ? (r.risk_score * 100).toFixed(0) + "%" : "N/A"} | Deduction: €${(r.estimated_deduction_eur ?? 0).toFixed(2)}</p>
<p>${r.risk_notes?.summary ?? "Awaiting scan"}</p>`,
  )
  .join("")}
${disputeLetter ? `<hr><h2>Dispute Letter</h2><pre style="white-space:pre-wrap;font-family:serif;">${disputeLetter}</pre>` : ""}
<footer style="margin-top:40px;color:#999;font-size:12px;">Generated by Tenu.World</footer>
</body></html>`;
  }

  const isScanned = inspection?.status === "scanned" || inspection?.status === "disputed";
  const totalDeduction = rooms.reduce(
    (sum, r) => sum + (r.estimated_deduction_eur ?? 0),
    0,
  );

  const riskColorMap: Record<string, string> = {
    low: "text-green-600 bg-green-50",
    medium: "text-amber-600 bg-amber-50",
    high: "text-red-600 bg-red-50",
  };

  return (
    <div className="min-h-screen bg-tenu-cream">
      <header className="flex items-center justify-between border-b border-tenu-cream-dark bg-white px-6 py-4">
        <Link href="/" className="text-xl font-bold text-tenu-forest">
          tenu
        </Link>
        <ProgressStepper steps={steps} currentStep="report" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold text-tenu-forest">
          Inspection Report
        </h1>
        <p className="mb-6 text-sm text-tenu-slate/70">
          {inspection?.address ?? "Loading..."}
        </p>

        {/* Scan trigger or results */}
        {!isScanned && inspection?.status === "submitted" && (
          <div className="mb-8 rounded-xl border border-tenu-cream-dark bg-white p-6 text-center">
            <p className="mb-4 text-sm text-tenu-slate">
              Your photos are ready for AI analysis.
            </p>
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="rounded-lg bg-tenu-forest px-6 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:opacity-50"
            >
              {scanning ? "Scanning..." : "Run AI Risk Scan"}
            </button>
          </div>
        )}

        {isScanned && (
          <>
            {/* Summary card */}
            <div className="mb-6 rounded-xl border border-tenu-cream-dark bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tenu-slate/60">
                    Overall Risk
                  </p>
                  <span
                    className={clsx(
                      "mt-1 inline-block rounded-lg px-3 py-1 text-sm font-semibold",
                      riskColorMap[
                        rooms.reduce(
                          (max, r) =>
                            (r.risk_score ?? 0) > (max.risk_score ?? 0) ? r : max,
                          rooms[0],
                        )?.risk_level ?? "low"
                      ] ?? "text-green-600 bg-green-50",
                    )}
                  >
                    {(
                      rooms.reduce(
                        (max, r) =>
                          (r.risk_score ?? 0) > (max.risk_score ?? 0) ? r : max,
                        rooms[0],
                      )?.risk_level ?? "low"
                    ).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-tenu-slate/60">
                    Est. Total Deduction
                  </p>
                  <p className="mt-1 text-2xl font-bold text-tenu-forest">
                    €{totalDeduction.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Room breakdown */}
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-xl border border-tenu-cream-dark bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-tenu-forest">
                      {room.label ?? room.room_type}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span
                        className={clsx(
                          "rounded px-2 py-0.5 text-xs font-semibold",
                          riskColorMap[room.risk_level ?? "low"] ??
                            "text-green-600 bg-green-50",
                        )}
                      >
                        {(room.risk_level ?? "low").toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-tenu-slate">
                        €{(room.estimated_deduction_eur ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {room.risk_notes?.summary && (
                    <p className="mt-2 text-sm text-tenu-slate/70">
                      {room.risk_notes.summary}
                    </p>
                  )}
                  {room.risk_notes?.issues && room.risk_notes.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {room.risk_notes.issues.map((issue, i) => (
                        <p key={i} className="text-xs text-tenu-slate/60">
                          <span className="font-medium">{issue.area}</span>{" "}
                          ({issue.severity}): {issue.description}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Dispute letter section */}
            <div className="mt-8 rounded-xl border border-tenu-cream-dark bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold text-tenu-forest">
                Dispute Letter
              </h2>
              {disputeLetter ? (
                <div className="whitespace-pre-wrap rounded-lg bg-tenu-cream/50 p-4 font-serif text-sm leading-relaxed text-tenu-slate">
                  {disputeLetter}
                </div>
              ) : inspection?.dispute_purchased ? (
                <div className="text-center">
                  <button
                    onClick={generateDispute}
                    disabled={generating}
                    className="rounded-lg bg-tenu-forest px-6 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:opacity-50"
                  >
                    {generating
                      ? "Generating..."
                      : "Generate Dispute Letter"}
                  </button>
                </div>
              ) : disputeEligibility && !disputeEligibility.eligible ? (
                // Scan ran but the verdict doesn't support a letter.
                // Show the reason instead of the upsell so we don't sell
                // an add-on that will fail at generation time.
                <div className="rounded-lg border border-tenu-cream-dark bg-tenu-cream/40 p-4 text-center">
                  <p className="text-sm font-medium text-tenu-slate">
                    {disputeLocale === "fr"
                      ? disputeEligibility.message_fr
                      : disputeEligibility.message_en}
                  </p>
                  {disputeEligibility.reason === "INSUFFICIENT_EVIDENCE" && (
                    <Link
                      href={`/inspection/${inspectionId}/capture`}
                      className="mt-3 inline-block text-sm text-tenu-forest underline hover:no-underline"
                    >
                      {disputeLocale === "fr"
                        ? "Ajouter des photos"
                        : "Add more photos"}
                    </Link>
                  )}
                </div>
              ) : !disputeWaiverOpen ? (
                <div className="text-center">
                  <p className="mb-3 text-sm text-tenu-slate/60">
                    Unlock a legally-informed dispute letter tailored to
                    your jurisdiction.
                  </p>
                  {disputeEligibility?.eligible &&
                    disputeEligibility.refundable_eur != null && (
                      <p className="mb-3 text-xs text-tenu-slate/70">
                        {disputeLocale === "fr"
                          ? `Potentiel à récupérer selon notre analyse : ~€${disputeEligibility.refundable_eur.toFixed(0)}`
                          : `Potential recovery per our analysis: ~€${disputeEligibility.refundable_eur.toFixed(0)}`}
                      </p>
                    )}
                  <button
                    onClick={() => {
                      setDisputeWaiverOpen(true);
                      setDisputeWaiver({
                        priorConsent: false,
                        waiver: false,
                      });
                      setError("");
                    }}
                    className="inline-block rounded-lg bg-tenu-forest px-6 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light"
                  >
                    Purchase Dispute Letter — €20
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <WithdrawalWaiver
                    locale={disputeLocale}
                    value={disputeWaiver}
                    onChange={setDisputeWaiver}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDisputeWaiverOpen(false);
                        setError("");
                      }}
                      disabled={purchasingDispute}
                      className="flex-1 rounded-lg border border-tenu-cream-dark px-4 py-3 text-sm font-medium text-tenu-slate hover:bg-tenu-cream disabled:opacity-50"
                    >
                      {disputeLocale === "fr" ? "Annuler" : "Cancel"}
                    </button>
                    <button
                      onClick={purchaseDispute}
                      disabled={
                        !disputeWaiver.priorConsent ||
                        !disputeWaiver.waiver ||
                        purchasingDispute
                      }
                      className="flex-[2] rounded-lg bg-tenu-forest px-4 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {purchasingDispute
                        ? disputeLocale === "fr"
                          ? "Redirection…"
                          : "Redirecting…"
                        : disputeLocale === "fr"
                          ? "Payer €20"
                          : "Pay €20"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Download */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={downloadReport}
                className="rounded-lg border border-tenu-forest px-6 py-2 text-sm font-medium text-tenu-forest hover:bg-tenu-forest hover:text-white"
              >
                Download Report (PDF)
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 text-center text-sm text-tenu-danger">{error}</p>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-tenu-slate/60 hover:text-tenu-forest"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
