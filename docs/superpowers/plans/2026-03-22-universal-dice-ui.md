# Universal @randsum/dice-ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `@randsum/dice-ui` from web-only to universal (React + React Native) using `.native.tsx` platform files, and integrate into the Expo app's Advanced Mode.

**Architecture:** Metro resolves `.native.tsx` files for React Native; web bundlers resolve bare `.tsx`. Shared types and helpers are extracted to platform-agnostic files. The `QuickReferenceGrid` component is extracted from the playground into dice-ui as a new universal component.

**Tech Stack:** React Native (View, Text, TextInput, Pressable, Modal, SectionList, Animated), `@randsum/roller` (tokenize, isDiceNotation, roll, traceRoll, NOTATION_DOCS), Zustand (theme bridging in Expo)

**Spec:** `docs/superpowers/specs/2026-03-22-universal-dice-ui-design.md`

---

## File Map

### dice-ui: New files

| File | Purpose |
|------|---------|
| `packages/dice-ui/src/types.ts` | Shared types: RollResult, prop interfaces |
| `packages/dice-ui/src/tokenColor.ts` | Shared tokenColor() helper |
| `packages/dice-ui/src/useTheme.native.ts` | RN theme via Context + Provider |
| `packages/dice-ui/src/TokenOverlayInput.native.tsx` | Hidden TextInput + colored Text segments |
| `packages/dice-ui/src/RollSteps.native.tsx` | StepRow + DieBadge for RN |
| `packages/dice-ui/src/RollResultPanel.native.tsx` | Result panel for RN |
| `packages/dice-ui/src/NotationRoller.native.tsx` | Top-level roller for RN |
| `packages/dice-ui/src/QuickReferenceGrid.tsx` | Moved from playground (web) |
| `packages/dice-ui/src/QuickReferenceGrid.native.tsx` | SectionList + Modal with builders (RN) |
| `packages/dice-ui/src/NumericStepper.native.tsx` | Reusable +/- stepper for builders |

### dice-ui: Modified files

| File | Change |
|------|--------|
| `packages/dice-ui/src/index.ts` | Add exports for new components + types |
| `packages/dice-ui/src/NotationRoller.tsx` | Import tokenColor from shared file |
| `packages/dice-ui/src/TokenOverlayInput.tsx` | Import tokenColor from shared file |
| `packages/dice-ui/package.json` | Add optional RN peer deps, react-native entry |

### Expo app: Modified files

| File | Change |
|------|--------|
| `apps/expo/package.json` | Add `@randsum/dice-ui: "workspace:~"` |
| `apps/expo/app/_layout.tsx` | Wrap in `DiceUIThemeProvider` |
| `apps/expo/app/(tabs)/_layout.tsx` | Add `headerRight` mode toggle to Roll tab |
| `apps/expo/app/(tabs)/index.tsx` | Replace inline Advanced Mode with dice-ui imports |

### Expo app: Deleted files

| File | Replaced by |
|------|------------|
| `apps/expo/components/NotationInput.tsx` | `TokenOverlayInput` from dice-ui |
| `apps/expo/components/NotationReference.tsx` | `QuickReferenceGrid` from dice-ui |
| `apps/expo/__tests__/NotationInput.test.ts` | Tests in dice-ui |

### Playground: Modified files

| File | Change |
|------|--------|
| `apps/playground/src/components/QuickReferenceGrid.tsx` | Delete (moved to dice-ui) |
| Files importing QuickReferenceGrid | Update import path to `@randsum/dice-ui` |

---

## Task 1: Extract shared types and tokenColor

**Files:**
- Create: `packages/dice-ui/src/types.ts`
- Create: `packages/dice-ui/src/tokenColor.ts`
- Modify: `packages/dice-ui/src/NotationRoller.tsx`
- Modify: `packages/dice-ui/src/TokenOverlayInput.tsx`
- Modify: `packages/dice-ui/src/index.ts`

- [ ] **Step 1: Create `types.ts` with shared interfaces**

