# @randsum/app — Expo App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first (iOS + Android + Web) dice roller companion app using Expo SDK 54, Expo Router, and Tamagui, powered by `@randsum/roller`.

**Architecture:** Single-screen Expo app. The notation string is the source of truth — visual dice buttons build it, the text input edits it directly. AsyncStorage persists roll history and saved rolls. All state is local.

**Tech Stack:** Expo SDK 54, Expo Router 4, Tamagui 1.x, `@react-native-async-storage/async-storage`, Reanimated 3, `@randsum/roller` (workspace)

---

## Key API Reference

### `@randsum/roller` exports used in this app

```typescript
import { roll, validateNotation } from '@randsum/roller'
import type { RollerRollResult } from '@randsum/roller'

// roll() never throws — check result.error
const result = roll('4d6L+2')
// result.total: number
// result.rolls: RollRecord[] — one per argument group
// result.error: RandsumError | null

// Each RollRecord:
// record.notation: DiceNotation
// record.modifierHistory.initialRolls: number[]  — raw rolls before modifiers
// record.modifierHistory.modifiedRolls: number[] — kept rolls after modifiers
// record.total: number
// record.description: string[]

// validateNotation() — for live validation and description generation
const validation = validateNotation('4d6L')
// validation.valid: boolean
// validation.description: string[][] — per-group description fragments
// validation.error: { message: string } | null
```

### RANDSUM brand colors (from apps/site/src/styles/custom.css)
```
background:      #020617  (slate-950)
backgroundStrong: #0f172a  (slate-900)
backgroundMuted:  #1e293b  (slate-800)
border:           #334155  (slate-700)
textPrimary:      #f8fafc  (slate-50)
textMuted:        #94a3b8  (slate-400)
accent:           #3b82f6  (blue-500)
accentHigh:       #93c5fd  (blue-300)
error:            #ef4444  (red-500)
```

---

## Task 1: Bootstrap the app

**Files:**
- Create: `apps/app/package.json`
- Create: `apps/app/app.json`
- Create: `apps/app/tsconfig.json`
- Create: `apps/app/.gitignore`

**Step 1: Create `apps/app/package.json`**

```json
{
  "name": "@randsum/app",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "build": "expo export",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "dependencies": {
    "@randsum/roller": "workspace:~",
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-font": "~13.0.0",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "^4.12.0",
    "react-native-screens": "~4.4.0",
    "tamagui": "^1.121.0",
    "@tamagui/config": "^1.121.0",
    "@tamagui/core": "^1.121.0",
    "@tamagui/themes": "^1.121.0"
  },
  "devDependencies": {
    "@tamagui/babel-plugin": "^1.121.0",
    "@tamagui/metro-plugin": "^1.121.0",
    "@types/react": "~18.3.0",
    "typescript": "^5.3.0"
  }
}
```

**Step 2: Create `apps/app/app.json`**

```json
{
  "expo": {
    "name": "RANDSUM",
    "slug": "randsum-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "backgroundColor": "#020617"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      ["expo-splash-screen", { "backgroundColor": "#020617" }]
    ],
    "scheme": "randsum"
  }
}
```

**Step 3: Create `apps/app/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 4: Create `apps/app/.gitignore`**

```
node_modules/
.expo/
dist/
web-build/
android/
ios/
*.orig.*
```

**Step 5: Create placeholder assets directory**

```bash
mkdir -p apps/app/assets
```

Expo will use defaults if icon/splash files are missing — add them later.

**Step 6: Install dependencies**

```bash
cd apps/app && bun install
```

Expected: bun resolves workspace, creates `node_modules/`, links `@randsum/roller` from the monorepo.

**Step 7: Commit**

```bash
git add apps/app/
git commit -m "feat(app): scaffold expo app"
```

---

## Task 2: Configure Tamagui

**Files:**
- Create: `apps/app/babel.config.js`
- Create: `apps/app/metro.config.js`
- Create: `apps/app/tamagui.config.ts`

**Step 1: Create `apps/app/babel.config.js`**

Tamagui's babel plugin optimises styles at compile time. Reanimated's plugin **must be last**.

```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
        },
      ],
      'react-native-reanimated/plugin', // must be last
    ],
  }
}
```

**Step 2: Create `apps/app/metro.config.js`**

Metro needs monorepo-aware `watchFolders` and `nodeModulesPaths`, plus Tamagui's plugin.

```javascript
const { getDefaultConfig } = require('expo/metro-config')
const { withTamagui } = require('@tamagui/metro-plugin')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
})
```

**Step 3: Create `apps/app/tamagui.config.ts`**

Uses RANDSUM brand colors. Extends Tamagui's default config with custom dark theme tokens.

```typescript
import { createTamagui } from '@tamagui/core'
import { config as defaultConfig } from '@tamagui/config/v4'

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    dark: {
      ...defaultConfig.themes.dark,
      background: '#020617',
      backgroundHover: '#0f172a',
      backgroundPress: '#1e293b',
      backgroundFocus: '#1e293b',
      backgroundStrong: '#0f172a',
      backgroundMuted: '#1e293b',
      borderColor: '#334155',
      borderColorHover: '#475569',
      color: '#f8fafc',
      colorHover: '#e2e8f0',
      colorMuted: '#94a3b8',
      placeholderColor: '#64748b',
      accent: '#3b82f6',
      accentHigh: '#93c5fd',
    },
  },
  defaultTheme: 'dark',
})

export default config

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
```

**Step 4: Verify Tamagui compiles**

```bash
cd apps/app && bunx expo start --web
```

Expected: Expo opens in browser without errors. Press `ctrl+C` to stop.

**Step 5: Commit**

```bash
git add apps/app/babel.config.js apps/app/metro.config.js apps/app/tamagui.config.ts
git commit -m "feat(app): configure tamagui with randsum brand theme"
```

---

## Task 3: Root layout and navigation shell

**Files:**
- Create: `apps/app/app/_layout.tsx`
- Create: `apps/app/app/index.tsx` (placeholder)

**Step 1: Create `apps/app/app/_layout.tsx`**

```tsx
import { TamaguiProvider } from 'tamagui'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import config from '../tamagui.config'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </TamaguiProvider>
  )
}
```

**Step 2: Create placeholder `apps/app/app/index.tsx`**

```tsx
import { Text, YStack } from 'tamagui'

