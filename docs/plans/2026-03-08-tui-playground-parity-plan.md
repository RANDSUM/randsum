# TUI / Web Playground Feature Parity Plan

> Date: 2026-03-08
> Goal: Bring the CLI TUI (`apps/cli/src/tui/`) to feature parity with the web `DicePlayground` (`apps/site/src/components/playground/`).

---

## Gap Analysis

| Feature | Playground (web) | TUI (CLI) | Gap |
|---|---|---|---|
| History shape | `{ id, notation, total, rolls[][], description, timestamp }` | `{ notation, result: RollerRollResult }` | TUI stores raw result; no id, timestamp, or formatted fields |
| History display | Total + dice pools `[...]` + description per entry | Single `formatCompact()` line | TUI lacks structured breakdown |
| Clear history | `clearHistory()` + Clear button | Missing | No way to reset |
| formatResult helper | `helpers/formatResult.ts` extracts total/rolls/description | Uses `formatCompact()` from `shared/format.ts` | No structured formatter |
| Mode toggle | Notation / Game toggle buttons | Notation only | No game mode |
| GameModePanel | Full panel: game selector, dynamic fields, roll button, result | Missing entirely | Largest gap |
| gameConfigs | 6 games with typed field definitions | Missing | No game config data |
| NotationInput error | Validation-only (no external error prop) | Has external `error` prop from App + validation | Extra error path |
| Keyboard nav | Click-based (web) | Tab toggles input/toolbar | Need full keyboard nav for game mode |

### Dependency Note

The CLI publishes as a standalone binary and uses versioned npm dependencies (not `workspace:~`). Game packages (`@randsum/fifth`, `@randsum/blades`, etc.) must be added as versioned npm dependencies in `apps/cli/package.json`.

### Ink Audit Findings

**No new Ink packages needed.** All game mode field widgets are implementable with existing `ink` + `ink-text-input` dependencies:

- **Number field**: `useInput` + arrow keys to increment/decrement, clamp at `min`/`max`, render with `<Box>` + `<Text>`
- **Select field**: `useInput` + arrow keys to cycle options, wrap index — **DiceToolbar is the exact pattern to reuse** (its `selectedIndex` + left/right arrow cycling + `DICE` array is directly analogous to cycling select options)
- **Boolean field**: `useInput` + space/enter to toggle, `[ON]`/`[OFF]` display with `<Text>`
- **Game selector**: Same cycle pattern as DiceToolbar / SelectField

**Clear history shortcut**: Ctrl+L detectable via `useInput` — check `key.ctrl && input === 'l'`.

---

## Implementation Steps

### Step 1: Unify HistoryEntry shape

**Files to modify:**
- `apps/cli/src/tui/hooks/useRollHistory.ts`

**Changes:**
1. Replace the `HistoryEntry` interface:
   ```typescript
   // OLD
   interface HistoryEntry {
     readonly notation: string
     readonly result: RollerRollResult
   }

   // NEW
   export interface HistoryEntry {
     readonly id: number
     readonly notation: string
     readonly total: number
     readonly rolls: readonly (readonly number[])[]
     readonly description: string
     readonly timestamp: number
   }
   ```
2. Update `addRoll` signature to accept `Omit<HistoryEntry, 'id' | 'timestamp'>` (matching playground).
3. Add `nextId` counter state (auto-incrementing integer).
4. Prepend new entries (newest first, matching playground behavior — current TUI appends).
5. Export `HistoryEntry` type for use in components.

**Ink considerations:** None — pure state logic.

---

### Step 2: Port formatResult helper to TUI

**Files to create:**
- `apps/cli/src/tui/helpers/formatResult.ts`

**Changes:**
1. Copy `formatResult.ts` from `apps/site/src/components/playground/helpers/formatResult.ts` verbatim — it has no web dependencies, only imports from `@randsum/roller`.
2. Export: `formatResult`, `isFormattedError`, `FormattedResult`, `FormattedError`, `FormatResultOutput`.

**Ink considerations:** None — pure logic.

---

### Step 3: Add clearHistory to TUI useRollHistory

**Files to modify:**
- `apps/cli/src/tui/hooks/useRollHistory.ts`

**Changes:**
1. Add `clearHistory` callback that resets history to `[]`.
2. Add to return type: `readonly clearHistory: () => void`.

This pairs with Step 1 since we're already modifying this hook.

**Ink considerations:** None — pure state logic.

---

### Step 4: Update TUI RollHistory display

**Files to modify:**
- `apps/cli/src/tui/components/RollHistory.tsx`

