# @randsum/ui

The RANDSUM dice roller as Web Components: one element in three sizes, every
part it is built from, and thin wrappers for React and Vue.

```bash
npm install @randsum/ui
```

```html
<script type="module">
  import '@randsum/ui/roller'
</script>

<randsum-roller size="mini" notation="4d6L"></randsum-roller>
```

Custom elements work in any page: plain HTML, htmx and Astro use the tags
directly. Every element, wrapper and helper is its own module, the way lodash
ships one module per function. There is no root entry: import exactly what you
use, and that is all your bundle gets.

## The roller

`<randsum-roller>` takes a `size`:

- **`mini`**: the field and Roll on one row, the keys button and the status
  below. The keys button opens a key pad, hovering or focusing Roll shows the
  roll in English, and a roll opens in a popover.
- **`compact`** (the default): a panel with the field and Roll on top and the
  keys below; a roll lies over the keys. Has a `footer` slot.

In mini and compact nothing moves when you roll: the result stays until you
close it or change the notation.
- **`max`**: the full roller, with keys, a readout, recent rolls and a History
  dialog. Set `storage-key` to keep history in `localStorage`.

It fires `randsum-change` (detail `{ notation }`) on every edit and
`randsum-roll` (detail: the result) after each roll, and has a `roll()`
method. `presets` and `keys` take JSON attributes or properties.

## Build your own

```html
<randsum-scope notation="2d6+1">
  <randsum-notation-field></randsum-notation-field>
  <randsum-roll-button></randsum-roll-button>
  <randsum-readout></randsum-readout>
</randsum-scope>
```

## Frameworks

```tsx
// React 18 or 19
import { Roller } from '@randsum/ui/react/roller'
<Roller size="compact" defaultNotation="2d20H+5" onRoll={r => console.log(r.total)} />
```

```vue
<!-- Vue 3 -->
<script setup>
import { Roller } from '@randsum/ui/vue/roller'
</script>
<template><Roller size="max" v-model="notation" @roll="onRoll" /></template>
```

Svelte 5 uses the tags directly; `import type {} from '@randsum/ui/svelte'`
types them.

## React Native and Expo

React Native has no DOM, so `@randsum/ui/native/roller` is the same roller built
from native views (`View`, `Text`, `TextInput`, `Pressable`) on the same
`RollerState`. Install `react-native` (0.76 or later); Expo works as is.

```tsx
import { Roller } from '@randsum/ui/native/roller'
<Roller size="compact" defaultNotation="2d20H+5" onRoll={r => console.log(r.total)} />
```

It takes the React `Roller`'s props. In place of `storageKey`, max keeps
history in memory and hands each change to `onHistoryChange`, so an app can
save it (AsyncStorage, say) and pass it back as `initialHistory`. The theme
follows the device's light or dark scheme; `RollerThemeProvider`
(`@randsum/ui/native/theme`) changes any token:

```tsx
import { RollerThemeProvider } from '@randsum/ui/native/theme'
<RollerThemeProvider theme={{ accent: '#0f766e' }}>…</RollerThemeProvider>
```

Each part is its own entry too (`native/key-pad`, `native/readout`, …),
sharing state from `useRoller` (`@randsum/ui/native/use-roller`). On iOS and
Android the field colours each token; React Native Web's input cannot, so on
the web use the elements instead.

## Server rendering

`@randsum/ui/ssr` renders the elements on the server with their shadow roots
filled in (Declarative Shadow DOM), so the roller shows before any script
runs. Install `@lit-labs/ssr` alongside it.

```ts
import { renderToString } from '@randsum/ui/ssr'
const html = await renderToString('<randsum-roller size="mini" notation="4d6L"></randsum-roller>')
```

## Every entry

| Import                             | What it is                                                       |
| ---------------------------------- | ---------------------------------------------------------------- |
| `@randsum/ui/roller`               | `<randsum-roller>`: the whole roller, `size` mini, compact or max |
| `@randsum/ui/scope`                | `<randsum-scope>`: one shared state for the parts inside it      |
| `@randsum/ui/notation-field`       | `<randsum-notation-field>`: the input with coloured tokens       |
| `@randsum/ui/roll-button`          | `<randsum-roll-button>`: Roll, disabled until the notation is valid |
| `@randsum/ui/status-line`          | `<randsum-status-line>`: the hint, the error, or the roll in English |
| `@randsum/ui/key-pad`              | `<randsum-key-pad>`: dice and modifier keys                      |
| `@randsum/ui/preset-list`          | `<randsum-preset-list>`: named rolls, as chips or a list         |
| `@randsum/ui/readout`              | `<randsum-readout>`: the total and every step                    |
| `@randsum/ui/roll-steps`           | `<randsum-roll-steps>`: just the steps of a roll                 |
| `@randsum/ui/react/roller` (and `react/<part>`) | `Roller`, `useRoller` and each part, for React     |
| `@randsum/ui/vue/roller` (and `vue/<part>`)     | `Roller`, `useRoller` and each part, for Vue       |
| `@randsum/ui/native/roller` (and `native/<part>`) | `Roller`, `useRoller`, each part and the theme, for React Native |
| `@randsum/ui/svelte`               | Types for every tag in Svelte markup                             |
| `@randsum/ui/ssr`                  | `renderToString`: the elements as HTML, rendered on the server   |
| `@randsum/ui/roller-state`         | `RollerState`: the state with no framework                       |
| `@randsum/ui/keys`                 | `DEFAULT_KEYS`, `modifierKeys(name)`, `applyKey`                 |
| `@randsum/ui/presets`              | `modifierPresets(name)`, from the roller's own docs              |
| `@randsum/ui/check`                | `checkNotation`, `rollNotation`                                  |

## Styling

Styles live in each element's Shadow DOM, so host CSS cannot break them and
there is no stylesheet to import. Every value is a `--rsui-*` custom property,
and custom properties inherit through Shadow DOM, so set them on the element
or any ancestor:

```css
randsum-roller {
  --rsui-accent: #0f766e;
}
```

Colours use `light-dark()`, so set `color-scheme` on the page to pick the arm.

## License

MIT
