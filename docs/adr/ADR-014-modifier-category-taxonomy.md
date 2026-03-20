# ADR-014: Modifier Category Taxonomy and Pipeline Model

## Status

Accepted

## Context

The RANDSUM modifier system has 19 modifiers organized across a documentation taxonomy and a code taxonomy that share names but use different vocabularies and have never been formally reconciled. Five agents independently audited the codebase and converged on three findings without coordination.

### Finding 1: Two category vocabularies with no shared type

`NotationDoc.category` (in `@randsum/roller/docs`) and `TokenCategory` (in `@randsum/roller/tokenize`) each carry category strings, but `NotationDoc.category` is typed as `string` — a bare primitive with no constraint. The two systems agree by convention, not by type. Any rename or addition in one system does not propagate errors to the other.

The current seven category values used across both systems are:

| Value | Used for |
|---|---|
| `'Core'` | The fundamental `xDN` dice notation |
| `'Special'` | Special die types (`d%`, `dF`, `zN`, `gN`, `DDN`) and `wildDie` modifier; also `xN` repeat operator |
| `'Pool'` | Pool modifiers: drop, keep, reroll, replace, cap, unique |
| `'Explode'` | Explosion mechanics: explode, compound, penetrate, explodeSequence |
| `'Arithmetic'` | Numeric operations: plus, minus, multiply, multiplyTotal, integerDivide, modulo |
| `'Counting'` | Count-based operations and their sugar forms (count, S{..}, F{..}, ms{..}) |
| `'Order'` | Ordering operations: sort |

### Finding 2: Two modifiers are misclassified

**`cap` and `replace` are labeled `'Pool'`** in both `capSchema.docs` and `replaceSchema.docs`, and in the tokenizer's `'C{..}'` and `'V{..}'` patterns. The `'Pool'` label implies membership change (dice added to or removed from the pool). `cap` and `replace` do not change pool membership — they transform die face values in place. These are value-level operations misclassified as pool-level operations.

**`wildDie` is labeled `'Special'`** alongside special die *types* (`d%`, `dF`). `wildDie` is a conditional modifier that at runtime either accumulates an explosion or removes the wild die from the pool. Labeling it `'Special'` conflates a structural modifier behavior with a die type category.

**`ms{N}` (Margin of Success) is labeled `'Counting'`** in its `docs` entry. It is sugar for subtraction — it deducts a target number from the total. It has no counting semantics; it belongs in `'Arithmetic'`.

### Finding 3: The three-stage pipeline model is implicit and undocumented

The priority ordering already encodes a three-stage execution pipeline. The boundaries between stages are not arbitrary — they are marked by capability flags in the modifier schema:

```
Stage 1 — Deterministic Value Shaping (priority 10-30)
  No randomness needed. Pure transforms over the rolls array.
  Modifiers: cap, drop, keep, replace
  Boundary signal: requiresRollFn absent or false

Stage 2 — Stochastic Pool Dynamics (priority 40-60)
  Introduces randomness. Every modifier here requires rollOne.
  Modifiers: reroll, explode, compound, penetrate, explodeSequence, unique, wildDie
  Boundary signal: requiresRollFn = true

Stage 3 — Total Derivation (priority 80-100)
  Operates on the total, not the pool. Pool is frozen after Stage 2.
  Modifiers: count, multiply, plus, minus, integerDivide, modulo, multiplyTotal, sort
  Boundary signal: mutatesRolls = false (sort and count use this channel)
```

`ModifierApplyResult` exposes two output channels that never overlap within a single modifier:

1. **Pool channel** (`rolls`) — modifiers that transform the dice array
2. **Total channel** (`transformTotal`) — modifiers that transform the computed sum

`count` is a structural outlier: it passes `rolls` through unchanged, uses `transformTotal`, but replaces the aggregation model (sum → cardinality) rather than adjusting the sum arithmetically. It is neither a pool modifier nor a pure arithmetic modifier.

`sort` has zero effect on the computed total. It reorders the rolls array for display purposes only. Its `mutatesRolls` annotation is absent in the current code, which causes the registry to treat it as a pool-mutating modifier and generate a frequency-diff log entry. This is incorrect behavior.

`count` is missing `mutatesRolls: false`, which causes the registry to generate a frequency-diff log entry for a modifier that passes rolls through unchanged. This is a bug.