**Changes:**
1. Import `HistoryEntry` from the hook instead of defining locally.
2. Remove `formatCompact` import — no longer needed.
3. Add `onClear` prop to `RollHistoryProps`.
4. Update the entry rendering to show structured data:
   ```
   > 4d6L                          Total: 12
     [6, 4, 3, 2]  → kept [6, 4, 3]
     Drop lowest
   ```
   Layout per entry:
   - Line 1: notation (cyan) + total (bold white), right-aligned
   - Line 2: dice pools rendered as `[n, n, n]` (dimColor)
   - Line 3: description (gray)
5. Add a "Clear" indicator at the bottom when history is non-empty:
   ```
   <Text dimColor>[Ctrl+L to clear]</Text>
   ```
6. Limit visible entries to prevent terminal overflow — show last ~10 entries, with a `({N} more)` indicator if truncated.

**Ink considerations:**
- Use `<Box justifyContent="space-between">` for notation/total alignment.
- Respect terminal width — truncate long descriptions with ellipsis.
- Scroll behavior: Ink doesn't natively scroll; cap visible entries.

---

### Step 5: Create TUI gameConfigs

**Files to create:**
- `apps/cli/src/tui/gameConfigs.ts`

**Changes:**
1. Copy `gameConfigs.ts` from the playground.
2. Replace CSS variable colors with Ink-compatible color strings:
   ```typescript
   // Playground: color: 'var(--game-fifth)'
   // TUI:        color: 'yellow'
   ```
   Color mapping:
   - `fifth` → `'red'`
   - `blades` → `'magenta'`
   - `daggerheart` → `'blue'`
   - `pbta` → `'green'`
   - `root-rpg` → `'yellow'`
   - `salvageunion` → `'cyan'`
3. Keep `FieldConfig` and `GameConfig` interfaces identical to playground (re-export-compatible).

**Ink considerations:** Ink supports named colors (red, green, blue, yellow, cyan, magenta, white, gray) and hex codes.

---

### Step 6: Create reusable field components and GameModePanel

**Files to create:**
- `apps/cli/src/tui/components/fields/SelectField.tsx`
- `apps/cli/src/tui/components/fields/NumberField.tsx`
- `apps/cli/src/tui/components/fields/BooleanField.tsx`
- `apps/cli/src/tui/components/GameModePanel.tsx`

**Dependencies to add to `apps/cli/package.json`:**

Game packages are **NOT** currently listed in `apps/cli/package.json`. They must be added as versioned npm dependencies (not `workspace:~`), matching the same pattern as `@randsum/roller`:

```json
"dependencies": {
  "@randsum/roller": "^3.0.0",
  "@randsum/blades": "^3.0.0",
  "@randsum/daggerheart": "^3.0.0",
  "@randsum/fifth": "^3.0.0",
  "@randsum/pbta": "^3.0.0",
  "@randsum/root-rpg": "^3.0.0",
  "@randsum/salvageunion": "^3.0.0",
  "ink": "^5.2.0",
  "ink-text-input": "^6.0.0",
  "react": "catalog:"
}
```

Run `bun install` after adding to ensure resolution.

#### Reusable Field Components

All three field components follow the **DiceToolbar pattern**: a focused index cycling through a list with left/right arrows, visual highlight on the active item. They are pure display components — **input handling lives in the parent** (`GameModePanel`) via a single `useInput` call to avoid listener conflicts.

##### SelectField.tsx

Modeled directly on DiceToolbar's `selectedIndex` + left/right cycling + `DICE` array pattern:

```typescript
interface SelectFieldProps {
  readonly label: string
  readonly options: readonly string[]
  readonly value: string
  readonly focused: boolean
}
```

**Display:** `Label: ◄ {currentOption} ►` — arrows shown only when `focused`.
- Focused: label + value in cyan, bold
- Unfocused: label in gray, value in white

##### NumberField.tsx

```typescript
interface NumberFieldProps {
  readonly label: string
  readonly value: number
  readonly min?: number
  readonly max?: number
  readonly focused: boolean
}
```

**Display:** `Label: ◄ {value} ►` — arrows shown only when `focused`.
- Clamp display shows min/max range as dim hint when focused: `(-30..30)`
- Focused: cyan + bold. Unfocused: gray/white.

##### BooleanField.tsx

```typescript
interface BooleanFieldProps {
  readonly label: string
  readonly value: boolean
  readonly focused: boolean
}
```

**Display:** `[ON] Label` or `[OFF] Label`
- `[ON]` rendered in green, `[OFF]` in gray
- Focused: label in cyan + bold. Unfocused: gray.
- Toggle via Space or Enter (handled in parent)

#### GameModePanel.tsx

