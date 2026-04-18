/**
 * Deep-link handling for Supabase auth callbacks + Stripe return URLs.
 *
 * iOS Universal Links + Android App Links register the
 * https://tenu.world/auth/callback URL with the app, so an email click
 * opens directly in the shell with a `token_hash` query param.
 *
 * This module listens for the App.appUrlOpen event and parses the URL
 * into an intent the auth screen can consume.
 *
 * Universal Links set-up (done on Mac, see MOBILE-RUNBOOK.md):
 *   iOS     — apple-app-site-association file served at
 *             https://tenu.world/.well-known/apple-app-site-association
 *             with the tenu app's Team ID + bundle.
 *   Android — assetlinks.json at
 *             https://tenu.world/.well-known/assetlinks.json.
 *
 * Until those two JSON files are deployed the app will fall back to the
 * tenu:// URL scheme, which works everywhere but is less polished.
 */
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { isNative } from "./platform";

export interface IncomingAuthIntent {
  kind: "auth-callback";
  tokenHash?: string;
  type?: string;
  code?: string;
  redirect?: string;
}

export type IncomingIntent = IncomingAuthIntent | { kind: "unknown"; rawUrl: string };

type Listener = (intent: IncomingIntent) => void;

const listeners = new Set<Listener>();

/** Subscribe to deep-link intents. Returns an unsubscribe function. */
export function onDeepLink(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Call once from the root mobile layout. */
export function initDeepLinks(): void {
  if (!isNative()) return;
  App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
    const intent = parseIntent(event.url);
    for (const l of listeners) {
      try {
        l(intent);
      } catch {
        /* don't let one listener break the rest */
      }
    }
  });
}

function parseIntent(rawUrl: string): IncomingIntent {
  try {
    const url = new URL(rawUrl);
    const isAuthPath =
      url.pathname === "/auth/callback" ||
      url.pathname === "auth/callback" ||
      url.host === "auth-callback";
    if (isAuthPath) {
      return {
        kind: "auth-callback",
        tokenHash: url.searchParams.get("token_hash") ?? undefined,
        type: url.searchParams.get("type") ?? undefined,
        code: url.searchParams.get("code") ?? undefined,
        redirect:
          url.searchParams.get("redirect") ??
          url.searchParams.get("next") ??
          undefined,
      };
    }
  } catch {
    /* fall through */
  }
  return { kind: "unknown", rawUrl };
}
