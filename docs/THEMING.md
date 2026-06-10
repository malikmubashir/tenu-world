# Theming Tenu

One file controls the entire aesthetic: `src/app/theme.css`.

Swap its palette block, reload, the whole site repaints. No component code changes. No JSX edits. No rebuild of Tailwind config. That is the whole point of the two-layer token architecture.

**Current theme: "Éditorial" v2** (adopted 2026-06-10, MH decision). Full design contract: `docs/brand/DESIGN-EDITORIAL-2026-06-10.md`. Brand rules: `docs/brand/BRAND-GUIDELINES.md` v2.0.

## How the swap works

Theme.css declares a Tailwind 4 `@theme` block in layers, top to bottom:

1. **Palette** (layer 1) — raw hex values. Change here only.
2. **Brand chrome** (layer 1b) — `--palette-brand-*` tokens. Historically the Identity v1 navy/paper chrome; since 2026-06-10 they resolve to the achromatic editorial values (ink #000000, paper #ffffff, rule #e5e7eb) so header, PDF and wordmark surfaces keep compiling.
3. **Semantic tokens** (layer 2) — `--color-tenu-accent`, `--color-tenu-ink`, `--color-tenu-canvas`, `--color-tenu-cta`, etc. Components reference these via Tailwind utilities (`text-tenu-accent`) or the `.t-*` classes.
4. **Legacy aliases** (layer 3) — old preset names still used by 25+ files. Do not remove.

Components use semantic names, never raw palette values. That is why a palette edit propagates everywhere in one step.

## Legacy alias mappings (Éditorial v2)

The old Forest/Apple-crisp class names resolve as follows since 2026-06-10:

| Legacy alias | Now resolves to | Editorial value |
|---|---|---|
| `--color-tenu-forest` | `--color-tenu-ink` | #000000 — old emerald CTA → ink. Real CTAs use `--color-tenu-cta`. |
| `--color-tenu-forest-light` | `--color-tenu-accent` | #2563eb — old hover-green → signal blue |
| `--color-tenu-cream` | `--color-tenu-canvas` | #ffffff |
| `--color-tenu-cream-dark` | `--color-tenu-band` | #ffffff — no off-white surfaces in the system |
| `--color-tenu-slate` | `--color-tenu-ink` | #000000 |
| `--color-tenu-gold` | `--color-tenu-ink-muted` | #6b7280 — gold retired, achromatic system |
| `--color-tenu-gold-light` | `--color-tenu-ash` | #b3b3b3 |

Shorthand: **forest→ink, gold→muted, cream→white.** Old markup keeps compiling and lands inside the editorial palette automatically; new code should use the semantic names directly.

## Preset: Éditorial v2 (current, canonical since 2026-06-10)

White canvas, absolute black ink, hairline structure, signal-blue links-only, filled-black paid CTA (approved exception), 0px radii, shadowless.

```css
--palette-accent:        #2563eb;  /* Signal Blue — links / active / focus ONLY, never fills */
--palette-accent-hover:  #1d4ed8;
--palette-ink:           #000000;  /* Absolute Black */
--palette-ink-muted:     #6b7280;  /* Stone Gray */
--palette-ash:           #b3b3b3;  /* captions, placeholders */
--palette-quartz:        #bbbbbb;  /* fine print */
--palette-canvas:        #ffffff;  /* Pure White — the only light surface */
--palette-band:          #ffffff;  /* no off-white bands; hairline frames or black bands */
--palette-band-inverted: #000000;  /* the sole elevation shift */
--palette-hairline:      #e5e7eb;  /* load-bearing structural borders */
--palette-cta:           #000000;  /* APPROVED EXCEPTION — filled paid-action button */
--palette-cta-text:      #ffffff;
```

Beyond colour, v2 also sets: radii 0px everywhere (inputs 2px), all shadow tokens `none`, display type Inter 300 with clamp to 100px and −0.05em tracking (zeroed for AR/UR via `:lang` overrides at the bottom of theme.css).

## Retired presets (historical reference only)

These shipped before 2026-06-10 and must not return without an owner decision:

* **Apple-Crisp** (Apr–Jun 2026) — emerald #059669 CTA, Apple ink #1D1D1F, band #EEEEF1, hairline #D2D2D7.
* **Identity v1 chrome** (Apr–Jun 2026) — navy #0B1F3A on Paper #F4F1EA, Notaire red #8B2E2A.
* **Forest-Classic** (pre-redesign) — forest green #1B4D3E on warm cream.

## What NOT to change in theme.css without design review

Typography scale, radii, shadow tokens, motion curves, the AR/UR tracking overrides, and the buttonless/CTA-exception split. These ARE the Éditorial system — the negative-tracking display type, the 0px radii and the shadowless flatness define the brand more than any hex value does.

Specific v2 invariants:

* `--radius-*` stays 0px (inputs 2px). A radius bump anywhere breaks the architectural surface.
* `--shadow-*` stays `none`. Depth = black-band inversion + hairlines, nothing else.
* `--palette-accent` is never referenced as a background. Blue is links/focus only.
* `--palette-cta` is the only filled action and stays #000000.
* The `html[lang="ar"], html[lang="ur"]` block zeroes tracking and bumps display weight to 400 — never remove it.

## Component classes (`.t-*`)

Canonical surfaces live in `src/app/globals.css` under `@layer components`:

- `.t-display` — hero h1 (display clamp, weight 300, tight tracking)
- `.t-section-heading` — section h2
- `.t-h3` — card title
- `.t-body`, `.t-body-muted`, `.t-small-muted`, `.t-label` — prose
- `.t-cta-primary` — the filled paid-action button (black, 0px radius — §9.2 of the brand guidelines)
- `.t-cta-ghost` — underlined typographic action link
- `.t-card` — hairline-framed surface, 0px radius, no shadow
- `.t-section-canvas`, `.t-section-band` — full-width page sections (band-inverted = black)
- `.t-content` — centred column, 1024px max
- `.t-hairline` — 1px #e5e7eb separator border colour
- `.t-wordmark` — lowercase `tenu`, Inter Tight 500, tracking −0.04em (unchanged across themes)

New pages reach for these first. Only drop to raw Tailwind utilities for one-offs that would pollute the component class catalogue.

## Why this structure

The previous pattern scattered colour and type decisions across components. Changing the palette meant a 25-file sweep and a merge conflict waiting to happen. One token file, one swap, no grep — that is the contract. The 2026-06-10 reskin to Éditorial v2 was executed exactly this way: theme.css rewritten, legacy aliases repointed, components left compiling.
