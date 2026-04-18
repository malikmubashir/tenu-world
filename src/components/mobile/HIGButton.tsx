"use client";

/**
 * HIG-compliant button. Minimum 44pt tap target (Apple HIG 8.2 —
 * "The minimum tappable area for any UI element is 44x44 points").
 * Medium haptic on primary, light on secondary, heavy on destructive.
 *
 * No shadow, no gradient. iOS filled buttons are flat with a rounded
 * rect and active-state opacity change; we follow that convention.
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
      className={clsx(
        "inline-flex items-center justify-center gap-2",
        "min-h-[44px] px-5 text-base font-semibold rounded-xl",
        "transition-opacity duration-150",
        "active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed",
        fullWidth && "w-full",
        variant === "primary" && "bg-tenu-forest text-tenu-cream",
        variant === "secondary" && "bg-tenu-cream-dark text-tenu-forest",
        variant === "destructive" && "bg-red-600 text-white",
        variant === "plain" && "bg-transparent text-tenu-forest",
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
      className="h-5 w-5 animate-spin"
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
