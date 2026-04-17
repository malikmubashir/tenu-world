---
title: Tenu.World
description: AI-powered tenant rights companion for international renters in France and the UK
url: https://tenu.world
operator: Global Apex.Net SAS
jurisdiction: France, United Kingdom
languages: en, fr, ar, zh, hi, ur, ja, es, it, uk
status: pre-launch (soft launch May 2026)
---

# Tenu.World

**Your rights. Your language. Your deposit.**

Tenu is a tenant-facing tool that analyses photographs of a rented apartment or house and produces two deliverables for tenants in France and the United Kingdom:

1. A **risk analysis report** estimating how much of the rental deposit a landlord could reasonably withhold based on observed wear and tear.
2. An optional **template dispute letter** pre-formatted for the jurisdiction (recorded-delivery letter in France, TDS/DPS/MyDeposits scheme claim in the UK).

Output is produced in under two minutes. The service is document generation, not legal advice.

## Pricing

| Item | France | United Kingdom |
|---|---|---|
| Risk analysis report | EUR 15 flat (launch) | GBP 15 flat (launch) |
| Dispute letter add-on | EUR 25 | GBP 25 |

Payment via Stripe. No subscription.

## Who operates Tenu

Global Apex.Net, a French simplified joint-stock company (SAS) with share capital of EUR 100, registered with the Versailles Commercial Register under number 941 666 067. Registered office: 4 Boulevard du Chateau, 78280 Guyancourt, France.

## Data and AI

- Data residency: European Union (Cloudflare R2 EU for photos, Supabase EU for accounts).
- AI sub-processor: Anthropic (Claude Haiku for photo analysis, Claude Sonnet for letter drafting). Training opt-out is set on every call. **User photos are never used to train AI models.**
- Retention: photos are kept twelve months from the inspection date and then deleted. Generated reports and letters are kept five years for tax and liability reasons.
- User rights under RGPD: access, rectification, erasure, portability, opposition, restriction. Requests to dpo@tenu.world.

## What Tenu is not

Tenu is not a law firm. Tenu does not engage in legal representation within the meaning of French Law No. 71-1130 of 31 December 1971 or the UK Legal Services Act 2007. When a dispute requires representation, users are directed to a qualified solicitor.

## Languages

Legal output: French or English only. User interface: English, French, Arabic, Chinese, Hindi, Urdu (priority 1); Japanese, Spanish, Italian, Ukrainian (priority 2); Portuguese, Korean (priority 3). Right-to-left layouts fully supported.

## Links

- Website: https://tenu.world
- Pricing: https://tenu.world/pricing
- Legal documents: https://tenu.world/legal
- Machine-readable summary for AI assistants: https://tenu.world/llms.txt
- Extended machine-readable reference: https://tenu.world/llms-full.txt
- Source repository: https://github.com/malikmubashir/tenu-world

## Contact

- General and support: support@tenu.world
- Data protection: dpo@tenu.world