```typescript
// packages/dice-ui/src/types.ts
import type { RollRecord } from '@randsum/roller'

export interface RollResult {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
}
```

- [ ] **Step 2: Create `tokenColor.ts`**

```typescript
// packages/dice-ui/src/tokenColor.ts
export function tokenColor(
  doc: { readonly color: string; readonly colorLight: string } | undefined,
  theme: 'light' | 'dark'
): string | undefined {
  if (!doc) return undefined
  return theme === 'light' ? doc.colorLight : doc.color
}
```

- [ ] **Step 3: Update `NotationRoller.tsx` to import from shared files**

Replace the local `tokenColor` function (lines 11-17) with:
```typescript
import { tokenColor } from './tokenColor'
import type { RollResult } from './types'
```
Remove the local `RollResult` interface and `tokenColor` function. Keep `NotationRollerProps` local (it has web-specific fields like `className`, `renderActions`).

- [ ] **Step 4: Update `TokenOverlayInput.tsx` to import from shared file**

Replace the local `tokenColor` function (lines 14-19) with:
```typescript
import { tokenColor } from './tokenColor'
```

- [ ] **Step 5: Update `index.ts` to re-export shared types**

Add to `packages/dice-ui/src/index.ts`:
```typescript
export type { RollResult } from './types'
export { tokenColor } from './tokenColor'
```

- [ ] **Step 6: Verify typecheck passes**

Run: `bun run --filter @randsum/dice-ui typecheck`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add packages/dice-ui/src/types.ts packages/dice-ui/src/tokenColor.ts packages/dice-ui/src/NotationRoller.tsx packages/dice-ui/src/TokenOverlayInput.tsx packages/dice-ui/src/index.ts
git commit -m "refactor(dice-ui): extract shared types and tokenColor helper"
```

---

## Task 2: Create native useTheme with Context provider

**Files:**
- Create: `packages/dice-ui/src/useTheme.native.ts`

- [ ] **Step 1: Write the native theme provider and hook**

```typescript
// packages/dice-ui/src/useTheme.native.ts
import { createContext, useContext } from 'react'

type ColorScheme = 'light' | 'dark'

const DiceUIThemeContext = createContext<ColorScheme>('dark')

export function DiceUIThemeProvider({
  theme,
  children
}: {
  readonly theme: ColorScheme
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <DiceUIThemeContext.Provider value={theme}>
      {children}
    </DiceUIThemeContext.Provider>
  )
}

export function useTheme(): ColorScheme {
  return useContext(DiceUIThemeContext)
}

// No-ops for web API compat — native code should not call these
export function getTheme(): ColorScheme {
  return 'dark'
}

