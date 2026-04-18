/**
 * TenuMark — the parametric Tenu identity mark.
 *
 * The mark is a fixed human-figure silhouette (globe head + arms +
 * body) carved out of a swappable container shape. Same figure, 11
 * container variants — the system the Identity v1 designer shipped.
 *
 * Figure geometry (all measured on a 48×48 canvas):
 *   head  : circle cx=24 cy=13 r=4.9
 *   arms  : rounded bar x=11 y=22.4 w=26 h=2.2 r=1.1
 *   body  : rounded bar x=22.9 y=23.5 w=2.2 h=18 r=1.1
 *
 * Default palette is Identity v1:
 *   fill    = Tenu Ink   #0B1F3A
 *   carve   = Paper      #F4F1EA
 * Override via props for inverted, monotone, or accent variants.
 *
 * Accessibility: pass `title` to set an accessible label. If omitted
 * the SVG is marked aria-hidden so it reads as decorative (use next
 * to a text wordmark).
 */

import * as React from "react";

export type TenuContainer =
  | "disc"
  | "oval"
  | "square"
  | "arch"
  | "vesica"
  | "crescent"
  | "flag"
  | "hex"
  | "shield"
  | "rounded"
  | "portal";

export interface TenuMarkProps {
  /** Container shape. Default `disc` (Mark 01 — primary). */
  container?: TenuContainer;
  /** Container fill colour. Default Tenu Ink `#0B1F3A`. */
  fill?: string;
  /** Background / carve-through colour. Default Paper `#F4F1EA`. */
  carve?: string;
  /**
   * Whether to paint the small head disc on top. Default true.
   * Keep it on for readability against non-Paper backgrounds.
   */
  showHeadOverlay?: boolean;
  /** Pixel size. Default 48. Use integer multiples for crispness. */
  size?: number;
  /** Accessible label. If set, the SVG is announced. */
  title?: string;
  /** Extra className hook for layout / Tailwind utilities. */
  className?: string;
}

/**
 * The 11 container variants. Each path/shape MUST fully enclose the
 * figure geometry above, otherwise the carve will bleed past the edge.
 */
function Container({ kind }: { kind: TenuContainer }) {
  switch (kind) {
    case "disc":
      return <circle cx="24" cy="24" r="22" />;
    case "oval":
      return <ellipse cx="24" cy="24" rx="20" ry="22.5" />;
    case "square":
      return <rect x="2" y="2" width="44" height="44" rx="6" />;
    case "arch":
      return <path d="M 3 46 V 22 A 21 21 0 0 1 45 22 V 46 Z" />;
    case "vesica":
      return <path d="M 24 2 C 40 8 40 40 24 46 C 8 40 8 8 24 2 Z" />;
    case "crescent":
      return <path d="M 24 2 A 22 22 0 1 0 24 46 A 16 16 0 1 1 24 2 Z" />;
    case "flag":
      return <path d="M 2 2 H 46 L 38 24 L 46 46 H 2 Z" />;
    case "hex":
      return <path d="M 24 2 L 44 13 L 44 35 L 24 46 L 4 35 L 4 13 Z" />;
    case "shield":
      return (
        <path d="M 24 2 L 44 8 V 26 C 44 38 35 44 24 46 C 13 44 4 38 4 26 V 8 Z" />
      );
    case "rounded":
      return <rect x="2" y="2" width="44" height="44" rx="22" />;
    case "portal":
      return <path d="M 4 46 V 24 A 20 20 0 0 1 44 24 V 46 Z" />;
  }
}

export default function TenuMark({
  container = "disc",
  fill = "#0B1F3A",
  carve = "#F4F1EA",
  showHeadOverlay = true,
  size = 48,
  title,
  className,
}: TenuMarkProps) {
  // Unique mask id so multiple marks on the same page don't collide.
  const reactId = React.useId();
  const maskId = `tenu-cut-${reactId.replace(/:/g, "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      <rect width="48" height="48" fill={carve} />
      <defs>
        <mask id={maskId}>
          <rect width="48" height="48" fill="white" />
          {/* The figure silhouette — punched out of the container. */}
          <circle cx="24" cy="13" r="4.9" fill="black" />
          <rect x="11" y="22.4" width="26" height="2.2" rx="1.1" fill="black" />
          <rect
            x="22.9"
            y="23.5"
            width="2.2"
            height="18"
            rx="1.1"
            fill="black"
          />
        </mask>
      </defs>
      <g fill={fill} mask={`url(#${maskId})`}>
        <Container kind={container} />
      </g>
      {showHeadOverlay && <circle cx="24" cy="13" r="4" fill={carve} />}
    </svg>
  );
}
