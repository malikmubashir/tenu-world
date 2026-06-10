# 03 — Design System (descriptive)

Status: verified against `main` @ `2697e1e` (2026-06-10).
Sources of truth: `docs/brand/BRAND-GUIDELINES.md` (v1.1, canonical), `src/app/theme.css` (tokens), `src/components/brand/TenuMark.tsx` (parametric mark), `src/app/globals.css` (`.t-*` component classes), `docs/THEMING.md` (preset swaps).

**This document is descriptive, not prescriptive. The brand is locked.** Changes go through the change-management process in BRAND-GUIDELINES.md §19 (PR + before/after screenshots + owner sign-off). If anything here disagrees with BRAND-GUIDELINES.md, that file wins.

---

## 1. Register

Full professional services register — calibrated to a cabinet d'avocats or audit practice. Every surface (landing page, checkout, PDF report, dispute letter, email) must read as a credible business deliverable to both the tenant and the counterparty. No buzzwords, no stock imagery, no casual register, no exclamation marks in product UI. The mandatory legal disclaimer ("Tenu fournit une aide documentaire et rédactionnelle. Tenu n'est pas un cabinet d'avocats…") appears on every PDF, dispute letter, `/legal`, and legal-adjacent email.

## 2. Token architecture

`src/app/theme.css` declares a Tailwind 4 `@theme` block with two layers plus legacy aliases:

1. **PALETTE** — raw hex, never referenced in markup.
2. **SEMANTIC** — component-facing (`--color-tenu-*`, `--color-brand-*`).
3. **LEGACY aliases** — `tenu-forest`, `tenu-cream`, `tenu-slate`, `tenu-gold`… mapped onto semantic tokens so 25+ older files keep compiling. New code uses semantic names; legacy class names still appear widely in `src/app/inspection/*` and `src/app/account` pages.

### 2.1 Apple-Crisp body palette (current preset)

| Token | Value | Use |
|---|---|---|
| `--palette-accent` | `#059669` | Primary CTA, success, active nav (emerald — the only CTA colour) |
| `--palette-accent-hover` | `#10B981` | Hover / focus-visible ring |
| `--palette-ink` | `#1D1D1F` | Body text, headlines |
| `--palette-ink-muted` | `#6E6E73` | Secondary text, captions |
| `--palette-canvas` | `#F4F1EA` | Page background — **note:** theme.css aligned canvas to Paper on 2026-04-19 to match the iOS mobile canvas; BRAND-GUIDELINES.md §6.1 still lists canvas as `#FFFFFF`. The code value is what ships. |
| `--palette-band` | `#EDE8DC` | Section bands / card trays (Paper-2, same alignment note) |
| `--palette-hairline` | `#D2D2D7` | 1px dividers |
| `--palette-danger` / `--palette-warning` / `--palette-success` | `#DC2626` / `#F59E0B` / `#16A34A` | Destructive, attention, clear states |

### 2.2 Identity v1 brand chrome (Option C, 2026-04-18)

Chrome-only tokens — header strips, wordmark, PDF headers, app icons, mobile screens. They never restyle body surfaces or CTAs.

| Token | Value | Use |
|---|---|---|
| `--palette-brand-ink` | `#0B1F3A` | Navy chrome, logo fill |
| `--palette-brand-paper` | `#F4F1EA` | Logo carve, paper tone |
| `--palette-brand-paper-2` | `#EDE8DC` | Layered surface on Paper |
| `--palette-brand-red` | `#8B2E2A` | Rights-assertion accent. **Never a CTA.** |
| `--palette-brand-carbon` | `#1A1A1A` | Print body tone |
| `--palette-brand-rule` | `rgba(11,31,58,0.12)` | Hairline on Paper |
| `--palette-brand-muted` | `rgba(11,31,58,0.55)` | Secondary text on Paper |

Contrast floor is WCAG AA 4.5:1 for body text; white-on-emerald is reserved for button labels (large-text exception).

## 3. Typography

| Stack | Definition | Use |
|---|---|---|
| `--font-sans` | system stack (SF Pro first, Inter fallback) | All body UI |
| `--font-brand` | `var(--font-inter-tight)` → Inter Tight → Inter → system | Wordmark + display headlines only. Inter Tight is the only webfont permitted, loaded via `next/font` in `src/app/layout.tsx`. |
| Multilingual (email/PDF) | native system fonts per script (SF Arabic, PingFang SC…) | Never load webfonts for AR/CJK |

Scale (tokens in theme.css):

| Token | Size | Tracking / weight |
|---|---|---|
| `--font-size-display` | `clamp(2.5rem, 5vw + 1rem, 4.5rem)` | −0.03em, 600 |
| `--font-size-section` | `clamp(2rem, 3vw + 1rem, 3rem)` | −0.02em, 600 |
| `--font-size-h3` | 1.125rem | −0.01em, 600 |
| `--font-size-body` | 1rem | 0, 400 |
| `--font-size-small` | 0.875rem | meta/captions |
| `--font-size-label` | 0.75rem | uppercase, 0.08em, 600 |