export function subscribeTheme(_cb: () => void): () => void {
  return () => {}
}
```

- [ ] **Step 2: Update `index.ts` to export the provider**

Add to exports:
```typescript
export { DiceUIThemeProvider } from './useTheme'
```
Note: Metro resolves `useTheme.native.ts`, web resolves `useTheme.ts`. The `DiceUIThemeProvider` export only exists on the native side — web consumers don't need it.

- [ ] **Step 3: Commit**

```bash
git add packages/dice-ui/src/useTheme.native.ts packages/dice-ui/src/index.ts
git commit -m "feat(dice-ui): add native theme provider via React Context"
```

---

## Task 3: Create native DieBadge + RollSteps

**Files:**
- Create: `packages/dice-ui/src/RollSteps.native.tsx`

- [ ] **Step 1: Write `RollSteps.native.tsx`**

Port `DieBadge`, `StepRow`, and `RollSteps` using `View` and `Text` instead of `span`, `hr`, and CSS classes.

Key mappings:
- `<span className="du-die-badge">` → `<View style={badgeStyle}><Text>{value}</Text></View>`
- `variant: 'removed'` → `{ textDecorationLine: 'line-through', opacity: 0.4 }`
- `variant: 'added'` → `{ color: tokens.accent }`
- `<hr>` → `<View style={{ height: 1, backgroundColor: border }} />`
- `step.kind === 'rolls'` → horizontal `View` with `flexDirection: 'row'` + `flexWrap: 'wrap'`
- Uses `traceRoll()` from `@randsum/roller/trace`
- Theme from `useTheme()` (resolves to native context)
- Colors from a local token map keyed by theme (dark/light), matching the CSS values

- [ ] **Step 2: Verify typecheck**

Run: `bun run --filter @randsum/dice-ui typecheck`

- [ ] **Step 3: Commit**

```bash
git add packages/dice-ui/src/RollSteps.native.tsx
git commit -m "feat(dice-ui): add native RollSteps + DieBadge components"
```

---

## Task 4: Create native RollResultPanel

**Files:**
- Create: `packages/dice-ui/src/RollResultPanel.native.tsx`

- [ ] **Step 1: Write `RollResultPanel.native.tsx`**

Port the web `RollResultPanel` + `RollResultDisplay`. Key mappings:
- Total pane: large `Text` with accent border `View`
- Header line: notation (accent, bold) + pipe + descriptions (dim)
- Steps: `RollSteps` from `./RollSteps` (Metro resolves `.native.tsx`)
- Multi-pool: show pool notation as section headings
- Total row: bold label + math expression
- Close button: `Pressable` with × text (optional, via `onClose` prop)
- All colors from theme-keyed token map

- [ ] **Step 2: Verify typecheck**

Run: `bun run --filter @randsum/dice-ui typecheck`

- [ ] **Step 3: Commit**

```bash
git add packages/dice-ui/src/RollResultPanel.native.tsx
git commit -m "feat(dice-ui): add native RollResultPanel component"
```

---

## Task 5: Create native TokenOverlayInput (rich text simulation)

**Files:**
- Create: `packages/dice-ui/src/TokenOverlayInput.native.tsx`

- [ ] **Step 1: Write `TokenOverlayInput.native.tsx`**

This is the most complex native component. Architecture:
1. Hidden `TextInput` (opacity: 0, position: 'absolute') captures keyboard
2. Visible `View` renders colored `Text` segments per token
3. Blinking cursor `View` (Animated opacity 0↔1) after last character
4. Tapping visible View focuses hidden TextInput
5. `onSelectionChange` tracks cursor position

```typescript
// Key props (different from web — children pattern doesn't apply on native)
interface TokenOverlayInputNativeProps {
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly tokens: readonly Token[]
  readonly theme?: 'light' | 'dark'
  readonly placeholder?: string
  readonly onSubmitEditing?: () => void
}
```

Implementation notes:
- Each token rendered as `<Text style={{ color: tokenColor(doc, theme) }}>{token.text}</Text>`
- Cursor: `Animated.loop(Animated.sequence([timing(0→1, 500ms), timing(1→0, 500ms)]))`
- Container `Pressable` calls `inputRef.current?.focus()`
- `autoCorrect={false}`, `autoCapitalize="none"`, `spellCheck={false}`
- `returnKeyType="go"`, `onSubmitEditing` fires roll
- Font: JetBrains Mono (monospace) matching web's `--dui-font-mono`
- Border color: accent when valid tokens present, error when empty after typing, default otherwise (passed as prop or derived)

- [ ] **Step 2: Verify typecheck**

Run: `bun run --filter @randsum/dice-ui typecheck`

- [ ] **Step 3: Commit**

```bash
git add packages/dice-ui/src/TokenOverlayInput.native.tsx
git commit -m "feat(dice-ui): add native TokenOverlayInput with rich text simulation"
```

---

## Task 6: Create native NotationRoller

**Files:**
- Create: `packages/dice-ui/src/NotationRoller.native.tsx`

- [ ] **Step 1: Write `NotationRoller.native.tsx`**

Top-level component matching web's `NotationRoller`. Layout:
```
[TokenOverlayInput          ] [ROLL button]
description chips row
```

State management (same as web):
- `notation` state (controlled or uncontrolled)
- `isDiceNotation()` validation
- `tokenize()` for token array
- `roll()` on ROLL press with 300ms debounce
- Description row: empty hint / invalid text / colored description chips

Key differences from web:
- Uses `View` + `Text` + `Pressable` instead of `div` + `span` + `button`
- ROLL button: `Pressable` with accent background, "ROLL" text
- Description chips: `Text` segments with per-token colors (same as web description row)
- No hover interactions (no `onMouseMove`/`onMouseLeave`)
- Haptic on roll: try `expo-haptics` import, catch and no-op if unavailable
- Theme from `useTheme()` context

- [ ] **Step 2: Verify typecheck**

Run: `bun run --filter @randsum/dice-ui typecheck`

- [ ] **Step 3: Commit**

```bash
git add packages/dice-ui/src/NotationRoller.native.tsx
git commit -m "feat(dice-ui): add native NotationRoller component"
```

---

## Task 7: Move QuickReferenceGrid from playground to dice-ui (web)

**Files:**
- Create: `packages/dice-ui/src/QuickReferenceGrid.tsx` (moved from playground)
- Create: `packages/dice-ui/src/QuickReferenceGrid.css` (styles extracted)
- Modify: `packages/dice-ui/src/index.ts`
- Modify: playground files that import QuickReferenceGrid

- [ ] **Step 1: Copy `QuickReferenceGrid.tsx` from playground to dice-ui**

Copy `apps/playground/src/components/QuickReferenceGrid.tsx` to `packages/dice-ui/src/QuickReferenceGrid.tsx`.

Update imports in the copied file:
- `@randsum/roller/docs` imports stay (already correct)
- Add `import './QuickReferenceGrid.css'` for styles
- Extract inline styles to the CSS file

- [ ] **Step 2: Update playground imports**

Find all files in `apps/playground/` that import from `./QuickReferenceGrid` or `../components/QuickReferenceGrid` and change to:
```typescript
import { QuickReferenceGrid } from '@randsum/dice-ui'
```

- [ ] **Step 3: Delete the original file from playground**

Remove `apps/playground/src/components/QuickReferenceGrid.tsx`.

- [ ] **Step 4: Add export to dice-ui `index.ts`**

```typescript
export { QuickReferenceGrid } from './QuickReferenceGrid'
```

- [ ] **Step 5: Verify playground typecheck**

Run: `bun run --filter @randsum/playground typecheck`

- [ ] **Step 6: Commit**

```bash
git add packages/dice-ui/src/QuickReferenceGrid.tsx packages/dice-ui/src/QuickReferenceGrid.css packages/dice-ui/src/index.ts apps/playground/
git commit -m "refactor(dice-ui): move QuickReferenceGrid from playground to dice-ui"
```

---

## Task 8: Create native QuickReferenceGrid

**Files:**
- Create: `packages/dice-ui/src/QuickReferenceGrid.native.tsx`
- Create: `packages/dice-ui/src/NumericStepper.native.tsx`

- [ ] **Step 1: Write `NumericStepper.native.tsx`**

Reusable stepper for the builder UI:
```typescript
interface NumericStepperProps {
  readonly value: number
  readonly onValueChange: (value: number) => void
  readonly min?: number
  readonly max?: number
  readonly label?: string
  readonly theme?: 'light' | 'dark'
}
```
Layout: `[-]` `value` `[+]` with min/max clamping, JetBrains Mono value display.

- [ ] **Step 2: Write `QuickReferenceGrid.native.tsx`**

Port the full playground QuickReferenceGrid to React Native:
- `SectionList` with 12 category sections (same order as web)
- Section headers: category name, uppercase, colored by category accent
- Rows: `Pressable` → notation key (monospace, colored) + title (muted) + chevron
- Tap row → open `Modal` with doc detail + builder UI
- 4 builder types: DiceBuilder, NumberBuilder, ConditionBuilder, NoArgBuilder
- `canAddModifier()` logic (same as web)
- `onAdd(fragment)` callback to parent

Modal content:
- Header: large notation key + title + description + close button
- Forms section (from `doc.forms`)
- Examples section (from `doc.examples`)
- Builder UI (type determined by doc characteristics)

- [ ] **Step 3: Verify typecheck**

Run: `bun run --filter @randsum/dice-ui typecheck`

- [ ] **Step 4: Commit**

```bash
git add packages/dice-ui/src/QuickReferenceGrid.native.tsx packages/dice-ui/src/NumericStepper.native.tsx
git commit -m "feat(dice-ui): add native QuickReferenceGrid with builder UI"
```

---

## Task 9: Update dice-ui package.json for universal resolution

**Files:**
- Modify: `packages/dice-ui/package.json`

- [ ] **Step 1: Add optional peer dependencies and React Native entry**

```json
{
  "peerDependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "peerDependenciesMeta": {
    "react-dom": { "optional": true },
    "react-native": { "optional": true },
    "expo-haptics": { "optional": true }
  }
}
```

Note: No `exports` field changes needed — Metro resolves `.native.tsx` by filename convention, not via package.json exports. The existing bare imports (`@randsum/dice-ui` → `src/index.ts`) work because Metro walks `index.ts` → component files → finds `.native.tsx` variants automatically.

- [ ] **Step 2: Commit**

```bash
git add packages/dice-ui/package.json
git commit -m "chore(dice-ui): add optional RN peer deps for universal support"
```

---

## Task 10: Wire dice-ui into Expo app

**Files:**
- Modify: `apps/expo/package.json`
- Modify: `apps/expo/app/_layout.tsx`
- Modify: `apps/expo/app/(tabs)/_layout.tsx`
- Modify: `apps/expo/app/(tabs)/index.tsx`
- Delete: `apps/expo/components/NotationInput.tsx`
- Delete: `apps/expo/components/NotationReference.tsx`
- Delete: `apps/expo/__tests__/NotationInput.test.ts`

- [ ] **Step 1: Add dice-ui dependency to Expo app**

Add to `apps/expo/package.json` dependencies:
```json
"@randsum/dice-ui": "workspace:~"
```
Run: `bun install`

- [ ] **Step 2: Wire `DiceUIThemeProvider` in root layout**

In `apps/expo/app/_layout.tsx`, wrap the Stack in the provider:
```typescript
import { DiceUIThemeProvider } from '@randsum/dice-ui'
import { useThemeStore } from '../lib/stores/themeStore'

