# Extending the Codegen Pipeline

Audience: contributors changing `@randsum/games` internals — adding a new
resolution strategy, a new condition shape, a new pool variant, or any other
feature that lives in `.randsum.json`. For adding a *game* (consumer of the
existing schema), see `packages/games/CLAUDE.md`.

This guide assumes you already understand what a `.randsum.json` spec looks
like. If not, skim `packages/games/blades.randsum.json` first — it exercises
`$ref`, `when`, `tables`, and `outcomes` in ~65 lines.

## 1. Pipeline overview

```
  .randsum.json  ──►  Ajv validate (validator.ts)  ──►  resolveExternalRefs
                                                        (externalRefResolver)
                                 │                                │
                                 ▼                                ▼
                        ┌────────────────────────────────────────────┐
                        │       normalizeSpec  (normalizer.ts)       │
                        │  • resolvePoolRef  / resolveTableRef       │
                        │  • resolveOutcomeRef                       │
                        │  • tagged unions (NormalizedDetailsField)  │
                        └────────────────┬───────────────────────────┘
                                         │ NormalizedSpec
                       ┌─────────────────┴─────────────────┐
                       ▼                                   ▼
          ┌────────────────────────┐        ┌──────────────────────────┐
          │ Codegen (build time)   │        │ Runtime pipeline         │
          │ src/lib/codegen.ts     │        │ src/lib/pipeline.ts      │
          │   ├─ emitBody.ts       │        │ used by loadSpec /       │
          │   ├─ emitModifiers.ts  │        │ loadSpecAsync            │
          │   ├─ emitOutcome.ts    │        │ (no code emission —      │
          │   ├─ emitDetails.ts    │        │  direct interpretation)  │
          │   └─ emitHelpers.ts    │        │                          │
          └─────────┬──────────────┘        └────────────┬─────────────┘
                    ▼                                    ▼
          src/<shortcode>.generated.ts            GameRollResult<...>
          (checked in, prettier-formatted)
```

The **same IR** is consumed by two sinks:

1.  **Codegen** (`codegen.ts`) turns it into a `.ts` file with a typed
    `roll()` export. This is the production path that ships to consumers.
2.  **Runtime** (`pipeline.ts`) interprets it directly, used by `loadSpec()`
    for hot-loading specs in the CLI playground and tests.

Both sinks must keep behaviour in sync. Whenever you extend the IR, touch
both — codegen makes the feature real for published games, and pipeline
keeps `loadSpec()` honest.

## 2. Key files

All paths are relative to `packages/games/`.

