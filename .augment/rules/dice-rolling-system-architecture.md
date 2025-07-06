---
type: "always_apply"
description: "Architecture standards for dice rolling systems and core functionality"
---

# Dice Rolling System Architecture

## Overview

RANDSUM's dice rolling system is built on a modular architecture that separates concerns between dice generation, modifier application, and result formatting. This architecture enables extensibility while maintaining type safety and performance.

## Core Architecture Principles

### Separation of Concerns

The system is divided into distinct layers:

1. **Core Rolling**: Basic dice generation and random number generation
2. **Parameter Processing**: Notation parsing and parameter validation
3. **Modifier Application**: Applying modifiers to raw roll results
4. **Result Formatting**: Converting results to final output format

```typescript
// ✅ Correct - Clear architectural separation
const rawRolls = generateRawRolls(parameters)
const modifiedRolls = applyModifiers(rawRolls, parameters.modifiers)
const result = formatResult(modifiedRolls, parameters)
```

### Type Safety First

All dice operations must be type-safe:

```typescript
// ✅ Correct - Type-safe dice operations
interface RollParams {
  die: Die
  argument: number
  notation: string
  description: string[]
  options: NumericRollOptions | CustomRollOptions
}

function generateRoll<T extends RollParams>(params: T): RollPoolResult<T> {
  // Type-safe implementation
}
```

### Immutable Data Flow

Dice rolling operations should not mutate input data:

```typescript
// ✅ Correct - Immutable operations
function applyModifier(
  rolls: readonly number[],
  modifier: Modifier
): { rolls: number[], logs: ModifierLog[] } {
  // Return new arrays, don't mutate input
  return {
    rolls: [...rolls].sort(),
    logs: [createModifierLog(modifier)]
  }
}
```

## Core Components

### Die Class Hierarchy

Use a consistent Die class structure:

```typescript
// ✅ Correct - Die class hierarchy
abstract class Die {
  abstract roll(): number | string
  abstract get sides(): number | string[]
}

class NumericDie extends Die {
  constructor(private readonly sideCount: number) {
    super()
  }
  
  roll(): number {
    return coreRandom(this.sideCount) + 1
  }
  
  get sides(): number {
    return this.sideCount
  }
}

class CustomDie extends Die {
  constructor(private readonly faces: string[]) {
    super()
  }
  
  roll(): string {
    return this.faces[coreRandom(this.faces.length)]
  }
  
  get sides(): string[] {
    return [...this.faces]
  }
}
```

### Random Number Generation

Centralize random number generation:

```typescript
// ✅ Correct - Centralized random generation
export function coreRandom(max: number): number {
  return Math.floor(Math.random() * max)
}

// Use throughout the system
const dieResult = coreRandom(sides) + 1
```

### Result Type System

Use discriminated unions for results:

```typescript
// ✅ Correct - Discriminated union results
interface NumericRollResult {
  type: 'numeric'
  total: number
  rolls: NumericRollPoolResult[]
  rawResults: number[]
}

interface CustomRollResult {
  type: 'custom'
  total: string
  rolls: CustomRollPoolResult[]
  rawResults: string[]
}

type RollResult = NumericRollResult | CustomRollResult
```

## Modifier System Architecture

### Base Modifier Interface

All modifiers implement a common interface:

```typescript
// ✅ Correct - Common modifier interface
interface Modifier {
  name: string
  apply(rolls: number[], options?: ModifierOptions): ModifierResult
}

interface ModifierResult {
  rolls: number[]
  logs: ModifierLog[]
}

interface ModifierLog {
  modifier: string
  options: ModifierOptions | undefined
  added: number[]
  removed: number[]
}
```

### Modifier Implementation Pattern

Use consistent patterns for modifier implementation:

```typescript
// ✅ Correct - Modifier implementation pattern
class DropModifier implements Modifier {
  name = 'drop'
  
  apply(
    rolls: number[],
    options: DropModifierOptions = { lowest: 1 }
  ): ModifierResult {
    const sortedRolls = [...rolls].sort((a, b) => a - b)
    const toDrop = options.lowest || 1
    const removed = sortedRolls.slice(0, toDrop)
    const remaining = sortedRolls.slice(toDrop)
    
    return {
      rolls: remaining,
      logs: [{
        modifier: this.name,
        options,
        added: [],
        removed
      }]
    }
  }
}
```

### Modifier Composition

Support modifier chaining:

```typescript
// ✅ Correct - Modifier composition
function applyModifiers(
  initialRolls: number[],
  modifiers: Modifier[]
): ModifierResult {
  let currentRolls = [...initialRolls]
  const allLogs: ModifierLog[] = []
  
  for (const modifier of modifiers) {
    const result = modifier.apply(currentRolls)
    currentRolls = result.rolls
    allLogs.push(...result.logs)
  }
  
  return {
    rolls: currentRolls,
    logs: allLogs
  }
}
```

## Parameter System

### Parameter Validation

Validate parameters early and comprehensively:

