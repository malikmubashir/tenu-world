"use client";

/**
 * Bottom tab bar — Éditorial v2 (#T150): flat white surface, 1px
 * hairline top border, no translucency or blur. Active tab = black
 * label at weight 500 (signal blue is reserved for links, not tabs);
 * inactive tabs sit in stone gray. Icon + label stacked, safe-area
 * padding handled by the parent Shell. 44px targets kept (#T134).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, FileText, Settings } from "lucide-react";
import { clsx } from "clsx";
import { hapticLight } from "@/lib/mobile/haptics";

const TABS = [
  { href: "/app-home", label: "Inspections", icon: Camera, match: /^\/app-home\/?$/ },
  { href: "/app-home/reports", label: "Rapports", icon: FileText, match: /^\/app-home\/reports/ },
  { href: "/app-home/settings", label: "Réglages", icon: Settings, match: /^\/app-home\/settings/ },
] as const;

export default function TabBar() {
  const pathname = usePathname() ?? "/app-home";
  return (
    <nav
      className="sticky bottom-0 z-40 grid grid-cols-3 border-t border-tenu-hairline bg-tenu-canvas"
      style={{ minHeight: 52 }}
      aria-label="Navigation principale"
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match.test(pathname);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => void hapticLight()}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex flex-col items-center justify-center py-1.5",
              // Colour + opacity ease together on tab change. No scale —
              // tab bars dim, they do not shrink.
              "active:opacity-60 transition-[color,opacity] duration-150",
              active ? "text-tenu-ink" : "text-tenu-ink-muted",
            )}
          >
            <Icon className="h-6 w-6" aria-hidden />
            <span
              className={clsx(
                "mt-0.5 text-[11px]",
                active ? "font-medium" : "font-normal",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
