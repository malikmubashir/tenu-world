"use client";

/**
 * Navigation bar — Éditorial v2 (#T150): flat white surface with a
 * 1px hairline bottom border, black ink title at weight 500. No fill
 * change on scroll, no shadow — flat to the canvas. Left slot
 * typically Back; right slot a context action. 56pt tall.
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
      className="sticky top-0 z-40 flex items-center justify-between border-b border-tenu-hairline bg-tenu-canvas text-tenu-ink"
      style={{ minHeight: 56 }}
    >
      <div className="flex w-12 items-center justify-start pl-2">
        {showBack && (
          <button
            type="button"
            aria-label="Back"
            onClick={handleBack}
            className="hig-press flex h-11 w-11 items-center justify-center rounded-none active:opacity-60"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>
      <h1 className="flex-1 truncate text-center text-base font-medium">
        {title}
      </h1>
      <div className="flex w-12 items-center justify-end pr-2">{right}</div>
    </div>
  );
}
