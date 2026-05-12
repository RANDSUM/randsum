# Roller Engine Quality Audit

_Dimension: @randsum/roller engine quality_
_Date: 2026-05-10_
_Auditor: Claude Sonnet 4.6_

---

## Summary

`@randsum/roller` is a well-engineered, production-quality dice engine. The modifier co-location pattern (ADR-007) is cleanly implemented, the error hierarchy is actionable, security bounds are in place, and the 109-test suite covers all critical paths. The findings below are genuine issues — not hypothetical concerns — but none are blocking for the current 1.3.0 release.

---

## Findings

### F1 — P1: Basic explode (`!`) is single-wave, not recursive — behavioral divergence from VTT ecosystem

**File:** `packages/roller/src/modifiers/explode.ts`, line 109

**Summary:** The `!` modifier applies exactly one generation of explosions. If a newly-added die also rolls max, it does not explode again. This is explicitly tested as "no chaining" (explosion.depth.test.ts:57), so it is intentional, but it diverges from the majority of VTT implementations (Foundry, Roll20, Dice So Nice) where `!` is recursive until no die hits max. Compound (`!!`) provides the recursive variant, but notation users who type `3d6!` expecting chaining will get unexpected results. The spec should prominently document this deviation, and the docs `NotationDoc` for `!` should call it out. Currently the description says "Continues if new dice also max" — which is factually incorrect for the base `!` modifier.

**Action:** Correct the `!` modifier's `description` field in `explodeSchema.docs` to accurately state the single-wave behavior, or add a `note` in `forms`. If chaining is the desired behavior, implement it; if single-wave is intentional, update the notation spec accordingly.

---

### F2 — P1: `registry.parseModifiers` is an exported dead letter — confused dual-implementation

**File:** `packages/roller/src/modifiers/registry.ts`, line 54–65

**Summary:** The registry exports a `parseModifiers` function that uses `RANDSUM_MODIFIERS` (behavior-bearing modifier definitions) to parse notation strings. The actual parse path used by `singleNotationToOptions` goes through `notation/parse/parseModifiers.ts`, which uses the schema-only `MODIFIER_SCHEMAS` list (tree-shaking safe). The registry version is tested in `ModifierEngine.test.ts` and `registry.test.ts` as if it is the canonical parser, but it is not invoked from any production code path. The two implementations can drift: for example, the notation-layer `parseModifiers` handles count-family sugar (`S{}`, `F{}`, `ms{}`) and duplicate count detection, while the registry version does not. Any caller who imports from registry (e.g., external consumers) gets a subtly different parser.

**Action:** Either: (a) remove `export function parseModifiers` from `registry.ts` and update tests to use `notation/parse/parseModifiers`, or (b) explicitly document which is the canonical parser and why both exist. Option (a) is strongly preferred — the registry should not expose a parse function.

---

### F3 — P1: `explodeSequence` accesses `ctx.randomFn` directly but declares `requiresRollFn: true` — type contract mismatch

**File:** `packages/roller/src/modifiers/explodeSequence.ts`, lines 127, 139–141

**Summary:** `explodeSequenceModifier` sets `requiresRollFn: true`, causing the registry to validate that `ctx.rollOne` exists. However, inside `apply()`, it ignores `ctx.rollOne` entirely and accesses `ctx.randomFn` directly (to build a sized roll function for different die sizes). The `ModifierContext` type declares `randomFn` as optional, so nothing guarantees it is present. In the production pipeline it is always set alongside `rollOne`, but the type system allows a direct call to `applyModifier('explodeSequence', ...)` with only `rollOne` provided (which passes the registry guard), whereupon the `ctx.randomFn === undefined` branch throws a raw `Error` (not a `ModifierError`). Additionally, `requiresRollFn: true` misleadingly implies `rollOne` is needed, when what is actually needed is `randomFn`.

**Action:** Change `requiresRollFn: true` to a new `requiresRandomFn: true` guard (or expand `ModifierContext` typing), and add `randomFn` to the registry's requirement validation. Alternatively, rework `explodeSequence` to derive the sized roll from `rollOne` + `parameters.sides` similarly to how `explodeModifier` does it.

---

### F4 — P2: `!` explosion pool has no size cap — potential DoS with high-quantity + all-max RNG

**File:** `packages/roller/src/modifiers/explode.ts`, line 109

**Summary:** Bounds exist for `quantity` (MAX_QUANTITY = 10,000) and `sides` (MAX_SIDES = 1,000,000), but the post-explosion pool size is not capped. With `10000d6!` and an adversarial RNG returning max on all dice, the explosion step generates 10,000 additional dice, producing a final pool of 20,000 numbers. In practice this is low-risk (the random channel controls it and 20K integers is fast), but compound/penetrate/explodeSequence all have depth limits while basic `!` has none. The asymmetry is undocumented. A contrived `10000d2!` (50% explosion rate, always-max) would statistically hover around 20,000 dice.

