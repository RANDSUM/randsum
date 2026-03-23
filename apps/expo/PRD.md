# RANDSUM Dice Roller — Product Requirements Document

**App Name:** RANDSUM
**Platforms:** iOS, Android, Web — single codebase via Expo
**Web URL:** randsum.io
**App Store:** Apple App Store + Google Play Store
**Version:** 1.0.0

---

## Overview

RANDSUM is a universal dice rolling app for tabletop RPG players. It supports standard dice, game-specific rollers (Blades in the Dark, D&D 5e, Daggerheart, etc.), and a powerful notation-based advanced mode. Users can save roll templates with variables, view animated results, and optionally sync across devices with a Supabase-backed account.

---

## Core Dependencies

| Package            | Role                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `@randsum/roller`  | Dice engine — `roll()`, validation, notation parsing (`workspace:~`)                                        |
| `@randsum/games`   | Game-specific rollers — Blades, D&D 5e, Daggerheart, PbtA, Root RPG, Salvage Union (`workspace:~`)          |
| `@randsum/dice-ui` | Notation input with token overlay — use via `"use dom"` initially, port to native if needed (`workspace:~`) |
| Expo SDK 55        | Universal app framework (iOS, Android, Web)                                                                 |
| Expo Router        | File-based navigation (tab bar, modals, deep links)                                                         |
| TanStack Query     | Server state, Supabase queries, cache management                                                            |
| Zustand            | Client state management (pool builder, UI state, preferences)                                               |
| Supabase           | Auth (email/password) + cloud sync (templates, history, preferences)                                        |

All dice logic comes from workspace-linked `@randsum/roller` (`workspace:~`). No dice logic is implemented in the app itself.

### dice-ui Strategy

The Advanced Mode notation input should match `playground.randsum.dev` as closely as possible. `@randsum/dice-ui` components use `react-dom` APIs (CSS imports, `className`, `getBoundingClientRect`). Strategy:

1. **Start with `"use dom"`** — Expo's DOM component directive wraps web components in a WebView proxy. This gives literal 1:1 parity with the playground. Fast to ship.
2. **Port to native if needed** — if WebView performance is unacceptable, create `.native.tsx` platform-specific variants using `TextInput`, `View`, `StyleSheet`.
3. **Web target uses components directly** — on Expo Web, `react-dom` is available, so dice-ui works without the `"use dom"` wrapper.

---

## Design Language