| File | Role |
|------|------|
| `randsum.json` | Ajv meta-schema. Declared `$id`: `https://randsum.dev/schemas/v1/randsum.json`. Single source of truth for spec shape. |
| `src/lib/types.ts` | TypeScript mirror of the meta-schema (`RandSumSpec`, `RollDefinition`, `ResolveOperation`, …). |
| `src/lib/validator.ts` | Ajv compile-time validator (~27 lines). Returns structured `ValidationError[]`. |
| `src/lib/externalRefResolver.ts` | Resolves HTTP `$ref` URLs *before* validation/normalization. |
| `src/lib/normalizedTypes.ts` | IR types (`NormalizedSpec`, `NormalizedRollDefinition`, `NormalizedResolveOperation`, `NormalizedOutcome`, `NormalizedDetailsFieldDef`). ~130 lines — read this first. |
| `src/lib/normalizer.ts` | Pure function `normalizeSpec(spec: RandSumSpec): NormalizedSpec`. Resolves every `$ref`, collapses sugar, tags discriminated unions with `kind`. |
| `src/lib/refResolver.ts` | Typed `$ref` resolvers. Three entry points: `resolvePoolRef`, `resolveTableRef`, `resolveOutcomeRef`. Each narrows to its target type or throws `SchemaError('REF_NOT_FOUND')`. ~83 lines. |
| `src/lib/typeGuards.ts` | `getRollDefinitions(spec)` (returns `{ roll: spec.roll }`), plus `isDetailsLeaf` / `isConditionalDetails` / `isInputRef` / `isConditionalRef`. |
| `src/lib/codegen.ts` | `generateCode(spec, options)` — top-level codegen entry. Detects `remoteTableLookup`, fetches or reads remote data, strips unused fields, assembles imports, delegates per-roll emission. |
| `src/lib/codegen/emitBody.ts` | `generateRollParts(key, rollDef, …)`. Emits the function body, overloads, and result type. Delegates to `emitModifiers`, `emitOutcome`, `emitDetails`. |
| `src/lib/codegen/emitModifiers.ts` | Translates `modify[]` entries to roller `RollOptions.modifiers` literals. |
| `src/lib/codegen/emitOutcome.ts` | Emits outcome-classification logic (`ranges` / `degreeOfSuccess` / `tableLookup` / result-mapping leaves). |
| `src/lib/codegen/emitDetails.ts` | Emits the `details` object interface + runtime construction. |
| `src/lib/codegen/emitHelpers.ts` | Helpers shared across emitters: `integerOrInputCode`, `collectResults`, `buildInputType`, `getSingleInputOverload`, `needsValidationImports`, `generateValidationLines`. **~250 lines — most of the codegen's intelligence lives here.** |
| `src/lib/pipeline.ts` | Runtime interpreter over `NormalizedSpec`. Mirrors every emitter's semantics. |
| `src/lib/errors.ts` | `SchemaError` + `SchemaErrorCode` union: `REF_NOT_FOUND`, `INPUT_NOT_FOUND`, `INVALID_INPUT_TYPE`, `NO_TABLE_MATCH`, `CONDITION_TYPE_MISMATCH`, `INVALID_SPEC`, `EXTERNAL_REF_FAILED`. |
| `codegen.ts` (package root) | CLI driver. Reads `*.randsum.json`, runs validation → external refs → `generateCode` → prettier → writes `src/<shortcode>.generated.ts`. Supports `--check` (CI freshness). |

Anchor points you will almost certainly touch when extending the pipeline:

-   `randsum.json` → add meta-schema branch
-   `src/lib/types.ts` lines 100–118 (`ResolveOperation`, `OutcomeOperation`)
-   `src/lib/normalizedTypes.ts` lines 31–46 (normalized resolve / outcome)
-   `src/lib/normalizer.ts` `normalizeResolveOperation` (lines 71–83) and
    `normalizeOutcome` (lines 85–102)
-   `src/lib/codegen/emitBody.ts` — `generateFunctionBody` (single-pool) at
    lines 151–288 and `generateMultiPoolBody` (lines 28–149)
-   `src/lib/codegen/emitHelpers.ts` `collectResults` (lines 142–175) and
    `getOutcomeRanges` (lines 99–104)
-   `src/lib/pipeline.ts` `resolveTotal` (lines 193–208), `applyOutcome`
    (lines 258–278)

## 3. The NormalizedRollDefinition IR

Defined in `src/lib/normalizedTypes.ts`. The headline type:

```ts
export interface NormalizedRollDefinition {
  readonly inputs?: Readonly<Record<string, InputDeclaration>>
  readonly dice?: NormalizedDiceConfig | readonly NormalizedDiceConfig[]
  readonly dicePools?: Readonly<Record<string, NormalizedDiceConfig>>
  readonly conditionalPools?: Readonly<Record<string, NormalizedConditionalPool>>
  readonly modify?: readonly ModifyOperation[]
  readonly postResolveModifiers?: readonly PostResolveModifyOperation[]
  readonly resolve: NormalizedResolveOperation
  readonly outcome?: NormalizedOutcome
  readonly when?: readonly NormalizedRollCase[]
  readonly details?: Readonly<Record<string, NormalizedDetailsFieldDef>>
}
```

### What it models

A **ref-free, normalized** view of one roll definition. After normalization:

-   Every `$ref` has been inlined. No downstream code needs access to the
    parent `RandSumSpec`.
-   Every pool is materialized as `NormalizedPoolDefinition` with literal
    `sides`/`quantity` (still may contain `$input` refs — those are resolved
    at call time, not spec-parse time).
-   Tagged unions use a `kind` discriminant. See
    `NormalizedDetailsFieldDef` (`'leaf' | 'nested' | 'conditional'`).
-   `conditionalPools` is keyed by string names (the spec's array indices
    were converted to name-keys during the March 2026 codegen refactor —
    see MEMORY on `jarvis/schema` branch).

