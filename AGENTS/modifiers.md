# Modifier System Patterns

The modifier system uses a registry-based architecture where each modifier is a self-contained definition that registers itself with a global registry. This pattern provides excellent extensibility and type safety.

## Architecture Overview

```
ModifierDefinition (schema.ts)
        ↓
defineModifier() (registry.ts)
        ↓
Global Registry (Map<name, definition>)
        ↓
applyAllModifiersFromRegistry() → rolls + logs + totalTransformers
```

## Modifier Definition Schema

Every modifier implements the `ModifierDefinition<TOptions>` interface:

```typescript
interface ModifierDefinition<TOptions> {
  // Identity
  name: keyof ModifierOptions       // Unique key matching ModifierOptions
  priority: number                   // Execution order (lower = earlier)

  // Parsing
  pattern: RegExp                    // Notation matching (no 'g' flag)
  parse: (notation: string) => Partial<ModifierOptions>

  // Serialization
  toNotation: (options: TOptions) => string | undefined
  toDescription: (options: TOptions) => string[]

  // Execution
  apply: (rolls: number[], options: TOptions, ctx: ModifierContext) => ModifierApplyResult

  // Validation (optional)
  validate?: (options: TOptions, rollContext: RequiredNumericRollParameters) => void

  // Context requirements (optional)
  requiresRollFn?: boolean           // Needs rollOne() function
  requiresParameters?: boolean       // Needs { sides, quantity }
}
```

## Priority Values

Modifiers execute in priority order (lowest first):

| Priority | Modifier         | Description                        |
| -------- | ---------------- | ---------------------------------- |
| 10       | `cap`            | Limit roll values to a range       |
| 20       | `drop`           | Remove dice from pool              |
| 21       | `keep`           | Keep dice in pool                  |
| 30       | `replace`        | Replace specific values            |
| 40       | `reroll`         | Reroll dice matching conditions    |
| 50       | `explode`        | Roll additional dice on max        |
| 51       | `compound`       | Add explosion to existing die      |
| 52       | `penetrate`      | Add explosion minus 1 to die       |
| 60       | `unique`         | Ensure no duplicate values         |
| 85       | `multiply`       | Multiply dice sum (pre-arithmetic) |
| 90       | `plus`           | Add to total                       |
| 91       | `minus`          | Subtract from total                |
| 95       | `countSuccesses` | Count dice meeting threshold       |
| 100      | `multiplyTotal`  | Multiply entire final total        |

## Creating a New Modifier

### Step 1: Add Type to ModifierOptions

In `packages/roller/src/types/modifiers.ts`:

```typescript
export interface ModifierOptions {
  // ... existing modifiers
  myModifier?: MyModifierOptions
}
```

### Step 2: Add to ModifierOptionTypes

In `packages/roller/src/lib/modifiers/schema.ts`:

```typescript
export interface ModifierOptionTypes {
  // ... existing mappings
  myModifier: MyModifierOptions
}
```

### Step 3: Create the Modifier Definition

Create `packages/roller/src/lib/modifiers/definitions/myModifier.ts`:

```typescript
import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const myModifierPattern = /M{([^}]+)}/i

export const myModifierModifier: TypedModifierDefinition<'myModifier'> =
  defineModifier<'myModifier'>({
    name: 'myModifier',
    priority: 35, // Choose appropriate priority

    pattern: myModifierPattern,

    parse: notation => {
      const match = myModifierPattern.exec(notation)
      if (!match) return {}
      return { myModifier: parseOptions(match[1]) }
    },

    toNotation: options => {
      return `M{${formatOptions(options)}}`
    },

    toDescription: options => {
      return [`My Modifier: ${describeOptions(options)}`]
    },

    apply: (rolls, options, ctx) => {
      // Apply modifier logic here
      const newRolls = rolls.map(roll => transform(roll, options))
      return { rolls: newRolls }
    },

    // Optional validation
    validate: (options, { sides, quantity }) => {
      if (!isValid(options, sides)) {
        throw new ModifierError('myModifier', 'Invalid configuration')
      }
    }
  })
```

### Step 4: Register the Modifier

Add to `packages/roller/src/lib/modifiers/definitions/index.ts`:

```typescript
export { myModifierModifier } from './myModifier'
```

### Step 5: Update Documentation

Add notation syntax to `packages/roller/RANDSUM_DICE_NOTATION.md`.

