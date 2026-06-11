import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client.
 *
 * Default: cookie-based session (web flow).
 *
 * `bearerToken` (#T156): the Capacitor shell authenticates API routes with
 * `Authorization: Bearer <access_token>` because cookies do not flow across
 * the app / tenu.world origin boundary. Passing the token here forwards it
 * as the PostgREST Authorization header so RLS-scoped queries run as the
 * token's user, not as anon. Callers must still resolve the user via
 * `supabase.auth.getUser(token)`.
 */
export async function createClient(options?: { bearerToken?: string }) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(options?.bearerToken
        ? {
            global: {
              headers: { Authorization: `Bearer ${options.bearerToken}` },
            },
          }
        : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from Server Component — can't set cookies, ignored
          }
        },
      },
    },
  );
}
