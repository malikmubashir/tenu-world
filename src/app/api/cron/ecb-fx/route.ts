/**
 * GET /api/cron/ecb-fx
 *
 * Fetches the latest EUR/GBP reference rate from the ECB SDMX 2.1 API and
 * upserts it into supabase.fx_rates. Invoked daily at 08:00 UTC by Vercel
 * cron (after ECB publishes ~16:00 CET the previous business day).
 *
 * Auth: CRON_SECRET header must match the env var of the same name.
 * Returns 200 on success, 304 if today's rate is already stored, 4xx/5xx on error.
 *
 * ECB SDMX endpoint:
 *   https://data-api.ecb.europa.eu/service/data/EXR/D.GBP.EUR.SP00.A
 *   ?lastNObservations=1&format=csvdata
 */
export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ECB_URL =
  "https://data-api.ecb.europa.eu/service/data/EXR/D.GBP.EUR.SP00.A" +
  "?lastNObservations=1&format=csvdata";

/** ECB publishes GBP/EUR (how many GBP per 1 EUR). We store EUR/GBP directly. */
async function fetchEcbRate(): Promise<{ date: string; eurGbp: number }> {
  const res = await fetch(ECB_URL, {
    headers: { Accept: "text/csv" },
    // Don't cache — we need fresh data each invocation.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ECB API responded ${res.status}`);
  }

  const csv = await res.text();
  // CSV header line followed by data line(s). Columns include TIME_PERIOD and OBS_VALUE.
  const lines = csv.trim().split("\n");
  if (lines.length < 2) throw new Error("ECB CSV has no data rows");

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const values  = lines[1].split(",").map((v) => v.trim().replace(/"/g, ""));

  const dateIdx  = headers.indexOf("TIME_PERIOD");
  const valueIdx = headers.indexOf("OBS_VALUE");

  if (dateIdx === -1 || valueIdx === -1) {
    throw new Error(`ECB CSV missing expected columns. Headers: ${headers.join(", ")}`);
  }

  const date   = values[dateIdx];
  const gbpEur = parseFloat(values[valueIdx]);

  if (!date || isNaN(gbpEur) || gbpEur <= 0) {
    throw new Error(`ECB returned invalid data: date=${date} value=${values[valueIdx]}`);
  }

  // ECB series EXR D.GBP.EUR publishes GBP per EUR (e.g. 0.856 GBP = 1 EUR).
  // That is already EUR→GBP so we store it directly.
  return { date, eurGbp: gbpEur };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let rate: { date: string; eurGbp: number };
  try {
    rate = await fetchEcbRate();
  } catch (err) {
    console.error("[cron/ecb-fx] fetch failed:", err);
    return NextResponse.json(
      { error: "ECB fetch failed", detail: String(err) },
      { status: 502 },
    );
  }

  const admin = createAdminClient();

  // Check if we already have today's rate (idempotent re-run guard).
  const { data: existing } = await admin
    .from("fx_rates")
    .select("date")
    .eq("date", rate.date)
    .single();

  if (existing) {
    return NextResponse.json({ status: "already_stored", date: rate.date }, { status: 200 });
  }

  const { error } = await admin.from("fx_rates").upsert(
    {
      date:       rate.date,
      eur_gbp:    rate.eurGbp,
      source:     "ecb",
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "date" },
  );

  if (error) {
    console.error("[cron/ecb-fx] upsert failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[cron/ecb-fx] stored EUR/GBP=${rate.eurGbp} for ${rate.date}`);
  return NextResponse.json({ status: "ok", date: rate.date, eur_gbp: rate.eurGbp });
}
