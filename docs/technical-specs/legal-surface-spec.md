# Legal Surface and Consent Capture — Technical Specification

**Version:** v1.0-draft
**Date:** 2026-04-17
**Status:** DRAFT awaiting Dr Mubashir approval
**Task ref:** T-105 (GDPR artefacts) extended + new sub-task T-105b (consent pipeline)

---

## 1. Purpose

Make every Tenu.World legal document publicly accessible under a stable URL, capture each user consent as an immutable audit record, and keep the evidentiary trail strong enough for a CNIL or CDC inspection without external SaaS.

## 2. Public surface

### 2.1 Routes

Next.js App Router. MDX content imported from `/app/src/content/legal/<locale>/<slug>/<version>.mdx`. Each MDX file carries frontmatter with version, effective date, and locale.

| Locale | Slug | Public URL | Source MDX |
|---|---|---|---|
| fr | confidentialite | `/fr/confidentialite` (latest) and `/fr/confidentialite/v1.0` (pinned) | `app/src/content/legal/fr/confidentialite/v1.0.mdx` |
| fr | cgu | `/fr/cgu` and `/fr/cgu/v1.0` | `.../cgu/v1.0.mdx` |
| fr | remboursement | `/fr/remboursement` and `/fr/remboursement/v1.0` | `.../remboursement/v1.0.mdx` |
| en | privacy | `/en/privacy` and `/en/privacy/v1.0` | `.../privacy/v1.0.mdx` |
| en | terms | `/en/terms` and `/en/terms/v1.0` | `.../terms/v1.0.mdx` |
| en | refund | `/en/refund` and `/en/refund/v1.0` | `.../refund/v1.0.mdx` |

Additional languages (AR, UR, ZH, HI, JA, ES, IT, UK, PT, KO): the landing page and UI strings are translated via `next-intl`. The legal documents themselves remain available in FR and EN only at launch. The UI includes a prominent notice in the user's language: "Legal documents are available in French and English only. Please review before purchase."

### 2.2 Versioning

`/fr/confidentialite` always serves the latest version. `/fr/confidentialite/v1.0` is a permanent immutable URL. When v1.1 ships, v1.0 remains accessible, which is how we prove to a regulator what a user actually agreed to.

The MDX frontmatter is:

```yaml
---
title: Politique de confidentialité
version: "1.0"
effective_from: "2026-04-17"
locale: "fr"
slug: "confidentialite"
---
```

A small lib at `app/src/lib/legal/registry.ts` indexes all MDX files by locale and slug, sorted by version. It exports:

```ts
getLatest(locale, slug): LegalDoc
getByVersion(locale, slug, version): LegalDoc | null
listVersions(locale, slug): LegalDoc[]
```

### 2.3 Footer links

Every page footer contains three links pointing to the latest version in the current locale:

- Confidentialité / Privacy
- CGU / Terms
- Remboursement / Refund

Plus a fourth link to the mentions légales (a separate short page describing the publisher, hosting provider, directeur de la publication; mandatory under Article 6 LCEN in France).

## 3. Consent model

Four distinct consent acts. Each is captured once, tied to a specific document version, written to the `consents` table, and revocable from the account page.

### 3.1 Cookie consent

Shown once on first visit. Two buttons only: "Accepter l'essentiel" (default primary) and "Personnaliser" (expands to tick-boxes for optional categories). At launch, no optional category exists, so "Personnaliser" simply says "Aucun cookie non essentiel n'est utilisé. Votre confidentialité est préservée par défaut."

Storage: a first-party cookie `tenu_cookie_consent=essential_only&ts=<iso>&ver=1`. No server call for this one. Renewed every 13 months per CNIL guidance.

### 3.2 Account agreement

Shown at signup, after the magic-link email is confirmed and the user lands on their fresh account. A modal with two checkboxes, both mandatory to proceed. Unchecked state disables the "Continuer" button.

```
[ ] J'ai lu et j'accepte la politique de confidentialité (v1.0, 2026-04-17)
[ ] J'ai lu et j'accepte les conditions générales d'utilisation (v1.0, 2026-04-17)
```

Each label is a link to the pinned versioned URL. On submit, two rows are written to `consents`.

### 3.3 Photo processing consent

Shown once per inspection, before the first upload button becomes active. Legal basis Art. 6.1.a. A single mandatory checkbox:

```
[ ] Je consens au traitement par Tenu.World des photographies que je vais téléverser pour la génération du rapport d'analyse de dépôt de garantie.
```