### Finding 4: Breaking-change surface is non-trivial

Three separate consumers pattern-match on the current category string values:

- `packages/dice-ui/src/TokenOverlayInput.tsx` — emits `du-token--${token.category}` CSS class names. Renaming any value silently produces an unhandled CSS class.
- `packages/dice-ui/src/NotationRoller.tsx` — emits `du-nr-desc-chip--${token.category}` CSS class names. Same silent regression risk.
- `apps/playground/src/components/notationInputUtils.ts` — exhaustive switch over all seven current `TokenCategory` values. Renaming any value causes the switch's default branch to trigger for affected tokens.
- `apps/playground/__tests__/NotationInput.test.ts` — hardcodes all current category string values. Renaming breaks tests.

These consumers are all internal to the monorepo. External consumers of `@randsum/roller/docs` who filter `MODIFIER_DOCS` by `category` string are also affected by any value rename.

## Decision

### Phase 1 — Bug fixes (non-breaking, internal correctness)

Fix three confirmed implementation bugs before touching any category values:

1. **Add `mutatesRolls: false` to `countModifier`** — count passes rolls through unchanged and uses only `transformTotal`. Without this flag, the registry generates a frequency-diff log entry that computes a spurious empty diff.

2. **Fix `explodeSequence` to use `rollOne` instead of `ctx.randomFn ?? Math.random`** — explodeSequence is the only Stage 2 modifier that bypasses the `rollOne` abstraction and accesses the raw random function directly. This breaks seeded random behavior for tests and any consumer passing a custom `randomFn`.

3. **Move `ms{N}` from `category: 'Counting'` to `category: 'Arithmetic'` in its `docs` entry** — `ms{N}` is sugar for subtraction. Its Counting label is semantically wrong. Because `ms{N}` maps to the `minus` modifier at parse time and does not appear as its own `TokenCategory` value in the tokenizer, this change updates only the static docs array and does not affect `TokenCategory`.

### Phase 2 — Typed union introduction (non-breaking, type hardening)

Introduce a `ModifierCategory` typed union over the existing seven category string values:

```typescript
export type ModifierCategory =
  | 'Core'
  | 'Special'
  | 'Pool'
  | 'Explode'
  | 'Arithmetic'
  | 'Counting'
  | 'Order'
```

Replace `readonly category: string` on `NotationDoc` with `readonly category: ModifierCategory`. Align `TokenCategory` in `tokenize.ts` to use `ModifierCategory` rather than declaring its own union. This is a non-breaking type change — no string values change, only the constraint tightens.

This phase delivers immediate value: IDE completions, compile-time safety for future modifier authors, and a single authoritative definition for both the docs and tokenizer vocabularies.

### Phase 3 — Category value corrections (breaking, minor version bump required)

After Phase 2 establishes the typed union, correct the two confirmed misclassifications:

- Reclassify `cap` and `replace` from `'Pool'` to a new value: `'Value'`. The name reflects the actual operation — value-level clamping and substitution — and distinguishes it from pool-membership operations (drop, keep, reroll, unique).

- Reclassify `wildDie` from `'Special'` to `'Macro'`. `wildDie` is a conditional modifier that branches at runtime to either ACCUMULATE or FILTER behavior. It is not a die type. The `'Macro'` label matches the taxonomy established in the prior four-expert notation primitives debate (`memory/notation-primitives-vs-sugar.md`).

- Add `'Value'` and `'Macro'` to the `ModifierCategory` union and remove the values that no longer apply to any modifier (if `'Special'` retains only die types after wildDie moves out, it stays; if not, evaluate).

This phase requires updating:

- `capSchema.docs` and `replaceSchema.docs` — category value change
- `wildDieSchema.docs` — category value change
- `tokenize.ts` token patterns for `'C{..}'`, `'V{..}'`, and `'W'` — category value change
- `dice-ui` CSS class names: `du-token--Pool` → `du-token--Value`, `du-token--Special` (wildDie) handled by new `du-token--Macro`
- Playground `notationInputUtils.ts` — exhaustive switch updated to include new values
- Playground tests — hardcoded category assertions updated
- `RANDSUM_DICE_NOTATION.md` — category column in modifier tables updated
- Roller `CLAUDE.md` — category value list updated

