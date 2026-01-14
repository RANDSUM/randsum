# @randsum/test-utils

Shared test utilities for RANDSUM packages.

This package provides common testing utilities including:

- Seeded random number generators for deterministic tests
- Custom assertions for roll results
- Common test fixtures and mock data
- Helper functions for creating mock rolls

## Installation

This package is part of the RANDSUM monorepo and is not published separately.

## Usage

```typescript
import { createSeededRandom, expectRollInRange, commonNotations } from "@randsum/test-utils"
import { roll } from "@randsum/roller"

// Deterministic testing
const seeded = createSeededRandom(42)
const result = roll("4d6L", { randomFn: seeded })

// Custom assertions
expectRollInRange(result, 3, 18)

// Common fixtures
const advantageRoll = roll(commonNotations.advantage)
```