// Inside the component, before return:
const colorScheme = useThemeStore(s => s.colorScheme)

// In the return:
<DiceUIThemeProvider theme={colorScheme}>
  <Stack>...</Stack>
</DiceUIThemeProvider>
```

- [ ] **Step 3: Add header toggle to tab layout**

In `apps/expo/app/(tabs)/_layout.tsx`, add `headerRight` to the Roll tab:

```typescript
import { Pressable, Text } from 'react-native'
import { useRollModeStore } from '../../lib/stores/rollModeStore'

function ModeToggleButton(): React.JSX.Element {
  const { tokens } = useTheme()
  const mode = useRollModeStore(s => s.mode)
  const toggle = useRollModeStore(s => s.toggle)
  const isAdvanced = mode === 'advanced'

  return (
    <Pressable
      onPress={toggle}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: isAdvanced ? tokens.accent : tokens.surfaceAlt,
        borderRadius: 6,
        marginRight: 8
      }}
      accessibilityLabel={isAdvanced ? 'Switch to Simple Mode' : 'Switch to Advanced Mode'}
    >
      <Text style={{
        color: isAdvanced ? '#ffffff' : tokens.text,
        fontFamily: 'JetBrainsMono_400Regular',
        fontSize: 13,
        fontWeight: '700'
      }}>
        {'</>'}
      </Text>
    </Pressable>
  )
}