### Why it exists

Before the IR, both codegen and runtime had to re-resolve `$ref`s and
re-detect sugar. The normalizer is the **one** place that handles that,
which means:

1.  **Error locality.** `SchemaError('REF_NOT_FOUND')` is thrown once,
    from `refResolver.ts`, with the original `$ref` string in the message.
2.  **Exhaustiveness.** Emitters can switch on `resolve`/`outcome`/`kind`
    without worrying about the `Ref` shape sneaking through.
3.  **Testability.** `__tests__/lib/normalizer.test.ts` and
    `normalizerUnit.test.ts` assert the IR independently of emitters. Add
    a normalizer test before touching emit code — it fails fast.

### Dual-consumer contract

Both `codegen.ts` (compile-time) and `pipeline.ts` (runtime) take a
`NormalizedRollDefinition` and produce a result. They must agree on
semantics. The snapshot tests in `__tests__/lib/codegen-snapshots.test.ts`
guard codegen; the pipeline tests (`pipeline.test.ts`,
`conditionalPool.test.ts`, `remoteTableLookup.test.ts`, …) guard runtime.
Your extension needs entries in both.

## 4. Typed ref resolvers

`src/lib/refResolver.ts` is the only place allowed to turn a
`$ref` string into a runtime value. Three public resolvers:

```ts
export function resolvePoolRef(spec: RandSumSpec, ref: string): PoolDefinition
export function resolveTableRef(spec: RandSumSpec, ref: string): TableDefinition
export function resolveOutcomeRef(spec: RandSumSpec, ref: string): OutcomeOperation
```

All three delegate to a shared `resolveRef` that walks `#/<segment>/...`
pointers, plus a structural type guard. From `refResolver.ts`:

```ts
export function resolvePoolRef(spec: RandSumSpec, ref: string): PoolDefinition {
  const resolved = resolveRef(spec, ref)
  if (!isPoolDefinition(resolved)) {
    throw new SchemaError(
      `Ref "${ref}" does not resolve to a PoolDefinition (expected object with "sides")`,
      'REF_NOT_FOUND'
    )
  }
  return resolved
}
```

Note the structural check is intentionally minimal — Ajv has already
validated the whole spec, so `isPoolDefinition` only needs to guard against
a `$ref` pointing at the wrong section (e.g. `#/tables/foo` for a pool).

### Adding a new resolver kind

Say you want a new top-level section `curves` (custom probability curves)
referenced by `{ "$ref": "#/curves/gaussian" }`. Steps:

1.  **Meta-schema (`randsum.json`).** Add `curves` to the root `properties`
    with `additionalProperties` pointing at your new `$defs/CurveDefinition`.
2.  **`types.ts`.** Add `curves?: Readonly<Record<string, CurveDefinition>>`
    to `RandSumSpec`.
3.  **`refResolver.ts`.** Add:

    ```ts
    function isCurveDefinition(value: unknown): value is CurveDefinition {
      if (typeof value !== 'object' || value === null) return false
      return 'kind' in value && 'params' in value
    }

    export function resolveCurveRef(spec: RandSumSpec, ref: string): CurveDefinition {
      const resolved = resolveRef(spec, ref)
      if (!isCurveDefinition(resolved)) {
        throw new SchemaError(
          `Ref "${ref}" does not resolve to a CurveDefinition`,
          'REF_NOT_FOUND'
        )
      }
      return resolved
    }
    ```
4.  **`normalizer.ts`.** Import and call `resolveCurveRef` wherever the IR
    field that holds a curve allows `Ref`. Never call `resolveRef` directly
    from the normalizer — go through the typed resolver so the error message
    names the expected shape.
5.  **Test.** Add a `refResolver.test.ts` case for the happy path plus one
    for a ref pointing at the wrong section (expect
    `REF_NOT_FOUND`).

## 5. Worked example: a new `conditionalTableLookup` resolve strategy

**Scenario.** A game needs "if the pool sum is above a threshold, look up in
table A; otherwise, look up in table B." The existing `when` clause can
already swap *outcomes*, but `when` operates on *inputs*, not on resolved
dice totals. So we add a new resolve strategy instead.

Spec shape:

```json
{
  "resolve": {
    "conditionalTableLookup": {
      "threshold": 10,
      "above": { "$ref": "#/tables/dramaticSuccess" },
      "atOrBelow": { "$ref": "#/tables/mundane" }
    }
  }
}
```

The four-stage pipeline (Dice → Modify → **Resolve** → Outcome) means
`resolve` must collapse the pool into a `total`. Here, the branching
collapses into `total` *and* selects the outcome table in one step.

### Step 1: Meta-schema

Edit `randsum.json`. In `$defs/ResolveOperation.oneOf`, add a new branch:

```json
{
  "type": "object",
  "required": ["conditionalTableLookup"],
  "additionalProperties": false,
  "properties": {
    "conditionalTableLookup": {
      "type": "object",
      "required": ["threshold", "above", "atOrBelow"],
      "additionalProperties": false,
      "properties": {
        "threshold": { "$ref": "#/$defs/IntegerOrInput" },
        "above": { "$ref": "#/$defs/RefOrTableDefinition" },
        "atOrBelow": { "$ref": "#/$defs/RefOrTableDefinition" }
      }
    }
  }
}
```

Validation is now live. Run `bun run --filter @randsum/games test -- validator` — the existing `validator.test.ts` should still pass and an
invalid shape will surface at codegen time through `generateCode()`.

### Step 2: Types

In `src/lib/types.ts`:

```ts
export interface ConditionalTableLookupOperation {
  readonly threshold: IntegerOrInput
  readonly above: RefOrTableDefinition
  readonly atOrBelow: RefOrTableDefinition
}

export type ResolveOperation =
  | 'sum'
  | { readonly countMatching: CountMatchingOperation }
  | { readonly tableLookup: RefOrTableDefinition }
  | { readonly comparePoolHighest: ComparePoolOperation }
  | { readonly comparePoolSum: ComparePoolOperation }
  | { readonly remoteTableLookup: RemoteTableLookupOperation }
  | { readonly conditionalTableLookup: ConditionalTableLookupOperation }
```

### Step 3: IR

In `src/lib/normalizedTypes.ts`:

```ts
export interface NormalizedConditionalTableLookup {
  readonly threshold: IntegerOrInput
  readonly above: TableDefinition
  readonly atOrBelow: TableDefinition
}

export type NormalizedResolveOperation =
  | 'sum'
  | { readonly countMatching: CountMatchingOperation }
  | { readonly tableLookup: TableDefinition }
  | { readonly comparePoolHighest: ComparePoolOperation }
  | { readonly comparePoolSum: ComparePoolOperation }
  | { readonly remoteTableLookup: RemoteTableLookupOperation }
  | { readonly conditionalTableLookup: NormalizedConditionalTableLookup }
```

Note `above`/`atOrBelow` become `TableDefinition` (ref-free) in the IR —
the normalizer's job.

### Step 4: Normalizer

In `src/lib/normalizer.ts`, extend `normalizeResolveOperation`:

```ts
function normalizeResolveOperation(
  resolve: ResolveOperation,
  spec: RandSumSpec
): NormalizedResolveOperation {
  if (resolve === 'sum') return 'sum'
  if ('countMatching' in resolve) return { countMatching: resolve.countMatching }
  if ('tableLookup' in resolve) {
    return { tableLookup: normalizeTableDefinition(resolve.tableLookup, spec) }
  }
  if ('comparePoolHighest' in resolve) return { comparePoolHighest: resolve.comparePoolHighest }
  if ('comparePoolSum' in resolve) return { comparePoolSum: resolve.comparePoolSum }
  if ('remoteTableLookup' in resolve) return { remoteTableLookup: resolve.remoteTableLookup }
  return {
    conditionalTableLookup: {
      threshold: resolve.conditionalTableLookup.threshold,
      above: normalizeTableDefinition(resolve.conditionalTableLookup.above, spec),
      atOrBelow: normalizeTableDefinition(resolve.conditionalTableLookup.atOrBelow, spec)
    }
  }
}
```

`normalizeTableDefinition` already handles both inline tables and `$ref`s
via `resolveTableRef`. Reuse it.

### Step 5: Result-type collection