**Structure:**
```
┌─ Game System ─────────────────────┐
│ ◄ D&D 5e ►                       │  ← Left/Right to cycle games
├───────────────────────────────────┤
│ Modifier:    ◄ 0 ►               │  ← NumberField
│ Rolling With: ◄ Normal ►         │  ← SelectField
│                                   │
│ [ Roll D&D 5e ]                   │  ← Enter to roll
├───────────────────────────────────┤
│ Result: D&D 5e: 15               │  ← last result
└───────────────────────────────────┘
```

**Props:**
```typescript
interface GameModePanelProps {
  readonly active: boolean
  readonly onGameRoll: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
}
```

**State:**
- `selectedGameIndex: number` — index into `GAME_CONFIGS`. **Initialize with safe access**: use `GAME_CONFIGS[0]?.id ?? 'fifth'` (required by `noUncheckedIndexedAccess`).
- `fieldValues: Record<string, string | number | boolean>` — current field values
- `focusIndex: number` — which element is focused (0 = game selector, 1..N = fields, N+1 = roll button)
- `lastResult: string | null`
- `isRolling: boolean`
- `error: string | null`

**Keyboard behavior (single `useInput` in GameModePanel, `{ isActive: active }`):**
- **Up/Down arrows**: Move `focusIndex` between game selector → fields → roll button
- **Left/Right arrows**: Context-dependent based on `focusIndex`:
  - Game selector (index 0): cycle through `GAME_CONFIGS`, reset `fieldValues` to new game defaults
  - Number field: decrement/increment value (clamped to `min`/`max`)
  - Select field: cycle through `options` (wrap around, same as DiceToolbar)
- **Space**: Toggle boolean fields (when focused on a boolean field)
- **Enter**: Execute the roll **only when the Roll button has focus** (`focusIndex === fields.length + 1`). This avoids conflicts with field editing and follows the playground's pattern where the Roll button is a distinct interactive element.

**Roll execution:**
- Port `executeGameRoll()` from the playground's `GameModePanel.tsx`. **Use static imports only** — no `import()` or dynamic imports. All 6 game packages are imported at the top of the file:
  ```typescript
  import { roll as rollFifth } from '@randsum/fifth'
  import { roll as rollBlades } from '@randsum/blades'
  import { roll as rollDaggerheart } from '@randsum/daggerheart'
  import { roll as rollPbta } from '@randsum/pbta'
  import { roll as rollRootRpg } from '@randsum/root-rpg'
  import { roll as rollSalvageunion } from '@randsum/salvageunion'
  ```
  Use a switch/case on the game id to dispatch to the correct roll function. Static imports are preferred for CLI binaries — they bundle more reliably and avoid async complexity.
- On success: call `onGameRoll(entry)` to add to shared history, update `lastResult`.
- On error: display error in red `<Text>` below the roll button.

**Ink considerations:**
- Single `useInput` in `GameModePanel` dispatches to the focused element — no `useInput` in field components.
- Each focusable element receives a `focused` boolean prop for visual styling.
- Game selector uses the DiceToolbar cycle pattern: index wraps with modular arithmetic.
- Focused element: cyan border/text + bold. Unfocused: gray/dimColor.
- Reset `focusIndex` to 1 (first field) when game changes, since field count may differ.

---

### Step 7: Update App.tsx — mode toggle and wiring

**Files to modify:**
- `apps/cli/src/tui/App.tsx`

**Changes:**

1. Add `Mode` type and state:
   ```typescript
   type Mode = 'notation' | 'game'
   const [mode, setMode] = useState<Mode>('notation')
   ```

2. Expand `FocusZone` — add `'game'` as the third state (not `'mode-toggle'` or `'game-panel'` — keep zone names simple):
   ```typescript
   // OLD
   type FocusZone = 'input' | 'toolbar'

   // NEW
   type FocusZone = 'input' | 'toolbar' | 'game'
   ```

3. Add mode toggle bar at top (below RANDSUM header):
   ```
   [ Notation ]  [ Game ]     ← keybinding to switch (e.g., 'm' key)
   ```
   Render as two `<Text>` elements; the active mode gets bold + cyan, inactive gets dimColor. Mode toggle is not a focus zone — switching is done via a keybinding.

4. Wire `clearHistory`:
   ```typescript
   const { history, addRoll, clearHistory } = useRollHistory()
   ```
   Add `useInput` handler for Ctrl+L → `clearHistory()`.

5. Conditional rendering based on `mode`:
   - **Notation mode**: Current layout (DiceToolbar + NotationInput + RollHistory + NotationReference). Pass `onClear={clearHistory}` to `RollHistory`.
   - **Game mode**: `GameModePanel` (active when `focus === 'game'`) + `RollHistory` (no DiceToolbar, no NotationReference, no NotationInput).

