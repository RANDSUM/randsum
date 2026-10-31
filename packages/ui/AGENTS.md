# @randsum/ui

React components for the RANDSUM roller, in three sizes, over `@randsum/roller`.
The site's app, landing page and modifier docs all render them.

## Layout

- Every file directly in `src/` is a public entry with its own subpath, one per
  component, hook or helper (lodash style). There is no root barrel, so a page
  that imports `RollerMini` never bundles `RollerMax`, and one that imports
  `KeyPad` gets only the key pad. `__tests__/entries.test.ts` holds
  `package.json` `exports`, the bunup `entry` list and the `size-limit` block to
  exactly that set: add a file to `src/` and it must appear in all three.
- `src/roller-max.tsx`, `src/roller-compact.tsx`, `src/roller-mini.tsx`: the
  three sizes, composed from the parts below.
- Parts: `notation-field`, `roll-button`, `status-line`, `key-pad`,
  `preset-list`, `readout`, `roll-steps`, all driven by `use-roller`.
- `src/keys.ts`, `src/presets.ts`, `src/check.ts`: data and logic with no React.
  `presets` builds from the roller's `NOTATION_DOCS` examples, so docs and
  component never drift.
- `src/internal/`: shared code that is not an entry (`cx`, base props, key
  edits, the modifier table). bunup splits shared code into `dist/shared/` chunks.
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
