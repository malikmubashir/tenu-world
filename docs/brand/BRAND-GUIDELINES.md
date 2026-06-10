# Tenu · Brand Guidelines

Version 2.0 · 2026-06-10 · Owner: Dr Mubashir (Global Apex.Net SAS)
Source of truth for every Tenu surface: web, iOS, Android, PDF reports, email, presentations, letterhead, social.

Companion specification: `docs/brand/DESIGN-EDITORIAL-2026-06-10.md` (the full Éditorial design contract). Where this document summarises and the spec details, both must agree; if they ever diverge, the spec wins on visual tokens and this document wins on brand rules (voice, wordmark, legal surface).

Change log.
v2.0 (2026-06-10) · **Éditorial system adopted by owner decision.** Supersedes the Apple-crisp body palette and the Identity v1 navy/paper chrome (both 2026-04-18). New system: pure white canvas, absolute black ink, hairline #e5e7eb structure, whisper-weight display type, signal-blue links, black-band inversion instead of shadows. Wordmark unchanged. Mark geometry unchanged; mark grounds recoloured white/black.
v1.1 (2026-04-18) · Repositioned to a full professional services register. Removed the "advocate's voice" framing. *Superseded 2026-06-10.*
v1.0 (2026-04-18) · Initial release (Identity v1). *Superseded 2026-06-10.*

---

## 1. What this document is

This is the canonical reference. If any Tenu asset, template, or partner deliverable disagrees with this file, this file wins.

Tenu operates in a regulated, legally adjacent space. Our users are tenants; our counterparties are landlords, agences, the Commission Départementale de Conciliation, mediators, and tribunals. Every surface we ship is a business instrument, not a marketing artefact: a scan report, a dispute letter, a transactional email, a landing page that a counterparty will read before responding.

The brand therefore holds a **full professional services register** throughout — the discipline of a cabinet d'avocats, a notariat, or a top-tier audit practice. The Éditorial visual system reinforces this: the page reads as a printed catalogue spread or a legal memorandum, not as a software interface. Typography is the primary design material; structure is carried by single-pixel hairlines; colour is reserved for photography and links.

No stock imagery. No marketing buzzwords. No casual register. No visual or verbal shortcut that could undermine the evidentiary or commercial weight of the output.

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

**Positioning.** A multilingual professional service that produces evidence-grade inspection records and dispute correspondence accepted by French mediators and, where applicable, submitted to the Commission Départementale de Conciliation.

**What we are not.** Tenu is not a marketplace, not a landlord tool, not an insurance product, not a law firm. Every surface states this where relevant, and the legal disclaimer in §3.4 is mandatory on every output that could be mistaken for legal advice.

---

## 3. Voice and tone

### 3.1 Principles

1. **Clarity before cleverness.** Users read us under pressure, often in a second or third language. Every sentence must be understood on first pass.
2. **Evidence over rhetoric.** We state facts and cite articles. We do not dramatize, editorialise, or catastrophise.
3. **Professional neutrality.** Tenu serves tenants. Tenu does not campaign against landlords. A counterparty reading any Tenu output must find it procedurally correct and factually precise, even if the conclusions are unwelcome.
4. **Legal precision where it matters.** We cite article numbers verbatim (art. 22 loi du 6 juillet 1989; art. L221-28 Code de la consommation). We never paraphrase law into slogan.
5. **Multilingual symmetry.** Every user-facing sentence ships in each target language at commit time. We do not publish "coming soon" translations, and we do not ship machine-translated copy.
6. **Register consistency.** The same institutional tone carries from the landing page through checkout, inspection flow, PDF report, dispute letter, and support email. No register shift between marketing and product.

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

**The wordmark is unchanged in v2.0** (owner requirement, 2026-06-10). The definition and rules below carry over from v1.1 verbatim; only the colour-usage table is repointed to the Éditorial palette, since the retired Paper/navy values can no longer appear on any surface.

The wordmark is **lowercase `tenu`**, set in Inter Tight (brand font), weight 500, tracking 0.04em negative, no full stop, no period, no underscore, no tagline locked beneath.

Rules:

