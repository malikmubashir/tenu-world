"use client";

/**
 * iOS-style navigation bar. Left slot typically Back; right slot
 * typically a context action. Title centered. 56pt tall, follows HIG.
 */
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { hapticLight } from "@/lib/mobile/haptics";

interface NavBarProps {
  title: string;
  onBack?: () => void;
  /** Pass a single ReactNode for the right slot, or null for none. */
  right?: ReactNode;
  /** If true, the left slot shows a Back chevron that calls router.back(). */
  showBack?: boolean;
}

export default function NavBar({
  title,
  onBack,
  right,
  showBack = true,
}: NavBarProps) {
  const router = useRouter();

  const handleBack = () => {
    void hapticLight();
    if (onBack) return onBack();
    router.back();
  };

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between bg-tenu-forest text-tenu-cream"
      style={{ minHeight: 56 }}
    >
      <div className="flex w-12 items-center justify-start pl-2">
        {showBack && (
          <button
            type="button"
            aria-label="Back"
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-full active:opacity-60"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>
      <h1 className="flex-1 truncate text-center text-base font-semibold">
        {title}
      </h1>
      <div className="flex w-12 items-center justify-end pr-2">{right}</div>
    </div>
  );
}