export default function HomeScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Text color="$color" fontSize="$6" fontWeight="bold" letterSpacing={2}>
        RANDSUM
      </Text>
    </YStack>
  )
}
```

**Step 3: Run on web to verify**

```bash
cd apps/app && bunx expo start --web
```

Expected: Dark screen with centred "RANDSUM" text.

**Step 4: Commit**

```bash
git add apps/app/app/
git commit -m "feat(app): add root layout and navigation shell"
```

---

## Task 4: Types and storage helpers

**Files:**
- Create: `apps/app/src/types.ts`
- Create: `apps/app/src/lib/storage.ts`
- Create: `apps/app/__tests__/lib/storage.test.ts`

**Step 1: Write failing tests**

```typescript
// apps/app/__tests__/lib/storage.test.ts
import { describe, test, expect } from 'bun:test'

// Mock AsyncStorage with an in-memory store
const store: Record<string, string> = {}
import { mock } from 'bun:test'
mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => store[key] ?? null,
    setItem: async (key: string, value: string) => { store[key] = value },
  },
}))

const { loadHistory, saveHistory, loadSavedRolls, saveSavedRolls } =
  await import('../../src/lib/storage')

import type { HistoryEntry, SavedRoll } from '../../src/types'

const sampleEntry: HistoryEntry = {
  id: 'test-1',
  notation: '1d6',
  description: 'Roll 1 6-sided die',
  total: 4,
  groups: [{
    notation: '1d6',
    initialRolls: [4],
    modifiedRolls: [4],
    droppedIndices: [],
    groupTotal: 4,
  }],
  timestamp: 1000,
}

const sampleSaved: SavedRoll = {
  id: 'saved-1',
  name: 'Quick Roll',
  notation: '1d20',
}

describe('storage', () => {
  describe('history', () => {
    test('loadHistory returns [] when empty', async () => {
      expect(await loadHistory()).toEqual([])
    })
    test('saveHistory and loadHistory round-trip', async () => {
      await saveHistory([sampleEntry])
      expect(await loadHistory()).toEqual([sampleEntry])
    })
  })
  describe('savedRolls', () => {
    test('loadSavedRolls returns [] when empty', async () => {
      expect(await loadSavedRolls()).toEqual([])
    })
    test('saveSavedRolls and loadSavedRolls round-trip', async () => {
      await saveSavedRolls([sampleSaved])
      expect(await loadSavedRolls()).toEqual([sampleSaved])
    })
  })
})
```

**Step 2: Run — expect FAIL (modules not found)**

```bash
cd apps/app && bun test __tests__/lib/storage.test.ts
```

**Step 3: Create `apps/app/src/types.ts`**

```typescript
export type RollGroup = {
  notation: string
  initialRolls: number[]
  modifiedRolls: number[]
  droppedIndices: number[]   // indices into initialRolls that were dropped
  groupTotal: number
}

export type HistoryEntry = {
  id: string
  notation: string
  description: string
  total: number
  groups: RollGroup[]
  timestamp: number
}

export type SavedRoll = {
  id: string
  name: string
  notation: string
}
```

**Step 4: Create `apps/app/src/lib/storage.ts`**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { HistoryEntry, SavedRoll } from '../types'

const HISTORY_KEY = 'roll_history'
const SAVED_KEY = 'saved_rolls'

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY)
    return json ? (JSON.parse(json) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export async function saveHistory(history: HistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // silently fail — avoid crashing on storage errors
  }
}

export async function loadSavedRolls(): Promise<SavedRoll[]> {
  try {
    const json = await AsyncStorage.getItem(SAVED_KEY)
    return json ? (JSON.parse(json) as SavedRoll[]) : []
  } catch {
    return []
  }
}

export async function saveSavedRolls(rolls: SavedRoll[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(rolls))
  } catch {
    // silently fail
  }
}
```

**Step 5: Run — expect PASS**

```bash
cd apps/app && bun test __tests__/lib/storage.test.ts
```

Expected: 4 tests pass.

**Step 6: Commit**

```bash
git add apps/app/src/ apps/app/__tests__/
git commit -m "feat(app): add types and storage helpers"
```

---

## Task 5: describeNotation

**Files:**
- Create: `apps/app/src/lib/describeNotation.ts`
- Create: `apps/app/__tests__/lib/describeNotation.test.ts`

`validateNotation(str).description` is `string[][]` — one `string[]` per roll group, each inner string being one description fragment (e.g. `["Roll 4 6-sided dice", "Drop lowest", "Add 2"]`). We join them into a single readable sentence.

**Step 1: Write failing tests**

```typescript
// apps/app/__tests__/lib/describeNotation.test.ts
import { describe, test, expect } from 'bun:test'
import { describeNotation } from '../../src/lib/describeNotation'

describe('describeNotation', () => {
  test('returns empty string for empty input', () => {
    expect(describeNotation('')).toBe('')
  })
  test('returns raw notation for invalid input', () => {
    expect(describeNotation('invalid')).toBe('invalid')
  })
  test('describes a basic die', () => {
    const result = describeNotation('1d6')
    expect(result).toContain('Roll 1')
    expect(result).toContain('6')
  })
  test('describes drop-lowest modifier', () => {
    const result = describeNotation('4d6L')
    expect(result).toContain('Roll 4')
    expect(result).toContain('Drop lowest')
  })
  test('describes arithmetic modifier', () => {
    const result = describeNotation('1d20+5')
    expect(result).toContain('Roll 1')
    expect(result).toContain('Add 5')
  })
  test('describes multiple groups', () => {
    const result = describeNotation('1d20+1d6')
    expect(result).toContain('Roll 1')
  })
})
```