Line-height: 1.35 display/section, 1.55 body, 1.6 ZH, 1.75 AR. Wordmark: lowercase `tenu`, Inter Tight 500, tracking −0.04em, never capitalised, never boxed.

## 4. Geometry, shadows, motion

Apple HIG-inspired, all tokenised:

- Radii: button 12px, card 16px, sheet 20px, pill 9999px (primary CTA is always the pill).
- Shadows: exactly three (`--shadow-hig-card`, `--shadow-hig-float`, `--shadow-hig-cta`); inventing or stacking shadows is prohibited.
- Motion: single easing `--ease-hig: cubic-bezier(0.22, 0.61, 0.36, 1)`; durations 150/220/320ms; nothing longer than 320ms; no bounce, no parallax.
- Layout: `--content-max-width: 64rem`; `--section-padding-y: clamp(4rem, 6vw + 2rem, 9rem)`.

## 5. The mark — `TenuMark`

`src/components/brand/TenuMark.tsx` renders a fixed human figure (globe head cx=24 cy=13 r=4.9; arm bar; body bar on a 48×48 canvas) carved from one of **11 container shapes**: `disc` (primary, official), `portal` (secondary, official), plus nine editorial containers (`oval`, `square`, `arch`, `vesica`, `crescent`, `flag`, `hex`, `shield`, `rounded`) requiring design review before external use. Default palette: fill `#0B1F3A`, carve `#F4F1EA`; the head disc is re-painted on top so it survives dark backgrounds (non-negotiable per guidelines §5.2). Accessibility: a `title` prop announces the SVG; absent, it is `aria-hidden`. Static exports live at `public/brand/mark-disc.svg` and `mark-portal.svg`; the icon routes (`src/app/icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`) generate runtime rasters.

## 6. Component class inventory

Shared component styles live in `globals.css` under the `.t-*` prefix (per guidelines §7.3): `.t-display`, `.t-section-heading`, `.t-h3`, `.t-body`, `.t-body-muted`, `.t-small-muted`, `.t-label`, `.t-cta-primary` (emerald pill), `.t-cta-ghost`, `.t-card`, `.t-section-canvas`, `.t-section-band`, `.t-content`, `.t-hairline`. One primary CTA per view; a second action becomes ghost.

React component inventory on `main`:

| Area | Components |
|---|---|
| Brand | `TenuMark` |
| Web chrome | `GlobalHeader`, `UserMenu`, `TranslatePreview` (machine-translation preview widget), `LanguageToggle`, `ProgressStepper` |
| Inspection / camera (web) | `CameraCapture`, `PhotoGrid`, `RoomSelector`, `ElementRatingPanel`, `AddressAutocomplete` (Google Places) |
| Legal | `CookieBanner`, `LegalPage`, `Prose`, `WithdrawalWaiver` (the two-checkbox L221-28 component) |
| Mobile (Capacitor tree) | `Shell`, `NavBar`, `TabBar` (3 tabs), `HIGButton`, `HIGTextField`, `CameraButton`, `PhotoGrid` (mobile variant), `AuthGate`, `MobileGate` |
| Stories | `OtherCases` |

## 7. i18n / RTL rules as implemented

- Locale registry: `src/lib/i18n/config.ts` — 10 locales (`en fr ar zh ur hi ja es pt ko`), default `fr`, RTL set `{ar, ur}`, `getDirection()` helper. (The guidelines' P2 list mentions IT and UK; the code registry does not include them — code wins.)
- Legal output (PDF, letters, consent copy) is FR/EN only, enforced in `src/lib/legal/consents.ts` and the dispute/letter schemas.
- UI strings live in per-page `COPY: Record<Locale, …>` dictionaries (e.g. `inspection/new`, `pricing`, login) — **not** in `src/messages/<locale>.json` as guidelines §14.2 describes; that directory does not exist. Most product pages currently ship FR + EN dictionaries with FR fallback for other locales; full 10-language coverage is provided by the header's on-demand translation preview, explicitly labelled unofficial.
- RTL: handled by scoping `dir` where needed (email templates scope `dir="rtl"` per cell; the outer envelope stays LTR for Outlook). Increased line-heights for AR (1.75) and CJK (1.6).
- Consent and legal copy is never machine-translated, and any wording change must bump the relevant `*_TEXT_VERSION` constant.

## 8. Surface-specific systems

- **Email** (`docs/email-templates/`): six Supabase auth templates + one Brevo welcome, four languages stacked per email (FR→EN→ZH→AR), table layout, 560px max, light-mode-only, navy header strip with type-only wordmark, disc mark served from `https://tenu.world/apple-icon`.
- **PDF report** (`src/lib/pdf/scan-report.tsx`): A4 portrait, navy header strip, footer with RCS line + disclaimer on every page; rendered fully in code via `@react-pdf/renderer` (no Placid/Canva).
- **Dispute letter**: CDC/TDS/DPS formal layout; no Tenu branding in the letter body, footer-only drafting acknowledgement.
- **Accessibility floor**: WCAG 2.2 AA; 44×44pt touch targets (the mobile tree documents 44pt/52pt targets per HIG in its component comments); focus-visible ring 2px `--palette-accent-hover`; colour never the sole carrier of meaning (risk chips pair colour + text label).
