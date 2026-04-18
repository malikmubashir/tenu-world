import "server-only";

import { escapeHtml } from "../brevo";

// Tenu — Scan-complete email template.
// FR / EN stacked, FR first. Matches the visual register of
// docs/email-templates/brevo-welcome.html: navy header, white 560px
// card, Apple-crisp palette (#1D1D1F ink, #059669 CTA, #F4F1EA paper
// outside the card, #EEEEF1 canvas, #0B1F3A chrome).
//
// Single source of truth for the scan-complete subject + body. Dr
// Mubashir edits here — no Brevo dashboard template to sync.

export interface ScanCompleteParams {
  displayName?: string | null;
  reportUrl: string;
}

export function scanCompleteSubject(locale: "fr" | "en"): string {
  return locale === "fr"
    ? "Votre scan d'état des lieux est prêt"
    : "Your inspection scan is ready";
}

export function scanCompleteHtml(p: ScanCompleteParams): string {
  const name = p.displayName?.trim() || "";
  const frGreet = name
    ? `Bonjour ${escapeHtml(name)},`
    : "Bonjour,";
  const enGreet = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const url = escapeHtml(p.reportUrl);

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<title>Votre scan d'état des lieux est prêt</title>
</head>
<body style="margin:0;padding:0;background:#EEEEF1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1D1D1F;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Votre scan est prêt · Your inspection scan is ready</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEEEF1;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(11,31,58,0.05),0 8px 24px rgba(11,31,58,0.08);">

<tr><td align="left" style="background:#0B1F3A;padding:20px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="padding-right:10px;"><img src="https://tenu.world/apple-icon" width="28" height="28" alt="Tenu" style="display:block;border-radius:8px;border:0;"></td>
<td valign="middle" style="color:#F4F1EA;font-size:20px;letter-spacing:-0.04em;font-weight:500;line-height:1;">tenu</td>
</tr></table>
</td></tr>

<tr><td style="padding:32px 28px 20px 28px;">
<p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#6E6E73;text-transform:uppercase;">Français</p>
<h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.35;font-weight:600;color:#1D1D1F;">${frGreet}</h1>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1D1D1F;">Votre scan d'état des lieux vient d'être analysé. Le rapport détaille le niveau de risque par pièce et le montant estimé qui pourrait être retenu sur votre caution.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;"><tr>
<td align="center" bgcolor="#059669" style="border-radius:9999px;">
<a href="${url}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:9999px;">Voir mon rapport</a>
</td></tr></table>
<p style="margin:0;font-size:13px;line-height:1.55;color:#6E6E73;">Si le risque est élevé, vous pouvez générer une lettre de contestation depuis le rapport.</p>
</td></tr>

<tr><td style="padding:0 28px;"><div style="height:1px;background:#D2D2D7;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>

<tr><td style="padding:20px 28px;">
<p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#6E6E73;text-transform:uppercase;">English</p>
<h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.35;font-weight:600;color:#1D1D1F;">${enGreet}</h1>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1D1D1F;">Your inspection scan has been analysed. The report breaks down the risk level per room and the estimated amount that could be deducted from your deposit.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;"><tr>
<td align="center" bgcolor="#059669" style="border-radius:9999px;">
<a href="${url}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:9999px;">View my report</a>
</td></tr></table>
<p style="margin:0;font-size:13px;line-height:1.55;color:#6E6E73;">If the risk is high, you can generate a dispute letter directly from the report.</p>
</td></tr>

<tr><td style="padding:16px 28px 24px 28px;background:#F4F1EA;">
<p style="margin:0 0 4px 0;font-size:11px;line-height:1.5;color:#6E6E73;">Global Apex NET SAS · 75 rue des Archives, 75003 Paris, France · SIREN 914 238 117</p>
<p style="margin:0;font-size:11px;line-height:1.5;color:#6E6E73;">Tenu ne remplace pas un conseil juridique. Tenu does not replace legal advice.</p>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}
