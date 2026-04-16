# Tenu Inspection Specification
## Based on official French état des lieux (LegalPlace template + Loi 89-462)

Last updated: 2026-04-16

---

## Parties to the inspection

### Owner (bailleur)

| Field | Key (DB column) | Required | Notes |
|-------|-----------------|----------|-------|
| Type | owner_type | Yes | "individual" or "company" |
| Name | owner_name | Yes | Person name or company name |
| Company name | owner_company_name | No | If individual acting for a management agency |
| Email | owner_email | No | For post-inspection email |
| Phone | owner_phone | No | |
| Postal address | owner_address | No | For formal dispute letters |

### Tenants (locataire(s))

Up to 3 tenants per inspection: single occupant, couple, or colocataires.

| Field | Key (DB column) | Required | Notes |
|-------|-----------------|----------|-------|
| Full name | full_name | Yes | |
| Email | email | No | For post-inspection email |
| Phone | phone | No | |
| Sort order | sort_order | Auto | 0, 1, 2 |

Tenant limit enforced at app level (max 3 per inspection_id).

---

## Contract details

| Field | Key (DB column) | Required | Notes |
|-------|-----------------|----------|-------|
| Furnished | furnished | Yes | boolean, affects inspection (inventory for meublé) |
| Lease start date | lease_start_date | No | ISO date |
| Lease end date | lease_end_date | No | null = open-ended (CDI) |
| Notice period | notice_period_months | Auto | 1 or 3, auto-calculated from zone tendue + furnished |
| Monthly rent (cents) | monthly_rent_cents | No | Stored in cents to avoid float issues |
| Monthly charges (cents) | monthly_charges_cents | No | |
| Contract PDF | contract_pdf_r2_key | No | R2 key, stored not parsed (V1) |

---

## Property characteristics

| Field | Key (DB column) | Required | Notes |
|-------|-----------------|----------|-------|
| Property type | property_type | Yes | "appartement" or "maison" |
| Surface (m²) | surface_m2 | No | numeric(6,1) |
| Main rooms count | main_rooms | No | nombre de pièces principales |
| Zone tendue | zone_tendue | Auto | Auto-detected from postal code |
| INSEE code | commune_insee | Auto | Postal code stored; precise INSEE is V2 |
| Inspection type | inspection_type | Yes | "move_in" or "move_out" |

### Zone tendue auto-detection

Zone tendue status is determined automatically from the property's postal code using the government list (Décret n° 2013-392). This affects:

- Notice period: 1 month (zone tendue or furnished) vs 3 months (non-tendue, unfurnished)
- Rent control eligibility (encadrement des loyers) in applicable communes
- Deposit return enforcement strictness

Implementation: `src/lib/geo/zone-tendue.ts` contains a complete Set of ~1,100 postal codes from the décret annex. The function `isZoneTendue(postalCode)` returns boolean. Postal code is extracted from the address via regex.

Notice period logic (Article 15, Loi 89-462):
- Furnished (meublé): always 1 month (Article 25-8)
- Unfurnished + zone tendue: 1 month
- Unfurnished + non-tendue: 3 months

---

## Post-inspection email

After inspection completion and payment, an email is sent to both tenant(s) and owner containing:
- Timestamped photos with room labels
- Element ratings and remarks
- Legal notice citing Article 3-2 (contradictory état des lieux)
- Reminder of the 10-day contestation window (Article 3-2)
- Date and time of inspection

Tracking columns: `tenant_email_sent_at`, `owner_email_sent_at` on inspections table.

---

## Legal basis

- **Loi 89-462, Article 3-2**: État des lieux must be contradictory between parties
- **Décret 2016-382**: Grille de vétusté — wear and tear depreciation rules
- **Loi 89-462, Article 22**: Deposit return within 1 month (matching) or 2 months (deductions), 10% monthly penalty after
- **Legifrance ref**: https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006090204/

---

## Rating scale (4-point, matches official form)

| Code | French | English | Description |
|------|--------|---------|-------------|
| TB | Très bon état | Very good | No visible damage, like new |
| B | Bon état | Good | Minor wear consistent with normal use |
| M | État moyen | Fair | Visible wear, some marks or minor damage |
| MV | Mauvais état | Poor | Significant damage, needs repair |

---

## Room types and pricing

### Main rooms (full 10-element inspection)

| Room type | Key (code) | In base? | Notes |
|-----------|-----------|----------|-------|
| Entrée | entree | Yes (always) | Included in all packages |
| Salon | salon | Yes | Living room |
| Salle à manger | salle_a_manger | Conditional | Only if distinct from salon |
| Cuisine | cuisine | Yes | Has 8 extra kitchen elements |
| Chambre | chambre | 1 in base | Additional bedrooms +€5 each |
| Salle de bain | salle_de_bain | 1 in base | Has 3 extra bathroom elements. Additional +€5 |
| WC | wc | 1 in base | If separate from bathroom. Additional +€5 |

