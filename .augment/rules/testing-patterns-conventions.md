---
type: "always_apply"
description: "Standards for writing comprehensive and maintainable tests across RANDSUM packages"
---

# Testing Patterns and Conventions

## Overview

RANDSUM uses Bun's built-in test framework for all testing. Tests must be comprehensive, maintainable, and provide clear feedback about system behavior and failures.

## Test File Organization

### File Structure

```
__tests__/
├── feature.test.ts         # Feature-specific tests
├── integration.test.ts     # Integration tests
├── edge-cases.test.ts      # Edge case testing
└── support/
    ├── fixtures.ts         # Test fixtures and data
    └── helpers.ts          # Test utility functions
```

### Naming Conventions

- Test files: `*.test.ts` or `*.spec.ts`
- Test descriptions: Clear, specific, and behavior-focused
- Test groups: Use `describe` blocks for logical organization

```typescript
// ✅ Correct - Clear test organization
describe('roll function', () => {
  describe('with numeric dice', () => {
    test('returns result within valid range', () => {
      // Test implementation
    })
  })
  
  describe('with advantage', () => {
    test('keeps highest of two rolls', () => {
      // Test implementation
    })
  })
})
```

## Test Imports and Setup

### Standard Test Imports

Use consistent imports across all test files:

```typescript
import { describe, expect, test } from 'bun:test'
import type { RollArgument } from '../src/types'
import { roll } from '../src/roll'
```

### Mock and Spy Imports

When needed, import mocking utilities:

```typescript
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  mock,
  spyOn,
  test
} from 'bun:test'
```

## Test Data and Fixtures

### Test Fixtures

Create reusable test fixtures:

```typescript
// __tests__/support/fixtures.ts
export function createNumericRollOptions(
  overrides: Partial<NumericRollOptions> = {}
): NumericRollOptions {
  return {
    sides: 20,
    quantity: 1,
    ...overrides
  }
}

export function createRollParameters(
  overrides: Partial<RollParams> = {}
): RollParams {
  return {
    die: D(4),
    argument: 1,
    notation: '1d4',
    description: ['Roll 1d4'],
    options: {
      sides: 4,
      quantity: 1
    },
    ...overrides
  } as RollParams
}
```

### Test Data Organization

Keep test data close to tests but reusable:

```typescript
// ✅ Correct - Organized test data
describe('meetOrBeat function', () => {
  const standardArgs: RollArgument = { modifier: 5 }
  
  test('returns true when roll meets DC', () => {
    const dc = 10
    const result = meetOrBeat(dc, standardArgs)
    expect(typeof result).toBe('boolean')
  })
})
```

## Assertion Patterns

### Comprehensive Assertions

Test all relevant aspects of results:

```typescript
// ✅ Correct - Comprehensive assertions
test('returns valid roll result', () => {
  const result = roll({ modifier: 5 })
  
  // Test structure
  expect(result).toHaveProperty('total')
  expect(result).toHaveProperty('rawResults')
  expect(result).toHaveProperty('type')
  
  // Test values
  expect(result.total).toBeGreaterThanOrEqual(6)
  expect(result.total).toBeLessThanOrEqual(25)
  expect(result.rawResults).toHaveLength(1)
  expect(typeof result.total).toBe('number')
})
```

### Type Assertions

Verify types in addition to values:

```typescript
// ✅ Correct - Type assertions
test('returns correct result type', () => {
  const result = roll('2d6')
  
  expect(result.type).toBe('numeric')
  expect(typeof result.total).toBe('number')
  expect(Array.isArray(result.rawResults)).toBe(true)
  expect(result.rawResults.every(r => typeof r === 'number')).toBe(true)
})
```

## Testing Dice Rolling Systems

### Range Testing

Test that dice results fall within expected ranges:

```typescript
// ✅ Correct - Range testing
test('d20 roll returns value between 1 and 20', () => {
  for (let i = 0; i < 100; i++) {
    const result = D20.roll()
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(20)
  }
})
```

### Statistical Testing

For random systems, use statistical validation:

```typescript
// ✅ Correct - Statistical testing
test('dice distribution is roughly uniform', () => {
  const results = Array.from({ length: 1000 }, () => D6.roll())
  const counts = results.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  // Each face should appear roughly 1/6 of the time (±50 for variance)
  Object.values(counts).forEach(count => {
    expect(count).toBeGreaterThan(100)
    expect(count).toBeLessThan(250)
  })
})
```

## Testing Modifiers

### Modifier Application Testing

Test that modifiers are applied correctly:

```typescript
// ✅ Correct - Modifier testing
test('plus modifier adds to total', () => {
  const result = roll({
    sides: 6,
    quantity: 2,
    modifiers: { plus: 3 }
  })
  
  const expectedMin = 2 + 3  // Minimum roll + modifier
  const expectedMax = 12 + 3 // Maximum roll + modifier
  
  expect(result.total).toBeGreaterThanOrEqual(expectedMin)
  expect(result.total).toBeLessThanOrEqual(expectedMax)
})
```

### Modifier Logging

Test that modifier logs are created:

```typescript
// ✅ Correct - Modifier log testing
test('drop modifier creates proper log entry', () => {
  const result = roll('4d6L')
  const rollResult = result.rolls[0]
  
  expect(rollResult?.modifiedRolls.logs).toHaveLength(1)
  
  const log = rollResult?.modifiedRolls.logs[0]
  expect(log?.modifier).toBe('drop')
  expect(log?.removed).toHaveLength(1)
  expect(log?.added).toHaveLength(0)
})
```

## Error Testing

### Exception Testing

Test error conditions thoroughly:

```typescript
// ✅ Correct - Exception testing
describe('error handling', () => {
  test('throws error for invalid dice pool', () => {
    expect(() => roll(0)).toThrow('Dice pool must be at least 1')
  })
  
  test('throws error for invalid notation', () => {
    expect(() => roll('invalid')).toThrow(/Invalid dice notation/)
  })
  
  test('provides helpful error messages', () => {
    expect(() => roll('')).toThrow(
      expect.stringContaining('Please provide valid notation')
    )
  })
})
```

### Validation Testing

Test input validation:

```typescript
// ✅ Correct - Validation testing
describe('input validation', () => {
  test('validates notation format', () => {
    const result = validateNotation('2d20')
    expect(result.valid).toBe(true)
  })
  
  test('rejects invalid notation', () => {
    const result = validateNotation('invalid')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```

## Integration Testing

### Cross-Package Testing

Test integration between packages:

```typescript
// ✅ Correct - Integration testing
describe('game package integration', () => {
  test('uses roller package correctly', () => {
    const [result, details] = rollRoot(2)
    
    // Test game-specific result
    expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result)
    
    // Test underlying roller integration
    expect(details.type).toBe('numeric')
    expect(details.total).toBeGreaterThanOrEqual(4) // 2d6+2 minimum
  })
})
```

### End-to-End Testing

Test complete workflows:

```typescript
// ✅ Correct - End-to-end testing
test('complete roll workflow', () => {
  const notation = '4d6L+2'
  
  // Validate notation
  const validation = validateNotation(notation)
  expect(validation.valid).toBe(true)
  
  // Perform roll
  const result = roll(notation)
  expect(result.type).toBe('numeric')
  
  // Verify result structure
  expect(result.rolls).toHaveLength(1)
  expect(result.rawResults).toHaveLength(4)
})
```

## Mocking and Spying

### Random Number Mocking

Mock random functions for deterministic tests:

```typescript
// ✅ Correct - Mocking random functions
describe('with mocked random', () => {
  beforeAll(() => {
    spyOn(CoreRandom, 'coreRandom').mockReturnValue(3)
  })
  
  afterAll(() => {
    mock.restore()
  })
  
  test('produces expected result with fixed random', () => {
    const result = roll('1d6')
    expect(result.total).toBe(4) // 3 + 1 (1-indexed)
  })
})
```

### Selective Mocking

Mock only what's necessary:

```typescript
// ✅ Correct - Selective mocking
test('handles roll generation failure', () => {
  const mockGenerateRoll = spyOn(generateRoll, 'generateRoll')
    .mockImplementation(() => {
      throw new Error('Mock failure')
    })
  
  expect(() => roll('1d20')).toThrow('Mock failure')
  
  mockGenerateRoll.mockRestore()
})
```

## Performance Testing

### Basic Performance Tests

Include basic performance validation:

```typescript
// ✅ Correct - Performance testing
test('roll performance is acceptable', () => {
  const start = performance.now()
  
  for (let i = 0; i < 1000; i++) {
    roll('4d6L')
  }
  
  const duration = performance.now() - start
  expect(duration).toBeLessThan(1000) // Should complete in under 1 second
})
```

## Test Coverage

### Coverage Requirements

Aim for high test coverage:
- Functions: 100% coverage
- Branches: 80% minimum
- Lines: 90% minimum
- Statements: 90% minimum

### Coverage Configuration

Configure coverage in `bunfig.toml`:

```toml
[test]
coverage = true
coverageThreshold = { 
  lines = 0.9, 
  functions = 1.0, 
  branches = 0.8, 
  statements = 0.9 
}
```
