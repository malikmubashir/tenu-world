// Dispute-letter v2 output contract.
// Mirrors docs/technical-specs/prompt-spec-dispute-v2.md section 6.
// Disclaimer is injected server-side (not trusted from the model).

import { z } from "zod";
import type { RiskScanOutputV2 } from "./risk-scan";

export const DisputeTenantToneSchema = z.enum(["conciliant", "ferme"]);
export type DisputeTone = z.infer<typeof DisputeTenantToneSchema>;

export const DisputeRecipientRoleSchema = z.enum(["landlord", "tds", "dps", "cdc"]);
export type DisputeRecipientRole = z.infer<typeof DisputeRecipientRoleSchema>;

export const DisputeAddressBlockSchema = z.object({
  lines: z.array(z.string().min(1).max(200)).min(3).max(7),
});
export type DisputeAddressBlock = z.infer<typeof DisputeAddressBlockSchema>;

export const DisputeItemSchema = z.object({
  room_name: z.string().min(1).max(120),
  observations: z.string().min(20).max(300),
  coefficient_percent: z.number().min(0).max(100),
  deduction_eur: z.number().min(0).max(50000),
  grille_code: z.string().min(1).max(32),
});
export type DisputeItem = z.infer<typeof DisputeItemSchema>;

export const DisputeHeaderSchema = z.object({
  sender_block: DisputeAddressBlockSchema,
  recipient_block: DisputeAddressBlockSchema,
  place_and_date: z.string().min(5).max(80),
  mention: z.string().min(5).max(120),
  subject: z.string().min(5).max(200),
});

export const DisputeClosingSchema = z.object({
  salutation: z.string().min(5).max(300),
  signature_line: z.string().min(2).max(120),
});

export const DisputeMetaSchema = z.object({
  prompt_version: z.string().default("2.0.0"),
  model: z.string(),
  generated_at: z.string(),
  input_tokens: z.number().int().nonnegative().default(0),
  output_tokens: z.number().int().nonnegative().default(0),
});

export const DisputeLetterOutputSchema = z.object({
  locale: z.enum(["fr", "en"]),
  jurisdiction: z.enum(["FR", "UK"]),
  tone: DisputeTenantToneSchema,
  header: DisputeHeaderSchema,
  body: z.string().min(300).max(12000),
  items_table: z.array(DisputeItemSchema).min(0).max(30),
  closing: DisputeClosingSchema,
  disclaimer: z.string().default(""), // overwritten server-side
  meta: DisputeMetaSchema,
});
export type DisputeLetterOutput = z.infer<typeof DisputeLetterOutputSchema>;

// Recipient input to the route — comes from the user form + DB.
export interface DisputeRecipient {
  role: DisputeRecipientRole;
  full_name: string;
  address_lines: string[];
  reference: string | null;
}

export interface DisputeTenant {
  full_name: string;
  address_lines: string[];
  correspondence_lines: string[];
  move_in_date: string; // ISO
  move_out_date: string; // ISO
  deposit_amount_eur: number;
  deposit_currency: "EUR" | "GBP";
}

export interface DisputeLetterInput {
  inspectionId: string;
  userLocale: "fr" | "en";
  jurisdiction: "FR" | "UK";
  scan: RiskScanOutputV2;
  recipient: DisputeRecipient;
  tenant: DisputeTenant;
  tenantRationale: string | null;
  tone: DisputeTone;
}

// Legacy result shape, preserved so the existing /api/ai/dispute consumer
// keeps compiling until UI is ported to DisputeLetterOutput.
export interface DisputeLetterResultV1 {
  locale: "fr" | "en";
  letterBody: string;
  explanationBody: string;
  explanationLocale: string;
  // v2 passthrough for the route handler to persist
  v2?: DisputeLetterOutput;
  costEur: number;
  modelUsed: string;
  attemptCount: number;
}