// In the Tabs.Screen for index:
<Tabs.Screen name="index" options={{
  title: 'Roll',
  headerRight: () => <ModeToggleButton />
}} />
```

- [ ] **Step 4: Create `useRollModeStore`**

Create `apps/expo/lib/stores/rollModeStore.ts`:
```typescript
import { create } from 'zustand'

type RollMode = 'simple' | 'advanced'

interface RollModeState {
  readonly mode: RollMode
  toggle(): void
}

export const useRollModeStore = create<RollModeState>()(set => ({
  mode: 'simple',
  toggle() {
    set(state => ({ mode: state.mode === 'simple' ? 'advanced' : 'simple' }))
  }
}))
```

- [ ] **Step 5: Update Roll tab to use dice-ui components**

Replace `apps/expo/app/(tabs)/index.tsx`:
- Remove `NotationInput` and `NotationReference` imports
- Import `NotationRoller`, `QuickReferenceGrid` from `@randsum/dice-ui`
- Import `useRollModeStore` for mode state
- Remove inline `mode` useState (now in store, accessible from header)
- Advanced Mode renders `<NotationRoller>` + `<QuickReferenceGrid>`
- `NotationRoller.onRoll` callback uses `useRoll().roll()`
- `QuickReferenceGrid.onAdd` appends to notation (pass current notation for `canAddModifier`)

- [ ] **Step 6: Delete replaced Expo components**

```bash
rm apps/expo/components/NotationInput.tsx
rm apps/expo/components/NotationReference.tsx
rm apps/expo/__tests__/NotationInput.test.ts
```

- [ ] **Step 7: Verify Expo typecheck**

Run: `bun run --filter @randsum/expo typecheck`

- [ ] **Step 8: Commit**

```bash
git add apps/expo/ packages/dice-ui/
git commit -m "feat(expo): integrate universal dice-ui — NotationRoller, QuickReferenceGrid, header toggle"
```

---

## Task 11: Write tests for shared logic

**Files:**
- Create: `packages/dice-ui/__tests__/tokenColor.test.ts`
- Create: `packages/dice-ui/__tests__/types.test.ts`

- [ ] **Step 1: Write tokenColor tests**

```typescript
import { describe, expect, test } from 'bun:test'
import { tokenColor } from '../src/tokenColor'