* Never capitalise the T.
* Never italicise.
* Never add a superscript ™ or ® in body copy. The marks (EUIPO registered, CNIPA registered) appear only in legal footers and on the `/legal` page.
* The wordmark never appears inside a box, ribbon, shield, or beveled plate.
* Minimum rendered size on screen: 14px. On print: 10pt.

Colour usage (v2.0 palette):

| Background | Wordmark colour | Hex |
|---|---|---|
| White canvas | Absolute black | #000000 |
| Black inversion band | Pure white | #ffffff |
| Any photo or image | Pure white on a black plate, never floating | #ffffff |

Font stack (brand):
```
var(--font-inter-tight), "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif
```

---

## 5. Logo system

Tenu ships a **parametric identity mark** (component: `TenuMark`) that renders a fixed human figure (globe head, horizontal arm bar, vertical body bar) carved out of one of eleven container shapes. Two containers carry official status; the remaining nine are available for editorial and product use but require design review before external publication.

**Mark geometry is an owner requirement and is unchanged in v2.0.** Only the grounds were recoloured: the container fill moves from navy #0B1F3A to absolute black #000000, and the carve/backdrop from Paper #F4F1EA to pure white #ffffff.

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

The head is re-painted in the carve colour after carving, so it reads as a filled disc rather than a hollow cut. This is non-negotiable: on dark backgrounds, without the overlay, the head disappears.

### 5.3 Default palette (v2.0)

```
fill   = Absolute Black  #000000
carve  = Pure White      #ffffff
```

Inverted (inside a black band): fill #ffffff, carve #000000.

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
* Never recolour the fill in a way that drops below 4.5:1 contrast against the background. In practice the mark is black-on-white or white-on-black only; no third colourway exists in this system.
* Never place the mark on a busy photograph; use a white or black plate behind it.
* Never change the proportions of the figure (head / arms / body bars).
* Never add shadow, glow, or bevel.
* Never animate the mark on the landing page beyond a single fade-in on load.

### 5.7 The nine editorial containers

`oval`, `square`, `arch`, `vesica`, `crescent`, `flag`, `hex`, `shield`, `rounded`. Available for internal use, campaign microsites, and limited social posts. Any external use (press kit, partner co-branding, printed collateral) must be signed off by the brand owner before release.

---

## 6. Colour system

Tenu runs a **two-layer token architecture** in `src/app/theme.css`. Layer 1 is the raw palette. Layer 2 remaps palette slots to semantic names. Components consume only semantic names so the entire site can reskin by swapping one block. Legacy aliases (layer 3) keep 25+ older files compiling; see `docs/THEMING.md`.

### 6.1 Éditorial palette (canonical, 2026-06-10)

The system is almost entirely achromatic. The single chromatic note is Signal Blue, reserved for links and active states. All warmth and colour belong to photography (§10).

| Token | Hex | Role |
|---|---|---|
| `--palette-canvas` | #ffffff | Pure White — the only light surface. Page background, card surfaces, inverted text on black bands. |
| `--palette-ink` | #000000 | Absolute Black — primary text, headings, navigation, inverted section bands, footer surfaces. The dominant ink of the system. |
| `--palette-hairline` | #e5e7eb | Hairline Gray — structural borders, dividers, key-value grid frames. The load-bearing neutral of the entire layout system. |
| `--palette-ink-muted` | #6b7280 | Stone Gray — quiet UI feedback, badge text, secondary text. Never promoted to a CTA colour. |
| `--palette-ash` | #b3b3b3 | Ash — muted body text, captions, placeholder and helper text. |
| `--palette-quartz` | #bbbbbb | Quartz — tertiary text, fine print. |
| `--palette-accent` | #2563eb | Signal Blue — active links, focus states, inline emphasis. **Links and focus only. Never a fill, background, or decorative element.** |
| `--palette-accent-hover` | #1d4ed8 | Darkened state of the same hue. No second accent exists. |
| `--palette-band-inverted` | #000000 | Inverted Black band — the sole elevation shift in the system. |
| `--palette-cta` | #000000 | **Approved exception** (MH, 2026-06-10): filled primary action for paid/commercial steps. See §9. |
| `--palette-cta-text` | #ffffff | Label colour on the filled CTA. |
| `--palette-danger` / `--palette-warning` / `--palette-success` | #DC2626 / #F59E0B / #16A34A | Functional form and risk-scan states only — never chrome, never decoration. |

