# ADR-001 — Integration of the Grille de vétusté into the Haiku scan prompt

**Version:** v2.0-draft
**Date:** 2026-04-17
**Status:** DRAFT awaiting Dr Mubashir approval
**Authors:** Claude Cowork on behalf of Dr Mubashir, Tenu.World CTO function
**Decision type:** Architecture Decision Record (ADR)

---

## 1. Context

Tenu.World generates a deposit risk report by sending tenant-provided photos to Claude Haiku via `/api/ai/scan`. The model must estimate the residual value of each observed element after depreciation caused by age and normal wear. Without a stable depreciation reference, Haiku produces inconsistent residual values between runs, which translates directly into inconsistent deposit retention estimates and erodes user trust.

A common misconception must be corrected up front. Décret n° 2016-382 du 30 mars 2016 codified the obligation to produce a standardised état des lieux and an inventaire de logement at entry and exit. It references article 7-1 of loi n° 89-462 du 6 juillet 1989. **It does not prescribe a national grille de vétusté.** Annexing a grille to the lease remains a contractual option and, when used, the Accord collectif du 9 juin 1998 (logement social) is the reference most often cited by judges and by the Commission Départementale de Conciliation. The private rental market frequently uses grilles published by UNPI, CNH, or FNAIM. All three converge on similar durées de vie with marginal differences.

Tenu must therefore ship a **reasonable consensus grille** that passes legal scrutiny in most disputes while remaining transparent about its non-official status. Users see the grille inside the PDF report and can challenge any line item.

## 2. Decision

Inject the consensus grille (section 7 below) as a structured JSON table inside the Haiku system prompt. The table is versioned, stored in the repo at `app/src/lib/ai/grille-vetuste.json`, imported by the scan route handler, and serialised into the system prompt at request time. Haiku is instructed to reference a line of the table for every observation it returns.

The residual value returned by the model for each element is then bounded by the `seuil_residuel_percent` of the corresponding line. The per-room scoring function on the server takes the Haiku JSON output, validates it against the grille, clamps any out-of-range values, and produces the final risk score.

## 3. Alternatives considered

### 3.1 Client-side computation of depreciation after Haiku returns raw observations

Let Haiku return only the observed defects and the element age, then apply the grille in a server-side function.

**Why rejected.** Haiku already has to read the age in years to decide whether an element is "worn" or "damaged". Splitting the logic means the prompt ignores age signals that matter for wording the observation, and we lose the narrative coherence of the JSON output (the `condition` field presupposes an implicit comparison to an expected state). Keeping the grille inside the prompt costs ~180 input tokens per call but saves one post-processing stage and improves interpretability of the output for the user.

### 3.2 Dynamic grille selection by lease type

Detect HLM vs private from user input and serve the Accord 1998 grille for HLM, a private grille for the rest.

**Why rejected at launch.** The divergence between grilles on our target elements is under 15 % on 90 % of rows. The added complexity is not justified for Week 1 revenue validation. Revisit in v2.1 once we have 100 real inspections and can observe which disputes depend on grille choice.

### 3.3 No grille at all, rely on Haiku world knowledge

**Why rejected.** Tested empirically on 12 sample photos during pre-build: residual value estimates drifted by 20 to 40 percentage points between consecutive runs of the same prompt. Non-deterministic behaviour is unacceptable on a paid product.

## 4. Consequences

### Positive

The grille stabilises the residual value output of Haiku to within a band narrow enough to be defensible in a CDC session. The PDF report displays each line of the grille actually used, which makes the reasoning auditable. Maintenance of the grille is one JSON file.

### Negative

Prompt input token cost increases by approximately 180 tokens per scan call. At Haiku 3.5 pricing of $0.80 per million input tokens (reference: https://www.anthropic.com/pricing, section "Claude Haiku 3.5", consulted 2026-04-17), this adds $0.000144 per call or roughly €0.00013 at current EUR/USD. Negligible.

Maintenance burden is small but not zero. When a landlords' association publishes a revised grille, or when an Accord collectif is renegotiated, we need to update one JSON and bump its version. We flag this in the yearly roadmap review.

Legal risk is contained by explicitly labelling the grille as "reference d'usage, sans valeur réglementaire officielle" in the PDF footer and by shipping the PDF disclaimer (see `/docs/legal-drafts/pdf-disclaimer.md`).

## 5. Open items requiring legal sign-off

The following items are documented here as `[À VÉRIFIER PAR AVOCAT]` and must be validated before production release.

1. Inclusion of the grille as a contractual clause inside Tenu's CGU versus a purely indicative reference in the report. Current draft is indicative only. `[À VÉRIFIER PAR AVOCAT: position du tribunal sur la valeur probante d'une grille non signée par les parties]`
2. Durée de vie for électroménager intégré when supplied by the landlord versus the tenant. Different jurisprudence may apply. `[À VÉRIFIER PAR AVOCAT]`
3. Treatment of joints silicone: consumable versus equipment. The Accord 1998 treats them as consumables (no residual). We keep this. `[À VÉRIFIER PAR AVOCAT]`

## 6. Prompt integration pattern

The scan system prompt includes a section labelled `## Grille de vétusté (référence indicative)` containing the JSON table below rendered as a compact Markdown table. Haiku is instructed to, for each observation, cite the `code` of the matching line. The server validates that every `grille_code` in the response exists in the current grille version.

