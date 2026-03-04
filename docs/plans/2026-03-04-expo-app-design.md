# @randsum/app — Expo App Design

**Date:** 2026-03-04
**Status:** Approved

## Overview

A mobile-first (iOS + Android + Web) dice roller companion app built with Expo. Lets users roll
arbitrarily complex dice via a notation-based interface with visual controls, save rolls for
quick re-rolling, and browse a persistent roll history. Uses `@randsum/roller` as its sole dice
engine. No game-specific logic.

## Architecture

### Tech Stack

| Concern        | Choice                                      |
| -------------- | ------------------------------------------- |
| Framework      | Expo SDK 54 (managed workflow)              |
| Routing        | Expo Router (file-based)                    |
| Styling        | Tamagui (token-based theming, dark-first)   |
| Storage        | `@react-native-async-storage/async-storage` |
| Animation      | Reanimated 3                                |
| Dice engine    | `@randsum/roller` via `workspace:~`         |
| Package manager| bun (workspace member, EAS-compatible)      |

### Monorepo Integration

- Lives at `apps/app`, package name `@randsum/app`, private
- Added to root bun workspace (`apps/*` already covered)
- `@randsum/roller` referenced as `workspace:~` — same pattern as all other packages
- EAS Build detects bun via lockfile; managed workflow means no Expo module build issues
- Web is a first-class target alongside iOS and Android; Expo Router and Tamagui both support web natively; AsyncStorage works on all three platforms without shims

### File Structure

```
apps/app/
  app/
    _layout.tsx           # Root layout — Tamagui provider, theme
    index.tsx             # Main roller screen
    saved-rolls.tsx       # Saved rolls bottom sheet / modal route
  src/
    components/
      NotationInput.tsx   # Live-validated notation text input
      DiceButtons.tsx     # Dice type button row (d4–d100)
      ModifierButtons.tsx # Named modifier buttons with pickers
      HistoryLog.tsx      # Scrollable persistent roll history
      ResultModal.tsx     # Roll result modal (shared by ROLL + history taps)
      SavedRollsSheet.tsx # Bottom sheet listing saved notations
    hooks/
      useNotation.ts      # Notation state, validation, description
      useHistory.ts       # MMKV-backed roll history
      useSavedRolls.ts    # MMKV-backed saved rolls
    lib/
      describeNotation.ts # Notation string → English description
      buildRollRecord.ts  # roll() result → RollRecord
      storage.ts          # Typed MMKV read/write helpers
    types.ts              # Shared types (RollRecord, SavedRoll, NotationState)
  package.json
  tsconfig.json
  app.json
  eas.json
```

## Screen Design

### Main Screen (single screen)

Three visual zones stacked vertically:

**Zone 1 — Notation builder:**
- Live notation text input with clear (✕) button; red border + error message when invalid
- English-language description rendered below the input at all times
- Two rows of dice type buttons: d4, d6, d8, d10, d12, d20, d100
- Named modifier buttons: Drop Lowest, Drop Highest, Explode, Unique, Add…, Subtract…,
  Reroll…, Cap… — parameterised modifiers open an inline number/condition picker
- ROLL button (disabled when notation is invalid)

**Zone 2 — History log:**
- Scrollable persistent list of past rolls (newest first, capped at 100)
- Each row: notation → total, timestamp, tap-to-expand icon (↗)
- Tapping opens the Result Modal populated with stored data

**Header:** App name/logo left, Saved Rolls button right

### Result Modal

Appears on ROLL; reused for history taps.

```
┌─────────────────────────────┐
│  4d6L+2                 [✕]│
│  Roll 4d6, drop lowest, +2  │
├─────────────────────────────┤
│                             │
│            42               │
│                             │
│  ~~3~~  7   8   9           │
│                    + 2      │
│                             │
├─────────────────────────────┤
│  [Roll Again]  [Save Roll]  │
└─────────────────────────────┘
```

- Dropped dice rendered with strikethrough
- Roll Again re-rolls the notation, replaces modal content, appends new record to history
- Save Roll prompts for a name, persists to saved rolls

### Saved Rolls Sheet

Slides up from the header Saved button.

- List of saved notations: name + notation string + load arrow
- Tap a row → loads notation into the input, closes sheet
- Swipe to delete
- Save Current button at the top (disabled if notation invalid)

## Data Model

```typescript
type NotationState = {
  raw: string         // "4d6L+2"
  description: string // "Roll 4d6, drop lowest, add 2"
  isValid: boolean
  error?: string
}

type RollRecord = {
  id: string
  notation: string
  total: number
  rolls: number[][]    // per-die-group individual results
  droppedIndices: number[]
  timestamp: number
}

type SavedRoll = {
  id: string
  name: string
  notation: string
}
```

**AsyncStorage keys:**
- `roll_history` → `RollRecord[]` (newest first, max 100 entries, JSON-serialised)
- `saved_rolls` → `SavedRoll[]` (JSON-serialised)

AsyncStorage works across iOS, Android, and Web with no platform shims required.

## Data Flow

```
User interaction → updates notation string
  → validateNotation() → isValid + description (live)

ROLL pressed
  → roll(notation) → buildRollRecord()
  → prepend to history (MMKV)
  → open Result Modal

History row tapped
  → load RollRecord from history array
  → open Result Modal (read-only variant)

Roll Again (in modal)
  → roll(same notation) → new RollRecord
  → prepend to history
  → replace modal content

Save Roll (in modal)
  → prompt for name
  → append to saved_rolls (MMKV)

Load Saved Roll (from sheet)
  → set notation string
  → close sheet
```

## Error Handling

- `roll()` never throws — errors returned in `result.error`, shown inline in modal
- ROLL button disabled when `isValid === false`
- Notation input: validates every keystroke, error message below description area
- AsyncStorage failures: default to empty arrays, no crash

## Testing

- Framework: `bun:test` (consistent with monorepo)
- Unit tests for: `describeNotation`, `buildRollRecord`, MMKV storage helpers
- Core dice logic covered by `@randsum/roller`'s own test suite — no duplication
- No component tests in initial build