```typescript
// ✅ Correct - Parameter validation
function validateRollParameters(params: RollParams): ValidationResult {
  if (params.options.quantity < 1) {
    return {
      valid: false,
      error: 'Quantity must be at least 1'
    }
  }
  
  if (params.options.sides < 1) {
    return {
      valid: false,
      error: 'Sides must be at least 1'
    }
  }
  
  return { valid: true }
}
```

### Parameter Transformation

Transform parameters consistently:

```typescript
// ✅ Correct - Parameter transformation
function createRollParameters(
  notation: string,
  parsedNotation: ParsedNotation
): RollParams {
  return {
    die: createDie(parsedNotation.sides),
    argument: parsedNotation.quantity,
    notation,
    description: [createDescription(parsedNotation)],
    options: createRollOptions(parsedNotation)
  }
}
```

## Error Handling Architecture

### Layered Error Handling

Handle errors at appropriate layers:

```typescript
// ✅ Correct - Layered error handling
export function roll(notation: string): RollResult {
  try {
    // Layer 1: Notation validation
    const validation = validateNotation(notation)
    if (!validation.valid) {
      throw new Error(`Invalid notation: ${validation.error}`)
    }
    
    // Layer 2: Parameter creation
    const parameters = createParameters(notation)
    
    // Layer 3: Roll generation
    const result = generateRoll(parameters)
    
    return result
  } catch (error) {
    // Layer 4: Error context and re-throw
    throw new Error(
      `Failed to roll "${notation}": ${error.message}`
    )
  }
}
```

### Error Recovery

Implement graceful error recovery where possible:

```typescript
// ✅ Correct - Error recovery
function generateRoll(params: RollParams): RollResult {
  try {
    return performRoll(params)
  } catch (error) {
    // Attempt recovery with default parameters
    if (canRecover(error)) {
      const defaultParams = createDefaultParameters()
      return performRoll(defaultParams)
    }
    throw error
  }
}
```

## Performance Architecture

### Lazy Evaluation

Use lazy evaluation for expensive operations:

```typescript
// ✅ Correct - Lazy evaluation
class RollResult {
  private _formattedResult?: string
  
  get formattedResult(): string {
    if (!this._formattedResult) {
      this._formattedResult = this.formatResult()
    }
    return this._formattedResult
  }
  
  private formatResult(): string {
    // Expensive formatting operation
    return this.rolls.map(r => r.toString()).join(', ')
  }
}
```

### Object Pooling

Consider object pooling for high-frequency operations:

```typescript
// ✅ Correct - Object pooling (when appropriate)
class DiePool {
  private static pool: NumericDie[] = []
  
  static getDie(sides: number): NumericDie {
    const die = this.pool.pop() || new NumericDie(sides)
    die.setSides(sides)
    return die
  }
  
  static returnDie(die: NumericDie): void {
    this.pool.push(die)
  }
}
```

## Extension Points

### Plugin Architecture

Design for extensibility:

```typescript
// ✅ Correct - Plugin architecture
interface DicePlugin {
  name: string
  modifiers?: Modifier[]
  diceTypes?: DieConstructor[]
  resultFormatters?: ResultFormatter[]
}

class DiceSystem {
  private plugins: DicePlugin[] = []
  
  registerPlugin(plugin: DicePlugin): void {
    this.plugins.push(plugin)
    this.integratePlugin(plugin)
  }
  
  private integratePlugin(plugin: DicePlugin): void {
    // Integrate plugin components
  }
}
```

### Custom Die Types

Support custom die implementations:

```typescript
// ✅ Correct - Custom die support
interface DieConstructor {
  new (config: DieConfig): Die
  supports(notation: string): boolean
}

function createDie(notation: string): Die {
  const constructor = findDieConstructor(notation)
  if (!constructor) {
    throw new Error(`Unsupported die notation: ${notation}`)
  }
  return new constructor(parseNotation(notation))
}
```

## Testing Architecture

### Test Doubles

Use appropriate test doubles:

```typescript
// ✅ Correct - Test doubles for random operations
class MockRandom {
  private sequence: number[] = []
  private index = 0
  
  setSequence(values: number[]): void {
    this.sequence = values
    this.index = 0
  }
  
  next(): number {
    if (this.index >= this.sequence.length) {
      throw new Error('Mock random sequence exhausted')
    }
    return this.sequence[this.index++]
  }
}
```

### Architecture Testing

Test architectural constraints:

```typescript
// ✅ Correct - Architecture testing
describe('architecture constraints', () => {
  test('modifiers do not mutate input', () => {
    const originalRolls = [1, 2, 3, 4]
    const modifier = new DropModifier()
    
    modifier.apply(originalRolls)
    
    expect(originalRolls).toEqual([1, 2, 3, 4])
  })
  
  test('results are immutable', () => {
    const result = roll('2d6')
    const originalTotal = result.total
    
    // Attempt to modify (should not affect original)
    ;(result as any).total = 999
    
    expect(result.total).toBe(originalTotal)
  })
})
```