Retired in v2.0: emerald #059669 (CTA), Apple ink #1D1D1F, band #EEEEF1, hairline #D2D2D7, navy #0B1F3A, Paper #F4F1EA, Paper-2 #EDE8DC, Notaire red #8B2E2A. The `--palette-brand-*` token names survive in `theme.css` for compile compatibility but now resolve to the achromatic system.

### 6.2 Where each colour belongs

Body text, headings, nav: #000000 on #ffffff. No near-blacks, no dark greys for primary text.
Structure: 1px #e5e7eb hairlines. Hairlines replace cards, boxes, panels, and shadows.
Links and focus: #2563eb, and nothing else is ever blue.
Paid actions: filled #000000 button, white label (§9).
De-emphasis: #6b7280 for quiet UI feedback, #b3b3b3 for captions/placeholders, #bbbbbb for fine print.
Section breaks: full-width #000000 bands with #ffffff text.

### 6.3 Contrast (WCAG AA)

| Foreground | Background | Ratio | Pass |
|---|---|---|---|
| #000000 | #ffffff | 21:1 | AAA |
| #ffffff | #000000 | 21:1 | AAA |
| #6b7280 | #ffffff | 4.8:1 | AA body |
| #2563eb | #ffffff | 5.2:1 | AA body |
| #b3b3b3 | #ffffff | 2.4:1 | Decorative/large only — never body copy |
| #DC2626 | #ffffff | 4.8:1 | AA |

Rule: any body text must hit 4.5:1 minimum. Ash #b3b3b3 and Quartz #bbbbbb are reserved for captions, placeholders, and fine print at sizes where the reduced contrast is deliberate de-emphasis; they never carry load-bearing copy.

---

## 7. Typography

### 7.1 Font stacks

The Éditorial spec designates a single geometric sans for everything (reference face "Plain"); **Inter is the production substitute**, loaded via `next/font`.

