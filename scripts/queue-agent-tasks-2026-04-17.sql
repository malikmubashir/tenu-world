-- Paperclip task queue for 2026-04-17
-- Purpose: queue 14 small atomic tasks for CEO (8) and CTO (6)
-- Each task sized to complete under 30 agent turns (avoids max_turns error)
-- First task per agent is 'todo', rest 'backlog' to prevent multi-issue runs

\set CEO_ID '''0d0b85aa-86c2-490d-9bc7-582e961cdc23'''
\set CTO_ID '''0d48baf6-0d0c-4172-8bed-2887cd111cb9'''
\set COMPANY_ID '''3b681ab8-f2a6-4889-b09f-19dac62027d1'''

BEGIN;

-- ===== CEO TASKS (8) =====

-- CEO-01 Disclaimer (will be first to run)
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CEO-01 PDF disclaimer footer (FR+EN, 25 words each)',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/pdf-disclaimer.md containing two disclaimer blocks for Tenu.World generated PDFs (risk report and dispute letter).

French block: EXACTLY 25 words maximum. Must contain the phrases: "modele genere automatiquement", "ne constitue pas un avis juridique", "consultez un professionnel du droit".

English block: EXACTLY 25 words maximum. Must contain: "automatically generated template", "does not constitute legal advice", "consult a qualified solicitor".

File structure:
# PDF Disclaimer Footer
**Version:** v1.0-draft
**Date:** 2026-04-17

## French
[25 words]

## English
[25 words]

Do not write other files. Do not run tests. Do not edit other paths. Return the absolute path of the file when done.',
'todo', 'high', :CEO_ID, 'manual');

-- CEO-02 Outreach DM
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CEO-02 Cold outreach DM template FR (400 chars max)',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/outreach-fr.md.

Content: a French cold DM template for recruiting 10 beta testers on r/france, Facebook student groups (Etudiants Etrangers Paris, Erasmus Paris), HEC alumni WhatsApp.

Rules:
- French only, 400 characters maximum
- No sales voice, no superlatives, no emojis
- Angle: founder is an expat, built this weekend tool, looking for 10 beta testers
- Offer: free report in exchange for 5-minute feedback form
- Single call to action with https://tenu.world
- Signature: Mubashir, fondateur, Tenu.World

File structure:
# Cold outreach DM template (FR)
**Version:** v1.0-draft
**Date:** 2026-04-17
**Char count:** [fill in actual count]

[DM text]

Return the absolute path when done.',
'backlog', 'high', :CEO_ID, 'manual');

-- CEO-03 Privacy Policy FR
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CEO-03 Politique de confidentialite FR',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/privacy-fr.md.

Write a RGPD compliant privacy policy in French, 500 to 700 words, covering:
1. Responsable de traitement: Global Apex NET SAS, adresse [ADRESSE], contact dpo@tenu.world
2. Donnees collectees: compte (email), inspection (adresse, photos, coordonnees GPS), paiement (via Stripe, non stockees)
3. Base legale: art 6.1.a consentement (photos), art 6.1.b execution contrat (paiement)
4. Duree de conservation: donnees inspection 24 mois, puis suppression
5. Sous-traitants: Supabase (donnees), Cloudflare R2 (photos, region EU), Stripe (paiement), Anthropic (IA), Brevo (email), Vercel (hebergement)
6. Transferts internationaux: aucun, tout reste UE ou UK
7. Droits: acces, rectification, effacement, portabilite, opposition, limitation
8. Cookies: essentiels uniquement, aucun traceur sans consentement
9. Mineurs: service non destine aux moins de 18 ans
10. Reclamation: CNIL pour utilisateurs FR, ICO pour utilisateurs UK

Header: # Politique de confidentialite, Version v1.0-draft, Date 2026-04-17.
When uncertain about legal detail, write [A VERIFIER PAR AVOCAT: ...].
Return absolute path when done.',
'backlog', 'high', :CEO_ID, 'manual');

