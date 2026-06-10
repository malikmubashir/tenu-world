"use client";

/**
 * Text field — Éditorial v2 (#T150). 44pt minimum tap height kept.
 *
 * Spec: 1px stone-gray border (--color-tenu-ink-muted), 2px radius
 * (the only radius in the system), white background, black text,
 * ash placeholder. No focus ring glow — the border darkens to black
 * on focus.
 */
import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface HIGTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const HIGTextField = forwardRef<HTMLInputElement, HIGTextFieldProps>(
  function HIGTextField({ label, error, hint, className, id, ...rest }, ref) {
    const fieldId = id ?? `f_${label.replace(/\s+/g, "_").toLowerCase()}`;
    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-tenu-ink"
        >
          {label}
        </label>
        <input
          id={fieldId}
          ref={ref}
          className={clsx(
            "min-h-[44px] rounded-[2px] border bg-tenu-canvas px-3 py-2",
            "text-base text-tenu-ink placeholder:text-tenu-ash",
            "outline-none focus-visible:outline-none",
            // Border darkens to ink on focus — no glow (150ms tier).
            "transition-colors duration-150 focus:border-tenu-ink",
            error
              ? "border-tenu-danger focus:border-tenu-danger"
              : "border-tenu-ink-muted",
            className,
          )}
          {...rest}
        />
        {error ? (
          <p className="text-sm text-tenu-danger" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-sm text-tenu-ink-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);

export default HIGTextField;
