# Salvage Union — createGameRoll Investigation

**Date:** 2026-03-09
**Question:** Can @randsum/salvageunion adopt the createGameRoll factory pattern?

## Current Architecture

`@randsum/salvageunion` exposes a single `roll(tableName?)` function. Internally it:

1. Calls `coreRoll({ sides: 20 })` from `@randsum/roller` to get a d20 result.
2. Calls `tableDataForTable(tableName)` — which looks up the table in `SalvageUnionReference.RollTables` and throws if the table name is invalid.
3. Calls `resultForTable(tableData, total)` from `salvageunion-reference` to map the d20 total to a table entry.
4. Extracts `label` and `description` from the entry (handling two table layouts: `{label, value}` vs `{value}`).
5. Returns a manually-constructed `GameRollResult<SalvageUnionRollRecord, undefined, RollRecord<SalvageUnionTableListing | string>>`.

The package does NOT use `createGameRoll`. It is the only game package in the repo that calls `coreRoll()` directly and builds `GameRollResult` by hand.

## createGameRoll API Analysis

```typescript
// packages/roller/src/lib/gameRoll.ts

export interface GameRollConfig<TInput, TResult, TDetails = undefined> {
  validate: (input: TInput) => void
  toRollOptions: (input: TInput) => RollOptions | RollOptions[]
  interpretResult: (input: TInput, fullResult: RollerRollResult) => TResult
  computeDetails?: (input: TInput, fullResult: RollerRollResult) => TDetails
}

export function createGameRoll<TInput, TResult, TDetails = undefined>(
  config: GameRollConfig<TInput, TResult, TDetails>
): (input: TInput) => GameRollResult<TResult, TDetails, RollRecord>
```

Key observations:

- `validate` is a void function that throws on invalid input — exactly what `tableDataForTable` does.
- `interpretResult` receives `(input: TInput, fullResult: RollerRollResult)` synchronously — it can call any external function available in scope (e.g. `resultForTable`).
- `computeDetails` is optional; salvageunion does not use a `details` field, so `TDetails = undefined` fits.
- The return type is hardcoded to `GameRollResult<TResult, TDetails, RollRecord>` — where `RollRecord` is `RollRecord<string>` (the default generic).
- `interpretResult` does NOT receive `total` or `rolls` separately; it receives the entire `RollerRollResult`, from which `fullResult.total` and `fullResult.rolls` are accessible.

## Feasibility Analysis

**Can `validate` throw?**
Yes. The contract is `(input: TInput) => void`, and the existing `tableDataForTable` already throws on invalid table names. This maps directly.

**Can `interpretResult` call external functions?**
Yes. `interpretResult` is a plain synchronous function in closure scope. It has full access to imported modules (`resultForTable`, etc.). There is no constraint preventing external calls.

**Can `TInput` be `SalvageUnionTableName`?**
Yes. `SalvageUnionTableName` is `string` (a union of literal strings derived from `SALVAGE_UNION_TABLE_NAMES`). It is a valid `TInput`.

**Can `interpretResult` access `fullResult.total`?**
Yes. `RollerRollResult` exposes `total: number` and `rolls: RollRecord[]`. The table lookup needs `total`, which is available as `fullResult.total`.

**The `RollRecord<SalvageUnionTableListing | string>` generic — is it a blocker?**
This is the one meaningful gap. The factory's return type is fixed at `GameRollResult<TResult, TDetails, RollRecord>` — i.e., `RollRecord<string>`. The current implementation declares `rolls` as `RollRecord<SalvageUnionTableListing | string>[]`. In practice the roller always produces `RollRecord<string>` when rolling numeric dice; the current annotation is more specific than necessary and carries no runtime difference. Adopting `createGameRoll` would widen the declared `rolls` type from `RollRecord<SalvageUnionTableListing | string>[]` back to `RollRecord<string>[]`, which is accurate. This is not a real blocker — it is a cleanup.

