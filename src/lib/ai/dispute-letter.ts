"use server";

// Dispute-letter v2 client. Mirrors the risk-scan v2 pattern:
// - Sonnet -> Sonnet retry (no Haiku / no Opus per spec section 2)
// - Zod validation against DisputeLetterOutputSchema
// - Items-table sum must match scan.total_deduction_eur within 1 EUR
// - Server-forced meta.* + deterministic disclaimer injection
// - Hard cost cap EUR 0.50 per letter (spec section 9)
// - Typed DisputeError with 9 codes mapped to HTTP in the route
// A backward-compat shim preserves the legacy generateDisputeLetter signature
// so existing /api/ai/dispute consumers keep compiling until the route is ported.

import Anthropic from "@anthropic-ai/sdk";
import { ZodError } from "zod";
import {
  DisputeLetterOutputSchema,
  type DisputeLetterOutput,
  type DisputeLetterInput,
  type DisputeLetterResultV1,
  type DisputeRecipient,
  type DisputeTenant,
} from "./types/dispute-letter";
import {
  buildSystemPrompt,
  buildUserPrompt,
  RETRY_PREAMBLE,
  disclaimerFor,
} from "./dispute-letter-prompt";
import type { ScanResult } from "./risk-scan";

// Legacy alias: consumers that imported the old name still compile.
export type DisputeLetterResult = DisputeLetterResultV1;

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 3000;
const TEMPERATURE = 0.4;

// Sonnet 4.6 pricing (USD per million tokens), official April 2026.
const PRICING = {
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
} as const;

const MAX_COST_EUR_PER_LETTER = 0.5; // spec section 9 hard cap
const USD_EUR_DEFAULT = 0.93; // fallback when ECB daily rate not loaded
const SUM_TOLERANCE_EUR = 1; // items_table sum vs scan.total_deduction_eur

export class DisputeError extends Error {
  constructor(
    public readonly code:
      | "INVALID_INPUT"
      | "SCAN_NOT_FOUND"
      | "SCAN_INSUFFICIENT_EVIDENCE"
      | "MODEL_TIMEOUT"
      | "MODEL_REFUSAL"
      | "SCHEMA_INVALID_AFTER_RETRIES"
      | "ITEMS_SUM_MISMATCH_AFTER_RETRIES"
      | "BUDGET_EXCEEDED"
      | "UPSTREAM_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "DisputeError";
  }
}

interface CallResult {
  output: DisputeLetterOutput;
  costEur: number;
  modelUsed: string;
  attemptCount: number;
}

// Primary entry point for callers that have the full v2 context.
export async function generateDisputeLetterV2(
  input: DisputeLetterInput,
): Promise<DisputeLetterResultV1> {
  if (!input.scan) {
    throw new DisputeError("SCAN_NOT_FOUND", "Scan payload missing from input");
  }
  if (input.scan.meta?.quality_flag === "insufficient_evidence") {
    // Spec section 10: refuse to build a letter on weak evidence.
    throw new DisputeError(
      "SCAN_INSUFFICIENT_EVIDENCE",
      "Upstream scan flagged insufficient evidence; dispute letter refused",
    );
  }

  const { output, costEur, modelUsed, attemptCount } = await callWithRetry(input);

  return {
    locale: output.locale,
    letterBody: output.body,
    // v2 no longer produces a separate tenant explanation. Kept for backward
    // compatibility with the legacy UI consumers until they migrate to v2.
    explanationBody: "",
    explanationLocale: output.locale,
    v2: output,
    costEur,
    modelUsed,
    attemptCount,
  };
}

async function callWithRetry(input: DisputeLetterInput): Promise<CallResult> {
  let lastError: unknown;
  let totalCostEur = 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { output, costEur } = await callAnthropic(input, attempt === 2);
      totalCostEur += costEur;
      if (totalCostEur > MAX_COST_EUR_PER_LETTER) {
        throw new DisputeError(
          "BUDGET_EXCEEDED",
          `Cost ${totalCostEur.toFixed(4)} EUR exceeds ceiling ${MAX_COST_EUR_PER_LETTER}`,
        );
      }
      return {
        output,
        costEur: totalCostEur,
        modelUsed: MODEL,
        attemptCount: attempt,
      };
    } catch (err) {
      lastError = err;
      if (err instanceof DisputeError) {
        // Non-retryable codes short-circuit immediately.
        if (
          err.code === "BUDGET_EXCEEDED" ||
          err.code === "MODEL_REFUSAL" ||
          err.code === "INVALID_INPUT" ||
          err.code === "SCAN_NOT_FOUND" ||
          err.code === "SCAN_INSUFFICIENT_EVIDENCE"
        ) {
          throw err;
        }
      }
      // Retry on zod failures, JSON parse failures, items-sum mismatches,
      // upstream network errors. Attempt 2 appends RETRY_PREAMBLE.
    }
  }

  if (lastError instanceof DisputeError) {
    // Promote SCHEMA_INVALID vs ITEMS_SUM_MISMATCH depending on the final code.
    if (lastError.code === "ITEMS_SUM_MISMATCH_AFTER_RETRIES") throw lastError;
    if (lastError.code === "SCHEMA_INVALID_AFTER_RETRIES") throw lastError;
    throw lastError;
  }
  throw new DisputeError(
    "SCHEMA_INVALID_AFTER_RETRIES",
    lastError instanceof Error ? lastError.message : "Unknown validation failure",
  );
}

