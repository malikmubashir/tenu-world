# 03 — Design System (descriptive)

Status: updated 2026-06-10 (same day as first issue) after the owner-approved adoption of the **Éditorial v2** design system, which supersedes the Apple-crisp + Identity v1 navy/paper system this document originally described.
Sources of truth: `docs/brand/DESIGN-EDITORIAL-2026-06-10.md` (the design contract), `docs/brand/BRAND-GUIDELINES.md` (v2.0, canonical brand rules), `src/app/theme.css` (tokens, rewritten 2026-06-10), `src/components/brand/TenuMark.tsx` (parametric mark), `src/app/globals.css` (`.t-*` component classes), `docs/THEMING.md` (preset and alias documentation).

**This document is descriptive, not prescriptive.** Changes go through the change-management process in BRAND-GUIDELINES.md §19 (PR + before/after screenshots + owner sign-off); v2 itself was a direct owner decision dated 2026-06-10. If anything here disagrees with BRAND-GUIDELINES.md or the editorial spec, those files win.

**Migration note (2026-06-10):** the token layer (`theme.css`), brand assets (`resources/`, `public/brand/`), and documentation are fully on v2. The component layer in `src/` (globals.css `.t-*` classes, page markup) is being migrated under #T149 (web) and #T150 (mobile); until those land, some components still reference pill radii and accent-fill CTAs that the repointed tokens partially neutralise. Treat any residual rounded/shadowed/emerald rendering as migration debt, not design intent.

---

## 1. Register

Full professional services register — calibrated to a cabinet d'avocats or audit practice. Every surface (landing page, checkout, PDF report, dispute letter, email) must read as a credible business deliverable to both the tenant and the counterparty. The Éditorial visual language reinforces this: the page reads as a printed catalogue spread or legal memorandum, not as a software interface. No buzzwords, no stock imagery, no casual register, no exclamation marks in product UI. The mandatory legal disclaimer ("Tenu fournit une aide documentaire et rédactionnelle. Tenu n'est pas un cabinet d'avocats…") appears on every PDF, dispute letter, `/legal`, and legal-adjacent email.

## 2. Token architecture

`src/app/theme.css` declares a Tailwind 4 `@theme` block with two layers plus legacy aliases:

