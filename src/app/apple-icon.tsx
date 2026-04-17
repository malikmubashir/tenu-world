// Dynamic Apple touch icon. Next serves this at /apple-icon.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1F3B2D",
          color: "#F8F4EC",
          fontSize: 120,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: -4,
          borderRadius: 36,
        }}
      >
        t
      </div>
    ),
    { ...size },
  );
}
