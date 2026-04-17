# DPA Archive — Tenu.World Sub-processors

**Purpose.** Physical evidence trail of signed Data Processing Agreements (DPA) with each sub-processor listed in the privacy policy. Useful for a CNIL or ICO audit, for investor due diligence, and for answering customer security questionnaires.

**Rule.** Every sub-processor named in `/docs/legal-drafts/privacy-fr.md` section 6 must have one PDF in this folder by end of Week 4 of build (2026-05-01).

**File naming convention.** `YYYY-MM-DD_vendor_dpa.pdf` (e.g. `2026-04-18_supabase_dpa.pdf`).

## Status register

| Vendor | Action to take | Where to request | Target date | Status | File |
|---|---|---|---|---|---|
| Supabase | Download signed DPA PDF from dashboard, countersign, re-upload | Project Settings → Legal → DPA | 2026-04-20 | Pending | — |
| Cloudflare | Download SCC module 2 PDF | Dashboard → Manage Account → Legal | 2026-04-20 | Pending | — |
| Stripe | Request via `legal@stripe.com` or dashboard compliance section | Dashboard → Settings → Compliance | 2026-04-22 | Pending | — |
| Vercel | Download DPA from dashboard | Team Settings → Legal → DPA | 2026-04-22 | Pending | — |
| Brevo | Request when signing up (comes in welcome flow) | `https://www.brevo.com/legal/agreements/` | 2026-04-25 | Pending | — |
| Anthropic | Sign SCC module 2 via workspace settings or email `legal@anthropic.com` | Anthropic Console → Settings → Legal | 2026-04-25 | Pending | — |

## Dashboard data-residency checklist (do these tonight)

- [ ] Supabase project in Frankfurt (`eu-central-1`). Settings → General → Region.
- [ ] Cloudflare R2 bucket Location Hint = EU. Settings → Jurisdiction = EU.
- [ ] Vercel Project Region = `cdg1` (Paris). Project Settings → Functions.
- [ ] Stripe account registered under Stripe Technology Europe Ltd. (Dublin). Account Settings → Legal entity.

When all four are ticked, Tenu has EU-only data residency without negotiating any bespoke DPA.

## Change log

| Date | Change |
|---|---|
| 2026-04-17 | Archive folder created, register seeded with 6 vendors and dashboard checklist |