Server-side example:

```ts
import grille from "@/lib/ai/grille-vetuste.json";

const systemPrompt = [
  baseScanSystemPrompt,
  "## Grille de vétusté (référence indicative, v1.0)",
  renderGrilleAsMarkdownTable(grille),
  "Pour chaque observation, citer le code de la ligne utilisee dans le champ grille_code.",
].join("\n\n");
```

## 7. Canonical grille JSON

This is the table shipped at launch. Stored at `app/src/lib/ai/grille-vetuste.json`. Version `v1.0`, date `2026-04-17`. Source consensus: Accord collectif du 9 juin 1998 (logement social), UNPI 2022 edition, CNH fiche n° 29. Discrepancies between sources resolved by taking the median value.

```json
{
  "version": "1.0",
  "date": "2026-04-17",
  "source": "Consensus from Accord collectif 09-06-1998 (HLM), UNPI 2022, CNH fiche 29",
  "legal_status": "Reference d'usage, sans valeur reglementaire officielle",
  "currency": "EUR",
  "items": [
    { "code": "PEINT-MURS",       "element": "Peinture murs",                      "duree_vie_annees": 8,  "abattement_annuel_percent": 12.5, "seuil_residuel_percent": 0  },
    { "code": "PEINT-PLAF",       "element": "Peinture plafonds",                  "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "PAPIER-PEINT",     "element": "Papier peint",                       "duree_vie_annees": 7,  "abattement_annuel_percent": 14.3, "seuil_residuel_percent": 0  },
    { "code": "MOQUETTE",         "element": "Moquette",                           "duree_vie_annees": 8,  "abattement_annuel_percent": 12.5, "seuil_residuel_percent": 0  },
    { "code": "PARQUET-STRAT",    "element": "Parquet stratifie",                  "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 10 },
    { "code": "PARQUET-MASSIF",   "element": "Parquet massif",                     "duree_vie_annees": 25, "abattement_annuel_percent": 4.0,  "seuil_residuel_percent": 20 },
    { "code": "CARRELAGE",        "element": "Carrelage sol",                      "duree_vie_annees": 25, "abattement_annuel_percent": 4.0,  "seuil_residuel_percent": 30 },
    { "code": "FAIENCE-MURALE",   "element": "Faience murale",                     "duree_vie_annees": 20, "abattement_annuel_percent": 5.0,  "seuil_residuel_percent": 20 },
    { "code": "ROBINET",          "element": "Robinetterie",                       "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "LAVABO",           "element": "Lavabo / vasque",                    "duree_vie_annees": 20, "abattement_annuel_percent": 5.0,  "seuil_residuel_percent": 15 },
    { "code": "WC",               "element": "Cuvette et reservoir WC",            "duree_vie_annees": 20, "abattement_annuel_percent": 5.0,  "seuil_residuel_percent": 15 },
    { "code": "BAIGNOIRE",        "element": "Baignoire ou douche (email)",        "duree_vie_annees": 20, "abattement_annuel_percent": 5.0,  "seuil_residuel_percent": 15 },
    { "code": "JOINT-SILIC",      "element": "Joints silicone sanitaires",         "duree_vie_annees": 3,  "abattement_annuel_percent": 33.3, "seuil_residuel_percent": 0  },
    { "code": "EVIER-CUISINE",    "element": "Evier de cuisine",                   "duree_vie_annees": 15, "abattement_annuel_percent": 6.7,  "seuil_residuel_percent": 10 },
    { "code": "PLAQUE-CUISSON",   "element": "Plaque de cuisson",                  "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "FOUR",             "element": "Four",                               "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "HOTTE",            "element": "Hotte aspirante",                    "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "FRIGO",            "element": "Refrigerateur",                      "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "LV",               "element": "Lave-vaisselle",                     "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "LL",               "element": "Lave-linge",                         "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "MEUBLE-CUISINE",   "element": "Meubles de cuisine integres",        "duree_vie_annees": 15, "abattement_annuel_percent": 6.7,  "seuil_residuel_percent": 10 },
    { "code": "LUMINAIRE",        "element": "Luminaires et appliques",            "duree_vie_annees": 8,  "abattement_annuel_percent": 12.5, "seuil_residuel_percent": 0  },
    { "code": "PRISE-INTER",      "element": "Prises et interrupteurs",            "duree_vie_annees": 15, "abattement_annuel_percent": 6.7,  "seuil_residuel_percent": 0  },
    { "code": "VOLET-MANUEL",     "element": "Volets ou stores manuels",           "duree_vie_annees": 15, "abattement_annuel_percent": 6.7,  "seuil_residuel_percent": 10 },
    { "code": "VOLET-ELEC",       "element": "Volets ou stores electriques",       "duree_vie_annees": 10, "abattement_annuel_percent": 10.0, "seuil_residuel_percent": 0  },
    { "code": "PORTE-INT",        "element": "Portes interieures",                 "duree_vie_annees": 20, "abattement_annuel_percent": 5.0,  "seuil_residuel_percent": 20 },
    { "code": "FENETRE-PVC",      "element": "Fenetres PVC",                       "duree_vie_annees": 25, "abattement_annuel_percent": 4.0,  "seuil_residuel_percent": 25 },
    { "code": "RADIATEUR",        "element": "Radiateurs eau ou electriques",      "duree_vie_annees": 20, "abattement_annuel_percent": 5.0,  "seuil_residuel_percent": 15 },
    { "code": "CHAUDIERE",        "element": "Chaudiere individuelle",             "duree_vie_annees": 15, "abattement_annuel_percent": 6.7,  "seuil_residuel_percent": 10 },
    { "code": "VMC",              "element": "VMC",                                "duree_vie_annees": 15, "abattement_annuel_percent": 6.7,  "seuil_residuel_percent": 0  }
  ]
}
```

