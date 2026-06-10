"use client";

/**
 * Primary action button — Éditorial v2 (#T150).
 * Minimum 44pt tap target kept from the HIG pass (#T134).
 * Medium haptic on primary, light on secondary, heavy on destructive.
 *
 * Variants follow the editorial spec (docs/brand/DESIGN-EDITORIAL-2026-06-10.md):
 *   primary     — APPROVED EXCEPTION: filled #000 (--color-tenu-cta),
 *                 white text, 0px radius. Reserved for primary paid /
 *                 commit actions (Pay, Run scan, submit).
 *   secondary   — typographic: black underlined text, no fill, no border.
 *   destructive — functional danger text, underlined, no fill (danger
 *                 is a form state, never chrome).
 *   plain       — quiet typographic action, no underline.
 */
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { hapticMedium, hapticLight, hapticHeavy } from "@/lib/mobile/haptics";

type Variant = "primary" | "secondary" | "destructive" | "plain";

interface HIGButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export default function HIGButton({
  variant = "primary",
  fullWidth = true,
  loading = false,
  leading,
  trailing,
  className,
  disabled,
  onClick,
  children,
  ...rest
}: HIGButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === "primary") void hapticMedium();
    else if (variant === "destructive") void hapticHeavy();
    else void hapticLight();
    onClick?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2",
        "min-h-[44px] px-5 text-base font-medium rounded-none",
        // hig-press supplies token-driven transitions + scale; the
        // opacity dip is the only pressed-state effect — no shadows.
        "hig-press active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed",
        fullWidth && "w-full",
        variant === "primary" && "bg-tenu-cta text-tenu-cta-text",
        variant === "secondary" &&
          "bg-transparent text-tenu-ink underline decoration-1 underline-offset-4",
        variant === "destructive" &&
          "bg-transparent text-tenu-danger underline decoration-1 underline-offset-4",
        variant === "plain" && "bg-transparent text-tenu-ink",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : leading}
      {children}
      {!loading && trailing}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 2v4" />
      <path d="M12 18v4" opacity="0.3" />
      <path d="M4.93 4.93l2.83 2.83" opacity="0.5" />
      <path d="M16.24 16.24l2.83 2.83" opacity="0.2" />
      <path d="M2 12h4" opacity="0.4" />
      <path d="M18 12h4" opacity="0.6" />
      <path d="M4.93 19.07l2.83-2.83" opacity="0.7" />
      <path d="M16.24 7.76l2.83-2.83" opacity="0.8" />
    </svg>
  );
}