**Body stack (`--font-sans`):**
```
var(--font-inter, "Inter"), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

**Brand stack (`--font-brand`) — wordmark only, unchanged:**
```
var(--font-inter-tight), "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif
```

**Multilingual stack (email, PDF, mixed scripts):**
```
'Inter', -apple-system, BlinkMacSystemFont, "SF Arabic", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Arial, sans-serif
```

Inter and Inter Tight are the only webfonts we accept. Arabic and CJK always render in native system fonts — never load a webfont for those scripts.

### 7.2 Weights

| Weight | Use |
|---|---|
| 300 | Display and section headlines — the whisper-weight giant is the system's signature move |
| 400 | Body copy, navigation, links |
| 500 | Section labels, micro-emphasis, CTA labels, wordmark |
| 600 | Rare micro-labels; never headlines |

### 7.3 Scale (with responsive clamps)

Spec sizes are 16/18/24/30/50/100px. The two large steps ship as clamps so the 100px display degrades gracefully on phones:

| Token | Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `--font-size-display` | clamp(2.75rem, 7vw + 1rem, 6.25rem) → 100px desktop | 1.0 | −0.05em | 300 | Hero / display headline |
| `--font-size-section` | clamp(2rem, 3.5vw + 0.75rem, 3.125rem) → 50px | 1.08 | −0.04em | 300 | Section heading |
| `--font-size-heading` | 1.875rem (30px) | 1.13 | −0.025em | 300 | Sub-section heading |
| `--font-size-h3` | 1.5rem (24px) | 1.25 | −0.002em | 400 | Card / inline heading |
| `--font-size-subhead` | 1.125rem (18px) | 1.5 | 0 | 400 | Lead paragraph |
| `--font-size-body` | 1rem (16px) | 1.56 | 0 | 400 | Paragraph body — the floor for reading copy |
| `--font-size-label` | 1rem (16px) | — | 0 | 500 | Section labels (magazine kicker). Not micro-caps. |
| `--font-size-small` | 0.875rem (14px) | 1.55 | 0 | 400 | Legal fine print only — the spec floor for body is 16px |

The aggressive negative tracking at large sizes is the signature: letters pull together as the type grows, creating a condensed, monumental feel. Title case for display headlines, not sentence case.

### 7.4 Non-Latin tracking rule (mandatory)

**Negative tracking is a Latin-only device. For Arabic and Urdu (`html[lang="ar"]`, `html[lang="ur"]`) every tracking token zeroes out** — negative letter-spacing destroys Arabic script shaping. The display weight also bumps from 300 to 400, because whisper-weight is illegible in Naskh/Nastaliq at display sizes. These overrides live at the bottom of `theme.css`; never bypass them. CJK keeps tracking at 0 by virtue of the script; line-height rules in §14 still apply.

---

## 8. Structure: hairlines, radii, elevation, motion

### 8.1 Hairline doctrine

The 1px #e5e7eb hairline is the load-bearing structural unit of the entire layout. It does the work that cards, boxes, panels, and shadows do in a conventional UI:

* Section separation: a full-container-width 1px bottom border, 24–32px padding above, no margin below.
* Grids: equal cells framed by 1px borders on all sides (blueprint style), 0px radius, text sitting close to the frame.
* Navigation: white bar with a single 1px bottom hairline. No fill change on scroll, no shadow.
* Footer: 1px top hairline, white ground.
* Never place a white card on a white background. If a surface needs separation, give it a hairline frame or move it into a black band.

### 8.2 Radii

| Element | Radius |
|---|---|
| Cards, images, buttons, sheets, bands | **0px** |
| Inputs | 2px — the only radius in the system |

Sharp corners preserve the architectural, blueprint-like surface. Never exceed 2px anywhere.

### 8.3 Elevation: the black band

The system is **shadowless**. No drop shadows, no blurs, no z-axis stacks — all shadow tokens resolve to `none`. Depth is communicated solely by horizontal band inversion:

* A full-width #000000 band with #ffffff text, 64–80px vertical padding, is the sole elevation shift.
* Use black bands for section breaks, the footer, download/catalogue-style sections, and closing CTAs.
* Content inside a band sits directly on the black ground with no additional chrome — the inversion *is* the elevation.
* Muted text inside a band uses Ash #b3b3b3.

### 8.4 Inputs

White ground, 1px #6b7280 border, 2px radius, black text, placeholder in #b3b3b3. **No focus ring glow on inputs — the border simply darkens to #000000 on focus.** (Keyboard focus-visible for non-input interactive elements uses a 2px Signal Blue ring; see §16.)

### 8.5 Motion

Unchanged from v1 (interaction tokens #T134):

```
--ease-hig: cubic-bezier(0.22, 0.61, 0.36, 1);
--duration-hig-fast: 150ms;  --duration-hig-base: 220ms;  --duration-hig-slow: 320ms;
```

Nothing longer than 320ms. Never bounce. Never parallax.

### 8.6 Layout

Page frame max-width 1440px (`--page-max-width`); reading measure 64rem (`--content-max-width`). Bands run full-bleed. Section gap 64–80px (`--section-padding-y`). The page reads top-to-bottom as a continuous editorial scroll — no sidebars, no split content within sections.

---

## 9. Actions: buttonless, with one exception

### 9.1 The doctrine

The Éditorial system refuses filled buttons. Every action reads as a typographic link:

* **Inline link:** weight 400, #000000 text with a 1px #e5e7eb underline. Hover/active shifts text and underline to #2563eb.
* **Ghost CTA ("Show more", "View all"):** weight 500, 16px, #000000 text with a 1px #000000 underline, no background, no border, no padding chrome, flush-left. Hover shifts to #2563eb.
* Inside black bands, links are #ffffff with a #ffffff underline.

No pills, no rounded buttons, no coloured fills, no hover-only flourishes.

### 9.2 The approved exception (MH, 2026-06-10)

**Primary commercial actions — Pay, Run scan, checkout — use a filled #000000 button: 0px radius, #ffffff label, weight 500.** This is the only filled action in the product, and it exists because a paid commitment must be unambiguous. Token: `--color-tenu-cta`. Rules:

* One filled CTA per view, maximum.
* Only for actions that take money or start the paid scan. Navigation, auth, settings, downloads remain typographic.
* Inside a black band, the exception inverts: white fill, black label.
* Never blue, never grey, never outlined-as-a-button.

### 9.3 Signal Blue discipline

#2563eb signals "this is a link / this has focus" and nothing else. Never a fill, never a background, never an icon tint for decoration, never a chart colour for emphasis. The 1% colourfulness is the point.

---

## 10. Imagery

Photography carries **all** the colour and warmth the achromatic chrome refuses to supply.

* **Direction:** warm editorial photography of real rental interiors — entry halls, kitchens, worn parquet, radiators, window light. Sharp, high-key, naturally warm-toned (terracotta, oak, plaster). The dwelling is the subject; no people posing, no lifestyle staging.
* **Treatment:** full-bleed, unframed, 0px radius, no duotone, no overlays, no filters. Often followed immediately by a black band.
* **Sourcing:** Unsplash is acceptable as an interim source pre-launch, selected to the direction above and license-checked. **Commissioned photography replaces all interim imagery before public launch (15 Jul).** No generic stock-library aesthetics at any point — if it looks like stock, it does not ship.
* No illustrations, no icon decoration, no clip art. Thin-stroke 1px line motifs (circles, rules) are the only permitted graphic ornament.
* Evidence photos inside reports are documentary material, not brand imagery — they are never treated, cropped for style, or colour-graded.

---

## 11. Email system

All Tenu email templates live at `docs/email-templates/`. See `docs/email-templates/README.md` for paste-in instructions.

### 11.1 Stacked multilingual pattern

Six Supabase auth templates plus one Brevo welcome template. Each file ships **four languages stacked in one email** (FR → EN → ZH → AR), separated by 1px hairlines. The Arabic block carries `dir="rtl"` scoped to its cell; the outer envelope stays LTR so Outlook desktop does not mirror the layout.

### 11.2 Rendering rules (v2.0)

* Table layout, inline styles, max width 560px.
* White envelope on white ground; the content table carries a 1px #e5e7eb border, 0px radius, no shadow.
* Header: black #000000 strip with the type-only wordmark in white. No webfont — falls back Inter → system sans → Arial.
* Headings and body in #000000; muted/caveat text in #6b7280; hairlines #e5e7eb.
* CTA button: filled #000000, square (0px radius), white label — the §9.2 exception applies because auth/checkout links are primary actions in email context. Built Outlook-safe via `bgcolor` + inline `background` on the `<td>`.
* Text links: #2563eb, underlined.
* Disc mark served from `https://tenu.world/apple-icon` (180×180 PNG via Next icon route).
* Light mode only (`meta color-scheme: light only`).
* Footer carries the Global Apex.Net SAS legal line and DPO/support addresses.

