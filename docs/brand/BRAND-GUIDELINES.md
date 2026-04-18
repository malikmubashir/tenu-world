# Tenu · Brand Guidelines

Version 1.0 · 2026-04-18 · Owner: Dr Mubashir (Global Apex.Net SAS)
Source of truth for every Tenu surface: web, iOS, Android, PDF reports, email, presentations, letterhead, social.

---

## 1. What this document is

This is the canonical reference. If any Tenu asset, template, or partner deliverable disagrees with this file, this file wins.

Tenu sits between two contradictory demands. Our users (tenants, international students, expats) are people failed by institutions. Our counterparties (landlords, agences, CDC, CAF, tribunals) are institutions. The brand resolves the contradiction by adopting **institutional discipline in an advocate's voice**: the typography, geometry, and tone of an Apple or a Supreme Court, paired with copy that is plain, warm, and unambiguously on the tenant's side.

We do not do "corporate" in the BNP Paribas sense. No stock imagery, no "trust" buzzwords, no stock-photo handshakes. Everything we ship looks like it could be evidence in a case file.

---

## 2. Brand essence

**Tagline (EN):** Your rights. Your language. Your deposit.
**Tagline (FR):** Vos droits. Votre langue. Votre caution.
**Tagline (ZH):** 您的权益 · 您的语言 · 您的押金
**Tagline (AR):** حقوقك · لغتك · وديعتك

**Promise.** Ten minutes now protects your deposit later.

**Audience primary.** International students and expats in France signing private rental agreements they cannot fully read.
**Audience secondary.** French-native tenants who distrust the landlord's état des lieux.
**Audience tertiary (roadmap).** UK tenants under the Tenancy Deposit Scheme / DPS regime.

**Positioning.** The only multilingual, evidence-grade tenant rights companion whose output is accepted by French mediators and, on request, by the Commission Départementale de Conciliation.

**What we are not.** We are not a marketplace. We are not a landlord tool. We are not an insurance product. We are not legal counsel and we say so on every surface.

---

## 3. Voice and tone

### 3.1 Principles

1. **Plain over clever.** A scared tenant on their phone at 23:00 should read us without rereading.
2. **Evidence over emotion.** We state facts and cite articles. We do not catastrophise.
3. **Advocacy without partisanship.** We are pro-tenant, never anti-landlord. A fair landlord should be able to read our text and nod.
4. **Legal precision where it matters.** We cite article numbers verbatim (art. 22 loi du 6 juillet 1989; art. L221-28 Code de la consommation). We never paraphrase law into a slogan.
5. **Multilingual symmetry.** Every sentence ships in the target language from day one. No "coming soon" French translations of English marketing.

### 3.2 What we avoid

Buzzwords we never use: cutting-edge, robust, seamless, best-in-class, leverage, unlock, empower, synergy, innovative, revolutionary, game-changing, disrupt.
Rhetorical openers we never use: "In today's fast-paced world…", "At Tenu, we believe…", "We are excited to announce…".
Punctuation we avoid in body copy: em dashes, ellipses for effect, double quotes used decoratively.
Exclamation marks: never in product UI or legal output. One allowed per marketing email, rarely.

### 3.3 Voice examples

FR do: **Dix minutes aujourd'hui peuvent protéger votre caution.**
FR don't: *Grâce à notre solution innovante, sécurisez votre caution en toute sérénité.*

EN do: **Ten minutes now protects your deposit later.**
EN don't: *Leverage Tenu's cutting-edge AI to unlock peace of mind at move-in.*

FR do: **Si le bailleur retient la caution sans justificatifs chiffrés, vous avez deux mois pour saisir la CDC.**
FR don't: *Votre bailleur pourrait potentiellement vous causer des désagréments au départ.*

### 3.4 Legal disclaimer (mandatory)

Every output that could be mistaken for legal advice carries, verbatim:

> FR: Tenu fournit une aide documentaire et rédactionnelle. Tenu n'est pas un cabinet d'avocats et ne délivre pas de consultation juridique.

