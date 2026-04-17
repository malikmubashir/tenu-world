"use server";

import Anthropic from "@anthropic-ai/sdk";
import { ZodError } from "zod";
import {
  RiskScanOutputV2Schema,
  type RiskScanOutputV2,
  type RoomRiskV1,
  type ScanResultV1,
} from "./types/risk-scan";
import {
  buildSystemPrompt,
  buildUserPrompt,
  GRILLE_VERSION,
  type BuildPromptInput,
} from "./risk-scan-prompt";

// Re-export legacy names so existing consumers keep working.
export type { RoomRiskV1 as RoomRisk, ScanResultV1 as ScanResult } from "./types/risk-scan";

const PRIMARY_MODEL = "claude-haiku-4-5-20251001";
const FALLBACK_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.2;

// Cost per million tokens in USD (Haiku 4.5 pricing as of 2026-04-17).
// Update here when Anthropic repricing hits.
const PRICING = {
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
} as const;

// Kill switch: a single scan exceeding this budget is rejected.
const MAX_COST_EUR_PER_SCAN = 0.12;
const USD_EUR_DEFAULT = 0.93; // fallback when ECB rate not loaded

interface RoomPhotos {
  roomId: string;
  roomType: string;
  label: string | null;
  photoUrls: string[];
}

export interface ScanInput {
  inspectionId: string;
  address: string;
  jurisdiction: "fr" | "uk";
  moveInDate: string | null;
  moveOutDate: string | null;
  depositAmountEur: number;
  hasInventory: boolean;
  rooms: RoomPhotos[];
  tenantNotes?: string;
}

export async function scanAllRooms(
  inspectionIdOrInput: string | ScanInput,
  legacyRooms?: RoomPhotos[],
): Promise<ScanResultV1> {
  // Backward-compat shim: the old signature was (inspectionId, rooms[]).
  // New signature is (ScanInput). We support both so existing callers don't break.
  const input: ScanInput =
    typeof inspectionIdOrInput === "string"
      ? {
          inspectionId: inspectionIdOrInput,
          address: "non communiquee",
          jurisdiction: "fr",
          moveInDate: null,
          moveOutDate: null,
          depositAmountEur: 0,
          hasInventory: false,
          rooms: legacyRooms ?? [],
          tenantNotes: undefined,
        }
      : inspectionIdOrInput;

  if (input.rooms.length === 0) {
    throw new ScanError("INSUFFICIENT_PHOTOS", "No rooms provided");
  }
  const totalPhotos = input.rooms.reduce((sum, r) => sum + r.photoUrls.length, 0);
  if (totalPhotos < 3) {
    throw new ScanError("INSUFFICIENT_PHOTOS", `Only ${totalPhotos} photos, minimum 3 required`);
  }

  const result = await callWithRetry(input);

  // Collapse v2 output to legacy v1 shape for DB persistence until migration lands.
  const roomRiskV1: RoomRiskV1[] = result.output.rooms.map((room) => {
    const maxConfidence = confidenceToScore(room.confidence);
    const topObservations = [...room.observations].sort(
      (a, b) => b.deduction_deposit_eur - a.deduction_deposit_eur,
    );
    const issues = topObservations.slice(0, 5).map((o) => ({
      area: o.code,
      severity: severityFromDeduction(o.deduction_deposit_eur, room.subtotal_eur),
      description: o.element_libre ? `${o.element_libre}: ${o.description}` : o.description,
    }));
    const riskScore = clamp01(room.subtotal_eur === 0 ? 0 : Math.min(1, room.subtotal_eur / 500));
    const riskLevel: RoomRiskV1["riskLevel"] =
      riskScore >= 0.7 ? "high" : riskScore >= 0.4 ? "medium" : "low";
    return {
      roomId: room.id,
      riskLevel,
      riskScore,
      issues,
      estimatedDeductionEur: Math.round(room.subtotal_eur),
      summary: buildSummary(room.observations.length, room.subtotal_eur, maxConfidence),
    };
  });

  const maxScore = Math.max(...roomRiskV1.map((r) => r.riskScore), 0);
  const overallRisk: "low" | "medium" | "high" =
    maxScore >= 0.7 ? "high" : maxScore >= 0.4 ? "medium" : "low";

  return {
    inspectionId: input.inspectionId,
    rooms: roomRiskV1,
    overallRisk,
    totalEstimatedDeduction: Math.round(result.output.total_deduction_eur),
    scanTimestamp: result.output.meta.generated_at,
    v2: result.output,
    costEur: result.costEur,
    modelUsed: result.modelUsed,
    attemptCount: result.attemptCount,
  };
}

interface CallResult {
  output: RiskScanOutputV2;
  costEur: number;
  modelUsed: string;
  attemptCount: number;
}

