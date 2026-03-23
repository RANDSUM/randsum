# Universal @randsum/dice-ui — Design Spec

## Summary

Extend `@randsum/dice-ui` from a web-only component library to a universal library that works in both React (web) and React Native environments. Port all 5 components using Metro's `.native.tsx` platform resolution. Extract `QuickReferenceGrid` from the playground into dice-ui as a new universal component.

## Goals

1. `import { NotationRoller } from '@randsum/dice-ui'` works identically on web and native
2. All token colors, descriptions, and categories come from `NOTATION_DOCS` in `@randsum/roller/docs`
3. The Expo app's Advanced Mode uses the ported components directly
4. The playground continues to work unchanged (imports shift to `@randsum/dice-ui`)
5. Zero new runtime dependencies beyond what each platform already has

## Non-Goals

- Rewriting the web components (they stay as-is)
- Supporting platforms other than React and React Native
- Adding new features to the components (parity port only)
- Token overlay hover interactions on mobile (no mouse on touch devices)

## Architecture

### Platform Resolution

Metro (React Native) resolves `.native.tsx` files. Web bundlers (Webpack, Vite, esbuild) resolve bare `.tsx` files. The `package.json` `exports` field maps subpaths to the correct entry points.

```
import { NotationRoller } from '@randsum/dice-ui'
// Web  → src/NotationRoller.tsx     (existing, DOM-based)
// Native → src/NotationRoller.native.tsx (new, View/Text/TextInput)
```

### Package Structure

```
packages/dice-ui/src/
  ── Shared (both platforms)
     types.ts              — RollResult, shared prop interfaces
     tokenColor.ts         — tokenColor() helper (pure function, no DOM/RN)

  ── Web (existing, unchanged except QuickReferenceGrid addition)
     NotationRoller.tsx
     TokenOverlayInput.tsx
     RollResultPanel.tsx
     RollSteps.tsx
     QuickReferenceGrid.tsx    ← NEW (moved from playground)
     useTheme.ts               (MutationObserver-based)
     *.css

  ── Native (NEW)
     NotationRoller.native.tsx
     TokenOverlayInput.native.tsx
     RollResultPanel.native.tsx
     RollSteps.native.tsx
     QuickReferenceGrid.native.tsx
     useTheme.native.ts        (React Context-based)
```

### Shared Types (`types.ts`)

Extracted from the web components to be shared by both platforms:

```typescript
import type { RollRecord } from '@randsum/roller'

export interface RollResult {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
}

export interface NotationRollerProps {
  readonly defaultNotation?: string
  readonly notation?: string
  readonly onChange?: (notation: string) => void
  readonly resetToken?: number
  readonly onRoll?: (result: RollResult) => void
  readonly theme?: 'light' | 'dark'
}

export interface QuickReferenceGridProps {
  readonly onAdd: (fragment: string) => void
  readonly notation?: string
  readonly theme?: 'light' | 'dark'
}

export interface RollResultPanelProps {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
  readonly onClose?: () => void
  readonly theme?: 'light' | 'dark'
}
```

### Token Color Helper (`tokenColor.ts`)

Extracted from both `NotationRoller.tsx` and `TokenOverlayInput.tsx` (currently duplicated):

```typescript
export function tokenColor(
  doc: { readonly color: string; readonly colorLight: string } | undefined,
  theme: 'light' | 'dark'
): string | undefined {
  if (!doc) return undefined
  return theme === 'light' ? doc.colorLight : doc.color
}
```

## Component Designs

### 1. NotationRoller.native.tsx

The top-level component. Contains the token-colored input, ROLL button, and description row.