### Step 6: Add Tests

Create `packages/roller/__tests__/lib/modifiers/myModifier.test.ts`.

## Modifier Context

Modifiers can request additional context through flags:

```typescript
// Modifier needs rollOne function (for rerolling)
requiresRollFn: true

// Modifier needs parameters (sides, quantity)
requiresParameters: true

// In apply(), use assertion helpers:
apply: (rolls, options, ctx) => {
  const { rollOne } = assertRollFn(ctx)
  const { parameters } = assertParameters(ctx)
  const { rollOne, parameters } = assertRequiredContext(ctx)
  // ...
}
```

## Total Transformers

Some modifiers need to transform the final total rather than individual rolls. Return a `transformTotal` function:

```typescript
apply: (rolls, options, ctx) => {
  return {
    rolls, // unchanged rolls
    transformTotal: (currentTotal, rolls) => {
      return currentTotal * options.multiplier
    }
  }
}
```

Total transformers are called in modifier priority order during total calculation.

## Common Patterns

### Comparison-Based Modifiers

Modifiers like `cap`, `drop`, `reroll`, `replace` use comparison options:

```typescript
import { matchesComparison, parseComparisonNotation } from '../../comparison'

// In parse:
const parsed = parseComparisonNotation(match[1])
return { myModifier: parsed }

// In apply:
const matches = rolls.filter(roll => matchesComparison(roll, options))
```

### Explosion Modifiers

For explode-like behavior, use the shared constants:

```typescript
import { DEFAULT_EXPLOSION_DEPTH } from '../../constants'

const maxDepth = options === true || options === 0
  ? DEFAULT_EXPLOSION_DEPTH
  : (options as number)
```

## Testing Patterns

```typescript
import { describe, test, expect } from 'bun:test'
import { roll } from '@randsum/roller'
import { createSeededRandom } from '@randsum/roller/test-utils'

describe('myModifier', () => {
  test('basic functionality', () => {
    const seeded = createSeededRandom(42)
    const result = roll('4d6M{options}', { randomFn: seeded })
    expect(result.rolls[0].rolls).toEqual([...])
  })

  test('stress test', () => {
    for (let i = 0; i < 9999; i++) {
      const result = roll('4d6M{options}')
      expect(result.total).toBeGreaterThanOrEqual(minExpected)
    }
  })
})
```

## Error Handling

Throw `ModifierError` for validation failures:

```typescript
import { ModifierError } from '../../../errors'

validate: (options, { sides }) => {
  if (options.value > sides) {
    throw new ModifierError(
      'myModifier',
      `Value ${options.value} exceeds maximum (${sides})`
    )
  }
}
```

## Registry Functions

The registry provides these utility functions:

```typescript
// Define and register a modifier
defineModifier<K>(definition): TypedModifierDefinition<K>

// Check/get modifiers
hasModifier(name): boolean
getModifier(name): ModifierDefinition | undefined
getAllModifiers(): ModifierDefinition[]
getModifierOrder(): (keyof ModifierOptions)[]

// Process modifiers
applyModifierFromRegistry(name, options, rolls, ctx): { rolls, log?, transformTotal? }
applyAllModifiersFromRegistry(modifiers, rolls, ctx): RegistryProcessResult

// Serialization
modifierToNotationFromRegistry(name, options): string | undefined
modifierToDescriptionFromRegistry(name, options): string[]
processModifierNotationsFromRegistry(modifiers): string[]
processModifierDescriptionsFromRegistry(modifiers): string[]

// Validation
validateModifiersFromRegistry(modifiers, ctx): void
```

## File Structure

```
packages/roller/src/lib/modifiers/
├── index.ts           # Public exports
├── registry.ts        # Global registry and utilities
├── schema.ts          # TypeScript interfaces
├── log.ts             # Modifier log creation
└── definitions/       # Individual modifiers
    ├── index.ts       # Imports all definitions (triggers registration)
    ├── cap.ts
    ├── drop.ts
    ├── keep.ts
    ├── replace.ts
    ├── reroll.ts
    ├── explode.ts
    ├── compound.ts
    ├── penetrate.ts
    ├── unique.ts
    ├── countSuccesses.ts
    ├── multiply.ts
    ├── plus.ts
    ├── minus.ts
    └── multiplyTotal.ts
```
