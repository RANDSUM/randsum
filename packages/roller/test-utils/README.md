# test-utils

Shared test utilities for `@randsum/roller`'s tests. Not published. There is no
barrel: import each module by path.

## What it provides

- **Deterministic RNG**: `createSeededRandom(seed)` (`src/seededRandom.ts`) and
  `createQueueRandom(...)` (`src/queueRandom.ts`) return a `RandomFn` you can
  pass to `roll()` as a `RollConfig`. Both re-export `src/random.ts`.
- **Fixtures**: `createRollOptions` and `createRollParams` (`src/fixtures.ts`),
  factories with defaults and overrides.

## Usage

```typescript
// From a test in packages/roller/__tests__/<area>/
import { createSeededRandom } from "../../test-utils/src/seededRandom"
import { roll } from "../../src/roll"

// Deterministic testing: RollConfig must be the LAST argument to roll()
const seeded = createSeededRandom(42)
const result = roll("4d6L", { randomFn: seeded })
```

`createSeededRandom(seed)` returns a `RandomFn` (a `() => number` in `[0, 1)`).
The same seed always yields the same sequence, so tests are reproducible.