async function callAnthropic(
  input: DisputeLetterInput,
  isRetry: boolean,
): Promise<{ output: DisputeLetterOutput; costEur: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new DisputeError(
      "INVALID_INPUT",
      "ANTHROPIC_API_KEY missing from environment",
    );
  }

  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt(input.jurisdiction);
  const baseUser = buildUserPrompt(input);
  const userText = isRetry ? `${RETRY_PREAMBLE}\n\n${baseUser}` : baseUser;

  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system,
      messages: [{ role: "user", content: userText }],
    });
  } catch (err) {
    throw new DisputeError(
      "UPSTREAM_ERROR",
      err instanceof Error ? err.message : "Anthropic API error",
    );
  }

  const costEur = computeCostEur(MODEL, response.usage);

  // SDK 0.39.0 stop_reason union does not yet include "refusal"; cast so the
  // check compiles while still catching future runtime refusals the API may
  // emit. Remove the cast when we bump @anthropic-ai/sdk.
  if ((response.stop_reason as string) === "refusal") {
    throw new DisputeError(
      "MODEL_REFUSAL",
      "Model returned a refusal instead of JSON",
    );
  }

  const text = response.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text.startsWith("{")) {
    throw new DisputeError(
      "SCHEMA_INVALID_AFTER_RETRIES",
      "Response did not start with '{'",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new DisputeError(
      "SCHEMA_INVALID_AFTER_RETRIES",
      `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Server-forced fields: locale / jurisdiction / tone / meta / disclaimer.
  // The model is instructed to leave `disclaimer` empty; we inject the
  // legally vetted block here so no drift possible.
  if (parsed && typeof parsed === "object") {
    const p = parsed as Record<string, unknown>;
    const meta = (p.meta as Record<string, unknown>) ?? {};
    meta.model = MODEL;
    meta.generated_at = new Date().toISOString();
    meta.prompt_version = "2.0.0";
    meta.input_tokens = response.usage.input_tokens;
    meta.output_tokens = response.usage.output_tokens;
    p.meta = meta;
    p.disclaimer = disclaimerFor(input.userLocale);
    p.locale = input.userLocale;
    p.jurisdiction = input.jurisdiction;
    p.tone = input.tone;
  }

  let validated: DisputeLetterOutput;
  try {
    validated = DisputeLetterOutputSchema.parse(parsed);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new DisputeError(
        "SCHEMA_INVALID_AFTER_RETRIES",
        `zod validation: ${err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
    throw err;
  }

  // Items-table sum must match scan total (spec section 6).
  const itemsSum = validated.items_table.reduce(
    (acc, it) => acc + it.deduction_eur,
    0,
  );
  if (Math.abs(itemsSum - input.scan.total_deduction_eur) > SUM_TOLERANCE_EUR) {
    throw new DisputeError(
      "ITEMS_SUM_MISMATCH_AFTER_RETRIES",
      `Items sum ${itemsSum.toFixed(2)} EUR does not match scan total ${input.scan.total_deduction_eur.toFixed(2)} EUR`,
    );
  }

  return { output: validated, costEur };
}

function computeCostEur(model: string, usage: Anthropic.Messages.Usage): number {
  const p = (PRICING as Record<string, { input: number; output: number }>)[model];
  if (!p) return 0;
  const usdEur = Number(process.env.SYSTEM_USD_EUR) || USD_EUR_DEFAULT;
  const inputUsd = (usage.input_tokens / 1_000_000) * p.input;
  const outputUsd = (usage.output_tokens / 1_000_000) * p.output;
  return (inputUsd + outputUsd) * usdEur;
}

// ---------------------------------------------------------------------------
// Backward-compat shim.
// Legacy signature: generateDisputeLetter(scanResult, jurisdiction, address, tenantName).
// Kept so existing /api/ai/dispute consumers and any tests keep compiling while
// the route handler is migrated to the new full-context signature.
// ---------------------------------------------------------------------------
export async function generateDisputeLetter(
  scanResult: ScanResult,
  jurisdiction: "fr" | "uk",
  address: string,
  tenantName?: string,
): Promise<DisputeLetterResultV1> {
  if (!scanResult.v2) {
    throw new DisputeError(
      "SCAN_NOT_FOUND",
      "Legacy scanResult has no v2 payload — run /api/ai/scan under the v2 contract first",
    );
  }
  const juris: "FR" | "UK" = jurisdiction === "uk" ? "UK" : "FR";
  const locale: "fr" | "en" = jurisdiction === "uk" ? "en" : "fr";

  const addressLines = splitAddress(address);

  const recipient: DisputeRecipient = {
    role: "landlord",
    full_name: juris === "FR" ? "Bailleur" : "Landlord",
    address_lines: addressLines,
    reference: null,
  };

  const tenant: DisputeTenant = {
    full_name: tenantName ?? (juris === "FR" ? "Le locataire" : "The tenant"),
    address_lines: addressLines,
    correspondence_lines: addressLines,
    move_in_date: "",
    move_out_date: "",
    deposit_amount_eur: scanResult.v2.deposit_amount_eur,
    deposit_currency: "EUR",
  };

  const input: DisputeLetterInput = {
    inspectionId: scanResult.inspectionId,
    userLocale: locale,
    jurisdiction: juris,
    scan: scanResult.v2,
    recipient,
    tenant,
    tenantRationale: null,
    tone: "conciliant",
  };

  return generateDisputeLetterV2(input);
}

// DisputeAddressBlockSchema requires 3..7 lines. Normalise a single address
// string into that shape for the shim path.
function splitAddress(address: string): string[] {
  const raw = address
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (raw.length >= 3) return raw.slice(0, 7);
  while (raw.length < 3) raw.push("-");
  return raw;
}
