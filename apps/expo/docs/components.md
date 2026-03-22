# Component Props & Behavior

All components are React Native components (no `react-dom` dependencies) unless marked `"use dom"`. See ADR-003 for the dice-ui integration strategy and ADR-006 for interaction patterns.

Naming conventions follow the monorepo: PascalCase for components, no default exports that shadow the component name (use named exports), `import type` for prop interfaces.

All interactive elements carry `accessibilityLabel` and `accessibilityHint` props. Minimum touch target is 44x44pt on all platforms, enforced via `minWidth`/`minHeight`. See ADR-006 accessibility section.

---

## `DiceGrid`

**File:** `components/DiceGrid.tsx`

The 3x2 grid of die buttons in Simple Mode. Renders six `DieButton` components in a fixed layout.

```typescript
interface DiceGridProps {
  /**
   * Current pool state, keyed by sides.
   * Passed down from usePoolStore — DiceGrid is a pure display component.
   */
  readonly pool: Readonly<Record<number, number>>
  /** Called when a die button is tapped (increment) */
  readonly onIncrement: (sides: number) => void
  /** Called when a die button is long-pressed (decrement) */
  readonly onDecrement: (sides: number) => void
}
```

**Layout:** 3 columns, 2 rows. Die order: D4, D6, D8 (row 1) / D10, D12, D20 (row 2). Fixed die types — the grid does not accept a custom die list.

**Notes:**
- Does not read from `usePoolStore` directly — the parent screen passes `pool` and handlers. This makes the component testable without store setup.
- Gap between cells: 8pt. Cells are equal-width (flex 1 in each row).

---

## `DieButton`

**File:** `components/DieButton.tsx`

Individual die button. Displays the die type label and an optional count badge.

```typescript
interface DieButtonProps {
  /** Number of sides (4, 6, 8, 10, 12, or 20) */
  readonly sides: number
  /** Current count of this die in the pool (0 = not in pool) */
  readonly count: number
  /** Called on tap */
  readonly onPress: () => void
  /** Called on long-press (400ms threshold) */
  readonly onLongPress: () => void
  /** Whether the button is disabled (e.g., during a roll animation) */
  readonly disabled?: boolean
}
```

**Visual states:**

| State | Background | Label color | Badge |
|---|---|---|---|
| `count === 0` | transparent | `tokens.textDim` | none |
| `count >= 1` | `tokens.surfaceAlt` | `tokens.text` | `tokens.accent` circle, count in JetBrains Mono `size-sm` bold |
| pressed | scaled to 0.93 (spring animation via `useAnimatedStyle`) | — | — |
| `disabled` | `tokens.surface` | `tokens.textDim` | none |

**Accessibility:**
- `accessibilityLabel`: `"D{sides}, {count} in pool"` (e.g. `"D6, 2 in pool"`)
- `accessibilityHint`: `"Tap to add, long press to remove"`
- `accessibilityRole`: `"button"`

**Notes:**
- The die label is `"D{sides}"` rendered in JetBrains Mono, `size-lg`
- Badge minimum diameter: 20pt. When `count > 9`, the badge expands horizontally
- The count badge is positioned at the top-right corner of the button cell with `position: 'absolute'`
- Long-press fires `onLongPress` after 400ms (Expo default). The press scale animation starts immediately on `onPressIn` and reverses on `onPressOut`
- Haptic feedback (`Haptics.impactAsync(ImpactFeedbackStyle.Light)`) fires inside the component on both tap and long-press, not in the parent

---

## `PoolDisplay`

**File:** `components/PoolDisplay.tsx`

Read-only display of the current pool notation above the dice grid.

```typescript
interface PoolDisplayProps {
  /**
   * Notation string to display (e.g. "3d6 + 1d8 + 1d20").
   * When null or empty, renders the empty state message.
   */
  readonly notation: string | null
}
```

**Behavior:**
- Non-empty `notation`: renders the string in JetBrains Mono, `size-lg`, `tokens.text`, centered
- Empty (`null` or `""`): renders `"Select dice to add to your pool"` in `tokens.textMuted`, `size-base`, centered
- Not tappable — does not open Advanced Mode (the Notation button in the action row does that)
- `accessibilityRole`: `"text"`
- `accessibilityLabel`: the notation string, or `"Pool is empty"` when empty

---

## `RollButton`

