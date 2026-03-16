# streamline-roller Doc Spec

This document is the spec for all documentation changes during the `streamline-roller` sprint. It is organized into three sections:

1. **CLAUDE.md Update Schedule** — which sections change per story and what the update contains
2. **Story 6 Changelog Template** — the precise changelog entry for the public API surface reduction
3. **Tokenize Isolation Rule** — the CLAUDE.md prose to add after Story 8 (co-location complete)

---

## Section 1: CLAUDE.md Update Schedule

### Story 3: Formalize ESM-Only Output

**Trigger:** Story 3 merges — audit complete, `.cjs` artifacts removed from all publishable packages.

**Root CLAUDE.md — "Package Build Output" section**

Replace the current section:

> All packages use `bunup` producing identical structure:
> - `dist/index.js` (ESM), `dist/index.cjs` (CJS)
> - `dist/index.d.ts`, `dist/index.d.cts` (type declarations)
> - Bundle size limits enforced: roller 20KB (includes notation), display-utils 20KB, game packages 8KB, salvageunion 300KB

With:

> All publishable packages produce ESM only:
> - `dist/index.js` (ESM)
> - `dist/index.d.ts` (TypeScript declarations)
> - Subpath exports follow the same pattern: `dist/<subpath>.js`, `dist/<subpath>.d.ts`
> - No `.cjs`, `.d.cts`, or `dist/cjs/` variants are produced
> - Bundle size limits enforced: roller 20KB (includes notation), display-utils 20KB, game packages 8KB, salvageunion 300KB
>
> CJS consumers must use a bundler (esbuild, rollup, webpack 5+) that translates ESM to CJS. Direct `require()` of an `@randsum/*` package without a bundler is not supported.

**No changes** to `packages/roller/CLAUDE.md` for Story 3.

---

### Story 4: Dead Code Removal

**Trigger:** Story 4 merges — unused internal files deleted.

**No documentation changes.** Story 4 removes internal dead code only. No public API, no exported types, no path references change.

---

### Stories 5+7: modifiersToStrings Deletion + Modifier Co-location (merged atomic story)

This story has two phases with a doc window between them.

#### During merge (transitional note — add to PR description or session notes, not to CLAUDE.md)

The transitional state exists only within the story branch, not in merged main. No CLAUDE.md update is needed during the transition. However, the developer working on this story should be aware: `src/notation/definitions/` and `src/lib/modifiers/behaviors/` both still exist until the full co-location cleanup is committed. Do not update CLAUDE.md until the entire atomic story (5a → 5b → 7) is merged as a unit.

#### After Story 5+7 merges — `packages/roller/CLAUDE.md` "Modifier System" section

Replace the current section:

> The `RANDSUM_MODIFIERS` array in `src/lib/modifiers/definitions/index.ts` is the single source of truth for which modifiers exist and their execution order.
>
> Each modifier is split into two parts, both living within this package:
>
> - **Schema** (`src/notation/definitions/<mod>.ts`) — regex pattern, parse/format logic, priority. Defined using `defineNotationSchema`.
> - **Behavior** (`src/lib/modifiers/behaviors/<mod>.ts`) — applies the modifier to dice rolls. Implements `ModifierBehavior`.
> - **Combined** (`src/lib/modifiers/definitions/<mod>.ts`) — spreads schema and behavior into a `ModifierDefinition`.
>
> To add a modifier:
>
> 1. Add the schema file in `src/notation/definitions/`
> 2. Add the behavior file in `src/lib/modifiers/behaviors/`
> 3. Add the combined definition in `src/lib/modifiers/definitions/`
> 4. Register it in `RANDSUM_MODIFIERS` in `src/lib/modifiers/definitions/index.ts`
> 5. Add the notation to `RANDSUM_DICE_NOTATION.md`

With:

> The `RANDSUM_MODIFIERS` array in `src/modifiers/index.ts` is the single source of truth for which modifiers exist and their execution order.
>
> Each modifier lives in a single co-located file under `src/modifiers/<mod>.ts`. Each file exports two named symbols:
>
> - **`<mod>Schema`** (`NotationSchema`) — regex pattern, parse/format logic, priority. Used by the tokenize path and the roll path.
> - **`<mod>Modifier`** (`ModifierDefinition`) — full modifier combining schema and dice pool behavior. Used only by the roll path.
>
> To add a modifier:
>
> 1. Create `src/modifiers/<mod>.ts` — export `<mod>Schema` and `<mod>Modifier`
> 2. Register `<mod>Modifier` in `RANDSUM_MODIFIERS` in `src/modifiers/index.ts`
> 3. Add the notation to `RANDSUM_DICE_NOTATION.md`
>
> See `docs/adr/ADR-007-modifier-co-location.md` for the architectural rationale.

#### After Story 5+7 merges — `packages/roller/CLAUDE.md` "Internal Architecture" section

Replace the current directory tree block and narrative:

> ```
> src/
>   notation/          # Notation parsing, validation, tokenization, modifier schemas
>     comparison/      # Comparison notation ({<3,>18} syntax)
>     definitions/     # NotationSchema definitions — one per modifier
>     parse/           # notationToOptions, listOfNotations
>     transformers/    # Options-to-notation and options-to-description converters
>     constants.ts     # TTRPG_STANDARD_DIE_SET
>     coreNotationPattern.ts
>     formatHumanList.ts
>     isDiceNotation.ts
>     schema.ts        # NotationSchema type and defineNotationSchema helper
>     suggestions.ts
>     tokenize.ts
>     types.ts         # All shared notation/roll types
>     validateNotation.ts
>   lib/
>     modifiers/       # Modifier system (schema + behavior + registry)
>       behaviors/     # ModifierBehavior implementations — one per modifier
>       definitions/   # Combined ModifierDefinition — spreads schema + behavior
>     random/          # Random number generation
>     transformers/    # Options <-> notation conversion used at roll time
>     utils/           # Internal utilities
>   roll/              # Main roll function and argument parsing
>   errors.ts          # ValidationError, NotationParseError
>   index.ts           # Main barrel
>   validate.ts        # validateNotation, isDiceNotation, numeric validators
> ```

With:

> ```
> src/
>   modifiers/         # Modifier system — one file per modifier, co-located schema + behavior
>     shared/
>       explosion.ts   # createAccumulatingExplosionBehavior(strategy) factory
>     index.ts         # RANDSUM_MODIFIERS array — the single source of truth
>     cap.ts           # exports capSchema, capModifier
>     drop.ts          # exports dropSchema, dropModifier
>     explode.ts       # exports explodeSchema, explodeModifier
>     ...              # one file per modifier
>   notation/          # Notation parsing, validation, tokenization
>     comparison/      # Comparison notation ({<3,>18} syntax)
>     parse/           # notationToOptions, listOfNotations
>     transformers/    # Options-to-notation and options-to-description converters
>     constants.ts     # TTRPG_STANDARD_DIE_SET
>     coreNotationPattern.ts
>     formatHumanList.ts
>     isDiceNotation.ts
>     schema.ts        # NotationSchema type and defineNotationSchema helper
>     suggestions.ts
>     tokenize.ts
>     types.ts         # All shared notation/roll types
>     validateNotation.ts
>   lib/
>     random/          # Random number generation
>     transformers/    # Options <-> notation conversion used at roll time
>     utils/           # Internal utilities
>   roll/              # Main roll function and argument parsing
>   errors.ts          # ValidationError, NotationParseError
>   index.ts           # Main barrel
>   validate.ts        # validateNotation, isDiceNotation, numeric validators
> ```

#### After Story 5+7 merges — root `CLAUDE.md` "Modifier Registry" subsection

Replace:

> The `RANDSUM_MODIFIERS` array in `packages/roller/src/lib/modifiers/definitions/index.ts` is the single source of truth for which modifiers exist and their execution order. Each modifier combines a `NotationSchema` (from `packages/roller/src/notation/definitions/`) with a `ModifierBehavior` (from `packages/roller/src/lib/modifiers/behaviors/`). See `packages/roller/RANDSUM_DICE_NOTATION.md` for the full priority table and syntax reference.

With:

> The `RANDSUM_MODIFIERS` array in `packages/roller/src/modifiers/index.ts` is the single source of truth for which modifiers exist and their execution order. Each modifier is a single co-located file in `packages/roller/src/modifiers/` that exports both a `*Schema` (notation pattern, parse/format logic) and a `*Modifier` (full definition with dice pool behavior). See `packages/roller/RANDSUM_DICE_NOTATION.md` for the full priority table and syntax reference.

---

### Story 6: Public API Surface Reduction

**Trigger:** Story 6 merges — 7 type exports removed, `notation()` promoted, `/comparison` subpath folded into main barrel.

See Section 2 for the changelog entry.

**`packages/roller/CLAUDE.md` — "Subpath Exports" section**

Remove the `./comparison` entry:

```typescript
import { parseComparisonNotation } from "@randsum/roller/comparison" // comparison parsing only
```

The `/comparison` subpath no longer exists. The comparison utilities are now in the main barrel. No replacement import path is needed; the functions are available from `@randsum/roller`.

**`packages/roller/CLAUDE.md` — "Notation API" section**

Add `notation()` to the main barrel note in the Parsing subsection. The function is already listed; confirm it appears without any "not yet on main barrel" caveat. If any such caveat exists, remove it.

**`packages/roller/CLAUDE.md` — "Type Exports" section**

Remove the following entries from the type exports list:
- `RollParams`
- `RequiredNumericRollParameters`
- `ModifierLog`
- `NumericRollBonus`
- `RollResult` (base interface)
- `ValidValidationResult`
- `InvalidValidationResult`
- `ModifierConfig`

Add to the list:
- `parseComparisonNotation`, `hasConditions`, `formatComparisonNotation`, `formatComparisonDescription` — moved from `/comparison` subpath to main barrel

Add a replacement note after the type list:

