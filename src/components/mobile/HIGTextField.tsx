"use client";

/**
 * HIG-style text field. Floating label on focus, clear error surface,
 * 44pt minimum tap height. No chrome borders — follows iOS 15+ grouped
 * inset style with a light background fill.
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
          className="text-xs font-semibold uppercase tracking-wide text-tenu-slate/70"
        >
          {label}
        </label>
        <input
          id={fieldId}
          ref={ref}
          className={clsx(
            "min-h-[44px] rounded-xl bg-white/80 px-4 py-2",
            "text-base text-tenu-slate placeholder:text-tenu-slate/40",
            "outline-none ring-1 ring-transparent",
            "focus:ring-2 focus:ring-tenu-forest",
            error && "ring-2 ring-red-500 focus:ring-red-500",
            className,
          )}
          {...rest}
        />
        {error ? (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-tenu-slate/60">{hint}</p>
        ) : null}
      </div>
    );
  },
);

export default HIGTextField;
