---
type: "always_apply"
description: "Design patterns and standards for the dice modifier system"
---

# Modifier System Design

## Overview

RANDSUM's modifier system provides a flexible, extensible way to apply transformations to dice rolls. The system uses a class-based architecture with consistent interfaces and comprehensive logging for transparency.

## Core Architecture

### Modifier Interface

All modifiers implement a common interface:

```typescript
// ✅ Correct - Base modifier interface
interface Modifier {
  name: string
  apply(
    rolls: number[],
    options?: ModifierOptions,
    parameters?: RollParameters
  ): ModifierResult
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

### Base Modifier Class

Use inheritance for common functionality:

```typescript
// ✅ Correct - Base modifier class
abstract class BaseModifier implements Modifier {
  abstract name: string
  
  abstract apply(
    rolls: number[],
    options?: ModifierOptions,
    parameters?: RollParameters
  ): ModifierResult
  
  protected createLog(
    options: ModifierOptions | undefined,
    added: number[] = [],
    removed: number[] = []
  ): ModifierLog {
    return {
      modifier: this.name,
      options,
      added: [...added],
      removed: [...removed]
    }
  }
  
  protected validateRolls(rolls: number[]): void {
    if (!Array.isArray(rolls)) {
      throw new Error(`${this.name} modifier requires an array of rolls`)
    }
  }
}
```

## Modifier Categories

### Arithmetic Modifiers

Handle simple mathematical operations:

```typescript
// ✅ Correct - Arithmetic modifier implementation
class PlusModifier extends BaseModifier {
  name = 'plus'
  
  apply(
    rolls: number[],
    options: { value: number } = { value: 0 }
  ): ModifierResult {
    this.validateRolls(rolls)
    
    if (typeof options.value !== 'number') {
      throw new Error('Plus modifier requires a numeric value')
    }
    
    // Don't modify individual rolls, this affects total calculation
    return {
      rolls: [...rolls], // Return unchanged rolls
      logs: [this.createLog(options)]
    }
  }
}

class MinusModifier extends BaseModifier {
  name = 'minus'
  
  apply(
    rolls: number[],
    options: { value: number } = { value: 0 }
  ): ModifierResult {
    this.validateRolls(rolls)
    
    return {
      rolls: [...rolls], // Return unchanged rolls
      logs: [this.createLog(options)]
    }
  }
}
```

### Selection Modifiers

Handle roll selection and filtering:

```typescript
// ✅ Correct - Drop modifier implementation
class DropModifier extends BaseModifier {
  name = 'drop'
  
  apply(
    rolls: number[],
    options: DropOptions = { lowest: 1 }
  ): ModifierResult {
    this.validateRolls(rolls)
    
    const sortedRolls = [...rolls].sort((a, b) => a - b)
    const { lowest = 0, highest = 0 } = options
    
    let remaining = [...sortedRolls]
    const removed: number[] = []
    
    // Drop lowest
    if (lowest > 0) {
      const droppedLowest = remaining.splice(0, Math.min(lowest, remaining.length))
      removed.push(...droppedLowest)
    }
    
    // Drop highest
    if (highest > 0) {
      const droppedHighest = remaining.splice(-Math.min(highest, remaining.length))
      removed.push(...droppedHighest)
    }
    
    return {
      rolls: remaining,
      logs: [this.createLog(options, [], removed)]
    }
  }
}
```

### Conditional Modifiers

Handle conditional rerolling and transformations:

```typescript
// ✅ Correct - Reroll modifier implementation
class RerollModifier extends BaseModifier {
  name = 'reroll'
  
  apply(
    rolls: number[],
    options: RerollOptions,
    parameters?: RollParameters
  ): ModifierResult {
    this.validateRolls(rolls)
    
    if (!options.condition) {
      throw new Error('Reroll modifier requires a condition')
    }
    
    const newRolls: number[] = []
    const removed: number[] = []
    const added: number[] = []
    
    for (const roll of rolls) {
      if (this.shouldReroll(roll, options.condition)) {
        removed.push(roll)
        const newRoll = this.generateNewRoll(parameters)
        added.push(newRoll)
        newRolls.push(newRoll)
      } else {
        newRolls.push(roll)
      }
    }
    
    return {
      rolls: newRolls,
      logs: [this.createLog(options, added, removed)]
    }
  }
  
