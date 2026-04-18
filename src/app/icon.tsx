// Dynamic favicon. Next serves this at /icon.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
//
// Carries Tenu Identity v1 (Mark 01 — Disc). Rendered through Satori
// as stacked primitives instead of an SVG <mask>, because Satori
// doesn't support masks. Visual result is identical: Paper canvas,
// Tenu Ink disc, Paper figure on top (head + arms + body).
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const INK = "#0B1F3A";
const PAPER = "#F4F1EA";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: PAPER,
        }}
      >
        <svg viewBox="0 0 48 48" width="32" height="32">
          {/* Navy container */}
          <circle cx="24" cy="24" r="22" fill={INK} />
          {/* Figure painted in Paper on top of the disc */}
          <circle cx="24" cy="13" r="4" fill={PAPER} />
          <rect
            x="11"
            y="22.4"
            width="26"
            height="2.2"
            rx="1.1"
            fill={PAPER}
          />
          <rect
            x="22.9"
            y="23.5"
            width="2.2"
            height="18"
            rx="1.1"
            fill={PAPER}
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
