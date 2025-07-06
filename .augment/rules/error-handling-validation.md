---
type: "always_apply"
description: "Consistent patterns for error handling, validation, and defensive programming"
---

# Error Handling and Validation Standards

## Overview

RANDSUM prioritizes robust error handling and validation to provide clear feedback to developers and prevent runtime failures. All functions should handle edge cases gracefully and provide meaningful error messages.

## Error Throwing Patterns

### Descriptive Error Messages

Always provide clear, actionable error messages:

```typescript
// ✅ Correct - Descriptive error messages
if (hope === undefined || fear === undefined) {
  throw new Error('Failed to roll hope and fear dice')
}

if (!validated.valid) {
  throw new Error(
    'Invalid dice notation. Please provide valid notation like "2d20" or "4d6L"'
  )
}

// ❌ Incorrect - Vague error messages
throw new Error('Invalid input')
throw new Error('Something went wrong')
```

### Error Context

Include relevant context in error messages:

```typescript
// ✅ Correct - Error with context
throw new Error(
  `Failed to generate roll result for notation "${notation}". Please try again.`
)

// ❌ Incorrect - No context
throw new Error('Failed to generate roll result')
```

### Early Validation

Validate inputs early and fail fast:

```typescript
// ✅ Correct - Early validation
export function roll(args: RollArgument): RollResult {
  // Validate inputs first
  if (args.dicePool < 1) {
    throw new Error('Dice pool must be at least 1')
  }
  
  // Then proceed with logic
  const result = performRoll(args)
  return result
}
```

## Validation Patterns

### Input Validation

Always validate function inputs:

```typescript
// ✅ Correct - Input validation
export function meetOrBeat(dc: number, args: RollArgument): boolean {
  if (typeof dc !== 'number' || dc < 1) {
    throw new Error('DC must be a positive number')
  }
  
  if (!args || typeof args !== 'object') {
    throw new Error('Roll arguments must be provided')
  }
  
  // Proceed with logic
}
```

### Type Guards for Runtime Safety

Use type guards to ensure runtime type safety:

```typescript
// ✅ Correct - Type guard implementation
export function isRollResult(value: unknown): value is RollResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'total' in value &&
    'rolls' in value &&
    'rawResults' in value
  )
}

// Usage in functions
function processResult(result: unknown): void {
  if (!isRollResult(result)) {
    throw new Error('Invalid roll result provided')
  }
  
  // Now result is properly typed
  console.log(result.total)
}
```

### Validation Functions

Create dedicated validation functions:

```typescript
// ✅ Correct - Dedicated validation function
export function validateNotation(notation: string): ValidationResult {
  if (typeof notation !== 'string') {
    return {
      valid: false,
      error: 'Notation must be a string'
    }
  }
  
  if (notation.trim().length === 0) {
    return {
      valid: false,
      error: 'Notation cannot be empty'
    }
  }
  
  // Additional validation logic...
  
  return { valid: true }
}
```

## Defensive Programming

### Null and Undefined Checks

Always check for null/undefined values:

```typescript
// ✅ Correct - Defensive null checks
export function calculateTotal(rolls: (number | string)[]): number | string {
  if (!rolls || rolls.length === 0) {
    return 0
  }
  
  const firstRoll = rolls[0]
  if (firstRoll === undefined) {
    return 0
  }
  
  // Proceed with calculation
}
```

### Array Bounds Checking

Check array bounds before accessing elements:

```typescript
// ✅ Correct - Array bounds checking
const {
  rawResults: [hope, fear],
  total
} = coreRoll(...rollArg({ modifier, amplifyHope, amplifyFear }))

if (hope === undefined || fear === undefined) {
  throw new Error('Failed to roll hope and fear')
}
```

### Default Values

Provide sensible defaults for optional parameters:

```typescript
// ✅ Correct - Default values
export function roll({
  modifier = 0,
  rollingWith,
  amplifyHope = false,
  amplifyFear = false
}: RollArgument): RollResult {
  // Function implementation
}
```

## Error Types and Classification

### Custom Error Classes

Consider custom error classes for specific error types:

```typescript
// ✅ Correct - Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public readonly input: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class RollError extends Error {
  constructor(message: string, public readonly notation: string) {
    super(message)
    this.name = 'RollError'
  }
}
```

### Error Categories

Categorize errors by type:

- **ValidationError**: Invalid input or configuration
- **RollError**: Failure during dice rolling process
- **ConfigurationError**: Invalid package or system configuration

## Result Types for Error Handling

### Result Pattern

Consider using Result types for operations that can fail:

```typescript
// ✅ Correct - Result pattern
interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateNotation(notation: string): ValidationResult {
  // Validation logic
  if (isInvalid) {
    return { valid: false, error: 'Specific error message' }
  }
  
  return { valid: true }
}
```

### Optional Return Values

Use optional return values for operations that might not produce results:

```typescript
// ✅ Correct - Optional return
function findModifier(name: string): Modifier | undefined {
  return modifiers.find(m => m.name === name)
}

// Usage with proper checking
const modifier = findModifier('drop')
if (!modifier) {
  throw new Error(`Unknown modifier: ${name}`)
}
```

## Testing Error Conditions

### Test Error Cases

Always test error conditions:

```typescript
// ✅ Correct - Testing error conditions
describe('roll function', () => {
  test('throws error for invalid dice pool', () => {
    expect(() => roll(0)).toThrow('Dice pool must be at least 1')
  })
  
  test('throws error for negative modifier', () => {
    expect(() => roll({ modifier: -100 })).toThrow()
  })
})
```

### Error Message Testing

Test specific error messages:

```typescript
// ✅ Correct - Testing specific error messages
test('provides helpful error for invalid notation', () => {
  expect(() => roll('invalid')).toThrow(
    'Invalid dice notation. Please provide valid notation like "2d20" or "4d6L"'
  )
})
```

## Logging and Debugging

### Debug Information

Include debug information in development:

```typescript
// ✅ Correct - Debug information
function generateRoll(parameters: RollParams): RollPoolResult {
  try {
    const rawRolls = generateRawRolls(parameters)
    const modifiedRolls = generateModifiedRolls(parameters, rawRolls)
    // ... rest of implementation
  } catch (error) {
    // Add context for debugging
    console.error('Failed to generate roll:', {
      parameters,
      error: error.message
    })
    throw error
  }
}
```

### Modifier Logs

Maintain logs for transparency:

```typescript
// ✅ Correct - Modifier logging
interface ModifierLog {
  modifier: string
  options: ModifierConfig | undefined
  added: number[]
  removed: number[]
}

// Usage in modifier application
const log: ModifierLog = {
  modifier: 'drop',
  options: { lowest: 1 },
  added: [],
  removed: [droppedValue]
}
```

## Recovery Strategies

### Graceful Degradation

Provide fallback behavior when possible:

```typescript
// ✅ Correct - Graceful degradation
function formatRollResult(result: RollResult): string {
  try {
    return formatComplexResult(result)
  } catch (error) {
    // Fallback to simple formatting
    return `Total: ${result.total}`
  }
}
```

### Retry Logic

Implement retry logic for transient failures:

```typescript
// ✅ Correct - Retry logic (when appropriate)
function generateRandomValue(max: number, retries = 3): number {
  for (let i = 0; i < retries; i++) {
    try {
      return coreRandom(max)
    } catch (error) {
      if (i === retries - 1) throw error
      // Continue to next retry
    }
  }
  throw new Error('Failed to generate random value after retries')
}
```