**Step 2: Run — expect FAIL**

```bash
cd apps/app && bun test __tests__/lib/describeNotation.test.ts
```

**Step 3: Create `apps/app/src/lib/describeNotation.ts`**

```typescript
import { validateNotation } from '@randsum/roller'

export function describeNotation(notation: string): string {
  if (!notation) return ''
  const result = validateNotation(notation)
  if (!result.valid) return notation
  return result.description
    .map(group => group.filter(Boolean).join(', '))
    .join('; ')
}
```

**Step 4: Run — expect PASS**

```bash
cd apps/app && bun test __tests__/lib/describeNotation.test.ts
```

If descriptions from `validateNotation` differ from expected strings, adjust assertions to match actual output — the important thing is that valid notations produce non-empty descriptions and invalid ones return the raw string.

**Step 5: Commit**

```bash
git add apps/app/src/lib/describeNotation.ts apps/app/__tests__/lib/describeNotation.test.ts
git commit -m "feat(app): add describeNotation helper"
```

---

## Task 6: buildHistoryEntry

**Files:**
- Create: `apps/app/src/lib/buildHistoryEntry.ts`
- Create: `apps/app/__tests__/lib/buildHistoryEntry.test.ts`

**Step 1: Write failing tests**

```typescript
// apps/app/__tests__/lib/buildHistoryEntry.test.ts
import { describe, test, expect } from 'bun:test'
import { roll } from '@randsum/roller'
import { buildHistoryEntry, getDroppedIndices } from '../../src/lib/buildHistoryEntry'

describe('getDroppedIndices', () => {
  test('returns empty array when no dice dropped', () => {
    expect(getDroppedIndices([4, 5, 6], [4, 5, 6])).toEqual([])
  })
  test('finds a single dropped die by position', () => {
    // [2, 5, 6] → keep [5, 6] → index 0 was dropped
    expect(getDroppedIndices([2, 5, 6], [5, 6])).toEqual([0])
  })
  test('handles duplicate values', () => {
    // drop one 3 at index 0, keep the other
    expect(getDroppedIndices([3, 3, 6], [3, 6])).toEqual([0])
  })
})

describe('buildHistoryEntry', () => {
  test('builds a valid HistoryEntry from a roll result', () => {
    const result = roll('1d6')
    if (result.error) throw new Error('unexpected error')
    const entry = buildHistoryEntry('1d6', result)
    expect(entry.notation).toBe('1d6')
    expect(typeof entry.total).toBe('number')
    expect(typeof entry.id).toBe('string')
    expect(typeof entry.timestamp).toBe('number')
    expect(entry.groups).toHaveLength(1)
    expect(entry.groups[0]!.initialRolls).toHaveLength(1)
  })
  test('marks dropped dice correctly for 4d6L', () => {
    const result = roll('4d6L')
    if (result.error) throw new Error('unexpected error')
    const entry = buildHistoryEntry('4d6L', result)
    const group = entry.groups[0]!
    expect(group.initialRolls).toHaveLength(4)
    expect(group.modifiedRolls).toHaveLength(3)
    expect(group.droppedIndices).toHaveLength(1)
  })
})
```

**Step 2: Run — expect FAIL**

```bash
cd apps/app && bun test __tests__/lib/buildHistoryEntry.test.ts
```

**Step 3: Create `apps/app/src/lib/buildHistoryEntry.ts`**

```typescript
import type { RollerRollResult } from '@randsum/roller'
import type { HistoryEntry, RollGroup } from '../types'
import { describeNotation } from './describeNotation'

export function getDroppedIndices(
  initialRolls: number[],
  modifiedRolls: number[]
): number[] {
  const remaining = [...modifiedRolls]
  const dropped: number[] = []
  for (let i = 0; i < initialRolls.length; i++) {
    const val = initialRolls[i]!
    const pos = remaining.indexOf(val)
    if (pos === -1) {
      dropped.push(i)
    } else {
      remaining.splice(pos, 1)
    }
  }
  return dropped
}

export function buildHistoryEntry(
  notation: string,
  result: RollerRollResult
): HistoryEntry {
  const groups: RollGroup[] = result.rolls.map(record => {
    const initialRolls = record.modifierHistory.initialRolls
    const modifiedRolls = record.modifierHistory.modifiedRolls
    return {
      notation: record.notation,
      initialRolls,
      modifiedRolls,
      droppedIndices: getDroppedIndices(initialRolls, modifiedRolls),
      groupTotal: record.total,
    }
  })
  return {
    id: crypto.randomUUID(),
    notation,
    description: describeNotation(notation),
    total: result.total,
    groups,
    timestamp: Date.now(),
  }
}
```

**Step 4: Run — expect PASS**

```bash
cd apps/app && bun test __tests__/lib/buildHistoryEntry.test.ts
```

**Step 5: Commit**

```bash
git add apps/app/src/lib/buildHistoryEntry.ts apps/app/__tests__/lib/buildHistoryEntry.test.ts
git commit -m "feat(app): add buildHistoryEntry with dropped-dice tracking"
```

---

## Task 7: Notation builder helpers

**Files:**
- Create: `apps/app/src/lib/notationBuilder.ts`
- Create: `apps/app/__tests__/lib/notationBuilder.test.ts`

**Step 1: Write failing tests**