### 11.3 Subjects (Supabase templates)

| Template | Subject |
|---|---|
| Confirm signup | Tenu · confirmez votre email / confirm your email / 确认邮箱 / أكّد بريدك |
| Invite | Tenu · invitation / 邀请 / دعوة |
| Magic link | Tenu · lien de connexion / sign-in link / 登录链接 / رابط تسجيل الدخول |
| Change email | Tenu · nouvelle adresse / new email / 新邮箱 / بريد جديد |
| Reset password | Tenu · mot de passe / reset password / 重置密码 / كلمة المرور |
| Reauthentication | Tenu · code de vérification / verification code / 验证码 / رمز التحقق |

### 11.4 Signature block

Plain text, no logo inline, one blank line between paragraphs.

```
Dr Mubashir — Founder
Tenu · tenu.world
Global Apex.Net SAS · 4 Bd du Château, 78280 Guyancourt, France
RCS Versailles 941 666 067 · DPO: dpo@tenu.world
```

No social links. No marketing tagline. No quote of the day.

---

## 12. PDF report and letter system

Generated in-code via `@react-pdf/renderer`. No Placid, no Canva, no Figma export.

### 12.1 Layout

A4 portrait. 20mm outer margin on all sides. Single column body, 12pt Inter/Helvetica fallback. Line-height 1.45.

### 12.2 Header

Full-width **black** strip, 28mm tall (the print equivalent of the inversion band). Disc mark at 18mm, white-on-black colourway, left-aligned, with 6mm clear space. Wordmark in white immediately to the right of the mark.

### 12.3 Cover page

Title in Inter 300, 28pt (whisper-weight display carries to print). Subtitle (property address + date of scan) in 14pt black. A single horizontal 0.5pt #e5e7eb hairline below the subtitle. No photograph on the cover.

### 12.4 Body sections

