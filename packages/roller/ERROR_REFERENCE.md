# RANDSUM Error Reference

Complete catalog of RANDSUM error types, their causes, examples, and recovery strategies.

## Error Types

All RANDSUM errors extend `RandsumError` and include:

- `name`: Error class name
- `message`: Human-readable error message
- `code`: Machine-readable error code

---

## NotationParseError (INVALID_NOTATION)

**Error Code**: `INVALID_NOTATION`

**When it occurs**: Thrown when a string does not match the RANDSUM dice notation pattern.

**Common causes**:

- Missing quantity: `"d6"` instead of `"1d6"`
- Invalid syntax: `"2d"` (missing sides)
- Malformed notation: `"2d6+"` (incomplete modifier)
- Non-numeric values: `"abc"` or empty string

**Example that triggers it**:

```typescript
import { notation } from "@randsum/roller"

// ❌ Missing quantity
notation("d6") // Throws NotationParseError

// ❌ Invalid syntax
notation("2d") // Throws NotationParseError

// ❌ Empty string
notation("") // Throws NotationParseError
```

**How to fix**:

1. Use `validateNotation()` before parsing to check validity:

   ```typescript
   import { validateNotation } from "@randsum/roller"
   const result = validateNotation("d6")
   if (!result.valid) {
     console.error(result.error.message) // "Invalid dice notation: \"d6\""
   }
   ```

2. Use `isDiceNotation()` type guard for type-safe validation:

   ```typescript
   import { isDiceNotation, roll } from "@randsum/roller"
   if (isDiceNotation("2d6")) {
     roll("2d6") // TypeScript knows this is valid
   }
   ```

3. Ensure notation follows pattern: `{quantity}d{sides}{modifiers}`
   - Minimum: `"1d6"` (quantity and sides required)
   - Valid: `"2d20+5"`, `"4d6L"`, `"3d8!"`

---

## ModifierError (MODIFIER_ERROR)

**Error Code**: `MODIFIER_ERROR`

**When it occurs**: Thrown when a modifier fails to apply correctly, typically due to invalid configuration or runtime constraints.

**Common causes**:

- Invalid modifier options (e.g., negative drop count)
- Modifier conflicts (e.g., drop all dice)
- Missing required context (e.g., `rollOne` function for reroll/explode)
- Runtime errors during modifier application

**Example that triggers it**:

```typescript
import { roll } from "@randsum/roller"

// ❌ Drop more dice than available
roll("2d6L2") // Drops 2 lowest from 2 dice = no dice left
// May throw ModifierError if validation catches this

// ❌ Invalid drop configuration
roll("4d6D{>6}") // Drop values > 6 on d6 (impossible)
```

**How to fix**:

1. Validate modifier configuration before applying:
   - Ensure drop count < quantity
   - Verify cap ranges are within dice bounds
   - Check unique modifier has enough sides for quantity

2. Check modifier application order:
   - Modifiers apply: reroll → explode → replace → drop → cap → arithmetic
   - Some modifiers may change dice count before others apply

3. Review modifier logs for debugging:

   ```typescript
   const result = roll("4d6L2")
   console.log(result.rolls[0].modifierHistory.logs)
   // Shows what modifiers were applied and their effects
   ```

4. Use `validateNotation()` to catch syntax errors before rolling:
   ```typescript
   const validation = validateNotation("4d6L2")
   if (validation.valid) {
     const result = roll("4d6L2")
   }
   ```

---

## ValidationError (VALIDATION_ERROR)

**Error Code**: `VALIDATION_ERROR`

**When it occurs**: Thrown when input validation fails during notation validation or options validation.

**Common causes**:

- Invalid notation string passed to `validateNotation()`
- Notation doesn't match expected pattern
- Invalid options passed to `roll()` (non-integer sides, negative quantity, etc.)
- Parsing fails during validation

**Example that triggers it**:

```typescript
import { validateNotation, roll } from "@randsum/roller"

// ❌ Invalid notation
const result = validateNotation("invalid")
if (!result.valid) {
  // result.error is ValidationErrorInfo with message
  console.error(result.error.message) // "Invalid dice notation: \"invalid\""
}

// ❌ Invalid options
roll({ sides: 0, quantity: 1 }) // throws ValidationError
```

**How to fix**:

1. Always check validation result:

   ```typescript
   const validation = validateNotation(notation)
   if (!validation.valid) {
     // Handle error - don't proceed with roll
     return
   }
   // Safe to use notation
   const result = roll(validation.argument)
   ```

2. Use `isDiceNotation()` type guard:

   ```typescript
   import { isDiceNotation } from "@randsum/roller"

   if (isDiceNotation(input)) {
     // TypeScript knows input is DiceNotation
     roll(input) // Safe
   }
   ```