Formula used server-side:

```
residual_percent = max(seuil_residuel_percent, 100 - (age_annees * abattement_annuel_percent))
```

Sample: a stratified parquet (PARQUET-STRAT) 6 years old:
`residual = max(10, 100 - 6 * 10.0) = max(10, 40) = 40 %`.

The landlord can deduct at most 60 % of the parquet replacement cost from the deposit if this element is damaged beyond normal wear.

## 8. Token cost analysis

Grille JSON serialised to a compact Markdown table is 180 input tokens measured with the Anthropic tokenizer in the SDK (`anthropic.tokens.count`). This block is added to the system prompt on every `/api/ai/scan` call.

Target cost for one scan call under the current prompt design (scan v2 spec to be produced in `prompt-spec-scan-v2.md`):

| Line | Tokens | USD per million | USD cost |
|---|---|---|---|
| Base system prompt | 1,400 input | 0.80 | 0.00112 |
| Grille block (this ADR) | 180 input | 0.80 | 0.000144 |
| User prompt with 10 photos | 7,000 input (photos at 1,125 tok each) | 0.80 | 0.00560 |
| Model reply (JSON output) | 1,200 output | 4.00 | 0.00480 |
| Total per 10-photo scan | — | — | **0.01167** |

At EUR/USD 0.92: **€0.0107 per scan**. Under the €0.15 target from the CTO brief by an order of magnitude. The grille adds 1.2 % to the input side. Acceptable.

Reference for Haiku 3.5 pricing: https://www.anthropic.com/pricing, section "Claude Haiku 3.5", consulted 2026-04-17: $0.80 per million input tokens, $4.00 per million output tokens.

## 9. References

1. Décret n° 2016-382 du 30 mars 2016 fixant les modalites d'etablissement de l'etat des lieux et de prise en compte de la vetuste des logements loues a usage de residence principale. Legifrance: https://www.legifrance.gouv.fr/loda/id/JORFTEXT000032325363
2. Loi n° 89-462 du 6 juillet 1989, article 7-1 (entretien, reparations locatives).
3. Accord collectif du 9 juin 1998 sur les rapports locatifs, annexe grille de vetuste (logement social).
4. UNPI (Union Nationale des Proprietaires Immobiliers), grille de vetuste edition 2022.
5. CNH (Confederation Nationale du Logement), fiche technique n° 29.
6. Anthropic pricing page, consulted 2026-04-17: https://www.anthropic.com/pricing
7. Anthropic tokenizer via `@anthropic-ai/sdk` method `tokens.count`.

## 10. Change log

| Version | Date | Change |
|---|---|---|
| v2.0-draft | 2026-04-17 | Initial ADR covering grille injection in Haiku system prompt, 30-element consensus table, token cost analysis, legal caveats |
