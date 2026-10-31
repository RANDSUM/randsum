# @randsum/ui

The RANDSUM dice roller as React components, in three sizes.

```bash
npm install @randsum/ui @randsum/roller react react-dom
```

Every import is narrow. There is no root entry.

```tsx
import { RollerMax } from '@randsum/ui/roller-max'
import { RollerCompact } from '@randsum/ui/roller-compact'
import { RollerMini } from '@randsum/ui/roller-mini'
import { DEFAULT_KEYS, modifierKeys } from '@randsum/ui/keys'
import { modifierPresets } from '@randsum/ui/presets'
import '@randsum/ui/styles.css'
```

## Sizes

- **`RollerMax`**: the full roller, with keys, a readout and recent rolls.
  Pass `storageKey` to keep history in `localStorage`.
- **`RollerCompact`**: a panel for a page. `orientation` is `'auto'` (by
  container width), `'landscape'` or `'portrait'`.
- **`RollerMini`**: one row. The keys button opens a key pad, and hovering or
  focusing Roll shows the roll in English.

```tsx
<RollerCompact
  defaultNotation="3d6!"
  keys={modifierKeys('explode')}
  presets={modifierPresets('explode')}
/>
```

## Shared props

| Prop              | Type                         | Notes                                                    |
| ----------------- | ---------------------------- | -------------------------------------------------------- |
| `defaultNotation` | `string`                     | Starting notation (uncontrolled)                         |
| `notation`        | `string`                     | Controlled notation, with `onChange`                     |
| `keys`            | `readonly Key[]`             | Defaults to `DEFAULT_KEYS`; always shown                 |
| `presets`         | `readonly Preset[]`          | Optional; adds a presets switch, keys stay first         |
| `onRoll`          | `(result: RollResult) => void` | Called after each roll                                 |
| `rollSignal`      | `number`                     | Each new value rolls the current notation                |

## Styling

`styles.css` declares its tokens as `--rsui-*` custom properties under
`:where(.rsui)`, so you can override any of them from your own CSS:

```css
.rsui {
  --rsui-accent: #0f766e;
}
```

Colours use `light-dark()`, so set `color-scheme` on the page to pick the arm.

## License

MIT