> EN: Tenu provides documentary and drafting support. Tenu is not a law firm and does not provide legal advice.

Placement: footer of every PDF report, bottom of every dispute letter, `/legal/disclaimer` page, inside transactional emails that touch legal subject matter.

---

## 4. Wordmark

The wordmark is **lowercase `tenu`**, set in Inter Tight (brand font), weight 500, tracking 0.04em negative, no full stop, no period, no underscore, no tagline locked beneath.

Rules:

* Never capitalise the T.
* Never italicise.
* Never add a superscript ™ or ® in body copy. The marks (EUIPO registered, CNIPA registered) appear only in legal footers and on the `/legal` page.
* The wordmark never appears inside a box, ribbon, shield, or beveled plate.
* Minimum rendered size on screen: 14px. On print: 10pt.

Colour usage:

| Background | Wordmark colour | Hex |
|---|---|---|
| Paper (brand chrome) | Paper light | #F4F1EA |
| Ink navy (brand chrome) | Paper light | #F4F1EA |
| White canvas | Apple ink | #1D1D1F |
| Any photo or image | Paper light on a Paper plate, never floating | #F4F1EA |

Font stack (brand):
```
var(--font-inter-tight), "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif
```

---

## 5. Logo system

Tenu ships a **parametric identity mark** (component: `TenuMark`) that renders a fixed human figure (globe head, horizontal arm bar, vertical body bar) carved out of one of eleven container shapes. Two containers carry official status; the remaining nine are available for editorial and product use but require design review before external publication.

### 5.1 Official marks

**Disc mark (`mark-disc`).** Primary. Circular seal. Use for favicons, app icons, PDF headers, social avatars, email signatures, any surface where the mark reads as a "stamp".

**Portal mark (`mark-portal`).** Secondary. Doorway arch. Use for threshold metaphors: onboarding screens, hero art, print covers, deck title slides.

Source files live at `public/brand/mark-disc.svg` and `public/brand/mark-portal.svg`. The React component that renders any of the 11 variants lives at `src/components/brand/TenuMark.tsx`.

### 5.2 Geometry (invariant)

All marks are drawn on a 48×48 canvas. Figure geometry is fixed:

```
head : circle cx=24 cy=13 r=4.9
arms : rounded bar x=11 y=22.4 w=26 h=2.2 r=1.1
body : rounded bar x=22.9 y=23.5 w=2.2 h=18 r=1.1
```

The head is re-painted in Paper after carving, so it reads as a filled disc rather than a hollow cut. This is non-negotiable: on dark backgrounds, without the overlay, the head disappears.

### 5.3 Default palette

```
fill   = Tenu Ink   #0B1F3A
carve  = Paper      #F4F1EA
```

### 5.4 Clear space

Reserve clear space equal to the radius of the head disc (≈ 4px on the 48px canvas, scaled linearly) on all four sides. No competing logo, text, or graphic element enters that zone.

### 5.5 Minimum sizes

| Context | Minimum |
|---|---|
| Screen | 24px (square) |
| App icon | 48px native, generated at all iOS/Android sizes from the 512px master |
| Print | 10mm square |
| Favicon | 16px variant already simplified in the source SVG |

### 5.6 Misuse (never)

* Never rotate, skew, or distort the mark.
* Never recolour the fill in a way that drops below 4.5:1 contrast against the background.
* Never place the mark on a busy photograph; use a Paper or Ink plate behind it.
* Never change the proportions of the figure (head / arms / body bars).
* Never add shadow, glow, or bevel.
* Never animate the mark on the landing page beyond a single fade-in on load.

### 5.7 The nine editorial containers

`oval`, `square`, `arch`, `vesica`, `crescent`, `flag`, `hex`, `shield`, `rounded`. Available for internal use, campaign microsites, and limited social posts. Any external use (press kit, partner co-branding, printed collateral) must be signed off by the brand owner before release.

---

## 6. Colour system

