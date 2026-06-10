"use client";

/**
 * ProgressStepper — compact horizontal step indicator for the
 * inspection funnel (Details → Capture → Review → Report). Done steps
 * fill emerald with a check, the active step is outlined, future steps
 * stay muted. Colour changes ease with the standard motion tokens;
 * aria-current marks the active step for assistive tech.
 */
import { clsx } from "clsx";
import { Check } from "lucide-react";

interface Step {
  key: string;
  label: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: string;
}

export default function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <nav className="flex items-center gap-1">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;

        return (
          <div
            key={step.key}
            className="flex items-center"
            aria-current={active ? "step" : undefined}
          >
            {i > 0 && (
              <div
                className={clsx(
                  "mx-1 h-px w-6 transition-colors duration-300 sm:w-10",
                  done ? "bg-tenu-forest" : "bg-tenu-cream-dark",
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300",
                  done && "bg-tenu-forest text-white",
                  active && "border-2 border-tenu-forest text-tenu-forest",
                  !done && !active && "border border-tenu-cream-dark text-tenu-slate/40",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={clsx(
                  "hidden text-xs sm:inline",
                  active ? "font-medium text-tenu-forest" : "text-tenu-slate/50",
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
