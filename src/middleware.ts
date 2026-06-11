import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
} from "@/lib/analytics/funnel";

const publicPaths = [
  "/",
  "/pricing",
  "/legal",
  "/stories",
  "/features",
  "/inspection",
  "/auth/login",
  "/auth/callback",
  "/auth/accept-terms",
  "/api/webhooks",
  "/api/webhook",
  "/api/consents",
  "/.well-known",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// ── #T187 first-touch attribution ────────────────────────────────────
// If the request carries ?src= or any utm_* param and the visitor has
// no tenu_attr cookie yet, stamp one (90 days, first touch wins) and
// log a 'landing' funnel event via the service-role REST endpoint.
// Strictly additive: never touches auth/locale logic, every failure is
// swallowed so attribution can never break a page load.
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

function captureAttribution(
  request: NextRequest,
  response: NextResponse,
  event: NextFetchEvent,
): void {
  try {
    if (request.cookies.get(ATTRIBUTION_COOKIE)) return; // first touch wins

    const params = request.nextUrl.searchParams;
    const src = params.get("src");
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) utm[key] = value;
    }
    const hasUtm = Object.keys(utm).length > 0;
    if (!src && !hasUtm) return; // organic / direct — nothing to record

    const payload = {
      source: src ?? utm.utm_source ?? null,
      utm: hasUtm ? utm : null,
      landed_at: new Date().toISOString(),
      path: request.nextUrl.pathname,
    };

    response.cookies.set(
      ATTRIBUTION_COOKIE,
      encodeURIComponent(JSON.stringify(payload)),
      {
        path: "/",
        maxAge: ATTRIBUTION_MAX_AGE_SECONDS,
        sameSite: "lax",
        httpOnly: true, // read server-side only (auth callback)
        secure: process.env.NODE_ENV === "production",
      },
    );

    // 'landing' row — direct PostgREST insert (service role) so the edge
    // bundle stays free of supabase-js. waitUntil keeps the runtime alive
    // past the response; the funnel_events table has no client policies.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      event.waitUntil(
        fetch(`${supabaseUrl}/rest/v1/funnel_events`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            event: "landing",
            source: payload.source,
            utm: payload.utm,
            path: payload.path,
          }),
        }).catch((err) => console.warn("[funnel] landing dropped:", err)),
      );
    }
  } catch (err) {
    console.warn("[funnel] attribution capture failed:", err);
  }
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next({ request });

  /* Skip auth check if Supabase is not configured yet */
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    captureAttribution(request, response, event);
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Record<string, unknown>),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // #T156: the Capacitor shell authenticates API calls with an
  // Authorization: Bearer header — it has no session cookies, so the
  // cookie check above sees no user. Never bounce such a request to the
  // login HTML page; every /api route enforces its own auth and returns
  // a proper 401 JSON if the token is invalid.
  const isBearerApiCall =
    request.nextUrl.pathname.startsWith("/api/") &&
    (request.headers.get("authorization")?.startsWith("Bearer ") ?? false);

  // redirect unauthenticated users away from protected routes
  if (!user && !isPublicPath(request.nextUrl.pathname) && !isBearerApiCall) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  captureAttribution(request, response, event);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