async function callWithRetry(input: ScanInput): Promise<CallResult> {
  const attempts: { model: string; reason: string }[] = [
    { model: PRIMARY_MODEL, reason: "primary" },
    { model: PRIMARY_MODEL, reason: "retry" },
    { model: FALLBACK_MODEL, reason: "fallback" },
  ];

  let lastError: unknown;
  let totalCostEur = 0;

  for (let i = 0; i < attempts.length; i++) {
    const { model } = attempts[i];
    try {
      const { output, costEur } = await callAnthropic(model, input);
      totalCostEur += costEur;
      if (totalCostEur > MAX_COST_EUR_PER_SCAN) {
        throw new ScanError(
          "BUDGET_EXCEEDED",
          `Cost ${totalCostEur.toFixed(4)} EUR exceeds ceiling ${MAX_COST_EUR_PER_SCAN}`,
        );
      }
      return {
        output,
        costEur: totalCostEur,
        modelUsed: model,
        attemptCount: i + 1,
      };
    } catch (err) {
      lastError = err;
      if (err instanceof ScanError && err.code === "BUDGET_EXCEEDED") throw err;
      if (err instanceof ScanError && err.code === "MODEL_REFUSAL") throw err;
      // Retry on JSON parse + schema validation failures only.
      // Upstream errors (network, 5xx) should also retry.
    }
  }
  if (lastError instanceof ScanError) throw lastError;
  throw new ScanError(
    "SCHEMA_INVALID_AFTER_RETRIES",
    lastError instanceof Error ? lastError.message : "Unknown validation failure",
  );
}

async function callAnthropic(
  model: string,
  input: ScanInput,
): Promise<{ output: RiskScanOutputV2; costEur: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ScanError("INVALID_INPUT", "ANTHROPIC_API_KEY missing from environment");
  }

  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt();
  const userPrompt: BuildPromptInput = {
    inspectionId: input.inspectionId,
    address: input.address,
    jurisdiction: input.jurisdiction,
    moveInDate: input.moveInDate,
    moveOutDate: input.moveOutDate,
    depositAmountEur: input.depositAmountEur,
    hasInventory: input.hasInventory,
    rooms: input.rooms.map((r) => ({
      id: r.roomId,
      name: r.label ?? r.roomType,
      photoCount: r.photoUrls.length,
    })),
    tenantNotes: input.tenantNotes,
  };

  // Flatten photo URLs in room order, preserving room_id prefixes so the model
  // can attribute observations to the right room.
  const imageBlocks: Anthropic.Messages.ContentBlockParam[] = [];
  for (const room of input.rooms) {
    room.photoUrls.forEach((url, idx) => {
      imageBlocks.push({
        type: "text",
        text: `[room_id=${room.roomId}] photo ${idx + 1}/${room.photoUrls.length}`,
      });
      imageBlocks.push({
        type: "image",
        source: { type: "url", url },
      });
    });
  }

  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: buildUserPrompt(userPrompt) },
          ],
        },
      ],
    });
  } catch (err) {
    throw new ScanError(
      "UPSTREAM_ERROR",
      err instanceof Error ? err.message : "Anthropic API error",
    );
  }

  const costEur = computeCostEur(model, response.usage);

  if (response.stop_reason === "refusal") {
    throw new ScanError("MODEL_REFUSAL", "Model returned a refusal instead of JSON");
  }

  const text = response.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text.startsWith("{")) {
    throw new ScanError("SCHEMA_INVALID_AFTER_RETRIES", "Response did not start with '{'");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new ScanError(
      "SCHEMA_INVALID_AFTER_RETRIES",
      `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Force meta.model + meta.generated_at + meta.grille_version to server-supplied values
  // so the model can't overwrite them.
  if (parsed && typeof parsed === "object") {
    const p = parsed as Record<string, unknown>;
    const meta = (p.meta as Record<string, unknown>) ?? {};
    meta.model = model;
    meta.generated_at = new Date().toISOString();
    meta.grille_version = GRILLE_VERSION;
    meta.prompt_version = "2.0.0";
    meta.warnings = meta.warnings ?? [];
    meta.quality_flag = meta.quality_flag ?? "ok";
    p.meta = meta;
    // Ensure inspection_id echoes the caller-provided value, not the one the model invented.
    p.inspection_id = input.inspectionId;
  }

  let validated: RiskScanOutputV2;
  try {
    validated = RiskScanOutputV2Schema.parse(parsed);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ScanError(
        "SCHEMA_INVALID_AFTER_RETRIES",
        `zod validation: ${err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
    throw err;
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

function confidenceToScore(c: "high" | "medium" | "low" | "absent"): number {
  switch (c) {
    case "high":
      return 1;
    case "medium":
      return 0.7;
    case "low":
      return 0.4;
    case "absent":
      return 0;
  }
}

function severityFromDeduction(amount: number, roomTotal: number): string {
  if (roomTotal === 0) return "minor";
  const share = amount / roomTotal;
  if (share >= 0.5 && amount >= 150) return "major";
  if (share >= 0.25 || amount >= 80) return "moderate";
  return "minor";
}

function buildSummary(obsCount: number, subtotalEur: number, confidence: number): string {
  if (obsCount === 0) {
    return "Aucune degradation detectee au-dela de l'usage normal.";
  }
  const conf = confidence >= 0.7 ? "" : " Certaines photographies ne permettent pas une analyse certaine.";
  return `${obsCount} observation(s) retenue(s), deduction estimee ${Math.round(subtotalEur)} EUR.${conf}`;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export class ScanError extends Error {
  constructor(
    public readonly code:
      | "INVALID_INPUT"
      | "INSUFFICIENT_PHOTOS"
      | "MODEL_TIMEOUT"
      | "MODEL_REFUSAL"
      | "SCHEMA_INVALID_AFTER_RETRIES"
      | "BUDGET_EXCEEDED"
      | "UPSTREAM_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "ScanError";
  }
}