**Is `interpretResult` async?**
No. The factory is purely synchronous. `resultForTable` from `salvageunion-reference` is synchronous, so this is not an issue.

**Does the factory support a default argument (`tableName = 'Core Mechanic'`)?**
The factory produces `(input: TInput) => GameRollResult<...>`. Default argument handling must be wrapped at the call site. The current signature `roll(tableName = 'Core Mechanic')` can be preserved by wrapping the factory-produced function.

## Proposed Refactor

```typescript
import type { SURefObjectTable } from 'salvageunion-reference'
import { SalvageUnionReference, resultForTable } from 'salvageunion-reference'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from '../types'
import type { GameRollResult, RollRecord } from '@randsum/roller'
import { createGameRoll } from '@randsum/roller'

function tableDataForTable(tableName: SalvageUnionTableName): SURefObjectTable {
  const rollTable = SalvageUnionReference.RollTables.find(t => t.name === tableName)
  if (!rollTable?.table) {
    throw new Error(`Invalid Salvage Union table name: "${tableName}"`)
  }
  return rollTable.table
}

const _roll = createGameRoll<SalvageUnionTableName, SalvageUnionRollRecord>({
  validate: (tableName) => {
    tableDataForTable(tableName) // throws if invalid
  },
  toRollOptions: (_tableName) => ({ sides: 20 }),
  interpretResult: (tableName, fullResult) => {
    const tableData = tableDataForTable(tableName)
    const tableResult = resultForTable(tableData, fullResult.total)

    if (!tableResult.success) {
      throw new Error(`Failed to get result from table: "${tableName}"`)
    }

    const { result, key } = tableResult
    const resultTyped = result as { label?: string; value?: string }
    const label = resultTyped.label ?? resultTyped.value ?? ''
    const description = resultTyped.label ? (resultTyped.value ?? '') : ''

    return {
      key,
      label,
      description,
      table: tableData,
      tableName,
      roll: fullResult.total
    }
  }
})

export function roll(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): GameRollResult<SalvageUnionRollRecord, undefined, RollRecord> {
  return _roll(tableName)
}
```

Note: `tableDataForTable` is called twice per invocation in this sketch — once in `validate` and once in `interpretResult`. This is a minor inefficiency. The factory provides no mechanism to pass validated state between hooks, so this is an inherent limitation of the factory contract. The double lookup is cheap (an in-memory array `.find()`), so it does not constitute a practical problem.

## Blockers / Gaps

1. **Double table lookup.** `validate` and `interpretResult` both call `tableDataForTable`. The factory has no shared context slot between hooks. This is a minor DX cost with negligible runtime impact, but it is an inelegance worth noting.

2. **`RollRecord<SalvageUnionTableListing | string>` annotation removed.** The factory fixes the `TRollRecord` parameter to `RollRecord<string>`. The existing annotation is inaccurate anyway (the roller never produces `RollRecord<SalvageUnionTableListing>`), so this is a net improvement, not a regression.

3. **Default argument wrapping.** The factory produces a function that requires an argument. Preserving `roll()` with the `'Core Mechanic'` default requires a thin wrapper, as shown in the sketch. This is trivial.

4. **No functional or type-safety blocker exists.** Every constraint of the current implementation is satisfiable within the factory's contract.

## Recommendation

**Refactor: Yes — feasible and recommended.**

The refactor is clean, well-contained, and removes the only direct `coreRoll()` call in the game packages layer. The resulting code is shorter, follows the established ecosystem pattern, and the existing comment block (explaining why the factory isn't used) becomes obsolete and can be deleted.

The double `tableDataForTable` call is the sole tradeoff. It is acceptable: the lookup is O(n) over a small static array, called at most twice per roll, with no observable performance impact.

If the double-lookup becomes a recurring pattern in future packages, it would motivate adding an optional `context` slot to `GameRollConfig` — but that is not warranted here.

**Action:** Refactor `games/salvageunion/src/roll/index.ts` to use `createGameRoll`. The public API surface (`roll()`, all exported types) remains identical.