```typescript
// apps/app/__tests__/lib/notationBuilder.test.ts
import { describe, test, expect } from 'bun:test'
import { appendDie, toggleSimpleModifier, appendValueModifier } from '../../src/lib/notationBuilder'

describe('appendDie', () => {
  test('creates notation from empty string', () => {
    expect(appendDie('', 6)).toBe('1d6')
  })
  test('increments quantity when same die type is at end', () => {
    expect(appendDie('1d6', 6)).toBe('2d6')
    expect(appendDie('2d6', 6)).toBe('3d6')
  })
  test('appends new group when die type differs', () => {
    expect(appendDie('1d6', 20)).toBe('1d6+1d20')
  })
  test('preserves modifiers when incrementing same die', () => {
    expect(appendDie('1d6L', 6)).toBe('2d6L')
  })
  test('increments last group in compound notation', () => {
    expect(appendDie('1d20+1d6', 6)).toBe('1d20+2d6')
  })
})

describe('toggleSimpleModifier', () => {
  test('appends modifier when absent', () => {
    expect(toggleSimpleModifier('2d6', 'L')).toBe('2d6L')
  })
  test('removes modifier when present at end', () => {
    expect(toggleSimpleModifier('2d6L', 'L')).toBe('2d6')
  })
  test('handles H modifier', () => {
    expect(toggleSimpleModifier('4d6', 'H')).toBe('4d6H')
    expect(toggleSimpleModifier('4d6H', 'H')).toBe('4d6')
  })
  test('handles explode modifier', () => {
    expect(toggleSimpleModifier('1d6', '!')).toBe('1d6!')
    expect(toggleSimpleModifier('1d6!', '!')).toBe('1d6')
  })
  test('returns notation unchanged when empty', () => {
    expect(toggleSimpleModifier('', 'L')).toBe('')
  })
})

describe('appendValueModifier', () => {
  test('appends arithmetic suffix', () => {
    expect(appendValueModifier('1d20', '+5')).toBe('1d20+5')
    expect(appendValueModifier('1d20', '-2')).toBe('1d20-2')
  })
})
```

**Step 2: Run — expect FAIL**

```bash
cd apps/app && bun test __tests__/lib/notationBuilder.test.ts
```

**Step 3: Create `apps/app/src/lib/notationBuilder.ts`**

```typescript
/**
 * If notation ends with NdX (same sides), increment N.
 * Otherwise append +1dX.
 */
export function appendDie(notation: string, sides: number): string {
  if (!notation) return `1d${sides}`
  // Match the last die group: digits + dX + optional modifier chars
  const pattern = new RegExp(`(\\d+)(d${sides})([A-Za-z!]*)$`)
  const match = notation.match(pattern)
  if (match) {
    const qty = parseInt(match[1]!, 10)
    const die = match[2]!
    const mods = match[3]!
    return `${notation.slice(0, notation.length - match[0].length)}${qty + 1}${die}${mods}`
  }
  return `${notation}+1d${sides}`
}

/**
 * Toggle a single-character modifier suffix on the notation.
 */
export function toggleSimpleModifier(notation: string, modifier: string): string {
  if (!notation) return notation
  if (notation.endsWith(modifier)) return notation.slice(0, -modifier.length)
  if (notation.includes(modifier)) return notation.replace(modifier, '')
  return `${notation}${modifier}`
}

/**
 * Append a value modifier suffix (e.g. "+5", "-2").
 */
export function appendValueModifier(notation: string, suffix: string): string {
  return `${notation}${suffix}`
}
```

**Step 4: Run — expect PASS**

```bash
cd apps/app && bun test __tests__/lib/notationBuilder.test.ts
```

**Step 5: Run all tests**

```bash
cd apps/app && bun test
```

Expected: all tests across tasks 4–7 pass.

**Step 6: Commit**

```bash
git add apps/app/src/lib/notationBuilder.ts apps/app/__tests__/lib/notationBuilder.test.ts
git commit -m "feat(app): add notation builder helpers"
```

---

## Task 8: React hooks

**Files:**
- Create: `apps/app/src/hooks/useNotation.ts`
- Create: `apps/app/src/hooks/useHistory.ts`
- Create: `apps/app/src/hooks/useSavedRolls.ts`

No unit tests — these depend on React state and AsyncStorage side effects; correctness is verified at the screen level in Task 14.

**Step 1: Create `apps/app/src/hooks/useNotation.ts`**

```typescript
import { useState, useCallback, useMemo } from 'react'
import { validateNotation } from '@randsum/roller'
import { describeNotation } from '../lib/describeNotation'
import { appendDie, toggleSimpleModifier, appendValueModifier } from '../lib/notationBuilder'

export type NotationState = {
  readonly raw: string
  readonly description: string
  readonly isValid: boolean
  readonly error?: string
}

export function useNotation() {
  const [raw, setRaw] = useState('')

  const state = useMemo<NotationState>(() => {
    if (!raw) return { raw: '', description: '', isValid: false }
    const result = validateNotation(raw)
    if (result.valid) {
      return { raw, description: describeNotation(raw), isValid: true }
    }
    return { raw, description: '', isValid: false, error: result.error.message }
  }, [raw])

  return {
    notation: state,
    setNotation: setRaw,
    addDie: useCallback((sides: number) => setRaw(prev => appendDie(prev, sides)), []),
    toggleModifier: useCallback((mod: string) => setRaw(prev => toggleSimpleModifier(prev, mod)), []),
    appendModifier: useCallback((suffix: string) => setRaw(prev => appendValueModifier(prev, suffix)), []),
    clear: useCallback(() => setRaw(''), []),
  }
}
```

**Step 2: Create `apps/app/src/hooks/useHistory.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import type { HistoryEntry } from '../types'
import { loadHistory, saveHistory } from '../lib/storage'

const MAX_HISTORY = 100

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => { loadHistory().then(setHistory) }, [])

  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY)
      void saveHistory(updated)
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    void saveHistory([])
  }, [])

  return { history, addEntry, clearHistory }
}
```

**Step 3: Create `apps/app/src/hooks/useSavedRolls.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import type { SavedRoll } from '../types'
import { loadSavedRolls, saveSavedRolls } from '../lib/storage'

export function useSavedRolls() {
  const [savedRolls, setSavedRolls] = useState<SavedRoll[]>([])

  useEffect(() => { loadSavedRolls().then(setSavedRolls) }, [])

  const addSavedRoll = useCallback((name: string, notation: string) => {
    const entry: SavedRoll = { id: crypto.randomUUID(), name, notation }
    setSavedRolls(prev => {
      const updated = [...prev, entry]
      void saveSavedRolls(updated)
      return updated
    })
  }, [])

  const removeSavedRoll = useCallback((id: string) => {
    setSavedRolls(prev => {
      const updated = prev.filter(r => r.id !== id)
      void saveSavedRolls(updated)
      return updated
    })
  }, [])

  return { savedRolls, addSavedRoll, removeSavedRoll }
}
```

