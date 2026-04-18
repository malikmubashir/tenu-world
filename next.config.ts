import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  // Server Actions are not supported with output: 'export'. They live
  // only in the Vercel web deploy; the mobile shell calls tenu.world
  // API routes directly over HTTPS.
  ...(isMobileBuild
    ? {}
    : {
        experimental: {
          serverActions: {
            bodySizeLimit: "10mb",
          },
        },
      }),
  // Universal Links + App Links manifests are served from
  // src/app/.well-known/*/route.ts — the route handlers set the
  // Content-Type themselves, so no config-level headers are needed.
  //
  // Mobile static export: swap Server Action modules for stubs so
  // transitive imports (GlobalHeader → UserMenu → actions/auth)
  // resolve during the mobile build even though actions/ has been
  // moved aside by scripts/build-mobile.sh.
  webpack: (config) => {
    if (isMobileBuild) {
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        "@/app/actions/auth": path.resolve(
          __dirname,
          "src/lib/mobile/stubs/auth-actions.ts",
        ),
      };
    }
    return config;
  },
};

const mobileConfig: NextConfig = {
  ...baseConfig,
  output: "export",
  distDir: "out",
  trailingSlash: true,
  // Web-only surfaces (actions/, account/, inspection/*, etc.) are
  // stashed by scripts/build-mobile.sh, which breaks TypeScript path
  // resolution for @/app/actions/auth (the webpack alias handles
  // bundling, but tsc runs separately against tsconfig.json).
  // The web build still typechecks the full tree, so this only skips
  // a redundant second pass.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

const nextConfig: NextConfig = isMobileBuild ? mobileConfig : baseConfig;

export default nextConfig;