`collectResults` in `src/lib/codegen/emitHelpers.ts` (lines 142–175) decides
the TS type of the generated function's `result` field. For
`conditionalTableLookup`, the result is the union of both tables' `result`
strings. Extend:

```ts
export function collectResults(rollDef: NormalizedRollDefinition): CollectedResults {
  if (typeof rollDef.resolve === 'object' && 'remoteTableLookup' in rollDef.resolve) {
    return { kind: 'result-mapping' }
  }
  if (typeof rollDef.resolve === 'object' && 'conditionalTableLookup' in rollDef.resolve) {
    const ctl = rollDef.resolve.conditionalTableLookup
    const values = [
      ...new Set([
        ...ctl.above.ranges.map(r => r.result),
        ...ctl.atOrBelow.ranges.map(r => r.result)
      ])
    ].sort()
    return { kind: 'union', values }
  }
  // ... existing branches
}
```

### Step 6: Emit runtime code

In `src/lib/codegen/emitBody.ts`, inside `generateFunctionBody` — after the
`total` is computed and *before* the existing outcome-emission branch
(around line 252 where the `remoteTableLookup` branch lives):

```ts
if (typeof rollDef.resolve === 'object' && 'conditionalTableLookup' in rollDef.resolve) {
  const ctl = rollDef.resolve.conditionalTableLookup
  const threshold = integerOrInputCode(ctl.threshold, rollDef.inputs, optional)
  // Emit two sets of range checks behind a runtime branch.
  lines.push(`  if (total > ${threshold}) {`)
  lines.push(
    ...generateOutcomeLines(
      { ranges: ctl.above.ranges },
      '    ',
      'r.rolls',
      rollDef.inputs,
      optional,
      hasDetails
    )
  )
  lines.push(`  }`)
  lines.push(
    ...generateOutcomeLines(
      { ranges: ctl.atOrBelow.ranges },
      '  ',
      'r.rolls',
      rollDef.inputs,
      optional,
      hasDetails
    )
  )
  return lines
}
```

Reusing `generateOutcomeLines` is deliberate — it keeps range-matching
logic in one place and ensures `poolCondition` support carries over for
free. Don't hand-roll range comparisons in your new emitter.

### Step 7: Runtime pipeline

`src/lib/pipeline.ts` — extend `resolveTotal` to keep the current total as
a sum (the dice still sum as normal), then extend `applyOutcome` to branch
on the resolve kind when the outcome is implicit. Simplest approach:
instead of piping through `applyOutcome`, add a dedicated function and
route from the main pipeline:

```ts
function applyConditionalTableLookup(
  total: number,
  op: NormalizedConditionalTableLookup,
  preModifyRolls: readonly number[],
  workingRolls: readonly number[],
  input: RollInput
): string {
  const threshold = bindInteger(op.threshold, input)
  const ranges = total > threshold ? op.above.ranges : op.atOrBelow.ranges
  return lookupRanges(total, ranges, preModifyRolls, workingRolls, input)
}
```

Call it wherever the pipeline currently dispatches on `resolve`. The
pattern: if `'conditionalTableLookup' in resolve`, total is still `sum`,
but the outcome comes from this helper rather than `applyOutcome`. A roll
def with `conditionalTableLookup` should have *no* top-level `outcome`
(the meta-schema could enforce this with `allOf/if/then`, but a runtime
`SchemaError('INVALID_SPEC')` in the normalizer is also acceptable).

### Step 8: Tests

-   `__tests__/lib/normalizerUnit.test.ts` — one test that feeds a spec
    with `conditionalTableLookup` and asserts the IR has both tables
    resolved (no `$ref` left) and `threshold` preserved.
-   `__tests__/lib/codegenUnit.test.ts` — assert `generateCode()` emits
    both branches and the runtime `if (total > ...)`. Snapshot-style:
    ```ts
    const code = await generateCode(spec)
    expect(code).toContain('if (total > 10)')
    expect(code).toContain("result: 'dramatic'")
    expect(code).toContain("result: 'mundane'")
    ```
-   `__tests__/lib/pipeline.test.ts` — feed the same spec through
    `loadSpec` / `loadSpecAsync` and assert both branches fire under
    seeded random.
