import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DPA_TEXT_VERSION,
  MARKETING_TEXT_VERSION,
  SIGNUP_CONSENT_COOKIE,
  decodeSignupConsent,
} from "@/lib/legal/consents";

/**
 * Auth callback — exchanges the OAuth / magic-link code for a session,
 * then drains the signup-consent cookie stamped by /auth/login into
 * the consents table so we have a timestamped, IP-attributed audit
 * row linked to the user_id that just came into existence.
 *
 * If the cookie is missing (cross-device magic link, direct auth call,
 * etc.) the user is redirected to /auth/accept-terms where they must
 * tick the DPA box to finish signing in. That route is the defensive
 * fallback — the happy path writes consents here and moves on.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/inspection/new";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_user`);
  }

  // Check profile for an existing DPA acceptance — returning users do
  // not need to re-tick.
  const { data: profile } = await supabase
    .from("profiles")
    .select("dpa_accepted_at")
    .eq("id", user.id)
    .single();

  const alreadyAccepted = Boolean(profile?.dpa_accepted_at);

  const cookieStore = await cookies();
  const consentCookie = cookieStore.get(SIGNUP_CONSENT_COOKIE)?.value;
  const intent = decodeSignupConsent(consentCookie);

  // Clear the cookie in every branch so a stale intent never lingers.
  cookieStore.set(SIGNUP_CONSENT_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  if (intent && intent.dpa) {
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") ?? null;

    // DPA acceptance row. Idempotency is not enforced — every fresh
    // intent is a fresh consent event. The profile cache is updated
    // to the latest.
    const { data: dpaRow } = await supabase
      .from("consents")
      .insert({
        user_id: user.id,
        consent_type: "dpa_acceptance",
        text_version: intent.dpaTextVersion || DPA_TEXT_VERSION,
        locale: intent.locale,
        checkbox_checked: true,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id, created_at")
      .single();

    if (dpaRow) {
      await supabase
        .from("profiles")
        .update({
          dpa_accepted_at: dpaRow.created_at,
          dpa_text_version: intent.dpaTextVersion || DPA_TEXT_VERSION,
        })
        .eq("id", user.id);
    }

    // Marketing opt-in is always recorded — true or false — so the
    // audit trail shows the user was offered a choice and what they
    // picked. Profile cache reflects the positive decision only.
    const { data: marketingRow } = await supabase
      .from("consents")
      .insert({
        user_id: user.id,
        consent_type: "marketing_optin",
        text_version: intent.marketingTextVersion || MARKETING_TEXT_VERSION,
        locale: intent.locale,
        checkbox_checked: intent.marketing,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id, created_at")
      .single();

    if (marketingRow && intent.marketing) {
      await supabase
        .from("profiles")
        .update({
          marketing_optin_at: marketingRow.created_at,
          marketing_text_version: intent.marketingTextVersion || MARKETING_TEXT_VERSION,
        })
        .eq("id", user.id);
    }

    return NextResponse.redirect(`${origin}${redirect}`);
  }

  // No intent cookie AND no prior acceptance on profile → gate.
  if (!alreadyAccepted) {
    const target = new URL(`${origin}/auth/accept-terms`);
    target.searchParams.set("redirect", redirect);
    return NextResponse.redirect(target.toString());
  }

  // Returning user with profile.dpa_accepted_at already set — proceed.
  return NextResponse.redirect(`${origin}${redirect}`);
}