**File:** `components/RollButton.tsx`

Full-width roll trigger, pinned to the bottom of the Roll tab above the tab bar.

```typescript
interface RollButtonProps {
  /** When false, button renders in disabled state and onPress is suppressed */
  readonly enabled: boolean
  /** Called when the button is pressed */
  readonly onPress: () => void
  /** Optional label override (default: "Roll") */
  readonly label?: string
}
```

**Visual states:**

| State | Background | Label color |
|---|---|---|
| enabled | `tokens.accent` | `tokens.text` |
| disabled | `tokens.surfaceAlt` | `tokens.textDim` |
| pressed | scale 0.97 spring | — |

**Dimensions:** Full width, height 56pt.

**Typography:** Label in system sans-serif, `size-lg`, semibold.

**Accessibility:**
- `accessibilityRole`: `"button"`
- `accessibilityLabel`: the label text (e.g. `"Roll"`)
- `accessibilityState`: `{ disabled: !enabled }`

**Notes:**
- Haptic feedback fires inside `RollButton` itself: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` on press (not in the parent screen)

---

## `RollResultView`

**File:** `components/RollResultView.tsx`

The content of the Roll Result overlay modal. This is a React Native component — it does not use `@randsum/dice-ui`'s `RollResultPanel`. See ADR-003 for rationale.

```typescript
import type { ParsedRollResult } from '@/lib/parseRollResult'

interface RollResultViewProps {
  /** The deserialized roll result from route params */
  readonly result: ParsedRollResult
  /** Called when the user taps "Roll again" */
  readonly onRollAgain: () => void
  /** Called when the user taps "Save as template" */
  readonly onSaveAsTemplate: () => void
  /** Called when the user taps "Share" */
  readonly onShare: () => void
}
```

**Layout (top to bottom):**
1. Dismiss handle — 36pt wide pill, `tokens.border` background, centered at top
2. Total — `size-3xl` (48pt), JetBrains Mono, bold, `tokens.text`, centered. Animates from 0 to final value over 400ms (spring). Suppressed when `useReducedMotion()` is true (value appears immediately).
3. Notation — the notation that was rolled, `size-sm`, `tokens.textMuted`, centered
4. Breakdown — individual die results. Each die value is a pill: `tokens.surfaceAlt` background, JetBrains Mono, `size-base`. Dropped/discarded dice use strikethrough and `tokens.textDim`.
5. Action row — "Share", "Save as template", "Roll again" buttons

**Animations:**
- Total number spin: counts up from 0 to `result.total` over 400ms using spring easing (`react-native-reanimated`)
- Animation completion fires `AccessibilityInfo.announceForAccessibility(String(result.total))`
- After total animation completes: `Haptics.notificationAsync(NotificationFeedbackType.Success)`

**Notes:**
- `RollResultView` does not own dismiss behavior — swipe-down and backdrop tap are handled by the modal route itself (`app/result.tsx`) via Expo Router's `presentation: 'modal'`
- "Roll again" calls `onRollAgain`, which in the parent route re-executes the notation and replaces the current modal route via `router.replace`

---

## `GameCard`

**File:** `components/GameCard.tsx`

Card in the Games tab selector grid.

```typescript
interface GameCardProps {
  readonly gameId: SupportedGameId
  /** Game display name */
  readonly name: string
  /** Short description (1–2 sentences) */
  readonly description: string
  /** Game accent color from the `gameColors` map */
  readonly accentColor: string
  /** Called when the card is tapped */
  readonly onPress: () => void
}
```

**Layout:** Card with `tokens.surface` background. Left border (4pt) in `accentColor`. Game name in `tokens.text`, `size-base`, semibold. Description in `tokens.textMuted`, `size-sm`.

**Accessibility:**
- `accessibilityRole`: `"button"`
- `accessibilityLabel`: `"{name}. {description}"`

**Grid layout:** 2 columns on phones (width < 600pt), 3 columns on tablets. Managed by the parent `games.tsx` screen using `FlatList` with `numColumns`.

---

## `GameRoller`

**File:** `components/GameRoller.tsx`

Auto-generated input form for a game roller. Reads the game's input spec via `useGameSpec` and renders the appropriate input component for each field.

```typescript
interface GameRollerProps {
  readonly gameId: SupportedGameId
  /**
   * Current input values. Keys match the spec's `roll.inputs` field names.
   * Parent screen manages this state and passes it down.
   */
  readonly values: Record<string, unknown>
  /** Called when any input value changes */
  readonly onChange: (name: string, value: unknown) => void
}
```

**Input field rendering:**

| Spec input kind | Component rendered |
|---|---|
| `integer` | `NumericStepper` |
| `string-options` with ≤ 3 options | Segmented control |
| `string-options` with ≥ 4 options | Bottom sheet picker trigger + modal |
| `string-free` | `TextInput` (React Native) |

Each field has a label above it: `tokens.textMuted`, `size-sm`. Fields are rendered in spec order.

**Notes:**
- `GameRoller` does not include the Roll button — the parent screen places the `RollButton` below this component
- Input validation against spec constraints (`min`, `max`, required options) is the parent screen's responsibility before calling `useGameRoll().roll(values)`

---

## `TemplateRow`

**File:** `components/TemplateRow.tsx`

A single row in the Saved tab template list. Swipeable to reveal Edit and Delete actions.

```typescript
import type { RollTemplate } from '@/lib/types'

