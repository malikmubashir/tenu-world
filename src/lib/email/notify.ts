import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrevoTransactional, type BrevoSendResult } from "./brevo";
import {
  scanCompleteHtml,
  scanCompleteSubject,
} from "./templates/scan-complete";
import {
  disputeReadyHtml,
  disputeReadySubject,
  type DisputeLetterType,
} from "./templates/dispute-ready";

// Tenu — high-level email notifications.
// Route handlers call these. They pull recipient + locale from
// profiles via the admin client (bypasses RLS — we are on the server
// side and have already authorised the route's caller), build the
// template, and fire the Brevo send.
//
// Callers must NOT block their response on the result. All helpers
// return the BrevoSendResult so the route can log failure without
// surfacing a 5xx to the user — the scan or letter has already been
// persisted, the email is an out-of-band side effect.

type Locale = "fr" | "en";

function coerceLocale(raw: string | null | undefined): Locale {
  return raw === "fr" ? "fr" : "en";
}

function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://tenu.world";
}

async function loadProfile(userId: string): Promise<{
  email: string;
  displayName: string | null;
  locale: Locale;
} | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("email, display_name, locale")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data?.email) return null;
  return {
    email: data.email,
    displayName: data.display_name ?? null,
    locale: coerceLocale(data.locale),
  };
}

/**
 * Fire the scan-complete email. Returns the Brevo result — callers
 * should log a failure and move on, never surface it to the user.
 */
export async function notifyScanComplete(params: {
  userId: string;
  inspectionId: string;
  /** R2 URL of the rendered PDF report. Optional — link omitted if absent. */
  pdfUrl?: string | null;
}): Promise<BrevoSendResult> {
  const profile = await loadProfile(params.userId);
  if (!profile) {
    return {
      ok: false,
      error: `profile not found for user ${params.userId}`,
      status: 404,
    };
  }

  const reportUrl = `${appOrigin()}/inspection/${params.inspectionId}/report`;

  return sendBrevoTransactional({
    to: { email: profile.email, name: profile.displayName ?? undefined },
    subject: scanCompleteSubject(profile.locale),
    htmlContent: scanCompleteHtml({
      displayName: profile.displayName,
      reportUrl,
      pdfUrl: params.pdfUrl ?? null,
    }),
    tag: "scan-complete",
  });
}

/**
 * Fire the dispute-ready email. The link currently points to the
 * inspection report page where the dispute letter body is visible.
 * Once the PDF leg lands the template grows a "Download PDF" button
 * fed by an R2 presigned URL — this helper's signature stays the same.
 */
export async function notifyDisputeReady(params: {
  userId: string;
  inspectionId: string;
  letterType: DisputeLetterType;
}): Promise<BrevoSendResult> {
  const profile = await loadProfile(params.userId);
  if (!profile) {
    return {
      ok: false,
      error: `profile not found for user ${params.userId}`,
      status: 404,
    };
  }

  const letterUrl = `${appOrigin()}/inspection/${params.inspectionId}/report`;

  return sendBrevoTransactional({
    to: { email: profile.email, name: profile.displayName ?? undefined },
    subject: disputeReadySubject(profile.locale),
    htmlContent: disputeReadyHtml({
      displayName: profile.displayName,
      letterUrl,
      letterType: params.letterType,
    }),
    tag: "dispute-ready",
  });
}