Text is shorter than the account consent because the user already accepted the privacy policy at signup. This consent is specific to this inspection.

Can be revoked: revocation triggers deletion of the photographs associated with that inspection. The report cannot be regenerated after revocation.

### 3.4 Checkout consent

Shown on the checkout screen, above the Stripe payment form. Two mandatory checkboxes:

```
[ ] J'accepte la politique de remboursement (v1.0, 2026-04-17).
[ ] Je demande l'exécution immédiate du service et je reconnais perdre mon droit de rétractation dès la délivrance du rapport (article L221-28 du Code de la consommation).
```

The second checkbox is the L221-28 waiver. Without it, no "Payer" button. This is the clause that prevents a user from claiming a 14-day refund after receiving the report.

UK equivalent: "I request immediate performance of the service and acknowledge losing my right of cancellation once the report is delivered (Consumer Contracts Regulations 2013, Regulation 37)."

## 4. Database schema

New Supabase table. Append-only by RLS policy (DELETE forbidden for every role). Insertion allowed only to the authenticated user, for their own `user_id`.

```sql
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  document_type text not null check (document_type in (
    'cookie_essential',
    'privacy_policy',
    'terms_of_service',
    'photo_processing',
    'refund_policy',
    'withdrawal_waiver'
  )),
  document_slug text,                    -- e.g. 'confidentialite', 'cgu', null for cookie/waiver
  document_version text not null,        -- e.g. '1.0'
  document_locale text not null check (document_locale in ('fr','en')),
  inspection_id uuid references public.inspections(id), -- null except for photo_processing
  ip_address inet,
  user_agent text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,                -- null unless revoked
  revocation_reason text
);

create index idx_consents_user on public.consents(user_id);
create index idx_consents_type_user on public.consents(user_id, document_type);

alter table public.consents enable row level security;

-- Users can read their own consent log
create policy "consents_select_own" on public.consents
  for select using (auth.uid() = user_id);

-- Users can insert only their own consents
create policy "consents_insert_own" on public.consents
  for insert with check (auth.uid() = user_id);

-- Users can update only to mark revoked_at (soft revoke)
create policy "consents_update_own_revoke" on public.consents
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Nobody deletes. Hard stop.
-- (No delete policy defined = deletes rejected by default with RLS enabled.)
```

Granting consent writes one row per checkbox. Revoking consent writes `revoked_at` on the most recent row of that `document_type` for the user.

## 5. API routes

### 5.1 POST `/api/consent/grant`

Body Zod-validated:

```ts
{
  document_type: 'privacy_policy' | 'terms_of_service' | 'refund_policy' | 'photo_processing' | 'withdrawal_waiver' | 'cookie_essential';
  document_slug?: string;
  document_version: string;
  document_locale: 'fr' | 'en';
  inspection_id?: string;  // required only for photo_processing
}
```

Server pulls `user_id` from the session, reads `x-forwarded-for` for IP, reads `user-agent` header, inserts a row. Returns 201 with the consent row ID.

Rate-limited at 20 req/min per user to prevent abuse.

### 5.2 POST `/api/consent/revoke`

Body:

```ts
{ consent_id: string; reason?: string }
```

Updates `revoked_at = now()`, `revocation_reason = reason`. For `photo_processing` revocation, enqueues deletion of the inspection's photographs.

### 5.3 GET `/api/consent/history`

Returns the authenticated user's consent log. Used by the account page to show "Your consents" and offer revoke buttons.

## 6. UX touchpoints

### 6.1 Signup flow

1. User enters email on `/fr/inscription`.
2. Magic link sent.
3. User clicks link, lands on `/fr/compte/bienvenue`.
4. Modal appears with the two mandatory checkboxes (3.2). Links to pinned v1.0 URLs.
5. User ticks both, clicks "Continuer". Two rows written to `consents`.
6. User sees the dashboard.

### 6.2 Inspection creation flow

1. User starts new inspection: address, jurisdiction, rooms.
2. Before the first "Téléverser une photo" button becomes active, photo-processing consent modal (3.3) is shown.
3. Single row written to `consents` with `inspection_id = <current>`.
4. Upload buttons activate.

### 6.3 Checkout flow

