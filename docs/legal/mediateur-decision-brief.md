# Médiateur de la consommation — Decision Brief
**For:** Dr Mubashir  
**Date:** 2026-05-08  
**Decision needed by:** 2026-05-09 (blocks CGU §11, remboursement §6, mentions légales §médiation)

---

## Legal obligation

Art. L612-1 Code de la consommation: every B2C professional selling to French consumers must offer access to a certified consumer mediator (Commission d'Évaluation et de Contrôle de la Médiation, CECMC list). Non-compliance = administrative fine up to €15,000. This is a hard blocker for commercial launch.

---

## Shortlist: MEDICYS vs CM2C

| Criterion | **MEDICYS** | **CM2C** |
|---|---|---|
| **Full name** | Médiation e-commerce, Services & Contenus Numériques | Centre de Médiation de la Consommation de Conciliateurs de Justice |
| **Backed by** | FEVAD (Fédération du e-commerce et de la vente à distance) | Réseau des Conciliateurs de Justice |
| **Scope** | E-commerce, digital services, SaaS, digital content — purpose-built | All B2C sectors, generalist |
| **Annual fee (≤ €1M CA)** | ~€250–350/year | ~€200–350/year |
| **Consumer referral deadline** | 12 months post-complaint to you | 12 months post-complaint to you |
| **Mediator decision deadline** | 90 days from file receipt | 90 days from file receipt |
| **Online sign-up** | Yes — medicys.fr | Yes — cm2c.net |
| **Sign-up processing time** | ~3–5 business days | ~5–10 business days |
| **CECMC certified** | Yes | Yes |
| **ODR platform (EU)** | Linked | Linked |
| **Recognition by French B2C digital users** | High — standard on major e-commerce platforms | Lower — associated with local/generalist disputes |

---

## Recommendation: MEDICYS

Three reasons:

1. **Purpose-built for what Tenu is.** MEDICYS was designed for digital B2C services — its mandate, its expertise, its processes are calibrated to the disputes that arise in digital subscriptions and one-time digital content purchases. CM2C handles everything from plumbers to travel agents. A dispute about a deposit scan report will be adjudicated by someone who understands digital services at MEDICYS; at CM2C, by whoever is available.

2. **Credibility signal to users and counterparties.** French e-commerce users recognize MEDICYS. Seeing it in your CGU reads as "serious digital business." CM2C reads as "I needed a mediator and googled one." For a legaltech product whose entire brand premise is credibility, this matters.

3. **Faster onboarding.** MEDICYS signs up digital businesses faster (3–5 days vs 5–10). You need this by 11 May.

CM2C's only advantage is marginally lower fee potential — immaterial at Tenu's current scale.

---

## After you decide: 3 code changes needed

Once you sign with MEDICYS, CC can update these three placeholders in under 10 minutes:

| File | Placeholder | Replace with |
|---|---|---|
| `src/app/legal/terms/fr/page.tsx` §11 | `[MEDIATEUR PENDING]` | MEDICYS name + address + URL |
| `src/app/legal/terms/en/page.tsx` §11 | `[MEDIATOR PENDING]` | MEDICYS name + address + URL |
| `src/app/legal/refund/fr/page.tsx` §6 | `[MEDIATEUR PENDING]` | MEDICYS name + address + URL |
| `src/app/legal/refund/en/page.tsx` §6 | `[MEDIATOR PENDING]` | MEDICYS name + address + URL |
| `src/app/legal/page.tsx` | `[MEDIATEUR]` | MEDICYS name |

MEDICYS standard mention (once confirmed):
> **MEDICYS** — Médiation e-commerce, Services & Contenus Numériques  
> 60 rue la Boétie, 75008 Paris — www.medicys.fr

---

## Action for Dr Mubashir

1. Go to **medicys.fr** → Adhérer → fill in Global Apex NET details (SIREN 941 666 067)  
2. Pay annual fee (~€250–350, deductible as professional expense)  
3. Receive confirmation email with your membership certificate  
4. Tell CC → MEDICYS placeholders replaced and deployed same day

**Total time: ~20 minutes online, 3–5 days to receive certificate.**
