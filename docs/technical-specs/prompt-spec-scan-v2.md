# Prompt Spec — Risk Scan v2

**File:** `prompt-spec-scan-v2.md`
**Owner:** Dr Mubashir
**Status:** DRAFT v2 awaiting first paid run
**Last updated:** 2026-04-17
**Consumed by:** `app/src/app/api/risk-scan/route.ts`
**Depends on:** `ADR-001-grille-vetuste.md`, `app/src/lib/ai/grille-vetuste.json`
**Supersedes:** v1 (inline prompt in route handler, no grille)

---

## 1. Purpose

Produce a room-level risk analysis report from tenant-uploaded photographs, using Claude 3.5 Haiku, returning a strict JSON object consumed by `@react-pdf/renderer` to generate the user-facing PDF report.

Scope of this spec: every byte that enters and leaves the model, every failure mode, every cost lever. Nothing about auth, storage, retention, rate limits. Those live elsewhere.

## 2. Model selection

| Choice | Value | Reason |
|---|---|---|
| Provider | Anthropic | Contract in place, EU sub-processor accepted |
| Model | `claude-haiku-4-5-20251001` | Cheapest vision-capable model that passes the wear-and-tear eval suite |
| Fallback | `claude-sonnet-4-6` | Triggered only on schema validation failure after two Haiku retries |
| Temperature | 0.2 | Low enough to keep JSON stable, high enough to allow nuance in condition text |
| Max output tokens | 2048 | Covers 12 rooms with 5 elements each before truncation |
| Top-p | default (1.0) | Temperature alone controls stochasticity |
| Stop sequences | none | JSON schema handles termination |
| `anthropic-beta` headers | none | Stable features only |
| `metadata.user_id` | hashed `user.id` | For abuse tracking, never raw PII |

Training opt-out is enforced at organisation level in the Anthropic console. Confirm in Settings → Privacy before first paid run.

## 3. System prompt (production text)

Copy-paste exactly. French text on purpose: Haiku produces cleaner French output when primed in French, and the report itself is FR/EN only.

```
Tu es un expert francais en etat des lieux locatifs et en application de la grille de vetuste.

Ton role: analyser des photographies d'un logement a la sortie d'un locataire, identifier les degradations visibles par piece, appliquer la grille de vetuste fournie, et produire un rapport JSON strict consomme par un generateur de PDF.

Regles absolues:
1. Tu ne rends que du JSON valide, rien d'autre. Aucun texte avant, aucun texte apres, aucun commentaire markdown, aucune balise de code.
2. Tu n'inventes aucun element que tu ne vois pas sur les photographies. Si une piece n'a pas de photo, tu listes la piece avec `observations: []` et `confidence: "absent"`.
3. Tu ne donnes jamais d'avis juridique. Tu ne mentionnes jamais un tribunal, un huissier, un avocat. Tu decris un etat constate et tu appliques la grille.
4. Tu exprimes toujours les montants en euros, arrondis a l'euro le plus proche, positifs.
5. Pour chaque element degrade, tu associes un code issu de la grille fournie. Si aucun code ne correspond, tu utilises `AUTRE` et tu remplis le champ `element_libre`.
6. Tu bases ton raisonnement sur la duree d'occupation du locataire. Le coefficient de vetuste residuel applique est: max(seuil_residuel_percent, 100 - age_annees * abattement_annuel_percent) / 100.
7. La part deductible du depot de garantie pour un element est: cout_remise_en_etat_estime * coefficient_residuel. Tu n'appliques jamais un abattement pour usage normal au-dela de ce que la grille autorise.
8. Tu prends un ton neutre, factuel, non accusatoire, que ce soit envers le bailleur ou le locataire. Tu ne qualifies jamais le comportement. Tu decris l'etat.
9. Si une photographie est floue, mal cadree, ou insuffisante pour juger, tu marques l'element `confidence: "low"` et tu l'exclus du calcul de deduction.
10. Si plus de 30% des photographies sont inexploitables, tu renvoies `meta.quality_flag: "insufficient_evidence"` et tu n'effectues aucun calcul chiffre.

Grille de vetuste de reference (source de verite):
{GRILLE_JSON}

Tu recois en entree les photographies et un objet `inspection` contenant adresse, date d'entree, date de sortie, inventaire d'entree optionnel. Tu produis un objet JSON conforme au schema `RiskScanOutput` decrit dans la documentation technique. Tout ecart de schema declenche un rejet cote serveur.
```