-- CEO-04 Privacy Policy EN
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CEO-04 Privacy Policy EN (translate FR)',
'Read /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/privacy-fr.md and produce an English translation at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/privacy-en.md.

Rules:
- Keep the same structure, 10 sections
- Plain English, no legalese beyond necessary
- Where French legal references are specific to France (CNIL, article 6.1.a RGPD), keep for FR users and add "UK users: ICO applies, UK GDPR equivalent"
- Header: # Privacy Policy, Version v1.0-draft, Date 2026-04-17
- Keep [TO BE VERIFIED BY LAWYER: ...] placeholders where FR had them
Return absolute path when done.',
'backlog', 'high', :CEO_ID, 'manual');

-- CEO-05 CGU FR
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CEO-05 CGU FR',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/terms-fr.md.

Write Conditions generales d utilisation in French, 500 to 700 words, covering:
1. Objet: service IA de rapport d etat des lieux + option lettre de contestation
2. Editeur: Global Apex NET SAS, SIRET [A RENSEIGNER], siege Ile-de-France
3. Loi applicable: droit francais, juridiction Tribunal de commerce de Paris
4. Service paye: 15 EUR base + 5 EUR par piece supplementaire, 25 EUR option contestation
5. Clause explicite: la lettre de contestation est un MODELE, non un avis juridique, ne constitue pas representation juridique
6. Obligations utilisateur: informations veridiques, propriete des photos, usage personnel
7. PI: Tenu conserve la PI produit, utilisateur conserve la propriete des photos
8. Usages interdits: scraping, taux abusif, contestations mensongeres
9. Limitation de responsabilite: plafonnee au montant paye
10. Force majeure
11. Modification CGU: preavis 30 jours
12. Resiliation: compte fermable a tout moment
13. Mediation obligatoire avant litige (obligation FR)

Header: # Conditions generales d utilisation, Version v1.0-draft, Date 2026-04-17.
Return absolute path.',
'backlog', 'high', :CEO_ID, 'manual');

-- CEO-06 Terms EN
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CEO-06 Terms of Service EN (translate FR)',
'Read /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/terms-fr.md and produce English version at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/terms-en.md.

Rules:
- For UK users, replace Tribunal de commerce de Paris with "English courts for UK users"
- Mediation obligation: mark "UK users: not applicable" since it is a French-specific provision
- Pricing block: 15 GBP base + 5 GBP per extra room + 25 GBP dispute
- Keep all 13 sections
Header: # Terms of Service, Version v1.0-draft, Date 2026-04-17
Return absolute path.',
'backlog', 'high', :CEO_ID, 'manual');

-- CEO-07 Refund FR
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CEO-07 Politique de remboursement FR',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/refund-fr.md.

Content, French, 300 to 500 words:
1. Droit de retractation de 14 jours explicitement ECARTE au titre de l article L221-28 Code de la consommation, une fois le rapport IA genere et consulte
2. Consentement prealable express requis au checkout, acknowledgement de la perte du droit de retractation
3. Avant consultation du rapport: remboursement integral sous 14 jours
4. Apres consultation: pas de remboursement sauf defaillance de service (erreur IA, rapport manquant, email non delivre)
5. Delai de traitement: 10 jours ouvres via methode de paiement originale
6. Contact: support@tenu.world
7. Chargebacks Stripe: peuvent entrainer suspension du compte

Header: # Politique de remboursement, Version v1.0-draft, Date 2026-04-17.
Return absolute path.',
'backlog', 'high', :CEO_ID, 'manual');

-- CEO-08 Refund EN
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CEO-08 Refund Policy EN (translate FR)',
'Read /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/refund-fr.md and produce English version at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/legal-drafts/refund-en.md.

Rules:
- For FR users: keep article L221-28 Code de la consommation reference
- For UK users: add "UK users: Consumer Contracts Regulations 2013, equivalent waiver of 14-day withdrawal right once report accessed"
- Same 7 sections
Header: # Refund Policy, Version v1.0-draft, Date 2026-04-17
Return absolute path.',
'backlog', 'high', :CEO_ID, 'manual');