-   If a shipped game will use this, add a `.randsum.json` spec +
    corresponding `<shortcode>.test.ts` and `.property.test.ts` pair. The
    property test is where regressions hide.

## 6. Validation gates

Errors flow back to the spec author through three gates. Pick the right one.

### Gate 1 — Ajv schema validation (compile-time, cheapest)

`src/lib/validator.ts` compiles `randsum.json` once at module load. Any
violation produces a `ValidationError[]` with instance paths:

```ts
const ajv = new Ajv({ allErrors: true })
const _validate = ajv.compile(schema)
```

`codegen.ts` calls `validateSpec` first and exits with non-zero status
listing every error. Prefer this gate for structural constraints (required
fields, enum members, regex patterns, mutually-exclusive keys via `oneOf`
or `allOf/not`).

### Gate 2 — Normalizer (`SchemaError('REF_NOT_FOUND' | 'INVALID_SPEC')`)

For anything Ajv cannot express — most commonly a `$ref` that resolves to
the wrong section — throw `SchemaError` from the typed resolver or
normalizer. Never `throw new Error(...)`: the custom class carries a
discriminated `code` consumers can switch on.

The normalizer is also where you fail-closed on IR invariants you can't
express in JSON Schema (e.g. "a `conditionalTableLookup` roll must not
also declare a top-level `outcome`"):

```ts
if ('conditionalTableLookup' in rollDef.resolve && rollDef.outcome !== undefined) {
  throw new SchemaError(
    'conditionalTableLookup owns its outcome — remove `outcome` from the roll definition.',
    'INVALID_SPEC'
  )
}
```

Errors thrown here bubble up through `generateCode()`; `codegen.ts` at the
package root catches and prints them.

### Gate 3 — Generated code (`SchemaError('NO_TABLE_MATCH' | 'INVALID_INPUT_TYPE')`)

Runtime conditions that depend on user input at `roll(...)` call time. The
emitted code contains literal `throw new SchemaError(...)` expressions —
see `generateValidationLines` in `emitHelpers.ts` (line 215) and the
`No table entry matches total ${total}` template in `emitOutcome.ts`
(line 113).

### Error naming convention

Each gate's error message should include enough context to reproduce the
problem from spec source alone: the ref string, the path (Ajv supplies
`instancePath`), the input field name. Don't log — throw.

## 7. Testing conventions

### File layout

```
__tests__/lib/
  normalizer.test.ts            # IR shape, happy paths
  normalizerUnit.test.ts        # IR edge cases (one scenario per `describe`)
  codegen-snapshots.test.ts     # shipped specs vs. committed `.generated.ts`
  codegenUnit.test.ts           # generateCode() output strings
  emitUnit.test.ts              # emitter helpers in isolation
  refResolver.test.ts           # resolver behaviour
  pipeline.test.ts              # runtime over IR (end-to-end)
  validator.test.ts             # Ajv error messages
```

The split matters: snapshot tests block stale generated files during CI
(`gen:check`), while unit tests target specific emit branches. A feature
touched in `emitBody.ts` should get an entry in both `codegenUnit.test.ts`
(does the right string get emitted?) and `pipeline.test.ts` (does the
generated code — or the runtime interpreter — actually produce the right
`GameRollResult`?).

### Minimal spec skeleton used everywhere

From `codegenUnit.test.ts`:

```ts
const spec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'My Test',
  shortcode: 'test-mine',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { sides: 6 }, quantity: 4 },
    modify: [{ cap: { min: 2 } }],
    resolve: 'sum' as const
  }
}
const code = await generateCode(spec)
expect(code).toContain('cap: { lessThan: 2 }')
```

`shortcode` prefix `test-` keeps fixture specs from clashing with shipped
games. `$schema` is required by Ajv — every spec literal includes it.

### Property tests

Property tests (fast-check) cover invariants across the *call* surface of
the generated `roll()` function. Typical pattern in
`__tests__/<shortcode>.property.test.ts`:

```ts
fc.assert(
  fc.property(fc.integer({ min: 0, max: 6 }), rating => {
    const r = roll({ rating })
    expect(['critical', 'success', 'partial', 'failure']).toContain(r.result)
  }),
  { numRuns: stressIterations }
)
```

`stressIterations` is exported from `__tests__/stressIterations.ts` (9999
under CI, lower locally). When you add a new resolve strategy, add at
least one property test asserting the result union is closed.

### Codegen snapshots

`codegen-snapshots.test.ts` regenerates every shipped `.randsum.json` and
diffs against `src/<shortcode>.generated.ts`. If you change *any*
emitter's output (whitespace, ordering, identifier naming), all shipped
games need `bun run --filter @randsum/games gen` and the resulting
generated files go in the same commit. The `gen:check` CI job fails
otherwise.

## 8. Things not to do

**Don't bypass the IR with raw string manipulation.** The normalizer is
the only place that looks at `$ref`s; emitters only see
`NormalizedRollDefinition`. If you find yourself calling `isRef` or
`resolveRef` from inside an emitter, you're in the wrong layer.

**Don't inline runtime helpers into generated code.** If your new strategy
needs non-trivial logic (e.g. range-table binary search, bucket
interpolation), put it in `src/lib/` — a new file alongside
`lookupByRange.ts` — and import it from the generated code. `emitBody.ts`
already does this via:

```ts
if (hasRemote) {
  parts.push(`import { lookupByRange } from './lib/lookupByRange'`)
}
```

Only the smallest, inline-able expressions should be emitted as string
literals. Bundle-size limits (15 KB per game, 35 KB for `salvageunion`)
are enforced via size-limit; a helper file is amortized across every game
that uses the feature.

**Don't edit generated files.** `src/*.generated.ts` is output, not
source. The first two lines of every generated file say so. CI's
`gen:check` will revert you.

**Don't call `roll()` from `@randsum/roller/roll` directly in the
pipeline.** Runtime goes through `pipeline.ts`, which already imports
`roll`. Generated code imports `roll as executeRoll` — the alias is
deliberate so the public `roll` export in the generated module can shadow
without collision.

**Don't conflate "when" and new resolve strategies.** `when[]` handles
input-dependent pipeline overrides (e.g. "if rating is 0, use 2d6 keep
lowest"). If your extension branches on *resolved* dice totals, it belongs
in a new `resolve` kind or `outcome` shape, not in `when`.

**Don't skip the meta-schema.** TypeScript's type system cannot constrain
`.randsum.json` at load time — Ajv is the first line of defence. A
feature that types check in `types.ts` but isn't in `randsum.json` is
unreachable: `validateSpec` rejects it before `normalizeSpec` ever runs.
Add the schema branch first.

**Don't forget the runtime pipeline.** `pipeline.ts` is easy to overlook
because codegen ships generated code. But `loadSpec()` / `loadSpecAsync()`
interpret the IR directly (for the hot-loading CLI/playground). A feature
that only works in `.generated.ts` and not in the interpreter will silently
drop out of `loadSpec()` without a test failure — until someone tries it.
Always dual-implement.

**Don't use `any` or `as unknown as T`.** Both are ESLint-banned. Use the
existing structural type guards (`isRef`, `isPoolDefinition`, etc.) or add
a new one in the same style.

## Appendix: checklist for a new feature

1.  [ ] Extend `randsum.json` meta-schema. Add descriptions for every new
        property — the schema is the API surface specs authors see.
2.  [ ] Extend `src/lib/types.ts` with the public shape.
3.  [ ] Extend `src/lib/normalizedTypes.ts` with the IR shape (ref-free).
4.  [ ] Extend `src/lib/normalizer.ts` — resolve refs, tag unions, fail
        closed on invariants the schema can't express.
5.  [ ] Extend the relevant emitter(s) in `src/lib/codegen/`. Reuse
        helpers; don't duplicate range-matching or input-binding logic.
6.  [ ] Update `collectResults` in `emitHelpers.ts` if the feature changes
        the result type.
7.  [ ] Mirror semantics in `src/lib/pipeline.ts`.
8.  [ ] Unit-test the normalizer, emitters, and pipeline separately.
9.  [ ] If shipping a game that uses the feature: add the spec, run
        `bun run --filter @randsum/games gen`, commit the generated file,
        add `__tests__/<shortcode>.test.ts` and `.property.test.ts`.
10. [ ] Run `bun run check:all` from the repo root. `gen:check` runs
        inside it — stale generated files block the commit.
