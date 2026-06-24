# Maintainability

_Generated: 2026-06-23_
_Repos covered: randsum-monorepo (packages: roller, games, dice-ui; apps: cli, discord-bot, expo, site, rdn)_

## Summary

This is a well-maintained, highly modular TypeScript monorepo. The core `@randsum/roller` engine averages ~81 LOC/file with a one-file-per-modifier registry pattern that keeps the most-churned subsystem small and analysable; strict compiler flags (`isolatedDeclarations`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) plus an ESLint config banning `let`/`any`/`as unknown as` enforce consistency that most codebases only aspire to. Dead code is effectively nil — `knip` reports no unused files or exports (only three unused devDependencies). The two genuine maintainability drags are the React-Native UI library (`@randsum/dice-ui`), which carries seven `.tsx`/`.native.tsx` component pairs with massive divergence and two of the only three >500-LOC files in the repo, and the games codegen emitter (`emitBody.ts`), whose 157-line `generateFunctionBody` is the single most complex function in the tree. Neither is critical; both are leveraged, churned-but-contained refactor targets. **Overall grade: B+.**

**Overall grade:** B

## Framework anchors

- **ISO/IEC 25010 §6.5** — Maintainability (modularity, reusability, analysability, modifiability, testability).
- **ISO/IEC 5055** — Maintainability rules (function size, cyclomatic complexity, dead code / unreachable code).
- **Tornhill, _Your Code as a Crime Scene_** — churn × complexity hot-spot analysis (`git log` + file size heuristic).
- **Robert C. Martin package metrics** — instability/abstractness applied at the workspace-package level.

## Findings

### F1 — `@randsum/dice-ui` web/native component duplication

