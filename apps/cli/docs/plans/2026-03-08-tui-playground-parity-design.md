# TUI Playground Parity Design — 2026-03-08

## Goal

Achieve 1:1 visual and functional parity between `@randsum/cli` TUI and the `RollerPlayground` web component. Roll history is removed. The modifier reference becomes the central panel, replaced by the result breakdown after rolling.

## Layout

```
┌──────────────────────────────────────── (cyan border)
│  roll('4d6L')
│  Roll 4 6-sided dice, drop lowest
│
│  ── Main Panel (toggles) ─────────────
│  [Modifier Reference -or- Roll Result]
│
│  > 4d6L
└────────────────────────────────────────
```

## Components

### App.tsx — State Refactor

Remove:
- `RollHistory` component and all history state
- Two-column (history | reference) layout
- `FocusZone` state (simplify to `'input' | 'reference'`)

Add:
- `viewMode: 'reference' | 'result'` — controls main panel
- `lastRecords: readonly RollRecord[] | null` — result of last roll
- On roll: set `viewMode = 'result'`, store records
- On `onChange` (typing): set `viewMode = 'reference'`

### Header

Show live tokenized notation in the `roll('...')` call:

```tsx
<Text bold>roll</Text>
<Text dimColor>('</Text>
{tokens.map((token, i) => (
  <Text key={i} color={TOKEN_COLORS[token.type]} inverse={i === activeTokenIdx}>
    {token.text}
  </Text>
))}
<Text dimColor>')</Text>
```

When notation is empty: `roll()` with gray parens.

### Cursor Tracking — `useCursorPosition` hook

New hook that intercepts left/right arrow keys while input is focused to track cursor position. Maps cursor pos → active token index via `tokens.findIndex(t => cursorPos >= t.start && cursorPos < t.end)`. Resets on value change.

### NotationDescriptionRow — bidirectional highlight

- Receives `activeTokenIdx: number | null`
- Highlights the matching description chip (bold or inverse color when active)
- Token color mapping already exists — just add the active state visual

### NotationReference — full-width with row separators

- Full-width (not partial right column)
- Each row separated by a `─` divider line matching Playground's row borders
- Remove `│` center separator from within rows (use spacing/justify instead)
- Keep keyboard navigation (arrows, Enter for details, `a` to add)

### Main Panel toggle

When `viewMode === 'reference'`: render `NotationReference` full-width
When `viewMode === 'result'`: render `RollResultPanel` (restyled)
  - Hint at bottom: `any key to see reference`
  - Pressing any input character or Tab returns to reference mode

### RollResultPanel — restyled

Match Playground result overlay style:
- Each step row uses the same label-left / value-right pattern as Playground's `.roller-result-row`
- Removed/added dice use red strikethrough and green respectively (already done)
- Clean spacing, no outer border (border comes from App container)

## Colors (matching Playground)

| Element                | Ink color        |
|------------------------|------------------|
| Container border       | `cyan`           |
| `roll` keyword         | `bold` (white)   |
| Notation string tokens | per token type   |
| Token: core            | `cyan`           |
| Token: drop            | `yellow`         |
| Token: keep            | `green`          |
| Token: explode         | `magenta`        |
| Token: reroll/cap/etc  | `blue`           |
| Modifier notation keys | `bold`           |
| Modifier descriptions  | `dimColor`       |
| Selected modifier row  | `cyan` bold      |
| Active token highlight | `inverse`        |

## State Machine

```
typing in input
    → viewMode: 'reference'
    → activeTokenIdx tracks cursor position

press Enter with valid notation
    → roll()
    → viewMode: 'result'
    → lastRecords updated

typing in input while in 'result' mode
    → viewMode: 'reference'
    → lastRecords cleared

Tab (focus switch)
    → toggles focus between 'input' and 'reference'
    → only available in 'reference' viewMode
```

## Files Changed

| File | Change |
|------|--------|
| `src/tui/App.tsx` | Remove history, add viewMode, restructure layout |
| `src/tui/components/NotationReference.tsx` | Full-width, row separators, remove `│` |
| `src/tui/components/NotationDescriptionRow.tsx` | Add `activeTokenIdx` prop |
| `src/tui/components/RollResultPanel.tsx` | Restyle to match Playground result overlay |
| `src/tui/hooks/useCursorPosition.ts` | New — cursor tracking + token mapping |
| `src/tui/components/RollHistory.tsx` | Delete |
| `src/tui/hooks/useRollHistory.ts` | Delete |

## Out of Scope

- StackBlitz button (web-only)
- Mouse hover (terminal has no mouse by default)
- Animated roll overlay (terminal timing is different)
