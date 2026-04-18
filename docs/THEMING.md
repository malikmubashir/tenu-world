# Theming Tenu

One file controls the entire aesthetic: `src/app/theme.css`.

Swap its palette block, reload, the whole site repaints. No component code changes. No JSX edits. No rebuild of Tailwind config. That is the whole point of the two-layer token architecture.

## How the swap works

Three layers, top to bottom:

1. **Palette** (`theme.css`, layer 1) — raw hex values. Change here only.
2. **Semantic tokens** (`theme.css`, layer 2) — `--color-tenu-accent`, `--color-tenu-ink`, `--color-tenu-canvas`, etc. Components reference these via Tailwind utilities (`text-tenu-accent`) or the `.t-*` classes.
3. **Legacy aliases** (`theme.css`, layer 3) — `--color-tenu-forest`, `--color-tenu-cream`, `--color-tenu-slate`. Old classname surfaces (25+ files) still resolve through these aliases. Do not remove.

Components use semantic names, never raw palette values. That is why a palette edit propagates everywhere in one step.

## Swap recipe

1. Open `src/app/theme.css`.
2. Replace the values under `/* 1. PALETTE */` with one of the presets below, or your own values.
3. Reload the dev server (Next fast refresh handles it, no restart needed).
4. Done.

Do not touch `globals.css`, components, or `tailwind.config.ts`. If you find yourself editing those to change colour, stop — you are defeating the architecture.

## Preset: Apple-Crisp (current, April 2026)

Vivid emerald accent, pure white canvas, near-black ink. iOS / macOS Sonoma reference.

```css
--palette-accent:        #059669;
--palette-accent-hover:  #10B981;
--palette-ink:           #1D1D1F;
--palette-ink-muted:     #6E6E73;
--palette-canvas:        #FFFFFF;
--palette-band:          #EEEEF1;
--palette-hairline:      #D2D2D7;
```

## Preset: Forest-Classic (original Tenu, pre-redesign)

Muted forest green on warm cream. Elegant, quiet, low contrast.

```css
--palette-accent:        #1B4D3E;
--palette-accent-hover:  #2A6B55;
--palette-ink:           #334155;
--palette-ink-muted:     #64748B;
--palette-canvas:        #F5F0EB;
--palette-band:          #E8DDD4;
--palette-hairline:      #D6CABC;
```

## Preset: Indigo-Night (example, dark-inspired)

Royal indigo accent on off-white. Editorial feel.

```css
--palette-accent:        #4338CA;
--palette-accent-hover:  #6366F1;
--palette-ink:           #0F172A;
--palette-ink-muted:     #475569;
--palette-canvas:        #FAFAFA;
--palette-band:          #F1F5F9;
--palette-hairline:      #E2E8F0;
```

## What NOT to change in theme.css without design review

Typography scale, radii, shadows, motion curves. These shape the whole visual system — a font-weight drop or shadow swap changes the brand more than a colour swap does.

If you change them, change them deliberately. If you just want a new palette, only touch the palette block.

## Component classes (`.t-*`)

Canonical surfaces live in `src/app/globals.css` under `@layer components`:

- `.t-display` — hero h1
- `.t-section-heading` — section h2
- `.t-h3` — card title
- `.t-body`, `.t-body-muted`, `.t-small-muted`, `.t-label` — prose
- `.t-cta-primary` — emerald pill button
- `.t-cta-ghost` — text CTA with arrow
- `.t-card` — white rounded surface with soft shadow
- `.t-section-canvas`, `.t-section-band` — full-width page sections
- `.t-content` — centred column, 1024px max
- `.t-hairline` — Apple-style separator border colour

New pages reach for these first. Only drop to raw Tailwind utilities for one-offs that would pollute the component class catalogue.

## Why this structure

The previous pattern scattered colour and type decisions across components. Changing the palette meant a 25-file sweep and a merge conflict waiting to happen. One token file, one swap, no grep — that is the contract.
