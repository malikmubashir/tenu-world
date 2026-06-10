// Next.js auto-serves this file at /sitemap.xml at build time.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
// Regenerate by redeploying. Do not edit /sitemap.xml directly in the build output.
import type { MetadataRoute } from "next";

// Force static for output: 'export' (MOBILE_BUILD=1) compatibility.
export const dynamic = "force-static";

const SITE = "https://tenu.world";

// Decision: DRAFT legal pages are EXCLUDED from the sitemap and marked noindex
// at the route level. Reason: we don't want Google caching draft content that
// will be revised before commercial launch. Flip these on once v1.0-final
// is signed off by counsel.
// 2026-06-10: flipped to true — legal v1.0 shipped (DRAFT banners stripped),
// pages are public and referenced by llms.txt; they belong in the index.
const INCLUDE_DRAFT_LEGAL = true;

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const core: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE}/pricing`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  // Content surface (added 2026-06-10): the ranking pages for tenant-rights
  // queries. Stories = case studies, features = product explainers.
  const content: MetadataRoute.Sitemap = [
    { url: `${SITE}/stories`, lastModified: today, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/stories/suzi`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/stories/samir`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/features/onboarding`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/features/evidence`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/features/rights`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/features/scan`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/features/dispute`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/features/followup`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
  ];
  core.push(...content);

  if (!INCLUDE_DRAFT_LEGAL) {
    return core;
  }

  const legal: MetadataRoute.Sitemap = [
    { url: `${SITE}/legal`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/legal/privacy/fr`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/legal/privacy/en`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/legal/terms/fr`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/legal/terms/en`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/legal/refund/fr`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/legal/refund/en`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [...core, ...legal];
}
