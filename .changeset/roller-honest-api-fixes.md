---
"@randsum/roller": major
---

Honest `values` typing, multi-pool guard, public seeded RNG, typed `label`, and
closed `ErrorCode` union. Several of these are breaking.

- **Breaking — `result.values` is now honest.** Numeric pools populate the
  actual `number` roll values instead of `String(n)` (`roll("2d6").values` is
  now `[3, 5]`, not `["3", "5"]`). Custom-faced pools still populate their face
  values (`T`). `RollerRollResult<T>['values']` is retyped from `T[]` to
  `(number | T)[]`. Consumers that relied on string values must adapt.

- **Breaking — mixing custom-faced (non-numeric) dice with other pools in a
  single `roll()` now throws.** Previously `roll("1d20", { sides: ["H","T"] })`
  silently returned `total: 0`, indistinguishable from a genuine zero. It now
  throws a `ValidationError`; roll such pools separately.

- **New `@randsum/roller/random` subpath.** Exports `createSeededRandom` (seeded
  LCG, now normalized so negative seeds still produce valid faces) and
  `createQueueRandom` (deterministic replay from a fixed sequence of die
  values), plus the `QueueRandomOptions` type. This is the public home of the
  RNG factories that previously lived only in `test-utils`.

- **Breaking — bare `dN` notation is now accepted** (`d20` === `1d20`, quantity
  optional per RDN §4.1). `isDiceNotation("d20")`, `validateNotation("d20")`,
  and `roll("d20")` are now valid, the `DiceNotation` type accepts an omitted
  leading quantity, and roller now passes conformance vector 2. Notation that
  previously threw for a "missing quantity" no longer does.

- **`label` is now a typed `RollOptions` field.** `roll({ sides: 6, label: "fire" })`
  is honored via the type system (the previous untyped `'label' in options`
  cast is gone).

- **Breaking — `ErrorCode` is now a closed literal union** of the four
  `ERROR_CODES` values (no longer `... | (string & {})`), so consumers can
  `switch` over it exhaustively. Runtime values are unchanged.

- **`traceRoll` fixes.** Exact-match conditions (`exact: number[]`) now render in
  trace labels (they were silently dropped), and `finalRolls.arithmeticDelta` is
  now derived as `total - sum(rolls)` — the real scalar arithmetic offset — so
  `+N`/`-N` modifiers show up in the final math line instead of only subtractive
  pools.
