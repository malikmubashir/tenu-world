"use client";

/**
 * Avatar dropdown — Apple-style rounded menu with press feedback.
 *
 * Shows the user's initial inside a circular chip. Click to reveal
 * a menu with Account + Sign out. Click-outside and Escape close it.
 * Sign out uses a server action so the cookie is cleared server-side
 * and the session is revalidated before we redirect.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

interface UserMenuProps {
  email: string;
  fullName: string | null;
  locale: "fr" | "en";
}

const LABELS = {
  fr: {
    account: "Mon compte",
    signout: "Se déconnecter",
    menuFor: "Menu utilisateur",
  },
  en: {
    account: "My account",
    signout: "Sign out",
    menuFor: "User menu",
  },
} as const;

export default function UserMenu({ email, fullName, locale }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const t = LABELS[locale];

  const initial = (fullName || email || "?").charAt(0).toUpperCase();
  const displayName = fullName?.trim() || email;

  // Close on click outside and Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={t.menuFor}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="hig-press flex h-10 w-10 items-center justify-center rounded-full bg-tenu-forest text-sm font-semibold text-tenu-cream hover:bg-tenu-forest-light"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="hig-reveal absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl bg-white p-1"
          style={{ boxShadow: "var(--shadow-hig-float)" }}
        >
          <div className="px-3 py-3">
            <p className="truncate text-sm font-semibold text-tenu-slate">
              {displayName}
            </p>
            {displayName !== email && (
              <p className="truncate text-xs text-tenu-slate/60">{email}</p>
            )}
          </div>

          <div className="h-px bg-tenu-cream-dark" />

          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="hig-press block rounded-xl px-3 py-2 text-sm text-tenu-slate hover:bg-tenu-cream/70"
          >
            {t.account}
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="hig-press w-full rounded-xl px-3 py-2 text-left text-sm text-tenu-danger hover:bg-red-50"
            >
              {t.signout}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