**Action (P2):** Add an optional post-explosion pool cap (e.g., `MAX_QUANTITY * 2`) with a descriptive error, or document the absence of a cap explicitly in the spec and security model. If the cap is added, add a security test to `__tests__/security/bounds.test.ts`.

---

### F5 — P2: `traceRoll` silently drops `integerDivide` and `modulo` from arithmetic step display

**File:** `packages/roller/src/trace/traceRoll.ts`, lines 16–21

**Summary:** `ARITHMETIC_MODIFIERS` in `traceRoll.ts` recognizes `plus`, `minus`, `multiply`, and `multiplyTotal` as arithmetic steps, producing `kind: 'arithmetic'` trace entries. `integerDivide` and `modulo` are both `mutatesRolls: false` total transformers that use `createScaleBehavior`, but they are absent from `ARITHMETIC_MODIFIERS`. When a roll uses `//N` or `%N`, the modifier log entry exists but `traceRoll` falls into the default "rolls step" branch, which incorrectly tries to compute a `unchanged/removed/added` diff for a modifier that never touched the dice pool — producing a misleading empty diff step. The `trace.test.ts` does not test `integerDivide` or `modulo`.

**Action:** Add `integerDivide` and `modulo` (with appropriate sign characters `÷` and `%`) to the `ARITHMETIC_MODIFIERS` map in `traceRoll.ts`. Add test cases to `trace.test.ts` for both.

---

### F6 — P2: `notation()` (assert form of `isDiceNotation`) is not exported from the main barrel

**File:** `packages/roller/src/index.ts`

**Summary:** `isDiceNotation` (type guard) is exported from the main barrel. The companion `notation(input)` (throws `NotationParseError` if invalid, returns typed `DiceNotation`) is exported only from `validate.ts` and therefore only from the `@randsum/roller/validate` subpath. The ERROR_REFERENCE.md showcases `notation()` prominently as the primary assert API, but consumers importing from the root `@randsum/roller` barrel cannot reach it without a second subpath import. This is a discoverability gap — the pattern `import { roll, notation } from '@randsum/roller'` fails silently with a type error.

**Action:** Export `notation` from `src/index.ts` alongside `isDiceNotation`. It is already re-exported from `validate.ts` so the only change is one line in `index.ts`. Low risk.

---

### F7 — P2: `parseArguments.ts` contains multiple `as RollParams<T>` and `as DiceNotation` casts on constructed strings

**File:** `packages/roller/src/roll/parseArguments.ts`, lines 126, 129, 141, 154, 168, 184, 194, 197, 207

**Summary:** Special-die param builders (`parseFateDieParams`, `parseZeroBiasDieParams`, `parseCustomFacesDieParams`, `parseDrawDieParams`, `parseGeometricDieParams`) all construct `notation` strings with template literals and then cast them `as DiceNotation`. These are safe in practice because the strings are well-formed, but they bypass the `isDiceNotation` type guard. Similarly, `{ ... } as RollParams<T>` casts occur at several call sites. The `faces[roll - 1] as T` cast in `pipeline.ts` line 190 accesses a `noUncheckedIndexedAccess` array with no bounds check, meaning if `initialRolls` contains a value outside `[1, faces.length]`, the result is `undefined` cast to `T`. The CLAUDE.md bans `as unknown as T` but these inline `as T` casts on potentially undefined values are functionally equivalent for the `faces` access.

**Action (P2):** The `faces[roll - 1]` access is the only real risk. Add a bounds guard: `faces[roll - 1] ?? faces[0]` or throw on out-of-range. The `as DiceNotation` casts on constructed strings are low risk; alternatively use `notation(string)` to get type safety at a small perf cost. The `as RollParams<T>` casts are inherent to TypeScript's generic constraints here — acceptable as-is.

---

### F8 — P3: Benchmark suite covers only happy-path notation — no property-based modifier stress tests

**File:** `packages/roller/__benchmarks__/roll.bench.ts`

**Summary:** The benchmark covers `roll(20)`, `roll("1d20")`, `roll({ sides: 20 })`, `roll("4d6L")`, `roll("2d20H")`, `roll("4d6R{1}")`, `roll("10d6!")`, and two `validateNotation` calls. The 5 property test files cover range correctness and notation roundtrips. However, there are no property tests for modifier interactions (e.g., `cap + reroll + explode`), no benchmark for the modifier registry hot path, and no benchmark for `isDiceNotation` (which rebuilds a cached regex on first call and resets `lastIndex` on every call via `getCompleteNotationPattern()`). The benchmark file also uses `process.argv` for CI detection, which is Node-ism inconsistent with the Bun-first codebase.

**Action (P3):** Add a `validateNotation` property test covering a wider input space (fast-check string generators). Add a modifier-interaction property test. Replace `process.argv` with `Bun.argv` or an env var. These are enhancements, not regressions.

