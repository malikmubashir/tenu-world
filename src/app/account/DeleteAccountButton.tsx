"use client";

import { useState } from "react";

/**
 * Delete-account button with typed-email confirmation modal.
 *
 * Two-step friction is the point: Art. 17 RGPD requires honouring
 * erasure, but a one-click button is how people nuke their data by
 * accident. User must type their exact email to arm the button.
 * Calls /api/account/delete which fans out the cascade server-side.
 */

const COPY = {
  fr: {
    openBtn: "Supprimer mon compte",
    title: "Supprimer définitivement votre compte",
    explain:
      "Cette action supprime votre compte, votre profil, vos inspections, vos photos, vos paiements et vos lettres. Elle est irréversible.",
    confirmPrompt: (email: string) =>
      `Pour confirmer, tapez votre email ci-dessous : ${email}`,
    inputLabel: "Votre email",
    cancel: "Annuler",
    deleteConfirm: "Supprimer définitivement",
    deleting: "Suppression en cours...",
    errorGeneric: "Impossible de supprimer le compte. Contactez support@tenu.world.",
    errorMismatch: "L'email saisi ne correspond pas.",
  },
  en: {
    openBtn: "Delete my account",
    title: "Permanently delete your account",
    explain:
      "This deletes your account, profile, inspections, photos, payments and letters. It cannot be undone.",
    confirmPrompt: (email: string) =>
      `To confirm, type your email below: ${email}`,
    inputLabel: "Your email",
    cancel: "Cancel",
    deleteConfirm: "Delete permanently",
    deleting: "Deleting...",
    errorGeneric: "Could not delete account. Contact support@tenu.world.",
    errorMismatch: "The email you typed does not match.",
  },
} as const;

export default function DeleteAccountButton({
  email,
  locale,
}: {
  email: string;
  locale: "fr" | "en";
}) {
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canDelete = typed.trim().toLowerCase() === email.trim().toLowerCase();

  async function onConfirm() {
    if (!canDelete) {
      setErr(t.errorMismatch);
      return;
    }
    setPending(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setErr(t.errorGeneric);
        setPending(false);
        return;
      }
      // Server already signed us out and cleared the cookie. Hard reload
      // so stale client state (React cache, service worker) is dropped.
      window.location.href = "/";
    } catch {
      setErr(t.errorGeneric);
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setErr(null);
          setTyped("");
        }}
        className="hig-press inline-flex h-10 items-center rounded-xl border border-tenu-danger/40 bg-white px-4 text-sm font-semibold text-tenu-danger hover:bg-red-50"
      >
        {t.openBtn}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false);
          }}
        >
          <div
            className="hig-reveal w-full max-w-md rounded-3xl bg-white p-6"
            style={{ boxShadow: "var(--shadow-hig-float)" }}
          >
            <h3
              id="delete-title"
              className="mb-2 text-lg font-semibold text-tenu-slate"
            >
              {t.title}
            </h3>
            <p className="mb-4 text-sm text-tenu-slate/70">{t.explain}</p>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-tenu-slate/60">
                {t.confirmPrompt(email)}
              </span>
              <input
                type="email"
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setErr(null);
                }}
                disabled={pending}
                aria-label={t.inputLabel}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-tenu-cream-dark bg-white px-3 py-2 text-sm text-tenu-slate focus:border-tenu-forest focus:outline-none"
              />
            </label>

            {err && (
              <p role="alert" className="mt-3 text-sm text-tenu-danger">
                {err}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="hig-press inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-tenu-slate hover:bg-tenu-cream/60"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!canDelete || pending}
                className="hig-press inline-flex h-10 items-center rounded-xl bg-tenu-danger px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? t.deleting : t.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