  private shouldReroll(roll: number, condition: RerollCondition): boolean {
    if (Array.isArray(condition)) {
      return condition.includes(roll)
    }
    
    if (typeof condition === 'object') {
      if ('lessThan' in condition) {
        return roll < condition.lessThan
      }
      if ('greaterThan' in condition) {
        return roll > condition.greaterThan
      }
    }
    
    return false
  }
  
  private generateNewRoll(parameters?: RollParameters): number {
    if (!parameters?.die) {
      throw new Error('Cannot reroll without die parameters')
    }
    
    return parameters.die.roll() as number
  }
}
```

### Exploding Modifiers

Handle cascading roll mechanics:

```typescript
// ✅ Correct - Exploding dice modifier
class ExplodingModifier extends BaseModifier {
  name = 'exploding'
  
  apply(
    rolls: number[],
    options: ExplodingOptions = { on: 'max' },
    parameters?: RollParameters
  ): ModifierResult {
    this.validateRolls(rolls)
    
    if (!parameters?.die) {
      throw new Error('Exploding modifier requires die parameters')
    }
    
    const maxValue = this.getMaxValue(parameters.die)
    const explodeOn = options.on === 'max' ? maxValue : options.on
    
    const finalRolls: number[] = []
    const added: number[] = []
    
    for (const roll of rolls) {
      finalRolls.push(roll)
      
      if (this.shouldExplode(roll, explodeOn)) {
        let currentRoll = roll
        
        while (this.shouldExplode(currentRoll, explodeOn)) {
          const newRoll = parameters.die.roll() as number
          added.push(newRoll)
          finalRolls.push(newRoll)
          currentRoll = newRoll
        }
      }
    }
    
    return {
      rolls: finalRolls,
      logs: [this.createLog(options, added, [])]
    }
  }
  
  private shouldExplode(roll: number, explodeOn: number | number[]): boolean {
    if (Array.isArray(explodeOn)) {
      return explodeOn.includes(roll)
    }
    return roll === explodeOn
  }
  
  private getMaxValue(die: Die): number {
    if (typeof die.sides === 'number') {
      return die.sides
    }
    throw new Error('Cannot determine max value for custom die')
  }
}
```

## Modifier Options System

### Type-Safe Options

Define type-safe options for each modifier:

```typescript
// ✅ Correct - Type-safe modifier options
interface DropOptions {
  lowest?: number
  highest?: number
}

interface RerollOptions {
  condition: RerollCondition
  once?: boolean
}

type RerollCondition = 
  | number[]
  | { lessThan: number }
  | { greaterThan: number }
  | { equals: number }

interface ExplodingOptions {
  on: number | number[] | 'max'
  limit?: number
}

interface CappingOptions {
  min?: number
  max?: number
}
```

### Option Validation

Validate modifier options:

```typescript
// ✅ Correct - Option validation
class DropModifier extends BaseModifier {
  private validateOptions(options: DropOptions): void {
    const { lowest = 0, highest = 0 } = options
    
    if (lowest < 0 || highest < 0) {
      throw new Error('Drop counts cannot be negative')
    }
    
    if (lowest === 0 && highest === 0) {
      throw new Error('Must specify at least one drop count')
    }
  }
  
