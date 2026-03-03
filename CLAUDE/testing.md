# Testing Patterns for RANDSUM

## Test Structure

All tests use `bun:test`:

```typescript
import { describe, expect, test } from "bun:test"
```

## Stress Testing

For boundary condition testing, use 9999 iterations:

```typescript
const loops = 9999
const dummyArray = Array.from({ length: loops }, () => roll(arg))
dummyArray.forEach(({ total }) => {
  expect(total).toBeLessThanOrEqual(max)
  expect(total).toBeGreaterThan(min)
})
```

## Test Patterns

### Deterministic Testing with Seeded Random

```typescript
import { createSeededRandom } from "../../test-utils/src/seededRandom"

const seeded = createSeededRandom(42)
const result1 = roll(arg, { randomFn: seeded })
const seeded2 = createSeededRandom(42)
const result2 = roll(arg, { randomFn: seeded2 })
expect(result1.total).toBe(result2.total)
```

### Testing Multiple Argument Types

Test numeric, object, and notation string arguments:

- `roll(20)` - number argument
- `roll({ sides: 20 })` - object argument
- `roll("1d20")` - notation string

### Testing Custom Faces

When testing custom face dice, verify:

- Results are within bounds (quantity to quantity \* faces.length)
- Each result is one of the provided faces
- `result` array contains the face values

### Test File Location

- Test files go in `__tests__/` directories
- Mirror source structure: `src/roll/index.ts` → `__tests__/roll/roll.test.ts`
- Property tests use `.property.test.ts` suffix

## Common Assertions

- `expect(total).toBeLessThanOrEqual(max)` - Upper bound check
- `expect(total).toBeGreaterThan(min)` - Lower bound check
- `expect(rolls).toHaveLength(expected)` - Roll count verification
- `expect(result).toContain(value)` - Face value verification
