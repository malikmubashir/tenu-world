import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DPA_TEXT_VERSION,
  MARKETING_TEXT_VERSION,
  COOKIES_TEXT_VERSION,
  type ConsentType,
  type Locale,
} from "@/lib/legal/consents";

/**
 * POST /api/consents
 *
 * Generic writer for non-checkout consents: DPA acceptance, marketing
 * opt-in, cookie preferences. The 14-day withdrawal waiver is still
 * handled inline by /api/checkout because it must gate the Stripe
 * session atomically.
 *
 * Body:
 *   type:     "dpa_acceptance" | "marketing_optin" | "cookies_nonessential"
 *   locale:   "fr" | "en"
 *   granted:  boolean
 *              — for dpa_acceptance this MUST be true
 *              — for marketing_optin and cookies this may be false
 *                (an explicit refusal, still auditable)
 *
 * Append-only. Every call inserts a new row. Re-reading current state
 * uses the latest row per (user_id, consent_type).
 *
 * Auth: required. For anon visitors, cookie prefs live in localStorage
 * only — no DB row is written.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, locale, granted } = (body ?? {}) as {
    type?: ConsentType;
    locale?: Locale;
    granted?: boolean;
  };

  if (type !== "dpa_acceptance" && type !== "marketing_optin" && type !== "cookies_nonessential") {
    return NextResponse.json({ error: "Invalid consent type" }, { status: 400 });
  }
  if (locale !== "fr" && locale !== "en") {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  if (typeof granted !== "boolean") {
    return NextResponse.json({ error: "Invalid granted flag" }, { status: 400 });
  }

  // DPA acceptance cannot be a refusal — if the user refuses, they
  // simply never complete signup. We keep the invariant enforced here
  // so a malformed client cannot poison the audit trail.
  if (type === "dpa_acceptance" && granted !== true) {
    return NextResponse.json(
      { error: "DPA acceptance cannot be refused — account creation requires it" },
      { status: 400 },
    );
  }

  const textVersion =
    type === "dpa_acceptance"
      ? DPA_TEXT_VERSION
      : type === "marketing_optin"
        ? MARKETING_TEXT_VERSION
        : COOKIES_TEXT_VERSION;

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const { data, error } = await supabase
    .from("consents")
    .insert({
      user_id: user.id,
      consent_type: type,
      text_version: textVersion,
      locale,
      checkbox_checked: granted,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to record consent" },
      { status: 500 },
    );
  }

  // Mirror the latest decision to the profile for fast gating.
  // Append-only table remains the source of truth; this is a cache.
  if (type === "dpa_acceptance") {
    await supabase
      .from("profiles")
      .update({ dpa_accepted_at: data.created_at, dpa_text_version: textVersion })
      .eq("id", user.id);
  } else if (type === "marketing_optin") {
    await supabase
      .from("profiles")
      .update({
        marketing_optin_at: granted ? data.created_at : null,
        marketing_text_version: granted ? textVersion : null,
      })
      .eq("id", user.id);
  }

  return NextResponse.json({
    id: data.id,
    type,
    textVersion,
    granted,
    createdAt: data.created_at,
  });
}

/**
 * GET /api/consents
 * Returns the latest decision per consent_type for the current user.
 * Used by the dashboard "my consents" view and by the cookie banner
 * to decide whether to reappear after login.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("consents")
    .select("consent_type, text_version, locale, checkbox_checked, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  // Reduce to latest-per-type.
  const latest = new Map<string, (typeof data)[number]>();
  for (const row of data ?? []) {
    if (!latest.has(row.consent_type)) latest.set(row.consent_type, row);
  }

  return NextResponse.json({
    consents: Array.from(latest.values()),
  });
}
