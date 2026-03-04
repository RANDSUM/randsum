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

## Package Manager

This app uses **npm** (not bun) for `node_modules` — bun hangs at the link phase with Expo's large dependency tree. The root bun workspace explicitly excludes `apps/app`. Use `npm install` to add deps.

`@randsum/roller` is installed from the npm registry (`^1.0.0`), not via workspace protocol.