**Step 4: Commit**

```bash
git add apps/app/src/hooks/
git commit -m "feat(app): add useNotation, useHistory, useSavedRolls hooks"
```

---

## Task 9: NotationInput and DiceButtons

**Files:**
- Create: `apps/app/src/components/NotationInput.tsx`
- Create: `apps/app/src/components/DiceButtons.tsx`

**Step 1: Create `apps/app/src/components/NotationInput.tsx`**

```tsx
import { Input, XStack, YStack, Text, Button } from 'tamagui'
import type { NotationState } from '../hooks/useNotation'

type Props = {
  notation: NotationState
  onChange: (value: string) => void
  onClear: () => void
}

export function NotationInput({ notation, onChange, onClear }: Props) {
  const borderColor = !notation.raw
    ? '$borderColor'
    : notation.isValid
    ? '$green8'
    : '$red8'

  return (
    <YStack gap="$2">
      <XStack gap="$2" alignItems="center">
        <Input
          flex={1}
          value={notation.raw}
          onChangeText={onChange}
          placeholder="4d6L+2"
          placeholderTextColor="$placeholderColor"
          color="$color"
          backgroundColor="$backgroundStrong"
          borderColor={borderColor}
          borderWidth={1}
          borderRadius="$3"
          paddingHorizontal="$3"
          fontFamily="$mono"
          fontSize="$5"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {notation.raw ? (
          <Button
            size="$3"
            circular
            backgroundColor="$backgroundMuted"
            onPress={onClear}
          >
            <Text color="$colorMuted">✕</Text>
          </Button>
        ) : null}
      </XStack>
      {notation.description ? (
        <Text color="$colorMuted" fontSize="$3" paddingHorizontal="$1">
          {notation.description}
        </Text>
      ) : null}
      {notation.error ? (
        <Text color="$red8" fontSize="$3" paddingHorizontal="$1">
          {notation.error}
        </Text>
      ) : null}
    </YStack>
  )
}
```

**Step 2: Create `apps/app/src/components/DiceButtons.tsx`**

```tsx
import { XStack, Button, Text } from 'tamagui'

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const

type Props = {
  onAddDie: (sides: number) => void
}

export function DiceButtons({ onAddDie }: Props) {
  return (
    <XStack flexWrap="wrap" gap="$2" justifyContent="center">
      {DICE_TYPES.map(sides => (
        <Button
          key={sides}
          size="$3"
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$3"
          onPress={() => onAddDie(sides)}
          pressStyle={{ backgroundColor: '$backgroundMuted' }}
        >
          <Text color="$color" fontFamily="$mono" fontSize="$3">
            d{sides}
          </Text>
        </Button>
      ))}
    </XStack>
  )
}
```

**Step 3: Verify no TypeScript errors**

```bash
cd apps/app && bun run typecheck
```

**Step 4: Commit**

```bash
git add apps/app/src/components/NotationInput.tsx apps/app/src/components/DiceButtons.tsx
git commit -m "feat(app): add NotationInput and DiceButtons components"
```

---

## Task 10: ModifierButtons

**Files:**
- Create: `apps/app/src/components/ValuePickerDialog.tsx`
- Create: `apps/app/src/components/ModifierButtons.tsx`

**Step 1: Create `apps/app/src/components/ValuePickerDialog.tsx`**

Reusable sheet for collecting a numeric value from the user.

```tsx
import { useState } from 'react'
import { Sheet, YStack, XStack, Text, Input, Button } from 'tamagui'

type Props = {
  open: boolean
  title: string
  onConfirm: (value: number) => void
  onClose: () => void
}

export function ValuePickerDialog({ open, title, onConfirm, onClose }: Props) {
  const [input, setInput] = useState('')

  const handleConfirm = () => {
    const num = parseInt(input, 10)
    if (!isNaN(num) && num > 0) {
      onConfirm(num)
      setInput('')
      onClose()
    }
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()} snapPoints={[30]}>
      <Sheet.Overlay />
      <Sheet.Frame backgroundColor="$backgroundStrong" padding="$4">
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold" color="$color">{title}</Text>
          <Input
            keyboardType="number-pad"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleConfirm}
            placeholder="Enter a number"
            placeholderTextColor="$placeholderColor"
            color="$color"
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$3"
            paddingHorizontal="$3"
            autoFocus
          />
          <XStack gap="$2" justifyContent="flex-end">
            <Button size="$3" onPress={onClose} backgroundColor="$backgroundMuted">
              <Text color="$colorMuted">Cancel</Text>
            </Button>
            <Button size="$3" onPress={handleConfirm} backgroundColor="$accent">
              <Text color="white">Confirm</Text>
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
```

**Step 2: Create `apps/app/src/components/ModifierButtons.tsx`**

Simple toggles (L, H, !, U) + parameterised Add/Subtract.