-- ===== CTO TASKS (6) =====

-- CTO-01 Grille JSON (will be first to run)
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CTO-01 Grille de vetuste data file (JSON)',
'Produce one file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/technical-specs/grille-vetuste.json.

Structured JSON based on Decret 2016-382 du 30 mars 2016 (grille de vetuste). Format:

{
  "source": "Decret 2016-382 du 30 mars 2016, art. 2",
  "version": "1.0",
  "date": "2026-04-17",
  "notes": "Durees indicatives, abattements annuels lineaires, seuil residuel en pourcentage",
  "elements": [
    {
      "element": "peinture murs et plafonds",
      "duree_vie_annees": 7,
      "abattement_annuel_pct": 14,
      "seuil_residuel_pct": 0
    },
    {
      "element": "papier peint",
      "duree_vie_annees": 7,
      "abattement_annuel_pct": 14,
      "seuil_residuel_pct": 0
    },
    ...
  ]
}

Cover minimum 12 elements: peinture, papier peint, moquette, parquet stratifie, carrelage, robinetterie, electromenager cuisine, luminaires, volets et stores, joints silicone, equipement salle de bain, porte interieure.

File must be VALID JSON (no trailing comma). Return absolute path when done. Do NOT write prose; only this JSON file.',
'todo', 'high', :CTO_ID, 'manual');

-- CTO-02 ADR-001
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CTO-02 ADR-001 Grille de vetuste integration',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/technical-specs/ADR-001-grille-vetuste.md.

Standard ADR format, ~400 words:
# ADR-001: Grille de vetuste integration into risk scoring
**Version:** v1.0-draft
**Date:** 2026-04-17
**Status:** Proposed

## Context
(Decret 2016-382, current Haiku prompt has no depreciation logic, systematic bias in landlord favor)

## Decision
(Inject grille-vetuste.json as a system prompt table for /api/ai/scan, Haiku returns residual_value_percent per item)

## Alternatives considered
1. Client-side computation after Haiku returns raw observations. Rejected because: duplicates logic, loses audit trail.
2. Hardcode in TypeScript constants. Rejected because: updates require code deploy.

## Consequences
- Prompt token delta: estimate +400 tokens per scan (+0.02 EUR)
- Accuracy: removes landlord-favor bias
- Maintenance: annual review when decree updates

Return absolute path.',
'backlog', 'high', :CTO_ID, 'manual');

-- CTO-03 Scan prompt spec
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CTO-03 Prompt spec for /api/ai/scan v2 (Haiku)',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/technical-specs/prompt-spec-scan-v2.md, ~500 words.

Sections:
## System prompt (full text)
Role as Tenu risk scanner. Reference grille-vetuste.json inline. Refuse to give legal advice. Never fabricate observations. Cost guardrail: target 0.15 EUR per scan.

## User prompt template
Inputs: property_jurisdiction, room_type, age_of_lease_years, photo_urls[]

## Output JSON schema (TypeScript)
{ issues: Array<{ element, condition, residual_value_percent, estimated_cost_eur, evidence_photo_id, confidence_0_to_1 }>, overall_risk_score_0_to_100, language }

## Error handling
Refusals return 422 {refused: true, reason}. Unreadable photos return 422 {skipped_photo_ids}. Quota exceeded returns 503.

## Cost budget
Show arithmetic: Haiku input tokens ~1800, output ~600, at 2026 Haiku pricing. Show EUR estimate.

## Versioning
v2.0 changelog: adds grille de vetuste table, adds confidence scores.

Return absolute path.',
'backlog', 'high', :CTO_ID, 'manual');

-- CTO-04 Dispute prompt spec
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CTO-04 Prompt spec for /api/ai/dispute v2 (Sonnet)',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/technical-specs/prompt-spec-dispute-v2.md, ~500 words.