H2: 16pt 400 black, generous space above, hairline below. Body: 11pt 400 black. Captions: 9pt 400 #6b7280. Evidence photos embedded at 80mm max width, unframed, square corners, each with a sha256 checksum and capture timestamp printed directly below.

### 12.5 Footer (every page)

```
Tenu · Global Apex.Net SAS · RCS Versailles 941 666 067
Tenu fournit une aide documentaire et rédactionnelle. Tenu n'est pas un cabinet d'avocats.
Page X of Y
```

### 12.6 Dispute letter

Matches CDC (France) or TDS/DPS (UK) formal layout. Sender block top-right. Recipient block left. Ref line. Object line. Body in numbered paragraphs. Signature: printed full name + "Fait à [ville], le [date]". No Tenu branding in the letter body itself — Tenu appears only as a small footer acknowledging drafting support.

---

## 13. Presentation system

### 13.1 Deck masters

One master: **white canvas, black ink, hairline rules** — the product system carried to slides. Closing and section-divider slides may invert to full black with white type. Inter 300 for display headlines, Inter 400 body, Inter Tight 500 for the wordmark only.

### 13.2 Slide types

| Slide | Rule |
|---|---|
| Title | Disc mark top-left at 32px, deck title in display 300, date bottom-right. No subtitle. |
| Section | Black inversion slide: white display type on #000000. |
| Content | One headline + max 5 body lines. Hairline under the headline. Never a wall of text. |
| Chart | One chart per slide. Axes labelled. Hairline gridlines only. |
| Quote | Pull quote at 28pt weight 300, attribution at 12pt #6b7280. |
| Close | Black band: wordmark centred in white, tagline beneath, contact email. |

No stock imagery. No clip art. No icon sets beyond a disciplined subset of `lucide-react` at 1.5pt stroke, black only.

### 13.3 Data viz palette

Sequential (achromatic): `#000000`, `#4b5563`, `#9ca3af`, `#e5e7eb`.
Categorical: `#000000` (primary), `#2563eb` (comparison), `#DC2626` (alert), `#F59E0B` (attention).
Never more than four categorical colours in a single chart. If the data needs more, redesign the chart.

---

## 14. Letterhead

A4 portrait. 25mm top margin, 20mm left/right, 25mm bottom.

Header: Disc mark 18mm (black-on-white), left-aligned at 20mm from the page left edge, 15mm from the top. Wordmark in black immediately to the right of the mark, aligned to its baseline. No tagline. A single 0.5pt hairline rule across the page below the header block.

Body: Inter 11pt body, 1.5 line-height, black.