3. Provide user feedback:
   - Show the invalid notation
   - Suggest valid alternatives
   - Reference notation documentation

---

## RollError (ROLL_ERROR)

**Error Code**: `ROLL_ERROR`

**When it occurs**: Thrown when a roll operation fails at runtime, typically wrapping other errors.

**Common causes**:

- Modifier application failures
- Invalid roll parameters
- Runtime errors during dice generation
- Unexpected errors in roll processing

**Example that triggers it**:

```typescript
import { roll } from "@randsum/roller"

// ❌ May throw RollError if modifier fails
try {
  roll("10d6U") // Unique modifier with insufficient sides
} catch (error) {
  if (error instanceof RollError) {
    console.error(error.code) // "ROLL_ERROR"
    console.error(error.message) // Error details
  }
}
```

**How to fix**:

1. Wrap roll calls in try-catch:

   ```typescript
   try {
     const result = roll(notation)
     // Use result
   } catch (error) {
     if (error instanceof RollError) {
       // Handle roll-specific error
     } else {
       // Handle other errors
     }
   }
   ```

2. Validate notation first:

   ```typescript
   const validation = validateNotation(notation)
   if (!validation.valid) {
     // Handle validation error (doesn't throw)
     return
   }

   try {
     const result = roll(notation)
   } catch (error) {
     // Only runtime errors reach here
   }
   ```

3. Check roll parameters:
   - Ensure quantity > 0
   - Verify sides > 0 or faces array is non-empty
   - Validate modifier configurations

4. Inspect roll result structure:
   ```typescript
   const result = roll(notation)
   // Check result.rolls for individual roll records
   // Check result.rolls[0].modifierHistory for modifier application
   ```

---

## Error Handling Best Practices

### 1. Validate Before Rolling

Always validate notation before attempting to roll:

```typescript
import { validateNotation, roll } from "@randsum/roller"

function safeRoll(notation: string) {
  const validation = validateNotation(notation)
  if (!validation.valid) {
    return { error: validation.error.message }
  }

  const result = roll(notation)
  if (result.error) {
    return { error: result.error.message }
  }

  return { success: true, result }
}
```

### 2. Use Type Guards

Leverage TypeScript type guards for type safety:

```typescript
import { isDiceNotation } from "@randsum/roller"

if (isDiceNotation(input)) {
  // input is now typed as DiceNotation
  roll(input) // Type-safe
}
```

### 3. Check Error Codes

Use the exported `ERROR_CODES` constant for type-safe error handling:

```typescript
import { roll, RandsumError, ERROR_CODES } from "@randsum/roller"

try {
  roll(notation)
} catch (error) {
  if (error instanceof RandsumError) {
    switch (error.code) {
      case ERROR_CODES.INVALID_NOTATION:
        // Handle notation error
        break
      case ERROR_CODES.MODIFIER_ERROR:
        // Handle modifier error
        break
      case ERROR_CODES.VALIDATION_ERROR:
        // Handle validation error
        break
      case ERROR_CODES.ROLL_ERROR:
        // Handle roll error
        break
    }
  }
}
```

The `ERROR_CODES` constant provides:

- `INVALID_NOTATION` - Invalid dice notation syntax
- `MODIFIER_ERROR` - Error applying a modifier
- `VALIDATION_ERROR` - Input validation failed
- `ROLL_ERROR` - General roll execution error

### 4. Provide User-Friendly Messages

Transform technical errors into user-friendly feedback:

```typescript
function getUserFriendlyError(error: Error): string {
  if (error instanceof NotationParseError) {
    return `Invalid dice notation. Use formats like "2d6", "4d6L", or "1d20+5"`
  }
  if (error instanceof ModifierError) {
    return `Modifier error: ${error.message}. Check your notation syntax.`
  }
  return `Roll failed: ${error.message}`
}
```

---

## Error Recovery Strategies

### For Invalid Notation

1. Validate with `validateNotation()` first
2. Use `isDiceNotation()` type guard for type-safe checks
3. Provide syntax suggestions based on common patterns

### For Modifier Errors

1. Check modifier configuration validity
2. Verify modifier order and dependencies
3. Review modifier logs for debugging
4. Test modifiers individually before combining

### For Roll Errors

1. Validate notation before rolling
2. Check roll parameters (quantity, sides)
3. Verify modifier configurations
4. Use seeded random for reproducible debugging

---

## Related Documentation

- [RANDSUM Dice Notation](RANDSUM_DICE_NOTATION.md) - Complete notation syntax reference
- [Type Definitions](../packages/roller/src/types.ts) - TypeScript type definitions
- [Error Classes](../packages/roller/src/errors.ts) - Error class implementations
