# @randsum/ui

The RANDSUM dice roller as React components, in three sizes.

```bash
npm install @randsum/ui @randsum/roller react react-dom
```

Every component, hook and helper is its own module, the way lodash ships one
module per function. There is no root entry: import exactly what you use, and
that is all your bundle gets.

```tsx
// A whole roller, in one of three sizes
import { RollerMax } from '@randsum/ui/roller-max'
import { RollerCompact } from '@randsum/ui/roller-compact'
import { RollerMini } from '@randsum/ui/roller-mini'

// Or build your own from the parts
import { useRoller } from '@randsum/ui/use-roller'
import { NotationField } from '@randsum/ui/notation-field'
import { RollButton } from '@randsum/ui/roll-button'
import { StatusLine } from '@randsum/ui/status-line'
import { KeyPad } from '@randsum/ui/key-pad'
import { PresetList } from '@randsum/ui/preset-list'
import { Readout } from '@randsum/ui/readout'
import { RollSteps } from '@randsum/ui/roll-steps'

// Data and logic, no React
import { DEFAULT_KEYS, modifierKeys } from '@randsum/ui/keys'
import { modifierPresets } from '@randsum/ui/presets'
import { checkNotation, rollNotation } from '@randsum/ui/check'

import '@randsum/ui/styles.css'
```

## Every entry

| Import                         | What it is                                                     |
| ------------------------------ | -------------------------------------------------------------- |
| `@randsum/ui/roller-max`       | `RollerMax`: the full roller, with keys, readout and history   |
| `@randsum/ui/roller-compact`   | `RollerCompact`: a landscape or portrait panel                 |
| `@randsum/ui/roller-mini`      | `RollerMini`: one row; hover Roll for the English description  |
| `@randsum/ui/use-roller`       | `useRoller`: the state every part reads (notation, check, roll) |
| `@randsum/ui/notation-field`   | `NotationField`: the input with coloured notation tokens       |
| `@randsum/ui/roll-button`      | `RollButton`: Roll, disabled until the notation is valid       |
| `@randsum/ui/status-line`      | `StatusLine`: the hint, the error, or the roll in English      |
| `@randsum/ui/key-pad`          | `KeyPad`: dice and modifier keys                               |
| `@randsum/ui/preset-list`      | `PresetList`: named rolls, as chips or a list                  |
| `@randsum/ui/readout`          | `Readout`: the total and every step                            |
| `@randsum/ui/roll-steps`       | `RollSteps`: just the steps of a roll                          |
| `@randsum/ui/keys`             | `DEFAULT_KEYS`, `modifierKeys(name)`, `applyKey`               |
| `@randsum/ui/presets`          | `modifierPresets(name)`, from the roller's own docs            |
| `@randsum/ui/check`            | `checkNotation`, `rollNotation`                                |
| `@randsum/ui/styles.css`       | Every style, as `--rsui-*` tokens you can override            |

```tsx
function MyRoller() {
  const roller = useRoller({ defaultNotation: '2d6+1' })
  return (
    <div className="rsui">
      <NotationField roller={roller} />
      <RollButton roller={roller} />
      <Readout roller={roller} />
    </div>
  )
}
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