---

### F9 — P3: Modifier schema duplication across `src/modifiers/` and `src/notation/definitions/` is a maintenance burden

**File:** `packages/roller/src/modifiers/*.ts` vs `packages/roller/src/notation/definitions/*.ts`

**Summary:** Each modifier exists in two locations: `src/modifiers/<mod>.ts` (co-located schema + behavior, used by the roll path) and `src/notation/definitions/<mod>.ts` (schema-only copy, used by the tokenize-safe parse path). The CLAUDE.md's "Tokenize Isolation Invariant" explains why: ESM tree-shaking eliminates the behavior from the tokenize bundle. However, there are 21 modifier schemas in `notation/definitions/index.ts` and 19 modifiers in `RANDSUM_MODIFIERS`. The `notation/definitions/` directory has three extras not in the modifier registry: `countSuccesses`, `countFailures`, and `arithmetic` (a schema-only artifact). Any modifier addition now requires touching two files (the co-located file and `notation/definitions/<mod>.ts`), contradicting the "single-file operation" claim in CLAUDE.md. This was noted in ADR-007 as an intentional tradeoff.

**Action (P3):** Consider whether the `notation/definitions/` directory can be eliminated by sourcing schema data directly from the co-located `<mod>Schema` exports, relying entirely on ESM tree-shaking for isolation. The size-limit CI gate on `dist/tokenize.js` is the enforcement mechanism. Evaluate after confirming that Bun's bundler tree-shakes the behavior exports cleanly. If the dual-location is kept, update CLAUDE.md to remove the "single-file operation" claim.

---

## Non-Findings (explicitly checked, not flagged)

- **Type safety (index.ts barrel):** No `any`, no `as unknown as T`. The banned casts are not present. The `as ModifierDefinition` casts in `definitions.ts` are necessary to homogenize the typed-generic array and are not a correctness risk.
- **Error hierarchy:** `RandsumError` → `NotationParseError` / `ValidationError` / `ModifierError` / `RollError`. Every thrown error carries a `code` and structured `context`. Messages are actionable and include the offending value and field path.
- **Security bounds:** `MAX_QUANTITY` (10,000), `MAX_SIDES` (1,000,000), `MAX_REPEAT_COUNT` (1,000), `MAX_REPEAT_DEPTH` (10), `MAX_REROLL_ATTEMPTS` (99), geometric die capped at 1,000 iterations per sequence, notation length capped at 1,000 chars. These are well-tested in `__tests__/security/`.
- **Parser edge cases:** `roll('')` → `ValidationError` (empty notation fails `isDiceNotation`). `roll('1d')` → `ValidationError` (no sides). `roll('0d6')` → not valid notation (coreNotationPattern requires `[1-9]` for quantity). `roll('1d6+')` → `ValidationError` (incomplete modifier, `+` prefix requires a number). These are covered in `isDiceNotation.comprehensive.test.ts`.
- **Modifier self-containment:** Every modifier file in `src/modifiers/` exports exactly `<mod>Schema` and `<mod>Modifier`. The schema carries `name`, `priority`, `pattern`, `parse`, `toNotation`, `toDescription`, and `docs`. The modifier adds `apply`, optional `validate`, and context requirement flags. Pattern is consistent across all 19 modifiers.
- **Trace subpath:** `traceRoll` and `formatAsMath` are used by `apps/cli` (dice-ui) and `apps/expo` for step-by-step visualization. Worth retaining at the 5KB cost. The `kind: 'divider'` step type is in the discriminated union but never emitted by `traceRoll` — either remove it or implement it.
- **Benchmark regression detection:** `bun run bench` produces JSON when `--json` is passed, used in CI for performance tracking. The pipeline is functional.

---

## Risk Table

| ID  | Priority | Area             | One-line summary                                                                   |
| --- | -------- | ---------------- | ---------------------------------------------------------------------------------- |
| F1  | P1       | Spec conformance | `!` is single-wave, doc says "continues if new dice also max" — incorrect          |
| F2  | P1       | Architecture     | `registry.parseModifiers` is exported but unused dead code — dual-parser confusion |
| F3  | P1       | Type safety      | `explodeSequence` requires `randomFn` but guard checks `rollOne` — mismatch        |
| F4  | P2       | Security         | No post-explosion pool size cap for base `!` modifier                              |
| F5  | P2       | Correctness      | `integerDivide` / `modulo` produce wrong trace step type in `traceRoll`            |
| F6  | P2       | API surface      | `notation()` assert function not exported from main barrel                         |
| F7  | P2       | Type safety      | `faces[roll - 1] as T` in pipeline is an unchecked index access                    |
| F8  | P3       | Testing          | Benchmarks and property tests have coverage gaps                                   |
| F9  | P3       | Maintainability  | Dual schema locations (modifiers/ + notation/definitions/) contradict CLAUDE.md    |