```tsx
import { useState } from 'react'
import { XStack, YStack, Button, Text } from 'tamagui'
import { ValuePickerDialog } from './ValuePickerDialog'

const SIMPLE_MODIFIERS = [
  { label: 'Drop Lowest', char: 'L' },
  { label: 'Drop Highest', char: 'H' },
  { label: 'Explode', char: '!' },
  { label: 'Unique', char: 'U' },
] as const

type Props = {
  notation: string
  onToggleModifier: (char: string) => void
  onAppendModifier: (suffix: string) => void
}

type PickerState = { open: boolean; type: 'add' | 'subtract' }

export function ModifierButtons({ notation, onToggleModifier, onAppendModifier }: Props) {
  const [picker, setPicker] = useState<PickerState>({ open: false, type: 'add' })

  const handleConfirm = (value: number) => {
    onAppendModifier(picker.type === 'add' ? `+${value}` : `-${value}`)
  }

  return (
    <YStack gap="$2">
      <XStack flexWrap="wrap" gap="$2" justifyContent="center">
        {SIMPLE_MODIFIERS.map(({ label, char }) => {
          const active = notation.includes(char)
          return (
            <Button
              key={char}
              size="$3"
              backgroundColor={active ? '$accent' : '$backgroundStrong'}
              borderColor={active ? '$accent' : '$borderColor'}
              borderWidth={1}
              borderRadius="$3"
              onPress={() => onToggleModifier(char)}
            >
              <Text color={active ? 'white' : '$colorMuted'} fontSize="$2">
                {label}
              </Text>
            </Button>
          )
        })}
      </XStack>
      <XStack gap="$2" justifyContent="center">
        <Button
          size="$3"
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$3"
          onPress={() => setPicker({ open: true, type: 'add' })}
        >
          <Text color="$colorMuted" fontSize="$2">Add…</Text>
        </Button>
        <Button
          size="$3"
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$3"
          onPress={() => setPicker({ open: true, type: 'subtract' })}
        >
          <Text color="$colorMuted" fontSize="$2">Subtract…</Text>
        </Button>
      </XStack>
      <ValuePickerDialog
        open={picker.open}
        title={picker.type === 'add' ? 'Add a value' : 'Subtract a value'}
        onConfirm={handleConfirm}
        onClose={() => setPicker(prev => ({ ...prev, open: false }))}
      />
    </YStack>
  )
}
```

**Step 3: Commit**

```bash
git add apps/app/src/components/ValuePickerDialog.tsx apps/app/src/components/ModifierButtons.tsx
git commit -m "feat(app): add ModifierButtons with named toggles and value pickers"
```

---

## Task 11: ResultSheet

**Files:**
- Create: `apps/app/src/components/NamePromptDialog.tsx`
- Create: `apps/app/src/components/ResultSheet.tsx`

**Step 1: Create `apps/app/src/components/NamePromptDialog.tsx`**

```tsx
import { useState } from 'react'
import { Sheet, YStack, XStack, Text, Input, Button } from 'tamagui'

type Props = {
  open: boolean
  onConfirm: (name: string) => void
  onClose: () => void
}

export function NamePromptDialog({ open, onConfirm, onClose }: Props) {
  const [name, setName] = useState('')

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim())
      setName('')
      onClose()
    }
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()} snapPoints={[30]}>
      <Sheet.Overlay />
      <Sheet.Frame backgroundColor="$backgroundStrong" padding="$4">
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold" color="$color">Name this roll</Text>
          <Input
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleConfirm}
            placeholder="e.g. Attack Roll"
            placeholderTextColor="$placeholderColor"
            color="$color"
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$3"
            paddingHorizontal="$3"
            autoFocus
          />
          <XStack gap="$2" justifyContent="flex-end">
            <Button size="$3" onPress={onClose} backgroundColor="$backgroundMuted">
              <Text color="$colorMuted">Cancel</Text>
            </Button>
            <Button
              size="$3"
              onPress={handleConfirm}
              backgroundColor="$accent"
              disabled={!name.trim()}
              opacity={name.trim() ? 1 : 0.4}
            >
              <Text color="white">Save</Text>
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
```

**Step 2: Create `apps/app/src/components/ResultSheet.tsx`**

```tsx
import { useState } from 'react'
import { Sheet, YStack, XStack, Text, Button } from 'tamagui'
import type { HistoryEntry } from '../types'
import { NamePromptDialog } from './NamePromptDialog'

type Props = {
  entry: HistoryEntry | null
  open: boolean
  onClose: () => void
  onRollAgain: (notation: string) => void
  onSaveRoll: (name: string, notation: string) => void
}

function DiceBreakdown({ entry }: { entry: HistoryEntry }) {
  return (
    <YStack gap="$3">
      {entry.groups.map((group, gi) => (
        <YStack key={gi} gap="$1">
          <Text color="$colorMuted" fontSize="$2" fontFamily="$mono">
            {group.notation}
          </Text>
          <XStack flexWrap="wrap" gap="$3" alignItems="center">
            {group.initialRolls.map((val, i) => {
              const dropped = group.droppedIndices.includes(i)
              return (
                <Text
                  key={i}
                  fontSize="$5"
                  fontFamily="$mono"
                  color={dropped ? '$colorMuted' : '$color'}
                  textDecorationLine={dropped ? 'line-through' : 'none'}
                >
                  {val}
                </Text>
              )
            })}
          </XStack>
        </YStack>
      ))}
    </YStack>
  )
}

export function ResultSheet({ entry, open, onClose, onRollAgain, onSaveRoll }: Props) {
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  if (!entry) return null

  return (
    <>
      <Sheet open={open} onOpenChange={o => !o && onClose()} snapPoints={[60]}>
        <Sheet.Overlay />
        <Sheet.Frame backgroundColor="$backgroundStrong" padding="$4">
          <YStack gap="$4" flex={1}>
            <YStack gap="$1">
              <Text fontFamily="$mono" fontSize="$4" color="$color">{entry.notation}</Text>
              <Text fontSize="$2" color="$colorMuted">{entry.description}</Text>
            </YStack>

            <Text
              fontSize={72}
              fontWeight="bold"
              color="$accent"
              textAlign="center"
              fontFamily="$mono"
            >
              {entry.total}
            </Text>

            <DiceBreakdown entry={entry} />

            <XStack gap="$3" justifyContent="center" marginTop="auto">
              <Button
                size="$4"
                flex={1}
                backgroundColor="$backgroundMuted"
                borderColor="$borderColor"
                borderWidth={1}
                onPress={() => onRollAgain(entry.notation)}
              >
                <Text color="$color">Roll Again</Text>
              </Button>
              <Button
                size="$4"
                flex={1}
                backgroundColor="$accent"
                onPress={() => setShowNamePrompt(true)}
              >
                <Text color="white">Save Roll</Text>
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <NamePromptDialog
        open={showNamePrompt}
        onConfirm={name => onSaveRoll(name, entry.notation)}
        onClose={() => setShowNamePrompt(false)}
      />
    </>
  )
}
```