6. Update `addRoll` call in `handleSubmit` to use new signature. **`roll()` never throws** (errors are returned in the result), so replace the `try/catch` with a `result.error` check:
   ```typescript
   const result = roll(trimmed as RollArgument)
   if (result.error) {
     setError(result.error.message)
     return
   }
   const formatted = formatResult(result)
   if (!isFormattedError(formatted)) {
     addRoll({
       notation: trimmed,
       total: formatted.total,
       rolls: formatted.rolls,
       description: formatted.description
     })
   }
   ```
   Remove the `try/catch` block — `roll()` uses never-throw error handling per the codebase convention.

7. Remove `error` state from App — no longer needed after Step 8.

8. Update `handleSubmit` to validate before rolling (matching playground pattern):
   ```typescript
   const validation = validateNotation(trimmed)
   if (!validation.valid) return
   const result = roll(...validation.notation)
   ```

**Layout for wide mode:**
```
┌──────────── RANDSUM ────────────┐
│    [ Notation ]  [ Game ]       │  ← mode toggle
├──────────────────┬──────────────┤
│  [mode content]  │  [reference] │  ← left: mode panel, right: reference (notation mode only)
├──────────────────┴──────────────┤
│  > [notation input]             │  ← only in notation mode
└─────────────────────────────────┘
```

**Layout for narrow mode:** Stack vertically, same conditional logic.