1. User clicks "Payer" on the summary screen.
2. Page scrolls to the consent block above the Stripe Elements form (3.4).
3. User ticks both boxes. Client-side the "Payer" button becomes enabled.
4. On submission, the backend creates a Stripe Checkout session AND writes two consent rows server-side (refund_policy, withdrawal_waiver) before the Stripe session token is returned.
5. If the consent write fails, the Stripe session is not created. No payment without consent.

### 6.4 Account page "Your consents"

At `/fr/compte/confidentialite` the user sees:

| Document | Version | Accepté le | Action |
|---|---|---|---|
| Politique de confidentialité | v1.0 | 2026-04-17 10:23 | Révoquer (ferme le compte) |
| CGU | v1.0 | 2026-04-17 10:23 | Révoquer (ferme le compte) |
| Traitement photos (inspection #1234) | — | 2026-04-17 11:02 | Révoquer (supprime les photos) |
| Politique de remboursement (cmd #789) | v1.0 | 2026-04-17 11:18 | Historique uniquement |
| Renonciation L221-28 (cmd #789) | — | 2026-04-17 11:18 | Historique uniquement |

Revoking privacy or CGU triggers account closure with 30-day grace. Revoking photo_processing deletes the inspection photos immediately. Refund/waiver rows are historical evidence, not revocable (they document a one-time waiver for a one-time purchase).

## 7. Versioning procedure

When a legal document changes materially:

1. New MDX file at `.../cgu/v1.1.mdx` with updated frontmatter.
2. Old MDX file stays. Nothing is deleted.
3. Registry automatically picks up v1.1 as latest.
4. Background job sends an email to every user, 30 days before effective date, linking to v1.1 and v1.0 side-by-side.
5. At effective date, users who have not re-consented are shown a blocking modal at next login asking them to re-accept. If they refuse, account is closed with the 30-day grace.
6. Re-consent writes a new row to `consents` with `document_version = '1.1'`.

## 8. Edge cases and gotchas

- **IP address recording** is personal data under RGPD. It is lawful here under Art. 6.1.f (legitimate interest: evidence of consent). Retention: same as the consents row itself, indefinite while account is active, then 10 years after closure for contractual evidence, consistent with the statute of limitations. Mentioned in the privacy policy.
- **Cookie banner and cookie consent table entry** are distinct. The cookie banner uses a first-party cookie for replay suppression; the `consents` row is optional and only written if the user creates an account. Anonymous visitors do not create rows.
- **Language switching** during the consent flow does not change the language of the accepted documents. Once accepted in `fr`, the row records `document_locale='fr'`. If the user re-accepts after switching to `en`, a new row is written.
- **Stripe failure after consent is written**: the consent row remains. No payment, no service. Harmless.
- **Consent before signup** (e.g. user reads the policy unauthenticated and wants to pre-accept): not supported. Consent requires an authenticated user.

## 9. Estimated implementation effort

| Work item | Owner | Hours |
|---|---|---|
| MDX routes, registry, versioning | Claude Cowork | 4 |
| `consents` table + RLS | Claude Cowork | 1 |
| API routes grant/revoke/history | Claude Cowork | 2 |
| Signup consent modal | Claude Cowork | 2 |
| Inspection consent modal | Claude Cowork | 1 |
| Checkout consent block + Stripe integration | Claude Cowork | 3 |
| Account page "Your consents" | Claude Cowork | 2 |
| Cookie banner (essential-only) | Claude Cowork | 1 |
| Email re-consent flow (later, at v1.1) | Claude Cowork | deferred |
| QA on T-103 smoke test | Claude Cowork | 2 |
| **Total for launch** | | **18 hours** |

At my current execution rate that is roughly three focused sessions.

## 10. Open questions for Dr Mubashir

1. Confirm share capital figure to replace `[CAPITAL EUR]` in CGU and Privacy files.
2. Confirm médiateur de la consommation choice before commercial launch. Default candidates: SMCE (Société de médiation de la consommation des entrepreneurs), AME Conso, MEDICYS. Cheapest that covers SaaS is usually MEDICYS (EUR 199/year subscription).
3. Confirm that English legal documents can remain in EN only at launch, with in-app notice for users of other languages that legal content is FR/EN only. Alternative is machine-translating them, which is legally weaker.
4. Confirm that an unauthenticated visitor should not be able to pre-consent. This simplifies the flow but means a curious reader has to create an account to sign.

---

## Change log

| Version | Date | Change |
|---|---|---|
| v1.0-draft | 2026-04-17 | Initial spec: MDX surface, 4 consent acts, consents table with append-only RLS, 18h effort estimate for launch |