interface TemplateRowProps {
  readonly template: RollTemplate
  /** Called when the quick-roll button is tapped */
  readonly onQuickRoll: (template: RollTemplate) => void
  /** Called when the Edit swipe action is tapped */
  readonly onEdit: (template: RollTemplate) => void
  /** Called when the Delete swipe action is tapped (after confirmation) */
  readonly onDelete: (id: string) => void
}
```

**Layout:**
- Primary line: template `name` in `tokens.text`, `size-base`
- Secondary line: `template.notation` in JetBrains Mono, `tokens.textMuted`, `size-sm` (or game name if `template.gameId` is set)
- Right side: quick-roll button — `tokens.accent` circular button, 44pt minimum touch target, play icon

**Swipe actions (swipe left):**
- Edit: `tokens.surfaceAlt` background, pencil icon — calls `onEdit`
- Delete: `tokens.error` background, trash icon — shows confirmation alert before calling `onDelete`

**Swipe implementation:** Uses `react-native-gesture-handler`'s `Swipeable` component.

**Notes:**
- If `template.variables` is non-empty, tapping the quick-roll button opens a `VariablePromptSheet` before rolling
- Confirmation for Delete uses `Alert.alert` from React Native (not a custom modal)

---

## `HistoryEntry`

**File:** `components/HistoryEntry.tsx`

A single expandable row in the History tab feed.

```typescript
import type { RollHistoryEntry } from '@/lib/types'

interface HistoryEntryProps {
  readonly entry: RollHistoryEntry
  /** Whether the entry is currently expanded */
  readonly isExpanded: boolean
  /** Toggle expanded/collapsed state */
  readonly onToggle: () => void
  /** Called when the Delete swipe action is confirmed */
  readonly onDelete: (id: string) => void
}
```

**Collapsed layout:**
- Left: `entry.notation` in JetBrains Mono, `tokens.textMuted`, `size-sm`
- Right: total in JetBrains Mono, `tokens.text`, `size-xl`
- Second line: timestamp (relative, e.g. "2 minutes ago") and game name if present — both `tokens.textDim`, `size-xs`

**Expanded layout:**
- All collapsed content, plus a full breakdown: individual die values as pills (`tokens.surfaceAlt`, JetBrains Mono, `size-base`), modifier steps in `tokens.textMuted`, `size-sm`
- Height animation: spring, 200ms (`react-native-reanimated`)
- If `useReducedMotion()` is true, expansion is immediate (no animation)

**Swipe actions (swipe left):** Delete only (no Edit). No confirmation dialog.

**Notes:**
- The History tab manages expanded state — each entry's `isExpanded` is tracked in the screen's local state (e.g. `useState<string | null>` for the currently expanded entry ID)
- For very deep breakdowns (e.g. Salvage Union), the expanded area has `maxHeight: 300pt` with an internal `ScrollView`

---

## `NumericStepper`

**File:** `components/NumericStepper.tsx`

Integer input used in game rollers for `integer`-type spec inputs.

```typescript
interface NumericStepperProps {
  /** Current value */
  readonly value: number
  /** Minimum value (inclusive). Decrement is disabled at minimum. */
  readonly min: number
  /** Maximum value (inclusive). Increment is disabled at maximum. */
  readonly max: number
  /** Called when value changes */
  readonly onChange: (value: number) => void
  /** Optional label rendered above the stepper */
  readonly label?: string
  /** Whether the entire stepper is disabled */
  readonly disabled?: boolean
}
```

**Layout:** Minus button — value display — plus button, arranged in a row. Value display uses JetBrains Mono, `size-lg`, `tokens.text`, minimum width 40pt (to prevent layout shift between single and double-digit values).

**Button states:**
- At `min`: minus button uses `tokens.textDim`, `accessibilityState: { disabled: true }`
- At `max`: plus button uses `tokens.textDim`, `accessibilityState: { disabled: true }`
- Each tap fires `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on native