### Parties privatives (lighter inspection, 2-3 photos)

| Space type | Key (code) | Price |
|-----------|-----------|-------|
| Cave | cave | +€5 |
| Parking | parking | +€5 |
| Jardin | jardin | +€5 |
| Balcon | balcon | +€5 |
| Terrasse | terrasse | +€5 |

---

## Pricing model (dynamic, no fixed Stripe products)

### Report pricing

| Package | Rooms included | Price EUR | Price GBP |
|---------|---------------|-----------|-----------|
| Studio/T1 (base) | Entrée + Salon + Cuisine + 1 SdB + 1 WC | €15 | £15 |
| T2 | Base + 1 Chambre | €20 | £20 |
| T3 | Base + 2 Chambres | €25 | £25 |
| T4+ | Base + 3+ Chambres | €30+ | £30+ |
| Extra SdB/WC | each | +€5 | +£5 |
| Partie privative | each (cave, parking, jardin, balcon, terrasse) | +€5 | +£5 |

### Dispute letter pricing

| Item | Price EUR | Price GBP |
|------|-----------|-----------|
| Dispute letter | €25 | £25 |

### Currency logic

- `jurisdiction: "fr"` → EUR
- `jurisdiction: "uk"` → GBP

---

## Standard elements per room (10 elements — photo checklist)

Every main room gets inspected on these 10 elements:

| # | Element (FR) | Element (EN) | Key (code) |
|---|-------------|-------------|------------|
| 1 | Portes, menuiserie | Doors, woodwork | portes |
| 2 | Fenêtres (vitres et volets) | Windows (glass and shutters) | fenetres |
| 3 | Plafond | Ceiling | plafond |
| 4 | Sol | Floor | sol |
| 5 | Plinthes | Baseboards | plinthes |
| 6 | Murs | Walls | murs |
| 7 | Chauffage / tuyauterie | Heating / plumbing | chauffage |
| 8 | Prises et interrupteurs | Outlets and switches | prises |
| 9 | Éclairage | Lighting | eclairage |
| 10 | Rangement / placard | Storage / cupboard | rangement |

### Additional elements: Salle de bain (+3)

| # | Element (FR) | Element (EN) | Key (code) |
|---|-------------|-------------|------------|
| 11 | Baignoire / douche | Bath / shower | baignoire_douche |
| 12 | Évier(s) | Sink(s) | evier |
| 13 | Robinetterie | Taps/fittings | robinetterie |

### Additional elements: Cuisine (+8)

| # | Element (FR) | Element (EN) | Key (code) |
|---|-------------|-------------|------------|
| 11 | Évier(s) | Sink(s) | evier |
| 12 | Évacuations eau | Drainage | evacuations |
| 13 | Plaques de cuisson | Hob/stovetop | plaques |
| 14 | Lave-vaisselle | Dishwasher | lave_vaisselle |
| 15 | Réfrigérateur | Fridge | refrigerateur |
| 16 | Hotte | Extractor hood | hotte |
| 17 | Plan de travail | Worktop | plan_travail |
| 18 | Four | Oven | four |

### Parties privatives (lighter, 2-3 photos)

No element checklist. Just: general overview photo + any specific damage.

---

## Équipements divers (building-level, informational only)

| Element | Key |
|---------|-----|
| Sonnerie | sonnerie |
| Interphone | interphone |
| Alarme | alarme |
| Boîte aux lettres | boite_lettres |
| Portail | portail |
| Cheminée | cheminee |
| Toiture | toiture |
| Charpente | charpente |
| Isolation | isolation |
| Évacuation eaux pluviales | gouttières |

These are recorded but NOT photo-inspected per element. Single checkbox in the app.

---

## Photo requirements per room type

| Room type | Min photos | Elements covered |
|-----------|-----------|-----------------|
| Standard room | 10 | 10 standard elements |
| Cuisine | 18 | 10 standard + 8 kitchen |
| Salle de bain | 13 | 10 standard + 3 bathroom |
| WC | 10 | 10 standard elements |
| Partie privative | 3 | General overview + damage |

---

## Clés (keys) section

The état des lieux includes a key handover section. Tenu should capture:
- Type of key
- Number of keys
- Comment (e.g., "1 badge portail, 2 clés porte d'entrée")

---

## Meter readings section

Captured at inspection time:
- Electricity: HP/HC readings, meter number
- Gas: reading, meter number  
- Water: cold/hot readings
- Internet: eligibility noted

---

## Reference documents

- `docs/reference/etat-des-lieux-meuble.pdf` — Furnished rental template (6 pages)
- `docs/reference/modele-etat-des-lieux.pdf` — Standard LegalPlace template (11 pages)
- `docs/reference/modele-etat-des-lieux T1.pdf` — T1 variant
- `docs/reference/modele-etat-des-lieux T2-T3.pdf` — T2-T3 variant
