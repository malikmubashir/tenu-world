import "server-only";

import { escapeHtml } from "../brevo";

// Tenu — Dispute-letter-ready email template.
// FR / EN stacked, FR first. Same visual register as scan-complete.
//
// At launch the letter body is visible inside the report page. A PDF
// download replaces that link once the @react-pdf/renderer leg lands.

export type DisputeLetterType = "CDC" | "TDS" | "DPS" | "LANDLORD";

export interface DisputeReadyParams {
  displayName?: string | null;
  letterUrl: string;
  letterType: DisputeLetterType;
}

const LETTER_TYPE_LABEL_FR: Record<DisputeLetterType, string> = {
  CDC: "Commission départementale de conciliation",
  TDS: "Tenancy Deposit Scheme (TDS)",
  DPS: "Deposit Protection Service (DPS)",
  LANDLORD: "Propriétaire / bailleur",
};

const LETTER_TYPE_LABEL_EN: Record<DisputeLetterType, string> = {
  CDC: "Departmental Conciliation Commission (CDC)",
  TDS: "Tenancy Deposit Scheme (TDS)",
  DPS: "Deposit Protection Service (DPS)",
  LANDLORD: "Landlord",
};

export function disputeReadySubject(locale: "fr" | "en"): string {
  return locale === "fr"
    ? "Votre lettre de contestation est prête"
    : "Your dispute letter is ready";
}

export function disputeReadyHtml(p: DisputeReadyParams): string {
  const name = p.displayName?.trim() || "";
  const frGreet = name ? `Bonjour ${escapeHtml(name)},` : "Bonjour,";
  const enGreet = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const url = escapeHtml(p.letterUrl);
  const frRecipient = LETTER_TYPE_LABEL_FR[p.letterType];
  const enRecipient = LETTER_TYPE_LABEL_EN[p.letterType];

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<title>Votre lettre de contestation est prête</title>
</head>
<body style="margin:0;padding:0;background:#EEEEF1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1D1D1F;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Votre lettre de contestation est prête · Your dispute letter is ready</div>
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
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1D1D1F;">Votre lettre de contestation est générée. Destinataire proposé : ${escapeHtml(frRecipient)}.</p>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1D1D1F;">Relisez le contenu avant envoi. Nous recommandons un courrier recommandé avec accusé de réception (LRAR) pour la France, ou la procédure formelle du schéma de dépôt concerné pour le Royaume-Uni.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;"><tr>
<td align="center" bgcolor="#059669" style="border-radius:9999px;">
<a href="${url}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:9999px;">Ouvrir ma lettre</a>
</td></tr></table>
<p style="margin:0;font-size:13px;line-height:1.55;color:#6E6E73;">Tenu rédige votre lettre à partir de votre scan. Le contenu reste sous votre responsabilité.</p>
</td></tr>

<tr><td style="padding:0 28px;"><div style="height:1px;background:#D2D2D7;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>

<tr><td style="padding:20px 28px;">
<p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#6E6E73;text-transform:uppercase;">English</p>
<h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.35;font-weight:600;color:#1D1D1F;">${enGreet}</h1>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1D1D1F;">Your dispute letter has been generated. Suggested recipient: ${escapeHtml(enRecipient)}.</p>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1D1D1F;">Review the content before sending. We recommend registered post with proof of receipt for France (LRAR), or the formal process of the relevant UK deposit scheme.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;"><tr>
<td align="center" bgcolor="#059669" style="border-radius:9999px;">
<a href="${url}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:9999px;">Open my letter</a>
</td></tr></table>
<p style="margin:0;font-size:13px;line-height:1.55;color:#6E6E73;">Tenu drafts your letter from your scan. The final content remains your responsibility.</p>
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