Phase 3 ships as a standalone minor-version bump with explicit migration notes. The PR must be labeled `breaking-change` and must include a migration note listing every renamed value.

### Pipeline documentation (shipped alongside Phase 2)

Document the three-stage pipeline model in `RANDSUM_DICE_NOTATION.md` and roller `CLAUDE.md`. Add TSDoc to `ModifierApplyResult` explaining the two-channel architecture (`rolls` pool channel vs `transformTotal` total channel). Document that `sort` has no effect on the computed total.

The pipeline documentation uses structural stage names in developer-facing docs (Value Shaping / Pool Dynamics / Total Derivation) and verb-based names in user-facing notation spec sections (Shape / Resample / Calculate). These are different audiences with different mental models.

## Consequences

### Positive

- `ModifierCategory` typed union provides compile-time enforcement. Future modifier authors receive an IDE error if they assign an unknown category string.
- `cap` and `replace` are correctly distinguished from pool-membership modifiers. Downstream consumers (UI, playground, docs sites) can render value-shaping modifiers with different treatment than pool-resizing modifiers.
- `wildDie` is correctly distinguished from special die types. Consumers that filter `MODIFIER_DOCS` by category to render die type selectors will no longer see the wild die modifier mixed in with die types.
- The three-stage pipeline model, once documented, gives modifier authors a mental model that matches the machine. The `requiresRollFn` and `mutatesRolls` flags become understandable as stage boundary signals rather than unexplained optional properties.
- Bug fixes in Phase 1 (count `mutatesRolls`, explodeSequence `rollOne`, ms{N} category) close correctness gaps that affect log output quality and seeded-random reproducibility.

### Negative

- Phase 3 is a breaking change for any consumer of `@randsum/roller/docs` or `@randsum/roller/tokenize` that pattern-matches on `'Pool'` or `'Special'` category strings. Internal consumers (dice-ui, playground) must be updated in the same PR.
- CSS class names generated from `token.category` will change for cap, replace, and wildDie tokens. Existing stylesheets using `du-token--Pool` or `du-token--Special` (for wildDie) will produce unstyled tokens for affected notation until updated. There is no runtime warning.
- The `'Value'` and `'Macro'` category values have no prior established meaning in the RANDSUM ecosystem. Consumers who have built tooling against the category vocabulary will need documentation updates alongside the code changes.
- `sort`'s category classification remains unresolved in this ADR. It sits in Stage 3 by priority but has no effect on the computed total and is arguably a presentational modifier. Whether sort moves to a new `'Display'` category or remains in `'Order'` is deferred to the Phase 3 PR author, who must evaluate against the dice-ui and playground blast radius at that time.

### Non-decisions (deferred)

- **Verb taxonomy as navigation model** — whether to restructure `RANDSUM_DICE_NOTATION.md` sections around the seven-verb taxonomy (CLAMP, MAP, FILTER, SUBSTITUTE, GENERATE, ACCUMULATE, SCALE) rather than the category taxonomy is deferred to a follow-up documentation design session.
- **`count` structural outlier** — whether `count` deserves its own `'Reinterpret'` category (it changes what the total *means*, not what it *is*) is deferred. The current `'Counting'` label is inaccurate but functional. Renaming it is an additional breaking change that should not ride with Phase 3.
- **`multiply`/`multiplyTotal` DRY** — consolidation of structurally-identical multiply behaviors is tracked separately and does not affect the category taxonomy.

## References

- Brainstorm: `/Users/jarvis/.scram/brainstorm--RANDSUM--modifier-taxonomy--20260320-065532/options.md`
- Synthesis: `/Users/jarvis/.scram/brainstorm--RANDSUM--modifier-taxonomy--20260320-065532/discussion/synthesis.md`
- ADR-006: Notation Scope Boundary — governs what belongs in the modifier system at all
- ADR-007: Modifier Co-Location — establishes the one-file-per-modifier structure this ADR builds on
- Memory: `notation-primitives-vs-sugar.md` — prior four-expert debate establishing Macro as a classification
- `packages/roller/src/modifiers/schema.ts` — `ModifierApplyResult`, `ModifierBehavior`, `mutatesRolls` flag
- `packages/roller/src/notation/tokenize.ts` — `TokenCategory` current union definition