  apply(rolls: number[], options: DropOptions = { lowest: 1 }): ModifierResult {
    this.validateOptions(options)
    // ... implementation
  }
}
```

## Modifier Composition

### Modifier Chain Processing

Process modifiers in sequence:

```typescript
// ✅ Correct - Modifier chain processing
function applyModifiers(
  initialRolls: number[],
  modifiers: Array<{ modifier: Modifier, options?: ModifierOptions }>,
  parameters?: RollParameters
): ModifierResult {
  let currentRolls = [...initialRolls]
  const allLogs: ModifierLog[] = []
  
  for (const { modifier, options } of modifiers) {
    const result = modifier.apply(currentRolls, options, parameters)
    currentRolls = result.rolls
    allLogs.push(...result.logs)
  }
  
  return {
    rolls: currentRolls,
    logs: allLogs
  }
}
```

### Modifier Conflicts

Handle modifier conflicts:

```typescript
// ✅ Correct - Modifier conflict detection
function validateModifierChain(
  modifiers: Array<{ modifier: Modifier, options?: ModifierOptions }>
): void {
  const modifierNames = modifiers.map(m => m.modifier.name)
  
  // Check for conflicting modifiers
  if (modifierNames.includes('unique') && modifierNames.includes('reroll')) {
    throw new Error('Unique and reroll modifiers cannot be used together')
  }
  
  // Check for redundant modifiers
  const uniqueNames = new Set(modifierNames)
  if (uniqueNames.size !== modifierNames.length) {
    throw new Error('Duplicate modifiers are not allowed')
  }
}
```

## Logging and Transparency

### Comprehensive Logging

Log all modifier actions:

```typescript
// ✅ Correct - Comprehensive modifier logging
interface ModifierLog {
  modifier: string
  options: ModifierOptions | undefined
  added: number[]      // Rolls added by this modifier
  removed: number[]    // Rolls removed by this modifier
  before: number[]     // State before modifier (optional)
  after: number[]      // State after modifier (optional)
}

// Enhanced logging in modifiers
class DropModifier extends BaseModifier {
  apply(rolls: number[], options: DropOptions): ModifierResult {
    const before = [...rolls]
    
    // ... modifier logic ...
    
    const after = remaining
    
    return {
      rolls: after,
      logs: [{
        modifier: this.name,
        options,
        added: [],
        removed,
        before,
        after
      }]
    }
  }
}
```

### Log Analysis

Provide utilities for log analysis:

```typescript
// ✅ Correct - Log analysis utilities
export function analyzeModifierLogs(logs: ModifierLog[]): ModifierAnalysis {
  return {
    totalAdded: logs.reduce((sum, log) => sum + log.added.length, 0),
    totalRemoved: logs.reduce((sum, log) => sum + log.removed.length, 0),
    modifiersApplied: logs.map(log => log.modifier),
    netChange: logs.reduce((sum, log) => 
      sum + log.added.reduce((a, b) => a + b, 0) - log.removed.reduce((a, b) => a + b, 0), 0
    )
  }
}
```

## Testing Modifier System

### Modifier Unit Tests

Test each modifier thoroughly:

```typescript
// ✅ Correct - Modifier testing
describe('DropModifier', () => {
  let modifier: DropModifier
  
  beforeEach(() => {
    modifier = new DropModifier()
  })
  
  test('drops lowest roll', () => {
    const result = modifier.apply([1, 2, 3, 4], { lowest: 1 })
    
    expect(result.rolls).toEqual([2, 3, 4])
    expect(result.logs).toHaveLength(1)
    expect(result.logs[0].removed).toEqual([1])
    expect(result.logs[0].added).toEqual([])
  })
  
  test('handles edge cases', () => {
    const result = modifier.apply([5], { lowest: 2 })
    
    expect(result.rolls).toEqual([])
    expect(result.logs[0].removed).toEqual([5])
  })
  
  test('validates options', () => {
    expect(() => modifier.apply([1, 2], { lowest: -1 }))
      .toThrow('Drop counts cannot be negative')
  })
})
```

### Integration Testing

Test modifier combinations:

```typescript
// ✅ Correct - Modifier integration testing
describe('modifier combinations', () => {
  test('drop then reroll works correctly', () => {
    const rolls = [1, 2, 3, 4, 5, 6]
    const modifiers = [
      { modifier: new DropModifier(), options: { lowest: 2 } },
      { modifier: new RerollModifier(), options: { condition: [3] } }
    ]
    
    const result = applyModifiers(rolls, modifiers)
    
    expect(result.logs).toHaveLength(2)
    expect(result.logs[0].modifier).toBe('drop')
    expect(result.logs[1].modifier).toBe('reroll')
  })
})
```