1. **PALETTE** — raw hex, never referenced in markup.
2. **SEMANTIC** — component-facing (`--color-tenu-*`, `--color-brand-*`).
3. **LEGACY aliases** — `tenu-forest`, `tenu-cream`, `tenu-slate`, `tenu-gold`… mapped onto semantic tokens so 25+ older files keep compiling. Since 2026-06-10 the mappings land inside the editorial palette: forest→ink (#000000), cream→white (#ffffff), gold→muted (#6b7280), gold-light→ash (#b3b3b3), forest-light→signal blue.

### 2.1 Éditorial palette (current, 2026-06-10)

| Token | Value | Use |
|---|---|---|
| `--palette-canvas` | `#ffffff` | Pure White — page background and the only light surface |
| `--palette-ink` | `#000000` | Absolute Black — text, headings, nav, inverted bands |
| `--palette-hairline` | `#e5e7eb` | Hairline Gray — the load-bearing structural border |
| `--palette-ink-muted` | `#6b7280` | Stone Gray — quiet UI feedback, secondary text |
| `--palette-ash` / `--palette-quartz` | `#b3b3b3` / `#bbbbbb` | Captions/placeholders; fine print |
| `--palette-accent` | `#2563eb` | Signal Blue — links, active states, focus ring **only**; never a fill |
| `--palette-accent-hover` | `#1d4ed8` | Darkened blue; no second accent exists |
| `--palette-band` | `#ffffff` | No off-white surfaces — separation via hairlines or black bands |
| `--palette-band-inverted` | `#000000` | Inverted Black band — the sole elevation shift |
| `--palette-cta` / `--palette-cta-text` | `#000000` / `#ffffff` | **Approved exception**: filled black button for paid actions (Pay, Run scan, checkout) |
| `--palette-danger` / `--palette-warning` / `--palette-success` | `#DC2626` / `#F59E0B` / `#16A34A` | Functional form and risk-scan states only — never chrome |

### 2.2 Brand chrome tokens (repointed)

The Identity v1 chrome (navy `#0B1F3A` / Paper `#F4F1EA` / Notaire red `#8B2E2A`) is retired. The `--palette-brand-*` token names survive for compile compatibility but now resolve achromatically: brand-ink `#000000`, brand-paper `#ffffff`, brand-rule `#e5e7eb`, brand-muted `#6b7280`, brand-red `#000000` (no second accent). Header strips, PDF headers and wordmark surfaces therefore render black/white without code changes.

Contrast: black-on-white is 21:1 (AAA by construction). Floor remains WCAG AA 4.5:1 for body text; Ash/Quartz are restricted to captions and fine print.

## 3. Typography

Single typeface: **Inter** (production substitute for the spec's reference face "Plain"), loaded via `next/font` → `--font-inter`. Weight 300 carries display headlines ("whisper-weight giant"), 400 body/nav, 500 labels and CTA text, 600 rare micro-emphasis.

| Token | Size | Line height / tracking |
|---|---|---|
| `--font-size-display` | `clamp(2.75rem, 7vw + 1rem, 6.25rem)` → 100px desktop | 1.0 / −0.05em, weight 300 |
| `--font-size-section` | `clamp(2rem, 3.5vw + 0.75rem, 3.125rem)` → 50px | 1.08 / −0.04em, weight 300 |
| `--font-size-heading` | 1.875rem (30px) | 1.13 / −0.025em |
| `--font-size-h3` | 1.5rem (24px) | 1.25 / −0.002em |
| `--font-size-subhead` | 1.125rem (18px) | 1.5 / 0 |
| `--font-size-body` | 1rem (16px) | 1.56 / 0 — the floor for reading copy |
| `--font-size-label` | 1rem, weight 500 | section labels (magazine kicker), not micro-caps |
| `--font-size-small` | 0.875rem | legal fine print only |

**Non-Latin rule (hard):** `html[lang="ar"], html[lang="ur"]` zeroes every tracking token and bumps display weight 300→400 — negative tracking destroys Arabic shaping and whisper-weight is illegible in Naskh/Nastaliq. Implemented as `:lang` overrides at the bottom of theme.css.

Wordmark: lowercase `tenu`, Inter Tight 500, tracking −0.04em — **unchanged across the redesign** (owner requirement). `--font-brand` stack unchanged. Inter and Inter Tight are the only webfonts; AR/CJK always render in native system fonts.

## 4. Geometry, elevation, motion

- **Radii:** 0px everywhere — cards, images, buttons, sheets, bands. Inputs 2px (the only radius in the system). The HIG token names (`--radius-hig-*`) survive but resolve to 0px.
- **Shadows:** none. All `--shadow-hig-*` tokens resolve to `none`. Depth is communicated solely by **black-band inversion** (full-width #000000 sections with white text, 64–80px vertical padding) plus 1px hairlines.
- **Hairline doctrine:** the 1px `#e5e7eb` border replaces cards, boxes, panels and dividers. No white card on a white background — hairline frame or black band instead.
- **Inputs:** 1px `#6b7280` border, 2px radius, no focus glow — border darkens to #000000 on focus. Non-input focus-visible: 2px Signal Blue ring, offset 2px (`--focus-ring-color`).
- **Motion (unchanged, #T134):** single easing `--ease-hig: cubic-bezier(0.22, 0.61, 0.36, 1)`; durations 150/220/320ms; nothing longer than 320ms; no bounce, no parallax. Press feedback tokens (`--press-scale: 0.97`) retained.
- **Layout:** `--page-max-width: 90rem` (1440px frame), `--content-max-width: 64rem` reading measure, `--section-padding-y: clamp(4rem, 5vw + 1rem, 5rem)` (64–80px). Bands run full-bleed; the page reads as a continuous editorial scroll.

## 5. Actions

The system is **buttonless by doctrine**: every action is a typographic link — black text with hairline underline, shifting to Signal Blue on hover/active; ghost CTAs are weight-500 black text with a black underline. **One approved exception (MH, 2026-06-10):** primary commercial actions (Pay, Run scan, checkout) render as a filled `#000000` button, 0px radius, white label, via `--color-tenu-cta`. One filled CTA per view, maximum; inside a black band it inverts (white fill, black label). Blue is never a fill anywhere.

## 6. The mark — `TenuMark`

`src/components/brand/TenuMark.tsx` renders a fixed human figure (globe head cx=24 cy=13 r=4.9; arm bar; body bar on a 48×48 canvas) carved from one of **11 container shapes**: `disc` (primary, official), `portal` (secondary, official), plus nine editorial containers requiring design review before external use. **Geometry is unchanged in v2 (owner requirement).** Default colourway: fill `#000000`, carve `#ffffff` (was navy/Paper); inverted white-on-black inside bands. The head disc is re-painted on top so it survives dark backgrounds (non-negotiable per guidelines §5.2). Static exports at `public/brand/mark-disc.svg` and `mark-portal.svg` (re-grounded 2026-06-10); app icon and splash sources in `resources/` likewise re-grounded (white/black grounds, black or white mark; splash-dark is pure black). Icon PNG ladder regenerates via `node scripts/generate-icons.mjs` on macOS.

## 7. Component class inventory

Shared component styles live in `globals.css` under the `.t-*` prefix: `.t-display`, `.t-section-heading`, `.t-h3`, `.t-body`, `.t-body-muted`, `.t-small-muted`, `.t-label`, `.t-wordmark`, `.t-cta-primary` (the filled paid-action exception), `.t-cta-ghost` (typographic action), `.t-card` (hairline frame, no shadow), `.t-section-canvas`, `.t-section-band` (inverted = black), `.t-content`, `.t-hairline`. One filled CTA per view; everything else is a link. (Class bodies are mid-migration to v2 under #T149/#T150 — see the migration note at the top.)

React component inventory on `main`:

| Area | Components |
|---|---|
| Brand | `TenuMark` |
| Web chrome | `GlobalHeader`, `UserMenu`, `TranslatePreview` (machine-translation preview widget), `LanguageToggle`, `ProgressStepper` |
| Inspection / camera (web) | `CameraCapture`, `PhotoGrid`, `RoomSelector`, `ElementRatingPanel`, `AddressAutocomplete` (Google Places) |
| Legal | `CookieBanner`, `LegalPage`, `Prose`, `WithdrawalWaiver` (the two-checkbox L221-28 component) |
| Mobile (Capacitor tree) | `Shell`, `NavBar`, `TabBar` (3 tabs), `HIGButton`, `HIGTextField`, `CameraButton`, `PhotoGrid` (mobile variant), `AuthGate`, `MobileGate` |
| Stories | `OtherCases` |

## 8. Imagery

Photography carries all colour — the chrome is achromatic by design. Direction: warm editorial photography of real rental interiors (terracotta, oak, plaster tones), full-bleed, unframed, 0px radius, no overlays or duotones. Unsplash is the licensed interim source; commissioned photography replaces it before the 15 Jul public launch. No illustrations or decorative icons; thin-stroke 1px line motifs are the only graphic ornament. Evidence photos in reports are documentary material and are never style-treated.

## 9. i18n / RTL rules as implemented

- Locale registry: `src/lib/i18n/config.ts` — 10 locales (`en fr ar zh ur hi ja es pt ko`), default `fr`, RTL set `{ar, ur}`, `getDirection()` helper. (The guidelines' P2 list mentions IT and UK; the code registry does not include them — code wins.)
- Legal output (PDF, letters, consent copy) is FR/EN only, enforced in `src/lib/legal/consents.ts` and the dispute/letter schemas.
- UI strings live in per-page `COPY: Record<Locale, …>` dictionaries (e.g. `inspection/new`, `pricing`, login) — not in a central `src/messages/` directory. Most product pages currently ship FR + EN dictionaries with FR fallback for other locales; full 10-language coverage is provided by the header's on-demand translation preview, explicitly labelled unofficial.
- RTL: handled by scoping `dir` where needed (email templates scope `dir="rtl"` per cell; the outer envelope stays LTR for Outlook). Increased line-heights for AR (1.75) and CJK (1.6). Tracking zeroed and display weight 400 for AR/UR per §3.
- Consent and legal copy is never machine-translated, and any wording change must bump the relevant `*_TEXT_VERSION` constant.

## 10. Surface-specific systems

- **Email** (`docs/email-templates/`): six Supabase auth templates + one Brevo welcome, four languages stacked per email (FR→EN→ZH→AR), table layout, 560px max, light-mode-only. Restyled to v2 on 2026-06-10: white envelope, hairline-framed card (no radius, no shadow), black header strip with white type-only wordmark, black square CTA buttons, blue footer links. Wording untouched.
- **PDF report** (`src/lib/pdf/scan-report.tsx`): A4 portrait, black header strip (white mark + wordmark), hairline rules, footer with RCS line + disclaimer on every page; rendered fully in code via `@react-pdf/renderer` (no Placid/Canva). (Restyle to v2 lands with the component migration.)
- **Dispute letter**: CDC/TDS/DPS formal layout; no Tenu branding in the letter body, footer-only drafting acknowledgement.
- **Accessibility floor**: WCAG 2.2 AA; black-on-white text is AAA by construction; 44×44pt touch targets; focus-visible 2px Signal Blue ring (inputs: border-darkens-to-black instead); colour never the sole carrier of meaning (risk chips pair colour + text label).