Tenu runs a **two-layer token architecture** in `src/app/theme.css`. Layer 1 is the raw palette. Layer 2 remaps palette slots to semantic names. Components consume only semantic names so the entire site can reskin by swapping one block.

### 6.1 Apple-Crisp body palette (current preset)

| Token | Hex | RGB | Use |
|---|---|---|---|
| `--palette-accent` | #059669 | 5, 150, 105 | Primary CTA, success confirmations, active nav |
| `--palette-accent-hover` | #10B981 | 16, 185, 129 | CTA hover and focus-visible ring |
| `--palette-ink` | #1D1D1F | 29, 29, 31 | Body text, headlines on canvas |
| `--palette-ink-muted` | #6E6E73 | 110, 110, 115 | Secondary text, captions, meta |
| `--palette-canvas` | #FFFFFF | 255, 255, 255 | Page background |
| `--palette-band` | #EEEEF1 | 238, 238, 241 | Section separators, card tray |
| `--palette-hairline` | #D2D2D7 | 210, 210, 215 | 1px dividers |
| `--palette-danger` | #DC2626 | 220, 38, 38 | Destructive action, red alert |
| `--palette-warning` | #F59E0B | 245, 158, 11 | Risk-scan "attention" rating |
| `--palette-success` | #16A34A | 22, 163, 74 | Risk-scan "clear" rating |

### 6.2 Identity v1 brand chrome

| Token | Hex | RGB | Use |
|---|---|---|---|
| `--palette-brand-ink` | #0B1F3A | 11, 31, 58 | Header navy strip, logo fill, deck masters |
| `--palette-brand-paper` | #F4F1EA | 244, 241, 234 | Logo carve-through, print paper tone |
| `--palette-brand-red` | #8B2E2A | 139, 46, 42 | Rights-assertion accent (sparingly) |
| `--palette-brand-carbon` | #1A1A1A | 26, 26, 26 | Deep print tone for cover stock |

### 6.3 Where each colour belongs

