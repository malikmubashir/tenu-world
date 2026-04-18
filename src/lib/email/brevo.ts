import "server-only";

// Tenu — Brevo transactional email client.
// Thin fetch wrapper around the Brevo REST endpoint. No SDK dependency —
// keeps the Vercel bundle small and avoids the @getbrevo/brevo package
// which drags in runtime helpers we do not use.
//
// Contract: all senders go through sendBrevoTransactional. Never call the
// REST endpoint directly from a route handler — this module is the seam
// for observability and for swapping transport later if needed.

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_FROM_EMAIL = "noreply@tenu.world";
const DEFAULT_FROM_NAME = "Tenu";

export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface BrevoSendInput {
  to: BrevoRecipient;
  subject: string;
  htmlContent: string;
  // observability grouping in Brevo dashboard. Use short kebab-case ids
  // like "scan-complete" or "dispute-ready" so filters stay clean.
  tag?: string;
  replyTo?: BrevoRecipient;
}

export type BrevoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; status: number };

/**
 * Send a single transactional email via Brevo.
 *
 * Returns a discriminated-union result so callers can log failures
 * without the call site needing try/catch wrappers. Never throws.
 */
export async function sendBrevoTransactional(
  input: BrevoSendInput,
): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY missing", status: 500 };
  }

  const payload: Record<string, unknown> = {
    sender: { name: DEFAULT_FROM_NAME, email: DEFAULT_FROM_EMAIL },
    to: [input.to],
    subject: input.subject,
    htmlContent: input.htmlContent,
  };
  if (input.tag) {
    payload.tags = [input.tag];
  }
  if (input.replyTo) {
    payload.replyTo = input.replyTo;
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Brevo ${res.status}: ${text.slice(0, 300)}`,
        status: res.status,
      };
    }

    const json = (await res.json().catch(() => ({}))) as {
      messageId?: string;
    };
    return { ok: true, messageId: json.messageId ?? "unknown" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { ok: false, error: `Brevo fetch failed: ${msg}`, status: 502 };
  }
}

/**
 * Escape a string for safe interpolation into an HTML attribute or
 * text node. Covers the five characters that matter for transactional
 * email bodies. Not a general-purpose XSS guard — callers must still
 * treat the template as a trust boundary.
 */
export function escapeHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
