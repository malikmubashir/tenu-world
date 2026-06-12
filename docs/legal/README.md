# Dossier légal — documents validés

## RGPD / DPO (AP3R Consulting, Renaud de La Ruelle)

- `2026-06-12_tenu-rgpd_recommandations-v6-renaud.docx` (+ PDF) — **version finale validée** : « Ok avec tous vos ajustements » (V6, 12 juin 2026). Couvre : article CGV traitement des données, mentions légales, politique de confidentialité (21 articles), tableau sous-traitants (AWS Bedrock comme architecture cible), durées de conservation, cookies.
- Historique complet des versions (V1→V6) : `~/Documents/IT Professional/Tenu World/`.
- Seul point résiduel du document (surligné orange) : capture OTP Expiry 3600 s (#T130).

## Reflet sur le site (v1.1, commit du 12 juin 2026)

- `/legal/privacy` FR+EN — §7 : vérification d'identité + suppression du titre sitôt contrôle ; ZDR retiré (§5) ; statut « validée DPO ».
- `/legal/terms` FR+EN — article 12 « Traitement des données à caractère personnel » ajouté (Contact → 13).
- `/legal/mentions` FR+EN — **créées** (LCEN art. 6-III), sans téléphone (arbitrage DPO V3).
- Index `/legal` — bandeau « Pré-lancement », mention validation DPO.

## En attente

- Bascule Bedrock (#T189/#T214) : à la mise en prod, basculer §5/§6 privacy vers AWS EMEA SARL (Luxembourg) + les deux liens AWS du tableau V6 (privacy + data-protection Bedrock). Jusque-là le site décrit l'état réel (API Anthropic directe, CCT + DPF).
- Médiateur consommation (#T088) : placeholder dans terms.
- Capture OTP 3600 s (#T130) → addendum dossier conformité.