CTA: `--palette-accent` (#059669). Never use brand-red for a CTA. Never use navy for a CTA button, only the emerald.
Body text on white: `--palette-ink` (#1D1D1F). Muted meta: `--palette-ink-muted` (#6E6E73).
Header bar and PDF report header: `--palette-brand-ink` (#0B1F3A) with `--palette-brand-paper` (#F4F1EA) wordmark.
Hairlines and dividers: `--palette-hairline` (#D2D2D7).

### 6.4 Contrast (WCAG AA)

| Foreground | Background | Ratio | Pass |
|---|---|---|---|
| #1D1D1F | #FFFFFF | 17.4:1 | AAA |
| #6E6E73 | #FFFFFF | 4.6:1 | AA body |
| #FFFFFF | #059669 | 3.9:1 | AA Large only — never use on body text |
| #FFFFFF | #0B1F3A | 14.8:1 | AAA |
| #F4F1EA | #0B1F3A | 12.4:1 | AAA |
| #DC2626 | #FFFFFF | 4.8:1 | AA |

Rule: any body text must hit 4.5:1 minimum. White on emerald is reserved for button labels (large text exception). Never ship muted ink on band.

---

## 7. Typography

### 7.1 Font stacks

**Body stack (`--font-sans`):**
```
ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif
```

**Brand stack (`--font-brand`):**
```
var(--font-inter-tight), "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif
```

**Multilingual stack (used in email, PDF, UI with mixed scripts):**
```
-apple-system, BlinkMacSystemFont, "SF Arabic", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Arial, sans-serif
```

Never load a webfont when a native system font covers the script. Inter Tight is the only webfont we accept, and only for the brand stack (wordmark and display headlines). Arabic and CJK always render in native system fonts.

### 7.2 Scale

| Token | Size | Tracking | Weight | Use |
|---|---|---|---|---|
| `--font-size-display` | clamp(2.5rem, 5vw + 1rem, 4.5rem) | −0.03em | 600 | Hero headline |
| `--font-size-section` | clamp(2rem, 3vw + 1rem, 3rem) | −0.02em | 600 | Section heading |
| `--font-size-h3` | 1.125rem | −0.01em | 600 | Card title, inline heading |
| `--font-size-body` | 1rem (16px) | 0 | 400 | Paragraph body |
| `--font-size-small` | 0.875rem (14px) | 0 | 400 | Meta, captions |
| `--font-size-label` | 0.75rem (12px) | 0.08em uppercase | 600 | Labels, eyebrow text |

Line-height: 1.35 for display and section, 1.55 for body, 1.6 for ZH, 1.75 for AR.

### 7.3 Component classes

Component styles live in `globals.css` under the `.t-*` prefix. Use these rather than redeclaring styles per surface.

| Class | Purpose |
|---|---|
| `.t-display` | Hero headline |
| `.t-section-heading` | Section h2 |
| `.t-h3` | Card title |
| `.t-body` | Paragraph body |
| `.t-body-muted` | Paragraph in `--palette-ink-muted` |
| `.t-small-muted` | Caption/meta |
| `.t-label` | Eyebrow label, uppercase, letter-spaced |
| `.t-cta-primary` | Emerald pill CTA |
| `.t-cta-ghost` | Bordered CTA |
| `.t-card` | White card, `--radius-hig-card`, `--shadow-hig-card` |
| `.t-section-canvas` | Full-width canvas section |
| `.t-section-band` | Band-coloured section |
| `.t-content` | Max-width 64rem content wrapper |
| `.t-hairline` | 1px `--palette-hairline` divider |

---

## 8. Radii, shadows, motion

Apple HIG-inspired. Calibrated for trust, not for drama.

### 8.1 Radii

| Token | Value | Use |
|---|---|---|
| `--radius-hig-button` | 12px | Secondary buttons, inputs |
| `--radius-hig-card` | 16px | Cards, modal sheets |
| `--radius-hig-sheet` | 20px | Full-screen sheets, dialogs |
| `--radius-hig-pill` | 9999px | Primary CTA, tag chips, pill toggles |

### 8.2 Shadows

```
--shadow-hig-card:  0 1px 2px rgba(15,23,42,0.04), 0 2px 12px rgba(15,23,42,0.06);
--shadow-hig-float: 0 4px 12px rgba(15,23,42,0.08), 0 12px 40px rgba(15,23,42,0.10);
--shadow-hig-cta:   0 1px 2px rgba(5,150,105,0.20);
```

Never invent a new shadow. Never stack shadows manually.

### 8.3 Motion

```
--ease-hig: cubic-bezier(0.22, 0.61, 0.36, 1);
--duration-hig-fast: 150ms;
--duration-hig-base: 220ms;
--duration-hig-slow: 320ms;
```

Use `fast` for hover and focus, `base` for tap/press and reveals, `slow` for page transitions. Nothing longer than 320ms in product. Never bounce. Never parallax.

### 8.4 Spacing

```
--section-padding-y: clamp(4rem, 6vw + 2rem, 9rem);
--content-max-width: 64rem;
```

---

## 9. UI components (standard)

### 9.1 Primary CTA

```
background: #059669
color: #FFFFFF
font-size: 15px
font-weight: 600
padding: 12px 24px
border-radius: 9999px
hover background: #10B981
focus-visible ring: 2px #10B981 offset 2px
```

One primary CTA per view. Never two side by side. If a view needs two actions, the secondary becomes ghost.

### 9.2 Ghost CTA

```
background: transparent
color: #1D1D1F
border: 1px solid #D2D2D7
border-radius: 9999px
padding: 12px 24px
```

### 9.3 Input field

```
background: #FFFFFF
border: 1px solid #D2D2D7
border-radius: 12px
padding: 12px 14px
focus border: 1px solid #059669
focus shadow: 0 0 0 3px rgba(5,150,105,0.20)
```

### 9.4 Card

```
background: #FFFFFF
border-radius: 16px
box-shadow: var(--shadow-hig-card)
padding: 24px
```

### 9.5 Risk-scan rating chip

| Rating | Background | Text |
|---|---|---|
| Clear | #DCFCE7 | #14532D |
| Attention | #FEF3C7 | #78350F |
| High risk | #FEE2E2 | #7F1D1D |

Shape: `--radius-hig-pill`. Font: `--font-size-label` (12px), uppercase, 0.08em letter-spacing.

---

## 10. Email system

All Tenu email templates live at `docs/email-templates/`. See `docs/email-templates/README.md` for paste-in instructions.

### 10.1 Stacked multilingual pattern

Six Supabase auth templates plus one Brevo welcome template. Each file ships **four languages stacked in one email** (FR → EN → ZH → AR), separated by 1px hairlines. The Arabic block carries `dir="rtl"` scoped to its cell; the outer envelope stays LTR so Outlook desktop does not mirror the layout.

### 10.2 Rendering rules

* Table layout, inline styles.
* Max width 560px.
* Wordmark is type-only, Paper on Ink navy header strip, no webfont.
* Disc mark served from `https://tenu.world/apple-icon` (180×180 PNG via Next icon route).
* CTA button renders as a rounded pill via `bgcolor` + inline `background` + `border-radius: 9999px` on the `<td>` (Outlook-safe).
* Light mode only (`meta color-scheme: light only`).
* Footer carries Global Apex.Net SAS legal line and DPO/support addresses.

### 10.3 Subjects (Supabase templates)

| Template | Subject |
|---|---|
| Confirm signup | Tenu · confirmez votre email / confirm your email / 确认邮箱 / أكّد بريدك |
| Invite | Tenu · invitation / 邀请 / دعوة |
| Magic link | Tenu · lien de connexion / sign-in link / 登录链接 / رابط تسجيل الدخول |
| Change email | Tenu · nouvelle adresse / new email / 新邮箱 / بريد جديد |
| Reset password | Tenu · mot de passe / reset password / 重置密码 / كلمة المرور |
| Reauthentication | Tenu · code de vérification / verification code / 验证码 / رمز التحقق |

### 10.4 Signature block

Plain text, no logo inline, one blank line between paragraphs.

```
Dr Mubashir — Founder
Tenu · tenu.world
Global Apex.Net SAS · 4 Bd du Château, 78280 Guyancourt, France
RCS Versailles 941 666 067 · DPO: dpo@tenu.world
```

No social links. No marketing tagline. No quote of the day.

---

## 11. PDF report and letter system

Generated in-code via `@react-pdf/renderer`. No Placid, no Canva, no Figma export.

### 11.1 Layout

A4 portrait. 20mm outer margin on all sides. Single column body, 12pt Inter/Helvetica fallback. Line-height 1.45.

### 11.2 Header

Full-width Ink navy strip, 28mm tall. Disc mark at 18mm, left-aligned, with 6mm clear space. Wordmark in Paper immediately to the right of the mark.

### 11.3 Cover page

Title in Inter Tight 600, 28pt. Subtitle (property address + date of scan) in 14pt Apple ink. A single horizontal 0.5pt hairline below the subtitle. No photograph on the cover.

### 11.4 Body sections

H2: 16pt 600 Ink. Body: 11pt 400 Ink. Captions: 9pt 400 Ink muted. Evidence photos embedded at 80mm max width, each with a sha256 checksum and capture timestamp printed directly below.

### 11.5 Footer (every page)

```
Tenu · Global Apex.Net SAS · RCS Versailles 941 666 067
Tenu fournit une aide documentaire et rédactionnelle. Tenu n'est pas un cabinet d'avocats.
Page X of Y
```

### 11.6 Dispute letter

Matches CDC (France) or TDS/DPS (UK) formal layout. Sender block top-right. Recipient block left. Ref line. Object line. Body in numbered paragraphs. Signature: printed full name + "Fait à [ville], le [date]". No Tenu branding in the letter body itself — Tenu appears only as a small footer acknowledging drafting support.

---

## 12. Presentation system

### 12.1 Deck masters

Two masters only:

1. **Internal / board**: Paper background (#F4F1EA), Ink text (#0B1F3A), Inter Tight for headlines, Inter for body. Footer strip with slide number, deck title, date.
2. **External / investor**: White canvas (#FFFFFF), Ink body (#1D1D1F), navy header accent. Same type scale as the product site.

### 12.2 Slide types

| Slide | Rule |
|---|---|
| Title | Disc mark top-left at 32px, deck title centred, date bottom-right. No subtitle. |
| Section | Eyebrow label in `--palette-ink-muted`, section title in display size. |
| Content | One headline + max 5 body lines. Never a wall of text. |
| Chart | One chart per slide. Axes labelled. No decorative gridlines. |
| Quote | Pull quote at 28pt, attribution at 12pt Ink muted. |
| Close | Wordmark centred, tagline beneath, contact email. |

No stock imagery. No clip art. No icon sets beyond a disciplined subset of `lucide-react` at 1.5pt stroke.

### 12.3 Data viz palette

Sequential: `#0B1F3A`, `#1E3A5F`, `#3A5F7F`, `#6E8AA6`.
Categorical: `#059669` (primary), `#DC2626` (alert), `#F59E0B` (attention), `#6366F1` (alt).
Never use more than four categorical colours in a single chart. If the data needs more, redesign the chart.

---

## 13. Letterhead

A4 portrait. 25mm top margin, 20mm left/right, 25mm bottom.

Header: Disc mark 18mm, left-aligned at 20mm from the page left edge, 15mm from the top. Wordmark immediately to the right of the mark, aligned to its baseline. No tagline.

Body: Inter 11pt body, 1.5 line-height.

Footer (6pt Ink muted, centred):
```
Global Apex.Net SAS · 4 Bd du Château, 78280 Guyancourt, France
RCS Versailles 941 666 067 · SIREN 941 666 067 · dpo@tenu.world · support@tenu.world
```

Watermark: none. Colour bars: none. Margin rules: none.

---

## 14. Multilingual and RTL rules

### 14.1 Languages in scope

Legal output (PDF reports, dispute letters, préavis letters): **FR or EN only.**
UI languages: FR, EN, AR, ZH, HI, UR (P1); JA, ES, IT, UK (P2); PT, KO (P3).

### 14.2 Source of truth

String tables live at `src/messages/<locale>.json`. Never hardcode user-facing copy in a component.

### 14.3 RTL (Arabic, Urdu)

Tailwind RTL plugin handles layout flip at the component level. In email and PDF where the plugin is unavailable, scope `dir="rtl"` to the containing cell only. Never flip the outer envelope. Line-height increases to 1.75 for AR body and 1.7 for UR body. Headlines in AR use native SF Arabic / Geeza Pro without forced italic.

### 14.4 CJK

Line-height 1.6. Font stack prefers PingFang SC on macOS/iOS, Microsoft YaHei on Windows, Hiragino Sans GB fallback. Never use half-width punctuation in ZH body copy.

### 14.5 Translation quality

Every new string enters FR and EN at commit time. ZH, AR, HI, UR require a native-speaker review pass before ship. No machine-translated user-facing string goes live.

---

## 15. Legal and compliance surface

Every public-facing asset that carries a Tenu identifier must be traceable to the operating entity.

**Operating entity:** Global Apex.Net SAS
**Address:** 4 Bd du Château, 78280 Guyancourt, France
**RCS:** Versailles 941 666 067
**SIREN:** 941 666 067
**Directeur de la publication:** Malik Mubashir Hassan
**DPO:** dpo@tenu.world
**Support:** support@tenu.world
**Domain:** tenu.world

**Trademarks.**
* EUIPO: TENU registered (word mark)
* CNIPA: TENU registered (word mark)
The ® symbol appears only on `/legal` and in the footer of signed commercial contracts. It never appears in product UI.

**Mandatory disclaimer.** See section 3.4. Appears on every PDF, every dispute letter, the `/legal` page, and transactional email bodies that touch legal subject matter.

**Data residency.** Every Tenu data surface stores in Europe: Supabase EU region, Cloudflare R2 EU region, Vercel edge with EU primary. Communicate this plainly in onboarding ("Your photos stay in Europe. Delete anytime.") — this is a trust differentiator, not a throwaway line.

---

## 16. Accessibility

WCAG 2.2 AA is the floor. Where AAA is feasible without hurting density, aim AAA.

* All interactive elements reach 44×44 touch target on mobile.
* Focus-visible ring: 2px `--palette-accent-hover` offset 2px. Never `outline: none` without a replacement.
* Text resizes to 200% without horizontal scroll.
* Alt text on every image that carries meaning. Decorative images get empty alt.
* Form labels are programmatically tied to inputs, never placeholder-only.
* Colour is never the sole carrier of meaning (risk chips pair colour with text label).
* Every PDF emits a tagged structure tree.
* Dispute letter template tested with VoiceOver (iOS) and NVDA (Windows) at each release.

---

## 17. Social media

Channels at launch: X, LinkedIn, Instagram. No TikTok at launch.

**Avatar:** Disc mark at 512×512, Paper carve on Ink navy.
**Header (LinkedIn, X):** 1500×500 Ink navy with Paper wordmark centred-left, tagline small right. No stock imagery.
**Post template (IG/LI):** 1080×1080 Paper background, Ink type, one statistic or one quote per tile. Never more than 25 words.
**Hashtags:** sparingly. Never in product or press releases. On social, max 3 per post.
**No user-generated content re-posts** until a formal UGC consent flow ships.

---

## 18. Asset repository and file naming

**Canonical brand assets live at:** `/public/brand/` in the Tenu repo.

| File | Purpose |
|---|---|
| `mark-disc.svg` | Primary mark, disc container |
| `mark-portal.svg` | Secondary mark, arch container |
| `wordmark.svg` | Type-only wordmark (to be added) |
| `disc-on-paper.png` | Paper-background raster fallback for email |
| `disc-on-ink.png` | Ink-background raster fallback for email |

**External asset package** (zip, for partners, press, investors): exported from `/public/brand/` plus the PDF of this guideline. File name: `tenu-brand-pack-YYYY-MM-DD.zip`.

**File-name conventions:**

* All lowercase, hyphen-separated.
* Date stamp `YYYY-MM-DD` where the asset is time-bound.
* Language suffix `_fr`, `_en`, `_ar`, `_zh` only where the asset is language-specific.
* Version suffix `_v2` when a published asset is superseded.

---

## 19. Change management

This document changes only through a commit on `main` in the Tenu repo. A brand change requires:

1. Pull request with rationale.
2. Side-by-side screenshot (before / after) in the PR description.
3. Dr Mubashir sign-off before merge.
4. If the change touches a palette token, a grep for every downstream consumer must accompany the PR.

Every merge increments the version in Section 1 (major.minor). Minor changes update minor. Structural changes (new section, new token class, new official mark) bump major.

Deprecated assets move to `/public/brand/_archive/` and are never deleted for six months, to preserve link integrity from past emails and social posts.

---

## 20. Quick reference

**Primary colour:** Emerald #059669 (CTA)
**Ink:** Apple ink #1D1D1F (body text)
**Chrome:** Navy #0B1F3A on Paper #F4F1EA (logo, header strips)
**Primary CTA shape:** pill, `border-radius: 9999px`, padding 12px 24px
**Card radius:** 16px. **Button radius (non-pill):** 12px.
**Body type:** system sans stack, 16px, 1.55 line-height
**Brand type:** Inter Tight, weight 500, tracking −0.04em
**Disc logo:** `public/brand/mark-disc.svg`
**Portal logo:** `public/brand/mark-portal.svg`
**Parametric component:** `src/components/brand/TenuMark.tsx`
**Tokens:** `src/app/theme.css`
**Theming doc:** `docs/THEMING.md`
**Email system:** `docs/email-templates/`
**Legal entity:** Global Apex.Net SAS · RCS Versailles 941 666 067
**Tagline (EN):** Your rights. Your language. Your deposit.

---

*End of document.*
