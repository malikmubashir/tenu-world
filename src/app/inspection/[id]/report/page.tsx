"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ProgressStepper from "@/components/ui/ProgressStepper";
import { clsx } from "clsx";

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

    // load dispute letter if exists
    const { data: disputes } = await supabase
      .from("disputes")
      .select("letter_body")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (disputes && disputes.length > 0) {
      setDisputeLetter(disputes[0].letter_body);
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
              ) : (
                <div className="text-center">
                  <p className="mb-3 text-sm text-tenu-slate/60">
                    Unlock a legally-informed dispute letter tailored to
                    your jurisdiction.
                  </p>
                  <Link
                    href={`/pricing?inspectionId=${inspectionId}&product=dispute`}
                    className="inline-block rounded-lg bg-tenu-forest px-6 py-3 text-sm font-medium text-white hover:bg-tenu-forest-light"
                  >
                    Purchase Dispute Letter — €20
                  </Link>
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
