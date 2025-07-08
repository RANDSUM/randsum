---
type: "always_apply"
description: "Testing standards for RANDSUM packages"
---

# Testing Standards

## Test Organization

- Use `__tests__/` directory with `*.test.ts` files
- Import from `bun:test`: `{ describe, expect, test }`
- Use `describe` blocks for logical grouping
- Clear, behavior-focused test descriptions

## Key Testing Patterns

**Dice Range Testing:**

```typescript
test('d20 roll returns value between 1 and 20', () => {
  for (let i = 0; i < 100; i++) {
    const result = D20.roll()
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(20)
  }
})
```

**Modifier Log Testing:**

```typescript
test('drop modifier creates proper log entry', () => {
  const result = roll('4d6L')
  const log = result.rolls[0]?.modifiedRolls.logs[0]
  expect(log?.modifier).toBe('drop')
  expect(log?.removed).toHaveLength(1)
  expect(log?.added).toHaveLength(0)
})
```

## Essential Testing Requirements

- Test dice results fall within expected ranges
- Verify modifier logs contain proper `added`/`removed` arrays
- Mock `coreRandom` for deterministic tests
- Test error conditions with descriptive messages
- Use comprehensive assertions for result structure and values
