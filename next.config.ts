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
  // Universal Links + App Links manifests are served from
  // src/app/.well-known/*/route.ts — the route handlers set the
  // Content-Type themselves, so no config-level headers are needed.
};

const mobileConfig: NextConfig = {
  ...baseConfig,
  output: "export",
  distDir: "out",
  trailingSlash: true,
};

const nextConfig: NextConfig = isMobileBuild ? mobileConfig : baseConfig;

export default nextConfig;
