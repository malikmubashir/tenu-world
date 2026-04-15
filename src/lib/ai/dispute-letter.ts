"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { ScanResult } from "./risk-scan";

export interface DisputeLetterResult {
  locale: "fr" | "en";
  letterBody: string;
  explanationBody: string;
  explanationLocale: string;
}

const SYSTEM_PROMPT_FR = `Tu es un expert juridique spécialisé dans le droit locatif français (loi du 6 juillet 1989).
Tu rédiges des courriers formels de contestation de retenues sur dépôt de garantie.

Le courrier doit :
- Être adressé au bailleur
- Citer les articles de loi pertinents (art. 22, art. 3-2 de la loi du 6 juillet 1989)
- Distinguer vétusté normale et dégradation
- Contester chaque retenue non justifiée avec un argument juridique
- Utiliser un ton ferme mais respectueux
- Se terminer par une demande de restitution avec délai

Fournis aussi une explication simplifiée en français pour le locataire (section séparée).`;

const SYSTEM_PROMPT_EN = `You are a legal expert specialising in UK tenant deposit law (Housing Act 2004, Tenant Fees Act 2019).
You draft formal dispute letters for unfair deposit deductions.

The letter must:
- Be addressed to the landlord or letting agent
- Reference relevant legislation (sections 213-215 Housing Act 2004, deposit protection schemes)
- Distinguish fair wear and tear from genuine damage
- Challenge each unjustified deduction with a legal argument
- Maintain a firm but professional tone
- End with a request for return within a specified period, mentioning ADR/tribunal options

Also provide a plain-English explanation for the tenant (separate section).`;

export async function generateDisputeLetter(
  scanResult: ScanResult,
  jurisdiction: "fr" | "uk",
  address: string,
  tenantName?: string,
): Promise<DisputeLetterResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const systemPrompt = jurisdiction === "fr" ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;
  const locale = jurisdiction === "fr" ? "fr" : "en";

  const riskSummary = scanResult.rooms
    .map(
      (r) =>
        `Room: ${r.roomId}\nRisk: ${r.riskLevel} (${r.riskScore})\nEstimated deduction: €${r.estimatedDeductionEur}\nIssues: ${r.issues.map((i) => `${i.area} (${i.severity}): ${i.description}`).join("; ")}\nSummary: ${r.summary}`,
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Property address: ${address}
Tenant: ${tenantName ?? "The tenant"}
Overall risk: ${scanResult.overallRisk}
Total estimated deduction: €${scanResult.totalEstimatedDeduction}

Room-by-room risk assessment:
${riskSummary}

Please generate:
1. A formal dispute letter (marked with === LETTER START === and === LETTER END ===)
2. A plain explanation for the tenant (marked with === EXPLANATION START === and === EXPLANATION END ===)`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse structured sections
  const letterMatch = text.match(
    /=== LETTER START ===([\s\S]*?)=== LETTER END ===/,
  );
  const explanationMatch = text.match(
    /=== EXPLANATION START ===([\s\S]*?)=== EXPLANATION END ===/,
  );

  return {
    locale,
    letterBody: letterMatch ? letterMatch[1].trim() : text,
    explanationBody: explanationMatch
      ? explanationMatch[1].trim()
      : "See letter above for details.",
    explanationLocale: locale,
  };
}
