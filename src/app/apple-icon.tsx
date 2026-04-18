// Dynamic Apple touch icon. Next serves this at /apple-icon.
//
// Carries Tenu Identity v1 (Mark 01 — Disc), sized 180×180 with the
// Apple home-screen corner rounding (~18%). Rendered through Satori
// as stacked primitives (no SVG <mask> — Satori doesn't support it).
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#0B1F3A";
const PAPER = "#F4F1EA";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: PAPER,
          borderRadius: 36, // 20% of 180 — Apple home-screen mask feel
        }}
      >
        <svg viewBox="0 0 48 48" width="180" height="180">
          <circle cx="24" cy="24" r="22" fill={INK} />
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