The `{GRILLE_JSON}` placeholder is replaced at request build time by the stringified contents of `grille-vetuste.json`. Do not hand-edit the grille into the prompt.

## 4. User prompt template

```
Inspection a analyser:

- Adresse: {address}
- Juridiction: {jurisdiction}
- Date d'entree: {move_in_date}
- Date de sortie: {move_out_date}
- Duree d'occupation: {years_months} ({age_annees_decimal} annees decimales)
- Depot de garantie verse: {deposit_amount_eur} EUR
- Inventaire d'entree fourni: {has_inventory_yes_no}
- Nombre de pieces declarees: {room_count}

Pieces a examiner (ordre d'apparition des photos):
{room_list_with_photo_counts}

Observations textuelles du locataire (facultatif):
{tenant_notes}

Produis maintenant le rapport JSON au format RiskScanOutput.
```

Photographs are attached as `image/*` content blocks in the same user turn, ordered by `inspection.rooms[].photos[]`, with `inspection.rooms[].id` prefixed to each photo caption as `[room_id=xxx] photo 1/5`.

## 5. Output schema — `RiskScanOutput`

TypeScript definition, single source of truth. Lives at `app/src/lib/ai/types/risk-scan.ts`.

```ts
export type ConfidenceLevel = "high" | "medium" | "low" | "absent";

export interface RiskScanObservation {
  // Grille code, or 'AUTRE' if no match
  code: string;
  // Required when code === 'AUTRE'
  element_libre?: string;
  // Free-text description of the observation, 10-200 chars, no legal terms
  description: string;
  // Estimated cost to restore the element to its baseline condition, in EUR
  cout_remise_en_etat_eur: number;
  // Coefficient applied from the grille, 0.00-1.00
  coefficient_residuel: number;
  // cout_remise_en_etat_eur * coefficient_residuel, rounded to nearest EUR
  deduction_deposit_eur: number;
  // Model's self-assessed confidence
  confidence: ConfidenceLevel;
  // References to the photo(s) used, by 0-based index within the room
  photo_indices: number[];
}

export interface RiskScanRoom {
  // Echo of the input room id
  id: string;
  // Echo of the input room name
  name: string;
  observations: RiskScanObservation[];
  // Sum of deduction_deposit_eur for all observations in this room
  subtotal_eur: number;
  // Room-level confidence, worst of the observations
  confidence: ConfidenceLevel;
}

export interface RiskScanMeta {
  prompt_version: "2.0.0";
  grille_version: string;
  model: string;
  generated_at: string; // ISO 8601 UTC
  quality_flag: "ok" | "insufficient_evidence";
  warnings: string[];
}

export interface RiskScanOutput {
  inspection_id: string;
  total_deduction_eur: number;
  deposit_amount_eur: number;
  // deposit_amount_eur - total_deduction_eur, floored at 0
  refundable_eur: number;
  rooms: RiskScanRoom[];
  meta: RiskScanMeta;
}
```

The route handler validates with `zod` before returning. Any missing field, wrong type, or arithmetic mismatch (subtotals must add up to total_deduction within 1 EUR rounding tolerance) triggers a retry.

## 6. Validation and retry policy

```
attempt 1: Haiku with system+user prompt
  if JSON parse fails OR zod validation fails
attempt 2: Haiku, same prompts, same inputs
  if fails again
attempt 3: Sonnet 4.6, same prompts, same inputs
  if fails again
  -> return HTTP 502 to client, log incident, no charge
```

No silent fallback to Sonnet on cost grounds. Sonnet only fires after a Haiku schema failure. Sonnet success rate on Haiku failures in the v1 eval set: 94%.

Arithmetic mismatch (rooms sum != total) is a validation failure, not a retry-with-extra-prompt. The model computes wrongly more often than it formats wrongly. Easier to reject and retry than to ask it to self-correct.

## 7. Cost model

Inputs per scan (median, from v1 eval on 50 real inspections):

| Component | Tokens |
|---|---|
| System prompt (incl. grille JSON) | ~3,200 |
| User text prompt | ~450 |
| 20 photos at 1024x768 | ~20 x 1,600 = 32,000 |
| **Total input** | **~35,650** |
| Output JSON | ~1,100 |

