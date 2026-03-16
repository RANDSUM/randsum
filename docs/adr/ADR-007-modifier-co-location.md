# ADR-007: Modifier Co-Location into src/modifiers/

## Status

Proposed

## Context

The roller modifier system currently uses a three-layer hierarchy:

- **Schema layer** (`src/notation/definitions/<mod>.ts`) — regex pattern, parse/format logic, priority. One file per modifier.
- **Behavior layer** (`src/lib/modifiers/behaviors/<mod>.ts`) — dice pool manipulation logic. One file per modifier.
- **Definition (glue) layer** (`src/lib/modifiers/definitions/<mod>.ts`) — a single `{ ...schema, ...behavior }` spread with no logic. One file per modifier.

This produces approximately 65 files across five directories for 19 modifiers. The glue layer adds no abstraction — each file is a structurally-identical 8-line spread. Adding a modifier requires touching three directories and two parallel lists.

The original rationale for separating schemas from behaviors was **tokenize subpath isolation**: the `./tokenize` subpath must not pull in modifier behaviors (dice pool manipulation) because those behaviors are meaningless in a UI context and would bloat the tokenize bundle. Keeping schemas in `notation/` and behaviors in `lib/modifiers/behaviors/` enforced this structurally — a file in `notation/` cannot import from `lib/modifiers/behaviors/` without a visible cross-directory import.

Round 2 of the streamline-roller debate initially rejected full co-location on two grounds:
1. CJS bundles do not tree-shake. A single `require()` from a co-located modifier file would pull both schema and behavior into any CJS consumer's bundle.
2. Without `eslint-plugin-boundaries` or equivalent, import discipline cannot be enforced once structural separation is removed.

**Round 3 resolved both concerns** by tracing the actual source:

1. **CJS is already absent.** `packages/roller/bunup.config.ts` specifies `format: ['esm']`. The exports map contains zero `"require"` conditions. There are no `.cjs` files in dist, no `require()` calls anywhere in the monorepo, and `"type": "module"` is set at the package level. The CJS concern was based on a stale assumption.

2. **The tokenize path already imports the full schema layer.** `src/tokenize.ts` → `validateNotation` → `notationToOptions` + `optionsToNotation` + `optionsToDescription` → all 21 `NotationSchema` definitions from `notation/definitions/`. The tokenize bundle is not schema-free; it is behavior-free only. Schemas are already in the tokenize bundle. Co-locating schemas and behaviors into one file per modifier does not change what the tokenize path imports by name — it changes only where those named exports live.

3. **ESM tree-shaking provides the isolation guarantee.** With ESM-only output, bundlers (esbuild, rollup, webpack 5+) statically analyze named exports. If a co-located `cap.ts` exports `capSchema` and `capModifier` separately and the tokenize graph only imports `capSchema`, the bundler eliminates `capModifier`. This is a hard ESM guarantee. The existing `size-limit` check on `dist/tokenize.js` is the CI enforcement mechanism.

**Tokenize isolation was always "behaviors absent," not "schemas absent."** The structural separation never prevented schemas from being in the tokenize bundle. It only prevented behaviors. ESM tree-shaking preserves that exact boundary, post-co-location.

## Decision

Co-locate schema and behavior into a single file per modifier under `src/modifiers/`. Each file exports both a `*Schema` named export (the `NotationSchema`, used by the tokenize path and the roll path) and a `*Modifier` named export (the full `ModifierDefinition`, used only by the roll path).

The directory structure after co-location:

```
src/modifiers/
  cap.ts           # exports capSchema, capModifier
  drop.ts          # exports dropSchema, dropModifier
  explode.ts       # exports explodeSchema, explodeModifier
  ...              # one file per modifier
  shared/
    explosion.ts   # createAccumulatingExplosionBehavior(strategy) factory
  index.ts         # RANDSUM_MODIFIERS array — the single source of truth
```

The existing five-directory modifier structure is deleted:
- `src/notation/definitions/` (22 files)
- `src/lib/modifiers/behaviors/` (20 files)
- `src/lib/modifiers/definitions/` (the glue layer, 21 files)