**Step 3: Commit**

```bash
git add apps/app/src/components/ResultSheet.tsx apps/app/src/components/NamePromptDialog.tsx
git commit -m "feat(app): add ResultSheet with dice breakdown and save-roll flow"
```

---

## Task 12: HistoryLog

**Files:**
- Create: `apps/app/src/components/HistoryLog.tsx`

```tsx
import { YStack, XStack, Text, ScrollView } from 'tamagui'
import { Pressable } from 'react-native'
import type { HistoryEntry } from '../types'

type Props = {
  history: HistoryEntry[]
  onSelectEntry: (entry: HistoryEntry) => void
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function HistoryLog({ history, onSelectEntry }: Props) {
  if (history.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" opacity={0.4}>
        <Text color="$colorMuted" fontSize="$3">No rolls yet</Text>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1}>
      <YStack>
        {history.map(entry => (
          <Pressable key={entry.id} onPress={() => onSelectEntry(entry)}>
            <XStack
              paddingVertical="$2"
              paddingHorizontal="$3"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
              alignItems="center"
              gap="$3"
            >
              <Text fontFamily="$mono" fontSize="$3" color="$colorMuted" flex={1} numberOfLines={1}>
                {entry.notation}
              </Text>
              <Text fontSize="$5" fontWeight="bold" color="$accent" fontFamily="$mono">
                {entry.total}
              </Text>
              <Text fontSize="$2" color="$colorMuted" minWidth={60} textAlign="right">
                {relativeTime(entry.timestamp)}
              </Text>
              <Text color="$colorMuted" fontSize="$3">↗</Text>
            </XStack>
          </Pressable>
        ))}
      </YStack>
    </ScrollView>
  )
}
```

**Step 2: Commit**

```bash
git add apps/app/src/components/HistoryLog.tsx
git commit -m "feat(app): add HistoryLog component"
```

---

## Task 13: SavedRollsSheet

**Files:**
- Create: `apps/app/src/components/SavedRollsSheet.tsx`

```tsx
import { Sheet, YStack, XStack, Text, Button, ScrollView } from 'tamagui'
import { Pressable } from 'react-native'
import type { SavedRoll } from '../types'

type Props = {
  open: boolean
  savedRolls: SavedRoll[]
  currentNotation: string
  isCurrentValid: boolean
  onLoad: (notation: string) => void
  onDelete: (id: string) => void
  onSaveCurrent: () => void
  onClose: () => void
}

export function SavedRollsSheet({
  open, savedRolls, currentNotation, isCurrentValid,
  onLoad, onDelete, onSaveCurrent, onClose,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()} snapPoints={[60]}>
      <Sheet.Overlay />
      <Sheet.Frame backgroundColor="$backgroundStrong" padding="$4">
        <YStack gap="$4" flex={1}>
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="bold" color="$color">Saved Rolls</Text>
            <Button
              size="$3"
              backgroundColor="$accent"
              disabled={!isCurrentValid}
              opacity={isCurrentValid ? 1 : 0.4}
              onPress={onSaveCurrent}
            >
              <Text color="white" fontSize="$2">+ Save Current</Text>
            </Button>
          </XStack>

          {savedRolls.length === 0 ? (
            <YStack flex={1} alignItems="center" justifyContent="center" opacity={0.4}>
              <Text color="$colorMuted">No saved rolls yet</Text>
            </YStack>
          ) : (
            <ScrollView flex={1}>
              <YStack>
                {savedRolls.map(roll => (
                  <XStack
                    key={roll.id}
                    paddingVertical="$3"
                    paddingHorizontal="$2"
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                    alignItems="center"
                    gap="$2"
                  >
                    <Pressable style={{ flex: 1 }} onPress={() => { onLoad(roll.notation); onClose() }}>
                      <Text fontSize="$4" color="$color">{roll.name}</Text>
                      <Text fontSize="$2" color="$colorMuted" fontFamily="$mono">{roll.notation}</Text>
                    </Pressable>
                    <Button
                      size="$2"
                      backgroundColor="transparent"
                      onPress={() => onDelete(roll.id)}
                    >
                      <Text color="$red8" fontSize="$2">Delete</Text>
                    </Button>
                  </XStack>
                ))}
              </YStack>
            </ScrollView>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
```

**Step 2: Commit**

```bash
git add apps/app/src/components/SavedRollsSheet.tsx
git commit -m "feat(app): add SavedRollsSheet component"
```

---

## Task 14: Wire up index.tsx

**Files:**
- Modify: `apps/app/app/index.tsx`

Replace the placeholder with the full screen wiring.

