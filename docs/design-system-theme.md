# Dark Enterprise Emerald Theme

## Brand Profile
- Theme name: Dark Enterprise Emerald
- Personality: trusted, technical, modern, premium, calm
- Signature: emerald accent on deep navy surfaces with subtle glass and soft glow depth

## Semantic Tokens
These are defined in `src/index.css` and should be used through Tailwind classes:
- `surface-base`
- `surface-elevated`
- `surface-muted`
- `text-primary`
- `text-secondary`
- `accent-primary`
- `border-subtle`
- `border-strong`

## Surface Scale
- Level 1 page background: `surface-base`
- Level 2 section background: `surface-elevated`
- Level 3 card/panel background: `surface-muted`

## Radius Scale
- `rounded-ds-sm`: chips/compact inputs
- `rounded-ds-md`: cards/buttons/default interactive elements
- `rounded-ds-lg`: feature/icon panels
- `rounded-ds-xl`: hero/special container shells

## Shadow Scale
- `shadow-soft`: default cards and shells
- `shadow-glow`: accent-focused interactive elements and primary CTA
- `shadow-deep`: hero/special elevated containers

## Spacing Rhythm
- Container horizontal spacing: `px-4 sm:px-6 lg:px-8`
- Section spacing utility: `section-shell`
- Panel padding utility: `panel-shell`

## Motion Scale
- Fast: `--motion-fast` (hover/feedback)
- Normal: `--motion-normal` (standard transitions)
- Slow: `--motion-slow` (entrance emphasis)

## Usage Rules
- Prefer token-based Tailwind classes over direct hex values.
- Avoid arbitrary radius and custom shadow declarations unless intentionally exceptional.
- Keep hero/special treatments limited to one layer per screen to preserve hierarchy.
