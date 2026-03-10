# Changelog

All notable changes to the RANDSUM ecosystem are documented here.

## [3.0.0] — 2024

### Breaking Changes

#### `@randsum/notation` extracted as a standalone package

The notation parser and all shared types have been moved out of `@randsum/roller` into a new zero-dependency package `@randsum/notation`. `@randsum/roller` continues to re-export everything for backward compatibility, but consumers that only need parsing can now depend on `@randsum/notation` directly.

**Migration:** No changes required if you import from `@randsum/roller`. To reduce bundle size, switch imports to `@randsum/notation`:

```typescript
// Before (still works)
import { isDiceNotation, validateNotation } from '@randsum/roller'

// After (lighter weight)
import { isDiceNotation, validateNotation } from '@randsum/notation'
```

#### `optionsToNotation` and `optionsToDescription` moved

These conversion utilities moved from `@randsum/roller` to `@randsum/notation`.

**Migration:** Update import source or continue importing from `@randsum/roller` (re-exported).

#### New error types

`NotationParseError`, `ModifierError`, `RollError` added alongside existing `RandsumError` and `ValidationError`. Each error has a typed `code` property using the new `ERROR_CODES` constant.

#### `createGameRoll` result shape change

`GameRollResult` now has a stable shape:

```typescript
{
  result: TResult       // Game-specific interpretation
  total: number         // Numeric total after all modifiers
  rolls: RollRecord[]   // Full roll history with modifier logs
}
```

#### Package peer dependency changes

`@randsum/component-library` now lists `@randsum/roller`, `@randsum/display-utils`, and `@randsum/notation` as `peerDependencies` (previously `dependencies`). Install them explicitly in your app.

**Migration:**

```bash
npm install @randsum/roller @randsum/display-utils @randsum/notation
```

### New Features

- `@randsum/notation` — standalone dice notation package (zero deps)
- `ERROR_CODES` constant exported from `@randsum/roller` for consistent error handling
- `ParsedNotationOptions` type exported from both `@randsum/notation` and `@randsum/roller`
- `NotationSchema` / `defineNotationSchema` — extend the notation system with custom modifier schemas
- `tokenize()` — parse notation into typed token segments for syntax highlighting in UIs
- `suggestNotationFix()` — suggest corrections for invalid notation input
- `buildStackBlitzProject()` in `@randsum/display-utils` — generate StackBlitz sandbox projects
- `@randsum/component-library` — new React component library (`RollerPlayground`, `ModifierReference`, `ErrorBoundary`)
- `@randsum/cli` — rewritten as an Ink-based TUI with interactive mode

### Package Versions

| Package | Version |
| --- | --- |
| `@randsum/roller` | 3.0.0 |
| `@randsum/notation` | 3.0.0 |
| `@randsum/display-utils` | 3.0.1 |
| `@randsum/component-library` | 3.0.0 |
| `@randsum/cli` | 3.0.0 |
| `@randsum/blades` | 3.0.0 |
| `@randsum/daggerheart` | 3.0.0 |
| `@randsum/fifth` | 3.0.0 |
| `@randsum/pbta` | 3.0.0 |
| `@randsum/root-rpg` | 3.0.0 |
| `@randsum/salvageunion` | 3.0.0 |

---

## [2.x] and earlier

See git history for changes prior to the 3.0.0 monorepo restructure.