**Accessibility:**
- Minus button `accessibilityLabel`: `"Decrease {label ?? 'value'}"`
- Plus button `accessibilityLabel`: `"Increase {label ?? 'value'}"`
- Value display `accessibilityLabel`: `"{value}"`

---

## `NotationInput`

**File:** `components/NotationInput.tsx`

The Advanced Mode notation input. Uses the `"use dom"` directive to render `@randsum/dice-ui`'s `NotationRoller` inside a WebView on native, and directly on web. See ADR-003 for the full integration specification.

```typescript
'use dom'

interface NotationInputProps {
  /**
   * Controlled notation value passed into the WebView.
   * Source of truth is useNotationStore in the native shell.
   */
  readonly notation: string
  /**
   * Increment to trigger an uncontrolled reset of the input.
   * Corresponds to NotationRoller's resetToken prop.
   */
  readonly resetToken: number
  /**
   * Current color scheme — used to set data-theme on document.documentElement
   * inside the WebView so dice-ui's theme hook resolves correctly.
   */
  readonly theme: 'light' | 'dark'
  /**
   * Fires on each keystroke with the current notation string.
   * Native shell calls useNotationStore.setNotation(notation).
   */
  readonly onChange: (notation: string) => void
  /**
   * Fires after a successful roll from within the WebView.
   * result is fully JSON-serializable: { total, records, notation }.
   */
  readonly onRoll: (result: { total: number; records: unknown[]; notation: string }) => void
}
```

**Bridged props (JSON-serializable only):**

| Prop | Direction |
|---|---|
| `notation` | native → DOM |
| `resetToken` | native → DOM |
| `theme` | native → DOM |
| `onChange` | DOM → native |
| `onRoll` | DOM → native |

**Not bridged:** `className` (no CSS in native), `renderActions` (returns `React.ReactNode`, not serializable).

**Theme bridging:** On mount and on `theme` prop change, the component sets `document.documentElement.setAttribute('data-theme', theme)` inside the WebView. This activates `dice-ui`'s internal `data-theme` mechanism without modifying `@randsum/dice-ui`.

**Platform behavior:**
- iOS/Android: renders inside a transparent WebView proxy
- Web: renders `NotationRoller` directly — no WebView, no bridge overhead

**Notes:**
- The Roll button inside `NotationRoller` is the only roll trigger in Advanced Mode — the native shell does not add a second roll button when `NotationInput` is mounted
- If WebView performance is inadequate on mid-range Android, the fallback is `components/NotationInput.native.tsx` with React Native `TextInput` (see ADR-003)

---

## `VariablePromptSheet`

**File:** `components/VariablePromptSheet.tsx`

Bottom sheet that appears when rolling a template with variables. Collects variable values before rolling.

```typescript
import type { RollTemplate, Variable } from '@/lib/types'

interface VariablePromptSheetProps {
  /** Variables to collect values for */
  readonly variables: readonly Variable[]
  /** Whether the sheet is visible */
  readonly isVisible: boolean
  /** Called with resolved variable values when the user taps Roll */
  readonly onRoll: (values: Record<string, number>) => void
  /** Called when the user dismisses without rolling */
  readonly onDismiss: () => void
}
```

**Layout:** One `NumericStepper` per `Variable` (variables are always numeric in v1). Each stepper is pre-filled with `variable.default ?? 0`. Label from `variable.label ?? variable.name`.

**Notes:**
- The sheet is lightweight: no scroll, no wizard steps, just the variable fields
- On web, rendered as a bottom-anchored panel (no native sheet API)
- `onRoll` receives `Record<string, number>` — the parent interpolates values into the notation string before calling `useRoll().roll()`