describe('tokenColor', () => {
  test('returns dark color for dark theme', () => {
    expect(tokenColor({ color: '#e06c75', colorLight: '#c94c57' }, 'dark')).toBe('#e06c75')
  })

  test('returns light color for light theme', () => {
    expect(tokenColor({ color: '#e06c75', colorLight: '#c94c57' }, 'light')).toBe('#c94c57')
  })

  test('returns undefined for undefined doc', () => {
    expect(tokenColor(undefined, 'dark')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `cd packages/dice-ui && bun test`
Expected: 3/3 pass

- [ ] **Step 3: Commit**

```bash
git add packages/dice-ui/__tests__/
git commit -m "test(dice-ui): add tests for shared tokenColor helper"
```

---

## Task 12: Final verification

- [ ] **Step 1: Full typecheck across all packages**

Run: `bun run typecheck`
Expected: 0 errors across all packages (roller, games, dice-ui, expo, playground, site)

- [ ] **Step 2: Run all tests**

Run: `bun run test`
Expected: All tests pass (roller, games, expo, dice-ui)

- [ ] **Step 3: Verify playground still works**

Run: `bun run playground:dev`
Verify: QuickReferenceGrid loads and functions, imports from `@randsum/dice-ui`

- [ ] **Step 4: Verify Expo app**

Run: `bun run expo:dev`
Verify:
- Roll tab shows Simple Mode by default
- Header `</>` button toggles to Advanced Mode
- Advanced Mode shows NotationRoller with colored tokens
- QuickReferenceGrid shows all 12 categories
- Tapping a reference item opens modal with builder
- Adding notation via builder appends to input
- ROLL button fires roll and opens result overlay
- Toggling back to Simple preserves pool state

- [ ] **Step 5: Commit any remaining fixes**

- [ ] **Step 6: Push**

```bash
git push origin scram/expo-spike
```
