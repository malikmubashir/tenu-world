"use server";

import type { ScanResult } from "@/lib/ai/risk-scan";

/**
 * Generates an HTML-based report that can be converted to PDF client-side
 * using the browser's print-to-PDF functionality, or server-side via
 * a headless browser in production.
 *
 * We avoid heavy server-side PDF libraries to keep the bundle lean.
 * For production, consider Puppeteer or a PDF API service.
 */

interface ReportData {
  inspectionId: string;
  address: string;
  jurisdiction: "fr" | "uk";
  scanResult: ScanResult;
  disputeLetter?: string;
  generatedAt: string;
}

export async function generateReportHtml(data: ReportData): Promise<string> {
  const riskColor = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
  };

  const roomRows = data.scanResult.rooms
    .map(
      (room) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${room.roomId.slice(0, 8)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e5e5;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${riskColor[room.riskLevel]}20;color:${riskColor[room.riskLevel]};font-weight:600;font-size:12px;">
          ${room.riskLevel.toUpperCase()}
        </span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${(room.riskScore * 100).toFixed(0)}%</td>
      <td style="padding:8px;border-bottom:1px solid #e5e5e5;">€${room.estimatedDeductionEur.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e5e5;font-size:13px;">${room.summary}</td>
    </tr>`,
    )
    .join("");

  const issuesList = data.scanResult.rooms
    .flatMap((room) =>
      room.issues.map(
        (issue) => `
    <li style="margin-bottom:6px;">
      <strong>${issue.area}</strong> (${issue.severity}): ${issue.description}
    </li>`,
      ),
    )
    .join("");

  const letterSection = data.disputeLetter
    ? `
    <div style="page-break-before:always;margin-top:40px;">
      <h2 style="color:#1B4D3E;margin-bottom:16px;">Dispute Letter</h2>
      <div style="white-space:pre-wrap;font-family:serif;line-height:1.6;padding:24px;border:1px solid #e5e5e5;border-radius:8px;">
${data.disputeLetter}
      </div>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${data.jurisdiction === "fr" ? "fr" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tenu Inspection Report — ${data.address}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <header style="border-bottom:2px solid #1B4D3E;padding-bottom:16px;margin-bottom:32px;">
    <h1 style="color:#1B4D3E;margin:0;font-size:28px;">tenu</h1>
    <p style="color:#666;margin:4px 0 0;">Property Inspection Report</p>
  </header>

  <section style="margin-bottom:32px;">
    <table style="width:100%;font-size:14px;">
      <tr>
        <td style="padding:4px 0;color:#666;">Address</td>
        <td style="padding:4px 0;font-weight:600;">${data.address}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#666;">Jurisdiction</td>
        <td style="padding:4px 0;">${data.jurisdiction === "fr" ? "France" : "United Kingdom"}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#666;">Generated</td>
        <td style="padding:4px 0;">${new Date(data.generatedAt).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#666;">Overall Risk</td>
        <td style="padding:4px 0;">
          <span style="display:inline-block;padding:4px 12px;border-radius:6px;background:${riskColor[data.scanResult.overallRisk]}20;color:${riskColor[data.scanResult.overallRisk]};font-weight:700;">
            ${data.scanResult.overallRisk.toUpperCase()}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#666;">Estimated Total Deduction</td>
        <td style="padding:4px 0;font-weight:700;font-size:18px;color:${riskColor[data.scanResult.overallRisk]};">
          €${data.scanResult.totalEstimatedDeduction.toFixed(2)}
        </td>
      </tr>
    </table>
  </section>

  <section style="margin-bottom:32px;">
    <h2 style="color:#1B4D3E;margin-bottom:12px;">Room Breakdown</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f8f8f8;">
          <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Room</th>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Risk</th>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Score</th>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Est. Deduction</th>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Summary</th>
        </tr>
      </thead>
      <tbody>
        ${roomRows}
      </tbody>
    </table>
  </section>

  ${
    issuesList
      ? `<section style="margin-bottom:32px;">
    <h2 style="color:#1B4D3E;margin-bottom:12px;">Issues Found</h2>
    <ul style="padding-left:20px;font-size:14px;">
      ${issuesList}
    </ul>
  </section>`
      : ""
  }

  ${letterSection}

  <footer style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#999;">
    <p>Generated by Tenu.World AI inspection system. This report is for informational purposes and does not constitute legal advice.
    For legal disputes, consult a qualified professional in your jurisdiction.</p>
    <p>Report ID: ${data.inspectionId} | Scan: ${data.scanResult.scanTimestamp}</p>
  </footer>
</body>
</html>`;
}
