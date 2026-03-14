# @randsum/component-library

React component library for [RANDSUM](https://github.com/RANDSUM/randsum) dice rolling tools.

## Installation

```bash
npm install @randsum/component-library
# or
bun add @randsum/component-library
```

CSS is bundled and injected automatically — no separate stylesheet import needed.

> **CSP note:** Styles are injected via JavaScript at runtime using `<style>` tags. Consumers must allow `style-src 'unsafe-inline'` in their Content Security Policy. There is no separate CSS file to import. This is a known limitation and will be addressed in a future major version.

## Peer Dependencies

Requires React 18 or later.

## Components

### `RollerPlayground`

An interactive dice rolling playground with a code-styled input, real-time notation validation, token highlighting, modifier reference, and roll results.

```tsx
import { RollerPlayground } from '@randsum/component-library'

// Uncontrolled with a default notation
<RollerPlayground defaultNotation="4d6L" />

// Controlled
<RollerPlayground notation={myNotation} />
```

**Props**

| Prop              | Type                | Default  | Description                          |
| ----------------- | ------------------- | -------- | ------------------------------------ |
| `defaultNotation` | `string`            | `'4d6L'` | Initial notation (uncontrolled)      |
| `notation`        | `string`            | —        | Controlled notation value            |
| `size`            | `'s' \| 'm' \| 'l'` | `'l'`    | Component size                       |
| `expanded`        | `boolean`           | `false`  | Pin the modifier reference open      |
| `stackblitz`      | `boolean`           | `true`   | Show the "Open in StackBlitz" button |
| `className`       | `string`            | —        | Additional CSS class                 |

---

### `ModifierReference`

A two-column reference grid of all RANDSUM modifier notation. Can be used standalone or as an interactive picker.

```tsx
import { ModifierReference } from "@randsum/component-library"
;<ModifierReference onCellClick={cell => console.log(cell.notation, cell.description)} />
```

**Props**

| Prop                | Type                                    | Default | Description                   |
| ------------------- | --------------------------------------- | ------- | ----------------------------- |
| `coreDisabled`      | `boolean`                               | `false` | Disable the core `xDN` cell   |
| `modifiersDisabled` | `boolean`                               | `false` | Disable all modifier cells    |
| `onCellClick`       | `(cell: ModifierReferenceCell) => void` | —       | Called when a cell is clicked |

**`ModifierReferenceCell`**

```ts
interface ModifierReferenceCell {
  notation: string
  description: string
  isCore: boolean
}
```

---

### `Overlay`

A dismissible overlay panel with keyboard (`Escape`) support. Used internally by `RollerPlayground` but exported for custom use.

```tsx
import { Overlay } from "@randsum/component-library"
;<Overlay visible={open} dismissing={dismissing} onDismiss={() => setOpen(false)}>
  <p>Overlay content</p>
</Overlay>
```

**Props**

| Prop          | Type         | Default | Description                        |
| ------------- | ------------ | ------- | ---------------------------------- |
| `visible`     | `boolean`    | —       | Whether the overlay is shown       |
| `dismissing`  | `boolean`    | —       | True during the exit animation     |
| `dismissible` | `boolean`    | `true`  | Allow clicking backdrop to dismiss |
| `onDismiss`   | `() => void` | —       | Called on backdrop click or Escape |
| `children`    | `ReactNode`  | —       | Overlay content                    |

## License

MIT

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
