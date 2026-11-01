# @randsum/ui

The RANDSUM roller as Web Components (custom elements) built with Lit, over
`@randsum/roller`, with thin React and Vue wrappers and React Native
components. The site's app, landing
page and modifier docs all render them through the React wrappers.

## Layout

- Every file directly in `src/`, `src/native/`, `src/react/` and `src/vue/` is
  a public entry with its own subpath, one per element, component, wrapper or
  helper (lodash style).
  There is no root barrel, so a page that imports `@randsum/ui/roller` never
  bundles the Vue wrappers, and one that imports `@randsum/ui/key-pad` gets
  only the key pad. `__tests__/entries.test.ts` holds `package.json`
  `exports`, the bunup `entry` list and the `size-limit` block to exactly that
  set: add a file and it must appear in all three.
- `src/roller-state.ts`: `RollerState`, the framework-free state (notation,
  check, tokens, last result, `edit`/`set`/`roll`/`press`/`choose`,
  `subscribe`). Every element and wrapper renders from one. `set` is a host
  setting the value (no event); `edit` is a user edit (fires `change`).
- `src/roller.ts`: `<randsum-roller>`, one element with `size` (`mini`,
  `compact`, `max`). It owns a `RollerState`, fires `randsum-change` and
  `randsum-roll` (composed, bubbling), and has a `roll()` method. Its
  `notation` accessor sets the state at once, so `roll()` straight after
  rolls the new value.
- Parts (`notation-field`, `roll-button`, `status-line`, `key-pad`,
  `preset-list`, `readout`, `roll-steps`): each element extends
  `PartElement` (`src/internal/element.ts`) and renders from its `roller`
  property, or else from the nearest `<randsum-scope>` (`src/scope.ts`, light
  DOM, no rendering).
- `src/internal/parts/`: one Lit template function per part. The roller
  composes them inside its own shadow root and each part element renders one,
  so there is one shadow root per element and ids (`aria-describedby`) work.
- `src/react/`: `Roller`, `useRoller` and each part. `src/internal/react.ts`
  sets properties in a layout effect and adds event listeners, so React 18
  (attributes only) and 19 behave the same. The `notation` prop is set only
  when it changes, so an unrelated render does not undo typing.
- `src/vue/`: the same set; properties go through Vue's `.prop` prefix
  (`src/internal/vue.ts`). `Roller` supports `v-model`.
- `src/native/`: React Native components, not wrappers: `Roller` (the same
  three sizes) and each part, built from `View`, `Text`, `TextInput` and
  `Pressable` on a `RollerState`. `react-native` is an optional peer and never
  reaches the web entries. Styles are a `StyleSheet` per theme
  (`src/internal/native/styles.ts`); `native/theme` holds the light and dark
  tokens (the `--rsui-*` set as an object) and `RollerThemeProvider`. Each part
  calls `useWatch`, so it re-renders on its own state's changes. The copy and
  the visible roll steps are shared with the elements through
  `src/internal/copy.ts` and `src/internal/steps.ts`. Max history lives in
  memory: `initialHistory` in, `onHistoryChange` out, for the app to persist.
  `__tests__/native.test.tsx` swaps `react-native` for DOM stand-ins.
- `src/svelte.ts`: types only. Svelte 5 sets properties and listens for
  events itself, and htmx, Astro and plain HTML need nothing.
- `src/ssr.ts`: `renderToString(markup)` renders any markup with
  `<randsum-*>` tags through `@lit-labs/ssr` (an optional peer) into
  Declarative Shadow DOM. On upgrade, `freshShadowRoot`
  (`src/internal/element.ts`) empties the server copy before Lit's first
  render, so there is no hydration step and nothing is doubled. It is the one
  entry without a size limit (server only). The site renders every roller
  with it through `apps/site/src/components/rollers/ServerRoller.astro`,
  alone or as the `fallback` of a React island.
- `src/keys.ts`, `src/presets.ts`, `src/check.ts`: data and logic with no
  framework. `presets` builds from the roller's `NOTATION_DOCS` examples, so
  docs and component never drift.

## Styles

- `src/tokens.css` is the only file that spells a raw colour, size or radius
  (it is excluded from the design plugins in `biome.json`). It declares, on
  `:host`, each private `--_*` name as `var(--rsui-*, default)`. Custom
  properties inherit through Shadow DOM, so a host sets any public `--rsui-*`
  token on the element or any ancestor; the site maps them onto its `--rs-*`
  theme in `apps/site/src/components/rollers/rollers.css`.
- `src/styles.css` uses only the private `--_*` names. `src/internal/styles.ts`
  imports both as text and every element adopts the one sheet. There is no
  stylesheet export.

## Rules

- Every size shows dice keys. Presets are an optional property and appear
  behind a keys / presets switch, keys first.
- Compact and Max lay out with container queries, not viewport media queries.
- A notation is valid only when `validateNotation` passes and a trial roll
  succeeds (`check.ts`), so a combination the roller rejects at roll time shows
  as invalid before the user presses Roll.
- Reactive properties are `declare`d with defaults set in the constructor
  (class fields would shadow Lit's accessors).

## Commands

```bash
bun run --filter @randsum/ui test        # happy-dom, preloaded by bunfig.toml
bun run --filter @randsum/ui build       # clean, bunup, then scripts/tag-types.ts
bun run --filter @randsum/ui size
```

The build cleans `dist/` itself (bunup's own clean is not awaited and can
delete fresh chunks), and `scripts/tag-types.ts` appends each element's
`HTMLElementTagNameMap` entry to its `.d.ts`, because bunup drops
`declare global` blocks.

The build needs roller's `dist/` (its subpath types resolve from there), so run
`bun run build` at the root first in a fresh checkout.