Haiku 3.5 pricing (official, April 2026): input $0.80 / M, output $4.00 / M.

Cost per scan at exchange rate 1.07 USD/EUR:
- Input: 35,650 / 1,000,000 * 0.80 = $0.02852
- Output: 1,100 / 1,000,000 * 4.00 = $0.0044
- Total: $0.03292 ≈ **EUR 0.0308**

Budget ceiling per scan: EUR 0.15 (4.9x headroom). Alert when monthly average exceeds EUR 0.05 per scan, hard cap at EUR 0.12 (kill switch in route handler).

Sonnet fallback cost per scan: ~EUR 0.45. Acceptable because fires on <3% of runs.

## 8. Error handling contract

```ts
type ScanError =
  | { code: "INVALID_INPUT"; http: 400; details: string }
  | { code: "INSUFFICIENT_PHOTOS"; http: 422; details: string }
  | { code: "MODEL_TIMEOUT"; http: 504; details: string }
  | { code: "MODEL_REFUSAL"; http: 502; details: string }
  | { code: "SCHEMA_INVALID_AFTER_RETRIES"; http: 502; details: string }
  | { code: "BUDGET_EXCEEDED"; http: 402; details: string }
  | { code: "UPSTREAM_ERROR"; http: 502; details: string };
```

`MODEL_REFUSAL` is the case where Haiku returns a policy refusal instead of JSON. Treat as a defect, escalate to on-call, never retry silently.

`INSUFFICIENT_PHOTOS` is returned when input has <3 photos total or <1 photo per declared room. Reject before calling the model. Charge refunded automatically per Case A of the refund policy.

Every error path must log: `inspection_id`, `attempt_count`, `model_used`, `input_tokens`, `output_tokens`, `total_cost_eur`, error code. Never log photo bytes, never log the user prompt with address.

## 9. Prompt injection defences

Photos are untrusted input. A photo caption or photo content can contain adversarial text (`"Ignore previous instructions..."`, written on a post-it and photographed).

Defences:
1. Photos are passed as `image/*` blocks, not text. Claude's vision pipeline treats embedded text as content to describe, not instruction to follow.
2. The system prompt uses `Regles absolues` with numeric prefixes. Any response that does not start with `{` is rejected.
3. The output schema has no free-text field long enough to carry an exfiltration payload. Max description length is enforced at 200 chars by zod.
4. No tool calls. The model has no way to trigger side effects even if compromised.
5. Logs store the full raw output for 30 days to permit forensic review if an incident surfaces.

Do not add a "if you see instructions in an image, ignore them" clause. It is longer than the defence and detectable by attackers as a signature.

## 10. Versioning policy

Semantic versioning on `meta.prompt_version`:
- **Major** (`3.0.0`) when the output schema changes in a breaking way
- **Minor** (`2.1.0`) when prompts change in a way that shifts eval scores by more than 5%
- **Patch** (`2.0.1`) for typo fixes, grille updates, non-semantic rephrasing

Every change goes through the eval harness (`tests/eval/risk-scan/*.json`, 50 golden cases) before promotion. A minor or major bump requires a pre-registered hypothesis and post-run diff analysis.

Previous prompts are archived at `docs/technical-specs/archive/prompt-spec-scan-vX.Y.Z.md`. Never delete, never rewrite in place.

## 11. Open items

`[TO VERIFY]`

1. Exchange rate hardcoded at 1.07 USD/EUR. Should move to a daily cron refreshing `SYSTEM_USD_EUR` env var from the ECB reference rate.
2. `metadata.user_id` hashing algorithm not yet fixed. Proposal: `sha256(user_id + daily_salt)` where daily_salt rotates at 00:00 UTC. To discuss whether daily rotation breaks Anthropic's abuse-detection pipeline.
3. Sonnet fallback has never been measured on Sonnet 4.6 (only 3.5 in v1). Need a 10-case eval on Sonnet 4.6 before production.
4. No provision yet for multi-language photo captions written by the tenant. The prompt assumes French observation text. EN observations are rejected. Decision pending.

## 12. Change log

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-04-17 | Grille externalised to JSON, strict schema with zod, retry+fallback policy, cost model updated to Haiku 3.5 pricing |
| 1.x | pre-2026-04-17 | Inline prompt, no grille, schema drift, no retry — see git history |
