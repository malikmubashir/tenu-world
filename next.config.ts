import type { NextConfig } from "next";

/**
 * Dual-mode Next.js config.
 *
 *   npm run build            — web build, SSR + API routes, deployed to Vercel.
 *   npm run build:mobile     — static export to ./out for Capacitor native shell.
 *                              Sets MOBILE_BUILD=1. API routes are NOT in the
 *                              mobile bundle; the app calls tenu.world/api/*
 *                              over the network.
 *
 * Mobile-safe routes live under /(mobile)/app-home/* and are pure client
 * components. Anything using `cookies()`, `headers()`, or async server
 * components will fail `next build` with MOBILE_BUILD=1.
 */
const isMobileBuild = process.env.MOBILE_BUILD === "1";

const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "tenu.world",
      },
    ],
    // Static export cannot use the Next image optimizer — disable it
    // when building for mobile so <Image /> emits plain <img>.
    unoptimized: isMobileBuild,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Universal Links + App Links manifests must be served with a JSON
  // content type. The files sit in /public/.well-known/; Next serves
  // them verbatim, but Apple rejects the default content-type
  // (application/octet-stream on extensionless files). These headers
  // only apply to the web/Vercel build — MOBILE_BUILD=1 emits a static
  // export with no headers, but the mobile app doesn't consume these
  // files anyway (only Apple's CDN does).
  async headers() {
    if (isMobileBuild) return [];
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

const mobileConfig: NextConfig = {
  ...baseConfig,
  output: "export",
  distDir: "out",
  trailingSlash: true,
};

const nextConfig: NextConfig = isMobileBuild ? mobileConfig : baseConfig;

export default nextConfig;
