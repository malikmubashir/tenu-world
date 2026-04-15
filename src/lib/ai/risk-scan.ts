"use server";

import Anthropic from "@anthropic-ai/sdk";

export interface RoomRisk {
  roomId: string;
  riskLevel: "low" | "medium" | "high";
  riskScore: number; // 0.00 – 1.00
  issues: { area: string; severity: string; description: string }[];
  estimatedDeductionEur: number;
  summary: string;
}

export interface ScanResult {
  inspectionId: string;
  rooms: RoomRisk[];
  overallRisk: "low" | "medium" | "high";
  totalEstimatedDeduction: number;
  scanTimestamp: string;
}

const SYSTEM_PROMPT = `You are an expert property inspection analyst for tenant deposit protection.
You analyse photos of rental property rooms and assess potential deduction risks.

For each room, evaluate:
- Wall condition (marks, holes, stains, peeling paint)
- Floor condition (scratches, stains, damage)
- Fixtures and fittings (broken handles, damaged appliances)
- Cleanliness (dirt, mould, grease build-up)
- General wear vs. abnormal damage

Respond ONLY with valid JSON matching this schema:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": number (0.00 to 1.00),
  "issues": [{ "area": string, "severity": "minor"|"moderate"|"major", "description": string }],
  "estimatedDeductionEur": number,
  "summary": string (2-3 sentences)
}

Be fair to tenants. Normal wear and tear (faded paint, minor carpet wear, small nail holes) is NOT a deduction risk.
Only flag genuine damage or negligence. Estimates should reflect typical French/UK deposit deduction amounts.`;

interface RoomPhotos {
  roomId: string;
  roomType: string;
  label: string | null;
  photoUrls: string[];
}

export async function scanRoom(room: RoomPhotos): Promise<RoomRisk> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = room.photoUrls.map(
    (url) => ({
      type: "image" as const,
      source: { type: "url" as const, url },
    }),
  );

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text: `Analyse these ${room.photoUrls.length} photo(s) of the ${room.label ?? room.roomType}. Return your assessment as JSON.`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      roomId: room.roomId,
      riskLevel: "low",
      riskScore: 0,
      issues: [],
      estimatedDeductionEur: 0,
      summary: "Unable to parse AI response. Manual review recommended.",
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    roomId: room.roomId,
    riskLevel: parsed.riskLevel ?? "low",
    riskScore: Math.min(1, Math.max(0, Number(parsed.riskScore) || 0)),
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    estimatedDeductionEur: Number(parsed.estimatedDeductionEur) || 0,
    summary: parsed.summary ?? "",
  };
}

export async function scanAllRooms(
  inspectionId: string,
  rooms: RoomPhotos[],
): Promise<ScanResult> {
  const results = await Promise.all(rooms.map(scanRoom));

  const totalDeduction = results.reduce(
    (sum, r) => sum + r.estimatedDeductionEur,
    0,
  );

  const maxScore = Math.max(...results.map((r) => r.riskScore), 0);
  const overallRisk: "low" | "medium" | "high" =
    maxScore >= 0.7 ? "high" : maxScore >= 0.4 ? "medium" : "low";

  return {
    inspectionId,
    rooms: results,
    overallRisk,
    totalEstimatedDeduction: totalDeduction,
    scanTimestamp: new Date().toISOString(),
  };
}