`compound` and `penetrate` are factory-ified via `createAccumulatingExplosionBehavior(strategy)` to eliminate structurally-identical behavior wrappers.

**Tokenize path interaction with Story 5 (`modifiersToStrings.ts` deletion):**

`modifiersToStrings.ts` is currently on the tokenize import path (via `validateNotation` → `optionsToNotation`/`optionsToDescription`). If `modifiersToStrings.ts` is deleted and its callers are redirected to `registry.ts`, the tokenize path would pull in `registry.ts` and all behaviors — a regression. The correct sequence is:

1. Extract schema-only variants of `processModifierNotations`/`processModifierDescriptions` into a location reachable without behaviors (a small helper in `notation/transformers/` before co-location; in `src/modifiers/` after co-location).
2. Redirect `optionsToNotation`/`optionsToDescription` to the schema-only variants.
3. Delete `modifiersToStrings.ts`.
4. Proceed with co-location.

Story 5 and Story 7 must be sequenced or merged to avoid introducing a tokenize regression window. The amended story dependency graph is:

```
Story 5a (schema-only helper extraction) → Story 5b (modifiersToStrings deletion) → Story 7 (co-location)
```

**Regression guard:** After co-location, audit the actual `dist/tokenize.js` size and tighten the `size-limit` entry to `actual + 1 KB`. The current 6 KB limit provides enough headroom to absorb a small behavior leak without CI catching it.

## Consequences

### Positive

- Adding a modifier becomes 1 new file in `src/modifiers/` + 1 entry in `RANDSUM_MODIFIERS`. No more touching three directories and two parallel lists.
- Eliminates ~40 files (22 schema files + 20 behavior files + the glue layer) and the corresponding directory structure.
- Schema and behavior for a modifier are readable in the same file — context-switching eliminated for modifier development.
- The glue layer (19 files of pure 8-line spreads) is deleted entirely — zero abstraction loss.
- `compound`/`penetrate` factory reduces duplication of structurally-identical explosion variants.

### Negative

- Tokenize isolation shifts from structural (directory boundary) to ESM tree-shaking + `size-limit` CI check. A developer cannot "see" the isolation by looking at directory structure.
- The tokenize regression risk window exists during the Story 5 → Story 7 transition if not sequenced correctly. The schema-only helper extraction (Story 5a) is a required intermediate step.
- Module-level shared state between co-located schema and behavior exports would break tree-shaking. Each modifier file must maintain clean separation: the schema export must not reference any behavior-only symbols at module initialization time.

## Alternatives Considered

**Inline glue into `definitions/index.ts` only (Round 2 consensus, before CJS was confirmed gone):**
The Round 2 plan was to inline the `{ ...schema, ...behavior }` spreads into `definitions/index.ts` and delete the 19 individual glue files, leaving schemas in `notation/definitions/` and behaviors in `lib/modifiers/behaviors/`. This preserves structural isolation but does not reduce directory count or simplify the modifier authoring workflow. Rejected in Round 3 once ESM-only was confirmed.

**`eslint-plugin-boundaries` as enforcement:**
Proposed as a precondition for co-location in Round 2 (Orion). In Round 3, confirmed unnecessary given ESM-only output and the `size-limit` CI check. Remains a recommended follow-up for explicit import rule documentation but is not a blocker.

**Keep three-layer hierarchy:**
Preserves structural isolation but maintains 65 files for 19 modifiers. The ongoing cost (three touches per modifier, five directories, two parallel lists) compounds as the modifier set grows. Rejected as the primary complexity bottleneck in the roller package.

## References

- ADR-005: Merge @randsum/notation back into @randsum/roller (establishes the single-package context)
- Brainstorm: `options.md` Story 7 — Modifier Co-Location
- Debate: `round-2.md` — Co-location initially rejected on CJS grounds
- Debate: `round-3.md` (Orion) — CJS blocker resolved; tokenize import trace; migration path amendment
- Debate: `round-3.md` (Saturn) — Co-located modifier file structure example
