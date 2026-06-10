"use client";

/**
 * Bottom tab bar — three destinations: Inspections, Reports, Settings.
 * Follows Apple HIG: icon + label stacked, safe-area padding handled
 * by the parent Shell.
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
      className="sticky bottom-0 z-40 grid grid-cols-3 border-t border-tenu-cream-dark bg-tenu-cream/95 backdrop-blur"
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
              // iOS tab bars dim, they do not shrink.
              "active:opacity-60 transition-[color,opacity] duration-150",
              active ? "text-tenu-forest" : "text-tenu-slate/60",
            )}
          >
            <Icon className="h-6 w-6" aria-hidden />
            <span className="mt-0.5 text-[11px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
