"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tenu-cream px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-tenu-forest">Check your email</h1>
          <p className="text-sm text-tenu-slate/70">
            We sent a sign-in link to <strong>{email}</strong>. Click the link to continue.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-sm text-tenu-forest underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tenu-cream px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 block text-2xl font-bold text-tenu-forest">
          tenu
        </Link>
        <h1 className="mb-1 text-xl font-bold text-tenu-forest">Sign in</h1>
        <p className="mb-6 text-sm text-tenu-slate/70">
          We&apos;ll send you a magic link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-tenu-slate">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-tenu-cream-dark px-3 py-2 text-sm outline-none focus:border-tenu-forest focus:ring-1 focus:ring-tenu-forest"
            />
          </div>

          {error && (
            <p className="text-sm text-tenu-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-tenu-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-tenu-forest-light disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </form>
      </div>
    </div>
  );
}
