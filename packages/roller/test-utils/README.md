# @randsum/test-utils

Shared test utilities for the RANDSUM monorepo. Part of `@randsum/roller`; not
published separately.

## What it provides

- **Deterministic RNG** — `createSeededRandom(seed)` and `createQueueRandom(...)`
  return a `RandomFn` you can pass to `roll()` as a `RollConfig`.
- **Assertions** — `expectRollInRange`, `expectAllRollsInRange`.
- **Fixtures** — `commonNotations`, `commonRollOptions`, and factory helpers
  (`createRollOptions`, `createRollParams`, `createNumericRollBonus`,
  `createRequiredNumericRollParameters`, `createMockRollOne`).
- **Mocks** — `createMockRoll`, `createDeterministicRoll`.

## Usage

```typescript
import { createSeededRandom, expectRollInRange, commonNotations } from "@randsum/test-utils"
import { roll } from "@randsum/roller"

// Deterministic testing — RollConfig must be the LAST argument to roll()
const seeded = createSeededRandom(42)
const result = roll("4d6L", { randomFn: seeded })

// Custom assertions
expectRollInRange(result, 3, 18)

// Common fixtures (notation strings)
const advantage = roll(commonNotations.advantage) // "2d20H"
```

`createSeededRandom(seed)` returns a `RandomFn` (a `() => number` in `[0, 1)`).
The same seed always yields the same sequence, so tests are reproducible.
`commonNotations` keys: `advantage`, `disadvantage`, `abilityScore`, `damage`,
`skillCheck`, `basic`, `percentile`, `exploding`, `reroll`, `cap`.