- **Severity:** Medium
- **Location:** `packages/dice-ui/src/QuickReferenceGrid.tsx:1` (983 LOC) and `packages/dice-ui/src/QuickReferenceGrid.native.tsx:1` (792 LOC), plus six other `.tsx`/`.native.tsx` pairs (`NotationRoller`, `NumericStepper`, `RollResultPanel`, `RollSteps`, `TokenOverlayInput`, `useTheme`).
- **Evidence:** A line-level diff of the two `QuickReferenceGrid` variants shows ~1,459 differing lines — the web and native implementations have diverged so far they are effectively two parallel components sharing a name, not a thin platform shim over shared logic. `dice-ui` is the only package with files exceeding 500 LOC (two of the repo's three), and it has the highest average file size (173 LOC/file vs. 81 for roller). These are the two largest non-generated files in the whole repo.
- **Impact:** Every behavioural change to a dice-UI component must be made twice and kept in sync by hand; divergence this wide means fixes silently land on only one platform. This is the repo's primary modifiability/duplication risk per ISO/IEC 25010 §6.5 (modularity) and ISO/IEC 5055 file-size rules. Note: a `.tsx`/`.native.tsx` split is an idiomatic React-Native pattern; the finding is the _size and divergence_, not the split itself.

### F2 — Oversized codegen function `generateFunctionBody`

- **Severity:** Medium
- **Location:** `packages/games/src/lib/codegen/emitBody.ts:162` (function spans ~157 lines; file is 405 LOC, the largest in `games/`).
- **Evidence:** `generateFunctionBody` is ~157 lines — the single longest function found in the codebase — and sits alongside `generateMultiPoolBody` (~132 lines) and `generateRollParts` (~86 lines) in the same file. Max indentation depth ~5 levels. Per ISO/IEC 5055-MN-FN-LOC, functions over 50 LOC are flagged maintainability defects; this one is >3x the threshold.
- **Impact:** This is string-emitting codegen (it builds the `.generated.ts` game files), so bugs here propagate to all eight game packages at once. Its length and nesting make the emitter the hardest part of the codegen pipeline to reason about and the riskiest to extend when adding a new game spec.

### F3 — Multi-pool notation parsing concentrates regex complexity

- **Severity:** Low
- **Location:** `packages/roller/src/roll/parseArguments.ts:1` (368 LOC, second-most-churned current file at 12 changes/2y).
- **Evidence:** The file hand-rolls multi-pool boundary detection with two interlocking `RegExp` constants (`MULTI_POOL_BOUNDARY`, `FIRST_POOL_PATTERN`) built from `String.raw` alternation lists, then walks `matchAll` results with index arithmetic (`firstSignedIdx`, `slice`) and several defensive `undefined` guards. It is dense but well-commented and decomposed into named helpers (`splitMultiPoolString`, etc.).
- **Impact:** This is inherent parsing complexity, not accidental — but it is both high-churn and the place where edge-case bugs in notation like `"1d20+2d6"` originate. It is the roller subsystem most worth additional property-test coverage (`fast-check`) rather than restructuring.

### F4 — High-churn roller barrels and shared type modules

- **Severity:** Low
- **Location:** `packages/roller/src/index.ts` (24 changes/2y), `packages/roller/src/roll/index.ts` (23), and the `packages/roller/src/types/*` cluster (`index.ts` 14, `core.ts` 14, `results.ts` 13, `modifiers.ts` 13).
- **Evidence:** The top current-file churn is dominated by barrel re-export files and the shared `types/` directory — files that change whenever any export surface or type shifts. These are low-complexity (barrels are flat re-exports) so they are not hot-spots in Tornhill's churn×complexity sense, but the type cluster is a fan-in concentration point: nearly everything imports from `types/`.
- **Impact:** Low — high churn on low-complexity barrels is expected and healthy in a published-API monorepo. Flagged only to confirm the hot-spot analysis found _no_ file that is both high-churn and high-complexity. The leveraged change-amplifier is the `types/` directory, which is appropriately small and stable in shape.

### F5 — Minor unused dependencies (dead-code hygiene)

- **Severity:** Low
- **Location:** `apps/expo/package.json` (`react-dom`, `react-native-screens`, `react-native-web`), `packages/dice-ui/package.json` (`@testing-library/dom`), `packages/games/package.json` (`bunup` devDep), `apps/expo/package.json` (`@testing-library/react-native`).
- **Evidence:** `bun run knip` reports 3 unused dependencies and 3 unused devDependencies, plus one unlisted binary (`playwright`). It reports **zero** unused source files and **zero** unused exports across the workspace. (knip emitted two non-fatal load errors for `apps/expo` configs referencing a missing `expo/tsconfig.base`, so expo's dead-export sweep is partial.)
- **Impact:** Trivial — manifest hygiene only. Notably, the absence of any unused-export or orphan-file finding is a strong positive signal for ISO/IEC 5055 "unreachable code": this codebase has essentially no dead code surface.

## Metrics

| Repo / package   | Metric                                   | Value                          | Notes                                                                                                                                                                     |
| ---------------- | ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| randsum-monorepo | Files >500 LOC (non-test, non-generated) | 3                              | `QuickReferenceGrid.tsx` 983, `QuickReferenceGrid.native.tsx` 792, `apps/rdn/.../vectors.ts` 503 (conformance test vectors — data, not logic)                             |
| randsum-monorepo | Functions >50 LOC (sampled)              | ~4 notable                     | `generateFunctionBody` ~157, `generateMultiPoolBody` ~132, `generateRollParts` ~86 (all `emitBody.ts`); `rerollSingle` ~63 (`reroll.ts`)                                  |
| roller           | Avg cyclomatic complexity (rough)        | Low–Medium                     | Modifier files are small, single-purpose; `parseArguments.ts` and `pipeline.ts` are the Medium outliers                                                                   |
| roller           | Avg file size                            | 81 LOC/file (97 files)         | Excellent modularity — one-file-per-modifier registry                                                                                                                     |
| games            | Avg file size                            | 126 LOC/file (20 hand-written) | +2,756 LOC of `.generated.ts` excluded from complexity findings                                                                                                           |
| dice-ui          | Avg file size                            | 173 LOC/file (20 files)        | Highest in repo; web/native duplication is the driver                                                                                                                     |
| randsum-monorepo | Top hot-spots (churn × size)             | None critical                  | Highest current-file churn (`index.ts` barrels, `types/*`) is low-complexity; `parseArguments.ts` is the only high-churn + moderate-complexity file (12 changes, 368 LOC) |
| randsum-monorepo | Duplication impression                   | Some                           | Confined to `dice-ui` web/native pairs (F1). Roller/games show minimal duplication (codegen deliberately centralizes shared logic)                                        |
| randsum-monorepo | Dead-code surface                        | Near-zero                      | Unused exports: 0 · Unreachable branches: none observed · Orphan files: 0 (knip) · Stale flags: none (no feature-flag system) · Unused deps: 6 (manifest hygiene)         |

## Recommendations

- **R1** — Extract the shared logic out of the `dice-ui` web/native component pairs (especially the ~983/792-LOC `QuickReferenceGrid` variants) into platform-agnostic hooks/utilities, leaving each `.native.tsx`/`.tsx` as a thin render shim. Reduces the two-places-to-change duplication that is the repo's top modifiability risk. [Horizon: next] [Risk reduction: Med]
- **R2** — Decompose `generateFunctionBody` (and its siblings `generateMultiPoolBody`, `generateRollParts`) in `emitBody.ts` into smaller, named sub-emitters per concern (pool emission, modifier emission, multi-pool join). Lowers the blast radius of codegen changes that affect all eight game packages. [Horizon: next] [Risk reduction: Med]
- **R3** — Add targeted `fast-check` property tests around `parseArguments.ts` multi-pool splitting (signed/unsigned pool boundaries, special-die collisions like `D{..}`/`DD`/`d%`) to lock down the high-churn notation edge cases rather than restructuring the parser. [Horizon: now] [Risk reduction: Med]
- **R4** — Prune the six unused dependencies flagged by knip and fix the `apps/expo` `tsconfig.base` reference so knip can complete its expo dead-export sweep, restoring full dead-code coverage in CI. [Horizon: now] [Risk reduction: Lo]

## Confidence

- **Directly observed:** file sizes and counts (`find` + `wc -l`), the >500-LOC file list, dice-ui web/native line-divergence (`diff`), per-package avg file size, churn counts (`git log --name-only --since="2 years ago"`), and dead-code results (`bun run knip`, which ran successfully apart from two non-fatal expo config load errors).
- **LLM-estimated (not tool-measured):** all cyclomatic-complexity buckets (Low/Medium/High) and function-length figures. Function lengths come from an `awk` boundary heuristic between `function`/`const X =` declarations and from reading representative files — they are approximate, not values from `lizard`/`ts-complexity`. Treat "157 lines" etc. as ±10%.
- **Churn caveat (load-bearing):** the repo was restructured — the former top-level game packages (`packages/salvageunion`, `packages/blades`, …, `packages/component-library`, and a root `src/`) were consolidated into `packages/games/` via codegen. Raw 2-year churn is therefore dominated by paths that no longer exist; all hot-spot findings here are computed against **currently-existing files only** (churn lines re-filtered through `[ -f "$path" ]`). This understates churn on the new consolidated structure, so hot-spot ranking is directional, not precise.
- **Generated code excluded:** the 2,756 LOC of `packages/games/src/*.generated.ts` and `apps/rdn/.../vectors.ts` (conformance data) were excluded from complexity findings per the skill's generated-code edge case.
- **Sampling:** roller modifiers, `parseArguments.ts`, `pipeline.ts`, `emitBody.ts`, and the dice-ui pairs were read directly; the docs sites (`apps/site`, `apps/rdn`) and bot (`apps/discord-bot`) were assessed by size/churn only, not read line-by-line. Public-library exports (roller/games/cli/dice-ui are published to npm) were treated as intentionally referenced and not flagged as dead.
