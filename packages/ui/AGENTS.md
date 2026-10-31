# @randsum/ui

React components for the RANDSUM roller, in three sizes, over `@randsum/roller`.
The site's app, landing page and modifier docs all render them.

## Layout

- `src/roller-max.tsx`, `src/roller-compact.tsx`, `src/roller-mini.tsx`: one
  component per entry. There is no root barrel, so a page that imports Mini
  never bundles Max.
- `src/keys.ts`: `DEFAULT_KEYS`, `modifierKeys(name)` and `applyKey`. Key edits
  live in `src/edits.ts`.
- `src/presets.ts`: `modifierPresets(name)`, built from the roller's
  `NOTATION_DOCS` examples, so docs and component never drift.
- `src/modifiers.ts`: `MODIFIER_TABLE`, each modifier's doc keys and canonical keys.
- `src/core/`: the shared hook (`useRoller`), notation checks (`check.ts`) and
  the parts every size composes (`parts.tsx`).
- `src/tokens.css` is the only file that spells a raw colour, size or radius
  (it is excluded from the design plugins in `biome.json`). `src/styles.css`
  uses only `--rsui-*`. `scripts/build-css.ts` joins the two into
  `dist/styles.css`.

## Rules

- Every size shows dice keys. Presets are an optional prop and appear behind a
  keys / presets switch, keys first.
- Tokens are declared under `:where(.rsui)`, so a host overrides any
  `--rsui-*` variable without fighting specificity. The site maps them onto its
  `--rs-*` theme in `apps/site/src/components/rollers/rollers.css`.
- Compact and Max lay out with container queries, not viewport media queries.
- A notation is valid only when `validateNotation` passes and a trial roll
  succeeds (`check.ts`), so a combination the roller rejects at roll time shows
  as invalid before the user presses Roll.

## Commands

```bash
bun run --filter @randsum/ui test        # happy-dom, preloaded by bunfig.toml
bun run --filter @randsum/ui build       # bunup + scripts/build-css.ts
bun run --filter @randsum/ui size
```

The build needs roller's `dist/` (its subpath types resolve from there), so run
`bun run build` at the root first in a fresh checkout.
