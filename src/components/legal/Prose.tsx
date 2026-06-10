// Tailwind-based prose primitives used by legal route files.
// We avoid @tailwindcss/typography to keep bundle small; these are hand-tuned.
// Éditorial v2 (#T149): ink on white, hairline table rules, no fills,
// no radius. Content (copy) is untouched — chrome only.
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 text-2xl font-normal tracking-tight text-tenu-ink">{children}</h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 ps-6">{children}</ul>;
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2 ps-6">{children}</ol>;
}

export function LI({ children }: { children: ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function TH(props: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className="border border-tenu-hairline px-3 py-2 text-start font-medium text-tenu-ink"
    />
  );
}

export function TD(props: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className="border border-tenu-hairline px-3 py-2 align-top"
    />
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <aside className="border border-tenu-ink-muted p-4 text-sm text-tenu-ink">
      {children}
    </aside>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <code className="border border-tenu-hairline px-1 py-0.5 font-mono text-xs text-tenu-ink">
      {children}
    </code>
  );
}
