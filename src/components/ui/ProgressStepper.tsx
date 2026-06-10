"use client";

/**
 * ProgressStepper — typographic step indicator for the inspection
 * funnel (Details → Capture → Review → Report). Éditorial v2 (#T150):
 * no discs, no fills — each step is set as "01 Label" text joined by
 * a 1px hairline connector. Done + active steps read in black ink
 * (active at weight 500), future steps in ash. Colour changes ease
 * with the standard motion tokens; aria-current marks the active
 * step for assistive tech.
 */
import { clsx } from "clsx";

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
    <nav className="flex items-center gap-1" aria-label="Progression">
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
                  "mx-1.5 h-px w-5 transition-colors duration-300 sm:w-8",
                  done ? "bg-tenu-ink" : "bg-tenu-hairline",
                )}
                aria-hidden="true"
              />
            )}
            <div className="flex items-baseline gap-1.5">
              <span
                className={clsx(
                  "text-xs tabular-nums transition-colors duration-300",
                  active && "font-medium text-tenu-ink",
                  done && "font-normal text-tenu-ink",
                  !done && !active && "font-normal text-tenu-ash",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={clsx(
                  "hidden text-xs transition-colors duration-300 sm:inline",
                  active && "font-medium text-tenu-ink underline decoration-1 underline-offset-4",
                  done && "text-tenu-ink",
                  !done && !active && "text-tenu-ash",
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