**Differences from web:**
- No `className` prop (React Native doesn't use CSS classes)
- No `renderActions` prop (mobile uses the description row differently)
- `theme` passed as prop (no DOM `data-theme` attribute)
- Haptic feedback on roll (via `expo-haptics` if available, graceful no-op if not)

**Layout:**
```
┌─────────────────────────────────────────┐
│ [TokenOverlayInput          ] [ROLL]    │  ← input row
│ 4d6, drop lowest + 1d20 + plus 5       │  ← description row
└─────────────────────────────────────────┘
```

**State management:** Same as web — internal `notation` state (uncontrolled) or controlled via `notation` prop. Validation via `isDiceNotation()`. Tokenization via `tokenize()`. Roll via `roll()` from `@randsum/roller`.

### 2. TokenOverlayInput.native.tsx — Rich Text Input Simulation

The core rendering challenge. Web uses an invisible overlay `<div>` with colored `<span>` elements positioned over a transparent `<input>`. React Native cannot do this.

**Native approach: Hidden TextInput + Colored Text Segments**

```
┌─────────────────────────────────────────┐
│  View (container, onPress → focus)      │
│  ┌───────────────────────────────────┐  │
│  │ View (visible token display)      │  │
│  │  Text "4d6" Text "L" Text "+"    │  │
│  │  Text "1d20" Text "+5" ▎cursor   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ TextInput (hidden, opacity:0)     │  │
│  │ Captures keyboard + paste         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**How it works:**
1. A `TextInput` with `opacity: 0` and `position: 'absolute'` captures keyboard input
2. `onChangeText` fires on each keystroke → tokenize the text → render colored `Text` segments
3. Each `Text` segment gets its color from `tokenColor(NOTATION_DOCS[token.key], theme)`
4. A blinking cursor `View` (animated opacity 0↔1) is positioned after the last token
5. Tapping the visible `View` calls `hiddenInputRef.current?.focus()` to open the keyboard
6. `onSelectionChange` tracks cursor position for correct cursor placement

**Cursor management:**
- Track `selection.start` from `onSelectionChange`
- Map cursor position to token index: walk token offsets until `position <= offset + token.text.length`
- Render cursor `View` after the token at that index
- No text selection highlighting on native (out of scope for v1 — selecting text in the hidden input works, but the visible segments don't reflect it)

**Edge cases:**
- Paste: handled by `TextInput` natively, `onChangeText` fires with full new value
- Autocorrect: disabled (`autoCorrect={false}`, `autoCapitalize="none"`)
- Return key: fires `onRoll` callback (same as Enter on web)

### 3. QuickReferenceGrid — Port from Playground

**Web version (`QuickReferenceGrid.tsx`):**
Move the existing 967-line component from `apps/playground/src/components/QuickReferenceGrid.tsx` into `packages/dice-ui/src/QuickReferenceGrid.tsx`. Update the playground to import from `@randsum/dice-ui`.

The web component stays functionally identical — same masonry layout, same DocModal overlay, same 4 builder types.

**Native version (`QuickReferenceGrid.native.tsx`):**

Layout: `SectionList` grouped by modifier category (12 categories in the same order as web).

Each section:
- Section header: category name in the category's accent color, uppercase
- Rows: `Pressable` with notation key (monospace, colored) + title (muted)

Tap a row → opens a `Modal` (React Native core) or bottom sheet with:
- Header: large notation symbol + title + description + close button
- Forms section: notation patterns + notes (from `doc.forms`)
- Examples section: full notation strings + descriptions (from `doc.examples`)
- Builder UI: one of 4 types based on the doc's characteristics

**Builder type mapping** (same logic as web `QuickReferenceGrid.tsx`):
- `kind: 'dice'` → DiceBuilder: quantity stepper + sides stepper → preview "4d6"
- `kind: 'number'` → NumberBuilder: single stepper → preview "K5" or "+3"
- `kind: 'condition'` → ConditionBuilder: operator picker + value stepper → preview "R{<3}"
- `kind: 'no-arg'` → NoArgBuilder: direct "Add [fragment]" button

**`canAddModifier` logic:** Same as web — modifier builders are disabled unless the current notation already contains dice. Core and Special categories are exempt.

**NumericStepper:** Reuse the `NumericStepper` component already built for game rollers in the Expo app (or extract a shared version into dice-ui).

### 4. RollResultPanel.native.tsx

Port of the web result panel. Used in the Expo app's roll result overlay to show dice breakdown.

**Layout:**
```
┌─────────────────────────────────────────┐
│  Total: 15          notation: 4d6L      │
│─────────────────────────────────────────│
│  Initial rolls    6  5  4  1            │
│  Drop lowest         strikethrough: 1   │
│  Final rolls      6  5  4  = 15        │
└─────────────────────────────────────────┘
```

Uses `traceRoll()` from `@randsum/roller/trace` to get the step-by-step breakdown, same as web.

### 5. RollSteps.native.tsx + DieBadge.native.tsx

Port of step rows and die badges.

**DieBadge:** A `View` with a `Text` inside. Variants:
- `unchanged`: default text color, surface background
- `removed`: strikethrough (`textDecorationLine: 'line-through'`), dimmed opacity
- `added`: accent-colored text

**StepRow:** Renders one row of the trace. Discriminated by `kind`:
- `'divider'` → thin `View` separator line
- `'arithmetic'` → label + display text
- `'rolls'` → label + row of DieBadge components
- `'finalRolls'` → label + math expression text

### 6. useTheme.native.ts

The web `useTheme` uses `MutationObserver` on `document.documentElement[data-theme]`. React Native has no DOM.

**Native approach:** React Context + Provider.

```typescript
const DiceUIThemeContext = createContext<'light' | 'dark'>('dark')

export function DiceUIThemeProvider({
  theme,
  children
}: {
  readonly theme: 'light' | 'dark'
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <DiceUIThemeContext.Provider value={theme}>
      {children}
    </DiceUIThemeContext.Provider>
  )
}

export function useTheme(): 'light' | 'dark' {
  return useContext(DiceUIThemeContext)
}
```

The Expo app's root layout wraps children in `<DiceUIThemeProvider theme={colorScheme}>`, bridging from Zustand's `useThemeStore` to dice-ui's context.

## Expo App Changes

### Header Toggle

Move the Simple/Advanced toggle from the ActionRow into the tab header via Expo Router's `headerRight`:

```typescript
// app/(tabs)/_layout.tsx
<Tabs.Screen
  name="index"
  options={{
    title: 'Roll',
    headerRight: () => <ModeToggleButton />,
  }}
/>
```

`ModeToggleButton` renders a `</>` icon. Inactive: `surfaceAlt` background. Active (Advanced Mode): `accent` background. Toggles a Zustand `useRollModeStore` (or local state lifted to the layout).

### Roll Tab Changes

`app/(tabs)/index.tsx` changes:
- Remove inline Advanced Mode rendering (currently lines 66-98)
- Remove `NotationInput` and `NotationReference` imports
- Import `NotationRoller` and `QuickReferenceGrid` from `@randsum/dice-ui`
- Wrap in `DiceUIThemeProvider`
- Advanced Mode renders: `<NotationRoller>` + `<QuickReferenceGrid>` + `<RollButton>`

### Files to Delete from Expo App

These are replaced by dice-ui imports:
- `apps/expo/components/NotationInput.tsx` — replaced by `TokenOverlayInput` from dice-ui
- `apps/expo/components/NotationReference.tsx` — replaced by `QuickReferenceGrid` from dice-ui
- `apps/expo/__tests__/NotationInput.test.ts` — tests move to dice-ui

### Files to Delete from Playground

After extraction:
- `apps/playground/src/components/QuickReferenceGrid.tsx` — now in dice-ui
- Playground imports change to `import { QuickReferenceGrid } from '@randsum/dice-ui'`

## Dependencies

### dice-ui package.json changes

**New peer dependencies:**
- `react-native` (optional peer — only needed for `.native.tsx` resolution)
- `expo-haptics` (optional peer — graceful no-op if not installed)

**No new runtime dependencies.** All data comes from `@randsum/roller/docs`.

### Expo app changes

- Add `@randsum/dice-ui: "workspace:~"` to `apps/expo/package.json`
- `expo-haptics` already installed
- `expo-crypto` already installed

## Testing Strategy

### dice-ui tests (bun:test)

Test the shared logic and web components:
- `tokenColor()` returns correct colors for light/dark themes
- `QuickReferenceGrid` renders all 12 categories
- Builder type detection matches expected doc → builder mapping
- `canAddModifier()` returns false when no dice in notation

### Expo app tests (bun:test)

Test the integration:
- Advanced Mode renders `NotationRoller` from dice-ui
- Header toggle switches modes
- `QuickReferenceGrid` `onAdd` appends to notation
- Theme provider bridges correctly

Native `.native.tsx` components are not unit-tested in bun:test (they require a React Native host). They are verified via device testing.

## Migration Checklist

1. Extract `tokenColor()` to shared `types.ts` / `tokenColor.ts`
2. Extract shared type interfaces to `types.ts`
3. Move `QuickReferenceGrid.tsx` from playground to dice-ui
4. Update playground imports to `@randsum/dice-ui`
5. Create all `.native.tsx` files
6. Create `useTheme.native.ts` with Context provider
7. Update dice-ui `package.json` exports for platform resolution
8. Add `@randsum/dice-ui` to Expo app dependencies
9. Wire `DiceUIThemeProvider` in Expo root layout
10. Replace Expo `NotationInput` + `NotationReference` with dice-ui imports
11. Move header toggle to `headerRight`
12. Delete replaced Expo components
13. Verify playground still works
14. Verify Expo app Advanced Mode works
