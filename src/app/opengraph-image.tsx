// Dynamically generates the site-wide default Open Graph image (1200x630).
// Next.js serves this at /opengraph-image and reuses it for twitter-image.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tenu — Your rights, your language, your deposit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #F8F4EC 0%, #EDE4D2 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#1F3B2D",
              letterSpacing: -1.5,
            }}
          >
            tenu
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#1F3B2D",
              opacity: 0.6,
              marginTop: 20,
            }}
          >
            .world
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#1F3B2D",
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            Your rights.
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#1F3B2D",
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            Your language.
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#D98E4C",
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            Your deposit.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div
            style={{
              fontSize: 24,
              color: "#1F3B2D",
              opacity: 0.75,
              maxWidth: 700,
              lineHeight: 1.3,
            }}
          >
            AI risk scan and dispute letters for tenants in France and the UK.
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#1F3B2D",
              opacity: 0.5,
            }}
          >
            tenu.world
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
