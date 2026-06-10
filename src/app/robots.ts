// Next.js auto-serves this file at /robots.txt at build time.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
//
// Strategy: explicit allow for marketing surface (/, /pricing) and llms.txt.
// Explicit disallow for all user-specific and API routes. AI crawlers are
// listed individually because their directives default to allow, and some
// site operators want them blocked — we want them indexed.
import type { MetadataRoute } from "next";

// Force static for output: 'export' (MOBILE_BUILD=1) compatibility.
export const dynamic = "force-static";

const SITE = "https://tenu.world";

const disallow = [
  "/api/",
  "/auth/",
  "/inspection/",
  "/app-home/",
  // 2026-06-10: /legal/ unblocked — v1.0 shipped (DRAFT stripped), pages are
  // public, in the sitemap, and referenced by llms.txt. Blocking them while
  // llms.txt linked AI crawlers to them was self-contradictory.
];

const allow = ["/", "/pricing", "/stories", "/features", "/legal", "/llms.txt", "/llms-full.txt"];

const aiBots = [
  "GPTBot",            // OpenAI
  "OAI-SearchBot",     // OpenAI search
  "ChatGPT-User",      // OpenAI browsing
  "ClaudeBot",         // Anthropic
  "Claude-Web",        // Anthropic web
  "Claude-SearchBot",  // Anthropic search
  "Google-Extended",   // Google Gemini
  "PerplexityBot",     // Perplexity
  "Perplexity-User",   // Perplexity browsing
  "Applebot-Extended", // Apple Intelligence
  "CCBot",             // Common Crawl (feeds most training sets)
  "Amazonbot",         // Amazon
  "Bytespider",        // ByteDance / TikTok
  "cohere-ai",         // Cohere
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow,
        disallow,
      },
      ...aiBots.map((bot) => ({
        userAgent: bot,
        allow,
        disallow,
      })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