**Ink considerations:**
- Tab cycles through focus zones per mode: notation mode cycles `input → toolbar → input`; game mode has a single `game` zone (Tab wraps within GameModePanel's internal `focusIndex`).
- When switching modes, reset focus to `'input'` (notation mode) or `'game'` (game mode).

---

### Step 8: Simplify NotationInput — remove external error prop

**Files to modify:**
- `apps/cli/src/tui/components/NotationInput.tsx`

**Changes:**
1. Remove `error` from `NotationInputProps`.
2. Use only `validationError` from `useValidation` for display.
3. Border color logic: red if validation error, green if active + valid, gray if inactive.
4. The `onSubmit` handler in App now validates before rolling, so invalid input never produces a roll error.

Updated interface:
```typescript
interface NotationInputProps {
  readonly value: string
  readonly active: boolean
  readonly onChange: (value: string) => void
  readonly onSubmit: (value: string) => void
}
```

**Ink considerations:** None — straightforward prop removal.

---

### Step 9: Keyboard navigation specification

**Design principle: predictable, consistent interfaces.** Every interactive element uses the same key conventions:
- **Left/Right arrows**: Always cycle/adjust the focused element's value (games, options, numbers)
- **Up/Down arrows**: Always move between elements vertically
- **Enter**: Executes the primary action when the action element has focus (Roll button, notation submit)
- **Space**: Always toggles (booleans)
- **Tab**: Always moves between focus zones

This consistency means users learn one pattern and it works everywhere.

#### Focus zones by mode

**Notation mode focus cycle (Tab):**
```
input → toolbar → (wrap to input)
```

**Game mode focus cycle (Tab):**
```
game (single zone — Tab wraps within game panel's internal focusIndex)
```

Note: Mode switching is handled via a dedicated keybinding (e.g., `m` key or a toolbar action), not a separate focus zone. In game mode, the notation `input` zone is not rendered, so `game` is the only focus zone.

#### Notation mode — input zone
- **Type**: Characters go into notation input
- **Enter**: Submit roll
- **Tab**: Move to toolbar zone

#### Notation mode — toolbar zone
- **Left/Right arrows**: Navigate between d4..d100 buttons
- **Enter**: Select die (appends to notation input, focus returns to input)
- **Tab**: Wrap back to input zone

#### Game mode — game zone (`focus === 'game'`)
Internal focus is tracked by `focusIndex` within GameModePanel:
- **Up/Down arrows**: Move between game selector → fields → roll button
- **Left/Right arrows**: Context-dependent:
  - Game selector: cycle through games
  - Number field: decrement/increment value
  - Select field: cycle through options
- **Space**: Toggle boolean fields
- **Enter**: Execute roll only when Roll button is focused. On other elements, Enter is a no-op (left/right adjusts values, space toggles booleans). This follows the playground's pattern where the Roll button is a distinct interactive element.
- **Tab**: Wrap back to game selector (game mode is a single focus zone)

#### Global shortcuts
- **Ctrl+L**: Clear roll history (works in any focus zone). Implementation: `useInput` in `App.tsx` checks `key.ctrl && input === 'l'` and calls `clearHistory()`.
- **Ctrl+C / q**: Exit TUI (existing behavior)
- **Tab**: Cycle focus zones

#### Visual focus indicators
- Active focus zone: cyan border
- Active element within zone: cyan text + bold
- Inactive elements: gray/dimColor

---

## Execution Order

Steps should be implemented in order 1-8, as each builds on the previous:

1. **Step 1 + 2 + 3** (can be done together): Hook + helper refactor — no visible changes yet
2. **Step 4**: RollHistory visual update — verifiable immediately with notation rolls
3. **Step 5 + 6** (together): Game configs + reusable field components (`SelectField`, `NumberField`, `BooleanField`) + `GameModePanel`
4. **Step 7**: App.tsx wiring — everything comes together
5. **Step 8**: NotationInput cleanup — final polish
6. **Step 9**: Keyboard nav — verify and tune the full flow

Steps 1-3 form a single PR-able unit. Steps 4-8 form the main feature PR. Step 9 is a verification/tuning pass.

---

## Testing Strategy

- **Unit tests**: `formatResult` helper (port existing playground tests if any, or write new ones)
- **Hook tests**: `useRollHistory` — verify `addRoll` with new shape, `clearHistory`, id auto-increment, newest-first ordering
- **Manual TUI testing**: `bun run --filter @randsum/cli dev -- -i`
  - Notation mode: type notation, roll, verify history display
  - Game mode: cycle games, adjust fields, roll, verify history
  - Mode switching: Tab between modes, verify state persistence
  - Clear history: Ctrl+L clears, verify empty state message
  - All 6 games: verify each game rolls without errors
  - TypeScript strict checks: `bun run --filter @randsum/cli typecheck` — verify no `noUncheckedIndexedAccess` errors on `GAME_CONFIGS` array access

## Resolved Decisions

1. **History sharing**: Notation-mode and game-mode rolls share the same history (matches playground).
2. **Enter-to-roll scope**: Enter executes a roll **only when the Roll button has focus** in the game panel. This avoids conflicts with field editing and matches the playground's explicit Roll button pattern.
3. **No new Ink packages**: All field widgets implemented with existing `ink` + `ink-text-input`. DiceToolbar's cycle pattern is the template for SelectField and game selector.
4. **Never-throw `roll()`**: `roll()` never throws — errors are returned in the result object. Use `result.error` check, not `try/catch`.
5. **`noUncheckedIndexedAccess`**: All indexed array access (e.g., `GAME_CONFIGS[0]`) must use optional chaining with a fallback (e.g., `GAME_CONFIGS[0]?.id ?? 'fifth'`).
6. **History ordering**: Prepend new entries (newest first), not append.
7. **`incrementDiceQuantity`**: Keep TUI's case-insensitive regex version; add sync comment referencing the playground version.
8. **`useValidation` type**: Keep `validationError` as `string` (empty string = no error), not `string | null`. Add sync comment.
9. **Ink color map**: `fifth='red'`, `blades='magenta'`, `daggerheart='blue'`, `pbta='green'`, `root-rpg='yellow'`, `salvageunion='cyan'`.
10. **FocusZone**: Three states: `'input' | 'toolbar' | 'game'`. Tab cycles `input→toolbar→input` (notation mode). Game mode uses only `'game'` zone (Tab wraps within GameModePanel's internal `focusIndex`).
11. **Game package deps**: Game packages are NOT in `apps/cli/package.json` — must be added as versioned npm deps (`^3.0.0`), same pattern as `@randsum/roller`.
12. **Static imports only**: All game packages use static `import` statements (no `import()` / dynamic imports). Static imports bundle more reliably for CLI binaries.

## Sync Notes

### `incrementDiceQuantity`

The TUI's version (`apps/cli/src/tui/helpers/incrementDiceQuantity.ts`) uses a case-insensitive regex flag (`'i'`), which the playground version does not. **Keep the TUI's case-insensitive version** — it handles edge cases like `1D6` that users may type in a terminal. Add a sync comment at the top of the file:

```typescript
// Synced with apps/site/src/components/playground/helpers/incrementDiceQuantity.ts
// TUI version adds case-insensitive flag ('i') for terminal input flexibility
```

### `useValidation`

The TUI's `useValidation` hook returns `validationError` as type `string` (empty string when valid). **Keep this as `string`, not `string | null`** — it matches the existing pattern and simplifies conditional checks (`if (validationError)` vs `if (validationError !== null)`). Add a sync comment:

```typescript
// Synced with playground validation pattern
// Uses empty string (not null) for "no error" state
```

## Open Questions

None — all questions resolved (see Resolved Decisions).
