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
    // Identity v1: Paper canvas, Tenu Ink chrome.
    background_color: "#F4F1EA",
    theme_color: "#0B1F3A",
    orientation: "portrait",
    categories: ["legal", "productivity", "utilities"],
    lang: "en",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