Footer (6pt #6b7280, centred, above a 0.5pt hairline):
```
Global Apex.Net SAS · 4 Bd du Château, 78280 Guyancourt, France
RCS Versailles 941 666 067 · SIREN 941 666 067 · dpo@tenu.world · support@tenu.world
```

Watermark: none. Colour bars: none.

---

## 15. Multilingual and RTL rules

### 15.1 Languages in scope

Legal output (PDF reports, dispute letters, préavis letters): **FR or EN only.**
UI languages: FR, EN, AR, ZH, HI, UR (P1); JA, ES, IT, UK (P2); PT, KO (P3).

### 15.2 Source of truth

String tables live with their pages/components in the repo. Never hardcode user-facing copy outside the established dictionaries.

### 15.3 RTL (Arabic, Urdu)

Tailwind RTL plugin handles layout flip at the component level. In email and PDF where the plugin is unavailable, scope `dir="rtl"` to the containing cell only. Never flip the outer envelope. Line-height increases to 1.75 for AR body and 1.7 for UR body. Headlines in AR use native SF Arabic / Geeza Pro without forced italic. **All negative tracking zeroes out and display weight bumps to 400 for AR/UR — see §7.4. This is a hard rule.**

### 15.4 CJK

Line-height 1.6. Font stack prefers PingFang SC on macOS/iOS, Microsoft YaHei on Windows, Hiragino Sans GB fallback. Never use half-width punctuation in ZH body copy. Tracking 0.

### 15.5 Translation quality

Every new string enters FR and EN at commit time. ZH, AR, HI, UR require a native-speaker review pass before ship. No machine-translated user-facing string goes live.

---

## 16. Accessibility

WCAG 2.2 AA is the floor. Where AAA is feasible without hurting density, aim AAA. The black-on-white system clears AAA for all primary text by construction.

* All interactive elements reach 44×44 touch target on mobile.
* Focus-visible ring: 2px Signal Blue #2563eb, offset 2px, on links, buttons and controls. Inputs are the exception: no ring glow — the border darkens to #000000 (§8.4). Never `outline: none` without a replacement.
* Text resizes to 200% without horizontal scroll.
* Alt text on every image that carries meaning. Decorative images get empty alt.
* Form labels are programmatically tied to inputs, never placeholder-only.
* Colour is never the sole carrier of meaning (risk states pair colour with text label).
* Ash/Quartz text is never load-bearing (§6.3).
* Every PDF emits a tagged structure tree.
* Dispute letter template tested with VoiceOver (iOS) and NVDA (Windows) at each release.

---

## 17. Social media

Channels at launch: X, LinkedIn, Instagram. No TikTok at launch.

**Avatar:** Disc mark at 512×512, white carve on absolute black.
**Header (LinkedIn, X):** 1500×500 black with white wordmark centred-left, tagline small right in Ash. No stock imagery.
**Post template (IG/LI):** 1080×1080 white background, black type, hairline frame, one statistic or one quote per tile. Display weight 300. Never more than 25 words. Alternate occasional full-black tiles with white type.
**Hashtags:** sparingly. Never in product or press releases. On social, max 3 per post.
**No user-generated content re-posts** until a formal UGC consent flow ships.

---

## 18. Asset repository and file naming

**Canonical brand assets live at:** `/public/brand/` in the Tenu repo.

| File | Purpose |
|---|---|
| `mark-disc.svg` | Primary mark, disc container (black on white, v2 grounds) |
| `mark-portal.svg` | Secondary mark, arch container (black on white, v2 grounds) |
| `wordmark.svg` | Type-only wordmark (to be added) |
| `disc-on-white.png` | White-background raster fallback for email (to be regenerated) |
| `disc-on-black.png` | Black-background raster fallback for email (to be regenerated) |

App icon and splash sources live in `resources/` (`icon.svg`, `icon-foreground.svg`, `icon-background.svg`, `splash.svg`, `splash-dark.svg`) — all re-grounded to v2 on 2026-06-10. Regenerate the PNG ladder with `node scripts/generate-icons.mjs` (or `npx capacitor-assets generate`) on the Mac after any source change.

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

Every merge increments the version in Section 1 (major.minor). Minor changes update minor. Structural changes (new section, new token class, new official mark) bump major. v2.0 itself was adopted by direct owner decision on 2026-06-10, superseding Identity v1.

Deprecated assets move to `/public/brand/_archive/` and are never deleted for six months, to preserve link integrity from past emails and social posts.

---

## 20. Quick reference

**Canvas:** Pure White #ffffff — the only light surface
**Ink:** Absolute Black #000000 — text, nav, bands, mark fill
**Structure:** 1px hairlines #e5e7eb — no cards, no shadows
**Accent:** Signal Blue #2563eb — links and focus ONLY
**Paid CTA (sole exception):** filled #000000, 0px radius, white label
**Elevation:** black band inversion. Shadowless system.
**Radii:** 0px everywhere; inputs 2px
**Display type:** Inter 300, clamp → 100px, tracking −0.05em (zeroed for AR/UR)
**Body type:** Inter 400, 16px, 1.56 line-height
**Brand type (wordmark, unchanged):** Inter Tight, weight 500, tracking −0.04em, lowercase `tenu`
**Imagery:** warm editorial interior photography carries all colour; Unsplash interim, commissioned before launch
**Disc logo:** `public/brand/mark-disc.svg` · **Portal logo:** `public/brand/mark-portal.svg`
**Parametric component:** `src/components/brand/TenuMark.tsx`
**Tokens:** `src/app/theme.css` · **Spec:** `docs/brand/DESIGN-EDITORIAL-2026-06-10.md`
**Theming doc:** `docs/THEMING.md` · **Email system:** `docs/email-templates/`
**Legal entity:** Global Apex.Net SAS · RCS Versailles 941 666 067
**Tagline (EN):** Your rights. Your language. Your deposit.

---

*End of document.*
