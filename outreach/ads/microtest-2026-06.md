# Google Ads micro-test — June/July 2026 (#T188)

Purpose: first paid-acquisition data point. docs/17 adjudicated that CAC > LTV is a
sustained risk with zero data in either direction; this test exists to produce the data,
not to scale. €150 total. If it fails, that is a result, not a loss.

## Campaign settings

| Setting | Value |
|---|---|
| Network | Google Search only (no Display, no Search Partners) |
| Geography | France |
| Language | French |
| Match type | Exact match only — 5 keywords, no broad/phrase |
| Budget | €5.00/day · €150 total cap (campaign auto-ends at cap, ~30 days max) |
| Bidding | Manual CPC or Maximize Clicks with €1.50 CPC ceiling |
| Landing page | `https://tenu.world/?src=ads-test&utm_campaign=microtest&utm_term=<keyword-slug>` |
| Timing | Live before 15 July launch window — exit season begins now (leases ending Jul–Oct) |

## The 5 exact-match queries

All five sit at the move-out / dispute moment — the exit-scan wedge, not the entry product.

| # | Keyword (exact) | Moment | utm_term | Ad description (≤90 chars) |
|---|---|---|---|---|
| 1 | [caution non rendue] | Dispute already live | `caution-non-rendue` | Votre caution se joue sur les preuves. Dossier photo analysé en deux minutes, dès 15 €. |
| 2 | [dépôt de garantie non restitué] | Dispute, legal phrasing (higher-intent searcher) | `dg-non-restitue` | Délai dépassé ? Constituez ce soir un dossier de preuves daté. Analyse IA dès 15 €. |
| 3 | [propriétaire ne rend pas la caution] | Dispute, colloquial phrasing | `proprio-rend-pas` | La conciliation gratuite prend 4 à 5 mois. Votre dossier de preuves est prêt ce soir. |
| 4 | [délai restitution dépôt de garantie] | The waiting window — tenant inside the 1–2 month clock | `delai-restitution` | Un à deux mois selon l'état des lieux. Préparez vos preuves avant de rendre les clés. |
| 5 | [lettre mise en demeure caution] | Letter intent — tests the €20 attach directly | `lettre-med` | Lettre fondée sur vos photos, prête pour l'envoi en recommandé AR. Sans abonnement. |

Headlines (30-char limit, shared across ads): `Caution locative — preuves` · `Dossier prêt ce soir` · `Dès 15 €, sans abonnement`.

Selection rationale vs. the brief's seed list: `[état des lieux de sortie litige]` was dropped
— low volume and ambiguous intent (matches landlords and agents as much as tenants).
Replaced with `[délai restitution dépôt de garantie]`: it is the exact moment the exit-scan
positioning targets (tenant waiting inside the statutory window, outcome not yet fixed), and
it is the highest-volume query of the five. `[propriétaire garde caution]` rephrased to the
natural search form `[propriétaire ne rend pas la caution]`.

Register check: no exclamation marks, no urgency tropes, no superlatives. Every line is a
factual statement. Line 3 is the CDC wedge verbatim from the homepage closing.

## Kill criteria

- **Per keyword:** at 20 clicks, if implied CAC exceeds €25 (spend ÷ paid conversions, or
  zero conversions with ≥ €25 spent on that keyword) → pause the keyword.
- **Campaign:** if all five keywords hit the kill criterion → stop, write up, do not re-fund.
  The €150 bought the answer.
- Do not "optimise" mid-test (no bid fiddling, no new keywords). One clean read.

## The one metric that matters

**Paid conversions attributed to `src=ads-test`** — completed Stripe payments, not clicks,
not signups. Everything else (CTR, CPC, impressions) is diagnostic noise.

Read it from `scripts/funnel-report.sql` (#T187 instrumentation, landed 2026-06-11):
`paid` stage counts filtered to attribution `src = 'ads-test'` / `utm_campaign = 'microtest'`,
against `public.funnel_events` on the eu-central Supabase. CAC = campaign spend ÷ that count.

> **Pre-flight check:** before funding the campaign, run one click-through end to end
> (landing with `?src=ads-test&utm_campaign=microtest` → signup → test-mode payment) and
> confirm the `paid` event carries the attribution. If attribution does not survive to the
> `paid` row, the test produces spend data and no CAC — do not launch until it does.

## Read-out (fill at cap or kill)

| Metric | Value |
|---|---|
| Spend | |
| Clicks (per keyword) | |
| Paid conversions (src=ads-test) | |
| CAC | |
| Scan→letter attach rate within cohort | |
| Decision | scale / reshape / stop |