- **Thematically linked to randsum.dev**: Purple-500 (#a855f7) accent, zinc neutral grays, dark-first
- **Typography:** JetBrains Mono for notation/results, system sans-serif for UI
- **App-wide theming** via Zustand theme store + React Native `useColorScheme` as default
- **Dark mode default**, light mode toggle (persisted in preferences)
- **Haptic feedback** on roll actions (native only)
- **Animated result reveals** — number spin-up or cascade effect

### Theme Tokens (matching playground/site)

```
accent:       #a855f7 (purple-500)
accent-high:  #d8b4fe (purple-300)
bg:           #09090b (zinc-950)     | light: #ffffff
surface:      #18181b (zinc-900)     | light: #f4f4f5
surface-alt:  #27272a (zinc-800)     | light: #e4e4e7
border:       #52525b (zinc-600)     | light: #a1a1aa
text:         #fafafa (zinc-50)      | light: #18181b
text-muted:   #a1a1aa (zinc-400)     | light: #3f3f46
text-dim:     #71717a (zinc-500)     | light: #71717a
error:        #ef4444 (red-500)      | light: #dc2626
success:      #10b981 (emerald-500)  | light: #059669
```

---

## Navigation Structure

Bottom tab bar with the following tabs:

| Tab         | Icon            | Screen                                         |
| ----------- | --------------- | ---------------------------------------------- |
| **Roll**    | Dice icon       | Simple Mode (default) / Advanced Mode (toggle) |
| **Games**   | Controller icon | Game-specific rollers                          |
| **Saved**   | Bookmark icon   | Saved roll templates                           |
| **History** | Clock icon      | Roll history feed                              |
| **Account** | User icon       | Auth, settings, preferences                    |

---

## Screens

### 1. Simple Mode (Roll tab — default)

The primary rolling interface. A pool builder with dice buttons.

**Layout (top to bottom):**

1. **Pool display** — compact notation showing the current pool (e.g. `3d6 + 2d8 + 1d20`). Empty state: "Select dice to add to your pool"
2. **Dice grid** — 3x2 grid of dice buttons: D4, D6, D8, D10, D12, D20. Each tap increments that die type in the pool. Long-press to decrement.
3. **Action row** — three buttons:
   - **Save** — save current pool as a template (disabled when pool is empty)
   - **Notation** — toggle to Advanced Mode
   - **Clear** — reset the pool
4. **Roll button** — full-width bottom bar. Disabled when pool is empty. Triggers roll with haptic feedback.

**Behavior:**

- Tapping D6 three times shows `3d6` in the pool
- Adding D8 after shows `3d6 + 1d8`
- Roll button calls `roll()` with the built notation string
- Result appears as a full-screen overlay (see Roll Result Overlay)
- After dismissing the overlay, the result joins the History feed

### 2. Advanced Mode (Roll tab — toggled via Notation button)

A notation-based text input, similar to `playground.randsum.dev`.

**Layout:**

1. **Notation input** — text field with token overlay highlighting (from dice-ui's `TokenOverlayInput` pattern, adapted for React Native)
2. **Token description** — colored chips describing each token in the notation
3. **Notation quick reference** — scrollable reference grid (same data from `NOTATION_DOCS`, grouped by category, with interactive builder)
4. **Roll button** — same as Simple Mode
5. **Back to Simple** — button/toggle to return to Simple Mode

**Behavior:**

- User types notation (e.g. `4d6L`) or builds it via the reference grid builders
- Validation happens on each keystroke via `isDiceNotation()`
- Roll button enabled when notation is valid

### 3. Game Rollers (Games tab)

Game-specific rolling interfaces powered by `@randsum/games`.

**Layout:**

1. **Game selector** — list/grid of available games with icons and colors:
   - Blades in the Dark (slate)
   - D&D 5th Edition (gold)
   - Daggerheart (amber)
   - Powered by the Apocalypse (emerald)
   - Root RPG (green)
   - Salvage Union (orange)
2. **Game roller** — when a game is selected, replaces the selector with game-specific inputs

**Game roller behavior:**

- Inputs are **auto-generated from the `.randsum.json` spec** with optional custom UI overrides per game
- Each game's `roll()` function takes typed inputs (defined in the spec's `roll.inputs`)
- Results use the same overlay + history pattern
- "Back to game list" navigation

**Auto-generated input mapping (from spec `roll.inputs`):**

- `integer` inputs → numeric stepper
- `string` inputs with `options` → picker/dropdown
- `string` inputs without options → text field
- Input labels and constraints from the spec's `label`, `min`, `max`, `default`

**Custom overrides (future):**

- Blades: visual position/effect grid
- D&D 5e: advantage/disadvantage toggle with d20 emphasis

### 4. Saved Rolls (Saved tab)

User-created roll templates that can be reused.

**Layout:**

1. **Template list** — scrollable list of saved templates, each showing:
   - Name (user-given)
   - Notation or game reference
   - Variables (if any), e.g. `{mod}`
   - Quick-roll button
2. **Create new** — FAB or header button → opens Roll Wizard
3. **Swipe actions** — swipe to edit or delete

**Template structure:**

```typescript
interface RollTemplate {
  id: string
  name: string
  notation: string // e.g. "1d20+{mod}"
  variables: Variable[] // e.g. [{ name: "mod", default: 5 }]
  gameId?: string // optional game reference (e.g. "blades")
  gameInputs?: Record<string, unknown> // saved game-specific inputs
  createdAt: string
  updatedAt: string
}

interface Variable {
  name: string
  default?: number
  label?: string
}
```

**Rolling a template with variables:**

- Before rolling, an inline form appears asking for each variable value
- Variables with defaults show the default pre-filled
- Variables without defaults prompt the user
- Once filled, the notation is interpolated and rolled

### 5. Roll Wizard (creating new templates)

Two paths to create a template:

**Quick builder** (for simple rolls):

- Same as the Simple Mode pool builder + an "Add Modifiers" step
- Modifier step uses the notation builder pattern from the playground (steppers, condition inputs)
- Save with a name → becomes a template

**Full wizard** (for complex/game rolls):

- Step 1: Choose type — Standard notation or Game-specific
- Step 2: Build the roll
  - Standard: notation input with builder UI
  - Game: select game → fill game inputs
- Step 3: Add variables (optional) — mark parts of the notation as `{variable_name}` with optional defaults
- Step 4: Name and save

### 6. Roll Result Overlay

Full-screen animated result that appears after every roll.

**Layout:**

1. **Total** — large animated number (spin-up or cascade reveal), centered
2. **Breakdown** — individual dice results with modifier steps (same as `RollResultPanel` from dice-ui, adapted for RN)
3. **Notation** — the notation that was rolled
4. **Actions:**
   - **Share** — share result via system share sheet (text or image)
   - **Save as template** — if this was an ad-hoc roll
   - **Roll again** — re-roll the same notation
5. **Dismiss** — tap backdrop or swipe down → result joins history

**Animation:**

- Overlay slides up from bottom
- Total number does a brief spin/cascade animation
- Haptic pulse on result reveal (native only)

### 7. History Feed (History tab)

Scrollable list of past rolls, most recent first.

**Each entry shows:**

- Notation rolled (e.g. `4d6L`)
- Total result
- Timestamp
- Game name (if game roller was used)
- Tap to expand → full breakdown (same as RollResultPanel)

**Actions:**

- Tap → expand to full breakdown
- Swipe to delete
- "Clear all" header button

**Persistence:**

- Local: AsyncStorage or Expo SQLite
- Cloud (when signed in): syncs to Supabase

### 8. Account Screen (Account tab)

**Signed out state:**

- "Sign in to sync your rolls across devices"
- Email/password sign up form
- Sign in form
- "Continue without account" note

**Signed in state:**

- User email
- Sync status indicator
- Sign out button
- Theme toggle (dark/light)
- About / version info
- Links: randsum.dev, notation.randsum.dev, GitHub

---

## Data Model

### Local Storage (AsyncStorage / Expo SQLite)

```
templates: RollTemplate[]
history: RollHistoryEntry[]
preferences: {
  theme: 'dark' | 'light'
  haptics: boolean
  defaultMode: 'simple' | 'advanced'
  lastGameId?: string
}
```

### Supabase Schema (when authenticated)

**Tables:**

`profiles`

- `id` (uuid, FK to auth.users)
- `preferences` (jsonb)
- `created_at`, `updated_at`

`templates`

- `id` (uuid)
- `user_id` (uuid, FK to profiles)
- `name`, `notation`, `variables` (jsonb), `game_id`, `game_inputs` (jsonb)
- `created_at`, `updated_at`

`roll_history`

- `id` (uuid)
- `user_id` (uuid, FK to profiles)
- `notation`, `total` (int), `rolls` (jsonb), `game_id`
- `template_id` (uuid, nullable, FK to templates)
- `created_at`

**Sync strategy:**

- On sign-in: merge local data with cloud (local wins on conflict by timestamp)
- On each roll/save: write locally first, queue cloud sync
- On app launch (signed in): pull latest from cloud, merge with local

---

## Sharing

**Share a roll result:**

- System share sheet with formatted text: "Rolled 4d6L → 15 (6, 5, 4, [1])"
- Option to share as image (screenshot the result overlay)

**Share a template:**

- Deep link: `randsum.io/t/{template_id}` (resolves to the template, user can save it)
- System share sheet with the link

---

## Technical Architecture

```
apps/expo/
├── app/                    # Expo Router file-based routing
│   ├── (tabs)/             # Tab navigator
│   │   ├── index.tsx       # Roll tab (Simple/Advanced)
│   │   ├── games.tsx       # Games tab
│   │   ├── saved.tsx       # Saved templates tab
│   │   ├── history.tsx     # History feed tab
│   │   └── account.tsx     # Account/settings tab
│   ├── _layout.tsx         # Root layout
│   └── result.tsx          # Roll result overlay (modal)
├── components/             # Shared components
│   ├── DiceGrid.tsx
│   ├── PoolDisplay.tsx
│   ├── NotationInput.tsx   # RN adaptation of dice-ui TokenOverlayInput
│   ├── RollResultView.tsx  # RN adaptation of RollResultPanel
│   ├── GameRoller.tsx      # Auto-generated game input UI
│   ├── TemplateForm.tsx    # Save/edit template
│   └── VariablePrompt.tsx  # Inline variable fill-in
├── lib/
│   ├── storage.ts          # AsyncStorage/SQLite abstraction
│   ├── supabase.ts         # Supabase client
│   ├── sync.ts             # Local-first sync engine
│   └── haptics.ts          # Haptic feedback wrapper
├── hooks/
│   ├── useRoll.ts          # Roll execution + history append
│   ├── useTemplates.ts     # CRUD for templates
│   ├── useHistory.ts       # Roll history management
│   └── useAuth.ts          # Supabase auth state
├── metro.config.js
├── app.json
├── tsconfig.json
├── eslint.config.js
└── package.json
```

**Key patterns:**

- Expo Router for file-based navigation
- Local-first data: write to device, sync to cloud when signed in
- `@randsum/roller` for all dice logic (workspace-linked)
- `@randsum/games` for game-specific rollers (workspace-linked)
- React Native components only — no `react-dom` dependency
- `"use dom"` directive available as escape hatch for porting dice-ui web components

---

## Non-Goals (v1)

- Multiplayer / shared rooms
- Sound effects
- Character sheet management
- Dice skin customization
- Social features beyond sharing

---

## Platform-Specific Considerations

| Feature            | iOS                                | Android                      | Web                                         |
| ------------------ | ---------------------------------- | ---------------------------- | ------------------------------------------- |
| Haptic feedback    | `expo-haptics`                     | `expo-haptics`               | No-op (graceful fallback)                   |
| Share              | Native share sheet                 | Native share sheet           | Web Share API (fallback: copy to clipboard) |
| Storage            | Expo SQLite                        | Expo SQLite                  | AsyncStorage (IndexedDB)                    |
| Deep links         | `randsum.io/t/{id}` universal link | `randsum.io/t/{id}` app link | Direct URL                                  |
| PWA install        | N/A (App Store)                    | N/A (Play Store)             | Installable PWA                             |
| Push notifications | Future                             | Future                       | Not planned                                 |

**Deployment:**

- **iOS:** EAS Build → TestFlight → App Store
- **Android:** EAS Build → Internal testing → Play Store
- **Web:** Expo export → static deploy to randsum.io

## Success Metrics

- App loads and rolls on all three platforms (iOS, Android, Web)
- All 6 game packages produce correct results
- Templates with variables round-trip correctly (create → save → load → roll)
- Cloud sync works bidirectionally when signed in
- Roll history persists across app restarts
- Haptic feedback fires on native platforms (graceful no-op on web)
- Share generates a readable text format on all platforms
- Web version installable as PWA
