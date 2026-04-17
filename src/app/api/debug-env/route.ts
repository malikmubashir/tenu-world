import { NextResponse } from "next/server";

/* Temporary: verifies which env vars the Vercel Function actually sees. Delete after debug. */
export async function GET() {
  return NextResponse.json({
    has_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    url_length: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").length,
    has_anon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    anon_length: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").length,
    has_service: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    vercel_env: process.env.VERCEL_ENV ?? null,
    vercel_deployment_id: process.env.VERCEL_DEPLOYMENT_ID ?? null,
  });
}
