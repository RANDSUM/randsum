# ADR-009: Public API Surface Reduction for @randsum/roller

## Status

Proposed

## Context

The main barrel of `@randsum/roller` (`src/index.ts`) exports approximately 60 symbols. Downstream consumers — both within the monorepo and in the published npm ecosystem — use a small subset:

| Symbol | Usage |
|---|---|
| `roll` | Primary entry point — used by every consumer |
| `isDiceNotation` | Type guard — used by games, CLI, component-library |
| `validateNotation` | Validation — used by display-utils, component-library |
| `tokenize` / `Token` | Tokenizer — used by component-library, site |
| `RollRecord` | Return type — used by games, CLI |

The remaining ~55 symbols include:

- **Unused type exports**: `RollParams`, `RequiredNumericRollParameters`, `ModifierLog`, `NumericRollBonus`, `RollResult` (the base interface, not the game-specific type), `ValidValidationResult`, `InvalidValidationResult`, `ModifierConfig`. No `@randsum/*` package imports any of these. Verified by `check:exports` (`ts-unused-exports`).
- **`notation()` missing from the main barrel**: The throwing validator (`notation(value): DiceNotation | throws NotationParseError`) is documented in `packages/roller/CLAUDE.md` but absent from `src/index.ts`. Consumers who discover it via documentation cannot import it without using the internal path.
- **`/comparison` subpath with zero consumers**: The `./comparison` subpath (`parseComparisonNotation`, `hasConditions`, `formatComparisonNotation`, `formatComparisonDescription`) has a dedicated size-limit entry and a dedicated exports map entry. There are zero downstream consumers of this subpath within the monorepo and no known external consumers. The comparison utilities are used internally within roller's notation pipeline; they do not need a standalone subpath.

A barrel exporting 60 symbols when 5 are used has three concrete costs:

1. **Discoverability**: IDE autocomplete surfaces 60 symbols when a consumer types `import { } from '@randsum/roller'`. The signal-to-noise ratio is low.
2. **`.d.ts` size**: Unused type exports inflate the declaration file. The current `size-limit` entry for `dist/index.d.ts` is 10 KB.
3. **Semver contract**: Every exported symbol is a public API commitment. Removing an unused export later requires a major version bump if it was part of the published surface.

The surface reduction is independent of the structural refactors (ADR-007, ADR-008) and can ship as a standalone minor version bump.

## Decision

Reduce the public API surface of `@randsum/roller` in three steps, shipped as a single minor version bump:

### Step 1: Remove 7 unused type exports

Remove from `src/index.ts`:

- `RollParams` — internal parameter type, not a consumer API
- `RequiredNumericRollParameters` — internal, not needed externally
- `ModifierLog` — internal log type, not part of the public roll result surface
- `NumericRollBonus` — internal arithmetic type
- `RollResult` (base interface) — conflicts in name with game-package `GameRollResult`; consumers should use `RollerRollResult`
- `ValidValidationResult` — consumers should use `ValidationResult` (the discriminated union)
- `InvalidValidationResult` — same as above
- `ModifierConfig` — internal configuration type

If any removed type is needed by a consumer who built typed helpers against it, the replacement pattern is: use `ReturnType<typeof roll>` for roll results, `ValidationResult` for validation results (discriminated on `valid: boolean`).

### Step 2: Promote `notation()` to the main barrel

Add `notation` to `src/index.ts` alongside `isDiceNotation` and `validateNotation`.

`notation(value: string): DiceNotation` — asserts valid notation or throws `NotationParseError`. This is already documented in `CLAUDE.md` as part of the Notation API but unreachable from the declared public surface.

Update `CLAUDE.md` Notation API section to document that `notation()` throws `NotationParseError` (not returns a discriminated union).

### Step 3: Remove `/comparison` subpath, fold into main barrel

Remove `./comparison` from the `package.json` exports map. Remove the `./comparison` size-limit entry from `package.json`.

Add the four comparison functions to `src/index.ts` as lower-profile exports:
- `parseComparisonNotation`
- `hasConditions`
- `formatComparisonNotation`
- `formatComparisonDescription`

These are useful utilities for consumers building notation editors or validators. They belong in the main barrel, not behind a dedicated subpath that implies independent standalone utility.

### Version bump

This is a minor version bump (`3.5.0` → `3.6.0`) because it removes previously exported symbols from the public surface. A precise changelog entry must document:

- Each removed export and the recommended replacement (if any)
- The promotion of `notation()` to the main barrel
- The removal of the `/comparison` subpath (comparison functions available from main barrel)

The changelog entry must be reviewed before the story merges, because removed types affect any external consumer who built typed helpers against `RollParams`, `ModifierConfig`, or the discriminated sub-types of `ValidationResult`.

## Consequences

### Positive

- Smaller `dist/index.d.ts` — unused type exports removed, file size decreases toward the 10 KB limit.
- Better discoverability — IDE autocomplete surfaces ~12 symbols instead of ~60 for the main barrel.
- `notation()` is importable from the documented public surface.
- Comparison utilities remain accessible without the cognitive overhead of a separate subpath.
- Removes the `/comparison` size-limit CI entry (one fewer check to maintain).
- Reduces the semver contract surface — fewer exported symbols means fewer commitments to maintain in future versions.

### Negative

- Breaking change for external consumers who imported any of the 7 removed types. Requires changelog communication and a minor version bump.
- The `/comparison` subpath removal breaks any consumer using `@randsum/roller/comparison` directly. These consumers must update to import from `@randsum/roller`. Zero known monorepo consumers; unknown external consumer count.
- Folding comparison into the main barrel slightly increases `dist/index.js` size (mitigated: these are small utility functions, tree-shaken by consumers who don't use them).

## Alternatives Considered

**Mark removed types as `@deprecated` instead of deleting them:**
Reduces breaking change risk but maintains the documentation noise problem indefinitely. Deprecated exports still appear in IDE autocomplete. Rejected — the types are unused with no migration path needed (they were never the intended public API).

**Keep `/comparison` as a subpath:**
Preserves the current import path for any external consumers. But the subpath has zero known consumers and a dedicated CI entry. Comparison utilities are utility functions, not a standalone subsystem. Folding into the main barrel is the simpler model. Rejected.

**Remove more symbols (full surface reduction to 5 symbols):**
The brainstorm identified `tokenize`, `Token`, `DiceNotation`, `ComparisonOptions`, `RollOptions`, `ModifierOptions`, `ValidationResult`, `NotationSchema`, `RollRecord`, `RollerRollResult`, `ValidationError`, `NotationParseError` as legitimate public API alongside the 5 primary function symbols. Removing all other exports (including these types) would be a more aggressive reduction but risks breaking consumers who import utility types for their own TypeScript generics. The 7 types identified in this ADR are specifically those with zero `@randsum/*` consumers and no obvious replacement idiom. Further reduction is deferred.

## References

- Brainstorm: `options.md` Story 6 — Public Surface Reduction
- Debate: `round-2.md` — Surface reduction consensus; `/comparison` subpath removal; `notation()` promotion; 7 unused types identified
- `packages/roller/CLAUDE.md` — current documented API surface (includes `notation()` but does not match barrel)
- `packages/roller/package.json` — current exports map and size-limit entries