> Consumers who previously imported `RollResult` should use `RollerRollResult`. Consumers who previously imported `ValidValidationResult` or `InvalidValidationResult` should use `ValidationResult` (discriminated union on `valid: boolean`). Consumers who previously imported `RollParams`, `RequiredNumericRollParameters`, `ModifierLog`, `NumericRollBonus`, or `ModifierConfig` should use `ReturnType<typeof roll>` or construct the relevant types from the public surface.

**`packages/roller/CLAUDE.md` — "Comparison Utilities" subsection**

Remove the note that `parseComparisonNotation` is available via `@randsum/roller/comparison`. Update or remove any text that directs consumers to the `/comparison` subpath.

---

### Story 8: Post-Co-location Cleanup

**Trigger:** Story 8 merges — `src/notation/definitions/`, `src/lib/modifiers/behaviors/`, and `src/lib/modifiers/definitions/` fully deleted.

**`packages/roller/CLAUDE.md` — "Modifier System" section**

Confirm that the "After Story 5+7 merges" version of the section above is in place. If Story 5+7 and Story 8 merge together, apply the Story 5+7 section update at this point.

Add the Tokenize Isolation Rule prose from Section 3 of this document as a new paragraph at the end of the Modifier System section.

**Root `CLAUDE.md` — "Modifier Registry" subsection**

Confirm the Story 5+7 update above is applied. No additional changes needed from Story 8 alone.

---

## Section 2: Story 6 Changelog Template

The following entry belongs in `CHANGELOG.md` under a new `## [3.6.0]` header (or the appropriate version established at the time of merge). It must be reviewed and confirmed accurate before Story 6 merges.

---

```markdown
## [3.6.0] — YYYY-MM-DD

### @randsum/roller

#### Added

- `notation(value: string): DiceNotation` is now exported from the main barrel (`@randsum/roller`).
  Previously documented in `CLAUDE.md` but absent from `src/index.ts` — consumers can now import it
  without using an internal path.
  Throws `NotationParseError` on invalid input. Use `isDiceNotation` for a non-throwing type guard,
  or `validateNotation` for a detailed result with error information.

- `parseComparisonNotation`, `hasConditions`, `formatComparisonNotation`, `formatComparisonDescription`
  are now exported from the main barrel (`@randsum/roller`).
  Previously available only via `@randsum/roller/comparison`.

#### Removed

The following type exports have been removed from `@randsum/roller`. They were internal types with zero
documented consumer usage (`ts-unused-exports` verified). If you imported any of these, see the
migration notes below.

| Removed export | Replacement |
|---|---|
| `RollParams` | Use `ReturnType<typeof roll>` or construct from `RollOptions` |
| `RequiredNumericRollParameters` | Internal type — no public replacement needed |
| `ModifierLog` | Internal type — no public replacement needed |
| `NumericRollBonus` | Internal type — no public replacement needed |
| `RollResult` | Use `RollerRollResult` (the named public return type) |
| `ValidValidationResult` | Use `ValidationResult` (discriminated union on `valid: boolean`) |
| `InvalidValidationResult` | Use `ValidationResult` (discriminated union on `valid: boolean`) |
| `ModifierConfig` | Internal type — no public replacement needed |

#### Subpath changes

- `@randsum/roller/comparison` subpath has been removed.
  The four comparison functions (`parseComparisonNotation`, `hasConditions`,
  `formatComparisonNotation`, `formatComparisonDescription`) are now available from
  the main barrel: `import { parseComparisonNotation } from '@randsum/roller'`.
  Update any imports using `from '@randsum/roller/comparison'`.
```

---

## Section 3: Tokenize Isolation Rule

The following prose should be added to `packages/roller/CLAUDE.md` at the end of the "Modifier System" section, after Story 8 merges and the three-directory layout is fully deleted.

---

### Tokenize Isolation Invariant

The `@randsum/roller/tokenize` subpath must never import modifier behaviors. Behaviors are dice pool manipulation functions meaningless in a UI context; importing them into the tokenize bundle wastes bytes and couples a stateless parsing tool to the full roll engine.

Post-co-location, isolation is maintained by ESM tree-shaking rather than directory structure:

- Each modifier file in `src/modifiers/` exports two symbols: `<mod>Schema` (used by tokenize path) and `<mod>Modifier` (used only by roll path).
- The tokenize import graph reaches `<mod>Schema` by name and never references `<mod>Modifier`.
- ESM bundlers (esbuild, rollup, webpack 5+, Bun) statically eliminate `<mod>Modifier` from the tokenize bundle.
- The `size-limit` CI check on `dist/tokenize.js` is the enforcement gate. After any modifier addition or co-location refactor, verify the tokenize bundle size has not grown unexpectedly.

**The invariant:** `<mod>Schema` exports must not reference any behavior-only symbols at module initialization time. If a schema export imports from a behavior export within the same file, the module-level reference defeats tree-shaking and leaks the behavior into the tokenize bundle.

To verify isolation after a modifier change:

```bash
bun run --filter @randsum/roller size
```

If the `dist/tokenize.js` size entry fails, a behavior has leaked into the tokenize path. Trace the import graph from `src/tokenize.ts` to find the leak.