```tsx
import { useState, useCallback } from 'react'
import { YStack, XStack, Text, Button } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { roll } from '@randsum/roller'
import { useNotation } from '../src/hooks/useNotation'
import { useHistory } from '../src/hooks/useHistory'
import { useSavedRolls } from '../src/hooks/useSavedRolls'
import { buildHistoryEntry } from '../src/lib/buildHistoryEntry'
import { NotationInput } from '../src/components/NotationInput'
import { DiceButtons } from '../src/components/DiceButtons'
import { ModifierButtons } from '../src/components/ModifierButtons'
import { ResultSheet } from '../src/components/ResultSheet'
import { HistoryLog } from '../src/components/HistoryLog'
import { SavedRollsSheet } from '../src/components/SavedRollsSheet'
import { NamePromptDialog } from '../src/components/NamePromptDialog'
import type { HistoryEntry } from '../src/types'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { notation, setNotation, addDie, toggleModifier, appendModifier, clear } = useNotation()
  const { history, addEntry } = useHistory()
  const { savedRolls, addSavedRoll, removeSavedRoll } = useSavedRolls()
  const [resultEntry, setResultEntry] = useState<HistoryEntry | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  const handleRoll = useCallback(() => {
    const result = roll(notation.raw)
    if (result.error) return
    const entry = buildHistoryEntry(notation.raw, result)
    addEntry(entry)
    setResultEntry(entry)
    setResultOpen(true)
  }, [notation.raw, addEntry])

  const handleRollAgain = useCallback((notationStr: string) => {
    const result = roll(notationStr)
    if (result.error) return
    const entry = buildHistoryEntry(notationStr, result)
    addEntry(entry)
    setResultEntry(entry)
  }, [addEntry])

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top} paddingBottom={insets.bottom}>

      {/* Header */}
      <XStack
        paddingHorizontal="$4" paddingVertical="$3"
        justifyContent="space-between" alignItems="center"
        borderBottomWidth={1} borderBottomColor="$borderColor"
      >
        <Text fontSize="$6" fontWeight="bold" color="$color" letterSpacing={2}>RANDSUM</Text>
        <Button
          size="$3" backgroundColor="$backgroundStrong"
          borderColor="$borderColor" borderWidth={1}
          onPress={() => setSavedOpen(true)}
        >
          <Text color="$colorMuted" fontSize="$3">Saved</Text>
        </Button>
      </XStack>

      {/* Zone 1: Notation builder */}
      <YStack gap="$4" padding="$4">
        <NotationInput notation={notation} onChange={setNotation} onClear={clear} />
        <DiceButtons onAddDie={addDie} />
        <ModifierButtons
          notation={notation.raw}
          onToggleModifier={toggleModifier}
          onAppendModifier={appendModifier}
        />
        <Button
          size="$5"
          backgroundColor={notation.isValid ? '$accent' : '$backgroundMuted'}
          disabled={!notation.isValid}
          opacity={notation.isValid ? 1 : 0.5}
          onPress={handleRoll}
          borderRadius="$4"
        >
          <Text
            color={notation.isValid ? 'white' : '$colorMuted'}
            fontSize="$5" fontWeight="bold" letterSpacing={2}
          >
            ROLL
          </Text>
        </Button>
      </YStack>

      {/* Zone 2: History */}
      <YStack flex={1} borderTopWidth={1} borderTopColor="$borderColor">
        <Text
          paddingHorizontal="$4" paddingVertical="$2"
          fontSize="$2" color="$colorMuted" letterSpacing={1}
        >
          HISTORY
        </Text>
        <HistoryLog
          history={history}
          onSelectEntry={entry => { setResultEntry(entry); setResultOpen(true) }}
        />
      </YStack>

      {/* Sheets and dialogs */}
      <ResultSheet
        entry={resultEntry}
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        onRollAgain={handleRollAgain}
        onSaveRoll={addSavedRoll}
      />
      <SavedRollsSheet
        open={savedOpen}
        savedRolls={savedRolls}
        currentNotation={notation.raw}
        isCurrentValid={notation.isValid}
        onLoad={setNotation}
        onDelete={removeSavedRoll}
        onSaveCurrent={() => setShowNamePrompt(true)}
        onClose={() => setSavedOpen(false)}
      />
      <NamePromptDialog
        open={showNamePrompt}
        onConfirm={name => addSavedRoll(name, notation.raw)}
        onClose={() => setShowNamePrompt(false)}
      />
    </YStack>
  )
}
```

**Step 2: Run on web and verify the full UI**

```bash
cd apps/app && bunx expo start --web
```

Expected: full RANDSUM app loads. Type notation → description appears. Tap dice buttons → notation updates. Tap ROLL → result sheet appears with total and dice breakdown. History log populates. Saved Rolls sheet accessible from header.

**Step 3: Run TypeScript check**

```bash
cd apps/app && bun run typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add apps/app/app/index.tsx
git commit -m "feat(app): wire up main screen — full roller UI"
```

---

## Task 15: EAS configuration and monorepo integration

**Files:**
- Create: `apps/app/eas.json`
- Create: `apps/app/CLAUDE.md`
- Modify: root `package.json` (add app scripts)

**Step 1: Create `apps/app/eas.json`**

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

**Step 2: Create `apps/app/CLAUDE.md`**

```markdown
# @randsum/app — Expo Mobile + Web App

## Overview

Managed Expo app (iOS, Android, Web). Single-screen dice roller powered by `@randsum/roller`.

## Commands

```bash
bunx expo start          # Start dev server
bunx expo start --web    # Web only
bun test                 # Unit tests (bun:test)
bun run typecheck        # TypeScript check
```

## Architecture

- `app/` — Expo Router file-based routes
- `src/components/` — Tamagui UI components
- `src/hooks/` — State hooks (useNotation, useHistory, useSavedRolls)
- `src/lib/` — Pure functions: describeNotation, buildHistoryEntry, notationBuilder, storage
- `src/types.ts` — HistoryEntry, RollGroup, SavedRoll

## Storage (AsyncStorage)

- `roll_history` → `HistoryEntry[]` (max 100, newest first)
- `saved_rolls` → `SavedRoll[]`
```

**Step 3: Add app scripts to root `package.json`**

In the root `package.json` scripts section, add:

```json
"app:start": "cd apps/app && bunx expo start",
"app:web": "cd apps/app && bunx expo start --web",
"app:ios": "cd apps/app && bunx expo start --ios",
"app:android": "cd apps/app && bunx expo start --android"
```

**Step 4: Commit**

```bash
git add apps/app/eas.json apps/app/CLAUDE.md
git add package.json
git commit -m "feat(app): add EAS config, CLAUDE.md, and root scripts"
```

---

## Done

All tasks committed. The app is runnable on web (`bun run app:web`) and ready for iOS/Android via Expo Go or EAS Build.

**Remaining work (post-MVP, not in this plan):**
- App icon and splash screen assets
- EAS project ID (run `bunx eas init` once)
- Reroll/Cap modifier pickers (complex notation like `R{<3}`, `C{>6}`)
- Keyboard shortcuts on web
- Haptic feedback on roll (mobile)