Sections:
## System prompt
Role: template generator for deposit dispute letter. Tone: formel, respectueux, non accusatoire. Explicit rule: this is a template, not legal advice. Never invent facts. Never threaten criminal action.

## User prompt template
Inputs: jurisdiction (fr/uk), inspection_id, landlord_name, deposit_amount, deducted_amount, contested_items[], tenant_name, tenant_address, property_address.

## Output structure
FR: lettre recommandee avec AR, headers with coordonnees, objet, 3-4 paragraphs body, demande chiffree, delai 30 jours, signature, cite article 22 loi 1989, escalation CDC.
UK: formal letter, headers, subject, body, demand, reference TDS/DPS scheme, 14-day response window.

## Safety rules
No fabrication. No criminal threats. Always cite relevant deposit scheme. Footer disclaimer must be on every output.

## Cost budget
Sonnet input ~1500 tokens, output ~1200 tokens. Show EUR at 2026 Sonnet pricing. Target 0.40 EUR.

## Versioning
v2.0 changelog: adds grille de vetuste refs, adds disclaimer.

Return absolute path.',
'backlog', 'high', :CTO_ID, 'manual');

-- CTO-05 Security checklist
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CTO-05 Security checklist for API routes',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/technical-specs/security-checklist.md, ~400 words.

For each route below, produce a checklist of 8 items marked [x] done / [ ] pending with one-line justification:

Routes: /api/inspection/create, /api/inspection/submit, /api/photos, /api/ai/scan, /api/ai/dispute, /api/checkout, /api/webhooks/stripe

Checklist items:
1. Auth: authenticated Supabase session required (except webhook)
2. Authorization: RLS enforces user only accesses own inspection_id
3. Input validation: Zod schema, reject unknown fields
4. Rate limiting: per-IP + per-user, return 429
5. Secrets: never logged, never echoed
6. Sentry breadcrumbs: user_id, inspection_id captured
7. Webhook signature: Stripe signature validated with 5min tolerance
8. R2 URLs: signed, 7-day expiry max
9. CORS: locked to https://tenu.world
10. Headers: CSP, X-Frame-Options, Referrer-Policy in vercel.json

End with prioritised list of PENDING items.

Assume current state: RLS done, Zod partial, no rate limiting, no Sentry, Stripe signature pending.

Return absolute path.',
'backlog', 'high', :CTO_ID, 'manual');

-- CTO-06 T-103 test plan
INSERT INTO issues (company_id, title, description, status, priority, assignee_agent_id, origin_kind)
VALUES (:COMPANY_ID, 'CTO-06 T-103 end-to-end smoke test plan',
'Produce one markdown file at /Users/mmh/Documents/Claude/Projects/Tenu.World/docs/technical-specs/test-plan-T-103.md, ~500 words.

8-step smoke test, each with: pass criteria (exact DB row / HTTP response / email subject), failure observations, rollback.

Steps:
1. Land on https://tenu.world/fr, click "Commencer"
2. Sign up with burner email, magic link under 30 sec
3. New inspection: Paris address, jurisdiction FR, 2 rooms (chambre + cuisine)
4. Upload 10 photos chambre, 18 photos cuisine (test fixtures in /docs/test-fixtures/)
5. Checkout 20 EUR total, Stripe test card 4242 4242 4242 4242
6. Stripe webhook fires within 30 sec, payments row inserted
7. Risk report PDF delivered by Brevo email within 3 min
8. Optional: order dispute letter 25 EUR, second PDF in 3 min

Cost ledger: Anthropic spend per run (target 0.55 EUR), Stripe test fees 0, Brevo email count.

Return absolute path.',
'backlog', 'high', :CTO_ID, 'manual');

-- Verify
SELECT status, COUNT(*) FROM issues WHERE assignee_agent_id IN (:CEO_ID, :CTO_ID) AND created_at > NOW() - INTERVAL '5 minutes' GROUP BY status ORDER BY status;

COMMIT;
