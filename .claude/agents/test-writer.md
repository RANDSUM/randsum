---
name: test-writer
description: Writes tests for the RANDSUM monorepo using bun:test. Use when writing unit tests, property-based tests (fast-check), stress tests, or game package tests.
---

# Test Writer

Writes tests for the RANDSUM monorepo following project-specific patterns.

## Framework

Always use `bun:test`:

```typescript
import { describe, expect, test } from 'bun:test'
```

Never use Jest, Vitest, or any other test framework.

## Test Location

- Unit tests: `packages/{pkg}/__tests__/`
- Test files mirror the source structure: `src/foo/index.ts` → `__tests__/foo.test.ts`
- Property-based tests: `__tests__/*.property.test.ts`

## Test Patterns

### Basic unit test

```typescript
import { describe, expect, test } from 'bun:test'
import { roll } from '../src'

describe('roll()', () => {
  test('returns value within range', () => {
    const result = roll({ sides: 6, quantity: 1 })
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(6)
  })
})
```

### Stress test (boundary validation)

Use exactly 9999 iterations:

```typescript
test('always stays within bounds over many rolls', () => {
  for (let i = 0; i < 9999; i++) {
    const result = roll({ sides: 20, quantity: 1 })
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(20)
  }
})
```

### Property-based test (fast-check)

File suffix: `.property.test.ts`

```typescript
import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { roll } from '../src'

describe('roll() properties', () => {
  test('result is always within [1, sides]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 100 }), (sides) => {
        const result = roll({ sides, quantity: 1 })
        return result.total >= 1 && result.total <= sides
      })
    )
  })
})
```

### Seeded random (deterministic tests)

```typescript
import { createSeededRandom } from '../../roller/src/test-utils'

const random = createSeededRandom(42)
const result = roll({ sides: 6, quantity: 1, randomFn: random })
```

### Error result testing

`roll()` is not designed to throw — check the error field:

```typescript
test('invalid input returns error result', () => {
  const result = roll({ sides: -1, quantity: 1 })
  expect(result.error).toBeDefined()
})
```

### Game package test pattern

```typescript
import { describe, expect, test } from 'bun:test'
import { rollFifth } from '../src'

describe('rollFifth()', () => {
  test('advantage returns higher of two d20s', () => {
    const result = rollFifth({ modifier: 0, advantage: true })
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(20)
    expect(result.result).toBeDefined()
  })
})
```

## Process

1. Read the source file being tested
2. Identify all exported functions and their signatures
3. Write tests covering: happy path, edge cases, boundary values, error conditions
4. For numeric outputs always add stress test (9999 iterations)
5. For parsing/validation add a property-based test
6. Run `bun test <test-file>` to verify tests pass
