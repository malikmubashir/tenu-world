// Dynamic Web App Manifest. Next serves this at /manifest.webmanifest.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tenu.World — Your rights. Your language. Your deposit.",
    short_name: "Tenu",
    description:
      "AI-powered tenant rights companion for international renters in France and the UK.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F4EC",
    theme_color: "#1F3B2D",
    orientation: "portrait",
    categories: ["legal", "productivity", "utilities"],
    lang: "en",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
