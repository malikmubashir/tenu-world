// Risk scan output contract.
// Two shapes coexist:
//   - RoomRiskV1: the legacy per-room shape the current DB schema stores.
//   - RiskScanObservation / RiskScanRoomV2 / RiskScanOutputV2: the full v2 shape from prompt-spec-scan-v2.md.
// The v2 shape is validated coming out of the model (accuracy gate).
// We then collapse v2 into the v1 per-room shape for persistence until the DB migration lands.

import { z } from "zod";

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low", "absent"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const RiskScanObservationSchema = z
  .object({
    code: z.string().min(1).max(32),
    element_libre: z.string().max(120).optional(),
    description: z.string().min(5).max(400),
    cout_remise_en_etat_eur: z.number().min(0).max(50000),
    coefficient_residuel: z.number().min(0).max(1),
    deduction_deposit_eur: z.number().min(0).max(50000),
    confidence: ConfidenceLevelSchema,
    photo_indices: z.array(z.number().int().min(0)).default([]),
  })
  .refine(
    (o) => o.code !== "AUTRE" || !!o.element_libre,
    { message: "element_libre is required when code === 'AUTRE'" },
  );
export type RiskScanObservation = z.infer<typeof RiskScanObservationSchema>;

export const RiskScanRoomV2Schema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  observations: z.array(RiskScanObservationSchema).max(30),
  subtotal_eur: z.number().min(0),
  confidence: ConfidenceLevelSchema,
});
export type RiskScanRoomV2 = z.infer<typeof RiskScanRoomV2Schema>;

export const RiskScanMetaSchema = z.object({
  prompt_version: z.string().default("2.0.0"),
  grille_version: z.string(),
  model: z.string(),
  generated_at: z.string(),
  quality_flag: z.enum(["ok", "insufficient_evidence"]),
  warnings: z.array(z.string()).default([]),
});
export type RiskScanMeta = z.infer<typeof RiskScanMetaSchema>;

export const RiskScanOutputV2Schema = z
  .object({
    inspection_id: z.string().min(1),
    total_deduction_eur: z.number().min(0),
    deposit_amount_eur: z.number().min(0),
    refundable_eur: z.number().min(0),
    rooms: z.array(RiskScanRoomV2Schema).min(1).max(30),
    meta: RiskScanMetaSchema,
  })
  .refine(
    (r) => {
      const sum = r.rooms.reduce((acc, room) => acc + room.subtotal_eur, 0);
      return Math.abs(sum - r.total_deduction_eur) <= 1;
    },
    { message: "Room subtotals must sum to total_deduction_eur within 1 EUR" },
  )
  .refine(
    (r) => {
      const expected = Math.max(0, r.deposit_amount_eur - r.total_deduction_eur);
      return Math.abs(r.refundable_eur - expected) <= 1;
    },
    { message: "refundable_eur must equal deposit - deductions, floored at 0" },
  );
export type RiskScanOutputV2 = z.infer<typeof RiskScanOutputV2Schema>;

// Legacy per-room shape, stored in the `rooms` table today.
// Populated by collapsing v2 output at the end of the scan call.
export interface RoomRiskV1 {
  roomId: string;
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  issues: { area: string; severity: string; description: string }[];
  estimatedDeductionEur: number;
  summary: string;
}

export interface ScanResultV1 {
  inspectionId: string;
  rooms: RoomRiskV1[];
  overallRisk: "low" | "medium" | "high";
  totalEstimatedDeduction: number;
  scanTimestamp: string;
  // v2 payload passed through so the route handler can persist full detail as JSON
  v2?: RiskScanOutputV2;
  // Cost tracking and retry observability
  costEur: number;
  modelUsed: string;
  attemptCount: number;
}
