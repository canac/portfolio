# CLAUDE.md

## Stack

Astro 7 + TypeScript, plain CSS, pnpm, oxfmt. Static build. Resume PDF is generated at build via Puppeteer.

## CSS

- **Flexbox + gap for layout** Lay out siblings with flexbox/grid and gap, not `margin`/`padding` between siblings. Reserve `margin` for one-off spacing where there is no shared container.
- **Native CSS nesting** Nest child selectors and `&:hover`/`&:focus` inside their parent rule.
- **Tokenize values** Font sizes, spacing, gaps, margins, radii, and colors live as custom properties (`:root`). Reuse tokens instead of magic numbers.
- **Use `rem`** for font sizes and spacing.
- **Print styles** Keep print layout a simple, single-column format.

## HTML

- **Use HTML entities** for special characters.
