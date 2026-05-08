/**
 * Server-side push notification sender via Firebase Cloud Messaging v1 API.
 *
 * Uses native Node.js `crypto` to sign service-account JWTs — no
 * firebase-admin or google-auth-library dependency required.
 *
 * Required Vercel env vars (MH must add before native sprint):
 *   FCM_PROJECT_ID            — Firebase project ID (e.g. "tenu-production")
 *   FCM_SERVICE_ACCOUNT_EMAIL — Service account email from Firebase console
 *   FCM_PRIVATE_KEY           — Private key PEM from service account JSON
 *                               (replace literal \n with actual newlines, or
 *                               just paste the raw PEM; both are handled)
 *
 * FCM v1 sends to both iOS (via APNs) and Android with a single token.
 * Tokens are stored in `device_tokens` by /api/mobile/push-token.
 */
import "server-only";

import { createSign } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Config ──────────────────────────────────────────────────────────────────

function fcmConfig(): { projectId: string; email: string; privateKey: string } | null {
  const projectId = process.env.FCM_PROJECT_ID;
  const email = process.env.FCM_SERVICE_ACCOUNT_EMAIL;
  const raw = process.env.FCM_PRIVATE_KEY;
  if (!projectId || !email || !raw) return null;
  // Allow keys stored with literal \n (common in Vercel env) or real newlines
  const privateKey = raw.replace(/\\n/g, "\n");
  return { projectId, email, privateKey };
}

// ── JWT + OAuth2 access token ────────────────────────────────────────────────

function base64url(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function signServiceAccountJwt(email: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const sig = signer.sign(privateKey, "base64");
  const sigUrl = sig.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${signingInput}.${sigUrl}`;
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const jwt = signServiceAccountJwt(email, privateKey);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[push] OAuth2 token error ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

// ── FCM send ─────────────────────────────────────────────────────────────────

interface FcmMessage {
  token: string;
  title: string;
  body: string;
  /** Optional data payload forwarded to the app on tap */
  data?: Record<string, string>;
}

async function sendOne(
  projectId: string,
  accessToken: string,
  msg: FcmMessage
): Promise<void> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: msg.token,
          notification: { title: msg.title, body: msg.body },
          data: msg.data ?? {},
          apns: {
            payload: {
              aps: {
                alert: { title: msg.title, body: msg.body },
                sound: "default",
              },
            },
          },
          android: {
            notification: { sound: "default" },
          },
        },
      }),
    }
  );
  if (!res.ok && res.status !== 404) {
    // 404 = token expired/invalid — caller prunes it
    const text = await res.text();
    throw new Error(`[push] FCM send error ${res.status}: ${text}`);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  /** Absolute or root-relative URL the app navigates to on tap */
  link?: string;
}

/**
 * Send a push notification to all registered devices for a user.
 * Best-effort — never throws. Returns the number of tokens reached.
 *
 * If FCM env vars are not configured the call is a safe no-op
 * (expected until Dr Mubashir sets up the Firebase project).
 */
export async function sendPushNotification(payload: PushPayload): Promise<number> {
  const cfg = fcmConfig();
  if (!cfg) {
    // Env not wired yet — no-op, no error spam
    return 0;
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("device_tokens")
    .select("token, platform")
    .eq("user_id", payload.userId);

  if (error || !rows?.length) return 0;

  let accessToken: string;
  try {
    accessToken = await getAccessToken(cfg.email, cfg.privateKey);
  } catch (err) {
    console.warn("[push] failed to get access token:", err);
    return 0;
  }

  const data: Record<string, string> = {};
  if (payload.link) data["link"] = payload.link;

  let sent = 0;
  const stalePrune: Promise<void>[] = [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${cfg.projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: row.token,
                notification: { title: payload.title, body: payload.body },
                data,
                apns: {
                  payload: {
                    aps: {
                      alert: { title: payload.title, body: payload.body },
                      sound: "default",
                    },
                  },
                },
                android: {
                  notification: { sound: "default" },
                },
              },
            }),
          }
        );
        if (res.ok) {
          sent++;
        } else if (res.status === 404) {
          // Stale token — prune asynchronously
          stalePrune.push(
            Promise.resolve(
              admin.from("device_tokens").delete().eq("token", row.token)
            ).then(() => {}).catch(() => {})
          );
        } else {
          const text = await res.text();
          console.warn(`[push] FCM error ${res.status} for token ${row.token.slice(0, 12)}…: ${text}`);
        }
      } catch (err) {
        console.warn("[push] send exception:", err);
      }
    })
  );

  // Fire stale-token pruning without blocking
  void Promise.all(stalePrune);

  void sendOne; // suppress unused import warning
  return sent;
}
